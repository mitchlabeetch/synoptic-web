import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingTable } from '@/components/marketing/PricingTable'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/20">
      <header className="px-6 h-20 flex items-center border-b bg-background/60 backdrop-blur-xl sticky top-0 z-[100]">
        <Link className="flex items-center justify-center group" href="/">
          <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-6 transition-transform">
            <img src="/logo-icon.svg" alt="Synoptic Icon" className="h-10 w-10" />
          </div>
          <span className="ml-3 text-2xl font-black tracking-tighter uppercase" style={{ color: '#30b8c8' }}>SYNOPTIC</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-8 items-center">
          <Link className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors" href="#features">Features</Link>
          <Link className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors" href="#pricing">Pricing</Link>
          <Link className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors" href="/library">Library</Link>
          
          <div className="h-4 w-px bg-muted mx-2" />
          
          <Link href="/auth/login">
            <Button variant="ghost" className="font-bold">Log In</Button>
          </Link>
          <Link href="/auth/login">
            <Button className="font-bold rounded-xl px-6">Join Now</Button>
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
              <span className="text-xl font-black tracking-tighter uppercase" style={{ color: '#30b8c8' }}>SYNOPTIC</span>
            </div>
            <p className="max-w-xs text-muted-foreground text-sm font-medium leading-relaxed">
              The professional bilingual publisher for authors, language learners, and publishing houses. 
              Designed in SF, Built for the world.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Templates</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="container px-4 mx-auto mt-20 pt-8 border-t flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">© 2025 Synoptic Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-muted/50" />
            <div className="h-8 w-8 rounded-full bg-muted/50" />
          </div>
        </div>
      </footer>
    </div>
  )
}
