export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { normalizePhone, setSession, sessionMember } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body?.phone || '');
    if (!phone || phone === '+98') {
      return NextResponse.json({ error: 'شماره تماس را وارد کنید.' }, { status: 400 });
    }

    const store = await getStore();
    const member = store.members.find(item => item.phone === phone && item.active !== false);
    if (!member) {
      return NextResponse.json(
        { error: 'این شماره عضو GrowLand نیست. ابتدا ثبت‌نام کنید.' },
        { status: 404 }
      );
    }

    await setSession(member.id);
    return NextResponse.json({ member: sessionMember(member) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
