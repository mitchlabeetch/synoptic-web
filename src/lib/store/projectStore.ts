// src/lib/store/projectStore.ts
// PURPOSE: Central state management for the bilingual book editor
// ACTION: Manages project content, settings, pages, blocks, annotations with optimized undo/redo
// MECHANISM: Uses Zustand with Immer for immutable updates and debounced history for performance

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enablePatches, produceWithPatches, applyPatches, Patch } from 'immer';
import {
  ContentBlock,
  PageData,
  WordGroup,
  ArrowConnector,
  AINote,
  ProjectContent,
  StylePreset,
} from '@/types/blocks';
import { isRTL } from '@/data/languages';

// Enable Immer patches for efficient undo/redo
enablePatches();

interface ProjectMeta {
  id: string;
  title: string;
  source_lang: string;
  target_lang: string;
}

interface ProjectSettings {
  theme: string;
  pageSize: string;
  pageWidth: number;
  pageHeight: number;
  fonts: {
    heading: string;
    body: string;
    annotation: string;
  };
  typography: {
    baseSize: number;
    headingSize: number;
    lineHeight: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  layout: 'side-by-side' | 'interlinear' | 'alternating';
  direction: 'ltr' | 'rtl' | 'auto';
}

// Patch-based history entry for efficient undo/redo
interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
  timestamp: number;
  description?: string;
}

interface ProjectState {
  // Meta
  meta: ProjectMeta | null;
  setProjectMeta: (meta: ProjectMeta) => void;

  // Content
  content: ProjectContent;
  setContent: (content: ProjectContent) => void;

  // Settings
  settings: ProjectSettings;
  setSettings: (settings: ProjectSettings) => void;
  updateSettings: (updates: Partial<ProjectSettings>) => void;

  // Page operations
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  addPage: (afterIndex?: number) => void;
  updatePage: (index: number, updates: Partial<PageData>) => void;
  deletePage: (index: number) => void;

  // Block operations
  addBlock: (pageIndex: number, block: ContentBlock) => void;
  updateBlock: (pageIndex: number, blockId: string, updates: Partial<ContentBlock>) => void;
  deleteBlock: (pageIndex: number, blockId: string) => void;
  reorderBlocks: (pageIndex: number, fromIndex: number, toIndex: number) => void;

  // Word Group operations
  addWordGroup: (group: WordGroup) => void;
  updateWordGroup: (groupId: string, updates: Partial<WordGroup>) => void;
  deleteWordGroup: (groupId: string) => void;

  // Arrow operations
  addArrow: (arrow: ArrowConnector) => void;
  updateArrow: (arrowId: string, updates: Partial<ArrowConnector>) => void;
  deleteArrow: (arrowId: string) => void;

  // Note operations
  addNote: (note: AINote) => void;
  updateNote: (noteId: string, updates: Partial<AINote>) => void;
  deleteNote: (noteId: string) => void;
  
  // Style Presets
  addPreset: (preset: StylePreset) => void;
  deletePreset: (presetId: string) => void;
  applyPreset: (pageIndex: number, blockId: string, presetId: string) => void;

  // Optimized Undo/Redo with patches
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushHistory: (description?: string) => void;
  
  // Internal: debounce timer for history
  _historyDebounceTimer: ReturnType<typeof setTimeout> | null;
  _pendingPatches: Patch[];
  _pendingInversePatches: Patch[];

  // Selection
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
}

const DEFAULT_CONTENT: ProjectContent = {
  pages: [{ id: 'page-1', number: 1, blocks: [], isBlankPage: false, avoidPageBreak: false }],
  wordGroups: [],
  arrows: [],
  notes: [],
  stamps: [],
  presets: [],
};

