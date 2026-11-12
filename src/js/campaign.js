// The Earth campaign: the people who hand you your tools. Every piece of gear comes from someone, after a job, in order.
//  - the Mining Camp: Foreman Garrick and his crew; a stone pick, then an iron pick, later the Lava Suit
//  - Old Brannock's shore: the rod and bait, and a water egg after your first fish
//  - Marisol's pier: the Breathing Bulb, then a dive for her sunken chest
//  - Hale's Ranch: build the paddock, ride out Thunderhoof, and riding is yours
//  - the snow camp: Ysolde's brother is lost in the snow; bring him home for a Frost Cloak
//  - the hermit's peak: a glider, and an egg on a pillar you can only reach by gliding
const Campaign = (() => {
  let G, world;
  const wd = (d) => d - Math.round(d / WORLD_W) * WORLD_W;
  const C = () => { if (!G.stats.camp) G.stats.camp = {}; return G.stats.camp; };
  const people = []; let rogue = null; let tick = 0;
  function init(game) { G = game; world = game.world; people.length = 0; rogue = null; }
  const onEarth = () => world.preset.id === 'earth';

  // ---------- gear that only people give ----------
  const QUEST_GEAR = { shovel: 'village', hatchet: 'village', axe_iron: 'pick', pick_stone: 'pick', pick_iron: 'pick', rod: 'rod', bulb: 'bulb', glider: 'glider', frostcloak: 'frost', lavasuit: 'lava', spacesuit: 'ship', wings: 'halojobs' };
  function locked(item) { const k = QUEST_GEAR[item]; if (!k) return false; if (k === 'never') return true; return !C()['got_' + item] && !G.player.has(item); }
  function give(item, n = 1) { G.player.add(item, n); C()['got_' + item] = true; UI.sfx('caught'); UI.openPanel('reveal', { kind: 'item', item, n }); }

  // ---------- finding the sites, once, and remembering them ----------
  const land = (x, z) => { const i = world.colInfo(x, z); return i.h > SEA + 2 && i.h < 78 && !i.lost; };
  function ring(r0, r1, test, salt) {
    const s = world.spawn; const r = U.rng(U.combine(world.seed, salt));
    for (let rr = r0; rr <= r1; rr += 12) { const a0 = r() * Math.PI * 2; for (let k = 0; k < 24; k++) { const a = a0 + k / 24 * Math.PI * 2; const x = Math.round(s.x + Math.cos(a) * rr), z = Math.round(s.z + Math.sin(a) * rr); const v = test(x, z); if (v) return v === true ? { x, z } : v; } }
    return null;
  }
  const flat = (x, z, r) => { let lo = 999, hi = -1; for (let dx = -r; dx <= r; dx += 2) for (let dz = -r; dz <= r; dz += 2) { if (!land(x + dx, z + dz)) return false; const h = world.colInfo(x + dx, z + dz).h; lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo <= 3; };
  const awayFromVillage = (x, z) => !G.village || Math.hypot(x - G.village.x, z - G.village.z) > 45;
  function sites() {
    const c = C(); if (c.sites && c.sites.v === 3) return c.sites;
    const S = Object.assign({}, c.sites || {}, { v: 3 }); if (c.sites && c.sites.mine) { const old = c.sites; Object.assign(S, old, { v: 3 }); c.sites = S; if (!S.zoo) { /* add the new places to an older save */ } }
    if (S.mine && S.zoo && S.fort) return S;
    S.mine = S.mine || ring(80, 220, (x, z) => flat(x, z, 6) && awayFromVillage(x, z), 0x31) || { x: Math.round(world.spawn.x + 90), z: Math.round(world.spawn.z) };
    S.diver = S.diver || ring(60, 500, (x, z) => { // a shore with deep water a little way out
      if (!land(x, z) || !awayFromVillage(x, z)) return false;
      for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let ok = true; for (let t = 4; t <= 13 && ok; t++) if (world.colInfo(x + ux * t, z + uz * t).h > SEA - 4) ok = false; if (ok && world.colInfo(x + ux * 2, z + uz * 2).h < SEA + 2) return { x, z, ux, uz }; }
      return false; }, 0x32);
    if (!S.diver) { const f = ring(120, 400, (x, z) => flat(x, z, 10) && awayFromVillage(x, z) && Math.hypot(x - S.mine.x, z - S.mine.z) > 50, 0x3A); if (f) S.diver = { x: f.x - 9, z: f.z, ux: 1, uz: 0, lake: { x: f.x + 3, z: f.z } }; }
    S.ranch = S.ranch || ring(140, 360, (x, z) => flat(x, z, 9) && awayFromVillage(x, z) && Math.hypot(x - S.mine.x, z - S.mine.z) > 60 && world.colInfo(x, z).biome === BIOME.PLAINS, 0x33) || ring(140, 400, (x, z) => flat(x, z, 9) && awayFromVillage(x, z) && Math.hypot(x - S.mine.x, z - S.mine.z) > 60, 0x34);
    S.snow = S.snow || ring(150, 2000, (x, z) => world.colInfo(x, z).biome === BIOME.SNOW && flat(x, z, 3), 0x35);
    S.peak = S.peak || ring(150, 2000, (x, z) => { // a steep peak with room to glide out from it
      const i = world.colInfo(x, z); if (i.biome !== BIOME.MOUNTAIN || i.h < 76) return false;
      let best = { x, z, h: i.h }; for (let dx = -14; dx <= 14; dx += 2) for (let dz = -14; dz <= 14; dz += 2) { const h = world.colInfo(x + dx, z + dz).h; if (h > best.h) best = { x: x + dx, z: z + dz, h }; }
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const nx = Math.round(best.x + Math.cos(a) * 30), nz = Math.round(best.z + Math.sin(a) * 30); const nh = world.colInfo(nx, nz).h;
        if (nh < best.h - 16 && nh > SEA) { let clear = true; for (let t = 6; t < 27 && clear; t += 2) { const tx = Math.round(best.x + Math.cos(a) * t), tz = Math.round(best.z + Math.sin(a) * t); if (world.colInfo(tx, tz).h > best.h - 2 - t * 0.22) clear = false; } if (clear) return { x: best.x, z: best.z, h: best.h, nx, nz, top: best.h - 7 }; } }
      return false; }, 0x36);
    if (!S.peak) { const f = ring(260, 700, (x, z) => flat(x, z, 8) && awayFromVillage(x, z), 0x3B); if (f) { const h = world.colInfo(f.x, f.z).h; S.peak = { x: f.x, z: f.z, h: h + 30, nx: f.x + 30, nz: f.z, top: h + 22, crag: true }; } }
    S.fort = S.fort || ring(500, 1000, (x, z) => flat(x, z, 10) && flat(x + 30, z, 10) && flat(x + 60, z, 10) && awayFromVillage(x, z) && awayFromVillage(x + 40, z), 0x3F) || ring(400, 1200, (x, z) => land(x, z) && land(x + 40, z) && land(x + 76, z) && awayFromVillage(x, z), 0x40);
    S.zoo = S.zoo || ring(280, 700, (x, z) => flat(x, z, 9) && awayFromVillage(x, z) && [S.mine, S.ranch, S.diver].every(o => !o || Math.hypot(x - o.x, z - o.z) > 70), 0x3C);
    if (S.zoo && world.lost) { // the trapper's country: further out, the way the Lost World lies
      const a = Math.atan2(wd(world.lost.z - S.zoo.z), wd(world.lost.x - S.zoo.x));
      const pick = (d, off, salt) => ring(0, 0, () => false, salt) || (() => { for (let k = 0; k < 30; k++) { const aa = a + off + (k % 2 ? 1 : -1) * k * 0.05; const dd = d + k * 6; const x = Math.round(S.zoo.x + Math.cos(aa) * dd), z = Math.round(S.zoo.z + Math.sin(aa) * dd); if (land(x, z)) return { x, z }; } return { x: Math.round(S.zoo.x + Math.cos(a) * d), z: Math.round(S.zoo.z + Math.sin(a) * d) }; })();
      S.halfA = pick(260, 0.25, 0x3D); S.halfB = pick(330, -0.3, 0x3E); S.country = { x: Math.round((S.halfA.x + S.halfB.x) / 2), z: Math.round((S.halfA.z + S.halfB.z) / 2) };
    }
    c.sites = S; return S;
  }

  // ---------- people ----------
  function personModel(colors, decos) {
    const sp = { shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: false }, colors: Object.assign({ accent: '#c94c4c', dark: '#3a2a20', eye: '#222222' }, colors), size: 1, gen: 0, names: ['person'] };
    const m = KIN.model(sp, 2); for (const d of decos) KIN.decorate(m, d); return m;
  }
  function person(id, name, role, x, z, colors, decos, walk) {
    world.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 0, 99);
    const gy = world.groundY(Math.floor(x), Math.floor(z)) + 1; const m = personModel(colors, decos);
    const n = { id, name, role: 'camp', job: role, x: x + 0.5, y: gy, z: z + 0.5, yaw: 0, model: m, mesh: R.entityMesh('camp:' + id, (mb) => KIN.buildMesh(mb, m)), scale: 1, hover: 0, skyMul: 1, walk: walk || null, t: Math.random() * 10 };
    people.push(n); return n;
  }
  const near = (s, p, r) => s && Math.hypot(wd(s.x - p.x), wd(s.z - p.z)) < r;

  // ---------- stamping the places ----------
  const set = (x, y, z, b) => world.setBlock(x, y, z, b);
  function clearAbove(x, z, y0, h) { for (let y = y0; y <= y0 + h; y++) { const b = world.getBlock(x, y, z); if (b !== B.AIR) set(x, y, z, B.AIR); } }
  function pad(cx, cz, r, y0, mat) { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { for (let y = y0 - 3; y < y0; y++) if (!isSolid(world.getBlock(cx + dx, y, cz + dz))) set(cx + dx, y, cz + dz, B.DIRT); set(cx + dx, y0, cz + dz, mat || B.GRASS); clearAbove(cx + dx, cz + dz, y0 + 1, 8); } }
  // the shaft has to come out through the gallery ceiling, and its ladder has to reach the gallery floor, or you drop in and cannot climb out
  function openShaft(s, bottom) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) set(s.x + dx, bottom + 4, s.z + dz, B.AIR);
    for (let y = bottom; y <= bottom + 4; y++) { set(s.x, y, s.z + 1, B.LADDER); if (y <= bottom + 3) set(s.x, y, s.z + 2, B.LOG); } // a beam behind the bottom of it, so it reads as one ladder down to the floor
  }
  function stampMine(s) {
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
    const y0 = world.colInfo(s.x, s.z).h; pad(s.x, s.z, 7, y0, B.GRAVEL);
    // the headframe: four log legs, cross-beams, a plank roof, lamps
    for (const [a, b] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) for (let y = y0 + 1; y <= y0 + 7; y++) set(s.x + a, y, s.z + b, B.LOG);
    for (let i = -2; i <= 2; i++) { set(s.x + i, y0 + 7, s.z - 2, B.LOG); set(s.x + i, y0 + 7, s.z + 2, B.LOG); set(s.x - 2, y0 + 7, s.z + i, B.LOG); set(s.x + 2, y0 + 7, s.z + i, B.LOG); set(s.x + i, y0 + 4, s.z - 2, B.PLANKS); set(s.x + i, y0 + 4, s.z + 2, B.PLANKS); }
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) set(s.x + dx, y0 + 8, s.z + dz, Math.abs(dx) === 3 || Math.abs(dz) === 3 ? B.LOG : B.PLANKS);
    set(s.x, y0 + 9, s.z, B.IRONWALL); set(s.x, y0 + 10, s.z, B.TORCH); // the winding wheel
    for (const [a, b] of [[-2, -2], [2, 2]]) set(s.x + a, y0 + 8 - 1, s.z + b + (b > 0 ? -1 : 1), B.TORCH);
    // the shaft: 3x3, iron-lined, a ladder down one side to the gallery
    const bottom = Math.max(18, y0 - 26);
    for (let y = y0; y >= bottom; y--) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2; if (edge) { if (y < y0) set(s.x + dx, y, s.z + dz, (y % 5 === 0) ? B.LOG : B.STONE); } else set(s.x + dx, y, s.z + dz, B.AIR);
    }
    for (let y = y0; y >= bottom + 1; y--) set(s.x, y, s.z + 1, B.LADDER);
    for (let y = y0 - 4; y >= bottom; y -= 6) set(s.x - 1, y, s.z - 1, B.TORCH);
    // the gallery: a long room with ore in the walls, props, lamps and the crew's chests
    for (let dx = -9; dx <= 9; dx++) for (let dz = -4; dz <= 4; dz++) for (let y = bottom; y <= bottom + 4; y++) {
      const wall = Math.abs(dx) === 9 || Math.abs(dz) === 4 || y === bottom + 4; const X = s.x + dx, Z = s.z + dz;
      if (y === bottom) { set(X, y - 1, Z, B.STONE); set(X, y, Z, B.AIR); continue; }
      if (wall) { const r = U.hash3(X, y, Z, 0x0E); set(X, y, Z, r < 0.12 ? B.COPPER : r < 0.2 ? B.IRON : r < 0.24 ? B.EMBER : r < 0.255 ? B.VOID : B.STONE); }
      else set(X, y, Z, B.AIR);
    }
    for (const dx of [-6, -2, 2, 6]) { for (let y = bottom; y <= bottom + 3; y++) { set(s.x + dx, y, s.z - 3, B.LOG); set(s.x + dx, y, s.z + 3, B.LOG); } for (let dz = -3; dz <= 3; dz++) set(s.x + dx, bottom + 3, s.z + dz, B.PLANKS); set(s.x + dx, bottom + 2, s.z - 2, B.TORCH); }
    openShaft(s, bottom);
    set(s.x + 7, bottom, s.z + 2, B.CHEST); set(s.x + 7, bottom, s.z + 1, B.CHEST);
    const ch = G.chestAt(s.x + 7, bottom, s.z + 2, true); ch.items = { torch: 6, bread: 2, copper: 2 };
    s.bottom = bottom; s.y0 = y0;
    // a hut for the foreman and a cart of ore
    for (let dx = 4; dx <= 7; dx++) for (let dz = -6; dz <= -3; dz++) { const wall = dx === 4 || dx === 7 || dz === -6 || dz === -3; for (let y = y0 + 1; y <= y0 + 3; y++) set(s.x + dx, y, s.z + dz, wall && !(dz === -3 && dx === 5 && y < y0 + 3) ? B.PLANKS : B.AIR); for (let y = y0 + 4; y <= y0 + 4; y++) set(s.x + dx, y, s.z + dz, B.LOG); }
    set(s.x + 6, y0 + 1, s.z - 5, B.FUSION);
    for (const [a, b] of [[-5, 4], [-4, 4], [-5, 5]]) { set(s.x + a, y0 + 1, s.z + b, B.PLANKS); set(s.x + a, y0 + 2, s.z + b, U.hash3(a, b, 1, 2) < 0.5 ? B.COPPER : B.IRON); }
  }
  function stampDiver(s) {
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
    if (s.lake) { // no deep shore near enough: Marisol dug herself a lake
      world.ensureAround(Math.floor(s.lake.x / CH), Math.floor(s.lake.z / CH), 1, 99);
      for (let dx = -12; dx <= 12; dx++) for (let dz = -9; dz <= 9; dz++) { const e = (dx * dx) / 144 + (dz * dz) / 81; if (e > 1) continue; const X = s.lake.x + dx, Z = s.lake.z + dz; const depth = Math.round(2 + 6 * (1 - e)); const gy = world.groundY(X, Z);
        for (let y = gy + 6; y > SEA; y--) set(X, y, Z, B.AIR); for (let y = SEA; y > SEA - depth; y--) set(X, y, Z, B.WATER); set(X, SEA - depth, Z, e < 0.7 ? B.SAND : B.GRAVEL); }
      s.lake = null;
    }
    const y0 = SEA + 1; const ux = s.ux, uz = s.uz; const px = -uz, pz = ux; // along the shore
    // the pier: a plank walkway on log stilts, out past the drop-off, with a roofed platform at the end
    for (let t = 0; t <= 10; t++) for (let w = -1; w <= 1; w++) { const x = s.x + ux * t + px * w, z = s.z + uz * t + pz * w; set(x, y0, z, B.PLANKS); clearAbove(x, z, y0 + 1, 4); if (w !== 0 && t % 3 === 0) for (let y = y0 - 1; y > 1 && (world.getBlock(x, y, z) === B.WATER || world.getBlock(x, y, z) === B.AIR); y--) set(x, y, z, B.LOG); }
    for (let t = 8; t <= 12; t++) for (let w = -2; w <= 2; w++) { const x = s.x + ux * t + px * w, z = s.z + uz * t + pz * w; set(x, y0, z, B.PLANKS); if (Math.abs(w) === 2 && (t === 8 || t === 12)) { for (let y = y0 + 1; y <= y0 + 3; y++) set(x, y, z, B.LOG); } set(x, y0 + 4, z, Math.abs(w) === 2 || t === 8 || t === 12 ? B.LOG : B.LEAVES); }
    set(s.x + ux * 12 + px * 2, y0 + 1, s.z + uz * 12 + pz * 2, B.TORCH); set(s.x + ux * 8 - px * 2, y0 + 1, s.z + uz * 8 - pz * 2, B.TORCH);
    // the hut on the shore
    const hx = s.x - ux * 4, hz = s.z - uz * 4; const hy = world.colInfo(hx, hz).h; pad(hx, hz, 3, hy, B.SAND);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2; for (let y = hy + 1; y <= hy + 3; y++) set(hx + dx, y, hz + dz, wall && !(dx === ux * 2 && dz === uz * 2 && y < hy + 3) ? B.PLANKS : B.AIR); set(hx + dx, hy + 4, hz + dz, B.LEAVES); }
    set(hx, hy + 5, hz, B.LOG);
    // the sunken chest, out in the deep
    const cx = s.x + ux * 14, cz = s.z + uz * 14; let ch = world.groundY(cx, cz, SEA + 2); while (ch > 1 && world.getBlock(cx, ch, cz) === B.WATER) ch--; set(cx, ch + 1, cz, B.CHEST); set(cx + 1, ch + 1, cz, B.CORAL_R); set(cx - 1, ch + 1, cz, B.CORAL_Y);
    const c = G.chestAt(cx, ch + 1, cz, true); c.items = { pearl: 3, coral: 4, gold: 1 }; c.treasure = true; s.chest = { x: cx, y: ch + 1, z: cz };
    pierWays(s);
  }
  // ways on and off the pier: a ladder up the bank at the land end (into the hut door), and one down to the sea floor at the far end
  function pierWays(s) {
    const y0 = SEA + 1, ux = s.ux, uz = s.uz; let changed = false;
    const put = (x, y, z, id) => { if (world.getBlock(x, y, z) !== id) { set(x, y, z, id); changed = true; } };
    const lx = s.x - ux, lz = s.z - uz; let g = y0; // the real top of the bank, whatever has grown over it since
    while (g < y0 + 40) { const b = world.getBlock(lx, g + 1, lz); if (isSolid(b) || b === B.LADDER) g++; else break; }
    if (g > y0) { for (let y = y0 + 1; y <= g; y++) put(lx, y, lz, B.LADDER); for (let y = y0 + 1; y <= g + 2; y++) put(s.x, y, s.z, B.AIR); for (let y = g + 1; y <= g + 2; y++) { put(lx, y, lz, B.AIR); const bx = lx - ux, bz = lz - uz; if (isSolid(world.getBlock(bx, y, bz))) put(bx, y, bz, B.AIR); } }
    const ex = s.x + ux * 13, ez = s.z + uz * 13; let fy = y0; while (fy > 1 && !isSolid(world.getBlock(ex, fy - 1, ez))) fy--;
    for (let y = fy; y <= y0; y++) put(ex, y, ez, B.LADDER);
    for (let y = y0 + 1; y <= y0 + 2; y++) put(ex, y, ez, B.AIR);
    return changed;
  }


  function stampRanch(s) {
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
    const y0 = world.colInfo(s.x, s.z).h; pad(s.x, s.z, 9, y0);
    // the barn: plank walls, log frame, a pitched roof
    const bx = s.x - 6, bz = s.z;
    for (let dx = -3; dx <= 3; dx++) for (let dz = -4; dz <= 4; dz++) { const wall = Math.abs(dx) === 3 || Math.abs(dz) === 4; const corner = Math.abs(dx) === 3 && Math.abs(dz) === 4;
      for (let y = y0 + 1; y <= y0 + 4; y++) set(bx + dx, y, bz + dz, wall ? (corner ? B.LOG : (dx === 3 && Math.abs(dz) <= 1 && y <= y0 + 3) ? B.AIR : B.PLANKS) : B.AIR);
      for (let k = 0; k <= 3; k++) if (Math.abs(dx) <= 3 - k) set(bx + dx, y0 + 5 + k, bz + dz, Math.abs(dx) === 3 - k ? B.LOG : B.AIR); }
    set(bx + 2, y0 + 1, bz + 3, B.CHEST); const c = G.chestAt(bx + 2, y0 + 1, bz + 3, true); c.items = { bread: 3, berry: 6 };
    set(bx + 4, y0 + 2, bz + 2, B.TORCH); set(bx + 4, y0 + 2, bz - 2, B.TORCH);
    // a water trough and hay
    for (let i = -1; i <= 1; i++) { set(s.x + 1 + i, y0 + 1, s.z - 9, B.PLANKS); } set(s.x + 1, y0 + 1, s.z - 9, B.WATER);
    s.pen = { x: s.x + 4, z: s.z }; s.y0 = y0;
  }
  function stampSnow(s) {
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
    const y0 = world.colInfo(s.x, s.z).h; pad(s.x, s.z, 4, y0, B.SNOW);
    for (let k = 0; k < 4; k++) for (let dx = -3 + k; dx <= 3 - k; dx++) for (let dz = -3 + k; dz <= 3 - k; dz++) if (Math.abs(dx) === 3 - k || Math.abs(dz) === 3 - k) set(s.x + 6 + dx, y0 + 1 + k, s.z + dz, k === 3 ? B.LOG : B.PLANKS);
    set(s.x + 3, y0 + 1, s.z, B.AIR); set(s.x + 3, y0 + 2, s.z, B.AIR); set(s.x, y0 + 1, s.z, B.CAMPFIRE);
    const r = U.rng(U.combine(s.x, s.z, 0x5A)); const a = r() * Math.PI * 2, d = 55 + r() * 25; s.lost = { x: Math.round(s.x + Math.cos(a) * d), z: Math.round(s.z + Math.sin(a) * d) };
  }
  function stampShelter(s) { const L = s.lost; world.ensureAround(Math.floor(L.x / CH), Math.floor(L.z / CH), 0, 99); const y0 = world.groundY(L.x, L.z); for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) === 2 || Math.abs(dz) === 2) { set(L.x + dx, y0 + 1, L.z + dz, B.SNOW); if ((dx + dz) % 2) set(L.x + dx, y0 + 2, L.z + dz, B.SNOW); } set(L.x + 2, y0 + 1, L.z, B.AIR); set(L.x - 1, y0 + 1, L.z - 1, B.TORCH); L.y0 = y0; }
  function stampPeak(s) {
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 2, 99); world.ensureAround(Math.floor(s.nx / CH), Math.floor(s.nz / CH), 1, 99);
    if (s.crag) { // no peak tall enough nearby: a crag of stone, steep but climbable by jumping its ledges
      const g0 = world.colInfo(s.x, s.z).h;
      for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) { const d = Math.hypot(dx, dz); const hgt = Math.round((s.h - g0) * Math.max(0, 1 - d / 9.5) ** 0.8 + (U.hash3(s.x + dx, 3, s.z + dz, 9) - 0.5) * 2); if (hgt <= 0) continue; const X = s.x + dx, Z = s.z + dz; const gy = world.groundY(X, Z); for (let y = gy + 1; y <= g0 + hgt; y++) set(X, y, Z, U.hash3(X, y, Z, 4) < 0.15 ? B.MOSS : B.STONE); if (g0 + hgt >= s.h - 6) set(X, g0 + hgt, Z, B.SNOW); }
      s.crag = false;
    }
    const top = world.groundY(s.x, s.z); set(s.x, top + 1, s.z, B.TORCH); s.peakY = top;
    // the nest pillar: 5 wide at the top, sheer stone, no way up but from the air
    const gy = world.groundY(s.nx, s.nz); const tt = Math.max(gy + 8, top - 7); s.top = tt;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const r2 = dx * dx + dz * dz; if (r2 > 6) continue; for (let y = world.groundY(s.nx + dx, s.nz + dz); y <= tt; y++) set(s.nx + dx, y, s.nz + dz, y >= tt - 1 ? B.MOSS : B.STONE); clearAbove(s.nx + dx, s.nz + dz, tt + 1, 6); }
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) set(s.nx + dx, tt + 1, s.nz + dz, B.LOG); // the nest
    set(s.nx, tt + 1, s.nz, B.AIR);
  }

  function stampZoo(s) {
    world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 1, 99);
    const y0 = world.colInfo(s.x, s.z).h; pad(s.x, s.z, 10, y0, B.GRAVEL);
    // a yard fence, a painted gate, three iron-barred cages with glass roofs; the big one holds the dinosaur
    for (let i = -10; i <= 10; i++) for (const [x, z] of [[s.x + i, s.z - 10], [s.x + i, s.z + 10], [s.x - 10, s.z + i], [s.x + 10, s.z + i]]) { if (Math.abs(i) <= 1 && z === s.z + 10) continue; set(x, y0 + 1, z, (i + 10) % 4 === 0 ? B.LOG : B.PLANKS); if ((i + 10) % 4 === 0) set(x, y0 + 2, z, B.TORCH); }
    for (const dx of [-2, 2]) for (let y = y0 + 1; y <= y0 + 5; y++) set(s.x + dx, y, s.z + 10, B.LOG); for (let dx = -2; dx <= 2; dx++) set(s.x + dx, y0 + 6, s.z + 10, dx % 2 ? B.CORAL_R : B.CORAL_Y);
    const cage = (cx, cz, r, h) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { const edge = Math.abs(dx) === r || Math.abs(dz) === r; for (let y = y0 + 1; y <= y0 + h; y++) set(cx + dx, y, cz + dz, edge ? ((dx + dz) % 2 === 0 || y === y0 + h ? B.IRONWALL : B.GLASS) : B.AIR); set(cx + dx, y0 + h + 1, cz + dz, edge ? B.IRONWALL : B.GLASS); set(cx + dx, y0, cz + dz, edge ? B.GRAVEL : B.GRASS); } };
    cage(s.x, s.z - 4, 4, 6); cage(s.x - 7, s.z + 3, 2, 3); cage(s.x + 7, s.z + 3, 2, 3);
    set(s.x - 7, y0 + 1, s.z + 3, B.FERN); set(s.x + 7, y0 + 1, s.z + 3, B.BERRY); set(s.x - 2, y0 + 1, s.z - 6, B.FERN); set(s.x + 2, y0 + 1, s.z - 2, B.FERN);
    s.y0 = y0; s.dino = { x: s.x, z: s.z - 4 };
  }
  // ---------- Thornhold: the Kinmaster's fortress, a run of rooms that each want something you have learned ----------
  function stampFort(s) {
    const X0 = s.x, Z0 = s.z; for (let cx = -1; cx <= 4; cx++) world.ensureAround(Math.floor((X0 + cx * 20) / CH), Math.floor(Z0 / CH), 2, 99);
    const y0 = world.colInfo(X0 + 30, Z0).h; s.y0 = y0; const F = B.FORTSTONE;
    const box = (x0, x1, z0, z1, ya, yb, b) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = ya; y <= yb; y++) set(X0 + x, y, Z0 + z, b); };
    for (let x = -24; x <= 80; x++) for (let z = -14; z <= 14; z++) { const X = X0 + x, Z = Z0 + z; for (let y = y0 + 1; y <= y0 + 22; y++) if (world.getBlock(X, y, Z) !== B.AIR) set(X, y, Z, B.AIR); for (let y = y0 - 4; y <= y0; y++) set(X, y, Z, y === y0 ? B.GRAVEL : B.STONE); }
    world.fellCrowns(X0 - 24, Z0 - 14, X0 + 80, Z0 + 14, (x, y, z) => { if (isTreeBlock(world.getBlock(x, y, z))) set(x, y, z, B.AIR); });
    box(-1, 76, -9, 9, y0 + 1, y0 + 15, F); box(0, 75, -8, 8, y0 + 1, y0 + 14, B.AIR); box(-1, 76, -9, 9, y0 - 12, y0, F);
    for (let x = -1; x <= 76; x += 2) { set(X0 + x, y0 + 16, Z0 - 9, F); set(X0 + x, y0 + 16, Z0 + 9, F); }
    // the face of it: square towers at the corners and flanking the gate, buttresses along the long walls, banners, thorns crawling up round the gate
    for (const [tx, tz] of [[-3, -11], [-3, 11], [78, -11], [78, 11], [-3, -4], [-3, 4]]) { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { for (let y = y0 - 2; y <= y0 + 19; y++) set(X0 + tx + a, y, Z0 + tz + b, F); if ((a + b) % 2) set(X0 + tx + a, y0 + 20, Z0 + tz + b, F); } set(X0 + tx, y0 + 20, Z0 + tz, F); set(X0 + tx, y0 + 21, Z0 + tz, B.TORCH); }
    for (const z of [-10, 10]) for (let x = 8; x <= 70; x += 12) { for (let y = y0 + 1; y <= y0 + 13; y++) set(X0 + x, y, Z0 + z, F); set(X0 + x, y0 + 14, Z0 + z, F); set(X0 + x, y0 + 10, Z0 + z + (z < 0 ? -1 : 1), B.BANNER); }
    for (const z of [-7, 7]) set(X0 - 2, y0 + 12, Z0 + z, B.BANNER);
    for (const [vx, vy, vz] of [[-2, 1, 2], [-2, 2, 2], [-2, 3, 3], [-2, 1, -2], [-2, 2, -3], [-2, 4, -2], [-2, 5, 1], [-2, 6, 2]]) if (world.getBlock(X0 + vx, y0 + vy, Z0 + vz) === B.AIR) set(X0 + vx, y0 + vy, Z0 + vz, B.THORN);
    const wallAt = (x) => box(x, x, -8, 8, y0 + 1, y0 + 14, F);
    // room 1: the gate of thorns, then a ladder up to the launch ledge
    box(-1, -1, -1, 1, y0 + 1, y0 + 3, B.THORN); for (const z of [-3, 3]) set(X0 - 2, y0 + 3, Z0 + z, B.TORCH);
    box(0, 7, -8, 8, y0, y0, B.GRAVEL); for (let y = y0 + 1; y <= y0 + 9; y++) set(X0 + 7, y, Z0 + 4, B.LADDER); set(X0 + 2, y0 + 3, Z0 - 7, B.TORCH); set(X0 + 2, y0 + 3, Z0 + 7, B.TORCH);
    // room 2: the pit; a ledge at the top, water far below, the landing on the far side
    box(9, 29, -8, 8, y0 - 11, y0, B.AIR); box(9, 29, -8, 8, y0 - 12, y0 - 12, F); box(9, 29, -8, 8, y0 - 11, y0 - 9, B.WATER);
    box(8, 11, -8, 8, y0 - 11, y0 + 8, F); box(8, 8, -8, 8, y0 + 9, y0 + 14, F); box(8, 8, 3, 5, y0 + 9, y0 + 11, B.AIR); for (let y = y0 + 1; y <= y0 + 8; y++) set(X0 + 7, y, Z0 + 4, B.LADDER);
    for (let y = y0 - 8; y <= y0 + 8; y++) set(X0 + 12, y, Z0, B.LADDER);
    box(26, 29, -8, 8, y0 - 11, y0 + 4, F); set(X0 + 10, y0 + 9, Z0 + 4, B.TORCH); set(X0 + 28, y0 + 5, Z0 - 6, B.TORCH); set(X0 + 28, y0 + 5, Z0 + 6, B.TORCH);
    for (let x = 13; x <= 25; x += 4) set(X0 + x, y0 + 14, Z0, B.MOONGLOW);
    // room 3: the flooded hall, floor to ceiling
    wallAt(30); box(30, 30, -1, 1, y0 + 5, y0 + 7, B.AIR); box(31, 43, -8, 8, y0 + 1, y0 + 4, F); box(31, 43, -8, 8, y0 + 5, y0 + 14, B.WATER);
    for (let x = 33; x <= 41; x += 4) set(X0 + x, y0 + 5, Z0 + 7, B.CORAL_B);
    // room 4: the dead machine gate (Spark); room 5: the rubble (Stone)
    wallAt(44); box(44, 44, -1, 1, y0 + 5, y0 + 7, B.AIR); box(45, 75, -8, 8, y0 + 1, y0 + 4, F);
    wallAt(52); box(52, 52, -1, 1, y0 + 5, y0 + 7, B.DEADGATE); set(X0 + 48, y0 + 7, Z0 - 7, B.TORCH); set(X0 + 48, y0 + 7, Z0 + 7, B.TORCH);
    wallAt(60); box(60, 60, -1, 1, y0 + 5, y0 + 7, B.RUBBLE); box(57, 59, -2, 2, y0 + 5, y0 + 5, B.RUBBLE); set(X0 + 55, y0 + 7, Z0 - 7, B.TORCH);
    // the throne room: a long carpet, pillars with lamps, a gold throne
    for (let x = 61; x <= 74; x++) set(X0 + x, y0 + 4, Z0, B.CORAL_R);
    for (let x = 63; x <= 73; x += 5) for (const z of [-5, 5]) { box(x, x, z, z, y0 + 5, y0 + 13, F); set(X0 + x, y0 + 10, Z0 + z + (z < 0 ? 1 : -1), B.TORCH); }
    box(74, 74, -1, 1, y0 + 5, y0 + 5, B.GOLD); box(75, 75, -1, 1, y0 + 5, y0 + 8, B.GOLD); set(X0 + 74, y0 + 9, Z0, B.MOONGLOW);
    s.throne = { x: X0 + 72, z: Z0 }; s.floorY = y0 + 4;
    set(X0 + 70, y0 + 5, Z0 + 3, B.DARKTABLE); // his own table: the only one that takes dark materials
    // the canyon in front, and the broken bridge over it
    for (let x = -16; x <= -9; x++) for (let z = -40; z <= 40; z++) { const X = X0 + x, Z = Z0 + z; const gy = world.groundY(X, Z, y0 + 30); for (let y = y0 - 12; y <= Math.max(gy, y0) + 4; y++) set(X, y, Z, y <= y0 - 10 ? B.WATER : B.AIR); set(X, y0 - 13, Z, B.STONE); }
    for (const x of [-16, -9]) for (const z of [-1, 0, 1]) set(X0 + x, y0, Z0 + z, B.PLANKS);
    s.bridge = { x0: X0 - 16, x1: X0 - 9, z: Z0, y: y0 }; s.merchant = { x: X0 - 20, z: Z0 + 3 };
  }
  function fixBridge(s) { const b = s.bridge; for (let x = b.x0; x <= b.x1; x++) for (const dz of [-1, 0, 1]) set(x, b.y, b.z + dz, B.PLANKS); for (let x = b.x0; x <= b.x1; x += 2) for (const dz of [-2, 2]) set(x, b.y + 1, b.z + dz, B.LOG); }
  const GATES = { [B.THORN]: ['Flame', 'burns the thorns away'], [B.DEADGATE]: ['Spark', 'jolts the dead gate back to life: it grinds open'], [B.RUBBLE]: ['Stone', 'smashes the rubble flat'] };
  function tryGate(hit) {
    const g = GATES[hit.id]; if (!g) return false;
    const k = G.activeKin(); const els = k ? KIN.dominant(k.sp.elem, 2) : [];
    if (!k || !els.includes(g[0])) { UI.toast(`${BLOCKS[hit.id].name}: nothing you have can move it. A ${g[0]} Kin in the lead could.`, 'bad'); return true; }
    const seen = new Set(), q = [[hit.x, hit.y, hit.z]]; let n = 0;
    while (q.length && n < 80) { const [x, y, z] = q.pop(); const key = x + ',' + y + ',' + z; if (seen.has(key)) continue; seen.add(key); if (world.getBlock(x, y, z) !== hit.id) continue; set(x, y, z, B.AIR); n++; for (const [a, b, c2] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) q.push([x + a, y + b, z + c2]); }
    G.meshPass(99); UI.sfx(hit.id === B.THORN ? 'fuse' : 'break'); UI.toast(`${KIN.name(k)} ${g[1]}.`, 'good'); return true;
  }
  function stampTent(at) { world.ensureAround(Math.floor(at.x / CH), Math.floor(at.z / CH), 0, 99); const y0 = world.groundY(at.x, at.z); for (let k = 0; k < 3; k++) for (let dx = -2 + k; dx <= 2 - k; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) === 2 - k) set(at.x + 3 + dx, y0 + 1 + k, at.z + dz, B.PLANKS); set(at.x, y0 + 1, at.z, B.CAMPFIRE); }
  // ---------- each frame ----------
  function update(dt, p, inBattle) {
    if (!onEarth()) { people.length = 0; return; }
    const S = sites(); const c = C();
    tick += dt; if (tick > 0.4) { tick = 0;
      if (near(S.mine, p, 90) && !c.st_mine) { c.st_mine = true; stampMine(S.mine); G.meshPass(99); }
      else if (near(S.mine, p, 90) && c.st_mine && !c.mineShaftFix2) { c.mineShaftFix2 = true; const m = S.mine; openShaft(m, Math.max(18, world.colInfo(m.x, m.z).h - 26)); G.meshPass(99); } // worlds stamped before the fix: the plug over the shaft comes out
      if (S.diver && near(S.diver, p, 90) && !c.st_diver) { c.st_diver = true; stampDiver(S.diver); G.meshPass(99); }
      else if (S.diver && near(S.diver, p, 60) && c.st_diver && pierWays(S.diver)) G.meshPass(99); // keeps the pier ladders whole, old worlds included (terrain can fill in after the stamp)
      if (S.ranch && near(S.ranch, p, 90) && !c.st_ranch) { c.st_ranch = true; stampRanch(S.ranch); G.meshPass(99); }
      if (S.snow && near(S.snow, p, 90) && !c.st_snow) { c.st_snow = true; stampSnow(S.snow); G.meshPass(99); }
      if (S.snow && S.snow.lost && c.frost === 1 && near(S.snow.lost, p, 70) && !c.st_shelter) { c.st_shelter = true; stampShelter(S.snow); G.meshPass(99); }
      if (S.peak && near(S.peak, p, 110) && !c.st_peak) { c.st_peak = true; stampPeak(S.peak); G.meshPass(99); }
      if (S.fort && near(S.fort, p, 120) && !c.st_fort) { c.st_fort = true; stampFort(S.fort); G.meshPass(99); }
      if (S.fort && c.st_fort && S.fort.throne && near(S.fort, p, 110)) { const t = S.fort.throne, x = t.x - 2, y = S.fort.floorY + 1, z = t.z + 3; if (world.chunks.get(Math.floor(x / CH) + ',' + Math.floor(z / CH)) && world.getBlock(x, y, z) !== B.DARKTABLE) { world.setBlock(x, y, z, B.DARKTABLE); G.meshPass(99); } } // forts stamped before the table existed
      if (S.zoo && near(S.zoo, p, 90) && !c.st_zoo) { c.st_zoo = true; stampZoo(S.zoo); G.meshPass(99); }
      if (S.halfA && near(S.halfA, p, 80) && !c.st_halfA) { c.st_halfA = true; stampTent(S.halfA); G.meshPass(99); }
      if (S.halfB && near(S.halfB, p, 80) && !c.st_halfB) { c.st_halfB = true; stampTent(S.halfB); G.meshPass(99); }
      spawnPeople(S, p);
      checkSteps(S, p);
    }
    for (const n of people) { // the crew walks back and forth
      n.t += dt; if (n.walk) { const f = (Math.sin(n.t * Math.PI * 2 / n.walk.period) + 1) / 2; const tx = n.walk.ax + (n.walk.bx - n.walk.ax) * f, tz = n.walk.az + (n.walk.bz - n.walk.az) * f; const vx = tx - n.x, vz = tz - n.z; if (Math.hypot(vx, vz) > 0.01) n.yaw = Math.atan2(vx, vz); n.x = tx; n.z = tz; const g = world.groundY(Math.floor(n.x), Math.floor(n.z), Math.floor(n.y) + 2); n.y = g + 1; }
      else { const dx = p.x - n.x, dz = p.z - n.z; if (Math.hypot(dx, dz) < 7) n.yaw = Math.atan2(dx, dz); }
    }
  }
  function spawnPeople(S, p) {
    const has = (id) => people.some(n => n.id === id);
    if (near(S.mine, p, 80) && C().st_mine && (G.stats.citadel || {}).profFree && !has('prof_camp')) { const s = S.mine; person('prof_camp', 'Professor Aldous Finch', 'professor', s.x + 6, s.z - 3, { body: '#e8e8e0', belly: '#c9a87a', accent: '#4a8ad0', eye: '#222222' }, ['scientist', 'professor']); }
    if (near(S.mine, p, 80) && C().st_mine && !has('foreman')) {
      const s = S.mine;
      person('foreman', 'Foreman Garrick', 'foreman', s.x + 4, s.z + 3, { body: '#5a4a3a', belly: '#c68642' }, ['miner']);
      const mA = person('minerA', 'Bodie', 'miner', s.x - 5, s.z - 4, { body: '#4c6b8a', belly: '#e8c39e' }, ['miner'], { ax: s.x - 5.5, az: s.z - 4.5, bx: s.x + 3.5, bz: s.z - 4.5, period: 14 });
      person('orrin', 'Orrin the Runesmith', 'runesmith', s.x - 6, s.z + 1, { body: '#2a3a6a', belly: '#e8c39e', accent: '#7ad7ff' }, ['hat', 'star']);
      const mB = person('minerB', 'Ruth', 'miner', s.x - 4, s.z + 5, { body: '#8a5a3a', belly: '#8d5524' }, ['miner'], { ax: s.x - 5.5, az: s.z + 5.5, bx: s.x - 5.5, bz: s.z - 2.5, period: 11 });
    }
    if (S.diver && near(S.diver, p, 80) && C().st_diver && !has('diver')) { const s = S.diver; person('diver', 'Marisol', 'diver', s.x + s.ux * 9, s.z + s.uz * 9, { body: '#2f6f8a', belly: '#c68642' }, ['diver']); }
    if (S.ranch && near(S.ranch, p, 80) && C().st_ranch && !has('rancher')) { const s = S.ranch; person('rancher', 'Dusty Hale', 'rancher', s.x - 2, s.z + 2, { body: '#7a4a2a', belly: '#e8c39e' }, ['hat', 'star']); person('hand', 'Pip', 'hand', s.x - 3, s.z - 6, { body: '#4c7bc9', belly: '#f1d3b3' }, ['hat'], { ax: s.x - 3.5, az: s.z - 7.5, bx: s.x - 3.5, bz: s.z + 6.5, period: 16 }); }
    if (S.snow && near(S.snow, p, 80) && C().st_snow && !has('ysolde')) { const s = S.snow; person('ysolde', 'Ysolde', 'snow', s.x + 2, s.z + 2, { body: '#e8e8f0', belly: '#f1d3b3' }, ['hermit']); }
    if (S.snow && S.snow.lost && C().frost === 1 && C().st_shelter && near(S.snow.lost, p, 70) && !has('tam')) { const L = S.snow.lost; person('tam', 'Tam', 'lost', L.x, L.z + 1, { body: '#9aa8b8', belly: '#f1d3b3' }, ['hermit']); }
    if (S.peak && near(S.peak, p, 100) && C().st_peak && !has('hermit')) { const s = S.peak; const a = Math.atan2(s.nz - s.z, s.nx - s.x) + Math.PI; let hx = Math.round(s.x + Math.cos(a) * 18), hz = Math.round(s.z + Math.sin(a) * 18); person('hermit', 'Old Wren', 'hermit', hx, hz, { body: '#7a6f5a', belly: '#e8c39e' }, ['hermit']); }
    if (S.zoo && near(S.zoo, p, 80) && C().st_zoo && !has('keeper')) { const s = S.zoo; person('keeper', 'Barnaby Quill', 'keeper', s.x + 3, s.z + 6, { body: '#6a2a4a', belly: '#e8c39e' }, ['hat', 'lamp']);
      if (!zooDino) { const sp = KIN.dex('earth').find(x => x.dino && x.shape === 'raptor') || KIN.dex('earth').find(x => x.dino); if (sp) { const gy = world.groundY(s.dino.x, s.dino.z) + 1; zooDino = Wild.makeEntity(sp, 40, s.dino.x + 0.5, gy, s.dino.z + 0.5, { senseR: 0 }); zooDino.peaceful = true; zooDino.exhibit = true; zooDino.patrol = { ax: s.dino.x - 2, az: s.dino.z + 0.5, bx: s.dino.x + 2.5, bz: s.dino.z + 0.5, period: 9, phase: 0 }; Wild.list.push(zooDino); } } }
    if (S.fort && C().st_fort && near(S.fort, p, 130)) {
      const f = S.fort;
      if (!has('silas')) person('silas', 'Silas Pennywise', 'merchant', f.merchant.x, f.merchant.z, { body: '#232334', belly: '#d8a060', accent: '#e0b84a', dark: '#17171f' }, ['silas']);
      if (C().kinmaster && !has('sable') && f.throne) { const n = person('sable', 'Sable the Hexwright', 'runesmith', f.throne.x - 3, f.throne.z + 5, { body: '#4a1a3a', belly: '#f1d3b3', accent: '#ff3a8a', dark: '#120818' }, ['hat', 'star']); n.y = f.floorY + 1; }
      if (C().kinmaster && !has('turncoat') && f.throne) { const n = person('turncoat', 'Vesper the Turncoat', 'turncoat', f.throne.x - 5, f.throne.z - 3, { body: '#1e1a2a', belly: '#c9b48a', accent: '#7a2aa8', dark: '#0a0812', eye: '#b0f0ff' }, ['mask']); n.y = f.floorY + 1; }
      if (!C().kinmaster && !has('kinmaster') && f.throne) { const n = person('kinmaster', 'The Kinmaster', 'kinmaster', f.throne.x, f.throne.z, { body: '#3a1a4a', belly: '#c9b48a', accent: '#b026ff', dark: '#120818', eye: '#ff3a3a' }, ['crown', 'mask']); n.y = f.floorY + 1; }
    }
    if (S.halfA && near(S.halfA, p, 70) && C().st_halfA && !has('jo')) person('jo', 'Trapper Jo', 'halfA', S.halfA.x + 2, S.halfA.z + 1, { body: '#5a4a2a', belly: '#c68642' }, ['hat']);
    if (S.halfB && near(S.halfB, p, 70) && C().st_halfB && !has('sela')) person('sela', 'Old Sela', 'halfB', S.halfB.x + 2, S.halfB.z + 1, { body: '#4a5a6a', belly: '#8d5524' }, ['hermit']);
    if (zooDino && !near(S.zoo, p, 110)) { Wild.remove(zooDino); zooDino = null; }
    // the rogue horse-Kin stands in the finished paddock
    if (rogue && !Wild.list.includes(rogue)) rogue = null; // the wild cleared him away when you walked off: he comes back when you return
    if (S.ranch && C().paddock && !C().rogueTamed && !rogue && near(S.ranch.pen, p, 45)) {
      const pen = S.ranch.pen; const sp = rogueSpecies(); const gy = world.groundY(pen.x, pen.z) + 1;
      rogue = Wild.makeEntity(sp, Math.max(12, G.trainerLevel + 4), pen.x + 0.5, gy, pen.z + 0.5, { senseR: 0 }); rogue.peaceful = true; rogue.rogue = true; rogue.patrol = { ax: pen.x - 2.5, az: pen.z + 0.5, bx: pen.x + 3.5, bz: pen.z + 0.5, period: 6, phase: 0 }; rogue.speed = 2.5;
      Wild.list.push(rogue);
    }
    for (let i = people.length - 1; i >= 0; i--) if (Math.hypot(wd(people[i].x - p.x), wd(people[i].z - p.z)) > 110) people.splice(i, 1);
  }
  let rogueSp = null; let zooDino = null; let bossRef = null; let kmSp = null;
  function kinmasterSpecies() { if (kmSp) return kmSp; const sp = KIN.species(U.combine(0x0BAD, 1), ['Void'], 0, { primary: 'Void', shape: 'biped', total: 760, rarity: 4 }); sp.names = ['Vexmaw', 'Vexmaw', 'Vexmaw']; sp.noFuse = true; sp.colors = { body: '#2a1038', belly: '#b026ff', accent: '#ff3a3a', dark: '#0a0410', eye: '#ff3a3a' }; sp.feat.horns = true; sp.feat.spikes = true; sp.feat.crest = true; sp.cap = 200; kmSp = sp; return sp; }
  function onBoss(result) { const c = C(); c.kinmaster = true; bossRef = null; const i = people.findIndex(x => x.id === 'kinmaster'); if (i >= 0) people.splice(i, 1); setTimeout(() => Dialogue.show('The Kinmaster', ['Enough! You have not won anything. You have only made me hurry.', 'The Core, the Heart, the thing that sleeps on the Starmetal: I will have it before you can follow.'], () => { UI.toast('He is gone, down into the earth. The Core. The Mantlewyrm.', 'bad'); if (!G.player.has('voidshard')) setTimeout(() => Dialogue.show('A prisoner from his cells', ['You beat him in his own hall. Look, his table cracked when he ran: a splinter of it came off in my hand.', 'Keep it on you. The old tables in the villages lost the knack for dark work when he came; with this in your pocket, any of them will take Void for you again. Consider it a thank you from all of us.'], () => { G.player.add('voidshard', 1); UI.sfx('quest'); UI.toast('Void Shard: every Fusion Table now takes dark materials while you carry it.', 'good'); }), 900); }), 1200); }
  function rogueSpecies() {
    if (rogueSp) return rogueSp;
    const sp = KIN.species(U.combine(0x40CE, 7), ['Gale'], 0, { primary: 'Gale', shape: 'quadruped', total: 420, rarity: 2 });
    sp.names = ['Thunderhoof', 'Thunderhoof', 'Thunderhoof']; sp.fast = true; sp.noFuse = true; sp.dex = 0;
    sp.colors = { body: '#3a2a22', belly: '#e8d8c0', accent: '#f0f0f0', dark: '#1a1210', eye: '#ffcc33' }; sp.feat.ears = true; sp.feat.tail = true; sp.feat.bigTail = true; sp.feat.crest = true;
    rogueSp = sp; return sp;
  }

  // ---------- the steps ----------
  function checkSteps(S, p) {
    const c = C();
    // the dive: Marisol's chest opened
    if (c.bulbStep === 1 && S.diver && S.diver.chest) { const k = S.diver.chest; if (world.getBlock(k.x, k.y, k.z) === B.CHEST) { const ch = G.chestAt(k.x, k.y, k.z, false); if (ch && Object.keys(ch.items || {}).length === 0) { c.bulbStep = 2; UI.toast('You have her chest. Swim back to Marisol.', 'good'); } } }
    if (c.ranch === 1 && !c.posts) { c.posts = true; stampPosts(); G.meshPass(99); }
    // the paddock: a pen built where Hale put the posts
    if (c.ranch === 1 && S.ranch) { if (!c.penQ) c.penQ = { kind: 'build', what: 'pen', site: { x: S.ranch.pen.x, z: S.ranch.pen.z } }; if (near(S.ranch.pen, p, 40)) { const m = Builds.measure(c.penQ); if (m.pass) { c.ranch = 2; c.paddock = true; UI.sfx('quest'); UI.toast('The paddock stands. Go and tell Dusty Hale.', 'good'); } } }
    // finding Tam in the snow
    if (c.frost === 1 && S.snow && S.snow.lost && near(S.snow.lost, p, 4)) { c.frost = 2; UI.toast('You found Tam. He is half frozen. Talk to him.', 'good'); }
    // the nest: you have to come in on the glider
    if (c.glider === 1 && S.peak && S.peak.top && !c.skyEgg) {
      const s = S.peak; const onTop = Math.hypot(p.x - (s.nx + 0.5), p.z - (s.nz + 0.5)) < 2.8 && p.y >= s.top + 0.9 && p.y < s.top + 3;
      if (onTop && p.onGround) {
        if ((p.glideT || 0) > 0 || (G.lastGlide && performance.now() - G.lastGlide < 1500)) { c.skyEgg = true; c.glider = 2; const sp = skyEggSpecies(); sp.eggLabel = 'sky egg'; if (G.addEgg(sp, 'the nest', 350)) UI.toast('You landed it. The egg is warm. Walk it back down to Old Wren.', 'good'); else c.skyEgg = false; }
        else if (!c.warnedNest) { c.warnedNest = true; UI.toast('The nest-keeper shrieks and flaps at you. You did not come in on the wind. Go back up the peak and glide in.', 'bad'); setTimeout(() => { c.warnedNest = false; }, 6000); }
      }
    }
  }
  function skyEggSpecies() { const list = KIN.dex('earth').filter(sp => sp.home && sp.home.layer === 'Sky' && (sp.shape === 'bird' || sp.shape === 'floater') && sp.rarity <= 1); const sp = list[0] || KIN.dex('earth').find(sp => sp.shape === 'bird'); sp.tame = true; return sp; }
  function waterEggSpecies() { const list = KIN.dex('earth').filter(sp => sp.home && sp.home.layer === 'Water' && sp.shape === 'fish' && sp.rarity <= 1); const sp = list[1] || list[0]; sp.tame = true; return sp; }

  // ---------- talking ----------
  function talk(n) {
    G.talkNpc = n; const c = C(); const P = G.player; const say = (lines, then) => Dialogue.show(n.name, lines, then);
    const relic = (seller) => () => { if (!(seller === 'turncoat' || Relics.forSeller(seller).some(r => r.need(G, c)))) return; const no = Relics.gate(seller); if (no) { setTimeout(() => Dialogue.show(n.name, [no]), 50); return; } UI.openPanel('relics', { seller, who: n.name }); };
    if (n.job === 'foreman') {
      if (!c.pick) return say(['Another one who wants to dig with their fingernails. I can see it on you.', 'Here. A stone pick. Stone gives way to it, copper and iron will, slowly. Do not lose it.', 'Go down the shaft. Ladder\'s on the side. The gallery at the bottom has ore in every wall.'], () => { c.pick = 1; give('pick_stone'); });
      if (c.pick === 1) { const ok = P.count('copper') >= 6 && P.count('iron') >= 4; if (!ok) return say(['Bring me six copper and four iron and I will make you a proper pick.', `You have ${P.count('copper')} copper and ${P.count('iron')} iron.`]); return say(['That is good ore. Give me a minute.', 'An iron pick. Void crystal, gold, diamond: all of it is yours to break now. And take this axe, it is wasted on me.'], () => { P.take('copper', 6); P.take('iron', 4); c.pick = 2; give('pick_iron'); G.player.add('axe_iron', 1); C().got_axe_iron = true; setTimeout(() => UI.toast('Garrick throws in an iron axe too: wood comes down twice as fast.', 'good'), 1500); }); }
      if (c.lava !== 2 && G.stats.reachedMines && (Quests.isActive('lavasuit') || c.lava === 1)) {
        if (!c.lava) return say(['You want to go under the basalt? Into the Core?', 'Then you want a Lava Suit, and I am the only one who knows how. Five iron, three void crystal, four ember ore. Bring them.'], () => { c.lava = 1; });
        const ok = P.count('iron') >= 5 && P.count('void') >= 3 && P.count('ember') >= 4; if (!ok) return say(['Five iron, three void, four ember.', `You have ${P.count('iron')}, ${P.count('void')} and ${P.count('ember')}.`]);
        return say(['Stand still. This is going to be hot.', 'There. It keeps the heat off you down there. It will not save you if you fall in the lava, so do not. Come back alive.'], () => { P.take('iron', 5); P.take('void', 3); P.take('ember', 4); c.lava = 2; give('lavasuit'); });
      }
      return say(['Mind the shaft.', c.pick >= 2 ? 'Gold and diamond deeper down. And if you ever get rich, I have something of my father\'s I might part with.' : ''], relic('foreman'));
    }
    if (n.job === 'miner') return say([['Tunnels go on forever down there. Take torches.', 'Copper is the green-flecked stone. Iron is the pale one.', 'Void crystal glows purple, way down. Garrick will want to see it.', 'If the ladder creaks, keep climbing.'][Math.floor(Math.random() * 4)]]);
    if (n.job === 'diver') {
      if (!c.bulb) { const ok = P.count('glass') >= 2 && P.count('iron') >= 2 && P.count('frond') >= 4; if (!c.diverMet) return say(['Nobody goes under without a bulb. Not even on the back of a fish: they come up, you do not.', 'Bring me two glass, two iron and four fronds and I will blow you a Breathing Bulb.'], () => { c.diverMet = true; }); if (!ok) return say(['Two glass, two iron, four fronds.', `You have ${P.count('glass')}, ${P.count('iron')} and ${P.count('frond')}.`]); return say(['Hold still while it seals.', 'A Breathing Bulb: two minutes under, and more with practice. Now, a favour.', 'My chest went over the side years ago, out past the end of the pier where it gets deep. Fetch what is in it. Keep half.'], () => { P.take('glass', 2); P.take('iron', 2); P.take('frond', 4); c.bulb = 1; c.bulbStep = 1; give('bulb'); }); }
      if (c.bulbStep === 1) return say(['Out past the pier, on the bottom. Look for the coral.']);
      if (c.bulbStep === 2) return say(['My mother\'s pearls. You kept your word.', 'Keep the gold. And the bulb is yours for good.'], () => { c.bulbStep = 3; c.bulbDone = true; G.shards += 80; UI.toast('+80 Shards.', 'good'); });
      return say(['The sea is bigger than the land. Remember that.', c.bulbDone ? 'And I keep one thing from down there I have never shown anyone. It is not cheap.' : ''], relic('diver'));
    }
    if (n.job === 'rancher') {
      if (!c.ranch) return say(['Ride? You? Nobody rides a Kin they have not been thrown off first.', 'I will teach you. But I need a paddock first, for the wild one they are bringing in. Wall in the square between my four posts, two blocks high, with a gap for a gate.', 'Any solid block does it. Planks are easiest: one log makes four at the table, and you will want about fifteen logs. Dirt or stone works too if you are short.'], () => { c.ranch = 1; });
      if (c.ranch === 1) return say(['The paddock. Two high, all the way round, between my four posts. Planks, logs, stone, dirt: anything solid. Leave one gap for the gate.']);
      if (c.ranch === 2 && !c.rogueTamed) return say(['They brought him in last night. Thunderhoof. Nobody has stayed on him longer than a breath.', 'He is in your paddock. Walk up and tap him to get on. Tap when he lands his weight, not before, not after. If he throws you, get up and try again.']);
      return say(['You ride now. But only a few kinds will ever take a rider: steeds, dinosaurs, the great ones. Your Kindex marks steeds with ♞.', 'Each one has to be broken in once. Then ride it: trust builds over a couple of hours and it gets faster. Leave it unridden for a long time (hours of play) and the trust slowly fades.']);
    }
    if (n.job === 'hand') return say([['Hale was thrown seven times before he stayed on anything.', 'Feed them berries. They remember.', 'Mind the back legs.'][Math.floor(Math.random() * 3)]]);
    if (n.job === 'snow') {
      if (!c.frost) return say(['Have you seen my brother? Tam went out after a white Kin three days ago and did not come back.', 'The cold out there kills. Take my broth: drink one and you will not freeze for a while. Stand by a fire if you can.', 'Out in the snow, that way somewhere. Please.'], () => { c.frost = 1; G.player.add('broth', 3); });
      if ((c.frost === 1 || c.frost === 2) && !G.player.has('broth')) return say(['Out of broth? Here, two more. Find him.'], () => G.player.add('broth', 2));
      if (c.frost === 1 || c.frost === 2) return say(['Please. He went out into the snow.']);
      if (c.frost === 3) return say(['Tam! You brought him back.', 'Take this. I sewed it for him, but he says you need it more: a Frost Cloak. The mountains will not freeze you now.'], () => { c.frost = 4; give('frostcloak'); });
      return say(['Stay warm.']);
    }
    if (n.job === 'lost') {
      if (c.frost === 2) { const ok = P.count('torch') >= 3 && P.count('bread') >= 1; if (!ok) return say(['Cold. So cold. I cannot walk like this.', 'Three torches and something to eat. Please.']); return say(['Warmth. Food. Thank you.', 'I can make it home now. Tell Ysolde I am coming.'], () => { P.take('torch', 3); P.take('bread', 1); c.frost = 3; const i = people.findIndex(x => x.id === 'tam'); if (i >= 0) people.splice(i, 1); }); }
      return say(['Thank you.']);
    }
    if (n.job === 'merchant') {
      if (c.bridgeFixed) return say(['A pleasure doing business. Mind the step.', 'Oh, and for a customer of means, I keep a certain crown under the counter.'], relic('merchant'));
      return say(['Silas Pennywise, purveyor of solutions. Your problem, I see, is a canyon.', 'The bridge is out. Terrible shame. I could have it mended for, oh, 300 Shards. Or you could find your own way across, if you are the climbing sort.', G.shards >= 300 ? 'Shall we? (it takes your Shards)' : `You have ${G.shards}. Come back richer.`], () => { if (G.shards >= 300 && !c.bridgeFixed) { G.shards -= 300; c.bridgeFixed = true; fixBridge(sites().fort); G.meshPass(99); UI.sfx('caught'); UI.toast('The bridge is mended. Silas counts your Shards twice.', 'good'); } });
    }
    if (n.job === 'spellbound') return Keeps.talkWarrior(n, say);
    if (n.job === 'kinmaster_final') return Citadel.talk(n, say);
    if (n.job === 'professor') return Citadel.talkProf(n, say);
    if (n.job === 'farmer') return Farms.talk(n, say);
    if (['skyfolk', 'skymayor', 'skyguard', 'skytrader', 'skyfreed'].includes(n.job)) return Sky.talk(n, say);
    if (n.job === 'runesmith' && n.id === 'sable' && Keeps.finalReady() && !Citadel.open()) {
      return say(['You have it. All of it. Hold it up... there. Do you feel it pulling?', 'He bound himself to it when he bound the others. It knows where he is: not in the Core. He lied. He went to the Black Citadel, far out where nobody goes.', 'It will not be like the holds. He built that place to keep out exactly you. You will need everything: the glider, a Flame Kin, a Spark Kin, a Stone Kin, the bulb, your bow, your blade.', 'Go. End it.'], () => Citadel.begin());
    }
    if (n.job === 'runesmith' && n.id === 'sable' && Citadel.open() && !G.stats.lightReturned) return say(['The Black Citadel. Follow the pin. Glider, Flame, Spark, Stone, bulb, bow, blade.']);
    if (n.job === 'runesmith') {
      const first = !c['met_' + n.id]; c['met_' + n.id] = true;
      const intro = n.id === 'orrin' ? 'Orrin hums over a forge that burns blue.' : 'Sable traces sigils on the Kinmaster\'s old anvil.';
      return say(first ? (n.id === 'orrin' ? ['Orrin. Runesmith. Garrick lets me keep a forge at the back of his camp because I mend his picks for free.', 'Relics are not forged, they are grown, and they wear like anything living. When yours start to crack, come to me. Or to Sable, at Thornhold, if you can stand her. There are no others.', 'Do not leave it. A crack costs little. A ruin costs a fortune.'] : ['Sable. I mended the Kinmaster\'s things for twenty years. Now I mend yours.', 'Relics, only relics. Bring shards, bring the right stones, and do not let them break.']) : ['Show me what you have.'], () => UI.openPanel('runeforge', { who: n.name, intro }));
    }
    if (n.job === 'turncoat') {
      if (!c.turncoatMet) return say(['Wait. Do not call the guards, there are none left. I am not one of his.', 'Vesper. Eleven years in his service, and every one of them spent passing word to the villages when I could. Who do you think left the gate on the canyon side unbarred?', 'He ran for the Core with what he could carry. He could not carry the vault. I have been emptying it.', 'There are pieces in here no forge on Earth could make. Armour for a Kin, cut from the dark itself. I will not give them away: I need the shards to get out of this country alive.', 'But I will sell them to you. Only to you. Free enough villages that I know you mean it, and bring a fortune.'], () => { c.turncoatMet = true; relic('turncoat')(); });
      return say(['Still here. Still selling. Nobody else is buying.'], relic('turncoat'));
    }
    if (n.job === 'kinmaster') {
      if (c.kinmaster) return;
      const f = sites().fort;
      return say(['So you are the one freeing my villages. Grakor wrote to me about you, before you sent him packing.', 'Every tyrant was mine. Every square, every wall. And under all of it, in the Core, something older than both of us is waking. I mean to be the one it obeys.', 'You came all this way through my little puzzles. Let us see if your Kin are as clever as you.'], () => { if (bossRef && Wild.list.includes(bossRef)) { Battle.start(bossRef, false); return; } const sp = kinmasterSpecies(); const e = Wild.makeEntity(sp, Math.max(45, Math.min(70, G.trainerLevel + 12)), f.throne.x - 3 + 0.5, f.floorY + 1, f.throne.z + 0.5, { senseR: 12, elite: true }); e.kinmaster = true; bossRef = e; Wild.list.push(e); Battle.start(e, false); });
    }
    if (n.job === 'keeper') {
      if (G.stats.lostMap) return say([(G.stats.apex || {}).rex === true ? 'You caught it. The Tyrannorex. I took a tooth when it shed one in the cage, set it in amber. It is the only one there will ever be, and it is for sale, to you, at a price that will make you sit down.' : 'You found it? The country they come from? Bring me back something with teeth.'], relic('keeper'));
      if (!c.zoo) return say(['Welcome to Quill\'s Menagerie! Yes, that is a dinosaur. A real one. A Kin that should not exist.', 'I found it half-starved out past the far hills, wandering the trapper country. It came from somewhere. Nobody believes me.', 'Two people live out that way: Trapper Jo and Old Sela. If anyone knows where it came from, they do. Ask them.'], () => { c.zoo = 1; c.zooHeard = true; });
      return say(['Trapper Jo and Old Sela, out in the trapper country. Follow your compass.']);
    }
    if (n.job === 'halfA' || n.job === 'halfB') {
      if (G.stats.lostMap) return say(['Good luck out there.']);
      const mine = n.job === 'halfA' ? 'mapA' : 'mapB'; const other = n.job === 'halfA' ? 'mapB' : 'mapA';
      if (c[mine]) return say([c[other] ? 'You have both halves already.' : (n.job === 'halfA' ? 'Old Sela had a scrap like mine once. Try her.' : 'Jo the trapper has the other piece, I would bet.')]);
      const lines = n.job === 'halfA' ? ['A dinosaur? Barnaby\'s raptor. I caught it, I sold it to him, and I wish I had not.', 'It came out of a gully with this tied to its leg: half a map, torn. I cannot read it. Take it.'] : ['The old trails? My grandmother walked them. She left me this: half a map, no use to anyone.', 'If you have the other half, the lines might make sense. Take it, before I burn it.'];
      return say(lines, () => { c[mine] = true; G.player.add(mine, 1); if (c.mapA && c.mapB) setTimeout(() => { G.player.take('mapA', 1); G.player.take('mapB', 1); G.explain('The Kindex reads the map', 'The two halves fit. The lines are Kin trails, and your Kindex knows them: they all lead to one jungle on the far side of the world.'); G.giveLostMap('the two halves'); c.zoo = 3; }, 1200); });
    }
    if (n.job === 'hermit') {
      if (!c.glider) return say(['Up there, on the peak, a sky Kin keeps her nest on a pillar of rock. One egg every spring. Nobody has climbed the pillar: you cannot. You fall to it.', 'Take my glider. Climb the peak, jump, hold ▲ to glide, and come down on that pillar top. Walk the egg home and it will hatch into something that flies.', 'Listen, because the pillar is small. Read the wind first: the little compass shows where it blows. Start upwind of the pillar and let it carry you in.', 'The stick: sideways to turn, forward to dive and gather speed, back to brake. Hold back too long and she stalls and drops like a stone.', 'Coming down, keep your speed until the last moment, then pull back. That is the flare: the speed turns into lift and you touch down like a leaf. Let go of ▲ only when your feet are almost on it.', 'And no ladders, no digging. She knows.'], () => { c.glider = 1; give('glider'); });
      if (c.glider === 1) return say(['The pillar, from the peak. Start upwind, the compass shows it. Forward to dive, back to brake, and pull back just before you touch. Let go of ▲ only when you are almost down.']);
      if (!c.flightSnare) return say(['You brought it down whole. Good hands.', 'Now look up. Those birds wheeling high over the hills: they never land. They drop stones on walkers and laugh about it. A cage on the ground is no use to them.', 'This is a Flight Snare: a light cage on a long cord. It only works thrown from the air. Get above one on the glider, or on the back of a flier, pass close and tap it.', 'I will show you how to tie them. Two Snare Cubes and three Sky Feathers each pair. Feathers come down when you hit one of those birds with an arrow, or beat one. Here are three snares and some feathers to start.'], () => { c.flightSnare = true; give('snare_sky', 3); G.player.add('feather', 6); UI.toast('Flight Snare recipe learned. Throw them from the air only.', 'good'); });
      return say(['Walk the egg until it hatches. Then it will carry you, below the clouds at least. Higher than that is for ships.', 'And the high birds: from the air, with the Flight Snare. Feathers from arrows.', 'One more thing. I have a talon from the old queen of the high birds. I would sell it, to the right person, for the right sum.'], relic('hermit'));
    }
  }
  // the fisherman, from Village: the rod first, then the water egg after your first fish
  function fisherHook(n) {
    const c = C(); const P = G.player;
    if (!c.rod) { Dialogue.show(n.name, ['You again. You look like someone who has never held a rod.', 'Here: a whole rod, and a handful of berry bait. Face the water, tap to cast, and tap again when the marker crosses the glow. Bring me news of your first fish.'], () => { c.rod = 1; give('rod'); P.add('bait_berry', 4); }); return true; }
    if (c.rod === 1 && (G.stats.fished || 0) >= 1) { Dialogue.show(n.name, ['A fish! Well done. Really.', 'Oh, and I forgot. I found this in my net last week. An egg, slippery. I do not know what it does. You keep it. Walk it, they say, and it hatches.'], () => { const sp = waterEggSpecies(); sp.eggLabel = 'water egg'; if (G.addEgg(sp, n.name, 400)) { c.rod = 2; c.waterEgg = true; UI.toast('A water egg. It will hatch as you walk, into a Kin that can carry you through water.', 'good'); } }); return true; }
    return false;
  }

  // ---------- for the main quests ----------
  function target(id) {
    if (!onEarth()) return null; const S = sites(); const c = C();
    if (id === 'foreman' || id === 'ironpick' || id === 'lavasuit') return S.mine && { x: S.mine.x, z: S.mine.z, note: 'the Mining Camp' };
    if (id === 'mines' && S.mine) return { x: S.mine.x, z: S.mine.z, note: 'the shaft' };
    if (id === 'diver') { if (c.bulbStep === 1 && S.diver && S.diver.chest) return { x: S.diver.chest.x, z: S.diver.chest.z, note: 'the sunken chest' }; return S.diver && { x: S.diver.x, z: S.diver.z, note: 'Marisol\'s pier' }; }
    if (id === 'ranch') { if (c.ranch === 1) return { x: S.ranch.pen.x, z: S.ranch.pen.z, note: 'the paddock posts' }; if (c.ranch === 2 && !c.rogueTamed) return { x: S.ranch.pen.x, z: S.ranch.pen.z, note: 'Thunderhoof, in the paddock' }; return S.ranch && { x: S.ranch.x, z: S.ranch.z, note: 'Hale\'s Ranch' }; }
    if (id === 'frost') { c.snowKnown = true; if ((c.frost === 1 || c.frost === 2) && S.snow && S.snow.lost) return { x: S.snow.lost.x, z: S.snow.lost.z, note: 'Tam' }; return S.snow && { x: S.snow.x, z: S.snow.z, note: 'the snow camp' }; }
    if (id === 'kinmaster' && S.fort) return { x: S.fort.x + (c.st_fort ? 30 : -18), z: S.fort.z, note: 'Thornhold' };
    if (id === 'lost' && !G.stats.lostMap) { if (!c.zoo && S.zoo) return { x: S.zoo.x, z: S.zoo.z, note: 'Quill\'s Menagerie' }; if (S.halfA && !c.mapA) return { x: S.halfA.x, z: S.halfA.z, note: 'Trapper Jo' }; if (S.halfB && !c.mapB) return { x: S.halfB.x, z: S.halfB.z, note: 'Old Sela' }; }
    if (id === 'glider') { c.peakKnown = true; if (c.glider === 1 && S.peak) return { x: S.peak.x, z: S.peak.z, note: 'the peak' }; return S.peak && { x: S.peak.x, z: S.peak.z, note: 'Old Wren\'s peak' }; }
    return null;
  }
  function stampPosts() { const S = sites(); if (!S.ranch) return; const pen = S.ranch.pen; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = pen.x + a * 5, z = pen.z + b * 5; const g = world.groundY(x, z); world.setBlock(x, g + 1, z, B.BASALT); world.setBlock(x, g + 2, z, B.TORCH); } }
  function mapMarks() { if (!onEarth()) return []; const S = sites(); const out = []; if (S.mine) out.push({ x: S.mine.x, z: S.mine.z, t: '⛏', name: 'Mining Camp' }); if (S.diver) out.push({ x: S.diver.x, z: S.diver.z, t: '◍', name: 'Marisol\'s Pier' }); if (S.ranch) out.push({ x: S.ranch.x, z: S.ranch.z, t: '♞', name: 'Hale\'s Ranch' }); if (C().frost >= 0 && S.snow && C().snowKnown) out.push({ x: S.snow.x, z: S.snow.z, t: '❄', name: 'Snow Camp' }); if (S.peak && C().peakKnown) out.push({ x: S.peak.x, z: S.peak.z, t: '▲', name: 'Wren\'s Peak' }); if (S.fort && (C().kinmaster || (G.questState && Quests.current() && Quests.current().id === 'kinmaster'))) out.push({ x: S.fort.x + 30, z: S.fort.z, t: '♜', name: 'Thornhold' }); if (S.zoo && C().zooHeard) out.push({ x: S.zoo.x, z: S.zoo.z, t: '🦎', name: 'Quill\'s Menagerie' }); return out; }
  function talkable() { return people; }
  function entities() { return people.map(n => ({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: 1, hover: 0, skyMul: 1, src: n })); }
  function onRogueTamed(k) { C().rogueTamed = true; C().ranch = 3; if (rogue) { Wild.remove(rogue); rogue = null; } }
  return { getPerson: (id) => people.find(n => n.id === id) || null, removePerson: (id) => { const i = people.findIndex(n => n.id === id); if (i >= 0) people.splice(i, 1); return i; }, kinmasterSp: () => kinmasterSpecies(), spawnPerson: (...a) => person(...a), hasPerson: (id) => people.some(n => n.id === id), init, update, talk, fisherHook, tryGate, onBoss, target, talkable, entities, locked, give, sites, mapMarks, onRogueTamed, stampPosts, get rogue() { return rogue; }, C };
})();

