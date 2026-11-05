// Headless smoke test: loads index.html (or the file given) in Chrome, renders and auto-answers every question
// through the real DOM code paths, and reports render failures. Usage: node build/smoke.js [html-file]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const htmlFile = process.argv[2] || path.join(__dirname, '..', 'index.html');
const tmpDir = process.env.SMOKE_TMP || fs.mkdtempSync(path.join(require('os').tmpdir(), 'ai103-smoke-'));
const harness = `
<script>
(function () {
  const out = [];
  const errors = [];
  window.onerror = (m) => errors.push(String(m));
  try {
    out.push('validator-rejected=' + _vRes.invalid.length + ' ' + JSON.stringify(_vRes.invalid));
    for (const q of QUESTIONS) {
      session = { mode: 'topic', topicId: q.topic, queue: [q.id], cursor: 0, score: { right: 0, wrong: 0 } };
      try {
        renderPractice();
        const root = document.getElementById('view-practice');
        if (q.type === 'mc_single') {
          root.querySelector('[data-opt="' + q.correct[0] + '"]').click();
        } else if (q.type === 'mc_multi') {
          for (const c of q.correct) root.querySelector('[data-opt="' + c + '"]').click();
          root.querySelector('#btn-submit').click();
        } else if (q.type === 'sequence') {
          // Bubble each item into place using the real up/down buttons.
          for (let target = 0; target < q.correct_order.length; target++) {
            const want = q.correct_order[target];
            let rows = [...root.querySelectorAll('.seq-row')].map(r => r.dataset.id);
            let cur = rows.indexOf(want);
            while (cur > target) { root.querySelectorAll('.seq-up')[cur].click(); cur--; }
          }
          root.querySelector('#btn-submit').click();
        } else if (q.type === 'hotspot') {
          for (const b of q.blanks) {
            const sel = root.querySelector('.hot-select[data-blank="' + b.id + '"]');
            sel.value = b.correct; sel.dispatchEvent(new Event('change'));
          }
          root.querySelector('#btn-submit').click();
        }
        const fb = root.querySelector('#feedback').textContent;
        if (!/^\\s*Correct/.test(fb)) out.push('Q#' + q.id + ' graded WRONG with the correct answer');
        if (!root.querySelector('#feedback a[href^="https://learn.microsoft.com"]')) out.push('Q#' + q.id + ' missing Learn link');
        if (!root.querySelector('#btn-next')) out.push('Q#' + q.id + ' missing next button');
      } catch (e) { out.push('Q#' + q.id + ' threw: ' + e.message); }
    }
    showView('home'); renderHome();
    const cards = document.querySelectorAll('#view-home .topic-card');
    out.push('home-cards=' + cards.length + ' enabled=' + [...cards].filter(c => !c.disabled).length);
    document.querySelector('#view-home [data-mode="mixed"]').click();
    out.push('mixed-queue=' + session.queue.length);
    finishSession();
    out.push('results-rendered=' + !!document.querySelector('#view-results h2'));
  } catch (e) { out.push('HARNESS threw: ' + e.message + ' ' + e.stack); }
  const problems = out.filter(l => /WRONG|missing|threw|HARNESS/.test(l)).concat(errors.map(e => 'window.onerror: ' + e));
  document.body.innerHTML = '<pre id="smoke">' + JSON.stringify({ questions: QUESTIONS.length, problems, info: out.filter(l => !problems.includes(l)) }, null, 2) + '</pre>';
})();
</script>`;
const html = fs.readFileSync(htmlFile, 'utf8').replace('</body>', harness + '</body>');
const testFile = path.join(tmpDir, 'smoke.html');
fs.writeFileSync(testFile, html);
const dom = execFileSync('google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=5000', '--dump-dom', 'file://' + testFile],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/<pre id="smoke">([\s\S]*?)<\/pre>/);
if (!m) { console.error('smoke harness did not run; page head:\n' + dom.slice(0, 2000)); process.exit(1); }
const report = JSON.parse(m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
console.log(JSON.stringify(report, null, 2));
process.exit(report.problems.length ? 1 : 0);
