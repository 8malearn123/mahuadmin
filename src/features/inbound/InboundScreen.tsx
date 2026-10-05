'use client';

import { sar } from '@/lib/format';
import { FRANCHISE_LEADS, JOB_APPLICATIONS } from '@/lib/data/people';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import type { JobState } from '@/lib/types';
import { Bar } from '@/ui/Bar';
import { Card } from '@/ui/Card';
import { Spacer } from '@/ui/Spacer';
import styles from './inbound.module.css';

// As designed, applications still under review are flagged in red too.
const JOB_STATE_COLORS: Record<JobState, string> = {
  'قيد المراجعة': toneColor('bad'),
  'مقبول للمقابلة': toneColor('ok'),
  'مستبعد': toneColor('bad'),
};

export function InboundScreen() {
  const { state, dispatch } = useDashboard();

  return (
    <div className={styles.screen}>
      <Card className={styles.list}>
        <h2 className={styles.title}>طلبات التوظيف</h2>
        {JOB_APPLICATIONS.map((j) => {
          const jobState = state.jobStates[j.name] ?? 'قيد المراجعة';
          return (
            <div key={j.name} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.name}>{j.name}</span>
                <span className={styles.role}>{j.role}</span>
                <Spacer />
                <span className={styles.state} style={{ color: JOB_STATE_COLORS[jobState] }}>
                  {jobState}
                </span>
              </div>
              <span className={styles.meta}>{j.meta}</span>
              <div className={styles.actions}>
                <button type="button" className={styles.accept} onClick={() => dispatch({ type: 'setJobState', name: j.name, state: 'مقبول للمقابلة' })}>
                  قبول للمقابلة
                </button>
                <button type="button" className={styles.reject} onClick={() => dispatch({ type: 'setJobState', name: j.name, state: 'مستبعد' })}>
                  استبعاد
                </button>
              </div>
            </div>
          );
        })}
      </Card>
      <Card className={styles.list}>
        <h2 className={styles.title}>طلبات الفرنشايز</h2>
        {FRANCHISE_LEADS.map((f) => (
          <div key={f.name} className={styles.item}>
            <div className={styles.itemHead}>
              <span className={styles.name}>{f.name}</span>
              <Spacer />
              <span className={styles.budget}>{sar(f.budget)}</span>
            </div>
            <span className={styles.meta}>
              {f.city} · {f.meta}
            </span>
            <Bar value={f.score} color={toneColor(f.tone)} height={6} track="line" roundFill={false} />
            <span className={styles.score}>جاهزية الملف {f.score}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
