'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, PenTool } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// --- Types ---

interface Segment {
  text: string;
  role?: 'article' | 'adjective' | 'noun' | 'other';
  highlight?: boolean;
}

interface LanguageData {
  segments: Segment[];
  arrow: [number, number]; // Index From -> To
}

// --- 1. DATA: Complete 33-Language Matrix ---
const LANGUAGES_ANNOTATIONS: Record<string, LanguageData> = {
  en: { segments: [{ text: "The", role: "other" }, { text: "ultimate", role: "adjective" }, { text: "bilingual", role: "other", highlight: true }, { text: "studio", role: "noun" }], arrow: [1, 3] },
  fr: { segments: [{ text: "Le", role: "other" }, { text: "studio", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "ultime", role: "adjective" }], arrow: [3, 1] },
  es: { segments: [{ text: "El", role: "other" }, { text: "estudio", role: "noun" }, { text: "bilingüe", role: "other", highlight: true }, { text: "definitivo", role: "adjective" }], arrow: [3, 1] },
  de: { segments: [{ text: "Das", role: "other" }, { text: "ultimative", role: "adjective" }, { text: "zweisprachige", role: "other", highlight: true }, { text: "studio", role: "noun" }], arrow: [1, 3] },
  it: { segments: [{ text: "Lo", role: "other" }, { text: "studio", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "definitivo", role: "adjective" }], arrow: [3, 1] },
  pt: { segments: [{ text: "O", role: "other" }, { text: "estúdio", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "definitivo", role: "adjective" }], arrow: [3, 1] },
  ro: { segments: [{ text: "Studioul", role: "noun" }, { text: "bilingv", role: "other", highlight: true }, { text: "suprem", role: "adjective" }], arrow: [2, 0] },
  nl: { segments: [{ text: "De", role: "other" }, { text: "ultieme", role: "adjective" }, { text: "tweetalige", role: "other", highlight: true }, { text: "studio", role: "noun" }], arrow: [1, 3] },
  sv: { segments: [{ text: "Den", role: "other" }, { text: "ultimata", role: "adjective" }, { text: "tvåspråkiga", role: "other", highlight: true }, { text: "studion", role: "noun" }], arrow: [1, 3] },
  da: { segments: [{ text: "Det", role: "other" }, { text: "ultimative", role: "adjective" }, { text: "tosprogede", role: "other", highlight: true }, { text: "studie", role: "noun" }], arrow: [1, 3] },
  no: { segments: [{ text: "Det", role: "other" }, { text: "ultimative", role: "adjective" }, { text: "tospråklige", role: "other", highlight: true }, { text: "studioet", role: "noun" }], arrow: [1, 3] },
  pl: { segments: [{ text: "Najlepsze", role: "adjective" }, { text: "studio", role: "noun" }, { text: "dwujęzyczne", role: "other", highlight: true }], arrow: [0, 1] },
  ru: { segments: [{ text: "Лучшая", role: "adjective" }, { text: "двуязычная", role: "other", highlight: true }, { text: "студия", role: "noun" }], arrow: [0, 2] },
  uk: { segments: [{ text: "Найкраща", role: "adjective" }, { text: "двомовна", role: "other", highlight: true }, { text: "студія", role: "noun" }], arrow: [0, 2] },
  tr: { segments: [{ text: "En iyi", role: "adjective" }, { text: "iki dilli", role: "other", highlight: true }, { text: "stüdyo", role: "noun" }], arrow: [0, 2] },
  el: { segments: [{ text: "Το", role: "other" }, { text: "απόλυτο", role: "adjective" }, { text: "δίγλωσσο", role: "other", highlight: true }, { text: "στούντιο", role: "noun" }], arrow: [1, 3] },
  hi: { segments: [{ text: "सर्वश्रेष्ठ", role: "adjective" }, { text: "द्विभाषी", role: "other", highlight: true }, { text: "स्टूडियो", role: "noun" }], arrow: [0, 2] },
  vi: { segments: [{ text: "Studio", role: "noun" }, { text: "song ngữ", role: "other", highlight: true }, { text: "tối thượng", role: "adjective" }], arrow: [2, 0] },
  id: { segments: [{ text: "Studio", role: "noun" }, { text: "dwibahasa", role: "other", highlight: true }, { text: "pamungkas", role: "adjective" }], arrow: [2, 0] },
  ar: { segments: [{ text: "ال", role: "other" }, { text: "استوديو", role: "noun" }, { text: "ثنائي اللغة", role: "other", highlight: true }, { text: "المثالي", role: "adjective" }], arrow: [3, 1] },
  he: { segments: [{ text: "הסטודיו", role: "noun" }, { text: "הדו-לשוני", role: "other", highlight: true }, { text: "האולטימטיבי", role: "adjective" }], arrow: [2, 0] },
  fa: { segments: [{ text: "استودیو", role: "noun" }, { text: "دوزبانه", role: "other", highlight: true }, { text: "نهایی", role: "adjective" }], arrow: [2, 0] },
  zh: { segments: [{ text: "终极", role: "adjective" }, { text: "双语", role: "other", highlight: true }, { text: "工作室", role: "noun" }], arrow: [0, 2] },
  "zh-TW": { segments: [{ text: "終極", role: "adjective" }, { text: "雙語", role: "other", highlight: true }, { text: "工作室", role: "noun" }], arrow: [0, 2] },
  ja: { segments: [{ text: "究極", role: "adjective" }, { text: "の", role: "other" }, { text: "バイリンガル", role: "other", highlight: true }, { text: "スタジオ", role: "noun" }], arrow: [0, 3] },
  ko: { segments: [{ text: "궁극의", role: "adjective" }, { text: "이국어", role: "other", highlight: true }, { text: "스튜디오", role: "noun" }], arrow: [0, 2] },
  th: { segments: [{ text: "สตูดิโอ", role: "noun" }, { text: "สองภาษา", role: "other", highlight: true }, { text: "ที่ดีที่สุด", role: "adjective" }], arrow: [2, 0] },
  ca: { segments: [{ text: "L'estudi", role: "noun" }, { text: "bilingüe", role: "other", highlight: true }, { text: "definitiu", role: "adjective" }], arrow: [2, 0] },
  cs: { segments: [{ text: "Ultimátní", role: "adjective" }, { text: "bilingvní", role: "other", highlight: true }, { text: "studio", role: "noun" }], arrow: [0, 2] },
  la: { segments: [{ text: "Studium", role: "noun" }, { text: "bilingue", role: "other", highlight: true }, { text: "ultimum", role: "adjective" }], arrow: [2, 0] },
  fi: { segments: [{ text: "Lopullinen", role: "adjective" }, { text: "kaksikielinen", role: "other", highlight: true }, { text: "studio", role: "noun" }], arrow: [0, 2] },
  hu: { segments: [{ text: "A", role: "other" }, { text: "végső", role: "adjective" }, { text: "kétnyelvű", role: "other", highlight: true }, { text: "stúdió", role: "noun" }], arrow: [1, 3] },
  grc: { segments: [{ text: "Τὸ", role: "other" }, { text: "ἔσχατον", role: "adjective" }, { text: "δίγλωσσον", role: "other", highlight: true }, { text: "σπουδαστήριον", role: "noun" }], arrow: [1, 3] }
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

// --- 2. Smart Connector (Dynamic Arrow Logic) ---
// Always arcs DOWN below the text to prevent crossing
function SmartConnector({ 
  fromRef, 
  toRef, 
  containerRef, 
  color, 
  visible 
}: { 
  fromRef: HTMLElement | null; 
  toRef: HTMLElement | null; 
  containerRef: React.RefObject<HTMLDivElement | null>; 
  color: string;
  visible: boolean;
}) {
  const [pathData, setPathData] = useState<string>("");

  useEffect(() => {
    if (!visible || !fromRef || !toRef || !containerRef.current) return;

    const calculate = () => {
      const parent = containerRef.current!.getBoundingClientRect();
      const startRect = fromRef.getBoundingClientRect();
      const endRect = toRef.getBoundingClientRect();

      // Anchors: Bottom-Center relative to container
      const x1 = (startRect.left + startRect.width / 2) - parent.left;
      const y1 = (startRect.bottom) - parent.top;

      const x2 = (endRect.left + endRect.width / 2) - parent.left;
      const y2 = (endRect.bottom) - parent.top;

      // "Gravity" Logic: Arc Depth based on distance
      const dist = Math.abs(x2 - x1);
      const dipAmount = Math.min(50, Math.max(20, dist * 0.35)); 
      
      const cx = (x1 + x2) / 2;
      const cy = Math.max(y1, y2) + dipAmount;

      // Spacing so line doesn't touch letters
      const padY = 6; 

      setPathData(`M ${x1} ${y1 + padY} Q ${cx} ${cy} ${x2} ${y2 + padY}`);
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [fromRef, toRef, containerRef, visible]);

  if (!visible || !pathData) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
      <defs>
        <marker 
          id={`arrowhead-${color.replace('#', '')}`} 
          markerWidth="6" 
          markerHeight="6" 
          refX="5" 
          refY="3" 
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6" fill={color} />
        </marker>
      </defs>
      <motion.path 
        d={pathData} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeDasharray="4 4"
        markerEnd={`url(#arrowhead-${color.replace('#', '')})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}

// --- 3. ScaleToFitContainer (Layout Stability) ---
// Wraps changing text so it never expands the parent grid
function ScaleToFitContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adjustScale = () => {
      if (!containerRef.current || !contentRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;
      
      if (contentWidth > containerWidth) {
        const scale = containerWidth / contentWidth;
        contentRef.current.style.transform = `scale(${scale})`;
        contentRef.current.style.transformOrigin = 'left center'; 
      } else {
        contentRef.current.style.transform = 'scale(1)';
      }
    };

    const observer = new ResizeObserver(adjustScale);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center overflow-hidden">
      <div ref={contentRef} className="whitespace-nowrap transition-transform duration-300 ease-out origin-left">
        {children}
      </div>
    </div>
  );
}

// --- 4. Annotated Sentence (The Typewriter) ---
// Fast typing, smart dwell time
function AnnotatedSentence({ 
  langCode, 
  active, 
  onComplete,
  staticMode = false 
}: { 
  langCode: string; 
  active: boolean; 
  onComplete?: () => void;
  staticMode?: boolean;
}) {
  const data = getLangData(langCode);
  const [typedSegments, setTypedSegments] = useState<number>(staticMode ? data.segments.length : 0);
  const [showAnnotations, setShowAnnotations] = useState(staticMode);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    // If static, show everything immediately
    if (staticMode) {
      setTypedSegments(data.segments.length);
      setShowAnnotations(true);
      return;
    }
    
    if (!active) {
      setTypedSegments(0);
      setShowAnnotations(false);
      return;
    }

    // Reset when language changes or becomes active
    setTypedSegments(0);
    setShowAnnotations(false);

    const interval = setInterval(() => {
      setTypedSegments(prev => {
        // Reveal words one by one
        if (prev < data.segments.length) return prev + 1;
        
        clearInterval(interval);
        
        // Words done -> Show Arrows/Highlights
        setShowAnnotations(true);
        
        // Wait 1.2s -> Trigger Next Language
        if (onComplete) {
          setTimeout(onComplete, 1200); 
        }
        return prev;
      });
    }, 150); // 150ms per word = snappy feel

    return () => clearInterval(interval);
  }, [active, data, staticMode, onComplete, langCode]);

  const isRTL_lang = ['ar', 'he', 'fa'].includes(langCode);
  const isNoGap_lang = ['zh', 'zh-TW', 'ja', 'ko', 'th'].includes(langCode);

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative flex flex-row items-baseline pb-12 pt-2", // Padding for arrows
        isNoGap_lang ? "gap-0" : "gap-[0.4em]"
      )} 
      dir={isRTL_lang ? 'rtl' : 'ltr'}
    >
      <AnimatePresence mode='popLayout'>
        {data.segments.map((s, i) => {
          if (i >= typedSegments && !staticMode) return null;

          const roleColor = s.role ? ROLE_COLORS[s.role] : 'currentColor';
          const isNoun = s.role === 'noun';

          return (
            <motion.span
              key={`${langCode}-${i}`}
              ref={el => { segmentsRefs.current[i] = el; }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                color: showAnnotations && s.role !== 'other' ? roleColor : 'inherit'
              }}
              className={cn(
                "relative inline-block transition-colors duration-300 text-3xl md:text-4xl lg:text-5xl whitespace-nowrap",
                showAnnotations && isNoun ? 'font-bold' : 'font-medium'
              )}
            >
              {s.text}
              
              {/* Highlight Background */}
              {showAnnotations && s.highlight && (
                <motion.span
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-[#30b8c8]/10 -z-10 rounded-sm -mx-1"
                />
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>

      <SmartConnector 
        visible={showAnnotations}
        fromRef={segmentsRefs.current[data.arrow[0]]}
        toRef={segmentsRefs.current[data.arrow[1]]}
        containerRef={containerRef}
        color={ROLE_COLORS.adjective}
      />
    </div>
  );
}

// --- 5. Main Hero Logic ---
export function Hero() {
  const t = useTranslations('Marketing.hero');
  const currentLocale = useLocale();
  
  // State for sequencing
  const [currentLangIndex, setCurrentLangIndex] = useState(0);

  // Filter out current locale so we don't repeat it on the right
  const rotationLanguages = useMemo(() => 
    Object.keys(LANGUAGES_ANNOTATIONS).filter(code => code !== currentLocale)
  , [currentLocale]);

  // Handle Rotation Logic
  const handleCycleComplete = useCallback(() => {
    // Immediate index swap to trigger re-mount of right side
    setCurrentLangIndex((prev) => (prev + 1) % rotationLanguages.length);
  }, [rotationLanguages.length]);

  const currentRotationLang = rotationLanguages[currentLangIndex];

  return (
    <section className="relative px-4 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-background">
      
      {/* Clean, Professional Light Gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(48,184,200,0.08),transparent_60%)] blur-3xl" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(249,114,110,0.05),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-grid-slate-50/[0.04] [mask-image:linear-gradient(0deg,transparent,black)]" />
      </div>
      
      <div className="container px-4 mx-auto">
        
        {/* Mock Window Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto max-w-[1100px]"
        >
          <div className="rounded-xl border border-border/60 bg-white/60 dark:bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden font-quicksand">
            
            {/* Window Title Bar */}
            <div className="h-10 border-b bg-muted/20 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="flex items-center gap-2 opacity-30">
                <PenTool className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Studio Editor</span>
              </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex flex-col items-center justify-center min-h-[300px] p-8 md:p-12">
                
                {/* Grid Layout for Stability */}
                <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-12">
                  
                  {/* Left Side: Locale Language (Stays static after load) */}
                  <div className="flex items-center justify-center md:justify-end">
                    <AnnotatedSentence 
                      langCode={currentLocale} 
                      active={true}
                      staticMode={true}
                    />
                  </div>

                  {/* The Vertical/Horizontal Separator */}
                  <div className="self-stretch flex items-center justify-center">
                    {/* Desktop: Vertical */}
                    <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-border/50 to-transparent h-24" />
                    {/* Mobile: Horizontal */}
                    <div className="block md:hidden h-px w-24 bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                  </div>

                  {/* Right Side: Rotating Language */}
                  <div className="flex items-center justify-center md:justify-start overflow-hidden w-full">
                    <ScaleToFitContainer>
                      {/* Key change triggers remount -> re-typing */}
                      <AnnotatedSentence 
                        key={currentRotationLang} 
                        langCode={currentRotationLang} 
                        active={true} 
                        staticMode={false}
                        onComplete={handleCycleComplete}
                      />
                    </ScaleToFitContainer>
                  </div>

                </div>

            </div>
          </div>
        </motion.div>

        {/* Marketing Copy */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="mt-16 text-center max-w-4xl mx-auto space-y-8"
        >
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-serif text-foreground">
              {t('titlePlain')}
           </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/signup">
                 <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg shadow-lg shadow-primary/20">
                   {t('ctaPrimary')}
                   <ArrowRight className="ml-2 h-5 w-5" />
                 </Button>
              </Link>
              <Link href="/models">
                 <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-2">
                   {t('ctaSecondary')}
                 </Button>
              </Link>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
