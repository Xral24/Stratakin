const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await page.waitForTimeout(1500);
  for (const w of ['moon', 'halo']) {
    await page.evaluate(() => { const b = document.getElementById('s-new'); if (b) b.click(); }); await page.waitForTimeout(600);
    if (w === 'moon') await page.screenshot({ path: '/home/claude/scratch/start-jump.png' });
    console.log(w, JSON.stringify(await page.evaluate((w) => { const b = document.querySelector('[data-jump="' + w + '"]'), n = document.querySelectorAll('.starter:not(.story):not(.jump)').length; if (!b) return 'no button'; b.click(); return { starters: n }; }, w)));
    for (let i = 0; i < 25; i++) { await page.waitForTimeout(2000); if (await ev(() => G.worldId !== "earth")) break; } await page.waitForTimeout(1500);
    console.log(' ', JSON.stringify(await ev(() => ({ world: G.worldId, kin: G.kin.length, lv: G.kin[0].level, tut: !document.getElementById('tutorial').classList.contains('hidden'), start: !document.getElementById('start').classList.contains('hidden'), cine: Cine.active(), name: G.gameName }))));
    if (w === 'moon') { await ev(() => { Cine.stop(); G.save(); }); await page.reload(); await page.waitForTimeout(2500); } }
  console.log('ERRORS:', h.errors.slice(0, 4).join(' | ') || 'none'); await h.close(); })();
