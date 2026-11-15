const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  const r = await ev(() => { const p = G.player; const ms = Village.markers(p.x, p.z, 12).filter(m => m.kind === 'village'); const towns = Village.townList ? Village.townList() : null; return { n: ms.length, byType: ms.reduce((a, m) => { a[m.type] = (a[m.type] || 0) + 1; return a; }, {}), list: ms.map(m => [m.name, m.type, m.style, Math.round(Math.hypot(m.x - p.x, m.z - p.z))]).sort((a, b) => a[3] - b[3]), towns: towns ? towns.map(t => [t.name, t.size, t.type]).slice(0, 20) : null }; });
  console.log(JSON.stringify(r)); await h.close(); })();
