// src/components/editor/Workspace.tsx
"use client";

import { useProjectStore } from '@/lib/store/projectStore';
import { useProjectSync } from '@/hooks/useProjectSync';
import PageRenderer from './PageRenderer';
import { Loader2, CloudCheck, CloudUpload, AlertCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceProps {
  projectId: string;
}

export default function Workspace({ projectId }: WorkspaceProps) {
  const { syncStatus } = useProjectSync(projectId);
  const { content, addPage } = useProjectStore();

  if (syncStatus.status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground animate-pulse">Entering the Studio...</p>
        </div>
      </div>
    );
  }

  if (syncStatus.status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md p-6 border-2 border-destructive/20 rounded-xl bg-destructive/5">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">Failed to load project</h2>
          <p className="text-muted-foreground">{syncStatus.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-muted/20 overflow-auto scroll-smooth h-full">
      {/* Top Floating Status Indicator */}
      <div className="sticky top-4 z-50 flex justify-center pointer-events-none">
        <div className={cn(
          "px-4 py-2 rounded-full border bg-background/80 backdrop-blur-md shadow-lg flex items-center gap-2 text-sm transition-all pointer-events-auto",
          syncStatus.status === 'saving' && "border-primary/50 text-primary",
          syncStatus.status === 'saved' && "border-green-500/20 text-green-600"
        )}>
          {syncStatus.status === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Saving draft...</span>
            </>
          )}
          {syncStatus.status === 'saved' && (
            <>
              <CloudCheck className="h-4 w-4 text-green-500" />
              <span>All changes saved to cloud</span>
            </>
          )}
        </div>
      </div>

      {/* The Actual Canvas */}
      <div className="p-12 pb-32">
        <div className="max-w-[1000px] mx-auto space-y-12">
          {content.pages.map((page, index) => (
            <PageRenderer 
              key={page.id} 
              page={page} 
              pageIndex={index} 
            />
          ))}
        </div>
      </div>

      {/* Contextual Add Page / Footer */}
      <div className="h-64 flex flex-col items-center justify-center gap-6">
        <button 
          onClick={() => addPage()}
          className="group flex flex-col items-center gap-3 transition-all"
        >
          <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 group-hover:scale-110 transition-all">
            <PlusCircle className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Add New Page</span>
        </button>

        <div className="text-xs text-muted-foreground italic flex flex-col items-center gap-2 mt-8">
          <div className="w-1 h-8 bg-muted rounded-full" />
          <span>Genesis of your bilingual masterpiece</span>
        </div>
      </div>
    </div>
  );
}
