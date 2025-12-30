// src/services/library/adapters/standard-ebooks.ts
// PURPOSE: Standard Ebooks adapter (🟢 Commercial Safe - CC0)
// ACTION: Fetches beautifully formatted public domain texts
// MECHANISM: OPDS feed from standardebooks.org

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://standardebooks.org';

interface StandardEbookEntry {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  epubUrl: string;
  wordCount?: number;
  subjects: string[];
}

// Curated list of notable Standard Ebooks (since API is limited)
const FEATURED_BOOKS: StandardEbookEntry[] = [
  {
    id: 'jane-austen_pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description: 'The beloved story of Elizabeth Bennet and Mr. Darcy.',
    coverUrl: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice/downloads/jane-austen_pride-and-prejudice.epub',
    wordCount: 122000,
    subjects: ['Romance', 'Social Class', 'Classic'],
  },
  {
    id: 'charles-dickens_a-tale-of-two-cities',
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    description: 'A historical novel set during the French Revolution.',
    coverUrl: 'https://standardebooks.org/ebooks/charles-dickens/a-tale-of-two-cities/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/charles-dickens/a-tale-of-two-cities/downloads/charles-dickens_a-tale-of-two-cities.epub',
    wordCount: 135000,
    subjects: ['Historical', 'Revolution', 'Classic'],
  },
  {
    id: 'fyodor-dostoevsky_crime-and-punishment_constance-garnett',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    description: 'A psychological drama about guilt and redemption.',
    coverUrl: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/crime-and-punishment/constance-garnett/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/crime-and-punishment/constance-garnett/downloads/fyodor-dostoevsky_crime-and-punishment_constance-garnett.epub',
    wordCount: 211000,
    subjects: ['Psychological', 'Russian', 'Classic'],
  },
  {
    id: 'oscar-wilde_the-picture-of-dorian-gray',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    description: 'A Gothic tale of beauty, corruption, and the soul.',
    coverUrl: 'https://standardebooks.org/ebooks/oscar-wilde/the-picture-of-dorian-gray/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/oscar-wilde/the-picture-of-dorian-gray/downloads/oscar-wilde_the-picture-of-dorian-gray.epub',
    wordCount: 78000,
    subjects: ['Gothic', 'Philosophy', 'Classic'],
  },
  {
    id: 'mary-shelley_frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    description: 'The original science fiction novel about creation and its consequences.',
    coverUrl: 'https://standardebooks.org/ebooks/mary-shelley/frankenstein/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/mary-shelley/frankenstein/downloads/mary-shelley_frankenstein.epub',
    wordCount: 75000,
    subjects: ['Science Fiction', 'Gothic', 'Classic'],
  },
  {
    id: 'franz-kafka_the-metamorphosis_david-wyllie',
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    description: 'Gregor Samsa wakes to find himself transformed into a giant insect.',
    coverUrl: 'https://standardebooks.org/ebooks/franz-kafka/the-metamorphosis/david-wyllie/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/franz-kafka/the-metamorphosis/david-wyllie/downloads/franz-kafka_the-metamorphosis_david-wyllie.epub',
    wordCount: 22000,
    subjects: ['Absurdist', 'German', 'Novella'],
  },
  {
    id: 'homer_the-odyssey_william-cullen-bryant',
    title: 'The Odyssey',
    author: 'Homer',
    description: 'The epic journey of Odysseus returning home from the Trojan War.',
    coverUrl: 'https://standardebooks.org/ebooks/homer/the-odyssey/william-cullen-bryant/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/homer/the-odyssey/william-cullen-bryant/downloads/homer_the-odyssey_william-cullen-bryant.epub',
    wordCount: 121000,
    subjects: ['Epic', 'Greek', 'Mythology'],
  },
  {
    id: 'lewis-carroll_alices-adventures-in-wonderland',
    title: 'Alice\'s Adventures in Wonderland',
    author: 'Lewis Carroll',
    description: 'Alice falls down a rabbit hole into a fantastical world.',
    coverUrl: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/downloads/lewis-carroll_alices-adventures-in-wonderland.epub',
    wordCount: 26000,
    subjects: ['Fantasy', 'Children', 'Classic'],
  },
  {
    id: 'sun-tzu_the-art-of-war_lionel-giles',
    title: 'The Art of War',
    author: 'Sun Tzu',
    description: 'The ancient Chinese military treatise.',
    coverUrl: 'https://standardebooks.org/ebooks/sun-tzu/the-art-of-war/lionel-giles/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/sun-tzu/the-art-of-war/lionel-giles/downloads/sun-tzu_the-art-of-war_lionel-giles.epub',
    wordCount: 13000,
    subjects: ['Philosophy', 'Strategy', 'Chinese'],
  },
  {
    id: 'marcus-aurelius_meditations_george-long',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    description: 'Personal writings of the Roman Emperor on Stoic philosophy.',
    coverUrl: 'https://standardebooks.org/ebooks/marcus-aurelius/meditations/george-long/downloads/cover.jpg',
    epubUrl: 'https://standardebooks.org/ebooks/marcus-aurelius/meditations/george-long/downloads/marcus-aurelius_meditations_george-long.epub',
    wordCount: 41000,
    subjects: ['Philosophy', 'Stoicism', 'Roman'],
  },
];

