// src/lib/ai/aiProvider.ts
import { AIProvider } from './types';
import { OpenAIProvider } from './providers/openai';
import { DOGenAIProvider } from './providers/digitalocean';

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

export const ai = getAIProvider((process.env.AI_PROVIDER as ProviderType) || 'openai');
