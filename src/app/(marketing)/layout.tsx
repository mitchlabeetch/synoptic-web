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
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased font-sans">
      {children}
    </div>
  );
}
