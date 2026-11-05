'use client';

import { useState } from 'react';
import { ALL } from '@/lib/data/filters';
import { AVAILABILITY_FILTERS, emptyItemDraft } from '@/lib/data/menu';
import { useDashboard, useUiState } from '@/lib/store/DashboardProvider';
import { activeRole, menuImageKey } from '@/lib/store/reducer';
import type { MenuItem, MenuItemDraft } from '@/lib/types';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ImageSlot } from '@/ui/ImageSlot';
import { SearchBox } from '@/ui/SearchBox';
import { Segmented } from '@/ui/Segmented';
import { Spacer } from '@/ui/Spacer';
import { Toggle } from '@/ui/Toggle';
import { AddonBank } from './AddonBank';
import { ProductModal } from './ProductModal';
import { allAddons, selectMenu } from './select';
import styles from './menu.module.css';

interface ProductForm {
  open: boolean;
  editing: { id: string; name: string } | null;
  draft: MenuItemDraft;
}

const CLOSED_FORM: ProductForm = { open: false, editing: null, draft: emptyItemDraft() };

function draftFrom(m: MenuItem): MenuItemDraft {
  return {
    name: m.name,
    desc: m.desc === '—' ? '' : m.desc,
    cat: m.cat,
    price: String(m.price),
    addons: m.addons === '—' ? '' : m.addons,
  };
}

export function MenuScreen() {
  const { state, dispatch } = useDashboard();
  const [query, setQuery] = useUiState('menu.query', '');
  const [cat, setCat] = useUiState('menu.cat', ALL);
  const [avail, setAvail] = useUiState('menu.avail', ALL);
  const [form, setForm] = useState<ProductForm>(CLOSED_FORM);
  const canEdit = activeRole(state).editMenu;
  const v = selectMenu(state, { query, cat, avail });

  function toggleForm() {
    setForm(form.open ? { ...form, open: false, editing: null } : { open: true, editing: null, draft: emptyItemDraft() });
  }

  function saveItem() {
    const d = form.draft;
    dispatch({
      type: 'saveMenuItem',
      editingId: form.editing?.id ?? null,
      fields: {
        name: d.name.trim(),
        desc: d.desc.trim() || '—',
        cat: d.cat,
        price: Number(d.price) || 0,
        addons: d.addons.trim() || '—',
      },
    });
    if (!form.editing) setCat(d.cat);
    setForm(CLOSED_FORM);
  }

  function clearFilters() {
    setQuery('');
    setCat(ALL);
    setAvail(ALL);
  }

  return (
    <div className={styles.screen}>
      <Card pad="md" className={styles.filters}>
        <div className={styles.filterRow}>
          <SearchBox label="بحث" value={query} onChange={setQuery} placeholder="اسم الصنف أو مكوّن أو إضافة…" />
          <Segmented label="التوفّر" options={AVAILABILITY_FILTERS} value={avail} onChange={setAvail} surface="inset" />
          {canEdit && (
            <Button variant="accent" onClick={toggleForm}>
              + إضافة منتج
            </Button>
          )}
        </div>
        <div className={styles.categoryRow}>
          {v.categories.map((c) => (
            <button key={c.name} type="button" className={styles.category} aria-pressed={c.name === cat} onClick={() => setCat(c.name)}>
              {c.name} <span className={styles.categoryCount}>{c.count}</span>
            </button>
          ))}
          <Spacer />
          <span className={styles.meta}>{v.resultCount}</span>
          {v.filtersDirty && (
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              مسح الفلاتر
            </button>
          )}
        </div>
      </Card>

      {form.open && (
        <ProductModal
          editing={form.editing}
          draft={form.draft}
          onChange={(draft) => setForm({ ...form, draft })}
          addons={allAddons(state)}
          onSave={saveItem}
          onClose={() => setForm(CLOSED_FORM)}
        />
      )}

      <Card pad="none" className={styles.table}>
        <div className={styles.headRow}>
          <span>الصورة</span>
          <span>الصنف</span>
          <span>التصنيف</span>
          <span>السعر</span>
          <span>التوفّر</span>
          <span />
        </div>
        {v.rows.map(({ item, price, available, isNew }) => (
          <div key={item.id} className={styles.row}>
            <div className={styles.rowImage}>
              <ImageSlot slotKey={menuImageKey(item.id)} placeholder="صورة" />
            </div>
            <div className={styles.itemCell}>
              <div className={styles.itemNameRow}>
                <span>{item.name}</span>
                {isNew && (
                  <button type="button" className={styles.remove} onClick={() => dispatch({ type: 'removeMenuItem', id: item.id })}>
                    حذف
                  </button>
                )}
              </div>
              <span className={styles.small}>{item.desc}</span>
              <span className={styles.itemAddons}>إضافات: {item.addons}</span>
            </div>
            <span className={styles.itemCat}>{item.cat}</span>
            <span className={styles.itemPrice}>{price}</span>
            <Toggle on={available} label={available ? 'متوفر' : 'غير متوفر'} onToggle={() => dispatch({ type: 'toggleMenuOff', id: item.id })} />
            {canEdit && (
              <button
                type="button"
                className={styles.edit}
                onClick={() => setForm({ open: true, editing: { id: item.id, name: item.name }, draft: draftFrom(item) })}
              >
                تعديل
              </button>
            )}
          </div>
        ))}
        {v.rows.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>لا توجد أصناف مطابقة</span>
            <span className={styles.meta}>جرّب تغيير التصنيف أو مسح الفلاتر</span>
          </div>
        )}
      </Card>

      <AddonBank addons={v.addons} />
    </div>
  );
}
