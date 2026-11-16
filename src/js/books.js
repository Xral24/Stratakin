// ---- books you can take off a shelf and read. A shelf belongs to a place: the Shell School in Atlantis keeps the books the children learn the city's
// history from. You pick one, turn its pages, put it back. What you have read is remembered, and some people care that you have ----
const Books = (() => {
  const SETS = {
    atlantis: { shelf: 'The school shelf', note: 'Six books with soft corners. Somebody has drawn a seahorse inside the cover of every one.', books: [
      { id: 'under', title: 'The City That Went Under', by: 'for the first class', col: '#2f8fb0', pages: [
        'Once our city stood on an island. The sea was all round it and the sky was over it.',
        'The people of the island made friends with the Kin of the water. They rode seahorses the way land people ride ponies.',
        'One night the ground shook. The island broke like a biscuit and the sea came in through every door.',
        'The people held on to their seahorses, and the seahorses knew the way down.',
        'At the bottom of the sea the grown-ups built a roof of glass, in a place nobody up above knew about.',
        'The sea still comes in at the top. We call it the Falls. It is there so we remember which way is up.'] },
      { id: 'skerry', title: 'Skerry Comes Home', by: 'a true story', col: '#d9892b', pages: [
        'Skerry was the fastest seahorse in the old city. A girl called Isla rode her every day after school.',
        'On the night the ground shook, Isla and Skerry were far out over the deep water.',
        'In the morning Skerry came home. Isla did not.',
        'Skerry waited by the gate every day for a year. Then she let the other children ride her, one at a time.',
        'The fastest seahorse in the ring has been called Skerry ever since.',
        'If you ride her, hold on. That is what Isla would have told you.'] },
      { id: 'three', title: 'One, Two, Three Old Ones', by: 'a counting book', col: '#6a5acd', pages: [
        'ONE sleeps under the land. Its name is the Mantlewyrm. When it turns over in its sleep, the ground shakes.',
        'TWO swims round the Moon. Its name is the Selenaut. It pulls the tide up and lets it down again.',
        'THREE walks the Ring in the sky. Its name is the Ringwarden. It keeps the pieces from falling on us.',
        'One, two, three. Count them on your fingers.',
        'Nobody made them. Nobody owns them. They were here before the first fish.',
        'If you ever meet one, be polite and do not wake it.'] },
      { id: 'keeper', title: 'The Keeper of the Table', by: 'for the top class', col: '#8a3d3d', pages: [
        'Long ago the city had a Kinmaster. It was a job, like baker or teacher.',
        'The Kinmaster kept the Fusing Hall. Every Fusion Table in the world was made by his hands, and that is still true.',
        'He had a crystal called the Concord. With it a person and a Kin could understand each other.',
        'Then a very sad thing happened to him. He changed the crystal so that it did not ask any more. It only told.',
        'The city sent him away. He has never seen the roof you are sitting under.',
        'That is why the Fusing Hall has a keeper now and not a master. And it is why we ask a Kin before we ride it.'] },
      { id: 'abc', title: 'A Is for Air', by: 'letters for the little ones', col: '#3aa76d', pages: [
        'A is for AIR. The kelp gardens make ours. Say thank you when you walk past.',
        'C is for CURRENT. It is our train. You sit still and the sea does the walking.',
        'F is for FALLS. Do not swim up them without telling a grown-up.',
        'G is for GLASS. Do not lick it. Everybody tries once.',
        'P is for PEARL. A pearl takes ten years. Be patient with it and with your sister.',
        'S is for SPEAKER. She speaks for the city. She also knows when you have not done your reading.'] },
      { id: 'trident', title: 'The Trident and the Three Pieces', by: 'an old story', col: '#c9a227', pages: [
        'Poseidon\'s Trident is not in the Archive. Nobody has made it yet.',
        'The story says it needs one piece from each world. A tooth out of the deep. Stone from the Moon. A shard of the Ring.',
        'Brann at the Tideforge knows how to put them together. In all these years nobody has come in with all three.',
        'The story also says what it is for. It can cut a Binding, the way a knife cuts a rope.',
        'A Kin that has been told can be asked again. So can a person.',
        'Maybe you will be the one who brings the three pieces. Until then, eat your kelp.'] },
    ] },
  };
  let box = null;
  const read = (set) => { const b = G.stats.books || (G.stats.books = {}); return b[set] || (b[set] = {}); };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function close() { if (box) { box.remove(); box = null; if (G.setPaused) G.setPaused(false); } }
  function open(set) {
    const S = SETS[set]; if (!S) return false; close(); box = document.createElement('div'); box.id = 'bookbox'; document.body.appendChild(box); if (G.setPaused) G.setPaused(true); shelf(set); return true; }
  function shelf(set) { const S = SETS[set], rd = read(set), n = S.books.filter(b => rd[b.id]).length;
    box.innerHTML = `<div class="bk-card"><div class="bk-head"><b>${esc(S.shelf)}</b><span>${n} of ${S.books.length} read</span></div><p class="bk-note">${esc(S.note)}</p><div class="bk-shelf">${S.books.map((b, i) => `<button class="bk-cover${rd[b.id] ? ' done' : ''}" data-i="${i}" style="--c:${b.col}"><i>${esc(b.title)}</i><small>${esc(b.by)}</small></button>`).join('')}</div><div class="bk-foot"><button class="btn ghost" data-x="1">Leave the shelf</button></div></div>`;
    box.querySelectorAll('.bk-cover').forEach(c => c.addEventListener('click', () => page(set, +c.dataset.i, 0))); box.querySelector('[data-x]').addEventListener('click', close); }
  function page(set, i, k) { const S = SETS[set], b = S.books[i], last = k === b.pages.length - 1;
    if (last) { const rd = read(set), was = rd[b.id]; rd[b.id] = true; if (!was) { UI.sfx && UI.sfx('place'); if (S.books.every(q => rd[q.id]) && Books.onAll) Books.onAll(set); } }
    box.innerHTML = `<div class="bk-card bk-open" style="--c:${b.col}"><div class="bk-head"><b>${esc(b.title)}</b><span>page ${k + 1} of ${b.pages.length}</span></div><div class="bk-page"><p>${esc(b.pages[k])}</p></div><div class="bk-foot"><button class="btn ghost" data-p="-1"${k === 0 ? ' disabled' : ''}>Back a page</button><button class="btn" data-p="1">${last ? 'Close the book' : 'Turn the page'}</button></div><button class="bk-back" data-s="1">Put it back on the shelf</button></div>`;
    box.querySelector('[data-p="-1"]').addEventListener('click', () => page(set, i, Math.max(0, k - 1)));
    box.querySelector('[data-p="1"]').addEventListener('click', () => last ? shelf(set) : page(set, i, k + 1)); box.querySelector('[data-s]').addEventListener('click', () => shelf(set)); }
  return { SETS, open, close, count: (set) => { const rd = (G.stats.books || {})[set] || {}; return SETS[set] ? SETS[set].books.filter(b => rd[b.id]).length : 0; }, total: (set) => SETS[set] ? SETS[set].books.length : 0, onAll: null, get isOpen() { return !!box; } };
})();
