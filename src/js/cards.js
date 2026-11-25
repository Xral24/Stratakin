'use strict';
/* Kin cards: every Kin you hold can be drawn as a trading card. The creature is its own 3D model, posed and lit, standing in front of a painted scene
   for its element or home; the great ones (legendaries, tyrants, bosses) have a painting of their own instead. The frame says how rare it is. */
const Cards = (() => {
  const W = 750, H = 1050;
  const FRAME = [ // by rarity: outer, inner, text on the bars
    { name: 'Common', a: '#5a6472', b: '#3a414b', ink: '#f2f4f7', line: '#8b95a3' },
    { name: 'Uncommon', a: '#3f7d5a', b: '#284f3a', ink: '#f2fbf5', line: '#7fc49b' },
    { name: 'Rare', a: '#c9d2dc', b: '#7c8896', ink: '#1b2430', line: '#ffffff' },
    { name: 'Epic', a: '#7a4fc4', b: '#432a73', ink: '#f6f0ff', line: '#c9a8ff' },
    { name: 'Legendary', a: '#e8b84a', b: '#8a5a12', ink: '#2a1a04', line: '#fff0b8' },
  ];
  const ELEM_COL = { Flame: '#ff6a2a', Tide: '#2f8fe6', Bloom: '#4fbf4a', Stone: '#a0865a', Spark: '#f2c81e', Frost: '#7fd6f0', Gale: '#9fe0c0', Shade: '#6a4fa0', Glow: '#ffe08a' };
  /* the painted scenes, by key; any not loaded yet fall back to a soft gradient in the element's colour */
  const BG = { lost: 'assets/card_bg_lost.jpg', meadow: 'assets/card_bg_meadow.jpg' };
  const OWN = { x_rex: 'assets/card_x_rex.jpg' };
  const imgs = {};
  function img(file) { if (!file) return null; if (imgs[file]) return imgs[file].complete && imgs[file].naturalWidth ? imgs[file] : null; const im = new Image(); im.src = (window.STRATAKIN_ASSETS && window.STRATAKIN_ASSETS[file]) || file; imgs[file] = im; return null; }
  function preload(files) { return Promise.all(files.map(f => new Promise(res => { img(f); const im = imgs[f]; if (im.complete) res(); else { im.onload = im.onerror = () => res(); } }))); }

  function bgKey(k) { const sp = k.sp; if (sp.dino || sp.home === 'lost') return 'lost'; return 'meadow'; }
  function ownArt(k) { const id = (typeof KIN !== 'undefined' && KIN.nativeId) ? (k.sigId || k.sp.sigId || KIN.nativeId(k.sp)) : null; return id && OWN[id] ? OWN[id] : null; }

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function cover(c, im, x, y, w, h) { const s = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; c.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); }
  function wrap(c, text, x, y, maxW, lh, maxLines) { const words = String(text).split(' '); let line = '', n = 0; for (let i = 0; i < words.length; i++) { const t = line ? line + ' ' + words[i] : words[i]; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y + n * lh); n++; line = words[i]; if (n >= maxLines) return; } else line = t; } if (line && n < maxLines) c.fillText(line, x, y + n * lh); }

  /* ---- the materials: everything is drawn, nothing is a picture, so a card stays sharp and every one is a little different ---- */
  const METAL = [ // by rarity: stops for the plate, the trim, the ink engraved into it
    { name: 'Common', stops: ['#4b5058', '#9aa1aa', '#5d636c', '#c3c9d0', '#50565e'], trim: '#d7dce2', ink: '#1a1d22', glow: null },          // brushed pewter
    { name: 'Uncommon', stops: ['#5a3a1c', '#c08a52', '#7a4e26', '#e0b07a', '#5e3c1c'], trim: '#f3cf9e', ink: '#2a1608', glow: null },        // bronze
    { name: 'Rare', stops: ['#7d8794', '#eef2f6', '#a3adb8', '#ffffff', '#8792a0'], trim: '#ffffff', ink: '#1b2430', glow: '#cfe8ff' },        // polished silver
    { name: 'Epic', stops: ['#2a1450', '#6a3fb0', '#3a1d6c', '#9b74e0', '#2c1652'], trim: '#e2d2ff', ink: '#f6f0ff', glow: '#b48cff' },        // violet enamel
    { name: 'Legendary', stops: ['#7a4c0a', '#f7d77a', '#a8701a', '#fff2b8', '#83530c'], trim: '#fff6d0', ink: '#2a1a04', glow: '#ffd36a' },   // gold
  ];
  const PAPER = { Flame: '#f3dcc4', Tide: '#d6e6f2', Bloom: '#dcebd0', Stone: '#e6dccb', Spark: '#f4ebc4', Frost: '#e2f0f6', Gale: '#dff0e6', Shade: '#ddd4ea', Glow: '#f6efd2' };
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a ^= a << 13; a >>>= 0; a ^= a >> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; }; }
  function metal(c, x, y, w, h, M, r, ang = 0.35) { // a metal plate: banded light, fine brushing, and a bevel
    const g = c.createLinearGradient(x, y, x + w * Math.cos(ang) + h * Math.sin(ang), y + h);
    M.stops.forEach((col, i) => g.addColorStop(i / (M.stops.length - 1), col)); c.fillStyle = g; c.fill();
    c.save(); c.clip(); const R = rng(Math.floor(x * 7 + y * 13 + w));
    for (let yy = y; yy < y + h; yy += 1.5) { c.globalAlpha = 0.04 + R() * 0.08; c.fillStyle = R() < 0.5 ? '#ffffff' : '#000000'; c.fillRect(x, yy, w, 0.8 + R()); }
    c.globalAlpha = 1; c.restore();
  }
  function bevel(c, x, y, w, h, r, lw, light, dark) { c.lineWidth = lw; const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, light); g.addColorStop(0.5, 'rgba(255,255,255,0.15)'); g.addColorStop(1, dark); c.strokeStyle = g; rr(c, x + lw / 2, y + lw / 2, w - lw, h - lw, r); c.stroke(); }
  function paper(c, x, y, w, h, col, seed) { c.fillStyle = col; c.fill(); c.save(); c.clip(); const R = rng(seed); for (let i = 0; i < w * h / 140; i++) { c.globalAlpha = 0.05 + R() * 0.07; c.fillStyle = R() < 0.6 ? '#6a5a40' : '#ffffff'; c.fillRect(x + R() * w, y + R() * h, 1 + R() * 1.6, 1 + R() * 1.6); } c.globalAlpha = 1; const ig = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75); ig.addColorStop(0, 'rgba(0,0,0,0)'); ig.addColorStop(1, 'rgba(60,40,10,0.22)'); c.fillStyle = ig; c.fillRect(x, y, w, h); c.restore(); }
  function engrave(c, text, x, y, M) { c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillText(text, x + 1, y + 1.5); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillText(text, x - 0.5, y - 1); c.fillStyle = M.ink; c.fillText(text, x, y); }
  function filigree(c, cx, cy, s, sx, sy, col) { // a little scroll in a corner
    c.save(); c.translate(cx, cy); c.scale(sx, sy); c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, s); c.quadraticCurveTo(0, 0, s, 0); c.stroke();
    c.beginPath(); c.moveTo(s * 0.25, s * 0.95); c.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.95, s * 0.25); c.stroke();
    c.beginPath(); c.arc(s * 0.42, s * 0.42, s * 0.12, 0, Math.PI * 2); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(s, 0, 2.6, 0, Math.PI * 2); c.arc(0, s, 2.6, 0, Math.PI * 2); c.fill(); c.restore(); }
  /* the element's mark, drawn: a flame, a drop, a leaf and so on */
  function glyph(c, e, x, y, r) { c.save(); c.translate(x, y); c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = r * 0.16; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
    if (e === 'Flame') { c.moveTo(0, r * 0.6); c.bezierCurveTo(-r * 0.6, r * 0.5, -r * 0.5, -r * 0.1, 0, -r * 0.7); c.bezierCurveTo(r * 0.1, -r * 0.2, r * 0.6, -r * 0.1, r * 0.45, r * 0.25); c.bezierCurveTo(r * 0.4, r * 0.5, r * 0.2, r * 0.6, 0, r * 0.6); c.fill(); }
    else if (e === 'Tide' || e === 'Frost' && false) { c.moveTo(0, -r * 0.7); c.bezierCurveTo(r * 0.55, -r * 0.05, r * 0.5, r * 0.6, 0, r * 0.6); c.bezierCurveTo(-r * 0.5, r * 0.6, -r * 0.55, -r * 0.05, 0, -r * 0.7); c.fill(); }
    else if (e === 'Bloom') { c.moveTo(-r * 0.5, r * 0.55); c.bezierCurveTo(-r * 0.6, -r * 0.3, r * 0.2, -r * 0.7, r * 0.6, -r * 0.6); c.bezierCurveTo(r * 0.6, 0, r * 0.1, r * 0.5, -r * 0.5, r * 0.55); c.fill(); }
    else if (e === 'Stone') { c.moveTo(-r * 0.6, r * 0.45); c.lineTo(-r * 0.35, -r * 0.4); c.lineTo(r * 0.2, -r * 0.6); c.lineTo(r * 0.6, -r * 0.05); c.lineTo(r * 0.4, r * 0.5); c.closePath(); c.fill(); }
    else if (e === 'Spark') { c.moveTo(r * 0.15, -r * 0.7); c.lineTo(-r * 0.4, r * 0.08); c.lineTo(0, r * 0.08); c.lineTo(-r * 0.15, r * 0.7); c.lineTo(r * 0.42, -r * 0.1); c.lineTo(0, -r * 0.1); c.closePath(); c.fill(); }
    else if (e === 'Frost') { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; c.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65); c.lineTo(-Math.cos(a) * r * 0.65, -Math.sin(a) * r * 0.65); } c.stroke(); }
    else if (e === 'Gale') { c.moveTo(-r * 0.6, -r * 0.2); c.bezierCurveTo(0, -r * 0.2, r * 0.5, -r * 0.3, r * 0.3, -r * 0.55); c.moveTo(-r * 0.6, r * 0.1); c.lineTo(r * 0.5, r * 0.1); c.moveTo(-r * 0.4, r * 0.4); c.bezierCurveTo(0, r * 0.4, r * 0.4, r * 0.5, r * 0.2, r * 0.7); c.stroke(); }
    else if (e === 'Shade') { c.arc(0, 0, r * 0.6, Math.PI * 0.3, Math.PI * 1.7); c.bezierCurveTo(-r * 0.1, -r * 0.3, -r * 0.1, r * 0.3, Math.cos(Math.PI * 0.3) * r * 0.6, Math.sin(Math.PI * 0.3) * r * 0.6); c.fill(); }
    else { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? 0.3 : 0.7; c.lineTo(Math.cos(a) * r * q, Math.sin(a) * r * q); } c.closePath(); c.fill(); }
    c.restore(); }
  function medal(c, e, x, y, r) { const col = ELEM_COL[e] || '#888'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, col); g.addColorStop(1, '#1a1a1a'); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); glyph(c, e, x, y, r * 0.8); }
  /* holo: a rainbow that runs in bands across the surface, fine lines through it, and glitter. tilt (0 to 1) moves the bands: in the game it follows the phone */
  function holoFoil(c, x, y, w, h, seed, tilt, strength) {
    c.save(); c.globalCompositeOperation = 'color-dodge'; c.globalAlpha = 0.55 * strength;
    const off = tilt * w * 1.6; const g = c.createLinearGradient(x - w + off, y, x + off + w * 0.6, y + h);
    const cols = ['#ff3d7f', '#ffb03d', '#f9ff3d', '#3dff8e', '#3dd5ff', '#6a3dff', '#ff3dd5', '#ff3d7f'];
    for (let k = 0; k < 3; k++) cols.forEach((col, i) => g.addColorStop(Math.min(1, (k * cols.length + i) / (3 * cols.length - 1)), col));
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.18 * strength; c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    for (let d = -h; d < w; d += 6) { c.beginPath(); c.moveTo(x + d, y + h); c.lineTo(x + d + h * 0.6, y); c.stroke(); }
    c.globalCompositeOperation = 'screen'; const R = rng(seed);
    for (let i = 0; i < w * h / 900 * strength; i++) { const sx = x + R() * w, sy = y + R() * h, s = 0.8 + R() * 2.6; c.globalAlpha = 0.35 + R() * 0.6; c.fillStyle = R() < 0.5 ? '#ffffff' : cols[Math.floor(R() * cols.length)]; c.beginPath(); c.moveTo(sx, sy - s * 2); c.lineTo(sx + s * 0.5, sy); c.lineTo(sx, sy + s * 2); c.lineTo(sx - s * 0.5, sy); c.closePath(); c.moveTo(sx - s * 2, sy); c.lineTo(sx, sy + s * 0.5); c.lineTo(sx + s * 2, sy); c.lineTo(sx, sy - s * 0.5); c.closePath(); c.fill(); }
    c.restore(); }
  const MARK = ['●', '◆', '★', '★★', '★★★'];
  /* a printing, as on real cards the same creature comes in several: how its name is printed, and what the art is printed on. Rolled when it is caught, and nothing to do with how rare the Kin itself is */
  const FINISH = {
    normal: { name: '', foil: null, art: null },
    rare: { name: 'Rare', foil: 'silver', art: null },
    super: { name: 'Super Rare', foil: null, art: 'holo' },
    ultra: { name: 'Ultra Rare', foil: 'gold', art: 'holo' },
    secret: { name: 'Secret Rare', foil: 'prism', art: 'secret' },
  };
  const FOIL = { silver: ['#6d7680', '#f4f7fa', '#9aa3ad', '#ffffff', '#7a838e', '#e6ebf0'], gold: ['#7a4c08', '#ffe9a0', '#b07a1c', '#fff6cc', '#8a5a0e', '#f2c95a'], prism: ['#c9d6e6', '#ffffff', '#d8c9f2', '#ffffff', '#c6ecdf', '#ffffff'] };
  /* text printed in foil: a metal that changes along the letters, a bright glint where the light catches, a thin dark edge so it reads on any plate */
  function foilText(c, text, x, y, font, kind, tilt, seed) {
    c.font = font; const m = c.measureText(text), w = Math.ceil(m.width) + 8, h = 80, oc = document.createElement('canvas'); oc.width = w; oc.height = h; const o = oc.getContext('2d');
    o.font = font; o.textBaseline = 'middle'; o.fillStyle = '#000'; o.fillText(text, 4, h / 2);
    o.globalCompositeOperation = 'source-in'; const g = o.createLinearGradient(-tilt * 160, 0, w + 80 - tilt * 160, h * 0.6); FOIL[kind].forEach((col, i) => g.addColorStop(i / (FOIL[kind].length - 1), col)); o.fillStyle = g; o.fillRect(0, 0, w, h);
    if (kind === 'prism') { o.globalCompositeOperation = 'color'; const pg = o.createLinearGradient(-tilt * 200, 0, w * 1.2, h); ['#ff7aa8', '#ffd97a', '#8affc0', '#7ad8ff', '#c79aff', '#ff7aa8'].forEach((col, i) => pg.addColorStop(i / 5, col)); o.globalAlpha = 0.55; o.fillStyle = pg; o.fillRect(0, 0, w, h); o.globalAlpha = 1; }
    o.globalCompositeOperation = 'source-atop'; const gx = (0.15 + tilt * 0.7) * w, gl = o.createLinearGradient(gx - 40, 0, gx + 40, h); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); o.fillStyle = gl; o.fillRect(0, 0, w, h); // the glint
    const R = rng(seed); for (let i = 0; i < w / 6; i++) { o.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.7) + ')'; o.fillRect(R() * w, R() * h, 1.4, 1.4); } // grain of the foil
    o.globalCompositeOperation = 'destination-in'; o.globalAlpha = 1; o.fillStyle = '#000'; o.fillText(text, 4, h / 2); // nothing outside the letters
    c.save(); c.fillStyle = 'rgba(0,0,0,0.65)'; c.textBaseline = 'middle'; c.fillText(text, x + 1.5, y + 2); c.restore(); // its edge
    c.drawImage(oc, x - 4, y - h / 2);
  }
  /* secret rare: the art printed on a fine prismatic weave that sparkles in rows */
  function secretFoil(c, x, y, w, h, seed, tilt) {
    c.save(); c.globalCompositeOperation = 'color-dodge'; const off = tilt * w;
    const g = c.createLinearGradient(x - off, y + h, x + w * 1.4 - off, y); ['#ff8ab0', '#ffe08a', '#a0ffc8', '#8ad8ff', '#c8a0ff', '#ff8ab0', '#ffe08a'].forEach((col, i) => g.addColorStop(i / 6, col));
    c.globalAlpha = 0.28; c.strokeStyle = g; c.lineWidth = 1.2;
    for (let d = -h; d < w + h; d += 4) { c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d - h, y + h); c.stroke(); c.beginPath(); c.moveTo(x + d - h, y); c.lineTo(x + d, y + h); c.stroke(); }
    c.globalCompositeOperation = 'screen'; const R = rng(seed);
    for (let i = 0; i < 260; i++) { const t = R(), sx = x + R() * w, sy = y + ((t * h + (sx - x) * 0.5) % h), a = 0.25 + 0.6 * Math.max(0, Math.sin((sx - x) / w * 6 + tilt * 6)); c.globalAlpha = a; c.fillStyle = '#fff'; c.fillRect(sx, sy, 2, 2); c.fillRect(sx - 3, sy + 0.5, 8, 1); c.fillRect(sx + 0.5, sy - 3, 1, 8); }
    c.restore(); }
  /* the scene at the hour it was caught: the same painting, by day, at dusk or by night */
  function grade(c, x, y, w, h, time, seed) {
    if (time === 'dusk') { c.save(); c.globalCompositeOperation = 'multiply'; const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffc49a'); g.addColorStop(0.6, '#f2a8b8'); g.addColorStop(1, '#a890c0'); c.fillStyle = g; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.25; const s = c.createRadialGradient(x + w * 0.75, y + h * 0.35, 5, x + w * 0.75, y + h * 0.35, w * 0.5); s.addColorStop(0, '#ffd08a'); s.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = s; c.fillRect(x, y, w, h); c.restore(); }
    else if (time === 'night') { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#2a3a7a'; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#6a7ab0'; c.fillRect(x, y, w, h); c.globalCompositeOperation = 'screen'; const R = rng(seed); for (let i = 0; i < 90; i++) { c.globalAlpha = 0.3 + R() * 0.7; c.fillStyle = '#fff'; const sx = x + R() * w, sy = y + R() * h * 0.45, r = R() * 1.6 + 0.4; c.beginPath(); c.arc(sx, sy, r, 0, 6.3); c.fill(); }
      c.globalAlpha = 0.9; const mx = x + w * 0.22, my = y + h * 0.16, mg = c.createRadialGradient(mx, my, 4, mx, my, 70); mg.addColorStop(0, 'rgba(230,240,255,0.9)'); mg.addColorStop(0.25, 'rgba(200,215,255,0.35)'); mg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = mg; c.fillRect(x, y, w, h); c.fillStyle = '#eef3ff'; c.beginPath(); c.arc(mx, my, 16, 0, 6.3); c.fill(); c.restore(); }
  }

  /* eight digits printed in the corner, as on a real card: the same for every card of one kind of Kin, so a code is enough to tell which it is */
  function passcode(k) { let h = (k.sp.seed >>> 0) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; return 10000000 + (h % 90000000); }
  /* draws the card for Kin k onto canvas cv (750 x 1050). opts.where: a line saying where it was caught. opts.tilt: where the holo shine sits, 0 to 1 */
  function draw(cv, k, opts = {}) {
    cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const rar = U.clamp(k.sp.rarity || 0, 0, 4), M = METAL[rar], fin = FINISH[opts.finish || k.finish || (k.holo ? 'ultra' : 'normal')] || FINISH.normal, holo = !!fin.art, shiny = !!k.shiny, tilt = opts.tilt != null ? opts.tilt : 0.45, time = opts.time || k.time || 'day';
    const seed = (k.id || 1) >>> 0;
    const elems = k.sp.elem.map((w, i) => ({ e: KIN.E[i], w })).filter(x => x.w > 0.12).sort((a, b) => b.w - a.w).slice(0, 2);
    const e0 = elems[0] ? elems[0].e : 'Stone', ec = ELEM_COL[e0] || '#888';
    const SERIF = 'Georgia, "Times New Roman", serif', SANS = 'system-ui, "Segoe UI", Roboto, sans-serif';
    // the plate
    rr(c, 0, 0, W, H, 34); metal(c, 0, 0, W, H, M, 34);
    if (rar >= 1) { c.save(); rr(c, 0, 0, W, H, 34); c.clip(); c.globalAlpha = 0.07; c.strokeStyle = M.ink; c.lineWidth = 1; for (let d = -H; d < W + H; d += 9) { c.beginPath(); c.moveTo(d, 0); c.lineTo(d - H * 0.5, H); c.stroke(); } c.restore(); } // engraved cross-hatch on all but commons
    bevel(c, 0, 0, W, H, 34, 6, 'rgba(255,255,255,0.75)', 'rgba(0,0,0,0.55)');
    rr(c, 18, 18, W - 36, H - 36, 22); c.lineWidth = 2; c.strokeStyle = M.trim; c.stroke();
    // corner scrolls
    filigree(c, 30, 30, 34, 1, 1, M.trim); filigree(c, W - 30, 30, 34, -1, 1, M.trim); filigree(c, 30, H - 30, 34, 1, -1, M.trim); filigree(c, W - 30, H - 30, 34, -1, -1, M.trim);
    // name plate
    rr(c, 44, 36, W - 88, 80, 14); metal(c, 44, 36, W - 88, 80, M, 14, -0.6); bevel(c, 44, 36, W - 88, 80, 14, 3, 'rgba(255,255,255,0.8)', 'rgba(0,0,0,0.5)');
    c.textBaseline = 'middle'; c.textAlign = 'left'; const nm = KIN.name(k).replace('✦ ', ''), nf = `700 46px ${SERIF}`; c.font = nf; if (fin.foil) foilText(c, nm, 70, 78, nf, fin.foil, tilt, seed + 5); else engrave(c, nm, 70, 78, M);
    
    c.textAlign = 'right'; c.font = `700 22px ${SANS}`; engrave(c, 'LV', W - 150, 80, M); c.font = `800 40px ${SERIF}`; engrave(c, String(k.level), W - 132 + 66, 80, M);
    // the art, in a dark recess
    const ax = 58, ay = 132, aw = W - 116, ah = 500;
    rr(c, ax - 8, ay - 8, aw + 16, ah + 16, 12); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fill(); bevel(c, ax - 8, ay - 8, aw + 16, ah + 16, 12, 4, 'rgba(0,0,0,0.6)', 'rgba(255,255,255,0.6)');
    c.save(); rr(c, ax, ay, aw, ah, 6); c.clip();
    const own = ownArt(k), oim = own && img(own);
    if (oim) { const s = Math.max(aw / oim.naturalWidth, ah / oim.naturalHeight), iw = oim.naturalWidth * s, ih = oim.naturalHeight * s; c.drawImage(oim, ax + (aw - iw) * (opts.fx != null ? opts.fx : 0.7), ay, iw, ih); } // own paintings keep their top: the head is up there
    else {
      const bim = img(BG[bgKey(k)]);
      if (bim) { cover(c, bim, ax, ay, aw, ah); grade(c, ax, ay, aw, ah, time, seed); } else { const bg = c.createRadialGradient(W / 2, ay + ah * 0.6, 40, W / 2, ay + ah * 0.5, aw); bg.addColorStop(0, ec); bg.addColorStop(1, '#0c1016'); c.fillStyle = bg; c.fillRect(ax, ay, aw, ah); }
      const fog = c.createLinearGradient(0, ay, 0, ay + ah); fog.addColorStop(0, 'rgba(255,255,255,0)'); fog.addColorStop(0.55, 'rgba(255,255,255,0.12)'); fog.addColorStop(1, 'rgba(0,0,0,0.25)'); c.fillStyle = fog; c.fillRect(ax, ay, aw, ah); // a little air between the scene and the Kin
      const sh = c.createRadialGradient(W / 2, ay + ah * 0.88, 10, W / 2, ay + ah * 0.88, aw * 0.4); sh.addColorStop(0, 'rgba(0,0,0,0.5)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sh; c.fillRect(ax, ay + ah * 0.68, aw, ah * 0.32);
      const pc = document.createElement('canvas'), m = KIN.model(k.sp, k.stage);
      const mesh = R.entityMesh('card:' + KIN.meshKey(k.sp, k.stage), (mb) => KIN.buildMesh(mb, m));
      if (R.renderPortrait(pc, mesh, m, 320, opts.yaw != null ? { yaw: opts.yaw, pitch: -0.1 } : {})) { // a rim of the element's light round the Kin, then the Kin
        const S = ah * 1.06, px = ax + (aw - S) / 2, py = ay - ah * 0.01; c.save(); c.shadowColor = ec; c.shadowBlur = 28; c.drawImage(pc, px, py, S, S); c.restore(); c.drawImage(pc, px, py, S, S); }
    }
    if (fin.art === 'holo') holoFoil(c, ax, ay, aw, ah, seed, tilt, oim ? 0.32 : 0.4); /* light on a painting, or it drowns the colours */ else if (fin.art === 'secret') secretFoil(c, ax, ay, aw, ah, seed, tilt);
    const vg = c.createRadialGradient(W / 2, ay + ah / 2, ah * 0.4, W / 2, ay + ah / 2, ah * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.3)'); c.fillStyle = vg; c.fillRect(ax, ay, aw, ah);
    c.restore(); c.lineWidth = 2; c.strokeStyle = M.trim; rr(c, ax, ay, aw, ah, 6); c.stroke();
    // under the art, as on a real card: the edition on the left, the set code on the right
    c.font = `700 17px ${SERIF}`; c.textBaseline = 'middle'; const setCode = (k.sp.dino ? 'LW' : 'EA') + '-' + String(((k.sp.seed >>> 0) % 997) + 1).padStart(3, '0');
    if (opts.first || k.first) { c.textAlign = 'left'; engrave(c, '1st Edition', 62, ay + ah + 20, M); } c.textAlign = 'right'; engrave(c, setCode + (fin.name ? '  ' + fin.name : ''), W - 62, ay + ah + 20, M);
    // the type line: rarity in words and its mark, the element medallions
    const sy = ay + ah + 36; rr(c, 44, sy, W - 88, 52, 10); metal(c, 44, sy, W - 88, 52, M, 10, -0.6); bevel(c, 44, sy, W - 88, 52, 10, 2, 'rgba(255,255,255,0.7)', 'rgba(0,0,0,0.45)');
    c.textAlign = 'left'; c.font = `italic 700 26px ${SERIF}`; engrave(c, (shiny ? 'Shining ' : '') + M.name + '  ' + MARK[rar], 66, sy + 27, M);
    let mx = W - 82; for (const el of elems.slice().reverse()) { medal(c, el.e, mx, sy + 26, 22); mx -= 52; }
    // the text box: card stock in the colour of its element
    const ty = sy + 64, th = 200; rr(c, 44, ty, W - 88, th, 10); paper(c, 44, ty, W - 88, th, PAPER[e0] || '#eee', seed + 7); c.lineWidth = 2; c.strokeStyle = 'rgba(60,40,10,0.45)'; rr(c, 44, ty, W - 88, th, 10); c.stroke();
    const mv = KIN.moves(k), sig = mv.find(m => m.sig) || mv[mv.length - 1];
    if (sig) { c.textAlign = 'left'; c.fillStyle = '#2a1d0c'; c.font = `700 32px ${SERIF}`; c.fillText((sig.sig ? '✦ ' : '') + sig.name, 68, ty + 38); c.textAlign = 'right'; c.font = `800 34px ${SERIF}`; c.fillText(String(sig.power || ''), W - 68, ty + 38);
      c.strokeStyle = 'rgba(60,40,10,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(68, ty + 62); c.lineTo(W - 68, ty + 62); c.stroke();
      c.textAlign = 'left'; c.fillStyle = '#3d2f1a'; c.font = `italic 400 25px ${SERIF}`; wrap(c, sig.desc || '', 68, ty + 92, W - 136, 31, 2); }
    // stats along the bottom of the text box
    const st = KIN.stats(k), keys = [['HP', st.hp], ['ATK', st.atk], ['POW', st.pow], ['SPD', st.spd]], by = ty + th - 54;
    c.strokeStyle = 'rgba(60,40,10,0.35)'; c.beginPath(); c.moveTo(68, by - 8); c.lineTo(W - 68, by - 8); c.stroke();
    keys.forEach(([n, v], i) => { const bx = 68 + i * ((W - 136) / 4); c.textAlign = 'left'; c.fillStyle = '#6a5636'; c.font = `700 17px ${SANS}`; c.fillText(n, bx, by + 14); c.fillStyle = '#2a1d0c'; c.font = `800 28px ${SERIF}`; c.fillText(String(v != null ? v : '?'), bx, by + 40); });
    // where it came from, and the set line
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `italic 400 22px ${SERIF}`; engrave(c, opts.where || k.where || 'Caught in the wild', W / 2, H - 66, M);
    c.font = `700 14px ${SANS}`; c.textAlign = 'left'; engrave(c, String(passcode(k)), 62, H - 34, M); c.textAlign = 'right'; engrave(c, 'STRATAKIN', W - 62, H - 34, M);
    // the great ones are foil all over; holos also catch the light on the frame
    if (fin.art && rar >= 3 && fin.art === 'holo') { c.save(); rr(c, 0, 0, W, H, 34); c.clip(); c.beginPath(); c.rect(0, 0, W, H); rr(c, 44, ty, W - 88, th, 10); c.clip('evenodd'); holoFoil(c, 0, 0, W, H, seed + 11, tilt, 0.45); c.restore(); }
    // a sheen across the plate, as if lit from the top left
    c.save(); rr(c, 0, 0, W, H, 34); c.clip(); const gl = c.createLinearGradient(0, 0, W, H); gl.addColorStop(0, 'rgba(255,255,255,0.18)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,0.12)'); c.fillStyle = gl; c.fillRect(0, 0, W, H); c.restore();
    return cv;
  }
  return { W, H, draw, preload, BG, OWN, FINISH, passcode };
})();
