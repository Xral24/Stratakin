'use strict';
/* The Kin-Link: the device you catch with, and look at your cartridges on. To catch, it has to find the Kin (keep the reticle on it), tune to it
   (match its signal) and draw it in (pull, and ease off when it surges). Then it ejects a cartridge with the Kin on it.
   Everything is drawn on one canvas over the game. */
const Device = (() => {
  let root, cv, c, W = 0, H = 0, dpr = 1, raf = 0, S = null;
  const ptr = { down: false, x: 0, y: 0, dx: 0 };
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const auto = () => typeof window !== 'undefined' && window.__deviceAuto;
  function mount() {
    if (root) return; root = document.createElement('div'); root.id = 'device'; cv = document.createElement('canvas'); root.appendChild(cv); document.body.appendChild(root); c = cv.getContext('2d');
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); const [x, y] = pos(e); ptr.down = true; ptr.dx = 0; ptr.x = x; ptr.y = y; if (S && S.tap) S.tap(x, y); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
    cv.addEventListener('pointermove', (e) => { const [x, y] = pos(e); if (ptr.down) ptr.dx += x - ptr.x; ptr.x = x; ptr.y = y; });
    const up = () => { ptr.down = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    window.addEventListener('deviceorientation', (e) => { if (S && e.gamma != null) S.tiltIn = U.clamp(0.5 + e.gamma / 50, 0, 1); });
    window.addEventListener('resize', size);
  }
  function size() { if (!root) return; dpr = Math.min(2, window.devicePixelRatio || 1); W = root.clientWidth || window.innerWidth; H = root.clientHeight || window.innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  function show() { mount(); root.classList.add('on'); size(); cancelAnimationFrame(raf); let last = performance.now(); const loop = (now) => { if (!S) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; c.setTransform(dpr, 0, 0, dpr, 0, 0); try { S.frame(dt, now); } catch (err) { console.error(err); const d = S.done; hide(); if (d) d({ ok: false, error: true }); return; } raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
  function hide() { S = null; cancelAnimationFrame(raf); if (root) root.classList.remove('on'); }
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const text = (t, x, y, font, col, align = 'center', glow) => { c.font = font; c.textAlign = align; c.textBaseline = 'middle'; if (glow) { c.save(); c.shadowColor = glow; c.shadowBlur = 12; c.fillStyle = col; c.fillText(t, x, y); c.restore(); } else { c.fillStyle = col; c.fillText(t, x, y); } };

  /* the body of the device: a slot along the top, a big screen, a row of stage lights, and the control under the thumb. Returns where the screen and the control are */
  function body(now, lights, stage, slotGlow) {
    c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(4,7,10,0.94)'; c.fillRect(0, 0, W, H);
    const bw = Math.min(W - 16, 520), bx = (W - bw) / 2, by = Math.max(8, H * 0.02), bh = H - by * 2;
    rr(bx, by, bw, bh, 34); const g = c.createLinearGradient(bx, by, bx + bw, by + bh); g.addColorStop(0, '#39424d'); g.addColorStop(0.5, '#1d232b'); g.addColorStop(1, '#2b333d'); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#5d6b7a'; c.stroke(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,0.6)'; rr(bx + 5, by + 5, bw - 10, bh - 10, 30); c.stroke();
    // the slot
    const sw = bw * 0.62, sx = bx + (bw - sw) / 2; rr(sx, by + 12, sw, 14, 5); c.fillStyle = '#05070a'; c.fill(); if (slotGlow) { c.save(); c.shadowColor = slotGlow; c.shadowBlur = 18; c.strokeStyle = slotGlow; c.lineWidth = 2; rr(sx, by + 12, sw, 14, 5); c.stroke(); c.restore(); }
    text('KIN-LINK', bx + 26, by + 44, `700 13px ${MONO}`, '#8fa3b5', 'left'); text('MK II', bx + bw - 26, by + 44, `700 13px ${MONO}`, '#5f7386', 'right');
    const scr = { x: bx + 18, y: by + 60, w: bw - 36, h: Math.min(bh * 0.56, (bw - 36) * 1.05) };
    rr(scr.x - 8, scr.y - 8, scr.w + 16, scr.h + 16, 16); c.fillStyle = '#05070a'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#000'; c.stroke();
    const ly = scr.y + scr.h + 30, names = ['LOCK', 'TUNE', 'PULL'];
    names.forEach((n, i) => { const lx = bx + bw * (0.2 + i * 0.3), st = lights[i]; const col = st === 'done' ? '#5dff9a' : st === 'on' ? '#ffd35a' : st === 'skip' ? '#2a323b' : st === 'fail' ? '#ff5a5a' : '#3b4651'; c.beginPath(); c.arc(lx - 34, ly, 7, 0, 6.3); c.fillStyle = col; if (st === 'on' || st === 'done' || st === 'fail') { c.save(); c.shadowColor = col; c.shadowBlur = 12; c.fill(); c.restore(); } else c.fill(); text(n, lx - 20, ly, `700 14px ${MONO}`, st === 'skip' ? '#3b4651' : '#b8c6d4', 'left'); });
    const ctl = { x: bx + 18, y: ly + 26, w: bw - 36, h: by + bh - (ly + 26) - 18 };
    return { scr, ctl, bx, by, bw, bh };
  }
  function viewfinder(scr, col, now) { c.save(); rr(scr.x, scr.y, scr.w, scr.h, 10); c.clip(); const g = c.createRadialGradient(scr.x + scr.w / 2, scr.y + scr.h / 2, 20, scr.x + scr.w / 2, scr.y + scr.h / 2, scr.w); g.addColorStop(0, '#12303a'); g.addColorStop(1, '#040a0e'); c.fillStyle = g; c.fillRect(scr.x, scr.y, scr.w, scr.h);
    c.strokeStyle = 'rgba(120,220,255,0.10)'; c.lineWidth = 1; const step = scr.w / 10, off = (now / 60) % step; for (let x = scr.x - step + off; x < scr.x + scr.w; x += step) { c.beginPath(); c.moveTo(x, scr.y); c.lineTo(x, scr.y + scr.h); c.stroke(); } for (let y = scr.y; y < scr.y + scr.h; y += step) { c.beginPath(); c.moveTo(scr.x, y); c.lineTo(scr.x + scr.w, y); c.stroke(); } }
  function endScreen(scr) { c.fillStyle = 'rgba(0,0,0,0.14)'; for (let y = scr.y; y < scr.y + scr.h; y += 3) c.fillRect(scr.x, y, scr.w, 1); c.restore(); }
  function bar(x, y, w, h, v, col, label) { rr(x, y, w, h, h / 2); c.fillStyle = '#0a0e13'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1.5; c.stroke(); if (v > 0.01) { rr(x + 2, y + 2, Math.max(h - 4, (w - 4) * U.clamp(v, 0, 1)), h - 4, (h - 4) / 2); c.save(); c.shadowColor = col; c.shadowBlur = 10; c.fillStyle = col; c.fill(); c.restore(); } if (label) text(label, x + w / 2, y + h / 2 + 0.5, `700 ${Math.max(10, h * 0.55)}px ${MONO}`, '#fff'); }

  /* ---- catching. cfg: { kin, rar, hpFrac, agi, lull, chance }. Resolves { ok, quality, failed } once the three stages are over; the fight then says whether it held and calls result() ---- */
  function capture(cfg) {
    return new Promise((done) => {
      const k = cfg.kin, rar = cfg.rar || 0, d = U.clamp(([0.02, 0.1, 0.2, 0.32, 0.42][rar] || 0) + (cfg.hpFrac || 0) * 0.1 - (cfg.lull > 1 ? 0.08 : 0) + U.clamp(((cfg.agi || 60) - 60) / 800, 0, 0.05), 0.02, 0.56); /* he found a fresh common too hard: that speed is now a legendary's, and a common drifts */
      const el = k.sp.elem.map((w, i) => ({ e: KIN.E[i], w })).sort((a, b) => b.w - a.w)[0].e, col = Cards.ELEM_COL[el] || '#7fd6f0';
      const stages = rar >= 2 ? ['lock', 'tune', 'pull'] : ['lock', 'pull'];
      let pic = null; try { pic = Cards.kinCanvas(k, 150); } catch (_) {}
      const st = { i: 0, t: 0, fill: 0, scores: [], msgT: 0, tx: 0.5, ty: 0.45, rx: 0.5, ry: 0.7, ph: Math.random() * 9, ft: 0.3 + Math.random() * 0.4, fp: 0.5, jump: 2, prog: 0, tens: 0, maxTens: 0, surge: 1.4, sT: 1.8, /* a moment to get the feel of pulling before the first surge */ mode: 'calm', intro: 1.1, over: null, parts: [] };
      const lightsOf = () => ['lock', 'tune', 'pull'].map(n => { const ix = stages.indexOf(n); return ix < 0 ? 'skip' : st.over === 'fail' && ix === st.i ? 'fail' : ix < st.i || st.over === 'ok' ? 'done' : ix === st.i ? 'on' : 'off'; });
      const next = (score) => { st.scores.push(U.clamp(score, 0, 1)); st.i++; st.t = 0; st.fill = 0; st.intro = 0.9; if (typeof G !== 'undefined' && G.sfx) G.sfx('util'); if (st.i >= stages.length) { st.over = 'ok'; st.t = 0; } };
      const fail = () => { if (st.over) return; st.over = 'fail'; st.t = 0; if (typeof G !== 'undefined' && G.sfx) G.sfx('miss'); };
      S = { done, tiltIn: 0.5, frame(dt, now) {
        const L = body(now, lightsOf(), st.i, st.over === 'ok' ? '#5dff9a' : null), { scr, ctl } = L, stage = stages[st.i]; st.t += dt;
        viewfinder(scr, col, now);
        const kx = scr.x + scr.w * st.tx, ky = scr.y + scr.h * st.ty, ks = scr.w * 0.46;
        const drawKin = (alpha, sc = 1) => { if (!pic) { c.globalAlpha = alpha; c.fillStyle = col; c.beginPath(); c.arc(kx, ky, ks * 0.3 * sc, 0, 6.3); c.fill(); c.globalAlpha = 1; return; } c.globalAlpha = alpha; c.drawImage(pic, kx - ks * sc / 2, ky - ks * sc / 2 + Math.sin(now / 300) * 3, ks * sc, ks * sc); c.globalAlpha = 1; };
        if (st.over) { // the last moment: it goes into the device, or it breaks away
          if (st.over === 'ok') { const u = Math.min(1, st.t / 0.9); drawKin(1 - u, 1 - u * 0.6); for (let i = 0; i < 40; i++) { const a = i * 2.4 + now / 200, r = (1 - u) * scr.w * 0.4 * ((i % 7) / 7 + 0.3); c.fillStyle = i % 3 ? col : '#fff'; c.globalAlpha = 0.8; c.fillRect(kx + Math.cos(a) * r, ky + Math.sin(a) * r + u * (scr.y + scr.h - ky) * 0.8, 3, 3); } c.globalAlpha = 1; text('SIGNAL HELD', scr.x + scr.w / 2, scr.y + scr.h * 0.86, `700 20px ${MONO}`, '#5dff9a', 'center', '#5dff9a'); }
          else { drawKin(1, 1 + Math.sin(st.t * 40) * 0.04); c.fillStyle = `rgba(255,60,60,${0.35 * (1 - Math.min(1, st.t / 0.9))})`; c.fillRect(scr.x, scr.y, scr.w, scr.h); text('BEAM LOST', scr.x + scr.w / 2, scr.y + scr.h * 0.86, `700 22px ${MONO}`, '#ff6a6a', 'center', '#ff5a5a'); }
          endScreen(scr); text(st.over === 'ok' ? 'Reading it in…' : 'It broke away.', ctl.x + ctl.w / 2, ctl.y + ctl.h * 0.4, `600 17px system-ui, sans-serif`, '#d6e2ee');
          if (st.t > 1.0) { const q = st.scores.length ? st.scores.reduce((a, b) => a + b, 0) / st.scores.length : 0, ok = st.over === 'ok'; S.frame = (dt2, now2) => { body(now2, lightsOf(), st.i, null); }; done({ ok, quality: ok ? q : 0, failed: ok ? null : stage }); }
          return; }
        const A = auto(); if (st.intro > 0) st.intro -= dt;
        const live = st.intro <= 0;
        if (stage === 'lock') {
          // it will not keep still: a wandering path, and now and then it darts
          const sp = 0.3 + 1.8 * d; st.ph += dt * sp; st.tx = 0.5 + 0.3 * Math.sin(st.ph * 1.3) + 0.1 * Math.sin(st.ph * 3.1 + 1); st.ty = 0.44 + 0.2 * Math.sin(st.ph * 1.7 + 2) + 0.08 * Math.cos(st.ph * 2.9);
          if (A) { st.rx += (st.tx - st.rx) * Math.min(1, dt * 10); st.ry += (st.ty - st.ry) * Math.min(1, dt * 10); }
          else if (ptr.down) { st.rx = U.clamp((ptr.x - scr.x) / scr.w, 0, 1); st.ry = U.clamp((ptr.y - 56 - scr.y) / scr.h, 0, 1); } // the reticle rides above the thumb, so the thumb does not hide it
          const R = scr.w * (0.2 - 0.09 * d), px = scr.x + scr.w * st.rx, py = scr.y + scr.h * st.ry, on = Math.hypot(px - kx, py - ky) < R;
          if (live) st.fill = U.clamp(st.fill + (on ? dt / 1.3 : -dt * (0.15 + 0.5 * d)), 0, 1);
          drawKin(1);
          c.strokeStyle = on ? '#5dff9a' : '#ffffff'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, R, 0, 6.3); c.stroke(); c.beginPath(); c.arc(px, py, R + 8, -Math.PI / 2, -Math.PI / 2 + st.fill * Math.PI * 2); c.strokeStyle = '#5dff9a'; c.lineWidth = 6; c.stroke();
          c.lineWidth = 2; c.strokeStyle = on ? '#5dff9a' : 'rgba(255,255,255,0.7)'; for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { c.beginPath(); c.moveTo(px + ax * R * 0.55, py + ay * R * 0.55); c.lineTo(px + ax * (R + 16), py + ay * (R + 16)); c.stroke(); }
          endScreen(scr);
          text('Keep the ring on it', ctl.x + ctl.w / 2, ctl.y + 16, `600 17px system-ui, sans-serif`, '#d6e2ee'); text('drag on the screen', ctl.x + ctl.w / 2, ctl.y + 40, `400 13px system-ui, sans-serif`, '#7f93a6');
          bar(ctl.x + 20, ctl.y + 62, ctl.w - 40, 22, st.fill, '#5dff9a', 'LOCK ' + Math.round(st.fill * 100) + '%'); bar(ctl.x + 20, ctl.y + 94, ctl.w - 40, 8, 1 - st.t / 16, '#5f7386');
          if (st.fill >= 1) next(1 - (st.t - 1.5) / 14); else if (st.t > 16) fail();
        } else if (stage === 'tune') {
          st.tx += (0.5 - st.tx) * dt * 3; st.ty += (0.36 - st.ty) * dt * 3; drawKin(1);
          // its signal drifts, and a restless one jumps
          st.jump -= dt; if (st.jump <= 0) { st.jump = 2.8 - 1.7 * d + Math.random(); st.ft = U.clamp(st.ft + (Math.random() - 0.5) * 0.7 * (0.3 + d), 0.08, 0.92); }
          st.ft = U.clamp(st.ft + Math.sin(now / 700 + st.ph) * dt * 0.05 * (0.3 + d), 0.08, 0.92);
          if (A) st.fp += (st.ft - st.fp) * Math.min(1, dt * 6); else if (ptr.down) { st.fp = U.clamp(st.fp + ptr.dx / (ctl.w * 0.9), 0, 1); } ptr.dx = 0;
          const tol = 0.075 - 0.03 * d, on = Math.abs(st.fp - st.ft) < tol; if (live) st.fill = U.clamp(st.fill + (on ? dt / 1.5 : -dt * 0.4), 0, 1);
          const wy = scr.y + scr.h * 0.78, amp = scr.h * 0.09, wave = (f, colr, lw, ph) => { c.beginPath(); for (let x = 0; x <= scr.w; x += 4) { const y = wy + Math.sin(x / scr.w * (4 + f * 22) + ph) * amp; x ? c.lineTo(scr.x + x, y) : c.moveTo(scr.x + x, y); } c.strokeStyle = colr; c.lineWidth = lw; c.stroke(); };
          wave(st.ft, col, 5, now / 250); wave(st.fp, on ? '#5dff9a' : '#ffffff', 2.5, now / 250);
          endScreen(scr);
          text('Match its signal', ctl.x + ctl.w / 2, ctl.y + 16, `600 17px system-ui, sans-serif`, '#d6e2ee'); text('slide left and right', ctl.x + ctl.w / 2, ctl.y + 40, `400 13px system-ui, sans-serif`, '#7f93a6');
          const dx = ctl.x + 20, dw = ctl.w - 40, dy = ctl.y + 62; rr(dx, dy, dw, 26, 13); c.fillStyle = '#0a0e13'; c.fill(); c.fillStyle = col; c.globalAlpha = 0.5; c.fillRect(dx + dw * (st.ft - tol), dy + 3, dw * tol * 2, 20); c.globalAlpha = 1; c.fillStyle = on ? '#5dff9a' : '#fff'; rr(dx + dw * st.fp - 5, dy - 4, 10, 34, 4); c.fill();
          bar(dx, dy + 40, dw, 18, st.fill, '#5dff9a', 'TUNED ' + Math.round(st.fill * 100) + '%'); bar(dx, dy + 66, dw, 8, 1 - st.t / 16, '#5f7386');
          if (st.fill >= 1) next(1 - (st.t - 1.5) / 14); else if (st.t > 16) fail();
        } else {
          st.tx += (0.5 - st.tx) * dt * 3; st.ty += (0.3 + 0.3 * st.prog - st.ty) * dt * 3;
          // it surges: a warning, then it heaves, and the beam will not take a pull through that
          st.sT -= dt; if (live && st.sT <= 0) { if (st.mode === 'calm') { st.mode = 'warn'; st.sT = 0.6 + 0.6 * (1 - d); } else if (st.mode === 'warn') { st.mode = 'surge'; st.sT = 0.5 + 0.7 * d; } else { st.mode = 'calm'; st.sT = 2.2 - 1.0 * d + Math.random() * 0.8; } } }
          const hold = A ? st.mode === 'calm' : ptr.down;
          if (live) { if (hold) { st.prog += dt / (2.2 + 2.6 * d); if (st.mode === 'surge') st.tens += dt * (0.55 + 1.5 * d); else st.tens -= dt * 0.3; } else { st.tens -= dt * 1.2; /* holding through a whole surge snaps a legendary's beam; a common's takes nearly two seconds of it */ if (st.mode !== 'surge') st.prog -= dt * 0.1; } }
          st.prog = U.clamp(st.prog, 0, 1); st.tens = U.clamp(st.tens, 0, 1); st.maxTens = Math.max(st.maxTens, st.tens);
          const bc = st.mode === 'surge' ? '#ff5a5a' : st.mode === 'warn' ? '#ffb84a' : col, bxm = scr.x + scr.w / 2, bym = scr.y + scr.h;
          const shake = st.mode === 'surge' ? Math.sin(now / 18) * 5 : 0;
          c.save(); c.globalAlpha = 0.25 + (hold ? 0.35 : 0); c.fillStyle = bc; c.beginPath(); c.moveTo(bxm - 16, bym); c.lineTo(kx - ks * 0.32 + shake, ky); c.lineTo(kx + ks * 0.32 + shake, ky); c.lineTo(bxm + 16, bym); c.closePath(); c.fill(); c.restore();
          if (hold) for (let i = 0; i < 14; i++) { const u = ((now / 500 + i / 14) % 1); c.fillStyle = i % 2 ? '#fff' : bc; c.fillRect(kx + (bxm - kx) * u + Math.sin(i * 9 + now / 90) * 14 * (1 - u), ky + (bym - ky) * u, 3, 3); }
          c.save(); c.translate(shake, 0); drawKin(1 - st.prog * 0.55, 1 - st.prog * 0.35); c.restore();
          if (st.mode === 'warn') text('!', kx, ky - ks * 0.4, `800 34px ${MONO}`, '#ffb84a', 'center', '#ffb84a'); if (st.mode === 'surge') text('LET GO', scr.x + scr.w / 2, scr.y + scr.h * 0.12, `800 22px ${MONO}`, '#ff6a6a', 'center', '#ff5a5a');
          endScreen(scr);
          text(st.mode === 'surge' ? 'Red! Lift your thumb off' : st.mode === 'warn' ? 'It is about to fight…' : 'Keep your thumb pressed down', ctl.x + ctl.w / 2, ctl.y + 16, `600 17px system-ui, sans-serif`, st.mode === 'surge' ? '#ff8a8a' : '#d6e2ee');
          bar(ctl.x + 20, ctl.y + 36, ctl.w - 40, 22, st.prog, '#5dff9a', 'DRAWN IN ' + Math.round(st.prog * 100) + '%'); bar(ctl.x + 20, ctl.y + 66, ctl.w - 40, 16, st.tens, '#ff5a5a', 'STRAIN');
          const by2 = ctl.y + 96, bh2 = Math.max(44, Math.min(90, ctl.h - 104)); rr(ctl.x + 20, by2, ctl.w - 40, bh2, 16); const gg = c.createLinearGradient(0, by2, 0, by2 + bh2); gg.addColorStop(0, hold ? '#1f6a45' : '#3a4753'); gg.addColorStop(1, hold ? '#134a2f' : '#232c35'); c.fillStyle = gg; c.fill(); c.lineWidth = 2; c.strokeStyle = hold ? '#5dff9a' : '#5d6b7a'; c.stroke(); text(hold ? 'PULLING' : 'HOLD', ctl.x + ctl.w / 2, by2 + bh2 / 2, `800 20px ${MONO}`, '#fff');
          if (st.tens >= 1) fail(); else if (st.prog >= 1) next(1 - st.maxTens * 0.8); else if (st.t > 40) fail();
        }
        if (st.intro > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(0.6, st.intro)})`; c.fillRect(scr.x, scr.y, scr.w, scr.h); text(stage.toUpperCase(), scr.x + scr.w / 2, scr.y + scr.h / 2, `800 40px ${MONO}`, '#ffd35a', 'center', '#ffd35a'); }
      } };
      show();
    });
  }
  /* after the fight has said whether it held. Held: the cartridge comes up out of the slot, and can be looked at. Not held: the device says so and closes */
  function result(ok, k, msg) {
    return new Promise((done) => {
      if (!ok) { let t = 0; S = { frame(dt, now) { t += dt; const L = body(now, ['off', 'off', 'fail'], 0, null), scr = L.scr; viewfinder(scr, '#ff5a5a', now); c.fillStyle = 'rgba(255,60,60,0.18)'; c.fillRect(scr.x, scr.y, scr.w, scr.h); text('IT SHOOK FREE', scr.x + scr.w / 2, scr.y + scr.h * 0.45, `800 24px ${MONO}`, '#ff6a6a', 'center', '#ff5a5a'); text(msg || '', scr.x + scr.w / 2, scr.y + scr.h * 0.58, `400 14px system-ui, sans-serif`, '#d6e2ee'); endScreen(scr); if (t > 1.3 || auto()) { hide(); done(); } } }; show(); return; }
      view(k, { eject: true }).then(done);
    });
  }
  /* a cartridge, big, with its Kin alive on the screen. Drag (or tip the phone) to move the light across it */
  function view(k, o = {}) {
    return new Promise((done) => {
      const shellCv = document.createElement('canvas'), cart = document.createElement('canvas'); cart.width = Cards.W; cart.height = Cards.H; const cc = cart.getContext('2d');
      let bg = null, t = 0, tilt = 0.45, lastDraw = -1, lastTilt = -1, closing = false;
      const build = () => { Cards.casing(shellCv, k, { tilt }); bg = Cards.screenBack(k, { tilt }); lastTilt = tilt; };
      Cards.preload(Object.values(Cards.BG).concat(Object.values(Cards.OWN))).then(() => { try { build(); } catch (e) { console.error(e); } });
      try { build(); } catch (e) { console.error(e); }
      S = { tiltIn: null, tap(x, y) { if (t > (o.eject ? 1.6 : 0.3) && y > H - 84) closing = true; }, frame(dt, now) {
        t += dt; if (ptr.down && ptr.y < H - 84) { tilt = U.clamp(tilt + ptr.dx / 300, 0, 1); } ptr.dx = 0; if (S.tiltIn != null && !ptr.down) tilt += (S.tiltIn - tilt) * Math.min(1, dt * 5);
        if (Math.abs(tilt - lastTilt) > 0.04 && (k.card && k.card.finish && k.card.finish !== 'normal')) { try { bg = Cards.screenBack(k, { tilt }); lastTilt = tilt; } catch (_) {} }
        if (now - lastDraw > 80) { lastDraw = now; cc.clearRect(0, 0, cart.width, cart.height); cc.drawImage(shellCv, 0, 0); try { Cards.screen(cc, k, { tilt, now, live: true }, bg); } catch (e) { if (!S.err) { S.err = 1; console.error(e); } } }
        const u = o.eject ? U.clamp((t - 0.25) / 1.1, 0, 1) : 1, e = 1 - Math.pow(1 - u, 3);
        const ch = Math.min(H - 150, (W - 36) * Cards.H / Cards.W), cw = ch * Cards.W / Cards.H, cx = (W - cw) / 2, cyEnd = (H - 84 - ch) / 2 + 6;
        if (o.eject && u < 1) { const sc = 0.6, w2 = cw * sc, h2 = ch * sc, off = e * h2 * 0.92; c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(4,7,10,0.96)'; c.fillRect(0, 0, W, H); c.save(); c.translate(0, off); /* the device sinks as the cartridge comes up out of it */ const L = body(now, ['done', 'done', 'done'], 3, '#5dff9a'); const sy = L.by + 18; c.save(); c.beginPath(); c.rect(0, -off, W, off + sy + 2); c.clip(); c.drawImage(cart, (W - w2) / 2, sy - h2 * e, w2, h2); c.restore(); text('CARTRIDGE WRITTEN', L.scr.x + L.scr.w / 2, L.scr.y + L.scr.h / 2, `800 20px ${MONO}`, '#5dff9a', 'center', '#5dff9a'); c.restore(); }
        else { c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(4,7,10,0.96)'; c.fillRect(0, 0, W, H); const a = o.eject ? U.clamp((t - 1.35) / 0.4, 0, 1) : U.clamp(t / 0.25, 0, 1), rot = (tilt - 0.5) * 0.10;
          c.save(); c.globalAlpha = a; c.translate(W / 2, cyEnd + ch / 2 + (1 - a) * -40); c.rotate(rot * 0.3); c.transform(1, 0, rot * 0.5, 1, 0, 0); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.drawImage(cart, -cw / 2, -ch / 2, cw, ch); c.restore();
          const bw = Math.min(260, W - 60); rr((W - bw) / 2, H - 66, bw, 46, 14); c.fillStyle = '#2b3743'; c.fill(); c.strokeStyle = '#6d7f91'; c.lineWidth = 2; c.stroke(); text(o.eject ? 'Keep it' : 'Close', W / 2, H - 43, `700 17px system-ui, sans-serif`, '#fff'); if (t < 6) text('drag to catch the light', W / 2, H - 80, `400 12px system-ui, sans-serif`, '#7f93a6'); }
        if (closing || (auto() && t > (window.__deviceHold || 2.2))) { hide(); done(); }
      } };
      show();
    });
  }
  return { capture, result, view, get open() { return !!S; } };
})();
