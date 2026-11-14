const { open } = require('./harness');
(async () => { const h = await open(); const { page, ev } = h; await h.newGame('gal-1'); await h.calm();
  const r = await ev(() => { const p = G.player, w = G.world, v = Village.def; p.x = v.x + 3.5; p.z = v.z + 3.5; w.ensureAround(Math.floor(p.x / CH), Math.floor(p.z / CH), 3, 9999); for (let i = 0; i < 3; i++) Village.update(0.5, p, false); const a = Village.active; p.y = (a ? a.y : 60) + 1;
    const find = () => { for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let dy = -2; dy <= 3; dy++) if (w.getBlock(a.x + dx, a.y + dy, a.z + dz) === B.FUSION) return [dx, dy, dz]; return null; };
    const at = find(); if (!at) return { err: 'no table', y: a && a.y }; w.setBlock(a.x + at[0], a.y + at[1], a.z + at[2], B.AIR); p.add('fusion', 1); a._tableOk = false; const gone = find(); for (let i = 0; i < 2; i++) Village.update(0.5, p, false);
    return { at, gone, back: find(), bag: p.count('fusion'), hard: BLOCKS[B.FUSION].hard, recipe: (typeof RECIPES !== 'undefined' ? RECIPES : []).some(r => r.out === 'fusion') }; });
  console.log(JSON.stringify(r), 'ERRORS:', h.errors.length ? h.errors.slice(0, 3).join('\n') : 'none'); await h.close(); })();
