import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRoad,
  classifyRoadGroup,
  classifySurface,
  classifySurfaceSubclass,
  classifyTraffic,
  classifyTrafficSubclass,
  classifyNoise,
  classifyNoiseSubclass,
  classifySpeedLimit,
  classifyCost,
  buildCostBreakdown,
  ROAD_META,
  ROAD_GROUP_META,
  SURFACE_META,
  SURFACE_SUB_META,
  TRAFFIC_META,
  TRAFFIC_SUB_META,
  NOISE_META,
  NOISE_SUB_META,
  SPEED_LIMIT_META,
  type RoadCategory,
  type SurfaceCategory,
  type SpeedLimitCategory,
} from '../src/utils/classification.ts';

test('classifyRoad & classifyRoadGroup: maps OSM highway tags to road subclasses and parent groups', () => {
  assert.equal(classifyRoad('cycleway'), 'cycleway');
  assert.equal(classifyRoadGroup('cycleway'), 'cycleway_path');

  for (const h of ['residential', 'living_street']) {
    assert.equal(classifyRoad(h), 'residential');
    assert.equal(classifyRoadGroup(h), 'minor_road');
  }
  assert.equal(classifyRoad('unclassified'), 'unclassified');
  assert.equal(classifyRoadGroup('unclassified'), 'minor_road');
  assert.equal(classifyRoad('service'), 'service');
  assert.equal(classifyRoadGroup('service'), 'minor_road');

  for (const h of ['tertiary', 'tertiary_link']) {
    assert.equal(classifyRoad(h), 'tertiary');
    assert.equal(classifyRoadGroup(h), 'main_road');
  }

  for (const h of ['secondary', 'secondary_link']) {
    assert.equal(classifyRoad(h), 'secondary');
    assert.equal(classifyRoadGroup(h), 'main_road');
  }

  for (const h of ['primary', 'primary_link']) {
    assert.equal(classifyRoad(h), 'primary');
    assert.equal(classifyRoadGroup(h), 'arterial_road');
  }

  for (const h of ['trunk', 'trunk_link', 'motorway', 'motorway_link']) {
    assert.equal(classifyRoad(h), 'trunk');
    assert.equal(classifyRoadGroup(h), 'arterial_road');
  }

  assert.equal(classifyRoad('track'), 'track');
  assert.equal(classifyRoadGroup('track'), 'track');
  assert.equal(classifyRoad('bridleway'), 'bridleway');
  assert.equal(classifyRoadGroup('bridleway'), 'cycleway_path');
  assert.equal(classifyRoad('path'), 'path');
  assert.equal(classifyRoadGroup('path'), 'cycleway_path');
  assert.equal(classifyRoad('footway'), 'footway');
  assert.equal(classifyRoadGroup('footway'), 'cycleway_path');

  for (const h of ['pedestrian', 'steps']) {
    assert.equal(classifyRoad(h), 'pedestrian');
    assert.equal(classifyRoadGroup(h), 'cycleway_path');
  }

  assert.equal(classifyRoad(''), 'unknown');
  assert.equal(classifyRoad(undefined), 'unknown');
  assert.equal(classifyRoadGroup(undefined), 'unknown');
});

