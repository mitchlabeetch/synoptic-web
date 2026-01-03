'use client';

// src/app/(app)/dashboard/EmptyProjectsState.tsx
// PURPOSE: Client component wrapper for EmptyState with onClick handler
// ACTION: Dispatches custom event to open project wizard
// MECHANISM: Client component can have event handlers

import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslations } from 'next-intl';

export function EmptyProjectsState() {
  const t = useTranslations('Dashboard');

  return (
    <EmptyState
      variant="projects"
      title={t('emptyState')}
      description={t('noProjects')}
      action={{
        label: t('newProject'),
        onClick: () => {
          // Dispatch custom event to open the project wizard
          window.dispatchEvent(new CustomEvent('open-project-wizard'));
        },
      }}
    />
  );
}
