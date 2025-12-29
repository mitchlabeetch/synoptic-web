import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { updateUserProfile } from '@/lib/db/server';

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = getUserId(user);
    const updates = await request.json();
    
    // Only allow specific fields
    const allowedUpdates: any = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.preferred_locale !== undefined) allowedUpdates.preferred_locale = updates.preferred_locale;

    const updatedUser = await updateUserProfile(userId, allowedUpdates);
    
    return NextResponse.json({ profile: updatedUser });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
