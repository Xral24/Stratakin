const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm(); await ev(() => { R.render = () => {}; });
  await ev(() => { window.__res = null; Games.play('chess', { champ: 'Tobin Rook', stake: 40, skill: 0.4, onEnd: (r) => { window.__res = r; } }); });
  // play e4 then two more moves by tapping squares
  const tap = async (i) => { await page.evaluate((i) => { document.querySelectorAll('#gamebox .gb-sq')[i].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, i); };
  await tap(52); await tap(36); await page.waitForTimeout(2600); await tap(62); await tap(45); await page.waitForTimeout(2600);
  const c = await ev(() => { const s = Games.current.s; return { b: s.b, t: s.t, n: Games.current.n }; }); console.log('chess', JSON.stringify(c));
  await page.screenshot({ path: '/home/claude/game-chess.png' });
  await ev(() => { Games.close(); Games.play('tide', { champ: 'Tidemaster Oan', stake: 100, skill: 0.9, onEnd: (r) => { window.__res = r; } }); });
  for (const n of [5, 9]) { await page.evaluate((n) => { [...document.querySelectorAll('#gamebox .gt-you .gt-card')].find(e => e.textContent == n).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, n); await page.waitForTimeout(n === 9 ? 500 : 1500); }
  await page.screenshot({ path: '/home/claude/game-tide.png' }); await page.waitForTimeout(1200);
  for (const n of [1, 2, 3, 4, 6, 7, 8]) { await page.evaluate((n) => { [...document.querySelectorAll('#gamebox .gt-you .gt-card')].find(e => e.textContent == n).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, n); await page.waitForTimeout(1500); }
  const t = await ev(() => ({ ys: Games.current.ys, ts: Games.current.ts, over: Games.current.over })); console.log('tide', JSON.stringify(t));
  await page.evaluate(() => document.querySelector('#gamebox .gb-foot button').click()); console.log('result', await ev(() => window.__res), 'ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
