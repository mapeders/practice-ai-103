// Merges build/chunk-*.json into build/questions.json and injects them into index.html from build/template.html.
// Usage: node build/assemble.js
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
function opt(name, dflt) { const i = args.indexOf(name); return i === -1 ? dflt : args[i + 1]; }
const dir = opt('--chunks', __dirname);           // directory holding chunk-*.json
const outFile = opt('--out', path.join(__dirname, '..', 'index.html'));
const chunks = fs.readdirSync(dir).filter(f => /^chunk-.*\.json$/.test(f)).sort();
let all = [];
for (const f of chunks) {
  const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (!Array.isArray(arr)) throw new Error(f + ' is not an array');
  all = all.concat(arr);
}
all.sort((a, b) => a.id - b.id);
const ids = new Set();
for (const q of all) { if (ids.has(q.id)) throw new Error('duplicate id ' + q.id); ids.add(q.id); }
fs.writeFileSync(path.join(dir, 'questions.json'), JSON.stringify(all, null, 2) + '\n');
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
// Escape "</script" so question text can never terminate the inline script.
const json = JSON.stringify(all, null, 2).replace(/<\/script/gi, '<\\/script');
const out = tpl.replace('__QUESTIONS__', json);
fs.writeFileSync(outFile, out);
const byTopic = {}; const byType = {};
for (const q of all) { byTopic[q.topic] = (byTopic[q.topic] || 0) + 1; byType[q.type] = (byType[q.type] || 0) + 1; }
console.log(JSON.stringify({ chunks, total: all.length, byTopic, byType }, null, 2));
