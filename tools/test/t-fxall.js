// Every element's painted attack in a real battle, stopped part-way so it can be looked at: one picture in flight and one on the hit for each, and whether its sounds came.
const { open } = require('./harness');
const ELS = (process.argv[2] || 'Flame,Tide,Bloom,Stone,Gale,Frost,Spark,Light,Void').split(',');
const AT = { Flame: [0.3, 0.62], Tide: [0.35, 0.8], Bloom: [0.35, 0.78], Stone: [0.5, 0.95], Gale: [0.24, 0.75], Frost: [0.25, 0.62], Spark: [0.4, 0.55], Light: [0.42, 0.6], Void: [0.4, 0.8] };
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(2500); await ev((els) => { for (const e of els) Battle.fxTest(e, 'spec', false); }, ELS);
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(700); if (await ev((els) => els.every(e => Battle.artReady(e)) && UI.sample('fx_void_hit', 0, 0), ELS)) break; }
  console.log(new Date().toISOString().slice(14,19), 'ready', JSON.stringify(await ev((els) => els.map(e => [e, Battle.artReady(e), UI.sample('fx_' + e.toLowerCase() + '_cast', 0, 0), UI.sample('fx_' + e.toLowerCase() + '_hit', 0, 0)]), ELS)));
  await ev(() => { document.querySelector('#battle, .battle') && (document.querySelectorAll('.bcard, .battle-ui, #battle-ui').forEach(x => x.style.opacity = 0)); });
  for (const el of ELS) for (let j = 0; j < 2; j++) { const s = await ev(([el, t]) => { Battle.fxAt(el, t); return { n: (Battle.fxSprites() || []).map(x => x.name + ':' + Math.floor(x.frame)), snd: Battle.fxSound }; }, [el, AT[el][j]]);
    await page.waitForTimeout(3500); try { await page.screenshot({ path: `/home/claude/scratch/fxall-${el}-${j}.png`, clip: { x: 300, y: 0, width: 544, height: 250 }, timeout: 60000 }); } catch (e) { console.log('shot failed', e.message.slice(0, 60), JSON.stringify(h.errors).slice(0, 600), JSON.stringify(h.logs.slice(-5)).slice(0, 600)); } console.log(new Date().toISOString().slice(14,19), el, j ? 'hit' : 'cast', JSON.stringify(s)); }
  await ev(() => Battle.fxAt(null));
  console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
