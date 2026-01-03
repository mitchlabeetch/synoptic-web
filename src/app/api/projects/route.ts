// src/app/api/projects/route.ts
// PURPOSE: Project listing and creation endpoint
// ACTION: Lists user projects or creates new ones
// MECHANISM: Uses JWT auth and PostgreSQL queries

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getUserProjects, createProject, countUserProjects } from '@/lib/db/server';

// GET /api/projects - List all projects for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);
    const projects = await getUserProjects(userId);

    return NextResponse.json({ projects });
  } catch (error: unknown) {
    console.error('[Projects GET Error]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);
    const { title, source_lang, target_lang } = await request.json();

    if (!title || !source_lang || !target_lang) {
      return NextResponse.json(
        { error: 'Title, source language, and target language are required' },
        { status: 400 }
      );
    }

    // Check project limits for free tier
    if (user.tier === 'free') {
      const projectCount = await countUserProjects(userId);
      if (projectCount >= 3) {
        return NextResponse.json(
          { error: 'Free tier limited to 3 projects. Please upgrade to create more.' },
          { status: 403 }
        );
      }
    }

    const project = await createProject({
      title,
      source_lang,
      target_lang,
      user_id: userId,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: unknown) {
    console.error('[Projects POST Error]', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
