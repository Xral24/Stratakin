// The legendaries' signature attacks, each stopped twice in a real battle so they can be looked at, and whether its picture and sound arrive.
const { open } = require('./harness');
const AT = { l_core: [0.26, 0.6], l_sky: [0.4, 0.75], l_amber: [0.95, 1.4], lm_crater: [0.42, 0.75], lm_core: [0.3, 0.85], lm_sky: [0.36, 0.8], lh_core: [0.45, 0.75], lh_sky: [0.2, 0.6], lw_selenaut: [0.4, 0.7], lw_ring: [0.45, 0.8], x_mantle: [0.4, 0.75], x_rex: [0.3, 0.7], x_mosa: [0.55, 1.0] };
const IDS = (process.argv[2] || Object.keys(AT).join(',')).split(',');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); Battle.start(e, false); });
  await page.waitForTimeout(2500); await ev((ids) => { for (const id of ids) { Battle.sigArt(id); UI.preload(['sig_' + id]); } }, IDS);
  for (let i = 0; i < 80; i++) { await page.waitForTimeout(700); if (await ev((ids) => ids.every(id => Battle.sigReady(id) && UI.sample('sig_' + id, 0, 0)), IDS)) break; }
  console.log('ready', JSON.stringify(await ev((ids) => ids.map(id => [id, Battle.sigReady(id), UI.sample('sig_' + id, 0, 0)]), IDS)));
  for (const id of IDS) for (let j = 0; j < 2; j++) { const s = await ev(([id, t]) => { Battle.fxAt(id, t); return { n: (Battle.fxSprites() || []).map(x => x.name.replace('sig_' + id + '_', '') + ':' + Math.floor(x.frame)), snd: Battle.fxSound }; }, [id, AT[id][j]]);
    await page.waitForTimeout(2500); try { await page.screenshot({ path: `/home/claude/scratch/sig-${id}-${j}.png`, clip: { x: 300, y: 0, width: 544, height: 250 }, timeout: 90000 }); } catch (e) { console.log('shot failed', id, j); } console.log(id, j, JSON.stringify(s)); }
  await ev(() => Battle.fxAt(null)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
