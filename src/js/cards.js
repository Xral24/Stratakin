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

  /* draws the card for Kin k onto canvas cv (750 x 1050). opts.where: a line saying where it was caught */
  function draw(cv, k, opts = {}) {
    cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const rar = U.clamp(k.sp.rarity || 0, 0, 4), F = FRAME[rar], holo = !!(k.holo || opts.holo), shiny = !!k.shiny;
    const elems = k.sp.elem.map((w, i) => ({ e: KIN.E[i], w })).filter(x => x.w > 0.12).sort((a, b) => b.w - a.w).slice(0, 2);
    const ec = ELEM_COL[elems[0] ? elems[0].e : 'Stone'] || '#888';
    // outer frame
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, F.a); g.addColorStop(0.5, F.b); g.addColorStop(1, F.a);
    rr(c, 0, 0, W, H, 36); c.fillStyle = g; c.fill();
    rr(c, 22, 22, W - 44, H - 44, 24); c.fillStyle = '#12161c'; c.fill();
    c.lineWidth = 3; c.strokeStyle = F.line; rr(c, 22, 22, W - 44, H - 44, 24); c.stroke();
    // name bar
    rr(c, 40, 40, W - 80, 76, 16); c.fillStyle = F.a; c.fill();
    c.fillStyle = F.ink; c.font = '800 44px system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillText(KIN.name(k).replace('✦ ', ''), 62, 80);
    c.textAlign = 'right'; c.font = '700 30px system-ui, sans-serif'; c.fillText('Lv ' + k.level, W - 62, 80);
    // art window
    const ax = 52, ay = 130, aw = W - 104, ah = 500;
    c.save(); rr(c, ax, ay, aw, ah, 14); c.clip();
    const own = ownArt(k), oim = own && img(own);
    if (oim) cover(c, oim, ax, ay, aw, ah);
    else {
      const bim = img(BG[bgKey(k)]);
      if (bim) cover(c, bim, ax, ay, aw, ah); else { const bg = c.createRadialGradient(W / 2, ay + ah * 0.6, 40, W / 2, ay + ah * 0.5, aw); bg.addColorStop(0, ec); bg.addColorStop(1, '#0c1016'); c.fillStyle = bg; c.fillRect(ax, ay, aw, ah); }
      // a soft shadow on the ground, then the Kin itself
      const sh = c.createRadialGradient(W / 2, ay + ah * 0.9, 10, W / 2, ay + ah * 0.9, aw * 0.42); sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sh; c.fillRect(ax, ay + ah * 0.7, aw, ah * 0.3);
      const pc = document.createElement('canvas'), m = KIN.model(k.sp, k.stage);
      const mesh = R.entityMesh('card:' + KIN.meshKey(k.sp, k.stage) + (shiny ? ':s' : ''), (mb) => KIN.buildMesh(mb, m));
      if (R.renderPortrait(pc, mesh, m, 320, { yaw: opts.yaw != null ? opts.yaw : -2.35, pitch: -0.1 })) c.drawImage(pc, ax + (aw - ah * 1.08) / 2, ay - ah * 0.02, ah * 1.08, ah * 1.08);
    }
    const vg = c.createRadialGradient(W / 2, ay + ah / 2, ah * 0.35, W / 2, ay + ah / 2, ah * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = vg; c.fillRect(ax, ay, aw, ah);
    c.restore(); c.lineWidth = 4; c.strokeStyle = F.line; rr(c, ax, ay, aw, ah, 14); c.stroke();
    // rarity and element strip
    const sy = ay + ah + 14; rr(c, 40, sy, W - 80, 50, 12); c.fillStyle = F.b; c.fill();
    c.textAlign = 'left'; c.font = '800 26px system-ui, sans-serif'; c.fillStyle = F.line; c.fillText((shiny ? '✦ ' : '') + (holo ? 'HOLO ' : '') + F.name.toUpperCase(), 60, sy + 26);
    let ex = W - 60; c.font = '700 24px system-ui, sans-serif'; for (const el of elems.slice().reverse()) { const tw = c.measureText(el.e).width + 30; ex -= tw; rr(c, ex, sy + 9, tw, 32, 16); c.fillStyle = ELEM_COL[el.e] || '#888'; c.fill(); c.fillStyle = '#11151a'; c.textAlign = 'center'; c.fillText(el.e, ex + tw / 2, sy + 26); ex -= 8; }
    // the signature move, or its best move
    const mv = KIN.moves(k), sig = mv.find(m => m.sig) || mv[mv.length - 1];
    const my = sy + 66; rr(c, 40, my, W - 80, 170, 14); c.fillStyle = '#1b2129'; c.fill();
    if (sig) { c.textAlign = 'left'; c.fillStyle = sig.sig ? '#ffd36a' : '#e8ecf2'; c.font = '800 32px system-ui, sans-serif'; c.fillText((sig.sig ? '★ ' : '') + sig.name, 62, my + 36); c.textAlign = 'right'; c.fillStyle = '#e8ecf2'; c.fillText(String(sig.power || ''), W - 62, my + 36);
      c.textAlign = 'left'; c.fillStyle = '#aab4c2'; c.font = '400 25px system-ui, sans-serif'; wrap(c, sig.desc || '', 62, my + 82, W - 124, 32, 3); }
    // stats
    const st = KIN.stats(k), ty = my + 186; const keys = [['HP', st.hp], ['ATK', st.atk], ['POW', st.pow], ['SPD', st.spd]];
    keys.forEach(([n, v], i) => { const bx = 40 + i * ((W - 80) / 4), bw = (W - 80) / 4 - 10; rr(c, bx, ty, bw, 64, 12); c.fillStyle = '#1b2129'; c.fill(); c.textAlign = 'center'; c.fillStyle = '#8b95a3'; c.font = '700 18px system-ui, sans-serif'; c.fillText(n, bx + bw / 2, ty + 18); c.fillStyle = '#f2f4f7'; c.font = '800 28px system-ui, sans-serif'; c.fillText(String(v != null ? v : '?'), bx + bw / 2, ty + 44); });
    // where it came from
    c.textAlign = 'center'; c.fillStyle = '#c8d0da'; c.font = 'italic 400 23px system-ui, sans-serif'; c.fillText(opts.where || k.where || 'Caught in the wild', W / 2, H - 56);
    c.fillStyle = F.line; c.font = '700 16px system-ui, sans-serif'; c.fillText('STRATAKIN', W / 2, H - 30);
    // holo: a rainbow sheen across the whole card
    if (holo) { c.save(); rr(c, 0, 0, W, H, 36); c.clip(); c.globalCompositeOperation = 'overlay'; const hg = c.createLinearGradient(0, 0, W, H); ['#ff5a7a', '#ffd35a', '#5aff9a', '#5ad0ff', '#b05aff', '#ff5a7a'].forEach((col, i) => hg.addColorStop(i / 5, col)); c.globalAlpha = 0.45; c.fillStyle = hg; c.fillRect(0, 0, W, H); c.restore(); }
    return cv;
  }
  return { W, H, draw, preload, BG, OWN };
})();
