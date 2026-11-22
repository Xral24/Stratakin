// Walk pacing without a browser: an entity wanders / patrols at 60 frames a second on a fake clock, dressed and posed by js/glb.js as the game does.
const fs = require('fs'), vm = require('vm');
let NOW = 0;
const ctx = { console, Math, Date, performance: { now: () => NOW }, window: {}, TextDecoder, Float32Array, Uint8Array, Uint32Array, Uint16Array, Int16Array, Int8Array, DataView, Map, Set, Blob: function () {}, fetch: () => Promise.reject(new Error('no fetch')), URL: { createObjectURL: () => '' }, createImageBitmap: () => Promise.reject(new Error('x')), setTimeout };
vm.createContext(ctx);
vm.runInContext("var R = { glbUpload: (d) => ({ count: d.IX.length }) }; var G = { mobile: true };", ctx);
vm.runInContext(fs.readFileSync('/home/claude/strata/js/glb.js', 'utf8') + '\nthis.GLBX = GLB;', ctx);
const GLB = ctx.GLBX;
for (const n of ['hask', 'stonewall']) { const b = fs.readFileSync('/home/claude/strata/assets/' + n + '.glb'); const c = GLB.CAST[n]; GLB.fromBuffer(n, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), { height: c.height, still: c.still }); }
function run(label, e, stepFn, secs) {
  const rows = []; const fps = 60, dt = 1 / fps; let last = null;
  for (let f = 0; f < secs * fps; f++) { NOW += 1000 / fps; stepFn(e, dt, f * dt); const proxy = e.proxy ? { x: e.x, y: e.y, z: e.z, yaw: e.yaw, scale: e.scale, src: e } : e; const ents = [proxy]; GLB.dressAll(ents); if (ents.length) GLB.pose(proxy, NOW);
    const st = e._glb; if (st && f % 15 === 0) { if (last) rows.push({ t: +(f * dt).toFixed(2), v: +(Math.hypot(e.x - last.x, e.z - last.z) / (f * dt - last.t)).toFixed(2), sv: +(st.v || 0).toFixed(2), mv: +(st.mv || 0).toFixed(2), rate: +(((st.wt || 0) - last.wt) / (f * dt - last.t)).toFixed(2), yaw: +(e.yaw * 57.3).toFixed(0), ry: st.ry != null ? +(st.ry * 57.3).toFixed(0) : null, py: +(proxy.yaw * 57.3).toFixed(0) }); last = { x: e.x, z: e.z, t: f * dt, wt: st.wt || 0 }; } else if (st && !last) last = { x: e.x, z: e.z, t: f * dt, wt: st.wt || 0 }; }
  const md = GLB.get(e._glb.name); console.log('==', label, 'v0', md.v0.toFixed(3), 'speed', (e.speed || 0).toFixed(3), 'patrol period', e.patrol ? e.patrol.period.toFixed(2) : '-');
  for (const r of rows) console.log(JSON.stringify(r));
}
// Hask wandering like a village NPC: pick a target, walk to it at his speed, wait 3-9 s
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hask = { name: 'Elder Hask', x: 0, y: 0, z: 0, yaw: 0, scale: 1, wander: true, wait: 0, proxy: true };
run('hask wander', hask, (n, dt) => { n.wait -= dt; if (n.wait <= 0) { n.wait = 3 + rnd() * 6; const a = rnd() * 6.28, r = 2 + rnd() * 5; n.tx = Math.cos(a) * r; n.tz = Math.sin(a) * r; n.moving = true; }
  if (n.moving) { const mdx = n.tx - n.x, mdz = n.tz - n.z, md = Math.hypot(mdx, mdz); if (md < 0.3) n.moving = false; else { const step = Math.min(md, (n.speed || 1.3) * dt); n.x += mdx / md * step; n.z += mdz / md * step; n.yaw = Math.atan2(mdx, mdz); } } }, 14);
// Stonewall on a tyrant's patrol: ping-pong between two points, period stretched by dressAll to his pace
const sw = { name: 'Stonewall', glbName: 'Stonewall', isBoss: true, x: -4, y: 0, z: 0, yaw: 0, scale: 1, patrol: { ax: -4, az: 0, bx: 4, bz: 0, period: 7, phase: 0 } };
let T = 0; run('stonewall patrol', sw, (e, dt) => { T += dt; const time = T; const p = e.patrol, half = p.period / 2, rest = p.rest || 0, cyc = p.period + 2 * rest, u = (((time + p.phase * cyc) % cyc) + cyc) % cyc;
  const s = u < half ? u / half : u < half + rest ? 1 : u < 2 * half + rest ? 1 - (u - half - rest) / half : 0, out = u < half || u >= 2 * half + rest;
  const nx = p.ax + (p.bx - p.ax) * s, nz = p.az + (p.bz - p.az) * s; const fw = out ? 1 : -1; e.yaw = Math.atan2((p.bx - p.ax) * fw, (p.bz - p.az) * fw); e.x = nx; e.z = nz; }, 40);
