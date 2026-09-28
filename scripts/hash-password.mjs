import crypto from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: node scripts/hash-password.mjs "at-least-8-character-password"');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
console.log(`${salt.toString('base64')}.${hash.toString('base64')}`);
