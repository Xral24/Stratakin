'use strict';
// World hazards that are not Kin: the worms under the Moon's Mare, the stones Halo's ring drops. Both show themselves before they strike;
// the first hit takes half your health, so you learn to watch the ground and the sky.
const Hazards = (() => {
  let G = null, world = null;
  const worms = [], shards = [], fx = [];
  let wormTimer = 14, shardTimer = 20, warnedWorm = false, warnedShard = false;
  const WORM_SEG = 6;
  function init(game) { G = game; world = game.world; worms.length = 0; shards.length = 0; fx.length = 0; wormTimer = 12 + Math.random() * 8; shardTimer = 18 + Math.random() * 12; }
  const surfaceAt = (x, z) => world.groundY(Math.floor(x), Math.floor(z));
  function bigHit(p, cause, key) {
    const now = performance.now();
    const recent = G.hazardHit && now - G.hazardHit < 10000;
    const n = recent ? 2 : Math.ceil(p.maxHp / 2);
    G.hazardHit = now; p.damage(n, cause); p.hurtFlash = 0.8; UI.sfx('hit2');
    G.shake = 0.6;
  }
  function puff(x, y, z, n, col) { for (let i = 0; i < n; i++) fx.push({ x: x + (Math.random() - 0.5) * 1.6, y, z: z + (Math.random() - 0.5) * 1.6, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 3, t: 0, dur: 0.6 + Math.random() * 0.5, col, size: 0.12 + Math.random() * 0.14 }); }
  // sparks: a tight burst from a hit, bright and short, every way at once with a little lift
  function sparks(x, y, z, n, col, spread = 3.5) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, el = (Math.random() - 0.3) * 1.2; const sp = spread * (0.5 + Math.random()); fx.push({ x: x + (Math.random() - 0.5) * 0.2, y: y + (Math.random() - 0.5) * 0.2, z: z + (Math.random() - 0.5) * 0.2, vx: Math.cos(a) * Math.cos(el) * sp, vy: Math.sin(el) * sp + 1.5, vz: Math.sin(a) * Math.cos(el) * sp, t: 0, dur: 0.18 + Math.random() * 0.2, col, size: 0.06 + Math.random() * 0.06, emis: true }); } }

  // ---- the worms of the Mare ----
  function inMare(p) { if (!world.preset.worms) return false; const info = world.colInfo(Math.floor(p.x), Math.floor(p.z)); return info.biome === BIOME.MARE && p.y < info.h + 6 && p.y > info.h - 3; }
  function spawnWorm(p) {
    const a = Math.random() * Math.PI * 2, d = 16 + Math.random() * 10;
    const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
    worms.push({ x, z, y: surfaceAt(x, z) - 2, phase: 'tunnel', t: 0, life: 7 + Math.random() * 3, speed: 3.6, trail: [], hitAt: 0, passes: 0, yaw: 0 });
    if (!warnedWorm) { warnedWorm = true; UI.toast('The ground shakes. Something moves under the Mare: watch the dust, and move when it comes up.', 'bad'); }
    UI.sfx('rumble');
  }
  function updateWorms(dt, p) {
    const here = inMare(p);
    if (here && worms.length < 2) { wormTimer -= dt; if (wormTimer <= 0) { wormTimer = 14 + Math.random() * 12; spawnWorm(p); } }
    for (let i = worms.length - 1; i >= 0; i--) {
      const w = worms[i]; w.t += dt;
      if (w.phase === 'tunnel') {
        const dx = p.x - w.x, dz = p.z - w.z, d = Math.hypot(dx, dz) || 1;
        w.x += dx / d * w.speed * dt; w.z += dz / d * w.speed * dt; w.y = surfaceAt(w.x, w.z) - 1.5; w.yaw = Math.atan2(dx, dz);
        if ((G.frame & 3) === 0) puff(w.x, w.y + 1.6, w.z, 1, [0.5, 0.5, 0.55]);
        if (d < 4.5 || w.t > w.life) { // erupt: the leap is aimed at where you stand now, not where you will be
          w.phase = 'leap'; w.t = 0; w.sx = w.x; w.sz = w.z; w.sy = surfaceAt(w.x, w.z) + 1;
          const ux = dx / d, uz = dz / d; w.ex = p.x + ux * 7; w.ez = p.z + uz * 7; w.ey = surfaceAt(w.ex, w.ez) + 1; w.hit = false; w.trail = [];
          w.up = Math.max(0.15, Math.min(0.85, d / (d + 7))); w.py = p.y + 1.0; // the arc passes through where you stand, at chest height
          puff(w.x, w.sy, w.z, 14, [0.55, 0.55, 0.6]); UI.sfx('rumble'); G.shake = 0.35;
        }
      } else if (w.phase === 'leap') {
        const u = Math.min(1, w.t / 1.3);
        w.x = U.lerp(w.sx, w.ex, u); w.z = U.lerp(w.sz, w.ez, u);
        w.y = u <= w.up ? U.lerp(w.sy, w.py, u / w.up) + Math.sin(u / w.up * Math.PI) * 1.4 : U.lerp(w.py, w.ey, (u - w.up) / (1 - w.up)) + Math.sin((u - w.up) / (1 - w.up) * Math.PI) * 1.4;
        w.yaw = Math.atan2(w.ex - w.sx, w.ez - w.sz); w.pitch = Math.cos(u * Math.PI) * 0.9;
        w.trail.push([w.x, w.y, w.z]); if (w.trail.length > 24) w.trail.shift();
        if (!w.hit) { const hd = Math.hypot(p.x - w.x, p.z - w.z); if (hd < 2.2 && Math.abs((p.y + 0.9) - w.y) < 2.4) { w.hit = true; bigHit(p, 'worm'); } }
        if (u >= 1) { w.phase = 'dive'; w.t = 0; puff(w.x, w.y, w.z, 10, [0.55, 0.55, 0.6]); }
      } else if (w.phase === 'dive') {
        w.y -= 4 * dt;
        if (w.t > 0.8) { w.passes++; if (w.passes < 2 && here && Math.random() < 0.5) { w.phase = 'tunnel'; w.t = 0; w.life = 5 + Math.random() * 3; w.y = surfaceAt(w.x, w.z) - 1.5; } else worms.splice(i, 1); }
      }
      if (Math.hypot(p.x - w.x, p.z - w.z) > 70) worms.splice(i, 1);
    }
  }
  // ---- the stones the ring drops ----
  function underCover(p) { const top = world.topAt(Math.floor(p.x), Math.floor(p.z)); return p.y < top - 1; }
  function spawnShard(p) {
    const aimed = Math.random() < 0.6;
    const a = Math.random() * Math.PI * 2, d = aimed ? Math.random() * 2.5 : 4 + Math.random() * 12;
    const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
    shards.push({ x, z, gy: surfaceAt(x, z) + 1, t: 0, warn: 2.4, y: WH + 10, done: false, aimed });
    if (!warnedShard) { warnedShard = true; UI.toast('A whistle from the sky. The ring is dropping stones: a mark on the ground is where one lands. Get out of it.', 'bad'); }
    UI.sfx('whistle');
  }
  function updateShards(dt, p) {
    const va = Village.active; const inTown = va && Math.hypot(va.x - p.x, va.z - p.z) < 22;
    const open = world.preset.ringfall && !underCover(p) && !inTown && !p.inWater;
    if (open) { shardTimer -= dt; if (shardTimer <= 0) { shardTimer = 18 + Math.random() * 20; spawnShard(p); } }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i]; s.t += dt;
      const fall = s.warn - 1.2; // the stone is visible for the last 1.2 seconds
      if (s.t > fall) s.y = U.lerp(WH + 10, s.gy, Math.min(1, (s.t - fall) / 1.2));
      if (s.t >= s.warn && !s.done) {
        s.done = true; puff(s.x, s.gy, s.z, 18, [1.0, 0.9, 0.6]); UI.sfx('break'); G.shake = 0.5;
        const hd = Math.hypot(p.x - s.x, p.z - s.z); if (hd < 2.6 && Math.abs(p.y - s.gy) < 3) bigHit(p, 'shard');
        const bx = Math.floor(s.x), bz = Math.floor(s.z); if (Math.random() < 0.25 && world.getBlock(bx, s.gy, bz) === B.AIR) { world.setBlock(bx, s.gy, bz, B.RINGSHARD); G.meshPass(99); }
      }
      if (s.t > s.warn + 0.4) shards.splice(i, 1);
    }
  }
  function update(dt, p, inBattle) {
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; f.x += f.vx * dt; f.z += f.vz * dt; f.vy -= 9 * dt; f.y += f.vy * dt; if (f.t > f.dur) fx.splice(i, 1); }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 1.5);
    if (!world.preset.worms && !world.preset.ringfall) return;
    if (inBattle || Dialogue.active() || p.flying || p.frozen || UI.panelOpen) return;
    if (world.preset.worms) updateWorms(dt, p);
    if (world.preset.ringfall) updateShards(dt, p);
  }
  // ---- what to draw ----
  function wormMesh(i) { return R.entityMesh('worm:' + i, (mb) => { const s = 1.1 - i * 0.12; const c = i === 0 ? [0.22, 0.22, 0.26] : (i % 2 ? [0.28, 0.28, 0.32] : [0.2, 0.2, 0.24]); mb.box(-s / 2, -s / 2, -s / 2, s / 2, s / 2, s / 2, c, 1, false); if (i === 0) { mb.box(-0.35, -0.3, s / 2 - 0.05, 0.35, 0.3, s / 2 + 0.12, [0.3, 0.95, 0.9], 1, true); for (const [x, y] of [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]]) mb.box(x - 0.08, y - 0.08, s / 2, x + 0.08, y + 0.08, s / 2 + 0.3, [0.85, 0.85, 0.8], 1, false); } }); }
  function entities() {
    const out = [];
    for (const w of worms) {
      if (w.phase === 'tunnel') continue;
      const n = w.trail.length;
      for (let i = 0; i < WORM_SEG; i++) {
        const k = n - 1 - i * 3; if (k < 0) break; const t = w.trail[k];
        out.push({ x: t[0], y: t[1] - 0.5, z: t[2], yaw: w.yaw, scale: 1.6, hover: 0, skyMul: 1, isFx: true, mesh: wormMesh(i), model: { height: 1 } });
      }
    }
    for (const s of shards) if (s.t > s.warn - 1.2 && !s.done) out.push({ x: s.x, y: s.y, z: s.z, yaw: s.t * 7, scale: 1.2, hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh('shard', (mb) => { mb.box(-0.3, -0.5, -0.3, 0.3, 0.5, 0.3, [1.0, 0.94, 0.75], 1, true); mb.box(-0.15, 0.5, -0.15, 0.15, 1.6, 0.15, [1.0, 0.8, 0.4], 1, true); }), model: { height: 1 } });
    for (const f of fx) {
      if (f.emis) { // a spark: a bright streak along its flight, gone in a blink
        out.push({ x: f.x, y: f.y, z: f.z, yaw: Math.atan2(f.vx, f.vz), scale: Math.max(0.01, f.size * 6 * (1 - f.t / f.dur)), hover: 0, skyMul: 1, isFx: true, noOutline: true, noShadow: true, mesh: R.entityMesh('hspark:' + f.col.join(','), (mb) => { mb.box(-0.03, -0.03, -0.16, 0.03, 0.03, 0.16, f.col, 1, true); mb.box(-0.06, -0.06, -0.05, 0.06, 0.06, 0.05, [1, 1, 1], 1, true); }), model: { height: 1 } });
        continue;
      }
      out.push({ x: f.x, y: f.y, z: f.z, yaw: f.t * 5, scale: Math.max(0.01, f.size * 6 * (1 - f.t / f.dur)), hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh('hfx:' + f.col.join(','), (mb) => mb.box(-0.08, -0.08, -0.08, 0.08, 0.08, 0.08, f.col, 1, f.col[0] > 0.9)), model: { height: 1 } });
    }
    return out;
  }
  function lines() {
    const out = []; const now = performance.now() / 1000;
    for (const w of worms) if (w.phase === 'tunnel') { const gy = surfaceAt(w.x, w.z) + 1; const r = 1.2 + 0.5 * Math.sin(now * 9); out.push({ data: R.ringLines(w.x, gy + 0.05, w.z, r), color: [0.6, 0.6, 0.7, 0.9] }); out.push({ data: R.ringLines(w.x, gy + 0.08, w.z, 2.4), color: [0.5, 0.5, 0.6, 0.5] }); }
    for (const s of shards) if (!s.done) { const u = s.t / s.warn; out.push({ data: R.ringLines(s.x, s.gy + 0.05, s.z, 2.6), color: [1, 0.55, 0.1, 0.9] }); out.push({ data: R.ringLines(s.x, s.gy + 0.08, s.z, 2.6 * (1 - u) + 0.2), color: [1, 0.2, 0.1, 0.95] }); }
    return out;
  }
  return { init, update, entities, lines, sparks, puff, get worms() { return worms; }, get shards() { return shards; } };
})();
