import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleDir = path.join(root, 'public', 'articles');
const css = path.join(articleDir, 'article.css');
const template = path.join(articleDir, 'template.html');
const data = path.join(root, 'src', 'data', 'articles.json');

if (!existsSync(articleDir)) throw new Error('Missing public/articles directory');
if (!existsSync(css)) throw new Error('Missing global article stylesheet');
if (!existsSync(template)) throw new Error('Missing article template');
if (!existsSync(data)) throw new Error('Missing article metadata');

const articles = JSON.parse(readFileSync(data, 'utf8'));
if (!Array.isArray(articles)) throw new Error('articles.json must contain an array');

for (const article of articles) {
  if (!article?.slug || !article?.path) throw new Error('Each article requires slug and path');
  const target = path.join(root, 'public', article.path.replace(/^\//, ''));
  if (!existsSync(target)) throw new Error(`Missing article HTML: ${article.path}`);
  const html = readFileSync(target, 'utf8');
  if (!html.includes('href="./article.css"')) throw new Error(`Article does not use global CSS: ${article.path}`);
}

const htmlCount = readdirSync(articleDir).filter((name) => name.endsWith('.html') && name !== 'template.html').length;
console.log(`Validated ${articles.length} article metadata entries and ${htmlCount} published HTML article(s).`);
