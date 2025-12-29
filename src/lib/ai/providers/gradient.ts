// src/lib/ai/providers/gradient.ts
// PURPOSE: DigitalOcean Gradient AI Serverless Inference provider
// ACTION: Implements AI functions using DO Gradient AI API
// MECHANISM: Makes HTTP requests to https://inference.do-ai.run with model access key

import { AIProvider, AITranslationResult, AIAnnotationResult, AIExplanationResult } from '../types';

const GRADIENT_API_URL = 'https://inference.do-ai.run/v1/chat/completions';
const DEFAULT_MODEL = 'llama3.3-70b-instruct';

export class GradientAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.DO_GRADIENT_API_KEY || '';
    this.model = process.env.DO_GRADIENT_MODEL || DEFAULT_MODEL;
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error(
        'DO_GRADIENT_API_KEY environment variable is required but not set. ' +
        'Create a model access key in the DigitalOcean control panel.'
      );
    }
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>, temperature = 0.7, maxTokens = 1000): Promise<string> {
    this.ensureApiKey();

    const response = await fetch(GRADIENT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Gradient AI] API Error:', error);
      throw new Error(`Gradient AI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<AITranslationResult> {
    const systemPrompt = `You are a professional translator specializing in literary and educational translations. 
Translate the following text from ${sourceLang} to ${targetLang}.
Maintain the tone, style, and meaning of the original.
Return ONLY the translated text, no explanations or notes.`;

    const result = await this.makeRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ], 0.3, 2000);

    return {
      translation: result.trim(),
      confidence: 0.95,
    };
  }

  async annotate(L1Text: string, L2Text: string, L1Lang: string, L2Lang: string): Promise<AIAnnotationResult> {
    const systemPrompt = `You are an expert language teacher creating educational annotations.
Analyze this bilingual text pair and provide helpful annotations for language learners.

SOURCE (${L1Lang}): "${L1Text}"
TRANSLATION (${L2Lang}): "${L2Text}"

Return a JSON object with this exact structure:
{
  "wordGroups": [
    { "words": ["word1", "word2"], "note": "explanation of the phrase/idiom", "type": "grammar|vocabulary|idiom" }
  ],
  "grammarNotes": ["Any important grammar observations"],
  "culturalNotes": ["Any cultural context worth mentioning"],
  "difficulty": "beginner|intermediate|advanced"
}

Respond ONLY with valid JSON, no markdown code blocks.`;

    const result = await this.makeRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze: "${L1Text}" → "${L2Text}"` },
    ], 0.5, 1500);

    try {
      // Try to parse the JSON response
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      // Transform to expected format
      const wordGroups = (parsed.wordGroups || []).map((wg: any, idx: number) => ({
        language: 'L1' as const,
        wordIndices: [idx],
        role: wg.type || 'vocabulary',
        color: wg.type === 'grammar' ? '#3b82f6' : wg.type === 'idiom' ? '#10b981' : '#f59e0b',
      }));

      const notes = [
        ...(parsed.grammarNotes || []).map((note: string, idx: number) => ({
          type: 'grammar' as const,
          wordIndex: 0,
          language: 'L1' as const,
          title: 'Grammar Note',
          content: note,
        })),
        ...(parsed.culturalNotes || []).map((note: string, idx: number) => ({
          type: 'culture' as const,
          wordIndex: 0,
          language: 'L1' as const,
          title: 'Cultural Note',
          content: note,
        })),
      ];

      return {
        wordGroups,
        arrows: [],
        notes,
      };
    } catch (e) {
      console.error('[Gradient AI] Failed to parse annotation response:', result);
      return {
        wordGroups: [],
        arrows: [],
        notes: [{
          type: 'grammar',
          wordIndex: 0,
          language: 'L1',
          title: 'AI Response',
          content: result,
        }],
      };
    }
  }

  async explain(word: string, context: string, language: string): Promise<AIExplanationResult> {
    const systemPrompt = `You are a language expert explaining vocabulary to learners.
Provide a clear, educational explanation for the word/phrase.

Return a JSON object with:
{
  "role": "Part of speech (noun, verb, adjective, etc.)",
  "explanation": "Clear definition and usage in ${language}",
  "examples": ["Example sentence 1", "Example sentence 2"],
  "relatedWords": ["synonym1", "synonym2"]
}

Respond ONLY with valid JSON.`;

    const result = await this.makeRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Explain "${word}" in this context: "${context}"` },
    ], 0.5, 800);

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        role: parsed.role || 'word',
        explanation: parsed.explanation || result,
        examples: parsed.examples || [],
        relatedWords: parsed.relatedWords || [],
      };
    } catch (e) {
      return {
        role: 'word',
        explanation: result,
        examples: [],
        relatedWords: [],
      };
    }
  }
}
