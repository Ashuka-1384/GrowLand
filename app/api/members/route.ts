export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

import {NextResponse} from 'next/server'; import {getStore,isPublicMember,publicMember} from '@/lib/store'; export async function GET(){const s=await getStore();return NextResponse.json({members:s.members.filter(isPublicMember).sort((a,b)=>b.levelNumber-a.levelNumber||b.xp-a.xp).map(publicMember)})}
