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
import { acceptInvite } from './actions';
import { AuthCard, Destination } from './AuthCard';
import styles from './auth.module.css';
import onboarding from './onboarding.module.css';

type Field = 'name' | 'password' | 'confirm' | 'terms';

interface InviteFormProps {
  token: string;
  name: string;
  phone: string;
  inviter: string;
  roleName: string;
  roleTone: string;
  scope: string;
  note: string;
  expires: string;
  /** Someone else is signed in on this browser; accepting signs them out. */
  signedInAs: string | null;
}

export function InviteForm({ token, name: invitedName, phone, inviter, roleName, roleTone, scope, note, expires, signedInAs }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(acceptInvite.bind(null, token), {} as FormState<Field>);
  const [name, setName] = useState(invitedName);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const errors = state.errors ?? {};

  return (
    <AuthCard
      eyebrow="دعوة انضمام · الخطوة 1 من 3"
      title="انضم إلى فريق ماهو"
      subtitle={`وصلتك دعوة من ${inviter} لإنشاء حسابك في منصة ماهو. تنتهي الدعوة خلال ${expires}.`}
    >
      <div className={onboarding.roleCard} style={{ '--tone': roleTone }}>
        <div className={onboarding.roleHead}>
          <span className={onboarding.roleDot} aria-hidden="true" />
          <span className={onboarding.roleName}>{roleName}</span>
          <span className={onboarding.roleScope}>{scope}</span>
        </div>
        <span className={onboarding.roleNote}>{note}</span>
      </div>
      {signedInAs && <Notice tone="warn">أنت مسجّل الدخول حاليًا باسم {signedInAs}. قبول الدعوة يسجّل خروجك من ذلك الحساب على هذا الجهاز.</Notice>}
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
        <TextField size="lg" label="الاسم الكامل" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} />
        <div className={styles.muted}>
          رقم الجوال: <Destination>{phone}</Destination> — حدّده مدير النظام، وسيصله رمز التحقق في الخطوة التالية.
        </div>
        <PasswordField
          size="lg"
          label="كلمة المرور"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          meter
          autoFocus
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
        <Checkbox
          name="terms"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          label="أوافق على سياسة الاستخدام وحماية البيانات، وألتزم بسرية بيانات العملاء التي أطّلع عليها."
          error={errors.terms}
        />
        <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
          {pending ? 'جارٍ إنشاء الحساب…' : 'قبول الدعوة وإنشاء الحساب'}
        </Button>
      </form>
    </AuthCard>
  );
}

export function InviteInvalid() {
  return (
    <AuthCard
      eyebrow="دعوة انضمام"
      title="الدعوة غير صالحة"
      subtitle="انتهت صلاحية رابط الدعوة، أو أُلغي، أو استُخدم من قبل. اطلب من مدير النظام إرسال دعوة جديدة."
      footer={
        <>
          لديك حساب بالفعل؟{' '}
          <Link href="/sign-in" className={styles.link}>
            تسجيل الدخول
          </Link>
        </>
      }
    >
      <span className={styles.muted}>روابط الدعوة صالحة لمدة 72 ساعة ولمرة واحدة.</span>
    </AuthCard>
  );
}
