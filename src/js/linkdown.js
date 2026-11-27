'use strict';
// ---- Linkdown: the cartridge card game every town plays. Your deck is up to five of your own Kin and up to three Threads (special
// cartridges, the game's magic and trap cards). Each Kin card has an attack and a defence from the Kin's own level, rarity and stats.
// 4000 life each. Your turn: draw, put down one Kin in attack (face up) or defence (face down), play Threads, then attack with
// anything in attack position. Attack into attack: the weaker breaks and its owner loses the difference. Attack into defence: higher
// breaks the defender, lower and the attacker's owner loses the difference. Empty side: the hit goes straight to their life. Element
// edge: +300 attack in that fight. A friendly game, or a Kin each on the table and the winner keeps both. Every town's player keeps
// a prize Kin back until you've beaten them enough ----
const Linkdown = (() => {
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
  const ECOL = { Flame: '#ff7a3c', Tide: '#3ca8ff', Bloom: '#58c45a', Stone: '#b08a5a', Gale: '#9fd8e8', Frost: '#bfe6ff', Spark: '#ffd23c', Void: '#8a6cff', Light: '#fff0a8' };
  const LP0 = 4000, SLOTS = 3;
  const RAR = ['Common', 'Uncommon', 'Rare', 'Ultra'];
  // ---- the Threads, first set of twenty ----
  const THREADS = {
    mend:       { name: 'Mend', rar: 0, tgt: 'none', txt: 'Get back 1000 life.' },
    charge:     { name: 'Spark Charge', rar: 0, tgt: 'own', txt: 'One of your Kin: +500 attack this turn.' },
    brace:      { name: 'Bracewire', rar: 0, tgt: 'own', txt: 'One of your Kin: +400 defence for good.' },
    quickdraw:  { name: 'Quickdraw', rar: 0, tgt: 'none', txt: 'Draw two cards.' },
    flip:       { name: 'Flip Switch', rar: 0, tgt: 'any', txt: "Swap a Kin's attack and defence." },
    turnabout:  { name: 'Turnabout', rar: 0, tgt: 'foe', txt: 'Turn an enemy Kin to the other position.' },
    rally:      { name: 'Rally', rar: 0, tgt: 'none', txt: 'All your Kin: +300 attack this turn.' },
    wind:       { name: 'Second Wind', rar: 0, tgt: 'none', txt: 'Draw one card and get back 500 life.' },
    rewind:     { name: 'Rewind', rar: 1, tgt: 'grave', txt: 'Bring your strongest broken Kin back, in attack.' },
    net:        { name: 'Hushweave Net', rar: 1, tgt: 'foe', txt: "An enemy Kin can't attack next turn." },
    double:     { name: 'Double Strike', rar: 1, tgt: 'own', txt: 'One of your Kin can attack twice this turn.' },
    gale:       { name: 'Gale Push', rar: 1, tgt: 'foe', txt: "Blow an enemy Kin back into its owner's hand." },
    lantern:    { name: 'Lantern Light', rar: 1, tgt: 'none', txt: "See your opponent's hand. Draw one card." },
    mirror:     { name: 'Mirror Shell', rar: 2, tgt: 'trap', txt: 'Trap. When they attack, every enemy Kin in attack position breaks.' },
    loompull:   { name: 'Loom Pull', rar: 2, tgt: 'foe', txt: 'Take an enemy Kin for this turn.' },
    ward:       { name: 'Bond Ward', rar: 2, tgt: 'none', txt: "Your Kin can't be broken until your next turn." },
    fusion:     { name: 'Fusion Thread', rar: 2, tgt: 'none', txt: 'Weave your two strongest Kin into one: 80% of both added together.' },
    blacklink:  { name: 'Black Link', rar: 2, tgt: 'foe', txt: 'Rustcoat tech. Break an enemy Kin, and lose 1000 life.' },
    sinkhole:   { name: 'Sinkhole', rar: 3, tgt: 'none', txt: 'Every Kin on the table breaks.' },
    thunderfall:{ name: 'Thunderfall', rar: 3, tgt: 'none', txt: 'Every enemy Kin breaks.' },
  };
  const TIDS = Object.keys(THREADS);
  const FIN = { rare: [100, 0], super: [100, 100], ultra: [200, 200], secret: [300, 300] };
  const value = (k) => Math.round([150, 420, 1600, 6500, 9000][Math.min(4, k.sp.rarity || 0)] * (1 + k.level / 40));
  const elemOf = (k) => { try { return KIN.dominant(k.sp.elem, 1)[0] || 'Stone'; } catch (e) { return 'Stone'; } };
  function atkdef(k) {
    const P = 2 + k.level / 4 + (k.sp.rarity || 0) * 2; let ratio = 0.5;
    try { const s = KIN.stats(k), a = Math.max(s.atk, s.pow), d = (s.def + s.hp / 4) / 2; ratio = U.clamp(0.5 + (a / (a + d) - 0.5) * 1.6, 0.25, 0.75); } catch (e) {}
    const f = FIN[(k.card && k.card.finish)] || [0, 0], B = bondBoost(k);
    return [Math.round(P * (0.5 + ratio) * B) * 100 + f[0], Math.round(P * (1.5 - ratio) * B) * 100 + f[1]];
  }
  // the table reads the bond on the cartridge: a Kin that trusts you plays harder for you. It grows slowly, then fast near the top,
  // and a Kin bonded for good plays at its very best
  const bondOf = (k) => k.bonded ? 1 : U.clamp(k.bond || 0, 0, 1);
  const bondBoost = (k) => k.bonded ? 1.6 : 1 + 0.4 * Math.pow(bondOf(k), 1.5);
  const bondLife = (kin) => kin.reduce((n, k) => n + (k.bonded ? 500 : (k.bond || 0) >= 0.5 ? 250 : 0), 0);
  const power = (k) => { const [a, d] = atkdef(k); return Math.round((a + d) / 200); };
  let uid = 1;
  const kinCard = (k) => { const [a, d] = atkdef(k); return { type: 'kin', k, atk: a, def: d, el: elemOf(k), fin: (k.card && k.card.finish) || 'normal', pos: 'atk', id: uid++, temp: 0, swings: 0, stun: 0 }; };
  const threadCard = (t) => ({ type: 'thread', t, id: uid++ });
  const isStarter = (k) => { try { return KIN.starters(G.baseSeed).some(sp => sp.seed === k.sp.seed || (k.sp.line != null && sp.line != null && sp.line === k.sp.line)); } catch (e) { return false; } };
  const stakeable = (k) => !k.bonded && !isStarter(k);
  const owned = () => G.stats.threads || (G.stats.threads = {});
  function giveThread(t, n = 1) { const o = owned(); o[t] = (o[t] || 0) + n; }
  // a Thread you play is spent for a while: once a game at most, then it cools down for a number of games that grows with rarity
  const CD = [1, 2, 3, 5];
  const cds = () => G.stats.threadCd || (G.stats.threadCd = {});
  const ready = (t) => Math.max(0, (owned()[t] || 0) - (cds()[t] || []).length);
  function tickCooldowns(used) { const C = cds(); for (const t in C) { C[t] = C[t].map(n => n - 1).filter(n => n > 0); if (!C[t].length) delete C[t]; } for (const t of used) (C[t] || (C[t] = [])).push(CD[THREADS[t].rar]); }
  function rollThread(tier) { const r = Math.random(), want = r < 0.03 + 0.02 * tier ? 3 : r < 0.12 + 0.05 * tier ? 2 : r < 0.4 + 0.05 * tier ? 1 : 0; const pool = TIDS.filter(t => THREADS[t].rar === want); return pool[Math.floor(Math.random() * pool.length)]; }

  // ---- the other player's deck, and the prize they keep back ----
  function deckFor(o) {
    const t = o.tier || 0, tr = o.train || 0, r = U.rng(U.combine(U.strHash(o.champ || 'x'), 977 + t + tr * 131));
    const maxR = Math.min(3, Math.floor(t / 2) + (t >= 1 ? 1 : 0)); const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer !== 'Core' && !sp.legend && !sp.mythic && !sp.dino && (sp.rarity || 0) <= maxR);
    const kin = []; for (let i = 0; i < 5 && pool.length; i++) { const sp = pool[r.int(pool.length)]; const lv = U.clamp(Math.round(5 + t * 7 + tr * 4 + r() * 6), 3, KIN.capOf(sp)); const k = KIN.create(sp, lv);
      const fr = r(); k.bond = U.clamp(0.15 + t * 0.1 + tr * 0.2 + r() * 0.2, 0, 0.98); k.card = { finish: fr < 0.04 * t ? 'ultra' : fr < 0.1 + 0.05 * t ? 'super' : fr < 0.3 + 0.05 * t ? 'rare' : 'normal' }; kin.push(k); }
    const th = []; const nT = U.clamp(1 + Math.floor(t / 2), 1, 3); for (let i = 0; i < nT; i++) { const want = Math.min(3, r() < 0.15 * t ? 2 : r() < 0.35 + 0.1 * t ? 1 : 0); const p = TIDS.filter(x => THREADS[x].rar === want && x !== 'blacklink'); th.push(p[r.int(p.length)]); }
    return { kin, th };
  }
  const NEED = [1, 2, 3, 5, 8, 12, 15];
  const need = (tier) => NEED[U.clamp(tier || 0, 0, NEED.length - 1)];
  function prizeFor(vid, tier) {
    const r = U.rng(U.combine(U.strHash('prize:' + vid), 31)); const want = (tier || 0) >= 3 ? 3 : 2;
    const pool = KIN.dex('earth').filter(sp => !sp.fusion && sp.home && sp.home.layer !== 'Core' && !sp.legend && !sp.mythic && !sp.dino && (sp.rarity || 0) === want);
    if (!pool.length) return null; const sp = pool[r.int(pool.length)]; const k = KIN.create(sp, U.clamp(10 + (tier || 0) * 8, 8, KIN.capOf(sp)));
    k.bond = 0.9; k.card = { finish: (tier || 0) >= 3 ? 'secret' : 'ultra', champion: true }; return k;
  }
  const townRec = (vid) => { const T = G.stats.ldTown || (G.stats.ldTown = {}); const t = T[vid] || (T[vid] = { wins: 0, prizeWon: false }); t.titles = t.titles || (t.prizeWon ? 1 : 0); return t; };
  // after you take their prize, a town's player goes off to train their bonds, then comes back for a title rematch. They won't stake a
  // Kin again: they stake a Thread instead. Second title, a rare one; from the third on, an ultra, and each loss sends them off for longer
  const away = (vid) => { const t = townRec(vid); return Math.max(0, (t.awayUntil || 0) - (G.dayCount || 0)); };
  function titleThread(vid, titles) { const want = titles >= 2 ? 3 : 2; const pool = TIDS.filter(x => THREADS[x].rar === want); return pool[(U.strHash('tt:' + vid + ':' + titles) >>> 0) % pool.length]; }

  // ---- pictures: one render per species, kept as an image ----
  const PIC = {};
  function picOf(k) { const key = k.sp.seed + ':' + (k.stage || 1); if (PIC[key] != null) return PIC[key]; try { const cv = document.createElement('canvas'); cv.width = cv.height = 96; KIN.portrait(cv, k.sp, k.stage || 1, 96); PIC[key] = cv.toDataURL(); } catch (e) { PIC[key] = ''; } return PIC[key]; }

  // ---- the table ----
  let box = null, st = null;
  const fast = () => typeof window !== 'undefined' && window.__ldFast;
  const sleep = (ms) => new Promise(r => setTimeout(r, fast() ? 1 : ms));
  function close() { if (box) { box.remove(); box = null; } if (st) st.gone = true; st = null; if (typeof G !== 'undefined' && G.setPaused) G.setPaused(false); }
  function shell(title, sub) {
    if (box) box.remove(); box = $(`<div id="gamebox" class="ld"><div class="gb-card ld-card"><div class="gb-head"><b class="gb-title"></b><span class="gb-sub"></span></div><div class="gb-stage ld-stage"></div><div class="gb-say"></div><div class="gb-foot"></div></div></div>`);
    box.querySelector('.gb-title').textContent = title; box.querySelector('.gb-sub').textContent = sub || ''; document.body.appendChild(box);
    if (typeof G !== 'undefined' && G.setPaused) G.setPaused(true);
    return { stage: box.querySelector('.gb-stage'), say: box.querySelector('.gb-say'), foot: box.querySelector('.gb-foot') };
  }
  function kinHTML(c, opts = {}) {
    if (!c) return `<div class="ld-slot ${opts.cls || ''}" ${opts.data || ''}></div>`;
    const a = c.atk + c.temp, hidden = c.pos === 'def' && opts.foe && !c.shown;
    if (hidden) return `<div class="ld-c ld-back ld-def ${opts.cls || ''}" data-id="${c.id}" ${opts.data || ''}><span>DEF</span></div>`;
    return `<div class="ld-c ld-${c.fin} ${c.pos === 'def' ? 'ld-def' : ''} ${opts.cls || ''} ${c.stun ? 'stun' : ''}" data-id="${c.id}" ${opts.data || ''} style="--ec:${ECOL[c.el] || '#aaa'}">
      <div class="ld-bond ${c.k.bonded ? 'full' : ''}" title="bond"><i style="width:${Math.round(bondOf(c.k) * 100)}%"></i></div><img src="${picOf(c.k)}" alt=""><div class="ld-n">${KIN.name(c.k)}</div><div class="ld-ad"><b class="${c.pos === 'atk' ? 'on' : ''}">⚔${a}</b><b class="${c.pos === 'def' ? 'on' : ''}">⛨${c.def}</b></div><i>${c.el}</i></div>`;
  }
  function threadHTML(c, opts = {}) {
    const T = THREADS[c.t]; return `<div class="ld-c ld-th ld-tr${T.rar} ${opts.cls || ''}" data-id="${c.id}" ${opts.data || ''}><div class="ld-tn">${T.name}</div><div class="ld-tt">${T.txt}</div><i>${RAR[T.rar]}${T.tgt === 'trap' ? ' trap' : ''}</i></div>`;
  }
  const cardHTML = (c, o) => c.type === 'kin' ? kinHTML(c, o) : threadHTML(c, o);

  // ---- step one: build your deck, pick your stake ----
  function play(o) {
    o = o || {}; const mine = [...G.kin, ...(G.box || []).map(KIN.deserialize)];
    if (mine.length < 3) { UI.toast('You need at least three Kin on cartridges to sit down at Linkdown.'); if (o.onEnd) o.onEnd('none'); return; }
    if (!G.stats.ldTruce && typeof G.explain === 'function') { G.stats.ldTruce = true; setTimeout(() => G.explain('Why the table?', "The Hearth Truce. After the tyrants, every town swore no Kin fights for real inside its walls unless it's protecting the place. So everything else gets settled here. Slot a cartridge into the table and it plays that Kin's echo, read off the thread, bond and all. The echo can break, your Kin can't. That's why you can stake a Kin and nobody gets hurt, and why a Kin that trusts you plays harder here."), 400); }
    if (!G.stats.ldStarter) { G.stats.ldStarter = true; giveThread('mend'); giveThread('charge'); giveThread('quickdraw'); UI.toast('First game: the table gives you three Threads. Mend, Spark Charge and Quickdraw.', 'good'); }
    const ui = shell('Linkdown', `${o.champ || 'A local'} · ${o.rematch ? 'title rematch' : o.prize ? 'the prize' : o.mode === 'stake' ? 'Kin on the table' : 'a friendly game'}`);
    const pick = new Set(mine.slice().sort((a, b) => power(b) - power(a)).slice(0, 5).map(k => k.id)); let stake = null;
    const own = owned(); const tpick = {}; let tn = 0; for (const t of TIDS) { const n = Math.min(ready(t), 3 - tn); if (n > 0) { tpick[t] = n; tn += n; } }
    if (o.rematch) { o.train = townRec(o.villageId).titles; o.thread = titleThread(o.villageId, o.train); }
    const foe = deckFor(o); let aiStake = foe.kin.slice().sort((a, b) => value(b) - value(a))[0];
    if (o.prize) { const pk = prizeFor(o.villageId, o.tier); if (pk) { const weak = foe.kin.slice().sort((a, b) => power(a) - power(b))[0]; foe.kin[foe.kin.indexOf(weak)] = pk; aiStake = pk; } }
    function draw() {
      const tcount = Object.values(tpick).reduce((a, b) => a + b, 0);
      ui.stage.innerHTML = `<p class="small ld-note">Up to five Kin and three Threads. The table reads each cartridge's bond: the closer a Kin is to you, the harder it plays, and bonded Kin add to your life. ${o.mode === 'stake' ? `${o.rematch ? `They won't stake a Kin again. They put up a Thread: <b>${THREADS[o.thread].name}</b> (${RAR[THREADS[o.thread].rar]}).` : `${o.prize ? 'Their prize' : 'They put up'}: <b>${KIN.name(aiStake)}</b>, Lv ${aiStake.level}.`} Tap one of your chosen Kin again to stake it (not your starter, not a bonded Kin).` : ''}</p>
        <div class="ld-pick">${mine.map(k => `<div class="ld-pk ${pick.has(k.id) ? 'on' : ''} ${stake === k.id ? 'stake' : ''}" data-k="${k.id}">${kinHTML(kinCard(k))}<small>Lv ${k.level}${k.bonded ? ' · bonded' : ''}${stake === k.id ? ' · STAKED' : ''}</small></div>`).join('')}</div>
        <h4 class="ld-h4">Threads <small>${tcount}/3</small></h4><div class="ld-pick">${TIDS.filter(t => own[t]).map(t => `<div class="ld-pk ${tpick[t] ? 'on' : ''} ${ready(t) ? '' : 'cool'}" data-t="${t}">${threadHTML(threadCard(t))}<small>${ready(t) ? `${tpick[t] || 0} of ${ready(t)}` : ''}${(cds()[t] || []).length ? `${ready(t) ? ' · ' : ''}cooling ${Math.min(...cds()[t])} game${Math.min(...cds()[t]) > 1 ? 's' : ''}` : ''}</small></div>`).join('') || '<p class="small">No Threads yet. Win games to earn them. Each one you play cools down after: commons for a game, uncommons two, rares three, ultras five.</p>'}</div>`;
      ui.stage.querySelectorAll('[data-k]').forEach(el => el.addEventListener('click', () => { const k = mine.find(x => x.id == el.dataset.k);
        if (!pick.has(k.id)) { if (pick.size >= 5) { UI.toast('Five Kin at most. Drop one first.'); return; } pick.add(k.id); }
        else if (o.mode === 'stake' && stake !== k.id && stakeable(k)) stake = k.id; else { pick.delete(k.id); if (stake === k.id) stake = null; } draw(); }));
      ui.stage.querySelectorAll('[data-t]').forEach(el => el.addEventListener('click', () => { const t = el.dataset.t, cur = tpick[t] || 0;
        if (!ready(t)) { UI.toast(`${THREADS[t].name} is cooling down. Rarer Threads take longer.`); return; } if (cur < ready(t) && tcount < 3) tpick[t] = cur + 1; else delete tpick[t]; draw(); }));
      const ok = pick.size >= 3 && (o.mode !== 'stake' || stake);
      ui.foot.innerHTML = ''; const go = $(`<button class="btn big" ${ok ? '' : 'disabled'}>Shuffle and deal</button>`), back = $(`<button class="btn ghost">Leave the table</button>`);
      go.addEventListener('click', () => { const th = []; for (const t in tpick) for (let i = 0; i < tpick[t]; i++) th.push(t); game(o, ui, mine.filter(k => pick.has(k.id)), th, foe, stake ? mine.find(k => k.id === stake) : null, aiStake); });
      back.addEventListener('click', () => { close(); if (o.onEnd) o.onEnd('none'); }); ui.foot.append(go, back);
      ui.say.textContent = o.rematch ? 'Win and the Thread is yours. Lose and they keep your Kin, and sell it back for double.' : o.mode === 'stake' ? 'Winner keeps both Kin. Lose yours and they sell it back for double.' : 'Knock their life from 4000 to nothing.';
    }
    draw();
  }

  // ---- the game ----
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function side(kin, th) { return { lp: LP0, deck: shuffle([...kin.map(kinCard), ...th.map(threadCard)]), hand: [], field: Array(SLOTS).fill(null), grave: [], trap: null, ward: false }; }
  function game(o, ui, myKin, myTh, foe, myStake, aiStake) {
    st = { o, me: side(myKin, myTh), ai: side(foe.kin, foe.th), used: [], turn: 'me', summoned: false, sel: null, pending: null, busy: false, over: false, n: 0, reveal: false };
    const S = st; const name = (o.champ || 'They').split(' ')[0];
    S.me.lp += bondLife(myKin); S.ai.lp += bondLife(foe.kin); S.me.lp0 = S.me.lp; S.ai.lp0 = S.ai.lp;
    const say = (t) => { if (!S.gone) ui.say.textContent = t; };
    function drawCard(sd) { const c = sd.deck.pop(); if (c) sd.hand.push(c); return c; }
    for (let i = 0; i < 4; i++) { drawCard(S.me); drawCard(S.ai); }
    const other = (sd) => sd === S.me ? S.ai : S.me;
    const freeSlot = (sd) => sd.field.indexOf(null);
    const kinsOf = (sd) => sd.field.filter(Boolean);
    const elemEdge = (a, d) => { try { return KIN.effectiveness(a.el, d.k) > 1.2; } catch (e) { return false; } };
    const react = (good) => { const L = good ? ['"Ha! Didn\'t see that coming, did you?"', '"That\'s how it\'s done."', '"Keep up."'] : ['"Oh, come on."', '"Lucky."', '"Right. Fine. My turn next."', '"That was my best one!"']; return L[Math.floor(Math.random() * L.length)]; };
    function render() {
      if (S.gone) return;
      const lpBar = (sd, who) => `<div class="ld-lp ${who}"><span>${who === 'ai' ? name : 'You'}</span><div class="ld-lpbar"><i style="width:${U.clamp(sd.lp / (sd.lp0 || LP0), 0, 1) * 100}%"></i></div><b>${Math.max(0, sd.lp)}</b><small>deck ${sd.deck.length}</small></div>`;
      ui.stage.innerHTML = `<div class="ld-table">
        ${lpBar(S.ai, 'ai')}
        <div class="ld-hand foe">${S.ai.hand.map(c => S.reveal ? cardHTML(c, { cls: 'mini' }) : `<div class="ld-c ld-back mini"><span>✦</span></div>`).join('')}</div>
        <div class="ld-row foe">${S.ai.field.map((c, i) => kinHTML(c, { foe: true, data: `data-fs="${i}"` })).join('')}<div class="ld-trap">${S.ai.trap ? '<div class="ld-c ld-back mini"><span>✦</span></div>' : ''}</div></div>
        <div class="ld-mid">${S.turn === 'me' ? 'Your turn' : name + "'s turn"} · ${S.n + 1}${S.me.ward ? ' · your side warded' : ''}${S.ai.ward ? ' · their side warded' : ''}</div>
        <div class="ld-row me">${S.me.field.map((c, i) => kinHTML(c, { cls: (S.sel && c && S.sel.id === c.id) ? 'sel' : (c && c.pos === 'atk' && c.swings > 0 && !c.stun && S.turn === 'me' ? 'ready' : ''), data: `data-ms="${i}"` })).join('')}<div class="ld-trap">${S.me.trap ? threadHTML(S.me.trap, { cls: 'mini' }) : ''}</div></div>
        ${lpBar(S.me, 'me')}
        <div class="ld-hand me">${S.me.hand.map(c => cardHTML(c, { cls: (S.pending && S.pending.card === c) ? 'sel' : '', data: `data-h="${c.id}"` })).join('')}</div></div>`;
      bind(); foot();
    }
    function foot() {
      if (S.gone) return; ui.foot.innerHTML = ''; if (S.over || S.turn !== 'me' || S.busy) return;
      const P = S.pending;
      if (P && P.card.type === 'kin') { for (const pos of ['atk', 'def']) { const b = $(`<button class="btn ${pos === 'atk' ? '' : 'ghost'}">${pos === 'atk' ? '⚔ Attack position' : '⛨ Defence, face down'}</button>`); b.addEventListener('click', () => summon(S.me, P.card, pos)); ui.foot.append(b); } }
      if (S.sel && kinsOf(S.ai).length === 0) { const b = $('<button class="btn">Hit them direct</button>'); b.addEventListener('click', () => attack(S.me, S.sel, null)); ui.foot.append(b); }
      if (P || S.sel) { const c = $('<button class="btn ghost">Cancel</button>'); c.addEventListener('click', () => { S.pending = null; S.sel = null; render(); }); ui.foot.append(c); }
      const end = $('<button class="btn big">End turn</button>'); end.addEventListener('click', () => endTurn()); ui.foot.append(end);
    }
    function bind() {
      if (S.over || S.turn !== 'me' || S.busy) return;
      ui.stage.querySelectorAll('[data-h]').forEach(el => el.addEventListener('click', () => {
        const c = S.me.hand.find(x => x.id == el.dataset.h); if (!c) return; S.sel = null;
        if (c.type === 'kin') { if (S.summoned) { say('One Kin a turn. Play a Thread or attack.'); return; } if (freeSlot(S.me) < 0) { say('No room on your side of the table.'); return; } S.pending = { card: c }; say(`${KIN.name(c.k)}: attack position, or face down in defence?`); render(); return; }
        const T = THREADS[c.t];
        if (T.tgt === 'trap') { if (S.me.trap) { say('You already have a trap set.'); return; } S.me.hand.splice(S.me.hand.indexOf(c), 1); S.me.trap = c; S.used.push(c.t); say('You set a Thread face down. It springs when they attack.'); render(); return; }
        if (T.tgt === 'none' || T.tgt === 'grave') { castThread(S.me, c, null); return; }
        if (T.tgt === 'own' && !kinsOf(S.me).length) { say(`${T.name} needs one of your Kin on the table.`); return; }
        if (T.tgt === 'foe' && !kinsOf(S.ai).length) { say(`${T.name} needs one of their Kin on the table.`); return; }
        S.pending = { card: c }; say(`${T.name}: ${T.tgt === 'own' ? 'tap one of your Kin' : T.tgt === 'foe' ? 'tap one of their Kin' : 'tap any Kin'}.`); render(); }));
      ui.stage.querySelectorAll('[data-ms]').forEach(el => el.addEventListener('click', () => { const c = S.me.field[+el.dataset.ms]; const P = S.pending;
        if (P && P.card.type === 'thread' && c && (THREADS[P.card.t].tgt === 'own' || THREADS[P.card.t].tgt === 'any')) { castThread(S.me, P.card, c); return; }
        if (!c) return;
        if (c.pos === 'def') { say('Face down in defence: it guards, it does not attack.'); return; }
        if (c.stun) { say(`${KIN.name(c.k)} is tangled in a net this turn.`); return; }
        if (c.swings <= 0) { say(`${KIN.name(c.k)} has already attacked this turn.`); return; }
        S.sel = c; S.pending = null; say(`${KIN.name(c.k)} is ready. Tap one of their Kin${kinsOf(S.ai).length ? '' : ', or hit them direct'}.`); render(); }));
      ui.stage.querySelectorAll('[data-fs]').forEach(el => el.addEventListener('click', () => { const c = S.ai.field[+el.dataset.fs]; if (!c) return; const P = S.pending;
        if (P && P.card.type === 'thread' && (THREADS[P.card.t].tgt === 'foe' || THREADS[P.card.t].tgt === 'any')) { castThread(S.me, P.card, c); return; }
        if (S.sel) attack(S.me, S.sel, c); }));
    }
    // ---- summoning, with a slam ----
    async function summon(sd, c, pos) {
      const i = freeSlot(sd); if (i < 0) return; sd.hand.splice(sd.hand.indexOf(c), 1); c.pos = pos; c.shown = pos === 'atk'; c.swings = pos === 'atk' ? 1 : 0; sd.field[i] = c; if (sd === S.me) { S.summoned = true; S.pending = null; }
      S.busy = true; render(); const el = ui.stage.querySelector(`[data-id="${c.id}"]`); if (el) el.classList.add('slam'); UI.sfx && UI.sfx('click');
      say(pos === 'atk' ? `${sd === S.me ? 'You put' : name + ' puts'} down ${KIN.name(c.k)} in attack: ${c.atk + c.temp}.` : `${sd === S.me ? 'You set' : name + ' sets'} a Kin face down in defence.`); if (bondOf(c.k) >= 0.5 && pos === 'atk') await floater(`[data-id="${c.id}"]`, c.k.bonded ? '♥ bonded ×1.6' : `♥ bond +${Math.round((bondBoost(c.k) - 1) * 100)}%`, 'bond'); else await sleep(450); S.busy = false; render();
    }
    function breakKin(sd, c) { const i = sd.field.indexOf(c); if (i < 0 || sd.ward) return false; sd.field[i] = null; c.temp = 0; c.stun = 0; if (c.borrowed) { c.borrowed.grave.push(c); c.borrowed = null; } else sd.grave.push(c); return true; }
    async function crack(c) { const el = ui.stage.querySelector(`[data-id="${c.id}"]`); if (el) el.classList.add('crack'); await sleep(420); }
    async function floater(sel, txt, cls) { const el = ui.stage.querySelector(sel); if (!el) return; const f = $(`<div class="ld-float ${cls || ''}">${txt}</div>`); el.appendChild(f); await sleep(700); f.remove(); }
    async function hurt(sd, n) { if (n <= 0) return; sd.lp -= n; const who = sd === S.me ? 'me' : 'ai'; render(); const bar = ui.stage.querySelector(`.ld-lp.${who}`); if (bar) bar.classList.add('hit'); if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); } UI.sfx && UI.sfx('hurt'); await floater(`.ld-lp.${who}`, `-${n}`, 'dmg'); }
    // ---- the fight: lunge, flash, numbers ----
    async function attack(sd, a, d) {
      if (S.busy || S.over) return; S.busy = true; S.sel = null; const foe = other(sd); a.swings--; render();
      const aEl = ui.stage.querySelector(`[data-id="${a.id}"]`), dEl = d ? ui.stage.querySelector(`[data-id="${d.id}"]`) : ui.stage.querySelector(`.ld-lp.${foe === S.me ? 'me' : 'ai'}`);
      if (aEl && dEl) { const r1 = aEl.getBoundingClientRect(), r2 = dEl.getBoundingClientRect(); aEl.style.transition = 'transform .22s ease-in'; aEl.style.transform = `translate(${(r2.left - r1.left) * 0.7}px, ${(r2.top - r1.top) * 0.7}px) scale(1.12)`; aEl.style.zIndex = 5; }
      await sleep(240);
      // their trap springs on the first attack
      if (foe.trap && THREADS[foe.trap.t].tgt === 'trap') { const t = foe.trap; foe.trap = null; foe.grave.push(t); say(`Trap! ${THREADS[t.t].name}: every Kin attacking for ${sd === S.me ? 'you' : name} breaks.`); box && box.classList.add('flash');
        const gone = kinsOf(sd).filter(c => c.pos === 'atk'); for (const c of gone) await crack(c); for (const c of gone) breakKin(sd, c); await sleep(500); box && box.classList.remove('flash'); S.busy = false; render(); if (sd === S.me) say(`Trap! Mirror Shell. ${name}: ${react(true)}`); await checkEnd(); return; }
      const edge = d ? elemEdge(a, d) : false, A = a.atk + a.temp + (edge ? 300 : 0);
      if (dEl) dEl.classList.add('hitfx'); if (edge) await floater(`[data-id="${a.id}"]`, `${a.el} edge +300`, 'edge');
      await sleep(200); if (d) { d.shown = true; render(); await sleep(250); }
      const mine = sd === S.me; let goodForThem = !mine;
      if (!d) { say(`${KIN.name(a.k)} hits ${foe === S.me ? 'you' : name} straight on for ${A}.`); await hurt(foe, A); }
      else if (d.pos === 'atk') { const D = d.atk + d.temp;
        if (A > D) { if (foe.ward) { say(`${KIN.name(d.k)} is warded. It holds, but the hit still lands.`); } else { await crack(d); breakKin(foe, d); say(`${KIN.name(a.k)} (${A}) breaks ${KIN.name(d.k)} (${D}).`); } await hurt(foe, A - D); }
        else if (A < D) { if (!sd.ward) { await crack(a); breakKin(sd, a); } say(`${KIN.name(d.k)} (${D}) is stronger. ${KIN.name(a.k)} ${sd.ward ? 'is warded, but it hurts' : 'breaks'}.`); await hurt(sd, D - A); goodForThem = mine; }
        else { await crack(a); await crack(d); breakKin(sd, a); breakKin(foe, d); say(`${A} each. Both break.`); } }
      else { const D = d.def;
        if (A > D) { if (foe.ward) say(`${KIN.name(d.k)} is warded. It holds.`); else { await crack(d); breakKin(foe, d); say(`${KIN.name(a.k)} (${A}) smashes through ${KIN.name(d.k)}'s defence (${D}).`); } }
        else if (A < D) { say(`${KIN.name(d.k)}'s defence (${D}) holds. ${D - A} comes back.`); await hurt(sd, D - A); goodForThem = mine; }
        else say(`${A} into ${D}. Nothing gives.`); }
      S.busy = false; render(); if (!(await checkEnd()) && mine && Math.random() < 0.6) say(ui.say.textContent + ` ${name}: ${react(goodForThem)}`);
    }
    // ---- Threads ----
    async function castThread(sd, c, tgt) {
      const T = THREADS[c.t], foe = other(sd), me = sd === S.me, who = me ? 'You' : name; sd.hand.splice(sd.hand.indexOf(c), 1); sd.grave.push(c); if (me) { S.pending = null; S.used.push(c.t); }
      S.busy = true; say(`${who} play${me ? '' : 's'} ${T.name}.`); render();
      const card = $(`<div class="ld-cast ld-tr${T.rar}"><b>${T.name}</b><small>${T.txt}</small></div>`); ui.stage.appendChild(card); await sleep(700); card.remove();
      switch (c.t) {
        case 'mend': sd.lp += 1000; say(`${T.name}: +1000 life.`); break;
        case 'wind': sd.lp += 500; drawCard(sd); say(`${T.name}: a card and 500 life.`); break;
        case 'charge': if (tgt) { tgt.temp += 500; say(`${KIN.name(tgt.k)} crackles: +500 attack.`); } break;
        case 'brace': if (tgt) { tgt.def += 400; say(`${KIN.name(tgt.k)}: +400 defence.`); } break;
        case 'quickdraw': drawCard(sd); drawCard(sd); say('Two cards.'); break;
        case 'flip': if (tgt) { [tgt.atk, tgt.def] = [tgt.def, tgt.atk]; tgt.shown = true; say(`${KIN.name(tgt.k)} flips: ${tgt.atk} attack, ${tgt.def} defence.`); } break;
        case 'turnabout': if (tgt) { tgt.pos = tgt.pos === 'atk' ? 'def' : 'atk'; tgt.shown = true; say(`${KIN.name(tgt.k)} is turned to ${tgt.pos === 'atk' ? 'attack' : 'defence'}.`); } break;
        case 'rally': for (const k of kinsOf(sd)) k.temp += 300; say('Every Kin on that side: +300 attack.'); break;
        case 'rewind': { const g = sd.grave.filter(x => x.type === 'kin').sort((a, b) => b.atk - a.atk)[0]; const i = freeSlot(sd); if (g && i >= 0) { sd.grave.splice(sd.grave.indexOf(g), 1); g.pos = 'atk'; g.swings = 1; g.shown = true; sd.field[i] = g; say(`${KIN.name(g.k)} comes back.`); } else say('Nothing to bring back.'); } break;
        case 'net': if (tgt) { tgt.stun = 2; say(`${KIN.name(tgt.k)} is caught in the net.`); } break;
        case 'double': if (tgt) { tgt.swings += 1; say(`${KIN.name(tgt.k)} can attack twice.`); } break;
        case 'gale': if (tgt) { const i = foe.field.indexOf(tgt); if (i >= 0) { foe.field[i] = null; tgt.temp = 0; tgt.shown = false; foe.hand.push(tgt); say(`${KIN.name(tgt.k)} is blown back to the hand.`); } } break;
        case 'lantern': if (me) S.reveal = true; drawCard(sd); say(me ? 'Their hand, in the lantern light.' : `${name} reads your hand.`); break;
        case 'loompull': if (tgt) { const i = foe.field.indexOf(tgt), j = freeSlot(sd); if (i >= 0 && j >= 0) { foe.field[i] = null; sd.field[j] = tgt; tgt.borrowed = foe; tgt.pos = 'atk'; tgt.swings = 1; tgt.shown = true; say(`${who} pull${me ? '' : 's'} ${KIN.name(tgt.k)} across for the turn.`); } else say('No room to pull it across.'); } break;
        case 'ward': sd.ward = true; say(`Nothing on ${me ? 'your' : 'their'} side can break until ${me ? 'your' : 'their'} next turn.`); break;
        case 'fusion': { const ks = kinsOf(sd).sort((a, b) => (b.atk + b.def) - (a.atk + a.def)); if (ks.length >= 2) { const [x, y] = ks; x.atk = Math.round((x.atk + y.atk) * 0.8 / 100) * 100; x.def = Math.round((x.def + y.def) * 0.8 / 100) * 100; sd.field[sd.field.indexOf(y)] = null; sd.grave.push(y); x.shown = true; x.fused = true; say(`${KIN.name(x.k)} and ${KIN.name(y.k)} weave into one: ${x.atk} / ${x.def}.`); } else say('It needs two Kin on the table.'); } break;
        case 'blacklink': if (tgt) { await crack(tgt); const w = foe.ward; foe.ward = false; breakKin(foe, tgt); foe.ward = w; sd.lp -= 1000; say(`The Black Link tears ${KIN.name(tgt.k)} apart, and it costs ${me ? 'you' : name} 1000 life.`); } break;
        case 'sinkhole': for (const s2 of [S.me, S.ai]) for (const k of kinsOf(s2)) { const w = s2.ward; s2.ward = false; breakKin(s2, k); s2.ward = w; } say('The table caves in. Every Kin breaks.'); break;
        case 'thunderfall': { const w = foe.ward; foe.ward = false; for (const k of kinsOf(foe)) breakKin(foe, k); foe.ward = w; say('Thunder. Every Kin on the other side breaks.'); } break;
      }
      if (box) { box.classList.add('flash'); await sleep(250); box.classList.remove('flash'); } S.busy = false; render(); await checkEnd();
    }
    // ---- turns ----
    async function endTurn() {
      if (S.over || S.busy) return; S.pending = null; S.sel = null; cleanup(S.me); S.turn = 'ai'; S.reveal = false; render(); await sleep(400); await aiTurn();
    }
    function cleanup(sd) { for (const k of kinsOf(sd)) { k.temp = 0; if (k.borrowed) { const i = sd.field.indexOf(k), j = k.borrowed.field.indexOf(null); sd.field[i] = null; if (j >= 0) k.borrowed.field[j] = k; else k.borrowed.hand.push(k); k.borrowed = null; } } }
    function startTurn(sd) { S.n++; sd.ward = false; for (const k of kinsOf(sd)) { k.swings = k.pos === 'atk' ? 1 : 0; if (k.stun) { k.stun--; if (k.stun) k.swings = 0; } } drawCard(sd); }
    async function checkEnd() {
      if (S.over) return true; const lost = (sd) => sd.lp <= 0 || (!sd.deck.length && !sd.hand.some(c => c.type === 'kin') && !kinsOf(sd).length);
      if (!lost(S.me) && !lost(S.ai) && S.n < 40) return false; S.over = true;
      const lm = lost(S.me), la = lost(S.ai);
      const res = lm && la ? 'draw' : la ? 'win' : lm ? 'lose' : S.me.lp > S.ai.lp ? 'win' : S.me.lp < S.ai.lp ? 'lose' : 'draw';
      finish(res); return true;
    }
    async function aiTurn() {
      if (S.over || S.gone) return; const A = S.ai, P = S.me, sk = U.clamp(o.skill == null ? 0.4 : o.skill, 0, 1); startTurn(A); render(); await sleep(500); if (await checkEnd()) return;
      const foeBest = () => Math.max(0, ...kinsOf(P).map(k => k.pos === 'atk' ? k.atk + k.temp : (k.shown ? k.def : 0)));
      // one Kin down first: attack if it can beat what's there, otherwise guard
      const hk = A.hand.filter(c => c.type === 'kin').sort((a, b) => (b.atk + b.def) - (a.atk + a.def));
      if (hk.length && freeSlot(A) >= 0) { const c = hk[0]; const fb = foeBest(); let pos = c.atk > fb || (!kinsOf(P).length && c.atk >= c.def) ? 'atk' : 'def'; if (Math.random() < 0.15 * (1 - sk)) pos = pos === 'atk' ? 'def' : 'atk'; await summon(A, c, pos); }
      // then Threads, when they make sense
      for (const c of A.hand.filter(c => c.type === 'thread')) { if (S.over || S.gone) return; const t = c.t, pk = kinsOf(P), mk = kinsOf(A); let tgt = null, use = false;
        if (Math.random() > 0.3 + 0.6 * sk) continue;
        if (t === 'mend' || t === 'wind') use = A.lp < LP0 * 0.6; else if (t === 'quickdraw' || t === 'lantern') use = A.hand.length < 4;
        else if (t === 'thunderfall') use = pk.length >= 2; else if (t === 'sinkhole') use = pk.length >= 2 && mk.length <= 1;
        else if (t === 'mirror') { if (!A.trap) { A.hand.splice(A.hand.indexOf(c), 1); A.trap = c; say(`${name} sets a Thread face down.`); render(); await sleep(400); } continue; }
        else if (['blacklink', 'gale', 'net', 'turnabout', 'loompull'].includes(t)) { tgt = pk.slice().sort((a, b) => (b.atk + b.temp) - (a.atk + a.temp))[0]; use = !!tgt && (t !== 'loompull' || freeSlot(A) >= 0) && (t !== 'blacklink' || A.lp > 1500) && (t !== 'turnabout' || tgt.pos === 'atk'); }
        else if (['charge', 'brace', 'double'].includes(t)) { tgt = mk.filter(k => t === 'brace' || (k.pos === 'atk' && !k.stun)).sort((a, b) => b.atk - a.atk)[0]; use = !!tgt; }
        else if (t === 'rewind') use = A.grave.some(x => x.type === 'kin') && freeSlot(A) >= 0; else if (t === 'fusion') use = mk.length >= 2; else if (t === 'rally') use = mk.filter(k => k.pos === 'atk').length >= 2; else if (t === 'ward') use = mk.length >= 1 && pk.length >= 1;
        else if (t === 'flip') { tgt = mk.find(k => k.def > k.atk + 300 && k.pos === 'atk'); use = !!tgt; }
        if (use) { await castThread(A, c, tgt); if (S.over) return; await sleep(250); } }
      // attacks
      for (const a of kinsOf(A).filter(k => k.pos === 'atk' && k.swings > 0 && !k.stun)) {
        while (a.swings > 0 && A.field.includes(a) && !S.over && !S.gone) { const pk = kinsOf(P); const AA = a.atk + a.temp;
          let tgt = null; if (!pk.length) tgt = 'direct';
          else { const beat = pk.filter(d => d.pos === 'atk' ? AA > d.atk + d.temp : (d.shown ? AA > d.def : Math.random() < 0.4 + 0.3 * sk)).sort((x, y) => (y.pos === 'atk' ? 1 : 0) - (x.pos === 'atk' ? 1 : 0) || y.atk - x.atk); tgt = beat[0] || (Math.random() < 0.2 * (1 - sk) ? pk[0] : null); }
          if (!tgt) break; await attack(A, a, tgt === 'direct' ? null : tgt); await sleep(250); if (S.over) return; }
      }
      cleanup(A); if (S.over || S.gone) return; S.turn = 'me'; S.summoned = false; startTurn(P); render(); if (await checkEnd()) return; say(`Your turn. You draw. ${P.hand.length} cards in your hand.`);
    }
    function finish(res) {
      S.turn = 'done'; render(); const ss = G.stats.linkdown || (G.stats.linkdown = { won: 0, lost: 0 }); if (res === 'win') ss.won++; else if (res === 'lose') ss.lost++;
      let line = res === 'win' ? `You win, ${Math.max(0, S.me.lp)} to ${Math.max(0, S.ai.lp)}.` : res === 'lose' ? `${name} wins, ${Math.max(0, S.ai.lp)} to ${Math.max(0, S.me.lp)}.` : 'Dead level. Nobody wins, nobody pays.';
      if (o.rematch && res === 'win') { giveThread(o.thread); line += ` ${name} pushes the cartridge over: ${THREADS[o.thread].name}. "Keep it. I'll be back for it."`; }
      else if (o.mode === 'stake' && res === 'win') { const k = KIN.create(aiStake.sp, aiStake.level); k.card = aiStake.card; G.addKin(k); line += o.prize ? ` ${name} slides the prize over. ${KIN.name(k)}, champion's printing, is yours.` : ` ${KIN.name(k)} is yours now.`; }
      if (o.mode === 'stake' && res === 'lose' && myStake) { lose(myStake, o); line += ` ${KIN.name(myStake)} goes with them. They'll sell it back for ◆ ${value(myStake) * 2}.`; }
      if (res === 'win') { const t = rollThread(o.tier || 0); giveThread(t); line += ` You win a Thread: ${THREADS[t].name}.`; if (o.prize) { const r2 = TIDS.filter(x => THREADS[x].rar === 2); const t2 = r2[Math.floor(Math.random() * r2.length)]; giveThread(t2); line += ` And a rare one: ${THREADS[t2].name}.`; } }
      if (o.villageId) { const t = townRec(o.villageId); if (res === 'win') { if (o.prize || o.rematch) { t.prizeWon = true; t.titles = (t.titles || 0) + 1; const days = t.titles >= 3 ? 12 : 3; t.awayUntil = (G.dayCount || 0) + days;
          line += ` "That's it. I'm going out to train. Properly. ${days > 5 ? "Don't wait up." : 'Give me a few days.'}"`; } else t.wins++; }
        const left = need(o.tier) - t.wins; if (res === 'win' && !o.prize && !t.prizeWon) line += left > 0 ? ` "Beat me ${left} more time${left > 1 ? 's' : ''} and I'll bring out the one I keep back."` : ` "Fine. Next time I play my prize. You won't beat that."`; }
      tickCooldowns(S.used); if (S.used.length) line += ` ${S.used.map(t => THREADS[t].name).join(', ')} ${S.used.length > 1 ? 'need' : 'needs'} to cool down before you can play ${S.used.length > 1 ? 'them' : 'it'} again.`;
      say(line); ui.foot.innerHTML = ''; const b = $('<button class="btn big">Done</button>'); b.addEventListener('click', () => { close(); if (o.onEnd) o.onEnd(res); if (G.save) G.save(); }); ui.foot.append(b);
      box && box.classList.add('gb-' + res); UI.sfx && UI.sfx(res === 'win' ? 'caught' : 'click'); S.result = res;
    }
    S.api = { summon: (i, pos) => summon(S.me, S.me.hand.filter(c => c.type === 'kin')[i], pos), attack: (ai, di) => attack(S.me, kinsOf(S.me)[ai], di == null ? null : kinsOf(S.ai)[di]), cast: (t, tgt) => castThread(S.me, S.me.hand.find(c => c.type === 'thread' && c.t === t), tgt), endTurn, kinsOf, drawCard };
    S.turn = 'me'; S.summoned = false; drawCard(S.me); S.n = 0; render(); const extra = S.me.lp - LP0; say(`${name} shuffles. ${extra > 0 ? `The table reads your bonds: you start on ${S.me.lp} life. ` : ''}You go first. Tap a Kin in your hand to put it down.`);
  }

  // a staked Kin that was lost: off your cartridges, into the winner's case, for sale at double
  function lose(k, o) {
    let i = G.kin.indexOf(k); if (i < 0) i = G.kin.findIndex(x => x.id === k.id);
    if (i >= 0) { G.kin.splice(i, 1); if (G.activeIdx >= G.kin.length) G.activeIdx = Math.max(0, G.kin.length - 1); }
    else { const j = (G.box || []).findIndex(d => d.id === k.id); if (j >= 0) G.box.splice(j, 1); }
    const L = G.stats.ldLost || (G.stats.ldLost = []); L.push({ data: KIN.serialize(k), price: value(k) * 2, champ: o.champ, at: o.villageId, day: G.dayCount || 0 });
  }
  function buyBack(i) { const L = G.stats.ldLost || []; const e = L[i]; if (!e) return false; if (G.shards < e.price) { UI.toast('Not enough Shards.', 'bad'); return false; }
    G.shards -= e.price; const k = KIN.deserialize(e.data); L.splice(i, 1); G.addKin(k); UI.toast(`${KIN.name(k)} is back on your cartridge.`, 'good'); return true; }
  return { play, close, buyBack, prizeFor, need, townRec, away, titleThread, power, value, stakeable, bondBoost, THREADS, giveThread, ready, CD, rollThread, atkdef, get state() { return st; } };
})();
