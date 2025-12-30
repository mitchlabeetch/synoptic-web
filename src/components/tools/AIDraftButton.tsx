// src/components/tools/AIDraftButton.tsx
// PURPOSE: AI-powered translation draft button using LibreTranslate
// ACTION: Provides quick L1→L2 draft translations for selected text
// MECHANISM: Integrates with LibreTranslate API for free machine translation

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Languages, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { libreTranslate } from '@/services/libreTranslate';
import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';

interface AIDraftButtonProps {
  selectedText: string;
  onApply?: (translation: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AIDraftButton({ 
  selectedText, 
  onApply, 
  disabled = false,
  className 
}: AIDraftButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { meta } = useProjectStore();
  const sourceLang = meta?.source_lang || 'en';
  const targetLang = meta?.target_lang || 'fr';

  const handleTranslate = useCallback(async () => {
    if (!selectedText) return;

    setLoading(true);
    setError(null);
    setTranslation('');

    try {
      const result = await libreTranslate.translate(
        selectedText,
        sourceLang,
        targetLang
      );
      setTranslation(result.translatedText);
    } catch (e) {
      setError((e as Error).message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  }, [selectedText, sourceLang, targetLang]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [translation]);

  const handleApply = useCallback(() => {
    if (onApply && translation) {
      onApply(translation);
      setOpen(false);
    }
  }, [onApply, translation]);

  // Auto-translate when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && selectedText && !translation) {
      handleTranslate();
    }
  };

  if (!selectedText || disabled) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-7 px-2',
            className
          )}
        >
          <Languages className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">AI Draft</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" sideOffset={5}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">AI Translation Draft</h4>
            <p className="text-[10px] text-muted-foreground">
              {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Original Text */}
        <div className="mb-3 p-2 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-1">Original:</p>
          <p className="text-sm line-clamp-3">{selectedText}</p>
        </div>

        {/* Translation Result */}
        <div className="mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Translating...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                className="mt-2 text-xs h-7"
              >
                Try Again
              </Button>
            </div>
          ) : translation ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1 font-medium">
                Translation:
              </p>
              <p className="text-sm">{translation}</p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {translation && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1 text-xs h-8 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </Button>
            {onApply && (
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1 text-xs h-8"
              >
                Apply to L2
              </Button>
            )}
          </div>
        )}

        {/* Powered by */}
        <div className="mt-3 pt-2 border-t flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60">
          <Languages className="w-2.5 h-2.5" />
          Powered by LibreTranslate
        </div>
      </PopoverContent>
    </Popover>
  );
}
