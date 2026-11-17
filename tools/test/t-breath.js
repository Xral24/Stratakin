const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3'); await h.calm();
  const shot = async (name) => { await ev(() => { window.__r = R.render; R.render = () => {}; }); await page.waitForTimeout(1500); const n = await ev(() => { R.render = window.__r; return Breath.n; }); await page.waitForTimeout(9000); await page.screenshot({ path: `/home/claude/scratch/breath-${name}.png`, timeout: 150000 }); console.log(name, n); };
  await ev(() => { G.world.time = 0.4; Breath.test(0, true); G.player.pitch = -0.05; }); await shot('cold');
  if (process.env.RIDE) { await ev(() => { const p = G.player; p.mount = G.kin[0]; p.mountMode = 'land'; }); await shot('ride'); }
  console.log('ERRORS:', h.errors.slice(0, 3).join(' | ') || 'none'); await h.close(); })();
