export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET() {
  try {
    await requireAdmin();
    const store = await getStore();
    return NextResponse.json({ members: store.members }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 401;
    return NextResponse.json(
      { error: status === 403 ? 'دسترسی ادمین لازم است.' : 'Unauthorized' },
      { status }
    );
  }
}
