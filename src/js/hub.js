'use strict';
// The Starwell. Professor Finch could not let you go up alone, so he flew up behind you, and this is where he set down: the Moon folk's old
// reactor, a walled ground the size of a town with a glass sphere held over a well in the middle of it. It drank the Starfall and lit every
// dome on the Moon, and lit, it throws a road of light as far as Halo. The Kinmaster's garrison pulled its four hearts so that nobody but
// him could make that crossing. The Starlark lands here and leaves from here. Each heart is the prize of a test, you seat them in the
// sockets round the well yourself, and when the fourth goes in the way to Halo is open.
const Hub = (() => {
  let G = null, site = null, siteW = null, prof = null, hands = [], greetAt = 0, tick = 0;
  const R0 = 42, WALLH = 3, PADZ = 26, CORE_R = 6.2, SPH_Y = 15, SPH_R = 6.5;
  const PARTS = [
    { id: 'reg', item: 'hub_reg', name: 'Regulator', at: [9, 9], how: 'The Regulator. Commander Hask keeps it on his table as a paperweight. He will not post it to you. Take the Garrison.' },
    { id: 'coil', item: 'hub_coil', name: 'Glide Coil', at: [-9, 9], how: 'The Glide Coil. The Glide crews hid it from him the night the garrison landed, and they will not bring it out for a stranger. Free two places up here and they will know whose side you are on.' },
    { id: 'key', item: 'hub_key', name: 'Signal Key', at: [-9, -9], how: 'The Signal Key. That lamp game they play in every square is the Starwell\'s own start-up run, taught to children so it could never be lost. Beat a town champion at Signal and they will trust you with the key.' },
    { id: 'dust', item: 'hub_dust', name: 'Dust Heart', at: [9, -9], how: 'The Dust Heart I can blow myself, if you bring me four measures of Stardust. Ladle it from the catch bowls outside any free town, the day of a Starfall or the day after.' }];
  const S = () => { const s = (G.stats.hub = G.stats.hub || {}); s.got = s.got || {}; s.in = s.in || {}; return s; };
  const onMoon = () => !!(G && G.worldId === 'moon' && G.world && G.world.preset.id === 'moon');
  const haloOpen = () => !!(G && ((G.stats.hub || {}).lit || (G.stats.reached || {}).halo));
  /* it stands where you land: the pad the Starlark comes down on is its south apron. An old save keeps the pad it already has, and the ground is levelled to that */
  function find() { const w = G && G.world; if (!w) return null; if (siteW === w && site) return site; if (!onMoon() || !w.spawn) return null;
    const sx = Math.floor(w.spawn.x), sz = Math.floor(w.spawn.z); let y; if (w.pad) y = Math.round(w.pad.y) - 1; else { try { y = w.colInfo(sx, sz).h; } catch (e) { return null; } }
    /* the pad stays where the ship comes down. The Starwell goes on whichever side of it keeps clear of the Glide line: north, east, south or west */
    let best = null; for (let k = 0; k < 4; k++) { const o = turn(k, 0, PADZ), cx = sx - o[0], cz = sz - o[1]; let n = 0; if (w.trackAt) for (let dx = -R0 - 3; dx <= R0 + 3; dx += 2) for (let dz = -R0 - 3; dz <= R0 + 3; dz += 2) if (Math.hypot(dx, dz) < R0 + 3 && w.trackAt(cx + dx, cz + dz)) n++; if (!best || n < best.n) best = { x: cx, z: cz, y, k, n }; if (!n) break; }
    siteW = w; site = best; return site; }
  const turn = (k, x, z) => k === 1 ? [z, -x] : k === 2 ? [-x, -z] : k === 3 ? [-z, x] : [x, z]; /* the plan is drawn with the pad to the south; this turns a point of it to wherever the pad really is */
  const gate = (dx, dz) => { const d = Math.hypot(dx, dz), a = Math.atan2(dx, dz), q = Math.round(a / (Math.PI / 2)) * (Math.PI / 2); return Math.abs(a - q) * d < 3.3; };
  const FEET = [[0, 13], [13, 0], [0, -13], [-13, 0]], DISH = 8, DISH_R = 32;
  const dishAt = (i) => { const a = (i + 0.5) / DISH * 6.2832; return [Math.round(Math.sin(a) * DISH_R), Math.round(Math.cos(a) * DISH_R)]; };
  function overlay(chunk) { if (!G || !G.world || G.world.preset.id !== 'moon') return; const s = find(); if (!s) return; const ox = chunk.cx * CH, oz = chunk.cz * CH, M = R0 + 11; if (ox + CH < s.x - M || ox > s.x + M || oz + CH < s.z - M || oz > s.z + M) return;
    const bl = chunk.blocks, put = (wx, y, wz, id) => { const lx = wx - ox, lz = wz - oz; if (lx >= 0 && lx < CH && lz >= 0 && lz < CH && y > 0 && y < WH) bl[(lx * CH + lz) * WH + y] = id; };
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) { const dx = ox + lx - s.x, dz = oz + lz - s.z, d = Math.hypot(dx, dz); if (d > R0 + 9.5) continue; const base = (lx * CH + lz) * WH;
      if (d <= R0 + 0.5) { for (let y = Math.max(1, s.y - 8); y < s.y; y++) if (bl[base + y] === B.AIR) bl[base + y] = B.BASALT; bl[base + s.y] = B.BASALT; for (let y = s.y + 1; y <= s.y + 44 && y < WH; y++) bl[base + y] = B.AIR;
        if (d > R0 - 1.5 && !gate(dx, dz)) for (let y = s.y + 1; y <= s.y + WALLH; y++) bl[base + y] = B.IRONWALL;
        if (d <= CORE_R) bl[base + s.y + 1] = B.IRONWALL; /* the cover of the well */
      } else { /* the land outside is brought up or down to meet the deck over nine blocks, so the wall never stands in a pit or under a cliff */
        let top = -1, id = B.REGOLITH; for (let y = WH - 1; y > 0; y--) { const b = bl[base + y]; if (b !== B.AIR) { top = y; id = b; break; } } if (top < 0) continue; const T = Math.round(s.y + (top - s.y) * U.clamp((d - R0 - 0.5) / 9, 0, 1));
        if (top > T) { for (let y = T + 1; y <= top; y++) bl[base + y] = B.AIR; if (bl[base + T] !== B.AIR) bl[base + T] = id; } else if (top < T) for (let y = top + 1; y <= T; y++) bl[base + y] = id; } }
    for (const [fx, fz] of FEET) for (let y = 1; y <= 4; y++) put(s.x + fx, s.y + y, s.z + fz, B.IRONWALL);
    for (const q of PARTS) put(s.x + q.at[0], s.y + 1, s.z + q.at[1], B.IRONWALL);
    for (let i = 0; i < DISH; i++) { const [x, z] = dishAt(i); put(s.x + x, s.y + 1, s.z + z, B.IRONWALL); put(s.x + x, s.y + 2, s.z + z, B.IRONWALL); }
    { const c = turn(s.k, 6, 17); put(s.x + c[0], s.y + 1, s.z + c[1], B.IRONWALL); } }
  /* ---- how it looks ---- */
  function mesh(s) { const st = S(), lit = !!st.lit, mask = PARTS.map(q => st.in[q.id] ? 1 : 0).join('');
    return R.entityMesh('hub4:' + (lit ? 1 : 0) + ':' + mask + ':' + s.k, (mb) => { const tp = (x, z) => turn(s.k, x, z); const K = Sky.kit(mb), hull = [0.84, 0.86, 0.9], dark = [0.2, 0.22, 0.28], trim = [0.55, 0.6, 0.7], cy = [0.5, 0.98, 1.0], gold = [1.0, 0.86, 0.5], dim = [0.2, 0.26, 0.34], N = 96, up = [0, 1, 0], U4 = [up, up, up, up], glow = lit ? gold : cy;
      const gap = (i) => { const a = (i + 0.5) / N * 6.2832, x = Math.cos(a) * R0, z = Math.sin(a) * R0; return gate(x, z); };
      const arc = (r0, r1, a0, a1, y, col, em, n) => { n = n || 12; for (let i = 0; i < n; i++) { const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n; K.q([[Math.cos(b0) * r0, y, Math.sin(b0) * r0], [Math.cos(b1) * r0, y, Math.sin(b1) * r0], [Math.cos(b1) * r1, y, Math.sin(b1) * r1], [Math.cos(b0) * r1, y, Math.sin(b0) * r1]], col, em, U4); } };
      /* the wall: a dark footing that goes well down, a pale course over it, a band of lights, a pylon every so often, and four open gates with posts */
      K.prism(K.circ(0, 0, R0 + 0.95, N), -7, 0.9, 0.6, 0, dark, { course: 1.3, skip: gap, flat: true }); K.prism(K.circ(0, 0, R0 + 0.95, N), 0.9, WALLH + 0.3, 0, -0.3, hull, { course: 1.2, seed: 3, skip: gap }); K.prism(K.circ(0, 0, R0 - 1.95, N), 0, WALLH + 0.3, 0, 0, K.sh(hull, 0.82), { course: 1.5, seed: 4, skip: gap, inside: true });
      for (let i = 0; i < N; i++) { if (gap(i)) continue; const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832, r0 = R0 - 1.95, r1 = R0 + 0.65; K.q([[Math.cos(a0) * r0, WALLH + 0.3, Math.sin(a0) * r0], [Math.cos(a1) * r0, WALLH + 0.3, Math.sin(a1) * r0], [Math.cos(a1) * r1, WALLH + 0.3, Math.sin(a1) * r1], [Math.cos(a0) * r1, WALLH + 0.3, Math.sin(a0) * r1]], trim, false, U4);
        const am = (a0 + a1) / 2; if (i % 2 === 0) K.slit(Math.cos(am) * (R0 + 0.82), 1.9, Math.sin(am) * (R0 + 0.82), Math.cos(am), Math.sin(am), 0.3, 0.16, glow);
        if (i % 8 === 4) { const x = Math.cos(am) * (R0 - 0.6), z = Math.sin(am) * (R0 - 0.6); K.drum(x, z, WALLH + 0.3, WALLH + 5.2, 0.26, 0.14, trim, { N: 8, course: 2.5 }); K.gem(x, WALLH + 5.6, z, 0.26, 0.34, glow); } }
      for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { const a = k * 1.5708 + sd * (3.6 / R0), x = Math.cos(a) * (R0 - 0.5), z = Math.sin(a) * (R0 - 0.5); K.drum(x, z, -0.2, WALLH + 2.2, 1.25, 0.95, hull, { N: 10, course: 1.3, seed: 6 }); K.cap(K.circ(x, z, 0.95, 10), WALLH + 2.2, trim, true); K.gem(x, WALLH + 2.8, z, 0.26, 0.36, glow); }
      /* the deck: rings and spokes let into it. Each quarter of the inner ring lights when its heart is seated */
      arc(R0 - 4.2, R0 - 3.7, 0, 6.2832, 0.03, trim, false, 96); arc(22.6, 23.0, 0, 6.2832, 0.03, trim, false, 72);
      PARTS.forEach((q, i) => { const a = Math.atan2(q.at[1], q.at[0]), on = !!st.in[q.id]; arc(15.2, 16.0, a - 0.74, a + 0.74, 0.04, on ? gold : dim, on, 14);
        const r0 = Math.hypot(q.at[0], q.at[1]) + 1.3, c = Math.cos(a), sn = Math.sin(a), w = 0.22; K.q([[c * 7.3 - sn * w, 0.04, sn * 7.3 + c * w], [c * r0 - sn * w, 0.04, sn * r0 + c * w], [c * r0 + sn * w, 0.04, sn * r0 - c * w], [c * 7.3 + sn * w, 0.04, sn * 7.3 - c * w]], on ? gold : dim, on, U4);
        /* the socket: a plinth with a collar. Empty it is a dark mouth; seated, the heart stands up out of it and burns */
        K.drum(q.at[0], q.at[1], 0, 1.15, 1.25, 1.05, hull, { N: 12, course: 0.6, seed: 11 + i }); K.cap(K.circ(q.at[0], q.at[1], 1.05, 12), 1.15, on ? trim : K.sh(dark, 0.5), true); K.drum(q.at[0], q.at[1], 1.15, 1.4, 0.62, 0.62, trim, { N: 10, course: 9, flat: true });
        if (on) { K.drum(q.at[0], q.at[1], 1.4, 2.9, 0.34, 0.26, gold, { N: 8, course: 9, flat: true, em: true }); K.gem(q.at[0], 3.2, q.at[1], 0.36, 0.5, [1, 1, 0.9]); } });
      /* the well and what hangs over it */
      K.drum(0, 0, 0, 1.45, 7.3, 6.9, dark, { N: 28, course: 0.7, flat: true }); K.cap(K.circ(0, 0, 6.9, 28), 1.45, lit ? gold : K.sh(dark, 0.45), true); if (lit) K.drum(0, 0, 1.45, 1.6, 5.2, 5.2, [1, 1, 0.92], { N: 24, course: 9, flat: true, em: true });
      K.drum(0, 0, 1.2, 1.5, 7.32, 7.32, glow, { N: 28, course: 9, flat: true, em: true });
      const ball = lit ? [1.0, 0.93, 0.7] : [0.2, 0.27, 0.42]; for (let j = 0; j < 12; j++) { const p0 = -1.5708 + j / 12 * 3.1416, p1 = -1.5708 + (j + 1) / 12 * 3.1416; K.drum(0, 0, SPH_Y + Math.sin(p0) * SPH_R, SPH_Y + Math.sin(p1) * SPH_R, Math.max(0.05, Math.cos(p0) * SPH_R), Math.max(0.05, Math.cos(p1) * SPH_R), lit ? ball : K.sh(ball, 0.8 + 0.4 * (j / 12)), { N: 26, course: 99, flat: true, em: lit }); }
      K.drum(0, 0, SPH_Y - 0.35, SPH_Y + 0.35, SPH_R + 1.7, SPH_R + 1.7, trim, { N: 30, course: 9, flat: true }); arc(SPH_R + 0.2, SPH_R + 1.7, 0, 6.2832, SPH_Y + 0.35, trim, false, 30); K.drum(0, 0, SPH_Y - 0.12, SPH_Y + 0.12, SPH_R + 1.74, SPH_R + 1.74, glow, { N: 30, course: 9, flat: true, em: true });
      for (const [fx, fz] of FEET) { const l = Math.hypot(fx, fz), ux = (fx + 0) / l, uz = fz / l, P = (r, y) => [ux * r, y, uz * r]; /* four arms that come up off the deck, take the ring, and lean in over the top */
        mb.tube([P(13, 0), P(12.6, 5), P(10.4, 11), P(SPH_R + 1.9, SPH_Y), P(SPH_R + 1.2, SPH_Y + 6), P(4.2, SPH_Y + 10.5), P(1.4, SPH_Y + 12.6)], [1.55, 1.2, 0.95, 0.8, 0.62, 0.42, 0.16], hull, { segs: 10, cap0: 'flat' }); mb.blob(P(13, 0)[0] - 2, 0, P(13, 0)[2] - 2, P(13, 0)[0] + 2, 0.5, P(13, 0)[2] + 2, 0.9, dark, { n: 3 });
        const g = P(12.75, 4.2); mb.blob(g[0] - 0.3, g[1] - 0.3, g[2] - 0.3, g[0] + 0.3, g[1] + 0.3, g[2] + 0.3, 1, glow, { n: 2, emis: true }); }
      mb.blob(-0.9, SPH_Y + 12, -0.9, 0.9, SPH_Y + 13.8, 0.9, 1, lit ? [1, 1, 0.9] : trim, { n: 3, emis: lit });
      if (lit) { mb.tube([[0, SPH_Y + 13, 0], [1.5, SPH_Y + 60, 4], [5, SPH_Y + 130, 14]], [0.55, 0.4, 0.12], [1, 0.96, 0.8], { segs: 8, emis: true }); mb.tube([[0, 1.5, 0], [0, SPH_Y - SPH_R, 0]], [1.1, 0.5], [1, 0.95, 0.75], { segs: 10, emis: true }); } /* the road of light, leaning off toward the ring, and the column the well feeds up into the sphere */
      /* the catch dishes round the rim, each on a stem with a pipe run in to the well */
      for (let i = 0; i < DISH; i++) { const [x, z] = dishAt(i), X = x, Z = z, l = Math.hypot(X, Z), ux = X / l, uz = Z / l, T = (r, y) => [X + ux * r, y, Z + uz * r];
        mb.tube([[X, 0, Z], [X, 0.4, Z], [X, 4.2, Z], [X, 5.2, Z]], [1.5, 0.75, 0.55, 0.8], hull, { segs: 12, cap0: 'flat' }); mb.tube([T(0, 5.0), T(-0.5, 5.6), T(-1.6, 6.7), T(-2.6, 7.6), T(-3.2, 8.0)], [0.9, 2.6, 4.6, 5.6, 5.75], hull, { segs: 20 }); mb.tube([T(-3.2, 8.0), T(-2.9, 7.8), T(-1.8, 6.9)], [5.7, 5.2, 3.4], K.sh(dim, lit ? 2.4 : 1), { segs: 20, cap1: 'flat', emis: lit });
        mb.tube([T(-1.4, 0.16), [ux * 23, 0.16, uz * 23], [ux * 7.4, 0.16, uz * 7.4]], [0.2, 0.2, 0.2], lit ? gold : dim, { segs: 6, emis: lit }); }
      /* the landing pad on the south apron, ringed with lamps, and the professor's desk beside the way in from it */
      const pc = tp(0, PADZ); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832, x = pc[0] + Math.cos(a) * 7.6, z = pc[1] + Math.sin(a) * 7.6; K.drum(x, z, 0, 0.5, 0.2, 0.16, dark, { N: 6, course: 9, flat: true }); K.gem(x, 0.62, z, 0.16, 0.22, glow); }
      { const p = K.circ(pc[0], pc[1], 6.6, 40); for (let i = 0; i < 40; i++) { const a = p[i], b = p[(i + 1) % 40], a1 = [pc[0] + (a[0] - pc[0]) * 1.06, pc[1] + (a[1] - pc[1]) * 1.06], b1 = [pc[0] + (b[0] - pc[0]) * 1.06, pc[1] + (b[1] - pc[1]) * 1.06]; K.q([[a[0], 0.035, a[1]], [b[0], 0.035, b[1]], [b1[0], 0.035, b1[1]], [a1[0], 0.035, a1[1]]], trim, false, U4); } }
      { const dk = tp(6, 17); K.drum(dk[0], dk[1], 0, 1.15, 0.95, 0.8, hull, { N: 10, course: 0.6, seed: 21 }); K.drum(dk[0], dk[1], 1.15, 1.3, 0.8, 0.8, glow, { N: 10, course: 9, flat: true, em: true }); K.cap(K.circ(dk[0], dk[1], 0.8, 10), 1.3, glow, true); } /* his desk: a drum with a lit top he reads off */
    }); }
  function entities() { if (!onMoon()) return []; const s = find(); if (!s || Math.hypot(G.player.x - s.x, G.player.z - s.z) > 300) return []; return [{ x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5, yaw: 0, scale: 1, hover: 0, skyMul: 1, isStatue: true, noOutline: true, wide: R0 + 2, mesh: mesh(s) }]; }
  /* ---- the people in it ---- */
  const say = (n, lines, done) => { G.talkNpc = n; Dialogue.show(n.name, lines, done); };
  const need = () => PARTS.filter(q => !S().in[q.id]);
  function profTalk() { const st = S(), n = prof, P = G.player;
    if (!st.greeted) return greet();
    if ((G.stats.arena || {}).last) return say(n, ['It is over. I felt it in the well before anybody told me: the whole thing sighed.', 'I am going to stay up here. Somebody has to keep it lit, and the Moon folk have promised to teach me the lamp game properly.']);
    if (st.lit) return say(n, ['Look at it. Look at it! Three thousand years old and it started first time.', 'The road is up. Take the Starlark above the clouds and choose Halo: she will ride the light all the way.', P.has('collar') ? 'You have Hask\'s collar. Good. The air out there is dust and it does not forgive.' : 'One thing. The air out there is dust. Hask wore a breather collar. Do not go without it.']);
    if (!st.got.dust && !st.in.dust && P.count('stardust') >= 4) return say(n, ['Four measures. Hold that. No, the other way up.', 'A little heat, a little breath, and there. A Dust Heart. It is warm because it is working, not because I dropped it.'], () => { P.take('stardust', 4); P.add('hub_dust', 1); st.got.dust = true; UI.sfx('gift'); UI.toast('Professor Finch has made you the Dust Heart. Seat it in its socket by the well.', 'good'); if (UI.renderHotbar) UI.renderHotbar(); });
    const carry = PARTS.filter(q => P.has(q.item)), left = need().filter(q => !P.has(q.item));
    if (carry.length) return say(n, ['You have the ' + carry.map(q => q.name).join(' and the ') + '. Do not stand there holding it, seat it! The sockets are round the well. Each one only takes its own.', left.length ? left.length + ' still to find. ' + left[0].how : 'That is all four. Go on. I want to see this.']);
    const lines = ['Four hearts, and four tests to earn them.']; for (const q of left) lines.push(q.how); say(n, lines); }
  function greet() { const st = S(), s = find(); if (!prof || !s) return; st.greeted = true; const P = G.player; P.yaw = Math.atan2(prof.x - P.x, prof.z - P.z);
    const lines = ['You made it! In one piece! I had the stretcher out, I will be honest with you.',
      'I could not let you come up here alone. So I bolted the test hull together and flew up behind you. Do not ask what I flew it on. It involved Garrick\'s kettle.',
      'This is the Starwell. The Moon folk built it before anyone at home had lit a fire. It drinks the Starfall, and it lit every dome on the Moon.',
      'It has been dark since his garrison came. They pulled its four hearts and scattered them. Because lit, it throws a road of light all the way to Halo, and he means to be the only one who can make that crossing.',
      'The Starlark cannot do it alone. I built her, I know. With the Starwell behind her, she can.',
      'The Kin up here have never had air. They talk in light: watch one a while before you net it and you can see it thinking. He is shipping them to Halo by the crate, to a ring where they are made to fight, and something out there is being fed on what is left.',
      'So. Four hearts. I know where each one went, and not one of them will be handed over for asking. Talk to me when you have your breath back and I will set you the tests.'];
    const done = () => UI.toast('The Starwell: Professor Finch\'s ground on the Moon. Light it and the way to Halo opens. Talk to him for the four tests.', 'good');
    try { Cine.tell('Professor Finch', { x: prof.x, y: prof.y, z: prof.z, faceY: 1.5, faceD: 3.4 }, { 1: [{ orbit: { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5, r: [38, 27], h: [20, 9], a: [2.6, 4.4], ly: 12 }, secs: 8, title: 'The Starwell', mood: 'free' }], 3: [{ orbit: { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5, r: [20, 15], h: [5, 9], a: [0.4, 1.5], ly: SPH_Y }, secs: 5, mood: 'dread' }] }, lines, done); } catch (e) { Dialogue.show('Professor Finch', lines, done); } }
  function light() { const st = S(), s = find(); st.lit = true; UI.sfx('quest'); const done = () => UI.toast('The Starwell is lit. A road of light leans off the Moon toward the ring: the Starlark can reach Halo now.', 'good');
    try { Cine.play([{ orbit: { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5, r: [16, 22], h: [4, 8], a: [0.6, 1.5], ly: SPH_Y }, secs: 4.5, shake: 0.8, sfx: 'fuse', mood: 'free', title: 'The fourth heart goes home' },
      { orbit: { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5, r: [24, 40], h: [8, 24], a: [1.5, 3.4], ly: 18 }, secs: 9, glow: 'gold', shake: 0.5, sfx: 'quest', title: 'The Starwell lights', flash: ['Every dome on the Moon comes on at once.', 'A road of light stands up off the grey and leans toward the ring.', 'Halo is open.'] },
      prof ? { say: ['Professor Finch', 'Ha! HA! Three thousand years old and it started first time! Go. Go on. She will ride it all the way.'], at: { x: prof.x, y: prof.y, z: prof.z, h: 1.5, d: 3.4 }, secs: 30 } : null], done); } catch (e) { done(); } }
  function people(s) { if (prof || !Village.makeNpc || !Village.addLoose) return; const y = s.y + 1;
    const pp = turn(s.k, 5, 20); prof = Village.makeNpc(95, 'traveller', s.x + pp[0] + 0.5, s.z + pp[1] + 0.5, 'Professor Finch', null, y, 'shore'); const sp = { shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: false }, colors: { accent: '#4a8ad0', dark: '#3a2a20', eye: '#222222', body: '#e8e8e0', belly: '#c9a87a' }, size: 1, gen: 0, names: ['person'] }, m = KIN.model(sp, 2); KIN.decorate(m, 'scientist'); KIN.decorate(m, 'professor');
    prof.model = m; prof.mesh = R.entityMesh('hub:prof', (mb) => KIN.buildMesh(mb, m)); prof.scale = 1; prof.wander = false; prof.tag = 'of the Starwell'; prof.onTalk = profTalk; prof.yaw = 0; Village.addLoose(prof);
    const HN = [['Wellhand Ioa', -14, 6, 'We kept the dishes clean the whole time it was dark. You do not stop sweeping a temple because the roof is off.', 'Lit. I was a child the last time. I had forgotten it hums.'], ['Wellhand Teth', 16, -12, 'The garrison took the hearts out in one night. It took our grandmothers a lifetime to seat them.', 'Hear that? That is every dome on the Moon saying thank you at once.'], ['Wellhand Miru', -20, -22, 'Your professor talks to the well. It does not answer. He says that is a matter of time.', 'He was right. It answered. Do not tell him I said so.']];
    HN.forEach((h, i) => { const n = Village.makeNpc(720 + i, 'villager', s.x + h[1] + 0.5, s.z + h[2] + 0.5, h[0], null, y, 'hub', 'alien', false); n.wander = false; n.tag = 'keeps the Starwell'; n.onTalk = () => say(n, [S().lit ? h[4] : h[3]]); n.yaw = Math.atan2(-h[1], -h[2]); Village.addLoose(n); hands.push(n); }); }
  function clear() { if (prof) { Village.dropLoose(prof); prof = null; } for (const n of hands) Village.dropLoose(n); hands = []; }
  /* ---- the tests, and the sockets ---- */
  function grant(id, text) { const st = S(), q = PARTS.find(x => x.id === id); if (st.got[id] || st.in[id]) return; st.got[id] = true; G.player.add(q.item, 1); UI.sfx('gift'); UI.toast(text, 'good'); if (UI.renderHotbar) UI.renderHotbar(); }
  function tests() { const st = S(); if (st.lit) return; if ((G.stats.reached || {}).halo) { st.lit = true; for (const q of PARTS) st.in[q.id] = true; return; } /* a game that had already been to Halo keeps its road */
    if (!st.greeted) return; const fw = (G.stats.freedW || {}).moon || {};
    if ((G.stats.garrison || {}).taken) grant('reg', 'Under the maps on Hask\'s table: the Starwell\'s Regulator. He was using it as a paperweight.');
    if ((fw.hamlet || 0) + (fw.town || 0) + (fw.city || 0) >= 2) grant('coil', 'A Glide crew is waiting for you with something wrapped in sailcloth: the Starwell\'s Glide Coil. "For the professor. Tell him we kept it dry."');
    if ((G.stats.signalWon || 0) >= 1) grant('key', 'The champion unscrews the top lamp of the Signal board and puts it in your hand. It is not a lamp. It is the Signal Key.'); }
  function sockNear(p) { const s = find(); if (!s) return null; for (const q of PARTS) if (Math.hypot(p.x - (s.x + q.at[0] + 0.5), p.z - (s.z + q.at[1] + 0.5)) < 2.7 && Math.abs(p.y - s.y - 1) < 4) return q; return null; }
  function label(p) { if (!onMoon()) return null; const q = sockNear(p); if (!q) return null; return S().in[q.id] ? q.name + ' · seated' : G.player.has(q.item) ? q.name + ' socket · tap to seat it' : q.name + ' socket · empty'; }
  function tap(p) { if (!onMoon()) return false; const q = sockNear(p); if (!q) return false; const st = S();
    if (st.in[q.id]) { UI.toast('The ' + q.name + ' is seated and humming.'); return true; }
    if (!G.player.has(q.item)) { UI.toast('This socket takes the ' + q.name + '. Professor Finch knows how it is to be won.'); return true; }
    G.player.take(q.item, 1); st.in[q.id] = true; UI.sfx('fuse'); if (UI.renderHotbar) UI.renderHotbar(); const left = need().length;
    if (left) UI.toast('The ' + q.name + ' drops home and its quarter of the ring comes alight. ' + left + ' to go.', 'good'); else light(); return true; }
  function update(dt, p) { if (!onMoon()) { if (prof) clear(); return; } const s = find(); if (!s) return; const d = Math.hypot(p.x - s.x, p.z - s.z);
    if (d > 150) { if (prof) clear(); return; } people(s);
    if (prof && Math.hypot(prof.x - p.x, prof.z - p.z) < 9) prof.yaw = Math.atan2(p.x - prof.x, p.z - prof.z);
    /* the first time you land he comes straight over: once the arrival is done and you are standing on his ground */
    if (!S().greeted && prof && d < R0 && !p.flying && !(typeof Cine !== 'undefined' && Cine.active()) && !Dialogue.active() && !Battle.active) { greetAt += dt; if (greetAt > 1.2) { greetAt = 0; greet(); } } else greetAt = 0;
    tick -= dt; if (tick <= 0) { tick = 2; tests(); } }
  function init(g) { G = g; site = null; siteW = null; prof = null; hands = []; greetAt = 0; tick = 0; }
  return { init, update, entities, overlay, tap, label, haloOpen, site: () => find(), tests, PARTS, get prof() { return prof; }, _greet: () => greet(), _light: () => light() };
})();
