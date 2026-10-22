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
    // MTB route relations - gold-olive (distinct from orange route slot)
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
          '#ca8a04',
          12,
          '#eab308',
          14,
          '#facc15',
          16,
          '#fef08a',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          1.2,
          10,
          2.0,
          12,
          4.2,
          13,
          6.4,
          14,
          9.8,
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
    // LCN (Local Cycle Network) - teal (distinct from RCN purple and indigo cycleways)
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
          '#0d9488',
          12,
          '#14b8a6',
          14,
          '#5eead4',
          16,
          '#99f6e4',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          1.3,
          10,
          2.2,
          12,
          4.4,
          13,
          6.8,
          14,
          10.4,
          15,
          15.0,
          16,
          21.0,
          18,
          32.0,
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
        'line-color': '#ccfbf1',
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          9,
          1.5,
          12,
          4.0,
          13,
          6.2,
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
      id: 'ocm-route-lcn-proposed',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 9,
      filter: ['all', ['==', ['get', 'network'], 'lcn'], ['==', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 9, '#0d9488', 12, '#14b8a6', 14, '#5eead4', 16, '#99f6e4'],
        'line-dasharray': [5, 1.2],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          9,
          1.5,
          12,
          4.0,
          13,
          6.2,
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
    // RCN (Regional Cycle Network) - violet-purple
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
          '#a855f7',
          12,
          '#c084fc',
          14,
          '#d8b4fe',
          16,
          '#e9d5ff',
        ],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          7,
          1.2,
          9,
          2.0,
          11,
          3.3,
          12,
          4.6,
          13,
          7.0,
          14,
          10.8,
          15,
          15.5,
          16,
          22.0,
          18,
          33.0,
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
          1.3,
          10,
          2.2,
          12,
          4.2,
          13,
          6.5,
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
      id: 'ocm-route-rcn-proposed',
      type: 'line',
      source: 'cycle_routes',
      'source-layer': 'cycle_routes',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'network'], 'rcn'], ['==', ['get', 'state'], 'proposed']],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': ['interpolate', ['linear'], ['zoom'], 8, '#a855f7', 12, '#c084fc', 14, '#d8b4fe', 16, '#e9d5ff'],
        'line-dasharray': [5, 1.2],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          8,
          1.3,
          10,
          2.2,
          12,
          4.2,
          13,
          6.5,
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
          0.9,
          7,
          1.4,
          9,
          2.3,
          11,
          3.6,
          12,
          5.0,
          13,
          7.5,
          14,
          11.5,
          15,
          16.5,
          16,
          23.0,
          18,
          34.0,
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
          1.2,
          9,
          2.0,
          12,
          4.5,
          13,
          6.8,
          14,
          10.5,
          15,
          15.0,
          16,
          21.0,
          18,
          32.0,
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
        'line-dasharray': [5, 1.2],
        'line-width': [
          'interpolate',
          ['exponential', 1.45],
          ['zoom'],
          7,
          1.2,
          9,
          2.0,
          12,
          4.5,
          13,
          6.8,
          14,
          10.5,
          15,
          15.0,
          16,
          21.0,
          18,
          32.0,
        ],
        'line-opacity': 1,
      },
    },
  ];
}

