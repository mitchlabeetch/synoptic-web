import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const quicksand = localFont({
  src: [
    {
      path: "../../Quicksand-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../Quicksand-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../Quicksand-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../Quicksand-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../Quicksand-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Synoptic | Bilingual Book Studio",
  description: "The world's most intuitive bilingual book creation platform.",
};

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${quicksand.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
