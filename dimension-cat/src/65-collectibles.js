// ============================================================================
// COLLECTIBLES — fish, yarn, mouse, star: distinct models that bob, spin and
// can actually be picked up (particles, chime, score)
// ============================================================================
const COLLECTIBLE = {
  fish: { score: 100, color: 0x7fd7ff, make() {
    const g = new THREE.Group(), body = mat(0x6cc4f2, { roughness: 0.35, metalness: 0.3, emissive: 0x1a5aa0, emissiveIntensity: 0.15 }), fin = mat(0x3f8fd0, { roughness: 0.5, side: THREE.DoubleSide });
    mesh(G.bodySphere(14, 10), body, { sx: 0.11, sy: 0.15, sz: 0.24, parent: g });
    mesh(G.bodySphere(14, 10), mat(0xd8f1ff, { roughness: 0.5 }), { y: -0.04, sx: 0.09, sy: 0.09, sz: 0.2, shadow: 'none', parent: g });
    mesh(G.cone(0.11, 0.16, 3), fin, { z: -0.3, rx: -PI / 2, sx: 0.4, parent: g });
    mesh(G.cone(0.07, 0.1, 3), fin, { y: 0.16, z: -0.02, rz: PI, sx: 0.3, shadow: 'none', parent: g });
    for (const s of [1, -1]) { mesh(G.sphere(0.03, 8, 6), mat(0x111111), { x: s * 0.085, y: 0.04, z: 0.14, shadow: 'none', parent: g }); mesh(G.cone(0.05, 0.08, 3), fin, { x: s * 0.11, y: -0.04, z: 0.04, rz: s * 1.3, sx: 0.3, shadow: 'none', parent: g }); }
    return g; } },
  yarn: { score: 100, color: 0xff5c8a, make() {
    const g = new THREE.Group(), m = mat(0xff3d7a, { roughness: 0.95 });
    mesh(G.sphere(0.17, 16, 12), m, { parent: g });
    for (let i = 0; i < 4; i++) mesh(G.torus(0.165, 0.02, 6, 32), m, { rx: i * 0.75, ry: i * 1.1, shadow: 'none', parent: g });
    const thread = new THREE.CatmullRomCurve3([V3(0.12, -0.1, 0.1), V3(0.25, -0.16, 0.15), V3(0.3, -0.17, 0.3), V3(0.2, -0.17, 0.42)]);
    const tg = new THREE.TubeGeometry(thread, 12, 0.014, 6, false); worldBag.track(tg); g.add(new THREE.Mesh(tg, m));
    return g; } },
  mouse: { score: 150, color: 0xd0d0d0, make() {
    const g = new THREE.Group(), fur = mat(0x9a9a9a, { roughness: 0.95 }), pink = mat(0xffb3c1, { roughness: 0.8 });
    mesh(G.bodySphere(14, 10), fur, { sx: 0.1, sy: 0.1, sz: 0.16, parent: g });
    mesh(G.sphere(0.07, 12, 9), fur, { y: 0.02, z: 0.14, sz: 1.2, parent: g });
    mesh(G.sphere(0.02, 8, 6), pink, { y: 0.0, z: 0.22, shadow: 'none', parent: g });
    for (const s of [1, -1]) { mesh(G.sphere(0.045, 10, 8), fur, { x: s * 0.06, y: 0.08, z: 0.1, sz: 0.4, parent: g }); mesh(G.sphere(0.03, 8, 6), pink, { x: s * 0.06, y: 0.08, z: 0.115, sz: 0.3, shadow: 'none', parent: g }); mesh(G.sphere(0.014, 6, 6), mat(0x111111), { x: s * 0.035, y: 0.04, z: 0.19, shadow: 'none', parent: g }); }
    const tail = new THREE.CatmullRomCurve3([V3(0, -0.02, -0.14), V3(0.06, -0.03, -0.24), V3(0.02, -0.02, -0.34), V3(-0.08, -0.03, -0.4)]);
    const tg = new THREE.TubeGeometry(tail, 12, 0.012, 6, false); worldBag.track(tg); g.add(new THREE.Mesh(tg, pink));
    return g; } },
  star: { score: 250, color: 0xffd54a, make() {
    const g = new THREE.Group();
    mesh(G.star(0.22, 0.1, 0.07), mat(0xffd54a, { roughness: 0.25, metalness: 0.6, emissive: 0xffa000, emissiveIntensity: 0.7 }), { parent: g });
    glowSprite(0xffd54a, 1.1, 0.45, g);
    return g; } },
};

class Collectibles {
  constructor(game) { this.game = game; this.items = []; this.total = 0; }
  add(type, x, z, y = null) {
    const id = `${this.game.worldIndex}:${type}:${x},${z}`;
    this.total++;
    if (this.game.state.collected.has(id)) return;
    const def = COLLECTIBLE[type], g = def.make();
    const base = (y ?? this.game.physics.ground0(x, z)) + 0.28;
    g.position.set(x, base, z); g.userData.spin = rnd() * TAU;
    this.game.world.add(g);
    this.items.push({ id, type, def, g, x, z, base, ph: rnd() * TAU });
  }
  get collectedHere() { return this.total - this.items.length; }
  update(dt, t) {
    const c = this.game.cat.group.position;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.g.position.y = it.base + sin(t * 2.2 + it.ph) * 0.07;
      it.g.rotation.y = t * 1.4 + it.ph;
      if (dist2(c.x, c.z, it.x, it.z) < 0.62 * 0.62 && abs(c.y - (it.base - 0.28)) < 0.7) this.collect(i);
    }
  }
  collect(i) {
    const it = this.items.splice(i, 1)[0], g = this.game;
    g.state.collected.add(it.id); g.world.remove(it.g);
    g.fx.emit(it.x, it.base + 0.1, it.z, { count: it.type === 'star' ? 40 : 22, colors: [it.def.color, 0xffffff, 0xffe082], speed: 2.4, up: 2.2, life: 0.9, gravity: 4 });
    it.type === 'star' ? SFX.star() : SFX.pickup();
    g.addScore(it.def.score);
    g.toast({ fish: '🐟 Fresh fish! +100', yarn: '🧶 Yarn ball! +100', mouse: '🐭 Toy mouse! +150', star: '⭐ Star! +250' }[it.type]);
    g.updateHud(); g.save();
  }
}
