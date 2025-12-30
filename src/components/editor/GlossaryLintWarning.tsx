// src/components/editor/GlossaryLintWarning.tsx
// PURPOSE: Displays inline lint warnings when terminology is inconsistent
// ACTION: Shows visual indicators for terms that don't match the glossary
// MECHANISM: Renders warning badges with quick-fix options

'use client';

import { useState } from 'react';
import { useGlossaryStore, useGlossaryWarningsForBlock } from '@/lib/store/glossaryStore';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  X, 
  Shield,
  Lightbulb
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TermLintWarning } from '@/types/glossaryGuard';

interface GlossaryLintWarningProps {
  blockId: string;
  onFix?: (oldText: string, newText: string) => void;
  className?: string;
}

export function GlossaryLintWarning({ 
  blockId, 
  onFix,
  className 
}: GlossaryLintWarningProps) {
  const t = useTranslations('GlossaryGuard');
  const warnings = useGlossaryWarningsForBlock(blockId);
  const { dismissWarning } = useGlossaryStore();
  
  if (warnings.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {warnings.map((warning) => (
        <LintWarningBadge
          key={warning.id}
          warning={warning}
          onFix={onFix}
          onDismiss={() => dismissWarning(warning.id)}
        />
      ))}
    </div>
  );
}

interface LintWarningBadgeProps {
  warning: TermLintWarning;
  onFix?: (oldText: string, newText: string) => void;
  onDismiss: () => void;
}

function LintWarningBadge({ warning, onFix, onDismiss }: LintWarningBadgeProps) {
  const t = useTranslations('GlossaryGuard');
  const [isOpen, setIsOpen] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFix = () => {
    onFix?.(warning.foundTerm, warning.expectedTerm);
    setIsFixed(true);
    setTimeout(() => {
      setIsOpen(false);
      onDismiss();
    }, 500);
  };

  const severityColors = {
    warning: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
    error: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`
            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
            border transition-all cursor-pointer hover:shadow-sm
            ${severityColors[warning.severity]}
          `}
        >
          <AlertTriangle className="h-3 w-3" />
          <span className="max-w-[80px] truncate">
            "{warning.foundTerm}"
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden" align="start">
        {/* Header */}
        <div className={`p-2 border-b flex items-center gap-2 ${severityColors[warning.severity]}`}>
          <Shield className="h-4 w-4" />
          <span className="text-xs font-bold">{t('inconsistentTerm')}</span>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* The Problem */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">
              {t('found')}
            </p>
            <p className="text-sm font-medium text-foreground">
              "{warning.foundTerm}"
            </p>
          </div>

          {/* The Suggestion */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {t('shouldBe')}
              </p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
                "{warning.expectedTerm}"
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="flex-1 h-8 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              {t('dismiss')}
            </Button>
            <Button
              size="sm"
              onClick={handleFix}
              disabled={isFixed}
              className="flex-1 h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isFixed ? (
                <>
                  <Check className="h-3 w-3" />
                  {t('fixed')}
                </>
              ) : (
                <>
                  <ArrowRight className="h-3 w-3" />
                  {t('applyFix')}
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════
// INLINE WARNING OVERLAY
// ═══════════════════════════════════════════

interface GlossaryWarningOverlayProps {
  blockId: string;
  content: string;
  className?: string;
}

/**
 * A transparent overlay that highlights problematic terms in the text.
 * Used to visually indicate where terminology issues exist.
 */
export function GlossaryWarningOverlay({ 
  blockId,
  content, 
  className 
}: GlossaryWarningOverlayProps) {
  const warnings = useGlossaryWarningsForBlock(blockId);
  const { highlightWarnings } = useGlossaryStore();
  
  if (!highlightWarnings || warnings.length === 0) return null;

  // Create highlighted spans for each warning
  // This is a simplified version - in production you'd use proper DOM diffing
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* 
        In a full implementation, this would render positioned highlights
        over the actual text. For now, we rely on the badge indicators.
      */}
    </div>
  );
}
