// src/lib/hooks/useStreamingAnnotation.ts
// PURPOSE: Hook for consuming streaming AI annotation responses
// ACTION: Connects to SSE endpoint and provides progress/result state
// MECHANISM: Uses EventSource pattern for Server-Sent Events

import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/Toast';

interface AnnotationProgress {
  phase: 'idle' | 'started' | 'retrieving' | 'analyzing' | 'generating' | 'parsing' | 'complete' | 'error';
  message: string;
  chars?: number;
}

interface AnnotationResult {
  wordGroups: Array<{
    language: 'L1' | 'L2';
    wordIndices: number[];
    role: string;
    color: string;
  }>;
  arrows: Array<{
    source: { language: 'L1' | 'L2'; words: number[] };
    target: { language: 'L1' | 'L2'; words: number[] };
    label?: string;
  }>;
  notes: Array<{
    type: 'grammar' | 'vocabulary' | 'culture';
    wordIndex: number;
    language: 'L1' | 'L2';
    title: string;
    content: string;
  }>;
  creditsUsed?: number;
}

interface UseStreamingAnnotationReturn {
  progress: AnnotationProgress;
  result: AnnotationResult | null;
  isStreaming: boolean;
  annotate: (L1Text: string, L2Text: string, L1Lang: string, L2Lang: string) => Promise<AnnotationResult | null>;
  abort: () => void;
}

/**
 * Hook for streaming AI annotations with progress updates.
 * Uses Server-Sent Events to avoid timeout issues with long-running AI tasks.
 */
export function useStreamingAnnotation(): UseStreamingAnnotationReturn {
  const [progress, setProgress] = useState<AnnotationProgress>({
    phase: 'idle',
    message: '',
  });
  const [result, setResult] = useState<AnnotationResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setProgress({ phase: 'idle', message: 'Cancelled' });
    }
  }, []);

  const annotate = useCallback(async (
    L1Text: string, 
    L2Text: string, 
    L1Lang: string, 
    L2Lang: string
  ): Promise<AnnotationResult | null> => {
    // Abort any existing request
    abort();
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsStreaming(true);
    setResult(null);
    setProgress({ phase: 'started', message: 'Starting annotation...' });

    try {
      const response = await fetch('/api/ai/annotate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ L1Text, L2Text, L1Lang, L2Lang }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: AnnotationResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer
        
        for (const message of messages) {
          if (!message.trim()) continue;
          
          const eventMatch = message.match(/^event:\s*(.+)$/m);
          const dataMatch = message.match(/^data:\s*(.+)$/m);
          
          if (!eventMatch || !dataMatch) continue;
          
          const eventType = eventMatch[1];
          let eventData: Record<string, unknown>;
          
          try {
            eventData = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }
          
          switch (eventType) {
            case 'status':
              setProgress({
                phase: eventData.phase as AnnotationProgress['phase'],
                message: eventData.message as string,
              });
              break;
              
            case 'context':
              // Optional: could update UI with context info
              break;
              
            case 'progress':
              setProgress(prev => ({
                ...prev,
                chars: eventData.chars as number,
              }));
              break;
              
            case 'complete':
              finalResult = eventData as unknown as AnnotationResult;
              setResult(finalResult);
              setProgress({ phase: 'complete', message: 'Annotation complete!' });
              if (finalResult.creditsUsed) {
                toast.credits(finalResult.creditsUsed);
              }
              break;
              
            case 'error':
              const errorMsg = eventData.message as string;
              toast.error('Annotation failed', { description: errorMsg });
              setProgress({ phase: 'error', message: errorMsg });
              break;
          }
        }
      }

      return finalResult;
      
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled - don't show error
        return null;
      }
      
      const message = (error as Error).message || 'Annotation failed';
      toast.error('Annotation failed', { description: message });
      setProgress({ phase: 'error', message });
      return null;
      
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [abort]);

  return {
    progress,
    result,
    isStreaming,
    annotate,
    abort,
  };
}

/**
 * Fallback non-streaming annotation for shorter texts.
 * Uses the regular POST endpoint which is faster for quick tasks.
 */
export async function annotateSync(
  L1Text: string,
  L2Text: string,
  L1Lang: string,
  L2Lang: string
): Promise<AnnotationResult | null> {
  try {
    const response = await fetch('/api/ai/annotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ L1Text, L2Text, L1Lang, L2Lang }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Annotation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Sync annotation error:', error);
    return null;
  }
}

// Threshold for choosing streaming vs sync (characters)
export const STREAMING_THRESHOLD = 500;

/**
 * Smart annotation function that chooses streaming or sync based on text length.
 * - Short texts (< 500 chars): Use sync for speed
 * - Long texts (>= 500 chars): Use streaming to avoid timeouts
 */
export function shouldUseStreaming(L1Text: string, L2Text: string): boolean {
  return (L1Text.length + L2Text.length) >= STREAMING_THRESHOLD;
}
