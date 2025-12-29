// src/components/marketing/Hero.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('Marketing.hero');
  return (
    <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container px-4 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            <span>{t('badge')}</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8"
        >
          {t.rich('title', {
            br: () => <br />,
            span: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">{chunks}</span>
          })}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/login">
            <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 group">
              {t('ctaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl bg-background/50 backdrop-blur-sm">
              {t('ctaSecondary')}
            </Button>
          </Link>
        </motion.div>

        {/* Live Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative mx-auto max-w-5xl group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="rounded-3xl border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/10] flex flex-col">
            {/* Fake Studio Bar */}
            <div className="h-12 border-b bg-muted/20 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/20" />
                <div className="w-3 h-3 rounded-full bg-amber-400/20" />
                <div className="w-3 h-3 rounded-full bg-green-400/20" />
              </div>
              <div className="flex-1 text-[10px] text-center font-medium text-muted-foreground uppercase tracking-widest">
                Twenty Thousand Leagues Under the Sea — Chapter 1
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div className="w-64 border-r bg-muted/10 p-4 space-y-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-2 rounded bg-muted/30" style={{ width: `${Math.random() * 40 + 40}%` }} />
                 ))}
              </div>
              <div className="flex-1 p-12 bg-background/50 flex gap-8">
                 <div className="flex-1 space-y-4">
                    <div className="h-4 w-3/4 rounded bg-primary/20" />
                    <div className="h-4 w-full rounded bg-muted/20" />
                    <div className="h-4 w-5/6 rounded bg-muted/20" />
                    <div className="h-4 w-4/5 rounded bg-muted/20" />
                 </div>
                 <div className="flex-1 space-y-4">
                    <div className="h-4 w-3/4 rounded bg-blue-500/20" />
                    <div className="h-4 w-full rounded bg-muted/20" />
                    <div className="h-4 w-2/3 rounded bg-muted/20 text-xs italic flex items-center gap-1 opacity-50">
                       <Sparkles className="h-3 w-3" /> {t('aiSuggestion')}
                    </div>
                    <div className="h-4 w-4/5 rounded bg-muted/20" />
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
