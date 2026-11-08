'use strict';
// The Indians: a warrior people of the swamps and deserts, far from your camp. Their camps hold a chief's hoard and a Duststrider,
// the fastest mount there is. They cannot be fought: by day they chase you off with spears; by night most of them sleep, and a quiet
// visitor can take what they like. Only the Tyrannorex scares them away: while you are in its saddle and about 17 seconds after you step down.
const Camps = (() => {
  let G = null, world = null;
  const NC = 64, CELL = WORLD_W / 64;
  const camps = new Map(); let active = null;
  const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
  const dist2d = (ax, az, bx, bz) => Math.hypot(wd(ax - bx), wd(az - bz));
  const NAMES = ['the Red Hand', 'the Ashen', 'the Thornfolk', 'the Marsh Clan', 'the Dust Clan', 'the Bone Circle'];
  function init(game) { G = game; world = game.world; camps.clear(); active = null; chosen = null; }
  function stockArms(c, day) { const r = U.rng(c.seedN ^ (day + 1) * 7331); const o = { arrow: 12 + r.int(9), sp_painted: 1, bow_painted: 1 }; if (r() < 0.35) o.arrow_barbed = 3 + r.int(3); return o; }
  function poi(id) { if (!G.poiState) G.poiState = {}; if (!G.poiState[id]) G.poiState[id] = {}; return G.poiState[id]; }
  let chosen = null;
  function plan() {
    if (chosen) return chosen; chosen = new Set(); const sx = Math.floor(U.mod(world.spawn.x, WORLD_W) / CELL), sz = Math.floor(U.mod(world.spawn.z, WORLD_W) / CELL); const cands = [];
    for (let dx = -10; dx <= 10; dx++) for (let dz = -10; dz <= 10; dz++) { const c = rawCamp(sx + dx, sz + dz); if (!c) continue; const d = dist2d(c.x, c.z, world.spawn.x, world.spawn.z); if (d < 400 || d > 2500) continue; cands.push([d, c]); }
    cands.sort((a, b) => a[0] - b[0]); const picked = [];
    for (const [, c] of cands) { if (picked.length >= 6) break; if (picked.some(o => dist2d(o.x, o.z, c.x, c.z) < 380)) continue;
      if (Village.townList().some(t => dist2d(t.x, t.z, c.x, c.z) < (t.R || 20) + 60)) continue; if (Keeps.sites().some(k => dist2d(k.x, k.z, c.x, c.z) < 200)) continue; if (Farms.sites().some(f => dist2d(f.x, f.z, c.x, c.z) < 150)) continue;
      picked.push(c); chosen.add(c.id); }
    return chosen;
  }
  function campFor(cx, cz) { if (world.preset.id !== 'earth') return null; const c = rawCamp(cx, cz); return c && plan().has(c.id) ? c : null; }
  function rawCamp(cx, cz) {
    if (world.preset.id !== 'earth') return null;
    cx = U.mod(cx, NC); cz = U.mod(cz, NC);
    const id = 'c' + cx + ',' + cz;
    if (camps.has(id)) return camps.get(id);
    let c = null;
    if (U.hash3(cx, 61, cz, 0x5EED) < 0.45) {
      const h1 = U.hash3(cx, 62, cz, 0x5EED), h2 = U.hash3(cx, 63, cz, 0x5EED);
      const x = Math.round(cx * CELL + 40 + h1 * (CELL - 80)), z = Math.round(cz * CELL + 40 + h2 * (CELL - 80));
      const info = world.colInfo(x, z);
      const biomeOk = info.biome === BIOME.SWAMP || info.biome === BIOME.DESERT || info.biome === BIOME.PLAINS || info.biome === BIOME.FOREST;
      if (biomeOk && info.h > SEA + 3 && info.h < 64 && !info.lost && !info.lostRim && dist2d(x, z, world.spawn.x, world.spawn.z) > 350) {
        let sum = 0, sum2 = 0, n = 0, wet = false;
        for (let dx = -10; dx <= 10; dx += 2) for (let dz = -10; dz <= 10; dz += 2) { const ci = world.colInfo(x + dx, z + dz); if (ci.h <= SEA + 1) wet = true; sum += ci.h; sum2 += ci.h * ci.h; n++; }
        const mean = sum / n, varc = sum2 / n - mean * mean;
        const villageNear = Village.markers(x, z, 1).some(m => m.kind === 'village' && dist2d(m.x, m.z, x, z) < 110);
        if (!wet && varc < 24 && !villageNear) { const r = U.combine(0xCA4, cx, cz); c = { id, x, z, y: Math.round(mean), name: 'camp of ' + NAMES[r % NAMES.length], seedN: r, warriors: [], strider: null, alarm: 0, scaredUntil: 0, scared: false, lastSeen: 0 }; }
      }
    }
    camps.set(id, c);
    return c;
  }
  // ---- the camp itself: a ring of hide tents round a fire, the chief's hut, the corral ----
  function stamp(c) {
    const set = (x, y, z, id) => world.setBlock(x, y, z, id); const vx = c.x, vz = c.z, vy = c.y;
    for (let dx = -19; dx <= 19; dx++) for (let dz = -19; dz <= 19; dz++) for (let y = vy - 3; y <= vy + 7; y++) {
      const b = world.getBlock(vx + dx, y, vz + dz);
      if (y < vy - 1) { if (!isSolid(b) || isLeaf(b) || b === B.LOG) set(vx + dx, y, vz + dz, B.DIRT); }
      else if (y === vy - 1) { if (!isSolid(b) || isLeaf(b) || b === B.LOG) set(vx + dx, y, vz + dz, B.GRASS); }
      else if (b !== B.AIR) set(vx + dx, y, vz + dz, B.AIR);
    }
    // the fire
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) set(vx + dx, vy - 1, vz + dz, B.STONE);
    set(vx, vy, vz, B.TORCH); set(vx, vy - 1, vz, B.EMBER);
    // six tents on a ring: hide walls (leaves), a log pole, an opening toward the fire
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + 0.3; const tx = vx + Math.round(Math.cos(a) * 13), tz = vz + Math.round(Math.sin(a) * 13);
      const fx = Math.sign(vx - tx), fz = Math.sign(vz - tz);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const wall = Math.abs(dx) === 1 || Math.abs(dz) === 1; for (let y = vy; y <= vy + 1; y++) set(tx + dx, y, tz + dz, wall ? B.LEAVES : B.AIR); set(tx + dx, vy + 2, tz + dz, B.LEAVES); }
      set(tx, vy + 3, tz, B.LOG); set(tx + fx, vy, tz + fz, B.AIR); set(tx + fx, vy + 1, tz + fz, B.AIR);
      c['tent' + i] = { x: tx, z: tz };
    }
    { const t = c['tent' + (c.seedN % 10)]; if (t) { set(t.x, vy, t.z, B.CHEST); c.pieceChest = { x: t.x, y: vy, z: t.z }; const pst = poi(c.id); if (!pst.pieceSet) { const ch = G.chestAt(t.x, vy, t.z, true); ch.items = { painted_piece: 1, berry: 3 }; pst.pieceSet = true; } } }
    // the weapon tent: the Indians always keep a store of plain arrows, spears and bows, refilled every night
    { const t = c['tent' + ((c.seedN + 5) % 10)]; if (t) { set(t.x, vy, t.z, B.CHEST); c.armsChest = { x: t.x, y: vy, z: t.z }; const ast = poi(c.id); if (!ast.armsSet) { const ch = G.chestAt(t.x, vy, t.z, true); ch.items = stockArms(c, 0); ch.arms = true; ast.armsSet = true; } } }
    // the chief's hut, north of the fire: plank walls, a totem at the door, the hoard at the back
    const hx = vx, hz = vz - 6;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { set(hx + dx, vy - 1, hz + dz, B.PLANKS); const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2; for (let y = vy; y <= vy + 2; y++) set(hx + dx, y, hz + dz, wall ? B.PLANKS : B.AIR); set(hx + dx, vy + 3, hz + dz, B.LOG); }
    set(hx, vy, hz + 2, B.AIR); set(hx, vy + 1, hz + 2, B.AIR); // door toward the fire
    set(hx - 3, vy, hz + 3, B.LOG); set(hx - 3, vy + 1, hz + 3, B.LOG); set(hx - 3, vy + 2, hz + 3, B.TORCH); set(hx + 3, vy, hz + 3, B.LOG); set(hx + 3, vy + 1, hz + 3, B.LOG); set(hx + 3, vy + 2, hz + 3, B.TORCH); // totems
    set(hx, vy, hz - 1, B.CHEST); c.chest = { x: hx, y: vy, z: hz - 1 };
    const st = poi(c.id);
    if (!st.looted) { const ch = G.chestAt(hx, vy, hz - 1, true); const r = U.rng(c.seedN ^ 0x60); ch.items = { gold: 5 + r.int(4), diamond: r.int(2) }; ch.treasure = true; st.looted = true; st.refillDay = G.dayCount || 0; }
    // the corral, east: fence posts round a patch of gravel, the Duststrider inside
    const kx = vx + 6, kz = vz + 7;
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { set(kx + dx, vy - 1, kz + dz, B.GRAVEL); if ((Math.abs(dx) === 3 || Math.abs(dz) === 3) && (dx + dz) % 2 === 0) set(kx + dx, vy, kz + dz, B.LOG); }
    c.corral = { x: kx, z: kz };
    // the horse paddock, west: grass inside a ring of posts, where the camp keeps its Windmanes
    const qx = vx - 9, qz = vz + 4;
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { set(qx + dx, vy - 1, qz + dz, B.GRASS); if ((Math.abs(dx) === 3 || Math.abs(dz) === 3) && (dx + dz) % 2 === 0) set(qx + dx, vy, qz + dz, B.LOG); }
    c.paddock = { x: qx, z: qz };
  }
  function warriorSpecies(i, seedN) {
    const r = U.rng(U.combine(0x4A7, i, seedN));
    const skin = r.pick(['#c68642', '#8d5524', '#a0683a', '#6b4a2b']);
    return { shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: false }, colors: { body: skin, belly: skin, accent: r.pick(['#e0302a', '#f0e0a0', '#2a6fc0']), dark: '#3a2a20', eye: '#222222' }, size: 1.05, gen: 0, names: ['warrior'] };
  }
  function populate(c) {
    c.warriors = [];
    for (let i = 0; i < 12; i++) {
      const sp = warriorSpecies(i, c.seedN); const m = KIN.model(sp, 2); KIN.decorate(m, 'warrior');
      const t = c['tent' + (i % 10)]; const a = i / 12 * Math.PI * 2; const r0 = 10 + (i % 4) * 3;
      const w = { i, role: 'warrior', name: 'Indian warrior', x: c.x + Math.cos(a) * r0, z: c.z + Math.sin(a) * r0, y: c.y, yaw: 0, model: m, mesh: R.entityMesh('warrior:' + (i % 4), (mb) => KIN.buildMesh(mb, m)), route: { r: r0, phase: a, period: 26 + i * 3 }, tent: t, alert: 0, hitCd: 0, sleeping: false, bob: Math.random() * 6, state: 'patrol' };
      w.y = standY(w.x, c.y, w.z) ?? c.y; w.rider = i < 4; if (w.rider) { w.name = 'Indian rider'; w.scale = 1.35; }
      c.warriors.push(w);
    }
    // the Duststrider: a fast, sandy quadruped that will not go in a table and never changes
    const sp = KIN.species(U.combine(0xD057, c.seedN), ['Gale'], 4, { primary: 'Gale', shape: 'quadruped', total: 430, evolveAt: [9999, 9999], size: 1.35 });
    sp.names = ['Duststrider', 'Duststrider', 'Duststrider']; sp.colors = { body: '#d8b074', belly: '#f0dfb0', accent: '#8a5a2a', dark: '#5a3a1a', eye: '#222222' }; sp.feat = { horns: false, wings: false, spikes: false, tail: true, ears: true, crest: true, bigEyes: false, stripes: false, spots: false, armor: false, bigTail: true }; sp.fast = true; sp.noFuse = true; sp.tame = true; sp.rarity = 3;
    const m = KIN.model(sp, 2);
    c.strider = { role: 'duststrider', name: 'Duststrider', sp, x: c.corral.x + 0.5, y: standY(c.corral.x + 0.5, c.y, c.corral.z + 0.5) ?? c.y, z: c.corral.z + 0.5, yaw: 0, model: m, mesh: R.entityMesh('strider:' + c.id, (mb) => KIN.buildMesh(mb, m)), bob: 0 };
    if (poi(c.id).striderTaken) c.strider = null;
    // three Windmanes: the camp horses. In Indian dress one will carry you out of camp, but the moment you get down it gallops home
    c.horses = [];
    if (c.paddock) for (let i = 0; i < 3; i++) {
      const hs = horseSpecies(c.seedN, i); const hm = KIN.model(hs, 2); const hx = c.paddock.x + 0.5 + (i - 1) * 1.8, hz = c.paddock.z + 0.5 + (i % 2 ? 1.2 : -1.2);
      c.horses.push({ role: 'camphorse', name: 'Windmane', sp: hs, i, x: hx, z: hz, y: standY(hx, c.y, hz) ?? c.y, hx, hz, yaw: i * 2.1, model: hm, mesh: R.entityMesh('horse:' + c.id + ':' + i, (mb) => KIN.buildMesh(mb, hm)), bob: i, out: false });
    }
  }
  function horseSpecies(seedN, i) {
    const sp = KIN.species(U.combine(0x4053, seedN, i), ['Gale'], 4, { primary: 'Gale', shape: 'quadruped', total: 400, evolveAt: [9999, 9999], size: 1.3 });
    const coats = [{ body: '#f2ede4', belly: '#f2ede4', accent: '#6a3a1e' }, { body: '#7a4a2a', belly: '#f0e6d8', accent: '#f0e6d8' }, { body: '#2a2220', belly: '#f2ede4', accent: '#c94a2a' }, { body: '#b07a48', belly: '#f2e4cc', accent: '#3a2216' }];
    const c0 = coats[U.mod(seedN + i, coats.length)];
    sp.names = ['Windmane', 'Windmane', 'Windmane']; sp.colors = Object.assign({ dark: '#2a1a10', eye: '#222222' }, c0); sp.feat = { horns: false, wings: false, spikes: false, tail: true, ears: true, crest: true, bigEyes: false, stripes: false, spots: i !== 1, armor: false, bigTail: true };
    sp.fast = true; sp.noFuse = true; sp.tame = true; sp.rarity = 2; sp.campHorse = true; return sp;
  }
  // borrowing a Windmane: never yours, never catchable, only a getaway
  let lent = null; // { k, camp, horse }
  function dressed() { return G.player.has('painted_cloak') || G.skin === 'painted'; }
  function borrow(n) {
    const c = active; if (!c || n.out) return;
    if (!dressed()) { UI.toast('The Windmane lays its ears back and sidesteps. It will not carry a stranger. In Indian dress it might.'); return; }
    if (G.player.mount) { UI.toast('Get down from your own mount first.'); return; }
    const k = KIN.create(n.sp, Math.max(10, G.trainerLevel)); k.borrowed = true; k.tamed = true; k.trust = 1;
    n.out = true; lent = { k, camp: c, horse: n };
    G.player.mount = k; G.player.mountMode = 'land'; UI.sfx('util');
    UI.toast('The Windmane takes you for one of its own and lets you up. Ride hard. The moment you get down, it goes home.', 'good');
  }
  function horseHome() {
    if (!lent) return; const { horse } = lent; lent = null; horse.out = false; horse.x = horse.hx; horse.z = horse.hz;
    UI.toast('The Windmane wheels round and gallops back to its camp. Gone.');
  }
  function standY(x, y, z) { const bx = Math.floor(x), bz = Math.floor(z); for (const dy of [0, 1, -1, 2, -2]) { const yy = Math.floor(y) + dy; const b0 = world.getBlock(bx, yy, bz), b1 = world.getBlock(bx, yy + 1, bz), below = world.getBlock(bx, yy - 1, bz); if ((b0 === B.AIR || BLOCKS[b0].partial) && b1 === B.AIR && isSolid(below) && !isLeaf(below)) return yy; } return null; }
  const isNight = () => Math.cos(world.time * Math.PI * 2) > 0.17;
  function frame(c, px, pz) { const sx = Math.round((px - c.x) / WORLD_W) * WORLD_W, sz = Math.round((pz - c.z) / WORLD_W) * WORLD_W; if (!sx && !sz) return; c.x += sx; c.z += sz; for (const w of c.warriors) { w.x += sx; w.z += sz; } if (c.strider) { c.strider.x += sx; c.strider.z += sz; } for (const h of c.horses || []) { h.x += sx; h.z += sz; h.hx += sx; h.hz += sz; } if (c.corral) { c.corral.x += sx; c.corral.z += sz; } if (c.chest) { c.chest.x += sx; c.chest.z += sz; } for (let i = 0; i < 6; i++) if (c['tent' + i]) { c['tent' + i].x += sx; c['tent' + i].z += sz; } }
  // ---- per frame ----
  function update(dt, p, inBattle) {
    if (world.preset.id !== 'earth') return;
    if (lent && p.mount !== lent.k) horseHome();
    const cx0 = Math.floor(U.mod(p.x, WORLD_W) / CELL), cz0 = Math.floor(U.mod(p.z, WORLD_W) / CELL);
    let near = null, nd = Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = campFor(cx0 + dx, cz0 + dz); if (!c) continue; const d = dist2d(c.x, c.z, p.x, p.z); if (d < nd) { nd = d; near = c; } }
    if (!near || nd > 90) { active = null; return; }
    frame(near, p.x, p.z);
    const st = poi(near.id);
    if (!st.stamped) { world.ensureAround(Math.floor(near.x / CH), Math.floor(near.z / CH), 2, 999); stamp(near); st.stamped = true; G.meshPass(99); UI.toast(`A ${near.name}. Spears on the totems. They do not take visitors.`, 'bad'); }
    if (!near.warriors.length) populate(near);
    if (near.armsChest && isNight() && st.armsDay !== (G.dayCount || 0)) { const ch = G.chestAt(near.armsChest.x, near.armsChest.y, near.armsChest.z, true); const add = stockArms(near, G.dayCount || 0); ch.items = ch.items || {}; for (const k in add) ch.items[k] = Math.max(ch.items[k] || 0, add[k]); ch.arms = true; st.armsDay = G.dayCount || 0; }
    if (near.chest && isNight() && st.refillDay !== (G.dayCount || 0)) { const ch = G.chestAt(near.chest.x, near.chest.y, near.chest.z, true); const r = U.rng(near.seedN ^ (G.dayCount || 0) * 977); ch.items = ch.items || {}; ch.items.gold = Math.max(ch.items.gold || 0, 5 + r.int(4)); if (r() < 0.4) ch.items.diamond = Math.max(ch.items.diamond || 0, 1); ch.treasure = true; st.refillDay = G.dayCount || 0; }
    active = near;
    const c = near; const night = isNight(); const now = performance.now() / 1000;
    // the Tyrannorex in the saddle scares them off; step down and you get about 17 seconds before they come back at you. Back in the saddle and they scatter again
    const onDino = !!(p.mount && p.mount.sp && p.mount.sp.apex === 'rex'); // only the Tyrannorex: smaller dinosaurs they will spear
    if (onDino && nd < 34) { if (!c.scared) UI.toast('The Indians see the Tyrannorex and run.', 'good'); c.scared = true; c.scaredUntil = now + 17; c.alarm = 0; }
    else if (c.scared && now > c.scaredUntil) { c.scared = false; if (nd < 40) { c.alarm = 25; for (const o of c.warriors) { o.sleeping = false; o.alert = 1; } UI.toast('Off the Tyrannorex too long. The Indians are coming back for you. Get in the saddle.', 'bad'); } }
    else if (c.scared && !onDino && c.scaredUntil - now < 16.9 && (G.frame & 63) === 0 && nd < 40) UI.toast(`${Math.ceil(c.scaredUntil - now)}s before the Indians return.`);
    if (c.alarm > 0) c.alarm -= dt;
    // the Indian Cloak: in it you pass as one of them, for a while, until you take their hoard and try to walk out with it
    const cloak = p.has('painted_cloak') && !c.blown && c.alarm <= 0 && !c.scared;
    if (cloak && nd < 26) {
      c.disguiseT = (c.disguiseT || 0) + dt;
      if (!c.cloakTold) { c.cloakTold = true; UI.toast('In the cloak, the Indians nod at you and look away. You have a few minutes.', 'good'); }
      if ((c.stole && nd > 17) || c.disguiseT > 240) { c.blown = true; const w = c.warriors.filter(x => !x.sleeping).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
        const lines = ['Ka\'teshru? Vo haneth ru kesh?', '(He waits for an answer. You do not have one.)', 'Tanu... RA\'TUK! Who ARE you?'];
        Dialogue.show(w ? w.name : 'An Indian warrior', lines, () => { c.alarm = 25; UI.sfx('alert'); UI.toast(c.stole ? 'They know. RUN, and do not drop the gold.' : 'You stayed too long. RUN.', 'bad'); for (const o of c.warriors) o.alert = 1; }); }
      for (const w of c.warriors) w.alert = 0;
    }
    if (nd > 60) { c.disguiseT = 0; c.stole = false; c.blown = false; c.cloakTold = false; }
    const sneaking = p.sneak, moving = Math.hypot(p.vx, p.vz) > 0.6;
    const noisy = !!p.mineTarget || p.vy > 3 || Math.hypot(p.vx, p.vz) > 5; // digging, jumping, galloping
    const hidden = G.repelUntil > performance.now() || (p.wingsOn && p.y - c.y > 3); // the Amulet of Shadow, or silent wings overhead
    for (const w of c.warriors) {
      w.bob += dt; w.hitCd -= dt;
      w.sleeping = night && w.i >= 2 && c.alarm <= 0 && !c.scared;
      const dx = p.x - w.x, dz = p.z - w.z, d = Math.hypot(dx, dz);
      if (c.scared) { // run from you, out to the edge of their land
        if (d < 30) { const sp = 4.6 * dt; move(w, w.x - dx / (d || 1) * sp, w.z - dz / (d || 1) * sp); w.yaw = Math.atan2(-dx, -dz); w.moving = true; } else w.moving = false;
        w.alert = 0; continue;
      }
      if (c.alarm > 0 && !inBattle) { // the chase
        const far = dist2d(w.x, w.z, c.x, c.z) > 48 || d > 60;
        const psp = Math.hypot(p.vx, p.vz);
        if (w.rider && !far && d < 14 && w.hitCd <= 0) { w.hitCd = 1.6; const chance = psp > 16 ? 0 : psp > 12 ? 0.3 : psp > 7 ? 0.6 : 0.85; if (Math.random() < chance) { p.damage(2, 'spear'); p.hurtFlash = 0.5; UI.sfx('hit'); } else UI.sfx('miss'); }
        if (!far && d > 1.4) { const sp = (w.rider ? (night ? 9 : 13.5) : 3.95) * dt; move(w, w.x + dx / d * sp, w.z + dz / d * sp); w.yaw = Math.atan2(dx, dz); w.moving = true; }
        else if (far) { c.alarm = Math.min(c.alarm, 2); }
        else w.moving = false;
        if (d < 1.7 && Math.abs(p.y - w.y) < 2.2 && w.hitCd <= 0) { w.hitCd = 1.15; p.damage(2, 'spear'); p.hurtFlash = 0.5; w.hitT = 0.3; UI.sfx('hit'); }
        continue;
      }
      // off alarm: patrol by day (and two of them by night), sleep in the tents otherwise
      if (w.sleeping) { if (w.tent) { w.x += (w.tent.x + 0.5 - w.x) * 0.1; w.z += (w.tent.z + 0.5 - w.z) * 0.1; w.y = standY(w.x, w.y, w.z) ?? w.y; } w.moving = false; }
      else {
        const t = (now / w.route.period + w.route.phase / (Math.PI * 2)) % 1; const a = t * Math.PI * 2; const sp = night ? 0.55 : 1;
        const tx = c.x + Math.cos(a * sp) * w.route.r, tz = c.z + Math.sin(a * sp) * w.route.r;
        const mdx = tx - w.x, mdz = tz - w.z; if (Math.hypot(mdx, mdz) > 0.05) { move(w, tx, tz); w.yaw = Math.atan2(mdx, mdz); w.moving = true; } else w.moving = false;
      }
      // detection: eyes by day, ears at night
      if (hidden || inBattle || cloak) { w.alert = Math.max(0, w.alert - dt); continue; }
      const senseR = (w.sleeping ? 2.5 : night ? 5 : 8) + (noisy ? 7 : 0);
      if (d < senseR) {
        const fx = Math.sin(w.yaw), fz = Math.cos(w.yaw); const facing = (fx * dx + fz * dz) / (d || 1);
        let rate = w.sleeping ? (noisy ? 1.2 : moving && !sneaking ? 0.35 : 0.05) : facing > 0.3 && !night ? 2.4 : noisy ? 2.0 : moving && !sneaking ? 1.0 : moving && sneaking ? 0.15 : -0.5;
        w.alert = U.clamp(w.alert + rate * dt, 0, 1);
        if (w.alert >= 1) { c.alarm = 25; UI.sfx('alert'); UI.toast('The Indians have seen you. RUN.', 'bad'); for (const o of c.warriors) o.alert = 1; }
      } else w.alert = Math.max(0, w.alert - dt * 0.6);
    }
    for (const h of c.horses || []) { if (h.out) continue; h.bob += dt; const dx = p.x - h.x, dz = p.z - h.z; if (Math.hypot(dx, dz) < 6) h.yaw = Math.atan2(dx, dz); else h.yaw += Math.sin(h.bob * 0.3 + h.i) * dt * 0.4; }
    if (c.strider) { c.strider.bob += dt; const dx = p.x - c.strider.x, dz = p.z - c.strider.z; if (Math.hypot(dx, dz) < 8) c.strider.yaw = Math.atan2(dx, dz); }
  }
  function move(w, nx, nz) { const gy = standY(nx, w.y, nz); if (gy == null) return false; w.x = nx; w.z = nz; w.y += (gy - w.y) * 0.5; return true; }
  function entities() {
    if (!active) return [];
    const out = [];
    for (const w of active.warriors) { if (w.sleeping) continue; out.push({ x: w.x, y: w.y, z: w.z, yaw: w.yaw, model: w.model, mesh: w.mesh, scale: w.scale || 1, hover: w.moving ? Math.abs(Math.sin(w.bob * 9)) * 0.08 : 0, skyMul: 1 }); }
    for (const h of active.horses || []) if (!h.out) out.push({ x: h.x, y: h.y, z: h.z, yaw: h.yaw, model: h.model, mesh: h.mesh, scale: 1, hover: Math.sin(h.bob * 2) * 0.02, skyMul: 1 });
    if (active.strider) { const s = active.strider; out.push({ x: s.x, y: s.y, z: s.z, yaw: s.yaw, model: s.model, mesh: s.mesh, scale: 1, hover: Math.sin(s.bob * 2) * 0.03, skyMul: 1 }); }
    return out;
  }
  function onTake(chest, item) {
    const c = active; if (!c) return;
    if (item === 'painted_piece') { if (!G.stats.pieces) G.stats.pieces = {}; if (!G.stats.pieces[c.id]) { G.stats.pieces[c.id] = true; const n = Object.keys(G.stats.pieces).length, need = all().length; setTimeout(() => UI.toast(`Indian cloth, from ${c.name} (${n} of ${need} camps). Zazu in the city could make something of this.`, 'good'), 300); } return; }
    if (chest.treasure || chest.arms) c.stole = true;
  }
  function talkable() { if (!active) return []; return (active.strider ? [active.strider] : []).concat((active.horses || []).filter(h => !h.out)); }
  // taking the Duststrider: by night, unseen, or while they are scared
  function tame(n) {
    const c = active; if (!c || c.strider !== n) return;
    const night = isNight();
    if (c.alarm > 0) { UI.toast('It shies away from you while the camp is roused.'); return; }
    if (!night && !c.scared) { UI.toast('In daylight the whole camp watches it. Come back at night and be quiet, or come on the Tyrannorex.'); return; }
    const k = KIN.create(n.sp, Math.max(10, G.trainerLevel)); G.addKin(k); c.strider = null; poi(c.id).striderTaken = true;
    UI.sfx('caught'); UI.toast('The Duststrider lets you up. It is yours: faster than anything on legs, and it will never go in a table.', 'good');
    G.stats.caught++;
  }
  function marks(p) { if (!active) return []; return [{ t: '△', x: active.x, z: active.z, name: active.name }]; }
  function mapMarks(p, range) {
    const out = []; if (world.preset.id !== 'earth') return out;
    const cx0 = Math.floor(U.mod(p.x, WORLD_W) / CELL), cz0 = Math.floor(U.mod(p.z, WORLD_W) / CELL); const cells = Math.min(4, Math.ceil(range / CELL) + 1);
    for (let dx = -cells; dx <= cells; dx++) for (let dz = -cells; dz <= cells; dz++) { const c = campFor(cx0 + dx, cz0 + dz); if (c) out.push({ kind: 'camp', x: p.x + wd(c.x - p.x), z: p.z + wd(c.z - p.z), name: c.name }); }
    return out;
  }
  function all() { const out = []; for (let cx = 0; cx < NC; cx++) for (let cz = 0; cz < NC; cz++) { const c = campFor(cx, cz); if (c) out.push(c); } return out; }
  return { init, update, entities, talkable, tame, borrow, horseHome, get lent() { return lent; }, marks, mapMarks, all, onTake, get active() { return active; } };
})();
