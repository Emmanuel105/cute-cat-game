// ============================================================================
// PROPS — reusable set pieces for all four worlds
// ============================================================================
function glowSprite(color, size, opacity = 0.6, parent = null) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  worldBag.track(s.material); s.scale.set(size, size, 1); if (parent) parent.add(s); return s;
}
/**
 * A point light for a prop. It is a wish, not a real light — the LightPool hands the real ones to
 * whatever is nearest the camera. The returned object still takes `.intensity` and `.color` changes,
 * so prop update loops (flickering fires, pulsing crystals) work unchanged.
 */
function pointLight(color, intensity, distance, x, y, z, parent) { return LIGHTS.add(color, intensity, distance, x, y, z, parent); }

// ---------------------------------------------------------------- nature
/** Leaf material: textured, two lightness steps per tree so the canopy has depth. */
function leafMat(hue, light, sat = 0.5) { return mat(new THREE.Color().setHSL(hue / 360, sat, light), { roughness: 0.95, map: TEX.leaf(hue) }); }
function makeTree(kind, r = rnd) {
  const g = new THREE.Group();
  if (kind === 'pine') {
    const trunk = mat(0x5a3a26, { roughness: 1, map: TEX.bark() }), dark = leafMat(140, 0.2), light = leafMat(125, 0.27);
    mesh(G.cyl(0.11, 0.26, 3.2, 9), trunk, { y: 1.6, parent: g });
    for (let j = 0; j < 6; j++) { const rr = 1.75 - j * 0.24; mesh(G.cone(rr, 1.35, 10), j % 2 ? light : dark, { y: 1.85 + j * 0.74, parent: g }); }
    mesh(G.cone(0.32, 0.8, 8), light, { y: 6.45, parent: g });
    g.userData.col = [1.5, 6.6];
  } else if (kind === 'birch') {
    const trunk = mat(0xefe9dc, { roughness: 0.9, map: TEX.birchBark() }), leaf = leafMat(92, 0.42), leaf2 = leafMat(78, 0.5);
    mesh(G.cyl(0.09, 0.16, 3.9, 9), trunk, { y: 1.95, parent: g });
    for (const s of [1, -1]) mesh(G.cyl(0.05, 0.08, 1.5, 6), trunk, { x: s * 0.38, y: 3.3, rz: -s * 0.55, parent: g });
    const n = r.int(5, 7); for (let j = 0; j < n; j++) { const a = j / n * TAU; mesh(G.sphere(1, 12, 9), j % 2 ? leaf : leaf2, { x: cos(a) * 0.8, y: 3.9 + r.range(-0.2, 0.7), z: sin(a) * 0.8, sx: r.range(0.7, 1.0), sy: r.range(0.8, 1.2), sz: r.range(0.7, 1.0), parent: g }); }
    mesh(G.sphere(1.1, 12, 9), leaf, { y: 4.7, parent: g });
    g.userData.col = [1.3, 5.4];
  } else {
    const trunk = mat(0x5b3d24, { roughness: 1, map: TEX.bark() }), hue = r.pick([108, 118, 96, 128]), leaf = leafMat(hue, 0.27), leaf2 = leafMat(hue + 8, 0.36);
    mesh(G.cyl(0.24, 0.4, 2.9, 9), trunk, { y: 1.45, parent: g });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.5; mesh(G.cyl(0.1, 0.34, 1.1, 6), trunk, { x: cos(a) * 0.42, y: 0.4, z: sin(a) * 0.42, rz: -cos(a) * 0.55, rx: sin(a) * 0.55, parent: g }); }      // root flare
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.9; mesh(G.cyl(0.09, 0.18, 1.9, 6), trunk, { x: cos(a) * 0.75, y: 3.4, z: sin(a) * 0.75, rz: -cos(a) * 0.8, rx: sin(a) * 0.8, parent: g }); }      // limbs
    const n = r.int(7, 9); for (let j = 0; j < n; j++) { const a = j / n * TAU, d = r.range(0.9, 1.6); mesh(G.sphere(1, 12, 9), j % 2 ? leaf : leaf2, { x: cos(a) * d, y: 3.6 + r.range(-0.3, 0.9), z: sin(a) * d, sx: r.range(1.1, 1.5), sy: r.range(0.9, 1.3), sz: r.range(1.1, 1.5), parent: g }); }
    mesh(G.sphere(1.75, 14, 10), leaf2, { y: 4.4, parent: g }); mesh(G.sphere(1.25, 12, 9), leaf, { y: 5.35, parent: g });
    g.userData.col = [1.8, 6.4];
  }
  g.rotation.y = r() * TAU; g.scale.setScalar(r.range(0.85, 1.25));
  return g;
}
function makeBush(r = rnd, color = 0x2f7a2f) {
  const g = new THREE.Group(), [h] = hexToHsl(color), m = leafMat(h, 0.3), m2 = leafMat(h + 10, 0.38), n = r.int(4, 6);
  for (let j = 0; j < n; j++) mesh(G.sphere(1, 10, 8), j % 2 ? m : m2, { x: r.range(-0.4, 0.4), y: r.range(0.3, 0.5), z: r.range(-0.3, 0.3), sx: r.range(0.45, 0.7), sy: r.range(0.4, 0.55), sz: r.range(0.45, 0.7), parent: g });
  if (r.chance(0.5)) for (let j = 0; j < 6; j++) mesh(G.sphere(0.05, 6, 5), mat(r.pick([0xff5c8a, 0xffffff, 0xffd54a]), { roughness: 0.7 }), { x: r.range(-0.5, 0.5), y: r.range(0.5, 0.85), z: r.range(-0.4, 0.4), shadow: 'none', parent: g });   // blossoms
  return g;
}
/**
 * Samples `n` points inside each [x, z, radius, count] spot, throwing away any that land in a keep-out
 * zone (`pad` is the clearance the prop needs). Returns the accepted points, so callers can size their
 * instanced meshes to what actually fits.
 */
function scatterPoints(game, spots, r = rnd, pad = 0.35) {
  const zones = game.zones, out = [];
  for (const [cx, cz, rad, n] of spots) for (let k = 0; k < n; k++) {
    let x = 0, z = 0, ok = false;
    for (let tries = 0; tries < 8 && !ok; tries++) {
      const a = r() * TAU, d = sqrt(r()) * rad; x = cx + cos(a) * d; z = cz + sin(a) * d;
      ok = !zones || !zones.blocked(x, z, pad);
    }
    if (ok) out.push([x, z]);
  }
  return out;
}
/** Instanced grass tufts on lawns: bent blades in mixed greens. spots = [[x,z,radius,count]] */
function makeGrass(game, spots, r = rnd, o = {}) {
  const pts = scatterPoints(game, spots, r, o.pad ?? 0.3);
  const total = pts.length;
  if (!total) return null;
  const hue = o.hue ?? [0.22, 0.3], light = o.light ?? [0.26, 0.4], tall = o.tall ?? 0.72, wide = o.wide ?? 0.7;
  const im = new THREE.InstancedMesh(G.blade(), mat(0xffffff, { roughness: 1, side: THREE.DoubleSide }), total * 3);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color();
  let i = 0;
  for (const [x, z] of pts) {
    const y = game.physics.ground0(x, z) + (o.y ?? 0);
    for (let b = 0; b < 3; b++, i++) {
      Q.setFromEuler(E.set(r.range(-0.4, 0.4), r() * TAU, r.range(-0.4, 0.4)));
      M.compose(Pv.set(x + r.range(-0.1, 0.1), y, z + r.range(-0.1, 0.1)), Q, S.set(r.range(0.9, 1.5) * wide, r.range(0.6, 1.2) * tall, wide)); im.setMatrixAt(i, M);
      im.setColorAt(i, C.setHSL(r.range(hue[0], hue[1]), 0.55, r.range(light[0], light[1])));
    }
  }
  im.instanceColor.needsUpdate = true; im.castShadow = false; im.receiveShadow = true; game.world.add(im); worldBag.track(im);
  return im;
}
/** Instanced flower bed: petalled heads (rosettes) on stems with a leaf, plus yellow centres. spots = [[x,z,radius,count]] */
function makeFlowers(game, spots, r = rnd, ground = null) {
  const parent = game.world, pts = scatterPoints(game, spots, r, 0.4);
  const total = pts.length;
  if (!total) return;
  // Thin parts come out solid black once the ink pass has drawn both of their edges, so flowers are
  // built chunky: a stem you can see, a wide head and a fat middle.
  const stem = new THREE.InstancedMesh(G.cyl(0.022, 0.026, 0.26, 5), mat(0x3d8a2a, { roughness: 1 }), total);
  const head = new THREE.InstancedMesh(G.rosette(5, 0.115, 0.05), mat(0xffffff, { roughness: 0.7, side: THREE.DoubleSide }), total);
  const centre = new THREE.InstancedMesh(G.sphere(0.036, 8, 6), mat(0xffd54a, { roughness: 0.6, emissive: 0xffb300, emissiveIntensity: 0.25 }), total);
  const leafy = new THREE.InstancedMesh(G.sphere(0.075, 7, 6), mat(0x4caf50, { roughness: 1 }), total);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), C = new THREE.Color(), E = new THREE.Euler(), Q0 = new THREE.Quaternion();
  let i = 0;
  for (const [x, z] of pts) {
    const y0 = ground ? ground(x, z) : game.physics.ground0(x, z), h = r.range(0.18, 0.36), s = r.range(0.75, 1.3);
    M.compose(Pv.set(x, y0 + h / 2, z), Q0, S.set(1, h / 0.26, 1)); stem.setMatrixAt(i, M);
    Q.setFromEuler(E.set(r.range(-0.3, 0.3), r() * TAU, r.range(-0.3, 0.3)));
    M.compose(Pv.set(x, y0 + h, z), Q, S.set(s, s, s)); head.setMatrixAt(i, M); centre.setMatrixAt(i, M.compose(Pv.set(x, y0 + h + 0.018 * s, z), Q, S.set(s, s, s)));
    head.setColorAt(i, C.setHSL(r.pick([0.0, 0.05, 0.1, 0.14, 0.58, 0.72, 0.8, 0.9, 0.96]), 0.85, r.range(0.55, 0.72)));
    M.compose(Pv.set(x + 0.04, y0 + h * 0.4, z), Q0, S.set(1.5, 0.6, 1)); leafy.setMatrixAt(i, M);
    i++;
  }
  head.instanceColor.needsUpdate = true; head.castShadow = false; stem.castShadow = false; centre.castShadow = false; leafy.castShadow = false;
  parent.add(stem, head, centre, leafy); worldBag.track(stem); worldBag.track(head); worldBag.track(centre); worldBag.track(leafy);
}
/**
 * The far horizon. Three rings, all outside the playable area so nothing can grow through a roof:
 * a belt of woodland just past the edge, rolling hills behind it, then snow-capped peaks.
 * `clear` is the radius everything must stay outside of — pass the distance to the outermost building.
 * `keep(x, z)` can veto a spot, which is how the shore keeps its hills on the land and out of the sea.
 */