test('classifySurface & classifySurfaceSubclass: maps OSM surface tags to classes and subclasses', () => {
  for (const s of ['asphalt', 'paved', 'concrete', 'tarmac']) {
    assert.equal(classifySurface(s), 'paved');
  }
  assert.equal(classifySurfaceSubclass('asphalt'), 'asphalt');
  assert.equal(classifySurfaceSubclass('paved'), 'paved');
  assert.equal(classifySurfaceSubclass('concrete'), 'concrete');

  for (const s of ['paving_stones', 'sett', 'cobblestone']) {
    assert.equal(classifySurface(s), 'cobblestone');
  }
  assert.equal(classifySurfaceSubclass('paving_stones'), 'paving_stones');
  assert.equal(classifySurfaceSubclass('sett'), 'sett');
  assert.equal(classifySurfaceSubclass('cobblestone'), 'cobblestone');

  for (const s of ['compacted', 'fine_gravel']) {
    assert.equal(classifySurface(s), 'unpaved');
  }
  assert.equal(classifySurfaceSubclass('compacted'), 'compacted');
  assert.equal(classifySurfaceSubclass('fine_gravel'), 'fine_gravel');

  for (const s of ['gravel', 'pebblestone']) {
    assert.equal(classifySurface(s), 'unpaved');
  }
  assert.equal(classifySurfaceSubclass('gravel'), 'gravel');
  assert.equal(classifySurfaceSubclass('pebblestone'), 'pebblestone');

  for (const s of ['unpaved', 'ground', 'dirt', 'earth', 'grass', 'mud', 'sand', 'wood', 'metal']) {
    assert.equal(classifySurface(s), 'unpaved');
  }
  assert.equal(classifySurfaceSubclass('unpaved'), 'unpaved');
  assert.equal(classifySurfaceSubclass('grass'), 'grass');
  assert.equal(classifySurfaceSubclass('mud'), 'mud_sand');
  assert.equal(classifySurfaceSubclass('wood'), 'wood_metal');

  assert.equal(classifySurface(''), 'unknown');
  assert.equal(classifySurface(undefined, 'footway'), 'unknown');
  assert.equal(classifySurfaceSubclass(undefined, 'residential'), 'untagged_road');
  assert.equal(classifySurfaceSubclass(undefined, 'footway'), 'untagged_path');
});

test('classifyRoad, classifySurface, classifyTraffic & classifyNoise: all classes and subclasses have valid metadata', () => {
  const roadCategories: RoadCategory[] = [
    'cycleway',
    'residential',
    'unclassified',
    'service',
    'tertiary',
    'secondary',
    'primary',
    'trunk',
    'track',
    'bridleway',
    'path',
    'footway',
    'pedestrian',
    'unknown',
  ];

  for (const cat of roadCategories) {
    assert.ok(ROAD_META[cat], `Missing meta for ${cat}`);
    assert.ok(ROAD_META[cat].label, `Missing label for ${cat}`);
    assert.ok(ROAD_META[cat].color, `Missing color for ${cat}`);
    assert.ok(ROAD_GROUP_META[ROAD_META[cat].parent], `Missing parent group for ${cat}`);
  }

  const surfCategories: SurfaceCategory[] = [
    'paved',
    'cobblestone',
    'unpaved',
    'unknown',
  ];

  for (const cat of surfCategories) {
    assert.ok(SURFACE_META[cat], `Missing meta for ${cat}`);
    assert.ok(SURFACE_META[cat].label, `Missing label for ${cat}`);
    assert.ok(SURFACE_META[cat].color, `Missing color for ${cat}`);
  }

  for (const sub of Object.keys(SURFACE_SUB_META) as Array<keyof typeof SURFACE_SUB_META>) {
    assert.ok(SURFACE_META[SURFACE_SUB_META[sub].parent], `Missing parent for surface sub ${sub}`);
  }

  assert.equal(classifyTraffic(0, 'cycleway'), 'quiet');
  assert.equal(classifyTrafficSubclass(0, 'cycleway'), 'class_0');
  assert.equal(classifyTraffic(0, 'residential'), 'quiet');
  assert.equal(classifyTrafficSubclass(0, 'residential'), 'class_0');
  assert.equal(classifyTraffic(1, 'residential'), 'quiet');
  assert.equal(classifyTraffic(3, 'secondary'), 'quiet');
  assert.equal(classifyTrafficSubclass(1, 'residential'), 'class_1');
  assert.equal(classifyTraffic(4, 'secondary'), 'busy');
  assert.equal(classifyTraffic(5, 'primary'), 'busy');
  assert.equal(classifyTraffic(6, 'primary'), 'heavy');
  assert.equal(classifyTrafficSubclass(6, 'primary'), 'class_6');
  assert.equal(classifyTraffic(0, 'trunk'), 'heavy');
  assert.equal(classifyTrafficSubclass(undefined, 'trunk'), 'class_7');
  assert.equal(classifyTrafficSubclass(0, 'trunk_link'), 'class_7');
  for (const sub of Object.keys(TRAFFIC_SUB_META) as Array<keyof typeof TRAFFIC_SUB_META>) {
    assert.ok(TRAFFIC_META[TRAFFIC_SUB_META[sub].parent], `Missing parent for traffic sub ${sub}`);
  }

  assert.equal(classifyNoise(undefined), 'very_quiet');
  assert.equal(classifyNoiseSubclass(undefined), 'class_0');
  assert.equal(classifyNoise(0), 'very_quiet');
  assert.equal(classifyNoiseSubclass(0), 'class_0');
  assert.equal(classifyNoise(1), 'very_quiet');
  assert.equal(classifyNoiseSubclass(1), 'class_1');
  assert.equal(classifyNoise(6), 'loud');
  assert.equal(classifyNoiseSubclass(6), 'class_6');
  for (const sub of Object.keys(NOISE_SUB_META) as Array<keyof typeof NOISE_SUB_META>) {
    assert.ok(NOISE_META[NOISE_SUB_META[sub].parent], `Missing parent for noise sub ${sub}`);
  }
});

