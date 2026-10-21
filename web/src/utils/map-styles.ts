import type maplibregl from 'maplibre-gl';
import type { Basemap } from '../basemap.ts';
import { OSM_BRIGHT_LAYERS } from './osm-bright-style.ts';

export const FONT_BASE_URL = 'https://tiles.openfreemap.org/fonts/';
export const FONT_NAMES = ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic'];
// Basic Latin plus Latin-1 and Latin Extended-A, which covers Welsh (ŵ, ŷ) and Irish names.
export const FONT_RANGES = ['0-255', '256-511'];

export const ROUTING_FILES = [
  '/profiles/lookups.dat',
  '/profiles/fastbike.brf',
  '/profiles/fastbike-lowtraffic.brf',
  '/profiles/fastbike-verylowtraffic.brf',
  '/profiles/gabis-fast-city.brf',
  '/profiles/gabis-lite-gravel.brf',
  '/profiles/gabis-safe-road.brf',
  '/profiles/gravel.brf',
  '/profiles/trekking.brf',
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
  return [
    // MTB route relations - light gold/amber (distinct from orange route slot)
    {
      id: 'ocm-route-mtb',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 8,
      filter: ['==', ['get', 'network'], 'mtb'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          '#f59e0b',
          12,
          '#fbbf24',
          14,
          '#fcd34d',
          16,
          '#fde68a',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          0.65,
          10,
          1.3,
          12,
          3.4,
          13,
          5.6,
          14,
          9.0,
          15,
          13.5,
          16,
          19.0,
          18,
          29.0,
        ],
        'line-opacity': 1,
      },
    },
    // LCN (Local Cycle Network) - cool indigo-periwinkle purple (distinct from waterways and RCN lavender)
    {
      id: 'ocm-route-lcn',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'network'], 'lcn'], ['!=', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          '#818cf8',
          12,
          '#a5b4fc',
          14,
          '#b4c2fd',
          16,
          '#c7d2fe',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          0.7,
          10,
          1.4,
          12,
          3.6,
          13,
          6.0,
          14,
          9.5,
          15,
          14.0,
          16,
          19.5,
          18,
          30.0,
        ],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-route-lcn-proposed-bg',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 9,
      filter: ['all', ['==', ['get', 'network'], 'lcn'], ['==', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#e0e7ff',
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          9,
          0.8,
          12,
          3.3,
          13,
          5.5,
          14,
          8.8,
          15,
          13.0,
          16,
          18.0,
          18,
          28.0,
        ],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-route-lcn-proposed',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 9,
      filter: ['all', ['==', ['get', 'network'], 'lcn'], ['==', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 9, '#818cf8', 12, '#a5b4fc', 14, '#b4c2fd', 16, '#c7d2fe'],
        'line-dasharray': [2, 2],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          9,
          0.8,
          12,
          3.3,
          13,
          5.5,
          14,
          8.8,
          15,
          13.0,
          16,
          18.0,
          18,
          28.0,
        ],
        'line-opacity': 1,
      },
    },
    // RCN (Regional Cycle Network) - light lavender purple (distinct from deep-purple route slot)
    {
      id: 'ocm-route-rcn',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 7,
      filter: ['all', ['==', ['get', 'network'], 'rcn'], ['!=', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7,
          '#c084fc',
          12,
          '#d8b4fe',
          14,
          '#ddb8ff',
          16,
          '#e9d5ff',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          7,
          0.65,
          9,
          1.2,
          12,
          3.8,
          13,
          6.3,
          14,
          10.0,
          15,
          14.5,
          16,
          20.5,
          18,
          31.0,
        ],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-route-rcn-proposed-bg',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'network'], 'rcn'], ['==', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#f3e8ff',
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          0.7,
          12,
          3.5,
          13,
          5.8,
          14,
          9.2,
          15,
          13.5,
          16,
          19.0,
          18,
          29.0,
        ],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-route-rcn-proposed',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'network'], 'rcn'], ['==', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 8, '#c084fc', 12, '#d8b4fe', 14, '#ddb8ff', 16, '#e9d5ff'],
        'line-dasharray': [2, 2],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          0.7,
          12,
          3.5,
          13,
          5.8,
          14,
          9.2,
          15,
          13.5,
          16,
          19.0,
          18,
          29.0,
        ],
        'line-opacity': 1,
      },
    },
    // NCN & ICN (National & International Cycle Network) - soft rose/coral red
    {
      id: 'ocm-route-ncn',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 5,
      filter: [
        'all',
        ['match', ['get', 'network'], ['ncn', 'icn'], true, false],
        ['!=', ['get', 'state'], 'proposed'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          '#f43f5e',
          12,
          '#fb7185',
          14,
          '#fda4af',
          16,
          '#fecdd3',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          5,
          0.5,
          7,
          0.8,
          9,
          1.4,
          12,
          4.0,
          13,
          6.6,
          14,
          10.5,
          15,
          15.5,
          16,
          21.5,
          18,
          32.0,
        ],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-route-ncn-proposed-bg',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 7,
      filter: [
        'all',
        ['match', ['get', 'network'], ['ncn', 'icn'], true, false],
        ['==', ['get', 'state'], 'proposed'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffe4e6',
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          7,
          0.65,
          12,
          3.6,
          13,
          6.0,
          14,
          9.6,
          15,
          14.0,
          16,
          19.5,
          18,
          30.0,
        ],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-route-ncn-proposed',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 7,
      filter: [
        'all',
        ['match', ['get', 'network'], ['ncn', 'icn'], true, false],
        ['==', ['get', 'state'], 'proposed'],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 7, '#f43f5e', 12, '#fb7185', 14, '#fda4af', 16, '#fecdd3'],
        'line-dasharray': [2, 2],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          7,
          0.65,
          12,
          3.6,
          13,
          6.0,
          14,
          9.6,
          15,
          14.0,
          16,
          19.5,
          18,
          30.0,
        ],
        'line-opacity': 1,
      },
    },
  ];
}

