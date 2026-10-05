import type { Tone } from '../types';

/** The signed-in customer's own dashboard (the "العميل" role). */
export const PORTAL_CUSTOMER = {
  name: 'فهد الزهراني',
  initial: 'ف',
  phone: '+966 5•• ••0447',
  points: 342,
  toNext: 158,
  liveOrderId: '#4825',
};

export const PORTAL_STEPS: { n: string; label: string; time: string; done?: boolean; active?: boolean }[] = [
  { n: '1', label: 'تم استلام الطلب', time: '08:41', done: true },
  { n: '2', label: 'تم الدفع — مدى', time: '08:41', done: true },
  { n: '3', label: 'الباريستا يجهّز طلبك', time: '08:43', active: true },
  { n: '4', label: 'جاهز للاستلام', time: '—' },
  { n: '5', label: 'احتساب نقاط بونات', time: '—' },
];

export const PORTAL_ORDERS = [
  { id: '#4792', items: 'لاتيه المانجو ×2', branch: 'جازان', date: '08/09', total: 46, points: 46 },
  { id: '#4755', items: 'كولادا القهوة · كوكيز', branch: 'جازان', date: '06/09', total: 34, points: 34 },
  { id: '#4701', items: 'بوكس تذوّق 4 أصناف', branch: 'جازان', date: '02/09', total: 140, points: 175 },
  { id: '#4668', items: 'V60 تقطير', branch: 'أبو عريش', date: '29/08', total: 18, points: 18 },
  { id: '#4620', items: 'آيس سبانش لاتيه ×3', branch: 'جازان', date: '25/08', total: 60, points: 60 },
];

export const PORTAL_BOXES: { name: string; when: string; branch: string; price: number; state: string; stateTone: Tone }[] = [
  { name: 'بوكس ألوها هدية', when: 'الخميس 10:00 ص', branch: 'جازان', price: 185, state: 'مؤكد', stateTone: 'ok' },
  { name: 'بوكس مناسبات 12 قطعة', when: 'الأحد 06:00 م', branch: 'جازان', price: 320, state: 'بانتظار الدفع', stateTone: 'bad' },
];
