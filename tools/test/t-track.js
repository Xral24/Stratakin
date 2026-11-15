// the railway between towns: is it laid, is it one unbroken chain from the start station, and what does it look like from beside it
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.stats.buddyOff = true; G.explain = () => {}; G.player.frozen = true; G.thirdPerson = true; G.world.time = 0.42; for (const id of ['hud', 'controls', 'hotbar']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  const r = await ev(() => { const w = G.world, v = Village.def; let n = 0, first = null; const cells = [];
    for (let dx = -160; dx <= 160; dx++) for (let dz = -160; dz <= 160; dz++) if (w.trackAt(v.x + dx, v.z + dz)) { n++; cells.push([v.x + dx, v.z + dz]); }
    cells.sort((a, b) => Math.hypot(a[0] - v.x, a[1] - v.z) - Math.hypot(b[0] - v.x, b[1] - v.z));
    const key = (c) => c[0] + ',' + c[1]; const set = new Set(cells.map(key)); let odd = 0; const pick = [];
    for (const c of cells) { let k = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) if (set.has(key([c[0] + a, c[1] + b]))) k++; if (k !== 2) odd++; }
    for (const i of [14, 70, 130]) if (cells[i]) pick.push(cells[i]); const len = odd;
    return { inWindow: n, nearest: cells[0] ? [cells[0][0] - v.x, cells[0][1] - v.z] : null, cellsWithNotTwoNeighbours: len, pick }; });
  console.log(JSON.stringify(r));
  for (let i = 0; i < r.pick.length; i++) { await ev((c) => { const p = G.player, w = G.world; p.x = c[0] + 2.5; p.z = c[1] + 2.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); p.y = w.colInfo(Math.floor(p.x), Math.floor(p.z)).h + 1.02; p.onGround = true; p.yaw = Math.atan2(-(c[0] - p.x), -(c[1] - p.z)) + 0.9; p.pitch = -0.35; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = p.pitch; } G.meshPass(999); }, r.pick[i]);
    await page.waitForTimeout(2400); await ev(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); await page.screenshot({ path: `/home/claude/track-${i}.png` }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
