// src/components/editor/Toolbar.tsx
"use client";

import { Button } from '@/components/ui/button';
import { 
  Undo2, 
  Redo2, 
  Play, 
  Download, 
  Share2,
  Maximize2
} from 'lucide-react';
import { useProjectStore } from '@/lib/store/projectStore';

export default function Toolbar() {
  const { undo, redo } = useProjectStore();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-muted mx-1" />

      <Button variant="outline" size="sm" className="gap-2">
        <Share2 className="h-4 w-4" />
        Collaborate
      </Button>

      <Button variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
        <Play className="h-4 w-4" />
        Preview
      </Button>
      
      <div className="h-4 w-[1px] bg-muted mx-1" />
      
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
