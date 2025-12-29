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
      { text: "The ", role: "other" },
      { text: "ultimate ", role: "adjective" },
      { text: "bilingual ", role: "other", highlight: true },
      { text: "studio", role: "noun" }
    ],
    arrow: [1, 3]
  },
  fr: {
    segments: [
      { text: "Le ", role: "other" },
      { text: "studio ", role: "noun" },
      { text: "bilingue ", role: "other", highlight: true },
      { text: "ultime", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  es: {
    segments: [
      { text: "El ", role: "other" },
      { text: "estudio ", role: "noun" },
      { text: "bilingüe ", role: "other", highlight: true },
      { text: "definitivo", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  de: {
    segments: [
      { text: "Das ", role: "other" },
      { text: "ultimative ", role: "adjective" },
      { text: "zweisprachige ", role: "other", highlight: true },
      { text: "studio", role: "noun" }
    ],
    arrow: [1, 3]
  },
  it: {
    segments: [
      { text: "Lo ", role: "other" },
      { text: "studio ", role: "noun" },
      { text: "bilingue ", role: "other", highlight: true },
      { text: "definitivo", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  ar: {
    segments: [
      { text: "ال", role: "other" },
      { text: "استوديو ", role: "noun" },
      { text: "ثنائي اللغة ", role: "other", highlight: true },
      { text: "المثالي", role: "adjective" }
    ],
    arrow: [3, 1]
  },
  ja: {
    segments: [
      { text: "究極", role: "adjective" },
      { text: "の", role: "other" },
      { text: "バイリンガル", role: "other", highlight: true },
      { text: "スタジオ", role: "noun" }
    ],
    arrow: [0, 3]
  }
};

const getLangData = (code: string) => LANGUAGES_ANNOTATIONS[code] || LANGUAGES_ANNOTATIONS.en;

const ROLE_COLORS = {
  article: "#30b8c8", 
  adjective: "#f9726e", 
  noun: "#22687a", 
  other: "currentColor"
};

/**
 * Advanced Curve Logic to avoid word crossing.
 */
function CurvedArrow({ fromRef, toRef, containerRef, color, isRTL }: { fromRef: HTMLElement | null; toRef: HTMLElement | null; containerRef: React.RefObject<HTMLDivElement | null>; color: string; isRTL?: boolean }) {
  const [path, setPath] = useState("");
  const [endPos, setEndPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!fromRef || !toRef || !containerRef.current) return;

    const updatePath = () => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const fromRect = fromRef.getBoundingClientRect();
      const toRect = toRef.getBoundingClientRect();

      const isRTL_context = isRTL;
      
      // Determine if we should go TOP or BOTTOM to avoid other words
      // Default to BOTTOM for standard bilingual look, but allow TOP if it looks cleaner
      const useTop = false; // We can add logic here if needed
      
      const startX = fromRect.left - containerRect.left + fromRect.width / 2;
      const endX = toRect.left - containerRect.left + toRect.width / 2;
      
      let startY, endY, midY;
      const padding = 6;
      const dist = Math.abs(startX - endX);

      if (useTop) {
        startY = fromRect.top - containerRect.top - padding;
        endY = toRect.top - containerRect.top - padding;
        midY = Math.min(startY, endY) - Math.min(80, dist * 0.5);
      } else {
        startY = fromRect.top - containerRect.top + fromRect.height + padding;
        endY = toRect.top - containerRect.top + toRect.height + padding;
        midY = Math.max(startY, endY) + Math.min(80, dist * 0.5);
      }

      const isWrapped = Math.abs(fromRect.top - toRect.top) > 20;
      let midX = (startX + endX) / 2;
      
      if (isWrapped) {
        const curveOutward = isRTL_context ? -80 : 80;
        midX = Math.min(startX, endX) - curveOutward;
        midY = (startY + endY) / 2;
      }

      setPath(`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
      setEndPos({ x: endX, y: endY });
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updatePath);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePath);
    };
  }, [fromRef, toRef, containerRef, isRTL]);

  if (!path) return null;

  return (
    <motion.svg className="absolute inset-0 pointer-events-none z-10 overflow-visible" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.path 
        d={path} 
        fill="transparent" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 1, ease: "easeInOut" }} 
      />
      <motion.circle 
        cx={endPos.x} 
        cy={endPos.y} 
        r="2" 
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
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
          setTimeout(onComplete, 1333);
        }, 200);
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
    }, 45);

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
              "text-5xl md:text-6xl lg:text-8xl tracking-tight leading-[1.3] inline-block transition-colors duration-500 whitespace-pre relative",
              showAnnotations && s.role === 'noun' ? 'font-bold' : 'font-medium'
            )}
          >
            {s.text.slice(0, displayChars)}
            
            {showAnnotations && s.highlight && (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute inset-x-0 bottom-[5%] h-[40%] bg-[#30b8c8]/40 -z-10 origin-left rounded-lg blur-[4px]"
              />
            )}
            
            {isCurrentlyTyping && displayChars < s.text.length && (
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-[2px] h-[0.7em] bg-primary ml-0.5 align-middle"
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
          isRTL={langCode === 'ar'}
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
  const [animationStage, setAnimationStage] = useState<'sync' | 'cycling' | 'dwell'>('sync');

  const rotationLanguages = useMemo(() => {
    return Object.keys(LANGUAGES_ANNOTATIONS).filter(code => code !== currentLocale);
  }, [currentLocale]);

  const currentLangCode = rotationLanguages[currentLangIndex];

  const handleSyncComplete = () => {
    setAnimationStage('cycling');
  };

  const handleCycleComplete = () => {
    setAnimationStage('dwell');
    setTimeout(() => {
      setCurrentLangIndex((prev) => (prev + 1) % rotationLanguages.length);
      setAnimationStage('cycling');
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }, 833);
  };

  return (
    <section className="relative pt-8 pb-16 md:pt-10 md:pb-32 overflow-hidden bg-background">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(48,184,200,0.05),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(249,114,110,0.03),transparent_60%)] -z-10" />
      
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.995, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative mx-auto max-w-[1240px]"
        >
          {/* Studio Interface Mockup */}
          <div className="rounded-[3rem] border border-border/30 bg-card/20 backdrop-blur-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden font-sans">
            {/* Window Controls */}
            <div className="h-12 border-b bg-muted/5 flex items-center px-8 justify-between">
              <div className="flex gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/20" />
              </div>
              <div className="flex items-center gap-6">
                <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-700", isSaving ? "bg-primary animate-pulse scale-125" : "bg-muted-foreground/10")} />
                <Save className={cn("h-3.5 w-3.5 transition-colors duration-500", isSaving ? "text-primary" : "text-muted-foreground/10")} />
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="hidden lg:flex w-14 border-r flex-col items-center py-10 gap-10 bg-muted/5">
                {[Shapes, Layers, Globe, Zap].map((Icon, i) => (
                  <Icon key={i} className={cn("h-5.5 w-5.5 transition-all duration-500", i === 2 ? "text-primary opacity-100" : "text-muted-foreground/10")} />
                ))}
              </div>

              {/* Translation Panels */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-[300px] md:min-h-[400px] relative">
                
                {/* Visual Separator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[50%] bg-border/60 hidden lg:block" />

                <div className="flex-1 p-8 md:p-12 lg:p-10 flex flex-col justify-center">
                   <AnnotatedSentence 
                      langCode={currentLocale} 
                      active={animationStage === 'sync'} 
                      staticMode={animationStage === 'cycling' || animationStage === 'dwell'}
                      onComplete={handleSyncComplete} 
                   />
                </div>

                <div className="flex-1 p-8 md:p-12 lg:p-10 flex flex-col justify-center bg-muted/5">
                   <AnnotatedSentence 
                      langCode={currentLangCode} 
                      active={animationStage === 'sync' || animationStage === 'cycling'} 
                      onComplete={handleCycleComplete}
                   />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marketing Copy */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.7 }}
           className="mt-12 text-center max-w-5xl mx-auto space-y-8 pb-10"
        >
           <h1 className="text-4xl md:text-6xl lg:text-[8rem] font-bold tracking-tighter font-outfit leading-[0.85] text-foreground">
              {t('titlePlain')}
           </h1>
           <p className="text-muted-foreground font-medium text-lg md:text-xl leading-relaxed px-12 font-quicksand opacity-80">
              {t('subtitle')}
           </p>
           <div className="pt-4">
             <Link href="/auth/login" className="inline-block">
                <Button size="lg" className="h-16 px-12 font-bold rounded-full gap-5 text-xl shadow-lg shadow-primary/10 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 font-outfit">
                  {t('ctaPrimary')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
             </Link>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
