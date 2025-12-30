// src/services/library/adapters/pokeapi.ts
// PURPOSE: PokéAPI adapter (🔴 Personal Only - Trademarked)
// ACTION: Fetches Pokémon data with multilingual descriptions
// MECHANISM: REST API to pokeapi.co
// LICENSE: Pokémon is trademarked by Nintendo - Personal study only!

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://pokeapi.co/api/v2';

interface PokemonSpecies {
  id: number;
  name: string;
  names: { language: { name: string }; name: string }[];
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  generation: { name: string };
  is_legendary: boolean;
  is_mythical: boolean;
}

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other?: {
      'official-artwork'?: { front_default: string };
    };
  };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
}

interface PokemonListResponse {
  count: number;
  results: { name: string; url: string }[];
}

// Language code mapping
const LANG_MAP: Record<string, string> = {
  en: 'en', fr: 'fr', de: 'de', es: 'es', it: 'it',
  ja: 'ja', ko: 'ko', 'zh-Hans': 'zh-Hans', 'zh-Hant': 'zh-Hant',
};

export const pokeapiAdapter: LibraryAdapter = {
  sourceId: 'pokeapi',
  displayName: 'PokéAPI (Personal Study Only)',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      // Search by name
      const response = await fetch(`${API_BASE}/pokemon?limit=1000`);
      if (!response.ok) throw new Error('Search failed');
      
      const data: PokemonListResponse = await response.json();
      const q = query.toLowerCase();
      
      const matches = data.results
        .filter(p => p.name.includes(q))
        .slice(0, limit);
      
      return matches.map(p => {
        const id = p.url.split('/').filter(Boolean).pop();
        return {
          id: id || p.name,
          title: p.name.charAt(0).toUpperCase() + p.name.slice(1),
          subtitle: `#${id?.padStart(4, '0')}`,
          thumbnail: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          meta: {},
        };
      });
    } catch (error) {
      console.error('PokéAPI search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, randomCount = 5 } = config;
    
    try {
      let pokemonIds: number[] = [];
      
      if (selectedId) {
        pokemonIds = [Number(selectedId)];
      } else {
        // Random Pokémon (Gen 1-9, ~1000 total)
        const max = 1010;
        const ids = new Set<number>();
        while (ids.size < randomCount) {
          ids.add(Math.floor(Math.random() * max) + 1);
        }
        pokemonIds = Array.from(ids);
      }
      
      // Fetch all Pokémon data
      const pokemonData = await Promise.all(
        pokemonIds.map(async (id) => {
          const [pokemon, species] = await Promise.all([
            fetch(`${API_BASE}/pokemon/${id}`).then(r => r.json()) as Promise<Pokemon>,
            fetch(`${API_BASE}/pokemon-species/${id}`).then(r => r.json()) as Promise<PokemonSpecies>,
          ]);
          return { pokemon, species };
        })
      );
      
      // Build pages
      const pages: IngestedPage[] = pokemonData.map(({ pokemon, species }, idx) => {
        const lines: IngestedLine[] = [];
        
        // Artwork
        const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default;
        if (artworkUrl) {
          lines.push({
            id: `pokemon-${pokemon.id}-art`,
            type: 'image',
            L1: artworkUrl,
            L2: '',
            meta: { imageUrl: artworkUrl },
          });
        }
        
        // Name in multiple languages
        const engName = species.names.find(n => n.language.name === 'en')?.name || pokemon.name;
        const jpnName = species.names.find(n => n.language.name === 'ja')?.name || '';
        const frName = species.names.find(n => n.language.name === 'fr')?.name || '';
        const deName = species.names.find(n => n.language.name === 'de')?.name || '';
        
        lines.push({
          id: `pokemon-${pokemon.id}-name`,
          type: 'heading',
          L1: `#${pokemon.id.toString().padStart(4, '0')} ${engName}`,
          L2: jpnName,
        });
        
        // Type
        lines.push({
          id: `pokemon-${pokemon.id}-type`,
          type: 'text',
          L1: `Type: ${pokemon.types.map(t => t.type.name.toUpperCase()).join(' / ')}`,
          L2: '',
        });
        
        // Genus (category)
        const engGenus = species.genera.find(g => g.language.name === 'en')?.genus || '';
        const jpnGenus = species.genera.find(g => g.language.name === 'ja')?.genus || '';
        if (engGenus) {
          lines.push({
            id: `pokemon-${pokemon.id}-genus`,
            type: 'text',
            L1: `The ${engGenus}`,
            L2: jpnGenus,
          });
        }
        
        // Separator
        lines.push({
          id: `pokemon-${pokemon.id}-sep1`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Names in different languages
        lines.push({
          id: `pokemon-${pokemon.id}-names-header`,
          type: 'text',
          L1: '🌐 Names by Language:',
          L2: '',
        });
        
        const langNames = [
          { lang: 'English', name: engName },
          { lang: 'Japanese', name: jpnName },
          { lang: 'French', name: frName },
          { lang: 'German', name: deName },
        ].filter(l => l.name);
        
        langNames.forEach(({ lang, name }) => {
          lines.push({
            id: `pokemon-${pokemon.id}-name-${lang.toLowerCase()}`,
            type: 'text',
            L1: `   ${lang}: ${name}`,
            L2: '',
          });
        });
        
        // Separator
        lines.push({
          id: `pokemon-${pokemon.id}-sep2`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Flavor text (description) in multiple languages
        const engFlavor = species.flavor_text_entries.find(f => f.language.name === 'en');
        const jpnFlavor = species.flavor_text_entries.find(f => f.language.name === 'ja');
        const frFlavor = species.flavor_text_entries.find(f => f.language.name === 'fr');
        
        lines.push({
          id: `pokemon-${pokemon.id}-desc-header`,
          type: 'text',
          L1: '📖 Pokédex Entry:',
          L2: '',
        });
        
        if (engFlavor) {
          lines.push({
            id: `pokemon-${pokemon.id}-desc-en`,
            type: 'text',
            L1: engFlavor.flavor_text.replace(/\f|\n/g, ' '),
            L2: jpnFlavor?.flavor_text.replace(/\f|\n/g, ' ') || '',
          });
        }
        
        if (frFlavor) {
          lines.push({
            id: `pokemon-${pokemon.id}-desc-fr`,
            type: 'text',
            L1: `🇫🇷 ${frFlavor.flavor_text.replace(/\f|\n/g, ' ')}`,
            L2: '',
          });
        }
        
        // Warning
        lines.push({
          id: `pokemon-${pokemon.id}-warning`,
          type: 'text',
          L1: '⚠️ Pokémon is trademarked by Nintendo. Personal study only.',
          L2: '',
        });
        
        return {
          id: `page-${pokemon.id}`,
          number: idx + 1,
          title: engName,
          lines,
        };
      });
      
      const first = pokemonData[0];
      const firstName = first.species.names.find(n => n.language.name === 'en')?.name || first.pokemon.name;
      
      return {
        title: pokemonData.length === 1 
          ? `Pokédex: ${firstName}` 
          : `Pokédex Study (${pokemonData.length} Pokémon)`,
        description: pokemonData.length === 1 
          ? `#${first.pokemon.id.toString().padStart(4, '0')}`
          : 'Multilingual Pokémon descriptions for language study',
        sourceLang: 'en',
        targetLang: 'ja',
        layout: 'flashcard',
        pages,
        meta: {
          source: 'PokéAPI',
          sourceUrl: 'https://pokeapi.co',
          coverImageUrl: first.pokemon.sprites.other?.['official-artwork']?.front_default,
          publicDomain: false,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'personal-only',
            name: 'Trademarked Content',
            warningText: 'Pokémon is a registered trademark of Nintendo, Game Freak, and Creatures Inc. This content is for personal language study only. You cannot publish or sell works containing Pokémon content.',
          },
        },
      };
    } catch (error) {
      console.error('PokéAPI adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      // Random Pokémon preview
      const id = Math.floor(Math.random() * 151) + 1; // Gen 1 only for preview
      const pokemon: Pokemon = await fetch(`${API_BASE}/pokemon/${id}`).then(r => r.json());
      const species: PokemonSpecies = await fetch(`${API_BASE}/pokemon-species/${id}`).then(r => r.json());
      
      const name = species.names.find(n => n.language.name === 'en')?.name || pokemon.name;
      const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default;
      
      return {
        title: name,
        description: `#${pokemon.id.toString().padStart(4, '0')}`,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-art',
              type: 'image',
              L1: artworkUrl || pokemon.sprites.front_default,
              L2: '',
            },
            {
              id: 'preview-name',
              type: 'heading',
              L1: name,
              L2: '',
            },
            {
              id: 'preview-warning',
              type: 'text',
              L1: '⚠️ Personal study only (Trademarked)',
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('PokéAPI preview error:', error);
      throw error;
    }
  },
};

export default pokeapiAdapter;
