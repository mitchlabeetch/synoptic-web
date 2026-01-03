// src/components/ui/EmptyState.tsx
// PURPOSE: Friendly empty state component with illustration and CTA
// ACTION: Reduces friction by providing direct actions in empty states
// MECHANISM: Configurable illustration, messaging, and action buttons

'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { 
  BookOpen, 
  FolderOpen, 
  FileText, 
  Heart, 
  Library, 
  Sparkles,
  PlusCircle,
  type LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  /** The type of empty state */
  variant?: 'projects' | 'templates' | 'favorites' | 'documents' | 'custom';
  /** Custom icon (only for variant="custom") */
  icon?: LucideIcon;
  /** Main title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional className for styling */
  className?: string;
  /** Compact mode (smaller padding) */
  compact?: boolean;
}

// Preset configurations for each variant
const PRESETS: Record<
  Exclude<EmptyStateProps['variant'], 'custom' | undefined>,
  { icon: LucideIcon; title: string; description: string; actionLabel: string }
> = {
  projects: {
    icon: BookOpen,
    title: 'No projects yet',
    description: 'Create your first bilingual book to get started on your publishing journey.',
    actionLabel: 'Create Project',
  },
  templates: {
    icon: Library,
    title: 'No saved templates',
    description: 'Browse our library and save your favorite content sources for quick access.',
    actionLabel: 'Explore Library',
  },
  favorites: {
    icon: Heart,
    title: 'No favorites yet',
    description: 'Heart the content you love to find it quickly later.',
    actionLabel: 'Browse Content',
  },
  documents: {
    icon: FileText,
    title: 'No documents',
    description: 'Upload or create documents to see them here.',
    actionLabel: 'Add Document',
  },
};

/**
 * SVG illustration for empty states
 */
function EmptyIllustration({ icon: Icon, variant }: { icon: LucideIcon; variant?: string }) {
  // Color based on variant
  const colors = {
    projects: 'from-syn-primary/20 to-syn-secondary/20',
    templates: 'from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20',
    favorites: 'from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20',
    documents: 'from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20',
    custom: 'from-muted to-muted/50',
  };

  const iconColors = {
    projects: 'text-syn-primary',
    templates: 'text-violet-500 dark:text-violet-400',
    favorites: 'text-rose-500 dark:text-rose-400',
    documents: 'text-blue-500 dark:text-blue-400',
    custom: 'text-muted-foreground',
  };

  const gradientClass = colors[variant as keyof typeof colors] || colors.custom;
  const iconClass = iconColors[variant as keyof typeof iconColors] || iconColors.custom;

  return (
    <div className="relative mx-auto mb-6">
      {/* Background decoration */}
      <div className={cn(
        'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-2xl scale-150',
        gradientClass
      )} />
      
      {/* Main circle */}
      <div className={cn(
        'relative w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center',
        gradientClass
      )}>
        <Icon className={cn('w-10 h-10', iconClass)} strokeWidth={1.5} />
      </div>
      
      {/* Decorative dots */}
      <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-syn-secondary/30 animate-pulse" />
      <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-syn-primary/30 animate-pulse delay-300" />
    </div>
  );
}

export function EmptyState({
  variant = 'custom',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  // Get preset or use custom values
  const preset = variant !== 'custom' ? PRESETS[variant] : null;
  
  const displayIcon = icon || preset?.icon || FolderOpen;
  const displayTitle = title || preset?.title || 'Nothing here yet';
  const displayDescription = description || preset?.description || 'Get started by taking an action.';
  const displayActionLabel = action?.label || preset?.actionLabel || 'Get Started';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        'bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/15',
        'transition-colors hover:border-muted-foreground/25',
        className
      )}
    >
      <EmptyIllustration icon={displayIcon} variant={variant} />
      
      <h3 className={cn(
        'font-semibold text-foreground mb-2',
        compact ? 'text-base' : 'text-lg'
      )}>
        {displayTitle}
      </h3>
      
      <p className={cn(
        'text-muted-foreground max-w-sm mb-6',
        compact ? 'text-sm' : 'text-base'
      )}>
        {displayDescription}
      </p>
      
      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick} className="gap-2 shadow-sm">
            {action.icon ? <action.icon className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {displayActionLabel}
          </Button>
        )}
        
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick} className="shadow-sm">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
