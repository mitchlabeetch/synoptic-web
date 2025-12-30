// src/components/editor/tools/LinePlayer.tsx
// PURPOSE: In-app text-to-speech player for pronunciation practice
// ACTION: Uses browser's SpeechSynthesis API for instant, offline-capable audio playback
// MECHANISM: Zero-latency playback with slow mode support for learners

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Square, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LinePlayerProps {
  text: string;
  lang: string;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export function LinePlayer({ 
  text, 
  lang, 
  variant = 'default',
  className 
}: LinePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const t = useTranslations('Studio');
  
  // Track mounting status to prevent state updates on unmounted components
  const isMounted = useRef(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ───────────────────────────────────────
  // LIFECYCLE: Initialize Speech Synthesis
  // ───────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    
    // Check browser support
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Load available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (isMounted.current) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup: Cancel any ongoing speech and reset state
    return () => {
      isMounted.current = false;
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ───────────────────────────────────────
  // VOICE SELECTION: Find best voice for language
  // ───────────────────────────────────────
  const findBestVoice = useCallback((langCode: string): SpeechSynthesisVoice | undefined => {
    if (!availableVoices.length) return undefined;

    // Priority order for high-quality voices
    const qualityKeywords = ['Google', 'Microsoft', 'Apple', 'Siri', 'Natural', 'Premium', 'Enhanced'];
    
    // Exact language match with quality voice
    const qualityMatch = availableVoices.find(v => 
      v.lang.startsWith(langCode) && 
      qualityKeywords.some(kw => v.name.includes(kw))
    );
    if (qualityMatch) return qualityMatch;

    // Any exact language match
    const exactMatch = availableVoices.find(v => v.lang.startsWith(langCode));
    if (exactMatch) return exactMatch;

    // Try root language code (e.g., 'fr' from 'fr-FR')
    const rootLang = langCode.split('-')[0];
    const rootMatch = availableVoices.find(v => v.lang.startsWith(rootLang));
    if (rootMatch) return rootMatch;

    // Fallback to first available voice
    return availableVoices[0];
  }, [availableVoices]);

  // ───────────────────────────────────────
  // PLAYBACK CONTROL
  // ───────────────────────────────────────
  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent block selection

    if (!isSupported || !text.trim()) return;

    // If already playing, stop
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any previous utterance
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = isSlow ? 0.7 : 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set preferred voice
    const preferredVoice = findBestVoice(lang);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      if (isMounted.current) setIsPlaying(true);
    };
    
    utterance.onend = () => {
      if (isMounted.current) setIsPlaying(false);
    };
    
    utterance.onerror = (event) => {
      console.warn('[LinePlayer] Speech error:', event.error);
      if (isMounted.current) setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, text, lang, isPlaying, isSlow, findBestVoice]);

  // ───────────────────────────────────────
  // SPEED TOGGLE
  // ───────────────────────────────────────
  const toggleSpeed = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSlow(prev => !prev);
    
    // If currently playing, restart with new speed
    if (isPlaying && utteranceRef.current) {
      window.speechSynthesis.cancel();
      // Small delay to allow cancellation to complete
      setTimeout(() => {
        if (isMounted.current) {
          setIsPlaying(false);
        }
      }, 50);
    }
  }, [isPlaying]);

  // ───────────────────────────────────────
  // RENDER: Handle unsupported browsers
  // ───────────────────────────────────────
  if (!isSupported) {
    return (
      <div className={cn("text-muted-foreground/50", className)}>
        <VolumeX className="h-3.5 w-3.5" />
      </div>
    );
  }

  // ───────────────────────────────────────
  // RENDER: Compact variant (single icon)
  // ───────────────────────────────────────
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlay}
              disabled={!text.trim()}
              className={cn(
                "h-6 w-6 rounded-full transition-all",
                isPlaying 
                  ? 'text-primary bg-primary/10 animate-pulse' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5',
                className
              )}
            >
              {isPlaying ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">
            {isPlaying ? t('stopAudio') : t('playAudio')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ───────────────────────────────────────
  // RENDER: Default variant (with speed control)
  // ───────────────────────────────────────
  return (
    <div className={cn(
      "flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full border shadow-sm p-0.5",
      "opacity-0 group-hover/block:opacity-100 transition-opacity duration-200",
      className
    )}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlay}
              disabled={!text.trim()}
              className={cn(
                "h-6 w-6 rounded-full transition-all",
                isPlaying 
                  ? 'text-primary bg-primary/10 animate-pulse' 
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {isPlaying ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">
            {isPlaying ? t('stopAudio') : t('playAudio')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Speed Toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSpeed}
              className={cn(
                "h-6 w-6 rounded-full transition-all",
                isSlow 
                  ? 'text-primary font-bold bg-primary/10' 
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              )}
            >
              <Gauge className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">
            {isSlow ? t('normalSpeed') : t('slowMode')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Speed indicator badge */}
      {isSlow && (
        <span className="text-[9px] font-bold text-primary px-1">
          0.7×
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// EXPORT: Named exports for flexible imports
// ═══════════════════════════════════════════
export default LinePlayer;
