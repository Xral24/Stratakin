// Fused Kin's signatures: the bundle (both pictures and the sound in one small file) arrives, and the attack shows, stopped in a real battle.
// node t-fsig.js f_e0,f_m16,f_h29   (ids; two shots each)
const { open } = require('./harness');
const IDS = (process.argv[2] || 'f_e0,f_m16,f_h29').split(',');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(2500); await ev((ids) => { for (const id of ids) Battle.sigArt(id); }, IDS);
  for (let i = 0; i < 80; i++) { await page.waitForTimeout(700); if (await ev((ids) => ids.every(id => Battle.sigReady(id) && UI.sample('sig_' + id, 0, 0)), IDS)) break; }
  console.log('ready', JSON.stringify(await ev((ids) => ids.map(id => [id, Battle.sigReady(id), UI.sample('sig_' + id, 0, 0)]), IDS)));
  for (const id of IDS) for (const [j, t] of [[0, 0.3], [1, 0.8]]) { const s = await ev(([id, t]) => { Battle.fxAt(id, t); return { n: (Battle.fxSprites() || []).map(x => x.name.replace('sig_' + id + '_', '') + ':' + Math.floor(x.frame)), snd: Battle.fxSound }; }, [id, t]);
    await page.waitForTimeout(2500); try { await page.screenshot({ path: `/home/claude/scratch/fsig-${id}-${j}.png`, clip: { x: 300, y: 0, width: 544, height: 250 }, timeout: 90000 }); } catch (e) { console.log('shot failed', id, j); } console.log(id, j, JSON.stringify(s)); }
  await ev(() => Battle.fxAt(null)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
