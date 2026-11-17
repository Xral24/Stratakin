// Ruins. Somebody was here before the villages: broken walls, lone columns, a roofless hall now and then, all in mossed stone, scattered
// across the Earth. Each has one standing stone with a line cut into it that you can read, and some hide a relic gem. They are stamped
// into the world the first time you come near, and remembered.
const Ruins = (() => {
  let G = null, tick = 0; const CELL = 80;
  /* what the stones say. Read together they tell it: a people who wove the first hush, raised the arches, and lost their city to the sea */
  const LINES = [
    'WE DID NOT TAME THEM. WE ASKED, AND SOME STAYED.',
    'THE WEAVERS OF THE HUSH KEPT THEIR LOOMS HERE. A QUIET KIN CHOOSES. REMEMBER THAT WHEN YOU ARE STRONG.',
    'THREE ARCHES WE RAISED. ONE TO THE GREY MOON, ONE TO THE RING, ONE WE SEALED AND WILL NOT NAME.',
    'THE CITY OF GLASS WENT UNDER IN A NIGHT. ITS LAMPS STILL BURN BELOW. THE SEA KEEPS WHAT IT IS GIVEN.',
    'OUR ENGINES DREW ON THE CORE. THE CORE DREW BACK. BUILD NOTHING THAT CANNOT BE PUT DOWN.',
    'HERE THE ROAD RAN TO THE WALLED VALLEY, WHERE THE OLD ONES STILL WALK. WE CLOSED IT. THEY WERE THERE FIRST.',
    'A KIN GROWS AS IT IS TREATED. WE LEARNED THIS LATE.',
    'TWO OF A KIND, AND A STONE OF THEIR ELEMENT, AND PATIENCE. THE TABLE ONLY FINISHES WHAT THE BOND BEGINS.',
    'HE WHO PENS A KIN PENS HIMSELF. THE FIRST TYRANT IS BURIED UNDER THIS STONE. NOBODY CAME.',
    'WE COUNTED OUR WEALTH IN SHARDS OF THE FALLEN STAR. THE STAR IS STILL FALLING. LOOK UP.',
    'WHEN THE WATER ROSE WE CARRIED THE YOUNG ONES TO THE HILLS. THE KIN CARRIED US.',
    'THE DEEP FOLK WERE OUR COUSINS. THEY CHOSE THE SEA BEFORE IT CHOSE THEM.',
    'SOMETHING SLEEPS AT THE HEART OF THE WORLD. IT IS NOT ANGRY. DO NOT MAKE IT SO.',
    'IF YOU CAN READ THIS YOU ARE ONE OF OURS, OR ONE OF THEIRS. EITHER WAY, WELCOME HOME.',
  ];
  function init(game) { G = game; tick = 0; }
  const store = () => (G.stats.ruins = G.stats.ruins || {});
  const H = (cx, cz, k) => U.hash3(cx, k, cz, G.world.seed + 7717);
  function ground(x, z, y0) { const w = G.world; let g = w.groundY(x, z, y0 + 12); while (g > 2 && (isLeaf(w.getBlock(x, g, z)) || w.getBlock(x, g, z) === B.LOG || w.getBlock(x, g, z) === B.BIRCHLOG)) g--; return g; }
  function plan(cx, cz) { const r = H(cx, cz, 1); if (r > 0.6) return null; return { big: r < 0.07, x: cx * CELL + 12 + Math.floor(H(cx, cz, 2) * (CELL - 24)), z: cz * CELL + 12 + Math.floor(H(cx, cz, 3) * (CELL - 24)), shape: Math.floor(H(cx, cz, 4) * 4), line: Math.floor(H(cx, cz, 5) * LINES.length), rot: Math.floor(H(cx, cz, 6) * 4), gem: r < 0.07 || H(cx, cz, 7) < 0.22 }; }
  function stamp(cx, cz, pl) { const w = G.world, info = w.colInfo(U.mod(pl.x, WORLD_W), U.mod(pl.z, WORLD_W)); if (info.lost || info.lostRim || info.beach || info.h <= SEA + 1 || info.h > 74) return 0;
    if (![BIOME.FOREST, BIOME.PLAINS, BIOME.SNOW, BIOME.SWAMP, BIOME.DESERT, BIOME.MOUNTAIN].includes(info.biome)) return 0;
    if (Village.markers(pl.x, pl.z, 2).some(m => Math.hypot(m.x - pl.x, m.z - pl.z) < 76)) return 0; if (G.camp && Math.hypot(G.camp.x - pl.x, G.camp.z - pl.z) < 36) return 0;
    const R0 = pl.big ? 6 : 3, g0 = ground(pl.x, pl.z, info.h); let lo = g0, hi = g0; for (let a = -R0; a <= R0; a += R0) for (let b = -R0; b <= R0; b += R0) { const g = ground(pl.x + a, pl.z + b, info.h); lo = Math.min(lo, g); hi = Math.max(hi, g); if (w.getBlock(pl.x + a, g + 1, pl.z + b) === B.WATER) return 0; } if (hi - lo > (pl.big ? 2 : 2)) return 0;
    const rot = (a, b) => pl.rot === 0 ? [a, b] : pl.rot === 1 ? [-b, a] : pl.rot === 2 ? [-a, -b] : [b, -a], hs = (a, b, k) => U.hash3(pl.x + a, k, pl.z + b, w.seed + 7719);
    const cols = [];
    const col = (a, b, n, top) => { const [dx, dz] = rot(a, b), X = pl.x + dx, Z = pl.z + dz, g = ground(X, Z, info.h); for (let y = g + 1; y <= g + 9; y++) { const bb = w.getBlock(X, y, Z); if (isLeaf(bb)) w.setBlock(X, y, Z, B.AIR); } for (let i = 1; i <= n; i++) w.setBlock(X, g + i, Z, B.MEGA); cols.push([X, g, Z, n]); return [X, g, Z]; }; /* every upright is a standing stone, drawn as one worn rock: nothing here is a cube */
    const floor = () => {}; /* no paving: set into soft ground it showed as a square hole */
    let stone = null, gem = null;
    if (pl.big) { /* a roofless hall: the walls stand shoulder high in places and are gone in others, four columns down the middle, the stone at the far end */
      for (let a = -5; a <= 5; a++) for (let b = -4; b <= 4; b++) { const edge = Math.abs(a) === 5 || Math.abs(b) === 4; if (edge) { if (a === -5 && Math.abs(b) <= 1) continue; const n = Math.floor(hs(a, b, 1) * 4.4); if (n > 0) col(a, b, n); } else if (hs(a, b, 2) < 0.6) floor(a, b); }
      for (const [a, b] of [[-2, -2], [-2, 2], [2, -2], [2, 2]]) col(a, b, 2 + Math.floor(hs(a, b, 3) * 3));
      stone = col(4, 0, 3); { const [dx, dz] = rot(4, -3); gem = [pl.x + dx, pl.z + dz]; }
    } else if (pl.shape === 0) { /* the corner of something: two walls meeting, stepping down as they run out */
      for (let i = 0; i <= 3; i++) { col(i, 0, Math.max(1, 3 - i)); if (i) col(0, i, Math.max(1, 3 - i - (hs(0, i, 1) < 0.4 ? 1 : 0))); } floor(1, 1); floor(2, 1); floor(1, 2); stone = col(2, 2, 3); { const [dx, dz] = rot(1, 1); gem = [pl.x + dx, pl.z + dz]; }
    } else if (pl.shape === 1) { /* a row of columns, one down */
      for (let i = -2; i <= 2; i += 2) col(i, 0, 2 + Math.floor(hs(i, 0, 1) * 3)); col(3, 1, 1); col(4, 1, 1); col(5, 1, 1); stone = col(0, 2, 3); { const [dx, dz] = rot(-2, 1); gem = [pl.x + dx, pl.z + dz]; }
    } else if (pl.shape === 2) { /* a doorway with nothing either side of it */
      col(-1, 0, 4); col(1, 0, 4); { const [dx, dz] = rot(0, 0), X = pl.x + dx, Z = pl.z + dz, g = ground(X, Z, info.h); w.setBlock(X, g + 4, Z, B.MEGA); } col(-2, 0, 2); col(2, 0, 1); floor(0, 1); floor(0, -1); stone = col(2, 2, 3); { const [dx, dz] = rot(0, -2); gem = [pl.x + dx, pl.z + dz]; }
    } else { /* a paved ring, half gone, the stone in the middle */
      for (let k = 0; k < 12; k++) { const a = Math.round(Math.cos(k * 0.5236) * 3), b = Math.round(Math.sin(k * 0.5236) * 3); if (hs(a, b, 1) < 0.7) floor(a, b); if (k % 3 === 0 && hs(a, b, 2) < 0.75) col(a, b, 1 + Math.floor(hs(a, b, 3) * 2)); } stone = col(0, 0, 3); { const [dx, dz] = rot(1, -1); gem = [pl.x + dx, pl.z + dz]; } }
    return { x: stone[0], y: stone[1] + 1, z: stone[2], l: pl.line, g: pl.gem ? gem : null, b: pl.big ? 1 : 0, c: cols, d: info.biome === BIOME.DESERT ? 1 : info.biome === BIOME.SNOW ? 2 : 0 }; }
  function update(dt, p) { if (!G || G.worldId !== 'earth') return; tick -= dt; if (tick > 0) return; tick = 0.7; const st = store(), cx0 = Math.floor(p.x / CELL), cz0 = Math.floor(p.z / CELL);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const cx = cx0 + a, cz = cz0 + b, key = cx + ',' + cz; if (st[key] !== undefined) continue; const pl = plan(cx, cz); if (!pl) { st[key] = 0; continue; } const d = Math.hypot(pl.x - p.x, pl.z - p.z); if (d > 58 || d < 22) continue; /* built while it is still out of sight in the trees, never under your nose */ st[key] = stamp(cx, cz, pl) || 0; } }
  function near(fn) { const st = store(), p = G.player, cx0 = Math.floor(p.x / CELL), cz0 = Math.floor(p.z / CELL); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const r = st[(cx0 + a) + ',' + (cz0 + b)]; if (r && fn(r, (cx0 + a) + ',' + (cz0 + b))) return r; } return null; }
  const stoneAt = (x, y, z) => !!(G && G.worldId === 'earth' && near(r => r.x === x && r.z === z && y >= r.y && y <= r.y + 2));
  function read(x, y, z) { if (!stoneAt(x, y, z)) return false; const r = near(q => q.x === x && q.z === z), seen = (G.stats.stonesRead = G.stats.stonesRead || {}), fresh = !seen[r.l]; seen[r.l] = 1; const n = Object.keys(seen).length;
    Dialogue.show('Engraved stone', ['The letters are worn nearly flat. You trace them with a finger.', LINES[r.l]], () => { UI.toast(fresh ? `A new engraving. You have read ${n} of ${LINES.length}.` : `You have read this one before. ${n} of ${LINES.length} found.`, fresh ? 'good' : undefined); if (fresh) { UI.sfx('gift'); G.addXp && G.addXp(8); } }); return true; }
  function gems() { const out = []; if (!G || G.worldId !== 'earth') return out; near((r, key) => { if (r.g) { if (!r._gem) r._gem = { id: 'earth:ruin:' + key, kind: 'relic', x: r.g[0] + 0.5, z: r.g[1] + 0.5, hx: r.g[0] + 0.5, hz: r.g[1] + 0.5, y: null, ph: 1.3 }; out.push(r._gem); } return false; }); return out; }
  /* the stones themselves. The blocks under them are only there to be walked into: what you see is a worn pillar of rounded drums, mossed on top, each a little off true. The engraved one is a slab with lines cut across its face */
  const TINT = [[[0.56, 0.54, 0.5], [0.38, 0.5, 0.3]], [[0.78, 0.66, 0.46], [0.7, 0.56, 0.36]], [[0.6, 0.62, 0.66], [0.92, 0.95, 0.98]]];
  function pillar(n, v, d) { return R.entityMesh('ruin:' + n + ':' + v + ':' + d, (mb) => { const [st, cap] = TINT[d]; for (let i = 0; i < n; i++) { const ox = Math.sin(i * 2.1 + v) * 0.06, oz = Math.cos(i * 1.7 + v * 2) * 0.06, w = 0.44 - (i === n - 1 ? 0.07 : 0) - (i % 2) * 0.03, k = 0.92 + ((i + v) % 3) * 0.05; mb.blob(-w + ox, i - 0.05, -w + oz, w + ox, i + 1.04, w + oz, 0.5, [st[0] * k, st[1] * k, st[2] * k], { n: 3 }); }
      if (v !== 1) mb.blob(-0.36, n - 0.12, -0.36, 0.3, n + 0.16, 0.34, 1, cap, { n: 3 }); if (v === 2 && n > 1) mb.blob(0.2, 0.9, -0.5, 0.52, 1.5, -0.1, 1, cap, { n: 2 }); }); }
  function slab(d) { return R.entityMesh('ruin:slab:' + d, (mb) => { const [st, cap] = TINT[d], dk = [st[0] * 0.55, st[1] * 0.55, st[2] * 0.55]; mb.blob(-0.48, -0.05, -0.24, 0.48, 2.7, 0.24, 0.45, st, { n: 3 }); mb.blob(-0.4, 2.5, -0.26, 0.34, 2.82, 0.26, 1, cap, { n: 3 }); for (let i = 0; i < 4; i++) for (const sg of [-1, 1]) mb.blob(-0.3 + (i % 2) * 0.05, 1.0 + i * 0.32, sg * 0.235, 0.3 - (i % 3) * 0.07, 1.07 + i * 0.32, sg * 0.262, 0.4, dk, { n: 2 }); }); }
  function entities() { const out = []; if (!G || G.worldId !== 'earth') return out; near((r) => { if (r.c) for (let i = 0; i < r.c.length; i++) { const c = r.c[i], isStone = c[0] === r.x && c[2] === r.z; out.push({ x: c[0] + 0.5, y: c[1] + 1, z: c[2] + 0.5, yaw: isStone ? 0 : (c[0] * 7 + c[2] * 13) % 6, scale: 1, hover: 0, skyMul: 1, isStatue: true, mesh: isStone ? slab(r.d || 0) : pillar(c[3], Math.abs(c[0] * 3 + c[2]) % 3, r.d || 0) }); } return false; }); return out; }
  return { init, update, stoneAt, read, gems, entities, LINES, plan };
})();
