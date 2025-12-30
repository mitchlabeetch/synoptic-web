// src/components/ui/lordicon.tsx
// PURPOSE: Lordicon animated icon integration
// ACTION: Provides animated icons for Library interface and other UI elements
// MECHANISM: Uses Lordicon CDN with React wrapper component

'use client';

import { useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

// Declare the lordicon-element custom element for TypeScript
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang' | 'sequence';
          delay?: string | number;
          colors?: string;
          stroke?: string;
          state?: string;
          target?: string;
        },
        HTMLElement
      >;
    }
  }
}

// Popular Lordicon icons for the Library UI
export const LORDICON_URLS = {
  // Navigation & UI
  search: 'https://cdn.lordicon.com/msoeawqm.json',
  menu: 'https://cdn.lordicon.com/ipnwkgdy.json',
  home: 'https://cdn.lordicon.com/cnpvyndp.json',
  settings: 'https://cdn.lordicon.com/hwuyodym.json',
  
  // Library Categories
  book: 'https://cdn.lordicon.com/fkdzyfle.json',
  bible: 'https://cdn.lordicon.com/kipaqhoz.json', // Open book
  scroll: 'https://cdn.lordicon.com/urdtkkql.json',
  feather: 'https://cdn.lordicon.com/iltqorsz.json', // Writing
  palette: 'https://cdn.lordicon.com/slkvcfos.json', // Art
  museum: 'https://cdn.lordicon.com/wxnxiano.json', // Building
  newspaper: 'https://cdn.lordicon.com/zpxybbhl.json',
  globe: 'https://cdn.lordicon.com/qhviklyi.json',
  chat: 'https://cdn.lordicon.com/hpivxauj.json', // Slang/language
  academic: 'https://cdn.lordicon.com/dxjqoygy.json', // Graduation cap
  
  // Actions
  download: 'https://cdn.lordicon.com/ternnbni.json',
  upload: 'https://cdn.lordicon.com/xhbsnkyp.json',
  play: 'https://cdn.lordicon.com/becebamh.json',
  pause: 'https://cdn.lordicon.com/akuwjdzh.json',
  sparkle: 'https://cdn.lordicon.com/yqzmiobz.json', // Magic/AI
  check: 'https://cdn.lordicon.com/lomfljuq.json',
  error: 'https://cdn.lordicon.com/tdrtiskw.json',
  
  // Content types
  image: 'https://cdn.lordicon.com/vixtkkbk.json',
  audio: 'https://cdn.lordicon.com/kiqiauff.json', // Music
  video: 'https://cdn.lordicon.com/aklfruoc.json',
  document: 'https://cdn.lordicon.com/vuiggmtc.json',
  
  // Social
  share: 'https://cdn.lordicon.com/uvqnvwbl.json',
  heart: 'https://cdn.lordicon.com/mdgrhyca.json',
  star: 'https://cdn.lordicon.com/rjzlnunf.json',
  
  // Status
  loading: 'https://cdn.lordicon.com/xjovhxra.json',
  success: 'https://cdn.lordicon.com/lupuorrc.json',
  warning: 'https://cdn.lordicon.com/usownftb.json',
  info: 'https://cdn.lordicon.com/yggiulvp.json',
} as const;

export type LordiconName = keyof typeof LORDICON_URLS;

interface LordiconProps {
  icon: LordiconName | string;  // Either a preset name or full URL
  size?: number | string;
  trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang' | 'sequence';
  delay?: number;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lordicon Component - Animated icons for premium UI feel
 * 
 * @example
 * <Lordicon icon="book" size={48} trigger="hover" />
 * <Lordicon icon="sparkle" size={32} trigger="loop" colors={{ primary: '#2563eb' }} />
 */
export const Lordicon = memo(function Lordicon({
  icon,
  size = 48,
  trigger = 'hover',
  delay,
  colors,
  stroke,
  className,
  style,
}: LordiconProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Lordicon player script once
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.customElements.get('lord-icon')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.lordicon.com/lordicon.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Get the full URL
  const iconUrl = typeof icon === 'string' && icon.startsWith('http')
    ? icon
    : LORDICON_URLS[icon as LordiconName] || icon;

  // Build colors prop string
  const colorsString = colors
    ? `primary:${colors.primary || '#121331'},secondary:${colors.secondary || '#08a88a'}`
    : undefined;

  return (
    <div
      ref={containerRef}
      className={cn('inline-flex items-center justify-center', className)}
      style={style}
    >
      <lord-icon
        src={iconUrl}
        trigger={trigger}
        delay={delay?.toString()}
        colors={colorsString}
        stroke={stroke?.toString()}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
        }}
      />
    </div>
  );
});

/**
 * LordiconButton - Button with animated icon
 */
interface LordiconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LordiconName | string;
  iconSize?: number;
  iconColors?: { primary?: string; secondary?: string };
  children?: React.ReactNode;
}

export function LordiconButton({
  icon,
  iconSize = 24,
  iconColors,
  children,
  className,
  ...props
}: LordiconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-muted/50 hover:bg-muted transition-colors',
        'font-medium text-sm',
        className
      )}
      {...props}
    >
      <Lordicon
        icon={icon}
        size={iconSize}
        trigger="hover"
        colors={iconColors}
      />
      {children}
    </button>
  );
}

/**
 * LordiconBadge - Badge with animated icon for categories
 */
interface LordiconBadgeProps {
  icon: LordiconName | string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LordiconBadge({
  icon,
  label,
  active = false,
  onClick,
  className,
}: LordiconBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
        'text-sm font-medium whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground',
        className
      )}
    >
      <Lordicon
        icon={icon}
        size={20}
        trigger={active ? 'loop' : 'hover'}
        colors={active ? { primary: '#fff', secondary: '#fff' } : undefined}
      />
      {label}
    </button>
  );
}
