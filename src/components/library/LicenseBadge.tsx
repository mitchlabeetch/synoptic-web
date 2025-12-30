// src/components/library/LicenseBadge.tsx
// PURPOSE: Visual indicator for content license type
// ACTION: Shows traffic light badge (🟢 🟡 🔴) on Library tiles
// MECHANISM: Uses License Guard system from types

'use client';

import { LicenseInfo, getLicenseColor } from '@/services/library/types';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Info } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LicenseBadgeProps {
  license: LicenseInfo;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LicenseBadge({ 
  license, 
  showLabel = false,
  size = 'sm',
  className 
}: LicenseBadgeProps) {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const paddingSizes = {
    sm: 'px-1.5 py-0.5',
    md: 'px-2 py-1',
    lg: 'px-3 py-1.5',
  };

  const getIcon = () => {
    switch (license.type) {
      case 'commercial-safe':
        return <ShieldCheck className={cn(iconSizes[size], 'text-green-600')} />;
      case 'attribution':
        return <ShieldAlert className={cn(iconSizes[size], 'text-yellow-600')} />;
      case 'personal-only':
        return <ShieldX className={cn(iconSizes[size], 'text-red-600')} />;
    }
  };

  const getLabel = () => {
    switch (license.type) {
      case 'commercial-safe':
        return 'Commercial Safe';
      case 'attribution':
        return 'Attribution Required';
      case 'personal-only':
        return 'Personal Use Only';
    }
  };

  const getTooltipText = () => {
    switch (license.type) {
      case 'commercial-safe':
        return 'This content is public domain or explicitly licensed for commercial use. You can publish and sell works using this content.';
      case 'attribution':
        return `Commercial use allowed with required attribution. ${license.attributionText || 'Credit must be included.'}`;
      case 'personal-only':
        return `For personal study only. ${license.warningText || 'You cannot sell or commercially distribute works using this content.'}`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full border',
              paddingSizes[size],
              getLicenseColor(license),
              'border-current/20',
              className
            )}
          >
            {getIcon()}
            {showLabel && (
              <span className={cn('font-medium', textSizes[size])}>
                {getLabel()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-bold text-xs mb-1">{license.name}</p>
              <p className="text-xs text-muted-foreground">{getTooltipText()}</p>
              {license.url && (
                <a 
                  href={license.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View full license →
                </a>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact license indicator for tile cards
 */
export function LicenseIndicator({ license }: { license: LicenseInfo }) {
  const getDot = () => {
    switch (license.type) {
      case 'commercial-safe':
        return 'bg-green-500';
      case 'attribution':
        return 'bg-yellow-500';
      case 'personal-only':
        return 'bg-red-500';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm',
              getDot()
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {license.type === 'commercial-safe' && 'Commercial safe'}
          {license.type === 'attribution' && 'Attribution required'}
          {license.type === 'personal-only' && 'Personal use only'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
