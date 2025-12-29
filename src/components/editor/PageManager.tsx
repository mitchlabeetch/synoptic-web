// src/components/editor/PageManager.tsx
'use client';

import { useProjectStore } from '@/lib/store/projectStore';
import { cn } from '@/lib/utils';
import { 
  File, 
  GripVertical, 
  Plus, 
  Trash2, 
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Book
} from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SortablePageItemProps {
  id: string;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortablePageItem({ id, index, isActive, onSelect, onDelete }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg transition-all border border-transparent mb-1',
        isActive ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted/50',
        isDragging && 'opacity-50 shadow-lg scale-[1.02] bg-background'
      )}
      onClick={onSelect}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        <div className={cn(
          "h-6 w-5 rounded-sm border flex items-center justify-center text-[10px] font-bold shrink-0",
          isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-muted-foreground/20"
        )}>
          {index + 1}
        </div>
        <span className={cn(
          "text-xs font-medium truncate",
          isActive ? "text-primary" : "text-foreground"
        )}>
          Page {index + 1}
        </span>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive gap-2" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function PageManager() {
  const { 
    content, 
    currentPageIndex, 
    setCurrentPageIndex, 
    addPage, 
    deletePage,
    setContent 
  } = useProjectStore();
  
  const [isExpanded, setIsExpanded] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = content.pages.findIndex((p) => p.id === active.id);
      const newIndex = content.pages.findIndex((p) => p.id === over.id);

      const newPages = arrayMove(content.pages, oldIndex, newIndex).map((page, idx) => ({
        ...page,
        number: idx + 1
      }));

      setContent({
        ...content,
        pages: newPages
      });
      
      // Update current page if it moved
      if (currentPageIndex === oldIndex) {
        setCurrentPageIndex(newIndex);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between bg-muted/20">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors"
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Book className="h-3 w-3 text-primary" />
          Manuscript
        </button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6 rounded-md border-primary/20 text-primary hover:bg-primary/5" 
          onClick={() => addPage(currentPageIndex)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isExpanded && (
        <ScrollArea className="flex-1">
          <div className="p-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={content.pages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {content.pages.map((page, index) => (
                  <SortablePageItem
                    key={page.id}
                    id={page.id}
                    index={index}
                    isActive={currentPageIndex === index}
                    onSelect={() => setCurrentPageIndex(index)}
                    onDelete={() => deletePage(index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </ScrollArea>
      )}

      {/* Chapter View Placeholder */}
      <div className="p-3 border-t bg-muted/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Chapters</span>
          <Plus className="h-3 w-3 text-muted-foreground/40 cursor-pointer" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground/60 italic rounded-md border border-dashed border-muted">
            No Chapters Defined
          </div>
        </div>
      </div>
    </div>
  );
}
