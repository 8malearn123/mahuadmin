import type { RoleDef, RoleId, ViewId } from './types';

export const ALL_BRANCHES = 'الكل';

/** Branches that are open and can be assigned to staff accounts and customers. */
export const OPERATING_BRANCHES = ['جازان', 'أبو عريش'];

/** Order of the role preview list in the sidebar and of the role filter on the users screen. */
export const ROLE_IDS: RoleId[] = ['admin', 'management', 'branchManager', 'barista', 'customer'];

/** Roles that join by invitation from the system admin; customers sign up themselves. */
export const STAFF_ROLE_IDS: RoleId[] = ['admin', 'management', 'branchManager', 'barista'];

export const ROLES: Record<RoleId, RoleDef> = {
  admin: {
    name: 'مدير النظام',
    scope: 'كامل المنصة',
    tone: 'bad',
    views: ['overview', 'orders', 'log', 'menu', 'loyalty', 'inbound', 'customer', 'lookup', 'boxes', 'branches', 'users', 'roles'],
    branches: [ALL_BRANCHES, 'جازان', 'أبو عريش'],
    perBranch: false,
    editMenu: true,
    pii: 'full',
    note: 'صلاحية كاملة: كل الوحدات والمستخدمين والصلاحيات والسياسات وسجل التدقيق.',
    idleMinutes: 15,
    twoStep: 'required',
  },
  management: {
    name: 'الإدارة العامة',
    scope: 'كل الفروع',
    tone: 'ok',
    views: ['overview', 'orders', 'log', 'menu', 'loyalty', 'inbound', 'lookup', 'boxes', 'branches'],
    branches: [ALL_BRANCHES, 'جازان', 'أبو عريش'],
    perBranch: false,
    editMenu: true,
    pii: 'full',
    note: 'المنيو والبوكسات والعروض والتقارير والواردات — بدون إدارة الصلاحيات.',
    idleMinutes: 15,
    twoStep: 'optional',
  },
  branchManager: {
    name: 'مدير الفرع',
    scope: 'فرع جازان فقط',
    tone: 'ok',
    views: ['overview', 'orders', 'log', 'menu', 'lookup', 'boxes'],
    branches: ['جازان'],
    perBranch: true,
    editMenu: false,
    pii: 'partial',
    note: 'طلبات فرعه والتوفّر والعمليات اليومية — لا يضيف أصنافًا ولا يرى بيانات الفروع الأخرى.',
    idleMinutes: 15,
    twoStep: 'optional',
  },
  barista: {
    name: 'الباريستا / الكاشير',
    scope: 'فرع جازان فقط',
    tone: 'ok',
    views: ['orders', 'log', 'lookup', 'boxes'],
    branches: ['جازان'],
    perBranch: true,
    editMenu: false,
    pii: 'none',
    note: 'استقبال الطلبات وتحديث حالتها وطابور التجهيز فقط.',
    // Cashier devices are shared, so they lock sooner.
    idleMinutes: 10,
    twoStep: 'optional',
  },
  customer: {
    name: 'العميل',
    scope: 'حسابه فقط',
    tone: 'muted',
    views: ['customer'],
    branches: ['جازان'],
    perBranch: false,
    editMenu: false,
    pii: 'none',
    note: 'الطلب وحجز البوكسات ومتابعة الطلبات والنقاط — لا وصول لأي بيانات تشغيلية.',
    idleMinutes: null,
    twoStep: 'optional',
  },
};

/** Screens every signed-in account can open regardless of role. */
const PERSONAL_VIEWS: ViewId[] = ['account'];

export function canOpenView(role: RoleDef, view: ViewId): boolean {
  return PERSONAL_VIEWS.includes(view) || role.views.includes(view);
}

/** True when the role sees more than one branch (and therefore the "all" filter). */
export function isMultiBranch(role: RoleDef): boolean {
  return role.branches.length > 1;
}

/**
 * The role as it applies to one account: single-branch roles are narrowed to the
 * account's own branch (a barista in Abu Arish sees Abu Arish, not Jazan).
 */
export function scopeRole(role: RoleDef, branch: string | null): RoleDef {
  if (isMultiBranch(role) || !branch || branch === ALL_BRANCHES) return role;
  return { ...role, branches: [branch], scope: role.perBranch ? 'فرع ' + branch + ' فقط' : role.scope };
}

/** Whether a record belonging to `branch` is inside the role's data scope. */
export function inRoleScope(role: RoleDef, branch: string): boolean {
  return isMultiBranch(role) || branch === role.branches[0];
}

/** Whether a record belonging to `branch` passes the header branch filter. */
export function matchesBranch(selected: string, branch: string): boolean {
  return selected === ALL_BRANCHES || branch === selected;
}
