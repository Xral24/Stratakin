const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame(process.argv[2] || 'look-1');
  const r = await ev(([dx, dz, yaw, pitch, up]) => { const p = G.player; const all = Village.markers(p.x, p.z, 8).filter(m => m.kind === 'village' && m.type === 'sea'); all.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); const m = all[0]; if (!m) return null;
    p.x = m.x + 0.5; p.z = m.z + 0.5; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); for (let i = 0; i < 5; i++) Village.update(0.1, p); p.x = m.x + 0.5 + dx; p.z = m.z + 0.5 + dz; G.world.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); G.meshPass(999);
    p.y = (m.y != null ? m.y : SEA + 1) + up; if (yaw > 90) { const l = Math.hypot(dx, dz) || 1; let bestY = 0, bestD = -9; for (let yy = -Math.PI; yy < Math.PI; yy += 0.01) { const f = U.forwardVec(yy, 0); const d = -f[0] * dx / l - f[2] * dz / l; if (d > bestD) { bestD = d; bestY = yy; } } yaw = bestY; } p.yaw = yaw; p.pitch = pitch; p.frozen = true; G.world.time = 0.4; G.repelUntil = performance.now() + 9e5; G.thirdPerson = false; for (const e of Wild.list.slice()) if (e.isBoss || e.lieutenant) Wild.remove(e); if (Village.active && Village.active.boss) { Wild.remove(Village.active.boss); Village.active.boss = null; }
    return { id: m.id, x: m.x, z: m.z, y: m.y }; }, (process.argv[3] || '0,-3,3.14,-0.05,1.8').split(',').map(Number));
  console.log(JSON.stringify(r));
  await page.waitForTimeout(3500); await page.screenshot({ path: process.argv[4] || '/tmp/seatown.png' });
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
