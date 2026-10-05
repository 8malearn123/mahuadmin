import type { RoleDef, RoleId } from './types';

export const ALL_BRANCHES = 'الكل';

/** Order of the role switcher in the sidebar. */
export const ROLE_IDS: RoleId[] = ['admin', 'management', 'branchManager', 'barista', 'customer'];

export const DEFAULT_ROLE: RoleId = 'admin';

export const ROLES: Record<RoleId, RoleDef> = {
  admin: {
    name: 'مدير النظام',
    user: 'نورة الفيفي',
    scope: 'كامل المنصة',
    tone: 'bad',
    views: ['overview', 'orders', 'log', 'menu', 'loyalty', 'inbound', 'customer', 'lookup', 'boxes', 'branches', 'roles'],
    branches: [ALL_BRANCHES, 'جازان', 'أبو عريش'],
    editMenu: true,
    pii: 'full',
    note: 'صلاحية كاملة: كل الوحدات والصلاحيات والسياسات وسجل التدقيق.',
  },
  management: {
    name: 'الإدارة العامة',
    user: 'خالد الحازمي',
    scope: 'كل الفروع',
    tone: 'ok',
    views: ['overview', 'orders', 'log', 'menu', 'loyalty', 'inbound', 'lookup', 'boxes', 'branches'],
    branches: [ALL_BRANCHES, 'جازان', 'أبو عريش'],
    editMenu: true,
    pii: 'full',
    note: 'المنيو والبوكسات والعروض والتقارير والواردات — بدون إدارة الصلاحيات.',
  },
  branchManager: {
    name: 'مدير الفرع',
    user: 'تركي مدخلي',
    scope: 'فرع جازان فقط',
    tone: 'ok',
    views: ['overview', 'orders', 'log', 'menu', 'lookup', 'boxes'],
    branches: ['جازان'],
    editMenu: false,
    pii: 'partial',
    note: 'طلبات فرعه والتوفّر والعمليات اليومية — لا يضيف أصنافًا ولا يرى بيانات الفروع الأخرى.',
  },
  barista: {
    name: 'الباريستا / الكاشير',
    user: 'ريان الحكمي',
    scope: 'فرع جازان فقط',
    tone: 'ok',
    views: ['orders', 'log', 'lookup', 'boxes'],
    branches: ['جازان'],
    editMenu: false,
    pii: 'none',
    note: 'استقبال الطلبات وتحديث حالتها وطابور التجهيز فقط.',
  },
  customer: {
    name: 'العميل',
    user: 'فهد الزهراني',
    scope: 'حسابه فقط',
    tone: 'muted',
    views: ['customer'],
    branches: ['جازان'],
    editMenu: false,
    pii: 'none',
    note: 'الطلب وحجز البوكسات ومتابعة الطلبات والنقاط — لا وصول لأي بيانات تشغيلية.',
  },
};

/** True when the role sees more than one branch (and therefore the "all" filter). */
export function isMultiBranch(role: RoleDef): boolean {
  return role.branches.length > 1;
}

/** Whether a record belonging to `branch` is inside the role's data scope. */
export function inRoleScope(role: RoleDef, branch: string): boolean {
  return isMultiBranch(role) || branch === role.branches[0];
}

/** Whether a record belonging to `branch` passes the header branch filter. */
export function matchesBranch(selected: string, branch: string): boolean {
  return selected === ALL_BRANCHES || branch === selected;
}
