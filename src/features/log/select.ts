import { sar } from '@/lib/format';
import { LOG_STATUS_TONES, ORDER_LOG } from '@/lib/data/orders';
import { ALL } from '@/lib/data/filters';
import { inRoleScope, matchesBranch } from '@/lib/roles';
import { activeRole, type DashboardState } from '@/lib/store/reducer';

export interface LogFilters {
  query: string;
  status: string;
  type: string;
}

export function selectLog(state: DashboardState, filters: LogFilters) {
  const role = activeRole(state);
  const all = ORDER_LOG.filter((r) => matchesBranch(state.branch, r.branch)).filter((r) => inRoleScope(role, r.branch));
  const q = filters.query.trim();
  const rows = all
    .filter((r) => filters.status === ALL || r.status === filters.status)
    .filter((r) => filters.type === ALL || r.type === filters.type)
    .filter((r) => !q || (r.id + ' ' + r.customer + ' ' + r.items).includes(q))
    .map((r) => ({
      ...r,
      total: sar(r.total),
      when: r.date + ' · ' + r.time,
      points: '+' + r.points,
      tone: LOG_STATUS_TONES[r.status],
    }));
  // The summary cards cover the branch's whole log and ignore the search filters (as designed).
  const sum = all.reduce((acc, r) => acc + r.total, 0);
  return {
    rows,
    count: rows.length + ' طلب',
    sum: sar(sum),
    avg: sar(Math.round(sum / (all.length || 1))),
    boxes: String(all.filter((r) => r.type === 'بوكس').length),
    cancelled: String(all.filter((r) => r.status === 'ملغي' || r.status === 'مسترجع').length),
  };
}
