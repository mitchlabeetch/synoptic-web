// src/components/tools/SynonymMenu.tsx
// PURPOSE: Right-click context menu for synonym suggestions
// ACTION: Provides thesaurus lookup with one-click word replacement
// MECHANISM: Uses Datamuse API for comprehensive word relationships

'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { 
  Wand2, 
  Loader2, 
  BookOpen,
  ArrowRightLeft,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { synonymsService, SynonymResult } from '@/services/synonyms';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SynonymMenuProps {
  children: React.ReactNode;
  onReplace?: (newWord: string) => void;
  getSelectedText?: () => string | null;
  className?: string;
}

export function SynonymMenu({ 
  children, 
  onReplace,
  getSelectedText,
  className 
}: SynonymMenuProps) {
  const [loading, setLoading] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [synonyms, setSynonyms] = useState<SynonymResult[]>([]);
  const [antonyms, setAntonyms] = useState<SynonymResult[]>([]);
  const [related, setRelated] = useState<SynonymResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Tools.synonyms');

  // Fetch synonyms when menu opens with a word
  const handleOpenChange = useCallback(async (open: boolean) => {
    if (!open) {
      setActiveWord(null);
      setSynonyms([]);
      setAntonyms([]);
      setRelated([]);
      return;
    }

    // Get selected text
    const selection = getSelectedText?.() || window.getSelection()?.toString().trim();
    
    // Check if it's a single word
    if (!selection || !/^[a-zA-ZÀ-ÿ'-]+$/.test(selection) || selection.length < 2) {
      setActiveWord(null);
      return;
    }

    setActiveWord(selection);
    setLoading(true);
    setError(null);

    try {
      const [syns, ants, rel] = await Promise.all([
        synonymsService.getSynonyms(selection, 15),
        synonymsService.getAntonyms(selection, 5),
        synonymsService.getRelated(selection, 5),
      ]);

      setSynonyms(syns);
      setAntonyms(ants);
      setRelated(rel);
    } catch (e) {
      setError((e as Error).message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }, [getSelectedText]);

  const handleSelectWord = useCallback((word: string) => {
    if (onReplace) {
      onReplace(word);
    }
  }, [onReplace]);

  // Group synonyms by part of speech
  const groupedSynonyms = synonymsService.groupByPartOfSpeech(synonyms);

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger className={className}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* If we have a word selected */}
        {activeWord && (
          <>
            {/* Header showing the word */}
            <div className="px-2 py-1.5 border-b mb-1">
              <p className="text-xs text-muted-foreground">
                {t('synonymsFor')} <span className="font-bold text-foreground">&ldquo;{activeWord}&rdquo;</span>
              </p>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{t('findingSynonyms')}</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="px-2 py-4 text-center">
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            )}

            {/* No results */}
            {!loading && !error && synonyms.length === 0 && antonyms.length === 0 && (
              <div className="px-2 py-4 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('noSynonymsFound')}</p>
              </div>
            )}

            {/* Synonyms by part of speech */}
            {!loading && Object.keys(groupedSynonyms).length > 0 && (
              <>
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    <span>{t('synonyms')}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {synonyms.length}
                    </span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-56">
                    {Object.entries(groupedSynonyms).map(([pos, words]) => (
                      <div key={pos}>
                        <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">
                          {pos}
                        </div>
                        {words.slice(0, 5).map((syn, idx) => (
                          <ContextMenuItem
                            key={`${syn.word}-${idx}`}
                            onClick={() => handleSelectWord(syn.word)}
                            className="justify-between"
                          >
                            <span className="font-medium">{syn.word}</span>
                            {syn.definition && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[120px] ml-2">
                                {syn.definition}
                              </span>
                            )}
                          </ContextMenuItem>
                        ))}
                      </div>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
              </>
            )}

            {/* Antonyms */}
            {!loading && antonyms.length > 0 && (
              <>
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="gap-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>{t('antonyms')}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {antonyms.length}
                    </span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    {antonyms.slice(0, 5).map((ant, idx) => (
                      <ContextMenuItem
                        key={`${ant.word}-${idx}`}
                        onClick={() => handleSelectWord(ant.word)}
                      >
                        {ant.word}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
              </>
            )}

            {/* Related words */}
            {!loading && related.length > 0 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('related')}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {related.length}
                  </span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {related.slice(0, 5).map((rel, idx) => (
                    <ContextMenuItem
                      key={`${rel.word}-${idx}`}
                      onClick={() => handleSelectWord(rel.word)}
                    >
                      {rel.word}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            <ContextMenuSeparator />
          </>
        )}

        {/* Fallback: if no word selected, show hint */}
        {!activeWord && (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t('selectWordFirst')}
            </p>
          </div>
        )}

        {/* Footer - powered by */}
        <div className="px-2 py-1.5 border-t mt-1 flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60">
          <Wand2 className="w-2.5 h-2.5" />
          {t('poweredBy')}
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
}
