import { sar, maskPhone } from '@/lib/format';
import { BOX_SCHEDULE } from '@/lib/data/boxes';
import { ORDER_LOG } from '@/lib/data/orders';
import { CUSTOMERS } from '@/lib/data/people';
import { ROLES, inRoleScope, isMultiBranch, matchesBranch } from '@/lib/roles';
import type { DashboardState } from '@/lib/store/reducer';
import type { Customer, LogStatus, PiiLevel, Tone } from '@/lib/types';

function shownPhone(phone: string, pii: PiiLevel): string {
  if (pii === 'full') return phone;
  if (pii === 'partial') return maskPhone(phone);
  return '— محجوب —';
}

function tierTone(tier: Customer['tier']): Tone {
  return tier === 'ماهالو' ? 'bad' : 'ok';
}

function historyTone(status: LogStatus): Tone {
  if (status === 'تم التسليم') return 'muted';
  if (status === 'ملغي') return 'bad';
  return 'ok';
}

export function selectLookup(state: DashboardState, query: string, selectedPhone: string | null) {
  const role = ROLES[state.role];
  const pii = role.pii;
  const q = query.trim();
  // Lookups are limited to the role's branch scope; the header branch tab does not narrow the hits.
  const inScope = CUSTOMERS.filter((c) => inRoleScope(role, c.branch));
  const hits = q.length === 0 ? [] : inScope.filter((c) => c.name.includes(q) || c.phone.includes(q));
  const visible = (branch: string) => inRoleScope(role, branch) && matchesBranch(state.branch, branch);

  const selected = inScope.find((c) => c.phone === selectedPhone);
  const history = selected ? ORDER_LOG.filter((r) => r.customer === selected.name && visible(r.branch)) : [];
  // Bookings come from the published schedule rather than live box state (as designed).
  const bookings = selected
    ? BOX_SCHEDULE.flatMap((d) =>
        d.slots
          .filter((x) => x.customer === selected.name && visible(x.branch))
          .map((x) => ({
            key: d.day + x.time,
            box: x.box,
            when: d.day + ' · ' + x.time,
            branch: x.branch,
            status: x.status,
            tone: (x.status === 'بانتظار الدفع' ? 'bad' : 'ok') as Tone,
          })),
      )
    : [];

  return {
    level: pii === 'full' ? 'وصول كامل للبيانات' : pii === 'partial' ? 'رقم مُقنّع — بيانات تشغيلية فقط' : 'اسم ونقاط فقط',
    levelTone: (pii === 'full' ? 'ok' : 'bad') as Tone,
    scopeNote: isMultiBranch(role) ? 'كل عملاء الفروع' : 'النتائج مقصورة على عملاء فرع ' + role.branches[0],
    count: hits.length + ' نتيجة',
    prompt: q.length === 0,
    empty: q.length > 0 && hits.length === 0,
    hits: hits.map((c) => ({
      key: c.phone,
      name: c.name,
      phone: shownPhone(c.phone, pii),
      tier: c.tier,
      tierTone: tierTone(c.tier),
      points: String(c.points),
      orders: String(c.orders),
      branch: c.branch,
      last: c.last,
      selected: c.phone === selectedPhone,
    })),
    canSeeSpend: pii === 'full',
    selected: selected
      ? {
          name: selected.name,
          initial: selected.name.slice(0, 1),
          phone: shownPhone(selected.phone, pii),
          tier: selected.tier,
          tierTone: tierTone(selected.tier),
          points: String(selected.points),
          toNext: String(Math.max(0, 500 - selected.points)),
          pct: Math.min(100, Math.round((selected.points / 500) * 100)) + '%',
          orders: String(selected.orders),
          spend: sar(selected.spend),
          last: selected.last,
          branch: selected.branch,
          fav: selected.fav,
          note: pii === 'none' ? '— محجوب عن هذا الدور —' : selected.note,
          history: history.slice(0, 6).map((r) => ({
            id: r.id,
            items: r.items,
            branch: r.branch,
            date: r.date,
            total: sar(r.total),
            points: String(r.points),
            status: r.status,
            tone: historyTone(r.status),
          })),
          bookings,
        }
      : null,
  };
}
