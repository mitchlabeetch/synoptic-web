// src/services/library/adapters/rijksmuseum.ts
// PURPOSE: Rijksmuseum adapter (🟢 Commercial Safe - CC0)
// ACTION: Fetches Dutch masters and world art with high-res images
// MECHANISM: REST API to rijksmuseum.nl

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

// The Rijksmuseum API requires a key, but has a public demo key
const API_KEY = process.env.RIJKSMUSEUM_API_KEY || '0fiuZFh4';
const API_BASE = 'https://www.rijksmuseum.nl/api/en/collection';

interface RijksArtwork {
  objectNumber: string;
  id: string;
  title: string;
  titles: string[];
  principalOrFirstMaker: string;
  hasImage: boolean;
  showImage: boolean;
  permitDownload: boolean;
  webImage?: {
    guid: string;
    offsetPercentageX: number;
    offsetPercentageY: number;
    width: number;
    height: number;
    url: string;
  };
  headerImage?: {
    guid: string;
    offsetPercentageX: number;
    offsetPercentageY: number;
    width: number;
    height: number;
    url: string;
  };
  longTitle: string;
  subTitle: string;
  scLabelLine: string;
  label?: {
    title: string;
    makerLine: string;
    description: string;
    notes: string;
    date: string;
  };
  productionPlaces: string[];
  dating?: {
    presentingDate: string;
    sortingDate: number;
    period: number;
  };
  links: {
    self: string;
    web: string;
  };
}

interface RijksDetailedArtwork extends RijksArtwork {
  description: string;
  plaqueDescriptionEnglish: string;
  plaqueDescriptionDutch: string;
  physicalMedium: string;
  dimensions: { unit: string; type: string; value: string }[];
  materials: string[];
  techniques: string[];
  objectTypes: string[];
}

interface SearchResponse {
  count: number;
  artObjects: RijksArtwork[];
}

interface DetailResponse {
  artObject: RijksDetailedArtwork;
}

