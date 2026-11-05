'use client';

import Link from 'next/link';
import { startTransition, useActionState, useState } from 'react';
import type { FormState } from '@/lib/auth/types';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Notice } from '@/ui/Notice';
import { PasswordField } from '@/ui/PasswordField';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { signIn } from './actions';
import { AuthCard } from './AuthCard';
import styles from './auth.module.css';

export interface DemoAccount {
  id: string;
  name: string;
  roleName: string;
  /** Role tone colour for the dot. */
  tone: string;
  identifier: string;
  password: string;
  twoStep: boolean;
}

interface SignInFormProps {
  next: string | null;
  /** Why the previous session ended, if the user was sent here. */
  notice: { tone: 'ok' | 'warn' | 'bad'; text: string } | null;
  /** Demo build: one account per role, signed in with one click. */
  demoAccounts: DemoAccount[] | null;
}

export function SignInForm({ next, notice, demoAccounts }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signIn, {} as FormState<'identifier' | 'password'>);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const errors = state.errors ?? {};

  function signInAs(account: DemoAccount) {
    setIdentifier(account.identifier);
    setPassword(account.password);
    const fd = new FormData();
    fd.set('identifier', account.identifier);
    fd.set('password', account.password);
    if (next) fd.set('next', next);
    startTransition(() => formAction(fd));
  }

  return (
    <>
      <AuthCard
        eyebrow="منصة ماهو · لوحات التشغيل"
        title="تسجيل الدخول"
        subtitle="ادخل برقم جوالك أو بريدك الإلكتروني وكلمة المرور."
        footer={
          <>
            ليس لديك حساب؟{' '}
            <Link href="/sign-up" className={styles.link}>
              أنشئ حساب عميل
            </Link>
            <br />
            <span className={styles.muted}>حسابات الفريق تُنشأ بدعوة من مدير النظام.</span>
          </>
        }
      >
        {state.error ? <Notice tone="bad">{state.error}</Notice> : notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
          {next && <input type="hidden" name="next" value={next} />}
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
            error={errors.identifier}
          />
          <PasswordField
            size="lg"
            label="كلمة المرور"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={errors.password}
            labelEnd={
              <Link href="/forgot-password" className={styles.smallLink}>
                نسيت كلمة المرور؟
              </Link>
            }
          />
          <Checkbox name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} label="تذكرني على هذا الجهاز لمدة 30 يومًا" />
          <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
            {pending ? 'جارٍ التحقق…' : 'دخول'}
          </Button>
        </form>
      </AuthCard>

      {demoAccounts && (
        <aside className={styles.demo} aria-label="حسابات تجريبية">
          <div className={styles.demoHead}>
            <span className={styles.demoDot} style={{ background: 'var(--mango)' }} aria-hidden="true" />
            حسابات تجريبية
            <span className={styles.demoMeta}>
              كلمة المرور للجميع: <bdi className={styles.phone}>{demoAccounts[0]?.password}</bdi>
            </span>
          </div>
          <div className={styles.demoAccounts}>
            {demoAccounts.map((a) => (
              <button key={a.id} type="button" className={styles.demoAccount} onClick={() => signInAs(a)} disabled={pending}>
                <span className={styles.demoRole}>
                  <span className={styles.demoDot} style={{ background: a.tone }} aria-hidden="true" />
                  {a.roleName}
                </span>
                <span className={styles.demoUser}>
                  {a.name}
                  {a.twoStep && ' · تحقق بخطوتين'}
                </span>
                <span className={styles.demoGo}>دخول ←</span>
              </button>
            ))}
          </div>
          <span className={styles.demoNote}>
            يحل هذا محل مبدّل الأدوار في النسخة التجريبية: ادخل بأي دور لترى ما يخصّه. يمكن لمدير النظام أيضًا معاينة الأدوار الأخرى من الشريط الجانبي.
          </span>
        </aside>
      )}
    </>
  );
}
