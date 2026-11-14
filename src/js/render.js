'use strict';
// Raw WebGL renderer: chunk meshing with baked AO + sky exposure, point lights (torches), fog, day/night, entity meshes, line overlays.
class MeshBuilder {
  // withNormals: entity meshes carry a smooth normal and a bone index per vertex (chunks do not; their shader derives normals)
  constructor(cap = 4096, withNormals = false, chunk = false) {
    this.pos = new Float32Array(cap * 3); this.col = new Uint8Array(cap * 4); this.idx = new Uint32Array(cap * 1.5 | 0);
    this.nv = 0; this.ni = 0; this.chunk = chunk;
    this.nrm = withNormals || chunk ? new Float32Array(cap * 3) : null; this.bone = withNormals && !chunk ? new Float32Array(cap) : null;
    this.mat = new Uint8Array(cap); this.curMat = 0; // material class per vertex (chunk meshes): what the fragment shader paints
    this.curBone = 0; this.M = null; this.stack = []; // transform stack for entity parts (column-major 4x4, applied in vert())
  }
  ensure(nv, ni) {
    if (this.nv + nv > this.pos.length / 3) {
      const cap = Math.max((this.pos.length / 3) * 2, this.nv + nv);
      const p = new Float32Array(cap * 3); p.set(this.pos); this.pos = p;
      const c = new Uint8Array(cap * 4); c.set(this.col); this.col = c;
      if (this.nrm) { const n = new Float32Array(cap * 3); n.set(this.nrm); this.nrm = n; } if (this.bone) { const bo = new Float32Array(cap); bo.set(this.bone); this.bone = bo; }
      const mt = new Uint8Array(cap); mt.set(this.mat); this.mat = mt;
    }
    if (this.ni + ni > this.idx.length) {
      const cap = Math.max(this.idx.length * 2, this.ni + ni);
      const ix = new Uint32Array(cap); ix.set(this.idx); this.idx = ix;
    }
  }
  // one vertex through the current transform; returns its index
  vert(x, y, z, nx, ny, nz, r, g, b, sky, emissive) {
    this.ensure(1, 0); const i = this.nv; const M = this.M;
    if (M) { const X = M[0] * x + M[4] * y + M[8] * z + M[12], Y = M[1] * x + M[5] * y + M[9] * z + M[13], Z = M[2] * x + M[6] * y + M[10] * z + M[14]; x = X; y = Y; z = Z;
      const NX = M[0] * nx + M[4] * ny + M[8] * nz, NY = M[1] * nx + M[5] * ny + M[9] * nz, NZ = M[2] * nx + M[6] * ny + M[10] * nz; const l = Math.hypot(NX, NY, NZ) || 1; nx = NX / l; ny = NY / l; nz = NZ / l; }
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    const ci = i * 4; this.col[ci] = Math.min(255, r * 255) | 0; this.col[ci + 1] = Math.min(255, g * 255) | 0; this.col[ci + 2] = Math.min(255, b * 255) | 0; this.col[ci + 3] = emissive ? 255 : Math.min(250, sky * 250) | 0;
    if (this.nrm) { this.nrm[i * 3] = nx; this.nrm[i * 3 + 1] = ny; this.nrm[i * 3 + 2] = nz; } if (this.bone) this.bone[i] = this.curBone;
    this.mat[i] = this.curMat;
    this.nv++; return i;
  }
  tri(a, b, c) { this.ensure(0, 3); const k = this.ni; this.idx[k] = a; this.idx[k + 1] = b; this.idx[k + 2] = c; this.ni += 3; }
  // quad: 4 corner positions [x,y,z], colours [r,g,b] per vertex (0..1), sky per vertex 0..1, emissive flag; nrm: optional per-vertex normals (else flat)
  quad(p, c, sky, emissive, nrm) {
    if (this.M || this.nrm) { // entity path: transformed, with normals
      let fn = null;
      if (!nrm) { const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2], vx = p[3][0] - p[0][0], vy = p[3][1] - p[0][1], vz = p[3][2] - p[0][2]; fn = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(fn[0], fn[1], fn[2]) || 1; fn[0] /= l; fn[1] /= l; fn[2] /= l; }
      const b = this.nv; for (let i = 0; i < 4; i++) { const n = nrm ? nrm[i] : fn; this.vert(p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], c[i][0], c[i][1], c[i][2], sky[i], emissive); }
      this.tri(b, b + 1, b + 2); this.tri(b, b + 2, b + 3); return;
    }
    this.ensure(4, 6);
    const b = this.nv;
    for (let i = 0; i < 4; i++) {
      this.pos[(b + i) * 3] = p[i][0]; this.pos[(b + i) * 3 + 1] = p[i][1]; this.pos[(b + i) * 3 + 2] = p[i][2];
      const ci = (b + i) * 4;
      this.col[ci] = Math.min(255, c[i][0] * 255) | 0; this.col[ci + 1] = Math.min(255, c[i][1] * 255) | 0; this.col[ci + 2] = Math.min(255, c[i][2] * 255) | 0;
      this.col[ci + 3] = emissive ? 255 : Math.min(250, sky[i] * 250) | 0;
      this.mat[b + i] = this.curMat;
    }
    const k = this.ni;
    this.idx[k] = b; this.idx[k + 1] = b + 1; this.idx[k + 2] = b + 2; this.idx[k + 3] = b; this.idx[k + 4] = b + 2; this.idx[k + 5] = b + 3;
    this.nv += 4; this.ni += 6;
  }
  // ---- transform stack (entity parts) ----
  push() { this.stack.push(this.M ? this.M.slice() : null); }
  pop() { this.M = this.stack.pop() || null; }
  mul(m) { this.M = this.M ? U.m4mul(this.M, m) : Float32Array.from(m); }
  translate(x, y, z) { const m = U.m4identity(); m[12] = x; m[13] = y; m[14] = z; this.mul(m); }
  // rotate about a pivot: rx, ry, rz in radians (applied z, then x, then y)
  rotate(rx, ry, rz, piv) {
    if (piv) this.translate(piv[0], piv[1], piv[2]);
    if (ry) { const c = Math.cos(ry), s = Math.sin(ry); const m = U.m4identity(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; this.mul(m); }
    if (rx) { const c = Math.cos(rx), s = Math.sin(rx); const m = U.m4identity(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; this.mul(m); }
    if (rz) { const c = Math.cos(rz), s = Math.sin(rz); const m = U.m4identity(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; this.mul(m); }
    if (piv) this.translate(-piv[0], -piv[1], -piv[2]);
  }
  scale(sx, sy, sz) { const m = U.m4identity(); m[0] = sx; m[5] = sy; m[10] = sz; this.mul(m); }
  setBone(i) { this.curBone = i; }
  // axis aligned box with flat shading per face
  box(x0, y0, z0, x1, y1, z1, color, sky = 1, emissive = false, shade = FACE_SHADE) {
    const c = (f) => { const s = shade[f]; return [[color[0] * s, color[1] * s, color[2] * s], [color[0] * s, color[1] * s, color[2] * s], [color[0] * s, color[1] * s, color[2] * s], [color[0] * s, color[1] * s, color[2] * s]]; };
    const sk = [sky, sky, sky, sky];
    this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], c(0), sk, emissive);
    this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], c(1), sk, emissive);
    this.quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], c(2), sk, emissive);
    this.quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], c(3), sk, emissive);
    this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c(4), sk, emissive);
    this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], c(5), sk, emissive);
  }
  empty() { return this.ni === 0; }
}
const FACE_SHADE = [0.86, 0.78, 1.0, 0.55, 0.92, 0.72]; // +x -x +y -y +z -z

// Face tables: for each face, normal and the 4 corners (local 0/1) in draw order.
const FACES = [
  { n: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

// Face patterns: a face is split into sub-rectangles (u,v in 0..1 across the face) with their own shade, and small studs raised off it.
// This is what makes planks look sawn, iron walls riveted, ore speckled, glass framed: the mesher has no textures, only colour.
const strips = (t, mul, col) => [{ u0: 0, v0: 0, u1: 1, v1: t, mul, col }, { u0: 0, v0: 1 - t, u1: 1, v1: 1, mul, col }, { u0: 0, v0: t, u1: t, v1: 1 - t, mul, col }, { u0: 1 - t, v0: t, u1: 1, v1: 1 - t, mul, col }];
const bands = (n, along, muls, seam, seamMul) => { // n boards across the face with thin dark seams between them
  const out = []; const w = (1 - seam * (n - 1)) / n;
  for (let i = 0; i < n; i++) { const a = i * (w + seam), b = a + w; out.push(along === 'u' ? { u0: a, v0: 0, u1: b, v1: 1, mul: muls[i % muls.length] } : { u0: 0, v0: a, u1: 1, v1: b, mul: muls[i % muls.length] }); if (i < n - 1) out.push(along === 'u' ? { u0: b, v0: 0, u1: b + seam, v1: 1, mul: seamMul } : { u0: 0, v0: b, u1: 1, v1: b + seam, mul: seamMul }); }
  return out;
};
const PLATE = (fm, edge) => ({ rects: strips(0.1, fm).concat([{ u0: 0.1, v0: 0.1, u1: 0.9, v1: 0.9, mul: 1.04 }]), studs: [[0.17, 0.17], [0.83, 0.17], [0.17, 0.83], [0.83, 0.83]].map(([u, v]) => ({ u, v, s: 0.1, h: 0.035, mul: edge.mul, col: edge.col, emis: edge.emis })) });
const SPECK = (col, emis) => ({ base: 'stone', studs: (hash) => { const out = []; const n = 4 + Math.floor(hash(1) * 3); for (let i = 0; i < n; i++) { const s = 0.1 + hash(10 + i) * 0.12; out.push({ u: 0.08 + hash(20 + i) * (0.84 - s), v: 0.08 + hash(30 + i) * (0.84 - s), s, h: 0.02, col, emis, mul: 1 }); } return out; } });
const PATTERNS = {};
PATTERNS[B.PLANKS] = { side: { rects: bands(3, 'v', [1.0, 0.88, 0.95], 0.04, 0.42) }, top: { rects: bands(3, 'u', [1.0, 0.88, 0.95], 0.04, 0.42) } };
PATTERNS[B.LOG] = { side: { rects: bands(4, 'u', [1.0, 0.84, 0.94, 0.8], 0.02, 0.6) }, top: { rects: strips(0.14, 0.78).concat(strips(0.14, 0.95).map(r => ({ u0: 0.14 + r.u0 * 0.72, v0: 0.14 + r.v0 * 0.72, u1: 0.14 + r.u1 * 0.72, v1: 0.14 + r.v1 * 0.72, mul: 1.1, col: [0.78, 0.62, 0.38] })), [{ u0: 0.28, v0: 0.28, u1: 0.72, v1: 0.72, mul: 0.86, col: [0.6, 0.45, 0.26] }]) } };
// the Kinmaster's works: dark dressed stone with mortar, barbed thorn, a dead machine gate with rivets and a cold lamp, a heap of rubble
PATTERNS[B.THORN] = { all: { rects: [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1, col: null }, { u0: 0.1, v0: 0.2, u1: 0.9, v1: 0.3, mul: 0.7, col: null }, { u0: 0.2, v0: 0.6, u1: 1, v1: 0.7, mul: 0.7, col: null }, { u0: 0.3, v0: 0.1, u1: 0.36, v1: 0.2, mul: 1, col: [0.85, 0.82, 0.6] }, { u0: 0.6, v0: 0.3, u1: 0.66, v1: 0.4, mul: 1, col: [0.85, 0.82, 0.6] }, { u0: 0.4, v0: 0.7, u1: 0.46, v1: 0.8, mul: 1, col: [0.85, 0.82, 0.6] }, { u0: 0.8, v0: 0.5, u1: 0.86, v1: 0.6, mul: 1, col: [0.85, 0.82, 0.6] }] } };
PATTERNS[B.DEADGATE] = { all: { rects: [{ u0: 0.05, v0: 0.05, u1: 0.95, v1: 0.95, mul: 0.85, col: null }, { u0: 0.08, v0: 0.08, u1: 0.16, v1: 0.16, mul: 1.4, col: null }, { u0: 0.84, v0: 0.08, u1: 0.92, v1: 0.16, mul: 1.4, col: null }, { u0: 0.08, v0: 0.84, u1: 0.16, v1: 0.92, mul: 1.4, col: null }, { u0: 0.84, v0: 0.84, u1: 0.92, v1: 0.92, mul: 1.4, col: null }, { u0: 0.38, v0: 0.38, u1: 0.62, v1: 0.62, mul: 1, col: [0.25, 0.3, 0.38] }] } };
PATTERNS[B.RUBBLE] = { all: { rects: [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1, col: null }, { u0: 0.05, v0: 0.1, u1: 0.45, v1: 0.45, mul: 1.15, col: null }, { u0: 0.5, v0: 0.05, u1: 0.95, v1: 0.4, mul: 0.85, col: null }, { u0: 0.1, v0: 0.55, u1: 0.55, v1: 0.95, mul: 0.9, col: null }, { u0: 0.6, v0: 0.5, u1: 0.95, v1: 0.92, mul: 1.1, col: null }] } };
// a bullseye: red rings on straw-white
PATTERNS[B.TARGET] = { all: { rects: [{ u0: 0.08, v0: 0.08, u1: 0.92, v1: 0.92, mul: 1, col: [0.85, 0.16, 0.18] }, { u0: 0.2, v0: 0.2, u1: 0.8, v1: 0.8, mul: 1, col: [0.95, 0.93, 0.88] }, { u0: 0.32, v0: 0.32, u1: 0.68, v1: 0.68, mul: 1, col: [0.85, 0.16, 0.18] }, { u0: 0.43, v0: 0.43, u1: 0.57, v1: 0.57, mul: 1, col: [0.98, 0.84, 0.2] }] } };
PATTERNS[B.BALLOON] = { all: { rects: [{ u0: 0.18, v0: 0.55, u1: 0.42, v1: 0.82, mul: 1.35, col: null }] } };
PATTERNS[B.IRONWALL] = { all: PLATE(0.74, { mul: 0.45, col: null }) };
PATTERNS[B.SLIT] = { side: { rects: [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1 }, { u0: 0.42, v0: 0.14, u1: 0.58, v1: 0.86, mul: 1, col: [0.05, 0.05, 0.07] }] } }; // an arrow slit cut in the stone
PATTERNS[B.VOIDWALL] = { all: PLATE(0.62, { mul: 1, col: [0.8, 0.4, 1.0], emis: true }) };
PATTERNS[B.GLASS] = { all: { rects: strips(0.06, 0.55, [0.72, 0.76, 0.8]).concat([{ u0: 0.06, v0: 0.06, u1: 0.94, v1: 0.94, mul: 1, glass: true }]) } };
PATTERNS[B.COPPER] = { all: SPECK([0.86, 0.5, 0.22], false) };
PATTERNS[B.IRON] = { all: SPECK([0.9, 0.86, 0.8], false) };
PATTERNS[B.EMBER] = { all: SPECK([1.0, 0.45, 0.12], true) };
PATTERNS[B.VOID] = { all: SPECK([0.78, 0.38, 1.0], true) };
PATTERNS[B.BASALT] = { side: { rects: bands(3, 'u', [1.0, 0.88, 0.95], 0.03, 0.55) } };
PATTERNS[B.SELENITE] = { all: SPECK([0.85, 0.95, 1.0], true) };
PATTERNS[B.TYCHO] = { all: SPECK([0.62, 0.72, 0.86], false) };
PATTERNS[B.AMBER] = { all: SPECK([0.95, 0.7, 0.3], false) };
PATTERNS[B.GOLD] = { all: SPECK([1.0, 0.84, 0.3], false) };
PATTERNS[B.DIAMOND] = { all: SPECK([0.6, 1.0, 1.0], true) };
PATTERNS[B.SELGLASS] = { all: { rects: strips(0.05, 0.8, [0.85, 0.95, 1.0]).concat([{ u0: 0.05, v0: 0.05, u1: 0.95, v1: 0.95, mul: 1, glass: true }]) } };

