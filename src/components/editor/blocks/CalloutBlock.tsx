// src/components/editor/blocks/CalloutBlock.tsx
'use client';

import { CalloutBlock, CalloutType } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  Book, 
  Languages, 
  MapPin, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface CalloutBlockComponentProps {
  block: CalloutBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CalloutBlock>) => void;
  onDelete: () => void;
  isEditing: boolean;
}

const CALLOUT_CONFIG: Record<CalloutType, { icon: any, color: string, bg: string, label: string }> = {
  note: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Note' },
  tip: { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Tip' },
  warning: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Warning' },
  grammar: { icon: Book, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Grammar' },
  vocabulary: { icon: Languages, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Vocabulary' },
  culture: { icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Culture' },
  pronunciation: { icon: Sparkles, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Pronunciation' },
  'false-friend': { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'False Friend' },
  custom: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Custom' },
};

export function CalloutBlockComponent({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditing,
}: CalloutBlockComponentProps) {
  const config = CALLOUT_CONFIG[block.calloutType || 'note'];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group relative my-6 rounded-2xl border-l-4 overflow-hidden transition-all duration-300',
        isSelected ? 'ring-2 ring-primary ring-offset-4' : 'hover:shadow-lg',
        config.bg
      )}
      style={{ borderLeftColor: block.headerColor || 'currentColor' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="flex items-center gap-3 p-4 pb-2 border-b border-black/5">
        <div className={cn("p-1.5 rounded-lg bg-white shadow-sm", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <input
          value={block.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={config.label}
          className="bg-transparent font-bold text-sm focus:outline-none flex-1 placeholder:opacity-50"
          style={{ color: block.headerColor || 'inherit' }}
        />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 select-none">
          {config.label}
        </span>
      </div>

      <div className="p-5 pt-3">
        <textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Type your notes here... (Supports Markdown)"
          className="w-full bg-transparent text-sm resize-none focus:outline-none min-h-[60px] leading-relaxed"
          style={{ color: block.textColor || 'inherit' }}
        />
      </div>

      {/* Block Actions */}
      {isSelected && (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-destructive text-destructive-foreground rounded-md shadow-sm hover:scale-110 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
