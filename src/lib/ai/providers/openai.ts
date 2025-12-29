// src/lib/ai/providers/openai.ts
import OpenAI from 'openai';
import { AIProvider, AITranslationResult, AIAnnotationResult } from '../types';

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    });
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<AITranslationResult> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator and linguist specialized in bilingual book creation. 
          Translate the following text from ${sourceLang} to ${targetLang}. 
          Preserve the literary tone, nuance, and structure. 
          Respond ONLY with a JSON object: { "translation": "...", "confidence": 0.95, "explanation": "optional brief note about nuances" }`,
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async annotate(L1Text: string, L2Text: string, L1Lang: string, L2Lang: string): Promise<AIAnnotationResult> {
    const prompt = `Analyze this bilingual text pair and provide educational annotations for language learners.
    
    SOURCE (${L1Lang}): "${L1Text}"
    TRANSLATION (${L2Lang}): "${L2Text}"
    
    Identify:
    1. Word groups by grammatical role (subject, verb, object, etc.)
    2. Exact word-to-word correspondences between languages (for connecting arrows)
    3. Educational notes (grammar points, false friends, or cultural context)
    
    Respond ONLY with JSON:
    {
      "wordGroups": [
        { "language": "L1", "wordIndices": [0, 1], "role": "subject", "color": "#3b82f6" }
      ],
      "arrows": [
        { "source": { "language": "L1", "words": [0] }, "target": { "language": "L2", "words": [0, 1] }, "label": "optional" }
      ],
      "notes": [
        { "type": "grammar", "wordIndex": 2, "language": "L1", "title": "Subjunctive", "content": "..." }
      ]
    }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async explain(word: string, context: string, language: string): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional language tutor. Explain the grammatical role and meaning of specific words within a given context for a language learner.',
        },
        {
          role: 'user',
          content: `Explain "${word}" in the context of: "${context}" (Language: ${language}). 
          Respond ONLY with JSON: { "role": "verb/noun/etc", "explanation": "...", "examples": ["..."], "relatedWords": ["..."] }`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
