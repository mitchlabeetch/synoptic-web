// src/lib/email/drip.ts
// PURPOSE: Drip campaign email system
// ACTION: Schedules and sends onboarding emails over time
// MECHANISM: Database queue + cron job processing

import { query } from '@/lib/db/client';
import {
  sendTipsGettingStartedEmail,
  sendTipsProFeaturesEmail,
  sendTipsGridLockEmail,
  sendTipsPdfExportEmail,
  sendTipsSecurityEmail,
  sendMarketingSuccessEmail,
} from './resend';

// =============================================================================
// Drip Campaign Configuration
// =============================================================================

export interface DripEmail {
  id: string;
  name: string;
  delayDays: number;
  description: string;
}

// Define the drip sequence - 6 emails over 14 days
// Based on expert tips for maximum value delivery
export const DRIP_SEQUENCE: DripEmail[] = [
  {
    id: 'tips_getting_started',
    name: 'Getting Started Tips',
    delayDays: 1,
    description: '5 tips to master your first project',
  },
  {
    id: 'tips_grid_lock',
    name: 'Grid-Lock Deep Dive',
    delayDays: 3,
    description: 'Master the signature parallel alignment feature',
  },
  {
    id: 'tips_pro_features',
    name: 'Pro Features Tips',
    delayDays: 5,
    description: 'Hidden features: ⌘K, Pimsleur, Glossary Guard',
  },
  {
    id: 'tips_pdf_export',
    name: 'PDF Export Mastery',
    delayDays: 8,
    description: 'Print-perfect PDFs: DPI, page limits, preview',
  },
  {
    id: 'tips_security',
    name: 'Security & Trust',
    delayDays: 11,
    description: 'Why authors trust Synoptic with their manuscripts',
  },
  {
    id: 'marketing_success',
    name: 'Success Story',
    delayDays: 14,
    description: 'Inspiring story from the community',
  },
];

// =============================================================================
// Queue Management
// =============================================================================

/**
 * Schedule drip emails for a new user
 * Called after email verification
 */
export async function scheduleDripEmails(
  userId: string,
  email: string,
  name: string | null
): Promise<number> {
  let scheduled = 0;
  const now = new Date();

  for (const drip of DRIP_SEQUENCE) {
    const scheduledFor = new Date(now);
    scheduledFor.setDate(scheduledFor.getDate() + drip.delayDays);
    
    try {
      await query(
        `INSERT INTO drip_email_queue 
         (user_id, email, name, email_type, scheduled_for, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
         ON CONFLICT (user_id, email_type) DO NOTHING`,
        [userId, email, name, drip.id, scheduledFor.toISOString()]
      );
      scheduled++;
    } catch (error) {
      console.error(`[Drip] Failed to schedule ${drip.id} for ${email}:`, error);
    }
  }

  console.log(`[Drip] Scheduled ${scheduled} emails for ${email}`);
  return scheduled;
}

/**
 * Process pending drip emails
 * Called by cron job
 */
export async function processDripQueue(): Promise<{ sent: number; failed: number; skipped: number }> {
  const stats = { sent: 0, failed: 0, skipped: 0 };

  try {
    // Get emails that are due and not yet sent
    const result = await query<{
      id: string;
      user_id: string;
      email: string;
      name: string | null;
      email_type: string;
    }>(
      `SELECT id, user_id, email, name, email_type 
       FROM drip_email_queue 
       WHERE status = 'pending' 
         AND scheduled_for <= NOW()
       ORDER BY scheduled_for ASC
       LIMIT 50`  // Process in batches
    );

    console.log(`[Drip] Found ${result.rows.length} emails to process`);

    for (const row of result.rows) {
      // Check if user still exists and hasn't unsubscribed
      const userCheck = await query<{ email_verified: boolean }>(
        `SELECT email_verified FROM profiles WHERE id = $1`,
        [row.user_id]
      );

      if (userCheck.rows.length === 0) {
        // User deleted, skip
        await markDripEmail(row.id, 'skipped', 'User not found');
        stats.skipped++;
        continue;
      }

      // Send the appropriate email
      let success = false;
      let error = '';

      try {
        switch (row.email_type) {
          case 'tips_getting_started':
            const result1 = await sendTipsGettingStartedEmail(row.email, row.name);
            success = result1.success;
            error = result1.error || '';
            break;

          case 'tips_grid_lock':
            const result2 = await sendTipsGridLockEmail(row.email, row.name);
            success = result2.success;
            error = result2.error || '';
            break;

          case 'tips_pro_features':
            const result3 = await sendTipsProFeaturesEmail(row.email, row.name);
            success = result3.success;
            error = result3.error || '';
            break;

          case 'tips_pdf_export':
            const result4 = await sendTipsPdfExportEmail(row.email, row.name);
            success = result4.success;
            error = result4.error || '';
            break;

          case 'tips_security':
            const result5 = await sendTipsSecurityEmail(row.email, row.name);
            success = result5.success;
            error = result5.error || '';
            break;

          case 'marketing_success':
            const result6 = await sendMarketingSuccessEmail(row.email, row.name);
            success = result6.success;
            error = result6.error || '';
            break;

          default:
            console.warn(`[Drip] Unknown email type: ${row.email_type}`);
            await markDripEmail(row.id, 'skipped', `Unknown type: ${row.email_type}`);
            stats.skipped++;
            continue;
        }

        if (success) {
          await markDripEmail(row.id, 'sent');
          stats.sent++;
          console.log(`[Drip] Sent ${row.email_type} to ${row.email}`);
        } else {
          await markDripEmail(row.id, 'failed', error);
          stats.failed++;
          console.error(`[Drip] Failed ${row.email_type} to ${row.email}: ${error}`);
        }

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        await markDripEmail(row.id, 'failed', errMsg);
        stats.failed++;
        console.error(`[Drip] Exception sending ${row.email_type}:`, err);
      }

      // Rate limiting: wait 200ms between emails
      await new Promise(resolve => setTimeout(resolve, 200));
    }

  } catch (error) {
    console.error('[Drip] Queue processing error:', error);
  }

  return stats;
}

/**
 * Mark a drip email with its final status
 */
async function markDripEmail(
  queueId: string,
  status: 'sent' | 'failed' | 'skipped',
  error?: string
): Promise<void> {
  await query(
    `UPDATE drip_email_queue 
     SET status = $1, 
         sent_at = ${status === 'sent' ? 'NOW()' : 'NULL'},
         error = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [status, error || null, queueId]
  );
}

/**
 * Cancel drip emails for a user (e.g., if they unsubscribe)
 */
export async function cancelDripEmails(userId: string): Promise<number> {
  const result = await query(
    `UPDATE drip_email_queue 
     SET status = 'cancelled', updated_at = NOW()
     WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  
  return result.rowCount || 0;
}

/**
 * Get drip queue stats for admin dashboard
 */
export async function getDripStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const result = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*) as count 
     FROM drip_email_queue 
     GROUP BY status`
  );

  const stats = { pending: 0, sent: 0, failed: 0, skipped: 0 };
  
  for (const row of result.rows) {
    if (row.status in stats) {
      stats[row.status as keyof typeof stats] = parseInt(row.count, 10);
    }
  }

  return stats;
}
