// src/components/marketing/InteractiveDemo.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { 
  Play, 
  Sparkles, 
  Type, 
  ArrowRight,
  RotateCcw,
  Wand2,
  CheckCircle2,
  MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

// Demo content in different languages
const DEMO_SENTENCES = {
  en: "The stars shimmered like diamonds scattered across the velvet night sky.",
  fr: "Les étoiles scintillaient comme des diamants dispersés sur le ciel nocturne de velours.",
  es: "Las estrellas brillaban como diamantes esparcidos por el cielo nocturno de terciopelo.",
  de: "Die Sterne schimmerten wie Diamanten, verstreut über den samtenen Nachthimmel.",
};

type DemoStep = 'idle' | 'typing' | 'translating' | 'complete';

export function InteractiveDemo() {
  const t = useTranslations('InteractiveDemo');
  const [demoStep, setDemoStep] = useState<DemoStep>('idle');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedLang, setSelectedLang] = useState<'fr' | 'es' | 'de'>('fr');

  const resetDemo = useCallback(() => {
    setDemoStep('idle');
    setSourceText('');
    setTranslatedText('');
  }, []);

  const startDemo = useCallback(() => {
    setDemoStep('typing');
    setSourceText('');
    setTranslatedText('');

    // Simulate typing effect
    const text = DEMO_SENTENCES.en;
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setSourceText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        // Start "AI translation" after a brief pause
        setTimeout(() => {
          setDemoStep('translating');
          
          // Simulate AI translation
          setTimeout(() => {
            const translation = DEMO_SENTENCES[selectedLang];
            let transCharIndex = 0;
            
            const translateInterval = setInterval(() => {
              if (transCharIndex < translation.length) {
                setTranslatedText(translation.slice(0, transCharIndex + 1));
                transCharIndex++;
              } else {
                clearInterval(translateInterval);
                setDemoStep('complete');
              }
            }, 15); // Faster for translation
          }, 800);
        }, 500);
      }
    }, 25);
  }, [selectedLang]);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ] as const;

  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="demo">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background -z-10" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#30b8c8]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="container px-4 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <MousePointerClick className="h-4 w-4" />
            {t('badge')}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 font-outfit">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Demo Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Demo Toolbar */}
            <div className="h-14 border-b bg-muted/30 flex items-center px-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('sandboxTitle')}
                </span>
              </div>
              
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">{t('translateTo')}:</span>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      if (demoStep === 'complete') resetDemo();
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedLang === lang.code
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px]">
              {/* Source Panel */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('sourceLabel')} (English)
                  </span>
                </div>
                <div className="min-h-[120px]">
                  <p className="text-lg leading-relaxed font-medium">
                    {sourceText}
                    {demoStep === 'typing' && (
                      <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-0.5" />
                    )}
                  </p>
                  {demoStep === 'idle' && (
                    <p className="text-muted-foreground/50 italic">
                      {t('clickToStart')}
                    </p>
                  )}
                </div>
              </div>

              {/* Translation Panel */}
              <div className="p-8 bg-muted/10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('translationLabel')} ({languages.find(l => l.code === selectedLang)?.label})
                  </span>
                  
                  {/* AI Status Badge */}
                  <AnimatePresence mode="wait">
                    {demoStep === 'translating' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Wand2 className="h-3 w-3 animate-pulse" />
                        {t('aiProcessing')}
                      </motion.span>
                    )}
                    {demoStep === 'complete' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {t('complete')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="min-h-[120px]">
                  <p className="text-lg leading-relaxed font-medium text-primary">
                    {translatedText}
                    {demoStep === 'translating' && translatedText && (
                      <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-0.5" />
                    )}
                  </p>
                  {(demoStep === 'idle' || demoStep === 'typing') && (
                    <p className="text-muted-foreground/50 italic">
                      {t('translationWaiting')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Demo Controls */}
            <div className="h-16 border-t bg-muted/20 flex items-center justify-center px-6 gap-4">
              {demoStep === 'idle' ? (
                <Button
                  onClick={startDemo}
                  size="lg"
                  className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20"
                >
                  <Play className="h-4 w-4" />
                  {t('tryItNow')}
                </Button>
              ) : demoStep === 'complete' ? (
                <>
                  <Button
                    onClick={resetDemo}
                    variant="outline"
                    size="lg"
                    className="gap-2 rounded-full px-6"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('tryAgain')}
                  </Button>
                  <Link href="/auth/signup">
                    <Button
                      size="lg"
                      className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20"
                    >
                      {t('createAccount')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {demoStep === 'typing' ? t('simulatingInput') : t('aiTranslating')}
                </div>
              )}
            </div>
          </div>

          {/* Demo Note */}
          <p className="text-center text-xs text-muted-foreground/60 mt-4">
            {t('note')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
