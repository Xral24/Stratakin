'use strict';
// Raw WebGL renderer: chunk meshing with baked AO + sky exposure, point lights (torches), fog, day/night, entity meshes, line overlays.
class MeshBuilder {
  constructor(cap = 4096) {
    this.pos = new Float32Array(cap * 3); this.col = new Uint8Array(cap * 4); this.idx = new Uint32Array(cap * 1.5 | 0);
    this.nv = 0; this.ni = 0;
  }
  ensure(nv, ni) {
    if (this.nv + nv > this.pos.length / 3) {
      const cap = Math.max((this.pos.length / 3) * 2, this.nv + nv);
      const p = new Float32Array(cap * 3); p.set(this.pos); this.pos = p;
      const c = new Uint8Array(cap * 4); c.set(this.col); this.col = c;
    }
    if (this.ni + ni > this.idx.length) {
      const cap = Math.max(this.idx.length * 2, this.ni + ni);
      const ix = new Uint32Array(cap); ix.set(this.idx); this.idx = ix;
    }
  }
  // quad: 4 corner positions [x,y,z], colours [r,g,b] per vertex (0..1), sky per vertex 0..1, emissive flag
  quad(p, c, sky, emissive) {
    this.ensure(4, 6);
    const b = this.nv;
    for (let i = 0; i < 4; i++) {
      this.pos[(b + i) * 3] = p[i][0]; this.pos[(b + i) * 3 + 1] = p[i][1]; this.pos[(b + i) * 3 + 2] = p[i][2];
      const ci = (b + i) * 4;
      this.col[ci] = Math.min(255, c[i][0] * 255) | 0; this.col[ci + 1] = Math.min(255, c[i][1] * 255) | 0; this.col[ci + 2] = Math.min(255, c[i][2] * 255) | 0;
      this.col[ci + 3] = emissive ? 255 : Math.min(250, sky[i] * 250) | 0;
    }
    const k = this.ni;
    this.idx[k] = b; this.idx[k + 1] = b + 1; this.idx[k + 2] = b + 2; this.idx[k + 3] = b; this.idx[k + 4] = b + 2; this.idx[k + 5] = b + 3;
    this.nv += 4; this.ni += 6;
  }
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
PATTERNS[B.FORTSTONE] = { all: { rects: [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1, col: null }, { u0: 0, v0: 0.48, u1: 1, v1: 0.52, mul: 0.7, col: null }, { u0: 0.48, v0: 0, u1: 0.52, v1: 0.48, mul: 0.7, col: null }, { u0: 0.2, v0: 0.52, u1: 0.24, v1: 1, mul: 0.7, col: null }, { u0: 0.74, v0: 0.52, u1: 0.78, v1: 1, mul: 0.7, col: null }, { u0: 0.06, v0: 0.06, u1: 0.4, v1: 0.12, mul: 1.15, col: null }] } };
PATTERNS[B.THORN] = { all: { rects: [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1, col: null }, { u0: 0.1, v0: 0.2, u1: 0.9, v1: 0.3, mul: 0.7, col: null }, { u0: 0.2, v0: 0.6, u1: 1, v1: 0.7, mul: 0.7, col: null }, { u0: 0.3, v0: 0.1, u1: 0.36, v1: 0.2, mul: 1, col: [0.85, 0.82, 0.6] }, { u0: 0.6, v0: 0.3, u1: 0.66, v1: 0.4, mul: 1, col: [0.85, 0.82, 0.6] }, { u0: 0.4, v0: 0.7, u1: 0.46, v1: 0.8, mul: 1, col: [0.85, 0.82, 0.6] }, { u0: 0.8, v0: 0.5, u1: 0.86, v1: 0.6, mul: 1, col: [0.85, 0.82, 0.6] }] } };
PATTERNS[B.DEADGATE] = { all: { rects: [{ u0: 0.05, v0: 0.05, u1: 0.95, v1: 0.95, mul: 0.85, col: null }, { u0: 0.08, v0: 0.08, u1: 0.16, v1: 0.16, mul: 1.4, col: null }, { u0: 0.84, v0: 0.08, u1: 0.92, v1: 0.16, mul: 1.4, col: null }, { u0: 0.08, v0: 0.84, u1: 0.16, v1: 0.92, mul: 1.4, col: null }, { u0: 0.84, v0: 0.84, u1: 0.92, v1: 0.92, mul: 1.4, col: null }, { u0: 0.38, v0: 0.38, u1: 0.62, v1: 0.62, mul: 1, col: [0.25, 0.3, 0.38] }] } };
PATTERNS[B.RUBBLE] = { all: { rects: [{ u0: 0, v0: 0, u1: 1, v1: 1, mul: 1, col: null }, { u0: 0.05, v0: 0.1, u1: 0.45, v1: 0.45, mul: 1.15, col: null }, { u0: 0.5, v0: 0.05, u1: 0.95, v1: 0.4, mul: 0.85, col: null }, { u0: 0.1, v0: 0.55, u1: 0.55, v1: 0.95, mul: 0.9, col: null }, { u0: 0.6, v0: 0.5, u1: 0.95, v1: 0.92, mul: 1.1, col: null }] } };
// a bullseye: red rings on straw-white
PATTERNS[B.TARGET] = { all: { rects: [{ u0: 0.08, v0: 0.08, u1: 0.92, v1: 0.92, mul: 1, col: [0.85, 0.16, 0.18] }, { u0: 0.2, v0: 0.2, u1: 0.8, v1: 0.8, mul: 1, col: [0.95, 0.93, 0.88] }, { u0: 0.32, v0: 0.32, u1: 0.68, v1: 0.68, mul: 1, col: [0.85, 0.16, 0.18] }, { u0: 0.43, v0: 0.43, u1: 0.57, v1: 0.57, mul: 1, col: [0.98, 0.84, 0.2] }] } };
PATTERNS[B.BALLOON] = { all: { rects: [{ u0: 0.18, v0: 0.55, u1: 0.42, v1: 0.82, mul: 1.35, col: null }] } };
PATTERNS[B.IRONWALL] = { all: PLATE(0.74, { mul: 0.45, col: null }) };
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
PATTERNS[B.INCUBATOR] = { all: PLATE(0.6, { mul: 1, col: [0.45, 0.9, 1.0], emis: true }) };

