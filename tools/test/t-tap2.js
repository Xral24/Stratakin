const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  const pos = async (sel, i = 0) => ev(([sel, i]) => { const r = document.querySelectorAll(sel)[i].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, [sel, i]);
  const say = () => ev(() => document.querySelector('#gamebox .gb-say').textContent.slice(0, 60));
  let p = await pos('#hb-ld'); await page.touchscreen.tap(p[0], p[1]); await page.waitForTimeout(6000);
  console.log('start', await say());
  for (const i of [0, 0, 5]) { p = await pos('#gamebox .ld-pk[data-k]', i); await page.touchscreen.tap(p[0], p[1]); await page.waitForTimeout(2500); console.log('tap kin', i, await say()); }
  p = await pos('#gamebox .gb-foot .btn.big'); await page.touchscreen.tap(p[0], p[1]); await page.waitForTimeout(5000);
  console.log('started', await ev(() => !!(Linkdown.state && Linkdown.state.me)));
  await page.screenshot({ path: '/home/claude/scratch/u1.png', timeout: 90000 });
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
