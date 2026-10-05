import { sar } from '@/lib/format';
import { ALL } from '@/lib/data/filters';
import { ADDON_BANK, ADDON_SEPARATOR, BASE_MENU, MENU_CATEGORIES } from '@/lib/data/menu';
import type { DashboardState } from '@/lib/store/reducer';
import type { MenuItem } from '@/lib/types';

export interface MenuFilters {
  query: string;
  cat: string;
  avail: string;
}

/** Seeded items with this session's edits applied, followed by items added this session. */
export function mergedMenu(state: DashboardState): MenuItem[] {
  return [...BASE_MENU, ...state.menuAdded].map((m) => ({ ...m, ...state.menuEdits[m.id] }));
}

export function allAddons(state: DashboardState) {
  return [...ADDON_BANK, ...state.addonsExtra];
}

/** Addon names in a '، '-separated list. */
export function splitAddons(text: string): string[] {
  return text
    .split('،')
    .map((x) => x.trim())
    .filter(Boolean);
}

export function joinAddons(names: string[]): string {
  return names.join(ADDON_SEPARATOR);
}

export function selectMenu(state: DashboardState, filters: MenuFilters) {
  const items = mergedMenu(state);
  const q = filters.query.trim();
  const rows = items
    .filter((m) => filters.cat === ALL || m.cat === filters.cat)
    .filter((m) => !q || (m.name + ' ' + m.desc + ' ' + m.addons).includes(q))
    .filter((m) => {
      const off = !!state.menuOff[m.id];
      if (filters.avail === 'متوفر') return !off;
      if (filters.avail === 'غير متوفر') return off;
      return true;
    })
    .map((m) => ({
      item: m,
      price: sar(m.price),
      available: !state.menuOff[m.id],
      isNew: state.menuAdded.some((a) => a.id === m.id),
    }));

  const extraIds = new Set(state.addonsExtra.map((a) => a.id));
  return {
    categories: [ALL, ...MENU_CATEGORIES].map((c) => ({
      name: c,
      count: String(c === ALL ? items.length : items.filter((m) => m.cat === c).length),
    })),
    rows,
    resultCount: rows.length + ' من ' + items.length + ' صنف',
    filtersDirty: !!(filters.query || filters.cat !== ALL || filters.avail !== ALL),
    addons: allAddons(state).map((a) => ({ ...a, priceText: sar(a.price), isNew: extraIds.has(a.id) })),
  };
}
