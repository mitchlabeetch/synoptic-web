'use client';

// src/hooks/useProjectSync.ts
// PURPOSE: Sync project state with cloud database
// ACTION: Loads project on mount, auto-saves on changes
// MECHANISM: Uses debounced API calls to sync with PostgreSQL

import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';
import { debounce } from 'lodash';

interface SyncStatus {
  status: 'idle' | 'loading' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

export function useProjectSync(projectId: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSaved: null,
    error: null,
  });

  const { content, settings, setContent, setSettings, setProjectMeta } =
    useProjectStore();
  const contentRef = useRef(content);
  const settingsRef = useRef(settings);

  // Keep refs in sync
  useEffect(() => {
    contentRef.current = content;
    settingsRef.current = settings;
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
          setSyncStatus({
            status: 'saved',
            lastSaved: new Date(data.project.updated_at),
            error: null,
          });
        }
      } catch (error: unknown) {
        setSyncStatus({
          status: 'error',
          lastSaved: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId, setContent, setSettings, setProjectMeta]);

  // Debounced save function
  const saveToCloud = useCallback(
    debounce(async () => {
      setSyncStatus((s) => ({ ...s, status: 'saving' }));

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: contentRef.current,
            settings: settingsRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save project');
        }

        setSyncStatus({ status: 'saved', lastSaved: new Date(), error: null });
      } catch (error: unknown) {
        setSyncStatus({
          status: 'error',
          lastSaved: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
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
