// src/app/(marketing)/publish/page.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Zap,
  Globe,
  ArrowRight,
  ShieldCheck,
  Printer,
  Layers
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PublishPage() {
  const t = useTranslations('PublishPage');

  const features = [
    { key: "engine", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
    { key: "exports", icon: Printer, color: "text-[#30b8c8]", bg: "bg-[#30b8c8]/10" },
    { key: "distribution", icon: Globe, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="bg-background selection:bg-primary/20">
      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#30b8c8]/5 rounded-full blur-[120px] -z-10" />
          
          <div className="container px-4 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#30b8c8]/10 border border-[#30b8c8]/20 text-[#22687a] text-sm font-bold mb-8 uppercase tracking-widest"
            >
              <ShieldCheck className="h-4 w-4" />
              Professional Publishing Infrastructure
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 font-outfit leading-[1.1]"
            >
              {t('title')}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 font-medium leading-relaxed"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-[#22687a] hover:bg-[#1a5160] shadow-2xl shadow-[#30b8c8]/20 hover:scale-[1.02] transition-transform active:scale-95">
                  {t('cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-2 hover:bg-muted/50 transition-all">
                  Enterprise Solutions
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid / Feature Grid */}
        <section className="py-32 bg-muted/20">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[3rem] bg-background border-t-4 border-t-[#30b8c8] shadow-sm hover:shadow-2xl transition-all group"
                >
                  <div className={`w-16 h-16 rounded-[1.25rem] ${f.bg} flex items-center justify-center mb-8 transition-transform group-hover:scale-110`}>
                    <f.icon className={`h-8 w-8 ${f.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t(`features.${f.key}.title`)}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg font-medium">
                    {t(`features.${f.key}.desc`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Production Workflow Section */}
        <section className="py-40 relative">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-6xl font-black mb-6 font-outfit">Built for High-Volume Production</h2>
              <p className="text-xl text-muted-foreground font-medium">Stop wrestling with indesign templates and manual alignment. Our cloud-native engine handles the heavy lifting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl">1</div>
                <h4 className="text-2xl font-bold">Import Manuscript</h4>
                <p className="text-muted-foreground">Upload your source and target text in any format. Our AI identifies paragraph breaks and chapter structures instantly.</p>
              </div>
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl">2</div>
                <h4 className="text-2xl font-bold">Auto-Typeset</h4>
                <p className="text-muted-foreground">The AI Typesetter automatically balances columns and eliminates widows/orphans across hundreds of pages in seconds.</p>
              </div>
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl">3</div>
                <h4 className="text-2xl font-bold">One-Click KDP</h4>
                <p className="text-muted-foreground">Export a print-ready PDF with correct bleeds, trim marks, and gutters. Guaranteed to pass Amazon's quality check.</p>
              </div>
            </div>

            <div className="mt-24 p-1 rounded-[3.5rem] bg-gradient-to-br from-[#30b8c8] to-primary shadow-2xl">
              <div className="bg-background rounded-[3.4rem] p-12 overflow-hidden flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 text-xs font-black uppercase tracking-widest">
                    Available Now
                  </div>
                  <h3 className="text-4xl font-black font-outfit italic">EPUB 3.0 Bilingual Support</h3>
                  <p className="text-lg text-muted-foreground">Generate reflowable e-books for Kindle and Apple Books with native side-by-side or alternating mode selection.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 font-bold text-sm">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      XHTML Compliant
                    </li>
                    <li className="flex items-center gap-2 font-bold text-sm">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      Fixed-Layout Option
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-[400px] aspect-[4/3] bg-muted/50 rounded-3xl border-2 border-dashed border-muted flex items-center justify-center relative group">
                  <Layers className="h-20 w-20 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32">
          <div className="container px-4 mx-auto">
            <div className="p-12 md:p-24 rounded-[3.5rem] bg-black text-white relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-8 font-outfit">Scale Your Publishing Hub.</h2>
                <p className="text-xl text-white/70 mb-12">Whether you are an independent author or a global house, Synoptic scales with you. Built on top-tier DigitalOcean infrastructure.</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link href="/auth/signup">
                    <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-black font-black text-xl hover:bg-[#30b8c8] hover:text-white transition-all shadow-xl shadow-white/5">
                      Get Started
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-white/20 text-white font-bold text-xl hover:bg-white/10">
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
