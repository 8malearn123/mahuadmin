import type { ReactNode } from 'react';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { BrandPitch } from './BrandPitch';
import styles from './auth.module.css';

/** The brand's scene from the packaging artwork: sun, hills, headland, sea and beach. */
function Scene() {
  return (
    <svg className={styles.scene} viewBox="0 0 480 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle className={styles.sun} cx="318" cy="112" r="52" />
      <path className={styles.hills} d="M0 132 C 70 104 130 98 200 118 S 330 150 480 108 L480 210 L0 210 Z" />
      <path className={styles.headland} d="M0 150 C 46 128 104 122 160 140 C 204 154 236 160 286 166 L286 210 L0 210 Z" />
      <path className={styles.sea} d="M0 166 C 80 159 160 171 240 164 S 400 158 480 166 L480 190 L0 190 Z" />
      <path className={styles.beach} d="M0 186 C 120 179 300 193 480 183 L480 210 L0 210 Z" />
    </svg>
  );
}

/** Layout of the sign-in, sign-up and account-setup pages: brand panel and form column. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <aside className={styles.brand}>
        <div className={styles.brandHead}>
          <span className={styles.logo}>ماهو</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>منصة ماهو الرقمية</span>
            <span className={styles.brandMeta}>KUD-2061 · الإصدار 1.0</span>
          </div>
        </div>
        <BrandPitch />
        <Scene />
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
