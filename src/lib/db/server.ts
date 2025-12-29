// src/lib/db/server.ts
// PURPOSE: Server-side database operations with authentication
// ACTION: Provides authenticated database access for API routes and server components
// MECHANISM: Combines PostgreSQL queries with JWT authentication

import { query, getById, insert, update, deleteById } from './client';
import { getCurrentUser, UserTokenPayload } from '../auth/jwt';

export interface User {
  id: string;
  email: string;
  name?: string;
  tier: string;
  ai_credits_used: number;
  ai_credits_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  source_lang: string;
  target_lang: string;
  content: any;
  settings: any;
  created_at: string;
  updated_at: string;
}

/**
 * Get authenticated user from JWT token
 */
export async function getAuthenticatedUser(): Promise<UserTokenPayload | null> {
  return getCurrentUser();
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  return getById<User>('profiles', userId);
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  return result.rows;
}

/**
 * Get a single project by ID (with ownership check)
 */
export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Create a new project
 */
export async function createProject(project: {
  title: string;
  source_lang: string;
  target_lang: string;
  user_id: string;
  content?: any;
  settings?: any;
}): Promise<Project> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return insert<Project>('projects', {
    id,
    user_id: project.user_id,
    title: project.title,
    source_lang: project.source_lang,
    target_lang: project.target_lang,
    content: JSON.stringify(project.content || defaultContent()),
    settings: JSON.stringify(project.settings || defaultSettings()),
    created_at: now,
    updated_at: now,
  });
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Pick<Project, 'title' | 'content' | 'settings'>>
): Promise<Project | null> {
  // Prepare the update data
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.title) updateData.title = updates.title;
  if (updates.content) updateData.content = JSON.stringify(updates.content);
  if (updates.settings) updateData.settings = JSON.stringify(updates.settings);
  
  const result = await query<Project>(
    `UPDATE projects 
     SET ${Object.keys(updateData).map((k, i) => `${k} = $${i + 3}`).join(', ')}
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [projectId, userId, ...Object.values(updateData)]
  );
  
  return result.rows[0] || null;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Update user AI credits
 */
export async function incrementAICredits(userId: string, amount: number = 1): Promise<void> {
  await query(
    'UPDATE profiles SET ai_credits_used = ai_credits_used + $1 WHERE id = $2',
    [amount, userId]
  );
}

/**
 * Check if user has AI credits remaining
 */
export async function hasAICredits(userId: string): Promise<boolean> {
  const result = await query<{ has_credits: boolean }>(
    'SELECT ai_credits_used < ai_credits_limit AS has_credits FROM profiles WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.has_credits ?? false;
}

/**
 * Count user's projects
 */
export async function countUserProjects(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

// Default content structure for new projects
function defaultContent() {
  return {
    pages: [
      {
        id: 'page-1',
        number: 1,
        blocks: [],
        isBlankPage: false,
        avoidPageBreak: false,
      },
    ],
    wordGroups: [],
    arrows: [],
    notes: [],
    stamps: [],
    presets: [],
  };
}

// Default settings for new projects
function defaultSettings() {
  return {
    theme: 'classic',
    pageSize: '6x9',
    pageWidth: 152,
    pageHeight: 229,
    fonts: {
      heading: 'Crimson Pro',
      body: 'Crimson Pro',
      annotation: 'Inter',
    },
    typography: {
      baseSize: 12,
      headingSize: 24,
      lineHeight: 1.5,
    },
    colors: {
      primary: '#1a1a2e',
      secondary: '#4a4a68',
      accent: '#2563eb',
      background: '#ffffff',
    },
    layout: 'side-by-side',
    direction: 'auto',
  };
}
