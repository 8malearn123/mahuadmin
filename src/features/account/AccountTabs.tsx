import Link from 'next/link';
import styles from './account.module.css';

/** Switches between the two account pages. */
export function AccountTabs({ active }: { active: 'profile' | 'security' }) {
  return (
    <nav className={styles.tabs} aria-label="أقسام الحساب">
      <Link href="/account" className={styles.tab} aria-current={active === 'profile' ? 'page' : undefined}>
        الملف الشخصي
      </Link>
      <Link href="/account/security" className={styles.tab} aria-current={active === 'security' ? 'page' : undefined}>
        الأمان والأجهزة
      </Link>
    </nav>
  );
}
