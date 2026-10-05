import { AUDIT_LOG, ROLE_SUMMARIES, SECURITY_CONTROLS } from '@/lib/data/org';
import { toneColor } from '@/lib/tones';
import { Card } from '@/ui/Card';
import styles from './roles.module.css';

export function RolesScreen() {
  return (
    <div className={styles.screen}>
      <Card pad="none" className={styles.table}>
        <div className={styles.headRow}>
          <span>الدور</span>
          <span>النطاق</span>
          <span>الصلاحيات الأساسية</span>
        </div>
        {ROLE_SUMMARIES.map((r) => (
          <div key={r.name} className={styles.row}>
            <div className={styles.roleName}>
              <span className={styles.dot} style={{ background: toneColor(r.tone) }} />
              <span className={styles.name}>{r.name}</span>
            </div>
            <span className={styles.scope}>{r.scope}</span>
            <span className={styles.perms}>{r.perms}</span>
          </div>
        ))}
      </Card>
      <div className={styles.columns}>
        <Card className={styles.audit}>
          <h2 className={styles.title}>سجل التدقيق</h2>
          {AUDIT_LOG.map((a) => (
            <div key={a.time} className={styles.auditRow}>
              <span className={styles.time}>{a.time}</span>
              <span className={styles.auditText}>{a.text}</span>
              <span className={styles.actor}>{a.actor}</span>
            </div>
          ))}
        </Card>
        <Card className={styles.security}>
          <h2 className={styles.title}>عزل البيانات وسياسات الأمان</h2>
          {SECURITY_CONTROLS.map((s) => (
            <div key={s.title} className={styles.control}>
              <span className={styles.controlDot} />
              <div className={styles.controlBody}>
                <span className={styles.controlTitle}>{s.title}</span>
                <span className={styles.controlDesc}>{s.desc}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
