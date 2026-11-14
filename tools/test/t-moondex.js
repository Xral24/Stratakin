const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1');
  const r = await h.ev((body) => { const d = KIN.dex(body); const by = {}, combos = {}; let nat = 0, der = 0, other = 0; const names = [];
    for (const sp of d) { const id = KIN.nativeId(sp); const L = KIN.lineOf(sp); if (id) { nat++; by[id] = (by[id] || 0) + 1; const k = id + '|' + KIN.dominant(sp.elem, 1)[0]; combos[k] = (combos[k] || 0) + 1; } else if (L) der++; else other++; if (names.length < 26) names.push(sp.names.join('/')); }
    const errs = []; for (const sp of d) for (let st = 1; st <= 3; st++) { try { KIN.model(sp, st); } catch (e) { errs.push(sp.names[0] + ' ' + st + ' ' + e.message); } }
    return { total: d.length, nat, der, other, by, combos: Object.keys(combos).length, maxDup: Math.max(...Object.values(combos)), names, errs: errs.slice(0, 5), nerr: errs.length }; }, process.env.BODY || 'moon');
  console.log(JSON.stringify(r, null, 1)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
