export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateStore, adminMember } from '@/lib/store';
import { levelFromXp } from '@/lib/utils';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const member = await updateStore(store => {
      const target = store.members.find(m => m.id === params.id);
      if (!target) throw new Error('NOT_FOUND');
      if (typeof body?.xp === 'number' && Number.isFinite(body.xp)) {
        target.xp = Math.max(0, Math.floor(body.xp));
        target.levelNumber = levelFromXp(target.xp);
      }
      if (typeof body?.levelNumber === 'number' && Number.isFinite(body.levelNumber)) {
        target.levelNumber = Math.max(1, Math.floor(body.levelNumber));
      }
      if (typeof body?.readyForWork === 'boolean') target.readyForWork = body.readyForWork;
      if (typeof body?.roadmap === 'string') target.roadmap = body.roadmap.trim();
      if (typeof body?.active === 'boolean') target.active = body.active;
      return target;
    });
    return NextResponse.json({ member: adminMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'دسترسی ادمین لازم است.' }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
