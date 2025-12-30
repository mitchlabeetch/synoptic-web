// src/components/editor/extensions/GrammarMark.ts
// PURPOSE: Custom Tiptap Mark that wraps text in semantic grammar spans for pedagogical highlighting
// ACTION: Adds grammar type and color as data attributes for styling and future parsing
// MECHANISM: Extends Tiptap's Mark system to store type/color; exports to HTML/PDF correctly

import { Mark, mergeAttributes } from '@tiptap/core';

// ═══════════════════════════════════════════
// TYPE DECLARATIONS
// ═══════════════════════════════════════════

export interface GrammarMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

// Extend Tiptap's Commands interface to add our grammar commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    grammar: {
      /**
       * Set a grammar mark on the current selection
       * @param attributes - The grammar type and color
       */
      setGrammar: (attributes: { type: string; color: string }) => ReturnType;
      /**
       * Remove grammar mark from current selection
       */
      unsetGrammar: () => ReturnType;
      /**
       * Toggle grammar mark on current selection
       * @param attributes - The grammar type and color
       */
      toggleGrammar: (attributes: { type: string; color: string }) => ReturnType;
    };
  }
}

// ═══════════════════════════════════════════
// MARK EXTENSION
// ═══════════════════════════════════════════

export const GrammarMark = Mark.create<GrammarMarkOptions>({
  name: 'grammar',

  // Default options
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  // Define attributes stored on the mark
  addAttributes() {
    return {
      // Grammar type (subject, verb, object, etc.)
      type: {
        default: 'custom',
        parseHTML: element => element.getAttribute('data-grammar'),
        renderHTML: attributes => ({
          'data-grammar': attributes.type,
        }),
      },
      // Color for visual display
      color: {
        default: null,
        parseHTML: element => {
          // Try to parse from background-color first, then color
          const bg = element.style.backgroundColor;
          const color = element.style.color;
          return bg || color || null;
        },
        renderHTML: attributes => {
          if (!attributes.color) return {};
          
          // Apply color as background with subtle border-bottom for accessibility
          return {
            style: `
              background-color: ${attributes.color};
              border-bottom: 2px solid ${attributes.color}88;
              padding: 0 2px;
              border-radius: 2px;
            `.replace(/\s+/g, ' ').trim(),
          };
        },
      },
    };
  },

  // How to parse HTML into this mark
  parseHTML() {
    return [
      {
        tag: 'span[data-grammar]',
      },
    ];
  },

  // How to render this mark to HTML
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0, // 0 means "render children here"
    ];
  },

  // Custom commands
  addCommands() {
    return {
      setGrammar:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      
      unsetGrammar:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      
      toggleGrammar:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
    };
  },

  // Optional: Add input rules (e.g., typing patterns that trigger the mark)
  // For now, we keep it manual-only via the GrammarPainter UI
});

export default GrammarMark;
