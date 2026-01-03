// src/lib/offline/draftPersistence.ts
// PURPOSE: Offline-first draft persistence using IndexedDB
// ACTION: Saves editor state locally to prevent data loss during network issues
// MECHANISM: Uses idb-keyval for simple IndexedDB access with auto-recovery on page load

import { ProjectContent } from '@/types/blocks';

// =============================================================================
// IndexedDB Configuration
// =============================================================================

const DB_NAME = 'synoptic-offline';
const DB_VERSION = 1;
const DRAFTS_STORE = 'drafts';
const SETTINGS_STORE = 'settings';

// =============================================================================
// Types
// =============================================================================

export interface DraftEntry {
  projectId: string;
  content: ProjectContent;
  timestamp: number;
  dirty: boolean; // True if not yet synced to server
}

export interface OfflineSettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;
  maxDraftsToKeep: number;
}

const DEFAULT_SETTINGS: OfflineSettings = {
  autoSaveEnabled: true,
  autoSaveIntervalMs: 5000, // 5 seconds
  maxDraftsToKeep: 10,
};

// =============================================================================
// IndexedDB Initialization
// =============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on server'));
  }
  
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.error('[Offline] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create drafts store
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          const draftsStore = db.createObjectStore(DRAFTS_STORE, { keyPath: 'projectId' });
          draftsStore.createIndex('timestamp', 'timestamp', { unique: false });
          draftsStore.createIndex('dirty', 'dirty', { unique: false });
        }
        
        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
    });
  }
  
  return dbPromise;
}

// =============================================================================
// Draft Operations
// =============================================================================

/**
 * Save a project draft to IndexedDB
 */
export async function saveDraft(
  projectId: string, 
  content: ProjectContent,
  markDirty = true
): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    const entry: DraftEntry = {
      projectId,
      content,
      timestamp: Date.now(),
      dirty: markDirty,
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`[Offline] Draft saved: ${projectId.slice(0, 8)}...`);
  } catch (error) {
    console.error('[Offline] Failed to save draft:', error);
    // Don't throw - saving should be resilient
  }
}

/**
 * Load a project draft from IndexedDB
 */
export async function loadDraft(projectId: string): Promise<DraftEntry | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(projectId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to load draft:', error);
    return null;
  }
}

/**
 * Delete a project draft from IndexedDB
 */
export async function deleteDraft(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`[Offline] Draft deleted: ${projectId.slice(0, 8)}...`);
  } catch (error) {
    console.error('[Offline] Failed to delete draft:', error);
  }
}

/**
 * Mark a draft as synced (no longer dirty)
 */
export async function markDraftSynced(projectId: string): Promise<void> {
  try {
    const draft = await loadDraft(projectId);
    if (draft) {
      await saveDraft(projectId, draft.content, false);
    }
  } catch (error) {
    console.error('[Offline] Failed to mark draft synced:', error);
  }
}

/**
 * Get all unsynchronized (dirty) drafts
 */
export async function getDirtyDrafts(): Promise<DraftEntry[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const index = store.index('dirty');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(true));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to get dirty drafts:', error);
    return [];
  }
}

/**
 * Get all drafts sorted by timestamp
 */
export async function getAllDrafts(): Promise<DraftEntry[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to get all drafts:', error);
    return [];
  }
}

/**
 * Cleanup old drafts, keeping only the most recent ones
 */
export async function cleanupOldDrafts(maxToKeep: number = DEFAULT_SETTINGS.maxDraftsToKeep): Promise<void> {
  try {
    const drafts = await getAllDrafts();
    
    // Sort by timestamp descending
    drafts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Delete old drafts beyond the limit
    const toDelete = drafts.slice(maxToKeep);
    for (const draft of toDelete) {
      await deleteDraft(draft.projectId);
    }
    
    if (toDelete.length > 0) {
      console.log(`[Offline] Cleaned up ${toDelete.length} old drafts`);
    }
  } catch (error) {
    console.error('[Offline] Failed to cleanup old drafts:', error);
  }
}

/**
 * Check if there's a newer local draft than server data
 */
export async function hasNewerLocalDraft(
  projectId: string, 
  serverUpdatedAt: Date | string | number
): Promise<boolean> {
  try {
    const draft = await loadDraft(projectId);
    if (!draft) return false;
    
    const serverTime = typeof serverUpdatedAt === 'number' 
      ? serverUpdatedAt 
      : new Date(serverUpdatedAt).getTime();
    
    return draft.timestamp > serverTime;
  } catch (error) {
    console.error('[Offline] Failed to check for newer draft:', error);
    return false;
  }
}

// =============================================================================
// Settings Operations
// =============================================================================

/**
 * Get offline settings
 */
export async function getOfflineSettings(): Promise<OfflineSettings> {
  try {
    const db = await getDB();
    const transaction = db.transaction(SETTINGS_STORE, 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get('offlineSettings');
      request.onsuccess = () => resolve(request.result?.value || DEFAULT_SETTINGS);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save offline settings
 */
export async function saveOfflineSettings(settings: Partial<OfflineSettings>): Promise<void> {
  try {
    const db = await getDB();
    const current = await getOfflineSettings();
    const updated = { ...current, ...settings };
    
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: 'offlineSettings', value: updated });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to save settings:', error);
  }
}

// =============================================================================
// Visibility Change Handler
// =============================================================================

/**
 * Setup auto-save on visibility change (when user leaves tab)
 */
export function setupVisibilitySaveHandler(
  getProjectState: () => { projectId: string | null; content: ProjectContent | null }
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      const { projectId, content } = getProjectState();
      if (projectId && content) {
        // Use synchronous-ish save for visibility change
        saveDraft(projectId, content).catch(console.error);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Setup periodic auto-save
 */
export function setupAutoSave(
  getProjectState: () => { projectId: string | null; content: ProjectContent | null },
  intervalMs: number = DEFAULT_SETTINGS.autoSaveIntervalMs
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const intervalId = setInterval(() => {
    const { projectId, content } = getProjectState();
    if (projectId && content) {
      saveDraft(projectId, content).catch(console.error);
    }
  }, intervalMs);
  
  return () => {
    clearInterval(intervalId);
  };
}
