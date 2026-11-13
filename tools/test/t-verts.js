const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { ev } = h; await h.newGame('vt-1'); await h.calm();
  const res = await ev(() => { const L = KIN.LINES, out = [];
    const fams = { land: 'quadruped', biped: 'biped', bird: 'bird', serpent: 'serpent', floater: 'floater', water: 'fish', legend: 'quadruped' };
    for (const fam in fams) for (const el in L[fam]) { if (el === '_') continue; L[fam][el].forEach((line, li) => { const sp = KIN.species(U.combine(0x77, li, el.length), [el], 1, { primary: el, shape: fams[fam], total: 360, rarity: fam === 'legend' ? 4 : 1 }); sp._line = line;
      for (let st = 1; st <= line.length; st++) { const m = KIN.model(sp, st); let v = 0; const mb = { verts: 0 }; const fake = { pos: [], push() {} };
        let count = 0; try { const arr = []; const b = R.entityMesh('vt:' + fam + el + li + st + Math.random(), (mb2) => KIN.buildMesh(mb2, m)); count = b && (b.count || b.n || b.vertCount || 0); } catch (e) { count = -1; }
        out.push([fam, el, line[st - 1][1], m.boxes.length, count]); } }); }
    return out; });
  res.sort((a, b) => b[3] - a[3]); console.log(res.slice(0, 25).map(r => r.join(' ')).join('\n')); console.log('median parts', res[Math.floor(res.length / 2)][3], 'count', res.length);
  await h.close(); })();
