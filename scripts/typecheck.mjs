import fs from 'node:fs';
import path from 'node:path';
const main=fs.readFileSync(path.resolve('src/main.jsx'),'utf8');
if(!main.includes("import './styles.css';") || main.includes("import './redesign.css';")) throw new Error('Stylesheet consolidation check failed.');
console.log('GrowLand typecheck placeholder: JavaScript project, structural checks passed.');
