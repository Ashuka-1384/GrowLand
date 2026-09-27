import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { put, list, get } from '@vercel/blob';

const localFile = path.resolve(process.cwd(), 'data/db.json');
const blobPath = 'growland/db.json';
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const secret = () => process.env.BLOB_DATA_SECRET || process.env.JWT_SECRET || 'dev-storage-secret-change-me';
function key(){ return crypto.createHash('sha256').update(secret()).digest(); }
function encrypt(text){ const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv); const data=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]); const tag=cipher.getAuthTag(); return JSON.stringify({v:1,iv:iv.toString('base64'),tag:tag.toString('base64'),data:data.toString('base64')}); }
function decrypt(payload){ const x=JSON.parse(payload); const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(x.iv,'base64')); decipher.setAuthTag(Buffer.from(x.tag,'base64')); return Buffer.concat([decipher.update(Buffer.from(x.data,'base64')),decipher.final()]).toString('utf8'); }

export async function readDB(){
  if(hasBlob()){
    const result = await list({prefix: blobPath, limit: 10});
    const item = result.blobs.find(x=>x.pathname===blobPath) || result.blobs[0];
    if(item){
      try {
        const blob = await get(item.pathname, { access: 'private' });
        if (blob?.stream) {
          const raw = await new Response(blob.stream).text();
          return JSON.parse(decrypt(raw));
        }
      } catch (err) {
        console.error('BLOB_READ_ERROR', err);
      }
    }
  }
  return JSON.parse(await fs.readFile(localFile,'utf8'));
}

export async function writeDB(db){
  const body = JSON.stringify(db,null,2);
  if(hasBlob()){
    if(!process.env.BLOB_DATA_SECRET && !process.env.JWT_SECRET) throw new Error('BLOB_DATA_SECRET or JWT_SECRET is required for Blob storage');
    await put(blobPath, encrypt(body), {access:'private', allowOverwrite:true, contentType:'application/json'});
  } else {
    await fs.writeFile(localFile,body,'utf8');
  }
}
