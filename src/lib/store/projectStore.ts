// src/lib/store/projectStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  ContentBlock,
  PageData,
  WordGroup,
  ArrowConnector,
  ProjectContent,
} from '@/types/blocks';

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
  deletePage: (index: number) => void;

  // Block operations
  addBlock: (pageIndex: number, block: ContentBlock) => void;
  updateBlock: (
    pageIndex: number,
    blockId: string,
    updates: Partial<ContentBlock>
  ) => void;
  deleteBlock: (pageIndex: number, blockId: string) => void;
  reorderBlocks: (
    pageIndex: number,
    fromIndex: number,
    toIndex: number
  ) => void;

  // Word Group operations
  addWordGroup: (group: WordGroup) => void;
  updateWordGroup: (groupId: string, updates: Partial<WordGroup>) => void;
  deleteWordGroup: (groupId: string) => void;

  // Arrow operations
  addArrow: (arrow: ArrowConnector) => void;
  updateArrow: (arrowId: string, updates: Partial<ArrowConnector>) => void;
  deleteArrow: (arrowId: string) => void;

  // Undo/Redo
  history: ProjectContent[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Selection
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
}

const DEFAULT_CONTENT: ProjectContent = {
  pages: [{ id: 'page-1', number: 1, blocks: [], isBlankPage: false, avoidPageBreak: false }],
  wordGroups: [],
  arrows: [],
  stamps: [],
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
};

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // Initial state
    meta: null,
    content: DEFAULT_CONTENT,
    settings: DEFAULT_SETTINGS,
    currentPageIndex: 0,
    history: [],
    historyIndex: -1,
    selectedBlockId: null,

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

    addPage: (afterIndex) =>
      set((state) => {
        const nextNumber = state.content.pages.length + 1;
        const newPage: PageData = {
          id: `page-${Date.now()}`,
          number: nextNumber,
          blocks: [],
          isBlankPage: false,
          avoidPageBreak: false,
        };
        const insertIndex =
          afterIndex !== undefined
            ? afterIndex + 1
            : state.content.pages.length;
        state.content.pages.splice(insertIndex, 0, newPage);
        state.currentPageIndex = insertIndex;
      }),

    deletePage: (index) =>
      set((state) => {
        if (state.content.pages.length > 1) {
          state.content.pages.splice(index, 1);
          if (state.currentPageIndex >= state.content.pages.length) {
            state.currentPageIndex = state.content.pages.length - 1;
          }
        }
      }),

    // Block operations
    addBlock: (pageIndex, block) =>
      set((state) => {
        state.content.pages[pageIndex].blocks.push(block);
      }),

    updateBlock: (pageIndex, blockId, updates) =>
      set((state) => {
        const block = state.content.pages[pageIndex].blocks.find(
          (b) => b.id === blockId
        );
        if (block) Object.assign(block, updates);
      }),

    deleteBlock: (pageIndex, blockId) =>
      set((state) => {
        const blocks = state.content.pages[pageIndex].blocks;
        const index = blocks.findIndex((b) => b.id === blockId);
        if (index !== -1) blocks.splice(index, 1);
      }),

    reorderBlocks: (pageIndex, fromIndex, toIndex) =>
      set((state) => {
        const blocks = state.content.pages[pageIndex].blocks;
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
      }),

    // Word Group operations
    addWordGroup: (group) =>
      set((state) => {
        state.content.wordGroups.push(group);
      }),

    updateWordGroup: (groupId, updates) =>
      set((state) => {
        const group = state.content.wordGroups.find((g) => g.id === groupId);
        if (group) Object.assign(group, updates);
      }),

    deleteWordGroup: (groupId) =>
      set((state) => {
        const index = state.content.wordGroups.findIndex(
          (g) => g.id === groupId
        );
        if (index !== -1) state.content.wordGroups.splice(index, 1);
      }),

    // Arrow operations
    addArrow: (arrow) =>
      set((state) => {
        state.content.arrows.push(arrow);
      }),

    updateArrow: (arrowId, updates) =>
      set((state) => {
        const arrow = state.content.arrows.find((a) => a.id === arrowId);
        if (arrow) Object.assign(arrow, updates);
      }),

    deleteArrow: (arrowId) =>
      set((state) => {
        const index = state.content.arrows.findIndex((a) => a.id === arrowId);
        if (index !== -1) state.content.arrows.splice(index, 1);
      }),

    // Undo/Redo
    pushHistory: () =>
      set((state) => {
        // Trim future history if we're not at the end
        state.history = state.history.slice(0, state.historyIndex + 1);
        // Add current state to history
        state.history.push(JSON.parse(JSON.stringify(state.content)));
        state.historyIndex = state.history.length - 1;
        // Limit history size
        if (state.history.length > 50) {
          state.history.shift();
          state.historyIndex--;
        }
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.content = JSON.parse(
            JSON.stringify(state.history[state.historyIndex])
          );
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.content = JSON.parse(
            JSON.stringify(state.history[state.historyIndex])
          );
        }
      }),

    // Selection
    setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  }))
);