function makeHorizon(game, r, o = {}) {
  const W = game.world, clear = o.clear ?? (game.physics.limit + 6), keep = o.keep ?? (() => true);
  const ground = (x, z) => game.physics.ground0(x, z);
  // peaks
  const rock = mat(o.rock ?? 0x4f6b4a, { roughness: 1 }), rock2 = mat(o.rock2 ?? 0x5e6f78, { roughness: 1 }), snow = mat(o.snow ?? 0xf4f7fb, { roughness: 0.9 });
  const peaks = o.peaks ?? 26, snowLine = o.snowLine ?? 42;
  for (let i = 0; i < peaks; i++) {
    const a = i / peaks * TAU + r.range(-0.09, 0.09), d = clear * r.range(1.35, 1.8), h = r.range(o.peakH ? o.peakH[0] : 34, o.peakH ? o.peakH[1] : 78), w = r.range(26, 54);
    const x = cos(a) * d, z = sin(a) * d, ry = r() * TAU, y0 = ground(x, z);
    if (!keep(x, z)) continue;
    mesh(G.cone(1, 1, 7), i % 3 ? rock : rock2, { x, y: y0 + h / 2 - 3, z, sx: w, sy: h, sz: w, ry, shadow: 'none', parent: W });
    if (h > snowLine) mesh(G.cone(1, 1, 7), snow, { x, y: y0 + h - 3 - h * 0.15, z, sx: w * 0.32, sy: h * 0.3, sz: w * 0.32, ry, shadow: 'none', parent: W });
  }
  // rolling hills, each pushed far enough out that its own radius still clears the town
  if (o.hills !== false) {
    const hill = mat(o.hill ?? 0x5d9a44, { roughness: 1 }), hillN = o.hillCount ?? 24;
    for (let i = 0; i < hillN; i++) {
      const a = i / hillN * TAU + r.range(-0.13, 0.13), rad = r.range(18, 38), d = clear + rad * 0.95 + r.range(0, 16);
      const x = cos(a) * d, z = sin(a) * d, hh = r.range(7, 16);
      if (!keep(x, z)) continue;
      // sunk most of the way into the ground, so only the crown of each dome shows above the horizon
      mesh(G.sphere(1, 16, 10), hill, { x, y: ground(x, z) - hh * 0.55, z, sx: rad, sy: hh, sz: rad, shadow: 'none', parent: W });
    }
  }
  // a belt of woodland in the gap, so the edge of the map reads as countryside carrying on
  if (o.woods !== false) {
    const n = o.woodCount ?? 340, trunkM = mat(o.trunk ?? 0x5a3f28, { roughness: 1 }), leafM = mat(0xffffff, { roughness: 1 });
    const trunks = new THREE.InstancedMesh(G.cyl(0.2, 0.34, 2.8, 5), trunkM, n), tops = new THREE.InstancedMesh(G.cone(1.9, 4.6, 6), leafM, n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), C = new THREE.Color();
    const hue = o.woodHue ?? [0.24, 0.34], lightRange = o.woodLight ?? [0.16, 0.3];
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = clear + 2 + sqrt(r()) * (o.woodBand ?? 34), x = cos(a) * d, z = sin(a) * d, y = ground(x, z), s = keep(x, z) ? r.range(0.8, 1.9) : 0;
      M.compose(Pv.set(x, y + 1.4 * s, z), Q, S.set(s, s, s)); trunks.setMatrixAt(i, M);
      M.compose(Pv.set(x, y + 4.4 * s, z), Q, S.set(s, s, s)); tops.setMatrixAt(i, M);
      tops.setColorAt(i, C.setHSL(r.range(hue[0], hue[1]), 0.5, r.range(lightRange[0], lightRange[1])));
    }
    tops.instanceColor.needsUpdate = true;
    trunks.castShadow = tops.castShadow = false; W.add(trunks, tops); worldBag.track(trunks); worldBag.track(tops);
  }
}
function makePond(parent, x, z, rad, r = rnd) {
  const g = group(x, 0, z, parent);
  mesh(G.cyl(rad, rad, 0.06, 28), mat(0x3d8fd1, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85, emissive: 0x1a4a7a, emissiveIntensity: 0.25 }), { y: 0.02, shadow: 'receive', parent: g });
  mesh(G.cyl(rad + 0.5, rad + 0.6, 0.12, 28), mat(0x8a7f6b, { roughness: 1 }), { y: 0.0, shadow: 'receive', parent: g });
  const stone = mat(0x77736a, { roughness: 1 });
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; mesh(G.sphere(1, 8, 6), stone, { x: cos(a) * (rad + 0.35), y: 0.05, z: sin(a) * (rad + 0.35), sx: r.range(0.18, 0.32), sy: r.range(0.12, 0.2), sz: r.range(0.18, 0.32), parent: g }); }
  const reed = mat(0x5b8f3a, { roughness: 1 });
  for (let i = 0; i < 14; i++) { const a = r() * TAU, d = rad + r.range(0.4, 0.9); mesh(G.cyl(0.02, 0.03, r.range(0.6, 1.1), 5), reed, { x: cos(a) * d, y: 0.4, z: sin(a) * d, rx: r.range(-0.15, 0.15), rz: r.range(-0.15, 0.15), shadow: 'none', parent: g }); }
  for (let i = 0; i < 3; i++) mesh(G.cyl(0.25, 0.25, 0.02, 12), mat(0x3f9a3a, { roughness: 0.6 }), { x: r.range(-rad * 0.6, rad * 0.6), y: 0.06, z: r.range(-rad * 0.6, rad * 0.6), shadow: 'none', parent: g });
  return g;
}

