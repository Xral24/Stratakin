'use strict';
// ---- Linkdown: the cartridge card game every town plays. Your deck is five of your own Kin; each card's power comes from the Kin's
// level and rarity. Three lanes, each with ground that favours one element. Five turns: each turn you both lay one cartridge face
// down in a lane, then flip. Win two lanes of three. A printing is a trick you can spend once: rare Peek, super Shift, ultra Surge,
// secret Overload. A friendly game for nothing, or a Kin each on the table and the winner keeps both. Lose yours and the one who won
// it sells it back for double ----
const Linkdown = (() => {
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const TRICK = { rare: ['Peek', 'see where they play this turn'], super: ['Shift', 'after the flip, move it to another lane'], ultra: ['Surge', '+3 power'], secret: ['Overload', '+5 power'] };
  const ECOL = { Flame: '#ff7a3c', Tide: '#3ca8ff', Bloom: '#58c45a', Stone: '#b08a5a', Gale: '#9fd8e8', Frost: '#bfe6ff', Spark: '#ffd23c', Void: '#8a6cff', Light: '#fff0a8' };
  const GROUND = { Flame: 'Ember flats', Tide: 'The shallows', Bloom: 'Long grass', Stone: 'Scree', Gale: 'Clifftop', Frost: 'Snowfield', Spark: 'Storm ridge', Void: 'Night hollow', Light: 'High noon' };
  const value = (k) => Math.round([150, 420, 1600, 6500, 9000][Math.min(4, k.sp.rarity || 0)] * (1 + k.level / 40));
  const power = (k) => U.clamp(2 + Math.round(k.level / 4) + (k.sp.rarity || 0) * 2, 2, 22);
  const elemOf = (k) => (KIN.dominant(k.sp.elem, 1)[0]) || 'Stone';
  const card = (k, mine) => ({ k, mine, pow: power(k), el: elemOf(k), fin: (k.card && k.card.finish) || 'normal', boost: 0, id: Math.random() });
  function laneVal(c, lane, opp) {
    let v = c.pow + c.boost + (c.el === lane.el ? 2 : 0);
    if (opp.some(o => KIN.effectiveness(c.el, o.k) > 1.2)) v += 2; // it has the edge on something across the lane
    return v;
  }
  const sums = (L) => L.map(l => [l.you.reduce((s, c) => s + laneVal(c, l, l.them), 0), l.them.reduce((s, c) => s + laneVal(c, l, l.you), 0)]);
  const isStarter = (k) => { try { return KIN.starters(G.baseSeed).some(sp => sp.seed === k.sp.seed || (k.sp.line != null && sp.line != null && sp.line === k.sp.line)); } catch (e) { return false; } };
  const stakeable = (k) => !k.bonded && !isStarter(k);

  // the other player's deck: rarer and higher the further out the town is
  function deckFor(o) {
    const t = o.tier || 0, r = U.rng(U.combine(U.strHash(o.champ || 'x'), 977 + t));
    const maxR = Math.min(3, Math.floor(t / 2) + (t >= 1 ? 1 : 0)); const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer !== 'Core' && !sp.legend && !sp.mythic && !sp.dino && (sp.rarity || 0) <= maxR);
    const out = []; for (let i = 0; i < 5 && pool.length; i++) { const sp = pool[r.int(pool.length)]; const lv = U.clamp(Math.round(5 + t * 7 + r() * 6), 3, KIN.capOf(sp)); const k = KIN.create(sp, lv);
      const fr = r(); k.card = { finish: fr < 0.04 * t ? 'ultra' : fr < 0.1 + 0.05 * t ? 'super' : fr < 0.3 + 0.05 * t ? 'rare' : 'normal' }; out.push(k); }
    return out;
  }
  // every town's player keeps one prize Kin back. Beat them enough times (once in the first village, up to fifteen in the big cities)
  // and they bring it out, staked and in their deck. It's the only way to get that printing of it
  const NEED = [1, 2, 3, 5, 8, 12, 15];
  const need = (tier) => NEED[U.clamp(tier || 0, 0, NEED.length - 1)];
  function prizeFor(vid, tier) {
    const r = U.rng(U.combine(U.strHash('prize:' + vid), 31)); const want = (tier || 0) >= 3 ? 3 : 2;
    const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer !== 'Core' && !sp.legend && !sp.mythic && !sp.dino && (sp.rarity || 0) === want);
    if (!pool.length) return null; const sp = pool[r.int(pool.length)]; const k = KIN.create(sp, U.clamp(10 + (tier || 0) * 8, 8, KIN.capOf(sp)));
    k.card = { finish: (tier || 0) >= 3 ? 'secret' : 'ultra', champion: true }; return k;
  }
  const townRec = (vid) => { const T = G.stats.ldTown || (G.stats.ldTown = {}); return T[vid] || (T[vid] = { wins: 0, prizeWon: false }); };
  // the other player's move: weigh every card in every lane, keep a little noise for a weaker player
  function aiMove(st) {
    const sk = U.clamp(st.o.skill == null ? 0.4 : st.o.skill, 0, 1); let best = null;
    const now = sums(st.L);
    for (const c of st.ai) for (let li = 0; li < 3; li++) { const l = st.L[li];
      const gain = laneVal(c, l, l.you); const [a, b] = now[li]; const after = b + gain;
      let score = gain; if (after > a && b <= a) score += 6; if (b > a + 8) score -= 5; if (a > b + gain + 6) score -= 4; // swing a lane, do not pile onto a won one or a lost one
      score += (Math.random() - 0.5) * 10 * (1 - sk);
      if (!best || score > best.score) best = { c, li, score }; }
    return best;
  }

  let box = null, st = null;
  function close() { if (box) { box.remove(); box = null; } st = null; if (typeof G !== 'undefined' && G.setPaused) G.setPaused(false); }
  function shell(title, sub) {
    if (box) box.remove(); box = $(`<div id="gamebox" class="ld"><div class="gb-card ld-card"><div class="gb-head"><b class="gb-title"></b><span class="gb-sub"></span></div><div class="gb-score"></div><div class="gb-stage ld-stage"></div><div class="gb-say"></div><div class="gb-foot"></div></div></div>`);
    box.querySelector('.gb-title').textContent = title; box.querySelector('.gb-sub').textContent = sub || ''; document.body.appendChild(box);
    if (typeof G !== 'undefined' && G.setPaused) G.setPaused(true);
    return { stage: box.querySelector('.gb-stage'), score: box.querySelector('.gb-score'), say: box.querySelector('.gb-say'), foot: box.querySelector('.gb-foot') };
  }
  function pic(cv, k) { try { KIN.portrait(cv, k.sp, k.stage || 1, 44); } catch (e) {} }
  function chip(c, face) {
    if (!face) return `<div class="ld-c ld-back"><span>?</span></div>`;
    const tr = TRICK[c.fin]; return `<div class="ld-c ld-${c.fin}" data-cid="${c.id}" style="--ec:${ECOL[c.el] || '#aaa'}"><canvas width="44" height="44"></canvas><b>${c.pow + c.boost}</b><i>${c.el}</i>${tr ? `<em>${tr[0]}</em>` : ''}</div>`;
  }

  // ---- step one: pick your five, and your stake ----
  function play(o) {
    o = o || {}; const mine = [...G.kin, ...(G.box || []).map(KIN.deserialize)];
    if (mine.length < 3) { UI.toast('You need at least three Kin on cartridges to sit down at Linkdown.'); if (o.onEnd) o.onEnd('none'); return; }
    const ui = shell('Linkdown', `${o.champ || 'A local'} · ${o.mode === 'stake' ? 'Kin on the table' : 'a friendly game'}`);
    const pick = new Set(mine.slice().sort((a, b) => power(b) - power(a)).slice(0, Math.min(5, mine.length)).map(k => k.id)); let stake = null;
    const ai = deckFor(o); let aiStake = ai.slice().sort((a, b) => value(b) - value(a))[0];
    if (o.prize) { const pk = prizeFor(o.villageId, o.tier); if (pk) { ai[ai.indexOf(ai.slice().sort((a, b) => power(a) - power(b))[0])] = pk; aiStake = pk; } }
    function draw() {
      ui.score.innerHTML = `<span class="gb-mid">Pick ${Math.min(5, mine.length)} cartridges${o.mode === 'stake' ? ', then the one you put on the table' : ''}</span>`;
      ui.stage.innerHTML = `<div class="ld-pick">${mine.map(k => { const c = card(k, true); return `<div class="ld-pk ${pick.has(k.id) ? 'on' : ''} ${stake === k.id ? 'stake' : ''}" data-k="${k.id}">${chip(c, true)}<small>${KIN.name(k)} · Lv ${k.level}${k.bonded ? ' · bonded' : ''}</small></div>`; }).join('')}</div>` +
        (o.mode === 'stake' ? `<p class="small ld-note">${o.prize ? 'Their prize: ' : 'They put up '}<b>${KIN.name(aiStake)}</b>, Lv ${aiStake.level}. Tap a chosen card again to stake it. Your starter and bonded Kin can't go on the table.</p>` : '');
      ui.stage.querySelectorAll('.ld-pk').forEach(el => { const k = mine.find(x => x.id == el.dataset.k); const cv = el.querySelector('canvas'); if (cv) pic(cv, k);
        el.addEventListener('click', () => { if (!pick.has(k.id)) { if (pick.size >= 5) { UI.toast('Five cartridges. Drop one first.'); return; } pick.add(k.id); }
          else if (o.mode === 'stake' && stake !== k.id && stakeable(k)) stake = k.id; else { pick.delete(k.id); if (stake === k.id) stake = null; } draw(); }); });
      const ready = pick.size === Math.min(5, mine.length) && (o.mode !== 'stake' || stake);
      ui.foot.innerHTML = ''; const go = $(`<button class="btn big" ${ready ? '' : 'disabled'}>Deal</button>`), back = $(`<button class="btn ghost">Leave the table</button>`);
      go.addEventListener('click', () => game(o, ui, mine.filter(k => pick.has(k.id)), ai, stake ? mine.find(k => k.id === stake) : null, aiStake));
      back.addEventListener('click', () => { close(); if (o.onEnd) o.onEnd('none'); }); ui.foot.append(go, back);
      ui.say.textContent = o.mode === 'stake' ? 'Winner keeps both Kin. Lose yours and they sell it back for double.' : 'Win two lanes of three. Ground that suits a Kin gives it +2.';
    }
    draw();
  }

  // ---- the game ----
  function game(o, ui, deck, ai, myStake, aiStake) {
    const r = U.rng(U.combine(U.strHash(o.champ || 'x'), (G.dayCount || 0) * 7 + 3)); const els = KIN.E.slice(); const lanes = [];
    while (lanes.length < 3) { const e = els.splice(r.int(els.length), 1)[0]; lanes.push({ el: e, you: [], them: [] }); }
    st = { o, L: lanes, hand: deck.map(k => card(k, true)), ai: ai.map(k => card(k, false)), turn: 0, sel: null, lane: null, peek: null, plan: null, shift: null, over: false };
    const name = (o.champ || 'They').split(' ')[0];
    function render() {
      const S = sums(st.L);
      ui.score.innerHTML = `<span class="gb-you">You <b>${S.filter(([a, b]) => a > b).length}</b></span><span class="gb-mid">turn ${Math.min(5, st.turn + 1)} of 5</span><span class="gb-them">${name} <b>${S.filter(([a, b]) => b > a).length}</b></span>`;
      ui.stage.innerHTML = `<div class="ld-lanes">${st.L.map((l, i) => `<div class="ld-lane ${st.lane === i ? 'sel' : ''} ${st.shift ? 'tgt' : ''}" data-l="${i}" style="--ec:${ECOL[l.el]}">
          <div class="ld-lt">${GROUND[l.el]}<small>${l.el} +2</small></div>
          <div class="ld-side them">${l.them.map(c => chip(c, true)).join('')}${st.peek && st.peek.li === i ? `<div class="ld-ghost">${chip(st.peek.c, true)}</div>` : ''}</div>
          <div class="ld-tot"><b class="${S[i][1] > S[i][0] ? 'win' : ''}">${S[i][1]}</b><b class="${S[i][0] > S[i][1] ? 'win' : ''}">${S[i][0]}</b></div>
          <div class="ld-side you">${l.you.map(c => chip(c, true)).join('')}${st.lane === i && st.sel ? `<div class="ld-ghost">${chip(st.sel, true)}</div>` : ''}</div></div>`).join('')}</div>
        <div class="ld-hand">${st.hand.map(c => `<div class="ld-h ${st.sel === c ? 'on' : ''}" data-h="${c.id}">${chip(c, true)}</div>`).join('')}</div>`;
      ui.stage.querySelectorAll('[data-cid]').forEach(el => { const c = [...st.hand, ...st.L.flatMap(l => [...l.you, ...l.them]), st.peek && st.peek.c].find(x => x && x.id == el.dataset.cid); const cv = el.querySelector('canvas'); if (c && cv) pic(cv, c.k); });
      ui.stage.querySelectorAll('[data-h]').forEach(el => el.addEventListener('click', () => { if (st.over || st.shift) return; st.sel = st.hand.find(c => c.id == el.dataset.h); render(); }));
      ui.stage.querySelectorAll('[data-l]').forEach(el => el.addEventListener('click', () => { const i = +el.dataset.l;
        if (st.shift) { const { c, from } = st.shift; if (i !== from) { st.L[from].you.splice(st.L[from].you.indexOf(c), 1); st.L[i].you.push(c); ui.say.textContent = `${KIN.name(c.k)} shifts across.`; } st.shift = null; next(); return; }
        if (st.over || !st.sel) return; st.lane = i; render(); }));
      foot();
    }
    function foot() {
      ui.foot.innerHTML = ''; if (st.over) return;
      if (st.shift) { const keep = $('<button class="btn ghost">Keep it there</button>'); keep.addEventListener('click', () => { st.shift = null; next(); }); ui.foot.append(keep); return; }
      if (st.sel && st.sel.fin === 'rare' && !st.sel.used && !st.peek) { const pk = $('<button class="btn">Peek</button>'); pk.addEventListener('click', () => { st.sel.used = true; st.plan = st.plan || aiMove(st); st.peek = { c: st.plan.c, li: st.plan.li }; ui.say.textContent = `You glimpse their cartridge: ${KIN.name(st.plan.c.k)}, going ${GROUND[st.L[st.plan.li].el].toLowerCase()}.`; render(); }); ui.foot.append(pk); }
      const flip = $(`<button class="btn big" ${st.sel && st.lane != null ? '' : 'disabled'}>Flip</button>`); flip.addEventListener('click', doFlip); ui.foot.append(flip);
    }
    function doFlip() {
      const me = st.sel, li = st.lane, them = st.plan || aiMove(st); st.plan = null; st.peek = null;
      if (me.fin === 'ultra' && !me.used) { me.boost += 3; me.used = true; } if (me.fin === 'secret' && !me.used) { me.boost += 5; me.used = true; }
      if (them.c.fin === 'ultra' && !them.c.used) { them.c.boost += 3; them.c.used = true; }
      st.hand.splice(st.hand.indexOf(me), 1); st.ai.splice(st.ai.indexOf(them.c), 1); st.L[li].you.push(me); st.L[them.li].them.push(them.c);
      st.sel = null; st.lane = null; UI.sfx && UI.sfx('click');
      ui.say.textContent = `${KIN.name(me.k)} to ${GROUND[st.L[li].el].toLowerCase()}. ${name} lays ${KIN.name(them.c.k)} on ${GROUND[st.L[them.li].el].toLowerCase()}.`;
      if (me.fin === 'super' && !me.used) { me.used = true; st.shift = { c: me, from: li }; ui.say.textContent += ' Shift: tap a lane to move it.'; render(); return; }
      next();
    }
    function next() { st.turn++; if (st.turn >= 5 || !st.hand.length || !st.ai.length) return end(); render(); }
    function end() {
      st.over = true; render(); const S = sums(st.L); const w = S.filter(([a, b]) => a > b).length, l = S.filter(([a, b]) => b > a).length;
      const ta = S.reduce((s, x) => s + x[0], 0), tb = S.reduce((s, x) => s + x[1], 0);
      const res = w > l ? 'win' : l > w ? 'lose' : ta > tb ? 'win' : ta < tb ? 'lose' : 'draw';
      let line = res === 'win' ? `${w} lanes to ${l}. ${name} pushes the cards over to you.` : res === 'lose' ? `${l} lanes to ${w}. ${name} grins.` : 'Dead level. Nobody wins, nobody pays.';
      if (o.mode === 'stake' && res === 'win') { const k = KIN.create(aiStake.sp, aiStake.level); k.card = aiStake.card; G.addKin(k); line += o.prize ? ` ${name} slides the prize over. ${KIN.name(k)}, champion's printing, is yours.` : ` ${KIN.name(k)} is yours now.`; }
      if (o.villageId) { const t = townRec(o.villageId); if (res === 'win') { if (o.prize) t.prizeWon = true; else t.wins++; }
        const left = need(o.tier) - t.wins; if (res === 'win' && !o.prize && !t.prizeWon) line += left > 0 ? ` "Beat me ${left} more time${left > 1 ? 's' : ''} and I'll bring out the one I keep back."` : ` "Fine. Next time I play my prize. You won't beat that."`; }
      if (o.mode === 'stake' && res === 'lose' && myStake) { lose(myStake, o); line += ` ${KIN.name(myStake)} goes with them. They'll sell it back for ◆ ${value(myStake) * 2}.`; }
      const s = G.stats.linkdown || (G.stats.linkdown = { won: 0, lost: 0 }); if (res === 'win') s.won++; else if (res === 'lose') s.lost++;
      ui.say.textContent = line; ui.foot.innerHTML = ''; const b = $('<button class="btn big">Done</button>'); b.addEventListener('click', () => { close(); if (o.onEnd) o.onEnd(res); if (G.save) G.save(); }); ui.foot.append(b);
      box.classList.add('gb-' + res); UI.sfx && UI.sfx(res === 'win' ? 'caught' : 'click');
    }
    ui.say.textContent = `Lanes: ${st.L.map(l => GROUND[l.el]).join(', ')}. Tap a cartridge, tap a lane, then flip.`; render();
  }

  // a staked Kin that was lost: off your cartridges, into the winner's case, for sale at double
  function lose(k, o) {
    let i = G.kin.indexOf(k); if (i >= 0) { G.kin.splice(i, 1); if (G.activeIdx >= G.kin.length) G.activeIdx = Math.max(0, G.kin.length - 1); }
    else { const j = (G.box || []).findIndex(d => d.id === k.id); if (j >= 0) G.box.splice(j, 1); }
    const L = G.stats.ldLost || (G.stats.ldLost = []); L.push({ data: KIN.serialize(k), price: value(k) * 2, champ: o.champ, at: o.villageId, day: G.dayCount || 0 });
  }
  function buyBack(i) { const L = G.stats.ldLost || []; const e = L[i]; if (!e) return false; if (G.shards < e.price) { UI.toast('Not enough Shards.', 'bad'); return false; }
    G.shards -= e.price; const k = KIN.deserialize(e.data); L.splice(i, 1); G.addKin(k); UI.toast(`${KIN.name(k)} is back on your cartridge.`, 'good'); return true; }
  return { play, close, buyBack, prizeFor, need, townRec, power, value, stakeable, get state() { return st; } };
})();
