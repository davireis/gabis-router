import React, { useEffect, useRef, useState } from 'react';
import type { useRouting } from '../hooks/useRouting.ts';
import type { useOffline } from '../hooks/useOffline.ts';
import {
  getSlotColor,
  MAX_ROUTE_SLOTS,
  PROFILE_INFO,
  PROFILE_ORDER,
  ROUTE_COLOR_PALETTE,
  type LatLon,
  type ProfileName,
} from '../types.ts';
import { routeToGpx, downloadGpxFile } from '../utils/gpx.ts';
import { getShareableRouteUrl, isNativePlatform } from '../platform.ts';
import { Header } from './Header.tsx';
import { WaypointList } from './WaypointList.tsx';
import { ProfileEditorPanel } from './ProfileEditorPanel.tsx';
import { InfoButton } from './TooltipPopover.tsx';
import { Icon } from './common/Icon.tsx';

interface ControlsPanelProps {
  routing: ReturnType<typeof useRouting>;
  offline: ReturnType<typeof useOffline>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isProfileEditorOpen: boolean;
  onToggleProfileEditor: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  getMapCenter?: () => { lat: number; lon: number };
  onFlyTo?: (lon: number, lat: number) => void;
  editingWaypointIndex?: number | null;
  onClearEditingWaypoint?: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  routing,
  offline,
  isCollapsed,
  onToggleCollapse,
  isProfileEditorOpen,
  onToggleProfileEditor,
  onOpenSettings,
  onOpenAbout,
  getMapCenter,
  onFlyTo,
  editingWaypointIndex,
  onClearEditingWaypoint,
}) => {
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const routeSectionRef = useRef<HTMLDivElement | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [openColorSlotIdx, setOpenColorSlotIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openColorSlotIdx === null) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.profile-color-picker-wrap')) {
        setOpenColorSlotIdx(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenColorSlotIdx(null);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openColorSlotIdx]);

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      routing.importGpxFile(file);
    }
    e.target.value = '';
  };

  const handleUseMyLocationAt = (onResolved: (point: LatLon) => void) => {
    if (!('geolocation' in navigator)) {
      routing.setStatus('This browser cannot find your location.', true);
      return;
    }
    routing.setStatus('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onResolved({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'My location',
        });
      },
      (err) => {
        const GEOLOCATION_ERRORS: Record<number, string> = {
          1: 'Location permission was denied. Allow it in browser settings and try again.',
          2: 'Your location is not available right now.',
          3: 'Finding your location took too long. Try again.',
        };
        routing.setStatus(
          GEOLOCATION_ERRORS[err.code] ?? `Could not find your location: ${err.message}`,
          true,
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleSetWaypointAt = (
    index: number,
    point: LatLon,
    mode: 'replace' | 'insert-start' | 'append',
  ) => {
    if (mode === 'replace') {
      routing.moveWaypoint(index, point);
    } else if (mode === 'insert-start') {
      routing.insertWaypointAtLeg(point, 0);
    } else {
      routing.addWaypoint(point, 'append');
    }
  };

  const handleShare = async () => {
    const url = getShareableRouteUrl();
    try {
      if (typeof window !== 'undefined' && window.AndroidNative?.shareText) {
        if (window.AndroidNative.shareText('GBRouter route', url)) {
          return;
        }
      }
      if (navigator.share && (isNativePlatform() || window.matchMedia('(pointer: coarse)').matches)) {
        await navigator.share({ title: 'GBRouter route', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        routing.setStatus('Link copied. Anyone who opens it sees this route.');
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err: any) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      routing.setStatus(`Could not share: ${err.message || String(err)}`, true);
    }
  };

  const handleExportGpx = async () => {
    if (!routing.currentRoute) return;
    const startName = routing.waypoints[0]?.name;
    const endName = routing.waypoints[routing.waypoints.length - 1]?.name;
    const trackName =
      startName && endName ? `${startName} to ${endName}` : `${routing.profile}_route`;
    const filename = `${trackName.replace(/[/\\?%*:|"<>]/g, '_')}.gpx`;
    await downloadGpxFile(routeToGpx(routing.currentRoute, trackName), filename);
    routing.setStatus(`Route exported as ${filename}`);
  };

  const isBusy = routing.isRouting || offline.downloadProgress.active;

  return (
    <div
      id="controls"
      ref={controlsRef}
      className={`${isCollapsed ? 'collapsed' : ''} ${!isCollapsed && isProfileEditorOpen ? 'editor-open' : ''}`}
    >
      <div className="controls-main-col">
        <Header
          profile={routing.profile}
          profileLabel={routing.getProfileMeta(routing.profile).shortLabel}
          compareCount={Math.max(0, routing.slots.length - 1)}
          isOfflineMode={offline.isOfflineMode}
          isBusy={isBusy}
          statusMessage={routing.status || offline.downloadProgress.message}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onOpenSettings={onOpenSettings}
          onOpenAbout={onOpenAbout}
        />

        <div className="route-section" ref={routeSectionRef}>
          <div className="field profile-field">
            <div className="profile-field-header">
              <label htmlFor="profile-select" className="profile-header-label">
                <span>{routing.slots.length > 1 ? 'Profiles' : 'Profile'}</span>
                <InfoButton
                  tooltip={`${routing.getProfileMeta(routing.profile)?.summary || ''} Profiles score every road segment by surface, traffic, hills, and cycle infrastructure. Add up to 3 profiles to compare routes side by side.`}
                  ariaLabel="About Routing Profiles"
                />
              </label>
              <div className="profile-header-actions">
                <button
                  id="btn-open-profile-editor"
                  type="button"
                  className={`btn-toolbar-mini btn-edit-profile ${isProfileEditorOpen ? 'active' : ''}`}
                  title={isProfileEditorOpen ? 'Close Profile Editor' : 'Open Profile Editor to customize or create profiles'}
                  onClick={onToggleProfileEditor}
                >
                  <Icon name="sliders" size={11} />
                  <span>{isProfileEditorOpen ? 'Close Editor' : 'Edit Profile'}</span>
                </button>
                {routing.slots.length < MAX_ROUTE_SLOTS && (
                  <button
                    id="btn-add-compare-profile"
                    type="button"
                    className="btn-toolbar-mini btn-add-profile"
                    title="Compare with another routing profile (up to 3)"
                    onClick={() => routing.addProfileSlot()}
                  >
                    <span>+ Compare</span>
                  </button>
                )}
              </div>
            </div>

            <div className="profile-slots-list">
              {routing.slots.map((slot, slotIdx) => {
                const slotColor = getSlotColor(slot, slotIdx);
                const isPickerOpen = openColorSlotIdx === slotIdx;
                const slotMeta = routing.getProfileMeta(slot.profile);
                return (
                  <div key={slotIdx} className={`profile-slot-row ${slot.isRouting ? 'is-routing' : ''}`}>
                    <div className="profile-color-picker-wrap">
                      <button
                        type="button"
                        className={`profile-slot-dot profile-slot-dot-btn ${isPickerOpen ? 'active' : ''} ${slot.isRouting ? 'is-routing' : ''}`}
                        style={{ backgroundColor: slotColor.line }}
                        title={`Route ${slotIdx + 1} colour: ${slotColor.name} (click to change)`}
                        aria-label={`Change route ${slotIdx + 1} colour (${slotColor.name})`}
                        aria-expanded={isPickerOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColorSlotIdx(isPickerOpen ? null : slotIdx);
                        }}
                      />
                      {isPickerOpen && (
                        <div className="profile-color-popover" role="menu" aria-label="Select route colour">
                          {ROUTE_COLOR_PALETTE.map((c) => {
                            const isSelected = c.id === slotColor.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                className={`profile-color-swatch ${isSelected ? 'selected' : ''}`}
                                style={{ backgroundColor: c.line }}
                                title={c.name}
                                aria-label={c.name}
                                aria-checked={isSelected}
                                role="menuitemradio"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  routing.setSlotColor(slotIdx, c.id);
                                  setOpenColorSlotIdx(null);
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <select
                      id={slotIdx === 0 ? 'profile-select' : `profile-select-${slotIdx}`}
                      value={slot.profile}
                      title={slotMeta.summary}
                      onChange={(e) => routing.setSlotProfile(slotIdx, e.target.value as ProfileName)}
                    >
                      {slot.profile === 'custom:__draft__' && (
                        <option value="custom:__draft__">Live Editor Draft</option>
                      )}
                      {routing.customProfiles.length > 0 && (
                        <optgroup label="Custom Profiles">
                          {routing.customProfiles.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              {cp.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Built-in Profiles">
                        {PROFILE_ORDER.map((key) => (
                          <option key={key} value={key}>
                            {PROFILE_INFO[key].label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    {routing.slots.length > 1 && (
                      <button
                        id={`btn-remove-profile-${slotIdx}`}
                        type="button"
                        className="wp-btn wp-btn-remove profile-slot-remove"
                        title="Remove this profile from comparison"
                        aria-label={`Remove profile ${slotIdx + 1}`}
                        onClick={() => routing.removeProfileSlot(slotIdx)}
                      >
                        <Icon name="close" size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        <div className="waypoints-top-bar">
          <div className="waypoints-top-left">
            <span className="waypoints-heading">Waypoints</span>
          </div>

          <div className="route-toolbar-group">
            <input
              ref={importFileInputRef}
              type="file"
              id="input-import-gpx"
              accept=".gpx"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
            <button
              id="btn-import-gpx"
              type="button"
              className="btn-toolbar-mini"
              title="Upload GPX as editable route"
              aria-label="Upload GPX"
              onClick={() => importFileInputRef.current?.click()}
            >
              <Icon name="upload" size={12} />
              <span>Upload GPX</span>
            </button>
            <button
              id="btn-undo"
              type="button"
              className="btn-toolbar-mini"
              title="Undo (Cmd+Z / Ctrl+Z)"
              aria-label="Undo"
              disabled={!routing.canUndo}
              onClick={routing.undo}
            >
              <Icon name="undo" size={13} />
            </button>
            <button
              id="btn-redo"
              type="button"
              className="btn-toolbar-mini"
              title="Redo (Cmd+Shift+Z / Ctrl+Y)"
              aria-label="Redo"
              disabled={!routing.canRedo}
              onClick={routing.redo}
            >
              <Icon name="redo" size={13} />
            </button>
            <button
              id="btn-clear-route"
              type="button"
              className="btn-toolbar-mini btn-toolbar-clear"
              title="Clear route and avoid areas"
              aria-label="Clear route"
              disabled={routing.waypoints.length === 0 && routing.avoidAreas.length === 0}
              onClick={routing.clearRoute}
            >
              <Icon name="trash" size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <WaypointList
          waypoints={routing.waypoints}
          avoidAreas={routing.avoidAreas}
          isOfflineMode={offline.isOfflineMode}
          editingWaypointIndex={editingWaypointIndex}
          onClearEditingWaypoint={onClearEditingWaypoint}
          getMapCenter={getMapCenter}
          onSetWaypointAt={handleSetWaypointAt}
          onUseMyLocationAt={handleUseMyLocationAt}
          onReorder={routing.reorderWaypoints}
          onReverse={routing.reverseRoute}
          onRemove={routing.removeWaypoint}
          onRename={routing.renameWaypoint}
          onRemoveAvoidArea={routing.removeAvoidArea}
          onUpdateAvoidAreaRadius={routing.updateAvoidAreaRadius}
          onClearAvoidAreas={routing.clearAvoidAreas}
          onFlyTo={onFlyTo}
        />

        <div className="route-section-footer">
          <div
            id="status"
            className={`status-bar ${isBusy ? 'is-busy' : ''} ${routing.isError ? 'is-error' : ''}`}
            role="status"
            aria-live="polite"
          >
            {isBusy && <span className="status-spinner" aria-hidden="true" />}
            {routing.status && <span className="status-text">{routing.status}</span>}
          </div>

          <div className="route-primary-actions">
            <button
              id="btn-share"
              type="button"
              className="btn btn-outline btn-action-compact"
              title="Copy shareable route link"
              disabled={routing.waypoints.length < 2}
              onClick={handleShare}
            >
              <Icon name={shareCopied ? 'check' : 'share'} size={13} />
              <span>{shareCopied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              id="btn-export-gpx"
              type="button"
              className="btn btn-primary btn-action-compact"
              title="Download primary route as GPX file"
              disabled={!routing.currentRoute}
              onClick={handleExportGpx}
            >
              <Icon name="download" size={13} />
              <span>Export GPX</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {!isCollapsed && isProfileEditorOpen && (
        <ProfileEditorPanel routing={routing} onClose={onToggleProfileEditor} />
      )}
    </div>
  );
};
