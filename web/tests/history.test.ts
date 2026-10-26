import test from 'node:test';
import assert from 'node:assert/strict';
import { HistoryStack } from '../src/history.ts';
import { formatRouteHash, parseRouteHash } from '../src/hooks/useRouting.ts';

test('HistoryStack initial state', () => {
  const stack = new HistoryStack<string>(5);
  assert.equal(stack.canUndo(), false);
  assert.equal(stack.canRedo(), false);
  assert.equal(stack.undo('curr'), null);
  assert.equal(stack.redo('curr'), null);
});

test('HistoryStack undo and redo sequence', () => {
  const stack = new HistoryStack<number>(5);

  // Initial: 0
  stack.record(0);
  // Transition to 1
  assert.equal(stack.canUndo(), true);
  assert.equal(stack.canRedo(), false);

  stack.record(1);
  // Transition to 2
  assert.equal(stack.canUndo(), true);
  assert.equal(stack.canRedo(), false);

  // Undo back from 2 -> restores 1
  const prev1 = stack.undo(2);
  assert.equal(prev1, 1);
  assert.equal(stack.canUndo(), true);
  assert.equal(stack.canRedo(), true);

  // Undo back from 1 -> restores 0
  const prev0 = stack.undo(1);
  assert.equal(prev0, 0);
  assert.equal(stack.canUndo(), false);
  assert.equal(stack.canRedo(), true);

  // Redo from 0 -> restores 1
  const next1 = stack.redo(0);
  assert.equal(next1, 1);
  assert.equal(stack.canUndo(), true);
  assert.equal(stack.canRedo(), true);

  // Redo from 1 -> restores 2
  const next2 = stack.redo(1);
  assert.equal(next2, 2);
  assert.equal(stack.canUndo(), true);
  assert.equal(stack.canRedo(), false);
});

test('HistoryStack clears redo on new record action', () => {
  const stack = new HistoryStack<string>(5);
  stack.record('A'); // state is B
  const prevA = stack.undo('B');
  assert.equal(prevA, 'A');
  assert.equal(stack.canRedo(), true);

  // New action occurs while in undone state
  stack.record('A'); // state is C
  assert.equal(stack.canRedo(), false);
});

test('HistoryStack enforces max depth', () => {
  const stack = new HistoryStack<number>(3);
  stack.record(1);
  stack.record(2);
  stack.record(3);
  stack.record(4);

  // Only 3 items kept: 2, 3, 4
  assert.equal(stack.undo(5), 4);
  assert.equal(stack.undo(4), 3);
  assert.equal(stack.undo(3), 2);
  assert.equal(stack.canUndo(), false);
});

test('formatRouteHash and parseRouteHash round-trip multiple independent routes', () => {
  const hash = formatRouteHash(
    [
      {
        profile: 'gabis-safe-road',
        waypoints: [
          { lat: 51.50001, lon: -0.12001 },
          { lat: 51.51002, lon: -0.10002 },
        ],
        avoidAreas: [{ lat: 51.505, lon: -0.11, radius: 100 }],
      },
      {
        profile: 'gabis-fast-city',
        waypoints: [
          { lat: 51.48001, lon: -0.15001 },
          { lat: 51.49002, lon: -0.13002 },
        ],
        avoidAreas: [],
      },
    ],
    1,
  );

  const parsed = parseRouteHash(hash);
  assert.ok(parsed);
  assert.equal(parsed.activeSlotIdx, 1);
  assert.equal(parsed.slots.length, 2);
  assert.equal(parsed.slots[0].profile, 'gabis-safe-road');
  assert.equal(parsed.slots[0].waypoints.length, 2);
  assert.equal(parsed.slots[0].avoidAreas.length, 1);
  assert.equal(parsed.slots[1].profile, 'gabis-fast-city');
  assert.equal(parsed.slots[1].waypoints.length, 2);
  assert.equal(parsed.slots[1].waypoints[0].lat, 51.48001);
  assert.equal(parsed.slots[1].avoidAreas.length, 0);
});

test('parseRouteHash clones slot 0 waypoints for legacy multi-profile links without r2', () => {
  const parsed = parseRouteHash('#r=51.50000,-0.12000;51.51000,-0.10000&p=gabis-safe-road,gravel');
  assert.ok(parsed);
  assert.equal(parsed.slots.length, 2);
  assert.equal(parsed.slots[0].routeIdx, 0);
  assert.equal(parsed.slots[1].routeIdx, 0);
  assert.equal(parsed.slots[0].waypoints.length, 2);
  assert.equal(parsed.slots[1].waypoints.length, 2);
  assert.equal(parsed.slots[1].profile, 'gravel');
});

test('formatRouteHash and parseRouteHash support profile comparison inside multi-route state', () => {
  const hash = formatRouteHash(
    [
      {
        routeIdx: 0,
        profile: 'gabis-safe-road',
        waypoints: [
          { lat: 51.50001, lon: -0.12001 },
          { lat: 51.51002, lon: -0.10002 },
        ],
        avoidAreas: [],
      },
      {
        routeIdx: 0,
        profile: 'gravel',
        waypoints: [
          { lat: 51.50001, lon: -0.12001 },
          { lat: 51.51002, lon: -0.10002 },
        ],
        avoidAreas: [],
      },
      {
        routeIdx: 1,
        profile: 'gabis-fast-city',
        waypoints: [
          { lat: 51.48001, lon: -0.15001 },
          { lat: 51.49002, lon: -0.13002 },
        ],
        avoidAreas: [],
      },
    ],
    2,
  );

  const parsed = parseRouteHash(hash);
  assert.ok(parsed);
  assert.equal(parsed.slots.length, 3);
  assert.equal(parsed.slots[0].routeIdx, 0);
  assert.equal(parsed.slots[0].profile, 'gabis-safe-road');
  assert.equal(parsed.slots[1].routeIdx, 0);
  assert.equal(parsed.slots[1].profile, 'gravel');
  assert.equal(parsed.slots[2].routeIdx, 1);
  assert.equal(parsed.slots[2].profile, 'gabis-fast-city');
  assert.equal(parsed.activeSlotIdx, 2);
});
