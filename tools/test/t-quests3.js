const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('look-3', 0); await h.calm();
  console.log(JSON.stringify(await ev(() => { R.render = () => {}; G.stats.villageFreed = true; G.questState.arcs = null; for (let i = 0; i < 30; i++) Quests.update(); document.getElementById('btn-quests') ? document.getElementById('btn-quests').click() : [...document.querySelectorAll('button')].find(b => /Quests/.test(b.textContent)).click(); const t = document.body.innerText; return { free: t.includes('The Free Land'), country: t.includes('The Country'), two: t.includes('Two of Them'), wood: t.includes('The Dark Wood') }; })));
  await ev(() => { R.render = () => {}; }); await page.screenshot({ path: '/home/claude/scratch/quests.png', timeout: 150000 });
  console.log('errors', JSON.stringify(h.errors.slice(0, 4))); await h.close(); })();
