const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1'); 
  const r = await h.ev(() => { const out = {}; let n = 0; for (const b of ['earth','moon','halo']) for (const sp of KIN.dex(b)) { n++; const L = KIN.lineOf ? KIN.lineOf(sp) : null; const key = L ? L.map(f => f[1]).join('>') + '|' + sp.elem[0] : 'none:' + sp.shape; out[key] = (out[key] || 0) + 1; } const v = Object.values(out); return { n, lines: v.length, max: Math.max(...v), none: Object.keys(out).filter(k => k.startsWith('none')), hist: v.reduce((a, x) => (a[x] = (a[x] || 0) + 1, a), {}) }; });
  console.log(JSON.stringify(r)); await h.close(); })();
