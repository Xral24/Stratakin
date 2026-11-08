'use strict';
// Item icons: small pictures drawn once on a 2D canvas and cached as data URLs. Blocks are little cubes in their own
// materials; tools, tonics, ores, eggs and gear each get a shape of their own, coloured from the item table.
const Icons = (() => {
  const cache = new Map(); const S = 64;
  const rgb = (hex) => { const c = U.hexToRgb(hex); return c; };
  const css = (c, m = 1) => `rgb(${Math.round(Math.min(255, c[0] * 255 * m))},${Math.round(Math.min(255, c[1] * 255 * m))},${Math.round(Math.min(255, c[2] * 255 * m))})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const hash = (i, j, k) => U.hash3(i, j, k || 0, 77);
  // ---- a block as an isometric cube: top, left and right faces, with a material scribble on each ----
  function cube(g, id, col) {
    const info = BLOCKS[id]; const top = info ? info.top : col, side = info ? info.side : col;
    const T = id === B.GRASS ? [0.37, 0.68, 0.25] : top, L = id === B.GRASS ? BLOCKS[B.DIRT].side : side, R = L;
    const cx = 32, cy = 34, w = 22, h = 12, d = 24; // the cube: corners of the top rhombus and the height
    const P = { t: [cx, cy - h - d / 2], l: [cx - w, cy - d / 2], r: [cx + w, cy - d / 2], b: [cx, cy + h - d / 2] }; const dn = d;
    const face = (pts, c) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fillStyle = c; g.fill(); };
    face([P.t, P.r, P.b, P.l], css(T, 1.12));
    face([P.l, P.b, [P.b[0], P.b[1] + dn], [P.l[0], P.l[1] + dn]], css(L, 0.86));
    face([P.b, P.r, [P.r[0], P.r[1] + dn], [P.b[0], P.b[1] + dn]], css(R, 0.66));
    g.save(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(P.l[0], P.l[1]); g.lineTo(P.b[0], P.b[1]); g.lineTo(P.r[0], P.r[1]); g.moveTo(P.b[0], P.b[1]); g.lineTo(P.b[0], P.b[1] + dn); g.stroke(); g.restore();
    // material marks
    g.save(); g.beginPath(); g.moveTo(P.l[0], P.l[1]); g.lineTo(P.b[0], P.b[1]); g.lineTo(P.b[0], P.b[1] + dn); g.lineTo(P.l[0], P.l[1] + dn); g.closePath(); g.clip();
    if (id === B.GRASS) { g.fillStyle = css(T, 0.95); g.beginPath(); for (let i = 0; i <= 8; i++) { const x = P.l[0] + (P.b[0] - P.l[0]) * i / 8, y = P.l[1] + (P.b[1] - P.l[1]) * i / 8; g.lineTo(x, y + (i % 2 ? 5 : 2)); } g.lineTo(P.b[0], P.b[1] - 1); g.lineTo(P.l[0], P.l[1] - 1); g.fill(); }
    else if (id === B.LOG || id === B.BIRCHLOG || id === B.PALMLOG) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let i = 1; i < 5; i++) { const t = i / 5; g.beginPath(); g.moveTo(P.l[0] + 2, P.l[1] + dn * t); g.lineTo(P.b[0] - 2, P.b[1] + dn * t); g.stroke(); } }
    else if (id === B.PLANKS) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.2; for (let i = 1; i < 3; i++) { const t = i / 3; g.beginPath(); g.moveTo(P.l[0], P.l[1] + dn * t); g.lineTo(P.b[0], P.b[1] + dn * t); g.stroke(); } }
    else if (id === B.STONE || id === B.BASALT || id === B.GRAVEL || id === B.MASONRY) { g.fillStyle = 'rgba(0,0,0,0.14)'; for (let i = 0; i < 7; i++) { const x = P.l[0] + 3 + hash(i, 1) * (w - 6), y = P.l[1] + 3 + hash(i, 2) * (dn - 4) + (x - P.l[0]) * (h / w); g.beginPath(); g.ellipse(x, y, 2 + hash(i, 3) * 2, 1.2 + hash(i, 4), 0, 0, 6.3); g.fill(); } }
    else if (id === B.SAND || id === B.DUNE || id === B.SNOW) { g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 12; i++) { const x = P.l[0] + 2 + hash(i, 5) * (w - 4), y = P.l[1] + 2 + hash(i, 6) * (dn - 3) + (x - P.l[0]) * (h / w); g.fillRect(x, y, 1.5, 1.5); } }
    else if (id === B.GLASS || id === B.SELGLASS) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(P.l[0] + 3, P.l[1] + 4); g.lineTo(P.l[0] + 9, P.l[1] + 7); g.lineTo(P.l[0] + 9, P.l[1] + 16); g.lineTo(P.l[0] + 3, P.l[1] + 13); g.fill(); }
    g.restore();
    // ore: nuggets on the faces in the ore's colour
    const ore = { [B.COPPER]: '#d08a4a', [B.IRON]: '#e0d8cc', [B.EMBER]: '#ff7a2a', [B.GOLD]: '#ffd040', [B.DIAMOND]: '#9ff6ff', [B.VOID]: '#b86cff', [B.SELENITE]: '#eaf6ff', [B.TYCHO]: '#9fb4d0', [B.AMBER]: '#e8b85a', [B.SULFUR]: '#e8d84a' }[id];
    if (ore) { g.fillStyle = ore; for (let i = 0; i < 6; i++) { const f = i % 3; const x = f === 0 ? P.l[0] + 4 + hash(i, 7) * (w - 8) : f === 1 ? P.b[0] + 4 + hash(i, 7) * (w - 8) : cx - 10 + hash(i, 7) * 20; const y = f === 0 ? P.l[1] + 6 + hash(i, 8) * (dn - 10) + (x - P.l[0]) * (h / w) : f === 1 ? P.b[1] + 6 + hash(i, 8) * (dn - 10) - (x - P.b[0]) * (h / w) : cy - d / 2 - 4 + hash(i, 8) * 8; g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 3, y); g.lineTo(x, y + 3); g.lineTo(x - 3, y); g.closePath(); g.fill(); } }
  }
  // ---- general shapes ----
  function gem(g, col) { const c = rgb(col); g.beginPath(); g.moveTo(32, 8); g.lineTo(54, 26); g.lineTo(32, 56); g.lineTo(10, 26); g.closePath(); g.fillStyle = css(c); g.fill(); g.beginPath(); g.moveTo(32, 8); g.lineTo(54, 26); g.lineTo(32, 30); g.closePath(); g.fillStyle = css(c, 1.35); g.fill(); g.beginPath(); g.moveTo(32, 30); g.lineTo(32, 56); g.lineTo(10, 26); g.closePath(); g.fillStyle = css(c, 0.7); g.fill(); }
  function lump(g, col) { const c = rgb(col); g.beginPath(); g.moveTo(14, 44); g.lineTo(18, 24); g.lineTo(30, 14); g.lineTo(48, 20); g.lineTo(54, 40); g.lineTo(42, 52); g.lineTo(22, 52); g.closePath(); g.fillStyle = css(c); g.fill(); g.beginPath(); g.moveTo(18, 24); g.lineTo(30, 14); g.lineTo(48, 20); g.lineTo(34, 30); g.closePath(); g.fillStyle = css(c, 1.3); g.fill(); g.beginPath(); g.moveTo(34, 30); g.lineTo(54, 40); g.lineTo(42, 52); g.lineTo(22, 52); g.lineTo(14, 44); g.closePath(); g.fillStyle = css(c, 0.72); g.fill(); }
  function bottle(g, col, stopper = '#7a5a3a') { const c = rgb(col); g.fillStyle = css(c, 0.9); g.beginPath(); g.moveTo(26, 22); g.lineTo(38, 22); g.lineTo(38, 28); g.quadraticCurveTo(50, 32, 50, 44); g.quadraticCurveTo(50, 56, 32, 56); g.quadraticCurveTo(14, 56, 14, 44); g.quadraticCurveTo(14, 32, 26, 28); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(23, 42, 3, 7, 0.2, 0, 6.3); g.fill(); g.fillStyle = stopper; g.fillRect(27, 10, 10, 13); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(26, 20, 12, 3); }
  function handle(g, x0, y0, x1, y1, w, col) { g.save(); g.lineCap = 'round'; g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); }
  function tool(g, kind, col) { const c = rgb(col); const metal = css(c), dark = css(c, 0.6), wood = '#8a5a2c';
    if (kind === 'pick') { handle(g, 18, 56, 44, 18, 5, wood); g.fillStyle = metal; g.beginPath(); g.moveTo(24, 10); g.quadraticCurveTo(46, 6, 58, 26); g.lineTo(52, 30); g.quadraticCurveTo(44, 16, 30, 18); g.closePath(); g.fill(); g.fillStyle = dark; g.fillRect(40, 14, 8, 8); }
    else if (kind === 'axe') { handle(g, 18, 56, 44, 18, 5, wood); g.fillStyle = metal; g.beginPath(); g.moveTo(38, 10); g.quadraticCurveTo(60, 14, 56, 34); g.lineTo(44, 30); g.lineTo(40, 24); g.closePath(); g.fill(); g.fillStyle = dark; g.fillRect(38, 16, 8, 8); }
    else if (kind === 'shovel') { handle(g, 20, 56, 40, 24, 5, wood); g.fillStyle = metal; g.beginPath(); g.moveTo(34, 26); g.lineTo(52, 12); g.quadraticCurveTo(58, 20, 50, 30); g.lineTo(42, 34); g.closePath(); g.fill(); g.fillStyle = wood; g.fillRect(16, 50, 8, 8); }
    else if (kind === 'rod') { handle(g, 12, 56, 50, 8, 4, wood); g.strokeStyle = '#e8e8f0'; g.lineWidth = 1; g.beginPath(); g.moveTo(50, 8); g.quadraticCurveTo(54, 30, 44, 44); g.stroke(); g.fillStyle = metal; g.beginPath(); g.arc(22, 44, 5, 0, 6.3); g.fill(); g.fillStyle = '#c8334a'; g.beginPath(); g.arc(44, 46, 3, 0, 6.3); g.fill(); }
    else if (kind === 'bow') { g.strokeStyle = wood; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, 8); g.quadraticCurveTo(54, 32, 18, 56); g.stroke(); g.strokeStyle = '#e8e8f0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(18, 8); g.lineTo(18, 56); g.stroke(); g.strokeStyle = metal; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 32); g.lineTo(44, 32); g.stroke(); }
    else if (kind === 'arrow') { handle(g, 14, 52, 48, 16, 3, '#c9b48a'); g.fillStyle = metal; g.beginPath(); g.moveTo(50, 14); g.lineTo(40, 16); g.lineTo(48, 24); g.closePath(); g.fill(); g.fillStyle = '#e8e8f0'; g.beginPath(); g.moveTo(14, 52); g.lineTo(22, 50); g.lineTo(18, 44); g.closePath(); g.fill(); }
  }
  function egg(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.ellipse(32, 36, 17, 22, 0, 0, 6.3); g.fill(); g.fillStyle = css(c, 1.3); g.beginPath(); g.ellipse(26, 26, 5, 8, -0.4, 0, 6.3); g.fill(); g.fillStyle = css(c, 0.6); for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(22 + hash(i, 9) * 20, 24 + hash(i, 10) * 26, 2 + hash(i, 11) * 2, 0, 6.3); g.fill(); } }
  function leaf(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(12, 52); g.quadraticCurveTo(12, 14, 52, 12); g.quadraticCurveTo(50, 50, 12, 52); g.fill(); g.strokeStyle = css(c, 0.6); g.lineWidth = 1.5; g.beginPath(); g.moveTo(14, 50); g.lineTo(46, 18); g.stroke(); }
  function berries(g, col) { const c = rgb(col); g.strokeStyle = '#3f8a33'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 12); g.lineTo(30, 30); g.stroke(); for (const [x, y] of [[24, 36], [40, 34], [32, 46], [22, 48], [42, 48]]) { g.fillStyle = css(c); g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(x - 3, y - 3, 2.5, 0, 6.3); g.fill(); } }
  function worm(g, col) { const c = rgb(col); g.strokeStyle = css(c, 0.8); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(14, 40); g.quadraticCurveTo(24, 20, 34, 36); g.quadraticCurveTo(44, 52, 52, 30); g.stroke(); g.fillStyle = css(c, 1.4); for (const [x, y] of [[22, 30], [34, 36], [46, 38]]) { g.beginPath(); g.arc(x, y, 3, 0, 6.3); g.fill(); } g.fillStyle = '#222'; g.beginPath(); g.arc(52, 29, 1.5, 0, 6.3); g.fill(); }
  function ingot(g, col) { const c = rgb(col); g.fillStyle = css(c, 0.75); g.beginPath(); g.moveTo(12, 44); g.lineTo(20, 30); g.lineTo(52, 30); g.lineTo(44, 44); g.closePath(); g.fill(); g.fillStyle = css(c); g.beginPath(); g.moveTo(20, 30); g.lineTo(28, 20); g.lineTo(56, 20); g.lineTo(52, 30); g.closePath(); g.fill(); g.fillStyle = css(c, 1.25); g.fillRect(14, 44, 30, 8); }
  function cage(g, col) { const c = rgb(col); g.strokeStyle = css(c); g.lineWidth = 2.5; g.strokeRect(14, 14, 36, 36); g.beginPath(); g.moveTo(32, 14); g.lineTo(32, 50); g.moveTo(14, 32); g.lineTo(50, 32); g.stroke(); g.fillStyle = css(c, 1.4); g.globalAlpha = 0.35; g.fillRect(14, 14, 36, 36); g.globalAlpha = 1; }
  function charm(g, col) { const c = rgb(col); g.strokeStyle = '#b89a5a'; g.lineWidth = 3; g.beginPath(); g.arc(32, 22, 12, 0.6, 2.54, true); g.stroke(); gem(g, col); g.fillStyle = css(c, 1.4); g.beginPath(); g.arc(28, 28, 3, 0, 6.3); g.fill(); }
  function fang(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(20, 10); g.quadraticCurveTo(44, 14, 46, 54); g.quadraticCurveTo(26, 34, 20, 10); g.fill(); g.fillStyle = css(c, 1.4); g.beginPath(); g.moveTo(24, 14); g.quadraticCurveTo(34, 20, 36, 34); g.quadraticCurveTo(28, 24, 24, 14); g.fill(); }
  function vest(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(16, 14); g.lineTo(26, 10); g.quadraticCurveTo(32, 18, 38, 10); g.lineTo(48, 14); g.lineTo(52, 30); g.lineTo(46, 32); g.lineTo(46, 54); g.lineTo(18, 54); g.lineTo(18, 32); g.lineTo(12, 30); g.closePath(); g.fill(); g.fillStyle = css(c, 0.7); for (let i = 0; i < 3; i++) g.fillRect(22, 30 + i * 8, 20, 3); }
  function bread(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.ellipse(32, 36, 22, 14, 0, 0, 6.3); g.fill(); g.fillStyle = css(c, 1.25); g.beginPath(); g.ellipse(28, 30, 12, 6, -0.3, 0, 6.3); g.fill(); g.strokeStyle = css(c, 0.6); g.lineWidth = 2; for (const x of [22, 32, 42]) { g.beginPath(); g.moveTo(x - 3, 28); g.lineTo(x + 3, 36); g.stroke(); } }
  function map(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(12, 14); g.lineTo(52, 10); g.lineTo(50, 52); g.lineTo(14, 54); g.closePath(); g.fill(); g.strokeStyle = 'rgba(80,40,20,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(18, 40); g.quadraticCurveTo(30, 20, 46, 30); g.stroke(); g.fillStyle = '#c0303a'; g.beginPath(); g.moveTo(42, 24); g.lineTo(48, 30); g.moveTo(48, 24); g.lineTo(42, 30); g.strokeStyle = '#c0303a'; g.lineWidth = 2; g.stroke(); }
  function feather(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(14, 54); g.quadraticCurveTo(14, 20, 50, 10); g.quadraticCurveTo(52, 40, 14, 54); g.fill(); g.strokeStyle = css(c, 0.6); g.lineWidth = 1.5; g.beginPath(); g.moveTo(14, 54); g.lineTo(48, 12); g.stroke(); }
  function wings(g, col) { const c = rgb(col); for (const s of [-1, 1]) { g.fillStyle = css(c); g.beginPath(); g.moveTo(32, 36); g.quadraticCurveTo(32 + s * 10, 10, 32 + s * 28, 14); g.quadraticCurveTo(32 + s * 24, 30, 32 + s * 8, 44); g.closePath(); g.fill(); } g.fillStyle = css(c, 0.7); g.beginPath(); g.ellipse(32, 38, 4, 8, 0, 0, 6.3); g.fill(); }
  function suit(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.arc(32, 20, 11, 0, 6.3); g.fill(); g.fillStyle = css(c, 0.5); g.beginPath(); g.ellipse(32, 20, 7, 6, 0, 0, 6.3); g.fill(); g.fillStyle = css(c); g.fillRect(16, 30, 32, 24); g.fillRect(10, 32, 8, 14); g.fillRect(46, 32, 8, 14); }
  function coral(g, col) { const c = rgb(col); g.strokeStyle = css(c); g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(32, 54); g.lineTo(32, 30); g.moveTo(32, 40); g.lineTo(18, 24); g.moveTo(32, 36); g.lineTo(46, 20); g.moveTo(18, 24); g.lineTo(14, 14); g.moveTo(46, 20); g.lineTo(50, 10); g.moveTo(32, 30); g.lineTo(34, 14); g.stroke(); }
  function pearl(g, col) { const c = rgb(col); g.fillStyle = '#6a7a8a'; g.beginPath(); g.ellipse(32, 44, 22, 10, 0, 0, 3.15); g.fill(); g.fillStyle = css(c); g.beginPath(); g.arc(32, 32, 11, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(28, 28, 3.5, 0, 6.3); g.fill(); }
  function ship(g, col) { const c = rgb(col); g.fillStyle = css(c, 0.9); g.beginPath(); g.moveTo(10, 36); g.quadraticCurveTo(32, 10, 54, 36); g.quadraticCurveTo(32, 46, 10, 36); g.fill(); g.fillStyle = css(c, 1.3); g.beginPath(); g.ellipse(32, 28, 8, 5, 0, 0, 6.3); g.fill(); g.fillStyle = '#ff8a3a'; g.beginPath(); g.moveTo(26, 42); g.lineTo(32, 56); g.lineTo(38, 42); g.fill(); }
  function cloth(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(12, 16); g.lineTo(52, 12); g.lineTo(50, 50); g.lineTo(14, 54); g.closePath(); g.fill(); g.fillStyle = '#f0e0a0'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16 + i * 9, 32); g.lineTo(20 + i * 9, 24); g.lineTo(24 + i * 9, 32); g.closePath(); g.fill(); } g.fillStyle = '#2a4a8a'; g.fillRect(14, 40, 34, 4); }
  function kit(g, col) { const c = rgb(col); g.fillStyle = '#8a6a3c'; g.fillRect(12, 22, 40, 32); g.fillStyle = '#6a4a2c'; g.fillRect(12, 22, 40, 6); g.fillStyle = css(c); g.fillRect(26, 18, 12, 14); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 3; i++) g.fillRect(14, 32 + i * 7, 36, 2); }
  function glider(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(8, 30); g.quadraticCurveTo(32, 10, 56, 30); g.lineTo(32, 26); g.closePath(); g.fill(); g.strokeStyle = '#5a4a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 26); g.lineTo(32, 48); g.moveTo(22, 48); g.lineTo(42, 48); g.stroke(); }
  function sword(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(44, 8); g.lineTo(52, 16); g.lineTo(26, 42); g.lineTo(18, 34); g.closePath(); g.fill(); g.fillStyle = css(c, 1.4); g.beginPath(); g.moveTo(44, 8); g.lineTo(48, 12); g.lineTo(22, 38); g.lineTo(18, 34); g.closePath(); g.fill(); handle(g, 14, 38, 30, 54, 5, '#b89a5a'); handle(g, 18, 46, 10, 54, 5, '#5a3a1a'); g.fillStyle = '#b89a5a'; g.beginPath(); g.arc(10, 54, 3.5, 0, 6.3); g.fill(); }
  function battleaxe(g, col) { const c = rgb(col); handle(g, 14, 56, 46, 14, 5, '#6a4a2a'); g.fillStyle = css(c); g.beginPath(); g.moveTo(40, 20); g.quadraticCurveTo(58, 8, 60, 30); g.quadraticCurveTo(50, 28, 44, 34); g.closePath(); g.fill(); g.beginPath(); g.moveTo(32, 12); g.quadraticCurveTo(22, 2, 10, 16); g.quadraticCurveTo(24, 20, 30, 24); g.closePath(); g.fill(); g.fillStyle = css(c, 0.6); g.fillRect(34, 14, 8, 10); }
  function shield(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(14, 12); g.lineTo(50, 12); g.lineTo(50, 34); g.quadraticCurveTo(50, 50, 32, 56); g.quadraticCurveTo(14, 50, 14, 34); g.closePath(); g.fill(); g.fillStyle = css(c, 0.7); g.beginPath(); g.moveTo(32, 14); g.lineTo(32, 54); g.lineTo(48, 34); g.lineTo(48, 14); g.closePath(); g.fill(); g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(32, 30, 5, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 12); g.lineTo(50, 12); g.lineTo(50, 34); g.quadraticCurveTo(50, 50, 32, 56); g.quadraticCurveTo(14, 50, 14, 34); g.closePath(); g.stroke(); }
  function helm(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.arc(32, 32, 18, Math.PI, 0); g.lineTo(50, 46); g.lineTo(14, 46); g.closePath(); g.fill(); g.fillStyle = css(c, 0.55); g.fillRect(18, 36, 28, 5); g.fillStyle = css(c, 1.3); g.fillRect(29, 14, 6, 32); g.fillStyle = css(c, 0.8); g.fillRect(20, 46, 24, 6); }
  function chestplate(g, col) { const c = rgb(col); g.fillStyle = css(c); g.beginPath(); g.moveTo(14, 12); g.lineTo(26, 10); g.quadraticCurveTo(32, 18, 38, 10); g.lineTo(50, 12); g.lineTo(54, 30); g.lineTo(48, 32); g.lineTo(44, 54); g.lineTo(20, 54); g.lineTo(16, 32); g.lineTo(10, 30); g.closePath(); g.fill(); g.fillStyle = css(c, 1.3); g.beginPath(); g.moveTo(24, 20); g.quadraticCurveTo(32, 26, 40, 20); g.lineTo(40, 30); g.quadraticCurveTo(32, 36, 24, 30); g.closePath(); g.fill(); g.fillStyle = css(c, 0.6); g.fillRect(20, 44, 24, 3); }
  function greaves(g, col) { const c = rgb(col); for (const x of [16, 36]) { g.fillStyle = css(c); g.fillRect(x, 10, 12, 44); g.fillStyle = css(c, 1.3); g.fillRect(x + 2, 12, 3, 38); g.fillStyle = css(c, 0.6); g.fillRect(x, 30, 12, 3); } }
  function boots(g, col) { const c = rgb(col); for (const [x, m] of [[10, 1], [34, 0.85]]) { g.fillStyle = css(c, m); g.fillRect(x + 4, 14, 12, 26); g.beginPath(); g.moveTo(x + 4, 40); g.lineTo(x + 16, 40); g.lineTo(x + 22, 52); g.lineTo(x + 4, 52); g.closePath(); g.fill(); g.fillStyle = css(c, 0.55); g.fillRect(x + 4, 50, 18, 4); g.fillStyle = css(c, 1.3); g.fillRect(x + 6, 16, 3, 22); } }
  function spear(g, col) { const c = rgb(col); handle(g, 10, 56, 48, 18, 4, '#8a5a2c'); g.fillStyle = css(c); g.beginPath(); g.moveTo(56, 8); g.lineTo(46, 12); g.lineTo(52, 20); g.closePath(); g.fill(); g.fillStyle = '#e0302a'; g.fillRect(40, 20, 6, 8); }
  function parcel(g, col) { const c = rgb(col); g.fillStyle = css(c); g.fillRect(14, 20, 36, 30); g.fillStyle = css(c, 1.2); g.fillRect(14, 20, 36, 8); g.strokeStyle = '#8a3a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 20); g.lineTo(32, 50); g.moveTo(14, 36); g.lineTo(50, 36); g.stroke(); }
  function cube4(g, col) { const c = rgb(col); g.fillStyle = css(c); g.fillRect(14, 14, 36, 36); g.fillStyle = css(c, 1.3); g.fillRect(14, 14, 36, 8); g.fillStyle = css(c, 0.7); g.fillRect(42, 14, 8, 36); }
  // ---- which picture an item gets ----
  function paint(g, key, item) {
    const col = item.col || '#888';
    if (key === 'torch') { g.fillStyle = '#5a4020'; g.beginPath(); g.moveTo(28, 56); g.lineTo(36, 56); g.lineTo(35, 26); g.lineTo(29, 26); g.closePath(); g.fill(); g.fillStyle = '#3a2a18'; g.fillRect(27, 24, 10, 6); g.fillStyle = '#ffb030'; g.beginPath(); g.ellipse(32, 16, 8, 11, 0, 0, 6.3); g.fill(); g.fillStyle = '#fff2b0'; g.beginPath(); g.ellipse(32, 19, 3.5, 6, 0, 0, 6.3); g.fill(); return; }
    if (item.block != null && item.block !== B.STATUE) { cube(g, item.block, rgb(col)); return; }
    if (item.kit) { kit(g, col); return; }
    if (key.startsWith('pick')) { tool(g, 'pick', col); return; }
    if (key === 'hatchet' || key.startsWith('axe')) { tool(g, 'axe', col); return; }
    if (key === 'shovel') { tool(g, 'shovel', col); return; }
    if (key.startsWith('sw_')) { sword(g, col); return; }
    if (key.startsWith('ax_')) { battleaxe(g, col); return; }
    if (key.startsWith('sh_')) { shield(g, col); return; }
    if (key.startsWith('sp_')) { spear(g, col); return; }
    if (item.armour === 'helm') { helm(g, col); return; }
    if (item.armour === 'chest') { chestplate(g, col); return; }
    if (item.armour === 'legs') { greaves(g, col); return; }
    if (item.armour === 'boots') { boots(g, col); return; }
    if (key === 'parcel') { parcel(g, col); return; }
    if (key.startsWith('rod') || key === 'reel') { tool(g, 'rod', col); return; }
    if (key === 'bow') { tool(g, 'bow', col); return; }
    if (key.startsWith('arrow')) { tool(g, 'arrow', col); return; }
    if (key.startsWith('tonic') || key === 'broth' || key === 'draught' || key === 'smoothie') { bottle(g, col); return; }
    if (key.startsWith('bait')) { berries(g, col); return; }
    if (key.startsWith('egg')) { egg(g, col); return; }
    if (key === 'frond') { leaf(g, col); return; }
    if (key === 'berry') { berries(g, col); return; }
    if (key === 'glowworm') { worm(g, col); return; }
    if (key === 'copper' || key === 'iron' || key === 'tycho') { ingot(g, col); return; }
    if (key.startsWith('snare')) { cage(g, col); return; }
    if (item.kinGear === 'weapon') { fang(g, col); return; }
    if (item.kinGear === 'armor') { vest(g, col); return; }
    if (item.kinGear === 'charm' || key.startsWith('amulet')) { charm(g, col); return; }
    if (key === 'bread') { bread(g, col); return; }
    if (key.startsWith('map') || key === 'deepchart') { map(g, col); return; }
    if (key === 'feather') { feather(g, col); return; }
    if (key === 'wings') { wings(g, col); return; }
    if (key === 'spacesuit' || key === 'lavasuit' || key === 'frostcloak' || key === 'bulb' || key === 'reeffins') { suit(g, col); return; }
    if (key === 'coral' || key === 'coralcrown') { coral(g, col); return; }
    if (key === 'pearl') { pearl(g, col); return; }
    if (key === 'ship') { ship(g, col); return; }
    if (key.startsWith('painted')) { cloth(g, col); return; }
    if (key === 'glider') { glider(g, col); return; }
    if (key === 'ember' || key === 'void' || key === 'gold' || key === 'diamond' || key === 'amber' || key === 'sulfur' || key === 'selenite' || key === 'ringshard' || key === 'starsalt') { gem(g, col); return; }
    lump(g, col);
  }
  function url(key, item) {
    if (cache.has(key)) return cache.get(key);
    const it = item || (typeof ITEMS !== 'undefined' && ITEMS[key]) || { col: '#888' };
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S; const g = cv.getContext('2d');
    g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 3; g.shadowOffsetY = 2; try { paint(g, key, it); } catch (e) { lump(g, it.col || '#888'); } g.restore();
    const u = cv.toDataURL(); if (!item) cache.set(key, u); return u;
  }
  // the CSS for an .ico element: the picture over a soft dark plate
  function style(key, item) { return `background-image:url(${url(key, item)});background-size:contain;background-repeat:no-repeat;background-position:center;background-color:rgba(0,0,0,0.28)`; }
  function swatch(col) { return `background:${col}`; }
  return { url, style, swatch };
})();
