// src/components/editor/TranslationDiffView.tsx
// PURPOSE: Show diff (red/green) when AI regenerates a translation
// ACTION: Displays word-level changes between old and new translations
// MECHANISM: Uses diff algorithm to highlight insertions, deletions, and modifications

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════
// DIFF ALGORITHM
// ═══════════════════════════════════════════

type DiffType = 'equal' | 'insert' | 'delete';

interface DiffSegment {
  type: DiffType;
  value: string;
}

/**
 * Simple word-level diff algorithm
 * Uses Longest Common Subsequence (LCS) approach
 */
function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  
  // Build LCS table
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to build diff
  const diff: DiffSegment[] = [];
  let i = m, j = n;
  const result: DiffSegment[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'equal', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: newWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'delete', value: oldWords[i - 1] });
      i--;
    }
  }
  
  // Merge adjacent segments of the same type
  const merged: DiffSegment[] = [];
  for (const segment of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === segment.type) {
      merged[merged.length - 1].value += segment.value;
    } else {
      merged.push({ ...segment });
    }
  }
  
  return merged;
}

// ═══════════════════════════════════════════
// DIFF VIEW COMPONENT
// ═══════════════════════════════════════════

interface TranslationDiffViewProps {
  originalText: string;
  newText: string;
  onAccept: (newText: string) => void;
  onReject: () => void;
  onRevert?: () => void;
  blockId?: string;
  showSideBySide?: boolean;
}

export function TranslationDiffView({
  originalText,
  newText,
  onAccept,
  onReject,
  onRevert,
  blockId,
  showSideBySide = false,
}: TranslationDiffViewProps) {
  const t = useTranslations('Editor');
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>(
    showSideBySide ? 'side-by-side' : 'inline'
  );
  
  const diff = useMemo(() => computeWordDiff(originalText, newText), [originalText, newText]);
  
  // Calculate change statistics
  const stats = useMemo(() => {
    let insertions = 0;
    let deletions = 0;
    
    for (const segment of diff) {
      if (segment.type === 'insert') {
        insertions += segment.value.trim().split(/\s+/).filter(Boolean).length;
      } else if (segment.type === 'delete') {
        deletions += segment.value.trim().split(/\s+/).filter(Boolean).length;
      }
    }
    
    return { insertions, deletions, total: insertions + deletions };
  }, [diff]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border rounded-lg shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{t('translationChanges')}</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              +{stats.insertions}
            </span>
            <span className="inline-flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              -{stats.deletions}
            </span>
          </div>
        </div>
        
        {/* View mode toggle */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setViewMode('inline')}
            className={`px-2 py-1 rounded ${viewMode === 'inline' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Inline
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-2 py-1 rounded ${viewMode === 'side-by-side' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Side by Side
          </button>
        </div>
      </div>
      
      {/* Diff content */}
      <div className="p-4">
        {viewMode === 'inline' ? (
          <div className="text-sm leading-relaxed">
            {diff.map((segment, index) => (
              <span
                key={index}
                className={
                  segment.type === 'insert'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                    : segment.type === 'delete'
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 line-through'
                    : ''
                }
              >
                {segment.value}
              </span>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {t('original')}
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-sm border border-red-200 dark:border-red-800">
                {originalText}
              </div>
            </div>
            
            {/* Arrow */}
            <ArrowRight className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hidden md:block" />
            
            {/* New */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t('suggested')}
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800">
                {newText}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-muted/30 border-t">
        {onRevert && (
          <Button variant="ghost" size="sm" onClick={onRevert} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-1" />
            {t('revert')}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onReject}>
          <X className="h-4 w-4 mr-1" />
          {t('reject')}
        </Button>
        <Button size="sm" onClick={() => onAccept(newText)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Check className="h-4 w-4 mr-1" />
          {t('acceptChanges')}
        </Button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// HOOK FOR MANAGING PENDING DIFFS
// ═══════════════════════════════════════════

interface PendingDiff {
  blockId: string;
  originalText: string;
  newText: string;
  timestamp: number;
}

export function useTranslationDiffs() {
  const [pendingDiffs, setPendingDiffs] = useState<Map<string, PendingDiff>>(new Map());
  
  const addPendingDiff = (blockId: string, originalText: string, newText: string) => {
    setPendingDiffs(prev => {
      const next = new Map(prev);
      next.set(blockId, {
        blockId,
        originalText,
        newText,
        timestamp: Date.now(),
      });
      return next;
    });
  };
  
  const acceptDiff = (blockId: string): string | null => {
    const diff = pendingDiffs.get(blockId);
    if (!diff) return null;
    
    setPendingDiffs(prev => {
      const next = new Map(prev);
      next.delete(blockId);
      return next;
    });
    
    return diff.newText;
  };
  
  const rejectDiff = (blockId: string) => {
    setPendingDiffs(prev => {
      const next = new Map(prev);
      next.delete(blockId);
      return next;
    });
  };
  
  const getPendingDiff = (blockId: string): PendingDiff | undefined => {
    return pendingDiffs.get(blockId);
  };
  
  const hasPendingDiff = (blockId: string): boolean => {
    return pendingDiffs.has(blockId);
  };
  
  const clearAllDiffs = () => {
    setPendingDiffs(new Map());
  };
  
  return {
    pendingDiffs,
    addPendingDiff,
    acceptDiff,
    rejectDiff,
    getPendingDiff,
    hasPendingDiff,
    clearAllDiffs,
    pendingCount: pendingDiffs.size,
  };
}
