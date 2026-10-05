import type { Customer, JobApplication, StaffMember, Tone } from '../types';

export const CUSTOMERS: Customer[] = [
  { name: 'فهد الزهراني', phone: '0544130447', tier: 'ماهالو', points: 342, orders: 38, spend: 1520, branch: 'جازان', last: '09/08', fav: 'لاتيه المانجو الجازاني', note: 'يفضّل الاستلام من النافذة' },
  { name: 'سارة المالكي', phone: '0551122088', tier: 'كاهونا', points: 210, orders: 24, spend: 890, branch: 'جازان', last: '08/09', fav: 'V60 تقطير', note: 'حساسية من الحليب البقري' },
  { name: 'منال عسيري', phone: '0533072091', tier: 'كاهونا', points: 178, orders: 19, spend: 1340, branch: 'أبو عريش', last: '07/09', fav: 'بوكس ألوها هدية', note: 'طلبات بوكسات متكررة للمناسبات' },
  { name: 'عبدالله حكمي', phone: '0567734512', tier: 'ألوها', points: 96, orders: 11, spend: 420, branch: 'جازان', last: '06/09', fav: 'كولادا القهوة', note: '—' },
  { name: 'ريم سعيد', phone: '0509914402', tier: 'ألوها', points: 64, orders: 8, spend: 300, branch: 'جازان', last: '05/09', fav: 'آيس سبانش لاتيه', note: '—' },
  { name: 'شركة رؤى للفعاليات', phone: '0172317000', tier: 'ماهالو', points: 980, orders: 42, spend: 12400, branch: 'أبو عريش', last: '04/09', fav: 'بوكس مناسبات 24 قطعة', note: 'حساب شركات — فاتورة ضريبية باسم المنشأة' },
];

export const STAFF: StaffMember[] = [
  { name: 'تركي مدخلي', role: 'مدير الفرع', assigned: 'فرع جازان — الكورنيش' },
  { name: 'خالد الحازمي', role: 'الإدارة العامة', assigned: 'كل الفروع' },
  { name: 'نورة الفيفي', role: 'مدير النظام', assigned: 'كامل المنصة' },
  { name: 'ريان الحكمي', role: 'الباريستا / الكاشير', assigned: 'فرع جازان — الكورنيش' },
  { name: 'سلطان القحطاني', role: 'مدير الفرع', assigned: null },
  { name: 'منى عطيف', role: 'مدير الفرع', assigned: null },
  { name: 'بدر الشهري', role: 'الباريستا / الكاشير', assigned: null },
];

export interface ManagerOption {
  name: string;
  label: string;
  /** Hint shown under the select once the manager is chosen. */
  sub: string;
}

/** Staff who can be assigned to run a new branch. */
export const MANAGER_POOL: ManagerOption[] = STAFF
  .filter((s) => s.role === 'مدير الفرع' || s.role === 'الإدارة العامة')
  .map((s) => ({
    name: s.name,
    label: s.name + ' — ' + s.role + (s.assigned ? ' (مُسند)' : ' (متاح)'),
    sub: s.assigned ? 'مُسند حاليًا: ' + s.assigned + ' — سيُدار فرعان' : 'متاح للإسناد — ' + s.role,
  }));

export const JOB_APPLICATIONS: JobApplication[] = [
  { name: 'ريان الحكمي', role: 'باريستا', meta: 'خبرة سنتان · متاح فورًا · جازان' },
  { name: 'أسماء فقيه', role: 'كاشير', meta: 'دوام جزئي · مسائي · جازان' },
  { name: 'تركي مدخلي', role: 'مشرف وردية', meta: 'خبرة 4 سنوات · أبو عريش' },
  { name: 'لمى عسيري', role: 'باريستا', meta: 'شهادة SCA أساسيات · جازان' },
];

export interface FranchiseLead {
  name: string;
  city: string;
  meta: string;
  budget: number;
  score: string;
  tone: Tone;
}

export const FRANCHISE_LEADS: FranchiseLead[] = [
  { name: 'مجموعة الساحل التجارية', city: 'صبيا', meta: 'موقع مقترح جاهز · سجل تجاري', budget: 450000, score: '86%', tone: 'ok' },
  { name: 'عبدالرحمن الفيفي', city: 'أبها', meta: 'مستثمر فردي · بحث عن موقع', budget: 300000, score: '58%', tone: 'bad' },
  { name: 'شركة نُزل الجنوب', city: 'جازان — المطار', meta: 'مساحة داخل صالة المغادرة', budget: 620000, score: '74%', tone: 'ok' },
  { name: 'مؤسسة درب البن', city: 'الدرب', meta: 'خبرة تشغيل مقاهي', budget: 260000, score: '41%', tone: 'bad' },
];
