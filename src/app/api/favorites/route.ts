// src/app/api/favorites/route.ts
// PURPOSE: CRUD operations for user's favorite library templates
// ACTION: GET lists favorites, POST adds a favorite
// MECHANISM: PostgreSQL user_favorites table

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { query } from '@/lib/db/client';

// GET - List user's favorites
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);

    const result = await query(
      `SELECT tile_id, saved_at FROM user_favorites 
       WHERE user_id = $1 
       ORDER BY saved_at DESC`,
      [userId]
    );

    return NextResponse.json({
      favorites: result.rows.map(row => ({
        tileId: row.tile_id,
        savedAt: row.saved_at,
      })),
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST - Add a favorite
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);
    const { tileId } = await req.json();

    if (!tileId || typeof tileId !== 'string') {
      return NextResponse.json({ error: 'Invalid tileId' }, { status: 400 });
    }

    // Upsert - add if not exists
    await query(
      `INSERT INTO user_favorites (user_id, tile_id, saved_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, tile_id) DO NOTHING`,
      [userId, tileId]
    );

    return NextResponse.json({ success: true, tileId });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE - Remove a favorite
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(user);
    const { searchParams } = new URL(req.url);
    const tileId = searchParams.get('tileId');

    if (!tileId) {
      return NextResponse.json({ error: 'Missing tileId' }, { status: 400 });
    }

    await query(
      `DELETE FROM user_favorites WHERE user_id = $1 AND tile_id = $2`,
      [userId, tileId]
    );

    return NextResponse.json({ success: true, tileId });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
