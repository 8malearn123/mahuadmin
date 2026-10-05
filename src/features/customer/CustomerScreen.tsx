import { sar } from '@/lib/format';
import { PORTAL_BOXES, PORTAL_CUSTOMER, PORTAL_ORDERS, PORTAL_STEPS } from '@/lib/data/portal';
import { toneColor } from '@/lib/tones';
import { Bar } from '@/ui/Bar';
import { Card } from '@/ui/Card';
import { Spacer } from '@/ui/Spacer';
import styles from './customer.module.css';

/** What the signed-in customer sees: points, live order, history and box bookings. */
export function CustomerScreen() {
  return (
    <div className={styles.screen}>
      <Card as="div" pad="none" className={styles.wallet}>
        <div className={styles.account}>
          <div className={styles.accountHead}>
            <span className={styles.avatar}>{PORTAL_CUSTOMER.initial}</span>
            <div className={styles.identity}>
              <span className={styles.name}>{PORTAL_CUSTOMER.name}</span>
              <span className={styles.phone}>{PORTAL_CUSTOMER.phone}</span>
            </div>
            <Spacer />
            <span className={styles.verified}>موثّق</span>
          </div>
          <div className={styles.points}>
            <span className={styles.label}>رصيد نقاط بونات</span>
            <Spacer />
            <span className={styles.pointsValue}>{PORTAL_CUSTOMER.points}</span>
          </div>
          <Bar value="68%" color="var(--mango)" height={6} track="line" roundFill={false} />
          <span className={styles.small}>{PORTAL_CUSTOMER.toNext} نقطة تفصلك عن مشروب مجاني</span>
        </div>
        <div className={styles.current}>
          <span className={styles.currentTitle}>طلبي الحالي</span>
          <div className={styles.tracker}>
            <div className={styles.trackerHead}>
              <span className={styles.orderId}>{PORTAL_CUSTOMER.liveOrderId}</span>
              <Spacer />
              <span className={styles.orderState}>قيد التجهيز</span>
            </div>
            {PORTAL_STEPS.map((s) => (
              <div key={s.n} className={styles.step} data-reached={s.done || s.active ? '' : undefined}>
                <span className={styles.stepNumber}>{s.n}</span>
                <span className={styles.stepLabel}>{s.label}</span>
                <Spacer />
                <span className={styles.stepTime}>{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <div className={styles.lists}>
        <Card className={styles.orders}>
          <h2 className={styles.title}>سجل طلباتي</h2>
          {PORTAL_ORDERS.map((o) => (
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
          {PORTAL_BOXES.map((b) => (
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
