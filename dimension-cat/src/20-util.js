// ============================================================================
// UTILITIES — math, seeded random, resource tracking, geometry/material cache
// ============================================================================
const { PI, sin, cos, abs, min, max, sqrt, atan2, floor } = Math;
const TAU = PI * 2;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
/** Frame-rate independent exponential smoothing. */
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const wrapAngle = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const dampAngle = (a, b, lambda, dt) => a + wrapAngle(b - a) * (1 - Math.exp(-lambda * dt));
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const dist2 = (ax, az, bx, bz) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/** 0xRRGGBB → [hue 0-360, sat 0-100, light 0-100]. */
function hexToHsl(hex) {
  const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255, mx = max(r, g, b), mn = min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, Math.round(l * 100)];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

/** Deterministic PRNG so world layouts are identical every visit. */
function seeded(seed) {
  let s = seed >>> 0;
  const rnd = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  rnd.range = (a, b) => a + rnd() * (b - a);
  rnd.int = (a, b) => floor(a + rnd() * (b - a + 1));
  rnd.pick = (arr) => arr[floor(rnd() * arr.length)];
  rnd.chance = (p) => rnd() < p;
  return rnd;
}
const rnd = seeded(1337);           // general purpose (animation jitter etc.)

/**
 * Draws from a shuffled bag: every item is handed out once before any repeats. Independent picks
 * clump — seven people rolling a shirt colour each can easily come out five-sevenths red — so
 * anything where the *spread* is the point (a crowd's clothes) draws from here instead.
 */
function bag(r, items) {
  let pool = [];
  return () => {
    if (!pool.length) { pool = items.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = r.int(0, i); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; } }
    return pool.pop();
  };
}

/**
 * Keep-out rectangles for a world: roads, pavements, garden paths, building footprints, water.
 * Anything scattered (trees, bushes, flowers, grass, rocks) asks here first, so nothing ends up
 * standing in the middle of the road or growing through a wall.
 */
class Zones {
  constructor() { this.list = []; }
  /** A rectangle centred on (x,z). `pad` widens it — use it for the clearance a prop needs. */
  add(x, z, w, d, pad = 0) { this.list.push({ minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad }); return this; }
  /** A rectangle from corner to corner. */
  addSpan(x0, z0, x1, z1, pad = 0) { this.list.push({ minX: min(x0, x1) - pad, maxX: max(x0, x1) + pad, minZ: min(z0, z1) - pad, maxZ: max(z0, z1) + pad }); return this; }
  /** A circle, stored as its bounding square (good enough for scatter rejection). */
  addCircle(x, z, r, pad = 0) { return this.add(x, z, r * 2, r * 2, pad); }
  blocked(x, z, pad = 0) {
    for (const r of this.list) if (x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad) return true;
    return false;
  }
  /** Nudge (x,z) out of any zone by spiralling outward; returns null when nowhere within `reach` is clear. */
  nudge(x, z, pad = 0, reach = 7) {
    if (!this.blocked(x, z, pad)) return [x, z];
    for (let d = 0.6; d <= reach; d += 0.6) for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, nx = x + cos(a) * d, nz = z + sin(a) * d;
      if (!this.blocked(nx, nz, pad)) return [nx, nz];
    }
    return null;
  }
}

/** Tracks disposable GPU resources so a world can be torn down without leaks. */
class ResourceBag {
  constructor() { this.items = new Set(); }
  track(o) { this.items.add(o); return o; }
  dispose() { for (const o of this.items) { try { o.dispose?.(); } catch (_) { /* ignore */ } } this.items.clear(); }
}
const worldBag = new ResourceBag();   // emptied on every dimension change
const globalBag = new ResourceBag();  // lives for the whole session

