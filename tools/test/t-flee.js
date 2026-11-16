const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { G.repelUntil = 0; const p = G.player, w = G.world, t = Village.townList()[0]; p.x = t.x + 0.5; p.z = t.z + 12.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); p.y = t.y + 0.05; });
  await page.waitForTimeout(1500);
  const a = await ev(() => { const v = Village.active, b = v && v.boss; if (!b) return null; window.__b = b; window.__r = R.render; R.render = () => {}; const p = G.player; p.x = b.x - 5; p.z = b.z; p.yaw = Math.atan2(b.x - p.x, b.z - p.z); Wild.remove(b); Village.onBossGone(v.id); Village.freed(v.id); return { x: +b.x.toFixed(1), z: +b.z.toFixed(1), d: 5 }; });
  console.log('start', JSON.stringify(a));
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(700); const s = await ev(() => { const b = window.__b, p = G.player; return { d: +Math.hypot(b.x - p.x, b.z - p.z).toFixed(1), y: +b.y.toFixed(1), sc: +b.scale.toFixed(2), drawn: Village.entities().includes(b) }; }); console.log(i, JSON.stringify(s));
    if (i === 1 && process.env.SHOT) { await ev(() => { R.render = window.__r; G.setPaused && G.setPaused(true); }); await page.waitForTimeout(9000); await page.screenshot({ path: '/home/claude/scratch/flee.png', timeout: 150000 }); await ev(() => { G.setPaused(false); R.render = () => {}; }); } }
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
