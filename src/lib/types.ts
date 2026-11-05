// Domain types for the Mahu operations dashboard.
// Arabic literals are the display values used throughout the UI.

export type RoleId = 'admin' | 'management' | 'branchManager' | 'barista' | 'customer';

export type ViewId =
  | 'overview'
  | 'orders'
  | 'boxes'
  | 'log'
  | 'lookup'
  | 'loyalty'
  | 'customer'
  | 'menu'
  | 'inbound'
  | 'branches'
  | 'users'
  | 'roles'
  | 'account';

export type Period = 'اليوم' | 'أمس' | '7 أيام' | '30 يومًا';

/** How much customer data a role may see in lookups. */
export type PiiLevel = 'full' | 'partial' | 'none';

/** Semantic colour of a status, chip, or bar; mapped to tokens in lib/tones.ts. */
export type Tone = 'ok' | 'bad' | 'muted' | 'ink' | 'brand' | 'refund';

export interface RoleDef {
  name: string;
  scope: string;
  tone: Tone;
  /** Screens the role can open; the first one is its landing screen. */
  views: ViewId[];
  /**
   * Branch filter options; the first one is selected when switching to the role.
   * Single-branch roles show the signed-in user's own branch instead (see scopeRole).
   */
  branches: string[];
  /** Staff role limited to the branch the account is assigned to ("فرع جازان فقط"). */
  perBranch: boolean;
  editMenu: boolean;
  pii: PiiLevel;
  note: string;
  /** Minutes without activity before the session locks; null = never (personal devices). */
  idleMinutes: number | null;
  /** Whether sign-in asks for a WhatsApp code after the password. */
  twoStep: 'required' | 'optional';
}

export type OrderType = 'فوري' | 'بوكس';

/** A live order on the kanban board. `stage` indexes KANBAN_STAGES. */
export interface Order {
  id: string;
  type: OrderType;
  items: string;
  customer: string;
  time: string;
  total: number;
  stage: number;
  branch: string;
}

export type LogStatus = 'قيد التجهيز' | 'جاهز للاستلام' | 'تم التسليم' | 'ملغي' | 'مسترجع';

export interface LogEntry {
  id: string;
  customer: string;
  items: string;
  type: OrderType;
  branch: string;
  total: number;
  pay: string;
  date: string;
  time: string;
  status: LogStatus;
  points: number;
}

export type BookingStatus =
  | 'بانتظار الدفع'
  | 'مؤكد'
  | 'قيد التجهيز'
  | 'جاهز للتسليم'
  | 'تم التسليم'
  | 'ملغي';

export type PayStatus = 'غير مدفوع' | 'مدفوع';

export type DeliveryWindow = 'صباحًا' | 'ظهرًا' | 'مساءً';

export interface Booking {
  id: string;
  /** Index into BOX_DAYS (0 = today). */
  day: number;
  time: string;
  window: DeliveryWindow;
  box: string;
  qty: number;
  customer: string;
  phone: string;
  branch: string;
  status: BookingStatus;
  pay: PayStatus;
  note: string;
}

export interface BookingDraft {
  customer: string;
  phone: string;
  box: string;
  qty: string;
  day: string;
  time: string;
  branch: string;
  pay: PayStatus;
  note: string;
}

export interface BoxDay {
  key: number;
  day: string;
  dow: string;
  date: string;
  cap: number;
}

export interface BoxCatalogItem {
  name: string;
  contents: string;
  price: number;
  /** Hours of notice required. */
  lead: number;
}

export interface ScheduledSlot {
  time: string;
  box: string;
  qty: number;
  customer: string;
  branch: string;
  status: BookingStatus;
}

export interface ScheduledDay {
  day: string;
  slots: ScheduledSlot[];
}

export type MenuCategory = 'الإفطار' | 'توقيع ماهو' | 'قهوة ساخنة' | 'قهوة باردة' | 'حلويات الجزيرة';

export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  cat: MenuCategory;
  price: number;
  /** Addon names joined with '، ', or '—' when none. */
  addons: string;
}

export type MenuItemFields = Omit<MenuItem, 'id'>;

export interface MenuItemDraft {
  name: string;
  desc: string;
  cat: MenuCategory;
  price: string;
  addons: string;
}

export type AddonGroup = 'مشروبات' | 'الإفطار' | 'حلويات';

export interface Addon {
  id: string;
  name: string;
  price: number;
  group: AddonGroup;
}

export interface AddonDraft {
  name: string;
  price: string;
  group: AddonGroup;
}

export type Tier = 'ماهالو' | 'كاهونا' | 'ألوها';

export interface Customer {
  name: string;
  phone: string;
  tier: Tier;
  points: number;
  orders: number;
  spend: number;
  branch: string;
  last: string;
  fav: string;
  note: string;
}

export interface StaffMember {
  name: string;
  role: string;
  assigned: string | null;
}

export type JobState = 'قيد المراجعة' | 'مقبول للمقابلة' | 'مستبعد';

export interface JobApplication {
  name: string;
  role: string;
  meta: string;
}

export interface NewBranch {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: string;
  manager: string;
  boxes: string;
}

export type BranchDraft = Omit<NewBranch, 'id'>;
