'use strict';
// Mer-schools: the sea people of the open ocean swim in fast shoals, far out from the villages. On foot you never catch them;
// on a fish's back you can, and then they slow, turn, and have something for the one who reached them.
const Mer = (() => {
  let G = null, world = null; let school = null, timer = 12;
  const NAMES = ['Nerissa', 'Thal', 'Meridia', 'Orm', 'Calyx', 'Sura', 'Pelagos', 'Isolde', 'Brann', 'Ione', 'Delphin', 'Marrow'];
  const LORE = ['The reefs are thickest where the sea is oldest. Our cities are there, under glass.', 'Pearl coral grows in the dark of the deep reefs. One pearl is a season of trading.', 'The big ones hunt the trench at night. Cast there with void on the hook.', 'We race the currents. Nothing with legs has caught us before.'];
  function init(game) { G = game; world = game.world; school = null; timer = 12; }
  function st(id) { if (!G.npcState) G.npcState = {}; if (!G.npcState[id]) G.npcState[id] = { met: false, quest: null }; return G.npcState[id]; }
  function merSpecies(i, seed) { const r = U.rng(U.combine(0x3E4, i, seed)); const skin = r.pick(['#6fd0c8', '#4aa8b8', '#8fe0d0', '#3f8fa0']); return { shape: 'biped', feat: { crest: false, ears: false, horns: false, spikes: false, tail: true, wings: false, bigEyes: false }, colors: { body: r.pick(['#2a5a7a', '#1f4a6a', '#3a7a8a']), belly: skin, accent: '#8fe0d0', dark: '#1a3a4a', eye: '#222222' }, size: 1, gen: 0, names: ['mer'] }; }
  function spawn(p) {
    const a = Math.random() * Math.PI * 2; const cx = p.x + Math.cos(a) * 34, cz = p.z + Math.sin(a) * 34;
    const seed = U.combine(Math.round(cx / 64), Math.round(cz / 64), 0xA3); const id = 'mer:' + (Math.round(cx / 64)) + ',' + Math.round(cz / 64);
    const r = U.rng(seed); const n = 4;
    school = { id, cx, cz, r: 13, speed: 5.6, slow: 0, phase: r() * Math.PI * 2, mers: [] };
    for (let i = 0; i < n; i++) { const sp = merSpecies(i, seed); const m = KIN.model(sp, 2); KIN.decorate(m, 'merfolk'); school.mers.push({ i, role: 'mer', name: NAMES[(r.int(NAMES.length) + i) % NAMES.length], x: cx, y: SEA - 2.5, z: cz, yaw: 0, model: m, mesh: R.entityMesh('mer:' + i, (mb) => KIN.buildMesh(mb, m)), off: i * (Math.PI * 2 / n), bob: i }); }
    UI.toast('Shapes in the water, fast, in a line. The sea people. Only something that swims could keep up.');
  }
  function update(dt, p, inBattle) {
    if (world.preset.id !== 'earth') { school = null; return; }
    const info = world.colInfo(Math.floor(p.x), Math.floor(p.z));
    const deep = info.h < SEA - 6 && (p.inWater || p.underwater) && !(Village.active && Math.hypot(Village.active.x - p.x, Village.active.z - p.z) < 60);
    if (!school) { if (deep) { timer -= dt; if (timer <= 0) { timer = 30 + Math.random() * 30; spawn(p); } } return; }
    const s = school;
    if (Math.hypot(p.x - s.cx, p.z - s.cz) > 110) { school = null; return; }
    const mounted = !!(p.mount && p.mountMode === 'water');
    if (s.slow > 0) s.slow -= dt;
    const speed = s.slow > 0 ? 1.0 : s.speed;
    s.phase += speed / s.r * dt;
    for (const m of s.mers) {
      m.bob += dt;
      const a = s.phase + m.off; const tx = s.cx + Math.cos(a) * s.r, tz = s.cz + Math.sin(a) * s.r;
      m.x += (tx - m.x) * Math.min(1, dt * 6); m.z += (tz - m.z) * Math.min(1, dt * 6);
      m.y = SEA - 2.2 + Math.sin(m.bob * 1.5) * 0.6;
      const dx = p.x - m.x, dz = p.z - m.z, d = Math.hypot(dx, dz);
      if (s.slow > 0 && d < 8) m.yaw = Math.atan2(dx, dz); else m.yaw = a + Math.PI / 2;
      if (mounted && d < 4.5 && s.slow <= 0) { s.slow = 25; UI.toast(`${m.name} turns in the water and waits for you. Tap to speak.`, 'good'); }
    }
  }
  function entities() { if (!school) return []; return school.mers.map(m => ({ x: m.x, y: m.y, z: m.z, yaw: m.yaw, model: m.model, mesh: m.mesh, scale: 1, hover: 0, skyMul: 1, src: m, swim: 1 })); }
  function talkable() { return school && school.slow > 0 ? school.mers : []; }
  function talk(n) {
    const s = school; if (!s) return; const S = st(s.id); G.talkNpc = n;
    const lore = LORE[U.combine(U.strHash(s.id), 3) % LORE.length];
    if (!S.met) { S.met = true; Dialogue.show(n.name, ['You caught us. Nothing on legs has, before.', lore, 'Take this, from the deep, for the trouble.'], () => { G.player.add('pearl', 2); G.player.add('coral', 4); UI.sfx('caught'); UI.toast('+2 Pearl, +4 Coral from the sea people.', 'good'); }); return; }
    if (!S.quest) { S.quest = { n: 8, taken: true }; Dialogue.show(n.name, ['Our gardens thin. Bring us eight coral from the floor and we will give you something no trader has.']); return; }
    if (!S.quest.done) {
      if (G.player.count('coral') >= S.quest.n) { G.player.take('coral', S.quest.n); S.quest.done = true; const pool = Npcs.AMULET_KEYS.filter(k => !G.player.has(k)); const gift = pool.length ? pool[U.combine(U.strHash(s.id), 9) % pool.length] : null; Dialogue.show(n.name, ['Eight coral. The gardens will grow.', gift ? 'This came up from a wreck older than our city. It is yours.' : 'Pearls, then, since you want for nothing else.'], () => { if (gift) { G.player.add(gift, 1); UI.openPanel('reveal', { kind: 'item', item: gift, n: 1 }); } else G.player.add('pearl', 4); UI.sfx('quest'); }); }
      else Dialogue.show(n.name, [`Eight coral. You have ${G.player.count('coral')}. The floor is full of it.`]);
      return;
    }
    Dialogue.show(n.name, [lore, 'Swim well.']);
  }
  return { init, update, entities, talkable, talk, get school() { return school; } };
})();
