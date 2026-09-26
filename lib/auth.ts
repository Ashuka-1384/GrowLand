import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getStore } from './store';

const SECRET = process.env.SESSION_SECRET || 'growland-dev-secret-change-me';
const COOKIE = 'growland_session';

export function normalizePhone(input: string) {
  let p = (input || '').replace(/[^\d+]/g, '');
  if (p.startsWith('0098')) p = '+' + p.slice(2);
  if (p.startsWith('98')) p = '+' + p;
  if (p.startsWith('0')) p = '+98' + p.slice(1);
  if (!p.startsWith('+')) p = '+98' + p;
  return p;
}
function sign(value: string) { return crypto.createHmac('sha256', SECRET).update(value).digest('hex'); }
function token(memberId: string) { const raw = `${memberId}.${Date.now() + 1000*60*60*24*30}`; return `${raw}.${sign(raw)}`; }
export function verifyToken(t?: string) { if (!t) return null; const parts=t.split('.'); if(parts.length<3) return null; const raw=parts.slice(0,2).join('.'); const sig=parts[2]; if(!crypto.timingSafeEqual(Buffer.from(sign(raw)),Buffer.from(sig))) return null; if(Number(parts[1])<Date.now()) return null; return parts[0]; }
export async function setSession(memberId:string){ cookies().set(COOKIE, token(memberId), {httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30}); }
export async function clearSession(){ cookies().delete(COOKIE); }
export async function currentMember(){ const t=cookies().get(COOKIE)?.value; const id=verifyToken(t); if(!id) return null; const s=await getStore(); return s.members.find(m=>m.id===id && m.active!==false) || null; }
export async function requireMember(){ const m=await currentMember(); if(!m) throw new Error('UNAUTHORIZED'); return m; }
export async function requireAdmin(){ const m=await requireMember(); if(!m.isAdmin) throw new Error('FORBIDDEN'); return m; }
