// Validates one chunk JSON file against the question schema, topic, id range, and the
// source URL whitelist in build/url-list.json (unit URLs derived from module base + unit slug, plus docs).
// Usage: node build/validate.js <chunk-file> <topic> <id-min> <id-max>
const fs = require('fs');
const path = require('path');
const [,, chunkPath, topic, idMinStr, idMaxStr] = process.argv;
if (!chunkPath || !topic || !idMinStr || !idMaxStr) {
  console.error('Usage: node build/validate.js <chunk-file> <topic> <id-min> <id-max>'); process.exit(2);
}
const idMin = +idMinStr, idMax = +idMaxStr;
const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'url-list.json'), 'utf8'))[topic];
if (!list) { console.error('unknown topic ' + topic); process.exit(2); }
const allowed = new Set();
for (const m of list.modules) for (const u of m.units) { allowed.add(m.base + u); allowed.add(m.base + u + '?pivots=text'); }
for (const d of list.docs) allowed.add(d);
const arr = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
if (!Array.isArray(arr)) { console.error('not a JSON array'); process.exit(1); }
const TYPES = ['mc_single','mc_multi','sequence','hotspot'];
const errs = [], seen = new Set(), typeCounts = {mc_single:0,mc_multi:0,sequence:0,hotspot:0};
const seenQuestions = new Set();
for (const q of arr) {
  const pre = `id=${q && q.id}`;
  if (typeof q.id !== 'number') errs.push(`${pre}: id not a number`);
  else if (q.id < idMin || q.id > idMax) errs.push(`${pre}: id out of range`);
  else if (seen.has(q.id)) errs.push(`${pre}: duplicate id`); else seen.add(q.id);
  if (q.topic !== topic) errs.push(`${pre}: topic ${q.topic} != ${topic}`);
  if (!TYPES.includes(q.type)) errs.push(`${pre}: bad type ${q.type}`); else typeCounts[q.type]++;
  if (typeof q.question !== 'string' || q.question.trim().length < 40) errs.push(`${pre}: question missing/too short`);
  else { const k = q.question.trim().toLowerCase(); if (seenQuestions.has(k)) errs.push(`${pre}: duplicate question text`); seenQuestions.add(k); }
  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 60) errs.push(`${pre}: explanation missing/too short`);
  if (!q.source || !q.source.url || !q.source.path || !q.source.module || !q.source.unit) errs.push(`${pre}: missing source fields`);
  else if (!allowed.has(q.source.url)) errs.push(`${pre}: source.url not in allowed list (${q.source.url})`);
  if (q.type === 'mc_single' || q.type === 'mc_multi') {
    if (!Array.isArray(q.options) || q.options.length < 3) errs.push(`${pre}: options must be 3+`);
    if (!Array.isArray(q.correct) || !q.correct.length) errs.push(`${pre}: correct missing`);
    if (q.type === 'mc_single' && q.correct && q.correct.length !== 1) errs.push(`${pre}: mc_single needs exactly 1 correct`);
    if (q.type === 'mc_multi' && q.correct && q.correct.length < 2) errs.push(`${pre}: mc_multi needs 2+ correct`);
    const ids = new Set((q.options||[]).map(o => o && o.id));
    for (const c of (q.correct||[])) if (!ids.has(c)) errs.push(`${pre}: correct ${c} not in options`);
    const texts = new Set((q.options||[]).map(o => o && String(o.text).trim().toLowerCase()));
    if (texts.size !== (q.options||[]).length) errs.push(`${pre}: duplicate option text`);
  } else if (q.type === 'sequence') {
    if (!Array.isArray(q.items) || q.items.length < 3) errs.push(`${pre}: items must be 3+`);
    if (!Array.isArray(q.correct_order)) errs.push(`${pre}: correct_order missing`);
    else if (q.items && q.items.length !== q.correct_order.length) errs.push(`${pre}: items/correct_order mismatch`);
    const ids = new Set((q.items||[]).map(i => i && i.id));
    for (const c of (q.correct_order||[])) if (!ids.has(c)) errs.push(`${pre}: correct_order ${c} not in items`);
  } else if (q.type === 'hotspot') {
    if (!Array.isArray(q.blanks) || q.blanks.length < 2) errs.push(`${pre}: blanks must be 2+`);
    for (const b of (q.blanks||[])) {
      if (!b || !b.id || !b.prompt || !Array.isArray(b.options) || b.options.length < 2 || b.correct == null) { errs.push(`${pre}: blank malformed`); break; }
      if (!new Set(b.options.map(o => o && o.id)).has(b.correct)) { errs.push(`${pre}: blank correct ${b.correct} not in options`); break; }
    }
  }
}
const summary = { chunk: path.basename(chunkPath), topic, count: arr.length, typeCounts, errors: errs.length };
if (errs.length) { console.error(JSON.stringify(summary, null, 2)); errs.forEach(e => console.error(' - ' + e)); process.exit(1); }
console.log(JSON.stringify(summary, null, 2));
