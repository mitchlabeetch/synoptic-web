// src/lib/email/templates.ts
// PURPOSE: Reusable email template components and styles
// ACTION: Provides consistent Synoptic branding across all emails
// MECHANISM: Generates HTML email templates with proper inline CSS

// =============================================================================
// Brand Constants
// =============================================================================

const BRAND = {
  name: 'Synoptic',
  tagline: 'The Bilingual Publishing Engine',
  url: 'https://getsynoptic.com',
  logoUrl: 'https://getsynoptic.com/logo-icon.svg',
  colors: {
    primary: '#22687a',
    secondary: '#30b8c8',
    accent: '#f9726e',
    dark: '#1a1a1a',
    muted: '#6a6a6a',
    light: '#f4f4f5',
    white: '#ffffff',
  },
  fonts: {
    heading: "'Outfit', 'Helvetica Neue', Arial, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  social: {
    twitter: 'https://twitter.com/getsynoptic',
    linkedin: 'https://linkedin.com/company/synoptic',
  },
};

// =============================================================================
// Base Template Components
// =============================================================================

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: ${BRAND.fonts.body}; background-color: ${BRAND.colors.light}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: ${BRAND.colors.light};">
    <tr>
      <td style="padding: 40px 20px;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function emailHeader(showTagline = true): string {
  return `
        <tr>
          <td style="background: linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.secondary} 100%); padding: 32px 40px; text-align: center; border-radius: 16px 16px 0 0;">
            <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="48" height="48" style="display: block; margin: 0 auto 12px; border-radius: 8px;" />
            <h1 style="color: ${BRAND.colors.white}; margin: 0; font-size: 28px; font-weight: 700; font-family: ${BRAND.fonts.heading}; letter-spacing: -0.5px; text-transform: lowercase;">synoptic</h1>
            ${showTagline ? `<p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">${BRAND.tagline}</p>` : ''}
          </td>
        </tr>
  `;
}

function emailFooter(): string {
  return `
        <tr>
          <td style="padding: 32px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5; border-radius: 0 0 16px 16px;">
            <table role="presentation" style="width: 100%;">
              <tr>
                <td style="text-align: center;">
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: ${BRAND.colors.muted};">
                    Made with ❤️ by the Synoptic team
                  </p>
                  <p style="margin: 0 0 16px 0;">
                    <a href="${BRAND.url}" style="color: ${BRAND.colors.primary}; text-decoration: none; font-weight: 600;">getsynoptic.com</a>
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #9a9a9a;">
                    © ${new Date().getFullYear()} Synoptic Studio. All rights reserved.<br>
                    <a href="${BRAND.url}/privacy" style="color: #9a9a9a;">Privacy Policy</a> • 
                    <a href="${BRAND.url}/terms" style="color: #9a9a9a;">Terms of Service</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
  `;
}

function ctaButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const bgColor = variant === 'primary' 
    ? `linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.secondary} 100%)`
    : BRAND.colors.white;
  const textColor = variant === 'primary' ? BRAND.colors.white : BRAND.colors.primary;
  const border = variant === 'secondary' ? `2px solid ${BRAND.colors.primary}` : 'none';
  
  return `
    <table role="presentation" style="width: 100%; margin: 24px 0;">
      <tr>
        <td style="text-align: center;">
          <a href="${url}" style="display: inline-block; padding: 16px 40px; background: ${bgColor}; color: ${textColor}; text-decoration: none; font-size: 16px; font-weight: 600; font-family: ${BRAND.fonts.heading}; border-radius: 12px; border: ${border}; box-shadow: 0 4px 12px rgba(34, 104, 122, 0.25);">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function emailCard(content: string): string {
  return `
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: ${BRAND.colors.white}; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.03); overflow: hidden;">
          ${content}
        </table>
  `;
}

// =============================================================================
// Email Templates
// =============================================================================

export interface EmailData {
  recipientName?: string | null;
  recipientEmail: string;
}

// -----------------------------------------------------------------------------
// 1. Password Reset Email
// -----------------------------------------------------------------------------
interface PasswordResetData extends EmailData {
  resetUrl: string;
}

