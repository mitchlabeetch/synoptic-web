'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import { WebsiteCarbonBadge } from '@/components/ui/WebsiteCarbonBadge';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MarketingHeader() {
  const t = useTranslations('Marketing.nav');
  const pathname = usePathname();

  return (
    <header className="px-6 h-20 flex items-center border-b bg-background/80 backdrop-blur-xl sticky top-0 z-[1000] transition-all duration-500">
      <Link className="flex items-center justify-center group" href="/">
        <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-6 transition-transform">
          <img src="/logo-icon.svg" alt="Synoptic Icon" className="h-10 w-10" />
        </div>
        <span className="ml-3 text-2xl font-bold tracking-tighter text-[#30b8c8] font-sans lowercase leading-none">synoptic</span>
      </Link>
      <nav className="ml-auto hidden md:flex gap-8 items-center">
        <Link 
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.15em] transition-colors font-outfit",
            pathname === '/learn' ? "text-primary" : "text-muted-foreground hover:text-primary"
          )} 
          href="/learn"
        >
          {t('toLearn')}
        </Link>
        <Link 
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.15em] transition-colors font-outfit",
            pathname === '/publish' ? "text-primary" : "text-muted-foreground hover:text-primary"
          )} 
          href="/publish"
        >
          {t('toPublish')}
        </Link>
        <Link className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors font-outfit" href="/#pricing">{t('pricing')}</Link>
        <Link 
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.15em] transition-colors font-outfit",
            pathname === '/library' ? "text-primary" : "text-muted-foreground hover:text-primary"
          )} 
          href="/library"
        >
          {t('library')}
        </Link>
        
        <div className="h-4 w-px bg-muted mx-2" />
        
        <WebsiteCarbonBadge className="hidden lg:flex" />
        <LocaleSwitcher />

        <div className="h-4 w-px bg-muted mx-2" />
        
        <Link href="/auth/login">
          <Button variant="ghost" className="font-bold rounded-full px-6 transition-all hover:bg-primary/5 hover:text-primary">{t('logIn')}</Button>
        </Link>
        <Link href="/auth/signup">
          <Button className="font-bold rounded-full px-8 bg-[#22687a] hover:bg-[#1a5160] transition-shadow shadow-lg shadow-primary/10">{t('joinNow')}</Button>
        </Link>
      </nav>
    </header>
  );
}
