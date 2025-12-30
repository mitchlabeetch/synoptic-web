// src/types/audioLab.ts
// PURPOSE: Type definitions for the Audio Lab (Pimsleur Mode) system
// ACTION: Defines configuration for interleaved bilingual audio generation
// MECHANISM: Settings for pause durations, voice selection, and export modes

/**
 * Audio export modes available in the Audio Lab.
 */
export type AudioExportMode = 
  | 'standard'     // L2 only (current behavior - good for listening)
  | 'pimsleur';    // L1 → pause → L2 (Pimsleur-style learning)

/**
 * Configuration for the Pimsleur-style audio generation.
 */
export interface PimsleurSettings {
  /** Duration of silence before source language reading (in seconds) */
  preSourcePause: number;
  /** Duration of "thinking pause" between L1 and L2 (in seconds) */
  thinkingPause: number;
  /** Duration of silence after target language reading (in seconds) */
  postTargetPause: number;
}

/**
 * Complete Audio Lab configuration for a project.
 */
export interface AudioLabConfig {
  /** The export mode */
  mode: AudioExportMode;
  
  /** Voice ID for the SOURCE language (L1) - used in Pimsleur mode */
  sourceVoiceId: string;
  
  /** Voice ID for the TARGET language (L2) */
  targetVoiceId: string;
  
  /** Pimsleur-specific timing settings */
  pimsleurSettings: PimsleurSettings;
  
  /** Whether to split output by chapter (true) or generate one long file (false) */
  splitByChapter: boolean;
  
  /** Whether to slow down playback for learners (0.7x) */
  slowMode: boolean;
}

/**
 * Default Pimsleur settings based on the original Pimsleur method research.
 * - 2s pre-pause: Mental preparation
 * - 3s thinking pause: Enough time to attempt production before hearing the answer
 * - 1s post-pause: Consolidation before next pair
 */
export const DEFAULT_PIMSLEUR_SETTINGS: PimsleurSettings = {
  preSourcePause: 2,
  thinkingPause: 3,
  postTargetPause: 1,
};

/**
 * Default Audio Lab configuration.
 */
export const DEFAULT_AUDIO_LAB_CONFIG: AudioLabConfig = {
  mode: 'standard',
  sourceVoiceId: '',
  targetVoiceId: '',
  pimsleurSettings: DEFAULT_PIMSLEUR_SETTINGS,
  splitByChapter: true,
  slowMode: false,
};

/**
 * A single audio segment task for the generator queue.
 */
export interface AudioSegment {
  /** Unique ID for this segment */
  id: string;
  /** Type of segment */
  type: 'speech' | 'silence';
  /** Content (text for speech, empty for silence) */
  text?: string;
  /** Voice ID to use (for speech segments) */
  voiceId?: string;
  /** Duration in seconds (for silence segments) */
  durationSeconds?: number;
  /** Language indicator */
  language?: 'L1' | 'L2';
}

/**
 * Generates a silence audio buffer of specified duration.
 * Uses Web Audio API to create silence as an AudioBuffer.
 * 
 * @param durationSeconds - Duration of silence in seconds
 * @returns Blob containing MP3-encoded silence
 */
export function generateSilenceBlob(durationSeconds: number): Blob {
  // Create a minimal MP3 frame of silence
  // For simplicity, we'll use a series of empty MP3 frames
  // Each MP3 frame at 128kbps, 44.1kHz is approximately 26.12ms
  const framesNeeded = Math.ceil((durationSeconds * 1000) / 26.12);
  
  // Minimal MP3 silent frame (128kbps, 44.1kHz)
  // This is a valid MP3 frame header + silent audio data
  const silentFrame = new Uint8Array([
    0xFF, 0xFB, 0x90, 0x00, // MP3 Frame Header (MPEG1 Layer3, 128kbps, 44100Hz)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    // Padding to reach frame size (~417 bytes for 128kbps/44.1kHz)
    ...new Array(380).fill(0x00)
  ]);
  
  // Build the full silence buffer
  const fullBuffer = new Uint8Array(silentFrame.length * framesNeeded);
  for (let i = 0; i < framesNeeded; i++) {
    fullBuffer.set(silentFrame, i * silentFrame.length);
  }
  
  return new Blob([fullBuffer], { type: 'audio/mpeg' });
}
