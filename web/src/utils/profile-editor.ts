export type BaseTemplateId = 'gabis-safe-road' | 'gabis-fast-city' | 'gabis-lite-gravel';

export interface ProfileAxes {
  // 1. Cycle Networks & Access (route=bicycle, cycleway=*, busway=*)
  stickToCycleRoutes: boolean;
  nonCycleRouteRoadPenalty: number; // +0.0 to +2.0 additive cost on ordinary roads not on a cycle route
  useProposedCycleRoutes: boolean;
  allowBusLanes: boolean; // treat busway=* as cycle infra
  allowUrbanTrunks: boolean; // allow non-motorroad urban trunk A-roads (lit / 20-30mph / cycle infra)
  allowMotorways: boolean;

  // 2a. OSM Road Classes (highway=* motor roads, all +0.0 to +10.0)
  trunkCost: number; // highway=trunk|trunk_link
  primaryCost: number; // highway=primary|primary_link
  secondaryCost: number; // highway=secondary|secondary_link
  tertiaryCost: number; // highway=tertiary|tertiary_link
  unclassifiedCost: number; // highway=unclassified
  residentialCost: number; // highway=residential|living_street
  serviceCost: number; // highway=service

  // 2b. OSM Cycleway, Path & Track Classes (highway=* non-motor ways, all +0.0 to +20.0)
  cyclewayCost: number; // highway=cycleway (segregated / dedicated)
  cyclewaySharedCost: number; // highway=cycleway with segregated=no or foot=designated
  pathCost: number; // highway=path
  footwayCost: number; // highway=footway
  bridlewayCost: number; // highway=bridleway
  pedestrianCost: number; // highway=pedestrian
  trackGrade1Cost: number; // highway=track + tracktype=grade1
  trackGrade2Cost: number; // highway=track + tracktype=grade2
  trackGrade3Cost: number; // highway=track + tracktype=grade3
  trackGrade4Cost: number; // highway=track + tracktype=grade4|grade5
  trackUntaggedCost: number; // highway=track when tracktype= is missing/untagged

  // 3. OSM Surface Penalties (surface=* & smoothness=*, all +0.0 to +15.0 additive penalty)
  enableSurfacePenalties: boolean;
  // 3a. Smooth Paved
  asphaltPenalty: number; // surface=asphalt or smoothness=excellent|good
  pavedPenalty: number; // surface=paved (includes brick, chipseal)
  concretePenalty: number; // surface=concrete (includes concrete:plates, concrete:lanes, cement)
  // 3b. Paving & Cobbles
  pavingStonesPenalty: number; // surface=paving_stones
  settPenalty: number; // surface=sett
  cobblestonePenalty: number; // surface=cobblestone
  // 3c. Compacted
  compactedPenalty: number; // surface=compacted or smoothness=intermediate
  fineGravelPenalty: number; // surface=fine_gravel
  // 3d. Gravel
  gravelPenalty: number; // surface=gravel
  pebblestonePenalty: number; // surface=pebblestone
  // 3e. Unpaved & Natural
  unpavedPenalty: number; // surface=unpaved|dirt|ground|earth|rock|stone or smoothness=bad..impassable
  grassPenalty: number; // surface=grass|grass_paver (includes artificial_turf alias in lookups.dat)
  mudSandPenalty: number; // surface=mud|sand|clay
  woodMetalPenalty: number; // surface=wood|metal
  // 3f. Untagged Surface
  untaggedRoadSurfacePenalty: number; // surface= missing on motor roads (is_road)
  untaggedPathSurfacePenalty: number; // surface= missing on paths/tracks/cycleways (not is_road)

  // 4. Traffic, Lanes, Lighting, Noise & Scenery (all +0.0+ additive penalties)
  enableTrafficPenalties: boolean;
  trafficClass1Penalty: number; // estimated_traffic_class=1 (very quiet)
  trafficClass2Penalty: number; // estimated_traffic_class=2 (quiet)
  trafficClass3Penalty: number; // estimated_traffic_class=3 (moderate)
  trafficClass4Penalty: number; // estimated_traffic_class=4 (busy)
  trafficClass5Penalty: number; // estimated_traffic_class=5 (heavy)
  trafficClass6Penalty: number; // estimated_traffic_class=6 (very heavy)
  trafficClass7Penalty: number; // estimated_traffic_class=7 (extreme)
  trafficUntaggedRoadPenalty: number; // estimated_traffic_class= missing on motor roads (is_road)

  enableEnvironmentPenalties: boolean;
  multiLanePenalty: number; // lanes=3|4|5|6|7|8
  unlitPenalty: number; // lit=no
  untaggedLitPenalty: number; // lit= missing

  enableNoisePenalties: boolean;
  noiseClass1Penalty: number; // estimated_noise_class=1
  noiseClass2Penalty: number; // estimated_noise_class=2
  noiseClass3Penalty: number; // estimated_noise_class=3
  noiseClass4Penalty: number; // estimated_noise_class=4
  noiseClass5Penalty: number; // estimated_noise_class=5
  noiseClass6Penalty: number; // estimated_noise_class=6
  noiseUntaggedPenalty: number; // estimated_noise_class= missing

