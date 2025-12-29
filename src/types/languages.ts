// src/types/languages.ts

export interface LanguageConfig {
  code: string; // ISO 639-1
  label: string; // Native name
  labelEn: string; // English name
  direction: 'ltr' | 'rtl';
  script:
    | 'latin'
    | 'cyrillic'
    | 'arabic'
    | 'hebrew'
    | 'cjk'
    | 'devanagari'
    | 'thai'
    | 'other';

  // Typography
  suggestedFonts: string[];
  defaultFontSize: number;
  requiresSpecialRendering: boolean; // For CJK, Arabic, etc.

  // Features
  hyphenationAvailable: boolean;
  conjugationBankAvailable: boolean;
  vocabularyBankAvailable: boolean;

  // Locale for formatting
  locale: string; // e.g., 'fr-FR', 'en-US'
}

export interface CustomLanguageConfig {
  id: string; // User-defined, e.g., 'custom-1'
  code: string; // User-defined, e.g., 'con' for Conlang
  label: string; // User-defined name
  direction: 'ltr' | 'rtl';
  fontFamily: string; // User-selected font
  fontSize: number;
  createdBy: string; // User ID
}