const R = (() => {
  let gl, canvas, prog, lineProg, loc = {}, lloc = {};
  const meshes = new Map(); // chunk key -> gpu mesh
  const entityMeshes = new Map();
  let lineBuf, lineData = new Float32Array(6 * 600), lineCount = 0;
  let isMobile = false; let skyProg = null, skyBuf = null; const sloc = {};
  const state = { viewDist: 64, dayLight: 1, fogColor: [0.6, 0.8, 1], skyColor: [0.6, 0.8, 1], ambient: 0.07, underwater: false, inCore: false, lights: [] };

  // ---- the look: sunlight with warm light and cool shade, painted block texture with a faint grid, haze, living water ----
  const VS = `
  attribute vec3 aPos; attribute vec4 aCol; attribute float aMat; attribute vec3 aNorm;
  uniform mat4 uPV; uniform mat4 uModel; uniform float uTime; uniform float uWave;
  varying vec4 vCol; varying vec3 vWorld; varying float vMat; varying vec3 vN;
  void main(){
    vMat = aMat; vN = mat3(uModel) * aNorm;
    vec4 w = uModel * vec4(aPos, 1.0);
    if (uWave > 1.5) { float k = fract(w.y + 0.0005); k = k * k * 3.0; float gust = sin(uTime * 0.7 + w.x * 0.05 + w.z * 0.03) * 0.5 + 0.5; w.x += (sin(uTime * 2.3 + w.x * 0.9 + w.z * 0.4) * 0.05 + gust * 0.07) * k; w.z += cos(uTime * 1.9 + w.z * 0.8 + w.x * 0.3) * 0.04 * k; }
    else if (uWave > 0.5) { w.y += sin(uTime * 1.3 + w.x * 0.55 + w.z * 0.35) * 0.045 + sin(uTime * 2.1 - w.x * 0.9 + w.z * 1.2) * 0.025 - 0.12; }
    vWorld = w.xyz; vCol = aCol;
    gl_Position = uPV * w;
  }`;
  const TONE = `vec3 tonemap(vec3 c){ c = max(c, 0.0); vec3 s = min(c, 1.0); c += (s * s * (3.0 - 2.0 * s) - s) * 0.22; vec3 hi = 0.82 + (1.0 - exp(-(c - 0.82) * 2.6)) * 0.18; c = mix(c, hi, step(0.82, c)); float l = dot(c, vec3(0.3, 0.59, 0.11)); return clamp(mix(vec3(l), c, 1.1), 0.0, 1.0); }`; // a gentle S for contrast (on the 0..1 part only: above 1 the old smoothstep went negative and sun glitter on water came out black and magenta), a soft shoulder above 0.82 so bright things do not clip flat, a touch more colour
  const FS = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  ${TONE}
  /*SHADOW*/
  varying vec4 vCol; varying vec3 vWorld; varying float vMat; varying vec3 vN;
  uniform vec3 uCam; uniform float uDay; uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform float uAmbient; uniform float uFogSky; uniform float uCoreGlow;
  uniform vec3 uLights[8]; uniform float uLightR[8]; uniform float uAlpha; uniform vec3 uTint; uniform float uSkyMul;
  uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uZenith; uniform float uGrid; uniform float uWave; uniform float uTime; uniform float uSunAmt; uniform float uQuality; uniform vec3 uPlayer; uniform float uBladeShade;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
  float hash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  vec3 skyFog(vec3 d){ float h = d.y; vec3 c = mix(uFog, uZenith, pow(clamp(h, 0.0, 1.0), 0.55)); if (h < 0.0) c = mix(uFog, uFog * 0.82, clamp(-h * 4.0, 0.0, 1.0)); return mix(uFog, c, uFogSky); }
  void main(){
    vec3 toCam = uCam - vWorld; float dist = length(toCam); vec3 V = toCam / max(dist, 0.0001);
    vec3 n = dot(vN, vN) > 0.1 ? normalize(vN) : normalize(cross(dFdx(vWorld), dFdy(vWorld))); if (dot(n, V) < -0.2) n = -n;
    float sky = vCol.a; float emis = step(0.999, sky);
    float skyL = sky * uSkyMul;
    float torch = 0.0;
    for (int i = 0; i < 8; i++) { float d = distance(vWorld, uLights[i]); torch = max(torch, clamp(1.0 - d / max(uLightR[i], 0.001), 0.0, 1.0)); }
    torch = torch * torch * (3.0 - 2.0 * torch);
    vec3 col;
    float alpha = uAlpha;
    if (uWave > 1.5) { n = normalize(vec3(0.0, 1.0, 0.0) + V * 0.3); }
    if (uWave > 0.5 && uWave < 1.5) {
      // water: shallow turquoise to deep blue, a moving surface, the sky in it, the sun on it, foam at the edge
      float depth = vCol.r; bool brine = vCol.g > 0.5; bool top = n.y > 0.6;
      vec3 wn = vec3(0.0, 1.0, 0.0);
      if (top) { float t = uTime; vec2 q = vWorld.xz;
        wn.x = sin(q.x * 1.7 + t * 1.3) * 0.06 + sin(q.x * 3.9 - q.y * 2.3 + t * 2.2) * 0.035 + sin((q.x + q.y) * 7.1 + t * 3.1) * 0.015;
        wn.z = sin(q.y * 1.9 - t * 1.1) * 0.06 + sin(q.y * 4.3 + q.x * 1.7 - t * 2.6) * 0.035 + sin((q.y - q.x) * 6.7 - t * 2.8) * 0.015;
        wn = normalize(wn); } else wn = n;
      vec3 shallow = brine ? vec3(0.55, 0.62, 0.12) : vec3(0.16, 0.74, 0.74), deep = brine ? vec3(0.22, 0.26, 0.04) : vec3(0.03, 0.2, 0.42);
      vec3 base = mix(shallow, deep, smoothstep(0.0, 0.85, depth)) * (0.35 + 0.65 * uDay);
      vec3 R = reflect(-V, wn); vec3 skyR = mix(uFog, uZenith, clamp(R.y * 1.6, 0.0, 1.0));
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(V, wn), 0.0), 4.0);
      col = mix(base, skyR, top ? fres * 0.85 : 0.1);
      float spec = pow(max(dot(R, uSun), 0.0), 160.0) * uSunAmt; col += uSunCol * spec * 2.5;
      float sparkle = step(0.985, hash3(floor(vec3(vWorld.xz * 6.0, floor(uTime * 3.0))).xzy)) * uSunAmt * 0.6; if (top) col += uSunCol * sparkle * fres;
      if (top && depth < 0.16) { float foam = smoothstep(0.16, 0.0, depth) * (0.5 + 0.5 * sin(uTime * 2.0 + vWorld.x * 3.0 + vWorld.z * 2.0)); col = mix(col, vec3(0.95), foam * 0.45); }
      col = max(col, base * torch * 0.9);
      alpha = top ? mix(0.5, 0.94, max(smoothstep(0.0, 0.7, depth), fres)) : 0.7;
    } else {
      int mat0 = int(vMat + 0.5);
      float nearB = 1.0 - smoothstep(24.0, 48.0, dist);
      if (nearB > 0.01 && emis < 0.5 && (mat0 == 3 || mat0 == 4 || mat0 == 2 || mat0 == 5 || mat0 == 6)) { // relief: the normal leans with the bumps of the material
        vec2 uvb = abs(n.x) > 0.5 ? vWorld.zy : (abs(n.y) > 0.5 ? vWorld.xz : vWorld.xy);
        vec3 T = abs(n.x) > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), Bt = abs(n.y) > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
        float sc = mat0 == 3 ? 2.2 : mat0 == 4 ? 6.0 : mat0 == 2 ? 2.6 : mat0 == 5 ? 1.6 : 1.0; float amt = mat0 == 3 ? 0.22 : mat0 == 4 ? 0.09 : mat0 == 2 ? 0.045 : mat0 == 5 ? 0.06 : 0.03;
        float ee = 0.07; float h0 = vn(uvb * sc), hx = vn((uvb + vec2(ee, 0.0)) * sc), hy = vn((uvb + vec2(0.0, ee)) * sc);
        if (mat0 == 3) { float d0 = vn(uvb * 7.0 + 3.0), dx = vn((uvb + vec2(ee, 0.0)) * 7.0 + 3.0), dy = vn((uvb + vec2(0.0, ee)) * 7.0 + 3.0); h0 += d0 * 0.3; hx += dx * 0.3; hy += dy * 0.3; }
        vec2 gr = vec2(hx - h0, hy - h0) / ee * amt * nearB;
        n = normalize(n - T * gr.x - Bt * gr.y);
      }
      float lam = max(dot(n, uSun), 0.0) * uSunAmt;
      float sh = lam > 0.001 ? shadowAt(vWorld, n) : 1.0;
      vec3 amb = vec3(0.78, 0.86, 1.05) * (0.4 + 0.3 * uDay) * (0.86 + 0.14 * n.y);
      vec3 light = skyL * (amb * (0.88 + 0.12 * sh) + uSunCol * lam * sh * 0.78 * uDay);
      light = max(light, vec3(uAmbient)); light = max(light, vec3(1.0, 0.78, 0.52) * torch * 0.95);
      if (vWorld.y < 14.5 && uCoreGlow > 0.5) { // the Core: the lava sea lights everything from below, orange on the undersides, fading up toward the roof
        float up = clamp((vWorld.y - 3.5) / 9.0, 0.0, 1.0); float under = 0.55 - 0.45 * n.y;
        float flick = 0.9 + 0.1 * sin(uTime * 2.3 + vWorld.x * 0.7 + vWorld.z * 0.9);
        light = max(light, vec3(1.0, 0.42, 0.1) * (1.0 - up * 0.75) * under * 1.1 * flick + vec3(0.6, 0.16, 0.05) * 0.45);
      }
      light = mix(light, vec3(1.0), emis);
      vec3 vc = vCol.rgb; float lum = dot(vc, vec3(0.3, 0.59, 0.11)); vc = mix(vec3(lum), vc, 0.78); if (vc.g > vc.r * 1.1 && vc.g > vc.b * 1.2) vc *= vec3(1.04, 1.0, 0.86);
      col = vc * light;
      if (mat0 == 16) { // cloudstone: soft, bright, a little blue in the hollows
        float puff = vn(vWorld.xz * 0.5 + vWorld.y * 0.3) * 0.6 + vn(vWorld.xz * 1.7 + 4.0) * 0.4;
        col *= 0.93 + 0.12 * puff; col = mix(col, col * vec3(0.9, 0.94, 1.0), (1.0 - max(n.y, 0.0)) * 0.3 + (1.0 - puff) * 0.12);
      }
      if (mat0 == 15) { // basalt: columns packed side by side (a cell pattern on the sides), a cooled crust on top with ember cracks low down
        bool topF = n.y > 0.5; vec2 q = vWorld.xz * 1.3; vec2 ci = floor(q), cf = fract(q); float f1 = 9.0, f2 = 9.0, idc = 0.0;
        for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) { vec2 g = vec2(float(i), float(j)); vec2 o = vec2(hash3(vec3(ci + g, 11.0)), hash3(vec3(ci + g, 12.0))) * 0.8 + 0.1; float d = length(g + o - cf); if (d < f1) { f2 = f1; f1 = d; idc = hash3(vec3(ci + g, 13.0)); } else if (d < f2) f2 = d; }
        float seam = smoothstep(0.0, 0.1, f2 - f1);
        if (topF) { col *= mix(0.55, 1.0, seam) * (0.85 + 0.3 * idc); float cr = smoothstep(0.03, 0.0, f2 - f1) * (1.0 - clamp((vWorld.y - 4.0) / 5.0, 0.0, 1.0)); col += vec3(1.0, 0.45, 0.1) * cr * (0.6 + 0.4 * sin(uTime * 1.7 + idc * 9.0)); }
        else { float seamV = smoothstep(0.0, 0.08, f2 - f1); col *= mix(0.5, 1.0, seamV) * (0.88 + 0.24 * idc) * (0.9 + 0.2 * vn(vec2(vWorld.y * 1.5, idc * 20.0))); }
      }
      if (mat0 == 8) { // lava: a dark crust drifting over a bright glow (emissive, so it skips the paint below)
        vec2 q = vWorld.xz * 0.6; float flow = vn(q + vec2(uTime * 0.05, uTime * 0.03)) * 0.6 + vn(q * 2.3 - vec2(uTime * 0.04, 0.0)) * 0.4;
        float crust = smoothstep(0.42, 0.62, flow); vec3 hot = vec3(1.0, 0.72, 0.18), cool = vec3(0.42, 0.1, 0.03);
        col = mix(hot * (1.05 + 0.25 * sin(uTime * 2.0 + flow * 12.0)), cool, crust) * (0.5 + 0.5 * step(0.5, n.y)) + cool * 0.5 * (1.0 - step(0.5, n.y));
      }
      if (uGrid > 0.5 && emis < 0.5) {
        vec2 uv = abs(n.x) > 0.5 ? vWorld.zy : (abs(n.y) > 0.5 ? vWorld.xz : vWorld.xy);
        vec3 bp = floor(vWorld - n * 0.5);
        float hb = hash3(bp); float speck = hash3(vec3(floor(uv * 8.0), bp.y)); float blot = hash3(vec3(floor(uv * 3.0), bp.x + bp.z));
        int matp = int(vMat + 0.5); float soil = (matp == 1 || matp == 2 || matp == 4 || matp == 5) ? 1.0 : 0.0; float blocky = (matp == 7 || matp == 0 || matp >= 9 || soil > 0.5) ? 0.0 : 1.0; // leaves, props, the ground and the town's materials are not blocks: no per-block paint on them
        col *= 1.0 + blocky * (-0.1 + 0.1 * hb + (speck - 0.5) * 0.12 * uQuality + (blot - 0.5) * 0.07);
        col *= 1.0 + soil * ((vn(uv * 0.7 + 3.0) - 0.5) * 0.1 + (vn(uv * 2.3 + 8.0) - 0.5) * 0.05); // the ground: a soft drift of light and dark instead
        // broad painted drift: warm and cool patches across the land
        vec2 wp = vWorld.xz * 0.045; vec2 wi = floor(wp), wf = fract(wp); wf = wf * wf * (3.0 - 2.0 * wf);
        float d0 = hash3(vec3(wi, 7.0)), d1 = hash3(vec3(wi + vec2(1.0, 0.0), 7.0)), d2 = hash3(vec3(wi + vec2(0.0, 1.0), 7.0)), d3 = hash3(vec3(wi + vec2(1.0, 1.0), 7.0));
        float drift = mix(mix(d0, d1, wf.x), mix(d2, d3, wf.x), wf.y);
        col *= mix(vec3(1.08, 1.03, 0.86), vec3(0.88, 0.98, 1.06), drift);
        vec2 f = fract(uv); float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        float pd = length(vWorld.xz - uPlayer.xz) + abs(vWorld.y - uPlayer.y) * 0.5; float lw = 0.018; float g = 1.0 - smoothstep(lw, lw * 2.2, e); g *= 1.0 - smoothstep(2.5, 4.5, pd);
        col *= 1.0 - 0.28 * g;
        float near = 1.0 - smoothstep(30.0, 70.0, dist); int mat = int(vMat + 0.5);
        if (mat == 2) { // sand: soft wind ripples wandering over it, a fine grain, a glint here and there
          vec2 q = vWorld.xz; float warp = vn(q * 0.3) * 4.0 + vn(q * 1.4 + 2.0) * 1.3;
          float rip = sin(dot(q, vec2(0.93, 0.37)) * 3.4 + warp) * 0.5 + 0.5; rip = smoothstep(0.2, 0.9, rip);
          float grain = vn(q * 40.0) * 0.5 + vn(q * 97.0 + 1.7) * 0.5;
          col *= 1.0 + ((rip - 0.5) * 0.08 + (grain - 0.5) * 0.045) * near;
          col *= 0.96 + 0.08 * vn(q * 0.12);
          col += uSunCol * step(0.996, hash3(vec3(floor(q * 20.0), 3.0))) * uSunAmt * 0.1 * near * (0.4 + 0.6 * rip);
        } else if (mat == 1) { // grass: a carpet of fine blades, with wind rolling over it
          vec2 q = vWorld.xz; float fine = vn(q * 26.0) * 0.6 + vn(q * 61.0 + 3.1) * 0.4; float tuft = vn(q * 7.0 + 9.0);
          vec2 wd = normalize(vec2(0.8, 0.45)); float wave = sin(dot(q, wd) * 0.42 - uTime * 1.6 + vn(q * 0.15) * 4.0) * 0.5 + 0.5; wave *= wave * (0.5 + 0.5 * vn(q * 0.07 + uTime * 0.05));
          col *= 0.78 + 0.34 * fine + 0.1 * (tuft - 0.5);
          col = mix(col, col * vec3(1.18, 1.16, 1.0) + vec3(0.035, 0.04, 0.0), wave * 0.42 * (1.0 - smoothstep(60.0, 110.0, dist)));
          col *= mix(mix(0.66, 1.0, smoothstep(12.0, 36.0, dist)), 1.0, 1.0 - uBladeShade); // the ground under standing blades is in their shade
        } else if (mat == 3) { // rock: large blotches, thin cracks along a noise contour, a lighter dusting on the tops
          float blot2 = vn(uv * 1.3 + 5.0); float c1 = vn(uv * 2.4 + 2.0); float crack = 1.0 - smoothstep(0.0, 0.012, abs(c1 - 0.5)); crack *= smoothstep(0.58, 0.72, vn(uv * 0.33 + 9.0));
          col *= 0.86 + 0.28 * blot2; col *= 1.0 - 0.3 * crack * near; col *= 1.0 + 0.06 * n.y;
          float grit = vn(uv * 17.0) ; col *= 0.95 + 0.1 * grit;
          float strata = (1.0 - abs(n.y)) * (sin(vWorld.y * 2.6 + vn(vWorld.xz * 0.4) * 3.0) * 0.5 + 0.5); col *= 1.0 - 0.07 * strata;
        } else if (mat == 4) { // earth: clods and the odd pale pebble
          float clod = vn(uv * 5.0 + 1.0) * 0.6 + vn(uv * 13.0 + 4.0) * 0.4; col *= 0.82 + 0.34 * clod;
          float peb = step(0.965, hash3(vec3(floor(uv * 9.0), bp.y + 3.0))); col = mix(col, col * 1.5 + 0.08, peb * near);
        } else if (mat == 5) { // snow: soft drifts and glitter
          col *= 0.95 + 0.08 * vn(uv * 2.0); col += uSunCol * step(0.988, hash3(vec3(floor(uv * 12.0), 5.0))) * uSunAmt * 0.3 * near;
        } else if (mat == 6) { // wood: grain lines running along the boards
          float grain = sin(uv.y * 38.0 + vn(uv * vec2(2.0, 0.4)) * 7.0) * 0.5 + 0.5; col *= 0.93 + 0.1 * smoothstep(0.3, 0.8, grain) * near;
        } else if (mat == 7) { // leaves: dapple
          col *= 0.9 + 0.2 * vn(vWorld.xz * 2.2 + vWorld.y * 0.7);
        } else if (mat == 9 || mat == 13) { // tiles and slates: rows up the slope, each row offset half a tile, every tile its own shade, a dark seam between
          float along = abs(n.x) > abs(n.z) ? vWorld.z : vWorld.x; float rows = mat == 9 ? 3.0 : 4.5, tw = mat == 9 ? 2.0 : 2.6;
          float row = floor(vWorld.y * rows + 0.5); float ry = fract(vWorld.y * rows + 0.5);
          float tc = along * tw + mod(row, 2.0) * 0.5; float ti = floor(tc), tf = fract(tc);
          float seam = smoothstep(0.0, 0.07, tf) * smoothstep(1.0, 0.93, tf) * smoothstep(0.0, 0.1, ry);
          float own = hash3(vec3(ti, row, 2.0));
          col *= (0.72 + 0.28 * seam) * (0.9 + 0.2 * own) * (1.0 + (mat == 9 ? 0.1 : 0.03) * sin(tf * 3.1416)) * (0.92 + 0.08 * smoothstep(0.0, 0.5, ry));
          col *= 0.94 + 0.12 * vn(vec2(along, vWorld.y) * 0.5 + 3.0); // weathering in patches
        } else if (mat == 12) { // thatch: bundles of straw combed down the slope, in ragged rows
          float along = abs(n.x) > abs(n.z) ? vWorld.z : vWorld.x;
          float straw = vn(vec2(along * 42.0, vWorld.y * 5.0)) * 0.6 + vn(vec2(along * 90.0 + 2.0, vWorld.y * 9.0)) * 0.4;
          float row = fract(vWorld.y * 1.8 + vn(vec2(along * 1.5, 1.0)) * 0.3); float lip = smoothstep(0.0, 0.18, row) * (0.85 + 0.15 * smoothstep(0.7, 1.0, row));
          col *= (0.72 + 0.4 * straw) * (0.8 + 0.2 * lip) * (0.94 + 0.1 * vn(vec2(along, vWorld.y) * 0.4 + 7.0));
        } else if (mat == 10) { // plaster: soft trowel marks, a little grime low down
          col *= 0.95 + 0.07 * vn(uv * 3.0 + 1.0) + 0.03 * vn(uv * 11.0);
        } else if (mat == 14) { // dressed stone: courses half a block tall, each offset half a stone, mortar between, every stone its own shade; flags on the tops
          bool flatTop = abs(n.y) > 0.5; float cy = flatTop ? vWorld.z : vWorld.y * 2.0; float row = floor(cy); float ry = fract(cy);
          float cx = (flatTop ? vWorld.x : (abs(n.x) > 0.5 ? vWorld.z : vWorld.x)) + mod(row, 2.0) * 0.5; float cc = floor(cx); float rx = fract(cx);
          float mortar = min(smoothstep(0.0, 0.06, ry) * smoothstep(1.0, 0.94, ry), smoothstep(0.0, 0.035, rx) * smoothstep(1.0, 0.965, rx));
          float own = hash3(vec3(cc, row, 4.0));
          col *= mix(0.6, 1.0, mortar) * (0.9 + 0.2 * own) * (0.96 + 0.08 * vn(uv * 9.0)) * (0.95 + 0.1 * vn(uv * 0.6 + 2.0));
        } else if (mat == 11) { // cobbles: rounded stones packed in a bed of dark mortar
          vec2 q = uv * 3.2; vec2 ci = floor(q), cf = fract(q); float f1 = 9.0, f2 = 9.0, idc = 0.0;
          for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) { vec2 g = vec2(float(i), float(j)); vec2 o = vec2(hash3(vec3(ci + g, 1.0)), hash3(vec3(ci + g, 2.0))) * 0.7 + 0.15; float d = length(g + o - cf); if (d < f1) { f2 = f1; f1 = d; idc = hash3(vec3(ci + g, 3.0)); } else if (d < f2) f2 = d; }
          float mortar = smoothstep(0.0, 0.16, f2 - f1); float dome = 1.0 - f1 * 0.35;
          col *= mix(0.72, 1.0, mortar) * (0.88 + 0.24 * idc) * dome * (0.94 + 0.1 * vn(uv * 0.3 + 5.0));
        }
      }
    }
    // haze: blue with distance, warm toward the sun
    float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
    float toward = pow(max(dot(-V, uSun), 0.0), 6.0) * uSunAmt;
    vec3 haze = mix(skyFog(-V), uSunCol, toward * 0.45); // far things fade into the sky behind them, whatever its colour up there
    col = mix(col * uTint, haze, f);
    gl_FragColor = vec4(tonemap(col), alpha);
  }`;
  // ---- entities: smooth normals, ten bones, a soft cel ramp with rim light; a second pass draws a thin dark outline (inverted hull) ----
  const EVS = `
  attribute vec3 aPos; attribute vec4 aCol; attribute vec3 aNorm; attribute float aBone;
  uniform mat4 uPV; uniform mat4 uModel; uniform mat4 uBones[10]; uniform float uOutline; uniform vec4 uSway; uniform float uTime;
  varying vec4 vCol; varying vec3 vWorld; varying vec3 vNorm; varying vec3 vLocal;
  void main(){
    int b = int(aBone + 0.5);
    mat4 M = uModel * uBones[b];
    vec3 p = aPos;
    if (uSway.x > 0.0) { float w = clamp((uSway.w - aPos.z) / max(uSway.w * 1.6 + 0.6, 0.6), 0.0, 1.0); p.x += sin(aPos.z * uSway.y + uSway.z) * uSway.x * w * w; }
    vec3 n = normalize(mat3(M) * aNorm);
    vec4 w = M * vec4(p, 1.0);
    if (uOutline > 0.0) w.xyz += n * uOutline;
    vWorld = w.xyz; vNorm = n; vCol = aCol; vLocal = aPos;
    gl_Position = uPV * w;
  }`;
  const EFS = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  ${TONE}
  /*SHADOW*/
  varying vec4 vCol; varying vec3 vWorld; varying vec3 vNorm; varying vec3 vLocal;
  uniform vec3 uCam; uniform float uDay; uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform float uAmbient; uniform float uFogSky; uniform float uCoreGlow;
  uniform vec3 uLights[8]; uniform float uLightR[8]; uniform float uAlpha; uniform vec3 uTint; uniform float uSkyMul;
  uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uZenith; uniform float uSunAmt; uniform float uOutline; uniform float uFlash;
  float hash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  vec3 skyFog(vec3 d){ float h = d.y; vec3 c = mix(uFog, uZenith, pow(clamp(h, 0.0, 1.0), 0.55)); if (h < 0.0) c = mix(uFog, uFog * 0.82, clamp(-h * 4.0, 0.0, 1.0)); return mix(uFog, c, uFogSky); }
  void main(){
    vec3 toCam = uCam - vWorld; float dist = length(toCam); vec3 V = toCam / max(dist, 0.0001);
    float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
    if (uOutline > 0.0) { vec3 oc = vCol.rgb; float ol = dot(oc, vec3(0.3, 0.59, 0.11)); oc = clamp(mix(vec3(ol), oc, 1.5), 0.0, 1.0) * 0.26 + vec3(0.02, 0.015, 0.035); /* the line is the surface's own colour, deepened: ink, not black wire */ gl_FragColor = vec4(tonemap(mix(oc, skyFog(-V), f)), uAlpha); return; }
    vec3 n = normalize(vNorm); if (dot(n, V) < -0.15) n = -n;
    float sky = vCol.a; float emis = step(0.999, sky); float skyL = sky * uSkyMul;
    float torch = 0.0;
    for (int i = 0; i < 8; i++) { float d = distance(vWorld, uLights[i]); torch = max(torch, clamp(1.0 - d / max(uLightR[i], 0.001), 0.0, 1.0)); }
    torch = torch * torch * (3.0 - 2.0 * torch);
    float lam = max(dot(n, uSun), 0.0) * uSunAmt;
    float hl = (dot(n, uSun) * 0.5 + 0.5) * uSunAmt; // half-lambert: the shadow side still turns toward the light, the way toon shading does
    float ramp = smoothstep(0.4, 0.5, hl) * 0.8 + smoothstep(0.74, 0.92, hl) * 0.2; /* one clean shadow edge, then a soft lift toward the light */
    float sh = shadowAt(vWorld, n); ramp *= mix(0.25, 1.0, sh);
    vec3 amb = vec3(0.86, 0.9, 1.02) * (0.42 + 0.24 * uDay) * (0.84 + 0.2 * n.y);
    vec3 light = skyL * (amb * (0.88 + 0.12 * sh) + uSunCol * ramp * 0.78 * uDay);
    light = max(light, vec3(uAmbient)); light = max(light, vec3(1.0, 0.78, 0.52) * torch * 0.95);
    if (vWorld.y < 14.5 && uCoreGlow > 0.5) { float up = clamp((vWorld.y - 3.5) / 9.0, 0.0, 1.0); light = max(light, vec3(1.0, 0.42, 0.1) * (1.0 - up * 0.75) * (0.55 - 0.45 * n.y) * 1.1 + vec3(0.6, 0.16, 0.05) * 0.45); }
    light = mix(light, vec3(1.0), emis);
    vec3 vc = vCol.rgb; float lum = dot(vc, vec3(0.3, 0.59, 0.11)); vc = clamp(mix(vec3(lum), vc, 1.14), 0.0, 1.0);
    float lit = clamp(ramp * (0.4 + 0.6 * sh), 0.0, 1.0);
    vec3 shadeC = clamp(mix(vec3(lum), vc, 1.3), 0.0, 1.0) * vec3(0.9, 0.86, 1.04); /* shadows keep their colour and lean cool, the way painted cels do */
    vec3 col = mix(shadeC, vc, max(lit, emis)) * light;
    float rim = pow(1.0 - max(dot(n, V), 0.0), 3.5) * (0.16 + 0.16 * (1.0 - lam)) * skyL * (0.35 + 0.65 * uDay) * (1.0 - emis);
    col += (uZenith * 0.5 + vc * 0.5 + vec3(0.1)) * rim;
    vec3 H = normalize(uSun + V); float spec = smoothstep(0.55, 0.75, pow(max(dot(n, H), 0.0), 48.0)) * uSunAmt * uDay * 0.1 * skyL * (1.0 - emis) * sh; col += (vc * 0.5 + uSunCol * 0.5) * spec;
    col = mix(col, vec3(1.0, 0.95, 0.9), uFlash);
    float toward = pow(max(dot(-V, uSun), 0.0), 6.0) * uSunAmt;
    vec3 haze = mix(skyFog(-V), uSunCol, toward * 0.45); // far things fade into the sky behind them, whatever its colour up there
    col = mix(col * uTint, haze, f);
    gl_FragColor = vec4(tonemap(col), uAlpha);
  }`;
  // ---- sun shadows (WebGL2): a depth map rendered from the sun over the ground round the player, sampled with hardware 2x2 PCF ----
  const SHADOW_GLSL = (on) => on ? `
  uniform highp sampler2DShadow uShadow; uniform mat4 uLightPV; uniform float uShadowOn; uniform vec2 uShadowTexel;
  float shadowAt(vec3 wp, vec3 n){
    if (uShadowOn < 0.5) return 1.0;
    vec4 lp = uLightPV * vec4(wp + n * 0.05, 1.0); vec3 sc = lp.xyz / lp.w * 0.5 + 0.5;
    if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
    float z = sc.z - 0.0009;
    float s = texture(uShadow, vec3(sc.xy, z)) + texture(uShadow, vec3(sc.xy + vec2(uShadowTexel.x, 0.0), z)) + texture(uShadow, vec3(sc.xy + vec2(0.0, uShadowTexel.y), z)) + texture(uShadow, vec3(sc.xy + uShadowTexel, z));
    s *= 0.25;
    vec2 e = abs(sc.xy - 0.5) * 2.0; float edge = 1.0 - smoothstep(0.78, 1.0, max(e.x, e.y));
    return mix(1.0, s, edge * uShadowOn);
  }` : `float shadowAt(vec3 wp, vec3 n){ return 1.0; }`;
  const SH_VS_C = `attribute vec3 aPos; uniform mat4 uLightPV; uniform mat4 uModel; void main(){ gl_Position = uLightPV * uModel * vec4(aPos, 1.0); }`;
  const SH_VS_E = `attribute vec3 aPos; attribute float aBone; uniform mat4 uLightPV; uniform mat4 uModel; uniform mat4 uBones[10]; void main(){ int b = int(aBone + 0.5); gl_Position = uLightPV * uModel * uBones[b] * vec4(aPos, 1.0); }`;
  const SH_FS = `precision mediump float; void main(){ }`;
  let shProgC = null, shProgE = null, shFB = null, shTex = null, shSize = 0; const shlocC = {}, shlocE = {}; let lightPV = U.m4identity(); let shadowReady = false;
  function isGL2() { return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext; }
  function initShadows() {
    if (!isGL2()) return;
    try {
      shProgC = compile(SH_VS_C, SH_FS); shlocC.aPos = gl.getAttribLocation(shProgC, 'aPos'); shlocC.uLightPV = gl.getUniformLocation(shProgC, 'uLightPV'); shlocC.uModel = gl.getUniformLocation(shProgC, 'uModel');
      shProgE = compile(SH_VS_E, SH_FS); shlocE.aPos = gl.getAttribLocation(shProgE, 'aPos'); shlocE.aBone = gl.getAttribLocation(shProgE, 'aBone'); shlocE.uLightPV = gl.getUniformLocation(shProgE, 'uLightPV'); shlocE.uModel = gl.getUniformLocation(shProgE, 'uModel'); shlocE.uBones = gl.getUniformLocation(shProgE, 'uBones');
      shSize = isMobile ? 1024 : 2048;
      shTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, shSize, shSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      shFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shFB); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shTex, 0);
      gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (!ok) { console.warn('shadows off: framebuffer incomplete'); shProgC = null; return; }
      shadowReady = true; if (state.shadows == null) state.shadows = true;
    } catch (e) { console.warn('shadows off:', e.message); shProgC = null; }
  }
  const m4lookAt = (eye, c, up) => { let fx = c[0] - eye[0], fy = c[1] - eye[1], fz = c[2] - eye[2]; let l = Math.hypot(fx, fy, fz) || 1; fx /= l; fy /= l; fz /= l; let rx = fy * up[2] - fz * up[1], ry = fz * up[0] - fx * up[2], rz = fx * up[1] - fy * up[0]; l = Math.hypot(rx, ry, rz) || 1; rx /= l; ry /= l; rz /= l; const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx; const m = new Float32Array(16); m[0] = rx; m[4] = ry; m[8] = rz; m[1] = ux; m[5] = uy; m[9] = uz; m[2] = -fx; m[6] = -fy; m[10] = -fz; m[12] = -(rx * eye[0] + ry * eye[1] + rz * eye[2]); m[13] = -(ux * eye[0] + uy * eye[1] + uz * eye[2]); m[14] = (fx * eye[0] + fy * eye[1] + fz * eye[2]); m[15] = 1; return m; };
  const m4ortho = (l, r, b, t, n, f) => { const m = new Float32Array(16); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m; };
  // the shadow pass: everything solid near the player, seen from the sun
  let shFrame = 1;
  function renderShadows(world, player, cam, entities, visible) {
    const on = shadowReady && state.shadows !== false && state.skyPass && state.sunAmt > 0.02 && state.sun[1] > 0.04;
    state.shadowOn = on ? Math.min(1, (state.sun[1] - 0.04) / 0.12) * state.sunAmt : 0;
    if (!on) return;
    // on a phone the sun's view is redrawn every third frame: the map keeps its own matrix, so a skipped frame only means shadows a frame old
    if (isMobile && lightPV && (shFrame = (shFrame + 1) % 3) !== 0) return; // every third frame: the sun moves slowly, and you hardly see a shadow two frames old
    const E = isMobile ? 30 : 44; const sun = state.sun;
    const f = U.forwardVec(cam.yaw, 0); let cx = player.x + f[0] * E * 0.3, cy = player.y, cz = player.z + f[2] * E * 0.3;
    const up = Math.abs(sun[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    let view = m4lookAt([cx + sun[0] * 120, cy + sun[1] * 120, cz + sun[2] * 120], [cx, cy, cz], up);
    // snap the centre to the shadow texel grid so the shadows do not swim when the camera turns
    const texel = 2 * E / shSize; const vx = view[0] * cx + view[4] * cy + view[8] * cz + view[12], vy = view[1] * cx + view[5] * cy + view[9] * cz + view[13];
    const dx = Math.round(vx / texel) * texel - vx, dy = Math.round(vy / texel) * texel - vy;
    cx += view[0] * dx + view[1] * dy; cy += view[4] * dx + view[5] * dy; cz += view[8] * dx + view[9] * dy;
    view = m4lookAt([cx + sun[0] * 120, cy + sun[1] * 120, cz + sun[2] * 120], [cx, cy, cz], up);
    lightPV = U.m4mul(m4ortho(-E, E, -E, E, 1, 260), view);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shFB); gl.viewport(0, 0, shSize, shSize); gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2.0);
    gl.useProgram(shProgC); gl.uniformMatrix4fv(shlocC.uLightPV, false, lightPV);
    const ident = U.m4identity(); const R2 = (E + 14) * (E + 14);
    for (const c of world.chunks.values()) { if (!c.mesh || !c.mesh.op) continue; const mx = c.cx * CH + 8, mz = c.cz * CH + 8; if ((mx - cx) ** 2 + (mz - cz) ** 2 > R2) continue; ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(shlocC.uModel, false, ident); gl.bindBuffer(gl.ARRAY_BUFFER, c.mesh.op.vbo); gl.enableVertexAttribArray(shlocC.aPos); gl.vertexAttribPointer(shlocC.aPos, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.mesh.op.ibo); gl.drawElements(gl.TRIANGLES, c.mesh.op.count, gl.UNSIGNED_INT, 0); }
    gl.useProgram(shProgE); gl.uniformMatrix4fv(shlocE.uLightPV, false, lightPV); const now = performance.now();
    for (const e of entities) { if (!e.mesh || !e.mesh.count || e.isFx || e.noShadow) continue; if ((e.x - cx) ** 2 + (e.z - cz) ** 2 > R2) continue;
      gl.uniformMatrix4fv(shlocE.uModel, false, e.M || U.m4model(e.x, e.y + (e.hover || 0), e.z, e.yaw, e.scale || 1));
      const pose = (typeof Anim !== 'undefined' && e.model && e.model.bones) ? Anim.pose(e, now) : null; gl.uniformMatrix4fv(shlocE.uBones, false, pose ? pose.mats : IDENT_BONES);
      gl.bindBuffer(gl.ARRAY_BUFFER, e.mesh.vbo); gl.enableVertexAttribArray(shlocE.aPos); gl.vertexAttribPointer(shlocE.aPos, 3, gl.FLOAT, false, 0, 0);
      if (e.mesh.bbo) { gl.bindBuffer(gl.ARRAY_BUFFER, e.mesh.bbo); gl.enableVertexAttribArray(shlocE.aBone); gl.vertexAttribPointer(shlocE.aBone, 1, gl.FLOAT, false, 0, 0); } else { gl.disableVertexAttribArray(shlocE.aBone); gl.vertexAttrib1f(shlocE.aBone, 0); }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e.mesh.ibo); gl.drawElements(gl.TRIANGLES, e.mesh.count, gl.UNSIGNED_INT, 0); }
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.disable(gl.CULL_FACE); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
  }
  // bind the shadow map and its matrix for a program (its loc map must hold uShadow, uLightPV, uShadowOn, uShadowTexel)
  function bindShadow(L, unit) {
    if (!L.uLightPV) return;
    gl.uniform1f(L.uShadowOn, state.shadowOn || 0); if (!shadowReady) return;
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, shTex); gl.uniform1i(L.uShadow, unit); gl.uniformMatrix4fv(L.uLightPV, false, lightPV); gl.uniform2f(L.uShadowTexel, 1 / shSize, 1 / shSize);
  }
  let eprog = null; const eloc = {}; const IDENT_BONES = new Float32Array(160); for (let i = 0; i < 10; i++) { IDENT_BONES[i * 16] = IDENT_BONES[i * 16 + 5] = IDENT_BONES[i * 16 + 10] = IDENT_BONES[i * 16 + 15] = 1; }
  function initEntityProg() {
    eprog = compile(EVS, EFS);
    for (const n of ['aPos', 'aCol', 'aNorm', 'aBone']) eloc[n] = gl.getAttribLocation(eprog, n);
    for (const n of ['uPV', 'uModel', 'uBones', 'uOutline', 'uSway', 'uTime', 'uCam', 'uDay', 'uFog', 'uFogNear', 'uFogFar', 'uAmbient', 'uLights', 'uLightR', 'uAlpha', 'uTint', 'uSkyMul', 'uSun', 'uSunCol', 'uZenith', 'uSunAmt', 'uFlash', 'uShadow', 'uLightPV', 'uShadowOn', 'uShadowTexel', 'uFogSky', 'uCoreGlow']) eloc[n] = gl.getUniformLocation(eprog, n);
  }
  // ---- the meadow: one blade shape drawn tens of thousands of times around you (WebGL2 instancing) ----
  const GVS = `#version 300 es
  in vec2 aBlade;
  uniform mat4 uPV; uniform vec3 uCam; uniform vec2 uOrigin; uniform float uSpacing; uniform int uSide; uniform float uRIn; uniform float uROut; uniform float uScale; uniform float uWidth;
  uniform highp sampler2D uHM; uniform vec2 uHMO; uniform float uTime;
  out vec3 vC; out vec3 vW; out float vH;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec4 hm(ivec2 t){ return texelFetch(uHM, clamp(t, ivec2(0), ivec2(127)), 0); }
  float soilH(vec4 t, float h0){ float h = t.a * 255.0; bool soil = (t.r + t.g > 0.004) || t.b > 0.998; return (soil && abs(h - h0) <= 2.5) ? h : h0; }
  void main(){
    int ix = gl_InstanceID % uSide, iz = gl_InstanceID / uSide;
    vec2 cell = uOrigin + vec2(float(ix), float(iz)) * uSpacing;
    float h1 = hash(cell), h2 = hash(cell + 17.31), h3 = hash(cell + 41.77);
    vec2 p = cell + (vec2(h1, h2) - 0.5) * uSpacing * 0.95;
    float d = distance(p, uCam.xz);
    float fade = 1.0 - smoothstep(uROut * 0.72, uROut, d);
    if (uRIn > 0.0) fade *= smoothstep(uRIn - 2.5, uRIn + 0.5, d);
    vec2 t = p - uHMO - 0.5; ivec2 i0 = ivec2(floor(t)); vec2 f = fract(t);
    vec4 own = hm(ivec2(floor(p - uHMO)));
    float h0 = own.a * 255.0;
    // the ground height, blended from the four soil texels around the blade; a wall, trunk or cliff among them counts as the blade's own ground
    vec4 a = hm(i0), b = hm(i0 + ivec2(1, 0)), c = hm(i0 + ivec2(0, 1)), e = hm(i0 + ivec2(1, 1));
    float ha = soilH(a, h0), hb = soilH(b, h0), hc = soilH(c, h0), he = soilH(e, h0);
    float grass = step(0.004, own.r + own.g);
    float zone = own.b; float tall = smoothstep(0.6, 0.78, zone), lawn = 1.0 - smoothstep(0.22, 0.4, zone);
    float y = mix(mix(ha, hb, f.x), mix(hc, he, f.x), f.y);
    // clumps: thick patches and thinner ones, so the meadow is not a uniform brush
    vec2 cp = cell * 0.45; vec2 ci = floor(cp), cf = fract(cp); cf = cf * cf * (3.0 - 2.0 * cf);
    float clump = mix(mix(hash(ci), hash(ci + vec2(1.0, 0.0)), cf.x), mix(hash(ci + vec2(0.0, 1.0)), hash(ci + vec2(1.0, 1.0)), cf.x), cf.y);
    float sc = fade * grass * (0.6 + h3 * 0.7) * (0.62 + 0.76 * clump);
    if (sc < 0.03) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vC = vec3(0.0); vW = vec3(0.0); vH = 0.0; return; }
    float ang = h1 * 6.2831; vec2 dir = vec2(cos(ang), sin(ang));
    float carpet = 1.0 - smoothstep(0.03, 0.08, zone);
    float hm2 = mix(1.0, 0.38, lawn) * mix(1.0, 2.5, tall) * mix(1.0, 0.5, carpet) * (0.85 + 0.3 * clump);
    float flowerP = smoothstep(0.55, 0.8, sin(p.x * 0.11 + 1.3) * sin(p.y * 0.13 + 0.7) * 0.5 + 0.5 + h3 * 0.2) * (1.0 - tall); bool flower = carpet < 0.5 && hash(cell + 5.13) < 0.03 + flowerP * 0.09;
    if (flower) hm2 = max(hm2, 0.8);
    float hgt = 0.44 * sc * uScale * hm2 * (1.0 + (h2 - 0.5) * 0.5 * tall); float wid = uWidth * (1.0 - aBlade.y * 0.8) * mix(1.0, 0.8, tall) * (flower ? 0.6 : 1.0);
    hgt *= 1.0 - (1.0 - smoothstep(0.4, 1.7, d)) * step(uCam.y, y + hgt + 0.3); // blades that would cross the lens when the camera sits low in the grass bow out of its way
    float gust = sin(dot(p, vec2(0.37, 0.2)) - uTime * 1.6) * 0.5 + 0.5; gust = gust * gust;
    float bend = (sin(uTime * 2.6 + h2 * 6.2831 + p.x * 0.7) * 0.05 + gust * 0.2 + 0.06 + tall * (0.1 + gust * 0.25)) * aBlade.y * aBlade.y;
    vec3 w = vec3(p.x + dir.x * aBlade.x * wid, y + aBlade.y * hgt, p.y + dir.y * aBlade.x * wid);
    w.x += bend * 0.85 * (0.4 + hgt * 2.0); w.z += bend * 0.48 * (0.4 + hgt * 2.0); w.y -= bend * bend * 0.6;
    vec3 tint = vec3(own.r, own.g, own.g * 0.42);
    float k = pow(aBlade.y, 0.85);
    vC = mix(tint * vec3(0.3, 0.42, 0.62), tint * vec3(1.02, 1.1, 0.74) + vec3(0.05, 0.05, 0.0), k) * (0.84 + 0.3 * h3);
    vC *= 1.0 + gust * 0.22 * aBlade.y;
    vC *= vec3(1.0 + (h1 - 0.5) * 0.14, 1.0, 1.0 - (h1 - 0.5) * 0.1); // some blades warmer, some cooler
    float lum = dot(vC, vec3(0.3, 0.59, 0.11)); vC = mix(vec3(lum), vC, 0.76) * vec3(1.04, 1.0, 0.86);
    vC = mix(vC, vC * vec3(1.12, 1.08, 0.82) + vec3(0.06, 0.05, 0.0), tall * aBlade.y * 0.6); // tall grass goes pale and golden at the tips
    if (flower && aBlade.y > 0.6) { float fk = hash(cell + 9.1); vC = fk < 0.45 ? vec3(0.96, 0.96, 0.92) : fk < 0.7 ? vec3(0.55, 0.65, 1.0) : fk < 0.88 ? vec3(1.0, 0.86, 0.3) : vec3(0.95, 0.55, 0.7); }
    vW = w; vH = aBlade.y;
    gl_Position = uPV * vec4(w, 1.0);
  }`;
  const GFS = `#version 300 es
  precision highp float;
  ${TONE}
  /*SHADOW*/
  in vec3 vC; in vec3 vW; in float vH; out vec4 o;
  uniform vec3 uCam; uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uSunAmt; uniform float uDay; uniform vec3 uTint; uniform vec3 uZenith; uniform float uFogSky;
  vec3 skyFog(vec3 d){ float h = d.y; vec3 c = mix(uFog, uZenith, pow(clamp(h, 0.0, 1.0), 0.55)); if (h < 0.0) c = mix(uFog, uFog * 0.82, clamp(-h * 4.0, 0.0, 1.0)); return mix(uFog, c, uFogSky); }
  void main(){
    float dist = distance(vW, uCam); vec3 V = (uCam - vW) / max(dist, 0.001);
    float sh = shadowAt(vW, vec3(0.0, 1.0, 0.0));
    vec3 light = vec3(0.78, 0.86, 1.05) * (0.42 + 0.26 * uDay) * (0.7 + 0.3 * vH) * (0.85 + 0.15 * sh) + uSunCol * uSunAmt * uDay * (0.4 + 0.45 * vH) * sh;
    float back = pow(max(dot(-V, uSun), 0.0), 3.0) * uSunAmt * vH * sh; // sun through the blades
    float sheen = pow(max(dot(-V, uSun), 0.0), 14.0) * uSunAmt * vH * vH * sh; // the field shines toward the sun
    vec3 col = vC * light + vC * uSunCol * back * 0.5 + uSunCol * sheen * 0.35;
    float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
    o = vec4(tonemap(mix(col * uTint, skyFog(-V), f)), 1.0);
  }`;
  let grassProg = null, gloc = {}, grassBuf = null, hmTex = null, hmData = null, hmCenter = null, hmT = 0;
  function initGrass() {
    if (!(typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext)) return;
    try {
      const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, GVS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, GFS.replace('/*SHADOW*/', SHADOW_GLSL(true)))); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      grassProg = p; gloc.aBlade = gl.getAttribLocation(p, 'aBlade');
      for (const n of ['uPV', 'uCam', 'uOrigin', 'uSpacing', 'uSide', 'uRIn', 'uROut', 'uScale', 'uWidth', 'uHM', 'uHMO', 'uTime', 'uFog', 'uFogNear', 'uFogFar', 'uSun', 'uSunCol', 'uSunAmt', 'uDay', 'uTint', 'uShadow', 'uLightPV', 'uShadowOn', 'uShadowTexel', 'uZenith', 'uFogSky']) gloc[n] = gl.getUniformLocation(p, n);
      // a blade: two quads tapering to a point (5 vertices, a strip)
      grassBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, grassBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, 0, 0.5, 0, -0.42, 0.5, 0.42, 0.5, 0, 1]), gl.STATIC_DRAW);
      hmTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, hmTex); hmData = new Uint8Array(128 * 128 * 4);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, hmData);
    } catch (e) { console.warn('grass off:', e.message); grassProg = null; }
  }
  // villages keep a short even carpet: refreshed with the heightmap
  let villCache = [], villT = 0;
  function nearVillages(cx, cz) {
    const now = performance.now(); if (now - villT < 3000 && villCache.cx !== undefined && Math.abs(villCache.cx - cx) < 24 && Math.abs(villCache.cz - cz) < 24) return villCache;
    villT = now; let list = [];
    try { if (typeof Village !== 'undefined' && Village.markers) list = Village.markers(cx, cz, 1).filter(m => m.kind === 'village'); } catch (e) { list = []; }
    if (typeof G !== 'undefined' && G && G.founded) for (const f of G.founded) if (f && f.x !== undefined && (!f.world || !G.worldId || f.world === G.worldId)) list.push({ x: f.x, z: f.z });
    list.cx = cx; list.cz = cz; villCache = list; return list;
  }
  function inVillage(x, z) { for (const v of villCache) { const dx = x - v.x, dz = z - v.z; if (dx * dx + dz * dz < 40 * 40) return true; } return false; }
  function grassZone(world, x, z, biome) {
    if (villCache.length && inVillage(x, z)) return 0;
    let v = U.vnoise2(x, z, 46, WORLD_W, world.seed + 909) * 0.7 + U.vnoise2(x, z, 13, WORLD_W, world.seed + 913) * 0.3;
    if (biome === BIOME.PLAINS || biome === BIOME.SWAMP) v += 0.12; else if (biome === BIOME.FOREST) v -= 0.1; else if (biome === BIOME.MOUNTAIN || biome === BIOME.SNOW) v -= 0.25;
    return U.clamp(v, 0.1, 1);
  }
  // the ground near you, as a little map: grass colour where grass grows, the height of the top everywhere
  function refreshHeightmap(world, cx, cz) {
    const ox = cx - 64, oz = cz - 64; const d = hmData; nearVillages(cx, cz);
    for (let i = 0; i < 128; i++) for (let j = 0; j < 128; j++) {
      const x = ox + i, z = oz + j; const ch = world.chunks.get(Math.floor(x / CH) + ',' + Math.floor(z / CH)); const k = (j * 128 + i) * 4;
      if (!ch) { d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = 0; continue; }
      const lx = x - Math.floor(x / CH) * CH, lz = z - Math.floor(z / CH) * CH;
      // down through the canopy, bushes and flowers to the ground itself
      let y = ch.tops[lx * CH + lz]; let id = ch.blocks[(lx * CH + lz) * WH + y]; while (y > 0 && (id === B.AIR || isLeaf(id) || id === B.BERRY || (BLOCKS[id].partial && !BLOCKS[id].solid))) { y--; id = ch.blocks[(lx * CH + lz) * WH + y]; }
      const above = ch.blocks[(lx * CH + lz) * WH + y + 1];
      const grass = id === B.GRASS && (above === B.AIR || (BLOCKS[above].partial && !BLOCKS[above].solid)); // blades grow through flowers and pebbles, not through a bush or a boulder
      const ti = (lx * CH + lz) * 3;
      // red, green: the grass colour (0 where no grass grows); blue: the kind of grass, or 255 for bare soil; alpha: the height of the top.
      // Blades read their height from the four texels around them, and only from soil ones: a wall or a trunk is not ground they should climb
      d[k] = grass ? Math.max(1, Math.min(255, ch.tint[ti] * 255)) : 0; d[k + 1] = grass ? Math.max(1, Math.min(255, ch.tint[ti + 1] * 255)) : 0; d[k + 2] = grass ? Math.max(1, Math.min(253, Math.round(grassZone(world, x, z, world.colInfo(x, z).biome) * 253))) : SOIL.has(id) ? 255 : 0; d[k + 3] = Math.min(255, y + 1);
    }
    gl.bindTexture(gl.TEXTURE_2D, hmTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, d);
    hmCenter = { x: cx, z: cz, ox, oz };
  }
  function drawGrass(world, player, pv, cam) {
    if (!grassProg || !state.skyPass) return;
    const cx = Math.floor(player.x), cz = Math.floor(player.z); const now = performance.now();
    if (!hmCenter || Math.abs(cx - hmCenter.x) > 6 || Math.abs(cz - hmCenter.z) > 6 || now - hmT > 1500) { refreshHeightmap(world, cx, cz); hmT = now; }
    gl.useProgram(grassProg);
    gl.uniformMatrix4fv(gloc.uPV, false, pv); gl.uniform3f(gloc.uCam, cam.x, cam.y, cam.z); gl.uniform1f(gloc.uTime, now / 1000);
    gl.uniform3fv(gloc.uFog, state.fogColor); gl.uniform3fv(gloc.uZenith, state.zenith || state.fogColor); gl.uniform1f(gloc.uFogSky, state.fogSky ? 1 : 0); gl.uniform1f(gloc.uFogNear, state.fogNear); gl.uniform1f(gloc.uFogFar, state.fogFar); gl.uniform3fv(gloc.uSun, state.sun); gl.uniform3fv(gloc.uSunCol, state.sunCol); gl.uniform1f(gloc.uSunAmt, state.sunAmt); gl.uniform1f(gloc.uDay, state.dayLight); gl.uniform3fv(gloc.uTint, state.tint);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hmTex); gl.uniform1i(gloc.uHM, 0); gl.uniform2f(gloc.uHMO, hmCenter.ox, hmCenter.oz); bindShadow(gloc, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, grassBuf); gl.enableVertexAttribArray(gloc.aBlade); gl.vertexAttribPointer(gloc.aBlade, 2, gl.FLOAT, false, 0, 0);
    const q = state.grassQuality || 1; // 1 full, 0.7 lighter
    const rings = isMobile ? [[0.125 / q, 0, 9, 1, 0.07], [0.24 / q, 9, 19, 1.3, 0.1], [0.5, 19, 34, 1.6, 0.17]] : [[0.1 / q, 0, 11, 1, 0.065], [0.2 / q, 11, 24, 1.3, 0.1], [0.45, 24, 44, 1.6, 0.16]];
    for (const [sp, rin, rout, scl, wid] of rings) {
      const side = Math.ceil(rout * 2 / sp); const ox = Math.floor((player.x - rout) / sp) * sp, oz = Math.floor((player.z - rout) / sp) * sp;
      gl.uniform2f(gloc.uOrigin, ox, oz); gl.uniform1f(gloc.uSpacing, sp); gl.uniform1i(gloc.uSide, side); gl.uniform1f(gloc.uRIn, rin); gl.uniform1f(gloc.uROut, rout); gl.uniform1f(gloc.uScale, scl); gl.uniform1f(gloc.uWidth, wid);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 5, side * side);
    }
    gl.disableVertexAttribArray(gloc.aBlade);
    gl.useProgram(prog);
  }
  // ---- the sky: gradient, the sun and its glow, drifting clouds ----
  const SVS = `attribute vec2 aPos; varying vec2 vP; void main(){ vP = aPos; gl_Position = vec4(aPos, 0.999, 1.0); }`;
  const SFS = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  ${TONE}
  varying vec2 vP;
  uniform vec3 uFwd; uniform vec3 uRight; uniform vec3 uUp; uniform float uTan; uniform float uAspect;
  uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uSunAmt; uniform float uTime; uniform float uClouds; uniform float uNight;
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
  void main(){
    vec3 rd = normalize(uFwd + uRight * vP.x * uTan * uAspect + uUp * vP.y * uTan);
    float h = rd.y;
    vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55));
    if (h < 0.0) col = mix(uHorizon, uHorizon * 0.82, clamp(-h * 4.0, 0.0, 1.0));
    float s = max(dot(rd, uSun), 0.0);
    col += uSunCol * (pow(s, 900.0) * 6.0 + pow(s, 60.0) * 0.4 + pow(s, 6.0) * 0.18) * uSunAmt;
    if (uClouds > 0.01 && h > 0.0) {
      vec2 uv = rd.xz / (h + 0.12) * 1.4 + vec2(uTime * 0.012, uTime * 0.004);
      float c = fbm(uv); float cov = smoothstep(0.62 - 0.25 * uClouds, 0.95, c) * smoothstep(0.0, 0.18, h);
      vec3 lit = mix(vec3(0.92, 0.94, 1.0), uSunCol * 1.05, 0.25 + 0.5 * pow(s, 4.0)) * (0.4 + 0.6 * (1.0 - uNight));
      vec3 shade = mix(uHorizon, vec3(0.55, 0.6, 0.7), 0.5) * (0.45 + 0.55 * (1.0 - uNight));
      col = mix(col, mix(shade, lit, smoothstep(0.4, 0.95, c)), cov * 0.9);
    }
    gl_FragColor = vec4(tonemap(col), 1.0);
  }`;
  const LVS = `attribute vec3 aPos; uniform mat4 uPV; void main(){ gl_Position = uPV * vec4(aPos,1.0); }`;
  const LFS = `precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor = uColor; }`;

  function compile(vs, fs) {
    const p = gl.createProgram();
    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    fs = fs.replace('/*SHADOW*/', SHADOW_GLSL(gl2));
    if (gl2) { vs = '#version 300 es\n#define attribute in\n#define varying out\n' + vs; fs = '#version 300 es\n#define varying in\nout highp vec4 fragOut;\n#define gl_FragColor fragOut\n' + fs; }
    else { if (fs.indexOf('dFdx') >= 0) { gl.getExtension('OES_standard_derivatives'); fs = '#extension GL_OES_standard_derivatives : enable\n' + fs; } }
    const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  function init(cv, mobile) {
    canvas = cv; isMobile = mobile;
    const opts = { antialias: true, alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: false };
    gl = cv.getContext('webgl2', opts);
    if (!gl) { gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts); if (!gl) throw new Error('WebGL is not available'); if (!gl.getExtension('OES_element_index_uint')) throw new Error('32-bit indices unsupported'); }
    prog = compile(VS, FS);
    for (const n of ['aPos', 'aCol', 'aMat', 'aNorm']) loc[n] = gl.getAttribLocation(prog, n);
    for (const n of ['uPV', 'uModel', 'uTime', 'uWave', 'uCam', 'uDay', 'uFog', 'uFogNear', 'uFogFar', 'uAmbient', 'uLights', 'uLightR', 'uAlpha', 'uTint', 'uSkyMul', 'uSun', 'uSunCol', 'uZenith', 'uGrid', 'uSunAmt', 'uQuality', 'uPlayer', 'uBladeShade', 'uShadow', 'uLightPV', 'uShadowOn', 'uShadowTexel', 'uFogSky', 'uCoreGlow']) loc[n] = gl.getUniformLocation(prog, n);
    skyProg = compile(SVS, SFS); sloc.aPos = gl.getAttribLocation(skyProg, 'aPos'); for (const n of ['uFwd', 'uRight', 'uUp', 'uTan', 'uAspect', 'uHorizon', 'uZenith', 'uSun', 'uSunCol', 'uSunAmt', 'uTime', 'uClouds', 'uNight']) sloc[n] = gl.getUniformLocation(skyProg, n);
    initGrass(); initEntityProg(); initShadows();
    skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    lineProg = compile(LVS, LFS);
    lloc.aPos = gl.getAttribLocation(lineProg, 'aPos'); lloc.uPV = gl.getUniformLocation(lineProg, 'uPV'); lloc.uColor = gl.getUniformLocation(lineProg, 'uColor');
    lineBuf = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    state.viewDist = mobile ? 48 : 80; // as far as the land is built around you (3 chunks on a phone, 5 on a desktop)
    resize();
  }
  // graphics presets: what the phone can afford. full: everything; balanced: lighter grass, fewer pixels; light: no shadows, sparse grass, screen pixels
  const QUALITY = { full: { shadows: true, grassQuality: 1, dprCap: null, outlines: true, viewMul: 1 }, balanced: { shadows: true, grassQuality: 0.7, dprCap: 1.4, outlines: true, viewMul: 0.9 }, light: { shadows: false, grassQuality: 0.5, dprCap: 1.0, outlines: true, viewMul: 0.75 } };
  function setQuality(name) {
    const Q = QUALITY[name] || QUALITY.full; state.quality = QUALITY[name] ? name : 'full';
    state.shadows = Q.shadows; state.grassQuality = Q.grassQuality; state.dprCap = Q.dprCap; state.outlines = Q.outlines; state.viewDist = Math.round((isMobile ? 48 : 80) * Q.viewMul);
    try { localStorage.setItem('stratakin-gfx', state.quality); } catch (e) {}
    resize();
  }
  try { const g = localStorage.getItem('stratakin-gfx'); if (g && QUALITY[g]) state.pendingQuality = g; } catch (e) {}
  // frame rate, smoothed, for the HUD
  let fpsT = 0, fpsN = 0; state.fps = 0;
  function tickFps() { const now = performance.now(); if (fpsT === 0) { fpsT = now; return; } fpsN++; if (now - fpsT >= 1000) { state.fps = Math.round(fpsN * 1000 / (now - fpsT)); fpsN = 0; fpsT = now; adapt(state.fps); } }
  // automatic resolution: a phone that cannot hold a smooth frame quietly draws fewer pixels (down to 60% of its normal sharpness), and goes back
  // up once there is headroom. Judged over a few seconds so a single hitch (a chunk building, a save) does not change anything
  state.dynScale = 1; let slowSecs = 0, fastSecs = 0;
  function adapt(fps) {
    if (!isMobile || document.hidden) return;
    if (fps < 42) { slowSecs++; fastSecs = 0; } else if (fps > 56) { fastSecs++; slowSecs = 0; } else { slowSecs = Math.max(0, slowSecs - 1); fastSecs = 0; }
    if (slowSecs >= 3 && state.dynScale > 0.6) { state.dynScale = Math.max(0.6, +(state.dynScale - 0.1).toFixed(2)); slowSecs = 0; resize(); }
    else if (fastSecs >= 8 && state.dynScale < 1) { state.dynScale = Math.min(1, +(state.dynScale + 0.1).toFixed(2)); fastSecs = 0; resize(); }
  }
  function resize() {
    const dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, state.dprCap || (isMobile ? 2.25 : 2)) * (state.dynScale || 1));
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function upload(mb) {
    if (mb.empty()) return null;
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, mb.pos.subarray(0, mb.nv * 3), gl.STATIC_DRAW);
    const cbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cbo); gl.bufferData(gl.ARRAY_BUFFER, mb.col.subarray(0, mb.nv * 4), gl.STATIC_DRAW);
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mb.idx.subarray(0, mb.ni), gl.STATIC_DRAW);
    const out = { vbo, cbo, ibo, count: mb.ni, nbo: null, bbo: null, mbo: null, tris: mb.ni / 3, chunk: mb.chunk };
    if (mb.chunk) { let a = 1e9, b = -1e9; const P = mb.pos; for (let i = 1, n = mb.nv * 3; i < n; i += 3) { const y = P[i]; if (y < a) a = y; if (y > b) b = y; } out.y0 = a; out.y1 = b; } // how high the chunk's land actually reaches: culling uses it
    if (mb.chunk) { out.mbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, out.mbo); gl.bufferData(gl.ARRAY_BUFFER, mb.mat.subarray(0, mb.nv), gl.STATIC_DRAW);
      const n8 = new Int8Array(mb.nv * 3); const nr = mb.nrm; for (let i = 0; i < mb.nv * 3; i++) n8[i] = Math.max(-127, Math.min(127, Math.round(nr[i] * 127))); out.nbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, out.nbo); gl.bufferData(gl.ARRAY_BUFFER, n8, gl.STATIC_DRAW); }
    else if (mb.nrm) { out.nbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, out.nbo); gl.bufferData(gl.ARRAY_BUFFER, mb.nrm.subarray(0, mb.nv * 3), gl.STATIC_DRAW); out.bbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, out.bbo); gl.bufferData(gl.ARRAY_BUFFER, mb.bone.subarray(0, mb.nv), gl.STATIC_DRAW); }
    return out;
  }
  function freeMesh(m) { if (!m) return; gl.deleteBuffer(m.vbo); gl.deleteBuffer(m.cbo); gl.deleteBuffer(m.ibo); if (m.nbo) gl.deleteBuffer(m.nbo); if (m.bbo) gl.deleteBuffer(m.bbo); if (m.mbo) gl.deleteBuffer(m.mbo); }
  function drawMesh(m) {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.enableVertexAttribArray(loc.aPos); gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.cbo); gl.enableVertexAttribArray(loc.aCol); gl.vertexAttribPointer(loc.aCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    if (m.mbo) { gl.bindBuffer(gl.ARRAY_BUFFER, m.mbo); gl.enableVertexAttribArray(loc.aMat); gl.vertexAttribPointer(loc.aMat, 1, gl.UNSIGNED_BYTE, false, 0, 0); } else { gl.disableVertexAttribArray(loc.aMat); gl.vertexAttrib1f(loc.aMat, 0); }
    if (m.nbo && m.chunk) { gl.bindBuffer(gl.ARRAY_BUFFER, m.nbo); gl.enableVertexAttribArray(loc.aNorm); gl.vertexAttribPointer(loc.aNorm, 3, gl.BYTE, true, 0, 0); } else { gl.disableVertexAttribArray(loc.aNorm); gl.vertexAttrib3f(loc.aNorm, 0, 0, 0); }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0);
  }
  // an entity mesh through the entity program (normals, bones)
  function drawEntityMesh(m) {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.enableVertexAttribArray(eloc.aPos); gl.vertexAttribPointer(eloc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.cbo); gl.enableVertexAttribArray(eloc.aCol); gl.vertexAttribPointer(eloc.aCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    if (m.nbo) { gl.bindBuffer(gl.ARRAY_BUFFER, m.nbo); gl.enableVertexAttribArray(eloc.aNorm); gl.vertexAttribPointer(eloc.aNorm, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, m.bbo); gl.enableVertexAttribArray(eloc.aBone); gl.vertexAttribPointer(eloc.aBone, 1, gl.FLOAT, false, 0, 0); }
    else { gl.disableVertexAttribArray(eloc.aNorm); gl.vertexAttrib3f(eloc.aNorm, 0, 1, 0); gl.disableVertexAttribArray(eloc.aBone); gl.vertexAttrib1f(eloc.aBone, 0); }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0);
  }

  // ---------- chunk meshing ----------
  // material classes for the fragment shader: 1 grass top, 2 sand, 3 rock, 4 earth, 5 snow, 6 wood, 7 leaves, 8 lava, 9 tiles, 10 plaster, 11 cobbles, 12 thatch, 13 slate, 14 dressed stone, 15 basalt, 16 cloud
  const MAT_OF = {}; for (const [ids, m] of [[[B.SAND, B.DUNE, B.SALTCRUST], 2], [[B.STONE, B.GRAVEL, B.MOSS, B.COPPER, B.IRON, B.EMBER, B.GOLD, B.DIAMOND, B.BEDROCK, B.RUBBLE, B.SELENITE, B.TYCHO, B.AMBER, B.REGOLITH, B.BOULDER], 3], [[B.DIRT], 4], [[B.SNOW], 5], [[B.PLANKS, B.LOG, B.BIRCHLOG, B.PALMLOG, B.BEAM, B.DOOR, B.DOOR_OPEN, B.LADDER, B.CHEST], 6], [[B.LEAVES, B.BERRYLEAF, B.NEEDLES, B.CACTUS], 7], [[B.LAVA], 8], [[B.TILES], 9], [[B.PLASTER], 10], [[B.COBBLE], 11], [[B.THATCH, B.WEAVE, B.SAIL], 12], [[B.SLATE], 13], [[B.MASONRY, B.SLIT, B.FORTSTONE], 14], [[B.BASALT], 15], [[B.CLOUD], 16]]) for (const id of ids) MAT_OF[id] = m;
  const scratchOpaque = new MeshBuilder(16384, false, true), scratchWater = new MeshBuilder(2048, false, true), scratchGlass = new MeshBuilder(512, false, true), scratchGrass = new MeshBuilder(8192, false, true);
  const SOIL = new Set([B.GRASS, B.DIRT, B.SAND, B.SNOW, B.GRAVEL, B.STONE, B.MOSS, B.GLOWGRASS, B.REGOLITH, B.DUNE, B.SALTCRUST]);
  // things that stand on the ground without stopping it from sloping: air, leaves, trunks, bushes, flowers, pebbles, torches, chests...
  const DECOR = (b) => b === B.AIR || isLeaf(b) || isTrunk(b) || b === B.BERRY || BLOCKS[b].partial;
  // the exposed soil top of a column, and the water surface over it if any. Anything hanging overhead with air under it (a sky island,
  // a bridge, a gate lintel, a cloud city) is looked through: it is the ground below that is the land and gets smoothed. A solid block
  // sitting right on the soil covers it, and covered soil stays square so whatever stands on it has a flat footing.
  function soilScan(get, x, z) {
    let t = -1, wt = -1;
    for (let y = WH - 1; y > 0; y--) {
      const b = get(x, y, z);
      if (DECOR(b)) continue;
      if (b === B.WATER || b === B.BRINE) { if (wt < 0) wt = y + 1; continue; }
      if (SOIL.has(b)) { t = y; break; }
      if (y <= 1 || SOIL.has(get(x, y - 1, z))) break; // standing on the ground: it covers the soil. Otherwise it floats over it: keep looking down
    }
    return [t, wt];
  }
  const ROOFB = (b) => b === B.TILES || b === B.SLATE || b === B.THATCH || b === B.SAIL;
  const SIGNABLE = new Set([B.EMBER, B.BERRY, B.COPPER, B.VOID, B.IRON, B.GOLD, B.GLOWWORM, B.LOG, B.MOONGLOW, B.CLOUD, B.SELENITE, B.BERRYLEAF, B.AMBER]);
  const WALLY = (b) => b === B.PLANKS || b === B.PLASTER || b === B.BEAM || b === B.MASONRY || b === B.IRONWALL || b === B.VOIDWALL || b === B.SELGLASS;
  const surfTop = new Int16Array(18 * 18), surfWet = new Int16Array(18 * 18), cornerH = new Float32Array(17 * 17);
  const FLOWERS = [[0.95, 0.85, 0.25], [0.95, 0.95, 0.95], [0.85, 0.35, 0.55], [0.6, 0.5, 0.95], [0.95, 0.5, 0.25]];
  function buildChunk(world, chunk) {
    const cx = chunk.cx, cz = chunk.cz, ox = cx * CH, oz = cz * CH;
    const lod = chunk.lod = chunk.wantLod || 0; // 1 = far: no surface studs, fewer facets on leaves and clouds
    const nb = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) nb.push(world.chunks.get((cx + dx) + ',' + (cz + dz)) || null);
    const chunkAt = (x, z) => nb[((x < 0 ? 0 : x > 15 ? 2 : 1) * 3) + (z < 0 ? 0 : z > 15 ? 2 : 1)];
    const get = (x, y, z) => {
      if (y < 0) return B.BEDROCK; if (y >= WH) return B.AIR;
      const c = chunkAt(x, z); if (!c) return B.AIR;
      return c.blocks[(((x + 16) & 15) * CH + ((z + 16) & 15)) * WH + y];
    };
    const skyAt = (x, y, z) => {
      if (y >= WH) return 1;
      const c = chunkAt(x, z); if (!c) return 1;
      const top = c.topFor((x + 16) & 15, y, (z + 16) & 15);
      if (y >= top) return 1;
      return Math.max(0, 1 - (top - y) * 0.11);
    };
    const op = scratchOpaque, wa = scratchWater, gs = scratchGlass, gr = scratchGrass; op.nv = op.ni = 0; wa.nv = wa.ni = 0; gs.nv = gs.ni = 0; gr.nv = gr.ni = 0;
    const blades = grassProg ? 0 : (isMobile ? 10 : 16);
    // smooth land: every column's exposed soil top, then a height for each corner shared by four columns.
    // Steps of one or two blocks become slopes; anything steeper stays a sharp edge.
    for (let x = -1; x <= 16; x++) for (let z = -1; z <= 16; z++) {
      const [t, wt] = soilScan(get, x, z);
      surfTop[(x + 1) * 18 + (z + 1)] = t; surfWet[(x + 1) * 18 + (z + 1)] = wt; // the seabed counts as land: shores slope in under the water
    }
    for (let cx = 0; cx <= 16; cx++) for (let cz = 0; cz <= 16; cz++) {
      let n = 0, dry = false, wl = -1; const ts = [], ws = [];
      for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const i = (cx + a + 1) * 18 + (cz + b + 1); const t = surfTop[i]; if (t < 0) { n = 0; break; } n++; ts.push(t); const wt = surfWet[i]; ws.push(wt); if (wt < 0) dry = true; else wl = Math.max(wl, wt); }
      let v = -1;
      if (n) {
        // at the water's edge a wet column counts as ground at the surface, however deep the seabed really is: a bank up to two blocks above the water slopes down to it instead of standing as cubes over a drop
        const shore = dry && wl >= 0; let sum = 0, lo = 999, hi = -999;
        for (let i = 0; i < 4; i++) { const t = shore && ws[i] >= 0 ? Math.max(ts[i], ws[i] - 1) : ts[i]; sum += t; lo = Math.min(lo, t); hi = Math.max(hi, t); }
        if (hi - lo <= 2) v = sum / 4 + 1;
        if (v >= 0 && shore) v = Math.max(v, wl - 0.02); // and comes up just clear of the waterline (the surface sits 0.12 down and waves 0.07): never a dry pit below the sea, never a seabed fighting the surface for the same pixels
      }
      cornerH[cx * 17 + cz] = v;
    }
    const ST = (x, z) => surfTop[(x + 1) * 18 + (z + 1)];
    const CHt = (x, z) => cornerH[x * 17 + z];
    // where a prop standing at (lx, y, lz) meets the ground: the smoothed surface under it, or the block top when the ground there is not smoothed
    const gnd = (lx, y, lz) => {
      if (ST(lx, lz) !== y - 1) return y;
      const a = CHt(lx, lz), b = CHt(lx + 1, lz), c = CHt(lx, lz + 1), d = CHt(lx + 1, lz + 1);
      return ((a >= 0 ? a : y) + (b >= 0 ? b : y) + (c >= 0 ? c : y) + (d >= 0 ? d : y)) * 0.25;
    };
    // a normal per corner from the slope of the smoothed height field
    const cornerN = (x, z) => { const h = CHt(x, z); if (h < 0) return [0, 1, 0]; const g = (a, b) => { const v = (a >= 0 && a <= 16 && b >= 0 && b <= 16) ? CHt(a, b) : -1; return v >= 0 ? v : h; }; const dx = (g(x + 1, z) - g(x - 1, z)) * 0.5, dz = (g(x, z + 1) - g(x, z - 1)) * 0.5; const l = Math.hypot(dx, 1, dz); return [-dx / l, 1 / l, -dz / l]; };
    const blocks = chunk.blocks;
    const col0 = [0, 0, 0];
    for (let lx = 0; lx < CH; lx++) for (let lz = 0; lz < CH; lz++) {
      const base = (lx * CH + lz) * WH;
      const tint = [chunk.tint[(lx * CH + lz) * 3], chunk.tint[(lx * CH + lz) * 3 + 1], chunk.tint[(lx * CH + lz) * 3 + 2]];
      for (let y = 0; y < WH; y++) {
        const id = blocks[base + y];
        if (id === B.AIR) continue;
        const info = BLOCKS[id];
        const wx = ox + lx, wz = oz + lz;
        const vr = SOIL.has(id) ? 0.98 + U.hash3(wx, y, wz, 5) * 0.03 : 0.92 + U.hash3(wx, y, wz, 5) * 0.12; // per-block variation (the ground keeps almost none: its shader paints it smoothly)
        if (id === B.STATUE) continue; // drawn as an entity
        // a shop's marker block over its doorway: drawn as the wall it sits in, with a sign hanging out over the street in the marker's colour
        if (SIGNABLE.has(id) && y >= 2 && get(lx, y - 1, lz) === B.AIR && get(lx, y - 2, lz) === B.AIR) {
          const axis = (WALLY(get(lx + 1, y, lz)) && WALLY(get(lx - 1, y, lz))) ? 'x' : (WALLY(get(lx, y, lz + 1)) && WALLY(get(lx, y, lz - 1))) ? 'z' : null;
          if (axis) {
            const wb = axis === 'x' ? get(lx + 1, y, lz) : get(lx, y, lz + 1); const wi = BLOCKS[wb]; const sk = skyAt(lx, y + 1, lz);
            op.curMat = MAT_OF[wb] || 0; const wpal = world.preset.paletteRgb && world.preset.paletteRgb[wb]; op.box(lx, y, lz, lx + 1, y + 1, lz + 1, wpal ? wpal[1] : wi.side, sk, false);
            op.curMat = 0;
            const out = axis === 'x' ? [0, skyAt(lx, y, lz + 1) >= skyAt(lx, y, lz - 1) ? 1 : -1] : [skyAt(lx + 1, y, lz) >= skyAt(lx - 1, y, lz) ? 1 : -1, 0];
            const bx = lx + 0.5, bz = lz + 0.5, ox = out[0], oz = out[1]; const iron = [0.2, 0.2, 0.23], wood = [0.42, 0.29, 0.15], edge = [0.3, 0.2, 0.1];
            op.tube([[bx + ox * 0.5, y + 0.86, bz + oz * 0.5], [bx + ox * 0.98, y + 0.86, bz + oz * 0.98]], [0.03, 0.03], iron, { sky: sk, segs: 4, cap0: 'none', cap1: 'round' }); // the bracket
            op.tube([[bx + ox * 0.5, y + 0.62, bz + oz * 0.5], [bx + ox * 0.86, y + 0.84, bz + oz * 0.86]], [0.022, 0.022], iron, { sky: sk, segs: 4, cap0: 'none', cap1: 'none' }); // its stay
            const px = ox ? 0 : 0.34, pz = oz ? 0 : 0.34; const sx = bx + ox * 0.78, sz = bz + oz * 0.78; // the board hangs under the bracket's end
            for (const sgn of [-1, 1]) op.tube([[sx + px * sgn * 0.8, y + 0.85, sz + pz * sgn * 0.8], [sx + px * sgn * 0.8, y + 0.7, sz + pz * sgn * 0.8]], [0.012, 0.012], iron, { sky: sk, segs: 4, cap0: 'none', cap1: 'none' }); // chains
            op.blob(sx - px - ox * 0.03, y + 0.22, sz - pz - oz * 0.03, sx + px + ox * 0.03, y + 0.7, sz + pz + oz * 0.03, 0.15, wood, { sky: sk, n: 2, under: edge, split: 0.0, soft: 0.5 });
            const em = info.emissive; const ec = (world.preset.paletteRgb && world.preset.paletteRgb[id]) ? world.preset.paletteRgb[id][0] : info.top;
            for (const sgn of [-1, 1]) op.blob(sx - px * 0.5 + ox * sgn * 0.035 - (oz ? 0.14 : 0.0), y + 0.32, sz - pz * 0.5 + oz * sgn * 0.035 - (ox ? 0.14 : 0.0), sx + px * 0.5 + ox * sgn * 0.035 + (oz ? 0.14 : 0.0), y + 0.6, sz + pz * 0.5 + oz * sgn * 0.035 + (ox ? 0.14 : 0.0), 0.9, ec, { sky: sk, n: 2, emis: em }); // the emblem, both faces
            continue;
          }
        }
        if (ROOFB(id)) { // a roof block is a wedge that leans toward the ridge: the slope faces the sky, the ridge block is a peak, the ends show a sawn rafter
          const sk = skyAt(lx, y + 1, lz); const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]; const CX = [0, 1, 1, 0], CZ = [0, 0, 1, 1];
          const pal = world.preset.paletteRgb && world.preset.paletteRgb[id]; const topC = pal ? pal[0] : info.top; const sailB = id === B.SAIL; const rafter = sailB ? info.side : [0.4, 0.27, 0.15], under = sailB ? [info.side[0] * 0.8, info.side[1] * 0.8, info.side[2] * 0.8] : [0.36, 0.25, 0.15];
          const ups = D4.filter(([a, b]) => ROOFB(get(lx + a, y + 1, lz + b))), dns = D4.filter(([a, b]) => ROOFB(get(lx + a, y - 1, lz + b)));
          let H = null, ridge = null;
          if (ups.length >= 1 && ups.length <= 2 && !(ups.length === 2 && ups[0][0] === -ups[1][0] && ups[0][1] === -ups[1][1])) { H = [0, 0, 0, 0]; for (const [a, b] of ups) for (let i = 0; i < 4; i++) H[i] += a > 0 ? CX[i] : a < 0 ? 1 - CX[i] : b > 0 ? CZ[i] : 1 - CZ[i]; H = H.map(v => Math.min(1, v)); }
          else if (ups.length === 0) {
            const diag = [[1, 1], [-1, 1], [1, -1], [-1, -1]].find(([a, b]) => ROOFB(get(lx + a, y + 1, lz + b)) && ROOFB(get(lx + a, y, lz)) && ROOFB(get(lx, y, lz + b)));
            if (diag) H = CX.map((cx, i) => Math.max(0, (diag[0] > 0 ? cx : 1 - cx) + (diag[1] > 0 ? CZ[i] : 1 - CZ[i]) - 1)); // a hip corner
            else if (dns.length === 4) ridge = 'apex'; // slopes fall away on every side: the point of a pyramid
            else if (dns.some(([a, b]) => dns.some(([c, d]) => a === -c && b === -d))) ridge = dns.find(([a]) => a !== 0) ? 'x' : 'z'; // slopes fall away to both sides
            else if (dns.length === 1) { const [a, b] = dns[0]; H = CX.map((cx, i) => a > 0 ? 1 - cx : a < 0 ? cx : b > 0 ? 1 - CZ[i] : CZ[i]); }
          }
          const P = (i, h) => [lx + CX[i], y + h, lz + CZ[i]];
          const face = (verts, col, mat, nrm) => { op.curMat = mat; const n = nrm || (() => { const [a, b, c] = verts; const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l]; })(); op.quad(verts, [col, col, col, col], [sk, sk, sk, sk], false, [n, n, n, n]); };
          if (ridge === 'apex') { const t = [lx + 0.5, y + 0.6, lz + 0.5]; const c4 = [[lx, y, lz], [lx + 1, y, lz], [lx + 1, y, lz + 1], [lx, y, lz + 1]]; for (let i = 0; i < 4; i++) { const a = c4[i], b = c4[(i + 1) % 4]; face([a, b, t, t], topC, MAT_OF[id], null); } continue; }
          if (ridge) { // a peak along the ridge axis, half a block high, the two slopes meeting on it
            const a0 = ridge === 'x' ? [lx + 0.5, y + 0.5, lz] : [lx, y + 0.5, lz + 0.5], a1 = ridge === 'x' ? [lx + 0.5, y + 0.5, lz + 1] : [lx + 1, y + 0.5, lz + 0.5];
            if (ridge === 'x') { face([[lx, y, lz], [lx, y, lz + 1], a1, a0], topC, MAT_OF[id], [-0.707, 0.707, 0]); face([[lx + 1, y, lz + 1], [lx + 1, y, lz], a0, a1], topC, MAT_OF[id], [0.707, 0.707, 0]); if (!ROOFB(get(lx, y, lz - 1))) face([[lx, y, lz], a0, a0, [lx + 1, y, lz]], rafter, 6, [0, 0, -1]); if (!ROOFB(get(lx, y, lz + 1))) face([[lx + 1, y, lz + 1], a1, a1, [lx, y, lz + 1]], rafter, 6, [0, 0, 1]); }
            else { face([[lx, y, lz], a0, a1, [lx + 1, y, lz]], topC, MAT_OF[id], [0, 0.707, -0.707]); face([[lx + 1, y, lz + 1], a1, a0, [lx, y, lz + 1]], topC, MAT_OF[id], [0, 0.707, 0.707]); if (!ROOFB(get(lx - 1, y, lz))) face([[lx, y, lz + 1], a0, a0, [lx, y, lz]], rafter, 6, [-1, 0, 0]); if (!ROOFB(get(lx + 1, y, lz))) face([[lx + 1, y, lz], a1, a1, [lx + 1, y, lz + 1]], rafter, 6, [1, 0, 0]); }
            if (!isOpaque(get(lx, y - 1, lz))) face([[lx, y, lz], [lx + 1, y, lz], [lx + 1, y, lz + 1], [lx, y, lz + 1]], under, 6, [0, -1, 0]);
            continue;
          }
          if (!H) H = [1, 1, 1, 1]; // a lone roof block: a flat cap
          const flat = H.every(h => h === H[0]);
          // the slope: one quad through the four corner heights
          { const v = [P(0, H[0]), P(3, H[3]), P(2, H[2]), P(1, H[1])]; let nx = 0, ny = 0, nz = 0; for (let i = 0; i < 4; i++) { const a = v[i], b = v[(i + 1) % 4]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); } const l = Math.hypot(nx, ny, nz) || 1; face(v, topC, MAT_OF[id], [nx / l, ny / l, nz / l]); }
          // the sides: trapezoids where the surface is above the block floor, skipped against a neighbour that covers them
          const sides = [[1, 0, [1, 2]], [-1, 0, [3, 0]], [0, 1, [2, 3]], [0, -1, [0, 1]]];
          for (const [a, b, [i, j]] of sides) {
            if (H[i] <= 0 && H[j] <= 0) continue; const nb = get(lx + a, y, lz + b); if (isOpaque(nb) || (ROOFB(nb) && !flat)) continue;
            face([P(i, 0), P(j, 0), P(j, H[j]), P(i, H[i])], H[i] >= 0.999 && H[j] >= 0.999 ? under : rafter, 6, [a, 0, b]);
          }
          if (!isOpaque(get(lx, y - 1, lz))) face([[lx, y, lz], [lx + 1, y, lz], [lx + 1, y, lz + 1], [lx, y, lz + 1]], under, 6, [0, -1, 0]);
          continue;
        }
        if (id === B.BASIN || id === B.HIDE) continue; // drawn by its fountain or tipi
        if (id === B.TIPI || id === B.LODGE) { // a tipi: a cone of painted hide round a ring of poles that cross above the smoke hole, the door flap toward the fire
          const big = id === B.LODGE; const sk = skyAt(lx, y + 2, lz); const cx = lx + 0.5, cz = lz + 0.5; const R0 = big ? 2.55 : 1.62, Hh = big ? 5.2 : 3.7;
          let door = null; const ringR = big ? 2 : 1; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (get(lx + a * ringR, y, lz + b * ringR) !== B.HIDE) { door = Math.atan2(b, a); break; } if (door == null) door = 0.4;
          const h0 = U.hash3(wx, y, wz, 170), h1 = U.hash3(wx, y, wz, 171); const hide = [0.88, 0.74, 0.52], paint = [[0.72, 0.2, 0.16], [0.16, 0.14, 0.12], [0.2, 0.36, 0.62], [0.9, 0.78, 0.3]][Math.floor(h0 * 4)], paint2 = h1 < 0.5 ? [0.16, 0.14, 0.12] : [0.72, 0.2, 0.16];
          const N = 14;
          const cpath = [], crad = []; for (let i = 0; i <= 10; i++) { const t = i / 10; cpath.push([cx, y - 0.05 + (Hh + 0.05) * t, cz]); crad.push(R0 + (0.3 - R0) * (t * 0.92 + t * t * 0.08)); } // the cone, in rings so the paint can follow it
          op.tube(cpath, crad, hide, { sky: sk, segs: N, cap0: 'none', cap1: 'none', shade: (p, nx, ny, nz, t) => {
            const ang = Math.atan2(p[2] - cz, p[0] - cx); let da = Math.abs(ang - door); if (da > Math.PI) da = 2 * Math.PI - da;
            if (t < 0.4 && da < 0.3 * (1 - t / 0.4) + 0.06) return [0.12, 0.09, 0.06]; // the doorway, a dark triangle
            const seg = Math.floor((ang / 6.2832 + 1) * N * 2) % 2; const band = (t > 0.1 && t < 0.2) ? paint : (t > 0.26 && t < 0.3 && seg) ? paint2 : (t > 0.78) ? [0.3, 0.26, 0.22] : null; // a painted band low down, a zigzag over it, smoke-darkened top
            const weather = 0.92 + U.hash3(Math.floor(ang * 5), Math.floor(t * 9), wx + wz, 3) * 0.14; const c = band || hide; return [c[0] * weather, c[1] * weather, c[2] * weather]; } });
          for (let k = 0; k < (big ? 9 : 7); k++) { const a = k / (big ? 9 : 7) * 6.2832 + h1; const bx = cx + Math.cos(a) * R0 * 0.98, bz = cz + Math.sin(a) * R0 * 0.98; const tx = cx - Math.cos(a) * 0.32, tz = cz - Math.sin(a) * 0.32; // poles lean in and cross past the apex
            op.tube([[bx, y - 0.1, bz], [tx, y + Hh + 0.9 + U.hash3(k, wx, wz, 4) * 0.35, tz]], [0.05, 0.035], [0.46, 0.34, 0.2], { sky: sk, segs: 4, cap0: 'none', cap1: 'round' }); }
          { const a = door + Math.PI; const fx = Math.cos(a), fz = Math.sin(a); const ax = cx + fx * 0.2, az = cz + fz * 0.2; // the smoke flaps, two ears at the top, turned from the door
            for (const sgn of [-1, 1]) op.plate([[ax - fz * sgn * 0.1, y + Hh - 0.1, az + fx * sgn * 0.1], [ax - fz * sgn * 0.75 + fx * 0.2, y + Hh + 0.55, az + fx * sgn * 0.75 + fz * 0.2], [ax - fz * sgn * 0.35 + fx * 0.3, y + Hh - 0.45, az + fx * sgn * 0.35 + fz * 0.3]], 0.02, hide, { sky: sk, edge: [0.6, 0.48, 0.32] }); }
          continue;
        }
        if (id === B.RAIL) { // mine rails: two iron rails on plank sleepers, running the way the line goes
          const sk = skyAt(lx, y + 1, lz); const iron = [0.42, 0.42, 0.46], sleeper = [0.4, 0.28, 0.14]; const gy = gnd(lx, y, lz);
          const alongX = get(lx + 1, y, lz) === B.RAIL || get(lx - 1, y, lz) === B.RAIL || get(lx + 1, y, lz) === B.CART || get(lx - 1, y, lz) === B.CART;
          for (const t of [0.2, 0.55, 0.9]) { if (alongX) op.box(lx + t - 0.08, gy, lz + 0.1, lx + t + 0.08, gy + 0.07, lz + 0.9, sleeper, sk, false); else op.box(lx + 0.1, gy, lz + t - 0.08, lx + 0.9, gy + 0.07, lz + t + 0.08, sleeper, sk, false); }
          for (const r of [0.3, 0.7]) { if (alongX) op.box(lx, gy + 0.06, lz + r - 0.035, lx + 1, gy + 0.15, lz + r + 0.035, iron, sk, false); else op.box(lx + r - 0.035, gy + 0.06, lz, lx + r + 0.035, gy + 0.15, lz + 1, iron, sk, false); }
          continue;
        }
        if (id === B.CART) { // a mine cart left on the rails: an iron tub on four wheels, a few rocks in it
          const sk = skyAt(lx, y + 1, lz); const iron = [0.36, 0.37, 0.42], dark = [0.2, 0.2, 0.24]; const gy = gnd(lx, y, lz);
          const alongX = get(lx + 1, y, lz) === B.RAIL || get(lx - 1, y, lz) === B.RAIL; const cx = lx + 0.5, cz = lz + 0.5;
          op.push(); if (!alongX) op.rotate(0, Math.PI / 2, 0, [cx, gy, cz]);
          op.blob(cx - 0.46, gy + 0.22, cz - 0.34, cx + 0.46, gy + 0.72, cz + 0.34, 0.12, iron, { sky: sk, n: 2, tap: [0.8, 1] });
          op.box(cx - 0.42, gy + 0.68, cz - 0.3, cx + 0.42, gy + 0.72, cz + 0.3, dark, sk, false);
          for (const ex of [-0.28, 0.28]) for (const ez of [-0.36, 0.36]) op.tube([[cx + ex, gy + 0.14, cz + ez - 0.02 * Math.sign(ez)], [cx + ex, gy + 0.14, cz + ez + 0.04 * Math.sign(ez)]], [0.14, 0.14], dark, { sky: sk, segs: 8, cap0: 'flat', cap1: 'flat' });
          for (let k = 0; k < 4; k++) { const hx = U.hash3(wx, y, wz, 180 + k), hz = U.hash3(wx, y, wz, 184 + k); op.blob(cx - 0.3 + hx * 0.5, gy + 0.6, cz - 0.2 + hz * 0.3, cx - 0.14 + hx * 0.5, gy + 0.82, cz - 0.04 + hz * 0.3, 0.7, [0.5, 0.5, 0.54], { sky: sk, n: 1 }); }
          op.pop();
          continue;
        }
        if (id === B.FENCE) { // a rail fence: a post, and two rails to each neighbouring fence or wall
          const sk = skyAt(lx, y + 1, lz); const wood = [0.5, 0.36, 0.2], rail = [0.56, 0.42, 0.24]; const gy = gnd(lx, y, lz);
          op.box(lx + 0.4, gy - 0.1, lz + 0.4, lx + 0.6, gy + 1.05, lz + 0.6, wood, sk, false); op.blob(lx + 0.38, gy + 1.0, lz + 0.38, lx + 0.62, gy + 1.14, lz + 0.62, 0.4, wood, { sky: sk, n: 1 });
          for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nb = get(lx + a, y, lz + b); if (!(nb === B.FENCE || isOpaque(nb))) continue;
            for (const ry of [0.38, 0.8]) { if (a) op.box(lx + 0.5 + Math.min(0, a * 0.5), gy + ry, lz + 0.44, lx + 0.5 + Math.max(0, a * 0.5), gy + ry + 0.1, lz + 0.56, rail, sk, false); else op.box(lx + 0.44, gy + ry, lz + 0.5 + Math.min(0, b * 0.5), lx + 0.56, gy + ry + 0.1, lz + 0.5 + Math.max(0, b * 0.5), rail, sk, false); } }
          continue;
        }
        if (id === B.TOTEM) { // a carved pole: stacked faces in paint, a pair of wings near the top, feathers
          const sk = skyAt(lx, y + 2, lz); const cx = lx + 0.5, cz = lz + 0.5; const wood = [0.48, 0.33, 0.18]; const h0 = U.hash3(wx, y, wz, 172);
          const pal = [[0.72, 0.2, 0.16], [0.16, 0.14, 0.12], [0.2, 0.36, 0.62], [0.9, 0.78, 0.3], [0.92, 0.9, 0.84]];
          op.tube([[cx, y - 0.1, cz], [cx, y + 2.6, cz]], [0.3, 0.26], wood, { sky: sk, segs: 10, cap0: 'none', cap1: 'flat', shade: (p, nx, ny, nz, t) => { const band = Math.floor(t * 7); const c = (band % 2) ? pal[(Math.floor(h0 * 5) + band) % 5] : wood; const k = 0.9 + U.hash3(band, Math.floor(Math.atan2(nz, nx) * 2), wx, 6) * 0.2; return [c[0] * k, c[1] * k, c[2] * k]; } });
          let fd = [0, 1]; for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { if (skyAt(lx + a, y + 1, lz + b) > 0.9 && !isOpaque(get(lx + a, y, lz + b))) { fd = [a, b]; break; } }
          for (let f = 0; f < 3; f++) { const fy = y + 0.5 + f * 0.75; const fx = cx + fd[0] * 0.26, fz = cz + fd[1] * 0.26; const px = fd[1], pz = fd[0]; // faces turned to the open side: a brow, two eyes, a beak
            op.blob(fx - px * 0.2 - fd[0] * 0.05, fy + 0.3, fz - pz * 0.2 - fd[1] * 0.05, fx + px * 0.2 + fd[0] * 0.08, fy + 0.4, fz + pz * 0.2 + fd[1] * 0.08, 0.5, pal[(f + 1) % 5], { sky: sk, n: 1 });
            for (const sgn of [-1, 1]) op.ball(fx + px * sgn * 0.12, fy + 0.18, fz + pz * sgn * 0.12, 0.06, [0.95, 0.93, 0.88], { sky: sk, n: 1 });
            op.tube([[fx, fy + 0.05, fz], [fx + fd[0] * 0.2, fy - 0.08, fz + fd[1] * 0.2]], [0.08, 0.02], pal[(f + 3) % 5], { sky: sk, segs: 4, cap0: 'none', cap1: 'none' }); }
          for (const sgn of [-1, 1]) { const px = fd[1] * sgn, pz = fd[0] * sgn; op.plate([[cx + px * 0.25, y + 2.1, cz + pz * 0.25], [cx + px * 1.0, y + 2.55, cz + pz * 1.0], [cx + px * 0.95, y + 2.2, cz + pz * 0.95], [cx + px * 0.3, y + 1.85, cz + pz * 0.3]], 0.04, pal[2], { sky: sk, edge: [0.16, 0.14, 0.12] }); } // the wings
          continue;
        }
        if (id === B.FIREPIT) { // the Indians' fire: a ring of stones, logs, orange flames and embers
          const sk = skyAt(lx, y + 1, lz); const gy = gnd(lx, y, lz);
          for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + 0.2; const r = 0.46; const st = 0.1 + U.hash3(wx, y, wz, 30 + k) * 0.06; op.blob(lx + 0.5 + Math.cos(a) * r - st, gy - 0.02, lz + 0.5 + Math.sin(a) * r - st, lx + 0.5 + Math.cos(a) * r + st, gy + st * 1.5, lz + 0.5 + Math.sin(a) * r + st, 0.6, [0.42, 0.4, 0.42], { sky: sk, n: 2 }); }
          for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + 0.5; op.tube([[lx + 0.5 + Math.cos(a) * 0.36, gy + 0.08, lz + 0.5 + Math.sin(a) * 0.36], [lx + 0.5 - Math.cos(a) * 0.1, gy + 0.3, lz + 0.5 - Math.sin(a) * 0.1]], [0.07, 0.05], [0.25, 0.16, 0.08], { sky: sk, segs: 5, cap0: 'flat', cap1: 'round' }); }
          op.blob(lx + 0.3, gy + 0.05, lz + 0.3, lx + 0.7, gy + 0.3, lz + 0.7, 0.9, [1.0, 0.45, 0.1], { emis: true, n: 2 }); // the embers
          op.blob(lx + 0.3, gy + 0.2, lz + 0.3, lx + 0.7, gy + 0.95, lz + 0.7, 1, [1.0, 0.6, 0.15], { emis: true, n: 3, tap: [1, 0.2] });
          op.blob(lx + 0.4, gy + 0.3, lz + 0.4, lx + 0.6, gy + 1.15, lz + 0.6, 1, [1.0, 0.9, 0.5], { emis: true, n: 2, tap: [1, 0.15] });
          continue;
        }
        if (id === B.FOUNTAIN) { // a city fountain: a round basin of dressed stone, water in it, a column with an upper bowl, a jet, and the water falling back
          const sk = skyAt(lx, y + 1, lz); const cx = lx + 0.5, cz = lz + 0.5; const stone = [0.6, 0.62, 0.66], dark = [0.46, 0.48, 0.52];
          const ring = (r, segs) => { const pts = []; for (let i = 0; i <= segs; i++) { const a = i / segs * 6.2832; pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); } return pts; };
          op.curMat = 14;
          const rim = ring(2.3, 28); op.tube(rim.map(p => [p[0], y + 0.42, p[2]]), rim.map(() => [0.28, 0.3]), stone, { sky: sk, segs: 8, cap0: 'none', cap1: 'none' }); // the kerb
          op.tube([[cx, y - 0.02, cz], [cx, y + 0.2, cz]], [2.35, 2.35], dark, { sky: sk, segs: 28, cap0: 'none', cap1: 'none' }); // the basin wall below the kerb
          op.tube([[cx, y + 0.7, cz], [cx, y + 1.6, cz], [cx, y + 1.75, cz]], [0.34, 0.26, 0.5], stone, { sky: sk, segs: 12, cap0: 'none', cap1: 'none' }); // the column, flaring into the bowl
          op.tube([[cx, y + 1.75, cz], [cx, y + 1.95, cz], [cx, y + 2.0, cz]], [0.8, 0.85, 0.7], stone, { sky: sk, segs: 16, cap0: 'none', cap1: 'none' }); // the upper bowl
          op.tube([[cx, y + 2.0, cz], [cx, y + 2.1, cz], [cx, y + 2.5, cz]], [0.2, 0.14, 0.09], stone, { sky: sk, segs: 8, cap0: 'none', cap1: 'none' }); // the spout
          op.curMat = 0;
          op.tube([[cx, y + 2.5, cz], [cx, y + 3.3, cz], [cx, y + 3.5, cz]], [0.07, 0.1, 0.16], [0.78, 0.9, 0.98], { sky: 1, segs: 6, cap0: 'none', cap1: 'round', emis: true }); // the jet
          for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + 0.3; const r0 = 0.7, r1 = 1.9; const path = []; for (let i = 0; i <= 4; i++) { const t = i / 4; path.push([cx + Math.cos(a) * (r0 + (r1 - r0) * t), y + 2.0 - t * t * 1.45, cz + Math.sin(a) * (r0 + (r1 - r0) * t)]); } op.tube(path, [0.06, 0.05, 0.045, 0.04, 0.03], [0.74, 0.88, 0.98], { sky: 1, segs: 5, cap0: 'none', cap1: 'round', emis: true }); } // water spilling from the bowl
          // the water surface in the basin, on the water mesh so it shimmers and reflects
          wa.curMat = 0; const wc = [0.1, 0, 0]; const N = 24; const c0 = wa.nv; wa.vert(cx, y + 0.5, cz, 0, 1, 0, wc[0], wc[1], wc[2], sk, false); for (let i = 0; i < N; i++) { const a = i / N * 6.2832; wa.vert(cx + Math.cos(a) * 2.2, y + 0.5, cz + Math.sin(a) * 2.2, 0, 1, 0, wc[0], wc[1], wc[2], sk, false); } for (let i = 0; i < N; i++) wa.tri(c0, c0 + 1 + i, c0 + 1 + (i + 1) % N);
          const b0 = wa.nv; wa.vert(cx, y + 1.98, cz, 0, 1, 0, 0, 0, 0, sk, false); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; wa.vert(cx + Math.cos(a) * 0.72, y + 1.98, cz + Math.sin(a) * 0.72, 0, 1, 0, 0, 0, 0, sk, false); } for (let i = 0; i < 12; i++) wa.tri(b0, b0 + 1 + i, b0 + 1 + (i + 1) % 12);
          continue;
        }
        if (id === B.AWNING) { // a market awning: striped canvas with a scalloped fringe, sagging a little between its posts
          const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(Math.floor(wx / 4), 1, Math.floor(wz / 4), 160); const pal = [[0.82, 0.22, 0.2], [0.2, 0.42, 0.78], [0.22, 0.6, 0.32], [0.9, 0.6, 0.15], [0.6, 0.3, 0.7]]; const c1 = pal[Math.floor(h0 * 5)], c2 = [0.94, 0.9, 0.82];
          const runX = get(lx + 1, y, lz) === B.AWNING || get(lx - 1, y, lz) === B.AWNING; // the run of awning blocks: stripes go across it
          const endA = runX ? get(lx - 1, y, lz) !== B.AWNING : get(lx, y, lz - 1) !== B.AWNING, endB = runX ? get(lx + 1, y, lz) !== B.AWNING : get(lx, y, lz + 1) !== B.AWNING;
          const yAt = (u) => y + 0.92 - (endA && endB ? 0 : 0.08 * Math.sin(Math.PI * u) * ((endA || endB) ? 0.5 : 1)); // a sag along the run
          const stripes = 4;
          for (let i = 0; i < stripes; i++) { const t0 = i / stripes, t1 = (i + 1) / stripes; const c = i % 2 ? c2 : c1;
            const q = runX ? [[lx + t0, yAt(t0), lz], [lx + t0, yAt(t0), lz + 1], [lx + t1, yAt(t1), lz + 1], [lx + t1, yAt(t1), lz]] : [[lx, yAt(t0), lz + t0], [lx + 1, yAt(t0), lz + t0], [lx + 1, yAt(t1), lz + t1], [lx, yAt(t1), lz + t1]];
            op.quad(q, [c, c, c, c], [sk, sk, sk, sk], false, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]); op.quad([q[3], q[2], q[1], q[0]], [c, c, c, c], [sk * 0.7, sk * 0.7, sk * 0.7, sk * 0.7], false, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]); }
          for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4; const c = i % 2 ? c2 : c1; const yy = yAt(t); // the fringe along both long edges
            if (runX) { for (const ez of [lz, lz + 1]) op.plate([[lx + t - 0.125, yy, ez], [lx + t + 0.125, yy, ez], [lx + t, yy - 0.16, ez]], 0.01, c, { sky: sk }); }
            else { for (const ex of [lx, lx + 1]) op.plate([[ex, yy, lz + t - 0.125], [ex, yy, lz + t + 0.125], [ex, yy - 0.16, lz + t]], 0.01, c, { sky: sk }); } }
          continue;
        }
        if (id === B.BANNER) { // a banner hanging from the wall behind it: a pole bracketed out, cloth falling from it, a device in the middle
          const sk = skyAt(lx, y, lz); let d = [0, -1]; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (isOpaque(get(lx + a, y, lz + b))) { d = [a, b]; break; }
          const h0 = U.hash3(Math.floor(wx / 8), 2, Math.floor(wz / 8), 161); const pal = [[0.72, 0.14, 0.18], [0.14, 0.3, 0.66], [0.12, 0.45, 0.28], [0.8, 0.62, 0.14]]; const onFort = get(lx + d[0], y, lz + d[1]) === B.FORTSTONE; const c = onFort ? [0.3, 0.1, 0.42] : pal[Math.floor(h0 * 4)]; const gold = onFort ? [0.16, 0.06, 0.2] : [0.85, 0.7, 0.3];
          const cx = lx + 0.5 + d[0] * 0.3, cz = lz + 0.5 + d[1] * 0.3; const px = d[0] ? 0 : 1, pz = d[0] ? 1 : 0; // along the wall
          op.tube([[cx - px * 0.46, y + 0.92, cz - pz * 0.46], [cx + px * 0.46, y + 0.92, cz + pz * 0.46]], [0.03, 0.03], [0.3, 0.2, 0.1], { sky: sk, segs: 5, cap0: 'round', cap1: 'round' }); // the pole
          const spine = [], ws = []; for (let i = 0; i <= 5; i++) { const t = i / 5; spine.push([cx - d[0] * (0.04 * t + 0.14 * t * t), y + 0.9 - t * 1.8, cz - d[1] * (0.04 * t + 0.14 * t * t)]); ws.push(0.38 * (1 - 0.12 * t)); }
          op.ribbon(spine, ws, c, { sky: sk, tip: [c[0] * 0.75, c[1] * 0.75, c[2] * 0.75], droop: 0 });
          op.ball(cx - d[0] * 0.08, y + 0.25, cz - d[1] * 0.08, 0.13, gold, { sky: sk, n: 2 });
          continue;
        }
        if (id === B.THORN) { // a tangle of thorned vines: dark green stems crossing every way, thorns along them, a few dead leaves
          const sk = skyAt(lx, y + 1, lz); const vine = [0.16, 0.3, 0.12], dark = [0.1, 0.18, 0.08]; const hp = (k) => U.hash3(wx, y, wz, 190 + k);
          for (let k = 0; k < 5; k++) { const a0 = [lx + hp(k) , y + hp(k + 5), lz + hp(k + 10)], a1 = [lx + hp(k + 15), y + hp(k + 20), lz + hp(k + 25)]; const mid = [(a0[0] + a1[0]) / 2 + (hp(k + 30) - 0.5) * 0.4, (a0[1] + a1[1]) / 2 + (hp(k + 35) - 0.5) * 0.4, (a0[2] + a1[2]) / 2 + (hp(k + 40) - 0.5) * 0.4];
            op.tube([a0, mid, a1], [0.07, 0.09, 0.06], k % 2 ? vine : dark, { sky: sk, segs: 5, cap0: 'round', cap1: 'round' });
            for (let t = 0; t < 3; t++) { const f = (t + 0.5) / 3; const px = a0[0] + (a1[0] - a0[0]) * f, py = a0[1] + (a1[1] - a0[1]) * f, pz = a0[2] + (a1[2] - a0[2]) * f; const d = [hp(k + t + 50) - 0.5, hp(k + t + 55) - 0.5, hp(k + t + 60) - 0.5]; op.cone(px, py, pz, d, 0.22, 0.045, [0.42, 0.36, 0.28], { sky: sk, segs: 4 }); } }
          continue;
        }
        if (id === B.RUBBLE) { // a heap of broken stone
          const sk = skyAt(lx, y + 1, lz); const hp = (k) => U.hash3(wx, y, wz, 200 + k); const base = [0.5, 0.46, 0.4];
          for (let k = 0; k < 6; k++) { const r = 0.18 + hp(k) * 0.22; const cx = lx + 0.15 + hp(k + 6) * 0.7, cz = lz + 0.15 + hp(k + 12) * 0.7, cy = y + 0.1 + hp(k + 18) * 0.55 * (1 - r); const m = 0.8 + hp(k + 24) * 0.4;
            op.push(); op.rotate(hp(k + 30) * 1.2, hp(k + 36) * 6.283, hp(k + 42) * 1.2, [cx, cy, cz]); op.blob(cx - r, cy - r * 0.7, cz - r * 0.8, cx + r, cy + r * 0.7, cz + r * 0.8, 0.5, [base[0] * m, base[1] * m, base[2] * m], { sky: sk, n: 2 }); op.pop(); }
          continue;
        }
        if (id === B.BASALT && y < CORE_TOP) { // dripstone: a lone basalt block hanging under the roof or standing on an island is a cone, not a cube
          const up = get(lx, y + 1, lz), dn = get(lx, y - 1, lz); const sidesFree = !isOpaque(get(lx + 1, y, lz)) && !isOpaque(get(lx - 1, y, lz)) && !isOpaque(get(lx, y, lz + 1)) && !isOpaque(get(lx, y, lz - 1));
          const hang = sidesFree && isOpaque(up) && !isOpaque(dn), stand = sidesFree && !isOpaque(up) && isOpaque(dn) && dn !== B.LAVA;
          if (hang || stand) {
            const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(wx, y, wz, 210), h1 = U.hash3(wx, y, wz, 211); const col = [0.3, 0.28, 0.3]; const cx = lx + 0.5 + (h0 - 0.5) * 0.2, cz = lz + 0.5 + (h1 - 0.5) * 0.2;
            const two = hang ? get(lx, y - 2, lz) === B.BASALT || get(lx, y - 1, lz) === B.BASALT : false; // (a two-block tip: the upper block is wide, the lower one draws its own point)
            const len = hang ? (get(lx, y - 1, lz) === B.BASALT ? 1.0 : 1.0 + h0 * 0.5) : 1.0 + h1 * 0.4;
            const path = hang ? [[lx + 0.5, y + 1.0, lz + 0.5], [cx, y + 1 - len * 0.6, cz], [cx, y + 1 - len, cz]] : [[lx + 0.5, y, lz + 0.5], [cx, y + len * 0.6, cz], [cx, y + len, cz]];
            const rad = hang ? [0.44, 0.22, 0.01] : [0.42, 0.2, 0.01];
            op.curMat = 15; op.tube(path, rad, col, { sky: sk, segs: 7, cap0: 'none', cap1: 'none', shade: (p, nx, ny, nz, t) => { const k = 0.85 + U.hash3(Math.floor(Math.atan2(nz, nx) * 2), wx, wz, 9) * 0.3; return [col[0] * k, col[1] * k, col[2] * k]; } }); op.curMat = 0;
            if (hang && h0 > 0.5) op.ball(cx, y + 1 - len - 0.03, cz, 0.06, [1.0, 0.5, 0.15], { emis: true, n: 1 }); // a drip of lava at the tip
            continue;
          }
        }
        if (id === B.CLOUD || id === B.GLOWGRASS) { // a cloud billows: puffs hang under it and bulge from its rim, one per 2x2 cell, drawn by the cell's first block
          const below = get(lx, y - 1, lz); const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => !isOpaque(get(lx + a, y, lz + b)));
          const under = !isOpaque(below) && below !== B.CLOUD; const top = !isOpaque(get(lx, y + 1, lz));
          const cell = ((wx & 1) === 0) && ((wz & 1) === 0);
          if ((under && cell) || rim.length || (top && cell)) {
            const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(wx, y, wz, 220), h1 = U.hash3(wx, y, wz, 221); const white = id === B.GLOWGRASS ? [0.98, 0.99, 1.0] : [0.96, 0.97, 1.0], shade = [0.84, 0.88, 0.97]; const em = id === B.GLOWGRASS;
            if (under && cell) { const r = 1.15 + h0 * 0.35; op.blob(lx + 1 - r, y - r * 0.55, lz + 1 - r, lx + 1 + r, y + 0.3, lz + 1 + r, 1, white, { sky: sk * 0.85, n: 2, under: shade, soft: 0.6, emis: em }); }
            if (top && cell) { const r = 1.05 + h1 * 0.3, hgt = 0.22 + h0 * 0.18; op.blob(lx + 1 - r, y + 0.75, lz + 1 - r, lx + 1 + r, y + 1 + hgt, lz + 1 + r, 1, white, { sky: sk, n: lod ? 2 : 3, under: shade, soft: 0.7, emis: em }); } // the fluffy cover you walk on
            if (((wx + wz) & 1) === 0) for (const [a, b] of rim) { const r = 0.95 + h1 * 0.3; const cx = lx + 0.5 + a * 0.5, cz = lz + 0.5 + b * 0.5; op.blob(cx - r, y - r * 0.5 + (top ? 0.1 : 0), cz - r, cx + r, y + (top ? 1.0 : 0.9), cz + r, 1, white, { sky: sk, n: 2, under: shade, soft: 0.6, emis: em }); }
          }
          // the block itself still draws as a block below (falls through)
        }
        if (id === B.ROPEBRIDGE) { // a rickety rope bridge: plank slats across the top of the block, a few missing, rope rails sagging between posts, two ropes under
          const sk = skyAt(lx, y + 1, lz); const isB = (b) => b === B.ROPEBRIDGE; const alongX = isB(get(lx + 1, y, lz)) || isB(get(lx - 1, y, lz)) || isB(get(lx + 1, y + 1, lz)) || isB(get(lx - 1, y + 1, lz)) || isB(get(lx + 1, y - 1, lz)) || isB(get(lx - 1, y - 1, lz));
          const wood = [0.6, 0.46, 0.26], rope = [0.72, 0.62, 0.42]; const hp = (k) => U.hash3(wx, y, wz, 230 + k);
          const top = y + 1.0; const S = (u, v) => alongX ? [lx + u, lz + v] : [lx + v, lz + u]; // u along the bridge, v across
          for (let i = 0; i < 4; i++) { if (hp(i) < 0.14) continue; const u0 = i * 0.25 + 0.02, u1 = u0 + 0.21; const [ax, az] = S(u0, 0.08), [bx, bz] = S(u1, 0.92); const m = 0.85 + hp(i + 4) * 0.3; const tilt = (hp(i + 8) - 0.5) * 0.05;
            op.box(Math.min(ax, bx), top - 0.1 + tilt, Math.min(az, bz), Math.max(ax, bx), top + tilt, Math.max(az, bz), [wood[0] * m, wood[1] * m, wood[2] * m], sk, false); }
          for (const v of [0.06, 0.94]) { const [ax, az] = S(0, v), [bx, bz] = S(1, v); op.tube([[ax, top - 0.14, az], [bx, top - 0.14, bz]], [0.03, 0.03], rope, { sky: sk, segs: 4, cap0: 'none', cap1: 'none' }); } // the ropes the slats hang on
          for (const v of [0.02, 0.98]) { // posts and the hand ropes, sagging between posts
            const [px, pz] = S(0.5, v); op.tube([[px, top - 0.05, pz], [px, top + 0.72, pz]], [0.028, 0.022], wood, { sky: sk, segs: 4, cap0: 'none', cap1: 'round' });
            const [ax, az] = S(0, v), [bx, bz] = S(1, v); op.tube([[ax, top + 0.62, az], [px, top + 0.56 + hp(12) * 0.04, pz], [bx, top + 0.62, bz]], [0.02, 0.02, 0.02], rope, { sky: sk, segs: 4, cap0: 'none', cap1: 'none' });
            const [cx, cz] = S(0, v), [dx, dz] = S(0.5, v); op.tube([[cx, top + 0.3, cz], [dx, top + 0.26, dz]], [0.012, 0.012], rope, { sky: sk, segs: 3, cap0: 'none', cap1: 'none' }); // a lower rope on the near half (the far half comes from the next block)
            const [ex, ez] = S(0.5, v), [fx, fz] = S(1, v); op.tube([[ex, top + 0.26, ez], [fx, top + 0.3, fz]], [0.012, 0.012], rope, { sky: sk, segs: 3, cap0: 'none', cap1: 'none' });
          }
          continue;
        }
        if (id === B.INCUBATOR) { // the incubator: a riveted brass drum with a warm glow in its vents, a glass bell on top, three brass cups for the eggs
          const sk = skyAt(lx, y + 1, lz); const cx = lx + 0.5, cz = lz + 0.5; const brass = [0.7, 0.55, 0.28], dark = [0.3, 0.25, 0.18], glow = [1.0, 0.72, 0.35];
          op.tube([[cx, y, cz], [cx, y + 0.06, cz], [cx, y + 0.4, cz], [cx, y + 0.46, cz]], [0.46, 0.48, 0.44, 0.4], brass, { sky: sk, segs: 16, cap0: 'flat', cap1: 'flat', shade: (p, nx, ny, nz, t) => { const v = (t > 0.3 && t < 0.7 && Math.floor((Math.atan2(nz, nx) / 6.283 + 1) * 24) % 3 === 0) ? 1 : 0; return v ? glow : [brass[0] * (0.85 + 0.15 * ny), brass[1] * (0.85 + 0.15 * ny), brass[2] * (0.85 + 0.15 * ny)]; } });
          for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; op.ball(cx + Math.cos(a) * 0.45, y + 0.12, cz + Math.sin(a) * 0.45, 0.025, dark, { sky: sk, n: 1 }); op.ball(cx + Math.cos(a) * 0.43, y + 0.36, cz + Math.sin(a) * 0.43, 0.025, dark, { sky: sk, n: 1 }); } // rivets
          op.blob(cx - 0.3, y + 0.42, cz - 0.3, cx + 0.3, y + 0.52, cz + 0.3, 0.3, glow, { emis: true, n: 2 }); // the warm plate the eggs sit on
          for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + 1.57; op.tube([[cx + Math.cos(a) * 0.2, y + 0.46, cz + Math.sin(a) * 0.2], [cx + Math.cos(a) * 0.2, y + 0.54, cz + Math.sin(a) * 0.2]], [0.1, 0.12], brass, { sky: sk, segs: 8, cap0: 'none', cap1: 'none' }); } // the cups
          op.tube([[cx, y + 0.98, cz], [cx, y + 1.08, cz]], [0.06, 0.03], brass, { sky: sk, segs: 8, cap0: 'none', cap1: 'round' }); // the knob on the bell
          // the bell: on the glass mesh, a dome of rings
          const R0 = 0.44; const rings = 7, segs = 16; const base = gs.nv; const gc = [0.8, 0.95, 1.0];
          for (let i = 0; i <= rings; i++) { const t = i / rings; const yy = y + 0.46 + Math.sin(t * 1.5708) * 0.52; const rr = R0 * Math.cos(t * 1.5708) + (i === rings ? 0.001 : 0); for (let j = 0; j <= segs; j++) { const a = j / segs * 6.283; const nx = Math.cos(a) * Math.cos(t * 1.5708), ny = Math.sin(t * 1.5708), nz = Math.sin(a) * Math.cos(t * 1.5708); gs.vert(cx + Math.cos(a) * rr, yy, cz + Math.sin(a) * rr, nx, ny, nz, gc[0], gc[1], gc[2], sk, false); } }
          for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const a = base + i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1; gs.tri(a, c, b); gs.tri(b, c, d); }
          continue;
        }
        if (id === B.PALISADE) { // a palisade: two stout posts per block, pointed where the wall ends above
          const sk = skyAt(lx, y + 1, lz); const isP = (b) => b === B.PALISADE;
          const ax = (isP(get(lx + 1, y, lz)) || isP(get(lx - 1, y, lz))) ? 'x' : (isP(get(lx, y, lz + 1)) || isP(get(lx, y, lz - 1))) ? 'z' : 'x';
          const tip = !isP(get(lx, y + 1, lz)) && !isOpaque(get(lx, y + 1, lz)); const bark = [0.5, 0.36, 0.2]; const seed = wx * 3 + wz * 7;
          for (const t of [0.27, 0.73]) {
            const cx = ax === 'x' ? lx + t : lx + 0.5, cz = ax === 'x' ? lz + 0.5 : lz + t; const r = 0.23; const h0 = U.hash3(wx, t * 10, wz, 150);
            const path = [[cx, y - 0.1, cz], [cx, y + (tip ? 0.86 : 1.0), cz]]; const rad = [r, r];
            if (tip) { path.push([cx, y + 1.08 + h0 * 0.25, cz], [cx, y + 1.42 + h0 * 0.3, cz]); rad.push(r * 0.72, 0.01); }
            op.tube(path, rad, bark, { sky: sk, segs: 7, cap0: 'none', cap1: tip ? 'none' : 'none', shade: (p, nx, ny, nz, tt) => { const seg = Math.floor(Math.atan2(nx, nz) * 1.11 + 7); const k = U.hash3(seg, seed, Math.round(t * 10), 5); const m = (0.8 + k * 0.4) * (tt > 0.6 && tip ? 1.15 : 1); return [bark[0] * m, bark[1] * m, bark[2] * m]; } });
          }
          if (isP(get(lx, y - 1, lz)) || !isOpaque(get(lx, y - 1, lz))) {} // posts run on down; nothing to close
          // a binding rail between the posts
          const ry = y + 0.5 + U.hash3(wx, y, wz, 151) * 0.2; if (ax === 'x') op.box(lx, ry, lz + 0.42, lx + 1, ry + 0.1, lz + 0.58, [0.42, 0.3, 0.16], sk, false); else op.box(lx + 0.42, ry, lz, lx + 0.58, ry + 0.1, lz + 1, [0.42, 0.3, 0.16], sk, false);
          continue;
        }
        if (id === B.LAMP) { // a street lamp: an iron post with a caged lantern, or a lantern hung from a beam
          const sk = skyAt(lx, y, lz); const iron = [0.16, 0.17, 0.2], glass = [1.0, 0.86, 0.5]; const cx = lx + 0.5, cz = lz + 0.5;
          const hanging = isOpaque(get(lx, y + 1, lz)) && !isSolid(get(lx, y - 1, lz)); let ly;
          if (hanging) { op.tube([[cx, y + 1, cz], [cx, y + 0.74, cz]], [0.02, 0.02], iron, { sky: sk, segs: 4, cap0: 'none', cap1: 'none' }); ly = y + 0.3; }
          else { op.blob(cx - 0.2, y, cz - 0.2, cx + 0.2, y + 0.1, cz + 0.2, 0.5, iron, { sky: sk, n: 2 }); op.tube([[cx, y + 0.08, cz], [cx, y + 0.9, cz], [cx, y + 1.0, cz], [cx, y + 1.62, cz]], [0.065, 0.05, 0.07, 0.045], iron, { sky: sk, segs: 6, cap0: 'none', cap1: 'flat' }); ly = y + 1.62; }
          const w = 0.16, hgt = 0.32;
          op.blob(cx - w * 0.78, ly + 0.02, cz - w * 0.78, cx + w * 0.78, ly + hgt - 0.02, cz + w * 0.78, 0.2, glass, { emis: true, n: 1 });
          for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) op.box(cx + a * w - 0.018, ly, cz + b * w - 0.018, cx + a * w + 0.018, ly + hgt, cz + b * w + 0.018, iron, sk, false);
          op.box(cx - w - 0.03, ly - 0.03, cz - w - 0.03, cx + w + 0.03, ly + 0.01, cz + w + 0.03, iron, sk, false);
          op.blob(cx - w - 0.06, ly + hgt, cz - w - 0.06, cx + w + 0.06, ly + hgt + 0.17, cz + w + 0.06, 0.25, iron, { sky: sk, n: 2, tap: [1, 0.25] });
          op.ball(cx, ly + hgt + 0.2, cz, 0.035, iron, { sky: sk, n: 1 });
          continue;
        }
        if (id === B.FLOWERBOX) { // a window box against the wall behind it, spilling flowers
          const sk = skyAt(lx, y + 1, lz); let d = null; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (isOpaque(get(lx + a, y, lz + b)) || isOpaque(get(lx + a, y - 1, lz + b))) { d = [a, b]; break; } if (!d) d = [0, -1];
          const cx = lx + 0.5 + d[0] * 0.34, cz = lz + 0.5 + d[1] * 0.34; const hw = d[0] ? 0.16 : 0.44, hd = d[0] ? 0.44 : 0.16; const wood = [0.44, 0.3, 0.15], soil = [0.25, 0.17, 0.1];
          op.box(cx - hw, y, cz - hd, cx + hw, y + 0.28, cz + hd, wood, sk, false); op.box(cx - hw + 0.04, y + 0.2, cz - hd + 0.04, cx + hw - 0.04, y + 0.29, cz + hd - 0.04, soil, sk, false);
          op.box(cx - hw - 0.03, y + 0.26, cz - hd - 0.03, cx + hw + 0.03, y + 0.3, cz + hd + 0.03, wood, sk, false); // the lip
          const h0 = U.hash3(wx, y, wz, 140); const cols = [[0.95, 0.3, 0.35], [0.98, 0.75, 0.2], [0.9, 0.9, 0.95], [0.75, 0.45, 0.9], [0.98, 0.55, 0.25]]; const c1 = cols[Math.floor(h0 * 5)], c2 = cols[(Math.floor(h0 * 5) + 2) % 5];
          for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6 - 0.5; const px = cx + (d[0] ? (U.hash3(wx, y, wz, 141 + k) - 0.5) * 0.16 : t * 0.8), pz = cz + (d[1] ? (U.hash3(wx, y, wz, 141 + k) - 0.5) * 0.16 : t * 0.8); const hh = 0.12 + U.hash3(wx, y, wz, 147 + k) * 0.14;
            op.blob(px - 0.09, y + 0.22, pz - 0.09, px + 0.09, y + 0.34 + hh * 0.3, pz + 0.09, 0.85, [0.28, 0.55, 0.22], { sky: sk, n: 1 }); op.ball(px + (U.hash3(wx, y, wz, 153 + k) - 0.5) * 0.06, y + 0.36 + hh, pz, 0.065, k % 2 ? c1 : c2, { sky: sk, n: 2 }); }
          continue;
        }
        // grass: a tuft of blades on every open grass top, and now and then a flower
        if (id === B.GRASS && y + 1 < WH && blocks[base + y + 1] === B.AIR) {
          const sk = skyAt(lx, y + 1, lz); const top0 = y + 1.0; const c00 = CHt(lx, lz) >= 0 ? CHt(lx, lz) : top0, c10 = CHt(lx + 1, lz) >= 0 ? CHt(lx + 1, lz) : top0, c01 = CHt(lx, lz + 1) >= 0 ? CHt(lx, lz + 1) : top0, c11 = CHt(lx + 1, lz + 1) >= 0 ? CHt(lx + 1, lz + 1) : top0;
          for (let i = 0; i < blades; i++) {
            const hx = U.hash3(wx, y, wz, 101 + i), hz = U.hash3(wx, y, wz, 201 + i), hh = U.hash3(wx, y, wz, 301 + i), ha = U.hash3(wx, y, wz, 401 + i);
            const bx = lx + 0.08 + hx * 0.84, bz = lz + 0.08 + hz * 0.84; const fx = bx - lx, fz = bz - lz; const top = U.lerp(U.lerp(c00, c10, fx), U.lerp(c01, c11, fx), fz); const hgt = 0.12 + hh * hh * 0.4; const a = ha * Math.PI; const w = 0.035 + hh * 0.025;
            const dx = Math.cos(a) * w, dz = Math.sin(a) * w; const lean = (hx - 0.5) * 0.18;
            const flower = U.hash3(wx, y, wz, 501 + i) < 0.05 && i === 0;
            const baseC = [tint[0] * 0.62, tint[1] * 0.66, tint[2] * 0.5], tipC = flower ? FLOWERS[Math.floor(hh * FLOWERS.length) % FLOWERS.length] : [tint[0] * 0.95 + 0.12, tint[1] * 1.0 + 0.06, tint[2] * 0.7];
            const tipY = top + hgt + (flower ? 0.12 : 0);
            gr.quad([[bx - dx, top + 0.001, bz - dz], [bx + dx, top + 0.001, bz + dz], [bx + lean * 0.5 + dx * 0.4, top + hgt * 0.6, bz + lean * 0.3 + dz * 0.4], [bx + lean * 0.5 - dx * 0.4, top + hgt * 0.6, bz + lean * 0.3 - dz * 0.4]], [baseC, baseC, [U.lerp(baseC[0], tipC[0], 0.6), U.lerp(baseC[1], tipC[1], 0.6), U.lerp(baseC[2], tipC[2], 0.6)], [U.lerp(baseC[0], tipC[0], 0.6), U.lerp(baseC[1], tipC[1], 0.6), U.lerp(baseC[2], tipC[2], 0.6)]], [sk, sk, sk, sk], false);
            const m0 = [bx + lean * 0.5 + dx * 0.4, top + hgt * 0.6, bz + lean * 0.3 + dz * 0.4], m1 = [bx + lean * 0.5 - dx * 0.4, top + hgt * 0.6, bz + lean * 0.3 - dz * 0.4], tp = [bx + lean, tipY, bz + lean * 0.6];
            const mc = [U.lerp(baseC[0], tipC[0], 0.6), U.lerp(baseC[1], tipC[1], 0.6), U.lerp(baseC[2], tipC[2], 0.6)];
            gr.quad([m1, m0, tp, tp], [mc, mc, tipC, tipC], [sk, sk, sk, sk], false);
            if (flower) { const fc = tipC; const s = 0.07; gr.quad([[tp[0] - s, tp[1], tp[2]], [tp[0], tp[1], tp[2] - s], [tp[0] + s, tp[1], tp[2]], [tp[0], tp[1], tp[2] + s]], [fc, fc, fc, fc], [sk, sk, sk, sk], false); }
          }
        }
        op.curMat = MAT_OF[id] || 0;
        if (isLeaf(id)) { // leaves: soft puffs that overlap into a canopy. Leaf blocks are grouped in 2x2x2 cells: the cell's even corner draws one big puff for all of them; a leaf whose cell corner is not a leaf draws its own small one
          const exposedAt = (x, yy, z) => { for (let f = 0; f < 6; f++) { const F = FACES[f]; const nid = get(x + F.n[0], yy + F.n[1], z + F.n[2]); if (!(isLeaf(nid) || isOpaque(nid))) return true; } return false; };
          const ax = lx - (wx & 1), ay = y - (y & 1), az = lz - (wz & 1); // this block's 2x2x2 cell; the first leaf in the cell draws one puff for all
          let first = true, any = false, nLeaf = 0, sx = 0, sy = 0, sz = 0, x0 = 9, x1 = -9, y0 = 9, y1 = -9, z0 = 9, z1 = -9;
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const bx = ax + i, by = ay + j, bz = az + k; const b = get(bx, by, bz); if (!isLeaf(b)) continue; nLeaf++; sx += bx; sy += by; sz += bz; x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); z0 = Math.min(z0, k); z1 = Math.max(z1, k); if (first && (bx !== lx || by !== y || bz !== lz)) { if (bx < lx || (bx === lx && (by < y || (by === y && bz < lz)))) first = false; } if (!any && exposedAt(bx, by, bz)) any = true; }
          if (!first || !any) continue;
          // the puff sits on the leaves it stands for: centred on them, stretched along whichever way they run (a hanging strand stays a strand)
          let cx = sx / nLeaf + 0.5, cy = sy / nLeaf + 0.5, cz = sz / nLeaf + 0.5;
          const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(wx, y, wz, 61), h1 = U.hash3(wx, y, wz, 62), h2 = U.hash3(wx, y, wz, 63);
          const rs = 0.94 + h0 * 0.14; const rx = (0.66 + (x1 - x0) * 0.5) * rs, ry = (0.56 + (y1 - y0) * 0.44) * rs, rz = (0.66 + (z1 - z0) * 0.5) * rs; const r = Math.max(rx, rz);
          cx += (h1 - 0.5) * 0.2; cz += (h2 - 0.5) * 0.2; cy += (h0 - 0.5) * 0.12;
          let around = 0; for (let f = 0; f < 6; f++) { const F = FACES[f]; const nid = get(lx + F.n[0], y + F.n[1], lz + F.n[2]); if (isLeaf(nid) || isOpaque(nid)) around++; }
          const dark = 1 - 0.06 * Math.max(0, around - 2); // deeper in the crown, darker
          let c; if (id === B.NEEDLES) { const nv = 0.9 + h1 * 0.2; c = [0.19 * nv, 0.42 * nv, 0.3 * nv]; } else { const warm = id === B.BERRYLEAF ? 1 : 0; c = [tint[0] * (0.9 + warm * 0.25) * vr, tint[1] * 1.02 * vr, tint[2] * 0.72 * vr]; }
          const hue = (h2 - 0.5) * 0.16; c = [c[0] * dark * (1 + hue), c[1] * dark, c[2] * dark * (1 - hue)]; // some puffs yellower, some bluer
          op.blob(cx - rx, cy - ry, cz - rz, cx + rx, cy + ry, cz + rz, 0.9, [c[0] * 1.08, c[1] * 1.06, c[2]], { sky: sk, n: nLeaf >= 4 && !lod ? 3 : 2, under: [c[0] * 0.5, c[1] * 0.56, c[2] * 0.62], split: 0.05, soft: 0.7 });
          if (id === B.BERRYLEAF) for (let k = 0; k < 3; k++) { const a = U.hash3(wx, y, wz, 64 + k) * 6.283, e = 0.2 + U.hash3(wx, y, wz, 67 + k) * 0.6; op.ball(cx + Math.cos(a) * r * 0.85, cy + r * 0.8 * (e - 0.4), cz + Math.sin(a) * r * 0.85, 0.08, [0.9, 0.15, 0.22], { sky: sk, n: 2 }); }
          continue;
        }
        if (id === B.PALMLOG) { // the lowest trunk block draws the whole palm: a curved trunk, a crown of arching fronds, coconuts. The trunk blocks above it draw nothing
          const isPalm = (b) => b === B.PALMLOG; const STEPS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
          if (STEPS.some(([a, b]) => isPalm(get(lx + a, y - 1, lz + b)))) continue;
          const dn = get(lx, y - 1, lz); const path = [[lx + 0.5, SOIL.has(dn) ? y - 0.6 : y, lz + 0.5]]; let px = lx, py = y, pz = lz;
          for (let k = 0; k < 16; k++) { path.push([px + 0.5, py + 0.5, pz + 0.5]); const st = STEPS.find(([a, b]) => isPalm(get(px + a, py + 1, pz + b))); if (!st) break; px += st[0]; pz += st[1]; py++; }
          const crownId = get(px, py + 1, pz); const crown = crownId === B.FROND || isLeaf(crownId);
          { const n0 = path.length, last = path[n0 - 1], prev = path[Math.max(0, n0 - 2)]; path.push([last[0] + (last[0] - prev[0]) * 0.5, last[1] + 0.5, last[2] + (last[2] - prev[2]) * 0.5]); } // the trunk top, carried on along its curve
          const sm = path.map((p, i) => (i === 0 || i === path.length - 1) ? p : [(path[i - 1][0] + 2 * p[0] + path[i + 1][0]) / 4, (path[i - 1][1] + 2 * p[1] + path[i + 1][1]) / 4, (path[i - 1][2] + 2 * p[2] + path[i + 1][2]) / 4]);
          const fine = []; for (let i = 0; i < sm.length; i++) { fine.push(sm[i]); if (i < sm.length - 1) fine.push([(sm[i][0] + sm[i + 1][0]) / 2, (sm[i][1] + sm[i + 1][1]) / 2, (sm[i][2] + sm[i + 1][2]) / 2]); }
          const N = fine.length; const hp = (k) => U.hash3(wx, y, wz, 130 + k);
          const sk = skyAt(lx, y + 1, lz), skc = skyAt(px, py + 2, pz);
          const bark = [0.58, 0.47, 0.31];
          op.tube(fine, fine.map((p, i) => { const t = i / (N - 1); return (0.4 - 0.13 * t) * (i % 2 ? 1 : 0.93) * (i === 0 ? 1.25 : 1); }), bark, { sky: sk, segs: 8, cap0: 'flat', cap1: crown ? 'none' : 'flat', shade: (p, nx, ny, nz, t) => { const ring = Math.round(t * (N - 1)); const k = U.hash3(ring, wx, wz, 7); const m = (ring % 2 ? 0.8 : 1.0) * (0.9 + k * 0.2); return [bark[0] * m, bark[1] * m, bark[2] * m]; } });
          if (crown) {
            const T = fine[N - 1]; const green = [0.2, 0.5, 0.19], tipc = [0.5, 0.64, 0.2], rib = [0.62, 0.66, 0.3], dead = [0.58, 0.45, 0.22];
            const frond = (a, L, lift, droopEnd, wmax, col, tcol, M) => { // one leaf: out along angle a, rising by lift then drooping droopEnd below the crown
              const dx = Math.cos(a), dz = Math.sin(a); const spine = [], ws = [];
              for (let i = 0; i <= M; i++) { const t = i / M; const yy = lift * Math.sin(Math.PI * t) * (1 - 0.3 * t) - droopEnd * t * t; spine.push([T[0] + dx * t * L, T[1] + yy, T[2] + dz * t * L]); ws.push((wmax * Math.sqrt(Math.sin(Math.PI * Math.min(0.999, t * 0.92 + 0.04))) * (1 - 0.3 * t) + 0.02) * (i % 2 ? 0.72 : 1)); }
              op.ribbon(spine, ws, col, { sky: skc, tip: tcol, rib, droop: 0.55 });
            };
            const nF = 9, a0 = hp(1) * 6.283;
            for (let k = 0; k < nF; k++) frond(a0 + k / nF * 6.283 + (hp(2 + k) - 0.5) * 0.45, 2.2 + hp(12 + k) * 0.9, 0.55 + hp(22 + k) * 0.5, 1.2 + hp(32 + k) * 0.5, 0.5, green, tipc, 10);
            for (let k = 0; k < 3; k++) frond(a0 + 0.7 + k / 3 * 6.283, 0.9 + hp(42 + k) * 0.4, 1.3, -0.1, 0.26, [0.3, 0.6, 0.24], [0.6, 0.72, 0.3], 6); // young fronds standing up from the heart
            for (let k = 0; k < 2; k++) { const a = a0 + 1.9 + k * 2.6; const dx = Math.cos(a), dz = Math.sin(a); const spine = [], ws = []; for (let i = 0; i <= 6; i++) { const t = i / 6; spine.push([T[0] + dx * (0.35 + 0.25 * t), T[1] - 0.1 - 1.7 * t * t, T[2] + dz * (0.35 + 0.25 * t)]); ws.push((0.3 * Math.sin(Math.PI * Math.min(0.999, t * 0.9 + 0.05)) + 0.02) * (i % 2 ? 0.72 : 1)); } op.ribbon(spine, ws, dead, { sky: skc, tip: [0.42, 0.32, 0.16], droop: 0.6 }); } // dead fronds hanging under the crown
            for (let k = 0; k < 4; k++) { const a = a0 + 0.4 + k * 1.5; op.ball(T[0] + Math.cos(a) * 0.24, T[1] - 0.18 - (k % 2) * 0.1, T[2] + Math.sin(a) * 0.24, 0.15, k % 2 ? [0.42, 0.29, 0.11] : [0.36, 0.34, 0.14], { sky: skc, n: 2 }); } // coconuts
          }
          continue;
        }
        if (id === B.LOG || id === B.BIRCHLOG) { // a free-standing log is round (a trunk, a post, a beam); one built into a wall stays square
          const isLog = (b) => b === B.LOG || b === B.BIRCHLOG; const free = (b) => !isOpaque(b) || isLog(b);
          const up = get(lx, y + 1, lz), dn = get(lx, y - 1, lz), xp = get(lx + 1, y, lz), xm = get(lx - 1, y, lz), zp = get(lx, y, lz + 1), zm = get(lx, y, lz - 1);
          const vy = isLog(up) || isLog(dn) || isLeaf(up), vx = isLog(xp) || isLog(xm), vz = isLog(zp) || isLog(zm);
          let axis = 'y'; if (!vy && (vx || vz)) axis = vx ? 'x' : 'z';
          const perp = axis === 'y' ? [xp, xm, zp, zm] : axis === 'x' ? [up, dn, zp, zm] : [up, dn, xp, xm];
          if (perp.every(free) && !((vx || vz) && vy)) {
            const sk = skyAt(lx, y + 1, lz); const birch = id === B.BIRCHLOG; const base = birch ? [0.9, 0.88, 0.84] : [0.5, 0.36, 0.2];
            const a0 = [lx + 0.5, y + 0.5, lz + 0.5], a1 = [lx + 0.5, y + 0.5, lz + 0.5]; const n0 = axis === 'y' ? dn : axis === 'x' ? xm : zm, n1 = axis === 'y' ? up : axis === 'x' ? xp : zp;
            if (axis === 'y') { a0[1] = (!isLog(dn) && SOIL.has(dn)) ? y - 0.5 : y; a1[1] = y + 1; } else if (axis === 'x') { a0[0] = lx; a1[0] = lx + 1; } else { a0[2] = lz; a1[2] = lz + 1; }
            const rr = birch ? 0.4 : 0.5; const seed = wx * 7 + wz * 13 + y;
            op.tube([a0, a1], [rr, rr], base, { sky: sk, segs: 8, cap0: isLog(n0) ? 'none' : 'flat', cap1: isLog(n1) || isLeaf(n1) ? 'none' : 'flat', shade: (p, nx, ny, nz, t) => { const seg = Math.floor(Math.atan2(nx, nz) * 1.27 + 8) ; const k = U.hash3(seg, seed, 3, 5); if (birch) return k < 0.22 ? [0.25, 0.22, 0.2] : [0.9 * (0.94 + k * 0.1), 0.88 * (0.94 + k * 0.1), 0.84]; const m = 0.78 + k * 0.4; return [0.5 * m, 0.36 * m, 0.2 * m]; } });
            continue;
          }
        }
        if (id === B.FROND) { // a palm frond: a long drooping leaf pointing away from the trunk. The crown of a standing palm is drawn by its trunk
          if (get(lx, y - 1, lz) === B.PALMLOG) continue;
          const sk = skyAt(lx, y + 1, lz); let dir = null;
          for (let d = 1; d <= 3 && !dir; d++) for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { for (const dy of [0, -1, 1, -2]) { const b = get(lx + ax * d, y + dy, lz + az * d); if (b === B.LOG) { const l = Math.hypot(ax, az); dir = [-ax / l, -az / l]; break; } } if (dir) break; }
          if (!dir) { const a = U.hash3(wx, y, wz, 83) * 6.283; dir = [Math.cos(a), Math.sin(a)]; }
          const L = 1.9, pts = [], n = 6; const ox0 = lx + 0.5 - dir[0] * 0.6, oz0 = lz + 0.5 - dir[1] * 0.6;
          for (let i = 0; i <= n; i++) { const t = i / n; const w = 0.3 * Math.sin(Math.min(1, t * 1.3) * 3.14) * (i % 2 ? 1 : 0.6); const hgt = 0.5 + 0.6 * Math.sin(t * 2.2) - t * t * 1.3; pts.push([ox0 + dir[0] * t * L - dir[1] * w, y + hgt, oz0 + dir[1] * t * L + dir[0] * w]); }
          for (let i = n - 1; i >= 1; i--) { const t = i / n; const w = 0.3 * Math.sin(Math.min(1, t * 1.3) * 3.14) * (i % 2 ? 1 : 0.6); const hgt = 0.5 + 0.6 * Math.sin(t * 2.2) - t * t * 1.3; pts.push([ox0 + dir[0] * t * L + dir[1] * w, y + hgt, oz0 + dir[1] * t * L - dir[0] * w]); }
          op.plate(pts, 0.03, [tint[0] * 0.85, tint[1] * 1.02, tint[2] * 0.7], { sky: sk, edge: [tint[0] * 0.6, tint[1] * 0.75, tint[2] * 0.5] });
          continue;
        }
        if (id === B.BOULDER) { // a rounded rock, bigger than its block, sitting in the ground
          const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(wx, y, wz, 84), h1 = U.hash3(wx, y, wz, 85); const gy = gnd(lx, y, lz);
          const stonePal = world.preset.paletteRgb && world.preset.paletteRgb[B.STONE]; const sc = stonePal ? stonePal[1] : BLOCKS[B.STONE].side; const c = [sc[0] * (0.85 + h0 * 0.2), sc[1] * (0.85 + h0 * 0.2), sc[2] * (0.88 + h0 * 0.2)];
          op.push(); op.rotate(0.15, h1 * 6.283, 0.1, [lx + 0.5, gy + 0.3, lz + 0.5]);
          op.blob(lx - 0.25 - h1 * 0.2, gy - 0.35, lz - 0.2, lx + 1.25 + h0 * 0.2, gy + 0.75 + h0 * 0.3, lz + 1.2, 0.75, c, { sky: sk, n: 3, tap: [1.08, 0.78] });
          op.pop();
          if (h0 > 0.5) op.blob(lx + 0.2, gy + 0.55 + h0 * 0.3, lz + 0.15, lx + 0.9, gy + 0.8 + h0 * 0.3, lz + 0.85, 0.9, [0.4, 0.55, 0.28], { sky: sk, n: 2 }); // a cushion of moss
          continue;
        }
        if (id === B.MUSHROOM) { // one big or a few small: a pale stem and a red or brown cap
          const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(wx, y, wz, 86); const red = h0 < 0.55; const cap = red ? [0.8, 0.22, 0.2] : [0.62, 0.45, 0.28], stem = [0.92, 0.88, 0.78]; const gy = gnd(lx, y, lz);
          const n = h0 < 0.35 ? 1 : 3;
          for (let k = 0; k < n; k++) { const a = U.hash3(wx, y, wz, 87 + k) * 6.283; const cx = lx + 0.5 + (n > 1 ? Math.cos(a) * 0.26 : 0), cz = lz + 0.5 + (n > 1 ? Math.sin(a) * 0.26 : 0); const hgt = n > 1 ? 0.22 + U.hash3(wx, y, wz, 90 + k) * 0.16 : 0.45; const rc = n > 1 ? 0.14 : 0.32;
            op.tube([[cx, gy, cz], [cx, gy + hgt, cz]], [rc * 0.4, rc * 0.32], stem, { sky: sk, segs: 6, cap0: 'none', cap1: 'none' });
            op.blob(cx - rc, gy + hgt - rc * 0.5, cz - rc, cx + rc, gy + hgt + rc * 0.75, cz + rc, 0.9, cap, { sky: sk, n: 3, tap: [1, 0.7] });
            if (red) for (let d = 0; d < 3; d++) { const b = U.hash3(wx, y, wz, 93 + d + k * 3) * 6.283; op.ball(cx + Math.cos(b) * rc * 0.55, gy + hgt + rc * 0.5, cz + Math.sin(b) * rc * 0.55, rc * 0.18, [0.98, 0.95, 0.9], { sky: sk, n: 1 }); } }
          continue;
        }
        if (id === B.FLOWERS) { // a clump of wildflowers: stems, round heads, a couple of leaves
          const sk = skyAt(lx, y + 1, lz); const h0 = U.hash3(wx, y, wz, 96); const gy = gnd(lx, y, lz);
          const cols = [[0.98, 0.85, 0.2], [0.95, 0.95, 0.95], [0.9, 0.35, 0.55], [0.55, 0.5, 0.98], [0.98, 0.5, 0.25]]; const c = cols[Math.floor(h0 * cols.length)];
          for (let k = 0; k < 5; k++) { const a = U.hash3(wx, y, wz, 97 + k) * 6.283, d = 0.1 + U.hash3(wx, y, wz, 102 + k) * 0.3; const cx = lx + 0.5 + Math.cos(a) * d, cz = lz + 0.5 + Math.sin(a) * d; const hgt = 0.3 + U.hash3(wx, y, wz, 107 + k) * 0.3;
            op.tube([[cx, gy, cz], [cx + 0.03, gy + hgt, cz]], [0.02, 0.015], [0.3, 0.55, 0.22], { sky: sk, segs: 4, cap0: 'none', cap1: 'none' }); op.ball(cx + 0.03, gy + hgt + 0.03, cz, 0.065, k % 3 === 2 ? cols[(Math.floor(h0 * 5) + 1) % 5] : c, { sky: sk, n: 2 }); }
          op.plate([[lx + 0.3, gy + 0.01, lz + 0.4], [lx + 0.1, gy + 0.12, lz + 0.15], [lx + 0.35, gy + 0.08, lz + 0.2]], 0.01, [0.3, 0.58, 0.24], { sky: sk }); op.plate([[lx + 0.6, gy + 0.01, lz + 0.6], [lx + 0.9, gy + 0.14, lz + 0.8], [lx + 0.65, gy + 0.1, lz + 0.85]], 0.01, [0.32, 0.6, 0.25], { sky: sk });
          continue;
        }
        if (id === B.PEBBLES) { // a few small stones
          const sk = skyAt(lx, y + 1, lz); const stonePal = world.preset.paletteRgb && world.preset.paletteRgb[B.STONE]; const sc = stonePal ? stonePal[1] : BLOCKS[B.STONE].side; const gy = gnd(lx, y, lz);
          for (let k = 0; k < 4; k++) { const a = U.hash3(wx, y, wz, 110 + k) * 6.283, d = U.hash3(wx, y, wz, 114 + k) * 0.32; const r = 0.07 + U.hash3(wx, y, wz, 118 + k) * 0.09; const cx = lx + 0.5 + Math.cos(a) * d, cz = lz + 0.5 + Math.sin(a) * d; const m = 0.8 + U.hash3(wx, y, wz, 122 + k) * 0.35; op.blob(cx - r, gy - r * 0.4, cz - r, cx + r, gy + r * 0.7, cz + r, 0.8, [sc[0] * m, sc[1] * m, sc[2] * m], { sky: sk, n: 2 }); }
          continue;
        }
        if (id === B.BERRY) { // a bush: three leafy mounds and a scatter of red berries
          const sk = skyAt(lx, y + 1, lz); const g1 = [0.27, 0.55, 0.24], g2 = [0.34, 0.64, 0.27]; const gy = gnd(lx, y, lz);
          const h0 = U.hash3(wx, y, wz, 40);
          op.blob(lx + 0.1, gy, lz + 0.12, lx + 0.68, gy + 0.62, lz + 0.7, 0.85, g1, { sky: sk, n: 3 }); op.blob(lx + 0.35, gy, lz + 0.3, lx + 0.92, gy + 0.7 + h0 * 0.1, lz + 0.9, 0.85, g2, { sky: sk, n: 3 }); op.blob(lx + 0.22, gy + 0.2, lz + 0.05, lx + 0.8, gy + 0.78, lz + 0.6, 0.85, g1, { sky: sk, n: 3 });
          for (let k = 0; k < 7; k++) { const a = U.hash3(wx, y, wz, 50 + k) * 6.283, e = 0.3 + U.hash3(wx, y, wz, 60 + k) * 0.5; const bx = lx + 0.5 + Math.cos(a) * 0.36, bz = lz + 0.5 + Math.sin(a) * 0.36, by = gy + 0.25 + e * 0.5; op.ball(bx, by, bz, 0.07, [0.88, 0.14, 0.22], { sky: sk, n: 2 }); }
          continue;
        }
        if (id === B.CAMPFIRE) { // a ring of stones, crossed logs, a tall blue flame (this fire is a camp's heart, not an ordinary fire)
          const sk = skyAt(lx, y + 1, lz); const gy = gnd(lx, y, lz);
          for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.3; const r = 0.42; const st = 0.1 + U.hash3(wx, y, wz, 30 + k) * 0.05; op.blob(lx + 0.5 + Math.cos(a) * r - st, gy, lz + 0.5 + Math.sin(a) * r - st, lx + 0.5 + Math.cos(a) * r + st, gy + st * 1.6, lz + 0.5 + Math.sin(a) * r + st, 0.6, [0.44, 0.43, 0.47], { sky: sk, n: 2 }); }
          op.tube([[lx + 0.18, gy + 0.14, lz + 0.3], [lx + 0.82, gy + 0.14, lz + 0.7]], [0.07, 0.07], [0.36, 0.25, 0.14], { sky: sk, segs: 6 }); op.tube([[lx + 0.2, gy + 0.26, lz + 0.72], [lx + 0.8, gy + 0.26, lz + 0.28]], [0.07, 0.07], [0.33, 0.23, 0.12], { sky: sk, segs: 6 });
          const fl = 0.08 * Math.sin(U.hash3(wx, y, wz, 9) * 6);
          op.blob(lx + 0.28, gy + 0.2, lz + 0.28, lx + 0.72, gy + 0.85 + fl, lz + 0.72, 1, [0.45, 0.9, 1.0], { emis: true, n: 3, tap: [1, 0.25] });
          op.blob(lx + 0.38, gy + 0.32, lz + 0.38, lx + 0.62, gy + 1.0 + fl, lz + 0.62, 1, [0.88, 1.0, 1.0], { emis: true, n: 2, tap: [1, 0.2] });
          continue;
        }
        if (id === B.PORTAL) {
          const sk = skyAt(lx, y, lz); const stone = [0.3, 0.32, 0.42]; const glow = [0.45, 0.85, 1.0];
          op.box(lx + 0.05, y, lz + 0.35, lx + 0.25, y + 2.3, lz + 0.65, stone, sk, false); op.box(lx + 0.75, y, lz + 0.35, lx + 0.95, y + 2.3, lz + 0.65, stone, sk, false); op.box(lx + 0.05, y + 2.3, lz + 0.35, lx + 0.95, y + 2.55, lz + 0.65, stone, sk, false);
          op.box(lx + 0.25, y + 0.05, lz + 0.46, lx + 0.75, y + 2.3, lz + 0.54, glow, 1, true);
          continue;
        }
        if (id === B.DOOR || id === B.DOOR_OPEN) {
          const sk = skyAt(lx, y, lz); const wood = [0.6, 0.46, 0.27], dark = [0.42, 0.31, 0.17];
          const sxS = isSolid(blocks[((lx - 1 + CH) % CH * CH + lz) * WH + y]) || isSolid(blocks[((lx + 1) % CH * CH + lz) * WH + y]); // neighbours along x: the door spans x
          if (id === B.DOOR) { if (sxS) op.box(lx + 0.02, y, lz + 0.4, lx + 0.98, y + 1.95, lz + 0.6, wood, sk, false); else op.box(lx + 0.4, y, lz + 0.02, lx + 0.6, y + 1.95, lz + 0.98, wood, sk, false); }
          else { if (sxS) op.box(lx + 0.02, y, lz + 0.02, lx + 0.22, y + 1.95, lz + 0.98, wood, sk, false); else op.box(lx + 0.02, y, lz + 0.02, lx + 0.98, y + 1.95, lz + 0.22, wood, sk, false); }
          op.box(lx + 0.45, y + 0.9, lz + 0.45, lx + 0.55, y + 1.0, lz + 0.55, dark, sk, false); // the handle
          continue;
        }
        if (id === B.GLOWWORM) { // a fat little segmented worm, its back glowing, curled in the grass
          const sk = skyAt(lx, y, lz); const g = [0.85, 1.0, 0.42], gd = [0.5, 0.78, 0.26]; const gy = gnd(lx, y, lz);
          const h0 = U.hash3(wx, y, wz, 71), h1 = U.hash3(wx, y, wz, 72), a0 = U.hash3(wx, y, wz, 73) * 6.283;
          const cx = lx + 0.3 + h0 * 0.4, cz = lz + 0.3 + h1 * 0.4; const path = [], rr = [];
          for (let k = 0; k <= 5; k++) { const t = k / 5; const a = a0 + t * 1.6; path.push([cx + Math.cos(a) * 0.2 * t, gy + 0.06 + Math.sin(t * 3.14) * 0.03, cz + Math.sin(a) * 0.2 * t]); rr.push(k === 5 ? 0.03 : 0.065 - t * 0.02); }
          op.tube(path, rr, gd, { sky: sk, segs: 6, cap0: 'round', cap1: 'round' });
          for (let k = 1; k <= 4; k++) { const p0 = path[k]; op.ball(p0[0], p0[1] + 0.035, p0[2], 0.03, g, { emis: true, n: 2 }); }
          op.ball(path[0][0], path[0][1] + 0.01, path[0][2], 0.05, g, { emis: true, n: 2 }); // the lit head
          continue;
        }
        if (id === B.CHEST) { // a strongbox: planked body, a domed lid, iron bands and a brass lock
          const sk = skyAt(lx, y + 1, lz); const wood = [0.6, 0.44, 0.22], dark = [0.42, 0.3, 0.14], iron = [0.5, 0.52, 0.58], brass = [0.9, 0.72, 0.3];
          op.blob(lx + 0.08, y, lz + 0.12, lx + 0.92, y + 0.56, lz + 0.88, 0.12, wood, { sky: sk, n: 2 });
          op.blob(lx + 0.06, y + 0.5, lz + 0.1, lx + 0.94, y + 0.84, lz + 0.9, 0.55, dark, { sky: sk, n: 3, tap: [1, 0.86] });
          for (const bz of [0.3, 0.7]) { op.box(lx + 0.05, y + 0.02, lz + bz - 0.05, lx + 0.95, y + 0.56, lz + bz + 0.05, iron, sk, false); op.blob(lx + 0.05, y + 0.5, lz + bz - 0.05, lx + 0.95, y + 0.86, lz + bz + 0.05, 0.5, iron, { sky: sk, n: 2, tap: [1, 0.86] }); }
          op.blob(lx + 0.42, y + 0.42, lz + 0.04, lx + 0.58, y + 0.66, lz + 0.14, 0.3, brass, { sky: sk, n: 2 }); op.box(lx + 0.47, y + 0.48, lz + 0.02, lx + 0.53, y + 0.56, lz + 0.06, [0.2, 0.15, 0.08], sk, false);
          continue;
        }
        if (id === B.CORAL_R || id === B.CORAL_B || id === B.CORAL_Y || id === B.PEARLCORAL) {
          const sk = skyAt(lx, y + 1, lz); const c1 = info.top, c2 = info.side; const pearl = id === B.PEARLCORAL;
          const h0 = U.hash3(wx, y, wz, 81); const r = (k) => U.hash3(wx, y, wz, 82 + k);
          op.box(lx + 0.4, y, lz + 0.4, lx + 0.6, y + 0.55 + h0 * 0.35, lz + 0.6, c2, sk, false); // stem
          op.box(lx + 0.1 + r(1) * 0.2, y + 0.3, lz + 0.42, lx + 0.45, y + 0.42, lz + 0.58, c1, sk, pearl); op.box(lx + 0.55, y + 0.42 + r(2) * 0.2, lz + 0.42, lx + 0.9 - r(3) * 0.2, y + 0.54 + r(2) * 0.2, lz + 0.58, c1, sk, pearl);
          op.box(lx + 0.42, y + 0.5, lz + 0.1 + r(4) * 0.2, lx + 0.58, y + 0.62, lz + 0.45, c1, sk, pearl); op.box(lx + 0.42, y + 0.36, lz + 0.55, lx + 0.58, y + 0.5, lz + 0.9 - r(5) * 0.2, c1, sk, pearl);
          op.box(lx + 0.25, y + 0.55 + h0 * 0.35, lz + 0.25, lx + 0.75, y + 0.68 + h0 * 0.35, lz + 0.75, c1, sk, pearl); // fan top
          if (pearl) { op.box(lx + 0.42, y + 0.68 + h0 * 0.35, lz + 0.42, lx + 0.58, y + 0.84 + h0 * 0.35, lz + 0.58, [1, 0.97, 1], 1, true); }
          continue;
        }
        if (id === B.LADDER) { // two rails and rungs, flat against whichever side has a wall
          const sk = skyAt(lx, y, lz); const wood = [0.62, 0.47, 0.26], dark = [0.48, 0.35, 0.18];
          const wall = (dx, dz) => isOpaque(get(lx + dx, y, lz + dz));
          const sideAt = (yy) => { const w2 = (dx, dz) => isOpaque(get(lx + dx, yy, lz + dz)); return w2(1, 0) ? 'x+' : w2(-1, 0) ? 'x-' : w2(0, 1) ? 'z+' : w2(0, -1) ? 'z-' : null; };
          let side = sideAt(y); // a stretch with nothing behind it lines up with the rest of the ladder above or below, so it stays one ladder
          for (let k = 1; !side && k < 12; k++) { if (get(lx, y + k, lz) === B.LADDER) side = sideAt(y + k); if (!side && get(lx, y - k, lz) === B.LADDER) side = sideAt(y - k); }
          side = side || 'x+';
          const at = side === 'x+' ? 0.86 : side === 'x-' ? 0.02 : side === 'z+' ? 0.86 : 0.02;
          if (side[0] === 'x') { op.box(lx + at, y, lz + 0.12, lx + at + 0.12, y + 1, lz + 0.22, dark, sk, false); op.box(lx + at, y, lz + 0.78, lx + at + 0.12, y + 1, lz + 0.88, dark, sk, false); for (const r of [0.15, 0.4, 0.65, 0.9]) op.box(lx + at, y + r - 0.04, lz + 0.22, lx + at + 0.1, y + r + 0.04, lz + 0.78, wood, sk, false); }
          else { op.box(lx + 0.12, y, lz + at, lx + 0.22, y + 1, lz + at + 0.12, dark, sk, false); op.box(lx + 0.78, y, lz + at, lx + 0.88, y + 1, lz + at + 0.12, dark, sk, false); for (const r of [0.15, 0.4, 0.65, 0.9]) op.box(lx + 0.22, y + r - 0.04, lz + at, lx + 0.78, y + r + 0.04, lz + at + 0.1, wood, sk, false); }
          continue;
        }
        if (id === B.FERN) { // six fronds arching out from a crown, each a notched leaf
          const sk = skyAt(lx, y + 1, lz); const g = [0.25, 0.55, 0.21], g2 = [0.36, 0.7, 0.28]; const gy = gnd(lx, y, lz);
          const a0 = U.hash3(wx, y, wz, 74) * 6.283; const cx = lx + 0.5, cz = lz + 0.5;
          for (let k = 0; k < 6; k++) { const a = a0 + k / 6 * 6.283; const ux = Math.cos(a), uz = Math.sin(a); const L = 0.5 + U.hash3(wx, y, wz, 75 + k) * 0.25; const pts = [];
            const n = 5; for (let i = 0; i <= n; i++) { const t = i / n; const w = 0.09 * Math.sin(t * 3.14) * (i % 2 ? 1.3 : 0.7); const h = 0.08 + Math.sin(t * 2.4) * 0.42 * L; pts.push([cx + ux * t * L - uz * w, gy + h, cz + uz * t * L + ux * w]); }
            for (let i = n - 1; i >= 1; i--) { const t = i / n; const w = 0.09 * Math.sin(t * 3.14) * (i % 2 ? 1.3 : 0.7); const h = 0.08 + Math.sin(t * 2.4) * 0.42 * L; pts.push([cx + ux * t * L + uz * w, gy + h, cz + uz * t * L - ux * w]); }
            op.plate(pts, 0.012, k % 2 ? g : g2, { sky: sk, edge: g }); }
          continue;
        }
        if (id === B.MOONGLOW) {
          const sk = skyAt(lx, y, lz); const pulse = 0.3 + U.hash3(wx, y, wz, 77) * 0.08;
          op.box(lx + 0.44, y, lz + 0.44, lx + 0.56, y + 0.3, lz + 0.56, [0.12, 0.14, 0.2], sk, false);
          op.box(lx + 0.5 - pulse, y + 0.28, lz + 0.5 - pulse, lx + 0.5 + pulse, y + 0.28 + pulse * 2, lz + 0.5 + pulse, [0.75, 1.0, 0.45], 1, true);
          continue;
        }
        if (info.partial) { // torch: a stick, a bound head, a teardrop flame
          const sk = skyAt(lx, y, lz); const gy = gnd(lx, y, lz);
          op.tube([[lx + 0.5, gy, lz + 0.5], [lx + 0.5, gy + 0.58, lz + 0.5]], [0.05, 0.045], [0.45, 0.32, 0.17], { sky: sk, segs: 6, cap0: 'none' });
          op.blob(lx + 0.4, gy + 0.5, lz + 0.4, lx + 0.6, gy + 0.68, lz + 0.6, 0.4, [0.3, 0.22, 0.14], { sky: sk, n: 2 });
          op.blob(lx + 0.37, gy + 0.62, lz + 0.37, lx + 0.63, gy + 1.02, lz + 0.63, 1, [1.0, 0.72, 0.25], { emis: true, n: 3, tap: [1, 0.2] });
          op.blob(lx + 0.44, gy + 0.66, lz + 0.44, lx + 0.56, gy + 0.9, lz + 0.56, 1, [1.0, 0.95, 0.7], { emis: true, n: 2, tap: [1, 0.2] });
          continue;
        }
        if (id === B.FUSION || id === B.DARKTABLE) { // the fusion table: a flared stone pedestal with a rune ring and a crystal floating over it
          const dark = id === B.DARKTABLE; const sk = skyAt(lx, y + 1, lz);
          const stone = dark ? [0.12, 0.08, 0.16] : [0.36, 0.38, 0.5], rim = dark ? [0.22, 0.12, 0.3] : [0.5, 0.54, 0.68], glow = dark ? [0.75, 0.3, 1.0] : [0.5, 0.9, 1.0], glow2 = dark ? [1.0, 0.35, 0.4] : [0.85, 1.0, 1.0];
          op.tube([[lx + 0.5, y, lz + 0.5], [lx + 0.5, y + 0.12, lz + 0.5], [lx + 0.5, y + 0.5, lz + 0.5], [lx + 0.5, y + 0.82, lz + 0.5], [lx + 0.5, y + 0.95, lz + 0.5]], [0.47, 0.42, 0.26, 0.4, 0.46], stone, { sky: sk, segs: 10, cap0: 'none', cap1: 'flat' });
          op.tube([[lx + 0.5, y + 0.95, lz + 0.5], [lx + 0.5, y + 1.0, lz + 0.5]], [0.47, 0.47], rim, { sky: sk, segs: 10, cap0: 'none', cap1: 'flat' });
          for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; op.ball(lx + 0.5 + Math.cos(a) * 0.36, y + 1.01, lz + 0.5 + Math.sin(a) * 0.36, 0.035, glow, { emis: true, n: 2 }); }
          op.push(); op.rotate(0.35, U.hash3(wx, y, wz, 11) * 6.283, 0.25, [lx + 0.5, y + 1.42, lz + 0.5]);
          op.blob(lx + 0.34, y + 1.1, lz + 0.34, lx + 0.66, y + 1.8, lz + 0.66, 0.25, glow, { emis: true, n: 2, tap: [0.45, 0.25], bulge: 0.9 });
          op.blob(lx + 0.46, y + 1.2, lz + 0.46, lx + 0.54, y + 1.68, lz + 0.54, 0.2, glow2, { emis: true, n: 1, tap: [0.4, 0.3], bulge: 1.0 });
          op.pop();
          for (let k = 0; k < 3; k++) { const a = k / 3 * 6.283 + 0.4; op.push(); op.rotate(0.5, a, 0.3, [lx + 0.5 + Math.cos(a) * 0.3, y + 1.3, lz + 0.5 + Math.sin(a) * 0.3]); op.blob(lx + 0.5 + Math.cos(a) * 0.3 - 0.05, y + 1.18, lz + 0.5 + Math.sin(a) * 0.3 - 0.05, lx + 0.5 + Math.cos(a) * 0.3 + 0.05, y + 1.44, lz + 0.5 + Math.sin(a) * 0.3 + 0.05, 0.2, glow, { emis: true, n: 1, tap: [0.4, 0.2], bulge: 1.0 }); op.pop(); }
          continue;
        }
        const isWater = id === B.WATER || id === B.BRINE, isGlass = id === B.GLASS || id === B.SELGLASS;
        if (isGlass) { // glass set in a wall is a window: a frame with a cross, the pane in the middle of the block
          const wX = isOpaque(get(lx + 1, y, lz)) || isOpaque(get(lx - 1, y, lz)), wZ = isOpaque(get(lx, y, lz + 1)) || isOpaque(get(lx, y, lz - 1));
          if (wX !== wZ) {
            const sk = skyAt(lx, y + 1, lz); const wood = [0.36, 0.25, 0.14]; op.curMat = 6;
            const bx = (x0, y0, z0, x1, y1, z1) => op.box(lx + x0, y + y0, lz + z0, lx + x1, y + y1, lz + z1, wood, sk, false);
            if (wX) { bx(0, 0, 0.38, 1, 0.12, 0.62); bx(0, 0.88, 0.38, 1, 1, 0.62); bx(0, 0.12, 0.38, 0.12, 0.88, 0.62); bx(0.88, 0.12, 0.38, 1, 0.88, 0.62); bx(0.46, 0.12, 0.42, 0.54, 0.88, 0.58); bx(0.12, 0.46, 0.42, 0.88, 0.54, 0.58); }
            else { bx(0.38, 0, 0, 0.62, 0.12, 1); bx(0.38, 0.88, 0, 0.62, 1, 1); bx(0.38, 0.12, 0, 0.62, 0.88, 0.12); bx(0.38, 0.12, 0.88, 0.62, 0.88, 1); bx(0.42, 0.12, 0.46, 0.58, 0.88, 0.54); bx(0.42, 0.46, 0.12, 0.58, 0.54, 0.88); }
            op.curMat = 0; const gc = info.top; const gcol = [gc, gc, gc, gc], gsk = [sk, sk, sk, sk];
            if (wX) { gs.quad([[lx, y, lz + 0.49], [lx + 1, y, lz + 0.49], [lx + 1, y + 1, lz + 0.49], [lx, y + 1, lz + 0.49]], gcol, gsk, false, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]); gs.quad([[lx + 1, y, lz + 0.51], [lx, y, lz + 0.51], [lx, y + 1, lz + 0.51], [lx + 1, y + 1, lz + 0.51]], gcol, gsk, false, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]); }
            else { gs.quad([[lx + 0.49, y, lz + 1], [lx + 0.49, y, lz], [lx + 0.49, y + 1, lz], [lx + 0.49, y + 1, lz + 1]], gcol, gsk, false, [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]); gs.quad([[lx + 0.51, y, lz], [lx + 0.51, y, lz + 1], [lx + 0.51, y + 1, lz + 1], [lx + 0.51, y + 1, lz]], gcol, gsk, false, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]); }
            continue;
          }
        }
        const matSide = MAT_OF[id] || 0;
        for (let f = 0; f < 6; f++) {
          const F = FACES[f], n = F.n;
          op.curMat = id === B.GRASS ? (f === 2 ? 1 : 4) : id === B.GLOWGRASS ? 16 : matSide;
          const nx = lx + n[0], ny = y + n[1], nz = lz + n[2];
          const nid = get(nx, ny, nz);
          if (isWater) { if (nid !== B.AIR && nid !== B.TORCH && nid !== B.GLASS && nid !== B.SELGLASS && !(BLOCKS[nid].partial && !BLOCKS[nid].solid)) continue; }
          else if (isGlass) { if (nid === id || isOpaque(nid)) continue; }
          else if (id === B.LAVA) { if (nid !== B.AIR && nid !== B.TORCH && nid !== B.WATER) continue; }
          else if (isOpaque(nid)) { if (!(f === 2 && isTrunk(nid) && SOIL.has(id))) continue; }
          else if (isLeaf(id) && isLeaf(nid)) continue;
          // colour
          let c;
          const pal = world.preset.paletteRgb && world.preset.paletteRgb[id];
          const topC = pal ? pal[0] : info.top, sideC = pal ? pal[1] : info.side;
          if (f === 2) c = topC; else if (f === 3) c = id === B.GRASS ? BLOCKS[B.DIRT].side : sideC; else c = sideC;
          if (id === B.GRASS) { if (f === 2) c = tint; else c = BLOCKS[B.DIRT].side; }
          if (id === B.LEAVES) c = [tint[0] * 0.9, tint[1] * 0.98, tint[2] * 0.8];
          else if (id === B.BERRYLEAF) c = f === 2 ? [tint[0] * 0.7 + 0.3, tint[1] * 0.8, tint[2] * 0.6] : [0.62, 0.22, 0.26];
          const shade = FACE_SHADE[f] * vr;
          const emis = info.emissive && !(id === B.FUSION || id === B.DARKTABLE);
          const sk = skyAt(nx, ny, nz);
          const surf = SOIL.has(id) && ST(lx, lz) >= 0 && y <= ST(lx, lz);
          if (surf && f !== 2 && f !== 3) { // a side face exposed only by a small step: the slope covers it now
            const nxl = lx + n[0], nzl = lz + n[2]; const tn = ST(nxl, nzl);
            if (tn >= 0 && y > tn && ST(lx, lz) - tn <= 2) {
              const e0 = n[0] === 1 ? [lx + 1, lz] : n[0] === -1 ? [lx, lz] : n[2] === 1 ? [lx, lz + 1] : [lx, lz]; const e1 = n[0] !== 0 ? [e0[0], e0[1] + 1] : [e0[0] + 1, e0[1]];
              if (CHt(e0[0], e0[1]) >= 0 && CHt(e1[0], e1[1]) >= 0) continue;
            }
          }
          const verts = [], cols = [], skys = [], aos = [];
          const a = (n[0] !== 0) ? 0 : (n[1] !== 0) ? 1 : 2; // normal axis
          const sloped = surf && f === 2 && y === ST(lx, lz);
          const sink = (f !== 2 && f !== 3 && isTrunk(id) && ST(lx, lz) === y - 1) ? 0.5 : 0; // a square trunk standing on sloping ground reaches down into it
          for (let i = 0; i < 4; i++) {
            const v = F.v[i];
            let vy = sloped && CHt(lx + v[0], lz + v[2]) >= 0 ? CHt(lx + v[0], lz + v[2]) : y + v[1] - (v[1] === 0 ? sink : 0);
            if (surf && f !== 2 && f !== 3) { const ch = CHt(lx + v[0], lz + v[2]); if (ch >= 0) vy = Math.min(vy, ch); } // a side face of smoothed ground stops at the slope: nothing stands up out of it as a fin
            verts.push([lx + v[0], vy, lz + v[2]]);
            // ambient occlusion
            let ao = 1;
            if (!isWater && id !== B.LAVA) {
              const d = [0, 0, 0]; d[a] = n[a];
              const bAxis = a === 0 ? 1 : 0, cAxis = a === 2 ? 1 : 2;
              const db = v[bAxis] ? 1 : -1, dc = v[cAxis] ? 1 : -1;
              const p1 = [nx, ny, nz]; p1[bAxis] += db;
              const p2 = [nx, ny, nz]; p2[cAxis] += dc;
              const p3 = [nx, ny, nz]; p3[bAxis] += db; p3[cAxis] += dc;
              // a neighbour that is part of the same smoothed slope is not an occluder: the slope runs through it, so no corner darkens against it
              const occ = (q) => { const b = get(q[0], q[1], q[2]); if (!isOpaque(b)) return 0; if (sloped && SOIL.has(b)) { const tn = ST(q[0], q[2]); if (tn >= 0 && q[1] <= tn && Math.abs(tn - ST(lx, lz)) <= 2) return 0; } return 1; };
              const s1 = occ(p1), s2 = occ(p2), s3 = occ(p3);
              const lvl = (s1 && s2) ? 0 : 3 - (s1 + s2 + s3);
              ao = 0.64 + 0.12 * lvl;
            }
            aos.push(ao);
            const sh = shade * ao;
            cols.push([c[0] * sh, c[1] * sh, c[2] * sh]);
            skys.push(sk);
          }
          const pat = PATTERNS[id]; const pf = pat ? ((f === 2 || f === 3) ? (pat.top || pat.all) : (pat.side || pat.all)) : null;
          if (isWater) { // the depth under each corner, blended over the four columns that share it, so shallows shade into the deep without steps
            const dAt = (x, z) => { if (get(x, y, z) !== id) return 0; let d = 0; while (d < 10 && get(x, y - d - 1, z) === id) d++; return d + 1; }; const br = id === B.BRINE ? 1 : 0;
            if (f === 2) for (let i = 0; i < 4; i++) { const v = F.v[i]; const cx = lx + v[0], cz = lz + v[2]; let sum = 0; for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) sum += dAt(cx + a, cz + b); cols[i] = [Math.min(1, sum / 36), br, 0]; }
            else { const dc = [Math.min(1, dAt(lx, lz) / 9), br, 0]; for (let i = 0; i < 4; i++) cols[i] = dc; }
          }
          const nrms = sloped ? F.v.map(v => cornerN(lx + v[0], lz + v[2])) : null;
          if (!pf) { if (isWater) wa.quad(verts, cols, skys, false); else if (isGlass) gs.quad(verts, cols, skys, false); else op.quad(verts, cols, skys, emis, nrms); }
          else {
            // patterned face: sub-rectangles in face coordinates, then studs raised off the plane
            const o = verts[0]; const Uv = [verts[1][0] - o[0], verts[1][1] - o[1], verts[1][2] - o[2]], Vv = [verts[3][0] - o[0], verts[3][1] - o[1], verts[3][2] - o[2]];
            const stonePal = world.preset.paletteRgb && world.preset.paletteRgb[B.STONE];
            const baseC = pf.base === 'stone' ? (f === 2 ? (stonePal ? stonePal[0] : BLOCKS[B.STONE].top) : (stonePal ? stonePal[1] : BLOCKS[B.STONE].side)) : c;
            const aoAt = (u, v) => U.lerp(U.lerp(aos[0], aos[1], u), U.lerp(aos[3], aos[2], u), v);
            const at = (u, v) => [o[0] + Uv[0] * u + Vv[0] * v, o[1] + Uv[1] * u + Vv[1] * v, o[2] + Uv[2] * u + Vv[2] * v];
            for (const r of (pf.rects || [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1 }])) {
              const rc = r.col || baseC; const vs = [], cs = [], ss = [];
              for (const [u, v] of [[r.u0, r.v0], [r.u1, r.v0], [r.u1, r.v1], [r.u0, r.v1]]) { vs.push(at(u, v)); const sh = shade * aoAt(u, v) * r.mul; cs.push([rc[0] * sh, rc[1] * sh, rc[2] * sh]); ss.push(sk); }
              if (r.glass) gs.quad(vs, cs, ss, false); else op.quad(vs, cs, ss, !!r.emis);
            }
            const studs = typeof pf.studs === 'function' ? pf.studs((k) => U.hash3(wx, y * 8 + f, wz, k)) : pf.studs;
            if (studs && !lod) for (const s of studs) {
              const h = s.s / 2; const p0 = at(s.u - h, s.v - h), p1 = at(s.u + h, s.v + h);
              const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), y0 = Math.min(p0[1], p1[1]), y1 = Math.max(p0[1], p1[1]), z0 = Math.min(p0[2], p1[2]), z1 = Math.max(p0[2], p1[2]);
              const ex = n[0] * s.h, ey = n[1] * s.h, ez = n[2] * s.h;
              const sc = s.col || baseC; const m = (s.mul || 1) * vr;
              op.box(Math.min(x0, x0 + ex), Math.min(y0, y0 + ey), Math.min(z0, z0 + ez), Math.max(x1, x1 + ex), Math.max(y1, y1 + ey), Math.max(z1, z1 + ez), [sc[0] * m, sc[1] * m, sc[2] * m], sk, !!s.emis);
            }
          }
        }
      }
    }
    if (chunk.mesh) { freeMesh(chunk.mesh.op); freeMesh(chunk.mesh.wa); freeMesh(chunk.mesh.gs); freeMesh(chunk.mesh.gr); }
    chunk.mesh = { op: upload(op), wa: upload(wa), gs: upload(gs), gr: upload(gr) };
    { let a = 1e9, b = -1e9; for (const m of [chunk.mesh.op, chunk.mesh.wa, chunk.mesh.gs, chunk.mesh.gr]) if (m && m.y0 != null) { a = Math.min(a, m.y0); b = Math.max(b, m.y1); } chunk.yb = a < b ? [a - 1, b + 2] : null; }
    chunk.dirty = false;
  }
  function freeChunk(chunk) { if (chunk.mesh) { freeMesh(chunk.mesh.op); freeMesh(chunk.mesh.wa); freeMesh(chunk.mesh.gs); freeMesh(chunk.mesh.gr); chunk.mesh = null; } }

  // ---------- entity meshes ----------
  // where a world point lands on the screen (CSS pixels), from the last frame's camera; on = in front of the camera and inside the view
  let lastPV = null;
  function project(x, y, z) {
    if (!lastPV) return null; const m = lastPV;
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15]; if (cw <= 0.05) return { on: false };
    const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / cw, cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / cw;
    const sx = (cx * 0.5 + 0.5) * canvas.clientWidth, sy = (0.5 - cy * 0.5) * canvas.clientHeight;
    return { x: sx, y: sy, on: cx > -1.1 && cx < 1.1 && cy > -1.1 && cy < 1.1, depth: cw };
  }
  function entityMesh(key, buildFn) {
    let m = entityMeshes.get(key);
    if (!m) { const mb = new MeshBuilder(1024, true); buildFn(mb); m = upload(mb) || { count: 0 }; entityMeshes.set(key, m); }
    return m;
  }
  function dropEntityMesh(key) { const m = entityMeshes.get(key); if (m) { freeMesh(m); entityMeshes.delete(key); } }
  // ---------- drawing the entity list (shared by the frame and by portraits) ----------
  function setEntityUniforms(pv, cam, lightsL, lightsR) {
    gl.useProgram(eprog);
    gl.uniformMatrix4fv(eloc.uPV, false, pv); gl.uniform1f(eloc.uTime, performance.now() / 1000);
    gl.uniform3f(eloc.uCam, cam.x, cam.y, cam.z); gl.uniform1f(eloc.uDay, state.dayLight); gl.uniform3fv(eloc.uFog, state.fogColor); gl.uniform1f(eloc.uFogSky, state.fogSky ? 1 : 0); gl.uniform1f(eloc.uCoreGlow, state.coreGlow ? 1 : 0);
    gl.uniform1f(eloc.uFogNear, state.fogNear); gl.uniform1f(eloc.uFogFar, state.fogFar); gl.uniform1f(eloc.uAmbient, state.ambient); gl.uniform3fv(eloc.uTint, state.tint);
    gl.uniform3fv(eloc.uSun, state.sun || [0, 1, 0]); gl.uniform3fv(eloc.uSunCol, state.sunCol || [1, 1, 1]); gl.uniform3fv(eloc.uZenith, state.zenith || state.fogColor); gl.uniform1f(eloc.uSunAmt, state.skyPass ? state.sunAmt : 0);
    gl.uniform3fv(eloc.uLights, lightsL); gl.uniform1fv(eloc.uLightR, lightsR); gl.uniform1f(eloc.uAlpha, 1); gl.uniform1f(eloc.uSkyMul, 1); gl.uniform1f(eloc.uOutline, 0); gl.uniform4f(eloc.uSway, 0, 0, 0, 0); gl.uniform1f(eloc.uFlash, 0);
    bindShadow(eloc, 1);
  }
  function drawEntities(entities, cam, now) {
    const outlineW = state.outlines === false ? 0 : (isMobile ? 0.013 : 0.015);
    let bonesId = true; gl.uniformMatrix4fv(eloc.uBones, false, IDENT_BONES);
    const drawOne = (e, outline) => {
      gl.uniformMatrix4fv(eloc.uModel, false, e.M || U.m4model(e.x, e.y + (e.hover || 0), e.z, e.yaw, e.scale || 1)); // an entity may bring its own matrix (a felled tree tipping over)
      const pose = (typeof Anim !== 'undefined' && e.model && e.model.bones) ? Anim.pose(e, now) : null;
      if (pose) { gl.uniformMatrix4fv(eloc.uBones, false, pose.mats); bonesId = false; gl.uniform4fv(eloc.uSway, pose.sway); }
      else { if (!bonesId) { gl.uniformMatrix4fv(eloc.uBones, false, IDENT_BONES); bonesId = true; } gl.uniform4f(eloc.uSway, 0, 0, 0, 0); }
      gl.uniform1f(eloc.uSkyMul, e.skyMul == null ? 1 : e.skyMul);
      gl.uniform1f(eloc.uFlash, e.hitT > 0 ? Math.max(0, Math.min(0.7, e.hitT * 2.5)) : 0);
      gl.uniform1f(eloc.uAlpha, e.alpha == null ? 1 : e.alpha);
      gl.uniform1f(eloc.uOutline, outline ? outlineW * (e.outlineMul || 1) : 0);
      drawEntityMesh(e.mesh);
    };
    const list = [];
    for (const e of entities) { if (!e.mesh || !e.mesh.count) continue; const d2 = (e.x - cam.x) ** 2 + (e.z - cam.z) ** 2; if (d2 > state.viewDist * state.viewDist) continue; e._d2 = d2; list.push(e); }
    const seeThru = []; for (const e of list) { if (e.alpha != null && e.alpha < 1) seeThru.push(e); else drawOne(e, false); }
    if (seeThru.length) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); for (const e of seeThru) drawOne(e, false); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (outlineW > 0) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); for (const e of list) { if (e.isFx || e.noOutline || e._d2 > 1600) continue; drawOne(e, true); } gl.disable(gl.CULL_FACE); }
    gl.uniform1f(eloc.uOutline, 0); gl.uniform1f(eloc.uSkyMul, 1); gl.uniform1f(eloc.uAlpha, 1);
  }
  // ---------- portraits: the same mesh, drawn into a small offscreen target and copied onto a 2D canvas ----------
  let pfb = null, ptex = null, pdepth = null, psize = 0;
  function renderPortrait(cv, mesh, model, size, opts = {}) {
    if (!eprog || !mesh || !mesh.count) return false;
    size = size || 96; const OUT = Math.min(640, Math.round(size * Math.min(3, Math.max(1.5, window.devicePixelRatio || 1)))); const S = Math.min(1280, OUT * (OUT <= 320 ? 3 : 2)); /* drawn two or three times too big and shrunk: soft edges, no stair-steps */
    if (!pfb) { pfb = gl.createFramebuffer(); ptex = gl.createTexture(); pdepth = gl.createRenderbuffer(); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, pfb);
    if (psize !== S) { gl.bindTexture(gl.TEXTURE_2D, ptex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.bindRenderbuffer(gl.RENDERBUFFER, pdepth); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, S, S); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ptex, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pdepth); psize = S; }
    gl.viewport(0, 0, S, S); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // frame the model's bounding box: look at its centre from the front-left, a little above
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    if (model && model.boxes) for (const b of model.boxes) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.h); z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z + b.d); }
    if (x0 > x1) { x0 = -0.5; x1 = 0.5; y0 = 0; y1 = model ? model.height : 1.5; z0 = -0.5; z1 = 0.5; }
    const yaw = opts.yaw == null ? -0.62 : opts.yaw, pitch = opts.pitch == null ? -0.24 : opts.pitch;
    const fwd = U.forwardVec(yaw, pitch);
    // the box's extent across the view: project its half-sizes onto the camera's right and up axes (generous, so nothing is clipped)
    const rx = Math.cos(yaw), rz = -Math.sin(yaw); const hw = Math.abs((x1 - x0) / 2 * rx) + Math.abs((z1 - z0) / 2 * rz), hh = (y1 - y0) / 2 * Math.cos(pitch) + (Math.abs((x1 - x0) / 2 * fwd[0]) + Math.abs((z1 - z0) / 2 * fwd[2])) * Math.abs(Math.sin(pitch));
    const half = Math.max(hw, hh, 0.3) * 0.98 / (opts.zoom || 1); const depth = Math.hypot((x1 - x0) / 2, (z1 - z0) / 2, (y1 - y0) / 2);
    const dist = half / Math.tan(0.32) + depth * 0.3;
    const tx = (x0 + x1) / 2, ty = (y0 + y1) / 2 + (opts.lift || 0), tz = (z0 + z1) / 2;
    const cx = tx - fwd[0] * dist, cy = ty - fwd[1] * dist, cz = tz - fwd[2] * dist;
    const pv = U.m4mul(U.m4perspective(0.64, 1, 0.1, 60), U.m4view(cx, cy, cz, yaw, pitch));
    const saved = { fog: state.fogColor, fn: state.fogNear, ff: state.fogFar, sun: state.sun, sc: state.sunCol, sa: state.sunAmt, day: state.dayLight, z: state.zenith, tint: state.tint, amb: state.ambient, sp: state.skyPass, sh: state.shadowOn }; state.shadowOn = 0;
    state.fogColor = [0.5, 0.6, 0.7]; state.fogNear = 50; state.fogFar = 60; state.sun = [-0.45, 0.72, 0.53]; state.sunCol = [1.0, 0.95, 0.86]; state.sunAmt = 1; state.dayLight = 1; state.zenith = [0.5, 0.65, 0.95]; state.tint = [1, 1, 1]; state.ambient = 0.06; state.skyPass = true;
    const L = new Float32Array(24), LR = new Float32Array(8); for (let i = 0; i < 8; i++) { L[i * 3 + 1] = -999; LR[i] = 0.001; }
    setEntityUniforms(pv, { x: cx, y: cy, z: cz }, L, LR);
    const ent = { x: 0, y: 0, z: 0, yaw: 0, scale: 1, mesh, model, hover: 0, skyMul: 1, anim: opts.anim || null, _portrait: true };
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    const ol = state.outlines; state.outlines = opts.outline === false ? false : true; const vd = state.viewDist; state.viewDist = 100;
    drawEntities([ent], { x: cx, y: cy, z: cz }, performance.now()); state.outlines = ol; state.viewDist = vd;
    Object.assign(state, { fogColor: saved.fog, fogNear: saved.fn, fogFar: saved.ff, sun: saved.sun, sunCol: saved.sc, sunAmt: saved.sa, dayLight: saved.day, zenith: saved.z, tint: saved.tint, ambient: saved.amb, skyPass: saved.sp, shadowOn: saved.sh });
    const px = new Uint8Array(S * S * 4); gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    // flip rows (GL is bottom-up) and un-premultiply nothing: alpha is 0 or 1
    const img = new ImageData(S, S); const d = img.data; for (let y = 0; y < S; y++) d.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
    if (!renderPortrait._t) renderPortrait._t = document.createElement('canvas'); const tc = renderPortrait._t; tc.width = S; tc.height = S; tc.getContext('2d').putImageData(img, 0, 0);
    cv.width = OUT; cv.height = OUT; cv.style.width = cv.style.height = size + 'px';
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.clearRect(0, 0, OUT, OUT);
    if (S >= OUT * 3) { const hc = renderPortrait._h || (renderPortrait._h = document.createElement('canvas')); hc.width = hc.height = Math.round(S / 2); const hx = hc.getContext('2d'); hx.imageSmoothingQuality = 'high'; hx.drawImage(tc, 0, 0, hc.width, hc.height); ctx.drawImage(hc, 0, 0, OUT, OUT); } else ctx.drawImage(tc, 0, 0, OUT, OUT);
    return true;
  }

  // ---------- frame ----------
  function setEnv(world, player) {
    const t = world.time; // 0..1
    const sun = -Math.cos(t * Math.PI * 2); // -1 at midnight (t=0), +1 at noon (t=0.5)
    const day = U.clamp((sun + 0.35) / 0.6, 0, 1);
    state.day = day;
    state.dayLight = 0.32 + 0.68 * day;
    const night = world.preset.skyNight || [0.02, 0.03, 0.09], noon = world.preset.skyNoon || [0.55, 0.76, 0.98], dusk = world.preset.skyDusk || [0.95, 0.55, 0.3];
    let sky = U.mixColor(night, noon, day);
    const duskAmt = Math.max(0, 1 - Math.abs(day - 0.45) / 0.35) * 0.6;
    sky = U.mixColor(sky, dusk, duskAmt);
    if (world.preset.flatDay) { state.dayLight = world.preset.flatDay; state.day = 1; sky = world.preset.sky.slice(); }
    const wk = Weather.state.kind, wi = Weather.state.intensity;
    if (wi > 0.02) {
      const grey = [0.55, 0.58, 0.62], storm = [0.2, 0.22, 0.28];
      if (wk === 'rain') { sky = U.mixColor(sky, U.mixColor(grey, sky, 0.3), wi); state.dayLight *= 1 - 0.25 * wi; }
      else if (wk === 'fog') { sky = U.mixColor(sky, [0.72, 0.75, 0.78], wi * 0.8); state.dayLight *= 1 - 0.1 * wi; }
      else if (wk === 'storm') { sky = U.mixColor(sky, storm, wi * 0.8); state.dayLight *= 1 - 0.45 * wi; }
    }
    // the gloom round a hold you have not taken: a low grey sky, dull light, close haze
    const gl0 = (typeof Keeps !== 'undefined' && world.preset.id === 'earth') ? Math.max(Keeps.gloom(player.x, player.z), typeof Sky !== 'undefined' ? Sky.gloom(player.x, player.z) : 0) : 0; state.gloom = gl0;
    if (gl0 > 0.01) { sky = U.mixColor(sky, [0.36, 0.35, 0.4], gl0 * 0.85); state.dayLight *= 1 - 0.35 * gl0; }
    // the sun: where it is, how warm, and the sky it paints
    const ang = t * Math.PI * 2; let sd = [Math.sin(ang) * 0.75, -Math.cos(ang), 0.42]; const sl = Math.hypot(sd[0], sd[1], sd[2]); sd = sd.map(v => v / sl);
    if (world.preset.flatDay) sd = [0.35, 0.8, 0.45].map(v => v / Math.hypot(0.35, 0.8, 0.45));
    state.sun = sd; state.sunAmt = world.preset.flatDay ? 1 : U.clamp((sd[1] + 0.06) / 0.3, 0, 1);
    const warm = U.clamp(sd[1] * 2.2, 0, 1); state.sunCol = U.mixColor([1.0, 0.55, 0.3], [1.0, 0.95, 0.86], warm);
    const dayK = world.preset.flatDay ? 0.6 : day;
    const horizon = U.mixColor(sky, [0.93, 0.95, 1.0], 0.32 * dayK * (1 - duskAmt));
    state.zenith = world.preset.airless ? sky.map(v => v * 0.6) : U.mixColor(sky.map(v => v * 0.75), [0.16, 0.38, 0.82], 0.45 * dayK * (world.preset.id === 'earth' ? 1 : 0.4));
    state.clouds = world.preset.airless ? 0 : (world.preset.id === 'earth' ? 0.55 : 0.3) + (wi > 0.02 && (wk === 'rain' || wk === 'storm') ? 0.45 * wi : 0);
    if (gl0 > 0.01) { state.zenith = U.mixColor(state.zenith, [0.28, 0.27, 0.32], gl0 * 0.85); state.clouds = Math.min(1, state.clouds + 0.45 * gl0); state.sunAmt *= 1 - 0.65 * gl0; state.sunCol = U.mixColor(state.sunCol, [0.75, 0.72, 0.8], gl0 * 0.6); }
    state.skyPass = true; state.night = 1 - day;
    sky = horizon;
    state.skyColor = sky; state.fogColor = sky; state.ambient = 0.06; state.fogSky = true;
    // the fog has to be solid before the meshed land runs out (landReach: the chunks around you that are built, in blocks), or looking
    // between near trees at a far hillside shows sky where its top should be: a patch of blue in the middle of the land
    const fogMul = world.preset.fogMul || 1; const reach = state.landReach ? state.landReach - 1.5 : 1e9;
    state.fogFar = Math.min(state.viewDist * 0.98, reach) * fogMul; state.fogNear = state.fogFar * 0.56;
    if (wi > 0.02 && wk === 'fog') { state.fogNear = U.lerp(state.fogNear, 4, wi); state.fogFar = U.lerp(state.fogFar, 26, wi); }
    if (gl0 > 0.01) { state.fogNear = U.lerp(state.fogNear, state.viewDist * 0.32, gl0); state.fogFar = U.lerp(state.fogFar, state.viewDist * 0.88, gl0); }
    else if (wi > 0.02 && (wk === 'rain' || wk === 'storm')) { state.fogNear = U.lerp(state.fogNear, state.viewDist * 0.3, wi); state.fogFar = U.lerp(state.fogFar, state.viewDist * 0.75, wi); }
    state.tint = [1, 1, 1]; state.underwater = false; state.inCore = false; state.coreGlow = world.preset.id === 'earth';
    const eyeBlock = world.getBlock(Math.floor(player.x), Math.floor(player.y + 1.62), Math.floor(player.z));
    if (eyeBlock === B.WATER || eyeBlock === B.BRINE || eyeBlock === B.LAVA || player.y < CORE_TOP || player.y < world.topAt(Math.floor(player.x), Math.floor(player.z)) - 2) state.skyPass = false;
    if (eyeBlock === B.WATER) { state.underwater = true; state.fogSky = false; state.fogColor = [0.05, 0.2, 0.45]; state.skyColor = state.fogColor; state.fogNear = 2; state.fogFar = 18; state.tint = [0.6, 0.8, 1.0]; }
    else if (eyeBlock === B.BRINE) { state.underwater = true; state.fogSky = false; state.fogColor = [0.35, 0.42, 0.08]; state.skyColor = state.fogColor; state.fogNear = 1; state.fogFar = 9; state.tint = [0.9, 1.0, 0.5]; }
    else if (eyeBlock === B.LAVA) { state.fogSky = false; state.fogColor = [0.9, 0.3, 0.05]; state.skyColor = state.fogColor; state.fogNear = 0.5; state.fogFar = 4; state.tint = [1.2, 0.6, 0.3]; }
    else if (player.y < CORE_TOP) { state.inCore = true; state.fogSky = false; state.fogColor = [0.2, 0.05, 0.015]; state.skyColor = state.fogColor; state.fogNear = 10; state.fogFar = 56; state.ambient = 0.3; state.tint = [1.08, 0.9, 0.82]; }
    else if (player.y < world.topAt(Math.floor(player.x), Math.floor(player.z)) - 2) { state.fogSky = false; state.fogColor = [0.0, 0.0, 0.0]; state.skyColor = state.fogColor; state.fogNear = 10; state.fogFar = 48; }
  }

  function render(world, player, entities, cam, extras) {
    tickFps(); if (state.pendingQuality) { const q = state.pendingQuality; state.pendingQuality = null; setQuality(q); }
    resize();
    setEnv(world, player);
    const sc = state.skyColor;
    gl.clearColor(sc[0], sc[1], sc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const aspect = canvas.width / canvas.height;
    if (state.skyPass && skyProg) { // the sky behind everything
      gl.useProgram(skyProg); gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
      const f = U.forwardVec(cam.yaw, cam.pitch); const r = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)]; const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      gl.uniform3fv(sloc.uFwd, f); gl.uniform3fv(sloc.uRight, r); gl.uniform3fv(sloc.uUp, u); gl.uniform1f(sloc.uTan, Math.tan(cam.fov / 2)); gl.uniform1f(sloc.uAspect, aspect);
      gl.uniform3fv(sloc.uHorizon, state.fogColor); gl.uniform3fv(sloc.uZenith, state.zenith); gl.uniform3fv(sloc.uSun, state.sun); gl.uniform3fv(sloc.uSunCol, state.sunCol); gl.uniform1f(sloc.uSunAmt, state.sunAmt); gl.uniform1f(sloc.uTime, performance.now() / 1000); gl.uniform1f(sloc.uClouds, state.clouds); gl.uniform1f(sloc.uNight, state.night);
      gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.enableVertexAttribArray(sloc.aPos); gl.vertexAttribPointer(sloc.aPos, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disableVertexAttribArray(sloc.aPos);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    }
    const proj = U.m4perspective(cam.fov, aspect, 0.08, 400);
    const view = U.m4view(cam.x, cam.y, cam.z, cam.yaw, cam.pitch);
    const pv = U.m4mul(proj, view); lastPV = pv;
    const planes = U.frustumPlanes(pv);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(loc.uPV, false, pv);
    gl.uniform1f(loc.uTime, performance.now() / 1000);
    gl.uniform3f(loc.uCam, cam.x, cam.y, cam.z);
    gl.uniform1f(loc.uDay, state.dayLight);
    gl.uniform3fv(loc.uFog, state.fogColor); gl.uniform1f(loc.uFogSky, state.fogSky ? 1 : 0); gl.uniform1f(loc.uCoreGlow, world.preset.id === 'earth' ? 1 : 0);
    gl.uniform1f(loc.uFogNear, state.fogNear); gl.uniform1f(loc.uFogFar, state.fogFar);
    gl.uniform1f(loc.uAmbient, state.ambient);
    gl.uniform3fv(loc.uTint, state.tint);
    gl.uniform1f(loc.uSkyMul, 1);
    gl.uniform3fv(loc.uSun, state.sun || [0, 1, 0]); gl.uniform3fv(loc.uSunCol, state.sunCol || [1, 1, 1]); gl.uniform3fv(loc.uZenith, state.zenith || state.fogColor); gl.uniform1f(loc.uSunAmt, state.skyPass ? state.sunAmt : 0); gl.uniform1f(loc.uQuality, isMobile ? 0.6 : 1); gl.uniform1f(loc.uGrid, 1); gl.uniform3f(loc.uPlayer, player.x, player.y, player.z); gl.uniform1f(loc.uBladeShade, grassProg ? 1 : 0);
    // lights
    const L = new Float32Array(24), LR = new Float32Array(8);
    const lights = extras.lights || [];
    for (let i = 0; i < 8; i++) { const l = lights[i]; if (l) { L[i * 3] = l[0]; L[i * 3 + 1] = l[1]; L[i * 3 + 2] = l[2]; LR[i] = l[3]; } else { L[i * 3 + 1] = -999; LR[i] = 0.001; } }
    gl.uniform3fv(loc.uLights, L); gl.uniform1fv(loc.uLightR, LR);
    gl.uniform1f(loc.uAlpha, 1); gl.uniform1f(loc.uWave, 0);
    const ident = U.m4identity();
    // opaque chunks
    const visible = [];
    const half = CH / 2, rad = Math.hypot(half, WH / 2, half);
    for (const c of world.chunks.values()) {
      if (!c.mesh) continue;
      const mx = c.cx * CH + half, mz = c.cz * CH + half;
      const dx = mx - cam.x, dz = mz - cam.z;
      if (dx * dx + dz * dz > (state.viewDist + 16) * (state.viewDist + 16)) continue;
      if (c.yb) { const cy = (c.yb[0] + c.yb[1]) / 2, ry = (c.yb[1] - c.yb[0]) / 2; if (!U.sphereInFrustum(planes, mx, cy, mz, Math.hypot(half, ry, half))) continue; } // a sphere round the land that is really there, not the whole column
      else if (!U.sphereInFrustum(planes, mx, WH / 2, mz, rad)) continue;
      visible.push(c);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    renderShadows(world, player, cam, entities, visible);
    gl.useProgram(prog); bindShadow(loc, 1);
    for (const c of visible) if (c.mesh.op) { ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(loc.uModel, false, ident); drawMesh(c.mesh.op); }
    drawGrass(world, player, pv, cam);
    gl.useProgram(prog); gl.uniformMatrix4fv(loc.uPV, false, pv);
    // grass: blades within reach, swaying (fallback without instancing)
    gl.uniform1f(loc.uGrid, 0); gl.uniform1f(loc.uWave, 2);
    const gR = (isMobile ? 34 : 48) + 16;
    for (const c of visible) if (c.mesh.gr) { const dx = c.cx * CH + 8 - cam.x, dz = c.cz * CH + 8 - cam.z; if (dx * dx + dz * dz > gR * gR) continue; ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(loc.uModel, false, ident); drawMesh(c.mesh.gr); }
    gl.uniform1f(loc.uWave, 0);
    // entities: their own program (smooth normals, bones, outline)
    setEntityUniforms(pv, cam, L, LR);
    drawEntities(entities, cam, performance.now());
    gl.useProgram(prog);
    // water
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.uniform1f(loc.uAlpha, 0.62); gl.uniform1f(loc.uWave, 1);
    for (const c of visible) if (c.mesh.wa) { ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(loc.uModel, false, ident); drawMesh(c.mesh.wa); }
    gl.uniform1f(loc.uWave, 0); gl.uniform1f(loc.uAlpha, 0.38);
    for (const c of visible) if (c.mesh.gs) { ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(loc.uModel, false, ident); drawMesh(c.mesh.gs); }
    gl.depthMask(true);
    // lines
    if (extras.lines && extras.lines.length) {
      gl.useProgram(lineProg);
      gl.uniformMatrix4fv(lloc.uPV, false, pv);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      for (const seg of extras.lines) {
        gl.bufferData(gl.ARRAY_BUFFER, seg.data, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(lloc.aPos); gl.vertexAttribPointer(lloc.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(lloc.uColor, seg.color);
        gl.drawArrays(gl.LINES, 0, seg.data.length / 3);
      }
    }
    gl.disable(gl.BLEND);
    drawHeld(extras.held, cam, aspect, L, LR);
  }
  // ---------- what you hold, drawn in front of everything from your own eyes ----------
  const m4rot = (rx, ry, rz) => { // the same order as MeshBuilder.rotate: yaw, then pitch, then roll
    let m = U.m4identity();
    if (ry) { const c = Math.cos(ry), sn = Math.sin(ry); const r = U.m4identity(); r[0] = c; r[2] = -sn; r[8] = sn; r[10] = c; m = U.m4mul(m, r); }
    if (rx) { const c = Math.cos(rx), sn = Math.sin(rx); const r = U.m4identity(); r[5] = c; r[6] = sn; r[9] = -sn; r[10] = c; m = U.m4mul(m, r); }
    if (rz) { const c = Math.cos(rz), sn = Math.sin(rz); const r = U.m4identity(); r[0] = c; r[1] = sn; r[4] = -sn; r[5] = c; m = U.m4mul(m, r); }
    return m;
  };
  function drawHeld(h, cam, aspect, L, LR) {
    if (!h || !h.mesh || !h.mesh.count || !eprog) return;
    gl.clear(gl.DEPTH_BUFFER_BIT); // never clipped by a wall you stand against
    const f = U.forwardVec(cam.yaw, cam.pitch); const r = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const t = performance.now() / 1000; const tanH = Math.tan(cam.fov / 2);
    const d = 0.66; const hx = d * tanH * aspect, hy = d * tanH; // the visible half-extents at the hand's distance
    const sw = h.swing || 0, bump = h.bump || 0, drop = h.drop || 0, mv = h.moving || 0, blk = h.block || 0;
    const bobX = Math.sin(h.bob) * 0.035 * mv, bobY = -Math.abs(Math.cos(h.bob)) * 0.03 * mv;
    const idleY = Math.sin(t * 1.7) * 0.006, idleX = Math.cos(t * 1.1) * 0.004;
    // where the fist sits: low right (low left for a shield), pulled up and across in a swing, lifted square in front when blocking
    let px = (h.shieldy ? -0.55 : 0.6) * hx + bobX + idleX - sw * 0.16 * hx, py = -0.74 * hy + bobY + idleY - drop * 0.4 - bump * 0.03 + sw * 0.1 * hy, pz = d - bump * 0.04;
    if (h.shieldy && blk) { px = -0.1 * hx; py = -0.3 * hy; pz = d - 0.1; }
    const pos = [cam.x + r[0] * px + u[0] * py + f[0] * pz, cam.y + r[1] * px + u[1] * py + f[1] * pz, cam.z + r[2] * px + u[2] * py + f[2] * pz];
    const base = new Float32Array([r[0], r[1], r[2], 0, u[0], u[1], u[2], 0, -f[0], -f[1], -f[2], 0, pos[0], pos[1], pos[2], 1]);
    const local = m4rot(-sw * 1.3 - drop * 0.8 + (h.shieldy && blk ? 0.25 : 0), sw * 0.6 + (h.shieldy ? 0.35 : -0.25) + (h.shieldy && blk ? -0.6 : 0), sw * 0.35);
    const S = U.m4identity(); S[0] = S[5] = S[10] = 0.36; // the hand and what is in it, at a size that leaves the view clear
    const M = U.m4mul(U.m4mul(base, local), S);
    setEntityUniforms(U.m4mul(U.m4perspective(cam.fov, aspect, 0.03, 60), U.m4view(cam.x, cam.y, cam.z, cam.yaw, cam.pitch)), cam, L, LR);
    gl.uniformMatrix4fv(eloc.uBones, false, IDENT_BONES); gl.uniformMatrix4fv(eloc.uModel, false, M);
    gl.uniform1f(eloc.uSkyMul, h.skyMul == null ? 1 : h.skyMul);
    drawEntityMesh(h.mesh);
    const outlineW = state.outlines === false ? 0 : (isMobile ? 0.013 : 0.015);
    if (outlineW > 0) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); gl.uniform1f(eloc.uOutline, outlineW * 0.6); drawEntityMesh(h.mesh); gl.disable(gl.CULL_FACE); gl.uniform1f(eloc.uOutline, 0); }
    // the other hand: the shield rising square in front as you block, mirrored so the strap arm is the left one
    if (h.offhand && h.offhand.count && h.offK > 0.02) {
      const k = h.offK; const opx = (-0.62 + 0.46 * k) * hx + bobX * 0.5, opy = (-0.95 + 0.5 * k) * hy + bobY * 0.5, opz = d - 0.06 * k;
      const opos = [cam.x + r[0] * opx + u[0] * opy + f[0] * opz, cam.y + r[1] * opx + u[1] * opy + f[1] * opz, cam.z + r[2] * opx + u[2] * opy + f[2] * opz];
      const obase = new Float32Array([r[0], r[1], r[2], 0, u[0], u[1], u[2], 0, -f[0], -f[1], -f[2], 0, opos[0], opos[1], opos[2], 1]);
      const olocal = m4rot(0.25 * k, 0.35 - 0.6 * k, 0); const OS = U.m4identity(); OS[0] = -0.36; OS[5] = OS[10] = 0.36;
      gl.uniformMatrix4fv(eloc.uModel, false, U.m4mul(U.m4mul(obase, olocal), OS));
      gl.frontFace(gl.CW); drawEntityMesh(h.offhand);
      if (outlineW > 0) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); gl.uniform1f(eloc.uOutline, outlineW * 0.6); drawEntityMesh(h.offhand); gl.disable(gl.CULL_FACE); gl.uniform1f(eloc.uOutline, 0); }
      gl.frontFace(gl.CCW);
    }
    gl.useProgram(prog);
  }

  // helpers to build line sets
  function boxLines(x, y, z, pad = 0.003) {
    const a = x - pad, b = y - pad, c = z - pad, d = x + 1 + pad, e = y + 1 + pad, f = z + 1 + pad;
    return new Float32Array([a, b, c, d, b, c, d, b, c, d, b, f, d, b, f, a, b, f, a, b, f, a, b, c, a, e, c, d, e, c, d, e, c, d, e, f, d, e, f, a, e, f, a, e, f, a, e, c, a, b, c, a, e, c, d, b, c, d, e, c, d, b, f, d, e, f, a, b, f, a, e, f]);
  }
  // the block outline under the crosshair. Soil on smoothed ground gets a box whose top follows the slope, by the same rule the mesher uses
  function soilTopAt(world, x, z) { return soilScan((x, y, z) => world.getBlock(x, y, z), x, z); }
  function cornerHeight(world, cx, cz) { // the same rule as the mesher, for the targeting outline
    let dry = false, wl = -1; const ts = [], ws = [];
    for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const [t, wt] = soilTopAt(world, cx + a, cz + b); if (t < 0) return -1; ts.push(t); ws.push(wt); if (wt < 0) dry = true; else wl = Math.max(wl, wt); }
    const shore = dry && wl >= 0; let sum = 0, lo = 999, hi = -999;
    for (let i = 0; i < 4; i++) { const t = shore && ws[i] >= 0 ? Math.max(ts[i], ws[i] - 1) : ts[i]; sum += t; lo = Math.min(lo, t); hi = Math.max(hi, t); }
    let v = hi - lo <= 2 ? sum / 4 + 1 : -1; if (v >= 0 && shore) v = Math.max(v, wl - 0.02); return v;
  }
  let surfCache = { k: null, h: null };
  // where a creature's feet should rest: on soil the drawn ground is a smooth slope between block corners, so stand on the highest
  // of it under the footprint (centre and four points at radius r), never more than a block's worth from the block top
  function standY(world, x, z, top, r) {
    const below = world.getBlock(Math.floor(x), Math.floor(top - 0.5), Math.floor(z)); if (!isSoil(below)) return top;
    let s = null; for (const [ox, oz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) { const t = surfaceAt(world, x + ox, z + oz); if (t != null && (s == null || t > s)) s = t; }
    return s == null ? top : Math.max(top - 0.85, Math.min(top + 0.85, s));
  }
  function surfaceAt(world, x, z) {
    const bx = Math.floor(x), bz = Math.floor(z); const k = bx + ',' + bz + ',' + (world.editSerial || 0);
    let h = surfCache.k === k ? surfCache.h : null;
    if (surfCache.k !== k) { const c = [[bx, bz], [bx + 1, bz], [bx, bz + 1], [bx + 1, bz + 1]].map(([cx, cz]) => cornerHeight(world, cx, cz)); h = c.some(v => v < 0) ? null : c; surfCache = { k, h }; }
    if (!h) return null; const fx = x - bx, fz = z - bz;
    return (h[0] * (1 - fx) + h[1] * fx) * (1 - fz) + (h[2] * (1 - fx) + h[3] * fx) * fz;
  }
  const isSoil = (b) => SOIL.has(b);
  function targetLines(world, x, y, z, pad = 0.003) {
    const id = world.getBlock(x, y, z); const [t] = soilTopAt(world, x, z);
    if (!SOIL.has(id) || t !== y) return boxLines(x, y, z, pad);
    const h = [[x, z], [x + 1, z], [x + 1, z + 1], [x, z + 1]].map(([cx, cz]) => { const v = cornerHeight(world, cx, cz); return (v >= 0 ? v : y + 1) + pad; });
    const a = x - pad, c = z - pad, d = x + 1 + pad, f = z + 1 + pad, b = y - pad;
    const P = [[a, c], [d, c], [d, f], [a, f]]; const out = [];
    for (let i = 0; i < 4; i++) { const [px, pz] = P[i], [qx, qz] = P[(i + 1) % 4]; out.push(px, b, pz, qx, b, qz, px, h[i], pz, qx, h[(i + 1) % 4], qz, px, b, pz, px, h[i], pz); }
    return new Float32Array(out);
  }
  function ringLines(x, y, z, r, segs = 28) {
    const out = new Float32Array(segs * 6);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      out[i * 6] = x + Math.cos(a0) * r; out[i * 6 + 1] = y; out[i * 6 + 2] = z + Math.sin(a0) * r;
      out[i * 6 + 3] = x + Math.cos(a1) * r; out[i * 6 + 4] = y; out[i * 6 + 5] = z + Math.sin(a1) * r;
    }
    return out;
  }

  return { grassZone, init, resize, buildChunk, freeChunk, entityMesh, dropEntityMesh, renderPortrait, render, project, surfaceAt, standY, isSoil, boxLines, targetLines, ringLines, state, setQuality, QUALITY, get gl() { return gl; } };
})();
