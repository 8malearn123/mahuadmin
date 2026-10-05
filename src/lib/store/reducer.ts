import { bookingFromDraft } from '../data/boxes';
import { BASE_ORDERS } from '../data/orders';
import { ALL_BRANCHES, ROLES, isMultiBranch, scopeRole } from '../roles';
import type {
  Addon,
  AddonDraft,
  Booking,
  BookingDraft,
  BookingStatus,
  BranchDraft,
  JobState,
  MenuItem,
  MenuItemFields,
  NewBranch,
  Order,
  Period,
  RoleDef,
  RoleId,
} from '../types';

/** The signed-in account's own role and branch; `role` below differs only while an admin previews another role. */
export interface DashboardAccount {
  role: RoleId;
  branch: string;
}

export interface DashboardState {
  account: DashboardAccount;
  role: RoleId;
  branch: string;
  period: Period;
  orders: Order[];
  bookingsAdded: Booking[];
  /** Status overrides for bookings, keyed by booking id. */
  bookingStatus: Record<string, BookingStatus>;
  /** Bookings marked paid when their payment was confirmed. */
  bookingPaid: Record<string, true>;
  /** Box catalog entries paused from sale, keyed by box name. */
  boxOff: Record<string, boolean>;
  menuAdded: MenuItem[];
  /** Edits to seeded menu items, keyed by item id. */
  menuEdits: Record<string, MenuItemFields>;
  /** Menu items marked unavailable, keyed by item id. */
  menuOff: Record<string, boolean>;
  addonsExtra: Addon[];
  jobStates: Record<string, JobState>;
  branchesAdded: NewBranch[];
  /** Images dropped onto image slots this session (object URLs), keyed by slot id. */
  images: Record<string, string>;
  /** Screen UI state that should survive navigating between screens (filters, drafts). */
  ui: Record<string, unknown>;
  /** Counter for ids of things created in this session. */
  seq: number;
}

export const MENU_DRAFT_IMAGE = 'menu:new';
export const menuImageKey = (itemId: string) => 'menu:' + itemId;
export const boxImageKey = (boxName: string) => 'box:' + boxName;

/** UI state cleared by a role switch: the inline add-on form closes, as in the design. */
const UI_RESET_ON_ROLE_SWITCH = ['menu.addonOpen'];

/**
 * The role the dashboard is showing. The account's own role is narrowed to its branch;
 * a previewed role keeps its sample scope (Jazan for single-branch roles).
 */
export function activeRole(state: Pick<DashboardState, 'account' | 'role'>): RoleDef {
  return state.role === state.account.role ? scopeRole(ROLES[state.role], state.account.branch) : ROLES[state.role];
}

export function createInitialState(account: DashboardAccount): DashboardState {
  return {
    account,
    role: account.role,
    branch: activeRole({ account, role: account.role }).branches[0],
    period: 'اليوم',
    orders: BASE_ORDERS,
    bookingsAdded: [],
    bookingStatus: {},
    bookingPaid: {},
    boxOff: {},
    menuAdded: [],
    menuEdits: {},
    menuOff: {},
    addonsExtra: [],
    jobStates: {},
    branchesAdded: [],
    images: {},
    ui: {},
    seq: 1,
  };
}

export type Action =
  | { type: 'syncAccount'; account: DashboardAccount }
  | { type: 'switchRole'; role: RoleId }
  | { type: 'setBranch'; branch: string }
  | { type: 'setPeriod'; period: Period }
  | { type: 'moveOrder'; id: string; stage: number }
  | { type: 'setBookingStatus'; id: string; status: BookingStatus; markPaid?: boolean }
  | { type: 'addBooking'; draft: BookingDraft }
  | { type: 'toggleBoxOff'; name: string }
  | { type: 'saveMenuItem'; editingId: string | null; fields: MenuItemFields }
  | { type: 'toggleMenuOff'; id: string }
  | { type: 'removeMenuItem'; id: string }
  | { type: 'addAddon'; draft: AddonDraft }
  | { type: 'removeAddon'; id: string }
  | { type: 'setJobState'; name: string; state: JobState }
  | { type: 'addBranch'; draft: BranchDraft }
  | { type: 'removeBranch'; id: string }
  | { type: 'setImage'; key: string; url: string | null }
  | { type: 'setUi'; key: string; value: unknown; initial: unknown };

