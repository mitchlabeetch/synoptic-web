// src/lib/ai/aiProvider.ts
// PURPOSE: AI Provider factory for translation and annotation services
// ACTION: Creates the appropriate AI provider based on configuration
// MECHANISM: Lazy-loads providers to avoid build-time initialization issues

import { AIProvider } from './types';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { DOGenAIProvider } from '@/lib/ai/providers/digitalocean';
import { GradientAIProvider } from '@/lib/ai/providers/gradient';
import { RAGProvider } from '@/lib/ai/providers/rag';

export type ProviderType = 'openai' | 'digitalocean' | 'gradient' | 'rag';

export function getAIProvider(type: ProviderType = 'rag'): AIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'digitalocean':
      return new DOGenAIProvider();
    case 'gradient':
      return new GradientAIProvider();
    case 'rag':
      // 🧠 Manual RAG: Local embeddings + pgvector + Llama 70B
      // Most cost-effective option - no managed KB fees
      return new RAGProvider();
    default:
      // Default to RAG for cost efficiency
      return new RAGProvider();
  }
}

// Lazy initialization to avoid instantiating the provider during build time
let aiInstance: AIProvider | null = null;

function getOrCreateInstance(): AIProvider {
  if (!aiInstance) {
    const providerType = (process.env.AI_PROVIDER as ProviderType) || 'gradient';
    aiInstance = getAIProvider(providerType);
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
