// src/app/api/export/pdf-preview/route.ts
// PURPOSE: Generate a low-resolution preview image of the first PDF page
// ACTION: Returns PNG thumbnail for cover page preview before full export
// MECHANISM: Uses the same PDF service with simplified options

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getProject, getUserProfile } from '@/lib/db/server';
import { isRTL, getLanguageByCode } from '@/data/languages';
import { sanitizeHTMLStrict, escapeHTML } from '@/lib/sanitize';

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://synoptic-pdf:3000';
const PDF_SERVICE_SECRET = process.env.PDF_SERVICE_SECRET || '';
const PREVIEW_TIMEOUT_MS = 30000; // 30 seconds for preview (increased for reliability)

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = getUserId(user);
  const { projectId, options } = await request.json();

  // Fetch project
  const project = await getProject(projectId, userId);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check tier for watermark
  const profile = await getUserProfile(userId);
  const isFreeTier = profile?.tier === 'free' || !profile?.tier;

  // Generate HTML for first page only
  const html = generateFirstPageHTML(project, isFreeTier);
  const css = generatePreviewCSS(project);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, PREVIEW_TIMEOUT_MS);

  try {
    const previewResponse = await fetch(`${PDF_SERVICE_URL}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PDF_SERVICE_SECRET && { 'X-Service-Key': PDF_SERVICE_SECRET }),
      },
      signal: controller.signal,
      body: JSON.stringify({
        html,
        css,
        width: 152, // 6x9 default
        height: 229,
        options: {
          dpi: options?.dpi || 72,
          format: 'png', // Return as image
          pageLimit: 1,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!previewResponse.ok) {
      // Fallback: try the regular PDF endpoint with screenshot mode
      const fallbackResponse = await fetch(`${PDF_SERVICE_URL}/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(PDF_SERVICE_SECRET && { 'X-Service-Key': PDF_SERVICE_SECRET }),
        },
        body: JSON.stringify({
          html,
          css,
          width: 456, // 3x the page width for decent resolution
          height: 687,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error('Both preview and fallback failed');
      }

      const imageBuffer = await fallbackResponse.arrayBuffer();
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        },
      });
    }

    const imageBuffer = await previewResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Preview generation timed out' },
        { status: 504 }
      );
    }

    const errorMessage = err instanceof Error ? err.message : 'Preview failed';
    console.error('[PDF Preview] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Generate HTML for just the first page
function generateFirstPageHTML(project: any, watermark: boolean): string {
  const pages = project.content?.pages || [];
  const title = project.title || 'Untitled';
  const author = project.author || '';

  if (pages.length === 0) {
    // Return a placeholder first page
    return `
      <div class="page odd" data-page="1">
        <div class="header">
          <span class="header-left"></span>
          <span class="header-right">${escapeHTML(title)}</span>
        </div>
        <div class="page-content">
          <div class="chapter-number">${escapeHTML(title)}</div>
          <p style="text-align: center; color: #999; font-style: italic;">Your content will appear here</p>
        </div>
        <div class="footer">
          <div class="page-number">1</div>
        </div>
      </div>
    `;
  }

  const firstPage = pages[0];
  const isChapter = firstPage.isChapterStart;

  return `
    <div class="page odd ${isChapter ? 'chapter-start' : ''}" data-page="1">
      <div class="header">
        <span class="header-left"></span>
        <span class="header-right">${escapeHTML(title)}</span>
      </div>
      
      <div class="page-content">
        ${isChapter ? `<div class="chapter-number">Chapter ${firstPage.number || 1}</div>` : ''}
        ${firstPage.blocks?.slice(0, 3).map((block: any, bIdx: number) => 
          renderBlockSimple(block, project, isChapter && bIdx === 0)
        ).join('') || ''}
      </div>

      <div class="footer">
        <div class="page-number">1</div>
      </div>
      
      ${watermark ? `
        <div class="watermark" style="opacity: 0.08; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);">
          <div style="font-family: sans-serif; font-size: 24pt; font-weight: 900; letter-spacing: 0.1em; color: #22687a;">SYNOPTIC PREVIEW</div>
        </div>
      ` : ''}
    </div>
  `;
}

// Simplified block renderer for preview
function renderBlockSimple(block: any, project: any, isFirstInChapter: boolean): string {
  const layout = block.layout || 'side-by-side';
  
  if (block.type === 'text') {
    const l1Dir = isRTL(project.source_lang || 'en') ? 'rtl' : 'ltr';
    const l2Dir = isRTL(project.target_lang || 'en') ? 'rtl' : 'ltr';
    
    // Truncate content for preview
    const l1Content = truncateHTML(sanitizeHTMLStrict(block.L1?.content || ''), 200);
    const l2Content = truncateHTML(sanitizeHTMLStrict(block.L2?.content || ''), 200);
    
    return `
      <div class="block text-block ${layout} ${isFirstInChapter ? 'first-paragraph' : ''}">
        <div class="l1-col" dir="${l1Dir}">${l1Content}</div>
        <div class="l2-col" dir="${l2Dir}">${l2Content}</div>
      </div>
    `;
  }
  
  if (block.type === 'separator') {
    return `<div class="block separator">❦</div>`;
  }

  if (block.type === 'image' && block.url) {
    return `
      <div class="block image-block" style="text-align: center;">
        <img src="${escapeHTML(block.url)}" alt="Image" style="max-width: 80%; height: auto;" />
      </div>
    `;
  }

  return '';
}

// Truncate HTML content for preview
function truncateHTML(html: string, maxLength: number): string {
  const text = html.replace(/<[^>]*>/g, '');
  if (text.length <= maxLength) return html;
  
  // Simple truncation - find a good break point
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const result = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  
  return result + '…';
}

// Simplified CSS for preview
function generatePreviewCSS(project: any): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Spectral:wght@300;400&display=swap');

    :root {
      --primary-serif: 'Crimson Pro', serif;
      --heading-serif: 'Spectral', serif;
    }

    body {
      margin: 0;
      padding: 0;
      color: #1a1a1a;
      line-height: 1.5;
      background: white;
    }

    .page {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: 20mm 15mm;
      position: relative;
    }

    .header {
      height: 8mm;
      font-family: var(--heading-serif);
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #777;
      display: flex;
      justify-content: space-between;
      border-bottom: 0.2pt solid #eee;
      margin-bottom: 6mm;
    }

    .page-content {
      flex: 1;
      font-family: var(--primary-serif);
      font-size: 10pt;
      text-align: justify;
    }

    .chapter-start .page-content {
      padding-top: 10mm;
    }

    .chapter-number {
      font-family: var(--heading-serif);
      font-size: 18pt;
      font-weight: 300;
      text-align: center;
      margin-bottom: 8mm;
      color: #333;
    }

    .block { margin-bottom: 4mm; }

    .side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8mm;
    }

    .l1-col { font-weight: 400; color: #111; }
    .l2-col { font-weight: 400; color: #555; font-style: italic; }

    .separator {
      margin: 6mm auto;
      text-align: center;
      font-size: 14pt;
      color: #999;
    }

    .image-block { margin: 6mm 0; }

    .footer {
      height: 8mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 4mm;
    }

    .page-number {
      font-family: var(--heading-serif);
      font-size: 9pt;
      color: #444;
    }

    .watermark {
      pointer-events: none;
      user-select: none;
    }
  `;
}