// ---------------------------------------------------------------- geometry
const geoCache = new Map();
const cachedGeo = (key, make) => { let g = geoCache.get(key); if (!g) { g = make(); geoCache.set(key, g); } return g; };
const G = {
  box: (w, h, d) => cachedGeo(`box${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  sphere: (r, ws = 16, hs = 12) => cachedGeo(`sph${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)),
  /** Unit sphere with poles along Z — scale it to make bodies (fur stripes wrap around the body). */
  bodySphere: (ws = 20, hs = 16) => cachedGeo(`bsph${ws},${hs}`, () => new THREE.SphereGeometry(1, ws, hs).rotateX(PI / 2)),
  cyl: (rt, rb, h, seg = 12) => cachedGeo(`cyl${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)),
  cone: (r, h, seg = 12) => cachedGeo(`cone${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
  capsule: (r, l, seg = 8) => cachedGeo(`cap${r},${l},${seg}`, () => new THREE.CapsuleGeometry(r, l, 4, seg)),
  torus: (r, t, rs = 8, ts = 24, arc = TAU) => cachedGeo(`tor${r},${t},${rs},${ts},${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  plane: (w, h, sw = 1, sh = 1) => cachedGeo(`pl${w},${h},${sw},${sh}`, () => new THREE.PlaneGeometry(w, h, sw, sh)),
  /** Upper hemisphere (thetaLength = PI/2). */
  dome: (r, ws = 12, hs = 8) => cachedGeo(`dome${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs, 0, TAU, 0, PI / 2)),
  /** Flattened 4-sided cone: a triangular ear / spike. */
  earCone: (r, h) => cachedGeo(`ear${r},${h}`, () => new THREE.ConeGeometry(r, h, 4).scale(1, 1, 0.42)),
  /** Five-pointed star, extruded. */
  star: (outer, inner, depth) => cachedGeo(`star${outer},${inner},${depth}`, () => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? inner : outer; const a = i * PI / 5 - PI / 2; i ? s.lineTo(cos(a) * r, sin(a) * r) : s.moveTo(cos(a) * r, sin(a) * r); }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: depth * 0.3, bevelSegments: 2 });
    g.center();
    return g;
  }),
  /** Gable roof: triangular prism, width w (x), height h (y), depth d (z), sitting on y=0. */
  gable: (w, h, d) => cachedGeo(`gable${w},${h},${d}`, () => {
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g;
  }),
  /** Faceted gem: an octahedron, stretched taller than wide by the caller. */
  gem: () => cachedGeo('gem', () => new THREE.OctahedronGeometry(1, 0)),
  /** Flower head: a rosette outline (petals) extruded paper-thin, lying in the XZ plane. */
  rosette: (petals, rOut, rIn) => cachedGeo(`ros${petals},${rOut},${rIn}`, () => {
    const s = new THREE.Shape();
    for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU, rr = rIn + (rOut - rIn) * (0.5 + 0.5 * cos(a * petals)); i ? s.lineTo(cos(a) * rr, sin(a) * rr) : s.moveTo(cos(a) * rr, sin(a) * rr); }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }); g.rotateX(-PI / 2); return g;
  }),
  /** A single grass blade: a thin tapered triangle, slightly bent. */
  blade: () => cachedGeo('blade', () => new THREE.ConeGeometry(0.055, 0.42, 3).translate(0, 0.21, 0)),
  /** Heart shape for particles / decor. */
  heart: (size, depth) => cachedGeo(`heart${size},${depth}`, () => {
    const s = new THREE.Shape(); const x = 0, y = 0;
    s.moveTo(x, y + size * 0.35);
    s.bezierCurveTo(x, y + size * 0.55, x - size * 0.5, y + size * 0.55, x - size * 0.5, y + size * 0.15);
    s.bezierCurveTo(x - size * 0.5, y - size * 0.2, x, y - size * 0.35, x, y - size * 0.6);
    s.bezierCurveTo(x, y - size * 0.35, x + size * 0.5, y - size * 0.2, x + size * 0.5, y + size * 0.15);
    s.bezierCurveTo(x + size * 0.5, y + size * 0.55, x, y + size * 0.55, x, y + size * 0.35);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.center(); return g;
  }),
};

