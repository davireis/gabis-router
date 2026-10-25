import type { MenuBadge, MenuHeaderInfo } from '../menu.ts';
import type { PointWayInfo } from '../types.ts';
import {
  classifyNoiseSubclass,
  classifySpeedLimit,
  classifyTrafficSubclass,
  NOISE_SUB_META,
  SPEED_LIMIT_META,
  TRAFFIC_SUB_META,
} from './classification.ts';

export interface VectorFeatureCandidate {
  sourceLayer?: string;
  layer?: {
    id?: string;
    'source-layer'?: string;
  };
  properties?: Record<string, any>;
}

const CYCLE_NETWORK_META: Record<string, { label: string; color: string }> = {
  icn: { label: 'ICN', color: '#e11d48' },
  ncn: { label: 'NCN', color: '#e11d48' },
  rcn: { label: 'RCN', color: '#9333ea' },
  lcn: { label: 'LCN', color: '#0d9488' },
  mtb: { label: 'MTB', color: '#ca8a04' },
};

const HIGHWAY_LABELS: Record<string, string> = {
  motorway: 'Motorway',
  trunk: 'Trunk road',
  primary: 'Primary road',
  secondary: 'Secondary road',
  tertiary: 'Tertiary road',
  minor: 'Minor road',
  unclassified: 'Unclassified road',
  residential: 'Residential street',
  living_street: 'Living street',
  service: 'Service road',
  track: 'Track',
  cycleway: 'Cycleway',
  bridleway: 'Bridleway',
  footway: 'Footway',
  pedestrian: 'Pedestrian street',
  path: 'Path',
  steps: 'Steps',
  ferry: 'Ferry route',
  rail: 'Railway',
  transit: 'Transit line',
};

const SURFACE_LABELS: Record<string, string> = {
  paved: 'Paved',
  unpaved: 'Unpaved',
  asphalt: 'Asphalt',
  concrete: 'Concrete',
  gravel: 'Gravel',
  compacted: 'Compacted',
  paving_stones: 'Paving stones',
  sett: 'Sett',
  cobblestone: 'Cobblestone',
  dirt: 'Dirt',
  ground: 'Ground',
  grass: 'Grass',
  wood: 'Wood',
  sand: 'Sand',
};

const POI_LABELS: Record<string, string> = {
  bicycle: 'Bike shop',
  bicycle_rental: 'Bike rental',
  bicycle_parking: 'Bike parking',
  drinking_water: 'Drinking water',
  toilets: 'Toilets',
  shelter: 'Shelter',
  campsite: 'Campsite',
  camp_site: 'Campsite',
  caravan_site: 'Caravan site',
  picnic_site: 'Picnic site',
  viewpoint: 'Viewpoint',
  attraction: 'Attraction',
  castle: 'Castle',
  monument: 'Monument',
  memorial: 'Memorial',
  museum: 'Museum',
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  fast_food: 'Fast food',
  pub: 'Pub',
  bar: 'Bar',
  biergarten: 'Biergarten',
  beer: 'Pub / Bar',
  bakery: 'Bakery',
  ice_cream: 'Ice cream',
  grocery: 'Grocery',
  supermarket: 'Supermarket',
  convenience: 'Convenience store',
  fuel: 'Fuel station',
  pharmacy: 'Pharmacy',
  hospital: 'Hospital',
  lodging: 'Lodging',
  hotel: 'Hotel',
  hostel: 'Hostel',
  guest_house: 'Guest house',
  railway: 'Train station',
  rail: 'Train station',
  station: 'Station',
  halt: 'Train halt',
  subway: 'Subway station',
  ferry: 'Ferry terminal',
  ferry_terminal: 'Ferry terminal',
};

