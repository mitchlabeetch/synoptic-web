// src/lib/hooks/useOfflineDraft.ts
// PURPOSE: React hook for offline draft persistence
// ACTION: Integrates IndexedDB draft saving with project store
// MECHANISM: Auto-saves editor state, detects conflicts, handles recovery

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import {
  saveDraft,
  loadDraft,
  markDraftSynced,
  setupVisibilitySaveHandler,
  setupAutoSave,
  DraftEntry,
} from '@/lib/offline/draftPersistence';

interface UseOfflineDraftOptions {
  autoSaveInterval?: number; // ms
  enabled?: boolean;
}

interface UseOfflineDraftReturn {
  hasPendingDraft: boolean;
  draftTimestamp: number | null;
  isRecovering: boolean;
  recoverDraft: () => Promise<boolean>;
  discardDraft: () => Promise<void>;
  forceSave: () => Promise<void>;
}

/**
 * Hook for managing offline draft persistence
 */
export function useOfflineDraft(
  projectId: string | null,
  options: UseOfflineDraftOptions = {}
): UseOfflineDraftReturn {
  const { autoSaveInterval = 5000, enabled = true } = options;
  
  const content = useProjectStore((state) => state.content);
  const setContent = useProjectStore((state) => state.setContent);
  
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const lastSavedRef = useRef<string | null>(null);
  
  // Check for pending draft on mount
  useEffect(() => {
    if (!projectId || !enabled) return;
    
    const checkForDraft = async () => {
      try {
        const draft = await loadDraft(projectId);
        if (draft && draft.dirty) {
          setHasPendingDraft(true);
          setDraftTimestamp(draft.timestamp);
        }
      } catch (error) {
        console.error('[useOfflineDraft] Failed to check draft:', error);
      }
    };
    
    checkForDraft();
  }, [projectId, enabled]);
  
  // Setup auto-save
  useEffect(() => {
    if (!projectId || !enabled) return;
    
    const getProjectState = () => ({
      projectId,
      content,
    });
    
    // Setup visibility change handler
    const cleanupVisibility = setupVisibilitySaveHandler(getProjectState);
    
    // Setup periodic auto-save
    const cleanupAutoSave = setupAutoSave(getProjectState, autoSaveInterval);
    
    return () => {
      cleanupVisibility();
      cleanupAutoSave();
    };
  }, [projectId, content, autoSaveInterval, enabled]);
  
  // Save on content change (debounced by effect)
  useEffect(() => {
    if (!projectId || !enabled || !content) return;
    
    // Serialize content for comparison
    const contentString = JSON.stringify(content);
    
    // Skip if content hasn't changed
    if (contentString === lastSavedRef.current) return;
    
    // Debounce save
    const timeoutId = setTimeout(() => {
      saveDraft(projectId, content, true).then(() => {
        lastSavedRef.current = contentString;
      });
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [projectId, content, enabled]);
  
  // Recover draft from IndexedDB
  const recoverDraft = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;
    
    setIsRecovering(true);
    try {
      const draft = await loadDraft(projectId);
      if (draft) {
        setContent(draft.content);
        await markDraftSynced(projectId);
        setHasPendingDraft(false);
        setDraftTimestamp(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useOfflineDraft] Recovery failed:', error);
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [projectId, setContent]);
  
  // Discard pending draft
  const discardDraft = useCallback(async (): Promise<void> => {
    if (!projectId) return;
    
    try {
      await markDraftSynced(projectId);
      setHasPendingDraft(false);
      setDraftTimestamp(null);
    } catch (error) {
      console.error('[useOfflineDraft] Failed to discard draft:', error);
    }
  }, [projectId]);
  
  // Force immediate save
  const forceSave = useCallback(async (): Promise<void> => {
    if (!projectId || !content) return;
    
    try {
      await saveDraft(projectId, content, true);
      lastSavedRef.current = JSON.stringify(content);
    } catch (error) {
      console.error('[useOfflineDraft] Force save failed:', error);
    }
  }, [projectId, content]);
  
  return {
    hasPendingDraft,
    draftTimestamp,
    isRecovering,
    recoverDraft,
    discardDraft,
    forceSave,
  };
}

/**
 * Hook for displaying draft recovery modal
 */
export function useDraftRecoveryPrompt(projectId: string | null) {
  const { hasPendingDraft, draftTimestamp, recoverDraft, discardDraft } = useOfflineDraft(projectId);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    if (hasPendingDraft && draftTimestamp) {
      setShowPrompt(true);
    }
  }, [hasPendingDraft, draftTimestamp]);
  
  const handleRecover = async () => {
    await recoverDraft();
    setShowPrompt(false);
  };
  
  const handleDiscard = async () => {
    await discardDraft();
    setShowPrompt(false);
  };
  
  return {
    showPrompt,
    draftTimestamp,
    handleRecover,
    handleDiscard,
  };
}
