// ---- the games of the towns. Every town keeps a champion at its own game and you play them for shards: you put a stake down,
// the champion matches it, the winner takes both. You can lose, and they are good. Four games: the ringboard (five throws each
// at a slice of trunk with its rings painted), draughts, chess and a card game called High Tide. Each one opens over the world, which waits ----
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
  // ================= chess =================
  // the board is 64 squares, 0 at the top left; your men are capitals and move up it. Every rule is here: castling, taking in passing, a pawn that gets home becomes a queen
  const C = {
    start() { return { b: 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR', t: 1, c: 'KQkq', ep: -1, half: 0 }; },
    mine: (p, t) => p !== '.' && (p === p.toUpperCase()) === (t === 1),
    VAL: { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 },
    attacked(b, sq, by) { const r = sq >> 3, c = sq & 7, at = (rr, cc) => rr < 0 || rr > 7 || cc < 0 || cc > 7 ? null : b[rr * 8 + cc], is = (p, k) => p && p !== '.' && p.toLowerCase() === k && C.mine(p, by);
      const pr = r + by; if (is(at(pr, c - 1), 'p') || is(at(pr, c + 1), 'p')) return true; // a pawn of theirs stands one row behind (from where it moves) and takes forward
      for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (is(at(r + dr, c + dc), 'n')) return true;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { if (is(at(r + dr, c + dc), 'k')) return true; const diag = dr && dc; for (let i = 1; i < 8; i++) { const p = at(r + dr * i, c + dc * i); if (p == null) break; if (p === '.') continue; if (C.mine(p, by) && (p.toLowerCase() === 'q' || p.toLowerCase() === (diag ? 'b' : 'r'))) return true; break; } }
      return false; },
    pseudo(s) { const { b, t } = s, out = [], add = (f, to, x) => out.push(Object.assign({ f, to }, x));
      for (let f = 0; f < 64; f++) { const p = b[f]; if (!C.mine(p, t)) continue; const k = p.toLowerCase(), r = f >> 3, c = f & 7;
        if (k === 'p') { const d = -t, r1 = r + d; if (r1 < 0 || r1 > 7) continue; const pro = r1 === (t === 1 ? 0 : 7) ? { pro: 1 } : null;
          if (b[r1 * 8 + c] === '.') { add(f, r1 * 8 + c, pro); if (r === (t === 1 ? 6 : 1) && b[(r1 + d) * 8 + c] === '.') add(f, (r1 + d) * 8 + c, { dbl: 1 }); }
          for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7) continue; const to = r1 * 8 + cc, q = b[to]; if (q !== '.' && !C.mine(q, t)) add(f, to, pro); else if (to === s.ep) add(f, to, { ep: 1 }); } continue; }
        const steps = k === 'n' ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] : k === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : k === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], far = k === 'b' || k === 'r' || k === 'q';
        for (const [dr, dc] of steps) for (let i = 1; i < (far ? 8 : 2); i++) { const rr = r + dr * i, cc = c + dc * i; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) break; const to = rr * 8 + cc, q = b[to]; if (q === '.') { add(f, to); continue; } if (!C.mine(q, t)) add(f, to); break; }
        if (k === 'k' && f === (t === 1 ? 60 : 4) && !C.attacked(b, f, -t)) { const K = t === 1 ? 'K' : 'k', Q = t === 1 ? 'Q' : 'q';
          if (s.c.includes(K) && b[f + 1] === '.' && b[f + 2] === '.' && !C.attacked(b, f + 1, -t)) add(f, f + 2, { cas: 1 });
          if (s.c.includes(Q) && b[f - 1] === '.' && b[f - 2] === '.' && b[f - 3] === '.' && !C.attacked(b, f - 1, -t)) add(f, f - 2, { cas: -1 }); } }
      return out; },
    make(s, m) { const a = s.b.split(''), p = a[m.f], t = s.t; let c = s.c, ep = -1; const took = a[m.to] !== '.' || m.ep;
      a[m.to] = m.pro ? (t === 1 ? 'Q' : 'q') : p; a[m.f] = '.'; if (m.ep) a[m.to + t * 8] = '.'; if (m.dbl) ep = m.to + t * 8;
      if (m.cas === 1) { a[m.f + 1] = a[m.f + 3]; a[m.f + 3] = '.'; } if (m.cas === -1) { a[m.f - 1] = a[m.f - 4]; a[m.f - 4] = '.'; }
      const drop = (ch) => { c = c.replace(ch, ''); }; if (p === 'K') { drop('K'); drop('Q'); } if (p === 'k') { drop('k'); drop('q'); }
      for (const sq of [m.f, m.to]) { if (sq === 63) drop('K'); if (sq === 56) drop('Q'); if (sq === 7) drop('k'); if (sq === 0) drop('q'); }
      return { b: a.join(''), t: -t, c, ep, half: took || p.toLowerCase() === 'p' ? 0 : s.half + 1 }; },
    king: (b, t) => b.indexOf(t === 1 ? 'K' : 'k'),
    inCheck: (s) => C.attacked(s.b, C.king(s.b, s.t), -s.t),
    moves(s) { return C.pseudo(s).filter(m => { const n = C.make(s, m); return !C.attacked(n.b, C.king(n.b, s.t), n.t); }); },
    // how the board stands for the side to move: the men, and where they stand (the middle is worth having, pawns are worth more the further they get, a king stays home until the queens are off)
    score(s) { let v = 0, heavy = 0; for (let i = 0; i < 64; i++) { const p = s.b[i]; if (p !== '.' && 'qrQR'.includes(p)) heavy++; }
      for (let i = 0; i < 64; i++) { const p = s.b[i]; if (p === '.') continue; const w = p === p.toUpperCase(), k = p.toLowerCase(), r = w ? i >> 3 : 7 - (i >> 3), c = i & 7, mid = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)); let x = C.VAL[k];
        if (k === 'p') x += (6 - r) * 7 + (c > 1 && c < 6 ? mid * 6 : 0); else if (k === 'n' || k === 'b') x += mid * 9 - (r === 7 ? 12 : 0); else if (k === 'q') x += mid * 2; else if (k === 'r') x += r === 1 ? 18 : 0; else x += heavy > 2 ? (r === 7 ? 10 + Math.abs(c - 3.5) * 5 : -30) : mid * 12;
        v += w ? x : -x; } return v * s.t; },
    best(s, depth, ms) { const t0 = Date.now(); let out = false; const order = (st, ms2) => ms2.map(m => [m, (st.b[m.to] !== '.' ? C.VAL[st.b[m.to].toLowerCase()] * 10 - C.VAL[st.b[m.f].toLowerCase()] : 0) + (m.pro ? 800 : 0)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const quiet = (st, a, be) => { const stand = C.score(st); if (stand >= be) return stand; if (stand > a) a = stand; for (const m of order(st, C.pseudo(st).filter(q => st.b[q.to] !== '.' || q.pro))) { const n = C.make(st, m); if (C.attacked(n.b, C.king(n.b, st.t), n.t)) continue; const v = -quiet(n, -be, -a); if (v >= be) return v; if (v > a) a = v; } return a; };
      const go = (st, d, a, be, ply) => { if (out) return 0; if ((ply & 3) === 3 && Date.now() - t0 > ms) { out = true; return 0; } if (d <= 0) return quiet(st, a, be); const ms2 = order(st, C.moves(st)); if (!ms2.length) return C.inCheck(st) ? -99000 + ply : 0; if (st.half >= 100) return 0;
        for (const m of ms2) { const v = -go(C.make(st, m), d - 1, -be, -a, ply + 1); if (out) return 0; if (v >= be) return v; if (v > a) a = v; } return a; };
      const root = order(s, C.moves(s)); if (!root.length) return null; let pick = root[0], scored = [];
      for (let d = 1; d <= depth; d++) { let a = -1e9, bm = null; const sc = []; for (const m of (bm ? root : [pick].concat(root.filter(x => x !== pick)))) { const v = -go(C.make(s, m), d - 1, -1e9, -a + 60, 1); if (out) break; sc.push([m, v]); if (v > a) { a = v; bm = m; } } if (out) break; pick = bm; scored = sc; }
      return { move: pick, scored }; },
  };
  const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  function chess(o) {
    const first = o.champ.split(' ')[0], ui = shell('Chess', `${o.champ} · ${o.stake} shards a side`), sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1), depth = sk < 0.3 ? 2 : sk < 0.6 ? 3 : sk < 0.85 ? 4 : 5, slip = sk < 0.3 ? 0.3 : sk < 0.6 ? 0.12 : 0;
    const st = { s: C.start(), sel: -1, over: false, busy: false, last: null, n: 0 }; cur = st;
    const grid = $('<div class="gb-board gb-chess"></div>'); ui.stage.appendChild(grid); const quit = $('<button class="btn ghost">Resign</button>'); ui.foot.appendChild(quit);
    quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    const mat = (t) => { let v = 0; for (const p of st.s.b) if (C.mine(p, t)) v += Math.round(C.VAL[p.toLowerCase()] / 100); return v; };
    const head = () => { ui.score.innerHTML = `<span class="gb-you">You <b>${mat(1)}</b></span><span class="gb-mid">${st.over ? '' : st.s.t === 1 ? (C.inCheck(st.s) ? 'check' : 'your move') : 'thinking'}</span><span class="gb-them">${first} <b>${mat(-1)}</b></span>`; };
    function render() { grid.innerHTML = ''; const ms = st.s.t === 1 && !st.over ? C.moves(st.s) : [], dests = new Map(); if (st.sel >= 0) for (const m of ms) if (m.f === st.sel) dests.set(m.to, m); const chk = C.inCheck(st.s) ? C.king(st.s.b, st.s.t) : -1;
      for (let i = 0; i < 64; i++) { const p = st.s.b[i], dark = ((i >> 3) + (i & 7)) % 2 === 1, cell = $(`<div class="gb-sq ${dark ? 'dk' : 'lt'}${dests.has(i) ? ' go' : ''}${st.last && (st.last.f === i || st.last.to === i) ? ' was' : ''}${i === chk ? ' chk' : ''}"></div>`);
        if (p !== '.') { const e = $(`<i class="gb-pc ${p === p.toUpperCase() ? 'you' : 'them'}${i === st.sel ? ' sel' : ''}"></i>`); e.textContent = GLYPH[p.toLowerCase()]; cell.appendChild(e); }
        cell.addEventListener('pointerdown', () => tap(i, dests)); grid.appendChild(cell); } head(); }
    function tap(i, dests) { if (st.over || st.s.t !== 1 || st.busy) return; if (dests.has(i)) return play(dests.get(i)); st.sel = C.mine(st.s.b[i], 1) ? i : -1; render(); }
    function done(res, line) { st.over = true; quit.remove(); render(); finish(ui, o, res, line); }
    function ended() { const ms = C.moves(st.s); if (!ms.length) { if (!C.inCheck(st.s)) return done('draw', 'Stalemate. Nobody can move and nobody is in check. A draw.'), true; return done(st.s.t === 1 ? 'lose' : 'win', st.s.t === 1 ? `Checkmate. ${first} takes your stake.` : `Checkmate. The stake is yours.`), true; }
      if (st.s.half >= 100) return done('draw', 'Fifty moves with nothing taken and no pawn moved. A draw.'), true; if (!/[pqrPQR]/.test(st.s.b) && st.s.b.replace(/[.kK]/g, '').length < 2) return done('draw', 'Not enough left on the board to mate with. A draw.'), true; if (st.n >= 300) return done('draw', 'A very long game. Call it a draw.'), true; return false; }
    function play(m) { st.s = C.make(st.s, m); st.last = m; st.sel = -1; st.n++; render(); if (ended()) return;
      st.busy = true; ui.say.textContent = `${first} looks at the board.`; setTimeout(() => { if (cur !== st) return; const r = C.best(st.s, depth, 500 + sk * 900); st.busy = false; if (!r) return ended(); let mv = r.move;
        if (slip && Math.random() < slip && r.scored.length > 2) { const top = r.scored.slice().sort((a, b) => b[1] - a[1]), alt = top[1 + Math.floor(Math.random() * Math.min(3, top.length - 1))]; if (alt && top[0][1] - alt[1] < 260 && top[0][1] < 50000) mv = alt[0]; } // a lesser champion does not always find the best move, though he never gives a piece away for nothing
        const took = st.s.b[mv.to] !== '.' || mv.ep; st.s = C.make(st.s, mv); st.last = mv; st.n++; ui.say.textContent = C.inCheck(st.s) ? 'Check.' : took ? `${first} takes.` : 'Your move.'; if (ended()) return; render(); }, 380); }
    ui.say.textContent = 'You play the pale men, up the board. Tap a man, then where it goes.'; render();
    st.debug = { state: st, C, play };
  }
  // ================= high tide: the card game =================
  // Each of you holds the cards one to nine. Nine prizes are turned up one at a time, worth one to nine. You each lay a card face down
  // and the higher takes the prize; the cards are spent. Level cards and the prize stays on the table for whoever wins the next. Most points wins
  function tide(o) {
    const first = o.champ.split(' ')[0], ui = shell('High Tide', `${o.champ} · ${o.stake} shards a side`), sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1);
    const prizes = [1, 2, 3, 4, 5, 6, 7, 8, 9]; for (let i = 8; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [prizes[i], prizes[j]] = [prizes[j], prizes[i]]; }
    const st = { you: [1, 2, 3, 4, 5, 6, 7, 8, 9], them: [1, 2, 3, 4, 5, 6, 7, 8, 9], prizes, r: 0, pot: 0, ys: 0, ts: 0, over: false, busy: false, shown: null }; cur = st;
    const stage = $('<div class="gb-tide"><div class="gt-row gt-them"></div><div class="gt-mid"></div><div class="gt-row gt-you"></div></div>'); ui.stage.appendChild(stage); const quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(quit);
    quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    // the champion's card. A poor one plays near the prize's own number. A good one weighs what you have left: he will not waste a high card where yours beats it anyway, and he takes a prize with the least card that is likely to
    function theirCard() { const prize = st.prizes[st.r] + st.pot, h = st.them, yh = st.you; if (h.length === 1) return h[0];
      if (Math.random() > sk + 0.15) { const want = st.prizes[st.r] + Math.round((Math.random() - 0.5) * 3); return h.reduce((a, c) => Math.abs(c - want) < Math.abs(a - want) ? c : a, h[0]); }
      const left = st.prizes.slice(st.r + 1), rank = left.filter(p => p < st.prizes[st.r]).length / Math.max(1, left.length), big = prize >= 6 || rank > 0.6, yTop = Math.max(...yh), hTop = Math.max(...h);
      if (big) { if (hTop > yTop) { const need = h.filter(c => c > yTop); return Math.min(...need); } if (Math.random() < 0.45) return Math.min(...h); const guess = yh[Math.max(0, yh.length - 1 - Math.floor(Math.random() * 2))], over = h.filter(c => c > guess); return over.length ? Math.min(...over) : Math.min(...h); } // cannot be sure of it: sometimes throw the worst card away and let you spend your best
      const lowHalf = h.slice().sort((a, b) => a - b).slice(0, Math.ceil(h.length / 2)), yLow = yh.slice().sort((a, b) => a - b)[Math.min(yh.length - 1, 1)], over = lowHalf.filter(c => c > yLow); return over.length && Math.random() < 0.7 ? Math.min(...over) : lowHalf[0]; }
    const card = (n, cls) => `<i class="gt-card ${cls || ''}">${n == null ? '' : n}</i>`;
    function render() { ui.score.innerHTML = `<span class="gb-you">You <b>${st.ys}</b></span><span class="gb-mid">${st.over ? '' : 'prize ' + (st.r + 1) + ' of 9'}</span><span class="gb-them">${first} <b>${st.ts}</b></span>`;
      stage.querySelector('.gt-them').innerHTML = st.them.map(() => card(null, 'back')).join('');
      const mid = stage.querySelector('.gt-mid'); mid.innerHTML = st.over ? '' : `${st.shown ? card(st.shown[1], 'them laid') : card(null, 'slot')}<div class="gt-prize"><i class="gt-card prize">${st.prizes[st.r]}</i>${st.pot ? `<span>and ${st.pot} left lying</span>` : ''}</div>${st.shown ? card(st.shown[0], 'you laid') : card(null, 'slot')}`;
      const row = stage.querySelector('.gt-you'); row.innerHTML = ''; for (const c of st.you) { const e = $(card(c, 'you' + (st.busy ? ' off' : ''))); e.addEventListener('pointerdown', () => lay(c)); row.appendChild(e); } }
    function lay(c) { if (st.over || st.busy || !st.you.includes(c)) return; st.busy = true; const t = theirCard(), prize = st.prizes[st.r] + st.pot; st.you = st.you.filter(x => x !== c); st.them = st.them.filter(x => x !== t); st.shown = [c, t]; render();
      ui.say.textContent = c > t ? `Your ${c} beats the ${t}. ${prize} to you.` : t > c ? `${first}'s ${t} beats your ${c}. ${prize} to ${first}.` : `Both ${c}. The prize stays on the table.`;
      setTimeout(() => { if (cur !== st) return; if (c > t) { st.ys += prize; st.pot = 0; } else if (t > c) { st.ts += prize; st.pot = 0; } else st.pot = prize; st.r++; st.shown = null; st.busy = false;
        if (st.r >= 9) { st.over = true; quit.remove(); render(); return finish(ui, o, st.ys > st.ts ? 'win' : st.ys < st.ts ? 'lose' : 'draw', st.ys > st.ts ? `${st.ys} to ${st.ts}. The stake is yours.` : st.ys < st.ts ? `${st.ts} to ${st.ys}. ${first} takes your stake.` : `${st.ys} each. A draw.`); }
        render(); }, 1250); }
    ui.say.textContent = 'Lay a card on each prize. Higher card takes it. Every card can be played once.'; render();
    st.debug = { state: st, lay, theirCard };
  }
  // ================= moonshot: the Moon's game =================
  // A stone lobbed across the dust at a marked crater. There is next to no pull up there, so it hangs a long time. Your arm swings up and down a gauge; let go when it reads right. Five stones each, ten for a stone in the crater
  function moonshot(o) {
    const first = o.champ.split(' ')[0], ui = shell('Moonshot', `${o.champ} · ${o.stake} shards a side`), W = 320, H = 250, sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1), sd = 0.085 - 0.06 * sk, sp = 0.75 + 0.55 * sk;
    const cv = $(`<canvas width="${W * 2}" height="${H * 2}" class="gb-canvas gb-wide"></canvas>`); ui.stage.appendChild(cv); const g = cv.getContext('2d'); g.scale(2, 2);
    const st = { t: 0, turn: 0, ys: 0, ts: 0, mine: true, fly: null, wait: 0, over: false, target: 0.5 + Math.random() * 0.4, marks: [], raf: 0, last: performance.now(), clock: 8 }; cur = st;
    const btn = $('<button class="btn big gb-throw">Let go</button>'), quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(btn); ui.foot.appendChild(quit);
    const head = () => { ui.score.innerHTML = `<span class="gb-you">You <b>${st.ys}</b></span><span class="gb-mid">stone ${Math.min(5, Math.floor(st.turn / 2) + 1)} of 5</span><span class="gb-them">${first} <b>${st.ts}</b></span>`; };
    const power = (t) => { const a = t * sp * 2.2; return 0.5 + 0.5 * Math.sin(a) * (0.82 + 0.18 * Math.sin(a * 0.37)); };
    const scoreOf = (d) => Math.max(0, 10 - Math.floor(Math.abs(d - st.target) * 55));
    function land(d, mine) { const s = scoreOf(d); if (mine) st.ys += s; else st.ts += s; st.marks.push({ d, mine }); st.turn++; head();
      ui.say.textContent = mine ? (s === 10 ? 'Straight in the crater. Ten.' : s >= 7 ? `${s}. Close.` : s > 0 ? `${s}. ${d < st.target ? 'Short' : 'Long'}.` : (d < st.target ? 'Well short.' : 'Clean over it.')) : (s === 10 ? `${first} drops it in. Ten.` : `${first} scores ${s}.`);
      if (st.turn >= 10) { st.over = true; btn.remove(); quit.remove(); return finish(ui, o, st.ys > st.ts ? 'win' : st.ys < st.ts ? 'lose' : 'draw', st.ys > st.ts ? `${st.ys} to ${st.ts}. The stake is yours.` : st.ys < st.ts ? `${st.ts} to ${st.ys}. ${first} takes your stake.` : `${st.ys} all. Nobody pays.`); }
      st.mine = !mine; st.wait = mine ? 0.9 : 0.5; st.clock = 8; btn.disabled = !st.mine; if (st.mine) { st.target = 0.42 + Math.random() * 0.5; st.marks = []; } } // a new crater is marked for each pair of stones
    const yours = () => { if (st.over || !st.mine || st.fly || st.wait > 0) return; st.fly = { d: 0.12 + power(st.t) * 0.86 + gauss() * 0.008, k: 0, mine: true }; btn.disabled = true; };
    btn.addEventListener('click', yours); cv.addEventListener('pointerdown', yours); quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    const X = (d) => 26 + d * (W - 52), GY = 196;
    function draw() { g.fillStyle = '#080a18'; g.fillRect(0, 0, W, H); for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + ((i * 37) % 10) / 14})`; g.fillRect((i * 73) % W, (i * 41) % 150, 1.3, 1.3); }
      g.fillStyle = '#3d7fd0'; g.beginPath(); g.arc(262, 44, 20, 0, 6.3); g.fill(); g.fillStyle = '#58b06a'; g.beginPath(); g.ellipse(256, 40, 8, 5, 0.5, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(268, 52, 6, 4, -0.4, 0, 6.3); g.fill(); // home, hanging over the rim
      g.fillStyle = '#8f93a0'; g.fillRect(0, GY, W, H - GY); g.fillStyle = '#7b7f8c'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(18 + i * 37, GY + 14 + (i % 3) * 12, 9 + (i % 4) * 3, 3, 0, 0, 6.3); g.fill(); }
      const tx = X(st.target); g.fillStyle = '#4b4e5a'; g.beginPath(); g.ellipse(tx, GY + 3, 15, 5, 0, 0, 6.3); g.fill(); g.strokeStyle = '#ffd45a'; g.lineWidth = 2; g.beginPath(); g.ellipse(tx, GY + 3, 15, 5, 0, 0, 6.3); g.stroke(); g.fillStyle = '#ffd45a'; g.fillRect(tx - 1, GY - 24, 2, 24); g.beginPath(); g.moveTo(tx + 1, GY - 24); g.lineTo(tx + 13, GY - 19); g.lineTo(tx + 1, GY - 14); g.fill();
      for (const m of st.marks) { g.fillStyle = m.mine ? '#6fb6ff' : '#ff8a70'; g.beginPath(); g.arc(X(m.d), GY + 2, 4, 0, 6.3); g.fill(); }
      g.fillStyle = '#d9dce6'; g.beginPath(); g.arc(20, GY - 22, 6, 0, 6.3); g.fill(); g.fillRect(16, GY - 16, 8, 16); // whoever is throwing, in a suit
      if (st.fly) { const k = st.fly.k, x = X(st.fly.d * k), y = GY - 4 - Math.sin(k * Math.PI) * (70 + st.fly.d * 90); g.fillStyle = st.fly.mine ? '#6fb6ff' : '#ff8a70'; g.beginPath(); g.arc(x, y, 5, 0, 6.3); g.fill(); }
      // the gauge
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(26, 222, W - 52, 12); const need = (st.target - 0.12) / 0.86; g.fillStyle = 'rgba(255,212,90,.55)'; g.fillRect(26 + need * (W - 52) - 5, 222, 10, 12);
      if (st.mine && !st.fly && !st.over && st.wait <= 0) { g.fillStyle = '#fff'; g.fillRect(26 + power(st.t) * (W - 52) - 2, 218, 4, 20); } }
    function advance(dt) { st.t += dt; if (st.over) return;
      if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0 && !st.mine) st.fly = { d: U.clamp(st.target + gauss() * sd * (Math.random() < 0.08 ? 2.6 : 1), 0.05, 1), k: 0, mine: false }; }
      else if (st.mine && !st.fly) { st.clock -= dt; if (st.clock <= 0) yours(); }
      if (st.fly) { st.fly.k += dt * 0.62; if (st.fly.k >= 1) { const f = st.fly; st.fly = null; land(f.d, f.mine); } } } // slow: it hangs up there
    function tick(now) { if (cur !== st) return; const dt = Math.min(0.1, (now - st.last) / 1000); st.last = now; advance(dt); draw(); st.raf = requestAnimationFrame(tick); }
    st.stop = () => cancelAnimationFrame(st.raf); head(); ui.say.textContent = 'The mark on the gauge is the crater. Let go when your arm is on it.'; st.raf = requestAnimationFrame(tick);
    st.debug = { state: st, step: (dt) => { advance(dt); draw(); }, throwAt: (d) => { if (st.mine && !st.fly && st.wait <= 0 && !st.over) { st.fly = { d, k: 0, mine: true }; return true; } return false; } };
  }
  // ================= threading the rings: Halo's game =================
  // Three hoops turn one inside another, each with a gap in it. A dart goes through a hoop only when its gap is at the top. One tap for each hoop, outside in. Four darts each, a point a hoop
  function hoops(o) {
    const first = o.champ.split(' ')[0], ui = shell('Three Rings', `${o.champ} · ${o.stake} shards a side`), W = 320, sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1), pr = 0.5 + 0.38 * sk, cx = W / 2, cy = W / 2;
    const cv = $(`<canvas width="${W * 2}" height="${W * 2}" class="gb-canvas"></canvas>`); ui.stage.appendChild(cv); const g = cv.getContext('2d'); g.scale(2, 2);
    const st = { t: 0, turn: 0, ys: 0, ts: 0, mine: true, ring: 0, got: [], wait: 0, over: false, raf: 0, last: performance.now(), clock: 9, ph: [Math.random() * 6, Math.random() * 6, Math.random() * 6] }; cur = st;
    const RR = [128, 92, 56], SPD = [1.25 + sk * 0.7, -(1.7 + sk * 0.9), 2.2 + sk * 1.1], GAP = [0.5, 0.46, 0.42];
    const btn = $('<button class="btn big gb-throw">Throw</button>'), quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(btn); ui.foot.appendChild(quit);
    const head = () => { ui.score.innerHTML = `<span class="gb-you">You <b>${st.ys}</b></span><span class="gb-mid">dart ${Math.min(4, Math.floor(st.turn / 2) + 1)} of 4</span><span class="gb-them">${first} <b>${st.ts}</b></span>`; };
    const ang = (i) => st.ph[i] + st.t * SPD[i], off = (i) => { const a = ((ang(i) + Math.PI / 2) % 6.2832 + 6.2832 + Math.PI) % 6.2832 - Math.PI; return Math.abs(a); }; // how far the gap is from the top
    function endDart(mine) { const n = st.got.filter(Boolean).length; if (mine) st.ys += n; else st.ts += n; st.turn++; head(); ui.say.textContent = mine ? (n === 3 ? 'Clean through all three.' : n ? `Through ${n}.` : 'Stopped at the first hoop.') : (n === 3 ? `${first} threads all three.` : `${first} gets through ${n}.`);
      if (st.turn >= 8) { st.over = true; btn.remove(); quit.remove(); return finish(ui, o, st.ys > st.ts ? 'win' : st.ys < st.ts ? 'lose' : 'draw', st.ys > st.ts ? `${st.ys} to ${st.ts}. The stake is yours.` : st.ys < st.ts ? `${st.ts} to ${st.ys}. ${first} takes your stake.` : `${st.ys} all. Nobody pays.`); }
      st.mine = !mine; st.ring = 0; st.wait = 1.0; st.clock = 9; btn.disabled = !st.mine; }
    function hit(ok, mine) { st.got[st.ring] = ok; st.ring++; if (!ok || st.ring >= 3) { for (let i = st.ring; i < 3; i++) st.got[i] = false; endDart(mine); } }
    const yours = () => { if (st.over || !st.mine || st.wait > 0) return; if (st.ring === 0) st.got = []; hit(off(st.ring) < GAP[st.ring] / 2, true); };
    btn.addEventListener('click', yours); cv.addEventListener('pointerdown', yours); quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    function draw() { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, W, W); const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 170); gr.addColorStop(0, '#6b4a22'); gr.addColorStop(1, '#2a1a10'); g.fillStyle = gr; g.fillRect(0, 0, W, W);
      for (let i = 0; i < 3; i++) { const a = ang(i), live = st.mine && st.ring === i && st.wait <= 0 && !st.over; g.lineWidth = live ? 13 : 10; g.strokeStyle = i < st.ring && st.got[i] ? '#6fd37a' : i < st.ring && st.got[i] === false ? '#c2452f' : live ? '#ffd45a' : '#b98a3a'; g.beginPath(); g.arc(cx, cy, RR[i], a + GAP[i] / 2, a + 6.2832 - GAP[i] / 2); g.stroke(); }
      g.fillStyle = '#f4ead0'; g.beginPath(); g.arc(cx, cy, 14, 0, 6.3); g.fill(); g.fillStyle = '#c8452e'; g.beginPath(); g.arc(cx, cy, 6, 0, 6.3); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx, cy - RR[0] - 10); g.lineTo(cx - 7, cy - RR[0] - 24); g.lineTo(cx + 7, cy - RR[0] - 24); g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1.5; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(cx, cy - RR[0] - 10); g.lineTo(cx, cy - 16); g.stroke(); g.setLineDash([]); }
    function advance(dt) { st.t += dt; if (st.over) return; if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0 && !st.mine) { st.got = []; st.theirT = 0.5; } return; }
      if (st.mine) { st.clock -= dt; if (st.clock <= 0) { st.clock = 9; yours(); } } else { st.theirT -= dt; if (st.theirT <= 0) { st.theirT = 0.55; hit(Math.random() < pr - st.ring * 0.06, false); } } }
    function tick(now) { if (cur !== st) return; const dt = Math.min(0.1, (now - st.last) / 1000); st.last = now; advance(dt); draw(); st.raf = requestAnimationFrame(tick); }
    st.stop = () => cancelAnimationFrame(st.raf); head(); ui.say.textContent = 'Tap when the gap in the lit hoop is under the pointer. Outside hoop first.'; st.raf = requestAnimationFrame(tick);
    st.debug = { state: st, step: (dt) => { advance(dt); draw(); }, off, GAP, tap: yours };
  }

  // ================= signal: the Moon's memory game =================
  // Four beacon lamps. The keeper of the board lights a run of them, one longer every round. The champion repeats it, then you do.
  // Whoever fumbles first loses. If the champion fumbles you still have to get that round right to take the stake
  function signal(o) {
    const first = o.champ.split(' ')[0], ui = shell('Signal', `${o.champ} · ${o.stake} shards a side`), sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1);
    const limit = Math.max(3, Math.min(13, Math.round(5 + sk * 6.5 + gauss() * 1.2))); /* the round the champion drops it on */
    const st = { seq: [], round: 0, phase: 'show', at: 0, over: false, timers: [], themOut: false, limit }; cur = st;
    const COLS = ['#59e6ff', '#ffd45a', '#ff7ad1', '#8dff9a'], pad = $('<div class="gb-sig"></div>'), lamps = COLS.map((c, i) => { const b = $(`<i class="gs-lamp" style="--c:${c}"></i>`); b.addEventListener('pointerdown', () => press(i)); pad.appendChild(b); return b; }); ui.stage.appendChild(pad);
    const quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(quit); quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    const later = (fn, ms) => { const t = setTimeout(() => { if (cur === st && !st.over) fn(); }, ms); st.timers.push(t); };
    const head = () => { ui.score.innerHTML = `<span class="gb-you">You</span><span class="gb-mid">run of ${st.seq.length}</span><span class="gb-them">${first}</span>`; };
    const lit = (i, ms) => { lamps[i].classList.add('on'); if (typeof UI !== 'undefined' && UI.sfx) UI.sfx('tick'); setTimeout(() => lamps[i] && lamps[i].classList.remove('on'), ms); };
    function done(res, line) { st.over = true; quit.remove(); finish(ui, o, res, line); }
    function next() { st.round++; st.seq.push(Math.floor(Math.random() * 4)); st.phase = 'show'; head(); ui.say.textContent = 'Watch the lamps.'; const gap = Math.max(300, 620 - st.round * 22);
      st.seq.forEach((v, i) => later(() => lit(v, gap * 0.62), 500 + i * gap));
      later(() => { if (st.themOut) return yours(); if (st.round >= st.limit) { st.themOut = true; ui.say.textContent = `${first} goes for it and hits the wrong lamp ${Math.max(1, Math.floor(Math.random() * st.round) + 1)} in. Get this one right and the stake is yours.`; later(yours, 1500); } else { ui.say.textContent = `${first} taps it back clean.`; later(yours, 900); } }, 700 + st.seq.length * gap); }
    function yours() { st.phase = 'you'; st.at = 0; ui.say.textContent = 'Your turn. Tap them back in order.'; }
    function press(i) { if (st.over || st.phase !== 'you') return; lit(i, 180);
      if (i !== st.seq[st.at]) { st.phase = 'end'; return done(st.themOut ? 'draw' : 'lose', st.themOut ? 'You both dropped it on the same run. Nobody pays.' : `Wrong lamp. ${first} takes your stake.`); }
      if (++st.at >= st.seq.length) { st.phase = 'wait'; if (st.themOut) return done('win', `Clean, ${st.seq.length} long. The stake is yours.`); if (st.round >= 14) return done('draw', 'Fourteen long and neither of you has dropped it. Call it level.'); ui.say.textContent = 'Clean.'; later(next, 800); } }
    st.stop = () => st.timers.forEach(clearTimeout); head(); later(next, 600);
    st.debug = { state: st, press, yours, next };
  }
  // ================= bones: Halo's dice =================
  // Two knucklebones. Roll as often as you dare and the spots pile up; bank them and they are yours. A skull on either bone and the pile is gone.
  // Skulls on both and everything you have banked goes with it. First to fifty
  function bones(o) {
    const first = o.champ.split(' ')[0], ui = shell('Bones', `${o.champ} · ${o.stake} shards a side`), sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1), GOAL = 50;
    const st = { you: 0, them: 0, pile: 0, mine: true, over: false, busy: false, d: [3, 4], timers: [] }; cur = st;
    const table = $('<div class="gb-bones"><div class="gbn-dice"><i class="gbn-die"></i><i class="gbn-die"></i></div><div class="gbn-pile"></div></div>'); ui.stage.appendChild(table); const dice = table.querySelectorAll('.gbn-die'), pileEl = table.querySelector('.gbn-pile');
    const roll = $('<button class="btn big gb-throw">Roll</button>'), bank = $('<button class="btn big">Bank</button>'), quit = $('<button class="btn ghost">Give up</button>'); ui.foot.appendChild(roll); ui.foot.appendChild(bank); ui.foot.appendChild(quit);
    quit.addEventListener('click', () => { st.over = true; close(); if (o.onEnd) o.onEnd('lose'); });
    const later = (fn, ms) => { const t = setTimeout(() => { if (cur === st && !st.over) fn(); }, ms); st.timers.push(t); };
    const PIP = ['', '☠', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const show = () => { dice.forEach((e, i) => { e.textContent = PIP[st.d[i]]; e.classList.toggle('skull', st.d[i] === 1); }); pileEl.textContent = st.pile ? `${st.mine ? 'Your' : first + "'s"} pile: ${st.pile}` : ''; ui.score.innerHTML = `<span class="gb-you">You <b>${st.you}</b></span><span class="gb-mid">first to ${GOAL}</span><span class="gb-them">${first} <b>${st.them}</b></span>`; roll.disabled = bank.disabled = !st.mine || st.busy || st.over; bank.disabled = bank.disabled || !st.pile; };
    function done(res, line) { st.over = true; roll.remove(); bank.remove(); quit.remove(); finish(ui, o, res, line); }
    /* one throw for whoever's turn it is. Returns what happened so the champion can decide what to do next */
    function cast(force) { st.d = force || [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; const who = st.mine ? 'you' : 'them', a = st.d[0], b = st.d[1];
      if (a === 1 && b === 1) { st[who] = 0; st.pile = 0; ui.say.textContent = st.mine ? 'Two skulls. Everything you had banked is gone.' : `Two skulls. ${first} loses the lot.`; return 'wipe'; }
      if (a === 1 || b === 1) { st.pile = 0; ui.say.textContent = st.mine ? 'A skull. The pile is gone.' : `A skull. ${first} loses the pile.`; return 'bust'; }
      st.pile += a + b; ui.say.textContent = st.mine ? `${a + b}. Roll again or bank it.` : `${first} rolls ${a + b}.`; return 'ok'; }
    function pass() { st.pile = 0; st.mine = !st.mine; show(); if (!st.mine) later(theirs, 900); }
    function keep() { const who = st.mine ? 'you' : 'them'; st[who] += st.pile; st.pile = 0; if (st[who] >= GOAL) { show(); return done(st.mine ? 'win' : 'lose', st.mine ? `${st.you} to ${st.them}. The stake is yours.` : `${st.them} to ${st.you}. ${first} takes your stake.`); } pass(); }
    /* the champion: a good one holds at about twenty, presses when behind and goes for it when the line is in reach. A poor one holds too early or too late */
    function theirs() { const r = cast(); show(); if (r !== 'ok') return later(pass, 1100);
      const need = GOAL - st.them, hold = sk > 0.6 ? (st.you >= GOAL - 10 ? 99 : st.you - st.them > 15 ? 26 : 20) : sk > 0.35 ? 16 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 22);
      if (st.pile >= need || st.pile >= hold) return later(() => { ui.say.textContent = `${first} banks ${st.pile}.`; keep(); }, 900); later(theirs, 850); }
    roll.addEventListener('click', () => { if (st.over || !st.mine || st.busy) return; const r = cast(); show(); if (r !== 'ok') { st.busy = true; show(); later(() => { st.busy = false; pass(); }, 1100); } });
    bank.addEventListener('click', () => { if (st.over || !st.mine || st.busy || !st.pile) return; keep(); });
    st.stop = () => st.timers.forEach(clearTimeout); ui.say.textContent = 'Roll as long as you dare. A skull takes the pile.'; show();
    st.debug = { state: st, cast, keep, pass, show, theirs };
  }
  const KINDS = { signal: { name: 'Signal', fn: signal, blurb: 'Four lamps and a run that gets longer. First to fumble it pays.' }, bones: { name: 'Bones', fn: bones, blurb: 'Two knucklebones, first to fifty. Roll as long as you dare: a skull takes your pile.' }, ringboard: { name: 'Ringboard', fn: ringboard, blurb: 'Five throws each at the ringboard. Highest count takes both stakes.' }, draughts: { name: 'Draughts', fn: draughts, blurb: 'One game of draughts. Whoever is left without a move pays.' }, chess: { name: 'Chess', fn: chess, blurb: 'One game of chess. Mate takes both stakes.' }, moonshot: { name: 'Moonshot', fn: moonshot, blurb: 'Five stones each, lobbed at a marked crater. Nearest takes both stakes.' }, hoops: { name: 'Three Rings', fn: hoops, blurb: 'Four darts each through three turning hoops. Most hoops takes both stakes.' }, tide: { name: 'High Tide', fn: tide, blurb: 'Nine prizes, nine cards each. Higher card takes the prize, most points takes both stakes.' } };
  return { KINDS, play(kind, o) { const K = KINDS[kind]; if (!K) return false; K.fn(o || {}); return true; }, close, get current() { return cur; }, D, C };
})();
