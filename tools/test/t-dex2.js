const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1');
  const r = await h.ev(() => { const out = {}; for (const b of ['earth', 'moon', 'halo']) { const o = out[b] = { n: 0, line: 0, why: {} }; for (const sp of KIN.dex(b)) { o.n++; const L = KIN.lineOf(sp); if (L) o.line++; else { const k = sp.shape + ' r' + (sp.rarity || 0) + (sp.home ? '' : ' nohome'); o.why[k] = (o.why[k] || 0) + 1; } } } const s = KIN.dex('earth').find(x => !KIN.lineOf(x)); return { out, sample: s && { shape: s.shape, elem: s.elem, rarity: s.rarity, steed: s.steed, fast: s.fast, tame: s.tame, names: s.names, recipe: !!s.recipe, gen: s.gen } }; });
  console.log(JSON.stringify(r)); await h.close(); })();
