'use strict';
// Your lead Kin walks with you, a step behind at your shoulder. Fliers keep up in the air, swimmers in the water.
// Now and then, as you walk, it noses out something that suits its element and brings it to you.
const Buddy = (() => {
  let G = null, e = null, key = null, walked = 0, nextFind = 160, hopT = 0, gyT = 0, gy = 0, lastX = 0, lastZ = 0;
  const FINDS = {
    Stone: [['copper', 1], ['iron', 1], ['stone', 3]], Bloom: [['berry', 3], ['frond', 2]], Flame: [['ember', 1]], Tide: [['pearl', 1], ['bait_berry', 1]],
    Gale: [['feather', 1]], Frost: [['snow', 3], ['broth', 1]], Spark: [['copper', 2]], Void: [['void', 1]], Light: [['glowworm', 2]],
  };
  const SAY = {
    Stone: 'scrapes at the ground and turns up', Bloom: 'roots under a bush and comes back with', Flame: 'sniffs out something warm:', Tide: 'paddles back with',
    Gale: 'snatches something out of the air:', Frost: 'digs in the cold and finds', Spark: 'crackles at a rock and knocks loose', Void: 'stares into a crack in the ground and pulls out', Light: 'glows brighter and leads you to',
  };
  function init(game) { G = game; e = null; key = null; walked = 0; }
  function lead() { const k = G.kin && G.kin[G.activeIdx]; return k && k.hp > 0 ? k : null; }
  function hidden(p) {
    if (Battle.active || p.flying || p.mount || (G.stats && G.stats.buddyOff)) return true;
    return false;
  }
  function make(k, p) {
    const m = KIN.model(k.sp, k.stage);
    const fly = k.sp.shape === 'bird' || k.sp.shape === 'floater';
    const big = Math.max(m.height, m.radius * 1.6);
    e = { kin: k, x: p.x, y: p.y, z: p.z, yaw: p.yaw, model: m, scale: big > 2.6 ? 2.6 / big : 1, hover: m.hover, bob: Math.random() * 6, flying: fly, aquatic: k.sp.shape === 'serpent' && KIN.dominant(k.sp.elem, 1)[0] === 'Tide', skyMul: 1, isBuddy: true,
      mesh: R.entityMesh(KIN.meshKey(k.sp, k.stage), (mb) => KIN.buildMesh(mb, m)) };
    key = k.id || k; place(p, true);
  }
  function spot(p) { const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw); const back = -0.3, side = 1.6 + (e.model.radius || 0.6) * e.scale; return { x: p.x + sy * back + cy * side, z: p.z + cy * back - sy * side }; }
  function ground(x, z, fromY) { const w = G.world; const y = w.groundY(Math.floor(x), Math.floor(z), Math.floor(fromY) + 3); return y == null ? fromY : y + 1; }
  function place(p, snap) { const s = spot(p); e.x = s.x; e.z = s.z; e.y = e.flying ? p.y + 1.2 : ground(s.x, s.z, p.y); gy = e.y; }
  function update(dt, p) {
    const k = lead();
    if (!k) { e = null; return; }
    if (!e || e.kin !== k) make(k, p);
    if (hidden(p)) { e.away = true; return; }
    if (e.away) { e.away = false; place(p, true); }
    e.bob += dt;
    const s = spot(p); const dx = s.x - e.x, dz = s.z - e.z, d = Math.hypot(dx, dz);
    const gliding = p.gliding;
    if (d > 18 || Math.abs(p.y - e.y) > 8 || (gliding && !e.flying)) { if (gliding && !e.flying) { e.away = true; return; } place(p, true); return; }
    const pv = Math.hypot(p.vx, p.vz);
    if (d > 0.4) {
      const sp = Math.min(d, Math.max(3.2, pv * 1.15) * (d > 4 ? 1.6 : 1) * dt);
      e.x += dx / d * sp; e.z += dz / d * sp;
      const ty = Math.atan2(dx, dz); let dy = ty - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; e.yaw += dy * Math.min(1, dt * 8);
    } else { const ty = Math.atan2(p.x - e.x, p.z - e.z); let dy = ty - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; e.yaw += dy * Math.min(1, dt * 3); }
    gyT -= dt; if (gyT <= 0) { gyT = 0.15; gy = e.flying ? p.y + 1.3 + Math.sin(e.bob * 1.4) * 0.25 : ground(e.x, e.z, Math.max(p.y, e.y)); }
    e.y += (gy - e.y) * Math.min(1, dt * (e.flying ? 3 : 10));
    if (hopT > 0) { hopT -= dt; e.hover = (e.model.hover || 0) + Math.abs(Math.sin(hopT * 9)) * 0.5; } else e.hover = (e.model.hover || 0) + (e.flying ? Math.sin(e.bob * 2) * 0.08 : 0);
    // finds: walking together turns things up
    const step = Math.hypot(p.x - lastX, p.z - lastZ); lastX = p.x; lastZ = p.z;
    if (step < 3 && p.onGround) walked += step;
    if (walked > nextFind) { walked = 0; nextFind = 170 + Math.random() * 140; find(k); }
  }
  function find(k) {
    const el = KIN.dominant(k.sp.elem, 1)[0]; const pool = FINDS[el] || FINDS.Stone;
    const lvl = k.level || 1; let item, n;
    if (Math.random() < 0.35) { item = 'ess_' + el; n = 1; } // an essence of its own kind: the stuff fusion stones are made of
    else { const pick = pool[Math.floor(Math.random() * pool.length)]; item = pick[0]; n = pick[1] + (lvl >= 30 && Math.random() < 0.4 ? 1 : 0); }
    if (!ITEMS[item]) return;
    G.player.add(item, n); hopT = 0.7; UI.sfx('caught'); UI.renderHotbar && UI.renderHotbar();
    UI.toast(`${KIN.name(k)} ${SAY[el] || 'finds'} ${n > 1 ? n + ' ' : ''}${ITEMS[item].name}.`, 'good');
    if (!G.stats.buddyTold) { G.stats.buddyTold = true; G.explain('Your Kin walks with you', `Your lead Kin follows you around the world. Walk together and it finds things that suit its element: a Stone Kin turns up ore, a Bloom Kin berries, a Gale Kin feathers, and any of them now and then an essence of their own kind for fusion stones. Change your lead Kin in the Kin panel to change what it finds. Tap it to see how it is doing.`); }
  }
  const WEAR = {
    scarf: (h, r, c) => [[-r * 0.8, h * 0.62, -r * 0.8, r * 1.6, h * 0.1, r * 1.6, c], [r * 0.5, h * 0.4, r * 0.6, r * 0.25, h * 0.22, r * 0.12, c]],
    coat: (h, r, c) => [[-r * 0.85, h * 0.3, -r * 0.85, r * 1.7, h * 0.36, r * 1.7, c]],
    hat: (h, r, c) => [[-r * 0.45, h * 0.98, -r * 0.45, r * 0.9, h * 0.05, r * 0.9, c], [-r * 0.28, h * 1.02, -r * 0.28, r * 0.56, h * 0.22, r * 0.56, c]],
    bow: (h, r, c) => [[-r * 0.35, h * 0.98, -r * 0.08, r * 0.7, h * 0.12, r * 0.16, c]],
    crown: (h, r, c) => [[-r * 0.3, h * 0.98, -r * 0.3, r * 0.6, h * 0.1, r * 0.6, '#ffd040'], [-r * 0.3, h * 1.06, -r * 0.3, r * 0.12, h * 0.1, r * 0.12, c], [r * 0.18, h * 1.06, r * 0.18, r * 0.12, h * 0.1, r * 0.12, c]],
    rosette: (h, r, c) => [[-r * 0.2, h * 0.55, r * 0.7, r * 0.4, r * 0.4, r * 0.06, '#4a7ad0'], [-r * 0.08, h * 0.38, r * 0.72, r * 0.16, h * 0.18, r * 0.04, '#4a7ad0']],
    sash: (h, r, c) => [[-r * 0.9, h * 0.45, -r * 0.1, r * 1.8, h * 0.08, r * 0.2, '#c94c4c'], [-r * 0.15, h * 0.4, r * 0.7, r * 0.3, h * 0.3, r * 0.05, '#ffd040']],
    laurelk: (h, r, c) => [[-r * 0.4, h * 0.98, -r * 0.4, r * 0.8, h * 0.05, r * 0.08, '#4f7a3a'], [-r * 0.4, h * 0.98, r * 0.32, r * 0.8, h * 0.05, r * 0.08, '#4f7a3a'], [-r * 0.4, h * 0.98, -r * 0.4, r * 0.08, h * 0.05, r * 0.8, '#4f7a3a'], [r * 0.32, h * 0.98, -r * 0.4, r * 0.08, h * 0.05, r * 0.8, '#4f7a3a']],
    medal: (h, r, c) => [[-r * 0.7, h * 0.6, -r * 0.7, r * 1.4, h * 0.05, r * 1.4, '#c94c4c'], [-r * 0.12, h * 0.42, r * 0.7, r * 0.24, r * 0.24, r * 0.05, '#ffd040']],
    collar: (h, r, c) => [[-r * 0.7, h * 0.6, -r * 0.7, r * 1.4, h * 0.06, r * 1.4, c], [-r * 0.06, h * 0.52, r * 0.68, r * 0.12, h * 0.1, r * 0.06, '#ffd040']],
  };
  function wearEntity() {
    const W = e && e.kin.wear; if (!W || !W.item || !WEAR[W.item]) return null;
    const h = e.model.height * e.scale, r = Math.max(0.35, (e.model.radius || 0.6) * e.scale * 0.8); const col = W.col || '#c94c4c';
    const key = `kinwear:${W.item}:${col}:${h.toFixed(2)}:${r.toFixed(2)}`;
    const mesh = R.entityMesh(key, (mb) => { for (const b of WEAR[W.item](h, r, col)) { const c = U.hexToRgb(b[6]); mb.box(b[0], b[1], b[2], b[0] + b[3], b[1] + b[4], b[2] + b[5], c, 1, false); } });
    return { x: e.x, y: e.y + (e.hover || 0), z: e.z, yaw: e.yaw, scale: 1, hover: 0, skyMul: 1, isFx: true, mesh };
  }
  function entities() { if (!e || e.away || hidden(G.player)) return []; const w = wearEntity(); return w ? [e, w] : [e]; }
  function pick(p) {
    if (!e || e.away) return null;
    const eye = p.eye(); const f = U.forwardVec(p.yaw, p.pitch); const h = e.model.height * e.scale;
    const ox = eye.x - e.x, oy = eye.y - (e.y + h / 2), oz = eye.z - e.z; const r = Math.max(0.7, e.model.radius * e.scale);
    const b = ox * f[0] + oy * f[1] + oz * f[2], c = ox * ox + oy * oy + oz * oz - r * r; const disc = b * b - c;
    if (disc < 0) return null; const t = -b - Math.sqrt(disc); return t > 0 && t < 6 ? e : null;
  }
  function tap() {
    if (!e) return; const k = e.kin; hopT = 0.7; UI.sfx('click');
    const trust = k.trust || 0; const hp = Math.round(k.hp / KIN.stats(k).hp * 100);
    const mood = hp < 35 ? 'is hurt and leans on you' : trust > 0.6 ? 'nuzzles your hand' : k.level >= KIN.capOf(k.sp) ? 'looks as strong as it will ever be' : 'bounces at your feet';
    UI.toast(`${KIN.name(k)}, Lv ${k.level} · ${hp}% health. It ${mood}.`);
  }
  return { init, update, entities, pick, tap, get entity() { return e; } };
})();
