'use client';

import { useActionState, useState } from 'react';
import { DemoInbox } from '@/features/auth/DemoInbox';
import type { FormState } from '@/lib/auth/types';
import { ALL_BRANCHES, OPERATING_BRANCHES, ROLES, STAFF_ROLE_IDS, isMultiBranch } from '@/lib/roles';
import type { RoleId } from '@/lib/types';
import { Button } from '@/ui/Button';
import { Field, Select } from '@/ui/Field';
import { Modal, ModalActions, ModalHint } from '@/ui/Modal';
import { Notice } from '@/ui/Notice';
import { TextField } from '@/ui/TextField';
import { submitTo } from '@/ui/submitTo';
import { inviteUser } from './actions';
import styles from './users.module.css';

type FieldName = 'name' | 'phone' | 'email' | 'role' | 'branch';

const EMPTY = { name: '', phone: '', email: '', role: 'barista' as RoleId, branch: OPERATING_BRANCHES[0] };

/** Invites a staff member: a WhatsApp (and email) link to set a password and verify their number. */
export function InviteModal({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState(EMPTY);
  const [sent, setSent] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState<FieldName>, fd: FormData) => {
    const result = await inviteUser(prev, fd);
    if (result.success) setSent(true);
    return result;
  }, {});
  const errors = state.errors ?? {};
  const multi = isMultiBranch(ROLES[draft.role]);
  const set = (key: keyof typeof EMPTY) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Modal eyebrow="وحدة 13 · إدارة المستخدمين" title="دعوة مستخدم إلى الفريق" width={680} onClose={onClose}>
      {sent ? (
        <>
          <Notice tone="ok">{state.success}</Notice>
          {state.demo !== undefined && <DemoInbox message={state.demo ?? null} wide />}
          <span className={styles.hint}>افتح الرابط في نافذة خاصة لتجربة قبول الدعوة دون تسجيل خروجك من هذا الحساب.</span>
          <ModalActions>
            <Button
              variant="primary"
              pad={22}
              onClick={() => {
                setDraft(EMPTY);
                setSent(false);
              }}
            >
              دعوة شخص آخر
            </Button>
            <Button onClick={onClose}>إغلاق</Button>
          </ModalActions>
        </>
      ) : (
        <form onSubmit={submitTo(formAction)} noValidate className={styles.modalForm}>
          {state.error && <Notice tone="bad">{state.error}</Notice>}
          <div className={styles.formGrid}>
            <TextField
              label="الاسم الكامل"
              name="name"
              value={draft.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="الاسم كما يظهر للفريق"
              autoFocus
              error={errors.name}
            />
            <TextField
              label="رقم الجوال"
              name="phone"
              type="tel"
              inputMode="tel"
              value={draft.phone}
              onChange={(e) => set('phone')(e.target.value)}
              placeholder="05XXXXXXXX"
              numeric
              ltr
              hint="تصله الدعوة عبر واتساب ويوثّقه برمز."
              error={errors.phone}
            />
            <TextField
              label="البريد الإلكتروني (اختياري)"
              name="email"
              type="email"
              value={draft.email}
              onChange={(e) => set('email')(e.target.value)}
              placeholder="name@mahu.sa"
              ltr
              error={errors.email}
            />
            <Field label="الدور">
              <Select name="role" value={draft.role} onChange={(e) => set('role')(e.target.value)}>
                {STAFF_ROLE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ROLES[id].name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الفرع">
              <Select name="branch" value={multi ? ALL_BRANCHES : draft.branch} onChange={(e) => set('branch')(e.target.value)} disabled={multi}>
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
          <span className={styles.hint}>{ROLES[draft.role].note}</span>
          <ModalActions>
            <Button type="submit" variant="primary" pad={22} disabled={pending} inactive={pending}>
              {pending ? 'جارٍ الإرسال…' : 'إرسال الدعوة'}
            </Button>
            <Button onClick={onClose}>إلغاء</Button>
            <ModalHint>
              تنتهي الدعوة خلال 72 ساعة.{ROLES[draft.role].twoStep === 'required' ? ' التحقق بخطوتين إلزامي لهذا الدور.' : ''}
            </ModalHint>
          </ModalActions>
        </form>
      )}
    </Modal>
  );
}