const CYCLE_SHIELD_COLORS: Record<string, string> = {
  'cycle-shield-ncn': '#e11d48',
  'cycle-shield-rcn': '#9333ea',
  'cycle-shield-lcn': '#0d9488',
  'cycle-shield-mtb': '#ca8a04',
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

export function getOfflineStyle(basemap: Basemap = 'dense'): maplibregl.StyleSpecification {
  if (basemap === 'dense') {
    return getDenseVectorStyle(true);
  }
  return getOpenCycleMapVectorStyle(true);
}

export function getDenseVectorStyle(offline = false): maplibregl.StyleSpecification {
  const style = getOpenCycleMapVectorStyle(false);
  const layers = style.layers as any[];

  // 1. Boost woodland & park landcover richness, separate tracks from paved minor roads, and show trails/labels earlier
  for (const layer of layers) {
    if (layer.id === 'landcover-wood' && layer.paint) {
      layer.paint['fill-color'] = 'hsla(104, 46%, 64%, 0.48)';
      layer.paint['fill-opacity'] = 0.65;
    } else if (layer.id === 'park' && layer.paint) {
      layer.paint['fill-color'] = '#d5ebd0';
      layer.paint['fill-opacity'] = 0.6;
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
      layer.minzoom = 8;
    } else if (layer.id === 'label_other') {
      layer.minzoom = 7.5;
    }
  }

  // 1b. Insert natural terrain landcover layers (farmland, heath/moorland, scrub, wetland, rock/scree)
  const grassIdx = layers.findIndex((l) => l.id === 'landcover-grass');
  const terrainLandcoverLayers: any[] = [
    {
      id: 'dense-landcover-farmland',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 8,
      filter: ['==', ['get', 'class'], 'farmland'],
      paint: {
        'fill-color': '#f2efe2',
        'fill-opacity': 0.55,
      },
    },
    {
      id: 'dense-landcover-heath-moor',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 7,
      filter: [
        'all',
        ['==', ['get', 'class'], 'grass'],
        ['match', ['get', 'subclass'], ['heath', 'moor', 'fell', 'tundra'], true, false],
      ],
      paint: {
        'fill-color': '#e3dbc3',
        'fill-opacity': 0.78,
      },
    },
    {
      id: 'dense-landcover-scrub',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 8,
      filter: ['all', ['==', ['get', 'class'], 'grass'], ['==', ['get', 'subclass'], 'scrub']],
      paint: {
        'fill-color': '#cde0b8',
        'fill-opacity': 0.72,
      },
    },
    {
      id: 'dense-landcover-wetland',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'wetland'],
      paint: {
        'fill-color': 'hsla(168, 42%, 75%, 0.45)',
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
        'fill-pattern': 'wetland_11',
        'fill-opacity': 0.5,
      },
    },
    {
      id: 'dense-landcover-rock',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 8,
      filter: ['==', ['get', 'class'], 'rock'],
      paint: {
        'fill-color': '#d6d3d1',
        'fill-opacity': 0.7,
      },
    },
  ];
  if (grassIdx >= 0) {
    layers.splice(grassIdx + 1, 0, ...terrainLandcoverLayers);
  } else {
    layers.unshift(...terrainLandcoverLayers);
  }

  // 2. Add hillshade and 10m/50m contour lines below water & roads when online
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
            11: [20, 100],
            12: [10, 50],
            14: [10, 50],
          },
          elevationKey: 'ele',
          levelKey: 'level',
          contourLayer: 'contours',
        }),
      ],
      minzoom: 11,
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
          'hillshade-exaggeration': 0.26,
          'hillshade-shadow-color': '#475569',
          'hillshade-highlight-color': '#ffffff',
          'hillshade-accent-color': '#64748b',
        },
      },
      {
        id: 'dense-contour-line',
        type: 'line',
        source: 'contours',
        'source-layer': 'contours',
        minzoom: 11,
        paint: {
          'line-color': '#b88c65',
          'line-opacity': ['match', ['get', 'level'], 1, 0.42, 0.22],
          'line-width': ['match', ['get', 'level'], 1, 1.05, 0.55],
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
    minzoom: 8,
    paint: {
      'line-color': '#4d7c0f',
      'line-opacity': 0.45,
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.0, 13, 1.8],
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
      minzoom: 12,
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
      id: 'dense-park-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'park',
      minzoom: 9,
      filter: ['has', 'name'],
      layout: {
        'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 12],
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#166534',
        'text-halo-color': 'rgba(255, 255, 255, 0.85)',
        'text-halo-width': 1.2,
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
      minzoom: 9,
      filter: ['has', 'name'],
      layout: {
        'icon-image': 'mountain_11',
        'icon-size': 0.9,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 11.5],
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

    if (isLight && layer.paint) {
      if (layer.id === 'background') {
        layer.paint['background-color'] = '#fbfaf8';
      } else if (layer.id === 'landcover-wood') {
        layer.paint['fill-opacity'] = 0.22;
      } else if (layer.id === 'landcover-grass' || layer.id === 'park') {
        layer.paint['fill-opacity'] = 0.28;
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
      }
    }
  }

  // Insert route highlight bands underneath road fills (before highway-path) so roads & routes sit cleanly inside the halo
  const roadFillIdx = baseLayers.findIndex((l) => l.id === 'highway-path');
  const routeLayers = buildCycleRouteHighlightLayers();
  if (isLight) {
    for (const layer of routeLayers) {
      if (layer.paint) layer.paint['line-opacity'] = 0.55;
    }
  }
  if (roadFillIdx >= 0) {
    baseLayers.splice(roadFillIdx, 0, ...routeLayers);
  } else {
    baseLayers.push(...routeLayers);
  }

  // Insert cycle route ref labels alongside road labels
  const roadLabelIdx = baseLayers.findIndex((l) => l.id === 'highway-name-major');
  const routeLabelLayers = buildCycleRouteLabelLayers();
  if (isLight) {
    for (const layer of routeLabelLayers) {
      if (layer.paint) {
        layer.paint['icon-opacity'] = 0.8;
        layer.paint['text-opacity'] = 0.85;
      }
    }
  }
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
