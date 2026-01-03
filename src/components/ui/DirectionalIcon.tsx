// src/components/ui/DirectionalIcon.tsx
// PURPOSE: RTL-aware directional icons for Arabic/Hebrew interfaces
// ACTION: Automatically flips arrow icons in RTL contexts
// MECHANISM: Detects document direction and swaps icon components

'use client';

import { 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  CornerDownRight,
  CornerDownLeft,
  CornerUpRight,
  CornerUpLeft,
  type LucideIcon,
  type LucideProps, 
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Map of LTR icons to their RTL counterparts
const RTL_ICON_MAP: Record<string, LucideIcon> = {
  ArrowRight: ArrowLeft,
  ArrowLeft: ArrowRight,
  ChevronRight: ChevronLeft,
  ChevronLeft: ChevronRight,
  ArrowUpRight: ArrowUpLeft,
  ArrowUpLeft: ArrowUpRight,
  ArrowDownRight: ArrowDownLeft,
  ArrowDownLeft: ArrowDownRight,
  CornerDownRight: CornerDownLeft,
  CornerDownLeft: CornerDownRight,
  CornerUpRight: CornerUpLeft,
  CornerUpLeft: CornerUpRight,
};

/**
 * Hook to detect current document direction
 */
export function useDirection(): 'ltr' | 'rtl' {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    // Check document dir attribute
    const htmlDir = document.documentElement.dir as 'ltr' | 'rtl' | '';
    const computedDir = window.getComputedStyle(document.documentElement).direction as 'ltr' | 'rtl';
    
    setDirection(htmlDir || computedDir || 'ltr');

    // Watch for changes
    const observer = new MutationObserver(() => {
      const newDir = document.documentElement.dir as 'ltr' | 'rtl' | '';
      const newComputedDir = window.getComputedStyle(document.documentElement).direction as 'ltr' | 'rtl';
      setDirection(newDir || newComputedDir || 'ltr');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    return () => observer.disconnect();
  }, []);

  return direction;
}

interface DirectionalIconProps extends Omit<LucideProps, 'ref'> {
  /** The LTR variant of the icon */
  icon: LucideIcon;
  /** Force a specific direction (overrides auto-detection) */
  forceDirection?: 'ltr' | 'rtl';
}

/**
 * A direction-aware icon wrapper that automatically flips horizontal arrows
 * in RTL contexts (Arabic, Hebrew, Persian, etc.)
 * 
 * @example
 * // Will render ArrowLeft in RTL context
 * <DirectionalIcon icon={ArrowRight} className="w-4 h-4" />
 */
export function DirectionalIcon({ icon: Icon, forceDirection, ...props }: DirectionalIconProps) {
  const autoDirection = useDirection();
  const direction = forceDirection ?? autoDirection;

  // Get the icon name for mapping
  const iconName = Icon.displayName || Icon.name || '';
  
  // If RTL and we have a mapped counterpart, use it
  if (direction === 'rtl' && RTL_ICON_MAP[iconName]) {
    const RtlIcon = RTL_ICON_MAP[iconName];
    return <RtlIcon {...props} />;
  }

  return <Icon {...props} />;
}

/**
 * Pre-configured "Next" arrow that respects RTL
 * ArrowRight in LTR, ArrowLeft in RTL
 */
export function NextArrow(props: Omit<LucideProps, 'ref'>) {
  return <DirectionalIcon icon={ArrowRight} {...props} />;
}

/**
 * Pre-configured "Previous" arrow that respects RTL
 * ArrowLeft in LTR, ArrowRight in RTL
 */
export function PrevArrow(props: Omit<LucideProps, 'ref'>) {
  return <DirectionalIcon icon={ArrowLeft} {...props} />;
}

/**
 * Pre-configured chevron for "forward" navigation
 */
export function ForwardChevron(props: Omit<LucideProps, 'ref'>) {
  return <DirectionalIcon icon={ChevronRight} {...props} />;
}

/**
 * Pre-configured chevron for "back" navigation
 */
export function BackChevron(props: Omit<LucideProps, 'ref'>) {
  return <DirectionalIcon icon={ChevronLeft} {...props} />;
}
