const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-3'); await h.calm();
  const r = await ev(() => { R.render = () => {}; const p = G.player, out = {}; G.stats.buddyOff = false; for (let i = 0; i < 30; i++) Buddy.update(0.05, p); const e = Buddy.current(); if (!e) return { none: true }; Anim.pose(e, performance.now()); out.h0 = +e.hover.toFixed(2);
    p.sneak = true; for (let i = 0; i < 40; i++) { Buddy.update(0.05, p); Anim.pose(e, performance.now()); } out.crouch = e._an && +e._an.crouch.toFixed(2); out.hover = +e.hover.toFixed(2); out.face = e.face && +e.face.lid.toFixed(2);
    p.sneak = false; for (let i = 0; i < 40; i++) { Buddy.update(0.05, p); } out.after = e._an && +e._an.crouch.toFixed(2);
    // a wild one growing suspicious
    const w = Wild.list.find(q => !q.isBoss && !q.sleep); out.wild = !!w; return out; });
  console.log(JSON.stringify(r), 'ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
