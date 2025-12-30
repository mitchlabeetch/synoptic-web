// src/components/tools/GrammarChecker.tsx
// PURPOSE: Grammar checking button using LanguageTool API
// ACTION: Highlights grammar/spelling errors with inline corrections
// MECHANISM: Integrates with LanguageTool for professional-grade checking

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Loader2, 
  SpellCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { languageTool, GrammarMatch } from '@/services/languageTool';
import { useProjectStore } from '@/lib/store/projectStore';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface GrammarCheckerProps {
  text: string;
  onFix?: (fixedText: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GrammarChecker({ 
  text, 
  onFix, 
  disabled = false,
  className 
}: GrammarCheckerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<GrammarMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  const { meta } = useProjectStore();
  const targetLang = meta?.target_lang || 'en';
  const t = useTranslations('Tools.grammar');

  const handleCheck = useCallback(async () => {
    if (!text || text.trim().length < 3) return;

    setLoading(true);
    setError(null);
    setMatches([]);

    try {
      const result = await languageTool.check(text, {
        language: 'auto',
        level: 'default',
      });
      
      setMatches(result.matches);
      setDetectedLang(result.language.detectedLanguage?.name || result.language.name);
    } catch (e) {
      setError((e as Error).message || 'Grammar check failed');
    } finally {
      setLoading(false);
    }
  }, [text]);

  const handleApplyFix = useCallback((match: GrammarMatch) => {
    if (!onFix || !match.replacements.length) return;

    const replacement = match.replacements[0].value;
    const fixedText = 
      text.slice(0, match.offset) + 
      replacement + 
      text.slice(match.offset + match.length);
    
    onFix(fixedText);
    
    // Update matches to remove the fixed one
    setMatches(prev => prev.filter(m => m !== match));
  }, [text, onFix]);

  const handleApplyAll = useCallback(() => {
    if (!onFix || !matches.length) return;

    // Apply all fixes from end to start (to preserve offsets)
    let fixedText = text;
    const sortedMatches = [...matches]
      .filter(m => m.replacements.length > 0)
      .sort((a, b) => b.offset - a.offset);

    for (const match of sortedMatches) {
      const replacement = match.replacements[0].value;
      fixedText = 
        fixedText.slice(0, match.offset) + 
        replacement + 
        fixedText.slice(match.offset + match.length);
    }

    onFix(fixedText);
    setMatches([]);
  }, [text, matches, onFix]);

  // Auto-check when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && text && text.trim().length >= 3) {
      handleCheck();
    }
  };

  const getSeverityIcon = (match: GrammarMatch) => {
    const severity = languageTool.getMatchSeverity(match);
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getSeverityBg = (match: GrammarMatch) => {
    const severity = languageTool.getMatchSeverity(match);
    switch (severity) {
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  if (disabled || !text || text.trim().length < 3) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-7 px-2',
            className
          )}
        >
          <SpellCheck className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{t('button')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start" sideOffset={5}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <SpellCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{t('title')}</h4>
              {detectedLang && (
                <p className="text-[10px] text-muted-foreground">
                  Detected: {detectedLang}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheck}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">{t('checking')}</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCheck}
                className="mt-2 text-xs h-7"
              >
                {t('tryAgain')}
              </Button>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="font-medium text-sm">{t('noIssuesFound')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('textLooksGreat')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Summary */}
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg mb-3">
                <span className="text-xs font-medium">
                  {matches.length} issue{matches.length > 1 ? 's' : ''} found
                </span>
                {onFix && matches.some(m => m.replacements.length > 0) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyAll}
                    className="text-xs h-6 px-2"
                  >
                    {t('fixAll')}
                  </Button>
                )}
              </div>

              {/* Individual matches */}
              {matches.map((match, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 rounded-lg border',
                    getSeverityBg(match)
                  )}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(match)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        {match.shortMessage || match.rule.category.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {match.message}
                      </p>
                      
                      {/* Context */}
                      <div className="mt-2 p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">
                          {match.context.text.slice(0, match.context.offset)}
                        </span>
                        <span className="bg-destructive/20 text-destructive font-medium px-0.5 rounded">
                          {match.context.text.slice(
                            match.context.offset,
                            match.context.offset + match.context.length
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {match.context.text.slice(match.context.offset + match.context.length)}
                        </span>
                      </div>

                      {/* Suggestions */}
                      {match.replacements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.replacements.slice(0, 3).map((rep, i) => (
                            <button
                              key={i}
                              onClick={() => handleApplyFix(match)}
                              className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                            >
                              {rep.value || '(remove)'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Powered by */}
        <div className="mt-3 pt-2 border-t flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60">
          <SpellCheck className="w-2.5 h-2.5" />
          {t('poweredBy')}
        </div>
      </PopoverContent>
    </Popover>
  );
}
