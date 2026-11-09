'use strict';
// You, seen from outside: a box-built figure in one of the skins you have unlocked, drawn in third person, in the talk camera and in fights.
const Avatar = (() => {
  let G = null; const meshes = new Map();
  const SKINS = [
    { id: 'ranger', name: 'Ranger', colors: { body: '#4f7a3a', belly: '#e8c39e', accent: '#c9a84c', dark: '#5a3a22', eye: '#222222' }, deco: ['wanderer'], unlock: () => true, how: 'Yours from the start.' },
    { id: 'miner', name: 'Miner', colors: { body: '#6a6a72', belly: '#c68642', accent: '#ffd36a', dark: '#3a3a40', eye: '#222222' }, deco: ['lamp'], unlock: (g) => g.stats.reachedMines, how: 'Reach the Mines.' },
    { id: 'diver', name: 'Diver', colors: { body: '#1f4a8a', belly: '#f1d3b3', accent: '#7ad7ff', dark: '#163860', eye: '#222222' }, deco: ['mask'], unlock: (g) => g.player.has('bulb') || g.player.has('reeffins'), how: 'Own a Breathing Bulb or Reef Fins.' },
    { id: 'frontier', name: 'Frontier', colors: { body: '#7a4a2a', belly: '#e8c39e', accent: '#c94c4c', dark: '#3a2a1a', eye: '#222222' }, deco: ['hat'], unlock: (g) => (g.stats.villagesFreed || 0) >= 1, how: 'Free a village.' },
    { id: 'voodoo', name: 'Voodoo', colors: { body: '#2c3e50', belly: '#8d5524', accent: '#a65cff', dark: '#1a2430', eye: '#222222' }, deco: ['voodoo'], unlock: (g) => (g.stats.villagesFreed || 0) >= 3, how: 'Free three villages.' },
    { id: 'spacer', name: 'Spacer', colors: { body: '#e8f0ff', belly: '#e8c39e', accent: '#7ad7ff', dark: '#b8c4d8', eye: '#222222' }, deco: ['visor'], unlock: (g) => g.stats.reachedMoon || (g.stats.reached || {}).moon, how: 'Reach the Moon.' },
    { id: 'neon', name: 'Neon', colors: { body: '#101828', belly: '#39ff14', accent: '#ff2bd6', dark: '#05050f', eye: '#ffffff' }, deco: ['alien'], neon: true, unlock: (g) => Object.values(g.villageState || {}).some(st => st.freed && st.meta && st.meta.world === 'moon'), how: 'Free a village on the Moon.' },
    { id: 'dune', name: 'Dune', colors: { body: '#e8d8b0', belly: '#c9955a', accent: '#c9a45a', dark: '#9c7a42', eye: '#222222' }, deco: ['veil'], unlock: (g) => (g.stats.reached || {}).halo, how: 'Reach Halo.' },
    { id: 'painted', name: 'Indian Warrior', colors: { body: '#c68642', belly: '#c68642', accent: '#e0302a', dark: '#3a2a20', eye: '#222222' }, deco: ['warrior'], unlock: (g) => g.kin.some(k => k.sp.tame) || Object.values(g.poiState || {}).some(s => s && s.striderTaken), how: 'Take a Duststrider from an Indian camp.' },
    { id: 'legend', name: 'Legend', colors: { body: '#3a1458', belly: '#ffd25a', accent: '#ffe08a', dark: '#1a0a2a', eye: '#ff6a1f' }, deco: ['crown'], neon: true, unlock: (g) => Object.keys(g.stats.legends || {}).length > 0, how: "Beat a world's legendary." },
    { id: 'noble', name: 'Noble', colors: { body: '#5a1a3a', belly: '#f1d3b3', accent: '#ffd040', dark: '#2a0a1a', eye: '#222222' }, deco: ['crown'], unlock: (g) => (g.stats.boughtSkins || {}).noble, how: 'The Tailor in any city' },
    { id: 'knight', name: 'Knight', colors: { body: '#c8c8d0', belly: '#e8c39e', accent: '#c94c4c', dark: '#6a6a72', eye: '#222222' }, deco: ['visor'], unlock: (g) => (g.stats.boughtSkins || {}).knight, how: 'The Tailor in any city' },
    { id: 'corsair', name: 'Corsair', colors: { body: '#1a2a4a', belly: '#e8c39e', accent: '#e0302a', dark: '#0a1020', eye: '#222222' }, deco: ['hat'], unlock: (g) => (g.stats.boughtSkins || {}).corsair, how: 'The Tailor in any city' },
    { id: 'sage', name: 'Sage', colors: { body: '#3a2a6a', belly: '#e8c39e', accent: '#b0a0ff', dark: '#1a1030', eye: '#222222' }, deco: ['voodoo'], unlock: (g) => (g.stats.boughtSkins || {}).sage, how: 'The Tailor in any city' },
    { id: 'duelist', name: 'Duelist', colors: { body: '#15151a', belly: '#e8c39e', accent: '#d8d8e0', dark: '#05050a', eye: '#222222' }, deco: ['mask'], unlock: (g) => (g.stats.boughtSkins || {}).duelist, how: 'The Tailor in any city' },
    { id: 'royal', name: 'Royal', colors: { body: '#f0e8d8', belly: '#e8c39e', accent: '#ffd040', dark: '#7a1a2a', eye: '#222222' }, deco: ['crown'], neon: true, unlock: (g) => (g.stats.boughtSkins || {}).royal, how: 'The Tailor in any city' },
  ];
  function init(game) { G = game; }
  function skin() { return SKINS.find(s => s.id === (G.skin || 'ranger')) || SKINS[0]; }
  function unlocked(s) { try { return !!s.unlock(G); } catch (e) { return false; } }
  function species(s) { return { shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: s.id === 'neon' }, colors: s.colors, size: 1, gen: 0, names: [s.name], neon: !!s.neon }; }
  // your look: hair, skin tone, height, face paint, a cape, your own outfit colours (from the barber, the mirror hall and the designer)
  const look = () => (G && G.stats && G.stats.look) || {};
  // hair, face paint and a cape, built with the same primitives as the folk. Head centre (0, 1.58, 0), radius 0.27, crown 1.88; shoulders (±0.33, 1.2)
  const HAIR = {
    short: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.94, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); H.blob(-0.26, 1.72, 0.1, 0.26, 1.9, 0.29, 0.8, c, { n: 3 }); },
    long: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.94, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); H.blob(-0.24, 1.74, 0.1, 0.24, 1.9, 0.29, 0.8, c, { n: 3 }); for (const sd of [-1, 1]) H.tube([[sd * 0.27, 1.75, -0.08], [sd * 0.3, 1.4, -0.1], [sd * 0.3, 1.05, -0.08]], [0.09, 0.09, 0.07], c, { segs: 6, cap0: 'none', cap1: 'round' }); H.blob(-0.26, 1.0, -0.34, 0.26, 1.7, -0.14, 0.7, c, { n: 3, tap: [1, 0.8] }); },
    mohawk: (H, c) => { for (let i = 0; i < 6; i++) { const z = 0.24 - i * 0.1; H.cone([0, 1.8 + Math.sin(i / 5 * Math.PI) * 0.03, z], [0, 1, 0.1 - i * 0.04], 0.32 + Math.sin(i / 5 * Math.PI) * 0.12, 0.065, c, { segs: 5 }); } H.blob(-0.08, 1.74, -0.3, 0.08, 1.9, 0.3, 0.8, c, { n: 2 }); },
    bun: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.93, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); H.ball(0, 1.92, -0.14, 0.14, c, { n: 3 }); H.ring(0, 1.92, -0.14, 0.13, 0.13, 0.02, '#c9a84c', { emis: true }, 'z'); },
    spiky: (H, c) => { H.blob(-0.29, 1.56, -0.3, 0.29, 1.9, 0.2, 0.9, c, { n: 3, tap: [0.98, 0.9] }); for (const [x, z, lx, lz] of [[-0.18, -0.12, -0.5, -0.2], [0, -0.16, 0, -0.5], [0.18, -0.12, 0.5, -0.2], [-0.12, 0.08, -0.4, 0.3], [0.12, 0.08, 0.4, 0.3], [0, 0.0, 0, 0.1]]) H.cone([x, 1.84, z], [lx, 1, lz], 0.3, 0.07, c, { segs: 5 }); },
    braids: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.93, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); for (const sd of [-1, 1]) { H.tube([[sd * 0.26, 1.7, -0.1], [sd * 0.36, 1.4, -0.02], [sd * 0.38, 1.0, 0.04], [sd * 0.38, 0.86, 0.06]], [0.06, 0.055, 0.05, 0.02], c, { segs: 6, cap0: 'none', cap1: 'round' }); for (let i = 0; i < 3; i++) H.ring(sd * (0.3 + i * 0.03), 1.56 - i * 0.2, -0.05 + i * 0.03, 0.07, 0.07, 0.015, '#c94c4c'); } },
    curls: (H, c) => { H.blob(-0.34, 1.52, -0.35, 0.34, 1.98, 0.24, 1, c, { n: 4 }); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; H.ball(Math.cos(a) * 0.3, 1.78 + Math.sin(i * 2.1) * 0.08, Math.sin(a) * 0.3 - 0.05, 0.1, c, { n: 2 }); } },
    laurel: (H, c) => { H.blob(-0.29, 1.56, -0.3, 0.29, 1.9, 0.2, 0.9, c, { n: 3, tap: [0.98, 0.9] }); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + 0.26; const x = Math.cos(a) * 0.29, z = Math.sin(a) * 0.29; H.plate([[x, 1.76, z], [x * 1.25 + Math.sin(a) * 0.06, 1.84, z * 1.25 - Math.cos(a) * 0.06], [x * 1.1, 1.9, z * 1.1], [x * 1.25 - Math.sin(a) * 0.06, 1.84, z * 1.25 + Math.cos(a) * 0.06]], 0.012, i % 2 ? '#5a9a3a' : '#c9a84c'); } },
    plume: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.93, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); H.feather(0, 1.9, -0.1, 0.55, c, 0.1); H.feather(0.04, 1.88, -0.12, 0.45, '#e0302a', -0.2); },
    topknot: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.93, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); H.tube([[0, 1.9, 0], [0, 2.12, 0]], [0.09, 0.07], c, { segs: 6, cap0: 'none', cap1: 'none' }); H.ball(0, 2.18, 0, 0.11, c, { n: 3 }); H.ring(0, 2.06, 0, 0.085, 0.085, 0.015, '#c94c4c'); },
    crownbraid: (H, c) => { H.blob(-0.3, 1.55, -0.31, 0.3, 1.93, 0.2, 0.9, c, { n: 4, tap: [0.98, 0.9] }); const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * 6.283; pts.push([Math.cos(a) * 0.3, 1.8 + Math.sin(a * 8) * 0.012, Math.sin(a) * 0.3]); } H.tube(pts, pts.map((p, i) => 0.05 + 0.015 * Math.sin(i * 2.4)), c, { segs: 6, cap0: 'none', cap1: 'none' }); },
  };
  // face paint: patches laid on the face, following its curve
  const PAINT = {
    stripes: (H, c) => { for (const y of [1.52, 1.42]) H.plate([[-0.22, y, H.faceZ(-0.22, y) + 0.006], [0.22, y, H.faceZ(0.22, y) + 0.006], [0.22, y - 0.045, H.faceZ(0.22, y - 0.045) + 0.006], [-0.22, y - 0.045, H.faceZ(-0.22, y - 0.045) + 0.006]], 0.004, c); },
    dots: (H, c) => { for (const [x, y] of [[-0.2, 1.47], [0.2, 1.47], [0, 1.36], [-0.12, 1.7], [0.12, 1.7]]) H.ball(x, y, H.faceZ(x, y) + 0.004, 0.028, c, { n: 1 }); },
    mask: (H, c) => H.plate([[-0.25, 1.56, H.faceZ(-0.25, 1.56) + 0.006], [-0.1, 1.68, H.faceZ(-0.1, 1.68) + 0.006], [0.1, 1.68, H.faceZ(0.1, 1.68) + 0.006], [0.25, 1.56, H.faceZ(0.25, 1.56) + 0.006], [0.25, 1.5, H.faceZ(0.25, 1.5) + 0.006], [0.0, 1.46, H.faceZ(0, 1.46) + 0.006], [-0.25, 1.5, H.faceZ(-0.25, 1.5) + 0.006]], 0.004, c),
    tribal: (H, c) => { H.plate([[-0.025, 1.3, H.faceZ(-0.025, 1.3) + 0.006], [0.025, 1.3, H.faceZ(0.025, 1.3) + 0.006], [0.02, 1.47, H.faceZ(0.02, 1.47) + 0.006], [-0.02, 1.47, H.faceZ(-0.02, 1.47) + 0.006]], 0.004, c); for (const sd of [-1, 1]) H.plate([[sd * 0.1, 1.5, H.faceZ(sd * 0.1, 1.5) + 0.006], [sd * 0.25, 1.46, H.faceZ(sd * 0.25, 1.46) + 0.006], [sd * 0.25, 1.42, H.faceZ(sd * 0.25, 1.42) + 0.006], [sd * 0.1, 1.46, H.faceZ(sd * 0.1, 1.46) + 0.006]], 0.004, c); },
    star: (H, c) => { const x0 = 0.16, y0 = 1.44; const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.57; const r = i % 2 ? 0.03 : 0.07; const x = x0 + Math.cos(a) * r, y = y0 + Math.sin(a) * r; pts.push([x, y, H.faceZ(x, y) + 0.006]); } H.plate(pts, 0.004, c); },
  };
  function model(s) {
    const L = look(); const sp = species(s); sp.colors = Object.assign({}, sp.colors); if (L.tone) sp.colors.belly = L.tone; if (L.outfit) sp.colors.body = L.outfit; if (L.trim) sp.colors.accent = L.trim;
    const styled = L.hair && HAIR[L.hair] && !s.deco.some(d => d === 'crown' || d === 'visor' || d === 'hat');
    if (styled) sp.bald = true; else if (L.hairCol) sp.hair = L.hairCol;
    const m = KIN.model(sp, 2); for (const d of s.deco) KIN.decorate(m, d);
    const H = KIN.partHelpers(m); H.bone = 1;
    if (styled) HAIR[L.hair](H, L.hairCol || '#3a2a1a');
    if (L.paint && PAINT[L.paint]) PAINT[L.paint](H, L.paintCol || '#e0302a');
    H.bone = 0;
    if (L.cape) { // a cape from the shoulders, falling behind to the calves, flaring a little
      const spine = []; const widths = []; for (let i = 0; i <= 6; i++) { const t = i / 6; spine.push([0, 1.22 - t * 0.98, -0.2 - Math.sin(t * 2.4) * 0.14 - t * 0.04]); widths.push(0.3 + t * 0.14); }
      H.ribbon(spine, widths, L.cape, { droop: 0.25, tip: U.rgbToHex(U.mixColor(U.hexToRgb(L.cape), [0, 0, 0], 0.25)) });
      H.tube([[-0.3, 1.24, -0.12], [0, 1.22, -0.2], [0.3, 1.24, -0.12]], [0.03, 0.035, 0.03], '#c9a84c', { segs: 5, cap0: 'round', cap1: 'round' }); // the clasp cord
    }
    H.done(); return m;
  }
  // what you hold, when you are seen from outside: the same item shapes as the first-person hand, gripped by the right hand (a shield
  // on the left forearm), built onto the arm's bone so they swing with it. The hands hang at (±0.45, 0.55, 0.06)
  function heldKeys(p) {
    const key = p && p.selected ? p.selected() : null; const item = key ? ITEMS[key] : null;
    let main = item ? key : null, off = null;
    if (main && main.startsWith('sh_')) { off = main; main = null; }
    if (p && p.blocking && !off && typeof Combat !== 'undefined' && Combat.shield) { const sh = Combat.shield(); if (sh && ITEMS[sh.id]) off = sh.id; }
    return { main, off };
  }
  function gripOut(key, item) { // where the item sits in the right hand (offset in hand units) and how it is tilted: rx > 0 leans the tip forward, rz > 0 away from the body
    if (key === 'torch') return { off: [0, 0.22, 0.02], rot: [0.3, 0, 0.1] };
    if (item.block != null && item.block !== B.STATUE) return { off: [0, 0.02, 0.1], rot: [0.3, -0.6, 0] };
    if (key === 'bow' || key.startsWith('bow_')) return { off: [0, 0.05, 0.04], rot: [0.12, 0.7, 0.05] };
    if (key.startsWith('sw_') || key.startsWith('ax_')) return { off: [0, 0.16, 0.02], rot: [0.25, 0, 0.42] }; // carried upright, blade out from the hip, so the swing brings it down and through
    if (key.startsWith('sp_')) return { off: [0, 0.3, 0.04], rot: [0.3, 0, 0.12] };
    if (key.startsWith('pick') || key === 'hatchet' || key.startsWith('axe') || key === 'shovel') return { off: [0, 0.2, 0.04], rot: [0.6, -0.4, 0.2] };
    if (key.startsWith('rod')) return { off: [0, 0.3, 0.04], rot: [1.1, 0, 0.1] };
    if (key.startsWith('snare')) return { off: [0, 0.02, 0.12], rot: [0.2, -0.4, 0] };
    return { off: [0, 0.02, 0.1], rot: [0.4, -0.4, 0] };
  }
  // the figure faces +z, so its right hand is the -x one (bone 2) and its left the +x one (bone 3)
  function addHeld(mb, main, off) {
    const S = 0.95;
    if (main && ITEMS[main]) { const g = gripOut(main, ITEMS[main]); mb.setBone(2); mb.push(); mb.translate(-0.45, 0.55, 0.06); mb.scale(S, S, S); mb.translate(g.off[0], g.off[1], g.off[2]); mb.rotate(g.rot[0], g.rot[1], g.rot[2]); Held.build(mb, main, ITEMS[main]); mb.pop(); mb.setBone(0); }
    if (off && ITEMS[off]) { mb.setBone(3); mb.push(); mb.translate(0.5, 0.68, 0.14); mb.scale(S, S, S); mb.rotate(0.1, -0.2, -0.1); Held.build(mb, off, ITEMS[off]); mb.pop(); mb.setBone(0); }
  }
  function mesh(s, held) {
    const key = s.id + ':' + JSON.stringify(look()) + ':' + (held ? (held.main || '') + '/' + (held.off || '') : '');
    let m = meshes.get(key);
    if (!m) { const mdl = model(s); m = { model: mdl, mesh: R.entityMesh('avatar:' + key, (mb) => { KIN.buildMesh(mb, mdl); if (held) addHeld(mb, held.main, held.off); }) }; meshes.set(key, m); }
    return m;
  }
  // the entity for the render list: standing where you stand, facing where you face, bobbing when you walk, seated on a mount
  const an = { ph: 0, mv: 0, lx: 0, lz: 0, ly: 0, lt: 0, vy: 0, seed: 3, air: 0 };
  function entity(p, moving) {
    const s = skin(); const mm = mesh(s, heldKeys(p));
    const seat = p.mount ? 0.75 : p.flying ? 0.35 : 0;
    an.attack = p.swingT > 0 ? Math.sin(Math.min(1, p.swingT / 0.25) * Math.PI) : 0; an.block = p.blocking ? 1 : 0;
    if (p.mount || p.flying) { an.mv = 0; an.sit = 1; } else an.sit = 0;
    return { x: p.x, y: p.y + seat, z: p.z, yaw: p.yaw + Math.PI, model: mm.model, mesh: mm.mesh, scale: look().height || 1, hover: 0, skyMul: 1, isMount: true, _an: an };
  }
  // a camera behind and a little above you, pulled in when something is in the way
  function thirdCam(cam, p, world, back = 4.2, lift = 0) {
    const f = U.forwardVec(cam.yaw, cam.pitch); cam = Object.assign({}, cam, { y: cam.y + lift });
    const free = (x, y, z) => { const b = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); return !isSolid(b) || BLOCKS[b].partial; };
    let d = back;
    for (let t = 0.3; t <= back; t += 0.25) { const x = cam.x - f[0] * t, y = cam.y - f[1] * t + 0.45 * (t / back), z = cam.z - f[2] * t; if (!free(x, y, z)) { d = Math.max(0.3, t - 0.3); break; } }
    return Object.assign({}, cam, { x: cam.x - f[0] * d, y: cam.y - f[1] * d + 0.6 * (d / back), z: cam.z - f[2] * d });
  }
  function portrait(cv, s, size) { KIN.portrait(cv, species(s), 2, size, model(s)); }
  return { init, SKINS, skin, unlocked, entity, thirdCam, portrait, model };
})();
