const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1'); await h.calm();
  const r = await h.ev(() => { const v = Village.active; if (!v) return 'no village'; for (const n of v.npcs) { n.hidden = false; if (n.role !== "keeper" && n.role !== "voodoo") { n.wander = true; n.wait = 0; if (!n.home) n.home = { x: n.x, z: n.z }; } } const ppl = v.npcs.filter(n => !n.hidden); const start = ppl.map(n => [n.x, n.z]); let minD = 9, close = 0, frames = 0;
    for (let i = 0; i < 1200; i++) { Village.update(0.05, G.player, false); frames++; if (i > 200) for (let a = 0; a < ppl.length; a++) for (let b = a + 1; b < ppl.length; b++) { const d = Math.hypot(ppl[a].x - ppl[b].x, ppl[a].z - ppl[b].z); if (d < minD) minD = d; if (d < 0.6) close++; } }
    const moved = ppl.map((n, i) => +Math.hypot(n.x - start[i][0], n.z - start[i][1]).toFixed(1)); return { n: ppl.length, wanderers: ppl.filter(n => n.wander !== false).length, minD: +minD.toFixed(2), close, moved: moved.join(',') }; });
  console.log(JSON.stringify(r)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