// ---------------------------------------------------------------- neighborhood buildings
/** A neighbour's house: clapboard siding, shuttered windows, a real porch with posts and a roof, optional second storey with a dormer. */
function makeHouse(o, r = rnd) {
  const { w = 7, d = 6, h = 3.1 } = o, storeys = o.storeys ?? 1, H = h * storeys, wallC = o.wall ?? 0xf1e6cf;
  const g = new THREE.Group(), wall = mat(0xffffff, { roughness: 0.9, map: TEX.siding(wallC).clone() }); wall.map.needsUpdate = true; wall.map.repeat.set(w / 2.2, H / 1.6); worldBag.track(wall.map);
  const roof = mat(o.roof ?? 0x8b3a2a, { roughness: 0.85 }), trim = mat(0xffffff, { roughness: 0.6 }), shutter = mat(o.shutter ?? o.roof ?? 0x3f5573, { roughness: 0.8 }), stone = mat(0x9a948a, { roughness: 1, map: TEX.stone(30) });
  const glass = mat(0xbfe7ff, { roughness: 0.1, metalness: 0.3, emissive: 0xffd9a0, emissiveIntensity: o.lit ? 0.5 : 0.08 }), doorM = mat(o.door ?? 0x6b3f22, { roughness: 0.8, map: TEX.planks(25, 30) });
  mesh(G.box(w + 0.2, 0.4, d + 0.2), stone, { y: 0.2, parent: g });                                     // foundation
  mesh(G.box(w, H, d), wall, { y: H / 2, shadow: 'both', parent: g });
  for (let s = 1; s <= storeys; s++) mesh(G.box(w + 0.3, 0.22, d + 0.3), trim, { y: h * s, parent: g });  // fascia band per storey
  for (const [cx, cz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) mesh(G.box(0.18, H, 0.18), trim, { x: cx, y: H / 2, z: cz, shadow: 'none', parent: g });   // corner boards
  mesh(G.gable(d + 0.9, o.roofH ?? 2.4, w + 0.9), roof, { y: H + 0.1, ry: PI / 2, parent: g });
  mesh(G.box(0.7, 1.4, 0.7), mat(0x7a5040, { roughness: 1, map: TEX.brick(14) }), { x: w * 0.3, y: H + 1.6, z: -d * 0.2, parent: g });
  if (o.dormer ?? (storeys > 1 || r.chance(0.4))) { mesh(G.box(1.5, 1.2, 1.4), wall, { x: -w * 0.2, y: H + 0.9, z: d * 0.28, parent: g }); mesh(G.gable(1.7, 0.8, 1.6), roof, { x: -w * 0.2, y: H + 1.5, z: d * 0.28, ry: PI / 2, parent: g }); mesh(G.box(0.8, 0.7, 0.1), glass, { x: -w * 0.2, y: H + 0.95, z: d * 0.28 + 0.72, shadow: 'none', parent: g }); }
  // windows on every storey, front and back, with shutters and a sill; one per storey on each side wall
  const win = (x, y, z, ry = 0) => {
    const q = group(x, y, z, g); q.rotation.y = ry;
    mesh(G.box(1.2, 1.3, 0.12), trim, { z: 0.02, parent: q }); mesh(G.box(1.0, 1.1, 0.14), glass, { z: 0.03, shadow: 'none', parent: q });
    mesh(G.box(0.06, 1.1, 0.16), trim, { z: 0.04, shadow: 'none', parent: q }); mesh(G.box(1.0, 0.06, 0.16), trim, { z: 0.04, shadow: 'none', parent: q });
    for (const s of [-1, 1]) mesh(G.box(0.34, 1.3, 0.06), shutter, { x: s * 0.8, z: 0.02, parent: q });
    mesh(G.box(1.4, 0.08, 0.2), trim, { y: -0.7, z: 0.06, parent: q });
  };
  const dx = o.doorRight ? w * 0.3 : 0;
  for (let s = 0; s < storeys; s++) {
    const y = 1.75 + s * h;
    for (const side of [1, -1]) for (const wx of [-w * 0.3, w * 0.3]) { if (s === 0 && side === 1 && wx === dx) continue; win(wx, y, side * d / 2, side === 1 ? 0 : PI); }
    win(-w / 2, y, 0, -PI / 2); win(w / 2, y, 0, PI / 2);
  }
  // door + porch: deck, two posts, a little roof, a step, a light and a house number
  mesh(G.box(1.2, 2.2, 0.12), trim, { x: dx, y: 1.1, z: d / 2 + 0.02, parent: g });
  mesh(G.box(1.0, 2.05, 0.14), doorM, { x: dx, y: 1.02, z: d / 2 + 0.03, parent: g });
  mesh(G.box(0.6, 0.35, 0.16), glass, { x: dx, y: 1.7, z: d / 2 + 0.04, shadow: 'none', parent: g });
  mesh(G.sphere(0.04, 8, 6), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { x: dx + 0.35, y: 1.0, z: d / 2 + 0.12, shadow: 'none', parent: g });
  mesh(G.box(3.0, 0.22, 1.5), mat(0xb9b2a6, { roughness: 0.95, map: TEX.planks(30, 44) }), { x: dx, y: 0.11, z: d / 2 + 0.75, shadow: 'receive', parent: g });
  mesh(G.box(1.4, 0.12, 0.5), mat(0xb9b2a6, { roughness: 0.95 }), { x: dx, y: 0.06, z: d / 2 + 1.75, shadow: 'receive', parent: g });
  for (const s of [-1, 1]) { mesh(G.box(0.14, 2.5, 0.14), trim, { x: dx + s * 1.35, y: 1.35, z: d / 2 + 1.35, parent: g }); for (let i = 0; i < 4; i++) mesh(G.box(0.05, 0.7, 0.05), trim, { x: dx + s * 1.35, y: 0.55, z: d / 2 + 0.25 + i * 0.32, shadow: 'none', parent: g }); mesh(G.box(0.06, 0.06, 1.2), trim, { x: dx + s * 1.35, y: 0.9, z: d / 2 + 0.75, shadow: 'none', parent: g }); }
  mesh(G.box(3.4, 0.1, 1.9), roof, { x: dx, y: 2.72, z: d / 2 + 1.0, rx: 0.16, parent: g }); mesh(G.box(3.4, 0.14, 0.14), trim, { x: dx, y: 2.6, z: d / 2 + 1.5, parent: g });
  mesh(G.sphere(0.08, 8, 6), glowMat(0xffe3a0, 1.5), { x: dx + 0.75, y: 2.15, z: d / 2 + 0.12, shadow: 'none', parent: g });
  mesh(G.box(0.3, 0.2, 0.04), mat(0x2b2b2b), { x: dx - 0.8, y: 1.9, z: d / 2 + 0.08, shadow: 'none', parent: g });
  if (o.lit) mesh(G.box(1.1, 0.3, 0.5), mat(r.pick([0xd62839, 0x2f6fd6, 0xffd54a]), { roughness: 0.9 }), { x: -w * 0.3, y: 1.1, z: d / 2 + 0.3, parent: g });   // window box
  g.userData.h = H + (o.roofH ?? 2.4);
  return g;
}

/**
 * The player's home: four rooms (living room, kitchen, bedroom, bathroom) with real doorways, real windows and furniture.
 * Footprint 10.4 × 8.4 m; the front door is at x 0.4..1.4 on the +z wall. Returns { group, door }.
 */
function makeHome(game) {
  const g = new THREE.Group(), P = game.physics;
  const wall = mat(0xf3ead6, { roughness: 0.9 }), inner = mat(0xe9dcc4, { roughness: 0.95 }), trim = mat(0xffffff, { roughness: 0.6 }), roof = mat(0x8b3a2a, { roughness: 0.85 });
  const siding = mat(0xffffff, { roughness: 0.9, map: TEX.siding(0xf3ead6).clone() }); siding.map.needsUpdate = true; siding.map.repeat.set(4, 1.7); worldBag.track(siding.map);
  const planks = mat(0xa9764a, { roughness: 0.8, map: TEX.planks(28, 38).clone() }); planks.map.needsUpdate = true; planks.map.repeat.set(4, 4); worldBag.track(planks.map);
  const tile = mat(0xffffff, { roughness: 0.4, map: TEX.tiles() }), tileK = mat(0xffffff, { roughness: 0.5, map: TEX.tiles('#f3e8d2', '#d9c9a8') });
  const glass = mat(0xbfe7ff, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.35 }), frosted = mat(0xdfeff8, { roughness: 0.4, transparent: true, opacity: 0.8 });
  const W = 10.4, D = 8.4, H = 2.7, T = 0.2, F = 0.16;
  // floor by room, ceiling, roof, chimney
  mesh(G.box(7.1, F, 4.8), planks, { x: -1.65, y: F / 2, z: 1.8, shadow: 'receive', parent: g });        // living room
  mesh(G.box(7.1, F, 3.6), tileK, { x: -1.65, y: F / 2, z: -2.4, shadow: 'receive', parent: g });        // kitchen
  mesh(G.box(3.3, F, 4.8), planks, { x: 3.55, y: F / 2, z: -1.8, shadow: 'receive', parent: g });        // bedroom
  mesh(G.box(3.3, F, 3.6), tile, { x: 3.55, y: F / 2, z: 2.4, shadow: 'receive', parent: g });           // bathroom
  P.addBox(0, F / 2, 0, W, F, D, { cam: false });
  mesh(G.box(W + 0.4, 0.1, D + 0.4), inner, { y: H + 0.05, shadow: 'none', parent: g }); P.addBox(0, H + 0.05, 0, W + 0.4, 0.1, D + 0.4, { walk: false });
  mesh(G.box(W + 0.5, 0.3, D + 0.5), trim, { y: H + 0.15, parent: g });
  mesh(G.gable(D + 1.2, 3.0, W + 1.2), roof, { y: H + 0.28, ry: PI / 2, parent: g }); P.addBox(0, H + 1.8, 0, W + 1.2, 3.0, D + 1.2, { walk: false });
  mesh(G.box(0.8, 1.9, 0.8), mat(0x7a5040, { roughness: 1, map: TEX.brick(14) }), { x: -3.2, y: H + 2.5, z: -1.4, parent: g });
  mesh(G.box(2.0, 1.3, 1.6), siding, { x: 3.0, y: H + 1.1, z: 2.6, parent: g }); mesh(G.gable(2.3, 0.9, 1.9), roof, { x: 3.0, y: H + 1.75, z: 2.6, ry: PI / 2, parent: g }); mesh(G.box(1.0, 0.8, 0.1), glass, { x: 3.0, y: H + 1.15, z: 3.42, shadow: 'none', parent: g });   // dormer
  /**
   * A wall along one axis with openings. axis 'x': the wall runs along x at z=fixed; axis 'z': runs along z at x=fixed.
   * holes: [{ a, b, y0, y1 }] — a..b along the axis, y0..y1 the opening. Pieces are solid walls + colliders; the strip above an
   * opening is a collider the small player forms pass under (its bottom is above their height).
   */
  const buildWall = (axis, fixed, from, to, holes, m = wall) => {
    const piece = (a, b, y0, y1) => { if (b - a < 0.01 || y1 - y0 < 0.01) return; const c = (a + b) / 2, len = b - a, cy = (y0 + y1) / 2, h = y1 - y0;
      if (axis === 'x') { mesh(G.box(len, h, T), m, { x: c, y: cy, z: fixed, shadow: 'both', parent: g }); P.addBox(c, cy, fixed, len, h, T, { walk: false }); }
      else { mesh(G.box(T, h, len), m, { x: fixed, y: cy, z: c, shadow: 'both', parent: g }); P.addBox(fixed, cy, c, T, h, len, { walk: false }); } };
    let cur = from;
    for (const hole of [...holes].sort((p, q) => p.a - q.a)) { piece(cur, hole.a, 0, H); piece(hole.a, hole.b, 0, hole.y0); piece(hole.a, hole.b, hole.y1, H); cur = hole.b; }
    piece(cur, to, 0, H);
  };
  const WIN = (c, w = 1.1) => ({ a: c - w / 2, b: c + w / 2, y0: 1.05, y1: 2.15 }), DOOR = (c, w = 1.0) => ({ a: c - w / 2, b: c + w / 2, y0: 0, y1: 2.04 });
  const win = (x, z, ry, m = glass) => {   // glass + frame + cross bars, seen from both sides
    const q = group(x, 1.6, z, g); q.rotation.y = ry;
    mesh(G.box(1.1, 1.1, 0.08), m, { shadow: 'none', parent: q });
    mesh(G.box(1.3, 0.1, T + 0.06), trim, { y: -0.6, parent: q }); mesh(G.box(1.3, 0.1, T + 0.06), trim, { y: 0.6, parent: q });
    mesh(G.box(0.1, 1.3, T + 0.06), trim, { x: -0.6, parent: q }); mesh(G.box(0.1, 1.3, T + 0.06), trim, { x: 0.6, parent: q });
    mesh(G.box(0.05, 1.1, T + 0.04), trim, { shadow: 'none', parent: q }); mesh(G.box(1.1, 0.05, T + 0.04), trim, { shadow: 'none', parent: q });
    for (const s of [-1, 1]) mesh(G.box(0.3, 1.3, 0.05), mat(0x3f5573, { roughness: 0.8 }), { x: s * 0.82, z: ry === 0 || ry === PI ? 0.12 : 0.12, shadow: 'none', parent: q });   // shutters (outside)
  };
  // outer walls (siding outside is the same mesh; interior paint shares it — fine for a cosy house)
  buildWall('x', D / 2, -W / 2, W / 2, [WIN(-2.6), DOOR(0.9), WIN(3.6)], siding);          // front
  buildWall('x', -D / 2, -W / 2, W / 2, [WIN(-2.6), WIN(3.6)], siding);                    // back
  buildWall('z', -W / 2, -D / 2, D / 2, [WIN(2.0)], siding);                                // left
  buildWall('z', W / 2, -D / 2, D / 2, [WIN(-2.2)], siding);                                // right
  win(-2.6, D / 2, 0); win(3.6, D / 2, 0, frosted); win(-2.6, -D / 2, PI); win(3.6, -D / 2, PI); win(-W / 2, 2.0, -PI / 2); win(W / 2, -2.2, PI / 2);
  // interior walls: living|kitchen (z=-0.6), left|right (x=1.9), bedroom|bathroom (z=0.6)
  buildWall('x', -0.6, -W / 2, 1.9, [DOOR(-0.7)]);
  buildWall('z', 1.9, -D / 2, D / 2, [DOOR(-1.7), DOOR(2.1)]);
  buildWall('x', 0.6, 1.9, W / 2, []);
  for (const [x, z, ry] of [[-0.7, -0.6, 0], [1.9, -1.7, PI / 2], [1.9, 2.1, PI / 2]]) { const q = group(x, 0, z, g); q.rotation.y = ry; for (const s of [-1, 1]) mesh(G.box(0.08, 2.1, T + 0.04), trim, { x: s * 0.54, y: 1.05, parent: q }); mesh(G.box(1.16, 0.08, T + 0.04), trim, { y: 2.08, parent: q }); }   // door frames
  for (const cx of [-3.3, -1.9]) mesh(G.box(0.34, 1.5, 0.06), mat(0xc94f6a, { roughness: 0.9 }), { x: cx, y: 1.55, z: D / 2 - 0.16, shadow: 'none', parent: g });   // curtains
  // front door (hinge on the left edge of the doorway) + frame
  const door = group(0.4, 0, D / 2, g);
  const doorMat = mat(0x6b3f22, { roughness: 0.8, map: TEX.planks(25, 30) });
  mesh(G.box(0.96, 2.0, 0.07), doorMat, { x: 0.49, y: 1.0, parent: door });
  mesh(G.box(0.5, 0.3, 0.09), glass, { x: 0.49, y: 1.6, shadow: 'none', parent: door });
  for (const dz of [0.06, -0.06]) mesh(G.sphere(0.035, 8, 6), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { x: 0.86, y: 1.0, z: dz, shadow: 'none', parent: door });
  mesh(G.box(0.1, 2.1, T + 0.06), trim, { x: 0.35, y: 1.05, z: D / 2, parent: g }); mesh(G.box(0.1, 2.1, T + 0.06), trim, { x: 1.45, y: 1.05, z: D / 2, parent: g }); mesh(G.box(1.3, 0.1, T + 0.06), trim, { x: 0.9, y: 2.09, z: D / 2, parent: g });
  const doorCol = P.addBox(0.9, 1.0, D / 2, 1.0, 2.0, 0.2);
  const doorState = { open: false };
  doorState.open = () => { if (doorState.isOpen) return; doorState.isOpen = true; P.removeBox(doorCol); SFX.door(); tween(0.7, (k) => { door.rotation.y = -1.85 * k; }); };
  // porch with posts and a little roof + light + doormat
  mesh(G.box(3.2, F, 1.4), mat(0xb9b2a6, { roughness: 0.95, map: TEX.planks(30, 44) }), { x: 0.9, y: F / 2, z: D / 2 + 0.7, shadow: 'receive', parent: g }); P.addBox(0.9, F / 2, D / 2 + 0.7, 3.2, F, 1.4, { cam: false });
  mesh(G.box(1.2, 0.02, 0.6), mat(0x8a5a32, { roughness: 1 }), { x: 0.9, y: F + 0.01, z: D / 2 + 0.5, shadow: 'none', parent: g });
  for (const s of [-1, 1]) { mesh(G.box(0.14, 2.5, 0.14), trim, { x: 0.9 + s * 1.45, y: 1.25, z: D / 2 + 1.3, parent: g }); P.addBox(0.9 + s * 1.45, 1.25, D / 2 + 1.3, 0.14, 2.5, 0.14, { cam: false }); }
  mesh(G.box(3.6, 0.1, 1.8), roof, { x: 0.9, y: 2.62, z: D / 2 + 0.95, rx: 0.16, parent: g });
  mesh(G.sphere(0.08, 8, 6), glowMat(0xffe3a0, 1.4), { x: 1.7, y: 2.3, z: D / 2 + 0.12, shadow: 'none', parent: g });
  const addF = (geo, m, x, y, z, w, h, d, opts) => { const mm = mesh(geo, m, { x, y, z, shadow: 'both', parent: g }); if (w) P.addBox(x, y, z, w, h, d, opts); return mm; };
  // ---- living room (x -5.2..1.9, z -0.6..4.2): couch, rug, coffee table, bookshelf, TV, lamp, plant
  const couch = mat(0x3f5fbf, { roughness: 0.95 }), couchD = mat(0x34509f, { roughness: 0.95 });
  addF(G.box(1.9, 0.44, 0.85), couch, -3.0, F + 0.22, 0.1, 1.9, 0.44, 0.85, { cam: false });
  addF(G.box(1.9, 0.6, 0.22), couchD, -3.0, F + 0.74, -0.24, 1.9, 0.6, 0.22, { cam: false });
  addF(G.box(0.22, 0.62, 0.85), couchD, -4.06, F + 0.31, 0.1, 0.22, 0.62, 0.85, { cam: false });
  addF(G.box(0.22, 0.62, 0.85), couchD, -1.94, F + 0.31, 0.1, 0.22, 0.62, 0.85, { cam: false });
  for (const cx of [-3.42, -2.58]) mesh(G.box(0.78, 0.1, 0.7), mat(0x4a6ad0, { roughness: 1 }), { x: cx, y: F + 0.49, z: 0.15, shadow: 'none', parent: g });
  mesh(G.sphere(0.17, 10, 8), mat(0xff6f61, { roughness: 1 }), { x: -3.6, y: F + 0.66, z: 0.0, sy: 0.6, parent: g }); mesh(G.sphere(0.17, 10, 8), mat(0x8bc34a, { roughness: 1 }), { x: -2.4, y: F + 0.66, z: 0.0, sy: 0.6, parent: g });
  mesh(G.cyl(1.6, 1.6, 0.03, 28), mat(0xb03a48, { roughness: 1 }), { x: -2.6, y: F + 0.015, z: 1.8, shadow: 'receive', parent: g }); mesh(G.cyl(1.1, 1.1, 0.032, 28), mat(0xe8c9a0, { roughness: 1 }), { x: -2.6, y: F + 0.016, z: 1.8, shadow: 'receive', parent: g });
  const tableM = mat(0x8a5a32, { roughness: 0.7, map: TEX.planks(28, 32) });
  addF(G.box(1.2, 0.07, 0.65), tableM, -2.9, F + 0.5, 1.5, 1.2, 0.5, 0.65, { cam: false });
  for (const [lx, lz] of [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]]) mesh(G.cyl(0.035, 0.035, 0.48, 6), tableM, { x: -2.9 + lx, y: F + 0.24, z: 1.5 + lz, parent: g });
  mesh(G.cyl(0.07, 0.06, 0.12, 10), mat(0xffffff, { roughness: 0.4 }), { x: -2.6, y: F + 0.6, z: 1.55, parent: g }); mesh(G.torus(0.05, 0.012, 6, 12), mat(0xffffff, { roughness: 0.4 }), { x: -2.52, y: F + 0.6, z: 1.55, parent: g });
  addF(G.box(0.36, 2.0, 1.6), mat(0x6e4a2b, { roughness: 0.8 }), -4.95, F + 1.0, 2.9, 0.36, 2.0, 1.6, { cam: false });   // bookshelf on the left wall
  const bookR = seeded(42);
  for (let s = 0; s < 4; s++) { for (let b = 0; b < 8; b++) mesh(G.box(0.22, bookR.range(0.22, 0.32), 0.12), mat(new THREE.Color().setHSL(bookR(), 0.6, 0.45), { roughness: 0.9 }), { x: -4.9, y: F + 0.32 + s * 0.47, z: 2.22 + b * 0.17, shadow: 'none', parent: g }); mesh(G.box(0.36, 0.03, 1.6), mat(0x8a6a48), { x: -4.95, y: F + 0.15 + s * 0.47, z: 2.9, shadow: 'none', parent: g }); }
  addF(G.box(1.4, 0.5, 0.45), mat(0x3a2a1a, { roughness: 0.8 }), -0.2, F + 0.25, 3.95, 1.4, 0.5, 0.45, { cam: false });                                   // TV stand under the front window's neighbour
  mesh(G.box(1.2, 0.7, 0.06), mat(0x111111, { roughness: 0.3 }), { x: -0.2, y: F + 0.9, z: 3.95, parent: g }); mesh(G.box(1.1, 0.6, 0.02), mat(0x2a4a7a, { emissive: 0x3a7ad8, emissiveIntensity: 0.35 }), { x: -0.2, y: F + 0.9, z: 3.91, shadow: 'none', parent: g });
  mesh(G.cyl(0.2, 0.22, 0.04, 12), mat(0x333333), { x: 1.5, y: F + 0.02, z: 0.0, parent: g }); mesh(G.cyl(0.02, 0.02, 1.55, 6), mat(0x999999, { metalness: 0.8, roughness: 0.4 }), { x: 1.5, y: F + 0.8, z: 0.0, parent: g });
  mesh(G.cyl(0.22, 0.32, 0.4, 14), mat(0xf6d8a8, { roughness: 0.9, emissive: 0xffc78a, emissiveIntensity: 0.6, side: THREE.DoubleSide }), { x: 1.5, y: F + 1.75, z: 0.0, shadow: 'none', parent: g });
  pointLight(0xffc78a, 18, 10, 1.5, F + 1.6, 0.0, g); P.addBox(1.5, 0.9, 0.0, 0.4, 1.8, 0.4, { cam: false });
  mesh(G.cyl(0.18, 0.14, 0.32, 10), mat(0xc0603a, { roughness: 0.9 }), { x: -4.7, y: F + 0.16, z: 3.8, parent: g });
  for (let i = 0; i < 6; i++) mesh(G.sphere(0.16, 8, 6), mat(0x3f9a3a, { roughness: 1 }), { x: -4.7 + rnd.range(-0.15, 0.15), y: F + 0.5 + rnd.range(0, 0.25), z: 3.8 + rnd.range(-0.15, 0.15), sy: 0.7, parent: g });
  P.addBox(-4.7, 0.4, 3.8, 0.4, 0.8, 0.4, { cam: false });
  mesh(G.box(0.05, 0.7, 0.9), mat(0x3d2a1a), { x: 1.78, y: 1.7, z: 0.6, shadow: 'none', parent: g }); mesh(G.box(0.02, 0.56, 0.76), mat(0x87b7e8, { emissive: 0x2a5a9a, emissiveIntensity: 0.2 }), { x: 1.75, y: 1.7, z: 0.6, shadow: 'none', parent: g }); mesh(G.box(0.01, 0.2, 0.7), mat(0x5a9a3a), { x: 1.74, y: 1.5, z: 0.6, shadow: 'none', parent: g });
  // ---- kitchen (x -5.2..1.9, z -4.2..-0.6): counter with sink and stove, fridge, table + chairs, cat bowls
  const counterM = mat(0xdfd6c6, { roughness: 0.8 }), topM = mat(0x5a4a3a, { roughness: 0.5 }), steel = mat(0xbfc5cc, { metalness: 0.8, roughness: 0.3 });
  addF(G.box(4.4, 0.85, 0.6), counterM, -3.0, F + 0.425, -3.85, 4.4, 0.85, 0.6, { cam: false }); mesh(G.box(4.5, 0.06, 0.66), topM, { x: -3.0, y: F + 0.88, z: -3.85, parent: g });
  for (let i = 0; i < 5; i++) mesh(G.box(0.02, 0.6, 0.02), mat(0x8a8a8a), { x: -5.0 + i * 0.88, y: F + 0.4, z: -3.55, shadow: 'none', parent: g });
  mesh(G.box(0.7, 0.05, 0.42), steel, { x: -2.6, y: F + 0.9, z: -3.85, shadow: 'none', parent: g }); mesh(G.box(0.6, 0.2, 0.34), mat(0x9aa0a6, { metalness: 0.8, roughness: 0.3 }), { x: -2.6, y: F + 0.82, z: -3.85, shadow: 'none', parent: g }); mesh(G.cyl(0.02, 0.02, 0.3, 6), steel, { x: -2.6, y: F + 1.05, z: -4.05, rx: 0.4, parent: g });
  mesh(G.box(0.8, 0.03, 0.5), mat(0x222222, { roughness: 0.4 }), { x: -4.2, y: F + 0.92, z: -3.85, shadow: 'none', parent: g }); for (const [ox, oz] of [[-0.18, -0.12], [0.18, -0.12], [-0.18, 0.12], [0.18, 0.12]]) mesh(G.torus(0.09, 0.015, 6, 14), mat(0x444444), { x: -4.2 + ox, y: F + 0.945, z: -3.85 + oz, rx: PI / 2, shadow: 'none', parent: g });
  for (let i = 0; i < 4; i++) mesh(G.box(0.9, 0.5, 0.4), counterM, { x: -4.4 + i * 1.0, y: F + 2.2, z: -3.95, parent: g });   // wall cupboards
  addF(G.box(0.8, 1.9, 0.75), mat(0xe8ecef, { roughness: 0.4 }), 1.3, F + 0.95, -3.75, 0.8, 1.9, 0.75, { cam: false }); mesh(G.box(0.03, 0.4, 0.04), steel, { x: 0.95, y: F + 1.4, z: -3.36, shadow: 'none', parent: g }); mesh(G.box(0.03, 0.3, 0.04), steel, { x: 0.95, y: F + 0.6, z: -3.36, shadow: 'none', parent: g });
  addF(G.cyl(0.65, 0.65, 0.06, 20), tableM, -2.2, F + 0.72, -2.0, 1.3, 0.75, 1.3, { cam: false }); mesh(G.cyl(0.06, 0.08, 0.7, 8), tableM, { x: -2.2, y: F + 0.35, z: -2.0, parent: g });
  mesh(G.cyl(0.2, 0.2, 0.06, 12), mat(0xffffff, { roughness: 0.5 }), { x: -2.2, y: F + 0.78, z: -2.0, shadow: 'none', parent: g }); for (const [fx, fz, c] of [[-0.06, 0.04, 0xff5c2a], [0.07, -0.03, 0xffd54a], [0, 0.08, 0x8bc34a]]) mesh(G.sphere(0.06, 8, 6), mat(c, { roughness: 0.6 }), { x: -2.2 + fx, y: F + 0.86, z: -2.0 + fz, shadow: 'none', parent: g });
  for (const [cx, cz, ry] of [[-3.1, -2.0, PI / 2], [-1.3, -2.0, -PI / 2]]) { const q = group(cx, F, cz, g); q.rotation.y = ry; mesh(G.box(0.42, 0.05, 0.42), tableM, { y: 0.45, parent: q }); mesh(G.box(0.42, 0.5, 0.05), tableM, { y: 0.72, z: -0.2, parent: q }); for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) mesh(G.box(0.04, 0.45, 0.04), tableM, { x: lx, y: 0.22, z: lz, parent: q }); P.addBox(cx, F + 0.4, cz, 0.45, 0.8, 0.45, { cam: false }); }
  for (const [bx, c] of [[0.5, 0xd62839], [0.85, 0x2f6fd6]]) { mesh(G.cyl(0.12, 0.1, 0.06, 12), mat(c, { roughness: 0.5 }), { x: bx, y: F + 0.03, z: -1.0, parent: g }); mesh(G.cyl(0.09, 0.09, 0.02, 12), mat(bx < 0.7 ? 0x8a5a32 : 0x7fd7ff, { roughness: 0.6 }), { x: bx, y: F + 0.065, z: -1.0, shadow: 'none', parent: g }); }   // cat bowls
  // ---- bedroom (x 1.9..5.2, z -4.2..0.6): bed, wardrobe, nightstand with a lamp, rug, cat bed
  addF(G.box(1.5, 0.45, 2.1), mat(0x6e4a2b, { roughness: 0.8 }), 4.3, F + 0.225, -2.4, 1.5, 0.45, 2.1, { cam: false }); mesh(G.box(1.4, 0.22, 2.0), mat(0xf4f0e8, { roughness: 1 }), { x: 4.3, y: F + 0.56, z: -2.4, parent: g });
  mesh(G.box(1.4, 0.18, 1.3), mat(0x8e6ba8, { roughness: 1 }), { x: 4.3, y: F + 0.74, z: -2.0, parent: g }); mesh(G.box(0.55, 0.16, 0.36), mat(0xffffff, { roughness: 1 }), { x: 4.3, y: F + 0.75, z: -3.2, parent: g });
  mesh(G.box(1.5, 0.9, 0.08), mat(0x6e4a2b, { roughness: 0.8 }), { x: 4.3, y: F + 0.7, z: -3.5, parent: g });
  addF(G.box(1.1, 2.1, 0.6), mat(0x8a6a48, { roughness: 0.8 }), 2.6, F + 1.05, -3.85, 1.1, 2.1, 0.6, { cam: false }); mesh(G.box(0.02, 1.9, 0.02), mat(0x3a2a1a), { x: 2.6, y: F + 1.05, z: -3.54, shadow: 'none', parent: g }); for (const s of [-1, 1]) mesh(G.sphere(0.03, 6, 5), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { x: 2.6 + s * 0.08, y: F + 1.05, z: -3.53, shadow: 'none', parent: g });
  addF(G.box(0.5, 0.55, 0.5), mat(0x8a6a48, { roughness: 0.8 }), 3.2, F + 0.275, -3.6, 0.5, 0.55, 0.5, { cam: false }); mesh(G.cyl(0.1, 0.13, 0.22, 10), mat(0xf6d8a8, { emissive: 0xffc78a, emissiveIntensity: 0.6 }), { x: 3.2, y: F + 0.72, z: -3.6, shadow: 'none', parent: g }); pointLight(0xffc78a, 6, 6, 3.2, F + 0.8, -3.6, g);
  mesh(G.cyl(0.9, 0.9, 0.03, 20), mat(0x4a7a8a, { roughness: 1 }), { x: 3.4, y: F + 0.015, z: -0.6, shadow: 'receive', parent: g });
  mesh(G.torus(0.42, 0.14, 8, 22), mat(0x8e6ba8, { roughness: 1 }), { x: 2.8, y: F + 0.12, z: -0.4, rx: PI / 2, parent: g }); mesh(G.cyl(0.42, 0.42, 0.06, 22), mat(0xd9c7e8, { roughness: 1 }), { x: 2.8, y: F + 0.05, z: -0.4, shadow: 'receive', parent: g });   // cat bed
  mesh(G.box(0.04, 0.6, 0.8), mat(0x3d2a1a), { x: 5.15, y: 1.75, z: 0.0, shadow: 'none', parent: g }); mesh(G.box(0.02, 0.48, 0.68), mat(0xffb3c1, { emissive: 0xff8fab, emissiveIntensity: 0.15 }), { x: 5.13, y: 1.75, z: 0.0, shadow: 'none', parent: g });
  // ---- bathroom (x 1.9..5.2, z 0.6..4.2): tub, toilet, sink + mirror, mat, towel
  const white = mat(0xf7f9fb, { roughness: 0.25 });
  addF(G.box(1.7, 0.6, 0.8), white, 4.25, F + 0.3, 3.7, 1.7, 0.6, 0.8, { cam: false }); mesh(G.box(1.5, 0.05, 0.6), mat(0x9fd8f0, { roughness: 0.1, transparent: true, opacity: 0.7 }), { x: 4.25, y: F + 0.55, z: 3.7, shadow: 'none', parent: g });
  mesh(G.cyl(0.02, 0.02, 0.3, 6), steel, { x: 4.25, y: F + 0.75, z: 4.05, parent: g }); mesh(G.box(0.12, 0.05, 0.16), steel, { x: 4.25, y: F + 0.9, z: 4.0, shadow: 'none', parent: g });
  const toilet = group(2.5, F, 3.6, g); mesh(G.cyl(0.24, 0.2, 0.4, 14), white, { y: 0.2, parent: toilet }); mesh(G.cyl(0.28, 0.28, 0.06, 14), white, { y: 0.43, z: 0.02, parent: toilet }); mesh(G.box(0.45, 0.5, 0.2), white, { y: 0.55, z: -0.3, parent: toilet }); mesh(G.box(0.06, 0.03, 0.08), steel, { x: 0.15, y: 0.82, z: -0.3, shadow: 'none', parent: toilet }); P.addBox(2.5, F + 0.4, 3.6, 0.6, 0.8, 0.7, { cam: false });
  addF(G.cyl(0.12, 0.16, 0.7, 12), white, 4.6, F + 0.35, 1.2, 0.5, 0.8, 0.5, { cam: false }); mesh(G.box(0.5, 0.12, 0.42), white, { x: 4.6, y: F + 0.76, z: 1.2, parent: g }); mesh(G.cyl(0.015, 0.015, 0.2, 6), steel, { x: 4.6, y: F + 0.9, z: 1.05, rx: 0.5, parent: g });
  mesh(G.box(0.03, 0.6, 0.5), mat(0xc9d6e2, { roughness: 0.05, metalness: 0.9 }), { x: 5.13, y: 1.6, z: 1.2, shadow: 'none', parent: g }); mesh(G.box(0.05, 0.68, 0.58), mat(0x3d2a1a), { x: 5.15, y: 1.6, z: 1.2, shadow: 'none', parent: g });
  mesh(G.box(0.7, 0.02, 0.5), mat(0x7fb0d0, { roughness: 1 }), { x: 4.3, y: F + 0.01, z: 3.0, shadow: 'none', parent: g }); mesh(G.box(0.05, 0.5, 0.35), mat(0xffd54a, { roughness: 1 }), { x: 1.98, y: 1.3, z: 3.2, shadow: 'none', parent: g });
  game.addInteractable({ obj: door, radius: 2.2, label: () => doorState.isOpen ? null : 'Open the door', onUse: () => { doorState.open(); game.toast('🚪 The door creaks open…'); } });
  return { group: g, door: doorState, size: [W, D, H] };
}

