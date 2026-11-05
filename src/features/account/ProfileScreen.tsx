'use client';

import { useActionState, useState, useTransition } from 'react';
import { PREF_OPTIONS } from '@/lib/auth/labels';
import type { AccountView, FormState, NotificationPrefs } from '@/lib/auth/types';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Notice } from '@/ui/Notice';
import { PasswordField } from '@/ui/PasswordField';
import { Segmented } from '@/ui/Segmented';
import { SwitchList } from '@/ui/SwitchList';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { deleteAccount, updateName, updatePreferences } from './actions';
import { AccountTabs } from './AccountTabs';
import { ContactCard, type PendingChange } from './ContactCard';
import styles from './account.module.css';

interface ProfileScreenProps {
  account: AccountView;
  pending: PendingChange | null;
  branches: string[];
}

export function ProfileScreen({ account, pending, branches }: ProfileScreenProps) {
  return (
    <div className={styles.screen}>
      <AccountTabs active="profile" />
      <div className={styles.columns}>
        <div className={styles.column}>
          <IdentityCard account={account} />
          <ContactCard account={account} pending={pending} />
        </div>
        <div className={styles.column}>
          <PreferencesCard account={account} branches={branches} />
          {account.isCustomer ? <DeleteCard /> : <ManagedCard account={account} />}
        </div>
      </div>
    </div>
  );
}

function IdentityCard({ account }: { account: AccountView }) {
  const [name, setName] = useState(account.name);
  const [state, formAction, pending] = useActionState(updateName, {} as FormState<'name'>);
  const changed = name.trim() !== account.name;

  return (
    <Card className={styles.card}>
      <div className={styles.identity}>
        <Avatar name={account.name} size={42} />
        <div className={styles.identityText}>
          <span className={styles.name}>{account.name}</span>
          <span className={styles.small}>
            {account.roleName} · {account.scope} · عضو منذ {account.memberSince}
          </span>
        </div>
      </div>
      <form onSubmit={submitTo(formAction)} className={styles.form} noValidate>
        <TextField label="الاسم الكامل" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={state.errors?.name} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" pad={20} inactive={!changed || pending} disabled={pending} onClick={(e) => !changed && e.preventDefault()}>
            {pending ? 'جارٍ الحفظ…' : 'حفظ الاسم'}
          </Button>
          {state.success && !changed && <span className={styles.saved}>{state.success} ✓</span>}
          {!state.success && <span className={styles.small}>{account.isCustomer ? 'يظهر على طلباتك وإيصالاتك.' : 'يظهر لزملائك وفي سجل التدقيق.'}</span>}
        </div>
      </form>
    </Card>
  );
}

function PreferencesCard({ account, branches }: { account: AccountView; branches: string[] }) {
  const [branch, setBranch] = useState(account.branch);
  const [prefs, setPrefs] = useState(account.prefs);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: { branch?: string; prefs?: NotificationPrefs }) {
    setSaved(null);
    startTransition(async () => {
      const result = await updatePreferences(next);
      setSaved(result.success ?? null);
    });
  }

  const items = PREF_OPTIONS[account.isCustomer ? 'customer' : 'staff'].map((o) => ({ key: o.key, title: o.title, desc: o.desc, on: prefs[o.key] }));

  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.title}>{account.isCustomer ? 'التفضيلات والإشعارات' : 'الإشعارات'}</h2>
        <span className={styles.meta} role="status">
          {pending ? 'جارٍ الحفظ…' : saved ? saved + ' ✓' : 'تُحفظ التغييرات تلقائيًا.'}
        </span>
      </div>
      {account.isCustomer && (
        <div className={styles.form}>
          <span className={styles.contactLabel}>الفرع المفضّل</span>
          <div>
            <Segmented
              label="الفرع المفضّل"
              options={branches}
              value={branch}
              onChange={(b) => {
                setBranch(b);
                save({ branch: b });
              }}
              surface="inset"
              size="md"
              wide
            />
          </div>
        </div>
      )}
      <SwitchList
        items={items}
        onToggle={(key) => {
          const next = { ...prefs, [key]: !prefs[key as keyof NotificationPrefs] };
          setPrefs(next);
          save({ prefs: next });
        }}
      />
    </Card>
  );
}

function ManagedCard({ account }: { account: AccountView }) {
  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>الدور والفرع</h2>
      <span className={styles.meta}>
        حسابك بدور {account.roleName} ({account.scope}). يحدد مدير النظام الدور والفرع ويستطيع إيقاف الحساب أو إنهاء جلساته — تواصل معه لأي تغيير.
      </span>
    </Card>
  );
}

function DeleteCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, formAction, pending] = useActionState(deleteAccount, {} as FormState<'password' | 'confirm'>);

  return (
    <Card className={`${styles.card} ${styles.danger}`}>
      <h2 className={styles.title}>حذف الحساب</h2>
      <span className={styles.meta}>
        يحذف بياناتك ونقاط بونات وسجل طلباتك نهائيًا وفق نظام حماية البيانات الشخصية، ولا يمكن التراجع. تبقى الفواتير الضريبية محفوظة للمدة النظامية.
      </span>
      {open ? (
        <form onSubmit={submitTo(formAction)} className={styles.inline} noValidate>
          {state.error && <Notice tone="bad">{state.error}</Notice>}
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
          <TextField label="اكتب «حذف» للتأكيد" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} onCard error={state.errors?.confirm} />
          <div className={styles.actions}>
            <button type="submit" className={styles.dangerButton} disabled={pending}>
              {pending ? 'جارٍ الحذف…' : 'حذف حسابي نهائيًا'}
            </button>
            <Button onClick={() => setOpen(false)}>إلغاء</Button>
          </div>
        </form>
      ) : (
        <div>
          <button type="button" className={styles.dangerButton} onClick={() => setOpen(true)}>
            حذف حسابي
          </button>
        </div>
      )}
    </Card>
  );
}
