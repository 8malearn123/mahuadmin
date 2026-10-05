'use client';

import { useDashboard } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Bar } from '@/ui/Bar';
import { Card } from '@/ui/Card';
import { Spacer } from '@/ui/Spacer';
import { StatCard } from '@/ui/StatCard';
import { cx } from '@/ui/cx';
import { selectOverview } from './select';
import styles from './overview.module.css';

export function OverviewScreen() {
  const { state } = useDashboard();
  const v = selectOverview(state);

  return (
    <div className={styles.screen}>
      <div className={styles.kpis}>
        {v.kpis.map((k) => (
          <StatCard key={k.label} variant="hero" label={k.label} value={k.value} note={k.delta} noteColor={toneColor(k.deltaTone)} />
        ))}
      </div>

      <div className={styles.charts}>
        <Card>
          <div className={styles.chartHead}>
            <h2 className={styles.title}>الطلبات حسب الساعة</h2>
            <span className={styles.meta}>اليوم · مقارنة بالأمس</span>
            <Spacer />
            <span className={styles.meta}>{v.peakHour}</span>
          </div>
          <div className={styles.chart}>
            {v.hourly.map((h) => (
              <div key={h.label} className={styles.hour}>
                <div className={styles.hourBars}>
                  <div className={styles.barNow} style={{ height: h.now }} />
                  <div className={styles.barPrev} style={{ height: h.prev }} />
                </div>
                <span className={styles.hourLabel}>{h.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.branches}>
          <h2 className={styles.title}>أداء الفروع</h2>
          {v.branchPerf.map((b) => (
            <div key={b.city} className={styles.branch}>
              <div className={styles.branchHead}>
                <span className={styles.branchName}>{b.name}</span>
                <Spacer />
                <span className={styles.branchSales}>{b.sales}</span>
              </div>
              <Bar value={b.pct} color={toneColor(b.tone)} height={7} />
              <div className={styles.branchMeta}>
                <span>{b.orders} طلب</span>
                <span>متوسط {b.avg}</span>
                <span>تحضير {b.prep}</span>
              </div>
            </div>
          ))}
          {v.newBranches.map((b) => (
            <div key={b.id} className={styles.newBranch}>
              <span className={styles.swatch} style={{ background: 'var(--mango)' }} />
              <span className={styles.newBranchName}>{b.name}</span>
              <Spacer />
              <span className={styles.pending}>قيد التجهيز · لا بيانات بعد</span>
            </div>
          ))}
          {v.showLegend && (
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.swatch} style={{ background: 'var(--palm)' }} />
                جازان
              </span>
              <span className={styles.legendItem}>
                <span className={styles.swatch} style={{ background: 'var(--fill-bad)' }} />
                أبو عريش
              </span>
            </div>
          )}
        </Card>
      </div>

      <div className={styles.lists}>
        <Card>
          <h2 className={cx(styles.title, styles.listTitle)}>الأصناف الأكثر مبيعًا</h2>
          {v.noData && <span className={styles.meta}>لا بيانات لهذا الفرع بعد.</span>}
          {v.topItems.map((t) => (
            <div key={t.rank} className={styles.topItem}>
              <span className={styles.rank}>{t.rank}</span>
              <span className={styles.itemName}>{t.name}</span>
              <span className={styles.qty}>{t.qty}</span>
              <span className={styles.itemSales}>{t.sales}</span>
            </div>
          ))}
        </Card>

        <Card>
          <h2 className={cx(styles.title, styles.listTitle)}>قنوات الطلب</h2>
          {v.noData && <span className={styles.meta}>لا بيانات لهذا الفرع بعد.</span>}
          {v.channels.map((c) => (
            <div key={c.name} className={styles.channel}>
              <div className={styles.channelHead}>
                <span>{c.name}</span>
                <Spacer />
                <span className={styles.channelPct}>{c.pct}</span>
              </div>
              <Bar value={c.pct} color={toneColor(c.tone)} height={6} roundFill={false} />
            </div>
          ))}
        </Card>

        <Card className={styles.alerts}>
          <h2 className={styles.title}>تنبيهات تشغيلية</h2>
          {v.noData && <span className={styles.meta}>لا تنبيهات — الفرع لم يبدأ التشغيل.</span>}
          {v.alerts.map((a) => (
            <div key={a.text} className={styles.alert} style={{ '--tone': toneColor(a.tone) }}>
              <div className={styles.alertBody}>
                <span className={styles.alertText}>{a.text}</span>
                <span className={styles.alertMeta}>{a.meta}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
