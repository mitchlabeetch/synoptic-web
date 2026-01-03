// src/components/marketing/SocialProof.tsx
'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, Globe, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SocialProof() {
  const t = useTranslations('SocialProof');

  const stats = [
    { 
      icon: Users, 
      value: '2,847+', 
      label: t('authors'),
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      icon: BookOpen, 
      value: '12,400+', 
      label: t('booksCreated'),
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      icon: Globe, 
      value: '33', 
      label: t('languages'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      icon: Star, 
      value: '4.9', 
      label: t('rating'),
      color: 'text-[#f9726e]',
      bg: 'bg-[#f9726e]/10'
    }
  ];

  // Sample testimonials for social proof
  const testimonials = [
    {
      quote: t('testimonials.quote1'),
      author: t('testimonials.author1'),
      role: t('testimonials.role1'),
      avatar: '👩‍💼'
    },
    {
      quote: t('testimonials.quote2'),
      author: t('testimonials.author2'),
      role: t('testimonials.role2'),
      avatar: '👨‍🏫'
    },
    {
      quote: t('testimonials.quote3'),
      author: t('testimonials.author3'),
      role: t('testimonials.role3'),
      avatar: '👩‍💻'
    }
  ];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-muted/30">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-slate-50/[0.02] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <Users className="h-4 w-4" />
            {t('badge')}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 font-outfit">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bg} mb-4`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-3xl md:text-4xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-foreground/90 mb-6 font-medium leading-relaxed">
                "{testimonial.quote}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-sm">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trusted By Logos (placeholder for future) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 font-semibold">
            {t('trustedBy')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {/* Placeholder logos - these would be real partner logos */}
            <div className="h-8 px-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">University Press</div>
            <div className="h-8 px-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Language Labs</div>
            <div className="h-8 px-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Polyglot Academy</div>
            <div className="h-8 px-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Global Publishing</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
