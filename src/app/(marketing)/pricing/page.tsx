// src/app/(marketing)/pricing/page.tsx
import { PricingTable } from '@/components/marketing/PricingTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 h-20 flex items-center border-b">
        <Link href="/">
          <Button variant="ghost" className="gap-2 font-bold uppercase tracking-widest text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Studio
          </Button>
        </Link>
      </header>

      <main className="pt-20 pb-32">
        <div className="container px-4 mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Invest in Your Books.</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto italic">
            Whether you're translating a family memoir or publishing a commercial series, we have the right tools for you.
          </p>
        </div>

        <PricingTable />
        
        <div className="container px-4 mx-auto max-w-3xl mt-20 p-12 rounded-3xl bg-muted/30 border border-dashed border-muted-foreground/20 text-center">
           <h3 className="text-xl font-bold mb-4">Are you a non-profit or educator?</h3>
           <p className="text-muted-foreground mb-6 text-sm">
             We offer special discounts for educational institutions and non-profit translations. 
             Contact our team for a custom quote.
           </p>
           <Button variant="outline" className="font-bold">Contact Support</Button>
        </div>
      </main>
    </div>
  );
}
