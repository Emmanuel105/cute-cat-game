// ============================================================================
// PROPS II — terrain, water, and the set pieces for the shore, peak and woods
// ============================================================================

// ---------------------------------------------------------------- terrain + water
/** Rolling ground: displaces a plane by fn(x,z) and registers fn as the physics ground. */
function makeTerrain(game, fn, material, size = 400, segs = 160) {
  const geo = new THREE.PlaneGeometry(size, size, segs, segs); worldBag.track(geo);
  geo.rotateX(-PI / 2);
  const pos = geo.attributes.position;
  if (pos && pos.array) {
    for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 1] = fn(pos.array[i * 3], pos.array[i * 3 + 2]);
    pos.needsUpdate = true; geo.computeVertexNormals();
  }
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true; m.castShadow = false; game.world.add(m);
  game.physics.terrain = fn;
  return m;
}
/** Smooth 2D value noise (deterministic, cheap) for terrain shaping. */
function bumps(x, z, s = 0.08) {
  return sin(x * s) * cos(z * s * 1.3) * 0.5 + sin(x * s * 2.1 + 1.7) * sin(z * s * 1.7 + 0.4) * 0.3 + cos((x + z) * s * 3.3) * 0.2;
}
/** Ground-following placement helpers. */
function placeT(game, U, obj, x, z, ry = 0, dy = 0) { return place(game, U, obj, x, z, ry, game.physics.ground0(x, z) + dy); }
function boxT(game, x, z, w, h, d, opts) { const y = game.physics.ground0(x, z); return game.physics.addBox(x, y + h / 2, z, w, h, d, opts); }

/** Animated sea: waves in the vertex shader, scrolling texture, foam edge. Returns { mesh, update }. */
function makeSea(game, { x = 0, z = 0, w = 400, d = 400, level = 0, color = 0x2f9fd6, deep = 0x1b6fa8, opacity = 0.86 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, 90, 90); worldBag.track(geo); geo.rotateX(-PI / 2);
  const wmap = TEX.water().clone(); wmap.needsUpdate = true; worldBag.track(wmap);
  const m = mat(color, { roughness: 0.18, metalness: 0.05, transparent: true, opacity, map: wmap, emissive: deep, emissiveIntensity: 0.18 });
  const uTime = { value: 0 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'uniform float uTime;\nfloat waveH(vec2 p){ return sin(p.x*0.35 + uTime*1.4)*0.11 + sin(p.y*0.5 - uTime*1.1)*0.08 + sin((p.x+p.y)*0.22 + uTime*0.7)*0.06; }\nvoid main() {')
      .replace('#include <beginnormal_vertex>', 'float _e = 0.5; vec2 _p = position.xz; float _h = waveH(_p);\nvec3 objectNormal = normalize(vec3(_h - waveH(_p + vec2(_e, 0.0)), _e, _h - waveH(_p + vec2(0.0, _e))));\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif')
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position); transformed.y += waveH(position.xz);');
  };
  const sea = new THREE.Mesh(geo, m); sea.position.set(x, level, z); sea.receiveShadow = true; game.world.add(sea);
  const update = (dt, t) => { uTime.value = t; m.map.offset.x = t * 0.012; m.map.offset.y = t * 0.008; };
  return { mesh: sea, update };
}

