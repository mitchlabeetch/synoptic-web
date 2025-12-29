'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, PenTool, Globe, Zap, Languages, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
      
      let startX, endX, startY, endY, midY;
      const padding = 8;
      
      const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2;
      const toCenterX = toRect.left - containerRect.left + toRect.width / 2;
      
      // Dynamic attachment points to avoid overlapping the source word
      if (fromCenterX < toCenterX) {
        // Source is on the left
        startX = fromRect.left - containerRect.left + fromRect.width * 0.7; // Start toward the right side of source
        endX = toRect.left - containerRect.left + toRect.width * 0.3; // End toward the left side of target
      } else {
        // Source is on the right
        startX = fromRect.left - containerRect.left + fromRect.width * 0.3; // Start toward the left side of source
        endX = toRect.left - containerRect.left + toRect.width * 0.7; // End toward the right side of target
      }
      
      const dist = Math.abs(startX - endX);

      // Always use bottom for this specific bilingual annotation look
      startY = fromRect.top - containerRect.top + fromRect.height + padding;
      endY = toRect.top - containerRect.top + toRect.height + padding;
      midY = Math.max(startY, endY) + Math.min(60, dist * 0.4 + 10);

      const isWrapped = Math.abs(fromRect.top - toRect.top) > 30;
      let midX = (startX + endX) / 2;
      
      if (isWrapped) {
        const curveOutward = isRTL_context ? -60 : 60;
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
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }} 
        animate={{ pathLength: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }} 
      />
      <motion.circle 
        cx={endPos.x} 
        cy={endPos.y} 
        r="3" 
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
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

    // Only start if not already finished
    if (typedSegments >= data.segments.length) return;

    let currentSegment = typedSegments;
    let currentChar = typedChars;

    const interval = setInterval(() => {
      if (currentSegment >= data.segments.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowAnnotations(true);
          setTimeout(onComplete, 1500);
        }, 300);
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
    }, 40);

    return () => clearInterval(interval);
  }, [active, data, staticMode]); // Removed onComplete to prevent restarts on parent re-renders

  // Separate effect for completion to avoid restarting the typewriter
  useEffect(() => {
    if (active && typedSegments >= data.segments.length && !showAnnotations && !staticMode) {
      setShowAnnotations(true);
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [active, typedSegments, data.segments.length, onComplete, showAnnotations, staticMode]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-0 items-baseline font-quicksand" dir={langCode === 'ar' ? 'rtl' : 'ltr'}>
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
              "text-[clamp(1.2rem,12cqw,5.5rem)] tracking-tight leading-[1.2] inline-block transition-colors duration-500 whitespace-nowrap relative truncate max-w-full",
              showAnnotations && s.role === 'noun' ? 'font-bold' : 'font-medium'
            )}
          >
            {s.text.slice(0, displayChars)}
            
            {showAnnotations && s.highlight && (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute inset-x-0 bottom-[10%] h-[35%] bg-[#30b8c8]/20 -z-10 origin-left rounded-sm blur-[2px]"
              />
            )}
            
            {isCurrentlyTyping && displayChars < s.text.length && (
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 align-middle"
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

  const handleSyncComplete = useCallback(() => {
    setAnimationStage('cycling');
  }, []);

  const handleCycleComplete = useCallback(() => {
    setAnimationStage('dwell');
    setTimeout(() => {
      setCurrentLangIndex((prev) => (prev + 1) % rotationLanguages.length);
      setAnimationStage('cycling');
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }, 2000); // Increased dwell time to 2 seconds for better readability
  }, [rotationLanguages.length]);

  return (
    <section className="relative px-4 pt-12 pb-20 md:pt-16 md:pb-32 overflow-hidden bg-background">
      {/* Enhanced Aesthetic Background Gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(48,184,200,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(249,114,110,0.05),transparent_70%)] blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(34,104,122,0.02),transparent_60%)]" />
      </div>
      
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.99, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative mx-auto max-w-[1280px]"
        >
          {/* Studio Interface Mockup - Refined Aesthetics */}
          <div className="rounded-[2.5rem] border border-border/40 bg-card/10 backdrop-blur-[40px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.12)] overflow-hidden font-quicksand">
            {/* Window Controls */}
            <div className="h-14 border-b bg-muted/10 flex items-center px-8 justify-between">
              <div className="flex gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-400/30" />
                <div className="w-3 h-3 rounded-full bg-amber-400/30" />
                <div className="w-3 h-3 rounded-full bg-green-400/30" />
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                   <div className={cn("w-2 h-2 rounded-full transition-all duration-700", isSaving ? "bg-primary animate-pulse scale-110" : "bg-muted-foreground/20")} />
                   <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">{isSaving ? t('syncing') : t('readyStudio')}</span>
                </div>
                <PenTool className="h-4 w-4 text-muted-foreground/20" />
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar Renders */}
              <div className="hidden lg:flex w-16 border-r flex-col items-center py-12 gap-12 bg-muted/5">
                {[BookOpen, Sparkles, Globe, Zap, Languages].map((Icon, i) => (
                  <Icon key={i} className={cn("h-5 w-5 transition-all duration-500", i === 2 || i === 4 ? "text-primary opacity-90" : "text-muted-foreground/20")} />
                ))}
              </div>

              {/* Translation Panels - Realistic Flow with Overflow Safety */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-[350px] md:min-h-[450px] relative overflow-hidden">
                
                {/* Visual Separator - Increased Opacity */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[60%] bg-border hidden lg:block z-20" />

                <div className="flex-1 p-8 md:p-14 lg:p-12 flex flex-col justify-center overflow-hidden [container-type:inline-size]">
                   <AnnotatedSentence 
                      langCode={currentLocale} 
                      active={animationStage === 'sync'} 
                      staticMode={animationStage === 'cycling' || animationStage === 'dwell'}
                      onComplete={handleSyncComplete} 
                   />
                </div>

                <div className="flex-1 p-8 md:p-14 lg:p-12 flex flex-col justify-center bg-muted/5 overflow-hidden [container-type:inline-size]">
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

        {/* Marketing Copy - Font & Size Refactoring */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8 }}
           className="mt-20 text-center max-w-6xl mx-auto space-y-10"
        >
           <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-[6.5rem] font-bold tracking-tighter font-quicksand leading-[0.9] text-foreground">
              {t('titlePlain')}
           </h1>
           <p className="text-muted-foreground font-medium text-lg md:text-2xl leading-relaxed max-w-4xl mx-auto font-outfit opacity-70">
              {t('subtitle')}
           </p>
           <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth/signup">
                 <Button size="lg" className="h-[72px] px-12 font-bold rounded-full gap-5 text-xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-95 font-outfit">
                   {t('ctaPrimary')}
                   <ArrowRight className="h-6 w-6" />
                 </Button>
              </Link>
              <Link href="/models">
                 <Button variant="outline" size="lg" className="h-[72px] px-12 font-bold rounded-full text-xl hover:bg-muted/50 transition-all font-outfit border-2">
                   {t('ctaSecondary')}
                 </Button>
              </Link>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
