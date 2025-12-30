// src/services/library/adapters/useless-facts.ts
// PURPOSE: Useless Facts adapter (🟢 Commercial Safe)
// ACTION: Fetches random trivia facts for quick translation
// MECHANISM: REST API to uselessfacts.jsph.pl

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
} from '../types';

const API_BASE = 'https://uselessfacts.jsph.pl/api/v2/facts';

interface UselessFact {
  id: string;
  text: string;
  source: string;
  source_url: string;
  language: string;
  permalink: string;
}

export const uselessFactsAdapter: LibraryAdapter = {
  sourceId: 'useless-facts',
  displayName: 'Useless Facts',

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { randomCount = 10 } = config;
    
    try {
      // Fetch multiple random facts
      const promises = Array(randomCount).fill(null).map(() => 
        fetch(`${API_BASE}/random?language=en`).then(r => r.json())
      );
      
      const facts: UselessFact[] = await Promise.all(promises);
      
      // Build lines (all facts on one page for social/flashcard layout)
      const lines: IngestedLine[] = [];
      
      lines.push({
        id: 'facts-title',
        type: 'heading',
        L1: '🎲 Did You Know?',
        L2: '',
      });
      
      lines.push({
        id: 'facts-subtitle',
        type: 'text',
        L1: `${facts.length} fascinating facts for translation practice`,
        L2: '',
      });
      
      lines.push({
        id: 'facts-sep-top',
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      facts.forEach((fact, idx) => {
        lines.push({
          id: `fact-${fact.id || idx}`,
          type: 'text',
          L1: fact.text,
          L2: '',
          meta: {
            sourceUrl: fact.source_url,
          },
        });
        
        if (idx < facts.length - 1) {
          lines.push({
            id: `fact-sep-${idx}`,
            type: 'separator',
            L1: '',
            L2: '',
          });
        }
      });
      
      const page: IngestedPage = {
        id: 'page-facts',
        number: 1,
        title: 'Did You Know?',
        lines,
      };
      
      return {
        title: `${facts.length} Fun Facts`,
        description: 'Quick trivia for translation practice',
        sourceLang: 'en',
        layout: 'social',
        pages: [page],
        meta: {
          source: 'Useless Facts',
          sourceUrl: 'https://uselessfacts.jsph.pl',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Useless Facts adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const response = await fetch(`${API_BASE}/random?language=en`);
      if (!response.ok) throw new Error('Preview failed');
      
      const fact: UselessFact = await response.json();
      
      return {
        title: 'Did You Know?',
        description: 'Random fact',
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-fact',
              type: 'text',
              L1: fact.text,
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Useless Facts preview error:', error);
      throw error;
    }
  },
};

export default uselessFactsAdapter;
