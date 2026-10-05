'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { FormState } from '@/lib/auth/types';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { requestPasswordReset } from './actions';
import { AuthCard } from './AuthCard';
import styles from './auth.module.css';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {} as FormState<'identifier'>);
  const [identifier, setIdentifier] = useState('');

  return (
    <AuthCard
      eyebrow="استعادة الحساب · الخطوة 1 من 2"
      title="نسيت كلمة المرور؟"
      subtitle="أدخل رقم جوالك أو بريدك المسجّل، وسنرسل لك رمزًا لتعيين كلمة مرور جديدة."
      footer={
        <>
          تذكّرت كلمة المرور؟{' '}
          <Link href="/sign-in" className={styles.link}>
            تسجيل الدخول
          </Link>
        </>
      }
    >
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
        <TextField
          size="lg"
          label="رقم الجوال أو البريد الإلكتروني"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="05XXXXXXXX أو name@mahu.sa"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          ltr
          autoFocus
          hint="يصل الرمز عبر واتساب للأرقام، وبالبريد للعناوين الموثّقة."
          error={state.errors?.identifier}
        />
        <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
          {pending ? 'جارٍ الإرسال…' : 'إرسال رمز الاستعادة'}
        </Button>
      </form>
    </AuthCard>
  );
}
