import type { ViewId } from './types';

export interface ViewDef {
  href: string;
  /** Sidebar label. */
  label: string;
  /** Header title and page <title>. */
  title: string;
  subtitle: string;
  /** Whether the header shows the period tabs. */
  showPeriod?: boolean;
}

export const VIEWS: Record<ViewId, ViewDef> = {
  overview: {
    href: '/overview',
    label: 'النظرة العامة',
    title: 'لوحة الإدارة التنفيذية',
    subtitle: 'نظرة موحّدة على الطلبات والمبيعات والأداء لكل فرع',
    showPeriod: true,
  },
  orders: {
    href: '/orders',
    label: 'خط الطلبات',
    title: 'خط الطلبات الموحّد',
    subtitle: 'طلب فوري وحجز بوكسات في صفحة واحدة مع متابعة لحظية',
  },
  boxes: {
    href: '/boxes',
    label: 'حجز البوكسات',
    title: 'حجز البوكسات المجدول',
    subtitle: 'بوكسات مجهّزة تُطلب قبل 24 ساعة مع موعد تسليم',
  },
  log: {
    href: '/log',
    label: 'سجل الطلبات',
    title: 'سجل الطلبات',
    subtitle: 'كل الطلبات مع الحالة وطريقة الدفع والنقاط',
  },
  lookup: {
    href: '/lookup',
    label: 'الاستعلام عن عميل',
    title: 'الاستعلام عن عميل',
    subtitle: 'بحث بالرقم أو الاسم — النتائج محكومة بصلاحية الدور',
  },
  loyalty: {
    href: '/loyalty',
    label: 'الولاء والإشعارات',
    title: 'الولاء والإشعارات',
    subtitle: 'تحقق واتساب (OTP) وتكامل نقاط بونات',
    showPeriod: true,
  },
  customer: {
    href: '/customer',
    label: 'لوحة العميل',
    title: 'لوحة العميل',
    subtitle: 'طلباتي وبياناتي والرقم الموثّق',
  },
  menu: {
    href: '/menu',
    label: 'المنيو والإضافات',
    title: 'المنيو والتصنيفات والإضافات',
    subtitle: 'أضف منتجات وإضافات وأصناف إفطار، وتحكّم في الأسعار والتوفّر',
  },
  inbound: {
    href: '/inbound',
    label: 'الواردات',
    title: 'الواردات',
    subtitle: 'استقبال طلبات التوظيف والفرنشايز ومراجعتها',
  },
  branches: {
    href: '/branches',
    label: 'الفروع',
    title: 'إدارة الفروع',
    subtitle: 'فرعا جازان وأبو عريش مع عزل بيانات كل فرع',
  },
  roles: {
    href: '/roles',
    label: 'الصلاحيات',
    title: 'الصلاحيات (RBAC)',
    subtitle: 'كل دور يرى ما يخصّه فقط — عزل على مستوى قاعدة البيانات',
  },
};

/** Shown above the groups when the role can see it. */
export const PINNED_VIEW: ViewId = 'overview';

export const NAV_GROUPS: { title: string; views: ViewId[] }[] = [
  { title: 'التشغيل اليومي', views: ['orders', 'boxes', 'log'] },
  { title: 'العملاء', views: ['lookup', 'loyalty', 'customer'] },
  { title: 'المقهى', views: ['menu', 'inbound'] },
  { title: 'الإدارة', views: ['branches', 'roles'] },
];

const VIEW_BY_HREF = new Map(
  (Object.entries(VIEWS) as [ViewId, ViewDef][]).map(([id, def]) => [def.href, id]),
);

export function viewFromPathname(pathname: string): ViewId | null {
  const first = '/' + (pathname.split('/')[1] ?? '');
  return VIEW_BY_HREF.get(first) ?? null;
}
