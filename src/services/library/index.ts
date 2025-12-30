// src/services/library/index.ts
// PURPOSE: Central export for Library service
// ACTION: Re-exports all library types, registry, and adapters

// Types
export * from './types';

// Registry
export { 
  LIBRARY_TILES, 
  getTileById, 
  getTilesByCategory,
  getCommercialSafeTiles,
  getPersonalOnlyTiles,
  searchTiles,
} from './registry';

// Adapters
export { 
  getAdapter, 
  hasAdapter, 
  getAvailableAdapters,
  getAdapterNames,
  BIBLE_BOOKS,
  BIBLE_CHAPTERS,
} from './adapters';
