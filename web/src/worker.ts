import type { RouteResponse, WorkerMessage, LatLon, PointWayInfo } from './types.ts';
import init, { WasmRouter } from './pkg/rsrouter_wasm.js';
import { SEGMENT_CACHE_NAME, MIN_RD5_BYTES, fetchAndCacheSegment, isHtml } from './segment-cache.ts';

// Dedicated Web Worker running rsrouter WebAssembly off the main UI thread.
// Uses BRouter-style lazy on-demand MicroCache cell loading via disk-backed Blob.slice + FileReaderSync.

const MAX_CACHED_CELLS = 2500;

let router: WasmRouter | null = null;
let isOfflineMode = false;
const latestSlotRouteIds = new Map<number, string>();
let latestImportId: string | null = null;
let latestInspectId: string | null = null;
const loadedBuiltInProfiles = new Set<string>();
const customProfileContents = new Map<string, string>();

// Disk-backed Blob handles for 5°×5° .rd5 files (0 bytes of JS heap per file until a slice is read).
const segmentBlobs = new Map<string, Blob>();
const failedSegments = new Set<string>();
const forceMemoryBlobSegments = new Set<string>();
const fileReaderSync = new FileReaderSync();

function status(message: string) {
  postMessage({ type: 'STATUS', message } satisfies WorkerMessage);
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: 'default', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch small local text files (lookups and profiles) with offline CacheStorage fallback.
 */
async function fetchText(url: string): Promise<string> {
  const cache = await caches.open(SEGMENT_CACHE_NAME);
  if (isOfflineMode) {
    const cached = await cache.match(url);
    if (cached && !isHtml(cached)) {
      return cached.text();
    }
  }

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (res.ok && !isHtml(res)) {
      const text = await res.text();
      cache
        .put(
          url,
          new Response(text, {
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          }),
        )
        .catch(() => {});
      return text;
    }
  } catch {
    // Fall back to CacheStorage below
  }

  const cached = await cache.match(url);
  if (cached && !isHtml(cached)) {
    return cached.text();
  }
  throw new Error(`Failed to fetch ${url}`);
}

function segmentName(lon: number, lat: number): string {
  const baseLon = Math.floor(lon / 5) * 5;
  const baseLat = Math.floor(lat / 5) * 5;
  const slon = baseLon < 0 ? `W${-baseLon}` : `E${baseLon}`;
  const slat = baseLat < 0 ? `S${-baseLat}` : `N${baseLat}`;
  return `${slon}_${slat}`;
}

