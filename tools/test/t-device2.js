const { open } = require('./harness');
(async () => { const h = await open({ device: true }); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const s0 = await ev(() => { window.__deviceAuto = true; window.__netRoll = 0.99; window.__deviceHold = 5; R.render = () => {}; const p = G.player; p.add('snare', 5); G.trainerLevel = 40; let w = Wild.list.find(q => !q.isBoss && !q.high && !q.aquatic); if (!w) return { none: true }; w.kin.hp = Math.round(KIN.stats(w.kin).hp * 0.8); w.kin.sp.rarity = 2; Battle.start(w, false); return { wild: KIN.name(w.kin), n: G.kin.length }; });
  console.log(JSON.stringify(s0)); await page.waitForTimeout(2500);
  await ev(() => Cards.preload(Object.values(Cards.BG)));
  await page.evaluate(() => { const b = document.querySelector('#b-actions [data-a="snare"]'); if (b) b.click(); }); await page.waitForTimeout(600);
  await page.evaluate(() => { const b = [...document.querySelectorAll('#b-actions button, #battle button')].find(b => /\b(net|link)\b/i.test(b.textContent) && b.offsetParent && b.id !== 'snare-cancel' && b.id !== 'snare-go'); if (b) b.click(); });
  for (let i = 0; i < 14; i++) { await page.waitForTimeout(i < 9 ? 1500 : 1100); await page.screenshot({ path: `/home/claude/scratch/dv${i}.png` }); if (!(await ev(() => Device.open))) { console.log('closed after', i); break; } }
  await page.waitForTimeout(2500);
  console.log(JSON.stringify(await ev(() => ({ n: G.kin.length, card: G.kin[G.kin.length - 1].card, active: Battle.active, log: [...document.querySelectorAll('#b-log > *')].slice(-3).map(e => e.textContent) }))));
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