export function passwordResetEmail(data: PasswordResetData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">Reset Your Password</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        ${ctaButton('Reset Password', data.resetUrl)}
        <p style="margin: 24px 0 16px 0; font-size: 14px; line-height: 1.6; color: ${BRAND.colors.muted};">
          ⏰ This link will expire in <strong>1 hour</strong> for security reasons.
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: ${BRAND.colors.muted};">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        <div style="margin-top: 32px; padding: 16px; background-color: ${BRAND.colors.light}; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: ${BRAND.colors.muted};">
            If the button doesn't work, copy and paste this link:
          </p>
          <p style="margin: 0; font-size: 12px; color: ${BRAND.colors.primary}; word-break: break-all;">
            ${data.resetUrl}
          </p>
        </div>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

We received a request to reset your password for your Synoptic account.

Click this link to create a new password:
${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: 'Reset your Synoptic password' };
}

// -----------------------------------------------------------------------------
// 2. Email Verification
// -----------------------------------------------------------------------------
interface VerificationData extends EmailData {
  verifyUrl: string;
}

export function verificationEmail(data: VerificationData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">Verify Your Email</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name}, welcome to Synoptic! 🎉
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Please verify your email address to unlock full access to your bilingual publishing studio.
        </p>
        ${ctaButton('Verify Email Address', data.verifyUrl)}
        <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: ${BRAND.colors.muted};">
          ⏰ This link expires in 24 hours.
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

Welcome to Synoptic! 🎉

Please verify your email address by clicking this link:
${data.verifyUrl}

This link expires in 24 hours.

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: 'Verify your Synoptic account' };
}

// -----------------------------------------------------------------------------
// 3. Welcome Email (sent after verification)
// -----------------------------------------------------------------------------
export function welcomeEmail(data: EmailData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">Welcome to Synoptic! 🚀</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Your email is verified and your account is ready. You're now part of a growing community of authors, polyglots, and publishers creating beautiful bilingual books.
        </p>
        
        <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(34,104,122,0.05) 0%, rgba(48,184,200,0.05) 100%); border-radius: 12px; border-left: 4px solid ${BRAND.colors.secondary};">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">Here's what you can do:</h3>
          <table role="presentation" style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">
                ✨ <strong>Create your first project</strong> from scratch or import from our library
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">
                🤖 <strong>Use AI-powered translations</strong> with 100 free credits
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">
                📚 <strong>Export to PDF & EPUB</strong> for print or digital publishing
              </td>
            </tr>
          </table>
        </div>
        
        ${ctaButton('Go to My Dashboard', `${BRAND.url}/dashboard`)}
        
        <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Need help getting started? Reply to this email and we'll be happy to assist!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

Welcome to Synoptic! 🚀

Your email is verified and your account is ready. You're now part of a growing community of authors, polyglots, and publishers creating beautiful bilingual books.

Here's what you can do:
✨ Create your first project from scratch or import from our library
🤖 Use AI-powered translations with 100 free credits
📚 Export to PDF & EPUB for print or digital publishing

Go to your dashboard: ${BRAND.url}/dashboard

Need help getting started? Reply to this email and we'll be happy to assist!

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: 'Welcome to Synoptic! Your studio is ready 🎉' };
}

// -----------------------------------------------------------------------------
// 4. Marketing Email 1: Feature Announcement
// -----------------------------------------------------------------------------
interface MarketingData extends EmailData {
  unsubscribeUrl?: string;
}

export function marketingFeatureEmail(data: MarketingData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  const unsubscribeUrl = data.unsubscribeUrl || `${BRAND.url}/unsubscribe`;
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: ${BRAND.colors.secondary}; text-transform: uppercase; letter-spacing: 1px;">
          ✨ New Feature
        </p>
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">Introducing AI-Powered Grammar Painter</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          We've just released a powerful new feature that makes language learning even more intuitive: <strong>Grammar Painter</strong>.
        </p>
        
        <div style="margin: 24px 0; padding: 24px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">What's new:</h3>
          <table role="presentation" style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">
                🎨 <strong>Color-code grammar</strong> - Highlight subjects, verbs, objects with distinct colors
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">
                🔗 <strong>Syntax arrows</strong> - Draw connections between related words
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">
                📖 <strong>Export annotations</strong> - Your grammar markup exports to PDF
              </td>
            </tr>
          </table>
        </div>
        
        ${ctaButton('Try Grammar Painter', `${BRAND.url}/dashboard`)}
        
        <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #9a9a9a;">
          <a href="${unsubscribeUrl}" style="color: #9a9a9a;">Unsubscribe</a> from marketing emails
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

✨ NEW FEATURE: Introducing AI-Powered Grammar Painter

We've just released a powerful new feature that makes language learning even more intuitive.

What's new:
🎨 Color-code grammar - Highlight subjects, verbs, objects with distinct colors
🔗 Syntax arrows - Draw connections between related words  
📖 Export annotations - Your grammar markup exports to PDF

Try it now: ${BRAND.url}/dashboard

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}

