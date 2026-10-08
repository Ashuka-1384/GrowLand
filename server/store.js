import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { put, get, BlobPreconditionFailedError } from '@vercel/blob';

const localFile = path.resolve(process.cwd(), 'data/db.json');
// Versioned on purpose: a clean deployment must not accidentally open an older
// Blob written by a previous incompatible encryption/storage format.
const blobPath = process.env.BLOB_DB_PATH || 'growland/v7/db.json.enc';
let writeChain = Promise.resolve();
const MAX_CAS_RETRIES = 6;

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
    revision: Number.isInteger(db?.revision) ? db.revision : 0,
    members: Array.isArray(db?.members) ? db.members : [],
    reports: Array.isArray(db?.reports) ? db.reports : [],
    announcements: Array.isArray(db?.announcements) ? db.announcements : [],
    activities: Array.isArray(db?.activities) ? db.activities : [],
    submissions: Array.isArray(db?.submissions) ? db.submissions : [],
    assessments: Array.isArray(db?.assessments) ? db.assessments : [],
    jobs: Array.isArray(db?.jobs) ? db.jobs : [],
    auditLog: Array.isArray(db?.auditLog) ? db.auditLog : [],
    notifications: Array.isArray(db?.notifications) ? db.notifications : [],
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
    // First boot of a new namespace: create it once from the checked-in seed.
    // allowOverwrite=false makes concurrent first boots safe: the loser re-reads.
    const seed = await readLocalSeed();
    try {
      const etag = await writeBlobDatabase(seed, { create: true });
      return { db: seed, etag };
    } catch (error) {
      if (error?.code === 'BLOB_EXISTS') return readBlobDatabase();
      throw error;
    }
  }
  if (!item.stream) throw new Error('GrowLand Blob stream is unavailable.');
  let raw;
  try {
    raw = await new Response(item.stream).text();
  } catch (error) {
    throw new Error(`GrowLand Blob payload read failed: ${error.message}`);
  }
  try {
    return { db: normalizeDB(JSON.parse(decrypt(raw))), etag: item.blob?.etag || null };
  } catch (error) {
    throw new Error(`GrowLand Blob database is unreadable: ${error.message}`);
  }
}

async function writeBlobDatabase(db, { etag = null, create = false } = {}) {
  const body = JSON.stringify(normalizeDB(db));
  try {
    const result = await put(blobPath, encrypt(body), {
      access: 'private',
      allowOverwrite: !create,
      contentType: 'application/octet-stream',
      addRandomSuffix: false,
      ...(etag ? { ifMatch: etag } : {})
    });
    return result?.etag || null;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      const conflict = new Error('GrowLand Blob write conflict.');
      conflict.code = 'CONFLICT';
      throw conflict;
    }
    if (create && /already exists|allowOverwrite/i.test(String(error?.message))) {
      const exists = new Error('exists');
      exists.code = 'BLOB_EXISTS';
      throw exists;
    }
    throw new Error(`GrowLand Blob write failed: ${error.message}`);
  }
}

async function writeLocal(db) {
  const body = JSON.stringify(db, null, 2);
  const temp = `${localFile}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, body, 'utf8');
  await fs.rename(temp, localFile);
}

// Reads are ALWAYS fresh. The previous 750ms in-memory cache made one serverless
// instance serve (and then overwrite with) stale data written by another instance:
// that is how deletions "came back" and registrations disappeared.
let inflightRead = null;
export async function readDB() {
  if (inflightRead) return structuredClone(await inflightRead);
  inflightRead = (async () => {
    if (hasBlob()) return (await readBlobDatabase()).db;
    return readLocalSeed();
  })().finally(() => { inflightRead = null; });
  return structuredClone(await inflightRead);
}

/**
 * Atomic read-modify-write.
 * - serialized inside an instance (writeChain)
 * - across instances: compare-and-swap on the Blob ETag with automatic retry
 * `fn(db)` may mutate db and return any value; throwing aborts without writing.
 */
export function mutateDB(fn) {
  const operation = async () => {
    for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt += 1) {
      const loaded = hasBlob() ? await readBlobDatabase() : { db: await readLocalSeed(), etag: null };
      const db = loaded.db;
      const result = await fn(db);
      if (result && result.__abort) return result.value;
      db.revision = Number(db.revision || 0) + 1;
      try {
        if (hasBlob()) await writeBlobDatabase(db, { etag: loaded.etag });
        else await writeLocal(db);
        return result;
      } catch (error) {
        if (error?.code === 'CONFLICT' && attempt < MAX_CAS_RETRIES - 1) {
          await new Promise(r => setTimeout(r, 30 + Math.random() * 120));
          continue;
        }
        throw error;
      }
    }
    throw new Error('GrowLand Blob write failed: too many concurrent updates.');
  };
  const result = writeChain.then(operation, operation);
  writeChain = result.catch(() => {});
  return result;
}
