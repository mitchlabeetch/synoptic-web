import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingTable } from '@/components/marketing/PricingTable'
import { getTranslations } from 'next-intl/server'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher'
import { WebsiteCarbonBadge } from '@/components/ui/WebsiteCarbonBadge'

export default async function LandingPage() {
  const t = await getTranslations('Marketing.nav')
  const tf = await getTranslations('Marketing.footer')

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/20">
      <header className="px-6 h-20 flex items-center border-b bg-background/60 backdrop-blur-xl sticky top-0 z-[100]">
        <Link className="flex items-center justify-center group" href="/">
          <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="/logo-icon.svg" alt="Synoptic Icon" className="h-10 w-10" />
          </div>
          <span className="ml-3 text-2xl font-black tracking-tighter text-[#30b8c8]" style={{ fontVariant: 'all-small-caps' }}>synoptic</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-8 items-center">
          <Link className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors" href="#features">{t('features')}</Link>
          <Link className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors" href="#pricing">{t('pricing')}</Link>
          <Link className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors" href="/library">{t('library')}</Link>
          
          <div className="h-4 w-px bg-muted mx-2" />
          
          
          <WebsiteCarbonBadge className="hidden lg:flex" />
          <LocaleSwitcher />

          <div className="h-4 w-px bg-muted mx-2" />
          
          <Link href="/auth/login">
            <Button variant="ghost" className="font-bold">{t('logIn')}</Button>
          </Link>
          <Link href="/auth/login">
            <Button className="font-bold rounded-xl px-6">{t('joinNow')}</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <Hero />
        <div id="features">
          <FeatureGrid />
        </div>
        <PricingTable />
      </main>

      <footer className="border-t py-12 md:py-24 bg-background">
        <div className="container px-4 mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="Synoptic Logo" className="h-8 w-8" />
              <span className="text-xl font-black tracking-tighter text-[#30b8c8]" style={{ fontVariant: 'all-small-caps' }}>synoptic</span>
            </div>
            <p className="max-w-xs text-muted-foreground text-sm font-medium leading-relaxed">
              {tf('tagline')}
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{t('product')}</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('features')}</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('templates')}</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('pricing')}</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{t('company')}</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('about')}</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('privacy')}</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="container px-4 mx-auto mt-20 pt-8 border-t flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{tf('copyright')}</p>
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-muted/50" />
            <div className="h-8 w-8 rounded-full bg-muted/50" />
          </div>
        </div>
      </footer>
    </div>
  )
}
