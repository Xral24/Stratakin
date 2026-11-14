const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-1'); await h.calm();
  console.log(await ev(() => { const p = G.player, w = G.world, out = []; G.explain = () => {}; Citadel.C().open = true; const nm = (x, y, z) => BLOCKS[w.getBlock(x, y, z)].name;
    const k = Sky.sites().find(s => s.id === 'stormspire'); p.x = k.x; p.z = k.z; p.y = k.y + 2; w.ensureAround(Math.floor(k.x / CH), Math.floor(k.z / CH), 3, 9999);
    let gate = true; for (let j = -14; j <= -11; j++) for (let d = -1; d <= 1; d++) for (let y = 1; y <= 3; y++) if (w.getBlock(k.x + d, k.y + y, k.z + j) !== B.AIR) gate = false;
    let yard = 0; for (let a = -10; a <= 10; a++) for (let b = -10; b <= 4; b++) for (let y = 1; y <= 3; y++) { const id = w.getBlock(k.x + a, k.y + y, k.z + b); if (BLOCKS[id].solid && !(Math.abs(a) <= 1 && b >= 3) && !(Math.abs(a) >= 9 && Math.abs(b) >= 9)) yard++; }
    out.push('stormspire gateOpen=' + gate + ' yardSolid=' + yard + ' spire=' + [10, 20, 26, 28, 29, 30, 31].map(d => d + ':' + nm(k.x, k.y + d, k.z + 8)).join(' ') + ' dais=' + nm(k.x, k.y + 2, k.z + 4));
    const c = Citadel.site(); p.x = c.x + 20; p.z = c.z; p.y = c.y + 2; for (let i = 0; i < 4; i++) Citadel.update(1, p);
    out.push('citadel dressed=' + !!Citadel.C().dressed + ' towerTop=' + nm(c.x + 86, c.y + 35, c.z) + ' gate=' + nm(c.x + 17, c.y + 2, c.z) + ' courtAir=' + nm(c.x + 26, c.y + 2, c.z) + ' target=' + nm(c.x + 71, c.y + 10, c.z) + ' throneAbove=' + nm(c.x + 83, c.y + 8, c.z)); return out.join('\n'); }));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
