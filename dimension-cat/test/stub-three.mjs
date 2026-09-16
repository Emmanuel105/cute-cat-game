// Minimal three.js stand-in for logic tests in Node (no rendering). Real vector math, fake GPU objects.
const hexToRgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
export class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } set(x, y) { this.x = x; this.y = y; return this; } copy(v) { this.x = v.x; this.y = v.y; return this; } }
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { this.x = this.y = this.z = s; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; }
}
export class Color {
  constructor(c) { this.r = this.g = this.b = 1; if (c !== undefined) this.set(c); }
  set(c) { if (c instanceof Color) { this.r = c.r; this.g = c.g; this.b = c.b; } else if (typeof c === 'number') { [this.r, this.g, this.b] = hexToRgb(c); } return this; }
  setHex(h) { return this.set(h); } setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
  copy(c) { return this.set(c); }
  setHSL(h, s, l) { const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; this.r = f(0); this.g = f(8); this.b = f(4); return this; }
  getHex() { return (Math.round(this.r * 255) << 16) | (Math.round(this.g * 255) << 8) | Math.round(this.b * 255); }
  clone() { return new Color().set(this); } lerp(c, t) { this.r += (c.r - this.r) * t; this.g += (c.g - this.g) * t; this.b += (c.b - this.b) * t; return this; }
}
export class Euler { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }
export class Quaternion { setFromEuler() { return this; } setFromAxisAngle() { return this; } }
export class Matrix4 { constructor() { this.t = new Vector3(); } makeTranslation(x, y, z) { this.t.set(x, y, z); return this; } compose(p) { this.t.copy(p); return this; } identity() { return this; } multiplyMatrices() { return this; } }
let ids = 0;
export class Object3D {
  constructor() { this.id = ids++; this.position = new Vector3(); this.rotation = new Euler(); this.scale = new Vector3(1, 1, 1); this.children = []; this.parent = null; this.userData = {}; this.visible = true; this.castShadow = false; this.receiveShadow = false; this.frustumCulled = true; this.renderOrder = 0; this.name = ''; }
  add(...objs) { for (const o of objs) { if (o.parent) o.parent.remove(o); o.parent = this; this.children.push(o); } return this; }
  remove(o) { const i = this.children.indexOf(o); if (i >= 0) { this.children.splice(i, 1); o.parent = null; } return this; }
  traverse(fn) { fn(this); for (const c of this.children) c.traverse(fn); }
  getWorldPosition(v) {
    let x = 0, y = 0, z = 0, o = this;
    // accumulate translation with parent Y rotations (enough for our scene graphs)
    const chain = []; while (o) { chain.unshift(o); o = o.parent; }
    let px = 0, py = 0, pz = 0, rot = 0;
    for (const n of chain) { const c = Math.cos(rot), s = Math.sin(rot); px += n.position.x * c + n.position.z * s; py += n.position.y; pz += -n.position.x * s + n.position.z * c; rot += n.rotation.y; }
    x = px; y = py; z = pz;
    return v.set(x, y, z);
  }
  lookAt() {} updateMatrixWorld() {} updateProjectionMatrix() {}
  clone() { const c = new this.constructor(this.geometry, this.material); c.position.copy(this.position); c.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z); c.scale.copy(this.scale); c.userData = { ...this.userData }; c.visible = this.visible; return c; }
}
export class Group extends Object3D {} export class Scene extends Object3D { constructor() { super(); this.fog = null; this.background = null; } }
export class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
export class Line extends Mesh {} export class Points extends Mesh {}
export class Sprite extends Object3D { constructor(m) { super(); this.material = m; } }
export class InstancedMesh extends Mesh { constructor(g, m, n) { super(g, m); this.count = n; this.instanceMatrix = { needsUpdate: false }; this.instanceColor = null; } setMatrixAt() {} setColorAt() { this.instanceColor = this.instanceColor || { needsUpdate: false }; } }
class Material { constructor(o = {}) { Object.assign(this, { transparent: false, opacity: 1, side: 0, blending: 1, depthWrite: true, roughness: 1, metalness: 0, emissiveIntensity: 1, map: null, emissiveMap: null, fog: true, toneMapped: true }, o); if (typeof this.color === 'number') this.color = new Color(this.color); if (this.color === undefined) this.color = new Color(0xffffff); if (typeof this.emissive === 'number') this.emissive = new Color(this.emissive); if (this.emissive === undefined) this.emissive = new Color(0); } dispose() { this.disposed = true; } }
export class MeshStandardMaterial extends Material {} export class MeshToonMaterial extends Material {} export class MeshBasicMaterial extends Material {} export class LineBasicMaterial extends Material {} export class PointsMaterial extends Material {} export class SpriteMaterial extends Material {} export class ShaderMaterial extends Material {}
class Geometry { constructor() { this.attributes = {}; this.drawRange = { start: 0, count: Infinity }; } rotateX() { return this; } rotateY() { return this; } scale() { return this; } translate() { return this; } center() { return this; } dispose() { this.disposed = true; } setAttribute(n, a) { this.attributes[n] = a; return this; } setFromPoints(p) { this.points = p; return this; } setDrawRange(s, c) { this.drawRange = { start: s, count: c }; } }
export class BufferGeometry extends Geometry {} export class BoxGeometry extends Geometry {} export class SphereGeometry extends Geometry {} export class CylinderGeometry extends Geometry {} export class ConeGeometry extends Geometry {} export class CapsuleGeometry extends Geometry {} export class TorusGeometry extends Geometry {} export class PlaneGeometry extends Geometry {} export class ExtrudeGeometry extends Geometry {} export class TubeGeometry extends Geometry {} export class OctahedronGeometry extends Geometry {} export class RingGeometry extends Geometry {} export class CircleGeometry extends Geometry {} export class LatheGeometry extends Geometry {}
export class BufferAttribute { constructor(a, n) { this.array = a; this.itemSize = n; this.needsUpdate = false; } setUsage() { return this; } }
export class Shape { moveTo() {} lineTo() {} bezierCurveTo() {} quadraticCurveTo() {} closePath() {} absarc() {} absellipse() {} }
export class CatmullRomCurve3 { constructor(p) { this.p = p; } getPoint(t) { const n = this.p.length - 1, i = Math.min(n - 1, Math.floor(t * n)), k = t * n - i; return this.p[i].clone().lerp(this.p[i + 1], k); } }
export class CanvasTexture { constructor(c) { this.image = c; this.repeat = new Vector2(1, 1); this.offset = new Vector2(); this.wrapS = this.wrapT = 0; this.anisotropy = 1; this.colorSpace = ''; this.needsUpdate = false; } clone() { const t = new CanvasTexture(this.image); t.repeat.copy(this.repeat); return t; } dispose() { this.disposed = true; } }
class Light extends Object3D { constructor(c, i) { super(); this.color = new Color(c); this.intensity = i; } }
export class AmbientLight extends Light {} export class PointLight extends Light { constructor(c, i, d, decay) { super(c, i); this.distance = d; this.decay = decay; } }
export class HemisphereLight extends Light { constructor(s, g, i) { super(s, i); this.groundColor = new Color(g); } }
export class DirectionalLight extends Light { constructor(c, i) { super(c, i); this.target = new Object3D(); this.shadow = { mapSize: { set() {} }, camera: { updateProjectionMatrix() {} }, bias: 0, normalBias: 0 }; } }
export class PerspectiveCamera extends Object3D { constructor(fov, aspect, near, far) { super(); this.fov = fov; this.aspect = aspect; this.near = near; this.far = far; } }
export class OrthographicCamera extends Object3D { constructor(l, r, t, b, n, f) { super(); this.left = l; this.right = r; this.top = t; this.bottom = b; this.near = n; this.far = f; } }
export class DataTexture { constructor(d, w, h, f) { this.image = { data: d, width: w, height: h }; this.format = f; this.needsUpdate = false; } dispose() {} }
export class DepthTexture { constructor(w, h) { this.image = { width: w, height: h }; } dispose() {} }
export class WebGLRenderTarget { constructor(w, h, o = {}) { this.width = w; this.height = h; this.texture = { colorSpace: '' }; this.depthTexture = o.depthTexture || null; } dispose() {} }
export class WebGLRenderer { constructor() { this.shadowMap = {}; this.capabilities = { getMaxAnisotropy: () => 16 }; this.renders = 0; this.pixelRatio = 1; } setPixelRatio(v) { this.pixelRatio = v; } getPixelRatio() { return this.pixelRatio; } setSize() {} setRenderTarget() {} clear() {} render() { this.renders++; } }
export class Clock { constructor() { this.dt = 1 / 60; } getDelta() { return this.dt; } }
export class Fog { constructor(c, n, f) { this.color = new Color(c); this.near = n; this.far = f; } }
export const FloatType = 1015, NearestFilter = 1003, LinearFilter = 1006, RedFormat = 1028, UnsignedIntType = 1014, DepthFormat = 1026;
export const BackSide = 1, FrontSide = 0, DoubleSide = 2, AdditiveBlending = 2, NormalBlending = 1, RepeatWrapping = 1000, ClampToEdgeWrapping = 1001, SRGBColorSpace = 'srgb', PCFSoftShadowMap = 2, ACESFilmicToneMapping = 4, DynamicDrawUsage = 35048;
