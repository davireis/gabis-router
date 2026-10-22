import React, { useState, useEffect, useRef } from 'react';
import {
  AVOID_RADIUS_PRESETS,
  waypointKind,
  waypointLabel,
  type AvoidArea,
  type LatLon,
} from '../types.ts';
import {
  reverseGeocode,
  isOnlineMode,
  searchPlaces,
  cachePlaceName,
  getCachedPlaceName,
  type GeocodePlace,
} from '../geocoding.ts';
import { parseCoordinateInput } from '../utils/geo.ts';
import { Icon } from './common/Icon.tsx';

interface WaypointListProps {
  waypoints: LatLon[];
  avoidAreas?: AvoidArea[];
  isOfflineMode?: boolean;
  editingWaypointIndex?: number | null;
  onClearEditingWaypoint?: () => void;
  getMapCenter?: () => { lat: number; lon: number };
  onSetWaypointAt: (index: number, point: LatLon, mode: 'replace' | 'insert-start' | 'append') => void;
  onUseMyLocationAt?: (onResolved: (point: LatLon) => void) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReverse?: () => void;
  onRemove: (index: number) => void;
  onRename: (index: number, name: string, expectedCoords?: { lat: number; lon: number }) => void;
  onRemoveAvoidArea?: (index: number) => void;
  onUpdateAvoidAreaRadius?: (index: number, radius: number) => void;
  onClearAvoidAreas?: () => void;
  onFlyTo?: (lon: number, lat: number) => void;
}

interface DisplayRow {
  rowKey: string;
  waypointIndex: number | null; // index in `waypoints`, or null if this row is an empty slot
  slotRole: 'start' | 'via' | 'end';
  badgeText: string;
  placeholder: string;
  waypoint?: LatLon;
}

