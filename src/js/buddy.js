'use strict';
// Your lead Kin walks with you, a step behind at your shoulder. Fliers keep up in the air, swimmers in the water.
// Now and then, as you walk, it noses out something that suits its element and brings it to you.
const Buddy = (() => {
  let G = null, e = null, key = null, wearSeen = '', walked = 0, nextFind = 160, hopT = 0, gyT = 0, gy = 0, lastX = 0, lastZ = 0, dash = null;
  const FINDS = {
    Stone: [['copper', 1], ['iron', 1], ['stone', 3]], Bloom: [['berry', 3], ['frond', 2]], Flame: [['ember', 1]], Tide: [['pearl', 1], ['bait_berry', 1]],
    Gale: [['feather', 1]], Frost: [['snow', 3], ['broth', 1]], Spark: [['copper', 2]], Void: [['void', 1]], Light: [['glowworm', 2]],
  };
  const SAY = {
    Stone: 'scrapes at the ground and turns up', Bloom: 'roots under a bush and comes back with', Flame: 'sniffs out something warm:', Tide: 'paddles back with',
    Gale: 'snatches something out of the air:', Frost: 'digs in the cold and finds', Spark: 'crackles at a rock and knocks loose', Void: 'stares into a crack in the ground and pulls out', Light: 'glows brighter and leads you to',
  };
  function init(game) { G = game; e = null; key = null; walked = 0; dash = null; pending = null; lastFoe = null; }
  // ---- the fight: your Kin fights beside you. Whatever turns on you, it squares up to with its own moves and its battle strength,
  // far more than any blade of yours. It takes the lunges too, and goes down if they are too much. ----
  let foe = null, atkCd = 1.2, pending = null, flinchT = 0, lastFoe = null;
  function foeNear(p) {
    let best = null, bd = 12;
    const h = Wild.engagedNear(p, 12); if (h && !(h.dazed > 0) && h.chase) { best = h; bd = Math.hypot(h.x - p.x, h.z - p.z); }
    const f = typeof Combat !== 'undefined' && Combat.nearestFoe ? Combat.nearestFoe(p, Math.min(bd, 9)) : null; if (f) best = f;
    return best;
  }
  function gone(T) { return !T || (T.isFoe ? T.state === 'down' : (T.dazed > 0 || !T.chase || !Wild.list.includes(T))); }
  function elemCol(elem) { const c = (typeof ELEM_COLOR !== 'undefined' && ELEM_COLOR[elem]) || '#ffffff'; return U.hexToRgb(c); }
  function land(k, T, move) {
    if (gone(T)) return;
    const hx = T.x - (T.x - e.x) * 0.3, hz = T.z - (T.z - e.z) * 0.3, hy = T.y + (T.isFoe ? 1.0 : (T.model ? T.model.height * T.scale * 0.55 : 0.8));
    if (T.isFoe) { const st = KIN.stats(k); const dmg = Math.max(2, Math.round(st.atk * 0.35 + k.level * 0.25)); Combat.hurtFoe(T, dmg, e.x, e.z); UI.floater(T.x, hy + 0.9, T.z, String(dmg)); Hazards.sparks(hx, hy, hz, 8, elemCol(move.elem)); UI.sfx('hit'); return; }
    if (Battle.dodges(k, T.kin)) { UI.sfx('miss'); return; }
    const r = Battle.calcDamage(k, T.kin, move); const dealt = Wild.hitByKin(T, r.dmg, k);
    UI.floater(T.x, hy + 0.5, T.z, String(dealt), r.crit ? 'crit' : r.eff > 1.25 ? 'eff' : r.eff < 0.8 ? 'weak' : '');
    Hazards.sparks(hx, hy, hz, r.crit ? 16 : 10, elemCol(move.elem), r.eff > 1.25 ? 4.5 : 3.2); UI.sfx(r.eff > 1.25 ? 'hit2' : 'hit');
    if (r.crit && dealt > 0) UI.toast(`${KIN.name(k)}: critical!`);
    if (move.drain) { const st = KIN.stats(k); k.hp = Math.min(st.hp, k.hp + Math.round(dealt / 3)); }
  }
  function fight(dt, p, k) {
    if (flinchT > 0) flinchT -= dt;
    if (pending) { pending.t -= dt; if (pending.t <= 0) { land(k, pending.T, pending.move); pending = null; } }
    const T = foeNear(p);
    if (!T || gone(T)) { if (dash) dash = null; if (lastFoe && !T) { atkCd = 1.0; } lastFoe = null; return false; }
    if (lastFoe !== T) { lastFoe = T; atkCd = Math.min(atkCd, 0.6); if (G.stats && !G.stats.buddyFightTold) { G.stats.buddyFightTold = true; G.explain(`${KIN.name(k)} fights beside you`, 'Your lead Kin takes on whatever turns on you, with its own moves and the strength it has in a battle: far more than any blade of yours. It takes the lunges too, and goes down if they are too much; Deploy picks another to send in, and with nobody at your side it is just you.'); } }
    const r0 = (T.isFoe ? 0.5 : (T.model.radius || 0.6) * T.scale) + (e.model.radius || 0.6) * e.scale + 0.35;
    const dx = T.x - e.x, dz = T.z - e.z, d = Math.hypot(dx, dz); atkCd -= dt;
    const pd = Math.hypot(p.x - e.x, p.z - e.z);
    if (dash) { dash.t += dt; const u = Math.min(1, dash.t / 0.26);
      if (!dash.hit) { e.x = dash.x0 + (T.x - dash.x0) * u * 0.78; e.z = dash.z0 + (T.z - dash.z0) * u * 0.78; e.hover = (e.model.hover || 0) + Math.sin(u * Math.PI) * 0.4 * Math.min(1.5, e.model.height); if (u >= 1) { dash.hit = true; land(k, T, dash.move); } }
      else { const back = Math.min(1, (dash.t - 0.26) / 0.3); e.x = T.x - (dx / (d || 1)) * (r0 * (0.6 + back * 0.6)); e.z = T.z - (dz / (d || 1)) * (r0 * (0.6 + back * 0.6)); if (dash.t > 0.56) dash = null; }
      e.yaw = Math.atan2(T.x - e.x, T.z - e.z); e.y += ((e.flying ? p.y + 1.0 : ground(e.x, e.z, Math.max(p.y, e.y))) - e.y) * Math.min(1, dt * 12); return true; }
    e.yaw = Math.atan2(dx, dz);
    if (d > r0 + 0.25 && pd < 16) { const sp = Math.max(3.2, (e.speed || 0) * 1.2); const step = Math.min(d - r0, sp * dt); const nx = e.x + dx / d * step, nz = e.z + dz / d * step;
      const gy = e.flying ? p.y + 1.0 : ground(nx, nz, Math.max(p.y, e.y)); if (e.flying || Math.abs(gy - e.y) < 1.6) { e.x = nx; e.z = nz; if (gy > e.y) e.y = gy; else e.y += (gy - e.y) * Math.min(1, dt * 10); }
      e.hover = (e.model.hover || 0) + (e.flying ? Math.sin(e.bob * 2) * 0.08 : 0); return true; }
    e.hover = (e.model.hover || 0) + (flinchT > 0 ? Math.sin(flinchT * 40) * 0.06 : 0) + (e.flying ? Math.sin(e.bob * 2) * 0.08 : 0);
    if (atkCd <= 0 && !pending) { const st = KIN.stats(k); const mv = KIN.moves(k).filter(m => m.kind !== 'util'); const move = mv[Math.random() < 0.65 ? 0 : Math.min(1, mv.length - 1)];
      if (k.hp < st.hp * 0.4 && Math.random() < 0.2) { const heal = Math.round(st.hp * 0.22); k.hp = Math.min(st.hp, k.hp + heal); UI.floater(e.x, e.y + e.model.height * e.scale + 0.2, e.z, '+' + heal, 'heal'); Hazards.sparks(e.x, e.y + e.model.height * e.scale * 0.7, e.z, 10, [0.6, 1.0, 0.6], 1.5); UI.sfx('util'); atkCd = 1.4; }
      else if (move.kind === 'phys') { dash = { t: 0, x0: e.x, z0: e.z, hit: false, move }; atkCd = U.clamp(2.3 - st.agi / 90, 1.1, 2.3); }
      else { Battle.spawnFx(e, T, move.elem); pending = { t: 0.34, T, move }; atkCd = U.clamp(2.5 - st.agi / 90, 1.2, 2.5); } }
    return true;
  }
  function hurt(dmg, from, eff) {
    const k = e && e.kin; if (!k) return; k.hp = Math.max(0, k.hp - dmg); e.hitT = 0.35; flinchT = 0.35; hopT = 0.25;
    UI.floater(e.x, e.y + e.model.height * e.scale + 0.2, e.z, String(dmg), 'hurt');
    if (from) { const ddx = e.x - from.x, ddz = e.z - from.z, dl = Math.hypot(ddx, ddz) || 1; const nx = e.x + ddx / dl * 0.35, nz = e.z + ddz / dl * 0.35; const gy = ground(nx, nz, e.y); if (Math.abs(gy - e.y) < 1.5) { e.x = nx; e.z = nz; } }
    Hazards.sparks(e.x, e.y + e.model.height * e.scale * 0.6, e.z, 6, [1.0, 0.6, 0.5]); UI.sfx(eff > 1.25 ? 'hit2' : 'hurt');
    if (k.hp <= 0) down();
  }
  function down() { const k = e.kin; UI.sfx('down'); UI.toast(`${KIN.name(k)} is down. Deploy another, or it is just you.`, 'bad'); Hazards.puff(e.x, e.y + 0.3, e.z, 10, [0.9, 0.9, 0.95]); pending = null; dash = null; e = null; }
  function current() { return e && !e.away && !hidden(G.player) ? e : null; }
  // sent in by hand: at your side at once, and straight at whatever is on you
  function rally(T) { atkCd = 0; lastFoe = null; pending = null; dash = null; hopT = 0.5; if (e) { e.away = false; place(G.player, true); } if (T && T.chase) T.chase.foe = 'buddy', T.chase.foeT = 4; }
  function lead() { const k = G.activeKin ? G.activeKin() : (G.kin && G.kin[G.activeIdx]); return k && k.hp > 0 ? k : null; } // the same Kin the rest of the game calls the lead (the next healthy one when the chosen one is down)
  function hidden(p) {
    if (Battle.active || p.flying || p.mount || (G.stats && G.stats.buddyOff)) return true;
    return false;
  }
  function make(k, p) {
    const m = KIN.dress(KIN.model(k.sp, k.stage), k.wear);
    const fly = k.sp.shape === 'bird' || k.sp.shape === 'floater';
    const big = Math.max(m.height, m.radius * 1.6);
    e = { kin: k, x: p.x, y: p.y, z: p.z, yaw: p.yaw, model: m, scale: big > 2.6 ? 2.6 / big : 1, hover: m.hover, bob: Math.random() * 6, flying: fly, aquatic: k.sp.shape === 'serpent' && KIN.dominant(k.sp.elem, 1)[0] === 'Tide', skyMul: 1, isBuddy: true,
      mesh: R.entityMesh(KIN.meshKey(k.sp, k.stage) + KIN.wearKey(k.wear), (mb) => KIN.buildMesh(mb, m)) };
    key = k.id || k; wearSeen = KIN.wearKey(k.wear); place(p, true);
  }
  function spot(p) { const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw); const back = -0.3, side = 1.6 + (e.model.radius || 0.6) * e.scale; return { x: p.x + sy * back + cy * side, z: p.z + cy * back - sy * side }; }
  function ground(x, z, fromY) { const w = G.world; const y = w.groundY(Math.floor(x), Math.floor(z), Math.floor(fromY) + 3); if (y == null) return fromY; return R.standY(w, x, z, y + 1, e ? Math.min(0.5, (e.model.radius || 0.5) * e.scale * 0.6) : 0.3); } // on the drawn slope, not the block grid, so it never sinks into a rise
  function place(p, snap) { const s = spot(p); e.x = s.x; e.z = s.z; e.y = e.flying ? p.y + 1.2 : ground(s.x, s.z, p.y); gy = e.y; }
  function update(dt, p) {
    const k = lead();
    if (!k) { e = null; return; }
    if (!e || e.kin !== k || KIN.wearKey(k.wear) !== wearSeen) make(k, p); // a change of outfit rebuilds it
    if (hidden(p)) { e.away = true; return; }
    if (e.away) { e.away = false; place(p, true); }
    e.bob += dt;
    if (fight(dt, p, k)) { e.y += ((e.flying ? p.y + 1.0 : ground(e.x, e.z, Math.max(p.y, e.y))) - e.y) * Math.min(1, dt * 10); return; }
    const s = spot(p); const dx = s.x - e.x, dz = s.z - e.z, d = Math.hypot(dx, dz);
    const gliding = p.gliding;
    if (d > 18 || Math.abs(p.y - e.y) > 8 || (gliding && !e.flying)) { if (gliding && !e.flying) { e.away = true; return; } place(p, true); return; }
    const pv = Math.hypot(p.vx, p.vz);
    if (d > 0.4) {
      const sp = Math.min(d, Math.max(3.2, pv * 1.15) * (d > 4 ? 1.6 : 1) * dt);
      e.x += dx / d * sp; e.z += dz / d * sp;
      const ty = Math.atan2(dx, dz); let dy = ty - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; e.yaw += dy * Math.min(1, dt * 8);
    } else { const ty = Math.atan2(p.x - e.x, p.z - e.z); let dy = ty - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; e.yaw += dy * Math.min(1, dt * 3); }
    gyT -= dt; if (gyT <= 0 || !e.flying) { gyT = 0.15; gy = e.flying ? p.y + 1.3 + Math.sin(e.bob * 1.4) * 0.25 : ground(e.x, e.z, Math.max(p.y, e.y)); }
    if (!e.flying && gy > e.y) e.y = gy; // a step up is taken at once: on bare rock there is no grass to hide a foot sunk in the ground
    else e.y += (gy - e.y) * Math.min(1, dt * (e.flying ? 3 : 10));
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
  function entities() { if (!e || e.away || hidden(G.player)) return []; return [e]; }
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
  return { init, update, entities, pick, tap, current, hurt, rally, get entity() { return e; } };
})();
