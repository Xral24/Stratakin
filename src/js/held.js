'use strict';
// What you hold, seen from your own eyes: a block as a cube in your hand, a tool, a weapon, a shield, a torch, a snare.
// Meshes are built once per item from the geo primitives and drawn by the renderer in front of everything, with a walk
// bob, a swing when you hit or mine, and a bump when you place something.
const Held = (() => {
  const C = (hex) => U.hexToRgb(hex);
  const WOOD = [0.52, 0.35, 0.18], DARKWOOD = [0.36, 0.24, 0.12], IRON = [0.42, 0.43, 0.48], LEATHER = [0.45, 0.3, 0.18];
  // the hand itself: a mitten in the skin tone of your look, holding whatever it is
  function hand(mb, tone) {
    const t = tone || [0.9, 0.72, 0.56];
    mb.blob(-0.1, -0.34, -0.12, 0.1, -0.08, 0.1, 0.9, t, { n: 2 }); // the fist
    mb.blob(-0.11, -0.18, -0.04, 0.0, -0.02, 0.09, 0.9, t, { n: 2 }); // the thumb over the top
    mb.tube([[0, -0.3, 0], [0.08, -0.62, 0.12], [0.16, -0.95, 0.3]], [0.085, 0.1, 0.12], [0.3, 0.42, 0.36], { segs: 8, cap0: 'none', cap1: 'none' }); // the forearm in its sleeve, running down out of view
  }
  // a block: a cube the size of a fist, coloured like the block, a little rounded
  function block(mb, id) {
    const info = BLOCKS[id]; const top = id === B.GRASS ? [0.37, 0.68, 0.25] : info.top, side = id === B.GRASS ? BLOCKS[B.DIRT].side : info.side;
    const s = 0.17; const emis = !!info.emissive;
    // six faces so the top can differ; flat normals from box
    mb.box(-s, -s, -s, s, s, s, side, 1, emis);
    mb.box(-s * 0.98, s - 0.001, -s * 0.98, s * 0.98, s + 0.004, s * 0.98, top, 1, emis);
    if (id === B.GRASS) mb.box(-s - 0.001, s * 0.55, -s - 0.001, s + 0.001, s + 0.002, s + 0.001, top, 1, false);
    if (id === B.LOG || id === B.BIRCHLOG || id === B.PALMLOG) { mb.box(-s * 0.7, s - 0.0005, -s * 0.7, s * 0.7, s + 0.005, s * 0.7, [top[0] * 1.15, top[1] * 1.1, top[2]], 1, false); }
    if (id === B.GLASS || id === B.SELGLASS) { /* glass: the frame */ const f = [0.36, 0.25, 0.14]; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) mb.box(a * s - 0.012, -s, b * s - 0.012, a * s + 0.012, s, b * s + 0.012, f, 1, false); }
  }
  function pick(mb, col) { const m = C(col); mb.tube([[0.02, -0.5, 0], [0, 0.42, 0]], [0.035, 0.03], WOOD, { segs: 7, cap0: 'round', cap1: 'flat' }); mb.tube([[-0.3, 0.3, 0], [0, 0.42, 0], [0.3, 0.3, 0]], [0.015, 0.055, 0.015], m, { segs: 7, cap0: 'round', cap1: 'round' }); mb.blob(-0.05, 0.36, -0.06, 0.05, 0.5, 0.06, 0.3, [m[0] * 0.7, m[1] * 0.7, m[2] * 0.7], { n: 1 }); }
  function axe(mb, col) { const m = C(col); mb.tube([[0.02, -0.5, 0], [0, 0.4, 0]], [0.035, 0.03], WOOD, { segs: 7, cap0: 'round', cap1: 'flat' }); mb.plate([[0.0, 0.2, 0], [0.26, 0.1, 0], [0.3, 0.42, 0], [0.0, 0.42, 0]], 0.03, m, { edge: [m[0] * 0.6, m[1] * 0.6, m[2] * 0.6] }); mb.box(-0.045, 0.28, -0.035, 0.045, 0.4, 0.035, [m[0] * 0.7, m[1] * 0.7, m[2] * 0.7], 1, false); }
  function shovel(mb, col) { const m = C(col); mb.tube([[0.02, -0.5, 0], [0, 0.3, 0]], [0.03, 0.028], WOOD, { segs: 7, cap0: 'round', cap1: 'none' }); mb.blob(-0.1, 0.26, -0.03, 0.1, 0.52, 0.03, 0.4, m, { n: 2, tap: [1, 0.8] }); }
  function sword(mb, col) { const m = C(col); mb.tube([[0, -0.3, 0], [0, -0.02, 0]], [0.03, 0.03], LEATHER, { segs: 6, cap0: 'round', cap1: 'none' }); mb.box(-0.12, -0.02, -0.025, 0.12, 0.02, 0.025, [0.72, 0.6, 0.3], 1, false); mb.plate([[-0.04, 0.02, 0], [0.04, 0.02, 0], [0.03, 0.62, 0], [0, 0.72, 0], [-0.03, 0.62, 0]], 0.012, m, { edge: [m[0] * 1.3, m[1] * 1.3, m[2] * 1.3] }); mb.ball(0, -0.32, 0, 0.035, [0.72, 0.6, 0.3], { n: 1 }); }
  function battleaxe(mb, col) { const m = C(col); mb.tube([[0.02, -0.5, 0], [0, 0.45, 0]], [0.035, 0.03], DARKWOOD, { segs: 7, cap0: 'round', cap1: 'round' }); for (const sgn of [-1, 1]) mb.plate([[0, 0.12, 0], [sgn * 0.3, 0.02, 0], [sgn * 0.34, 0.42, 0], [0, 0.4, 0]], 0.03, m, { edge: [m[0] * 0.6, m[1] * 0.6, m[2] * 0.6] }); }
  function spear(mb, col) { const m = C(col); mb.tube([[0.04, -0.7, 0], [0, 0.7, 0]], [0.03, 0.024], WOOD, { segs: 6, cap0: 'round', cap1: 'none' }); mb.plate([[-0.05, 0.66, 0], [0.05, 0.66, 0], [0, 0.95, 0]], 0.012, m, { edge: [m[0] * 1.2, m[1] * 1.2, m[2] * 1.2] }); for (let i = 0; i < 2; i++) mb.plate([[0.02, 0.6 - i * 0.03, 0], [0.04, 0.42 - i * 0.05, 0.06], [0.06, 0.4 - i * 0.05, -0.02]], 0.01, i ? [0.9, 0.2, 0.15] : [0.95, 0.9, 0.8]); }
  function shield(mb, col) { const m = C(col); mb.blob(-0.3, -0.4, -0.04, 0.3, 0.35, 0.02, 0.35, m, { n: 2, tap: [1, 0.75] }); mb.blob(-0.26, -0.36, 0.0, 0.26, 0.31, 0.03, 0.4, [m[0] * 0.85, m[1] * 0.85, m[2] * 0.85], { n: 2, tap: [1, 0.75] }); mb.ball(0, 0, 0.04, 0.06, [0.75, 0.62, 0.3], { n: 2 }); }
  function bow(mb, col) { const m = C(col); const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([Math.sin(t * Math.PI) * 0.14, -0.55 + t * 1.1, 0]); } mb.tube(pts, pts.map((p, i) => 0.014 + 0.016 * Math.sin(i / 8 * Math.PI)), WOOD, { segs: 6, cap0: 'round', cap1: 'round' }); mb.tube([[0, -0.55, 0], [0, 0.55, 0]], [0.005, 0.005], [0.9, 0.9, 0.9], { segs: 3, cap0: 'none', cap1: 'none' }); mb.box(-0.03, -0.1, -0.025, 0.03, 0.1, 0.025, LEATHER, 1, false); }
  function rod(mb, col) { const m = C(col); mb.tube([[0.04, -0.6, 0], [0, 0.4, 0], [-0.04, 0.95, 0]], [0.03, 0.018, 0.008], WOOD, { segs: 6, cap0: 'round', cap1: 'round' }); mb.tube([[0.0, -0.2, 0.05], [0.0, -0.2, 0.05]], [0.05, 0.05], m, { segs: 8, cap0: 'flat', cap1: 'flat' }); mb.ball(0.02, -0.22, 0.05, 0.055, m, { n: 2 }); }
  function torch(mb) { mb.tube([[0.02, -0.5, 0], [0, 0.22, 0]], [0.04, 0.045], DARKWOOD, { segs: 7, cap0: 'round', cap1: 'none' }); mb.blob(-0.07, 0.18, -0.07, 0.07, 0.3, 0.07, 0.5, [0.2, 0.14, 0.08], { n: 1 }); mb.blob(-0.09, 0.26, -0.09, 0.09, 0.56, 0.09, 1, [1.0, 0.62, 0.15], { n: 3, emis: true, tap: [1, 0.3] }); mb.blob(-0.05, 0.3, -0.05, 0.05, 0.62, 0.05, 1, [1.0, 0.92, 0.55], { n: 2, emis: true, tap: [1, 0.2] }); }
  function snare(mb, col) { const m = C(col); const s = 0.15; mb.blob(-s, -s, -s, s, s, s, 0.3, [m[0], m[1], m[2]], { n: 2, emis: false }); const bar = [m[0] * 1.5, m[1] * 1.5, m[2] * 1.5]; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { mb.box(a * s - 0.012, -s - 0.004, b * s - 0.012, a * s + 0.012, s + 0.004, b * s + 0.012, bar, 1, true); } mb.ball(0, 0, 0, 0.08, [1, 1, 1], { n: 2, emis: true }); }
  function bottle(mb, col) { const m = C(col); mb.tube([[0, -0.3, 0], [0, -0.05, 0], [0, 0.02, 0], [0, 0.2, 0]], [0.1, 0.11, 0.045, 0.04], m, { segs: 10, cap0: 'round', cap1: 'none' }); mb.tube([[0, 0.18, 0], [0, 0.28, 0]], [0.045, 0.04], [0.5, 0.35, 0.2], { segs: 6, cap0: 'none', cap1: 'round' }); }
  function egg(mb, col) { const m = C(col); mb.blob(-0.14, -0.2, -0.14, 0.14, 0.2, 0.14, 1, m, { n: 3, tap: [1, 0.75] }); for (let i = 0; i < 4; i++) { const a = i * 1.7; mb.ball(Math.cos(a) * 0.11, -0.05 + i * 0.05, Math.sin(a) * 0.11, 0.025, [m[0] * 0.6, m[1] * 0.6, m[2] * 0.6], { n: 1 }); } }
  function food(mb, col) { const m = C(col); mb.blob(-0.16, -0.08, -0.1, 0.16, 0.08, 0.1, 1, m, { n: 2 }); mb.blob(-0.1, 0.02, -0.06, 0.1, 0.1, 0.06, 1, [m[0] * 1.2, m[1] * 1.15, m[2]], { n: 1 }); }
  function berries(mb, col) { const m = C(col); for (const [x, y, z] of [[-0.06, 0, 0], [0.06, 0.02, 0.02], [0, 0.08, -0.03], [0, -0.06, 0.04], [0.04, -0.03, -0.05]]) mb.ball(x, y, z, 0.05, m, { n: 2 }); mb.plate([[0, 0.1, 0], [0.12, 0.2, 0.02], [0.04, 0.22, -0.04]], 0.008, [0.25, 0.55, 0.2]); }
  function lump(mb, col) { const m = C(col); mb.blob(-0.14, -0.12, -0.12, 0.14, 0.12, 0.12, 0.55, m, { n: 2 }); }
  function gem(mb, col) { const m = C(col); mb.blob(-0.1, -0.16, -0.1, 0.1, 0.16, 0.1, 0.1, m, { n: 1, tap: [0.2, 1], emis: true }); mb.blob(-0.1, -0.16, -0.1, 0.1, 0.0, 0.1, 0.1, m, { n: 1, tap: [1, 0.2] }); }
  function paper(mb, col) { const m = C(col); mb.box(-0.16, -0.2, -0.004, 0.16, 0.2, 0.004, m, 1, false); mb.box(-0.1, -0.1, 0.004, 0.1, -0.08, 0.008, [0.4, 0.3, 0.2], 1, false); mb.box(-0.1, 0.0, 0.004, 0.06, 0.02, 0.008, [0.4, 0.3, 0.2], 1, false); }
  function build(mb, key, item) {
    const col = item.col || '#888';
    if (key === 'torch') return torch(mb);
    if (item.block != null && item.block !== B.STATUE) return block(mb, item.block);
    if (key.startsWith('pick')) return pick(mb, col);
    if (key === 'hatchet' || key.startsWith('axe')) return axe(mb, col);
    if (key === 'shovel') return shovel(mb, col);
    if (key.startsWith('sw_')) return sword(mb, col);
    if (key.startsWith('ax_')) return battleaxe(mb, col);
    if (key.startsWith('sp_')) return spear(mb, col);
    if (key.startsWith('sh_')) return shield(mb, col);
    if (key === 'bow' || key.startsWith('bow_')) return bow(mb, col);
    if (key.startsWith('rod') || key === 'reel') return rod(mb, col);
    if (key.startsWith('snare')) return snare(mb, col);
    if (key.startsWith('tonic') || key === 'broth' || key === 'draught' || key === 'smoothie') return bottle(mb, col);
    if (key.startsWith('egg')) return egg(mb, col);
    if (key === 'bread') return food(mb, col);
    if (key === 'berry' || key.startsWith('bait')) return berries(mb, col);
    if (key.startsWith('map') || key === 'deepchart' || key === 'parcel') return paper(mb, col);
    if (['ember', 'void', 'gold', 'diamond', 'amber', 'selenite', 'ringshard', 'starsalt'].includes(key)) return gem(mb, col);
    return lump(mb, col);
  }
  // how each kind sits in the hand: offset of the item from the fist (x right, y up, z toward you) and a tilt (pitch about x, roll about z, yaw about y)
  function grip(key, item) {
    if (key === 'torch') return { off: [0, 0.3, 0], rot: [0.15, 0, -0.1], scale: 1 };
    if (item.block != null && item.block !== B.STATUE) return { off: [0.02, 0.0, -0.02], rot: [0.35, 0.6, 0.1], scale: 1 };
    if (key.startsWith('sh_')) return { off: [-0.2, 0.1, -0.1], rot: [0.0, 0.5, 0.0], scale: 1 };
    if (key === 'bow' || key.startsWith('bow_')) return { off: [-0.05, 0.1, 0.0], rot: [0.0, 0.3, 0.25], scale: 1 };
    if (key.startsWith('sw_') || key.startsWith('sp_') || key.startsWith('ax_')) return { off: [0, 0.2, 0], rot: [0.55, 0.0, -0.35], scale: 1 };
    if (key.startsWith('pick') || key === 'hatchet' || key.startsWith('axe') || key === 'shovel') return { off: [0, 0.25, 0], rot: [0.5, 0.3, -0.3], scale: 1 };
    if (key.startsWith('rod')) return { off: [0, 0.35, 0], rot: [0.9, 0.0, -0.2], scale: 1 };
    return { off: [0, 0.02, 0], rot: [0.3, 0.4, 0.0], scale: 1 };
  }
  const meshes = new Map();
  function mesh(key, item, tone) {
    const k = key + '|' + (tone || '');
    let m = meshes.get(k);
    if (!m) { const g = grip(key, item); m = { mesh: R.entityMesh('held:' + k, (mb) => { hand(mb, tone); mb.push(); mb.translate(g.off[0], g.off[1], g.off[2]); mb.rotate(g.rot[0], g.rot[1], g.rot[2]); build(mb, key, item); mb.pop(); }), grip: g }; meshes.set(k, m); }
    return m;
  }
  // the state the renderer needs this frame
  const st = { bobT: 0, swing: 0, bump: 0, lastKey: null, switchT: 0, mineT: 0 };
  function describe(p, dt, input) {
    const key = p.selected(); const item = key ? ITEMS[key] : null;
    if (st.lastKey !== key) { st.switchT = 1; st.lastKey = key; } st.switchT = Math.max(0, st.switchT - dt * 4);
    const moving = p.onGround && Math.hypot(p.vx, p.vz) > 0.5 && !p.mount && !p.flying;
    if (moving) st.bobT += dt * 7.5;
    // swinging: a melee swing, or the steady chop of mining while you hold on a block
    const mining = input && input.mine && p.mineTarget;
    if (mining) { st.mineT += dt * 7; st.swing = Math.max(0, Math.sin(st.mineT)); } else { st.mineT = 0; st.swing = p.swingT > 0 ? Math.sin(Math.min(1, p.swingT / 0.25) * Math.PI) : 0; }
    if (p.placedT > 0) { st.bump = Math.sin(Math.min(1, p.placedT / 0.18) * Math.PI); p.placedT -= dt; } else st.bump = 0;
    if (!item) return null;
    const tone = (G.stats && G.stats.look && G.stats.look.tone) ? C(G.stats.look.tone) : null;
    const m = mesh(key, item, tone);
    // blocking with a weapon in hand: the shield from your bag comes up in the other hand
    st.blockK = st.blockK == null ? 0 : st.blockK + ((p.blocking && !key.startsWith('sh_') ? 1 : 0) - st.blockK) * Math.min(1, dt * 14);
    let off = null; if (st.blockK > 0.02 && typeof Combat !== 'undefined') { const sh = Combat.shield(); if (sh && ITEMS[sh.id]) off = mesh(sh.id, ITEMS[sh.id], tone).mesh; }
    return { mesh: m.mesh, bob: st.bobT, moving: moving ? 1 : 0, swing: st.swing, bump: st.bump, drop: st.switchT, block: p.blocking ? 1 : 0, shieldy: key.startsWith('sh_'), offhand: off, offK: st.blockK };
  }
  return { describe, mesh, build };
})();