Unsubscribe: ${unsubscribeUrl}
  `.trim();
  
  return { html, text, subject: '✨ New: AI-Powered Grammar Painter is here!' };
}

// -----------------------------------------------------------------------------
// 5. Marketing Email 2: Success Story / Social Proof
// -----------------------------------------------------------------------------
export function marketingSuccessEmail(data: MarketingData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  const unsubscribeUrl = data.unsubscribeUrl || `${BRAND.url}/unsubscribe`;
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">"I published my first bilingual book in 3 days"</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          We wanted to share an inspiring story from our community.
        </p>
        
        <div style="margin: 24px 0; padding: 24px; background-color: ${BRAND.colors.light}; border-radius: 12px; border-left: 4px solid ${BRAND.colors.accent};">
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.dark}; font-style: italic;">
            "As a French teacher, I'd spent months trying to create a proper bilingual reader for my students. With Synoptic, I imported a classic from the library, added my own annotations, and had a print-ready PDF in just 3 days. My students love it!"
          </p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.muted};">
            — Marie L., Language Teacher, Lyon
          </p>
        </div>
        
        <p style="margin: 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Join 2,000+ authors and educators who are transforming how bilingual content is created.
        </p>
        
        ${ctaButton('Start Your Project', `${BRAND.url}/dashboard`)}
        
        <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #9a9a9a;">
          <a href="${unsubscribeUrl}" style="color: #9a9a9a;">Unsubscribe</a> from marketing emails
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

"I published my first bilingual book in 3 days"

We wanted to share an inspiring story from our community:

"As a French teacher, I'd spent months trying to create a proper bilingual reader for my students. With Synoptic, I imported a classic from the library, added my own annotations, and had a print-ready PDF in just 3 days. My students love it!"

— Marie L., Language Teacher, Lyon

Join 2,000+ authors and educators who are transforming how bilingual content is created.

Start your project: ${BRAND.url}/dashboard

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}

Unsubscribe: ${unsubscribeUrl}
  `.trim();
  
  return { html, text, subject: '"I published my first bilingual book in 3 days" 📚' };
}

// -----------------------------------------------------------------------------
// 6. Tips Email 1: Getting Started
// -----------------------------------------------------------------------------
export function tipsGettingStartedEmail(data: EmailData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: ${BRAND.colors.secondary}; text-transform: uppercase; letter-spacing: 1px;">
          💡 Quick Tips
        </p>
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">5 Tips to Master Your First Project</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Here are our top tips to help you create stunning bilingual publications:
        </p>
        
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 16px; background-color: ${BRAND.colors.light}; border-radius: 12px; margin-bottom: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.primary};">1. Start with our Library 📚</h4>
              <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
                Import classics from our 10,000+ book library. They're pre-formatted and ready for translation.
              </p>
            </td>
          </tr>
        </table>
        <div style="height: 12px;"></div>
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 16px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.primary};">2. Use Grid-Lock Layout 🔒</h4>
              <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
                Our patented Grid-Lock ensures source and translation always stay perfectly aligned.
              </p>
            </td>
          </tr>
        </table>
        <div style="height: 12px;"></div>
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 16px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.primary};">3. Let AI Help 🤖</h4>
              <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
                Use the AI translation assistant for first drafts, then refine with your expertise.
              </p>
            </td>
          </tr>
        </table>
        <div style="height: 12px;"></div>
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 16px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.primary};">4. Preview Before Export 👀</h4>
              <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
                Use Print View mode to see exactly how your book will look on paper.
              </p>
            </td>
          </tr>
        </table>
        <div style="height: 12px;"></div>
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 16px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.primary};">5. Save Style Presets 🎨</h4>
              <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
                Save your favorite text styles as presets to reuse across projects.
              </p>
            </td>
          </tr>
        </table>
        
        <div style="height: 24px;"></div>
        ${ctaButton('Open My Studio', `${BRAND.url}/dashboard`)}
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

💡 5 Tips to Master Your First Project

1. Start with our Library 📚
Import classics from our 10,000+ book library. They're pre-formatted and ready for translation.

2. Use Grid-Lock Layout 🔒
Our patented Grid-Lock ensures source and translation always stay perfectly aligned.

3. Let AI Help 🤖
Use the AI translation assistant for first drafts, then refine with your expertise.

