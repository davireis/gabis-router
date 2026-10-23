import React, { useState, useEffect, useRef } from 'react';
import type { useRouting } from '../hooks/useRouting.ts';
import {
  downloadBrfFile,
  generateBrfFromAxes,
  normalizeProfileAxes,
  TEMPLATE_PRESETS,
  type BaseTemplateId,
  type CustomProfileRecord,
  type ProfileAxes,
} from '../utils/profile-editor.ts';
import { InfoButton } from './TooltipPopover.tsx';
import { Icon } from './common/Icon.tsx';

interface ProfileEditorPanelProps {
  routing: ReturnType<typeof useRouting>;
  onClose: () => void;
}

const BASE_TEMPLATE_ORDER: BaseTemplateId[] = [
  'gabis-safe-road',
  'gabis-fast-city',
  'gabis-lite-gravel',
];

const DRAFT_PROFILE_ID = 'custom:__draft__';

interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  tooltip?: string;
  disallowable?: boolean;
  formatValue?: (v: number) => string;
  onChange: (val: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = '',
  tooltip,
  disallowable = false,
  formatValue,
  onChange,
}) => {
  const isDisallowed = disallowable && value >= 9999;
  const lastFiniteRef = useRef<number>(value < 9999 && Number.isFinite(value) ? value : max);
  if (!isDisallowed && Number.isFinite(value)) {
    lastFiniteRef.current = value;
  }

  const safeVal = isDisallowed ? max : Number.isFinite(value) ? value : min;
  const displayVal = isDisallowed
    ? '10000'
    : formatValue
      ? formatValue(safeVal)
      : `${Number(safeVal.toFixed(3))}${unit ? ` ${unit}` : ''}`;

  return (
    <div className="pe-slider-row">
      <div className="pe-slider-header">
        <span className="pe-slider-label">
          {label}
          {tooltip && <InfoButton tooltip={tooltip} ariaLabel={label} />}
        </span>
        <div className="pe-slider-right">
          {disallowable && (
            <label
              className={`pe-disallow-check ${isDisallowed ? 'active' : ''}`}
              title="Explicitly forbid this class in BRouter (sets costfactor = 10000)"
            >
              <input
                id={`${id}-disallow`}
                type="checkbox"
                checked={isDisallowed}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange(10000);
                  } else {
                    onChange(lastFiniteRef.current);
                  }
                }}
              />
              <span>Disallow</span>
            </label>
          )}
          <span className={`pe-slider-val ${isDisallowed ? 'disallowed' : ''}`}>{displayVal}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="pe-range-input"
        min={min}
        max={max}
        step={step}
        value={safeVal}
        disabled={isDisallowed}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  tooltip?: string;
  onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ id, label, checked, tooltip, onChange }) => (
  <div className="pe-toggle-row">
    <span className="pe-toggle-label">
      {label}
      {tooltip && <InfoButton tooltip={tooltip} ariaLabel={label} />}
    </span>
    <label className="offline-mode-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="offline-slider"></span>
    </label>
  </div>
);

