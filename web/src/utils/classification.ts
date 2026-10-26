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
  costfactor?: number;
  town?: number;
  lit?: boolean;
  sidewalk?: boolean;
}

export type SurfaceCategory = 'paved' | 'cobblestone' | 'unpaved' | 'unknown';

export const SURFACE_META: Record<SurfaceCategory, { label: string; color: string }> = {
  paved: { label: 'Paved', color: '#10b981' },
  cobblestone: { label: 'Cobbles', color: '#8b5cf6' },
  unpaved: { label: 'Unpaved', color: '#f59e0b' },
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
  paved: { label: 'Paved', parent: 'paved', color: '#10b981' },
  concrete: { label: 'Concrete', parent: 'paved', color: '#34d399' },
  paving_stones: { label: 'Paving stones', parent: 'cobblestone', color: '#a78bfa' },
  sett: { label: 'Sett', parent: 'cobblestone', color: '#8b5cf6' },
  cobblestone: { label: 'Cobblestone', parent: 'cobblestone', color: '#6d28d9' },
  compacted: { label: 'Compacted', parent: 'unpaved', color: '#eab308' },
  fine_gravel: { label: 'Fine gravel', parent: 'unpaved', color: '#ca8a04' },
  gravel: { label: 'Gravel', parent: 'unpaved', color: '#f59e0b' },
  pebblestone: { label: 'Pebblestone', parent: 'unpaved', color: '#d97706' },
  unpaved: { label: 'Dirt / Earth', parent: 'unpaved', color: '#b45309' },
  grass: { label: 'Grass', parent: 'unpaved', color: '#65a30d' },
  mud_sand: { label: 'Mud / Sand', parent: 'unpaved', color: '#92400e' },
  wood_metal: { label: 'Wood / Metal', parent: 'unpaved', color: '#78716c' },
  untagged_road: { label: 'Untagged road', parent: 'unknown', color: '#94a3b8' },
  untagged_path: { label: 'Untagged path', parent: 'unknown', color: '#64748b' },
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
  | 'small_road'
  | 'b_road'
  | 'a_road'
  | 'motorway'
  | 'unknown';

export const ROAD_GROUP_META: Record<RoadGroupCategory, { label: string; color: string }> = {
  cycleway_path: { label: 'Paths', color: '#06b6d4' },
  track: { label: 'Tracks', color: '#d97706' },
  small_road: { label: 'Small Roads', color: '#10b981' },
  b_road: { label: 'B-Roads', color: '#eab308' },
  a_road: { label: 'A-Roads', color: '#ef4444' },
  motorway: { label: 'Motorways', color: '#3b82f6' },
  unknown: { label: 'Untagged', color: '#94a3b8' },
};

export type RoadCategory =
  | 'motorway'
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
  pedestrian: { label: 'Pedestrian', parent: 'cycleway_path', color: '#ec4899' },
  track: { label: 'Track', parent: 'track', color: '#d97706' },
  residential: { label: 'Residential', parent: 'small_road', color: '#10b981' },
  service: { label: 'Service', parent: 'small_road', color: '#6ee7b7' },
  unclassified: { label: 'Unclassified', parent: 'small_road', color: '#34d399' },
  tertiary: { label: 'Tertiary', parent: 'small_road', color: '#059669' },
  secondary: { label: 'Secondary', parent: 'b_road', color: '#eab308' },
  primary: { label: 'Primary', parent: 'a_road', color: '#ef4444' },
  trunk: { label: 'Trunk', parent: 'a_road', color: '#991b1b' },
  motorway: { label: 'Motorway', parent: 'motorway', color: '#3b82f6' },
  unknown: { label: 'Untagged', parent: 'unknown', color: '#94a3b8' },
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
  if (['trunk', 'trunk_link'].includes(h)) return 'trunk';
  if (['motorway', 'motorway_link'].includes(h)) return 'motorway';
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

export type AreaCategory = 'countryside' | 'urban';

export const AREA_META: Record<AreaCategory, { label: string; color: string }> = {
  countryside: { label: 'Countryside', color: '#10b981' },
  urban: { label: 'Urban', color: '#f97316' },
};

export type AreaSubcategory =
  | 'unlit'
  | 'residential'
  | 'sidewalk'
  | 'lit'
  | 'town_1'
  | 'town_2'
  | 'town_3'
  | 'town_4'
  | 'town_5'
  | 'town_6';

export const AREA_SUB_META: Record<
  AreaSubcategory,
  { label: string; parent: AreaCategory; color: string }
> = {
  unlit: { label: 'Unlit (Town 0)', parent: 'countryside', color: '#10b981' },
  residential: { label: 'Residential', parent: 'urban', color: '#fbbf24' },
  sidewalk: { label: 'Sidewalk', parent: 'urban', color: '#f59e0b' },
  lit: { label: 'Lit (lit=yes)', parent: 'urban', color: '#fb923c' },
  town_1: { label: 'Town Class 1', parent: 'urban', color: '#f97316' },
  town_2: { label: 'Town Class 2', parent: 'urban', color: '#ea580c' },
  town_3: { label: 'Town Class 3', parent: 'urban', color: '#c2410c' },
  town_4: { label: 'Town Class 4', parent: 'urban', color: '#9a3412' },
  town_5: { label: 'Town Class 5', parent: 'urban', color: '#7c2d12' },
  town_6: { label: 'Town Class 6', parent: 'urban', color: '#431407' },
};

export function classifyAreaSubclass(
  seg: Pick<SegmentData, 'highway' | 'town' | 'lit' | 'sidewalk'>,
): AreaSubcategory {
  const town = seg.town || 0;
  if (town === 1) return 'town_1';
  if (town === 2) return 'town_2';
  if (town === 3) return 'town_3';
  if (town === 4) return 'town_4';
  if (town === 5) return 'town_5';
  if (town >= 6) return 'town_6';
  if (seg.lit) return 'lit';
  if (seg.sidewalk) return 'sidewalk';
  const h = (seg.highway || '').toLowerCase().trim();
  if (['residential', 'living_street', 'pedestrian'].includes(h)) {
    return 'residential';
  }
  return 'unlit';
}

export function classifyArea(
  seg: Pick<SegmentData, 'highway' | 'town' | 'lit' | 'sidewalk'>,
): AreaCategory {
  return AREA_SUB_META[classifyAreaSubclass(seg)].parent;
}

export type TrafficCategory = 'quiet' | 'fair' | 'busy' | 'heavy';

export const TRAFFIC_META: Record<TrafficCategory, { label: string; color: string }> = {
  quiet: { label: 'Quiet', color: '#10b981' },
  fair: { label: 'Fair', color: '#84cc16' },
  busy: { label: 'Busy', color: '#f97316' },
  heavy: { label: 'Heavy', color: '#ef4444' },
};

export type TrafficSubcategory =
  | 'class_0'
  | 'class_1'
  | 'class_2'
  | 'class_3'
  | 'class_4'
  | 'class_5'
  | 'class_6'
  | 'class_7';

export const TRAFFIC_SUB_META: Record<
  TrafficSubcategory,
  { label: string; parent: TrafficCategory; color: string }
> = {
  class_0: { label: 'Class 0 (Unmodelled)', parent: 'quiet', color: '#059669' },
  class_1: { label: 'Class 1 (Very quiet)', parent: 'quiet', color: '#10b981' },
  class_2: { label: 'Class 2 (Quiet)', parent: 'quiet', color: '#34d399' },
  class_3: { label: 'Class 3 (Fair)', parent: 'fair', color: '#84cc16' },
  class_4: { label: 'Class 4 (Moderate)', parent: 'busy', color: '#f59e0b' },
  class_5: { label: 'Class 5 (Busy)', parent: 'busy', color: '#f97316' },
  class_6: { label: 'Class 6 (Heavy)', parent: 'heavy', color: '#ef4444' },
  class_7: { label: 'Class 7 (Extreme)', parent: 'heavy', color: '#b91c1c' },
};

export function classifyTrafficSubclass(traffic?: number, highway?: string): TrafficSubcategory {
  const t = traffic || 0;
  if (t === 1) return 'class_1';
  if (t === 2) return 'class_2';
  if (t === 3) return 'class_3';
  if (t === 4) return 'class_4';
  if (t === 5) return 'class_5';
  if (t === 6) return 'class_6';
  if (t >= 7) return 'class_7';
  const h = (highway || '').toLowerCase().trim();
  if (['trunk', 'trunk_link', 'motorway', 'motorway_link'].includes(h)) {
    return 'class_7';
  }
  return 'class_0';
}

export function classifyTraffic(traffic?: number, highway?: string): TrafficCategory {
  return TRAFFIC_SUB_META[classifyTrafficSubclass(traffic, highway)].parent;
}

export type NoiseCategory = 'very_quiet' | 'moderate' | 'loud';

export const NOISE_META: Record<NoiseCategory, { label: string; color: string }> = {
  very_quiet: { label: 'Quiet', color: '#10b981' },
  moderate: { label: 'Moderate', color: '#eab308' },
  loud: { label: 'Loud', color: '#ef4444' },
};

export type NoiseSubcategory =
  | 'class_0'
  | 'class_1'
  | 'class_2'
  | 'class_3'
  | 'class_4'
  | 'class_5'
  | 'class_6';

export const NOISE_SUB_META: Record<
  NoiseSubcategory,
  { label: string; parent: NoiseCategory; color: string }
> = {
  class_0: { label: 'Class 0 (Unmodelled)', parent: 'very_quiet', color: '#059669' },
  class_1: { label: 'Class 1 (Very quiet)', parent: 'very_quiet', color: '#10b981' },
  class_2: { label: 'Class 2 (Quiet)', parent: 'very_quiet', color: '#34d399' },
  class_3: { label: 'Class 3 (Moderate)', parent: 'moderate', color: '#eab308' },
  class_4: { label: 'Class 4 (Noticeable)', parent: 'moderate', color: '#f59e0b' },
  class_5: { label: 'Class 5 (Loud)', parent: 'loud', color: '#f97316' },
  class_6: { label: 'Class 6 (Very loud)', parent: 'loud', color: '#ef4444' },
};

export function classifyNoiseSubclass(noise?: number): NoiseSubcategory {
  const n = noise || 0;
  if (n === 1) return 'class_1';
  if (n === 2) return 'class_2';
  if (n === 3) return 'class_3';
  if (n === 4) return 'class_4';
  if (n === 5) return 'class_5';
  if (n >= 6) return 'class_6';
  return 'class_0';
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
  '20mph': { label: '20', color: '#10b981' },
  '30mph': { label: '30', color: '#84cc16' },
  '40mph': { label: '40', color: '#eab308' },
  '50mph': { label: '50', color: '#f97316' },
  '60mph': { label: '60', color: '#ef4444' },
  '70mph': { label: '70', color: '#991b1b' },
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

export type CostCategory = 'c0_12' | 'c12_18' | 'c18_24' | 'c24_30' | 'c30_plus';

export const COST_META: Record<CostCategory, { label: string; color: string }> = {
  c0_12: { label: '[0, 1.2]', color: '#10b981' },
  c12_18: { label: '(1.2, 1.8]', color: '#84cc16' },
  c18_24: { label: '(1.8, 2.4]', color: '#eab308' },
  c24_30: { label: '(2.4, 3.0]', color: '#f97316' },
  c30_plus: { label: '(3.0, ∞)', color: '#ef4444' },
};

export function classifyCost(costfactor?: number): CostCategory {
  const c = Math.round(((costfactor ?? 1.0) || 1.0) * 100) / 100;
  if (c <= 1.2) return 'c0_12';
  if (c <= 1.8) return 'c12_18';
  if (c <= 2.4) return 'c18_24';
  if (c <= 3.0) return 'c24_30';
  return 'c30_plus';
}

export function buildCostBreakdown(segments: SegmentData[]): {
  classifier: (s: SegmentData) => CostCategory;
  meta: Record<CostCategory, { label: string; color: string }>;
  subClassifier: (s: SegmentData) => string;
  subMeta: Record<string, { label: string; parent: CostCategory; color: string }>;
} {
  const costs = new Set<number>();
  for (const s of segments) {
    const len = Math.max(0, s.to - s.from);
    if (len <= 0) continue;
    const c = Math.round(((s.costfactor ?? 1.0) || 1.0) * 100) / 100;
    costs.add(c);
  }
  if (costs.size === 0) costs.add(1.0);

  const sorted = Array.from(costs).sort((a, b) => a - b);
  const subMeta: Record<string, { label: string; parent: CostCategory; color: string }> = {};
  for (const c of sorted) {
    const key = c.toFixed(2);
    const parent = classifyCost(c);
    subMeta[key] = {
      label: `${c.toFixed(2)}×`,
      parent,
      color: COST_META[parent].color,
    };
  }

  return {
    classifier: (s) => classifyCost(s.costfactor),
    meta: COST_META,
    subClassifier: (s) => {
      const c = Math.round(((s.costfactor ?? 1.0) || 1.0) * 100) / 100;
      return c.toFixed(2);
    },
    subMeta,
  };
}
