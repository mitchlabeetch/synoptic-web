// src/hooks/useOnboardingTour.ts
// PURPOSE: Manage onboarding tour state with database persistence
// ACTION: Ensures tour only runs once per user by storing state in profiles table
// MECHANISM: Syncs tour completion status between localStorage (fallback) and DB

'use client';

import { useState, useEffect, useCallback } from 'react';

interface OnboardingState {
  // Tour completion flags
  editorTourCompleted: boolean;
  dashboardTourCompleted: boolean;
  exportTourCompleted: boolean;
  glossaryTourCompleted: boolean;
  
  // Feature discovery flags
  hasUsedAITranslate: boolean;
  hasCreatedProject: boolean;
  hasExportedPDF: boolean;
  
  // Tour version (to show new features after updates)
  lastSeenVersion: string;
}

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  editorTourCompleted: false,
  dashboardTourCompleted: false,
  exportTourCompleted: false,
  glossaryTourCompleted: false,
  hasUsedAITranslate: false,
  hasCreatedProject: false,
  hasExportedPDF: false,
  lastSeenVersion: '0.0.0',
};

const CURRENT_VERSION = '1.0.0'; // Update this when adding new tour steps

/**
 * Hook for managing onboarding tour with database persistence
 */
export function useOnboardingTour(tourId: keyof Pick<OnboardingState, 
  'editorTourCompleted' | 'dashboardTourCompleted' | 'exportTourCompleted' | 'glossaryTourCompleted'
>) {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRun, setShouldRun] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  
  // Load onboarding state from DB on mount
  useEffect(() => {
    async function loadOnboardingState() {
      setIsLoading(true);
      
      try {
        // Try to fetch from API (which reads from DB)
        const response = await fetch('/api/user/onboarding');
        
        if (response.ok) {
          const data = await response.json();
          const dbState = data.onboarding || {};
          
          // Merge with defaults
          const mergedState: OnboardingState = {
            ...DEFAULT_ONBOARDING_STATE,
            ...dbState,
          };
          
          setOnboardingState(mergedState);
          
          // Check if this tour should run
          const tourCompleted = mergedState[tourId];
          const isNewVersion = mergedState.lastSeenVersion !== CURRENT_VERSION;
          
          // Run tour if not completed, or if there's a new version with new features
          setShouldRun(!tourCompleted);
        } else {
          // Fallback to localStorage for unauthenticated users
          const localState = localStorage.getItem('synoptic_onboarding');
          if (localState) {
            const parsed = JSON.parse(localState) as OnboardingState;
            setOnboardingState(parsed);
            setShouldRun(!parsed[tourId]);
          } else {
            setShouldRun(true); // First time user
          }
        }
      } catch (error) {
        console.error('[Onboarding] Failed to load state:', error);
        // Fallback to localStorage
        const localState = localStorage.getItem('synoptic_onboarding');
        if (localState) {
          try {
            const parsed = JSON.parse(localState) as OnboardingState;
            setOnboardingState(parsed);
            setShouldRun(!parsed[tourId]);
          } catch {
            setShouldRun(true);
          }
        } else {
          setShouldRun(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadOnboardingState();
  }, [tourId]);

  // Mark tour as completed
  const completeTour = useCallback(async () => {
    const newState: OnboardingState = {
      ...onboardingState,
      [tourId]: true,
      lastSeenVersion: CURRENT_VERSION,
    };
    
    setOnboardingState(newState);
    setShouldRun(false);
    
    // Save to localStorage immediately (offline-first)
    localStorage.setItem('synoptic_onboarding', JSON.stringify(newState));
    
    // Sync to database
    try {
      await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding: newState }),
      });
    } catch (error) {
      console.error('[Onboarding] Failed to sync to DB:', error);
      // State is already in localStorage, so user experience is preserved
    }
  }, [onboardingState, tourId]);

  // Skip tour (user dismisses without completing)
  const skipTour = useCallback(async () => {
    await completeTour(); // Treat skip as completion
  }, [completeTour]);

  // Reset tour (for testing or re-onboarding)
  const resetTour = useCallback(async () => {
    const newState: OnboardingState = {
      ...onboardingState,
      [tourId]: false,
    };
    
    setOnboardingState(newState);
    setShouldRun(true);
    
    localStorage.setItem('synoptic_onboarding', JSON.stringify(newState));
    
    try {
      await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding: newState }),
      });
    } catch (error) {
      console.error('[Onboarding] Failed to reset in DB:', error);
    }
  }, [onboardingState, tourId]);

  // Track feature usage (for progressive disclosure)
  const trackFeatureUsage = useCallback(async (
    feature: keyof Pick<OnboardingState, 'hasUsedAITranslate' | 'hasCreatedProject' | 'hasExportedPDF'>
  ) => {
    if (onboardingState[feature]) return; // Already tracked
    
    const newState: OnboardingState = {
      ...onboardingState,
      [feature]: true,
    };
    
    setOnboardingState(newState);
    localStorage.setItem('synoptic_onboarding', JSON.stringify(newState));
    
    try {
      await fetch('/api/user/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding: newState }),
      });
    } catch (error) {
      console.error('[Onboarding] Failed to track feature:', error);
    }
  }, [onboardingState]);

  return {
    isLoading,
    shouldRun,
    completeTour,
    skipTour,
    resetTour,
    trackFeatureUsage,
    onboardingState,
  };
}

/**
 * Reset all onboarding state (for testing)
 */
export async function resetAllOnboarding() {
  localStorage.removeItem('synoptic_onboarding');
  
  try {
    await fetch('/api/user/onboarding', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('[Onboarding] Failed to reset all:', error);
  }
}
