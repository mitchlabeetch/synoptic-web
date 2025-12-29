// src/lib/ai/types.ts

export interface AITranslationResult {
  translation: string;
  confidence: number;
  explanation?: string;
}

export interface AIAnnotationResult {
  wordGroups: {
    language: 'L1' | 'L2';
    wordIndices: number[];
    role: string;
    color: string;
  }[];
  arrows: {
    source: { language: 'L1' | 'L2'; words: number[] };
    target: { language: 'L1' | 'L2'; words: number[] };
    label?: string;
  }[];
  notes: {
    type: 'grammar' | 'vocabulary' | 'culture';
    wordIndex: number;
    language: 'L1' | 'L2';
    title: string;
    content: string;
  }[];
}

export interface AIExplanationResult {
  role: string;
  explanation: string;
  examples?: string[];
  relatedWords?: string[];
}

export interface AIProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<AITranslationResult>;
  annotate(L1Text: string, L2Text: string, L1Lang: string, L2Lang: string): Promise<AIAnnotationResult>;
  explain(word: string, context: string, language: string): Promise<AIExplanationResult>;
}
