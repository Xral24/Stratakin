const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1');
  const r = await h.ev(() => { const all = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && (sp.rarity || 0) <= 3 && !sp.dino); const o = {}; for (const sp of all) { const e = KIN.dominant(sp.elem, 1)[0]; const k = KIN.create(sp, 20); const s = KIN.stats(k); o[e] = o[e] || { n: 0, hp: 0, atk: 0, pow: 0, spd: 0, agi: 0, layers: {} }; const q = o[e]; q.n++; for (const f of ['hp', 'atk', 'pow', 'spd', 'agi']) q[f] += s[f]; q.layers[sp.home.layer] = (q.layers[sp.home.layer] || 0) + 1; } for (const e in o) for (const f of ['hp', 'atk', 'pow', 'spd', 'agi']) o[e][f] = Math.round(o[e][f] / o[e].n); return o; });
  console.log(JSON.stringify(r)); await h.close(); })();
