const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('gal-1'); await h.calm();
  console.log(JSON.stringify(await ev(() => { const d = KIN.dex('earth').filter(s => !s.fusion && s.home && KIN.capOf(s) > 40);
    const mk = (b, bonded) => { const k = KIN.create(d[3], 20); k.iv = { hp: 1, atk: 1, pow: 1, spd: 1, agi: 1 }; k.bond = b; k.bonded = bonded; return k; };
    const out = {}; for (const [n, ks] of [['both bonded', [mk(1, true), mk(1, true)]], ['half', [mk(0.5), mk(0.5)]], ['none', [mk(0), mk(0)]]]) { const f = KIN.fuse(ks, []); out[n] = [f.level, f.bond, !!f.bonded, f.fusedBond, KIN.stats(f).atk]; } return out; })));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
