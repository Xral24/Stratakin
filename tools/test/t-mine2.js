const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-1'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.explain = () => {}; G.world.time = 0.33; G.stats.buddyOff = true; });
  const chk = await ev(() => { const s = Campaign.sites().mine, w = G.world, p = G.player; p.x = s.x + 0.5; p.z = s.z + 6.5; w.ensureAround(Math.floor(s.x / CH), Math.floor(s.z / CH), 3, 9999); p.y = w.groundY(Math.floor(p.x), Math.floor(p.z)) + 2; for (let i = 0; i < 6; i++) Campaign.update(1, p);
    const y0 = s.y0, bt = s.bottom; let ladder = true; for (let y = bt; y <= y0; y++) if (w.getBlock(s.x, y, s.z + 1) !== B.LADDER) ladder = false; let shaft = true; for (let y = bt; y <= y0 + 3; y++) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 0; b++) if (BLOCKS[w.getBlock(s.x + a, y, s.z + b)].solid) shaft = false;
    return 'ladderWhole=' + ladder + ' shaftClear=' + shaft + ' look=' + !!Campaign.C().mineLook1 + ' y0=' + y0 + ' bottom=' + bt; });
  console.log(chk);
  for (const [nm, ox, oz, up, under, tx, tz] of [['mine-top', -9, 11, 5, false, -2, 0], ['mine-gal', 4, 0, 1.7, true, -9, -1], ['mine-drift', -8, 1, 1.7, true, -15, 0]]) {
    await ev(([ox, oz, up, under, tx, tz]) => { const s = Campaign.sites().mine, p = G.player, w = G.world; p.frozen = true; G.thirdPerson = false; const by = under ? s.bottom : s.y0; p.x = s.x + ox + 0.5; p.z = s.z + oz + 0.5; p.y = by + up; p.yaw = Math.atan2(-(s.x + tx - p.x), -(s.z + tz - p.z)); p.pitch = under ? -0.05 : -0.12; G.meshPass(999); document.getElementById('toasts').innerHTML = ''; }, [ox, oz, up, under, tx, tz]);
    await page.waitForTimeout(3000); await page.screenshot({ path: (process.env.OUT || '/home/claude/') + nm + '.png' }); }
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