function makeFence(len, color = 0x2e63d8) {
  const g = new THREE.Group(), m = mat(color, { roughness: 0.8 }), n = floor(len / 0.32);
  for (let i = 0; i <= n; i++) { const x = -len / 2 + i * (len / n); mesh(G.box(0.09, 1.0 + (i % 2 ? 0 : 0.08), 0.05), m, { x, y: 0.5, parent: g }); mesh(G.cone(0.065, 0.12, 4), m, { x, y: 1.06 + (i % 2 ? 0 : 0.08), ry: PI / 4, shadow: 'none', parent: g }); }
  mesh(G.box(len, 0.08, 0.04), m, { y: 0.78, z: -0.04, shadow: 'none', parent: g }); mesh(G.box(len, 0.08, 0.04), m, { y: 0.32, z: -0.04, shadow: 'none', parent: g });
  return g;
}
function makeCar(color) {
  const g = new THREE.Group(), body = mat(color, { roughness: 0.3, metalness: 0.4 }), glass = mat(0x223344, { roughness: 0.1, metalness: 0.6 }), tire = mat(0x1a1a1a, { roughness: 0.9 }), rim = mat(0xcccccc, { metalness: 0.9, roughness: 0.3 });
  mesh(G.box(1.8, 0.55, 4.0), body, { y: 0.55, parent: g });
  mesh(G.box(1.6, 0.5, 2.0), body, { y: 1.05, z: -0.2, parent: g });
  mesh(G.box(1.62, 0.36, 2.02), glass, { y: 1.08, z: -0.2, shadow: 'none', parent: g });
  mesh(G.box(1.5, 0.08, 0.2), glowMat(0xfff2c0, 1.6), { y: 0.55, z: 2.0, shadow: 'none', parent: g });
  mesh(G.box(1.5, 0.08, 0.2), glowMat(0xff2222, 1.2), { y: 0.55, z: -2.0, shadow: 'none', parent: g });
  mesh(G.box(1.9, 0.12, 0.3), mat(0x333333), { y: 0.35, z: 2.0, parent: g }); mesh(G.box(1.9, 0.12, 0.3), mat(0x333333), { y: 0.35, z: -2.0, parent: g });
  const wheels = [];
  for (const [x, z] of [[0.85, 1.3], [-0.85, 1.3], [0.85, -1.3], [-0.85, -1.3]]) {
    const w = group(x, 0.3, z, g); mesh(G.cyl(0.3, 0.3, 0.22, 14), tire, { rz: PI / 2, parent: w }); mesh(G.cyl(0.16, 0.16, 0.23, 8), rim, { rz: PI / 2, shadow: 'none', parent: w }); wheels.push(w);
  }
  return { group: g, wheels };
}
function makeLamp(style) {
  const g = new THREE.Group();
  if (style === 'victorian') {
    const iron = mat(0x1e2426, { roughness: 0.6, metalness: 0.5 });
    mesh(G.cyl(0.14, 0.2, 0.3, 8), iron, { y: 0.15, parent: g }); mesh(G.cyl(0.05, 0.08, 3.4, 8), iron, { y: 1.9, parent: g });
    mesh(G.cyl(0.02, 0.02, 0.4, 6), iron, { y: 3.6, parent: g }); mesh(G.cone(0.25, 0.25, 6), iron, { y: 4.15, parent: g });
    mesh(G.box(0.34, 0.45, 0.34), mat(0xffe6a8, { roughness: 0.3, transparent: true, opacity: 0.85, emissive: 0xffc46a, emissiveIntensity: 1.6 }), { y: 3.82, shadow: 'none', parent: g });
    for (const a of [0, PI / 2]) mesh(G.box(0.38, 0.04, 0.04), iron, { y: 3.6, ry: a, shadow: 'none', parent: g });
    glowSprite(0xffb85a, 2.2, 0.45, g).position.y = 3.85;
    g.userData.light = pointLight(0xffb060, 42, 18, 0, 3.7, 0, g);
  } else {
    const m = mat(0x4a4f57, { roughness: 0.5, metalness: 0.6 });
    mesh(G.cyl(0.08, 0.1, 4.5, 8), m, { y: 2.25, parent: g }); mesh(G.box(1.0, 0.08, 0.08), m, { x: 0.45, y: 4.5, parent: g });
    mesh(G.box(0.5, 0.14, 0.3), mat(0xeeeeee, { emissive: 0xfff3c4, emissiveIntensity: 0.6 }), { x: 0.85, y: 4.45, shadow: 'none', parent: g });
    g.userData.light = pointLight(0xfff0c0, 0, 16, 0.85, 4.2, 0, g); g.userData.streetLamp = true;
  }
  return g;
}
function makeBench() {
  const g = new THREE.Group(), wood = mat(0x8a5a32, { roughness: 0.8, map: TEX.planks(28, 32) }), iron = mat(0x2b2b2b, { metalness: 0.7, roughness: 0.4 });
  for (let i = 0; i < 3; i++) mesh(G.box(1.8, 0.05, 0.12), wood, { y: 0.48, z: -0.14 + i * 0.14, parent: g });
  for (let i = 0; i < 2; i++) mesh(G.box(1.8, 0.05, 0.12), wood, { y: 0.72 + i * 0.16, z: -0.32, rx: 0.2, parent: g });
  for (const x of [-0.8, 0.8]) { mesh(G.box(0.06, 0.48, 0.5), iron, { x, y: 0.24, parent: g }); mesh(G.box(0.06, 0.5, 0.06), iron, { x, y: 0.7, z: -0.33, rx: 0.2, parent: g }); }
  return g;
}
function makeMailbox(color) {
  const g = new THREE.Group();
  mesh(G.box(0.08, 1.1, 0.08), mat(0x5a3b22), { y: 0.55, parent: g });
  mesh(G.box(0.3, 0.3, 0.5), mat(color, { roughness: 0.5, metalness: 0.3 }), { y: 1.25, parent: g });
  mesh(G.cyl(0.15, 0.15, 0.5, 10), mat(color, { roughness: 0.5, metalness: 0.3 }), { y: 1.4, rx: PI / 2, parent: g });
  mesh(G.box(0.03, 0.2, 0.08), mat(0xd62839), { x: 0.17, y: 1.45, z: 0.1, shadow: 'none', parent: g });
  return g;
}

