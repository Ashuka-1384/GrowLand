import crypto from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: node scripts/generate-secrets.mjs "your-admin-password"');
  process.exit(1);
}

const jwtSecret = crypto.randomBytes(48).toString('base64url');
const blobDataSecret = crypto.randomBytes(48).toString('base64url');
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
const adminHash = `${salt.toString('base64')}.${hash.toString('base64')}`;

console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`BLOB_DATA_SECRET=${blobDataSecret}`);
console.log(`ADMIN_PASSWORD=${adminHash}`);
console.log('BLOB_DB_PATH=growland/production-v1/db.json.enc');