// ---------------------------------------------------------------- materials
/** The light ramp every toon material shares: four flat bands instead of a smooth falloff. */
let TOON_RAMP = null;
function toonRamp() {
  if (TOON_RAMP) return TOON_RAMP;
  const t = new THREE.DataTexture(Uint8Array.from([118, 168, 214, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  globalBag.track(t);
  return (TOON_RAMP = t);
}
/**
 * The world's material. Cel-shaded by default — flat bands of colour, which is what makes everything
 * read as a cartoon. Anything genuinely shiny (metal, chrome, glass) asks for PBR with `pbr: true`
 * or a metalness of 0.35 or more, and keeps its highlights.
 */
function mat(color, opts = {}, keep = false) {
  const { roughness, metalness, pbr, flatShading, ...rest } = opts;   // toon materials have no roughness, metalness or flat shading
  const m = (pbr || (metalness ?? 0) >= 0.35)
    ? new THREE.MeshStandardMaterial({ color, roughness: roughness ?? 0.75, metalness: metalness ?? 0, flatShading: !!flatShading, ...rest })
    : new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...rest });
  (keep ? globalBag : worldBag).track(m);
  return m;
}
function basic(color, opts = {}, keep = false) {
  const m = new THREE.MeshBasicMaterial({ color, ...opts });
  (keep ? globalBag : worldBag).track(m);
  return m;
}
function glowMat(color, intensity = 1.2, opts = {}) {
  return mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.5, ...opts });
}

/** Mesh helper: mesh(geo, mat, {x,y,z, rx,ry,rz, sx,sy,sz, shadow:'cast'|'receive'|'both'|'none', parent}) */
function mesh(geometry, material, o = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(o.x || 0, o.y || 0, o.z || 0);
  if (o.rx || o.ry || o.rz) m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  if (o.sx !== undefined || o.sy !== undefined || o.sz !== undefined) m.scale.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
  const s = o.shadow || 'cast';
  m.castShadow = s === 'cast' || s === 'both';
  m.receiveShadow = s === 'receive' || s === 'both';
  if (o.parent) o.parent.add(m);
  return m;
}
/**
 * Keep a thin thing (a cable, a wire, a string) out of the ink pass. The outline is found in the depth
 * buffer, and anything a pixel or two wide gets inked on both edges and comes out as a solid line
 * across the sky. Not writing depth means no silhouette; drawing after everything else keeps the
 * depth *test*, so it still hides behind whatever stands in front of it.
 */
function noInk(m) { m.material.depthWrite = false; m.renderOrder = 1; return m; }
function group(x = 0, y = 0, z = 0, parent = null) {
  const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g;
}
// ---------------------------------------------------------------- baking
/** One shared toon material for every baked mesh: the colour comes from the vertices. */
let BAKED_MAT = null;
const bakedMat = () => BAKED_MAT || (BAKED_MAT = globalBag.track(new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonRamp() })));
/**
 * Merge the plain toon meshes sitting directly under `node` into one mesh with vertex colours — one
 * draw call in place of a dozen. Groups underneath are left alone (in a rig they are the joints that
 * animate), so bakeRig() walks a whole rig and does every joint in turn. Anything that is not a plain
 * flat-coloured toon mesh — glow, glass, textures, the unlit eye whites — is kept exactly as it was.
 */
