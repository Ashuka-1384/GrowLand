import fs from 'fs/promises';
import path from 'path';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import type { Member, PublicMember, Store } from './types';

const file = path.resolve(process.cwd(), process.env.GROWLAND_DATA_FILE || './data/store.json');
const blobPath = process.env.GROWLAND_BLOB_PATH?.trim() || 'growland/store.json';
const empty: Store = { members: [], reports: [], announcements: [] };
let writeQueue: Promise<void> = Promise.resolve();
const MAX_BLOB_RETRIES = 12;

function isBlobMode() {
  return process.env.VERCEL === '1';
}

function requireBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN must be configured on Vercel.');
  return token;
}

function isStore(value: unknown): value is Store {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Store>;
  return Array.isArray(candidate.members)
    && Array.isArray(candidate.reports)
    && Array.isArray(candidate.announcements);
}

async function readLocalStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return isStore(parsed) ? parsed : { ...empty };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(empty, null, 2), 'utf8');
    return { members: [], reports: [], announcements: [] };
  }
}

async function readBlobStore() {
  const token = requireBlobToken();
  const result = await get(blobPath, { access: 'private', token, useCache: false });
  if (!result) {
    const seed = await readLocalStore();
    try {
      const created = await put(blobPath, JSON.stringify(seed, null, 2), {
        access: 'private',
        token,
        allowOverwrite: false,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      });
      return { store: seed, etag: created.etag };
    } catch {
      // Another Vercel Function may have created the seed concurrently.
      const retry = await get(blobPath, { access: 'private', token, useCache: false });
      if (!retry || retry.statusCode !== 200 || !retry.stream) throw new Error('GrowLand storage could not be initialized.');
      const raw = await new Response(retry.stream).text();
      const parsed: unknown = JSON.parse(raw);
      if (!isStore(parsed)) throw new Error('GrowLand storage contains an invalid data shape.');
      return { store: parsed, etag: retry.blob.etag };
    }
  }
  if (result.statusCode !== 200 || !result.stream) {
    throw new Error('GrowLand storage returned an unexpected response.');
  }
  const raw = await new Response(result.stream).text();
  const parsed: unknown = JSON.parse(raw);
  if (!isStore(parsed)) throw new Error('GrowLand storage contains an invalid data shape.');
  return { store: parsed, etag: result.blob.etag };
}

export async function getStore(): Promise<Store> {
  return isBlobMode() ? (await readBlobStore()).store : readLocalStore();
}

export function isPublicMember(member: { active?: boolean; hiddenFromPublic?: boolean }): boolean {
  return member.active !== false && member.hiddenFromPublic !== true;
}

export function publicMember(member: Member): PublicMember {
  const {
    id, fullName, age, city, focus, level, goal, time, skills, xp, levelNumber,
    readyForWork, roadmap, growth, createdAt,
  } = member;
  return { id, fullName, age, city, focus, level, goal, time, skills, xp, levelNumber, readyForWork, roadmap, growth, createdAt };
}

export function adminMember(member: Member): Member {
  return member;
}

export async function updateStore<T>(mutator: (store: Store) => T | Promise<T>): Promise<T> {
  if (!isBlobMode()) {
    let result!: T;
    await (writeQueue = writeQueue.catch(() => undefined).then(async () => {
      const store = await readLocalStore();
      result = await mutator(store);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(store, null, 2), 'utf8');
      await fs.rename(tmp, file);
    }));
    return result;
  }

  const token = requireBlobToken();
  for (let attempt = 0; attempt < MAX_BLOB_RETRIES; attempt += 1) {
    const current = await readBlobStore();
    const result = await mutator(current.store);
    try {
      await put(blobPath, JSON.stringify(current.store, null, 2), {
        access: 'private',
        token,
        allowOverwrite: Boolean(current.etag),
        contentType: 'application/json',
        cacheControlMaxAge: 60,
        ...(current.etag ? { ifMatch: current.etag } : {}),
      });
      return result;
    } catch (error) {
      if (attempt < MAX_BLOB_RETRIES - 1) {
        if (error instanceof BlobPreconditionFailedError) continue;
        if (!current.etag) {
          const latest = await readBlobStore();
          if (latest.etag) continue;
        }
      }
      throw error;
    }
  }

  throw new Error('Could not update GrowLand storage safely.');
}
