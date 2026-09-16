// ============================================================================
// LIGHT POOL — a world wants hundreds of glowing things (lamps, campfires, ice
// crystals, fairies, gems), but every light the renderer knows about is paid
// for by every lit pixel. So props register a *wish* for light, and a small
// fixed pool of real point lights follows the camera, lighting the nearest few.
// The count of real lights never changes, so the shaders are never recompiled.
// ============================================================================
let LIGHTS = null;

class LightPool {
  constructor(scene, count = 10) {
    this.scene = scene;
    this.wishes = [];
    this.free = [];
    this.frame = 0;
    for (let i = 0; i < count; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 2);
      l.position.set(0, -4000, 0);
      scene.add(l);
      this.free.push(l);
    }
    this.all = [...this.free];
    this.tmp = new THREE.Vector3();
  }
  /** Hands every real light back to the scene and forgets the old world's wishes. */
  reset() {
    for (const w of this.wishes) w.light = null;
    this.wishes.length = 0;
    this.free = [...this.all];
    for (const l of this.all) { l.intensity = 0; this.scene.add(l); l.position.set(0, -4000, 0); }
  }
  /**
   * Registers a light at (x,y,z) inside `parent`. The returned object looks enough like a
   * THREE.PointLight for prop update loops to keep animating `.intensity` and `.color`.
   */
  add(color, intensity, distance, x, y, z, parent) {
    const anchor = new THREE.Object3D();
    anchor.position.set(x, y, z);
    (parent || this.scene).add(anchor);
    const w = { anchor, color: new THREE.Color(color), intensity, distance, light: null };
    this.wishes.push(w);
    return w;
  }
  update(camera) {
    const N = this.all.length;
    if (this.wishes.length === 0) return;
    // Re-rank now and then: sorting a few hundred wishes every frame would cost more than the lights.
    if (this.frame++ % 8 === 0) {
      const cam = camera.position;
      for (const w of this.wishes) {
        w.anchor.getWorldPosition(this.tmp);
        const dx = this.tmp.x - cam.x, dy = this.tmp.y - cam.y, dz = this.tmp.z - cam.z;
        w.d2 = dx * dx + dy * dy + dz * dz;
        // a light nobody can see is not worth a slot
        if (w.intensity <= 0.01 || w.d2 > (w.distance + 26) * (w.distance + 26)) w.d2 = Infinity;
      }
      const ranked = this.wishes.slice().sort((a, b) => a.d2 - b.d2);
      const wanted = new Set();
      for (let i = 0; i < N && i < ranked.length; i++) if (ranked[i].d2 < Infinity) wanted.add(ranked[i]);
      for (const w of this.wishes) {
        if (w.light && !wanted.has(w)) { w.light.intensity = 0; this.scene.add(w.light); w.light.position.set(0, -4000, 0); this.free.push(w.light); w.light = null; }
      }
      for (const w of wanted) {
        if (w.light || !this.free.length) continue;
        w.light = this.free.pop();
        w.anchor.add(w.light);
        w.light.position.set(0, 0, 0);
      }
    }
    for (const w of this.wishes) {
      if (!w.light) continue;
      w.light.color.copy(w.color);
      w.light.intensity = w.intensity;
      w.light.distance = w.distance;
    }
  }
}
