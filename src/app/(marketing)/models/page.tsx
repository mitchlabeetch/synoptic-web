// src/app/(marketing)/models/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Layout, Layers, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const TemplatePreview = ({ type }: { type: string }) => {
  return (
    <div className="w-full h-full bg-muted/20 flex items-center justify-center p-8 group-hover:bg-muted/30 transition-colors">
      <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-sm transition-transform duration-700 group-hover:scale-105">
        <rect x="0" y="0" width="100" height="140" fill="white" rx="2" />
        {type === 'classic' && (
          <g fill="#e2e8f0">
            <rect x="10" y="15" width="38" height="2" />
            <rect x="10" y="20" width="38" height="100" rx="1" />
            <rect x="52" y="15" width="38" height="2" />
            <rect x="52" y="20" width="38" height="100" rx="1" />
          </g>
        )}
        {type === 'alternating' && (
          <g fill="#e2e8f0">
            <rect x="10" y="15" width="80" height="20" rx="1" />
            <rect x="10" y="40" width="80" height="20" rx="1" fill="#cbd5e1" />
            <rect x="10" y="65" width="80" height="20" rx="1" />
            <rect x="10" y="90" width="80" height="20" rx="1" fill="#cbd5e1" />
          </g>
        )}
        {type === 'academic' && (
          <g fill="#e2e8f0">
            <rect x="15" y="15" width="70" height="60" rx="1" />
            <line x1="10" y1="85" x2="90" y2="85" stroke="#cbd5e1" strokeWidth="0.5" />
            <rect x="15" y="95" width="70" height="30" rx="1" fill="#cbd5e1" opacity="0.6" />
          </g>
        )}
        {type === 'modern' && (
          <g fill="#e2e8f0">
            <rect x="25" y="25" width="50" height="90" rx="1" />
            <circle cx="50" cy="15" r="2" fill="#cbd5e1" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default function ModelsPage() {
  const t = useTranslations('ModelsPage');

  const templateKeys = ['classic', 'alternating', 'academic', 'modern'];

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
              <div className="aspect-[3/4] overflow-hidden">
                <TemplatePreview type={key} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{t(`templates.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t(`templates.${key}.desc`)}</p>
                <Button variant="ghost" className="p-0 hover:bg-transparent text-primary font-bold gap-2 group-hover:translate-x-2 transition-transform">
                  {t('viewTemplate')} <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-muted/30 rounded-[4rem] p-12 md:p-20 border border-border/50">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 font-outfit">{t('typesettingTitle')}</h2>
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
              <div className="border-2 border-dashed border-primary/20 rounded-2xl p-8 flex flex-col gap-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                       {t('labels.source', { lang: 'EN' })}
                    </p>
                    <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">
                       {t('exampleSource')}
                    </p>
                 </div>
                 <div className="h-px bg-border/50" />
                 <div className="space-y-2 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#30b8c8]/50">
                       {t('labels.translation', { lang: 'FR' })}
                    </p>
                    <p className="text-sm font-bold text-foreground leading-relaxed">
                       {t('exampleTarget')}
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
