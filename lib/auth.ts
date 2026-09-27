import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getStore } from './store';
import type { Member, SessionMember } from './types';

export const MASTER_ADMIN_PHONE = process.env.MASTER_ADMIN_PHONE?.trim() || '+989333167279';
const COOKIE = 'growland_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be configured in production.');
  }
  return 'growland-dev-secret-change-me';
}

export function normalizePhone(input: string) {
  let p = String(input || '').replace(/[^\d+]/g, '');
  if (p.startsWith('0098')) p = '+' + p.slice(2);
  if (p.startsWith('98')) p = '+' + p;
  if (p.startsWith('0')) p = '+98' + p.slice(1);
  if (!p.startsWith('+')) p = '+98' + p;
  return p;
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function token(memberId: string) {
  const raw = `${memberId}.${Date.now() + SESSION_TTL_MS}`;
  return `${raw}.${sign(raw)}`;
}

export function verifyToken(value?: string) {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;

  const [memberId, expiresAt, signature] = parts;
  if (!memberId || !/^[A-Za-z0-9_-]+$/.test(memberId) || !/^\d+$/.test(expiresAt) || !signature) return null;
  if (Number(expiresAt) < Date.now()) return null;

  const expected = sign(`${memberId}.${expiresAt}`);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  return memberId;
}

export function sessionMember(member: Member): SessionMember {
  const { phone: _phone, ...safe } = member;
  return { ...safe, isMasterAdmin: member.phone === MASTER_ADMIN_PHONE };
}

export async function setSession(memberId: string) {
  cookies().set(COOKIE, token(memberId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession() {
  cookies().delete(COOKIE);
}

export async function currentMember() {
  const session = cookies().get(COOKIE)?.value;
  const id = verifyToken(session);
  if (!id) return null;

  const store = await getStore();
  return store.members.find(member => member.id === id && member.active !== false) || null;
}

export async function requireMember() {
  const member = await currentMember();
  if (!member) throw new Error('UNAUTHORIZED');
  return member;
}

export async function requireAdmin() {
  const member = await requireMember();
  if (!member.isAdmin) throw new Error('FORBIDDEN');
  return member;
}
