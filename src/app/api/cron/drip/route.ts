// src/app/api/cron/drip/route.ts
// PURPOSE: Process drip email queue
// ACTION: Sends scheduled emails that are due
// MECHANISM: Called by external scheduler (cron-job.org, DigitalOcean, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { processDripQueue, getDripStats } from '@/lib/email/drip';

// Secret key to authorize cron requests
const CRON_SECRET = process.env.CRON_SECRET || 'default-cron-secret-change-me';

/**
 * GET: Get drip queue stats (for monitoring)
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');
  
  if (providedSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const stats = await getDripStats();
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Drip] Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}

/**
 * POST: Process the drip queue
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');
  
  if (providedSecret !== CRON_SECRET) {
    console.warn('[Cron Drip] Unauthorized request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[Cron Drip] Starting queue processing...');

  try {
    const result = await processDripQueue();
    const duration = Date.now() - startTime;

    console.log(`[Cron Drip] Completed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron Drip] Processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Processing failed',
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
