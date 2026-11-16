const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-3'); await h.calm();
  const r = await ev(() => { R.render = () => {}; const p = G.player, w = G.world, out = []; const ts = Village.townList().slice(0, 5);
    for (const t of ts) { p.x = t.x + 0.5; p.z = t.z + 12; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 99999); for (let k = 0; k < 4; k++) Village.update(0.05, p, false); const a = Village.active, b = a && a.boss; out.push(b ? [a.name, KIN.name(b.kin), b.kin.sp.tyrMood, b.persona.hail.slice(0, 46)] : [a && a.name, 'no boss']); }
    // beat the first, then look at the next village held by the same one
    const first = ts[0]; p.x = first.x + 0.5; p.z = first.z + 12; for (let k = 0; k < 4; k++) Village.update(0.05, p, false); Village.freed(Village.active.id); out.push(['met', JSON.stringify(G.stats.tyrantMet)]);
    return out; });
  for (const l of r) console.log(JSON.stringify(l)); console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