/** Header branch tabs: the role's branches, plus cities of added branches for multi-branch roles. */
export function branchOptions(state: Pick<DashboardState, 'account' | 'role' | 'branchesAdded'>): string[] {
  const role = activeRole(state);
  if (!isMultiBranch(role)) return role.branches;
  const extra = state.branchesAdded.map((b) => b.city).filter((c) => !role.branches.includes(c));
  return [...role.branches, ...new Set(extra)];
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

export function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'syncAccount': {
      // The account changed on the server without a data-scope change (e.g. a customer's preferred branch).
      if (action.account.role === state.account.role && action.account.branch === state.account.branch) return state;
      const next = { ...state, account: action.account };
      const options = branchOptions(next);
      return options.includes(next.branch) ? next : { ...next, branch: options[0] };
    }
    case 'switchRole': {
      const ui = { ...state.ui };
      for (const key of UI_RESET_ON_ROLE_SWITCH) delete ui[key];
      return { ...state, role: action.role, branch: activeRole({ ...state, role: action.role }).branches[0], ui };
    }
    case 'setBranch':
      return { ...state, branch: action.branch };
    case 'setPeriod':
      return { ...state, period: action.period };
    case 'moveOrder':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.id ? { ...o, stage: action.stage } : o)),
      };
    case 'setBookingStatus':
      return {
        ...state,
        bookingStatus: { ...state.bookingStatus, [action.id]: action.status },
        bookingPaid: action.markPaid ? { ...state.bookingPaid, [action.id]: true } : state.bookingPaid,
      };
    case 'addBooking':
      return {
        ...state,
        bookingsAdded: [...state.bookingsAdded, bookingFromDraft(action.draft, state.bookingsAdded.length)],
      };
    case 'toggleBoxOff':
      return { ...state, boxOff: { ...state.boxOff, [action.name]: !state.boxOff[action.name] } };
    case 'saveMenuItem': {
      const { editingId, fields } = action;
      if (editingId) {
        if (state.menuAdded.some((m) => m.id === editingId)) {
          return {
            ...state,
            menuAdded: state.menuAdded.map((m) => (m.id === editingId ? { id: editingId, ...fields } : m)),
          };
        }
        return { ...state, menuEdits: { ...state.menuEdits, [editingId]: fields } };
      }
      const id = 'n' + state.seq;
      const draftImage = state.images[MENU_DRAFT_IMAGE];
      return {
        ...state,
        seq: state.seq + 1,
        menuAdded: [...state.menuAdded, { id, ...fields }],
        images: draftImage
          ? { ...without(state.images, MENU_DRAFT_IMAGE), [menuImageKey(id)]: draftImage }
          : state.images,
      };
    }
    case 'toggleMenuOff':
      return { ...state, menuOff: { ...state.menuOff, [action.id]: !state.menuOff[action.id] } };
    case 'removeMenuItem':
      return {
        ...state,
        menuAdded: state.menuAdded.filter((m) => m.id !== action.id),
        menuOff: without(state.menuOff, action.id),
        images: without(state.images, menuImageKey(action.id)),
      };
    case 'addAddon':
      return {
        ...state,
        seq: state.seq + 1,
        addonsExtra: [
          ...state.addonsExtra,
          { id: 'x' + state.seq, name: action.draft.name.trim(), price: Number(action.draft.price) || 0, group: action.draft.group },
        ],
      };
    case 'removeAddon':
      return { ...state, addonsExtra: state.addonsExtra.filter((a) => a.id !== action.id) };
    case 'setJobState':
      return { ...state, jobStates: { ...state.jobStates, [action.name]: action.state } };
    case 'addBranch': {
      const branch: NewBranch = {
        ...action.draft,
        id: 'b' + state.seq,
        name: action.draft.name.trim(),
        address: action.draft.address.trim(),
      };
      return { ...state, seq: state.seq + 1, branchesAdded: [...state.branchesAdded, branch] };
    }
    case 'removeBranch': {
      const next = { ...state, branchesAdded: state.branchesAdded.filter((b) => b.id !== action.id) };
      // Don't leave the header filtering on a city whose last branch was just removed.
      if (!branchOptions(next).includes(next.branch)) next.branch = ALL_BRANCHES;
      return next;
    }
    case 'setImage':
      return {
        ...state,
        images: action.url ? { ...state.images, [action.key]: action.url } : without(state.images, action.key),
      };
    case 'setUi': {
      const prev = action.key in state.ui ? state.ui[action.key] : action.initial;
      const value = typeof action.value === 'function' ? (action.value as (p: unknown) => unknown)(prev) : action.value;
      return { ...state, ui: { ...state.ui, [action.key]: value } };
    }
  }
}

