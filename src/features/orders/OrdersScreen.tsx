'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Spacer } from '@/ui/Spacer';
import { StatCard } from '@/ui/StatCard';
import { selectOrders } from './select';
import styles from './orders.module.css';

export function OrdersScreen() {
  const { state, dispatch } = useDashboard();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const v = selectOrders(state);

  function moveTo(id: string, stage: number) {
    dispatch({ type: 'moveOrder', id, stage });
    setDragOver(null);
    setDragId(null);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.stats}>
        {v.stats.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} valueColor={toneColor(k.tone)} />
        ))}
      </div>
      <span className={styles.hint}>اسحب بطاقة الطلب وأفلتها في المرحلة المطلوبة — أو استخدم زر النقل.</span>
      <div className={styles.board}>
        {v.columns.map((col) => (
          <section
            key={col.stage}
            className={styles.column}
            data-over={dragOver === col.stage ? '' : undefined}
            style={{ '--tone': toneColor(col.tone) }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOver !== col.stage) setDragOver(col.stage);
            }}
            onDragLeave={() => {
              if (dragOver === col.stage) setDragOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain') || dragId;
              if (id) moveTo(id, col.stage);
            }}
          >
            <div className={styles.columnHead}>
              <span className={styles.columnDot} />
              <span className={styles.columnName}>{col.name}</span>
              <Spacer />
              <span className={styles.columnCount}>{col.count}</span>
            </div>
            {col.orders.map((o) => (
              <div
                key={o.id}
                draggable
                className={styles.card}
                data-dragging={dragId === o.id ? '' : undefined}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', o.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragId(o.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setDragOver(null);
                }}
              >
                <div className={styles.cardHead}>
                  <span className={styles.grip}>⠿</span>
                  <span className={styles.orderId}>{o.id}</span>
                  <Spacer />
                  <span className={styles.type}>{o.type}</span>
                </div>
                <span className={styles.items}>{o.items}</span>
                <div className={styles.cardMeta}>
                  <span>{o.customer}</span>
                  <span>·</span>
                  <span className={styles.num}>{o.time}</span>
                  <Spacer />
                  <span className={styles.total}>{o.total}</span>
                </div>
                {col.nextLabel && (
                  <button type="button" className={styles.advance} onClick={() => moveTo(o.id, o.stage + 1)}>
                    {col.nextLabel}
                  </button>
                )}
              </div>
            ))}
            {col.orders.length === 0 && <div className={styles.dropHere}>أفلت الطلب هنا</div>}
          </section>
        ))}
      </div>
    </div>
  );
}
