import { sar } from '@/lib/format';
import { PERIOD_FACTORS, branchScale } from '@/lib/data/insights';
import { KANBAN_STAGES, KANBAN_STAGE_TONES } from '@/lib/data/orders';
import { matchesBranch } from '@/lib/roles';
import type { DashboardState } from '@/lib/store/reducer';
import type { Tone } from '@/lib/types';

export function selectOrders(state: DashboardState) {
  const visible = state.orders.filter((o) => matchesBranch(state.branch, o.branch));
  // Note: like the original, "done today" follows the period even though no period tabs show here.
  const s = branchScale(state.branch) * (PERIOD_FACTORS[state.period] ?? 1);

  const stats: { label: string; value: string; tone: Tone }[] = [
    { label: 'في الطابور الآن', value: String(visible.filter((o) => o.stage < 3).length), tone: 'ok' },
    { label: 'أُنجزت اليوم', value: String(Math.round(171 * s)), tone: 'ok' },
    { label: 'متوسط الانتظار', value: '4:20 د', tone: 'ink' },
    { label: 'طلبات متأخرة', value: '1', tone: 'bad' },
  ];

  const columns = KANBAN_STAGES.map((name, stage) => {
    const orders = visible.filter((o) => o.stage === stage);
    return {
      stage,
      name,
      tone: KANBAN_STAGE_TONES[stage],
      count: String(orders.length),
      /** Label of the "move to next stage" button; null in the last column. */
      nextLabel: stage < KANBAN_STAGES.length - 1 ? 'نقل إلى: ' + KANBAN_STAGES[stage + 1] : null,
      orders: orders.map((o) => ({ ...o, total: sar(o.total) })),
    };
  });

  return { stats, columns };
}
