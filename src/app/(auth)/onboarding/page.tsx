import type { Metadata } from 'next';
import { OnboardingWizard, type OnboardingSetup } from '@/features/auth/OnboardingWizard';
import { requireStage } from '@/lib/auth/dal';
import { LOYALTY_TIERS } from '@/lib/data/insights';
import { BRANCH_INFO } from '@/lib/data/org';
import { CUSTOMERS } from '@/lib/data/people';
import { firstName } from '@/lib/format';
import { OPERATING_BRANCHES, ROLES, scopeRole } from '@/lib/roles';
import { toneColor } from '@/lib/tones';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: 'إعداد الحساب' };

export default async function OnboardingPage() {
  const { user } = await requireStage('onboarding');
  const role = scopeRole(ROLES[user.role], user.branch);
  let setup: OnboardingSetup;

  if (user.role === 'customer') {
    // Customers who ordered at the cashier with this number already have points.
    const member = CUSTOMERS.find((c) => c.phone === user.phone);
    setup = {
      audience: 'customer',
      firstName: firstName(user.name),
      branch: user.branch,
      branches: OPERATING_BRANCHES.map((b) => ({ name: b, ...BRANCH_INFO[b] })),
      prefs: user.prefs,
      loyalty: member
        ? {
            points: member.points,
            tier: member.tier,
            toNext: Math.max(0, 500 - member.points),
            pct: Math.min(100, Math.round((member.points / 500) * 100)) + '%',
          }
        : null,
      tiers: LOYALTY_TIERS.map((t) => ({ name: t.name, rule: t.rule })),
    };
  } else {
    setup = {
      audience: 'staff',
      firstName: firstName(user.name),
      role: { name: role.name, scope: role.scope, note: role.note, tone: toneColor(role.tone) },
      screens: role.views.map((v) => VIEWS[v].label),
      twoStepRequired: role.twoStep === 'required',
      twoStep: user.twoStep,
      prefs: user.prefs,
      landing: VIEWS[role.views[0]].label,
      idleMinutes: role.idleMinutes,
    };
  }

  return <OnboardingWizard setup={setup} />;
}
