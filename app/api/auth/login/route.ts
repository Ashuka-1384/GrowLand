export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { normalizePhone, setSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body?.phone || '');
    if (!phone || phone === '+98') {
      return NextResponse.json({ error: 'شماره تماس را وارد کنید.' }, { status: 400 });
    }

    const store = await getStore();
    const member = store.members.find(item => item.phone === phone);
    if (!member) {
      return NextResponse.json(
        { error: 'این شماره عضو GrowLand نیست. ابتدا ثبت‌نام کنید.' },
        { status: 404 }
      );
    }

    await setSession(member.id);
    const { phone: _phone, ...safeMember } = member;
    return NextResponse.json({ member: safeMember });
  } catch {
    return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
