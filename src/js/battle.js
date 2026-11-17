'use strict';
// Turn-based battle in the 3D scene with a bottom-sheet UI. Capture is a placed Cast Net with a timing bar, not a thrown ball.
const Battle = (() => {
  let G = null, active = false, busy = false, wildE = null, wild = null, mine = null, ambush = false, mineE = null, turn = 0;
  let camState = null; const fx = []; let stealth = false, focusOn = false;
  const el = {};
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function q(id) { return document.getElementById(id); }
  function init(game) {
    G = game;
    el.root = q('battle'); el.wild = q('b-wild'); el.mine = q('b-mine'); el.log = q('b-log'); el.actions = q('b-actions'); el.snare = q('b-snare');
    el.snareGo = q('snare-go'); el.zone = el.snare.querySelector('.snare-zone'); el.marker = el.snare.querySelector('.snare-marker');
    el.net = q('snare-net'); netWire();
    // changed your mind (or pressed Net by accident): the net goes back in the bag and the fight carries on
    const cancel = q('snare-cancel'); const stop = (e) => { e.stopPropagation(); e.preventDefault(); cancelSnare(); };
    cancel.addEventListener('click', stop); cancel.addEventListener('touchstart', stop, { passive: false });
  }
  function buffs() { return { guard: false, focus: false, coil: false, dash: false, ail: null }; }
  function start(e, isAmbush, opts = {}) {
    if (active) return;
    stunUsed = false; stunned = false; if (stunTimer) { clearInterval(stunTimer); stunTimer = null; }
    const party = G.healthyKin();
    if (!party.length) { G.toast('All your Kin are down. Revive them at the Voodoo Hut or with a tonic.'); e.alert = 0; e.wait = 4; if (!e.chase) e.cool = 6; return; }
    if (e.chase) { Wild.disengage(e, 0); e.alert = 1; }
    if (e.dazed > 0) { e.dazed = 0; e.hover = e.model.hover; e.jawOpen = 0; }
    e.stunT = 0; e.flee = 0;
    active = true; busy = true; wildE = e; wild = e.kin; ambush = isAmbush; turn = 0;
    wild.buffs = buffs(); wild.hp = Math.min(wild.hp, KIN.stats(wild).hp); if (G.seenDex) G.seenDex(wild.sp, "seen");
    mine = G.activeKin() || party[0]; mine.buffs = buffs();
    focusOn = typeof Npcs !== 'undefined' && Npcs.active('focus') && Npcs.useCharge('focus');
    G.onBattleStart(e);
    // own Kin stands between the player and the wild
    placeMine();
    el.root.classList.remove('hidden');
    el.snare.classList.add('hidden');
    el.log.innerHTML = '';
    refresh();
    const n = KIN.name(wild);
    log(isAmbush ? `You caught ${n} off guard!` : `${n} noticed you!`, isAmbush ? 'good' : 'bad');
    if (wild.sp.mythic) log('The Heart stirs. This is the Mythic of the Core.', 'bad');
    if (wildE.isBoss) log(wildE.persona ? `${n}: "${wildE.persona.fight}"` : `${n} blocks the square.`, 'bad');
    if (wildE.isLegend) log(`${n}, the legend of this world. Lv ${wild.level}.`, 'bad');
    if (wildE.isApex) log(`${n}. Lv ${wild.level}. Run, or be very, very sure.`, 'bad');
    if (wildE.keepBoss) log(`${n}, the warlord of this hold. Lv ${wild.level}.`, 'bad');
    if (wildE.finalBoss) log(`${n}, left behind to hold you. Lv ${wild.level}. Beat it, or cage a legend.`, 'bad');
    camState = null;
    stealth = !!opts.stealth;
    if (stealth) { el.log.innerHTML = ''; log(`${n} has not seen you. Set the net before it does.`, 'good'); renderActions(); busy = false; beginSnare(); return; }
    renderActions();
    busy = false;
  }
  function placeMine() {
    const m = KIN.model(mine.sp, mine.stage);
    const p = G.player;
    const dx = wildE.x - p.x, dz = wildE.z - p.z, d = Math.hypot(dx, dz) || 1;
    const px = p.x + dx / d * Math.min(2.0, d * 0.4), pz = p.z + dz / d * Math.min(2.0, d * 0.4);
    const gy = G.world.groundY(Math.floor(px), Math.floor(pz), Math.floor(Math.max(wildE.y, p.y)) + 3);
    mineE = { x: px, y: Math.max(gy + 1, wildE.y - 2), z: pz, yaw: Math.atan2(wildE.x - px, wildE.z - pz), model: m, scale: 1, hover: m.hover, mesh: R.entityMesh(KIN.meshKey(mine.sp, mine.stage) + KIN.wearKey(mine.wear), (mb) => KIN.buildMesh(mb, KIN.dress(m, mine.wear))), skyMul: wildE.skyMul };
    wildE.yaw = Math.atan2(px - wildE.x, pz - wildE.z);
  }
  function elemBadges(k) {
    return KIN.dominant(k.sp.elem, 2).map(e => `<span class="badge" style="background:${ELEM_COLOR[e]}">${e}</span>`).join('');
  }
  function fillCard(card, k, showXp) {
    const st = KIN.stats(k);
    const rar = KIN.RARITY[k.sp.rarity || 0];
    { // a small portrait on the card, redrawn only when the Kin on it changes
      let cv = card.querySelector('canvas.bpic'); if (!cv) { cv = document.createElement('canvas'); cv.className = 'bpic'; cv.width = cv.height = 56; card.insertBefore(cv, card.firstChild); }
      const key = (k.id || k.sp.seed) + ':' + k.stage; if (cv.dataset.k !== key) { cv.dataset.k = key; try { KIN.portrait(cv, k.sp, k.stage, 56); } catch (e) {} }
    }
    card.querySelector('.nm').innerHTML = KIN.name(k) + (k.sp.mythic ? ' ✦' : '') + ((k.sp.rarity || 0) > 0 ? ` <span class="rar r${k.sp.rarity}">${rar.name}</span>` : '');
    card.querySelector('.lv').textContent = 'Lv ' + k.level;
    const f = card.querySelector('.hpfill'); const frac = Math.max(0, k.hp / st.hp);
    f.style.width = (frac * 100) + '%'; f.style.background = frac > 0.5 ? '#5ad66a' : frac > 0.22 ? '#f0c040' : '#f05040';
    card.querySelector('.elems').innerHTML = elemBadges(k) + `<span class="hpnum">${Math.max(0, Math.round(k.hp))}/${st.hp}</span>`;
    if (showXp) { const xf = card.querySelector('.xpfill'); if (xf) xf.style.width = (100 * k.xp / KIN.xpToNext(k.level)) + '%'; }
  }
  // ---- lasting hurts: some moves leave something behind that goes on working after the blow. Burn, frostbite, poison and curse take a share of
  // health at the end of every turn; shock sometimes costs a turn. One at a time, and it wears off.
  const AIL = { burn: { name: 'Burn', word: 'is burning', pct: 0.09, turns: 3, col: [1, 0.5, 0.15], tag: '#ff7a2a' }, frost: { name: 'Frostbite', word: 'is frostbitten', pct: 0.08, turns: 3, col: [0.7, 0.95, 1], tag: '#7fd8f5' },
    poison: { name: 'Poison', word: 'is poisoned', pct: 0.05, grow: 0.03, turns: 4, col: [0.6, 0.85, 0.2], tag: '#8fc93a' }, shock: { name: 'Shock', word: 'is jolted', pct: 0, skip: 0.3, turns: 3, col: [1, 0.9, 0.3], tag: '#e8c800' }, curse: { name: 'Curse', word: 'is cursed', pct: 0.08, turns: 3, col: [0.65, 0.35, 1], tag: '#a65cff' } };
  function ailFx(e, a) { if (!e || !e.model) return; const C = ctr(e, 0.3), h = (e.model.height || 1) * (e.model.scale || 1); for (let i = 0; i < 12; i++) { const o = [rnd(0.5), 0, rnd(0.5)]; Pt(i * 0.03, 0.6, i % 3 ? a.col : WHITE, a === AIL.frost ? 'cube' : a === AIL.shock ? 'shard' : 'ball', (u) => [C[0] + o[0] + Math.sin(u * 8 + i) * 0.1, C[1] + u * h * 1.1, C[2] + o[2], 0.14 * (1 - u), u * 5]); } }
  async function ailTick() { for (const [k, e, isMine] of [[wild, wildE, false], [mine, mineE, true]]) { const st = k && k.buffs && k.buffs.ail; if (!st || k.hp <= 0) continue; const a = AIL[st.type];
      if (a.pct) { const d = Math.max(1, Math.round(KIN.stats(k).hp * (a.pct + (a.grow || 0) * st.n))); k.hp = Math.max(0, k.hp - d); ailFx(e, a); if (e) e.hitT = 0.2; log(`${KIN.name(k)} ${a.word}: ${d} damage.`, isMine ? 'bad' : 'good'); G.sfx('hit'); refresh(); await sleep(550); }
      st.n++; if (--st.turns <= 0) { k.buffs.ail = null; log(`${KIN.name(k)} shakes off the ${a.name.toLowerCase()}.`); refresh(); await sleep(300); } } }
  function ailTag(card, k) { const old = card.querySelector('.ailtag'); if (old) old.remove(); const st = k && k.buffs && k.buffs.ail; if (!st) return; const a = AIL[st.type]; const t = document.createElement('span'); t.className = 'ailtag'; t.textContent = a.name; t.style.background = a.tag; card.style.position = card.style.position || 'relative'; card.appendChild(t); }
  function refresh() { fillCard(el.wild, wild, false); fillCard(el.mine, mine, true); ailTag(el.wild, wild); ailTag(el.mine, mine); }
  function log(msg, cls) {
    const d = document.createElement('div'); d.textContent = msg; if (cls) d.className = cls; el.log.appendChild(d);
    while (el.log.children.length > 4) el.log.removeChild(el.log.firstChild);
    el.log.scrollTop = el.log.scrollHeight;
  }
  // which net this Kin takes: the high flyers only a Flight Net thrown from the air, the water Kin none at all (that is the rod's job)
  function snareRule() {
    const p = G.player;
    if (wildE && wildE.isBoss) return { list: [], why: 'A tyrant cannot be caged. Beat him and he runs' };
    if (wildE && wildE.finalBoss) return { list: [], why: 'Not this one. This one you end' }; // the last fight only; the Kinmaster's own Kin and his warlords' can be caught
    if (wildE && wildE.aquatic && !wildE.isApex) return { list: [], why: 'Water Kin slip any cage. Fish them with a rod.' };
    if (wildE && wildE.high) { const air = p.gliding || p.mountMode === 'air'; if (!air) return { list: [], why: 'Only from the air' }; return { list: p.has('snare_sky') ? ['snare_sky'] : [], why: 'Needs a Flight Net' }; }
    return { list: ['snare2', 'snare'].filter(s => p.has(s)), why: 'No nets' };
  }
  function renderActions() {
    const mv = KIN.moves(mine);
    const rule = snareRule(); const snares = rule.list;
    const bagFull = false; // a full party sends new catches to storage
    let html = '';
    mv.forEach((m, i) => {
      const eff = m.kind === 'util' ? null : KIN.effectiveness(m.elem, wild);
      const tag = eff == null ? '' : eff > 1.25 ? '<i class="eff good">strong</i>' : eff < 0.8 ? '<i class="eff bad">weak</i>' : '';
      const col = m.kind === 'util' ? '#8899aa' : ELEM_COLOR[m.elem];
      html += `<button class="act move ${m.tech ? 'tech' : ''}" data-i="${i}" style="--c:${col}"><b>${m.name}${m.tech ? ' ✦' : ''}</b><small>${m.kind === 'util' ? m.desc : m.kind + ' · ' + m.power + (m.desc ? ' · ' + m.desc : '')}</small>${tag}</button>`;
    });
    const snareLabel = snares.length ? `${ITEMS[snares[0]].name} ×${G.player.count(snares[0])}` : rule.why;
    html += `<button class="act snare" data-a="snare" ${(!snares.length || bagFull) ? 'disabled' : ''}><b>Net</b><small>${bagFull ? 'Bag full (20). Fuse first.' : snareLabel}</small></button>`;
    const th = G.player.count('tonic_heal');
    html += `<button class="act" data-a="tonic" ${th ? '' : 'disabled'}><b>Tonic</b><small>${th ? 'Heal Tonic ×' + th + ' · costs the turn' : 'no Heal Tonic'}</small></button>`;
    html += `<button class="act" data-a="swap"><b>Swap</b><small>${G.healthyKin().length - 1} ready</small></button>`;
    html += `<button class="act" data-a="run"><b>Run</b><small>leave</small></button>`;
    el.actions.innerHTML = html;
    el.actions.querySelectorAll('button').forEach(b => b.addEventListener('click', onAction));
  }
  function onAction(ev) {
    if (busy || !active) return;
    const b = ev.currentTarget;
    if (b.dataset.i != null) doTurn({ type: 'move', move: KIN.moves(mine)[+b.dataset.i] });
    else if (b.dataset.a === 'snare') beginSnare();
    else if (b.dataset.a === 'tonic') doTurn({ type: 'tonic' });
    else if (b.dataset.a === 'swap') showSwap();
    else if (b.dataset.a === 'run') doTurn({ type: 'run' });
  }
  function dodgeChance(att, def) { const sa = KIN.stats(att), sd = KIN.stats(def); let agi = sd.agi * (def.buffs.coil ? 1.4 : 1); return U.clamp(0.04 + (agi - sa.agi) / (agi + sa.agi) * 0.3, 0.02, 0.4); }
  function damage(att, def, move) {
    const sa = KIN.stats(att), sd = KIN.stats(def);
    const A = (move.kind === 'phys' ? sa.atk : sa.pow) * (att.buffs.focus ? 1.25 : 1);
    const D = move.kind === 'phys' ? sd.atk : sd.pow;
    const eff = KIN.effectiveness(move.elem, def);
    const quick = U.clamp((sa.spd - sd.spd) / (sa.spd + sd.spd), -0.25, 0.25); /* the quicker Kin lands its blows better: speed was worth almost nothing before, and the fast elements lost four fights in five */
    let dmg = A * (move.power / 100) * 0.8 * (1 + quick * 0.7) * (A / (A + 0.5 * D)) * eff * (0.85 + Math.random() * 0.15); /* blows a little lighter: fights were over in three turns, before a burn or a poison could matter */
    if (att === mine && focusOn) dmg *= 1.25; // the Amulet of Focus
    const crit = Math.random() < (move.crit ? 0.3 : 0.06); if (crit) dmg *= 1.6;
    if (def.buffs.guard && !move.pierce) { dmg *= 0.5; if (def.buffs.guard2) def.buffs.guard2 = false; else def.buffs.guard = false; }
    return { dmg: Math.max(1, Math.round(dmg)), eff, crit };
  }
  async function useMove(att, def, move, attIsMine) {
    const an = KIN.name(att), dn = KIN.name(def);
    if (att.buffs.ail && att.buffs.ail.type === 'shock' && Math.random() < AIL.shock.skip) { ailFx(attIsMine ? mineE : wildE, AIL.shock); log(`${an} is jolted and cannot move!`, attIsMine ? 'bad' : 'good'); G.sfx('miss'); await sleep(700); return; }
    if (move.kind === 'util') {
      switch (move.name) {
        case 'Guard': att.buffs.guard = true; log(`${an} braces itself.`); break;
        case 'Focus': att.buffs.focus = true; log(`${an} focuses. Attack and Power rise.`); break;
        case 'Coil': att.buffs.coil = true; log(`${an} coils, ready to slip away.`); break;
        case 'Dash': att.buffs.dash = true; log(`${an} dashes. It will strike first.`); break;
        case 'Mend': { const st = KIN.stats(att); const h = Math.round(st.hp * 0.3); att.hp = Math.min(st.hp, att.hp + h); log(`${an} mends ${h} health.`, 'good'); break; }
        case 'Regrowth': { const st = KIN.stats(att); const h = Math.round(st.hp * 0.5); att.hp = Math.min(st.hp, att.hp + h); log(`${an} regrows ${h} health.`, 'good'); break; }
        case 'Bulwark': att.buffs.guard = true; att.buffs.guard2 = true; log(`${an} raises a bulwark: the next two hits are halved.`); break;
        case 'Tailwind': att.buffs.dash = true; att.buffs.coil = true; log(`${an} rides a tailwind.`); break;
      }
      { const src = attIsMine ? mineE : wildE; if (src) playUtil(src, move); }
      G.sfx('util'); refresh(); await sleep(800); return;
    }
    const src = attIsMine ? mineE : wildE, target = attIsMine ? wildE : mineE;
    if (Math.random() > move.acc || Math.random() < dodgeChance(att, def)) { log(`${an} uses ${move.name}… ${dn} slips aside!`); if (src && target) { const T = playMove(src, target, move, false); await sleep(T * 1000); } G.sfx('miss'); await sleep(450); return; }
    if (src && target) { const T = playMove(src, target, move, true); await sleep(T * 1000); } /* the blow lands when the picture says it does */
    const r = damage(att, def, move);
    def.hp = Math.max(0, def.hp - r.dmg);
    { const k = attIsMine ? att : def, slot = attIsMine ? 'weapon' : 'armor'; const id = k.equip && k.equip[slot]; if (id && ITEMS[id] && ITEMS[id].relic) Relics.wear(id, (attIsMine ? 0.008 : 0.011) * (wildE && (wildE.isBoss || wildE.isLegend || wildE.isApex) ? 2 : 1)); } // relics wear as they work
    if (move.drain) { const st = KIN.stats(att); const h = Math.round(r.dmg / 3); att.hp = Math.min(st.hp, att.hp + h); }
    let ailMsg = ''; if (move.ail && def.hp > 0 && !def.buffs.ail && Math.random() < (move.ailP || 0.45)) { def.buffs.ail = { type: move.ail, turns: AIL[move.ail].turns, n: 0 }; ailMsg = ` ${dn} ${AIL[move.ail].word}!`; }
    const card = attIsMine ? el.wild : el.mine;
    card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400);
    if (target) target.hitT = r.crit ? 0.55 : 0.35; shakeT = Math.max(shakeT, move.tech ? 0.5 : r.crit || r.eff > 1.25 ? 0.4 : 0.22);
    { card.style.position = card.style.position || 'relative'; const pop = document.createElement('div'); pop.className = 'dmgpop' + (r.crit ? ' crit' : ''); pop.textContent = '-' + r.dmg; card.appendChild(pop); setTimeout(() => pop.remove(), 950); }
    log(`${an} uses ${move.name}: ${r.dmg} damage${r.crit ? ', critical!' : ''}${r.eff > 1.25 ? ' It hits hard!' : r.eff < 0.8 ? ' It barely lands.' : ''}${ailMsg}`, attIsMine ? 'good' : 'bad');
    G.sfx(r.eff > 1.25 ? 'hit2' : 'hit'); refresh(); await sleep(700);
  }
  function wildChoose() {
    const mv = KIN.moves(wild); const st = KIN.stats(wild);
    if (wild.hp < st.hp * 0.35 && mv[2].name === 'Mend' && Math.random() < 0.5) return mv[2];
    if (Math.random() < 0.15) return mv[2];
    const score = (m) => m.kind === 'util' ? 0 : m.power * KIN.effectiveness(m.elem, mine);
    const atk = mv.filter(m => m.kind !== 'util').sort((a, b) => score(b) - score(a));
    return Math.random() < 0.75 ? atk[0] : atk[1];
  }
  async function doTurn(action) {
    busy = true; turn++;
    el.actions.querySelectorAll('button').forEach(b => b.disabled = true);
    if (action.type === 'run') {
      const sm = KIN.stats(mine), sw = KIN.stats(wild);
      const p = (wild.sp.mythic || wild.sp.legend) ? 0.9 : U.clamp(0.45 + (sm.spd - sw.spd) / 120, 0.2, 0.9);
      if (Math.random() < p) { log('You slip away.'); await sleep(500); end('ran'); return; }
      log(`${KIN.name(wild)} blocks your escape!`, 'bad'); await sleep(500);
      await useMove(wild, mine, wildChoose(), false);
      return afterTurn();
    }
    if (action.type === 'tonic') {
      if (!G.player.take('tonic_heal', 1)) { busy = false; renderActions(); return; }
      const st = KIN.stats(mine); const h = Math.round(st.hp * 0.6); mine.hp = Math.min(st.hp, mine.hp + h);
      log(`${KIN.name(mine)} drinks a Heal Tonic: +${h}.`, 'good'); G.sfx('util'); refresh(); await sleep(600);
      await useMove(wild, mine, wildChoose(), false);
      return afterTurn();
    }
    if (action.type === 'swap') {
      mine = action.kin; mine.buffs = buffs(); placeMine(); if (mineE) arriveFx(mineE, KIN.dominant(mine.sp.elem, 1)[0]); refresh(); log(`Go, ${KIN.name(mine)}!`, 'good'); await sleep(500);
      await useMove(wild, mine, wildChoose(), false);
      return afterTurn();
    }
    const myMove = action.move, theirMove = wildChoose();
    const sm = KIN.stats(mine), sw = KIN.stats(wild);
    let meFirst = (turn === 1 && ambush) || mine.buffs.dash || (!wild.buffs.dash && (sm.spd > sw.spd || (sm.spd === sw.spd && Math.random() < 0.5)));
    mine.buffs.dash = false; wild.buffs.dash = false;
    const order = meFirst ? [[mine, wild, myMove, true], [wild, mine, theirMove, false]] : [[wild, mine, theirMove, false], [mine, wild, myMove, true]];
    for (const [a, d, m, isMine] of order) {
      if (a.hp <= 0) continue;
      await useMove(a, d, m, isMine);
      if (d.hp <= 0) break;
    }
    afterTurn();
  }
  async function afterTurn() {
    await ailTick();
    refresh();
    // the net moment: as soon as one more of your Kin's strongest attack would finish it (however much life it has left), it is out of it for a
    // few seconds. A blow that finishes it outright from above that line staggers it instead, so the moment is never skipped
    if (!stunUsed && mine.hp > 0 && (wild.hp <= 0 || wild.hp <= strongestHit())) { stunUsed = true; if (wild.hp <= 0) wild.hp = 1; refresh(); return stunWindow(); }
    if (wild.hp <= 0) {
      log(`${KIN.name(wild)} is defeated!`, 'good'); faintFx(wildE); G.sfx('win'); await sleep(600); return end('won');
    }
    if (mine.hp <= 0) {
      log(`${KIN.name(mine)} is down!`, 'bad'); faintFx(mineE); G.sfx('down'); await sleep(700);
      const next = G.healthyKin();
      if (!next.length) { log('All your Kin are down…', 'bad'); await sleep(900); return end('lost'); }
      busy = false; showSwap(true); return;
    }
    busy = false; renderActions();
  }
  function showSwap(forced) {
    const party = G.healthyKin().filter(k => k !== mine);
    if (!party.length) { if (!forced) G.toast('No other Kin ready.'); return; }
    let html = '<div class="swaplist">' + (forced ? '<p>Choose your next Kin</p>' : '<p>Swap to…</p>');
    party.forEach((k, i) => { const st = KIN.stats(k); html += `<button class="act swapk" data-i="${G.kin.indexOf(k)}"><b>${KIN.name(k)}</b><small>Lv ${k.level} · ${Math.round(k.hp)}/${st.hp}</small></button>`; });
    if (!forced) html += '<button class="act" data-a="back"><b>Back</b></button>';
    html += '</div>';
    el.actions.innerHTML = html;
    el.actions.querySelectorAll('button').forEach(b => b.addEventListener('click', (ev) => {
      if (busy) return;
      const bb = ev.currentTarget;
      if (bb.dataset.a === 'back') return renderActions();
      const k = G.kin[+bb.dataset.i];
      if (forced) { mine = k; mine.buffs = buffs(); placeMine(); refresh(); log(`Go, ${KIN.name(mine)}!`, 'good'); renderActions(); }
      else doTurn({ type: 'swap', kin: k });
    }));
  }
  // ---- net mini-game ----
  let snareState = null;
  const bossKin = () => !!(wildE && (wildE.isBoss || wildE.kinmaster || wildE.keepBoss || wildE.citadelFirst));
  function catchChance() {
    const st = KIN.stats(wild); const frac = wild.hp / st.hp;
    const item = snareRule().list[0] || 'snare';
    let c = stealth ? ITEMS[item].snare * (wildE && wildE.alert < 0.5 ? 0.6 : 0.45) : ITEMS[item].snare * (1 - frac * 0.8);
    if (wild.level > mine.level + 3) c *= 0.75;
    if ((stunned || (stunUsed && wild.hp <= strongestHit())) && !bossKin()) c *= 1.8; // stunned: much easier to hold (a boss's Kin does not give you that)
    // the level gap: a little above you is fair, 20% above is a long shot, twice your level and nothing holds it
    const grip = 2 * Math.max(1, G.trainerLevel || 1); // net strength: twice your trainer level, not your Kin's level
    const gap = wild.level / grip;
    if (gap >= 2) return { chance: 0, item, gap, grip, hopeless: true };
    if (gap > 1.2) c *= 0.55 * Math.pow((2 - gap) / 0.8, 3);
    else if (gap > 1) c *= 1 - (gap - 1) * 2.25;
    if (ambush && !stealth) c *= 1.25;
    c *= KIN.RARITY[wild.sp.rarity || 0].catch;
    if (bossKin()) c *= 0.3; // a tyrant's, a warlord's or the Kinmaster's own: very hard to hold, never quite impossible
    if (typeof Npcs !== 'undefined' && Npcs.active('hunter')) c *= 1.5; // the Hunter's Amulet
    if (G.buffMul) c *= G.buffMul('luck');
    if (wild.sp.mythic || wild.sp.legend) c = frac < 0.15 ? Math.min(c, 0.5) : Math.min(c, 0.12);
    return { chance: U.clamp(c, gap > 1.2 ? 0.002 : 0.04, 0.9), item, gap, grip };
  }
  let stunUsed = false, stunTimer = null;
  // what your Kin's hardest move would do to it, without a lucky crit (the best of a few rolls)
  function strongestHit() {
    let best = 0; for (const m of KIN.moves(mine)) { if (m.kind === 'util' || !m.power) continue; for (let i = 0; i < 4; i++) { const r = calcDamage(mine, wild, m); if (!r.crit) best = Math.max(best, r.dmg); } }
    return best;
  }
  function stunWindow() {
    log(`${KIN.name(wild)} staggers, stunned! Net it now, or let it fall.`, 'good'); G.sfx('win'); if (G.knockout) G.knockout();
    stunned = true; let left = 4.0;
    const rule = snareRule(); const can = rule.list.length > 0; const cc = can ? catchChance() : null;
    const what = !can ? rule.why : cc.hopeless ? `too strong to hold yet (Lv ${wild.level}; raise your trainer level)` : `${ITEMS[rule.list[0]].name} · about ${Math.max(1, Math.round(Math.min(1, cc.chance * (bossKin() ? 1 : 1.8)) * 100))}%${bossKin() ? ' · one chance' : ''}`;
    el.actions.innerHTML = `<button class="act snare stun" data-a="stunsnare" ${can && !cc.hopeless ? '' : 'disabled'}><b>Net it!</b><small>${what} · <span id="stun-left">4</span>s</small><i class="stunbar"><i id="stun-fill"></i></i></button><button class="act" data-a="finish"><b>Finish it</b><small>win the fight</small></button>`;
    const fill = document.getElementById('stun-fill');
    const done = (snare) => { if (!stunned) return; stunned = false; clearInterval(stunTimer); stunTimer = null; if (snare) { busy = false; beginSnare(); } else { wild.hp = 0; refresh(); log(`${KIN.name(wild)} is defeated!`, 'good'); faintFx(wildE); G.sfx('win'); end('won'); } };
    el.actions.querySelector('[data-a="stunsnare"]').addEventListener('click', () => done(true));
    el.actions.querySelector('[data-a="finish"]').addEventListener('click', () => done(false));
    stunTimer = setInterval(() => { left -= 0.1; if (fill) fill.style.width = Math.max(0, left / 4 * 100) + '%'; const s = document.getElementById('stun-left'); if (s) s.textContent = Math.max(0, Math.ceil(left)); if (left <= 0) done(false); }, 100);
  }
  let stunned = false;
  function beginSnare() {
    if (!snareRule().list.length) { log(snareRule().why + '.', 'bad'); renderActions(); busy = false; return; }
    const { chance, item, gap, grip, hopeless } = catchChance();
    if (!G.player.take(item, 1)) return;
    if (typeof Npcs !== 'undefined' && Npcs.active('hunter')) Npcs.useCharge('hunter');
    busy = true;
    el.actions.querySelectorAll('button').forEach(b => b.disabled = true);
    const st = KIN.stats(wild);
    const rar = wild.sp.rarity || 0;
    const width = hopeless ? 0.006 : Math.max(gap > 1.2 ? 0.008 : 0.02, chance * 0.9 * [1, 0.9, 0.75, 0.5, 0.5][rar]);
    const left = 0.05 + Math.random() * (0.9 - width);
    let period = U.clamp(2.3 - st.agi / 110, 0.75, 2.3) * [1, 0.95, 0.85, 0.65, 0.45][rar];
    if (gap > 1.2) period *= U.clamp(1 - (gap - 1.2) * 0.9, 0.25, 1); // a strong Kin fights the cage: the marker races
    if (hopeless) period = 0.08;
    snareState = { item, width, left, period: bossKin() ? period * 0.8 : period, hopeless, t0: performance.now(), done: false, hits: 0, need: Math.max(bossKin() ? 2 : 1, rar >= 4 ? 3 : rar === 3 ? 2 : 1) };
    netStart();
    el.snare.classList.remove('hidden'); el.root.classList.add('snaring'); el.root.scrollTop = 0;
    const pct = chance === 0 ? '0%' : chance < 0.01 ? 'under 1%' : Math.round(chance * 100) + '%';
    log(`You shake out a ${ITEMS[item].name}${stealth ? ', quietly' : ''}. Swing it open and throw. Catch chance ${pct} with a good throw.`);
    if (hopeless) log(`${KIN.name(wild)} is more than twice your net strength (${grip}, twice your trainer level). No net made will hold it. Beat it, or come back stronger.`, 'bad');
    else if (gap > 1.2) log(`${KIN.name(wild)} is far above your net strength (${grip}). It will fight the net hard.`, 'bad');
    G.sfx('snare');
    requestAnimationFrame(snareFrame);
  }
  function cancelSnare() {
    if (!snareState || snareState.done) return;
    netHome(); snareState.done = true; G.player.add(snareState.item, 1); snareState = null;
    el.snare.classList.add('hidden'); el.root.classList.remove('snaring');
    log('You pick the net back up.'); busy = false; renderActions();
  }
  // ---- the cast net, thrown the way it is thrown from a boat at dusk: gathered in the hand, swung to get the weights flying, let go, and it opens in the air into a great wheel of mesh and comes down over what you threw it at.
  // It is drawn over the world itself, so the Kin you are after is the real one standing in front of you, and it will not keep still. Swing to open it (more swing, wider net, and it sits heavier), flick to throw, and the moment it lands swirl the other way to draw the cord
  let NW = 390, NH = 780, HOME = [195, 630], NDPR = 1;
  const ROPE = '#9a6a38', TWINE = '#241a12', ROPE_HI = '#d9b178'; // the rim and the hand line are brown rope with the twist showing; the mesh is thin dark twine
  function netFit() { const c = el.net; NDPR = Math.min(2, window.devicePixelRatio || 1); NW = window.innerWidth; NH = window.innerHeight; c.width = Math.round(NW * NDPR); c.height = Math.round(NH * NDPR); HOME = [NW / 2, NH - Math.min(190, NH * 0.24)]; }
  function netWire() { const c = el.net; if (!c) return; const at = (ev) => [ev.clientX, ev.clientY, performance.now()];
    c.addEventListener('pointerdown', (ev) => { const n = snareState && snareState.net; if (n && n.phase === 'close') { ev.preventDefault(); try { c.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ } n.lastC = null; n.lastP = null; return; } if (!n || n.phase !== 'aim') return; ev.preventDefault(); try { c.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ } n.down = true; n.trail = [at(ev)]; n.lastA = null; n.hand = [ev.clientX, ev.clientY]; });
    c.addEventListener('pointermove', (ev) => { const n = snareState && snareState.net; if (n && n.phase === 'close') { const p = at(ev); if (!n.lastP) { n.lastP = p; return; } const dx = p[0] - n.lastP[0], dy = p[1] - n.lastP[1]; if (dx * dx + dy * dy < 36) return; const hd = Math.atan2(dy, dx); n.lastP = p; if (n.lastC != null) { let d = hd - n.lastC; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; if (Math.abs(d) < 2.2 && d * n.cdir > 0) n.tight = Math.min(1, n.tight + Math.abs(d) / (Math.PI * 2)); } n.lastC = hd; return; } /* drawing it shut: what counts is the finger going round, wherever on the screen it does it. The turn is read off how the stroke bends, not off a centre you would have to find. One full turn the other way from the swing */
      /* drawing it shut: only turns the other way from the swing count, a turn and a half of them */
      if (!n || !n.down || n.phase !== 'aim') return; const p = at(ev); n.trail.push(p); if (n.trail.length > 12) n.trail.shift(); const a = Math.atan2(p[1] - HOME[1], p[0] - HOME[0]); if (n.lastA != null) { let d = a - n.lastA; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; if (Math.abs(d) < 1.2) { n.turn += d; n.spin = Math.min(1, n.spin + Math.abs(d) / (Math.PI * 2.4)); } } n.lastA = a; n.hand = [p[0], p[1]]; });
    const up = (ev) => { const n = snareState && snareState.net; if (n && n.phase === 'close') { n.lastC = null; n.lastP = null; return; } if (!n || !n.down || n.phase !== 'aim') return; n.down = false; const T = n.trail, last = T[T.length - 1]; let first = T[0]; for (const q of T) if (last[2] - q[2] <= 110) { first = q; break; } const dt = Math.max(16, last[2] - first[2]) / 1000, vx = (last[0] - first[0]) / dt, vy = (last[1] - first[1]) / dt;
      if (ev.type === 'pointercancel') { n.hand = null; return; } // the phone took the touch away: that is not a throw
      if (vy > -260 || T.length < 3) { n.hand = null; return; } // not a throw: it has to go away from you with some snap in it
      if (n.spin < 0.3) { n.hand = null; n.warn = performance.now() + 1600; return; } // and a net that has not been swung open is not thrown at all: it would only fall in a heap. Lifting your finger early costs nothing
      // how far it goes is read off how hard you flicked, and gently: an easy flick falls short of the Kin, an ordinary one lands on it, and the hardest you can manage carries only half a body past. The same flick lands in the same place every time. Which way it goes is the way you flicked
      const sp = Math.hypot(vx, vy), f = U.clamp((sp - 380) / 2600, 0, 1), near = n.kfy + (last[1] - n.kfy) * 0.5, far = n.kfy - n.kpx * 0.75, y1 = f < 0.3 ? near + (n.kfy - near) * (f / 0.3) : f < 0.75 ? n.kfy : n.kfy + (far - n.kfy) * ((f - 0.75) / 0.25), x1 = U.clamp(last[0] + vx / Math.max(200, -vy) * (last[1] - y1), 20, NW - 20); n.phase = 'fly'; n.fly = { x0: last[0], y0: last[1], x1, y1, u: 0, bend: Math.sign(n.turn || 1) * n.spin * NW * 0.09 }; G.sfx('snare'); };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); }
  // where the Kin is on the screen, and how big
  /* a big one is taken by the head: the net goes over its eyes and the hush does the rest, so the net is the same size for a long-neck as for a fox and the throw has to find the head */
  function netHead(e) { const hb = e.model.bones && e.model.bones[1], sc = e.scale || 1, hh = (e.model.height || 1) * sc; if (!hb || !hb.piv || hh < 3.2) return null; const pv = hb.piv, sy = Math.sin(e.yaw || 0), cy = Math.cos(e.yaw || 0), fz = pv[2] * sc, fx = pv[0] * sc;
    return { x: e.x + sy * fz + cy * fx, y: e.y + (e.hover || 0) + Math.min(hh, pv[1] * sc + 0.3), z: e.z + cy * fz - sy * fx, r: U.clamp(hh * 0.16, 0.7, 1.3) }; }
  function netKin(n) { const e = wildE, hd = netHead(e); if (hd) { const a = R.project(hd.x, hd.y, hd.z), b = R.project(hd.x, hd.y + hd.r, hd.z); n.head = true; if (a && a.on && b) { n.kx = a.x; n.ky = a.y; n.kpx = U.clamp(Math.abs(a.y - b.y) * 2, 36, NH * 0.3); n.kfy = a.y + n.kpx * 0.15; } return; }
    const hh = (e.model.height || 1) * (e.scale || 1), a = R.project(e.x, e.y + (e.hover || 0) + hh * 0.5, e.z), b = R.project(e.x, e.y + (e.hover || 0) + hh, e.z), f = R.project(e.x, e.y, e.z); if (a && a.on && b) { n.kx = a.x; n.ky = a.y; n.kpx = U.clamp(Math.abs(a.y - b.y) * 2, 36, NH * 0.4); n.kfy = f ? f.y : a.y + n.kpx * 0.5; } }
  function netStart() { const st = snareState, rar = wild.sp.rarity || 0; netFit(); { const ex = document.getElementById('explain'); if (ex) ex.classList.add('hidden'); } const p = G.player; let dx = wildE.x - p.x, dz = wildE.z - p.z, dl = Math.hypot(dx, dz) || 1;
    // where you throw from: a fixed few paces off, wherever you happened to be standing. Looked for all the way round, starting from your own side, until there is a clear line to the Kin with no trunk or wall in it
    if (!(st.net && st.net.base)) { const wh0 = (wildE.model.height || 1) * (wildE.scale || 1), D0 = 3.6 + wh0 * 1.9, a0 = Math.atan2(dz, dx), w = G.world; let best = a0; for (const da of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.3, -2.3, 3.14]) { const a = a0 + da; let clear = true; for (let t = 0.8; t <= D0 && clear; t += 0.5) { const b = w.getBlock(Math.floor(wildE.x - Math.cos(a) * t), Math.floor(wildE.y + wh0 * 0.5 + 0.6 + t * 0.12), Math.floor(wildE.z - Math.sin(a) * t)); if (isSolid(b) || b === B.LEAVES || b === B.LOG) clear = false; } if (clear) { best = a; break; } } dx = Math.cos(best); dz = Math.sin(best); dl = 1; st.camDir = [dx, dz]; } else if (st.camDir) { dx = st.camDir[0]; dz = st.camDir[1]; dl = 1; }
    st.net = { phase: 'aim', spin: 0, turn: 0, down: false, trail: [], hand: null, t: Math.random() * 9, kx: NW / 2, ky: NH * 0.35, kpx: 80, kfy: NH * 0.4, diff: st.hopeless ? 0.08 : U.clamp(0.8 + st.width * 1.2, 0.8, 1.25), speed: 0.2 + rar * 0.07, jit: rar * 0.12, last: performance.now(), res: null, resT: 0, base: (st.net && st.net.base) || { x: wildE.x, z: wildE.z }, lat: [-dz / dl, dx / dl], reach: 0.22 + rar * 0.2 }; /* it shifts from foot to foot more than it runs: a common Kin hardly moves, and only the rarest give you any trouble */ netKin(st.net); }
  function netHome() { const n = snareState && snareState.net; if (n && n.base && wildE) { wildE.x = n.base.x; wildE.z = n.base.z; } }
  // the net itself: a wheel of mesh seen at a slant. r its radius on the screen, k how flat it lies (1 face on, 0.3 lying on the ground), wave how much the rim is still rippling
  // a length of rope: brown, with the lay of it showing as pale slanting ticks
  function ropeLine(g, pts, w, close) { const path = () => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); if (close) g.closePath(); }; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(20,12,6,.75)'; g.lineWidth = w + 2.4; path(); g.stroke(); g.strokeStyle = ROPE; g.lineWidth = w; path(); g.stroke();
    g.strokeStyle = ROPE_HI; g.lineWidth = Math.max(1, w * 0.3); let acc = 0; const step = Math.max(5, w * 1.5), N = pts.length + (close ? 0 : -1); for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L; while (acc < L) { const px = a[0] + ux * acc, py = a[1] + uy * acc, h = w * 0.42; g.beginPath(); g.moveTo(px - ux * h - uy * h, py - uy * h + ux * h); g.lineTo(px + ux * h + uy * h, py + uy * h - ux * h); g.stroke(); acc += step; } acc -= L; } }
  function netWheel(g, x, y, r, k, rot, col, wave) { const N = 32, rim = []; for (let i = 0; i < N; i++) { const a = i / N * 6.2832 + rot, w = 1 + (wave || 0) * Math.sin(a * 5 + rot * 3) * 0.07; rim.push([x + Math.cos(a) * r * w, y + Math.sin(a) * r * k * w]); }
    const path = (pts, close) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); if (close) g.closePath(); };
    g.lineJoin = 'round'; g.strokeStyle = col && col !== ROPE ? col : TWINE; g.lineWidth = Math.max(0.9, r * 0.007);
    for (let i = 0; i < N; i++) { g.beginPath(); g.moveTo(x, y); g.lineTo(rim[i][0], rim[i][1]); g.stroke(); } // thin dark twine out from the middle
    const rings = Math.max(5, Math.min(11, Math.round(r / 16))); for (let j = 1; j < rings; j++) { const f = j / rings; path(rim.map(q => [x + (q[0] - x) * f, y + (q[1] - y) * f]), true); g.stroke(); } // and round and round across it: the mesh
    ropeLine(g, rim, Math.max(3, r * 0.045), true); // the rim is the heavy rope the weights hang from
    for (let i = 0; i < N; i += 2) { g.fillStyle = '#3d4046'; g.beginPath(); g.arc(rim[i][0], rim[i][1], Math.max(2.5, r * 0.04), 0, 6.3); g.fill(); g.fillStyle = '#a9aeb6'; g.beginPath(); g.arc(rim[i][0] - 1, rim[i][1] - 1, Math.max(1, r * 0.015), 0, 6.3); g.fill(); } } // lead weights
  /* how wide the net lands. Half what it was: the throw has to be pointed at the Kin now. Your very first catch gets a wider one, so the first lesson is the swing and the flick and not the aim */
  function netR(n) { return Math.max(n.kpx, 80) * (0.8 + 0.85 * n.spin) * n.diff * ((G.stats.caught || 0) < 1 ? 1.2 : 1); } /* never smaller than the Kin itself, and near twice its size swung fully open */
  function netDraw(n) { const g = el.net.getContext('2d'); g.setTransform(NDPR, 0, 0, NDPR, 0, 0); g.clearRect(0, 0, NW, NH); g.textAlign = 'center'; const open = 0.42 + 0.58 * n.spin, farR = netR(n);
    const say = (t, y, c, sz) => { g.font = `800 ${sz || 20}px system-ui,sans-serif`; g.lineWidth = 5; g.strokeStyle = 'rgba(20,16,26,.8)'; g.strokeText(t, NW / 2, y); g.fillStyle = c || '#fff'; g.fillText(t, NW / 2, y); };
    const cord = (x, y) => { const pts = [], cx = (HOME[0] + x) / 2 + 30, cy = (NH + y) / 2 + 60; for (let i = 0; i <= 14; i++) { const u = i / 14, v = 1 - u; pts.push([v * v * HOME[0] + 2 * v * u * cx + u * u * x, v * v * (NH + 10) + 2 * v * u * cy + u * u * y]); } ropeLine(g, pts, 4.5, false); };
    if (n.phase === 'aim' || n.phase === 'fly') { const rr = (farR + n.kpx * 0.4) * 0.9, pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260); g.strokeStyle = `rgba(255,255,255,${0.35 + 0.25 * pulse})`; g.lineWidth = 3; g.setLineDash([9, 7]); g.beginPath(); g.ellipse(n.kx, n.kfy, rr, rr * 0.3, 0, 0, 6.3); g.stroke(); g.setLineDash([]); } // a ring on the ground round the Kin: land the middle of the net anywhere inside it. It grows as the net opens
    if (n.phase === 'aim') { // gathered in the hand, the weights hanging; swung, they fly out and the mouth of it starts to open
      const h = n.hand || [HOME[0], HOME[1] + 20], sw = n.hand ? Math.atan2(h[1] - HOME[1], h[0] - HOME[0]) : Math.PI / 2, len = 54 + 96 * n.spin, bx = h[0] + Math.cos(sw) * len * (n.hand ? 1 : 0), by = h[1] + (n.hand ? Math.sin(sw) * len : len), r = 24 + 104 * n.spin;
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 8; g.beginPath(); g.arc(HOME[0], HOME[1], 74, 0, 6.3); g.stroke(); g.strokeStyle = n.spin >= 0.98 ? '#7fe0c0' : '#ffd45a'; g.beginPath(); g.arc(HOME[0], HOME[1], 74, -Math.PI / 2, -Math.PI / 2 + 6.2832 * n.spin); g.stroke();
      cord(h[0], h[1]); for (const pass of [1]) { g.strokeStyle = TWINE; g.lineWidth = 1.4; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832 + n.turn; g.beginPath(); g.moveTo(h[0], h[1]); g.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r * 0.7); g.stroke(); } }
      netWheel(g, bx, by, r, 0.7, n.turn, ROPE, 1); g.fillStyle = '#e8b890'; g.beginPath(); g.arc(h[0], h[1], 13, 0, 6.3); g.fill(); g.strokeStyle = '#2a1a12'; g.lineWidth = 2.5; g.stroke();
      const warn = n.warn && performance.now() < n.warn; if (n.spin < 0.3) { const t = performance.now() / 600, a0 = t % 6.2832; g.strokeStyle = warn ? '#ff8a70' : 'rgba(255,255,255,.75)'; g.lineWidth = 5; g.beginPath(); g.arc(HOME[0], HOME[1], 52, a0, a0 + 4.2); g.stroke(); const ea = a0 + 4.2, ex = HOME[0] + Math.cos(ea) * 52, ey = HOME[1] + Math.sin(ea) * 52, ta = ea + Math.PI / 2; g.fillStyle = g.strokeStyle; g.beginPath(); g.moveTo(ex + Math.cos(ta) * 16, ey + Math.sin(ta) * 16); g.lineTo(ex + Math.cos(ta + 2.5) * 13, ey + Math.sin(ta + 2.5) * 13); g.lineTo(ex + Math.cos(ta - 2.5) * 13, ey + Math.sin(ta - 2.5) * 13); g.fill(); } // a turning arrow, to show what to do with your finger
      say(warn ? 'Swing it round in circles first!' : n.spin < 0.3 ? 'Hold and draw circles here to swing the net' : n.spin < 0.98 ? (n.head ? 'Keep circling, then flick it up at its head' : 'Keep circling, then flick it up at the Kin') : (n.head ? 'Wide open. Over its head!' : 'Wide open. Flick it up!'), HOME[1] - 96, warn ? '#ff8a70' : n.spin >= 0.98 ? '#7fe0c0' : '#fff', 17); }
    else if (n.phase === 'fly') { const f = n.fly, u = f.u, e2 = 1 - (1 - u) * (1 - u), x = f.x0 + (f.x1 - f.x0) * e2 + Math.sin(u * Math.PI) * f.bend, y = f.y0 + (f.y1 - f.y0) * e2 - Math.sin(u * Math.PI) * NH * 0.1, bloom = Math.min(1, u * 2.4), near = 1 + (1 - u) * 1.5, r = (farR * 0.7 + farR * 0.3 * bloom * bloom) * near, /* it leaves the hand already open and stays open all the way */ k = 0.95 - 0.62 * e2;
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(f.x0 + (f.x1 - f.x0) * e2, f.y0 + (f.y1 - f.y0) * e2 + farR * 0.3 * u, r * 0.9 * u, r * 0.28 * u, 0, 0, 6.3); g.fill(); // its shadow, running along the ground under it and growing
      cord(x, y); netWheel(g, x, y, r, k, n.turn + u * 5 * Math.sign(n.turn || 1), ROPE, 1 - u * 0.5); }
    else { const f = n.fly, okc = n.res === 'ok', closing = n.phase === 'close', tight = closing ? n.tight : okc ? 1 : 0, missed = n.res === 'miss', r = (farR * (1 - 0.6 * tight) + n.kpx * 0.22 * tight), gx = missed ? f.x1 : n.kx, gy = missed ? f.y1 : n.kfy, top = missed ? gy : n.ky - n.kpx * 0.55;
      cord(gx, top); if (missed) netWheel(g, gx, gy, farR, 0.3, n.turn, 'rgba(239,227,192,.85)', 0.4); else { // over it: the rim on the ground all round, the mesh hung from the Kin's back
        if (tight > 0.02 && n.res !== 'loose') { /* the hush taking hold: a soft light gathers in the weave as you draw it shut, with motes rising off it */ const cyy = (top + gy) / 2, R0 = Math.max(r, n.kpx * 0.5) * 1.5, gl = g.createRadialGradient(gx, cyy, 2, gx, cyy, R0), al = Math.min(1, tight) * (okc ? 1 : 0.85); gl.addColorStop(0, `rgba(225,244,255,${al})`); gl.addColorStop(0.45, `rgba(150,210,255,${al * 0.55})`); gl.addColorStop(1, 'rgba(150,210,255,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.beginPath(); g.arc(gx, cyy, R0, 0, 6.3); g.fill(); g.globalCompositeOperation = 'source-over';
          const tt = performance.now() / 1000; g.fillStyle = `rgba(235,248,255,${0.35 + 0.5 * tight})`; for (let i = 0; i < 9; i++) { const ph = (tt * 0.6 + i * 0.37) % 1, a = i * 2.4 + tt * 0.5, mx = gx + Math.cos(a) * r * (0.35 + 0.5 * ((i * 7) % 5) / 5), my = gy - ph * (gy - top + 26) ; g.globalAlpha = (1 - ph) * tight; g.beginPath(); g.arc(mx, my, 2.4 + (i % 3) * 1.1, 0, 6.3); g.fill(); } g.globalAlpha = 1; }
        const col = n.res === 'loose' ? '#b0402a' : TWINE; for (const pass of [1]) { g.strokeStyle = col; g.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832 + n.turn + tight * 3 * (n.cdir || 1), ex = gx + Math.cos(a) * r, ey = gy + Math.sin(a) * r * 0.3; g.beginPath(); g.moveTo(gx, top); g.quadraticCurveTo(gx + Math.cos(a) * r * 0.9, top + (ey - top) * 0.25, ex, ey); g.stroke(); }
          for (const fr of [0.4, 0.75]) { g.beginPath(); g.ellipse(gx, top + (gy - top) * fr, r * (0.55 + 0.42 * fr), r * 0.3 * (0.5 + 0.5 * fr), 0, 0, 6.3); g.stroke(); } { const rimp = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.2832; rimp.push([gx + Math.cos(a) * r, gy + Math.sin(a) * r * 0.3]); } ropeLine(g, rimp, Math.max(3.5, farR * 0.04), true); } }
        g.fillStyle = '#6f747c'; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832 + n.turn + tight * 3 * (n.cdir || 1); g.beginPath(); g.arc(gx + Math.cos(a) * r, gy + Math.sin(a) * r * 0.3, Math.max(2.5, farR * 0.035), 0, 6.3); g.fill(); } }
      if (closing) { const rr = r + 26; g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 10; g.beginPath(); g.ellipse(gx, gy, rr, rr * 0.3, 0, 0, 6.3); g.stroke(); g.strokeStyle = '#ff8a70'; g.beginPath(); g.ellipse(gx, gy, rr, rr * 0.3, 0, -Math.PI / 2, -Math.PI / 2 + 6.2832 * n.esc); g.stroke(); // how long before it is out from under
        const cx = NW / 2, cy = HOME[1] + 10, ccw = n.cdir < 0; g.strokeStyle = 'rgba(20,16,26,.7)'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, 50, ccw ? 0.6 : Math.PI - 0.6, ccw ? Math.PI + 0.9 : -0.9, ccw); g.stroke(); g.strokeStyle = '#ffd45a'; g.lineWidth = 9; g.stroke(); const ea = ccw ? Math.PI + 0.9 : -0.9, ex = cx + Math.cos(ea) * 50, ey = cy + Math.sin(ea) * 50, ta = ea + (ccw ? -1 : 1) * Math.PI / 2; g.fillStyle = '#ffd45a'; g.beginPath(); g.moveTo(ex + Math.cos(ta) * 22, ey + Math.sin(ta) * 22); g.lineTo(ex + Math.cos(ta + 2.5) * 18, ey + Math.sin(ta + 2.5) * 18); g.lineTo(ex + Math.cos(ta - 2.5) * 18, ey + Math.sin(ta - 2.5) * 18); g.fill();
        say(n.centre > 0.66 ? 'Dead centre! Now the other way' : n.centre < 0.3 ? 'Caught the edge! Other way, quick!' : 'Now the other way, fast!', HOME[1] - 76, '#ffd45a', 20); }
      else say(okc ? 'Got it!' : n.res === 'loose' ? 'Too slow: it got out from under!' : 'Missed!', NH * 0.2, okc ? '#7fe0c0' : '#ff8a70', 28); } }
  function snareFrame() {
    if (!snareState) return; const n = snareState.net; if (!n) return; const now = performance.now(), dt = Math.min(0.05, (now - n.last) / 1000); n.last = now;
    if (snareState.done && n.phase === 'aim') return; if (!snareState.done && n.phase === 'done') { netStart(); snareState.net.diff *= 0.92; return requestAnimationFrame(snareFrame); } // it tears at the net: another over the top, and it is quicker now
    if (n.phase === 'aim' || n.phase === 'fly') { n.t += dt * n.speed; const o = Math.sin(n.t * 6.2832) * n.reach + Math.sin(n.t * 6.2832 * 3.3 + 1) * n.reach * n.jit * 0.4; wildE.x = n.base.x + n.lat[0] * o; wildE.z = n.base.z + n.lat[1] * o; wildE.yaw = Math.atan2(n.lat[0] * Math.cos(n.t * 6.2832), n.lat[1] * Math.cos(n.t * 6.2832)); } // it runs back and forth across in front of you, the real one, in the world
    else if (n.phase === 'close') { const o = Math.sin(now / 28) * 0.05 * (1 - n.tight); wildE.x += n.lat[0] * o; wildE.z += n.lat[1] * o; }
    netKin(n);
    if (n.phase === 'aim' && !n.down) n.spin = Math.max(0, n.spin - dt * 0.25); // it closes again if you stop swinging
    if (n.phase === 'fly') { n.fly.u += dt / 0.6; if (n.fly.u >= 1) { n.fly.u = 1; const farR = netR(n), d = Math.hypot(n.fly.x1 - n.kx, (n.fly.y1 - (n.ky + n.kfy) / 2) * 1.15), reach = farR + n.kpx * 0.4, centre = U.clamp(1 - d / reach, 0, 1); /* if the net so much as touches the Kin it is in it. How near the middle it landed decides how long you get to draw it shut: dead centre is easy, a caught edge is a scramble */
        const on = !snareState.hopeless && d < reach; if (on) { n.centre = centre; n.phase = 'close'; n.tight = 0; n.esc = 0; n.cdir = -Math.sign(n.turn || 1); n.lastC = null; n.fly.x1 = n.kx; n.fly.y1 = n.kfy; n.lastP = null; n.window = U.clamp(2.3 - (wild.sp.rarity || 0) * 0.18 - (1 - n.spin) * 0.35, 1.3, 2.4) * (snareState.hits ? 0.9 : 1) * (0.62 + 0.6 * centre); } else { n.phase = 'land'; n.res = 'miss'; n.resT = 0.7; } } }
    else if (n.phase === 'close') { n.esc += dt / n.window; if (n.tight >= 1) { n.phase = 'land'; n.res = 'ok'; n.resT = 0.6; } else if (n.esc >= 1) { n.phase = 'land'; n.res = 'loose'; n.resT = 0.75; } } // over it, and open: it has this long to get out from under, and you have this long to draw the cord. A net that was thrown wide open sits heavier and gives you longer
    else if (n.phase === 'land') { n.resT -= dt; if (n.resT <= 0) { n.phase = 'done'; netDraw(n); if (n.res !== 'ok') netHome(); el.net.getContext('2d').clearRect(0, 0, el.net.width, el.net.height); onSnareGo(n.res === 'ok'); return; } }
    netDraw(n); requestAnimationFrame(snareFrame);
  }
  async function onSnareGo(hit) {
    if (!snareState || snareState.done) return;
    snareState.done = true;
    const ok = hit === true;
    el.snare.classList.add('hidden'); el.root.classList.remove('snaring');
    if (ok) {
      snareState.hits++;
      if (snareState.hits < snareState.need) {
        log(`The net holds… ${KIN.name(wild)} tears at it! Another over the top. (${snareState.hits}/${snareState.need})`, 'good'); G.sfx('snare');
        snareState.left = 0.05 + Math.random() * (0.9 - snareState.width); snareState.period *= 0.85; snareState.t0 = performance.now(); snareState.done = false;
        el.zone.style.left = (snareState.left * 100) + '%';
        el.snare.classList.remove('hidden'); el.root.classList.add('snaring'); requestAnimationFrame(snareFrame); return;
      }
      log(`The net draws tight. ${KIN.name(wild)} is yours!`, 'good'); G.sfx('caught');
      await sleep(900); return end('caught');
    }
    if (bossKin()) { log(`${KIN.name(wild)} tears the net apart, and the effort finishes it. It falls. One chance, and it is gone.`, 'bad'); G.sfx('miss'); snareState = null; wild.hp = 0; refresh(); await sleep(1100); return end('won'); } // one try at a boss's Kin
    G.player.add(snareState.item, 1); // a net is not lost by missing with it: you haul it back in by the hand line. It only leaves your bag with a Kin in it
    log(stealth ? `${KIN.name(wild)} gets clear and turns on you! You haul the net back in.` : `${KIN.name(wild)} gets clear. You haul the net back in.`, 'bad'); G.sfx('miss'); stealth = false;
    await sleep(500);
    await useMove(wild, mine, wildChoose(), false);
    snareState = null;
    afterTurn();
  }
  function end(result) {
    stunned = false; if (stunTimer) { clearInterval(stunTimer); stunTimer = null; }
    stealth = false;
    if (camState) { G.player.yaw = camState.yaw; G.player.pitch = Math.max(-0.3, Math.min(0.1, camState.pitch)); }
    for (const L of lunges) { L.e.x = L.bx; L.e.z = L.bz; L.e.y = L.by; } lunges.length = 0; for (const F of faints) { F.e.scale = F.s0; F.e._fainting = false; } faints.length = 0; shakeT = 0;
    active = false; busy = false; snareState = null; camState = null; fx.length = 0;
    el.root.classList.add('hidden'); el.root.classList.remove('snaring');
    if (mine && mine.equip && mine.equip.charm && ITEMS[mine.equip.charm] && ITEMS[mine.equip.charm].relic) Relics.wear(mine.equip.charm, 0.01);
    if (result === 'won' && wildE && wildE.high) { G.player.add('feather', 2); UI.toast('Two Sky Feathers drift down.', 'good'); }
    G.onBattleEnd(result, wildE, wild, mine, ambush);
    wildE = null; mineE = null;
  }
  // ---- attacks you can watch. Every element throws something of its own, a physical move is a lunge and a slash,
  // a technique is the same thing bigger, and a move that helps its user wraps it in an aura. A particle is { t, dur, col, shape, fn(u) -> [x, y, z, size, yaw] }.
  let shakeT = 0; const lunges = [];
  const rnd = (a) => (Math.random() - 0.5) * 2 * a, mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const WHITE = [1, 1, 1], lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  /* a Kin that is beaten does not just vanish: it sinks and shrinks while light leaves it; one that is sent out arrives in a ring of its own colour */
  const faints = [];
  function faintFx(e) { if (!e || !e.model || e._fainting) return; e._fainting = true; faints.push({ e, t: 0, s0: e.scale || 1 }); const C = ctr(e, 0.5); burst(C, WHITE, 18, 1.6, 0, 'ball', 0.14); for (let i = 0; i < 14; i++) { const o = [rnd(0.6), 0, rnd(0.6)]; Pt(0.1 + Math.random() * 0.4, 0.9, i % 2 ? WHITE : [0.8, 0.9, 1], 'ball', (u) => [C[0] + o[0] * (1 - u * 0.5), C[1] - 0.3 + u * 2.6, C[2] + o[2] * (1 - u * 0.5), 0.12 * (1 - u), 0]); } }
  function arriveFx(e, elem) { if (!e || !e.model) return; const col = U.hexToRgb(ELEM_COLOR[elem] || '#ffffff'), C = ctr(e, 0.1); ringOut(C, col, 16, 1.6, 0, 0.45, 0.16); ringOut([C[0], C[1] + 0.5, C[2]], WHITE, 12, 1.1, 0.08, 0.4, 0.12); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; Pt(0, 0.5, i % 2 ? col : WHITE, 'ball', (u) => [C[0] + Math.cos(a + u * 4) * 0.8 * (1 - u), C[1] + u * 1.8, C[2] + Math.sin(a + u * 4) * 0.8 * (1 - u), 0.14 * (1 - u * 0.6), 0]); } }
  function Pt(delay, dur, col, shape, fn) { if (fx.length < 700) fx.push({ t: -delay, dur, col, shape, fn }); }
  function ctr(e, k) { return [e.x, e.y + (e.model.height || 1) * (e.model.scale || 1) * k, e.z]; }
  function burst(c, col, n, sp, delay, shape, size) { for (let i = 0; i < n; i++) { const v = [rnd(sp), Math.random() * sp * 1.2, rnd(sp)], sz = (size || 0.14) * (0.6 + Math.random() * 0.8), cc = Math.random() < 0.3 ? mixc(col, WHITE, 0.6) : col; Pt(delay, 0.4 + Math.random() * 0.25, cc, shape || 'cube', (u) => [c[0] + v[0] * u, c[1] + v[1] * u - 2.2 * u * u, c[2] + v[2] * u, sz * (1 - u), u * 9]); } }
  function ringOut(c, col, n, rad, delay, dur, size) { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; Pt(delay, dur, col, 'ball', (u) => { const r = rad * (1 - (1 - u) * (1 - u)); return [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r, (size || 0.16) * (1 - u * 0.8), a]; }); } }
  function lunge(e, to, dist, dur, hop) { const dx = to.x - e.x, dz = to.z - e.z, d = Math.hypot(dx, dz) || 1; lunges.push({ e, t: 0, dur, hop: hop || 0, bx: e.x, bz: e.z, by: e.y, dx: dx / d * Math.min(dist, d - 0.6), dz: dz / d * Math.min(dist, d - 0.6) }); }
  const ELFX = {
    Flame(S, D, k, col) { const hot = [1, 0.85, 0.3]; for (let i = 0; i < 14 * k; i++) { const o = [rnd(0.25), rnd(0.25), rnd(0.25)], sz = 0.14 + i * 0.012; Pt(i * 0.022, 0.36, i % 3 ? col : hot, 'ball', (u) => { const p = lerp3(S, D, u); return [p[0] + o[0] * u * 2, p[1] + o[1] * u * 2 + Math.sin(u * Math.PI) * 0.3, p[2] + o[2] * u * 2, sz * (0.6 + u), u * 6]; }); }
      const T = 0.42; burst(D, col, 16 * k, 1.8, T, 'ball', 0.2); for (let i = 0; i < 12 * k; i++) { const a = Math.random() * 6.28, r = Math.random() * 0.5; Pt(T + Math.random() * 0.25, 0.55, i % 2 ? hot : col, 'ball', (u) => [D[0] + Math.cos(a + u * 3) * r * (1 - u), D[1] - 0.4 + u * 2.4, D[2] + Math.sin(a + u * 3) * r * (1 - u), 0.3 * (1 - u), a]); } return T; },
    Tide(S, D, k, col) { const foam = [0.9, 0.97, 1], dx = D[0] - S[0], dz = D[2] - S[2], d = Math.hypot(dx, dz) || 1, sx = -dz / d, sz = dx / d; /* a wave rolls along the ground and breaks on the target */
      for (let i = 0; i < 22 * k; i++) { const lat = rnd(1.1), ph = Math.random() * 0.12, top = Math.random() < 0.3; Pt(ph, 0.5, top ? foam : col, 'ball', (u) => { const p = lerp3(S, D, u), w = 1 - Math.abs(lat) / 1.3; return [p[0] + sx * lat * (1 - u * 0.5), D[1] - 0.5 + (0.3 + 0.9 * u) * w * (top ? 1.15 : 0.8) + Math.sin(u * 9 + lat * 3) * 0.1, p[2] + sz * lat * (1 - u * 0.5), 0.2 + 0.25 * u, u * 3]; }); }
      const T = 0.52; burst(D, col, 14 * k, 2.2, T, 'ball', 0.2); burst(D, foam, 8 * k, 1.4, T, 'ball', 0.12); ringOut([D[0], D[1] - 0.5, D[2]], foam, 14, 1.8 * k, T, 0.5, 0.14); return T; },
    Bloom(S, D, k, col) { const petal = [1, 0.6, 0.8]; for (let i = 0; i < 16 * k; i++) { const a0 = i * 0.8; Pt(i * 0.02, 0.5, i % 4 === 0 ? petal : col, 'shard', (u) => { const p = lerp3(S, D, u), r = 0.45 * Math.sin(u * Math.PI); return [p[0] + Math.cos(a0 + u * 10) * r, p[1] + Math.sin(a0 + u * 10) * r, p[2] + Math.sin(a0 + u * 7) * r * 0.5, 0.16, a0 + u * 14]; }); }
      const T = 0.5; for (let i = 0; i < 7 * k; i++) { const a = i / 7 * 6.28, r = 0.55; Pt(T + i * 0.02, 0.7, mixc(col, [0.2, 0.4, 0.1], 0.3), 'shard', (u) => { const g = Math.min(1, u * 3); return [D[0] + Math.cos(a) * r * (1 - g * 0.5), D[1] - 0.7 + g * 1.1, D[2] + Math.sin(a) * r * (1 - g * 0.5), 0.3 * (u < 0.75 ? 1 : (1 - u) * 4), a]; }); } /* vines come up round it */
      burst(D, petal, 12 * k, 1.5, T + 0.1, 'cube', 0.1); return T; },
    Stone(S, D, k, col) { const dark = mixc(col, [0.2, 0.16, 0.12], 0.4); for (let i = 0; i < 5 * k; i++) { const o = [rnd(0.8), 0, rnd(0.8)], sz = 0.28 + Math.random() * 0.2, dl = i * 0.05; /* rocks tear out of the ground, hang, and are thrown */
        Pt(dl, 0.32, i % 2 ? col : dark, 'cube', (u) => [S[0] + o[0], S[1] - 0.8 + u * 1.9, S[2] + o[2], sz, u * 2]); Pt(dl + 0.32, 0.36, i % 2 ? col : dark, 'cube', (u) => { const p = lerp3([S[0] + o[0], S[1] + 1.1, S[2] + o[2]], D, u); return [p[0], p[1] + Math.sin(u * Math.PI) * 0.9, p[2], sz, 2 + u * 8]; }); }
      const T = 0.72; burst(D, col, 14 * k, 2, T, 'cube', 0.2); ringOut([D[0], D[1] - 0.5, D[2]], [0.75, 0.7, 0.62], 12, 1.5 * k, T, 0.45, 0.2); return T; },
    Gale(S, D, k, col) { for (let i = 0; i < 6 * k; i++) { const o = rnd(0.5); Pt(i * 0.04, 0.3, WHITE, 'shard', (u) => { const p = lerp3(S, D, u); return [p[0], p[1] + o + Math.sin(u * 6 + i) * 0.15, p[2], 0.22, Math.atan2(D[0] - S[0], D[2] - S[2])]; }); }
      const T = 0.34; for (let i = 0; i < 30 * k; i++) { const a0 = Math.random() * 6.28, h0 = Math.random(); Pt(T + Math.random() * 0.2, 0.75, i % 3 ? col : WHITE, i % 2 ? 'shard' : 'ball', (u) => { const h = (h0 + u * 0.8) % 1, r = (0.3 + h * 0.9) * k; return [D[0] + Math.cos(a0 + u * 14) * r, D[1] - 0.6 + h * 2.6, D[2] + Math.sin(a0 + u * 14) * r, 0.14 * Math.sin(u * Math.PI) + 0.03, a0 + u * 14]; }); } /* a twister stands up on the spot */ return T; },
    Frost(S, D, k, col) { const yaw = Math.atan2(D[0] - S[0], D[2] - S[2]); for (let i = 0; i < 9 * k; i++) { const o = [rnd(0.35), rnd(0.35), rnd(0.35)]; Pt(i * 0.03, 0.22, i % 2 ? col : WHITE, 'shard', (u) => { const p = lerp3(S, D, u); return [p[0] + o[0], p[1] + o[1], p[2] + o[2], 0.3, yaw]; }); }
      const T = 0.36; for (let i = 0; i < 8 * k; i++) { const a = i / 8 * 6.28, r = 0.25 + (i % 2) * 0.4, hh = 0.9 + (i % 3) * 0.4; for (let j = 0; j < 4; j++) Pt(T + i * 0.015, 0.8, j === 3 ? WHITE : col, 'cube', (u) => { const g = Math.min(1, u * 5); return [D[0] + Math.cos(a) * r, D[1] - 0.7 + j * 0.28 * hh * g, D[2] + Math.sin(a) * r, (0.3 - j * 0.06) * (u < 0.8 ? 1 : (1 - u) * 5), a]; }); } /* ice stands up out of the ground and holds a moment */
      burst(D, WHITE, 10 * k, 1.4, T, 'cube', 0.08); return T; },
    Spark(S, D, k, col) { for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28; Pt(Math.random() * 0.2, 0.2, col, 'shard', (u) => [S[0] + Math.cos(a) * 0.7 * (1 - u), S[1] + rnd(0.5), S[2] + Math.sin(a) * 0.7 * (1 - u), 0.12, a]); } /* charge gathers */
      const T = 0.3; for (let f = 0; f < 2 + (k > 1 ? 1 : 0); f++) { let x = D[0] + rnd(0.6), z = D[2] + rnd(0.6); const n = 16; for (let i = 0; i < n; i++) { const u0 = i / (n - 1), y = D[1] + 8 * (1 - u0); x += (D[0] - x) * 0.25 + rnd(0.45) * (1 - u0); z += (D[2] - z) * 0.25 + rnd(0.45) * (1 - u0); const px = x, pz = z; Pt(T + f * 0.11, 0.1, f % 2 ? WHITE : col, 'ball', () => [px, y, pz, 0.34 * k, 0]); } } /* a bolt comes down, twice */
      burst(D, col, 16 * k, 2.4, T + 0.02, 'shard', 0.14); ringOut([D[0], D[1] - 0.5, D[2]], WHITE, 10, 1.3, T, 0.25, 0.12); return T; },
    Void(S, D, k, col) { const dark = [0.12, 0.05, 0.2]; for (let i = 0; i < 20 * k; i++) { const a = Math.random() * 6.28, b = Math.random() * 3.14 - 1.57, r = 2.2; const o = [Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r * 0.7 + 0.4, Math.sin(a) * Math.cos(b) * r]; Pt(Math.random() * 0.15, 0.42, i % 3 ? col : dark, 'ball', (u) => { const q = 1 - u * u; return [D[0] + o[0] * q, D[1] + o[1] * q, D[2] + o[2] * q, 0.12 + 0.16 * u, a]; }); } /* the dark falls inward */
      const T = 0.5; Pt(T - 0.08, 0.3, dark, 'ball', (u) => [D[0], D[1], D[2], 1.3 * k * Math.sin(u * Math.PI), 0]); ringOut(D, col, 16, 2.2 * k, T, 0.4, 0.18); burst(D, col, 10 * k, 1.6, T, 'cube', 0.12); return T; },
    Light(S, D, k, col) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; Pt(0, 0.3, col, 'ball', (u) => [S[0] + Math.cos(a + u * 4) * 0.6 * (1 - u), S[1] + u * 1.2, S[2] + Math.sin(a + u * 4) * 0.6 * (1 - u), 0.12, a]); }
      const T = 0.32; for (let i = 0; i < 16; i++) { const y = i * 0.55; Pt(T - 0.04 + (15 - i) * 0.004, 0.42, i % 2 ? WHITE : col, 'ball', (u) => [D[0], D[1] - 0.5 + y, D[2], (0.75 * k - i * 0.012) * (1 - u * u), 0]); } /* a pillar of light drops on it */
      ringOut([D[0], D[1] - 0.5, D[2]], col, 16, 1.9 * k, T, 0.45, 0.16); for (let i = 0; i < 12 * k; i++) { const o = [rnd(0.8), 0, rnd(0.8)]; Pt(T + Math.random() * 0.3, 0.6, WHITE, 'cube', (u) => [D[0] + o[0], D[1] - 0.4 + u * 2.2, D[2] + o[2], 0.08 * (1 - u), u * 5]); } return T; },
  };
  // what an element's thrown things are made of
  const ESHAPE = { Flame: 'ball', Tide: 'ball', Bloom: 'shard', Stone: 'cube', Gale: 'shard', Frost: 'shard', Spark: 'shard', Void: 'ball', Light: 'ball' };
  // thrown pictures any element can use, in its own colour and stuff: a ray, a fall from the sky, one slow great orb, quick shots, spikes running along the ground, a drifting cloud, a ring that closes in
  const GEN = {
    beam(S, D, k, col, sh, el) { const n = 26, jag = el === 'Spark' ? 0.28 : 0; for (let i = 0; i < n; i++) { const q = i / (n - 1), o = [rnd(jag), rnd(jag), rnd(jag)]; Pt(q * 0.14, 0.42, i % 3 === 0 ? WHITE : col, 'ball', (u) => { const p = lerp3(S, D, q); return [p[0] + o[0], p[1] + o[1], p[2] + o[2], (0.2 + 0.1 * Math.sin(u * 30 + i)) * k * (u < 0.7 ? 1 : (1 - u) / 0.3), 0]; }); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; Pt(0, 0.2, col, sh, (u) => [S[0] + Math.cos(a) * 0.6 * (1 - u), S[1] + Math.sin(a) * 0.6 * (1 - u), S[2], 0.12, a]); }
      const T = 0.18; burst(D, col, 14 * k, 2, T, sh, 0.14); ringOut(D, WHITE, 10, 1.2 * k, T, 0.3, 0.1); return T; },
    rain(S, D, k, col, sh) { const T = 0.38; for (let i = 0; i < 14 * k; i++) { const o = [rnd(1.3), 0, rnd(1.3)], dl = 0.1 + Math.random() * 0.55, sz = 0.2 + Math.random() * 0.16, land = [D[0] + o[0], D[1] - 0.5, D[2] + o[2]]; Pt(dl, 0.28, i % 4 === 0 ? WHITE : col, sh, (u) => [land[0] + (1 - u) * 1.2, land[1] + (1 - u) * 7, land[2], sz, u * 4]); burst(land, col, 3, 1, dl + 0.28, 'cube', 0.08); }
      for (let i = 0; i < 6; i++) Pt(0, 0.3, col, sh, (u) => [S[0] + rnd(0.2), S[1] + u * 5, S[2] + rnd(0.2), 0.16 * (1 - u), 0]); /* it goes up before it comes down */ return T; },
    orb(S, D, k, col, sh) { const T = 0.62; Pt(0, T, col, 'ball', (u) => { const p = lerp3(S, D, u * u); return [p[0], p[1] + Math.sin(u * Math.PI) * 0.4, p[2], (0.35 + 0.5 * u) * k, 0]; }); Pt(0, T, WHITE, 'ball', (u) => { const p = lerp3(S, D, u * u); return [p[0], p[1] + Math.sin(u * Math.PI) * 0.4, p[2], (0.18 + 0.2 * u) * k, 0]; });
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; Pt(0, T, i % 2 ? col : WHITE, sh, (u) => { const p = lerp3(S, D, u * u), r = 0.5 + 0.3 * u; return [p[0] + Math.cos(a + u * 16) * r, p[1] + Math.sin(u * Math.PI) * 0.4 + Math.sin(a + u * 16) * r, p[2], 0.1, a + u * 16]; }); }
      burst(D, col, 26 * k, 2.8, T, sh, 0.2); ringOut(D, WHITE, 16, 2.2 * k, T, 0.4, 0.16); ringOut([D[0], D[1] - 0.5, D[2]], col, 16, 2.6 * k, T + 0.05, 0.5, 0.14); return T; },
    volley(S, D, k, col, sh) { const yaw = Math.atan2(D[0] - S[0], D[2] - S[2]), n = Math.round(6 * k); for (let i = 0; i < n; i++) { const o = [rnd(0.35), rnd(0.35), rnd(0.35)], dl = i * 0.085, to = [D[0] + o[0], D[1] + o[1], D[2] + o[2]]; Pt(dl, 0.17, i % 2 ? col : mixc(col, WHITE, 0.5), sh, (u) => { const p = lerp3(S, to, u); return [p[0], p[1], p[2], 0.3, yaw]; }); Pt(dl, 0.17, WHITE, 'ball', (u) => { const p = lerp3(S, to, Math.max(0, u - 0.15)); return [p[0], p[1], p[2], 0.1, 0]; }); burst(to, col, 4, 1.2, dl + 0.17, 'cube', 0.09); } return 0.17; },
    ground(S, D, k, col, sh) { const n = 9, g = D[1] - 0.6; for (let i = 0; i <= n; i++) { const q = i / n, p = lerp3(S, D, q), dl = q * 0.38, last = i === n, hh = last ? 1.9 * k : 0.5 + q * 0.5; for (let j = 0; j < (last ? 7 : 2); j++) { const o = last ? [rnd(0.5), 0, rnd(0.5)] : [rnd(0.2), 0, rnd(0.2)]; Pt(dl + j * 0.01, last ? 0.7 : 0.4, j % 3 === 2 ? mixc(col, WHITE, 0.5) : col, sh === 'ball' ? 'cube' : sh, (u) => { const up = Math.min(1, u * 4); return [p[0] + o[0], g + up * hh * (0.5 + 0.5 * ((j * 7) % 3) / 2), p[2] + o[2], (last ? 0.34 : 0.22) * (u < 0.7 ? 1 : (1 - u) / 0.3), j]; }); } }
      const T = 0.4; ringOut([D[0], g + 0.1, D[2]], col, 12, 1.6 * k, T, 0.4, 0.14); burst(D, col, 10 * k, 1.6, T + 0.05, 'cube', 0.12); return T; },
    cloud(S, D, k, col, sh) { for (let i = 0; i < 26 * k; i++) { const a = Math.random() * 6.28, r = 0.3 + Math.random() * 0.9, h = rnd(0.7), dl = Math.random() * 0.2; Pt(dl, 1.1, i % 3 === 0 ? mixc(col, WHITE, 0.6) : col, i % 4 === 0 ? sh : 'ball', (u) => { const q = Math.min(1, u * 2.2), p = lerp3(S, D, q), sw = Math.max(0, u * 2.2 - 1); return [p[0] + Math.cos(a + sw * 5) * r * q, p[1] + h * q + Math.sin(u * 9 + a) * 0.1, p[2] + Math.sin(a + sw * 5) * r * q, (0.2 + 0.25 * q) * (u < 0.75 ? 1 : (1 - u) * 4), a]; }); } return 0.5; },
    ringin(S, D, k, col, sh) { const n = 20; for (let i = 0; i < n; i++) { const a = i / n * 6.28; Pt(0, 0.5, i % 2 ? col : mixc(col, WHITE, 0.5), sh, (u) => { const r = 2.6 * k * (1 - u * u) + 0.1; return [D[0] + Math.cos(a + u * 7) * r, D[1] - 0.3 + Math.sin(u * Math.PI) * 0.5, D[2] + Math.sin(a + u * 7) * r, 0.24, a + u * 7 + 1.57]; }); }
      for (let i = 0; i < 6; i++) Pt(0, 0.25, col, sh, (u) => { const p = lerp3(S, D, u); return [p[0], p[1] + 1.5 * Math.sin(u * Math.PI), p[2], 0.14, 0]; });
      const T = 0.5; for (let i = 0; i < 14 * k; i++) { const o = [rnd(0.4), 0, rnd(0.4)]; Pt(T + Math.random() * 0.1, 0.5, i % 2 ? col : WHITE, sh, (u) => [D[0] + o[0], D[1] - 0.5 + u * 3, D[2] + o[2], 0.24 * (1 - u), u * 8]); } return T; },
    erupt(S, D, k, col, sh) { GEN.ground(S, D, 1.3, col, 'cube'); const T = 0.42; for (let i = 0; i < 26; i++) { const v = [rnd(1.6), 3.5 + Math.random() * 3, rnd(1.6)], sz = 0.2 + Math.random() * 0.2; Pt(T + Math.random() * 0.25, 0.9, i % 3 ? col : [1, 0.9, 0.35], 'ball', (u) => [D[0] + v[0] * u, D[1] - 0.6 + v[1] * u - 4.2 * u * u, D[2] + v[2] * u, sz * (1 - u * 0.6), u * 6]); } return T; },
    nova(S, D, k, col, sh) { Pt(0, 0.45, WHITE, 'ball', (u) => [D[0], D[1] + 2.5 * (1 - u), D[2], 0.2 + u * 0.5, 0]); const T = 0.45; Pt(T, 0.35, WHITE, 'ball', (u) => [D[0], D[1], D[2], 2.4 * Math.sin(u * Math.PI), 0]); for (let r = 0; r < 3; r++) ringOut([D[0], D[1] - 0.4 + r * 0.5, D[2]], r % 2 ? WHITE : col, 20, 3 + r, T + r * 0.07, 0.5, 0.2); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; for (let j = 1; j < 6; j++) Pt(T + j * 0.02, 0.4, col, 'shard', (u) => [D[0] + Math.cos(a) * j * 0.5, D[1] + Math.sin(a * 2) * 0.3, D[2] + Math.sin(a) * j * 0.5, 0.2 * (1 - u), -a + 1.57]); } return T; },
  };
  // strikes: what the attacker does when it closes in. Each returns the seconds until it lands
  const PHYS = {
    slash(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.5); const T = 0.2, ya = Math.atan2(D[0] - S[0], D[2] - S[2]) + Math.PI / 2, ex = Math.sin(ya), ez = Math.cos(ya);
      for (let c = 0; c < 3 * k; c++) { const ang = -0.7 + (c % 3) * 0.7 + rnd(0.2); for (let i = 0; i < 9; i++) { const q = i / 8 - 0.5; Pt(T + c * 0.05 + i * 0.006, 0.22, i % 3 === 1 ? WHITE : col, 'shard', (u) => [D[0] + ex * q * 1.5 * Math.cos(ang), D[1] + q * 1.5 * Math.sin(ang) + 0.1, D[2] + ez * q * 1.5 * Math.cos(ang), 0.22 * (1 - u), ya]); } } return T + 0.05; },
    claw(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.5); const T = 0.2, ya = Math.atan2(D[0] - S[0], D[2] - S[2]) + Math.PI / 2, ex = Math.sin(ya), ez = Math.cos(ya); /* three rakes, side by side, top to bottom */
      for (let c = 0; c < 3; c++) for (let i = 0; i < 10; i++) { const q = i / 9; Pt(T + i * 0.012, 0.3, i > 6 ? WHITE : col, 'shard', (u) => [D[0] + ex * ((c - 1) * 0.36 + q * 0.3 - 0.15), D[1] + 0.8 - q * 1.5, D[2] + ez * ((c - 1) * 0.36 + q * 0.3 - 0.15), 0.26 * k * (1 - u), ya]); } return T + 0.1; },
    bite(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.55); const T = 0.3, ya = Math.atan2(D[0] - S[0], D[2] - S[2]) + Math.PI / 2, ex = Math.sin(ya), ez = Math.cos(ya); /* two rows of fangs close on it */
      for (const jaw of [-1, 1]) for (let i = 0; i < 6; i++) { const q = (i - 2.5) * 0.24; Pt(0.12, 0.34, i % 2 ? WHITE : mixc(col, WHITE, 0.5), 'cube', (u) => { const c = Math.min(1, u / 0.5), open = 1.1 * (1 - c * c) + 0.08; return [D[0] + ex * q, D[1] + jaw * open, D[2] + ez * q, (0.26 - Math.abs(q) * 0.1) * k * (u < 0.8 ? 1 : (1 - u) * 5), 0]; }); } return T; },
    rush(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.42); const T = 0.16; for (let i = 0; i < 16; i++) { const o = [rnd(0.35), rnd(0.35), rnd(0.35)]; Pt(i * 0.01, 0.3, i % 2 ? col : WHITE, 'shard', (u) => { const p = lerp3(S, D, Math.min(1, i / 16 + u * 0.3)); return [p[0] + o[0], p[1] + o[1], p[2] + o[2], 0.2 * (1 - u), Math.atan2(D[0] - S[0], D[2] - S[2])]; }); } /* streaks behind it */
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; for (let j = 1; j < 4; j++) Pt(T + j * 0.02, 0.25, j === 1 ? WHITE : col, 'shard', (u) => [D[0] + Math.cos(a) * j * 0.3, D[1] + Math.sin(a) * j * 0.3, D[2], 0.2 * k * (1 - u), a]); } return T; },
    slam(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.7, 2.2); const T = 0.3, g = [D[0], D[1] - 0.55, D[2]]; ringOut(g, col, 18, 2.4 * k, T, 0.45, 0.2); ringOut(g, WHITE, 12, 1.5 * k, T + 0.05, 0.35, 0.12); for (let i = 0; i < 10 * k; i++) { const o = [rnd(1), 0, rnd(1)]; Pt(T, 0.5, i % 2 ? col : [0.55, 0.5, 0.45], 'cube', (u) => [g[0] + o[0], g[1] + Math.sin(u * Math.PI) * 1.3, g[2] + o[2], 0.22 * (1 - u), u * 6]); } return T; },
    dive(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.75, 3.4); const T = 0.34; for (let i = 0; i < 14; i++) Pt(0.12 + i * 0.012, 0.3, i % 2 ? col : WHITE, 'shard', (u) => [D[0] + rnd(0.2), D[1] + 3.2 * (1 - i / 14) + 0.3, D[2] + rnd(0.2), 0.24 * (1 - u), 0]); burst(D, WHITE, 8 * k, 2.2, T, 'shard', 0.14); ringOut([D[0], D[1] - 0.5, D[2]], col, 14, 2 * k, T, 0.4, 0.16); return T; },
    flurry(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.8); for (let h = 0; h < 5; h++) { const c = [D[0] + rnd(0.5), D[1] + rnd(0.6), D[2] + rnd(0.5)], dl = 0.2 + h * 0.09; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; Pt(dl, 0.16, i % 2 ? WHITE : col, 'shard', (u) => [c[0] + Math.cos(a) * u * 0.5, c[1] + Math.sin(a) * u * 0.5, c[2], 0.2 * k * (1 - u), a]); } } return 0.56; },
    tail(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.6); const T = 0.28, base = Math.atan2(D[2] - S[2], D[0] - S[0]) + Math.PI; for (let i = 0; i < 18; i++) { const a = base - 1.5 + i / 17 * 3; Pt(0.18 + i * 0.007, 0.25, i % 3 ? col : WHITE, 'shard', (u) => [D[0] + Math.cos(a) * 1.0, D[1] - 0.2 + Math.sin(i / 17 * Math.PI) * 0.25, D[2] + Math.sin(a) * 1.0, 0.28 * k * (1 - u), -a]); } return T; },
    drill(src, dst, S, D, k, col, hit) { lunge(src, dst, hit ? 99 : 1.2, 0.7); for (let i = 0; i < 24; i++) { const q = i / 24; Pt(0.1 + q * 0.3, 0.25, i % 3 ? col : WHITE, 'shard', (u) => { const p = lerp3(S, D, 0.5 + q * 0.5), r = 0.6 * (1 - q); return [p[0] + Math.cos(q * 20 + u * 6) * r, p[1] + Math.sin(q * 20 + u * 6) * r, p[2], 0.18 * k * (1 - u), q * 20]; }); } return 0.42; },
  };
  // plays a move and returns the seconds until it lands. hit = false: it goes wide and nothing bursts on the target
  function playMove(src, dst, move, hit) {
    const col = U.hexToRgb(ELEM_COLOR[move.elem] || '#ffffff'), k = move.tech ? 1.6 : move.grown ? 1.2 : 1; const S = ctr(src, 0.6); let D = ctr(dst, 0.5);
    if (!hit) { const dx = D[0] - S[0], dz = D[2] - S[2], d = Math.hypot(dx, dz) || 1; D = [D[0] - dz / d * 1.6, D[1], D[2] + dx / d * 1.6]; }
    if (move.kind === 'phys') { const T = (PHYS[move.fx] || PHYS.slash)(src, dst, S, D, k, col, hit);
      for (let i = 0; i < 8; i++) Pt(i * 0.015, 0.25, i % 2 ? col : WHITE, 'ball', (u) => { const p = lerp3(S, D, Math.min(1, 0.1 + i * 0.09)); return [p[0], p[1] + rnd(0.1), p[2], 0.18 * (1 - u), 0]; });
      if (hit) { burst(D, col, 12 * k, 1.8, T, ESHAPE[move.elem] || 'cube', 0.14); ringOut([D[0], D[1] - 0.4, D[2]], WHITE, 10, 1.2, T, 0.25, 0.1); }
      return T; }
    lunge(src, dst, 0.35, 0.3); const g = move.fx && move.fx !== 'own' ? GEN[move.fx] : null;
    return g ? g(S, D, k, col, ESHAPE[move.elem] || 'ball', move.elem) : (ELFX[move.elem] || ELFX.Light)(S, D, k, col);
  }
  function playUtil(src, move) { /* an aura climbs round the user: green for healing, stone for a guard, white wind for speed */
    const heal = /Mend|Regrowth/.test(move.name), guard = /Guard|Bulwark/.test(move.name), col = heal ? [0.5, 1, 0.5] : guard ? [0.75, 0.85, 1] : /Focus/.test(move.name) ? [1, 0.6, 0.3] : [0.9, 1, 1]; const C = ctr(src, 0.1), h = (src.model.height || 1) * (src.model.scale || 1);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 4, d = i * 0.012; Pt(d, 0.75, i % 3 ? col : WHITE, guard ? 'cube' : 'ball', (u) => [C[0] + Math.cos(a + u * (guard ? 1.5 : 5)) * (0.5 + h * 0.3), C[1] + (guard ? (i % 6) / 6 * h * 1.1 : u * h * 1.4), C[2] + Math.sin(a + u * (guard ? 1.5 : 5)) * (0.5 + h * 0.3), 0.13 * Math.sin(u * Math.PI) + 0.02, a]); }
    if (heal) for (let i = 0; i < 8; i++) { const o = [rnd(0.5), 0, rnd(0.5)]; Pt(0.2 + i * 0.05, 0.6, [0.7, 1, 0.7], 'cube', (u) => [C[0] + o[0], C[1] + 0.3 + u * h * 1.2, C[2] + o[2], 0.12 * (1 - u), 0]); }
  }
  function spawnFx(src, dst, elem) { if (!src || !dst || !src.model || !dst.model) return; const col = U.hexToRgb(ELEM_COLOR[elem] || '#ffffff'); (ELFX[elem] || ELFX.Light)(ctr(src, 0.6), ctr(dst, 0.5), 0.7, col); } // skirmishes in the open use the same pictures, a little smaller
  const FXMESH = { cube: (mb, c) => mb.box(-0.08, -0.08, -0.08, 0.08, 0.08, 0.08, c, 1, true), ball: (mb, c) => mb.blob(-0.085, -0.085, -0.085, 0.085, 0.085, 0.085, 1, c, { emis: true, n: 3 }), shard: (mb, c) => mb.blob(-0.035, -0.035, -0.2, 0.035, 0.035, 0.2, 1, c, { emis: true, n: 2 }) };
  function fxEntities() {
    const out = [];
    for (const f of fx) {
      if (f.t < 0) continue; const u = Math.min(1, f.t / f.dur), p = f.fn(u); if (!(p[3] > 0.004)) continue;
      const key = 'fx:' + f.shape + f.col.map(c => Math.round(c * 12)).join(',');
      out.push({ x: p[0], y: p[1], z: p[2], yaw: p[4] || 0, scale: p[3] * 6, hover: 0, skyMul: 1, isFx: true, mesh: R.entityMesh(key, (mb) => FXMESH[f.shape](mb, f.col)) });
    }
    return out;
  }
  // ---- camera: behind your Kin, looking across at the wild one ----
  function camera(dt, mobile) {
    if (!wildE) return null;
    const me = mineE || { x: G.player.x, y: G.player.y, z: G.player.z, model: { height: 1.8, scale: 1 } };
    const dx = wildE.x - me.x, dz = wildE.z - me.z, d = Math.hypot(dx, dz) || 1;
    const bx = -dx / d, bz = -dz / d; // back direction
    const side = [-bz, bx];
    const mh = me.model.height * (me.model.scale || 1), wh = wildE.model.height * (wildE.model.scale || 1);
    let cx = me.x + bx * 1.4 + side[0] * 2.8, cz = me.z + bz * 1.4 + side[1] * 2.8, cy = me.y + Math.max(1.2, mh * 0.7) + 0.6;
    // keep the camera out of blocks
    for (let i = 0; i < 6 && isSolid(G.world.getBlock(Math.floor(cx), Math.floor(cy), Math.floor(cz))); i++) { cx -= bx * 0.4; cz -= bz * 0.4; cy += 0.3; }
    const lx = (me.x + wildE.x) / 2, lz = (me.z + wildE.z) / 2, ly = (me.y + mh * 0.5 + wildE.y + wh * 0.5) / 2;
    const ddx = lx - cx, ddz = lz - cz, ddy = ly - cy;
    let yaw = Math.atan2(-ddx, -ddz), pitch = Math.atan2(ddy, Math.hypot(ddx, ddz)) - (mobile ? 0.26 : 0.06);
    // throwing the net, you stand square in front of it and it fills the upper part of the view: your own eyes, a few paces back, looking a little down
    if (snareState && snareState.net && snareState.net.base) { const b = snareState.net.base, cd = snareState.camDir || [1, 0], ex = cd[0], ez = cd[1], el2 = 1, D = 3.6 + wh * 1.9; cx = b.x - ex / el2 * D; cz = b.z - ez / el2 * D; cy = wildE.y + wh * 0.55 + 1.1; const hd0 = netHead(wildE); if (hd0) { const Dh = 5.5 + wh * 0.55; cx = b.x - ex * Dh; cz = b.z - ez * Dh; cy = hd0.y - wh * 0.22; } /* a big one: stand closer and look up at the head */
      for (let i = 0; i < 6 && isSolid(G.world.getBlock(Math.floor(cx), Math.floor(cy), Math.floor(cz))); i++) cy += 0.4;
      const hd1 = netHead(wildE), tx = (hd1 ? hd1.x : b.x) - cx, tz = (hd1 ? hd1.z : b.z) - cz, ty = hd1 ? hd1.y - wh * 0.12 - cy : wildE.y - wh * 0.9 - cy; yaw = Math.atan2(-tx, -tz); pitch = Math.atan2(ty, Math.hypot(tx, tz)); }
    if (!camState) { const e = G.player.eye(); camState = { x: e.x, y: e.y, z: e.z, yaw: G.player.yaw, pitch: G.player.pitch }; }
    const k = Math.min(1, dt * 5);
    camState.x += (cx - camState.x) * k; camState.y += (cy - camState.y) * k; camState.z += (cz - camState.z) * k;
    let dy = yaw - camState.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    camState.yaw += dy * k; camState.pitch += (pitch - camState.pitch) * k;
    const sk = shakeT > 0 ? shakeT * 0.55 : 0; /* a hit shakes the view */
    return { x: camState.x + rnd(sk), y: camState.y + rnd(sk), z: camState.z + rnd(sk), yaw: camState.yaw + rnd(sk * 0.05), pitch: camState.pitch + rnd(sk * 0.05) };
  }
  function tick(dt) {
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; if (f.t > f.dur) fx.splice(i, 1); }
    if (shakeT > 0) shakeT = Math.max(0, shakeT - dt);
    for (let i = faints.length - 1; i >= 0; i--) { const F = faints[i]; F.t += dt; const u = Math.min(1, F.t / 0.7); F.e.scale = F.s0 * (1 - u * u * 0.85); if (u >= 1) faints.splice(i, 1); }
    for (let i = lunges.length - 1; i >= 0; i--) { const L = lunges[i]; L.t += dt; const u = Math.min(1, L.t / L.dur), q = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65, e2 = q * q * (3 - 2 * q); L.e.x = L.bx + L.dx * e2; L.e.z = L.bz + L.dz * e2; if (L.hop) L.e.y = L.by + L.hop * Math.sin(Math.min(1, u / 0.4) * Math.PI); if (u >= 1) { L.e.x = L.bx; L.e.z = L.bz; L.e.y = L.by; lunges.splice(i, 1); } }
    if (!active) return;
    if (mineE && mineE.hitT > 0) mineE.hitT -= dt;
    if (wildE && wildE.hitT > 0) wildE.hitT -= dt;
  }
  function abort() { if (!active) return; const e = wildE; end('ran'); if (e) e.cool = 60; } // test hook: walk away from a fight
  // the same arithmetic for fights in the open: the live skirmish between your Kin and a wild one uses the battle's numbers
  function calcDamage(att, def, move) { att.buffs = att.buffs || buffs(); def.buffs = def.buffs || buffs(); return damage(att, def, move); }
  function dodges(att, def) { att.buffs = att.buffs || buffs(); def.buffs = def.buffs || buffs(); return Math.random() > (move0(att).acc || 0.95) || Math.random() < dodgeChance(att, def); }
  function move0(k) { return KIN.moves(k)[0]; }
  function fxTest(elem, kind, tech, hit) { if (!mineE || !wildE) return -1; return kind === 'util' ? (playUtil(mineE, { name: elem }), 0) : playMove(mineE, wildE, { elem, kind, tech: tech === true, fx: typeof tech === 'string' ? tech : undefined }, hit !== false); } // test hook
  return { get net() { return snareState && snareState.net; }, fxTest, init, start, tick, camera, fxEntities, spawnFx, calcDamage, dodges, abort, get active() { return active; }, get mineEntity() { return mineE; }, get wildEntity() { return wildE; } };
})();
