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

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#30b8c8]/5 rounded-full blur-3xl -z-10" />

      <div className="container px-4 mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-20">
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
            className="text-muted-foreground text-xl md:text-2xl font-medium leading-relaxed"
          >
            {renderBoldText(t('subtitle'))}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Learn Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col p-10 rounded-[3rem] bg-muted/20 border border-primary/10 relative group shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <BookOpen className="h-4 w-4" />
                {t('learn.title')}
              </div>
              <h3 className="text-3xl md:text-4xl font-black font-outfit min-h-[5rem] lg:min-h-[6rem] leading-tight">
                {t('learn.subtitle')}
              </h3>
            </div>

            <div className="space-y-10 flex-grow">
              {learnFeatures.map((f, i) => (
                <div key={i} className="flex gap-6 group/item min-h-[5rem]">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center transition-all duration-500 group-hover/item:scale-110 shadow-sm`}>
                    <f.icon className={`h-7 w-7 ${f.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 tracking-tight">{t(`learn.items.${f.key}.title`)}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[340px] font-medium opacity-80">{t(`learn.items.${f.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-12">
              <Link href="/learn" className="inline-block w-full">
                <Button size="lg" className="w-full h-[72px] rounded-full text-xl font-bold gap-3 transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                  {t('ctaLearn')}
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Publish Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col p-10 rounded-[3rem] bg-muted/20 border border-[#30b8c8]/10 relative group shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#30b8c8]/10 text-[#30b8c8] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Globe className="h-4 w-4" />
                {t('publish.title')}
              </div>
              <h3 className="text-3xl md:text-4xl font-black font-outfit min-h-[5rem] lg:min-h-[6rem] leading-tight">
                {t('publish.subtitle')}
              </h3>
            </div>

            <div className="space-y-10 flex-grow">
              {publishFeatures.map((f, i) => (
                <div key={i} className="flex gap-6 group/item min-h-[5rem]">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center transition-all duration-500 group-hover/item:scale-110 shadow-sm`}>
                    <f.icon className={`h-7 w-7 ${f.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 tracking-tight">{t(`publish.items.${f.key}.title`)}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[340px] font-medium opacity-80">{t(`publish.items.${f.key}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-12">
              <Link href="/publish" className="inline-block w-full">
                <Button size="lg" className="w-full h-[72px] rounded-full text-xl font-bold gap-3 transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-xl shadow-[#30b8c8]/20 bg-[#22687a] hover:bg-[#1a5160]">
                  {t('ctaPublish')}
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