const DEFAULT_SETTINGS: ProjectSettings = {
  theme: 'classic',
  pageSize: '6x9',
  pageWidth: 152,
  pageHeight: 229,
  fonts: {
    heading: 'Crimson Pro',
    body: 'Crimson Pro',
    annotation: 'Inter',
  },
  typography: {
    baseSize: 12,
    headingSize: 24,
    lineHeight: 1.5,
  },
  colors: {
    primary: '#1a1a2e',
    secondary: '#4a4a68',
    accent: '#2563eb',
    background: '#ffffff',
  },
  layout: 'side-by-side',
  direction: 'auto',
};

// History configuration
const MAX_HISTORY_SIZE = 50;
const HISTORY_DEBOUNCE_MS = 500; // Debounce rapid changes

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // Initial state
    meta: null,
    content: DEFAULT_CONTENT,
    settings: DEFAULT_SETTINGS,
    currentPageIndex: 0,
    history: [],
    historyIndex: -1,
    canUndo: false,
    canRedo: false,
    selectedBlockId: null,
    _historyDebounceTimer: null,
    _pendingPatches: [],
    _pendingInversePatches: [],

    // Meta
    setProjectMeta: (meta) => set({ meta }),

    // Content
    setContent: (content) => set({ content }),

    // Settings
    setSettings: (settings) => set({ settings }),
    updateSettings: (updates) => set((state) => {
      state.settings = { ...state.settings, ...updates };
    }),

    // Page operations
    setCurrentPageIndex: (index) => set({ currentPageIndex: index }),

    addPage: (afterIndex) => set((state) => {
      const newPage: PageData = {
        id: `page-${Date.now()}`,
        number: state.content.pages.length + 1,
        blocks: [],
        isBlankPage: false,
        avoidPageBreak: false,
        showPageNumber: true,
        showHeader: true,
        showFooter: true,
      };
      
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : state.content.pages.length;
      state.content.pages.splice(insertAt, 0, newPage);
      
      // Update page numbers
      state.content.pages.forEach((p, i) => { p.number = i + 1; });
    }),

    updatePage: (index, updates) => set((state) => {
      const page = state.content.pages[index];
      if (page) {
        state.content.pages[index] = { ...page, ...updates };
      }
    }),

    deletePage: (index) => set((state) => {
      if (state.content.pages.length > 1) {
        state.content.pages.splice(index, 1);
        if (state.currentPageIndex >= state.content.pages.length) {
          state.currentPageIndex = state.content.pages.length - 1;
        }
        // Update page numbers
        state.content.pages.forEach((p, i) => { p.number = i + 1; });
      }
    }),

    // Block operations
    addBlock: (pageIndex, block) => set((state) => {
      state.content.pages[pageIndex].blocks.push(block);
    }),

    updateBlock: (pageIndex, blockId, updates) => set((state) => {
      const block = state.content.pages[pageIndex].blocks.find((b) => b.id === blockId);
      if (block) {
        Object.assign(block, updates);
      }
    }),

    deleteBlock: (pageIndex, blockId) => set((state) => {
      const blocks = state.content.pages[pageIndex].blocks;
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index !== -1) {
        blocks.splice(index, 1);
      }
    }),

    reorderBlocks: (pageIndex, fromIndex, toIndex) => set((state) => {
      const blocks = state.content.pages[pageIndex].blocks;
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
    }),

    // Word Group operations
    addWordGroup: (group) => set((state) => {
      state.content.wordGroups.push(group);
    }),

    updateWordGroup: (groupId, updates) => set((state) => {
      const group = state.content.wordGroups.find((g) => g.id === groupId);
      if (group) Object.assign(group, updates);
    }),

    deleteWordGroup: (groupId) => set((state) => {
      const index = state.content.wordGroups.findIndex((g) => g.id === groupId);
      if (index !== -1) state.content.wordGroups.splice(index, 1);
    }),

    // Arrow operations
    addArrow: (arrow) => set((state) => {
      state.content.arrows.push(arrow);
    }),

    updateArrow: (arrowId, updates) => set((state) => {
      const arrow = state.content.arrows.find((a) => a.id === arrowId);
      if (arrow) Object.assign(arrow, updates);
    }),

    deleteArrow: (arrowId) => set((state) => {
      state.content.arrows = state.content.arrows.filter(a => a.id !== arrowId);
    }),

    addNote: (note) => set((state) => {
      state.content.notes.push(note);
    }),

    updateNote: (noteId, updates) => set((state) => {
      const note = state.content.notes.find(n => n.id === noteId);
      if (note) Object.assign(note, updates);
    }),

    deleteNote: (noteId) => set((state) => {
      state.content.notes = state.content.notes.filter(n => n.id !== noteId);
    }),

    addPreset: (preset) => set((state) => {
      if (!state.content.presets) state.content.presets = [];
      state.content.presets.push(preset);
    }),

    deletePreset: (presetId) => set((state) => {
      if (state.content.presets) {
        state.content.presets = state.content.presets.filter(p => p.id !== presetId);
      }
    }),

    applyPreset: (pageIndex, blockId, presetId) => set((state) => {
      const preset = state.content.presets?.find(p => p.id === presetId);
      const page = state.content.pages[pageIndex];
      const block = page?.blocks.find(b => b.id === blockId);
      
      if (preset && block) {
        Object.assign(block, { ...preset.settings });
      }
    }),

    // Optimized Undo/Redo with debouncing
    pushHistory: (description) => {
      const state = get();
      
      // Clear existing debounce timer
      if (state._historyDebounceTimer) {
        clearTimeout(state._historyDebounceTimer);
      }

      // Create a snapshot using patches
      const currentContent = state.content;
      const previousContent = state.history.length > 0 && state.historyIndex >= 0
        ? applyPatches(currentContent, state.history[state.historyIndex].inversePatches)
        : DEFAULT_CONTENT;

      // Generate patches between previous and current state
      const [, patches, inversePatches] = produceWithPatches(previousContent, (draft) => {
        Object.assign(draft, currentContent);
      });

      // Only push if there are actual changes
      if (patches.length === 0) return;

      const timer = setTimeout(() => {
        set((state) => {
          // Trim future history if we're not at the end
          state.history = state.history.slice(0, state.historyIndex + 1);
          
          // Add new entry
          state.history.push({
            patches,
            inversePatches,
            timestamp: Date.now(),
            description,
          });
          
          state.historyIndex = state.history.length - 1;
          
          // Limit history size
          if (state.history.length > MAX_HISTORY_SIZE) {
            state.history.shift();
            state.historyIndex--;
          }
          
          state.canUndo = state.historyIndex >= 0;
          state.canRedo = state.historyIndex < state.history.length - 1;
          state._historyDebounceTimer = null;
        });
      }, HISTORY_DEBOUNCE_MS);

      set({ _historyDebounceTimer: timer });
    },

    undo: () => set((state) => {
      if (state.historyIndex < 0 || state.history.length === 0) return;
      
      const entry = state.history[state.historyIndex];
      if (entry) {
        // Apply inverse patches to restore previous state
        state.content = applyPatches(state.content, entry.inversePatches);
        state.historyIndex--;
        state.canUndo = state.historyIndex >= 0;
        state.canRedo = true;
      }
    }),

    redo: () => set((state) => {
      if (state.historyIndex >= state.history.length - 1) return;
      
      state.historyIndex++;
      const entry = state.history[state.historyIndex];
      if (entry) {
        // Apply patches to restore next state
        state.content = applyPatches(state.content, entry.patches);
        state.canUndo = true;
        state.canRedo = state.historyIndex < state.history.length - 1;
      }
    }),

    // Selection
    setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  }))
);

// Helpers
export const getEffectiveDirection = (state: ProjectState) => {
  if (state.settings.direction !== 'auto') return state.settings.direction;
  const sourceLang = state.meta?.source_lang;
  if (!sourceLang) return 'ltr';
  return isRTL(sourceLang) ? 'rtl' : 'ltr';
};
