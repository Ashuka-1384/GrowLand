export const runtime = 'nodejs';

import {NextResponse} from 'next/server'; import {currentMember} from '@/lib/auth'; export async function GET(){const m=await currentMember();if(!m)return NextResponse.json({member:null},{status:401});return NextResponse.json({member:{...m,phone:undefined}})}
