'use strict';
// Faces you know, a long way from where you met them. Mr Crowe is in every town on every world (that is in village.js).
// Maren the net-maker, who pulled you out of the brook, has come up to the Moon with a bale of nets. Barnaby Quill sold his tent
// and followed the rumour of a ring where they fight animals the size of barns: he is at the Pit on Halo.
const Cast = (() => {
  let G = null, maren = null, quill = null, tick = 0;
  function init(game) { G = game; maren = null; quill = null; tick = 0; }
  const S = () => (G.stats.cast = G.stats.cast || {});
  const say = (n, lines, done) => { G.talkNpc = n; Dialogue.show(n.name, lines, done); };
  const taken = () => !!(G.stats.garrison || {}).taken;
  function marenTalk() { const st = S(), n = maren, shop = () => UI.openPanel('shop', { title: 'Maren\'s nets', keeper: 'Maren', greet: 'Friend\'s price. Do not tell the Exchange.', stock: [{ item: 'snare2', price: 30 }, { item: 'snare', price: 8, n: 2 }, { item: 'bread', price: 8 }] });
    if (!st.maren) { st.maren = 1; return say(n, ['You look as if you have seen a ghost.', 'I came up on a cargo Glide with forty nets and a letter of credit from Mr Crowe, of all people. Nothing up here has fur and nothing has feathers, but a net is a net, and they pay double for anything that holds.', 'I pulled you out of a brook once. Do not make me come and pull you out of a crater.'], shop); }
    if (taken() && st.maren < 2) { st.maren = 2; return say(n, ['The white post went dark last night and came back on warm. I knew it was you before anybody said a name.', 'They say he ran for Halo. They say the air there eats you. You have that thing round your neck now, so I suppose you are going anyway.', 'Take nets. You always need more than you think.'], shop); }
    if ((G.stats.arena || {}).last) return say(n, ['It is finished, then. All of it.', 'I am staying. I like it here. Nobody on the Moon has ever asked me where I am from.'], shop);
    say(n, [taken() ? 'Still here. Still selling. Go on, have a look.' : 'Mind the white post out past the city. Their lights are the wrong colour and they do not buy nets.'], shop); }
  function quillTalk() { const st = S(), n = quill, a = G.stats.arena || { won: 0 }, B = (typeof Arena !== 'undefined' && Arena.BOUTS) || [], rex = G.kin.find(k => k.sp && k.sp.apex === 'rex');
    if (!st.quill) { st.quill = 1; return say(n, ['Barnaby Quill! Quill\'s Menagerie, as was. You remember. You stood at my rail with your mouth open.', 'I sold the tent the day I heard there was a ring where they fight animals the size of barns. Purely as a student of the unusual, you understand.', a.won < 5 && B[a.won] ? 'Next out of that gate is ' + B[a.won].name + '. I have watched it feed. Go in low and do not let it turn.' : 'And they tell me the champion of this ring is somebody from my own world. I am not at all surprised.']); }
    if (a.last) return say(n, ['I watched it from the top rib. Two things that should not exist, and one of them was on our side.', 'I am going to write a book. Nobody will believe a word and I will sell every copy.']);
    if (rex) return say(n, ['Is that. No. It is. That is what mine would have grown into.', 'So you found where it came from. I asked everybody on one world and the answer was on another man\'s table on a second.', 'Take it in there. I want to see what happens when something older than he is looks at him.']);
    if (a.sawKM) return say(n, ['I saw what stood up in that ring. Nothing born on this world or the last one is going to put it down.', 'Mine came from somewhere, remember. A place that had no business still being there. If one thing walked out of it, bigger things stayed in.', 'Go home. Find it. Bring back the biggest thing that will follow you.']);
    if (a.won >= 5) return say(n, ['Champion of the Pit. I had money on you from the second bout. Quite a lot of money.', 'Varga says the man who owns the ring has not shown his face. He will. Men like that cannot stay away from a crowd.']);
    say(n, B[a.won] ? ['Next out of that gate is ' + B[a.won].name + '.', B[a.won].say, 'That is what the Pit Boss says, anyway. I say watch its feet.'] : ['Marvellous place. Dreadful coffee.']); }
  function ground(x, z) { const w = G.world; w.ensureAround(Math.floor(x / CH), Math.floor(z / CH), 0, 99); return w.groundY(Math.floor(x), Math.floor(z)) + 1; }
  function update(dt, p) { tick -= dt; if (tick > 0) return; tick = 1.5; const wid = G.worldId;
    if (wid !== 'moon' && maren) { Village.dropLoose(maren); maren = null; } if (wid !== 'halo' && quill) { Village.dropLoose(quill); quill = null; }
    if (wid === 'moon' && !maren) { const L = (Village.townList ? Village.townList() : []).filter(v => v.id !== 'start'); if (!L.length) return; let v = L[0]; for (const q of L) if (Math.hypot(q.x, q.z) < Math.hypot(v.x, v.z)) v = q; /* the same town every time: the one nearest the middle of the map */
      if (Math.hypot(v.x - p.x, v.z - p.z) > 150) return; const x = v.x + 6, z = v.z + 5; /* on the square, across from where Crowe stands */
      maren = Village.makeNpc(98, 'traveller', x, z, 'Maren', null, ground(x, z), 'shore'); maren.wander = false; maren.tag = 'net-maker, a long way from the brook'; maren.onTalk = marenTalk; maren.yaw = Math.PI / 2; Village.addLoose(maren); }
    if (wid === 'halo' && !quill && typeof Arena !== 'undefined') { const s = Arena.site(); if (!s || Math.hypot(s.x - p.x, s.z - p.z) > 150) return; const x = s.x + Math.sin(s.ga) * 19 + Math.cos(s.ga) * 4, z = s.z + Math.cos(s.ga) * 19 - Math.sin(s.ga) * 4;
      quill = Village.makeNpc(99, 'traveller', x, z, 'Barnaby Quill', null, ground(x, z), 'shore'); const sp = { shape: 'human', feat: { crest: false, ears: false, horns: false, spikes: false, tail: false, wings: false, bigEyes: false }, colors: { accent: '#c94c4c', dark: '#3a2a20', eye: '#222222', body: '#6a2a4a', belly: '#e8c39e' }, size: 1, gen: 0, names: ['person'] }, m = KIN.model(sp, 2); KIN.decorate(m, 'hat'); KIN.decorate(m, 'lamp');
      quill.model = m; quill.mesh = R.entityMesh('camp:keeper', (mb) => KIN.buildMesh(mb, m)); quill.scale = 1; quill.wander = false; quill.tag = 'of Quill\'s Menagerie'; quill.onTalk = quillTalk; quill.yaw = Math.atan2(s.x - x, s.z - z); Village.addLoose(quill); }
    for (const n of [maren, quill]) if (n && Math.hypot(n.x - p.x, n.z - p.z) < 7) n.yaw = Math.atan2(p.x - n.x, p.z - n.z); }
  return { init, update, get maren() { return maren; }, get quill() { return quill; } };
})();
