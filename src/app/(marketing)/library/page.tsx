// src/app/(marketing)/library/page.tsx
// PURPOSE: Discovery Library page with Bento Grid
// ACTION: Browse 60+ content templates and import to projects
// MECHANISM: TileCard grid -> PreviewModal -> Import wizard

import { Metadata } from 'next';
import { LibraryPageClient } from './LibraryPageClient';
import { getCurrentUser } from '@/lib/auth/jwt';

export const metadata: Metadata = {
  title: 'Discovery Library | Synoptic',
  description: 'Browse 60+ free content sources for your bilingual book projects. Public domain literature, sacred texts, museum art, and more.',
  openGraph: {
    title: 'Discovery Library | Synoptic',
    description: 'Browse 60+ free content sources for your bilingual book projects.',
  },
};

async function getAuthStatus(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

export default async function LibraryPage() {
  const isAuthenticated = await getAuthStatus();
  
  return <LibraryPageClient isAuthenticated={isAuthenticated} />;
}
