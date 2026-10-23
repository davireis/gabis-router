// Route segment tagging and OSM surface / highway classifications.

export interface SegmentHighlight {
  coordinates: number[][][];
  color: string;
}

export interface SegmentData {
  from: number;
  to: number;
  surface: string;
  highway: string;
  noise?: number;
  traffic?: number;
  maxspeed?: number;
}

export type SurfaceCategory =
  | 'paved'
  | 'cobblestone'
  | 'compacted'
  | 'gravel'
  | 'unpaved'
  | 'unknown';

export const SURFACE_META: Record<SurfaceCategory, { label: string; color: string }> = {
  paved: { label: 'Smooth Paved', color: '#10b981' },
  cobblestone: { label: 'Paving & Cobbles', color: '#8b5cf6' },
  compacted: { label: 'Compacted', color: '#eab308' },
  gravel: { label: 'Gravel', color: '#f59e0b' },
  unpaved: { label: 'Unpaved & Natural', color: '#b45309' },
  unknown: { label: 'Untagged', color: '#94a3b8' },
};

export type SurfaceSubcategory =
  | 'asphalt'
  | 'paved'
  | 'concrete'
  | 'paving_stones'
  | 'sett'
  | 'cobblestone'
  | 'compacted'
  | 'fine_gravel'
  | 'gravel'
  | 'pebblestone'
  | 'unpaved'
  | 'grass'
  | 'mud_sand'
  | 'wood_metal'
  | 'untagged_road'
  | 'untagged_path';

export const SURFACE_SUB_META: Record<
  SurfaceSubcategory,
  { label: string; parent: SurfaceCategory; color: string }
> = {
  asphalt: { label: 'Asphalt', parent: 'paved', color: '#059669' },
  paved: { label: 'Paved / Tarmac', parent: 'paved', color: '#10b981' },
  concrete: { label: 'Concrete', parent: 'paved', color: '#34d399' },
  paving_stones: { label: 'Paving stones', parent: 'cobblestone', color: '#a78bfa' },
  sett: { label: 'Sett', parent: 'cobblestone', color: '#8b5cf6' },
  cobblestone: { label: 'Cobblestone', parent: 'cobblestone', color: '#6d28d9' },
  compacted: { label: 'Compacted', parent: 'compacted', color: '#eab308' },
  fine_gravel: { label: 'Fine gravel', parent: 'compacted', color: '#ca8a04' },
  gravel: { label: 'Gravel', parent: 'gravel', color: '#f59e0b' },
  pebblestone: { label: 'Pebblestone', parent: 'gravel', color: '#d97706' },
  unpaved: { label: 'Unpaved / Dirt / Earth', parent: 'unpaved', color: '#b45309' },
  grass: { label: 'Grass / Grass paver', parent: 'unpaved', color: '#65a30d' },
  mud_sand: { label: 'Mud / Sand / Clay', parent: 'unpaved', color: '#92400e' },
  wood_metal: { label: 'Wood / Metal', parent: 'unpaved', color: '#78716c' },
  untagged_road: { label: 'Untagged (Motor Road)', parent: 'unknown', color: '#94a3b8' },
  untagged_path: { label: 'Untagged (Path / Track)', parent: 'unknown', color: '#64748b' },
};

const MOTOR_ROAD_HIGHWAYS = new Set([
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'unclassified',
  'residential',
  'living_street',
  'service',
  'road',
]);

export function classifySurfaceSubclass(surface?: string, highway?: string): SurfaceSubcategory {
  const s = (surface || '').toLowerCase().trim();
  const h = (highway || '').toLowerCase().trim();

  if (s === 'asphalt') return 'asphalt';
  if (['paved', 'tarmac', 'chipseal', 'bricks', 'brick'].includes(s)) return 'paved';
  if (['concrete', 'concrete:lanes', 'concrete:plates', 'cement'].includes(s)) return 'concrete';

  if (['paving_stones', 'paving_stones:30', 'paving_stones:20'].includes(s)) return 'paving_stones';
  if (s === 'sett') return 'sett';
  if (['cobblestone', 'cobblestone:flattened', 'unhewn_cobblestone'].includes(s)) return 'cobblestone';

  if (s === 'compacted') return 'compacted';
  if (s === 'fine_gravel') return 'fine_gravel';

  if (s === 'gravel') return 'gravel';
  if (s === 'pebblestone') return 'pebblestone';

  if (['grass', 'artificial_turf', 'grass_paver'].includes(s)) return 'grass';
  if (['mud', 'sand', 'dirt/sand', 'clay'].includes(s)) return 'mud_sand';
  if (['wood', 'metal'].includes(s)) return 'wood_metal';
  if (
    [
      'unpaved',
      'unpaved_minor',
      'ground',
      'soil',
      'dirt',
      'earth',
      'rock',
      'rocks',
      'rocky',
      'stone',
    ].includes(s)
  ) {
    return 'unpaved';
  }

  return MOTOR_ROAD_HIGHWAYS.has(h) ? 'untagged_road' : 'untagged_path';
}

export function classifySurface(surface?: string, highway?: string): SurfaceCategory {
  return SURFACE_SUB_META[classifySurfaceSubclass(surface, highway)].parent;
}

