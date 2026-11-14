const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1');
  const r = await h.ev(() => { const rows = []; const count = (m) => { let n = 0; const mb = { }; const mesh = R.entityMesh('tri' + Math.random(), (b) => KIN.buildMesh(b, m)); for (const k of Object.keys(mesh)) { const v = mesh[k]; if (k === 'count' || k === 'n' || k === 'indexCount' || k === 'icount') n = v; } return { n, keys: Object.keys(mesh).join(',') }; };
    let keys = ''; for (const b of ['earth', 'moon', 'halo']) for (const sp of KIN.dex(b)) { if (!sp.home) continue; const st = KIN.maxStage(sp); const c = count(KIN.model(sp, st)); keys = c.keys; rows.push([b, KIN.nativeId(sp) || 'earth', sp.names[0], c.n]); }
    return { keys, rows }; });
  console.log(r.keys); const by = {}; for (const [b, id, nm, n] of r.rows) { const k = b; by[k] = by[k] || []; by[k].push(n); } for (const k in by) { const a = by[k].sort((x, y) => x - y); console.log(k, 'n', a.length, 'median', a[a.length >> 1], 'p90', a[Math.floor(a.length * 0.9)], 'max', a[a.length - 1]); }
  const top = r.rows.sort((a, b) => b[3] - a[3]).slice(0, 14); console.log(top.map(x => x.join(' ')).join('\n')); await h.close(); })();
