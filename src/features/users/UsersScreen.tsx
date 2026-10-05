'use client';

import { useState, useTransition } from 'react';
import { DemoInbox } from '@/features/auth/DemoInbox';
import { USER_STATUS } from '@/lib/auth/labels';
import type { FormState, UserRow } from '@/lib/auth/types';
import { ALL } from '@/lib/data/filters';
import { countNoun, phoneIntl } from '@/lib/format';
import { ROLES } from '@/lib/roles';
import { useUiState } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Notice } from '@/ui/Notice';
import { SearchBox } from '@/ui/SearchBox';
import { Segmented } from '@/ui/Segmented';
import { Spacer } from '@/ui/Spacer';
import { StatCard } from '@/ui/StatCard';
import { resendInvite, revokeInvite } from './actions';
import { InviteModal } from './InviteModal';
import { ManageUserModal } from './ManageUserModal';
import { AUDIENCE_FILTERS, STATUS_FILTERS, selectUsers, type AudienceFilter } from './select';
import styles from './users.module.css';

/** Staff and customer accounts: invitations, roles and branches, suspension and sessions. */
export function UsersScreen({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useUiState('users.query', '');
  const [audience, setAudience] = useUiState<AudienceFilter>('users.audience', ALL);
  const [status, setStatus] = useUiState('users.status', ALL as string);
  const [inviting, setInviting] = useState(false);
  const [managing, setManaging] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FormState | null>(null);
  const [busy, startTransition] = useTransition();
  const v = selectUsers(users, { query, audience, status });
  const managed = users.find((u) => u.id === managing);

  function run(action: () => Promise<FormState>) {
    setFeedback(null);
    startTransition(async () => setFeedback(await action()));
  }

  return (
    <div className={styles.screen}>
      <div className={styles.kpis}>
        <StatCard label="الحسابات النشطة" value={v.kpis.active} valueColor="var(--txt-brand)" max={21} />
        <StatCard label="دعوات معلّقة" value={v.kpis.invited} max={21} />
        <StatCard label="حسابات موقوفة" value={v.kpis.suspended} valueColor="var(--bad)" max={21} />
        <StatCard label="الفريق بالتحقق بخطوتين" value={v.kpis.twoStep} note="من الحسابات النشطة" max={21} />
      </div>

      <div className={styles.addBar}>
        <span className={styles.addText}>
          تصل الدعوة عبر واتساب (والبريد إن وُجد) وتنتهي خلال 72 ساعة. يضع المدعو كلمة مروره ويوثّق رقمه، ثم تُطبَّق عليه صلاحيات الدور والفرع تلقائيًا.
        </span>
        <Button variant="accent" pad={20} onClick={() => setInviting(true)}>
          + دعوة مستخدم
        </Button>
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} />}
      {managed && <ManageUserModal key={managed.id} user={managed} onClose={() => setManaging(null)} />}

      {feedback && (feedback.success || feedback.error) && (
        <div className={styles.feedback}>
          <Notice tone={feedback.error ? 'bad' : 'ok'}>{feedback.error ?? feedback.success}</Notice>
          {feedback.demo !== undefined && <DemoInbox message={feedback.demo ?? null} wide />}
        </div>
      )}

      <Card pad="md" className={styles.filters}>
        <div className={styles.filterRow}>
          <SearchBox label="بحث" value={query} onChange={setQuery} placeholder="الاسم أو الجوال أو البريد…" />
          <Segmented label="نوع الحساب" options={AUDIENCE_FILTERS} value={audience} onChange={setAudience} surface="inset" activeText="cream100" />
        </div>
        <div className={styles.statusRow}>
          {STATUS_FILTERS.map((s) => (
            <button key={s.id} type="button" className={styles.statusTab} aria-pressed={s.id === status} onClick={() => setStatus(s.id)}>
              {s.label}
            </button>
          ))}
          <Spacer />
          <span className={styles.count}>{v.count}</span>
        </div>
      </Card>

      <Card pad="none" className={styles.table}>
        <div className={styles.headRow}>
          <span>المستخدم</span>
          <span>الدور والنطاق</span>
          <span>الحالة</span>
          <span>آخر دخول</span>
          <span />
        </div>
        {v.rows.map((u) => {
          const role = ROLES[u.role];
          const st = USER_STATUS[u.status];
          return (
            <div key={u.id} className={styles.row}>
              <div className={styles.who}>
                <Avatar name={u.name} size={32} />
                <div className={styles.cell}>
                  <div className={styles.nameLine}>
                    <span className={styles.name}>{u.name}</span>
                    {u.isSelf && <span className={styles.you}>أنت</span>}
                  </div>
                  <span className={styles.small}>
                    <bdi className={styles.ltr}>{phoneIntl(u.phone)}</bdi>
                    {u.email && (
                      <>
                        {' · '}
                        <bdi className={styles.ltr}>{u.email}</bdi>
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.cell}>
                <span className={styles.roleLine}>
                  <span className={styles.dot} style={{ background: toneColor(role.tone) }} aria-hidden="true" />
                  {role.name}
                </span>
                <span className={styles.small}>{u.scope}</span>
              </div>
              <div className={styles.cell}>
                <span className={styles.status} style={{ color: toneColor(st.tone) }}>
                  {st.label}
                </span>
                <span className={styles.small}>{u.inviteNote ?? (u.twoStep ? 'تحقق بخطوتين' : u.status === 'active' ? 'كلمة مرور فقط' : '')}</span>
              </div>
              <div className={styles.cell}>
                <span>{u.lastSignIn}</span>
                {u.activeSessions > 0 && <span className={styles.small}>{countNoun(u.activeSessions, ['جهاز متصل', 'جهازان متصلان', 'أجهزة متصلة', 'جهازًا متصلًا'])}</span>}
              </div>
              <div className={styles.rowActions}>
                {u.awaitingSetup ? (
                  <>
                    <button type="button" className={styles.action} disabled={busy} onClick={() => run(() => resendInvite(u.id))}>
                      إعادة إرسال الدعوة
                    </button>
                    <button type="button" className={styles.action} data-tone="bad" disabled={busy} onClick={() => run(() => revokeInvite(u.id))}>
                      إلغاء
                    </button>
                  </>
                ) : (
                  <button type="button" className={styles.action} onClick={() => setManaging(u.id)}>
                    إدارة
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {v.rows.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>لا يوجد مستخدمون مطابقون</span>
            <span className={styles.emptyHint}>جرّب تغيير الحالة أو نوع الحساب أو مسح البحث</span>
          </div>
        )}
      </Card>
    </div>
  );
}
