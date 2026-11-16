// ---- the games of the towns. Every town keeps a champion at its own game and you play them for shards: you put a stake down,
// the champion matches it, the winner takes both. You can lose, and they are good. Two games so far: the ringboard (five throws each
// at a slice of trunk with its rings painted) and draughts. Each one opens over the world, which waits ----
const Games = (() => {
  let box = null, cur = null;
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; };
  function shell(title, sub) {
    close(true); box = $(`<div id="gamebox"><div class="gb-card"><div class="gb-head"><b class="gb-title"></b><span class="gb-sub"></span></div><div class="gb-score"></div><div class="gb-stage"></div><div class="gb-say"></div><div class="gb-foot"></div></div></div>`);
    box.querySelector('.gb-title').textContent = title; box.querySelector('.gb-sub').textContent = sub || ''; document.body.appendChild(box);
    if (typeof G !== 'undefined' && G.setPaused) G.setPaused(true);
    return { stage: box.querySelector('.gb-stage'), score: box.querySelector('.gb-score'), say: box.querySelector('.gb-say'), foot: box.querySelector('.gb-foot') };
  }
  function close(quiet) { if (cur && cur.stop) cur.stop(); cur = null; if (box) { box.remove(); box = null; if (!quiet && typeof G !== 'undefined' && G.setPaused) G.setPaused(false); } }
  function finish(ui, o, res, line) { // res: 'win' | 'lose' | 'draw'
    if (cur) cur.over = true; ui.say.textContent = line; ui.foot.innerHTML = ''; const b = $(`<button class="btn big">${res === 'win' ? 'Take the winnings' : res === 'draw' ? 'Take your stake back' : 'Pay up'}</button>`);
    b.addEventListener('click', () => { close(); if (o.onEnd) o.onEnd(res); }); ui.foot.appendChild(b); box.classList.add('gb-' + res);
  }
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };

  // ================= the ringboard =================
  // skill 0..1: how tight the champion throws, and how fast your own hand sways (a better hall plays on a livelier board)
  function ringboard(o) {
    const ui = shell('Ringboard', `${o.champ} · ${o.stake} shards a side`), W = 320, S = 150, cx = W / 2, cy = W / 2;
    const cv = $(`<canvas width="${W * 2}" height="${W * 2}" class="gb-canvas"></canvas>`); ui.stage.appendChild(cv); const g = cv.getContext('2d'); g.scale(2, 2);
    const st = { t: 0, turn: 0, you: [], them: [], mine: true, fly: null, wait: 0, over: false, ph: Math.random() * 9, raf: 0, last: performance.now(), clock: 7 }; cur = st;
    const sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1), sd = 0.15 - 0.075 * sk, sp = 0.78 + 0.5 * sk; // the champion's scatter in board radii; the speed of your sway
    const scoreOf = (x, y) => { const r = Math.hypot(x, y); return r >= 1 ? 0 : 10 - Math.floor(r * 10); };
    const sway = (t) => { const a = t * sp * 6.2832; return [0.62 * Math.sin(a * 0.43 + st.ph) + 0.2 * Math.sin(a * 1.31 + 1.7), 0.62 * Math.sin(a * 0.59 + st.ph * 1.7 + 0.8) + 0.2 * Math.cos(a * 1.13)]; };
    const total = (a) => a.reduce((s, q) => s + q.s, 0);
    const btn = $('<button class="btn big gb-throw">Throw</button>'), quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(btn); ui.foot.appendChild(quit);
    const head = () => { ui.score.innerHTML = `<span class="gb-you">You <b>${total(st.you)}</b></span><span class="gb-mid">throw ${Math.min(5, Math.floor(st.turn / 2) + 1)} of 5</span><span class="gb-them">${o.champ.split(' ')[0]} <b>${total(st.them)}</b></span>`; };
    const land = (x, y, mine) => { const s = scoreOf(x, y); (mine ? st.you : st.them).push({ x, y, s }); st.turn++; head();
      ui.say.textContent = mine ? (s === 10 ? 'Dead in the heart. Ten.' : s >= 8 ? `${s}. A good one.` : s >= 5 ? `${s}.` : s > 0 ? `${s}. Wide.` : 'Off the board.') : (s === 10 ? `${o.champ.split(' ')[0]} puts it in the heart. Ten.` : s > 0 ? `${o.champ.split(' ')[0]} throws ${s}.` : `${o.champ.split(' ')[0]} misses the board.`);
      if (st.turn >= 10) { const a = total(st.you), b = total(st.them); st.over = true; btn.remove(); quit.remove(); finish(ui, o, a > b ? 'win' : a < b ? 'lose' : 'draw', a > b ? `${a} to ${b}. The stake is yours.` : a < b ? `${a} to ${b}. ${o.champ.split(' ')[0]} takes your stake.` : `${a} all. Nobody pays.`); return; }
      st.mine = !mine; st.wait = mine ? 0.9 : 0.35; st.clock = 7; btn.disabled = !st.mine; };
    const yours = () => { if (st.over || !st.mine || st.fly || st.wait > 0) return; const [sx, sy] = sway(st.t); st.fly = { x: sx + gauss() * 0.025, y: sy + gauss() * 0.025, k: 0, mine: true }; btn.disabled = true; };
    btn.addEventListener('click', yours); cv.addEventListener('pointerdown', yours);
    quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    const quill = (x, y, col, k) => { const px = cx + x * S, py = cy + y * S; g.save(); g.translate(px, py); g.rotate(-0.6); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(3, 4, 5, 2.4, 0, 0, 6.3); g.fill();
      g.strokeStyle = '#3a2a18'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(15 * k, -15 * k); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(11 * k, -11 * k); g.lineTo(22 * k, -15 * k); g.lineTo(15 * k, -22 * k); g.closePath(); g.fill(); g.fillStyle = '#f4ead0'; g.beginPath(); g.arc(0, 0, 2.2, 0, 6.3); g.fill(); g.restore(); };
    function draw() {
      g.clearRect(0, 0, W, W);
      g.fillStyle = '#6b4a2a'; g.beginPath(); g.arc(cx, cy, S + 8, 0, 6.3); g.fill(); // the bark round the slice
      for (let i = 10; i >= 1; i--) { g.fillStyle = i === 1 ? '#c8452e' : i % 2 ? '#e9d6a8' : '#cfae72'; g.beginPath(); g.arc(cx, cy, S * i / 10, 0, 6.3); g.fill(); }
      g.strokeStyle = 'rgba(70,45,20,.35)'; g.lineWidth = 1; for (let i = 1; i <= 10; i++) { g.beginPath(); g.arc(cx, cy, S * i / 10, 0, 6.3); g.stroke(); }
      g.fillStyle = 'rgba(60,40,20,.55)'; g.font = '700 10px Nunito, sans-serif'; g.textAlign = 'center'; for (let i = 2; i <= 9; i += 1) g.fillText(String(11 - i), cx, cy - S * (i - 0.5) / 10 + 3.5);
      for (const q of st.them) quill(q.x, q.y, '#d8503a', 1); for (const q of st.you) quill(q.x, q.y, '#3f8fd8', 1);
      if (st.fly) { const k = st.fly.k, e = 1 - (1 - k) * (1 - k); g.globalAlpha = 0.5 + 0.5 * k; quill(st.fly.x * e + (st.fly.mine ? 0 : 0.3) * (1 - e), st.fly.y * e + 1.5 * (1 - e), st.fly.mine ? '#3f8fd8' : '#d8503a', 2.2 - 1.2 * k); g.globalAlpha = 1; }
      else if (st.mine && !st.over && st.wait <= 0) { const [sx, sy] = sway(st.t), px = cx + sx * S, py = cy + sy * S; g.strokeStyle = '#17324e'; g.lineWidth = 2.5; g.beginPath(); g.arc(px, py, 11, 0, 6.3); g.moveTo(px - 17, py); g.lineTo(px - 5, py); g.moveTo(px + 5, py); g.lineTo(px + 17, py); g.moveTo(px, py - 17); g.lineTo(px, py - 5); g.moveTo(px, py + 5); g.lineTo(px, py + 17); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.arc(px, py, 11, 0, 6.3); g.stroke(); }
    }
    function advance(dt) { st.t += dt; if (st.over) return;
      if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0 && !st.mine) { const wob = Math.random() < 0.07 ? 2.6 : 1; st.fly = { x: gauss() * sd * wob, y: gauss() * sd * wob, k: 0, mine: false }; } }
      else if (st.mine && !st.fly) { st.clock -= dt; if (st.clock <= 0) yours(); }
      if (st.fly) { st.fly.k += dt * 3.4; if (st.fly.k >= 1) { const f = st.fly; st.fly = null; land(f.x, f.y, f.mine); } } }
    function tick(now) { if (cur !== st) return; const dt = Math.min(0.1, (now - st.last) / 1000); st.last = now; advance(dt); draw(); st.raf = requestAnimationFrame(tick); } // on a slow frame the hand still moves at its own speed
    st.stop = () => cancelAnimationFrame(st.raf); head(); ui.say.textContent = 'Your hand will not hold still. Throw when the ring is over the heart.'; st.raf = requestAnimationFrame(tick);
    st.debug = { throwAt: (x, y) => { if (st.mine && !st.fly && st.wait <= 0 && !st.over) { st.fly = { x, y, k: 0, mine: true }; btn.disabled = true; return true; } return false; }, step: (dt) => { advance(dt); draw(); }, state: st };
  }

  // ================= draughts =================
  // The board is eight by eight, you play up it. Men step and take forwards, kings both ways, a take must be made, and a man that takes keeps taking.
  const D = {
    start() { const b = []; for (let r = 0; r < 8; r++) { b.push([]); for (let c = 0; c < 8; c++) b[r].push((r + c) % 2 ? (r < 3 ? -1 : r > 4 ? 1 : 0) : 0); } return b; },
    copy: (b) => b.map(r => r.slice()),
    dirs: (p) => Math.abs(p) === 2 ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : p > 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]],
    jumps(b, r, c, p, path, caps, out) { let any = false;
      for (const [dr, dc] of D.dirs(p)) { const mr = r + dr, mc = c + dc, tr = r + 2 * dr, tc = c + 2 * dc; if (tr < 0 || tr > 7 || tc < 0 || tc > 7) continue; const m = b[mr][mc]; if (!m || Math.sign(m) === Math.sign(p) || b[tr][tc] !== 0 || caps.some(q => q[0] === mr && q[1] === mc)) continue;
        any = true; const crown = Math.abs(p) === 1 && (p > 0 ? tr === 0 : tr === 7), np = path.concat([[tr, tc]]), nc = caps.concat([[mr, mc]]);
        if (crown) out.push({ path: np, caps: nc }); else { const keep = b[r][c]; b[r][c] = 0; b[tr][tc] = keep; D.jumps(b, tr, tc, p, np, nc, out); b[tr][tc] = 0; b[r][c] = keep; } }
      if (!any && caps.length) out.push({ path, caps }); },
    moves(b, side) { const caps = [], steps = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (!p || Math.sign(p) !== side) continue; D.jumps(b, r, c, p, [[r, c]], [], caps);
        if (!caps.length) for (const [dr, dc] of D.dirs(p)) { const tr = r + dr, tc = c + dc; if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && b[tr][tc] === 0) steps.push({ path: [[r, c], [tr, tc]], caps: [] }); } }
      return caps.length ? caps : steps; },
    apply(b, m) { const [r0, c0] = m.path[0], [r1, c1] = m.path[m.path.length - 1]; let p = b[r0][c0]; b[r0][c0] = 0; for (const [r, c] of m.caps) b[r][c] = 0; if (Math.abs(p) === 1 && (p > 0 ? r1 === 0 : r1 === 7)) p *= 2; b[r1][c1] = p; },
    score(b) { let s = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (!p) continue; const k = Math.abs(p) === 2, mine = p < 0; // from the champion's side (the negative men, moving down the board)
        let v = k ? 172 : 100 + (mine ? r : 7 - r) * 4; if (!k && (mine ? r === 0 : r === 7)) v += 9; if (c > 1 && c < 6 && r > 1 && r < 6) v += k ? 6 : 4; if (c === 0 || c === 7) v -= 3; s += mine ? v : -v; } return s; },
    search(b, side, depth, alpha, beta, st) { if (st.n++ > st.max) st.out = true; const ms = D.moves(b, side); if (!ms.length) return -9000 - depth; if (depth <= 0 && !ms[0].caps.length) return D.score(b) * -side; if (st.out) return D.score(b) * -side;
      let best = -1e9; ms.sort((x, y) => y.caps.length - x.caps.length);
      for (const m of ms) { const nb = D.copy(b); D.apply(nb, m); const v = -D.search(nb, -side, depth - 1, -beta, -alpha, st); if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break; } return best; },
    best(b, side, depth, budget) { const ms = D.moves(b, side); if (!ms.length) return null; if (ms.length === 1) return ms[0]; let pick = ms[0]; const t0 = performance.now();
      for (let d = 2; d <= depth; d += 2) { const st = { n: 0, max: 400000, out: false }; let bv = -1e9, bm = null; for (const m of ms) { const nb = D.copy(b); D.apply(nb, m); const v = -D.search(nb, -side, d - 1, -1e9, -bv + 1, st) + Math.random() * 0.5; if (v > bv) { bv = v; bm = m; } if (st.out) break; }
        if (bm && !st.out) pick = bm; if (st.out || performance.now() - t0 > budget) break; } return pick; },
  };
  function draughts(o) {
    const ui = shell('Draughts', `${o.champ} · ${o.stake} shards a side`), sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1), depth = sk < 0.3 ? 4 : sk < 0.6 ? 6 : sk < 0.85 ? 8 : 10;
    const st = { b: D.start(), side: 1, sel: null, part: null, quiet: 0, over: false, busy: false, last: null }; cur = st;
    const grid = $('<div class="gb-board"></div>'); ui.stage.appendChild(grid); const quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(quit);
    quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    const count = (s) => st.b.reduce((n, r) => n + r.filter(p => Math.sign(p) === s).length, 0);
    const head = () => { ui.score.innerHTML = `<span class="gb-you">You <b>${count(1)}</b></span><span class="gb-mid">${st.over ? '' : st.side === 1 ? 'your move' : 'thinking'}</span><span class="gb-them">${o.champ.split(' ')[0]} <b>${count(-1)}</b></span>`; };
    const legal = () => D.moves(st.b, 1);
    function render() { grid.innerHTML = ''; const ms = st.side === 1 && !st.over ? legal() : []; const from = new Set(ms.map(m => m.path[0].join())); let dests = new Map();
      if (st.sel) for (const m of ms) { if (m.path[0].join() !== st.sel.join()) continue; const pre = st.part || [st.sel]; if (pre.every((q, i) => m.path[i] && m.path[i].join() === q.join()) && m.path.length > pre.length) dests.set(m.path[pre.length].join(), m); }
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const dark = (r + c) % 2 === 1, p = st.b[r][c], k = r + ',' + c, here = st.part ? st.part[st.part.length - 1].join() === k : st.sel && st.sel.join() === k;
        const lastHit = st.last && st.last.some(q => q.join() === k);
        const cell = $(`<div class="gb-sq ${dark ? 'dk' : 'lt'}${dests.has(k) ? ' go' : ''}${lastHit ? ' was' : ''}"></div>`);
        const shown = st.part && st.sel && st.sel.join() === k ? 0 : (st.part && here ? st.b[st.sel[0]][st.sel[1]] : p); // a man in the middle of a run of takes is shown where it has got to
        if (shown) cell.appendChild($(`<i class="gb-man ${shown > 0 ? 'you' : 'them'}${Math.abs(shown) === 2 ? ' king' : ''}${here ? ' sel' : ''}${shown > 0 && from.has(k) && !st.sel ? ' can' : ''}"></i>`));
        if (dark) cell.addEventListener('pointerdown', () => tap(r, c, dests)); grid.appendChild(cell); } head(); }
    function tap(r, c, dests) { if (st.over || st.side !== 1 || st.busy) return; const k = r + ',' + c;
      if (dests.has(k)) { const pre = (st.part || [st.sel]).concat([[r, c]]), rest = legal().filter(q => pre.every((p, i) => q.path[i] && q.path[i].join() === p.join())); if (!rest.length) return;
        if (rest[0].path.length === pre.length) return play(rest[0]); st.part = pre; return render(); } // a run of takes is tapped out square by square
      if (st.part) return; // in the middle of a run of takes you must finish it
      if (st.b[r][c] > 0 && legal().some(m => m.path[0].join() === k)) { st.sel = [r, c]; st.part = null; } else st.sel = null; render(); }
    function after(m) { st.quiet = m.caps.length || Math.abs(st.b[m.path[m.path.length - 1][0]][m.path[m.path.length - 1][1]]) === 1 ? 0 : st.quiet + 1; st.last = [m.path[0], m.path[m.path.length - 1]]; }
    function done(res, line) { st.over = true; quit.remove(); render(); finish(ui, o, res, line); }
    function play(m) { D.apply(st.b, m); after(m); st.sel = null; st.part = null; st.side = -1; render();
      if (!D.moves(st.b, -1).length) return done('win', `${o.champ.split(' ')[0]} cannot move. The stake is yours.`); if (st.quiet >= 50) return done('draw', 'Fifty moves and nothing taken. A draw.');
      st.busy = true; ui.say.textContent = `${o.champ.split(' ')[0]} looks at the board.`; setTimeout(() => { if (cur !== st) return; const r = D.best(st.b, -1, depth, 380); st.busy = false; if (!r) return done('win', `${o.champ.split(' ')[0]} cannot move. The stake is yours.`);
        D.apply(st.b, r); after(r); st.side = 1; ui.say.textContent = r.caps.length ? (r.caps.length > 1 ? `${o.champ.split(' ')[0]} takes ${r.caps.length}.` : `${o.champ.split(' ')[0]} takes one.`) : 'Your move.';
        if (!legal().length) return done('lose', `You cannot move. ${o.champ.split(' ')[0]} takes your stake.`); if (st.quiet >= 50) return done('draw', 'Fifty moves and nothing taken. A draw.'); render(); }, 420); }
    ui.say.textContent = 'You play the blue men, up the board. A take must be made.'; render();
    st.debug = { state: st, D, play, legal };
  }
  const KINDS = { ringboard: { name: 'Ringboard', fn: ringboard, blurb: 'Five throws each at the ringboard. Highest count takes both stakes.' }, draughts: { name: 'Draughts', fn: draughts, blurb: 'One game of draughts. Whoever is left without a move pays.' } };
  return { KINDS, play(kind, o) { const K = KINDS[kind]; if (!K) return false; K.fn(o || {}); return true; }, close, get current() { return cur; }, D };
})();
