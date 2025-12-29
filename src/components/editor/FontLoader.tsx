'use client';

// src/components/editor/FontLoader.tsx
// PURPOSE: Dynamically load Google Fonts required by the project
// ACTION: Monitors project settings and languages to inject necessary font links
// MECHANISM: Injects <link> tags or CSS @imports into the document head

import { useEffect } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { getLanguageByCode } from '@/data/languages';

export function FontLoader() {
  const { settings, meta } = useProjectStore();

  useEffect(() => {
    if (!meta) return;

    const fontsToLoad = new Set<string>();

    // Add global fonts from settings
    if (settings.fonts.body) fontsToLoad.add(settings.fonts.body);
    if (settings.fonts.heading) fontsToLoad.add(settings.fonts.heading);
    if (settings.fonts.annotation) fontsToLoad.add(settings.fonts.annotation);

    // Add suggested fonts for source and target languages to be safe
    const sourceLang = getLanguageByCode(meta.source_lang);
    const targetLang = getLanguageByCode(meta.target_lang);

    sourceLang?.suggestedFonts.forEach(f => fontsToLoad.add(f));
    targetLang?.suggestedFonts.forEach(f => fontsToLoad.add(f));

    if (fontsToLoad.size === 0) return;

    // Build Google Fonts URL
    // Format: family=Font+Name:ital,wght@0,400;0,700;1,400&family=Other+Font...
    const families = Array.from(fontsToLoad)
      .map(font => `family=${font.replace(/ /g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700`)
      .join('&');

    const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;

    // Check if link already exists
    const existingLink = document.getElementById('dynamic-google-fonts');
    if (existingLink) {
      if (existingLink.getAttribute('href') === url) return;
      existingLink.setAttribute('href', url);
    } else {
      const link = document.createElement('link');
      link.id = 'dynamic-google-fonts';
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  }, [settings.fonts, meta]);

  return null; // This component doesn't render anything
}
