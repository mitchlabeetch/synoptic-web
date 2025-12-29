// src/components/marketing/Hero.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, MoveRight, Shapes, Play, Pause, Save, Globe, Zap, Layers } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getLanguageLabel } from '@/data/languages';

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

function CurvedArrow({ from, to, containerRef, color = "currentColor" }: { from: DOMRect | null; to: DOMRect | null; containerRef: React.RefObject<HTMLDivElement | null>; color?: string }) {
  if (!from || !to || !containerRef.current) return null;

  const containerRect = containerRef.current.getBoundingClientRect();

  const startX = from.left - containerRect.left + from.width / 2;
  const startY = from.top - containerRect.top + from.height;
  const endX = to.left - containerRect.left + to.width / 2;
  const endY = to.top - containerRect.top + to.height;

  // Calculate curve point
  const midX = (startX + endX) / 2;
  const midY = Math.max(startY, endY) + 30;

  const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none z-50 overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.path
        d={path}
        fill="transparent"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      {/* Arrow head */}
      <motion.path
        d={`M ${endX - 8} ${endY + 8} L ${endX} ${endY} L ${endX + 8} ${endY + 8}`}
        fill="transparent"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      />
    </motion.svg>
  );
}

function AnnotatedSentence({ 
  langCode, 
  active, 
  onComplete,
  isRightPanel = false 
}: { 
  langCode: string; 
  active: boolean; 
  onComplete: () => void;
  isRightPanel?: boolean;
}) {
  const data = getLangData(langCode);
  const [typedSegments, setTypedSegments] = useState<number>(0);
  const [typedChars, setTypedChars] = useState<number>(0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [rects, setRects] = useState<{from: DOMRect | null, to: DOMRect | null}>({ from: null, to: null });

  useEffect(() => {
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
          // Wait for render then calculate rects
          setTimeout(() => {
            const from = segmentsRefs.current[data.arrow[0]]?.getBoundingClientRect() || null;
            const to = segmentsRefs.current[data.arrow[1]]?.getBoundingClientRect() || null;
            setRects({ from, to });
            setTimeout(onComplete, 2500);
          }, 100);
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
    }, 45);

    return () => clearInterval(interval);
  }, [active, data, onComplete]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-0 items-baseline" dir={langCode === 'ar' ? 'rtl' : 'ltr'}>
      {data.segments.map((s, i) => {
        const isCurrentlyTyping = i === typedSegments;
        const isPastTyped = i < typedSegments;
        const displayChars = isCurrentlyTyping ? typedChars : (isPastTyped ? s.text.length : 0);

        if (displayChars === 0 && !isPastTyped && !isCurrentlyTyping) return null;

        return (
          <div key={i} className="relative group/segment">
            <motion.span
              ref={el => { segmentsRefs.current[i] = el; }}
              className={`text-4xl md:text-5xl lg:text-7xl tracking-tight leading-[1.05] inline-block ${
                showAnnotations && s.role === 'noun' ? 'font-black' : 'font-bold'
              } ${showAnnotations && s.highlight ? 'relative z-10' : ''}`}
            >
              <span className={showAnnotations && s.role === 'noun' ? 'underline decoration-[#30b8c8]/30 decoration-4 underline-offset-8' : ''}>
                {s.text.slice(0, displayChars)}
              </span>
              
              {/* Highlight background */}
              {showAnnotations && s.highlight && (
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="absolute inset-x-0 bottom-[10%] h-[35%] bg-[#30b8c8]/20 -z-10 origin-left rounded-sm"
                />
              )}
              
              {/* Typewriter Cursor */}
              {isCurrentlyTyping && displayChars < s.text.length && (
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-[6px] h-[0.7em] bg-primary ml-0.5 align-middle"
                />
              )}
            </motion.span>

            {/* Role Tag */}
            <AnimatePresence>
              {showAnnotations && s.role && s.role !== 'other' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -25, scale: 1 }}
                  className={`absolute left-0 -top-6 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.1em] pointer-events-none whitespace-nowrap z-20 ${
                    s.role === 'noun' ? 'bg-primary text-white shadow-lg' : 'bg-secondary text-white shadow-lg shadow-secondary/20'
                  }`}
                >
                  {s.role}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Internal Arrow */}
      {showAnnotations && (
        <CurvedArrow 
          from={rects.from} 
          to={rects.to} 
          containerRef={containerRef}
          color={isRightPanel ? "var(--color-secondary)" : "var(--color-primary)"} 
        />
      )}
    </div>
  );
}

export function Hero() {
  const t = useTranslations('Marketing.hero');
  const currentLocale = useLocale();
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [animationStage, setAnimationStage] = useState<'left' | 'right' | 'dwell'>('left');

  // Filter out current locale from rotation languages
  const rotationLanguages = useMemo(() => {
    return Object.keys(LANGUAGES_ANNOTATIONS).filter(code => code !== currentLocale);
  }, [currentLocale]);

  const currentLangCode = rotationLanguages[currentLangIndex];

  const handleLeftComplete = () => {
    setAnimationStage('right');
  };

  const handleRightComplete = () => {
    setAnimationStage('dwell');
    if (isPaused) return;
    
    setTimeout(() => {
      setCurrentLangIndex((prev) => (prev + 1) % rotationLanguages.length);
      setAnimationStage('left');
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 1200);
    }, 4000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-32 overflow-hidden">
      {/* Background Grid & Orbs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold backdrop-blur-sm">
            <Zap className="h-3 w-3" />
            <span>{t('badge')}</span>
          </div>
        </motion.div>

        {/* Interactive Bilingual Hero Mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto max-w-[1240px]"
        >
          {/* Floating Asset */}
          <motion.div 
            animate={{ y: [0, -8, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -left-6 z-20 hidden lg:block p-4 rounded-2xl bg-white/90 dark:bg-slate-900 border shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div className="pr-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('activeLayer')}</div>
                <div className="text-xs font-bold leading-none mt-1">{t('typographyAssistant')}</div>
              </div>
            </div>
          </motion.div>

          <div className="rounded-[2.5rem] border border-border/50 bg-card/40 backdrop-blur-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 border-b bg-muted/10 flex items-center px-6 gap-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/40" />
                <div className="w-3 h-3 rounded-full bg-amber-400/40" />
                <div className="w-3 h-3 rounded-full bg-green-400/40" />
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="px-6 py-1.5 rounded-full bg-background/50 border border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-primary animate-ping' : 'bg-green-500'}`} />
                  {isSaving ? t('syncing') : t('readyStudio')}
                </div>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground">
                <Save className={`h-4 w-4 transition-colors ${isSaving ? 'text-primary' : ''}`} />
                <div className="w-8 h-8 rounded-full bg-muted/30" />
              </div>
            </div>
            
            {/* Workspace */}
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="hidden lg:flex w-16 border-r flex-col items-center py-8 gap-8 bg-muted/5">
                {[Shapes, Layers, Globe, Zap].map((Icon, i) => (
                  <div key={i} className={`p-3 rounded-2xl transition-all cursor-pointer ${i === 2 ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                ))}
              </div>

              {/* Canvas */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-[500px] md:min-h-[700px] relative">
                {/* Ruler Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(to_right,#ccc_1px,transparent_1px)] bg-[length:32px_100%] opacity-20 hidden md:block" />
                
                {/* Left Panel */}
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center relative group border-b lg:border-b-0 lg:border-r border-border/30">
                  <div className="absolute top-8 left-10 flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/40">Segment / {getLanguageLabel(currentLocale, true)}</span>
                    <div className="h-[2px] w-12 bg-primary/10 rounded-full" />
                  </div>
                  
                  <div className="relative">
                    <AnnotatedSentence 
                      langCode={currentLocale} 
                      active={animationStage === 'left'} 
                      onComplete={handleLeftComplete} 
                    />
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center relative bg-muted/5 group overflow-hidden">
                  <div className="absolute top-8 left-10 flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/60">Module / Translation</span>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentLangCode}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-[10px] font-black text-secondary"
                      >
                        {getLanguageLabel(currentLangCode, true).toUpperCase()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block">
                       <MoveRight className="h-10 w-10 text-primary" />
                    </div>
                    <AnnotatedSentence 
                      langCode={currentLangCode} 
                      active={animationStage === 'right'} 
                      onComplete={handleRightComplete}
                      isRightPanel
                    />
                  </div>
                  
                  {/* Controls */}
                  <div className="absolute bottom-8 right-10 flex items-center gap-3">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-3 rounded-full bg-background/80 border shadow-sm backdrop-blur-md hover:scale-110 transition-transform active:scale-95"
                    >
                      {isPaused ? <Play className="h-5 w-5 text-foreground" fill="currentColor" /> : <Pause className="h-5 w-5 text-foreground" fill="currentColor" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-black uppercase tracking-[0.15em] text-muted-foreground/40"
        >
          {['Cloud Logic', 'Printing Core', 'AI Linguist', 'Cross System'].map(feat => (
            <div key={feat} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
              {feat}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
