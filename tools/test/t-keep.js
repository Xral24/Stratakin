const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-3'); await h.calm();
  const r = await ev(() => { R.render = () => {}; const w = G.world, L = w.lost, T = w.lostTunnel(), p = G.player; const out = {};
    out.centre = w.lostKeep(L.x, L.z); out.rim = w.lostKeep(L.x + 140, L.z); out.tunnel = w.lostKeep(Math.floor(T.ax + T.ix * 20), Math.floor(T.az + T.iz * 20)); out.landing = w.lostKeep(Math.floor(T.ax - T.ix * 4), Math.floor(T.az - T.iz * 4)); out.far = w.lostKeep(L.x + 260, L.z + 100); out.start = w.lostKeep(Math.floor(p.x), Math.floor(p.z));
    // stand in the tunnel and try to mine the floor
    const k = T.pa + 6; p.x = T.ax + T.ix * k; p.z = T.az + T.iz * k; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 2, 99999); p.y = Math.round(T.ya + (T.yb - T.ya) * k / T.len) + 1.05; p.pitch = -1.2; const bx = Math.floor(p.x), bz = Math.floor(p.z), by = Math.floor(p.y) - 1, before = w.getBlock(bx, by, bz); for (let i = 0; i < 600; i++) p.mineTick(0.05); out.floorKept = w.getBlock(bx, by, bz) === before; return out; });
  console.log(JSON.stringify(r), 'ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
