// src/app/(marketing)/terms/page.tsx
'use client';

import { motion } from 'framer-motion';
import { FileText, Scale, Gavel, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TermsPage() {
  const t = useTranslations('TermsPage');

  return (
    <div className="py-24 bg-background selection:bg-primary/20">
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-outfit italic">{t('title')}</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="space-y-12">
          <section className="p-8 rounded-3xl bg-muted/20 border border-border/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Scale className="h-5 w-5 text-primary" />
              {t('ownershipTitle')}
            </h2>
            <p className="text-muted-foreground">{t('ownershipDesc')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">{t('useTitle')}</h2>
            <p className="text-muted-foreground mb-4">{t('useDesc')}</p>
            <div className="grid gap-4 mt-6">
              {t.raw('useItems').map((item: string, i: number) => (
                <div key={i} className="flex gap-3 items-center text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Gavel className="h-5 w-5 text-amber-500" />
              {t('subTitle')}
            </h2>
            <p className="text-muted-foreground">{t('subDesc')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
