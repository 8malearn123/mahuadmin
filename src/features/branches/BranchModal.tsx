'use client';

import { BRANCH_CITIES } from '@/lib/data/org';
import { MANAGER_POOL } from '@/lib/data/people';
import type { BranchDraft } from '@/lib/types';
import { Button } from '@/ui/Button';
import { Field, Input, Select, TextArea } from '@/ui/Field';
import { Modal, ModalActions, ModalHint } from '@/ui/Modal';
import styles from './branches.module.css';

interface BranchModalProps {
  draft: BranchDraft;
  onChange: (draft: BranchDraft) => void;
  onSave: () => void;
  onClose: () => void;
}

export function BranchModal({ draft, onChange, onSave, onClose }: BranchModalProps) {
  const canSave = draft.name.trim().length > 0 && draft.address.trim().length > 0;
  const set = (key: keyof BranchDraft) => (value: string) => onChange({ ...draft, [key]: value });
  const managerHint = draft.manager
    ? (MANAGER_POOL.find((m) => m.name === draft.manager)?.sub ?? '')
    : 'الأسماء من دليل المستخدمين — تُسند الصلاحية تلقائيًا عند الإنشاء';

  return (
    <Modal eyebrow="وحدة 12 · إدارة الفروع" title="إضافة فرع جديد" width={700} onClose={onClose}>
      <div className={styles.formGrid}>
        <Field label="اسم الفرع">
          <Input value={draft.name} onChange={(e) => set('name')(e.target.value)} placeholder="مثال: فرع صبيا — الأمير سلطان" />
        </Field>
        <Field label="المدينة">
          <Select value={draft.city} onChange={(e) => set('city')(e.target.value)}>
            {BRANCH_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="مدير الفرع">
          <Select value={draft.manager} onChange={(e) => set('manager')(e.target.value)}>
            <option value="">— اختر من المستخدمين —</option>
            {MANAGER_POOL.map((m) => (
              <option key={m.name} value={m.name}>
                {m.label}
              </option>
            ))}
          </Select>
          <span className={styles.managerHint}>{managerHint}</span>
        </Field>
        <Field label="ساعات العمل">
          <Input value={draft.hours} onChange={(e) => set('hours')(e.target.value)} placeholder="7 ص – 12 م" />
        </Field>
        <Field label="طاقة البوكسات اليومية">
          <Input value={draft.boxes} onChange={(e) => set('boxes')(e.target.value)} type="number" placeholder="6" numeric />
        </Field>
      </div>
      <Field label="العنوان">
        <TextArea value={draft.address} onChange={(e) => set('address')(e.target.value)} rows={2} placeholder="الحي والشارع وأقرب معلم" />
      </Field>
      <ModalActions>
        <Button variant="primary" pad={22} inactive={!canSave} onClick={() => canSave && onSave()}>
          إنشاء الفرع
        </Button>
        <Button onClick={onClose}>إلغاء</Button>
        <ModalHint>الاسم والعنوان مطلوبان — يُنشأ الفرع بحالة «قيد التجهيز» حتى تربط الفريق والمنيو.</ModalHint>
      </ModalActions>
    </Modal>
  );
}
