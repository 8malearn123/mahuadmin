import type { Tone } from './types';

const TONE_COLORS: Record<Tone, string> = {
  ok: 'var(--teal-700)',
  bad: 'var(--bad)',
  muted: 'var(--ink-700)',
  ink: 'var(--ink-900)',
  brand: 'var(--teal-600)',
  refund: 'var(--refund)',
};

/** CSS colour for a tone, for use in inline styles (`style={{ '--tone': toneColor(t) }}`). */
export function toneColor(tone: Tone): string {
  return TONE_COLORS[tone];
}