test('classifySpeedLimit: car-free infrastructure, explicit km/h limits, and untagged fallback', () => {
  const carFreeHighways = ['cycleway', 'path', 'footway', 'pedestrian', 'bridleway', 'track', 'steps'];
  for (const h of carFreeHighways) {
    assert.equal(classifySpeedLimit(undefined, h), 'car_free');
    assert.equal(classifySpeedLimit(30, h), 'car_free');
  }

  assert.equal(classifySpeedLimit(20, 'residential'), '20mph');
  assert.equal(classifySpeedLimit(35, 'primary'), '20mph');
  assert.equal(classifySpeedLimit(50, 'secondary'), '30mph');
  assert.equal(classifySpeedLimit(70, 'secondary'), '40mph');
  assert.equal(classifySpeedLimit(80, 'primary'), '50mph');
  assert.equal(classifySpeedLimit(100, 'primary'), '60mph');
  assert.equal(classifySpeedLimit(120, 'motorway'), '70mph');
  assert.equal(classifySpeedLimit(0, 'residential'), 'untagged');
  assert.equal(classifySpeedLimit(undefined, 'secondary'), 'untagged');

  const speedCats: SpeedLimitCategory[] = [
    'car_free',
    '20mph',
    '30mph',
    '40mph',
    '50mph',
    '60mph',
    '70mph',
    'untagged',
  ];
  for (const cat of speedCats) {
    assert.ok(SPEED_LIMIT_META[cat]?.label);
    assert.ok(SPEED_LIMIT_META[cat]?.color);
  }
});

test('classifyCost and buildCostBreakdown map segment costfactors to 1–1.5, 1.5–2, 2–3, 3+ buckets and exact subclasses', () => {
  const segments = [
    { from: 0, to: 500, surface: 'asphalt', highway: 'cycleway', costfactor: 1.2 },
    { from: 500, to: 700, surface: 'asphalt', highway: 'residential', costfactor: 1.8 },
    { from: 700, to: 850, surface: 'asphalt', highway: 'tertiary', costfactor: 2.5 },
    { from: 850, to: 1000, surface: 'asphalt', highway: 'primary', costfactor: 3.4 },
  ];

  assert.equal(classifyCost(1.0), 'c1_15');
  assert.equal(classifyCost(1.5), 'c1_15');
  assert.equal(classifyCost(1.51), 'c15_2');
  assert.equal(classifyCost(2.0), 'c15_2');
  assert.equal(classifyCost(2.5), 'c2_3');
  assert.equal(classifyCost(3.0), 'c2_3');
  assert.equal(classifyCost(3.1), 'c3_plus');

  const { classifier, meta, subClassifier, subMeta } = buildCostBreakdown(segments);
  assert.equal(classifier(segments[0]), 'c1_15');
  assert.equal(classifier(segments[1]), 'c15_2');
  assert.equal(classifier(segments[2]), 'c2_3');
  assert.equal(classifier(segments[3]), 'c3_plus');
  assert.equal(meta.c1_15.label, '[1, 1.5]');
  assert.equal(meta.c15_2.label, '(1.5, 2]');
  assert.equal(meta.c2_3.label, '(2, 3]');
  assert.equal(meta.c3_plus.label, '(3, ∞)');
  assert.equal(subClassifier(segments[0]), '1.20');
  assert.equal(subMeta['1.20'].label, '1.20×');
});
