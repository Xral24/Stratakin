'use strict';
// Story films: a short painted video over the whole screen, with the story's lines under it, and a Skip. Made on Higgsfield (assets/film_<id>.mp4).
// A film is a nicety and never a gate: if the file is slow, missing, or the page will not play it, it is simply not shown and the game carries on.
const Film = (() => {
  const FILMS = {
    intro: { file: 'assets/film_intro.mp4', track: 'night', lines: [[0.4, 'Once, a crystal called the Concord let people and Kin understand each other.'], [4.2, 'Then its keeper bent it, so that it no longer asked. It only told.'], [7.6, 'Now every village has its tyrant. Yours is where it starts.']] },
    free: { file: 'assets/film_free.mp4', track: 'village', lines: [[0.4, 'The banner comes down.'], [4.2, 'Doors open. The Kin come back into the square.'], [7.0, 'One village free. There are more.']] },
    kinmaster: { file: 'assets/film_kinmaster.mp4', track: 'night', lines: [[0.4, 'He was a keeper once. It was a job, like baker or teacher.'], [4.2, 'Then the sea took his daughter, and her Kin came home alone.'], [7.0, 'So he made the crystal stop asking.']] },
  };
  // once(id): a film that belongs to one moment of the story is shown the first time that moment comes, and remembered in the save
  function once(id, done) { try { const st = G.stats || (G.stats = {}); st.films = st.films || {}; if (st.films[id]) { if (done) done(false); return false; } st.films[id] = 1; } catch (e) { /* no save yet */ } play(id, done); return true; }
  let box = null, cur = null;
  function close(done) { const c = cur; cur = null; if (!c) return; clearTimeout(c.guard); try { c.v.pause(); } catch (e) { /* not started */ } if (c.url) URL.revokeObjectURL(c.url);
    if (box) { box.classList.remove('on'); setTimeout(() => { if (!cur && box) box.style.display = 'none'; }, 700); } document.body.classList.remove('film-on'); if (c.done) c.done(done); }
  function play(id, done) { const F = FILMS[id]; if (!F || cur || typeof document === 'undefined') { if (done) done(false); return; }
    if (!box) { box = document.createElement('div'); box.id = 'film'; box.innerHTML = '<video playsinline muted preload="auto"></video><div class="film-line"></div><button class="film-skip">Skip</button>'; document.body.appendChild(box); box.querySelector('.film-skip').addEventListener('click', () => close(false)); }
    const v = box.querySelector('video'), line = box.querySelector('.film-line'); line.textContent = ''; line.classList.remove('on');
    const c = cur = { v, done, url: null, shown: -1, guard: setTimeout(() => { if (cur === c && !c.started) close(false); }, 9000) }; /* nine seconds to arrive, or do without */
    const url = (window.STRATAKIN_ASSETS && window.STRATAKIN_ASSETS[F.file]) || F.file;
    fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(ab => { if (cur !== c) return; c.url = URL.createObjectURL(new Blob([ab], { type: 'video/mp4' })); v.src = c.url;
      v.onerror = () => { if (cur === c) close(false); };
      v.ontimeupdate = () => { if (cur !== c) return; let k = -1; for (let i = 0; i < F.lines.length; i++) if (v.currentTime >= F.lines[i][0]) k = i; if (k !== c.shown) { c.shown = k; line.classList.remove('on'); setTimeout(() => { if (cur === c && k >= 0) { line.textContent = F.lines[k][1]; line.classList.add('on'); } }, 220); } };
      v.onended = () => { setTimeout(() => { if (cur === c) close(true); }, 900); };
      const pr = v.play(); const go = () => { if (cur !== c) return; c.started = true; box.style.display = 'block'; requestAnimationFrame(() => box.classList.add('on')); document.body.classList.add('film-on'); if (F.track && typeof Music !== 'undefined' && UI.soundOn !== false) Music.update(null, F.track); };
      if (pr && pr.then) pr.then(go).catch(() => { if (cur === c) close(false); }); else go();
    }).catch(() => { if (cur === c) close(false); }); }
  return { play, once, skip: () => close(false), get playing() { return !!(cur && cur.started); }, FILMS };
})();