async function toReadableBlob(
  res: Response,
  fallbackBytes?: Uint8Array,
  forceMemory = false,
): Promise<Blob | null> {
  const clone = fallbackBytes ? null : res.clone();
  if (!forceMemory) {
    try {
      const blob = await res.blob();
      if (blob.size < MIN_RD5_BYTES) return null;
      fileReaderSync.readAsArrayBuffer(blob.slice(0, 8));
      return blob;
    } catch {
      // Fall back to in-memory Blob below if disk-backed Blob handle is unreadable via FileReaderSync
    }
  }
  if (fallbackBytes) {
    try {
      const memBlob = new Blob([fallbackBytes as BlobPart]);
      if (memBlob.size < MIN_RD5_BYTES) return null;
      fileReaderSync.readAsArrayBuffer(memBlob.slice(0, 8));
      return memBlob;
    } catch {
      return null;
    }
  }
  if (clone) {
    try {
      const ab = await clone.arrayBuffer();
      if (ab.byteLength < MIN_RD5_BYTES) return null;
      const memBlob = new Blob([ab]);
      fileReaderSync.readAsArrayBuffer(memBlob.slice(0, 8));
      return memBlob;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Opens a zero-copy disk-backed Blob reference to `/segments4/<segmentName>.rd5` in CacheStorage,
 * downloading and caching it once if not yet present. Cached segments are never deleted unless
 * corrupt (< MIN_RD5_BYTES or HTML) or manually cleared by the user.
 */
async function openSegmentBlob(
  name: string,
  required: boolean,
  onlyIfCached = false,
): Promise<boolean> {
  const existing = segmentBlobs.get(name);
  if (existing) {
    try {
      fileReaderSync.readAsArrayBuffer(existing.slice(0, 8));
      return true;
    } catch {
      segmentBlobs.delete(name);
      forceMemoryBlobSegments.add(name);
    }
  }
  if (!required && failedSegments.has(name)) {
    return false;
  }

  const key = `/segments4/${name}.rd5`;
  const cache = await caches.open(SEGMENT_CACHE_NAME);
  const cached = await cache.match(key);
  if (cached) {
    if (isHtml(cached)) {
      await cache.delete(key);
    } else {
      const headerLen = Number(cached.headers.get('content-length')) || 0;
      if (headerLen > 0 && headerLen < MIN_RD5_BYTES) {
        await cache.delete(key);
      } else {
        const blob = await toReadableBlob(cached, undefined, forceMemoryBlobSegments.has(name));
        if (blob) {
          segmentBlobs.set(name, blob);
          failedSegments.delete(name);
          return true;
        }
        // Do not delete valid cached segments on transient read errors; return without re-downloading.
        if (required) {
          throw new Error(`Cached routing segment ${name} is temporarily busy. Please retry.`);
        }
        return false;
      }
    }
  }

  if (onlyIfCached) {
    return false;
  }

  if (isOfflineMode) {
    failedSegments.add(name);
    if (required) {
      throw new Error(`Routing data ${name} is not downloaded for offline use`);
    }
    return false;
  }

  try {
    status(`Fetching ${name}.rd5...`);
    const bytes = await fetchAndCacheSegment(name, (received, total) => {
      const mb = (received / (1024 * 1024)).toFixed(1);
      const totMb = total > 0 ? (total / (1024 * 1024)).toFixed(1) : '?';
      status(`Downloading ${name}.rd5 (${mb} / ${totMb} MB)...`);
    });
    const freshCached = await cache.match(key);
    const blob =
      (freshCached
        ? await toReadableBlob(freshCached, bytes, forceMemoryBlobSegments.has(name))
        : null) ?? new Blob([bytes as BlobPart]);
    segmentBlobs.set(name, blob);
    failedSegments.delete(name);
    return true;
  } catch (err) {
    failedSegments.add(name);
    if (required) throw err;
    console.warn(`Skipping border segment ${name}:`, err);
    return false;
  }
}

/**
 * Loads WASM, lookups, and attaches the synchronous Blob.slice reader callbacks.
 * Built-in .brf profiles are loaded lazily on first use via `ensureProfileLoaded`.
 */
async function ensureRouter(): Promise<WasmRouter> {
  if (router) return router;

  status('Initializing WebAssembly engine...');
  await init();
  const r = new WasmRouter();
  loadedBuiltInProfiles.clear();

  r.set_segment_reader(
    (name: string): number => {
      const blob = segmentBlobs.get(name);
      return blob ? blob.size : 0;
    },
    (name: string, start: number, end: number): Uint8Array => {
      const blob = segmentBlobs.get(name);
      if (!blob) return new Uint8Array(0);
      try {
        const buf = fileReaderSync.readAsArrayBuffer(blob.slice(start, end));
        return new Uint8Array(buf);
      } catch (err) {
        segmentBlobs.delete(name);
        forceMemoryBlobSegments.add(name);
        throw err;
      }
    },
  );

  status('Loading lookups dictionary...');
  r.load_lookups(await fetchText('/profiles/lookups.dat'));

  for (const [name, content] of customProfileContents.entries()) {
    try {
      r.load_profile(name, content);
    } catch {
      // ignore invalid custom profile during fresh re-init
    }
  }

  router = r;
  return r;
}

/**
 * Lazily fetches and compiles a built-in `.brf` profile on first request.
 */
async function ensureProfileLoaded(r: WasmRouter, profile: string): Promise<void> {
  if (profile.startsWith('custom:')) {
    const content = customProfileContents.get(profile);
    if (!content) {
      throw new Error(`Custom profile "${profile}" is not loaded`);
    }
    return;
  }
  if (loadedBuiltInProfiles.has(profile)) return;
  status(`Loading profile ${profile}...`);
  const text = await fetchText(`/profiles/${profile}.brf`);
  r.load_profile(profile, text);
  loadedBuiltInProfiles.add(profile);
}

/**
 * Executes an operation on `WasmRouter` with lazy on-demand cell loading. If the search touches
 * a 5°×5° segment boundary whose Blob has not been opened yet, opens the missing segment Blob(s)
 * and re-runs the operation. Also self-heals on stale Blob handles or WASM traps.
 */
async function runWithLazySegments<T>(
  initialPoints: LatLon[],
  profile: string,
  op: (r: WasmRouter) => T,
): Promise<T> {
  let r = await ensureRouter();
  await ensureProfileLoaded(r, profile);
  if (r.loaded_cell_count() > MAX_CACHED_CELLS) {
    r.clear_graph();
  }

  const requiredSegments = new Set(initialPoints.map((w) => segmentName(w.lon, w.lat)));
  for (const seg of requiredSegments) {
    await openSegmentBlob(seg, true);
  }

  const nearbySegments = new Set<string>();
  for (const w of initialPoints) {
    for (const dLon of [-0.15, 0, 0.15]) {
      for (const dLat of [-0.15, 0, 0.15]) {
        const seg = segmentName(w.lon + dLon, w.lat + dLat);
        if (!requiredSegments.has(seg)) {
          nearbySegments.add(seg);
        }
      }
    }
  }
  for (const seg of nearbySegments) {
    await openSegmentBlob(seg, false, true);
  }

  r.take_missing_segments();
  let retriedCleanGraph = r.loaded_cell_count() === 0;
  let retriedFreshRouter = false;

  while (true) {
    let result: T | undefined;
    let opErr: unknown = null;
    try {
      result = op(r);
    } catch (err) {
      opErr = err;
      const msg = String(err);
      if (
        msg.includes('unreachable') ||
        msg.includes('out of bounds') ||
        msg.includes('recursive use of an object')
      ) {
        router = null;
        if (!retriedFreshRouter) {
          retriedFreshRouter = true;
          retriedCleanGraph = true;
          r = await ensureRouter();
          await ensureProfileLoaded(r, profile);
          continue;
        }
        throw err;
      }
    }

    const missing = r.take_missing_segments();
    let openedAny = false;
    for (const seg of missing) {
      if (await openSegmentBlob(seg, false)) {
        openedAny = true;
      }
    }

    if (openedAny) {
      r.clear_graph();
      retriedCleanGraph = true;
      continue;
    }
    if (opErr !== null) {
      if (!retriedCleanGraph) {
        retriedCleanGraph = true;
        r.clear_graph();
        continue;
      }
      throw opErr;
    }
    return result as T;
  }
}

function extractGpxTrackPoints(gpxXml: string): LatLon[] {
  for (const tag of ['trkpt', 'rtept', 'wpt']) {
    const pts: LatLon[] = [];
    const tagRe = new RegExp(`<${tag}\\s+([^>]+)>`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(gpxXml)) !== null) {
      const attrs = m[1];
      const latMatch = /lat\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const lonMatch = /lon\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (latMatch && lonMatch) {
        const lat = Number(latMatch[1]);
        const lon = Number(lonMatch[1]);
        if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          pts.push({ lat, lon });
        }
      }
    }
    if (pts.length >= 2) return pts;
  }
  return [];
}

async function handleMessage(msg: WorkerMessage): Promise<void> {
  switch (msg.type) {
    case 'INIT': {
      status('Router ready. Click on the map to set waypoints.');
      break;
    }

    case 'LOAD_CUSTOM_PROFILE': {
      try {
        customProfileContents.set(msg.name, msg.content);
        if (router || msg.id) {
          const r = await ensureRouter();
          r.load_profile(msg.name, msg.content);
        }
        postMessage({
          type: 'CUSTOM_PROFILE_LOADED',
          id: msg.id,
          name: msg.name,
          ok: true,
        } satisfies WorkerMessage);
      } catch (err) {
        postMessage({
          type: 'CUSTOM_PROFILE_LOADED',
          id: msg.id,
          name: msg.name,
          ok: false,
          error: String(err),
        } satisfies WorkerMessage);
      }
      break;
    }

    case 'ROUTE_REQUEST': {
      const slotIdx = msg.slotIdx ?? 0;
      if (latestSlotRouteIds.get(slotIdx) !== msg.id) return;
      try {
        const { waypoints, profile, alternativeIdx, nogos } = msg.payload;
        const waypointsStr = waypoints.map((w) => `${w.lon},${w.lat}`).join('|');
        const nogosStr =
          nogos && nogos.length > 0
            ? nogos
                .map(
                  (n) =>
                    `${n.lon},${n.lat},${n.radius}${n.weight !== undefined ? ',' + n.weight : ''}`,
                )
                .join('|')
            : undefined;

        status(`Calculating route (${waypoints.length} points, ${profile})...`);
        const geojsonStr = await runWithLazySegments(waypoints, profile, (r) =>
          r.route(waypointsStr, profile, alternativeIdx ?? 0, nogosStr),
        );
        if (latestSlotRouteIds.get(slotIdx) !== msg.id) return;

        const response: RouteResponse = JSON.parse(geojsonStr);
        postMessage({
          type: 'ROUTE_SUCCESS',
          id: msg.id,
          slotIdx,
          payload: response,
        } satisfies WorkerMessage);
      } catch (err) {
        postMessage({
          type: 'ROUTE_ERROR',
          id: msg.id,
          slotIdx,
          error: String(err),
        } satisfies WorkerMessage);
      }
      break;
    }

    case 'IMPORT_GPX_REQUEST': {
      if (msg.id !== latestImportId) return;
      try {
        const { gpxXml, profile, toleranceM } = msg.payload;
        const trackPoints = extractGpxTrackPoints(gpxXml);
        if (trackPoints.length < 2) {
          throw new Error('GPX document must contain at least 2 valid track, route, or waypoint coordinates.');
        }

        status(`Matching GPX track (${trackPoints.length} points, ${profile})...`);
        const rawJson = await runWithLazySegments(trackPoints, profile, (r) =>
          r.match_gpx_waypoints(gpxXml, profile, toleranceM ?? 20.0),
        );
        if (msg.id !== latestImportId) return;

        const parsed = JSON.parse(rawJson) as { waypoints: LatLon[]; route: RouteResponse };
        postMessage({
          type: 'IMPORT_GPX_SUCCESS',
          id: msg.id,
          payload: parsed,
        } satisfies WorkerMessage);
      } catch (err) {
        postMessage({ type: 'ROUTE_ERROR', id: msg.id, error: String(err) } satisfies WorkerMessage);
      }
      break;
    }

    case 'INSPECT_POINT_REQUEST': {
      if (msg.id !== latestInspectId) return;
      try {
        const seg = segmentName(msg.lon, msg.lat);
        const hasSeg = await openSegmentBlob(seg, false, true);
        if (!hasSeg || msg.id !== latestInspectId) {
          postMessage({
            type: 'INSPECT_POINT_SUCCESS',
            id: msg.id,
            payload: null,
          } satisfies WorkerMessage);
          break;
        }
        const r = await ensureRouter();
        if (msg.id !== latestInspectId) return;
        const rawJson = r.inspect_point(msg.lon, msg.lat, msg.maxDistanceM ?? 45.0);
        const parsed = JSON.parse(rawJson) as PointWayInfo | null;
        postMessage({
          type: 'INSPECT_POINT_SUCCESS',
          id: msg.id,
          payload: parsed,
        } satisfies WorkerMessage);
      } catch {
        postMessage({
          type: 'INSPECT_POINT_SUCCESS',
          id: msg.id,
          payload: null,
        } satisfies WorkerMessage);
      }
      break;
    }

    case 'CLEAR_GRAPH': {
      try {
        router?.clear_graph();
      } catch {
        router = null;
      }
      segmentBlobs.clear();
      failedSegments.clear();
      forceMemoryBlobSegments.clear();
      break;
    }
  }
}

let queue: Promise<void> = Promise.resolve();

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  if (msg.type === 'SET_OFFLINE_MODE') {
    if (isOfflineMode !== msg.offline) {
      failedSegments.clear();
    }
    isOfflineMode = msg.offline;
    return;
  }
  if (msg.type === 'ROUTE_REQUEST') {
    latestSlotRouteIds.set(msg.slotIdx ?? 0, msg.id);
  } else if (msg.type === 'IMPORT_GPX_REQUEST') {
    latestImportId = msg.id;
    latestSlotRouteIds.clear();
  } else if (msg.type === 'INSPECT_POINT_REQUEST') {
    latestInspectId = msg.id;
  }
  queue = queue
    .then(() => handleMessage(msg))
    .catch((err) => {
      console.error('Worker queue error:', err);
    });
};

