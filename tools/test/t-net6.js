const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const s0 = await ev(() => { R.render = () => {}; const p = G.player; p.add('snare', 5); G.trainerLevel = 40; let w = Wild.list.find(q => !q.isBoss && !q.high && !q.aquatic); if (!w) return { none: true }; w.kin.hp = 1; Battle.start(w, false); return { wild: KIN.name(w.kin) }; });
  console.log(JSON.stringify(s0)); await page.waitForTimeout(2500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button')].find(b => /\bnet\b/i.test(b.textContent)); if (b) b.click(); }); await page.waitForTimeout(600);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button, #battle button')].find(b => /\bnet\b/i.test(b.textContent) && b.offsetParent && b.id !== 'snare-cancel' && b.id !== 'snare-go'); if (b) b.click(); }); await page.waitForTimeout(500);
  const W = 390, H = 780, HX = W / 2, HY = H - 187; let x = HX + 60, y = HY; await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 0; i <= 44; i++) { const a = i / 44 * Math.PI * 4.4; await page.mouse.move(HX + Math.cos(a) * 60, HY + Math.sin(a) * 60); await page.waitForTimeout(12); }
  const k = await ev(() => { const n = Battle.net; n.speed = 0; n.kx = 195; n.ky = 300; n.kfy = 330; n.kpx = 90; return { spin: n.spin, phase: n.phase }; }); console.log(JSON.stringify(k));
  await ev(() => { R.project = () => ({ on: false }); }); // hold the Kin where the test put it
  for (let i = 1; i <= 5; i++) { await page.mouse.move(HX, HY - i * 16); await page.waitForTimeout(10); } await page.mouse.up(); await page.waitForTimeout(900);
  const st = await ev(() => { const n = Battle.net; return n && { phase: n.phase, res: n.res, land: n.fly && [Math.round(n.fly.x1), Math.round(n.fly.y1)], dir: n.cdir, window: n.window }; }); console.log('after throw', JSON.stringify(st));
  if (st && st.phase === 'close') { await page.mouse.move(195 + 60, 640); await page.mouse.down(); for (let i = 1; i <= 30; i++) { const a = st.dir * i / 30 * Math.PI * 2.6; await page.mouse.move(195 + Math.cos(a) * 60, 640 + Math.sin(a) * 60); await page.waitForTimeout(8); } await page.mouse.up(); }
  await page.waitForTimeout(2600);
  const log = await page.evaluate(() => [...document.querySelectorAll('#b-log > *')].slice(-2).map(e => e.textContent)); console.log(JSON.stringify(log)); console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
