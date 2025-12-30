// src/services/library/adapters/index.ts
// PURPOSE: Central adapter registry and factory
// ACTION: Exports all adapters and provides getAdapter function
// MECHANISM: Maps sourceId to adapter implementation

import { LibraryAdapter } from '../types';

// Import all adapters
import { bibleAdapter } from './bible';
import { gutendexAdapter } from './gutendex';
import { poetrydbAdapter } from './poetrydb';
import { metMuseumAdapter } from './met-museum';
import { tatoebaAdapter } from './tatoeba';
import { quranAdapter, QURAN_SURAHS } from './quran';
import { nasaApodAdapter } from './nasa-apod';
import { restCountriesAdapter } from './restcountries';
import { quotableAdapter } from './quotable';
import { themealdbAdapter, MEAL_CATEGORIES, MEAL_AREAS } from './themealdb';
import { artInstituteChicagoAdapter } from './art-institute-chicago';
import { openLibraryAdapter } from './open-library';
import { xkcdAdapter } from './xkcd';
import { wikipediaAdapter } from './wikipedia';
import { pokeapiAdapter } from './pokeapi';
import { bhagavadGitaAdapter, GITA_CHAPTERS } from './bhagavad-gita';
import { uselessFactsAdapter } from './useless-facts';
import { standardEbooksAdapter } from './standard-ebooks';
import { rijksmuseumAdapter } from './rijksmuseum';
import { freeDictionaryAdapter } from './free-dictionary';
import { sefariaAdapter, SEFARIA_BOOKS } from './sefaria';
import { suttacentralAdapter, POPULAR_SUTTAS } from './suttacentral';
import { thirukkuralAdapter, THIRUKKURAL_SECTIONS, THIRUKKURAL_CHAPTERS } from './thirukkural';
import { chroniclingAmericaAdapter } from './chronicling-america';
import { folgerShakespeareAdapter, SHAKESPEARE_WORKS } from './folger-shakespeare';
import { eurlexAdapter, EU_LANGUAGES } from './eurlex';
import { folkloreAdapter, FOLKLORE_STORIES } from './folklore';
import { colorNamesAdapter, COLOR_DATA } from './color-names';

// ═══════════════════════════════════════════════════════════════════
// ADAPTER REGISTRY
// ═══════════════════════════════════════════════════════════════════

const ADAPTERS: Record<string, LibraryAdapter> = {
  // 🟢 Sacred & Wisdom (Commercial Safe)
  'bible-api': bibleAdapter,
  'alquran-cloud': quranAdapter,
  'gita-api': bhagavadGitaAdapter,
  'sefaria': sefariaAdapter,
  'suttacentral': suttacentralAdapter,
  'thirukkural-api': thirukkuralAdapter,
  
  // 🟢 Literature (Commercial Safe - Public Domain)
  'gutendex': gutendexAdapter,
  'poetrydb': poetrydbAdapter,
  'open-library': openLibraryAdapter,
  'standardebooks': standardEbooksAdapter,
  'gutendex-shakespeare': folgerShakespeareAdapter,
  'static-folklore': folkloreAdapter,
  
  // 🟢 Visual & Art (Commercial Safe - CC0)
  'met-museum': metMuseumAdapter,
  'artic': artInstituteChicagoAdapter,
  'rijksmuseum': rijksmuseumAdapter,
  'nasa-apod': nasaApodAdapter,
  'color-names': colorNamesAdapter,
  
  // 🟢 Knowledge & Facts (Commercial Safe)
  'restcountries': restCountriesAdapter,
  'quotable': quotableAdapter,
  'themealdb': themealdbAdapter,
  'useless-facts': uselessFactsAdapter,
  'free-dictionary': freeDictionaryAdapter,
  
  // 🟢 History & News (Commercial Safe)
  'chronicling-america': chroniclingAmericaAdapter,
  'eurlex': eurlexAdapter,
  
  // 🟡 Language (Attribution Required)
  'tatoeba': tatoebaAdapter,
  'wikipedia': wikipediaAdapter,
  
  // 🔴 Pop Culture (Personal Only)
  'xkcd': xkcdAdapter,
  'pokeapi': pokeapiAdapter,
};

// ═══════════════════════════════════════════════════════════════════
// ADAPTER FACTORY
// ═══════════════════════════════════════════════════════════════════

/**
 * Get adapter by sourceId
 */
export function getAdapter(sourceId: string): LibraryAdapter | undefined {
  return ADAPTERS[sourceId];
}

/**
 * Check if adapter exists
 */
export function hasAdapter(sourceId: string): boolean {
  return sourceId in ADAPTERS;
}

/**
 * Get all available adapter IDs
 */
export function getAvailableAdapters(): string[] {
  return Object.keys(ADAPTERS);
}

/**
 * Get adapter display names
 */