export const rijksmuseumAdapter: LibraryAdapter = {
  sourceId: 'rijksmuseum',
  displayName: 'Rijksmuseum',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({
        key: API_KEY,
        q: query,
        ps: limit.toString(),
        imgonly: 'true',
      });
      
      const response = await fetch(`${API_BASE}?${params}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResponse = await response.json();
      
      return data.artObjects
        .filter(art => art.hasImage && art.webImage)
        .map(art => ({
          id: art.objectNumber,
          title: art.title,
          subtitle: art.principalOrFirstMaker,
          thumbnail: art.webImage?.url.replace('=s0', '=s200'),
          meta: {
            date: art.dating?.presentingDate,
          },
        }));
    } catch (error) {
      console.error('Rijksmuseum search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 5 } = config;
    
    try {
      let artworks: RijksDetailedArtwork[] = [];
      
      if (selectedId) {
        // Fetch specific artwork
        const response = await fetch(`${API_BASE}/${selectedId}?key=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch artwork');
        const data: DetailResponse = await response.json();
        artworks = [data.artObject];
      } else {
        // Search or random
        const params = new URLSearchParams({
          key: API_KEY,
          ps: randomCount.toString(),
          imgonly: 'true',
          toppieces: 'true', // Only masterpieces
        });
        
        if (searchQuery) {
          params.set('q', searchQuery);
        }
        
        const response = await fetch(`${API_BASE}?${params}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data: SearchResponse = await response.json();
        
        // Get full details for each
        artworks = await Promise.all(
          data.artObjects.slice(0, randomCount).map(async (art) => {
            const detailRes = await fetch(`${API_BASE}/${art.objectNumber}?key=${API_KEY}`);
            const detailData: DetailResponse = await detailRes.json();
            return detailData.artObject;
          })
        );
      }
      
      if (!artworks.length) {
        throw new Error('No artworks found');
      }
      
      // Build pages
      const pages: IngestedPage[] = artworks.map((art, idx) => {
        const lines: IngestedLine[] = [];
        
        // Image
        if (art.webImage) {
          lines.push({
            id: `art-${art.objectNumber}-image`,
            type: 'image',
            L1: art.webImage.url,
            L2: '',
            meta: {
              imageUrl: art.webImage.url,
              thumbnailUrl: art.webImage.url.replace('=s0', '=s400'),
            },
          });
        }
        
        // Title
        lines.push({
          id: `art-${art.objectNumber}-title`,
          type: 'heading',
          L1: art.title,
          L2: '',
        });
        
        // Artist and date
        lines.push({
          id: `art-${art.objectNumber}-artist`,
          type: 'text',
          L1: art.principalOrFirstMaker,
          L2: '',
        });
        
        if (art.dating?.presentingDate) {
          lines.push({
            id: `art-${art.objectNumber}-date`,
            type: 'text',
            L1: `📅 ${art.dating.presentingDate}`,
            L2: '',
          });
        }
        
        // Separator
        lines.push({
          id: `art-${art.objectNumber}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // English description (placard)
        if (art.plaqueDescriptionEnglish) {
          lines.push({
            id: `art-${art.objectNumber}-desc-en`,
            type: 'text',
            L1: art.plaqueDescriptionEnglish,
            L2: '',
          });
        }
        
        // Dutch description for comparison
        if (art.plaqueDescriptionDutch) {
          lines.push({
            id: `art-${art.objectNumber}-desc-nl`,
            type: 'text',
            L1: `🇳🇱 ${art.plaqueDescriptionDutch}`,
            L2: '',
          });
        }
        
        // Medium
        if (art.physicalMedium) {
          lines.push({
            id: `art-${art.objectNumber}-medium`,
            type: 'text',
            L1: `🎨 Medium: ${art.physicalMedium}`,
            L2: '',
          });
        }
        
        // Dimensions
        const dimensions = art.dimensions?.map(d => `${d.value} ${d.unit}`).join(' × ');
        if (dimensions) {
          lines.push({
            id: `art-${art.objectNumber}-dims`,
            type: 'text',
            L1: `📐 Dimensions: ${dimensions}`,
            L2: '',
          });
        }
        
        // Link
        lines.push({
          id: `art-${art.objectNumber}-link`,
          type: 'text',
          L1: `🔗 ${art.links.web}`,
          L2: '',
          meta: {
            sourceUrl: art.links.web,
          },
        });
        
        return {
          id: `page-${art.objectNumber}`,
          number: idx + 1,
          title: art.title,
          lines,
        };
      });
      
      const firstArt = artworks[0];
      
      return {
        title: artworks.length === 1 
          ? firstArt.title 
          : `Rijksmuseum Collection (${artworks.length} works)`,
        description: artworks.length === 1 
          ? firstArt.principalOrFirstMaker
          : 'Dutch masters and world art',
        sourceLang: 'en',
        layout: 'split-panel',
        pages,
        meta: {
          source: 'Rijksmuseum',
          sourceUrl: 'https://www.rijksmuseum.nl',
          coverImageUrl: firstArt.webImage?.url.replace('=s0', '=s400'),
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'CC0 (Public Domain)',
            url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          },
        },
      };
    } catch (error) {
      console.error('Rijksmuseum adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Get a random masterpiece
      const response = await fetch(
        `${API_BASE}?key=${API_KEY}&ps=1&imgonly=true&toppieces=true`
      );
      if (!response.ok) throw new Error('Preview failed');
      
      const data: SearchResponse = await response.json();
      const art = data.artObjects[0];
      
      if (!art) throw new Error('No artwork found');
      
      return {
        title: art.title,
        description: art.principalOrFirstMaker,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-image',
              type: 'image',
              L1: art.webImage?.url.replace('=s0', '=s400') || '',
              L2: '',
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: art.title,
              L2: '',
            },
            {
              id: 'preview-artist',
              type: 'text',
              L1: art.principalOrFirstMaker,
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Rijksmuseum preview error:', error);
      throw error;
    }
  },
};

export default rijksmuseumAdapter;
