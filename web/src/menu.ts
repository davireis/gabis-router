// A small popup menu for the map. It knows nothing about routes.

export interface MenuItem {
  label: string;
  hint?: string;
  danger?: boolean;
  dividerBefore?: boolean;
  active?: boolean;
  onSelect: () => void;
}

export interface MenuBadge {
  text: string;
  color?: string;
}

export interface MenuHeaderInfo {
  title?: string;
  subtitle?: string;
  tags?: string[];
  badges?: MenuBadge[];
}

let menuEl: HTMLDivElement | null = null;
let headerEl: HTMLDivElement | null = null;
let headerTitleEl: HTMLDivElement | null = null;
let headerSubtitleEl: HTMLDivElement | null = null;
let headerMetaRowEl: HTMLDivElement | null = null;
let menuPos = { x: 0, y: 0 };
let menuSession = 0;
let closedAt = 0;

function positionMenu(el: HTMLDivElement, x: number, y: number) {
  const margin = 10;
  el.style.left = `${Math.max(margin, Math.min(x, window.innerWidth - el.offsetWidth - margin))}px`;
  el.style.top = `${Math.max(margin, Math.min(y, window.innerHeight - el.offsetHeight - margin))}px`;
}

export function hideMenu() {
  if (!menuEl) return;
  menuEl.remove();
  menuEl = null;
  headerEl = null;
  headerTitleEl = null;
  headerSubtitleEl = null;
  headerMetaRowEl = null;
  menuSession++;
  closedAt = performance.now();
}

export function updateMenuHeader(headerText: string, expectedSession?: number) {
  if (!menuEl || !headerTitleEl) return;
  if (expectedSession !== undefined && expectedSession !== menuSession) return;
  headerTitleEl.textContent = headerText;
  if (headerSubtitleEl) {
    const subText = headerSubtitleEl.textContent || '';
    if (subText && headerText.toLowerCase().includes(subText.toLowerCase())) {
      headerSubtitleEl.remove();
      headerSubtitleEl = null;
    }
  }
  positionMenu(menuEl, menuPos.x, menuPos.y);
}

export function appendMenuTags(newTags: string[], expectedSession?: number) {
  if (!menuEl || !headerEl || newTags.length === 0) return;
  if (expectedSession !== undefined && expectedSession !== menuSession) return;

  if (!headerMetaRowEl) {
    headerMetaRowEl = document.createElement('div');
    headerMetaRowEl.className = 'map-menu-meta';
    headerEl.appendChild(headerMetaRowEl);
    headerEl.classList.add('map-menu-header-rich');
  }

  const existingLower = new Set(
    Array.from(headerMetaRowEl.querySelectorAll('.map-menu-tag')).map((el) =>
      (el.textContent || '').trim().toLowerCase(),
    ),
  );

  for (const tag of newTags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (existingLower.has(lower)) continue;
    existingLower.add(lower);
    const chip = document.createElement('span');
    chip.className = 'map-menu-tag';
    chip.textContent = trimmed;
    headerMetaRowEl.appendChild(chip);
  }

  positionMenu(menuEl, menuPos.x, menuPos.y);
}

/** True if a menu was open a moment ago. Lets the caller ignore the click that closed it. */
export function menuClosedWithin(ms: number): boolean {
  return performance.now() - closedAt < ms;
}

/** Shows a menu at viewport position (x, y). It stays inside the window. */
export function showMenu(
  items: MenuItem[],
  x: number,
  y: number,
  header?: string | MenuHeaderInfo,
): number {
  hideMenu();
  const session = ++menuSession;
  menuPos = { x, y };
  const el = document.createElement('div');
  el.id = 'map-menu';
  el.setAttribute('role', 'menu');

  if (header) {
    const info: MenuHeaderInfo = typeof header === 'string' ? { title: header } : header;
    const hasDetails =
      Boolean(info.subtitle) ||
      Boolean(info.tags && info.tags.length > 0) ||
      Boolean(info.badges && info.badges.length > 0);

    const hdr = document.createElement('div');
    hdr.className = hasDetails ? 'map-menu-header map-menu-header-rich' : 'map-menu-header';
    headerEl = hdr;

    if (info.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'map-menu-header-title';
      titleEl.textContent = info.title;
      hdr.appendChild(titleEl);
      headerTitleEl = titleEl;
    }

    if (info.subtitle) {
      const subEl = document.createElement('div');
      subEl.className = 'map-menu-header-subtitle';
      subEl.textContent = info.subtitle;
      hdr.appendChild(subEl);
      headerSubtitleEl = subEl;
    }

    if ((info.badges && info.badges.length > 0) || (info.tags && info.tags.length > 0)) {
      const metaRow = document.createElement('div');
      metaRow.className = 'map-menu-meta';
      headerMetaRowEl = metaRow;

      if (info.badges) {
        for (const badge of info.badges) {
          const pill = document.createElement('span');
          pill.className = 'map-menu-badge';
          if (badge.color) {
            pill.style.backgroundColor = badge.color;
          }
          pill.textContent = badge.text;
          metaRow.appendChild(pill);
        }
      }

      if (info.tags) {
        for (const tag of info.tags) {
          const chip = document.createElement('span');
          chip.className = 'map-menu-tag';
          chip.textContent = tag;
          metaRow.appendChild(chip);
        }
      }

      hdr.appendChild(metaRow);
    }

    el.appendChild(hdr);
  }

  for (const item of items) {
    if (item.dividerBefore) {
      const div = document.createElement('div');
      div.className = 'map-menu-divider';
      el.appendChild(div);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    if (item.danger) button.classList.add('map-menu-item-danger');
    if (item.active) button.classList.add('map-menu-item-active');

    const labelSpan = document.createElement('span');
    labelSpan.textContent = item.label;
    button.appendChild(labelSpan);

    if (item.hint) {
      const hintSpan = document.createElement('small');
      hintSpan.className = 'map-menu-hint';
      hintSpan.textContent = item.hint;
      button.appendChild(hintSpan);
    }

    button.addEventListener('click', () => {
      hideMenu();
      item.onSelect();
    });
    el.appendChild(button);
  }
  document.body.appendChild(el);

  positionMenu(el, x, y);
  el.querySelector('button')?.focus();
  menuEl = el;
  return session;
}

// Capture phase: the map stops some events before they bubble up to the document.
document.addEventListener(
  'pointerdown',
  (e) => {
    if (menuEl && !menuEl.contains(e.target as Node)) hideMenu();
  },
  true,
);
document.addEventListener('keydown', (e) => {
  if (!menuEl) return;
  if (e.key === 'Escape') {
    hideMenu();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const buttons = Array.from(menuEl.querySelectorAll<HTMLButtonElement>('button'));
    if (buttons.length === 0) return;
    e.preventDefault();
    const cur = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === 'ArrowDown'
        ? (cur + 1) % buttons.length
        : (cur - 1 + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }
});
window.addEventListener('resize', hideMenu);

