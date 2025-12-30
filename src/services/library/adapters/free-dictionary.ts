// src/services/library/adapters/free-dictionary.ts
// PURPOSE: Free Dictionary adapter (🟢 Commercial Safe)
// ACTION: Fetches word definitions with pronunciations and examples
// MECHANISM: REST API to dictionaryapi.dev

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
} from '../types';

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: {
    definition: string;
    example?: string;
    synonyms: string[];
    antonyms: string[];
  }[];
  synonyms: string[];
  antonyms: string[];
}

interface DictionaryPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  license: {
    name: string;
    url: string;
  };
  sourceUrls: string[];
}

export const freeDictionaryAdapter: LibraryAdapter = {
  sourceId: 'free-dictionary',
  displayName: 'Free Dictionary',

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { searchQuery } = config;
    
    if (!searchQuery) {
      throw new Error('Please provide a word to look up');
    }
    
    // Split into multiple words if comma-separated
    const words = searchQuery.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    try {
      const results: { word: string; entries: DictionaryEntry[] | null }[] = await Promise.all(
        words.map(async (word) => {
          try {
            const response = await fetch(`${API_BASE}/${encodeURIComponent(word)}`);
            if (!response.ok) return { word, entries: null };
            const entries: DictionaryEntry[] = await response.json();
            return { word, entries };
          } catch {
            return { word, entries: null };
          }
        })
      );
      
      // Build pages
      const pages: IngestedPage[] = results
        .filter(r => r.entries && r.entries.length > 0)
        .map((result, idx) => {
          const entry = result.entries![0];
          const lines: IngestedLine[] = [];
          
          // Word as heading
          lines.push({
            id: `word-${entry.word}-title`,
            type: 'heading',
            L1: entry.word,
            L2: '',
          });
          
          // Phonetic
          if (entry.phonetic) {
            lines.push({
              id: `word-${entry.word}-phonetic`,
              type: 'text',
              L1: `🔊 ${entry.phonetic}`,
              L2: '',
            });
          }
          
          // Audio link if available
          const audioPhonetic = entry.phonetics.find(p => p.audio && p.audio.length > 0);
          if (audioPhonetic?.audio) {
            lines.push({
              id: `word-${entry.word}-audio`,
              type: 'text',
              L1: `🎧 Audio: ${audioPhonetic.audio}`,
              L2: '',
              meta: {
                audioUrl: audioPhonetic.audio,
              },
            });
          }
          
          // Separator
          lines.push({
            id: `word-${entry.word}-sep`,
            type: 'separator',
            L1: '',
            L2: '',
          });
          
          // Each meaning
          entry.meanings.forEach((meaning, mIdx) => {
            // Part of speech
            lines.push({
              id: `word-${entry.word}-pos-${mIdx}`,
              type: 'text',
              L1: `📝 ${meaning.partOfSpeech.toUpperCase()}`,
              L2: '',
            });
            
            // Definitions
            meaning.definitions.slice(0, 3).forEach((def, dIdx) => {
              lines.push({
                id: `word-${entry.word}-def-${mIdx}-${dIdx}`,
                type: 'text',
                L1: `${dIdx + 1}. ${def.definition}`,
                L2: '',
              });
              
              // Example
              if (def.example) {
                lines.push({
                  id: `word-${entry.word}-ex-${mIdx}-${dIdx}`,
                  type: 'text',
                  L1: `   → "${def.example}"`,
                  L2: '',
                });
              }
            });
            
            // Synonyms
            const synonyms = [...meaning.synonyms, ...meaning.definitions.flatMap(d => d.synonyms)].slice(0, 5);
            if (synonyms.length > 0) {
              lines.push({
                id: `word-${entry.word}-syn-${mIdx}`,
                type: 'text',
                L1: `   Synonyms: ${synonyms.join(', ')}`,
                L2: '',
              });
            }
            
            // Antonyms
            const antonyms = [...meaning.antonyms, ...meaning.definitions.flatMap(d => d.antonyms)].slice(0, 5);
            if (antonyms.length > 0) {
              lines.push({
                id: `word-${entry.word}-ant-${mIdx}`,
                type: 'text',
                L1: `   Antonyms: ${antonyms.join(', ')}`,
                L2: '',
              });
            }
            
            // Separator between meanings
            if (mIdx < entry.meanings.length - 1) {
              lines.push({
                id: `word-${entry.word}-sep-${mIdx}`,
                type: 'separator',
                L1: '',
                L2: '',
              });
            }
          });
          
          return {
            id: `page-${entry.word}`,
            number: idx + 1,
            title: entry.word,
            lines,
          };
        });
      
      if (pages.length === 0) {
        throw new Error('No definitions found for the given word(s)');
      }
      
      return {
        title: words.length === 1 
          ? `Definition: ${words[0]}` 
          : `Vocabulary Study (${pages.length} words)`,
        description: 'English definitions with examples',
        sourceLang: 'en',
        layout: 'flashcard',
        pages,
        meta: {
          source: 'Free Dictionary API',
          sourceUrl: 'https://dictionaryapi.dev',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'CC BY-SA 3.0',
            url: 'https://creativecommons.org/licenses/by-sa/3.0/',
          },
        },
      };
    } catch (error) {
      console.error('Free Dictionary adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Preview with a sample word
      const response = await fetch(`${API_BASE}/serendipity`);
      if (!response.ok) throw new Error('Preview failed');
      
      const entries: DictionaryEntry[] = await response.json();
      const entry = entries[0];
      
      return {
        title: entry.word,
        description: entry.phonetic || '',
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-word',
              type: 'heading',
              L1: entry.word,
              L2: '',
            },
            {
              id: 'preview-phonetic',
              type: 'text',
              L1: entry.phonetic || '',
              L2: '',
            },
            {
              id: 'preview-def',
              type: 'text',
              L1: entry.meanings[0]?.definitions[0]?.definition || '',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Free Dictionary preview error:', error);
      throw error;
    }
  },
};

export default freeDictionaryAdapter;
