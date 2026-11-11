'use strict';
// Wild Kin living in the world: rosters per region / layer / tier, wandering and patrolling, sense radius + stealth detection.
const Wild = (() => {
  const list = [];
  let world = null, maxCount = 11, spawnTimer = 0, mythicRef = null;
  const REGION = 1024;

  function init(w, mobile) { world = w; maxCount = mobile ? 8 : 11; list.length = 0; mythicRef = null; }
  function onPath(x, z) { const n = U.fbm2(x, z, 256, 2, world.seed + 999, WORLD_W); return Math.abs(n - 0.5) < 0.11; }
  function contextAt(x, y, z) {
    const layer = world.layerAt(y, Math.floor(x), Math.floor(z));
    const biomeName = BIOME_NAME[world.biomeAt(Math.floor(x), Math.floor(z))];
    const inWater = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === B.WATER;
    return { layer: inWater ? 'Water' : layer, biomeName };
  }
  function layerBonus(layer, deep) { return layer === 'Mines' ? 2 : layer === 'Core' ? 8 : layer === 'Sky' ? 6 : layer === 'Water' ? (deep ? 3 : 1) : 0; }
  const wdd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
  // how hard a place is, before rarity: the land near home stays easy forever; it climbs with distance and spikes at held villages, in the deep layers and on volcano tops
  // crouching in tall grass: you are very hard to spot
  let tgT = 0, tgV = false;
  function inTallGrass() {
    const now = performance.now(); if (now - tgT < 300) return tgV; tgT = now; const p = G.player; const bx = Math.floor(p.x), bz = Math.floor(p.z);
    const below = world.getBlock(bx, Math.floor(p.y - 0.1), bz); tgV = below === B.GRASS && R.grassZone(world, bx, bz, world.colInfo(bx, bz).biome) > 0.66; return tgV;
  }
  function zoneLevel(x, y, z, ctx, trainerLevel) {
    const pr = world.preset; const onEarth = pr.id === 'earth';
    const o = onEarth ? (G.village || world.spawn) : (world.pad || world.spawn);
    const d = Math.hypot(wdd(x - o.x), wdd(z - o.z));
    let lv = onEarth ? 2 + d / 110 : (pr.zoneBase || 0) + d / 110;
    const v = Village.active;
    if (v) {
      const dv = Math.hypot(wdd(x - v.x), wdd(z - v.z)); const st = G.villageState && G.villageState[v.id];
      if (st && st.freed && dv < 60) lv -= 3; // your village: a calm place
      else if (st && !st.freed && dv < 70) lv += 2 + v.tier * 2; // a tyrant's: his creatures
    }
    lv += layerBonus(ctx.layer, ctx.layer === 'Water' && (SEA - y) > 3);
    const biome = world.colInfo(Math.floor(x), Math.floor(z)).biome;
    if (onEarth && y >= 64 && biome === BIOME.MOUNTAIN && U.vnoise2(Math.floor(x), Math.floor(z), 256, WORLD_W, world.seed + 611) > 0.6) lv += 8; // the heart of a volcano
    let cap = onEarth ? trainerLevel + 8 : (pr.zoneBase || 0) + 110;
    if (biome === BIOME.LOSTWORLD) { lv = Math.max(lv, 38); cap = Math.max(cap, trainerLevel + 14); } // the Lost World: old and big
    if (world.legend) { const dl = Math.hypot(wdd(x - world.legend.x), wdd(z - world.legend.z)); if (dl < world.legend.r) { lv += pr.legend.zone * (1 - dl / world.legend.r * 0.4); cap += pr.legend.zone; } }
    return U.clamp(Math.round(lv), 1, Math.min(cap, KIN.MAX_LEVEL));
  }
  // ---- high flyers: the birds that never come down. They wheel twenty blocks up, drop stones on you, and only a Flight Snare thrown from the air holds them ----
  function isHigh(sp) { return sp.shape === 'bird' && (sp.rarity || 0) >= 1 && sp.home && sp.home.layer === 'Surface'; }
  const drops = []; let highTimer = 8, dropWarned = false;
  function openSky(x, y, z) { return world.topAt(Math.floor(x), Math.floor(z)) <= Math.floor(y) + 1; }
  function spawnHigh(player) {
    const ctx = contextAt(player.x, player.y, player.z); if (ctx.layer !== 'Surface') return;
    const rx = Math.floor(U.mod(player.x, WORLD_W) / REGION), rz = Math.floor(U.mod(player.z, WORLD_W) / REGION);
    const all = KIN.dex(world.preset.id).filter(isHigh); let pool = all.filter(sp => sp.home.biome === ctx.biomeName); if (!pool.length) pool = all.filter(sp => sp.rarity <= 2); if (!pool.length) return;
    const w = pool.map(sp => KIN.RARITY[sp.rarity].w); let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; for (; i < w.length - 1; i++) { r -= w[i]; if (r <= 0) break; }
    const sp = pool[i]; const a = Math.random() * Math.PI * 2, d = 22 + Math.random() * 16;
    const cx = player.x + Math.cos(a) * d, cz = player.z + Math.sin(a) * d; const gy = world.groundY(Math.floor(cx), Math.floor(cz));
    const zl = zoneLevel(cx, gy, cz, ctx, player.trainerLevel || G.trainerLevel || 1);
    const level = Math.max(1, Math.min(zl + KIN.RARITY[sp.rarity].lvl + 2 + Math.floor(Math.random() * 3), KIN.capOf(sp)));
    const alt = 17 + Math.random() * 9;
    const e = makeEntity(sp, level, cx, Math.max(gy, SEA) + alt, cz, {}); e.high = true; e.elite = sp.rarity >= 2;
    e.orbit = { cx, cz, r: 7 + Math.random() * 7, w: (0.35 + Math.random() * 0.25) * (Math.random() < 0.5 ? -1 : 1), ph: Math.random() * 6.28, alt, gy: Math.max(gy, SEA), gyT: 0 };
    e.dropCd = 6 + Math.random() * 6; e.senseR = 3; list.push(e);
  }
  function updateHigh(e, dt, player) {
    const o = e.orbit; o.ph += o.w * dt;
    const hd = Math.hypot(player.x - o.cx, player.z - o.cz);
    if (e.bored > 0) { e.bored -= dt; o.cx += Math.cos(o.ph * 0.1) * dt * 2; o.cz += Math.sin(o.ph * 0.1) * dt * 2; }
    else if (hd < 40 && !(G.repelUntil > performance.now())) { const k = Math.min(1, dt * 0.25); o.cx += (player.x - o.cx) * k; o.cz += (player.z - o.cz) * k; } // it has seen you: it drifts over to you
    const nx = o.cx + Math.cos(o.ph) * o.r, nz = o.cz + Math.sin(o.ph) * o.r;
    o.gyT -= dt; if (o.gyT <= 0) { o.gyT = 0.5; o.gy = Math.max(SEA, world.groundY(Math.floor(nx), Math.floor(nz))); }
    const ty = Math.max(o.gy + o.alt, player.gliding ? 0 : 0) + Math.sin(e.bob * 0.8) * 0.8;
    e.yaw = Math.atan2(nx - e.x, nz - e.z); e.x = nx; e.z = nz; e.y += (ty - e.y) * Math.min(1, dt * 1.5);
    // stones: when it is over you and you are under open sky
    e.dropCd -= dt;
    if (e.dropCd <= 0 && !((G.stats.camp || {}).glider)) e.dropCd = 5; // early on they just wheel up there; once you have taken to the air yourself, they take an interest
    if (e.dropCd <= 0) {
      e.dropCd = 11 + Math.random() * 8;
      if (Math.hypot(player.x - o.cx, player.z - o.cz) < 7 && player.y < e.y - 4 && openSky(player.x, player.y + 2, player.z) && !player.flying && !(G.repelUntil > performance.now())) {
        e.dropped = (e.dropped || 0) + 1; if (e.dropped >= 3) { e.dropped = 0; e.bored = 45; }
        drops.push({ x: player.x + player.vx * 0.9 + (Math.random() - 0.5) * 1.2, y: e.y - 0.4, z: player.z + player.vz * 0.9 + (Math.random() - 0.5) * 1.2, vy: 0, t: 0 });
        if (!dropWarned) { dropWarned = true; UI.toast(`${KIN.name(e.kin)} is dropping stones on you from up there. Keep moving, or get under a roof.`, 'bad'); }
      }
    }
  }
  function updateDrops(dt, player) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.t += dt; d.vy -= 22 * dt; d.y += d.vy * dt;
      const b = world.getBlock(Math.floor(d.x), Math.floor(d.y), Math.floor(d.z));
      if (Math.abs(d.x - player.x) < 0.7 && Math.abs(d.z - player.z) < 0.7 && d.y > player.y && d.y < player.y + 2) { player.damage(1, 'kin'); drops.splice(i, 1); continue; }
      if (isSolid(b) || b === B.WATER || d.t > 6) drops.splice(i, 1);
    }
  }
  function dropEntities() {
    return drops.map(d => ({ x: d.x, y: d.y, z: d.z, yaw: d.t * 5, scale: 1, hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh('fx:stone', (mb) => mb.box(-0.13, -0.13, -0.13, 0.13, 0.13, 0.13, [0.45, 0.43, 0.4], 1, false)) }));
  }
  function calmHere(player) { const v = Village.active; if (!v) return false; const st = G.villageState && G.villageState[v.id]; return !!(st && st.freed) && Math.hypot(wdd(player.x - v.x), wdd(player.z - v.z)) < 60; }
  // choose species + level for a spawn at this position: tier by trainer level, then rarity and weather weigh the roster
  function wantedParts() {
    const body = world.preset.id; const known = ((G.stats.recipes || {})[body]) || []; if (!known.length) return [];
    const all = KIN.recipes(body); const have = new Set(G.kin.map(k => k.sp.seed)); const out = [];
    for (const rc of all) if (known.includes(rc.i)) for (const sp of rc.parts) if (!have.has(sp.seed) && !sp.fusion && (sp.rarity || 0) <= 1) out.push(sp);
    return out;
  }
  // ---- haunts: every Kin a known recipe calls for, and you have not caught, has a spot of its own on its home ground within reach of your
  // first village, where one or two of it always live. Villagers know about them; the fusion quest points there ----
  function haunts() {
    const body = world.preset.id; if (body !== 'earth') return [];
    const st = G.stats.haunts || (G.stats.haunts = {}); const have = new Set(G.kin.map(k => k.sp.seed)); const out = [];
    const home = Village.def || G.lastVillage || world.spawn;
    for (const sp of wantedParts()) {
      let h = st[sp.seed];
      if (!h) { // the nearest bit of its biome from home, not inside a town, starting a little way out
        const want = sp.home.biome; let best = null;
        for (let r = 40; r <= 420 && !best; r += 12) for (let k = 0; k < 24 && !best; k++) { const a = (k / 24 + (sp.seed % 97) / 97) * 6.283; const x = Math.round(home.x + Math.cos(a) * r), z = Math.round(home.z + Math.sin(a) * r);
          if (BIOME_NAME[world.biomeAt(x, z)] !== want) continue; const ci = world.colInfo(U.mod(x, WORLD_W), U.mod(z, WORLD_W)); if (ci.h <= SEA + 1) continue; if (Village.townList && Village.townList().some(t => Math.hypot(t.x - x, t.z - z) < 30)) continue; best = { x, z }; }
        if (!best) continue; h = st[sp.seed] = { x: best.x, z: best.z, name: sp.names[0], biome: want };
      }
      if (!have.has(sp.seed)) out.push(Object.assign({ sp }, h));
    }
    return out;
  }
  let hauntT = 0;
  function tendHaunts(player, trainerLevel) {
    for (const h of haunts()) {
      const d = Math.hypot(h.x - player.x, h.z - player.z); if (d > 90 || d < 22) continue; // fill it up while you are near but not looking right at it
      const n = list.filter(e => e.kin.sp.seed === h.sp.seed && Math.hypot(e.x - h.x, e.z - h.z) < 24).length; if (n >= 2) continue;
      for (let t = 0; t < 10; t++) { const x = Math.floor(h.x + (Math.random() - 0.5) * 12), z = Math.floor(h.z + (Math.random() - 0.5) * 12); const gy = world.groundY(x, z); if (gy == null || !standable(x, gy + 1, z, false)) continue;
        const lvl = Math.max(2, Math.min(KIN.capOf(h.sp), zoneLevel(x, gy + 1, z, contextAt(x, gy + 1, z), trainerLevel)));
        const e = makeEntity(h.sp, lvl, x + 0.5, gy + 1, z + 0.5, {}); e.haunt = h.sp.seed; list.push(e); break; }
    }
  }
  function roll(x, y, z, trainerLevel) {
    const ctx = contextAt(x, y, z);
    const rx = Math.floor(U.mod(x, WORLD_W) / REGION), rz = Math.floor(U.mod(z, WORLD_W) / REGION);
    const zl = zoneLevel(x, y, z, ctx, trainerLevel);
    const tier = Math.floor(zl / 4);
    const off = !onPath(x, z);
    const deep = ctx.layer === 'Water' && (SEA - y) > 3;
    const elite = Math.random() < (off || deep ? 0.45 : 0.12);
    const useTier = elite ? tier : Math.floor(Math.random() * (tier + 1));
    let list = KIN.roster(world.preset.id, rx, rz, ctx.layer, ctx.biomeName, useTier); if (ctx.layer === 'Surface') { const g = list.filter(sp => !isHigh(sp) && !(typeof Farms !== 'undefined' && Farms.isPest(sp))); if (g.length) list = g; }
    if (G.lure && G.lure.until > performance.now() && ctx.layer === 'Surface') { // a lure draws its element in from the biomes that have it
      const home = { Flame: ['Surface', 'Desert'], Tide: ['Water', 'Ocean'], Bloom: ['Surface', 'Forest'], Stone: ['Surface', 'Mountains'], Gale: ['Surface', 'Plains'], Frost: ['Surface', 'Snowfield'], Spark: ['Surface', 'Plains'], Void: ['Mines', 'Plains'], Light: ['Sky', 'Plains'] }[G.lure.elem];
      if (home) list = list.concat(KIN.roster(world.preset.id, rx, rz, home[0], home[1], useTier).filter(sp => KIN.dominant(sp.elem, 1)[0] === G.lure.elem && (sp.rarity || 0) <= 3));
    }
    const isNight = (R.state.day || 0) < 0.3;
    // distance from the nearest village (or camp): the big ones live far out
    const ref = Village.def || G.lastVillage || G.village || world.spawn; const vx = ref.x, vz = ref.z;
    const far = Math.hypot(x - vx, z - vz);
    const veryDeep = ctx.layer === 'Water' && (SEA - y) > 5;
    const weights = list.map(sp => {
      const rar = KIN.RARITY[sp.rarity];
      let w = rar.w;
      if (sp.rarity >= 2) w *= (off || deep) ? 2.6 : 1; // the rare ones keep to the outskirts and the deep
      if (sp.rarity >= 2 && isNight) w *= 1.3;
      if (sp.rarity === 3 && (far < 60 || (!off && !deep))) w = 0;
      if (sp.rarity === 4) { if (far < 120 || !(off || deep)) w = 0; else if (veryDeep || ctx.layer === 'Core' || ctx.layer === 'Sky') w *= 2; }
      const prim = KIN.dominant(sp.elem, 1)[0];
      w *= Weather.elemMul(prim, isNight);
      if (G.lure && G.lure.until > performance.now()) w *= prim === G.lure.elem ? 8 : 0.25;
      return w;
    });
    let pick = Math.random() * weights.reduce((a, b) => a + b, 0), idx = 0;
    for (; idx < weights.length - 1; idx++) { pick -= weights[idx]; if (pick <= 0) break; }
    let sp = list[idx];
    // the Kin your known recipes call for and you have not caught yet turn up regularly on their home ground, wherever on the map that ground is,
    // so a recipe is never a hunt for one species that happens not to live in your part of the world
    if (ctx.layer === 'Surface' && Math.random() < 0.25) { const want = wantedParts().filter(w => w.home && w.home.layer === 'Surface' && w.home.biome === ctx.biomeName); if (want.length) sp = want[Math.floor(Math.random() * want.length)]; }
    let level = zl + KIN.RARITY[sp.rarity].lvl + (elite ? 1 + Math.floor(Math.random() * 3) : -1 + Math.floor(Math.random() * 3));
    if (off && !elite) level += 1;
    level = Math.max(1, Math.min(level, KIN.capOf(sp)));
    return { sp, level, elite: elite || sp.rarity >= 2, ctx };
  }
  function standable(x, y, z, aquatic) {
    const b0 = world.getBlock(x, y, z), b1 = world.getBlock(x, y + 1, z), below = world.getBlock(x, y - 1, z);
    if (aquatic) return b0 === B.WATER && (b1 === B.WATER || b1 === B.AIR);
    return b0 === B.AIR && (b1 === B.AIR || b1 === B.TORCH) && isSolid(below) && below !== B.LAVA && !BARRIER.has(below);
  }
  // fences, palisades and walls keep Kin out: nothing walks along the top of them, so a Kin that meets one turns back (fliers still go over)
  const BARRIER = new Set([B.FENCE, B.PALISADE, B.IRONWALL, B.LAMP].filter(x => x != null));
  function makeEntity(sp, level, x, y, z, opts = {}) {
    const kin = KIN.create(sp, level);
    const st = KIN.stats(kin);
    const m = KIN.model(sp, kin.stage);
    const e = {
      kin, x, y, z, yaw: Math.random() * Math.PI * 2, tx: x, tz: z, wait: 1 + Math.random() * 3,
      speed: Math.min(3.2, 0.9 + st.spd / 90), senseR: opts.senseR || (3.4 + Math.min(2.6, st.agi / 55) + Math.min(2, m.radius * 0.5)), alert: 0, // the ring grows a little with agility and size, never past about eight blocks
      aquatic: !!opts.aquatic, flying: sp.shape === 'bird' || sp.shape === 'floater', model: m, scale: 1, hover: m.hover, bob: Math.random() * 6,
      mesh: R.entityMesh(KIN.meshKey(sp, kin.stage), (mb) => KIN.buildMesh(mb, m)),
      skyMul: 1, elite: !!opts.elite, patrol: opts.patrol || null, sleep: !!opts.sleep, isMythic: !!opts.isMythic, isWarden: !!opts.isWarden, isLegend: !!opts.isLegend, isApex: opts.isApex || null, skyT: 0
    };
    return e;
  }
  function trySpawn(player, trainerLevel) {
    const px = player.x, py = player.y, pz = player.z;
    const layer = world.layerAt(Math.floor(py), Math.floor(px), Math.floor(pz));
    for (let attempt = 0; attempt < 14; attempt++) {
      const a = Math.random() * Math.PI * 2, d = 13 + Math.random() * 18;
      const x = Math.floor(px + Math.cos(a) * d), z = Math.floor(pz + Math.sin(a) * d);
      let y = null, aquatic = false;
      if (player.underwater || player.inWater || layer === 'Water') {
        const yy = Math.floor(py) + Math.floor(Math.random() * 7) - 3;
        if (standable(x, yy, z, true)) { y = yy; aquatic = true; }
      } else if (layer === 'Surface') {
        const g = world.groundY(x, z);
        const top = world.getBlock(x, g + 1, z);
        if (top === B.WATER) {
          // aquatic spawn at the surface or down in the water
          const depth = world.topAt(x, z) - g;
          y = depth > 3 && Math.random() < 0.5 ? g + 1 + Math.floor(Math.random() * (depth - 1)) : SEA;
          aquatic = true;
        } else if (top === B.AIR && Math.abs(g + 1 - py) < 14 && g + 1 > 2) y = g + 1;
      } else {
        const lo = layer === 'Core' ? 5 : Math.floor(py) - 7, hi = layer === 'Core' ? 10 : Math.floor(py) + 7;
        const yy = lo + Math.floor(Math.random() * (hi - lo + 1));
        if (standable(x, yy, z, false)) y = yy;
      }
      if (y == null) continue;
      if (Math.hypot(x - px, z - pz) < 10) continue;
      if (api.noSpawn && Math.hypot(x - api.noSpawn.x, z - api.noSpawn.z) < api.noSpawn.r) continue;
      if (typeof Keeps !== 'undefined' && Keeps.near(x, z, 24).length) continue; // nothing wild walks into a hold
      const r = roll(x + 0.5, y, z + 0.5, trainerLevel);
      const e = makeEntity(r.sp, r.level, x + 0.5, y, z + 0.5, { aquatic, elite: r.elite });
      if (e.kin.sp.rarity >= 4) { e.speed *= 0.5; e.senseR = 3.5; e.legend = true; if (aquatic) { e.breach = Math.random() * 10; e.sleep = true; } }
      if (!aquatic && layer !== 'Surface' && Math.random() < 0.3) {
        // patrols along a short line
        const dx = Math.random() < 0.5 ? 6 : 0, dz = dx ? 0 : 6;
        e.patrol = { ax: e.x - dx, az: e.z - dz, bx: e.x + dx, bz: e.z + dz, period: 7 + Math.random() * 3, phase: Math.random() };
      }
      list.push(e);
      return e;
    }
    return null;
  }
  function ensureHeart(player, trainerLevel, mythicCaught) {
    const h = world.heart; if (!h) return;
    const d = Math.hypot(player.x - h.x, player.z - h.z);
    if (d > 60 || player.y > 36) return;
    if (!mythicRef && !mythicCaught) {
      const sp = KIN.mythicSpecies(world.seed);
      mythicRef = makeEntity(sp, Math.max(26, trainerLevel + 9), h.x + 0.5, 5, h.z + 0.5, { senseR: 6.5, sleep: true, isMythic: true });
      mythicRef.yaw = Math.PI; mythicRef.speed = 0;
      list.push(mythicRef);
      for (let i = 0; i < 2; i++) {
        const w = makeEntity(KIN.wardenSpecies(world.seed, i), Math.max(20, trainerLevel + 5), h.x - 7 + 0.5, 5, h.z + (i ? 4 : -4) + 0.5, { senseR: 4.6, isWarden: true });
        w.patrol = { ax: h.x - 7.5, az: h.z + (i ? 4.5 : -4.5), bx: h.x + 7.5, bz: h.z + (i ? 4.5 : -4.5), period: 9, phase: i * 0.5 };
        w.speed = 2.2;
        list.push(w);
      }
    }
  }
  // the body's legendary: it waits at its lair, awake, and does not come to you; nothing nearby is less than a hundred strong
  let legendRef = null;
  function ensureLegend(player) {
    const L = world.legend; if (!L || !world.preset.legend) return;
    if ((G.stats.apex || {}).rex !== true) return; // the endgame: they only show once the Tyrannorex is caught
    const lb = (G.stats.legendBack || {})[world.preset.id]; const done = lb === 'caught' || (typeof lb === 'number' && (G.dayCount || 0) < lb); // beaten: back in a few days; caught: gone for good
    const d = Math.hypot(wdd(player.x - L.x), wdd(player.z - L.z));
    if (legendRef && !list.includes(legendRef)) legendRef = null;
    if (legendRef || done || d > 70) return;
    const lx = player.x + wdd(L.x - player.x), lz = player.z + wdd(L.z - player.z);
    world.ensureAround(Math.floor(lx / CH), Math.floor(lz / CH), 1, 99);
    const gy = world.groundY(Math.floor(lx), Math.floor(lz));
    const sp = KIN.legendSpecies(world.preset);
    legendRef = makeEntity(sp, world.preset.legend.level, lx + 0.5, gy + 1, lz + 0.5, { senseR: 7.5, isLegend: true });
    legendRef.speed = 0.6; legendRef.elite = true; legendRef.legend = true;
    legendRef.patrol = { ax: lx - 4.5, az: lz + 0.5, bx: lx + 5.5, bz: lz + 0.5, period: 14, phase: 0 };
    list.push(legendRef);
    UI.toast(`${sp.names[0]}. Lv ${world.preset.legend.level}. It has seen you.`, 'bad');
  }
  // the Lost World's giants: Tyrannorex walks the middle of the plateau, Abyssaurus circles the nearest deep water
  const apexRefs = { rex: null, mosa: null };
  const APEX_LV = { rex: 170, mosa: 160 };
  function apexSea() {
    const L = world.lost; if (!L) return null;
    if (L.sea !== undefined) return L.sea;
    L.sea = null;
    const deep = (x, z) => world.colInfo(x, z).h < SEA - 7;
    for (let r = L.rim + 40; r < 2400 && !L.sea; r += 24) {
      for (let k = 0; k < 48; k++) {
        const a = k / 48 * Math.PI * 2 + r * 0.01; const x = Math.round(L.x + Math.cos(a) * r), z = Math.round(L.z + Math.sin(a) * r);
        if (!deep(x, z)) continue;
        // room to swim: a 30-block lane of deep water
        const ok = [-15, -8, 0, 8, 15].every(o => deep(x + o, z) && deep(x + o, z + 6) && deep(x + o, z - 6));
        if (ok) { L.sea = { x, z }; break; }
      }
    }
    return L.sea;
  }
  function ensureApex(player) {
    const L = world.lost; if (!L || !G.stats.lostMap) return;
    const st = G.stats.apex || {}; const done = {}; for (const k in st) done[k] = st[k] === true || (st[k] && (G.dayCount || 0) < st[k].back);
    const spots = { rex: { x: L.x, z: L.z }, mosa: apexSea() };
    for (const kind of ['rex', 'mosa']) {
      const ref = apexRefs[kind]; if (ref && !list.includes(ref)) apexRefs[kind] = null;
      const at = spots[kind]; if (!at || apexRefs[kind] || done[kind]) continue;
      if (Math.hypot(wdd(player.x - at.x), wdd(player.z - at.z)) > 80) continue;
      const ax = player.x + wdd(at.x - player.x), az = player.z + wdd(at.z - player.z);
      world.ensureAround(Math.floor(ax / CH), Math.floor(az / CH), 1, 99);
      const sp = KIN.apexSpecies(kind); const mosa = kind === 'mosa';
      const gy = mosa ? SEA - 4 : world.groundY(Math.floor(ax), Math.floor(az)) + 1;
      const e = makeEntity(sp, APEX_LV[kind], ax + 0.5, gy, az + 0.5, { senseR: mosa ? 9 : 8, isApex: kind, aquatic: mosa });
      e.speed = mosa ? 1.4 : 0.8; e.elite = true; e.legend = true;
      e.patrol = mosa ? { ax: ax - 14, az: az + 0.5, bx: ax + 14, bz: az + 0.5, period: 26, phase: 0 } : { ax: ax - 6, az: az - 3, bx: ax + 6, bz: az + 3, period: 22, phase: 0 };
      if (mosa) e.breach = 0;
      apexRefs[kind] = e; list.push(e);
      UI.toast(mosa ? `Something huge moves under the water. ${sp.names[0]}, Lv ${APEX_LV[kind]}.` : `The ground shakes. ${sp.names[0]}, Lv ${APEX_LV[kind]}, rules the Lost World.`, 'bad');
    }
  }
  // settle a walker's height: a step up is taken at once (no foot sunk in bare rock while it catches up), a step down is eased
  function settleY(e, ty, dt, rate) { if (!e.flying && !e.aquatic && ty > e.y) e.y = ty; else e.y += (ty - e.y) * Math.min(1, dt * rate); }
  function findGround(x, y, z, e) {
    const bx = Math.floor(x), bz = Math.floor(z);
    if (e.aquatic) { for (const dy of [0, 1, -1, 2, -2]) { if (world.getBlock(bx, Math.floor(y) + dy, bz) === B.WATER) return Math.floor(y) + dy; } return null; }
    if (!e.flying) { const fy = Math.floor(y); for (let k = 0; k <= 1; k++) if (BARRIER.has(world.getBlock(bx, fy + k, bz))) return null; } // a fence in the way is a wall to a walker
    for (const dy of [0, 1, -1, 2, -2, -3]) { const yy = Math.floor(y) + dy; if (standable(bx, yy, bz, false)) return yy; }
    return null;
  }
  function skyExposure(e) {
    const top = world.topAt(Math.floor(e.x), Math.floor(e.z));
    const y = Math.floor(e.y);
    if (y >= SKY_SPLIT) return 1;
    return y >= top ? 1 : Math.max(0, 1 - (top - y) * 0.11);
  }

  // returns a battle trigger or null
  function update(dt, player, time, battleActive) {
    hauntT -= dt; if (hauntT <= 0) { hauntT = 2.5; try { tendHaunts(player, G.trainerLevel || 1); } catch (e) {} }
    let trigger = null;
    const px = player.x, pz = player.z, py = player.y;
    const sneaking = player.sneak;
    const moving = Math.hypot(player.vx, player.vz) > 0.6 || Math.abs(player.vy) > 0.5;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      let dx = px - e.x, dz = pz - e.z, dy = (py + 0.9) - (e.y + 0.6);
      const dist = Math.hypot(dx, dz, dy * 0.8);
      if (dist > 58 && !e.high && !e.finalBoss && !e.isMythic && !e.isWarden && !e.raider && !e.lieutenant && !e.isLegend && !e.isApex) { list.splice(i, 1); continue; }
      if ((e.isMythic || e.isWarden || e.isLegend || e.isApex) && dist > 100) { list.splice(i, 1); if (e.isMythic) mythicRef = null; if (e.isLegend) legendRef = null; if (e.isApex) apexRefs[e.isApex] = null; continue; }
      e.bob += dt;
      if (e.breach != null) { e.breach += dt; const c = e.breach % 11; e.hover = c < 2.2 ? Math.sin(c / 2.2 * Math.PI) * 3.0 : 0; }
      e.skyT -= dt; if (e.skyT <= 0) { e.skyT = 0.4; e.skyMul = skyExposure(e); }
      if (battleActive) continue;
      if (e.hitT > 0) e.hitT -= dt;
      if (e.high) { if (dist > 90) { list.splice(i, 1); continue; } updateHigh(e, dt, player); continue; } // never triggers a fight on its own: you go up to it
      // ---- dazed: beaten by hand, it lies there for a while, then crawls off ----
      if (e.dazed > 0) {
        e.dazed -= dt; e.hover = (e.model.hover || 0) - Math.min(0.12, e.model.height * 0.08); e.jawOpen = 0.5; e.yaw += Math.sin(e.bob * 2.2) * dt * 0.6;
        { const an = e._an || (e._an = Anim.fresh(e, performance.now())); an.sit = 1; an.lean = 0.3; an.nod = 0.45 + Math.sin(e.bob * 2.2) * 0.1; }
        if (((e.bob * 6) | 0) % 5 === 0 && Math.random() < 0.3) Hazards.sparks(e.x + Math.sin(e.bob * 3) * 0.5, e.y + e.model.height * 0.9 + (e.hover || 0), e.z + Math.cos(e.bob * 3) * 0.5, 1, [1, 0.95, 0.6], 0.3);
        if (e.dazed <= 0 && e.cageWin) { const k = e.cageWin === true ? G.activeKin() : e.cageWin; e.dazed = 0; G.onBattleEnd('won', e, e.kin, k, false); continue; }
        if (e.dazed <= 0) { const st = KIN.stats(e.kin); e.kin.hp = Math.max(1, Math.round(st.hp * 0.25)); e.hover = e.model.hover; e.jawOpen = 0; e.cool = 40; e.alert = 0; e.hunt = 0; e.flee = 7; if (e._an) { e._an.sit = 0; e._an.lean = 0; e._an.nod = 0; } UI.toast(`${KIN.name(e.kin)} shakes itself and slinks off.`); }
        continue;
      }
      if (e.flee > 0) { // away from you, fast, until it is out of sight
        e.flee -= dt; const hd = Math.hypot(dx, dz) || 1; const step = Math.max(e.speed, 3.4) * dt; const a0 = Math.atan2(-dx, -dz); let went = false;
        for (const da of [0, 0.7, -0.7, 1.4, -1.4]) { const a = a0 + da; const nx = e.x + Math.sin(a) * step, nz = e.z + Math.cos(a) * step; const gy = findGround(nx, e.y, nz, e); if (gy != null) { e.x = nx; e.z = nz; settleY(e, (e.flying && !e.aquatic ? gy + 0.6 : gy), dt, 6); e.yaw = a; went = true; break; } }
        if (!went) e.flee = 0; continue;
      }
      // ---- the live fight: it has turned on you, and comes for you (or the Kin at your side) until one of you gives up ----
      if (e.chase) {
        const c = e.chase; c.t -= dt; c.hitCd -= dt; if (c.pt > 0) c.pt -= dt; if (c.foeT > 0) c.foeT -= dt;
        const bud = (typeof Buddy !== 'undefined' && Buddy.current) ? Buddy.current() : null;
        const bd = bud ? Math.hypot(bud.x - e.x, bud.z - e.z) : 1e9, pd0 = Math.hypot(dx, dz);
        const atBuddy = !!bud && (c.foe === 'buddy' && c.foeT > 0 ? bd < 14 : bd < pd0 * 0.8); // it remembers who hit it for a few seconds, else takes the nearer
        const tg = atBuddy ? { x: bud.x, y: bud.y + 0.5, z: bud.z } : { x: px, y: py, z: pz }; c.atBuddy = atBuddy;
        if (atBuddy) { dx = tg.x - e.x; dz = tg.z - e.z; dy = tg.y - (e.y + 0.6); }
        const hd = Math.hypot(dx, dz);
        if (c.t <= 0 || pd0 > (c.rage ? 34 : 30)) { disengage(e, c.rage ? 20 : 12); continue; }
        const an = e._an || (e._an = Anim.fresh(e, performance.now()));
        if (e.stunT > 0) { e.stunT -= dt; e.hover = (e.model.hover || 0) + Math.sin(e.bob * 14) * 0.04; e.jawOpen = 0; an.nod = Math.sin(e.bob * 12) * 0.25; an.lean = 0.15; c.phase = 'close'; c.hitCd = Math.max(c.hitCd, 0.5); continue; }
        an.nod = 0; an.lean = 0; an.sit = 0;
        const near = 1.1 + Math.min(2.2, (e.model.radius || 0.6) * e.scale * 0.7);
        const want = e.flying && !e.aquatic ? py + 0.8 : null;
        if (c.phase === 'close' || c.phase === 'rest') {
          if (hd > near) { const step = Math.min(hd - near * 0.8, e.speed * dt); const nx = e.x + dx / hd * step, nz = e.z + dz / hd * step; const gy = findGround(nx, e.y, nz, e); if (gy != null) { e.x = nx; e.z = nz; settleY(e, (want != null ? Math.max(gy + 0.6, want) : gy), dt, 8); } else { const gy2 = findGround(e.x, e.y, nz, e); if (gy2 != null) { e.z = nz; settleY(e, gy2, dt, 8); } } }
          e.yaw = Math.atan2(dx, dz); e.hover = (e.model.hover || 0) + (e.flying ? Math.sin(e.bob * 2) * 0.08 : 0); e.jawOpen = 0;
          if (c.phase === 'rest' && c.pt <= 0) c.phase = 'close';
          if (c.phase === 'close' && hd <= near + 0.5 && Math.abs(dy) < 2.4 && c.hitCd <= 0) { c.phase = 'wind'; c.pt = 0.42; }
        } else if (c.phase === 'wind') { // crouched, jaws open: your cue to raise the shield or step aside
          const k = 1 - c.pt / 0.42; e.hover = (e.model.hover || 0) - 0.1 * k; e.jawOpen = Math.min(1, k * 1.4); e.yaw = Math.atan2(dx, dz); an.lean = -0.25 * k; an.nod = -0.2 * k;
          if (c.pt <= 0) { c.phase = 'lunge'; c.pt = 0.24; c.hit = false; }
        } else if (c.phase === 'lunge') {
          const k = 1 - c.pt / 0.24; e.hover = (e.model.hover || 0) + Math.sin(k * Math.PI) * 0.35; e.jawOpen = 1 - k * 0.6; an.lean = 0.35 * Math.sin(k * Math.PI); an.nod = 0.3 * Math.sin(k * Math.PI);
          if (hd > near * 0.7) { const step = Math.min(hd - near * 0.7, 2.6 * dt); const nx = e.x + dx / hd * step, nz = e.z + dz / hd * step; const gy = findGround(nx, e.y, nz, e); if (gy != null) { e.x = nx; e.z = nz; } }
          if (!c.hit && k > 0.45) { c.hit = true; if (hd <= near + 0.9 && Math.abs(dy) < 2.4) { if (c.atBuddy) biteBuddy(e); else bite(e, player); } }
          if (c.pt <= 0) { c.phase = 'rest'; c.pt = 0.6 + Math.random() * 0.5; c.hitCd = c.pt + 0.1; }
        }
        continue;
      }
      if (e.raider || e.siege) continue; // raiders and besiegers are steered by their village
      // ---- movement ----
      if (e.patrol) {
        const p = e.patrol; const t = ((time / p.period) + p.phase) % 1; const s = t < 0.5 ? t * 2 : 2 - t * 2; // ping-pong
        const nx = U.lerp(p.ax, p.bx, s), nz = U.lerp(p.az, p.bz, s);
        const mdx = nx - e.x, mdz = nz - e.z;
        if (Math.hypot(mdx, mdz) > 0.02) e.yaw = Math.atan2(mdx, mdz);
        const gy = findGround(nx, e.y, nz, e);
        if (gy != null) { e.x = nx; e.z = nz; settleY(e, gy, dt, 8); }
      } else if (e.hunt > 0 && !e.sleep) {
        e.hunt -= dt; const hd = Math.hypot(dx, dz) || 1; const step = Math.min(hd, e.speed * 0.9 * dt);
        if (hd > 2.2 + Math.min(2, (e.model.radius || 0.6) * 0.6)) { const nx = e.x + dx / hd * step, nz = e.z + dz / hd * step; const gy = findGround(nx, e.y, nz, e); if (gy != null) { e.x = nx; e.z = nz; settleY(e, gy, dt, 6); } else e.hunt = 0; }
        e.yaw = Math.atan2(dx, dz);
      } else if (!e.sleep) {
        e.wait -= dt;
        if (e.wait <= 0) { e.wait = 2 + Math.random() * 5; const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6; e.tx = e.x + Math.cos(a) * r; e.tz = e.z + Math.sin(a) * r; e.moving = true; }
        if (e.moving) {
          const mdx = e.tx - e.x, mdz = e.tz - e.z, md = Math.hypot(mdx, mdz);
          if (md < 0.3) e.moving = false;
          else {
            const step = Math.min(md, e.speed * dt);
            const nx = e.x + mdx / md * step, nz = e.z + mdz / md * step;
            const gy = findGround(nx, e.y, nz, e);
            if (gy == null) { e.moving = false; e.yaw += Math.PI; }
            else {
              e.x = nx; e.z = nz;
              const targetY = e.flying && !e.aquatic ? gy + 0.6 + Math.sin(e.bob * 1.3) * 0.3 : gy;
              settleY(e, targetY, dt, 6);
              const ty = Math.atan2(mdx, mdz); let d = ty - e.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; e.yaw += d * Math.min(1, dt * 6);
            }
          }
        }
      }
      // ---- detection ----
      if (e.cool > 0) continue;
      if (player.flying) { e.alert = Math.max(0, e.alert - dt); e.hunt = 0; continue; } // nothing reaches you in the Starship
      if (G.repelUntil > performance.now() && !e.isBoss && !e.lieutenant && !e.raider) { e.alert = 0; e.hunt = 0; continue; } // hushed: they do not notice you
      const senseR = e.senseR * (sneaking ? (inTallGrass() ? 0.38 : 0.7) : 1) * (player.senseMul || 1) * (player.wingsOn && player.y - e.y > 2.5 ? 0.15 : 1); // silent wings overhead
      if (dist < senseR + 0.5) {
        const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
        const dl = Math.hypot(dx, dz) || 1;
        const facing = (fx * dx + fz * dz) / dl; // 1 = player right in front
        let rate;
        if (e.sleep) rate = (moving ? (sneaking ? 0.3 : 0.9) : 0.12) * (dist < 2.5 ? 2 : 1);
        else if (facing > 0.35) rate = 2.6;
        else if (moving && !sneaking) rate = 1.1;
        else if (moving && sneaking) rate = 0.18;
        else rate = -0.6;
        e.alert = U.clamp(e.alert + rate * dt * (dist < senseR * 0.5 && !sneaking ? 1.5 : 1), 0, 1);
        // only the real threats force a fight: tyrants, their guards, legends, the lab's splice and the truly rare; everything else follows you and gives up
        const strong = (e.kin.sp.rarity || 0) >= 3 || e.lieutenant || e.isBoss || e.isLegend || e.isApex || e.isLabBoss || e.lairQuest || e.nightQuest || e.kinmaster || e.keepBoss || e.finalBoss || e.skyBoss;
        // once it has seen you, stay in its ring for three seconds and it attacks; walk out in time and it lets you go
        if (e.alert >= 1) { e.ringT = (e.ringT || 0) + dt; if (!strong) e.hunt = 4; } else e.ringT = Math.max(0, (e.ringT || 0) - dt);
        if (e.alert >= 1 && !trigger && (strong || e.ringT >= 3)) trigger = { e, ambush: false };
        // bump into it and it attacks, seen or not (sneak up and set the snare instead)
        const touch = 1.0 + Math.min(2, (e.model.radius || 0.6) * 0.6);
        if (dist < touch && !trigger) trigger = { e, ambush: e.alert < 0.6 };
      } else { e.alert = Math.max(0, e.alert - dt * 0.8); e.ringT = 0; }
    }
    updateDrops(dt, player);
    highTimer -= dt;
    if (highTimer <= 0 && !battleActive) {
      highTimer = 14 + Math.random() * 10;
      const highs = list.filter(e => e.high).length;
      if (highs < 2 && world.preset.id === 'earth' && !player.inWater && !(G.repelUntil > performance.now()) && Math.random() < 0.6) spawnHigh(player);
    }
    // spawning
    spawnTimer -= dt;
    if (spawnTimer <= 0 && !battleActive) {
      const lured = G.lure && G.lure.until > performance.now(); const hushed = G.repelUntil > performance.now();
      spawnTimer = lured ? 1.2 : 3.5;
      const near = list.filter(e => !e.high && !e.isMythic && !e.isWarden && !e.lieutenant && !e.raider && !e.isBoss && !e.isLegend && !e.isApex).length;
      const inWater = player.inWater || player.underwater;
      const cap = inWater ? Math.min(maxCount, 4) : calmHere(player) ? Math.min(maxCount, 4) : Math.min(maxCount, 6);
      if (near < (lured ? cap + 3 : cap) && !hushed) trySpawn(player, player.trainerLevel || 1);
    }
    return trigger;
  }
  // ---- the live fight ----
  // the ones steel cannot finish: tyrants and their guards, legends, apexes, the lab's splice, anything a quest hangs on, and the truly rare
  function unfinishable(e) { return (e.kin.sp.rarity || 0) >= 3 || e.lieutenant || e.isBoss || e.isLegend || e.isApex || e.isLabBoss || e.isMythic || e.isWarden || e.lairQuest || e.nightQuest || e.kinmaster || e.keepBoss || e.finalBoss || e.skyBoss || e.tangleBoss || e.citadelFirst || e.thief || e.pest || e.rogue || e.raider || e.siege || e.kin.sp.mythic; }
  function biteDmg(e) { const big = e.isBoss || e.isLegend || e.isApex || e.keepBoss || e.finalBoss || e.lieutenant; return Math.max(1, Math.round((1 + e.kin.level / 15 + (e.chase && e.chase.rage ? 1 : 0)) * (big ? 1.5 : 1))); } // you have ten hearts: a Lv 30 Kin takes three a bite, armour and a shield take the edge off
  // it turns on you: from here it is a live fight until you deploy a Kin, beat it by hand, or get away
  function engage(e, ambush, opts = {}) {
    if (e.chase || e.dazed > 0) { if (e.chase) e.chase.t = Math.max(e.chase.t, 18); return; }
    const st = KIN.stats(e.kin);
    if (e.speed0 == null) e.speed0 = e.speed; if (e.patrol) { e.patrol0 = e.patrol; e.patrol = null; }
    e.speed = Math.max(e.speed, (opts.rage ? 3.9 : 2.4) + st.spd / 45);
    e.chase = { t: opts.rage ? 14 : 18, hitCd: ambush ? 1.4 : 0.8, phase: 'close', pt: 0, rage: !!opts.rage };
    e.alert = 1; e.hunt = 0; e.sleep = false; e.cool = 0; e.ringT = 0; e.flee = 0; e.moving = false;
    api.chaser = e;
    if (!opts.quiet) { UI.sfx('miss'); if (G.stats && !G.stats.liveTold) { G.stats.liveTold = true; G.explain('A wild Kin turns on you', 'It is a live fight now. Your lead Kin beside you takes it on with its own moves, far stronger than any blade; help with your weapon, hold your shield up to block, raise it or swing just as it lunges to parry, or run. DEPLOY picks which Kin fights, or sends one in when nobody is at your side.'); } else UI.toast(`${KIN.name(e.kin)} comes for you.`, 'bad'); }
  }
  function disengage(e, cool = 12) {
    if (!e.chase) return; e.chase = null; e.cool = cool; e.alert = 0; e.hunt = 0; e.jawOpen = 0; e.hover = e.model.hover; e.stunT = 0; if (e._an) { e._an.lean = 0; e._an.nod = 0; }
    if (e.speed0 != null) { e.speed = e.speed0; e.speed0 = null; } if (e.patrol0) { e.patrol = e.patrol0; e.patrol0 = null; }
    if (api.chaser === e) api.chaser = list.find(o => o.chase) || null;
  }
  // a blow from you (or your buddy) lands: frac of its full health, never the last point for the big ones; a common Kin can be beaten by hand and lies dazed
  function strike(e, frac, opts = {}) {
    if (e.dazed > 0) return { dmg: 0, pct: 0, dazed: true };
    const st = KIN.stats(e.kin); let dmg = Math.max(1, Math.round(st.hp * frac));
    const hard = unfinishable(e); if (hard) dmg = Math.max(1, Math.round(dmg * 0.35)); // the big ones shrug most of it off
    const keepOne = hard || opts.keepOne; const before = e.kin.hp;
    e.kin.hp = keepOne ? Math.max(1, e.kin.hp - dmg) : e.kin.hp - dmg;
    e.hitT = 0.3; e.sleep = false;
    if (!e.chase) engage(e, false, { quiet: !!opts.quiet }); else e.chase.t = Math.max(e.chase.t, 18);
    if (e.chase && !opts.arrow) { e.chase.foe = 'player'; e.chase.foeT = 4; }
    if (opts.fromX != null && (e.model.radius || 0.6) * e.scale < 1.3 && !opts.arrow) { const ddx = e.x - opts.fromX, ddz = e.z - opts.fromZ, dl = Math.hypot(ddx, ddz) || 1; const push = opts.push == null ? 0.35 : opts.push; const nx = e.x + ddx / dl * push, nz = e.z + ddz / dl * push; const gy = findGround(nx, e.y, nz, e); if (gy != null && Math.abs(gy - e.y) < 1.6) { e.x = nx; e.z = nz; } }
    if (e.chase && e.chase.phase === 'wind' && (opts.heavy || Math.random() < 0.5)) { e.chase.phase = 'rest'; e.chase.pt = 0.5; e.chase.hitCd = 0.6; } // a hit in the wind-up puts it off its stroke
    G.kinFocus = e; G.kinFocusT = 3.5;
    { const hy = e.y + (e.hover || 0) + (e.model ? e.model.height * e.scale : 1) + 0.2; UI.floater(e.x, hy, e.z, String(Math.max(0, before - Math.max(e.kin.hp, 0))), hard ? 'weak' : ''); }
    if (keepOne && before - dmg < 1 && hard && !e.shrugTold) { e.shrugTold = true; UI.toast(`${KIN.name(e.kin)} shrugs off your steel. Only a Kin can finish it: Deploy.`, 'bad'); }
    if (e.kin.hp <= 0) { daze(e); return { dmg: before, pct: 0, dazed: true }; }
    return { dmg: before - e.kin.hp, pct: Math.round(e.kin.hp / st.hp * 100), dazed: false };
  }
  // the great ones you are meant to be able to cage: beaten live, they go down dazed like any other so a snare can take them
  function cageable(e) { return !!(e.isApex || e.isLegend || e.isMythic); }
  function daze(e, k) {
    e.kin.hp = 1; e.dazed = 10; disengage(e, 0); e.cool = 0; e.alert = 0; e.stunT = 0;
    G.knockout(e.x, e.y, e.z);
    UI.sfx('win'); UI.toast(`${KIN.name(e.kin)} goes down, dazed. Snare it now, or let it go.`, 'good');
    if (!cageable(e)) rewardWin(e, k || null); else e.cageWin = k || true; G.stats.liveWins = (G.stats.liveWins || 0) + 1;
    const dom = KIN.dominant(e.kin.sp.elem, 1)[0]; if (Math.random() < 0.35) { G.player.add('ess_' + dom, 1); UI.toast(`${dom} Essence collected.`); }
  }
  // its lunge reaches you: a shield in its face blocks most of it, a shield raised or a swing timed as it lands turns it away
  function bite(e, player) {
    const dmg = biteDmg(e); const r = Combat.takeBlow(dmg, e.x, e.z, 'kin', e);
    if (r.result === 'parry') { e.stunT = 1.4; e.hitT = 0.3; e.chase.hitCd = 1.6; }
    else { e.chase.t = Math.max(e.chase.t, 18); e.chase.hitCd = 1.0; }
  }
  // your Kin's blow lands: full battle damage, and a Kin can finish anything. A common Kin goes down dazed (your snare window); the scripted ones (tyrants, legends, bosses, quest Kin) are beaten outright
  function scripted(e) { return !!(e.lieutenant || e.isBoss || e.isLegend || e.isApex || e.isLabBoss || e.isMythic || e.isWarden || e.lairQuest || e.nightQuest || e.kinmaster || e.keepBoss || e.finalBoss || e.skyBoss || e.tangleBoss || e.citadelFirst || e.thief || e.pest || e.rogue || e.raider || e.siege || e.kin.sp.mythic); }
  function hitByKin(e, dmg, k) {
    if (e.dazed > 0 || !list.includes(e)) return 0;
    const before = e.kin.hp; e.kin.hp = Math.max(0, e.kin.hp - dmg); e.hitT = 0.35; e.sleep = false;
    if (!e.chase) engage(e, false, { quiet: true }); if (e.chase) { e.chase.t = Math.max(e.chase.t, 18); e.chase.foe = 'buddy'; e.chase.foeT = 5; if (e.chase.phase === 'wind' && Math.random() < 0.4) { e.chase.phase = 'rest'; e.chase.pt = 0.5; e.chase.hitCd = 0.6; } }
    G.kinFocus = e; G.kinFocusT = 3.5;
    if (e.kin.hp <= 0) { if (scripted(e) && !cageable(e)) { G.knockout(e.x, e.y, e.z); G.onBattleEnd('won', e, e.kin, k, false); } else daze(e, k); }
    return before - Math.max(0, e.kin.hp);
  }
  // its lunge reaches your Kin: the battle's numbers, no shield to hide behind
  function biteBuddy(e) {
    const bud = Buddy.current(); if (!bud) return; const k = bud.kin; const mv = KIN.moves(e.kin)[0];
    if (Battle.dodges(e.kin, k)) { e.chase.hitCd = 0.9; return; }
    const r = Battle.calcDamage(e.kin, k, mv); Buddy.hurt(r.dmg, e, r.eff); e.chase.t = Math.max(e.chase.t, 18); e.chase.hitCd = 1.0;
  }
  // what a win in the open pays: the battle's experience to the Kin that fought and a little to the rest, trainer experience, a count
  function rewardWin(e, k) {
    const wild = e.kin; const baseXp = Math.floor(9 * wild.level * (1 + 0.4 * (wild.stage - 1)) * KIN.RARITY[wild.sp.rarity || 0].xp);
    if (k && k.hp > 0) {
      for (const o of G.kin) if (o !== k && o.hp > 0) { const oe = KIN.gainXp(o, Math.floor(baseXp * 0.25)); for (const ev of oe) if (ev.type === 'level') UI.toast(`${KIN.name(o)} (watching) reached Lv ${ev.level}.`); }
      const evs = KIN.gainXp(k, baseXp);
      for (const ev of evs) { if (ev.type === 'peak') G.explain(`${KIN.name(k)} has peaked`, `Lv ${ev.level} is as far as its kind goes. Only a fusion recipe can take it further.`); if (ev.type === 'level') UI.toast(`${KIN.name(k)} reached Lv ${ev.level}.`, 'good'); if (ev.type === 'evolve') { UI.toast(`${ev.name}… it evolved into ${KIN.name(k)}!`, 'good'); UI.sfx('level'); } }
      G.addTrainerXp(baseXp);
    } else G.addTrainerXp(Math.floor(baseXp * 0.5));
    G.stats.battlesWon++; { const dom0 = KIN.dominant(wild.sp.elem, 1)[0]; if (!G.stats.beatElem) G.stats.beatElem = {}; G.stats.beatElem[dom0] = (G.stats.beatElem[dom0] || 0) + 1; }
  }
  function focusText() { const e = G.kinFocus; if (!e || !(G.kinFocusT > 0)) return null; if (e.dazed > 0) return `${KIN.name(e.kin)}: dazed`; return `${KIN.name(e.kin)} Lv ${e.kin.level}: ${Math.max(0, Math.round(e.kin.hp / KIN.stats(e.kin).hp * 100))}%`; }
  // the hostile Kin nearest you, for the Deploy button
  function engagedNear(player, maxD = 16) { let best = null, bd = maxD; for (const e of list) { if (!e.chase && !(e.dazed > 0)) continue; const d = Math.hypot(e.x - player.x, e.z - player.z); if (d < bd) { bd = d; best = e; } } return best; }
  function remove(e) { const i = list.indexOf(e); if (i >= 0) list.splice(i, 1); if (api.chaser === e) api.chaser = list.find(o => o.chase && o !== e) || null; e.chase = null; if (e === mythicRef) mythicRef = null; if (e === legendRef) legendRef = null; if (e.isApex && apexRefs[e.isApex] === e) apexRefs[e.isApex] = null; }
  function nearest(player, maxD = 6) {
    let best = null, bd = maxD;
    for (const e of list) { const d = Math.hypot(e.x - player.x, e.z - player.z, e.y - player.y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  // entity under the crosshair (for tapping on a Kin)
  function pick(player, reach = 7) {
    const eye = player.eye(); const f = U.forwardVec(player.yaw, player.pitch);
    let best = null, bt = reach;
    const airborne = player.gliding || player.mountMode === 'air';
    for (const e of list) {
      if (e.high && !airborne && reach < 20) continue;
      const r = Math.max(0.6, e.model.radius * e.model.scale * 0.9), h = e.model.height * e.model.scale;
      const cx = e.x, cy = e.y + h / 2 + (e.hover || 0), cz = e.z;
      // ray-sphere
      const ox = eye.x - cx, oy = eye.y - cy, oz = eye.z - cz;
      const b = ox * f[0] + oy * f[1] + oz * f[2], c = ox * ox + oy * oy + oz * oz - (Math.max(r, h / 2) * (e.high && airborne ? 3 : 1)) ** 2;
      const disc = b * b - c; if (disc < 0) continue;
      const t = -b - Math.sqrt(disc); if (t > 0 && t < (e.high && airborne ? Math.max(bt, 14) : bt) && (!best || t < bt)) { bt = t; best = e; }
    }
    return best;
  }
  function rings(player) {
    const out = [];
    for (const e of list) {
      if (e.high) continue;
      const d = Math.hypot(e.x - player.x, e.z - player.z);
      if (d > (e.lieutenant || e.isBoss || e.isLegend || e.isApex ? 48 : 16)) continue;
      const a = e.alert;
      const col = e.chase ? [1, 0.1, 0.1, 0.9] : (e.isMythic || e.isLegend || e.isApex) ? [1, 0.4, 0.9, 0.5] : [1, 1 - a * 0.8, 0.2, 0.25 + a * 0.5];
      if (e.lieutenant || e.isBoss) { const pulse = 0.6 + 0.4 * Math.sin(e.bob * 4); out.push({ data: R.ringLines(e.x, e.y + 0.06, e.z, 1.6 + 0.3 * pulse), color: [1, 0.15, 0.1, 0.95] }); out.push({ data: R.ringLines(e.x, e.y + 0.1, e.z, 2.4), color: [1, 0.3, 0.1, 0.6] }); if (e.senseR <= 0) continue; }
      out.push({ data: R.ringLines(e.x, e.y + 0.05, e.z, e.senseR), color: col });
      if (a > 0.05) out.push({ data: R.ringLines(e.x, e.y + 0.08, e.z, e.senseR * (1 - a) + 0.3), color: [1, 0.2, 0.1, 0.8] });
    }
    return out;
  }
  function clear() { drops.length = 0; list.length = 0; mythicRef = null; legendRef = null; apexRefs.rex = apexRefs.mosa = null; }
  const api = { haunts, inTallGrass, isHigh, dropEntities, init, update, list, remove, nearest, pick, rings, roll, ensureHeart, ensureLegend, ensureApex, apexSea, apexLevel: APEX_LV, clear, makeEntity, zoneLevel, noSpawn: null, chaser: null, engage, disengage, strike, hitByKin, daze, focusText, engagedNear, unfinishable, scripted, get mythic() { return mythicRef; }, get legend() { return legendRef; } };
  return api;
})();
