import maplibregl from 'maplibre-gl';
import mlcontour from 'maplibre-contour';
import type { Basemap } from '../basemap.ts';
import { OSM_BRIGHT_LAYERS } from './osm-bright-style.ts';

let demSourceInstance: InstanceType<typeof mlcontour.DemSource> | null =
  typeof window !== 'undefined' ? (window as any).__rsrouterDemSource || null : null;

export function getDemSource(): InstanceType<typeof mlcontour.DemSource> {
  if (!demSourceInstance) {
    demSourceInstance = new mlcontour.DemSource({
      url: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
      encoding: 'terrarium',
      maxzoom: 12,
      worker: true,
      cacheSize: 100,
    });
    demSourceInstance.setupMaplibre(maplibregl as any);
    if (typeof window !== 'undefined') {
      (window as any).__rsrouterDemSource = demSourceInstance;
    }
  }
  return demSourceInstance;
}

export const FONT_BASE_URL = 'https://tiles.openfreemap.org/fonts/';
export const FONT_NAMES = ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic'];
// Basic Latin plus Latin-1 and Latin Extended-A, which covers Welsh (ŵ, ŷ) and Irish names.
export const FONT_RANGES = ['0-255', '256-511'];

export const ROUTING_FILES = [
  '/profiles/lookups.dat',
  '/profiles/gabis-fast-city.brf',
  '/profiles/gabis-lite-gravel.brf',
  '/profiles/gabis-safe-road.brf',
  '/sprites/ofm.json',
  '/sprites/ofm.png',
  '/sprites/ofm@2x.json',
  '/sprites/ofm@2x.png',
];

export const UK_CENTER: [number, number] = [-4.5, 54.5];
export const UK_BOUNDS: [[number, number], [number, number]] = [
  [-15.0, 49.0], // Southwest: west of Ireland, Scilly
  [4.0, 61.5], // Northeast: Shetland, East Anglia
];

function getSpriteBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/sprites/ofm`;
  }
  return 'https://router.surita.dev/sprites/ofm';
}

function buildCycleRouteHighlightLayers(): any[] {
  const specs: Array<{
    id: string;
    minzoom: number;
    filter: any[];
    haloColor: any;
    coreColor: any;
    haloWidth: any[];
    coreWidth: any[];
    dashed?: boolean;
  }> = [
    // MTB route relations - gold-olive (distinct from orange route slot)
    {
      id: 'ocm-route-mtb',
      minzoom: 8,
      filter: ['==', ['get', 'network'], 'mtb'],
      haloColor: '#fde047',
      coreColor: ['interpolate', ['linear'], ['zoom'], 8, '#a16207', 12, '#ca8a04', 16, '#eab308'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 8, 1.0, 10, 1.4, 12, 2.6, 13, 6.5, 14, 13.5, 15, 20.0, 16, 27.0, 18, 38.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 8, 0.7, 10, 0.9, 12, 1.3, 13, 1.8, 14, 2.5, 16, 3.6, 18, 5.0],
    },
    // LCN (Local Cycle Network) - lighter purple core with clear lilac halo
    {
      id: 'ocm-route-lcn',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'network'], 'lcn'], ['!=', ['get', 'state'], 'proposed']],
      haloColor: '#d8b4fe',
      coreColor: ['interpolate', ['linear'], ['zoom'], 8, '#9333ea', 12, '#a855f7', 16, '#b469ff'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 8, 1.0, 10, 1.5, 12, 2.8, 13, 7.0, 14, 14.5, 15, 21.5, 16, 28.5, 18, 40.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 8, 0.7, 10, 0.95, 12, 1.4, 13, 1.9, 14, 2.6, 16, 3.8, 18, 5.4],
    },
    {
      id: 'ocm-route-lcn-proposed',
      minzoom: 9,
      filter: ['all', ['==', ['get', 'network'], 'lcn'], ['==', ['get', 'state'], 'proposed']],
      haloColor: '#e2c6ff',
      coreColor: ['interpolate', ['linear'], ['zoom'], 9, '#9333ea', 12, '#a855f7', 16, '#b469ff'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 9, 1.1, 12, 2.5, 13, 6.2, 14, 13.0, 15, 19.5, 16, 26.0, 18, 36.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 9, 0.7, 12, 1.3, 13, 1.8, 14, 2.4, 16, 3.5, 18, 5.0],
      dashed: true,
    },
    // RCN (Regional Cycle Network) - dark royal purple core with medium violet halo
    {
      id: 'ocm-route-rcn',
      minzoom: 7,
      filter: ['all', ['==', ['get', 'network'], 'rcn'], ['!=', ['get', 'state'], 'proposed']],
      haloColor: '#b983f8',
      coreColor: ['interpolate', ['linear'], ['zoom'], 7, '#581c87', 12, '#6b21a8', 16, '#7e22ce'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 7, 1.0, 9, 1.4, 11, 2.0, 12, 3.0, 13, 7.5, 14, 15.2, 15, 22.5, 16, 30.0, 18, 42.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 7, 0.75, 10, 1.0, 12, 1.5, 13, 2.0, 14, 2.8, 16, 4.0, 18, 5.6],
    },
    {
      id: 'ocm-route-rcn-proposed',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'network'], 'rcn'], ['==', ['get', 'state'], 'proposed']],
      haloColor: '#c99df9',
      coreColor: ['interpolate', ['linear'], ['zoom'], 8, '#581c87', 12, '#6b21a8', 16, '#7e22ce'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 8, 1.0, 10, 1.4, 12, 2.7, 13, 6.8, 14, 14.0, 15, 20.5, 16, 27.5, 18, 38.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 8, 0.7, 10, 0.95, 12, 1.4, 13, 1.9, 14, 2.6, 16, 3.7, 18, 5.2],
      dashed: true,
    },
    // NCN & ICN (National & International Cycle Network) - warm orangy-red core with salmon halo
    {
      id: 'ocm-route-ncn',
      minzoom: 5,
      filter: [
        'all',
        ['match', ['get', 'network'], ['ncn', 'icn'], true, false],
        ['!=', ['get', 'state'], 'proposed'],
      ],
      haloColor: '#fb9278',
      coreColor: ['interpolate', ['linear'], ['zoom'], 5, '#c82312', 12, '#dc2c18', 14, '#ef4423', 16, '#f25435'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 5, 0.9, 7, 1.2, 9, 1.6, 11, 2.2, 12, 3.4, 13, 8.0, 14, 16.0, 15, 23.5, 16, 31.5, 18, 44.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 5, 0.65, 8, 0.9, 11, 1.25, 12, 1.6, 13, 2.2, 15, 3.5, 18, 5.8],
    },
    {
      id: 'ocm-route-ncn-proposed',
      minzoom: 7,
      filter: [
        'all',
        ['match', ['get', 'network'], ['ncn', 'icn'], true, false],
        ['==', ['get', 'state'], 'proposed'],
      ],
      haloColor: '#fca590',
      coreColor: ['interpolate', ['linear'], ['zoom'], 7, '#c82312', 12, '#dc2c18', 14, '#ef4423', 16, '#f25435'],
      haloWidth: ['interpolate', ['exponential', 1.45], ['zoom'], 7, 1.0, 9, 1.4, 12, 3.0, 13, 7.2, 14, 14.8, 15, 21.5, 16, 29.0, 18, 40.0],
      coreWidth: ['interpolate', ['exponential', 1.3], ['zoom'], 7, 0.7, 10, 0.95, 12, 1.4, 13, 1.9, 14, 2.6, 16, 3.8, 18, 5.5],
      dashed: true,
    },
  ];

  // Both halo and core use 'line-opacity': 1 and 'line-cap': 'round' so there are zero
  // vertex starbursts or butt-cap steps, and the solid pastel halo stays clearly visible around planned routes.
  const haloLayers = specs.map((s) => ({
    id: s.id,
    type: 'line',
    source: 'cycle_routes',
    'source-layer': 'cycle_routes',
    minzoom: s.minzoom,
    filter: s.filter,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': s.haloColor,
      'line-width': s.haloWidth,
      'line-opacity': 1,
    },
  }));

  const coreLayers = specs.map((s) => ({
    id: `${s.id}-core`,
    type: 'line',
    source: 'cycle_routes',
    'source-layer': 'cycle_routes',
    minzoom: s.minzoom,
    filter: s.filter,
    layout: { 'line-cap': s.dashed ? 'butt' : 'round', 'line-join': 'round' },
    paint: {
      'line-color': s.coreColor,
      'line-width': s.coreWidth,
      'line-opacity': 1,
      ...(s.dashed ? { 'line-dasharray': [2.2, 1.8] } : {}),
    },
  }));

  return [...haloLayers, ...coreLayers];
}

const CYCLE_SHIELD_COLORS: Record<string, string> = {
  'cycle-shield-ncn': '#a81c0c',
  'cycle-shield-rcn': '#4c1d95',
  'cycle-shield-lcn': '#7e22ce',
  'cycle-shield-mtb': '#854d0e',
  'cycle-shield-proposed': '#334155',
};

function createShieldImageData(hexColor: string): {
  width: number;
  height: number;
  data: Uint8Array;
} {
  const width = 18;
  const height = 14;
  const radius = 4.5;
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const dx = Math.max(radius - px, 0, px - (width - radius));
      const dy = Math.max(radius - py, 0, py - (height - radius));
      const dist = Math.hypot(dx, dy) - radius;
      const alpha = Math.max(0, Math.min(1, 0.5 - dist));
      if (alpha > 0) {
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.round(alpha * 255);
      }
    }
  }
  return { width, height, data };
}

export function registerCycleShieldImages(map: maplibregl.Map): void {
  for (const [id, color] of Object.entries(CYCLE_SHIELD_COLORS)) {
    if (map.hasImage(id)) {
      map.removeImage(id);
    }
    const img = createShieldImageData(color);
    map.addImage(id, img, {
      pixelRatio: 2,
      stretchX: [[5, 13]],
      stretchY: [[5, 9]],
      content: [3, 2, 15, 12],
    });
  }

  for (const [id, img] of Object.entries(createSceneryPatternImages())) {
    if (map.hasImage(id)) {
      map.removeImage(id);
    }
    map.addImage(id, img, { pixelRatio: 2 });
  }
}

function setSoftDisc(
  data: Uint8Array,
  size: number,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  maxAlpha: number,
): void {
  const minX = Math.max(0, Math.floor(cx - radius - 1));
  const maxX = Math.min(size - 1, Math.ceil(cx + radius + 1));
  const minY = Math.max(0, Math.floor(cy - radius - 1));
  const maxY = Math.min(size - 1, Math.ceil(cy + radius + 1));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const t = Math.max(0, Math.min(1, radius + 0.5 - dist));
      if (t > 0) {
        const idx = (y * size + x) * 4;
        const a = Math.round(t * maxAlpha);
        if (a > data[idx + 3]) {
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }
}

function createSceneryPatternImages(): Record<
  string,
  { width: number; height: number; data: Uint8Array }
> {
  // 1. Sand & beach stipple grains (32x32 @ 2x = 16x16 CSS px)
  const sandSize = 32;
  const sandData = new Uint8Array(sandSize * sandSize * 4);
  const sandGrains: [number, number, number][] = [
    [5, 6, 1.25],
    [15, 4, 1.05],
    [26, 8, 1.3],
    [10, 14, 1.15],
    [21, 15, 1.25],
    [4, 23, 1.1],
    [14, 25, 1.3],
    [27, 22, 1.15],
    [9, 30, 1.05],
    [22, 29, 1.2],
  ];
  for (const [gx, gy, gr] of sandGrains) {
    setSoftDisc(sandData, sandSize, gx, gy, gr, 148, 98, 30, 115);
  }

  // 3. Orchard & vineyard neat rows (32x32 @ 2x = 16x16 CSS px)
  const orchardSize = 32;
  const orchardData = new Uint8Array(orchardSize * orchardSize * 4);
  for (const [ox, oy] of [
    [8, 8],
    [24, 8],
    [16, 24],
    [0, 24],
    [32, 24],
  ]) {
    setSoftDisc(orchardData, orchardSize, ox, oy, 2.4, 52, 98, 20, 96);
  }

  // 4. Scrub / heath low bush tufts (40x40 @ 2x = 20x20 CSS px)
  const scrubSize = 40;
  const scrubData = new Uint8Array(scrubSize * scrubSize * 4);
  for (const [sx, sy] of [
    [10, 12],
    [30, 32],
  ]) {
    setSoftDisc(scrubData, scrubSize, sx - 2.2, sy, 1.5, 70, 96, 36, 90);
    setSoftDisc(scrubData, scrubSize, sx, sy - 1.3, 1.7, 70, 96, 36, 95);
    setSoftDisc(scrubData, scrubSize, sx + 2.2, sy, 1.5, 70, 96, 36, 90);
  }

  // 5. Wetland / marsh horizontal water dashes & reed tufts (48x48 @ 2x = 24x24 CSS px)
  const wetlandSize = 48;
  const wetlandData = new Uint8Array(wetlandSize * wetlandSize * 4);
  for (const [wx, wy] of [
    [12, 16],
    [36, 40],
  ]) {
    // Horizontal marsh water lines
    for (let dx = -6; dx <= 6; dx++) {
      const idx1 = (wy * wetlandSize + ((wx + dx + wetlandSize) % wetlandSize)) * 4;
      wetlandData[idx1] = 20;
      wetlandData[idx1 + 1] = 118;
      wetlandData[idx1 + 2] = 110;
      wetlandData[idx1 + 3] = 95;
    }
    for (let dx = -4; dx <= 4; dx++) {
      const idx2 = (((wy + 2) % wetlandSize) * wetlandSize + ((wx + dx + wetlandSize) % wetlandSize)) * 4;
      wetlandData[idx2] = 20;
      wetlandData[idx2 + 1] = 118;
      wetlandData[idx2 + 2] = 110;
      wetlandData[idx2 + 3] = 75;
    }
    // Vertical reed stalks
    for (let dy = -5; dy <= -1; dy++) {
      for (const rx of [wx - 2, wx, wx + 2]) {
        const idxR = (((wy + dy + wetlandSize) % wetlandSize) * wetlandSize + rx) * 4;
        wetlandData[idxR] = 22;
        wetlandData[idxR + 1] = 108;
        wetlandData[idxR + 2] = 92;
        wetlandData[idxR + 3] = 95;
      }
    }
  }

  return {
    'scenery-pattern-sand': { width: sandSize, height: sandSize, data: sandData },
    'scenery-pattern-orchard': { width: orchardSize, height: orchardSize, data: orchardData },
    'scenery-pattern-scrub': { width: scrubSize, height: scrubSize, data: scrubData },
    'scenery-pattern-wetland': { width: wetlandSize, height: wetlandSize, data: wetlandData },
  };
}

function buildCycleRouteLabelLayers(): any[] {
  const makeShieldLayer = (
    id: string,
    minzoom: number,
    filter: any[],
    shieldImage: string,
  ) => ({
    id,
    type: 'symbol',
    source: 'cycle_routes',
    'source-layer': 'cycle_routes',
    minzoom,
    filter,
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 7, 130, 10, 165, 13, 200, 16, 240],
      'icon-image': shieldImage,
      'icon-rotation-alignment': 'viewport',
      'icon-text-fit': 'both',
      'icon-text-fit-padding': [0.5, 2.5, 0.5, 2.5],
      'text-field': ['get', 'ref'],
      'text-font': ['Noto Sans Regular'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7,
        6.5,
        9,
        7.2,
        11,
        8.5,
        13,
        10.2,
        16,
        12.0,
      ],
      'text-rotation-alignment': 'viewport',
      'text-keep-upright': true,
      'text-letter-spacing': 0.02,
    },
    paint: {
      'text-color': '#ffffff',
    },
  });

  return [
    makeShieldLayer(
      'ocm-route-label-proposed',
      11,
      ['all', ['==', ['get', 'state'], 'proposed'], ['has', 'ref']],
      'cycle-shield-proposed',
    ),
    makeShieldLayer(
      'ocm-route-label-mtb',
      11,
      ['all', ['==', ['get', 'network'], 'mtb'], ['!=', ['get', 'state'], 'proposed'], ['has', 'ref']],
      'cycle-shield-mtb',
    ),
    makeShieldLayer(
      'ocm-route-label-lcn',
      11,
      ['all', ['==', ['get', 'network'], 'lcn'], ['!=', ['get', 'state'], 'proposed'], ['has', 'ref']],
      'cycle-shield-lcn',
    ),
    makeShieldLayer(
      'ocm-route-label-rcn',
      10.5,
      ['all', ['==', ['get', 'network'], 'rcn'], ['!=', ['get', 'state'], 'proposed'], ['has', 'ref']],
      'cycle-shield-rcn',
    ),
    makeShieldLayer(
      'ocm-route-label-ncn',
      10,
      [
        'all',
        ['in', ['get', 'network'], ['literal', ['ncn', 'icn']]],
        ['!=', ['get', 'state'], 'proposed'],
        ['has', 'ref'],
      ],
      'cycle-shield-ncn',
    ),
  ];
}

export function getOfflineStyle(basemap: Basemap = 'dense'): maplibregl.StyleSpecification {
  if (basemap === 'dense') {
    return getDenseVectorStyle(true);
  }
  return getOpenCycleMapVectorStyle(true);
}

function buildSceneryLandcoverLayers(isLight: boolean): any[] {
  const layers: any[] = [
    {
      id: 'dense-landcover-farmland',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: [
        'all',
        ['==', ['get', 'class'], 'farmland'],
        ['!', ['match', ['get', 'subclass'], ['orchard', 'vineyard', 'plant_nursery'], true, false]],
      ],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight
          ? '#f0e4bc'
          : ['interpolate', ['linear'], ['zoom'], 6, '#e3ce8c', 10, '#e7d59a', 13, '#eadba8'],
        'fill-opacity': isLight
          ? 0.58
          : ['interpolate', ['linear'], ['zoom'], 6, 0.88, 10, 0.82, 13, 0.75],
        'fill-outline-color': isLight ? 'rgba(180, 154, 96, 0.25)' : 'rgba(162, 134, 76, 0.35)',
      },
    },
    {
      id: 'dense-landcover-orchard',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: [
        'all',
        ['==', ['get', 'class'], 'farmland'],
        ['match', ['get', 'subclass'], ['orchard', 'vineyard', 'plant_nursery'], true, false],
      ],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight ? '#d8eab8' : '#cde3a4',
        'fill-opacity': isLight ? 0.62 : 0.8,
      },
    },
    {
      id: 'dense-landcover-heath-moor',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: [
        'all',
        ['==', ['get', 'class'], 'grass'],
        ['match', ['get', 'subclass'], ['heath', 'moor', 'fell', 'tundra'], true, false],
      ],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight
          ? '#e3d2c6'
          : ['interpolate', ['linear'], ['zoom'], 6, '#cfb49d', 10, '#d5bcab', 13, '#d9c3b4'],
        'fill-opacity': isLight
          ? 0.65
          : ['interpolate', ['linear'], ['zoom'], 6, 0.88, 10, 0.85, 13, 0.82],
      },
    },
    {
      id: 'dense-landcover-scrub',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: ['all', ['==', ['get', 'class'], 'grass'], ['==', ['get', 'subclass'], 'scrub']],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight ? '#c8e2b0' : '#b2d694',
        'fill-opacity': isLight ? 0.6 : 0.82,
      },
    },
  ];

  if (!isLight) {
    layers.push(
      {
        id: 'dense-landcover-orchard-pattern',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        minzoom: 11,
        filter: [
          'all',
          ['==', ['get', 'class'], 'farmland'],
          ['match', ['get', 'subclass'], ['orchard', 'vineyard', 'plant_nursery'], true, false],
        ],
        paint: {
          'fill-pattern': 'scenery-pattern-orchard',
          'fill-opacity': 0.75,
        },
      },
      {
        id: 'dense-landcover-scrub-pattern',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        minzoom: 11,
        filter: [
          'all',
          ['==', ['get', 'class'], 'grass'],
          ['match', ['get', 'subclass'], ['scrub', 'heath', 'moor'], true, false],
        ],
        paint: {
          'fill-pattern': 'scenery-pattern-scrub',
          'fill-opacity': 0.68,
        },
      },
    );
  }

  layers.push(
    {
      id: 'dense-landcover-sand',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: ['==', ['get', 'class'], 'sand'],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight ? '#f7da94' : '#f4cf7d',
        'fill-opacity': isLight ? 0.8 : 0.9,
        'fill-outline-color': isLight ? 'rgba(196, 150, 62, 0.32)' : 'rgba(180, 132, 48, 0.42)',
      },
    },
    {
      id: 'dense-landcover-sand-pattern',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 10,
      filter: ['==', ['get', 'class'], 'sand'],
      paint: {
        'fill-pattern': 'scenery-pattern-sand',
        'fill-opacity': isLight ? 0.6 : 0.8,
      },
    },
    {
      id: 'dense-landcover-wetland',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: ['==', ['get', 'class'], 'wetland'],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight ? 'hsla(168, 44%, 74%, 0.42)' : 'hsla(168, 46%, 70%, 0.58)',
      },
    },
    {
      id: 'dense-landcover-wetland-pattern',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 10,
      filter: ['==', ['get', 'class'], 'wetland'],
      paint: {
        'fill-pattern': 'scenery-pattern-wetland',
        'fill-opacity': isLight ? 0.55 : 0.72,
      },
    },
    {
      id: 'dense-landcover-rock',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 0,
      filter: ['==', ['get', 'class'], 'rock'],
      paint: {
        'fill-antialias': true,
        'fill-color': isLight ? '#dcd8d0' : '#d1ccc3',
        'fill-opacity': isLight ? 0.65 : 0.82,
        'fill-outline-color': isLight ? 'rgba(120, 113, 108, 0.24)' : 'rgba(100, 94, 88, 0.34)',
      },
    },
  );

  return layers;
}

function buildParkForestLabelLayer(isLight: boolean): any {
  return {
    id: 'dense-park-label',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'park',
    minzoom: isLight ? 11.5 : 7.5,
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['has', 'name'],
      isLight
        ? [
            'step',
            ['zoom'],
            ['<=', ['coalesce', ['get', 'rank'], 99], 1],
            12,
            ['<=', ['coalesce', ['get', 'rank'], 99], 2],
            13.5,
            ['<=', ['coalesce', ['get', 'rank'], 99], 4],
            15,
            true,
          ]
        : [
            'step',
            ['zoom'],
            ['<=', ['coalesce', ['get', 'rank'], 99], 1],
            9,
            ['<=', ['coalesce', ['get', 'rank'], 99], 2],
            11,
            ['<=', ['coalesce', ['get', 'rank'], 99], 3],
            13,
            ['<=', ['coalesce', ['get', 'rank'], 99], 5],
            14.5,
            true,
          ],
    ],
    layout: {
      'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
      'text-font': ['Noto Sans Italic'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 7.5, 9.5, 10.5, 10.5, 14, 12],
      'text-max-width': 8,
      'text-padding': isLight ? 48 : 28,
    },
    paint: {
      'text-color': isLight ? '#2f6f44' : '#166534',
      'text-opacity': isLight ? 0.82 : 0.92,
      'text-halo-color': 'rgba(255, 255, 255, 0.88)',
      'text-halo-width': 1.3,
    },
  };
}

export function getDenseVectorStyle(offline = false): maplibregl.StyleSpecification {
  const style = getOpenCycleMapVectorStyle(false);
  const layers = style.layers as any[];

  // 1. Separate tracks from paved minor roads and tune trail/road/place label zooms
  for (const layer of layers) {
    if (
      layer.id === 'highway-minor-casing' ||
      layer.id === 'highway-minor' ||
      layer.id === 'bridge-minor-casing' ||
      layer.id === 'bridge-minor'
    ) {
      // Exclude unpaved farm/forest tracks ('track') from solid white paved road rendering
      layer.filter = [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        layer.id.startsWith('bridge-')
          ? ['==', ['get', 'brunnel'], 'bridge']
          : ['!=', ['get', 'brunnel'], 'tunnel'],
        ['match', ['get', 'class'], ['minor', 'service'], true, false],
      ];
    } else if (layer.id === 'highway-path' && layer.paint) {
      layer.minzoom = 10.5;
      layer.paint['line-color'] = '#64748b';
      layer.paint['line-dasharray'] = [4.5, 0.8];
      layer.paint['line-width'] = [
        'interpolate',
        ['exponential', 1.25],
        ['zoom'],
        10.5,
        0.65,
        12.5,
        0.9,
        15,
        1.35,
        18,
        2.6,
      ];
    } else if (layer.id === 'landuse-residential' && layer.paint) {
      layer.paint['fill-antialias'] = true;
      layer.paint['fill-color'] = [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        '#e6dacb',
        10,
        '#ece2d6',
        14,
        '#f2ebe2',
      ];
      layer.paint['fill-opacity'] = [
        'interpolate',
        ['linear'],
        ['zoom'],
        6,
        0.72,
        10,
        0.62,
        14,
        0.45,
      ];
      layer.paint['fill-outline-color'] = 'rgba(172, 152, 130, 0.28)';
    } else if (layer.id === 'waterway-river' && layer.paint) {
      layer.minzoom = 6;
      layer.paint['line-color'] = '#64a6e3';
      layer.paint['line-width'] = [
        'interpolate',
        ['exponential', 1.3],
        ['zoom'],
        6,
        0.65,
        8,
        1.15,
        10,
        1.75,
        13,
        2.8,
        16,
        4.5,
        20,
        7.5,
      ];
    } else if (layer.id === 'waterway-stream-canal' && layer.paint) {
      layer.minzoom = 9.5;
      layer.paint['line-color'] = '#74b2e8';
      layer.paint['line-width'] = [
        'interpolate',
        ['exponential', 1.3],
        ['zoom'],
        9.5,
        0.5,
        12,
        0.95,
        15,
        1.8,
        20,
        5.5,
      ];
    } else if (layer.id === 'waterway_line_label') {
      layer.minzoom = 9;
      if (layer.layout) {
        layer.layout['text-size'] = ['interpolate', ['linear'], ['zoom'], 9, 10.5, 13, 13.5];
      }
      if (layer.paint) {
        layer.paint['text-color'] = '#3b78bd';
        layer.paint['text-halo-color'] = 'rgba(255, 255, 255, 0.82)';
      }
    } else if (layer.id === 'railway' && layer.paint) {
      layer.minzoom = 8.5;
      layer.paint['line-color'] = '#7c8594';
      layer.paint['line-opacity'] = ['interpolate', ['linear'], ['zoom'], 8.5, 0.55, 11, 0.75, 14, 0.9];
      layer.paint['line-width'] = [
        'interpolate',
        ['exponential', 1.35],
        ['zoom'],
        8.5,
        0.55,
        11,
        0.85,
        14,
        1.2,
        18,
        2.2,
      ];
    } else if (layer.id === 'railway-hatching' && layer.paint) {
      layer.minzoom = 10;
      layer.paint['line-color'] = '#7c8594';
      layer.paint['line-opacity'] = ['interpolate', ['linear'], ['zoom'], 10, 0.5, 13, 0.75];
      layer.paint['line-dasharray'] = [0.25, 6];
      layer.paint['line-width'] = [
        'interpolate',
        ['exponential', 1.35],
        ['zoom'],
        10,
        1.8,
        13,
        3.0,
        16,
        4.8,
        20,
        7.5,
      ];
    } else if (layer.id === 'boundary_3' && layer.paint) {
      layer.paint['line-color'] = '#8e8299';
      layer.paint['line-opacity'] = ['interpolate', ['linear'], ['zoom'], 6, 0.42, 10, 0.58];
      layer.paint['line-dasharray'] = [3, 2];
      layer.paint['line-width'] = ['interpolate', ['linear'], ['zoom'], 6, 0.7, 11, 1.3];
    } else if (layer.id === 'highway-name-major') {
      layer.minzoom = 10.5;
    } else if (layer.id === 'highway-name-minor') {
      layer.minzoom = 13;
    } else if (layer.id === 'highway-name-path') {
      layer.minzoom = 13.5;
    } else if (layer.id === 'poi_r1') {
      layer.minzoom = 15;
    } else if (layer.id === 'poi_r7') {
      layer.minzoom = 16;
    } else if (layer.id === 'poi_r20') {
      layer.minzoom = 17;
    } else if (layer.id === 'label_village') {
      layer.minzoom = 10.5;
      if (layer.layout) layer.layout['text-padding'] = 14;
    } else if (layer.id === 'label_other') {
      layer.minzoom = 12.5;
      if (layer.layout) layer.layout['text-padding'] = 20;
    }
  }

  // Add crisp shoreline outline around water bodies
  const waterFillIdx = layers.findIndex((l) => l.id === 'water');
  if (waterFillIdx >= 0) {
    layers.splice(waterFillIdx + 1, 0, {
      id: 'dense-water-outline',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'water',
      filter: [
        'all',
        ['!=', ['get', 'intermittent'], 1],
        ['!=', ['get', 'brunnel'], 'tunnel'],
      ],
      paint: {
        'line-color': '#78aed3',
        'line-opacity': 0.75,
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.45, 10, 0.75, 14, 1.1],
      },
    });
  }

  // 2. Add hillshade and contour lines below water & roads when online
  const waterIdx = layers.findIndex((l) => l.id === 'waterway_tunnel');
  const terrainInsertIdx = waterIdx >= 0 ? waterIdx : 14;

  if (!offline) {
    const demSource = getDemSource();
    style.sources.dem = {
      type: 'raster-dem',
      encoding: 'terrarium',
      tiles: [demSource.sharedDemProtocolUrl],
      tileSize: 512,
      maxzoom: 12,
      attribution:
        '© <a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">Mapterhorn</a>',
    };
    style.sources.contours = {
      type: 'vector',
      tiles: [
        demSource.contourProtocolUrl({
          overzoom: 1,
          thresholds: {
            9: [50, 150],
            10: [25, 100],
            11: [20, 100],
            12: [10, 50],
            14: [10, 50],
          },
          elevationKey: 'ele',
          levelKey: 'level',
          contourLayer: 'contours',
        }),
      ],
      minzoom: 9,
      maxzoom: 15,
    };

    layers.splice(
      terrainInsertIdx,
      0,
      {
        id: 'dense-hillshade',
        type: 'hillshade',
        source: 'dem',
        paint: {
          'hillshade-exaggeration': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            0.62,
            8,
            0.56,
            11,
            0.44,
            14,
            0.32,
          ],
          'hillshade-shadow-color': '#334155',
          'hillshade-highlight-color': '#fffdf7',
          'hillshade-accent-color': '#5c4033',
        },
      },
      {
        id: 'dense-contour-line',
        type: 'line',
        source: 'contours',
        'source-layer': 'contours',
        minzoom: 9,
        paint: {
          'line-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'ele'], 0],
            0,
            '#b88c65',
            150,
            '#9c6b43',
            400,
            '#7c4a28',
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            ['match', ['get', 'level'], 1, 0.34, 0.16],
            11,
            ['match', ['get', 'level'], 1, 0.45, 0.24],
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            ['match', ['get', 'level'], 1, 0.85, 0.4],
            12,
            ['match', ['get', 'level'], 1, 1.1, 0.55],
          ],
        },
      },
    );
  }

  // 3. Add National Park / Nature Reserve dashed olive boundary & unpaved road texture
  const boundaryIdx = layers.findIndex((l) => l.id === 'boundary_3');
  const parkOutlineLayer = {
    id: 'dense-park-outline',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'park',
    minzoom: 6,
    paint: {
      'line-color': '#4d7c0f',
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.55, 11, 0.45],
      'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.9, 13, 1.8],
      'line-dasharray': [3, 2],
    },
  };
  if (boundaryIdx >= 0) {
    layers.splice(boundaryIdx, 0, parkOutlineLayer);
  } else {
    layers.push(parkOutlineLayer);
  }

  // Farm/forest tracks, unpaved surface indicator, steps, fords, and oneway arrows
  const labelStartIdx = layers.findIndex((l) => l.id === 'waterway_line_label');
  const roadDetailLayers: any[] = [
    {
      id: 'dense-track-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 10.5,
      filter: [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        ['==', ['get', 'class'], 'track'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#f5f0e6',
        'line-opacity': 0.75,
        'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10.5, 1.0, 12, 1.4, 15, 2.8, 18, 5.5],
      },
    },
    {
      id: 'dense-track',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 10.5,
      filter: [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        ['==', ['get', 'class'], 'track'],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': '#92400e',
        'line-opacity': 0.85,
        'line-dasharray': [5.5, 0.9],
        'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10.5, 0.65, 12, 0.95, 15, 1.8, 18, 3.6],
      },
    },
    {
      id: 'dense-unpaved-overlay',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 13,
      filter: [
        'all',
        ['==', ['get', 'surface'], 'unpaved'],
        ['match', ['get', 'class'], ['minor', 'service', 'tertiary'], true, false],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': '#92400e',
        'line-opacity': 0.4,
        'line-dasharray': [1.5, 1.5],
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1.1, 16, 2.2],
      },
    },
    {
      id: 'dense-steps',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 14,
      filter: ['==', ['get', 'subclass'], 'steps'],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': '#dc2626',
        'line-dasharray': [0.5, 0.7],
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 2.2, 17, 4.2],
      },
    },
    {
      id: 'dense-ford',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 13,
      filter: ['==', ['get', 'brunnel'], 'ford'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0284c7',
        'line-dasharray': [1.2, 1.2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 2.0, 16, 3.8],
      },
    },
    {
      id: 'dense-oneway-arrows',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 15,
      filter: ['==', ['get', 'oneway'], 1],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 150,
        'icon-image': 'oneway',
        'icon-size': 0.75,
        'icon-rotation-alignment': 'map',
        'icon-padding': 2,
      },
      paint: {
        'icon-opacity': 0.65,
      },
    },
  ];
  if (labelStartIdx >= 0) {
    layers.splice(labelStartIdx, 0, ...roadDetailLayers);
  } else {
    layers.push(...roadDetailLayers);
  }

  // 4. Add contour elevation labels, house numbers, park labels, cycling POIs, and mountain peaks
  const poiIdx = layers.findIndex((l) => l.id === 'poi_r20');
  const denseSymbolLayers: any[] = [];

  if (!offline) {
    denseSymbolLayers.push({
      id: 'dense-contour-label',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contours',
      minzoom: 10.5,
      filter: ['>', ['get', 'level'], 0],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 320,
        'text-field': ['concat', ['to-string', ['get', 'ele']], 'm'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 9.5,
        'text-padding': 4,
      },
      paint: {
        'text-color': '#855834',
        'text-halo-color': 'rgba(248, 244, 240, 0.88)',
        'text-halo-width': 1.2,
      },
    });
  }

  denseSymbolLayers.push(
    {
      id: 'dense-housenumber',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'housenumber',
      minzoom: 16,
      layout: {
        'text-field': ['get', 'housenumber'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 9,
        'text-padding': 1,
      },
      paint: {
        'text-color': '#78716c',
        'text-halo-color': 'rgba(248, 244, 240, 0.85)',
        'text-halo-width': 1,
      },
    },
    {
      id: 'dense-poi-cycling-outdoor',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'poi',
      minzoom: 13,
      filter: [
        'all',
        ['match', ['geometry-type'], ['MultiPoint', 'Point'], true, false],
        [
          'match',
          ['get', 'class'],
          [
            'bicycle',
            'bicycle_rental',
            'drinking_water',
            'toilets',
            'shelter',
            'campsite',
            'castle',
            'picnic_site',
          ],
          true,
          false,
        ],
      ],
      layout: {
        'icon-image': ['get', 'class'],
        'icon-size': 0.85,
        'text-anchor': 'top',
        'text-field': [
          'step',
          ['zoom'],
          '',
          14.5,
          ['coalesce', ['get', 'name_en'], ['get', 'name']],
        ],
        'text-font': ['Noto Sans Italic'],
        'text-max-width': 8,
        'text-offset': [0, 0.65],
        'text-size': 11,
        'text-optional': true,
      },
      paint: {
        'text-color': '#334155',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.1,
      },
    },
    {
      id: 'dense-poi-food-stops',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'poi',
      minzoom: 14,
      filter: [
        'all',
        ['match', ['geometry-type'], ['MultiPoint', 'Point'], true, false],
        [
          'match',
          ['get', 'class'],
          [
            'cafe',
            'bakery',
            'bar',
            'beer',
            'grocery',
            'ice_cream',
            'fuel',
            'pharmacy',
            'lodging',
            'fast_food',
            'monument',
            'attraction',
            'hospital',
            'ferry',
          ],
          true,
          false,
        ],
      ],
      layout: {
        'icon-image': ['get', 'class'],
        'icon-size': 0.85,
        'text-anchor': 'top',
        'text-field': [
          'step',
          ['zoom'],
          '',
          15,
          ['coalesce', ['get', 'name_en'], ['get', 'name']],
        ],
        'text-font': ['Noto Sans Italic'],
        'text-max-width': 8,
        'text-offset': [0, 0.65],
        'text-size': 11,
        'text-optional': true,
      },
      paint: {
        'text-color': '#475569',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.1,
      },
    },
    {
      id: 'dense-mountain-peak',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'mountain_peak',
      minzoom: 8.5,
      filter: [
        'all',
        ['has', 'name'],
        [
          'step',
          ['zoom'],
          ['<=', ['coalesce', ['get', 'rank'], 99], 1],
          10.5,
          ['<=', ['coalesce', ['get', 'rank'], 99], 2],
          12.5,
          ['<=', ['coalesce', ['get', 'rank'], 99], 4],
          14,
          true,
        ],
      ],
      layout: {
        'icon-image': 'mountain_11',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 8.5, 0.8, 12, 0.95],
        'icon-padding': 16,
        'text-anchor': 'top',
        'text-field': [
          'case',
          ['has', 'ele'],
          [
            'concat',
            ['coalesce', ['get', 'name_en'], ['get', 'name']],
            '\n',
            ['to-string', ['round', ['get', 'ele']]],
            ' m',
          ],
          ['coalesce', ['get', 'name_en'], ['get', 'name']],
        ],
        'text-font': ['Noto Sans Italic'],
        'text-max-width': 8,
        'text-offset': [0, 0.55],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8.5, 9.5, 11, 10.5, 14, 11.5],
        'text-padding': 28,
      },
      paint: {
        'text-color': '#7c2d12',
        'text-halo-color': 'rgba(255, 255, 255, 0.9)',
        'text-halo-width': 1.2,
      },
    },
  );

  if (poiIdx >= 0) {
    layers.splice(poiIdx, 0, ...denseSymbolLayers);
  } else {
    layers.push(...denseSymbolLayers);
  }

  return style;
}

const LIGHT_REMOVED_LAYER_IDS = new Set([
  'poi_r1',
  'poi_r7',
  'poi_r20',
  'landuse-commercial',
  'landuse-industrial',
  'landuse-cemetery',
  'landuse-hospital',
  'landuse-school',
  'building-top',
]);

const EXCLUDED_POI_CLASSES = [
  'bus',
  'parking',
  'parking_garage',
  'hairdresser',
  'clothing_store',
  'bank',
  'dentist',
  'doctors',
  'laundry',
  'car',
  'veterinary',
  'florist',
  'furniture',
  'telephone',
  'waste_basket',
  // Already rendered earlier by dense-poi-cycling-outdoor & dense-poi-food-stops
  'bicycle',
  'bicycle_rental',
  'drinking_water',
  'toilets',
  'shelter',
  'campsite',
  'castle',
  'picnic_site',
  'cafe',
  'bakery',
  'bar',
  'beer',
  'grocery',
  'ice_cream',
  'fuel',
  'pharmacy',
  'lodging',
  'fast_food',
  'monument',
  'attraction',
  'hospital',
  'ferry',
];

export function getOpenCycleMapVectorStyle(isLight = true): maplibregl.StyleSpecification {
  const baseLayers = structuredClone(OSM_BRIGHT_LAYERS).filter(
    (layer) => !isLight || !LIGHT_REMOVED_LAYER_IDS.has(layer.id),
  );

  // Remove bus stops and car parking POIs from base layers, and show trails/paths when zoomed out
  for (const layer of baseLayers) {
    if (layer.id === 'poi_transit') {
      layer.filter = ['match', ['get', 'class'], ['airport', 'rail', 'railway', 'ferry'], true, false];
      if (layer.layout) {
        layer.layout['icon-image'] = [
          'match',
          ['get', 'class'],
          'rail',
          'railway',
          ['to-string', ['get', 'class']],
        ];
      }
    } else if (
      (layer.id === 'poi_r1' || layer.id === 'poi_r7' || layer.id === 'poi_r20') &&
      Array.isArray(layer.filter)
    ) {
      layer.filter = [
        ...layer.filter,
        ['!', ['match', ['get', 'class'], EXCLUDED_POI_CLASSES, true, false]],
      ];
      if (layer.id === 'poi_r1') layer.minzoom = 15;
      if (layer.id === 'poi_r7') layer.minzoom = 16;
      if (layer.id === 'poi_r20') layer.minzoom = 17;
    } else if (
      layer.id === 'highway-minor-casing' ||
      layer.id === 'highway-minor' ||
      layer.id === 'bridge-minor-casing' ||
      layer.id === 'bridge-minor'
    ) {
      // Exclude unpaved farm/forest tracks ('track') from solid white paved road rendering
      layer.filter = [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        layer.id.startsWith('bridge-')
          ? ['==', ['get', 'brunnel'], 'bridge']
          : ['!=', ['get', 'brunnel'], 'tunnel'],
        ['match', ['get', 'class'], ['minor', 'service'], true, false],
      ];
    } else if (layer.id === 'highway-path' && layer.paint) {
      layer.minzoom = 10.5;
      layer.filter = [
        'all',
        ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
        ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true],
        ['==', ['get', 'class'], 'path'],
        ['!=', ['get', 'subclass'], 'steps'],
      ];
      layer.paint['line-color'] = isLight ? '#94a3b8' : '#64748b';
      layer.paint['line-opacity'] = isLight ? 0.55 : 0.9;
      layer.paint['line-dasharray'] = [4.5, 0.8];
      layer.paint['line-width'] = [
        'interpolate',
        ['exponential', 1.2],
        ['zoom'],
        10.5,
        0.65,
        13,
        0.95,
        15,
        1.2,
        20,
        4,
      ];
    }

    if (layer.paint) {
      if (layer.id === 'park') {
        layer.filter = [
          'all',
          ['match', ['geometry-type'], ['MultiPolygon', 'Polygon'], true, false],
          ['!=', ['get', 'class'], 'public_park'],
        ];
        layer.paint['fill-antialias'] = true;
        layer.paint['fill-color'] = isLight ? '#dff0d8' : '#b8e0ab';
        layer.paint['fill-opacity'] = isLight
          ? 0.16
          : ['interpolate', ['linear'], ['zoom'], 5, 0.55, 9, 0.42, 12, 0.24];
      } else if (layer.id === 'landcover-grass-park') {
        layer.paint['fill-antialias'] = true;
        layer.paint['fill-color'] = isLight ? '#d5eac3' : '#cce6b8';
        layer.paint['fill-opacity'] = isLight ? 0.42 : 0.62;
      } else if (layer.id === 'landcover-grass') {
        layer.filter = [
          'all',
          ['==', ['get', 'class'], 'grass'],
          ['!', ['match', ['get', 'subclass'], ['heath', 'moor', 'fell', 'tundra', 'scrub'], true, false]],
        ];
        layer.paint['fill-antialias'] = true;
        layer.paint['fill-color'] = isLight ? '#d5eac3' : '#c6e4ae';
        layer.paint['fill-opacity'] = isLight ? 0.48 : 0.8;
      } else if (layer.id === 'landcover-wood') {
        layer.paint['fill-antialias'] = true;
        layer.paint['fill-color'] = isLight
          ? '#8bc978'
          : ['interpolate', ['linear'], ['zoom'], 6, '#52a63e', 10, '#62b24e', 13, '#72bb5f'];
        layer.paint['fill-opacity'] = isLight
          ? 0.42
          : ['interpolate', ['linear'], ['zoom'], 6, 0.86, 10, 0.76, 13, 0.66];
        layer.paint['fill-outline-color'] = isLight
          ? 'rgba(54, 112, 45, 0.18)'
          : 'rgba(42, 98, 32, 0.34)';
      }
    }

    if (isLight && layer.paint) {
      if (layer.id === 'background') {
        layer.paint['background-color'] = '#fbfaf8';
      } else if (layer.id.startsWith('landuse-')) {
        layer.paint['fill-opacity'] = 0.35;
      } else if (layer.id === 'water') {
        layer.paint['fill-color'] = '#bad8f7';
      } else if (layer.id.startsWith('waterway-')) {
        layer.paint['line-color'] = '#bad8f7';
      } else if (layer.id === 'building') {
        layer.paint['fill-opacity'] = 0.45;
      } else if (
        layer.id === 'highway-minor-casing' ||
        layer.id === 'highway-secondary-tertiary-casing'
      ) {
        layer.paint['line-color'] = '#dfddd9';
      } else if (
        layer.id === 'highway-primary-casing' ||
        layer.id === 'highway-trunk-casing' ||
        layer.id === 'highway-motorway-casing'
      ) {
        layer.paint['line-color'] = '#f0c496';
      } else if (
        layer.id === 'highway-secondary-tertiary' ||
        layer.id === 'highway-primary' ||
        layer.id === 'highway-trunk'
      ) {
        layer.paint['line-color'] = '#fff9e0';
      } else if (layer.id === 'label_other') {
        layer.minzoom = 13.5;
        if (layer.layout) layer.layout['text-padding'] = 28;
        layer.paint['text-color'] = '#94a3b8';
      } else if (layer.id === 'label_village') {
        layer.minzoom = 11.5;
        if (layer.layout) layer.layout['text-padding'] = 20;
        layer.paint['text-color'] = '#64748b';
      } else if (layer.id === 'label_town') {
        if (layer.layout) layer.layout['text-padding'] = 14;
        layer.paint['text-color'] = '#475569';
      } else if (layer.id === 'label_city' || layer.id === 'label_city_capital') {
        layer.paint['text-color'] = '#334155';
      }
    }
  }

  // Order landcover layers bottom-to-top: park -> grass-park -> farmland/orchard -> grass -> heath/scrub -> wood -> wetland/rock/sand
  const grassParkIdx = baseLayers.findIndex((l) => l.id === 'landcover-grass-park');
  const parkIdx = baseLayers.findIndex((l) => l.id === 'park');
  if (grassParkIdx >= 0 && parkIdx >= 0 && grassParkIdx > parkIdx + 1) {
    const [grassParkLayer] = baseLayers.splice(grassParkIdx, 1);
    baseLayers.splice(parkIdx + 1, 0, grassParkLayer);
  }

  const grassIdx = baseLayers.findIndex((l) => l.id === 'landcover-grass');
  const sceneryLayers = buildSceneryLandcoverLayers(isLight);
  if (grassIdx >= 0) {
    baseLayers.splice(grassIdx + 1, 0, ...sceneryLayers);
  } else {
    baseLayers.unshift(...sceneryLayers);
  }

  // Move farmland & orchards before landcover-grass, and move landcover-wood right before dense-landcover-wood-pattern
  for (const id of [
    'dense-landcover-orchard-pattern',
    'dense-landcover-orchard',
    'dense-landcover-farmland',
  ]) {
    const idx = baseLayers.findIndex((l) => l.id === id);
    const targetGrassIdx = baseLayers.findIndex((l) => l.id === 'landcover-grass');
    if (idx >= 0 && targetGrassIdx >= 0 && idx > targetGrassIdx) {
      const [layer] = baseLayers.splice(idx, 1);
      baseLayers.splice(targetGrassIdx, 0, layer);
    }
  }
  const woodIdx = baseLayers.findIndex((l) => l.id === 'landcover-wood');
  const woodAnchorIdx = baseLayers.findIndex((l) => l.id === 'dense-landcover-sand');
  if (woodIdx >= 0 && woodAnchorIdx >= 0 && woodIdx < woodAnchorIdx) {
    const [woodLayer] = baseLayers.splice(woodIdx, 1);
    const newAnchorIdx = baseLayers.findIndex((l) => l.id === 'dense-landcover-sand');
    baseLayers.splice(newAnchorIdx, 0, woodLayer);
  }

  // Insert toned-down forest & park name labels in both Light and Dense
  const labelOtherIdx = baseLayers.findIndex((l) => l.id === 'label_other');
  const parkLabelLayer = buildParkForestLabelLayer(isLight);
  if (labelOtherIdx >= 0) {
    baseLayers.splice(labelOtherIdx, 0, parkLabelLayer);
  } else {
    baseLayers.push(parkLabelLayer);
  }

  // Place cycle route halo underneath road fills (before highway-path) and thin opaque core above road and bridge fills (before boundary_3).
  const routeLayers = buildCycleRouteHighlightLayers();
  const haloRouteLayers = routeLayers.filter((l) => !String(l.id).endsWith('-core'));
  const coreRouteLayers = routeLayers.filter((l) => String(l.id).endsWith('-core'));
  const roadFillIdx = baseLayers.findIndex((l) => l.id === 'highway-path');
  if (roadFillIdx >= 0) {
    baseLayers.splice(roadFillIdx, 0, ...haloRouteLayers);
  } else {
    baseLayers.push(...haloRouteLayers);
  }
  const routeInsertIdx = baseLayers.findIndex((l) => l.id === 'boundary_3');
  if (routeInsertIdx >= 0) {
    baseLayers.splice(routeInsertIdx, 0, ...coreRouteLayers);
  } else {
    baseLayers.push(...coreRouteLayers);
  }

  // Insert cycle route ref labels alongside road labels
  const roadLabelIdx = baseLayers.findIndex((l) => l.id === 'highway-name-major');
  const routeLabelLayers = buildCycleRouteLabelLayers();
  if (roadLabelIdx >= 0) {
    baseLayers.splice(roadLabelIdx + 1, 0, ...routeLabelLayers);
  } else {
    baseLayers.push(...routeLabelLayers);
  }

  return {
    version: 8,
    sprite: getSpriteBaseUrl(),
    glyphs: `${FONT_BASE_URL.replace(/^https:\/\//, 'offline-tile://')}{fontstack}/{range}.pbf`,
    sources: {
      openmaptiles: {
        type: 'vector',
        tiles: ['pmtiles-composite://{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14,
        attribution:
          '© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
      },
      cycle_routes: {
        type: 'vector',
        tiles: ['pmtiles-cycle://{z}/{x}/{y}.pbf'],
        minzoom: 5,
        maxzoom: 11,
      },
    },
    layers: baseLayers as any,
  };
}

export const ONLINE_STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

export const CYCLOSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    cyclosm: {
      type: 'raster',
      tiles: [
        'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        'https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors. Tiles courtesy of <a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a>',
    },
  },
  layers: [
    {
      id: 'cyclosm-tiles',
      type: 'raster',
      source: 'cyclosm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function getOpenCycleMapStyle(apiKey?: string): maplibregl.StyleSpecification {
  const query = apiKey ? `?apikey=${encodeURIComponent(apiKey)}` : '';
  return {
    version: 8,
    sources: {
      opencyclemap: {
        type: 'raster',
        tiles: [
          `https://a.tile.thunderforest.com/cycle/{z}/{x}/{y}.png${query}`,
          `https://b.tile.thunderforest.com/cycle/{z}/{x}/{y}.png${query}`,
          `https://c.tile.thunderforest.com/cycle/{z}/{x}/{y}.png${query}`,
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution:
          'Maps © <a href="https://www.thunderforest.com/" target="_blank" rel="noopener">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
      },
    },
    layers: [
      {
        id: 'opencyclemap-tiles',
        type: 'raster',
        source: 'opencyclemap',
        minzoom: 0,
        maxzoom: 18,
      },
    ],
  };
}

export function getOnlineStyle(basemap: Basemap, thunderforestKey?: string): string | maplibregl.StyleSpecification {
  if (basemap === 'dense') {
    return getDenseVectorStyle(false);
  }
  if (basemap === 'cyclosm') {
    return CYCLOSM_STYLE;
  }
  if (basemap === 'opencyclemap') {
    if (thunderforestKey) {
      return getOpenCycleMapStyle(thunderforestKey);
    }
    return getOpenCycleMapVectorStyle();
  }
  return getOfflineStyle('standard');
}
