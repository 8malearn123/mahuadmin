import type { Addon, AddonDraft, AddonGroup, MenuCategory, MenuItem, MenuItemDraft } from '../types';
import { ALL } from './filters';

export const MENU_CATEGORIES: MenuCategory[] = ['الإفطار', 'توقيع ماهو', 'قهوة ساخنة', 'قهوة باردة', 'حلويات الجزيرة'];

export const AVAILABILITY_FILTERS = [ALL, 'متوفر', 'غير متوفر'];

/** Separator used when a list of addon names is stored as text. */
export const ADDON_SEPARATOR = '، ';

export const BASE_MENU: MenuItem[] = [
  { id: 'm01', name: 'لاتيه المانجو الجازاني', desc: 'إسبريسو بارد · مانجو محلي · حليب جوز هند', cat: 'توقيع ماهو', price: 23, addons: 'شوت إسبريسو إضافي، حليب نباتي، بدون سكر' },
  { id: 'm02', name: 'كولادا القهوة', desc: 'كولد برو مخفوق مع كريمة جوز الهند', cat: 'توقيع ماهو', price: 24, addons: 'أناناس إضافي، كريمة' },
  { id: 'm03', name: 'ماتشا جوز الهند الباردة', desc: 'ماتشا احتفالية · حليب جوز هند', cat: 'توقيع ماهو', price: 21, addons: 'شراب فانيلا' },
  { id: 'm04', name: 'V60 تقطير', desc: 'محصول موسمي · تحميص فاتح', cat: 'قهوة ساخنة', price: 18, addons: 'اختيار المحصول' },
  { id: 'm05', name: 'سبانش لاتيه', desc: 'حليب مكثف محلى', cat: 'قهوة ساخنة', price: 19, addons: 'شوت إسبريسو إضافي' },
  { id: 'm06', name: 'كورتادو', desc: 'إسبريسو مع حليب مبخّر', cat: 'قهوة ساخنة', price: 14, addons: 'حليب نباتي' },
  { id: 'm07', name: 'كولد برو', desc: 'نقع بارد 16 ساعة', cat: 'قهوة باردة', price: 19, addons: 'تونك، ثلج إضافي' },
  { id: 'm08', name: 'آيس سبانش لاتيه', desc: 'الأكثر طلبًا في المساء', cat: 'قهوة باردة', price: 20, addons: 'شوت إسبريسو إضافي، كراميل' },
  { id: 'm09', name: 'تشيز كيك المانجو', desc: 'يُخبز يوميًا', cat: 'حلويات الجزيرة', price: 24, addons: 'صوص مانجو إضافي' },
  { id: 'm10', name: 'كوكيز بملح البحر', desc: 'شوكولاتة داكنة 70%', cat: 'حلويات الجزيرة', price: 10, addons: '—' },
  { id: 'm11', name: 'شكشوكة جازانية', desc: 'بيض · طماطم · فلفل حار · خبز تنور', cat: 'الإفطار', price: 32, addons: 'جبن إضافي، خبز تنور إضافي' },
  { id: 'm12', name: 'أفوكادو توست', desc: 'خبز حبوب كاملة · أفوكادو · بيض مسلوق', cat: 'الإفطار', price: 34, addons: 'سالمون مدخن، بيض إضافي' },
  { id: 'm13', name: 'معصوب المانجو', desc: 'موز ومانجو محلي · قشطة · عسل', cat: 'الإفطار', price: 28, addons: 'مكسرات، عسل إضافي' },
  { id: 'm14', name: 'فطور ماهو الكامل', desc: 'بيض · فول · جبن · خبز · مشروب ساخن', cat: 'الإفطار', price: 45, addons: 'ترقية المشروب' },
];

export const ADDON_GROUPS: AddonGroup[] = ['مشروبات', 'الإفطار', 'حلويات'];

export const ADDON_BANK: Addon[] = [
  { id: 'a01', name: 'شوت إسبريسو إضافي', price: 5, group: 'مشروبات' },
  { id: 'a02', name: 'حليب نباتي', price: 4, group: 'مشروبات' },
  { id: 'a03', name: 'بدون سكر', price: 0, group: 'مشروبات' },
  { id: 'a04', name: 'صوص مانجو إضافي', price: 3, group: 'مشروبات' },
  { id: 'a05', name: 'كريمة جوز الهند', price: 5, group: 'مشروبات' },
  { id: 'a06', name: 'أناناس إضافي', price: 4, group: 'مشروبات' },
  { id: 'a07', name: 'شراب فانيلا', price: 3, group: 'مشروبات' },
  { id: 'a08', name: 'كراميل', price: 3, group: 'مشروبات' },
  { id: 'a09', name: 'تونك', price: 6, group: 'مشروبات' },
  { id: 'a10', name: 'ثلج إضافي', price: 0, group: 'مشروبات' },
  { id: 'a11', name: 'اختيار المحصول', price: 0, group: 'مشروبات' },
  { id: 'a12', name: 'ترقية المشروب', price: 7, group: 'الإفطار' },
  { id: 'a13', name: 'جبن إضافي', price: 6, group: 'الإفطار' },
  { id: 'a14', name: 'خبز تنور إضافي', price: 3, group: 'الإفطار' },
  { id: 'a15', name: 'بيض إضافي', price: 5, group: 'الإفطار' },
  { id: 'a16', name: 'أفوكادو إضافي', price: 8, group: 'الإفطار' },
  { id: 'a17', name: 'سالمون مدخن', price: 14, group: 'الإفطار' },
  { id: 'a18', name: 'مكسرات', price: 4, group: 'حلويات' },
  { id: 'a19', name: 'عسل إضافي', price: 5, group: 'حلويات' },
  { id: 'a20', name: 'كريمة', price: 4, group: 'حلويات' },
];

export function emptyItemDraft(cat: MenuCategory = 'الإفطار'): MenuItemDraft {
  return { name: '', desc: '', cat, price: '', addons: '' };
}

export const EMPTY_ADDON_DRAFT: AddonDraft = { name: '', price: '', group: 'مشروبات' };
