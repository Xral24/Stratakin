'use strict';
// Several saved games side by side: an index in localStorage and one entry per game. Starting a new world never touches another game.
const Saves = (() => {
  const INDEX = 'stratakin-games', LEGACY = 'strata-save-v1';
  function read() { try { const a = JSON.parse(localStorage.getItem(INDEX)); return Array.isArray(a) ? a : null; } catch (e) { return null; } }
  function write(list) { try { localStorage.setItem(INDEX, JSON.stringify(list)); } catch (e) {} }
  const levelFor = (xp) => Math.floor(Math.sqrt((xp || 0) / 40)) + 1;
  function summary(entry, d) {
    entry.seed = d.seed; entry.worldId = d.worldId || 'earth'; entry.level = levelFor(d.xp); entry.kin = (d.kin || []).length; entry.shards = d.shards || 0;
    entry.villages = Object.keys(d.villageState || {}).filter(k => d.villageState[k] && d.villageState[k].freed).length; entry.days = d.dayCount || 0; entry.t = Date.now();
    const lv = d.lastVillage && d.lastVillage.name; if (lv) entry.place = lv;
    return entry;
  }
  function list() {
    let l = read() || [];
    // the single old save (from before the games list) is adopted as Game 1 whenever it is there and not yet listed
    if (!l.some(x => x.key === LEGACY)) {
      try { const raw = localStorage.getItem(LEGACY); if (raw) { const d = JSON.parse(raw); if (d && d.seed) { l.push(summary({ id: 'v1', key: LEGACY, name: 'Game 1', created: Date.now() }, d)); write(l); } } } catch (e) {}
    }
    if (!read()) write(l);
    return l.slice().sort((a, b) => (b.t || 0) - (a.t || 0));
  }
  function get(id) { return list().find(x => x.id === id) || null; }
  function create(name) {
    const l = list(); const id = 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    const e = { id, key: 'strata-save-' + id, name: (name || '').trim().slice(0, 24) || ('Game ' + (l.length + 1)), created: Date.now(), t: Date.now() };
    l.push(e); write(l); return e;
  }
  function touch(id, data) { const l = list(); const e = l.find(x => x.id === id); if (!e) return; summary(e, data); write(l); }
  function rename(id, name) { const l = list(); const e = l.find(x => x.id === id); if (!e) return; e.name = (name || '').trim().slice(0, 24) || e.name; write(l); }
  function remove(id) { const l = list(); const e = l.find(x => x.id === id); if (!e) return; try { localStorage.removeItem(e.key); } catch (err) {} write(l.filter(x => x.id !== id)); }
  function when(t) { if (!t) return ''; const d = new Date(t); const now = new Date(); const sameDay = d.toDateString() === now.toDateString(); return sameDay ? 'today ' + d.toTimeString().slice(0, 5) : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toTimeString().slice(0, 5); }
  return { list, get, create, touch, rename, remove, when, LEGACY };
})();
