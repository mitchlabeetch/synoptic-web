// src/services/library/adapters/art-institute-chicago.ts
// PURPOSE: Art Institute of Chicago adapter
// ACTION: Fetches CC0 artwork with descriptions
// MECHANISM: REST API to api.artic.edu

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://api.artic.edu/api/v1';
const IIIF_BASE = 'https://www.artic.edu/iiif/2';

interface ArtworkData {
  id: number;
  title: string;
  thumbnail?: {
    lqip: string;
    width: number;
    height: number;
    alt_text?: string;
  };
  date_display: string;
  artist_display: string;
  place_of_origin?: string;
  medium_display?: string;
  dimensions?: string;
  credit_line?: string;
  publication_history?: string;
  exhibition_history?: string;
  provenance_text?: string;
  copyright_notice?: string;
  is_public_domain: boolean;
  image_id?: string;
  department_title?: string;
  artwork_type_title?: string;
  style_title?: string;
  classification_title?: string;
}

interface ArtworkResponse {
  data: ArtworkData;
  config: { iiif_url: string };
}

interface SearchResponse {
  data: ArtworkData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    current_page: number;
  };
  config: { iiif_url: string };
}

function getImageUrl(imageId: string, size: 'full' | 'thumbnail' = 'full'): string {
  if (size === 'thumbnail') {
    return `${IIIF_BASE}/${imageId}/full/200,/0/default.jpg`;
  }
  return `${IIIF_BASE}/${imageId}/full/843,/0/default.jpg`;
}

