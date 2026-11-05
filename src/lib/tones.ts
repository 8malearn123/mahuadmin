import type { Tone } from './types';

const TONE_COLORS: Record<Tone, string> = {
  ok: 'var(--ok)',
  bad: 'var(--bad)',
  muted: 'var(--ink-700)',
  ink: 'var(--ink-900)',
  brand: 'var(--brand-ember)',
  refund: 'var(--refund)',
};

/** CSS colour for a tone, for use in inline styles (`style={{ '--tone': toneColor(t) }}`). */
export function toneColor(tone: Tone): string {
  return TONE_COLORS[tone];
}

/**
 * Categorical colour of each branch's series (overview bars and legend, branch cards): black, then the
 * gradient's deep orange, which still reads on the cream bar track. Branches without data yet use the idle colour.
 */
const BRANCH_COLORS: Record<string, string> = {
  'جازان': 'var(--ink-900)',
  'أبو عريش': 'var(--brand-ember)',
};

/** Swatch of a branch that is still being set up and has no data yet. */
export const NEW_BRANCH_COLOR = 'var(--line-strong)';

export function branchColor(city: string): string {
  return BRANCH_COLORS[city] ?? NEW_BRANCH_COLOR;
}
