// Building jobs for the quest people: bridges, pens, houses, watchtowers, forts, castles and walled towns,
// checked block by block at a marked site. Plus the night lurker: a Kin that only comes out in the dead of night.
const Builds = (() => {
  let G, world;
  const wd = (d) => d - Math.round(d / WORLD_W) * WORLD_W;
  function init(game) { G = game; world = game.world; }

  // half = half the side of the square; wall = blocks high; towers = corner towers this tall; roof; tower = a watchtower at the centre
  const KINDS = {
    pen:    { name: 'a Kin pen', half: 4, wall: 2, minDiff: 0, line: 'My Kin wander off every night and I spend the morning chasing them. Fence me a pen where the posts are: two blocks high all the way round. Leave a gap for a gate.' },
    house:  { name: 'a house', half: 3, wall: 3, roof: true, minDiff: 0, line: 'The storm took my roof and most of my walls. Build me a house where the posts are: walls three high and a roof over all of it. A door gap is fine. I am too old to sleep outside.' },
    tower:  { name: 'a watchtower', half: 1, tower: 9, minDiff: 1, line: 'I need to see them coming. Build me a watchtower between the posts: nine blocks tall with a platform on top I can stand on.' },
    bridge: { name: 'a bridge', minDiff: 0, line: 'My knees are old and that water is cold. Build me a bridge across, from one post to the other. Anything solid will do, as long as I can walk it.' },
    fort:   { name: 'a walled homestead', half: 6, wall: 3, minDiff: 1, line: 'RIDERS. Every few nights they come through and take what they like. Wall in my homestead where the posts are: three blocks high all the way round, one gap for a gate.' },
    castle: { name: 'a castle', half: 7, wall: 4, towers: 7, minDiff: 2, line: 'I have money and enemies, in that order. Build me a castle where the posts are: walls four high and a tower at each corner, seven high. Do it properly and I have something special for you.' },
    town:   { name: 'a walled town', half: 10, wall: 3, watch: 8, minDiff: 2, line: 'We are a whole settlement and the raiders know it. Wall the whole place in, post to post: three high, one gate, and a lookout tower in one corner at least eight high. Then they can come.' },
  };
  const RAIDERS = { earth: ['riders', 'Indians', 'outlaws on horseback'], moon: ['the Grey Riders', 'crater bandits'], halo: ['dune raiders', 'the shard-thieves'] };

  const solid = (x, y, z) => { const b = world.getBlock(x, y, z); return b !== B.LEAVES && b !== B.TORCH && BLOCKS[b] && BLOCKS[b].solid; };
  const natural = (x, z) => world.colInfo(x, z).h;
  // blocks you have stacked on a column, counted from its natural ground up
  function stack(x, z, upto) { const h = natural(x, z); let n = 0; for (let y = h + 1; y <= h + upto; y++) if (solid(x, y, z)) n++; return n; }

  // ---------- picking a site ----------
  function flatSquare(cx, cz, half) {
    let lo = 999, hi = -999;
    for (let dx = -half; dx <= half; dx += half > 5 ? 2 : 1) for (let dz = -half; dz <= half; dz += half > 5 ? 2 : 1) {
      const info = world.colInfo(cx + dx, cz + dz);
      if (info.h < SEA || info.lost === 'rim') return false;
      lo = Math.min(lo, info.h); hi = Math.max(hi, info.h);
    }
    return hi - lo <= (half > 5 ? 4 : 3);
  }
  function findSquare(w, half, seed) {
    const r = U.rng(seed);
    for (const d of [half + 9, half + 16, half + 26, half + 40]) {
      const a0 = r() * Math.PI * 2;
      for (let k = 0; k < 12; k++) {
        const a = a0 + k / 12 * Math.PI * 2; const cx = Math.round(w.x + Math.cos(a) * d), cz = Math.round(w.z + Math.sin(a) * d);
        if (flatSquare(cx, cz, half)) return { x: cx, z: cz };
      }
    }
    return null;
  }
  // a stretch of water 4 to 16 wide with land on both sides, along x or z
  function findBridge(w, seed) {
    if (!world.preset.water) return null;
    const r = U.rng(seed); const wet = (x, z) => world.colInfo(x, z).h < SEA - 1; /* at least two deep */ const bank = (x, z) => { const h = world.colInfo(x, z).h; return h >= SEA && h <= SEA + 5; };
    for (let d = 14; d <= 120; d += 6) {
      const a0 = r() * Math.PI * 2;
      for (let k = 0; k < 16; k++) {
        const a = a0 + k / 16 * Math.PI * 2; const px = Math.round(w.x + Math.cos(a) * d), pz = Math.round(w.z + Math.sin(a) * d);
        if (!wet(px, pz)) continue;
        for (const [ux, uz] of [[1, 0], [0, 1]]) {
          let i = 0, j = 0;
          while (i < 22 && wet(px + ux * (i + 1), pz + uz * (i + 1))) i++;
          while (j < 22 && wet(px - ux * (j + 1), pz - uz * (j + 1))) j++;
          const len = i + j + 1; const ax = px - ux * (j + 1), az = pz - uz * (j + 1), bx = px + ux * (i + 1), bz = pz + uz * (i + 1);
          if (len >= 4 && len <= 20 && bank(ax, az) && bank(bx, bz)) return { ax, az, bx, bz, len, ux, uz };
        }
      }
    }
    return null;
  }

  // ---------- making and taking the job ----------
  function make(w, r, diff, base, wid) {
    const pool = Object.keys(KINDS).filter(k => KINDS[k].minDiff <= diff);
    let kind = pool[r.int(pool.length)];
    if (kind === 'bridge' && !findBridge(w, U.combine(w.seedN, base.round, 0xB1))) kind = 'pen';
    const K = KINDS[kind]; const rd = RAIDERS[wid] || RAIDERS.earth;
    const line = K.line.replace('RIDERS', rd[r.int(rd.length)].replace(/^./, c => c.toUpperCase()));
    return Object.assign(base, { kind: 'build', what: kind, name: K.name, line });
  }
  function take(w, q) {
    const seed = U.combine(w.seedN, q.round, 0xB1);
    if (q.what === 'bridge') { const b = findBridge(w, seed); if (b) { q.site = b; return; } q.what = 'pen'; q.name = KINDS.pen.name; }
    const K = KINDS[q.what]; const s = findSquare(w, K.half, seed) || { x: Math.round(w.x + K.half + 8), z: Math.round(w.z) };
    q.site = { x: s.x, z: s.z };
  }
  function siteCentre(q) { const s = q.site; return s.ax != null ? { x: (s.ax + s.bx) / 2, z: (s.az + s.bz) / 2 } : { x: s.x, z: s.z }; }

  // ---------- checking the work ----------
  // how high a wall stands at (x, z): its top against the lowest ground beside it, so a dip you dug by mistake does not spoil it
  function topIn(x, z, lo, hi) { for (let y = hi; y >= lo; y--) if (solid(x, y, z)) return y; return lo - 1; }
  function wallHeight(x, z, nx, nz) { const h = natural(x, z); const top = topIn(x, z, h - 3, h + 6); const ground = Math.max(h - 1, Math.min(h, topIn(x + nx, z + nz, h - 3, h), topIn(x - nx, z - nz, h - 3, h))); return top - ground; } // a block's dip is forgiven, a trench is not
  // the share of a square ring that is walled; the posts sit a step out from 'half', so every ring from a step in to two steps out is tried
  const cellScore = (h, need) => h >= need ? 1 : h >= need - 1 && need > 1 ? 0.75 : 0; // a stretch a block short still mostly counts
  function ring(cx, cz, half, need) {
    let best = 0;
    for (const hh of [half, half + 1, half - 1, half + 2]) {
      if (hh < 2) continue; let ok = 0, n = 0;
      for (let i = -hh + 1; i <= hh - 1; i++) { for (const [x, z] of [[cx + i, cz - hh], [cx + i, cz + hh]]) { n++; ok += cellScore(wallHeight(x, z, 0, 1), need); } }
      for (let i = -hh + 1; i <= hh - 1; i++) { for (const [x, z] of [[cx - hh, cz + i], [cx + hh, cz + i]]) { n++; ok += cellScore(wallHeight(x, z, 1, 0), need); } }
      best = Math.max(best, ok / n);
    }
    return best;
  }

  function towerAt(cx, cz, need) { // tallest stack in a 2x2 or 3x3 footprint
    let best = 0; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) best = Math.max(best, stack(cx + dx, cz + dz, need + 3)); return Math.min(1, best / need);
  }
  function roof(cx, cz, half) {
    let ok = 0, n = 0;
    for (let dx = -half + 1; dx <= half - 1; dx++) for (let dz = -half + 1; dz <= half - 1; dz++) { n++; const h = natural(cx + dx, cz + dz); for (let y = h + 3; y <= h + 7; y++) if (solid(cx + dx, y, cz + dz)) { ok++; break; } }
    return ok / n;
  }
  function platform(cx, cz, at) { // at least 5 blocks of a 3x3 at the top
    let best = 0;
    for (let y = at - 1; y <= at + 3; y++) { let n = 0; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (solid(cx + dx, y, cz + dz)) n++; best = Math.max(best, n); }
    return Math.min(1, best / 5);
  }
  function bridgeDone(s) {
    let ok = 0;
    for (let t = 1; t < s.len + 1; t++) { const x = s.ax + s.ux * t, z = s.az + s.uz * t; for (let y = SEA; y <= SEA + 3; y++) if (solid(x, y, z)) { ok++; break; } }
    return ok / s.len;
  }
  // 0..1, and whether it passes
  function measure(q) {
    const K = KINDS[q.what], s = q.site;
    if (q.what === 'bridge') { const f = bridgeDone(s); return { f, pass: f >= 1 }; }
    if (q.what === 'tower') { const h = natural(s.x, s.z); const a = towerAt(s.x, s.z, K.tower), b = platform(s.x, s.z, h + K.tower); const f = a * 0.7 + b * 0.3; return { f, pass: a >= 1 && b >= 1 }; }
    const w = ring(s.x, s.z, K.half, K.wall); const wallPass = w >= 0.84; let f = Math.min(1, w / 0.84); let pass = wallPass;
    if (K.roof) { const r = roof(s.x, s.z, K.half); f = f * 0.6 + Math.min(1, r / 0.8) * 0.4; pass = pass && r >= 0.8; }
    if (K.towers) { const c = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => towerAt(s.x + a * K.half, s.z + b * K.half, K.towers)); const t = c.reduce((m, v) => m + v, 0) / 4; f = f * 0.6 + t * 0.4; pass = pass && c.every(v => v >= 1); }
    if (K.watch) { const c = Math.max(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => towerAt(s.x + a * K.half, s.z + b * K.half, K.watch))); f = f * 0.8 + c * 0.2; pass = pass && c >= 1; }
    return { f, pass };
  }

  // ---------- the marks on the ground ----------
  function post(x, z) { world.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 0, 99); const g = world.groundY(x, z); world.setBlock(x, g + 1, z, B.BASALT); world.setBlock(x, g + 2, z, B.TORCH); }
  function stampPosts(q) {
    const s = q.site;
    if (q.what === 'bridge') { post(s.ax - s.ux, s.az - s.uz); post(s.bx + s.ux, s.bz + s.uz); return; }
    const K = KINDS[q.what]; const o = K.half + 1;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) post(s.x + a * o, s.z + b * o);
  }

  // ---------- the night lurker ----------
  const deadOfNight = () => Math.cos(world.time * Math.PI * 2) > 0.55;
  const lurkers = new Map(); // quest -> entity, never saved
  function makeNight(w, r, base) {
    const tales = [['the Pond Thing', 'There is something in the pond out that way. Only comes up in the dead of night. I have heard it. I want it caught, not killed: I want to see its face.'],
      ['Old Lantern-Eyes', 'Every night, around midnight, two lights come up out of the hollow and look at my house. I want whatever it is in a cage. Not dead. In a cage.'],
      ['the Midnight Digger', 'Something digs up my field after midnight and is gone by dawn. Catch it for me. If you just beat it, it will be back the next night.'],
      ['the Hollow Singer', 'It sings in the dead of night out past the stones. Beautiful and horrible. Catch it before I lose my mind.']];
    const t = tales[r.int(tales.length)];
    return Object.assign(base, { kind: 'night', lurker: t[0], line: t[1] });
  }
  function takeNight(w, q) { const r = U.rng(U.combine(w.seedN, q.round, 0x4E)); const a = r() * Math.PI * 2, d = 50 + r() * 60; q.spot = { x: Math.round(w.x + Math.cos(a) * d), z: Math.round(w.z + Math.sin(a) * d) }; }

  // ---------- archery jobs, once you have a bow ----------
  function makeArchery(w, r, diff, base) {
    const v = ['balloons', 'balloons', 'bullseye', 'range', 'herd'][r.int(5)];
    const n = v === 'balloons' ? 6 + diff * 2 : v === 'herd' ? 3 + diff : v === 'range' ? 4 : 5;
    const line = { balloons: `The fair came through and nobody could hit a single balloon. Show them how. There are ${n} floating over by the posts: pop every one.`,
      bullseye: 'Five targets on poles, near to far, the last one forty paces out. Hit every one of them from the firing post, the one with the torch. My father could. Can you?',
      range: 'Teach my boy to shoot. Build a training range near the posts: four targets of your own (craft them from planks and fronds), then hit each one from at least twelve blocks away.',
      herd: `Kin keep getting into my grain. I do not want them hurt much, just taught. Put an arrow in ${n} of them, any Kin, anywhere.` }[v];
    return Object.assign(base, { kind: 'archery', v, n, line });
  }
  function takeArchery(w, q) {
    if (q.v === 'herd') { q.base = G.stats.arrowHits || 0; return; }
    const s = findSquare(w, 8, U.combine(w.seedN, q.round, 0xA2)) || { x: Math.round(w.x + 16), z: Math.round(w.z) };
    q.site = { x: s.x, z: s.z }; q.hits = [];
  }
  function stampArchery(q) {
    const s = q.site; world.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 3, 99);
    if (q.v === 'balloons') {
      const r = U.rng(U.combine(s.x, s.z, 0xBA)); q.balloons = [];
      for (let i = 0; i < q.n; i++) { const a = r() * Math.PI * 2, d = 4 + r() * 12; const x = Math.round(s.x + Math.cos(a) * d), z = Math.round(s.z + Math.sin(a) * d); const y = world.groundY(x, z) + 5 + r.int(10); if (world.getBlock(x, y, z) !== B.AIR) continue; world.setBlock(x, y, z, B.BALLOON); q.balloons.push([x, y, z]); }
      q.n = q.balloons.length; post(s.x, s.z);
    } else if (q.v === 'bullseye') {
      post(s.x, s.z); const r = U.rng(U.combine(s.x, s.z, 0xB5)); const a = r() * Math.PI * 2; q.targets = [];
      for (const d of [10, 17, 24, 31, 38]) { const x = Math.round(s.x + Math.cos(a) * d), z = Math.round(s.z + Math.sin(a) * d); world.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 0, 99); const g = world.groundY(x, z); world.setBlock(x, g + 1, z, B.LOG); world.setBlock(x, g + 2, z, B.TARGET); q.targets.push([x, g + 2, z]); }
    } else { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) post(s.x + a * 9, s.z + b * 9); }
  }
  function onShot(type, blk, p) {
    let used = false;
    for (const [w, q] of Npcs.takenList()) {
      if (q.kind !== 'archery' || q.shotDone || !q.site) continue;
      const key = blk.x + ',' + blk.y + ',' + blk.z;
      if (type === 'balloon' && q.v === 'balloons' && q.balloons && q.balloons.some(b => b.join(',') === key)) { used = true; const left = q.balloons.filter(b => world.getBlock(b[0], b[1], b[2]) === B.BALLOON).length; if (!left) { q.shotDone = true; UI.sfx('quest'); UI.toast(`Every balloon popped. Go and tell ${q.wname}.`, 'good'); } else UI.toast(`Pop! ${left} to go.`); }
      if (type === 'target' && q.v === 'bullseye' && q.targets) { const i = q.targets.findIndex(t => t.join(',') === key); if (i < 0) continue; used = true;
        if (Math.hypot(p.x - (q.site.x + 0.5), p.z - (q.site.z + 0.5)) > 4.5) { UI.toast('That one does not count: shoot from the firing post, the torch.'); continue; }
        if (!q.hits.includes(i)) q.hits.push(i); const left = q.targets.length - q.hits.length; if (!left) { q.shotDone = true; UI.sfx('quest'); UI.toast(`Five for five. Go and tell ${q.wname}.`, 'good'); } else UI.toast(`Bullseye! ${left} to go.`, 'good'); }
      if (type === 'target' && q.v === 'range') { const sx = p.x + wd(q.site.x - p.x), sz = p.z + wd(q.site.z - p.z); if (Math.hypot(blk.x - sx, blk.z - sz) > 30) continue; used = true;
        const d = Math.hypot(blk.x + 0.5 - p.x, blk.z + 0.5 - p.z); if (d < 12) { UI.toast(`Too close (${Math.round(d)} blocks). Back up to twelve.`); continue; }
        if (!q.hits.includes(key)) q.hits.push(key); const left = q.n - q.hits.length; if (left <= 0) { q.shotDone = true; UI.sfx('quest'); UI.toast(`The range works. Go and tell ${q.wname}.`, 'good'); } else UI.toast(`Bullseye from ${Math.round(d)} blocks! ${left} more target${left > 1 ? 's' : ''}.`, 'good'); }
    }
    if (!used) UI.toast(type === 'balloon' ? 'Pop!' : 'Bullseye!', 'good');
  }
  function archeryProgress(q) { if (q.v === 'herd') return Math.min(1, ((G.stats.arrowHits || 0) - (q.base || 0)) / q.n); return q.shotDone ? 1 : 0; }
  function archeryNeed(q) {
    if (q.v === 'herd') return `${Math.min(q.n, (G.stats.arrowHits || 0) - (q.base || 0))} of ${q.n} Kin hit with an arrow. Hold the bow and tap them.`;
    if (q.v === 'balloons') return `${q.balloons ? q.balloons.filter(b => world.getBlock(b[0], b[1], b[2]) === B.BALLOON).length + ' balloons left.' : 'Follow ⌖ to the posts.'} Hold the bow and tap them.`;
    if (q.v === 'bullseye') return `${q.hits ? q.hits.length : 0} of 5 targets hit. Stand at the firing post (the torch) and shoot.`;
    return `${q.hits ? q.hits.length : 0} of 4 targets hit from twelve blocks or more. Craft targets (2 planks, 2 fronds) and set them up near the posts.`;
  }

  // ---------- each frame ----------
  let tick = 0;
  function update(dt, p, inBattle) {
    tick += dt; if (tick < 0.5) return; tick = 0;
    for (const [w, q] of Npcs.takenList()) {
      if (q.kind === 'archery' && q.site && !q.stamped) { const sx = p.x + wd(q.site.x - p.x), sz = p.z + wd(q.site.z - p.z); if (Math.hypot(p.x - sx, p.z - sz) < 70) { q.stamped = true; stampArchery(q); G.meshPass(99); } }
      if (q.kind === 'build' && !q.built) {
        const c = siteCentre(q); const cx = p.x + wd(c.x - p.x), cz = p.z + wd(c.z - p.z); const d = Math.hypot(p.x - cx, p.z - cz);
        if (d < 70 && !q.posts) { q.posts = true; stampPosts(q); G.meshPass(99); }
        if (d < 45) { const m = measure(q); const before = q.prog || 0; q.prog = m.f;
          if (m.pass) { q.built = true; UI.sfx('quest'); UI.toast(`That is ${q.name}. Go and tell ${q.wname}.`, 'good'); }
          else if (Math.floor(m.f * 4) > Math.floor(before * 4) && m.f > 0.2) UI.toast(`${q.name[0].toUpperCase() + q.name.slice(1)}: about ${Math.round(m.f * 100)}% there.`); }
      }
      if (q.kind === 'night' && !q.caught) {
        const sx = p.x + wd(q.spot.x - p.x), sz = p.z + wd(q.spot.z - p.z); const d = Math.hypot(p.x - sx, p.z - sz);
        if (d < 60 && !q.stampedSpot) { q.stampedSpot = true; const bx = Math.floor(sx), bz = Math.floor(sz); world.ensureAround(Math.floor(bx / CH), Math.floor(bz / CH), 1, 99); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const x = Math.floor(sx + Math.cos(a) * 3), z = Math.floor(sz + Math.sin(a) * 3); const g = world.groundY(x, z); world.setBlock(x, g + 1, z, i % 2 ? B.BASALT : B.STONE); } const g0 = world.groundY(bx, bz); world.setBlock(bx, g0, bz, B.AIR); world.setBlock(bx, g0 - 1, bz, B.AIR); G.meshPass(99); }
        let e = lurkers.get(q); if (e && !Wild.list.includes(e)) { lurkers.delete(q); e = null; }
        const night = deadOfNight();
        if (e && !night && !inBattle) { Wild.list.splice(Wild.list.indexOf(e), 1); lurkers.delete(q); UI.toast(`${q.lurker} slips back underground. It is morning.`); continue; }
        if (!e && night && d < 55) {
          const bx = Math.floor(sx), bz = Math.floor(sz); const gy = world.groundY(bx, bz) + 1;
          const rx = Math.floor(U.mod(sx, WORLD_W) / 1024), rz = Math.floor(U.mod(sz, WORLD_W) / 1024);
          const list = KIN.roster(world.preset.id, rx, rz, 'Surface', BIOME_NAME[world.colInfo(bx, bz).biome] || 'Plains', Math.min(9, 3 + q.diff)).filter(sp => (sp.rarity || 0) >= 1);
          const sp = Object.assign({}, list[U.combine(w.seedN, q.round) % Math.max(1, list.length)] || KIN.roster(world.preset.id, 0, 0, 'Surface', 'Plains', 2)[0]);
          sp.names = [q.lurker, q.lurker, q.lurker];
          const lvl = Math.max(5, Wild.zoneLevel(sx, gy, sz, { layer: 'Surface' }, G.trainerLevel) + 2 + q.diff);
          e = Wild.makeEntity(sp, lvl, sx + 0.5, gy, sz + 0.5, { senseR: 5, elite: true }); e.nightQuest = { wid: w.id }; e.speed = 1.6;
          e.patrol = { ax: sx - 4, az: sz + 0.5, bx: sx + 4, bz: sz + 0.5, period: 9, phase: 0 };
          Wild.list.push(e); lurkers.set(q, e);
          UI.toast(`Something climbs out of the ground: ${q.lurker}.`, 'bad');
        }
      }
    }
  }
  function onBattle(info, result) {
    const st = G.npcState[info.wid]; const q = st && st.quest; if (!q || q.kind !== 'night') return;
    if (result === 'caught') { q.caught = true; UI.toast(`You caught ${q.lurker}. Go and show ${q.wname}.`, 'good'); }
    else if (result === 'won') UI.toast(`${q.lurker} drags itself back into the dark. Beaten is not caught: try again another night.`);
  }

  function progressOf(q) { return q.kind === 'archery' ? archeryProgress(q) : q.kind === 'build' ? (q.built ? 1 : 0) : q.caught ? 1 : 0; }
  function needText(q) {
    if (q.kind === 'archery') return archeryNeed(q);
    if (q.kind === 'night') return `${q.lurker} is still out there. It only comes up in the dead of night (around midnight). Follow ⌖, and bring snares: beaten does not count.`;
    if (q.built) return '';
    const pct = q.prog ? ` You are about ${Math.round(q.prog * 100)}% there.` : ' Follow ⌖ to the posts.';
    const K = KINDS[q.what];
    const how = q.what === 'bridge' ? 'A solid walkway from one post to the other, at the water line or just above.' : q.what === 'tower' ? `A tower ${K.tower} high between the posts, with a platform on top.` : `Walls ${K.wall} high joining the four posts${K.roof ? ', and a roof over the inside' : ''}${K.towers ? `, with a tower ${K.towers} high at every corner` : ''}${K.watch ? `, and one corner tower ${K.watch} high` : ''}. A gap for a gate is fine.`;
    return how + pct;
  }
  function text(q) { if (q.kind === 'archery') return { balloons: `pop ${q.n} balloons`, bullseye: 'hit five targets from the firing post', range: 'build a training range and use it', herd: `put an arrow in ${q.n} Kin` }[q.v]; return q.kind === 'night' ? `catch ${q.lurker} (at night)` : `build ${q.name}`; }
  // colours, so you can tell the jobs apart: building amber, archery cyan, night violet
  const COL = { build: '#ffb040', archery: '#4fe0ff', night: '#c08cff' };
  function marks(p) {
    const out = [];
    for (const [w, q] of Npcs.takenList()) {
      if (q.kind === 'build' && !q.built) { const c = siteCentre(q); out.push({ t: '⌖', x: p.x + wd(c.x - p.x), z: p.z + wd(c.z - p.z), name: q.name, col: COL.build }); }
      if (q.kind === 'night' && !q.caught) out.push({ t: '⌖', x: p.x + wd(q.spot.x - p.x), z: p.z + wd(q.spot.z - p.z), name: q.lurker, col: COL.night });
      if (q.kind === 'archery' && q.site && !q.shotDone) out.push({ t: '⌖', x: p.x + wd(q.site.x - p.x), z: p.z + wd(q.site.z - p.z), name: text(q), col: COL.archery });
    }
    return out;
  }
  // a castle pays in a bow, the first time
  function reward(q, rw) {
    if (q.kind === 'build') { const big = { castle: 160, town: 200, fort: 90, tower: 60, house: 50, bridge: 40, pen: 30 }[q.what] || 40; rw.shards += big; rw.xp += big; }
    if (q.kind === 'night') { rw.shards += 70; rw.xp += 80; }
    if (q.kind === 'archery') { rw.shards += 45; rw.xp += 50; if (!rw.amulet) rw.items.arrow = (rw.items.arrow || 0) + 12; }
    if (q.kind === 'build' && q.what === 'castle' && !G.player.has('bow')) rw.bow = true;
    return rw;
  }
  return { init, make, take, makeNight, takeNight, makeArchery, takeArchery, onShot, COL, update, onBattle, progressOf, needText, text, marks, reward, measure, KINDS };
})();
