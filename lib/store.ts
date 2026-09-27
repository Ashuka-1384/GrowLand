import fs from 'fs/promises';
import path from 'path';
import type { Member, Store } from './types';

const file = path.resolve(process.cwd(), process.env.GROWLAND_DATA_FILE || './data/store.json');
const empty: Store = { members: [], reports: [], announcements: [] };
let writeQueue: Promise<void> = Promise.resolve();

function isStore(value: unknown): value is Store {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Store>;
  return Array.isArray(candidate.members)
    && Array.isArray(candidate.reports)
    && Array.isArray(candidate.announcements);
}

export async function getStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return isStore(parsed) ? parsed : { ...empty };
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify(empty, null, 2), 'utf8');
    }
    return { ...empty, members: [], reports: [], announcements: [] };
  }
}

export async function saveStore(store: Store): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), 'utf8');
    await fs.rename(tmp, file);
  });
  return writeQueue;
}

export function publicMember(member: Member): Omit<Member, 'phone'> {
  const { phone: _phone, ...safe } = member;
  return safe;
}
