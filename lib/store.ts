import fs from 'fs/promises';
import path from 'path';
import { Store } from './types';

const file = path.resolve(process.cwd(), process.env.GROWLAND_DATA_FILE || './data/store.json');
const empty: Store = { members: [], reports: [], announcements: [] };
let writeQueue = Promise.resolve();

export async function getStore(): Promise<Store> {
  try { return JSON.parse(await fs.readFile(file,'utf8')); } catch { await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file,JSON.stringify(empty,null,2)); return empty; }
}
export async function saveStore(store: Store) {
  writeQueue = writeQueue.then(async()=>{ await fs.mkdir(path.dirname(file),{recursive:true}); const tmp=file+'.tmp'; await fs.writeFile(tmp,JSON.stringify(store,null,2)); await fs.rename(tmp,file); });
  return writeQueue;
}
export function publicMember(m:any){ const {phone,...safe}=m; return safe; }
