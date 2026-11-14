'use strict';
// Up in the clouds on Earth, apart from the wild sky islands:
//  - Highmere, a sky city on a great cloud platform: a plaza, houses, a spire, its own people.
//  - Stormspire, an evil sky fortress a long way off: grey storm over it, the Storm Warden's warriors, then his Kin.
//  - Six small cloud isles scattered around, each with one person up there for reasons of their own, and a job for you.
// Everything is drawn into the chunks as they generate (like the towns), so none of it costs save space.
const Sky = (() => {
  let G = null, world = null, SITES = null, LAY = new Map(), tick = 0;
  const NCH = WORLD_W / CH;
  const onEarth = () => world && world.preset.id === 'earth';
  const st = () => { if (!G.stats.sky) G.stats.sky = {}; return G.stats.sky; };
  const ISLE_FOLK = [
    { name: 'Odile the Kite-Maker', job: 'kite', need: { feather: 6 }, reward: 450, say: ['Feathers. Sky Feathers, the long ones the high flyers drop. Six. My kites will not fly on anything less.', 'Shoot a high flyer with your bow, or beat one, and they come down.'], done: ['Oh, these are perfect. Here. And if you ever want a kite, I will remember your face.'] },
    { name: 'Brother Halloway', job: 'monk', need: { glowworm: 5 }, reward: 300, draught: true, say: ['I keep a lamp lit up here for travellers. The oil ran out a month ago.', 'Bring me five glowworms from the green country below and the lamp will burn again.'], done: ['Light. Thank you. Sit a while, if you like; nobody ever does.'] },
    { name: 'Pip Farrow', job: 'lost', need: { cloud: 12 }, reward: 350, egg: true, say: ['I came up on my uncle\'s glider and the glider went on without me.', 'I am building steps down out of Cloudstone. I need twelve more. Do not tell my mother.'], done: ['Twelve! I will be home by supper. Here, I found this egg in a cloud. It is warm. You have it.'] },
    { name: 'Madame Vey', job: 'astronomer', need: { glass: 4 }, reward: 400, say: ['From up here you can see the Moon\'s seas with a decent lens. I have no decent lens.', 'Four panes of glass. Sand in a furnace, you know the way.'], done: ['Clear as water. Come back at night and look through it with me.'] },
    { name: 'Corwin Ash', job: 'hermit', need: { berry: 15 }, reward: 250, say: ['I came up here to be alone. It turns out alone is hungry.', 'Fifteen berries. Do not stay to chat.'], done: ['Hm. Thank you. Now go away. Kindly.'] },
    { name: 'Saskia Reeve', job: 'smuggler', need: { gold: 3 }, reward: 900, say: ['You did not see me. There is no cargo. This is a perfectly ordinary cloud.', 'But if someone brought three gold bars to a perfectly ordinary cloud, they would be paid very well.'], done: ['Pleasure. We never met.'] },
  ];
  const CITY_FOLK = [
    { id: 'sky_mayor', name: 'Lady Aurelle', job: 'skymayor', col: { body: '#e8eef8', belly: '#f2d6b8', accent: '#7aa8ff' }, dx: 0, dz: 4 },
    { id: 'sky_trader', name: 'Fennick the Windtrader', job: 'skytrader', col: { body: '#4a7ab0', belly: '#e8c39e', accent: '#ffd040' }, dx: -8, dz: -3 },
    { id: 'sky_guard', name: 'Captain Ilse', job: 'skyguard', col: { body: '#b8c4d8', belly: '#e0b896', accent: '#3a5a8a' }, dx: 6, dz: -9 },
  ];
  function init(game) { G = game; world = game.world; SITES = null; LAY.clear(); }
  function sites() {
    if (SITES) return SITES; if (!onEarth()) return (SITES = []); if (!world.spawn) return [];
    const sp = world.spawn || { x: 0, z: 0 }, s = world.seed || 1; const a0 = U.hash3(3, 401, 7, s) * Math.PI * 2;
    // keep every sky place well clear of high ground: no peak to glide from, only wings get you up there
    const clear = (x, z, y) => { for (let dx = -96; dx <= 96; dx += 12) for (let dz = -96; dz <= 96; dz += 12) { if (dx * dx + dz * dz > 96 * 96) continue; const h = world.colInfo(x + dx, z + dz).h; if (h > y - 24) return false; } return true; };
    const fit = (a, d, y) => { for (let t = 0; t < 14; t++) { const D = d + t * 70, x = Math.round(sp.x + Math.cos(a) * D), z = Math.round(sp.z + Math.sin(a) * D); if (clear(x, z, y)) return { x, z }; } return { x: Math.round(sp.x + Math.cos(a) * d), z: Math.round(sp.z + Math.sin(a) * d) }; };
    const out = [Object.assign({ id: 'highmere', kind: 'city', name: 'Highmere', y: 92, R: 26 }, fit(a0, 560, 92)), Object.assign({ id: 'stormspire', kind: 'fort', name: 'Stormspire', y: 94, R: 17 }, fit(a0 + 2.6, 1350, 94))];
    for (let i = 0; i < 6; i++) { const a = a0 + 0.7 + i * 1.03 + U.hash3(i, 402, 1, s) * 0.4, d = 280 + i * 210 + U.hash3(i, 403, 2, s) * 90; const y = 88 + (i % 3) * 2; out.push(Object.assign({ id: 'isle' + i, kind: 'isle', name: ISLE_FOLK[i].name.split(' ').slice(-1)[0] + '\'s Cloud', folk: ISLE_FOLK[i], y, R: 9 + (i % 3) }, fit(a, d, y))); }
    // the Skyroot: a giant tree on low ground, with nothing high within reach of the cloud chain above it
    { let tree = null; for (let t = 0; t < 24 && !tree; t++) { const a = a0 + 4.4 + t * 0.13, D = 360 + t * 35; const x = Math.round(sp.x + Math.cos(a) * D), z = Math.round(sp.z + Math.sin(a) * D); const h = world.colInfo(x, z).h; if (h <= SEA + 1 || h > 58) continue; let ok = true; for (let dx = -150; dx <= 150 && ok; dx += 15) for (let dz = -150; dz <= 150; dz += 15) if (world.colInfo(x + dx, z + dz).h > 64) { ok = false; break; } if (ok) tree = { x, z, h }; }
      if (!tree) { const x = Math.round(sp.x + Math.cos(a0 + 4.4) * 360), z = Math.round(sp.z + Math.sin(a0 + 4.4) * 360); tree = { x, z, h: world.colInfo(x, z).h }; }
      out.push({ id: 'skyroot', kind: 'tree', name: 'the Skyroot', x: tree.x, z: tree.z, h: tree.h, y: Math.min(72, tree.h + 30), R: 12 }); }
    return (SITES = out);
  }
  // ---------- drawing ----------
  function layout(k) {
    if (LAY.has(k.id)) return LAY.get(k.id); const buckets = new Map();
    const put = (x, y, z, id) => { if (y < 1 || y >= WH) return; const key = U.mod(Math.floor(x / CH), NCH) + ',' + U.mod(Math.floor(z / CH), NCH); let b = buckets.get(key); if (!b) buckets.set(key, b = []); b.push(U.mod(x, CH), y, U.mod(z, CH), id); };
    const X = k.x, Z = k.z, Y = k.y, R = k.R;
    // the cloud: a rounded slab, thicker in the middle, glowgrass on top
    if (k.kind !== 'tree') for (let dx = -R - 2; dx <= R + 2; dx++) for (let dz = -R - 2; dz <= R + 2; dz++) {
      const d = Math.hypot(dx, dz) + U.hash3(X + dx, 404, Z + dz, 9) * 2.2; if (d > R) continue;
      const th = Math.max(2, Math.round((1 - d / R) * (k.kind === 'city' ? 9 : 6)) + 1);
      for (let y = Y - th; y < Y; y++) put(X + dx, y, Z + dz, B.CLOUD); put(X + dx, Y, Z + dz, k.kind === 'fort' ? B.BASALT : B.CLOUD);
    }
    // a sky house: plaster walls on a stone footing with timber at the corners, framed windows with flower boxes, a slate roof pitched so the
    // gable faces the door, a lamp inside. (hx, hz) is the centre, the door opens toward (dirX, dirZ)
    const house = (hx, hz, dirX, dirZ, wallB, roofB) => {
      const alongX = dirX !== 0; const sgn = alongX ? dirX : dirZ; const A = (dx, dz) => alongX ? dx : dz, Bc = (dx, dz) => alongX ? dz : dx;
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        const x = hx + dx, z = hz + dz, a = A(dx, dz), bb = Bc(dx, dz); const inside = Math.abs(dx) <= 2 && Math.abs(dz) <= 2;
        for (let y = Y + 1; y <= Y + 8; y++) put(x, y, z, B.AIR);
        if (inside) {
          put(x, Y, z, B.MASONRY);
          const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2, corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
          const win = (Math.abs(dx) === 2 && dz === 0) || (Math.abs(dz) === 2 && dx === 0); const doorway = a === 2 * sgn && bb === 0;
          for (let y = Y + 1; y <= Y + 3; y++) { let id = B.AIR; if (wall) { id = corner ? B.BEAM : wallB; if (win && y === Y + 2) id = B.GLASS; if (doorway) id = y === Y + 3 ? B.BEAM : B.AIR; } put(x, y, z, id); }
          if (Math.abs(a) === 2 && Math.abs(bb) <= 1) for (let y = Y + 4; y < Y + 3 + (3 - Math.abs(bb)); y++) put(x, y, z, bb === 0 && y === Y + 5 ? B.GLASS : wallB); // the gables, a little window in each
        }
        put(x, Y + 3 + (3 - Math.abs(bb)), z, roofB);
      }
      for (const [wa, wb] of [[0, 3], [0, -3]]) { const dx = alongX ? wa : wb, dz = alongX ? wb : wa; put(hx + dx, Y + 2, hz + dz, B.FLOWERBOX); }
      put(hx, Y + 3, hz, B.LAMP);
    };
    if (k.kind === 'city') {
      for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) if (Math.hypot(dx, dz) <= 6.5) put(X + dx, Y, Z + dz, B.COBBLE); // the plaza
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.hypot(a, b) <= 2.5) put(X + a, Y + 1, Z + b, (a || b) ? B.BASIN : B.FOUNTAIN); // the wind-fountain
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, r = 15; const hx = Math.round(X + Math.cos(a) * r), hz = Math.round(Z + Math.sin(a) * r); const dirX = Math.abs(Math.cos(a)) > 0.5 ? -Math.sign(Math.cos(a)) : 0, dirZ = dirX ? 0 : -Math.sign(Math.sin(a)); house(hx, hz, dirX, dirZ, i % 3 === 2 ? B.PLANKS : B.PLASTER, i % 2 ? B.SLATE : B.TILES); }
      // the spire: a round tower of dressed stone, ten high, a slate cap, banners, a lamp at the top; the ladder inside
      const sx = X, sz = Z - 10;
      for (let y = Y + 1; y <= Y + 10; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const d = Math.hypot(dx, dz); if (d > 2.6) continue; put(sx + dx, y, sz + dz, d > 1.6 ? ((y === Y + 4 || y === Y + 8) && (dx === 0 || dz === 0) ? B.GLASS : B.MASONRY) : B.AIR); }
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const m = Math.max(Math.abs(dx), Math.abs(dz)); if (Math.hypot(dx, dz) <= 3.6) put(sx + dx, Y + 11 + (3 - m), sz + dz, B.SLATE); } // the cap, a pyramid with eaves
      put(sx, Y + 1, sz + 2, B.AIR); put(sx, Y + 2, sz + 2, B.AIR); for (let y = Y + 1; y <= Y + 10; y++) put(sx, y, sz - 1, B.LADDER); put(sx, Y + 10, sz, B.AIR); put(sx, Y + 15, sz, B.LAMP);
      for (const [a, b] of [[3, 0], [-3, 0], [0, 3]]) put(sx + a, Y + 6, sz + b, B.BANNER);
      // the rail round the edge, lamps at intervals, flowers in the grass
      for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; const x = Math.round(X + Math.cos(a) * (R - 2)), z = Math.round(Z + Math.sin(a) * (R - 2)); if (Math.abs(x - X) < 3 && z > Z + R - 6) continue; put(x, Y + 1, z, i % 9 ? B.FENCE : B.LAMP); }
      for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) if (Math.hypot(dx, dz) < R - 4 && Math.hypot(dx, dz) > 8 && U.hash3(X + dx, 405, Z + dz, 3) < 0.06) put(X + dx, Y + 1, Z + dz, B.FLOWERS);
    } else if (k.kind === 'fort') {
      const F = B.FORTSTONE;
      for (let d = -11; d <= 11; d++) for (let y = Y + 1; y <= Y + 6; y++) { const slit = y === Y + 4 && d % 3 === 0 && Math.abs(d) < 10; put(X + d, y, Z - 11, slit ? B.SLIT : F); put(X + d, y, Z + 11, slit ? B.SLIT : F); put(X - 11, y, Z + d, slit ? B.SLIT : F); put(X + 11, y, Z + d, slit ? B.SLIT : F); if (y === Y + 6 && d % 2 === 0) { put(X + d, Y + 7, Z - 11, F); put(X + d, Y + 7, Z + 11, F); put(X - 11, Y + 7, Z + d, F); put(X + 11, Y + 7, Z + d, F); } }
      for (const [a, b] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let y = Y + 1; y <= Y + 8; y++) put(X + a + i, y, Z + b + j, F); put(X + a, Y + 9, Z + b, B.VOID); put(X + a - Math.sign(a) * 2, Y + 6, Z + b, B.BANNER); }
      for (let d = -1; d <= 1; d++) for (let y = Y + 1; y <= Y + 3; y++) put(X + d, y, Z - 11, B.AIR);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) put(X + i, Y + 1, Z + 4 + j, F); put(X, Y + 2, Z + 4, B.VOID);
      for (let z = Z - 10; z <= Z + 2; z++) put(X, Y, z, B.CORAL_R);
      for (const [a, b] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) put(X + a, Y + 1, Z + b, B.FIREPIT);
      // dressed as the Storm Warden's stronghold: dark footings and ember slots in place of pale ones, corner towers under spires, a
      // twin-turreted gatehouse, and the spire itself: a tower behind the dais that climbs in three stages to a storm light
      for (let d = -11; d <= 11; d++) for (const [x, z] of [[X + d, Z - 11], [X + d, Z + 11], [X - 11, Z + d], [X + 11, Z + d]]) { if (Math.abs(d) <= 1 && z === Z - 11) continue; put(x, Y + 1, z, B.BASALT); if (d % 3 === 0 && Math.abs(d) < 10) put(x, Y + 4, z, B.EMBERLIGHT); }
      // (the sky has a ceiling nine blocks over this floor, so nothing here climbs past it: the spire is broad and stepped, not tall)
      for (const [a, b] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) { put(X + a, Y + 6, Z + b + Math.sign(b), B.EMBER); put(X + a + Math.sign(a), Y + 6, Z + b, B.EMBER); put(X + a, Y + 5, Z + b + Math.sign(b) * 2, B.BANNER); for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(X + a + i, Y + 9, Z + b + j, F); }
      for (const sx of [-1, 1]) { for (let i = 2; i <= 3; i++) for (let j = -13; j <= -11; j++) for (let y = Y + 1; y <= Y + 8; y++) put(X + sx * i, y, Z + j, y === Y + 1 ? B.BASALT : F);
        put(X + sx * 2, Y + 9, Z - 12, B.VOID); put(X + sx * 3, Y + 9, Z - 13, F); put(X + sx * 3, Y + 9, Z - 11, F); put(X + sx * 3, Y + 4, Z - 14, B.EMBER); put(X + sx * 2, Y + 6, Z - 14, B.BANNER); }
      for (let d = -1; d <= 1; d++) { for (let j = -13; j <= -11; j++) { for (let y = Y + 1; y <= Y + 3; y++) put(X + d, y, Z + j, B.AIR); for (let y = Y + 5; y <= Y + 7; y++) put(X + d, y, Z + j, F); put(X + d, Y, Z + j, B.BASALT); } put(X + d, Y + 4, Z - 12, B.IRONWALL); put(X + d, Y + 4, Z - 13, F); put(X + d, Y + 4, Z - 11, F); }
      put(X, Y + 6, Z - 13, B.EMBER); put(-1 + X, Y + 8, Z - 13, F); put(1 + X, Y + 8, Z - 13, F);
      { for (let a = -4; a <= 4; a++) for (let b = -3; b <= 2; b++) for (let y = Y + 1; y <= Y + 5; y++) put(X + a, y, Z + 8 + b, y === Y + 1 ? B.BASALT : F); // the keep: a broad base against the back wall
        for (let a = -5; a <= 5; a++) for (let b = -4; b <= 2; b++) if (Math.abs(a) === 5 || b === -4) { put(X + a, Y + 5, Z + 8 + b, F); if ((a + b) % 2 === 0) put(X + a, Y + 6, Z + 8 + b, F); }
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 1; b++) for (let y = Y + 6; y <= Y + 8; y++) put(X + a, y, Z + 8 + b, F); // and the spire's stump on it
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 1; b++) put(X + a, Y + 9, Z + 8 + b, (Math.abs(a) === 2 || b === -2 || b === 1) ? ((a + b) % 2 === 0 ? F : B.AIR) : B.VOID);
        for (const a of [-3, 0, 3]) put(X + a, Y + 4, Z + 5, B.EMBER); for (const a of [-1, 1]) put(X + a, Y + 7, Z + 6, B.EMBER);
        for (let yy = Y + 1; yy <= Y + 3; yy++) put(X, yy, Z + 5, yy === Y + 3 ? B.EMBER : B.BASALT); for (const a of [-2, 2]) put(X + a, Y + 3, Z + 4, B.BANNER); }
    } else if (k.kind === 'tree') {
      const H = k.h, T = Y, s = world.seed || 1;
      // the trunk, five wide with the corners off, and roots spreading at the foot
      for (let y = H - 2; y <= T; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue; put(X + dx, y, Z + dz, B.LOG); }
      for (const [a, b] of [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 2], [-3, -2], [2, -3], [-2, 3]]) { const gy = world.colInfo(X + a, Z + b).h; for (let y = gy; y <= Math.max(gy, H + 1); y++) put(X + a, y, Z + b, B.LOG); if (Math.abs(a) === 3 && !b) put(X + a + Math.sign(a), gy, Z + b, B.LOG); if (Math.abs(b) === 3 && !a) put(X + a, gy, Z + b + Math.sign(b), B.LOG); }
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const gy = world.colInfo(X + dx, Z + dz).h; for (let y = gy + 1; y <= H + 6; y++) if (Math.abs(dx) + Math.abs(dz) > 2 && !(Math.abs(dx) <= 2 && Math.abs(dz) <= 2)) put(X + dx, y, Z + dz, B.AIR); } // clear the brush round the foot
      // the ladder up the south face, a plank perch every ten rungs
      for (let y = H - 1; y <= T + 2; y++) { put(X, y, Z + 3, B.LADDER); for (let dx = -1; dx <= 1; dx++) for (let dz = 3; dz <= 5; dz++) if (y > H + 1 && y < T - 3) put(X + dx, y, Z + dz, B.AIR); if ((y - H) % 10 === 0 && y > H + 1 && y < T - 3) { for (const dx of [-1, 1]) put(X + dx, y, Z + 3, B.PLANKS); put(X, y, Z + 4, B.PLANKS); for (const dx of [-1, 1]) put(X + dx, y, Z + 4, B.PLANKS); } }
      // branches at three heights, each a limb out from the trunk with a ball of leaves at the end
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.6, by = T - 16 + i * 2.6; const L = 6 + (i % 3); const ux = Math.cos(a), uz = Math.sin(a); for (let d = 2; d <= L; d++) put(Math.round(X + ux * d), Math.round(by + d * 0.25), Math.round(Z + uz * d), B.LOG); const ex = Math.round(X + ux * L), ey = Math.round(by + L * 0.25), ez = Math.round(Z + uz * L); for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) if (Math.hypot(dx, dy * 1.2, dz) <= 3.2 && U.hash3(ex + dx, ey + dy, ez + dz, 7) > 0.15) put(ex + dx, ey + dy, ez + dz, B.LEAVES); }
      // the crown: a dome of leaves over the top, hollowed over the platform
      for (let dx = -10; dx <= 10; dx++) for (let dy = -3; dy <= 8; dy++) for (let dz = -10; dz <= 10; dz++) { const r = Math.hypot(dx / 10, (dy - 2) / 6, dz / 10); if (r > 1) continue; const flat = Math.hypot(dx, dz); if (dy >= 1 && dy <= 4 && flat <= 5.5) continue; if (Math.abs(dx) <= 2 && Math.abs(dz) <= 2 && dy <= 0) continue; if (dx === 0 && dz >= 3 && dz <= 5 && dy <= 4) continue; if (r > 0.78 && U.hash3(X + dx, T + dy, Z + dz, 8) < 0.25) continue; put(X + dx, T + dy, Z + dz, B.LEAVES); }
      for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) { const d = Math.hypot(dx, dz); if (d > 5.2) continue; if (dx === 0 && dz === 3) continue; put(X + dx, T + 1, Z + dz, d > 4.4 ? B.FENCE : B.PLANKS); for (let y = T + 2; y <= T + 4; y++) put(X + dx, y, Z + dz, B.AIR); }
      put(X, T + 1, Z + 3, B.LADDER); put(X, T + 2, Z + 3, B.LADDER); put(X - 2, T + 2, Z - 2, B.LAMP); put(X + 2, T + 2, Z + 2, B.LAMP);
      // the Tangle: scraps of cloud strung out from the crown on rickety bridges, up and down, doubling back, with dead ends
      const P = tangle(k); const slab = (c) => { const rr = c.r; for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) for (let dz = -Math.ceil(rr); dz <= Math.ceil(rr); dz++) { const d = Math.hypot(dx, dz) + (U.hash3(c.x + dx, 409, c.z + dz, 2) - 0.5) * 0.8; if (d > rr) continue; put(c.x + dx, c.y, c.z + dz, B.CLOUD); put(c.x + dx, c.y - 1, c.z + dz, B.CLOUD); if (d < rr - 1.2) put(c.x + dx, c.y - 2, c.z + dz, B.CLOUD); for (let y = c.y + 1; y <= c.y + 4; y++) put(c.x + dx, y, c.z + dz, B.AIR); } };
      for (const c of P.pieces) slab(c);
      const bridge = (A, Bp) => { // a four-connected run of bridge blocks from inside A's edge to inside B's, the height stepping one block at a time
        const dx = Bp.x - A.x, dz = Bp.z - A.z, L = Math.hypot(dx, dz) || 1; const ux = dx / L, uz = dz / L; const t0 = A.r - 1.3, t1 = L - Bp.r + 1.3; const n = Math.ceil((t1 - t0) * 2);
        const cells = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; const x = Math.round(A.x + ux * t), z = Math.round(A.z + uz * t); const last = cells[cells.length - 1]; if (last && last[0] === x && last[1] === z) continue; if (last && last[0] !== x && last[1] !== z) cells.push([x, last[1]]); cells.push([x, z]); }
        for (let i = 0; i < cells.length; i++) { const [x, z] = cells[i]; const y = Math.round(A.y + (Bp.y - A.y) * i / (cells.length - 1)); put(x, y, z, B.ROPEBRIDGE); for (let yy = y + 1; yy <= y + 3; yy++) put(x, yy, z, B.AIR); } };
      for (const [a, b] of P.links) bridge(P.pieces[a], P.pieces[b]);
      // the gate in the crown's rail where the first bridge leaves, the far cloud's chest, lamp and flowers
      const first = P.pieces[0]; const ga = Math.atan2(first.z - Z, first.x - X); put(X + Math.round(Math.cos(ga) * 4.7), T + 1, Z + Math.round(Math.sin(ga) * 4.7), B.PLANKS); put(X + Math.round(Math.cos(ga) * 5), T + 1, Z + Math.round(Math.sin(ga) * 5), B.PLANKS);
      for (let d = 4; d <= 12; d += 0.5) for (let off = -1.5; off <= 1.5; off += 0.5) for (let dy = 1; dy <= 4; dy++) put(Math.round(X + Math.cos(ga) * d - Math.sin(ga) * off), T + dy, Math.round(Z + Math.sin(ga) * d + Math.cos(ga) * off), B.AIR); // the way out through the leaves
      for (const [a, b] of P.links) { const A = P.pieces[a], Bp = P.pieces[b]; const dx = Bp.x - A.x, dz = Bp.z - A.z, L = Math.hypot(dx, dz) || 1; for (let t = 0; t <= L; t += 0.5) { const x = Math.round(A.x + dx / L * t), z = Math.round(A.z + dz / L * t), y = Math.round(A.y + (Bp.y - A.y) * t / L); for (let yy = y + 1; yy <= y + 3; yy++) for (const [ox, oz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (world.getBlock(x + ox, yy, z + oz) === B.LEAVES) put(x + ox, yy, z + oz, B.AIR); } }
      const end = P.pieces[P.end]; put(end.x + 3, end.y + 1, end.z + 3, B.CHEST); put(end.x - 3, end.y + 1, end.z - 3, B.LAMP); for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) if (Math.hypot(dx, dz) < 5 && U.hash3(end.x + dx, 410, end.z + dz, 5) < 0.12) put(end.x + dx, end.y + 1, end.z + dz, B.FLOWERS);
    } else {
      house(X, Z, -1, 0, B.PLASTER, B.THATCH);
      for (const [a, b] of [[-6, -4], [-6, 4]]) put(X + a, Y + 1, Z + b, B.LAMP);
      for (let d = -4; d <= 4; d++) { put(X + 5, Y + 1, Z + d, B.FENCE); } for (let d = 1; d <= 4; d++) { put(X + d, Y + 1, Z - 4, B.FENCE); put(X + d, Y + 1, Z + 4, B.FENCE); }
      for (let dx = 1; dx <= 4; dx++) for (let dz = -3; dz <= 3; dz++) if (U.hash3(X + dx, 406, Z + dz, 4) < 0.5) put(X + dx, Y + 1, Z + dz, B.FLOWERS); // a flower garden behind
    }
    const L = { buckets }; LAY.set(k.id, L); return L;
  }
  // the plan of the Tangle: a chain of a dozen scraps from the crown, each bridge turning, climbing or dropping, with dead-end spurs
  const TANGLES = new Map();
  function tangle(k) {
    if (TANGLES.has(k.id)) return TANGLES.get(k.id);
    const s = world.seed || 1; const hp = (i, j) => U.hash3(i, j, 411, s); const sp = world.spawn || { x: 0, z: 0 };
    let ang = Math.atan2(k.z - sp.z, k.x - sp.x) + (hp(0, 0) - 0.5) * 1.2; // out, away from the start
    const pieces = [], links = []; let px = k.x + Math.cos(ang) * 13, pz = k.z + Math.sin(ang) * 13, py = k.y + 1;
    pieces.push({ x: Math.round(px), y: py, z: Math.round(pz), r: 2.6 });
    const N = 12; let lastMain = 0;
    for (let i = 1; i <= N; i++) {
      ang += (hp(i, 1) - 0.5) * 2.2; const len = 9 + hp(i, 2) * 5; let dy = Math.floor((hp(i, 3) - 0.3) * 5); // -2..3
      if (py + dy > k.y + 12) dy = -2; if (py + dy < k.y - 2) dy = 2;
      px += Math.cos(ang) * len; pz += Math.sin(ang) * len; py += dy;
      const last = i === N; pieces.push({ x: Math.round(px), y: py, z: Math.round(pz), r: last ? 6 : 1.8 + hp(i, 4) * 1.4 });
      links.push([lastMain, pieces.length - 1]); lastMain = pieces.length - 1;
      if (!last && i >= 2 && hp(i, 5) < 0.35) { // a dead end off to one side
        const sa = ang + (hp(i, 6) < 0.5 ? 1.5 : -1.5); const sl = 7 + hp(i, 7) * 4; const sy = py + Math.floor((hp(i, 8) - 0.5) * 4);
        pieces.push({ x: Math.round(px + Math.cos(sa) * sl), y: sy, z: Math.round(pz + Math.sin(sa) * sl), r: 1.6, spur: true }); links.push([lastMain, pieces.length - 1]);
      }
    }
    const plan = { pieces, links, end: lastMain }; TANGLES.set(k.id, plan); return plan;
  }
  function overlay(chunk) {
    if (!onEarth()) return; const key = U.mod(chunk.cx, NCH) + ',' + U.mod(chunk.cz, NCH);
    for (const k of sites()) { const ops = layout(k).buckets.get(key); if (!ops) continue; const bl = chunk.blocks; for (let i = 0; i < ops.length; i += 4) bl[(ops[i] * CH + ops[i + 2]) * WH + ops[i + 1]] = ops[i + 3]; }
  }
  const patched = new Set();
  function patchLoaded(k) {
    if (patched.has(k.id)) return; patched.add(k.id); const L = layout(k); let any = false;
    for (const c of world.chunks.values()) { const key = U.mod(c.cx, NCH) + ',' + U.mod(c.cz, NCH); const ops = L.buckets.get(key); if (!ops) continue; const bl = c.blocks; for (let i = 0; i < ops.length; i += 4) bl[(ops[i] * CH + ops[i + 2]) * WH + ops[i + 1]] = ops[i + 3]; world.reapplyEdits(c); c.dirty = true; any = true; }
    if (any) G.meshPass(99);
  }
  // ---------- people ----------
  const dist = (k, p) => Math.hypot(k.x - p.x, k.z - p.z);
  function place(n, x, y, z) { n.x = x + 0.5; n.y = y + 1; n.z = z + 0.5; }
  function people(k) {
    if (k.kind === 'city') for (const f of CITY_FOLK) { if (Campaign.hasPerson(f.id)) continue; const n = Campaign.spawnPerson(f.id, f.name, f.job, k.x + f.dx, k.z + f.dz, f.col, []); place(n, k.x + f.dx, k.y, k.z + f.dz); }
    if (k.kind === 'isle' && !Campaign.hasPerson('sky_' + k.id)) { const n = Campaign.spawnPerson('sky_' + k.id, k.folk.name, 'skyfolk', k.x + 1, k.z + 3, { body: '#8a9ab8', belly: '#e8c39e', accent: '#e0e8ff' }, []); place(n, k.x + 1, k.y, k.z + 3); n.isle = k.id; }
    if (k.kind === 'fort' && st().fortTaken && !Campaign.hasPerson('sky_freed')) { const n = Campaign.spawnPerson('sky_freed', 'Freed sky-guard', 'skyfreed', k.x + 2, k.z, { body: '#b8c4d8', belly: '#e0b896', accent: '#3a5a8a' }, []); place(n, k.x + 2, k.y, k.z); }
  }
  // ---------- the fortress ----------
  let boss = null;
  function wardenSpecies() { const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer === 'Sky' && (sp.rarity || 0) >= 2); const any = pool.length ? pool : KIN.dex('earth').filter(sp => !sp.fusion && (sp.rarity || 0) === 3); return any[Math.floor(U.hash3(5, 405, 5, world.seed || 1) * any.length)]; }
  function fortTick(k, p, d) {
    const s = st(); if (s.fortTaken) { if (Combat.forHold(k.id).length) Combat.clearHold(k.id); return; }
    if (d < 60 && Math.abs(p.y - k.y) < 20 && !Combat.forHold(k.id).length) { for (const [kind, ox, oz] of [['guard', -3, -6], ['guard', 3, -6], ['archer', -7, 6], ['archer', 7, 6], ['shield', 0, -3], ['axeman', -5, 0], ['axeman', 5, 0], ['captain', 0, 1]]) Combat.spawn(kind, k.x + ox + 0.5, k.y + 1, k.z + oz + 0.5, k.id, 7); if (!s.fortSeen) { s.fortSeen = true; UI.toast('Stormspire. The Storm Warden\'s fortress, riding the clouds. His men are on the walls.', 'bad'); } }
    if (d > 160 && Combat.forHold(k.id).length) Combat.clearHold(k.id);
    if (d < 50 && Combat.forHold(k.id).length && Combat.standingIn(k.id) === 0 && (!boss || !Wild.list.includes(boss))) {
      const sp = wardenSpecies(); if (!sp) return; const lv = Math.max(40, (G.trainerLevel || 1) + 12);
      const e = Wild.makeEntity(sp, lv, k.x + 0.5, k.y + 1, k.z + 2.5, { senseR: 7 }); e.skyBoss = true; e.elite = true; e.speed = 0; Wild.list.push(e); boss = e;
      UI.toast('His warriors are down. The Storm Warden sends out his Kin.', 'bad');
    }
  }
  // ---------- the Skyroot and the Tangle ----------
  let tangleBoss = null;
  function tangleSpecies() { const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer === 'Sky' && (sp.rarity || 0) >= 1); const any = pool.length ? pool : KIN.dex('earth').filter(sp => !sp.fusion && (sp.rarity || 0) >= 2); return any[Math.floor(U.hash3(6, 412, 6, world.seed || 1) * any.length)]; }
  function treeTick(k, p, d) {
    const s = st(); const P = tangle(k); const end = P.pieces[P.end];
    if (!s.seen_skyroot && d < 70) { s.seen_skyroot = true; UI.toast('The Skyroot. A ladder runs up its trunk, and something is strung out from its crown.', 'good'); }
    if (!s.tangleSeen && Math.hypot(p.x - P.pieces[0].x, p.z - P.pieces[0].z) < 6 && Math.abs(p.y - P.pieces[0].y) < 4) { s.tangleSeen = true; UI.toast('The Tangle. Scraps of cloud on rope bridges, one block wide. Mind the drop.', 'bad'); }
    if (s.tangleDone) return;
    const de = Math.hypot(p.x - end.x, p.z - end.z);
    if (de < 10 && Math.abs(p.y - end.y) < 6 && (!tangleBoss || !Wild.list.includes(tangleBoss))) {
      const sp = tangleSpecies(); if (!sp) return; const lv = Math.max(24, (G.trainerLevel || 1) + 7);
      const e = Wild.makeEntity(sp, lv, end.x + 0.5, end.y + 1, end.z - 2.5, { senseR: 6 }); e.tangleBoss = true; e.elite = true; e.speed = 0; Wild.list.push(e); tangleBoss = e;
      UI.toast('Something has made its nest at the end of the Tangle, and it does not want company.', 'bad');
    }
  }
  function rootHint(n, v) {
    const k = sites().find(x => x.kind === 'tree'); if (!k) return false; const s = st(); if (s.rootTold) return false; s.rootTold = true;
    const dx = k.x - v.x, dz = k.z - v.z; const dist = Math.round(Math.hypot(dx, dz)); const dirs = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east']; const dir = dirs[Math.round(((Math.atan2(dz, dx) / Math.PI) * 4 + 8)) % 8];
    Dialogue.show(n.name, ['Now the square is ours again, a thing I was keeping to myself. There is a tree out there taller than the hills, the Skyroot, about ' + dist + ' paces ' + dir + ' of here. Somebody nailed a ladder up it, long ago.', 'The ones who climbed it came back talking about bridges in the sky, scraps of cloud strung together, and something living at the far end. None of them went twice. I have marked it on your map; the ledger can wait until you are back.']);
    return true;
  }
  function onBattle(result, ent) {
    if (ent && ent.tangleBoss) { if (result !== 'won' && result !== 'caught') return; const s = st(); s.tangleDone = true; tangleBoss = null; G.shards += 1500; G.addTrainerXp(350); G.player.add('feather', 6); G.player.add('cloud', 12); UI.sfx('quest'); G.explain('The end of the Tangle', 'The nest is yours. 1500 shards, six Sky Feathers and an armful of cloudstone, and the long way back is a stroll now you know it.'); return; }
    if (result !== 'won' && result !== 'caught') return; const s = st(); s.fortTaken = true; boss = null; G.shards += 3000; G.addTrainerXp(600); G.player.add('feather', 10); UI.sfx('quest');
    G.explain('Stormspire falls', 'The Storm Warden\'s Kin goes down and the storm over Stormspire tears open. His sky-guards blink at the sun like men waking up. 3000 shards, and the sky over it is clear for good.');
  }
  function inFort(p) { const k = sites().find(x => x.kind === 'fort'); return !!(k && !st().fortTaken && dist(k, p) < 16 && Math.abs(p.y - k.y) < 10); }
  function gloom(px, pz) { if (!onEarth()) return 0; const k = sites().find(x => x.kind === 'fort'); if (!k || st().fortTaken) return 0; const d = Math.hypot(k.x - px, k.z - pz); return d > 220 ? 0 : Math.min(1, (220 - d) / 140); }
  // ---------- talk ----------
  function talk(n, say) {
    const s = st(); const P = G.player;
    if (n.job === 'skyfolk') {
      const k = sites().find(x => x.id === n.isle); const f = k.folk; const key = 'done_' + k.id;
      if (s[key]) return say([`${f.name} nods at you. The cloud is quiet.`]);
      const has = Object.keys(f.need).every(i => P.has(i, f.need[i]));
      if (!has) return say(f.say.concat(['(' + Object.keys(f.need).map(i => `${ITEMS[i].name} ${P.count(i)}/${f.need[i]}`).join(', ') + ')']));
      for (const i in f.need) P.take(i, f.need[i]); s[key] = true; G.shards += f.reward; G.addTrainerXp(80);
      return say(f.done, () => { UI.toast(`+${f.reward} Shards.`, 'good'); if (f.draught) { P.add('draught', 1); UI.toast('And a Sage\'s Draught, pressed into your hand.', 'good'); } if (f.egg) { const sp = KIN.dex('earth').filter(x => x.home && x.home.layer === 'Sky' && (x.rarity || 0) >= 2)[0]; if (sp) G.addEgg(sp, 'a cloud'); } });
    }
    if (n.job === 'skymayor') return say(s.fortTaken ? ['Highmere breathes again. The storm has gone from the east. You did that.', 'Every house up here has your name on its door, figuratively. Literally, if you like.'] : ['Welcome to Highmere, the only city above the weather. Mind the edge; the railings are mostly decorative.', 'Out past the far clouds the Storm Warden built Stormspire. His storm creeps closer every season. If someone took it, the whole sky would owe them.']);
    if (n.job === 'skyguard') return say(['Captain Ilse, Highmere watch. Small cloud islands drift all round here. Folk live on some of them, odd folk, and most of them want something.', 'Stormspire is the grey smudge you can see from the spire. Go well armed. Go with arrows.']);
    if (n.job === 'skytrader') {
      const n6 = P.count('feather'); if (n6 >= 3) { const take = n6 - (n6 % 3); P.take('feather', take); G.shards += take * 40; return say([`Sky Feathers! ${take} of them. ${take * 40} shards, and I am robbing myself.`]); }
      return say(['Fennick, windtrader. I buy Sky Feathers, forty shards apiece, in threes.', 'Come back with feathers.']);
    }
    if (n.job === 'skyfreed') return say(['He held us with a storm in our heads. It is gone. Thank you, whoever you are.']);
    return false;
  }
  // ---------- puffs: walking on cloud kicks up little wisps that drift and fade ----------
  const puffs = []; let puffT = 0;
  function stepPuffs(dt, p) {
    for (let i = puffs.length - 1; i >= 0; i--) { const f = puffs[i]; f.t += dt; f.x += f.vx * dt; f.y += 0.35 * dt; f.z += f.vz * dt; if (f.t > f.dur) puffs.splice(i, 1); }
    puffT -= dt; if (puffT > 0 || !p.onGround || p.mount || p.flying) return; const sp = Math.hypot(p.vx, p.vz); if (sp < 0.8) return;
    const under = G.world.getBlock(Math.floor(p.x), Math.floor(p.y - 0.1), Math.floor(p.z)); if (under !== B.CLOUD && under !== B.GLOWGRASS) return;
    puffT = 0.16; for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283; puffs.push({ x: p.x + Math.cos(a) * 0.25, y: p.y + 0.05, z: p.z + Math.sin(a) * 0.25, vx: Math.cos(a) * 0.5 - p.vx * 0.15, vz: Math.sin(a) * 0.5 - p.vz * 0.15, t: 0, dur: 0.6 + Math.random() * 0.4, s: 0.5 + Math.random() * 0.5 }); }
  }
  function puffEntities() { if (!puffs.length) return []; const mesh = R.entityMesh('cloudpuff', (mb) => mb.blob(-0.5, -0.35, -0.5, 0.5, 0.35, 0.5, 1, [0.97, 0.98, 1.0], { n: 3, soft: 0.8, under: [0.86, 0.9, 0.98] })); return puffs.map(f => { const u = f.t / f.dur; return { x: f.x, y: f.y, z: f.z, yaw: 0, scale: f.s * (0.25 + u * 0.55), hover: 0, skyMul: 1, isFx: true, noOutline: true, alpha: (1 - u) * 0.85, mesh }; }); }
  // ---------- the loop ----------
  function update(dt, p) {
    if (!onEarth()) return; stepPuffs(dt, p); tick += dt; if (tick < 0.5) return; tick = 0;
    for (const k of sites()) {
      const d = dist(k, p); if (d > 170) continue;
      patchLoaded(k);
      if (d < 120) people(k);
      if (k.kind !== 'tree' && !st()['seen_' + k.id] && d < 60 && p.y > k.y - 12) { st()['seen_' + k.id] = true; if (k.kind === 'city') UI.toast('Highmere, the city in the clouds.', 'good'); else if (k.kind === 'isle') UI.toast(`A little cloud with a hut on it. Someone lives up here.`); }
      if (k.kind === 'fort') fortTick(k, p, d);
      if (k.kind === 'tree') treeTick(k, p, d);
    }
  }
  function mapMarks() { if (!onEarth()) return []; return sites().filter(k => (k.kind === 'tree' && (st().rootTold || st().seen_skyroot)) || (k.kind === 'city' && G.questState && Quests.isDone && (Quests.isDone('glider'))) || st()['seen_' + k.id] || (k.kind === 'fort' && st().fortSeen)).map(k => ({ x: k.x, z: k.z, t: k.kind === 'tree' ? '🌳' : k.kind === 'city' ? '☁' : k.kind === 'fort' ? (st().fortTaken ? '♜' : '⛈') : '☁', name: k.name + (k.kind === 'fort' && !st().fortTaken ? ' (the Storm Warden)' : '') })); }
  return { init, sites, overlay, update, talk, onBattle, inFort, gloom, mapMarks, layout, tangle, rootHint, puffEntities };
})();
