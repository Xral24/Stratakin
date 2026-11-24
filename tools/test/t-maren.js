const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h;
  await page.click('#s-new'); await page.fill('#s-seed', 'gal-1'); await page.waitForTimeout(150); await page.click('.starter[data-story]'); await page.waitForTimeout(3000);
  await ev(() => { const b = document.getElementById('tut-ok'); if (b) b.click(); }); await page.waitForTimeout(6000);
  console.log(JSON.stringify(await ev(() => { const m = First.maren; return { dlg: Dialogue.active(), talk: G.talkNpc === m, bones: m && m.model ? m.model.bones.map((b, i) => b ? i + ':' + b.kind : null).filter(Boolean) : null }; })));
  await page.screenshot({ path: '/home/claude/scratch/maren.png' }); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
