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
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4">{t('introTitle')}</h2>
            <p className="text-muted-foreground">{t('introDesc')}</p>
          </section>

          {/* 2. Intellectual Property */}
          <section className="p-8 rounded-3xl bg-muted/20 border border-border/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Scale className="h-5 w-5 text-primary" />
              {t('ipTitle')}
            </h2>
            <p className="text-muted-foreground mb-4">{t('ipDesc')}</p>
            <ul className="grid gap-2">
              {t.raw('ipItems').map((item: string, i: number) => (
                <li key={i} className="flex gap-2 items-start text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. User Obligations */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Gavel className="h-5 w-5 text-amber-500" />
              {t('obligationsTitle')}
            </h2>
            <p className="text-muted-foreground">{t('obligationsDesc')}</p>
          </section>

          {/* 4. Subscriptions & AI Units */}
          <section className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
            <h2 className="text-2xl font-bold mb-4 text-[#30b8c8]">{t('paymentTitle')}</h2>
            <p className="text-muted-foreground">{t('paymentDesc')}</p>
          </section>

           {/* 5. Publishing Disclaimers */}
           <section>
            <h2 className="text-2xl font-bold mb-4">{t('publishingTitle')}</h2>
            <p className="text-muted-foreground">{t('publishingDesc')}</p>
          </section>

          {/* 6. Termination */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-red-400">{t('terminationTitle')}</h2>
            <p className="text-muted-foreground">{t('terminationDesc')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