4. Preview Before Export 👀
Use Print View mode to see exactly how your book will look on paper.

5. Save Style Presets 🎨
Save your favorite text styles as presets to reuse across projects.

Open your studio: ${BRAND.url}/dashboard

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: '💡 5 Tips to Master Your First Project' };
}

// -----------------------------------------------------------------------------
// 7. Tips Email 2: Pro Features
// -----------------------------------------------------------------------------
export function tipsProFeaturesEmail(data: EmailData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: ${BRAND.colors.secondary}; text-transform: uppercase; letter-spacing: 1px;">
          🎓 Pro Tip
        </p>
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading};">Hidden Features You Might Have Missed</h2>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Did you know about these powerful features?
        </p>
        
        <div style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, rgba(34,104,122,0.08) 0%, rgba(48,184,200,0.08) 100%); border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">⌘K Command Palette</h3>
          <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
            Press <code style="background: ${BRAND.colors.white}; padding: 2px 6px; border-radius: 4px; font-family: monospace;">⌘K</code> (or <code style="background: ${BRAND.colors.white}; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Ctrl+K</code>) to open the command palette. Search for any action, navigate directly to pages, or add blocks without leaving your keyboard.
          </p>
        </div>
        
        <div style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, rgba(34,104,122,0.08) 0%, rgba(48,184,200,0.08) 100%); border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">📱 Pimsleur Audio Mode</h3>
          <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
            Export your bilingual text as audio lessons! Source → pause → target format, perfect for listening practice on the go.
          </p>
        </div>
        
        <div style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, rgba(34,104,122,0.08) 0%, rgba(48,184,200,0.08) 100%); border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">🔍 Glossary Guard</h3>
          <p style="margin: 0; font-size: 14px; color: ${BRAND.colors.muted};">
            Add terms to your project glossary, and Synoptic will highlight them and ensure consistent translations across your entire book.
          </p>
        </div>
        
        ${ctaButton('Explore Features', `${BRAND.url}/dashboard`)}
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

🎓 Hidden Features You Might Have Missed

⌘K Command Palette
Press ⌘K (or Ctrl+K) to open the command palette. Search for any action, navigate directly to pages, or add blocks without leaving your keyboard.

📱 Pimsleur Audio Mode
Export your bilingual text as audio lessons! Source → pause → target format, perfect for listening practice on the go.

🔍 Glossary Guard
Add terms to your project glossary, and Synoptic will highlight them and ensure consistent translations across your entire book.

Explore features: ${BRAND.url}/dashboard

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: '🎓 Hidden Features You Might Have Missed' };
}

// -----------------------------------------------------------------------------
// 8. Order Confirmation: Pro Plan
// -----------------------------------------------------------------------------
interface OrderData extends EmailData {
  planName: string;
  planPrice: string;
  billingCycle: 'monthly' | 'yearly';
  orderId: string;
  orderDate: Date;
}

export function orderConfirmationProEmail(data: OrderData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  const formattedDate = data.orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.secondary} 100%); border-radius: 50%; line-height: 64px; font-size: 32px;">
            ✓
          </div>
        </div>
        
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading}; text-align: center;">Welcome to Pro! 🎉</h2>
        
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Thank you for upgrading to <strong>Synoptic Pro</strong>! Your payment has been processed successfully.
        </p>
        
        <div style="margin: 32px 0; padding: 24px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.muted}; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
          <table role="presentation" style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Plan</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right; font-weight: 600;">Synoptic Pro</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Price</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right; font-weight: 600;">${data.planPrice}/${data.billingCycle === 'yearly' ? 'year' : 'month'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Order ID</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right; font-family: monospace;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Date</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right;">${formattedDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin: 32px 0; padding: 24px; background: rgba(34, 104, 122, 0.05); border-radius: 12px; border-left: 4px solid ${BRAND.colors.secondary};">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">Your Pro benefits are now active:</h3>
          <table role="presentation" style="width: 100%;">
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Unlimited projects</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ 50,000 AI words/month</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ 300 DPI print-ready exports</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ EPUB & MOBI export</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ No watermarks</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Priority cloud history</td></tr>
          </table>
        </div>
        
        ${ctaButton('Start Creating', `${BRAND.url}/dashboard`)}
        
        <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: ${BRAND.colors.muted}; text-align: center;">
          Questions about your subscription? <a href="mailto:contact@getsynoptic.com" style="color: ${BRAND.colors.primary};">Contact us</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

Welcome to Pro! 🎉

Thank you for upgrading to Synoptic Pro! Your payment has been processed successfully.

ORDER SUMMARY
Plan: Synoptic Pro
Price: ${data.planPrice}/${data.billingCycle === 'yearly' ? 'year' : 'month'}
Order ID: ${data.orderId}
Date: ${formattedDate}

Your Pro benefits are now active:
✅ Unlimited projects
✅ 50,000 AI words/month
✅ 300 DPI print-ready exports
✅ EPUB & MOBI export
✅ No watermarks
✅ Priority cloud history

Start creating: ${BRAND.url}/dashboard

Questions about your subscription? Email us at contact@getsynoptic.com

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: '🎉 Welcome to Synoptic Pro! Your order confirmation' };
}

