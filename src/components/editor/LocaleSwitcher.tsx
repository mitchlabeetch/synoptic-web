// src/components/editor/LocaleSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

export default function LocaleSwitcher() {
  const locale = useLocale();

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'fr' : 'en';
    // Use a cookie to store the locale preference as next-intl request config checks it
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLocale}
      className="gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
    >
      <Globe className="h-3 w-3" />
      {locale === 'en' ? 'FR' : 'EN'}
    </Button>
  );
}
