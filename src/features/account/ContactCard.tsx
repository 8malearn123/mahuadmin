'use client';

import { useActionState, useState, useTransition } from 'react';
import { CodeResend } from '@/features/auth/CodeResend';
import { DemoInbox } from '@/features/auth/DemoInbox';
import { CHANNEL_LABELS } from '@/lib/auth/labels';
import type { AccountView, Channel, DemoMessage, FormState } from '@/lib/auth/types';
import { phoneIntl } from '@/lib/format';
import { toneColor } from '@/lib/tones';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Notice } from '@/ui/Notice';
import { OtpInput } from '@/ui/OtpInput';
import { PasswordField } from '@/ui/PasswordField';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { cancelContactChange, confirmContactChange, resendContactCode, startContactChange } from './actions';
import styles from './account.module.css';

type Kind = 'phone' | 'email';

/** A phone or email change waiting for its code (survives a reload). */
export interface PendingChange {
  kind: Kind;
  destination: string;
  channel: Channel;
  sentAt: number;
  wait: number;
  demo?: DemoMessage | null;
}

function Verified({ ok }: { ok: boolean }) {
  return (
    <span className={styles.chip} style={{ '--tone': toneColor(ok ? 'ok' : 'bad') }}>
      {ok ? 'موثّق' : 'غير موثّق'}
    </span>
  );
}

/** Mobile number and email, with re-verification whenever either changes. */
export function ContactCard({ account, pending }: { account: AccountView; pending: PendingChange | null }) {
  // Which change form is open: a new number or email, or confirming the current email.
  const [open, setOpen] = useState<Kind | 'confirmEmail' | null>(null);
  const [done, setDone] = useState<string | null>(null);

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>بيانات التواصل</h2>
        <span className={styles.meta}>تغيير أي منهما يتطلب رمزًا يصل إلى الجديد.</span>
      </div>
      {done && !pending && !open && <Notice tone="ok">{done}</Notice>}
      <div className={styles.rows}>
        <div className={styles.contactRow}>
          <div className={styles.contactText}>
            <span className={styles.contactLabel}>رقم الجوال · لرموز التحقق وإشعارات الطلب</span>
            <span className={styles.contactValue}>
              <bdi className={styles.ltr}>{phoneIntl(account.phone)}</bdi>
            </span>
          </div>
          <Verified ok={account.phoneVerified} />
          {!pending && open !== 'phone' && (
            <button type="button" className={styles.linkButton} onClick={() => setOpen('phone')}>
              تغيير الرقم
            </button>
          )}
        </div>
        <div className={styles.contactRow}>
          <div className={styles.contactText}>
            <span className={styles.contactLabel}>البريد الإلكتروني · للإيصالات والملخصات</span>
            <span className={styles.contactValue}>
              {account.email ? <bdi className={styles.ltr}>{account.email}</bdi> : <span className={styles.empty}>لم يُضف بعد</span>}
            </span>
          </div>
          {account.email && <Verified ok={account.emailVerified} />}
          {!pending && !open && account.email && !account.emailVerified && (
            <button type="button" className={styles.linkButton} onClick={() => setOpen('confirmEmail')}>
              توثيق البريد
            </button>
          )}
          {!pending && open !== 'email' && (
            <button type="button" className={styles.linkButton} onClick={() => setOpen('email')}>
              {account.email ? 'تغيير' : 'إضافة بريد'}
            </button>
          )}
        </div>
      </div>

      {pending ? (
        <ConfirmChange pending={pending} onDone={setDone} />
      ) : (
        open && <StartChange kind={open === 'phone' ? 'phone' : 'email'} confirmCurrent={open === 'confirmEmail'} email={account.email} onClose={() => setOpen(null)} />
      )}
    </Card>
  );
}

function StartChange({ kind, confirmCurrent, email, onClose }: { kind: Kind; confirmCurrent: boolean; email: string | null; onClose: () => void }) {
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [state, formAction, pending] = useActionState(async (prev: FormState<'value' | 'password'>, fd: FormData) => {
    const result = await startContactChange(kind, prev, fd);
    if (result.success) onClose();
    return result;
  }, {});
  const errors = state.errors ?? {};

  return (
    <form onSubmit={submitTo(formAction)} className={styles.inline} noValidate>
      <span className={styles.inlineTitle}>
        {confirmCurrent ? 'توثيق البريد الإلكتروني' : kind === 'phone' ? 'تغيير رقم الجوال' : email ? 'تغيير البريد الإلكتروني' : 'إضافة بريد إلكتروني'}
      </span>
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      {confirmCurrent ? (
        <>
          <input type="hidden" name="confirmCurrent" value="on" />
          <span className={styles.meta}>
            سنرسل رمزًا إلى <bdi className={styles.ltr}>{email}</bdi> لتأكيد أنه بريدك.
          </span>
        </>
      ) : (
        <>
          <TextField
            label={kind === 'phone' ? 'الرقم الجديد' : 'البريد الإلكتروني'}
            name="value"
            type={kind === 'phone' ? 'tel' : 'email'}
            inputMode={kind === 'phone' ? 'tel' : 'email'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === 'phone' ? '05XXXXXXXX' : 'name@example.com'}
            numeric={kind === 'phone'}
            ltr
            onCard
            autoFocus
            error={errors.value}
          />
          <PasswordField
            label="كلمة المرور الحالية"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onCard
            hint="نطلبها لحماية حسابك من التغيير دون علمك."
            error={errors.password}
          />
        </>
      )}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" pad={20} disabled={pending} inactive={pending}>
          {pending ? 'جارٍ الإرسال…' : 'إرسال رمز التأكيد'}
        </Button>
        <Button onClick={onClose}>إلغاء</Button>
      </div>
    </form>
  );
}

function ConfirmChange({ pending: change, onDone }: { pending: PendingChange; onDone: (message: string) => void }) {
  const [code, setCode] = useState('');
  const [cancelling, startCancel] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev: FormState<'code'>, fd: FormData) => {
    const result = await confirmContactChange(change.kind, prev, fd);
    setCode('');
    if (result.success) onDone(result.success);
    return result;
  }, {});

  return (
    <>
      <form onSubmit={submitTo(formAction)} className={styles.inline} noValidate>
        <span className={styles.inlineTitle}>
          أدخل الرمز المرسل عبر {CHANNEL_LABELS[change.channel]} إلى <bdi className={styles.ltr}>{change.destination}</bdi>
        </span>
        {state.error && <Notice tone="bad">{state.error}</Notice>}
        <OtpInput value={code} onChange={setCode} error={state.errors?.code} autoFocus />
        <CodeResend sentAt={change.sentAt} wait={change.wait} channel={change.channel} onResend={(ch) => resendContactCode(change.kind, ch)} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" pad={20} disabled={pending} inactive={pending}>
            {pending ? 'جارٍ التحقق…' : 'تأكيد'}
          </Button>
          <Button onClick={() => startCancel(() => cancelContactChange(change.kind))} disabled={cancelling}>
            إلغاء التغيير
          </Button>
        </div>
      </form>
      {change.demo !== undefined && <DemoInbox message={change.demo} onFill={setCode} wide />}
    </>
  );
}
