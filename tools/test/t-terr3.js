const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.world.time = 0.4; G.player.frozen = true; G.thirdPerson = false; G.stats.lightReturned = true; try { G.player.inv.clear(); } catch (e) {} for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const spots = await ev(() => { const w = G.world, s = w.seed, P = WORLD_W, sp = w.spawn; const best = {}; const sc = {};
    const put = (k, v, x, h, z) => { if (!(v <= (sc[k] || 0))) { sc[k] = v; best[k] = [x, h, z]; } };
    for (let dx = -700; dx <= 700; dx += 10) for (let dz = -700; dz <= 700; dz += 10) { const x = U.mod(Math.round(sp.x + dx), P), z = U.mod(Math.round(sp.z + dz), P); const i = w.colInfo(x, z); const near = 1 / (1 + Math.hypot(dx, dz) / 300);
      const j = w.colInfo(U.mod(x + 2, P), z); const drop = Math.abs(i.h - j.h);
      if (i.biome === BIOME.DESERT && drop >= 5) put('butte', near, x, Math.max(i.h, j.h), z);
      if (i.h > SEA && i.h < SEA + 16 && drop >= 4 && Math.min(i.h, j.h) <= SEA + 2) put('cliff', near, x, Math.max(i.h, j.h), z);
      if (i.biome === BIOME.MOUNTAIN) put('ridge', i.h * near, x, i.h, z);
      if (i.biome !== BIOME.MOUNTAIN && i.biome !== BIOME.DESERT && i.h > SEA + 8 && drop >= 3) put('shelf', near, x, Math.max(i.h, j.h), z); }
    return best; });
  console.log(JSON.stringify(spots));
  for (const [name, p] of Object.entries(spots)) { const ok = await ev(([x, y, z]) => { const p = G.player, w = G.world; p.x = x - 22; p.z = z - 22; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 9999); p.y = Math.max(y, w.groundY(Math.floor(p.x), Math.floor(p.z)) || y) + 12; p.yaw = Math.atan2(-(x - p.x), -(z - p.z)); p.pitch = -0.35; G.meshPass(999); return 1; }, p); await page.waitForTimeout(3500); await page.screenshot({ path: '/home/claude/ter-' + name + '.png', clip: { x: 0, y: 100, width: 390, height: 480 } }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 2).join('\n') : 'none'); await h.close(); })();
