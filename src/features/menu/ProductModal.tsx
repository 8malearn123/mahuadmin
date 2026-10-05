'use client';

import { MENU_CATEGORIES } from '@/lib/data/menu';
import { sar } from '@/lib/format';
import { MENU_DRAFT_IMAGE, menuImageKey } from '@/lib/store/reducer';
import type { Addon, MenuCategory, MenuItemDraft } from '@/lib/types';
import { Button } from '@/ui/Button';
import { Field, Input, Select, TextArea } from '@/ui/Field';
import { ImageSlot } from '@/ui/ImageSlot';
import { Modal, ModalActions, ModalHint } from '@/ui/Modal';
import { Spacer } from '@/ui/Spacer';
import { joinAddons, splitAddons } from './select';
import styles from './menu.module.css';

interface ProductModalProps {
  /** The item being edited (id and its name when editing began), or null when adding. */
  editing: { id: string; name: string } | null;
  draft: MenuItemDraft;
  onChange: (draft: MenuItemDraft) => void;
  addons: Addon[];
  onSave: () => void;
  onClose: () => void;
}

export function ProductModal({ editing, draft, onChange, addons, onSave, onClose }: ProductModalProps) {
  const canSave = draft.name.trim().length > 0 && draft.price.trim().length > 0;
  const selected = splitAddons(draft.addons);
  const set = <K extends keyof MenuItemDraft>(key: K, value: MenuItemDraft[K]) => onChange({ ...draft, [key]: value });

  function toggleAddon(name: string) {
    const known = addons.map((a) => a.name);
    const current = splitAddons(draft.addons).filter((x) => known.includes(x));
    const next = current.includes(name) ? current.filter((x) => x !== name) : [...current, name];
    set('addons', joinAddons(next));
  }

  return (
    <Modal
      eyebrow="وحدة 03 · المنيو والتصنيفات والإضافات"
      title={editing ? 'تعديل الصنف — ' + editing.name : 'إضافة منتج جديد'}
      dotColor="#067B80"
      closeHover
      onClose={onClose}
    >
      <div className={styles.imageRow}>
        <div className={styles.formImage}>
          <ImageSlot slotKey={editing ? menuImageKey(editing.id) : MENU_DRAFT_IMAGE} placeholder="صورة الصنف" />
        </div>
        <div className={styles.imageText}>
          <span className={styles.imageTitle}>صورة الصنف</span>
          <span className={styles.imageHint}>
            {editing ? 'اسحب صورة جديدة فوق المربع لاستبدال الصورة الحالية' : 'اسحب صورة المنتج هنا — تظهر في المنيو والموقع'}
          </span>
        </div>
      </div>
      <div className={styles.formGrid}>
        <Field label="اسم الصنف">
          <Input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="مثال: شكشوكة جبن" />
        </Field>
        <Field label="التصنيف">
          <Select value={draft.cat} onChange={(e) => set('cat', e.target.value as MenuCategory)}>
            {MENU_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="السعر (ر.س)">
          <Input value={draft.price} onChange={(e) => set('price', e.target.value)} type="number" placeholder="32" numeric />
        </Field>
      </div>
      <Field label="الوصف">
        <TextArea value={draft.desc} onChange={(e) => set('desc', e.target.value)} rows={3} placeholder="مكوّنات الصنف كما تظهر للعميل في المنيو" />
      </Field>
      <div className={styles.addonPicker}>
        <div className={styles.addonPickerHead}>
          <span className={styles.meta}>الإضافات المتاحة — اختر من بنك الإضافات</span>
          <Spacer />
          <span className={styles.small}>{draft.addons.trim() ? draft.addons : 'لم تُختر أي إضافة'}</span>
        </div>
        <div className={styles.chips}>
          {addons.map((a) => {
            const on = selected.includes(a.name);
            return (
              <button key={a.id} type="button" className={styles.chip} aria-pressed={on} onClick={() => toggleAddon(a.name)}>
                <span className={styles.chipMark}>{on ? '✓' : '+'}</span>
                {a.name}
                <span className={styles.chipPrice}>{sar(a.price)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <ModalActions wrap={false}>
        <Button variant="primary" pad={22} inactive={!canSave} onClick={() => canSave && onSave()}>
          {editing ? 'حفظ التعديل' : 'حفظ المنتج'}
        </Button>
        <Button onClick={onClose}>إلغاء</Button>
        <ModalHint>الاسم والسعر مطلوبان — تنعكس التغييرات مباشرة على المنيو والتطبيق.</ModalHint>
      </ModalActions>
    </Modal>
  );
}
