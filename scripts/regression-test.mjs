import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const server = fs.readFileSync(path.join(root, 'server/index.js'), 'utf8');
const store = fs.readFileSync(path.join(root, 'server/store.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');

const checks = [
  ['live admin authorization reads member.role', server.includes("member?.role === 'admin'"), 'Admin middleware still trusts the stale JWT role.'],
  ['notifications are persisted in storage', store.includes('notifications: Array.isArray(db?.notifications)'), 'Notification collection is missing from DB normalization.'],
  ['promotion creates a member notification', server.includes("addNotification(db, m.id, 'دسترسی ادمین برایت فعال شد'"), 'Admin promotion does not notify the promoted member.'],
  ['member dashboard exposes notifications', server.includes('notifications = db.notifications.filter(n => n.memberId === m.id)'), 'Member dashboard does not expose notifications.'],
  ['delete removes the active member record', server.includes('db.members.splice(index, 1)'), 'Member deletion is still only a soft-delete.'],
  ['admin overview hides deleted records', server.includes('db.members.filter(m => !m.deletedAt)'), 'Admin overview may show deleted members.'],
  ['registration fields are editable in profile', app.includes('profile.future') && app.includes('profile.why') && app.includes('profile.hours'), 'Registration/profile data model is still incomplete in the dashboard.'],
  ['notification UI exists', app.includes('function NotificationsPanel'), 'Notification UI is missing.'],
  ['frontend refresh can see promoted role', app.includes("api('/auth/me')"), 'Auth refresh path is missing.']
];

let failed = false;
for (const [name, ok, message] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`);
  if (!ok) { console.error(`  ${message}`); failed = true; }
}
if (failed) process.exit(1);
console.log('GrowLand regression checks passed.');
