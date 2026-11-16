// the tyrant of the first village and the Kin that guard it for him, looked at from close by
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev((t) => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = false; G.world.time = t; G.paused = true; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } }, +(process.env.TIME || 0.36));
  const info = await ev(() => { const v = Village.townList()[0]; const p = G.player, w = G.world; p.x = v.x + 0.5; p.z = v.z + 8.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); G.meshPass(9999); G.paused = false; return { x: v.x, z: v.z, y: v.y }; });
  await page.waitForTimeout(1500);
  const who = await ev(() => { G.paused = true; const b = Wild.list.find(e => e.isBoss), gs = Wild.list.filter(e => e.lieutenant).slice(0, 4); return { boss: b ? { x: b.x, y: b.y, z: b.z, name: KIN.name(b.kin), shape: b.kin.sp ? b.kin.sp.shape : (b.model && b.model.shape) } : null, guards: gs.map(g => ({ x: g.x, y: g.y, z: g.z, name: g.kin ? KIN.name(g.kin) : '?' })) }; });
  console.log(JSON.stringify(who)); const shots = [];
  if (who.boss) { shots.push({ t: who.boss, d: 4.6, a: -0.55, up: 1.6, n: 'boss-front' }); shots.push({ t: who.boss, d: 3.6, a: -2.2, up: 1.9, n: 'boss-back' }); }
  who.guards.slice(0, 2).forEach((g, i) => shots.push({ t: g, d: 2.6, a: 0.5 - i, up: 1.1, n: 'guard' + i }));
  let i = 0; for (const s of shots) { await ev((s) => { const p = G.player, t = s.t; const b = Wild.list.find(e => Math.abs(e.x - t.x) < 0.01 && Math.abs(e.z - t.z) < 0.01); const yaw = b ? b.yaw : 0; const ax = Math.sin(yaw + s.a), az = Math.cos(yaw + s.a); p.x = t.x + ax * s.d; p.z = t.z + az * s.d; p.y = t.y + s.up; const dx = t.x - p.x, dz = t.z - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = -0.12; }, s);
    await page.waitForTimeout(2500); await page.screenshot({ path: `/home/claude/boss-${i}.png`, timeout: 120000 }); console.log(i, s.n); i++; }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 4).join('\n') : 'none'); await h.close(); })();
