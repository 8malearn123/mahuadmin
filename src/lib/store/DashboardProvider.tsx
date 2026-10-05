'use client';

import { createContext, useCallback, useContext, useMemo, useReducer, type Dispatch } from 'react';
import { createInitialState, reducer, type Action, type DashboardState } from './reducer';

interface DashboardContextValue {
  state: DashboardState;
  dispatch: Dispatch<Action>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/**
 * Holds the dashboard's mock data and session edits. It lives in the root layout,
 * so state survives navigation between screens and resets on a full reload.
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
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
