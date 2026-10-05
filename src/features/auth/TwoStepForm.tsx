'use client';

import { useActionState, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CHANNEL_LABELS } from '@/lib/auth/labels';
import type { Channel, DemoMessage, FormState } from '@/lib/auth/types';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Notice } from '@/ui/Notice';
import { OtpInput } from '@/ui/OtpInput';
import { submitTo } from '@/ui/submitTo';
import { cancelTwoStep, resendTwoStepCode, verifyTwoStep } from './actions';
import { AuthCard, Destination } from './AuthCard';
import { CodeResend } from './CodeResend';
import { DemoInbox } from './DemoInbox';
import styles from './auth.module.css';

interface TwoStepFormProps {
  destination: string;
  channel: Channel;
  sentAt: number;
  wait: number;
  /** Demo build: the message that carried the code (undefined outside demo mode). */
  demo?: DemoMessage | null;
}

export function TwoStepForm({ destination, channel, sentAt, wait, demo }: TwoStepFormProps) {
  const form = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState('');
  const [trust, setTrust] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState<'code'>, fd: FormData) => {
    const result = await verifyTwoStep(prev, fd);
    setCode('');
    return result;
  }, {});

  function submitCode(value: string) {
    flushSync(() => setCode(value));
    form.current?.requestSubmit();
  }

  return (
    <>
      <AuthCard
        eyebrow="تسجيل الدخول · الخطوة 2 من 2"
        title="التحقق بخطوتين"
        subtitle={
          <>
            أرسلنا رمزًا من 6 أرقام عبر {CHANNEL_LABELS[channel]} إلى <Destination>{destination}</Destination>. أدخله لإكمال الدخول.
          </>
        }
        footer={
          <form action={cancelTwoStep}>
            <button type="submit" className={styles.textButton}>
              الدخول بحساب آخر
            </button>
          </form>
        }
      >
        {state.error && <Notice tone="bad">{state.error}</Notice>}
        <form ref={form} onSubmit={submitTo(formAction)} className={styles.form} noValidate>
          <OtpInput value={code} onChange={setCode} onComplete={() => form.current?.requestSubmit()} error={state.errors?.code} autoFocus />
          <CodeResend sentAt={sentAt} wait={wait} channel={channel} onResend={resendTwoStepCode} />
          <Checkbox name="trust" checked={trust} onChange={(e) => setTrust(e.target.checked)} label="الوثوق بهذا الجهاز وعدم طلب الرمز لمدة 30 يومًا" />
          <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
            {pending ? 'جارٍ التحقق…' : 'تأكيد الدخول'}
          </Button>
        </form>
      </AuthCard>
      {demo !== undefined && <DemoInbox message={demo} onFill={submitCode} />}
    </>
  );
}
