import type {
  Booking,
  BookingDraft,
  BookingStatus,
  BoxCatalogItem,
  BoxDay,
  DeliveryWindow,
  PayStatus,
  ScheduledDay,
  Tone,
} from '../types';

export const BOOKING_STATUS_TONES: Record<BookingStatus, Tone> = {
  'بانتظار الدفع': 'bad',
  'مؤكد': 'ok',
  'قيد التجهيز': 'ok',
  'جاهز للتسليم': 'ok',
  'تم التسليم': 'muted',
  'ملغي': 'bad',
};

/** The next status in the fulfilment chain and the button label that advances to it. */
export const BOOKING_NEXT: Partial<Record<BookingStatus, { status: BookingStatus; label: string }>> = {
  'بانتظار الدفع': { status: 'مؤكد', label: 'تأكيد الدفع' },
  'مؤكد': { status: 'قيد التجهيز', label: 'بدء التجهيز' },
  'قيد التجهيز': { status: 'جاهز للتسليم', label: 'وسم كجاهز' },
  'جاهز للتسليم': { status: 'تم التسليم', label: 'تأكيد التسليم' },
};

export const BOX_DAYS: BoxDay[] = [
  { key: 0, day: 'اليوم', dow: 'الثلاثاء', date: '10/09', cap: 24 },
  { key: 1, day: 'غدًا', dow: 'الأربعاء', date: '11/09', cap: 24 },
  { key: 2, day: 'الخميس', dow: 'الخميس', date: '12/09', cap: 24 },
  { key: 3, day: 'الجمعة', dow: 'الجمعة', date: '13/09', cap: 18 },
  { key: 4, day: 'السبت', dow: 'السبت', date: '14/09', cap: 24 },
  { key: 5, day: 'الأحد', dow: 'الأحد', date: '15/09', cap: 24 },
  { key: 6, day: 'الاثنين', dow: 'الاثنين', date: '16/09', cap: 24 },
];

export const BASE_BOOKINGS: Booking[] = [
  { id: 'B-2141', day: 0, time: '02:30 م', window: 'ظهرًا', box: 'بوكس ألوها هدية', qty: 1, customer: 'سعود قحطاني', phone: '0509914402', branch: 'جازان', status: 'جاهز للتسليم', pay: 'مدفوع', note: 'بطاقة إهداء باسم «أم سعود»' },
  { id: 'B-2142', day: 0, time: '06:00 م', window: 'مساءً', box: 'بوكس تذوّق 4 أصناف', qty: 2, customer: 'ليان صالح', phone: '0551122088', branch: 'جازان', status: 'قيد التجهيز', pay: 'مدفوع', note: '—' },
  { id: 'B-2143', day: 0, time: '08:15 م', window: 'مساءً', box: 'بوكس قهوة الاختصاص', qty: 1, customer: 'ماجد عسيري', phone: '0567734512', branch: 'أبو عريش', status: 'بانتظار الدفع', pay: 'غير مدفوع', note: 'طلب فاتورة ضريبية' },
  { id: 'B-2144', day: 1, time: '10:00 ص', window: 'صباحًا', box: 'بوكس ألوها هدية', qty: 3, customer: 'منال عسيري', phone: '0533072091', branch: 'جازان', status: 'مؤكد', pay: 'مدفوع', note: 'تسليم لبوابة المجمع' },
  { id: 'B-2145', day: 1, time: '12:30 م', window: 'ظهرًا', box: 'بوكس تذوّق 4 أصناف', qty: 2, customer: 'نوف طاهر', phone: '0544130447', branch: 'جازان', status: 'مؤكد', pay: 'مدفوع', note: '—' },
  { id: 'B-2146', day: 1, time: '05:00 م', window: 'مساءً', box: 'بوكس مناسبات 12 قطعة', qty: 4, customer: 'شركة رؤى للفعاليات', phone: '0172317000', branch: 'أبو عريش', status: 'بانتظار الدفع', pay: 'غير مدفوع', note: 'حساب شركات — تحويل بنكي' },
  { id: 'B-2147', day: 2, time: '09:30 ص', window: 'صباحًا', box: 'بوكس ألوها هدية', qty: 3, customer: 'أحمد مدخلي', phone: '0505550001', branch: 'جازان', status: 'مؤكد', pay: 'مدفوع', note: '—' },
  { id: 'B-2148', day: 2, time: '01:00 م', window: 'ظهرًا', box: 'بوكس قهوة الاختصاص', qty: 2, customer: 'ليان صالح', phone: '0551122088', branch: 'جازان', status: 'مؤكد', pay: 'مدفوع', note: 'تحميص فاتح' },
  { id: 'B-2149', day: 2, time: '06:15 م', window: 'مساءً', box: 'بوكس مناسبات 24 قطعة', qty: 1, customer: 'مجلس جازان', phone: '0172317111', branch: 'جازان', status: 'مؤكد', pay: 'مدفوع', note: 'شعار الجهة على الغلاف' },
  { id: 'B-2150', day: 2, time: '08:00 م', window: 'مساءً', box: 'بوكس تذوّق 4 أصناف', qty: 2, customer: 'ريم حكمي', phone: '0509914402', branch: 'أبو عريش', status: 'بانتظار الدفع', pay: 'غير مدفوع', note: '—' },
  { id: 'B-2151', day: 3, time: '05:30 م', window: 'مساءً', box: 'بوكس ألوها هدية', qty: 1, customer: 'سعود قحطاني', phone: '0509914402', branch: 'جازان', status: 'مؤكد', pay: 'مدفوع', note: '—' },
  { id: 'B-2152', day: 5, time: '11:00 ص', window: 'صباحًا', box: 'بوكس مناسبات 12 قطعة', qty: 2, customer: 'مؤسسة درب البن', phone: '0172317222', branch: 'جازان', status: 'بانتظار الدفع', pay: 'غير مدفوع', note: 'تأكيد الكمية قبل التجهيز' },
];

