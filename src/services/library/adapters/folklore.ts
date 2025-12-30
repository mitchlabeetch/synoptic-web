// src/services/library/adapters/folklore.ts
// PURPOSE: Folklore adapter for myths and fairy tales (🟢 Commercial Safe)
// ACTION: Provides curated folklore stories from public domain sources
// MECHANISM: Static data + Gutenberg fallback

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

// Curated folklore collection
export const FOLKLORE_STORIES = [
  // Grimm's Fairy Tales
  {
    id: 'grimm-cinderella',
    title: 'Cinderella',
    origin: 'German',
    collection: "Grimm's Fairy Tales",
    opening: 'The wife of a rich man fell ill, and when she felt that her end drew nigh, she called her only daughter to her bedside...',
    moral: 'Kindness and virtue are rewarded, while cruelty is punished.',
    gutenbergId: 2591,
  },
  {
    id: 'grimm-snow-white',
    title: 'Snow White',
    origin: 'German',
    collection: "Grimm's Fairy Tales",
    opening: 'Once upon a time in the middle of winter, when the flakes of snow were falling like feathers from the sky...',
    moral: 'True beauty comes from within.',
    gutenbergId: 2591,
  },
  {
    id: 'grimm-rapunzel',
    title: 'Rapunzel',
    origin: 'German',
    collection: "Grimm's Fairy Tales",
    opening: 'There were once a man and a woman who had long in vain wished for a child...',
    moral: 'Love conquers all obstacles.',
    gutenbergId: 2591,
  },
  {
    id: 'grimm-hansel-gretel',
    title: 'Hansel and Gretel',
    origin: 'German',
    collection: "Grimm's Fairy Tales",
    opening: 'Hard by a great forest dwelt a poor wood-cutter with his wife and his two children...',
    moral: 'Cleverness and bravery can overcome danger.',
    gutenbergId: 2591,
  },
  {
    id: 'grimm-rumpelstiltskin',
    title: 'Rumpelstiltskin',
    origin: 'German',
    collection: "Grimm's Fairy Tales",
    opening: "Once upon a time there was a miller who was poor, but who had a beautiful daughter...",
    moral: 'Be careful what you promise.',
    gutenbergId: 2591,
  },
  // Aesop's Fables
  {
    id: 'aesop-tortoise-hare',
    title: 'The Tortoise and the Hare',
    origin: 'Greek',
    collection: "Aesop's Fables",
    opening: 'A Hare was making fun of the Tortoise one day for being so slow...',
    moral: 'Slow and steady wins the race.',
    gutenbergId: 21,
  },
  {
    id: 'aesop-fox-grapes',
    title: 'The Fox and the Grapes',
    origin: 'Greek',
    collection: "Aesop's Fables",
    opening: 'A Fox one day spied a beautiful bunch of ripe grapes hanging from a vine trained along the branches of a tree...',
    moral: 'It is easy to despise what you cannot get.',
    gutenbergId: 21,
  },
  {
    id: 'aesop-lion-mouse',
    title: 'The Lion and the Mouse',
    origin: 'Greek',
    collection: "Aesop's Fables",
    opening: 'A Lion was awakened from sleep by a Mouse running over his face...',
    moral: 'No act of kindness is ever wasted.',
    gutenbergId: 21,
  },
  {
    id: 'aesop-ant-grasshopper',
    title: 'The Ant and the Grasshopper',
    origin: 'Greek',
    collection: "Aesop's Fables",
    opening: 'In a field one summer day a Grasshopper was hopping about, chirping and singing to its hearts content...',
    moral: 'It is best to prepare for the days of necessity.',
    gutenbergId: 21,
  },
  // Norse Mythology
  {
    id: 'norse-creation',
    title: 'The Creation of the World',
    origin: 'Norse',
    collection: 'Norse Mythology',
    opening: 'In the beginning there was nothing but Ginnungagap, the great void. To the north lay Niflheim, the realm of ice, and to the south Muspelheim, the realm of fire...',
    moral: 'From chaos comes order.',
    gutenbergId: 13512,
  },
  {
    id: 'norse-thor-mjolnir',
    title: 'Thor and the Stolen Hammer',
    origin: 'Norse',
    collection: 'Norse Mythology',
    opening: 'One morning Thor awoke to find Mjölnir, his mighty hammer, missing from its place...',
    moral: 'Cunning can triumph where strength cannot.',
    gutenbergId: 13512,
  },
  // Arabian Nights
  {
    id: 'arabian-aladdin',
    title: 'Aladdin and the Magic Lamp',
    origin: 'Arabian',
    collection: 'One Thousand and One Nights',
    opening: 'In one of the large and rich cities of China, there lived a tailor named Mustapha...',
    moral: 'Fortune favors the brave and clever.',
    gutenbergId: 128,
  },
  {
    id: 'arabian-ali-baba',
    title: 'Ali Baba and the Forty Thieves',
    origin: 'Arabian',
    collection: 'One Thousand and One Nights',
    opening: 'In a town in Persia there dwelt two brothers, one named Cassim, the other Ali Baba...',
    moral: 'Greed leads to destruction.',
    gutenbergId: 128,
  },
];