  noForestPenalty: number; // estimated_forest_class (penalty outside woods/parks)

  // 6. Climbing & Descents (0 to 200 m/m, 0.0 to 8.0 %)
  considerElevation: boolean;
  uphillCost: number; // 0 to 200
  uphillCutoff: number; // 0.0 to 8.0 %
  downhillCost: number; // 0 to 200
  downhillCutoff: number; // 0.0 to 8.0 %

  // 7. Turns, Junctions, Signals & Barriers (all 0 to 300 m)
  enableTurnPenalties: boolean;
  turnCostGeneric: number; // 0 to 300 m
  turnCostCycleRoute: number; // 0 to 300 m
  turnCostRoundabout: number; // 0 to 300 m
  trafficSignalCost: number; // 0 to 300 m
  stopGiveWayCost: number; // 0 to 300 m (highway=stop|give_way|mini_roundabout)
  busyCrossingCost: number; // 0 to 300 m (estimated_crossing_class=1..6)
  roadTransitionCost: number; // 0 to 300 m (initialclassifier + initialcost road category switch)
  wrongWayPenalty: number; // +0 to +100 per metre (fallback onewaypenalty on counter-flow one-ways)
  dismountNodeCost: number; // 0 to 300 m
  allowSteps: boolean;
  stepsCost: number;
  allowFerries: boolean;
  ferryCost: number;

  // 8. Rider & Bike Physics (Travel Time Model)
  bikerPower: number; // Watts (50 to 350)
  totalMass: number; // kg (50 to 150)
  maxSpeed: number; // km/h (20 to 70)
  dragArea: number; // S_C_x m^2 (0.15 to 0.5)
  rollingResistance: number; // C_r (0.004 to 0.025)
}

export interface CustomProfileRecord {
  id: string; // e.g. 'custom:my-commute'
  name: string;
  summary: string;
  baseTemplate: BaseTemplateId;
  mode: 'detailed' | 'dsl';
  axes: ProfileAxes;
  dsl: string;
  updatedAt: number;
}

export const TEMPLATE_PRESETS: Record<
  BaseTemplateId,
  {
    name: string;
    shortLabel: string;
    summary: string;
    axes: ProfileAxes;
  }
