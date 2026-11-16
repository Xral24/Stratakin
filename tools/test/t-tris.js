// how many triangles stand round you: at the start, at a few places on Earth, and in the Lost World with and without its trees and ferns
const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.paused = true; G.player.frozen = true; });
  const count = () => ev(() => { const w = G.world, p = G.player; let tris = 0, n = 0, near = 0; const by = {}; for (const c of w.chunks.values()) if (c.mesh) { const d = Math.hypot(c.cx * 16 + 8 - p.x, c.cz * 16 + 8 - p.z); if (d < 70) { n++; for (const k of ['op', 'wa', 'gs']) if (c.mesh[k]) { const t = (c.mesh[k].count || c.mesh[k].n || 0) / 3; tris += t; by[k] = (by[k] || 0) + t; if (d < 26) near += t; } } }
    return { tris: Math.round(tris), chunks: n, near: Math.round(near), by: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round(v)])) }; });
  const go = (x, z) => ev((a) => { const p = G.player, w = G.world; p.x = a[0] + 0.5; p.z = a[1] + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 5, 99999); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z), 90) + 1.2; G.meshPass(9999); const ci = w.colInfo(Math.floor(p.x), Math.floor(p.z)); return { biome: Object.keys(BIOME).find(k => BIOME[k] === ci.biome), h: ci.h }; }, [x, z]);
  const p0 = await ev(() => [Math.floor(G.player.x), Math.floor(G.player.z)]);
  console.log('start', JSON.stringify(await go(p0[0], p0[1])), JSON.stringify(await count()));
  const spots = await ev((p0) => { const w = G.world, out = {}; for (let r = 60; r < 1500; r += 40) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, x = Math.round(p0[0] + Math.cos(a) * r), z = Math.round(p0[1] + Math.sin(a) * r), ci = w.colInfo(x, z), nm = Object.keys(BIOME).find(q => BIOME[q] === ci.biome); if (ci.h > SEA + 2 && !out[nm]) out[nm] = [x, z]; } return out; }, p0);
  for (const [nm, at] of Object.entries(spots)) console.log(nm, JSON.stringify(await go(at[0], at[1])), JSON.stringify(await count()));
  const L = await ev(() => { const L = G.world.lost; return L ? [L.x, L.z] : null; }); if (!L) { console.log('no lost world'); await h.close(); return; }
  console.log('LOST', JSON.stringify(await go(L[0] + 60, L[1])), JSON.stringify(await count()));
  await ev(() => { for (const c of G.world.chunks.values()) { c._jt = c.jtrees; c.jtrees = null; c.dirty = true; } G.meshPass(9999); }); console.log('LOST no trees', JSON.stringify(await count()));
  await ev(() => { for (const c of G.world.chunks.values()) { for (let i = 0; i < c.blocks.length; i++) if (c.blocks[i] === B.FERN) c.blocks[i] = B.AIR; c.dirty = true; } G.meshPass(9999); }); console.log('LOST no trees, no ferns', JSON.stringify(await count()));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 4).join('\n') : 'none'); await h.close(); })();
