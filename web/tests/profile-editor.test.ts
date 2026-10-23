import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateBrfFromAxes,
  normalizeProfileAxes,
  TEMPLATE_PRESETS,
  type BaseTemplateId,
} from '../src/utils/profile-editor.ts';

test('generateBrfFromAxes produces valid global, way, and node contexts for all starting templates', () => {
  const templates: BaseTemplateId[] = ['gabis-safe-road', 'gabis-fast-city', 'gabis-lite-gravel'];
  for (const id of templates) {
    const preset = TEMPLATE_PRESETS[id];
    const brf = generateBrfFromAxes(preset.axes, {
      name: preset.name,
      summary: preset.summary,
    });
    assert.ok(brf.includes('---context:global'), `${id} missing global context`);
    assert.ok(brf.includes('---context:way'), `${id} missing way context`);
    assert.ok(brf.includes('---context:node'), `${id} missing node context`);
    assert.ok(brf.includes('assign costfactor'), `${id} missing costfactor`);
    assert.ok(brf.includes('assign surface_penalty'), `${id} missing surface_penalty`);
    assert.ok(brf.includes('assign is_shared_cycleway'), `${id} missing is_shared_cycleway`);
    assert.ok(brf.includes('assign turncost'), `${id} missing turncost`);
    assert.ok(brf.includes('assign initialcost'), `${id} missing initialcost`);
  }
});

test('generateBrfFromAxes reflects OSM highway and surface slider changes', () => {
  const base = { ...TEMPLATE_PRESETS['gabis-safe-road'].axes };
  base.cyclewayCost = 1.4;
  base.cyclewaySharedCost = 18.5;
  base.bridlewayCost = 1.75;
  base.footwayCost = 12;
  base.pathCost = 9.5;
  base.gravelPenalty = 6.25;
  base.uphillCost = 95;
  base.bikerPower = 185;
  base.allowBusLanes = true;
  base.allowUrbanTrunks = true;

  const brf = generateBrfFromAxes(base, { name: 'Road Only Experiment' });
  assert.ok(brf.includes('Road Only Experiment'));
  assert.ok(brf.includes('switch is_shared_cycleway 18.5 1.4'));
  assert.ok(brf.includes('switch    highway=bridleway                         1.75'));
  assert.ok(brf.includes('switch    highway=footway                           12'));
  assert.ok(brf.includes('switch    highway=path                              9.5'));
  assert.ok(brf.includes('else if is_gravel then 6.25'));
  assert.ok(brf.includes('assign uphillcost               = 95'));
  assert.ok(brf.includes('assign bikerPower               = 185'));
  assert.ok(brf.includes('or busway=lane|yes'));
  assert.ok(brf.includes('and highway=trunk|trunk_link'));
});

test('normalizeProfileAxes fills missing fields from template defaults', () => {
  const partial = { primaryCost: 1.4, cyclewaySharedCost: 15, cobblestonePenalty: 0.5 };
  const norm = normalizeProfileAxes(partial, 'gabis-safe-road');
  assert.equal(norm.primaryCost, 1.4);
  assert.equal(norm.cyclewaySharedCost, 15);
  assert.equal(norm.tertiaryCost, 0.0);
  assert.equal(norm.gravelPenalty, 5.0);
  assert.equal(norm.cobblestonePenalty, 0.5);
});

test('generateBrfFromAxes supports 10000 disallow values, surface subclasses, uncertain/untagged penalties, and additive costfactor starting from 1.0', () => {
  const base = { ...TEMPLATE_PRESETS['gabis-safe-road'].axes };
  base.cyclewaySharedCost = 10000;
  base.pathCost = 10000;
  base.unpavedPenalty = 10000;
  base.asphaltPenalty = 0.1;
  base.pavedPenalty = 0.2;
  base.concretePenalty = 0.4;
  base.pavingStonesPenalty = 0.6;
  base.settPenalty = 0.9;
  base.cobblestonePenalty = 2.4;
  base.fineGravelPenalty = 2.1;
  base.pebblestonePenalty = 6.8;
  base.grassPenalty = 7.5;
  base.mudSandPenalty = 8.5;
  base.woodMetalPenalty = 0.7;
  base.primaryCost = 10000;
  base.allowUrbanTrunks = true;
  base.trackUntaggedCost = 4.5;
  base.untaggedRoadSurfacePenalty = 0.2;
  base.untaggedPathSurfacePenalty = 1.8;
  base.multiLanePenalty = 1.2;
  base.unlitPenalty = 2.0;
  base.untaggedLitPenalty = 0.4;
  base.trafficClass7Penalty = 2.7;
  base.noiseClass5Penalty = 0.7;
  base.noForestPenalty = 1.5;

  const brf = generateBrfFromAxes(base, { name: 'Disallow Test' });
  assert.ok(brf.includes('min 10000'));
  assert.ok(brf.includes('add 1.0'));
  assert.ok(brf.includes('add surface_penalty'));
  assert.ok(brf.includes('add non_cycleroute_road_penalty'));
  assert.ok(brf.includes('add trafficpenalty'));
  assert.ok(brf.includes('add lanes_penalty'));
  assert.ok(brf.includes('add lit_penalty'));
  assert.ok(brf.includes('switch is_shared_cycleway 10000 0.3'));
  assert.ok(brf.includes('switch    highway=path                              10000'));
  assert.ok(brf.includes('else if is_unpaved_ground then 10000'));
  assert.ok(brf.includes('if or surface=mud or surface=sand surface=clay then 8.5'));
  assert.ok(brf.includes('else if or surface=grass surface=grass_paver then 7.5'));
  assert.ok(brf.includes('else if or surface=wood surface=metal then 0.7'));
  assert.ok(brf.includes('else if surface=pebblestone then 6.8'));
  assert.ok(brf.includes('else if surface=fine_gravel then 2.1'));
  assert.ok(brf.includes('else if surface=cobblestone then 2.4'));
  assert.ok(brf.includes('else if surface=sett then 0.9'));
  assert.ok(brf.includes('else if is_cobble_or_sett then 0.6'));
  assert.ok(brf.includes('else if surface=concrete then 0.4'));
  assert.ok(brf.includes('else if surface=paved then 0.2'));
  assert.ok(brf.includes('else if is_smooth_paved then 0.1'));
  assert.ok(brf.includes('switch is_urban_trunk 10000'));
  assert.ok(brf.includes('else if is_road then 0.2'));
  assert.ok(brf.includes('else 1.8'));
  assert.ok(
    brf.includes(
      'else if or estimated_traffic_class=7 and estimated_traffic_class= highway=trunk|trunk_link|motorway|motorway_link then 2.7',
    ),
  );
  assert.ok(brf.includes('switch estimated_noise_class=5  0.7'));
  assert.ok(brf.includes('if lanes=3|4|5|6|7|8 then 1.2'));
  assert.ok(brf.includes('if lit=no then 2'));
  assert.ok(brf.includes('else if lit= then 0.4'));
});