// ---------------------------------------------------------------- shore
function makePalm(r = rnd, h = 4.5) {
  const g = new THREE.Group(), trunk = mat(0x8a6a44, { roughness: 1, map: TEX.bark() }), frond = mat(0x2f8a3a, { roughness: 0.9, side: THREE.DoubleSide }), nut = mat(0x6b4a2a, { roughness: 1 });
  const lean = r.range(-0.18, 0.18), segs = 4;
  let x = 0, y = 0;
  for (let i = 0; i < segs; i++) { const sh = h / segs; mesh(G.cyl(0.13 - i * 0.012, 0.16 - i * 0.012, sh + 0.08, 8), trunk, { x, y: y + sh / 2, rz: lean, parent: g }); x -= sin(lean) * sh; y += cos(lean) * sh; }
  const crown = group(x, y, 0, g);
  const n = r.int(6, 7);
  for (let i = 0; i < n; i++) { const a = i / n * TAU; const f = group(0, 0, 0, crown); f.rotation.y = a; f.rotation.x = 0.35 + r.range(-0.1, 0.15);
    const leaf = mesh(G.box(0.5, 0.03, 2.4), frond, { z: 1.15, rx: 0.35, shadow: 'cast', parent: f }); leaf.userData.base = f.rotation.x; f.userData.leaf = f; }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; mesh(G.sphere(0.14, 8, 6), nut, { x: cos(a) * 0.2, y: -0.15, z: sin(a) * 0.2, parent: crown }); }
  g.userData.crown = crown; g.userData.col = [0.5, h];
  g.userData.update = (dt, t) => { const s = sin(t * 1.1 + x * 3) * 0.06; crown.rotation.z = s; crown.rotation.x = cos(t * 0.9) * 0.04; };
  g.rotation.y = r() * TAU;
  return g;
}
function makeBeachHut(color = 0xff8a65, r = rnd) {
  const g = new THREE.Group(), wall = mat(color, { roughness: 0.9 }), trim = mat(0xfff5e6, { roughness: 0.8 }), roof = mat(0xfff5e6, { roughness: 0.9 }), stripe = mat(0x2f6fd6, { roughness: 0.9 });
  mesh(G.box(2.6, 2.4, 2.4), wall, { y: 1.3, shadow: 'both', parent: g });
  for (let i = 0; i < 3; i++) mesh(G.box(0.36, 2.4, 0.02), trim, { x: -0.9 + i * 0.9, y: 1.3, z: 1.21, shadow: 'none', parent: g });
  mesh(G.gable(2.8, 1.2, 3.0), roof, { y: 2.4, ry: PI / 2, parent: g });
  mesh(G.box(0.8, 1.6, 0.06), stripe, { y: 0.85, z: 1.24, parent: g });
  mesh(G.box(3.0, 0.14, 1.2), mat(0xd9b98a, { roughness: 1, map: TEX.planks(30, 50) }), { y: 0.07, z: 1.8, shadow: 'receive', parent: g });
  mesh(G.box(0.7, 0.5, 0.08), trim, { x: 0.8, y: 1.7, z: 1.23, shadow: 'none', parent: g });
  return g;
}
function makeLighthouse(game, x, z) {
  const g = group(x, 0, z, game.world), white = mat(0xf7f7f2, { roughness: 0.7 }), red = mat(0xd62839, { roughness: 0.6 }), dark = mat(0x2b2f36, { metalness: 0.5, roughness: 0.5 });
  for (let i = 0; i < 6; i++) mesh(G.cyl(1.35 - i * 0.12, 1.5 - i * 0.12, 1.6, 18), i % 2 ? red : white, { y: 0.8 + i * 1.6, shadow: 'both', parent: g });
  mesh(G.cyl(1.1, 0.9, 0.4, 18), dark, { y: 9.8, parent: g });
  mesh(G.cyl(0.7, 0.7, 1.1, 14), mat(0xffe8a0, { roughness: 0.1, transparent: true, opacity: 0.55, emissive: 0xffd77a, emissiveIntensity: 1.6 }), { y: 10.55, shadow: 'none', parent: g });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; mesh(G.box(0.06, 1.1, 0.06), dark, { x: cos(a) * 0.72, y: 10.55, z: sin(a) * 0.72, shadow: 'none', parent: g }); }
  mesh(G.cone(0.95, 0.9, 14), red, { y: 11.55, parent: g }); mesh(G.sphere(0.12, 8, 6), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { y: 12.1, shadow: 'none', parent: g });
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); worldBag.track(beamM);
  const pivot = group(0, 10.55, 0, g);
  const beamGeo = new THREE.ConeGeometry(2.2, 46, 12, 1, true); worldBag.track(beamGeo);
  const beam = mesh(beamGeo, beamM, { z: 23, rx: -PI / 2, shadow: 'none', parent: pivot });
  glowSprite(0xffe8a0, 5, 0.55, g).position.y = 10.6;
  const light = pointLight(0xffe8a0, 40, 40, 0, 10.6, 0, g);
  game.physics.addBox(x, 5, z, 3, 10, 3);
  g.userData.update = (dt, t) => { pivot.rotation.y = t * 0.6; light.intensity = 32 + sin(t * 3) * 6; beam.material.opacity = 0.12 + sin(t * 1.2) * 0.03; };
  return g;
}
function makePier(game, x, z, len, ry = 0) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const wood = mat(0xb08a5a, { roughness: 0.95, map: TEX.planks(30, 44) }), post = mat(0x6b4a2a, { roughness: 1 });
  mesh(G.box(3.2, 0.2, len), wood, { y: 0.5, z: len / 2, shadow: 'both', parent: g });
  for (let i = 0; i <= len; i += 2.4) for (const s of [-1, 1]) { mesh(G.cyl(0.11, 0.13, 1.6, 8), post, { x: s * 1.45, y: 0.1, z: i, parent: g }); mesh(G.cyl(0.05, 0.05, 1.0, 6), post, { x: s * 1.45, y: 1.1, z: i, parent: g }); }
  for (const s of [-1, 1]) mesh(G.box(0.08, 0.08, len), post, { x: s * 1.45, y: 1.55, z: len / 2, shadow: 'none', parent: g });
  const c = cos(ry), s = sin(ry), cx = x + s * len / 2, cz = z + c * len / 2;
  game.physics.addBox(cx, 0.3, cz, abs(c) * 3.2 + abs(s) * len, 0.6, abs(s) * 3.2 + abs(c) * len, { cam: false });
  for (const sd of [-1, 1]) game.physics.addBox(cx + c * sd * 1.55, 1.1, cz - s * sd * 1.55, abs(c) * 0.2 + abs(s) * len, 1.0, abs(s) * 0.2 + abs(c) * len, { cam: false, walk: false });
  return g;
}
function makeUmbrella(hue = 0) {
  const g = new THREE.Group(), pole = mat(0xf0f0f0, { roughness: 0.5 }), canopyA = mat(new THREE.Color().setHSL(hue / 360, 0.85, 0.55), { roughness: 0.8, side: THREE.DoubleSide }), canopyB = mat(0xffffff, { roughness: 0.8, side: THREE.DoubleSide });
  mesh(G.cyl(0.03, 0.03, 2.2, 6), pole, { y: 1.1, rz: 0.12, parent: g });
  const top = group(-0.13, 2.15, 0, g); top.rotation.z = 0.12;
  for (let i = 0; i < 8; i++) { const wedge = new THREE.ConeGeometry(1.2, 0.5, 3, 1, true, i * PI / 4, PI / 4); worldBag.track(wedge); mesh(wedge, i % 2 ? canopyA : canopyB, { y: 0, parent: top }); }
  mesh(G.sphere(0.06, 8, 6), pole, { y: 0.28, shadow: 'none', parent: top });
  return g;
}
function makeTowel(color) { const g = new THREE.Group(); mesh(G.box(1.0, 0.03, 1.8), mat(color, { roughness: 1 }), { y: 0.015, shadow: 'receive', parent: g }); for (let i = 0; i < 4; i++) mesh(G.box(1.0, 0.032, 0.12), mat(0xffffff, { roughness: 1 }), { y: 0.016, z: -0.7 + i * 0.47, shadow: 'none', parent: g }); return g; }
function makeSandcastle() {
  const g = new THREE.Group(), sand = mat(0xdcbf85, { roughness: 1, map: TEX.sand().clone() }); sand.map.needsUpdate = true; sand.map.repeat.set(1, 1); worldBag.track(sand.map);
  mesh(G.box(1.6, 0.5, 1.6), sand, { y: 0.25, parent: g });
  for (const [x, z] of [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) { mesh(G.cyl(0.25, 0.28, 0.9, 10), sand, { x, y: 0.45, z, parent: g }); mesh(G.cone(0.3, 0.35, 10), sand, { x, y: 1.05, z, parent: g }); }
  mesh(G.cyl(0.3, 0.32, 1.1, 10), sand, { y: 0.55, parent: g }); mesh(G.cone(0.34, 0.4, 10), mat(0xd62839, { roughness: 0.9 }), { y: 1.3, parent: g });
  mesh(G.box(0.02, 0.2, 0.3), mat(0xffd54a), { x: 0.16, y: 1.6, parent: g }); mesh(G.cyl(0.012, 0.012, 0.5, 4), mat(0x3a2a1a), { y: 1.55, parent: g });
  return g;
}
function makeBuoy(color = 0xd62839) {
  const g = new THREE.Group();
  mesh(G.cyl(0.35, 0.45, 0.5, 12), mat(color, { roughness: 0.5 }), { y: 0.2, parent: g }); mesh(G.cyl(0.45, 0.45, 0.1, 12), mat(0xffffff, { roughness: 0.5 }), { y: 0.5, parent: g });
  mesh(G.cyl(0.06, 0.06, 0.8, 6), mat(0x2b2f36), { y: 0.9, parent: g }); mesh(G.sphere(0.1, 8, 6), glowMat(0xffd54a, 1.5), { y: 1.35, shadow: 'none', parent: g });
  g.userData.update = (dt, t) => { g.position.y = g.userData.y0 + sin(t * 1.4 + g.position.x) * 0.12; g.rotation.x = sin(t * 1.1) * 0.08; g.rotation.z = cos(t * 0.9) * 0.08; };
  return g;
}
function makeBoat(color = 0x3f6fd6) {
  const g = new THREE.Group(), hull = mat(color, { roughness: 0.6 }), wood = mat(0xd9b98a, { roughness: 0.9, map: TEX.planks(30, 50) });
  mesh(G.bodySphere(16, 8), hull, { y: 0.2, sx: 0.8, sy: 0.45, sz: 1.9, parent: g });
  mesh(G.bodySphere(16, 8), wood, { y: 0.3, sx: 0.62, sy: 0.3, sz: 1.7, shadow: 'none', parent: g });
  for (let i = 0; i < 3; i++) mesh(G.box(1.2, 0.06, 0.2), wood, { y: 0.5, z: -0.9 + i * 0.9, parent: g });
  mesh(G.cyl(0.04, 0.04, 2.6, 6), wood, { y: 1.5, parent: g });
  const sail = mesh(G.plane(1.3, 1.8), mat(0xfff8e6, { roughness: 0.9, side: THREE.DoubleSide }), { x: 0.66, y: 1.8, shadow: 'cast', parent: g });
  g.userData.update = (dt, t) => { g.position.y = g.userData.y0 + sin(t * 1.2) * 0.08; g.rotation.z = sin(t * 0.9) * 0.06; g.rotation.x = cos(t * 0.7) * 0.03; sail.rotation.y = sin(t * 0.6) * 0.12; };
  return g;
}
function makeRock(r = rnd, color = 0x7d7a72, s = 1) {
  const g = new THREE.Group(), m = mat(color, { roughness: 1, flatShading: true });
  const n = r.int(2, 4); for (let i = 0; i < n; i++) mesh(G.sphere(1, 7, 5), m, { x: r.range(-0.4, 0.4) * s, y: r.range(0.1, 0.4) * s, z: r.range(-0.4, 0.4) * s, sx: r.range(0.5, 0.9) * s, sy: r.range(0.35, 0.7) * s, sz: r.range(0.5, 0.9) * s, ry: r() * TAU, parent: g });
  return g;
}
/** Instanced shells / pebbles scattered on the ground. spots = [[x,z,radius,count]] */
function makeScatter(game, spots, geo, colors, r, scale = [0.6, 1.2], yOff = 0.02) {
  const pts = scatterPoints(game, spots, r, 0.3), total = pts.length;
  if (!total) return null;
  const im = new THREE.InstancedMesh(geo, mat(0xffffff, { roughness: 0.7, side: THREE.DoubleSide }), total);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), C = new THREE.Color(), E = new THREE.Euler();
  let i = 0;
  for (const [x, z] of pts) {
    const s = r.range(...scale);
    Q.setFromEuler(E.set(0, r() * TAU, 0));
    M.compose(Pv.set(x, game.physics.ground0(x, z) + yOff * s, z), Q, S.set(s, s, s)); im.setMatrixAt(i, M);
    im.setColorAt(i, C.set(r.pick(colors)));
    i++;
  }
  im.instanceColor.needsUpdate = true; im.castShadow = false; im.receiveShadow = true; game.world.add(im); worldBag.track(im);
  return im;
}

