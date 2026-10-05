'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch } from 'react';
import { createInitialState, reducer, type Action, type DashboardAccount, type DashboardState } from './reducer';

interface DashboardContextValue {
  state: DashboardState;
  dispatch: Dispatch<Action>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/**
 * Holds the dashboard's mock data and session edits for the signed-in account. It lives in
 * the dashboard layout, so state survives navigation between screens and resets on a full
 * reload or when another account signs in (the layout keys it by account and data scope).
 */
export function DashboardProvider({ account, children }: { account: DashboardAccount; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, account, createInitialState);
  const { role, branch } = account;
  useEffect(() => {
    dispatch({ type: 'syncAccount', account: { role, branch } });
  }, [role, branch]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DashboardContext value={value}>{children}</DashboardContext>;
}

export function useDashboard(): DashboardContextValue {
  const value = useContext(DashboardContext);
  if (!value) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return value;
}

type SetUiState<T> = (next: T | ((prev: T) => T)) => void;

/**
 * Like useState, but kept in the dashboard store so it survives switching screens
 * (search boxes, filters, form drafts), matching the original single-page design.
 */
export function useUiState<T>(key: string, initial: T): [T, SetUiState<T>] {
  const { state, dispatch } = useDashboard();
  const value = (key in state.ui ? state.ui[key] : initial) as T;
  const set = useCallback<SetUiState<T>>(
    (next) => dispatch({ type: 'setUi', key, value: next, initial }),
    [dispatch, key, initial],
  );
  return [value, set];
}
