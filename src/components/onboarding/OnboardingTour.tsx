// src/components/onboarding/OnboardingTour.tsx
'use client';

import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

  useEffect(() => {
    checkOnboardingStatus();
  }, [context]);

  const checkOnboardingStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const completed = profile?.onboarding_completed || {};
    const localCompleted = JSON.parse(localStorage.getItem('synoptic_onboarding') || '{}');
    
    if (!completed[context] && !localCompleted[context]) {
      setTimeout(() => setRun(true), 1000);
    }
  };

  const handleCallback = async (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);

      // Save to localStorage as fallback
      const localCompleted = JSON.parse(localStorage.getItem('synoptic_onboarding') || '{}');
      localStorage.setItem('synoptic_onboarding', JSON.stringify({ ...localCompleted, [context]: true }));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          // First get current state to avoid overwriting other context completions
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          const currentCompletion = profile?.onboarding_completed || {};
          
          await supabase
            .from('profiles')
            .update({
              onboarding_completed: { ...currentCompletion, [context]: true },
            })
            .eq('id', user.id);
        } catch (e) {
          console.warn('Could not save onboarding status to DB (missing column?)');
        }
      }
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
