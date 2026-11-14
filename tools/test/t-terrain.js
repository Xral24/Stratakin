const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('gal-1'); await h.calm();
  const spots = await ev(() => { const w = G.world, s = w.seed, P = WORLD_W, sp = w.spawn; const best = { butte: null, cliff: null, ridge: null, shelf: null }; const sc = { butte: 0, cliff: 0, ridge: 0, shelf: 0 };
    for (let dx = -520; dx <= 520; dx += 10) for (let dz = -520; dz <= 520; dz += 10) { const x = U.mod(Math.round(sp.x + dx), P), z = U.mod(Math.round(sp.z + dz), P); const i = w.colInfo(U.mod(x, P), U.mod(z, P)); const far = 1;
      const mm = U.vnoise2(x, z, 110, P, s + 47), cf = U.vnoise2(x, z, 120, P, s + 49), tm = U.vnoise2(x, z, 140, P, s + 45);
      if (i.biome === BIOME.DESERT && mm > 0.7 && mm * far > sc.butte) { sc.butte = mm * far; best.butte = [x, i.h, z]; }
      if (cf > 0.66 && i.h > SEA + 4 && i.h < SEA + 14 && cf * far > sc.cliff && w.colInfo(U.mod(x + 30, P), U.mod(z, P)).h < SEA) { sc.cliff = cf * far; best.cliff = [x, i.h, z]; }
      if (i.biome === BIOME.MOUNTAIN && i.h * far > sc.ridge) { sc.ridge = i.h * far; best.ridge = [x, i.h, z]; }
      if (tm > 0.7 && i.h > SEA + 8 && i.biome !== BIOME.MOUNTAIN && tm * far > sc.shelf) { sc.shelf = tm * far; best.shelf = [x, i.h, z]; } }
    G.world.time = 0.45; G.stats.lightReturned = true; G.repelUntil = performance.now() + 900000; return best; });
  console.log(JSON.stringify(spots));
  for (const [name, p] of Object.entries(spots)) { if (!p) continue; await ev(([x, y, z]) => { const pl = G.player; const pit = U.forwardVec(0, -0.5)[1] < 0 ? -0.5 : 0.5; if (window.__hold) clearInterval(window.__hold); const fx = x - 30, fy = y + 26, fz = z - 30; window.__hold = setInterval(() => { pl.flying = true; pl.x = fx; pl.y = fy; pl.z = fz; pl.vx = pl.vy = pl.vz = 0; pl.yaw = Math.atan2(-(x - fx), -(z - fz)); pl.pitch = pit; G.thirdPerson = false; }, 50); for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } }, p); await page.waitForTimeout(12000); await page.screenshot({ path: '/home/claude/ter-' + name + '.png', clip: { x: 0, y: 130, width: 390, height: 440 } }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 2).join('\n') : 'none'); await h.close(); })();
