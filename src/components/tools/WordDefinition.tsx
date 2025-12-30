// src/components/tools/WordDefinition.tsx
// PURPOSE: Double-click word definition popup using Dictionary API
// ACTION: Shows instant word definitions with pronunciation and examples
// MECHANISM: Combines Free Dictionary API and Wiktionary for comprehensive results

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Book, 
  Loader2, 
  Volume2, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { dictionary, DictionaryEntry } from '@/services/dictionary';
import { cn } from '@/lib/utils';

interface WordDefinitionProps {
  word: string;
  lang?: string;
  onClose?: () => void;
  position?: { x: number; y: number };
  className?: string;
}

export function WordDefinition({ 
  word, 
  lang = 'en',
  onClose,
  position,
  className 
}: WordDefinitionProps) {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch definition when word changes
  useEffect(() => {
    if (!word || word.trim().length < 2) {
      setEntry(null);
      return;
    }

    setLoading(true);
    setError(null);

    dictionary.lookup(word.trim(), lang)
      .then(result => {
        if (result) {
          setEntry(result);
        } else {
          setError('Word not found');
        }
      })
      .catch(e => {
        setError((e as Error).message || 'Lookup failed');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [word, lang]);

  // Play pronunciation audio
  const handlePlayAudio = useCallback(() => {
    if (!entry) return;
    
    const audioUrl = dictionary.getAudioUrl(entry);
    if (!audioUrl) return;

    setIsPlaying(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  }, [entry]);

  if (!word || word.trim().length < 2) return null;

  const phonetic = entry ? dictionary.getPhonetic(entry) : null;
  const hasAudio = entry ? !!dictionary.getAudioUrl(entry) : false;

  return (
    <div 
      className={cn(
        'w-80 bg-popover border border-border rounded-xl shadow-xl p-4 animate-in fade-in-0 zoom-in-95',
        className
      )}
      style={position ? {
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 50,
      } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg leading-tight">{word}</h3>
          {phonetic && (
            <p className="text-sm text-muted-foreground font-mono">{phonetic}</p>
          )}
        </div>
        {hasAudio && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className="h-8 w-8 p-0"
          >
            <Volume2 className={cn('w-4 h-4', isPlaying && 'animate-pulse text-primary')} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[250px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Looking up...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : entry ? (
          <div className="space-y-4">
            {/* Etymology (if available) */}
            {entry.origin && (
              <div className="p-2 bg-muted/30 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                  Origin
                </p>
                <p className="text-xs italic">{entry.origin}</p>
              </div>
            )}

            {/* Meanings by part of speech */}
            {entry.meanings.map((meaning, idx) => (
              <div key={idx}>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  {meaning.partOfSpeech}
                </p>
                <ol className="space-y-2 pl-4 list-decimal list-outside">
                  {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                    <li key={dIdx} className="text-sm">
                      <span>{def.definition}</span>
                      {def.example && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          &ldquo;{def.example}&rdquo;
                        </p>
                      )}
                      {def.synonyms && def.synonyms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {def.synonyms.slice(0, 4).map((syn, sIdx) => (
                            <span 
                              key={sIdx}
                              className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full"
                            >
                              {syn}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground/60 flex items-center gap-1">
          <Book className="w-2.5 h-2.5" />
          Free Dictionary API
        </span>
        {entry?.sourceUrl && (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            More <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * WordDefinitionTrigger - Wrap around text to enable double-click definitions
 */
interface WordDefinitionTriggerProps {
  children: React.ReactNode;
  lang?: string;
  className?: string;
}

export function WordDefinitionTrigger({ 
  children, 
  lang = 'en',
  className 
}: WordDefinitionTriggerProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    // Check if it's a single word
    if (text && /^[a-zA-ZÀ-ÿ'-]+$/.test(text)) {
      setSelectedWord(text);
      setPopupPosition({
        x: Math.min(e.clientX, window.innerWidth - 340), // Keep popup on screen
        y: Math.min(e.clientY + 10, window.innerHeight - 350),
      });
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedWord(null);
    setPopupPosition(null);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!selectedWord) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.word-definition-popup')) {
        handleClose();
      }
    };

    // Close on escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedWord, handleClose]);

  return (
    <>
      <div 
        className={cn('word-definition-trigger', className)} 
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </div>
      
      {selectedWord && popupPosition && (
        <div className="word-definition-popup">
          <WordDefinition
            word={selectedWord}
            lang={lang}
            position={popupPosition}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  );
}
