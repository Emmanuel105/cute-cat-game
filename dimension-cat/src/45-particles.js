// ============================================================================
// PARTICLES — one Points cloud per system; additive colour fade to black
// ============================================================================
class Particles {
  constructor(scene, { max = 500, size = 0.16, map = null, additive = true, keep = false, sizeAttenuation = true } = {}) {
    this.max = max; this.list = []; this.scene = scene;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -9999;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.PointsMaterial({ size, map: map || TEX.glow(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, alphaTest: additive ? 0 : 0.2 });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false;
    scene.add(this.points);
    (keep ? globalBag : worldBag).track(this.geo); (keep ? globalBag : worldBag).track(this.mat);
    this.ambient = null; this.tmp = new THREE.Color();
  }
  /** Burst: emit(x,y,z,{count,color|colors,speed,up,life,gravity,spread}) */
  emit(x, y, z, o = {}) {
    const n = o.count ?? 12;
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.max) this.list.shift();
      const a = rnd() * TAU, e = rnd.range(-0.5, 1), sp = (o.speed ?? 2) * rnd.range(0.4, 1);
      const c = o.colors ? rnd.pick(o.colors) : (o.color ?? 0xffffff);
      this.tmp.set(c);
      this.list.push({ x: x + rnd.range(-1, 1) * (o.spread ?? 0.1), y: y + rnd.range(-1, 1) * (o.spread ?? 0.1), z: z + rnd.range(-1, 1) * (o.spread ?? 0.1),
        vx: cos(a) * sp * (1 - abs(e) * 0.5), vy: (o.up ?? 1.5) * rnd.range(0.3, 1) + e * sp * 0.3, vz: sin(a) * sp * (1 - abs(e) * 0.5),
        life: (o.life ?? 0.9) * rnd.range(0.6, 1.2), max: 1, r: this.tmp.r, g: this.tmp.g, b: this.tmp.b, grav: o.gravity ?? 3, drag: o.drag ?? 1.2 });
      const p = this.list[this.list.length - 1]; p.max = p.life;
    }
  }
  /** Continuous ambience around a moving centre: {count, radius, colors, rise, drift, life, height} */
  setAmbient(o) { this.ambient = o; }
  update(dt, center) {
    const amb = this.ambient;
    if (amb && center) {
      while (this.list.length < amb.count) {
        this.tmp.set(rnd.pick(amb.colors));
        const a = rnd() * TAU, r = sqrt(rnd()) * amb.radius, life = (amb.life ?? 4) * rnd.range(0.5, 1.5);
        this.list.push({ x: center.x + cos(a) * r, y: (amb.yMin ?? 0.2) + rnd() * (amb.height ?? 3), z: center.z + sin(a) * r,
          vx: rnd.range(-1, 1) * (amb.drift ?? 0.3), vy: amb.rise ?? 0.15, vz: rnd.range(-1, 1) * (amb.drift ?? 0.3),
          life, max: life, r: this.tmp.r, g: this.tmp.g, b: this.tmp.b, grav: 0, drag: 0, amb: true, ph: rnd() * TAU });
      }
    }
    let i = 0;
    for (let k = this.list.length - 1; k >= 0; k--) {
      const p = this.list[k];
      p.life -= dt;
      if (p.life <= 0 || (p.amb && center && dist2(p.x, p.z, center.x, center.z) > (amb.radius + 4) ** 2)) { this.list.splice(k, 1); continue; }
      if (p.amb) { p.ph += dt; p.vx += sin(p.ph * 1.3) * dt * 0.4; p.vz += cos(p.ph * 1.1) * dt * 0.4; }
      p.vy -= p.grav * dt; const dr = 1 - p.drag * dt; p.vx *= dr; p.vz *= dr;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const t = p.life / p.max, f = p.amb ? sin(t * PI) : min(1, t * 2.2);
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
      this.col[i * 3] = p.r * f; this.col[i * 3 + 1] = p.g * f; this.col[i * 3 + 2] = p.b * f;
      i++;
    }
    for (let k = i; k < this.max; k++) this.pos[k * 3 + 1] = -9999;
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
    this.geo.setDrawRange(0, max(i, 1));
  }
  clear() { this.list.length = 0; this.ambient = null; }
  destroy() { this.scene.remove(this.points); }
}
