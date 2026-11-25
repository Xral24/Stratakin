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
    const r = Battle.calcDamage(k, T.kin, move); const tq = temper(k), bq = k.bond || 0; r.dmg = Math.max(1, Math.round(r.dmg * (tq === 'drowsy' ? 1.18 : tq === 'cross' ? 1.1 : tq === 'shy' && bq >= 0.5 ? 1.15 : 1))); /* what each temper gives back: the dozy ones hit heavy, the cross ones hard, a shy one that trusts you fights for you */
    const dealt = Wild.hitByKin(T, r.dmg, k);
    UI.floater(T.x, hy + 0.5, T.z, String(dealt), r.crit ? 'crit' : r.eff > 1.25 ? 'eff' : r.eff < 0.8 ? 'weak' : '');
    Hazards.sparks(hx, hy, hz, r.crit ? 16 : 10, elemCol(move.elem), r.eff > 1.25 ? 4.5 : 3.2); UI.sfx(r.eff > 1.25 ? 'hit2' : 'hit');
    if (r.crit && dealt > 0) UI.toast(`${KIN.name(k)}: critical!`);
    if (move.drain) { const st = KIN.stats(k); k.hp = Math.min(st.hp, k.hp + Math.round(dealt / 3)); }
  }
  function fight(dt, p, k) {
    if (flinchT > 0) flinchT -= dt; if (e && e.hitT > 0) e.hitT -= dt; /* the white of a hit fades: it used to stay, and washed the Kin's colours out for good */
    if (pending) { pending.t -= dt; if (pending.t <= 0) { land(k, pending.T, pending.move); pending = null; } }
    const T = foeNear(p);
    if (!T || gone(T)) { if (dash) dash = null; if (lastFoe && !T) { atkCd = 1.0; } lastFoe = null; return false; }
    if (lastFoe !== T) { lastFoe = T; atkCd = Math.min(atkCd, 0.6); if (G.stats && !G.stats.buddyFightTold) { G.stats.buddyFightTold = true; G.explain(`${KIN.name(k)} fights beside you`, 'Your lead Kin takes on whatever turns on you, with its own moves and the strength it has in a battle: far more than any blade of yours. It takes the lunges too, and goes down if they are too much. Press Deploy Kin for a proper battle, Kin against Kin, where you choose every move.'); } }
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
    if (atkCd <= 0 && !pending && temper(k) === 'shy' && Math.random() < ((k.bond || 0) < 0.15 ? 0.5 : (k.bond || 0) < 0.5 ? 0.25 : 0)) { atkCd = 1.3; emote('…', '#d8c8ff'); flinchT = 0.4; } /* a shy one loses its nerve now and then, until it trusts you */
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
  // ---- its heart. The Kin at your shoulder is somebody: it has a temper it was born with and a bond with you that grows from walking together, winning together, being looked after and being made a fuss of.
  // What it feels shows in its face and in a small mark over its head, and how it shows it depends on the temper
  const TEMPERS = ['steady', 'shy', 'cross', 'bright', 'drowsy'];
  const MOOD = { sneak: { b: -0.45, t: 0.35, lid: 0.38, one: 0.25 }, joy: { b: 0.85, t: -0.2, lid: 0.72 }, worry: { b: 0.55, t: -0.85, lid: 0.15 }, alert: { b: 0.95, t: -0.1, lid: 0 }, sleepy: { b: -0.15, t: -0.1, lid: 0.82 }, wonder: { b: 0.7, t: -0.3, lid: 0, one: 0.6 } };
  let lagTold = 0; let sneakK = 0, mood = null, moodT = 0, stillT = 0, wasFight = false, petT = 0, greetT = 0, worryT = 0;
  const temper = (k) => TEMPERS[(e && e.model && e.model.temper || 0) % 5];
  function bond(k, d) { k.bond = Math.min(1, Math.max(0, (k.bond || 0) + d)); }
  function emote(ch, col) { if (!e || typeof R === 'undefined' || !R.project) return; const q = R.project(e.x, e.y + (e.model.height || 1) * e.scale + 0.45, e.z); if (!q || !q.on) return; const el = document.createElement('div'); el.textContent = ch;
    el.style.cssText = `position:fixed;z-index:7;left:${q.x}px;top:${q.y}px;transform:translate(-50%,-100%);font:900 26px/1 system-ui,sans-serif;color:${col || '#fff'};text-shadow:0 0 3px #1a1420,0 2px 0 #1a1420,2px 0 0 #1a1420,-2px 0 0 #1a1420,0 -2px 0 #1a1420;pointer-events:none;transition:transform 1.3s ease-out,opacity 1.3s ease-in;opacity:1;`; document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-260%)'; el.style.opacity = '0'; }); setTimeout(() => el.remove(), 1400); }
  function feel(name, secs, ch, col) { mood = name; moodT = secs; if (ch) emote(ch, col); }
  function heart(dt, p, k, fighting) { const f = e._face || (e._face = { bl: 0, br: 0, tl: 0, tr: 0, lid: 0.1 }), tp = temper(k), night = G.world && Math.cos(G.world.time * Math.PI * 2) > 0.17, pv = Math.hypot(p.vx, p.vz);
    petT -= dt; greetT -= dt; worryT -= dt; moodT -= dt; if (moodT <= 0) mood = null;
    if (wasFight && !fighting && k.hp > 0) { bond(k, 0.012); hopT = 0.9; feel('joy', 3.5, tp === 'cross' ? '!' : '♪', '#ffe27a'); } wasFight = fighting; // it won, and it knows it
    if (!fighting) { const hpP = p.hp != null && p.maxHp ? p.hp / p.maxHp : 1; if (hpP < 0.35 && worryT <= 0) { worryT = 14; feel('worry', 5, '!', '#ff8a70'); } // you are hurt and it has noticed
      stillT = pv < 0.2 ? stillT + dt : 0; if (stillT > 9 && !mood) { if (night || tp === 'drowsy') feel('sleepy', 6, stillT > 16 ? 'z' : null, '#bcd0ff'); else if (stillT > 14 && Math.random() < dt * 0.12) { feel('wonder', 3, '?', '#fff'); stillT = 9; } }
      if (!mood && Wild.list && Wild.list.some(w => w.alert > 0.4 && !w.isBoss && Math.hypot(w.x - e.x, w.z - e.z) < 9)) feel('alert', 1.2, greetT <= 0 ? '!' : null, '#fff'), greetT = 8; }
    // when you go down on your haunches so does it: low to the ground, leaning forward, head down, eyes narrowed and fixed on whatever you are after
    sneakK += ((p.sneak && !fighting ? 1 : 0) - sneakK) * Math.min(1, dt * 7); if (e._an) { e._an.crouch = sneakK * 0.4; e._an.lean = sneakK * 0.28; e._an.nod = sneakK * 0.22; }
    const M = mood ? MOOD[mood] : sneakK > 0.5 ? MOOD.sneak : null; if (!M) { e.face = null; e._face = null; return; } const q = Math.min(1, dt * 9); f.bl += (M.b - f.bl) * q; f.br += (M.b + (M.one || 0) - f.br) * q; f.tl += (M.t - f.tl) * q; f.tr += (M.t - f.tr) * q; f.lid += (M.lid - f.lid) * q; e.face = f; }
  const PET = { steady: ['stands a little closer', 'leans its whole weight on your leg', 'will not leave your side now'], shy: ['flinches, then lets you', 'hides behind your leg and peeks out', 'climbs half into your coat and stays there'], cross: ['puts up with it', 'pretends not to like it', 'pushes its head under your hand and glares at anyone looking'],
    bright: ['bounces at your feet', 'spins on the spot', 'cannot keep still for joy'], drowsy: ['yawns at you', 'yawns and leans on you', 'falls asleep against your boot, trusting you to stand still'] };
  /* the bond shine. Keep one Kin out with you long enough, doing things together, and its coat turns: gold running to rose and sea-green, for good. Only time spent moving or fighting side by side counts, and only once it trusts you; idling counts for nothing. The game never says how long: about ten hours of it. A Kin left in the bag cools, slowly, and never all the way back */
  const SHINE_T = 36000; let shineCd = 1, glintT = 60;
  function shine(dt, p, k, fighting) { if (k.bonded) return; const moving = Math.hypot(p.vx, p.vz) > 0.6;
    if ((fighting || moving) && (k.bond || 0) >= 0.5) k.bondT = (k.bondT || 0) + dt * (fighting ? 1.5 : 1);
    if ((shineCd -= dt) <= 0) { shineCd = 5; for (const o of G.kin) if (o !== k && o.bondT > 0 && !o.bonded) o.bondT = Math.max(0, o.bondT - 5 * 0.15); }
    const f = (k.bondT || 0) / SHINE_T;
    if (f > 0.75 && (glintT -= dt) <= 0) { glintT = 70 + Math.random() * 80; emote('✦', '#ffe08a'); } // nearly there: now and then it catches the light
    if (f >= 1 && (k.bond || 0) >= 0.9 && !fighting) { k.bonded = true; hopT = 1.4; feel('joy', 6, '✦', '#ffe08a'); UI.sfx('gift'); UI.toast(`${KIN.name(k)} shakes itself, and its coat catches fire with light. It is bonded to you, for good.`, 'good');
      G.explain && G.explain('Bonded', `You and ${KIN.name(k)} have been through enough together that it has changed. Its coat shines, and its cartridge has turned with it. Nothing undoes this: not time apart, not fusion, not a trade, because a bonded Kin cannot be traded.`); } }
  const BONDS = ['It hardly knows you yet', 'It is getting used to you', 'It trusts you', 'It would follow you anywhere'];
  function update(dt, p) {
    const k = lead();
    if (!k) { e = null; return; }
    if (!e || e.kin !== k || KIN.wearKey(k.wear) !== wearSeen) make(k, p); // a change of outfit rebuilds it
    if (hidden(p)) { e.away = true; return; }
    if (e.away) { e.away = false; place(p, true); }
    e.bob += dt;
    const inFight = fight(dt, p, k); heart(dt, p, k, inFight);
    shine(dt, p, k, inFight);
    if (inFight) { e.y += ((e.flying ? p.y + 1.0 : ground(e.x, e.z, Math.max(p.y, e.y))) - e.y) * Math.min(1, dt * 10); return; }
    const s = spot(p); const dx = s.x - e.x, dz = s.z - e.z, d = Math.hypot(dx, dz);
    const gliding = p.gliding;
    if (d > 18 || Math.abs(p.y - e.y) > 8 || (gliding && !e.flying)) { if (gliding && !e.flying) { e.away = true; return; } place(p, true); return; }
    const pv = Math.hypot(p.vx, p.vz);
    if (d > 0.4) {
      /* a drowsy one dawdles until it knows you: it falls behind and you wait for it. A bright one is always at your heel */
      const tq = temper(k), bq = k.bond || 0, lag = tq === 'drowsy' ? (bq < 0.15 ? 0.5 : bq < 0.5 ? 0.72 : 1) : tq === 'bright' ? 1.15 : 1;
      if (lag < 1 && d > 7 && !lagTold) { lagTold = 40; emote('z', '#bcd0ff'); } if (lagTold > 0) lagTold -= dt;
      const sp = Math.min(d, Math.max(3.2 * lag, pv * 1.15 * lag) * (d > 4 && lag >= 1 ? 1.6 : 1) * dt);
      e.x += dx / d * sp; e.z += dz / d * sp;
      const ty = Math.atan2(dx, dz); let dy = ty - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; e.yaw += dy * Math.min(1, dt * 8);
    } else { const ty = Math.atan2(p.x - e.x, p.z - e.z); let dy = ty - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; e.yaw += dy * Math.min(1, dt * 3); }
    gyT -= dt; if (gyT <= 0 || !e.flying) { gyT = 0.15; gy = e.flying ? p.y + 1.3 + Math.sin(e.bob * 1.4) * 0.25 : ground(e.x, e.z, Math.max(p.y, e.y)); }
    if (!e.flying && gy > e.y) e.y = gy; // a step up is taken at once: on bare rock there is no grass to hide a foot sunk in the ground
    else e.y += (gy - e.y) * Math.min(1, dt * (e.flying ? 3 : 10));
    if (hopT > 0) { hopT -= dt; e.hover = (e.model.hover || 0) + Math.abs(Math.sin(hopT * 9)) * 0.5; } else e.hover = (e.model.hover || 0) * (1 - sneakK * 0.6) + (e.flying ? Math.sin(e.bob * 2) * 0.08 * (1 - sneakK) : 0) - sneakK * 0.16 * (e.model.height || 1) * e.scale * (e.flying ? 0 : 1);
    // finds: walking together turns things up
    const step = Math.hypot(p.x - lastX, p.z - lastZ); lastX = p.x; lastZ = p.z;
    if (step < 3 && p.onGround) walked += step;
    if (walked > nextFind) { walked = 0; nextFind = 170 + Math.random() * 140; find(k); bond(k, 0.01); if (!mood) feel('joy', 2.5, '♪', '#ffe27a'); }
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
    const tp = temper(k), bd = k.bond || 0, lv = bd < 0.15 ? 0 : bd < 0.5 ? 1 : 2; if (petT <= 0) { petT = 25; bond(k, 0.008); } // making a fuss of it counts, though not if you do nothing else
    if (hp < 35) { feel('worry', 4, null); UI.toast(`${KIN.name(k)}, Lv ${k.level} · ${hp}% health. It is hurt and leans on you.`); return; }
    feel('joy', 3.5, lv === 2 ? '♥' : lv === 1 ? '♪' : null, lv === 2 ? '#ff7a9a' : '#ffe27a');
    UI.toast(`${KIN.name(k)}, Lv ${k.level} · ${hp}% health. A ${tp} one: it ${PET[tp][lv]}. ${k.bonded ? 'Bonded to you, for good' : BONDS[bd < 0.15 ? 0 : bd < 0.5 ? 1 : bd < 0.9 ? 2 : 3]}.`);
  }
  return { init, update, entities, pick, tap, current, hurt, rally, get entity() { return e; } };
})();