export type RoadGroupCategory =
  | 'cycleway_path'
  | 'track'
  | 'minor_road'
  | 'main_road'
  | 'arterial_road'
  | 'unknown';

export const ROAD_GROUP_META: Record<RoadGroupCategory, { label: string; color: string }> = {
  cycleway_path: { label: 'Cycleways & Paths', color: '#06b6d4' },
  track: { label: 'Tracks', color: '#d97706' },
  minor_road: { label: 'Quiet & Minor Roads', color: '#10b981' },
  main_road: { label: 'Main Roads', color: '#eab308' },
  arterial_road: { label: 'Arterial Roads', color: '#ef4444' },
  unknown: { label: 'Unknown', color: '#94a3b8' },
};

export type RoadCategory =
  | 'trunk'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'unclassified'
  | 'residential'
  | 'service'
  | 'cycleway'
  | 'track'
  | 'bridleway'
  | 'path'
  | 'footway'
  | 'pedestrian'
  | 'unknown';

export const ROAD_META: Record<RoadCategory, { label: string; parent: RoadGroupCategory; color: string }> = {
  cycleway: { label: 'Cycleway', parent: 'cycleway_path', color: '#06b6d4' },
  footway: { label: 'Footway', parent: 'cycleway_path', color: '#a855f7' },
  path: { label: 'Path', parent: 'cycleway_path', color: '#854d0e' },
  bridleway: { label: 'Bridleway', parent: 'cycleway_path', color: '#b45309' },
  pedestrian: { label: 'Pedestrian / Steps', parent: 'cycleway_path', color: '#ec4899' },
  track: { label: 'Track', parent: 'track', color: '#d97706' },
  residential: { label: 'Residential', parent: 'minor_road', color: '#10b981' },
  service: { label: 'Service', parent: 'minor_road', color: '#6ee7b7' },
  unclassified: { label: 'Unclassified', parent: 'minor_road', color: '#34d399' },
  tertiary: { label: 'Tertiary', parent: 'main_road', color: '#eab308' },
  secondary: { label: 'Secondary', parent: 'main_road', color: '#f97316' },
  primary: { label: 'Primary', parent: 'arterial_road', color: '#ef4444' },
  trunk: { label: 'Trunk', parent: 'arterial_road', color: '#991b1b' },
  unknown: { label: 'Unknown', parent: 'unknown', color: '#94a3b8' },
};

export function classifyRoad(highway?: string): RoadCategory {
  const h = (highway || '').toLowerCase().trim();
  if (h === 'cycleway') return 'cycleway';
  if (['residential', 'living_street'].includes(h)) return 'residential';
  if (h === 'unclassified') return 'unclassified';
  if (h === 'service') return 'service';
  if (['tertiary', 'tertiary_link'].includes(h)) return 'tertiary';
  if (['secondary', 'secondary_link'].includes(h)) return 'secondary';
  if (['primary', 'primary_link'].includes(h)) return 'primary';
  if (['trunk', 'trunk_link', 'motorway', 'motorway_link'].includes(h)) return 'trunk';
  if (h === 'track') return 'track';
  if (h === 'bridleway') return 'bridleway';
  if (h === 'path') return 'path';
  if (h === 'footway') return 'footway';
  if (['pedestrian', 'steps'].includes(h)) return 'pedestrian';
  return 'unknown';
}

export function classifyRoadGroup(highway?: string): RoadGroupCategory {
  return ROAD_META[classifyRoad(highway)].parent;
}

export type TrafficCategory =
  | 'traffic_free'
  | 'low'
  | 'acceptable'
  | 'heavy'
  | 'severe'
  | 'untagged';

export const TRAFFIC_META: Record<TrafficCategory, { label: string; color: string }> = {
  traffic_free: { label: 'Traffic-free', color: '#059669' },
  low: { label: 'Quiet (1–2)', color: '#10b981' },
  acceptable: { label: 'Moderate (3)', color: '#eab308' },
  heavy: { label: 'Busy (4–5)', color: '#f97316' },
  severe: { label: 'Severe (6–7)', color: '#ef4444' },
  untagged: { label: 'Untagged', color: '#94a3b8' },
};

export type TrafficSubcategory =
  | 'traffic_free'
  | 'class_1'
  | 'class_2'
  | 'class_3'
  | 'class_4'
  | 'class_5'
  | 'class_6'
  | 'class_7'
  | 'untagged_road';

export const TRAFFIC_SUB_META: Record<
  TrafficSubcategory,
  { label: string; parent: TrafficCategory; color: string }
> = {
  traffic_free: { label: 'Car-free Path / Cycleway', parent: 'traffic_free', color: '#059669' },
  class_1: { label: 'Class 1 (Very quiet)', parent: 'low', color: '#10b981' },
  class_2: { label: 'Class 2 (Quiet)', parent: 'low', color: '#34d399' },
  class_3: { label: 'Class 3 (Moderate)', parent: 'acceptable', color: '#eab308' },
  class_4: { label: 'Class 4 (Busy)', parent: 'heavy', color: '#f59e0b' },
  class_5: { label: 'Class 5 (Heavy)', parent: 'heavy', color: '#f97316' },
  class_6: { label: 'Class 6 (Very heavy)', parent: 'severe', color: '#ef4444' },
  class_7: { label: 'Class 7 (Extreme)', parent: 'severe', color: '#b91c1c' },
  untagged_road: { label: 'Untagged (Motor Road)', parent: 'untagged', color: '#94a3b8' },
};

