'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES } from '@/data/languages';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    // Set cookie and refresh
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs font-bold uppercase tracking-widest border-none bg-transparent hover:bg-accent rounded-full transition-colors font-outfit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-[300px] z-[2000]">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem 
              key={lang.code} 
              value={lang.code}
              className="text-xs font-medium"
            >
              <div className="flex items-center justify-between w-full gap-4">
                <span>{lang.label}</span>
                <span className="text-[10px] text-muted-foreground uppercase opacity-50">
                  {lang.code}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
