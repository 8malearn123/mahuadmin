'use client';

import { useActionState, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CHANNEL_LABELS } from '@/lib/auth/labels';
import type { Channel, DemoMessage, FormState } from '@/lib/auth/types';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { OtpInput } from '@/ui/OtpInput';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { changeUnverifiedPhone, resendPhoneCode, signOut, verifyPhone } from './actions';
import { AuthCard, Destination } from './AuthCard';
import { CodeResend } from './CodeResend';
import { DemoInbox } from './DemoInbox';
import styles from './auth.module.css';

interface VerifyPhoneFormProps {
  destination: string;
  channel: Channel;
  sentAt: number;
  wait: number;
  demo?: DemoMessage | null;
  /** Invited staff see the team wording. */
  staff: boolean;
}

export function VerifyPhoneForm({ destination, channel, sentAt, wait, demo, staff }: VerifyPhoneFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState('');
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [state, formAction, pending] = useActionState(async (prev: FormState<'code'>, fd: FormData) => {
    const result = await verifyPhone(prev, fd);
    setCode('');
    return result;
  }, {});
  const [changeState, changeAction, changing] = useActionState(async (prev: FormState<'phone'>, fd: FormData) => {
    const result = await changeUnverifiedPhone(prev, fd);
    if (result.success) {
      setEditing(false);
      setPhone('');
      setCode('');
    }
    return result;
  }, {});

  function submitCode(value: string) {
    flushSync(() => setCode(value));
    form.current?.requestSubmit();
  }

  return (
    <>
      <AuthCard
        eyebrow={(staff ? 'الانضمام إلى الفريق' : 'إنشاء حساب') + ' · الخطوة 2 من 3'}
        title="تحقق من رقم جوالك"
        subtitle={
          <>
            أرسلنا رمز التحقق عبر {CHANNEL_LABELS[channel]} إلى <Destination>{destination}</Destination>.{' '}
            {staff ? 'يُستخدم الرقم الموثّق لرموز الدخول وتنبيهات التشغيل.' : 'يربط الرقم الموثّق حسابك بنقاط بونات.'}
          </>
        }
        footer={
          <form action={signOut}>
            <button type="submit" className={styles.textButton}>
              تسجيل الخروج والعودة لاحقًا
            </button>
          </form>
        }
      >
        {state.error && <Notice tone="bad">{state.error}</Notice>}
        {changeState.success && !editing && <Notice tone="ok">{changeState.success}</Notice>}

        {editing ? (
          <form onSubmit={submitTo(changeAction)} className={styles.form} noValidate>
            <TextField
              size="lg"
              label="رقم الجوال الصحيح"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              inputMode="tel"
              autoComplete="tel-national"
              numeric
              ltr
              autoFocus
              error={changeState.errors?.phone ?? changeState.error}
            />
            <div className={styles.row}>
              <Button type="submit" variant="primary" pad={22} disabled={changing} inactive={changing}>
                {changing ? 'جارٍ الإرسال…' : 'إرسال الرمز إلى الرقم الجديد'}
              </Button>
              <Button onClick={() => setEditing(false)}>إلغاء</Button>
            </div>
          </form>
        ) : (
          <form ref={form} onSubmit={submitTo(formAction)} className={styles.form} noValidate>
            <OtpInput value={code} onChange={setCode} onComplete={() => form.current?.requestSubmit()} error={state.errors?.code} autoFocus />
            <CodeResend sentAt={sentAt} wait={wait} channel={channel} onResend={resendPhoneCode} />
            <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
              {pending ? 'جارٍ التحقق…' : 'تأكيد الرقم'}
            </Button>
            <div className={styles.muted}>
              الرقم غير صحيح؟{' '}
              {staff ? (
                'اطلب من مدير النظام تصحيحه وإعادة إرسال الدعوة.'
              ) : (
                <button type="button" className={styles.textButton} onClick={() => setEditing(true)}>
                  تعديل الرقم
                </button>
              )}
            </div>
          </form>
        )}
      </AuthCard>
      {demo !== undefined && <DemoInbox message={demo} onFill={editing ? undefined : submitCode} />}
    </>
  );
}
