// src/app/api/export/audio/route.ts
// PURPOSE: Streaming audio export API using Edge TTS (Microsoft Neural Voices)
// ACTION: Converts text to high-quality MP3 audio using Microsoft's free Edge TTS API
// MECHANISM: Stateless processing - text in, MP3 stream out, no data retention

import { NextRequest, NextResponse } from 'next/server';
import { isValidVoiceId, getLocaleFromVoiceId } from '@/data/voices';

// ═══════════════════════════════════════════
// EDGE TTS DIRECT IMPLEMENTATION
// Using WebSocket connection to Microsoft's Edge TTS service
// ═══════════════════════════════════════════

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }).replace(/-/g, '');
}

function formatDate(): string {
  return new Date().toISOString();
}

function escapeSSML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSSML(text: string, voice: string, rate: string = '+0%', pitch: string = '+0Hz'): string {
  const locale = getLocaleFromVoiceId(voice);
  const escapedText = escapeSSML(text);
  
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">
    <voice name="${voice}">
      <prosody rate="${rate}" pitch="${pitch}" volume="+0%">
        ${escapedText}
      </prosody>
    </voice>
  </speak>`;
}

async function synthesizeWithEdgeTTS(
  text: string, 
  voice: string, 
  rate: string = '+0%'
): Promise<Buffer> {
  const WebSocket = (await import('ws')).default;
  
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();
    const timestamp = formatDate();
    
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${requestId}`;
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41',
      }
    });

    const audioChunks: Buffer[] = [];
    let hasReceivedAudio = false;
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('TTS timeout after 30 seconds'));
    }, 30000);

    ws.on('open', () => {
      // Send configuration message
      const configMessage = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataOptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMessage);
      
      // Send SSML message
      const ssml = buildSSML(text, voice, rate);
      const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMessage);
    });

    ws.on('message', (data: Buffer | string) => {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      // Check if this is audio data
      const headerEnd = dataBuffer.indexOf(Buffer.from('Path:audio\r\n'));
      if (headerEnd !== -1) {
        // Find the actual audio data after the header
        const audioStart = dataBuffer.indexOf(Buffer.from('\r\n\r\n'), headerEnd) + 4;
        if (audioStart > 3) {
          const audioData = dataBuffer.slice(audioStart);
          if (audioData.length > 0) {
            audioChunks.push(audioData);
            hasReceivedAudio = true;
          }
        }
      }
      
      // Check for end of turn
      if (dataBuffer.toString().includes('Path:turn.end')) {
        clearTimeout(timeout);
        ws.close();
        
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error('No audio data received'));
        }
      }
    });

    ws.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      if (!hasReceivedAudio && audioChunks.length === 0) {
        reject(new Error('WebSocket closed without receiving audio'));
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId, rate = '+0%' } = body;

    // ───────────────────────────────────────
    // VALIDATION
    // ───────────────────────────────────────
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text parameter' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 10,000 characters per request' },
        { status: 400 }
      );
    }

    // Validate and sanitize voice ID
    const safeVoice = voiceId && isValidVoiceId(voiceId) 
      ? voiceId 
      : 'en-US-AriaNeural';

    // ───────────────────────────────────────
    // AUDIO SYNTHESIS
    // ───────────────────────────────────────
    console.log(`[Audio API] Synthesizing ${text.length} chars with voice: ${safeVoice}`);
    
    const audioBuffer = await synthesizeWithEdgeTTS(text, safeVoice, rate);

    // ───────────────────────────────────────
    // RESPONSE
    // ───────────────────────────────────────
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': 'attachment; filename="audio.mp3"',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Audio-Voice': safeVoice,
      },
    });

  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json(
      { error: 'Audio generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