export const BOX_CATALOG: BoxCatalogItem[] = [
  { name: 'بوكس ألوها هدية', contents: '4 مشروبات باردة + حلى + بطاقة إهداء', price: 185, lead: 24 },
  { name: 'بوكس تذوّق 4 أصناف', contents: 'أربعة محاصيل مختصة 100 جم', price: 140, lead: 24 },
  { name: 'بوكس مناسبات 12 قطعة', contents: 'حلويات الجزيرة + قهوة سفري', price: 320, lead: 48 },
  { name: 'بوكس مناسبات 24 قطعة', contents: 'ضعف الكمية + تغليف فاخر', price: 560, lead: 48 },
  { name: 'بوكس قهوة الاختصاص', contents: 'كيس 250 جم + أدوات تحضير', price: 210, lead: 24 },
];

/**
 * Published delivery schedule. The customer lookup reads bookings from here,
 * not from the live booking state (same as the original design).
 */
export const BOX_SCHEDULE: ScheduledDay[] = [
  { day: 'اليوم — الثلاثاء', slots: [
    { time: '02:30 م', box: 'بوكس ألوها هدية', qty: 1, customer: 'سعود قحطاني', branch: 'جازان', status: 'جاهز للتسليم' },
    { time: '06:00 م', box: 'بوكس تذوّق 4 أصناف', qty: 2, customer: 'ليان صالح', branch: 'جازان', status: 'مؤكد' },
    { time: '08:15 م', box: 'بوكس قهوة الاختصاص', qty: 1, customer: 'ماجد عسيري', branch: 'أبو عريش', status: 'بانتظار الدفع' },
  ] },
  { day: 'غدًا — الأربعاء', slots: [
    { time: '10:00 ص', box: 'بوكس ألوها هدية', qty: 3, customer: 'منال عسيري', branch: 'جازان', status: 'مؤكد' },
    { time: '12:30 م', box: 'بوكس تذوّق 4 أصناف', qty: 2, customer: 'نوف طاهر', branch: 'جازان', status: 'مؤكد' },
    { time: '05:00 م', box: 'بوكس مناسبات 12 قطعة', qty: 4, customer: 'شركة رؤى للفعاليات', branch: 'أبو عريش', status: 'بانتظار الدفع' },
  ] },
  { day: 'الخميس', slots: [
    { time: '09:30 ص', box: 'بوكس ألوها هدية', qty: 3, customer: 'أحمد مدخلي', branch: 'جازان', status: 'مؤكد' },
    { time: '01:00 م', box: 'بوكس قهوة الاختصاص', qty: 2, customer: 'ليان صالح', branch: 'جازان', status: 'مؤكد' },
    { time: '06:15 م', box: 'بوكس مناسبات 24 قطعة', qty: 1, customer: 'مجلس جازان', branch: 'جازان', status: 'مؤكد' },
    { time: '08:00 م', box: 'بوكس تذوّق 4 أصناف', qty: 2, customer: 'ريم حكمي', branch: 'أبو عريش', status: 'بانتظار الدفع' },
  ] },
  { day: 'الجمعة', slots: [
    { time: '05:30 م', box: 'بوكس ألوها هدية', qty: 1, customer: 'سعود قحطاني', branch: 'جازان', status: 'مؤكد' },
  ] },
  { day: 'السبت', slots: [] },
];

export const DELIVERY_WINDOWS: DeliveryWindow[] = ['صباحًا', 'ظهرًا', 'مساءً'];

export const BOOKING_TIMES = ['09:30 ص', '10:00 ص', '11:00 ص', '12:30 م', '02:30 م', '05:00 م', '06:15 م', '08:00 م'];

export const PAY_OPTIONS: PayStatus[] = ['غير مدفوع', 'مدفوع'];

export const EMPTY_BOOKING_DRAFT: BookingDraft = {
  customer: '',
  phone: '',
  box: 'بوكس ألوها هدية',
  qty: '1',
  day: '1',
  time: '10:00 ص',
  branch: 'جازان',
  pay: 'غير مدفوع',
  note: '',
};

/** Morning for ص times; noon for 12–3 م; evening otherwise. */
export function deliveryWindow(time: string): DeliveryWindow {
  const hour = parseInt(time, 10);
  if (!time.includes('م')) return 'صباحًا';
  return hour === 12 || hour < 4 ? 'ظهرًا' : 'مساءً';
}

/** Turns the booking form into a booking; `index` is the number of bookings added so far. */
export function bookingFromDraft(draft: BookingDraft, index: number): Booking {
  return {
    id: 'B-' + (2200 + index),
    day: Number(draft.day),
    time: draft.time,
    window: deliveryWindow(draft.time),
    box: draft.box,
    qty: Number(draft.qty) || 1,
    customer: draft.customer.trim(),
    phone: draft.phone.trim(),
    branch: draft.branch,
    status: draft.pay === 'مدفوع' ? 'مؤكد' : 'بانتظار الدفع',
    pay: draft.pay,
    note: draft.note.trim() || '—',
  };
}
