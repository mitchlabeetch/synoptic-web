// src/components/editor/Sidebar.tsx
"use client";

import { cn } from '@/lib/utils';
import { 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Square, 
  MessageSquare, 
  Languages, 
  Settings2,
  Layers
} from 'lucide-react';

export default function Sidebar() {
  const tools = [
    { icon: Layout, label: 'Layout', active: true },
    { icon: Type, label: 'Text' },
    { icon: ImageIcon, label: 'Media' },
    { icon: Square, label: 'Shapes' },
    { icon: MessageSquare, label: 'Notes' },
    { icon: Languages, label: 'Linguistics' },
    { icon: Layers, label: 'Templates' },
    { icon: Settings2, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Studio Controls</h3>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {tools.map((tool) => (
            <button
              key={tool.label}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                tool.active 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tool.icon className="h-4 w-4" />
              <span className="md:inline hidden">{tool.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
