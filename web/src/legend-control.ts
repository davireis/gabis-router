// Map control button to show/hide the map legend for GBRouter tiles.

import type maplibregl from 'maplibre-gl';
import { getBasemap, onBasemapChange, type Basemap } from './basemap.ts';

export class LegendControl implements maplibregl.IControl {
  private container?: HTMLElement;
  private button?: HTMLButtonElement;
  private panel?: HTMLElement;
  private unsubBasemap?: () => void;
  private isOpen = false;

  onAdd(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group legend-ctrl';

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'maplibregl-ctrl-legend';
    this.button.title = 'Map legend';
    this.button.setAttribute('aria-label', 'Toggle map legend');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.innerHTML = '<span class="maplibregl-ctrl-icon" aria-hidden="true"></span>';

    this.panel = document.createElement('div');
    this.panel.className = 'map-legend-panel';
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'Map legend');

    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', this.onDocClick);
    document.addEventListener('keydown', this.onKeyDown);

    this.unsubBasemap = onBasemapChange(() => {
      this.syncBasemap(getBasemap());
    });

    this.container.appendChild(this.button);
    this.container.appendChild(this.panel);
    this.syncBasemap(getBasemap());
    return this.container;
  }

  onRemove(): void {
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keydown', this.onKeyDown);
    this.unsubBasemap?.();
    this.unsubBasemap = undefined;
    this.button = undefined;
    this.panel = undefined;
    this.container?.remove();
  }

  private onDocClick = (e: MouseEvent) => {
    if (!this.isOpen) return;
    if (this.container && !this.container.contains(e.target as Node)) {
      this.close();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.panel || !this.button) return;
    this.isOpen = true;
    this.panel.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    this.button.classList.add('active');
  }

  close() {
    if (!this.panel || !this.button) return;
    this.isOpen = false;
    this.panel.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
    this.button.classList.remove('active');
  }

  private syncBasemap(basemap: Basemap) {
    if (!this.container) return;
    const isGbRouter = basemap === 'standard' || basemap === 'dense';
    if (!isGbRouter) {
      this.close();
      this.container.style.display = 'none';
      return;
    }
    this.container.style.display = '';
    this.renderPanel(basemap);
  }

  private renderPanel(basemap: Basemap) {
    if (!this.panel) return;
    const isDense = basemap === 'dense';
    const title = isDense ? 'GBRouter Dense Legend' : 'GBRouter Light Legend';

    this.panel.innerHTML = `
      <div class="map-legend-header">
        <span>${title}</span>
        <button type="button" class="map-legend-close" aria-label="Close legend" title="Close">✕</button>
      </div>
      <div class="map-legend-section">
        <div class="map-legend-section-title">Cycle Networks</div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#fb7185" stroke-width="6" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="map-legend-label">National (NCN)</span>
          <span class="map-legend-badge" style="background:#e11d48">1</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#c084fc" stroke-width="6" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="map-legend-label">Regional (RCN)</span>
          <span class="map-legend-badge" style="background:#9333ea">42</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#14b8a6" stroke-width="6" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="map-legend-label">Local (LCN)</span>
          <span class="map-legend-badge" style="background:#0d9488">L3</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#eab308" stroke-width="6" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="map-legend-label">MTB Route</span>
          <span class="map-legend-badge" style="background:#ca8a04">M</span>
        </div>
      </div>
      <div class="map-legend-section">
        <div class="map-legend-section-title">Paths &amp; Lanes</div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#c7d2fe" stroke-width="5" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#4f46e5" stroke-width="2.6" stroke-linecap="round" />
            </svg>
          </span>
          <span class="map-legend-label">Dedicated Cycleway</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#a5b4fc" stroke-width="3.2" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#4f46e5" stroke-width="2.4" stroke-dasharray="9 2" />
            </svg>
          </span>
          <span class="map-legend-label">On-road Cycle Lane</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#86efac" stroke-width="3.2" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#16a34a" stroke-width="2.2" stroke-dasharray="9 2" />
            </svg>
          </span>
          <span class="map-legend-label">Bridleway / Bike Track</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#64748b" stroke-width="2" stroke-dasharray="7 2" />
            </svg>
          </span>
          <span class="map-legend-label">Footpath / Trail</span>
        </div>
      </div>
      ${
        isDense
          ? `
      <div class="map-legend-section">
        <div class="map-legend-section-title">Terrain &amp; Surface</div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="32" y2="6" stroke="#f5f0e6" stroke-width="4.5" stroke-linecap="round" />
              <line x1="2" y1="6" x2="32" y2="6" stroke="#92400e" stroke-width="2.2" stroke-dasharray="9 2" />
            </svg>
          </span>
          <span class="map-legend-label">Farm / Forest Track</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="3.5" x2="32" y2="3.5" stroke="#b88c65" stroke-width="1.3" stroke-opacity="0.75" />
              <line x1="2" y1="8.5" x2="32" y2="8.5" stroke="#b88c65" stroke-width="0.7" stroke-opacity="0.45" />
            </svg>
          </span>
          <span class="map-legend-label">Contours (50m / 10m)</span>
        </div>
        <div class="map-legend-row">
          <span class="map-legend-swatch">
            <svg width="34" height="12" viewBox="0 0 34 12">
              <line x1="2" y1="6" x2="15" y2="6" stroke="#dc2626" stroke-width="3" stroke-dasharray="1.5 2" />
              <line x1="19" y1="6" x2="32" y2="6" stroke="#0284c7" stroke-width="2.4" stroke-dasharray="2.5 2.5" stroke-linecap="round" />
            </svg>
          </span>
          <span class="map-legend-label">Steps / Ford</span>
        </div>
      </div>`
          : ''
      }
    `;

    this.panel.querySelector('.map-legend-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
  }
}

export const legendControl = new LegendControl();
