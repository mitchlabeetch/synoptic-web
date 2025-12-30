// src/app/api/projects/ingest/route.ts
// PURPOSE: Fetch and normalize content from Library sources
// ACTION: Receives sourceId and config, returns normalized pages
// MECHANISM: Uses adapter registry to fetch and transform content

import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/services/library/adapters';
import { IngestedContent } from '@/services/library/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceId, config } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Missing sourceId parameter' },
        { status: 400 }
      );
    }

    // Get the adapter for this source
    const adapter = getAdapter(sourceId);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unknown source: ${sourceId}. No adapter found.` },
        { status: 400 }
      );
    }

    // Fetch content using the adapter
    const content: IngestedContent = await adapter.fetch(config || {});

    // Transform IngestedContent to project-compatible format
    // Convert pages with IngestedLines to the editor's block format
    const pages = content.pages.map((page, pageIdx) => ({
      id: page.id || `page-${Date.now()}-${pageIdx}`,
      number: page.number || pageIdx + 1,
      isBlankPage: false,
      isChapterStart: pageIdx === 0,
      blocks: page.lines.map((line, lineIdx) => {
        // Handle different line types
        if (line.type === 'heading') {
          return {
            id: line.id || `block-${Date.now()}-${lineIdx}`,
            type: 'text',
            sourceContent: `<h2>${line.L1}</h2>`,
            targetContent: line.L2 ? `<h2>${line.L2}</h2>` : '',
            meta: line.meta,
          };
        }
        
        if (line.type === 'image' && line.meta?.imageUrl) {
          return {
            id: line.id || `block-${Date.now()}-${lineIdx}`,
            type: 'image',
            sourceContent: line.L1 || '',
            targetContent: line.L2 || '',
            imageUrl: line.meta.imageUrl,
            thumbnailUrl: line.meta.thumbnailUrl,
            meta: line.meta,
          };
        }

        if (line.type === 'separator') {
          return {
            id: line.id || `block-${Date.now()}-${lineIdx}`,
            type: 'separator',
            sourceContent: '',
            targetContent: '',
          };
        }

        // Default: text block
        return {
          id: line.id || `block-${Date.now()}-${lineIdx}`,
          type: 'text',
          sourceContent: `<p>${line.L1}</p>`,
          targetContent: line.L2 ? `<p>${line.L2}</p>` : '',
          meta: line.meta,
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      title: content.title,
      description: content.description,
      sourceLang: content.sourceLang,
      targetLang: content.targetLang,
      layout: content.layout,
      pages,
      meta: content.meta,
      credits: content.credits,
    });

  } catch (error) {
    console.error('Ingest API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}
