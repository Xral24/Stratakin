const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const out = await ev(async () => { R.render = () => {}; const st = (G.stats.ruins = G.stats.ruins || {}), p = G.player, cx = Math.floor(p.x / 80), cz = Math.floor(p.z / 80); const log = [];
    for (let i = 0; i < 15; i++) { const key = cx + ',' + cz; st[key] = { x: Math.floor(p.x) + 2, y: Math.floor(p.y), z: Math.floor(p.z) + i, l: 3, g: null, b: 0, c: [] }; Ruins.read(st[key].x, st[key].y, st[key].z); const t = document.getElementById('dialogue').textContent; for (let k = 0; k < 8 && Dialogue.active(); k++) { document.getElementById('dialogue').click(); await new Promise(r => setTimeout(r, 60)); } log.push(st[key].l); if (i === 0 || i === 13) log.push(t.slice(14, 70)); }
    return { log, n: Object.keys(G.stats.stonesRead).length, done: G.stats.stonesDone, seal: G.player.count('seal'), pin: G.pin }; });
  console.log(JSON.stringify(out)); console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