function bakeStatic(node) {
  // `userData.keep` marks a mesh a rig animates on its own (a scaled torso, a snapping claw tip)
  const plain = (m) => m.isMesh && !m.userData.keep && m.material && m.material.isMeshToonMaterial && !m.material.map && !m.material.transparent && !m.material.vertexColors
    && !(m.material.emissive && m.material.emissive.getHex() !== 0) && m.geometry && m.geometry.attributes && m.geometry.attributes.position && (m.material.side ?? 0) === 0;
  const parts = node.children.filter(plain);
  if (parts.length < 2) return;
  let nV = 0, nI = 0;
  for (const m of parts) { const g = m.geometry; nV += g.attributes.position.count; nI += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = new Uint32Array(nI);
  const M4 = new THREE.Matrix4(), N3 = new THREE.Matrix3(), P = new THREE.Vector3(), N = new THREE.Vector3();
  let v = 0, ii = 0, cast = false;
  for (const m of parts) {
    m.updateMatrix(); M4.copy(m.matrix); N3.getNormalMatrix(M4);
    const g = m.geometry, p = g.attributes.position, n = g.attributes.normal, c = m.material.color;
    for (let i = 0; i < p.count; i++) {
      const k = (v + i) * 3;
      P.fromBufferAttribute(p, i).applyMatrix4(M4); pos[k] = P.x; pos[k + 1] = P.y; pos[k + 2] = P.z;
      if (n) N.fromBufferAttribute(n, i).applyMatrix3(N3).normalize(); else N.set(0, 1, 0);
      nor[k] = N.x; nor[k + 1] = N.y; nor[k + 2] = N.z;
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
    }
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[ii + i] = g.index.getX(i) + v; ii += g.index.count; }
    else { for (let i = 0; i < p.count; i++) idx[ii + i] = v + i; ii += p.count; }
    v += p.count; cast = cast || m.castShadow;
    node.remove(m);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  worldBag.track(geo);
  const baked = new THREE.Mesh(geo, bakedMat()); baked.castShadow = cast; baked.receiveShadow = false;
  node.add(baked);
}
/**
 * Bake a whole static prop: every plain toon mesh anywhere under `root` — however deep — becomes one
 * mesh at the root, in the root's own space. Anything under a node with userData.update or
 * userData.keep is left alone, as is anything glowing, transparent, textured, double-sided, instanced
 * or kept out of the ink pass. For scenery that never moves, this is the difference between a
 * cupcake costing sixty draw calls and costing one.
 */
function bakeDeep(root) {
  if (root.userData.rig || !root.matrixWorld || !root.matrixWorld.invert) return 0;   // never a creature; nothing to do in the Node stub
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const frozen = (m) => { for (let o = m; o && o !== root; o = o.parent) if (o.userData.update || o.userData.keep) return true; return false; };
  const plain = (m) => m.isMesh && !m.isInstancedMesh && m.material && m.material.isMeshToonMaterial && !m.material.map && !m.material.transparent && !m.material.vertexColors
    && m.material.depthWrite !== false && !(m.material.emissive && m.material.emissive.getHex() !== 0) && m.geometry && m.geometry.attributes && m.geometry.attributes.position && (m.material.side ?? 0) === 0;
  const parts = [];
  root.traverse((m) => { if (m !== root && plain(m) && !frozen(m)) parts.push(m); });
  if (parts.length < 2) return 0;
  let nV = 0, nI = 0;
  for (const m of parts) { const g = m.geometry; nV += g.attributes.position.count; nI += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = new Uint32Array(nI);
  const M4 = new THREE.Matrix4(), N3 = new THREE.Matrix3(), P = new THREE.Vector3(), N = new THREE.Vector3();
  let v = 0, ii = 0, cast = false, receive = false;
  for (const m of parts) {
    M4.multiplyMatrices(inv, m.matrixWorld); N3.getNormalMatrix(M4);
    const g = m.geometry, p = g.attributes.position, n = g.attributes.normal, c = m.material.color;
    for (let i = 0; i < p.count; i++) {
      const k = (v + i) * 3;
      P.fromBufferAttribute(p, i).applyMatrix4(M4); pos[k] = P.x; pos[k + 1] = P.y; pos[k + 2] = P.z;
      if (n) N.fromBufferAttribute(n, i).applyMatrix3(N3).normalize(); else N.set(0, 1, 0);
      nor[k] = N.x; nor[k + 1] = N.y; nor[k + 2] = N.z;
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
    }
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[ii + i] = g.index.getX(i) + v; ii += g.index.count; }
    else { for (let i = 0; i < p.count; i++) idx[ii + i] = v + i; ii += p.count; }
    v += p.count; cast = cast || m.castShadow; receive = receive || m.receiveShadow;
    m.parent.remove(m);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  worldBag.track(geo);
  const baked = new THREE.Mesh(geo, bakedMat()); baked.castShadow = cast; baked.receiveShadow = receive;
  root.add(baked);
  return parts.length;
}
/** Bake every joint of a rig (see bakeStatic). Call it once the rig is fully built. */
function bakeRig(root) { root.userData.rig = true; const nodes = []; root.traverse((o) => { if (!o.isMesh) nodes.push(o); }); for (const n of nodes) bakeStatic(n); return root; }

/** Simple tween list, ticked from the main loop. */
const tweens = [];
function tween(duration, onUpdate, onDone, ease = (t) => t * t * (3 - 2 * t)) {
  tweens.push({ t: 0, duration, onUpdate, onDone, ease });
}
function tickTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; tw.t += dt;
    const k = clamp(tw.t / tw.duration, 0, 1);
    tw.onUpdate(tw.ease(k));
    if (k >= 1) { tweens.splice(i, 1); tw.onDone?.(); }
  }
}