export function getAdapterNames(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(ADAPTERS).map(([id, adapter]) => [id, adapter.displayName])
  );
}

/**
 * Get all adapters for a specific license type
 */
export function getAdaptersByLicense(
  licenseType: 'commercial-safe' | 'attribution' | 'personal-only'
): string[] {
  const licenseMap: Record<string, 'commercial-safe' | 'attribution' | 'personal-only'> = {
    // Sacred & Wisdom
    'bible-api': 'commercial-safe',
    'alquran-cloud': 'commercial-safe',
    'gita-api': 'commercial-safe',
    'sefaria': 'commercial-safe',
    'suttacentral': 'commercial-safe',
    'thirukkural-api': 'commercial-safe',
    // Literature
    'gutendex': 'commercial-safe',
    'poetrydb': 'commercial-safe',
    'open-library': 'commercial-safe',
    'standardebooks': 'commercial-safe',
    'gutendex-shakespeare': 'commercial-safe',
    'static-folklore': 'commercial-safe',
    // Visual & Art
    'met-museum': 'commercial-safe',
    'artic': 'commercial-safe',
    'rijksmuseum': 'commercial-safe',
    'nasa-apod': 'commercial-safe',
    'color-names': 'commercial-safe',
    // Knowledge & Facts
    'restcountries': 'commercial-safe',
    'quotable': 'commercial-safe',
    'themealdb': 'commercial-safe',
    'useless-facts': 'commercial-safe',
    'free-dictionary': 'commercial-safe',
    // History & News
    'chronicling-america': 'commercial-safe',
    'eurlex': 'commercial-safe',
    // Language (Attribution)
    'tatoeba': 'attribution',
    'wikipedia': 'attribution',
    // Pop Culture (Personal Only)
    'xkcd': 'personal-only',
    'pokeapi': 'personal-only',
  };
  
  return Object.entries(licenseMap)
    .filter(([_, type]) => type === licenseType)
    .map(([id]) => id);
}

/**
 * Get adapter count by license type
 */
export function getAdapterStats(): { total: number; safe: number; attribution: number; personal: number } {
  const all = Object.keys(ADAPTERS);
  return {
    total: all.length,
    safe: getAdaptersByLicense('commercial-safe').length,
    attribution: getAdaptersByLicense('attribution').length,
    personal: getAdaptersByLicense('personal-only').length,
  };
}

// ═══════════════════════════════════════════════════════════════════
// NAMED EXPORTS
// ═══════════════════════════════════════════════════════════════════

// Core adapters
export { bibleAdapter } from './bible';
export { gutendexAdapter } from './gutendex';
export { poetrydbAdapter } from './poetrydb';
export { metMuseumAdapter } from './met-museum';
export { tatoebaAdapter } from './tatoeba';
export { quranAdapter } from './quran';
export { nasaApodAdapter } from './nasa-apod';
export { restCountriesAdapter } from './restcountries';
export { quotableAdapter } from './quotable';
export { themealdbAdapter } from './themealdb';
export { artInstituteChicagoAdapter } from './art-institute-chicago';
export { openLibraryAdapter } from './open-library';
export { xkcdAdapter } from './xkcd';
export { wikipediaAdapter } from './wikipedia';
export { pokeapiAdapter } from './pokeapi';
export { bhagavadGitaAdapter } from './bhagavad-gita';
export { uselessFactsAdapter } from './useless-facts';
export { standardEbooksAdapter } from './standard-ebooks';
export { rijksmuseumAdapter } from './rijksmuseum';
export { freeDictionaryAdapter } from './free-dictionary';
export { sefariaAdapter } from './sefaria';
export { suttacentralAdapter } from './suttacentral';
export { thirukkuralAdapter } from './thirukkural';
export { chroniclingAmericaAdapter } from './chronicling-america';
export { folgerShakespeareAdapter } from './folger-shakespeare';
export { eurlexAdapter } from './eurlex';
export { folkloreAdapter } from './folklore';
export { colorNamesAdapter } from './color-names';

// Bible-specific exports
export { BIBLE_BOOKS, BIBLE_CHAPTERS } from './bible';

// Quran-specific exports
export { QURAN_SURAHS };

// Gita-specific exports
export { GITA_CHAPTERS };

// Meal-specific exports
export { MEAL_CATEGORIES, MEAL_AREAS };

// Sefaria-specific exports
export { SEFARIA_BOOKS };

// SuttaCentral-specific exports
export { POPULAR_SUTTAS };

// Thirukkural-specific exports
export { THIRUKKURAL_SECTIONS, THIRUKKURAL_CHAPTERS };

// Shakespeare-specific exports
export { SHAKESPEARE_WORKS };

// EU-specific exports
export { EU_LANGUAGES };

// Folklore-specific exports
export { FOLKLORE_STORIES };

// Color-specific exports
export { COLOR_DATA };
