// src/lib/ai/providers/rag.ts
// PURPOSE: Manual RAG (Retrieve-And-Generate) provider using local embeddings + Llama 70B
// ACTION: Retrieves relevant knowledge chunks, then calls DO serverless inference
// MECHANISM: Uses pgvector for semantic search, @xenova/transformers for embeddings

/**
 * 🧠 RAG PROVIDER
 * 
 * This provider implements "Manual RAG" - a cost-effective approach where:
 * 1. We generate query embeddings locally (zero API cost)
 * 2. We retrieve relevant context from our PostgreSQL knowledge base
 * 3. We inject that context into prompts for Llama 70B inference
 * 
 * Benefits:
 * - No expensive managed Knowledge Base fees
 * - Full control over retrieval logic
 * - Transparent - you can inspect exactly what context was used
 * - Portable - not locked to any vendor's RAG implementation
 */

import { AIProvider, AITranslationResult, AIAnnotationResult, AIExplanationResult } from '../types';
import { query } from '@/lib/db/client';

// Embedding model singleton
let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      // Dynamic import for ES module compatibility
      const { pipeline } = await import('@xenova/transformers');
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    })();
  }
  return extractorPromise;
}

// Generate embedding vector from text
async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

// Format vector for PostgreSQL query
function formatVector(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

// DO Gradient AI inference endpoint
const DO_INFERENCE_URL = 'https://inference.do-ai.run/v1/chat/completions';

export class RAGProvider implements AIProvider {
  private linguistKey: string;
  private philologistKey: string;

  constructor() {
    // These are the Endpoint Access Keys provided
    this.linguistKey = process.env.DO_LINGUIST_KEY || process.env.NEXT_PUBLIC_AI_AGENT_LINGUIST_ID || '';
    this.philologistKey = process.env.DO_PHILOLOGIST_KEY || process.env.NEXT_PUBLIC_AI_AGENT_PHILOLOGIST_ID || '';
  }

  /**
   * Retrieve relevant context from the knowledge base
   */
  private async retrieveContext(
    queryText: string, 
    language: string,
    limit: number = 3
  ): Promise<string[]> {
    try {
      // Generate embedding for the query
      const queryVector = await embed(queryText);
      const vectorLiteral = formatVector(queryVector);

      // Semantic search in PostgreSQL using pgvector
      // The <=> operator computes cosine distance (lower = more similar)
      const result = await query<{ content: string; section_title: string; similarity: number }>(
        `SELECT 
           content, 
           section_title,
           1 - (embedding <=> $1::vector) as similarity
         FROM knowledge_base 
         WHERE language = $2 
         ORDER BY embedding <=> $1::vector 
         LIMIT $3`,
        [vectorLiteral, language, limit]
      );

      if (result.rows.length === 0) {
        console.log(`[RAG] No context found for language: ${language}`);
        return [];
      }

      console.log(`[RAG] Retrieved ${result.rows.length} chunks for "${language}":`,
        result.rows.map(r => `${r.section_title} (${(r.similarity * 100).toFixed(1)}%)`));

      return result.rows.map(r => r.content);
    } catch (error) {
      console.error('[RAG] Retrieval error:', error);
      // Return empty array on error - the AI will still work, just without context
      return [];
    }
  }

  /**
   * Call DO Gradient AI for inference
   */
  private async inference(
    systemPrompt: string,
    userMessage: string,
    accessKey: string
  ): Promise<string> {
    const response = await fetch(DO_INFERENCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2048,
        temperature: 0.3, // Lower temperature for more consistent output
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RAG] Inference error:', errorText);
      throw new Error(`Inference failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Parse JSON from AI response (handles markdown code blocks)
   */
  private parseJSON<T>(response: string, fallback: T): T {
    try {
      const cleaned = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      console.error('[RAG] Failed to parse JSON:', response.slice(0, 200));
      return fallback;
    }
  }

  /**
   * 🌐 THE LINGUIST: Translation with optional RAG context
   */
  async translate(
    text: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<AITranslationResult> {
    // For translation, we might want context about the target language's rules
    const context = await this.retrieveContext(
      `translation rules style guide ${targetLang}`,
      targetLang,
      2
    );

    const systemPrompt = `You are "The Linguist" (Llama 3.3 70B), a world-class translator.

${context.length > 0 ? `REFERENCE - Style Guide for ${targetLang}:
---
${context.join('\n\n---\n\n')}
---

Use the style guide above to ensure your translation follows proper conventions.` : ''}

TASK: Translate the following text from ${sourceLang} to ${targetLang}.
Maintain the original meaning, tone, and nuance.

RESPOND WITH JSON ONLY:
{ "translation": "your translation here", "confidence": 0.95 }`;

    const userMessage = text;

    try {
      const response = await this.inference(systemPrompt, userMessage, this.linguistKey);
      return this.parseJSON(response, { translation: text, confidence: 0 });
    } catch (error) {
      console.error('[RAG] Translation failed:', error);
      return { translation: text, confidence: 0 };
    }
  }

  /**
   * 📚 THE PHILOLOGIST: Deep grammatical analysis with RAG
   */
  async annotate(
    L1Text: string, 
    L2Text: string, 
    L1Lang: string, 
    L2Lang: string
  ): Promise<AIAnnotationResult> {
    // Retrieve grammar context for both languages
    const [L1Context, L2Context] = await Promise.all([
      this.retrieveContext(`grammar syntax word order ${L1Lang}`, L1Lang, 2),
      this.retrieveContext(`grammar syntax word order ${L2Lang}`, L2Lang, 2),
    ]);

    const systemPrompt = `You are "The Philologist" (Llama 3.3 70B), an expert comparative linguist.

${L1Context.length > 0 ? `REFERENCE - ${L1Lang} Grammar:
---
${L1Context.join('\n\n---\n\n')}
---` : ''}

${L2Context.length > 0 ? `REFERENCE - ${L2Lang} Grammar:
---
${L2Context.join('\n\n---\n\n')}
---` : ''}

TASK: Analyze the alignment between these bilingual sentences and provide educational annotations.
Identify word groups by grammatical role, show translation relationships with arrows, and add notes for interesting grammar points.

RESPOND WITH JSON ONLY:
{
  "wordGroups": [
    { "language": "L1", "wordIndices": [0, 1], "role": "Subject", "color": "#3B82F6" }
  ],
  "arrows": [
    { "source": { "language": "L1", "words": [0] }, "target": { "language": "L2", "words": [0] }, "label": "direct translation" }
  ],
  "notes": [
    { "type": "grammar", "wordIndex": 0, "language": "L1", "title": "Note Title", "content": "Explanation..." }
  ]
}`;

    const userMessage = `SOURCE (${L1Lang}): "${L1Text}"
TARGET (${L2Lang}): "${L2Text}"`;

    try {
      const response = await this.inference(systemPrompt, userMessage, this.philologistKey);
      return this.parseJSON(response, { wordGroups: [], arrows: [], notes: [] });
    } catch (error) {
      console.error('[RAG] Annotation failed:', error);
      return { wordGroups: [], arrows: [], notes: [] };
    }
  }

  /**
   * 🔍 EXPLAIN: Deep word analysis with full RAG context
   */
  async explain(
    word: string, 
    context: string, 
    language: string
  ): Promise<AIExplanationResult> {
    // This is where RAG really shines - retrieve specific grammar info
    const grammarContext = await this.retrieveContext(
      `${word} grammar rules conjugation declension ${language}`,
      language,
      3
    );

    const systemPrompt = `You are "The Philologist" (Llama 3.3 70B), specializing in deep word analysis.

${grammarContext.length > 0 ? `REFERENCE - ${language} Grammar Knowledge:
---
${grammarContext.join('\n\n---\n\n')}
---

Use the reference above to provide accurate, authoritative explanations.` : ''}

TASK: Explain the word "${word}" as used in the given context.
Cover its grammatical role, etymology if relevant, and provide usage examples.

RESPOND WITH JSON ONLY:
{
  "role": "grammatical role (noun, verb, etc.)",
  "explanation": "detailed explanation",
  "examples": ["example sentence 1", "example sentence 2"],
  "relatedWords": ["related1", "related2"]
}`;

    const userMessage = `Word: "${word}"
Context: "${context}"
Language: ${language}`;

    try {
      const response = await this.inference(systemPrompt, userMessage, this.philologistKey);
      return this.parseJSON(response, { 
        role: 'unknown', 
        explanation: 'Could not generate explanation.' 
      });
    } catch (error) {
      console.error('[RAG] Explanation failed:', error);
      return { role: 'unknown', explanation: 'Could not generate explanation.' };
    }
  }
}
