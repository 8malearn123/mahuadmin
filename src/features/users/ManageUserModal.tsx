'use client';

import { useActionState, useState, useTransition } from 'react';
import { USER_STATUS } from '@/lib/auth/labels';
import { countNoun, phoneIntl } from '@/lib/format';
import type { FormState, UserRow } from '@/lib/auth/types';
import { ALL_BRANCHES, OPERATING_BRANCHES, ROLES, STAFF_ROLE_IDS, isMultiBranch } from '@/lib/roles';
import { toneColor } from '@/lib/tones';
import type { RoleId } from '@/lib/types';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Field, Select } from '@/ui/Field';
import { Modal, ModalActions } from '@/ui/Modal';
import { Notice } from '@/ui/Notice';
import { submitTo } from '@/ui/submitTo';
import { endSessionsOf, setSuspended, updateAccess } from './actions';
import styles from './users.module.css';

/** Role, branch, suspension and sessions of one account. */
export function ManageUserModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [role, setRole] = useState<RoleId>(user.role);
  const [branch, setBranch] = useState(user.branch === ALL_BRANCHES ? OPERATING_BRANCHES[0] : user.branch);
  const [result, setResult] = useState<FormState | null>(null);
  const [busy, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev: FormState<'role' | 'branch'>, fd: FormData) => {
    const next = await updateAccess(user.id, prev, fd);
    setResult(next);
    return next;
  }, {});
  const multi = isMultiBranch(ROLES[role]);
  const staff = user.role !== 'customer';
  // Your own current session isn't ended from here (that's "تسجيل الخروج").
  const endable = user.isSelf ? Math.max(0, user.activeSessions - 1) : user.activeSessions;
  const status = USER_STATUS[user.status];

  function run(action: () => Promise<FormState>) {
    startTransition(async () => setResult(await action()));
  }

  return (
    <Modal eyebrow="وحدة 13 · إدارة المستخدمين" title={'إدارة حساب — ' + user.name} width={640} onClose={onClose} dotColor={toneColor(ROLES[user.role].tone)}>
      <div className={styles.summary}>
        <Avatar name={user.name} size={42} />
        <div className={styles.summaryText}>
          <span className={styles.name}>{user.name}</span>
          <span className={styles.small}>
            <bdi className={styles.ltr}>{phoneIntl(user.phone)}</bdi>
            {user.email && (
              <>
                {' · '}
                <bdi className={styles.ltr}>{user.email}</bdi>
              </>
            )}
          </span>
          <span className={styles.small}>
            <span style={{ color: toneColor(status.tone) }}>{status.label}</span> · آخر دخول: {user.lastSignIn} ·{' '}
            {user.activeSessions ? countNoun(user.activeSessions, ['جهاز متصل', 'جهازان متصلان', 'أجهزة متصلة', 'جهازًا متصلًا']) : 'لا أجهزة متصلة'}
          </span>
        </div>
      </div>

      {result?.success && <Notice tone="ok">{result.success}</Notice>}
      {result?.error && <Notice tone="bad">{result.error}</Notice>}

      {user.isSelf ? (
        <Notice>هذا حسابك. لا يمكنك تغيير دورك أو إيقاف حسابك بنفسك؛ لبياناتك وأمانك افتح «حسابي».</Notice>
      ) : staff ? (
        <form onSubmit={submitTo(formAction)} className={styles.section} noValidate>
          <span className={styles.sectionTitle}>الدور والفرع</span>
          <div className={styles.formGrid}>
            <Field label="الدور">
              <Select name="role" value={role} onChange={(e) => setRole(e.target.value as RoleId)}>
                {STAFF_ROLE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ROLES[id].name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الفرع">
              <Select name="branch" value={multi ? ALL_BRANCHES : branch} onChange={(e) => setBranch(e.target.value)} disabled={multi}>
                {multi ? (
                  <option value={ALL_BRANCHES}>كل الفروع</option>
                ) : (
                  OPERATING_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))
                )}
              </Select>
            </Field>
          </div>
          {state.errors?.branch && <span className={styles.hint} style={{ color: 'var(--bad)' }}>{state.errors.branch}</span>}
          <span className={styles.hint}>{ROLES[role].note} يُطبّق التغيير على جلساته المفتوحة فورًا.</span>
          <div>
            <Button type="submit" variant="primary" pad={20} disabled={pending} inactive={pending}>
              {pending ? 'جارٍ الحفظ…' : 'حفظ الصلاحية'}
            </Button>
          </div>
        </form>
      ) : (
        <Notice>حساب عميل أنشأه بنفسه من الموقع. يمكنك إيقافه أو إنهاء جلساته، ولا يُسند له دور في الفريق.</Notice>
      )}

      <div className={styles.section}>
        <span className={styles.sectionTitle}>الحساب والجلسات</span>
        <ModalActions>
          {!user.isSelf &&
            (user.status === 'suspended' ? (
              <Button variant="primary" pad={20} disabled={busy} onClick={() => run(() => setSuspended(user.id, false))}>
                إعادة تفعيل الحساب
              </Button>
            ) : (
              <button type="button" className={styles.action} data-tone="bad" disabled={busy} onClick={() => run(() => setSuspended(user.id, true))}>
                إيقاف الحساب
              </button>
            ))}
          <button type="button" className={styles.action} disabled={busy || endable === 0} onClick={() => run(() => endSessionsOf(user.id))}>
            {user.isSelf ? 'إنهاء جلساتي الأخرى' : 'إنهاء كل الجلسات'} ({endable})
          </button>
          <Button onClick={onClose}>إغلاق</Button>
        </ModalActions>
        <span className={styles.hint}>
          الإيقاف يسجّل خروجه من كل الأجهزة ويمنعه من الدخول حتى تعيد تفعيله. إنهاء الجلسات يطلب منه الدخول من جديد فقط.
        </span>
      </div>
    </Modal>
  );
}
