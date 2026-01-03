// src/app/(app)/editor/[projectId]/page.tsx
import Link from 'next/link';
import Workspace from '@/components/editor/Workspace';
import Sidebar from '@/components/editor/Sidebar';
import Toolbar from '@/components/editor/Toolbar';
import BlockInspector from '@/components/editor/BlockInspector';

import { getTranslations } from 'next-intl/server';

export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations('Studio');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Studio Bar */}
      <div className="h-14 border-b flex items-center px-4 justify-between bg-card text-card-foreground shadow-sm z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group" title="Back to Dashboard">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold italic group-hover:scale-110 transition-transform">S</div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline group-hover:text-primary transition-colors">{t('title')}</span>
          </Link>
          <div className="h-4 w-[1px] bg-muted mx-2" />
          <span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">{t('bilingualEditor')}</span>
        </div>
        <Toolbar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Design & Navigation */}
        <div className="border-r bg-card hidden md:flex flex-col shadow-sm transition-all duration-300">
          <Sidebar />
        </div>

        {/* Main Canvas Area */}
        <Workspace projectId={projectId} />

        {/* Right Sidebar - Properties & AI */}
        <div className="w-80 border-l bg-card hidden xl:flex flex-col shadow-sm">
          <BlockInspector />
        </div>
      </div>
    </div>
  );
}
