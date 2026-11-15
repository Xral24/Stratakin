// the nearest knoll to the start town: can he walk up it, do his feet stay on the drawn ground, and what does it look like from where he stands
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.thirdPerson = true; G.world.time = 0.42; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const k = await ev(() => { const w = G.world, v = Village.def; let best = null; for (let r = 30; r < 420 && !best; r += 6) for (let a = 0; a < 6.283; a += 6 / r) { const x = Math.round(v.x + Math.cos(a) * r), z = Math.round(v.z + Math.sin(a) * r); const i = w.colInfo(x, z); if (i.crag >= 3.5) { best = [x, z]; break; } }
    if (!best) return null; let [bx, bz] = best, bc = 0; for (let dx = -14; dx <= 14; dx++) for (let dz = -14; dz <= 14; dz++) { const c = w.colInfo(best[0] + dx, best[1] + dz).crag || 0; if (c > bc) { bc = c; bx = best[0] + dx; bz = best[1] + dz; } }
    return { x: bx, z: bz, c: bc, top: w.colInfo(bx, bz).h, foot: w.colInfo(bx + 16, bz).h }; });
  console.log('knoll', JSON.stringify(k)); if (!k) { await h.close(); return; }
  // walk up it from 16 blocks east, holding forward
  const walk = await ev((k) => { const p = G.player, w = G.world; p.frozen = false; const res = [];
    for (const [ax, az, yaw] of [[1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2], [0, 1, 0], [0, -1, Math.PI]]) { p.x = k.x + ax * 17 + 0.5; p.z = k.z + az * 17 + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); const y0 = w.colInfo(Math.floor(p.x), Math.floor(p.z)).h + 1.02; p.y = y0; p.vx = p.vy = p.vz = 0; p.yaw = yaw; p.pitch = 0;
      let worst = 0, worstUp = 0, i = 0; for (; i < 420; i++) { p.update(1 / 30, { mx: 0, mz: 1, moveX: 0, moveZ: -1 }); const s = R.surfaceAt(w, p.x, p.z); const feet = p.y + p.drawLift(); if (s != null && p.onGround) { worst = Math.max(worst, s - feet); worstUp = Math.max(worstUp, feet - s); } if (Math.hypot(p.x - (k.x + 0.5), p.z - (k.z + 0.5)) < 0.7) break; }
      res.push({ from: [ax, az], y0: +y0.toFixed(1), end: [+(p.x - k.x).toFixed(1), +p.y.toFixed(1), +(p.z - k.z).toFixed(1)], reached: i < 420, buried: +worst.toFixed(2), floating: +worstUp.toFixed(2) }); }
    return res; }, k);
  console.log('walk', JSON.stringify(walk));
  const shots = [[18, 3, 0], [9, 2, 0], [4, -3, 0], [0, 0, 1]];
  for (let i = 0; i < shots.length; i++) { await ev((a) => { const p = G.player, w = G.world, k = a.k; p.frozen = true; p.x = k.x + a.s[0] + 0.5; p.z = k.z + a.s[1] + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 1.02; p.onGround = true; p.yaw = a.s[2] ? 0.7 : Math.atan2(-(k.x - p.x), -(k.z - p.z)); p.pitch = a.s[2] ? -0.25 : -0.06; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = p.pitch; } G.meshPass(999); }, { k, s: shots[i] });
    await page.waitForTimeout(2600); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/knoll-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
