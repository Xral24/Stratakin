// dug ground is square: a pit one deep, a pit three deep and a little bank of piled earth, seen from where he stands, then from inside the deep pit
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = true; G.world.time = 0.42; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const s = await ev(() => { const w = G.world, v = Village.def; let best = null; for (let r = 40; r < 200 && !best; r += 5) for (let a = 0; a < 6.283; a += 5 / r) { const x = Math.round(v.x + Math.cos(a) * r), z = Math.round(v.z + Math.sin(a) * r); let ok = true; const h0 = w.colInfo(x, z).h; for (let dx = -5; dx <= 5 && ok; dx++) for (let dz = -5; dz <= 5; dz++) { const I = w.colInfo(x + dx, z + dz); if (Math.abs(I.h - h0) > 1 || I.h < SEA + 2 || w.treeAt(x + dx, z + dz, I)) { ok = false; break; } } if (ok) { best = [x, h0, z]; break; } }
    if (!best) return null; const [x, y, z] = best; w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 3, 9999);
    const dig = (dx, dz, n) => { const t = w.colInfo(x + dx, z + dz).h; w.markCut(x + dx, z + dz); for (let k = 0; k < n; k++) w.setBlock(x + dx, t - k, z + dz, B.AIR); };
    dig(-2, -3, 1); dig(-1, -3, 1); dig(-2, -4, 1); dig(-1, -4, 1); dig(2, -3, 3); dig(2, -4, 3); dig(3, -3, 3);
    for (const [dx, dz, n] of [[0, -6, 1], [1, -6, 2], [0, -7, 1]]) { const t = w.colInfo(x + dx, z + dz).h; w.markCut(x + dx, z + dz); for (let k = 1; k <= n; k++) w.setBlock(x + dx, t + k, z + dz, B.DIRT); }
    return best; });
  console.log('spot', JSON.stringify(s)); if (!s) { await h.close(); return; }
  const views = [[0.5, 1.5, Math.PI, -0.5, 0], [2.5, -2.5, Math.PI, -0.2, -3]];
  for (let i = 0; i < views.length; i++) { await ev((a) => { const p = G.player, w = G.world, [x, y, z] = a.s, v = a.v; p.x = x + v[0]; p.z = z + v[1]; p.y = y + 1.02 + v[4]; p.onGround = true; p.yaw = v[2]; p.pitch = v[3]; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = p.pitch; } G.meshPass(999); }, { s, v: views[i] });
    await page.waitForTimeout(2500); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/dig-${i}.png` }); }
  const st = await ev(() => { const p = G.player, w = G.world; p.frozen = false; for (let i = 0; i < 20; i++) p.update(1 / 30, { mx: 0, mz: 0, moveX: 0, moveZ: 0 }); return { y: +p.y.toFixed(2), lift: +p.drawLift().toFixed(2), surf: R.surfaceAt(w, p.x, p.z) }; });
  console.log('in the pit', JSON.stringify(st));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
