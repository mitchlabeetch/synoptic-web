import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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

export const metadata: Metadata = {
  title: "Synoptic | Bilingual Book Studio",
  description: "The world's most intuitive bilingual book creation platform.",
};

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
