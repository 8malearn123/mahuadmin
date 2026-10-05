import { sar } from '@/lib/format';
import { BASE_BOOKINGS, BOOKING_NEXT, BOOKING_STATUS_TONES, BOX_CATALOG, BOX_DAYS, DELIVERY_WINDOWS } from '@/lib/data/boxes';
import { ALL_BRANCHES, inRoleScope, matchesBranch } from '@/lib/roles';
import { activeRole, type DashboardState } from '@/lib/store/reducer';
import type { Booking, Tone } from '@/lib/types';

const PRICE = Object.fromEntries(BOX_CATALOG.map((c) => [c.name, c.price]));
const qtySum = (list: Booking[]) => list.reduce((acc, b) => acc + b.qty, 0);

function capacityTone(pct: number): Tone {
  return pct > 85 ? 'bad' : pct > 0 ? 'ok' : 'muted';
}

export function selectBoxes(state: DashboardState, selectedDay: number) {
  const role = activeRole(state);
  const all = [...BASE_BOOKINGS, ...state.bookingsAdded]
    .map((b) => ({
      ...b,
      status: state.bookingStatus[b.id] ?? b.status,
      pay: state.bookingPaid[b.id] ? ('مدفوع' as const) : b.pay,
    }))
    .filter((b) => inRoleScope(role, b.branch))
    .filter((b) => matchesBranch(state.branch, b.branch));
  const live = all.filter((b) => b.status !== 'ملغي');

  const weekDays = BOX_DAYS.map((d) => {
    const used = qtySum(live.filter((b) => b.day === d.key));
    const pct = Math.min(100, Math.round((used / d.cap) * 100));
    return { key: d.key, label: d.day, date: d.date, count: String(used), capText: used + '/' + d.cap, pct: pct + '%', tone: capacityTone(pct) };
  });

  const day = BOX_DAYS[selectedDay];
  // The schedule lists cancelled bookings too; capacity only counts live ones.
  const dayItems = all.filter((b) => b.day === selectedDay);
  const dayUsed = qtySum(live.filter((b) => b.day === selectedDay));
  const windows = DELIVERY_WINDOWS.map((window) => ({
    window,
    items: dayItems
      .filter((b) => b.window === window)
      .map((b) => {
        const next = BOOKING_NEXT[b.status];
        return {
          ...b,
          qty: b.qty + '×',
          total: sar((PRICE[b.box] ?? 0) * b.qty),
          tone: BOOKING_STATUS_TONES[b.status],
          payTone: (b.pay === 'مدفوع' ? 'ok' : 'bad') as Tone,
          next: next ? { ...next, markPaid: b.status === 'بانتظار الدفع' } : null,
          canCancel: b.status !== 'ملغي' && b.status !== 'تم التسليم',
        };
      }),
  }));

  return {
    kpis: [
      { label: 'حجوزات قادمة', value: String(live.filter((b) => b.status !== 'تم التسليم').length), note: 'خلال 7 أيام', tone: 'ink' as Tone },
      { label: 'بانتظار الدفع', value: String(live.filter((b) => b.pay === 'غير مدفوع').length), note: 'تحتاج متابعة', tone: 'bad' as Tone },
      { label: 'تُجهَّز اليوم', value: String(qtySum(live.filter((b) => b.day === 0))), note: 'بوكس', tone: 'ok' as Tone },
      { label: 'إيراد البوكسات', value: sar(live.reduce((acc, b) => acc + (PRICE[b.box] ?? 0) * b.qty, 0)), note: 'الأسبوع الحالي', tone: 'ok' as Tone },
    ],
    weekDays,
    day: {
      title: day.day + ' · ' + day.dow,
      date: day.date,
      cap: dayUsed + ' من ' + day.cap + ' بوكس',
      pct: Math.min(100, Math.round((dayUsed / day.cap) * 100)) + '%',
      tone: (dayUsed / day.cap > 0.85 ? 'bad' : 'ok') as Tone,
      windows,
      empty: dayItems.length === 0,
    },
    catalog: BOX_CATALOG.map((c) => ({
      ...c,
      price: sar(c.price),
      lead: 'يُطلب قبل ' + c.lead + ' ساعة',
      booked: qtySum(live.filter((b) => b.box === c.name)) + ' محجوز',
      on: !state.boxOff[c.name],
    })),
    /** Branches a new booking can be assigned to. */
    bookingBranches: role.branches.filter((b) => b !== ALL_BRANCHES),
  };
}