// ---------------------------------------------------------------- portals & doors
/**
 * A floating marker that hangs high above the cat's own house so it can be found from anywhere in the
 * neighbourhood: a badge, a soft halo and a bobbing arrow pointing straight down at the roof.
 */
function makeHomeBeacon(game, x, z, y = 14, emoji = '\u{1F3E0}') {
  const g = group(x, y, z, game.world);
  const sm = new THREE.SpriteMaterial({ map: TEX.badge(emoji), transparent: true, depthWrite: false, sizeAttenuation: true });
  worldBag.track(sm);
  const badge = new THREE.Sprite(sm); badge.scale.set(3, 3, 1); g.add(badge);
  const halo = glowSprite(0xffd36a, 8, 0.4, g);
  // a soft column of light down to the roof, so the marker still reads from across the neighbourhood
  const beamM = basic(0xffd36a, { transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  mesh(G.cyl(0.5, 0.9, 16, 10), beamM, { y: -9, shadow: 'none', parent: g });
  const gold = glowMat(0xffd36a, 1.8, { roughness: 0.4, metalness: 0.2 });
  const arrow = mesh(G.cone(0.42, 0.95, 4), gold, { y: -1.9, rx: PI, ry: PI / 4, shadow: 'none', parent: g });
  const stem = mesh(G.cyl(0.09, 0.09, 0.9, 6), gold, { y: -1.1, shadow: 'none', parent: g });
  g.userData.update = (dt, t) => {
    g.position.y = y + sin(t * 1.5) * 0.35;
    arrow.position.y = -1.9 - 0.18 + sin(t * 3) * 0.18; stem.position.y = arrow.position.y + 0.8;
    halo.material.opacity = 0.3 + sin(t * 2) * 0.12;
    gold.emissiveIntensity = 1.5 + sin(t * 3) * 0.5;
  };
  g.userData.beaconHome = [x, z];
  return g;
}
/** How many gems the park portal shows — and therefore how many are hidden around the neighbourhood. */
const PORTAL_GEMS = 7;
function makeRingPortal(color, o = {}) {
  const g = new THREE.Group(), stone = mat(o.frame ?? 0x555a66, { roughness: 0.9, map: o.engrave ? TEX.stone(30) : null }), R = o.radius ?? 1.05, glow = o.glow ?? 0.5;
  for (const x of [-R - 0.25, R + 0.25]) mesh(G.box(0.4, 2.6, 0.5), stone, { x, y: 1.3, parent: g });
  mesh(G.torus(R + 0.25, 0.22, 8, 30, PI), stone, { y: 1.3, parent: g });
  // gem silhouettes cut into the pillars and the keystone: one per gem hidden in the world outside.
  // `engrave` is that count (true = PORTAL_GEMS); the pillars share the pairs, the arch carries the rest.
  if (o.engrave) {
    const n = o.engrave === true ? PORTAL_GEMS : o.engrave;
    const perPillar = floor(n / 2), onArch = n - perPillar * 2;
    const cut = mat(0x1e2026, { roughness: 1 }), rim = glowMat(color, 0.35, { transparent: true, opacity: 0.5 });
    const carve = (x, y, sx, sy) => { for (const z of [0.26, -0.26]) { mesh(G.gem(), rim, { x, y, z, sx, sy, sz: 0.02, shadow: 'none', parent: g }); mesh(G.gem(), cut, { x, y, z: z * 1.03, sx: sx * 0.75, sy: sy * 0.79, sz: 0.02, shadow: 'none', parent: g }); } };
    for (const s of [-1, 1]) for (let i = 0; i < perPillar; i++) carve(s * (R + 0.25), 0.55 + i * 0.75, 0.12, 0.19);
    for (let i = 0; i < onArch; i++) carve((i - (onArch - 1) / 2) * 0.62, R + 0.5, 0.16, 0.24);
  }
  const rings = [];
  for (let i = 0; i < 3; i++) { const r = mesh(G.torus(R * (0.85 - i * 0.22), 0.035, 8, 40), glowMat(color, 2.2), { y: 1.3, shadow: 'none', parent: g }); rings.push(r); }
  const core = mesh(G.cyl(R * 0.9, R * 0.9, 0.04, 40), basic(color, { transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), { y: 1.3, rx: PI / 2, shadow: 'none', parent: g });
  glowSprite(color, 4.2, glow, g).position.y = 1.3;
  g.userData.light = pointLight(color, 10, 8, 0, 1.4, 0.6, g);
  g.userData.update = (dt, t) => { rings.forEach((r, i) => { r.rotation.y = t * (0.6 + i * 0.4) * (i % 2 ? -1 : 1); r.rotation.x = sin(t * 0.7 + i) * 0.5; }); core.material.opacity = 0.18 + sin(t * 3) * 0.06; };
  return g;
}
/** A tiny glowing gem: faceted, hovering a little, with a halo. */
function makeGem(color, s = 0.1) {
  const g = new THREE.Group();
  const m = mesh(G.gem(), glowMat(color, 1.5, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }), { y: s * 1.4, sx: s * 0.7, sy: s, sz: s * 0.7, parent: g });
  glowSprite(color, s * 7, 0.45, g).position.y = s * 1.4;
  g.userData.gem = m; g.userData.s = s;
  return g;
}
/** A cluster of gems on the ground around (x,z) that bob and spin, with one shared point light. */
function makeGemCluster(game, U, x, z, n, colors, r = rnd, spread = 1.4) {
  const gems = [];
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = sqrt(r()) * spread, gx = x + cos(a) * d, gz = z + sin(a) * d;
    const gem = makeGem(r.pick(colors), r.range(0.06, 0.13)); gem.position.set(gx, game.physics.ground0(gx, gz), gz); gem.rotation.y = r() * TAU; gem.userData.ph = r() * TAU;
    game.world.add(gem); gems.push(gem);
  }
  const light = pointLight(colors[0], 5, 6, x, game.physics.ground0(x, z) + 0.7, z, game.world);
  U.push((dt, t) => { for (const gem of gems) { gem.rotation.y += dt * 0.8; gem.userData.gem.position.y = gem.userData.s * 1.4 + sin(t * 2 + gem.userData.ph) * 0.03; } light.intensity = 4.5 + sin(t * 2.3) * 1.5; });
  return gems;
}
/** One gem per spot (no shared light) — used for the gems hidden around the neighbourhood. spots = [[x,z,color]] */
function makeGemTrail(game, U, spots, r = rnd) {
  const gems = [];
  for (const [x, z, color] of spots) {
    const gem = makeGem(color, 0.13);
    gem.position.set(x, game.physics.ground0(x, z) + 0.05, z); gem.rotation.y = r() * TAU; gem.userData.ph = r() * TAU;
    game.world.add(gem); gems.push(gem);
  }
  U.push((dt, t) => { for (const gem of gems) { gem.rotation.y += dt * 0.8; gem.userData.gem.position.y = gem.userData.s * 1.4 + sin(t * 2 + gem.userData.ph) * 0.05; } });
  return gems;
}
/** Oriented collider helper: a box rotated by ry (multiples of 90°) around (x,z). */
function addRotBox(game, x, y, z, w, h, d, ry, opts) { const s = abs(sin(ry)) > 0.5; return game.physics.addBox(x, y, z, s ? d : w, h, s ? w : d, opts); }

function makeSlidingDoor(game, x, z, ry, onEnter) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const metal = mat(0x4a5260, { roughness: 0.3, metalness: 0.85 }), dark = mat(0x1e232b, { roughness: 0.5, metalness: 0.6 });
  mesh(G.box(2.4, 0.3, 0.5), metal, { y: 2.7, parent: g }); for (const px of [-1.15, 1.15]) mesh(G.box(0.3, 2.9, 0.5), metal, { x: px, y: 1.45, parent: g });
  const panels = [];
  for (const s of [-1, 1]) { const p = mesh(G.box(1.0, 2.55, 0.12), dark, { x: s * 0.5, y: 1.27, parent: g }); mesh(G.box(0.7, 1.4, 0.02), glowMat(0x14e0b8, 0.8), { x: -s * 0.1, y: 0.18, z: 0.07, shadow: 'none', parent: p }); panels.push(p); }
  const lamp = mesh(G.sphere(0.09, 10, 8), glowMat(0x23ff7a, 2.2), { y: 2.98, z: 0.2, shadow: 'none', parent: g });
  mesh(G.box(0.8, 0.4, 0.06), mat(0x0d1117, { emissive: 0x14e0b8, emissiveIntensity: 0.5 }), { x: 1.15, y: 1.6, z: 0.28, shadow: 'none', parent: g });
  glowSprite(0x23ff7a, 1.2, 0.5, g).position.set(0, 2.98, 0.25);
  const col = addRotBox(game, x, 1.3, z, 2.0, 2.6, 0.3, ry);
  const st = { open: false, t: 0 };
  g.userData.update = (dt, t) => {
    const cp = game.cat.group.position;
    const near = dist2(cp.x, cp.z, x, z) < 3.2 * 3.2;
    if (near && !st.open) { st.open = true; SFX.slide(); game.physics.removeBox(col); }
    st.t = damp(st.t, st.open ? 1 : 0, 6, dt);
    panels[0].position.x = -0.5 - st.t * 0.95; panels[1].position.x = 0.5 + st.t * 0.95;
    lamp.material.emissiveIntensity = st.open ? 2.5 : 1.2 + sin(t * 6) * 0.8;
  };
  game.addInteractable({ obj: g, radius: 2.6, label: () => 'Step through the airlock', onUse: onEnter });
  return g;
}
function makeWoodenDoor(game, x, z, ry, onEnter) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const frame = mat(0x5a3a1f, { roughness: 0.9 }), wood = mat(0x8b5a2b, { roughness: 0.85, map: TEX.planks(25, 36) });
  for (const px of [-0.65, 0.65]) mesh(G.box(0.18, 2.3, 0.28), frame, { x: px, y: 1.15, parent: g }); mesh(G.box(1.5, 0.2, 0.28), frame, { y: 2.3, parent: g });
  mesh(G.box(1.5, 0.08, 0.6), frame, { y: 0.04, parent: g });
  const door = group(-0.56, 0, 0, g);
  mesh(G.box(1.1, 2.18, 0.08), wood, { x: 0.56, y: 1.1, parent: door });
  for (let i = 0; i < 2; i++) mesh(G.box(0.95, 0.06, 0.1), frame, { x: 0.56, y: 0.55 + i * 1.1, parent: door });
  mesh(G.sphere(0.045, 8, 6), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { x: 1.0, y: 1.05, z: 0.08, shadow: 'none', parent: door });
  mesh(G.box(0.5, 0.36, 0.05), mat(0xf5e6c8, { roughness: 0.8 }), { y: 2.65, parent: g });
  const sign = new THREE.Mesh(G.plane(0.5, 0.36), new THREE.MeshBasicMaterial({ map: TEX.neonText('?', '#c0392b'), transparent: true })); worldBag.track(sign.material); sign.position.set(0, 2.65, 0.03); g.add(sign);
  pointLight(0xfff1c0, 10, 7, 0, 2.6, 1.2, g);
  const col = addRotBox(game, x, 1.15, z, 1.4, 2.3, 0.3, ry);
  const st = { open: false };
  game.addInteractable({ obj: g, radius: 2.4, label: () => st.open ? 'Step through' : 'Open the wooden door', onUse: () => {
    if (!st.open) { st.open = true; SFX.door(); game.physics.removeBox(col); tween(0.8, (k) => { door.rotation.y = -1.9 * k; }, () => setTimeout(onEnter, 250)); }
    else onEnter();
  } });
  return g;
}
function makeTimeDoor(game, x, z, ry) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const dark = mat(0x2a1544, { roughness: 0.6, emissive: 0x5a2d9a, emissiveIntensity: 0.25 }), gold = mat(0xd4af37, { metalness: 0.9, roughness: 0.3 });
  for (const px of [-1.05, 1.05]) { mesh(G.box(0.36, 3.2, 0.4), dark, { x: px, y: 1.6, parent: g }); mesh(G.box(0.5, 0.16, 0.5), gold, { x: px, y: 3.25, parent: g }); mesh(G.box(0.5, 0.16, 0.5), gold, { x: px, y: 0.08, parent: g }); }
  mesh(G.box(2.6, 0.4, 0.4), dark, { y: 3.45, parent: g }); mesh(G.cone(0.6, 0.7, 4), gold, { y: 3.95, ry: PI / 4, parent: g });
  const face = mesh(G.cyl(0.42, 0.42, 0.06, 32), mat(0xffffff, { map: TEX.clockFace(), roughness: 0.6 }), { y: 3.45, z: 0.22, rx: PI / 2, shadow: 'none', parent: g });
  const rings = [[0x00e5ff, 0.8], [0xff40ff, 0.58], [0xffe040, 0.36]].map(([c, r]) => mesh(G.torus(r, 0.04, 8, 40), glowMat(c, 0.5), { y: 1.6, shadow: 'none', parent: g }));
  const core = mesh(G.cyl(0.86, 0.86, 0.04, 40), basic(0x7a4dff, { transparent: true, opacity: 0.0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), { y: 1.6, rx: PI / 2, shadow: 'none', parent: g });
  const halo = glowSprite(0x9a6bff, 4.5, 0.0, g); halo.position.y = 1.6;
  const light = pointLight(0x9a6bff, 0, 9, 0, 1.7, 0.6, g);
  const c = cos(ry), s = sin(ry);
  for (const px of [-1.05, 1.05]) game.physics.addBox(x + px * c, 1.6, z - px * s, 0.6, 3.2, 0.6);
  const st = { active: false, k: 0 };
  g.userData.activate = () => { st.active = true; };
  g.userData.update = (dt, t) => {
    st.k = damp(st.k, st.active ? 1 : 0, 2, dt);
    rings.forEach((r, i) => { r.rotation.y = t * (0.4 + st.k * 1.4) * (i % 2 ? -1 : 1) * (1 + i * 0.5); r.rotation.x = sin(t * 0.9 + i) * (0.3 + st.k * 0.4); r.material.emissiveIntensity = 0.5 + st.k * 2.2 + (st.active ? sin(t * 4 + i) * 0.4 : 0); });
    core.material.opacity = st.k * (0.22 + sin(t * 3) * 0.06); halo.material.opacity = st.k * 0.55; light.intensity = st.k * 16;
    face.rotation.z = t * 0.3;
  };
  return g;
}

