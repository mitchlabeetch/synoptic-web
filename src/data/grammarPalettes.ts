// src/data/grammarPalettes.ts
// PURPOSE: Defines standard linguistic coloring palettes for pedagogical grammar visualization
// ACTION: Exports typed brush configurations with colors, labels, and keyboard shortcuts
// MECHANISM: Used by GrammarPainter and GrammarMark for consistent semantic highlighting

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type GrammarType = 
  | 'subject' 
  | 'verb' 
  | 'object' 
  | 'adjective' 
  | 'adverb' 
  | 'article'
  | 'complement'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'custom';

export interface Brush {
  id: GrammarType;
  label: string;
  color: string;       // Hex color
  shortcut: string;    // Keyboard shortcut (1-0)
  description?: string;
}

// ═══════════════════════════════════════════
// DEFAULT PALETTE (Pedagogical Colors)
// ═══════════════════════════════════════════

/**
 * EasyFrenchBro-inspired pedagogical color palette
 * Colors are chosen for:
 * - High contrast and readability
 * - Semantic distinctiveness
 * - Accessibility (colorblind-friendly when possible)
 */
export const DEFAULT_BRUSHES: Brush[] = [
  { 
    id: 'subject', 
    label: 'Subject', 
    color: '#93c5fd', // Blue-300
    shortcut: '1',
    description: 'The doer of the action'
  },
  { 
    id: 'verb', 
    label: 'Verb', 
    color: '#fca5a5', // Red-300
    shortcut: '2',
    description: 'The action or state'
  },
  { 
    id: 'object', 
    label: 'Object', 
    color: '#86efac', // Green-300
    shortcut: '3',
    description: 'The receiver of the action'
  },
  { 
    id: 'adjective', 
    label: 'Adjective', 
    color: '#fcd34d', // Amber-300
    shortcut: '4',
    description: 'Describes a noun'
  },
  { 
    id: 'adverb', 
    label: 'Adverb', 
    color: '#c4b5fd', // Violet-300
    shortcut: '5',
    description: 'Modifies a verb, adjective, or adverb'
  },
  { 
    id: 'article', 
    label: 'Article', 
    color: '#fdba74', // Orange-300
    shortcut: '6',
    description: 'The, a, an, le, la, un, une...'
  },
  { 
    id: 'complement', 
    label: 'Complement', 
    color: '#a5f3fc', // Cyan-300
    shortcut: '7',
    description: 'Completes the meaning'
  },
  { 
    id: 'pronoun', 
    label: 'Pronoun', 
    color: '#f9a8d4', // Pink-300
    shortcut: '8',
    description: 'Replaces a noun'
  },
  { 
    id: 'preposition', 
    label: 'Preposition', 
    color: '#d9f99d', // Lime-300
    shortcut: '9',
    description: 'Shows relationship (in, on, at, pour, avec...)'
  },
  { 
    id: 'conjunction', 
    label: 'Conjunction', 
    color: '#e5e7eb', // Gray-200
    shortcut: '0',
    description: 'Connects words or clauses (and, but, or...)'
  },
];

// ═══════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════

/**
 * Get a brush by its grammar type
 */
export function getBrushByType(type: GrammarType): Brush | undefined {
  return DEFAULT_BRUSHES.find(brush => brush.id === type);
}

/**
 * Get a brush by its keyboard shortcut
 */
export function getBrushByShortcut(shortcut: string): Brush | undefined {
  return DEFAULT_BRUSHES.find(brush => brush.shortcut === shortcut);
}

/**
 * Get CSS styles for a grammar type
 */
export function getGrammarStyles(type: GrammarType): React.CSSProperties {
  const brush = getBrushByType(type);
  if (!brush) return {};
  
  return {
    backgroundColor: brush.color,
    borderBottom: `2px solid ${brush.color}88`,
    padding: '0 2px',
    borderRadius: '2px',
  };
}

/**
 * Get all available grammar types
 */
export function getGrammarTypes(): GrammarType[] {
  return DEFAULT_BRUSHES.map(brush => brush.id);
}

export default DEFAULT_BRUSHES;
