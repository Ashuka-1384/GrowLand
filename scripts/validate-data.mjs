import fs from 'node:fs';

const file = new URL('../src/data/users.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!Number.isInteger(data.version) || data.version < 1) {
  throw new Error('users.json must contain a positive integer "version".');
}
if (!Array.isArray(data.users)) throw new Error('users.json.users must be an array.');

const XP_PER_LEVEL = 1000;
const MAX_LEVEL = 50;
const MAX_XP = MAX_LEVEL * XP_PER_LEVEL;

const ids = new Set();

for (const [index, user] of data.users.entries()) {
  if (ids.has(user.id)) throw new Error(`Duplicate user id at index ${index}.`);
  ids.add(user.id);

  if (!user.name?.trim()) throw new Error(`User ${index} is missing name.`);
  if (!Number.isFinite(Number(user.xp))) throw new Error(`User ${user.id} has invalid XP.`);
  if (Number(user.xp) < 0 || Number(user.xp) > MAX_XP) {
    throw new Error(`User ${user.id} XP must be between 0 and ${MAX_XP}.`);
  }

  const derivedLevel = Math.min(Math.floor(Number(user.xp) / XP_PER_LEVEL) + 1, MAX_LEVEL);
  if (Number(user.level) !== derivedLevel) {
    throw new Error(
      `User ${user.id} has level ${user.level}, but ${user.xp} XP derives Level ${derivedLevel}.`
    );
  }

  if (!Array.isArray(user.skills)) throw new Error(`User ${user.id} skills must be an array.`);
  for (const skill of user.skills) {
    if (!skill?.name?.trim()) throw new Error(`User ${user.id} contains a skill without a name.`);
    if (Number(skill.level) < 0 || Number(skill.level) > 5) {
      throw new Error(`User ${user.id} skill "${skill.name}" must have a level from 0 to 5.`);
    }
  }
}

console.log(`GrowLand data OK: ${data.users.length} users, version ${data.version}.`);
