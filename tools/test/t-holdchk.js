const { open } = require('./harness');
(async () => { const h = await open(); const { ev } = h; await h.newGame('look-1'); await h.calm();
  console.log(await ev(() => { const p = G.player, w = G.world, out = []; G.explain = () => {}; for (const k of Keeps.sites().filter(k => !k.core).slice(0, 1).concat(Keeps.sites().filter(k => k.core))) { p.x = k.x + 0.5; p.z = k.z + 0.5; p.y = k.y + 2; w.ensureAround(Math.floor(k.x / CH), Math.floor(k.z / CH), 3, 9999); for (let i = 0; i < 4; i++) Keeps.update(1, p);
      let gate = true; for (let j = -11; j <= -8; j++) for (let d = -1; d <= 1; d++) for (let y = 1; y <= 3; y++) if (w.getBlock(k.x + d, k.y + y, k.z + j) !== B.AIR) gate = false;
      let yard = 0; for (let a = -7; a <= 7; a++) for (let b = -7; b <= 4; b++) for (let y = 1; y <= 3; y++) { const id = w.getBlock(k.x + a, k.y + y, k.z + b); if (id !== B.AIR && !(Math.abs(a) <= 1 && b >= 2 && b <= 4) && id !== B.IRONWALL) { yard++; out.push([a, y, b, BLOCKS[id].name].join(',')); } }
      let cell = 0; for (let a = 4; a <= 6; a++) for (let b = 4; b <= 6; b++) for (let y = 1; y <= 2; y++) if (BLOCKS[w.getBlock(k.x + a, k.y + y, k.z + b)].solid && w.getBlock(k.x + a, k.y + y, k.z + b) !== B.IRONWALL) cell++;
      out.push((k.core ? 'core' : 'hold') + ' gateOpen=' + gate + ' yardBlocks=' + yard + ' cellSolid=' + cell + ' table=' + (w.getBlock(k.x, k.y + 2, k.z + 3) === B.DARKTABLE)); } return out.join('\n'); }));
  console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
