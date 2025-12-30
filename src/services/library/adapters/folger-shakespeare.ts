// src/services/library/adapters/folger-shakespeare.ts
// PURPOSE: Folger Shakespeare adapter (🟢 Commercial Safe)
// ACTION: Fetches Shakespeare plays with speaker annotations
// MECHANISM: REST API to folgerdigitaltexts.org

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

// Complete Shakespeare works from Folger
export const SHAKESPEARE_WORKS = [
  // Comedies
  { id: 'AWW', title: "All's Well That Ends Well", category: 'Comedy' },
  { id: 'Ant', title: 'Antony and Cleopatra', category: 'Tragedy' },
  { id: 'AYL', title: 'As You Like It', category: 'Comedy' },
  { id: 'Err', title: 'The Comedy of Errors', category: 'Comedy' },
  { id: 'Cor', title: 'Coriolanus', category: 'Tragedy' },
  { id: 'Cym', title: 'Cymbeline', category: 'Romance' },
  { id: 'Ham', title: 'Hamlet', category: 'Tragedy' },
  { id: '1H4', title: 'Henry IV, Part 1', category: 'History' },
  { id: '2H4', title: 'Henry IV, Part 2', category: 'History' },
  { id: 'H5', title: 'Henry V', category: 'History' },
  { id: '1H6', title: 'Henry VI, Part 1', category: 'History' },
  { id: '2H6', title: 'Henry VI, Part 2', category: 'History' },
  { id: '3H6', title: 'Henry VI, Part 3', category: 'History' },
  { id: 'H8', title: 'Henry VIII', category: 'History' },
  { id: 'JC', title: 'Julius Caesar', category: 'Tragedy' },
  { id: 'Jn', title: 'King John', category: 'History' },
  { id: 'Lr', title: 'King Lear', category: 'Tragedy' },
  { id: 'LLL', title: "Love's Labor's Lost", category: 'Comedy' },
  { id: 'Mac', title: 'Macbeth', category: 'Tragedy' },
  { id: 'MM', title: 'Measure for Measure', category: 'Comedy' },
  { id: 'MV', title: 'The Merchant of Venice', category: 'Comedy' },
  { id: 'Wiv', title: 'The Merry Wives of Windsor', category: 'Comedy' },
  { id: 'MND', title: "A Midsummer Night's Dream", category: 'Comedy' },
  { id: 'Ado', title: 'Much Ado About Nothing', category: 'Comedy' },
  { id: 'Oth', title: 'Othello', category: 'Tragedy' },
  { id: 'Per', title: 'Pericles', category: 'Romance' },
  { id: 'R2', title: 'Richard II', category: 'History' },
  { id: 'R3', title: 'Richard III', category: 'History' },
  { id: 'Rom', title: 'Romeo and Juliet', category: 'Tragedy' },
  { id: 'Shr', title: 'The Taming of the Shrew', category: 'Comedy' },
  { id: 'Tmp', title: 'The Tempest', category: 'Romance' },
  { id: 'Tim', title: 'Timon of Athens', category: 'Tragedy' },
  { id: 'Tit', title: 'Titus Andronicus', category: 'Tragedy' },
  { id: 'Tro', title: 'Troilus and Cressida', category: 'Tragedy' },
  { id: 'TN', title: 'Twelfth Night', category: 'Comedy' },
  { id: 'TGV', title: 'The Two Gentlemen of Verona', category: 'Comedy' },
  { id: 'TNK', title: 'The Two Noble Kinsmen', category: 'Romance' },
  { id: 'WT', title: "The Winter's Tale", category: 'Romance' },
];

// Folger API for fetching text
const API_BASE = 'https://www.folgerdigitaltexts.org';

