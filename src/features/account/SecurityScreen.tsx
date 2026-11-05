'use client';

import { useActionState, useState, useTransition } from 'react';
import { useSessionControls } from '@/features/shell/SessionGuard';
import type { AccountView, ActivityView, FormState, SessionView } from '@/lib/auth/types';
import { countNoun, durationText } from '@/lib/format';
import { toneColor } from '@/lib/tones';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Checkbox } from '@/ui/Checkbox';
import { Notice } from '@/ui/Notice';
import { PasswordField } from '@/ui/PasswordField';
import { Toggle } from '@/ui/Toggle';
import { submitTo } from '@/ui/submitTo';
import { changePassword, endOtherSession, endOtherSessions, setTwoStep } from './actions';
import { AccountTabs } from './AccountTabs';
import styles from './account.module.css';

interface SecurityScreenProps {
  account: AccountView;
  sessions: SessionView[];
  activity: ActivityView[];
}

export function SecurityScreen({ account, sessions, activity }: SecurityScreenProps) {
  return (
    <div className={styles.screen}>
      <AccountTabs active="security" />
      <div className={styles.columns}>
        <div className={styles.column}>
          <PasswordCard account={account} />
          <TwoStepCard account={account} />
        </div>
        <div className={styles.column}>
          <SessionsCard sessions={sessions} />
          {account.idleMinutes !== null && <LockCard minutes={account.idleMinutes} />}
          <ActivityCard activity={activity} />
        </div>
      </div>
    </div>
  );
}

type PasswordFieldName = 'current' | 'password' | 'confirm';

function PasswordCard({ account }: { account: AccountView }) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [state, formAction, pending] = useActionState(async (prev: FormState<PasswordFieldName>, fd: FormData) => {
    const result = await changePassword(prev, fd);
    if (result.success) {
      setCurrent('');
      setPassword('');
      setConfirm('');
    }
    return result;
  }, {});
  const errors = state.errors ?? {};

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>كلمة المرور</h2>
        <span className={styles.meta}>{account.passwordChanged ? 'آخر تغيير ' + account.passwordChanged : 'لم تُغيَّر منذ إنشاء الحساب'}</span>
      </div>
      {state.success && <Notice tone="ok">{state.success}</Notice>}
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
        <PasswordField
          label="كلمة المرور الحالية"
          name="current"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          error={errors.current}
        />
        <PasswordField
          label="كلمة المرور الجديدة"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          meter
          error={errors.password}
        />
        <PasswordField
          label="تأكيد كلمة المرور الجديدة"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={errors.confirm}
        />
        <Checkbox name="signOutOthers" checked={signOutOthers} onChange={(e) => setSignOutOthers(e.target.checked)} label="تسجيل الخروج من الأجهزة الأخرى" />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" pad={20} disabled={pending} inactive={pending}>
            {pending ? 'جارٍ الحفظ…' : 'تغيير كلمة المرور'}
          </Button>
          <span className={styles.small}>تصلك رسالة تأكيد على رقمك بعد التغيير.</span>
        </div>
      </form>
    </Card>
  );
}

function TwoStepCard({ account }: { account: AccountView }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  // The latest outcome of turning it on or off.
  const [note, setNote] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [enabling, startEnable] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev: FormState<'password'>, fd: FormData) => {
    const result = await setTwoStep(false, prev, fd);
    setPassword('');
    if (result.success) {
      setConfirming(false);
      setNote({ tone: 'ok', text: result.success });
    } else if (result.error) {
      setNote({ tone: 'bad', text: result.error });
    }
    return result;
  }, {});

  function toggle() {
    setNote(null);
    if (account.twoStep) {
      setConfirming(true);
      return;
    }
    startEnable(async () => {
      const result = await setTwoStep(true, {}, new FormData());
      setNote(result.error ? { tone: 'bad', text: result.error } : { tone: 'ok', text: result.success ?? '' });
    });
  }

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>التحقق بخطوتين</h2>
        <span className={styles.chip} style={{ '--tone': toneColor(account.twoStep ? 'ok' : 'muted') }}>
          {account.twoStep ? 'مفعّل' : 'غير مفعّل'}
        </span>
      </div>
      <span className={styles.meta}>
        بعد كلمة المرور نطلب رمزًا يصل عبر واتساب إلى رقمك الموثّق، ويمكنك الوثوق بجهازك لمدة 30 يومًا. يحمي حسابك إن عرف أحد كلمة المرور.
      </span>
      {note && note.text && <Notice tone={note.tone}>{note.text}</Notice>}
      {account.twoStepRequired ? (
        <Notice>إلزامي لدور {account.roleName} ولا يمكن إيقافه.</Notice>
      ) : confirming ? (
        <form onSubmit={submitTo(formAction)} className={styles.inline} noValidate>
          <span className={styles.inlineTitle}>أدخل كلمة المرور لإيقاف التحقق بخطوتين</span>
          <PasswordField
            label="كلمة المرور"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onCard
            autoFocus
            error={state.errors?.password}
          />
          <div className={styles.actions}>
            <Button type="submit" variant="primary" pad={20} disabled={pending} inactive={pending}>
              {pending ? 'جارٍ الحفظ…' : 'إيقاف التحقق بخطوتين'}
            </Button>
            <Button onClick={() => setConfirming(false)}>إلغاء</Button>
          </div>
        </form>
      ) : (
        <div className={styles.actions}>
          <Toggle on={account.twoStep} onToggle={() => !enabling && toggle()} label={account.twoStep ? 'مفعّل' : 'متوقف'} name="التحقق بخطوتين" />
        </div>
      )}
    </Card>
  );
}