// ---------- taming: you press Ride on an unbroken Kin and it bucks; tap when it lands its weight ----------
const Taming = (() => {
  let st = null, el = null;
  function start(k, opts = {}) {
    if (st) return;
    const hard = !!opts.hard; st = { k, ent: opts.ent || null, hits: 0, need: hard ? 6 : 4, pos: 0, dir: 1, speed: hard ? 1.7 : 1.15, zone: hard ? 0.22 : 0.28, center: 0.5, onDone: opts.onDone };
    st.center = 0.2 + Math.random() * 0.6;
    if (!el) { el = document.createElement('div'); el.id = 'tamebar'; el.innerHTML = '<div class="snare-tip"></div><div class="snare-track"><div class="snare-zone"></div><div class="snare-marker"></div></div>'; document.getElementById('touch-ui').appendChild(el); }
    el.classList.remove('hidden'); G.player.frozen = true; draw(); UI.sfx('alert');
    UI.toast(`${KIN.name(k)} bucks! Tap when the marker is in the glow. Stay on ${st.need} times.`);
  }
  function draw() { if (!st || !el) return; el.querySelector('.snare-tip').innerHTML = `Hold on! ${st.hits}/${st.need}<small>Tap anywhere when the white line is in the green</small>`; const z = el.querySelector('.snare-zone'); z.style.left = ((st.center - st.zone / 2) * 100) + '%'; z.style.width = (st.zone * 100) + '%'; el.querySelector('.snare-marker').style.left = (st.pos * 100) + '%'; }
  function update(dt, p) { if (!st) return; st.pos += st.dir * st.speed * dt; if (st.pos > 1) { st.pos = 1; st.dir = -1; } if (st.pos < 0) { st.pos = 0; st.dir = 1; } draw(); }
  function tap() {
    if (!st) return false;
    const ok = Math.abs(st.pos - st.center) <= st.zone / 2;
    if (ok) { st.hits++; UI.sfx('hit'); if (st.hits >= st.need) { const s = st; end(); s.k.tamed = true; UI.sfx('caught'); UI.toast(`${KIN.name(s.k)} stops fighting. It will carry you now.`, 'good'); if (s.onDone) s.onDone(s.k); else G.mountKin(s.k); return true; } st.center = 0.15 + Math.random() * 0.7; st.speed *= 1.04; draw(); return true; }
    const s = st; end(); const p = G.player; p.damage(1, 'thrown'); p.vy = 7; p.vx = (Math.random() - 0.5) * 6; p.vz = (Math.random() - 0.5) * 6; UI.sfx('down');
    UI.toast(`Thrown! ${KIN.name(s.k)} snorts and stands there. Try again.`, 'bad'); return true;
  }
  function end() { st = null; if (el) el.classList.add('hidden'); G.player.frozen = false; }
  return { start, update, tap, end, get active() { return !!st; }, get state() { return st; } };
})();
