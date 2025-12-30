// src/app/(marketing)/library/page.tsx
// PURPOSE: Discovery Library page with Bento Grid
// ACTION: Browse 60+ content templates and import to projects
// MECHANISM: TileCard grid -> PreviewModal -> Import wizard

import { Metadata } from 'next';
import { LibraryPageClient } from './LibraryPageClient';

export const metadata: Metadata = {
  title: 'Discovery Library | Synoptic',
  description: 'Browse 60+ free content sources for your bilingual book projects. Public domain literature, sacred texts, museum art, and more.',
  openGraph: {
    title: 'Discovery Library | Synoptic',
    description: 'Browse 60+ free content sources for your bilingual book projects.',
  },
};

export default function LibraryPage() {
  return <LibraryPageClient />;
}