test('generateBrfFromAxes disables entire sections when section switches are false', () => {
  const base = {
    ...TEMPLATE_PRESETS['gabis-safe-road'].axes,
    enableSurfacePenalties: false,
    enableTrafficPenalties: false,
    enableNoisePenalties: false,
    enableEnvironmentPenalties: false,
    considerElevation: false,
    enableTurnPenalties: false,
  };

  const brf = generateBrfFromAxes(base, { name: 'Minimalist' });
  assert.ok(brf.includes('assign surface_penalty =\n  0.0'));
  assert.ok(brf.includes('assign trafficpenalty =\n      0.0'));
  assert.ok(brf.includes('assign noise_penalty =\n   0.0'));
  assert.ok(brf.includes('assign lanes_penalty =\n  0.0'));
  assert.ok(brf.includes('assign lit_penalty =\n  0.0'));
  assert.ok(brf.includes('assign no_forest_penalty =\n   0.0'));
  assert.ok(brf.includes('assign consider_elevation       = false'));
  assert.ok(brf.includes('assign turncost = 0'));
  assert.ok(
    brf.includes(
      'switch or highway=traffic_signals and highway=crossing crossing=traffic_signals 0',
    ),
  );
});

test('all tag=value lookups in generated BRF profiles exist in public/profiles/lookups.dat', () => {
  const lookupsPath = path.resolve(import.meta.dirname, '../public/profiles/lookups.dat');
  const lookupsText = fs.readFileSync(lookupsPath, 'utf-8');
  const knownByTag = new Map<string, Set<string>>();

  for (const rawLine of lookupsText.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('---')) continue;
    const semiIdx = line.indexOf(';');
    if (semiIdx === -1) continue;
    const tag = line.slice(0, semiIdx).trim();
    const rest = line.slice(semiIdx + 1).trim();
    const parts = rest.split(/\s+/);
    // parts[0] is count, parts[1..] are value and aliases
    const values = parts.slice(1);
    if (!knownByTag.has(tag)) knownByTag.set(tag, new Set());
    const set = knownByTag.get(tag)!;
    for (const v of values) set.add(v);
  }
  // Built-in BRouter context pseudo-tags
  knownByTag.set('reversedirection', new Set(['yes']));
  knownByTag.set('nodeaccessgranted', new Set(['yes']));

  for (const id of Object.keys(TEMPLATE_PRESETS) as BaseTemplateId[]) {
    const axes = { ...TEMPLATE_PRESETS[id].axes, allowBusLanes: true, allowUrbanTrunks: true };
    const brf = generateBrfFromAxes(axes);
    let inGlobal = false;
    for (const rawLine of brf.split('\n')) {
      const code = rawLine.split('#')[0].trim();
      if (!code) continue;
      if (code.startsWith('---context:global')) {
        inGlobal = true;
        continue;
      }
      if (code.startsWith('---context:')) {
        inGlobal = false;
        continue;
      }
      if (inGlobal) continue;
      const expr = code.replace(/^assign\s+\S+\s*=?\s*/, '');
      for (const token of expr.split(/\s+/)) {
        if (!token.includes('=') || token === '=') continue;
        const eqIdx = token.indexOf('=');
        const tag = token.slice(0, eqIdx);
        const vals = token.slice(eqIdx + 1);
        const tagSet = knownByTag.get(tag);
        assert.ok(tagSet, `Unknown tag "${tag}" in ${id} token "${token}"`);
        if (!vals) continue; // e.g. surface= (empty check)
        for (const v of vals.split('|')) {
          assert.ok(tagSet.has(v), `Unknown lookup value "${tag}=${v}" in ${id}`);
        }
      }
    }
  }
});
