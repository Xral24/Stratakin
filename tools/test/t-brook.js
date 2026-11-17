const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame(process.env.SEED || 'Stratakin', -1);
  console.log(process.env.SEED, JSON.stringify(await ev(() => { R.render = () => {}; const b = G.stats.first.brook, c = G.camp, v = G.village; return { brook: b && [Math.round(b.x - c.x), Math.round(b.z - c.z)], campToVillage: Math.round(Math.hypot(c.x - v.x, c.z - v.z)), y: c.y }; })), h.errors[0] || '');
  await h.close(); })();