export const artInstituteChicagoAdapter: LibraryAdapter = {
  sourceId: 'artic',
  displayName: 'Art Institute of Chicago',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        fields: 'id,title,artist_display,date_display,thumbnail,image_id,is_public_domain',
        query: JSON.stringify({
          bool: {
            must: [
              { term: { is_public_domain: true } },
              { exists: { field: 'image_id' } },
            ],
          },
        }),
      });
      
      const response = await fetch(`${API_BASE}/artworks/search?${params}`);
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResponse = await response.json();
      
      return data.data
        .filter(artwork => artwork.is_public_domain && artwork.image_id)
        .slice(0, limit)
        .map(artwork => ({
          id: artwork.id,
          title: artwork.title,
          subtitle: artwork.artist_display || 'Unknown artist',
          thumbnail: artwork.image_id ? getImageUrl(artwork.image_id, 'thumbnail') : undefined,
          meta: {
            date: artwork.date_display,
            isPublicDomain: artwork.is_public_domain,
          },
        }));
    } catch (error) {
      console.error('Art Institute search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 5 } = config;
    
    try {
      let artworks: ArtworkData[] = [];
      
      if (selectedId) {
        // Fetch specific artwork
        const response = await fetch(`${API_BASE}/artworks/${selectedId}`);
        if (!response.ok) throw new Error('Failed to fetch artwork');
        const data: ArtworkResponse = await response.json();
        artworks = [data.data];
      } else {
        // Search or random public domain works
        const params = new URLSearchParams({
          limit: randomCount.toString(),
          fields: 'id,title,artist_display,date_display,place_of_origin,medium_display,dimensions,credit_line,thumbnail,image_id,is_public_domain,department_title,style_title',
        });
        
        if (searchQuery) {
          params.set('q', searchQuery);
        }
        
        // Only public domain with images
        params.set('query', JSON.stringify({
          bool: {
            must: [
              { term: { is_public_domain: true } },
              { exists: { field: 'image_id' } },
            ],
          },
        }));
        
        const response = await fetch(`${API_BASE}/artworks/search?${params}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data: SearchResponse = await response.json();
        artworks = data.data.filter(a => a.is_public_domain && a.image_id);
      }
      
      if (!artworks.length) {
        throw new Error('No artworks found');
      }
      
      // Build pages
      const pages: IngestedPage[] = artworks.map((artwork, idx) => {
        const lines: IngestedLine[] = [];
        
        // Image
        if (artwork.image_id) {
          lines.push({
            id: `art-${artwork.id}-image`,
            type: 'image',
            L1: getImageUrl(artwork.image_id),
            L2: '',
            meta: {
              imageUrl: getImageUrl(artwork.image_id),
              thumbnailUrl: getImageUrl(artwork.image_id, 'thumbnail'),
            },
          });
        }
        
        // Title
        lines.push({
          id: `art-${artwork.id}-title`,
          type: 'heading',
          L1: artwork.title,
          L2: '',
        });
        
        // Artist
        if (artwork.artist_display) {
          lines.push({
            id: `art-${artwork.id}-artist`,
            type: 'text',
            L1: artwork.artist_display,
            L2: '',
            meta: {
              artistName: artwork.artist_display,
            },
          });
        }
        
        // Date
        if (artwork.date_display) {
          lines.push({
            id: `art-${artwork.id}-date`,
            type: 'text',
            L1: `📅 ${artwork.date_display}`,
            L2: '',
            meta: {
              objectDate: artwork.date_display,
            },
          });
        }
        
        // Separator
        lines.push({
          id: `art-${artwork.id}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Place of origin
        if (artwork.place_of_origin) {
          lines.push({
            id: `art-${artwork.id}-origin`,
            type: 'text',
            L1: `🌍 Origin: ${artwork.place_of_origin}`,
            L2: '',
          });
        }
        
        // Medium
        if (artwork.medium_display) {
          lines.push({
            id: `art-${artwork.id}-medium`,
            type: 'text',
            L1: `🎨 Medium: ${artwork.medium_display}`,
            L2: '',
            meta: {
              medium: artwork.medium_display,
            },
          });
        }
        
        // Dimensions
        if (artwork.dimensions) {
          lines.push({
            id: `art-${artwork.id}-dimensions`,
            type: 'text',
            L1: `📐 Dimensions: ${artwork.dimensions}`,
            L2: '',
          });
        }
        
        // Style/Department
        if (artwork.style_title || artwork.department_title) {
          lines.push({
            id: `art-${artwork.id}-style`,
            type: 'text',
            L1: `🏛️ ${[artwork.style_title, artwork.department_title].filter(Boolean).join(' • ')}`,
            L2: '',
          });
        }
        
        // Credit line
        if (artwork.credit_line) {
          lines.push({
            id: `art-${artwork.id}-credit`,
            type: 'text',
            L1: artwork.credit_line,
            L2: '',
          });
        }
        
        return {
          id: `page-${artwork.id}`,
          number: idx + 1,
          title: artwork.title,
          lines,
        };
      });
      
      const firstArtwork = artworks[0];
      
      return {
        title: artworks.length === 1 
          ? firstArtwork.title 
          : `Art Collection (${artworks.length} works)`,
        description: artworks.length === 1 
          ? firstArtwork.artist_display || 'Art Institute of Chicago'
          : 'Public domain artworks',
        sourceLang: 'en',
        layout: 'split-panel',
        pages,
        meta: {
          source: 'Art Institute of Chicago',
          sourceUrl: 'https://www.artic.edu',
          coverImageUrl: firstArtwork.image_id ? getImageUrl(firstArtwork.image_id, 'thumbnail') : undefined,
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
      console.error('Art Institute adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Fetch a random public domain artwork
      const params = new URLSearchParams({
        limit: '1',
        fields: 'id,title,artist_display,date_display,image_id,is_public_domain',
        query: JSON.stringify({
          bool: {
            must: [
              { term: { is_public_domain: true } },
              { exists: { field: 'image_id' } },
            ],
          },
        }),
      });
      
      const response = await fetch(`${API_BASE}/artworks/search?${params}`);
      if (!response.ok) throw new Error('Preview failed');
      
      const data: SearchResponse = await response.json();
      const artwork = data.data[0];
      
      if (!artwork) throw new Error('No artwork found');
      
      return {
        title: artwork.title,
        description: artwork.artist_display,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-image',
              type: 'image',
              L1: artwork.image_id ? getImageUrl(artwork.image_id, 'thumbnail') : '',
              L2: '',
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: artwork.title,
              L2: '',
            },
            {
              id: 'preview-artist',
              type: 'text',
              L1: artwork.artist_display || 'Unknown artist',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('Art Institute preview error:', error);
      throw error;
    }
  },
};

export default artInstituteChicagoAdapter;