const R = (() => {
  let gl, canvas, prog, lineProg, loc = {}, lloc = {};
  const meshes = new Map(); // chunk key -> gpu mesh
  const entityMeshes = new Map();
  let lineBuf, lineData = new Float32Array(6 * 600), lineCount = 0;
  let isMobile = false; let skyProg = null, skyBuf = null; const sloc = {};
  const state = { viewDist: 64, dayLight: 1, fogColor: [0.6, 0.8, 1], skyColor: [0.6, 0.8, 1], ambient: 0.07, underwater: false, inCore: false, lights: [] };

  // ---- the look: sunlight with warm light and cool shade, painted block texture with a faint grid, haze, living water ----
  const VS = `
  attribute vec3 aPos; attribute vec4 aCol;
  uniform mat4 uPV; uniform mat4 uModel; uniform float uTime; uniform float uWave;
  varying vec4 vCol; varying vec3 vWorld;
  void main(){
    vec4 w = uModel * vec4(aPos, 1.0);
    if (uWave > 1.5) { float k = fract(w.y + 0.0005); k = k * k * 3.0; float gust = sin(uTime * 0.7 + w.x * 0.05 + w.z * 0.03) * 0.5 + 0.5; w.x += (sin(uTime * 2.3 + w.x * 0.9 + w.z * 0.4) * 0.05 + gust * 0.07) * k; w.z += cos(uTime * 1.9 + w.z * 0.8 + w.x * 0.3) * 0.04 * k; }
    else if (uWave > 0.5) { w.y += sin(uTime * 1.3 + w.x * 0.55 + w.z * 0.35) * 0.045 + sin(uTime * 2.1 - w.x * 0.9 + w.z * 1.2) * 0.025 - 0.12; }
    vWorld = w.xyz; vCol = aCol;
    gl_Position = uPV * w;
  }`;
  const FS = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  varying vec4 vCol; varying vec3 vWorld;
  uniform vec3 uCam; uniform float uDay; uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform float uAmbient;
  uniform vec3 uLights[8]; uniform float uLightR[8]; uniform float uAlpha; uniform vec3 uTint; uniform float uSkyMul;
  uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uZenith; uniform float uGrid; uniform float uWave; uniform float uTime; uniform float uSunAmt; uniform float uQuality; uniform vec3 uPlayer;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
  float hash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  void main(){
    vec3 toCam = uCam - vWorld; float dist = length(toCam); vec3 V = toCam / max(dist, 0.0001);
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld))); if (dot(n, V) < 0.0) n = -n;
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
      float lam = max(dot(n, uSun), 0.0) * uSunAmt;
      vec3 amb = vec3(0.78, 0.86, 1.05) * (0.36 + 0.26 * uDay);
      vec3 light = skyL * (amb + uSunCol * lam * 0.72 * uDay);
      light = max(light, vec3(uAmbient)); light = max(light, vec3(1.0, 0.78, 0.52) * torch * 0.95);
      light = mix(light, vec3(1.0), emis);
      vec3 vc = vCol.rgb; float lum = dot(vc, vec3(0.3, 0.59, 0.11)); vc = mix(vec3(lum), vc, 0.78); if (vc.g > vc.r * 1.1 && vc.g > vc.b * 1.2) vc *= vec3(1.04, 1.0, 0.86);
      col = vc * light;
      if (uGrid > 0.5 && emis < 0.5) {
        vec2 uv = abs(n.x) > 0.5 ? vWorld.zy : (abs(n.y) > 0.5 ? vWorld.xz : vWorld.xy);
        vec3 bp = floor(vWorld - n * 0.5);
        float hb = hash3(bp); float speck = hash3(vec3(floor(uv * 8.0), bp.y)); float blot = hash3(vec3(floor(uv * 3.0), bp.x + bp.z));
        col *= 0.9 + 0.1 * hb + (speck - 0.5) * 0.12 * uQuality + (blot - 0.5) * 0.07;
        // broad painted drift: warm and cool patches across the land
        vec2 wp = vWorld.xz * 0.045; vec2 wi = floor(wp), wf = fract(wp); wf = wf * wf * (3.0 - 2.0 * wf);
        float d0 = hash3(vec3(wi, 7.0)), d1 = hash3(vec3(wi + vec2(1.0, 0.0), 7.0)), d2 = hash3(vec3(wi + vec2(0.0, 1.0), 7.0)), d3 = hash3(vec3(wi + vec2(1.0, 1.0), 7.0));
        float drift = mix(mix(d0, d1, wf.x), mix(d2, d3, wf.x), wf.y);
        col *= mix(vec3(1.08, 1.03, 0.86), vec3(0.88, 0.98, 1.06), drift);
        vec2 f = fract(uv); float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        float pd = length(vWorld.xz - uPlayer.xz) + abs(vWorld.y - uPlayer.y) * 0.5; float lw = 0.018; float g = 1.0 - smoothstep(lw, lw * 2.2, e); g *= 1.0 - smoothstep(2.5, 4.5, pd);
        col *= 1.0 - 0.28 * g;
        if (n.y > 0.55 && vCol.r > 0.62 && vCol.g > vCol.r * 0.82 && vCol.g < vCol.r * 1.02 && vCol.b < vCol.r * 0.8 && vCol.b > vCol.r * 0.4) { // sand: wind ripples and grain
          vec2 q = vWorld.xz; float warp = vn(q * 0.35) * 3.0;
          float rip = sin(dot(q, vec2(0.93, 0.37)) * 4.2 + warp) * 0.5 + 0.5; rip = smoothstep(0.15, 0.95, rip);
          float grain = vn(q * 48.0) * 0.6 + vn(q * 113.0 + 1.7) * 0.4;
          float near = 1.0 - smoothstep(30.0, 70.0, dist);
          col *= 1.0 + ((rip - 0.5) * 0.13 + (grain - 0.5) * 0.08) * near;
          col *= 0.96 + 0.08 * vn(q * 0.12);
          col += uSunCol * step(0.992, hash3(vec3(floor(q * 14.0), 3.0))) * uSunAmt * 0.18 * near;
        }
        if (n.y > 0.55 && vCol.g > vCol.r * 1.12 && vCol.g > vCol.b * 1.25) { // grass: a carpet of fine blades, with wind rolling over it
          vec2 q = vWorld.xz; float fine = vn(q * 26.0) * 0.6 + vn(q * 61.0 + 3.1) * 0.4; float tuft = vn(q * 7.0 + 9.0);
          vec2 wd = normalize(vec2(0.8, 0.45)); float wave = sin(dot(q, wd) * 0.42 - uTime * 1.6 + vn(q * 0.15) * 4.0) * 0.5 + 0.5; wave *= wave * (0.5 + 0.5 * vn(q * 0.07 + uTime * 0.05));
          col *= 0.78 + 0.34 * fine + 0.1 * (tuft - 0.5);
          col = mix(col, col * vec3(1.18, 1.16, 1.0) + vec3(0.035, 0.04, 0.0), wave * 0.42 * (1.0 - smoothstep(60.0, 110.0, dist)));
        }
      }
    }
    // haze: blue with distance, warm toward the sun
    float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
    float toward = pow(max(dot(-V, uSun), 0.0), 6.0) * uSunAmt;
    vec3 haze = mix(uFog, uSunCol, toward * 0.45);
    col = mix(col * uTint, haze, f);
    gl_FragColor = vec4(col, alpha);
  }`;
  // ---- the meadow: one blade shape drawn tens of thousands of times around you (WebGL2 instancing) ----
  const GVS = `#version 300 es
  in vec2 aBlade;
  uniform mat4 uPV; uniform vec3 uCam; uniform vec2 uOrigin; uniform float uSpacing; uniform int uSide; uniform float uRIn; uniform float uROut; uniform float uScale; uniform float uWidth;
  uniform highp sampler2D uHM; uniform vec2 uHMO; uniform float uTime;
  out vec3 vC; out vec3 vW; out float vH;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec4 hm(ivec2 t){ return texelFetch(uHM, clamp(t, ivec2(0), ivec2(127)), 0); }
  void main(){
    int ix = gl_InstanceID % uSide, iz = gl_InstanceID / uSide;
    vec2 cell = uOrigin + vec2(float(ix), float(iz)) * uSpacing;
    float h1 = hash(cell), h2 = hash(cell + 17.31), h3 = hash(cell + 41.77);
    vec2 p = cell + (vec2(h1, h2) - 0.5) * uSpacing * 0.95;
    float d = distance(p, uCam.xz);
    float fade = 1.0 - smoothstep(uROut * 0.72, uROut, d);
    if (uRIn > 0.0) fade *= smoothstep(uRIn - 2.5, uRIn + 0.5, d);
    vec2 t = p - uHMO - 0.5; ivec2 i0 = ivec2(floor(t)); vec2 f = fract(t);
    vec4 a = hm(i0), b = hm(i0 + ivec2(1, 0)), c = hm(i0 + ivec2(0, 1)), e = hm(i0 + ivec2(1, 1));
    float ha = a.a * 255.0, hb = b.a * 255.0, hc = c.a * 255.0, he = e.a * 255.0;
    float lo = min(min(ha, hb), min(hc, he)), hi = max(max(ha, hb), max(hc, he));
    vec4 own = hm(ivec2(floor(p - uHMO)));
    float grass = step(0.004, own.r + own.g) * (1.0 - step(2.5, hi - lo));
    float zone = own.b; float tall = smoothstep(0.6, 0.78, zone), lawn = 1.0 - smoothstep(0.22, 0.4, zone);
    float y = mix(mix(ha, hb, f.x), mix(hc, he, f.x), f.y);
    float sc = fade * grass * (0.55 + h3 * 0.8);
    if (sc < 0.03) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vC = vec3(0.0); vW = vec3(0.0); vH = 0.0; return; }
    float ang = h1 * 6.2831; vec2 dir = vec2(cos(ang), sin(ang));
    float carpet = 1.0 - smoothstep(0.03, 0.08, zone);
    float hm2 = mix(1.0, 0.32, lawn) * mix(1.0, 3.4, tall) * mix(1.0, 0.45, carpet);
    float flowerP = smoothstep(0.55, 0.8, sin(p.x * 0.11 + 1.3) * sin(p.y * 0.13 + 0.7) * 0.5 + 0.5 + h3 * 0.2) * (1.0 - tall); bool flower = carpet < 0.5 && hash(cell + 5.13) < 0.035 + flowerP * 0.09;
    if (flower) hm2 = max(hm2, 0.75);
    float hgt = 0.34 * sc * uScale * hm2 * (1.0 + (h2 - 0.5) * 0.5 * tall); float wid = uWidth * (1.0 - aBlade.y * 0.85) * mix(1.0, 0.75, tall) * (flower ? 0.6 : 1.0);
    float gust = sin(dot(p, vec2(0.37, 0.2)) - uTime * 1.6) * 0.5 + 0.5; gust = gust * gust;
    float bend = (sin(uTime * 2.6 + h2 * 6.2831 + p.x * 0.7) * 0.05 + gust * 0.2 + 0.04 + tall * (0.1 + gust * 0.25)) * aBlade.y * aBlade.y;
    vec3 w = vec3(p.x + dir.x * aBlade.x * wid, y + aBlade.y * hgt, p.y + dir.y * aBlade.x * wid);
    w.x += bend * 0.85 * (0.4 + hgt * 2.0); w.z += bend * 0.48 * (0.4 + hgt * 2.0); w.y -= bend * bend * 0.6;
    vec3 tint = vec3(own.r, own.g, own.g * 0.42);
    vC = mix(tint * vec3(0.5, 0.58, 0.42), tint * vec3(1.06, 1.08, 0.74) + vec3(0.07, 0.06, 0.0), aBlade.y) * (0.82 + 0.34 * h3);
    vC *= 1.0 + gust * 0.22 * aBlade.y;
    float lum = dot(vC, vec3(0.3, 0.59, 0.11)); vC = mix(vec3(lum), vC, 0.72) * vec3(1.04, 1.0, 0.86); // softer, a little golden
    vC = mix(vC, vC * vec3(1.12, 1.08, 0.82) + vec3(0.06, 0.05, 0.0), tall * aBlade.y * 0.6); // tall grass goes pale and golden at the tips
    if (flower && aBlade.y > 0.6) { float fk = hash(cell + 9.1); vC = fk < 0.45 ? vec3(0.96, 0.96, 0.92) : fk < 0.7 ? vec3(0.55, 0.65, 1.0) : fk < 0.88 ? vec3(1.0, 0.86, 0.3) : vec3(0.95, 0.55, 0.7); }
    vW = w; vH = aBlade.y;
    gl_Position = uPV * vec4(w, 1.0);
  }`;
  const GFS = `#version 300 es
  precision highp float;
  in vec3 vC; in vec3 vW; in float vH; out vec4 o;
  uniform vec3 uCam; uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uSunAmt; uniform float uDay; uniform vec3 uTint;
  void main(){
    float dist = distance(vW, uCam); vec3 V = (uCam - vW) / max(dist, 0.001);
    vec3 light = vec3(0.78, 0.86, 1.05) * (0.42 + 0.26 * uDay) + uSunCol * uSunAmt * uDay * (0.45 + 0.4 * vH);
    float back = pow(max(dot(-V, uSun), 0.0), 3.0) * uSunAmt * vH; // sun through the blades
    vec3 col = vC * light + vC * uSunCol * back * 0.5;
    float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0); f = f * f * (3.0 - 2.0 * f);
    o = vec4(mix(col * uTint, uFog, f), 1.0);
  }`;
  let grassProg = null, gloc = {}, grassBuf = null, hmTex = null, hmData = null, hmCenter = null, hmT = 0;
  function initGrass() {
    if (!(typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext)) return;
    try {
      const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, GVS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, GFS)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      grassProg = p; gloc.aBlade = gl.getAttribLocation(p, 'aBlade');
      for (const n of ['uPV', 'uCam', 'uOrigin', 'uSpacing', 'uSide', 'uRIn', 'uROut', 'uScale', 'uWidth', 'uHM', 'uHMO', 'uTime', 'uFog', 'uFogNear', 'uFogFar', 'uSun', 'uSunCol', 'uSunAmt', 'uDay', 'uTint']) gloc[n] = gl.getUniformLocation(p, n);
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
      let y = ch.tops[lx * CH + lz]; let id = ch.blocks[(lx * CH + lz) * WH + y]; while (y > 0 && (id === B.AIR || id === B.TORCH)) { y--; id = ch.blocks[(lx * CH + lz) * WH + y]; }
      const grass = (id === B.GRASS || id === B.GLOWGRASS) && ch.blocks[(lx * CH + lz) * WH + y + 1] === B.AIR;
      const ti = (lx * CH + lz) * 3;
      d[k] = grass ? Math.max(1, Math.min(255, ch.tint[ti] * 255)) : 0; d[k + 1] = grass ? Math.max(1, Math.min(255, ch.tint[ti + 1] * 255)) : 0; d[k + 2] = grass ? Math.max(1, Math.round(grassZone(world, x, z, world.colInfo(x, z).biome) * 254)) : 0; d[k + 3] = Math.min(255, y + 1); // blue holds the kind of grass
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
    gl.uniform3fv(gloc.uFog, state.fogColor); gl.uniform1f(gloc.uFogNear, state.fogNear); gl.uniform1f(gloc.uFogFar, state.fogFar); gl.uniform3fv(gloc.uSun, state.sun); gl.uniform3fv(gloc.uSunCol, state.sunCol); gl.uniform1f(gloc.uSunAmt, state.sunAmt); gl.uniform1f(gloc.uDay, state.dayLight); gl.uniform3fv(gloc.uTint, state.tint);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hmTex); gl.uniform1i(gloc.uHM, 0); gl.uniform2f(gloc.uHMO, hmCenter.ox, hmCenter.oz);
    gl.bindBuffer(gl.ARRAY_BUFFER, grassBuf); gl.enableVertexAttribArray(gloc.aBlade); gl.vertexAttribPointer(gloc.aBlade, 2, gl.FLOAT, false, 0, 0);
    const rings = isMobile ? [[0.17, 0, 11, 1, 0.05], [0.42, 11, 30, 1.5, 0.1]] : [[0.12, 0, 13, 1, 0.045], [0.34, 13, 38, 1.5, 0.09]];
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
    gl_FragColor = vec4(col, 1.0);
  }`;
  const LVS = `attribute vec3 aPos; uniform mat4 uPV; void main(){ gl_Position = uPV * vec4(aPos,1.0); }`;
  const LFS = `precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor = uColor; }`;

  function compile(vs, fs) {
    const p = gl.createProgram();
    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (gl2) { vs = '#version 300 es\n#define attribute in\n#define varying out\n' + vs; fs = '#version 300 es\n#define varying in\nout highp vec4 fragOut;\n#define gl_FragColor fragOut\n' + fs; }
    else { if (fs.indexOf('dFdx') >= 0) { gl.getExtension('OES_standard_derivatives'); fs = '#extension GL_OES_standard_derivatives : enable\n' + fs; } }
    const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  function init(cv, mobile) {
    canvas = cv; isMobile = mobile;
    const opts = { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: false };
    gl = cv.getContext('webgl2', opts);
    if (!gl) { gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts); if (!gl) throw new Error('WebGL is not available'); if (!gl.getExtension('OES_element_index_uint')) throw new Error('32-bit indices unsupported'); }
    prog = compile(VS, FS);
    for (const n of ['aPos', 'aCol']) loc[n] = gl.getAttribLocation(prog, n);
    for (const n of ['uPV', 'uModel', 'uTime', 'uWave', 'uCam', 'uDay', 'uFog', 'uFogNear', 'uFogFar', 'uAmbient', 'uLights', 'uLightR', 'uAlpha', 'uTint', 'uSkyMul', 'uSun', 'uSunCol', 'uZenith', 'uGrid', 'uSunAmt', 'uQuality', 'uPlayer']) loc[n] = gl.getUniformLocation(prog, n);
    skyProg = compile(SVS, SFS); sloc.aPos = gl.getAttribLocation(skyProg, 'aPos'); for (const n of ['uFwd', 'uRight', 'uUp', 'uTan', 'uAspect', 'uHorizon', 'uZenith', 'uSun', 'uSunCol', 'uSunAmt', 'uTime', 'uClouds', 'uNight']) sloc[n] = gl.getUniformLocation(skyProg, n);
    initGrass();
    skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    lineProg = compile(LVS, LFS);
    lloc.aPos = gl.getAttribLocation(lineProg, 'aPos'); lloc.uPV = gl.getUniformLocation(lineProg, 'uPV'); lloc.uColor = gl.getUniformLocation(lineProg, 'uColor');
    lineBuf = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    state.viewDist = mobile ? 56 : 96;
    resize();
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function upload(mb) {
    if (mb.empty()) return null;
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, mb.pos.subarray(0, mb.nv * 3), gl.STATIC_DRAW);
    const cbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cbo); gl.bufferData(gl.ARRAY_BUFFER, mb.col.subarray(0, mb.nv * 4), gl.STATIC_DRAW);
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mb.idx.subarray(0, mb.ni), gl.STATIC_DRAW);
    return { vbo, cbo, ibo, count: mb.ni };
  }
  function freeMesh(m) { if (!m) return; gl.deleteBuffer(m.vbo); gl.deleteBuffer(m.cbo); gl.deleteBuffer(m.ibo); }
  function drawMesh(m) {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo); gl.enableVertexAttribArray(loc.aPos); gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.cbo); gl.enableVertexAttribArray(loc.aCol); gl.vertexAttribPointer(loc.aCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0);
  }

  // ---------- chunk meshing ----------
  const scratchOpaque = new MeshBuilder(16384), scratchWater = new MeshBuilder(2048), scratchGlass = new MeshBuilder(512), scratchGrass = new MeshBuilder(8192);
  const SOIL = new Set([B.GRASS, B.DIRT, B.SAND, B.SNOW, B.GRAVEL, B.STONE, B.MOSS, B.GLOWGRASS, B.REGOLITH, B.DUNE, B.SALTCRUST]);
  const surfTop = new Int16Array(18 * 18), surfWet = new Int16Array(18 * 18), cornerH = new Float32Array(17 * 17);
  const FLOWERS = [[0.95, 0.85, 0.25], [0.95, 0.95, 0.95], [0.85, 0.35, 0.55], [0.6, 0.5, 0.95], [0.95, 0.5, 0.25]];
  function buildChunk(world, chunk) {
    const cx = chunk.cx, cz = chunk.cz, ox = cx * CH, oz = cz * CH;
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
      let t = -1, wt = -1; for (let y = WH - 1; y > 0; y--) { const b = get(x, y, z); if (b === B.AIR || b === B.TORCH) continue; if (b === B.WATER || b === B.BRINE) { if (wt < 0) wt = y + 1; continue; } if (SOIL.has(b)) t = y; break; }
      surfTop[(x + 1) * 18 + (z + 1)] = t; surfWet[(x + 1) * 18 + (z + 1)] = wt; // the seabed counts as land: shores slope in under the water
    }
    for (let cx = 0; cx <= 16; cx++) for (let cz = 0; cz <= 16; cz++) {
      let n = 0, sum = 0, lo = 999, hi = -999;
      let dry = false, wl = -1;
      for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const i = (cx + a + 1) * 18 + (cz + b + 1); const t = surfTop[i]; if (t < 0) { n = 0; break; } n++; sum += t; lo = Math.min(lo, t); hi = Math.max(hi, t); const wt = surfWet[i]; if (wt < 0) dry = true; else wl = Math.max(wl, wt); }
      let v = (n && hi - lo <= 2) ? sum / n + 1 : -1;
      if (v >= 0 && dry && wl >= 0) v = Math.max(v, wl - 0.12); // where sand meets water the ground comes up to the waterline, never sinks below it in the open air
      cornerH[cx * 17 + cz] = v;
    }
    const ST = (x, z) => surfTop[(x + 1) * 18 + (z + 1)];
    const CHt = (x, z) => cornerH[x * 17 + z];
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
        const vr = 0.92 + U.hash3(wx, y, wz, 5) * 0.12; // per-block variation
        if (id === B.STATUE) continue; // drawn as an entity
        // grass: a tuft of blades on every open grass top, and now and then a flower
        if ((id === B.GRASS || id === B.GLOWGRASS) && y + 1 < WH && blocks[base + y + 1] === B.AIR) {
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
        if (id === B.BERRY) {
          const sk = skyAt(lx, y + 1, lz);
          op.box(lx + 0.12, y, lz + 0.12, lx + 0.88, y + 0.75, lz + 0.88, [0.28, 0.58, 0.25], sk, false);
          for (let k = 0; k < 5; k++) { const h = U.hash3(wx, y, wz, 40 + k); const bx = lx + 0.15 + (h * 0.6), bz = lz + 0.15 + (U.hash3(wx, y, wz, 50 + k) * 0.6), by = y + 0.25 + U.hash3(wx, y, wz, 60 + k) * 0.45; op.box(bx, by, bz, bx + 0.14, by + 0.14, bz + 0.14, [0.85, 0.15, 0.25], sk, false); }
          continue;
        }
        if (id === B.CAMPFIRE) {
          const sk = skyAt(lx, y + 1, lz);
          for (const [ax, az] of [[0.05, 0.05], [0.65, 0.05], [0.05, 0.65], [0.65, 0.65], [0.35, 0.0], [0.35, 0.7], [0.0, 0.35], [0.7, 0.35]]) op.box(lx + ax, y, lz + az, lx + ax + 0.3, y + 0.22, lz + az + 0.3, [0.42, 0.42, 0.46], sk, false);
          op.box(lx + 0.2, y + 0.1, lz + 0.42, lx + 0.8, y + 0.26, lz + 0.58, [0.35, 0.25, 0.14], sk, false); op.box(lx + 0.42, y + 0.1, lz + 0.2, lx + 0.58, y + 0.26, lz + 0.8, [0.35, 0.25, 0.14], sk, false);
          const fl = 0.25 + 0.08 * Math.sin(U.hash3(wx, y, wz, 9) * 6);
          op.box(lx + 0.3, y + 0.2, lz + 0.3, lx + 0.7, y + 0.6 + fl, lz + 0.7, [0.45, 0.95, 1.0], 1, true);
          op.box(lx + 0.4, y + 0.55 + fl, lz + 0.4, lx + 0.6, y + 0.95 + fl, lz + 0.6, [0.85, 1.0, 1.0], 1, true);
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
        if (id === B.GLOWWORM) {
          const sk = skyAt(lx, y, lz); const g = [0.85, 1.0, 0.42];
          const h0 = U.hash3(wx, y, wz, 71), h1 = U.hash3(wx, y, wz, 72);
          const cx = lx + 0.25 + h0 * 0.4, cz = lz + 0.25 + h1 * 0.4;
          op.box(cx, y, cz, cx + 0.3, y + 0.16, cz + 0.16, g, 1, true); op.box(cx + 0.22, y, cz + 0.1, cx + 0.42, y + 0.14, cz + 0.26, [0.6, 0.9, 0.3], sk, false); // body and tail
          op.box(cx - 0.1, y + 0.05, cz + 0.02, cx, y + 0.1, cz + 0.12, g, 1, true); // head glow
          continue;
        }
        if (id === B.CHEST) {
          const sk = skyAt(lx, y + 1, lz); const wood = [0.63, 0.47, 0.24], dark = [0.4, 0.29, 0.14], iron = [0.55, 0.57, 0.62];
          op.box(lx + 0.08, y, lz + 0.1, lx + 0.92, y + 0.6, lz + 0.9, wood, sk, false); op.box(lx + 0.06, y + 0.6, lz + 0.08, lx + 0.94, y + 0.78, lz + 0.92, dark, sk, false);
          op.box(lx + 0.06, y + 0.3, lz + 0.09, lx + 0.94, y + 0.36, lz + 0.91, iron, sk, false); op.box(lx + 0.44, y + 0.5, lz + 0.04, lx + 0.56, y + 0.68, lz + 0.1, iron, sk, false); // band and latch
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
          const side = wall(1, 0) ? 'x+' : wall(-1, 0) ? 'x-' : wall(0, 1) ? 'z+' : wall(0, -1) ? 'z-' : 'x+';
          const at = side === 'x+' ? 0.86 : side === 'x-' ? 0.02 : side === 'z+' ? 0.86 : 0.02;
          if (side[0] === 'x') { op.box(lx + at, y, lz + 0.12, lx + at + 0.12, y + 1, lz + 0.22, dark, sk, false); op.box(lx + at, y, lz + 0.78, lx + at + 0.12, y + 1, lz + 0.88, dark, sk, false); for (const r of [0.15, 0.4, 0.65, 0.9]) op.box(lx + at, y + r - 0.04, lz + 0.22, lx + at + 0.1, y + r + 0.04, lz + 0.78, wood, sk, false); }
          else { op.box(lx + 0.12, y, lz + at, lx + 0.22, y + 1, lz + at + 0.12, dark, sk, false); op.box(lx + 0.78, y, lz + at, lx + 0.88, y + 1, lz + at + 0.12, dark, sk, false); for (const r of [0.15, 0.4, 0.65, 0.9]) op.box(lx + 0.22, y + r - 0.04, lz + at, lx + 0.78, y + r + 0.04, lz + at + 0.1, wood, sk, false); }
          continue;
        }
        if (id === B.FERN) {
          const sk = skyAt(lx, y + 1, lz); const g = [0.26, 0.56, 0.22], g2 = [0.36, 0.7, 0.28];
          op.box(lx + 0.46, y, lz + 0.46, lx + 0.54, y + 0.5, lz + 0.54, [0.3, 0.45, 0.2], sk, false);
          op.box(lx + 0.05, y + 0.25, lz + 0.42, lx + 0.5, y + 0.33, lz + 0.58, g, sk, false); op.box(lx + 0.5, y + 0.3, lz + 0.42, lx + 0.95, y + 0.38, lz + 0.58, g2, sk, false);
          op.box(lx + 0.42, y + 0.35, lz + 0.05, lx + 0.58, y + 0.43, lz + 0.5, g2, sk, false); op.box(lx + 0.42, y + 0.4, lz + 0.5, lx + 0.58, y + 0.48, lz + 0.95, g, sk, false);
          op.box(lx + 0.2, y + 0.5, lz + 0.2, lx + 0.8, y + 0.56, lz + 0.8, g2, sk, false);
          continue;
        }
        if (id === B.MOONGLOW) {
          const sk = skyAt(lx, y, lz); const pulse = 0.3 + U.hash3(wx, y, wz, 77) * 0.08;
          op.box(lx + 0.44, y, lz + 0.44, lx + 0.56, y + 0.3, lz + 0.56, [0.12, 0.14, 0.2], sk, false);
          op.box(lx + 0.5 - pulse, y + 0.28, lz + 0.5 - pulse, lx + 0.5 + pulse, y + 0.28 + pulse * 2, lz + 0.5 + pulse, [0.75, 1.0, 0.45], 1, true);
          continue;
        }
        if (info.partial) {
          // torch: small post + glowing head
          const sk = skyAt(lx, y, lz);
          op.box(lx + 0.42, y, lz + 0.42, lx + 0.58, y + 0.62, lz + 0.58, [0.45, 0.33, 0.18], sk, false);
          op.box(lx + 0.38, y + 0.55, lz + 0.38, lx + 0.62, y + 0.78, lz + 0.62, [1.0, 0.82, 0.35], 1, true);
          continue;
        }
        const isWater = id === B.WATER || id === B.BRINE, isGlass = id === B.GLASS || id === B.SELGLASS;
        for (let f = 0; f < 6; f++) {
          const F = FACES[f], n = F.n;
          const nx = lx + n[0], ny = y + n[1], nz = lz + n[2];
          const nid = get(nx, ny, nz);
          if (isWater) { if (nid !== B.AIR && nid !== B.TORCH && nid !== B.GLASS && nid !== B.SELGLASS && !(BLOCKS[nid].partial && !BLOCKS[nid].solid)) continue; }
          else if (isGlass) { if (nid === id || isOpaque(nid)) continue; }
          else if (id === B.LAVA) { if (nid !== B.AIR && nid !== B.TORCH && nid !== B.WATER) continue; }
          else if (isOpaque(nid)) continue;
          else if (isLeaf(id) && isLeaf(nid)) continue;
          // colour
          let c;
          const pal = world.preset.paletteRgb && world.preset.paletteRgb[id];
          const topC = pal ? pal[0] : info.top, sideC = pal ? pal[1] : info.side;
          if (f === 2) c = topC; else if (f === 3) c = (id === B.GRASS || id === B.GLOWGRASS) ? BLOCKS[B.DIRT].side : sideC; else c = sideC;
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
          for (let i = 0; i < 4; i++) {
            const v = F.v[i];
            verts.push([lx + v[0], sloped && CHt(lx + v[0], lz + v[2]) >= 0 ? CHt(lx + v[0], lz + v[2]) : y + v[1], lz + v[2]]);
            // ambient occlusion
            let ao = 1;
            if (!isWater && id !== B.LAVA) {
              const d = [0, 0, 0]; d[a] = n[a];
              const bAxis = a === 0 ? 1 : 0, cAxis = a === 2 ? 1 : 2;
              const db = v[bAxis] ? 1 : -1, dc = v[cAxis] ? 1 : -1;
              const p1 = [nx, ny, nz]; p1[bAxis] += db;
              const p2 = [nx, ny, nz]; p2[cAxis] += dc;
              const p3 = [nx, ny, nz]; p3[bAxis] += db; p3[cAxis] += dc;
              const s1 = isOpaque(get(p1[0], p1[1], p1[2])) ? 1 : 0, s2 = isOpaque(get(p2[0], p2[1], p2[2])) ? 1 : 0, s3 = isOpaque(get(p3[0], p3[1], p3[2])) ? 1 : 0;
              const lvl = (s1 && s2) ? 0 : 3 - (s1 + s2 + s3);
              ao = 0.64 + 0.12 * lvl;
            }
            aos.push(ao);
            const sh = shade * ao;
            cols.push([c[0] * sh, c[1] * sh, c[2] * sh]);
            skys.push(sk);
          }
          const pat = PATTERNS[id]; const pf = pat ? ((f === 2 || f === 3) ? (pat.top || pat.all) : (pat.side || pat.all)) : null;
          if (isWater) { let d = 0; while (d < 10 && (get(lx, y - d - 1, lz) === id)) d++; const dc = [Math.min(1, (d + 1) / 9), id === B.BRINE ? 1 : 0, 0]; for (let i = 0; i < 4; i++) cols[i] = dc; }
          if (!pf) { if (isWater) wa.quad(verts, cols, skys, false); else if (isGlass) gs.quad(verts, cols, skys, false); else op.quad(verts, cols, skys, emis); }
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
            if (studs) for (const s of studs) {
              const h = s.s / 2; const p0 = at(s.u - h, s.v - h), p1 = at(s.u + h, s.v + h);
              const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), y0 = Math.min(p0[1], p1[1]), y1 = Math.max(p0[1], p1[1]), z0 = Math.min(p0[2], p1[2]), z1 = Math.max(p0[2], p1[2]);
              const ex = n[0] * s.h, ey = n[1] * s.h, ez = n[2] * s.h;
              const sc = s.col || baseC; const m = (s.mul || 1) * vr;
              op.box(Math.min(x0, x0 + ex), Math.min(y0, y0 + ey), Math.min(z0, z0 + ez), Math.max(x1, x1 + ex), Math.max(y1, y1 + ey), Math.max(z1, z1 + ez), [sc[0] * m, sc[1] * m, sc[2] * m], sk, !!s.emis);
            }
          }
        }
        if (id === B.DARKTABLE) { op.box(lx + 0.28, y + 1, lz + 0.28, lx + 0.72, y + 1.45, lz + 0.72, [0.7, 0.2, 1.0], 1, true); op.box(lx + 0.42, y + 1.45, lz + 0.42, lx + 0.58, y + 1.75, lz + 0.58, [1.0, 0.3, 0.35], 1, true); }
        if (id === B.FUSION) {
          // glowing crystal on top of the table
          op.box(lx + 0.3, y + 1, lz + 0.3, lx + 0.7, y + 1.35, lz + 0.7, [0.55, 0.9, 1.0], 1, true);
        }
      }
    }
    if (chunk.mesh) { freeMesh(chunk.mesh.op); freeMesh(chunk.mesh.wa); freeMesh(chunk.mesh.gs); freeMesh(chunk.mesh.gr); }
    chunk.mesh = { op: upload(op), wa: upload(wa), gs: upload(gs), gr: upload(gr) };
    chunk.dirty = false;
  }
  function freeChunk(chunk) { if (chunk.mesh) { freeMesh(chunk.mesh.op); freeMesh(chunk.mesh.wa); freeMesh(chunk.mesh.gs); freeMesh(chunk.mesh.gr); chunk.mesh = null; } }

  // ---------- entity meshes ----------
  function entityMesh(key, buildFn) {
    let m = entityMeshes.get(key);
    if (!m) { const mb = new MeshBuilder(1024); buildFn(mb); m = upload(mb) || { count: 0 }; entityMeshes.set(key, m); }
    return m;
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
    state.skyColor = sky; state.fogColor = sky; state.ambient = 0.06;
    state.fogNear = state.viewDist * 0.55 * (world.preset.fogMul || 1); state.fogFar = state.viewDist * 0.98 * (world.preset.fogMul || 1);
    if (wi > 0.02 && wk === 'fog') { state.fogNear = U.lerp(state.fogNear, 4, wi); state.fogFar = U.lerp(state.fogFar, 26, wi); }
    if (gl0 > 0.01) { state.fogNear = U.lerp(state.fogNear, state.viewDist * 0.32, gl0); state.fogFar = U.lerp(state.fogFar, state.viewDist * 0.88, gl0); }
    else if (wi > 0.02 && (wk === 'rain' || wk === 'storm')) { state.fogNear = U.lerp(state.fogNear, state.viewDist * 0.3, wi); state.fogFar = U.lerp(state.fogFar, state.viewDist * 0.75, wi); }
    state.tint = [1, 1, 1]; state.underwater = false; state.inCore = false;
    const eyeBlock = world.getBlock(Math.floor(player.x), Math.floor(player.y + 1.62), Math.floor(player.z));
    if (eyeBlock === B.WATER || eyeBlock === B.BRINE || eyeBlock === B.LAVA || player.y < CORE_TOP || player.y < world.topAt(Math.floor(player.x), Math.floor(player.z)) - 2) state.skyPass = false;
    if (eyeBlock === B.WATER) { state.underwater = true; state.fogColor = [0.05, 0.2, 0.45]; state.skyColor = state.fogColor; state.fogNear = 2; state.fogFar = 18; state.tint = [0.6, 0.8, 1.0]; }
    else if (eyeBlock === B.BRINE) { state.underwater = true; state.fogColor = [0.35, 0.42, 0.08]; state.skyColor = state.fogColor; state.fogNear = 1; state.fogFar = 9; state.tint = [0.9, 1.0, 0.5]; }
    else if (eyeBlock === B.LAVA) { state.fogColor = [0.9, 0.3, 0.05]; state.skyColor = state.fogColor; state.fogNear = 0.5; state.fogFar = 4; state.tint = [1.2, 0.6, 0.3]; }
    else if (player.y < CORE_TOP) { state.inCore = true; state.fogColor = [0.16, 0.04, 0.01]; state.skyColor = state.fogColor; state.fogNear = 8; state.fogFar = 46; state.ambient = 0.46; state.tint = [1.1, 0.88, 0.8]; }
    else if (player.y < world.topAt(Math.floor(player.x), Math.floor(player.z)) - 2) { state.fogColor = [0.0, 0.0, 0.0]; state.skyColor = state.fogColor; state.fogNear = 10; state.fogFar = 48; }
  }

  function render(world, player, entities, cam, extras) {
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
    const pv = U.m4mul(proj, view);
    const planes = U.frustumPlanes(pv);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(loc.uPV, false, pv);
    gl.uniform1f(loc.uTime, performance.now() / 1000);
    gl.uniform3f(loc.uCam, cam.x, cam.y, cam.z);
    gl.uniform1f(loc.uDay, state.dayLight);
    gl.uniform3fv(loc.uFog, state.fogColor);
    gl.uniform1f(loc.uFogNear, state.fogNear); gl.uniform1f(loc.uFogFar, state.fogFar);
    gl.uniform1f(loc.uAmbient, state.ambient);
    gl.uniform3fv(loc.uTint, state.tint);
    gl.uniform1f(loc.uSkyMul, 1);
    gl.uniform3fv(loc.uSun, state.sun || [0, 1, 0]); gl.uniform3fv(loc.uSunCol, state.sunCol || [1, 1, 1]); gl.uniform3fv(loc.uZenith, state.zenith || state.fogColor); gl.uniform1f(loc.uSunAmt, state.skyPass ? state.sunAmt : 0); gl.uniform1f(loc.uQuality, isMobile ? 0.6 : 1); gl.uniform1f(loc.uGrid, 1); gl.uniform3f(loc.uPlayer, player.x, player.y, player.z);
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
      if (!U.sphereInFrustum(planes, mx, WH / 2, mz, rad)) continue;
      visible.push(c);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    for (const c of visible) if (c.mesh.op) { ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(loc.uModel, false, ident); drawMesh(c.mesh.op); }
    drawGrass(world, player, pv, cam);
    gl.useProgram(prog); gl.uniformMatrix4fv(loc.uPV, false, pv);
    // grass: blades within reach, swaying (fallback without instancing)
    gl.uniform1f(loc.uGrid, 0); gl.uniform1f(loc.uWave, 2);
    const gR = (isMobile ? 34 : 48) + 16;
    for (const c of visible) if (c.mesh.gr) { const dx = c.cx * CH + 8 - cam.x, dz = c.cz * CH + 8 - cam.z; if (dx * dx + dz * dz > gR * gR) continue; ident[12] = c.cx * CH; ident[14] = c.cz * CH; gl.uniformMatrix4fv(loc.uModel, false, ident); drawMesh(c.mesh.gr); }
    gl.uniform1f(loc.uWave, 0);
    // entities
    for (const e of entities) {
      if (!e.mesh || !e.mesh.count) continue;
      const d2 = (e.x - cam.x) ** 2 + (e.z - cam.z) ** 2; if (d2 > state.viewDist * state.viewDist) continue;
      gl.uniform1f(loc.uSkyMul, e.skyMul == null ? 1 : e.skyMul);
      gl.uniformMatrix4fv(loc.uModel, false, U.m4model(e.x, e.y + (e.hover || 0), e.z, e.yaw, e.scale || 1));
      drawMesh(e.mesh);
    }
    gl.uniform1f(loc.uSkyMul, 1);
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
  }

  // helpers to build line sets
  function boxLines(x, y, z, pad = 0.003) {
    const a = x - pad, b = y - pad, c = z - pad, d = x + 1 + pad, e = y + 1 + pad, f = z + 1 + pad;
    return new Float32Array([a, b, c, d, b, c, d, b, c, d, b, f, d, b, f, a, b, f, a, b, f, a, b, c, a, e, c, d, e, c, d, e, c, d, e, f, d, e, f, a, e, f, a, e, f, a, e, c, a, b, c, a, e, c, d, b, c, d, e, c, d, b, f, d, e, f, a, b, f, a, e, f]);
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

  return { grassZone, init, resize, buildChunk, freeChunk, entityMesh, render, boxLines, ringLines, state, get gl() { return gl; } };
})();
