const { open } = require('./harness');
(async () => { const h = await open(); const { ev, page } = h; await h.newGame('gal-1'); await h.calm();
  const r = await ev(() => { G.stats.threads = {}; const got = [Linkdown.gift('job', 1), Linkdown.gift('quest', 2), Linkdown.gift('stranger', 1)]; return { got, th: G.stats.threads, toast: [...document.querySelectorAll('.toast, #toasts > *')].map(e => e.textContent).slice(-1)[0] }; });
  console.log(JSON.stringify(r)); console.log('errors', JSON.stringify(h.errors)); await h.close(); })().catch(e => { console.log('ERR', e.message); process.exit(1); });
