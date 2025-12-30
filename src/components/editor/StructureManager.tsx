// src/components/editor/StructureManager.tsx
// PURPOSE: Manage book structure including Front Matter (Title, Copyright, Dedication) and Back Matter (Glossary, About)
// ACTION: Provides UI for adding/managing professional book structure pages (KDP compliance)
// MECHANISM: Integrates with projectStore to manage frontMatter and backMatter arrays

'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Copyright, 
  Heart, 
  Book,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  User,
  List,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { FrontMatterType, BackMatterType } from '@/types/blocks';
import { useTranslations } from 'next-intl';

const FRONT_MATTER_CONFIG: Record<FrontMatterType, { icon: any; label: string; desc: string }> = {
  title: { icon: BookOpen, label: 'Title Page', desc: 'Book title and author' },
  copyright: { icon: Copyright, label: 'Copyright', desc: 'Legal & ISBN placeholder' },
  dedication: { icon: Heart, label: 'Dedication', desc: 'Personal dedication' },
  toc: { icon: List, label: 'Table of Contents', desc: 'Auto-generated from chapters' },
};

const BACK_MATTER_CONFIG: Record<BackMatterType, { icon: any; label: string; desc: string }> = {
  glossary: { icon: Book, label: 'Auto-Glossary', desc: 'Compiled from callouts' },
  about: { icon: User, label: 'About the Author', desc: 'Author biography' },
  notes: { icon: FileText, label: 'End Notes', desc: 'References and notes' },
};

export default function StructureManager() {
  const { 
    content,
    addFrontMatterPage,
    deleteFrontMatterPage,
    addBackMatterPage,
    deleteBackMatterPage,
    generateGlossary,
  } = useProjectStore();
  
  const [frontExpanded, setFrontExpanded] = useState(true);
  const [backExpanded, setBackExpanded] = useState(true);

  const handleAddFrontMatter = (type: FrontMatterType) => {
    addFrontMatterPage(type);
  };

  const handleAddBackMatter = (type: BackMatterType) => {
    addBackMatterPage(type);
    // If it's a glossary, auto-generate it
    if (type === 'glossary') {
      generateGlossary();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Book Structure</h3>
            <p className="text-[10px] text-muted-foreground">KDP-compliant layout</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Front Matter Section */}
          <div>
            <button 
              onClick={() => setFrontExpanded(!frontExpanded)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors mb-3 w-full"
            >
              {frontExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Front Matter
              <span className="ml-auto text-[10px] font-normal bg-muted px-1.5 py-0.5 rounded">
                {content.frontMatter?.length || 0}
              </span>
            </button>

            {frontExpanded && (
              <div className="space-y-2">
                {/* Existing Front Matter Pages */}
                {content.frontMatter?.map((page) => {
                  const config = FRONT_MATTER_CONFIG[page.type];
                  const Icon = config.icon;
                  return (
                    <div 
                      key={page.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="p-1 rounded bg-primary/10">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium flex-1">{config.label}</span>
                      <button 
                        onClick={() => deleteFrontMatterPage(page.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Front Matter Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {(Object.entries(FRONT_MATTER_CONFIG) as [FrontMatterType, typeof FRONT_MATTER_CONFIG[FrontMatterType]][]).map(([type, config]) => {
                    const Icon = config.icon;
                    const exists = content.frontMatter?.some(p => p.type === type);
                    return (
                      <Button 
                        key={type}
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddFrontMatter(type)}
                        disabled={exists && type !== 'dedication'} // Allow multiple dedications
                        className={cn(
                          "justify-start gap-2 text-xs h-9",
                          exists && "opacity-50"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed" />

          {/* Back Matter Section */}
          <div>
            <button 
              onClick={() => setBackExpanded(!backExpanded)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors mb-3 w-full"
            >
              {backExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Back Matter
              <span className="ml-auto text-[10px] font-normal bg-muted px-1.5 py-0.5 rounded">
                {content.backMatter?.length || 0}
              </span>
            </button>

            {backExpanded && (
              <div className="space-y-2">
                {/* Existing Back Matter Pages */}
                {content.backMatter?.map((page) => {
                  const config = BACK_MATTER_CONFIG[page.type];
                  const Icon = config.icon;
                  return (
                    <div 
                      key={page.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="p-1 rounded bg-primary/10">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-medium flex-1">{config.label}</span>
                      {page.type === 'glossary' && (
                        <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {content.glossary?.length || 0} entries
                        </span>
                      )}
                      <button 
                        onClick={() => deleteBackMatterPage(page.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Back Matter Buttons */}
                <div className="space-y-2 mt-3">
                  {(Object.entries(BACK_MATTER_CONFIG) as [BackMatterType, typeof BACK_MATTER_CONFIG[BackMatterType]][]).map(([type, config]) => {
                    const Icon = config.icon;
                    const exists = content.backMatter?.some(p => p.type === type);
                    return (
                      <Button 
                        key={type}
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddBackMatter(type)}
                        disabled={exists}
                        className={cn(
                          "w-full justify-start gap-2 text-xs h-9",
                          exists && "opacity-50"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="flex-1 text-left">{config.label}</span>
                        {type === 'glossary' && !exists && (
                          <Sparkles className="h-3 w-3 text-amber-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Glossary Info */}
                {content.backMatter?.some(p => p.type === 'glossary') && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mt-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-medium text-amber-800">Auto-Glossary Active</p>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          {content.glossary?.length || 0} terms compiled from your Callout blocks (vocabulary, grammar, culture).
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => generateGlossary()}
                          className="mt-2 h-6 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          Refresh Glossary
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-3 border-t bg-muted/5">
        <p className="text-[9px] text-muted-foreground text-center">
          Front matter uses Roman numerals (i, ii, iii). Body uses Arabic (1, 2, 3).
        </p>
      </div>
    </div>
  );
}
