'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, Save, User as UserIcon } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/data/languages';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface UserSettingsProps {
  user: {
    id: string;
    email: string;
    name?: string;
    preferred_locale: string;
  };
}

export default function UserSettings({ user }: UserSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [locale, setLocale] = useState(user.preferred_locale || 'en');
  
  const tAuth = useTranslations('Auth');
  const tSettings = useTranslations('Settings');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, preferred_locale: locale }),
      });

      if (response.ok) {
        // Update locale cookie to match profile
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-muted-foreground/20">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {tSettings('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{tAuth('email')}</Label>
            <Input id="email" value={user.email} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{tSettings('displayName')}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={tSettings('displayNamePlaceholder')} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">{tSettings('interfaceLanguage')}</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lang.label}</span>
                      <span className="text-muted-foreground text-xs italic">({lang.labelEn})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground italic mt-1">
              {tSettings('interfaceLanguageHint')}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>{tSettings('cancel') || 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? tSettings('saving') : tSettings('saveSettings')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
