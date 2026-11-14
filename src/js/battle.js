'use strict';
// Turn-based battle in the 3D scene with a bottom-sheet UI. Capture is a placed Snare Cube with a timing bar, not a thrown ball.
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
    el.snare.addEventListener('click', onSnareGo);
    // changed your mind (or pressed Snare by accident): the snare goes back in the bag and the fight carries on
    const cancel = q('snare-cancel'); const stop = (e) => { e.stopPropagation(); e.preventDefault(); cancelSnare(); };
    cancel.addEventListener('click', stop); cancel.addEventListener('touchstart', stop, { passive: false });
    el.snare.addEventListener('touchstart', (e) => { e.preventDefault(); onSnareGo(); }, { passive: false });
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
    if (wildE.isBoss) log(`${n} blocks the square.`, 'bad');
    if (wildE.isLegend) log(`${n}, the legend of this world. Lv ${wild.level}.`, 'bad');
    if (wildE.isApex) log(`${n}. Lv ${wild.level}. Run, or be very, very sure.`, 'bad');
    if (wildE.keepBoss) log(`${n}, the warlord of this hold. Lv ${wild.level}.`, 'bad');
    if (wildE.finalBoss) log(`${n}, left behind to hold you. Lv ${wild.level}. Beat it, or cage a legend.`, 'bad');
    camState = null;
    stealth = !!opts.stealth;
    if (stealth) { el.log.innerHTML = ''; log(`${n} has not seen you. Set the snare before it does.`, 'good'); renderActions(); busy = false; beginSnare(); return; }
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
  const AIL = { burn: { name: 'Burn', word: 'is burning', pct: 0.06, turns: 3, col: [1, 0.5, 0.15], tag: '#ff7a2a' }, frost: { name: 'Frostbite', word: 'is frostbitten', pct: 0.05, turns: 3, col: [0.7, 0.95, 1], tag: '#7fd8f5' },
    poison: { name: 'Poison', word: 'is poisoned', pct: 0.04, grow: 0.02, turns: 4, col: [0.6, 0.85, 0.2], tag: '#8fc93a' }, shock: { name: 'Shock', word: 'is jolted', pct: 0, skip: 0.3, turns: 3, col: [1, 0.9, 0.3], tag: '#e8c800' }, curse: { name: 'Curse', word: 'is cursed', pct: 0.05, turns: 3, col: [0.65, 0.35, 1], tag: '#a65cff' } };
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
  // which snare this Kin takes: the high flyers only a Flight Snare thrown from the air, the water Kin none at all (that is the rod's job)
  function snareRule() {
    const p = G.player;
    if (wildE && wildE.finalBoss) return { list: [], why: 'Not this one. This one you end' }; // the last fight only; the Kinmaster's own Kin and his warlords' can be caught
    if (wildE && wildE.aquatic && !wildE.isApex) return { list: [], why: 'Water Kin slip any cage. Fish them with a rod.' };
    if (wildE && wildE.high) { const air = p.gliding || p.mountMode === 'air'; if (!air) return { list: [], why: 'Only from the air' }; return { list: p.has('snare_sky') ? ['snare_sky'] : [], why: 'Needs a Flight Snare' }; }
    return { list: ['snare2', 'snare'].filter(s => p.has(s)), why: 'No snares' };
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
    html += `<button class="act snare" data-a="snare" ${(!snares.length || bagFull) ? 'disabled' : ''}><b>Snare</b><small>${bagFull ? 'Bag full (20). Fuse first.' : snareLabel}</small></button>`;
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
    let dmg = A * (move.power / 100) * 1.1 * (A / (A + 0.5 * D)) * eff * (0.85 + Math.random() * 0.15);
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
    let ailMsg = ''; if (move.ail && def.hp > 0 && !def.buffs.ail && Math.random() < (move.ailP || 0.3)) { def.buffs.ail = { type: move.ail, turns: AIL[move.ail].turns, n: 0 }; ailMsg = ` ${dn} ${AIL[move.ail].word}!`; }
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
    // the snare moment: as soon as one more of your Kin's strongest attack would finish it (however much life it has left), it is out of it for a
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
  // ---- snare mini-game ----
  let snareState = null;
  const bossKin = () => !!(wildE && (wildE.isBoss || wildE.kinmaster || wildE.keepBoss || wildE.citadelFirst));
  function catchChance() {
    const st = KIN.stats(wild); const frac = wild.hp / st.hp;
    const item = snareRule().list[0] || 'snare';
    let c = stealth ? ITEMS[item].snare * (wildE && wildE.alert < 0.5 ? 0.6 : 0.45) : ITEMS[item].snare * (1 - frac * 0.8);
    if (wild.level > mine.level + 3) c *= 0.75;
    if ((stunned || (stunUsed && wild.hp <= strongestHit())) && !bossKin()) c *= 1.8; // stunned: much easier to hold (a boss's Kin does not give you that)
    // the level gap: a little above you is fair, 20% above is a long shot, twice your level and nothing holds it
    const grip = 2 * Math.max(1, G.trainerLevel || 1); // snare strength: twice your trainer level, not your Kin's level
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
    log(`${KIN.name(wild)} staggers, stunned! Snare it now, or let it fall.`, 'good'); G.sfx('win'); if (G.knockout) G.knockout();
    stunned = true; let left = 4.0;
    const rule = snareRule(); const can = rule.list.length > 0; const cc = can ? catchChance() : null;
    const what = !can ? rule.why : cc.hopeless ? `too strong to hold yet (Lv ${wild.level}; raise your trainer level)` : `${ITEMS[rule.list[0]].name} · about ${Math.max(1, Math.round(Math.min(1, cc.chance * (bossKin() ? 1 : 1.8)) * 100))}%${bossKin() ? ' · one chance' : ''}`;
    el.actions.innerHTML = `<button class="act snare stun" data-a="stunsnare" ${can && !cc.hopeless ? '' : 'disabled'}><b>Snare it!</b><small>${what} · <span id="stun-left">4</span>s</small><i class="stunbar"><i id="stun-fill"></i></i></button><button class="act" data-a="finish"><b>Finish it</b><small>win the fight</small></button>`;
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
    el.zone.style.left = (left * 100) + '%'; el.zone.style.width = (width * 100) + '%';
    el.snare.classList.remove('hidden'); el.root.classList.add('snaring'); el.root.scrollTop = 0;
    const pct = chance === 0 ? '0%' : chance < 0.01 ? 'under 1%' : Math.round(chance * 100) + '%';
    log(`You set a ${ITEMS[item].name} on the ground${stealth ? ', quietly' : ''}. Catch chance ${pct}.`);
    if (hopeless) log(`${KIN.name(wild)} is more than twice your snare strength (${grip}, twice your trainer level). No snare made will hold it. Beat it, or come back stronger.`, 'bad');
    else if (gap > 1.2) log(`${KIN.name(wild)} is far above your snare strength (${grip}). It will fight the cage hard.`, 'bad');
    G.sfx('snare');
    requestAnimationFrame(snareFrame);
  }
  function cancelSnare() {
    if (!snareState || snareState.done) return;
    snareState.done = true; G.player.add(snareState.item, 1); snareState = null;
    el.snare.classList.add('hidden'); el.root.classList.remove('snaring');
    log('You pick the snare back up.'); busy = false; renderActions();
  }
  function snareFrame() {
    if (!snareState || snareState.done) return;
    const t = (performance.now() - snareState.t0) / 1000 / snareState.period;
    const s = t % 1; const pos = s < 0.5 ? s * 2 : 2 - s * 2;
    snareState.pos = pos;
    el.marker.style.left = (pos * 100) + '%';
    requestAnimationFrame(snareFrame);
  }
  async function onSnareGo() {
    if (!snareState || snareState.done) return;
    snareState.done = true;
    const p = snareState.pos, ok = !snareState.hopeless && p >= snareState.left && p <= snareState.left + snareState.width;
    el.marker.classList.add(ok ? 'ok' : 'bad');
    await sleep(500);
    el.marker.classList.remove('ok', 'bad');
    el.snare.classList.add('hidden'); el.root.classList.remove('snaring');
    if (ok) {
      snareState.hits++;
      if (snareState.hits < snareState.need) {
        log(`The cage holds… ${KIN.name(wild)} strains against it! (${snareState.hits}/${snareState.need})`, 'good'); G.sfx('snare');
        snareState.left = 0.05 + Math.random() * (0.9 - snareState.width); snareState.period *= 0.85; snareState.t0 = performance.now(); snareState.done = false;
        el.zone.style.left = (snareState.left * 100) + '%';
        el.snare.classList.remove('hidden'); el.root.classList.add('snaring'); requestAnimationFrame(snareFrame); return;
      }
      log(`The cage snaps shut. ${KIN.name(wild)} is yours!`, 'good'); G.sfx('caught');
      await sleep(900); return end('caught');
    }
    if (bossKin()) { log(`${KIN.name(wild)} tears the cage apart, and the effort finishes it. It falls. One chance, and it is gone.`, 'bad'); G.sfx('miss'); snareState = null; wild.hp = 0; refresh(); await sleep(1100); return end('won'); } // one try at a boss's Kin
    log(stealth ? `${KIN.name(wild)} breaks free and turns on you!` : `${KIN.name(wild)} breaks free!`, 'bad'); G.sfx('miss'); stealth = false;
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
    const yaw = Math.atan2(-ddx, -ddz), pitch = Math.atan2(ddy, Math.hypot(ddx, ddz)) - (mobile ? 0.26 : 0.06);
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
  return { fxTest, init, start, tick, camera, fxEntities, spawnFx, calcDamage, dodges, abort, get active() { return active; }, get mineEntity() { return mineE; }, get wildEntity() { return wildE; } };
})();
