// src/app/(marketing)/learn/page.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BrainCircuit, 
  Languages, 
  GraduationCap,
  ChevronRight,
  Monitor,
  Library,
  ArrowRight
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LearnPage() {
  const t = useTranslations('LearnPage');
  const tModels = useTranslations('ModelsPage');

  const features = [
    { key: "reader", icon: Monitor, color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "study", icon: BrainCircuit, color: "text-amber-500", bg: "bg-amber-500/10" },
    { key: "custom", icon: Library, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="bg-background selection:bg-primary/20">
      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />
          
          <div className="container px-4 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-bold mb-8"
            >
              <GraduationCap className="h-4 w-4" />
              {t('badge')}
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 font-outfit leading-[1.1]"
            >
              {t('title')}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-primary shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95">
                  {t('cta')}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/library">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-2 hover:bg-muted/50 transition-all">
                  {t('browseLibrary')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-32 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[2.5rem] bg-background border border-border/50 hover:shadow-2xl transition-all group"
                >
                  <div className={`w-16 h-16 rounded-[1.25rem] ${f.bg} flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <f.icon className={`h-8 w-8 ${f.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t(`features.${f.key}.title`)}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {t(`features.${f.key}.desc`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Immersion Section */}
        <section className="py-32 overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="w-full lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-black mb-6 font-outfit">{t('immersion.title')}</h2>
                <div className="space-y-6 text-lg text-muted-foreground font-medium">
                  <p>{t('immersion.p1')}</p>
                  <p>{t('immersion.p2')}</p>
                  <div className="pt-8 flex flex-wrap gap-4">
                    <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('immersion.tag1')}
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary font-bold flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    {t('immersion.tag2')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2 relative">
                <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center p-8 border border-primary/10 shadow-inner">
                  <div className="w-full h-full rounded-[2rem] bg-background shadow-2xl overflow-hidden border border-border flex">
                    <div className="w-1/2 border-r p-6 space-y-4">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground/40 mb-2">Original</p>
                       <p className="text-sm font-medium leading-relaxed font-serif text-foreground/80">
                         {tModels('exampleSource')}
                       </p>
                    </div>
                    <div className="w-1/2 p-6 space-y-4 bg-primary/5">
                       <p className="text-[10px] uppercase font-bold text-primary/40 mb-2">Translation</p>
                       <p className="text-sm font-medium leading-relaxed font-outfit text-foreground">
                         {tModels('exampleTarget')}
                       </p>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-6 -right-6 p-6 rounded-3xl bg-[#30b8c8] text-white shadow-2xl font-bold animate-bounce hidden md:block">
                  {t('immersion.verified')}
                </div>
                <div className="absolute -bottom-6 -left-6 p-6 rounded-3xl bg-amber-500 text-white shadow-2xl font-bold animate-pulse hidden md:block">
                  {t('immersion.flashcard')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container px-4 mx-auto">
            <div className="p-12 md:p-24 rounded-[3rem] bg-[#22687a] text-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(48,184,200,0.3),transparent)]" />
              <div className="relative z-10 text-center max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-8 font-outfit">{t('ctaSection.title')}</h2>
                <p className="text-xl text-white/80 mb-12 font-medium">{t('ctaSection.subtitle')}</p>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-white text-[#22687a] hover:bg-white/90 h-16 px-12 rounded-2xl text-xl font-bold transition-transform hover:scale-105 active:scale-95">
                    {t('ctaSection.button')}
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