interface SectionSummarySwitchProps {
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

const SectionSummarySwitch: React.FC<SectionSummarySwitchProps> = ({
  id,
  checked,
  label,
  onChange,
}) => (
  <label
    className="offline-mode-toggle pe-section-toggle"
    htmlFor={id}
    title={checked ? `Disable ${label}` : `Enable ${label}`}
    onClick={(e) => e.stopPropagation()}
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      aria-label={`Enable ${label}`}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="offline-slider"></span>
  </label>
);

function slugifyProfileId(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `custom:${slug || 'my-profile'}`;
}

export const ProfileEditorPanel: React.FC<ProfileEditorPanelProps> = ({ routing, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialCustom = routing.customProfiles.find((c) => c.id === routing.profile);
  const initialTemplate: BaseTemplateId =
    initialCustom?.baseTemplate ||
    (routing.profile === 'gabis-fast-city' || routing.profile === 'gabis-lite-gravel'
      ? (routing.profile as BaseTemplateId)
      : 'gabis-safe-road');

  const [selectedSource, setSelectedSource] = useState<string>(
    initialCustom ? initialCustom.id : initialTemplate,
  );
  const [baseTemplate, setBaseTemplate] = useState<BaseTemplateId>(initialTemplate);
  const [profileName, setProfileName] = useState<string>(
    initialCustom ? initialCustom.name : `${TEMPLATE_PRESETS[initialTemplate].shortLabel} Custom`,
  );
  const [profileSummary, setProfileSummary] = useState<string>(
    initialCustom ? initialCustom.summary : TEMPLATE_PRESETS[initialTemplate].summary,
  );
  const [mode, setMode] = useState<'detailed' | 'dsl'>(initialCustom?.mode || 'detailed');
  const [axes, setAxes] = useState<ProfileAxes>(() =>
    initialCustom
      ? normalizeProfileAxes(initialCustom.axes, initialTemplate)
      : { ...TEMPLATE_PRESETS[initialTemplate].axes },
  );
  const [dslText, setDslText] = useState<string>(() =>
    initialCustom
      ? initialCustom.mode === 'dsl'
        ? initialCustom.dsl
        : generateBrfFromAxes(normalizeProfileAxes(initialCustom.axes, initialTemplate), {
            name: initialCustom.name,
            summary: initialCustom.summary,
          })
      : generateBrfFromAxes(TEMPLATE_PRESETS[initialTemplate].axes, {
          name: `${TEMPLATE_PRESETS[initialTemplate].shortLabel} Custom`,
          summary: TEMPLATE_PRESETS[initialTemplate].summary,
        }),
  );
  const [dslDirty, setDslDirty] = useState<boolean>(initialCustom?.mode === 'dsl');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const activeProfileIdRef = useRef<string>(
    initialCustom ? initialCustom.id : DRAFT_PROFILE_ID,
  );
  const didMountInitRef = useRef<boolean>(false);
  const lastSubmittedDslRef = useRef<string>(dslText);

  // When editor mounts, set slot 0 to the active edited profile and auto-add the base template in slot 1 for live comparison
  useEffect(() => {
    if (didMountInitRef.current) return;
    didMountInitRef.current = true;

    const targetId = activeProfileIdRef.current;
    lastSubmittedDslRef.current = dslText;
    routing.updateCustomProfileDsl(targetId, dslText, false);

    const prevPrimary = routing.slots[0]?.profile;
    if (prevPrimary !== targetId) {
      routing.setSlotProfile(0, targetId);
    }

    const compareProf =
      prevPrimary && !prevPrimary.startsWith('custom:') ? prevPrimary : baseTemplate;
    if (routing.slots.length === 1) {
      routing.addProfileSlot(compareProf);
    }
  }, []);

  // Debounced live route update whenever dslText changes
  useEffect(() => {
    if (dslText === lastSubmittedDslRef.current) return;
    const timer = setTimeout(() => {
      lastSubmittedDslRef.current = dslText;
      routing.updateCustomProfileDsl(activeProfileIdRef.current, dslText, true);
    }, 140);
    return () => clearTimeout(timer);
  }, [dslText, routing.updateCustomProfileDsl]);

  const handleAxisChange = <K extends keyof ProfileAxes>(key: K, value: ProfileAxes[K]) => {
    setAxes((prev) => {
      const next = { ...prev, [key]: value };
      const nextDsl = generateBrfFromAxes(next, {
        name: profileName,
        summary: profileSummary,
      });
      setDslText(nextDsl);
      setDslDirty(false);
      return next;
    });
  };

  const handleSelectSource = (val: string) => {
    setSelectedSource(val);
    if (val in TEMPLATE_PRESETS) {
      const tpl = val as BaseTemplateId;
      const preset = TEMPLATE_PRESETS[tpl];
      const nextName = `${preset.shortLabel} Custom`;
      setBaseTemplate(tpl);
      setProfileName(nextName);
      setProfileSummary(preset.summary);
      setAxes({ ...preset.axes });
      const nextDsl = generateBrfFromAxes(preset.axes, {
        name: nextName,
        summary: preset.summary,
      });
      lastSubmittedDslRef.current = nextDsl;
      setDslText(nextDsl);
      setDslDirty(false);
      activeProfileIdRef.current = DRAFT_PROFILE_ID;
      routing.updateCustomProfileDsl(DRAFT_PROFILE_ID, nextDsl, false);
      routing.setSlotProfile(0, DRAFT_PROFILE_ID);
      if (routing.slots.length >= 2) {
        routing.setSlotProfile(1, tpl);
      }
      return;
    }

    const saved = routing.customProfiles.find((c) => c.id === val);
    if (saved) {
      const normAxes = normalizeProfileAxes(saved.axes, saved.baseTemplate);
      setBaseTemplate(saved.baseTemplate);
      setProfileName(saved.name);
      setProfileSummary(saved.summary);
      setMode(saved.mode);
      setAxes(normAxes);
      lastSubmittedDslRef.current = saved.dsl;
      setDslText(saved.dsl);
      setDslDirty(saved.mode === 'dsl');
      activeProfileIdRef.current = saved.id;
      routing.updateCustomProfileDsl(saved.id, saved.dsl, false);
      routing.setSlotProfile(0, saved.id);
    }
  };

  const handleResetToTemplate = () => {
    const preset = TEMPLATE_PRESETS[baseTemplate];
    setAxes({ ...preset.axes });
    const nextDsl = generateBrfFromAxes(preset.axes, {
      name: profileName,
      summary: profileSummary,
    });
    setDslText(nextDsl);
    setDslDirty(false);
  };

  const handleSaveProfile = () => {
    const trimmedName = profileName.trim() || 'Custom Profile';
    const id = slugifyProfileId(trimmedName);
    const finalDsl = dslDirty
      ? dslText
      : generateBrfFromAxes(axes, { name: trimmedName, summary: profileSummary });

    const record: CustomProfileRecord = {
      id,
      name: trimmedName,
      summary: profileSummary.trim() || 'Custom cycling profile.',
      baseTemplate,
      mode: dslDirty ? 'dsl' : mode,
      axes: { ...axes },
      dsl: finalDsl,
      updatedAt: Date.now(),
    };

    activeProfileIdRef.current = id;
    lastSubmittedDslRef.current = finalDsl;
    setSelectedSource(id);
    setDslText(finalDsl);
    routing.saveCustomProfile(record);
    routing.setSlotProfile(0, id);

    setSaveToast(`Saved "${trimmedName}"`);
    setTimeout(() => setSaveToast(null), 2200);
  };

  const handleDeleteCurrent = () => {
    const saved = routing.customProfiles.find((c) => c.id === selectedSource);
    if (!saved) return;
    routing.deleteCustomProfile(saved.id);
    handleSelectSource(baseTemplate);
  };

  const handleExportBrf = async () => {
    const slug = (profileName || 'custom-profile')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '-');
    await downloadBrfFile(dslText, `${slug}.brf`);
    routing.setStatus(`Exported ${slug}.brf`);
  };

  const handleImportBrfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      if (!text.trim()) return;
      const stem = file.name.replace(/\.brf$/i, '').replace(/[-_]+/g, ' ');
      const formattedName = stem.charAt(0).toUpperCase() + stem.slice(1);
      setProfileName(formattedName);
      setProfileSummary(`Imported from ${file.name}`);
      lastSubmittedDslRef.current = text;
      setDslText(text);
      setDslDirty(true);
      setMode('dsl');
      activeProfileIdRef.current = DRAFT_PROFILE_ID;
      routing.updateCustomProfileDsl(DRAFT_PROFILE_ID, text, false);
      routing.setSlotProfile(0, DRAFT_PROFILE_ID);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isSavedCustomSelected = routing.customProfiles.some((c) => c.id === selectedSource);

  return (
    <div id="profile-editor-panel" className="pe-panel">
      <div className="pe-header">
        <div className="pe-header-top">
          <div className="pe-title-wrap">
            <Icon name="sliders" size={15} />
            <h2>Profile Editor</h2>
          </div>
          <button
            id="btn-close-profile-editor"
            type="button"
            className="collapse-btn"
            title="Close Profile Editor"
            aria-label="Close Profile Editor"
            onClick={onClose}
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        <div className="pe-toolbar-row">
          <div className="pe-source-field">
            <label htmlFor="pe-source-select">Base / Saved</label>
            <select
              id="pe-source-select"
              value={selectedSource}
              onChange={(e) => handleSelectSource(e.target.value)}
            >
              <optgroup label="Starting Templates (Gabi's Profiles)">
                {BASE_TEMPLATE_ORDER.map((id) => (
                  <option key={id} value={id}>
                    Fork: {TEMPLATE_PRESETS[id].name}
                  </option>
                ))}
              </optgroup>
              {routing.customProfiles.length > 0 && (
                <optgroup label="Saved Custom Profiles">
                  {routing.customProfiles.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="pe-name-field">
            <label htmlFor="pe-name-input">Profile Name</label>
            <input
              id="pe-name-input"
              type="text"
              value={profileName}
              placeholder="My Custom Profile"
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
        </div>

        <div className="pe-mode-bar">
          <div className="pe-mode-tabs" role="tablist" aria-label="Profile editor mode">
            <button
              id="tab-pe-detailed"
              type="button"
              role="tab"
              aria-selected={mode === 'detailed'}
              className={`pe-mode-tab ${mode === 'detailed' ? 'active' : ''}`}
              onClick={() => setMode('detailed')}
            >
              <Icon name="sliders" size={13} />
              <span>Detailed Multi-Axis</span>
            </button>
            <button
              id="tab-pe-dsl"
              type="button"
              role="tab"
              aria-selected={mode === 'dsl'}
              className={`pe-mode-tab ${mode === 'dsl' ? 'active' : ''}`}
              onClick={() => setMode('dsl')}
            >
              <Icon name="code" size={13} />
              <span>Advanced DSL (.brf)</span>
            </button>
          </div>

          <button
            id="btn-pe-reset"
            type="button"
            className="btn-toolbar-mini"
            title="Reset all axes to the base template defaults"
            onClick={handleResetToTemplate}
          >
            <Icon name="refresh" size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {routing.customProfileError && (
        <div id="pe-error-banner" className="pe-error-banner" role="alert">
          <strong>DSL Parse Error:</strong> {routing.customProfileError}
        </div>
      )}

      {mode === 'detailed' ? (
        <div className="pe-body pe-detailed-body">
          {dslDirty && (
            <div className="pe-dirty-notice">
              <span>Custom DSL edits are active. Moving any slider will regenerate the DSL from sliders.</span>
            </div>
          )}

          <div className="pe-formula-card">
            <div className="pe-formula-header">
              <span className="pe-formula-title">
                How each street is scored
                <InfoButton
                  tooltip="Every street starts at 1.0 (its physical length). All way penalties in Group A start at +0.0 (no penalty) and add together: 1.0 + road_penalty + surface_penalty + cycle_network_penalty + traffic_penalty. BRouter adds penalties instead of multiplying them so overlapping OSM tags (such as highway=track + surface=unpaved) do not compound into extreme 100x detours. Each +1.0 means you would ride 1 extra metre of ideal road per metre of that feature."
                  ariaLabel="How each street is scored"
                />
              </span>
            </div>
            <div className="pe-formula-flow">
              <span className="pe-flow-op">length &times; ( 1.0 +</span>
              <span className="pe-flow-step pe-flow-a">
                <strong>A</strong> Way Penalties (+0.0+)
              </span>
              <span className="pe-flow-op">) +</span>
              <span className="pe-flow-step pe-flow-c">
                <strong>B</strong> Hills &amp; Turns (+m)
              </span>
            </div>
            <div className="pe-formula-example">
              Why additive? Penalties add on top of <strong>1.0</strong> so overlapping OSM tags (e.g. Track + Unpaved) don&apos;t multiply into extreme detours: 100 m &times; (<strong>1.0</strong> + Unclassified <strong>+0.1</strong> + Gravel <strong>+5.0</strong>) = <strong>610 m</strong>.
            </div>
          </div>

          <div className="pe-group-banner pe-group-a">
            <span className="pe-group-pill">A</span>
            <div className="pe-group-text">
              <strong>Additive Way Penalties (+0.0 = no penalty, added to 1.0 base length)</strong>
              <span>Cycle Network + Road/Path + Surface + Traffic add together per metre</span>
            </div>
          </div>

          {/* Section 1: Cycle Networks & Access */}
          <details className="pe-section" open>
            <summary className="pe-section-summary">
              <span>1. Cycle Networks &amp; Access (route=bicycle)</span>
              <span className="pe-section-badge pe-badge-a">+0–2</span>
            </summary>
            <div className="pe-section-content">
              <ToggleRow
                id="pe-stick-cycleroutes"
                label="Prefer designated cycle routes (lcn / rcn / ncn)"
                checked={axes.stickToCycleRoutes}
                tooltip="OSM route=bicycle relations with network=lcn, rcn, ncn, or icn (e.g. London Cycleways and National Cycle Network). When enabled, ordinary motor roads outside cycle relations or cycle lanes receive the additive penalty below."
                onChange={(v) => handleAxisChange('stickToCycleRoutes', v)}
              />
              <SliderRow
                id="pe-non-cycleroute-penalty"
                label="Non-cycle-route road penalty"
                value={axes.nonCycleRouteRoadPenalty}
                min={0.0}
                max={2.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty (+0.0 = no penalty) added per metre to motor roads that lack route=bicycle relations, cycleway=* lanes/tracks, or bicycle=designated access."
                onChange={(v) => handleAxisChange('nonCycleRouteRoadPenalty', v)}
              />
              <ToggleRow
                id="pe-use-proposed"
                label="Include proposed cycle routes (state=proposed)"
                checked={axes.useProposedCycleRoutes}
                tooltip="OSM cycle route relations tagged state=proposed. Treats planned or newly built cycle routes awaiting sign-off as active cycle networks."
                onChange={(v) => handleAxisChange('useProposedCycleRoutes', v)}
              />
              <ToggleRow
                id="pe-allow-buslanes"
                label="Treat bus lanes as cycleways (busway=*)"
                checked={axes.allowBusLanes}
                tooltip="OSM busway=lane, busway:left=lane, or busway:right=lane. Exempts roads with dedicated bus lanes from the non-cycle-route penalty and caps their traffic penalty."
                onChange={(v) => handleAxisChange('allowBusLanes', v)}
              />
              <ToggleRow
                id="pe-allow-urban-trunks"
                label="Treat urban trunk A-roads as primary (lit & ≤ 30 mph)"
                checked={axes.allowUrbanTrunks}
                tooltip="When enabled (as in Fast City), urban highway=trunk roads that are both lit=yes and posted ≤ 30 mph (maxspeed=10|20|30|40|50|urban in BRouter's km/h lookup) use the Primary (highway=primary) penalty instead of the Trunk penalty. When disabled (as in Safe Road), all non-motorroad trunk roads use the Trunk penalty in Section 2."
                onChange={(v) => handleAxisChange('allowUrbanTrunks', v)}
              />
            </div>
          </details>

          {/* Section 2: OSM Way Types (highway=*, aligned with Route Summary Road Type classes) */}
          <details className="pe-section" open>
            <summary className="pe-section-summary">
              <span>2. Road Type (highway=*)</span>
              <span className="pe-section-badge pe-badge-a">+0–20</span>
            </summary>
            <div className="pe-section-content">
              <div className="pe-subsection-header">
                <span>2a. Arterial Roads (trunk, primary)</span>
                <span className="pe-section-badge pe-badge-a">+0–10</span>
              </div>
              <SliderRow
                id="pe-trunk-cost"
                label="Trunk (highway=trunk)"
                value={axes.trunkCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=trunk and trunk_link: primary UK red-sign A-roads and TfL Red Routes. Applies to all non-motorroad trunk roads when the urban trunk toggle in Section 1 is off, or only to non-urban trunks when urban trunks are treated as primary roads. Trunk roads tagged motorroad=yes are always forbidden (10000)."
                onChange={(v) => handleAxisChange('trunkCost', v)}
              />
              <SliderRow
                id="pe-primary-cost"
                label="Primary (highway=primary)"
                value={axes.primaryCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=primary and primary_link: major arterial roads linking large towns or city districts (typically standard UK A-roads)."
                onChange={(v) => handleAxisChange('primaryCost', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>2b. Main Roads (secondary, tertiary)</span>
                <span className="pe-section-badge pe-badge-a">+0–10</span>
              </div>
              <SliderRow
                id="pe-secondary-cost"
                label="Secondary (highway=secondary)"
                value={axes.secondaryCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=secondary and secondary_link: distributor roads connecting smaller towns and urban neighbourhoods (typically UK B-roads)."
                onChange={(v) => handleAxisChange('secondaryCost', v)}
              />
              <SliderRow
                id="pe-tertiary-cost"
                label="Tertiary (highway=tertiary)"
                value={axes.tertiaryCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=tertiary and tertiary_link: local collector streets linking villages, suburbs, and residential estates (classified C-roads)."
                onChange={(v) => handleAxisChange('tertiaryCost', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>2c. Quiet &amp; Minor Roads (unclassified, residential, service)</span>
                <span className="pe-section-badge pe-badge-a">+0–10</span>
              </div>
              <SliderRow
                id="pe-unclassified-cost"
                label="Unclassified (highway=unclassified)"
                value={axes.unclassifiedCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=unclassified: minor public through-roads of the lowest motor hierarchy, including rural country lanes and non-residential urban connectors."
                onChange={(v) => handleAxisChange('unclassifiedCost', v)}
              />
              <SliderRow
                id="pe-residential-cost"
                label="Residential (highway=residential|living_street)"
                value={axes.residentialCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=residential and highway=living_street: local streets providing direct access to housing without a through-traffic function."
                onChange={(v) => handleAxisChange('residentialCost', v)}
              />
              <SliderRow
                id="pe-service-cost"
                label="Service (highway=service)"
                value={axes.serviceCost}
                min={0.0}
                max={10.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=service: access roads to estates, parks, industrial sites, parking aisles, or alleys."
                onChange={(v) => handleAxisChange('serviceCost', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>2d. Cycleways &amp; Paths (cycleway, path, footway, bridleway, pedestrian)</span>
                <span className="pe-section-badge pe-badge-a">+0–20</span>
              </div>
              <SliderRow
                id="pe-cycleway-cost"
                label="Cycleway, segregated (highway=cycleway)"
                value={axes.cyclewayCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=cycleway where cyclists are dedicated or physically separated from pedestrians (segregated=yes or no shared foot=designated)."
                onChange={(v) => handleAxisChange('cyclewayCost', v)}
              />
              <SliderRow
                id="pe-cycleway-shared-cost"
                label="Cycleway, shared foot (segregated=no)"
                value={axes.cyclewaySharedCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=cycleway with segregated=no, or foot=designated without segregated=yes. Common on shared park paths (e.g. Tooting Common) and canal towpaths where cyclists share space with pedestrians."
                onChange={(v) => handleAxisChange('cyclewaySharedCost', v)}
              />
              <SliderRow
                id="pe-path-cost"
                label="Path (highway=path)"
                value={axes.pathCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=path: generic multi-use or non-specific off-road paths not tagged as highway=cycleway or highway=footway (often narrow park trails, desire lines, or woodland paths)."
                onChange={(v) => handleAxisChange('pathCost', v)}
              />
              <SliderRow
                id="pe-footway-cost"
                label="Footway (highway=footway)"
                value={axes.footwayCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=footway: ways designated mainly or exclusively for pedestrians (pavements, park walks, footpaths). An extra +5 access penalty is added when bicycle=yes/designated/permissive is absent."
                onChange={(v) => handleAxisChange('footwayCost', v)}
              />
              <SliderRow
                id="pe-bridleway-cost"
                label="Bridleway (highway=bridleway)"
                value={axes.bridlewayCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=bridleway: trails designated for equestrians where cyclists have legal right of way in England and Wales (Countryside Act 1968), often unpaved."
                onChange={(v) => handleAxisChange('bridlewayCost', v)}
              />
              <SliderRow
                id="pe-pedestrian-cost"
                label="Pedestrian (highway=pedestrian)"
                value={axes.pedestrianCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=pedestrian: pedestrianized shopping streets, civic squares, and plazas reserved primarily for foot traffic."
                onChange={(v) => handleAxisChange('pedestrianCost', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>2e. Tracks (highway=track, tracktype=grade1–5)</span>
                <span className="pe-section-badge pe-badge-a">+0–20</span>
              </div>
              <SliderRow
                id="pe-track-g1"
                label="Track Grade 1 (tracktype=grade1)"
                value={axes.trackGrade1Cost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=track with tracktype=grade1: agricultural or forestry track with a solid paved, sealed, or heavily compacted hard surface."
                onChange={(v) => handleAxisChange('trackGrade1Cost', v)}
              />
              <SliderRow
                id="pe-track-g2"
                label="Track Grade 2 (tracktype=grade2)"
                value={axes.trackGrade2Cost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=track with tracktype=grade2 (or untagged paved track): mostly solid unpaved gravel or crushed-stone farm/forest road."
                onChange={(v) => handleAxisChange('trackGrade2Cost', v)}
              />
              <SliderRow
                id="pe-track-g3"
                label="Track Grade 3 (tracktype=grade3)"
                value={axes.trackGrade3Cost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=track with tracktype=grade3 (or untagged unpaved track): even mixture of hard and soft materials, often two gravel wheel ruts with grass or soil in the centre."
                onChange={(v) => handleAxisChange('trackGrade3Cost', v)}
              />
              <SliderRow
                id="pe-track-g4"
                label="Track Grade 4–5 (tracktype=grade4|5)"
                value={axes.trackGrade4Cost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) for OSM highway=track with tracktype=grade4 (mostly soft soil/sand/grass with some hard material) or tracktype=grade5 (unlaminated soft earth, mud, or grass field track)."
                onChange={(v) => handleAxisChange('trackGrade4Cost', v)}
              />
              <SliderRow
                id="pe-track-untagged"
                label="Track, untagged grade (tracktype= missing)"
                value={axes.trackUntaggedCost}
                min={0.0}
                max={20.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when an OSM highway=track or highway=road has no tracktype=* grade tag in OpenStreetMap (uncertain track quality)."
                onChange={(v) => handleAxisChange('trackUntaggedCost', v)}
              />
            </div>
          </details>

          {/* Section 3: OSM Surface Penalties (surface=*, aligned with Route Summary Surface classes & subclasses) */}
          <details className={`pe-section ${!axes.enableSurfacePenalties ? 'pe-section-disabled' : ''}`} open>
            <summary className="pe-section-summary">
              <span>3. Surface Penalties (surface=*)</span>
              <div className="pe-section-summary-right">
                <span className={`pe-section-badge ${axes.enableSurfacePenalties ? 'pe-badge-a' : 'pe-badge-off'}`}>
                  {axes.enableSurfacePenalties ? '+0–15' : 'Off'}
                </span>
                <SectionSummarySwitch
                  id="pe-enable-surface"
                  checked={axes.enableSurfacePenalties}
                  label="Surface Penalties"
                  onChange={(v) => handleAxisChange('enableSurfacePenalties', v)}
                />
              </div>
            </summary>
            <div className={`pe-section-content ${!axes.enableSurfacePenalties ? 'pe-content-disabled' : ''}`}>
              <div className="pe-subsection-note">
                Organized into the same 6 Surface classes and 16 subclasses shown in the Route Summary. Click any Surface chip in the Route Summary to inspect its subclasses along the route.
              </div>

              <div className="pe-subsection-header">
                <span>3a. Smooth Paved (asphalt, paved, concrete)</span>
                <span className="pe-section-badge pe-badge-a">+0–15</span>
              </div>
              <SliderRow
                id="pe-surf-asphalt"
                label="Asphalt (surface=asphalt)"
                value={axes.asphaltPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=asphalt (tarmac/bitumen macadam) or smoothness=excellent|good."
                onChange={(v) => handleAxisChange('asphaltPenalty', v)}
              />
              <SliderRow
                id="pe-surf-paved"
                label="Paved / Sealed (surface=paved)"
                value={axes.pavedPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=paved (generic sealed pavement, chipseal, or brick in BRouter's lookup)."
                onChange={(v) => handleAxisChange('pavedPenalty', v)}
              />
              <SliderRow
                id="pe-surf-concrete"
                label="Concrete (surface=concrete)"
                value={axes.concretePenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=concrete (includes concrete slabs, concrete:plates, concrete:lanes, and cement)."
                onChange={(v) => handleAxisChange('concretePenalty', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>3b. Paving &amp; Cobbles (paving_stones, sett, cobblestone)</span>
                <span className="pe-section-badge pe-badge-a">+0–15</span>
              </div>
              <SliderRow
                id="pe-surf-paving-stones"
                label="Paving Stones (surface=paving_stones)"
                value={axes.pavingStonesPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=paving_stones: flat, closely fitted concrete or stone block pavers/flagstones."
                onChange={(v) => handleAxisChange('pavingStonesPenalty', v)}
              />
              <SliderRow
                id="pe-surf-sett"
                label="Sett (surface=sett)"
                value={axes.settPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=sett: dressed rectangular granite or stone blocks with mortar joints."
                onChange={(v) => handleAxisChange('settPenalty', v)}
              />
              <SliderRow
                id="pe-surf-cobble"
                label="Cobblestone (surface=cobblestone)"
                value={axes.cobblestonePenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=cobblestone: traditional uncut, rounded or irregular cobbles."
                onChange={(v) => handleAxisChange('cobblestonePenalty', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>3c. Compacted (compacted, fine_gravel)</span>
                <span className="pe-section-badge pe-badge-a">+0–15</span>
              </div>
              <SliderRow
                id="pe-surf-compacted"
                label="Compacted (surface=compacted)"
                value={axes.compactedPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=compacted (hard-packed rolled mineral aggregate bound with fines, common on UK canal towpaths and park trails) or smoothness=intermediate."
                onChange={(v) => handleAxisChange('compactedPenalty', v)}
              />
              <SliderRow
                id="pe-surf-fine-gravel"
                label="Fine Gravel (surface=fine_gravel)"
                value={axes.fineGravelPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=fine_gravel: small crushed stone grit or fine aggregate."
                onChange={(v) => handleAxisChange('fineGravelPenalty', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>3d. Gravel (gravel, pebblestone)</span>
                <span className="pe-section-badge pe-badge-a">+0–15</span>
              </div>
              <SliderRow
                id="pe-surf-gravel"
                label="Gravel (surface=gravel)"
                value={axes.gravelPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=gravel: loose crushed rock or coarse gravel stones."
                onChange={(v) => handleAxisChange('gravelPenalty', v)}
              />
              <SliderRow
                id="pe-surf-pebblestone"
                label="Pebblestone (surface=pebblestone)"
                value={axes.pebblestonePenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=pebblestone: loose rounded pebbles or shingle."
                onChange={(v) => handleAxisChange('pebblestonePenalty', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>3e. Unpaved &amp; Natural (unpaved, dirt, grass, mud, wood)</span>
                <span className="pe-section-badge pe-badge-a">+0–15</span>
              </div>
              <SliderRow
                id="pe-surf-unpaved"
                label="Unpaved / Dirt / Earth (surface=unpaved|ground|dirt|earth)"
                value={axes.unpavedPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=unpaved, ground, dirt, earth, rock, stone, or smoothness=bad|very_bad|horrible."
                onChange={(v) => handleAxisChange('unpavedPenalty', v)}
              />
              <SliderRow
                id="pe-surf-grass"
                label="Grass & Turf (surface=grass|grass_paver)"
                value={axes.grassPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=grass, grass_paver, artificial_turf, or tartan."
                onChange={(v) => handleAxisChange('grassPenalty', v)}
              />
              <SliderRow
                id="pe-surf-mud"
                label="Mud / Sand / Clay (surface=mud|sand|clay)"
                value={axes.mudSandPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=mud, sand, or clay (soft, boggy, or loose ground)."
                onChange={(v) => handleAxisChange('mudSandPenalty', v)}
              />
              <SliderRow
                id="pe-surf-wood"
                label="Wood & Metal Decks (surface=wood|metal)"
                value={axes.woodMetalPenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty (+0.0 = no penalty) when OSM surface=wood (timber boardwalks/bridges) or surface=metal (metal bridge decking/gratings)."
                onChange={(v) => handleAxisChange('woodMetalPenalty', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>3f. Untagged Surface (surface= missing)</span>
                <span className="pe-section-badge pe-badge-a">+0–15</span>
              </div>
              <SliderRow
                id="pe-surf-untagged-road"
                label="Untagged Road (surface= missing on motor roads)"
                value={axes.untaggedRoadSurfacePenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty when a motor road (primary, secondary, tertiary, unclassified, residential, service) has no surface=* or smoothness=* tag in OSM. In the UK, untagged motor roads are almost always tarmac (+0.0)."
                onChange={(v) => handleAxisChange('untaggedRoadSurfacePenalty', v)}
              />
              <SliderRow
                id="pe-surf-untagged-path"
                label="Untagged Path / Track (surface= missing on paths & tracks)"
                value={axes.untaggedPathSurfacePenalty}
                min={0.0}
                max={15.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty when a non-motor way (cycleway, path, footway, bridleway, track) has no surface=* or smoothness=* tag in OSM (uncertain off-road surface)."
                onChange={(v) => handleAxisChange('untaggedPathSurfacePenalty', v)}
              />
            </div>
          </details>

          {/* Section 4: Estimated Traffic (estimated_traffic_class) */}
          <details className={`pe-section ${!axes.enableTrafficPenalties ? 'pe-section-disabled' : ''}`}>
            <summary className="pe-section-summary">
              <span>4. Estimated Traffic (estimated_traffic_class)</span>
              <div className="pe-section-summary-right">
                <span className={`pe-section-badge ${axes.enableTrafficPenalties ? 'pe-badge-a' : 'pe-badge-off'}`}>
                  {axes.enableTrafficPenalties ? '+0–10' : 'Off'}
                </span>
                <SectionSummarySwitch
                  id="pe-enable-traffic"
                  checked={axes.enableTrafficPenalties}
                  label="Estimated Traffic Penalties"
                  onChange={(v) => handleAxisChange('enableTrafficPenalties', v)}
                />
              </div>
            </summary>
            <div className={`pe-section-content ${!axes.enableTrafficPenalties ? 'pe-content-disabled' : ''}`}>
              <div className="pe-subsection-note">
                Heuristic estimate computed by BRouter on <code>primary</code>, <code>secondary</code>, and <code>tertiary</code> roads (<code>1–6</code>), plus <code>7</code> on untagged <code>trunk</code>/<code>motorway</code> roads. Subclasses align with the Route Summary Traffic bar: Quiet (<code>1–2</code>), Moderate (<code>3</code>), Busy (<code>4–5</code>), Severe (<code>6–7</code>), and Untagged (minor roads such as <code>residential</code>/<code>unclassified</code>).
              </div>
              <SliderRow
                id="pe-traffic-c1"
                label="Class 1: Very quiet (Quiet, estimated_traffic_class=1)"
                value={axes.trafficClass1Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=1 (lowest modelled traffic)."
                onChange={(v) => handleAxisChange('trafficClass1Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-c2"
                label="Class 2: Quiet (Quiet, estimated_traffic_class=2)"
                value={axes.trafficClass2Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=2 (light local traffic)."
                onChange={(v) => handleAxisChange('trafficClass2Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-c3"
                label="Class 3: Moderate (Moderate, estimated_traffic_class=3)"
                value={axes.trafficClass3Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=3 (moderate traffic flow)."
                onChange={(v) => handleAxisChange('trafficClass3Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-c4"
                label="Class 4: Busy (Busy, estimated_traffic_class=4)"
                value={axes.trafficClass4Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=4 (busy distributor or arterial traffic)."
                onChange={(v) => handleAxisChange('trafficClass4Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-c5"
                label="Class 5: Heavy (Busy, estimated_traffic_class=5)"
                value={axes.trafficClass5Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=5 (heavy traffic)."
                onChange={(v) => handleAxisChange('trafficClass5Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-c6"
                label="Class 6: Very heavy (Severe, estimated_traffic_class=6 — busiest A/B roads)"
                value={axes.trafficClass6Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=6 (the highest class BRouter emits on primary, secondary, and tertiary roads)."
                onChange={(v) => handleAxisChange('trafficClass6Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-c7"
                label="Class 7: Extreme (Severe, estimated_traffic_class=7 / untagged trunk)"
                value={axes.trafficClass7Penalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on roads with BRouter estimated_traffic_class=7 or untagged highway=trunk / motorway roads."
                onChange={(v) => handleAxisChange('trafficClass7Penalty', v)}
              />
              <SliderRow
                id="pe-traffic-untagged"
                label="Untagged traffic on motor roads (residential, unclassified, service)"
                value={axes.trafficUntaggedRoadPenalty}
                min={0.0}
                max={10.0}
                step={0.1}
                disallowable
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre when a motor road (is_road, typically residential, unclassified, or service) has no estimated_traffic_class tag in the RD5 tile."
                onChange={(v) => handleAxisChange('trafficUntaggedRoadPenalty', v)}
              />
            </div>
          </details>

          {/* Section 5: Estimated Noise (estimated_noise_class) */}
          <details className={`pe-section ${!axes.enableNoisePenalties ? 'pe-section-disabled' : ''}`}>
            <summary className="pe-section-summary">
              <span>5. Estimated Noise (estimated_noise_class)</span>
              <div className="pe-section-summary-right">
                <span className={`pe-section-badge ${axes.enableNoisePenalties ? 'pe-badge-a' : 'pe-badge-off'}`}>
                  {axes.enableNoisePenalties ? '+0–3' : 'Off'}
                </span>
                <SectionSummarySwitch
                  id="pe-enable-noise"
                  checked={axes.enableNoisePenalties}
                  label="Estimated Noise Penalties"
                  onChange={(v) => handleAxisChange('enableNoisePenalties', v)}
                />
              </div>
            </summary>
            <div className={`pe-section-content ${!axes.enableNoisePenalties ? 'pe-content-disabled' : ''}`}>
              <div className="pe-subsection-note">
                Heuristic road-noise exposure class (<code>1–6</code>) precomputed by BRouter from nearby motorways, trunk roads, and primary roads. Subclasses align with the Route Summary Noise bar: Quiet (<code>1–2</code>), Moderate (<code>3–4</code>), Loud (<code>5–6</code>), and Untagged.
              </div>
              <SliderRow
                id="pe-noise-c1"
                label="Class 1: Very quiet (Low Noise, estimated_noise_class=1)"
                value={axes.noiseClass1Penalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on ways with BRouter estimated_noise_class=1."
                onChange={(v) => handleAxisChange('noiseClass1Penalty', v)}
              />
              <SliderRow
                id="pe-noise-c2"
                label="Class 2: Quiet (Low Noise, estimated_noise_class=2)"
                value={axes.noiseClass2Penalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on ways with BRouter estimated_noise_class=2."
                onChange={(v) => handleAxisChange('noiseClass2Penalty', v)}
              />
              <SliderRow
                id="pe-noise-c3"
                label="Class 3: Moderate (Moderate Noise, estimated_noise_class=3)"
                value={axes.noiseClass3Penalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on ways with BRouter estimated_noise_class=3."
                onChange={(v) => handleAxisChange('noiseClass3Penalty', v)}
              />
              <SliderRow
                id="pe-noise-c4"
                label="Class 4: Noticeable (High Noise, estimated_noise_class=4)"
                value={axes.noiseClass4Penalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on ways with BRouter estimated_noise_class=4."
                onChange={(v) => handleAxisChange('noiseClass4Penalty', v)}
              />
              <SliderRow
                id="pe-noise-c5"
                label="Class 5: Loud (Very High Noise, estimated_noise_class=5)"
                value={axes.noiseClass5Penalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on ways with BRouter estimated_noise_class=5."
                onChange={(v) => handleAxisChange('noiseClass5Penalty', v)}
              />
              <SliderRow
                id="pe-noise-c6"
                label="Class 6: Very loud (Very High Noise, estimated_noise_class=6)"
                value={axes.noiseClass6Penalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre on ways with BRouter estimated_noise_class=6 (highest noise exposure)."
                onChange={(v) => handleAxisChange('noiseClass6Penalty', v)}
              />
              <SliderRow
                id="pe-noise-untagged"
                label="Untagged noise (estimated_noise_class= missing)"
                value={axes.noiseUntaggedPenalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty per metre when a way has no estimated_noise_class tag (typically quiet ways far from major roads)."
                onChange={(v) => handleAxisChange('noiseUntaggedPenalty', v)}
              />
            </div>
          </details>

          {/* Section 6: Lanes, Lighting & Scenery */}
          <details className={`pe-section ${!axes.enableEnvironmentPenalties ? 'pe-section-disabled' : ''}`}>
            <summary className="pe-section-summary">
              <span>6. Lanes, Lighting &amp; Scenery</span>
              <div className="pe-section-summary-right">
                <span className={`pe-section-badge ${axes.enableEnvironmentPenalties ? 'pe-badge-a' : 'pe-badge-off'}`}>
                  {axes.enableEnvironmentPenalties ? '+0–5' : 'Off'}
                </span>
                <SectionSummarySwitch
                  id="pe-enable-environment"
                  checked={axes.enableEnvironmentPenalties}
                  label="Lanes, Lighting & Scenery Penalties"
                  onChange={(v) => handleAxisChange('enableEnvironmentPenalties', v)}
                />
              </div>
            </summary>
            <div className={`pe-section-content ${!axes.enableEnvironmentPenalties ? 'pe-content-disabled' : ''}`}>
              <div className="pe-subsection-header">
                <span>6a. Lanes &amp; Lighting (lanes, lit)</span>
                <span className="pe-section-badge pe-badge-a">+0–5</span>
              </div>
              <div className="pe-subsection-note">
                Applies to OSM <code>lanes=*</code> and <code>lit=*</code> tags. Use the untagged lighting slider below to decide whether ways without a <code>lit=*</code> tag are penalized.
              </div>
              <SliderRow
                id="pe-lanes-multi"
                label="Multi-lane road (lanes=3 or more)"
                value={axes.multiLanePenalty}
                min={0.0}
                max={5.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty when a road is tagged lanes=3, 4, 5, 6, 7, or 8+ in OSM. Ways with lanes=1|2 or untagged lanes= receive +0.0."
                onChange={(v) => handleAxisChange('multiLanePenalty', v)}
              />
              <SliderRow
                id="pe-lit-no"
                label="Explicitly unlit way (lit=no)"
                value={axes.unlitPenalty}
                min={0.0}
                max={5.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                disallowable
                tooltip="Additive penalty when a way is explicitly tagged lit=no in OSM (no street lighting). Useful for night riding."
                onChange={(v) => handleAxisChange('unlitPenalty', v)}
              />
              <SliderRow
                id="pe-lit-untagged"
                label="Untagged lighting (lit= missing)"
                value={axes.untaggedLitPenalty}
                min={0.0}
                max={5.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty when a way has no lit=* tag in OSM (lighting unknown). Keep at +0.0 unless you want to strictly require lit=yes ways."
                onChange={(v) => handleAxisChange('untaggedLitPenalty', v)}
              />

              <div className="pe-subsection-header pe-subsection-divider">
                <span>6b. Forests &amp; Parks (estimated_forest_class)</span>
                <span className="pe-section-badge pe-badge-a">+0–3</span>
              </div>
              <div className="pe-subsection-note">
                Heuristic woodland/park proximity (<code>1–6</code>). Ways with no <code>estimated_forest_class</code> tag are outside mapped woods and receive the full slider penalty below; ways inside <code>class=6</code> forest receive <strong>+0.0</strong>.
              </div>
              <SliderRow
                id="pe-forest-penalty"
                label="Prefer forests & parks: penalty outside woods (estimated_forest_class)"
                value={axes.noForestPenalty}
                min={0.0}
                max={3.0}
                step={0.1}
                formatValue={(v) => `+${Number(v.toFixed(1))}`}
                tooltip="Additive penalty applied when a way is outside mapped woodland or parks (1.0x when estimated_forest_class is untagged/none, stepping down from 0.5x at class 1 to +0.0 inside class 6 forest)."
                onChange={(v) => handleAxisChange('noForestPenalty', v)}
              />
            </div>
          </details>

          <div className="pe-group-banner pe-group-c">
            <span className="pe-group-pill">B</span>
            <div className="pe-group-text">
              <strong>Hill &amp; Junction Penalties (+m virtual distance)</strong>
              <span>Extra virtual metres added when climbing hills or crossing junctions</span>
            </div>
          </div>

          {/* Section 7: Climbing & Hills */}
          <details className={`pe-section ${!axes.considerElevation ? 'pe-section-disabled' : ''}`}>
            <summary className="pe-section-summary">
              <span>7. Climbing &amp; Descents</span>
              <div className="pe-section-summary-right">
                <span className={`pe-section-badge ${axes.considerElevation ? 'pe-badge-c' : 'pe-badge-off'}`}>
                  {axes.considerElevation ? '+0–200 m/m' : 'Off'}
                </span>
                <SectionSummarySwitch
                  id="pe-consider-elevation"
                  checked={axes.considerElevation}
                  label="Climbing & Descents Penalties"
                  onChange={(v) => handleAxisChange('considerElevation', v)}
                />
              </div>
            </summary>
            <div className={`pe-section-content ${!axes.considerElevation ? 'pe-content-disabled' : ''}`}>
              <SliderRow
                id="pe-uphill-cost"
                label="Uphill climb penalty"
                value={axes.uphillCost}
                min={0}
                max={200}
                step={5}
                formatValue={(v) => `+${v} m/m`}
                tooltip="BRouter uphillcost: extra virtual horizontal metres added per 1 m of vertical climb above the uphill cutoff gradient."
                onChange={(v) => handleAxisChange('uphillCost', v)}
              />
              <SliderRow
                id="pe-uphill-cutoff"
                label="Uphill gradient cutoff"
                value={axes.uphillCutoff}
                min={0.0}
                max={8.0}
                step={0.5}
                unit="%"
                tooltip="BRouter uphillcutoff: gradients gentler than this slope percentage incur no uphill climbing penalty."
                onChange={(v) => handleAxisChange('uphillCutoff', v)}
              />
              <SliderRow
                id="pe-downhill-cost"
                label="Downhill braking penalty"
                value={axes.downhillCost}
                min={0}
                max={200}
                step={5}
                formatValue={(v) => `+${v} m/m`}
                tooltip="BRouter downhillcost: extra virtual horizontal metres per 1 m of vertical descent steeper than the downhill cutoff, penalizing rolling hills and steep braking descents."
                onChange={(v) => handleAxisChange('downhillCost', v)}
              />
              <SliderRow
                id="pe-downhill-cutoff"
                label="Downhill gradient cutoff"
                value={axes.downhillCutoff}
                min={0.0}
                max={8.0}
                step={0.5}
                unit="%"
                tooltip="BRouter downhillcutoff: descents gentler than this slope percentage incur no downhill penalty."
                onChange={(v) => handleAxisChange('downhillCutoff', v)}
              />
            </div>
          </details>

          {/* Section 8: Turns, Signals & Barriers (all 0 to 300 m) */}
          <details className={`pe-section ${!axes.enableTurnPenalties ? 'pe-section-disabled' : ''}`}>
            <summary className="pe-section-summary">
              <span>8. Turns, Signals &amp; Barriers</span>
              <div className="pe-section-summary-right">
                <span className={`pe-section-badge ${axes.enableTurnPenalties ? 'pe-badge-c' : 'pe-badge-off'}`}>
                  {axes.enableTurnPenalties ? '+0–300 m' : 'Off'}
                </span>
                <SectionSummarySwitch
                  id="pe-enable-turns"
                  checked={axes.enableTurnPenalties}
                  label="Turn, Signal & Barrier Penalties"
                  onChange={(v) => handleAxisChange('enableTurnPenalties', v)}
                />
              </div>
            </summary>
            <div className="pe-section-content">
              <div className={`pe-section-subcontrols ${!axes.enableTurnPenalties ? 'pe-content-disabled' : ''}`}>
                <SliderRow
                  id="pe-turn-generic"
                  label="Generic 90° turn cost"
                  value={axes.turnCostGeneric}
                  min={0}
                  max={300}
                  step={10}
                  formatValue={(v) => `+${v} m`}
                  tooltip="BRouter turncost (scaled by 1 - cos(angle)): virtual metres added for a 90-degree turn on ordinary roads to favour direct, flowing lines."
                  onChange={(v) => handleAxisChange('turnCostGeneric', v)}
                />
                <SliderRow
                  id="pe-turn-cycleroute"
                  label="Cycle route 90° turn cost"
                  value={axes.turnCostCycleRoute}
                  min={0}
                  max={300}
                  step={10}
                  formatValue={(v) => `+${v} m`}
                  tooltip="BRouter turncost on designated cycle routes (route=bicycle) and quiet residential streets, often twisted through backstreet filters."
                  onChange={(v) => handleAxisChange('turnCostCycleRoute', v)}
                />
                <SliderRow
                  id="pe-turn-roundabout"
                  label="Roundabout turn cost"
                  value={axes.turnCostRoundabout}
                  min={0}
                  max={300}
                  step={10}
                  formatValue={(v) => `+${v} m`}
                  tooltip="BRouter turncost applied on ways tagged junction=roundabout."
                  onChange={(v) => handleAxisChange('turnCostRoundabout', v)}
                />
                <SliderRow
                  id="pe-signal-cost"
                  label="Traffic signal wait cost (highway=traffic_signals)"
                  value={axes.trafficSignalCost}
                  min={0}
                  max={300}
                  step={10}
                  formatValue={(v) => `+${v} m`}
                  tooltip="Node initialcost in virtual metres for passing an OSM highway=traffic_signals or crossing=traffic_signals node."
                  onChange={(v) => handleAxisChange('trafficSignalCost', v)}
                />
                <SliderRow
                  id="pe-dismount-cost"
                  label="Barrier / dismount node cost (bicycle=dismount)"
                  value={axes.dismountNodeCost}
                  min={0}
                  max={300}
                  step={10}
                  formatValue={(v) => `+${v} m`}
                  tooltip="Node initialcost in virtual metres for OSM barrier=cycle_barrier, stile, kissing_gate, bollard, or nodes tagged bicycle=dismount."
                  onChange={(v) => handleAxisChange('dismountNodeCost', v)}
                />
              </div>
              <ToggleRow
                id="pe-allow-steps"
                label="Allow steps (highway=steps)"
                checked={axes.allowSteps}
                tooltip="OSM highway=steps: flights of stairs on footways or overpasses. When disabled, steps are assigned costfactor 10000 (explicitly forbidden)."
                onChange={(v) => handleAxisChange('allowSteps', v)}
              />
              <ToggleRow
                id="pe-allow-ferries"
                label="Allow ferries (route=ferry)"
                checked={axes.allowFerries}
                tooltip="OSM route=ferry water crossings where bicycles are permitted. When disabled, ferries are assigned costfactor 10000 (explicitly forbidden)."
                onChange={(v) => handleAxisChange('allowFerries', v)}
              />
            </div>
          </details>

          <div className="pe-group-banner pe-group-d">
            <span className="pe-group-pill">C</span>
            <div className="pe-group-text">
              <strong>Speed &amp; Time Model</strong>
              <span>Computes average speed and riding time; does not change which route is chosen</span>
            </div>
          </div>

          {/* Section 9: Rider & Bike Physics */}
          <details className="pe-section">
            <summary className="pe-section-summary">
              <span>9. Rider &amp; Bike Physics</span>
              <span className="pe-section-badge">Speed &amp; Time</span>
            </summary>
            <div className="pe-section-content">
              <SliderRow
                id="pe-biker-power"
                label="Rider average power"
                value={axes.bikerPower}
                min={50}
                max={350}
                step={5}
                unit="W"
                tooltip="BRouter bikerPower: sustained mechanical pedalling power in Watts used by the kinematic model to compute travel time and climbing speed."
                onChange={(v) => handleAxisChange('bikerPower', v)}
              />
              <SliderRow
                id="pe-total-mass"
                label="Rider + bike mass"
                value={axes.totalMass}
                min={50}
                max={150}
                step={1}
                unit="kg"
                tooltip="BRouter totalMass: combined mass in kilograms of rider, bicycle, and luggage for gravity and rolling resistance calculations."
                onChange={(v) => handleAxisChange('totalMass', v)}
              />
              <SliderRow
                id="pe-max-speed"
                label="Max descent speed"
                value={axes.maxSpeed}
                min={20}
                max={70}
                step={1}
                unit="km/h"
                tooltip="BRouter maxSpeed: terminal speed cap in km/h on descents in the travel-time kinematic model."
                onChange={(v) => handleAxisChange('maxSpeed', v)}
              />
              <SliderRow
                id="pe-rolling-resistance"
                label="Rolling resistance (C_r)"
                value={axes.rollingResistance}
                min={0.004}
                max={0.025}
                step={0.001}
                tooltip="BRouter S_C_x / C_r: dimensionless rolling resistance coefficient on smooth asphalt (0.004 = fast road tyres, 0.008 = touring/gravel tyres, 0.015+ = knobby MTB tyres)."
                onChange={(v) => handleAxisChange('rollingResistance', v)}
              />
            </div>
          </details>
        </div>
      ) : (
        <div className="pe-body pe-dsl-body">
          <div className="pe-dsl-bar">
            <span className="pe-dsl-info">
              Edit BRouter <code>.brf</code> script directly. Changes re-route live.
            </span>
            <a
              href="https://brouter.de/brouter/costfunctions.html"
              target="_blank"
              rel="noopener noreferrer"
              className="pe-docs-link"
            >
              BRouter DSL Docs &rarr;
            </a>
          </div>
          <textarea
            id="pe-dsl-textarea"
            className="pe-dsl-textarea"
            spellCheck={false}
            value={dslText}
            onChange={(e) => {
              setDslText(e.target.value);
              setDslDirty(true);
            }}
          />
        </div>
      )}

      <div className="pe-footer">
        <input
          ref={fileInputRef}
          type="file"
          id="pe-import-brf-input"
          accept=".brf,.txt"
          style={{ display: 'none' }}
          onChange={handleImportBrfFile}
        />

        <div className="pe-footer-actions">
          <button
            id="btn-pe-save"
            type="button"
            className="btn btn-primary btn-action-compact"
            title="Save custom profile locally in browser"
            onClick={handleSaveProfile}
          >
            <Icon name={saveToast ? 'check' : 'save'} size={13} />
            <span>{saveToast || 'Save Profile'}</span>
          </button>

          <button
            id="btn-pe-export"
            type="button"
            className="btn btn-outline btn-action-compact"
            title="Download as standard .brf file"
            onClick={handleExportBrf}
          >
            <Icon name="download" size={13} />
            <span>Export .brf</span>
          </button>

          <button
            id="btn-pe-import"
            type="button"
            className="btn btn-outline btn-action-compact"
            title="Import an existing .brf file from disk"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="upload" size={13} />
            <span>Import .brf</span>
          </button>

          {isSavedCustomSelected && (
            <button
              id="btn-pe-delete"
              type="button"
              className="btn btn-danger btn-action-compact"
              style={{ flex: '0 0 auto', padding: '0 9px' }}
              title="Delete this saved custom profile"
              aria-label="Delete saved profile"
              onClick={handleDeleteCurrent}
            >
              <Icon name="trash" size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