export const WaypointList: React.FC<WaypointListProps> = ({
  waypoints,
  avoidAreas = [],
  isOfflineMode = false,
  editingWaypointIndex,
  onClearEditingWaypoint,
  getMapCenter,
  onSetWaypointAt,
  onUseMyLocationAt,
  onReorder,
  onReverse,
  onRemove,
  onRename,
  onRemoveAvoidArea,
  onUpdateAvoidAreaRadius,
  onClearAvoidAreas,
  onFlyTo,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; isAbove: boolean } | null>(null);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [hasTyped, setHasTyped] = useState<boolean>(false);
  const [results, setResults] = useState<GeocodePlace[]>([]);
  const [activeResultIdx, setActiveResultIdx] = useState<number>(0);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [isAddingStop, setIsAddingStop] = useState<boolean>(false);
  // Tracks whether a single waypoint (waypoints.length === 1) was entered into slot B first
  const [singleIsDestination, setSingleIsDestination] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Set<string>>(() => new Set());
  const [online, setOnline] = useState<boolean>(() => isOnlineMode() && !isOfflineMode);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodedKeysRef = useRef<Set<string>>(new Set());
  const attemptedCoordsRef = useRef<Set<string>>(new Set());
  const prevWaypointCountRef = useRef<number>(waypoints.length);

  const wpCoordKey = (w: LatLon) => `${w.lat.toFixed(5)},${w.lon.toFixed(5)}`;

  useEffect(() => {
    const handleNetChange = () => setOnline(isOnlineMode() && !isOfflineMode);
    window.addEventListener('online', handleNetChange);
    window.addEventListener('offline', handleNetChange);
    window.addEventListener('offlinemodechange', handleNetChange);
    return () => {
      window.removeEventListener('online', handleNetChange);
      window.removeEventListener('offline', handleNetChange);
      window.removeEventListener('offlinemodechange', handleNetChange);
    };
  }, [isOfflineMode]);

  useEffect(() => {
    setOnline(isOnlineMode() && !isOfflineMode);
  }, [isOfflineMode]);

  useEffect(() => {
    if (waypoints.length !== 1) {
      setSingleIsDestination(false);
    }
    if (waypoints.length > prevWaypointCountRef.current && isAddingStop) {
      setIsAddingStop(false);
    }
    prevWaypointCountRef.current = waypoints.length;
  }, [waypoints.length, isAddingStop]);

  // Build the visual rows (always at least A and B)
  const n = waypoints.length;
  const rows: DisplayRow[] = [];
  if (n === 0) {
    rows.push({
      rowKey: 'empty-start',
      waypointIndex: null,
      slotRole: 'start',
      badgeText: 'A',
      placeholder: 'Choose starting point, or click on the map',
    });
    rows.push({
      rowKey: 'empty-end',
      waypointIndex: null,
      slotRole: 'end',
      badgeText: 'B',
      placeholder: 'Choose destination, or click on the map',
    });
  } else if (n === 1) {
    if (singleIsDestination) {
      rows.push({
        rowKey: 'empty-start',
        waypointIndex: null,
        slotRole: 'start',
        badgeText: 'A',
        placeholder: 'Choose starting point, or click on the map',
      });
      rows.push({
        rowKey: 'wp-0',
        waypointIndex: 0,
        slotRole: 'end',
        badgeText: 'B',
        placeholder: 'Choose destination, or click on the map',
        waypoint: waypoints[0],
      });
    } else {
      rows.push({
        rowKey: 'wp-0',
        waypointIndex: 0,
        slotRole: 'start',
        badgeText: 'A',
        placeholder: 'Choose starting point, or click on the map',
        waypoint: waypoints[0],
      });
      rows.push({
        rowKey: 'empty-end',
        waypointIndex: null,
        slotRole: 'end',
        badgeText: 'B',
        placeholder: 'Choose destination, or click on the map',
      });
    }
  } else {
    const totalShown = isAddingStop ? n + 1 : n;
    for (let i = 0; i < n; i++) {
      const role = waypointKind(i, totalShown);
      const label = waypointLabel(i, totalShown);
      rows.push({
        rowKey: `wp-${i}`,
        waypointIndex: i,
        slotRole: role,
        badgeText: label,
        placeholder:
          i === 0 ? 'Choose starting point' : i === totalShown - 1 ? 'Choose destination' : 'Via point',
        waypoint: waypoints[i],
      });
    }
    if (isAddingStop) {
      rows.push({
        rowKey: 'adding-end',
        waypointIndex: null,
        slotRole: 'end',
        badgeText: 'B',
        placeholder: 'Choose destination, or click on the map',
      });
    }
  }

  // Sync external rename trigger (e.g., from map marker context menu)
  useEffect(() => {
    if (
      editingWaypointIndex !== undefined &&
      editingWaypointIndex !== null &&
      waypoints[editingWaypointIndex]
    ) {
      const rIdx = rows.findIndex((r) => r.waypointIndex === editingWaypointIndex);
      if (rIdx !== -1) {
        setActiveRowIdx(rIdx);
        setInputValue(waypoints[editingWaypointIndex].name || '');
        setHasTyped(false);
        setResults([]);
        setSearchStatus('');
      }
      onClearEditingWaypoint?.();
    }
  }, [editingWaypointIndex, waypoints, onClearEditingWaypoint]);

  useEffect(() => {
    if (activeRowIdx !== null && activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, [activeRowIdx]);

  // Click outside to commit or close active row dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveRowIdx(null);
        setHasTyped(false);
        setResults([]);
        setSearchStatus('');
        if (isAddingStop) {
          setIsAddingStop(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddingStop]);

  // Autocomplete search when typing in active row
  useEffect(() => {
    if (activeRowIdx === null || !hasTyped) {
      setResults([]);
      setSearchStatus('');
      return;
    }
    const q = inputValue.trim();
    if (!q) {
      setResults([]);
      setActiveResultIdx(0);
      setSearchStatus('');
      return;
    }

    const coordPt = parseCoordinateInput(q);
    if (coordPt) {
      const label = `${coordPt.lat.toFixed(5)}, ${coordPt.lon.toFixed(5)}`;
      setResults([
        {
          lat: coordPt.lat,
          lon: coordPt.lon,
          title: label,
          subtitle: 'Coordinates',
          name: label,
        },
      ]);
      setActiveResultIdx(0);
      setSearchStatus('');
      return;
    }

    if (!online) {
      setResults([]);
      setSearchStatus('Offline mode: enter lat, lon coordinates or click on the map.');
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      const center = getMapCenter?.();
      const places = await searchPlaces(q, center);
      if (places.length === 0) {
        setSearchStatus('No places found');
        setResults([]);
      } else {
        setSearchStatus('');
        setResults(places);
        setActiveResultIdx(0);
      }
    }, 200);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [inputValue, hasTyped, activeRowIdx, online, getMapCenter]);

  // Reverse geocoding unresolved waypoints (auto-geocode only when <= 10 waypoints)
  const AUTO_GEOCODE_MAX_POINTS = 10;

  const geocodeWaypointAt = (i: number) => {
    const w = waypoints[i];
    if (!w || w.name) return;
    const cKey = wpCoordKey(w);
    const key = `${i}:${cKey}`;
    const cached = getCachedPlaceName(w.lat, w.lon);
    if (cached) {
      geocodedKeysRef.current.add(key);
      attemptedCoordsRef.current.add(cKey);
      onRename(i, cached, { lat: w.lat, lon: w.lon });
      return;
    }
    if (!isOnlineMode()) return;
    geocodedKeysRef.current.add(key);
    attemptedCoordsRef.current.add(cKey);
    setPendingCoords((prev) => {
      if (prev.has(cKey)) return prev;
      const next = new Set(prev);
      next.add(cKey);
      return next;
    });
    const reqLat = w.lat;
    const reqLon = w.lon;
    reverseGeocode(reqLat, reqLon)
      .then((name) => {
        if (!name) return;
        onRename(i, name, { lat: reqLat, lon: reqLon });
      })
      .finally(() => {
        setPendingCoords((prev) => {
          if (!prev.has(cKey)) return prev;
          const next = new Set(prev);
          next.delete(cKey);
          return next;
        });
      });
  };

  const geocodeAllWaypoints = () => {
    if (!isOnlineMode()) return;
    waypoints.forEach((w, i) => {
      if (!w.name) {
        geocodeWaypointAt(i);
      }
    });
  };

  useEffect(() => {
    if (!isOnlineMode()) return;
    if (waypoints.length === 0) {
      geocodedKeysRef.current.clear();
      attemptedCoordsRef.current.clear();
      setPendingCoords((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }
    if (waypoints.length > AUTO_GEOCODE_MAX_POINTS) {
      return;
    }
    waypoints.forEach((w, i) => {
      const key = `${i}:${wpCoordKey(w)}`;
      if (!w.name && !geocodedKeysRef.current.has(key)) {
        geocodeWaypointAt(i);
      }
    });
  }, [waypoints, onRename]);

  const applyWaypointForRow = (rowIdx: number, point: LatLon) => {
    const row = rows[rowIdx];
    if (!row) return;
    if (point.name) {
      cachePlaceName(point.lat, point.lon, point.name);
      geocodedKeysRef.current.add(
        `${row.waypointIndex ?? waypoints.length}:${point.lat.toFixed(5)},${point.lon.toFixed(5)}`,
      );
    }
    if (waypoints.length < 2) {
      onFlyTo?.(point.lon, point.lat);
    }

    if (row.waypointIndex !== null) {
      onSetWaypointAt(row.waypointIndex, point, 'replace');
    } else if (waypoints.length === 0) {
      if (rowIdx === 1) {
        setSingleIsDestination(true);
      } else {
        setSingleIsDestination(false);
      }
      onSetWaypointAt(0, point, 'append');
    } else if (waypoints.length === 1) {
      if (row.slotRole === 'start') {
        setSingleIsDestination(false);
        onSetWaypointAt(0, point, 'insert-start');
      } else {
        setSingleIsDestination(false);
        onSetWaypointAt(1, point, 'append');
      }
    } else {
      setIsAddingStop(false);
      onSetWaypointAt(waypoints.length, point, 'append');
    }

    setActiveRowIdx(null);
    setHasTyped(false);
    setInputValue('');
    setResults([]);
    setSearchStatus('');
  };

  const handleSelectPlace = (rowIdx: number, place: GeocodePlace) => {
    applyWaypointForRow(rowIdx, {
      lat: place.lat,
      lon: place.lon,
      name: place.name || place.title,
    });
  };

  const handleFocusRow = (rowIdx: number) => {
    const row = rows[rowIdx];
    if (!row) return;
    setActiveRowIdx(rowIdx);
    const w = row.waypoint;
    const coordStr = w ? `${w.lat.toFixed(5)}, ${w.lon.toFixed(5)}` : '';
    setInputValue(w ? w.name || coordStr : '');
    setHasTyped(false);
    setResults([]);
    setSearchStatus('');
  };

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number) => {
    const row = rows[rowIdx];
    if (e.key === 'Escape') {
      e.preventDefault();
      setActiveRowIdx(null);
      setHasTyped(false);
      setResults([]);
      setSearchStatus('');
      if (isAddingStop && row?.waypointIndex === null) {
        setIsAddingStop(false);
      }
    } else if (e.key === 'ArrowDown') {
      if (results.length > 0) {
        e.preventDefault();
        setActiveResultIdx((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (results.length > 0) {
        e.preventDefault();
        setActiveResultIdx((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleSelectPlace(rowIdx, results[activeResultIdx] || results[0]);
      } else if (row && row.waypointIndex !== null && hasTyped) {
        const w = row.waypoint;
        if (w) {
          geocodedKeysRef.current.add(`${row.waypointIndex}:${w.lat.toFixed(5)},${w.lon.toFixed(5)}`);
        }
        onRename(row.waypointIndex, inputValue);
        setActiveRowIdx(null);
        setHasTyped(false);
      }
    }
  };

  // Drag and drop reordering for filled waypoints
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, wpIdx: number | null) => {
    if (wpIdx === null || n < 2) {
      e.preventDefault();
      return;
    }
    if ((e.target as HTMLElement).closest('button, input')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(wpIdx));
    requestAnimationFrame(() => {
      setDraggedIndex(wpIdx);
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, wpIdx: number | null) => {
    if (wpIdx === null || draggedIndex === null || draggedIndex === wpIdx) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const isAbove = e.clientY < rect.top + rect.height / 2;
    setDropTarget({ index: wpIdx, isAbove });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, wpIdx: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (wpIdx === null || draggedIndex === null || draggedIndex === wpIdx) {
      setDraggedIndex(null);
      setDropTarget(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const isAbove = e.clientY < rect.top + rect.height / 2;
    let targetIndex = isAbove ? wpIdx : wpIdx + 1;
    if (draggedIndex < targetIndex) targetIndex--;
    if (draggedIndex !== targetIndex) {
      onReorder(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleTouchPointerDown = (e: React.PointerEvent<HTMLSpanElement>, wpIdx: number | null) => {
    if (e.pointerType === 'mouse' || wpIdx === null || n < 2) return;
    const startY = e.clientY;
    let isDragging = false;
    let currentTargetIdx: number | null = null;
    let isAbove = false;

    const cleanup = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      setDraggedIndex(null);
      setDropTarget(null);
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDragging && Math.abs(ev.clientY - startY) > 6) {
        isDragging = true;
        setDraggedIndex(wpIdx);
      }
      if (!isDragging) return;
      ev.preventDefault();

      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const targetRow = el?.closest('.wp-row') as HTMLElement | null;
      if (targetRow && targetRow.dataset.index !== undefined) {
        const idx = Number(targetRow.dataset.index);
        if (!Number.isNaN(idx)) {
          const rect = targetRow.getBoundingClientRect();
          isAbove = ev.clientY < rect.top + rect.height / 2;
          currentTargetIdx = idx;
          setDropTarget({ index: idx, isAbove });
          return;
        }
      }
      currentTargetIdx = null;
      setDropTarget(null);
    };

    const onPointerCancel = () => cleanup();

    const onPointerUp = () => {
      cleanup();
      if (currentTargetIdx !== null && currentTargetIdx !== wpIdx) {
        let targetIndex = isAbove ? currentTargetIdx : currentTargetIdx + 1;
        if (wpIdx < targetIndex) targetIndex--;
        if (wpIdx !== targetIndex) {
          onReorder(wpIdx, targetIndex);
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  };

  const isGeocodingAny = pendingCoords.size > 0;
  const hasUnattemptedWaypoints =
    isOnlineMode() &&
    waypoints.some((w) => !w.name && !attemptedCoordsRef.current.has(wpCoordKey(w)));

  return (
    <div className="waypoints-container" ref={containerRef}>
      {n > AUTO_GEOCODE_MAX_POINTS && hasUnattemptedWaypoints && !isGeocodingAny && (
        <div className="avoid-list-header" style={{ marginBottom: '4px' }}>
          <span className="avoid-list-title">Auto-geocoding paused ({n} points)</span>
          <button
            id="btn-geocode-all"
            type="button"
            className="avoid-clear-btn"
            style={{ color: 'var(--accent)' }}
            title="Lookup street names for all unnamed waypoints"
            onClick={geocodeAllWaypoints}
          >
            Geocode all
          </button>
        </div>
      )}

      <div className="waypoints-list-and-swap">
        <div id="waypoint-list" ref={listRef}>
        {rows.map((row, rIdx) => {
          const w = row.waypoint;
          const wpIdx = row.waypointIndex;
          const cKey = w ? wpCoordKey(w) : '';
          const isRowGeocoding = Boolean(w && !w.name && pendingCoords.has(cKey));
          const coordStr = w ? `${w.lat.toFixed(5)}, ${w.lon.toFixed(5)}` : '';
          const displayName = w ? w.name || coordStr : '';
          const isActive = activeRowIdx === rIdx;
          const canDrag = wpIdx !== null && n >= 2 && !isActive;

          let rowClass = `wp-row ${w ? 'is-filled' : 'is-empty'}`;
          if (wpIdx !== null && draggedIndex === wpIdx) rowClass += ' dragging';
          if (wpIdx !== null && dropTarget?.index === wpIdx) {
            rowClass += dropTarget.isAbove ? ' drop-above' : ' drop-below';
          }

          const showDropdown =
            isActive &&
            (results.length > 0 ||
              Boolean(searchStatus) ||
              (!hasTyped && Boolean(onUseMyLocationAt) && !w));

          return (
            <div
              key={row.rowKey}
              className={rowClass}
              data-index={wpIdx !== null ? wpIdx : undefined}
              draggable={canDrag}
              onDragStart={(e) => handleDragStart(e, wpIdx)}
              onDragOver={(e) => handleDragOver(e, wpIdx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, wpIdx)}
              onDragEnd={handleDragEnd}
            >
              <span
                className={`wp-drag-handle ${canDrag ? '' : 'is-disabled'}`}
                title={canDrag ? 'Drag to reorder' : undefined}
                aria-label="Drag to reorder"
                onPointerDown={(e) => handleTouchPointerDown(e, wpIdx)}
              >
                <Icon name="grip" size={13} />
              </span>

              <div className="wp-rail-col">
                <button
                  type="button"
                  className={`wp-badge ${row.slotRole} ${w ? '' : 'is-outline'}`}
                  title={w ? 'Center map on this point' : row.placeholder}
                  onClick={() => {
                    if (w) {
                      onFlyTo?.(w.lon, w.lat);
                    } else {
                      handleFocusRow(rIdx);
                    }
                  }}
                >
                  {row.badgeText}
                </button>
                {rIdx < rows.length - 1 && <span className="wp-rail-dots" aria-hidden="true" />}
              </div>

              <div className={`wp-input-pill ${isActive ? 'is-focused' : ''}`}>
                {isRowGeocoding && !isActive ? (
                  <div
                    className="wp-loading-placeholder"
                    title={`Looking up address for ${coordStr}`}
                    onClick={() => handleFocusRow(rIdx)}
                  >
                    <span className="wp-loading-shimmer" />
                  </div>
                ) : (
                  <input
                    ref={isActive ? activeInputRef : undefined}
                    id={rIdx === 0 ? 'input-place-search' : undefined}
                    type="text"
                    className="wp-pill-input"
                    value={isActive ? inputValue : displayName}
                    placeholder={row.placeholder}
                    autoComplete="off"
                    onFocus={() => handleFocusRow(rIdx)}
                    onChange={(e) => {
                      if (!isActive) setActiveRowIdx(rIdx);
                      setInputValue(e.target.value);
                      setHasTyped(true);
                    }}
                    onKeyDown={(e) => handleRowKeyDown(e, rIdx)}
                  />
                )}

                {!w && !isActive && onUseMyLocationAt && rIdx === 0 && (
                  <button
                    id="btn-my-location"
                    type="button"
                    className="wp-pill-action-btn"
                    title="Use my current location"
                    aria-label="Use my current location"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseMyLocationAt((pt) => applyWaypointForRow(rIdx, pt));
                    }}
                  >
                    <Icon name="locate" size={14} />
                  </button>
                )}

                {(w || (isActive && inputValue.length > 0) || (isAddingStop && rIdx === rows.length - 1)) && (
                  <button
                    type="button"
                    className="wp-pill-action-btn wp-pill-clear-btn"
                    title={isActive && hasTyped ? 'Clear text' : 'Remove waypoint'}
                    aria-label={isActive && hasTyped ? 'Clear text' : 'Remove waypoint'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive && hasTyped && inputValue.length > 0) {
                        setInputValue('');
                        setResults([]);
                        setSearchStatus('');
                        activeInputRef.current?.focus();
                      } else if (wpIdx !== null) {
                        setActiveRowIdx(null);
                        setHasTyped(false);
                        onRemove(wpIdx);
                      } else if (isAddingStop && rIdx === rows.length - 1) {
                        setIsAddingStop(false);
                        setActiveRowIdx(null);
                      }
                    }}
                  >
                    <Icon name="close" size={13} />
                  </button>
                )}

                {showDropdown && (
                  <div id="search-results-list" className="search-results wp-row-dropdown" role="listbox">
                    {!hasTyped && onUseMyLocationAt && (
                      <div
                        role="option"
                        aria-selected={false}
                        className="search-item wp-UseLocation-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onUseMyLocationAt((pt) => applyWaypointForRow(rIdx, pt));
                        }}
                      >
                        <Icon name="locate" size={14} className="wp-loc-opt-icon" />
                        <div className="search-item-info">
                          <span className="search-item-title">Your location</span>
                        </div>
                      </div>
                    )}
                    {searchStatus ? (
                      <div className="search-status-item">{searchStatus}</div>
                    ) : (
                      results.map((p, idx) => (
                        <div
                          key={idx}
                          role="option"
                          aria-selected={idx === activeResultIdx}
                          className={`search-item ${idx === activeResultIdx ? 'active' : ''}`}
                          onMouseEnter={() => setActiveResultIdx(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectPlace(rIdx, p);
                          }}
                        >
                          <div className="search-item-info">
                            <span className="search-item-title">{p.title}</span>
                            {p.subtitle && <span className="search-item-subtitle">{p.subtitle}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        </div>

        {onReverse && (
          <button
            id="btn-reverse-route"
            type="button"
            className="waypoints-reverse-btn"
            title="Reverse route direction"
            aria-label="Reverse route"
            disabled={n < 2}
            onClick={onReverse}
          >
            <Icon name="reverse" size={14} />
          </button>
        )}
      </div>

      {n >= 2 && !isAddingStop && (
        <button
          id="btn-add-waypoint"
          type="button"
          className="wp-add-stop-row"
          onClick={() => {
            setIsAddingStop(true);
            setActiveRowIdx(n);
            setInputValue('');
            setHasTyped(false);
            setResults([]);
            setSearchStatus('');
          }}
        >
          <span className="wp-drag-handle is-disabled" aria-hidden="true" />
          <span className="wp-add-stop-badge" aria-hidden="true">
            +
          </span>
          <span className="wp-add-stop-label">Add waypoint</span>
        </button>
      )}

      {avoidAreas.length > 0 && (
        <div className="avoid-list-section">
          {avoidAreas.length > 1 && onClearAvoidAreas && (
            <div className="avoid-list-header">
              <span className="avoid-list-title">Avoid Areas ({avoidAreas.length})</span>
              <button type="button" className="avoid-clear-btn" onClick={onClearAvoidAreas}>
                Clear all
              </button>
            </div>
          )}
          <div className="avoid-chips" aria-label="Avoid areas">
            {avoidAreas.map((area, idx) => {
              const r = Math.round(area.radius);
              const nextRadius =
                AVOID_RADIUS_PRESETS[
                  (AVOID_RADIUS_PRESETS.indexOf(r) + 1) % AVOID_RADIUS_PRESETS.length
                ] || AVOID_RADIUS_PRESETS[0];
              return (
                <div key={idx} className="avoid-chip">
                  <button
                    type="button"
                    className="avoid-chip-locate"
                    title={`Center on avoid area (${area.lat.toFixed(4)}, ${area.lon.toFixed(4)})`}
                    onClick={() => onFlyTo?.(area.lon, area.lat)}
                  >
                    <Icon name="ban" size={11} />
                    <span>Avoid #{idx + 1}</span>
                  </button>
                  {onUpdateAvoidAreaRadius && (
                    <button
                      type="button"
                      className="avoid-chip-radius"
                      title="Click to cycle avoid radius"
                      onClick={() => onUpdateAvoidAreaRadius(idx, nextRadius)}
                    >
                      {r} m
                    </button>
                  )}
                  {onRemoveAvoidArea && (
                    <button
                      type="button"
                      className="avoid-chip-remove"
                      title="Remove avoid area"
                      aria-label={`Remove avoid area ${idx + 1}`}
                      onClick={() => onRemoveAvoidArea(idx)}
                    >
                      <Icon name="close" size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
