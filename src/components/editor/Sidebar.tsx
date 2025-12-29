// src/components/editor/Sidebar.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { 
  Layout, 
  Type, 
  Image as ImageIcon, 
  SeparatorHorizontal,
  MessageSquare, 
  Languages, 
  Settings2,
  Layers,
  PlusCircle,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Sidebar() {
  const { addBlock, addPage, currentPageIndex, meta } = useProjectStore();

  const handleAddTextBlock = () => {
    addBlock(currentPageIndex, {
      id: `block-${Date.now()}`,
      type: 'text',
      L1: { 
        content: 'Nouveau paragraphe...', 
        lang: meta?.source_lang || 'fr' 
      },
      L2: { 
        content: 'New paragraph...', 
        lang: meta?.target_lang || 'en' 
      },
      layout: 'side-by-side',
      lineSpacing: 1.5,
      paragraphSpacing: 20,
    } as any);
  };

  const handleAddSeparator = () => {
    addBlock(currentPageIndex, {
      id: `block-${Date.now()}`,
      type: 'separator',
    } as any);
  };

  const tools = [
    { icon: Layout, label: 'Page Manager', onClick: () => {} }, // Active by default
    { icon: Type, label: 'Add Text', onClick: handleAddTextBlock },
    { icon: SeparatorHorizontal, label: 'Separator', onClick: handleAddSeparator },
    { icon: ImageIcon, label: 'Media', onClick: () => {} },
    { icon: MessageSquare, label: 'Annotations', onClick: () => {} },
    { icon: Languages, label: 'Translation AI', onClick: () => {} },
    { icon: Layers, label: 'Style Presets', onClick: () => {} },
    { icon: Settings2, label: 'Studio Settings', onClick: () => {} },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-card border-r shadow-sm">
        {/* Quick Add Section */}
        <div className="p-4 border-b bg-muted/20">
          <Button 
            onClick={() => addPage(currentPageIndex)} 
            className="w-full gap-2 shadow-sm hover:shadow-md transition-all font-bold"
            size="sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="lg:inline hidden">New Page</span>
          </Button>
        </div>

        {/* Studio Tools */}
        <div className="flex-1 overflow-auto py-4">
          <div className="px-3 mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-2">
              Studio Tools
            </h3>
            <nav className="space-y-1">
              {tools.map((tool) => (
                <Tooltip key={tool.label}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={tool.onClick}
                      className={cn(
                        "w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                        "text-muted-foreground hover:bg-primary/5 hover:text-primary active:scale-95"
                      )}
                    >
                      <tool.icon className="h-5 w-5 shrink-0" />
                      <span className="lg:inline hidden truncate">{tool.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden">
                    {tool.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>

          <div className="px-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-2">
              Organization
            </h3>
            <button
               className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Hash className="h-5 w-5 shrink-0" />
              <span className="lg:inline hidden">Chapter Breaks</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t bg-muted/5">
          <div className="flex items-center gap-2 justify-center lg:justify-start text-xs text-muted-foreground italic">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="lg:inline hidden uppercase tracking-tighter font-bold opacity-60">Engine Online</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
