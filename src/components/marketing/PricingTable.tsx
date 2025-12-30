// src/components/marketing/PricingTable.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function PricingTable() {
  const t = useTranslations('Pricing');

  const tiers = [
    {
      key: "free",
      price: "$0",
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
      price: "$12",
      period: t('month'),
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
      price: "$29",
      period: t('month'),
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

  return (
    <section className="py-24" id="pricing">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t('title')}</h2>
          <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
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
                  <span className="text-4xl font-black">{tier.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">{tier.period}</span>
                </div>
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-4xl mx-auto p-12 rounded-[3.5rem] bg-muted/20 border border-border/50 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              {/* Note: We use tPage normally for this section but since we are inside PricingTable which uses 'Pricing' namespace, 
                  we will just use t('unitCalculator.title') assuming we moved it to Pricing or accessible via some way. 
                  Actually, best practice: load the namespace. 
              */}
              <UnitCalculatorSection />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function UnitCalculatorSection() {
  const t = useTranslations('PricingPage.unitCalculator');
  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-4 font-outfit">{t('title')}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed italic mb-8">
        {t('desc')}
      </p>
      <div className="p-6 rounded-2xl bg-background/50 border border-primary/10 space-y-4">
         <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <p className="text-sm text-muted-foreground">{renderBold(t('p1'))}</p>
         </div>
         <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <p className="text-sm text-muted-foreground">{renderBold(t('p2'))}</p>
         </div>
         <div className="pt-4 border-t border-border/50">
             <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                {renderBold(t('fairUse'))}
             </p>
         </div>
      </div>
    </div>
  );
}

const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
};
