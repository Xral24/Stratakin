const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); await h.newGame('gal-1'); await h.calm();
  const png = await h.ev(() => { const v = Village.active; const e = v && v.elder; if (!e) return null; const S = 320; const cv0 = document.createElement('canvas'); cv0.width = S * 2; cv0.height = S; const ctx = cv0.getContext('2d'); ctx.fillStyle = '#7fb2d8'; ctx.fillRect(0, 0, S * 2, S);
    [-0.5, -1.57].forEach((yaw, i) => { const c = document.createElement('canvas'); R.renderPortrait(c, e.mesh, e.model, S, { yaw, pitch: -0.1, anim: { ph: 0, mv: 0, seed: 1, air: 0 } }); ctx.drawImage(c, i * S, 0, S, S); }); return cv0.toDataURL('image/png') + '|' + e.model.stoop; });
  if (!png) { console.log('no elder'); } else { const [d, st] = png.split('|'); fs.writeFileSync('/home/claude/elder.png', Buffer.from(d.split(',')[1], 'base64')); console.log('stoop', st); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
