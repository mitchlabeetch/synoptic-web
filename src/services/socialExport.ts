// src/services/socialExport.ts
// PURPOSE: Generates shareable, brand-watermarked images from text blocks for social media marketing
// ACTION: Renders DOM elements to canvas with professional styling and exports as PNG
// MECHANISM: Uses html2canvas to capture styled containers, adds branding, and triggers download

import html2canvas from 'html2canvas';

export type SocialFormat = 'square' | 'story' | 'twitter' | 'pinterest';

export interface SocialExportOptions {
  format: SocialFormat;
  theme: 'light' | 'dark';
  showBranding: boolean;
  quality: number; // 1-2 (Retina quality)
}

// Format dimensions in pixels
const FORMAT_DIMENSIONS: Record<SocialFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },    // Instagram Post
  story: { width: 1080, height: 1920 },     // Instagram/TikTok Story
  twitter: { width: 1200, height: 675 },    // Twitter Card
  pinterest: { width: 1000, height: 1500 }  // Pinterest Pin
};

// Theme configurations
const THEMES = {
  light: {
    background: 'linear-gradient(135deg, #fdfbf7 0%, #fff 100%)',
    textColor: '#1a1a2e',
    brandColor: 'rgba(0,0,0,0.4)',
    accentGradient: 'linear-gradient(135deg, #30b8c8 0%, #2563eb 100%)'
  },
  dark: {
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
    textColor: '#f8fafc',
    brandColor: 'rgba(255,255,255,0.5)',
    accentGradient: 'linear-gradient(135deg, #30b8c8 0%, #818cf8 100%)'
  }
};

/**
 * Extract plain text from HTML content
 */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Create a styled container for social export
 */
function createSocialContainer(
  content: { source: string; target: string; sourceLang: string; targetLang: string },
  options: SocialExportOptions
): HTMLDivElement {
  const { format, theme, showBranding } = options;
  const { width, height } = FORMAT_DIMENSIONS[format];
  const themeConfig = THEMES[theme];

  const container = document.createElement('div');
  container.style.cssText = `
    width: ${width}px;
    height: ${height}px;
    background: ${themeConfig.background};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${format === 'square' ? '80px' : '60px'};
    box-sizing: border-box;
    position: relative;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  // Accent bar at top
  const accentBar = document.createElement('div');
  accentBar.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${themeConfig.accentGradient};
  `;
  container.appendChild(accentBar);

  // Main content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${format === 'square' ? '40px' : '30px'};
    width: 100%;
    max-width: ${width - 160}px;
  `;

  // Source language block
  const sourceBlock = document.createElement('div');
  sourceBlock.style.cssText = `
    color: ${theme === 'light' ? '#64748b' : '#94a3b8'};
    font-size: ${format === 'square' ? '28px' : '24px'};
    line-height: 1.6;
    text-align: center;
    font-style: italic;
  `;
  sourceBlock.textContent = `"${stripHtml(content.source)}"`;
  contentWrapper.appendChild(sourceBlock);

  // Divider with language indicator
  const divider = document.createElement('div');
  divider.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
  `;
  
  const line1 = document.createElement('div');
  line1.style.cssText = `flex: 1; height: 1px; background: ${theme === 'light' ? '#e2e8f0' : '#334155'};`;
  
  const langBadge = document.createElement('span');
  langBadge.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: ${themeConfig.accentGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `;
  langBadge.textContent = `${content.sourceLang} → ${content.targetLang}`;
  
  const line2 = document.createElement('div');
  line2.style.cssText = line1.style.cssText;
  
  divider.appendChild(line1);
  divider.appendChild(langBadge);
  divider.appendChild(line2);
  contentWrapper.appendChild(divider);

  // Target language block (main focus)
  const targetBlock = document.createElement('div');
  targetBlock.style.cssText = `
    color: ${themeConfig.textColor};
    font-size: ${format === 'square' ? '36px' : '30px'};
    line-height: 1.5;
    text-align: center;
    font-weight: 500;
  `;
  targetBlock.textContent = `"${stripHtml(content.target)}"`;
  contentWrapper.appendChild(targetBlock);

  container.appendChild(contentWrapper);

  // Branding footer
  if (showBranding) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: ${themeConfig.brandColor};
      font-size: 14px;
      font-weight: 500;
    `;
    
    // Synoptic logo/text
    const logo = document.createElement('span');
    logo.style.cssText = `
      font-variant: small-caps;
      letter-spacing: 0.15em;
      font-weight: 600;
    `;
    logo.textContent = 'synoptic';
    
    const separator = document.createElement('span');
    separator.textContent = '•';
    separator.style.opacity = '0.5';
    
    const tagline = document.createElement('span');
    tagline.textContent = 'getsynoptic.com';
    tagline.style.opacity = '0.8';
    
    footer.appendChild(logo);
    footer.appendChild(separator);
    footer.appendChild(tagline);
    container.appendChild(footer);
  }

  return container;
}

/**
 * Export a bilingual text block as a social media image
 * 
 * @param content The bilingual content to export
 * @param options Export options (format, theme, branding)
 * @returns Promise that resolves when download is triggered
 */
export async function exportAsImage(
  content: { source: string; target: string; sourceLang: string; targetLang: string },
  options: Partial<SocialExportOptions> = {}
): Promise<void> {
  const finalOptions: SocialExportOptions = {
    format: options.format || 'square',
    theme: options.theme || 'light',
    showBranding: options.showBranding !== false,
    quality: options.quality || 2
  };

  // Create the styled container
  const container = createSocialContainer(content, finalOptions);
  
  // Temporarily add to DOM (required for html2canvas)
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    // Render to canvas
    const canvas = await html2canvas(container, {
      scale: finalOptions.quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    });

    // Trigger download
    const link = document.createElement('a');
    const formatLabel = finalOptions.format.charAt(0).toUpperCase() + finalOptions.format.slice(1);
    link.download = `Synoptic-${formatLabel}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

/**
 * Export multiple blocks as separate images (batch export)
 */
export async function exportMultipleAsImages(
  blocks: Array<{ source: string; target: string; sourceLang: string; targetLang: string }>,
  options: Partial<SocialExportOptions> = {}
): Promise<void> {
  for (const block of blocks) {
    await exportAsImage(block, options);
    // Small delay between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export default exportAsImage;
