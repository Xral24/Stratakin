// Recorded music: the world's track comes in over the generated mood, a fight swaps it for the battle theme (the boss theme against a tyrant),
// the walk-about track picks up where it left off, a special place hands back to the generated mood, and the buffer fallback works too.
// Run with ROOT=/home/claude/strata-mt: this browser has no AAC, so that copy holds the same tracks as Opus.
const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await page.setViewportSize({ width: 844, height: 420 }); await h.newGame('gal-1'); await h.calm();
  await page.mouse.click(420, 200); const info = () => ev(() => ({ track: Music.track, info: Music.trackInfo, mood: Music.current, ctx: Music.state, states: Object.keys(Music.REC).map(k => k + ':' + Music.REC[k].state + ':' + Music.REC[k].mode) }));
  const until = async (fn, ms) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { v = await info(); if (fn(v)) return v; await page.waitForTimeout(400); } return v; };
  const out = [];
  console.log('start'); await ev(() => G.updateMusic(false)); let v = await until(x => x.track === 'earth' && x.info.vol > 0.8, 40000); out.push(['walking about', v.track, v.info && v.info.mode, v.info && +v.info.vol.toFixed(2), v.mood]);
  const t1 = v.info ? v.info.t : 0; await page.waitForTimeout(3000); v = await info(); out.push(['it is moving', v.info && v.info.t > t1 + 0.5]);
  await ev(() => { const p = G.player; const r = KIN.roster('earth', 0, 0, 'Surface', 'Plains', 0); const e = Wild.makeEntity(r[0], 3, p.x + 3, p.y, p.z + 3); Wild.list.push(e); window.__e = e; Battle.start(e, false); G.updateMusic(true); });
  v = await until(x => x.track === 'battle' && x.info.vol > 0.8, 40000); out.push(['a fight', v.track, v.info && v.info.mode]);
  await ev(() => { window.__e.isBoss = true; G.updateMusic(true); }); v = await until(x => x.track === 'boss' && x.info.vol > 0.8, 40000); out.push(['against a tyrant', v.track]);
  await ev(() => { window.__e.isBoss = false; if (Battle.abort) Battle.abort(); G.updateMusic(false); }); v = await until(x => x.track === 'earth' && x.info.vol > 0.8, 40000); out.push(['after it', v.track, 'resumed past the start', v.info && v.info.t > t1 + 1]);
  await ev(() => { G.updateMusic = () => {}; /* the game would put its own choice straight back */ Music.update('mines', null); }); v = await until(x => !x.track && x.mood === 'mines', 20000); out.push(['a special place', v.track, v.mood]);
  for (const [mood, want] of [['danger', 'chase'], ['jungle', 'jungle'], ['mines', 'under'], ['village', 'village'], ['night', 'night']]) { await ev(([m, k]) => Music.update(m, k), [mood, want]); const x = await until(y => y.track === want && y.info.vol > 0.8, 40000); out.push(['track ' + want, x.track === want]); console.log('track', want, x.track, x.info && x.info.mode, JSON.stringify(x.states).slice(0, 300)); }
  await ev(() => { Music.forceDecode = true; Music.update('moon', 'moon'); }); v = await until(x => x.track === 'moon' && x.info.mode === 'buffer' && x.info.vol > 0.8, 40000); out.push(['buffer fallback', v.track, v.info && v.info.mode, v.info && +v.info.vol.toFixed(2)]);
  await ev(() => Music.setEnabled(false)); await page.waitForTimeout(1500); v = await info(); out.push(['switched off', v.track, v.mood]); await ev(() => Music.setEnabled(true));
  for (const o of out) console.log(JSON.stringify(o)); console.log('states', JSON.stringify(v.states));
  const ok = out[0][1] === 'earth' && out[1][1] && out[2][1] === 'battle' && out[3][1] === 'boss' && out[4][1] === 'earth' && out[5][1] === null && out[5][2] === 'mines' && out.filter(o => /^track /.test(o[0])).every(o => o[1]) && out.find(o => o[0] === 'buffer fallback')[2] === 'buffer' && out[out.length - 1][1] === null;
  console.log(ok ? 'PASS' : 'FAIL'); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
