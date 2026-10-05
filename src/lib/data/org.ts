import type { BranchDraft, Tone } from '../types';

export interface BranchCard {
  name: string;
  tone: Tone;
  state: string;
  orders: number;
  sales: number;
  prep: string;
  team: { name: string; role: string }[];
  note: string;
}

export const BRANCH_CARDS: BranchCard[] = [
  {
    name: 'فرع جازان — الكورنيش',
    tone: 'ok',
    state: 'يعمل الآن',
    orders: 114,
    sales: 4600,
    prep: '4:05',
    team: [{ name: 'ريان', role: 'باريستا' }, { name: 'أسماء', role: 'كاشير' }, { name: 'نورة', role: 'مدير فرع' }],
    note: 'ساعات العمل 7 ص – 12 م · نافذة استلام مسبق · بيانات الفرع معزولة بسياسات RLS.',
  },
  {
    name: 'فرع أبو عريش',
    tone: 'bad',
    state: 'يعمل الآن',
    orders: 70,
    sales: 2820,
    prep: '4:48',
    team: [{ name: 'تركي', role: 'مشرف وردية' }, { name: 'لمى', role: 'باريستا' }],
    note: 'يحتاج باريستا إضافي للفترة المسائية · طاقة البوكسات 6 يوميًا.',
  },
];

export const BRANCH_CITIES = ['جازان', 'أبو عريش', 'صبيا', 'الدرب', 'أبها'];

export const EMPTY_BRANCH_DRAFT: BranchDraft = {
  name: '',
  city: 'جازان',
  address: '',
  hours: '7 ص – 12 م',
  manager: '',
  boxes: '6',
};

export const ROLE_SUMMARIES: { name: string; tone: Tone; scope: string; perms: string }[] = [
  { name: 'مدير النظام', tone: 'bad', scope: 'كامل المنصة', perms: 'كل الوحدات، الصلاحيات، السياسات، الفروع، سجل التدقيق.' },
  { name: 'الإدارة العامة', tone: 'ok', scope: 'كل الفروع', perms: 'المنيو، البوكسات، العروض، التقارير، الواردات.' },
  { name: 'مدير الفرع', tone: 'ok', scope: 'فرعه فقط', perms: 'طلبات فرعه، التوفّر، العمليات اليومية.' },
  { name: 'الباريستا / الكاشير', tone: 'ok', scope: 'فرعه فقط', perms: 'استقبال الطلبات وتحديث حالتها وطابور التجهيز، واستعلام محدود عن العميل (اسم ونقاط فقط).' },
  { name: 'العميل', tone: 'muted', scope: 'حسابه فقط', perms: 'الطلب، حجز البوكسات، متابعة الطلبات، النقاط.' },
];

export const AUDIT_LOG = [
  { time: '09:04', text: 'تحديث سعر «لاتيه المانجو الجازاني» إلى 23 ر.س', actor: 'الإدارة العامة' },
  { time: '08:58', text: 'إيقاف توفّر «كولد برو» في أبو عريش', actor: 'مدير الفرع' },
  { time: '08:47', text: 'قبول طلب فرنشايز للمراجعة المالية', actor: 'الإدارة العامة' },
  { time: '08:31', text: 'إضافة مستخدم باريستا جديد لفرع جازان', actor: 'مدير النظام' },
  { time: '08:12', text: 'تصدير تقرير مبيعات الأسبوع', actor: 'الإدارة العامة' },
  // The LRM marks keep the phone number's digits in order inside Arabic text.
  { time: '08:05', text: 'استعلام عن بيانات عميل ‎0544130447‎', actor: 'مدير الفرع' },
];

export const SECURITY_CONTROLS = [
  { title: 'عزل صفّي (RLS) على قاعدة البيانات', desc: 'الصلاحيات تُطبَّق في الطبقة الأدنى لا في الواجهة فقط.' },
  { title: 'استضافة داخل المملكة وتشفير كامل', desc: 'تشفير أثناء النقل والتخزين ونسخ احتياطية تلقائية.' },
  { title: 'امتثال PDPL وضوابط NCA', desc: 'سياسات احتفاظ بالبيانات ومراجعة دورية.' },
  { title: 'فوترة متوافقة مع ZATCA', desc: 'فواتير الطلبات تُصدر وفق المتطلبات الإلزامية.' },
];
