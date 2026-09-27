export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateStore } from '@/lib/store';
import { MASTER_ADMIN_PHONE, normalizePhone, setSession, sessionMember } from '@/lib/auth';
import { levelFromXp } from '@/lib/utils';
import type { Member } from '@/lib/types';

const requiredFields = ['fullName', 'age', 'phone', 'city', 'focus', 'level', 'goal', 'time', 'threeMonthGoal', 'whyGrowland', 'about'] as const;

export async function POST(req: Request) {
  try {
    const b = await req.json();
    for (const key of requiredFields) {
      if (typeof b?.[key] !== 'string' && key !== 'age') {
        return NextResponse.json({ error: `فیلد ${key} الزامی است.` }, { status: 400 });
      }
      if (key !== 'age' && !String(b[key] ?? '').trim()) {
        return NextResponse.json({ error: `فیلد ${key} الزامی است.` }, { status: 400 });
      }
    }

    const age = Number(b.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return NextResponse.json({ error: 'سن نامعتبر است.' }, { status: 400 });
    }

    const phone = normalizePhone(b.phone);
    if (!/^\+98(?:9\d{9})$/.test(phone)) {
      return NextResponse.json({ error: 'شماره موبایل ایران نامعتبر است.' }, { status: 400 });
    }

    const member = await updateStore<Member>(store => {
      if (store.members.some(existing => existing.phone === phone)) {
        throw new Error('DUPLICATE_PHONE');
      }

      const id = crypto.randomUUID();
      const created: Member = {
        id,
        fullName: String(b.fullName).trim(),
        age,
        phone,
        city: String(b.city).trim(),
        focus: String(b.focus).trim(),
        level: String(b.level).trim(),
        goal: String(b.goal).trim(),
        time: String(b.time).trim(),
        threeMonthGoal: String(b.threeMonthGoal).trim(),
        whyGrowland: String(b.whyGrowland).trim(),
        about: String(b.about).trim(),
        skills: [{ id: crypto.randomUUID(), name: String(b.focus).trim(), category: String(b.focus).trim(), xp: 0 }],
        xp: 0,
        levelNumber: levelFromXp(0),
        readyForWork: false,
        roadmap: 'ابتدا پروفایل و مهارت اصلی را تکمیل کن. سپس فعالیت‌های هفته اول را انجام بده و اولین گزارش رشدت را برای ادمین ارسال کن.',
        growth: [0, 0, 0, 0, 0, 0, 0],
        isAdmin: phone === MASTER_ADMIN_PHONE,
        active: true,
        hiddenFromPublic: false,
        createdAt: new Date().toISOString(),
      };
      store.members.push(created);
      return created;
    }).catch(error => {
      if (error instanceof Error && error.message === 'DUPLICATE_PHONE') throw error;
      throw error;
    });

    await setSession(member.id);
    return NextResponse.json({ member: sessionMember(member) }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_PHONE') {
      return NextResponse.json({ error: 'این شماره قبلاً ثبت‌نام کرده است.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
