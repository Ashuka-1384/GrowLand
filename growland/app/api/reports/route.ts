export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMember } from '@/lib/auth';
import { updateStore } from '@/lib/store';

export async function POST(req: Request) {
  const member = await currentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const text = String(body?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'گزارش خالی است.' }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: 'گزارش بیش از حد طولانی است.' }, { status: 400 });

  await updateStore(store => {
    store.reports.unshift({
      id: crypto.randomUUID(),
      memberId: member.id,
      text,
      createdAt: new Date().toISOString(),
      status: 'new',
    });
  });

  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