// ---------------------------------------------------------------- candy land
function makeCandyCane(h = 3) {
  const g = new THREE.Group(), stripe = mat(0xffffff, { roughness: 0.35, map: TEX.candyCane() });
  mesh(G.cyl(0.13, 0.13, h, 12), stripe, { y: h / 2, parent: g });
  mesh(G.torus(0.42, 0.13, 10, 20, PI), stripe, { x: 0.42, y: h, parent: g });
  g.userData.col = [0.5, h];
  return g;
}
function makeLollipop(size, hue, stickH) {
  const g = new THREE.Group(), side = mat(new THREE.Color().setHSL(hue / 360, 0.9, 0.55), { roughness: 0.3 }), face = mat(0xffffff, { roughness: 0.3, map: TEX.lollipop(hue) });
  mesh(G.cyl(0.05 * size, 0.05 * size, stickH, 8), mat(0xfff8f0, { roughness: 0.6 }), { y: stickH / 2, parent: g });
  mesh(G.cyl(size, size, 0.16 * size, 32), [side, face, face], { y: stickH + size * 0.9, rx: PI / 2, rz: 0.15, parent: g });
  return g;
}
function makeGumdrops(game, spots, r) {
  const pts = scatterPoints(game, spots, r, 0.5), total = pts.length;
  if (!total) return;
  const im = new THREE.InstancedMesh(G.cyl(0.45, 0.62, 0.9, 14), mat(0xffffff, { roughness: 0.35 }), total);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), C = new THREE.Color();
  let i = 0;
  for (const [x, z] of pts) {
    const s = r.range(0.35, 0.8);
    M.compose(Pv.set(x, game.physics.ground0(x, z) + s * 0.45, z), Q, S.set(s, s, s)); im.setMatrixAt(i, M);
    im.setColorAt(i, C.setHSL(r.pick([0.0, 0.1, 0.16, 0.33, 0.55, 0.75, 0.9]), 0.85, 0.55));
    i++;
  }
  im.instanceColor.needsUpdate = true; im.castShadow = true; game.world.add(im); worldBag.track(im);
}
function makeCandyBridge(game, x, z, width, span) {
  const g = group(x, 0, z, game.world), wafer = mat(0xd9a066, { roughness: 0.9 }), choc = mat(0x5a2d12, { roughness: 0.7 });
  mesh(G.box(width, 0.3, span), wafer, { y: 0.15, shadow: 'both', parent: g }); game.physics.addBox(x, 0.15, z, width, 0.3, span, { cam: false });
  for (let i = 0; i < 5; i++) mesh(G.box(width, 0.04, 0.12), choc, { y: 0.32, z: -span / 2 + 0.3 + i * (span - 0.6) / 4, shadow: 'none', parent: g });
  for (const sx of [-1, 1]) { const rail = group(sx * (width / 2 - 0.15), 0.3, 0, g);
    for (let i = 0; i < 4; i++) { const c = makeCandyCane(0.9); c.position.z = -span / 2 + 0.4 + i * (span - 0.8) / 3; c.scale.setScalar(0.5); rail.add(c); }
    mesh(G.box(0.1, 0.1, span), mat(0xff4f9a, { roughness: 0.4 }), { y: 0.95, parent: rail }); }
  return g;
}

