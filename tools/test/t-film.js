// The opening film must never be a gate: in this browser (no H.264) it cannot play, and the game has to start all the same with nothing left on screen.
const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await page.waitForTimeout(12000);
  const s = await ev(() => ({ film: Film.playing, box: (document.getElementById('film') || {}).style ? document.getElementById('film').style.display : 'none', cls: document.body.classList.contains('film-on'), player: !!G.player }));
  console.log(JSON.stringify(s)); console.log(!s.film && s.box !== 'block' && !s.cls && s.player ? 'PASS' : 'FAIL'); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
