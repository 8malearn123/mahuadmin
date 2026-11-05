import type { ReactNode } from 'react';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { Logo } from '@/ui/Logo';
import { BrandPitch } from './BrandPitch';
import styles from './auth.module.css';

/** Layout of the sign-in, sign-up and account-setup pages: brand panel and form column. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      {/* The identity book's cover: the logo and its rule over the gradient, Jazan's mountains and sea below. */}
      <aside className={styles.brand}>
        <div className={styles.brandHead}>
          <Logo className={styles.logo} />
          <div className={styles.brandRule}>
            <span className={styles.tagline}>جازان من جبالها إلى بحرها</span>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.motto}>
              لحظتك تبدأ من <bdi lang="en">Māhū</bdi>
            </span>
          </div>
        </div>
        <BrandPitch />
        <div className={styles.scene} aria-hidden="true" />
      </aside>
      <main className={styles.main}>
        {children}
        <footer className={styles.footer}>
          <span>© مقاهي ماهو</span>
          <span aria-hidden="true">·</span>
          <a href={PUBLIC_SITE_URL}>الموقع العام ↗</a>
        </footer>
      </main>
    </div>
  );
}