// -----------------------------------------------------------------------------
// 9. Order Confirmation: Publisher Plan
// -----------------------------------------------------------------------------
export function orderConfirmationPublisherEmail(data: OrderData): { html: string; text: string; subject: string } {
  const name = data.recipientName || 'there';
  const formattedDate = data.orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const html = emailWrapper(emailCard(`
    ${emailHeader()}
    <tr>
      <td style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border-radius: 50%; line-height: 64px; font-size: 32px;">
            👑
          </div>
        </div>
        
        <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: ${BRAND.colors.dark}; font-family: ${BRAND.fonts.heading}; text-align: center;">Welcome to Publisher! 👑</h2>
        
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${BRAND.colors.muted};">
          Thank you for choosing <strong>Synoptic Publisher</strong>! You now have access to our most powerful features for professional-grade publishing.
        </p>
        
        <div style="margin: 32px 0; padding: 24px; background-color: ${BRAND.colors.light}; border-radius: 12px;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: ${BRAND.colors.muted}; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
          <table role="presentation" style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Plan</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right; font-weight: 600;">Synoptic Publisher</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Price</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right; font-weight: 600;">${data.planPrice}/${data.billingCycle === 'yearly' ? 'year' : 'month'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Order ID</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right; font-family: monospace;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.muted};">Date</td>
              <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.colors.dark}; text-align: right;">${formattedDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(247,147,30,0.08) 100%); border-radius: 12px; border-left: 4px solid #f7931e;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: ${BRAND.colors.dark};">Your Publisher benefits are now active:</h3>
          <table role="presentation" style="width: 100%;">
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Everything in Pro</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ <strong>500,000</strong> AI words/month</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Team collaboration (up to 5 seats)</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Custom font upload</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Brand customization</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ Premium neural TTS voices</td></tr>
            <tr><td style="padding: 6px 0; font-size: 14px; color: ${BRAND.colors.muted};">✅ API access (coming soon)</td></tr>
          </table>
        </div>
        
        <div style="margin: 32px 0; padding: 16px; background-color: #fff3cd; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            🎁 <strong>Publisher perk:</strong> Schedule a free onboarding call with our team!<br>
            <a href="mailto:contact@getsynoptic.com?subject=Publisher%20Onboarding%20Call" style="color: #856404; font-weight: 600;">Book your call →</a>
          </p>
        </div>
        
        ${ctaButton('Enter Publisher Studio', `${BRAND.url}/dashboard`)}
        
        <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: ${BRAND.colors.muted}; text-align: center;">
          Dedicated support: <a href="mailto:contact@getsynoptic.com" style="color: ${BRAND.colors.primary};">contact@getsynoptic.com</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `));
  
  const text = `
Hi ${name},

Welcome to Publisher! 👑

Thank you for choosing Synoptic Publisher! You now have access to our most powerful features for professional-grade publishing.

ORDER SUMMARY
Plan: Synoptic Publisher
Price: ${data.planPrice}/${data.billingCycle === 'yearly' ? 'year' : 'month'}
Order ID: ${data.orderId}
Date: ${formattedDate}

Your Publisher benefits are now active:
✅ Everything in Pro
✅ 500,000 AI words/month
✅ Team collaboration (up to 5 seats)
✅ Custom font upload
✅ Brand customization
✅ Premium neural TTS voices
✅ API access (coming soon)

🎁 Publisher perk: Schedule a free onboarding call with our team!
Email contact@getsynoptic.com to book your call.

Enter Publisher Studio: ${BRAND.url}/dashboard

Dedicated support: contact@getsynoptic.com

---
${BRAND.name} - ${BRAND.tagline}
${BRAND.url}
  `.trim();
  
  return { html, text, subject: '👑 Welcome to Synoptic Publisher! Your order confirmation' };
}