function buildCycleInfraLayers(): any[] {
  return [
    // Medium sky-blue backing under dashed cycle lanes so gaps between dashes are blue-tinted, not white
    {
      id: 'ocm-rd5-cyclelane-bg',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 11,
      filter: ['==', ['get', 'network'], 'cyclelane'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#93c5fd',
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 11, 0.8, 13, 1.5, 15, 2.6, 18, 5.0],
        'line-opacity': 1,
      },
    },
    // On-road cycle lanes extracted from RD5
    {
      id: 'ocm-rd5-cyclelane',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 11,
      filter: ['==', ['get', 'network'], 'cyclelane'],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 11, '#0284c7', 15, '#0ea5e9'],
        'line-dasharray': [2.5, 1.2],
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 11, 0.6, 13, 1.3, 15, 2.4, 18, 4.8],
        'line-opacity': 1,
      },
    },
    // Dedicated cycleways & cycle tracks extracted from RD5 (zooms 10+)
    {
      id: 'ocm-rd5-cycleway-casing',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 12,
      filter: ['==', ['get', 'network'], 'cycleway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#bae6fd',
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 1.8, 14, 3.2, 16, 5.2, 18, 8.0],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-rd5-cycleway-line',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 10,
      filter: ['==', ['get', 'network'], 'cycleway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 10, '#0284c7', 15, '#38bdf8'],
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 10, 0.5, 12, 1.1, 14, 2.0, 16, 3.4, 18, 5.5],
        'line-opacity': 1,
      },
    },
    // Dedicated cycleways & designated cycle paths from OpenMapTiles transportation layer
    {
      id: 'ocm-cycleway-casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: [
        'all',
        ['==', ['get', 'class'], 'path'],
        ['any', ['==', ['get', 'subclass'], 'cycleway'], ['==', ['get', 'bicycle'], 'designated']],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#bae6fd',
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 1.8, 14, 3.2, 16, 5.2, 18, 8.0],
        'line-opacity': 1,
      },
    },
    {
      id: 'ocm-cycleway-line',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 11,
      filter: [
        'all',
        ['==', ['get', 'class'], 'path'],
        ['any', ['==', ['get', 'subclass'], 'cycleway'], ['==', ['get', 'bicycle'], 'designated']],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 11, '#0284c7', 15, '#38bdf8'],
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 11, 0.7, 14, 2.0, 16, 3.4, 18, 5.5],
        'line-opacity': 1,
      },
    },
    // Medium sage backing under dashed bridleways so gaps between dashes are green-tinted, not white
    {
      id: 'ocm-bridleway-bg',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: [
        'any',
        ['==', ['get', 'subclass'], 'bridleway'],
        ['all', ['==', ['get', 'class'], 'track'], ['!=', ['get', 'bicycle'], 'no']],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#86efac',
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 1.0, 15, 2.0, 18, 4.0],
        'line-opacity': 1,
      },
    },
    // Bridleways & tracks where cycling is permitted
    {
      id: 'ocm-bridleway-line',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: [
        'any',
        ['==', ['get', 'subclass'], 'bridleway'],
        ['all', ['==', ['get', 'class'], 'track'], ['!=', ['get', 'bicycle'], 'no']],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': '#15803d',
        'line-dasharray': [3, 1.5],
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 0.8, 15, 1.8, 18, 3.8],
        'line-opacity': 1,
      },
    },
  ];
}

