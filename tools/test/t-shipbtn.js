const { open } = require('./harness');
(async () => {
  const h = await open(); const { page, ev } = h;
  await ev(() => localStorage.setItem('stratakin-minimap', '1')); await page.reload(); await page.waitForTimeout(400);
  await h.newGame('ship-btn');
  await ev(() => { G.player.add('ship', 1); G.repelUntil = performance.now() + 9e5; });
  await page.waitForTimeout(1500); await page.screenshot({ path: 'shipbtn.png', timeout: 150000 });
  await ev(() => document.getElementById('btn-ship').click()); await page.waitForTimeout(1500); await page.screenshot({ path: 'shipbtn-fly.png', timeout: 150000 });
  console.log(await ev(() => G.player.flying));
  console.log('ERRORS:', h.errors.length ? h.errors.join('\n') : 'none');
  await h.close();
})().catch(e => { console.error(e); process.exit(1); });
