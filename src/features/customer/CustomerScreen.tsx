import { sar, initialOf } from '@/lib/format';
import type { Portal } from '@/lib/data/portal';
import { toneColor } from '@/lib/tones';
import { Bar } from '@/ui/Bar';
import { Card } from '@/ui/Card';
import { Spacer } from '@/ui/Spacer';
import styles from './customer.module.css';

/** What a customer sees: points, live order, history and box bookings (`portal` is theirs, or the sample customer's in a preview). */
export function CustomerScreen({ portal }: { portal: Portal }) {
  return (
    <div className={styles.screen}>
      <Card as="div" pad="none" className={styles.wallet}>
        <div className={styles.account}>
          <div className={styles.accountHead}>
            <span className={styles.avatar}>{initialOf(portal.name)}</span>
            <div className={styles.identity}>
              <span className={styles.name}>{portal.name}</span>
              <span className={styles.phone}>{portal.phone}</span>
            </div>
            <Spacer />
            <span className={styles.verified}>موثّق</span>
          </div>
          <div className={styles.points}>
            <span className={styles.label}>رصيد نقاط بونات</span>
            <Spacer />
            <span className={styles.pointsValue}>{portal.points}</span>
          </div>
          <Bar value={portal.pct} color="var(--mango)" height={6} track="line" roundFill={false} />
          <span className={styles.small}>{portal.toNext} نقطة تفصلك عن مشروب مجاني</span>
        </div>
        <div className={styles.current}>
          <span className={styles.currentTitle}>طلبي الحالي</span>
          {portal.live ? (
            <div className={styles.tracker}>
              <div className={styles.trackerHead}>
                <span className={styles.orderId}>{portal.live.id}</span>
                <Spacer />
                <span className={styles.orderState}>{portal.live.state}</span>
              </div>
              {portal.live.steps.map((s) => (
                <div key={s.n} className={styles.step} data-reached={s.done || s.active ? '' : undefined}>
                  <span className={styles.stepNumber}>{s.n}</span>
                  <span className={styles.stepLabel}>{s.label}</span>
                  <Spacer />
                  <span className={styles.stepTime}>{s.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>لا يوجد طلب قيد التجهيز</span>
              <span className={styles.emptyHint}>اطلب من الموقع أو من الكاشير برقمك، وتابع حالته هنا لحظة بلحظة.</span>
            </div>
          )}
        </div>
      </Card>
      <div className={styles.lists}>
        <Card className={styles.orders}>
          <h2 className={styles.title}>سجل طلباتي</h2>
          {portal.orders.length === 0 && (
            <div className={styles.emptyInline}>
              <span className={styles.emptyTitle}>لا توجد طلبات بعد</span>
              <span className={styles.emptyHint}>تُحتسب نقاط بونات تلقائيًا مع كل طلب تدفعه.</span>
            </div>
          )}
          {portal.orders.map((o) => (
            <div key={o.id} className={styles.orderRow}>
              <span className={styles.numMuted}>{o.id}</span>
              <span className={styles.orderItems}>{o.items}</span>
              <span className={styles.small}>{o.branch}</span>
              <span className={styles.numMuted}>{o.date}</span>
              <span className={styles.total}>{sar(o.total)}</span>
              <span className={styles.earned}>+{o.points} نقطة</span>
            </div>
          ))}
        </Card>
        <Card className={styles.boxes}>
          <h2 className={styles.title}>حجوزات البوكسات</h2>
          {portal.boxes.length === 0 && (
            <div className={styles.emptyInline}>
              <span className={styles.emptyTitle}>لا توجد حجوزات</span>
              <span className={styles.emptyHint}>احجز بوكسات المناسبات قبل 24 ساعة من موعد التسليم.</span>
            </div>
          )}
          {portal.boxes.map((b) => (
            <div key={b.name} className={styles.box}>
              <div className={styles.boxBody}>
                <span className={styles.boxName}>{b.name}</span>
                <span className={styles.small}>
                  تسليم {b.when} · {b.branch}
                </span>
              </div>
              <span className={styles.boxPrice}>{sar(b.price)}</span>
              <span className={styles.boxState} style={{ color: toneColor(b.stateTone) }}>
                {b.state}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
