// src/components/editor/tools/ArrowDrawer.tsx
// PURPOSE: UI tool for creating syntax arrows between word groups in the editor
// ACTION: Manages a state machine: "Select Source -> Select Target -> Create Arrow"
// MECHANISM: Listens to Tiptap selection events and applies ArrowAnchor marks, then stores connection

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, X, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/lib/store/projectStore';
import { useTranslations } from 'next-intl';
import type { Editor } from '@tiptap/react';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type LinkState = 'idle' | 'selecting-source' | 'selecting-target';

interface ArrowDrawerProps {
  editor: Editor | null;
  blockId: string;
  className?: string;
}

// ═══════════════════════════════════════════
// UUID GENERATOR
// ═══════════════════════════════════════════

function generateAnchorId(): string {
  return `anchor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export function ArrowDrawer({ editor, blockId, className }: ArrowDrawerProps) {
  const [linkState, setLinkState] = useState<LinkState>('idle');
  const [sourceAnchorId, setSourceAnchorId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addArrow = useProjectStore(s => s.addArrow);
  const t = useTranslations('Studio');

  // ───────────────────────────────────────
  // START LINK MODE
  // ───────────────────────────────────────
  
  const startLinkMode = useCallback(() => {
    setLinkState('selecting-source');
    setSourceAnchorId(null);
  }, []);

  // ───────────────────────────────────────
  // CANCEL LINK MODE
  // ───────────────────────────────────────
  
  const cancelLinkMode = useCallback(() => {
    setLinkState('idle');
    setSourceAnchorId(null);
    // Optionally clear any pending anchor marks here
  }, []);

  // ───────────────────────────────────────
  // HANDLE SELECTION FOR ANCHOR CREATION
  // ───────────────────────────────────────
  
  useEffect(() => {
    if (!editor || linkState === 'idle') return;

    const handleSelectionUpdate = () => {
      const { from, to, empty } = editor.state.selection;
      
      // Need a selection (not just cursor)
      if (empty || from === to) return;
      
      // Check if the selection is already an anchor
      const selectedText = editor.state.doc.textBetween(from, to);
      if (!selectedText.trim()) return;

      setIsProcessing(true);

      if (linkState === 'selecting-source') {
        // Create source anchor
        const anchorId = generateAnchorId();
        
        try {
          editor.chain()
            .focus()
            .setArrowAnchor(anchorId)
            .run();
          
          setSourceAnchorId(anchorId);
          setLinkState('selecting-target');
        } catch (e) {
          console.error('Failed to set source anchor:', e);
        }
        
      } else if (linkState === 'selecting-target' && sourceAnchorId) {
        // Create target anchor and establish connection
        const targetAnchorId = generateAnchorId();
        
        try {
          editor.chain()
            .focus()
            .setArrowAnchor(targetAnchorId)
            .run();
          
          // Add the arrow connection to the store
          addArrow({
            id: `arrow-${Date.now()}`,
            blockId,
            source: { language: 'L2', wordIndices: [] }, // Legacy compatibility
            target: { language: 'L2', wordIndices: [] },
            // New anchor-based system
            sourceGroupId: sourceAnchorId,
            targetGroupId: targetAnchorId,
            color: '#94a3b8', // Slate-400
            label: '',
          } as any);
          
          // Reset state
          setLinkState('idle');
          setSourceAnchorId(null);
          
        } catch (e) {
          console.error('Failed to create arrow:', e);
        }
      }

      setIsProcessing(false);
    };

    // Debounce to avoid rapid firing
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionUpdate, 150);
    };

    editor.on('selectionUpdate', debouncedHandler);
    
    return () => {
      clearTimeout(timeoutId);
      editor.off('selectionUpdate', debouncedHandler);
    };
  }, [editor, linkState, sourceAnchorId, blockId, addArrow]);

  // ───────────────────────────────────────
  // KEYBOARD SHORTCUT (Escape to cancel)
  // ───────────────────────────────────────
  
  useEffect(() => {
    if (linkState === 'idle') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelLinkMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [linkState, cancelLinkMode]);

  // ───────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────
  
  const isActive = linkState !== 'idle';

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {/* Main Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? "default" : "outline"}
              size="icon"
              onClick={isActive ? cancelLinkMode : startLinkMode}
              className={cn(
                "h-8 w-8 transition-all",
                isActive && "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/50"
              )}
            >
              <ArrowUpRight className={cn(
                "h-4 w-4",
                isActive && "animate-pulse"
              )} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs font-medium">
              {isActive ? t('exitPaintMode') : t('syntaxArrows')}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isActive ? 'ESC' : 'Connect words with arrows'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Status Indicator */}
        {isActive && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg",
            "animate-in slide-in-from-left-2 duration-200"
          )}>
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                linkState === 'selecting-source' 
                  ? "bg-indigo-500 text-white" 
                  : "bg-indigo-200 text-indigo-700"
              )}>
                1
              </div>
              <div className="w-3 h-px bg-indigo-300" />
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                linkState === 'selecting-target' 
                  ? "bg-indigo-500 text-white" 
                  : "bg-indigo-200 text-indigo-600"
              )}>
                2
              </div>
            </div>
            
            {/* Status text */}
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              {linkState === 'selecting-source' 
                ? 'Select source word' 
                : 'Select target word'}
            </span>

            {/* Cancel button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100"
              onClick={cancelLinkMode}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default ArrowDrawer;