export function classifyTrafficSubclass(traffic?: number, highway?: string): TrafficSubcategory {
  const h = (highway || '').toLowerCase().trim();
  if (['cycleway', 'path', 'footway', 'pedestrian', 'bridleway', 'track', 'steps'].includes(h)) {
    return 'traffic_free';
  }
  const t = traffic || 0;
  if (t === 1) return 'class_1';
  if (t === 2) return 'class_2';
  if (t === 3) return 'class_3';
  if (t === 4) return 'class_4';
  if (t === 5) return 'class_5';
  if (t === 6) return 'class_6';
  if (t >= 7) return 'class_7';
  if (['trunk', 'trunk_link', 'motorway', 'motorway_link'].includes(h)) {
    return 'class_7';
  }
  return 'untagged_road';
}

export function classifyTraffic(traffic?: number, highway?: string): TrafficCategory {
  return TRAFFIC_SUB_META[classifyTrafficSubclass(traffic, highway)].parent;
}

export type NoiseCategory = 'very_quiet' | 'moderate' | 'loud' | 'untagged';

export const NOISE_META: Record<NoiseCategory, { label: string; color: string }> = {
  very_quiet: { label: 'Quiet (1–2)', color: '#10b981' },
  moderate: { label: 'Moderate (3–4)', color: '#eab308' },
  loud: { label: 'Loud (5–6)', color: '#ef4444' },
  untagged: { label: 'Untagged', color: '#94a3b8' },
};

export type NoiseSubcategory =
  | 'class_1'
  | 'class_2'
  | 'class_3'
  | 'class_4'
  | 'class_5'
  | 'class_6'
  | 'untagged';

export const NOISE_SUB_META: Record<
  NoiseSubcategory,
  { label: string; parent: NoiseCategory; color: string }
> = {
  class_1: { label: 'Class 1 (Very quiet)', parent: 'very_quiet', color: '#10b981' },
  class_2: { label: 'Class 2 (Quiet)', parent: 'very_quiet', color: '#34d399' },
  class_3: { label: 'Class 3 (Moderate)', parent: 'moderate', color: '#eab308' },
  class_4: { label: 'Class 4 (Noticeable)', parent: 'moderate', color: '#f59e0b' },
  class_5: { label: 'Class 5 (Loud)', parent: 'loud', color: '#f97316' },
  class_6: { label: 'Class 6 (Very loud)', parent: 'loud', color: '#ef4444' },
  untagged: { label: 'Untagged (No noise estimate)', parent: 'untagged', color: '#94a3b8' },
};

export function classifyNoiseSubclass(noise?: number): NoiseSubcategory {
  const n = noise || 0;
  if (n === 1) return 'class_1';
  if (n === 2) return 'class_2';
  if (n === 3) return 'class_3';
  if (n === 4) return 'class_4';
  if (n === 5) return 'class_5';
  if (n >= 6) return 'class_6';
  return 'untagged';
}

export function classifyNoise(noise?: number): NoiseCategory {
  return NOISE_SUB_META[classifyNoiseSubclass(noise)].parent;
}

export type SpeedLimitCategory =
  | 'car_free'
  | '20mph'
  | '30mph'
  | '40mph'
  | '50mph'
  | '60mph'
  | '70mph'
  | 'untagged';

export const SPEED_LIMIT_META: Record<SpeedLimitCategory, { label: string; color: string }> = {
  car_free: { label: 'Car-free', color: '#059669' },
  '20mph': { label: '20 mph', color: '#10b981' },
  '30mph': { label: '30 mph', color: '#84cc16' },
  '40mph': { label: '40 mph', color: '#eab308' },
  '50mph': { label: '50 mph', color: '#f97316' },
  '60mph': { label: '60 mph', color: '#ef4444' },
  '70mph': { label: '70 mph', color: '#991b1b' },
  untagged: { label: 'Untagged', color: '#94a3b8' },
};

export function classifySpeedLimit(maxspeed?: number, highway?: string): SpeedLimitCategory {
  const h = (highway || '').toLowerCase().trim();

  // 1. Car-free routes and paths
  if (['cycleway', 'path', 'footway', 'pedestrian', 'bridleway', 'track', 'steps'].includes(h)) {
    return 'car_free';
  }

  // 2. Explicit speed limits (in km/h as encoded in RD5 / BRouter)
  if (maxspeed && maxspeed > 0) {
    if (maxspeed <= 35) return '20mph';
    if (maxspeed <= 55) return '30mph';
    if (maxspeed <= 75) return '40mph';
    if (maxspeed <= 95) return '50mph';
    if (maxspeed <= 105) return '60mph';
    return '70mph';
  }

  return 'untagged';
}
