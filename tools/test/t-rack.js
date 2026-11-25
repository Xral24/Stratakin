const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await ev(() => { UI.openPanel('kin'); document.getElementById('k-rack').click(); }); await page.waitForTimeout(6000);
  await page.screenshot({ path: '/home/claude/scratch/rack.png' });
  await ev(() => document.querySelector('.cartslot').click()); await page.waitForTimeout(2500); await page.screenshot({ path: '/home/claude/scratch/rackview.png' });
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
