'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { FormState } from '@/lib/auth/types';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Notice } from '@/ui/Notice';
import { PasswordField } from '@/ui/PasswordField';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { signUp } from './actions';
import { AuthCard } from './AuthCard';
import styles from './auth.module.css';

type Field = 'name' | 'phone' | 'email' | 'password' | 'terms';

/** Customer self-registration; staff accounts come from invitations. */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, {} as FormState<Field>);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [offers, setOffers] = useState(false);
  const errors = state.errors ?? {};

  return (
    <AuthCard
      eyebrow="حساب عميل جديد"
      title="إنشاء حساب"
      subtitle="اطلب مسبقًا، واحجز البوكسات، واجمع نقاط بونات مع كل طلب."
      footer={
        <>
          لديك حساب؟{' '}
          <Link href="/sign-in" className={styles.link}>
            سجّل الدخول
          </Link>
        </>
      }
    >
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
        <TextField
          size="lg"
          label="الاسم الكامل"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="الاسم كما يظهر على الطلب"
          autoComplete="name"
          autoFocus
          error={errors.name}
        />
        <TextField
          size="lg"
          label="رقم الجوال"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05XXXXXXXX"
          autoComplete="tel-national"
          inputMode="tel"
          numeric
          ltr
          hint="سيصلك رمز تحقق عبر واتساب، ويُربط الرقم الموثّق بنقاط بونات."
          error={errors.phone}
        />
        <TextField
          size="lg"
          label="البريد الإلكتروني (اختياري)"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          ltr
          hint="لإيصالات الطلبات والفواتير الضريبية."
          error={errors.email}
        />
        <PasswordField
          size="lg"
          label="كلمة المرور"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          meter
          error={errors.password}
        />
        <Checkbox
          name="terms"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          label="أوافق على شروط الاستخدام وسياسة الخصوصية، وعلى معالجة بياناتي وفق نظام حماية البيانات الشخصية."
          error={errors.terms}
        />
        <Checkbox name="offers" checked={offers} onChange={(e) => setOffers(e.target.checked)} label="أرغب باستلام العروض والأصناف الجديدة عبر واتساب (اختياري)." />
        <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
          {pending ? 'جارٍ إنشاء الحساب…' : 'إنشاء الحساب'}
        </Button>
      </form>
    </AuthCard>
  );
}
