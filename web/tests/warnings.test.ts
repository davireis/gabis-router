import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractRouteWarnings,
  PROHIBITION_COLOR_RED,
  WARNING_COLOR_YELLOW,
} from '../src/utils/warnings.ts';

const HEADER_ROW = [
  'Longitude',
  'Latitude',
  'Elevation',
  'Distance',
  'CostPerKm',
  'ElevCost',
  'TurnCost',
  'NodeCost',
  'InitialCost',
  'WayTags',
  'NodeTags',
  'Time',
  'Energy',
];

function makeMsgRow(distM: number, wayTags: string, nodeTags = '', nodeCost = 0): unknown[] {
  return [0, 51500000, 10, distM, 1000, 0, 0, nodeCost, 0, wayTags, nodeTags, 10, 100];
}

function makeStraightRoute(rows: unknown[][]): GeoJSON.FeatureCollection {
  const coords: number[][] = [[0.0, 51.0, 10]];
  let totalM = 0;
  for (const r of rows) {
    totalM += Number(r[3]) || 0;
    const dLat = totalM / 111132.0;
    coords.push([0.0, 51.0 + dLat, 10]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          'track-length': totalM,
          messages: [HEADER_ROW, ...rows],
        },
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      },
    ],
  };
}

test('extractRouteWarnings detects dismount warnings and ignores short crossings', () => {
  const route = makeStraightRoute([
    makeMsgRow(200, 'highway=residential'),
    makeMsgRow(10, 'highway=footway footway=crossing'), // < 18m isolated crossing -> ignored
    makeMsgRow(100, 'highway=residential'),
    makeMsgRow(80, 'highway=footway'), // 80m footway -> dismount warning
    makeMsgRow(150, 'highway=residential'),
    makeMsgRow(45, 'highway=residential oneway=yes reversedirection=yes'), // wrong-way -> dismount
    makeMsgRow(60, 'highway=residential oneway=yes oneway:bicycle=no reversedirection=yes'), // contraflow allowed -> no warning
  ]);

  const warnings = extractRouteWarnings(route);
  assert.deepEqual(
    warnings.map((w) => w.kind),
    ['dismount', 'dismount'],
  );
  assert.ok(warnings[0].detail.includes('Footway'));
  assert.equal(warnings[0].distanceM, 80);
  assert.ok(warnings[1].detail.includes('Wrong-way'));
  assert.equal(warnings[1].distanceM, 45);
});

test('extractRouteWarnings detects dangerous road warnings and ignores short <100m junctions', () => {
  const route = makeStraightRoute([
    makeMsgRow(60, 'highway=motorway'), // motorway prohibition -> reported even under 100m
    makeMsgRow(200, 'highway=residential'),
    makeMsgRow(50, 'highway=trunk maxspeed=96'), // < 100m trunk junction -> ignored
    makeMsgRow(200, 'highway=residential'),
    makeMsgRow(140, 'highway=trunk maxspeed=96'), // >= 100m trunk -> warning
    makeMsgRow(200, 'highway=trunk lit=yes maxspeed=48'), // urban lit 30mph trunk -> no warning
    makeMsgRow(150, 'highway=primary maxspeed=96 estimated_traffic_class=5'), // >= 100m busy road -> warning
    makeMsgRow(150, 'highway=primary maxspeed=96 estimated_traffic_class=5 cycleway=track'), // has cycle track -> no warning
  ]);

  const warnings = extractRouteWarnings(route);
  assert.deepEqual(
    warnings.map((w) => w.kind),
    ['dangerous_road', 'dangerous_road', 'dangerous_road'],
  );
  assert.ok(warnings[0].detail.includes('Motorway'));
  assert.equal(warnings[0].isProhibition, true);
  assert.equal(warnings[0].color, PROHIBITION_COLOR_RED);
  assert.ok(warnings[1].detail.includes('trunk'));
  assert.equal(warnings[1].isProhibition, false);
  assert.equal(warnings[1].color, WARNING_COLOR_YELLOW);
  assert.ok(warnings[2].detail.includes('Fast busy road'));
  assert.equal(warnings[2].isProhibition, false);
  assert.equal(warnings[2].color, WARNING_COLOR_YELLOW);
});

test('extractRouteWarnings detects ferry and ford crossings from way and node tags', () => {
  const route = makeStraightRoute([
    makeMsgRow(300, 'route=ferry'),
    makeMsgRow(200, 'highway=unclassified'),
    makeMsgRow(25, 'highway=unclassified ford=yes'),
    makeMsgRow(200, 'highway=unclassified', 'ford=stepping_stones', 50),
  ]);

  const warnings = extractRouteWarnings(route);
  assert.deepEqual(
    warnings.map((w) => w.kind),
    ['ferry_ford', 'ferry_ford', 'ferry_ford'],
  );
  assert.ok(warnings[0].detail.includes('Ferry'));
  assert.ok(warnings[1].detail.includes('Ford'));
  assert.ok(warnings[2].detail.includes('Ford'));
});

test('extractRouteWarnings detects steps and node barriers', () => {
  const route = makeStraightRoute([
    makeMsgRow(30, 'highway=steps'),
    makeMsgRow(200, 'highway=path', 'barrier=stile', 200),
  ]);

  const warnings = extractRouteWarnings(route);
  assert.deepEqual(
    warnings.map((w) => w.kind),
    ['steps_barrier', 'steps_barrier'],
  );
  assert.ok(warnings[0].detail.includes('Steps'));
  assert.ok(warnings[1].detail.includes('stile'));
});

test('extractRouteWarnings detects short out-and-back U-turn rollbacks and matches nearby via waypoints', () => {
  const coords: number[][] = [
    [0.0, 51.0, 10],
    [0.0, 51.001, 10],
    [0.0, 51.002, 10],
    [0.00065, 51.002, 10], // ~45m east spur tip
    [0.0, 51.002, 10], // retraced back to main road
    [0.0, 51.003, 10],
    [0.0, 51.004, 10],
  ];
  const route: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          'track-length': 550,
          messages: [HEADER_ROW],
        },
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      },
    ],
  };

  const waypoints = [
    { lat: 51.0, lon: 0.0 },
    { lat: 51.002, lon: 0.00066 },
    { lat: 51.004, lon: 0.0 },
  ];

  const warnings = extractRouteWarnings(route, waypoints);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].kind, 'rollback');
  assert.equal(warnings[0].waypointIndex, 1);
  assert.ok(warnings[0].detail.includes('Waypoint 1'));
});
