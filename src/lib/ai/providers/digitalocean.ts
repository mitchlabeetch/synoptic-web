// src/lib/ai/providers/digitalocean.ts
// PURPOSE: DigitalOcean GenAI Agent provider for translations and annotations
// ACTION: Uses DO's GenAI Agents API with the Linguist and Philologist agents
// MECHANISM: Calls agent endpoints with proper authentication

import { AIProvider, AITranslationResult, AIAnnotationResult, AIExplanationResult } from '../types';

export class DOGenAIProvider implements AIProvider {
  private baseUrl = 'https://api.digitalocean.com/v1/gen-ai/agents';
  private linguistId: string;
  private philologistId: string;
  private token: string;

  constructor() {
    // Use the correct env variable names as configured in production
    this.linguistId = process.env.AI_AGENT_LINGUIST_ID || process.env.NEXT_PUBLIC_AI_AGENT_LINGUIST_ID || '';
    this.philologistId = process.env.AI_AGENT_PHILOLOGIST_ID || process.env.NEXT_PUBLIC_AI_AGENT_PHILOLOGIST_ID || '';
    this.token = process.env.DIGITALOCEAN_GENAI_TOKEN || '';
  }

  private async callAgent(agentId: string, prompt: string): Promise<any> {
    if (!agentId || !this.token) {
      throw new Error('DigitalOcean GenAI credentials missing');
    }

    // DigitalOcean GenAI Agents Chat Endpoint
    // POST /v1/gen-ai/agents/{agent_uuid}/chat
    const response = await fetch(`${this.baseUrl}/${agentId}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[DO GenAI] Agent Error:`, error);
      throw new Error(`DO GenAI Error: ${response.status}`);
    }

    const data = await response.json();
    // Extract the assistant's response
    const assistantMessage = data.choices?.[0]?.message?.content || 
                            data.messages?.[data.messages?.length - 1]?.content ||
                            '';
    
    try {
      return JSON.parse(assistantMessage.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('Failed to parse Agent response as JSON:', assistantMessage.substring(0, 200));
      throw new Error('Agent failed to return valid JSON');
    }
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<AITranslationResult> {
    const prompt = `Translate this from ${sourceLang} to ${targetLang}. 
    Respond ONLY with JSON: { "translation": "...", "confidence": 0.95 }
    Text: ${text}`;
    
    try {
      return await this.callAgent(this.linguistId, prompt);
    } catch (error) {
      console.error('[DO GenAI] Translation failed:', error);
      return { translation: text, confidence: 0 };
    }
  }

  async annotate(L1Text: string, L2Text: string, L1Lang: string, L2Lang: string): Promise<AIAnnotationResult> {
    const prompt = `Analyze this bilingual pair and provide educational annotations.
    SOURCE (${L1Lang}): "${L1Text}"
    TRANSLATION (${L2Lang}): "${L2Text}"
    
    Respond ONLY with JSON:
    {
      "wordGroups": [],
      "arrows": [],
      "notes": []
    }`;

    try {
      return await this.callAgent(this.philologistId, prompt);
    } catch (error) {
      console.error('[DO GenAI] Annotation failed:', error);
      return { wordGroups: [], arrows: [], notes: [] };
    }
  }

  async explain(word: string, context: string, language: string): Promise<AIExplanationResult> {
    const prompt = `Explain the word "${word}" used in the following sentence: "${context}" (${language}).
    Respond ONLY with JSON: { "role": "...", "explanation": "...", "examples": [], "relatedWords": [] }`;
    
    try {
      return await this.callAgent(this.philologistId, prompt);
    } catch (error) {
      console.error('[DO GenAI] Explain failed:', error);
      return { role: 'unknown', explanation: 'Could not generate explanation.' };
    }
  }
}

