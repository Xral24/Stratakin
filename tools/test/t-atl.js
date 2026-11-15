// where Atlantis lands in a few worlds, and how long the search takes
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; const seeds = (process.env.SEEDS || 'look-3').split(',');
  await h.newGame(seeds[0]); await h.calm();
  const r = await ev(() => { const t0 = performance.now(); const a = Village.atlantis(); const dt = performance.now() - t0; const p = G.player; const w = G.world; if (!a) return { none: true, dt };
    const hs = []; for (let dx = -44; dx <= 44; dx += 11) for (let dz = -44; dz <= 44; dz += 11) if (Math.hypot(dx, dz) <= 44) hs.push(w.colInfo(a.x + dx, a.z + dz).h);
    return { id: a.id, x: a.x, z: a.z, y: a.y, dist: Math.round(a.dist), spawn: [Math.round(w.spawn.x), Math.round(w.spawn.z)], seabed: [Math.min(...hs), Math.max(...hs)], SEA, dt: Math.round(dt), planned: Village.markers(p.x, p.z, 12).filter(m => m.kind === 'village').map(m => [m.name, m.type, Math.round(Math.hypot(m.x - p.x, m.z - p.z))]).sort((a, b) => a[2] - b[2]).slice(0, 18) }; });
  console.log(seeds[0], JSON.stringify(r)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
