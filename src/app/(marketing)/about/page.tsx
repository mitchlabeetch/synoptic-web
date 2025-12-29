// src/app/(marketing)/about/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Globe, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  const t = useTranslations('AboutPage');

  return (
    <div className="py-24 bg-background selection:bg-primary/20">
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-8 font-outfit italic">{t('title')}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-outfit">{t('sovereignTitle')}</h2>
            <p className="text-muted-foreground">{t('sovereignDesc')}</p>
          </div>
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#30b8c8]/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[#30b8c8]" />
            </div>
            <h2 className="text-3xl font-bold font-outfit">{t('soulTitle')}</h2>
            <p className="text-muted-foreground">{t('soulDesc')}</p>
          </div>
        </div>

        <div className="p-12 rounded-[3.5rem] bg-muted/30 border border-border/50">
          <h2 className="text-4xl font-black mb-12 font-outfit">{t('values')}</h2>
          <div className="grid gap-8">
            <div className="flex gap-6">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold mb-2">{t('privacyTitle')}</h4>
                <p className="text-muted-foreground">{t('privacyDesc')}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <Zap className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold mb-2">{t('perfTitle')}</h4>
                <p className="text-muted-foreground">{t('perfDesc')}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <Users className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold mb-2">{t('communityTitle')}</h4>
                <p className="text-muted-foreground">{t('communityDesc')}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-32 text-center">
          <Link href="/auth/signup">
            <Button size="lg" className="h-16 px-12 rounded-2xl bg-primary font-bold text-lg hover:scale-[1.02] transition-transform">
              {t('cta')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
