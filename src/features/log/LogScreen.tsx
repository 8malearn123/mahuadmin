'use client';

import { ALL } from '@/lib/data/filters';
import { LOG_STATUS_FILTERS, LOG_TYPE_FILTERS } from '@/lib/data/orders';
import { useDashboard, useUiState } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Card } from '@/ui/Card';
import { SearchBox } from '@/ui/SearchBox';
import { Segmented } from '@/ui/Segmented';
import { Spacer } from '@/ui/Spacer';
import { StatCard } from '@/ui/StatCard';
import { selectLog } from './select';
import styles from './log.module.css';


export function LogScreen() {
  const { state } = useDashboard();
  const [query, setQuery] = useUiState('log.query', '');
  const [status, setStatus] = useUiState('log.status', ALL);
  const [type, setType] = useUiState('log.type', ALL);
  const v = selectLog(state, { query, status, type });

  function clear() {
    setQuery('');
    setStatus(ALL);
    setType(ALL);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.kpis}>
        <StatCard label="إجمالي المبيعات" value={v.sum} valueColor="var(--txt-brand)" max={21} />
        <StatCard label="متوسط قيمة الطلب" value={v.avg} max={21} />
        <StatCard label="طلبات بوكسات" value={v.boxes} valueColor="var(--txt-brand)" max={21} />
        <StatCard label="ملغي / مسترجع" value={v.cancelled} valueColor="var(--bad)" max={21} />
      </div>

      <Card pad="md" className={styles.filters}>
        <div className={styles.filterRow}>
          <SearchBox label="بحث" value={query} onChange={setQuery} placeholder="رقم الطلب أو اسم العميل أو الصنف…" />
          <Segmented label="نوع الطلب" options={LOG_TYPE_FILTERS} value={type} onChange={setType} surface="inset" activeText="cream100" />
          <button type="button" className={styles.clear} onClick={clear}>
            مسح
          </button>
        </div>
        <div className={styles.statusRow}>
          {LOG_STATUS_FILTERS.map((s) => (
            <button key={s} type="button" className={styles.statusTab} aria-pressed={s === status} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
          <Spacer />
          <span className={styles.count}>{v.count}</span>
        </div>
      </Card>

      <Card pad="none" className={styles.table}>
        <div className={styles.headRow}>
          <span>الطلب</span>
          <span>التفاصيل</span>
          <span>الوقت والفرع</span>
          <span>الدفع</span>
          <span>الإجمالي</span>
          <span>الحالة</span>
        </div>
        {v.rows.map((r) => (
          <div key={r.id} className={styles.row}>
            <span className={styles.id}>{r.id}</span>
            <div className={styles.cell}>
              <div className={styles.itemsLine}>
                <span>{r.items}</span>
                <span className={styles.type}>{r.type}</span>
              </div>
              <span className={styles.small}>
                {r.customer} · {r.points} نقطة
              </span>
            </div>
            <div className={styles.cell}>
              <span className={styles.when}>{r.when}</span>
              <span className={styles.small}>{r.branch}</span>
            </div>
            <span className={styles.pay}>{r.pay}</span>
            <span className={styles.total}>{r.total}</span>
            <span className={styles.status} style={{ color: toneColor(r.tone) }}>
              {r.status}
            </span>
          </div>
        ))}
        {v.rows.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyTitle}>لا توجد طلبات مطابقة</span>
            <span className={styles.emptyHint}>جرّب تغيير الحالة أو مسح الفلاتر</span>
          </div>
        )}
      </Card>
    </div>
  );
}
