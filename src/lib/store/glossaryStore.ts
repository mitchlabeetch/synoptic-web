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
      // LINTING OPERATIONS
      // ═══════════════════════════════════════════

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
