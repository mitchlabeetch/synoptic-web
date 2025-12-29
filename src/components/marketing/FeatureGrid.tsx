// src/components/marketing/FeatureGrid.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Cloud, 
  FileDown, 
  Printer, 
  ShieldCheck, 
  Languages,
  Zap,
  Globe
} from 'lucide-react';

const features = [
  {
    title: "AI Typesetter",
    desc: "Automatically aligns sentence pairs across 25+ languages, ensuring flawless symmetry even with varying sentence lengths.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Cloud Sync Engine",
    desc: "Your work is saved instantly as you type. Access your studio from any device with a persistent, infinite undo history.",
    icon: Cloud,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Print-Ready PDF",
    desc: "High-resolution export via Puppeteer engine. Perfect for Amazon KDP, IngramSpark, and local print shops.",
    icon: Printer,
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    title: "EPUB 3.0 Support",
    desc: "Generate reflowable eBooks with native bilingual alternating mode, optimized for Kindle and Apple Books.",
    icon: FileDown,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  {
    title: "Deep Annotation",
    desc: "AI-powered linguistic insights. Word grouping, relationship arrows, and contextual explanations at your fingertips.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10"
  },
  {
    title: "Global Marketplace",
    desc: "Share and sell your custom book templates or browse our library of curated, professional bilingual designs.",
    icon: Globe,
    color: "text-green-500",
    bg: "bg-green-500/10"
  }
];

export function FeatureGrid() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Built for Creators</h2>
          <p className="text-muted-foreground text-lg italic">The infrastructure of a publishing house, simplified into a studio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl border bg-card hover:bg-card/80 transition-all hover:shadow-xl hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
