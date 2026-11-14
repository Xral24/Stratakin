const { open } = require('./harness'); const fs = require('fs');
(async () => { const h = await open(); const { ev } = h; await h.newGame('gal-1'); await h.calm();
  const png = await ev(() => { const S = 420, ids = ['ranger', 'miner', 'frontier', 'painted', 'knight', 'neon']; const cv0 = document.createElement('canvas'); cv0.width = S * 3; cv0.height = S * 3; const ctx = cv0.getContext('2d'); ctx.fillStyle = '#7fb2d8'; ctx.fillRect(0, 0, cv0.width, cv0.height);
    ids.forEach((id, i) => { const c = document.createElement('canvas'); Avatar.portrait(c, Avatar.SKINS.find(s => s.id === id), S); ctx.drawImage(c, (i % 3) * S, Math.floor(i / 3) * S, S, S); });
    const sk = Avatar.SKINS[0]; const sp = { shape: 'human', feat: {}, colors: sk.colors, size: 1, gen: 0, names: ['x'] }; const m = KIN.model(sp, 2);
    [[0, -0.1, 2.2, 0.75], [-1.5, -0.15, 2.2, 0.75], [3.14, -0.2, 1, 0]].forEach(([yaw, pitch, zoom, lift], i) => { const c = document.createElement('canvas'); R.renderPortrait(c, R.entityMesh('folk-test', (mb) => KIN.buildMesh(mb, m)), m, S, { yaw, pitch, zoom, lift }); ctx.drawImage(c, i * S, 2 * S, S, S); });
    return cv0.toDataURL('image/png'); });
  fs.writeFileSync('/home/claude/folk.png', Buffer.from(png.split(',')[1], 'base64')); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
