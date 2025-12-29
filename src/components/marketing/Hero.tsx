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

// Role colors as requested (as in app)
const ROLE_COLORS = {
  article: "#30b8c8", // Branding Cyan
  adjective: "#f9726e", // Accent Pink
  noun: "#22687a", // Primary Teal
  other: "currentColor"
};

/**
 * Purpose: Renders a smooth curved arrow between two elements relative to a container.
 * Action: Calculates paths on resize/render.
 * Mechanism: SVG with dasharray animation.
 */
function CurvedArrow({ fromRef, toRef, containerRef, color }: { fromRef: HTMLElement | null; toRef: HTMLElement | null; containerRef: React.RefObject<HTMLDivElement | null>; color: string }) {
  const [path, setPath] = useState("");

  useEffect(() => {
    if (!fromRef || !toRef || !containerRef.current) return;

    const updatePath = () => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const fromRect = fromRef.getBoundingClientRect();
      const toRect = toRef.getBoundingClientRect();

      const startX = fromRect.left - containerRect.left + fromRect.width / 2;
      const startY = fromRect.top - containerRect.top + fromRect.height;
      const endX = toRect.left - containerRect.left + toRect.width / 2;
      const endY = toRect.top - containerRect.top + toRect.height;

      const midX = (startX + endX) / 2;
      const midY = Math.max(startY, endY) + 30;

      setPath(`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`);
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
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
        transition={{ duration: 0.8 }} 
      />
      <motion.circle 
        cx={path.split(' ').pop()?.split(',')[0]} 
        cy={path.split(' ').pop()?.split(',')[1]} 
        r="3" 
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
    </motion.svg>
  );
}

/**
 * Purpose: Handles typing animation and linguistic annotations for a sentence.
 * Action: Cycles sequence Stages (Typing -> Annotating -> Complete).
 * Mechanism: useEffect with frame-limited intervals for performance.
 */
function AnnotatedSentence({ 
  langCode, 
  active, 
  onComplete,
}: { 
  langCode: string; 
  active: boolean; 
  onComplete: () => void;
}) {
  const data = getLangData(langCode);
  const [typedSegments, setTypedSegments] = useState<number>(0);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!active) {
      setTypedSegments(0);
      setTypedChars(0);
      setShowAnnotations(false);
      return;
    }

    let currentSegment = 0;
    let currentChar = 0;

    // Use a slightly slower but more performant frame-sync approach
    const interval = setInterval(() => {
      if (currentSegment >= data.segments.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowAnnotations(true);
          setTimeout(onComplete, 4000); // Dwell time for the user to read annotations
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
    }, 60); // 60ms is smooth enough and saves CPU/FPS

    return () => clearInterval(interval);
  }, [active, data, onComplete]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-0 items-baseline font-sans" dir={langCode === 'ar' ? 'rtl' : 'ltr'}>
      {data.segments.map((s, i) => {
        const isCurrentlyTyping = i === typedSegments;
        const isPastTyped = i < typedSegments;
        const displayChars = isCurrentlyTyping ? typedChars : (isPastTyped ? s.text.length : 0);

        if (displayChars === 0 && !isPastTyped && !isCurrentlyTyping) return null;

        const roleColor = s.role ? ROLE_COLORS[s.role] : 'currentColor';

        return (
          <div key={i} className="relative">
            <motion.span
              ref={el => { segmentsRefs.current[i] = el; }}
              style={{ color: showAnnotations && s.role && s.role !== 'other' ? roleColor : 'inherit' }}
              className={cn(
                "text-2xl md:text-3xl lg:text-5xl tracking-tight leading-tight inline-block transition-colors duration-500",
                showAnnotations && s.role === 'noun' ? 'font-black' : 'font-bold'
              )}
            >
              {s.text.slice(0, displayChars)}
              
              {/* Highlight background */}
              {showAnnotations && s.highlight && (
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="absolute inset-x-0 bottom-0 h-[25%] bg-[#30b8c8]/10 -z-10 origin-left rounded-sm"
                />
              )}
              
              {/* Typewriter Cursor */}
              {isCurrentlyTyping && displayChars < s.text.length && (
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-[3px] h-[0.7em] bg-primary ml-0.5 align-middle"
                />
              )}
            </motion.span>
          </div>
        );
      })}

      {/* Internal Arrow */}
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

/**
 * Purpose: Main Hero component for Synoptic.
 * Action: Showcases side-by-side bilingual typesetting in a clean, high-performance mock UI.
 * Branding: Uses Quicksand (font-sans) and All Small Caps for branding elements.
 */
export function Hero() {
  const t = useTranslations('Marketing.hero');
  const currentLocale = useLocale();
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [animationStage, setAnimationStage] = useState<'left' | 'right' | 'dwell'>('left');

  const rotationLanguages = useMemo(() => {
    return Object.keys(LANGUAGES_ANNOTATIONS).filter(code => code !== currentLocale);
  }, [currentLocale]);

  const currentLangCode = rotationLanguages[currentLangIndex];

  const handleLeftComplete = () => {
    setAnimationStage('right');
  };

  const handleRightComplete = () => {
    setAnimationStage('dwell');
    setTimeout(() => {
      setCurrentLangIndex((prev) => (prev + 1) % rotationLanguages.length);
      setAnimationStage('left');
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }, 2000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-32 overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.02]" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-[1100px]"
        >
          {/* Main Interface Mockup - Streamlined Layout */}
          <div className="rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] overflow-hidden font-sans">
            {/* Minimal Header */}
            <div className="h-14 border-b bg-muted/5 flex items-center px-6 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/20" />
                <div className="w-3 h-3 rounded-full bg-amber-400/20" />
                <div className="w-3 h-3 rounded-full bg-green-400/20" />
              </div>
              <div className="flex items-center gap-4">
                <div className={cn("w-2 h-2 rounded-full transition-all duration-500", isSaving ? "bg-primary animate-pulse scale-125" : "bg-muted-foreground/20")} />
                <Save className={cn("h-4 w-4 transition-colors", isSaving ? "text-primary" : "text-muted-foreground/30")} />
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Minimal Sidebar */}
              <div className="hidden lg:flex w-16 border-r flex-col items-center py-10 gap-8 bg-muted/5">
                {[Shapes, Layers, Globe, Zap].map((Icon, i) => (
                  <div key={i} className={cn("p-2.5 rounded-2xl transition-all", i === 2 ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/30")}>
                    <Icon className="h-5 w-5" />
                  </div>
                ))}
              </div>

              {/* Workspaces */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-[450px] md:min-h-[600px] relative">
                {/* Horizontal Rulers decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(to_right,#ccc_1px,transparent_1px)] bg-[length:32px_100%] opacity-10 hidden md:block" />

                {/* Left Origin Workspace */}
                <div className="flex-1 p-10 md:p-16 border-b lg:border-b-0 lg:border-r border-border/10 flex flex-col justify-center">
                   <AnnotatedSentence 
                      langCode={currentLocale} 
                      active={animationStage === 'left'} 
                      onComplete={handleLeftComplete} 
                   />
                </div>

                {/* Right Translation Workspace */}
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-muted/5">
                   <div className="mb-6">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentLangCode}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 5 }}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-[#30b8c8] bg-[#30b8c8]/10 px-3 py-1 rounded-full border border-[#30b8c8]/20"
                        >
                          {getLanguageLabel(currentLangCode, true)}
                        </motion.span>
                      </AnimatePresence>
                   </div>
                   <AnnotatedSentence 
                      langCode={currentLangCode} 
                      active={animationStage === 'right'} 
                      onComplete={handleRightComplete}
                   />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Branding & CTA */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="mt-16 text-center"
        >
          <div className="max-w-3xl mx-auto space-y-8">
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter font-sans leading-[0.95] text-foreground">
                {t('titlePlain')}
             </h1>
             <p className="text-muted-foreground font-medium text-xl leading-relaxed px-6 opacity-80">
                {t('subtitle')}
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
               <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-16 px-10 font-black rounded-2xl gap-3 text-xl shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {t('ctaPrimary')}
                    <ArrowRight className="h-6 w-6" />
                  </Button>
               </Link>
             </div>
             
             {/* Sub-features list */}
             <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 pt-8 opacity-40">
                {['Cloud Staging', 'Typesetting Core', 'AI Dictionary', 'One-Click Publish'].map(f => (
                  <div key={f} className="text-[10px] font-black uppercase tracking-[0.3em] font-sans">{f}</div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
