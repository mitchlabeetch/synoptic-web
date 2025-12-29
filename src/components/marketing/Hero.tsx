// src/components/marketing/Hero.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, MoveRight, Shapes } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const HERO_TRANSLATIONS = [
  { lang: 'French', code: 'fr', text: 'Le Studio Bilingue Ultime', dir: 'ltr' },
  { lang: 'Spanish', code: 'es', text: 'El Estudio Bilingüe Definitivo', dir: 'ltr' },
  { lang: 'German', code: 'de', text: 'Das Ultimative Zweisprachige Studio', dir: 'ltr' },
  { lang: 'Italian', code: 'it', text: 'Lo Studio Bilingue Definitivo', dir: 'ltr' },
  { lang: 'Japanese', code: 'ja', text: '究極のバイリンガルスタジオ', dir: 'ltr' },
  { lang: 'Arabic', code: 'ar', text: 'الاستوديو ثنائي اللغة النهائي', dir: 'rtl' },
  { lang: 'Portuguese', code: 'pt', text: 'O Estúdio Bilíngue Definitivo', dir: 'ltr' },
];

export function Hero() {
  const [currentLangIndex, setCurrentLangIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLangIndex((prev) => (prev + 1) % HERO_TRANSLATIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentTranslation = HERO_TRANSLATIONS[currentLangIndex];

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            <span>Synoptic v1.0 Private Beta</span>
          </div>
        </motion.div>

        {/* Interactive Bilingual Hero Mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto max-w-6xl"
        >
          <div className="rounded-3xl border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Studio Bar */}
            <div className="h-12 border-b bg-muted/20 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/20" />
                <div className="w-3 h-3 rounded-full bg-amber-400/20" />
                <div className="w-3 h-3 rounded-full bg-green-400/20" />
              </div>
              <div className="flex-1 text-[10px] text-center font-medium text-muted-foreground uppercase tracking-widest">
                Hero Title — Synoptic Studio
              </div>
            </div>
            
            {/* Main Content - Side by Side Layout */}
            <div className="flex">
              {/* Sidebar */}
              <div className="hidden lg:block w-56 border-r bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shapes className="h-3 w-3" />
                  <span className="font-bold uppercase tracking-wide">Elements</span>
                </div>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-2 rounded bg-muted/30" style={{ width: `${Math.random() * 30 + 50}%` }} />
                ))}
              </div>

              {/* Bilingual Content Area */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-[500px] md:min-h-[600px]">
                {/* Left Panel - English (Origin) */}
                <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative bg-background/30">
                  <div className="absolute top-4 left-6 text-[9px] font-bold uppercase tracking-widest text-primary/60">
                    ENGLISH
                  </div>
                  
                  <div className="space-y-6 relative">
                    {/* Decorative Group */}
                    <div className="absolute -left-2 top-8 w-1 h-20 bg-gradient-to-b from-primary/40 to-transparent rounded-full" />
                    
                    <motion.h1 
                      className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">Ultimate</span> Bilingual Studio
                    </motion.h1>
                    
                    <motion.p 
                      className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      Craft professional side-by-side books with AI-assisted typesetting
                    </motion.p>

                    {/* Decorative Arrow */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="hidden lg:block absolute -right-8 top-12"
                    >
                      <MoveRight className="h-6 w-6 text-primary/30" />
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="flex flex-col sm:flex-row gap-3 mt-8"
                  >
                    <Link href="/auth/login">
                      <Button size="lg" className="h-12 px-6 font-bold rounded-xl shadow-lg shadow-primary/20 group">
                        Start Writing Free
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link href="/library">
                      <Button variant="outline" size="lg" className="h-12 px-6 font-bold rounded-xl">
                        Explore Library
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                {/* Divider */}
                <div className="w-full lg:w-px h-px lg:h-auto bg-gradient-to-b from-transparent via-border to-transparent" />

                {/* Right Panel - Animated Translation */}
                <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative bg-background/50">
                  <div className="absolute top-4 left-6 text-[9px] font-bold uppercase tracking-widest text-blue-500/60 flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentTranslation.lang}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentTranslation.lang.toUpperCase()}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  
                  <div className="space-y-6 relative" dir={currentTranslation.dir}>
                    {/* Decorative Group */}
                    <div className="absolute -right-2 top-8 w-1 h-20 bg-gradient-to-b from-blue-500/40 to-transparent rounded-full" />
                    
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={currentTranslation.code}
                        initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                      >
                        {currentTranslation.text}
                      </motion.h1>
                    </AnimatePresence>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground italic"
                    >
                      <Sparkles className="h-3 w-3 text-blue-500" />
                      <span>AI-powered translation</span>
                    </motion.div>

                    {/* Decorative Highlight */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      className="h-1 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-8 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto"
        >
          Real-time cloud sync • Print-ready PDF/EPUB • One-click KDP publishing
        </motion.p>
      </div>
    </section>
  );
}
