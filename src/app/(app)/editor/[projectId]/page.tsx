// src/app/(app)/editor/[projectId]/page.tsx
import Workspace from '@/components/editor/Workspace';
import Sidebar from '@/components/editor/Sidebar';
import Toolbar from '@/components/editor/Toolbar';
import BlockInspector from '@/components/editor/BlockInspector';

export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Studio Bar */}
      <div className="h-14 border-b flex items-center px-4 justify-between bg-card text-card-foreground shadow-sm z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold italic">S</div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">Synoptic Studio</span>
          </div>
          <div className="h-4 w-[1px] bg-muted mx-2" />
          <span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">Bilingual Editor</span>
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