> = {
  'gabis-safe-road': {
    name: "Gabi's Safe Road",
    shortLabel: 'Safe Road',
    summary: 'Protected cycleways and quiet residential streets, avoids fast traffic and unpaved tracks.',
    axes: {
      stickToCycleRoutes: true,
      nonCycleRouteRoadPenalty: 0.3,
      useProposedCycleRoutes: false,
      allowBusLanes: false,
      allowUrbanTrunks: false,
      allowMotorways: false,

      trunkCost: 9.0,
      primaryCost: 0.2,
      secondaryCost: 0.1,
      tertiaryCost: 0.0,
      unclassifiedCost: 0.1,
      residentialCost: 0.2,
      serviceCost: 0.2,

      cyclewayCost: 0.3,
      cyclewaySharedCost: 0.5,
      pathCost: 7.0,
      footwayCost: 2.0,
      bridlewayCost: 4.0,
      pedestrianCost: 4.0,
      trackGrade1Cost: 0.2,
      trackGrade2Cost: 2.0,
      trackGrade3Cost: 9.0,
      trackGrade4Cost: 19.0,
      trackUntaggedCost: 2.0,

      enableSurfacePenalties: true,
      asphaltPenalty: 0.0,
      pavedPenalty: 0.0,
      concretePenalty: 0.0,
      pavingStonesPenalty: 0.5,
      settPenalty: 0.5,
      cobblestonePenalty: 0.5,
      compactedPenalty: 1.5,
      fineGravelPenalty: 1.5,
      gravelPenalty: 5.0,
      pebblestonePenalty: 5.0,
      unpavedPenalty: 9.0,
      grassPenalty: 9.0,
      mudSandPenalty: 9.0,
      woodMetalPenalty: 9.0,
      untaggedRoadSurfacePenalty: 0.0,
      untaggedPathSurfacePenalty: 0.0,

      enableTrafficPenalties: true,
      trafficClass1Penalty: 0.0,
      trafficClass2Penalty: 0.0,
      trafficClass3Penalty: 0.3,
      trafficClass4Penalty: 0.6,
      trafficClass5Penalty: 0.9,
      trafficClass6Penalty: 1.5,
      trafficClass7Penalty: 1.5,
      trafficUntaggedRoadPenalty: 0.0,
      enableEnvironmentPenalties: true,
      multiLanePenalty: 0.0,
      unlitPenalty: 0.0,
      untaggedLitPenalty: 0.0,
      enableNoisePenalties: true,
      noiseClass1Penalty: 0.0,
      noiseClass2Penalty: 0.0,
      noiseClass3Penalty: 0.0,
      noiseClass4Penalty: 0.1,
      noiseClass5Penalty: 0.5,
      noiseClass6Penalty: 1.0,
      noiseUntaggedPenalty: 0.0,
      noForestPenalty: 0.0,

      considerElevation: true,
      uphillCost: 0,
      uphillCutoff: 1.5,
      downhillCost: 60,
      downhillCutoff: 1.5,

      enableTurnPenalties: true,
      turnCostGeneric: 120,
      turnCostCycleRoute: 60,
      turnCostRoundabout: 30,
      trafficSignalCost: 20,
      stopGiveWayCost: 15,
      busyCrossingCost: 60,
      roadTransitionCost: 20,
      wrongWayPenalty: 35,
      dismountNodeCost: 300,
      allowSteps: true,
      stepsCost: 119,
      allowFerries: true,
      ferryCost: 4.67,

      bikerPower: 100,
      totalMass: 90,
      maxSpeed: 45,
      dragArea: 0.225,
      rollingResistance: 0.01,
    },
  },
  'gabis-fast-city': {
    name: "Gabi's Fast Bike",
    shortLabel: 'Fast Bike',
    summary: 'Direct urban cycle routes and bus/cycle lanes, allows urban A-roads, avoids residential zig-zags.',
    axes: {
      stickToCycleRoutes: true,
      nonCycleRouteRoadPenalty: 0.2,
      useProposedCycleRoutes: true,
      allowBusLanes: true,
      allowUrbanTrunks: true,
      allowMotorways: false,

      trunkCost: 10.0,
      primaryCost: 0.0,
      secondaryCost: 0.0,
      tertiaryCost: 0.0,
      unclassifiedCost: 0.0,
      residentialCost: 0.1,
      serviceCost: 0.0,

      cyclewayCost: 0.0,
      cyclewaySharedCost: 0.3,
      pathCost: 5.0,
      footwayCost: 5.0,
      bridlewayCost: 0.3,
      pedestrianCost: 5.0,
      trackGrade1Cost: 1.0,
      trackGrade2Cost: 2.0,
      trackGrade3Cost: 5.0,
      trackGrade4Cost: 5.0,
      trackUntaggedCost: 5.0,

      enableSurfacePenalties: true,
      asphaltPenalty: 0.0,
      pavedPenalty: 0.0,
      concretePenalty: 0.0,
      pavingStonesPenalty: 0.0,
      settPenalty: 0.0,
      cobblestonePenalty: 0.0,
      compactedPenalty: 0.5,
      fineGravelPenalty: 0.5,
      gravelPenalty: 1.0,
      pebblestonePenalty: 1.0,
      unpavedPenalty: 5.0,
      grassPenalty: 5.0,
      mudSandPenalty: 5.0,
      woodMetalPenalty: 5.0,
      untaggedRoadSurfacePenalty: 0.3,
      untaggedPathSurfacePenalty: 0.3,

      enableTrafficPenalties: true,
      trafficClass1Penalty: 0.0,
      trafficClass2Penalty: 0.0,
      trafficClass3Penalty: 0.0,
      trafficClass4Penalty: 0.2,
      trafficClass5Penalty: 0.5,
      trafficClass6Penalty: 1.0,
      trafficClass7Penalty: 1.5,
      trafficUntaggedRoadPenalty: 0.0,
      enableEnvironmentPenalties: false,
      multiLanePenalty: 0.0,
      unlitPenalty: 0.0,
      untaggedLitPenalty: 0.0,
      enableNoisePenalties: true,
      noiseClass1Penalty: 0.0,
      noiseClass2Penalty: 0.1,
      noiseClass3Penalty: 0.1,
      noiseClass4Penalty: 0.2,
      noiseClass5Penalty: 0.3,
      noiseClass6Penalty: 0.4,
      noiseUntaggedPenalty: 0.0,
      noForestPenalty: 0.0,

      considerElevation: true,
      uphillCost: 0,
      uphillCutoff: 1.5,
      downhillCost: 15,
      downhillCutoff: 1.5,

      enableTurnPenalties: true,
      turnCostGeneric: 120,
      turnCostCycleRoute: 90,
      turnCostRoundabout: 30,
      trafficSignalCost: 25,
      stopGiveWayCost: 15,
      busyCrossingCost: 40,
      roadTransitionCost: 30,
      wrongWayPenalty: 35,
      dismountNodeCost: 300,
      allowSteps: true,
      stepsCost: 119,
      allowFerries: true,
      ferryCost: 4.67,

      bikerPower: 100,
      totalMass: 90,
      maxSpeed: 45,
      dragArea: 0.225,
      rollingResistance: 0.01,
    },
  },
  'gabis-lite-gravel': {
    name: "Gabi's Lite Gravel",
    shortLabel: 'Lite Gravel',
    summary: 'Quiet lanes mixed with compact gravel tracks, bridleways, and towpaths.',
    axes: {
      stickToCycleRoutes: true,
      nonCycleRouteRoadPenalty: 0.3,
      useProposedCycleRoutes: false,
      allowBusLanes: false,
      allowUrbanTrunks: false,
      allowMotorways: false,

      trunkCost: 9.0,
      primaryCost: 0.2,
      secondaryCost: 0.1,
      tertiaryCost: 0.0,
      unclassifiedCost: 0.1,
      residentialCost: 0.2,
      serviceCost: 0.2,

      cyclewayCost: 0.3,
      cyclewaySharedCost: 0.3,
      pathCost: 7.0,
      footwayCost: 1.0,
      bridlewayCost: 0.5,
      pedestrianCost: 4.0,
      trackGrade1Cost: 0.1,
      trackGrade2Cost: 1.0,
      trackGrade3Cost: 4.0,
      trackGrade4Cost: 11.0,
      trackUntaggedCost: 1.0,

      enableSurfacePenalties: true,
      asphaltPenalty: 0.0,
      pavedPenalty: 0.0,
      concretePenalty: 0.0,
      pavingStonesPenalty: 0.3,
      settPenalty: 0.3,
      cobblestonePenalty: 0.3,
      compactedPenalty: 0.3,
      fineGravelPenalty: 0.3,
      gravelPenalty: 1.0,
      pebblestonePenalty: 1.0,
      unpavedPenalty: 2.5,
      grassPenalty: 2.5,
      mudSandPenalty: 2.5,
      woodMetalPenalty: 2.5,
      untaggedRoadSurfacePenalty: 0.0,
      untaggedPathSurfacePenalty: 0.0,

      enableTrafficPenalties: true,
      trafficClass1Penalty: 0.0,
      trafficClass2Penalty: 0.0,
      trafficClass3Penalty: 0.3,
      trafficClass4Penalty: 0.6,
      trafficClass5Penalty: 0.9,
      trafficClass6Penalty: 1.5,
      trafficClass7Penalty: 1.5,
      trafficUntaggedRoadPenalty: 0.0,
      enableEnvironmentPenalties: true,
      multiLanePenalty: 0.0,
      unlitPenalty: 0.0,
      untaggedLitPenalty: 0.0,
      enableNoisePenalties: true,
      noiseClass1Penalty: 0.0,
      noiseClass2Penalty: 0.0,
      noiseClass3Penalty: 0.0,
      noiseClass4Penalty: 0.1,
      noiseClass5Penalty: 0.5,
      noiseClass6Penalty: 1.0,
      noiseUntaggedPenalty: 0.0,
      noForestPenalty: 0.0,

      considerElevation: true,
      uphillCost: 0,
      uphillCutoff: 1.5,
      downhillCost: 60,
      downhillCutoff: 1.5,

      enableTurnPenalties: true,
      turnCostGeneric: 90,
      turnCostCycleRoute: 50,
      turnCostRoundabout: 0,
      trafficSignalCost: 20,
      stopGiveWayCost: 10,
      busyCrossingCost: 50,
      roadTransitionCost: 15,
      wrongWayPenalty: 35,
      dismountNodeCost: 300,
      allowSteps: true,
      stepsCost: 119,
      allowFerries: true,
      ferryCost: 4.67,

      bikerPower: 100,
      totalMass: 90,
      maxSpeed: 45,
      dragArea: 0.225,
      rollingResistance: 0.01,
    },
  },
};

