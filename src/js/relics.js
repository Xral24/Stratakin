'use strict';
// Relics: Kin gear far beyond anything a forge makes. One of each in the world, each sold by one person in one place, each priced for
// someone who has freed a lot of villages and saved for it. The seller only brings it out once you have earned the right to ask.
const Relics = (() => {
  let G = null;
  const LIST = [
    { id: 'relic_core', lvl: 25, seller: 'foreman', name: 'Deepcore Band', slot: 'charm', boost: { hp: 0.2, atk: 0.15, pow: 0.2 }, price: 9000, col: '#ff8a3a',
      lore: 'Garrick\'s father pulled the stone out of the deepest seam the camp ever dug. It is still warm.', need: (G, c) => (c.pick || 0) >= 2, needTxt: 'Get the iron pick from Garrick' },
    { id: 'relic_talon', lvl: 35, seller: 'hermit', name: 'Stormcrest Talon', slot: 'weapon', boost: { atk: 0.35, spd: 0.3 }, price: 12000, col: '#9fd8ff',
      lore: 'Shed by the old queen of the high birds, the year the peak lost its snow. Wren never sold it to anyone.', need: (G, c) => !!c.flightSnare, needTxt: 'Bring Old Wren the sky egg' },
    { id: 'relic_scale', lvl: 40, seller: 'diver', name: 'Abyssal Scale', slot: 'armor', boost: { hp: 0.4, agi: 0.25 }, price: 15000, col: '#2fb8c8',
      lore: 'A single scale off something that swims under the deep villages. Marisol will not say what.', need: (G, c) => !!c.bulbDone, needTxt: 'Bring Marisol her mother\'s pearls' },
    { id: 'relic_fang', lvl: 55, seller: 'turncoat', name: 'Umbral Fang', slot: 'weapon', boost: { atk: 0.45, pow: 0.2 }, price: 20000, col: '#7a2aa8',
      lore: 'Cut from the Kinmaster\'s own vault, the night before he ran for the Core.', need: (G) => freedEver(G) >= 6, needTxt: 'Free 6 villages', needN: 6 },
    { id: 'relic_plate', lvl: 65, seller: 'turncoat', name: 'Nightfall Plate', slot: 'armor', boost: { hp: 0.55, pow: 0.25, spd: 0.1 }, price: 25000, col: '#3a1458',
      lore: 'The armour his own Vexmaw wore. Black as the inside of a mine, and it drinks the light around it.', need: (G) => freedEver(G) >= 8, needTxt: 'Free 8 villages', needN: 8 },
    { id: 'relic_crown', lvl: 70, seller: 'merchant', name: 'Sovereign\'s Crown', slot: 'charm', boost: { hp: 0.25, atk: 0.25, pow: 0.25, spd: 0.25, agi: 0.25 }, price: 30000, col: '#ffd040',
      lore: 'Silas swears it belonged to the last king of the hills. Silas swears a great many things. This one is real.', need: (G, c) => !!c.bridgeFixed && freedEver(G) >= 5, needTxt: 'Pay for the bridge and free 5 villages' },
    { id: 'relic_jaw', lvl: 90, seller: 'keeper', name: 'Tyrant\'s Jaw', slot: 'weapon', boost: { atk: 0.7, pow: 0.15, hp: 0.1 }, price: 60000, col: '#d8c8a0',
      lore: 'One tooth from the Tyrannorex itself, set in Lost World amber. There is no second one. There never will be.', need: (G) => (G.stats.apex || {}).rex === true, needTxt: 'Catch the Tyrannorex' },
  ];
  // wear: relics lose condition in use. Armour on hits taken, weapons on hits landed, charms a little every fight.
  // The bonus fades as it wears and is gone at 0%. Only a runesmith can mend one, and the longer you leave it, the dearer it gets.
  const MATS = { relic_core: ['ember', 'diamond'], relic_talon: ['feather', 'ess_Gale'], relic_scale: ['pearl', 'ess_Tide'], relic_fang: ['void', 'ess_Void'], relic_plate: ['void', 'ess_Void'], relic_crown: ['gold', 'diamond'], relic_jaw: ['diamond', 'gold'] };
  function cond(id) { const h = (G && G.stats.relicHp) || {}; return h[id] == null ? 1 : h[id]; }
  function mul(id) { const c = cond(id); return c <= 0 ? 0 : 0.5 + 0.5 * c; }
  function wear(id, amt) {
    if (!ITEMS[id] || !ITEMS[id].relic) return;
    if (!G.stats.relicHp) G.stats.relicHp = {}; const before = cond(id); const after = Math.max(0, before - amt); G.stats.relicHp[id] = after;
    const nm = ITEMS[id].name;
    if (before > 0.4 && after <= 0.4) UI.toast(`${nm} is cracking (40%). Its power is fading. Only a runesmith can mend it, and it gets dearer the longer you wait.`, 'bad');
    else if (before > 0.15 && after <= 0.15) UI.toast(`${nm} is nearly broken (15%).`, 'bad');
    else if (before > 0 && after <= 0) UI.toast(`${nm} has broken. It does nothing now until a runesmith rebuilds it.`, 'bad');
  }
  function quote(id) {
    const r = LIST.find(x => x.id === id); const miss = 1 - cond(id); if (!r || miss < 0.005) return null;
    const shards = Math.max(200, Math.round(r.price * 2.8 * Math.pow(miss, 2.45) / 50) * 50);
    const broken = cond(id) <= 0; const [a, b] = MATS[id] || ['iron', 'gold'];
    const mats = { [a]: Math.ceil(miss * 6) + (broken ? 3 : 0), [b]: Math.ceil(miss * 4) + (broken ? 2 : 0) };
    return { shards, mats, broken };
  }
  function repair(id) {
    const q = quote(id); if (!q) return false; const P = G.player;
    if (G.shards < q.shards) { UI.toast(`The runesmith wants ${q.shards.toLocaleString()} shards.`, 'bad'); return false; }
    for (const k in q.mats) if (P.count(k) < q.mats[k]) { UI.toast(`Missing ${ITEMS[k].name}: ${P.count(k)}/${q.mats[k]}.`, 'bad'); return false; }
    G.shards -= q.shards; for (const k in q.mats) P.take(k, q.mats[k]); G.stats.relicHp[id] = 1;
    UI.sfx('quest'); UI.toast(`${ITEMS[id].name} is whole again.`, 'good'); return true;
  }
  function owners() { return LIST.filter(r => (G.stats.relics || {})[r.id]); }
  function forgeHtml() {
    const own = owners(); if (!own.length) return '<p class="note">You own no relics. Nothing here needs mending.</p>';
    return own.map(r => { const c = cond(r.id), q = quote(r.id); const pct = Math.round(c * 100);
      const matTxt = q ? Object.keys(q.mats).map(k => `<span class="${G.player.count(k) >= q.mats[k] ? 'ok' : 'no'}">${ITEMS[k].name} ${G.player.count(k)}/${q.mats[k]}</span>`).join(' ') : '';
      const can = q && G.shards >= q.shards && Object.keys(q.mats).every(k => G.player.count(k) >= q.mats[k]);
      return `<div class="recipe relic"><div class="ico big" style="background:${r.col}"></div><div class="rinfo"><b>${r.name}</b> <span class="relictag">RELIC</span><div class="condbar"><i style="width:${pct}%;background:${pct > 40 ? '#5ad66a' : pct > 15 ? '#ffb040' : '#ff4040'}"></i></div><div class="small">Condition ${pct}%${c <= 0 ? ' · BROKEN, no bonus at all' : ` · bonus at ${Math.round(mul(r.id) * 100)}%`}</div>${q ? `<div class="needs"><span class="${G.shards >= q.shards ? 'ok' : 'no'}">◆ ${q.shards.toLocaleString()}</span> ${matTxt}</div>` : '<div class="small">Whole. Nothing to mend.</div>'}</div><button class="btn" data-mend="${r.id}" ${can ? '' : 'disabled'}>${q ? 'Mend' : 'Whole'}</button></div>`; }).join('');
  }
  function freedEver(G) { return Object.keys(G.villageState || {}).filter(id => { const s = G.villageState[id]; return s && (s.freed || s.freedDay != null); }).length; }
  function init(game) {
    G = game;
    for (const r of LIST) {
      const parts = Object.keys(r.boost).map(k => `${{ hp: 'Health', atk: 'Attack', pow: 'Power', spd: 'Speed', agi: 'Agility' }[k]} +${Math.round(r.boost[k] * 100)}%`).join(', ');
      ITEMS[r.id] = { name: r.name, kinGear: r.slot, boost: r.boost, col: r.col, relic: true, desc: `Relic, Kin ${r.slot === 'armor' ? 'armour' : r.slot}: ${parts}. ${r.lore}` };
    }
  }
  const owned = (r) => !!(G.stats.relics || {})[r.id];
  function forSeller(seller) { return LIST.filter(r => r.seller === seller); }
  function has(seller) { return forSeller(seller).some(r => !owned(r)); }
  const REFUSE = {
    foreman: (L) => `Not yet. I have something of my father's, but I am not handing it to someone who still digs like a beginner. Come back when you are trainer level ${L}.`,
    hermit: (L) => `There is a thing I keep for the right person. You are not that person yet, young one. Level ${L}, and then we talk.`,
    diver: (L) => `I have something from the deep. Not for you. Not yet. Come back at level ${L} and I might open the chest.`,
    merchant: (L) => `My dear customer, the item I have in mind is for collectors of a certain standing. Trainer level ${L}, at the very least. Shards alone do not open this drawer.`,
    keeper: (L) => `There is one more exhibit, but it is not for children. Level ${L}. Then come and see me.`,
    turncoat: (L) => `You took his fortress. Good. But what I carry out of that vault I sell to someone who can hold it. You are still green. Trainer level ${L}, and I will show you.`,
  };
  // a seller with nothing you are ready for says so, and keeps the box shut
  function gate(seller) { const open = forSeller(seller).filter(r => !owned(r)); if (!open.length) return null; const lo = Math.min(...open.map(r => r.lvl)); return (G.trainerLevel || 1) < lo ? REFUSE[seller](lo) : null; }
  function buy(id) {
    const r = LIST.find(x => x.id === id); if (!r || owned(r)) return;
    if ((G.trainerLevel || 1) < r.lvl) { UI.toast(`Trainer level ${r.lvl} first.`, 'bad'); return; }
    const c = Campaign.C(); if (!r.need(G, c)) { UI.toast(r.needTxt + ' first.', 'bad'); return; }
    if (G.shards < r.price) { UI.toast(`${r.price.toLocaleString()} shards. You have ${G.shards.toLocaleString()}.`, 'bad'); return; }
    G.shards -= r.price; if (!G.stats.relics) G.stats.relics = {}; G.stats.relics[r.id] = true;
    G.player.add(r.id, 1); UI.sfx('quest'); UI.openPanel('reveal', { kind: 'item', item: r.id, n: 1 });
  }
  function html(seller) {
    const c = Campaign.C();
    return forSeller(seller).map(r => {
      const mine = owned(r);
      if (!mine && (G.trainerLevel || 1) < r.lvl) return `<div class="recipe relic"><div class="ico big" style="background:#222"></div><div class="rinfo"><b>Something wrapped in cloth</b> <span class="relictag">RELIC</span><div class="small">"Not for you yet. Come back when you are trainer level ${r.lvl}."</div></div><button class="btn" disabled>Lv ${r.lvl}</button></div>`;
      const ok = r.need(G, c), afford = G.shards >= r.price;
      const prog = r.needN ? ` (${freedEver(G)}/${r.needN})` : '';
      return `<div class="recipe relic ${mine ? '' : ok && afford ? 'can' : ''}"><div class="ico big" style="background:${r.col}"></div><div class="rinfo"><b>${r.name}</b> <span class="relictag">RELIC</span><div class="small">${ITEMS[r.id].desc}</div><div class="needs"><span class="${afford ? 'ok' : 'no'}">◆ ${r.price.toLocaleString()}</span> <span class="${ok ? 'ok' : 'no'}">${ok ? 'You have earned the right to ask' : r.needTxt + prog}</span></div></div><button class="btn" data-relic="${r.id}" ${mine || !ok || !afford ? 'disabled' : ''}>${mine ? 'Yours' : 'Buy'}</button></div>`;
    }).join('');
  }
  return { init, LIST, html, buy, has, forSeller, freedEver, gate, cond, mul, wear, quote, repair, forgeHtml };
})();
