import 'react';

declare module 'react' {
  interface CSSProperties {
    /** Allow CSS custom properties such as `--tone` in inline styles. */
    [key: `--${string}`]: string | number | undefined;
  }
}
