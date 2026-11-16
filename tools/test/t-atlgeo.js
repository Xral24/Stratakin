// every chunk of Atlantis, built in full detail: is any triangle far bigger than anything in the city should be, or outside its own chunk by a long way
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  await ev(() => { R.render = () => {}; });
  const r = await ev(() => { const a = Village.atlantis(), p = G.player, w = G.world; p.x = a.x + 0.5; p.z = a.z + 16.5; p.y = a.y + 0.05; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 99999); for (let k = 0; k < 3; k++) Village.update(0.05, p, false);
    const out = [], F = a.y; let n = 0, tris = 0;
    for (const c of w.chunks.values()) { const dx = c.cx * CH + 8 - a.x, dz = c.cz * CH + 8 - a.z; if (Math.hypot(dx, dz) > a.RH + 12) continue; for (const lod of [0, 1]) { c.wantLod = lod; R.buildChunk(w, c); const s = R.scratch, P = s.pos, I = s.idx; n++; if (!lod) tris += s.ni / 3;
        let bad = 0, worst = 0, ex = null; for (let i = 0; i < s.ni; i += 3) { let mx = 0; const v = [I[i], I[i + 1], I[i + 2]]; for (let k = 0; k < 3; k++) { const p0 = v[k] * 3, p1 = v[(k + 1) % 3] * 3; const e = Math.hypot(P[p0] - P[p1], P[p0 + 1] - P[p1 + 1], P[p0 + 2] - P[p1 + 2]); if (e > mx) mx = e; const x = P[p0], y = P[p0 + 1], z = P[p0 + 2]; if (!(x > -9 && x < 25 && z > -9 && z < 25) || !(y > 0 && y < 130) || x !== x) { mx = 999; } }
          if (mx > 13) { bad++; if (mx > worst) { worst = mx; ex = { mat: s.mat[v[0]], p: v.map(q => [P[q * 3], P[q * 3 + 1] - F, P[q * 3 + 2]].map(t => +t.toFixed(2))) }; } } }
        if (bad) out.push({ c: c.cx + ',' + c.cz, off: [Math.round(dx), Math.round(dz)], lod, bad, worst: +worst.toFixed(1), ex }); } c.wantLod = 0; }
    return { chunks: n, tris: Math.round(tris), out: out.slice(0, 14), nOut: out.length }; });
  console.log(JSON.stringify(r, null, 0)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 4).join('\n') : 'none'); await h.close(); })();
