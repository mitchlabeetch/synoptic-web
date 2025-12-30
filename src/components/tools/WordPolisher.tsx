// src/components/tools/WordPolisher.tsx
// PURPOSE: Word polishing tool using Datamuse API
// ACTION: Provides synonym and rhyme suggestions when text is selected
// MECHANISM: Fetches from datamuse.com and allows one-click word replacement

'use client';

import { useState, useEffect } from 'react';
import { wordPolisher, DatamuseResult } from '@/services/datamuse';
import { Sparkles, Book, Music, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

interface WordPolisherProps {
  selectedText: string;
  onReplace: (newWord: string) => void;
  disabled?: boolean;
}

export function WordPolisher({ selectedText, onReplace, disabled = false }: WordPolisherProps) {
  const [results, setResults] = useState<DatamuseResult[]>([]);
  const [mode, setMode] = useState<'synonym' | 'rhyme'>('synonym');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Auto-fetch when mode or text changes
  useEffect(() => {
    if (!selectedText || !open) return;
    
    setLoading(true);
    const fetcher = mode === 'synonym' 
      ? wordPolisher.getSynonyms(selectedText)
      : wordPolisher.getRhymes(selectedText);
      
    fetcher
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedText, mode, open]);

  const handleSelect = (word: string) => {
    onReplace(word);
    setOpen(false);
  };

  if (!selectedText || disabled) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-purple-600 hover:bg-purple-50 hover:text-purple-700 h-7 px-2"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Improve</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" sideOffset={5}>
        {/* Mode Tabs */}
        <div className="flex gap-1 mb-3 border-b pb-2">
          <Button 
            variant={mode === 'synonym' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setMode('synonym')}
            className="flex-1 text-xs h-7 gap-1"
          >
            <Book className="w-3 h-3" /> Meaning
          </Button>
          <Button 
            variant={mode === 'rhyme' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setMode('rhyme')}
            className="flex-1 text-xs h-7 gap-1"
          >
            <Music className="w-3 h-3" /> Rhyme
          </Button>
        </div>

        {/* Word being polished */}
        <div className="mb-2 text-[10px] text-muted-foreground">
          Suggestions for: <span className="font-bold text-foreground">&ldquo;{selectedText}&rdquo;</span>
        </div>

        {/* Results */}
        <div className="grid gap-0.5 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Polishing...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              No suggestions found for this word.
            </div>
          ) : (
            results.map((res, idx) => (
              <button
                key={`${res.word}-${idx}`}
                onClick={() => handleSelect(res.word)}
                className="text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center justify-between group transition-colors"
              >
                <span className="font-medium">{res.word}</span>
                {/* Show definition tooltip if available */}
                {res.defs && res.defs[0] && (
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[120px] ml-2">
                    {res.defs[0].split('\t')[1] || res.defs[0]}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Powered by badge */}
        <div className="mt-3 pt-2 border-t flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60">
          <Sparkles className="w-2.5 h-2.5" />
          Powered by Datamuse
        </div>
      </PopoverContent>
    </Popover>
  );
}
