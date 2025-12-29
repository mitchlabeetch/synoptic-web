"use client"

import { useState, useEffect } from 'react'
import { Leaf, Wind, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface CarbonData {
  url: string
  green: boolean
  bytes: number
  cleanerThan: number
  statistics: {
    co2: {
      grid: { grams: number; litres: number }
      renewable: { grams: number; litres: number }
    }
  }
}

export function WebsiteCarbonBadge({ url = "https://synoptic.studio", className }: { url?: string, className?: string }) {
  const t = useTranslations('Marketing.carbon')
  const [data, setData] = useState<CarbonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    // Check if we have cached data in sessionStorage to avoid hitting API limit
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(`carbon_${url}`) : null
    if (cached) {
      setData(JSON.parse(cached))
      setLoading(false)
      return
    }

    fetch(`https://api.websitecarbon.com/site?url=${url}`)
      .then(res => {
         if (!res.ok) throw new Error('Status ' + res.status)
         return res.json()
      })
      .then(data => {
        setData(data)
        setLoading(false)
        sessionStorage.setItem(`carbon_${url}`, JSON.stringify(data))
      })
      .catch((e) => {
        console.warn("Carbon API Error:", e)
        setError(true)
        setLoading(false)
      })
  }, [url])

  // Formatting helper
  const grams = data?.statistics?.co2?.grid?.grams?.toFixed(2) ?? "0.00"
  const cleanerThan = data ? Math.floor(data.cleanerThan * 100) : 0
  const isGreen = data?.green ?? false

  return (
    <a 
      href={`https://www.websitecarbon.com/website/${url.replace('https://', '').replace('http://', '')}/`} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-500",
        "border border-border/50 bg-background/50 hover:bg-emerald-500/10 hover:border-emerald-500/30",
        "backdrop-blur-sm",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn(
        "relative flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-500",
        loading ? "bg-muted" : isGreen ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-yellow-100 text-yellow-600"
      )}>
        {loading ? (
           <Wind className="w-3 h-3 animate-pulse" />
        ) : (
           <Leaf className="w-3 h-3" />
        )}
      </div>

      <div className="flex flex-col relative h-4 justify-center">
        {/* Animated Carousel for Text */}
        <div className={cn(
            "relative transition-all duration-500 flex flex-col gap-1",
            hovered ? "-top-[1.25rem]" : "top-0"
        )}>
             <span className="h-[1.25rem] flex items-center whitespace-nowrap text-muted-foreground group-hover:text-foreground transition-colors overflow-hidden">
                {loading ? t('calculating') : error ? "Eco-Friendly" : t('co2', { amount: grams })}
            </span>
            <span className="h-[1.25rem] flex items-center whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold overflow-hidden">
                 {!loading && !error && data ? t('cleanerThan', { percentage: cleanerThan }) : t('measure')}
            </span>
        </div>
      </div>
      
      {/* Tooltip glow effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-emerald-500/5 blur-xl" />
    </a>
  )
}