function DeviceIcon({ device }: { device: string }) {
  const phone = /iOS|iPadOS|Android/.test(device);
  return (
    <span className={styles.device} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {phone ? (
          <>
            <rect x="7" y="2.5" width="10" height="19" rx="2" />
            <path d="M11 18.5h2" />
          </>
        ) : (
          <>
            <rect x="3" y="4" width="18" height="12" rx="1.5" />
            <path d="M8 20h8M12 16v4" />
          </>
        )}
      </svg>
    </span>
  );
}

function SessionsCard({ sessions }: { sessions: SessionView[] }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const others = sessions.filter((s) => !s.current).length;

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>الأجهزة المتصلة</h2>
        <span className={styles.meta}>{countNoun(sessions.length, ['جهاز واحد', 'جهازان', 'أجهزة', 'جهازًا'])}</span>
      </div>
      {done && others === 0 && <Notice tone="ok">{done}</Notice>}
      <div className={styles.rows}>
        {sessions.map((s) => (
          <div key={s.id} className={styles.sessionRow}>
            <DeviceIcon device={s.device} />
            <div className={styles.sessionText}>
              <div className={styles.sessionHead}>
                <bdi>{s.device}</bdi>
                {s.current && (
                  <span className={styles.chip} style={{ '--tone': toneColor('ok') }}>
                    هذا الجهاز
                  </span>
                )}
                {s.remembered && <span className={styles.chip}>تذكّر 30 يومًا</span>}
                {s.locked && (
                  <span className={styles.chip} style={{ '--tone': toneColor('bad') }}>
                    مقفلة
                  </span>
                )}
              </div>
              <span className={styles.small}>
                بدأت {s.started} · آخر نشاط {s.lastSeen}
              </span>
            </div>
            {!s.current && (
              <button type="button" className={styles.end} disabled={pending} onClick={() => startTransition(() => endOtherSession(s.id))}>
                إنهاء الجلسة
              </button>
            )}
          </div>
        ))}
      </div>
      {others > 0 && (
        <div className={styles.actions}>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await endOtherSessions();
                setDone(result.success ?? null);
              })
            }
          >
            تسجيل الخروج من الأجهزة الأخرى
          </Button>
          <span className={styles.small}>يُطلب من تلك الأجهزة تسجيل الدخول من جديد.</span>
        </div>
      )}
    </Card>
  );
}

function LockCard({ minutes }: { minutes: number }) {
  const { lock } = useSessionControls();
  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>قفل الشاشة</h2>
      <span className={styles.meta}>
        تُقفل الشاشة تلقائيًا بعد {durationText(minutes * 60_000)} من عدم النشاط، وتبقى صفحتك كما هي حتى تُدخل كلمة المرور. اقفلها يدويًا قبل مغادرة جهاز مشترك.
      </span>
      <div>
        <Button onClick={lock}>قفل الشاشة الآن</Button>
      </div>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: ActivityView[] }) {
  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>نشاط الدخول</h2>
        <span className={styles.meta}>أحدث العمليات على حسابك</span>
      </div>
      <div className={styles.rows}>
        {activity.map((a) => (
          <div key={a.id} className={styles.activityRow} style={{ '--tone': toneColor(a.tone) }}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.activityText}>{a.text}</span>
            <bdi className={styles.small}>{a.device}</bdi>
            <span className={styles.small}>{a.when}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
