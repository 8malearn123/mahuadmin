'use client';

import { PERIODS } from '@/lib/data/insights';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { branchOptions } from '@/lib/store/reducer';
import type { ViewId } from '@/lib/types';
import { VIEWS } from '@/lib/views';
import { Segmented } from '@/ui/Segmented';
import { Spacer } from '@/ui/Spacer';
import styles from './shell.module.css';

export function Header({ view }: { view: ViewId }) {
  const { state, dispatch } = useDashboard();
  const def = VIEWS[view];

  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <h1 className={styles.title}>{def.title}</h1>
        <span className={styles.subtitle}>{def.subtitle}</span>
      </div>
      <Spacer />
      {!def.hideBranch && (
        <Segmented
          label="الفرع"
          options={branchOptions(state)}
          value={state.branch}
          onChange={(branch) => dispatch({ type: 'setBranch', branch })}
          size="md"
          wide
        />
      )}
      {def.showPeriod && (
        <Segmented
          label="الفترة"
          options={PERIODS}
          value={state.period}
          onChange={(period) => dispatch({ type: 'setPeriod', period })}
          size="md"
          activeText="cream100"
        />
      )}
    </header>
  );
}
