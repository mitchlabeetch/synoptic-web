// src/app/(marketing)/models/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Layout, Layers, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ModelsPage() {
  const t = useTranslations('ModelsPage');

  const templateKeys = ['classic', 'alternating', 'academic', 'modern'];
  const images: Record<string, string> = {
    classic: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
    alternating: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    academic: "https://images.unsplash.com/photo-1543003322-b2da835a8289?auto=format&fit=crop&q=80&w=400",
    modern: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=400"
  };

  return (
    <div className="py-24 bg-background selection:bg-primary/20">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-8 font-outfit italic">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {templateKeys.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-3xl overflow-hidden border bg-card hover:shadow-2xl transition-all"
            >
              <div className="aspect-[3/4] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                <img src={images[key]} alt={key} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{t(`templates.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t(`templates.${key}.desc`)}</p>
                <Button variant="ghost" className="p-0 hover:bg-transparent text-primary font-bold gap-2 group-hover:translate-x-2 transition-transform">
                  View Template <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-muted/30 rounded-[4rem] p-12 md:p-20 border border-border/50">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 font-outfit">{t('pixelPerfect')}</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Layout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{t('gutterTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{t('gutterDesc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#30b8c8]/10 flex items-center justify-center flex-shrink-0">
                    <Layers className="h-5 w-5 text-[#30b8c8]" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{t('symmetryTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{t('symmetryDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background rounded-3xl border p-2 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
              <div className="border-2 border-dashed border-primary/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-6">
                 <div className="flex gap-4 w-full">
                    <div className="h-4 w-full bg-muted rounded-full animate-pulse" />
                    <div className="h-4 w-full bg-primary/20 rounded-full animate-pulse delay-75" />
                 </div>
                 <div className="flex gap-4 w-full">
                    <div className="h-4 w-full bg-muted rounded-full animate-pulse delay-100" />
                    <div className="h-4 w-full bg-primary/20 rounded-full animate-pulse delay-150" />
                 </div>
                 <div className="flex gap-4 w-full">
                    <div className="h-4 w-full bg-muted rounded-full animate-pulse delay-200" />
                    <div className="h-4 w-full bg-primary/20 rounded-full animate-pulse delay-300" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 mt-4">Typesetting Engine v4.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
