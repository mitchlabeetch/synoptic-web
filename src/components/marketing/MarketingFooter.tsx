'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WebsiteCarbonBadge } from '@/components/ui/WebsiteCarbonBadge';

export function MarketingFooter() {
  const t = useTranslations('Marketing.nav');
  const tf = useTranslations('Marketing.footer');

  return (
    <footer className="border-t py-12 md:py-24 bg-background">
      <div className="container px-4 mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="Synoptic Logo" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tighter text-[#30b8c8] font-quicksand lowercase">synoptic</span>
          </div>
          <p className="max-w-xs text-muted-foreground text-sm font-medium leading-relaxed">
            {tf('tagline')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{t('product')}</h4>
          <ul className="space-y-2">
            <li><Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground">{t('toLearn')}</Link></li>
            <li><Link href="/publish" className="text-sm text-muted-foreground hover:text-foreground">{t('toPublish')}</Link></li>
            <li><Link href="/models" className="text-sm text-muted-foreground hover:text-foreground">{t('templates')}</Link></li>
            <li><Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">{t('pricing')}</Link></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{t('company')}</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">{t('about')}</Link></li>
            <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">{t('privacy')}</Link></li>
            <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">{t('terms')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="container px-4 mx-auto mt-20 pt-8 border-t flex justify-between items-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{tf('copyright')}</p>
        <div className="flex items-center gap-4">
          <WebsiteCarbonBadge />
        </div>
      </div>
    </footer>
  );
}
