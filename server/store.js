import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { put, list, get } from '@vercel/blob';

const localFile = path.resolve(process.cwd(), 'data/db.json');
const blobPath = 'growland/db.json';
const CACHE_TTL = 1500;
let memoryCache = null;
let memoryCacheAt = 0;
let writeChain = Promise.resolve();

const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const secret = () => process.env.BLOB_DATA_SECRET || process.env.JWT_SECRET || 'dev-storage-secret-change-me';
function key(){ return crypto.createHash('sha256').update(secret()).digest(); }
function encrypt(text){ const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv); const data=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]); const tag=cipher.getAuthTag(); return JSON.stringify({v:1,iv:iv.toString('base64'),tag:tag.toString('base64'),data:data.toString('base64')}); }
function decrypt(payload){ const x=JSON.parse(payload); const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(x.iv,'base64')); decipher.setAuthTag(Buffer.from(x.tag,'base64')); return Buffer.concat([decipher.update(Buffer.from(x.data,'base64')),decipher.final()]).toString('utf8'); }
function normalizeDB(db){ return {members:Array.isArray(db?.members)?db.members:[],reports:Array.isArray(db?.reports)?db.reports:[],announcements:Array.isArray(db?.announcements)?db.announcements:[],site:db?.site&&typeof db.site==='object'?db.site:{}}; }

export async function readDB({fresh=false}={}){
  if(!fresh && memoryCache && Date.now()-memoryCacheAt<CACHE_TTL) return structuredClone(memoryCache);
  let db;
  if(hasBlob()){
    const result = await list({prefix: blobPath, limit: 10});
    const item = result.blobs.find(x=>x.pathname===blobPath) || result.blobs[0];
    if(item){
      try {
        const blob = await get(item.pathname, { access: 'private' });
        if(blob?.stream){
          const raw = await new Response(blob.stream).text();
          db=normalizeDB(JSON.parse(decrypt(raw)));
        }
      } catch(err) {
        console.error('BLOB_READ_ERROR', err);
      }
    }
  }
  if(!db){
    db=normalizeDB(JSON.parse(await fs.readFile(localFile,'utf8')));
  }
  memoryCache=structuredClone(db);
  memoryCacheAt=Date.now();
  return structuredClone(db);
}

export function writeDB(db){
  const operation=async()=>{
    const normalized=normalizeDB(db);
    const body=JSON.stringify(normalized,null,2);
    if(hasBlob()){
      if(!process.env.BLOB_DATA_SECRET && !process.env.JWT_SECRET) throw new Error('BLOB_DATA_SECRET or JWT_SECRET is required for Blob storage');
      await put(blobPath, encrypt(body), {access:'private',allowOverwrite:true,contentType:'application/json'});
    } else {
      const temp=`${localFile}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(temp,body,'utf8');
      await fs.rename(temp,localFile);
    }
    memoryCache=structuredClone(normalized);
    memoryCacheAt=Date.now();
    return structuredClone(normalized);
  };
  const result=writeChain.then(operation,operation);
  writeChain=result.catch(()=>{});
  return result;
}
