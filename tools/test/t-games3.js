const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm(); await ev(() => { R.render = () => {}; });
  for (const kind of ['moonshot', 'hoops']) { await ev((kind) => { window.__res = null; Games.play(kind, { champ: 'Ambo', stake: 40, skill: 0.5, onEnd: (r) => { window.__res = r; } }); }, kind);
    await page.waitForTimeout(700); await page.evaluate(() => document.querySelector('#gamebox .gb-throw').click()); await page.waitForTimeout(kind === 'moonshot' ? 900 : 300); await page.screenshot({ path: `/home/claude/game-${kind}.png` });
    const out = await ev(() => { const c = Games.current; for (let i = 0; i < 4000 && !c.over; i++) { c.debug.step(0.05); if (c.mine && c.wait <= 0 && !c.fly) { if (c.debug.throwAt) c.debug.throwAt(c.target + 0.01); else c.debug.tap(); } } return { over: c.over, ys: c.ys, ts: c.ts }; });
    console.log(kind, JSON.stringify(out)); await page.evaluate(() => { const b = document.querySelector('#gamebox .gb-foot button'); if (b) b.click(); }); console.log(' result', await ev(() => window.__res)); await ev(() => Games.close()); }
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
