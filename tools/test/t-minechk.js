const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-1'); await h.calm();
  console.log(await ev(() => { G.explain = () => {}; const s = Campaign.sites().mine, w = G.world, p = G.player; p.x = s.x + 0.5; p.z = s.z + 6.5; w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 3, 9999); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 2; for (let i = 0; i < 6; i++) Campaign.update(1, p);
    const bt = s.bottom; let walk = true; for (let dx = -14; dx <= 14; dx++) for (let y = bt; y <= bt + 1; y++) if (BLOCKS[w.getBlock(s.x + dx, y, s.z)].solid && Math.abs(dx) < 14) walk = false;
    const cnt = {}; for (let dx = -16; dx <= 16; dx++) for (let dz = -5; dz <= 5; dz++) for (let y = bt - 1; y <= bt + 4; y++) { const n = BLOCKS[w.getBlock(s.x + dx, y, s.z + dz)].name; cnt[n] = (cnt[n] || 0) + 1; }
    let ladder = true; for (let y = bt; y <= s.y0; y++) if (w.getBlock(s.x, y, s.z + 1) !== B.LADDER) ladder = false;
    return 'walkEndToEnd=' + walk + ' ladderWhole=' + ladder + ' chest=' + (w.getBlock(s.x + 7, bt, s.z + 2) === B.CHEST) + ' ' + JSON.stringify(cnt); }));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
