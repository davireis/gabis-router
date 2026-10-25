import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPointWayTags, summarizeVectorFeatures } from '../src/utils/feature-info.ts';

test('summarizeVectorFeatures extracts road type, surface, oneway, and cycle network badges', () => {
  const summary = summarizeVectorFeatures([
    {
      sourceLayer: 'cycle_routes',
      properties: { network: 'ncn', ref: '4', state: 'actual' },
    },
    {
      sourceLayer: 'cycle_routes',
      properties: { network: 'lcn', ref: 'C10', state: 'proposed' },
    },
    {
      sourceLayer: 'transportation',
      properties: {
        class: 'minor',
        subclass: 'cycleway',
        surface: 'paved',
        oneway: 1,
        brunnel: 'bridge',
      },
    },
    {
      sourceLayer: 'transportation_name',
      properties: {
        name: 'Thames Path',
      },
    },
  ]);

  assert.equal(summary.subtitle, 'Thames Path');
  assert.equal(summary.primaryName, 'Thames Path');
  assert.deepEqual(summary.badges, [
    { text: 'NCN 4', color: '#e11d48' },
    { text: 'LCN C10 (proposed)', color: '#15803d' },
  ]);
  assert.deepEqual(summary.tags, ['Cycleway', 'Paved', 'One-way', 'Bridge']);
});

test('summarizeVectorFeatures prioritizes POI subtitle and name over road name', () => {
  const summary = summarizeVectorFeatures([
    {
      sourceLayer: 'poi',
      properties: {
        class: 'cafe',
        name: 'Look Mum No Hands',
      },
    },
    {
      sourceLayer: 'transportation_name',
      properties: {
        name: 'Old Street',
        ref: 'A5201',
      },
    },
    {
      sourceLayer: 'transportation',
      properties: {
        class: 'primary',
        surface: 'asphalt',
      },
    },
  ]);

  assert.equal(summary.subtitle, 'Cafe · Look Mum No Hands');
  assert.equal(summary.primaryName, 'Look Mum No Hands');
  assert.deepEqual(summary.tags, ['Primary road', 'Asphalt', 'A5201']);
});

test('summarizeVectorFeatures formats mountain peaks with elevation', () => {
  const summary = summarizeVectorFeatures([
    {
      sourceLayer: 'mountain_peak',
      properties: {
        name: 'Helvellyn',
        ele: 950,
      },
    },
    {
      sourceLayer: 'transportation',
      properties: {
        class: 'path',
        surface: 'unpaved',
      },
    },
  ]);

  assert.equal(summary.subtitle, 'Peak (950 m) · Helvellyn');
  assert.equal(summary.primaryName, 'Helvellyn');
  assert.deepEqual(summary.tags, ['Path', 'Unpaved']);
});

test('formatPointWayTags formats traffic, noise, and speed limit classes from RD5 way info', () => {
  const tags = formatPointWayTags(
    {
      highway: 'secondary',
      surface: 'asphalt',
      traffic_class: 3,
      noise_class: 2,
      maxspeed: 50,
      distance_m: 4,
    },
    ['Secondary road', 'Asphalt'],
  );

  assert.deepEqual(tags, ['Traffic: Fair (3/7)', 'Noise: Quiet (2/6)', 'Limit: 30 mph']);
});

test('formatPointWayTags omits unmodelled class 0 traffic on paths and minor roads', () => {
  const tags = formatPointWayTags(
    {
      highway: 'cycleway',
      surface: 'paved',
      traffic_class: 0,
      noise_class: 1,
      maxspeed: 0,
      distance_m: 2,
    },
    [],
  );

  assert.deepEqual(tags, ['Cycleway', 'Paved', 'Noise: Very quiet (1/6)']);
});
