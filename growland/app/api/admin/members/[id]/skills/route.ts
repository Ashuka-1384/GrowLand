export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth';
import { updateStore, adminMember } from '@/lib/store';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const name = String(body?.name || '').trim();
    if (!name) return NextResponse.json({ error: 'نام مهارت الزامی است' }, { status: 400 });

    const member = await updateStore(store => {
      const target = store.members.find(x => x.id === params.id);
      if (!target) throw new Error('NOT_FOUND');
      const skillXp = Number(body?.xp);
      target.skills.push({
        id: crypto.randomUUID(),
        name,
        category: String(body?.category || 'عمومی').trim(),
        xp: Number.isFinite(skillXp) ? Math.max(0, skillXp) : 0,
      });
      target.xp = target.skills.reduce((sum, item) => sum + item.xp, 0);
      target.levelNumber = Math.max(1, Math.floor(target.xp / 1000) + 1);
      return target;
    });
    return NextResponse.json({ member: adminMember(member) }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'دسترسی ادمین لازم است.' }, { status: 403 });
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const member = await updateStore(store => {
      const target = store.members.find(x => x.id === params.id);
      if (!target) throw new Error('NOT_FOUND');
      const before = target.skills.length;
      target.skills = target.skills.filter(x => x.id !== body?.skillId);
      if (target.skills.length === before) throw new Error('SKILL_NOT_FOUND');
      target.xp = target.skills.reduce((sum, item) => sum + item.xp, 0);
      target.levelNumber = Math.max(1, Math.floor(target.xp / 1000) + 1);
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
