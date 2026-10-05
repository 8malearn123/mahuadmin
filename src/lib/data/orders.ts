import type { LogEntry, LogStatus, Order, Tone } from '../types';
import { ALL } from './filters';

/** Kanban columns, in order. An order's `stage` indexes this list. */
export const KANBAN_STAGES = ['جديد / مدفوع', 'قيد التجهيز', 'جاهز للاستلام', 'تم التسليم'];
export const KANBAN_STAGE_TONES: Tone[] = ['bad', 'ok', 'ok', 'muted'];

export const BASE_ORDERS: Order[] = [
  { id: '#4821', type: 'فوري', items: 'لاتيه المانجو ×2 · كرواسون', customer: 'فهد ز.', time: '08:41', total: 58, stage: 0, branch: 'جازان' },
  { id: '#4822', type: 'فوري', items: 'V60 إثيوبي · كوكيز', customer: 'سارة م.', time: '08:44', total: 28, stage: 0, branch: 'جازان' },
  { id: '#4823', type: 'بوكس', items: 'بوكس ألوها هدية', customer: 'منال ع.', time: '08:46', total: 185, stage: 1, branch: 'أبو عريش' },
  { id: '#4824', type: 'فوري', items: 'كولادا القهوة ×3', customer: 'عبدالله ح.', time: '08:50', total: 72, stage: 1, branch: 'جازان' },
  { id: '#4825', type: 'فوري', items: 'آيس سبانش لاتيه', customer: 'ريم س.', time: '08:52', total: 20, stage: 2, branch: 'جازان' },
  { id: '#4826', type: 'فوري', items: 'ماتشا جوز الهند · تشيز كيك', customer: 'خالد ن.', time: '08:55', total: 45, stage: 2, branch: 'أبو عريش' },
  { id: '#4827', type: 'بوكس', items: 'بوكس تذوّق 4 أصناف', customer: 'نوف ط.', time: '08:58', total: 140, stage: 3, branch: 'جازان' },
  { id: '#4828', type: 'فوري', items: 'كورتادو ×2', customer: 'ماجد ع.', time: '09:01', total: 28, stage: 3, branch: 'جازان' },
];

export const LOG_STATUS_FILTERS = [ALL, 'قيد التجهيز', 'جاهز للاستلام', 'تم التسليم', 'ملغي', 'مسترجع'];
export const LOG_TYPE_FILTERS = [ALL, 'فوري', 'بوكس'];

export const LOG_STATUS_TONES: Record<LogStatus, Tone> = {
  'قيد التجهيز': 'ok',
  'جاهز للاستلام': 'ok',
  'تم التسليم': 'muted',
  'ملغي': 'bad',
  'مسترجع': 'refund',
};

function buildOrderLog(): LogEntry[] {
  const names = ['فهد الزهراني', 'سارة المالكي', 'منال عسيري', 'عبدالله حكمي', 'ريم سعيد', 'شركة رؤى للفعاليات', 'خالد نعمي', 'نوف طاهر', 'ماجد عسيري', 'ليان صالح'];
  const items = ['لاتيه المانجو الجازاني ×2', 'V60 تقطير · كوكيز', 'بوكس ألوها هدية', 'كولادا القهوة ×3', 'آيس سبانش لاتيه', 'ماتشا جوز الهند · تشيز كيك', 'بوكس تذوّق 4 أصناف', 'كورتادو ×2', 'شكشوكة جازانية · أمريكانو', 'فطور ماهو الكامل', 'معصوب المانجو · كولد برو', 'أفوكادو توست · لاتيه'];
  const pay = ['مدى', 'Apple Pay', 'STC Pay', 'نقاط بونات', 'كاش'];
  const rows: LogEntry[] = [];
  for (let i = 0; i < 26; i++) {
    const box = i % 7 === 2;
    rows.push({
      id: '#' + (4828 - i),
      customer: names[i % names.length],
      items: items[i % items.length],
      type: box ? 'بوكس' : 'فوري',
      branch: i % 3 === 1 ? 'أبو عريش' : 'جازان',
      total: box ? 140 + (i % 4) * 45 : 18 + (i % 9) * 7,
      pay: pay[i % pay.length],
      date: '10/09',
      time: String(7 + (i % 3)).padStart(2, '0') + ':' + String(10 + ((i * 7) % 49)).padStart(2, '0'),
      status: i < 6 ? 'قيد التجهيز' : i < 9 ? 'جاهز للاستلام' : i === 11 ? 'ملغي' : i === 14 ? 'مسترجع' : 'تم التسليم',
      points: box ? 175 : 20 + (i % 9) * 6,
    });
  }
  return rows;
}

/** Today's order history (26 orders), newest first. */
export const ORDER_LOG: LogEntry[] = buildOrderLog();
