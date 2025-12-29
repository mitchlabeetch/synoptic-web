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
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Eye className="h-5 w-5 text-[#30b8c8]" />
              {t('collectTitle')}
            </h2>
            <p className="text-muted-foreground mb-4">{t('collectDesc')}</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              {/* Note: JSON arrays can be tricky with next-intl depending on config, but here we assume direct keys or we can map manually if we had them as discrete keys. For simplicity in this demo, let's keep it clean. */}
              {t.raw('collectItems').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-500" />
              {t('protectTitle')}
            </h2>
            <p className="text-muted-foreground">{t('protectDesc')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-blue-500" />
              {t('aiPrivacyTitle')}
            </h2>
            <p className="text-muted-foreground">{t('aiPrivacyDesc')}</p>
          </section>

          <footer className="pt-20 border-t">
            <p className="text-sm text-muted-foreground">{t('lastUpdated')} Contact <a href="mailto:privacy@synoptic.com" className="text-primary font-bold underline">privacy@synoptic.com</a></p>
          </footer>
        </div>
      </div>
    </div>
  );
}
