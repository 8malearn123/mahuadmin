'use client';

import { BOOKING_TIMES, BOX_CATALOG, BOX_DAYS, PAY_OPTIONS } from '@/lib/data/boxes';
import type { BookingDraft, PayStatus } from '@/lib/types';
import { Button } from '@/ui/Button';
import { Field, Input, Select, TextArea } from '@/ui/Field';
import { Modal, ModalActions, ModalHint } from '@/ui/Modal';
import styles from './boxes.module.css';

interface BookingModalProps {
  draft: BookingDraft;
  onChange: (draft: BookingDraft) => void;
  branches: string[];
  onSave: () => void;
  onClose: () => void;
}

export function BookingModal({ draft, onChange, branches, onSave, onClose }: BookingModalProps) {
  const canSave = draft.customer.trim().length > 0 && draft.phone.trim().length > 0;
  const set = <K extends keyof BookingDraft>(key: K) => (value: BookingDraft[K]) => onChange({ ...draft, [key]: value });

  return (
    <Modal eyebrow="وحدة 11 · حجز البوكسات المجدول" title="حجز بوكس جديد" onClose={onClose}>
      <div className={styles.formGrid}>
        <Field label="اسم العميل">
          <Input value={draft.customer} onChange={(e) => set('customer')(e.target.value)} placeholder="الاسم كما يظهر على الطلب" />
        </Field>
        <Field label="رقم الجوال">
          <Input value={draft.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="05XXXXXXXX" numeric ltr />
        </Field>
        <Field label="التشكيلة">
          <Select value={draft.box} onChange={(e) => set('box')(e.target.value)}>
            {BOX_CATALOG.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="الكمية">
          <Input value={draft.qty} onChange={(e) => set('qty')(e.target.value)} type="number" numeric />
        </Field>
        <Field label="يوم التسليم">
          <Select value={draft.day} onChange={(e) => set('day')(e.target.value)}>
            {BOX_DAYS.map((d) => (
              <option key={d.key} value={String(d.key)}>
                {d.day + ' · ' + d.date}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="وقت التسليم">
          <Select value={draft.time} onChange={(e) => set('time')(e.target.value)}>
            {BOOKING_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="الفرع">
          <Select value={draft.branch} onChange={(e) => set('branch')(e.target.value)}>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="حالة الدفع">
          <Select value={draft.pay} onChange={(e) => set('pay')(e.target.value as PayStatus)}>
            {PAY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="ملاحظة التجهيز">
        <TextArea value={draft.note} onChange={(e) => set('note')(e.target.value)} rows={2} placeholder="بطاقة إهداء، شعار جهة، تفضيلات تغليف…" />
      </Field>
      <ModalActions>
        <Button variant="primary" pad={22} inactive={!canSave} onClick={() => canSave && onSave()}>
          تأكيد الحجز
        </Button>
        <Button onClick={onClose}>إلغاء</Button>
        <ModalHint>الاسم والجوال مطلوبان — يُرسل تأكيد واتساب للعميل تلقائيًا.</ModalHint>
      </ModalActions>
    </Modal>
  );
}
