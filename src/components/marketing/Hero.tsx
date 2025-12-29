// src/components/marketing/Hero.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shapes, Save, Globe, Zap, Layers } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getLanguageLabel } from '@/data/languages';
import { cn } from '@/lib/utils';

// Shared types and data
interface Segment {
  text: string;
  role?: 'article' | 'adjective' | 'noun' | 'other';
  highlight?: boolean;
}

interface LanguageData {
  segments: Segment[];
  arrow: [number, number]; // From index to To index
}

const LANGUAGES_ANNOTATIONS: Record<string, LanguageData> = {
  en: {
    segments: [
      { text: "The ", role: "article", highlight: true },
      { text: "ultimate ", role: "adjective" },
      { text: "bilingual ", role: "other" },
      { text: "studio", role: "noun" }
    ],
    arrow: [1, 3]
  },
  fr: {
    segments: [
      { text: "Le ", role: "article", highlight: true },
      { text: "studio ", role: "noun" },
      { text: "bilingue ", role: "other" },
      { text: "ultime", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  es: {
    segments: [
      { text: "El ", role: "article", highlight: true },
      { text: "estudio ", role: "noun" },
      { text: "bilingüe ", role: "other" },
      { text: "definitivo", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  de: {
    segments: [
      { text: "Das ", role: "article", highlight: true },
      { text: "ultimative ", role: "adjective" },
      { text: "zweisprachige ", role: "other" },
      { text: "studio", role: "noun" }
    ],
    arrow: [1, 3]
  },
  it: {
    segments: [
      { text: "Lo ", role: "article", highlight: true },
      { text: "studio ", role: "noun" },
      { text: "bilingue ", role: "other" },
      { text: "definitivo", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  ar: {
    segments: [
      { text: "ال", role: "article", highlight: true },
      { text: "استوديو ", role: "noun" },
      { text: "ثنائي اللغة ", role: "other" },
      { text: "النهائي", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  ja: {
    segments: [
      { text: "究極", role: "adjective" },
      { text: "の", role: "article", highlight: true },
      { text: "バイリンガル", role: "other" },
      { text: "スタジオ", role: "noun" }
    ],
    arrow: [0, 3]
  }
};

const getLangData = (code: string) => LANGUAGES_ANNOTATIONS[code] || LANGUAGES_ANNOTATIONS.en;

// Role colors synced with app branding
const ROLE_COLORS = {
  article: "#30b8c8", // Branding Cyan
  adjective: "#f9726e", // Accent Pink
  noun: "#22687a", // Primary Teal
  other: "currentColor"
};

/**
 * Enhanced Curved Arrow that handles wrapping and positioning accurately.
 */
function CurvedArrow({ fromRef, toRef, containerRef, color }: { fromRef: HTMLElement | null; toRef: HTMLElement | null; containerRef: React.RefObject<HTMLDivElement | null>; color: string }) {
  const [path, setPath] = useState("");
  const [endPos, setEndPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!fromRef || !toRef || !containerRef.current) return;

    const updatePath = () => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const fromRect = fromRef.getBoundingClientRect();
      const toRect = toRef.getBoundingClientRect();

      // We want to anchor to the center-bottom of the word text, ignoring trailing space
      // Since we use whitespace-pre, we can't easily ignore trailing space in bounding rect
      // But we can approximate by shifting slightly if it has a space
      const startX = fromRect.left - containerRect.left + fromRect.width / 2.2;
      const startY = fromRect.top - containerRect.top + fromRect.height - 5;
      const endX = toRect.left - containerRect.left + toRect.width / 2.2;
      const endY = toRect.top - containerRect.top + toRect.height - 5;

      const sameLine = Math.abs(fromRect.top - toRect.top) < 20;
      
      let midX, midY;
      if (sameLine) {
        midX = (startX + endX) / 2;
        midY = startY + 40; // Deeper curve for clarity
      } else {
        midX = Math.min(startX, endX) - 30;
        midY = (startY + endY) / 2;
      }

      setPath(`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
      setEndPos({ x: endX, y: endY });
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    observer.observe(containerRef.current);
    // Also update on scroll since refs might shift
    window.addEventListener('resize', updatePath);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePath);
    };
  }, [fromRef, toRef, containerRef]);

  if (!path) return null;

  return (
    <motion.svg className="absolute inset-0 pointer-events-none z-10 overflow-visible" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.path 
        d={path} 
        fill="transparent" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeDasharray="4 2"
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 1.2, ease: "easeOut" }} 
      />
      <motion.circle 
        cx={endPos.x} 
        cy={endPos.y} 
        r="3" 
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      />
    </motion.svg>
  );
}

function AnnotatedSentence({ 
  langCode, 
  active, 
  onComplete,
  staticMode = false
}: { 
  langCode: string; 
  active: boolean; 
  onComplete: () => void;
  staticMode?: boolean;
}) {
  const data = getLangData(langCode);
  const [typedSegments, setTypedSegments] = useState<number>(staticMode ? data.segments.length : 0);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [showAnnotations, setShowAnnotations] = useState(staticMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (staticMode) return;
    if (!active) {
      setTypedSegments(0);
      setTypedChars(0);
      setShowAnnotations(false);
      return;
    }

    let currentSegment = 0;
    let currentChar = 0;

    const interval = setInterval(() => {
      if (currentSegment >= data.segments.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowAnnotations(true);
          setTimeout(onComplete, 3500);
        }, 600);
        return;
      }

      const segmentText = data.segments[currentSegment].text;
      if (currentChar < segmentText.length) {
        currentChar++;
        setTypedChars(currentChar);
      } else {
        currentSegment++;
        currentChar = 0;
        setTypedSegments(currentSegment);
        setTypedChars(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [active, data, onComplete, staticMode]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-0 items-baseline font-sans" dir={langCode === 'ar' ? 'rtl' : 'ltr'}>
      {data.segments.map((s, i) => {
        const isCurrentlyTyping = i === typedSegments;
        const isPastTyped = i < typedSegments;
        const displayChars = staticMode ? s.text.length : (isCurrentlyTyping ? typedChars : (isPastTyped ? s.text.length : 0));

        if (displayChars === 0 && !isPastTyped && !isCurrentlyTyping && !staticMode) return null;

        const roleColor = s.role ? ROLE_COLORS[s.role] : 'currentColor';

        return (
          <motion.span
            key={i}
            ref={el => { segmentsRefs.current[i] = el; }}
            style={{ 
              color: showAnnotations && s.role && s.role !== 'other' ? roleColor : 'inherit'
            }}
            className={cn(
              "text-5xl md:text-7xl lg:text-[7rem] tracking-tight leading-[1.1] inline-block transition-colors duration-500 whitespace-pre",
              showAnnotations && s.role === 'noun' ? 'font-bold' : 'font-medium'
            )}
          >
            {s.text.slice(0, displayChars)}
            
            {showAnnotations && s.highlight && (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute inset-x-0 bottom-[10%] h-[25%] bg-[#30b8c8]/10 -z-10 origin-left rounded-md"
              />
            )}
            
            {isCurrentlyTyping && displayChars < s.text.length && (
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-[4px] h-[0.7em] bg-primary ml-0.5 align-middle"
              />
            )}
          </motion.span>
        );
      })}

      {showAnnotations && segmentsRefs.current[data.arrow[0]] && segmentsRefs.current[data.arrow[1]] && (
        <CurvedArrow 
          fromRef={segmentsRefs.current[data.arrow[0]]!} 
          toRef={segmentsRefs.current[data.arrow[1]]!} 
          containerRef={containerRef}
          color={ROLE_COLORS.adjective} 
        />
      )}
    </div>
  );
}

export function Hero() {
  const t = useTranslations('Marketing.hero');
  const currentLocale = useLocale();
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [animationStage, setAnimationStage] = useState<'initial_left' | 'cycling_right' | 'dwell'>('initial_left');
  const [hasAnimatedLeft, setHasAnimatedLeft] = useState(false);

  const rotationLanguages = useMemo(() => {
    return Object.keys(LANGUAGES_ANNOTATIONS).filter(code => code !== currentLocale);
  }, [currentLocale]);

  const currentLangCode = rotationLanguages[currentLangIndex];

  const handleLeftComplete = () => {
    setHasAnimatedLeft(true);
    setAnimationStage('cycling_right');
  };

  const handleRightComplete = () => {
    setAnimationStage('dwell');
    setTimeout(() => {
      setCurrentLangIndex((prev) => (prev + 1) % rotationLanguages.length);
      setAnimationStage('cycling_right');
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }, 3000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-32 overflow-hidden bg-background">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative mx-auto max-w-[1400px]"
        >
          <div className="rounded-[4rem] border border-border/50 bg-card/30 backdrop-blur-[100px] shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 border-b bg-muted/5 flex items-center px-10 justify-between">
              <div className="flex gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400/20" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400/20" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-400/20" />
              </div>
              <div className="flex items-center gap-6">
                <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-700", isSaving ? "bg-primary animate-pulse scale-125" : "bg-muted-foreground/20")} />
                <Save className={cn("h-5 w-5 transition-colors duration-500", isSaving ? "text-primary" : "text-muted-foreground/20")} />
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="hidden lg:flex w-20 border-r flex-col items-center py-16 gap-12 bg-muted/5">
                {[Shapes, Layers, Globe, Zap].map((Icon, i) => (
                  <Icon key={i} className={cn("h-7 w-7 transition-all duration-500", i === 2 ? "text-primary opacity-100 drop-shadow-sm" : "text-muted-foreground/10")} />
                ))}
              </div>

              {/* Workspaces */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-[600px] md:min-h-[850px] relative">
                <div className="flex-1 p-16 md:p-24 border-b lg:border-b-0 lg:border-r border-border/10 flex flex-col justify-center">
                   <AnnotatedSentence 
                      langCode={currentLocale} 
                      active={animationStage === 'initial_left'} 
                      staticMode={hasAnimatedLeft}
                      onComplete={handleLeftComplete} 
                   />
                </div>

                <div className="flex-1 p-16 md:p-24 flex flex-col justify-center bg-muted/5">
                   <AnnotatedSentence 
                      langCode={currentLangCode} 
                      active={animationStage === 'cycling_right'} 
                      onComplete={handleRightComplete}
                   />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Branding & CTA */}
        <motion.div 
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8 }}
           className="mt-24 text-center max-w-5xl mx-auto space-y-12"
        >
           <h1 className="text-6xl md:text-8xl font-bold tracking-tighter font-sans leading-[0.85] text-foreground">
              {t('titlePlain')}
           </h1>
           <p className="text-muted-foreground font-medium text-3xl leading-relaxed px-12 opacity-80">
              {t('subtitle')}
           </p>
           <div className="pt-10">
             <Link href="/auth/login">
                <Button size="lg" className="h-20 px-16 font-black rounded-[2rem] gap-5 text-3xl shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-95">
                  {t('ctaPrimary')}
                  <ArrowRight className="h-8 w-8" />
                </Button>
             </Link>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
