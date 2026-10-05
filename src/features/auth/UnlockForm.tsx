'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/lib/auth/types';
import { firstName } from '@/lib/format';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Notice } from '@/ui/Notice';
import { PasswordField } from '@/ui/PasswordField';
import { submitTo } from '@/ui/submitTo';
import { signOut, unlockSession } from './actions';
import { AuthCard } from './AuthCard';
import styles from './auth.module.css';

interface UnlockFormProps {
  name: string;
  /** page = /unlock (redirects afterwards); overlay = in place over the dashboard. */
  mode: 'page' | 'overlay';
  note: string;
  next?: string | null;
  onUnlocked?: () => void;
  /** Lets other tabs know before the session ends. */
  onSignOut?: () => void;
}

/** Lock screen: the session is kept, the password reopens it. */
export function UnlockForm({ name, mode, note, next, onUnlocked, onSignOut }: UnlockFormProps) {
  const [password, setPassword] = useState('');
  const [state, formAction, pending] = useActionState(async (prev: FormState<'password'>, fd: FormData) => {
    const result = await unlockSession(prev, fd);
    setPassword('');
    if (result.success === 'unlocked') onUnlocked?.();
    return result;
  }, {});

  return (
    <AuthCard
      eyebrow="الجلسة مقفلة"
      title={`مرحبًا مجددًا، ${firstName(name)}`}
      subtitle={note}
      footer={
        <form action={signOut} onSubmit={onSignOut}>
          <button type="submit" className={styles.textButton}>
            لست {firstName(name)}؟ تسجيل الخروج
          </button>
        </form>
      }
    >
      <div className={styles.lockWho}>
        <Avatar name={name} size={56} />
        <span className={styles.lockName}>{name}</span>
      </div>
      {state.error && <Notice tone="bad">{state.error}</Notice>}
      <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
        <input type="hidden" name="mode" value={mode} />
        {next && <input type="hidden" name="next" value={next} />}
        <PasswordField
          size="lg"
          label="كلمة المرور"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          error={state.errors?.password}
        />
        <Button type="submit" variant="primary" block disabled={pending} inactive={pending}>
          {pending ? 'جارٍ التحقق…' : 'فتح القفل'}
        </Button>
      </form>
    </AuthCard>
  );
}