export const folkloreAdapter: LibraryAdapter = {
  sourceId: 'static-folklore',
  displayName: 'Myths & Legends',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    
    return FOLKLORE_STORIES
      .filter(story => 
        story.title.toLowerCase().includes(q) ||
        story.origin.toLowerCase().includes(q) ||
        story.collection.toLowerCase().includes(q)
      )
      .slice(0, limit)
      .map(story => ({
        id: story.id,
        title: story.title,
        subtitle: `${story.origin} - ${story.collection}`,
        meta: {
          origin: story.origin,
          collection: story.collection,
        },
      }));
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 5 } = config;
    
    let stories: typeof FOLKLORE_STORIES = [];
    
    if (selectedId) {
      const story = FOLKLORE_STORIES.find(s => s.id === selectedId);
      if (story) stories = [story];
    } else if (searchQuery) {
      const q = searchQuery.toLowerCase();
      stories = FOLKLORE_STORIES.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.collection.toLowerCase().includes(q)
      ).slice(0, randomCount);
    } else {
      // Random stories
      const shuffled = [...FOLKLORE_STORIES].sort(() => Math.random() - 0.5);
      stories = shuffled.slice(0, randomCount);
    }
    
    if (!stories.length) {
      stories = FOLKLORE_STORIES.slice(0, randomCount);
    }
    
    // Build pages
    const pages: IngestedPage[] = stories.map((story, idx) => {
      const lines: IngestedLine[] = [];
      
      // Title
      lines.push({
        id: `story-${story.id}-title`,
        type: 'heading',
        L1: story.title,
        L2: '',
      });
      
      // Origin and collection
      lines.push({
        id: `story-${story.id}-origin`,
        type: 'text',
        L1: `📍 ${story.origin} | 📚 ${story.collection}`,
        L2: '',
      });
      
      // Separator
      lines.push({
        id: `story-${story.id}-sep1`,
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Opening
      lines.push({
        id: `story-${story.id}-opening`,
        type: 'text',
        L1: story.opening,
        L2: '',
      });
      
      // Separator
      lines.push({
        id: `story-${story.id}-sep2`,
        type: 'separator',
        L1: '',
        L2: '',
      });
      
      // Moral
      lines.push({
        id: `story-${story.id}-moral`,
        type: 'text',
        L1: `💡 Moral: ${story.moral}`,
        L2: '',
      });
      
      // Source link
      lines.push({
        id: `story-${story.id}-link`,
        type: 'text',
        L1: `🔗 Full text: gutenberg.org/ebooks/${story.gutenbergId}`,
        L2: '',
        meta: {
          sourceUrl: `https://www.gutenberg.org/ebooks/${story.gutenbergId}`,
        },
      });
      
      return {
        id: `page-${story.id}`,
        number: idx + 1,
        title: story.title,
        lines,
      };
    });
    
    const firstStory = stories[0];
    
    return {
      title: stories.length === 1 
        ? firstStory.title 
        : `Folklore Collection (${stories.length} stories)`,
      description: stories.length === 1 
        ? `${firstStory.origin} - ${firstStory.collection}`
        : 'Myths and fairy tales from around the world',
      sourceLang: 'en',
      layout: 'book',
      pages,
      meta: {
        source: 'Project Gutenberg (Folklore)',
        sourceUrl: 'https://www.gutenberg.org',
        publicDomain: true,
        fetchedAt: new Date().toISOString(),
        license: {
          type: 'commercial-safe',
          name: 'Public Domain',
        },
      },
    };
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const randomStory = FOLKLORE_STORIES[Math.floor(Math.random() * FOLKLORE_STORIES.length)];
    
    return {
      title: randomStory.title,
      description: `${randomStory.origin} - ${randomStory.collection}`,
      pages: [{
        id: 'preview',
        lines: [
          {
            id: 'preview-title',
            type: 'heading',
            L1: randomStory.title,
            L2: '',
          },
          {
            id: 'preview-opening',
            type: 'text',
            L1: randomStory.opening.slice(0, 100) + '...',
            L2: '',
          },
          {
            id: 'preview-moral',
            type: 'text',
            L1: `💡 ${randomStory.moral}`,
            L2: '',
          },
        ],
      }],
    };
  },
};

export default folkloreAdapter;