export const folgerShakespeareAdapter: LibraryAdapter = {
  sourceId: 'gutendex-shakespeare',
  displayName: 'Folger Shakespeare',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    
    return SHAKESPEARE_WORKS
      .filter(work => 
        work.title.toLowerCase().includes(q) || 
        work.id.toLowerCase() === q ||
        work.category.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map(work => ({
        id: work.id,
        title: work.title,
        subtitle: work.category,
        meta: {
          category: work.category,
        },
      }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, startChapter = 1, endChapter = 1 } = config;
    
    // Find the work
    const workId = selectedId || searchQuery || 'Ham';
    const work = SHAKESPEARE_WORKS.find(w => 
      w.id.toLowerCase() === String(workId).toLowerCase() ||
      w.title.toLowerCase().includes(String(workId).toLowerCase())
    ) || SHAKESPEARE_WORKS[0];
    
    try {
      // Fetch text from Folger (TEI XML)
      const response = await fetch(`${API_BASE}/${work.id}/text`);
      
      // If Folger API doesn't work, use Gutenberg fallback
      if (!response.ok) {
        return createFallbackContent(work, startChapter, endChapter);
      }
      
      const xmlText = await response.text();
      
      // Parse the TEI XML
      const lines: IngestedLine[] = [];
      
      // Title
      lines.push({
        id: 'shakespeare-title',
        type: 'heading',
        L1: work.title,
        L2: '',
      });
      
      lines.push({
        id: 'shakespeare-category',
        type: 'text',
        L1: `🎭 ${work.category} by William Shakespeare`,
        L2: '',
      });
      
      lines.push({
        id: 'shakespeare-sep',
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Extract speech content (simplified parsing)
      // Look for <sp> tags with <speaker> and <l> elements
      const speechRegex = /<sp[^>]*>[\s\S]*?<speaker>([^<]+)<\/speaker>[\s\S]*?<\/sp>/g;
      const lineRegex = /<l[^>]*>([^<]+)<\/l>/g;
      
      let speechMatch;
      let speechCount = 0;
      const maxSpeeches = 50;
      
      while ((speechMatch = speechRegex.exec(xmlText)) !== null && speechCount < maxSpeeches) {
        const speechBlock = speechMatch[0];
        const speaker = speechMatch[1].trim();
        
        // Extract lines
        const speechLines: string[] = [];
        let lineMatch;
        while ((lineMatch = lineRegex.exec(speechBlock)) !== null) {
          speechLines.push(lineMatch[1].trim());
        }
        
        if (speechLines.length > 0) {
          // Speaker
          lines.push({
            id: `speech-${speechCount}-speaker`,
            type: 'text',
            L1: `**${speaker}**`,
            L2: '',
          });
          
          // Lines
          speechLines.forEach((line, idx) => {
            lines.push({
              id: `speech-${speechCount}-line-${idx}`,
              type: 'text',
              L1: line,
              L2: '',
            });
          });
          
          // Small separator
          lines.push({
            id: `speech-${speechCount}-sep`,
            type: 'separator',
            L1: '',
            L2: '',
          });
          
          speechCount++;
        }
      }
      
      // If parsing failed, add note
      if (speechCount === 0) {
        lines.push({
          id: 'no-content',
          type: 'text',
          L1: 'Content parsing in progress. Visit Folger Digital Texts for full play.',
          L2: '',
        });
      }
      
      const page: IngestedPage = {
        id: `page-${work.id}`,
        number: 1,
        title: work.title,
        lines,
      };
      
      return {
        title: work.title,
        description: `${work.category} by William Shakespeare`,
        sourceLang: 'en',
        layout: 'book',
        pages: [page],
        meta: {
          source: 'Folger Shakespeare Library',
          sourceUrl: `${API_BASE}/${work.id}`,
          author: 'William Shakespeare',
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
          },
        },
      };
    } catch (error) {
      console.error('Folger Shakespeare adapter error:', error);
      return createFallbackContent(work, startChapter, endChapter);
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    // Preview with famous Hamlet quote
    return {
      title: 'Hamlet',
      description: 'Tragedy by William Shakespeare',
      pages: [{
        id: 'preview',
        lines: [
          {
            id: 'preview-speaker',
            type: 'text',
            L1: '**HAMLET**',
            L2: '',
          },
          {
            id: 'preview-line1',
            type: 'text',
            L1: 'To be, or not to be, that is the question:',
            L2: '',
          },
          {
            id: 'preview-line2',
            type: 'text',
            L1: "Whether 'tis nobler in the mind to suffer",
            L2: '',
          },
          {
            id: 'preview-line3',
            type: 'text',
            L1: 'The slings and arrows of outrageous fortune,',
            L2: '',
          },
        ],
      }],
    };
  },
};

// Fallback content when API fails
function createFallbackContent(
  work: { id: string; title: string; category: string },
  startAct: number,
  endAct: number
): IngestedContent {
  const lines: IngestedLine[] = [
    {
      id: 'title',
      type: 'heading',
      L1: work.title,
      L2: '',
    },
    {
      id: 'category',
      type: 'text',
      L1: `🎭 ${work.category} by William Shakespeare`,
      L2: '',
    },
    {
      id: 'sep',
      type: 'separator',
      L1: '',
      L2: '',
    },
    {
      id: 'note',
      type: 'text',
      L1: `📖 Full text available at folger.edu`,
      L2: '',
    },
    {
      id: 'link',
      type: 'text',
      L1: `🔗 https://www.folgerdigitaltexts.org/${work.id}`,
      L2: '',
      meta: {
        sourceUrl: `https://www.folgerdigitaltexts.org/${work.id}`,
      },
    },
  ];
  
  return {
    title: work.title,
    description: `${work.category} by William Shakespeare`,
    sourceLang: 'en',
    layout: 'book',
    pages: [{
      id: `page-${work.id}`,
      number: 1,
      title: work.title,
      lines,
    }],
    meta: {
      source: 'Folger Shakespeare Library',
      sourceUrl: `https://www.folgerdigitaltexts.org/${work.id}`,
      author: 'William Shakespeare',
      publicDomain: true,
      fetchedAt: new Date().toISOString(),
      license: {
        type: 'commercial-safe',
        name: 'Public Domain',
      },
    },
  };
}

export default folgerShakespeareAdapter;
