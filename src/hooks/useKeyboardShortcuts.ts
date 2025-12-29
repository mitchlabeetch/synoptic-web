// src/hooks/useKeyboardShortcuts.ts
'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';

export function useKeyboardShortcuts() {
  const { 
    undo, 
    redo, 
    currentPageIndex, 
    selectedBlockId, 
    deleteBlock,
    addBlock,
    meta
  } = useProjectStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        // Still allow Undo/Redo/Save if relevant, but let browser handle it in fields
        // For Synoptic, we want the project-level undo even in fields? 
        // Usually, cmd+z in an input is local. Let's only intercept if NOT in input.
        
        // EXCEPTION: Cmd+K for Palette should always work
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) return;
        
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

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
            L1: { content: '', lang: meta?.source_lang || 'fr' },
            L2: { content: '', lang: meta?.target_lang || 'en' },
            layout: 'side-by-side'
          } as any);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteBlock, selectedBlockId, currentPageIndex, addBlock, meta]);
}
