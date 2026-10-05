import { maskPhoneIntl } from '../format';
import type { Tier, Tone } from '../types';
import { ORDER_LOG } from './orders';
import { CUSTOMERS } from './people';

/** The sample customer the design shows on the customer dashboard (the "العميل" role). */
export const PORTAL_CUSTOMER = {
  name: 'فهد الزهراني',
  initial: 'ف',
  phone: '+966 5•• ••0447',
  points: 342,
  toNext: 158,
  liveOrderId: '#4825',
};

/** Phone number of the sample customer's account. */
export const SAMPLE_CUSTOMER_PHONE = '0544130447';

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

export interface Portal {
  name: string;
  phone: string;
  points: number;
  toNext: number;
  /** Progress to the next free drink, e.g. "68%". */
  pct: string;
  tier: Tier;
  /** Order being prepared now, with its tracker steps. */
  live: { id: string; state: string; steps: typeof PORTAL_STEPS } | null;
  orders: typeof PORTAL_ORDERS;
  boxes: typeof PORTAL_BOXES;
}

const FREE_DRINK = 500;

/**
 * What a customer's dashboard shows: the sample customer gets the design's data; a number
 * that already earned points at the cashier gets its points and order history; a new
 * account starts empty.
 */
export function portalFor(customer: { name: string; phone: string }): Portal {
  if (customer.phone === SAMPLE_CUSTOMER_PHONE) {
    return {
      name: customer.name,
      phone: PORTAL_CUSTOMER.phone,
      points: PORTAL_CUSTOMER.points,
      toNext: PORTAL_CUSTOMER.toNext,
      pct: '68%',
      tier: 'ماهالو',
      live: { id: PORTAL_CUSTOMER.liveOrderId, state: 'قيد التجهيز', steps: PORTAL_STEPS },
      orders: PORTAL_ORDERS,
      boxes: PORTAL_BOXES,
    };
  }
  const member = CUSTOMERS.find((c) => c.phone === customer.phone);
  const points = member?.points ?? 0;
  return {
    name: customer.name,
    phone: maskPhoneIntl(customer.phone),
    points,
    toNext: Math.max(0, FREE_DRINK - points),
    pct: Math.min(100, Math.round((points / FREE_DRINK) * 100)) + '%',
    tier: member?.tier ?? 'ألوها',
    live: null,
    orders: member
      ? ORDER_LOG.filter((r) => r.customer === member.name)
          .slice(0, 5)
          .map((r) => ({ id: r.id, items: r.items, branch: r.branch, date: r.date, total: r.total, points: r.points }))
      : [],
    boxes: [],
  };
}
