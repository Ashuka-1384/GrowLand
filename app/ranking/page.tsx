export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

import {getStore,isPublicMember} from '@/lib/store'; import Link from 'next/link'; import {initials} from '@/lib/utils';
export default async function Ranking(){const s=await getStore();const ms=s.members.filter(isPublicMember).sort((a,b)=>b.levelNumber-a.levelNumber||b.xp-a.xp);return <main className="section"><div className="container"><div className="sectionHead"><div><h1>🏆 Ranking</h1><p>رتبه‌بندی بر اساس Level و XP ثبت‌شده.</p></div></div><div className="ranking glass">{ms.map((m,i)=><Link className="rankRow" href={'/members/'+m.id} key={m.id}><div className="rankNo">#{i+1}</div><div className="memberTop"><div className="avatar" style={{width:42,height:42,fontSize:15}}>{initials(m.fullName)}</div><div><b>{m.fullName}</b><div className="muted small">{m.focus}</div></div></div><div>Lv {m.levelNumber}</div><div className="rankXp">{m.xp} XP</div></Link>)}{!ms.length&&<div className="empty">هنوز رتبه‌بندی شکل نگرفته است.</div>}</div></div></main>}
