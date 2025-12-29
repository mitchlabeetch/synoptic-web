'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/lib/store/projectStore';
import { debounce } from 'lodash';

interface SyncStatus {
  status: 'idle' | 'loading' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

export function useProjectSync(projectId: string) {
  const supabase = createClient();
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

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        setSyncStatus({
          status: 'error',
          lastSaved: null,
          error: error.message,
        });
        return;
      }

      if (data) {
        setProjectMeta({
          id: data.id,
          title: data.title,
          source_lang: data.source_lang,
          target_lang: data.target_lang,
        });
        setContent(data.content);
        setSettings(data.settings);
        setSyncStatus({
          status: 'saved',
          lastSaved: new Date(data.updated_at),
          error: null,
        });
      }
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId, supabase, setContent, setSettings, setProjectMeta]);

  // Debounced save function
  const saveToCloud = useCallback(
    debounce(async () => {
      setSyncStatus((s) => ({ ...s, status: 'saving' }));

      const { error } = await supabase
        .from('projects')
        .update({
          content: contentRef.current,
          settings: settingsRef.current,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) {
        setSyncStatus({
          status: 'error',
          lastSaved: null,
          error: error.message,
        });
      } else {
        setSyncStatus({ status: 'saved', lastSaved: new Date(), error: null });
      }
    }, 2000),
    [projectId, supabase]
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
