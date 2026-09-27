export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

import {NextResponse} from 'next/server'; import {getStore,publicMember} from '@/lib/store'; export async function GET(_:Request,{params}:{params:{id:string}}){const s=await getStore();const m=s.members.find(x=>x.id===params.id&&x.active!==false&&!x.hiddenFromPublic);if(!m)return NextResponse.json({error:'Not found'},{status:404});return NextResponse.json({member:publicMember(m)})}
