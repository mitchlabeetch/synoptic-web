// src/components/editor/SaveStatusIndicator.tsx
// PURPOSE: Visual feedback for document save status (like Google Docs)
// ACTION: Shows "Saving...", "Saved", or "Error" states
// MECHANISM: Watches store changes and triggers auto-save debounce

'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/lib/store/projectStore';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  className?: string;
  onSave?: () => Promise<void>;
  autoSaveDelay?: number; // ms
}

export function SaveStatusIndicator({
  className,
  onSave,
  autoSaveDelay = 2000,
}: SaveStatusIndicatorProps) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const content = useProjectStore(state => state.content);
  const settings = useProjectStore(state => state.settings);
  const meta = useProjectStore(state => state.meta);
  
  // Track if there are pending changes
  const previousContentRef = useRef(content);
  
  useEffect(() => {
    // Don't auto-save if no project is loaded
    if (!meta?.id) return;
    
    // Check if content actually changed
    if (previousContentRef.current === content) return;
    previousContentRef.current = content;
    
    // Clear existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Show "saving will happen" state
    setStatus('idle');
    
    // Debounced auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setStatus('saving');
        try {
          await onSave();
          setStatus('saved');
          setLastSaved(new Date());
          
          // Reset to idle after showing "saved" briefly
          setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setStatus('error');
        }
      } else {
        // No save handler - just show saved (local-only mode)
        setStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, autoSaveDelay);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, settings, meta?.id, onSave, autoSaveDelay]);

  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-all duration-300',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-emerald-600 dark:text-emerald-400',
        status === 'error' && 'text-destructive',
        status === 'idle' && 'text-muted-foreground/60',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={
        status === 'saving' 
          ? 'Saving changes...' 
          : status === 'saved' 
            ? 'All changes saved' 
            : status === 'error'
              ? 'Failed to save changes'
              : 'Ready'
      }
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>Saved</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Save failed</span>
        </>
      )}
      
      {status === 'idle' && lastSaved && (
        <>
          <Cloud className="h-3.5 w-3.5" />
          <span title={lastSaved.toLocaleString()}>
            {formatLastSaved(lastSaved)}
          </span>
        </>
      )}
      
      {status === 'idle' && !lastSaved && (
        <>
          <CloudOff className="h-3.5 w-3.5 opacity-50" />
          <span className="opacity-50">Local only</span>
        </>
      )}
    </div>
  );
}
