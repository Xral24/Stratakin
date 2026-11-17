const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { G.repelUntil = 0; const p = G.player, w = G.world, t = Village.townList()[0]; p.x = t.x + 0.5; p.z = t.z + 12.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = t.y + 0.05; window.__r = R.render; R.render = () => {}; G.world.time = 0.4; });
  await page.waitForTimeout(2500);
  console.log(JSON.stringify(await ev(() => { const v = Village.active, b = v.boss, p = G.player; window.__b = b; p.x = b.x + 9; p.z = b.z + 2; p.y = b.y + 0.1; return { boss: KIN.name(b.kin) }; })));
  await page.waitForTimeout(1500);
  console.log('talk', JSON.stringify(await ev(() => { const b = window.__b; return { scene: b.scene && b.scene.stage, dlg: Dialogue.active() && document.getElementById('dialogue').textContent.slice(0, 80), frozen: G.player.frozen, jaw: +(b.jawOpen || 0).toFixed(2), talkK: +G.talkK.toFixed(2) }; })));
  if (process.env.SHOT) { await ev(() => { R.render = window.__r; }); await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/scratch/scene-talk.png', timeout: 150000 }); await ev(() => { R.render = () => {}; }); }
  await ev(() => { G.player.vx = 5; document.getElementById('dialogue').click(); }); await page.waitForTimeout(150); await ev(() => { if (Dialogue.active()) document.getElementById('dialogue').click(); });
  const samples = []; for (let i = 0; i < 5; i++) { await page.waitForTimeout(260); samples.push(await ev(() => { const b = window.__b; return [b.scene && b.scene.stage, b._an ? +b._an.nod.toFixed(2) : null, +(b.jawOpen || 0).toFixed(2), Battle.active]; })); if (i === 1 && process.env.SHOT) { await ev(() => { window.__hold = window.__b.scene; window.__b.scene.t = 0.5; R.render = window.__r; G.setPaused && G.setPaused(true); }); await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/scratch/scene-laugh.png', timeout: 150000 }); await ev(() => { G.setPaused && G.setPaused(false); R.render = () => {}; }); } }
  console.log('laugh', JSON.stringify(samples)); await page.waitForTimeout(1500);
  console.log('end', JSON.stringify(await ev(() => ({ battle: Battle.active, frozen: G.player.frozen }))));
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
