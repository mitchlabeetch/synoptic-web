// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getProject, getUserProfile } from '@/lib/db/server';
import { isRTL, getLanguageByCode } from '@/data/languages';
import { sanitizeHTMLStrict, escapeHTML } from '@/lib/sanitize';

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
  const html = generateProjectHTML(project, isFreeTier);
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
        options: {
          colorMode: options?.colorMode || 'sRGB',
          resolution: isFreeTier ? 150 : 300,
          watermark: isFreeTier,
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

function generateProjectHTML(project: any, watermark: boolean): string {
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
          ${isChapter ? `<div class="chapter-number">Chapter ${page.number || idx + 1}</div>` : ''}
          ${page.blocks.map((block: any, bIdx: number) => renderBlock(block, project, isChapter && bIdx === 0)).join('')}
        </div>

        <div class="footer">
          <div class="page-number">${idx + 1}</div>
        </div>
        
        ${watermark ? `
          <div class="watermark opacity-10 select-none pointer-events-none" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAwIiB6b29tQW5kUGFuPSJtYWduaWZ5IiB2aWV3Qm94PSIwIDAgMzc1IDM3NC45OTk5OTEiIGhlaWdodD0iNTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjAiPjxwYXRoIGZpbGw9IiNmOTcyNmUiIGQ9Ik0gMTg2LjI1MzkwNiA1MS4xNDA2MjUgQyAxODcuNzU3ODEyIDUwLjg5MDYyNSAxODkuMzEyNSA1MC43OTY4NzUgMTkwLjc2NTYyNSA1MC4zNzEwOTQgQyAyMDMuNTI3MzQ0IDQ2LjYwMTU2MiAyMTYuNTgyMDMxIDQ0LjQ4MDQ2OSAyMjkuODU1NDY5IDQ0LjUzOTA2MiBDIDI1OC41NzQyMTkgNDQuNjY0MDYyIDI4NS4xMDU0NjkgNTIuMDc0MjE5IDMwOC43MzgyODEgNjguOTMzNTk0IEMgMzIxLjIwMzEyNSA3Ny44MjgxMjUgMzMyLjAxOTUzMSA4OC4zMjgxMjUgMzQwLjgxMjUgMTAwLjgyMDMxMiBDIDM1MC41IDExNC41ODIwMzEgMzU3LjU4MjAzMSAxMjkuNjQwNjI1IDM2Mi4wNjY0MDYgMTQ1Ljg5NDUzMSBDIDM2NS42MDkzNzUgMTU4LjcxODc1IDM2Ny40MTQwNjIgMTcxLjgwNDY4OCAzNjcuMTgzNTk0IDE4NS4wODU5MzggQyAzNjYuNzc3MzQ0IDIwOC40ODA0NjkgMzYwLjk5NjA5NCAyMzAuNTQyOTY5IDM0OS42NTIzNDQgMjUxLjAzMTI1IEMgMzQ2LjQyOTY4OCAyNTYuODUxNTYyIDM0Mi42MzI4MTIgMjYyLjM3MTA5NCAzMzguODU1NDY5IDI2Ny44NTU0NjkgQyAzMzcuNjk1MzEyIDI2OS41MzkwNjIgMzM3LjM2MzI4MSAyNzAuODI4MTI1IDMzOC4wNDI5NjkgMjcyLjc1IEMgMzQyLjI4MTI1IDI4NC43MzA0NjkgMzQ2LjQwNjI1IDI5Ni43NTM5MDYgMzUwLjU3MDMxMiAzMDguNzYxNzE5IEMgMzUxLjIwMzEyNSAzMTAuNTgyMDMxIDM1MS44NjcxODggMzEyLjM5MDYyNSAzNTIuNDQ5MjE5IDMxNC4yMjY1NjIgQyAzNTQuMTY3OTY5IDMxOS42NDA2MjUgMzQ5LjY3OTY4OCAzMjUuMjU3ODEyIDM0My42NDg0MzggMzIzLjM4MjgxMiBDIDM0My42NDg0MzggMzIzLjM4MjgxMiAzNDMuNjQ4NDM4IDMyMy4zODI4MTIgMzQzLjY0ODQzOCAzMjMuMzgyODEyIEMgMzM4Ljc1IDMyMS44NTkzNzUgMzMzLjg4NjcxOSAzMjAuMjE0ODQ0IDMyOS4wMjczNDQgMzE4LjU3MDMxMiBDIDMxOC40NTMxMjUgMzE0Ljk5MjE4OCAzMDcuODc4OTA2IDMxMS40MTc5NjkgMjk3LjMzNTkzOCAzMDcuNzQ2MDk0IEMgMjk0Ljk4NDM3NSAzMDYuOTI5Njg4IDI5Mi45Njg3NSAzMDcuMDQ2ODc1IDI5MC43MzQzNzUgMzA4LjIyMjY1NiBDIDI3Ny43ODEyNSAzMTUuMDU4NTk0IDI2My45ODQzNzUgMzE5LjQyNTc4MSAyNDkuNDk2MDk0IDMyMS4zODI4MTIgQyAyMzYuODU5Mzc1IDMyMy4wODU5MzggMjI0LjE3NTc4MSAzMjMuMzY3MTg4IDIxMS4zMDg1OTQgMzIwLjcxNDg0NCBDIDIxMi40NzI2NTYgMzE5LjQ3MjY1NiAyMTMuNzk2ODc1IDMxOC40ODgyODEgMjE1LjI2NTYyNSAzMTcuODQ3NjU2IEMgMjI1LjcxNDg0NCAzMTMuMjk2ODc1IDIzNC4zODI4MTIgMzA2LjE3OTY4OCAyNDIuNzc3MzQ0IDI5OC43MTA5MzggQyAyNDkuMDA3ODEyIDI5My4xNzE4NzUgMjU0LjI4MTI1IDI4Ni43MjI2NTYgMjU5LjA3MDMxMiAyNzkuOTI5Njg4IEMgMjYxLjA4MjAzMSAyNzcuMDc0MjE5IDI2My43NSAyNzQuNDI1NzgxIDI2NC4wNzgxMjUgMjcwLjYyODkwNiBDIDI2NC4xMTcxODggMjcwLjY2NDA2MiAyNjQuMTA1NDY5IDI3MC43NjE3MTkgMjY0LjM2MzI4MSAyNzAuNzUzOTA2IEMgMjY0Ljk3NjU2MiAyNzAuNDMzNTk0IDI2NS4zMzU5MzggMjcwLjEyNSAyNjUuODYzMjgxIDI2OS42MTcxODggQyAyODAuMTk5MjE5IDI2Mi40Mjk2ODggMjkyLjIwNzAzMSAyNTIuODEyNSAzMDEuNDU3MDMxIDIzOS45Mzc1IEMgMzE3LjI0NjA5NCAyMTcuOTUzMTI1IDMyMy41NTg1OTQgMTkzLjY2NDA2MiAzMTguNzk2ODc1IDE2Ni44MDQ2ODggQyAzMTUuOTE3OTY5IDE1MC41NDY4NzUgMzA5LjA1MDc4MSAxMzYuMDQ2ODc1IDI5OC44MDQ2ODggMTIzLjE2Nzk2OSBDIDI4OS4wMjM0MzggMTEwLjg3MTA5NCAyNzYuNzE4NzUgMTAxLjc5Mjk2OSAyNjIuMjU3ODEyIDk1LjcwNzAzMSBDIDI1Ny40MTQwNjIgOTMuNjY3OTY5IDI1Mi4zNTU0NjkgOTIuMTc5Njg4IDI0Ni43NzczNDQgOTEuODAwNzgxIEMgMjQzLjE0ODQzOCA5MS4xMDE1NjIgMjM5Ljc5Njg3NSA5MC4xNzU3ODEgMjM2LjM5ODQzOCA4OS45NTcwMzEgQyAyMjEuMjc3MzQ0IDg4Ljk4MDQ2OSAyMDYuOTYwOTM4IDkyLjM2MzI4MSAxOTMuMjUgOTguNTQyOTY5IEMgMTkxLjQ2ODc1IDk5LjM0Mzc1IDE5MC4wMTU2MjUgMTAwLjg3ODkwNiAxODguMTU2MjUgMTAyLjA5NzY1NiBDIDE4Ni4wNDI5NjkgMTAzLjI1MzkwNiAxODQuMDc0MjE5IDEwNC4yMzQzNzUgMTgyLjM0NzY1NiAxMDUuNTM1MTU2IEMgMTY4LjM4MjgxMiAxMTYuMDc4MTI1IDE1Ny4xMzI4MTIgMTI4LjgxMjUgMTUwLjEzMjgxMiAxNDUuMDc0MjE5IEMgMTQzLjEyODkwNiAxNjEuMzQ3NjU2IDEzOS45Mjk2ODggMTc4LjIxODc1IDE0Mi42NDA2MjUgMTk1Ljc5Njg3NSBDIDE0Ni4wMTE3MTkgMjE3LjYyODkwNiAxNTUuNDk2MDk0IDIzNi41MTE3MTkgMTcxLjUwMzkwNiAyNTEuOTUzMTI1IEMgMTcyLjg3MTA5NCAyNTMuMjczNDM4IDE3NC4wNzgxMjUgMjU0Ljc1MzkwNiAxNzUuMDkzNzUgMjU2LjIwMzEyNSBDIDE2NC43NjE3MTkgMjYxLjIxODc1IDE1My45NzY1NjIgMjYzLjA1MDc4MSAxNDIuOTAyMzQ0IDI2My4wMDM5MDYgQyAxMzguMTA5Mzc1IDI2Mi45ODQzNzUgMTMzLjMwNDY4OCAyNjEuOTEwMTU2IDEyOC41MjczNDQgMjYxLjE3NTc4MSBDIDEyNC44ODY3MTkgMjYwLjYxMzI4MSAxMjEuMjgxMjUgMjU5LjgzMjAzMSAxMTcuNDMzNTk0IDI1OS4wMjM0MzggQyAxMTIuMjAzMTI1IDI1MS44Mzk4NDQgMTA4LjU1ODU5NCAyNDQuMDU4NTk0IDEwNS4zNjMyODEgMjM2LjA3NDIxOSBDIDk5LjI1NzgxMiAyMjAuODIwMzEyIDk1Ljc3NzM0NCAyMDQuOTg4MjgxIDk1LjI4MTI1IDE4OC41MjczNDQgQyA5NC45MTc5NjkgMTc2LjUzOTA2MiA5Ni4wOTc2NTYgMTY0LjY5OTIxOSA5OC41MjM0MzggMTUyLjk3MjY1NiBDIDEwMC45NTMxMjUgMTQxLjIxODc1IDEwNS4wMzEyNSAxMzAuMDE5NTMxIDExMC4zNDc2NTYgMTE5LjMwNDY4OCBDIDExNS4yMTA5MzggMTA5LjUwNzgxMiAxMjEuMzk4NDM4IDEwMC41MTU2MjUgMTI4LjMwODU5NCA5MS43NjU2MjUgQyAxMzIuOTgwNDY5IDg3LjI3MzQzOCAxMzcuNDE3OTY5IDgyLjg1OTM3NSAxNDEuOTMzNTk0IDc4LjUzNTE1NiBDIDE0Ny44Nzg5MDYgNzIuODQzNzUgMTU0LjY1MjM0NCA2OC4yNjU2MjUgMTYxLjYyMTA5NCA2My45Mzc1IEMgMTY4LjM5MDYyNSA1OS43MzQzNzUgMTc1LjY0MDYyNSA1Ni41NDY4NzUgMTgzLjAwNzgxMiA1My41ODIwMzEgQyAxODQuMjIyNjU2IDUzLjA5Mzc1IDE4NS4xNzk2ODggNTEuOTcyNjU2IDE4Ni4yNTM5MDYgNTEuMTQwNjI1IFogTSAxODYuMjUzOTA2IDUxLjE0MDYyNSAiIGZpbGwtb3BhY2l0eT0iMSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZmlsbD0iIzMwYjhjOCIgZD0iTSAxODkuMjM0Mzc1IDMxNS42MDU0NjkgQyAxODcuNDkyMTg4IDMxNS45NDUzMTIgMTg1LjY5NTMxMiAzMTYuMTI4OTA2IDE4NC4wMDc4MTIgMzE2LjY1MjM0NCBDIDE2MC45MTAxNTYgMzIzLjgxNjQwNiAxMzcuNjAxNTYyIDMyNC41NDI5NjkgMTE0LjA2NjQwNiAzMTkuMDU0Njg4IEMgMTAzLjY0MDYyNSAzMTYuNjIxMDk0IDkzLjYyNSAzMTMuMDc0MjE5IDg0LjE5MTQwNiAzMDcuOTg0Mzc1IEMgODIuNDg4MjgxIDMwNy4wNjY0MDYgODAuOTcyNjU2IDMwNi45MTc5NjkgNzkuMDg5ODQ0IDMwNy41NjY0MDYgQyA2NS45ODQzNzUgMzEyLjA4MjAzMSA1Mi44NDM3NSAzMTYuNDg4MjgxIDM5LjcxMDkzOCAzMjAuOTE0MDYyIEMgMzcuMjgxMjUgMzIxLjczNDM3NSAzNC44NTE1NjIgMzIyLjU4MjAzMSAzMi4zNzg5MDYgMzIzLjI1IEMgMjYuMTAxNTYyIDMyNC45NTcwMzEgMjEuNTMxMjUgMzIwLjY3MTg3NSAyMi45NjA5MzggMzE0LjM1MTU2MiBDIDIzLjQ5NjA5NCAzMTEuOTg4MjgxIDI0LjQ4NDM3NSAzMDkuNzIyNjU2IDI1LjI4OTA2MiAzMDcuNDIxODc1IEMgMjkuMTQ4NDM4IDI5Ni4zOTg0MzggMzIuOTc2NTYyIDI4NS4zNTkzNzUgMzYuOTA2MjUgMjc0LjM1OTM3NSBDIDM3LjgwMDc4MSAyNzEuODYzMjgxIDM3LjY5NTMxMiAyNjkuODc4OTA2IDM2LjAzOTA2MiAyNjcuNTg5ODQ0IEMgMjUuNjQ4NDM4IDI1My4yMTA5MzggMTcuNzkyOTY5IDIzNy41NzgxMjUgMTMuMTA5Mzc1IDIyMC4zOTg0MzggQyA4LjU5NzY1NiAyMDMuODY3MTg4IDcuMTg3NSAxODcuMTE3MTg4IDguNzczNDM4IDE3MC4wNTA3ODEgQyAxMC41ODU5MzggMTUwLjU4MjAzMSAxNi4zMDQ2ODggMTMyLjMyODEyNSAyNS42NDg0MzggMTE1LjIzODI4MSBDIDQzLjE1NjI1IDgzLjIxNDg0NCA2OS41NDI5NjkgNjEuNzYxNzE5IDEwNC4xNDQ1MzEgNTAuNDY4NzUgQyAxMTQuOTE0MDYyIDQ2Ljk1MzEyNSAxMjYuMDc4MTI1IDQ1LjA1NDY4OCAxMzcuNDUzMTI1IDQ0Ljg0Mzc1IEMgMTQyLjk2MDkzOCA0NC43NDYwOTQgMTQ4LjQ3MjY1NiA0NC44ODI4MTIgMTU0LjE3MTg3NSA0NS4xODM1OTQgQyAxNTQuMTk1MzEyIDQ1LjY0NDUzMSAxNTQuMDE1NjI1IDQ1LjgyNDIxOSAxNTMuODc1IDQ2LjAzNTE1NiBDIDE1My44NDM3NSA0Ni4wNzgxMjUgMTUzLjk0OTIxOSA0Ni4zMDA3ODEgMTUzLjk5NjA5NCA0Ni4zMDQ2ODggQyAxNTUuNTE1NjI1IDQ2LjM2MzI4MSAxNTcuMDM5MDYyIDQ2LjM0Mzc1IDE1OC41NDY4NzUgNDYuNDg0Mzc1IEMgMTU5LjMxNjQwNiA0Ni41NTQ2ODggMTYwLjA1NDY4OCA0Ni45MjE4NzUgMTYwLjgwODU5NCA0Ny4xNTIzNDQgTCAxNjEuNDI1NzgxIDQ4LjI3MzQzOCBDIDE2MC44MjgxMjUgNDguNTA3ODEyIDE2MC4yMDMxMjUgNDguNjkxNDA2IDE1OS42Mjg5MDYgNDguOTgwNDY5IEMgMTUyLjE4NzUgNTIuNzEwOTM4IDE0NS4zNjcxODggNTcuNDIxODc1IDEzOC44MjgxMjUgNjIuNTIzNDM4IEMgMTM0LjkyOTY4OCA2NS41NjY0MDYgMTMwLjkwMjM0NCA2OC40NTMxMjUgMTI3Ljk0NTMxMiA3Mi42MTMyODEgQyAxMjUuMzcxMDk0IDc2LjIzNDM3NSAxMjIuNDQxNDA2IDc5LjY0ODQzOCAxMTkuMzUxNTYyIDgyLjg0Mzc1IEMgMTE1LjYxNzE4OCA4Ni43MDcwMzEgMTEzLjI5Njg3NSA5MS4yNjk1MzEgMTExLjM4MjgxMiA5Ni40MDIzNDQgQyAxMDUuNzUgOTkuNjc1NzgxIDEwMC4wMzEyNSAxMDIuMzk0NTMxIDk0Ljg5ODQzOCAxMDUuOTU3MDMxIEMgODMuMTIxMDk0IDExNC4xMjg5MDYgNzQuMDE1NjI1IDEyNC43NTc4MTIgNjcuMDYyNSAxMzcuMzM1OTM4IEMgNTcuMTc5Njg4IDE1NS4yMTA5MzggNTMuMDk3NjU2IDE3NC4zMjQyMTkgNTUuNjI1IDE5NC40Njg3NSBDIDU4LjY0MDYyNSAyMTguNSA2OS4xOTUzMTIgMjM4Ljg5ODQzOCA4Ny41ODU5MzggMjU0Ljk4ODI4MSBDIDk3Ljk4ODI4MSAyNjQuMDg5ODQ0IDEwOS43NjU2MjUgMjcwLjY0MDYyNSAxMjMuMTYwMTU2IDI3NC4xNjAxNTYgQyAxMjUuMTIxMDk0IDI3NC42NzU3ODEgMTI3LjE3MTg3NSAyNzQuODQzNzUgMTI5LjQ0OTIxOSAyNzUuMzIwMzEyIEMgMTMzLjg2MzI4MSAyNzcuMzA0Njg4IDEzOC4yODkwNjIgMjc2Ljc1IDE0Mi42MTcxODggMjc2LjkyNTc4MSBDIDE1Ni45MjE4NzUgMjc3LjUxMTcxOSAxNzAuMzAwNzgxIDI3NCAxODIuOTU3MDMxIDI2Ny41MjM0MzggQyAxODQuNDcyNjU2IDI2Ni43NSAxODUuNjYwMTU2IDI2NS4zMzU5MzggMTg3LjI5Njg3NSAyNjQuMTk5MjE5IEMgMTg5LjQ3MjY1NiAyNjMuMTA1NDY5IDE5MS40NjQ4NDQgMjYyLjE4NzUgMTkzLjIxMDkzOCAyNjAuOTI1NzgxIEMgMjAwLjEwMTU2MiAyNTUuOTQ1MzEyIDIwNi4zMjAzMTIgMjUwLjI1NzgxMiAyMTEuNjQwNjI1IDI0My41NzAzMTIgQyAyMjguNjA1NDY5IDIyMi4yNDYwOTQgMjM2LjE2MDE1NiAxOTguMTgzNTk0IDIzMi41ODIwMzEgMTcxLjAxOTUzMSBDIDIzMi41ODIwMzEgMTcxLjAxOTUzMSAyMzIuNTgyMDMxIDE3MS4wMTk1MzEgMjMyLjU4MjAzMSAxNzEuMDE5NTMxIEMgMjI5Ljg1MTU2MiAxNTAuMjgxMjUgMjIxLjAwNzgxMiAxMzIuMzU1NDY5IDIwNi41ODU5MzggMTE3LjE5MTQwNiBDIDIwNS43MTQ4NDQgMTE2LjI3MzQzOCAyMDQuOTYwOTM4IDExNS4yNDYwOTQgMjA0LjI1NzgxMiAxMTQuMTY3OTY5IEMgMjA0LjE4MzU5NCAxMTMuOTI5Njg4IDIwNC4wMDc4MTIgMTEzLjc4NTE1NiAyMDMuODgyODEyIDExMy42NDA2MjUgQyAyMDMuOTI5Njg4IDExMy42MzY3MTkgMjAzLjg5NDUzMSAxMTMuNzI2NTYyIDIwMy45NDE0MDYgMTEzLjQyMTg3NSBDIDIwNC4wNzAzMTIgMTEwLjI2OTUzMSAyMDUuOTUzMTI1IDEwOC40MTAxNTYgMjA4LjI0NjA5NCAxMDcuNzgxMjUgQyAyMTMuNjA5Mzc1IDEwNi4zMTY0MDYgMjE5LjA4NTk3NyAxMDUuMDUwNzgxIDIyNC42MDE1NjIgMTA0LjM4NjcxOSBDIDIyOS4xMzI4MTIgMTAzLjgzOTg0NCAyMzMuNzg1MTU2IDEwNC4yMTQ4NDQgMjM4LjM4MjgxMiAxMDQuMzEyNSBDIDIzOS44ODY3MTkgMTA0LjMzOTg0NCAyNDEuNDIxODc1IDEwNC42MjEwOTQgMjQyLjg2NzE4OCAxMDUuMDQ2ODc1IEMgMjQ3LjM3MTA5NCAxMDYuMzc1IDI1MS44MzU5MzggMTA3Ljg1MTU2MiAyNTYuMzM1OTM4IDEwOS4yMTQ4NDQgQyAyNTcuMTY0MDYyIDEwOS40Njg3NSAyNTguMDcwMzEyIDEwOS40NTcwMzEgMjU4LjkxNDA2MiAxMDkuNjA5Mzc1IEMgMjU4Ljg4NjcxOSAxMDkuNjUyMzQ0IDI1OC44MDA3ODEgMTA5LjU5NzY1NiAyNTguODk0NTMxIDEwOS44MDA3ODEgQyAyNTkuMjE0ODQ0IDExMC4xOTE0MDYgMjU5LjQ0NTMxMiAxMTAuMzgyODEyIDI1OS44Nzg5MDYgMTEwLjcxODc1IEMgMjc3LjMyODEyNSAxNDAuNTYyNSAyODMuNTkzNzUgMTcyLjM1NTQ2OSAyNzguMTgzNTk0IDIwNi4zMjAzMTIgQyAyNzQuMzcxMDk0IDIzMC4yNSAyNjQuNzI2NTYyIDI1MS42MzI4MTIgMjQ5LjYwNTQ2OSAyNzAuNTYyNSBDIDI0OC4yNTc4MTIgMjcyLjI1IDI0Ny4wMjczNDQgMjc0LjAzOTA2MiAyNDUuNTQyOTY5IDI3NS45MjU3ODEgQyAyNDQuMiwxNzcuMTc1NzgxIDI0Mi43ODkwNjIgMjc4LjQzMzU5NCAyNDEuNDIxODc1IDI3OS43MDMxMjUgQyAyMzUuOTg4MjgxIDI4NC43MjY1NjIgMjMwLjgyODEyNSAyOTAuMDkzNzUgMjI1LjA2NjQwNiAyOTQuNzA3MDMxIEMgMjE1LjIzNDM3NSAzMDIuNTY2NDA2IDIwNC4yMTQ4NDQgMzA4LjUwMzkwNiAxOTIuNTI3MzQ0IDMxMy4xOTkyMTkgQyAxOTEuMzA0Njg4IDMxMy42OTE0MDYgMTkwLjMyODEyNSAzMTQuNzg5MDYyIDE4OS4yMzQzNzUgMzE1LjYwNTQ2OSBaIE0gMTg5LjIzNDM3NSAzMTUuNjA1NDY5ICIvPiA8cGF0aCBmaWxsPSIjZGQ2MjVlIiBkPSJNIDE4OS40Njg3NSAzMTUuNzczNDM4IEMgMTkwLjMyODEyNSAzMTQuNzg5MDYyIDE5MS4zMDQ2ODggMzEzLjY5MTQwNiAxOTIuNTI3MzQ0IDMxMy4xOTkyMTkgQyAyMDQuMjE0ODQ0IDMwOC41MDM5MDYgMjE1LjIzNDM3NSAzMDIuNTY2NDA2IDIyNS4wNjY0MDYgMjk0LjcwNzAzMSBDIDIzMC44MjgxMjUgMjkwLjA5Mzc1IDIzNS45ODgzMDcgMjg0LjcyNjU2MiAyNDEuNDIxODc1IDI3OS43MDMxMjUgQyAyNDIuNzMwNDY5IDI3OC40OTIxODggMjQ0LjAzOTA2MiAyNzcuMjg1MTU2IDI0NS44NjcxODggMjc1Ljg3NSBDIDI1MC4wOTM3NSAyNzQuNjc1NzgxIDI1My44MTY0MDYgMjczLjcxNDg0NCAyNTcuNTExNzE5IDI3Mi42Njc5NjkgQyAyNTkuNzA3MDMxIDI3Mi4wNDY4NzUgMjYxLjg2NzE4OCAyNzEuMjkyOTY5IDI2NC4wMzkwNjIgMjcwLjU5NzY1NiBDIDI2My43NSAyNzQuNDI1NzgxIDI2MS4wODIwMzEgMjc3LjA3NDIxOSAyNTkuMDcwMzEyIDI3OS45Mjk2ODggQyAyNTQuMjgxMjUgMjg2LjcyMjY1NiAyNDkuMDExNzE5IDI5My4xNzE4NzUgMjQyLjc3NzM0NCAyOTguNzEwOTM4IEMgMjM0LjM4MjgxMiAzMDYuMTc5Njg4IDIyNS43MTQ4NDQgMzEzLjI5Njg3NSAyMTUuMjY1NjI1IDMxNy44NDc2NTYgQyAyMTMuNzk2ODc1IDMxOC40ODgzMDcgMjEyLjQ3MjY1NiAzMTkuNDcyNjU2IDIxMS4wNDI5NjkgMzIwLjU1ODU5NCBDIDIwMy41ODk4NDQgMzIwLjU1ODU5NCAxOTYuNTgyMDMxIDMxOC41MzkwNjIgMTg5LjQ2ODc1IDMxNS43NzM0MzggWiBNIDE4OS40Njg3NSAzMTUuNzczNDM4ICIvPjxwYXRoIGZpbGw9IiMyYjljYWQiIGQ9Ik0gMTExLjU2MjUgOTYuMjM0Mzc1IEMgMTEzLjI5Njg3NSA5MS4yNjk1MzEgMTE1LjYxNzE4OCA4Ni43MDcwMzEgMTE5LjM1MTU2MiA4Mi44NDM3NSBDIDEyMi40NDA5NzggNzkuNjQ4NDM4IDEyNS4zNzEwOTQgNzYuMjM0Mzc1IDEyNy45NDUzMTIgNzIuNjEzMjgxIEMgMTMwLjkwMjM0NCA2OC40NTMxMjUgMTM0LjkyOTY4OCA2NS41NjY0MDYgMTM4LjgyODEyNSA2Mi41MjM0MzggQyAxNDUuMzY3MTg4IDU3LjQyMTg3NSAxNTIuMTg3NSA1Mi43MTA5MzggMTU5LjYyODkwNiA0OC45ODA0NjkgQyAxNjAuMjAzMTI1IDQ4LjY5MTQwNiAxNjAuODI4MTI1IDQ4LjUwNzgxMiAxNjEuNDI1NzgxIDQ4LjI3MzQzOCBMIDE2MC44MDg1OTQgNDcuMTUyMzQ0IEMgMTYwLjA1NDY4OCA0Ni45MjE4NzUgMTU5LjMxNjQwNiA0Ni41NTQ2ODggMTU4LjU0Njg3NSA0Ni40ODQzNzUgQyAxNTcuMDM5MDYyIDQ2LjM0Mzc1IDE1NS41MTU2MjUgNDYuMzYzMjgxIDE1My45OTYwOTQgNDYuMzA0Njg4IEMgMTUzLjk0OTIxOSA0Ni4zMDA3ODEgMTUzLjg0Mzc1IDQ2LjA3ODEyNSAxNTMuODc1IDQ2LjAzNTE1NiBDIDE1NC4wMTU2MjUgNDUuODI0MjE5IDE1NC4xOTUzMTIgNDUuNjQ0NTMxIDE1NC41IDQ1LjI4NTE1NiBDIDE1OC43MTE0MDYgNDUuNjY3OTY5IDE2Mi45MDYyNSA0Ni4xNzU3ODEgMTY3LjA4NTkzOCA0Ni44MTI1IEMgMTcwLjczMDQ2OSA0Ny4zNjcxODggMTc0LjM3ODkwNiA0Ny45NDE0MDYgMTc3Ljk4MDQ2OSA0OC43MjI2NTYgQyAxODAuNTk3NjU2IDQ5LjI4OTA2MiAxODMuMTQwNjI1IDUwLjE5OTIxOSAxODUuOTg0Mzc1IDUxLjA1MDc4MSBDIDE4NS4xNzk2ODggNTEuOTcyNjU2IDE4NC4yMjI2NTYgNTMuMDkzNzUgMTgzLjAwNzgxMiA1My41ODIwMzEgQyAxNzUuNjM2NzE5IDU2LjU0Njg3NSAxNjguMzkwNjI1IDU5LjczNDM3NSAxNjEuNjIxMDk0IDYzLjkzNzUgQyAxNTQuNjUyMzQ0IDY4LjI2NTYyNSAxNDcuODc4OTA2IDcyLjg0Mzc1IDE0MS45MzM1OTQgNzguNTM1MTU2IEMgMTM3LjQxNzk2OSA4Mi44NTkzNzUgMTMyLjk4MDQ2OSA4Ny4yNzM0MzggMTI3Ljk1NzAzMSA5MS43MDMxMjUgQyAxMjIuMTIxMDk0IDkzLjI1IDExNi44Mzk4NDQgOTQuNzQyMTg4IDExMS41NjI1IDk2LjIzNDM3NSBaIE0gMTExLjU2MjUgOTYuMjM0Mzc1ICIvPjxwYXRoIGZpbGw9IiMyYzljYWQiIGQ9Ik0gMjQ2Ljc3NzM0NCA5MS44MDA3ODEgQyAyNTAuOTYwOTM4IDk3LjU0Mjk2OSAyNTUuMDE1NjI1IDEwMy4zNzUgMjU4Ljk0MTQwNiAxMDkuMjkyOTY5IEMgMjU4LjA3MDMxMiAxMDkuNDU3MDMxIDI1Ny4xNjQwNjIgMTA5LjQ2ODc1IDI1Ni4zMzU5MzggMTA5LjIxNDg0NCBDIDI1MS44MzU5MzggMTA3Ljg1MTU2MiAyNDcuMzcxMDk0IDEwNi4zNzUgMjQyLjg2NzE4OCAxMDUuMDQ2ODc1IEMgMjQxLjQyMTg3NSAxMDQuNjIxMDk0IDIzOS44ODY3MTkgMTA0LjMzOTg0NCAyMzguMzgyODEyIDEwNC4zMTI1IEMgMjMzLjc4NTE1NiAxMDQuMjE0ODQ0IDIyOS4xMzI4MTIgMTAzLjgzOTg0NCAyMjQuNjAxNTYyIDEwNC4zODY3MTkgQyAyMTkuMDg1OTM4IDEwNS4wNTA3ODEgMjEzLjYxMzI4MSAxMDYuMzE2NDA2IDIwOC4yNDYwOTQgMTA3Ljc4MTI1IEMgMjA1Ljk1MzEyNSAxMDguNDEwMTU2IDIwNC4wNzAzMTIgMTEwLjI2OTUzMSAyMDMuOTQxNDA2IDExMy40MjE4NzUgQyAyMDIuNjAxNTYyIDExMi43NjU2MjUgMjAxLjMwNDY4OCAxMTEuODA4NTk0IDIwMC4wMTk1MzEgMTEwLjgzOTg0NCBDIDE5Ni4yODUxNTYgMTA4LjAzMTI1IDE5Mi41NTg1OTQgMTA1LjIxODc1IDE4OC42MjEwOTQgMTAyLjIzODI4MSBDIDE5MC4wMTU2MjUgMTAwLjg3ODkwNiAxOTEuNDY4NzUgOTkuMzQzNzUgMTkzLjI1IDk4LjU0Mjk2OSBDIDIwNi45NjA5MzggOTIuMzYzMjgxIDIyMS4yNzczNDQgODguOTgwNDY5IDIzNi40MDIzNDQgODkuOTU3MDMxIEMgMjM5Ljc5Njg3NSA5MC4xNzU3ODEgMjQzLjE0ODQzOCA5MS4xMDE1NjIgMjQ2Ljc3NzM0NCA5MS44MDA3ODEgWiBNIDI0Ni43NzczNDQgOTEuODAwNzgxICIvPjxwYXRoIGZpbGw9IiNkZTYzNWYiIGQ9Ik0gMTI5LjQ0OTIxOSAyNzUuMzIwMzEyIEMgMTI1LjQyNTc4MSAyNzAuMTAxNTYyIDEyMS41MDc4MTIgMjY0LjgwNDY4OCAxMTcuNjk1MzEyIDI1OS40Mjk2ODggQyAxMjEuMjgxMjUgMjU5LjgzMjAzMSAxMjQuODg2NzE5IDI2MC42MTMyODEgMTI4LjUyNzM0NCAyNjEuMTc1NzgxIEMgMTMzLjMwNDY4OCAyNjEuOTEwMTU2IDEzOC4xMDkzNzUgMjYyLjk4NDM3NSAxNDIuOTA2MjUgMjYzLjAwMzkwNiBDIDE1My45NzY1NjIgMjYzLjA1MDc4MSAxNjQuNzYxNzE5IDI2MS4yMTg3NSAxNzUuMDkzNzUgMjU2LjIwMzEyNSBDIDE3Ni45ODA0NjkgMjU3LjMxNjQwNiAxNzguNTg5ODQ0IDI1OC40ODgyODEgMTgwLjIyNjU2MiAyNTkuNjI1IEMgMTgyLjMyMDMxMiAyNjEuMDc0MjE5IDE4NC40MzM1OTQgMjYyLjQ5NjA5NCAxODYuNzY5NTMxIDI2NC4wNzQyMTkgQyAxODUuNjYwMTU2IDI2NS4zMzU5MzggMTg0LjQ3MjY1NiAyNjYuNzUgMTgyLjk1MzEyNSAyNjcuNTIzNDM4IEMgMTcwLjMwMDc4MSAyNzQgMTU2LjkxNzk2OSAyNzcuNTA3ODEyIDE0Mi42MTcxODggMjc2LjkyNTc4MSBDIDEzOC4yODkwNjIgMjc2Ljc1IDEzMy44NjMyODEgMjc3LjMwODU5NCAxMjkuNDQ5MjE5IDI3NS4zMjAzMTIgWiBNIDEyOS40NDkyMTkgMjc1LjMyMDMxMiAiLz48cGF0aCBmaWxsPSIjZGQ2MjVlIiBkPSJNIDI2NC4zNjMyODEgMjcwLjc1MzkwNiBDIDI2NC40Njg3NSAyNzAuNDY4NzUgMjY0LjgzMjAzMSAyNzAuMTc1NzgxIDI2NS40NDUzMTIgMjY5Ljg0NzY1NiBDIDI2NS4zMzU5MzggMjcwLjEyNSAyNjQuOTc2NTYyIDI3MC40MzM1OTQgMjY0LjM2MzI4MSAyNzAuNzUzOTA2IFogTSAyNjQuMzYzMjgxIDI3MC43NTM5MDYgIi8+PC9zdmc+" style="width: 120px; height: 120px; margin-bottom: 20px;" />
            <div style="font-family: 'Spectral', serif; font-size: 24pt; font-weight: 900; letter-spacing: 0.1em; color: #22687a;">SYNOPTIC STUDIO</div>
            <div style="font-family: sans-serif; font-size: 10pt; font-weight: 700; margin-top: 5px; color: #f9726e; letter-spacing: 0.2em;">BILINGUAL PUBLISHING ENGINE</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderBlock(block: any, project: any, isFirstInChapter: boolean): string {
  const layout = block.layout || 'side-by-side';
  
  if (block.type === 'text') {
    const l1Dir = isRTL(project.source_lang || 'fr') ? 'rtl' : 'ltr';
    const l2Dir = isRTL(project.target_lang || 'en') ? 'rtl' : 'ltr';
    
    const l1Script = getLanguageByCode(project.source_lang || 'fr')?.script || 'latin';
    const l2Script = getLanguageByCode(project.target_lang || 'en')?.script || 'latin';
    
    // Sanitize user content to prevent XSS
    const l1Content = sanitizeHTMLStrict(block.L1?.content || '');
    const l2Content = sanitizeHTMLStrict(block.L2?.content || '');
    
    return `
      <div class="block text-block ${layout} ${isFirstInChapter ? 'first-paragraph' : ''}">
        <div class="l1-col script-${l1Script}" dir="${l1Dir}" lang="${project.source_lang || 'fr'}">${l1Content}</div>
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

  return '';
}

function generateProjectCSS(project: any): string {
  const sourceLang = project.source_lang || 'fr';
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
