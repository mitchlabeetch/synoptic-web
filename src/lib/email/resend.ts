// src/lib/email/resend.ts
// PURPOSE: Email service using Resend API
// ACTION: Sends transactional emails for auth, notifications, etc.
// MECHANISM: Uses Resend SDK with React-like HTML templates

import { Resend } from 'resend';

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

// =============================================================================
// Email Templates
// =============================================================================

interface PasswordResetEmailData {
  recipientEmail: string;
  recipientName: string | null;
  resetUrl: string;
}

/**
 * Generate password reset email HTML
 */
function getPasswordResetEmailHtml(data: PasswordResetEmailData): string {
  const name = data.recipientName || 'there';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #22687a 0%, #30b8c8 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Synoptic</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">The Bilingual Publishing Engine</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #1a1a1a;">Reset Your Password</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${data.resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22687a 0%, #30b8c8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 12px rgba(34, 104, 122, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <!-- Fallback URL -->
              <div style="margin-top: 32px; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6a6a6a;">
                  If the button doesn't work, copy and paste this link:
                </p>
                <p style="margin: 0; font-size: 12px; color: #22687a; word-break: break-all;">
                  ${data.resetUrl}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9a9a9a; text-align: center;">
                © ${new Date().getFullYear()} Synoptic Studio. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9a9a9a; text-align: center;">
                <a href="https://getsynoptic.com" style="color: #22687a; text-decoration: none;">getsynoptic.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getPasswordResetEmailText(data: PasswordResetEmailData): string {
  const name = data.recipientName || 'there';
  
  return `
Hi ${name},

We received a request to reset your password for your Synoptic account.

Click this link to create a new password:
${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Synoptic Studio
https://getsynoptic.com
  `.trim();
}

// =============================================================================
// Email Send Functions
// =============================================================================

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  recipientName: string | null,
  resetUrl: string
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    
    const data: PasswordResetEmailData = {
      recipientEmail,
      recipientName,
      resetUrl,
    };
    
    const { data: result, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: recipientEmail,
      subject: 'Reset your Synoptic password',
      html: getPasswordResetEmailHtml(data),
      text: getPasswordResetEmailText(data),
    });
    
    if (error) {
      console.error('[Email] Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`[Email] Password reset email sent to ${recipientEmail}, ID: ${result?.id}`);
    return { success: true, id: result?.id };
    
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception sending password reset email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  recipientEmail: string,
  recipientName: string | null,
  verifyUrl: string
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const name = recipientName || 'there';
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #22687a 0%, #30b8c8 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Synoptic</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #1a1a1a;">Verify Your Email</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi ${name}, welcome to Synoptic! Please verify your email address to get started.
              </p>
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22687a 0%, #30b8c8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                This link expires in 24 hours.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 12px; color: #9a9a9a; text-align: center;">
                © ${new Date().getFullYear()} Synoptic Studio
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    
    const text = `
Hi ${name},

Welcome to Synoptic! Please verify your email address by clicking this link:
${verifyUrl}

This link expires in 24 hours.

---
Synoptic Studio
https://getsynoptic.com
    `.trim();
    
    const { data: result, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: recipientEmail,
      subject: 'Verify your Synoptic account',
      html,
      text,
    });
    
    if (error) {
      console.error('[Email] Failed to send verification email:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`[Email] Verification email sent to ${recipientEmail}, ID: ${result?.id}`);
    return { success: true, id: result?.id };
    
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Exception sending verification email:', message);
    return { success: false, error: message };
  }
}
