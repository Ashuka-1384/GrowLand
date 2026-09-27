export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { currentMember, sessionMember } from '@/lib/auth';

export async function GET() {
  const member = await currentMember();
  if (!member) return NextResponse.json({ member: null }, { status: 401 });
  return NextResponse.json({ member: sessionMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
}
