'use client';

import { useDashboard, useUiState } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import { Bar } from '@/ui/Bar';
import { Card } from '@/ui/Card';
import { SearchBox } from '@/ui/SearchBox';
import { Spacer } from '@/ui/Spacer';
import { selectLookup } from './select';
import styles from './lookup.module.css';

export function LookupScreen() {
  const { state } = useDashboard();
  const [query, setQuery] = useUiState('lookup.query', '');
  const [selectedPhone, setSelectedPhone] = useUiState<string | null>('lookup.selected', null);
  const v = selectLookup(state, query, selectedPhone);
  const sel = v.selected;

  function search(value: string) {
    setQuery(value);
    setSelectedPhone(null);
  }

  return (
    <div className={styles.screen}>
      <Card pad="none" className={styles.searchCard}>
        <div className={styles.searchRow}>
          <SearchBox label="استعلام" value={query} onChange={search} placeholder="رقم الجوال أو اسم العميل…" roomy />
          <button type="button" className={styles.clear} onClick={() => search('')}>
            مسح
          </button>
        </div>
        <div className={styles.scopeRow}>
          <span style={{ color: toneColor(v.levelTone) }}>مستوى الوصول: {v.level}</span>
          <span>·</span>
          <span>{v.scopeNote}</span>
          <Spacer />
          <span>{v.count}</span>
        </div>
      </Card>

      {v.prompt && (
        <div className={styles.prompt}>
          <span className={styles.promptTitle}>ابحث عن عميل للبدء</span>
          <span className={styles.meta}>يُسجَّل كل استعلام في سجل التدقيق مع اسم المستخدم ووقت الاطلاع.</span>
        </div>
      )}
      {v.empty && (
        <div className={styles.noMatch}>
          <span className={styles.noMatchTitle}>لا يوجد عميل مطابق</span>
          <span className={styles.meta}>تحقق من الرقم، أو قد يكون العميل خارج نطاق فرعك.</span>
        </div>
      )}

      <div className={styles.columns}>
        <section className={styles.hits}>
          {v.hits.map((c) => (
            <button key={c.key} type="button" className={styles.hit} aria-pressed={c.selected} onClick={() => setSelectedPhone(c.key)}>
              <div className={styles.hitHead}>
                <span className={styles.hitName}>{c.name}</span>
                <span className={styles.tier} style={{ color: toneColor(c.tierTone) }}>
                  {c.tier}
                </span>
                <Spacer />
                <span className={styles.hitPhone}>{c.phone}</span>
              </div>
              <div className={styles.hitMeta}>
                <span>{c.orders} طلب</span>
                <span>{c.points} نقطة</span>
                <span>{c.branch}</span>
                <span>آخر زيارة {c.last}</span>
              </div>
            </button>
          ))}
        </section>

        {sel && (
          <div className={styles.detail}>
            <section className={styles.profile} style={{ borderColor: toneColor(sel.tierTone) }}>
              <div className={styles.profileHead}>
                <span className={styles.avatar}>{sel.initial}</span>
                <div className={styles.identity}>
                  <span className={styles.profileName}>{sel.name}</span>
                  <span className={styles.profilePhone}>{sel.phone}</span>
                </div>
                <Spacer />
                <span className={styles.profileTier} style={{ color: toneColor(sel.tierTone) }}>
                  {sel.tier}
                </span>
                <button type="button" className={styles.close} onClick={() => setSelectedPhone(null)} aria-label="إغلاق">
                  ×
                </button>
              </div>
              <div className={styles.points}>
                <div className={styles.pointsHead}>
                  <span className={styles.label}>رصيد نقاط بونات</span>
                  <Spacer />
                  <span className={styles.pointsValue}>{sel.points}</span>
                </div>
                <Bar value={sel.pct} color="var(--mango)" height={6} roundFill={false} />
                <span className={styles.small}>{sel.toNext} نقطة تفصله عن مشروب مجاني</span>
              </div>
              <div className={styles.facts}>
                <div className={styles.fact}>
                  <span className={styles.small}>عدد الطلبات</span>
                  <span className={styles.factValue}>{sel.orders}</span>
                </div>
                {v.canSeeSpend && (
                  <div className={styles.fact}>
                    <span className={styles.small}>إجمالي الإنفاق</span>
                    <span className={styles.factValue}>{sel.spend}</span>
                  </div>
                )}
                <div className={styles.fact}>
                  <span className={styles.small}>آخر زيارة</span>
                  <span className={styles.factValue}>{sel.last}</span>
                </div>
              </div>
              <div className={styles.attributes}>
                <div className={styles.attribute}>
                  <span className={styles.attributeLabel}>الفرع المعتاد</span>
                  <Spacer />
                  <span>{sel.branch}</span>
                </div>
                <div className={styles.attribute}>
                  <span className={styles.attributeLabel}>الصنف المفضّل</span>
                  <Spacer />
                  <span>{sel.fav}</span>
                </div>
                <div className={styles.attribute}>
                  <span className={styles.attributeLabel}>ملاحظة تشغيلية</span>
                  <Spacer />
                  <span className={styles.attributeNote}>{sel.note}</span>
                </div>
              </div>
            </section>

            <Card className={styles.history}>
              <h2 className={styles.title}>سجل طلباته</h2>
              {sel.history.map((o) => (
                <div key={o.id} className={styles.historyRow}>
                  <span className={styles.numMuted}>{o.id}</span>
                  <span className={styles.historyItems}>{o.items}</span>
                  <span className={styles.small}>{o.branch}</span>
                  <span className={styles.numMuted}>{o.date}</span>
                  <span className={styles.num}>{o.total}</span>
                  <span className={styles.earned}>+{o.points} نقطة</span>
                  <span className={styles.historyStatus} style={{ color: toneColor(o.tone) }}>
                    {o.status}
                  </span>
                </div>
              ))}
              {sel.history.length === 0 && (
                <span className={styles.noHistory}>لا توجد طلبات مسجّلة لهذا العميل في الفترة المعروضة.</span>
              )}
            </Card>

            {sel.bookings.length > 0 && (
              <Card className={styles.bookings}>
                <h2 className={styles.title}>حجوزات البوكسات</h2>
                {sel.bookings.map((b) => (
                  <div key={b.key} className={styles.booking} style={{ '--tone': toneColor(b.tone) }}>
                    <div className={styles.bookingBody}>
                      <span className={styles.bookingBox}>{b.box}</span>
                      <span className={styles.small}>
                        {b.when} · {b.branch}
                      </span>
                    </div>
                    <span className={styles.bookingStatus}>{b.status}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
