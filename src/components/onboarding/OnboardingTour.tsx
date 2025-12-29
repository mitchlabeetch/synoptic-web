// src/components/onboarding/OnboardingTour.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useTranslations } from 'next-intl';

const TOUR_STEPS = (t: any): Step[] => [
  {
    target: '[data-tour="dashboard-list"]',
    content: t('tourDashboardContent'),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-project"]',
    content: t('tourNewProjectContent'),
    placement: 'bottom',
  },
  {
    target: '[data-tour="library"]',
    content: t('tourLibraryContent'),
    placement: 'right',
  }
];

const EDITOR_STEPS = (t: any): Step[] => [
  {
    target: '[data-tour="sidebar-pages"]',
    content: t('tourPageListContent'),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-tools"]',
    content: t('tourToolsContent'),
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-publish"]',
    content: t('tourPublishContent'),
    placement: 'right',
  },
  {
    target: '#editor-workspace',
    content: t('tourWorkspaceContent'),
    placement: 'top',
  }
];

export function OnboardingTour({
  context,
}: {
  context: 'dashboard' | 'editor';
}) {
  const [run, setRun] = useState(false);
  const t = useTranslations('Onboarding');

  const checkOnboardingStatus = useCallback(async () => {
    // Check local storage for onboarding status
    const localCompleted = JSON.parse(localStorage.getItem('synoptic_onboarding') || '{}');
    
    if (!localCompleted[context]) {
      setTimeout(() => setRun(true), 1000);
    }
  }, [context]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const handleCallback = async (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);

      // Save to localStorage
      const localCompleted = JSON.parse(localStorage.getItem('synoptic_onboarding') || '{}');
      localStorage.setItem('synoptic_onboarding', JSON.stringify({ ...localCompleted, [context]: true }));
    }
  };

  const steps = context === 'dashboard' ? TOUR_STEPS(t) : EDITOR_STEPS(t);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
      }}
    />
  );
}
