// src/app/(marketing)/privacy/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Cloud } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('PrivacyPage');

  return (
    <div className="py-24 bg-background selection:bg-primary/20">
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-outfit italic">{t('title')}</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="space-y-16">
          {/* 1. Philosophy */}
          <section>
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
               <Shield className="h-5 w-5 text-primary" />
               {t('philosophyTitle')}
             </h2>
             <p className="text-muted-foreground">{t('philosophyDesc')}</p>
          </section>

          {/* 2. Collection */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Eye className="h-5 w-5 text-[#30b8c8]" />
              {t('collectTitle')}
            </h2>
            <p className="text-muted-foreground mb-4">{t('collectDesc')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {t.raw('collectItems').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 3. AI & Siloing (The "No-Train" Guarantee) */}
          <section className="p-8 rounded-3xl bg-muted/20 border border-border/50">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-blue-500" />
              {t('aiProcessingTitle')}
            </h2>
            <p className="text-muted-foreground">{t('aiProcessingDesc')}</p>
          </section>

          {/* 4. Security */}
           <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-500" />
              {t('securityTitle')}
            </h2>
            <p className="text-muted-foreground">{t('securityDesc')}</p>
          </section>

          {/* 5. Sharing */}
          <section>
             <h2 className="text-2xl font-bold mb-6">{t('sharingTitle')}</h2>
             <p className="text-muted-foreground">{t('sharingDesc')}</p>
          </section>

           {/* 6. Contact */}
           <section>
             <h2 className="text-2xl font-bold mb-6">{t('contactTitle')}</h2>
             <p className="text-muted-foreground">{t('contactDesc')}</p>
          </section>

          <footer className="pt-20 border-t">
            <p className="text-sm text-muted-foreground">{t('lastUpdated')}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
