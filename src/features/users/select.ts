import { ALL } from '@/lib/data/filters';
import { USER_STATUS } from '@/lib/auth/labels';
import type { UserRow, UserStatus } from '@/lib/auth/types';
import { toLatinDigits } from '@/lib/auth/validation';

export const AUDIENCE_FILTERS = [ALL, 'الفريق', 'العملاء'] as const;
export type AudienceFilter = (typeof AUDIENCE_FILTERS)[number];

export const STATUS_FILTERS: { id: UserStatus | typeof ALL; label: string }[] = [
  { id: ALL, label: ALL },
  ...(['active', 'unverified', 'invited', 'suspended'] as UserStatus[]).map((id) => ({ id, label: USER_STATUS[id].label })),
];

export function selectUsers(rows: UserRow[], filters: { query: string; audience: AudienceFilter; status: string }) {
  const q = toLatinDigits(filters.query.trim().toLowerCase());
  const visible = rows.filter(
    (r) =>
      (filters.audience === ALL || (filters.audience === 'العملاء') === (r.role === 'customer')) &&
      (filters.status === ALL || r.status === filters.status) &&
      (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || (r.email ?? '').includes(q)),
  );
  const staff = rows.filter((r) => r.role !== 'customer' && r.status === 'active');
  return {
    rows: visible,
    count: visible.length + ' من ' + rows.length,
    kpis: {
      active: String(rows.filter((r) => r.status === 'active').length),
      invited: String(rows.filter((r) => r.status === 'invited').length),
      suspended: String(rows.filter((r) => r.status === 'suspended').length),
      twoStep: staff.length ? Math.round((staff.filter((r) => r.twoStep).length / staff.length) * 100) + '%' : '—',
    },
  };
}
