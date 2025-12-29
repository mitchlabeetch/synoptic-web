// src/lib/ai/aiProvider.ts
import { AIProvider } from './types';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { DOGenAIProvider } from '@/lib/ai/providers/digitalocean';

export type ProviderType = 'openai' | 'digitalocean';

export function getAIProvider(type: ProviderType = 'openai'): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'digitalocean':
      return new DOGenAIProvider();
    default:
      return new OpenAIProvider();
  }
}

// Lazy initialization to avoid instantiating the provider during build time
let aiInstance: AIProvider | null = null;

function getOrCreateInstance(): AIProvider {
  if (!aiInstance) {
    aiInstance = getAIProvider((process.env.AI_PROVIDER as ProviderType) || 'openai');
  }
  return aiInstance;
}

export const ai: AIProvider = {
  translate: (text: string, sourceLang: string, targetLang: string) => {
    return getOrCreateInstance().translate(text, sourceLang, targetLang);
  },
  annotate: (L1Text: string, L2Text: string, L1Lang: string, L2Lang: string) => {
    return getOrCreateInstance().annotate(L1Text, L2Text, L1Lang, L2Lang);
  },
  explain: (word: string, context: string, language: string) => {
    return getOrCreateInstance().explain(word, context, language);
  },
};
