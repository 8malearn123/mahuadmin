'use client';

import { LOYALTY_TIERS, NOTIFICATIONS, PERIOD_FACTORS, branchScale } from '@/lib/data/insights';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Bar } from '@/ui/Bar';
import { Card } from '@/ui/Card';
import { Spacer } from '@/ui/Spacer';
import { StatCard } from '@/ui/StatCard';
import styles from './loyalty.module.css';

export function LoyaltyScreen() {
  const { state } = useDashboard();
  const s = branchScale(state.branch) * (PERIOD_FACTORS[state.period] ?? 1);
  const kpis = [
    { label: 'أعضاء الولاء', value: '2340', note: 'مرتبطون برقم موثّق' },
    { label: 'تحققات OTP · ' + state.period, value: String(Math.round(96 * s)), note: 'نسبة نجاح 94%' },
    { label: 'نقاط مُحتسبة · ' + state.period, value: String(Math.round(7420 * s)), note: 'عبر تكامل بونات' },
    { label: 'إشعارات مُرسلة · ' + state.period, value: String(Math.round(412 * s)), note: 'واتساب أعمال + SMS' },
  ];

  return (
    <div className={styles.screen}>
      <div className={styles.kpis}>
        {kpis.map((k) => (
          <StatCard key={k.label} variant="roomy" max={23} label={k.label} value={k.value} note={k.note} />
        ))}
      </div>
      <div className={styles.columns}>
        <Card className={styles.log}>
          <div className={styles.logHead}>
            <h2 className={styles.title}>سجل التحقق والإشعارات</h2>
            <span className={styles.meta}>قناة واتساب أعمال · قوالب معتمدة</span>
          </div>
          {NOTIFICATIONS.map((n) => (
            <div key={n.time + n.phone} className={styles.notification}>
              <span className={styles.kind} style={{ color: toneColor(n.kindTone) }}>
                {n.kind}
              </span>
              <span className={styles.text}>{n.text}</span>
              <span className={styles.phone}>{n.phone}</span>
              <span className={styles.time}>{n.time}</span>
              <span className={styles.status} style={{ color: toneColor(n.statusTone) }}>
                {n.status}
              </span>
            </div>
          ))}
        </Card>
        <Card className={styles.tiers}>
          <h2 className={styles.title}>تكامل بونات — طبقات النقاط</h2>
          {LOYALTY_TIERS.map((t) => (
            <div key={t.name} className={styles.tier}>
              <div className={styles.tierHead}>
                <span className={styles.swatch} style={{ background: toneColor(t.tone) }} />
                <span className={styles.tierName}>{t.name}</span>
                <Spacer />
                <span className={styles.members}>{t.members} عضو</span>
              </div>
              <span className={styles.rule}>{t.rule}</span>
              <Bar value={t.pct} color={toneColor(t.tone)} height={6} track="line" roundFill={false} />
            </div>
          ))}
          <div className={styles.footnote}>
            تُسجّل النقاط تلقائيًا عبر واجهة بونات عند إتمام الطلب؛ وفي حال تعذّر الربط يتاح الإدخال اليدوي من الإدارة العامة.
          </div>
        </Card>
      </div>
    </div>
  );
}