const CYCLE_SHIELD_COLORS: Record<string, string> = {
  'cycle-shield-ncn': '#e11d48',
  'cycle-shield-rcn': '#9333ea',
  'cycle-shield-lcn': '#6366f1',
  'cycle-shield-mtb': '#d97706',
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
      'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 7, 170, 10, 210, 13, 250, 16, 290],
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
      'ocm-route-label-mtb',
      9,
      ['all', ['==', ['get', 'network'], 'mtb'], ['has', 'ref']],
      'cycle-shield-mtb',
    ),
    makeShieldLayer(
      'ocm-route-label-lcn',
      9,
      ['all', ['==', ['get', 'network'], 'lcn'], ['has', 'ref']],
      'cycle-shield-lcn',
    ),
    makeShieldLayer(
      'ocm-route-label-rcn',
      8,
      ['all', ['==', ['get', 'network'], 'rcn'], ['has', 'ref']],
      'cycle-shield-rcn',
    ),
    makeShieldLayer(
      'ocm-route-label-ncn',
      7,
      ['all', ['in', ['get', 'network'], ['literal', ['ncn', 'icn']]], ['has', 'ref']],
      'cycle-shield-ncn',
    ),
  ];
}

export function getOfflineStyle(_basemap: Basemap = 'standard'): maplibregl.StyleSpecification {
  return getOpenCycleMapVectorStyle();
}

export function getOpenCycleMapVectorStyle(): maplibregl.StyleSpecification {
  const baseLayers = structuredClone(OSM_BRIGHT_LAYERS);

  // Insert route highlight bands underneath road fills (before highway-path) so roads & routes sit cleanly inside the halo
  const roadFillIdx = baseLayers.findIndex((l) => l.id === 'highway-path');
  const routeLayers = buildCycleRouteHighlightLayers();
  if (roadFillIdx >= 0) {
    baseLayers.splice(roadFillIdx, 0, ...routeLayers);
  } else {
    baseLayers.push(...routeLayers);
  }

  // Insert physical cycling infrastructure (cycleways, lanes, bridleways) above road fills but below labels
  const labelIdx = baseLayers.findIndex((l) => l.id === 'waterway_line_label');
  const infraLayers = buildCycleInfraLayers();
  if (labelIdx >= 0) {
    baseLayers.splice(labelIdx, 0, ...infraLayers);
  } else {
    baseLayers.push(...infraLayers);
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
