const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-3', 0); await h.calm(); await ev(() => { R.render = () => {}; });
  for (const wid of ['moon', 'halo']) console.log(wid, JSON.stringify(await ev((wid) => { G.travel(wid); const w = G.world, p = G.player; let hearts = 0, cells = 0; const c0x = Math.floor(p.x / 14), c0z = Math.floor(p.z / 14); for (let a = -12; a <= 12; a++) for (let b = -12; b <= 12; b++) { const cx = (c0x + a * 7) - U.mod(c0x + a * 7, 7) + 3, cz = (c0z + b * 7) - U.mod(c0z + b * 7, 7) + 3; cells++; if (Gems._make(w, cx, cz).some(g => g.kind === 'heart')) hearts++; } return { cells, hearts }; }, wid)));
  await h.close(); })();
