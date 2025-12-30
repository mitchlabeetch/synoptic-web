// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getProject, getUserProfile } from '@/lib/db/server';
import { isRTL, getLanguageByCode } from '@/data/languages';
import { sanitizeHTMLStrict, escapeHTML } from '@/lib/sanitize';
import { getTranslations } from 'next-intl/server';

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://synoptic-pdf:3000';

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

  // Check tier
  const profile = await getUserProfile(userId);
  const isFreeTier = profile?.tier === 'free' || !profile?.tier;

  // Render HTML and CSS
  const locale = project.source_lang || 'en';
  const t = await getTranslations({ locale, namespace: 'Export' });
  const html = generateProjectHTML(project, isFreeTier, t);
  const css = generateProjectCSS(project);

  try {
    const pdfResponse = await fetch(`${PDF_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        css,
        width: 152, // Default 6x9 if not in project
        height: 229,
        bleed: options?.includeBleed ? 3.175 : 0,
        
        // NEW: Metadata Object for the PDF Engine
        metadata: {
          title: project.title || 'Untitled',
          author: (project.settings?.author as string) || 'Synoptic Author',
          subject: `Bilingual Edition (${project.source_lang}-${project.target_lang})`,
          keywords: ['synoptic', 'bilingual', project.source_lang, project.target_lang].filter(Boolean),
          creator: 'Synoptic Studio v1.0',
          producer: 'Synoptic Publishing Engine'
        },
        
        options: {
          colorMode: options?.colorMode || 'sRGB',
          resolution: isFreeTier ? 150 : 300,
          watermark: isFreeTier,
          lang: project.target_lang || 'en'
        },
      }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      throw new Error(`PDF Service Error: ${errorText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.title}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Export Error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}

function generateProjectHTML(project: any, watermark: boolean, t: any): string {
  const pages = project.content?.pages || [];
  const title = project.title || 'Untitled';
  const author = project.author || '';
  
  return pages.map((page: any, idx: number) => {
    const isEven = (idx + 1) % 2 === 0;
    const isChapter = page.isChapterStart;
    
    return `
      <div class="page ${isEven ? 'even' : 'odd'} ${isChapter ? 'chapter-start' : ''}" data-page="${idx + 1}">
        <div class="header">
          <span class="header-left">${isEven ? author : ''}</span>
          <span class="header-right">${!isEven ? title : ''}</span>
        </div>
        
        <div class="page-content">
          ${isChapter ? `<div class="chapter-number">${t('chapter')} ${page.number || idx + 1}</div>` : ''}
          ${page.blocks.map((block: any, bIdx: number) => renderBlock(block, project, isChapter && bIdx === 0)).join('')}
        </div>

        <div class="footer">
          <div class="page-number">${idx + 1}</div>
        </div>
        
        ${watermark ? `
          <div class="watermark opacity-10 select-none pointer-events-none" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAwIiB6b29tQW5kUGFuPSJtYWduaWZ5IiB2aWV3Qm94PSIwIDAgMzc1IDM3NC45OTk5OTEiIGhlaWdodD0iNTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjAiPjxwYXRoIGZpbGw9IiNmOTcyNmUiIGQ9Ik0gMTg2LjI1MzkwNiA1MS4xNDA2MjUgQyAxODcuNzU3ODEyIDUwLjg5MDYyNSAxODkuMzEyNSA1MC43OTY4NzUgMTkwLjY3OTY4OCAzNy41IEMgMjAzLjUyNzM0NCA0Ni42MDE1NjIgMjE2LjU4MjAzMSA0NC40ODA0NjkgMjI5LjU4NTk0IDQ0LjUzOTA2MiBDIDI1OC41NzQyMTkgNDQuNjY0MDYyIDI4NS4xMDU0NjkgNTIuMDc0MjE5IDMwOC43MzgyODEgNjguOTMzNTk0IEMgMzIxLjIwMzEyNSA3Ny44MjgxMjUgMzMyLjAxOTUzMSA4OC4zMjgxMjUgMzQwLjY3MTg3NSAxMDAuODIwMzEyIEMgMzUwLjUgMTE0LjU4MjAzMSAzNTcuNTgyMDMxIDEyOS42NDA2MjUgMzYyLjA2NjQwNiAxNDUuODk0NTMxIEMgMzY1LjYwOTM3NSAxNTguNzE4NzUgMzY3LjQxNDA2MiAxNzEuODA0Njg4IDM2Ny4xODM1OTQgMTg1LjA4NTkzOCBDIDM2Ni43NzczNDQgMjA4LjQ4MDQ2OSAzNjAuOTk2MDk0IDIzMC41NDI5NjkgMzQ5LjY1MjM0NCAyNTEuMDMxMjUgQzM0Ni40Mjk2ODggMjU2LjgyODEyNSAzNDIuNjMyODEyIDI2Mi4zNzEwOTQgMzM4Ljg1NTQ2OSAyNjcuODU1NDY5IEMgMzM3LjY5NTMxMiAyNjkuNTM5MDYyIDMzNy4zNjMyODEgMjcwLjgyODEyNSAzMzguMDQyOTY5IDI3Mi43NSBDIDM0Mi4yODEyNSAyODQuNzMwNDY5IDM0Ni40MDYyNSAyOTYuNzUzOTA2IDM1MC41NzAzMTIgMzA4LjY3MTg3NSBDIDM1MS4yMDMxMjUgMzEwLjU4MjAzMSAzNTEuODY3MTg4IDMxMi4zOTA2MjUgMzUyLjQ0OTIxOSAzMTQuMjI2NTYyIEMgMzU0LjE2Nzk2OSAzMTkuNjQwNjI1IDM0OS42Nzk2ODggMzI1LjI1NzODEyIDM0My42NDg0MzggMzIzLjM4MjgxMiBDIDM0My42NDg0MzggMzIzLjM4MjgxMiAzNDMuNjQ4NDM4IDMyMy4zODI4MTIgMzQzLjY0ODQzOCAzMjMuMzgyODEyIEMgMzM4Ljc1IDMyMS44NTkzNzUgMzMzLjY3MTg3NSAzMjAuMjE0ODQ0IDMyOS4wMjczNDQgMzE4LjU3MDMxMiBDIDMxOC40NTMxMjUgMzE0Ljk5MjE4OCAzMDcuODc4OTA2IDMxMS40MTc5NjkgMjk3LjMzNTkzOCAzMDcuNzQ2MDk0IEMgMjk0Ljk4NDM3NSAzMDYuOTI5Njg4IDI5Mi45Njg3NSAzMDcuMDQ2ODc1IDI5MC43MzQzNzUgMzA4LjIyMjY1NiBDIDI3Ny43ODEyNSAzMTUuMDU4NTk0IDI2My45ODQzNzUgMzE5LjQyNTc4MSAyNDkuNDk2MDk0IDMyMS4zODI4MTIgQyAyMzYuODU5Mzc1IDMyMy4wODU5MzggMjI0LjE3NTc4MSAzMjMuMzY3MTg4IDIxMS4zMDg1OTQgMzIwLjcxNDg0NCBDIDIxMi40NzI2NTYgMzE5LjQ3MjY1NiAyMTMuNzk2ODc1IDMxOC40ODgyODEgMjE1LjI2NTYyNSAzMTcuODQ3NjU2IEMgMjI1LjcxNDg0NCAzMTMuMjk2ODc1IDIzNC4zODI4MTIgMzA2LjE3OTY4OCAyNDIuNzc3MzQ0IDI5OC43MTA5MzggQyAyNDkuMDA3ODEyIDI5My4xNzE4NzUgMjU0LjI4MTI1IDI4Ni43MjI2NTYgMjU5LjA3MDMxMiAyNzkuOTI5Njg4IEMgMjYxLjA4MjAzMSAyNzcuMDc0MjE5IDI2My43NSAyNzQuNDI1NzgxIDI2NC4wNzgxMjUgMjcwLjYyODkwNiBDIDI2NC4xMTcxODggMjcwLjY2NDA2MiAyNjQuMTA1NDY5IDI3MC43NjE3MTkgMjY0LjM2MzI4MSAyNzAuNzUzOTA2IEMgMjY0LjY3OTY4OCAyNzAuNDMzNTk0IDI2NS4zMzU5MzggMjcwLjEyNSAyNjUuODYzMjgxIDI2OS42MTcxODggQyAyODAuMTk5MjE5IDI2Mi40Mjk2ODggMjkyLjIwNzAzMSAyNTIuODEyNSAzMDEuNDU3MDMxIDIzOS45Mzc1IEMgMzE3LjI0NjA5NCAyMTcuOTUzMTI1IDMyMy41NTg1OTQgMTkzLjY2NDA2MiAzMTguNzk2ODc1IDE2Ni44MDQ2ODggQyAzMTUuOTE3OTY5IDE1MC41NDY4NzUgMzA5LjA1MDc4MSAxMzYuMDQ2ODc1IDI5OC44MDQ2ODggMTIzLjE2Nzk2OSBDIDI4OS4wMjM0MzggMTEwLjY3MTg3NSAyNzYuNzE4NzUgMTAxLjY3OTY4OCAyNjIuMjU3ODEyIDk1LjcwNzAzMSBDIDI1Ny40MTQwNjIgOTMuNjY3OTY5IDI1Mi4zNTU0NjkgOTIuMTc5Njg4IDI0Ni43NzczNDQgOTEuODAwNzgxIEMgMjQzLjE0ODQzOCA5MS4xMDE1NjIgMjM5LjY3OTY4OCA5MC4xNzU3ODEgMjM2LjM5ODQzOCA4OS45NTcwMzEgQyAyMjEuMjc3MzQ0IDg4Ljk4MDQ2OSAyMDYuOTYwOTM4IDkyLjM2MzI4MSAxOTMuMjUgOTguNTQyOTY5IEMgMTkxLjQ2ODc1IDk5LjM0Mzc1IDE5MC4wMTU2MjUgMTAwLjg3ODkwNiAxODguMTU2MjUgMTAyLjA5NzY1NiBDIDE4Ni4wNDI5NjkgMTAzLjI1MzkwNiAxODQuMDc0MjE5IDEwNC4yMzQzNzUgMTgyLjM0NzY1NiAxMDUuNTM1MTU2IEMgMTY4LjM4MjgxMiAxMTYuMDc4MTI1IDE1Ny4xMzI4MTIgMTI4LjY3MTg3NSAxNTAuMTMyODEyIDE0NS4wNzQyMTkgQyAxNDMuMTI4OTA2IDE2MS4zNDc2NTYgMTM5LjkyOTY4OCAxNzguMjE4NzUgMTQyLjY0MDYyNSAxOTUuNzk2ODc1IEMgMTQ2LjAxMTcxOSAyMTcuNjI4OTA2IDE1NS40OTYwOTQgMjM2LjUxMTcxOSAxNzEuNTAzOTA2IDI1MS45NTMxMjUgQzE3Mi44NzEwOTQgMjUzLjI3MzQzOCAxNzQuMDc4MTI1IDI1NC43NTM5MDYgMTc1LjA5Mzc1IDI1Ni4yMDMxMjUgQxNjQuNzYxNzE5IDI2MS4yMTg3NSAxNTMuOTc2NTYyIDI2My4wNTA3ODEgMTQyLjkwMjM0NCAyNjMuMDAzOTA2IEMgMTM4LjEwOTM3NSAyNjIuOTg0Mzc1IDEzMy4zMDQ2ODggMjYxLjkwNjI1IDEyOC41MjczNDQgMjYxLjE3NTc4MSBDIDEyNC44ODY3MTkgMjYwLjYxMzI4MSAxMjEuMjgxMjUgMjU5LjgzMjAzMSAxMTcuNDMzNTk0IDI1OS4wMjM0MzggQyAxMTIuMjAzMTI1IDI1MS44Mzk4NDQgMTA4LjU1ODU5NCAyNDQuMDU4NTk0IDEwNS4zNjMyODEgMjM2LjA3NDIxOSBDIDk5LjI1NzgxMiAyMjAuODIwMzEyIDk1Ljc3NzM0NCAyMDQuOTg4MjgxIDk1LjI4MTI1IDE4OC41MjczNDQgQyA5NC45MTc5NjkgMTc2LjUzOTA2MiA5Ni4wOTc2NTYgMTY0LjY5OTIxOSA5OC41MjM0MzggMTUyLjY3MjY1NiBDIDEwMC45NTMxMjUgMTQxLjIxODc1IDEwNS4wMzEyNSAxMzAuMDE5NTMxIDExMC4zNDc2NTYgMTE5LjMwNDY4OCBDIDExNS4yMTA5MzggMTA5LjUwNzgxMiAxMjEuMzk4NDM4IDEwMC41MTU2MjUgMTI4LjMwODU5NCA5MS43NjU2MjUgQxMzIuOTgwNDY5IDg3LjI3MzQzOCAxMzcuNDE3OTY5IDgyLjY3MTg3NSAxNDEuOTMzNTk0IDc4LjUzNTE1NiBDIDE0Ny44Nzg5MDYgNzIuODQzNzUgMTU0LjY1MjM0NCA2OC4yNjU2MjUgMTYxLjYyMTA5NCA2My45Mzc1IEMgMTY4LjM5MDYyNSA1OS43MzQzNzUgMTc1LjY0MDYyNSA1Ni41NDY4NzUgMTgzLjAwNzgxMiA1My41ODIwMzEgQyAxODQuMjIyNjU2IDUzLjA5Mzc1IDE4NS4xNzk2ODggNTEuOTcyNjU2IDE4Ni4yNTM5MDYgNTEuMTQwNjI1IFogTSAxODYuMjUzOTA2IDUxLjE0MDYyNSAiIGZpbGwtb3BhY2l0eT0iMSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZmlsbD0iIzMwYjhjOCIgZD0iTSAxODkuMjM0Mzc1IDMxNS42MDU0NjkgQyAxODcuNDkyMTg4IDMxNS45NDUzMTIgMTg1LjY5NTMxMiAzMTYuMTI4OTA2IDE4NC4wMDc4MTIgMzE2LjY1MjM0NCBDIDE2MC45MTAxNTYgMzIzLjgxNjQwNiAxMzcuNjAxNTYyIDMyNC41NDI5NjkgMTE0LjA2NjQwNiAzMTkuMDU0Njg4IEMgMTAzLjY0MDYyNSAzMTYuNjIxMDk0IDkzLjYyNSAzMTMuMDc0MjE5IDg0LjE5MTQwNiAzMDcuOTg0Mzc1IEMgODIuNDg4MjgxIDMwNy4wNjY0MDYgODAuOTcyNjU2IDMwNi45MTc5NjkgNzkuMDg5ODQ0IDMwNy41NjY0MDYgQyA2NS45ODQzNzUgMzEyLjA4MjAzMSA1Mi44NDM3NSAzMTYuNDg4MjgxIDM5LjcxMDkzOCAzMjAuOTE0MDYyIEMgMzcuMjgxMjUgMzIxLjczNDM3NSAzNC44NTE1NjIgMzIyLjU4MjAzMSAzMi4zNzg5MDYgMzIzLjI1IEMgMjYuMTAxNTYyIDMyNC45NTcwMzEgMjEuNTMxMjUgMzIwLjY3MTg3NSAyMi45NjA5MzggMzE0LjM1MTU2MiBDIDIzLjQ5NjA5NCAzMTEuOTg4MjgxIDI0LjQ4NDM3NSAzMDkuNzIyNjU2IDI1LjI4OTA2MiAzMDcuNDIxODc1IEMgMjkuMTQ4NDM4IDI5Ni4zOTg0MzggMzIuOTc2NTYyIDI4NS4zNTkzNzUgMzYuOTA2MjUgMjc0LjM1OTM3NSBDIDM3LjgwMDc4MSAyNzEuODYzMjgxIDM3LjY5NTMxMiAyNjkuODc4OTA2IDM2LjAzOTA2MiAyNjcuNTg5ODQ0IEMgMjUuNjQ4NDM4IDI1My4yMTA5MzggMTcuNzkyOTY5IDIzNy41NzgxMjUgMTMuMTA5Mzc1IDIyMC4zOTg0MzggQ4LjU5NzY1NiAyMDMuODY3MTg4IDcuMTg3NSAxODcuMTE3MTg4IDguNzczNDM4IDE3MC4wNTA3ODEgQxMTAuNTg1OTM4IDE1MC41ODIwMzEgMTYuMzAzMTI1IDEzMi4zMjgxMjUgMjUuNjQ4NDM4IDExNS4yMzgyODEgQ0A0My4xNTYyNSA4My4yMTQ4NDQgNjkuNTQyOTY5IDYxLjc2MTcxOSAxMDQuMTQ0NTMxIDUwLjQ2ODc1IEMgMTE0LjkyMTg3NSA0Ni45NTMxMjUgMTI2LjA3ODEyNSA0NS4wNTQ2ODggMTM3LjQ1MzEyNSA0NC44NDM3NSBDIDE0Mi45NjA5MzggNDQuNzQ2MDk0IDE0OC40NzI2NTYgNDQuODgyODEyIDE1NC4xNzE4NzUgNDUuMTgzNTk0IEMgMTU0LjE5NTMxMiA0NS42NDQ1MzEgMTU0LjAxNTYyNSA0NS44MjQyMTkgMTUzLjg3NSA0Ni4wMzUxNTYgQyAxNTMuODQzNzUgNDYuMDc4MTI1IDE1My45NDkyMTkgNDYuMzAwNzgxIDE1My45OTYwOTQgNDYuMzA0Njg4IEMgMTU1LjUxNTYyNSA0Ni4zNjMyODEgMTU3LjAzOTA2MiA0Ni4zNDM3NSAxNTguNTQ2ODc1IDQ2LjQ4NDM3NSBDIDE1OS4zMTY0MDYgNDYuNTU0Njg4IDE2MC4wNTQ2ODggNDYuOTIxODc1IDE2MC44MDg1OTQgNDcuMTUyMzQ0IEwgMTYxLjQyNTc4MSA0OC4yNzM0MzggQyAxNjAuODI4MTI1IDQ4LjUwNzgxMiAxNjAuMjAzMTI1IDQ4LjY5MTQwNiAxNTkuNjI4OTA2IDQ4Ljk4MDQ2OSBDIDE1Mi4xODc1IDUyLjcxMDkzOCAxNDUuMzY3MTg4IDU3LjQyMTg3NSAxMzguODI4MTI1IDYyLjUyMzQzOCBDIDEzNC45Mjk2ODggNjUuNTY2NDA2IDEzMC45MDIzNDQgNjguNDUzMTI1IDEyNy45NDUzMTIgNzIuNjEzMjgxIEMgMTI1LjM3MTA5NCA3Ni4yMzQzNzUgMTIyLjQ0MTQwNiA3OS42NDg0MzggMTE5LjM1MTU2MiA4Mi44NDM3NSBDIDExNS42MTcxODggODYuNzA3MDMxIDExMy4yOTY4NzUgOTEuMjY5NTMxIDExMS4zODI4MTIgOTYuNDAyMzQ0IEMgMTA1Ljc1IDk5LjY3NTNCNCAxMDAuMDMxMjUgMTAyLjM5NDUzMSA5NC44OTg0MzggMTA1Ljk1NzAzMSBDIDgzLjEyMTA5NCAxMTQuMTI4OTA2IDc0LjAxNTYyNSAxMjQuNzU3ODEyIDY3LjA2MjUgMTM3LjMzNTkzOCBDIDU3LjE3OTY4OCAxNTUuMjEwOTM4IDUzLjA5NzY1NiAxNzQuMzI0MjE5IDU1LjYyNSAxOTQuNDY4NzUgQyA1OC42NDA2MjUgMjE4LjUgNjkuMTk1MzEyIDIzOC44OTg0MzggODcuNTg1OTM4IDI1NC45ODgyODEgQyA5Ny45ODgyODEgMjY0LjA4OTg0NCAxMDkuNzY1NjI1IDI3MC42NDA2MjUgMTIzLjE2MDE1NiAyNzQuMTYwMTU2IEMgMTI1LjEyMTA5NCAyNzQuNjc1NzgxIDEyNy4xNzE4NzUgMjc0Ljg0Mzc1IDEyOS40NDkyMTkgMjc1LjMyMDMxMiBDIDEzMy44NjMyODEgMjc3LjMwNDY4OCAxMzguMjg5MDYyIDI3Ni43NSAxNDIuNjE3MTg4IDI3Ni45MjU3ODEgQyAxNTYuOTIxODc1IDI3Ny41MTE3MTkgMTcwLjMwMDc4MSAyNzQgMTgyLjY3MTg3NSAyNjcuNTIzNDM4IEMgMTg0LjQ3MjY1NiAyNjYuNzUgMTg1LjY2MDE1NiAyNjUuMzM1OTM4IDE4Ny4yOTY4NzUgMjY0LjE5OTIxOSBDIDE4OS40NzI2NTYgMjYzLjEwNTQ2OSAxOTEuNDY0ODQ0IDI2Mi4xODc1IDE5My4yMTA5MzggMjYwLjkyNTc4MSBDIDIwMC4xMDE1NjIgMjU1Ljk0NTMxMiAyMDYuMzIwMzEyIDI1MC4yNTc4MTIgMjExLjY0MDYyNSAyNDMuNTcwMzEyIEMgMjI4LjYwNTQ2OSAyMjIuMjQ2MDk0IDIzNi4xNjAxNTYgMTk4LjE4MzU5NCAyMzIuNTgyMDMxIDE3MS4wMTk1MzEgQyAyMzIuNTgyMDMxIDE3MS4wMTk1MzEgMjMyLjU4MjAzMSAxNzEuMDE5NTMxIDIzMi41ODIwMzEgMTcxLjAxOTUzMSBDIDIyOS44NTE1NjIgMTUwLjI4MTI1IDIyMS4wMDc4MTIgMTMyLjM1NTQ2OSAyMDYuNTg1OTM4IDExNy4xOTE0MDYgQyAyMDUuNzE0ODQ0IDExNi4yNzM0MzggMjA0LjY3OTY4OCAxMTUuMjQ2MDk0IDIwNC4yNTc4MTIgMTE0LjE2Nzk2OSBDIDIwNC4xODM1OTQgMTEzLjkyOTY4OCAyMDQuMDA3ODEyIDExMy43ODUxNTYgMjAzLjg4MjgxMiAxMTMuNjQwNjI1IEMgMjAzLjkyOTY4OCAxMTMuNjM2NzE5IDIwMy44OTQ1MzEgMTEzLjcyNjU2MiAyMDMuOTQxNDA2IDExMy40MjE4NzUgQyAyMDQuMDcwMzEyIDExMC4yNjk1MzEgMjA1Ljk1MzEyNSAxMDguNDEwMTU2IDIwOC4yNDYwOTQgMTA3Ljc4MTI1IEMgMjEzLjYwOTM3NSAxMDYuMzE2NDA2IDIxOS4wODU5NzcgMTA1LjA1MDc4MSAyMjQuNjAxNTYyIDEwNC4zODY3MTkgQyAyMjkuMTMyODEyIDEwMy44Mzk4NDQgMjMzLjY3MTg3NSAxMDQuMjE0ODQ0IDIzOC4zODI4MTIgMTA0LjMxMjUgQyAyMzkuODg2NzE5IDEwNC4zMzk4NDQgMjQxLjQyMTg3NSAxMDQuNjIxMDk0IDI0Mi44NjcxODggMTA1LjA0Njg3NSBDIDI0Ny4zNzEwOTQgMTA2LjM3NSAyNTEuODM1OTM4IDEwNy44NTE1NjIgMjU2LjMzNTkzOCAxMDkuMjE0ODQ0IEMgMjU3LjE2NDA2MiAxMDkuNDY4NzUgMjU4LjA3MDMxMiAxMDkuNDU3MDMxIDI1OC45MTQwNjIgMTA5LjYwOTM3NSBDIDI1OC44ODY3MTkgMTA5LjY1MjM0NCAyNTguODAwNzgxIDEwOS41OTc2NTYgMjU4Ljg5NDUzMSAxMDkuODAwNzgxIEMgMjU5LjIxNDg0NCAxMTAuMTkxNDA2IDI1OS40NDUzMTIgMTEwLjM4MjgxMiAyNTkuODc4OTA2IDExMC43MTg3NSBDIDI3Ny4zMjgxMjUgMTQwLjU2MjUgMjgzLjU5Mzc1IDE3Mi4zNTU0NjkgMjc4LjE4MzU5NCAyMDYuMzIwMzEyIEMgMjc0LjM3MTA5NCAyMzAuMjUgMjY0LjcyNjU2MiAyNTEuNjMyODEyIDI0OS42MDU0NjkgMjcwLjU2MjUgQyAyNDguMjU3ODEyIDI3Mi4yNSAyNDcuMDI3MzQ0IDI3NC4wMzkwNjIgMjQ1LjU0Mjk2OSAyNzUuOTI1NzgxIEMgMjQ0LjIsMTc3LjE3NTc4MSAyNDIuNzg5MDYyIDI3OC40MzM1OTQgMjQxLjQyMTg3NSAyNzkuNzAzMTI1IEMgMjM1Ljk4ODI4MSAyODQuNzI2NTYyIDIzMC44MjgxMjUgMjkwLjAzMTI1IDIyNS4wNjY0MDYgMjk0LjcwNzAzMSBDIDIxNS4yMzQzNzUgMzAyLjU2NjQwNiAyMDQuMjE0ODQ0IDMwOC41MDM5MDYgMTkyLjUyNzM0NCAzMTMuMTk5MjE5IEMgMTkxLjMwNDY4OCAzMTMuNjkxNDA2IDE5MC4zMjgxMjUgMzE0LjY3OTY4OCAxODkuMjM0Mzc1IDMxNS42MDU0NjkgWiBNIDE4OS4yMzQzNzUgMzE1LjYwNTQ2OSAiLz4gPHBhdGggZmlsbD0iI2RkNjI1ZSIgZD0iTSAxODkuNDY4NzUgMzE1Ljc3MzQzOCBDIDE5MC4zMjgxMjUgMzE0Ljc4OTA2MiAxOTEuMzA0Njg4IDMxMy42OTE0MDYgMTkyLjUyNzM0NCAzMTMuMTk5MjE5IEMgMjA0LjIxNDg0NCAzMDguNTAzOTA2IDIxNS4yMzQzNzUgMzA2LjU2NjQwNiAyMjUuMDY2NDA2IDI5NC43MDcwMzEgQyAyMzAuODI4MTI1IDI5MC4wOTM3NSAyMzUuOTg4MzA3IDI4NC43MjY1NjIgMjQxLjQyMTg3NSAyNzkuNzAzMTI1IEMgMjQyLjczMDQ2OSAyNzguNDkyMTg4IDI0NC4wMzkwNjIgMjc3LjI4NTE1NiAyNDUuODY3MTg4IDI3NS44NzUgQyAyNTAuMDkzNzUgMjc0LjY3NTc4MSAyNTMuODE2NDA2IDI3My43MTQ4NDQgMjU3LjUxMTcxOSAyNzIuNjY3OTY5IEMgMjU5LjcwNzAzMSAyNzIuMDQ2ODc1IDI2MS44NjcxODggMjcxLjI5Mjk2OSAyNjQuMDM5MDYyIDI3MC41OTc2NTYgQyAyNjMuNzUgMjc0LjQyNTc4MSAyNjEuMDgyMDMxIDI3Ny4wNzQyMTkgMjU5LjA3MDMxMiAyNzkuOTI5Njg4IEMgMjU0LjI4MTI1IDI4Ni43MjI2NTYgMjQ5LjAxMTcxOSAyOTMuMTcxODc1IDI0Mi43NzczNDQgMjk4LjcxMDkzOCBDIDIzNC4zODI4MTIgMzA2LjE3OTY4OCAyMjUuNzE0ODQ0IDMxMy4yOTY4NzUgMjE1LjI2NTYyNSAzMTcuODQ3NjU2IEMgMjEzLjY3OTY4OCAzMTguNDgzMTA3IDIxMi40NzI2NTYgMzE5LjQ3MjY1NiAyMTEuMDQyOTY5IDMyMC41NTg1OTQgQyAyMDMuNTg5ODQ0IDMyMC41NTg1OTQgMTk2LjU4MjAzMSAzMTguNTM5MDYyIDE4OS40Njg3NSAzMTUuNzczNDM4IFogTSAxODkuNDY4NzUgMzE1Ljc3MzQzOCAiLz48cGF0aCBmaWxsPSIjMmI5Y2FkIiBkPSJNIDExMS41NjI1IDk2LjIzNDM3NSBDIDExMy4yOTY4NzUgOTEuMjY5NTMxIDExNS42MTcxODggODYuNzA3MDMxIDExOS4zNTE1NjIgODIuODQzNzUgQyAxMjIuNDQwOTc4IDc5LjY0ODQzOCAxMjUuMzcxMDk0IDc2LjIzNDM3NSAxMjcuOTQ1MzEyIDcyLjYxMzI4MSBDIDEzMC45MDIzNDQgNjguNDUzMTI1IDEzNC45Mjk2ODggNjUuNTY2NDA2IDEzOC44MjgxMjUgNjIuNTIzNDM4IEMgMTQ1LjM2NzE4OCA1Ny40MjE4NzUgMTUyLjE4NzUgNTIuNzEwOTM4IDE1OS42Mjg5MDYgNDguOTgwNDY5IEMgMTYwLjIwMzEyNSA0OC42OTE0MDYgMTYwLjgyODEyNSA0OC41MDc4MTIgMTYxLjQyNTc4MSA0OC4yNzM0MzggTCAxNjAuODA4NTk0IDQ3LjE1MjM0NCBDIDE2MC4wNTQ2ODggNDYuOTIxODc1IDE1OS4zMTY0MDYgNDYuNTU0Njg4IDE1OC41NDY4NzUgNDYuNDg0Mzc1IEMgMTU3LjAzOTA2MiA0Ni4zNDM3NSAxNTUuNTE1NjI1IDQ2LjM2MzI4MSAxNTMuOTk2MDk0IDQ2LjMwNDY4OCBDIDE1My45NDkyMTkgNDYuMzAwNzgxIDE1My44NDM3NSA0Ni4wNzgxMjUgMTUzLjg3NSA0Ni4wMzUxNTYgQyAxNTQuMDE1NjI1IDQ1LjgyNDIxOSAxNTQuMTk1MzEyIDQ1LjY0NDUzMSAxNTQuNSAzNy41IEMgMTU4LjcxMTQwNiA0NS42Njc5NjkgMTYyLjkwNjI1IDQ2LjE3NTc4MSAxNjcuMDg1OTM4IDQ2LjY3MTg3NSBDIDE3MC43MzA0NjkgNDcuMzY3MTg4IDE3NC4zNzg5MDYgNDcuOTQxNDA2IDE3Ny45ODA0NjkgNDguNzIyNjU2IEMgMTgwLjU5NzY1NiA0OS4yODkwNjIgMTgzLjE0MDYyNSA1MC4xOTkyMTkgMTg1Ljk4NDM3NSA1MS4wNTA3ODEgQyAxODUuMTc5Njg4IDUxLjkyMTg3NSAxODQuMjIyNjU2IDUzLjA5Mzc1IDE4My4wMDc4MTIgNTMuNTgyMDMxIEMgMTc1LjYzNjcxOSAzNy41IDE2OC4zOTA2MjUgNTkuNzM0Mzc1IDE2MS42MjEwOTQgNjMuOTM3NSBDIDE1NC42NTIzNDQgNjguMjY1NjI1IDE0Ny44Nzg5MDYgNzIuODQzNzUgMTQxLjkzMzU5NCA3OC41MzUxNTYgQyAxMzcuNDE3OTY5IDgyLjY3MTg3NSAxMzIuOTgwNDY5IDg3LjI3MzQzOCAxMjcuOTU3MDMxIDkxLjcwMzEyNSBDIDEyMi4xMjEwOTQgOTMuMjUgMTE2LjgzOTg0NCA5NC43NDIxODggMTExLjU2MjUgOTYuMjM0Mzc1IFogTSAxMTEuNTYyNSA5Ni4yMzQzNzUgIi8+PHBhdGggZmlsbD0iIzJjOWNhZCIgZD0iTSAyNDYuNzc3MzQ0IDkxLjgwMDc4MSBDIDI1MC45NjA5MzggOTcuNTQyOTY5IDI1NS4wMTU2MjUgMTAzLjM3NSAyNTguOTQxNDA2IDEwOS4yOTI5NjkgQyAyNTguMDcwMzEyIDEwOS40NTcwMzEgMjU3LjE2NDA2MiAxMDkuNDY4NzUgMjU2LjMzNTkzOCAxMDkuMjE0ODQ0IEMgMjUxLjgzNTkzOCAxMDcuODUxNTYyIDI0Ny4zNzEwOTQgMTA2LjM3NSAyNDIuODY3MTg4IDEwNS4wNDY4NzUgQyAyNDEuNDIxODc1IDEwNC42MjEwOTQgMjM5LjY3OTY4OCAxMDQuMzM5ODQ0IDIzOC4zODI4MTIgMTA0LjMxMjUgQyAyMzMuNzg1MTU2IDEwNC4yMTQ4NDQgMjI5LjEzMjgyIDEwMy44Mzk4NDQgMjI0LjYwMTU2MiAxMDQuMzg2NzE5IEMgMjE5LjA4NTkzOCAxMDUuMDUwNzgxIDIxMy42MTMyODEgMTA2LjMxNjQwNiAyMDguMjQ2MDk0IDEwNy43ODEyNSBDIDIwNS45NTMxMjUgMTA4LjQxMDE1NiAyMDQuMDcwMzEyIDExMC4yNjk1MzEgMjAzLjkyOTY4OCAxMTMuNDIxODc1IEMgMjAyLjYwMTU2MiAxMTIuNzY1NjI1IDIwMS4zMDQ2ODggMTExLjgwODU5NCAyMDAuMDE5NTMxIDExMC44Mzk4NDQgQyAxOTYuMjg1MTU2IDEwOC4wMzEyNSAxOTIuNTU4NTk0IDEwNS4yMTg3NSAxODguNjIxMDk0IDEwMi4yMzg2NzE4OCBDIDE5MC4wMTU2MjUgMTAwLjg3ODkwNiAxOTEuNDY4NzUgOTkuMzQzNzUgMTkzLjI1IDk4LjU0Mjk2OSBDIDIwNi45NjA5MzggOTIuMzYzMjgxIDIyMS4yNzczNDQgODguOTgwNDY5IDIzNi40MDIzNDQgODkuOTU3MDMxIEMgMjM5LjY3OTY4OCA5MS4xMDE1NjIgMjQzLjE0ODQzOCA5MS44MDA3ODEgMjQ2Ljc3NzM0NCA5MS44MDA3ODEgWiBNIDI0Ni43NzczNDQgOTEuODAwNzgxICIvPjxwYXRoIGZpbGw9IiNkZTYzNWYiIGQ9Ik0gMTI5LjQ0OTIxOSAyNzUuMzIwMzEyIEMgMTI1LjQyNTc4MSAyNzAuMTAxNTYyIDEyMS41MDc4MTIgMjY0LjgwNDY4OCAxMTcuNjk1MzEyIDI1OS40Mjk2ODggQyAxMjEuMjgxMjUgMjU5LjgzMjAzMSAxMjQuODg2NzE5IDI2MC42MTMyODEgMTI4LjUyNzM0NCAyNjEuMTc1NzgxIEMgMTMzLjMwNDY4OCAyNjEuOTEwMTU2IDEzOC4xMDkzNzUgMjYyLjY3MTg3NSAxNDIuOTA2MjUgMjYzLjAwMzkwNiBDIDE1My45NzY1NjIgMjYzLjA1MDc4MSAxNjQuNzYxNzE5IDI2MS4yMTg3NSAxNzUuMDkzNzUgMjU2LjIwMzEyNSBDIDE3Ni45ODA0NjkgMjU3LjMxNjQwNiAxNzguNTg5ODQ0IDI1OC40ODgyODEgMTgwLjIyNjU2MiAyNTkuNjI1IEMgMTgyLjMyMDMxMiAyNjEuMDc0MjE5IDE4NC40MzM1OTQgMjYyLjQ5NjA5NCAxODYuNzY5NTMxIDI2NC4wNzQyMTkgQyAxODUuNjYwMTU2IDI2NS4zMzU5MzggMTg0LjQ3MjY1NiAyNjYuNzUgMTgyLjY3MTg3NSAyNjcuNTIzNDM4IEMgMTcwLjMwMDc4MSAyNzQgMTU2LjkyMTg3NSAyNzcuNTA3ODEyIDE0Mi42MTcxODggMjc2LjkyNTc4MSBDIDEzOC4yODkwNjIgMjc2LjY3MTg3NSAxMzMuODYzMjgxIDI3Ny4zMDg1OTQgMTI5LjQ0OTIxOSAyNzUuMzIwMzEyIFogTSAxMjkuNDQ5MjE5IDI3NS4zMjAzMTIgIi8+PHBhdGZpbGw9IiNkZTYyNWUiIGQ9Ik0gMjY0LjM2MzI4MSAyNzAuNzUzOTA2IEMgMjY0LjQ2ODc1IDI3MC40Njg3NSAyNjQuODMyMDMxIDI3MC4xNzU3ODEgMjY1LjQ0NTMxMiAyNjkuODQ3NjU2IEMgMjY1LjMzNTkzOCAyNzAuMTI1IDI2NC45NzY1NjIgMjcwLjQzMzU5NCAyNjQuMzYzMjgxIDI3MC43NTM5MDYgWiBNIDI2NC4zNjMyODEgMjcwLjc1MzkwNiAiLz48L3N2Zz4=" style="width: 120px; height: 120px; margin-bottom: 20px;" />
            <div style="font-family: 'Spectral', serif; font-size: 24pt; font-weight: 900; letter-spacing: 0.1em; color: #22687a;">SYNOPTIC STUDIO</div>
            <div style="font-family: sans-serif; font-size: 10pt; font-weight: 700; margin-top: 5px; color: #f9726e; letter-spacing: 0.2em;">${t('engineLabel')}</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderBlock(block: any, project: any, isFirstInChapter: boolean): string {
  const layout = block.layout || 'side-by-side';
  
  if (block.type === 'text') {
    const l1Dir = isRTL(project.source_lang || 'en') ? 'rtl' : 'ltr';
    const l2Dir = isRTL(project.target_lang || 'en') ? 'rtl' : 'ltr';
    
    const l1Script = getLanguageByCode(project.source_lang || 'en')?.script || 'latin';
    const l2Script = getLanguageByCode(project.target_lang || 'en')?.script || 'latin';
    
    // Sanitize user content to prevent XSS
    const l1Content = sanitizeHTMLStrict(block.L1?.content || '');
    const l2Content = sanitizeHTMLStrict(block.L2?.content || '');
    
    return `
      <div class="block text-block ${layout} ${isFirstInChapter ? 'first-paragraph' : ''}">
        <div class="l1-col script-${l1Script}" dir="${l1Dir}" lang="${project.source_lang || 'en'}">${l1Content}</div>
        <div class="l2-col script-${l2Script}" dir="${l2Dir}" lang="${project.target_lang || 'en'}">${l2Content}</div>
      </div>
    `;
  }
  
  if (block.type === 'separator') {
    const style = block.style || 'line';
    if (style === 'ornament-fleuron') {
      return `<div class="block separator ornament">❦</div>`;
    }
    if (style === 'ornament-stars') {
      return `<div class="block separator ornament">✦ ✦ ✦</div>`;
    }
    if (style === 'ornament-diamond') {
      return `<div class="block separator ornament">◆</div>`;
    }
    if (style === 'ornament-vine') {
      return `<div class="block separator ornament">❧</div>`;
    }
    if (style === 'custom' && block.customEmoji) {
      return `<div class="block separator ornament">${escapeHTML(block.customEmoji)}</div>`;
    }
    return `<div class="block separator ${escapeHTML(style)}" style="width: ${block.width || 80}%; border-bottom-width: ${block.thickness || 1}px"></div>`;
  }

  if (block.type === 'image') {
    const altText = escapeHTML(block.altText || 'Image');
    const captionL1 = block.caption?.L1 ? sanitizeHTMLStrict(block.caption.L1) : '';
    const captionL2 = block.caption?.L2 ? sanitizeHTMLStrict(block.caption.L2) : '';
    
    return `
      <div class="block image-block" style="text-align: ${block.alignment || 'center'}">
        <div class="image-wrapper" style="width: ${block.width || 100}%; border-radius: ${block.borderRadius || 0}px; ${block.shadow ? 'box-shadow: 0 4px 12px rgba(0,0,0,0.1);' : ''}">
          <img src="${escapeHTML(block.url)}" alt="${altText}" />
        </div>
        ${captionL1 || captionL2 ? `
          <div class="caption">
            <span class="l1">${captionL1}</span>
            <span class="l2">${captionL2}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (block.type === 'callout') {
    const calloutType = escapeHTML(block.calloutType?.toUpperCase() || 'NOTE');
    const l1Content = sanitizeHTMLStrict(block.L1?.content || block.content || '');
    const l2Content = sanitizeHTMLStrict(block.L2?.content || '');
    
    return `
      <div class="block callout shadow-sm" style="border-left-color: ${block.headerColor || '#3b82f6'}; background-color: ${block.backgroundColor || '#f8fafc'}">
        <div class="callout-header" style="color: ${block.headerColor || '#2563eb'}">
          ${calloutType}
        </div>
        <div class="callout-body">
          <div class="l1">${l1Content}</div>
          <div class="l2">${l2Content}</div>
        </div>
      </div>
    `;
  }

  if (block.type === 'table') {
    const rows = block.rows || [];
    const tableContent = rows.map((row: any[]) => {
      const cells = row.map((cell: any) => {
        const tag = cell.isHeader ? 'th' : 'td';
        const attrs = [];
        if (cell.colspan && cell.colspan > 1) attrs.push(`colspan="${cell.colspan}"`);
        if (cell.rowspan && cell.rowspan > 1) attrs.push(`rowspan="${cell.rowspan}"`);
        if (cell.alignment) attrs.push(`style="text-align: ${cell.alignment}"`);
        
        return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${sanitizeHTMLStrict(cell.content || '')}</${tag}>`;
      }).join('');
      
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div class="block table-block">
        <table style="border-color: ${block.borderColor || '#dddddd'}; border-width: ${block.borderWidth || 1}px;">
          ${tableContent}
        </table>
      </div>
    `;
  }

  // ============================================
  // QUIZ BLOCK (Workbook Cloze Deletion)
  // ============================================
  if (block.type === 'quiz') {
    const hintHTML = block.hint 
      ? `<div style="font-size: 8pt; color: #999; margin-top: 2mm; font-style: italic;">💡 Hint: ${escapeHTML(block.hint)}</div>` 
      : '';

    const difficultyBadge = block.difficulty 
      ? `<span style="font-size: 7pt; padding: 1mm 2mm; border-radius: 2mm; background: ${
          block.difficulty === 'easy' ? '#d1fae5' : 
          block.difficulty === 'medium' ? '#fef3c7' : '#fee2e2'
        }; color: ${
          block.difficulty === 'easy' ? '#065f46' : 
          block.difficulty === 'medium' ? '#92400e' : '#991b1b'
        }; text-transform: uppercase; font-weight: bold; margin-left: 2mm;">${escapeHTML(block.difficulty)}</span>`
      : '';

    return `
      <div class="block quiz-block" style="margin: 6mm 0; padding: 5mm; background-color: #f9f9f9; border: 1px dashed #ccc; border-radius: 4px; page-break-inside: avoid;">
        <div style="font-size: 8pt; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.5mm; margin-bottom: 3mm; display: flex; align-items: center;">
          📚 Workbook Exercise ${difficultyBadge}
        </div>
        <div style="font-family: var(--primary-serif); font-size: 12pt; line-height: 2;">
          ${escapeHTML(block.preText)}
          <span style="display: inline-block; min-width: 30mm; border-bottom: 1.5pt solid #444; margin: 0 1mm;">&nbsp;</span>
          ${escapeHTML(block.postText)}
        </div>
        ${hintHTML}
        <div style="margin-top: 4mm; text-align: right; transform: rotate(180deg); transform-origin: right center; opacity: 0.6;">
          <span style="font-size: 7pt; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;">Answer: ${escapeHTML(block.answer)}</span>
        </div>
      </div>
    `;
  }

  return '';
}

function generateProjectCSS(project: any): string {
  const sourceLang = project.source_lang || 'en';
  const targetLang = project.target_lang || 'en';
  
  const sourceConfig = getLanguageByCode(sourceLang);
  const targetConfig = getLanguageByCode(targetLang);
  
  const fonts = new Set<string>();
  
  // Add base project fonts
  if (project.settings?.fonts?.body) fonts.add(project.settings.fonts.body);
  if (project.settings?.fonts?.heading) fonts.add(project.settings.fonts.heading);
  
  // Add suggested fonts for both languages
  sourceConfig?.suggestedFonts.forEach(f => fonts.add(f));
  targetConfig?.suggestedFonts.forEach(f => fonts.add(f));
  
  // Base fallbacks
  fonts.add('Crimson Pro');
  fonts.add('Spectral');

  const fontImport = Array.from(fonts)
    .map((f: string) => `family=${f.replace(/ /g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,700`)
    .join('&');

  const fontUrl = `https://fonts.googleapis.com/css2?${fontImport}&display=swap`;

  return `
    @import url('${fontUrl}');

    :root {
      --primary-serif: 'Crimson Pro', serif;
      --heading-serif: 'Spectral', serif;
      --gutter: 25mm;
      --outer-margin: 15mm;
      --top-margin: 20mm;
      --bottom-margin: 20mm;
    }

    body {
      margin: 0;
      padding: 0;
      color: #1a1a1a;
      line-height: 1.5;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      page-break-after: always;
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      background: white;
      padding: var(--top-margin) var(--outer-margin) var(--bottom-margin) var(--outer-margin);
    }

    .page.odd { padding-left: var(--gutter); padding-right: var(--outer-margin); }
    .page.even { padding-left: var(--outer-margin); padding-right: var(--gutter); }

    .header {
      height: 10mm;
      font-family: var(--heading-serif);
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #777;
      display: flex;
      justify-content: space-between;
      border-bottom: 0.2pt solid #eee;
      margin-bottom: 8mm;
    }

    .page-content {
      flex: 1;
      font-family: var(--primary-serif);
      font-size: 11.5pt;
      text-align: justify;
      hyphens: auto;
    }

    .chapter-start .page-content {
      padding-top: 15mm;
    }

    .chapter-number {
      font-family: var(--heading-serif);
      font-size: 24pt;
      font-weight: 300;
      text-align: center;
      margin-bottom: 12mm;
      color: #333;
    }

    .block { margin-bottom: 6mm; }

    /* STATE OF THE ART TYPOGRAPHY */
    .first-paragraph.side-by-side .l1-col::first-letter,
    .first-paragraph.stacked .l1-col::first-letter {
      float: left;
      font-family: var(--heading-serif);
      font-size: 3.5em;
      line-height: 0.8;
      padding: 0.1em 0.1em 0 0;
      color: #000;
    }

    .side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
    }

    .l1-col { font-weight: 400; color: #111; }
    .l2-col { font-weight: 400; color: #555; font-style: italic; }

    /* Script Specifics in PDF */
    .script-cjk {
      line-break: strict;
      word-break: keep-all;
      overflow-wrap: break-word;
      text-align: justify;
    }

    .script-thai {
      line-height: 1.8;
      word-break: break-all;
    }

    .script-arabic, .script-hebrew, .script-devanagari {
      line-height: 1.6;
    }

    .interlinear {
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }
    .interlinear .l2-col {
      font-size: 0.9em;
      opacity: 0.85;
      padding-left: 4mm;
      border-left: 1.5pt solid #f0f0f0;
    }

    .separator {
      margin: 10mm auto;
      border-bottom-style: solid;
      border-bottom-color: #ddd;
    }
    .separator.ornament {
      border: none;
      text-align: center;
      font-size: 18pt;
      color: #999;
    }

    .image-block { margin: 8mm 0; }
    .image-wrapper { overflow: hidden; display: inline-block; }
    .image-wrapper img { width: 100%; display: block; }
    .caption {
      margin-top: 3mm;
      font-size: 9pt;
      color: #666;
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }

    .callout {
      padding: 6mm;
      border-left: 3pt solid;
      margin: 8mm 0;
    }
    .callout-header {
      font-family: var(--heading-serif);
      font-weight: 700;
      font-size: 8pt;
      letter-spacing: 0.05em;
      margin-bottom: 3mm;
    }
    .callout-body {
      font-size: 10.5pt;
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }

    /* Table Blocks */
    .table-block {
      margin: 8mm 0;
    }
    .table-block table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .table-block th,
    .table-block td {
      padding: 3mm;
      border: 0.5pt solid #ddd;
      text-align: left;
    }
    .table-block th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    .table-block tr:nth-child(even) {
      background-color: #fafafa;
    }

    .footer {
      height: 10mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 5mm;
    }
    .page-number {
      font-family: var(--heading-serif);
      font-size: 10pt;
      color: #444;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      color: #eee;
      z-index: -1;
      font-size: 40pt;
      white-space: nowrap;
    }
  `;
}
