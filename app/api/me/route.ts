export const runtime = 'nodejs';

import {NextResponse} from 'next/server'; import {currentMember} from '@/lib/auth'; import {getStore,saveStore} from '@/lib/store'; export async function GET(){const m=await currentMember();if(!m)return NextResponse.json({error:'Unauthorized'},{status:401});return NextResponse.json({member:{...m,phone:undefined}})}
export async function PATCH(req:Request){const m=await currentMember();if(!m)return NextResponse.json({error:'Unauthorized'},{status:401});const b=await req.json();const s=await getStore();const i=s.members.findIndex(x=>x.id===m.id);if(i<0)return NextResponse.json({error:'Not found'},{status:404});s.members[i].readyForWork=!!b.readyForWork;await saveStore(s);return NextResponse.json({member:{...s.members[i],phone:undefined}})}
