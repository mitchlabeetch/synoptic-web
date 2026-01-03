'use client';

// src/hooks/useProjectSync.ts
// PURPOSE: Sync project state with cloud database
// ACTION: Loads project on mount, auto-saves on changes
// MECHANISM: Uses debounced API calls with version-based concurrency control

import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { debounce } from 'lodash';

interface SyncStatus {
  status: 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'conflict';
  lastSaved: Date | null;
  error: string | null;
  version: number;
}

export function useProjectSync(projectId: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSaved: null,
    error: null,
    version: 0,
  });

  const { content, settings, setContent, setSettings, setProjectMeta } =
    useProjectStore();
  const contentRef = useRef(content);
  const settingsRef = useRef(settings);
  
  // Version tracking to prevent out-of-order updates
  const localVersionRef = useRef(0);
  const pendingVersionRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    contentRef.current = content;
    settingsRef.current = settings;
    // Increment local version on any change
    localVersionRef.current++;
  }, [content, settings]);

  // Load project on mount
  useEffect(() => {
    async function loadProject() {
      setSyncStatus((s) => ({ ...s, status: 'loading' }));

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load project');
        }

        const data = await response.json();

        if (data.project) {
          setProjectMeta({
            id: data.project.id,
            title: data.project.title,
            source_lang: data.project.source_lang,
            target_lang: data.project.target_lang,
          });
          
          // Parse JSON content if it's a string
          const projectContent = typeof data.project.content === 'string' 
            ? JSON.parse(data.project.content) 
            : data.project.content;
          const projectSettings = typeof data.project.settings === 'string'
            ? JSON.parse(data.project.settings)
            : data.project.settings;
            
          setContent(projectContent);
          setSettings(projectSettings);
          
          // Initialize version from server
          const serverVersion = data.project.version || 0;
          localVersionRef.current = serverVersion;
          pendingVersionRef.current = serverVersion;
          
          setSyncStatus({
            status: 'saved',
            lastSaved: new Date(data.project.updated_at),
            error: null,
            version: serverVersion,
          });
        }
      } catch (error: unknown) {
        setSyncStatus({
          status: 'error',
          lastSaved: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          version: 0,
        });
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId, setContent, setSettings, setProjectMeta]);

  // Debounced save function with version control
  const saveToCloud = useCallback(
    debounce(async () => {
      // Capture the current local version at time of save
      const saveVersion = localVersionRef.current;
      
      // Don't save if a newer version is already pending
      if (saveVersion <= pendingVersionRef.current) {
        console.log('[ProjectSync] Skipping stale save (version mismatch)');
        return;
      }
      
      pendingVersionRef.current = saveVersion;
      setSyncStatus((s) => ({ ...s, status: 'saving' }));

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: contentRef.current,
            settings: settingsRef.current,
            clientVersion: saveVersion, // Server can use this for conflict detection
          }),
        });

        if (!response.ok) {
          // Check for version conflict
          if (response.status === 409) {
            setSyncStatus({
              status: 'conflict',
              lastSaved: null,
              error: 'Conflict: document was modified elsewhere',
              version: saveVersion,
            });
            return;
          }
          throw new Error('Failed to save project');
        }

        const data = await response.json();
        
        // Only update status if this is still the latest save
        if (saveVersion >= pendingVersionRef.current) {
          setSyncStatus({
            status: 'saved',
            lastSaved: new Date(),
            error: null,
            version: data.version || saveVersion,
          });
        }
      } catch (error: unknown) {
        // Only show error if this was the latest save attempt
        if (saveVersion >= pendingVersionRef.current) {
          setSyncStatus({
            status: 'error',
            lastSaved: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            version: saveVersion,
          });
        }
      }
    }, 2000),
    [projectId]
  );

  // Auto-save on content/settings change
  useEffect(() => {
    if (syncStatus.status !== 'loading' && syncStatus.status !== 'idle') {
      saveToCloud();
    }
  }, [content, settings, saveToCloud, syncStatus.status]);

  // Manual save
  const forceSave = useCallback(async () => {
    saveToCloud.flush();
  }, [saveToCloud]);

  return { syncStatus, forceSave };
}

