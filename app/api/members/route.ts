export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getStore, isPublicMember, publicMember } from '@/lib/store';

export async function GET() {
  const store = await getStore();
  const members = store.members
    .filter(isPublicMember)
    .sort((a, b) => b.levelNumber - a.levelNumber || b.xp - a.xp)
    .map(publicMember);

  return NextResponse.json({ members });
}
