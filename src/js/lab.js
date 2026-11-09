'use strict';
// The story quest of each world: somebody who tinkers with Kin has been shut in with what they made. An apprentice outside points the
// way to a hidden lab; inside, the splice waits in the dark. Rescue the maker and the incubator is yours: it hatches eggs on play time, and
// come out knowing a technique nothing in the wild has.
const Lab = (() => {
  let G = null, world = null; let apprentice = null, scientist = null, bossRef = null, site = null;
  const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
  const STORY = {
    earth: { who: 'Dr Vexley', kid: 'Pim Vexley', place: 'the lab', bossName: 'Chimera Nine', elems: ['Void', 'Spark', 'Flame'], shape: 'quadruped',
      ask: ['My father splices Kin. Eight of them went wrong and he fed them to the ninth, and the ninth is not wrong at all. It is very, very right.', 'It has him in the lab under the hill. The hatch will not open from inside. I have marked it for you: ⚗ on your compass. Beat it or cage it; please.'],
      wait: ['Not now! It is right behind you!'], thanks: ['You… it is done? It is done. I have been under the bench for two days.', 'The incubator at the back: it hatches eggs, three at a time, and much faster than carrying them about. It keeps them warm while you are off doing whatever you do. It is yours; I am going outside to look at the sky.'] },
    moon: { who: 'Archivist Oon', kid: 'Probe Vel-9', place: 'the vault', bossName: 'Splice-Null', elems: ['Light', 'Void', 'Frost'], shape: 'floater',
      ask: ['The Archivist kept the old Kin in the vault and tried to make a new one from all of them. It made itself instead.', 'It has sealed the vault with the Archivist inside. The way down is marked: ⚗. End it, earth-walker, or cage it.'],
      wait: ['Behind you. It is behind you.'], thanks: ['Earth-walker. The null is gone. The Archivist thanks you in the old way, which is this: the incubator is yours.', 'It warms eggs, three at a time, and hatches them while you are elsewhere.'] },
    halo: { who: 'Ring-Gazer Idris', kid: 'Lale', place: 'the dig', bossName: 'the Amber Wyrm', elems: ['Flame', 'Spark', 'Stone'], shape: 'serpent',
      ask: ['Idris dug under the mesa for ring shards and found something in the amber, asleep. He woke it. Of course he woke it.', 'It has him in the dig and the shaft is blocked from inside. ⚗ marks the hatch. Beat it or cage it and bring him out.'],
      wait: ['Not me! It! Look at it!'], thanks: ['Out. I am out. I owe you the dig, and I mean the incubator in it, the one thing down there that works.', 'It hatches eggs, three at a time, while you get on with things. Take what you want from the chest too.'] },
  };
  function init(game) { G = game; world = game.world; apprentice = null; scientist = null; bossRef = null; site = null; specimens = null; if (!G.labState) G.labState = {}; }
  function S() { const id = world.preset.id; if (!G.labState[id]) G.labState[id] = { told: false, stamped: false, rescued: false, kin: [], days: [], seen: false }; return G.labState[id]; }
  const story = () => STORY[world.preset.id] || STORY.earth;
  const sea = () => world.preset.water ? SEA : world.preset.brine ? world.preset.brineLevel : -99;
  // where things are: the apprentice's tent 300 blocks out on a seeded bearing, the hatch a hundred further round
  function place() {
    if (site) return site;
    const o = world.preset.id === 'earth' ? world.spawn : (world.pad || world.spawn);
    const r = U.rng(world.seed ^ 0x1AB);
    // dry, flat-ish ground well above the water, searched round the circle and outwards until found
    const dry = (x, z) => { const info = world.colInfo(x, z); if (!(info.h > sea() + 3 && info.h < 66) || info.lost || info.lostRim) return null; for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) { const c = world.colInfo(x + dx, z + dz); if (c.h <= sea() + 1 || Math.abs(c.h - info.h) > 4) return null; } return info; };
    const land = (ang, d0, cx, cz) => { for (let d = d0; d < d0 + 900; d += 40) for (let k = 0; k < 52; k++) { const a = ang + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.12; const x = Math.round(cx + Math.cos(a) * d), z = Math.round(cz + Math.sin(a) * d); const info = dry(x, z); if (info) return { x, z, y: info.h + 1, a }; } return null; };
    const a0 = r() * Math.PI * 2;
    const tent = land(a0, 300, o.x, o.z) || { x: o.x + 300, z: o.z, y: world.colInfo(o.x + 300, o.z).h + 1, a: 0 };
    const hatch = land(tent.a + 0.9, 90, tent.x, tent.z) || { x: tent.x + 90, z: tent.z + 40, y: world.colInfo(tent.x + 90, tent.z + 40).h + 1 };
    site = { tent, hatch, roomY: hatch.y - 8 };
    return site;
  }
  function frame(o, px, pz) { const sx = Math.round((px - o.x) / WORLD_W) * WORLD_W, sz = Math.round((pz - o.z) / WORLD_W) * WORLD_W; if (!sx && !sz) return; o.x += sx; o.z += sz; }
  function stampTent(t) {
    const set = (x, y, z, id) => world.setBlock(x, y, z, id); const y0 = t.y;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const g = world.groundY(t.x + dx, t.z + dz, y0 + 4); for (let y = g + 1; y <= y0 + 3; y++) { const b = world.getBlock(t.x + dx, y, t.z + dz); if (b !== B.AIR) set(t.x + dx, y, t.z + dz, B.AIR); } if (g < y0 - 1) for (let y = g + 1; y <= y0 - 1; y++) set(t.x + dx, y, t.z + dz, B.DIRT); }
    for (let dx = -1; dx <= 1; dx++) { set(t.x + dx, y0, t.z - 2, B.PLANKS); set(t.x + dx, y0 + 1, t.z - 2, B.PLANKS); set(t.x + dx, y0 + 2, t.z - 2, B.LOG); }
    set(t.x + 2, y0, t.z, B.TORCH); set(t.x - 2, y0, t.z, B.CHEST);
  }
  // the lab: a hatch in a stone frame, a shaft down, a riveted room with tanks, benches, the incubator at the back
  function stampLab(s) {
    const set = (x, y, z, id) => world.setBlock(x, y, z, id); const hx = s.hatch.x, hz = s.hatch.z, hy = s.hatch.y; const ry = s.roomY;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { set(hx + dx, hy - 1, hz + dz, B.STONE); for (let y = hy; y <= hy + 2; y++) if (world.getBlock(hx + dx, y, hz + dz) !== B.AIR) set(hx + dx, y, hz + dz, B.AIR); }
    set(hx - 1, hy, hz - 1, B.IRONWALL); set(hx + 1, hy, hz - 1, B.IRONWALL); set(hx - 1, hy + 1, hz - 1, B.TORCH); set(hx + 1, hy + 1, hz - 1, B.TORCH);
    // the hatch: a 2 x 2 opening in an iron frame, a ladder down the north wall of the shaft, torches in the walls
    for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) set(hx + dx, hy - 1, hz + dz, B.AIR);
    for (let y = ry; y < hy; y++) {
      for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) set(hx + dx, y, hz + dz, B.AIR);
      for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) { if (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) continue; if (y < hy - 1 || !isSolid(world.getBlock(hx + dx, y, hz + dz))) set(hx + dx, y, hz + dz, (y - ry) % 3 === 1 && dx === 2 && dz === 1 ? B.TORCH : B.IRONWALL); }
      set(hx, y, hz, B.LADDER); // against the wall at hz - 1
    }
    // the room: 15 x 11 inside, 4 high, the shaft arriving at its north-east corner
    const cx = hx - 6, cz = hz + 6;
    for (let dx = -8; dx <= 8; dx++) for (let dz = -6; dz <= 6; dz++) for (let dy = -1; dy <= 5; dy++) {
      const wall = Math.abs(dx) === 8 || Math.abs(dz) === 6; const x = cx + dx, y = ry + dy, z = cz + dz;
      if (dy === -1) set(x, y, z, wall ? B.IRONWALL : B.PLANKS); else if (dy === 5) set(x, y, z, B.IRONWALL); else set(x, y, z, wall ? B.IRONWALL : B.AIR);
    }
    for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) for (let y = ry; y < hy; y++) set(hx + dx, y, hz + dz, dx === 0 && dz === 0 ? B.LADDER : B.AIR); // the shaft runs clean through the room's ceiling to the floor, ladder all the way
    set(hx, hy - 1, hz - 1, B.IRONWALL); for (let y = ry; y < hy; y++) if (!isSolid(world.getBlock(hx, y, hz - 1))) set(hx, y, hz - 1, B.IRONWALL); // the wall the ladder hangs on
    for (let y = ry; y <= ry + 3; y++) { set(hx - 1, y, hz + 1, B.AIR); set(hx, y, hz + 2, B.AIR); }
    // tanks: glass columns full of water with a light on top
    s.tanks = [];
    for (const [tx, tz] of [[cx - 5, cz - 3], [cx - 5, cz + 3], [cx + 5, cz - 3], [cx + 5, cz + 3], [cx - 1, cz - 3], [cx - 1, cz + 3]]) {
      for (let y = ry; y <= ry + 3; y++) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) set(tx + dx, y, tz + dz, y === ry ? B.IRONWALL : (dx || dz) ? B.GLASS : B.WATER);
      set(tx, ry + 4, tz, B.MOONGLOW); // green light over every tank
      s.tanks.push({ x: tx, y: ry + 1, z: tz });
    }
    // strip lights across the ceiling, and a glow along the floor by the walls
    for (let dx = -7; dx <= 7; dx++) for (const dz of [-3, 0, 3]) if ((dx + 8) % 2 === 0) set(cx + dx, ry + 5, cz + dz, B.GLOWGRASS);
    for (let dx = -7; dx <= 7; dx += 2) { set(cx + dx, ry, cz - 5, B.STARSALT); set(cx + dx, ry, cz + 5, B.STARSALT); }
    // benches and lights
    for (let dx = 2; dx <= 5; dx++) set(cx + dx, ry, cz, B.IRONWALL); // the operating table
    set(cx + 3, ry + 1, cz, B.MOONGLOW); set(cx - 3, ry, cz, B.FUSION);
    // the incubator at the west wall, a chest of tonics beside it
    set(cx - 7, ry, cz, B.INCUBATOR); set(cx - 7, ry + 1, cz, B.GLASS); set(cx - 7, ry, cz + 2, B.CHEST);
    const ch = G.chestAt(cx - 7, ry, cz + 2, true); if (!Object.keys(ch.items).length) ch.items = { tonic_heal: 3, tonic_revive: 1 };
    s.room = { x: cx, y: ry, z: cz }; s.incubator = { x: cx - 7, y: ry, z: cz };
  }
  function person(kind, x, y, z, name) {
    const neon = world.preset.id === 'moon';
    const sp = { shape: 'biped', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: neon }, colors: neon ? { body: '#1a1030', belly: '#00f5ff', accent: '#ff2bd6', dark: '#05050f', eye: '#ffffff' } : kind === 'scientist' ? { body: '#2c3e50', belly: '#e8c39e', accent: '#7ad7ff', dark: '#3a2a20', eye: '#222222' } : { body: '#4c7bc9', belly: '#f1d3b3', accent: '#c94c4c', dark: '#3a2a20', eye: '#222222' }, size: kind === 'scientist' ? 1.05 : 0.95, gen: 0, names: [kind], neon };
    const m = KIN.model(sp, 2); KIN.decorate(m, kind === 'scientist' ? 'scientist' : 'wanderer'); if (neon) KIN.decorate(m, 'alien'); if (world.preset.id === 'halo') KIN.decorate(m, 'veil');
    return { role: kind === 'scientist' ? 'scientist' : 'apprentice', name, x, y, z, yaw: 0, model: m, mesh: R.entityMesh('lab:' + kind + ':' + world.preset.id, (mb) => KIN.buildMesh(mb, m)), bob: 0 };
  }
  function standY(x, y, z) { const bx = Math.floor(x), bz = Math.floor(z); for (const dy of [0, 1, -1, 2, -2, 3]) { const yy = Math.floor(y) + dy; const b0 = world.getBlock(bx, yy, bz), b1 = world.getBlock(bx, yy + 1, bz), below = world.getBlock(bx, yy - 1, bz); if ((b0 === B.AIR || BLOCKS[b0].partial) && b1 === B.AIR && isSolid(below) && !isLeaf(below)) return yy; } return null; }
  function bossSpecies() {
    const st = story(); const seed = U.combine(world.seed, 0x1AB0);
    const sp = KIN.species(seed, st.elems, 6, { primary: st.elems[0], shape: st.shape, total: 540, size: 1.7, evolveAt: [9999, 9999], neon: world.preset.id !== 'earth' });
    const e = new Array(9).fill(0.02); for (const el of st.elems) e[KIN.EI[el]] = 0.3; sp.elem = e.map(v => v / e.reduce((a, b) => a + b, 0));
    sp.names = [st.bossName, st.bossName, st.bossName]; sp.feat = { horns: true, wings: st.shape !== 'bird', spikes: true, tail: true, ears: true, crest: true, bigEyes: true, stripes: true, spots: false, armor: true, bigTail: true }; sp.rarity = 3; sp.splice = true;
    if (world.preset.id === 'earth') sp.colors = { body: '#3a2a4a', belly: '#c45cff', accent: '#ffe24a', dark: '#1a1020', eye: '#ff6a1f' };
    return sp;
  }
  function update(dt, p, inBattle) {
    if (!world.preset.villages) return;
    const s = place(); const L = S();
    frame(s.tent, p.x, p.z); frame(s.hatch, p.x, p.z); if (s.room) { frame(s.room, p.x, p.z); frame(s.incubator, p.x, p.z); }
    const dt0 = Math.hypot(p.x - s.tent.x, p.z - s.tent.z), dh = Math.hypot(p.x - s.hatch.x, p.z - s.hatch.z);
    if (dt0 < 70) {
      const tk = U.mod(s.tent.x, WORLD_W) + ',' + U.mod(s.tent.z, WORLD_W);
      if (L.tentStamped !== tk) { world.ensureAround(Math.floor(s.tent.x / CH), Math.floor(s.tent.z / CH), 1, 99); stampTent(s.tent); L.tentStamped = tk; G.meshPass(99); }
      if (!apprentice) { const gy = standY(s.tent.x + 0.5, s.tent.y, s.tent.z + 0.5) ?? s.tent.y; apprentice = person('apprentice', s.tent.x + 0.5, gy, s.tent.z + 0.5, story().kid); }
      const a = apprentice; a.bob += dt; const dx = p.x - a.x, dz = p.z - a.z; if (Math.hypot(dx, dz) < 8) a.yaw = Math.atan2(dx, dz);
      if (!L.seen && dt0 < 24) { L.seen = true; UI.toast(`${story().kid} waves you over. Something is wrong.`, 'good'); }
    } else apprentice = null;
    if (dh < 70 && L.told) {
      const hk = 'v3:' + U.mod(s.hatch.x, WORLD_W) + ',' + U.mod(s.hatch.z, WORLD_W);
      if (L.stamped !== hk) { world.ensureAround(Math.floor(s.hatch.x / CH), Math.floor(s.hatch.z / CH), 2, 999); stampLab(s); L.stamped = hk; G.meshPass(99); UI.toast(`The hatch to ${story().place}. It is open. Something is breathing down there.`, 'bad'); }
      if (!s.room) stampLab(s);
      if (!scientist) { const gy = standY(s.room.x + 6.5, s.room.y, s.room.z - 4.5) ?? s.room.y; scientist = person('scientist', s.room.x + 6.5, gy, s.room.z - 4.5, story().who); }
      const sc = scientist; sc.bob += dt; const dx = p.x - sc.x, dz = p.z - sc.z; if (Math.hypot(dx, dz) < 8) sc.yaw = Math.atan2(dx, dz);
      if (!L.rescued) {
        if (bossRef && !Wild.list.includes(bossRef)) bossRef = null;
        if (!bossRef && Math.hypot(p.x - s.room.x, p.z - s.room.z) < 40) {
          const sp = bossSpecies(); const lvl = Math.max(12, G.trainerLevel + 6, (world.preset.zoneBase || 0) + 12);
          bossRef = Wild.makeEntity(sp, lvl, s.room.x + 0.5, s.room.y, s.room.z + 0.5, { senseR: 7, elite: true }); bossRef.isLabBoss = true; bossRef.speed = 1.3; bossRef.patrol = { ax: s.room.x - 2.5, az: s.room.z + 0.5, bx: s.room.x + 3.5, bz: s.room.z + 0.5, period: 6, phase: 0 };
          Wild.list.push(bossRef);
        }
      } else if (L.rescued && !L.thanked) {
        // the maker comes over, then the incubator is explained
        const d = Math.hypot(p.x - sc.x, p.z - sc.z);
        if (d > 2.2 && d < 30) { const sp = 2.2 * dt; const nx = sc.x + dx / d * sp, nz = sc.z + dz / d * sp; const gy = standY(nx, sc.y, nz); if (gy != null) { sc.x = nx; sc.z = nz; sc.y += (gy - sc.y) * 0.5; } sc.yaw = Math.atan2(dx, dz); sc.moving = true; }
        else if (d <= 2.2 && !Dialogue.active() && !inBattle) { sc.moving = false; L.thanked = true; G.talkNpc = sc; Dialogue.show(story().who, story().thanks, () => { G.shards += 200; G.player.add('snare2', 2); UI.sfx('quest'); UI.toast('+200 Shards and two Void Snares. The incubator is yours.', 'good'); G.stats.labDone = (G.stats.labDone || 0) + 1; if (world.preset.id === 'earth' && !G.stats.lostMap) setTimeout(() => G.giveLostMap(story().who), 600); }); }
      }
    } else { scientist = null; if (bossRef && dh > 90) { Wild.remove(bossRef); bossRef = null; } }
  }
  function onBossBeaten() { const L = S(); L.rescued = true; bossRef = null; UI.toast(`${story().bossName} is down. ${story().who} crawls out from under the bench.`, 'good'); }
  function talk(n) {
    const L = S(); G.talkNpc = n;
    if (n.role === 'apprentice') {
      if (!L.told) { Dialogue.show(n.name, story().ask, () => { L.told = true; UI.toast(`⚗ marks ${story().place}. Follow the compass.`, 'good'); }); return; }
      if (!L.rescued) { Dialogue.show(n.name, [`Please. ⚗ on your compass. ${story().place} is under the hatch.`]); return; }
      Dialogue.show(n.name, ['Thank you. I mean it. Go and use the incubator; it is the only thing down there that ever worked.']); return;
    }
    if (!L.rescued) { Dialogue.show(n.name, story().wait); return; }
    if (!L.thanked) { L.thanked = true; Dialogue.show(n.name, story().thanks, () => { G.shards += 200; G.player.add('snare2', 2); UI.sfx('quest'); }); return; }
    Dialogue.show(n.name, ['The incubator takes three eggs. Leave them and get on with your day; they hatch on their own.']);
  }
  // what floats in the tanks: half-made Kin, a head on its own, a pair of wings; and something strapped to the table
  let specimens = null;
  function makeSpecimens(s) {
    const r = U.rng(world.seed ^ 0x5BEC); const out = [];
    const ros = KIN.roster(world.preset.id, 0, 0, 'Surface', world.preset.id === 'moon' ? 'Mare' : world.preset.id === 'halo' ? 'Dunes' : 'Forest', 3);
    (s.tanks || []).forEach((t, i) => {
      const sp = Object.assign({}, ros[r.int(ros.length)]); sp.size = 0.7; const m = KIN.model(sp, 2);
      const kind = i % 3; // 0 whole and curled, 1 the head only, 2 the top half
      const cut = kind === 1 ? m.height * 0.58 : kind === 2 ? m.height * 0.4 : -1;
      const boxes = m.boxes.filter(b => b.y + b.h > cut).map(b => Object.assign({}, b, { y: b.y - Math.max(0, cut), emis: b.emis || r() < 0.25 }));
      const mm = Object.assign({}, m, { boxes, height: Math.max(...boxes.map(b => b.y + b.h)) });
      out.push({ t, mesh: R.entityMesh('spec:' + world.preset.id + ':' + i, (mb) => { for (const b of mm.boxes) mb.box(b.x, b.y, b.z, b.x + b.w, b.y + b.h, b.z + b.d, U.mixColor(U.hexToRgb(b.c), [0.4, 1.0, 0.6], 0.35), 1, !!b.emis); }), model: mm, yaw: r() * 6, spin: (r() - 0.5) * 0.5, ph: r() * 6, scale: Math.min(1, 1.4 / Math.max(0.6, mm.height)) });
    });
    if (s.room) { const sp = Object.assign({}, ros[0]); sp.size = 0.8; const m = KIN.model(sp, 2); out.push({ t: { x: s.room.x + 3.5, y: s.room.y + 1, z: s.room.z }, mesh: R.entityMesh('spec:table:' + world.preset.id, (mb) => KIN.buildMesh(mb, m)), model: m, yaw: Math.PI / 2, spin: 0, ph: 0, scale: 0.45, lie: true }); }
    return out;
  }
  function entities() { const out = []; const put = (n) => out.push({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, model: n.model, mesh: n.mesh, scale: 1, hover: 0, skyMul: 1, src: n }); if (apprentice) put(apprentice); if (scientist) put(scientist);
    if (site && site.room && scientist) { if (!specimens) specimens = makeSpecimens(site); const now = performance.now() / 1000; for (const sp of specimens) out.push({ x: sp.t.x + 0.5, y: sp.t.y + (sp.lie ? 0 : 0.35 + Math.sin(now * 0.8 + sp.ph) * 0.12), z: sp.t.z + 0.5, yaw: sp.yaw + now * sp.spin, model: sp.model, mesh: sp.mesh, scale: sp.scale, hover: 0, skyMul: 1, isFx: true, src: sp }); }
    return out; }
  function talkable() { const l = []; if (apprentice) l.push(apprentice); if (scientist) l.push(scientist); return l; }
  function marks(p) { const L = S(); const s = site; if (!s) return []; const out = []; if (L.told && !L.rescued) out.push({ t: '⚗', x: p.x + wd(s.hatch.x - p.x), z: p.z + wd(s.hatch.z - p.z), name: story().place }); return out; }
  function mapMarks(p) { const L = S(); const s = place(); const out = [{ kind: 'tent', x: p.x + wd(s.tent.x - p.x), z: p.z + wd(s.tent.z - p.z), name: story().kid }]; if (L.told) out.push({ kind: 'lab', x: p.x + wd(s.hatch.x - p.x), z: p.z + wd(s.hatch.z - p.z), name: story().place }); return out; }
  // ---- the incubator: it takes eggs, never Kin. Three at a time; they hatch on play time, wherever you are, no walking needed ----
  // hours of play by rarity: common 40 min, uncommon 1h15, rare 2h, very rare 3h, legendary 5h
  const INC_H = [0.67, 1.25, 2, 3, 5];
  function canUse() { const L = S(); return L.rescued; }
  const incEggs = () => { const L = S(); if (!L.eggs) L.eggs = []; return L.eggs; };
  function putEgg(e) {
    const L = S(); if (!L.rescued) return 'The incubator is dead until its maker is free.';
    const E = incEggs(); if (E.length >= 3) return 'The incubator takes three eggs.';
    const i = G.eggs.indexOf(e); if (i < 0) return 'Not in your bag.';
    G.eggs.splice(i, 1); const sp = KIN.bySeed(e.seed); const r = e.rarity != null ? e.rarity : (sp ? sp.rarity || 0 : 0);
    const left = Math.max(0.05, 1 - e.walked / e.need); // walking it first still counts
    E.push({ egg: e, start: G.stats.playT || 0, dur: INC_H[Math.min(4, r)] * 3600 * left }); return null;
  }
  function takeEgg(i) { const E = incEggs(); const x = E[i]; if (!x) return 'Nothing there.'; if (G.partyFull()) return 'No room in your party for an egg.'; const done = Math.min(1, ((G.stats.playT || 0) - x.start) / x.dur); x.egg.walked = Math.max(x.egg.walked, x.egg.need * (1 - (1 - done) * (1 - x.egg.walked / x.egg.need))); E.splice(i, 1); G.eggs.push(x.egg); return null; }
  function tickEggs() { if (!G.labState) return; const now = G.stats.playT || 0; for (const id in G.labState) { const L = G.labState[id]; if (!L || !L.eggs) continue; for (const x of L.eggs.slice()) if (now - x.start >= x.dur) { L.eggs.splice(L.eggs.indexOf(x), 1); G.hatchEgg(x.egg, 'Hatched in the incubator. It came out warm and it is already looking for you.'); } } }
  function slots() { const now = G.stats.playT || 0; return incEggs().map(x => ({ egg: x.egg, left: Math.max(0, x.dur - (now - x.start)), pct: Math.min(1, (now - x.start) / x.dur) })); }
  function dawn() { return []; }
  return { init, update, entities, talkable, talk, marks, mapMarks, onBossBeaten, canUse, putEgg, takeEgg, tickEggs, dawn, slots, get site() { return site; }, get boss() { return bossRef; }, get state() { return S(); } };
})();
