const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const s0 = await ev(() => { R.render = () => {}; const p = G.player; p.add('snare', 5); G.trainerLevel = 40; let w = Wild.list.find(q => !q.isBoss && !q.high && !q.aquatic); if (!w) return { none: true }; w.kin.hp = 1; Battle.start(w, false); return { wild: KIN.name(w.kin) }; });
  console.log(JSON.stringify(s0)); await page.waitForTimeout(2500);
  const btns = await page.evaluate(() => [...document.querySelectorAll('#b-actions button')].map(b => b.textContent.trim().slice(0, 30))); console.log('actions', JSON.stringify(btns));
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button')].find(b => /snare/i.test(b.textContent)); if (b) b.click(); }); await page.waitForTimeout(600);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button, #battle button')].find(b => /snare/i.test(b.textContent) && b.offsetParent && b.id !== 'snare-cancel' && b.id !== 'snare-go'); if (b) b.click(); }); await page.waitForTimeout(500);
  const vis = await page.evaluate(() => { const c = document.getElementById('snare-net'); const r = c.getBoundingClientRect(); return { shown: !document.getElementById('b-snare').classList.contains('hidden'), r: [r.left, r.top, r.width, r.height] }; }); console.log(JSON.stringify(vis));
  if (vis.shown) { const [L, T, W, H] = vis.r, P = (x, y) => [L + x / 640 * W, T + y / 560 * H]; let [x, y] = P(380, 470); await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 0; i <= 44; i++) { const a = i / 44 * Math.PI * 4.4; [x, y] = P(320 + Math.cos(a) * 60, 470 + Math.sin(a) * 60); await page.mouse.move(x, y); await page.waitForTimeout(12); }
    await page.screenshot({ path: '/home/claude/net-1.png' });
    await ev(() => { const n = Battle.net; n.speed = 0; n.jit = 0; n.t = 0; });
    for (let i = 1; i <= 5; i++) { [x, y] = P(320, 470 - i * 14); await page.mouse.move(x, y); await page.waitForTimeout(10); } await page.mouse.up(); await page.waitForTimeout(650);
    console.log('after throw', JSON.stringify(await ev(() => { const n = Battle.net; return n && { phase: n.phase, res: n.res, land: n.fly && [Math.round(n.fly.x1), Math.round(n.fly.y1)], k: [Math.round(n.kx), Math.round(n.ky)], cdir: n.cdir, window: n.window }; })));
    const st = await ev(() => { const n = Battle.net; return n && n.phase === 'close' ? { x: n.fly.x1, y: n.fly.y1, dir: n.cdir } : null; });
    if (st) { await page.screenshot({ path: '/home/claude/net-2.png' }); [x, y] = P(st.x + 70, st.y); await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= 30; i++) { const a = st.dir * i / 30 * Math.PI * 3.6; [x, y] = P(st.x + Math.cos(a) * 70, st.y + Math.sin(a) * 70); await page.mouse.move(x, y); await page.waitForTimeout(8); } await page.mouse.up(); await page.waitForTimeout(250); await page.screenshot({ path: '/home/claude/net-3.png' }); }
    await page.waitForTimeout(2200); }
  const log = await page.evaluate(() => [...document.querySelectorAll('#b-log > *')].slice(-4).map(e => e.textContent)); console.log(JSON.stringify(log)); console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
