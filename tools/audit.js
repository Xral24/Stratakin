// what can the player actually get? Every item named anywhere, against every way of getting one.
const fs = require('fs'), dir = '/home/claude/strata/js/'; const src = {}; for (const f of fs.readdirSync(dir)) src[f] = fs.readFileSync(dir + f, 'utf8'); const all = Object.values(src).join('\n');
const P = src['player.js']; const items = new Set(); const im = P.slice(P.indexOf('const ITEMS'), P.indexOf('const HOTBAR_ORDER') > 0 ? P.indexOf('const HOTBAR_ORDER') : P.length); for (const m of im.matchAll(/^\s{2}([a-zA-Z_0-9]+): \{ name:/gm)) items.add(m[1]);
const got = {}; const add = (k, how) => { (got[k] = got[k] || new Set()).add(how); };
for (const [f, s] of Object.entries(src)) { for (const m of s.matchAll(/\.add\('([a-zA-Z_0-9]+)'/g)) add(m[1], 'given in ' + f); for (const m of s.matchAll(/item: '([a-zA-Z_0-9]+)', price/g)) add(m[1], 'sold in ' + f); for (const m of s.matchAll(/items: \{([^}]*)\}/g)) for (const k of m[1].matchAll(/([a-zA-Z_0-9]+):/g)) add(k[1], 'reward in ' + f); for (const m of s.matchAll(/drop: '([a-zA-Z_0-9]+)'/g)) add(m[1], 'block drop'); for (const m of s.matchAll(/\[['"]([a-zA-Z_0-9]+)['"], \d+\]/g)) if (items.has(m[1])) add(m[1], 'listed in ' + f); }
const Q = src['quests.js']; const recipes = []; for (const m of Q.matchAll(/\{ id: '([a-zA-Z_0-9]+)', out: '([a-zA-Z_0-9]+)', n: \d+, needs: \{([^}]*)\}/g)) { const needs = [...m[3].matchAll(/([a-zA-Z_0-9]+):/g)].map(x => x[1]); recipes.push({ id: m[1], out: m[2], needs }); }
// essences and lures and stones are generated: treat ess_* as dropped by battles if the code adds them by template
const tmpl = /add\('ess_' \+|add\(`ess_\$|'ess_' \+ /.test(all); const has = (k) => !!got[k] || (k.startsWith('ess_') && tmpl);
let changed = true; const craft = new Set(); while (changed) { changed = false; for (const r of recipes) if (!craft.has(r.id) && r.needs.every(n => has(n) || [...craft].some(c => recipes.find(x => x.id === c).out === n))) { craft.add(r.id); add(r.out, 'crafted'); changed = true; } }
const out = []; for (const r of recipes) if (!craft.has(r.id)) out.push('RECIPE cannot be made: ' + r.id + ' needs ' + r.needs.filter(n => !has(n)).join(', '));
const used = new Set(); for (const s of Object.values(src)) for (const m of s.matchAll(/\.has\('([a-zA-Z_0-9]+)'\)/g)) used.add(m[1]);
for (const k of used) if (!has(k)) out.push('CHECKED but never obtainable: ' + k);
for (const k of items) if (!has(k)) out.push('ITEM defined but no way to get it: ' + k);
for (const m of Q.matchAll(/NEEDS_ITEM = \{([^}]*)\}/g)) for (const k of m[1].matchAll(/\['([a-zA-Z_0-9]+)'/g)) if (!has(k[1])) out.push('QUEST gate needs unobtainable: ' + k[1]);
console.log('items ' + items.size + ', recipes ' + recipes.length + ', craftable ' + craft.size); console.log(out.join('\n') || 'nothing unobtainable');
if (process.argv[2]) for (const k of process.argv.slice(2)) console.log(k + ': ' + [...(got[k] || [])].join('; '));
