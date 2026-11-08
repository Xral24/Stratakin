// Shared headless harness: serves /home/claude/strata, opens a phone-sized page, exposes helpers.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..', 'src'); const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
async function open(opts = {}) {
  const server = http.createServer((req, res) => { const p = path.join(ROOT, req.url === '/' ? '/index.html' : req.url.split('?')[0]); fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'text/plain' }); res.end(data); }); });
  const port = opts.port || 8170 + Math.floor(Math.random() * 200);
  await new Promise(r => server.listen(port, r));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errors = []; const logs = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.goto(`http://localhost:${port}/index.html`); await page.waitForTimeout(400);
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const newGame = async (seed, starter = 0, name = '') => {
    await page.click('#s-new'); await page.fill('#s-seed', seed); if (name) await page.fill('#s-name', name); await page.waitForTimeout(150);
    await page.click(`.starter[data-i="${starter}"]`); await page.waitForTimeout(2500);
    await ev(() => { const b = document.getElementById('tut-ok'); if (b) b.click(); G.stats.securePrompt = true; });
  };
  // teleport to a village, free it (no fight) and stand at an offset; returns a summary
  const calm = () => ev(() => { if (Battle.active) Battle.abort(); const v = Village.active; if (v && v.boss) { Wild.remove(v.boss); v.boss = null; } for (const e of Wild.list.slice()) if (e.lieutenant || e.isBoss) Wild.remove(e); G.repelUntil = performance.now() + 600000; });
  const close = async () => { await browser.close(); server.close(); };
  return { page, ev, errors, logs, newGame, calm, close, browser, server };
}
module.exports = { open };
