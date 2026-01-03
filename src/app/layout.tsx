import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cookies } from 'next/headers';

// Configure fonts with preload and display:swap for optimal loading
// This prevents FOUT (Flash of Unstyled Text) and CLS (Cumulative Layout Shift)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true, // Automatically adjust fallback metrics
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

import { Quicksand } from "next/font/google";
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  // Fallback chain for metric compatibility
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

import { Outfit } from "next/font/google";
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});

/**
 * Dynamic metadata generation based on user's locale.
 * This ensures SEO works for localized versions (e.g., "Synoptic Web Spanish").
 */
const METADATA_TRANSLATIONS: Record<string, { title: string; description: string }> = {
  en: {
    title: "Synoptic | Bilingual Book Studio",
    description: "The world's most intuitive bilingual book creation platform."
  },
  fr: {
    title: "Synoptic | Studio de Livres Bilingues",
    description: "La plateforme de création de livres bilingues la plus intuitive au monde."
  },
  es: {
    title: "Synoptic | Estudio de Libros Bilingües",
    description: "La plataforma más intuitiva del mundo para crear libros bilingües."
  },
  de: {
    title: "Synoptic | Zweisprachiges Buchstudio",
    description: "Die intuitivste Plattform der Welt für zweisprachige Bücher."
  },
  ar: {
    title: "Synoptic | استوديو الكتب ثنائية اللغة",
    description: "المنصة الأكثر سهولة في العالم لإنشاء الكتب ثنائية اللغة."
  },
  zh: {
    title: "Synoptic | 双语图书工作室",
    description: "世界上最直观的双语图书创作平台。"
  },
  ja: {
    title: "Synoptic | バイリンガルブックスタジオ",
    description: "世界で最も直感的なバイリンガルブック作成プラットフォーム。"
  },
  ko: {
    title: "Synoptic | 이중 언어 도서 스튜디오",
    description: "세계에서 가장 직관적인 이중 언어 도서 제작 플랫폼."
  },
  pt: {
    title: "Synoptic | Estúdio de Livros Bilíngues",
    description: "A plataforma mais intuitiva do mundo para criar livros bilíngues."
  },
  it: {
    title: "Synoptic | Studio di Libri Bilingue",
    description: "La piattaforma più intuitiva al mondo per creare libri bilingue."
  },
  ru: {
    title: "Synoptic | Студия двуязычных книг",
    description: "Самая интуитивная в мире платформа для создания двуязычных книг."
  },
  // ... add more as needed. Fallback to English for unlisted locales
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const meta = METADATA_TRANSLATIONS[locale] || METADATA_TRANSLATIONS.en;
  
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      siteName: 'Synoptic Studio',
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

/**
 * Inline script to prevent dark mode flash (White Flash of Death).
 * This runs before React hydration to set the correct theme class.
 * Uses localStorage preference or system preference as fallback.
 */
const DARK_MODE_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('synoptic-theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && systemDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Dark mode flash prevention - runs before paint */}
        <script
          dangerouslySetInnerHTML={{ __html: DARK_MODE_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${outfit.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
