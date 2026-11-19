'use strict';
// Little films. A list of beats played one after another with the bars up: a slow turn of the camera round a place with a title,
// somebody speaking with the view on them, or a memory: the picture goes brown and still and a few lines come up, one at a time.
// You can always skip. Nothing can touch you while one plays.
const Cine = (() => {
  let G = null, cur = null, el = null;
  function init(game) { G = game; stop(true); }
  const active = () => !!cur;
  function build() {
    el = document.createElement('div'); el.id = 'cine'; el.style.cssText = 'position:fixed;inset:0;z-index:46;touch-action:none;user-select:none;-webkit-user-select:none';
    el.innerHTML = '<div data-k="glow" style="position:absolute;inset:0;opacity:0;pointer-events:none"></div>'
      + '<div data-k="memo" style="position:absolute;inset:0;opacity:0;transition:opacity .7s;pointer-events:none;backdrop-filter:sepia(1) saturate(.7) brightness(.62) blur(1.5px);-webkit-backdrop-filter:sepia(1) saturate(.7) brightness(.62) blur(1.5px);background:radial-gradient(circle at 50% 45%,rgba(60,40,20,.15),rgba(20,12,4,.78));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:0 9vw;text-align:center;font:600 italic 18px/1.45 Georgia,serif;color:#f3e2c0;text-shadow:0 2px 6px #000"></div>'
      + '<div style="position:absolute;left:0;right:0;top:0;height:11vh;background:#000"></div><div style="position:absolute;left:0;right:0;bottom:0;height:11vh;background:#000"></div>'
      + '<div data-k="title" style="position:absolute;left:0;right:0;top:15vh;text-align:center;font:800 24px/1.2 system-ui,sans-serif;color:#fff3c8;text-shadow:0 2px 10px #000;opacity:0;transition:opacity .6s;padding:0 6vw"></div>'
      + '<div data-k="say" style="position:absolute;left:5vw;right:5vw;bottom:13vh;background:rgba(14,16,24,.9);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 14px;color:#f2f2f6;font:500 15px/1.4 system-ui,sans-serif;display:none"><div data-k="who" style="font:800 11px/1 system-ui,sans-serif;letter-spacing:.08em;color:#ffb347;margin-bottom:6px;text-transform:uppercase"></div><div data-k="text"></div><div style="text-align:right;font-size:11px;opacity:.55;margin-top:6px">tap to go on</div></div>'
      + '<button data-k="skip" style="position:absolute;right:10px;top:calc(11vh - 34px);background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:10px;padding:6px 12px;font:700 12px system-ui,sans-serif">Skip ▸</button>';
    const sty = document.createElement('style'); sty.textContent = '@keyframes cinecap{0%{opacity:0}14%{opacity:1}86%{opacity:1}100%{opacity:0}}'; document.head.appendChild(sty);
    document.body.appendChild(el);
    el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (!cur) return; if (ev.target && ev.target.dataset && ev.target.dataset.k === 'skip') { stop(); return; } const b = cur.beats[cur.i]; if (b && (b.say || b.flash) && cur.t > 0.45) next(); });
  }
  const q = (k) => el.querySelector('[data-k="' + k + '"]');
  /* beats: { orbit: { x, y, z, r: [from, to], h: [from, to], a: [from, to] }, secs, title, glow: 'gold' | 'violet' | 'red', sfx, mood }
            { say: [who, text], at: { x, y, z, h }, secs }   the view goes to `at` from your side; without it the last view holds
            { flash: [line, line, ...] }                      a memory
            { run: fn }                                       something happens in the world between two beats */
  function play(beats, done) { if (!G) return false; if (cur) { const d0 = cur.done; cur.done = () => { if (d0) d0(); play(beats, done); }; return true; } /* one at a time: a second film waits for the first */
    const p = G.player; cur = { beats: beats.filter(Boolean), i: -1, t: 0, done, third: G.thirdPerson, mood0: G.filmMood || null }; G.thirdPerson = true; if (!el) build(); el.style.display = 'block'; document.body.classList.add('cine-on'); if (typeof Dialogue !== 'undefined' && Dialogue.active() && Dialogue.close) Dialogue.close(); next(); return true; }
  function next() { if (!cur) return; cur.i++; cur.t = 0; const b = cur.beats[cur.i]; if (!b) { stop(); return; }
    if (b.run) { try { b.run(); } catch (e) { console.warn('cine run:', e.message); } next(); return; }
    if (b.sfx && typeof UI !== 'undefined') UI.sfx(b.sfx); if (b.mood !== undefined) G.filmMood = b.mood; if (b.shake) G.shake = b.shake;
    q('title').textContent = b.title || ''; q('title').style.opacity = b.title ? '1' : '0';
    const sy = q('say'); if (b.say) { sy.style.display = 'block'; q('who').textContent = b.say[0]; q('text').textContent = b.say[1]; } else sy.style.display = 'none';
    cur.actors = (b.actors || []).map(mkActor).filter(Boolean);
    const m = q('memo'); m.style.justifyContent = b.orbit ? 'flex-end' : 'center'; m.style.paddingBottom = b.orbit ? '15vh' : '0'; m.style.background = b.orbit ? 'radial-gradient(circle at 50% 45%,rgba(60,40,20,0),rgba(20,12,4,.5))' : 'radial-gradient(circle at 50% 45%,rgba(60,40,20,.15),rgba(20,12,4,.78))'; m.style.backdropFilter = m.style.webkitBackdropFilter = b.orbit ? 'sepia(.85) saturate(.8) brightness(.9)' : 'sepia(1) saturate(.7) brightness(.62) blur(1.5px)'; /* a memory you can see into: the picture stays sharp and brown, the words sit at the foot of it */
    if (b.plain) { m.style.background = 'linear-gradient(to top,rgba(0,0,0,.5),rgba(0,0,0,0) 38%)'; m.style.backdropFilter = m.style.webkitBackdropFilter = 'none'; } /* not a memory: what is happening now, in its own colours, with the lines at the foot */
    if (b.flash && b.orbit) { m.innerHTML = '<div style="position:relative;width:100%;height:4.4em">' + b.flash.map((l, i) => `<div style="position:absolute;left:0;right:0;bottom:0;opacity:0;animation:cinecap 3s ${0.4 + i * 3}s both">${l}</div>`).join('') + '</div>'; m.style.opacity = '1'; } /* over a moving picture the lines come one at a time, so they never sit on top of what is being shown */
    else if (b.flash) { m.innerHTML = b.flash.map((l, i) => `<div style="opacity:0;transition:opacity 1.1s ${0.5 + i * 1.9}s">${l}</div>`).join(''); m.style.opacity = '1'; requestAnimationFrame(() => { for (const c of m.children) c.style.opacity = '1'; }); } else m.style.opacity = '0';
    const g = q('glow'); g.style.background = b.glow === 'violet' ? 'radial-gradient(circle at 50% 40%,rgba(190,120,255,.8),rgba(120,40,200,.4) 45%,rgba(60,0,120,0) 80%)' : b.glow === 'red' ? 'radial-gradient(circle at 50% 40%,rgba(255,90,60,.7),rgba(160,20,20,.35) 45%,rgba(80,0,0,0) 80%)' : 'radial-gradient(circle at 50% 38%,rgba(255,236,170,.95),rgba(255,200,90,.55) 45%,rgba(255,170,60,0) 80%)'; cur.glow = !!b.glow;
    if (b.say && b.at) { const p = G.player, a = b.at, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1, h = a.h || 1.6, D = a.d || 4.2; cur.cam = clear(a.x, a.y + h, a.z, a.x + dx / d * D + -dz / d * 1.1, a.y + h + 0.5, a.z + dz / d * D + dx / d * 1.1); cur.look = [a.x, a.y + h, a.z]; } }
  /* a camera spot that is never inside a wall: walk from what is being looked at toward the wished spot and stop short of anything solid */
  function clear(lx, ly, lz, tx, ty, tz) { const w = G.world; let k = 1; for (let i = 2; i <= 14; i++) { const u = i / 14, b = w.getBlock(Math.floor(lx + (tx - lx) * u), Math.floor(ly + (ty - ly) * u), Math.floor(lz + (tz - lz) * u)); if (b !== B.AIR && typeof isSolid === 'function' && isSolid(b)) { k = Math.max(0.2, (i - 1.5) / 14); break; } } return [lx + (tx - lx) * k, ly + (ty - ly) * k, lz + (tz - lz) * k]; }
  /* somebody in the film who is not really there: a creature walking through a memory. at(t) says where it is, t in seconds */
  function mkActor(a) { try { const p = a.at(0), e = Wild.makeEntity(a.sp, a.lvl || 40, p.x, p.y, p.z, { plain: true }); e.cineAt = a.at; e.yaw = p.yaw || 0; e.sleep = false; e.alert = 0; if (a.scale) e.scale = a.scale; return e; } catch (err) { console.warn('cine actor:', err.message); return null; } }
  function entities() { if (!cur || !cur.actors) return []; for (const e of cur.actors) { const p = e.cineAt(cur.t); e.moving = Math.hypot(p.x - e.x, p.z - e.z) > 0.002; e.x = p.x; e.y = p.y; e.z = p.z; if (p.yaw != null) e.yaw = p.yaw; } return cur.actors; }
  /* a telling: somebody speaks line by line with the view on them, and between two lines the film shows what they are talking about. inserts: { 2: [beat, beat] } plays those after line 2 */
  function tell(who, at, inserts, lines, done) { if (!G) return; const a = { x: at.x, y: at.y, z: at.z, h: at.faceY || 1.5, d: at.faceD || 3.6 }, beats = []; lines.forEach((l, i) => { beats.push({ say: [who, l], at: a, secs: 30, mood: i === 0 ? null : undefined }); for (const b of (inserts[i] || [])) beats.push(b); }); if (!play(beats, done)) { if (typeof Dialogue !== 'undefined') Dialogue.show(who, lines, done); } }
  function setCam(c, l) { G.cutCam = { x: c[0], y: c[1], z: c[2], yaw: Math.atan2(-(l[0] - c[0]), -(l[2] - c[2])), pitch: Math.atan2(l[1] - c[1], Math.hypot(l[0] - c[0], l[2] - c[2])) }; }
  function update(dt) { if (!cur) return; if (typeof Battle !== 'undefined' && Battle.active) { el.style.display = 'none'; G.cutCam = null; return; } el.style.display = 'block';
    const p = G.player, b = cur.beats[cur.i]; if (!b) { stop(); return; } cur.t += dt; p.frozen = true; p.vx = p.vz = 0; G.repelUntil = Math.max(G.repelUntil || 0, performance.now() + 4000); G.talkNpc = null; G.sceneHold = 0;
    if (b.orbit) { const o = b.orbit, k = U.smooth(Math.min(1, cur.t / (b.secs || 5))), L = (v) => v[0] + (v[1] - v[0]) * k, a = L(o.a), r = L(o.r), h = L(o.h); cur.look = [o.x, o.y + (o.ly || 1.5), o.z]; cur.cam = [o.x + Math.sin(a) * r, o.y + h, o.z + Math.cos(a) * r]; }
    if (cur.cam && cur.look) setCam(cur.cam, cur.look);
    q('glow').style.opacity = cur.glow ? String(cur.t < 0.5 ? cur.t * 1.3 : Math.max(0, 0.65 - (cur.t - 0.5) * 0.22)) : '0';
    const secs = b.secs || (b.say ? 9 : b.flash ? 2.2 + b.flash.length * 2.6 : 5); if (cur.t >= secs) next(); }
  function stop(quiet) { const c = cur; cur = null; if (el) el.style.display = 'none'; document.body.classList.remove('cine-on'); if (!G) return; if (c) { const p = G.player; p.frozen = false; G.cutCam = null; G.thirdPerson = c.third; G.filmMood = c.mood0; for (let i = Math.max(0, c.i); i < c.beats.length; i++) if (c.beats[i].run && i > c.i) { try { c.beats[i].run(); } catch (e) { /* skipped film, world still moves on */ } } if (!quiet && c.done) c.done(); } }
  return { init, play, tell, entities, update, stop, active, get beat() { return cur ? cur.i : -1; } };
})();
