// src/services/library/adapters/nasa-apod.ts
// PURPOSE: NASA Astronomy Picture of the Day adapter
// ACTION: Fetches daily astronomy images with explanations
// MECHANISM: REST API to api.nasa.gov/planetary/apod

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
} from '../types';

// NASA API key (demo key, rate limited)
const API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const API_BASE = 'https://api.nasa.gov/planetary/apod';

interface APODResponse {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

export const nasaApodAdapter: LibraryAdapter = {
  sourceId: 'nasa-apod',
  displayName: 'NASA Astronomy Picture of the Day',

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { date, randomCount = 5 } = config;
    
    try {
      let url: string;
      let response: Response;
      let data: APODResponse | APODResponse[];
      
      if (date) {
        // Specific date
        url = `${API_BASE}?api_key=${API_KEY}&date=${date}`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch APOD');
        data = await response.json();
      } else {
        // Random selection
        url = `${API_BASE}?api_key=${API_KEY}&count=${randomCount}`;
        response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch random APODs');
        data = await response.json();
      }
      
      // Normalize to array
      const apods: APODResponse[] = Array.isArray(data) ? data : [data];
      
      // Build pages (one per image)
      const pages: IngestedPage[] = apods.map((apod, idx) => {
        const lines: IngestedLine[] = [];
        
        // Image (if not video)
        if (apod.media_type === 'image') {
          lines.push({
            id: `apod-${idx}-image`,
            type: 'image',
            L1: apod.hdurl || apod.url,
            L2: '',
            meta: {
              imageUrl: apod.hdurl || apod.url,
              thumbnailUrl: apod.url,
            },
          });
        }
        
        // Title
        lines.push({
          id: `apod-${idx}-title`,
          type: 'heading',
          L1: apod.title,
          L2: '',
          meta: {
            objectDate: apod.date,
          },
        });
        
        // Date
        lines.push({
          id: `apod-${idx}-date`,
          type: 'text',
          L1: `📅 ${apod.date}`,
          L2: '',
        });
        
        // Separator
        lines.push({
          id: `apod-${idx}-sep`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Explanation (split into paragraphs)
        const paragraphs = apod.explanation.split(/\n\n|\. (?=[A-Z])/);
        paragraphs.forEach((para, pIdx) => {
          if (para.trim()) {
            lines.push({
              id: `apod-${idx}-para-${pIdx}`,
              type: 'text',
              L1: para.trim() + (para.trim().endsWith('.') ? '' : '.'),
              L2: '',
            });
          }
        });
        
        // Copyright (if any)
        if (apod.copyright) {
          lines.push({
            id: `apod-${idx}-copyright`,
            type: 'text',
            L1: `📷 Image Credit: ${apod.copyright}`,
            L2: '',
          });
        }
        
        return {
          id: `page-${idx}`,
          number: idx + 1,
          title: apod.title,
          lines,
        };
      });
      
      const firstApod = apods[0];
      
      return {
        title: apods.length === 1 ? firstApod.title : `Cosmic Collection (${apods.length} images)`,
        description: apods.length === 1 ? firstApod.date : 'NASA Astronomy Pictures of the Day',
        sourceLang: 'en',
        layout: 'split-panel',
        pages,
        meta: {
          source: 'NASA APOD',
          sourceUrl: 'https://apod.nasa.gov',
          coverImageUrl: firstApod.url,
          publicDomain: true, // Most NASA images are PD
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain (NASA)',
            attributionText: firstApod.copyright 
              ? `Image by ${firstApod.copyright}. Check individual image credits.`
              : 'NASA images are generally public domain.',
          },
        },
      };
    } catch (error) {
      console.error('NASA APOD adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const response = await fetch(`${API_BASE}?api_key=${API_KEY}`);
      if (!response.ok) throw new Error('Preview failed');
      
      const apod: APODResponse = await response.json();
      
      return {
        title: apod.title,
        description: apod.date,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-image',
              type: 'image',
              L1: apod.url,
              L2: '',
              meta: { imageUrl: apod.hdurl },
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: apod.title,
              L2: '',
            },
            {
              id: 'preview-excerpt',
              type: 'text',
              L1: apod.explanation.slice(0, 200) + '...',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('NASA APOD preview error:', error);
      throw error;
    }
  },
};

export default nasaApodAdapter;
