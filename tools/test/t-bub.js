const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const r = await ev(() => { const v = Village.active, L = Village.layout(v), rl = L.rail, p = G.player, w = G.world; const W = (al, pp) => rl.ax ? [al, rl.line + 0.5 + pp] : [rl.line + 0.5 + pp, al]; const [x, z] = W(rl.along0 + 0.5, 3); p.x = x; p.z = z; p.y = rl.y + 0.05;
    G.addRoost({ id: v.id, name: v.name, x: p.x, y: v.y, z: p.z, world: w.preset.id }); const ok = Village.trainFilm(v); for (let i = 0; i < 60; i++) Village.update(0.05, p, false);
    const els = [...document.body.children].filter(e => e.style && e.style.position === 'fixed' && /whistle|line is open/.test(e.textContent)); return { ok, bubbles: els.map(e => [e.textContent, e.style.left, e.style.top, e.style.display]) }; });
  console.log(JSON.stringify(r)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 2).join('\n') : 'none'); await h.close(); })();
