const fs = require('fs'), vm = require('vm');
const ctx = { console, Math, Date, performance: { now: () => 0 }, window: {}, document: { createElement: () => ({ getContext: () => null }) } };
vm.createContext(ctx);
vm.runInContext("const ELEMENTS = ['Flame', 'Tide', 'Bloom', 'Stone', 'Gale', 'Frost', 'Spark', 'Void', 'Light'];", ctx);
for (const f of ['util.js', 'kin.js']) vm.runInContext(fs.readFileSync('/home/claude/strata/js/' + f, 'utf8'), ctx, { filename: f });
const run = (code) => vm.runInContext(code, ctx);
module.exports = run;
if (require.main === module) console.log(run(process.argv[2] || 'KIN.dex("earth").length'));
