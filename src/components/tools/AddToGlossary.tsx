// src/components/tools/AddToGlossary.tsx
// PURPOSE: Button component for adding selected text to the Glossary Guard
// ACTION: Opens a popover to configure the term pair and add it to the glossary
// MECHANISM: Uses the glossaryStore for persistence

'use client';

import { useState } from 'react';
import { useGlossaryStore } from '@/lib/store/glossaryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Plus, Check, ArrowRight } from 'lucide-react';
import { GlossaryCategory, GLOSSARY_CATEGORIES } from '@/types/glossaryGuard';
import { useTranslations } from 'next-intl';

interface AddToGlossaryProps {
  /** The selected text that will become the source term */
  selectedText: string;
  /** The corresponding text from the other language pane (if available) */
  correspondingText?: string;
  /** Which language pane the selected text is from */
  sourceLanguage?: 'L1' | 'L2';
  /** Callback when term is successfully added */
  onAdded?: () => void;
  /** Additional class name */
  className?: string;
}

export function AddToGlossary({
  selectedText,
  correspondingText = '',
  sourceLanguage = 'L1',
  onAdded,
  className,
}: AddToGlossaryProps) {
  const t = useTranslations('GlossaryGuard');
  const { addEntry, findEntry } = useGlossaryStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [sourceTerm, setSourceTerm] = useState(selectedText);
  const [targetTerm, setTargetTerm] = useState(correspondingText);
  const [category, setCategory] = useState<GlossaryCategory>('custom');
  const [isAdded, setIsAdded] = useState(false);

  // Check if this term already exists
  const existingEntry = findEntry(selectedText, sourceLanguage);

  const handleAdd = () => {
    if (!sourceTerm.trim() || !targetTerm.trim()) return;

    addEntry(sourceTerm.trim(), targetTerm.trim(), {
      category,
      caseSensitive: false,
      wholeWord: true,
    });

    setIsAdded(true);
    
    // Reset after animation
    setTimeout(() => {
      setIsOpen(false);
      setIsAdded(false);
      onAdded?.();
    }, 800);
  };

  // Swap if L2 was selected
  const handleOpen = (open: boolean) => {
    if (open) {
      if (sourceLanguage === 'L2') {
        // Swap: the selected text becomes TARGET
        setSourceTerm(correspondingText);
        setTargetTerm(selectedText);
      } else {
        setSourceTerm(selectedText);
        setTargetTerm(correspondingText);
      }
    }
    setIsOpen(open);
  };

  if (existingEntry) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 text-[10px] text-emerald-600 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        <span>{t('termExists')}</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`p-1.5 rounded transition-all hover:bg-emerald-500/20 text-emerald-600 ${className}`}
          title={t('addToGlossary')}
        >
          <Shield className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 overflow-hidden" 
        align="start"
        sideOffset={8}
      >
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border-b flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {t('addToGlossary')}
          </span>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Term Pair */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-muted-foreground uppercase">
                {t('source')} (L1)
              </label>
              <Input
                value={sourceTerm}
                onChange={(e) => setSourceTerm(e.target.value)}
                className="h-8 text-xs"
                placeholder="Original term..."
              />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mt-4 shrink-0" />
            <div className="flex-1 space-y-1">
              <label className="text-[9px] text-muted-foreground uppercase">
                {t('target')} (L2)
              </label>
              <Input
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                className="h-8 text-xs"
                placeholder="Translation..."
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground uppercase">
              {t('category')}
            </label>
            <Select value={category} onValueChange={(v) => setCategory(v as GlossaryCategory)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GLOSSARY_CATEGORIES).map(([key, { label, icon }]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAdd}
            disabled={!sourceTerm.trim() || !targetTerm.trim() || isAdded}
            className={`w-full gap-2 text-xs font-bold transition-all ${
              isAdded 
                ? 'bg-emerald-600 hover:bg-emerald-600' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-3 w-3" />
                {t('added')}
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                {t('addTerm')}
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
