// src/components/marketing/PricingTable.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function PricingTable() {
  const t = useTranslations('Pricing');
  const [isYearly, setIsYearly] = useState(false);

  // Calculate yearly prices (20% discount)
  const YEARLY_DISCOUNT = 0.20;

  const tiers = [
    {
      key: "free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "activeProject",
        "standardLayout",
        "manualTranslation",
        "lowDpiPdf",
        "watermarked",
        "limitedAi"
      ],
      premium: false
    },
    {
      key: "pro",
      monthlyPrice: 12,
      yearlyPrice: Math.round(12 * 12 * (1 - YEARLY_DISCOUNT)), // €115/year instead of €144
      features: [
        "unlimitedProjects",
        "aiAssistedLayout",
        "aiWordsMonth",
        "highDpiPdf",
        "epubMobi",
        "removeWatermarks",
        "priorityHistory",
        "flashcards",
        "tts"
      ],
      premium: true,
      highlight: true
    },
    {
      key: "publisher",
      monthlyPrice: 29,
      yearlyPrice: Math.round(29 * 12 * (1 - YEARLY_DISCOUNT)), // €278/year instead of €348
      features: [
        "everythingPro",
        "bigAiLimit",
        "teamCollab",
        "brandCustom",
        "fontUpload",
        "ttsPremium"
      ],
      premium: true
    }
  ];

  const formatPrice = (tier: typeof tiers[0]) => {
    if (tier.monthlyPrice === 0) return "€0";
    if (isYearly) {
      const monthlyEquivalent = Math.round(tier.yearlyPrice / 12);
      return `€${monthlyEquivalent}`;
    }
    return `€${tier.monthlyPrice}`;
  };

  const getPeriodLabel = (tier: typeof tiers[0]) => {
    if (tier.monthlyPrice === 0) return '';
    return t('month');
  };

  const getYearlyTotal = (tier: typeof tiers[0]) => {
    if (tier.monthlyPrice === 0) return null;
    return `€${tier.yearlyPrice}/${t('year')}`;
  };

  return (
    <section className="py-24" id="pricing">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t('title')}</h2>
          <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "text-sm font-semibold transition-colors px-4 py-2 rounded-full",
              !isYearly 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('monthlyLabel')}
          </button>
          
          {/* Toggle Switch */}
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-8 rounded-full bg-muted border border-border transition-colors"
            aria-label="Toggle yearly billing"
          >
            <motion.div
              className="absolute top-1 w-6 h-6 rounded-full bg-primary shadow-md"
              animate={{ left: isYearly ? '1.75rem' : '0.25rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "text-sm font-semibold transition-colors px-4 py-2 rounded-full flex items-center gap-2",
              isYearly 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('yearlyLabel')}
            {/* Savings Badge */}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
              isYearly 
                ? "bg-emerald-500 text-white" 
                : "bg-emerald-500/20 text-emerald-600"
            )}>
              {t('saveBadge')}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border flex flex-col h-full ${tier.highlight ? 'border-primary shadow-2xl shadow-primary/10 bg-card z-10' : 'bg-card/50'}`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="h-3 w-3" /> {t('mostPopular')}
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{t(`${tier.key}.name`)}</h3>
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${tier.key}-${isYearly}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="text-4xl font-black"
                    >
                      {formatPrice(tier)}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-muted-foreground text-sm font-medium">{getPeriodLabel(tier)}</span>
                </div>
                {/* Yearly total */}
                {isYearly && tier.monthlyPrice > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-muted-foreground mt-1"
                  >
                    {t('billedAnnually')}: {getYearlyTotal(tier)}
                  </motion.p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{t(`${tier.key}.desc`)}</p>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                {tier.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span className="text-muted-foreground font-medium">{t(`featuresList.${f}`)}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth/signup" className="mt-auto">
                <Button 
                  variant={tier.highlight ? "default" : "outline"} 
                  className={`w-full h-[60px] rounded-full font-bold text-lg transition-all hover:scale-[1.03] ${tier.highlight ? 'shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90' : 'hover:bg-muted/50'}`}
                >
                  {t(`${tier.key}.button`)}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
