// src/components/editor/extensions/ArrowAnchor.ts
// PURPOSE: Custom Tiptap Mark that assigns a unique UUID to text spans for arrow connections
// ACTION: Enables the Syntax Arrow system to find word coordinates via permanent DOM IDs
// MECHANISM: Stores anchor ID as data attribute; arrows query these IDs for Bezier path calculation

import { Mark, mergeAttributes } from '@tiptap/core';

// ═══════════════════════════════════════════
// TYPE DECLARATIONS
// ═══════════════════════════════════════════

export interface ArrowAnchorOptions {
  HTMLAttributes: Record<string, unknown>;
}

// Extend Tiptap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    arrowAnchor: {
      /**
       * Set an arrow anchor mark on the current selection
       * @param id - Unique identifier for this anchor point
       */
      setArrowAnchor: (id: string) => ReturnType;
      /**
       * Remove arrow anchor mark from current selection
       */
      unsetArrowAnchor: () => ReturnType;
    };
  }
}

// ═══════════════════════════════════════════
// MARK EXTENSION
// ═══════════════════════════════════════════

export const ArrowAnchor = Mark.create<ArrowAnchorOptions>({
  name: 'arrowAnchor',

  // Default options
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  // The "inclusive" setting determines if typing at the edge extends the mark
  inclusive: false,

  // Allow this mark to span across other marks
  spanning: false,

  // Define attributes stored on the mark
  addAttributes() {
    return {
      // Unique identifier for the anchor (UUID)
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return {
            'id': attributes.id,
            'data-arrow-anchor': 'true',
            'data-syntax-id': attributes.id, // For SyntaxArrowLayer compatibility
          };
        },
      },
      // Visual styling for anchor highlights
      highlighted: {
        default: false,
        parseHTML: element => element.hasAttribute('data-anchor-highlighted'),
        renderHTML: attributes => {
          if (!attributes.highlighted) return {};
          return {
            'data-anchor-highlighted': 'true',
          };
        },
      },
    };
  },

  // How to parse HTML into this mark
  parseHTML() {
    return [
      {
        tag: 'span[data-arrow-anchor]',
      },
    ];
  },

  // How to render this mark to HTML
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'arrow-anchor cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors rounded-sm px-0.5',
        }
      ),
      0, // 0 means "render children here"
    ];
  },

  // Custom commands
  addCommands() {
    return {
      setArrowAnchor:
        (id: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { id });
        },

      unsetArrowAnchor:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default ArrowAnchor;
