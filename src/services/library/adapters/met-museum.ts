// src/services/library/adapters/met-museum.ts
// PURPOSE: Metropolitan Museum of Art adapter
// ACTION: Search and fetch CC0 artworks with descriptions
// MECHANISM: REST API to metmuseum.org

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

interface MetSearchResponse {
  total: number;
  objectIDs: number[];
}

interface MetObject {
  objectID: number;
  isHighlight: boolean;
  accessionNumber: string;
  accessionYear: string;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  additionalImages: string[];
  department: string;
  objectName: string;
  title: string;
  culture: string;
  period: string;
  dynasty: string;
  reign: string;
  portfolio: string;
  artistRole: string;
  artistPrefix: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  artistNationality: string;
  artistBeginDate: string;
  artistEndDate: string;
  objectDate: string;
  objectBeginDate: number;
  objectEndDate: number;
  medium: string;
  dimensions: string;
  creditLine: string;
  geographyType: string;
  city: string;
  state: string;
  county: string;
  country: string;
  region: string;
  classification: string;
  linkResource: string;
  metadataDate: string;
  repository: string;
  objectURL: string;
  tags: { term: string; AAT_URL: string; Wikidata_URL: string }[] | null;
}

export const metMuseumAdapter: LibraryAdapter = {
  sourceId: 'met-museum',
  displayName: 'The Metropolitan Museum of Art',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      // Search for public domain works only
      const searchUrl = `${API_BASE}/search?isHighlight=true&hasImages=true&q=${encodeURIComponent(query)}`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`Met search failed: ${searchResponse.status}`);
      }

      const searchData: MetSearchResponse = await searchResponse.json();
      
      if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
        return [];
      }

      // Fetch details for first N objects
      const objectIds = searchData.objectIDs.slice(0, limit);
      const objects = await Promise.all(
        objectIds.map(async (id) => {
          try {
            const response = await fetch(`${API_BASE}/objects/${id}`);
            if (!response.ok) return null;
            return await response.json() as MetObject;
          } catch {
            return null;
          }
        })
      );

      return objects
        .filter((obj): obj is MetObject => obj !== null && obj.isPublicDomain)
        .map(obj => ({
          id: obj.objectID,
          title: obj.title || obj.objectName,
          subtitle: obj.artistDisplayName || obj.culture || obj.department,
          thumbnail: obj.primaryImageSmall,
          meta: {
            artist: obj.artistDisplayName,
            date: obj.objectDate,
            medium: obj.medium,
            isPublicDomain: obj.isPublicDomain,
          },
        }));
    } catch (error) {
      console.error('Met Museum search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, randomCount = 5 } = config;

    try {
      let objectIds: number[] = [];

      if (selectedId) {
        objectIds = [Number(selectedId)];
      } else {
        // Get random highlighted public domain works
        const searchResponse = await fetch(
          `${API_BASE}/search?isHighlight=true&hasImages=true&isPublicDomain=true&q=*`
        );
        const searchData: MetSearchResponse = await searchResponse.json();
        
        if (searchData.objectIDs) {
          // Shuffle and take random selection
          const shuffled = searchData.objectIDs.sort(() => Math.random() - 0.5);
          objectIds = shuffled.slice(0, randomCount);
        }
      }

      if (objectIds.length === 0) {
        throw new Error('No artworks found');
      }

      // Fetch all objects
      const objects = await Promise.all(
        objectIds.map(async (id) => {
          const response = await fetch(`${API_BASE}/objects/${id}`);
          if (!response.ok) throw new Error(`Failed to fetch object ${id}`);
          return await response.json() as MetObject;
        })
      );

      // Convert to pages (one artwork per page)
      const pages: IngestedPage[] = objects.map((obj, idx) => {
        const lines: IngestedLine[] = [];

        // Image
        if (obj.primaryImage) {
          lines.push({
            id: `art-${obj.objectID}-image`,
            type: 'image',
            L1: obj.primaryImage,
            L2: '',
            meta: {
              imageUrl: obj.primaryImage,
              thumbnailUrl: obj.primaryImageSmall,
            },
          });
        }

        // Title
        lines.push({
          id: `art-${obj.objectID}-title`,
          type: 'heading',
          L1: obj.title || obj.objectName,
          L2: '',
        });

        // Artist info
        if (obj.artistDisplayName) {
          lines.push({
            id: `art-${obj.objectID}-artist`,
            type: 'text',
            L1: obj.artistDisplayName,
            L2: '',
            meta: {
              artistName: obj.artistDisplayName,
              artistNationality: obj.artistNationality,
            },
          });
        }

        // Date and medium
        if (obj.objectDate || obj.medium) {
          lines.push({
            id: `art-${obj.objectID}-info`,
            type: 'text',
            L1: [obj.objectDate, obj.medium].filter(Boolean).join(' • '),
            L2: '',
            meta: {
              objectDate: obj.objectDate,
              medium: obj.medium,
            },
          });
        }

        // Culture/Period
        if (obj.culture || obj.period) {
          lines.push({
            id: `art-${obj.objectID}-culture`,
            type: 'text',
            L1: [obj.culture, obj.period].filter(Boolean).join(', '),
            L2: '',
          });
        }

        // Dimensions
        if (obj.dimensions) {
          lines.push({
            id: `art-${obj.objectID}-dimensions`,
            type: 'text',
            L1: `Dimensions: ${obj.dimensions}`,
            L2: '',
          });
        }

        // Credit line
        if (obj.creditLine) {
          lines.push({
            id: `art-${obj.objectID}-credit`,
            type: 'text',
            L1: obj.creditLine,
            L2: '',
          });
        }

        // Source link
        lines.push({
          id: `art-${obj.objectID}-source`,
          type: 'text',
          L1: `View at The Met: ${obj.objectURL}`,
          L2: '',
          meta: {
            sourceUrl: obj.objectURL,
          },
        });

        return {
          id: `page-${obj.objectID}`,
          number: idx + 1,
          title: obj.title || obj.objectName,
          lines,
        };
      });

      const firstObj = objects[0];
      
      return {
        title: objects.length === 1 
          ? firstObj.title || firstObj.objectName
          : `Met Museum Collection (${objects.length} works)`,
        description: objects.length === 1 
          ? firstObj.artistDisplayName || firstObj.department
          : 'Selected public domain artworks',
        sourceLang: 'en',
        layout: 'split-panel',
        pages,
        meta: {
          source: 'The Metropolitan Museum of Art',
          sourceUrl: 'https://www.metmuseum.org',
          coverImageUrl: firstObj.primaryImageSmall,
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
      console.error('Met Museum fetch error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const { selectedId } = config;

    if (!selectedId) {
      // Return a random highlighted work
      try {
        const searchResponse = await fetch(
          `${API_BASE}/search?isHighlight=true&hasImages=true&isPublicDomain=true&q=painting`
        );
        const searchData: MetSearchResponse = await searchResponse.json();
        
        if (!searchData.objectIDs?.length) {
          throw new Error('No artworks found');
        }

        const randomId = searchData.objectIDs[Math.floor(Math.random() * Math.min(10, searchData.objectIDs.length))];
        const objResponse = await fetch(`${API_BASE}/objects/${randomId}`);
        const obj: MetObject = await objResponse.json();

        return {
          title: obj.title || obj.objectName,
          description: obj.artistDisplayName,
          pages: [{
            id: 'preview',
            lines: [
              {
                id: 'preview-image',
                type: 'image',
                L1: obj.primaryImageSmall,
                L2: '',
                meta: { imageUrl: obj.primaryImage },
              },
              {
                id: 'preview-title',
                type: 'heading',
                L1: obj.title,
                L2: '',
              },
              {
                id: 'preview-artist',
                type: 'text',
                L1: obj.artistDisplayName || 'Unknown artist',
                L2: '',
              },
            ],
          }],
        };
      } catch (error) {
        console.error('Met preview error:', error);
        throw error;
      }
    }

    // Preview specific object
    const objResponse = await fetch(`${API_BASE}/objects/${selectedId}`);
    const obj: MetObject = await objResponse.json();

    return {
      title: obj.title || obj.objectName,
      description: obj.artistDisplayName,
      pages: [{
        id: 'preview',
        lines: [
          {
            id: 'preview-image',
            type: 'image',
            L1: obj.primaryImageSmall,
            L2: '',
          },
          {
            id: 'preview-info',
            type: 'text',
            L1: `${obj.objectDate || ''} • ${obj.medium || ''}`,
            L2: '',
          },
        ],
      }],
    };
  },
};

export default metMuseumAdapter;
