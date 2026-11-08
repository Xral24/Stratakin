'use strict';
// People of the road. Wanderers with odd jobs every few minutes of walking, on every world; amulets as the reward nobody sells;
// the story quests (a scientist stuck in his own lab, and his incubator); the Indian camps you can only rob by night or on a dinosaur;
// and the mer-schools out at sea that only a swimmer's mount can catch.
const Npcs = (() => {
  let G = null, world = null;
  const QN = 110;                      // wanderer cells across the map (about 150 blocks)
  let QCELL = WORLD_W / QN;
  const wd = (d) => U.mod(d + WORLD_W / 2, WORLD_W) - WORLD_W / 2;
  const dist2d = (ax, az, bx, bz) => Math.hypot(wd(ax - bx), wd(az - bz));
  const wanderers = new Map();         // id -> record (null = no wanderer in that cell)
  const camps = new Map();             // id -> camp record
  let activeW = [], activeCamp = null, school = null, lab = null;

  // ---------- names and flavour per world ----------
  const WORLD_PEOPLE = {
    earth: { names: ['Tobin', 'Mags', 'Ferro', 'Lisbet', 'Old Crane', 'Yusra', 'Hob', 'Delia', 'Pike', 'Anouk', 'Bastien', 'Wren', 'Olek', 'Saffi', 'Ruta', 'Gideon'], greet: ['Ho, traveller.', 'You look like someone who gets things done.', 'Sit a moment. I have a job, if you want it.', 'The road is long and my knees are old. Help me?'] },
    moon: { names: ['Xaa', 'Oomik', 'Vel-7', 'Thrix', 'Qunu', 'Izzil', 'Mox', 'Yrrsa', 'Dakkan', 'Ubbo', 'Zenn', 'Kyra-Oon'], greet: ['Your kind. Good. Hands.', 'The light of you is dim, but you will do.', 'I have waited a long cycle for someone with feet.', 'Earth-walker. A task, for Shards?'] },
    halo: { names: ['Harun', 'Mesa Jo', 'Tasnim', 'Ferid', 'Old Dune', 'Nilou', 'Baz', 'Sahar', 'Kemal', 'Zohra', 'Rafiq', 'Lale'], greet: ['Shade and water on you, stranger.', 'The caravan left me behind. Help a soul.', 'You walk under the ring like it owes you something. Good.', 'A job, if the dust has not got in your ears.'] },
  };
  // what each world can ask you to fetch, in rising difficulty
  const FETCH = {
    earth: [['berry', 8, 1], ['wood', 12, 1], ['frond', 10, 1], ['stone', 20, 1], ['glowworm', 3, 2], ['copper', 4, 2], ['iron', 5, 2], ['ember', 4, 2], ['snow', 6, 2], ['cloud', 3, 3], ['void', 2, 3], ['coral', 5, 3], ['pearl', 1, 4], ['gold', 2, 4]],
    moon: [['stone', 16, 1], ['sand', 10, 1], ['selenite', 3, 2], ['copper', 4, 2], ['iron', 5, 2], ['starsalt', 4, 2], ['tycho', 2, 3], ['void', 2, 3]],
    halo: [['stone', 16, 1], ['sand', 12, 1], ['sulfur', 4, 2], ['amber', 3, 2], ['iron', 5, 2], ['copper', 4, 2], ['void', 2, 3], ['ringshard', 1, 4]],
  };
  const DIG = { earth: ['copper', 'iron', 'ember', 'void'], moon: ['selenite', 'tycho', 'iron'], halo: ['amber', 'sulfur', 'iron'] };
  // amulets: gear you never lose and nobody sells, each with one trick you can switch on
  const AMULETS = {
    amulet_haste: { name: 'Amulet of Haste', col: '#ffe34a', amulet: 'haste', desc: 'Activate: you walk and swim 60% faster for 45 seconds.', dur: 45 },
    amulet_skin: { name: 'Amulet of Iron Skin', col: '#8f98a6', amulet: 'skin', desc: 'Activate: everything hurts you half as much for a minute. Worms and falling stones included.', dur: 60 },
    amulet_focus: { name: 'Amulet of Focus', col: '#ff8a3a', amulet: 'focus', desc: 'Activate: your Kin hit 25% harder for the next three fights.', charges: 3 },
    amulet_hunter: { name: "Hunter's Amulet", col: '#7fe0c0', amulet: 'hunter', desc: 'Activate: your next three snares have half again the catch chance.', charges: 3 },
    amulet_mender: { name: "Mender's Amulet", col: '#ff5f7a', amulet: 'mender', desc: 'Activate: every Kin with you wakes and heals, wherever you are.' },
    amulet_shadow: { name: 'Amulet of Shadow', col: '#5a2a9a', amulet: 'shadow', desc: 'Activate: wild Kin and camp guards do not notice you for a minute.', dur: 60 },
  };
  const AMULET_KEYS = Object.keys(AMULETS);
  for (const k of AMULET_KEYS) ITEMS[k] = Object.assign({ gear: true, keep: true }, AMULETS[k]);
  ITEMS.parcel = { name: 'Sealed Parcel', col: '#c9a84c', keep: true, desc: 'Somebody\'s parcel for somebody\'s headman. Deliver it and come back for your pay.' };

  function init(game) { G = game; world = game.world; Builds.init(game); wanderers.clear(); camps.clear(); activeW = []; activeCamp = null; school = null; lab = null; QCELL = WORLD_W / QN; if (!G.npcState) G.npcState = {}; if (!G.amulet) G.amulet = { cd: 0, kind: null, until: 0, charges: 0 }; }
  const people = () => WORLD_PEOPLE[world.preset.id] || WORLD_PEOPLE.earth;
  const sea = () => world.preset.water ? SEA : world.preset.brine ? world.preset.brineLevel : -99;
  function npcState(id) { if (!G.npcState[id]) G.npcState[id] = { done: 0, quest: null, stamped: false }; return G.npcState[id]; }

  // ---------- wanderers: one every cell or so, standing by a little fire ----------
  function wandererFor(cx, cz) {
    cx = U.mod(cx, QN); cz = U.mod(cz, QN);
    const id = 'w' + (world.preset.villages ? world.preset.villages.prefix : '') + cx + ',' + cz;
    if (wanderers.has(id)) return wanderers.get(id);
    let w = null;
    const h0 = U.hash3(cx, 91, cz, 0x5EED);
    if (h0 < 0.85) {
      const h1 = U.hash3(cx, 92, cz, 0x5EED), h2 = U.hash3(cx, 93, cz, 0x5EED);
      const x = Math.round(cx * QCELL + 20 + h1 * (QCELL - 40)), z = Math.round(cz * QCELL + 20 + h2 * (QCELL - 40));
      const info = world.colInfo(x, z);
      if (info.h > sea() + 2 && info.h < 70 && !info.lostRim && dist2d(x, z, world.spawn.x, world.spawn.z) > 70) {
        const P = people(); const r = U.combine(0x9A77, cx, cz);
        w = { id, x, z, y: info.h + 1, name: P.names[r % P.names.length], seedN: r, npc: null, lost: !!info.lost };
      }
    }
    wanderers.set(id, w);
    return w;
  }
  function stampCamp(w) {
    const set = (x, y, z, id) => world.setBlock(x, y, z, id); const y0 = w.y;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const g = world.groundY(w.x + dx, w.z + dz, y0 + 4); for (let y = g + 1; y <= y0 + 3; y++) { const b = world.getBlock(w.x + dx, y, w.z + dz); if (b !== B.AIR && !isLeaf(b)) set(w.x + dx, y, w.z + dz, B.AIR); } if (g < y0 - 1) for (let y = g + 1; y <= y0 - 1; y++) set(w.x + dx, y, w.z + dz, B.DIRT); }
    const fire = world.preset.id === 'moon' ? B.MOONGLOW : world.preset.id === 'halo' ? B.RINGSHARD : B.TORCH;
    set(w.x, y0 - 1, w.z, B.STONE); set(w.x, y0, w.z, fire);
    for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) set(w.x + dx, y0 - 1, w.z + dz, B.GRAVEL);
    set(w.x + 2, y0, w.z, B.LOG); set(w.x - 2, y0, w.z + 1, B.LOG);
  }
  function makeNpc(w) {
    const sp = { shape: 'biped', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: world.preset.id === 'moon' }, colors: world.preset.id === 'moon' ? { body: '#1a1030', belly: ['#39ff14', '#ff2bd6', '#00f5ff', '#ffe600'][w.seedN % 4], accent: '#00f5ff', dark: '#05050f', eye: '#ffffff' } : world.preset.id === 'halo' ? { body: ['#e8d8b0', '#c0a070', '#8a6a4a'][w.seedN % 3], belly: '#c9955a', accent: '#c9a45a', dark: '#3a2a20', eye: '#222222' } : { body: ['#6b5a3e', '#4c7bc9', '#c94c4c', '#4cc97a', '#9b4cc9'][w.seedN % 5], belly: ['#e8c39e', '#c68642', '#8d5524', '#f1d3b3'][(w.seedN >>> 3) % 4], accent: '#c94c4c', dark: '#3a2a20', eye: '#222222' }, size: 1, gen: 0, names: ['wanderer'], neon: world.preset.id === 'moon' };
    const m = KIN.model(sp, 2); KIN.decorate(m, 'wanderer'); if (world.preset.id === 'moon') KIN.decorate(m, 'alien'); if (world.preset.id === 'halo') KIN.decorate(m, 'veil');
    const gy = standY(w.x + 1.5, w.y, w.z - 0.5) ?? w.y;
    return { id: w.id, role: 'wanderer', name: w.name, x: w.x + 1.5, y: gy, z: w.z - 0.5, yaw: 0, model: m, mesh: R.entityMesh('wanderer:' + w.id, (mb) => KIN.buildMesh(mb, m)), scale: 1, hover: 0, skyMul: 1, wanderer: w, bob: 0 };
  }
  function standY(x, y, z) { const bx = Math.floor(x), bz = Math.floor(z); for (const dy of [0, 1, -1, 2, -2]) { const yy = Math.floor(y) + dy; const b0 = world.getBlock(bx, yy, bz), b1 = world.getBlock(bx, yy + 1, bz), below = world.getBlock(bx, yy - 1, bz); if ((b0 === B.AIR || BLOCKS[b0].partial) && b1 === B.AIR && isSolid(below) && !isLeaf(below)) return yy; } return null; }
  function frame(o, px, pz) { const sx = Math.round((px - o.x) / WORLD_W) * WORLD_W, sz = Math.round((pz - o.z) / WORLD_W) * WORLD_W; if (!sx && !sz) return; o.x += sx; o.z += sz; if (o.npc) { o.npc.x += sx; o.npc.z += sz; } }

  // ---------- quests ----------
  // a quest is picked by the wanderer and how many you have done for them; it is checked against the stats you had when you took it
  function makeQuest(w, round) {
    const r = U.rng(U.combine(w.seedN, round, 0x51));
    const wid = world.preset.id; const diff = Math.min(4, 1 + Math.floor(round / 2) + (w.lost ? 1 : 0));
    const kinds = ['fetch', 'hunt', 'catch', 'dig', 'deliver', 'lair', 'explore', 'explore', 'lair', 'fetch', 'build', 'build', 'build', 'build', 'build', 'build', 'build', 'build', 'night', 'night']; // building is the backbone
    if (G.player.has('bow')) kinds.push('archery', 'archery', 'archery', 'archery', 'archery', 'archery'); // a bow opens a whole new line of work
    const kind = kinds[r.int(kinds.length)];
    const base = { kind, round, diff, taken: false, done: false };
    if (kind === 'fetch') { const pool = (FETCH[wid] || FETCH.earth).filter(f => f[2] <= diff); const f = pool[r.int(pool.length)]; return Object.assign(base, { item: f[0], n: f[1], line: `I need ${f[1]} ${ITEMS[f[0]].name}. Do not ask what for.` }); }
    if (kind === 'hunt') { const e = r.pick(ELEMENTS); const n = 2 + diff; return Object.assign(base, { elem: e, n, line: `${e} Kin have been at my things. Beat ${n} of them, anywhere, and we are square.` }); }
    if (kind === 'catch') { const e = r.pick(ELEMENTS); return Object.assign(base, { elem: e, n: 1, line: `Catch me a ${e} Kin. Any one will do. Keep it; I only want to see it done.` }); }
    if (kind === 'dig') { const pool = DIG[wid] || DIG.earth; const it = pool[Math.min(pool.length - 1, r.int(diff + 1))]; const n = 2 + diff * 2; return Object.assign(base, { item: it, n, line: `Dig me ${n} ${ITEMS[it].name} out of the ground with your own hands. Bought does not count.` }); }
    if (kind === 'build') return Builds.make(w, r, diff, base, wid);
    if (kind === 'night') return Builds.makeNight(w, r, base);
    if (kind === 'archery') return Builds.makeArchery(w, r, diff, base);
    if (kind === 'deliver') return Object.assign(base, { line: 'Take this parcel to the nearest headman and tell him it is from me. Then come back.' });
    if (kind === 'explore') { const tales = [['My brother buried his savings out there before the raiders came. He never came back for them. You go; bring me half.', 'the buried savings'], ['A cart went off the road out that way. The driver walked. The cargo did not. See what is left.', 'the lost cart'], ['There is a cairn out there I built for my mother. Someone has been at it. Go and see, and keep what you find.', 'the cairn'], ['I saw something fall out of the sky over there last night. Something shiny. Go and look before somebody else does.', 'the fallen thing'], ['An old shrine. People leave gifts. Nobody has been for years. Go, and tell me it still stands.', 'the shrine']]; const tl = tales[r.int(tales.length)]; return Object.assign(base, { line: tl[0], spotName: tl[1] }); }
    return Object.assign(base, { elem: r.pick(ELEMENTS), line: 'Something has made a den out that way and it took what was mine. Beat it or cage it; I do not care which.' });
  }
  function questFor(w) { const st = npcState(w.id); if (!st.quest) st.quest = makeQuest(w, st.done); return st.quest; }
  function elemCount(e) { return (G.stats.beatElem && G.stats.beatElem[e]) || 0; }
  function caughtCount(e) { return (G.stats.caughtElem && G.stats.caughtElem[e]) || 0; }
  function dugCount(it) { return (G.stats.dug && G.stats.dug[it]) || 0; }
  function progress(w, q) {
    if (q.kind === 'fetch') return Math.min(1, G.player.count(q.item) / q.n);
    if (q.kind === 'hunt') return Math.min(1, (elemCount(q.elem) - (q.base || 0)) / q.n);
    if (q.kind === 'catch') return Math.min(1, caughtCount(q.elem) - (q.base || 0));
    if (q.kind === 'dig') return Math.min(1, (dugCount(q.item) - (q.base || 0)) / q.n);
    if (q.kind === 'deliver') return q.delivered ? 1 : 0;
    if (q.kind === 'lair') return q.beaten ? 1 : 0;
    if (q.kind === 'explore') return q.reached ? 1 : 0;
    if (q.kind === 'build' || q.kind === 'night' || q.kind === 'archery') return Builds.progressOf(q);
    return 0;
  }
  const lairEnts = new Map(); // quest -> live entity (never saved)
  function takenQuests() { const out = []; for (const id in (G.npcState || {})) { const q = G.npcState[id].quest; if (q && q.taken && (q.world || 'earth') === world.preset.id && !String(id).startsWith('mer')) out.push([{ id, name: q.wname, seedN: q.seedN, x: q.wx, z: q.wz }, q]); } return out; }
  function take(w, q) {
    q.taken = true; q.wname = w.name; q.seedN = w.seedN; q.world = world.preset.id; q.wx = w.x; q.wz = w.z;
    if (q.kind === 'build') Builds.take(w, q);
    if (q.kind === 'night') Builds.takeNight(w, q);
    if (q.kind === 'archery') Builds.takeArchery(w, q);
    if (q.kind === 'hunt') q.base = elemCount(q.elem);
    if (q.kind === 'catch') q.base = caughtCount(q.elem);
    if (q.kind === 'dig') q.base = dugCount(q.item);
    if (q.kind === 'deliver') { G.player.add('parcel', 1); const v = nearestVillage(w.x, w.z); q.target = v ? v.id : null; q.targetName = v ? v.name : 'any headman'; }
    if (q.kind === 'explore') { const r = U.rng(U.combine(w.seedN, q.round, 0x1E)); const a = r() * Math.PI * 2, d = 60 + r() * 60; q.spot = { x: Math.round(w.x + Math.cos(a) * d), z: Math.round(w.z + Math.sin(a) * d) }; }
    if (q.kind === 'lair') { const r = U.rng(U.combine(w.seedN, q.round, 0x1A)); const a = r() * Math.PI * 2, d = 55 + r() * 50; q.lair = { x: Math.round(w.x + Math.cos(a) * d), z: Math.round(w.z + Math.sin(a) * d), a }; q.lairName = ['Grey Maw', 'the Thing in the Hollow', 'Old Bitter', 'the Den-Keeper', 'Scarback', 'the Nest Mother'][r.int(6)]; }
  }
  function nearestVillage(x, z) { let best = null, bd = Infinity; for (const m of Village.markers(x, z, 2)) if (m.kind === 'village') { const d = dist2d(m.x, m.z, x, z); if (d < bd) { bd = d; best = { id: markerId(m), name: m.name }; } } return best; }
  function markerId(m) { return m.id || null; }
  function rewardFor(w, q) {
    const r = U.rng(U.combine(w.seedN, q.round, 0x77));
    const shards = 20 + q.diff * 25 + (q.kind === 'lair' ? 60 : q.kind === 'deliver' ? 20 : 0);
    const amuletChance = q.kind === 'lair' ? 0.6 : q.round >= 2 ? 0.3 : 0.12;
    const owned = AMULET_KEYS.filter(k => G.player.has(k));
    const pool = AMULET_KEYS.filter(k => !G.player.has(k));
    const amulet = (r() < amuletChance && pool.length) ? pool[r.int(pool.length)] : null;
    const items = {}; if (!amulet) { const extra = ['tonic_revive', 'snare2', 'tonic_vigor', 'tonic_might', 'tonic_swift', 'bread'][r.int(6)]; items[extra] = 1 + (q.diff > 2 ? 1 : 0); }
    return Builds.reward(q, { shards, amulet, items, xp: 40 + q.diff * 30 });
  }
  function complete(w, q) {
    const st = npcState(w.id); const rw = rewardFor(w, q);
    if (q.kind === 'fetch') G.player.take(q.item, q.n);
    if (q.kind === 'deliver') G.player.take('parcel', 1);
    G.shards += rw.shards; G.addTrainerXp(rw.xp);
    for (const k in rw.items) G.player.add(k, rw.items[k]);
    if (rw.bow) { G.player.add('bow', 1); G.player.add('arrow', 24); UI.sfx('quest'); UI.openPanel('reveal', { kind: 'item', item: 'bow', n: 1 }); setTimeout(() => UI.toast('A bow, and a quiver of 24 arrows. Hold the bow and tap a Kin, even a long way off. Craft more arrows from wood, stone and fronds.', 'good'), 1200); }
    else if (rw.amulet) { G.player.add(rw.amulet, 1); UI.sfx('quest'); UI.openPanel('reveal', { kind: 'item', item: rw.amulet, n: 1 }); }
    else UI.sfx('quest');
    st.done++; st.quest = null; q.done = true;
    if (world.preset.id === 'earth' && !G.stats.lostMap && !(G.stats.camp || {}).zooHeard && (G.stats.questsDone || 0) >= 1) { setTimeout(() => { Campaign.C().zooHeard = true; Dialogue.show(w.name, ['One more thing. Did you hear? Somebody caught a dinosaur. A real one, a Kin with teeth like knives.', 'Barnaby Quill keeps it in his menagerie out past the hills. It is on your map now, if you want to see for yourself.']); }, 900); }
    UI.toast(`${w.name}: +${rw.shards} Shards${rw.amulet ? ' and the ' + ITEMS[rw.amulet].name : Object.keys(rw.items).map(k => ', ' + ITEMS[k].name).join('')}.`, 'good');
    { const known = ((G.stats.recipes || {})[world.preset.id] || []).length; if (Math.random() < (q.kind === 'build' || q.kind === 'night' ? 0.6 : 0.4) || known < 3) setTimeout(() => G.learnRecipe(world.preset.id, w.name), 1800); }
    if (q.kind === 'night' || (q.kind === 'build' && (q.what === 'castle' || q.what === 'town')) || Math.random() < 0.12) { const pool = KIN.dex(world.preset.id).filter(sp => sp.rarity === 2 && sp.home && sp.home.layer === 'Surface'); const sp = pool[U.combine(w.seedN, q.round, 0xE6) % pool.length]; if (sp) setTimeout(() => { if (G.addEgg(sp, w.name, 500)) UI.toast(`${w.name} also hands you an egg. "Found it in the long grass. Keep it warm: walk with it."`, 'good'); }, 2600); }
    G.stats.questsDone = (G.stats.questsDone || 0) + 1;
    if (!G.stats.jobsBy) G.stats.jobsBy = {}; G.stats.jobsBy[world.preset.id] = (G.stats.jobsBy[world.preset.id] || 0) + 1;
  }
  function talkWanderer(n) {
    const w = n.wanderer; const q = questFor(w); const P = people(); const st = npcState(w.id);
    G.talkNpc = n;
    const greet = P.greet[U.combine(w.seedN, st.done) % P.greet.length];
    if (!q.taken) {
      const lines = [greet, q.line];
      if (q.kind === 'lair' || q.kind === 'explore' || q.kind === 'build' || q.kind === 'night' || (q.kind === 'archery' && q.v !== 'herd')) lines.push('Follow the mark on your compass: ⌖. It is not far, as the crow flies.');
      if (q.kind === 'deliver') lines.push('Any headman will do if the nearest is not to your taste.');
      Dialogue.show(w.name, lines, () => { take(w, q); UI.toast(`Job from ${w.name}: ${questText(q)}`, 'good'); });
      return;
    }
    if (progress(w, q) >= 1) { Dialogue.show(w.name, ['That is it. That is exactly it.', 'Here, what I promised. Come back; there is always more.'], () => complete(w, q)); return; }
    const need = (q.kind === 'build' || q.kind === 'night' || q.kind === 'archery') ? Builds.needText(q) : q.kind === 'fetch' ? `${G.player.count(q.item)} of ${q.n} ${ITEMS[q.item].name} so far.` : q.kind === 'hunt' ? `${Math.min(q.n, elemCount(q.elem) - (q.base || 0))} of ${q.n} ${q.elem} Kin beaten.` : q.kind === 'catch' ? `No ${q.elem} Kin caught yet.` : q.kind === 'dig' ? `${Math.min(q.n, dugCount(q.item) - (q.base || 0))} of ${q.n} ${ITEMS[q.item].name} dug.` : q.kind === 'deliver' ? `The parcel is for ${q.targetName}. ${G.player.has('parcel') ? 'You still have it.' : 'Lost it? Here is another.'}` : q.kind === 'explore' ? `You have not found ${q.spotName} yet. Follow ⌖.` : `${q.lairName} is still out there. Follow ⌖.`;
    if (q.kind === 'deliver' && !G.player.has('parcel')) G.player.add('parcel', 1);
    Dialogue.show(w.name, ['Not done yet.', need]);
  }
  function questText(q) { if (q.kind === 'build' || q.kind === 'night' || q.kind === 'archery') return Builds.text(q); if (q.kind === 'explore') return `find ${q.spotName}`; return q.kind === 'fetch' ? `bring ${q.n} ${ITEMS[q.item].name}` : q.kind === 'hunt' ? `beat ${q.n} ${q.elem} Kin` : q.kind === 'catch' ? `catch a ${q.elem} Kin` : q.kind === 'dig' ? `dig ${q.n} ${ITEMS[q.item].name}` : q.kind === 'deliver' ? `deliver the parcel to ${q.targetName}` : `beat ${q.lairName} at its den`; }
  // the parcel reaches a headman
  function onElderTalk(v) {
    if (!G.player.has('parcel')) return false;
    for (const [id, st] of Object.entries(G.npcState)) { const q = st.quest; if (q && q.taken && q.kind === 'deliver' && !q.delivered && (q.target == null || q.target === v.id || true)) { q.delivered = true; UI.toast(`${v.elder ? v.elder.name : 'The headman'} takes the parcel. Go back for your pay.`, 'good'); G.player.take('parcel', 1); return true; } }
    return false;
  }
  // dens: a beast at a marked spot, stamped as a ring of stones with bones when you get close
  function updateLairs(p) {
    for (const [w, q] of takenQuests()) {
      if (q.kind !== 'lair' || q.beaten) continue;
      const lx = p.x + wd(q.lair.x - p.x), lz = p.z + wd(q.lair.z - p.z); const d = Math.hypot(p.x - lx, p.z - lz);
      if (d > 60) continue;
      if (!q.lairStamped) { q.lairStamped = true; world.ensureAround(Math.floor(lx / CH), Math.floor(lz / CH), 1, 99); const gy = world.groundY(Math.floor(lx), Math.floor(lz)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const x = Math.floor(lx + Math.cos(a) * 3.5), z = Math.floor(lz + Math.sin(a) * 3.5); const g = world.groundY(x, z, gy + 4); world.setBlock(x, g + 1, z, i % 2 ? B.STONE : B.BASALT); } world.setBlock(Math.floor(lx), gy + 1, Math.floor(lz), B.SNOW); G.meshPass(99); }
      const le = lairEnts.get(q);
      if (!le || !Wild.list.includes(le)) {
        if (le) { lairEnts.delete(q); continue; } // beaten or gone: onBattleEnd marks it
        const rx = Math.floor(U.mod(lx, WORLD_W) / 1024), rz = Math.floor(U.mod(lz, WORLD_W) / 1024);
        const list = KIN.roster(world.preset.id, rx, rz, 'Surface', BIOME_NAME[world.colInfo(Math.floor(lx), Math.floor(lz)).biome] || 'Plains', Math.min(9, 2 + q.diff)).filter(sp => KIN.dominant(sp.elem, 1)[0] === q.elem || (sp.rarity || 0) >= 2);
        const sp = Object.assign({}, list[U.combine(w.seedN, q.round) % list.length] || KIN.roster(world.preset.id, 0, 0, 'Surface', 'Plains', 1)[0]);
        sp.names = [q.lairName, q.lairName, q.lairName]; sp.size = (sp.size || 1) * 1.3;
        const lvl = Math.max(4, Wild.zoneLevel(lx, gy0(lx, lz), lz, { layer: 'Surface' }, G.trainerLevel) + 3 + q.diff);
        const e = Wild.makeEntity(sp, lvl, lx + 0.5, gy0(lx, lz), lz + 0.5, { senseR: 6, elite: true }); e.lairQuest = { wid: w.id }; e.speed = 1.2; e.patrol = { ax: lx - 2.5, az: lz + 0.5, bx: lx + 3.5, bz: lz + 0.5, period: 7, phase: 0 };
        Wild.list.push(e); lairEnts.set(q, e);
      }
    }
  }
  function updateSpots(p) {
    for (const [w, q] of takenQuests()) {
      if (q.kind !== 'explore' || q.reached) continue;
      const sx = p.x + wd(q.spot.x - p.x), sz = p.z + wd(q.spot.z - p.z); const d = Math.hypot(p.x - sx, p.z - sz);
      if (d < 50 && !q.stampedSpot) { q.stampedSpot = true; const bx = Math.floor(sx), bz = Math.floor(sz); world.ensureAround(Math.floor(bx / CH), Math.floor(bz / CH), 1, 99); const gy = world.groundY(bx, bz); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const g = world.groundY(bx + dx, bz + dz, gy + 4); world.setBlock(bx + dx, g + 1, bz + dz, B.STONE); } world.setBlock(bx, gy + 1, bz, B.CHEST); world.setBlock(bx + 1, world.groundY(bx + 1, bz, gy + 4) + 1, bz, B.TORCH); const ch = G.chestAt(bx, gy + 1, bz, true); const r = U.rng(U.combine(w.seedN, q.round, 0x5C)); const pool = (FETCH[world.preset.id] || FETCH.earth).filter(f => f[2] >= 2); const f = pool[r.int(pool.length)]; ch.items = { [f[0]]: f[1] + r.int(3), tonic_heal: 1 + r.int(2) }; if (r() < 0.4) ch.items.tonic_revive = 1; ch.treasure = true; q.chest = { x: bx, y: gy + 1, z: bz }; G.meshPass(99); }
      if (d < 3.5) { q.reached = true; UI.sfx('quest'); UI.toast(`You found ${q.spotName}. Open the chest, then go back to ${w.name}.`, 'good'); }
    }
  }
  const gy0 = (x, z) => world.groundY(Math.floor(x), Math.floor(z)) + 1;
  function onLairBeaten(info) { const st = G.npcState[info.wid]; if (st && st.quest && st.quest.kind === 'lair') { st.quest.beaten = true; UI.toast('The den is quiet. Go back for your pay.', 'good'); } }

  // ---------- amulets ----------
  function activate(key) {
    const a = AMULETS[key]; if (!a || !G.player.has(key)) return false;
    const now = performance.now(); const A = G.amulet;
    if (A.cd > now) { UI.toast(`The amulets are spent. ${Math.ceil((A.cd - now) / 1000)}s before any of them answers again.`); return false; }
    if (a.amulet === 'mender') { if (!G.kin.some(k => k.hp < KIN.stats(k).hp)) { UI.toast('Your Kin are already whole.'); return false; } for (const k of G.kin) k.hp = KIN.stats(k).hp; UI.toast('The amulet warms. Every Kin wakes, whole.', 'good'); }
    else if (a.amulet === 'shadow') { G.repelUntil = now + a.dur * 1000; UI.toast('You go unnoticed for a minute.', 'good'); }
    else if (a.charges) { A.kind = a.amulet; A.charges = a.charges; A.until = 0; UI.toast(`${a.name}: ${a.charges} ${a.amulet === 'focus' ? 'fights' : 'snares'}.`, 'good'); }
    else { A.kind = a.amulet; A.until = now + a.dur * 1000; A.charges = 0; UI.toast(`${a.name} for ${a.dur} seconds.`, 'good'); }
    A.cd = now + 240000; UI.sfx('util');
    return true;
  }
  function active(kind) { const A = G.amulet; if (!A || A.kind !== kind) return false; if (A.charges > 0) return true; return A.until > performance.now(); }
  function useCharge(kind) { const A = G.amulet; if (A && A.kind === kind && A.charges > 0) { A.charges--; if (!A.charges) A.kind = null; return true; } return false; }
  function hudText() { const A = G.amulet; if (!A || !A.kind) return ''; const now = performance.now(); if (A.charges > 0) return ` · ${A.kind} ×${A.charges}`; if (A.until > now) return ` · ${A.kind} ${Math.ceil((A.until - now) / 1000)}s`; return ''; }

  // ---------- per frame ----------
  function update(dt, p, inBattle) {
    if (!world.preset.villages) return;
    const cx0 = Math.floor(U.mod(p.x, WORLD_W) / QCELL), cz0 = Math.floor(U.mod(p.z, WORLD_W) / QCELL);
    activeW = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const w = wandererFor(cx0 + dx, cz0 + dz); if (!w) continue;
      frame(w, p.x, p.z);
      const d = Math.hypot(p.x - w.x, p.z - w.z); if (d > 80) { continue; }
      activeW.push(w);
      const st = npcState(w.id);
      if (!st.stamped) { world.ensureAround(Math.floor(w.x / CH), Math.floor(w.z / CH), 1, 99); stampCamp(w); st.stamped = true; G.meshPass(99); }
      if (!w.npc) w.npc = makeNpc(w);
      const n = w.npc; n.bob += dt; const ddx = p.x - n.x, ddz = p.z - n.z; if (Math.hypot(ddx, ddz) < 7) n.yaw = Math.atan2(ddx, ddz);
    }
    updateLairs(p); updateSpots(p); Builds.update(dt, p, inBattle);
    Camps.update(dt, p, inBattle);
    Mer.update(dt, p, inBattle);
    Lab.update(dt, p, inBattle);
  }
  function entities() {
    const out = [];
    for (const w of activeW) if (w.npc) out.push({ x: w.npc.x, y: w.npc.y, z: w.npc.z, yaw: w.npc.yaw, model: w.npc.model, mesh: w.npc.mesh, scale: 1, hover: 0, skyMul: 1 });
    out.push(...Camps.entities(), ...Mer.entities(), ...Lab.entities(), ...Campaign.entities());
    return out;
  }
  // the person under the crosshair, if any (wanderers, camp folk, mer, the scientist)
  function pick(p) {
    const eye = p.eye(); const f = U.forwardVec(p.yaw, p.pitch);
    let best = null, bt = 4.5;
    const list = activeW.filter(w => w.npc).map(w => w.npc).concat(Camps.talkable(), Mer.talkable(), Lab.talkable(), Campaign.talkable());
    for (const n of list) {
      const h = n.model.height * n.model.scale; const cx = n.x, cy = n.y + h / 2, cz = n.z;
      const ox = eye.x - cx, oy = eye.y - cy, oz = eye.z - cz;
      const b = ox * f[0] + oy * f[1] + oz * f[2], c = ox * ox + oy * oy + oz * oz - Math.max(0.7, h / 2) ** 2;
      const disc = b * b - c; if (disc < 0) continue;
      const t = -b - Math.sqrt(disc); if (t > 0 && t < bt) { bt = t; best = n; }
    }
    return best;
  }
  function talk(n) {
    if (n.role === 'wanderer') return talkWanderer(n);
    if (n.role === 'camp') return Campaign.talk(n);
    if (n.role === 'mer') return Mer.talk(n);
    if (n.role === 'scientist' || n.role === 'apprentice') return Lab.talk(n);
    if (n.role === 'duststrider') return Camps.tame(n);
  }
  function label(n) { if (n.role === 'camp') return `${n.name} · tap to talk`; return n.role === 'wanderer' ? `${n.name} · has a job for you` : n.role === 'mer' ? `${n.name} · one of the sea people` : n.role === 'scientist' ? `${n.name} · scientist` : n.role === 'apprentice' ? `${n.name} · needs your help` : n.role === 'duststrider' ? `${n.name} · the camp's mount · tap to take it` : n.name; }
  // compass marks: dens of taken quests, the lab once you know of it
  function marks(p) {
    const out = [];
    for (const [w, q] of takenQuests()) { if (q.kind === 'lair' && !q.beaten) out.push({ t: '⌖', x: p.x + wd(q.lair.x - p.x), z: p.z + wd(q.lair.z - p.z), name: q.lairName }); if (q.kind === 'explore' && !q.reached) out.push({ t: '⌖', x: p.x + wd(q.spot.x - p.x), z: p.z + wd(q.spot.z - p.z), name: q.spotName }); }
    out.push(...Builds.marks(p), ...Lab.marks(p), ...Camps.marks(p));
    return out;
  }
  function mapMarks(p, range) {
    const out = [];
    const cx0 = Math.floor(U.mod(p.x, WORLD_W) / QCELL), cz0 = Math.floor(U.mod(p.z, WORLD_W) / QCELL); const cells = Math.min(6, Math.ceil(range / QCELL) + 1);
    for (let dx = -cells; dx <= cells; dx++) for (let dz = -cells; dz <= cells; dz++) { const w = wandererFor(cx0 + dx, cz0 + dz); if (w) out.push({ kind: 'wanderer', x: p.x + wd(w.x - p.x), z: p.z + wd(w.z - p.z), name: w.name, has: !(npcState(w.id).quest && npcState(w.id).quest.taken) }); }
    out.push(...Camps.mapMarks(p, range), ...Lab.mapMarks(p));
    return out;
  }
  return { init, update, entities, pick, talk, label, marks, mapMarks, activate, active, useCharge, hudText, onElderTalk, onLairBeaten, takenList: takenQuests, AMULETS, AMULET_KEYS, questText, npcState, get wanderers() { return activeW; }, get lab() { return Lab; }, get camps() { return Camps; }, get mer() { return Mer; } };
})();