function humanizeToken(raw: string): string {
  const cleaned = raw.replace(/_/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getFeatureName(props: Record<string, any>): string | undefined {
  const raw = props.name_en || props['name:en'] || props.name;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return undefined;
}

/**
 * Extracts a concise summary of OSM vector tile features (POIs, roads/paths, cycle routes, parks, peaks)
 * queried near a clicked map point.
 */
export function summarizeVectorFeatures(
  features: VectorFeatureCandidate[],
): Omit<MenuHeaderInfo, 'title'> & { primaryName?: string } {
  const badges: MenuBadge[] = [];
  const seenBadges = new Set<string>();
  const tags: string[] = [];
  const seenTags = new Set<string>();

  const addTag = (t: string | undefined) => {
    if (!t) return;
    const trimmed = t.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (seenTags.has(lower)) return;
    seenTags.add(lower);
    tags.push(trimmed);
  };

  let poiSubtitle: string | undefined;
  let poiName: string | undefined;
  let roadName: string | undefined;
  let roadRef: string | undefined;
  let roadTypeLabel: string | undefined;
  let surfaceLabel: string | undefined;
  let onewayLabel: string | undefined;
  let brunnelLabel: string | undefined;
  let bicycleLabel: string | undefined;
  let areaSummary: string | undefined;
  let areaName: string | undefined;

  for (const f of features) {
    const props = f.properties || {};
    const srcLayer = f.sourceLayer || f.layer?.['source-layer'] || '';

    if (srcLayer === 'cycle_routes') {
      const net = String(props.network || '').toLowerCase();
      const meta = CYCLE_NETWORK_META[net];
      if (!meta) continue;
      const isProposed = props.state === 'proposed';
      const ref = typeof props.ref === 'string' && props.ref.trim() ? props.ref.trim() : '';
      const text = `${meta.label}${ref ? ' ' + ref : ''}${isProposed ? ' (proposed)' : ''}`;
      const key = text.toLowerCase();
      if (!seenBadges.has(key)) {
        seenBadges.add(key);
        badges.push({
          text,
          color: isProposed ? '#15803d' : meta.color,
        });
      }
      continue;
    }

    if (srcLayer === 'poi' || srcLayer === 'mountain_peak') {
      if (poiSubtitle) continue;
      const name = getFeatureName(props);
      if (srcLayer === 'mountain_peak') {
        const ele =
          typeof props.ele === 'number' || typeof props.ele === 'string'
            ? `${Math.round(Number(props.ele))} m`
            : undefined;
        const typeStr = ele ? `Peak (${ele})` : 'Peak';
        poiSubtitle = name ? `${typeStr} · ${name}` : typeStr;
        if (name) poiName = name;
      } else {
        const rawKey = String(props.subclass || props.class || '').toLowerCase();
        const catLabel = POI_LABELS[rawKey] || humanizeToken(rawKey);
        if (name && catLabel) {
          poiSubtitle =
            name.toLowerCase() === catLabel.toLowerCase() ? name : `${catLabel} · ${name}`;
          poiName = name;
        } else {
          poiSubtitle = name || catLabel || undefined;
          if (name) poiName = name;
        }
      }
      continue;
    }

    if (srcLayer === 'transportation_name' || srcLayer === 'transportation') {
      const name = getFeatureName(props);
      if (name && !roadName) {
        roadName = name;
      }
      const ref = typeof props.ref === 'string' && props.ref.trim() ? props.ref.trim() : undefined;
      if (ref && !roadRef) {
        roadRef = ref;
      }
      const sub = String(props.subclass || '').toLowerCase();
      const cls = String(props.class || '').toLowerCase();
      const hwKey = sub || cls;
      if (hwKey && !roadTypeLabel) {
        roadTypeLabel = HIGHWAY_LABELS[hwKey] || humanizeToken(hwKey);
      }
      const surf = String(props.surface || '').toLowerCase();
      if (surf && !surfaceLabel) {
        surfaceLabel = SURFACE_LABELS[surf] || humanizeToken(surf);
      }
      if (!onewayLabel && (props.oneway === 1 || props.oneway === 'yes' || props.oneway === true)) {
        onewayLabel = 'One-way';
      } else if (!onewayLabel && props.oneway === -1) {
        onewayLabel = 'One-way (reverse)';
      }
      const brunnel = String(props.brunnel || '').toLowerCase();
      if (brunnel && !brunnelLabel) {
        brunnelLabel = humanizeToken(brunnel);
      }
      const bike = String(props.bicycle || '').toLowerCase();
      if (bike && !bicycleLabel) {
        if (bike === 'designated') bicycleLabel = 'Cycle designated';
        else if (bike === 'yes' || bike === 'permissive') bicycleLabel = `Cycles ${bike}`;
        else if (bike === 'no' || bike === 'dismount') bicycleLabel = `Cycles: ${bike}`;
      }
      continue;
    }

    if (
      !areaSummary &&
      (srcLayer === 'park' || srcLayer === 'water' || srcLayer === 'water_name' || srcLayer === 'landcover' || srcLayer === 'landuse')
    ) {
      const name = getFeatureName(props);
      const rawType = String(props.subclass || props.class || srcLayer).toLowerCase();
      const typeLabel = humanizeToken(rawType);
      if (name) {
        areaSummary = typeLabel && !name.toLowerCase().includes(typeLabel.toLowerCase())
          ? `${name} (${typeLabel})`
          : name;
        areaName = name;
      } else if (typeLabel && srcLayer !== 'landuse') {
        areaSummary = typeLabel;
      }
    }
  }

  addTag(roadTypeLabel);
  addTag(surfaceLabel);
  addTag(onewayLabel);
  addTag(brunnelLabel);
  addTag(bicycleLabel);

  if (roadRef && (!roadName || !roadName.toLowerCase().includes(roadRef.toLowerCase()))) {
    addTag(roadRef);
  }

  let subtitle = poiSubtitle;
  if (!subtitle && roadName) {
    subtitle = roadRef && !roadName.includes(roadRef) ? `${roadName} (${roadRef})` : roadName;
  }
  if (!subtitle && areaSummary) {
    if (tags.length === 0) {
      subtitle = areaSummary;
    } else {
      addTag(areaSummary);
    }
  }

  const primaryName = poiName || roadName || areaName;

  return {
    subtitle,
    badges: badges.length > 0 ? badges : undefined,
    tags: tags.length > 0 ? tags : undefined,
    primaryName,
  };
}

/**
 * Formats BRouter RD5 way attributes (`estimated_traffic_class`, `estimated_noise_class`,
 * plus fallback `highway` / `surface` if missing from vector tiles) into menu tags.
 */
export function formatPointWayTags(
  info: PointWayInfo | null | undefined,
  existingTags: string[] = [],
): string[] {
  if (!info) return [];
  const tags: string[] = [];
  const existingLower = new Set(existingTags.map((t) => t.toLowerCase()));

  const hasRoadTag = existingTags.some((t) =>
    Object.values(HIGHWAY_LABELS).some((lbl) => lbl.toLowerCase() === t.toLowerCase()),
  );
  if (!hasRoadTag && info.highway && info.highway !== 'beeline') {
    const hwKey = info.highway.toLowerCase().replace(/_link$/, '');
    const lbl = HIGHWAY_LABELS[hwKey] || humanizeToken(hwKey);
    if (lbl && !existingLower.has(lbl.toLowerCase())) {
      tags.push(lbl);
      existingLower.add(lbl.toLowerCase());
    }
  }

  const hasSurfTag = existingTags.some((t) =>
    Object.values(SURFACE_LABELS).some((lbl) => lbl.toLowerCase() === t.toLowerCase()),
  );
  if (!hasSurfTag && info.surface) {
    const surfKey = info.surface.toLowerCase();
    const lbl = SURFACE_LABELS[surfKey] || humanizeToken(surfKey);
    if (lbl && !existingLower.has(lbl.toLowerCase())) {
      tags.push(lbl);
      existingLower.add(lbl.toLowerCase());
    }
  }

  const trafSub = classifyTrafficSubclass(info.traffic_class, info.highway);
  if (trafSub !== 'class_0') {
    const shortLabel = TRAFFIC_SUB_META[trafSub].label.replace(/^Class (\d+) \((.+)\)$/, '$2 ($1/7)');
    tags.push(`Traffic: ${shortLabel}`);
  }

  const noiseSub = classifyNoiseSubclass(info.noise_class);
  if (noiseSub !== 'class_0') {
    const shortLabel = NOISE_SUB_META[noiseSub].label.replace(/^Class (\d+) \((.+)\)$/, '$2 ($1/6)');
    tags.push(`Noise: ${shortLabel}`);
  }

  const speedCat = classifySpeedLimit(info.maxspeed, info.highway);
  if (speedCat !== 'car_free' && speedCat !== 'untagged') {
    tags.push(`Limit: ${SPEED_LIMIT_META[speedCat].label} mph`);
  }

  return tags;
}
