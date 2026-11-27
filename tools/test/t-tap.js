const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  await page.setViewportSize({ width: 412, height: 780 });
  const bx = async (sel, i = 0) => ev(([sel, i]) => { const r = document.querySelectorAll(sel)[i].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.bottom]; }, [sel, i]);
  let p = await bx('#hb-ld'); await page.mouse.click(p[0], p[1]); await page.waitForTimeout(8000);
  p = await bx('#gamebox .ld-pk', 1); await page.mouse.click(p[0], p[1]); await page.waitForTimeout(3000);
  const s1 = await ev(() => [document.querySelectorAll('#gamebox .ld-pk')[1].className, document.querySelector('#gamebox .gb-say').textContent]);
  const go = await bx('#gamebox .gb-foot .btn.big'); console.log('picked?', JSON.stringify(s1), 'deal button y', go[1], 'of 780');
  
  await page.mouse.click(go[0], go[1]); await page.waitForTimeout(6000); { const k = await ev(() => { const S = Linkdown.state; const c = S.me.hand.find(c => c.type === 'kin'); const r = document.querySelector('[data-h="' + c.id + '"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); await page.mouse.click(k[0], k[1]); await page.waitForTimeout(2500); const b = await bx('#gamebox .gb-foot .btn', 0); await page.mouse.click(b[0], b[1]); await page.waitForTimeout(5000); }
  console.log('game started', await ev(() => !!(Linkdown.state && Linkdown.state.me)));
  await page.screenshot({ path: '/home/claude/scratch/q2.png', timeout: 90000 });
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
