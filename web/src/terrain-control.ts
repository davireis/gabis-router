// Map control button to toggle 3D terrain and camera pitch (defaults to 2D).

import type maplibregl from 'maplibre-gl';
import { getDemSource } from './utils/map-styles.ts';

const TERRAIN_SOURCE_ID = 'dem';
const BUILDING_3D_LAYER_ID = 'dense-building-3d';
const DEFAULT_3D_EXAGGERATION = 1.5;
const DEFAULT_3D_PITCH = 52;

export class Terrain3DControl implements maplibregl.IControl {
  private map?: maplibregl.Map;
  private container?: HTMLElement;
  private button?: HTMLButtonElement;
  private enabled = false;
  private isOffline = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  setOffline(offline: boolean) {
    this.isOffline = offline;
    if (offline && this.enabled) {
      this.setEnabled(false);
    }
    this.updateButtonState();
  }

  onAdd(map: maplibregl.Map): HTMLElement {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group terrain-3d-ctrl';

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'maplibregl-ctrl-terrain-3d';
    this.button.title = 'Toggle 3D mode';
    this.button.setAttribute('aria-label', 'Toggle 3D mode');
    this.button.setAttribute('aria-pressed', 'false');
    this.button.innerHTML = '<span class="terrain-3d-label" aria-hidden="true">3D</span>';

    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isOffline) return;
      this.setEnabled(!this.enabled);
    });

    this.updateButtonState();
    this.container.appendChild(this.button);
    return this.container;
  }

  onRemove(): void {
    this.button = undefined;
    this.container?.remove();
    this.map = undefined;
  }

  setEnabled(next: boolean, animateCamera = true) {
    this.enabled = next;
    this.updateButtonState();
    if (!this.map) return;
    this.applyToMap(this.map, animateCamera);
  }

  syncWithStyle(map: maplibregl.Map) {
    this.map = map;
    if (!this.enabled || this.isOffline) return;
    this.applyToMap(map, false);
  }

  private ensureDemSource(map: maplibregl.Map): boolean {
    if (map.getSource(TERRAIN_SOURCE_ID)) return true;
    try {
      const demSource = getDemSource();
      map.addSource(TERRAIN_SOURCE_ID, {
        type: 'raster-dem',
        encoding: 'terrarium',
        tiles: [demSource.sharedDemProtocolUrl],
        tileSize: 512,
        maxzoom: 12,
        attribution:
          '© <a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">Mapterhorn</a>',
      });
      return true;
    } catch {
      return false;
    }
  }

  private sync3DBuildings(map: maplibregl.Map, show: boolean) {
    try {
      if (!show) {
        if (map.getLayer(BUILDING_3D_LAYER_ID)) {
          map.setLayoutProperty(BUILDING_3D_LAYER_ID, 'visibility', 'none');
        }
        return;
      }

      if (!map.getSource('openmaptiles')) return;

      if (map.getLayer(BUILDING_3D_LAYER_ID)) {
        map.setLayoutProperty(BUILDING_3D_LAYER_ID, 'visibility', 'visible');
        return;
      }

      const styleLayers = map.getStyle()?.layers || [];
      const labelAnchor = styleLayers.find(
        (l) => l.type === 'symbol' && l.id !== 'dense-oneway-arrows',
      )?.id;

      map.addLayer(
        {
          id: BUILDING_3D_LAYER_ID,
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: 14.5,
          paint: {
            'fill-extrusion-color': '#e2dad0',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14.5,
              0,
              15.2,
              ['coalesce', ['get', 'render_height'], 8],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14.5,
              0,
              15.2,
              ['coalesce', ['get', 'render_min_height'], 0],
            ],
            'fill-extrusion-opacity': 0.78,
          },
        } as any,
        labelAnchor,
      );
    } catch {
      // Ignore if style is still transitioning
    }
  }

  private applyToMap(map: maplibregl.Map, animateCamera: boolean) {
    if (this.enabled && !this.isOffline) {
      if (this.ensureDemSource(map)) {
        try {
          map.setTerrain({
            source: TERRAIN_SOURCE_ID,
            exaggeration: DEFAULT_3D_EXAGGERATION,
          });
        } catch {
          // Ignore if terrain cannot be attached yet
        }
      }
      this.sync3DBuildings(map, true);
      if (animateCamera && map.getPitch() < 15) {
        map.easeTo({ pitch: DEFAULT_3D_PITCH, duration: 450 });
      }
    } else {
      try {
        if (map.getTerrain()) {
          map.setTerrain(null);
        }
      } catch {
        // Ignore if style is not ready
      }
      this.sync3DBuildings(map, false);
      if (animateCamera && (map.getPitch() > 0 || Math.abs(map.getBearing()) > 0.5)) {
        map.easeTo({ pitch: 0, bearing: 0, duration: 400 });
      }
    }
  }

  private updateButtonState() {
    if (!this.button) return;
    this.button.disabled = this.isOffline;
    this.button.style.opacity = this.isOffline ? '0.4' : '1';
    this.button.style.cursor = this.isOffline ? 'default' : 'pointer';
    this.button.classList.toggle('active', this.enabled && !this.isOffline);
    this.button.setAttribute('aria-pressed', this.enabled && !this.isOffline ? 'true' : 'false');
    this.button.title = this.isOffline
      ? '3D terrain unavailable offline'
      : this.enabled
        ? 'Switch to 2D view'
        : 'Switch to 3D terrain view';
  }
}

export const terrain3DControl = new Terrain3DControl();
