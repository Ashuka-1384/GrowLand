import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { put, get } from '@vercel/blob';

const localFile = path.resolve(process.cwd(), 'data/db.json');
// Versioned on purpose: a clean deployment must not accidentally open an older
// Blob written by a previous incompatible encryption/storage format.
const blobPath = process.env.BLOB_DB_PATH || 'growland/v7/db.json.enc';
const CACHE_TTL = 750;
let memoryCache = null;
let memoryCacheAt = 0;
let writeChain = Promise.resolve();

const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function storageSecret() {
  const value = String(process.env.BLOB_DATA_SECRET || '');
  if (hasBlob() && value.length < 32) {
    throw new Error('BLOB_DATA_SECRET must be configured with at least 32 characters when Blob storage is enabled.');
  }
  return value || crypto.randomBytes(32).toString('hex');
}

function encryptionKey() {
  // Dedicated storage key. Never reuse JWT_SECRET for data encryption.
  return crypto.createHash('sha256').update(storageSecret()).digest();
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return JSON.stringify({
    format: 'growland-blob-v1',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64')
  });
}

function decrypt(payload) {
  let x;
  try {
    x = JSON.parse(payload);
  } catch {
    throw new Error('Blob payload is not valid JSON.');
  }
  if (x?.format !== 'growland-blob-v1' || !x.iv || !x.tag || !x.data) {
    throw new Error('Unsupported GrowLand Blob format.');
  }
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(x.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(x.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(x.data, 'base64')),
      decipher.final()
    ]).toString('utf8');
  } catch {
    throw new Error('GrowLand Blob authentication failed. Check BLOB_DATA_SECRET and BLOB_DB_PATH.');
  }
}

export function normalizeDB(db) {
  return {
    members: Array.isArray(db?.members) ? db.members : [],
    reports: Array.isArray(db?.reports) ? db.reports : [],
    announcements: Array.isArray(db?.announcements) ? db.announcements : [],
    activities: Array.isArray(db?.activities) ? db.activities : [],
    submissions: Array.isArray(db?.submissions) ? db.submissions : [],
    assessments: Array.isArray(db?.assessments) ? db.assessments : [],
    jobs: Array.isArray(db?.jobs) ? db.jobs : [],
    auditLog: Array.isArray(db?.auditLog) ? db.auditLog : [],
    site: db?.site && typeof db.site === 'object' ? db.site : {}
  };
}

async function readLocalSeed() {
  try {
    return normalizeDB(JSON.parse(await fs.readFile(localFile, 'utf8')));
  } catch (error) {
    throw new Error(`Local seed database is unavailable: ${error.message}`);
  }
}

async function readBlobDatabase() {
  let item;
  try {
    item = await get(blobPath, { access: 'private', useCache: false });
  } catch (error) {
    throw new Error(`GrowLand Blob read failed: ${error.message}`);
  }
  if (!item || item.statusCode !== 200) {
    // First boot of a new Blob namespace: bootstrap once from the checked-in
    // seed. This prevents a brand-new Vercel deployment from returning 500.
    const seed = await readLocalSeed();
    await writeBlobDatabase(seed);
    return seed;
  }

  if (!item.stream) throw new Error('GrowLand Blob stream is unavailable.');

  let raw;
  try {
    raw = await new Response(item.stream).text();
  } catch (error) {
    throw new Error(`GrowLand Blob payload read failed: ${error.message}`);
  }

  try {
    return normalizeDB(JSON.parse(decrypt(raw)));
  } catch (error) {
    throw new Error(`GrowLand Blob database is unreadable: ${error.message}`);
  }
}

async function writeBlobDatabase(db) {
  const body = JSON.stringify(normalizeDB(db), null, 2);
  try {
    await put(blobPath, encrypt(body), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/octet-stream',
      addRandomSuffix: false
    });
  } catch (error) {
    throw new Error(`GrowLand Blob write failed: ${error.message}`);
  }
}

export async function readDB({ fresh = false } = {}) {
  if (!fresh && memoryCache && Date.now() - memoryCacheAt < CACHE_TTL) {
    return structuredClone(memoryCache);
  }

  const db = hasBlob() ? await readBlobDatabase() : await readLocalSeed();
  memoryCache = structuredClone(db);
  memoryCacheAt = Date.now();
  return structuredClone(db);
}

export function writeDB(db) {
  const operation = async () => {
    const normalized = normalizeDB(db);
    if (hasBlob()) {
      await writeBlobDatabase(normalized);
    } else {
      const body = JSON.stringify(normalized, null, 2);
      const temp = `${localFile}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(temp, body, 'utf8');
      await fs.rename(temp, localFile);
    }
    memoryCache = structuredClone(normalized);
    memoryCacheAt = Date.now();
    return structuredClone(normalized);
  };

  const result = writeChain.then(operation, operation);
  writeChain = result.catch(() => {});
  return result;
}
