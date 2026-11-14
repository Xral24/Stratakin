const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1'); await h.calm();
  const r = await h.ev(() => { const v = Village.townList()[0]; if (!v) return 'no town'; const rl = Village.layout(v).rail; if (!rl) return 'no rail'; const out = { town: v.id, y: v.y }; const base = rl.ax ? v.x : v.z; const res = [];
    for (const d of [0, 20, 40]) { const a = rl.along0 + rl.sgn * d; const x = rl.ax ? a : rl.line, z = rl.ax ? rl.line : a; res.push([d, G.world.getBlock(x, v.y, z), !!Village.railAt(x, v.y, z), !!Village.railAt(x, v.y - 1, z), !!Village.railAt(x + (rl.ax ? 0 : 3), v.y, z + (rl.ax ? 3 : 0)), !!Village.railAt(x, v.y + 2, z), JSON.stringify(G.protectedAt({ x, y: v.y, z, id: G.world.getBlock(x, v.y, z) }))]); }
    out.res = res; return out; });
  console.log(JSON.stringify(r)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
