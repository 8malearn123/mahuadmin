import { sar } from '@/lib/format';
import {
  BRANCH_PERFORMANCE,
  HOURLY_MAX,
  HOURLY_ORDERS,
  OPERATIONAL_ALERTS,
  ORDER_CHANNELS,
  PERIOD_FACTORS,
  TOP_ITEMS,
  branchScale,
} from '@/lib/data/insights';
import { ALL_BRANCHES, matchesBranch } from '@/lib/roles';
import type { DashboardState } from '@/lib/store/reducer';
import type { Tone } from '@/lib/types';

export function selectOverview(state: DashboardState) {
  const scale = branchScale(state.branch);
  const factor = PERIOD_FACTORS[state.period] ?? 1;
  const s = scale * factor;
  const noData = scale === 0;
  const noCompare = 'لا مقارنة متاحة';

  const kpis: { label: string; value: string; delta: string; deltaTone: Tone }[] = [
    { label: 'الطلبات · ' + state.period, value: String(Math.round(184 * s)), delta: noData ? noCompare : '▲ 12% عن الأمس', deltaTone: noData ? 'muted' : 'ok' },
    { label: 'المبيعات · ' + state.period, value: sar(Math.round(7420 * s)), delta: noData ? noCompare : '▲ 8% عن الأمس', deltaTone: noData ? 'muted' : 'ok' },
    { label: 'متوسط قيمة الطلب', value: noData ? '—' : sar(40), delta: noData ? noCompare : '▬ مستقر', deltaTone: 'muted' },
    { label: 'متوسط زمن التحضير', value: noData ? '—' : '4:20 د', delta: noData ? noCompare : '▼ 25 ثانية', deltaTone: noData ? 'muted' : 'ok' },
    { label: 'بوكسات مجدولة', value: String(Math.round(12 * s)), delta: noData ? 'لا حجوزات' : 'خلال 72 ساعة', deltaTone: 'muted' },
  ];

  // Scale the chart with the period so multi-day totals stay inside it
  // (the original overflowed for "7 أيام" and "30 يومًا"; today/yesterday are unchanged).
  const chartMax = HOURLY_MAX * Math.max(1, factor);
  const hourly = HOURLY_ORDERS.map((v, i) => {
    const now = Math.round(v * s);
    const prev = Math.round(v * s * (0.72 + (i % 3) * 0.09));
    return {
      label: String((7 + i * 1.5) | 0),
      now: ((now / chartMax) * 100).toFixed(0) + '%',
      prev: ((prev / chartMax) * 100).toFixed(0) + '%',
    };
  });

  return {
    kpis,
    hourly,
    peakHour: noData ? 'لا بيانات' : 'ذروة 9:30 م',
    branchPerf: BRANCH_PERFORMANCE.filter((b) => matchesBranch(state.branch, b.city)).map((b) => ({
      city: b.city,
      name: b.name,
      sales: sar(b.sales),
      orders: String(b.orders),
      avg: sar(b.avg),
      prep: b.prep + ' د',
      pct: b.pct,
      tone: b.tone,
    })),
    newBranches: state.branchesAdded.filter((b) => matchesBranch(state.branch, b.city)),
    showLegend: state.branch === ALL_BRANCHES,
    noData,
    topItems: noData ? [] : TOP_ITEMS.map((t, i) => ({ rank: String(i + 1), name: t.name, qty: String(t.qty), sales: sar(t.sales) })),
    channels: noData ? [] : ORDER_CHANNELS,
    alerts: noData ? [] : OPERATIONAL_ALERTS,
  };
}
