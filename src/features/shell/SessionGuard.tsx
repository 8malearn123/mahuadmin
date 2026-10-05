'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { lockSession, pingSession } from '@/features/auth/actions';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { UnlockForm } from '@/features/auth/UnlockForm';
import authStyles from '@/features/auth/auth.module.css';
import { HEARTBEAT_INTERVAL, MINUTE } from '@/lib/auth/config';
import type { SessionPing } from '@/lib/auth/types';
import { durationText } from '@/lib/format';
import { useSessionUser } from '@/lib/store/SessionProvider';

/** Tabs of the same browser share one session, so lock, unlock and sign-out reach all of them. */
const CHANNEL = 'mahu-session';
type TabMessage = { type: 'locked' | 'unlocked' | 'signed-out' };
type LockReason = 'idle' | 'manual';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

interface SessionControls {
  /** "قفل الشاشة": locks this tab and every other open tab now. */
  lock: () => void;
  /** Call as sign-out starts, so other open tabs leave the dashboard too. */
  announceSignOut: () => void;
}

const SessionControlsContext = createContext<SessionControls | null>(null);

export function useSessionControls(): SessionControls {
  const controls = useContext(SessionControlsContext);
  if (!controls) throw new Error('useSessionControls must be used inside <SessionGuard>');
  return controls;
}

/**
 * Keeps the dashboard in step with the server session:
 * - locks the screen after the role's idle time (or on demand), in place, so unsaved
 *   drafts and filters survive; the password unlocks it;
 * - tells the server about activity, so a reload doesn't find the session "idle";
 * - notices when the session was ended elsewhere, or the account's role or branch changed.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const user = useSessionUser();
  const router = useRouter();
  const [lock, setLock] = useState<LockReason | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);

  const post = useCallback((message: TabMessage) => channel.current?.postMessage(message), []);

  const leave = useCallback(
    (reason: string) => {
      const here = window.location.pathname + window.location.search;
      router.replace('/sign-in?reason=' + reason + '&next=' + encodeURIComponent(here));
    },
    [router],
  );

  const onPing = useCallback(
    (ping: SessionPing) => {
      if (ping.status === 'signed-out') leave(ping.reason ?? 'expired');
      else if (ping.status === 'locked') setLock((current) => current ?? 'idle');
      else if (ping.status !== 'active') router.replace('/');
      else if (ping.role !== user.role || ping.branch !== user.branch) router.refresh();
    },
    [leave, router, user.role, user.branch],
  );

  const lockNow = useCallback(
    (reason: LockReason) => {
      setLock(reason);
      post({ type: 'locked' });
      void lockSession();
    },
    [post],
  );

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(CHANNEL);
    channel.current = bc;
    bc.onmessage = (e: MessageEvent<TabMessage>) => {
      if (e.data?.type === 'locked') setLock((current) => current ?? 'manual');
      else if (e.data?.type === 'unlocked') setLock(null);
      else if (e.data?.type === 'signed-out') leave('signed-out');
    };
    return () => {
      bc.close();
      channel.current = null;
    };
  }, [leave]);

  // Re-check when the tab comes back into view, and every minute while it's visible.
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') void pingSession(false).then(onPing);
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    const poll = setInterval(check, HEARTBEAT_INTERVAL);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      clearInterval(poll);
    };
  }, [onPing]);

  // Activity heartbeat and the idle lock. Paused while locked; restarts on unlock.
  useEffect(() => {
    if (lock) return;
    const limit = user.idleMinutes ? user.idleMinutes * MINUTE : null;
    let lastActive = Date.now();
    let lastPing = 0;
    const onActivity = () => {
      lastActive = Date.now();
      if (lastActive - lastPing < HEARTBEAT_INTERVAL) return;
      lastPing = lastActive;
      void pingSession(true).then(onPing);
    };
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true, capture: true });
    const timer =
      limit === null
        ? undefined
        : setInterval(() => {
            if (Date.now() - lastActive >= limit) lockNow('idle');
          }, 5_000);
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity, { capture: true });
      clearInterval(timer);
    };
  }, [lock, user.idleMinutes, onPing, lockNow]);

  const controls = useMemo<SessionControls>(
    () => ({ lock: () => lockNow('manual'), announceSignOut: () => post({ type: 'signed-out' }) }),
    [lockNow, post],
  );

  const note =
    lock === 'idle' && user.idleMinutes
      ? `أُقفلت الشاشة بعد ${durationText(user.idleMinutes * MINUTE)} من عدم النشاط. أدخل كلمة المرور للمتابعة من حيث توقفت — لن تفقد ما كنت تعمل عليه.`
      : 'الشاشة مقفلة. أدخل كلمة المرور للمتابعة من حيث توقفت.';

  return (
    <SessionControlsContext value={controls}>
      <div inert={lock !== null}>{children}</div>
      {lock && (
        <div className={authStyles.lockLayer} role="dialog" aria-modal="true" aria-label="الجلسة مقفلة">
          <AuthFrame>
            <UnlockForm
              mode="overlay"
              name={user.name}
              note={note}
              onUnlocked={() => {
                setLock(null);
                post({ type: 'unlocked' });
              }}
              onSignOut={controls.announceSignOut}
            />
          </AuthFrame>
        </div>
      )}
    </SessionControlsContext>
  );
}
