'use strict';
// The Black Citadel: where the whole Binding Crystal leads. It rises far out on Earth once all twelve Holds are free.
// A gauntlet that asks for everything you have learned, in order:
//   a chasm you can only glide across, from a launch tower  ·  a thorn gate only a Flame Kin burns
//   the outer court and his best warriors  ·  a dead gate only a Spark Kin wakes  ·  a long flooded hall (bring the bulb)
//   a rubble wall only a Stone Kin breaks  ·  the archery hall: three targets high on the walls open the last gate
//   the stair, and his captains  ·  the throne, where the Kinmaster fights with two Kin, one after the other
const Citadel = (() => {
  let G = null, tick = 0;
  const L = 86; // length, west to east
  function init(game) { G = game; }
  const C = () => { if (!G.stats.citadel) G.stats.citadel = {}; return G.stats.citadel; };
  function onEarth() { return G.world && G.world.preset.id === 'earth'; }
  function site() {
    if (!onEarth()) return null; const c = C(); if (c.site) return c.site;
    const w = G.world; const base = U.hash3(3, 1, 4, w.seed + 0xC17) * Math.PI * 2;
    for (let t = 0; t < 400; t++) {
      const a = base + t * 0.37, r = 1500 + (t % 12) * 40;
      const x = Math.round(w.spawn.x + Math.cos(a) * r), z = Math.round(w.spawn.z + Math.sin(a) * r);
      let ok = true, sum = 0, n = 0;
      for (let dx = -6; dx <= L + 6 && ok; dx += 6) for (let dz = -14; dz <= 14; dz += 7) { const ci = w.colInfo(x + dx, z + dz); if (ci.h <= SEA + 2 || ci.lost || ci.lostRim || ci.h > 76) ok = false; sum += ci.h; n++; }
      if (!ok) continue;
      if (Keeps.sites().some(k => Math.hypot(k.x - x, k.z - z) < 200)) continue;
      c.site = { x, z, y: Math.max(SEA + 3, Math.round(sum / n)) }; return c.site;
    }
    c.site = { x: w.spawn.x + 1600, z: w.spawn.z, y: SEA + 6 }; return c.site;
  }
  function open() { return !!C().open; }
  function begin() { C().open = true; const s = site(); G.pin = { x: s.x, z: s.z }; UI.toast('The crystal pulls east and west at once, then settles. A pin on your map: the Black Citadel.', 'bad'); }
  // ---------------- the build ----------------
  function stamp() {
    const s = site(), w = G.world; const X = s.x, Z = s.z, y0 = s.y; const set = (x, y, z, b) => w.setBlock(X + x, y0 + y, Z + z, b);
    const box = (x0, x1, z0, z1, ya, yb, b) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = ya; y <= yb; y++) set(x, y, z, b); };
    for (let cx = -1; cx <= Math.ceil(L / CH) + 1; cx++) w.ensureAround(Math.floor((X + cx * CH) / CH), Math.floor(Z / CH), 2, 99);
    const F = B.FORTSTONE;
    // ground: flatten the whole footprint, clear the sky above it
    for (let x = -8; x <= L + 7; x++) for (let z = -19; z <= 19; z++) { for (let y = -5; y < 0; y++) if (!isSolid(w.getBlock(X + x, y0 + y, Z + z))) set(x, y, z, B.STONE); set(x, 0, z, Math.abs(z) <= 11 && x >= 17 ? B.BASALT : B.GRAVEL); for (let y = 1; y <= 22; y++) if (w.getBlock(X + x, y0 + y, Z + z) !== B.AIR) set(x, y, z, B.AIR); }
    // 1. a chasm all the way round, nine wide at the front; the launch tower faces it
    const pit = (x, z) => { for (let y = -14; y <= 0; y++) set(x, y, z, y <= -12 ? B.WATER : B.AIR); set(x, -15, z, B.STONE); };
    for (let x = 5; x <= 13; x++) for (let z = -18; z <= 18; z++) pit(x, z);
    for (let x = 5; x <= L + 6; x++) for (const zs of [[13, 18], [-18, -13]]) for (let z = zs[0]; z <= zs[1]; z++) pit(x, z);
    for (let x = L + 2; x <= L + 6; x++) for (let z = -18; z <= 18; z++) pit(x, z);
    // the whole keep is walled: twelve high all round, and the dead ground between halls filled solid
    box(17, L, -12, -12, 1, 12, F); box(17, L, 12, 12, 1, 12, F); box(L, L + 1, -12, 12, 1, 12, F);
    box(36, 59, -11, -4, 1, 12, F); box(36, 59, 4, 11, 1, 12, F); box(61, L, -11, -11, 1, 12, F); box(61, L, 11, 11, 1, 12, F);
    box(0, 4, -2, 2, 1, 9, F); box(1, 3, -1, 1, 1, 9, B.AIR); for (let y = 1; y <= 10; y++) set(2, y, -1, B.LADDER); box(0, 5, -2, 2, 10, 10, B.PLANKS); set(5, 11, 0, B.TORCH);
    // 2. the outer wall and the thorn gate
    box(17, 18, -12, 12, 1, 11, F); box(17, 18, -1, 1, 1, 3, B.THORN); for (let z = -12; z <= 12; z += 2) set(17, 12, z, F);
    for (const z of [-12, 12]) { box(16, 19, z - 1, z + 1, 1, 14, F); set(17, 15, z, B.VOID); set(17, 16, z, B.TORCH); }
    // 3. the outer court: side walls, torches; his best stand here
    box(17, 34, -12, -12, 1, 9, F); box(17, 34, 12, 12, 1, 9, F); for (let x = 20; x <= 32; x += 4) { set(x, 5, -11, B.TORCH); set(x, 5, 11, B.TORCH); }
    // 4. the inner wall and the dead gate
    box(34, 35, -12, 12, 1, 11, F); box(34, 35, -1, 1, 1, 3, B.DEADGATE);
    // 5. the flooded hall: a low corridor full of water, twenty-four blocks of it
    box(36, 59, -3, 3, 0, 6, F); box(36, 59, -2, 2, 1, 4, B.WATER); for (let x = 38; x <= 58; x += 5) set(x, 5, 0, B.MOONGLOW);
    // 6. the rubble wall
    box(60, 60, -3, 3, 1, 5, F); box(60, 60, -1, 1, 1, 3, B.RUBBLE);
    // 7. the archery hall: high walls, three targets near the top, the gate stays shut until all three are hit
    box(61, 72, -10, -10, 1, 12, F); box(61, 72, 10, 10, 1, 12, F); box(61, 61, -10, 10, 1, 12, F); box(61, 61, -1, 1, 1, 3, B.AIR);
    box(72, 73, -10, 10, 1, 12, F); box(72, 73, -1, 1, 1, 3, F);
    set(66, 9, -9, B.TARGET); set(66, 9, 9, B.TARGET); set(71, 10, 0, B.TARGET); for (const [x, z] of [[64, -9], [64, 9], [69, -9], [69, 9]]) set(x, 6, z, B.TORCH);
    // 8. the stair and the throne room
    box(74, L, -10, -10, 1, 14, F); box(74, L, 10, 10, 1, 14, F); box(L, L, -10, 10, 1, 14, F);
    for (let i = 0; i < 4; i++) box(74 + i, 74 + i, -3, 3, 1, i + 1, F);
    box(78, L - 1, -9, 9, 0, 4, F); for (let x = 78; x <= L - 1; x++) set(x, 5, 0, B.CORAL_R);
    box(L - 3, L - 2, -1, 1, 5, 5, B.GOLD); box(L - 1, L - 1, -1, 1, 5, 9, B.GOLD); set(L - 2, 10, 0, B.VOID);
    for (let x = 79; x <= L - 2; x += 4) for (const z of [-8, 8]) { box(x, x, z, z, 5, 13, F); set(x, 10, z + (z < 0 ? 1 : -1), B.TORCH); }
    // a glass-fronted cell beside the throne: someone is kept here
    box(80, 84, 5, 9, 5, 9, F); box(81, 83, 6, 8, 5, 8, B.AIR); box(81, 83, 5, 5, 5, 7, B.GLASS); set(82, 8, 7, B.MOONGLOW);
    G.meshPass(99);
    C().stamped = true; C().cell = { x: X + 82, y: y0 + 5, z: Z + 7 };
    c().throne = { x: X + L - 3, y: y0 + 6, z: Z }; c().court = { x: X + 26, y: y0 + 1, z: Z }; c().stair = { x: X + 82, y: y0 + 5, z: Z };
  }
  // The Citadel's outside, dressed to be seen from far off: merlons along every wall head, ember slots, turrets with spires where the
  // cross-walls meet the sides, a gatehouse over the thorn gate, and a great tower raised on the back wall over the throne. All of it
  // stands on or above the walls; the rooms inside are untouched.
  function dress() {
    const s = site(), w = G.world; const X = s.x, Z = s.z, y0 = s.y; const set = (x, y, z, b) => w.setBlock(X + x, y0 + y, Z + z, b); const F = B.FORTSTONE;
    for (let cx = -1; cx <= Math.ceil(L / CH) + 1; cx++) w.ensureAround(Math.floor((X + cx * CH) / CH), Math.floor(Z / CH), 2, 99);
    for (let x = 17; x <= L + 1; x++) for (const z of [-12, 12]) { const top = x <= 34 ? 12 : 12; for (let y = 10; y <= 12; y++) set(x, y, z, F); if (x % 2 === 0) set(x, 13, z, F); if (x % 4 === 0 && x > 20) set(x, 8, z, B.EMBER); set(x, 1, z, B.BASALT); }
    for (let z = -12; z <= 12; z++) { set(17, 1, z, Math.abs(z) <= 1 ? B.THORN : B.BASALT); if (Math.abs(z) > 3 && z % 3 === 0) set(17, 7, z, B.EMBER); if (z % 2 === 0) set(L + 1, 13, z, F); }
    // turrets on the wall line at each cross-wall, and taller ones at the four corners
    const turret = (x, z, h, big) => { const inz = -Math.sign(z); for (let a = -1; a <= 1; a++) for (let b = 0; b <= 1; b++) { for (let y = 13; y <= h; y++) set(x + a, y, z + b * inz, F); if ((a + b) % 2 === 0) set(x + a, h + 1, z + b * inz, F); }
      for (let a = -1; a <= 1; a++) for (let b = 0; b <= 1; b++) set(x + a, h + 2, z + b * inz, B.SLATE); set(x, h + 3, z, B.SLATE); set(x, h + 4, z, B.VOID); set(x, h - 1, z, B.EMBER); if (big) set(x, h - 4, z, B.EMBER); };
    for (const z of [-12, 12]) { turret(18, z, 20, true); turret(35, z, 16); turret(60, z, 16); turret(73, z, 17); turret(L, z, 22, true); }
    // the gatehouse: stone bridged over the thorn gate, ember eyes, banners down the front
    for (let z = -3; z <= 3; z++) for (let x = 17; x <= 18; x++) { for (let y = 12; y <= 15; y++) set(x, y, z, F); if (z % 2 !== 0) set(x, 16, z, F); }
    set(17, 14, -2, B.EMBER); set(17, 14, 2, B.EMBER); set(17, 9, 0, B.EMBER); for (const z of [-5, -3, 3, 5]) set(16, 8, z, B.BANNER); for (const z of [-9, 9]) set(16, 9, z, B.BANNER);
    // the great tower: the back wall raised in steps to a spire over the throne
    for (const [hw, y0s, y1s] of [[9, 13, 17], [6, 18, 23], [3, 24, 30]]) { for (let z = -hw; z <= hw; z++) for (let x = L; x <= L + 1; x++) { for (let y = y0s; y <= y1s; y++) set(x, y, z, F); if (z % 2 === 0) set(x, y1s + 1, z, F); } for (const z of [-hw + 1, hw - 1, 0]) set(L, y1s - 2, z, B.EMBER); }
    for (let z = -3; z <= 3; z++) for (let x = L - 1; x <= L + 2; x++) set(x, 31 + Math.min(3 - Math.abs(z), 2), z, B.SLATE); set(L, 34, 0, B.VOID); set(L, 35, 0, B.VOID);
    for (const z of [-6, 6]) set(L - 1, 12, z, B.BANNER);
    G.meshPass(99);
  }
  const c = C;
  // ---------------- running it ----------------
  let km = null;
  function update(dt, p) {
    if (!onEarth() || !open() || G.stats.lightReturned) return; tick += dt; if (tick < 0.5) return; tick = 0;
    const s = site(); const d = Math.hypot(s.x + 40 - p.x, s.z - p.z);
    if (!C().stamped && d < 170) stamp();
    if (C().stamped && !C().dressed && d < 170) { C().dressed = true; dress(); }
    if (!C().stamped) return;
    // the two waves of his warriors
    if (d < 120) {
      if (!C().wave1 && !Combat.forHold('cit1').length) spawnWave('cit1', C().court, [['captain', -4, -5], ['captain', 4, 5], ['shield', 0, -2], ['shield', 0, 2], ['axeman', 3, -6], ['archer', -6, 8], ['archer', 6, -8]]);
      if (!C().wave2 && !Combat.forHold('cit2').length) spawnWave('cit2', C().stair, [['captain', 0, -4], ['captain', 0, 4], ['archer', 2, -7], ['archer', 2, 7], ['axeman', -2, 0]]);
      if (!C().wave1 && Combat.forHold('cit1').length && Combat.standingIn('cit1') === 0) { C().wave1 = true; UI.toast('The outer court is quiet. On to the dead gate.', 'good'); }
      if (!C().wave2 && Combat.forHold('cit2').length && Combat.standingIn('cit2') === 0) { C().wave2 = true; UI.toast('His captains are down. He is waiting at the throne.', 'good'); }
      if (C().cell && !C().profFree && !Campaign.hasPerson('prof_cell')) { const cl = C().cell; const n = Campaign.spawnPerson('prof_cell', 'Professor Aldous Finch', 'professor', cl.x, cl.z, { body: '#e8e8e0', belly: '#c9a87a', accent: '#4a8ad0', eye: '#222222' }, ['scientist', 'professor']); n.y = cl.y; n.yaw = Math.PI; }
      if (C().wave2 && !km && !Campaign.hasPerson('km_final')) { const t = C().throne; km = Campaign.spawnPerson('km_final', 'The Kinmaster', 'kinmaster_final', t.x - 2, t.z, { body: '#3a1a4a', belly: '#c9b48a', accent: '#b026ff', dark: '#120818', eye: '#ff3a3a' }, ['crown', 'mask']); km.y = t.y; km.yaw = -Math.PI / 2; }
    } else if (d > 200) { Combat.clearHold('cit1'); Combat.clearHold('cit2'); }
  }
  function spawnWave(id, at, plan) { for (const [kind, ox, oz] of plan) Combat.spawn(kind, at.x + ox + 0.5, at.y, at.z + oz + 0.5, id, 7); }
  // the targets in the archery hall
  function onTarget(hit) {
    if (!open() || !C().stamped) return false; const s = site(); if (Math.hypot(hit.x - s.x - 66, hit.z - s.z) > 16) return false;
    const k = hit.x + ',' + hit.y + ',' + hit.z; const hits = C().targets || (C().targets = []); if (hits.includes(k)) { UI.toast('Already hit.'); return true; }
    hits.push(k); G.world.setBlock(hit.x, hit.y, hit.z, B.FORTSTONE); UI.sfx('hit'); G.meshPass(99);
    if (hits.length >= 3) { const X = s.x, Z = s.z, y0 = s.y; for (let x = 72; x <= 73; x++) for (let z = -1; z <= 1; z++) for (let y = 1; y <= 3; y++) G.world.setBlock(X + x, y0 + y, Z + z, B.AIR); G.meshPass(99); UI.sfx('quest'); UI.toast('Three for three. Somewhere in the wall a counterweight drops, and the last gate grinds open.', 'good'); }
    else UI.toast(`Target ${hits.length} of 3.`);
    return true;
  }
  // the end of it: two Kin, one after the other
  function talk(n, say) {
    return say(['So. You put my crystal back together. Do you know how long it took me to break it?', 'Twelve holds. Twelve. Even the one in the Core. And every one of those fools I bound, free again, singing about you in their villages.', 'No more puzzles, no more warlords. Just me, and what I have left.'], () => {
      const t = C().throne; const lv = Math.max(90, Math.min(180, (G.trainerLevel || 1) + 18));
      const first = KIN.species(U.combine(0x0BAD, 2), ['Void'], 0, { primary: 'Flame', shape: 'quadruped', total: 680, rarity: 4 }); first.names = ['Gravemaw', 'Gravemaw', 'Gravemaw']; first.noFuse = true; first.colors = { body: '#2a0a10', belly: '#ff5a1f', accent: '#ff9f2a', dark: '#120408', eye: '#ffe08a' };
      const e1 = Wild.makeEntity(first, lv - 10, t.x - 5 + 0.5, t.y, t.z + 0.5, { senseR: 12, elite: true }); e1.citadelFirst = true; e1.kinmaster = false; Wild.list.push(e1);
      Battle.start(e1, false);
    });
  }
  function onBattle(e, result) {
    if (!e.citadelFirst || (result !== 'won' && result !== 'caught')) return;
    const t = C().throne; const lv = Math.max(95, Math.min(190, (G.trainerLevel || 1) + 24));
    setTimeout(() => Dialogue.show('The Kinmaster', ['Gravemaw... no matter. You want to end me? Earth is yours. Have it. It was always too small.', 'VEXMAW. Hold them here. I have a whole sky to take.'], () => {
      { const i = Campaign.removePerson('km_final'); km = null; }
      UI.toast('He runs for the back of the hall. Engines scream: a black ship tears out through the roof and is gone, up, toward the Moon. Vexmaw stays.', 'bad'); G.shake = 1.2;
      const sp = Campaign.kinmasterSp(); const e2 = Wild.makeEntity(sp, lv, t.x - 5 + 0.5, t.y, t.z + 0.5, { senseR: 12, elite: true }); e2.finalBoss = true; Wild.list.push(e2);
      Battle.start(e2, false);
    }), 900);
  }
  // the professor: built the Kinmaster's ships at knifepoint. Freed, he goes to Garrick's forge and finishes his own.
  const NEEDS = { iron: 14, gold: 4, diamond: 3, void: 4, ember: 6, glass: 8 };
  function talkProf(n, say) {
    const c = C(), P = G.player;
    if (n.id === 'prof_cell') {
      if (!G.stats.lightReturned) return say(['Behind you! Never mind me. Deal with him first, and then, please, the door.']);
      return say(['You did it. You actually did it. And he got away in the Nightwing, the ship I built him. Of course he did.', 'Aldous Finch. I made ships, once, for the observatory. He took me five years ago and I have been making them for him ever since.', 'He means to rule the Moon, and from the Moon everything above it. He will not stop there.', 'But I kept something back. A prototype, the Starlark, half finished in pieces he never knew were mine. Get me out of here and to a real forge, Garrick\'s at the Mining Camp, and I will finish it. Then you can go after him.'], () => {
        c.profFree = true; Campaign.removePerson('prof_cell'); UI.sfx('quest'); UI.toast('Professor Finch is free. He sets off for the Mining Camp.', 'good'); G.pin = null; });
    }
    if (P.has('ship')) return say(['The Starlark flies sweeter than anything I built for him. Bring her back in one piece.', 'He will be on the Moon. Find out what he is doing up there.']);
    const miss = Object.keys(NEEDS).filter(k => P.count(k) < NEEDS[k]);
    if (!c.profMet) { c.profMet = true; return say(['Garrick has let me have the back of his forge. Look: the Starlark. Not much yet, is she?', 'She needs a proper hull and a heart that will not melt. Here is what I need:', Object.keys(NEEDS).map(k => `${NEEDS[k]} ${ITEMS[k].name}`).join(', ') + '.', 'Bring it all at once and I will have her flying by nightfall, and a Space Suit cut to your size.']); }
    if (miss.length) return say(['Still short: ' + miss.map(k => `${ITEMS[k].name} ${P.count(k)}/${NEEDS[k]}`).join(', ') + '.']);
    return say(['That is all of it. Stand back.', 'There. The Starlark. And a suit, because the Moon has no air and I am not burying you.'], () => { for (const k in NEEDS) P.take(k, NEEDS[k]); P.add('ship', 1); if (!P.has('spacesuit')) P.add('spacesuit', 1); c.lark = true; UI.sfx('quest'); G.explain('The Starlark', 'Professor Finch\'s prototype, finished. Select the ship and tap it under open sky to board, hold ▲ to climb. Above the clouds, the world lets go of you and asks where to. The Kinmaster went to the Moon.'); });
  }
  function inside(p) { if (!open() || !C().stamped) return false; const s = site(); return p.x > s.x + 16 && p.x < s.x + L + 1 && Math.abs(p.z - s.z) < 13; }
  function gloom(px, pz) { if (!open() || G.stats.lightReturned) return 0; const s = site(); const d = Math.hypot(s.x + 40 - px, s.z - pz); return 1 - U.clamp((d - 100) / 160, 0, 1); }
  function mapMarks() { return open() && !G.stats.lightReturned ? [{ x: site().x + 40, z: site().z, t: '☠', name: 'The Black Citadel' }] : []; }
  return { init, site, begin, open, update, onTarget, talk, talkProf, onBattle, inside, gloom, mapMarks, NEEDS, C };
})();
