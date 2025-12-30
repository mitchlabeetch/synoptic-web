// src/services/index.ts
// PURPOSE: Central export for all external service wrappers
// ACTION: Provides a single import point for all service clients
// MECHANISM: Re-exports all service modules

// Existing services
export { wordPolisher } from './datamuse';
export type { DatamuseResult } from './datamuse';

// New Editor Utility Services
export { libreTranslate } from './libreTranslate';
export type { TranslationResult, LanguageInfo } from './libreTranslate';

export { languageTool } from './languageTool';
export type { GrammarMatch, GrammarCheckResult, GrammarCheckOptions } from './languageTool';

export { dictionary } from './dictionary';
export type { DictionaryEntry, DictionaryMeaning, PhoneticsInfo } from './dictionary';

export { synonymsService } from './synonyms';
export type { SynonymResult, SynonymGroup } from './synonyms';
