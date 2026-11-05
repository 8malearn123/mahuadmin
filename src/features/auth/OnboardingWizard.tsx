'use client';

import { Fragment, useEffect, useRef, useState, useTransition } from 'react';
import { PREF_OPTIONS } from '@/lib/auth/labels';
import type { NotificationPrefs } from '@/lib/auth/types';
import { durationText } from '@/lib/format';
import { Bar } from '@/ui/Bar';
import { Button } from '@/ui/Button';
import { Spacer } from '@/ui/Spacer';
import { SwitchList } from '@/ui/SwitchList';
import { completeOnboarding } from './actions';
import { AuthCard } from './AuthCard';
import styles from './auth.module.css';
import ob from './onboarding.module.css';

interface CustomerSetup {
  audience: 'customer';
  firstName: string;
  branch: string;
  branches: { name: string; title: string; meta: string }[];
  prefs: NotificationPrefs;
  /** Loyalty record already linked to the verified number (orders at the cashier). */
  loyalty: { points: number; tier: string; toNext: number; pct: string } | null;
  tiers: { name: string; rule: string }[];
}

interface StaffSetup {
  audience: 'staff';
  firstName: string;
  role: { name: string; scope: string; note: string; tone: string };
  screens: string[];
  twoStepRequired: boolean;
  twoStep: boolean;
  prefs: NotificationPrefs;
  landing: string;
  idleMinutes: number | null;
}

export type OnboardingSetup = CustomerSetup | StaffSetup;

const STEPS = {
  customer: ['الفرع المفضّل', 'الإشعارات', 'نقاط بونات'],
  staff: ['دورك وصلاحياتك', 'أمان الحساب', 'جاهز للبدء'],
};

/** First-run setup after the number is verified: three short steps, all skippable. */
export function OnboardingWizard({ setup }: { setup: OnboardingSetup }) {
  const steps = STEPS[setup.audience];
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState(setup.audience === 'customer' ? setup.branch : '');
  const [prefs, setPrefs] = useState(setup.prefs);
  const [twoStep, setTwoStep] = useState(setup.audience === 'staff' && (setup.twoStep || setup.twoStepRequired));
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const last = step === steps.length - 1;

  // Move focus to the new step's heading after "التالي" / "السابق" (not on first load).
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  function go(next: number) {
    moved.current = true;
    setStep(next);
  }

  function finish() {
    startTransition(async () => {
      await completeOnboarding({ branch: branch || undefined, prefs, twoStep });
    });
  }

  const prefItems = PREF_OPTIONS[setup.audience].map((o) => ({ key: o.key, title: o.title, desc: o.desc, on: prefs[o.key] }));
  const togglePref = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key as keyof NotificationPrefs] }));

  return (
    <AuthCard
      wide
      eyebrow={(setup.audience === 'staff' ? 'الانضمام إلى الفريق' : 'إنشاء حساب') + ' · الخطوة 3 من 3'}
      title={`أهلًا ${setup.firstName}، لنجهّز حسابك`}
      subtitle="خطوات قصيرة يمكنك تغييرها لاحقًا من صفحة «حسابي»."
    >
      <ol className={ob.steps} aria-label="خطوات الإعداد">
        {steps.map((label, i) => (
          <Fragment key={label}>
            {i > 0 && <li className={ob.stepLine} data-reached={i <= step ? '' : undefined} aria-hidden="true" />}
            <li className={ob.step} data-reached={i <= step ? '' : undefined} aria-current={i === step ? 'step' : undefined}>
              <span className={ob.stepNumber}>{i + 1}</span>
              {label}
            </li>
          </Fragment>
        ))}
      </ol>

      <section className={ob.panel} aria-labelledby="onboarding-step">
        {setup.audience === 'customer' ? (
          <CustomerStep step={step} setup={setup} branch={branch} onBranch={setBranch} prefItems={prefItems} onPref={togglePref} heading={heading} />
        ) : (
          <StaffStep step={step} setup={setup} twoStep={twoStep} onTwoStep={() => setTwoStep((v) => !v)} prefItems={prefItems} onPref={togglePref} heading={heading} />
        )}
      </section>

      <div className={ob.nav}>
        {last ? (
          <Button variant="primary" pad={22} onClick={finish} disabled={pending} inactive={pending}>
            {pending ? 'جارٍ الحفظ…' : setup.audience === 'customer' ? 'ابدأ الطلب' : 'الانتقال إلى ' + setup.landing}
          </Button>
        ) : (
          <Button variant="primary" pad={22} onClick={() => go(step + 1)}>
            التالي
          </Button>
        )}
        {step > 0 && <Button onClick={() => go(step - 1)}>السابق</Button>}
        <Spacer />
        {!last && (
          <button type="button" className={styles.textButton} onClick={finish} aria-disabled={pending || undefined}>
            تخطَّ الإعداد
          </button>
        )}
      </div>
    </AuthCard>
  );
}

type Heading = React.RefObject<HTMLHeadingElement | null>;
type PrefItems = { key: string; title: string; desc: string; on: boolean }[];

function StepTitle({ heading, children }: { heading: Heading; children: React.ReactNode }) {
  return (
    <h2 id="onboarding-step" ref={heading} tabIndex={-1} className={ob.panelTitle}>
      {children}
    </h2>
  );
}

