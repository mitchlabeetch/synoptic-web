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
    segments: [{ text: "The", role: "other" }, { text: "ultimate", role: "adjective" }, { text: "bilingual", role: "other", highlight: true }, { text: "studio", role: "noun" }],
    arrow: [1, 3]
  },
  fr: {
    segments: [{ text: "Le", role: "other" }, { text: "studio", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "ultime", role: "adjective" }],
    arrow: [3, 1]
  },
  es: {
    segments: [{ text: "El", role: "other" }, { text: "estudio", role: "noun" }, { text: "bilingüe", role: "other", highlight: true }, { text: "definitivo", role: "adjective" }],
    arrow: [3, 1]
  },
  de: {
    segments: [{ text: "Das", role: "other" }, { text: "ultimative", role: "adjective" }, { text: "zweisprachige", role: "other", highlight: true }, { text: "studio", role: "noun" }],
    arrow: [1, 3]
  },
  it: {
    segments: [{ text: "Lo", role: "other" }, { text: "studio", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "definitivo", role: "adjective" }],
    arrow: [3, 1]
  },
  pt: {
    segments: [{ text: "O", role: "other" }, { text: "estúdio", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "definitivo", role: "adjective" }],
    arrow: [3, 1]
  },
  ro: {
    segments: [{ text: "Studioul", role: "noun" }, { text: "bilingv", role: "other", highlight: true }, { text: "suprem", role: "adjective" }],
    arrow: [2, 0]
  },
  nl: {
    segments: [{ text: "De", role: "other" }, { text: "ultieme", role: "adjective" }, { text: "tweetalige", role: "other", highlight: true }, { text: "studio", role: "noun" }],
    arrow: [1, 3]
  },
  sv: {
    segments: [{ text: "Den", role: "other" }, { text: "ultimata", role: "adjective" }, { text: "tvåspråkiga", role: "other", highlight: true }, { text: "studion", role: "noun" }],
    arrow: [1, 3]
  },
  da: {
    segments: [{ text: "Det", role: "other" }, { text: "ultimative", role: "adjective" }, { text: "tosprogede", role: "other", highlight: true }, { text: "studie", role: "noun" }],
    arrow: [1, 3]
  },
  no: {
    segments: [{ text: "Det", role: "other" }, { text: "ultimative", role: "adjective" }, { text: "tospråklige", role: "other", highlight: true }, { text: "studioet", role: "noun" }],
    arrow: [1, 3]
  },
  pl: {
    segments: [{ text: "Najlepsze", role: "adjective" }, { text: "studio", role: "noun" }, { text: "dwujęzyczne", role: "other", highlight: true }],
    arrow: [0, 1]
  },
  ru: {
    segments: [{ text: "Лучшая", role: "adjective" }, { text: "двуязычная", role: "other", highlight: true }, { text: "студия", role: "noun" }],
    arrow: [0, 2]
  },
  uk: {
    segments: [{ text: "Найкраща", role: "adjective" }, { text: "двомовна", role: "other", highlight: true }, { text: "студія", role: "noun" }],
    arrow: [0, 2]
  },
  tr: {
    segments: [{ text: "En iyi", role: "adjective" }, { text: "iki dilli", "role": "other", highlight: true }, { text: "stüdyo", role: "noun" }],
    arrow: [0, 2]
  },
  el: {
    segments: [{ text: "Το", role: "other" }, { text: "απόλυτο", role: "adjective" }, { text: "δίγλωσσο", role: "other", highlight: true }, { text: "στούντιο", role: "noun" }],
    arrow: [1, 3]
  },
  hi: {
    segments: [{ text: "सर्वश्रेष्ठ", role: "adjective" }, { text: "द्विभाषी", role: "other", highlight: true }, { text: "स्टूडियो", role: "noun" }],
    arrow: [0, 2]
  },
  vi: {
    segments: [{ text: "Studio", role: "noun" }, { text: "song ngữ", role: "other", highlight: true }, { text: "tối thượng", role: "adjective" }],
    arrow: [2, 0]
  },
  id: {
    segments: [{ text: "Studio", role: "noun" }, { text: "dwibahasa", role: "other", highlight: true }, { text: "pamungkas", role: "adjective" }],
    arrow: [2, 0]
  },
  ar: {
    segments: [{ text: "ال", role: "other" }, { text: "استوديو", role: "noun" }, { text: "ثنائي اللغة", role: "other", highlight: true }, { text: "المثالي", role: "adjective" }],
    arrow: [3, 1]
  },
  he: {
    segments: [{ text: "הסטודיו", role: "noun" }, { text: "הדו-לשוני", role: "other", highlight: true }, { text: "האולטימטיבי", role: "adjective" }],
    arrow: [2, 0]
  },
  fa: {
    segments: [{ text: "استودیو", role: "noun" }, { text: "دوزبانه", role: "other", highlight: true }, { text: "نهایی", role: "adjective" }],
    arrow: [2, 0]
  },
  zh: {
    segments: [{ text: "终极", role: "adjective" }, { text: "双语", "role": "other", highlight: true }, { text: "工作室", role: "noun" }],
    arrow: [0, 2]
  },
  "zh-TW": {
    segments: [{ text: "終極", role: "adjective" }, { text: "雙語", "role": "other", highlight: true }, { text: "工作室", role: "noun" }],
    arrow: [0, 2]
  },
  ja: {
    segments: [{ text: "究極", role: "adjective" }, { text: "の", role: "other" }, { text: "バイリンガル", role: "other", highlight: true }, { text: "スタジオ", role: "noun" }],
    arrow: [0, 3]
  },
  ko: {
    segments: [{ text: "궁극의", role: "adjective" }, { text: "이국어", role: "other", highlight: true }, { text: "스튜디오", role: "noun" }],
    arrow: [0, 2]
  },
  th: {
    segments: [{ text: "สตูดิโอ", role: "noun" }, { text: "สองภาษา", role: "other", highlight: true }, { text: "ที่ดีที่สุด", role: "adjective" }],
    arrow: [2, 0]
  },
  ca: {
    segments: [{ text: "L'estudi", role: "noun" }, { text: "bilingüe", role: "other", highlight: true }, { text: "definitiu", role: "adjective" }],
    arrow: [2, 0]
  },
  cs: {
    segments: [{ text: "Ultimátní", role: "adjective" }, { text: "bilingvní", role: "other", highlight: true }, { text: "studio", role: "noun" }],
    arrow: [0, 2]
  },
  la: {
    segments: [{ text: "Studium", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "ultimum", role: "adjective" }],
    arrow: [2, 0]
  },
  fi: {
    segments: [{ text: "Lopullinen", role: "adjective" }, { text: "kaksikielinen", role: "other", highlight: true }, { text: "studio", role: "noun" }],
    arrow: [0, 2]
  },
  hu: {
    segments: [{ text: "A", role: "other" }, { text: "végső", role: "adjective" }, { text: "kétnyelvű", role: "other", highlight: true }, { text: "stúdió", role: "noun" }],
    arrow: [1, 3]
  },
  grc: {
    segments: [{ text: "Τὸ", role: "other" }, { text: "ἔσχατον", role: "adjective" }, { text: "δίγλωσσον", role: "other", highlight: true }, { text: "σπουδαστήριον", role: "noun" }],
    arrow: [1, 3]
  }
};