// ---------------------------------------------------------------- hub portals (neighborhood → new worlds) + signpost
/** Signpost at (x,z). entries = [[text, targetX, targetZ]]: every arm is rotated to point at its target. */
function makeSignpost(entries, x = 0, z = 0) {
  const g = new THREE.Group(), wood = mat(0x8a5a32, { roughness: 0.9, map: TEX.planks(28, 32) }), dark = mat(0x5a3a1f, { roughness: 1 });
  mesh(G.cyl(0.07, 0.09, 2.6, 8), dark, { y: 1.3, parent: g });
  mesh(G.cyl(0.11, 0.11, 0.06, 8), dark, { y: 2.62, parent: g }); mesh(G.sphere(0.07, 8, 6), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { y: 2.7, parent: g });
  entries.forEach(([text, tx, tz], i) => {
    const arm = group(0, 2.3 - i * 0.42, 0, g); arm.rotation.y = atan2(-(tz - z), tx - x);   // local +x → world (cos ry, -sin ry)
    mesh(G.box(1.4, 0.3, 0.06), wood, { x: 0.6, parent: arm }); mesh(G.cone(0.15, 0.2, 4), wood, { x: 1.4, ry: PI / 4, rz: -PI / 2, shadow: 'none', parent: arm });
    const label = new THREE.Mesh(G.plane(1.3, 0.3), new THREE.MeshBasicMaterial({ map: TEX.signText(text), transparent: true })); worldBag.track(label.material); label.position.set(0.6, 0, 0.035); arm.add(label);
    const label2 = new THREE.Mesh(G.plane(1.3, 0.3), new THREE.MeshBasicMaterial({ map: TEX.signText(text), transparent: true })); worldBag.track(label2.material); label2.position.set(0.6, 0, -0.035); label2.rotation.y = PI; arm.add(label2);
  });
  return g;
}
/** Local (lx,lz) of a group at (x,z) rotated by ry → world (x,z). */
function localXZ(x, z, lx, lz, ry) { return [x + lx * cos(ry) + lz * sin(ry), z - lx * sin(ry) + lz * cos(ry)]; }
function hubPrompt(game, g, x, z, label, onEnter, color, r = 2.6) {
  game.addInteractable({ obj: g, radius: r, label: () => label, onUse: onEnter });
  g.userData.light = pointLight(color, 10, 8, 0, 1.6, 0, g);
}
/** Boardwalk arch with surfboards and a "SUNNY SHORE" sign. */
function makeBeachGate(game, x, z, ry, onEnter) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const wood = mat(0xd9b98a, { roughness: 0.9, map: TEX.planks(30, 50) }), post = mat(0x8a6a44, { roughness: 1 });
  for (const s of [-1, 1]) mesh(G.cyl(0.14, 0.16, 3.4, 8), post, { x: s * 1.6, y: 1.7, parent: g });
  mesh(G.box(4.0, 0.5, 0.2), wood, { y: 3.3, parent: g });
  const label = new THREE.Mesh(G.plane(3.6, 0.4), new THREE.MeshBasicMaterial({ map: TEX.signText('SUNNY SHORE  →', '#1d5a7a'), transparent: true })); worldBag.track(label.material); label.position.set(0, 3.3, 0.11); g.add(label);
  const label2 = label.clone(); label2.position.z = -0.11; label2.rotation.y = PI; g.add(label2);
  for (const [s, hue] of [[-1, 190], [1, 45]]) { const b = mesh(G.capsule(0.28, 1.4, 10), mat(new THREE.Color().setHSL(hue / 360, 0.8, 0.6), { roughness: 0.4 }), { x: s * 2.0, y: 1.05, z: 0.1, sz: 0.25, rz: s * 0.2, parent: g }); mesh(G.box(0.08, 1.6, 0.03), mat(0xffffff), { z: 0.07, shadow: 'none', parent: b }); }
  mesh(G.box(3.2, 0.12, 2.4), wood, { y: 0.06, shadow: 'receive', parent: g });
  const swirl = mesh(G.torus(1.05, 0.05, 8, 40), glowMat(0x4fd0ff, 1.8), { y: 1.7, shadow: 'none', parent: g });
  const core = mesh(G.cyl(1.0, 1.0, 0.04, 40), basic(0x7fe0ff, { transparent: true, opacity: 0.2, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), { y: 1.7, rx: PI / 2, shadow: 'none', parent: g });
  glowSprite(0x7fe0ff, 3.6, 0.4, g).position.y = 1.7;
  for (const s of [-1, 1]) { const [px, pz] = localXZ(x, z, s * 1.6, 0, ry); game.physics.addBox(px, 1.7, pz, 0.5, 3.4, 0.5); }
  g.userData.update = (dt, t) => { swirl.rotation.x = sin(t * 0.8) * 0.4; swirl.rotation.y = t * 0.7; core.material.opacity = 0.16 + sin(t * 2.5) * 0.06; };
  hubPrompt(game, g, x, z, 'Walk to the Sunny Shore', onEnter, 0x7fe0ff);
  return g;
}
/** Gondola station: a stone platform with steps, a timber-and-steel shelter, lanterns and bunting, a cable up into the sky with cabins travelling both ways, and the waiting cabin you board. */
function makeGondolaStation(game, x, z, ry, onEnter, prompt = 'Ride the gondola to Frosty Peak', sign = 'FROSTY PEAK  ↑') {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const steel = mat(0x5a6470, { metalness: 0.8, roughness: 0.4 }), red = mat(0xd62839, { roughness: 0.5, metalness: 0.2 }), glass = mat(0xbfe7ff, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.5 });
  const stone = mat(0x8e8b84, { roughness: 1, map: TEX.stone(30) }), timber = mat(0x6b4a2a, { roughness: 0.95, map: TEX.planks(26, 30) });
  mesh(G.box(6.4, 0.5, 4.6), stone, { y: 0.25, shadow: 'both', parent: g });
  for (let i = 0; i < 3; i++) mesh(G.box(3.0, 0.16, 0.5), stone, { y: 0.08 + i * 0.16, z: 2.3 + (2 - i) * 0.5 + 0.25, shadow: 'receive', parent: g });    // steps down the front
  for (const [sx, sz] of [[-2.6, -1.8], [2.6, -1.8], [-2.6, 1.8], [2.6, 1.8]]) { mesh(G.cyl(0.11, 0.13, 4.4, 8), timber, { x: sx, y: 2.7, z: sz, parent: g }); mesh(G.box(0.5, 0.2, 0.5), stone, { x: sx, y: 0.6, z: sz, parent: g }); }
  mesh(G.box(6.8, 0.22, 5.0), timber, { y: 4.9, parent: g }); mesh(G.gable(5.4, 1.4, 7.2), red, { y: 5.0, ry: PI / 2, parent: g }); mesh(G.gable(5.5, 1.45, 7.3), mat(0xf4f7fb, { roughness: 0.95 }), { y: 5.12, ry: PI / 2, shadow: 'none', parent: g });
  for (const sx of [-2.6, 2.6]) { const lamp = mesh(G.box(0.3, 0.4, 0.3), mat(0xffe6a8, { emissive: 0xffc46a, emissiveIntensity: 1.6 }), { x: sx, y: 3.4, z: 1.8, shadow: 'none', parent: g }); glowSprite(0xffb85a, 1.6, 0.4, lamp); pointLight(0xffb060, 8, 8, sx, 3.4, 2.2, g); }
  for (let i = 0; i < 12; i++) mesh(G.cone(0.14, 0.3, 3), mat([0xd62839, 0x2f6fd6, 0xffd54a, 0x2e9e6e][i % 4], { roughness: 0.9, side: THREE.DoubleSide }), { x: -2.4 + i * 0.44, y: 4.55, z: 1.85, rx: PI, shadow: 'none', parent: g });   // bunting
  mesh(G.box(1.6, 0.06, 0.5), timber, { x: -1.6, y: 0.95, z: -1.4, parent: g }); for (const bx of [-2.3, -0.9]) mesh(G.box(0.08, 0.45, 0.45), steel, { x: bx, y: 0.72, z: -1.4, parent: g });   // bench
  mesh(G.cyl(0.14, 0.14, 3.0, 8), steel, { y: 4.0, z: -0.8, rx: PI / 2, parent: g }); mesh(G.cyl(0.6, 0.6, 0.24, 18), steel, { y: 4.0, z: -0.8, rz: PI / 2, parent: g });   // drive wheel
  // cable up into the sky with two cabins riding it
  const cableLen = 110, pitch = 0.47;
  const cableG = group(0, 4.0, -0.8, g); cableG.rotation.x = -pitch;
  for (const sx of [-0.35, 0.35]) mesh(G.cyl(0.028, 0.028, cableLen, 5), mat(0x2b2f36, { metalness: 0.7, roughness: 0.5 }), { x: sx, z: -cableLen / 2, rx: PI / 2, parent: cableG });
  const riders = [0.18, 0.62].map((k, i) => { const c = group(0, 0, 0, cableG); mesh(G.cyl(0.03, 0.03, 1.0, 6), steel, { y: -0.5, parent: c }); mesh(G.box(1.3, 1.2, 1.3), i ? mat(0x2f6fd6, { roughness: 0.5, metalness: 0.2 }) : red, { y: -1.6, parent: c }); mesh(G.box(1.32, 0.5, 1.32), glass, { y: -1.45, shadow: 'none', parent: c }); c.userData.k = k; c.userData.dir = i ? -1 : 1; return c; });
  // waiting cabin
  const cabin = group(0, 2.4, 0.4, g);
  mesh(G.box(1.6, 1.5, 1.6), red, { y: 0.75, parent: cabin }); mesh(G.box(1.62, 0.64, 1.62), glass, { y: 0.9, shadow: 'none', parent: cabin });
  mesh(G.cyl(0.04, 0.04, 1.2, 6), steel, { y: 1.9, parent: cabin }); mesh(G.box(0.4, 0.2, 0.3), steel, { y: 2.5, parent: cabin });
  mesh(G.box(0.3, 0.8, 0.02), mat(0xd4af37, { metalness: 0.8, roughness: 0.3 }), { x: 0.3, y: 0.7, z: 0.81, shadow: 'none', parent: cabin });
  const label = new THREE.Mesh(G.plane(3.4, 0.4), new THREE.MeshBasicMaterial({ map: TEX.signText(sign, '#ffffff'), transparent: true })); worldBag.track(label.material); label.position.set(0, 5.45, 2.6); g.add(label);
  const label2 = label.clone(); label2.position.z = -2.6; label2.rotation.y = PI; g.add(label2);
  const swirl = mesh(G.torus(0.6, 0.04, 8, 32), glowMat(0x9fe8ff, 1.8), { y: 0.75, z: 0.82, shadow: 'none', parent: cabin });
  glowSprite(0xbfe8ff, 3.0, 0.4, cabin).position.y = 0.75;
  for (const s of [-1, 1]) for (const t of [-1, 1]) { const [px, pz] = localXZ(x, z, s * 2.6, t * 1.8, ry); game.physics.addBox(px, 2.4, pz, 0.35, 4.8, 0.35, { cam: false }); }
  const [bx, bz] = localXZ(x, z, -1.6, -1.4, ry); game.physics.addBox(bx, 0.7, bz, abs(cos(ry)) * 1.6 + abs(sin(ry)) * 0.5, 0.5, abs(sin(ry)) * 1.6 + abs(cos(ry)) * 0.5, { cam: false });
  g.userData.update = (dt, t) => {
    cabin.rotation.z = sin(t * 0.9) * 0.04; cabin.position.y = 2.4 + sin(t * 1.3) * 0.04; swirl.rotation.y = t * 0.8; swirl.rotation.x = sin(t) * 0.3;
    for (const rd of riders) { rd.userData.k = (rd.userData.k + rd.userData.dir * dt * 0.022 + 1) % 1; rd.position.z = -4 - rd.userData.k * (cableLen - 8); rd.rotation.z = sin(t * 0.7 + rd.userData.k * 9) * 0.04; }
  };
  hubPrompt(game, g, x, z, prompt, onEnter, 0x9fe8ff, 3.4);
  return g;
}
/** Two log posts, a beam, a carved sign, icicles and lanterns: the welcome gate at the top of the gondola. */
function makeWelcomeArch(game, x, z, ry, text = 'WELCOME TO FROSTY PEAK') {
  const y0 = game.physics.ground0(x, z), g = group(x, y0, z, game.world); g.rotation.y = ry;
  const log = mat(0x6b4a2a, { roughness: 1, map: TEX.bark() }), snow = mat(0xf4f7fb, { roughness: 0.95 }), ice = glowMat(0xbfe8ff, 0.4, { transparent: true, opacity: 0.8, roughness: 0.1 });
  for (const s of [-1, 1]) { mesh(G.cyl(0.16, 0.2, 3.8, 9), log, { x: s * 2.2, y: 1.9, parent: g }); mesh(G.sphere(0.28, 8, 6), snow, { x: s * 2.2, y: 3.85, sy: 0.5, shadow: 'none', parent: g }); const lamp = mesh(G.box(0.28, 0.36, 0.28), mat(0xffe6a8, { emissive: 0xffc46a, emissiveIntensity: 1.6 }), { x: s * 2.2, y: 2.6, z: 0.3, shadow: 'none', parent: g }); glowSprite(0xffb85a, 1.5, 0.4, lamp); pointLight(0xffb060, 7, 7, s * 2.2, 2.6, 0.6, g); const [px, pz] = localXZ(x, z, s * 2.2, 0, ry); game.physics.addBox(px, 1.9, pz, 0.45, 3.8, 0.45, { cam: false }); }
  mesh(G.cyl(0.14, 0.14, 4.9, 9), log, { y: 3.55, rz: PI / 2, parent: g }); mesh(G.box(4.6, 0.12, 0.5), snow, { y: 3.72, shadow: 'none', parent: g });
  mesh(G.box(3.6, 0.6, 0.1), mat(0x8a5a32, { roughness: 0.9, map: TEX.planks(28, 32) }), { y: 2.9, parent: g });
  for (const zz of [0.06, -0.06]) { const l = new THREE.Mesh(G.plane(3.4, 0.5), new THREE.MeshBasicMaterial({ map: TEX.signText(text, '#f4f7fb'), transparent: true })); worldBag.track(l.material); l.position.set(0, 2.9, zz); if (zz < 0) l.rotation.y = PI; g.add(l); }
  for (let i = 0; i < 9; i++) mesh(G.cone(0.05, 0.15 + (i % 3) * 0.12, 5), ice, { x: -2 + i * 0.5, y: 3.35 - (0.075 + (i % 3) * 0.06), rx: PI, shadow: 'none', parent: g });
  return g;
}
/** A row of lantern posts between two points (every other post carries a real light). */
function makeLanternPath(game, ax, az, bx, bz, n = 6) {
  const wood = mat(0x5a3a1f, { roughness: 1 });
  for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = lerp(ax, bx, k), z = lerp(az, bz, k), y = game.physics.ground0(x, z), side = i % 2 ? 1 : -1, dx = -(bz - az), dz = bx - ax, L = Math.hypot(dx, dz) || 1;
    const px = x + dx / L * side * 1.6, pz = z + dz / L * side * 1.6, py = game.physics.ground0(px, pz);
    mesh(G.cyl(0.05, 0.06, 1.3, 6), wood, { x: px, y: py + 0.65, z: pz, parent: game.world });
    const lamp = mesh(G.box(0.22, 0.28, 0.22), mat(0xffe6a8, { emissive: 0xffc46a, emissiveIntensity: 1.5 }), { x: px, y: py + 1.4, z: pz, shadow: 'none', parent: game.world }); glowSprite(0xffb85a, 1.2, 0.4, lamp);
    if (i % 2 === 0) pointLight(0xffb060, 6, 6, px, py + 1.5, pz, game.world);
    game.physics.addBox(px, py + 0.65, pz, 0.2, 1.3, 0.2, { cam: false });
  }
}
/**
 * A long cave running north (−z) from (x,z0) for `len` metres into the hillside: rock walls, arched ribs, a stone floor,
 * ice crystals and glowing gems along the way, and a wider den at the far end. The world flattens the terrain along it.
 */