/** The sweet-lands' horizon: pastel hills then ice-cream mountains, all outside `clear`. */
function makeCandyHills(parent, r, clear = 70) {
  const pastel = [0xffb6d9, 0xbfe3ff, 0xfff0b3, 0xc8f7c5, 0xe5d0ff, 0xffd1b3];
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + r.range(-0.1, 0.1), rad = r.range(16, 32), d = clear + rad * 0.95 + r.range(0, 18); mesh(G.sphere(1, 16, 10), mat(r.pick(pastel), { roughness: 0.9 }), { x: cos(a) * d, y: -3, z: sin(a) * d, sx: rad, sy: r.range(7, 16), sz: rad, shadow: 'none', parent }); }
  // ice-cream mountains: waffle cone + scoops
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + r.range(-0.08, 0.08), d = clear * r.range(1.55, 2.1), x = cos(a) * d, z = sin(a) * d, h = r.range(34, 66), w = h * 0.45;
    mesh(G.cone(1, 1, 8), mat(0xd9a066, { roughness: 1 }), { x, y: h * 0.5 - 4, z, sx: w, sy: h, sz: w, shadow: 'none', parent });
    mesh(G.sphere(1, 12, 9), mat(r.pick(pastel), { roughness: 0.9 }), { x, y: h - 4, z, sx: w * 0.75, sy: w * 0.6, sz: w * 0.75, shadow: 'none', parent });
    mesh(G.sphere(1, 12, 9), mat(r.pick([0xffffff, 0xfff0b3, 0xffb6d9]), { roughness: 0.9 }), { x, y: h - 4 + w * 0.7, z, sx: w * 0.5, sy: w * 0.42, sz: w * 0.5, shadow: 'none', parent });
    mesh(G.sphere(1, 8, 6), mat(0xd62839, { roughness: 0.5 }), { x, y: h - 4 + w * 1.15, z, sx: w * 0.12, sy: w * 0.12, sz: w * 0.12, shadow: 'none', parent });
  }
}
function makeMarshmallowBush(r = rnd) {
  const g = new THREE.Group(), n = r.int(3, 5);
  for (let j = 0; j < n; j++) mesh(G.cyl(0.3, 0.32, 0.5, 12), mat(r.pick([0xffffff, 0xfff0f5, 0xffe4ec]), { roughness: 1 }), { x: r.range(-0.4, 0.4), y: 0.25 + (j % 2) * 0.4, z: r.range(-0.4, 0.4), ry: r() * TAU, parent: g });
  return g;
}
function makeDonut(color) {
  const g = new THREE.Group();
  mesh(G.torus(1.1, 0.45, 12, 28), mat(0xd9a066, { roughness: 0.9 }), { y: 1.55, parent: g });
  mesh(G.torus(1.1, 0.47, 12, 28, PI), mat(color, { roughness: 0.5 }), { y: 1.55, parent: g });
  for (let i = 0; i < 24; i++) { const a = r0(i), rr = 1.1 + (i % 3 - 1) * 0.25; mesh(G.box(0.08, 0.03, 0.18), mat(rnd.pick([0xffffff, 0xffd54a, 0x7fd7ff, 0xff6fb5]), { roughness: 0.6 }), { x: cos(a) * rr, y: 1.55 + sin(a) * rr, z: 0.48, rz: a + 0.3, shadow: 'none', parent: g }); }
  return g;
}
const r0 = (i) => PI * 0.05 + i / 24 * PI * 0.9;