const getLangData = (code: string) => {
  const baseCode = code.split('-')[0];
  return LANGUAGES_ANNOTATIONS[code] || LANGUAGES_ANNOTATIONS[baseCode] || LANGUAGES_ANNOTATIONS.en;
};

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
      
      const diffY = toRect.top - fromRect.top;
      const verticalThreshold = 15;

      startX = fromCenterX;
      endX = toCenterX;

      const isBackwards = startX > endX;
      const dist = Math.abs(startX - endX);
      let controlY;

      if (diffY < -verticalThreshold) {
        // TARGET IS ABOVE ORIGIN
        startY = fromRect.top - containerRect.top - padding;
        endY = toRect.top - containerRect.top + toRect.height + padding;
        controlY = (startY + endY) / 2;
      } else if (diffY > verticalThreshold) {
        // TARGET IS BELOW ORIGIN
        startY = fromRect.top - containerRect.top + fromRect.height + padding;
        endY = toRect.top - containerRect.top - padding;
        controlY = (startY + endY) / 2;
      } else {
        // SAME LEVEL
        if (isBackwards) {
           // Right to Left -> Arc Over Top
           startY = fromRect.top - containerRect.top - padding;
           endY = toRect.top - containerRect.top - padding;
           // Curve Upward
           const arcHeight = Math.min(80, dist * 0.5 + 20);
           controlY = Math.min(startY, endY) - arcHeight;
        } else {
           // Left to Right -> Arc Under Bottom
           startY = fromRect.top - containerRect.top + fromRect.height + padding;
           endY = toRect.top - containerRect.top + toRect.height + padding;
           // Curve Downward
           const arcHeight = Math.min(80, dist * 0.5 + 20);
           controlY = Math.max(startY, endY) + arcHeight;
        }
      }
      
      const isWrapped = Math.abs(fromRect.top - toRect.top) > 30;
      let midX = (startX + endX) / 2;
      midY = controlY;
      
      if (isWrapped) {
        const curveOutward = isRTL_context ? -120 : 120;
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

  const isRTL_lang = langCode === 'ar' || langCode === 'he' || langCode === 'fa';
  const isNoGap_lang = langCode === 'zh' || langCode === 'zh-TW' || langCode === 'ja' || langCode === 'ko' || langCode === 'th';

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative flex flex-wrap items-baseline font-quicksand",
        isNoGap_lang ? "gap-0" : "gap-x-[0.3em] gap-y-2"
      )} 
      dir={isRTL_lang ? 'rtl' : 'ltr'}
    >
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
              "text-[clamp(1rem,10cqw,5rem)] tracking-tight leading-[1.3] inline-block transition-colors duration-500 whitespace-nowrap relative",
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
          isRTL={isRTL_lang}
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
      {/* Premium Mesh Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[#f8fafc] dark:bg-slate-950" />
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(48,184,200,0.15),transparent_70%)] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(249,114,110,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(34,104,122,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
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
                <PenTool className="h-4 w-4 text-muted-foreground/20" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-12 py-12 md:py-24 bg-background/50">
        
              <div className="text-center space-y-8 max-w-4xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border backdrop-blur-sm shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30b8c8] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30b8c8]"></span>
                  </span>
                  <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{t('badge')}</span>
                </motion.div>

                <div className="relative">
                  <h1 className="sr-only">Synoptic Studio</h1>
                  {/* Dynamic Bilingual Headline */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 md:text-left">
                      {/* Source Language - Left -> Right */}
                      <AnnotatedSentence 
                        langCode={currentLocale} 
                        active={animationStage === 'sync'} 
                        staticMode={animationStage === 'cycling' || animationStage === 'dwell'}
                        onComplete={handleSyncComplete} 
                      />
                      
                      {/* Arrow or Separator */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-border bg-background shadow-sm z-20"
                      >
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </motion.div>

                      {/* Target Language - Cycling */}
                      <AnnotatedSentence 
                        langCode={currentLangCode} 
                        active={animationStage === 'sync' || animationStage === 'cycling'} 
                        onComplete={handleCycleComplete}
                      />
                  </div>
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
           <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight font-serif leading-[1.1] text-foreground max-w-5xl mx-auto italic decoration-primary/30">
              {t('titlePlain')}
           </h1>
            <p className="text-muted-foreground font-medium text-lg md:text-2xl leading-relaxed max-w-4xl mx-auto font-outfit opacity-80 decoration-primary/10 underline underline-offset-8 decoration-dashed">
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
                 <Button variant="outline" size="lg" className="h-[72px] px-12 font-bold rounded-full text-xl hover:bg-[#22687a] hover:text-white transition-all font-outfit border-2 border-[#22687a]/20">
                   {t('ctaSecondary')}
                 </Button>
              </Link>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
