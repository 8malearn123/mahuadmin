'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { CHANNEL_LABELS } from '@/lib/auth/labels';
import type { Channel, DemoMessage, FormState } from '@/lib/auth/types';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { OtpInput } from '@/ui/OtpInput';
import { PasswordField } from '@/ui/PasswordField';
import { submitTo } from '@/ui/submitTo';
import { resendResetCode, resetPassword } from './actions';
import { AuthCard, Destination } from './AuthCard';
import { CodeResend } from './CodeResend';
import { DemoInbox } from './DemoInbox';
import styles from './auth.module.css';

type Field = 'code' | 'password' | 'confirm';

interface ResetPasswordFormProps {
  destination: string;
  channel: Channel;
  sentAt: number;
  wait: number;
  demo?: DemoMessage | null;
}

export function ResetPasswordForm({ destination, channel, sentAt, wait, demo }: ResetPasswordFormProps) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, formAction, pending] = useActionState(async (prev: FormState<Field>, fd: FormData) => {
    const result = await resetPassword(prev, fd);
    if (result.errors?.code) setCode('');
    return result;
  }, {});
  const errors = state.errors ?? {};

  return (
    <>
      <AuthCard
        eyebrow="استعادة الحساب · الخطوة 2 من 2"
        title="تعيين كلمة مرور جديدة"
        subtitle={
          <>
            إن كان <Destination>{destination}</Destination> مسجّلًا لدينا فقد أرسلنا إليه رمزًا من 6 أرقام عبر {CHANNEL_LABELS[channel]}. أدخله ثم اختر كلمة المرور الجديدة.
          </>
        }
        footer={
          <Link href="/forgot-password" className={styles.link}>
            استخدام رقم أو بريد آخر
          </Link>
        }
      >
        {state.error && <Notice tone="bad">{state.error}</Notice>}
        <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
          <OtpInput value={code} onChange={setCode} error={errors.code} autoFocus />
          <CodeResend sentAt={sentAt} wait={wait} channel={channel} onResend={resendResetCode} />
          <PasswordField
            size="lg"
            label="كلمة المرور الجديدة"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            meter
            error={errors.password}
          />
          <PasswordField
            size="lg"
            label="تأكيد كلمة المرور"
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            error={errors.confirm}
          />
          <Notice>بعد الحفظ يُسجَّل خروجك من جميع الأجهزة، وتصلك رسالة تأكيد على رقمك.</Notice>
          <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
            {pending ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور'}
          </Button>
        </form>
      </AuthCard>
      {demo !== undefined && (
        <DemoInbox message={demo} onFill={setCode} empty="لم تُرسل أي رسالة: لا يوجد حساب نشط بهذا الرقم أو البريد، أو أنه غير موثّق. تبدو الصفحة متطابقة في الحالتين حتى لا يُكشف وجود الحساب." />
      )}
    </>
  );
}

/** When the reset ticket is missing or used up. */
export function ResetExpired() {
  return (
    <AuthCard
      eyebrow="استعادة الحساب"
      title="انتهت صلاحية الطلب"
      subtitle="طلب استعادة كلمة المرور صالح لمدة 15 دقيقة ويُستخدم مرة واحدة. ابدأ من جديد لتصلك رسالة برمز جديد."
    >
      <Link href="/forgot-password" className={styles.link}>
        طلب رمز جديد ←
      </Link>
    </AuthCard>
  );
}
