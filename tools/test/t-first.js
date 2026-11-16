const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3', -1);
  const adv = async () => { for (let i = 0; i < 14; i++) { const a = await ev(() => Dialogue.active()); if (!a) break; await page.click('#dialogue'); await page.waitForTimeout(250); } };
  console.log('start', JSON.stringify(await ev(() => ({ kin: G.kin.length, first: G.stats.first, bread: G.player.count('bread'), net: G.player.count('snare'), quest: document.getElementById('quest-hint').textContent.slice(0, 70) }))));
  if (process.env.SHOT) { await page.waitForTimeout(12000); await page.screenshot({ path: '/home/claude/scratch/first-wake.png', timeout: 150000 }); }
  await ev(() => { window.__rr = R.render; R.render = () => {}; G.repelUntil = performance.now() + 600000; });
  await page.waitForTimeout(3500); console.log('dlg', await ev(() => Dialogue.active() && document.getElementById('dialogue').textContent.slice(0, 80))); await adv();
  console.log('after wake', JSON.stringify(await ev(() => ({ stage: G.stats.first.stage, bread: G.player.count('bread'), three: First.three.map(e => ({ n: KIN.name(e.kin), t: e.temper, d: +Math.hypot(e.x - G.camp.x, e.z - G.camp.z).toFixed(1), dy: +(e.y - G.camp.y).toFixed(1) })), maren: First.maren && +Math.hypot(First.maren.x - G.player.x, First.maren.z - G.player.z).toFixed(1) }))));
  const I = +process.env.PICK || 0;
  const r1 = await ev((I) => { const e = First.three[I], p = G.player; p.x = e.x + 2; p.z = e.z; p.y = e.y + 0.2; p.vx = p.vz = 0; p.yaw = Math.atan2(-(e.x - p.x), -(e.z - p.z)); return { t: e.temper }; }, I);
  await page.waitForTimeout(3600);
  const taps = []; for (let i = 0; i < 2; i++) { taps.push(await ev((I) => { const e = First.three[I], p = G.player; if (e) p.yaw = Math.atan2(-(e.x - p.x), -(e.z - p.z)); const ok = First.tap(p); const t = [...document.querySelectorAll('#toasts > *')].pop(); return [ok, t && t.textContent.slice(0, 90)]; }, I)); await page.waitForTimeout(500); }
  console.log('taps', JSON.stringify(r1), JSON.stringify(taps));
  await page.waitForTimeout(4500); console.log('dlg2', await ev(() => Dialogue.active() && document.getElementById('dialogue').textContent.slice(0, 80))); await adv();
  console.log('end', JSON.stringify(await ev(() => ({ stage: G.stats.first.stage, held: G.stats.first.held, kin: G.kin.map(k => KIN.name(k) + ' bond ' + k.bond), net: G.player.count('snare'), bread: G.player.count('bread'), buddy: Buddy.entities().length, quest: document.getElementById('quest-hint').textContent.slice(0, 60) }))));
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