function CustomerStep(props: {
  step: number;
  setup: CustomerSetup;
  branch: string;
  onBranch: (b: string) => void;
  prefItems: PrefItems;
  onPref: (key: string) => void;
  heading: Heading;
}) {
  const { step, setup, branch, onBranch, prefItems, onPref, heading } = props;
  if (step === 0) {
    return (
      <>
        <StepTitle heading={heading}>من أي فرع تطلب غالبًا؟</StepTitle>
        <p className={ob.panelLead}>نعرض توفّر الأصناف ومواعيد الاستلام من هذا الفرع أولًا، ويمكنك الطلب من أي فرع.</p>
        <div className={ob.options} role="radiogroup" aria-label="الفرع المفضّل">
          {setup.branches.map((b) => (
            <button key={b.name} type="button" role="radio" aria-checked={branch === b.name} className={ob.option} onClick={() => onBranch(b.name)}>
              <span className={ob.optionHead}>
                <span className={ob.radio} aria-hidden="true" />
                <span className={ob.optionTitle}>{b.title}</span>
              </span>
              <span className={ob.optionMeta}>{b.meta}</span>
            </button>
          ))}
        </div>
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <StepTitle heading={heading}>كيف نبلغك بحالة طلبك؟</StepTitle>
        <p className={ob.panelLead}>تصل الإشعارات عبر واتساب على رقمك الموثّق.</p>
        <SwitchList items={prefItems} onToggle={onPref} />
      </>
    );
  }
  return (
    <>
      <StepTitle heading={heading}>نقاطك مع بونات</StepTitle>
      <div className={ob.wallet}>
        <div className={ob.walletHead}>
          <span className={ob.walletLabel}>{setup.loyalty ? 'رصيدك الحالي' : 'رصيد البداية'}</span>
          <span className={ob.walletPoints}>{setup.loyalty?.points ?? 0}</span>
        </div>
        <Bar value={setup.loyalty?.pct ?? '0%'} color="var(--mango)" height={6} track="line" roundFill={false} />
        <span className={ob.walletNote}>
          {setup.loyalty
            ? `وجدنا نقاطك من طلباتك السابقة وربطناها برقمك — أنت في طبقة ${setup.loyalty.tier}، وتفصلك ${setup.loyalty.toNext} نقطة عن مشروب مجاني.`
            : 'تبدأ في طبقة ألوها، وتفصلك 500 نقطة عن أول مشروب مجاني.'}
        </span>
      </div>
      <div className={ob.tiers}>
        {setup.tiers.map((t) => (
          <div key={t.name} className={ob.tier}>
            <span className={ob.tierName}>{t.name}</span>
            <span className={ob.tierRule}>{t.rule}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function StaffStep(props: {
  step: number;
  setup: StaffSetup;
  twoStep: boolean;
  onTwoStep: () => void;
  prefItems: PrefItems;
  onPref: (key: string) => void;
  heading: Heading;
}) {
  const { step, setup, twoStep, onTwoStep, prefItems, onPref, heading } = props;
  if (step === 0) {
    return (
      <>
        <StepTitle heading={heading}>دورك وصلاحياتك</StepTitle>
        <div className={ob.roleCard} style={{ '--tone': setup.role.tone }}>
          <div className={ob.roleHead}>
            <span className={ob.roleDot} aria-hidden="true" />
            <span className={ob.roleName}>{setup.role.name}</span>
            <span className={ob.roleScope}>{setup.role.scope}</span>
          </div>
          <span className={ob.roleNote}>{setup.role.note}</span>
        </div>
        <p className={ob.panelLead}>الوحدات المتاحة لك:</p>
        <div className={ob.chips}>
          {setup.screens.map((s) => (
            <span key={s} className={ob.chip}>
              {s}
            </span>
          ))}
        </div>
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <StepTitle heading={heading}>أمّن حسابك</StepTitle>
        <SwitchList
          items={[
            {
              key: 'twoStep',
              title: 'التحقق بخطوتين',
              desc: 'نطلب رمزًا يصل عبر واتساب بعد كلمة المرور عند الدخول من جهاز جديد.',
              on: twoStep,
              locked: setup.twoStepRequired ? 'إلزامي لدورك' : undefined,
            },
          ]}
          onToggle={onTwoStep}
        />
        <p className={ob.panelLead}>التنبيهات:</p>
        <SwitchList items={prefItems} onToggle={onPref} />
      </>
    );
  }
  return (
    <>
      <StepTitle heading={heading}>كل شيء جاهز</StepTitle>
      <div className={ob.summary}>
        <div className={ob.summaryRow}>
          <span className={ob.summaryLabel}>الدور</span>
          <span>
            {setup.role.name} · {setup.role.scope}
          </span>
        </div>
        <div className={ob.summaryRow}>
          <span className={ob.summaryLabel}>التحقق بخطوتين</span>
          <span>{twoStep ? 'مفعّل — رمز عبر واتساب' : 'غير مفعّل'}</span>
        </div>
        {setup.idleMinutes && (
          <div className={ob.summaryRow}>
            <span className={ob.summaryLabel}>قفل الشاشة</span>
            <span>بعد {durationText(setup.idleMinutes * 60_000)} من عدم النشاط، وتفتحها بكلمة المرور</span>
          </div>
        )}
        <div className={ob.summaryRow}>
          <span className={ob.summaryLabel}>أول شاشة</span>
          <span>{setup.landing}</span>
        </div>
      </div>
    </>
  );
}
