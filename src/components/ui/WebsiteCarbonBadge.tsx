// src/components/ui/WebsiteCarbonBadge.tsx
"use client"

import { Leaf, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Purpose: Displays a premium A+ Sustainability Grade badge.
 * Action: Links to the official Website Carbon report.
 * Mechanism: Aesthetic badge with glassmorphism and emerald accents.
 */
export function WebsiteCarbonBadge({ className }: { className?: string }) {
  return (
    <a 
      href="https://www.websitecarbon.com/website/getsynoptic-com/"
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2 rounded-2xl text-xs transition-all duration-500",
        "bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/10",
        "backdrop-blur-xl shadow-sm hover:shadow-emerald-500/10",
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-500">
        <Award className="w-5 h-5" />
      </div>

      <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/50 dark:text-emerald-400/50">Sustainability</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500/30" />
            <Leaf className="w-2.5 h-2.5 text-emerald-500/40" />
          </div>
          <span className="text-sm font-black text-emerald-900 dark:text-emerald-100 flex items-center gap-1">
            A+ <span className="text-xs opacity-60 font-medium">websitecarbon.com</span>
          </span>
      </div>
      
      {/* Decorative glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-emerald-500/5 blur-xl" />
    </a>
  )
}
