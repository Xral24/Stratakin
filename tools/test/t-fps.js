// rough cost of a frame and of meshing, to compare builds: ROOT picks the build
const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame(process.env.SEED || 'look-3'); await h.calm();
  await ev(() => { G.repelUntil = performance.now() + 9e7; G.thirdPerson = true; G.world.time = 0.42; });
  await page.waitForTimeout(2500);
  const mesh = await ev(() => { const w = G.world, p = G.player; const chunks = [...w.chunks.values()].filter(c => Math.abs(c.cx * 16 + 8 - p.x) < 40 && Math.abs(c.cz * 16 + 8 - p.z) < 40); let t0 = performance.now(), tris = 0; for (const c of chunks) { R.buildChunk(w, c); tris += (c.mesh && c.mesh.op ? c.mesh.op.tris : 0); } const dt = performance.now() - t0; return { chunks: chunks.length, perChunkMs: +(dt / chunks.length).toFixed(1), trisPerChunk: Math.round(tris / chunks.length) }; });
  const frame = async () => await ev(() => { const gl = R.gl; const px = new Uint8Array(4); let t = performance.now(); const t0 = t; const N = 8; const loop0 = G.loop; let raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; try { for (let i = 0; i < N; i++) { t += 16.7; G.loop(t); } gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } finally { window.requestAnimationFrame = raf; raf((tt) => G.loop(tt)); } return { msPerFrame: +((performance.now() - t0) / N).toFixed(1) }; });
  const still = await frame();
  // and looking at the nearest wood, where leaves fill the view
  await ev(() => { const p = G.player, w = G.world; let best = null; for (let r = 10; r < 120 && !best; r += 6) for (let a = 0; a < 6.283; a += 0.3) { const x = Math.round(p.x + Math.cos(a) * r), z = Math.round(p.z + Math.sin(a) * r); const i = w.colInfo(x, z); if (i.biome === BIOME.FOREST && i.h > SEA + 2) { best = [x, z, i.h]; break; } } if (best) { p.frozen = true; p.x = best[0] + 0.5; p.z = best[1] + 0.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 4, 9999); p.y = best[2] + 1.02; p.pitch = 0.25; if (G.orbit) G.orbit.pitch = 0.25; G.meshPass(999); } });
  await page.waitForTimeout(3000); const wood = await frame();
  console.log(JSON.stringify({ mesh, still, wood })); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 2).join('\n') : 'none'); await h.close(); })();
