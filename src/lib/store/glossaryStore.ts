// src/lib/store/glossaryStore.ts
// PURPOSE: Global state management for Glossary Guard (Translation Memory)
// ACTION: Provides centralized storage and operations for term pairs
// MECHANISM: Zustand store with localStorage persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  TranslationMemoryEntry, 
  TermLintWarning, 
  GlossaryCategory,
  createTranslationEntry,
  findTermViolations 
} from '@/types/glossaryGuard';

// ═══════════════════════════════════════════
// CSV PARSING HELPER
// ═══════════════════════════════════════════

/**
 * Parse a single CSV line with proper quote handling.
 * Handles: quoted fields, escaped quotes (""), different delimiters.
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === delimiter) {
        // Field separator
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  // Don't forget the last field
  fields.push(current);
  
  return fields;
}

// ═══════════════════════════════════════════
// GLOSSARY STORE INTERFACE
// ═══════════════════════════════════════════

interface GlossaryState {
  // Data
  entries: TranslationMemoryEntry[];
  warnings: TermLintWarning[];
  
  // UI State
  isLintingEnabled: boolean;
  highlightWarnings: boolean;
  
  // Actions - CRUD
  addEntry: (sourceTerm: string, targetTerm: string, options?: Partial<TranslationMemoryEntry>) => TranslationMemoryEntry;
  updateEntry: (id: string, updates: Partial<TranslationMemoryEntry>) => void;
  deleteEntry: (id: string) => void;
  clearAllEntries: () => void;
  importEntriesFromCSV: (csvContent: string) => { imported: number; skipped: number; errors: string[] };
  
  // Actions - Linting
  lintContent: (content: string, blockId: string, pageId: string, language: 'L1' | 'L2') => TermLintWarning[];
  clearWarnings: () => void;
  dismissWarning: (warningId: string) => void;
  
  // Actions - Settings
  setLintingEnabled: (enabled: boolean) => void;
  setHighlightWarnings: (enabled: boolean) => void;
  
  // Utilities
  findEntry: (term: string, language: 'L1' | 'L2') => TranslationMemoryEntry | undefined;
  getEntriesByCategory: (category: GlossaryCategory) => TranslationMemoryEntry[];
  getEntryCount: () => number;
}

// ═══════════════════════════════════════════
// GLOSSARY STORE IMPLEMENTATION
// ═══════════════════════════════════════════

export const useGlossaryStore = create<GlossaryState>()(
  persist(
    immer((set, get) => ({
      // Initial State
      entries: [],
      warnings: [],
      isLintingEnabled: true,
      highlightWarnings: true,

      // ═══════════════════════════════════════════
      // CRUD OPERATIONS
      // ═══════════════════════════════════════════

      addEntry: (sourceTerm, targetTerm, options = {}) => {
        const newEntry = createTranslationEntry(sourceTerm, targetTerm, options);
        set((state) => {
          state.entries.push(newEntry);
        });
        return newEntry;
      },

      updateEntry: (id, updates) => {
        set((state) => {
          const index = state.entries.findIndex(e => e.id === id);
          if (index !== -1) {
            state.entries[index] = {
              ...state.entries[index],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      },

      deleteEntry: (id) => {
        set((state) => {
          state.entries = state.entries.filter(e => e.id !== id);
          // Also remove any warnings associated with this entry
          state.warnings = state.warnings.filter(w => w.entryId !== id);
        });
      },

      clearAllEntries: () => {
        set((state) => {
          state.entries = [];
          state.warnings = [];
        });
      },

      // ═══════════════════════════════════════════
      // CSV IMPORT
      // ═══════════════════════════════════════════

      importEntriesFromCSV: (csvContent: string) => {
        const result = { imported: 0, skipped: 0, errors: [] as string[] };
        const existingEntries = get().entries;
        const existingTerms = new Set(
          existingEntries.map(e => `${e.sourceTerm.toLowerCase()}|${e.targetTerm.toLowerCase()}`)
        );
        
        // Parse CSV content
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
        
        // Skip header if it looks like one (contains common header words)
        const headerPatterns = /^(source|target|term|word|l1|l2|original|translation|from|to)/i;
        let startIndex = 0;
        if (lines.length > 0 && headerPatterns.test(lines[0])) {
          startIndex = 1;
        }

        // Detect delimiter (comma, semicolon, or tab)
        const firstDataLine = lines[startIndex] || lines[0] || '';
        let delimiter = ',';
        if (firstDataLine.includes('\t')) delimiter = '\t';
        else if (firstDataLine.includes(';') && !firstDataLine.includes(',')) delimiter = ';';

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            // Parse CSV line with quote handling
            const fields = parseCSVLine(line, delimiter);
            
            if (fields.length < 2) {
              result.errors.push(`Line ${i + 1}: Expected at least 2 columns`);
              result.skipped++;
              continue;
            }

            const sourceTerm = fields[0].trim();
            const targetTerm = fields[1].trim();
            const category = (fields[2]?.trim() || 'custom') as GlossaryCategory;

            if (!sourceTerm || !targetTerm) {
              result.errors.push(`Line ${i + 1}: Empty source or target term`);
              result.skipped++;
              continue;
            }

            // Check for duplicates
            const termKey = `${sourceTerm.toLowerCase()}|${targetTerm.toLowerCase()}`;
            if (existingTerms.has(termKey)) {
              result.skipped++;
              continue;
            }

            // Add entry
            const newEntry = createTranslationEntry(sourceTerm, targetTerm, {
              category: ['names', 'places', 'technical', 'cultural', 'custom'].includes(category) 
                ? category 
                : 'custom'
            });
            
            set((state) => {
              state.entries.push(newEntry);
            });
            
            existingTerms.add(termKey);
            result.imported++;
            
          } catch (error) {
            result.errors.push(`Line ${i + 1}: Parse error`);
            result.skipped++;
          }
        }

        return result;
      },

      lintContent: (content, blockId, pageId, language) => {
        const { entries, isLintingEnabled } = get();
        
        if (!isLintingEnabled || entries.length === 0) {
          return [];
        }

        const newWarnings = findTermViolations(content, entries, blockId, pageId, language);
        
        set((state) => {
          // Remove old warnings for this block/language
          state.warnings = state.warnings.filter(
            w => !(w.blockId === blockId && w.language === language)
          );
          // Add new warnings
          state.warnings.push(...newWarnings);
        });

        return newWarnings;
      },

      clearWarnings: () => {
        set((state) => {
          state.warnings = [];
        });
      },

      dismissWarning: (warningId) => {
        set((state) => {
          state.warnings = state.warnings.filter(w => w.id !== warningId);
        });
      },

      // ═══════════════════════════════════════════
      // SETTINGS
      // ═══════════════════════════════════════════

      setLintingEnabled: (enabled) => {
        set((state) => {
          state.isLintingEnabled = enabled;
          if (!enabled) {
            state.warnings = [];
          }
        });
      },

      setHighlightWarnings: (enabled) => {
        set((state) => {
          state.highlightWarnings = enabled;
        });
      },

      // ═══════════════════════════════════════════
      // UTILITIES
      // ═══════════════════════════════════════════

      findEntry: (term, language) => {
        const { entries } = get();
        const normalizedTerm = term.toLowerCase();
        
        return entries.find(entry => {
          const compareTerm = language === 'L1' 
            ? entry.sourceTerm 
            : entry.targetTerm;
          
          if (entry.caseSensitive) {
            return compareTerm === term;
          }
          return compareTerm.toLowerCase() === normalizedTerm;
        });
      },

      getEntriesByCategory: (category) => {
        const { entries } = get();
        return entries.filter(e => e.category === category);
      },

      getEntryCount: () => {
        return get().entries.length;
      },
    })),
    {
      name: 'synoptic-glossary-guard',
      version: 1,
    }
  )
);

// ═══════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════

export const useGlossaryEntries = () => useGlossaryStore(state => state.entries);
export const useGlossaryWarnings = () => useGlossaryStore(state => state.warnings);
export const useGlossaryWarningsForBlock = (blockId: string) => 
  useGlossaryStore(state => state.warnings.filter(w => w.blockId === blockId));
