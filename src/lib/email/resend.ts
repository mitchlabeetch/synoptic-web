// src/lib/email/resend.ts
// PURPOSE: Email service using Resend API
// ACTION: Sends transactional emails for auth, notifications, etc.
// MECHANISM: Uses Resend SDK with branded HTML templates

import { Resend } from 'resend';
import {
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
  marketingFeatureEmail,
  marketingSuccessEmail,
  tipsGettingStartedEmail,
  tipsProFeaturesEmail,
  orderConfirmationProEmail,
  orderConfirmationPublisherEmail,
  type EmailData,
} from './templates';

// Initialize Resend client (lazy - only when needed)
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('[Email] RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Default sender - verified domain email
const DEFAULT_FROM = 'Synoptic <contact@getsynoptic.com>';
const MARKETING_FROM = 'Synoptic News <news@getsynoptic.com>';

// =============================================================================
// Email Send Functions
// =============================================================================

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Generic email sender
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string = DEFAULT_FROM
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    
    const { data: result, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    
    if (error) {
      console.error('[Email] Failed to send email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`[Email] Email sent to ${to}, ID: ${result?.id}`);
    return { success: true, id: result?.id };
    
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception sending email:', message);
    return { success: false, error: message };
  }
}

// =============================================================================
// Transactional Email Functions
// =============================================================================

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  recipientName: string | null,
  resetUrl: string
): Promise<SendEmailResult> {
  const email = passwordResetEmail({
    recipientEmail,
    recipientName,
    resetUrl,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  recipientEmail: string,
  recipientName: string | null,
  verifyUrl: string
): Promise<SendEmailResult> {
  const email = verificationEmail({
    recipientEmail,
    recipientName,
    verifyUrl,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

/**
 * Send welcome email (after verification)
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string | null
): Promise<SendEmailResult> {
  const email = welcomeEmail({
    recipientEmail,
    recipientName,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

// =============================================================================
// Marketing Email Functions
// =============================================================================

/**
 * Send feature announcement marketing email
 */
export async function sendMarketingFeatureEmail(
  recipientEmail: string,
  recipientName: string | null,
  unsubscribeUrl?: string
): Promise<SendEmailResult> {
  const email = marketingFeatureEmail({
    recipientEmail,
    recipientName,
    unsubscribeUrl,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text, MARKETING_FROM);
}

/**
 * Send success story marketing email
 */
export async function sendMarketingSuccessEmail(
  recipientEmail: string,
  recipientName: string | null,
  unsubscribeUrl?: string
): Promise<SendEmailResult> {
  const email = marketingSuccessEmail({
    recipientEmail,
    recipientName,
    unsubscribeUrl,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text, MARKETING_FROM);
}

// =============================================================================
// Tips & Onboarding Email Functions
// =============================================================================

/**
 * Send getting started tips email
 */
export async function sendTipsGettingStartedEmail(
  recipientEmail: string,
  recipientName: string | null
): Promise<SendEmailResult> {
  const email = tipsGettingStartedEmail({
    recipientEmail,
    recipientName,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

/**
 * Send pro features tips email
 */
export async function sendTipsProFeaturesEmail(
  recipientEmail: string,
  recipientName: string | null
): Promise<SendEmailResult> {
  const email = tipsProFeaturesEmail({
    recipientEmail,
    recipientName,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

// =============================================================================
// Order Confirmation Email Functions
// =============================================================================

interface OrderDetails {
  planPrice: string;
  billingCycle: 'monthly' | 'yearly';
  orderId: string;
  orderDate: Date;
}

/**
 * Send Pro plan order confirmation
 */
export async function sendOrderConfirmationProEmail(
  recipientEmail: string,
  recipientName: string | null,
  order: OrderDetails
): Promise<SendEmailResult> {
  const email = orderConfirmationProEmail({
    recipientEmail,
    recipientName,
    planName: 'Synoptic Pro',
    ...order,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

/**
 * Send Publisher plan order confirmation
 */
export async function sendOrderConfirmationPublisherEmail(
  recipientEmail: string,
  recipientName: string | null,
  order: OrderDetails
): Promise<SendEmailResult> {
  const email = orderConfirmationPublisherEmail({
    recipientEmail,
    recipientName,
    planName: 'Synoptic Publisher',
    ...order,
  });
  
  return sendEmail(recipientEmail, email.subject, email.html, email.text);
}

// =============================================================================
// Batch Email Functions (for admin use)
// =============================================================================

export type EmailType = 
  | 'welcome'
  | 'tips_getting_started'
  | 'tips_pro_features'
  | 'marketing_feature'
  | 'marketing_success';

/**
 * Send a batch of emails (for admin/cron jobs)
 */
export async function sendBatchEmails(
  recipients: EmailData[],
  emailType: EmailType
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  
  for (const recipient of recipients) {
    let result: SendEmailResult;
    
    switch (emailType) {
      case 'welcome':
        result = await sendWelcomeEmail(recipient.recipientEmail, recipient.recipientName ?? null);
        break;
      case 'tips_getting_started':
        result = await sendTipsGettingStartedEmail(recipient.recipientEmail, recipient.recipientName ?? null);
        break;
      case 'tips_pro_features':
        result = await sendTipsProFeaturesEmail(recipient.recipientEmail, recipient.recipientName ?? null);
        break;
      case 'marketing_feature':
        result = await sendMarketingFeatureEmail(recipient.recipientEmail, recipient.recipientName ?? null);
        break;
      case 'marketing_success':
        result = await sendMarketingSuccessEmail(recipient.recipientEmail, recipient.recipientName ?? null);
        break;
      default:
        console.error(`[Email] Unknown email type: ${emailType}`);
        failed++;
        continue;
    }
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    
    // Rate limiting: wait 100ms between emails to avoid hitting Resend limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { sent, failed };
}
