// src/hooks/useKeyboardShortcuts.ts
// PURPOSE: Global keyboard shortcuts for power users
// ACTION: Handles Cmd/Ctrl shortcuts for undo, redo, save, and AI generation
// MECHANISM: Window event listener with modifier key detection

'use client';

import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { saveDraft } from '@/lib/offline/draftPersistence';
import { toast } from '@/components/ui/Toast';

// Custom event for AI generation trigger
export const AI_GENERATE_EVENT = 'synoptic:ai-generate';

export function useKeyboardShortcuts() {
  const { 
    undo, 
    redo, 
    currentPageIndex, 
    selectedBlockId, 
    deleteBlock,
    addBlock,
    meta,
    content
  } = useProjectStore();

  // Handler for Ctrl+S: Manual Save
  const handleManualSave = useCallback(async () => {
    if (!meta?.id || !content) {
      toast.info('Nothing to save', { description: 'Create or open a project first' });
      return;
    }
    
    try {
      await saveDraft(meta.id, content, true);
      toast.success('Draft saved', { description: 'Your changes have been saved locally' });
      
      // Also trigger server sync if online
      if (navigator.onLine) {
        fetch('/api/projects/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: meta.id, content }),
        }).catch(() => {
          // Silent fail for background sync
        });
      }
    } catch (error) {
      console.error('[Keyboard] Save failed:', error);
      toast.error('Save failed', { description: 'Your changes are still stored locally' });
    }
  }, [meta?.id, content]);

  // Handler for Ctrl+Enter: AI Generate
  const handleAiGenerate = useCallback(() => {
    // Dispatch custom event that AI components can listen to
    const event = new CustomEvent(AI_GENERATE_EVENT, {
      detail: { 
        blockId: selectedBlockId,
        pageIndex: currentPageIndex 
      }
    });
    window.dispatchEvent(event);
    
    // Also show a toast if no AI target is identified
    if (!selectedBlockId) {
      toast.info('AI Generate', { description: 'Select a text block to use AI generation' });
    }
  }, [selectedBlockId, currentPageIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      
      // ═══════════════════════════════════════════════════════════════
      // GLOBAL SHORTCUTS (work even in input fields)
      // ═══════════════════════════════════════════════════════════════
      
      // Cmd+S: Save (always intercept to prevent browser save dialog)
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
        return;
      }
      
      // Cmd+Enter: AI Generate
      if (isMod && e.key === 'Enter') {
        e.preventDefault();
        handleAiGenerate();
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════
      // CONTEXT-SENSITIVE SHORTCUTS (only when not in text input)
      // ═══════════════════════════════════════════════════════════════
      
      // Don't trigger context shortcuts if focus is in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        // EXCEPTION: Cmd+K for Palette should always work
        if (e.key === 'k' && isMod) return;
        return;
      }

      // Undo: Cmd+Z
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Cmd+Shift+Z or Cmd+Y
      if ((isMod && e.shiftKey && e.key === 'z') || (isMod && e.key === 'y')) {
        e.preventDefault();
        redo();
      }

      // Delete: Backspace or Delete (when a block is selected)
      if (selectedBlockId && (e.key === 'Backspace' || e.key === 'Delete')) {
        // Make sure we really want to delete - maybe check focus
        e.preventDefault();
        deleteBlock(currentPageIndex, selectedBlockId);
      }

      // Shortcuts without Modifiers
      if (!isMod) {
        // T for Text Block
        if (e.key.toLowerCase() === 't') {
          addBlock(currentPageIndex, {
            id: `block-${Date.now()}`,
            type: 'text',
            L1: { content: '', lang: meta?.source_lang || 'en' },
            L2: { content: '', lang: meta?.target_lang || 'en' },
            layout: 'side-by-side'
          } as any);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteBlock, selectedBlockId, currentPageIndex, addBlock, meta, handleManualSave, handleAiGenerate]);
}

// Hook for components to listen to AI generate events
export function useAiGenerateListener(callback: (detail: { blockId: string | null; pageIndex: number }) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };
    
    window.addEventListener(AI_GENERATE_EVENT, handler);
    return () => window.removeEventListener(AI_GENERATE_EVENT, handler);
  }, [callback]);
}
