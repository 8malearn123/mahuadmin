'use client';

import { useState } from 'react';
import { EMPTY_BOOKING_DRAFT } from '@/lib/data/boxes';
import { useDashboard, useUiState } from '@/lib/store/DashboardProvider';
import { boxImageKey } from '@/lib/store/reducer';
import { toneColor } from '@/lib/tones';
import { Bar } from '@/ui/Bar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ImageSlot } from '@/ui/ImageSlot';
import { Spacer } from '@/ui/Spacer';
import { StatCard } from '@/ui/StatCard';
import { Toggle } from '@/ui/Toggle';
import { BookingModal } from './BookingModal';
import { selectBoxes } from './select';
import styles from './boxes.module.css';

export function BoxesScreen() {
  const { state, dispatch } = useDashboard();
  const [selectedDay, setSelectedDay] = useUiState('boxes.day', 0);
  const [draft, setDraft] = useUiState('boxes.draft', EMPTY_BOOKING_DRAFT);
  const [bookingOpen, setBookingOpen] = useState(false);
  const v = selectBoxes(state, selectedDay);

  function saveBooking() {
    dispatch({ type: 'addBooking', draft });
    setBookingOpen(false);
    setSelectedDay(Number(draft.day));
    setDraft({ ...draft, customer: '', phone: '', note: '' });
  }

  return (
    <div className={styles.screen}>
      <div className={styles.kpis}>
        {v.kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} note={k.note} valueColor={toneColor(k.tone)} />
        ))}
      </div>

      <Card pad="none" className={styles.week}>
        <div className={styles.weekHead}>
          <h2 className={styles.title}>تقويم التسليم — سبعة أيام</h2>
          <span className={styles.meta}>الحجز يُغلق قبل 24 ساعة</span>
          <Spacer />
          <Button variant="accent" onClick={() => setBookingOpen(true)}>
            + حجز جديد
          </Button>
        </div>
        <div className={styles.days}>
          {v.weekDays.map((d) => (
            <button
              key={d.key}
              type="button"
              className={styles.day}
              aria-pressed={d.key === selectedDay}
              style={{ '--tone': toneColor(d.tone) }}
              onClick={() => setSelectedDay(d.key)}
            >
              <div className={styles.dayHead}>
                <span className={styles.dayLabel}>{d.label}</span>
                <span className={styles.dayDate}>{d.date}</span>
              </div>
              <span className={styles.dayCount}>{d.count}</span>
              <Bar value={d.pct} color="var(--tone)" height={5} track="paper" roundFill={false} />
              <span className={styles.dayCap}>{d.capText}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className={styles.columns}>
        <Card className={styles.schedule}>
          <div className={styles.scheduleHead}>
            <div className={styles.scheduleTitle}>
              <h2 className={styles.title}>{v.day.title}</h2>
              <span className={styles.scheduleDate}>{v.day.date}</span>
              <Spacer />
              <span className={styles.meta} style={{ color: toneColor(v.day.tone) }}>
                {v.day.cap}
              </span>
            </div>
            <Bar value={v.day.pct} color={toneColor(v.day.tone)} height={5} roundFill={false} />
          </div>
          {v.day.windows.map((w) => (
            <div key={w.window} className={styles.window}>
              <div className={styles.windowHead}>
                <span className={styles.windowName}>{w.window}</span>
                <span className={styles.rule} />
              </div>
              {w.items.map((b) => (
                <div key={b.id} className={styles.booking} style={{ '--tone': toneColor(b.tone) }}>
                  <div className={styles.bookingHead}>
                    <span className={styles.bookingTime}>{b.time}</span>
                    <span className={styles.bookingBox}>{b.box}</span>
                    <span className={styles.qty}>{b.qty}</span>
                    <Spacer />
                    <span className={styles.bookingTotal}>{b.total}</span>
                  </div>
                  <div className={styles.bookingMeta}>
                    <span>{b.customer}</span>
                    <span className={styles.phone}>{b.phone}</span>
                    <span>{b.branch}</span>
                    <span className={styles.bookingId}>{b.id}</span>
                  </div>
                  <span className={styles.note}>ملاحظة: {b.note}</span>
                  <div className={styles.bookingFoot}>
                    <span className={styles.status}>{b.status}</span>
                    <span className={styles.pay} style={{ color: toneColor(b.payTone) }}>
                      · {b.pay}
                    </span>
                    <Spacer />
                    {b.next && (
                      <button
                        type="button"
                        className={styles.advance}
                        onClick={() => dispatch({ type: 'setBookingStatus', id: b.id, status: b.next!.status, markPaid: b.next!.markPaid })}
                      >
                        {b.next.label}
                      </button>
                    )}
                    {b.canCancel && (
                      <button type="button" className={styles.cancel} onClick={() => dispatch({ type: 'setBookingStatus', id: b.id, status: 'ملغي' })}>
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {w.items.length === 0 && <span className={styles.windowEmpty}>لا حجوزات في هذه الفترة</span>}
            </div>
          ))}
          {v.day.empty && <div className={styles.dayEmpty}>يوم خالٍ — الطاقة كاملة متاحة للحجز</div>}
        </Card>

        <Card className={styles.catalog}>
          <h2 className={styles.title}>تشكيلات البوكسات</h2>
          {v.catalog.map((c) => (
            <div key={c.name} className={styles.catalogRow}>
              <div className={styles.catalogImage}>
                <ImageSlot slotKey={boxImageKey(c.name)} placeholder="صورة" />
              </div>
              <div className={styles.catalogBody}>
                <span className={styles.catalogName}>{c.name}</span>
                <span className={styles.catalogContents}>{c.contents}</span>
                <div className={styles.catalogMeta}>
                  <span>{c.lead}</span>
                  <span>{c.booked}</span>
                </div>
                <div className={styles.catalogFoot}>
                  <span className={styles.catalogPrice}>{c.price}</span>
                  <Spacer />
                  <Toggle on={c.on} label={c.on ? 'متاح' : 'موقوف'} onToggle={() => dispatch({ type: 'toggleBoxOff', name: c.name })} />
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {bookingOpen && (
        <BookingModal
          draft={draft}
          onChange={setDraft}
          branches={v.bookingBranches}
          onSave={saveBooking}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
