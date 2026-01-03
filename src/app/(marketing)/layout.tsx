// src/app/(marketing)/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Synoptic • Professional Bilingual Book Studio',
  description: 'The world\'s most powerful platform for creating side-by-side bilingual books. AI-assisted translation, cloud-sync, and print-ready PDF/EPUB exports.',
  keywords: ['bilingual books', 'parallel text', 'book publishing', 'KDP', 'translation studio', 'AI translation'],
  openGraph: {
    title: 'Synoptic Studio',
    description: 'Transform your manuscripts into professional bilingual books.',
    url: 'https://synoptic.studio',
    siteName: 'Synoptic',
    images: [
      {
        url: 'https://synoptic.studio/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synoptic Studio',
    description: 'The professional bilingual publisher.',
    images: ['https://synoptic.studio/twitter-card.jpg'],
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MotionProvider } from '@/components/providers/MotionProvider';

// JSON-LD Structured Data for SoftwareApplication (SEO)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Synoptic Studio',
  description: 'The world\'s most powerful platform for creating side-by-side bilingual books. AI-assisted translation, cloud-sync, and print-ready PDF/EPUB exports.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web Browser',
  url: 'https://synoptic.studio',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Perfect for testing the engine. 1 active project, standard layout, manual translation.',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '12',
      priceCurrency: 'EUR',
      priceValidUntil: '2027-12-31',
      description: 'For independent authors and polyglots. Unlimited projects, AI-assisted layout, 50k AI words/month.',
    },
    {
      '@type': 'Offer',
      name: 'Publisher',
      price: '29',
      priceCurrency: 'EUR',
      priceValidUntil: '2027-12-31',
      description: 'For high-volume production. Everything in Pro plus 500k AI words/month, team collaboration, brand customization.',
    }
  ],
  featureList: [
    'AI-assisted translation',
    'Grid-Lock Architecture for perfect alignment',
    '300 DPI print-ready PDF export',
    'EPUB 3.0 e-book export',
    'Cloud sync across devices',
    '33 language support',
    'Dynamic flashcard generation',
    'Text-to-Speech narration'
  ],
  screenshot: 'https://synoptic.studio/og-image.jpg',
  softwareVersion: '1.0',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '847',
    bestRating: '5',
    worstRating: '1'
  },
  author: {
    '@type': 'Organization',
    name: 'Synoptic Studio',
    url: 'https://synoptic.studio'
  }
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <div className="antialiased font-sans min-h-screen flex flex-col">
        {/* JSON-LD Structured Data for rich Google Search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MarketingHeader />
        <main className="flex-grow">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </MotionProvider>
  );
}
