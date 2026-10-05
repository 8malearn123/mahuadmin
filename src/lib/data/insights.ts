import type { Period, Tone } from '../types';

export const PERIODS: Period[] = ['اليوم', 'أمس', '7 أيام', '30 يومًا'];

/** Multiplier applied to daily figures for each reporting period. */
export const PERIOD_FACTORS: Record<Period, number> = {
  'اليوم': 1,
  'أمس': 0.91,
  '7 أيام': 6.4,
  '30 يومًا': 27.5,
};

/** Each branch's share of the combined figures. Newly added branches have no data yet (0). */
export function branchScale(branch: string): number {
  if (branch === 'الكل') return 1;
  if (branch === 'جازان') return 0.62;
  if (branch === 'أبو عريش') return 0.38;
  return 0;
}

/** Orders per time slot today (combined branches); the chart's full height is HOURLY_MAX. */
export const HOURLY_ORDERS = [6, 11, 19, 26, 22, 14, 9, 12, 21, 34, 41, 29];
export const HOURLY_MAX = 44;

export interface BranchPerformance {
  city: string;
  name: string;
  sales: number;
  orders: number;
  avg: number;
  prep: string;
  pct: string;
  tone: Tone;
}

export const BRANCH_PERFORMANCE: BranchPerformance[] = [
  { city: 'جازان', name: 'فرع جازان — الكورنيش', sales: 4600, orders: 114, avg: 40, prep: '4:05', pct: '78%', tone: 'ok' },
  { city: 'أبو عريش', name: 'فرع أبو عريش', sales: 2820, orders: 70, avg: 40, prep: '4:48', pct: '48%', tone: 'bad' },
];

export const TOP_ITEMS = [
  { name: 'لاتيه المانجو الجازاني', qty: 38, sales: 874 },
  { name: 'آيس سبانش لاتيه', qty: 31, sales: 620 },
  { name: 'كولادا القهوة', qty: 24, sales: 576 },
  { name: 'تشيز كيك المانجو', qty: 19, sales: 456 },
  { name: 'V60 تقطير', qty: 16, sales: 288 },
];

export const ORDER_CHANNELS: { name: string; pct: string; tone: Tone }[] = [
  { name: 'الموقع — طلب فوري', pct: '54%', tone: 'ok' },
  { name: 'حجز بوكسات مجدول', pct: '18%', tone: 'ok' },
  { name: 'الكاشير في الفرع', pct: '21%', tone: 'bad' },
  { name: 'رابط واتساب', pct: '7%', tone: 'ok' },
];

export const OPERATIONAL_ALERTS: { text: string; meta: string; tone: Tone }[] = [
  { text: 'حبوب إثيوبيا يرقاتشيف تكفي ليومين في فرع جازان', meta: 'المخزون · قبل 12 دقيقة', tone: 'bad' },
  { text: 'زمن التحضير في أبو عريش تجاوز 5 دقائق للطلب الثالث', meta: 'التشغيل · قبل 24 دقيقة', tone: 'bad' },
  { text: '4 حجوزات بوكسات تسليمها غدًا 10 ص', meta: 'البوكسات · اليوم', tone: 'ok' },
  { text: 'رصيد قوالب واتساب المعتمدة 86%', meta: 'الإشعارات · اليوم', tone: 'ok' },
];

export const NOTIFICATIONS: { kind: string; kindTone: Tone; text: string; phone: string; time: string; status: string; statusTone: Tone }[] = [
  { kind: 'OTP', kindTone: 'ok', text: 'رمز تحقق عند إضافة الرقم', phone: '+9665•••0447', time: '09:02', status: 'تم التحقق', statusTone: 'ok' },
  { kind: 'حالة', kindTone: 'ok', text: 'طلبك #4825 قيد التجهيز', phone: '+9665•••1188', time: '08:54', status: 'وصلت', statusTone: 'ok' },
  { kind: 'حالة', kindTone: 'ok', text: 'طلبك #4827 جاهز للاستلام', phone: '+9665•••2091', time: '08:50', status: 'وصلت', statusTone: 'ok' },
  { kind: 'بوكس', kindTone: 'bad', text: 'تذكير: تسليم بوكس ألوها غدًا 10 ص', phone: '+9665•••7734', time: '08:30', status: 'مجدولة', statusTone: 'bad' },
  { kind: 'نقاط', kindTone: 'ok', text: 'أُضيفت 58 نقطة إلى رصيدك', phone: '+9665•••0447', time: '08:22', status: 'وصلت', statusTone: 'ok' },
  { kind: 'OTP', kindTone: 'ok', text: 'رمز تحقق عند إضافة الرقم', phone: '+9665•••4402', time: '08:15', status: 'انتهت الصلاحية', statusTone: 'bad' },
];

export const LOYALTY_TIERS: { name: string; tone: Tone; members: number; rule: string; pct: string }[] = [
  { name: 'ألوها', tone: 'ok', members: 1480, rule: 'نقطة لكل ريال · مشروب مجاني عند 500 نقطة', pct: '63%' },
  { name: 'كاهونا', tone: 'ok', members: 690, rule: '1.25 نقطة لكل ريال · أولوية حجز البوكسات', pct: '29%' },
  { name: 'ماهالو', tone: 'bad', members: 170, rule: '1.5 نقطة لكل ريال · تذوّق شهري مجاني', pct: '8%' },
];
