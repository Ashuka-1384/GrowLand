export const runtime = 'nodejs';

import {NextResponse} from 'next/server'; import {requireAdmin} from '@/lib/auth'; import {getStore,saveStore,publicMember} from '@/lib/store';
export async function POST(req:Request){try{const me=await requireAdmin();if(me.phone!=='+989333167279')return NextResponse.json({error:'فقط ادمین اصلی می‌تواند ادمین‌ها را مدیریت کند.'},{status:403});const {memberId,isAdmin}=await req.json();const s=await getStore();const m=s.members.find(x=>x.id===memberId);if(!m)return NextResponse.json({error:'Not found'},{status:404});m.isAdmin=!!isAdmin;await saveStore(s);return NextResponse.json({member:publicMember(m)})}catch(e){return NextResponse.json({error:'دسترسی ادمین لازم است.'},{status:403})}}
