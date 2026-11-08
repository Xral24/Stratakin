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
  function species(s) { return { shape: 'biped', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: s.id === 'neon' }, colors: s.colors, size: 1, gen: 0, names: [s.name], neon: !!s.neon }; }
  // your look: hair, skin tone, height, face paint, a cape, your own outfit colours (from the barber, the mirror hall and the designer)
  const look = () => (G && G.stats && G.stats.look) || {};
  const HAIR = {
    short: [[-0.32, 1.78, -0.3, 0.64, 0.12, 0.6]], long: [[-0.33, 1.78, -0.31, 0.66, 0.12, 0.62], [-0.33, 1.05, -0.33, 0.66, 0.8, 0.1]], mohawk: [[-0.06, 1.8, -0.32, 0.12, 0.32, 0.64]],
    bun: [[-0.32, 1.78, -0.3, 0.64, 0.1, 0.6], [-0.12, 1.88, -0.36, 0.24, 0.24, 0.22]], spiky: [[-0.3, 1.8, -0.28, 0.14, 0.24, 0.14], [-0.07, 1.8, -0.1, 0.14, 0.3, 0.14], [0.16, 1.8, -0.28, 0.14, 0.22, 0.14], [-0.2, 1.8, 0.1, 0.14, 0.26, 0.14], [0.1, 1.8, 0.12, 0.14, 0.2, 0.14]],
    braids: [[-0.32, 1.78, -0.3, 0.64, 0.1, 0.6], [-0.42, 0.9, -0.05, 0.1, 0.9, 0.1], [0.32, 0.9, -0.05, 0.1, 0.9, 0.1]], curls: [[-0.36, 1.74, -0.34, 0.72, 0.2, 0.7], [-0.4, 1.4, -0.36, 0.1, 0.36, 0.5], [0.3, 1.4, -0.36, 0.1, 0.36, 0.5]],
    laurel: [[-0.34, 1.76, -0.32, 0.68, 0.1, 0.64], [-0.36, 1.82, -0.34, 0.72, 0.06, 0.06], [-0.36, 1.82, 0.28, 0.72, 0.06, 0.06], [-0.36, 1.82, -0.34, 0.06, 0.06, 0.68], [0.3, 1.82, -0.34, 0.06, 0.06, 0.68]], plume: [[-0.32, 1.78, -0.3, 0.64, 0.12, 0.6], [-0.04, 1.88, -0.3, 0.08, 0.55, 0.08], [-0.04, 2.3, -0.4, 0.08, 0.14, 0.2]],
    topknot: [[-0.32, 1.78, -0.3, 0.64, 0.1, 0.6], [-0.1, 1.88, -0.1, 0.2, 0.36, 0.2]], crownbraid: [[-0.34, 1.76, -0.32, 0.68, 0.14, 0.64], [-0.36, 1.8, -0.34, 0.72, 0.1, 0.1], [-0.36, 1.8, 0.24, 0.72, 0.1, 0.1]],
  };
  const PAINT = { stripes: [[-0.3, 1.5, 0.24, 0.6, 0.05, 0.03], [-0.3, 1.38, 0.24, 0.6, 0.05, 0.03]], dots: [[-0.25, 1.45, 0.24, 0.08, 0.08, 0.03], [0.17, 1.45, 0.24, 0.08, 0.08, 0.03], [-0.04, 1.33, 0.24, 0.08, 0.08, 0.03]], mask: [[-0.32, 1.42, 0.24, 0.64, 0.14, 0.03]], tribal: [[-0.04, 1.3, 0.24, 0.08, 0.35, 0.03], [-0.28, 1.48, 0.24, 0.2, 0.05, 0.03], [0.08, 1.48, 0.24, 0.2, 0.05, 0.03]], star: [[0.1, 1.42, 0.24, 0.14, 0.14, 0.03], [0.13, 1.39, 0.24, 0.08, 0.2, 0.03]] };
  function model(s) {
    const L = look(); const sp = species(s); sp.colors = Object.assign({}, sp.colors); if (L.tone) sp.colors.belly = L.tone; if (L.outfit) sp.colors.body = L.outfit; if (L.trim) sp.colors.accent = L.trim;
    const m = KIN.model(sp, 2); for (const d of s.deco) KIN.decorate(m, d); const sc = m.scale; const add = (b, c, emis) => m.boxes.push({ x: b[0] * sc, y: b[1] * sc, z: b[2] * sc, w: b[3] * sc, h: b[4] * sc, d: b[5] * sc, c, emis });
    if (L.hair && HAIR[L.hair] && !s.deco.some(d => d === 'crown' || d === 'visor' || d === 'hat')) for (const b of HAIR[L.hair]) add(b, L.hairCol || '#3a2a1a');
    if (L.paint && PAINT[L.paint]) for (const b of PAINT[L.paint]) add(b, L.paintCol || '#e0302a');
    if (L.cape) add([-0.38, 0.35, -0.36, 0.76, 1.25, 0.05], L.cape);
    return m;
  }
  function mesh(s) { const key = s.id + ':' + JSON.stringify(look()); let m = meshes.get(key); if (!m) { const mdl = model(s); m = { model: mdl, mesh: R.entityMesh('avatar:' + key, (mb) => KIN.buildMesh(mb, mdl)) }; meshes.set(key, m); } return m; }
  // the entity for the render list: standing where you stand, facing where you face, bobbing when you walk, seated on a mount
  function entity(p, moving) {
    const s = skin(); const mm = mesh(s);
    const seat = p.mount ? 0.75 : p.flying ? 0.35 : 0;
    return { x: p.x, y: p.y + seat, z: p.z, yaw: p.yaw + Math.PI, model: mm.model, mesh: mm.mesh, scale: look().height || 1, hover: moving && !p.mount && !p.flying ? Math.abs(Math.sin(performance.now() / 110)) * 0.08 : 0, skyMul: 1, isMount: true };
  }
  // a camera behind and a little above you, pulled in when something is in the way
  function thirdCam(cam, p, world, back = 4.2, lift = 0) {
    const f = U.forwardVec(p.yaw, p.pitch); cam = Object.assign({}, cam, { y: cam.y + lift });
    const free = (x, y, z) => { const b = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); return !isSolid(b) || BLOCKS[b].partial; };
    let d = back;
    for (let t = 0.3; t <= back; t += 0.25) { const x = cam.x - f[0] * t, y = cam.y - f[1] * t + 0.45 * (t / back), z = cam.z - f[2] * t; if (!free(x, y, z)) { d = Math.max(0.3, t - 0.3); break; } }
    return Object.assign({}, cam, { x: cam.x - f[0] * d, y: cam.y - f[1] * d + 0.6 * (d / back), z: cam.z - f[2] * d });
  }
  function portrait(cv, s, size) { KIN.portrait(cv, species(s), 2, size, model(s)); }
  return { init, SKINS, skin, unlocked, entity, thirdCam, portrait, model };
})();
