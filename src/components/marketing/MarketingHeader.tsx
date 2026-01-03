'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MarketingHeader() {
  const t = useTranslations('Marketing.nav');
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'include' });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="px-4 md:px-6 h-20 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-[1000] transition-all duration-500">
      {/* Desktop: 3-Column Grid Layout */}
      <div className="hidden xl:grid grid-cols-[1fr_auto_1fr] items-center h-full max-w-[1600px] mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link className="flex items-center justify-center group" href="/">
            <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-6 transition-transform">
              <img src="/logo-icon.svg" alt="Synoptic Icon" className="h-10 w-10" />
            </div>
            <span className="ml-3 text-2xl font-bold tracking-tighter text-[#30b8c8] font-quicksand lowercase leading-none -translate-y-[1px]">synoptic</span>
          </Link>
        </div>
        
        {/* Center: Navigation */}
        <nav className="flex gap-6 items-center justify-center">
          <Link 
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.1em] transition-colors font-outfit whitespace-nowrap",
              pathname === '/learn' ? "text-primary" : "text-muted-foreground hover:text-primary"
            )} 
            href="/learn"
          >
            {t('toLearn')}
          </Link>
          <Link 
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.1em] transition-colors font-outfit whitespace-nowrap",
              pathname === '/publish' ? "text-primary" : "text-muted-foreground hover:text-primary"
            )} 
            href="/publish"
          >
            {t('toPublish')}
          </Link>
          <Link className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:text-primary transition-colors font-outfit" href="/#pricing">{t('pricing')}</Link>
          <Link 
            className={cn(
              "text-sm font-semibold uppercase tracking-[0.1em] transition-colors font-outfit",
              pathname === '/library' ? "text-primary" : "text-muted-foreground hover:text-primary"
            )} 
            href="/library"
          >
            {t('library')}
          </Link>
        </nav>
        
        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-3">
          <LocaleSwitcher />
          <div className="h-4 w-px bg-muted mx-1" />
          {isLoading ? (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-full" />
          ) : isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="text-sm font-extrabold rounded-full px-6 bg-[#22687a] hover:bg-[#1a5160] transition-all shadow-xl shadow-primary/20 font-outfit uppercase tracking-widest text-white gap-2">
                <LayoutDashboard className="h-4 w-4" />
                {t('dashboard') || 'Dashboard'}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-sm font-bold rounded-full px-4 transition-all hover:bg-primary/10 hover:text-[#22687a] text-muted-foreground font-outfit uppercase tracking-widest">{t('logIn')}</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="text-sm font-extrabold rounded-full px-6 bg-[#22687a] hover:bg-[#1a5160] transition-all shadow-xl shadow-primary/20 font-outfit uppercase tracking-widest text-white">{t('joinNow')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile/Tablet: Flex Layout */}
      <div className="flex xl:hidden items-center h-full">
        <Link className="flex items-center justify-center group z-[1001]" href="/">
          <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="/logo-icon.svg" alt="Synoptic Icon" className="h-10 w-10" />
          </div>
          <span className="ml-3 text-2xl font-bold tracking-tighter text-[#30b8c8] font-quicksand lowercase leading-none">synoptic</span>
        </Link>
        
        {/* Mobile controls pushed to right */}
        <div className="ml-auto flex items-center gap-4">
          <LocaleSwitcher />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-primary transition-colors z-[1001]"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slider */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white dark:bg-slate-950 z-[1000] flex flex-col pt-24 px-8 backdrop-blur-3xl overflow-y-auto"
          >
            <nav className="flex flex-col gap-6">
              <Link 
                className={cn(
                  "text-xl font-bold uppercase tracking-[0.15em] font-outfit",
                  pathname === '/learn' ? "text-primary" : "text-muted-foreground"
                )} 
                href="/learn"
              >
                {t('toLearn')}
              </Link>
              <Link 
                className={cn(
                  "text-xl font-bold uppercase tracking-[0.15em] font-outfit",
                  pathname === '/publish' ? "text-primary" : "text-muted-foreground"
                )} 
                href="/publish"
              >
                {t('toPublish')}
              </Link>
              <Link className="text-xl font-bold uppercase tracking-[0.15em] text-muted-foreground font-outfit" href="/#pricing">{t('pricing')}</Link>
              <Link 
                className={cn(
                  "text-xl font-bold uppercase tracking-[0.15em] font-outfit",
                  pathname === '/library' ? "text-primary" : "text-muted-foreground"
                )} 
                href="/library"
              >
                {t('library')}
              </Link>
            </nav>

            <div className="mt-auto mb-10 flex flex-col gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full font-black rounded-full py-7 text-lg bg-[#22687a] shadow-2xl shadow-primary/20 text-white gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    {t('dashboard') || 'Dashboard'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" className="w-full font-bold rounded-full py-7 text-lg border-2 border-primary/20 text-[#22687a] hover:bg-primary/5">{t('logIn')}</Button>
                  </Link>
                  <Link href="/auth/signup" className="w-full">
                    <Button className="w-full font-black rounded-full py-7 text-lg bg-[#22687a] shadow-2xl shadow-primary/20 text-white">{t('joinNow')}</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
