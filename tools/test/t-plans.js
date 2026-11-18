const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-3', 0);
  console.log(await ev(() => { const out = [], seen = {}; for (const sp of KIN.dex('earth')) { const row = []; for (let st = 1; st <= 3; st++) { let f; try { f = KIN.formOf(sp, st); } catch (e) { continue; } if (!f || seen[f.plan]) continue; seen[f.plan] = 1; const m = KIN.model(sp, st); row.push(f.plan + (m.trick ? '*' : '') + '[' + m.bones.map((b, i) => b ? b.kind[0] + (i) : '').filter(Boolean).join('') + ']'); } if (row.length) out.push(sp.names[0] + ': ' + row.join(' ')); } return out.join('\n'); }));
  await h.close(); })();
