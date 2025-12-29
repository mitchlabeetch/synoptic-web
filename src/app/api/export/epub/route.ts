// src/app/api/export/epub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getProject } from '@/lib/db/server';
import { generateEpub } from '@/services/epubExport';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = getUserId(user);
  const { projectId } = await request.json();

  // Fetch project
  const project = await getProject(projectId, userId);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const epubBlob = await generateEpub(project, {
      title: project.title,
      author: user.email || 'Synoptic Author',
      language: project.source_lang || 'fr',
      identifier: project.id,
    });

    const buffer = await epubBlob.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${project.title}.epub"`,
      },
    });
  } catch (err: any) {
    console.error('EPUB Export Error:', err);
    return NextResponse.json({ error: 'EPUB generation failed' }, { status: 500 });
  }
}
