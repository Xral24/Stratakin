'use strict';
// Shared helpers: hashing, seeded RNG, periodic value noise, small mat4 library.
const U = (() => {
  function hash3(x, y, z, seed) {
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1) ^ Math.imul(seed | 0, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  function hashInt(h) {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function strHash(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function combine(...nums) {
    let h = 0x811c9dc5;
    for (const n of nums) { h = Math.imul(h ^ (n | 0), 0x01000193); h ^= h >>> 13; }
    return hashInt(h);
  }
  function rng(seed) {
    let s = seed >>> 0;
    const f = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = (n) => Math.floor(f() * n);
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.range = (a, b) => a + f() * (b - a);
    f.chance = (p) => f() < p;
    return f;
  }
  const mod = (a, n) => ((a % n) + n) % n;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  const smooth = (t) => t * t * (3 - 2 * t);

  // 2D value noise, periodic in x/z with the given period (period/scale should be an integer for a seamless wrap).
  function vnoise2(x, z, scale, period, seed) {
    const n = Math.max(1, Math.round(period / scale));
    const fx = x / scale, fz = z / scale;
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const sx = smooth(fx - ix), sz = smooth(fz - iz);
    const i0 = mod(ix, n), i1 = mod(ix + 1, n), k0 = mod(iz, n), k1 = mod(iz + 1, n);
    const a = hash3(i0, 17, k0, seed), b = hash3(i1, 17, k0, seed), c = hash3(i0, 17, k1, seed), d = hash3(i1, 17, k1, seed);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sz);
  }
  function fbm2(x, z, scale, oct, seed, period) {
    let amp = 1, sum = 0, norm = 0, s = scale;
    for (let i = 0; i < oct; i++) {
      sum += amp * vnoise2(x, z, s, period, seed + i * 101);
      norm += amp; amp *= 0.5; s /= 2;
      if (s < 2) break;
    }
    return sum / norm;
  }
  function vnoise3(x, y, z, scale, period, seed) {
    const n = Math.max(1, Math.round(period / scale));
    const fx = x / scale, fy = y / scale, fz = z / scale;
    const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
    const sx = smooth(fx - ix), sy = smooth(fy - iy), sz = smooth(fz - iz);
    const i0 = mod(ix, n), i1 = mod(ix + 1, n), k0 = mod(iz, n), k1 = mod(iz + 1, n);
    const c000 = hash3(i0, iy, k0, seed), c100 = hash3(i1, iy, k0, seed), c010 = hash3(i0, iy + 1, k0, seed), c110 = hash3(i1, iy + 1, k0, seed);
    const c001 = hash3(i0, iy, k1, seed), c101 = hash3(i1, iy, k1, seed), c011 = hash3(i0, iy + 1, k1, seed), c111 = hash3(i1, iy + 1, k1, seed);
    const x00 = lerp(c000, c100, sx), x10 = lerp(c010, c110, sx), x01 = lerp(c001, c101, sx), x11 = lerp(c011, c111, sx);
    return lerp(lerp(x00, x10, sy), lerp(x01, x11, sy), sz);
  }

  // ---- mat4 (column major) ----
  function m4identity() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
  function m4perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
    return m;
  }
  function m4view(px, py, pz, yaw, pitch) {
    // camera looks along forward = (sin(yaw)cos(pitch), sin(pitch), cos(yaw)cos(pitch))... we use -Z forward convention below
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // forward
    const fx = -sy * cp, fy = sp, fz = -cy * cp;
    // right = normalize(cross(forward, worldUp))
    let rx = fz, ry = 0, rz = -fx; // cross((fx,fy,fz),(0,1,0)) = (fz, 0, -fx)... careful sign
    // cross(f, up) = (fy*0 - fz*1, fz*0 - fx*0, fx*1 - fy*0) = (-fz, 0, fx)
    rx = -fz; rz = fx;
    const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
    // up = cross(right, forward)
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    const m = new Float32Array(16);
    m[0] = rx; m[4] = ry; m[8] = rz;
    m[1] = ux; m[5] = uy; m[9] = uz;
    m[2] = -fx; m[6] = -fy; m[10] = -fz;
    m[12] = -(rx * px + ry * py + rz * pz);
    m[13] = -(ux * px + uy * py + uz * pz);
    m[14] = (fx * px + fy * py + fz * pz);
    m[15] = 1;
    return m;
  }
  function m4mul(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
    }
    return o;
  }
  function m4model(x, y, z, yaw, s) {
    const c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s;
    const m = new Float32Array(16);
    m[0] = c; m[2] = -sn; m[5] = s; m[8] = sn; m[10] = c; m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
    return m;
  }
  function frustumPlanes(pv) {
    // returns 6 planes [a,b,c,d] from combined matrix
    const p = [];
    const row = (i) => [pv[i], pv[4 + i], pv[8 + i], pv[12 + i]];
    const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
    const add = (a, b, sgn) => { const pl = [r3[0] + sgn * a[0], r3[1] + sgn * a[1], r3[2] + sgn * a[2], r3[3] + sgn * a[3]]; const l = Math.hypot(pl[0], pl[1], pl[2]) || 1; p.push([pl[0] / l, pl[1] / l, pl[2] / l, pl[3] / l]); };
    add(r0, null, 1); add(r0, null, -1); add(r1, null, 1); add(r1, null, -1); add(r2, null, 1); add(r2, null, -1);
    return p;
  }
  function sphereInFrustum(planes, x, y, z, r) {
    for (let i = 0; i < 6; i++) { const p = planes[i]; if (p[0] * x + p[1] * y + p[2] * z + p[3] < -r) return false; }
    return true;
  }
  function forwardVec(yaw, pitch) {
    const cp = Math.cos(pitch);
    return [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
  }
  function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]; }
  function rgbToHex(c) { const f = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0'); return '#' + f(c[0]) + f(c[1]) + f(c[2]); }
  function mixColor(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

  return { hash3, hashInt, strHash, combine, rng, mod, lerp, clamp, smooth, vnoise2, fbm2, vnoise3,
    m4identity, m4perspective, m4view, m4mul, m4model, frustumPlanes, sphereInFrustum, forwardVec, hexToRgb, rgbToHex, mixColor };
})();
