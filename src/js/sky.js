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
    return (SITES = out);
  }
  // ---------- drawing ----------
  function layout(k) {
    if (LAY.has(k.id)) return LAY.get(k.id); const buckets = new Map();
    const put = (x, y, z, id) => { if (y < 1 || y >= WH) return; const key = U.mod(Math.floor(x / CH), NCH) + ',' + U.mod(Math.floor(z / CH), NCH); let b = buckets.get(key); if (!b) buckets.set(key, b = []); b.push(U.mod(x, CH), y, U.mod(z, CH), id); };
    const X = k.x, Z = k.z, Y = k.y, R = k.R;
    // the cloud: a rounded slab, thicker in the middle, glowgrass on top
    for (let dx = -R - 2; dx <= R + 2; dx++) for (let dz = -R - 2; dz <= R + 2; dz++) {
      const d = Math.hypot(dx, dz) + U.hash3(X + dx, 404, Z + dz, 9) * 2.2; if (d > R) continue;
      const th = Math.max(2, Math.round((1 - d / R) * (k.kind === 'city' ? 9 : 6)) + 1);
      for (let y = Y - th; y < Y; y++) put(X + dx, y, Z + dz, B.CLOUD); put(X + dx, Y, Z + dz, k.kind === 'fort' ? B.BASALT : B.GLOWGRASS);
    }
    const box = (x0, z0, w, d, h, wall, roof, door) => { for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < d; dz++) { const edge = dx === 0 || dz === 0 || dx === w - 1 || dz === d - 1; for (let y = Y + 1; y <= Y + h; y++) put(x0 + dx, y, z0 + dz, edge ? wall : B.AIR); put(x0 + dx, Y + h + 1, z0 + dz, roof); } if (door) { put(door[0], Y + 1, door[1], B.AIR); put(door[0], Y + 2, door[1], B.AIR); } };
    if (k.kind === 'city') {
      for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) if (Math.hypot(dx, dz) <= 5.5) put(X + dx, Y, Z + dz, B.STONE); // the plaza
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { put(X + dx, Y + 1, Z + dz, B.GLASS); } put(X, Y + 2, Z, B.SELGLASS); put(X, Y + 3, Z, B.TORCH); // the wind-fountain
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, r = 15; const hx = Math.round(X + Math.cos(a) * r) - 2, hz = Math.round(Z + Math.sin(a) * r) - 2; const fx = Math.cos(a) < 0 ? hx + 4 : hx, fz = hz + 2; box(hx, hz, 5, 5, 3, i % 2 ? B.PLANKS : B.CLOUD, i % 3 ? B.SELGLASS : B.PLANKS, [Math.abs(Math.cos(a)) > 0.5 ? (Math.cos(a) < 0 ? hx + 4 : hx) : hx + 2, Math.abs(Math.cos(a)) > 0.5 ? fz : (Math.sin(a) < 0 ? hz + 4 : hz)]); put(hx + 2, Y + 2, hz + 2, B.TORCH); }
      for (let y = Y + 1; y <= Y + 10; y++) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(X + dx, y, Z - 10 + dz, (dx || dz) ? B.CLOUD : B.AIR); // the spire
      put(X, Y + 1, Z - 9, B.AIR); put(X, Y + 2, Z - 9, B.AIR); for (let y = Y + 1; y <= Y + 10; y++) put(X, y, Z - 10, B.LADDER); put(X, Y + 11, Z - 10, B.SELGLASS); put(X, Y + 12, Z - 10, B.TORCH);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; put(Math.round(X + Math.cos(a) * (R - 2)), Y + 1, Math.round(Z + Math.sin(a) * (R - 2)), i % 6 ? B.LOG : B.TORCH); } // the rail round the edge
    } else if (k.kind === 'fort') {
      const F = B.FORTSTONE;
      for (let d = -11; d <= 11; d++) for (let y = Y + 1; y <= Y + 6; y++) { put(X + d, y, Z - 11, F); put(X + d, y, Z + 11, F); put(X - 11, y, Z + d, F); put(X + 11, y, Z + d, F); }
      for (const [a, b] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let y = Y + 1; y <= Y + 8; y++) put(X + a + i, y, Z + b + j, F); put(X + a, Y + 9, Z + b, B.VOID); }
      for (let d = -1; d <= 1; d++) for (let y = Y + 1; y <= Y + 3; y++) put(X + d, y, Z - 11, B.AIR);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) put(X + i, Y + 1, Z + 4 + j, F); put(X, Y + 2, Z + 4, B.VOID);
      for (let z = Z - 10; z <= Z + 2; z++) put(X, Y, z, B.CORAL_R);
      for (const [a, b] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) put(X + a, Y + 4, Z + b, B.TORCH);
    } else {
      box(X - 2, Z - 2, 4, 4, 3, B.PLANKS, B.CLOUD, [X - 2, Z]); put(X - 1, Y + 2, Z - 1, B.TORCH);
      put(X + 3, Y + 1, Z + 3, B.LOG); put(X + 3, Y + 2, Z + 3, B.LOG); put(X + 3, Y + 3, Z + 3, B.TORCH);
    }
    const L = { buckets }; LAY.set(k.id, L); return L;
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
  function onBattle(result) {
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
  // ---------- the loop ----------
  function update(dt, p) {
    if (!onEarth()) return; tick += dt; if (tick < 0.5) return; tick = 0;
    for (const k of sites()) {
      const d = dist(k, p); if (d > 170) continue;
      patchLoaded(k);
      if (d < 120) people(k);
      if (!st()['seen_' + k.id] && d < 60 && p.y > k.y - 12) { st()['seen_' + k.id] = true; if (k.kind === 'city') UI.toast('Highmere, the city in the clouds.', 'good'); else if (k.kind === 'isle') UI.toast(`A little cloud with a hut on it. Someone lives up here.`); }
      if (k.kind === 'fort') fortTick(k, p, d);
    }
  }
  function mapMarks() { if (!onEarth()) return []; return sites().filter(k => (k.kind === 'city' && G.questState && Quests.isDone && (Quests.isDone('glider'))) || st()['seen_' + k.id] || (k.kind === 'fort' && st().fortSeen)).map(k => ({ x: k.x, z: k.z, t: k.kind === 'city' ? '☁' : k.kind === 'fort' ? (st().fortTaken ? '♜' : '⛈') : '☁', name: k.name + (k.kind === 'fort' && !st().fortTaken ? ' (the Storm Warden)' : '') })); }
  return { init, sites, overlay, update, talk, onBattle, inFort, gloom, mapMarks, layout };
})();
