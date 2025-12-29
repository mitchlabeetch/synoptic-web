// src/lib/ai/providers/digitalocean.ts
import { AIProvider, AITranslationResult, AIAnnotationResult } from '../types';

export class DOGenAIProvider implements AIProvider {
  private baseUrl = 'https://api.digitalocean.com/genai/v1';
  private agentId: string;
  private token: string;

  constructor() {
    this.agentId = process.env.DIGITALOCEAN_GENAI_AGENT_ID || '';
    this.token = process.env.DIGITALOCEAN_GENAI_TOKEN || '';
  }

  private async callAgent(prompt: string): Promise<any> {
    if (!this.agentId || !this.token) {
      throw new Error('DigitalOcean GenAI credentials missing');
    }

    const response = await fetch(`${this.baseUrl}/agents/${this.agentId}/conversations`, {
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DO GenAI Error: ${error}`);
    }

    const data = await response.json();
    // Assuming the agent returns JSON in its last message
    const lastMessage = data.messages[data.messages.length - 1].content;
    try {
      return JSON.parse(lastMessage.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('Failed to parse Agent response as JSON:', lastMessage);
      throw new Error('Agent failed to return valid JSON');
    }
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<AITranslationResult> {
    const prompt = `Translate this from ${sourceLang} to ${targetLang}. 
    Respond ONLY with JSON: { "translation": "...", "confidence": 0.95, "explanation": "..." }
    Text: ${text}`;
    
    return this.callAgent(prompt);
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

    return this.callAgent(prompt);
  }

  async explain(word: string, context: string, language: string): Promise<any> {
    const prompt = `Explain the word "${word}" used in the following sentence: "${context}" (${language}).
    Respond ONLY with JSON: { "role": "...", "explanation": "...", "examples": [], "relatedWords": [] }`;
    
    return this.callAgent(prompt);
  }
}
