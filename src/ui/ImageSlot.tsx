'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useDashboard } from '@/lib/store/DashboardProvider';
import styles from './ImageSlot.module.css';

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

interface ImageSlotProps {
  /** Store key the image is kept under; slots sharing a key show the same image. */
  slotKey: string;
  /** Caption of the empty state. */
  placeholder?: string;
}

function hasFiles(e: DragEvent) {
  return Array.from(e.dataTransfer.types).includes('Files');
}

/**
 * Image placeholder that fills its container. Drop an image on it or click to
 * browse; the image is kept for the session (like the design's image slots).
 */
export function ImageSlot({ slotKey, placeholder = 'أفلت صورة هنا' }: ImageSlotProps) {
  const { state, dispatch } = useDashboard();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const src = state.images[slotKey];

  function ingest(file: File | undefined) {
    if (!file || !ACCEPT.includes(file.type)) return;
    if (src) URL.revokeObjectURL(src);
    dispatch({ type: 'setImage', key: slotKey, url: URL.createObjectURL(file) });
  }

  return (
    <div
      className={styles.slot}
      data-image-slot=""
      data-over={over ? '' : undefined}
      data-filled={src ? '' : undefined}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(false);
        ingest(e.dataTransfer.files[0]);
      }}
    >
      <div className={styles.frame}>
        {src ? (
          // Object URLs from the user's own files; next/image can't optimise these.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.image} src={src} alt="" draggable={false} />
        ) : (
          <button type="button" className={styles.empty} onClick={() => input.current?.click()}>
            <svg
              className={styles.icon}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className={styles.caption}>{placeholder}</span>
          </button>
        )}
        <div className={styles.ring} />
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(',')}
        hidden
        onChange={(e) => {
          ingest(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