export const standardEbooksAdapter: LibraryAdapter = {
  sourceId: 'standardebooks',
  displayName: 'Standard Ebooks',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    
    return FEATURED_BOOKS
      .filter(book => 
        book.title.toLowerCase().includes(q) || 
        book.author.toLowerCase().includes(q) ||
        book.subjects.some(s => s.toLowerCase().includes(q))
      )
      .slice(0, limit)
      .map(book => ({
        id: book.id,
        title: book.title,
        subtitle: book.author,
        thumbnail: book.coverUrl,
        meta: {
          wordCount: book.wordCount,
          subjects: book.subjects,
        },
      }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, randomCount = 1 } = config;
    
    try {
      let books: StandardEbookEntry[] = [];
      
      if (selectedId) {
        const book = FEATURED_BOOKS.find(b => b.id === selectedId);
        if (book) books = [book];
      } else {
        // Random selection
        const shuffled = [...FEATURED_BOOKS].sort(() => Math.random() - 0.5);
        books = shuffled.slice(0, randomCount);
      }
      
      if (!books.length) {
        throw new Error('No books found');
      }
      
      // Build pages
      const pages: IngestedPage[] = books.map((book, idx) => {
        const lines: IngestedLine[] = [];
        
        // Cover
        lines.push({
          id: `book-${book.id}-cover`,
          type: 'image',
          L1: book.coverUrl,
          L2: '',
          meta: {
            imageUrl: book.coverUrl,
          },
        });
        
        // Title
        lines.push({
          id: `book-${book.id}-title`,
          type: 'heading',
          L1: book.title,
          L2: '',
        });
        
        // Author
        lines.push({
          id: `book-${book.id}-author`,
          type: 'text',
          L1: `by ${book.author}`,
          L2: '',
        });
        
        // Separator
        lines.push({
          id: `book-${book.id}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Description
        lines.push({
          id: `book-${book.id}-desc`,
          type: 'text',
          L1: book.description,
          L2: '',
        });
        
        // Word count
        if (book.wordCount) {
          lines.push({
            id: `book-${book.id}-words`,
            type: 'text',
            L1: `📚 ${book.wordCount.toLocaleString()} words`,
            L2: '',
          });
        }
        
        // Subjects
        lines.push({
          id: `book-${book.id}-subjects`,
          type: 'text',
          L1: `🏷️ ${book.subjects.join(', ')}`,
          L2: '',
        });
        
        // Download link
        lines.push({
          id: `book-${book.id}-link`,
          type: 'text',
          L1: `📖 standardebooks.org/ebooks/${book.id}`,
          L2: '',
          meta: {
            sourceUrl: `https://standardebooks.org/ebooks/${book.id}`,
          },
        });
        
        // Note about quality
        lines.push({
          id: `book-${book.id}-note`,
          type: 'text',
          L1: '✨ Professionally typeset with modern typography standards',
          L2: '',
        });
        
        return {
          id: `page-${book.id}`,
          number: idx + 1,
          title: book.title,
          lines,
        };
      });
      
      const firstBook = books[0];
      
      return {
        title: books.length === 1 
          ? firstBook.title 
          : `Standard Ebooks Collection (${books.length} books)`,
        description: books.length === 1 
          ? `by ${firstBook.author}`
          : 'Professionally formatted public domain classics',
        sourceLang: 'en',
        layout: 'book',
        pages,
        meta: {
          source: 'Standard Ebooks',
          sourceUrl: 'https://standardebooks.org',
          coverImageUrl: firstBook.coverUrl,
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain (CC0)',
            url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          },
        },
      };
    } catch (error) {
      console.error('Standard Ebooks adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    // Random preview from featured books
    const book = FEATURED_BOOKS[Math.floor(Math.random() * FEATURED_BOOKS.length)];
    
    return {
      title: book.title,
      description: book.author,
      pages: [{
        id: 'preview',
        lines: [
          {
            id: 'preview-cover',
            type: 'image',
            L1: book.coverUrl,
            L2: '',
          },
          {
            id: 'preview-title',
            type: 'heading',
            L1: book.title,
            L2: '',
          },
          {
            id: 'preview-author',
            type: 'text',
            L1: `by ${book.author}`,
            L2: '',
          },
        ],
      }],
    };
  },
};

export default standardEbooksAdapter;
