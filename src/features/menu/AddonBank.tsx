'use client';

import { ADDON_GROUPS, EMPTY_ADDON_DRAFT } from '@/lib/data/menu';
import { useDashboard, useUiState } from '@/lib/store/DashboardProvider';
import type { AddonGroup } from '@/lib/types';
import { Card } from '@/ui/Card';
import { Field, Input, Select } from '@/ui/Field';
import { Spacer } from '@/ui/Spacer';
import styles from './menu.module.css';

interface AddonBankProps {
  addons: { id: string; name: string; group: AddonGroup; priceText: string; isNew: boolean }[];
}

/** Shared list of add-ons that menu items can offer, with an inline form to add more. */
export function AddonBank({ addons }: AddonBankProps) {
  const { dispatch } = useDashboard();
  const [open, setOpen] = useUiState('menu.addonOpen', false);
  const [draft, setDraft] = useUiState('menu.addonDraft', EMPTY_ADDON_DRAFT);
  const canSave = draft.name.trim().length > 0;

  function save() {
    if (!canSave) return;
    dispatch({ type: 'addAddon', draft });
    setOpen(false);
    setDraft({ name: '', price: '', group: draft.group });
  }

  return (
    <Card className={styles.bank}>
      <div className={styles.bankHead}>
        <h2 className={styles.title}>بنك الإضافات</h2>
        <span className={styles.meta}>تُربط بالأصناف وتظهر للعميل عند الطلب</span>
        <Spacer />
        <button type="button" className={styles.bankToggle} onClick={() => setOpen(!open)}>
          {open ? 'إغلاق' : '+ إضافة إضافة'}
        </button>
      </div>
      {open && (
        <div className={styles.addonForm}>
          <Field label="اسم الإضافة">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="مثال: أفوكادو إضافي" onCard />
          </Field>
          <Field label="السعر (ر.س)">
            <Input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} type="number" placeholder="6" numeric onCard />
          </Field>
          <Field label="المجموعة">
            <Select value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value as AddonGroup })} onCard>
              {ADDON_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <button type="button" className={styles.addonSave} aria-disabled={!canSave || undefined} onClick={save}>
            حفظ الإضافة
          </button>
        </div>
      )}
      <div className={styles.addonList}>
        {addons.map((a) => (
          <div key={a.id} className={styles.addon}>
            <span className={styles.addonName}>{a.name}</span>
            <span className={styles.addonGroup}>{a.group}</span>
            <span className={styles.addonPrice}>{a.priceText}</span>
            {a.isNew && (
              <button type="button" className={styles.addonRemove} aria-label={'حذف ' + a.name} onClick={() => dispatch({ type: 'removeAddon', id: a.id })}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