function makeCave(game, U, x, z0, len, r = rnd) {
  const P = game.physics, y0 = P.ground0(x, z0), W = 2.4, Hh = 2.7;
  const rock = mat(0x5a5f66, { roughness: 1, map: TEX.stone(220).clone() }); rock.map.needsUpdate = true; rock.map.repeat.set(6, 1.5); worldBag.track(rock.map);
  const dark = mat(0x2a2d33, { roughness: 1 }), floorM = mat(0x6a6e74, { roughness: 1, map: TEX.stone(220) });
  const zEnd = z0 - len, denW = 4.2, denZ = zEnd + 3.5;
  // floor strip + den floor
  mesh(G.box(W * 2 + 1, 0.1, len + 1), floorM, { x, y: y0 - 0.02, z: z0 - len / 2, shadow: 'receive', parent: game.world });
  // walls (two long boxes), ceiling, back wall; the den is wider so the last stretch of wall steps out
  for (const s of [-1, 1]) {
    mesh(G.box(1.6, Hh + 1.2, len - 7), rock, { x: x + s * (W + 0.8), y: y0 + (Hh + 1.2) / 2 - 0.3, z: z0 - (len - 7) / 2, shadow: 'both', parent: game.world }); P.addBox(x + s * (W + 0.8), y0 + Hh / 2, z0 - (len - 7) / 2, 1.6, Hh + 1, len - 7);
    mesh(G.box(1.6, Hh + 1.4, 7.4), rock, { x: x + s * (denW + 0.8), y: y0 + (Hh + 1.4) / 2 - 0.3, z: denZ, shadow: 'both', parent: game.world }); P.addBox(x + s * (denW + 0.8), y0 + Hh / 2, denZ, 1.6, Hh + 1.2, 7.4);
    mesh(G.box(denW - W + 0.2, Hh + 1.2, 1.4), rock, { x: x + s * (W + (denW - W) / 2 + 0.3), y: y0 + (Hh + 1.2) / 2 - 0.3, z: denZ + 3.7, parent: game.world }); P.addBox(x + s * (W + (denW - W) / 2 + 0.3), y0 + Hh / 2, denZ + 3.7, denW - W + 0.2, Hh + 1, 1.4);
  }
  mesh(G.box((denW + 1.6) * 2 + 0.4, 1.4, len + 2), rock, { x, y: y0 + Hh + 0.7, z: z0 - len / 2, shadow: 'both', parent: game.world }); P.addBox(x, y0 + Hh + 0.7, z0 - len / 2, (denW + 1.6) * 2, 1.4, len + 2, { walk: false });
  mesh(G.box((denW + 1.6) * 2, Hh + 2, 1.6), rock, { x, y: y0 + Hh / 2 + 0.6, z: zEnd - 0.8, parent: game.world }); P.addBox(x, y0 + Hh / 2, zEnd - 0.8, (denW + 1.6) * 2, Hh + 2, 1.6);
  // ribs (arches) every few metres, the mouth a little bigger, plus boulders around the entrance
  for (let zz = z0 - 1; zz > denZ + 4.5; zz -= 3.2) mesh(G.torus(W + 0.3, 0.42, 7, 16, PI), dark, { x, y: y0 + 0.9, z: zz, parent: game.world });
  mesh(G.torus(W + 0.9, 0.6, 8, 18, PI), rock, { x, y: y0 + 0.7, z: z0 + 0.4, parent: game.world });
  for (let i = 0; i < 10; i++) { const a = r.range(-0.4, 0.4) + (i % 2 ? 0 : PI), d = r.range(3.2, 5.5), bx = x + sin(a) * d, bz = z0 + cos(a) * 1.5 + r.range(-1, 2); placeT(game, U, makeRock(r, 0x6b6f76, r.range(1.0, 2.2)), bx, bz, 0); }
  mesh(G.box(20, 8, 8), rock, { x, y: y0 + Hh + 4.5, z: zEnd - 2, shadow: 'both', parent: game.world });   // the hill the cave burrows into
  // inside: crystals, gems, a few lights, moss
  for (let i = 0; i < 6; i++) { const zz = z0 - 3 - i * ((len - 10) / 6), s = i % 2 ? 1 : -1; const c = makeIceCrystal(r, r.pick([0x9fe8ff, 0xbfa8ff, 0xa8ffe8])); c.position.set(x + s * (W - 0.4), y0, zz); c.rotation.y = r() * TAU; game.world.add(c); U.push(c.userData.update); }
  for (let i = 0; i < 4; i++) { const zz = z0 - 5 - i * ((len - 12) / 4); makeGemCluster(game, U, x + (i % 2 ? 1.2 : -1.2), zz, 4, [0x7fe0ff, 0xff6fb5, 0xa8ff9a, 0xffd54a], r, 0.9); }
  makeGemCluster(game, U, x, denZ - 1, 9, [0xffd54a, 0x7fe0ff, 0xff6fb5, 0xa8ff9a, 0xc8a2ff], r, 2.2);
  for (let i = 0; i < 3; i++) { const zz = z0 - 6 - i * ((len - 12) / 3); pointLight(0x9fd8ff, 8, 9, x, y0 + Hh - 0.4, zz, game.world); }
  pointLight(0xffd9a0, 12, 10, x, y0 + Hh - 0.5, denZ, game.world);
  for (let i = 0; i < 12; i++) mesh(G.sphere(1, 7, 5), mat(0x5f9a3a, { roughness: 1 }), { x: x + r.range(-W + 0.3, W - 0.3), y: y0 + 0.02, z: z0 - r.range(1, len - 3), sx: r.range(0.2, 0.5), sy: 0.06, sz: r.range(0.2, 0.5), shadow: 'none', parent: game.world });   // moss
  return { den: [x, denZ], mouth: [x, z0] };
}
/** A huge hollow oak whose hollow glows: the way into Whisper Woods. */
function makeHollowOak(game, x, z, ry, onEnter, prompt = 'Crawl into the hollow oak') {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark().clone() }); bark.map.needsUpdate = true; bark.map.repeat.set(4, 2); worldBag.track(bark.map);
  const leaf = mat(0x2f7a2f, { roughness: 1 }), inner = mat(0x2a1a0e, { roughness: 1 });
  mesh(G.cyl(1.4, 1.9, 4.4, 14), bark, { y: 2.2, shadow: 'both', parent: g });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4; mesh(G.cyl(0.25, 0.4, 2.6, 7), bark, { x: cos(a) * 1.2, y: 4.8, z: sin(a) * 1.2, rz: -cos(a) * 0.6, rx: sin(a) * 0.6, parent: g }); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; mesh(G.sphere(1, 12, 9), leaf, { x: cos(a) * 1.9, y: 6.4 + (i % 2) * 0.6, z: sin(a) * 1.9, sx: 1.7, sy: 1.4, sz: 1.7, parent: g }); }
  mesh(G.sphere(2.4, 12, 9), leaf, { y: 7.2, parent: g });
  // hollow: an arched dark opening with a glowing green core
  mesh(G.box(1.5, 2.4, 1.0), inner, { y: 1.2, z: 1.5, shadow: 'none', parent: g });
  const arch = new THREE.CylinderGeometry(0.75, 0.75, 1.0, 16, 1, false, 0, PI); worldBag.track(arch);
  mesh(arch, inner, { y: 2.4, z: 1.5, rz: PI / 2, shadow: 'none', parent: g });
  const core = mesh(G.cyl(0.6, 0.6, 0.04, 32), basic(0x9dff6a, { transparent: true, opacity: 0.25, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), { y: 1.5, z: 1.7, rx: PI / 2, shadow: 'none', parent: g });
  const ring = mesh(G.torus(0.7, 0.04, 8, 32), glowMat(0x9dff6a, 1.6), { y: 1.5, z: 1.72, shadow: 'none', parent: g });
  glowSprite(0x9dff6a, 3.2, 0.45, g).position.set(0, 1.6, 1.9);
  for (let i = 0; i < 6; i++) mesh(G.cyl(0.08, 0.1, 0.6, 5), mat(0xff5252, { roughness: 0.6, map: TEX.mushroom(0) }), { x: cos(i) * 2.1, y: 0.3, z: sin(i) * 2.1, parent: g });
  game.physics.addBox(x, 2.2, z, 3.2, 4.4, 3.2);
  g.userData.update = (dt, t) => { ring.rotation.z = t * 0.5; ring.scale.setScalar(1 + sin(t * 2) * 0.04); core.material.opacity = 0.2 + sin(t * 3) * 0.07; };
  hubPrompt(game, g, x, z, prompt, onEnter, 0x9dff6a, 3.2);
  return g;
}

