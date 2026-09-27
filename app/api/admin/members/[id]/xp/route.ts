export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateStore, adminMember } from '@/lib/store';
import { levelFromXp } from '@/lib/utils';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const delta = Number(body?.delta);
    if (!Number.isFinite(delta)) return NextResponse.json({ error: 'XP نامعتبر است.' }, { status: 400 });

    const member = await updateStore(store => {
      const target = store.members.find(x => x.id === params.id);
      if (!target) throw new Error('NOT_FOUND');
      if (body?.skillId) {
        const skill = target.skills.find(x => x.id === body.skillId);
        if (!skill) throw new Error('SKILL_NOT_FOUND');
        skill.xp = Math.max(0, skill.xp + delta);
        target.xp = target.skills.reduce((sum, item) => sum + item.xp, 0);
      } else {
        target.xp = Math.max(0, target.xp + delta);
      }
      target.levelNumber = levelFromXp(target.xp);
      target.growth = [...target.growth.slice(-6), target.xp];
      return target;
    });

    return NextResponse.json({ member: adminMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی ادمین لازم است.' }, { status: 403 });
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (message === 'SKILL_NOT_FOUND') return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
