const { open } = require('./harness');
(async () => { const h = await open(); await h.newGame('gal-1'); await h.calm();
  const r = await h.ev(() => { const v = Village.active, w = G.world; if (!v) return 'no village'; let ft = null; for (let dx = -20; dx <= 20 && !ft; dx++) for (let dz = -20; dz <= 20 && !ft; dz++) for (let dy = 0; dy <= 4; dy++) if (w.getBlock(v.x + dx, v.y + dy, v.z + dz) === B.FUSION) { ft = [v.x + dx, v.y + dy, v.z + dz]; break; }
    const out = { ft: !!ft }; const [fx, fy, fz] = ft || [v.x + 3, v.y + 1, v.z + 3];
    // an old stone beside the table (placed before this fix): not recorded
    w.setBlock(fx + 1, fy, fz, B.STONE); out.oldStone = G.protectedAt({ x: fx + 1, y: fy, z: fz, id: B.STONE }) && 'blocked'; out.ground = (G.protectedAt({ x: fx + 1, y: fy - 1, z: fz, id: B.STONE }) || {}).kind; out.tableY = fy - v.y;
    // a town wall block nearby stays protected
    let wallHit = null; for (let d = 2; d < 30 && !wallHit; d++) { const id = w.getBlock(v.x + d, v.y + 1, v.z); if (id !== B.AIR && id !== B.STONE) wallHit = { x: v.x + d, y: v.y + 1, z: v.z, id }; } out.townBlock = wallHit ? (G.protectedAt(wallHit) || {}).kind : 'none found';
    // a plank placed now, far from the table but in town: recorded, so it can be taken back
    const px = v.x + 5, py = v.y + 1, pz = v.z - 5; const before = G.protectedAt({ x: px, y: py, z: pz, id: B.PLANKS }); w.setBlock(px, py, pz, B.PLANKS); G.ownBlock(px, py, pz, B.PLANKS); out.plankBefore = before && before.kind; out.plankAfter = G.protectedAt({ x: px, y: py, z: pz, id: B.PLANKS }) && 'blocked'; out.mine = Object.keys(G.stats.myBlocks || {}).length; return out; });
  console.log(JSON.stringify(r)); console.log('ERRORS:', h.errors.length ? h.errors.slice(0, 2).join('\n') : 'none'); await h.close(); })();
