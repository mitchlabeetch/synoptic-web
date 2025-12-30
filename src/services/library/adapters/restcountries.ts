// src/services/library/adapters/restcountries.ts
// PURPOSE: REST Countries adapter for world geography
// ACTION: Fetches country profiles with multilingual data
// MECHANISM: REST API to restcountries.com

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://restcountries.com/v3.1';

interface Country {
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { official: string; common: string }>;
  };
  tld?: string[];
  cca2: string;
  cca3: string;
  capital?: string[];
  region: string;
  subregion?: string;
  languages?: Record<string, string>;
  translations: Record<string, { official: string; common: string }>;
  latlng: number[];
  landlocked: boolean;
  borders?: string[];
  area: number;
  demonyms?: Record<string, { f: string; m: string }>;
  flag: string;
  maps: { googleMaps: string; openStreetMaps: string };
  population: number;
  currencies?: Record<string, { name: string; symbol: string }>;
  timezones: string[];
  continents: string[];
  flags: { png: string; svg: string; alt?: string };
  coatOfArms?: { png?: string; svg?: string };
}

export const restCountriesAdapter: LibraryAdapter = {
  sourceId: 'restcountries',
  displayName: 'REST Countries',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${API_BASE}/name/${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Search failed');
      }
      
      const countries: Country[] = await response.json();
      
      return countries.slice(0, limit).map(country => ({
        id: country.cca3,
        title: country.name.common,
        subtitle: `${country.region}${country.subregion ? ` • ${country.subregion}` : ''}`,
        thumbnail: country.flags.png,
        meta: {
          population: country.population,
          capital: country.capital?.[0],
        },
      }));
    } catch (error) {
      console.error('REST Countries search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 10 } = config;
    
    try {
      let countries: Country[];
      
      if (selectedId) {
        // Fetch specific country by code
        const response = await fetch(`${API_BASE}/alpha/${selectedId}`);
        if (!response.ok) throw new Error('Failed to fetch country');
        countries = await response.json();
      } else if (searchQuery) {
        // Fetch by region
        const response = await fetch(`${API_BASE}/region/${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Failed to fetch region');
        countries = await response.json();
        countries = countries.slice(0, randomCount);
      } else {
        // Random selection from all countries
        const response = await fetch(`${API_BASE}/all`);
        if (!response.ok) throw new Error('Failed to fetch countries');
        const all: Country[] = await response.json();
        // Shuffle and take random
        countries = all.sort(() => Math.random() - 0.5).slice(0, randomCount);
      }
      
      // Build pages (one per country)
      const pages: IngestedPage[] = countries.map((country, idx) => {
        const lines: IngestedLine[] = [];
        
        // Flag image
        lines.push({
          id: `country-${country.cca3}-flag`,
          type: 'image',
          L1: country.flags.svg || country.flags.png,
          L2: '',
          meta: {
            imageUrl: country.flags.svg,
            thumbnailUrl: country.flags.png,
          },
        });
        
        // Country name
        lines.push({
          id: `country-${country.cca3}-name`,
          type: 'heading',
          L1: country.name.common,
          L2: country.name.official,
        });
        
        // Native name (if different)
        if (country.name.nativeName) {
          const firstNative = Object.values(country.name.nativeName)[0];
          if (firstNative && firstNative.common !== country.name.common) {
            lines.push({
              id: `country-${country.cca3}-native`,
              type: 'text',
              L1: `Native: ${firstNative.common}`,
              L2: firstNative.official,
            });
          }
        }
        
        // Separator
        lines.push({
          id: `country-${country.cca3}-sep1`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Key facts
        if (country.capital?.length) {
          lines.push({
            id: `country-${country.cca3}-capital`,
            type: 'text',
            L1: `🏛️ Capital: ${country.capital.join(', ')}`,
            L2: '',
          });
        }
        
        lines.push({
          id: `country-${country.cca3}-region`,
          type: 'text',
          L1: `🌍 Region: ${country.region}${country.subregion ? ` (${country.subregion})` : ''}`,
          L2: '',
        });
        
        lines.push({
          id: `country-${country.cca3}-population`,
          type: 'text',
          L1: `👥 Population: ${country.population.toLocaleString()}`,
          L2: '',
        });
        
        lines.push({
          id: `country-${country.cca3}-area`,
          type: 'text',
          L1: `📐 Area: ${country.area.toLocaleString()} km²`,
          L2: '',
        });
        
        // Languages
        if (country.languages) {
          lines.push({
            id: `country-${country.cca3}-languages`,
            type: 'text',
            L1: `🗣️ Languages: ${Object.values(country.languages).join(', ')}`,
            L2: '',
          });
        }
        
        // Currencies
        if (country.currencies) {
          const currencyList = Object.values(country.currencies)
            .map(c => `${c.name} (${c.symbol})`)
            .join(', ');
          lines.push({
            id: `country-${country.cca3}-currencies`,
            type: 'text',
            L1: `💰 Currency: ${currencyList}`,
            L2: '',
          });
        }
        
        // Separator
        lines.push({
          id: `country-${country.cca3}-sep2`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Translations section
        lines.push({
          id: `country-${country.cca3}-trans-header`,
          type: 'text',
          L1: '🌐 Translations:',
          L2: '',
        });
        
        // Show a few key translations
        const keyLangs = ['fra', 'deu', 'spa', 'ita', 'jpn', 'zho', 'ara'];
        const langNames: Record<string, string> = {
          fra: 'French', deu: 'German', spa: 'Spanish', 
          ita: 'Italian', jpn: 'Japanese', zho: 'Chinese', ara: 'Arabic',
        };
        
        keyLangs.forEach(lang => {
          if (country.translations[lang]) {
            lines.push({
              id: `country-${country.cca3}-trans-${lang}`,
              type: 'text',
              L1: `   ${langNames[lang]}: ${country.translations[lang].common}`,
              L2: country.translations[lang].official,
            });
          }
        });
        
        return {
          id: `page-${country.cca3}`,
          number: idx + 1,
          title: country.name.common,
          lines,
        };
      });
      
      const firstCountry = countries[0];
      
      return {
        title: countries.length === 1 
          ? firstCountry.name.common 
          : `World Atlas (${countries.length} countries)`,
        description: countries.length === 1 
          ? firstCountry.region 
          : 'Country profiles with translations',
        sourceLang: 'en',
        layout: 'poster',
        pages,
        meta: {
          source: 'REST Countries',
          sourceUrl: 'https://restcountries.com',
          coverImageUrl: firstCountry.flags.png,
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain (Factual Data)',
          },
        },
      };
    } catch (error) {
      console.error('REST Countries adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    const { selectedId } = config;
    
    try {
      let country: Country;
      
      if (selectedId) {
        const response = await fetch(`${API_BASE}/alpha/${selectedId}`);
        if (!response.ok) throw new Error('Preview failed');
        const data = await response.json();
        country = data[0];
      } else {
        // Random country
        const response = await fetch(`${API_BASE}/all`);
        const all: Country[] = await response.json();
        country = all[Math.floor(Math.random() * all.length)];
      }
      
      return {
        title: country.name.common,
        description: country.region,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-flag',
              type: 'image',
              L1: country.flags.png,
              L2: '',
            },
            {
              id: 'preview-name',
              type: 'heading',
              L1: country.name.common,
              L2: '',
            },
            {
              id: 'preview-capital',
              type: 'text',
              L1: `Capital: ${country.capital?.[0] || 'N/A'}`,
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('REST Countries preview error:', error);
      throw error;
    }
  },
};

export default restCountriesAdapter;
