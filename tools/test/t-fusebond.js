const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('gal-1'); await h.calm();
  console.log(JSON.stringify(await ev(() => { const d = KIN.dex('earth').filter(s => !s.fusion && s.home); const a = KIN.create(d[3], 20), b = KIN.create(d[9], 18); a.bond = 0.4; b.bonded = true; b.bond = 1;
    const f = KIN.fuse([a, b], []); const c = KIN.create(d[4], 10), e = KIN.create(d[5], 12); c.bond = 0.6; const g = KIN.fuse([c, e], []);
    return { f: [f.bond, f.bonded], g: [g.bond, !!g.bonded], recipe: typeof KIN.fuseRecipe }; })));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