// ---------------------------------------------------------------- snow village
function makeSnowPine(r = rnd) {
  const g = new THREE.Group(), trunk = mat(0x4a3323, { roughness: 1 }), leaf = mat(0x1f5a2a, { roughness: 1 }), snow = mat(0xf4f7fb, { roughness: 0.95 });
  mesh(G.cyl(0.12, 0.2, 3, 8), trunk, { y: 1.5, parent: g });
  for (let j = 0; j < 4; j++) { mesh(G.cone(1.5 - j * 0.3, 1.6, 9), leaf, { y: 2.2 + j * 0.85, parent: g }); mesh(G.cone(1.5 - j * 0.3 + 0.05, 0.5, 9), snow, { y: 2.2 + j * 0.85 + 0.55, shadow: 'none', parent: g }); }
  g.userData.col = [1.4, 5.5]; g.rotation.y = r() * TAU; g.scale.setScalar(r.range(0.8, 1.3));
  return g;
}
function makeCabin(o = {}, r = rnd) {
  const g = new THREE.Group(), log = mat(o.wall ?? 0x8a5a32, { roughness: 1, map: TEX.planks(26, 32) }), roof = mat(o.roof ?? 0x4a3a30, { roughness: 0.9 }), snow = mat(0xf4f7fb, { roughness: 0.95 }), glass = mat(0xffd27a, { roughness: 0.2, emissive: 0xffb347, emissiveIntensity: 1.0 });
  const w = o.w ?? 5, d = o.d ?? 4.5, h = o.h ?? 2.8;
  for (let i = 0; i < h / 0.35; i++) for (const s of [-1, 1]) mesh(G.cyl(0.18, 0.18, w + 0.4, 8), log, { y: 0.18 + i * 0.35, z: s * (d / 2 - 0.1), rz: PI / 2, parent: g });
  for (let i = 0; i < h / 0.35; i++) for (const s of [-1, 1]) mesh(G.cyl(0.18, 0.18, d + 0.4, 8), log, { x: s * (w / 2 - 0.1), y: 0.18 + i * 0.35, rx: PI / 2, parent: g });
  mesh(G.box(w - 0.4, h, d - 0.4), log, { y: h / 2, shadow: 'both', parent: g });
  mesh(G.gable(d + 1.0, 1.8, w + 1.0), roof, { y: h - 0.1, ry: PI / 2, parent: g });
  mesh(G.gable(d + 1.1, 1.85, w + 1.1), snow, { y: h + 0.05, ry: PI / 2, shadow: 'none', parent: g });
  mesh(G.box(0.6, 1.4, 0.6), mat(0x6b6660, { roughness: 1, map: TEX.stone(20) }), { x: w * 0.3, y: h + 1.4, z: -d * 0.15, parent: g });
  mesh(G.box(0.9, 1.9, 0.12), mat(0x3a2a1a, { roughness: 0.9 }), { y: 0.95, z: d / 2 + 0.05, parent: g });
  for (const wx of [-w * 0.3, w * 0.3]) { mesh(G.box(0.9, 0.9, 0.12), glass, { x: wx, y: 1.5, z: d / 2 + 0.05, shadow: 'none', parent: g }); mesh(G.box(1.0, 0.08, 0.16), mat(0xf4f7fb), { x: wx, y: 1.0, z: d / 2 + 0.1, shadow: 'none', parent: g }); }
  mesh(G.sphere(0.08, 8, 6), glowMat(0xffe3a0, 1.5), { y: 2.2, z: d / 2 + 0.15, shadow: 'none', parent: g }); g.userData.light = pointLight(0xffc78a, 10, 8, 0, 2, d / 2 + 0.8, g);
  g.userData.chimney = [w * 0.3, h + 2.1, -d * 0.15]; g.userData.size = [w + 0.4, h + 1.8, d + 0.4];
  return g;
}
function makeIgloo() {
  const g = new THREE.Group(), ice = mat(0xe8f4ff, { roughness: 0.6, map: TEX.stone(200) });
  mesh(G.dome(1.8, 18, 10), ice, { shadow: 'both', parent: g });
  const tunnel = new THREE.CylinderGeometry(0.75, 0.75, 1.4, 12, 1, false, 0, PI); worldBag.track(tunnel);
  mesh(tunnel, ice, { y: 0, z: 1.6, rz: PI / 2, parent: g });
  mesh(G.cyl(0.55, 0.55, 0.1, 12), mat(0x1a2230), { y: 0.1, z: 2.3, rx: PI / 2, shadow: 'none', parent: g });
  g.userData.light = pointLight(0x9fe8ff, 4, 5, 0, 0.6, 1.4, g);
  return g;
}
function makeSnowman(r = rnd) {
  const g = new THREE.Group(), snow = mat(0xf6f9fc, { roughness: 1 }), coal = mat(0x111111), carrot = mat(0xff7b1a, { roughness: 0.6 }), stick = mat(0x4a3323, { roughness: 1 });
  mesh(G.sphere(0.55, 14, 10), snow, { y: 0.5, parent: g }); mesh(G.sphere(0.42, 14, 10), snow, { y: 1.25, parent: g }); const head = group(0, 1.9, 0, g); mesh(G.sphere(0.3, 14, 10), snow, { parent: head });
  for (const s of [1, -1]) mesh(G.sphere(0.035, 6, 6), coal, { x: s * 0.1, y: 0.06, z: 0.27, shadow: 'none', parent: head });
  mesh(G.cone(0.05, 0.3, 6), carrot, { z: 0.38, rx: PI / 2, shadow: 'none', parent: head });
  for (let i = 0; i < 3; i++) mesh(G.sphere(0.035, 6, 6), coal, { y: 1.15 + i * 0.16, z: 0.4, shadow: 'none', parent: g });
  for (const s of [1, -1]) mesh(G.cyl(0.02, 0.03, 0.8, 5), stick, { x: s * 0.6, y: 1.5, rz: s * -1.0, parent: g });
  mesh(G.cyl(0.32, 0.32, 0.04, 16), coal, { y: 0.25, parent: head }); mesh(G.cyl(0.2, 0.22, 0.32, 16), coal, { y: 0.42, parent: head });
  mesh(G.torus(0.3, 0.06, 6, 16), mat(r.pick([0xd62839, 0x2f6fd6, 0x2e9e6e]), { roughness: 1 }), { y: 1.62, rx: PI / 2, shadow: 'none', parent: g });
  g.userData.head = head; g.userData.update = (dt, t) => { head.rotation.y = sin(t * 0.7) * 0.25; };
  return g;
}
function makeCampfire(game, x, z) {
  const y0 = game.physics.ground0(x, z), g = group(x, y0, z, game.world), stone = mat(0x6b6660, { roughness: 1 }), log = mat(0x4a3323, { roughness: 1 });
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; mesh(G.sphere(0.16, 7, 5), stone, { x: cos(a) * 0.8, y: 0.08, z: sin(a) * 0.8, sy: 0.7, parent: g }); }
  for (let i = 0; i < 3; i++) mesh(G.cyl(0.08, 0.08, 1.0, 6), log, { y: 0.12, ry: i * PI / 3, rz: PI / 2, parent: g });
  const flame = mesh(G.cone(0.3, 0.9, 8), glowMat(0xff8a2a, 2.5, { transparent: true, opacity: 0.85 }), { y: 0.55, shadow: 'none', parent: g });
  const flame2 = mesh(G.cone(0.18, 0.6, 8), glowMat(0xfff176, 2.5, { transparent: true, opacity: 0.9 }), { y: 0.5, shadow: 'none', parent: g });
  const light = pointLight(0xff9a3a, 22, 12, 0, 0.9, 0, g); glowSprite(0xff9a3a, 2.6, 0.5, g).position.y = 0.6;
  for (const a of [0.4, 2.5, 4.4]) { mesh(G.cyl(0.14, 0.14, 1.2, 8), log, { x: cos(a) * 1.7, y: 0.14, z: sin(a) * 1.7, ry: a + PI / 2, rz: PI / 2, parent: g }); game.physics.addBox(x + cos(a) * 1.7, y0 + 0.14, z + sin(a) * 1.7, 0.6, 0.3, 0.6, { cam: false }); }
  game.physics.addBox(x, y0 + 0.3, z, 1.2, 0.6, 1.2, { cam: false });
  g.userData.update = (dt, t) => { flame.scale.set(1 + sin(t * 12) * 0.12, 1 + sin(t * 9) * 0.2, 1 + cos(t * 11) * 0.12); flame2.scale.y = 1 + sin(t * 15) * 0.25; flame.rotation.y = t * 2; light.intensity = 20 + sin(t * 13) * 4 + sin(t * 29) * 2;
    if (rnd.chance(dt * 12)) game.fx.emit(x, y0 + 0.8, z, { count: 1, colors: [0xffb066, 0xff7a2a], speed: 0.3, up: 1.6, life: 1.2, gravity: -0.4, spread: 0.15 }); };
  return g;
}
function makeIcePond(game, x, z, rad, r = rnd) {
  const y0 = game.physics.ground0(x, z), g = group(x, y0, z, game.world);
  mesh(G.cyl(rad, rad, 0.08, 28), mat(0xcfe9f8, { roughness: 0.1, metalness: 0.2, map: TEX.ice(), emissive: 0x6ab0e0, emissiveIntensity: 0.15 }), { y: 0.04, shadow: 'receive', parent: g });
  mesh(G.cyl(rad + 0.5, rad + 0.7, 0.1, 28), mat(0xf4f7fb, { roughness: 1 }), { y: 0.0, shadow: 'receive', parent: g });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; mesh(G.sphere(1, 7, 5), mat(0xdfe8f0, { roughness: 1 }), { x: cos(a) * (rad + 0.4), y: 0.05, z: sin(a) * (rad + 0.4), sx: r.range(0.2, 0.35), sy: r.range(0.15, 0.25), sz: r.range(0.2, 0.35), parent: g }); }
  return g;
}
function makeIceCrystal(r = rnd, color = 0x9fe8ff) {
  const g = new THREE.Group(), m = glowMat(color, 0.8, { transparent: true, opacity: 0.85, roughness: 0.1 });
  const n = r.int(3, 5); for (let i = 0; i < n; i++) { const a = r() * TAU; mesh(G.cone(0.18, r.range(0.8, 1.8), 6), m, { x: cos(a) * 0.25, y: 0.4, z: sin(a) * 0.25, rx: r.range(-0.3, 0.3), rz: r.range(-0.3, 0.3), ry: a, shadow: 'none', parent: g }); }
  g.userData.light = pointLight(color, 3, 5, 0, 0.8, 0, g);
  g.userData.update = (dt, t) => { g.userData.light.intensity = 2.5 + sin(t * 2 + g.position.x) * 1.2; };
  return g;
}
/** Aurora: three translucent curtains high in the sky that shimmer and drift. */
function makeAurora(parent, r = rnd) {
  const g = new THREE.Group(); parent.add(g);
  const u = { time: { value: 0 } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `varying vec2 vUv; uniform float time; void main(){ vUv = uv; vec3 p = position; p.y += sin(uv.x * 9.0 + time * 0.8) * 3.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float time; void main(){ float b = sin(vUv.x * 14.0 + time * 1.3) * 0.5 + 0.5; float c = sin(vUv.x * 5.0 - time * 0.6) * 0.5 + 0.5; float v = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)); float e = 1.0 - abs(vUv.x - 0.5) * 2.0; vec3 col = mix(vec3(0.2, 1.0, 0.6), vec3(0.6, 0.3, 1.0), c); gl_FragColor = vec4(col, v * e * (0.25 + b * 0.35)); }` });
  worldBag.track(m);
  for (let i = 0; i < 3; i++) { const p = mesh(G.plane(420, 46, 40, 1), m, { x: r.range(-60, 60), y: 70 + i * 14, z: -230 - i * 40, ry: r.range(-0.25, 0.25), rx: 0.2, shadow: 'none', parent: g }); p.frustumCulled = false; }
  g.userData.update = (dt, t) => { u.time.value = t; };
  return g;
}
function makeSled(color = 0xd62839) {
  const g = new THREE.Group(), wood = mat(0x8a5a32, { roughness: 0.9, map: TEX.planks(28, 32) }), rail = mat(color, { metalness: 0.5, roughness: 0.4 });
  for (const s of [-1, 1]) { mesh(G.box(0.06, 0.06, 1.6), rail, { x: s * 0.35, y: 0.05, parent: g }); mesh(G.torus(0.2, 0.03, 6, 12, PI), rail, { x: s * 0.35, y: 0.25, z: 0.8, ry: PI / 2, rx: -PI / 2, shadow: 'none', parent: g }); }
  for (let i = 0; i < 5; i++) mesh(G.box(0.9, 0.04, 0.18), wood, { y: 0.3, z: -0.6 + i * 0.3, parent: g });
  for (const [x, z] of [[-0.35, -0.5], [0.35, -0.5], [-0.35, 0.5], [0.35, 0.5]]) mesh(G.box(0.05, 0.25, 0.05), wood, { x, y: 0.16, z, parent: g });
  return g;
}

