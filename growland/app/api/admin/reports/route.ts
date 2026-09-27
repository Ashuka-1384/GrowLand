export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getStore, updateStore } from '@/lib/store';

export async function GET() {
  try {
    await requireAdmin();
    const store = await getStore();
    return NextResponse.json({
      reports: store.reports.map(report => ({
        ...report,
        member: store.members.find(member => member.id === report.memberId)?.fullName || 'حذف‌شده',
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'دسترسی ادمین لازم است.' }, { status: 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (body?.status !== 'new' && body?.status !== 'reviewed') {
      return NextResponse.json({ error: 'وضعیت گزارش نامعتبر است.' }, { status: 400 });
    }
    await updateStore(store => {
      const report = store.reports.find(item => item.id === body.id);
      if (!report) throw new Error('NOT_FOUND');
      report.status = body.status;
    });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'دسترسی ادمین لازم است.' }, { status: 403 });
  }
}