// ---------------------------------------------------------------- robot city
function makeSkyscraper(w, h, d, seed) {
  const g = new THREE.Group(), f = TEX.facade(seed % 6);
  const side = mat(0x161a24, { roughness: 0.6, metalness: 0.3, map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 1.1 });
  side.map = f.map.clone(); side.emissiveMap = f.emissive.clone(); side.map.needsUpdate = side.emissiveMap.needsUpdate = true;
  side.map.repeat.set(max(1, Math.round(w / 5)), max(1, Math.round(h / 12))); side.emissiveMap.repeat.copy(side.map.repeat);
  worldBag.track(side.map); worldBag.track(side.emissiveMap);
  const top = mat(0x0f1118, { roughness: 0.8 });
  mesh(G.box(w, h, d), [side, side, top, top, side, side], { y: h / 2, shadow: 'both', parent: g });
  mesh(G.box(w * 0.4, 1, d * 0.4), top, { y: h + 0.5, parent: g });
  if (h > 24) { mesh(G.cyl(0.08, 0.12, 4, 6), top, { y: h + 3, parent: g }); const b = mesh(G.sphere(0.25, 8, 6), glowMat(0xff3030, 2.5), { y: h + 5.1, shadow: 'none', parent: g }); g.userData.beacon = b; }
  return g;
}
function makeConveyor(game, x, z, len, dir = 1) {
  const g = group(x, 0, z, game.world), frame = mat(0x3a4048, { roughness: 0.5, metalness: 0.7 }), beltM = mat(0x1c1f24, { roughness: 0.9 });
  const belt = mesh(G.box(1.6, 0.16, len), beltM, { y: 0.62, parent: g });
  for (const sx of [-0.9, 0.9]) mesh(G.box(0.12, 0.3, len), frame, { x: sx, y: 0.65, parent: g });
  for (let i = 0; i < len / 1.5; i++) mesh(G.box(1.9, 0.5, 0.12), frame, { y: 0.25, z: -len / 2 + 0.6 + i * 1.5, parent: g });
  for (let i = 0; i < len / 0.6; i++) mesh(G.cyl(0.07, 0.07, 1.7, 8), mat(0x6b7480, { metalness: 0.8, roughness: 0.3 }), { y: 0.72, z: -len / 2 + 0.3 + i * 0.6, rz: PI / 2, shadow: 'none', parent: g });
  game.physics.addBox(x, 0.36, z, 1.9, 0.72, len, { cam: false });
  const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) }), stripeM = glowMat(0xffb300, 0.6);
  const crates = [];
  for (let i = 0; i < 3; i++) { const c = group(0, 1.06, -len / 2 + i * len / 3, g); mesh(G.box(0.7, 0.7, 0.7), crateM, { parent: c }); mesh(G.box(0.72, 0.1, 0.72), stripeM, { shadow: 'none', parent: c }); crates.push(c); }
  g.userData.update = (dt) => { for (const c of crates) { c.position.z += dir * 0.9 * dt; if (dir > 0 && c.position.z > len / 2 - 0.4) c.position.z = -len / 2 + 0.4; if (dir < 0 && c.position.z < -len / 2 + 0.4) c.position.z = len / 2 - 0.4; } };
  return g;
}
function makeRobotArm(game, x, z) {
  const g = group(x, 0, z, game.world), m = mat(0xe0a020, { roughness: 0.4, metalness: 0.6 }), dark = mat(0x2b2f36, { metalness: 0.8, roughness: 0.3 });
  mesh(G.cyl(0.9, 1.1, 0.5, 16), dark, { y: 0.25, parent: g }); game.physics.addBox(x, 0.6, z, 2.2, 1.2, 2.2, { cam: false });
  const base = group(0, 0.5, 0, g); mesh(G.cyl(0.5, 0.6, 0.8, 12), m, { y: 0.4, parent: base });
  const j1 = group(0, 0.8, 0, base); mesh(G.box(0.5, 2.4, 0.5), m, { y: 1.2, parent: j1 });
  const j2 = group(0, 2.4, 0, j1); mesh(G.box(0.4, 0.4, 2.2), m, { z: 1.1, parent: j2 });
  const claw = group(0, 0, 2.2, j2); mesh(G.box(0.3, 0.3, 0.3), dark, { parent: claw });
  const c1 = mesh(G.box(0.08, 0.5, 0.3), dark, { x: 0.15, y: -0.35, parent: claw }), c2 = mesh(G.box(0.08, 0.5, 0.3), dark, { x: -0.15, y: -0.35, parent: claw });
  mesh(G.sphere(0.1, 8, 6), glowMat(0x00e5ff, 2), { y: 0.25, shadow: 'none', parent: claw });
  g.userData.update = (dt, t) => { base.rotation.y = sin(t * 0.5) * 1.2; j1.rotation.x = sin(t * 0.8) * 0.35 - 0.2; j2.rotation.x = 0.6 + sin(t * 0.8 + 1) * 0.5; claw.rotation.x = -j2.rotation.x - j1.rotation.x; const o = 0.12 + max(0, sin(t * 1.6)) * 0.14; c1.position.x = o; c2.position.x = -o; };
  return g;
}
function makeNeonSign(text, color, w, parent) {
  const g = new THREE.Group();
  mesh(G.box(w + 0.4, w * 0.25 + 0.4, 0.12), mat(0x0f1218, { roughness: 0.6 }), { z: -0.08, parent: g });
  const p = new THREE.Mesh(G.plane(w, w * 0.25), new THREE.MeshBasicMaterial({ map: TEX.neonText(text, color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); worldBag.track(p.material); g.add(p);
  glowSprite(color, w * 0.9, 0.35, g);
  parent.add(g); return g;
}
function makeFurnace(game, x, z, ry) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const brick = mat(0x3a2a24, { roughness: 1, map: TEX.brick(10) }), iron = mat(0x2b2f36, { metalness: 0.8, roughness: 0.4 });
  mesh(G.box(4, 3.2, 3), brick, { y: 1.6, shadow: 'both', parent: g }); mesh(G.cyl(0.4, 0.5, 3, 10), iron, { x: -1, y: 4.5, z: -0.5, parent: g });
  mesh(G.box(1.8, 1.4, 0.3), glowMat(0xff6a00, 3.5), { y: 1.1, z: 1.5, shadow: 'none', parent: g });
  mesh(G.box(2.2, 1.8, 0.2), iron, { y: 1.1, z: 1.45, shadow: 'none', parent: g }); for (let i = 0; i < 4; i++) mesh(G.box(2.2, 0.06, 0.24), iron, { y: 0.5 + i * 0.4, z: 1.55, shadow: 'none', parent: g });
  const l = pointLight(0xff7a20, 26, 12, 0, 1.2, 2.6, g);
  glowSprite(0xff7a20, 5, 0.5, g).position.set(0, 1.1, 1.7);
  g.userData.update = (dt, t) => { l.intensity = 22 + sin(t * 11) * 4 + sin(t * 23) * 2; };
  const c = cos(ry), s = sin(ry); game.physics.addBox(x, 1.6, z, abs(c) * 4 + abs(s) * 3, 3.2, abs(s) * 4 + abs(c) * 3);
  return g;
}

// ---------------------------------------------------------------- victorian
function makeVicHouse(o, r = rnd) {
  const { w = 7, d = 7, h = 7.5 } = o, g = new THREE.Group();
  const brick = mat(0x7a4a3a, { roughness: 0.95, map: TEX.brick(o.hue ?? 12).clone() }); brick.map.needsUpdate = true; brick.map.repeat.set(w / 2, h / 2); worldBag.track(brick.map);
  const stone = mat(0x6b6660, { roughness: 0.9 }), slate = mat(0x2d3a42, { roughness: 0.8 }), dark = mat(0x1d1a17, { roughness: 0.8 });
  const glass = mat(0xffd27a, { roughness: 0.2, emissive: 0xffb347, emissiveIntensity: 0.9 });
  mesh(G.box(w, h, d), brick, { y: h / 2, shadow: 'both', parent: g });
  mesh(G.box(w + 0.3, 0.3, d + 0.3), stone, { y: h + 0.1, parent: g });
  mesh(G.gable(d + 0.6, 2.8, w + 0.6), slate, { y: h + 0.2, ry: PI / 2, parent: g });
  for (const cx of [-w * 0.3, w * 0.3]) mesh(G.box(0.7, 1.8, 0.7), mat(0x5a3a30, { roughness: 1, map: TEX.brick(8) }), { x: cx, y: h + 2.4, z: -d * 0.15, parent: g });
  // rows of windows on the front (+z)
  const rows = floor(h / 3), cols = max(2, floor(w / 2.4));
  for (let ry = 0; ry < rows; ry++) for (let c = 0; c < cols; c++) {
    const x = -w / 2 + (c + 0.5) * (w / cols), y = 1.8 + ry * 3, isDoor = ry === 0 && c === 0;
    mesh(G.box(1.2, isDoor ? 2.3 : 1.7, 0.16), stone, { x, y: isDoor ? 1.15 : y, z: d / 2 + 0.03, parent: g });
    if (isDoor) { mesh(G.box(0.95, 2.1, 0.14), mat(0x2f4f4f, { roughness: 0.7 }), { x, y: 1.05, z: d / 2 + 0.08, parent: g }); mesh(G.sphere(0.04, 8, 6), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { x: x + 0.3, y: 1.05, z: d / 2 + 0.17, shadow: 'none', parent: g });
      mesh(G.box(0.24, 0.3, 0.24), glass, { x: x + 0.9, y: 2.3, z: d / 2 + 0.2, shadow: 'none', parent: g }); glowSprite(0xffb060, 1.4, 0.4, g).position.set(x + 0.9, 2.3, d / 2 + 0.35); }
    else { mesh(G.box(0.95, 1.45, 0.14), glass, { x, y, z: d / 2 + 0.08, shadow: 'none', parent: g }); mesh(G.box(0.06, 1.45, 0.16), dark, { x, y, z: d / 2 + 0.1, shadow: 'none', parent: g }); mesh(G.box(0.95, 0.06, 0.16), dark, { x, y, z: d / 2 + 0.1, shadow: 'none', parent: g });
      if (ry === 0 && r.chance(0.5)) mesh(G.box(1.4, 0.12, 0.5), stone, { x, y: y - 0.85, z: d / 2 + 0.25, parent: g }); }
  }
  if (o.bay) { mesh(G.box(2.2, 3.4, 0.9), brick, { x: w * 0.25, y: 1.7, z: d / 2 + 0.4, parent: g }); mesh(G.box(1.6, 1.5, 0.14), glass, { x: w * 0.25, y: 2.0, z: d / 2 + 0.88, shadow: 'none', parent: g }); mesh(G.box(2.5, 0.2, 1.2), slate, { x: w * 0.25, y: 3.5, z: d / 2 + 0.4, parent: g }); }
  return g;
}
function makeIronFence(len) {
  const g = new THREE.Group(), iron = mat(0x1e2426, { roughness: 0.6, metalness: 0.5 }), n = floor(len / 0.35);
  for (let i = 0; i <= n; i++) { const x = -len / 2 + i * (len / n); mesh(G.cyl(0.02, 0.02, 1.2, 5), iron, { x, y: 0.6, shadow: 'none', parent: g }); mesh(G.cone(0.05, 0.14, 5), iron, { x, y: 1.27, shadow: 'none', parent: g }); }
  mesh(G.box(len, 0.05, 0.05), iron, { y: 1.0, parent: g }); mesh(G.box(len, 0.05, 0.05), iron, { y: 0.35, parent: g });
  for (let i = 0; i <= len / 3; i++) mesh(G.box(0.12, 1.35, 0.12), iron, { x: -len / 2 + i * 3, y: 0.68, parent: g });
  return g;
}
function makeClockTower(game, x, z) {
  const g = group(x, 0, z, game.world), stone = mat(0x8c8377, { roughness: 0.95, map: TEX.brick(30).clone() }); stone.map.needsUpdate = true; stone.map.repeat.set(3, 9); worldBag.track(stone.map);
  const slate = mat(0x2d3a42, { roughness: 0.8 }), gold = mat(0xd4af37, { metalness: 0.9, roughness: 0.3 });
  mesh(G.box(6, 18, 6), stone, { y: 9, shadow: 'both', parent: g }); mesh(G.box(7, 1, 7), slate, { y: 18.5, parent: g });
  mesh(G.box(5, 5, 5), mat(0xa39b8e, { roughness: 0.9 }), { y: 21.5, parent: g });
  const face = mat(0xffffff, { map: TEX.clockFace(), roughness: 0.5, emissive: 0xfff2c0, emissiveIntensity: 0.35 });
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; mesh(G.cyl(1.8, 1.8, 0.1, 32), face, { x: sin(a) * 2.55, y: 21.5, z: cos(a) * 2.55, rx: PI / 2, ry: a, shadow: 'none', parent: g }); }
  mesh(G.cone(4.2, 5, 4), slate, { y: 26.5, ry: PI / 4, parent: g }); mesh(G.sphere(0.4, 8, 6), gold, { y: 29.2, parent: g });
  mesh(G.cyl(0.05, 0.05, 2, 6), gold, { y: 30.2, parent: g });
  mesh(G.box(7.5, 0.6, 7.5), stone, { y: 0.3, parent: g });
  game.physics.addBox(x, 9, z, 7.5, 18, 7.5);
  return g;
}
function makeCarriage(game, x, z, ry) {
  const g = group(x, 0, z, game.world); g.rotation.y = ry;
  const wood = mat(0x2b1d14, { roughness: 0.7 }), red = mat(0x7a1f1f, { roughness: 0.6 }), iron = mat(0x1e2426, { metalness: 0.6, roughness: 0.5 }), gold = mat(0xd4af37, { metalness: 0.9, roughness: 0.3 });
  mesh(G.box(1.8, 1.6, 2.6), wood, { y: 1.5, parent: g }); mesh(G.box(1.9, 0.12, 2.7), red, { y: 2.32, parent: g });
  mesh(G.box(1.4, 0.7, 0.05), mat(0xbfe7ff, { roughness: 0.1, transparent: true, opacity: 0.5 }), { y: 1.7, z: 1.31, shadow: 'none', parent: g });
  for (const s of [-1, 1]) mesh(G.box(0.05, 0.7, 1.0), mat(0xbfe7ff, { roughness: 0.1, transparent: true, opacity: 0.5 }), { x: s * 0.91, y: 1.7, z: 0.3, shadow: 'none', parent: g });
  mesh(G.box(1.6, 0.5, 0.8), wood, { y: 2.0, z: 1.9, parent: g });
  for (const [sx, sz, r] of [[1.0, 1.0, 0.7], [-1.0, 1.0, 0.7], [1.0, -1.0, 0.55], [-1.0, -1.0, 0.55]]) { mesh(G.torus(r, 0.06, 8, 22), iron, { x: sx, y: r, z: sz, ry: PI / 2, parent: g }); for (let i = 0; i < 6; i++) mesh(G.box(0.03, r * 2, 0.03), wood, { x: sx, y: r, z: sz, rx: i * PI / 6, shadow: 'none', parent: g }); }
  mesh(G.box(0.5, 0.3, 0.3), mat(0xffe6a8, { emissive: 0xffc46a, emissiveIntensity: 1.4 }), { x: 0.9, y: 2.2, z: 1.4, shadow: 'none', parent: g }); pointLight(0xffb060, 6, 6, 0.9, 2.2, 1.6, g);
  mesh(G.cyl(0.05, 0.05, 3, 6), wood, { y: 0.9, z: 3.3, rx: PI / 2, parent: g });
  const c = cos(ry), s = sin(ry); game.physics.addBox(x, 1.2, z, abs(c) * 2.2 + abs(s) * 5, 2.4, abs(s) * 2.2 + abs(c) * 5, { cam: false });
  return g;
}
