'use strict';
// Geometry for everything that moves: round bodies, tubes along a path, fins and plates, all with smooth normals and a bone
// index per vertex, built on the MeshBuilder from render.js. Anim turns an entity's movement into a pose for those bones.
(() => {
  const P = MeshBuilder.prototype;
  const col3 = (c) => typeof c === 'string' ? U.hexToRgb(c) : c;
  const lerp = (a, b, t) => a + (b - a) * t;
  // a triangle wound so its front faces outward (the outline pass culls front faces, so winding must be right)
  P.triOut = function (a, b, c) {
    if (!this.nrm) { this.tri(a, b, c); return; }
    const p = this.pos, n = this.nrm;
    const ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
    const ux = p[b * 3] - ax, uy = p[b * 3 + 1] - ay, uz = p[b * 3 + 2] - az, vx = p[c * 3] - ax, vy = p[c * 3 + 1] - ay, vz = p[c * 3 + 2] - az;
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const nx = n[a * 3] + n[b * 3] + n[c * 3], ny = n[a * 3 + 1] + n[b * 3 + 1] + n[c * 3 + 1], nz = n[a * 3 + 2] + n[b * 3 + 2] + n[c * 3 + 2];
    if (cx * nx + cy * ny + cz * nz >= 0) this.tri(a, b, c); else this.tri(a, c, b);
  };
  // the six faces of the unit cube: normal axis and the two axes that span the face
  const FACES6 = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] }, { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] }, { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
  ];
  // blob: the box x0..x1, y0..y1, z0..z1 rounded toward the ellipsoid that fits it. round 0 is the box, 1 the ellipsoid.
  // opts: n (grid per face edge), tap [bottom, top] scale of the x/z section along the height (eggs, pears), under (a second
  // colour for the underside, blended by the surface normal), split/soft (where and how wide that blend is), sky, emis, squash
  P.blob = function (x0, y0, z0, x1, y1, z1, round, color, opts = {}) {
    const c = col3(color), under = opts.under ? col3(opts.under) : null; const sky = opts.sky == null ? 1 : opts.sky; const emis = !!opts.emis;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, hx = Math.max(1e-4, (x1 - x0) / 2), hy = Math.max(1e-4, (y1 - y0) / 2), hz = Math.max(1e-4, (z1 - z0) / 2);
    const size = Math.max(hx, hy, hz); const smooth = round > 0.01;
    const n = opts.n || (!smooth ? 1 : size >= 0.28 ? 6 : size >= 0.11 ? 4 : 3);
    const tap = opts.tap || null; const split = opts.split == null ? -0.12 : opts.split, soft = opts.soft == null ? 0.3 : opts.soft;
    const bulge = opts.bulge || 0; // >0 pushes the middle of the height outward (a chest), <0 pinches it (a waist)
    const surf = (F, u, v, out) => {
      let px = F.n[0] + F.u[0] * u + F.v[0] * v, py = F.n[1] + F.u[1] * u + F.v[1] * v, pz = F.n[2] + F.u[2] * u + F.v[2] * v;
      if (smooth) { const l = Math.hypot(px, py, pz) || 1; px = lerp(px, px / l, round); py = lerp(py, py / l, round); pz = lerp(pz, pz / l, round); }
      let X = px * hx, Y = py * hy, Z = pz * hz;
      const t01 = (py + 1) / 2; let k = tap ? lerp(tap[0], tap[1], t01) : 1; if (bulge) k *= 1 + bulge * Math.sin(t01 * Math.PI);
      X *= k; Z *= k;
      out[0] = cx + X; out[1] = cy + Y; out[2] = cz + Z; return out;
    };
    const a = [0, 0, 0], b = [0, 0, 0], d = [0, 0, 0]; const eps = 1e-3;
    for (let f = 0; f < 6; f++) {
      const F = FACES6[f]; const idx = new Int32Array((n + 1) * (n + 1));
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
        const u = i / n * 2 - 1, v = j / n * 2 - 1;
        surf(F, u, v, a); surf(F, Math.min(1, u + eps), v, b); surf(F, u, Math.min(1, v + eps), d);
        if (u + eps > 1) { surf(F, u - eps, v, b); b[0] = 2 * a[0] - b[0]; b[1] = 2 * a[1] - b[1]; b[2] = 2 * a[2] - b[2]; }
        if (v + eps > 1) { surf(F, u, v - eps, d); d[0] = 2 * a[0] - d[0]; d[1] = 2 * a[1] - d[1]; d[2] = 2 * a[2] - d[2]; }
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; let l = Math.hypot(nx, ny, nz);
        if (l < 1e-9) { nx = F.n[0]; ny = F.n[1]; nz = F.n[2]; l = 1; }
        nx /= l; ny /= l; nz /= l;
        const ox = a[0] - cx, oy = a[1] - cy, oz = a[2] - cz; if (nx * ox + ny * oy + nz * oz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        if (!smooth) { nx = F.n[0]; ny = F.n[1]; nz = F.n[2]; }
        let cc = c;
        if (under) { const k = U.clamp((split - ny) / soft + 0.5, 0, 1); cc = [lerp(c[0], under[0], k), lerp(c[1], under[1], k), lerp(c[2], under[2], k)]; }
        if (opts.shade) { const k = opts.shade(a, nx, ny, nz); if (k) cc = k; }
        idx[i * (n + 1) + j] = this.vert(a[0], a[1], a[2], nx, ny, nz, cc[0], cc[1], cc[2], sky, emis);
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = idx[i * (n + 1) + j], r = idx[(i + 1) * (n + 1) + j], s = idx[(i + 1) * (n + 1) + j + 1], t = idx[i * (n + 1) + j + 1]; this.triOut(q, r, s); this.triOut(q, s, t); }
    }
  };
  // tube: a surface of rings along a path. path: [[x,y,z],...]; radii: one number per point, or [rx, ry] for an oval section.
  // opts: segs (around), cap0/cap1 ('round' | 'flat' | 'none'; a radius under 0.012 pinches to a point), sky, emis, boneAt(i), shade
  P.tube = function (path, radii, color, opts = {}) {
    const c = col3(color); const sky = opts.sky == null ? 1 : opts.sky; const emis = !!opts.emis; const segs = opts.segs || 8;
    let pts = path.map(p => p.slice()); let rad = radii.map(r => Array.isArray(r) ? r.slice() : [r, r]);
    const tangent = (i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(t[0], t[1], t[2]) || 1; return [t[0] / l, t[1] / l, t[2] / l]; };
    // round caps: extra rings curling in toward the end point
    const capRings = (end) => {
      const i = end ? pts.length - 1 : 0; const r = rad[i]; if (Math.max(r[0], r[1]) < 0.012) return;
      const t = tangent(i); const s = end ? 1 : -1; const extra = [], er = [];
      for (const th of [0.42, 0.82, 1.18, 1.45]) { const k = Math.cos(th), m = Math.sin(th) * 0.92; extra.push([pts[i][0] + t[0] * s * r[0] * m, pts[i][1] + t[1] * s * r[1] * m, pts[i][2] + t[2] * s * Math.max(r[0], r[1]) * m]); er.push([r[0] * k, r[1] * k]); }
      extra.push([pts[i][0] + t[0] * s * r[0] * 0.98, pts[i][1] + t[1] * s * r[1] * 0.98, pts[i][2] + t[2] * s * Math.max(r[0], r[1]) * 0.98]); er.push([0.001, 0.001]);
      if (end) { pts = pts.concat(extra); rad = rad.concat(er); } else { pts = extra.reverse().concat(pts); rad = er.reverse().concat(rad); }
    };
    const cap0 = opts.cap0 || 'flat', cap1 = opts.cap1 || 'flat';
    if (cap1 === 'round') capRings(true); if (cap0 === 'round') capRings(false);
    const N = pts.length; const grid = []; const ctr = [];
    // a frame that turns smoothly along the path
    let prevN = null;
    for (let i = 0; i < N; i++) {
      const t = tangent(i); let nrm;
      if (!prevN) { const up = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; nrm = [up[1] * t[2] - up[2] * t[1], up[2] * t[0] - up[0] * t[2], up[0] * t[1] - up[1] * t[0]]; }
      else { const d = prevN[0] * t[0] + prevN[1] * t[1] + prevN[2] * t[2]; nrm = [prevN[0] - t[0] * d, prevN[1] - t[1] * d, prevN[2] - t[2] * d]; }
      let l = Math.hypot(nrm[0], nrm[1], nrm[2]); if (l < 1e-6) { nrm = [1, 0, 0]; l = 1; } nrm = [nrm[0] / l, nrm[1] / l, nrm[2] / l]; prevN = nrm;
      const bn = [t[1] * nrm[2] - t[2] * nrm[1], t[2] * nrm[0] - t[0] * nrm[2], t[0] * nrm[1] - t[1] * nrm[0]];
      // ry is measured along the frame's "up-ish" axis: pick whichever of nrm/bn is more vertical to carry ry
      const vert = Math.abs(nrm[1]) >= Math.abs(bn[1]) ? 0 : 1;
      const ring = []; const r = rad[i];
      for (let j = 0; j < segs; j++) { const a = j / segs * Math.PI * 2; const ca = Math.cos(a), sa = Math.sin(a); const ra = vert === 0 ? r[1] : r[0], rb = vert === 0 ? r[0] : r[1]; ring.push([pts[i][0] + nrm[0] * ca * ra + bn[0] * sa * rb, pts[i][1] + nrm[1] * ca * ra + bn[1] * sa * rb, pts[i][2] + nrm[2] * ca * ra + bn[2] * sa * rb]); }
      grid.push(ring); ctr.push(pts[i]);
    }
    const idx = []; const pin = (i) => Math.max(rad[i][0], rad[i][1]) < 0.012;
    for (let i = 0; i < N; i++) {
      if (opts.boneAt) this.setBone(opts.boneAt(Math.min(i, path.length - 1)));
      const ring = grid[i]; const row = [];
      if (pin(i)) { // a point: one vertex, normal along the path
        const t = tangent(i); const s = i === 0 ? -1 : 1; const v = this.vert(ctr[i][0], ctr[i][1], ctr[i][2], t[0] * s, t[1] * s, t[2] * s, c[0], c[1], c[2], sky, emis); for (let j = 0; j < segs; j++) row.push(v);
      } else for (let j = 0; j < segs; j++) {
        const p = ring[j]; const pj = ring[(j + 1) % segs], pk = ring[(j + segs - 1) % segs];
        const ni = Math.min(N - 1, i + 1), pi = Math.max(0, i - 1); const q1 = pin(ni) ? ctr[ni] : grid[ni][j], q0 = pin(pi) ? ctr[pi] : grid[pi][j];
        const ux = pj[0] - pk[0], uy = pj[1] - pk[1], uz = pj[2] - pk[2], vx = q1[0] - q0[0], vy = q1[1] - q0[1], vz = q1[2] - q0[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; let l = Math.hypot(nx, ny, nz);
        if (l < 1e-9) { nx = p[0] - ctr[i][0]; ny = p[1] - ctr[i][1]; nz = p[2] - ctr[i][2]; l = Math.hypot(nx, ny, nz) || 1; }
        nx /= l; ny /= l; nz /= l; const ox = p[0] - ctr[i][0], oy = p[1] - ctr[i][1], oz = p[2] - ctr[i][2]; if (nx * ox + ny * oy + nz * oz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        let cc = c; if (opts.shade) { const k = opts.shade(p, nx, ny, nz, i / (N - 1)); if (k) cc = k; }
        row.push(this.vert(p[0], p[1], p[2], nx, ny, nz, cc[0], cc[1], cc[2], sky, emis));
      }
      idx.push(row);
    }
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < segs; j++) { const a = idx[i][j], b = idx[i][(j + 1) % segs], d = idx[i + 1][(j + 1) % segs], e = idx[i + 1][j]; if (a !== b) this.triOut(a, b, d); if (d !== e) this.triOut(a, d, e); }
    // flat caps
    const flat = (i, end) => { if (pin(i)) return; const t = tangent(i); const s = end ? 1 : -1; const cv = this.vert(ctr[i][0], ctr[i][1], ctr[i][2], t[0] * s, t[1] * s, t[2] * s, c[0], c[1], c[2], sky, emis); const ring = grid[i]; const rv = ring.map(p => this.vert(p[0], p[1], p[2], t[0] * s, t[1] * s, t[2] * s, c[0], c[1], c[2], sky, emis)); for (let j = 0; j < segs; j++) this.triOut(cv, rv[j], rv[(j + 1) % segs]); };
    if (cap0 === 'flat') flat(0, false); if (cap1 === 'flat') flat(N - 1, true);
  };
  // fin: a flat polygon (points [u,v] in the plane of frame.u/frame.v, origin frame.o) with thickness, flat-shaded
  P.fin = function (pts2, frame, thick, color, opts = {}) {
    const c = col3(color), ec = opts.edge ? col3(opts.edge) : c; const sky = opts.sky == null ? 1 : opts.sky; const emis = !!opts.emis;
    const o = frame.o, u = frame.u, v = frame.v; const w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const wl = Math.hypot(w[0], w[1], w[2]) || 1; w[0] /= wl; w[1] /= wl; w[2] /= wl;
    const at = (p, s) => [o[0] + u[0] * p[0] + v[0] * p[1] + w[0] * s, o[1] + u[1] * p[0] + v[1] * p[1] + w[1] * s, o[2] + u[2] * p[0] + v[2] * p[1] + w[2] * s];
    const h = thick / 2; const n = pts2.length;
    let cu = 0, cv = 0; for (const p of pts2) { cu += p[0]; cv += p[1]; } cu /= n; cv /= n;
    for (const s of [h, -h]) {
      const sg = s > 0 ? 1 : -1; const cen = at([cu, cv], s); const ci = this.vert(cen[0], cen[1], cen[2], w[0] * sg, w[1] * sg, w[2] * sg, c[0], c[1], c[2], sky, emis);
      const ring = pts2.map(p => { const q = at(p, s); return this.vert(q[0], q[1], q[2], w[0] * sg, w[1] * sg, w[2] * sg, c[0], c[1], c[2], sky, emis); });
      for (let i = 0; i < n; i++) this.triOut(ci, ring[i], ring[(i + 1) % n]);
    }
    for (let i = 0; i < n; i++) { // the edge band
      const p0 = pts2[i], p1 = pts2[(i + 1) % n]; const du = p1[0] - p0[0], dv = p1[1] - p0[1]; const en = [u[0] * dv - v[0] * du, u[1] * dv - v[1] * du, u[2] * dv - v[2] * du]; const el = Math.hypot(en[0], en[1], en[2]) || 1;
      let nx = en[0] / el, ny = en[1] / el, nz = en[2] / el; const mid = at([(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], 0); const cen = at([cu, cv], 0); if (nx * (mid[0] - cen[0]) + ny * (mid[1] - cen[1]) + nz * (mid[2] - cen[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const a = at(p0, h), b = at(p1, h), d = at(p1, -h), e = at(p0, -h);
      const ia = this.vert(a[0], a[1], a[2], nx, ny, nz, ec[0], ec[1], ec[2], sky, emis), ib = this.vert(b[0], b[1], b[2], nx, ny, nz, ec[0], ec[1], ec[2], sky, emis), id = this.vert(d[0], d[1], d[2], nx, ny, nz, ec[0], ec[1], ec[2], sky, emis), ie = this.vert(e[0], e[1], e[2], nx, ny, nz, ec[0], ec[1], ec[2], sky, emis);
      this.triOut(ia, ib, id); this.triOut(ia, id, ie);
    }
  };
  // plate: a flat polygon given in 3D (roughly planar), thickness along its own normal
  P.plate = function (pts3, thick, color, opts) {
    let nx = 0, ny = 0, nz = 0; const n = pts3.length;
    for (let i = 0; i < n; i++) { const a = pts3[i], b = pts3[(i + 1) % n]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
    let l = Math.hypot(nx, ny, nz); if (l < 1e-9) { nx = 0; ny = 0; nz = 1; l = 1; } nx /= l; ny /= l; nz /= l;
    const ref = Math.abs(ny) < 0.9 ? [0, 1, 0] : [1, 0, 0]; let u = [ref[1] * nz - ref[2] * ny, ref[2] * nx - ref[0] * nz, ref[0] * ny - ref[1] * nx]; const ul = Math.hypot(u[0], u[1], u[2]) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];
    const v = [ny * u[2] - nz * u[1], nz * u[0] - nx * u[2], nx * u[1] - ny * u[0]];
    const o = pts3[0]; const pts2 = pts3.map(p => { const dx = p[0] - o[0], dy = p[1] - o[1], dz = p[2] - o[2]; return [dx * u[0] + dy * u[1] + dz * u[2], dx * v[0] + dy * v[1] + dz * v[2]]; });
    this.fin(pts2, { o, u, v }, thick, color, opts);
  };
  // a box with softened corners (round 0.1..0.4) in one call
  P.rbox = function (x0, y0, z0, x1, y1, z1, round, color, opts) { this.blob(x0, y0, z0, x1, y1, z1, round, color, Object.assign({ n: 2 }, opts || {})); };
  // a sphere / egg
  P.ball = function (x, y, z, r, color, opts) { this.blob(x - r, y - r, z - r, x + r, y + r, z + r, 1, color, opts || {}); };
  // a cone from base (x,y,z) along dir for length h, base radius r
  P.cone = function (x, y, z, dir, h, r, color, opts) { const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; const e = [x + dir[0] / l * h, y + dir[1] / l * h, z + dir[2] / l * h]; this.tube([[x, y, z], [(x + e[0]) / 2, (y + e[1]) / 2, (z + e[2]) / 2], e], [r, r * 0.55, 0.001], color, Object.assign({ cap0: 'flat', cap1: 'none' }, opts || {})); };

  // ---------- Anim: a pose for an entity's bones from how it is moving ----------
  // Bones: 0 body, 1 head, 2 left arm / front-left leg, 3 right arm / front-right leg, 4 back-left leg, 5 back-right leg,
  // 6 tail, 7 left wing, 8 right wing, 9 jaw. A model lists them as m.bones[i] = { piv: [x,y,z], kind, phase }.
  const Anim = (() => {
    const mats = new Float32Array(160), sway = new Float32Array(4);
    // bone i: rotate (rx about x, ry about y, rz about z) around piv, then move by (tx,ty,tz); optional scale sy
    function set(i, piv, rx, ry, rz, tx, ty, tz, sx, sy, sz) {
      const cx = Math.cos(rx), sxx = Math.sin(rx), cy = Math.cos(ry), syy = Math.sin(ry), cz = Math.cos(rz), szz = Math.sin(rz);
      // R = Ry * Rx * Rz (column-major)
      const r00 = cy * cz + syy * sxx * szz, r01 = cx * szz, r02 = -syy * cz + cy * sxx * szz;
      const r10 = -cy * szz + syy * sxx * cz, r11 = cx * cz, r12 = syy * szz + cy * sxx * cz;
      const r20 = syy * cx, r21 = -sxx, r22 = cy * cx;
      const o = i * 16; const px = piv ? piv[0] : 0, py = piv ? piv[1] : 0, pz = piv ? piv[2] : 0;
      sx = sx == null ? 1 : sx; sy = sy == null ? 1 : sy; sz = sz == null ? 1 : sz;
      mats[o] = r00 * sx; mats[o + 1] = r01 * sx; mats[o + 2] = r02 * sx; mats[o + 3] = 0;
      mats[o + 4] = r10 * sy; mats[o + 5] = r11 * sy; mats[o + 6] = r12 * sy; mats[o + 7] = 0;
      mats[o + 8] = r20 * sz; mats[o + 9] = r21 * sz; mats[o + 10] = r22 * sz; mats[o + 11] = 0;
      mats[o + 12] = px + tx - (mats[o] * px + mats[o + 4] * py + mats[o + 8] * pz); mats[o + 13] = py + ty - (mats[o + 1] * px + mats[o + 5] * py + mats[o + 9] * pz); mats[o + 14] = pz + tz - (mats[o + 2] * px + mats[o + 6] * py + mats[o + 10] * pz); mats[o + 15] = 1;
    }
    function pose(e, now) {
      const m = e.model; const bones = m.bones; if (!bones || !bones.length) return null;
      let a = e.anim;
      if (!a) { a = e._an; if (!a) a = e._an = { ph: Math.random() * 6.28, mv: 0, lx: e.x, lz: e.z, ly: e.y, lt: now, vy: 0, seed: Math.random() * 100, air: 0 };
        const dt = Math.min(0.1, Math.max(0.001, (now - a.lt) / 1000)); a.lt = now;
        const dx = e.x - a.lx, dz = e.z - a.lz, dy = e.y - a.ly; a.lx = e.x; a.lz = e.z; a.ly = e.y;
        const d = Math.hypot(dx, dz); const jump = d > 2.5;
        const stride = Math.max(0.3, (m.legLen || 0.45) * 2.6 * (e.scale || 1));
        if (!jump) a.ph += d / stride * Math.PI * 2;
        const want = jump ? a.mv : U.clamp(d / dt / 3.2, 0, 1); a.mv += (want - a.mv) * Math.min(1, dt * 9);
        a.vy = jump ? 0 : a.vy + (dy / dt - a.vy) * Math.min(1, dt * 6);
        const airWant = (e.flying || e.mountMode === 'air' || (m.flyer && (Math.abs(a.vy) > 0.4 || e.hover > 0.3))) ? 1 : 0; a.air += (airWant - a.air) * Math.min(1, dt * 4);
      }
      const t = now / 1000, ph = a.ph, mv = a.mv, air = a.air || 0, seed = a.seed || 0, sc = e.scale || 1;
      const swim = e.swim || a.swim || 0;
      const bob = (m.kind === 'blob' ? 0 : Math.abs(Math.sin(ph)) * 0.035 * mv * (m.height || 1)) + (air ? Math.sin(t * 3.1 + seed) * 0.05 : 0);
      const idle = 1 - mv;
      for (let i = 0; i < 10; i++) {
        const b = bones[i]; if (!b) { set(i, null, 0, 0, 0, 0, bob, 0); continue; }
        const k = b.kind, phs = b.phase || 0;
        switch (k) {
          case 'leg': { const sw = Math.sin(ph + phs); const amp = (b.amp || 0.55) * mv * (1 - air * 0.8); const sit = a.sit || 0; set(i, b.piv, (-sw * amp) * (1 - sit) - 1.25 * sit, 0, (b.phase ? -1 : 1) * 0.25 * sit, 0, bob + Math.max(0, -Math.cos(ph + phs)) * 0.03 * mv * sc * (b.len || 1), 0); break; }
          case 'arm': { const sw = Math.sin(ph + phs + Math.PI); const amp = (b.amp || 0.4) * mv; const atk = a.attack || 0; const sit = a.sit || 0; const rx = (-sw * amp - atk * 1.9 + idle * Math.sin(t * 1.3 + seed + phs) * 0.03) * (1 - sit) - 0.55 * sit; set(i, b.piv, rx, 0, (b.side || 0) * (0.08 + air * 1.1 + (a.block || 0) * 0.5), 0, bob, 0); break; }
          case 'head': { const look = a.look || 0; set(i, b.piv, Math.sin(ph * 2) * 0.05 * mv + idle * Math.sin(t * 0.9 + seed) * 0.03 + (a.nod || 0), idle * Math.sin(t * 0.55 + seed * 2) * 0.16 + look, 0, 0, bob, 0); break; }
          case 'tail': { const sw = Math.sin(ph + 1.1) * 0.25 * mv + Math.sin(t * 1.6 + seed) * (0.09 + 0.1 * idle); set(i, b.piv, Math.sin(t * 1.1 + seed) * 0.04, sw * (b.amp || 1), 0, 0, bob, 0); break; }
          case 'tailfin': { const sw = Math.sin(t * (5 + 3 * mv) + seed) * (0.3 + 0.2 * mv); set(i, b.piv, 0, sw, 0, 0, bob, 0); break; }
          case 'wing': { const side = b.side || 1; const flap = air > 0.05 ? Math.sin(t * 9.5 + seed) * 0.55 * air + 0.12 * air : 0; const fold = (1 - air) * (b.fold || 0); set(i, b.piv, 0, 0, side * (flap + fold) + side * (1 - air) * Math.sin(t * 2.3 + seed) * 0.03, 0, bob, 0); break; }
          case 'spin': { set(i, b.piv, 0, t * (b.speed || 1.5), 0, 0, bob, 0); break; }
          case 'jaw': { set(i, b.piv, (a.jaw || e.jawOpen || 0) * 0.45, 0, 0, 0, bob, 0); break; }
          case 'ear': { set(i, b.piv, 0, 0, (b.side || 1) * (Math.sin(t * 2.7 + seed + phs) * 0.06 + mv * 0.15), 0, bob, 0); break; }
          case 'body': default: {
            if (m.kind === 'blob') { const sq = 1 + Math.sin(ph) * 0.09 * mv + Math.sin(t * 2.2 + seed) * 0.025; set(i, b.piv || [0, 0, 0], 0, 0, 0, 0, Math.abs(Math.sin(ph)) * 0.12 * mv * sc, 0, 1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); }
            else set(i, b.piv || [0, 0, 0], (a.lean || 0) + air * (b.airPitch || 0) + mv * (b.runPitch || 0), 0, swim ? Math.sin(t * 4) * 0.05 : 0, 0, bob, 0);
          }
        }
      }
      if (m.sway) { const S = m.sway; sway[0] = S.amp * (0.45 + 0.55 * Math.max(mv, swim, air)); sway[1] = S.freq; sway[2] = t * S.speed + seed; sway[3] = S.from; } // all in the model's own units: the shader sways aPos before uModel
      else { sway[0] = 0; sway[1] = 0; sway[2] = 0; sway[3] = 0; }
      return { mats, sway };
    }
    return { pose };
  })();
  window.Anim = Anim;
})();
