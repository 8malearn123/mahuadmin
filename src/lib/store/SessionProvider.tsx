'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from '@/lib/auth/types';

const SessionContext = createContext<SessionUser | null>(null);

/** The signed-in account, handed down by the dashboard layout from the server session. */
export function SessionProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return <SessionContext value={user}>{children}</SessionContext>;
}

export function useSessionUser(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useSessionUser must be used inside <SessionProvider>');
  return user;
}
