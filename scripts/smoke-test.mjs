import fs from 'node:fs';
import path from 'node:path';
const required=['index.html','package.json','src/main.jsx','src/styles.css','server/index.js','server/store.js','vercel.json'];
for(const file of required) if(!fs.existsSync(path.resolve(file))) throw new Error(`Missing required file: ${file}`);
const html=fs.readFileSync(path.resolve('index.html'),'utf8');
if(!html.includes('name="viewport"')) throw new Error('Viewport meta is missing.');
const css=fs.readFileSync(path.resolve('src/styles.css'),'utf8');
for(const token of ['.auth-layout','.fields-2','.site-nav','@media (max-width: 760px)']) if(!css.includes(token)) throw new Error(`Responsive/style token missing: ${token}`);
console.log('GrowLand smoke test passed.');
