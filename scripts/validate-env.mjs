import crypto from 'node:crypto';

const production = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const required = ['JWT_SECRET', 'ADMIN_PHONE', 'ADMIN_PASSWORD', 'BLOB_READ_WRITE_TOKEN', 'BLOB_DATA_SECRET'];
const missing = required.filter(key => !String(process.env[key] || '').trim());
if (production && missing.length) {
  console.error(`Missing production environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const jwt = String(process.env.JWT_SECRET || '');
const blob = String(process.env.BLOB_DATA_SECRET || '');
if (production && jwt.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (production && blob.length < 32) {
  console.error('BLOB_DATA_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (production && jwt === blob) {
  console.error('JWT_SECRET and BLOB_DATA_SECRET must be different values.');
  process.exit(1);
}

const admin = String(process.env.ADMIN_PASSWORD || '');
const parts = admin.split('.');
if (production) {
  if (parts.length !== 2) {
    console.error('ADMIN_PASSWORD must be a scrypt hash.');
    process.exit(1);
  }
  try {
    const salt = Buffer.from(parts[0], 'base64');
    const hash = Buffer.from(parts[1], 'base64');
    if (salt.length < 16 || hash.length !== 64) throw new Error('invalid hash shape');
    // Ensure the Node crypto implementation is available in the target runtime.
    crypto.scryptSync('validation', salt, hash.length, { N: 16384, r: 8, p: 1 });
  } catch {
    console.error('ADMIN_PASSWORD is not a valid GrowLand scrypt hash.');
    process.exit(1);
  }
}

console.log('GrowLand environment validation: OK');
