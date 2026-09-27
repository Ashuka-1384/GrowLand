export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MASTER_ADMIN_PHONE, requireAdmin } from '@/lib/auth';
import { updateStore, adminMember } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const me = await requireAdmin();
    if (me.phone !== MASTER_ADMIN_PHONE) {
      return NextResponse.json({ error: 'فقط ادمین اصلی می‌تواند ادمین‌ها را مدیریت کند.' }, { status: 403 });
    }
    const body = await req.json();
    if (typeof body?.memberId !== 'string' || typeof body?.isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
    }
    const member = await updateStore(store => {
      const target = store.members.find(x => x.id === body.memberId);
      if (!target) throw new Error('NOT_FOUND');
      target.isAdmin = body.isAdmin;
      return target;
    });
    return NextResponse.json({ member: adminMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'دسترسی ادمین لازم است.' }, { status: 403 });
  }
}
