const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  const r = await ev(() => { const p = G.player; G.repelUntil = performance.now() + 9e7; G.world.time = 0.75; const keys = Object.keys(Combat.GEAR || {}); const sw = keys.find(k => k.startsWith('sw_')), ax = keys.find(k => k.startsWith('ax_'));
    p.add(sw, 1); p.add(ax, 1); const i = p.hotbar().indexOf(sw); if (i >= 0) p.sel = i; p.pitch = -0.1; G.thirdPerson = false; return { sw, ax, sel: p.selected() }; });
  console.log('gear', JSON.stringify(r)); await page.waitForTimeout(1200);
  const shot = async (name, prog, third, axe) => { await ev(([prog, third, axe, keys]) => { const p = G.player; if (axe) { const i = p.hotbar().indexOf(keys.ax); if (i >= 0) p.sel = i; } G.thirdPerson = third; if (G.orbit) { G.orbit.yaw = p.yaw; G.orbit.pitch = -0.15; }
      p.swingKind = axe ? 'chop' : 'slash'; p.swingN = (p.swingN || 0) + 1; p.swingDur = 40; p.swingT = 40 * (1 - prog); }, [prog, third, axe, r]); await page.waitForTimeout(2600); await page.screenshot({ path: `/home/claude/scratch/slash-${name}.png`, timeout: 150000 }); };
  await shot('fp-mid', 0.45, false, false); await shot('tp-mid', 0.5, true, false); await shot('axe', 0.5, true, true); await shot('fp-late', 0.55, false, true);
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
