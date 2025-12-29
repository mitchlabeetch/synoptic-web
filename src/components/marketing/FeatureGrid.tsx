// src/components/marketing/FeatureGrid.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BookOpen, 
  FileCheck, 
  Zap,
  Globe,
  ArrowRight,
  BrainCircuit,
  Layout,
  BookMarked
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function FeatureGrid() {
  const t = useTranslations('Features');
  
  const learnFeatures = [
    { key: "flashcards", icon: BrainCircuit, color: "text-amber-500", bg: "bg-amber-500/10" },
    { key: "deepInsights", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "sideBySide", icon: BookMarked, color: "text-green-500", bg: "bg-green-500/10" }
  ];

  const publishFeatures = [
    { key: "kdpReady", icon: FileCheck, color: "text-red-500", bg: "bg-red-500/10" },
    { key: "aiTypesetter", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
    { key: "branding", icon: Layout, color: "text-indigo-500", bg: "bg-indigo-500/10" }
  ];

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#30b8c8]/5 rounded-full blur-3xl -z-10" />

      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-6 font-outfit"
          >
            {t('title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-xl font-medium"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Learn Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col space-y-8 p-10 rounded-[2.5rem] bg-muted/30 border border-primary/10 relative group"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-bold uppercase tracking-widest">
                <BookOpen className="h-4 w-4" />
                {t('learn.title')}
              </div>
              <h3 className="text-3xl font-bold">{t('learn.subtitle')}</h3>
            </div>

            <div className="grid gap-6">
              {learnFeatures.map((f, i) => (
                <div key={i} className="flex gap-5 group/item">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center transition-transform group-hover/item:scale-110`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">{t(`learn.items.${f.key}.title`)}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(`learn.items.${f.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-auto">
              <Link href="/learn" className="inline-block w-full">
                <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-bold gap-2 bg-primary hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-primary/20">
                  {t('ctaLearn')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Publish Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col space-y-8 p-10 rounded-[2.5rem] bg-muted/30 border border-[#30b8c8]/10 relative group"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#30b8c8]/10 text-[#30b8c8] text-sm font-bold uppercase tracking-widest">
                <Globe className="h-4 w-4" />
                {t('publish.title')}
              </div>
              <h3 className="text-3xl font-bold">{t('publish.subtitle')}</h3>
            </div>

            <div className="grid gap-6">
              {publishFeatures.map((f, i) => (
                <div key={i} className="flex gap-5 group/item">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center transition-transform group-hover/item:scale-110`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">{t(`publish.items.${f.key}.title`)}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(`publish.items.${f.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-auto">
              <Link href="/publish" className="inline-block w-full">
                <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-bold gap-2 bg-[#22687a] hover:bg-[#1a5160] hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-[#30b8c8]/20">
                  {t('ctaPublish')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
