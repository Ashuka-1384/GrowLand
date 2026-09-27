export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { currentMember, sessionMember } from '@/lib/auth';
import { updateStore } from '@/lib/store';

export async function GET() {
  const member = await currentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ member: sessionMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: Request) {
  const current = await currentMember();
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const member = await updateStore(store => {
    const target = store.members.find(x => x.id === current.id && x.active !== false);
    if (!target) throw new Error('NOT_FOUND');
    target.readyForWork = Boolean(body?.readyForWork);
    return target;
  });

  return NextResponse.json({ member: sessionMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
}