export function normalizeProfileAxes(
  raw: Partial<ProfileAxes> | undefined,
  baseTemplate: BaseTemplateId = 'gabis-fast-city',
): ProfileAxes {
  const defaults = TEMPLATE_PRESETS[baseTemplate]?.axes || TEMPLATE_PRESETS['gabis-fast-city'].axes;
  if (!raw) return { ...defaults };
  const merged: ProfileAxes = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof ProfileAxes>) {
    const val = raw[key];
    if (typeof val === typeof defaults[key]) {
      (merged as any)[key] = val;
    }
  }
  return merged;
}

function fmtNum(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  if (Number.isInteger(safe)) return String(safe);
  return Number(safe.toFixed(3)).toString();
}

/**
 * Generates a complete, human-readable, BRouter-compatible `.brf` script from `ProfileAxes`.
 */
export function generateBrfFromAxes(axes: ProfileAxes, meta?: { name?: string; summary?: string }): string {
  const title = meta?.name || 'Custom Cycling Profile';
  const desc = meta?.summary || 'Generated by GBRouter Profile Editor.';

  return `#
# "${title}"
# ${desc}
#

---context:global   # following code refers to global config

# Bike profile
assign validForBikes = true

# Access switches
assign allow_steps              = ${axes.allowSteps}   # %allow_steps% | Set to false to disallow steps | boolean
assign allow_ferries            = ${axes.allowFerries}   # %allow_ferries% | Set to false to disallow ferries | boolean
assign allow_motorways          = ${axes.allowMotorways}   # %allow_motorways% | Set to true to allow motorways | boolean

# Cycle network & infrastructure switches
assign use_proposed_cycleroutes = ${axes.useProposedCycleRoutes}   # %use_proposed_cycleroutes% | Consider proposed and regular cycleroutes as equals | boolean
assign stick_to_cycleroutes     = ${axes.stickToCycleRoutes}   # %stick_to_cycleroutes% | Prefer designated cycle routes on roads | boolean

# Elevation parameters
assign consider_elevation       = ${axes.considerElevation}   # %consider_elevation% | Set to false to ignore elevation in routing | boolean
assign downhillcost             = ${fmtNum(axes.downhillCost)}   # %downhillcost% | Cost for going downhill | number
assign downhillcutoff           = ${fmtNum(axes.downhillCutoff)}   # %downhillcutoff% | Gradients below this value in percents are not counted | number
assign uphillcost               = ${fmtNum(axes.uphillCost)}   # %uphillcost% | Cost for going uphill | number
assign uphillcutoff             = ${fmtNum(axes.uphillCutoff)}   # %uphillcutoff% | Gradients below this value in percents are not counted | number

assign downhillcost             = if consider_elevation then downhillcost else 0
assign uphillcost               = if consider_elevation then uphillcost else 0

# Kinematic model parameters (travel time computation)
assign totalMass                = ${fmtNum(axes.totalMass)}   # %totalMass% | Mass (in kg) of the bike + biker | number
assign maxSpeed                 = ${fmtNum(axes.maxSpeed)}   # %maxSpeed% | Absolute maximum speed (in km/h) | number
assign S_C_x                    = ${fmtNum(axes.dragArea)}   # %S_C_x% | Drag coefficient times reference area (in m^2) | number
assign C_r                      = ${fmtNum(axes.rollingResistance)}   # %C_r% | Rolling resistance coefficient | number
assign bikerPower               = ${fmtNum(axes.bikerPower)}   # %bikerPower% | Average power (in W) provided by the biker | number

# Turn instructions settings
assign turnInstructionMode          = 1
assign turnInstructionCatchingRange = 40
assign turnInstructionRoundabouts   = true
assign considerTurnRestrictions     = true
assign correctMisplacedViaPoints    = false
assign correctMisplacedViaPointsDistance = 400
assign processUnusedTags            = false


---context:way   # following code refers to way-tags

assign any_cycleroute
  switch not use_proposed_cycleroutes
    or route_bicycle_icn=yes or route_bicycle_ncn=yes or route_bicycle_rcn=yes route_bicycle_lcn=yes
    or route_bicycle_icn=yes|proposed or route_bicycle_ncn=yes|proposed or route_bicycle_rcn=yes|proposed route_bicycle_lcn=yes|proposed

assign is_cycleroute =
  or any_cycleroute
  or route_bicycle_=yes
  or lcn=${axes.useProposedCycleRoutes ? 'yes|proposed' : 'yes'}
  or rcn=${axes.useProposedCycleRoutes ? 'yes|proposed' : 'yes'}
  or ncn=${axes.useProposedCycleRoutes ? 'yes|proposed' : 'yes'}
  or bicycle_road=yes
  cyclestreet=yes

assign nodeaccessgranted or is_cycleroute lcn=yes

assign hascycleway = not
  and ( or cycleway= cycleway=no|none ) and ( or cycleway:left= cycleway:left=no ) and ( or cycleway:right= cycleway:right=no ) ( or cycleway:both= cycleway:both=no )

assign hasbusway =
  ${
    axes.allowBusLanes
      ? `or busway=lane|yes
  or busway:left=lane
  busway:right=lane`
      : 'false'
  }

assign has_cycle_infra = or hascycleway hasbusway

assign is_urban_trunk =
  ${
    axes.allowUrbanTrunks
      ? `and highway=trunk|trunk_link
  and not motorroad=yes
  and lit=yes
  maxspeed=10|20|30|40|50|urban`
      : 'false'
  }

# Actual public motor roads (excludes separate cycleways, paths, tracks, footways, bridleways, pedestrian zones)
assign is_road =
  or highway=motorway|motorway_link|trunk|trunk_link
  or highway=primary|primary_link|secondary|secondary_link|tertiary|tertiary_link
  or highway=unclassified|residential|living_street|service
  or bicycle_road=yes
  cyclestreet=yes

assign isresidentialorliving = or highway=residential|living_street living_street=yes

# OSM surface=* classifications
assign is_smooth_paved =
  or surface=asphalt or surface=paved or surface=concrete
  or smoothness=excellent smoothness=good

assign is_cobble_or_sett =
  or surface=paving_stones or surface=sett surface=cobblestone

assign is_compacted =
  or surface=compacted or surface=fine_gravel smoothness=intermediate

assign is_gravel =
  or surface=gravel surface=pebblestone

assign is_unpaved_ground =
  or surface=unpaved or surface=ground or surface=dirt or surface=earth
  or surface=grass or surface=mud or surface=sand or surface=clay
  or surface=wood or surface=metal or surface=grass_paver
  or smoothness=bad or smoothness=very_bad or smoothness=horrible
  or smoothness=very_horrible smoothness=impassable

assign ispaved = or is_smooth_paved is_cobble_or_sett
assign isunpaved = or is_compacted or is_gravel is_unpaved_ground

assign surface_penalty =
  ${
    axes.enableSurfacePenalties !== false
      ? `if or surface=mud or surface=sand surface=clay then ${fmtNum(axes.mudSandPenalty)}
  else if or surface=grass surface=grass_paver then ${fmtNum(axes.grassPenalty)}
  else if or surface=wood surface=metal then ${fmtNum(axes.woodMetalPenalty)}
  else if is_unpaved_ground then ${fmtNum(axes.unpavedPenalty)}
  else if surface=pebblestone then ${fmtNum(axes.pebblestonePenalty)}
  else if is_gravel then ${fmtNum(axes.gravelPenalty)}
  else if surface=fine_gravel then ${fmtNum(axes.fineGravelPenalty)}
  else if is_compacted then ${fmtNum(axes.compactedPenalty)}
  else if surface=cobblestone then ${fmtNum(axes.cobblestonePenalty)}
  else if surface=sett then ${fmtNum(axes.settPenalty)}
  else if is_cobble_or_sett then ${fmtNum(axes.pavingStonesPenalty)}
  else if surface=concrete then ${fmtNum(axes.concretePenalty)}
  else if surface=paved then ${fmtNum(axes.pavedPenalty)}
  else if is_smooth_paved then ${fmtNum(axes.asphaltPenalty)}
  else if is_road then ${fmtNum(axes.untaggedRoadSurfacePenalty)}
  else ${fmtNum(axes.untaggedPathSurfacePenalty)}`
      : '0.0'
  }

# Paved roads that are part of a recognized bike route or have cycle/bus lane infrastructure
assign is_safe_road = and ( and is_road not isunpaved ) ( ${axes.allowBusLanes ? 'or is_cycleroute has_cycle_infra' : 'is_cycleroute'} )

# Unsegregated / shared-use foot+cycle ways tagged as highway=cycleway (e.g. park paths with segregated=no or foot=designated)
assign is_shared_cycleway =
  and highway=cycleway
  ( or segregated=no and foot=designated not segregated=yes )

# Turn penalty
assign turncost = ${
    axes.enableTurnPenalties !== false
      ? `if junction=roundabout then ${fmtNum(axes.turnCostRoundabout)}
                  else if and stick_to_cycleroutes is_safe_road then ${fmtNum(axes.turnCostCycleRoute)}
                  else ${fmtNum(axes.turnCostGeneric)}`
      : '0'
  }

assign initialclassifier =
     if route=ferry then 1
     else if highway=motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified then 2
     else if or isresidentialorliving highway=service then 3
     else if highway=cycleway|path|footway|bridleway|track|pedestrian then 4
     else 2

assign initialcost =
     switch route=ferry 10000 ${fmtNum(axes.enableTurnPenalties !== false ? axes.roadTransitionCost : 0)}

assign defaultaccess
       switch access=
              (
                    if motorroad=yes then false
                    else if highway=motorway|motorway_link then false
                    else true
              )
              switch or access=private access=no
                     false
                     true

assign bikeaccess =
       switch bicycle=
              switch bicycle_road=yes
                 true
                 switch vehicle=
                        ( if highway=footway then false else defaultaccess )
                        not vehicle=private|no
              not or bicycle=private or bicycle=no or bicycle=dismount bicycle=use_sidepath

assign footaccess =
       or bicycle=dismount
          switch foot=
                 defaultaccess
                 not or foot=private or foot=no foot=use_sidepath

assign accesspenalty
       switch bikeaccess
              0
              switch footaccess
                     5
                     switch is_cycleroute
                            15
                            switch bicycle=use_sidepath
                                   25
                                   10000

assign badoneway =
       if reversedirection=yes then
         if oneway:bicycle=yes then true
         else if oneway= then junction=roundabout
         else oneway=yes|true|1
       else oneway=-1

assign onewaypenalty =
       if ( badoneway ) then
       (
         if (
           and hascycleway
           or and cycleway:left=lane|track|shared_lane|share_busway
                  cycleway:left:oneway=no|-1
           or and cycleway:right=lane|track|shared_lane|share_busway
                  cycleway:right:oneway=no|-1
           or and cycleway:both=lane|track|shared_lane|share_busway
                  or cycleway:left:oneway=no|-1
                     cycleway:right:oneway=no|-1
           or cycleway=opposite|opposite_lane|opposite_track
           or cycleway:left=opposite|opposite_lane|opposite_track
              cycleway:right=opposite|opposite_lane|opposite_track
                                                             ) then 0
         else if ( oneway:bicycle=no                         ) then 0
         else if ( not footaccess                            ) then 100
         else if ( junction=roundabout|circular              ) then 60
         else if ( highway=trunk|trunk_link|primary|primary_link ) then max 50 ${fmtNum(axes.wrongWayPenalty)}
         else if ( highway=secondary|secondary_link          ) then max 30 ${fmtNum(axes.wrongWayPenalty)}
         else if ( highway=tertiary|tertiary_link            ) then max 20 ${fmtNum(axes.wrongWayPenalty)}
         else ${fmtNum(axes.wrongWayPenalty)}
       )
       else 0.0

# Traffic penalty (BRouter heuristic estimated_traffic_class=1..7)
assign trafficpenalty =
      ${
        axes.enableTrafficPenalties !== false
          ? `if      estimated_traffic_class=1 then ${fmtNum(axes.trafficClass1Penalty)}
      else if estimated_traffic_class=2 then ${fmtNum(axes.trafficClass2Penalty)}
      else if estimated_traffic_class=3 then ${fmtNum(axes.trafficClass3Penalty)}
      else if estimated_traffic_class=4 then ${fmtNum(axes.trafficClass4Penalty)}
      else if estimated_traffic_class=5 then ${fmtNum(axes.trafficClass5Penalty)}
      else if estimated_traffic_class=6 then ${fmtNum(axes.trafficClass6Penalty)}
      else if or estimated_traffic_class=7 and estimated_traffic_class= highway=trunk|trunk_link|motorway|motorway_link then ${fmtNum(axes.trafficClass7Penalty)}
      else if and estimated_traffic_class= is_road then ${fmtNum(axes.trafficUntaggedRoadPenalty)}
      else 0.0`
          : '0.0'
      }

# Lane count & lighting penalties
assign lanes_penalty =
  ${
    axes.enableEnvironmentPenalties !== false
      ? `if lanes=3|4|5|6|7|8 then ${fmtNum(axes.multiLanePenalty)}
  else 0.0`
      : '0.0'
  }

assign lit_penalty =
  ${
    axes.enableEnvironmentPenalties !== false
      ? `if lit=no then ${fmtNum(axes.unlitPenalty)}
  else if lit= then ${fmtNum(axes.untaggedLitPenalty)}
  else 0.0`
      : '0.0'
  }

# Environment & scenery estimate penalties (estimated_noise_class=1..6, estimated_forest_class=1..6)
assign noise_penalty =
   ${
     axes.enableNoisePenalties !== false
       ? `switch estimated_noise_class=   ${fmtNum(axes.noiseUntaggedPenalty)}
   switch estimated_noise_class=1  ${fmtNum(axes.noiseClass1Penalty)}
   switch estimated_noise_class=2  ${fmtNum(axes.noiseClass2Penalty)}
   switch estimated_noise_class=3  ${fmtNum(axes.noiseClass3Penalty)}
   switch estimated_noise_class=4  ${fmtNum(axes.noiseClass4Penalty)}
   switch estimated_noise_class=5  ${fmtNum(axes.noiseClass5Penalty)}
   switch estimated_noise_class=6  ${fmtNum(axes.noiseClass6Penalty)} 0.0`
       : '0.0'
   }

assign no_forest_penalty =
   ${
     axes.enableEnvironmentPenalties !== false
       ? `multiply ${fmtNum(axes.noForestPenalty)}
   switch estimated_forest_class=   1.0
   switch estimated_forest_class=1  0.5
   switch estimated_forest_class=2  0.4
   switch estimated_forest_class=3  0.25
   switch estimated_forest_class=4  0.15
   switch estimated_forest_class=5  0.1
   switch estimated_forest_class=6  0.0 0.0`
       : '0.0'
   }

# Penalty on ordinary roads that are not part of a designated bike route or cycle/bus lane
assign non_cycleroute_road_penalty =
  if and stick_to_cycleroutes and is_road not is_safe_road then ${fmtNum(axes.nonCycleRouteRoadPenalty)}
  else 0.0

assign costfactor
  switch and highway= not route=ferry  10000
  switch or highway=proposed highway=abandoned 10000

  min 10000
  add 1.0
  add max onewaypenalty accesspenalty
  add trafficpenalty
  add lanes_penalty
  add lit_penalty
  add no_forest_penalty
  add noise_penalty
  add non_cycleroute_road_penalty
  add surface_penalty

  switch or highway=motorway highway=motorway_link    switch allow_motorways 0.5 10000
  switch or highway=trunk highway=trunk_link
         ${
           axes.allowUrbanTrunks
             ? `switch is_urban_trunk ${fmtNum(axes.primaryCost)}
         switch allow_motorways 0.5 ${fmtNum(axes.trunkCost)}`
             : `switch allow_motorways 0.5 ${fmtNum(axes.trunkCost)}`
         }
  switch or highway=primary highway=primary_link      ${fmtNum(axes.primaryCost)}
  switch or highway=secondary highway=secondary_link  ${fmtNum(axes.secondaryCost)}
  switch or highway=tertiary highway=tertiary_link    ${fmtNum(axes.tertiaryCost)}
  switch    highway=unclassified                      ${fmtNum(axes.unclassifiedCost)}
  switch    isresidentialorliving                     ${fmtNum(axes.residentialCost)}
  switch    highway=service                           ${fmtNum(axes.serviceCost)}
  switch    highway=cycleway                          switch is_shared_cycleway ${fmtNum(axes.cyclewaySharedCost)} ${fmtNum(axes.cyclewayCost)}
  switch    highway=bridleway                         ${fmtNum(axes.bridlewayCost)}
  switch    highway=pedestrian                        ${fmtNum(axes.pedestrianCost)}
  switch    highway=footway                           ${fmtNum(axes.footwayCost)}
  switch    highway=path                              ${fmtNum(axes.pathCost)}
  switch    highway=steps                             switch allow_steps ${fmtNum(axes.stepsCost)} 10000
  switch    route=ferry                               switch allow_ferries ${fmtNum(axes.ferryCost)} 10000
  switch or highway=track highway=road
   switch tracktype=grade1 ${fmtNum(axes.trackGrade1Cost)}
   switch tracktype=grade2 ${fmtNum(axes.trackGrade2Cost)}
   switch tracktype=grade3 ${fmtNum(axes.trackGrade3Cost)}
   switch tracktype=grade4 ${fmtNum(axes.trackGrade4Cost)}
   switch tracktype=grade5 ${fmtNum(axes.trackGrade4Cost)}
   ${fmtNum(axes.trackUntaggedCost)}
  9.0

# way priorities used for voice hint generation
assign priorityclassifier =
  if      ( highway=motorway                         ) then  30
  else if ( highway=motorway_link                    ) then  29
  else if ( highway=trunk                            ) then  28
  else if ( highway=trunk_link                       ) then  27
  else if ( highway=primary                          ) then  26
  else if ( highway=primary_link                     ) then  25
  else if ( highway=secondary                        ) then  24
  else if ( highway=secondary_link                   ) then  23
  else if ( highway=tertiary                         ) then  22
  else if ( highway=tertiary_link                    ) then  21
  else if ( highway=unclassified                     ) then  20
  else if ( isresidentialorliving                    ) then  6
  else if ( highway=service                          ) then  6
  else if ( highway=cycleway                         ) then  6
  else if ( or bicycle=designated bicycle_road=yes   ) then  6
  else if ( highway=track                            ) then if tracktype=grade1 then 6 else 4
  else if ( highway=bridleway|road|path|footway      ) then  4
  else if ( highway=steps                            ) then  2
  else if ( highway=pedestrian                       ) then  2
  else 0

assign isbadoneway = not equal onewaypenalty 0
assign isgoodoneway = if reversedirection=yes then oneway=-1
                      else if oneway= then junction=roundabout else oneway=yes|true|1
assign isroundabout = junction=roundabout
assign islinktype = highway=motorway_link|trunk_link|primary_link|secondary_link|tertiary_link
assign isgoodforcars = if greater priorityclassifier 6 then true
                  else if ( or isresidentialorliving highway=service ) then true
                  else if ( and highway=track tracktype=grade1 ) then true
                  else false

assign classifiermask add          isbadoneway
                      add multiply isgoodoneway   2
                      add multiply isroundabout   4
                      add multiply islinktype     8
                          multiply isgoodforcars 16

assign dummyUsage = smoothness=


---context:node  # following code refers to node tags

assign defaultaccess
       switch access=
              1
              switch or access=private access=no
                     0
                     1

assign bikeaccess
       or nodeaccessgranted=yes
          switch bicycle=
                 switch vehicle=
                        defaultaccess
                        switch or vehicle=private vehicle=no
                               0
                               1
                 switch or bicycle=private or bicycle=no bicycle=dismount
                        0
                        1

assign footaccess
       or bicycle=dismount
          switch foot=
                 defaultaccess
                 switch or foot=private foot=no
                        0
                        1

assign signal_or_stop_cost =
    switch or highway=traffic_signals and highway=crossing crossing=traffic_signals ${fmtNum(axes.enableTurnPenalties !== false ? axes.trafficSignalCost : 0)}
    switch highway=stop|give_way|mini_roundabout ${fmtNum(axes.enableTurnPenalties !== false ? axes.stopGiveWayCost : 0)}
    0

assign crossing_node_cost =
    multiply ${fmtNum(axes.enableTurnPenalties !== false ? axes.busyCrossingCost : 0)}
    switch estimated_crossing_class=1 0.15
    switch estimated_crossing_class=2 0.3
    switch estimated_crossing_class=3 0.5
    switch estimated_crossing_class=4 0.7
    switch estimated_crossing_class=5 0.85
    switch estimated_crossing_class=6 1.0 0.0

assign initialcost
    add max signal_or_stop_cost crossing_node_cost
       switch bikeaccess
              0
              switch footaccess
                     ${fmtNum(axes.enableTurnPenalties !== false ? axes.dismountNodeCost : 0)}
                     1000000
`;
}

const CUSTOM_PROFILES_STORAGE_KEY = 'rsrouter_custom_profiles';

export function loadSavedCustomProfiles(): CustomProfileRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.dsl === 'string' &&
          item.axes &&
          typeof item.axes === 'object',
      )
      .map((item: any) => {
        const baseTemplate: BaseTemplateId =
          item.baseTemplate in TEMPLATE_PRESETS ? item.baseTemplate : 'gabis-fast-city';
        const axes = normalizeProfileAxes(item.axes, baseTemplate);
        return {
          ...item,
          baseTemplate,
          axes,
          dsl:
            item.mode === 'dsl'
              ? item.dsl
              : generateBrfFromAxes(axes, { name: item.name, summary: item.summary }),
        };
      });
  } catch {
    return [];
  }
}

export function saveCustomProfilesToStorage(profiles: CustomProfileRecord[]): void {
  try {
    localStorage.setItem(CUSTOM_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.warn('Could not save custom profiles:', err);
  }
}

export async function downloadBrfFile(content: string, filename: string): Promise<void> {
  const safeName = filename.endsWith('.brf') ? filename : `${filename}.brf`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
