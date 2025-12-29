// src/app/(marketing)/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Sparkles, Cloud } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold tracking-tight">Synoptic</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/pricing">Pricing</Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/library">Library</Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/auth/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link className="text-sm font-medium" href="/auth/login">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground mb-4">
                Now in Private Beta
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                The World's Most Powerful <br className="hidden sm:inline" />
                <span className="text-primary">Bilingual Book Studio</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl mt-6">
                Design, translate, and publish side-by-side books with AI-assisted layout and real-time cloud sync.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Link href="/auth/login">
                  <Button size="lg" className="h-12 px-8 text-lg gap-2">
                    Start Your First Book <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/library">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    Browse Public Library
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 bg-card">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Driven Layout</h3>
                <p className="text-muted-foreground italic">Side-by-side alignment that respects the flow of both languages automatically.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Cloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Cloud-First History</h3>
                <p className="text-muted-foreground italic">Every character is saved as you type. Revert to any version from any device.</p>
              </div>
               <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multi-Format Export</h3>
                <p className="text-muted-foreground italic">One-click PDF for print-on-demand and EPUB for digital circulation.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-12 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm text-muted-foreground">© 2025 Synoptic Studio. All rights reserved.</p>
          <nav className="flex gap-6">
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">Terms</Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">Privacy</Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">Twitter</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
