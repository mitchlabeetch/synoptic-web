// src/components/marketing/PricingTable.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const tiers = [
  {
    name: "Free",
    price: "$0",
    desc: "Perfect for testing the studio.",
    features: [
      "1 Active Project",
      "Standard Layout Engine",
      "Manual Translation",
      "Low-DPI PDF Export",
      "Watermarked Publishing"
    ],
    buttonText: "Start Free",
    premium: false
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For serious authors and polyglots.",
    features: [
      "Unlimited Projects",
      "AI-Assisted Layout",
      "50k AI Words / Month",
      "300 DPI Export (Print-Ready)",
      "EPUB & MOBI Export",
      "Removing Watermarks",
      "Priority Cloud History"
    ],
    buttonText: "Join Pro",
    premium: true,
    highlight: true
  },
  {
    name: "Publisher",
    price: "$29",
    period: "/mo",
    desc: "For professional publishing houses.",
    features: [
      "Everything in Pro",
      "Unlimited AI Credits",
      "Team Collaboration",
      "Brand Customization",
      "Custom Font Upload",
      "API Access (Coming Soon)"
    ],
    buttonText: "Go Publisher",
    premium: true
  }
];

export function PricingTable() {
  return (
    <section className="py-24" id="pricing">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Simple, Fair Pricing</h2>
          <p className="text-muted-foreground text-lg">Choose the plan that fits your publishing goals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border ${t.highlight ? 'border-primary shadow-2xl shadow-primary/10 bg-card z-10' : 'bg-card/50'}`}
            >
              {t.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{t.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{t.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">{t.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t.desc}</p>
              </div>

              <div className="space-y-4 mb-8">
                {t.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span className="text-muted-foreground font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={t.highlight ? "default" : "outline"} 
                className={`w-full h-12 rounded-2xl font-bold ${t.highlight ? 'shadow-xl shadow-primary/20' : ''}`}
              >
                {t.buttonText}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
