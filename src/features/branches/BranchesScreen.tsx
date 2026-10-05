'use client';

import { useState } from 'react';
import { sar } from '@/lib/format';
import { BRANCH_CARDS, EMPTY_BRANCH_DRAFT } from '@/lib/data/org';
import { ROLES } from '@/lib/roles';
import { useDashboard, useUiState } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Spacer } from '@/ui/Spacer';
import { BranchModal } from './BranchModal';
import styles from './branches.module.css';

export function BranchesScreen() {
  const { state, dispatch } = useDashboard();
  const [draft, setDraft] = useUiState('branches.draft', EMPTY_BRANCH_DRAFT);
  const [open, setOpen] = useState(false);
  const scope = ROLES[state.role].scope;
  const canAddBranch = scope === 'كامل المنصة' || scope === 'كل الفروع';

  function save() {
    dispatch({ type: 'addBranch', draft });
    setOpen(false);
    setDraft(EMPTY_BRANCH_DRAFT);
  }

  return (
    <div className={styles.screen}>
      {canAddBranch && (
        <div className={styles.addBar}>
          <span className={styles.addText}>
            إضافة فرع تُنشئ بيئة بيانات معزولة (RLS) ونطاقًا فرعيًا خاصًا، وتظهر مباشرة في فلتر الفروع والتقارير.
          </span>
          <Spacer />
          <Button variant="accent" pad={20} onClick={() => setOpen(true)}>
            + إضافة فرع
          </Button>
        </div>
      )}

      {open && <BranchModal draft={draft} onChange={setDraft} onSave={save} onClose={() => setOpen(false)} />}

      <div className={styles.cards}>
        {BRANCH_CARDS.map((b) => (
          <Card key={b.name} pad="none" className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.swatch} style={{ background: toneColor(b.tone) }} />
              <h2 className={styles.name}>{b.name}</h2>
              <Spacer />
              <span className={styles.state} style={{ color: toneColor('ok') }}>
                {b.state}
              </span>
            </div>
            <div className={styles.stats}>
              {[
                { label: 'الطلبات · ' + state.period, value: String(b.orders) },
                { label: 'المبيعات', value: sar(b.sales) },
                { label: 'التحضير', value: b.prep + ' د' },
              ].map((s) => (
                <div key={s.label} className={styles.stat}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.team}>
              <span className={styles.teamTitle}>الفريق المناوب</span>
              <div className={styles.teamList}>
                {b.team.map((p) => (
                  <span key={p.name} className={styles.member}>
                    {p.name} <span className={styles.memberRole}>· {p.role}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.note}>{b.note}</div>
          </Card>
        ))}
        {state.branchesAdded.map((b) => (
          <section key={b.id} className={styles.newCard}>
            <div className={styles.cardHead}>
              <span className={styles.swatch} style={{ background: 'var(--mango)' }} />
              <h2 className={styles.name}>{b.name}</h2>
              <Spacer />
              <span className={styles.state} style={{ color: 'var(--warn)' }}>
                قيد التجهيز
              </span>
            </div>
            <div className={styles.details}>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>المدينة</span>
                <Spacer />
                <span>{b.city}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>العنوان</span>
                <Spacer />
                <span className={styles.address}>{b.address}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>مدير الفرع</span>
                <Spacer />
                <span>{b.manager}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>ساعات العمل</span>
                <Spacer />
                <span>{b.hours}</span>
              </div>
              <div className={styles.detailLast}>
                <span className={styles.detailLabel}>طاقة البوكسات</span>
                <Spacer />
                <span>{b.boxes} بوكس/يوم</span>
              </div>
            </div>
            <div className={styles.newFoot}>
              <span className={styles.newHint}>بيئة بيانات معزولة جاهزة — اربط الفريق والمنيو لتفعيل الفرع.</span>
              <Spacer />
              <button type="button" className={styles.remove} onClick={() => dispatch({ type: 'removeBranch', id: b.id })}>
                حذف
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
