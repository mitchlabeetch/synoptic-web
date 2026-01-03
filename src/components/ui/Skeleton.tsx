// src/components/ui/Skeleton.tsx
// PURPOSE: Skeleton loading placeholders with shimmer animation
// ACTION: Provides visual feedback during data loading states
// MECHANISM: CSS-based shimmer animation with configurable shapes

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  /** Number of lines for text variant */
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = cn(
    'animate-pulse bg-muted relative overflow-hidden',
    'before:absolute before:inset-0',
    'before:translate-x-[-100%]',
    'before:animate-[shimmer_2s_infinite]',
    'before:bg-gradient-to-r',
    'before:from-transparent before:via-background/60 before:to-transparent'
  );

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'circular' ? width : undefined),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variantStyles.text)}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : '100%', // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

/**
 * Pre-built skeleton for project cards matching ProjectCard layout
 */
export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton variant="text" width="65%" height={20} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
      
      {/* Language badges */}
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>
      
      {/* Date line */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Skeleton variant="text" width={100} height={12} />
        <Skeleton variant="rectangular" width={32} height={32} className="rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Pre-built skeleton for saved templates grid
 */
export function TemplateCardSkeleton() {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-transparent">
      <div className="flex items-start gap-3">
        <Skeleton variant="rectangular" width={36} height={36} className="rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton variant="text" width="85%" height={16} />
          <Skeleton variant="text" width="60%" height={12} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the saved templates section header and grid
 */
export function SavedTemplatesSkeleton() {
  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={140} height={18} />
        </div>
        <Skeleton variant="rectangular" width={80} height={28} className="rounded-md" />
      </div>
      
      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard loading skeleton for entire page
 */
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={280} height={16} />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" width={100} height={36} className="rounded-md" />
          <Skeleton variant="rectangular" width={120} height={36} className="rounded-md" />
        </div>
      </div>
      
      {/* Saved Templates */}
      <div className="mb-8">
        <SavedTemplatesSkeleton />
      </div>
      
      {/* Projects Header */}
      <div className="mb-4">
        <Skeleton variant="text" width={140} height={24} />
      </div>
      
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