// ---------------------------------------------------------------- whisper woods
function makeBigTree(r = rnd, o = {}) {
  const g = new THREE.Group(), bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark().clone() }); bark.map.needsUpdate = true; bark.map.repeat.set(3, 2); worldBag.track(bark.map);
  const leaf = mat(o.leaf ?? r.pick([0x2f7a2f, 0x1f6a3a, 0x3a8a3a, 0x2a6a4a]), { roughness: 1 });
  const h = o.h ?? r.range(7, 10), R = o.r ?? r.range(0.7, 1.0);
  mesh(G.cyl(R * 0.55, R, h, 10), bark, { y: h / 2, shadow: 'both', parent: g });
  if (!o.simple) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + r() * 0.5; mesh(G.cyl(R * 0.3, R * 0.55, 1.6, 6), bark, { x: cos(a) * R * 0.9, y: 0.6, z: sin(a) * R * 0.9, rx: sin(a) * 0.5, rz: -cos(a) * 0.5, parent: g }); }   // root flare
  if (!o.simple) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6; mesh(G.cyl(0.18, 0.3, 3.2, 6), bark, { x: cos(a) * 1.3, y: h - 1.2, z: sin(a) * 1.3, rz: -cos(a) * 0.9, rx: sin(a) * 0.9, parent: g }); }
  const n = o.simple ? 3 : r.int(6, 8); for (let i = 0; i < n; i++) { const a = i / n * TAU; mesh(G.sphere(1, 12, 9), leaf, { x: cos(a) * 2.4, y: h + r.range(-0.3, 1.0), z: sin(a) * 2.4, sx: r.range(1.8, 2.4), sy: r.range(1.4, 1.9), sz: r.range(1.8, 2.4), parent: g }); }
  mesh(G.sphere(2.8, 12, 9), leaf, { y: h + 1.4, parent: g });
  if (o.lanterns) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.3; const l = mesh(G.sphere(0.14, 8, 6), glowMat(r.pick([0xffd54a, 0xff8a65, 0x9dff6a]), 1.8), { x: cos(a) * 2.2, y: h - 0.4, z: sin(a) * 2.2, shadow: 'none', parent: g }); mesh(G.cyl(0.01, 0.01, 0.8, 4), mat(0x2b2b2b), { x: cos(a) * 2.2, y: h, z: sin(a) * 2.2, shadow: 'none', parent: g }); }
  g.userData.col = [R * 2.2, h]; g.rotation.y = r() * TAU;
  return g;
}
function makeMushroom(size = 1, hue = 0, r = rnd, glow = false) {
  const g = new THREE.Group(), stem = mat(0xf3e9d8, { roughness: 0.9 }), cap = glow ? glowMat(new THREE.Color().setHSL(hue / 360, 0.8, 0.55), 0.6, { map: TEX.mushroom(hue), roughness: 0.5 }) : mat(0xffffff, { roughness: 0.55, map: TEX.mushroom(hue) });
  const h = size * 1.3;
  mesh(G.cyl(0.22 * size, 0.3 * size, h, 10), stem, { y: h / 2, parent: g });
  mesh(G.dome(0.8 * size, 16, 8), cap, { y: h - 0.1 * size, sy: 0.75, parent: g });
  mesh(G.cyl(0.8 * size, 0.6 * size, 0.12 * size, 16), mat(0xe8d8c0, { roughness: 1 }), { y: h - 0.13 * size, shadow: 'none', parent: g });
  if (glow) { g.userData.light = pointLight(new THREE.Color().setHSL(hue / 360, 0.8, 0.6), 4 * size, 6 * size, 0, h, 0, g); g.userData.update = (dt, t) => { g.userData.light.intensity = (3 + sin(t * 1.5 + g.position.x) * 1.2) * size; }; }
  g.userData.col = [0.6 * size, h + 0.5 * size]; g.rotation.y = r() * TAU;
  return g;
}
function makeFerns(game, spots, r) {
  const pts = scatterPoints(game, spots, r, 0.4), total = pts.length;
  if (!total) return null;
  const im = new THREE.InstancedMesh(G.cone(0.055, 0.6, 3), mat(0x3f8a3a, { roughness: 1, side: THREE.DoubleSide }), total * 5);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color();
  let i = 0;
  for (const [x, z] of pts) {
    const y = game.physics.ground0(x, z);
    for (let f = 0; f < 5; f++, i++) { const fa = f / 5 * TAU + r() * 0.5; Q.setFromEuler(E.set(0.9 + r() * 0.3, fa, 0)); M.compose(Pv.set(x, y + 0.15, z), Q, S.set(r.range(3, 5), r.range(0.8, 1.3), 1)); im.setMatrixAt(i, M); im.setColorAt(i, C.setHSL(r.range(0.25, 0.36), 0.5, r.range(0.36, 0.52))); }
  }
  im.instanceColor.needsUpdate = true; im.castShadow = false; game.world.add(im); worldBag.track(im);
  return im;
}
function makeTreehouse(game, x, z, r = rnd) {
  const y0 = game.physics.ground0(x, z), g = group(x, y0, z, game.world);
  const tree = makeBigTree(r, { h: 9, r: 1.1, leaf: 0x2f7a2f }); g.add(tree);
  const wood = mat(0x8a5a32, { roughness: 0.9, map: TEX.planks(28, 34) }), dark = mat(0x5a3a1f, { roughness: 1 });
  mesh(G.box(4.6, 0.2, 4.6), wood, { y: 4.4, shadow: 'both', parent: g });
  mesh(G.box(3.0, 2.2, 3.0), wood, { y: 5.6, z: -0.4, shadow: 'both', parent: g });
  mesh(G.gable(3.6, 1.2, 3.6), dark, { y: 6.7, z: -0.4, ry: PI / 2, parent: g });
  mesh(G.box(0.8, 0.8, 0.1), mat(0xffd27a, { emissive: 0xffb347, emissiveIntensity: 1.2 }), { y: 5.8, z: 1.12, shadow: 'none', parent: g }); pointLight(0xffc78a, 8, 8, 0, 5.8, 1.6, g);
  for (let i = 0; i <= 4; i++) for (const s of [-1, 1]) mesh(G.box(0.08, 0.9, 0.08), dark, { x: s * 2.25, y: 4.95, z: -2.2 + i * 1.1, shadow: 'none', parent: g });
  for (const s of [-1, 1]) mesh(G.box(4.6, 0.06, 0.06), dark, { x: s * 2.25, y: 5.4, shadow: 'none', parent: g });
  for (let i = 0; i < 8; i++) mesh(G.box(0.5, 0.05, 0.14), wood, { x: 1.1, y: 0.6 + i * 0.5, z: 1.2, parent: g });                      // rope ladder rungs
  for (const s of [-1, 1]) mesh(G.cyl(0.02, 0.02, 4.2, 4), mat(0xc9a86a), { x: 1.1 + s * 0.25, y: 2.4, z: 1.2, shadow: 'none', parent: g });
  game.physics.addBox(x, y0 + 4.5, z, 3.2, 9, 3.2);
  return g;
}
/** A fallen hollow log: tapered bark trunk, sawn ends showing growth rings around a dark hollow, moss, a stub branch and a few mushrooms. */
function makeHollowLog(r = rnd) {
  const g = new THREE.Group(), bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark().clone() }); bark.map.needsUpdate = true; bark.map.repeat.set(3, 1.2); worldBag.track(bark.map);
  const inner = mat(0x1e1208, { roughness: 1 }), ring = mat(0xc9a86a, { roughness: 1 }), ringD = mat(0x9a7a4a, { roughness: 1 }), moss = mat(0x5f9a3a, { roughness: 1 });
  const L = 3.4, R = 0.62;
  const outer = new THREE.CylinderGeometry(R * 0.9, R, L, 14, 1, true); worldBag.track(outer);
  mesh(outer, bark, { y: R, rz: PI / 2, parent: g });
  for (const s of [-1, 1]) {
    const rr = s > 0 ? R * 0.9 : R;
    mesh(G.cyl(rr, rr, 0.08, 14), ring, { x: s * L / 2, y: R, rz: PI / 2, parent: g });
    for (let i = 1; i < 4; i++) mesh(G.torus(rr * (0.45 + i * 0.14), 0.012, 4, 20), ringD, { x: s * (L / 2 + 0.045), y: R, ry: PI / 2, shadow: 'none', parent: g });
    mesh(G.cyl(rr * 0.6, rr * 0.6, 0.06, 14), inner, { x: s * (L / 2 + 0.03), y: R, rz: PI / 2, shadow: 'none', parent: g });
  }
  for (let i = 0; i < 5; i++) mesh(G.sphere(1, 8, 6), moss, { x: r.range(-1.3, 1.3), y: R * 1.85, z: r.range(-0.25, 0.25), sx: r.range(0.18, 0.4), sy: 0.08, sz: r.range(0.14, 0.3), shadow: 'none', parent: g });
  mesh(G.cyl(0.05, 0.1, 0.5, 6), bark, { x: r.range(-0.8, 0.8), y: R * 1.9, z: 0.1, rx: -0.5, parent: g });   // stub branch
  for (let i = 0; i < 3; i++) { const m = makeMushroom(r.range(0.14, 0.24), r.pick([0, 30, 40]), r, false); m.position.set(r.range(-1.2, 1.2), R * 1.4, R * 0.75 + 0.05); m.rotation.x = -0.9; g.add(m); }
  return g;
}
/** A zipline: a tall start platform, a cable to a low landing post, and a trolley that whizzes down again and again — with a squirrel hanging on. */
function makeZipline(game, U, ax, az, bx, bz, r = rnd) {
  const P = game.physics, wood = mat(0x6b4a2a, { roughness: 0.95, map: TEX.planks(26, 30) }), dark = mat(0x5a3a1f, { roughness: 1 }), steel = mat(0x4a5058, { metalness: 0.8, roughness: 0.4 });
  const ay = P.ground0(ax, az) + 4.6, by = P.ground0(bx, bz) + 1.6;
  // start tower: four posts, a deck, rails and a ladder
  const tower = group(ax, P.ground0(ax, az), az, game.world);
  for (const [sx, sz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) mesh(G.cyl(0.09, 0.11, 4.6, 7), dark, { x: sx, y: 2.3, z: sz, parent: tower });
  mesh(G.box(2.4, 0.16, 2.4), wood, { y: 4.4, shadow: 'both', parent: tower });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) mesh(G.box(0.06, 0.8, 0.06), dark, { x: s * 1.15, y: 4.9, z: -1.1 + i * 0.72, shadow: 'none', parent: tower });
  for (let i = 0; i < 8; i++) mesh(G.box(0.5, 0.05, 0.1), wood, { x: -0.95, y: 0.5 + i * 0.5, z: 1.1, parent: tower });
  mesh(G.cyl(0.09, 0.09, 1.2, 7), dark, { y: 5.0, parent: tower });
  P.addBox(ax, P.ground0(ax, az) + 2.3, az, 2.0, 4.6, 2.0);
  // landing post with a pile of leaves
  const post = group(bx, P.ground0(bx, bz), bz, game.world);
  mesh(G.cyl(0.1, 0.12, 1.9, 7), dark, { y: 0.95, parent: post }); mesh(G.box(0.5, 0.1, 0.5), wood, { y: 1.9, parent: post });
  for (let i = 0; i < 7; i++) mesh(G.sphere(1, 7, 5), mat(r.pick([0xc97a2a, 0xe8a03a, 0x8a5a2a]), { roughness: 1 }), { x: r.range(-0.9, 0.9), y: 0.15, z: r.range(-0.9, 0.9), sx: r.range(0.3, 0.6), sy: 0.18, sz: r.range(0.3, 0.6), shadow: 'none', parent: post });
  P.addBox(bx, P.ground0(bx, bz) + 0.95, bz, 0.3, 1.9, 0.3, { cam: false });
  // cable: a thin cylinder from A to B
  const A = V3(ax, ay + 1.0, az), B = V3(bx, by, bz), Lc = A.distanceTo(B), mid = A.clone().add(B).multiplyScalar(0.5);
  const cableG = group(mid.x, mid.y, mid.z, game.world); cableG.lookAt(B);
  mesh(G.cyl(0.025, 0.025, Lc, 5), steel, { rx: PI / 2, parent: cableG });
  // trolley + rider
  const trolley = group(0, 0, 0, game.world);
  mesh(G.cyl(0.12, 0.12, 0.08, 12), steel, { rz: PI / 2, parent: trolley }); mesh(G.box(0.12, 0.6, 0.06), steel, { y: -0.3, parent: trolley }); mesh(G.cyl(0.03, 0.03, 0.7, 6), dark, { y: -0.6, rz: PI / 2, parent: trolley });
  const rider = makeSquirrel(); rider.group.position.set(0, -1.05, 0); rider.group.scale.setScalar(1.1); trolley.add(rider.group);
  let k = 0.2, tt = r() * 10;
  U.push((dt, t) => {
    tt += dt; k += dt * 0.11; if (k > 1.25) { k = -0.35; }
    const kk = clamp(k, 0, 1), ease = kk * kk * (3 - 2 * kk);
    trolley.position.lerpVectors ? trolley.position.lerpVectors(A, B, ease) : trolley.position.set(lerp(A.x, B.x, ease), lerp(A.y, B.y, ease), lerp(A.z, B.z, ease));
    trolley.visible = k >= 0 && k <= 1;
    trolley.rotation.y = atan2(B.x - A.x, B.z - A.z); trolley.rotation.z = sin(tt * 4) * 0.08 * (kk > 0 && kk < 1 ? 1 : 0);
    rider.animate(0, true, dt, tt); rider.group.rotation.x = -0.3;
  });
  return { tower, post };
}
function makeGlowPond(game, x, z, rad, r = rnd) {
  const y0 = game.physics.ground0(x, z), g = group(x, y0, z, game.world);
  const water = mat(0x1f6f9a, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85, emissive: 0x1aa0b0, emissiveIntensity: 0.4, map: TEX.water() });
  mesh(G.cyl(rad, rad, 0.06, 28), water, { y: 0.02, shadow: 'receive', parent: g });
  mesh(G.cyl(rad + 0.5, rad + 0.7, 0.14, 28), mat(0x4a3a28, { roughness: 1 }), { y: -0.01, shadow: 'receive', parent: g });
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; mesh(G.sphere(1, 7, 5), mat(0x6b7a6a, { roughness: 1 }), { x: cos(a) * (rad + 0.35), y: 0.06, z: sin(a) * (rad + 0.35), sx: r.range(0.2, 0.4), sy: r.range(0.12, 0.22), sz: r.range(0.2, 0.4), parent: g }); }
  for (let i = 0; i < 6; i++) { const a = r() * TAU, d = r() * rad * 0.7; mesh(G.cyl(0.32, 0.32, 0.02, 12), mat(0x3f9a3a, { roughness: 0.6 }), { x: cos(a) * d, y: 0.06, z: sin(a) * d, shadow: 'none', parent: g }); }
  for (let i = 0; i < 10; i++) { const a = r() * TAU, d = rad + r.range(0.5, 1.2); mesh(G.cyl(0.02, 0.03, r.range(0.8, 1.4), 5), mat(0x5b8f3a, { roughness: 1 }), { x: cos(a) * d, y: 0.5, z: sin(a) * d, shadow: 'none', parent: g }); mesh(G.cyl(0.05, 0.05, 0.25, 6), mat(0x6b4a2a), { x: cos(a) * d, y: 1.2, z: sin(a) * d, shadow: 'none', parent: g }); }
  g.userData.light = pointLight(0x2ad0d0, 12, 12, 0, 0.6, 0, g);
  g.userData.update = (dt, t) => { water.map.offset.x = t * 0.01; g.userData.light.intensity = 10 + sin(t * 1.3) * 3; };
  return g;
}
function makeStump(r = rnd) {
  const g = new THREE.Group(), bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark() });
  mesh(G.cyl(0.5, 0.6, 0.7, 12), bark, { y: 0.35, parent: g }); mesh(G.cyl(0.48, 0.48, 0.04, 12), mat(0xc9a86a, { roughness: 1 }), { y: 0.72, shadow: 'none', parent: g });
  for (let i = 0; i < 4; i++) mesh(G.torus(0.12 + i * 0.09, 0.008, 4, 16), mat(0x8a6a44), { y: 0.745, rx: PI / 2, shadow: 'none', parent: g });
  return g;
}
function makeLanternString(game, ax, az, bx, bz, n = 7, y = 3.2) {
  const W = game.world, ya = game.physics.ground0(ax, az) + y, yb = game.physics.ground0(bx, bz) + y;
  const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(V3(lerp(ax, bx, k), lerp(ya, yb, k) - sin(k * PI) * 0.6, lerp(az, bz, k))); }
  const rope = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.015, 4, false); worldBag.track(rope);
  W.add(new THREE.Mesh(rope, mat(0x3a2a1a)));
  const lanterns = [], cap = mat(0x2b2b2b, { roughness: 0.8 });
  for (let i = 1; i < n; i++) { const k = i / n, x = lerp(ax, bx, k), z = lerp(az, bz, k), yy = lerp(ya, yb, k) - sin(k * PI) * 0.6 - 0.32; const c = rnd.pick([0xffd54a, 0xff8a65, 0xff6fb5, 0x9dff6a, 0x7fd7ff]);
    const l = group(x, yy, z, W);                                                                                  // paper lantern: string, capped cylinder, glow
    mesh(G.cyl(0.006, 0.006, 0.2, 3), cap, { y: 0.24, shadow: 'none', parent: l });
    const body = mesh(G.cyl(0.12, 0.12, 0.26, 10), glowMat(c, 1.5, { roughness: 0.7 }), { shadow: 'none', parent: l }); body.scale.set(1, 1, 1);
    mesh(G.cyl(0.08, 0.08, 0.03, 8), cap, { y: 0.145, shadow: 'none', parent: l }); mesh(G.cyl(0.08, 0.08, 0.03, 8), cap, { y: -0.145, shadow: 'none', parent: l });
    glowSprite(c, 1.0, 0.4, l); l.userData.m = body.material; l.userData.ph = rnd() * TAU; lanterns.push(l); }
  return { update: (dt, t) => { lanterns.forEach((l, i) => { l.rotation.z = sin(t * 1.1 + l.userData.ph) * 0.08; l.rotation.x = cos(t * 0.9 + l.userData.ph) * 0.06; l.userData.m.emissiveIntensity = 1.3 + sin(t * 2 + i) * 0.35; }); } };
}
