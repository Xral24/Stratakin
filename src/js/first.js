// The opening. You come round at a camp fire by a brook with no memory and no Kin. Maren, the net-maker who got out of the village
// the night Grakor took it, fished you out of the water. Three young Kin she let out of the pens are hiding close by. You meet them,
// each behaves as its temper makes it, and the one you share your bread with is yours. The other two go back for the village and are penned.
const First = (() => {
  let G = null, maren = null, three = [], gone = [], told = 0, auto = 0, armed = null, brookDone = false;
  const TEMP = ['steady', 'shy', 'cross', 'bright', 'drowsy'];
  const S = () => G && G.stats && G.stats.first;
  function init(game) { G = game; maren = null; three = []; gone = []; told = 0; auto = 1.6; armed = null; }
  function begin() { G.stats.first = { stage: 0 }; }
  /* the ground, not the top of a tree: leaves and trunks are looked through */
  const gy = (x, z, y) => { const w = G.world, X = Math.floor(x), Z = Math.floor(z); let g = w.groundY(X, Z, Math.floor(y) + 6); while (g > 2 && (isLeaf(w.getBlock(X, g, Z)) || w.getBlock(X, g, Z) === B.LOG)) g--; return g + 1; };
  const dry = (x, z, y) => { const g = gy(x, z, y), w = G.world, X = Math.floor(x), Z = Math.floor(z), b = w.getBlock(X, g, Z), b2 = w.getBlock(X, g + 1, Z); return b === B.AIR && (b2 === B.AIR || isLeaf(b2)) ? g : null; };

  // a brook past the camp, on the side away from the village: a shallow winding cut with gravel under it. Of the lines tried, the flattest wins
  function brook() { const w = G.world, c = G.camp, v = G.village; if (!c || !v) return null; const ax = Math.atan2(c.x - v.x, c.z - v.z); let best = null;
    for (const dist of [8, 11, 6]) for (const da of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.0, -2.0, 2.6, -2.6]) { const a = ax + da, ox = c.x + Math.sin(a) * dist, oz = c.z + Math.cos(a) * dist, px = Math.cos(a), pz = -Math.sin(a); let lo = 999, hi = -999, wet = 0; const cols = [];
      for (let t = -11; t <= 11; t++) { const m = Math.sin(t * 0.42) * 1.6, x = Math.floor(ox + px * t + Math.sin(a) * m), z = Math.floor(oz + pz * t + Math.cos(a) * m), g = w.groundY(x, z, c.y + 8); lo = Math.min(lo, g); hi = Math.max(hi, g); if (w.getBlock(x, g + 1, z) === B.WATER) wet++; cols.push([x, z, g]); }
      const sc = (hi - lo) + wet * 2 + Math.abs(da) * 0.4 + Math.abs(dist - 8) * 0.2 + Math.abs(lo + 1 - c.y) * 0.5; if (!best || sc < best.sc) best = { sc, cols, lo, a, ox, oz }; }
    if (!best || best.sc > 7.5) return null; const L = best.lo - 1; /* the water stands one below the lowest bank */
    for (const [x, z] of best.cols) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const r = Math.max(Math.abs(dx), Math.abs(dz)), X = x + dx, Z = z + dz; if (Math.abs(X - c.x) < 2 && Math.abs(Z - c.z) < 2) continue; const g = w.groundY(X, Z, c.y + 8); if (isLeaf(w.getBlock(X, g, Z)) || w.getBlock(X, g, Z) === B.LOG) continue;
        if (r <= 1) { for (let y = L + 1; y <= g + 2; y++) if (w.getBlock(X, y, Z) !== B.AIR) w.setBlock(X, y, Z, B.AIR); w.setBlock(X, L, Z, B.WATER); w.setBlock(X, L - 1, Z, B.GRAVEL); }
        else if (g > L + 1) { for (let y = L + 2; y <= g + 2; y++) if (w.getBlock(X, y, Z) !== B.AIR && w.getBlock(X, y, Z) !== B.WATER) w.setBlock(X, y, Z, B.AIR); if (w.getBlock(X, L + 1, Z) !== B.WATER) w.setBlock(X, L + 1, Z, B.SAND); }
        else if (r === 2 && (w.getBlock(X, g, Z) === B.GRASS || w.getBlock(X, g, Z) === B.DIRT)) w.setBlock(X, g, Z, B.SAND); /* a sandy lip all along the water, so no grass stands in the stream */ }
    return { x: best.ox, z: best.oz, a: best.a }; }

  function ent(sp, x, z) { const kin = KIN.create(sp, 5), m = KIN.model(sp, kin.stage), y = gy(x, z, G.camp.y);
    return { kin, x, y, z, hx: x, hz: z, yaw: Math.random() * 6.28, model: m, scale: 1, hover: m.hover || 0, bob: Math.random() * 6, skyMul: 1, mesh: R.entityMesh(KIN.meshKey(sp, kin.stage), (mb) => KIN.buildMesh(mb, m)), temper: (m.temper || 0) % 5, t: 0, still: 0, fled: 0, tx: x, tz: z, sleep: (m.temper || 0) % 5 === 4 }; }
  /* all three sit on the sandy lip of the brook, strung along it, so there is one place to look and nothing else in it */
  function bankSpots() { const bk = G.stats.first.brook, c = G.camp; if (!bk) return null; const px = Math.cos(bk.a), pz = -Math.sin(bk.a), nx = Math.sin(bk.a), nz = Math.cos(bk.a), out = [];
    for (const t0 of [0, -7, 7]) { let got = null; for (const dt of [0, 1, -1, 2, -2]) { for (const side of [-1, 1]) for (const off of [2.5, 3.2]) { const t = t0 + dt, m = Math.sin(t * 0.42) * 1.6, x = bk.x + px * t + nx * (m + side * off), z = bk.z + pz * t + nz * (m + side * off); const g = dry(x, z, c.y); if (g == null) continue; const top = G.world.getBlock(Math.floor(x), g - 1, Math.floor(z)); if (top === B.WATER || G.world.getBlock(Math.floor(x), g, Math.floor(z)) === B.WATER) continue; if (out.some(o => Math.hypot(o[0] - x, o[1] - z) < 4)) continue; got = [Math.floor(x) + 0.5, Math.floor(z) + 0.5]; break; } if (got) break; } if (got) out.push(got); }
    return out.length === 3 ? out : null; }
  function spots() { const c = G.camp, v = G.village, back = Math.atan2(c.x - v.x, c.z - v.z), out = []; const bk = G.stats.first.brook;
    for (const [da, r] of [[0, 9], [1.3, 10], [-1.3, 10], [0.8, 12], [-0.8, 12], [0.4, 13], [-0.4, 13], [1.6, 9], [-1.6, 9]]) { if (out.length >= 3) break; let x = c.x + Math.sin(back + da) * r, z = c.z + Math.cos(back + da) * r; if (!out.length && bk) { x = bk.x - Math.sin(bk.a) * 3.2; z = bk.z - Math.cos(bk.a) * 3.2; }
      if (dry(x, z, c.y) != null && Math.abs(gy(x, z, c.y) - c.y) < 5) out.push([x + 0.5, z + 0.5]); }
    while (out.length < 3) out.push([c.x + 4 + out.length * 2, c.z - 5]); return out; }
  function build() { const s = S(), c = G.camp; if (!maren) { const vv = G.village, vl = Math.hypot(vv.x - c.x, vv.z - c.z) || 1, ux = (vv.x - c.x) / vl, uz = (vv.z - c.z) / vl; let mx = c.x - 0.5 + ux * 2.6 - uz * 2.1, mz = c.z - 0.5 + uz * 2.6 + ux * 2.1; /* in front of you as you come round, a step to one side of the way to the village */ maren = Village.makeNpc(98, 'traveller', mx, mz, 'Maren', null, gy(mx, mz, c.y), 'shore'); maren.wander = false; maren.tag = 'net-maker'; maren.onTalk = talk; Village.addLoose(maren); }
    if (s.stage <= 1 && !three.length) { const sts = KIN.starters(G.baseSeed), sp = bankSpots() || spots(); const at = [1, 0, 2]; three = sts.map((q, i) => ent(q, sp[at[i]][0], sp[at[i]][1])); /* the tadpole gets the bank */ } }

  function say(lines, done) { G.talkNpc = maren; Dialogue.show('Maren', lines, done); }
  function wake() { const tn = G.village && G.village.name ? G.village.name : 'the village';
    say(['Easy. Easy now. You are breathing, and that is the main thing.',
      'I am Maren. I pulled you out of this brook at first light. No pack, no boots, and you had hold of a log like it owed you money.',
      'Do you know your name? ... No. I thought not. It comes back, mostly. Do not chase it.',
      `Then I will tell you where you are instead. This is the forest below ${tn}. That is its smoke, over the trees. I am its net-maker. Or I was, until three nights ago.`,
      'A brute called Grakor walked in with a pack of beasts at his heel and shut everyone indoors. I got out. Nobody else did.',
      'His beasts are Kin. So is every creature in this country. Each has an element and a temper of its own, and one that takes to you will walk with you and fight beside you. That is how he took the village, and it is the only way anyone takes it back.',
      'I cannot do it. They know my face in there. You they have never seen. But you would not last a minute against him alone. You need a Kin of your own first.',
      'So. The night he came I cut the pens open, and three young ones followed me out. They are right here along the brook, keeping their distance from me. I smell of the pens.',
      'Take this bread and go and meet them. Watch how each one carries on: that is its temper talking. Whichever takes the bread from you is yours, and you are its. Then come back to me.'],
      () => { const p = G.player; p.add('bread', 1); S().stage = 1; UI.sfx('gift'); const hb = p.hotbar(), i = hb.indexOf('bread'); if (i >= 0) p.sel = i; UI.renderHotbar(); pulseBar();
        G.explain('Bread', 'Maren put bread in your hand. The bar at the bottom shows what you are holding, and the arrows either side of it switch between your things. It is on the bread now. Walk to the brook, go up to one of the three Kin and tap it to offer the bread.'); }); }
  /* the bar at the bottom throbs for a few seconds, so a first-timer sees where the thing went */
  function pulseBar() { const hb = document.getElementById('hotbar'); if (!hb) return; hb.style.transition = 'box-shadow .35s, transform .35s'; let n = 0; const iv = setInterval(() => { const on = n % 2 === 0; hb.style.boxShadow = on ? '0 0 0 3px #ffd45a, 0 0 22px 6px rgba(255,212,90,.8)' : ''; hb.style.transform = (hb.style.transform || '').replace(/ ?scale\([^)]*\)/, '') + (on ? ' scale(1.08)' : ''); if (++n > 9) { clearInterval(iv); hb.style.boxShadow = ''; hb.style.transform = (hb.style.transform || '').replace(/ ?scale\([^)]*\)/, ''); } }, 380); }
  function sendOff() { const k = G.kin[0], nm = k ? KIN.name(k) : 'That one';
    say([`Well. ${nm}. I would have bet on one of the others.`,
      'The other two have run for the village, looking for their own. Grakor\'s lot will have them penned by dark. So now there are three reasons to go.',
      'But one young Kin against his pack is thin. You want a second before you face him, and for that you need one of these. A net. Hushweave, my own make.',
      'It does not hold a Kin by force, nothing would hold the big ones. It quiets them, like a cloth over a horse\'s eyes, and a quiet Kin makes up its own mind to stay.',
      `It only works on one that is worn out. So walk out into the forest until a wild one comes at you, and let ${nm} deal with it. When it goes down it lies dazed for a few breaths. Tap it then.`,
      'The rest is in the wrist. Draw circles to swing the net open. Flick it up at the Kin. As it lands, swirl the other way to draw it shut.',
      'One more thing. When you have caught one, come back to me before you go near the village. A fight leaves a Kin hurt, and I will show you how to mend them.'],
      () => { const p = G.player; p.add('snare', 1); S().stage = 3; UI.sfx('gift'); pulseBar(); UI.toast('Maren gave you a Cast Net.', 'good'); }); }
  function healTalk() { const k = G.kin[0], nm = k ? KIN.name(k) : 'your Kin';
    say(['You got one. Good. Now look at them: every fight costs a Kin some of its health, and one that runs out faints and is no use to you until it is mended.',
      'There are two ways. The first is this fire. Tap it and rest: you and every Kin you carry wake up whole. It costs nothing, and any camp fire will do it.',
      'The second is for when you are far from a fire. A heal tonic. Take these two. Pick the tonic in your bar, tap the screen, and choose the Kin to give it to.',
      `Check on them under Kin, at the top of the screen. Keep ${nm} on its feet and the rest follows. Now go: follow the smoke. He sits in the square.`],
      () => { const p = G.player; p.add('tonic_heal', 2); S().healed = true; UI.sfx('gift'); pulseBar(); UI.toast('Maren gave you 2 Heal Tonics.', 'good'); }); }
  function talk() { const s = S(); if (!s) return; if (s.stage === 0) return wake(); if (s.stage === 2) return sendOff();
    if (s.stage === 1) return say(['All three are on the banks of the brook, a few steps from the water. A shy one you creep up on. A cross one you let come to you: stand near and keep still. A sleepy one only wants the bread.']);
    if (!s.healed && ((G.stats.caught || 0) > 0 || G.kin.length + G.box.length >= 2)) return healTalk();
    { const rd = Object.keys(G.stats.stonesRead || {}).length; if (rd > 0 && !s.toldStones) { s.toldStones = true; return say(['You read one of the old stones? Read it. Not looked at it.', 'Nobody reads those. My grandmother could pick out two letters, and she was the last. They are the weavers\' stones: the ones who made the first hush.', 'I pulled you out of the water with nothing on you and no name. And you can read a script that has been dead a thousand years.', 'Find the rest. There are fourteen, they say. I would like to know who I fished out.']); }
      if (G.stats.stonesDone && !s.toldSeal) { s.toldSeal = true; return say(['Where did you get that. No, do not tell me. I know that knot. It is the one my hands tie without my asking them to.', 'Every net I have ever made ends in it and I never knew what it was for. You have just handed me the reason.', 'The road under the sea, then. Go and see who is at the end of it. I think they have been expecting you for a very long time.']); } }
    if (!G.stats.villageFreed && !(G.stats.caught > 0)) return say(['The net? Let a wild Kin come at you and let yours beat it. It lies dazed a few breaths: tap it then.', 'Draw circles to swing the net open, flick it up at the Kin, and swirl the other way as it lands to shut it. Or creep up behind one that has not seen you, and the Net button shows.', G.player.has('snare') || G.player.has('snare2') ? 'If you miss, the net comes back to you. Take your time.' : 'Lost yours? Here, another.'], () => { if (!G.player.has('snare') && !G.player.has('snare2')) G.player.add('snare', 1); });
    say(G.stats.villageFreed ? ['They have let me back into the weaving shed. I like the fire better. Your two friends are in the square, fat as butter.'] : ['Still here. The fire is in. Sit by it if you are hurt.']); }

  function emote(e, ch, col) { if (!R.project) return; const q = R.project(e.x, e.y + (e.model.height || 1) + 0.5, e.z); if (!q || !q.on) return; const el = document.createElement('div'); el.textContent = ch; el.style.cssText = `position:fixed;z-index:7;left:${q.x}px;top:${q.y}px;transform:translate(-50%,-100%);font:900 26px/1 system-ui,sans-serif;color:${col || '#fff'};text-shadow:0 0 3px #1a1420,0 2px 0 #1a1420,2px 0 0 #1a1420,-2px 0 0 #1a1420;pointer-events:none;transition:transform 1.3s ease-out,opacity 1.3s ease-in;`; document.body.appendChild(el); requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-260%)'; el.style.opacity = '0'; }); setTimeout(() => el.remove(), 1400); }
  const turn = (e, ty, k) => { let d = ty - e.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; e.yaw += d * Math.min(1, k); };
  function go(e, dt, sp) { const dx = e.tx - e.x, dz = e.tz - e.z, d = Math.hypot(dx, dz); if (d < 0.25) return false; const st = Math.min(d, sp * dt), nx = e.x + dx / d * st, nz = e.z + dz / d * st; if (dry(nx, nz, e.y) == null) { e.tx = e.x; e.tz = e.z; return false; } e.x = nx; e.z = nz; turn(e, Math.atan2(dx, dz), dt * 10); return true; }
  function ready(e, p, d) { if (d > 3.2) return false; if (e.temper === 1) return e.fled <= 0; if (e.temper === 2) return e.still > 2.2; return true; }
  function each(e, dt, p) { const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz), pv = Math.hypot(p.vx, p.vz), fy = Math.atan2(dx, dz); e.t += dt; e.bob += dt; if (e.fled > 0) e.fled -= dt; if (e.say > 0) e.say -= dt;
    const moving = go(e, dt, e.run || 2.2); if (!moving) e.run = 0;
    if (e.temper === 1) { /* shy: bolts from anyone walking up on it upright */ if (d < 6.5 && !p.sneak && pv > 0.5 && e.fled <= 0.6) { const a = Math.atan2(e.x - p.x, e.z - p.z) + (Math.random() - 0.5) * 1.6; let tx = e.x + Math.sin(a) * 5.5, tz = e.z + Math.cos(a) * 5.5; if (Math.hypot(tx - e.hx, tz - e.hz) > 6) { tx = e.hx + (Math.random() - 0.5) * 6; tz = e.hz + (Math.random() - 0.5) * 6; } e.tx = tx; e.tz = tz; e.run = 7; if (e.fled <= 0) emote(e, '!', '#ffe08a'); e.fled = 1.6; } else if (!moving && d < 12) turn(e, fy, dt * 3); }
    else if (e.temper === 2) { /* cross: backs off if you march at it, comes over if you stand and wait */ if (d < 4.5 && pv > 2.6 && !moving) { e.tx = e.x - dx / d * 3; e.tz = e.z - dz / d * 3; e.run = 5; e.still = 0; if (!(e.say > 0)) { emote(e, '💢', '#ff8a70'); e.say = 2; } } else if (d < 6 && pv < 0.4) { e.still += dt; if (d > 2.2 && e.still > 1) { e.tx = p.x - dx / d * 0.2 + (e.x - p.x) / d * 2; e.tz = p.z + (e.z - p.z) / d * 2; e.run = 1.3; } } else if (pv > 1.2) e.still = Math.max(0, e.still - dt * 2); if (!moving && d < 12) turn(e, fy, dt * 4); if (d < 14 && d > 4.5 && !(e.say > 0)) { emote(e, '💢', '#ff8a70'); e.say = 6; } }
    else if (e.temper === 3) { /* bright: cannot wait, comes bounding over */ if (d < 10 && d > 2.4) { e.tx = p.x - dx / d * 2; e.tz = p.z - dz / d * 2; e.run = 5; } else if (d <= 2.4) { turn(e, fy, dt * 6); e.hop = (e.hop || 0) + dt; } if (d < 10 && !(e.say > 0)) { emote(e, '♪', '#9fe8a0'); e.say = 5; } }
    else if (e.temper === 4) { /* drowsy: asleep until you are on top of it */ if (e.sleep && d < 2.6) { e.sleep = false; emote(e, 'z', '#bcd0ff'); } if (!e.sleep) turn(e, fy, dt * 1.5); else if (!(e.say > 0) && d < 12) { emote(e, 'z', '#bcd0ff'); e.say = 3.5; } }
    else { if (d < 12) turn(e, fy, dt * 3); }
    const g = gy(e.x, e.z, e.y); e.y += (g - e.y) * Math.min(1, dt * 10); e.hover = (e.model.hover || 0) + (e.temper === 3 && d <= 2.6 ? Math.abs(Math.sin(e.t * 7)) * 0.22 : 0);
    if (!e._an) return; e._an.look = 0; }
  function update(dt, p) { const s = S(); if (!s || G.worldId !== 'earth' || !G.camp) return; const c = G.camp, dc = Math.hypot(p.x - c.x, p.z - c.z);
    if (dc < 70 && (!maren || (s.stage <= 1 && !three.length))) build();
    if (maren && dc < 30) { const dx = p.x - maren.x, dz = p.z - maren.z; if (Math.hypot(dx, dz) < 9) maren.yaw = Math.atan2(dx, dz); }
    if ((s.stage === 0 || s.stage === 2) && !Dialogue.active() && !G.paused && !Battle.active) { const tut = document.getElementById('tutorial'); if (!tut || tut.classList.contains('hidden')) { auto -= dt; if (auto <= 0) { auto = 1.4; if (s.stage === 0) wake(); else if (dc < 40) sendOff(); } } }
    if (s.stage < 2 && dc < 90) { for (const e of Wild.list.slice()) if (!e.isBoss && Math.hypot(e.x - c.x, e.z - c.z) < 46) Wild.remove(e); } /* until you have a Kin, nothing wild comes near the camp: the three by the brook are the only creatures here */
    if (s.stage === 1) for (const e of three) each(e, dt, p);
    for (let i = gone.length - 1; i >= 0; i--) { const e = gone[i]; e.t += dt; go(e, dt, 7.5); const g = gy(e.x, e.z, e.y); e.y += (g - e.y) * Math.min(1, dt * 10); if (e.t > 2.4) e.scale = Math.max(0, 1 - (e.t - 2.4) / 0.5); if (e.t > 2.9) gone.splice(i, 1); }
    if (s.stage === 3 && G.stats.villageFreed && s.held && G.village) friends(dt, p);
    if (armed && (armed.t -= dt) <= 0) armed = null; }
  // the two you did not take: once the village is free they live in the square
  let pals = null;
  function friends(dt, p) { const v = G.village; if (Math.hypot(p.x - v.x, p.z - v.z) > 60) { pals = null; return; } if (!pals) { const sts = KIN.starters(G.baseSeed); pals = S().held.map((i, n) => { const e = ent(sts[i], v.x + 3 - n * 6, v.z + 3); e.y = gy(e.x, e.z, v.y || p.y); e.pal = true; return e; }); }
    for (const e of pals) { e.t += dt; e.bob += dt; if (!go(e, dt, 1.4) && (e.wait = (e.wait || 2) - dt) <= 0) { e.wait = 2 + Math.random() * 4; e.tx = e.hx + (Math.random() - 0.5) * 7; e.tz = e.hz + (Math.random() - 0.5) * 7; } const g = gy(e.x, e.z, e.y); if (Math.abs(g - e.y) < 1.6) e.y += (g - e.y) * Math.min(1, dt * 10); else { e.tx = e.hx; e.tz = e.hz; } } }
  function near(p, list) { const f = U.forwardVec(p.yaw, 0); let best = null, bd = 3.6; for (const e of list) { const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz); if (d < bd && (d < 1.2 || (dx * f[0] + dz * f[2]) / d > -0.25)) { bd = d; best = e; } } return best; }
  const HINT = ['', 'It bolts if you walk up on it. Creep: hold sneak and come slowly.', 'It will not be marched at. Stand near it, keep still, and let it come to you.', '', ''];
  function tap(p) { const s = S(); if (!s) return false; if (s.stage === 3 && pals) { const e = near(p, pals); if (e) { UI.toast(`${KIN.name(e.kin)} knows you from the brook, and comes to have its head scratched.`); emote(e, '♥', '#ff9ab8'); return true; } return false; }
    if (s.stage !== 1) return false; const e = near(p, three); if (!e) return false; const nm = KIN.name(e.kin), d = Math.hypot(e.x - p.x, e.z - p.z);
    if (!ready(e, p, d)) { UI.toast(HINT[e.temper] || `${nm} is not sure of you yet. Get closer.`); return true; }
    if (!armed || armed.e !== e) { armed = { e, t: 7 }; emote(e, '?', '#fff'); UI.toast(`${nm}, a ${TEMP[e.temper]} one, sniffs at the bread. Tap again to share it. This is the one you take with you.`, 'good'); return true; }
    armed = null; const idx = three.indexOf(e); if (p.has('bread', 1)) p.take('bread', 1); e.kin.bond = 0.2; G.kin.push(e.kin); G.activeIdx = 0; if (G.seenDex) G.seenDex(e.kin.sp, 'caught'); emote(e, '♥', '#ff9ab8'); UI.sfx('caught');
    const v = G.village; s.held = [0, 1, 2].filter(i => i !== idx); s.pick = idx; for (const o of three) if (o !== e) { o.t = 0; o.tx = o.x + (v.x - o.x) * 0.5; o.tz = o.z + (v.z - o.z) * 0.5; const l = Math.hypot(o.tx - o.x, o.tz - o.z) || 1; o.tx = o.x + (o.tx - o.x) / l * 24; o.tz = o.z + (o.tz - o.z) / l * 24; o.sleep = false; gone.push(o); }
    three = []; s.stage = 2; auto = 2.2; UI.toast(`${nm} takes the bread, then your sleeve. ${nm} is with you.`, 'good'); return true; }
  function entities() { const out = []; for (const e of three) out.push(e); for (const e of gone) out.push(e); if (pals && S() && S().stage === 3) for (const e of pals) out.push(e); return out; }
  const quiet = (x, z) => { const s = S(); return !!(s && s.stage < 2 && G.camp && Math.hypot(x - G.camp.x, z - G.camp.z) < 52); };
  return { init, begin, brook, update, tap, entities, quiet, get three() { return three; }, get maren() { return maren; } };
})();
