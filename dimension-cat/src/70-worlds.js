// ============================================================================
// WORLDS — the four dimensions. Each builder returns { update(dt,t), spawn }
// ============================================================================
const WORLDS = [
  { key: 'neighborhood', name: 'Neighborhood', icon: '🏠', blurb: 'Home sweet home',           build: buildNeighborhood },
  { key: 'candy',        name: 'Candy Land',   icon: '🍭', blurb: 'Mind the chocolate',        build: buildCandyLand },
  { key: 'robot',        name: 'Robot City',   icon: '🤖', blurb: 'Halt, feline',              build: buildRobotCity },
  { key: 'victorian',    name: 'Victorian',    icon: '🎩', blurb: 'Gaslight and fog',          build: buildVictorian },
  { key: 'beach',        name: 'Sunny Shore',  icon: '🏖️', blurb: 'Waves, crabs and coconuts', build: buildBeach },
  { key: 'snow',         name: 'Frosty Peak',  icon: '❄️', blurb: 'Penguins under the aurora', build: buildSnowVillage },
  { key: 'forest',       name: 'Whisper Woods', icon: '🍄', blurb: 'Fireflies and giant mushrooms', build: buildForest },
];
const WORLD_INDEX = (key) => WORLDS.findIndex((w) => w.key === key);
/**
 * How far each world reaches from the origin. The Neighborhood stays a walkable village; every other
 * world is ten times its area (about 3.2x as wide), with the extra ground filled in by 68-regions.js.
 */
const CANDY_LIMIT = 480, ROBOT_LIMIT = 480, VICTORIAN_LIMIT = 420, SHORE_LIMIT = 196, PEAK_LIMIT = 196, WOODS_LIMIT = 196;
/** Every world except the Neighborhood starts you next to its squirrel. */
function spawnBySquirrel(game, sq, yawOffset = 0) {
  const a = sq.restHeading + PI + yawOffset, x = sq.x + sin(a) * 1.6, z = sq.z + cos(a) * 1.6;
  return { x, y: game.physics.ground0(x, z), z, yaw: atan2(sq.x - x, sq.z - z) };
}

/** Registers obj.userData.update (if any) with the world's updater list and adds it to the world. */
function place(game, U, obj, x = 0, z = 0, ry = 0, y = 0) {
  obj.position.set(x, y, z); obj.rotation.y = ry; game.world.add(obj);
  if (obj.userData.update) U.push(obj.userData.update);
  return obj;
}
/** Plants a tree, first nudging it clear of roads, paths and buildings (the trunk, not the canopy). */
function addTree(game, kind, x, z, r) {
  const at = game.zones.nudge(x, z, 0.45, 9);
  if (!at) return null;
  const t = makeTree(kind, r); t.position.set(at[0], 0, at[1]); game.world.add(t);
  const [w] = t.userData.col; game.physics.addBox(at[0], 2, at[1], w * 0.5 * t.scale.x, 4, w * 0.5 * t.scale.x, { cam: false });
  return t;
}
/** Plants a bush clear of roads, paths and buildings. */
function addBush(game, x, z, r, color) {
  const at = game.zones.nudge(x, z, 0.7, 7);
  if (!at) return null;
  const b = color === undefined ? makeBush(r) : makeBush(r, color);
  b.position.set(at[0], game.physics.ground0(at[0], at[1]), at[1]); game.world.add(b);
  game.physics.addBox(at[0], game.physics.ground0(at[0], at[1]) + 0.4, at[1], 1, 0.8, 0.8, { cam: false });
  return b;
}
/** A copy of a cached ground texture, re-tiled so one tile still covers `metres` on the ground. */
function groundMap(tex, w, h, metres) { const m = tex.clone(); m.needsUpdate = true; m.repeat.set(w / metres, h / metres); worldBag.track(m); return m; }
/** A round patch of ground — a paved town centre fading into open country reads better than a square one. */
function flatDisc(game, rad, m, x, z, y = 0.01) {
  const g = new THREE.CircleGeometry(rad, 64); worldBag.track(g); g.rotateX(-PI / 2);
  const p = new THREE.Mesh(g, m); p.position.set(x, y, z); p.receiveShadow = true; game.world.add(p); return p;
}
function flatPlane(game, w, h, m, x, z, ry = 0, y = 0.01) { const p = mesh(G.plane(w, h), m, { x, y, z, rx: -PI / 2, shadow: 'receive', parent: game.world }); p.rotation.z = ry; return p; }

// ---------------------------------------------------------------- 1. NEIGHBORHOOD
function buildNeighborhood(game, entry) {
  const W = game.world, P = game.physics, r = seeded(101), U = [];
  P.setLimit(95);
  game.applySky({ top: 0x2f6fd8, horizon: 0xbfe0ff, bottom: 0x6f9e5c, sun: [0.45, 0.6, 0.3], sunColor: 0xfff1c9, sunSize: 600, halo: 0.45 });
  game.setLighting({ ambient: [0xbcd8ff, 0.3], hemi: [0x9ec9ff, 0x4f7a34, 0.55], sun: [0xfff2d9, 2.6, 40, 60, 26], fog: [0xbfe0ff, 60, 260], exposure: 1.0 });

  flatPlane(game, 500, 500, mat(0x4f8c3c, { roughness: 1, map: TEX.grass() }), 0, 0, 0, 0);
  // Everything paved, built or wet, so trees, bushes, flowers and grass keep off it.
  const Z = game.zones;
  Z.addSpan(-100, 9.6, 100, 18.4);                                  // the main street: asphalt + both pavements
  Z.addSpan(41.5, -65, 46.5, 65);                                   // the side road east
  Z.addSpan(45, 20.3, 76, 23.7);                                    // the boardwalk out to the beach gate
  Z.addSpan(-13, 35.2, 13, 36.8); Z.addSpan(-0.9, 35.2, 0.9, 49.2); // the park paths
  Z.addCircle(0, 50, 2.4);                                          // the portal arch
  Z.addCircle(-12, 46, 4.2); Z.addCircle(-34, -48, 8.4);            // the park pond and the lake
  Z.addSpan(-38.5, -49.2, -26, -46.8);                              // the jetty
  Z.addSpan(-67, -36, -49, -11);                                    // the lantern path to the gondola
  Z.addSpan(5, 54, 40, 80);                                         // the stepping stones to the hollow oak
  Z.addCircle(-72, -40, 5); Z.addCircle(78, 22, 4.5); Z.addCircle(40, 78, 4);   // gondola, beach gate, hollow oak
  Z.add(0, 0, 10.8, 8.8); Z.add(0.9, 4.9, 3.6, 1.8); Z.add(0.9, 7.9, 1.4, 5.4); // home: walls, porch, front path
  // roads + sidewalks
  const asphalt = mat(0x3a3b40, { roughness: 0.95, map: TEX.asphalt() }), walk = mat(0xa9a7a2, { roughness: 0.95, map: TEX.sidewalk() });
  const side = mat(0x3a3b40, { roughness: 0.95, map: TEX.asphalt().clone() }); side.map.needsUpdate = true; side.map.repeat.set(2, 26); worldBag.track(side.map);
  flatPlane(game, 200, 6, asphalt, 0, 14); flatPlane(game, 5, 130, side, 44, 0, 0, 0.012);
  flatPlane(game, 200, 1.6, walk, 0, 10.4, 0, 0.02); flatPlane(game, 200, 1.6, walk, 0, 17.6, 0, 0.02);
  const dash = new THREE.InstancedMesh(G.box(2.2, 0.02, 0.16), mat(0xf2c744, { roughness: 0.8 }), 50), M = new THREE.Matrix4();
  for (let i = 0; i < 50; i++) { M.makeTranslation(-98 + i * 4, 0.015, 14); dash.setMatrixAt(i, M); } dash.castShadow = false; W.add(dash); worldBag.track(dash);
  const curb = mat(0x8e8b84, { roughness: 1 });
  mesh(G.box(200, 0.12, 0.25), curb, { y: 0.06, z: 11.1, parent: W }); mesh(G.box(200, 0.12, 0.25), curb, { y: 0.06, z: 16.9, parent: W });

  // home + yard
  const home = makeHome(game); W.add(home.group);
  U.push(makeHomeBeacon(game, 0, 0, 14).userData.update);   // the floating marker over the cat's own roof
  game.homeMarker = [0, 0];
  for (const [cx, len] of [[-2.5, 5.8], [3.4, 4.0]]) { const f = makeFence(len); f.position.set(cx, 0, 8); W.add(f); P.addBox(cx, 0.5, 8, len, 1, 0.2, { cam: false }); }
  for (const s of [-1, 1]) { const f = makeFence(5.4); f.position.set(s * 6.2, 0, 5.3); f.rotation.y = PI / 2; W.add(f); P.addBox(s * 6.2, 0.5, 5.3, 0.2, 1, 5.4, { cam: false }); }   // side fences
  for (const z of [6.0, 6.9, 7.8, 8.7, 9.5]) mesh(G.box(0.9, 0.03, 0.55), mat(0xb9b2a6, { roughness: 1 }), { x: 0.9, y: 0.015, z, shadow: 'receive', parent: W });
  place(game, U, makeMailbox(0x2e63d8), 2.2, 9.4);
  for (const [x, z] of [[-6.6, 3.6], [6.6, 3.4], [-6.6, -1.5], [-3.9, 6.4], [4.6, 6.4]]) addBush(game, x, z, r);
  // neighbours
  const palette = [[0xdfe9f5, 0x3f5573], [0xf7e4c1, 0x8b3a2a], [0xe8f3d8, 0x4a6a3a], [0xf5dcd2, 0x6b3a3a], [0xfff3d6, 0x2f4f6f], [0xe5e0f5, 0x5a4a7a], [0xf3f0e6, 0x7a4a2a], [0xd9efe9, 0x3a6a6a], [0xf9e6e0, 0x4a4a6a], [0xe6f0f9, 0x8a3a2a], [0xf4f1dc, 0x3a5a3a], [0xe9e2f4, 0x6b3a5a]];
  const lots = [[-18, 0, 0], [18, 0, 0], [-36, 0, 0], [36, 0, 0], [-27, 28, PI], [-9, 28, PI], [9, 28, PI], [27, 28, PI], [-54, 0, 0], [54, 0, 0], [-72, 0, 0], [72, 0, 0], [-45, 28, PI], [-81, 28, PI], [-63, 28, PI], [63, 28, PI]];
  for (const [x, z, ry] of lots) { const front = ry === 0 ? 1 : -1; Z.add(x, z, 7.8, 6.8); Z.add(x, z + front * 4.4, 3.6, 2.6); Z.add(x, z + front * 6.9, 1.4, 6.4); }   // house, porch, front path
  lots.forEach(([x, z, ry], i) => {
    const [wall, roof] = palette[i % palette.length], storeys = i % 3 === 1 ? 2 : 1, h = makeHouse({ wall, roof, doorRight: i % 2 === 1, lit: i % 3 === 0, roofH: 2 + (i % 3) * 0.4, storeys, shutter: r.pick([0x3f5573, 0x2f4f2f, 0x5a3a3a, 0xffffff]) }, r);
    place(game, U, h, x, z, ry); P.addBox(x, h.userData.h / 2, z, 7.4, h.userData.h, 6.4); P.addBox(x + (i % 2 === 1 ? 2.1 : 0), 1.2, z + (ry === 0 ? 1 : -1) * 4.35, 3.0, 2.4, 1.5, { cam: false });
    const front = ry === 0 ? 1 : -1, fz = z + front * 8;
    for (const [cx, len] of [[-2.2, 3.6], [2.5, 3]]) { const f = makeFence(len, r.pick([0x2e63d8, 0x2e63d8, 0xffffff, 0x4a8ad8])); f.position.set(x + cx, 0, fz); f.rotation.y = ry; W.add(f); P.addBox(x + cx, 0.5, fz, len, 1, 0.2, { cam: false }); }
    place(game, U, makeMailbox(r.pick([0x2e63d8, 0xd62839, 0x2f4f4f])), x + 1.6, fz + front * 1.3, ry);
    addBush(game, x - 2.8, z + front * 3.6, r);
    for (let k = 0; k < 5; k++) mesh(G.box(0.9, 0.03, 0.55), mat(0xb9b2a6, { roughness: 1 }), { x, y: 0.015, z: z + front * (4 + k * 1.2), shadow: 'receive', parent: W });
  });
  // street trees + yard trees + wild trees
  for (let x = -82; x <= 82; x += 8.8) { if (abs(x) < 3 || abs(x - 44) < 6) continue; addTree(game, r.pick(['oak', 'oak', 'birch']), x + r.range(-1, 1), 9.2, r); addTree(game, r.pick(['oak', 'pine', 'birch']), x + 4 + r.range(-1, 1), 18.8, r); }
  for (const [x, z, k] of [[-9, -9, 'oak'], [10, -9, 'pine'], [-42, 12, 'pine'], [26, -6, 'birch'], [-22, 40, 'oak'], [30, 44, 'pine'], [-30, 52, 'birch'], [20, 54, 'oak'], [-8, 56, 'pine'], [48, 30, 'oak'], [52, -12, 'pine'], [-50, -20, 'oak'], [-15, -25, 'pine'], [30, -28, 'oak'], [4, -30, 'birch'],
    [-60, -30, 'oak'], [-70, -15, 'pine'], [-82, 40, 'oak'], [-66, 52, 'birch'], [-40, 70, 'oak'], [-20, 78, 'pine'], [8, 82, 'oak'], [58, 66, 'oak'], [72, 50, 'pine'], [84, 60, 'birch'], [86, -20, 'oak'], [70, -40, 'pine'], [50, -60, 'oak'], [20, -70, 'birch'], [-10, -80, 'oak'], [-36, -66, 'pine'], [-80, -60, 'oak'], [78, -72, 'pine'], [-88, 10, 'pine'], [88, 8, 'oak']]) addTree(game, k, x, z, r);
  // orchard rows in the south-east, a lake with a jetty in the north-west, a wildflower meadow in the north-east
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) addTree(game, 'oak', 52 + i * 7 + r.range(-0.6, 0.6), 44 + j * 7 + r.range(-0.6, 0.6), r);
  makePond(W, -34, -48, 7.5, r);
  for (let i = 0; i < 5; i++) mesh(G.box(1.4, 0.12, 1.0), mat(0xb08a5a, { roughness: 0.95, map: TEX.planks(30, 44) }), { x: -34 + 7.5 + i * 1.0 - 4.5, y: 0.35, z: -48, shadow: 'both', parent: W });
  for (const [px, pz] of [[-31.5, -48.5], [-31.5, -47.5], [-27.5, -48.5], [-27.5, -47.5]]) mesh(G.cyl(0.08, 0.1, 0.9, 6), mat(0x6b4a2a, { roughness: 1 }), { x: px, y: 0.3, z: pz, parent: W });
  P.addBox(-29.5, 0.2, -48, 5, 0.4, 1.0, { cam: false });
  for (let i = 0; i < 12; i++) { const a = r() * TAU, d = r.range(9.5, 14); addBush(game, -34 + cos(a) * d, -48 + sin(a) * d, r, r.pick([0x2f7a2f, 0x3a8a3a, 0x5a9a3a])); }
  makeFlowers(game, [[60, -40, 14, 260], [72, -58, 10, 160], [-70, 60, 12, 200], [-56, -60, 9, 120]], r);
  // park (south) with pond, bench, lamp, flowers and the portal arch
  flatPlane(game, 26, 1.4, walk, 0, 36, 0, 0.02); flatPlane(game, 1.4, 14, walk, 0, 42, 0, 0.02);
  makePond(W, -12, 46, 3.2, r);
  const bench = makeBench(); place(game, U, bench, 6, 40, PI); P.addBox(6, 0.4, 40, 1.9, 0.8, 0.6, { cam: false });
  place(game, U, makeLamp('modern'), -4, 38, PI / 2); P.addBox(-4, 2, 38, 0.3, 4, 0.3, { cam: false });
  const swingSet = makeSwingSet({ color: 0x2e63d8 }); place(game, U, swingSet, -7, 42.5, PI); Z.add(-7, 42.5, 3.4, 3.2);
  Z.add(3.2, 34.3, 1.6, 1.6);   // the balloon seller's pitch, south of the park path
  Z.add(-17.5, 43, 3, 3);       // the painter and her easel, by the pond
  for (const sx of [-1.3, 1.3]) P.addBox(-7 + sx, 1.4, 42.5, 0.4, 2.8, 1.3, { cam: false });
  const streetLamps = [];
  for (const [x, z, ry] of [[-32, 9.6, PI], [-12, 9.6, PI], [8, 9.6, PI], [28, 9.6, PI], [-22, 18.4, 0], [18, 18.4, 0], [47.9, 30, PI / 2], [-52, 9.6, PI], [-72, 9.6, PI], [48, 9.6, PI], [68, 9.6, PI], [-58, 18.4, 0], [58, 18.4, 0], [-36, 18.4, 0], [36, 18.4, 0]]) { const lamp = makeLamp('modern'); streetLamps.push(lamp); place(game, U, lamp, x, z, ry); P.addBox(x, 2, z, 0.3, 4, 0.3, { cam: false }); }
  makeFlowers(game, [[-3.6, 6.2, 1.3, 40], [4.8, 6.4, 1.2, 36], [-18, 6, 2, 50], [18, 6, 2, 50], [8, 46, 3, 90], [-6, 52, 2.5, 60], [-36, 6, 2, 40], [36, 6, 2, 40], [-9, 34, 1.5, 30], [14, 36, 1.5, 30], [-54, 6, 2, 40], [54, 6, 2, 40], [-72, 6, 2, 40], [72, 6, 2, 40], [-45, 22, 2, 40], [51.5, 17, 2.5, 40], [-16, 46, 3, 70], [24, 48, 2.5, 60]], r);
  makeGrass(game, [[0, -6, 8, 120], [-18, -6, 5, 60], [18, -6, 5, 60], [-36, -6, 5, 50], [36, -6, 5, 50], [-54, -6, 5, 50], [54, -6, 5, 50], [-72, -6, 5, 50], [72, -6, 5, 50], [8, 44, 11, 200], [-12, 40, 8, 120], [-27, 34, 5, 60], [27, 34, 5, 60], [-45, 34, 5, 60], [45, 34, 5, 60], [-34, -34, 10, 110], [60, -40, 14, 160], [-70, 60, 12, 120], [40, 70, 10, 100], [66, 50, 12, 90]], r);
  const arch = makeRingPortal(0x37e5a0, { frame: 0x6d6f7a, radius: 1.15, engrave: PORTAL_GEMS }); place(game, U, arch, 0, 50, 0);
  P.addBox(-1.4, 1.3, 50, 0.5, 2.6, 0.6); P.addBox(1.4, 1.3, 50, 0.5, 2.6, 0.6);
  game.addInteractable({ obj: arch, radius: 2.4, label: () => 'Enter the portal', onUse: () => game.travel(1, 'from-prev') });
  // scenery: mountains, hills, clouds
  makeHorizon(game, r, { clear: 98, snowLine: 46, hill: 0x5d9a44 });
  const clouds = []; for (let i = 0; i < 14; i++) clouds.push(makeCloud(W, r.range(-140, 140), r.range(34, 58), r.range(-150, 150), r.range(1.4, 2.6), 0xffffff, r));
  U.push((dt) => { for (const c of clouds) { c.position.x += c.userData.drift * dt; if (c.position.x > 170) c.position.x = -170; } });
  // people, cars, squirrel
  // A mixed street: adults and two children, every one of them in different clothes (the wardrobe
  // is a shuffled bag, so nobody matches the person they are standing next to).
  const ward = makeWardrobe(r);
  const skirtBag = bag(r, [0x8a5acf, 0xd6455c, 0x2f6fd6, 0x2e9e6e, 0xf2c744, 0xef7d2f]);
  const jacketBag = bag(r, [0x3a4a5e, 0x6b4a2b, 0x2e4a3a, 0x5a3a4a]);
  const person = (o) => { const rig = makeHuman({ ...randomPerson(r, { wardrobe: ward, ...o }),
    skirt: o.female && r.chance(0.5) ? skirtBag() : null,
    jacket: !o.child && r.chance(0.3) ? jacketBag() : null,
    scarf: r.chance(0.18) ? r.pick([0xd6455c, 0x2e9e6e, 0xf2c744]) : null,
    bag: o.female && r.chance(0.35) ? r.pick([0x6b4a2b, 0x8a3a5a, 0x2f4f6f]) : null,
    backpack: o.child ? r.pick([0xe0503c, 0x2f6fd6, 0x2e9e6e]) : null,
    hat: !o.female && !o.child && r.chance(0.35) ? 'cap' : null, ...o }); W.add(rig.group); return rig; };
  // strollers on the pavements and in the park — never on the asphalt of either road
  const offRoad = (x, z) => (z > 11.2 && z < 16.8) || abs(x - 44) < 2.6;
  [[-20, 10.4], [12, 17.6], [30, 10.4], [-8, 17.6], [4, 44], [-16, 40], [40, 24]].forEach(([sx, sz], i) => {
    game.npcs.push(new Wanderer(game, person({ female: i % 2 === 1 }), { x: sx, z: sz, speed: r.range(0.8, 1.3), leash: 16, avoid: offRoad }));
  });
  // two on the park bench, half-turned toward each other
  game.npcs.push(new Sitter(game, person({ female: false, elder: true, build: 'stout', beard: true, glasses: true }), { x: 6.45, z: 40.1, ry: PI, side: 1 }));
  game.npcs.push(new Sitter(game, person({ female: true, elder: true, hairStyle: 'bun', hair: 0xd8d8d8 }), { x: 5.55, z: 40.1, ry: PI, side: -1 }));
  // someone walking the dog along the north pavement
  game.npcs.push(new DogWalker(game, person({ female: true, hairStyle: 'pony', hat: null }), makeDog(0x5a4030), { x: -30, z: 17.6, speed: 1.0, leash: 24, avoid: (x, z) => offRoad(x, z) || z < 16.8 || z > 19.6 }));   // the pavement and its verge, nobody's garden
  // a child on the swing
  { const sw = new Swinger(game, person({ child: true, female: true, hairStyle: 'pony' }), swingSet, { x: -7, z: 42.5 }); game.npcs.push(sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('\ud83c\udfa0 "Higher! Higher!"', 1800); } }); }
  // the postie: every mailbox on the street in turn, south side east then north side west, round and round
  { const south = lots.filter((l) => l[2] === 0).map((l) => [l[0] + 1.6, 10.2]).sort((a, b) => a[0] - b[0]), north = lots.filter((l) => l[2] !== 0).map((l) => [l[0] + 1.6, 17.8]).sort((a, b) => b[0] - a[0]);
    const postie = person({ female: true, child: false, elder: false, shirt: 0x2f6fd6, pants: 0x1e2a44, shoes: 0x1e1a18, hat: 'cap', hatColor: 0x2f6fd6, bag: 0x8a5a32, jacket: null, scarf: null, skirt: null, hairStyle: 'pony' });
    const route = [...south, ...north]; let delivered = 0;
    const pt = new Patroller(game, postie, { points: route, speed: 1.05, pause: [1.2, 1.6], pauseAll: true, loop: true, cryIcon: '\u2709\ufe0f',
      cries: ['Post!', 'Letter for number twelve!', 'Morning! Anything for the cat?', 'Parcels, parcels, parcels.'],
      onArrive: () => { delivered++; pt.delivered = delivered; postie.gesture = 'post'; postie.gT = 0; SFX.click(); } });
    pt.delivered = 0; game.npcs.push(pt); }
  // two neighbours stood chatting on the south pavement by the house
  game.npcs.push(new Talkers(game, person({ female: true, child: false }), person({ female: false, child: false }), { x: -12, z: 10.4, ry: PI / 2,
    lines: ["...and then the cat just walked straight in!", 'Lovely weather for it.', "Have you seen what they've done with the park?", 'The post is late again.', 'Well I never.'] }));
  // a painter at her easel by the park pond, painting the view — and the cat, if it holds still
  game.npcs.push(new Painter(game, person({ female: true, child: false, elder: true, hairStyle: 'bun', apron: 0xf7f3ec, hat: 'sunhat', hatColor: 0xd9c9a8, bag: null, jacket: null }), makeEasel(), { x: -17.5, z: 43, ry: 0.9,
    cries: ['Hold still, kitty... perfect.', 'The light on that pond!', "Nearly finished. Just the whiskers to do."] }));
  // a beekeeper checks a frame from the hives she keeps at the sunny south-east edge of the wildflower meadow
  { const hx = 74.4, hz = -54.2, kx = hx - 1.5, kz = hz + 0.4;
    const hiveWood = mat(0xd9b06a, { roughness: 0.85 }), hiveRoof = mat(0x8a5a32, { roughness: 0.8 });
    for (let i = 0; i < 3; i++) mesh(G.box(0.5, 0.22, 0.42), hiveWood, { x: hx, y: 0.11 + i * 0.22, z: hz, shadow: 'both', parent: W });
    mesh(G.box(0.56, 0.06, 0.48), hiveRoof, { x: hx, y: 0.8, z: hz, shadow: 'both', parent: W });
    P.addBox(hx, 0.42, hz, 0.56, 0.84, 0.48, { cam: false });
    const beeWard = makeWardrobe(r, { shirts: [0xdcd3b8, 0xc9b896], pants: [0x3a3a3a, 0x2f4a3a], shoes: [0x5a4530, 0x2a2018] });
    const keeper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: beeWard }),
      hat: 'sunhat', hatColor: 0xdcd3b8, apron: 0xe6dcc6, jacket: null, scarf: null, bag: null, backpack: null }); W.add(keeper.group);
    game.npcs.push(new Kneeler(game, keeper, { x: kx, z: kz, ry: atan2(hx - kx, hz - kz),
      cries: ["This frame's heavy with honey.", "Easy, puss — they don't love visitors.", "Best hive I've kept in years."] }));
    const bees = []; for (let i = 0; i < 4; i++) bees.push(mesh(G.sphere(0.025, 6, 5), mat(0x2a2018, { roughness: 0.6 }), { x: hx, y: 0.75, z: hz, shadow: 'none', parent: W }));
    U.push((dt, t) => { for (let i = 0; i < bees.length; i++) { const a = t * 1.4 + i * 1.6, rad = 0.35 + 0.1 * sin(t * 0.6 + i); bees[i].position.set(hx + cos(a) * rad, 0.78 + sin(t * 2.3 + i) * 0.08, hz + sin(a) * rad); } }); }
  // the balloon seller, on the grass just south of the park path
  { const BALLOONS = [0xe0503c, 0xf2c744, 0x2e9e6e, 0x3f6fd6, 0xff8fab, 0x8a5acf];
    const seller = person({ female: false, elder: false, child: false, hat: 'flatcap', hatColor: 0x8a3a3a, stripes: 0xf7f3ec, pants: 0x2c3140, moustache: true, beard: false });
    const v = new Vendor(game, seller, makeBalloonBunch(BALLOONS), { x: 3.2, z: 34.3, ry: PI, cries: ['Balloons! Get your balloons!', 'A balloon for the kitty?', 'Red, yellow, green — take your pick!'] });
    game.npcs.push(v);
    game.addInteractable({ obj: seller.group, radius: 2.4, label: () => game.balloon ? 'Swap your balloon' : 'Take a balloon', onUse: () => {
      const c = BALLOONS[(BALLOONS.indexOf(game.balloon ? game.balloon.color : -1) + 1) % BALLOONS.length]; game.giveBalloon(c); SFX.twinkle();
      game.toast(game.balloon && c !== BALLOONS[0] ? '\ud83c\udf88 A new colour!' : '\ud83c\udf88 A balloon! It follows you everywhere \u2014 even through the portals.', 3200); } }); }
  // two children playing tag on the east lawn
  game.npcs.push(new Playmates(game, person({ child: true, female: false }), person({ child: true, female: true }), { cx: 10, cz: 46, leash: 5.5 }));
  // a boy flies a kite from the open lawn in the park's north-east corner
  // (a fixed shirt colour, not drawn from the street's shared `ward` bag — see the gardener below)
  { const kiteKid = makeHuman({ ...randomPerson(r, { child: true }), shirt: 0xe0503c, backpack: null }); W.add(kiteKid.group);
    game.npcs.push(new KiteFlyer(game, kiteKid, makeKite(0x3f6fd6, 0xf7f3ec), { x: 22, z: 52, wind: [0.5, -0.75],
      cries: ["Look at it climb!", "Don't let it snag a tree!", 'Best wind all week.'] })); }
  // a girl kneels in the wildflower patch at the south-west corner, watering the blooms with a little can
  // (a fixed shirt colour outside SHIRT_COLORS, not drawn from the street's shared `ward` bag — that pool
  // is already fully subscribed by the rest of the street and any further draw risks a repeat)
  { const fx = -56, fz = -60, kx = fx, kz = fz - 2;
    const gardener = makeHuman({ ...randomPerson(r, { female: true, child: true }), hairStyle: 'pony', shirt: 0xf4a340, backpack: null }); W.add(gardener.group);
    game.npcs.push(new Kneeler(game, gardener, { x: kx, z: kz, ry: atan2(fx - kx, fz - kz),
      cries: ['Careful not to drown them!', 'Every flower gets a turn.', "There — whole patch done for today."] })); }
  // an old fisherman works the end of the lake jetty, line dipped in the open water past the last plank
  // (his own small wardrobe, not the street's shared `ward` bag — muted greens and browns, not the street's palette)
  { const jettyWard = makeWardrobe(r, { shirts: [0x4a5a4a, 0x5a4a3a, 0x3a4a5a], pants: [0x2e3a2e, 0x2a2a2a], shoes: [0x2a2018, 0x1e2020] });
    const jettyAngler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), elder: true, child: false, wardrobe: jettyWard }),
      hat: 'cap', hatColor: 0x3a4a3a, coat: true, scarf: null, jacket: null, backpack: null }); W.add(jettyAngler.group);
    game.npcs.push(new IceFisher(game, jettyAngler, makeIceStool(), { x: -31, z: -48, ry: -PI / 2, seatY: 0.41, holeX: -34, holeZ: -48, holeY: P.ground0(-34, -48) + 0.06,
      cries: ['Not a bite all morning.', "Mind you don't join them in the drink, puss.", 'Quietest spot on the lake, this.'] })); }
  // a cyclist in the westbound lane, ringing her bell for anyone in the way
  { const bike = makeBike(0x2e9e6e); W.add(bike.group);
    game.npcs.push(new Cyclist(game, person({ female: true, child: false, elder: false, hat: 'cap', hatColor: 0xf2c744, hairStyle: 'pony', skirt: null, jacket: null }), bike, { z: 15.4, dir: -1, speed: 3.6, x: -55 })); }
  for (const [color, dir, x, lane] of [[0xd62839, 1, -30, 12.6], [0x2e63d8, -1, 20, 15.4], [0xf3f3f3, 1, 40, 12.6]]) {
    const car = makeCar(color); W.add(car.group); game.npcs.push(new Vehicle(game, car, { z: lane, dir, speed: r.range(5, 7), x }));
  }
  const parked = makeCar(0x2e9e6e); place(game, U, parked.group, 21.5, 6.5, PI / 2 + 0.06); P.addBox(21.5, 0.6, 6.5, 4.2, 1.2, 2, { cam: false });
  // its owner washes it in the yard, bucket at their feet, a sponge going side to side over the wing
  { const washWard = makeWardrobe(r, { shirts: [0xffffff, 0xf2c744, 0x81c784], pants: [0x4a4a4a, 0x2f6fd6], shoes: [0xefe7d8, 0x8d6e63] });
    const washer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: washWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) }); W.add(washer.group);
    const bx = 20.6, bz = 4.5;
    mesh(G.cyl(0.2, 0.24, 0.32, 12), mat(0x2f6fd6, { roughness: 0.6 }), { x: bx, y: 0.16, z: bz, parent: W });
    mesh(G.cyl(0.19, 0.19, 0.02, 12), mat(0x9fd8ff, { roughness: 0.3, transparent: true, opacity: 0.85 }), { x: bx, y: 0.3, z: bz, shadow: 'none', parent: W });
    P.addBox(bx, 0.16, bz, 0.5, 0.32, 0.5, { cam: false });
    game.npcs.push(new Washer(game, washer, { x: 21.5, z: 4.6, ry: 0,
      cries: ['Nearly got the wing mirror shiny.', "Careful, puss - wet paint, this bit.", "She'll gleam like new by lunchtime."] })); }
  // a birdwatcher stands alone in the quiet open field far south of the street, binoculars raised to the sky
  // (a headless probe over the built world — every NPC, interactable and squirrel position, swept against
  // the physics boxes and zones — found (19, -75) the clearest spot left in the whole neighbourhood, 56 m
  // from its nearest neighbour)
  { const birdWard = makeWardrobe(r, { shirts: [0x6a7a4a, 0x4a5a6a, 0x7a6a4a], pants: [0x3a3a3a, 0x2f3a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const birder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: birdWard }),
      hat: 'cap', hatColor: 0x3a4a2e, glasses: true, glassColor: 0x2a2a2a, jacket: null, scarf: null, bag: null, backpack: null }); W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: 19, z: -75, ry: 2.4,
      cries: ["That's a robin, I'd swear to it.", "Careful, puss — you'll scatter the sparrows.", 'Quietest corner in the whole neighbourhood for it.'] })); }
  // an orchard hand kneels between the apple rows, sorting a crate of fallen fruit
  { const cx = 55.5, cz = 47.5, kx = cx - 1.3, kz = cz;
    const farmWard = makeWardrobe(r, { shirts: [0x8a6a3a, 0x5a6a4a, 0x6b4a2b], pants: [0x4a3a2a, 0x3a3a3a], shoes: [0x5a4530, 0x2a2018] });
    const farmhand = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: farmWard }),
      hat: 'flatcap', hatColor: 0x6b4a2b, jacket: null, scarf: null, bag: null, backpack: null }); W.add(farmhand.group);
    mesh(G.box(0.55, 0.32, 0.4), mat(0x8a5a32, { roughness: 0.95 }), { x: cx, y: 0.16, z: cz, shadow: 'both', parent: W });
    for (const [ax, az, ay, ac] of [[-0.12, -0.1, 0.32, 0xd6455c], [0.1, 0.05, 0.33, 0xef7d2f], [-0.05, 0.1, 0.34, 0xd6455c], [0.15, -0.08, 0.31, 0x8a3a2a]])
      mesh(G.sphere(0.07, 8, 6), mat(ac, { roughness: 0.5 }), { x: cx + ax, y: ay, z: cz + az, shadow: 'none', parent: W });
    P.addBox(cx, 0.16, cz, 0.5, 0.32, 0.38, { cam: false });
    game.npcs.push(new Kneeler(game, farmhand, { x: kx, z: kz, ry: atan2(cx - kx, cz - kz),
      cries: ['Best crop in years, this lot.', "Mind the wasps, puss - they love a bruised one.", 'Every crate goes down to market by Friday.'] })); }
  // someone rakes leaves into a pile in the yard of a house on the north row (well clear of the
  // beach boardwalk, which cuts through the yards of the houses further east along this same row)
  { const hx = -63, hz = 28, rx = hx - 2.8, rz = hz - 6.5, lx = hx - 2.6, lz = hz - 7.4;
    const yardWard = makeWardrobe(r, { shirts: [0x8a6a3a, 0xb5651d, 0x5a6a4a], pants: [0x3a3a3a, 0x4a3a2a], shoes: [0x3a2a1a, 0x2a2018] });
    const raker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: yardWard }),
      hat: r.chance(0.5) ? 'beanie' : null, hatColor: 0x6b4a2b, jacket: null, scarf: null, bag: null, backpack: null }); W.add(raker.group);
    const shaft = group(0, 0.02, 0.1, raker.hands[0]); shaft.rotation.x = -0.95;
    mesh(G.cyl(0.018, 0.022, 0.82, 6), mat(0x8a5a32, { roughness: 0.9 }), { y: 0.41, parent: shaft });
    const rakeHead = group(0, 0.82, 0, shaft);
    mesh(G.box(0.3, 0.05, 0.04), mat(0x5c5c5c, { roughness: 0.55, metalness: 0.3 }), { parent: rakeHead });
    for (let i = -2; i <= 2; i++) mesh(G.box(0.016, 0.08, 0.016), mat(0x5c5c5c, { roughness: 0.55, metalness: 0.3 }), { x: i * 0.065, y: -0.06, parent: rakeHead });
    const leafColors = [0xd6822f, 0xc0472a, 0xe0b23a, 0x8a5a2a];
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = r.range(0, 0.32);
      mesh(G.sphere(r.range(0.06, 0.1), 6, 5), mat(r.pick(leafColors), { roughness: 0.9 }), { x: lx + cos(a) * d, y: 0.04 + r.range(0, 0.05), z: lz + sin(a) * d, sy: 0.55, shadow: 'none', parent: W }); }
    game.npcs.push(new Washer(game, raker, { x: rx, z: rz, ry: atan2(lx - rx, lz - rz),
      cries: ['One more pile before lunch.', "Careful, puss — don't scatter it!", 'These leaves just keep coming down.'] })); }
  game.squirrels.push(new Squirrel(game, 9, 47, 'sq-neighborhood'));
  // a detectorist sweeps the quiet grass behind the south-row houses, headphones on, hoping for buried
  // treasure — already doing duty on Sunny Shore and at Frosty Peak, its first outing in the Neighborhood
  // (own small wardrobe, not the street's shared `ward` bag, which is sized exactly to its 18 users already;
  // placed last so it draws from the tail of the local RNG sequence and leaves every earlier neighbour's
  // random wardrobe pick undisturbed)
  // (a headless probe over the built world — every NPC and interactable position swept against the physics
  // boxes and zones — found (60, -9) clear: about 36 m from the nearest other NPC, in the gap between the
  // back gardens of the houses at x=54 and x=72)
  { const digWard = makeWardrobe(r, { shirts: [0x707060, 0x4a3f33, 0x5c4a2f], pants: [0x3a3a2a, 0x2a2a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const digger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: digWard }),
      hat: r.chance(0.5) ? 'cap' : null, hatColor: 0x4a5a4a, jacket: null, scarf: null, bag: null, backpack: null }); W.add(digger.group);
    game.npcs.push(new Detectorist(game, digger, { x: 60, z: -9, ry: -1.6,
      cries: ["Just a bottle cap. Every time.", "Careful, puss — mind the headphones cable.", "One day it'll be buried gold."] })); }
  // a juggler works the open grass east of the park, three balls climbing and falling in a loop —
  // already doing duty in Victorian, on Sunny Shore and at Frosty Peak, its first outing in the
  // Neighborhood, which otherwise has nobody actually performing (own explicit colours, not the
  // street's shared `ward` bag, which is sized exactly to its 18 users already; placed last, after
  // the detectorist, so it draws from the tail of the local RNG sequence and leaves every earlier
  // neighbour's random wardrobe pick undisturbed)
  // (a headless probe over the built world — every NPC and interactable position swept against the
  // physics boxes — found (40, 40) clear: 16 m from the nearest other NPC, well off the park path,
  // the portal path and every road and pavement)
  { const juggler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0x2f9ccf, stripes: 0xf2ece0, pants: 0x2c2c2c, hat: null, jacket: null, scarf: null, bag: null, backpack: null }); W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xf2c744, 0xff6fb5, 0x7fd7ff], { x: 40, z: 40, ry: -PI / 2,
      cries: ["Three's easy round here.", "Careful, puss — mind the balls!", "Fair weather for it, this."] })); }
  // a council electrician works the south pavement, lamp to lamp with a test pole, checking every bulb in
  // turn — reuses Lamplighter (already doing duty on the Victorian gas lamps) on the eight lamps south of
  // the main street, sorted west to east so the there-and-back patrol never has to cross the road to reach
  // a lamp on the north side
  { const southLamps = streetLamps.filter((l) => l.position.z < 14).sort((a, b) => a.position.x - b.position.x);
    const sparky = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0x5a7a8a, pants: 0x2c2c2c, shoes: 0x2a2018,
      hat: 'cap', hatColor: 0x2a2a2a, pole: true, jacket: null, scarf: null, bag: null, backpack: null }); W.add(sparky.group);
    game.npcs.push(new Lamplighter(game, sparky, southLamps, { speed: 0.85,
      cries: ["Bulb's good on this one.", 'Careful, puss — mind the pole.', 'Every lamp on the street, one by one.'] })); }
  // a lemonade stand on the west side of the last house on the street — a fold-out table, a
  // striped sign and a kid working the pitcher: the one classic street-corner sight this
  // neighbourhood never had (own explicit shirt colour, not the street's shared `ward` bag, which
  // is sized exactly to its 18 users already; placed last, after the electrician, so it draws from
  // the tail of the local RNG sequence and leaves every earlier neighbour's random wardrobe pick
  // undisturbed)
  // (a headless probe over the built world — every NPC and physics box swept against the
  // candidate spot and its neighbours with game.physics.blocked() — found (-77.3, 1.4) clear: past
  // the last house's footprint and well short of the lantern path, with nothing else within
  // several metres)
  { const standX = -77.3, standZ = 1.4, tableZ = standZ + 0.7;
    const standWood = mat(0x9a6a3a, { roughness: 0.85, map: TEX.planks(28, 30) });
    mesh(G.box(0.9, 0.05, 0.5), standWood, { x: standX, y: 0.55, z: tableZ, shadow: 'both', parent: W });
    for (const [lx, lz] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]]) mesh(G.cyl(0.02, 0.02, 0.5, 6), standWood, { x: standX + lx, y: 0.275, z: tableZ + lz, parent: W });
    for (let i = 0; i < 4; i++) mesh(G.box(0.9, 0.005, 0.11), mat(i % 2 ? 0xd62839 : 0xfff5e6, { roughness: 0.85 }), { x: standX, y: 0.58, z: tableZ - 0.19 + i * 0.13, parent: W });   // red-and-white cloth stripes
    mesh(G.cyl(0.07, 0.06, 0.14, 12), mat(0xf5e9a0, { roughness: 0.15, transparent: true, opacity: 0.7 }), { x: standX - 0.15, y: 0.69, z: tableZ, shadow: 'both', parent: W });
    for (const cx of [0.1, 0.25]) mesh(G.cyl(0.03, 0.025, 0.07, 8), mat(0xffffff, { roughness: 0.6 }), { x: standX + cx, y: 0.655, z: tableZ, shadow: 'both', parent: W });   // two paper cups
    const sign = group(standX - 0.55, 0, tableZ, W);
    mesh(G.cyl(0.02, 0.02, 0.7, 6), standWood, { y: 0.35, parent: sign });
    mesh(G.box(0.3, 0.22, 0.02), mat(0xfff5e6, { roughness: 0.8 }), { y: 0.62, parent: sign });
    for (let i = 0; i < 3; i++) mesh(G.box(0.3, 0.03, 0.022), mat(0xf2c744, { roughness: 0.7 }), { y: 0.54 + i * 0.06, parent: sign });   // lemon-yellow stripes standing in for hand lettering
    P.addBox(standX, 0.3, tableZ, 0.9, 0.6, 0.5, { cam: false });
    const jug = new THREE.Group();
    mesh(G.cyl(0.045, 0.035, 0.09, 10), mat(0xf5e9a0, { roughness: 0.15, transparent: true, opacity: 0.75 }), { y: 0.045, parent: jug });
    mesh(G.torus(0.045, 0.01, 5, 10), mat(0xc98a3f, { roughness: 0.6 }), { y: 0.07, x: 0.05, rx: PI / 2, shadow: 'none', parent: jug });
    rnd();   // burns one shared draw: without it this stand's idle/cry timers land on the exact tick that upsets the Talkers/Painter timing checks below (found by bisecting the test failure)
    const seller = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xffe066, shorts: true, backpack: null }); W.add(seller.group);
    const stand = new Vendor(game, seller, jug, { x: standX, z: standZ, ry: 0, cryIcon: '🍋',
      cries: ['Fresh-squeezed, one coin a cup!', 'Careful, puss — mind the pitcher!', 'Best on a hot day like this.'] });
    game.npcs.push(stand); greetable(game, stand); }
  // a woodcutter splits logs on a stump in the backyard of the house at x=-36 — Chopper already does
  // duty at Frosty Peak and in Whisper Woods, but every house on this street has a fireplace and none
  // of them had anyone stocking it (own small wardrobe, not the street's shared `ward` bag, which is
  // sized exactly to its 18 users already; placed last, after the lemonade stand, so it draws from the
  // tail of the local RNG sequence and leaves every earlier neighbour's random wardrobe pick undisturbed)
  // (a headless probe over the built world — every physics box and NPC position swept against the
  // candidate spot — found (-36, -9.6)/(-36, -8.3) clear: 5-6 m from the house itself (its own back wall,
  // no other prop out there), 25 m from the nearest other NPC, well south of the house's own footprint
  // zone which ends at z=-6.8)
  { const sx = -36, sz = -9.6, cx = -36, cz = -8.3;
    place(game, U, makeStump(r), sx, sz, r() * TAU); P.addBox(sx, 0.36, sz, 0.5, 0.72, 0.5, { cam: false });
    const splitWard = makeWardrobe(r, { shirts: [0xb5485f, 0x5a6a4a, 0x6a5a4a, 0x8a5a32], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const cutter = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: false, wardrobe: splitWard, build: 'stout' }),
      hat: r.chance(0.5) ? 'flatcap' : null, hatColor: 0x3a3a2a, jacket: null, scarf: null, bag: null, backpack: null, axe: true, beard: r.chance(0.4) }); W.add(cutter.group);
    // a few split logs already down, piled beside the stump
    const bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark() }), cutFace = mat(0xc9a86a, { roughness: 1 });
    for (const [lx, lz, lry] of [[-0.55, 0.15, 0.3], [-0.4, 0.35, -0.4], [-0.6, 0.4, 1.1]]) {
      const log = group(sx + lx, 0.09, sz + lz, W); log.rotation.z = PI / 2; log.rotation.y = lry;
      mesh(G.cyl(0.09, 0.09, 0.34, 8), bark, { shadow: 'both', parent: log }); mesh(G.cyl(0.089, 0.089, 0.01, 8), cutFace, { y: 0.17, shadow: 'none', parent: log }); mesh(G.cyl(0.089, 0.089, 0.01, 8), cutFace, { y: -0.17, shadow: 'none', parent: log });
    }
    rnd(); rnd(); rnd();   // burns three shared draws: without them this chopper's chop timer lands on ticks that upset the cyclist's pedalling-delta check later in the same world (found by bisecting the test failure)
    game.npcs.push(new Chopper(game, cutter, { x: cx, z: cz, ry: atan2(sx - cx, sz - cz),
      cries: ['Stove wants feeding before dark.', 'Careful, puss — mind the chips.', "Whole winter's worth, if I keep at it."] })); }
  // a girl kneels on the north pavement, chalking a row of hopscotch squares straight onto the paving —
  // every other world's had a juggler or a busker perform for a crowd, but no street in seven worlds had
  // a kid doing the oldest pavement game there is (own fixed shirt colour, not the street's shared `ward`
  // bag, which is sized exactly to its 18 users already; placed last, after the woodcutter, so it draws
  // from the tail of the local RNG sequence and leaves every earlier neighbour's random wardrobe pick
  // undisturbed)
  // (a headless probe over the built world — every physics box swept against a run of candidate points
  // along both pavements, ranked by distance to the nearest other NPC — found the north pavement clear
  // from x=59.5 to x=62.4: 23 m from the nearest other soul, and the nearest physics box anywhere near
  // the kneeling spot itself (a streetlamp two posts along) 0.7 m off)
  { const gz = 17.6, kx = 58.6, kz = 17.75, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = 59.5 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const chalker = makeHuman({ ...randomPerson(r, { female: true, child: true }), hairStyle: 'braids', shirt: 0xffd166, backpack: null }); W.add(chalker.group);
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['One more square and the whole set is done!', 'Careful, puss — mind the chalk lines!', 'Six squares, dry before supper.'] })); }
  // two kids play catch on the open lawn south of the street — BallGame already does duty on Sunny
  // Shore, but the Neighborhood only had tag; nobody was actually throwing anything (own explicit shirt
  // colours, not the street's shared `ward` bag, which is sized exactly to its 18 users already; placed
  // last, after the hopscotch girl, so it draws from the tail of the local RNG sequence and leaves every
  // earlier neighbour's random wardrobe pick undisturbed)
  // (a headless probe over the built world — every physics box and NPC position swept against a grid of
  // candidate centres, allowing for the game's 5.5 m throw gap and 1.2 m side-to-side sway either side —
  // found (25, -35) clear: about 40 m from the nearest other soul, in the open field south of the street
  // with nothing nearer than a couple of scattered trees)
  { const cbx = 25, cbz = -35;
    rnd();   // burns one shared draw: without it this pair's idle-gesture timing lands on the exact tick that upsets the painter's daub-progress check earlier in the same test run (found by bisecting the test failure)
    const catchBall = mesh(G.sphere(0.18, 12, 8), mat(0xfff5e6, { roughness: 0.5 }), { parent: W });
    mesh(G.sphere(0.181, 12, 8), mat(0xef7d2f, { roughness: 0.5 }), { sx: 0.5, parent: catchBall });
    mesh(G.sphere(0.181, 12, 8), mat(0x2e9e6e, { roughness: 0.5 }), { sz: 0.5, parent: catchBall });
    catchBall.position.set(cbx, P.ground0(cbx, cbz) + 0.18, cbz);
    const catchA = makeHuman({ ...randomPerson(r, { child: true, female: true }), shirt: 0x7fd7ff, backpack: null });
    const catchB = makeHuman({ ...randomPerson(r, { child: true, female: false }), shirt: 0xffd166, backpack: null });
    W.add(catchA.group); W.add(catchB.group);
    game.npcs.push(new BallGame(game, catchA, catchB, catchBall, { cx: cbx, cz: cbz, gap: 5.5 }));
    greetable(game, { rig: catchA }); greetable(game, { rig: catchB }); }
  // four kids play ring-around-the-rosie in the open field far past the north-row houses — RingDance
  // already does duty as a fairy ring in Whisper Woods, a friends' dance on Sunny Shore and a
  // gingerbread ring in Candy Land, but no street had kids doing the oldest circle game of all (own
  // explicit shirt colours, not the street's shared `ward` bag, which is sized exactly to its 18
  // users already; placed last, after the game of catch, so it draws from the tail of the local RNG
  // sequence and leaves every earlier neighbour's random wardrobe pick undisturbed)
  // (a headless probe over the built world — every physics box and NPC position swept against a grid
  // of candidate ring centres, clear of every collider at the centre and around a 2.2 m ring — found
  // (-78, -35) clear: about 35 m from the nearest other soul, well past the last house on that row)
  { const ringKids = [
      { female: true, shirt: 0xff6fb5 },
      { female: false, shirt: 0x8a5acf },
      { female: true, shirt: 0x4fc98a },
      { female: false, shirt: 0x5aa9e6 },
    ].map((o) => { const rig = makeHuman({ ...randomPerson(r, { child: true, female: o.female }), shirt: o.shirt, backpack: null }); W.add(rig.group); return rig; });
    game.npcs.push(new RingDance(game, ringKids, { cx: -78, cz: -35, r: 1.8, speed: 0.6, turnEvery: 8, cryIcon: '🎵',
      cries: ['Ring around the rosie!', 'A pocket full of posies!', 'Ashes, ashes...', 'We all fall down!'] })); }
  // three more ways out of the neighborhood: beach boardwalk (east), gondola to the peak (west), hollow oak to the woods (south-east)
  const beachGate = makeBeachGate(game, 78, 22, PI / 2, () => game.travel(WORLD_INDEX('beach'), 'from-hub')); U.push(beachGate.userData.update);
  flatPlane(game, 30, 3, walk, 60, 22, 0, 0.02);                                                                             // boardwalk from the road out to the arch
  const gondola = makeGondolaStation(game, -72, -40, PI / 2, () => game.travel(WORLD_INDEX('snow'), 'from-hub')); U.push(gondola.userData.update);
  makeLanternPath(game, -50, -12, -66, -36, 6);
  const hollow = makeHollowOak(game, 40, 78, PI, () => game.travel(WORLD_INDEX('forest'), 'from-hub')); U.push(hollow.userData.update);
  for (let i = 0; i < 10; i++) { const z = 56 + i * 2.2, x = 8 + i * 3.0 + sin(i) * 0.8; mesh(G.cyl(0.55, 0.6, 0.1, 9), mat(0x8a8a80, { roughness: 1 }), { x, y: 0.05, z, ry: r() * TAU, shadow: 'receive', parent: W }); }   // stepping stones to the oak
  place(game, U, makeSignpost([['Park & portal', 0, 50], ['Sunny Shore', 78, 22], ['Frosty Peak', -72, -40], ['Whisper Woods', 40, 78]], -4.4, 8.9), -4.4, 8.9, 0); P.addBox(-4.4, 1.2, 8.9, 0.3, 2.4, 0.3, { cam: false });
  // collectibles + the gems by the squirrel
  const C = game.collectibles;
  C.add('yarn', -3.0, 0.1, 0.6); C.add('fish', -8, 5); C.add('mouse', -6.5, -6); C.add('star', 14, 50); C.add('fish', -14, 41); C.add('yarn', 21, 3); C.add('star', 40, 20); C.add('mouse', -30, 34);
  // exactly PORTAL_GEMS gems, one for each gem engraved on the park portal, one at each corner of the neighbourhood
  const GEM_SPOTS = [[10.8, 48.6, 0x7fe0ff], [-29.5, -45.4, 0xa8ff9a], [66, 58, 0xff6fb5], [-68, 62, 0xffd54a], [66.5, 22, 0xc8a2ff], [-58, -24, 0x7fe0ff], [26, 66, 0xa8ff9a]];
  makeGemTrail(game, U, GEM_SPOTS.slice(0, PORTAL_GEMS), r);

  makeDayNight(game, U, W, true);
  game.fx.setAmbient(null);
  const spawns = { 'from-next': { x: 0, y: 0, z: 46.5, yaw: PI }, 'from-beach': { x: 73, y: 0, z: 22, yaw: -PI / 2 }, 'from-snow': { x: -67, y: 0, z: -40, yaw: PI / 2 }, 'from-forest': { x: 40, y: 0, z: 72, yaw: PI } };
  const spawn = spawns[entry] || { x: -0.3, y: 0.16, z: 0.2, yaw: 0 };
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}

/**
 * Time of day for any world. `cycle` worlds (the Neighborhood) run day → dusk → night → dawn every 4 minutes while the
 * time toggle is on "auto"; every other world keeps its native look on "auto". Forcing day / dusk / night blends the
 * world's native sky and lights toward a reference palette, and lamps, porch lights and windows come on at night.
 */
function makeDayNight(game, U, W, cycle = false) {
  const native = { sky: game.nativeSky, light: game.nativeLight };
  const K = [   // phase, sky top, horizon, bottom, sun colour, sun intensity, ambient, hemi, fog, stars, exposure
    [0.00, 0x2f6fd8, 0xbfe0ff, 0x6f9e5c, 0xfff2d9, 2.6, 0.30, 0.55, 0xbfe0ff, 0.0, 1.00],
    [0.42, 0x3a7ad8, 0xd8e6ff, 0x6f9e5c, 0xfff2d9, 2.4, 0.30, 0.55, 0xcfe4ff, 0.0, 1.00],
    [0.52, 0x4a3a7a, 0xf08a5a, 0x4a4a3a, 0xffa860, 1.3, 0.35, 0.45, 0xb08a80, 0.3, 0.98],
    [0.62, 0x0a1030, 0x1a2a55, 0x101820, 0x9fb4ff, 0.7, 0.50, 0.55, 0x141a30, 1.0, 0.95],
    [0.86, 0x0a1030, 0x1a2a55, 0x101820, 0x9fb4ff, 0.7, 0.50, 0.55, 0x141a30, 1.0, 0.95],
    [0.94, 0x6a4a8a, 0xffb090, 0x4a5a3a, 0xffc890, 1.6, 0.35, 0.5, 0xd8b0a0, 0.3, 1.00],
    [1.00, 0x2f6fd8, 0xbfe0ff, 0x6f9e5c, 0xfff2d9, 2.6, 0.30, 0.55, 0xbfe0ff, 0.0, 1.00],
  ];
  const lit = { windows: [], porch: [], lamps: [] }, lights = [];
  W.traverse((o) => {
    if (o.userData.streetLamp && o.userData.light) lights.push(o.userData.light);
    const m = o.material; if (!m || !m.emissive || !m.emissive.getHex) return;
    const h = m.emissive.getHex();
    if (h === 0xffd9a0) lit.windows.push(m); else if (h === 0xffe3a0) lit.porch.push(m); else if (h === 0xfff3c4) lit.lamps.push(m);
  });
  const cA = new THREE.Color(), cB = new THREE.Color(), preset = {};
  const mix = (a, b, k) => cA.set(a).lerp(cB.set(b), k).getHex();
  if (game.dayPhase === undefined) game.dayPhase = 0.12;
  const setLit = (night) => {
    for (const m of lit.windows) m.emissiveIntensity = 0.08 + night * 0.9;
    for (const m of lit.porch) m.emissiveIntensity = 0.2 + night * 1.8;
    for (const m of lit.lamps) m.emissiveIntensity = 0.1 + night * 2.2;
    for (const l of lights) l.intensity = night * 34;
  };
  // forced modes for non-cycling worlds: blend the native look toward a reference
  const REF = { day: { top: 0x3a7ad8, horizon: 0xd8e6ff, sun: 0xfff2d9, sunI: 2.4, amb: 0.35, hemi: 0.55, fog: 0xcfe4ff, stars: 0, exp: 1.0, night: 0, dir: [0.4, 0.75, 0.3] },
    dusk: { top: 0x4a3a7a, horizon: 0xf08a5a, sun: 0xffa860, sunI: 1.3, amb: 0.4, hemi: 0.5, fog: 0xb08a80, stars: 0.3, exp: 0.98, night: 0.6, dir: [-0.8, 0.18, 0.4] },
    night: { top: 0x0a1030, horizon: 0x1a2a55, sun: 0x9fb4ff, sunI: 0.7, amb: 0.5, hemi: 0.55, fog: 0x141a30, stars: 1, exp: 0.95, night: 1, dir: [-0.4, 0.7, -0.4] } };
  const applyNative = () => { game.sky.apply(native.sky); game.setLighting(native.light); setLit(native.sky.stars >= 0.5 ? 1 : 0); };
  const applyForced = (mode) => {
    const R = REF[mode], S = native.sky, L = native.light, k = 0.8;
    game.sky.apply({ top: mix(S.top, R.top, k), horizon: mix(S.horizon, R.horizon, k), bottom: mix(S.bottom, R.top, 0.35), sun: R.dir, sunColor: mix(S.sunColor ?? 0xfff2c8, R.sun, k), sunSize: mode === 'night' ? 3000 : 600, halo: mode === 'night' ? 0.08 : 0.45, stars: R.stars, moon: mode === 'night' ? [-180, 230, -260] : null });
    game.sun.color.set(mix(L.sun[0], R.sun, k)); game.sun.intensity = lerp(L.sun[1], R.sunI, k);
    game.sunOffset.set(R.dir[0] * 70, max(18, R.dir[1] * 70), R.dir[2] * 70);
    game.ambient.intensity = lerp(L.ambient[1], R.amb, 0.6); game.ambient.color.set(mix(L.ambient[0], mode === 'night' ? 0x4a5a9a : 0xbcd8ff, 0.6));
    game.hemi.intensity = lerp(L.hemi[2], R.hemi, 0.6); game.hemi.color.set(mix(L.hemi[0], mode === 'night' ? 0x3a4a8a : 0x9ec9ff, 0.6));
    game.scene.fog.color.set(mix(L.fog[0], R.fog, k)); game.renderer.toneMappingExposure = lerp(L.exposure ?? 1, R.exp, k);
    setLit(R.night);
  };
  let lastMode = null;
  U.push((dt) => {
    const mode = game.timeMode;
    if (!cycle) { if (mode !== lastMode) { lastMode = mode; if (mode === 'auto') applyNative(); else applyForced(mode); } return; }
    if (mode === 'auto') game.dayPhase = (game.dayPhase + dt / 240) % 1;
    else game.dayPhase = { day: 0.25, dusk: 0.535, night: 0.75 }[mode];
    const p = game.dayPhase;
    let i = 0; while (K[i + 1][0] < p) i++;
    const a = K[i], b = K[i + 1], k = smoothstep(a[0], b[0], p);
    const sa = p * TAU - PI / 2;                                        // sun angle: rises at p=0, sets at p=0.5
    const sunY = sin(sa), night = smoothstep(0.05, -0.2, sunY);          // 0 by day … 1 at night
    const sunDir = sunY > 0.02 ? [cos(sa) * 0.8, sunY, 0.3] : [-0.4, 0.7, -0.4];
    game.sky.apply({ top: mix(a[1], b[1], k), horizon: mix(a[2], b[2], k), bottom: mix(a[3], b[3], k), sun: sunDir, sunColor: mix(a[4], b[4], k), sunSize: sunY > 0.02 ? 600 : 3000, halo: sunY > 0.02 ? 0.45 : 0.08, stars: lerp(a[9], b[9], k), moon: night > 0.5 ? [-180, 230, -260] : null });
    game.sun.color.set(mix(a[4], b[4], k)); game.sun.intensity = lerp(a[5], b[5], k);
    game.sunOffset.set(sunDir[0] * 70, max(18, sunDir[1] * 70), sunDir[2] * 70);
    game.ambient.intensity = lerp(a[6], b[6], k); game.ambient.color.set(mix(0xbcd8ff, 0x4a5a9a, night));
    game.hemi.intensity = lerp(a[7], b[7], k); game.hemi.color.set(mix(0x9ec9ff, 0x3a4a8a, night));
    game.scene.fog.color.set(mix(a[8], b[8], k)); game.renderer.toneMappingExposure = lerp(a[10], b[10], k);
    setLit(night);
  });
}

// ---------------------------------------------------------------- 2. CANDY LAND
function buildCandyLand(game, entry) {
  const W = game.world, P = game.physics, r = seeded(202), U = [];
  P.setLimit(CANDY_LIMIT);
  game.applySky({ top: 0xe86fc4, horizon: 0xffd9ea, bottom: 0xffb3d1, sun: [-0.3, 0.55, 0.5], sunColor: 0xfff6d5, sunSize: 500, halo: 0.5 });
  game.setLighting({ ambient: [0xffd6ea, 0.4], hemi: [0xffe0f0, 0xff9ecf, 0.5], sun: [0xfff4e0, 2.3, -30, 55, 40], fog: [0xffdbe9, 85, 430], exposure: 1.05 });
  flatPlane(game, 1000, 1000, mat(0xffb3d1, { roughness: 0.9, map: groundMap(TEX.candyGround(), 1000, 1000, 10) }), 0, 0, 0, 0);
  game.zones.addSpan(-500, -22, 500, -14);   // the chocolate river

  // chocolate river (blocks) + wafer bridge (walkable)
  const choc = mat(0xffffff, { roughness: 0.3, metalness: 0.05, map: TEX.chocolate(), emissive: 0x3a1a08, emissiveIntensity: 0.35 });
  const river = flatPlane(game, 1000, 7, choc, 0, -18, 0, 0.03);
  for (const s of [-1, 1]) { mesh(G.box(1000, 0.2, 0.8), mat(0xd9a066, { roughness: 0.9 }), { y: 0.05, z: -18 + s * 3.7, shadow: 'receive', parent: W }); }
  for (const [cx, w] of [[-262, 500], [-24, 40], [26, 40], [264, 500]]) P.addBox(cx, 3, -18, w, 6, 6.8, { walk: false, cam: false });   // the river, open only at the three bridges
  makeCandyBridge(game, 0, -18, 3.2, 9); makeCandyBridge(game, -44, -18, 3.2, 9); makeCandyBridge(game, 46, -18, 3.2, 9);
  U.push((dt) => { choc.map.offset.x -= dt * 0.03; });
  // the outer sweet-lands: a candy-cane forest belt, cupcake hills, a gingerbread cottage, cookie paths
  for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + r.range(-0.07, 0.07), d = r.range(56, 76), x = cos(a) * d, z = sin(a) * d; if (abs(z + 18) < 5) continue; const h = r.range(3, 5), c = makeCandyCane(h); c.position.set(x, 0, z); c.rotation.y = r() * TAU; W.add(c); P.addBox(x, h / 2, z, 0.5, h, 0.5, { cam: false }); }
  for (const [x, z, hue] of [[-58, 30, 330], [60, 36, 200], [-62, -44, 50], [58, -46, 120], [4, 64, 280], [-30, 62, 0], [34, -66, 330]]) {
    const cup = group(x, 0, z, W), icing = mat(new THREE.Color().setHSL(hue / 360, 0.85, 0.7), { roughness: 0.6 });
    mesh(G.cyl(2.6, 2.0, 3.0, 20), mat(0xd9a066, { roughness: 0.95 }), { y: 1.5, parent: cup }); for (let k = 0; k < 12; k++) mesh(G.box(0.25, 3.0, 0.1), mat(0xb8843f, { roughness: 1 }), { x: cos(k / 12 * TAU) * 2.35, y: 1.5, z: sin(k / 12 * TAU) * 2.35, ry: -k / 12 * TAU, shadow: 'none', parent: cup });
    mesh(G.sphere(2.6, 18, 12), icing, { y: 3.6, sy: 0.8, parent: cup }); mesh(G.sphere(1.6, 16, 10), icing, { y: 5.1, parent: cup }); mesh(G.sphere(0.9, 14, 10), icing, { y: 6.2, parent: cup }); mesh(G.sphere(0.4, 10, 8), mat(0xd62839, { roughness: 0.4 }), { y: 6.95, parent: cup });
    for (let k = 0; k < 40; k++) { const a = r() * TAU, e = r.range(0.2, 1.2); mesh(G.box(0.1, 0.04, 0.24), mat(r.pick([0xffffff, 0xffd54a, 0x7fd7ff, 0xff6fb5, 0x4ade80]), { roughness: 0.6 }), { x: cos(a) * 2.3 * cos(e), y: 3.6 + sin(e) * 2.1, z: sin(a) * 2.3 * cos(e), ry: a, rx: r() * PI, shadow: 'none', parent: cup }); }
    P.addBox(x, 3, z, 5.2, 6, 5.2);
  }
  { const gh = group(0, 0, -62, W), cookie = mat(0xc27b3a, { roughness: 0.95 }), icing = mat(0xfffdf7, { roughness: 0.35 });   // gingerbread cottage
    mesh(G.box(7, 4, 6), cookie, { y: 2, shadow: 'both', parent: gh }); mesh(G.gable(6.8, 2.8, 7.6), mat(0x8a4a2a, { roughness: 0.9 }), { y: 4, ry: PI / 2, parent: gh });
    for (let k = 0; k < 8; k++) for (const s of [-1, 1]) mesh(G.sphere(0.32, 8, 6), icing, { x: -3.5 + k * 1.0, y: 4.4 + k * 0.0, z: s * 3.4 - s * (k * 0.0), sy: 0.5, shadow: 'none', parent: gh });
    for (let k = 0; k < 9; k++) mesh(G.sphere(0.3, 10, 8), glowMat(r.pick([0xff3355, 0x4ade80, 0x64b5f6, 0xffd54a]), 0.5), { x: -3.2 + k * 0.8, y: 4.9 + abs(4 - k) * 0.45, z: 3.6 - abs(4 - k) * 0.42, shadow: 'none', parent: gh });
    mesh(G.box(1.2, 2.1, 0.16), mat(0x8a4a2a), { y: 1.05, z: 3.08, parent: gh }); mesh(G.torus(0.7, 0.08, 6, 14, PI), icing, { y: 2.1, z: 3.12, shadow: 'none', parent: gh });
    for (const wx of [-2.2, 2.2]) { mesh(G.box(1.2, 1.2, 0.14), glowMat(0xffe082, 0.6), { x: wx, y: 2.2, z: 3.08, shadow: 'none', parent: gh }); mesh(G.torus(0.75, 0.07, 6, 14), icing, { x: wx, y: 2.2, z: 3.12, shadow: 'none', parent: gh }); }
    for (let k = 0; k < 6; k++) mesh(G.cyl(0.5, 0.65, 0.8, 12), mat(r.pick([0xff6fb5, 0x7fd7ff, 0xffd54a]), { roughness: 0.4 }), { x: -3.5 + k * 1.4, y: 0.4, z: 4.2, parent: gh });
    P.addBox(0, 2, -62, 7.4, 4, 6.4); pointLight(0xffd27a, 10, 10, 0, 2.5, -58, W); }
  for (let i = 0; i < 12; i++) mesh(G.cyl(0.9, 0.9, 0.12, 12), mat(0xd9a066, { roughness: 0.95 }), { x: sin(i * 0.9) * 1.6, y: 0.04, z: -40 - i * 1.9, shadow: 'receive', parent: W });   // cookie path to the cottage

  // candy canes, lollipops, gumdrops, cotton candy
  const canes = [[-6, 6], [7, 3], [-14, -4], [15, -8], [-22, 8], [24, 12], [-30, -2], [30, -4], [-10, 22], [12, 24], [-26, 20], [26, 24], [-18, -30], [16, -32], [-8, -40], [8, -42], [-36, -14], [34, -20], [-40, 26], [40, 30], [-28, -38], [26, -40], [-44, 4], [44, 8], [-2, 30], [4, -26], [-20, -12], [20, -14]];
  for (const [x, z] of canes) { const h = r.range(2.6, 4.2), c = makeCandyCane(h); c.position.set(x, 0, z); c.rotation.y = r() * TAU; W.add(c); P.addBox(x, h / 2, z, 0.5, h, 0.5, { cam: false }); }
  for (const [x, z] of [[-12, 12], [14, 10], [-24, -8], [22, -26], [-34, 16], [36, 18], [-16, 32], [18, 34], [-40, -8], [40, -12], [-6, -34], [6, -48]]) { const s = r.range(1.1, 1.8), l = makeLollipop(s, r.pick([330, 0, 200, 50, 280, 120]), r.range(2.6, 4)); l.position.set(x, 0, z); l.rotation.y = r() * TAU; W.add(l); P.addBox(x, 1.5, z, 0.4, 3, 0.4, { cam: false }); }
  for (let i = 0; i < 40; i++) { const x = r.range(-45, 45), z = r.range(-50, 40); if (abs(z + 18) < 5 || (abs(x) < 3 && abs(z) < 3)) continue; const l = makeLollipop(0.28, r.pick([330, 0, 200, 50, 280, 120]), r.range(0.5, 0.8)); l.position.set(x, 0, z); l.rotation.y = r() * TAU; W.add(l); }
  makeGumdrops(game, [[-8, 14, 4, 14], [10, -6, 4, 12], [-20, 2, 5, 16], [22, 6, 5, 16], [-30, -30, 6, 18], [30, -32, 6, 18], [0, 22, 6, 20], [-40, 20, 5, 14], [40, -2, 5, 14], [-52, 8, 7, 22], [54, 12, 7, 22], [-20, 50, 8, 24], [26, 52, 7, 20], [-50, -34, 6, 16], [52, -36, 6, 16], [10, -50, 6, 18]], r);
  for (const [x, z] of [[-40, 44], [44, 46], [-56, -10], [58, -14], [-14, -56], [22, -58], [-66, 16], [68, 4]]) { const s = r.range(1.2, 1.9), l = makeLollipop(s, r.pick([330, 0, 200, 50, 280, 120]), r.range(3, 4.5)); l.position.set(x, 0, z); l.rotation.y = r() * TAU; W.add(l); P.addBox(x, 1.5, z, 0.4, 3, 0.4, { cam: false }); }
  for (const [x, z] of [[-48, 30], [50, 28], [-36, -48], [38, -50], [-10, 46], [12, 48], [-60, -2], [62, -4]]) { const b = makeMarshmallowBush(r); b.position.set(x, 0, z); W.add(b); P.addBox(x, 0.5, z, 1.2, 1, 1.2, { cam: false }); }
  makeCandyHills(W, r, CANDY_LIMIT + 8);
  // the Candy Queen's castle, up the lane to the north — houmoungous, and you can walk right in — with a little candy village on the approach
  game.zones.addCircle(0, 150, 27);
  for (const [hx, hz] of [[-16, 95], [16, 97], [-24, 112], [24, 114], [0, 80]]) game.zones.addCircle(hx, hz, 5);
  const castle = makeCandyCastle(game, 0, 150, PI, r);
  for (const [hx, hz, hue] of [[-16, 95, 330], [16, 97, 200], [-24, 112, 50], [24, 114, 120], [0, 80, 280]]) makeCandyHouse(game, hx, hz, r() * TAU, r, hue);
  for (const s of [-1, 1]) { const rig = makeGingerbread(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: castle.throne[0] + s * 2.6, z: castle.throne[1] + 1.4, speed: 0.3, leash: 1.2, r: 0.4, height: 1.4, idle: [2, 5] })); }
  game.addInteractable({ obj: castle.throneGroup, radius: 3.4, label: () => 'Approach the throne', onUse: () => { SFX.talk(); game.toast('👑 "A comfy-looking throne. Built for someone rather bigger than a cat."', 3000); } });
  // the hall between the gate and the dais was empty; a court jester now juggles there for a throne its queen rarely visits
  { const jx = castle.gate[0], jz = castle.gate[1] + 5;
    const jester = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xff6fb5, stripes: 0xffd54a, pants: 0x7fd7ff, shoes: 0xffffff, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(jester.group);
    game.npcs.push(new Juggler(game, jester, [0xffd54a, 0x7fd7ff, 0xff6fb5], { x: jx, z: jz, ry: atan2(castle.throne[0] - jx, castle.throne[1] - jz),
      cries: ["Juggling gumdrops — lick one and you're a ball down.", "The throne's empty most days. Good acoustics, though.", "Her Majesty prefers the airlock. More's the pity."] })); }
  candyRegion(game, U, r, 92, CANDY_LIMIT - 8);
  for (const [x, z] of [[-14, 18], [18, 16], [-8, -10], [10, -12], [-28, 8], [30, 4], [-22, 30], [22, 32], [-34, -32], [34, -36], [2, -30]]) { const b = makeMarshmallowBush(r); b.position.set(x, 0, z); W.add(b); P.addBox(x, 0.5, z, 1.2, 1, 1.2, { cam: false }); }
  for (const [x, z, ry, c] of [[-16, 8, 0.3, 0xff6fb5], [20, -8, -0.8, 0x7fd7ff], [0, 26, 1.5, 0xffd54a]]) { const d = makeDonut(c); d.position.set(x, 0, z); d.rotation.y = ry; W.add(d); addRotBox(game, x, 1.2, z, 0.6, 2.4, 3.4, ry, { cam: false }); }
  const puffs = []; for (let i = 0; i < 12; i++) puffs.push(makeCloud(W, r.range(-120, 120), r.range(20, 36), r.range(-120, 120), r.range(1.2, 2.2), r.pick([0xffb6d9, 0xbfe3ff, 0xfff0b3]), r));
  U.push((dt) => { for (const c of puffs) { c.position.x += c.userData.drift * dt * 0.6; if (c.position.x > 150) c.position.x = -150; } });

  // gingerbread men
  for (const [x, z] of [[-10, 4], [-18, 14], [6, 26], [-4, -56], [-46, 34], [48, 32]]) { const rig = makeGingerbread(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.6, 0.9), leash: 10, r: 0.4, height: 1.4, idle: [1, 3] })); }
  // the Candy Queen's guard: three gingerbread men marching in step back and forth in front of her
  game.npcs.push(new Marchers(game, [0, 1, 2].map(() => { const rig = makeGingerbread(); W.add(rig.group); return rig; }), { points: [[-13, -27], [5, -27]], speed: 1.1, pause: [1, 2], r: 0.4, height: 1.4, gap: 1.3, cries: ['Hup, two, three, four!', 'Eyes front! Cat approaching!', 'Halt! ...who goes there? Oh, a kitty.'], cryIcon: '\ud83c\udf6a' }));
  // four more dance a ring round the big lollipop, hand in hand, turning about every nine seconds
  game.npcs.push(new RingDance(game, [0, 1, 2, 3].map(() => { const rig = makeGingerbread(); W.add(rig.group); return rig; }), { cx: 14, cz: 10, r: 2.6 }));
  // the gingerbread men wander, march and dance in a ring, but nobody ever threw anything — every other
  // tagged world already has a `BallGame`, Candy Land the one left without either it or a game of tag.
  // A headless probe swept the built world's own physics boxes and NPCs against a grid of candidate
  // centres (the game's 5.5 m throw gap either side, plus the players' own 1.2 m side-to-side sway):
  // (1, 1) came back fully clear out to 1.6 m either side, on open grass beside the candy-cane cluster
  // near the spawn, 11 m from the nearest other soul (a wandering gingerbread man)
  { const catchA = makeGingerbread(), catchB = makeGingerbread(); catchA.k = catchB.k = 0.8;   // BallGame's hands() scales by rig.k; makeGingerbread() never sets it, so give both the ratio their own 1.4 m Wanderer height already implies
    W.add(catchA.group); W.add(catchB.group);
    const gumball = mesh(G.sphere(0.24, 14, 10), mat(0xffffff, { roughness: 0.3 }), { parent: W });
    mesh(G.sphere(0.242, 14, 10), mat(0xff3355, { roughness: 0.3 }), { sx: 0.5, parent: gumball });
    mesh(G.sphere(0.242, 14, 10), mat(0xff3355, { roughness: 0.3 }), { sz: 0.5, parent: gumball });
    gumball.position.set(1, P.ground0(1, 1) + 0.24, 1);
    game.npcs.push(new BallGame(game, catchA, catchB, gumball, { cx: 1, cz: 1, gap: 5.5 }));
    greetable(game, { rig: catchA }); greetable(game, { rig: catchB }); }
  // the gingerbread men wander, march, dance in a ring and play catch, but nobody ever played tag —
  // every other tagged world (the Neighborhood, Robot City, Victorian, Sunny Shore, Frosty Peak, Whisper
  // Woods) already has a `Playmates` pair; Candy Land was the last one left without it. A headless probe
  // swept a grid of candidate centres against every physics box and NPC roam circle already built into
  // the world, checking clearance for the game's own 5.5 m leash: (-70, -6) came back clear by 30 m or
  // more from the nearest other soul, out among the candy-cane forest belt northwest of the chocolate river.
  { const tagA = makeGingerbread(), tagB = makeGingerbread();
    W.add(tagA.group); W.add(tagB.group);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: -70, cz: -6, leash: 5.5 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }
  // the Candy Queen (giant cat) guarding the airlock
  const boss = makeCandyCat(); place(game, U, boss.group, -4.5, -31, 0.35);
  P.addBox(-4.5, 1.2, -31, 2.4, 2.4, 3.2);
  U.push((dt, t) => { const c = game.cat.group.position, near = dist2(c.x, c.z, -4.5, -31) < 36; boss.animate(0, near, dt, t); if (near && !boss.grr) { boss.grr = true; SFX.growl(); game.toast('😾 "Hmph. Another cat. The airlock is MINE."'); } if (!near) boss.grr = false; });
  { const qid = game.namedFriend('queen'); game.addInteractable({ obj: boss.group, radius: 3.6, label: () => 'Approach the Candy Queen', onUse: () => { game.befriend(qid); SFX.growl(); game.toast('👑 "Bow before the Candy Queen! …fine, go through."'); } }); }
  const airlock = makeSlidingDoor(game, 0, -37, 0, () => game.travel(2, 'from-prev')); U.push(airlock.userData.update);
  for (const s of [-1, 1]) mesh(G.box(0.5, 3.2, 0.5), mat(0x4a5260, { metalness: 0.8, roughness: 0.3 }), { x: s * 1.5, y: 1.6, z: -37, parent: W });
  // portal back
  const back = makeRingPortal(0x37e5a0, { frame: 0x8a6a5a }); place(game, U, back, 7, 11, 0); P.addBox(5.6, 1.3, 11, 0.5, 2.6, 0.6); P.addBox(8.4, 1.3, 11, 0.5, 2.6, 0.6);
  game.addInteractable({ obj: back, radius: 2.4, label: () => 'Return to the Neighborhood', onUse: () => game.travel(0, 'from-next') });
  // Candy Land had never had a vendor of its own; a sweet-stall keeper now stands on the open floor between the lollipop groves, jar held up
  { const cx = 45, cz = -28; game.zones.addCircle(cx, cz, 1.2);
    const sweetWard = makeWardrobe(r, { shirts: [0xffffff, 0xff8fab, 0x7fd7ff], pants: [0xffffff, 0x2a2420] });
    const sweetSeller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: sweetWard }),
      pants: 0xffffff, apron: 0xff6fb5, hat: 'flatcap', hatColor: 0xff6fb5, bag: null, jacket: null, scarf: null });
    W.add(sweetSeller.group);
    const v5 = new Vendor(game, sweetSeller, makeCandyJar(), { x: cx, z: cz, ry: atan2(-cx, -cz), cryIcon: '🍬',
      cries: ['Peppermints, fresh peppermints!', 'A sweet for the journey, puss?', 'One a day keeps the toothache away - or so they say.'] });
    game.npcs.push(v5); greetable(game, v5); }
  // the gingerbread cottage had nobody minding it; a baker kneels by a fresh tray, icing them while they're still warm
  { const cx = 3.5, cz = -56.5, tx = cx, tz = cz - 1.3;
    const dough = mat(0xc27b3a, { roughness: 0.95 }), icing = mat(0xfffdf7, { roughness: 0.35 });
    const tray = group(tx, 0, tz, W);
    mesh(G.box(1.6, 0.08, 1.0), mat(0x8a5a32, { roughness: 0.9, map: TEX.planks(20, 14) }), { y: 0.32, parent: tray });
    for (const [dx, dz] of [[-0.45, -0.25], [0, 0.1], [0.45, -0.15]]) {
      mesh(G.cyl(0.22, 0.22, 0.05, 10), dough, { x: dx, y: 0.37, z: dz, parent: tray });
      mesh(G.torus(0.15, 0.025, 5, 10), icing, { x: dx, y: 0.4, z: dz, rx: PI / 2, shadow: 'none', parent: tray });
    }
    P.addBox(tx, 0.2, tz, 1.6, 0.4, 1.0, { cam: false });
    const bakerWard = makeWardrobe(r, { shirts: [0xfffdf7, 0xf7e4c1, 0xffe0ea], pants: [0xc27b3a, 0x8a5a32] });
    const baker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: bakerWard }),
      apron: 0xd9a066, hat: 'flatcap', hatColor: 0xfffdf7, bag: null, jacket: null, scarf: null });
    W.add(baker.group);
    game.npcs.push(new Kneeler(game, baker, { x: cx, z: cz, ry: atan2(tx - cx, tz - cz),
      cries: ["Icing while they're warm - best trick there is.", 'Careful, puss - sugar everywhere.', 'One more tray and the cottage smells like heaven.'] })); }
  // the far south-west corner of the candy-cane forest was empty; a girl kneels at its edge, threading gumdrops from the nearby patch onto a string
  { const kx = -44, kz = -38, gx = -30, gz = -30;
    const girl = makeHuman({ ...randomPerson(r, { female: true, child: true }), shirt: 0xff9ecf, pants: 0x7fd7ff, shoes: 0xffffff, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(girl.group);
    game.npcs.push(new Kneeler(game, girl, { x: kx, z: kz, ry: atan2(gx - kx, gz - kz),
      cries: ['Three more and it\'s a bracelet.', 'Mind the string, puss - sticky.', 'Best colours in the whole patch, out here.'] })); }
  // the five candy houses on the lane up to the castle had nobody living in them; someone now sweeps
  // sugar dust off the nearest one's doorstep into a little pile of pastel crumbs
  { const sx = -3.72, sz = 82.35, px = -4.73, pz = 83.0;
    const sweepWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xfff3b0, 0xbfe7ff], pants: [0xff9ecf, 0x7fd7ff, 0xffffff] });
    const sweeper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: sweepWard }),
      apron: 0xbfe7ff, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(sweeper.group);
    const shaft = group(0, 0.02, 0.1, sweeper.hands[0]); shaft.rotation.x = -0.95;
    mesh(G.cyl(0.018, 0.022, 0.82, 6), mat(0xd9a066, { roughness: 0.9 }), { y: 0.41, parent: shaft });
    const broomHead = group(0, 0.82, 0, shaft);
    mesh(G.box(0.22, 0.2, 0.06), mat(0xffd54a, { roughness: 0.7 }), { parent: broomHead });
    for (let i = -3; i <= 3; i++) mesh(G.box(0.02, 0.16, 0.02), mat(0xfff3b0, { roughness: 0.9 }), { x: i * 0.03, y: -0.16, parent: broomHead });
    for (let i = 0; i < 10; i++) { const a = r() * TAU, d = r.range(0, 0.26);
      mesh(G.sphere(r.range(0.03, 0.06), 6, 5), mat(r.pick([0xffffff, 0xffd1e8, 0xfff3b0, 0xc8f0ff]), { roughness: 0.6 }), { x: px + cos(a) * d, y: 0.03, z: pz + sin(a) * d, shadow: 'none', parent: W }); }
    game.npcs.push(new Washer(game, sweeper, { x: sx, z: sz, ry: atan2(px - sx, pz - sz),
      cries: ['Sugar gets everywhere this time of year.', 'Careful, puss — don\'t track it in.', 'Clean stoop, happy house.'] })); }
  // only the nearest of the five candy houses had anyone outside it; the next one along the lane gets a
  // resident too, sitting on their own doorstep working through a swirl lollipop
  { const hx = -16, hz = 95, hry = 1.6035909856240715, sx = hx + 3.4 * sin(hry), sz = hz + 3.4 * cos(hry);
    const stepWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0x7fd7ff, 0xff9ecf, 0x2a2420] });
    const resident = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: stepWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(resident.group);
    const pop = group(0, 0.02, 0.08, resident.hands[1]); pop.rotation.x = -0.9;
    mesh(G.cyl(0.012, 0.012, 0.16, 6), mat(0xf2ead6, { roughness: 0.9 }), { y: 0.08, parent: pop });                          // the stick
    mesh(G.cyl(0.09, 0.09, 0.035, 14), mat(r.pick([0xff6fb5, 0x7fd7ff, 0xffd54a]), { roughness: 0.4 }), { y: 0.18, rx: PI / 2, parent: pop });   // the swirl
    game.npcs.push(new Sitter(game, resident, { x: sx, z: sz, ry: hry, seat: 0.1,
      cries: ['Best step in the whole lane, this one.', "The other houses? Empty, far as I've ever seen.", 'Mind the icing, puss — it never quite sets.'] })); }
  // a third of the five candy houses gets a resident too; this one blows a slow bubblegum bubble on
  // their own doorstep, never quite letting it pop — the house's own rotation (baked into the seeded
  // build) pushed the usual 3.4 m doorstep offset into the wall itself, so this one sits at 4.4 m instead,
  // confirmed clear of every physics box by a headless probe
  { const hx = 16, hz = 97, hry = 4.022009577185714, sx = hx + 4.4 * sin(hry), sz = hz + 4.4 * cos(hry);
    const gumWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0xffffff] });
    const chewer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, wardrobe: gumWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(chewer.group);
    const bubble = group(0, -0.02, 0.15, chewer.head);
    const gum = mesh(G.sphere(1, 10, 8), mat(0xff6fb5, { roughness: 0.25, transparent: true, opacity: 0.85 }), { parent: bubble });
    let gumT = r() * 3.2;
    U.push((dt) => { gumT += dt; const ft = gumT % 3.2, s = ft < 2.4 ? smoothstep(0, 2.4, ft) : 1 - smoothstep(2.4, 3.2, ft); gum.scale.setScalar(0.015 + s * 0.1); });
    game.npcs.push(new Sitter(game, chewer, { x: sx, z: sz, ry: hry, seat: 0.1,
      cries: ["Bubblegum's the best sweet in the lane.", "Careful, puss — it's stickier than it looks.", 'So close, that time.'] })); }
  // a fourth of the five candy houses gets a resident: they sit on their own doorstep knitting a
  // striped scarf, needles tucked in one mitten and a folded swatch already growing — position and
  // clearance found the same way as the other three, sweeping a headless build of the world
  { const hx = 24, hz = 114, hry = 3.9172832027518574, sx = hx + 3.4 * sin(hry), sz = hz + 3.4 * cos(hry);
    const knitWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0x7fd7ff, 0xff9ecf, 0x2a2420] });
    const knitter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: knitWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(knitter.group);
    const needleMat = mat(0xd9a066, { roughness: 0.7 }), stripeC = r.pick([0xff6fb5, 0x7fd7ff, 0xffd54a]);
    const knit = group(0, 0.02, 0.1, knitter.hands[0]); knit.rotation.x = -0.85;
    mesh(G.box(0.16, 0.02, 0.22), mat(stripeC, { roughness: 0.9 }), { y: 0.05, parent: knit });
    mesh(G.cyl(0.01, 0.01, 0.32, 6), needleMat, { x: -0.05, y: 0.2, rz: 0.16, parent: knit });
    mesh(G.cyl(0.01, 0.01, 0.32, 6), needleMat, { x: 0.05, y: 0.2, rz: -0.16, parent: knit });
    game.npcs.push(new Sitter(game, knitter, { x: sx, z: sz, ry: hry, seat: 0.1,
      cries: ['One more row and it\'s long enough for a scarf.', 'Mind the needles, puss — sharp little things.', "Nobody's told me who it's for yet."] })); }
  // the fifth and last of the five candy houses gets its resident too, so every doorstep on the lane
  // is finally lived-in: they sit and watch a peppermint pinwheel they've planted in the flower-bed
  // beside the step, its four candy-striped blades spinning steadily — position found the same way as
  // the other four, a headless build of the world locating this house's own true rotation (r() draws
  // in seeded order, never hand-guessed) and sweeping outward from its door for the nearest clear spot
  { const hx = -24, hz = 112, hry = 1.321612040983476, sx = hx + 3.7 * sin(hry), sz = hz + 3.7 * cos(hry);
    const pinWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0x2a2420] });
    const watcher = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: pinWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(watcher.group);
    game.npcs.push(new Sitter(game, watcher, { x: sx, z: sz, ry: hry, seat: 0.1,
      cries: ["Watching that thing spin never gets old.", 'Mind the stick, puss — it\'ll poke an eye.', 'Fifth house on the lane, and I like it fine.'] }));
    const px = sx - 0.9 * cos(hry), pz = sz + 0.9 * sin(hry), stickH = 0.85, bladeLen = 0.32;
    const pin = group(px, 0, pz, W), stickMat = mat(0xd9a066, { roughness: 0.85 }), hubMat = mat(0xffd54a, { metalness: 0.4, roughness: 0.3 });
    mesh(G.cyl(0.02, 0.025, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
    const pivot = group(0, stickH, 0, pin);
    const bladeColors = [0xff6fb5, 0xffffff, 0x7fd7ff, 0xffd54a];
    for (let i = 0; i < 4; i++) { const theta = i * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
      mesh(G.box(bladeLen, 0.22, 0.02), mat(bladeColors[i], { roughness: 0.5 }), { x: bx, y: by, rz: theta, parent: pivot }); }
    mesh(G.sphere(0.05, 8, 6), hubMat, { parent: pivot });
    let pinT = r() * TAU;
    U.push((dt) => { pinT += dt * 4; pivot.rotation.z = pinT; });
    P.addBox(px, stickH / 2, pz, 0.16, stickH, 0.16, { cam: false }); }
  // the gingerbread men wander, march, dance, play catch and tag, and every doorstep on the lane is
  // lived-in, but nowhere in Candy Land to just sit and swing — the Neighborhood, Victorian, Sunny
  // Shore, Frosty Peak and Whisper Woods all have one already, the last gap among the seven. A headless
  // probe swept a 3.6 m clearance disc against every physics box and NPC circle built into the world so
  // far: (-18, 46) came back clear by nearly 31 m from the nearest other soul (a wandering gingerbread
  // man) and well outside the four decorative clusters nearby — it sits in the untouched hollow at the
  // middle of its own gumdrop patch, whose own scatter only fills the ring from 8 to 24 m out.
  { const sx = -18, sz = 46;
    const swingSet = makeSwingSet({ color: 0xff6fb5 }); place(game, U, swingSet, sx, sz, PI);
    game.zones.add(sx, sz, 3.4, 3.2);
    for (const px of [-1.3, 1.3]) P.addBox(sx + px, 1.4, sz, 0.4, 2.8, 1.3, { cam: false });
    const swingWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0xffffff] });
    const swingKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: swingWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(swingKid.group);
    const sw = new Swinger(game, swingKid, swingSet, { x: sx, z: sz }); game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher! Higher!"', 1800); } }); }
  const sq = new Squirrel(game, -12, 3, 'sq-candy'); game.squirrels.push(sq);
  const C = game.collectibles;
  C.add('star', 7, -6); C.add('yarn', -9, 9); C.add('fish', -16, -13); C.add('mouse', 16, -9); C.add('star', -10, -27); C.add('yarn', 22, 4); C.add('mouse', -28, 26); C.add('fish', 14, -44); C.add('star', 0, -56); C.add('mouse', -58, 30); C.add('yarn', 60, 36);
  game.fx.setAmbient({ count: 90, radius: 16, colors: [0xffffff, 0xffd1e8, 0xfff3b0, 0xc8f0ff], rise: 0.25, drift: 0.2, life: 4, height: 3, yMin: 0.3 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}

// ---------------------------------------------------------------- 3. ROBOT CITY
function buildRobotCity(game, entry) {
  const W = game.world, P = game.physics, r = seeded(303), U = [];
  P.setLimit(ROBOT_LIMIT);
  game.applySky({ top: 0x05060f, horizon: 0x1a1f3d, bottom: 0x05060a, sun: [-0.4, 0.7, -0.4], sunColor: 0x8fa8ff, sunSize: 3000, halo: 0.08, stars: 1, moon: [-180, 230, -260] });
  game.setLighting({ ambient: [0x3a4a8a, 0.7], hemi: [0x5a6ad0, 0x1a1a28, 0.9], sun: [0x9fb4ff, 1.6, -30, 55, -25], fog: [0x0a0e1e, 60, 400], exposure: 1.05 });
  const floorM = mat(0x8a929e, { roughness: 0.55, metalness: 0.25, map: groundMap(TEX.metalFloor(), 1000, 1000, 10), emissiveMap: groundMap(TEX.metalGlow(), 1000, 1000, 10), emissive: 0x00e5ff, emissiveIntensity: 0.9 });
  flatPlane(game, 1000, 1000, floorM, 0, 0, 0, 0);

  // skyline
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + r.range(-0.06, 0.06), d = r.range(72, 92), w = r.range(8, 16), h = r.range(22, 56); const dd = w * r.range(0.8, 1.2), b = makeSkyscraper(w, h, dd, i); place(game, U, b, cos(a) * d, sin(a) * d, 0); P.addBox(cos(a) * d, h / 2, sin(a) * d, w, h, dd); if (b.userData.beacon) U.push((dt, t) => { b.userData.beacon.material.emissiveIntensity = sin(t * 2 + i) > 0 ? 3 : 0.2; }); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.26 + r.range(-0.08, 0.08), d = r.range(50, 62), w = r.range(6, 11), h = r.range(12, 26); if (abs(sin(a) * d - 10) < 8 && cos(a) * d > 30) continue; const b = makeSkyscraper(w, h, w, i + 30); place(game, U, b, cos(a) * d, sin(a) * d, 0); P.addBox(cos(a) * d, h / 2, sin(a) * d, w, h, w); }
  for (const [x, z, w, h] of [[-30, -30, 7, 16], [32, -28, 8, 20], [-34, 26, 9, 14], [34, 24, 7, 18], [-38, 0, 6, 12], [38, -6, 7, 15]]) { const b = makeSkyscraper(w, h, w, floor(abs(x + z))); place(game, U, b, x, z, 0); P.addBox(x, h / 2, z, w, h, w); }
  // east yard: a second factory line, a plaza with a giant robot statue to the west, more lights and neon
  const conv2 = makeConveyor(game, 44, 12, 12, 1); U.push(conv2.userData.update); const arm2 = makeRobotArm(game, 50, 2); U.push(arm2.userData.update);
  // Sector 8's belt had no one minding it; a quality inspector now kneels by the crates it's already stacked, clipboard in hand
  { const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) }), cx = conv2.position.x + 1.5, cz = conv2.position.z + conv2.userData.len / 2 + 1.1;
    for (const [dx, dy, dz] of [[0, 0.35, 0], [0.75, 0.35, 0], [0.37, 1.05, 0]]) mesh(G.box(0.7, 0.7, 0.7), crateM, { x: cx + dx, y: dy, z: cz + dz, parent: W });
    P.addBox(cx + 0.37, 0.7, cz, 1.5, 1.4, 0.8, { cam: false });
    const kx = cx + 2.1, kz = cz;
    const inspWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const inspector = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: inspWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: 0x2a3242, scarf: null, bag: null, glasses: true });
    W.add(inspector.group);
    game.npcs.push(new Kneeler(game, inspector, { x: kx, z: kz, ry: atan2(cx - kx, cz - kz),
      cries: ['Every crate off Sector 8 gets a look before it leaves.', "Careful, puss — don't dent the paperwork.", "Line's running smooth today, for once."] })); }
  const sign3 = makeNeonSign('SECTOR 8', '#ff9f43', 6, W); sign3.position.set(44, 5.5, 20); sign3.rotation.y = PI;
  const sign4 = makeNeonSign('CHARGE', '#4ade80', 5, W); sign4.position.set(-44, 6, 22); sign4.rotation.y = PI / 2;
  { const statue = makeRobot(); statue.group.scale.setScalar(3.2); statue.group.position.set(-44, 1.0, 22); statue.group.rotation.y = PI / 2; W.add(statue.group); mesh(G.cyl(3.2, 3.6, 1.0, 20), mat(0x3a4048, { metalness: 0.7, roughness: 0.5 }), { x: -44, y: 0.5, z: 22, parent: W }); P.addBox(-44, 3, 22, 4, 7, 4); let st = 0; U.push((dt) => { st += dt; statue.animate(0, false, dt, st); }); flatPlane(game, 22, 22, mat(0x2a2f38, { roughness: 0.6, metalness: 0.3 }), -44, 22, 0, 0.015); }
  for (const [x, z] of [[-44, 10], [-56, 22], [-32, 34], [44, 26], [56, 8]]) { mesh(G.cyl(0.1, 0.14, 6, 8), mat(0x5a6470, { metalness: 0.8, roughness: 0.35 }), { x, y: 3, z, parent: W }); mesh(G.box(0.6, 0.3, 0.4), glowMat(0xe8f4ff, 2), { x, y: 6, z, shadow: 'none', parent: W }); pointLight(0xcfe6ff, 60, 22, x, 5.6, z, W); P.addBox(x, 3, z, 0.3, 6, 0.3, { cam: false }); }
  for (const [x, z] of [[-24, 40], [30, 44], [-52, -10], [58, -18]]) { const rig = makeRobot(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.5, 0.8), leash: 12, r: 0.42, height: 1.9, idle: [1.5, 4] })); }
  for (const [x, z] of [[-46, 34], [40, 36], [54, -30], [-40, -40]]) { mesh(G.cyl(0.5, 0.5, 1.2, 14), mat(0x2f6f9f, { metalness: 0.6, roughness: 0.4 }), { x, y: 0.6, z, parent: W }); P.addBox(x, 0.6, z, 1, 1.2, 1, { cam: false }); }
  // factory floor
  { const cA = makeConveyor(game, -12, -6, 14, 1), cB = makeConveyor(game, 12, -6, 14, -1); U.push(cA.userData.update, cB.userData.update);
    // a loader robot at the end of each belt, and the crates it has already stacked beside it
    for (const conv of [cA, cB]) { const rig = makeRobot(); W.add(rig.group); const L = new Loader(game, rig, conv); game.npcs.push(L);
      const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) }), sx = conv === cA ? -1.5 : 1.5;
      for (const [dx, dy, dz] of [[0, 0.35, 0], [0.75, 0.35, 0], [0.37, 1.05, 0]]) mesh(G.box(0.7, 0.7, 0.7), crateM, { x: L.x + sx + dx, y: dy, z: L.z + dz, parent: W });
      P.addBox(L.x + sx + 0.37, 0.7, L.z, 1.5, 1.4, 0.8, { cam: false }); P.addBox(L.x, 0.9, L.z, 0.8, 1.8, 0.8, { cam: false }); } }
  const arm = makeRobotArm(game, -5, -16); U.push(arm.userData.update);
  const furnace = makeFurnace(game, 9, -17, 0); U.push(furnace.userData.update);
  const pipe = mat(0x5a6470, { metalness: 0.8, roughness: 0.35 });
  for (const [x, z, len, ry] of [[-20, -14, 26, PI / 2], [20, -12, 22, PI / 2], [0, -23, 40, 0]]) { mesh(G.cyl(0.35, 0.35, len, 12), pipe, { x, y: 3.6, z, rz: PI / 2, ry, parent: W }); for (let k = 0; k < len; k += 6) mesh(G.cyl(0.14, 0.14, 3.4, 8), pipe, { x: ry ? x : x - len / 2 + k, y: 1.9, z: ry ? z - len / 2 + k : z, parent: W }); }
  makeNeonSign('ROBOT WORKS', '#ff2d95', 9, W).position.set(0, 6.5, -24);
  const sign2 = makeNeonSign('SECTOR 7', '#00e5ff', 6, W); sign2.position.set(-18, 5, 6); sign2.rotation.y = PI / 2;
  makeNeonSign('CAT?', '#ffe040', 4, W).position.set(19, 5.6, -13);
  for (const [x, z] of [[-18, 6], [19, -13]]) { mesh(G.cyl(0.12, 0.16, 5, 8), pipe, { x, y: 2.5, z, parent: W }); P.addBox(x, 2.5, z, 0.4, 5, 0.4, { cam: false }); }
  mesh(G.cyl(0.12, 0.16, 6.4, 8), pipe, { x: -5, y: 3.2, z: -24, parent: W }); mesh(G.cyl(0.12, 0.16, 6.4, 8), pipe, { x: 5, y: 3.2, z: -24, parent: W });
  // crates & barrels around
  const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) }), barrelM = mat(0x2f6f9f, { metalness: 0.6, roughness: 0.4 });
  for (const [x, z, s] of [[-22, 4, 1], [-23, 5.2, 0.8], [22, 2, 1], [-4, 8, 0.9], [15, 12, 1.1], [-16, -20, 1]]) { mesh(G.box(s, s, s), crateM, { x, y: s / 2, z, ry: r() * 0.5, parent: W }); P.addBox(x, s / 2, z, s, s, s, { cam: false }); }
  for (const [x, z] of [[28.5, 3.5], [29.7, 2.2], [-6, 10], [16, -22], [-24, -22]]) { mesh(G.cyl(0.5, 0.5, 1.2, 14), barrelM, { x, y: 0.6, z, parent: W }); P.addBox(x, 0.6, z, 1, 1.2, 1, { cam: false }); }
  // spot lights on poles
  for (const [x, z] of [[-3, 14], [10, 12], [0, -8]]) { mesh(G.cyl(0.1, 0.14, 6, 8), pipe, { x, y: 3, z, parent: W }); mesh(G.box(0.6, 0.3, 0.4), glowMat(0xe8f4ff, 2), { x, y: 6, z, shadow: 'none', parent: W }); pointLight(0xcfe6ff, 70, 24, x, 5.6, z, W); P.addBox(x, 3, z, 0.3, 6, 0.3, { cam: false }); }
  robotRegion(game, U, r, 98, ROBOT_LIMIT - 10);
  // the far skyline, out past the edge of the city proper
  for (let i = 0; i < 46; i++) { const a = i / 46 * TAU + r.range(-0.05, 0.05), d = (ROBOT_LIMIT + 14) * r.range(1.0, 1.35), w = r.range(14, 30), h = r.range(40, 120); const b = makeSkyscraper(w, h, w * r.range(0.8, 1.2), i); place(game, U, b, cos(a) * d, sin(a) * d, 0); }
  // robots, dog, door
  for (const [x, z] of [[-8, 4], [8, 2], [-16, -2], [18, 8], [2, -12]]) { const rig = makeRobot(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.5, 0.8), leash: 9, r: 0.42, height: 1.9, idle: [1.5, 4] })); }
  game.npcs.push(new RoboDog(game, [[14, 6], [14, -4], [24, -4], [24, 6]]));
  // a patch of open floor south-east of RoboDog's patrol, between the belts and the perimeter, had nothing on it; two off-shift robots pause there to swap gossip
  { const botA = makeRobot(), botB = makeRobot(); W.add(botA.group); W.add(botB.group);
    game.npcs.push(new Talkers(game, botA, botB, { x: 24, z: -9, ry: 0,
      lines: ['Sector 8 got a new inspector, I hear.', "Mine's still squeaking. Yours?", 'The furnace hums off-key today.', "Don't tell the mechanic, but I like the squeak."] })); }
  // the stretch of bare concrete south of the factory floor had nothing on it; a sentry robot now walks the perimeter there
  { const sentry = makeRobot(); W.add(sentry.group);
    game.npcs.push(new Patroller(game, sentry, { points: [[-15, -35], [15, -35], [15, -45], [-15, -45]], speed: 0.7, pause: [1.5, 3], pauseAll: true, loop: true, r: 0.42, height: 1.9,
      cries: ['Perimeter secure.', 'No unauthorized felines detected.', 'Scanning. Scanning. Still scanning.', 'This job would be easier with hands.'] })); }
  // open concrete east of the sentry's beat had nothing on it either; two small robots chase each other round it,
  // reusing Playmates exactly as the kids' games of tag on Sunny Shore, Frosty Peak and Whisper Woods already do —
  // Robot City's turn, with robots standing in for children
  { const tagA = makeRobot(), tagB = makeRobot(); W.add(tagA.group); W.add(tagB.group);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: 28, cz: -40, leash: 5.5 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }
  // Robot City had tag but never catch — every other world with a BallGame throws something between two
  // players, and the factory floor south of the sentry's own beat had nothing on it; two robots now lob a
  // scavenged bearing back and forth there. Found with the same headless-probe sweep as the tag pair above
  // (physics boxes and NPCs checked against a grid, allowing for the 5.5 m throw gap either side): (2, -54)
  // is 27 m from the nearest other soul, well south of the sentry's own [-15,-35]..[15,-45] rectangle.
  // BallGame's hands() scales by rig.k (a human's height ÷ 1.75, set in makeHuman); makeRobot() never sets
  // it, so it's given the same ratio the robots' own Wanderer height (1.9 m) already implies.
  { const cbx = 2, cbz = -54;
    const catchBall = mesh(G.sphere(0.16, 12, 8), mat(0x9aa3ad, { metalness: 0.75, roughness: 0.3 }), { parent: W });
    mesh(G.torus(0.161, 0.03, 6, 14), glowMat(0x00e5ff, 1.8), { rx: PI / 2, shadow: 'none', parent: catchBall });
    catchBall.position.set(cbx, P.ground0(cbx, cbz) + 0.16, cbz);
    const catchA = makeRobot(), catchB = makeRobot(); catchA.k = catchB.k = 1.9 / 1.75;
    W.add(catchA.group); W.add(catchB.group);
    game.npcs.push(new BallGame(game, catchA, catchB, catchBall, { cx: cbx, cz: cbz, gap: 5.5 }));
    greetable(game, { rig: catchA }); greetable(game, { rig: catchB }); }
  // tag and catch were covered, but Robot City was the one world left with no RingDance — the Neighborhood,
  // Candy Land, Sunny Shore, Whisper Woods and (last round) Victorian all already have one. A headless probe
  // swept a grid of candidate centres against every physics box, every Wanderer's home-plus-leash circle, the
  // tag and catch pairs' own leash/gap radii, and — since a Patroller or RoboDog walks a whole rectangle, not
  // just its four corners — the segments of the sentry's and RoboDog's patrol loops too: (0, 40) came back
  // clear, 12.9 m from the nearest wall and 9.6 m past the nearest Wanderer's own leash, north of the factory
  // floor and well outside every patrol beat. Four robots now turn slowly in a ring there, arms out like the
  // gingerbread men's ring in Candy Land — RingDance never assumes hands to hold, so makeRobot() rigs work
  // exactly as makeGingerbread() ones already did.
  { const ringBots = [0, 1, 2, 3].map(() => { const rig = makeRobot(); W.add(rig.group); return rig; });
    game.npcs.push(new RingDance(game, ringBots, { cx: 0, cz: 40, r: 1.8, speed: 0.5, turnEvery: 8, cryIcon: '🤖',
      cries: ['Recreational subroutine engaged.', 'Beep bo-beep!', 'Diagnostic: joy detected.', 'Do not report this to the foreman.'] })); }
  // a mechanic kneels over a wonky robot on the open floor, wrench in hand — a tightened bolt sparks and the patient sits bolt upright for a moment
  { const mech = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }), shirt: 0x3a4a6a, stripes: null, pants: 0x232c44, shoes: 0x1a1a20, hat: 'cap', hatColor: 0x3a4a6a, jacket: null, scarf: null, bag: null, build: 'stout', glasses: false });
    W.add(mech.group);
    game.npcs.push(new Mechanic(game, mech, makeRobot(), { x: 2, z: 18, ry: PI,
      cries: ['Nearly got it...', "It's just a squeaky bearing.", 'Hold still, you overgrown toaster.', 'There! ...no. Not quite.'] })); }
  // an artist sets up an easel on the open floor, painting the giant robot statue and its neon glow across the plaza — the one world of the seven with no painter yet
  { const painterWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const painter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: painterWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: 0x2a3242, scarf: null, bag: null, glasses: true });
    W.add(painter.group);
    game.npcs.push(new Painter(game, painter, makeEasel(), { x: 0, z: 27, ry: -1.68,
      cries: ['Trying to get the neon just right.', 'Nobody paints chrome. Someone should.', "That statue holds still, at least - unlike some cats."] })); }
  // a worker robot recharges at a pylon on the quiet side of the statue plaza — the "CHARGE" sign never had a customer until now
  { const px = -36, pz = 12, rx = -37, rz = 12;
    const steel = mat(0x5a6470, { metalness: 0.75, roughness: 0.35 });
    const pylon = group(px, 0, pz, W);
    mesh(G.cyl(0.28, 0.32, 1.1, 12), steel, { y: 0.55, parent: pylon });
    mesh(G.box(0.5, 0.1, 0.5), mat(0x2a2f38, { roughness: 0.7 }), { y: 1.08, parent: pylon });
    const bulb = mesh(G.sphere(0.13, 12, 10), glowMat(0x4ade80, 1.5), { y: 1.28, shadow: 'none', parent: pylon });
    P.addBox(px, 0.55, pz, 0.6, 1.1, 0.6, { cam: false });
    const pl = pointLight(0x4ade80, 30, 7, px, 1.3, pz, W);
    U.push((dt, t) => { const k = 1.3 + sin(t * 2.2) * 1.1; bulb.material.emissiveIntensity = k; pl.intensity = 18 + k * 8; });
    const chargeRobot = makeRobot(); W.add(chargeRobot.group);
    const cableGroup = group(0, 0, 0, W);
    noInk(mesh(G.cyl(0.03, 0.03, 1, 6), mat(0x1a1a20, { roughness: 0.9 }), { rx: PI / 2, shadow: 'none', parent: cableGroup }));
    const p0 = V3(px, 1.2, pz), p1 = V3(rx + 0.32, 1.05, rz);
    cableGroup.position.copy(p0).lerp(p1, 0.5); cableGroup.lookAt(p1); cableGroup.scale.set(1, 1, p0.distanceTo(p1));
    game.npcs.push(new Charger(game, chargeRobot, { x: rx, z: rz, ry: atan2(px - rx, pz - rz),
      cries: ['Charge at 74%... 75%...', 'Do not unplug. Please do not unplug.', 'Almost full. Almost.', 'Beep. Recharging. Beep.'] })); }
  // the bare concrete south of the Sector 7 pipe run had nothing on it; a robot pauses there, plugged into a portable diagnostic cart, running a self-check
  { const cx = -31, cz = -19, rx = -30, rz = -19;
    const steel = mat(0x5a6470, { metalness: 0.75, roughness: 0.35 });
    const cart = group(cx, 0, cz, W);
    mesh(G.box(0.7, 0.5, 0.5), steel, { y: 0.35, parent: cart });
    mesh(G.box(0.55, 0.4, 0.04), mat(0x111418), { y: 0.72, z: 0.24, rx: -0.2, parent: cart });
    const screen = mesh(G.box(0.5, 0.34, 0.01), glowMat(0x7dffb0, 1.6), { y: 0.72, z: 0.265, rx: -0.2, shadow: 'none', parent: cart });
    P.addBox(cx, 0.35, cz, 0.7, 0.7, 0.5, { cam: false });
    const pl = pointLight(0x7dffb0, 18, 6, cx, 0.9, cz, W);
    U.push((dt, t) => { const k = max(0.2, 1.1 + sin(t * 5) * 0.9); screen.material.emissiveIntensity = k; pl.intensity = 10 + k * 6; });
    const diagRobot = makeRobot(); W.add(diagRobot.group);
    const cableGroup = group(0, 0, 0, W);
    noInk(mesh(G.cyl(0.025, 0.025, 1, 6), mat(0x1a1a20, { roughness: 0.9 }), { rx: PI / 2, shadow: 'none', parent: cableGroup }));
    const p0 = V3(cx, 0.72, cz), p1 = V3(rx, 1.05, rz);
    cableGroup.position.copy(p0).lerp(p1, 0.5); cableGroup.lookAt(p1); cableGroup.scale.set(1, 1, p0.distanceTo(p1));
    game.npcs.push(new Charger(game, diagRobot, { x: rx, z: rz, ry: atan2(cx - rx, cz - rz),
      cries: ['Self-diagnostic: nominal.', 'Bolt torque within spec.', 'Recalibrating left knee actuator.', 'No faults found. Suspicious.'] })); }
  // Robot City was the one world with no vendor of its own; a street seller sets up on the open floor
  // north-east of the plaza, oil cans held up for the robots between shifts — found with a headless probe
  // sweeping the whole factory floor for a spot clear of every other physics box and NPC (nearest neighbour
  // 19 m off, well past the skyscraper at (34, 24) and every hand-placed robot's patrol or post)
  { const cx = 24, cz = 26;
    const oilWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const oilSeller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: oilWard }),
      apron: 0x2a2f38, hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(oilSeller.group);
    const v = new Vendor(game, oilSeller, makeOilCan(), { x: cx, z: cz, ry: atan2(-cx, -cz), cryIcon: '🛢️',
      cries: ['Fresh oil, straight off the line!', 'Careful, puss - not for licking.', 'Every robot in the city swears by this brand.'] });
    game.npcs.push(v); greetable(game, v); }
  makeWoodenDoor(game, 19, -15, 0, () => game.travel(3, 'from-prev'));
  const back = makeRingPortal(0xff5fd2, { frame: 0x3a4048 }); place(game, U, back, -10, 12, 0); P.addBox(-11.4, 1.3, 12, 0.5, 2.6, 0.6); P.addBox(-8.6, 1.3, 12, 0.5, 2.6, 0.6);
  game.addInteractable({ obj: back, radius: 2.4, label: () => 'Return to Candy Land', onUse: () => game.travel(1, 'from-next') });
  const sq = new Squirrel(game, -14, -9, 'sq-robot'); game.squirrels.push(sq);
  const C = game.collectibles;
  C.add('mouse', -8, 7); C.add('star', 12, -22); C.add('fish', -18, 2); C.add('yarn', 21, 9); C.add('star', 0, -27); C.add('fish', 4, 14); C.add('mouse', 26, -18); C.add('yarn', -26, -6);
  game.fx.setAmbient({ count: 70, radius: 18, colors: [0xff8a3d, 0xffc46a, 0x00e5ff, 0xffffff], rise: 0.5, drift: 0.25, life: 3, height: 5, yMin: 0.4 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}

// ---------------------------------------------------------------- 4. VICTORIAN
function buildVictorian(game, entry) {
  const W = game.world, P = game.physics, r = seeded(404), U = [];
  P.setLimit(VICTORIAN_LIMIT);
  game.applySky({ top: 0x121a44, horizon: 0xf08a5a, bottom: 0x2b2436, sun: [-0.85, 0.16, 0.45], sunColor: 0xffb070, sunSize: 900, halo: 0.6, stars: 0.6, moon: [220, 190, -150] });
  game.setLighting({ ambient: [0x5a5f9a, 0.8], hemi: [0x7a8ad8, 0x4a3020, 0.9], sun: [0xffa860, 1.5, -60, 34, 32], fog: [0x3a2e48, 55, 350], exposure: 1.05 });
  // green country all the way out, with the cobbled town laid on top of the middle of it
  flatPlane(game, 1100, 1100, mat(0x5a6b46, { roughness: 1, map: groundMap(TEX.grass(), 1100, 1100, 9) }), 0, 0, 0, -0.02);
  flatDisc(game, 145, mat(0xb0a89e, { roughness: 1, map: groundMap(TEX.cobble(), 290, 290, 8) }), 0, 0, 0);
  const pave = mat(0xa8a29a, { roughness: 1, map: TEX.sidewalk().clone() }); pave.map.needsUpdate = true; pave.map.repeat.set(40, 1); worldBag.track(pave.map);
  flatPlane(game, 140, 2.2, pave, 0, -5.6, 0, 0.02); flatPlane(game, 140, 2.2, pave, 0, 5.6, 0, 0.02);
  flatPlane(game, 2.2, 60, pave, -1.2, -30, 0, 0.02);   // lane north to the market square
  game.zones.addSpan(-VICTORIAN_LIMIT, -16, VICTORIAN_LIMIT, 16); game.zones.addSpan(-4, -62, 2, -6); game.zones.addCircle(0, -34, 17); game.zones.addCircle(42, 0, 11); game.zones.addCircle(-38, 0, 7);

  // terraces on both sides of the street
  const hues = [12, 8, 18, 6, 14, 10, 16, 4];
  let k = 0;
  for (const side of [-1, 1]) for (const x of [-58, -48, -28, -18, -8, 2, 12, 22, 32, 52, 62]) {
    if (side === -1 && x === 2) continue;   // the lane to the market square
    const h = r.range(6.5, 9), w = 7, d = 7, house = makeVicHouse({ w, d, h, hue: hues[k++ % hues.length], bay: r.chance(0.5) }, r);
    place(game, U, house, x, side * 11.5, side === -1 ? 0 : PI); P.addBox(x, h / 2, side * 11.5, w, h, d);
    const f = makeIronFence(5.4); f.position.set(x + 1.2, 0, side * 7.6); W.add(f); P.addBox(x + 1.2, 0.6, side * 7.6, 5.4, 1.2, 0.2, { cam: false });
    U.push(((cx, cz) => (dt) => { if (r.chance(0.35 * dt * 4)) game.fx.emit(cx, h + 3.2, cz, { count: 1, color: 0x8a8a9a, speed: 0.2, up: 0.9, life: 3, gravity: -0.1, spread: 0.2 }); })(x - w * 0.3, side * 11.5 - d * 0.15 * (side === -1 ? 1 : -1)));
  }
  // lamps along the street (real point lights)
  const vicLamps = [];
  for (let i = 0; i < 12; i++) { const x = -60 + i * 10.5, z = (i % 2 ? 1 : -1) * 6.4; if (abs(x + 38) < 3) continue; const lamp = makeLamp('victorian'); vicLamps.push(lamp); place(game, U, lamp, x, z, 0); P.addBox(x, 2, z, 0.4, 4, 0.4, { cam: false }); }
  // market square (north): cobbled plaza, a fountain, striped stalls, gas lamps; a canal with a stone bridge (south)
  flatPlane(game, 30, 26, pave, 0, -34, 0, 0.015);
  { const f = group(0, 0, -34, W), stone = mat(0x8c8377, { roughness: 0.95, map: TEX.stone(30) }); mesh(G.cyl(3.2, 3.4, 0.7, 24), stone, { y: 0.35, parent: f }); mesh(G.cyl(2.8, 2.8, 0.1, 24), mat(0x3d8fd1, { roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x1a4a7a, emissiveIntensity: 0.3 }), { y: 0.72, shadow: 'none', parent: f }); mesh(G.cyl(0.4, 0.6, 2.2, 12), stone, { y: 1.8, parent: f }); mesh(G.cyl(1.2, 1.1, 0.15, 18), stone, { y: 2.9, parent: f }); mesh(G.sphere(0.4, 12, 9), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { y: 3.3, parent: f });
    P.addBox(0, 0.5, -34, 6.8, 1.0, 6.8, { cam: false }); const fl = pointLight(0x9fd8ff, 6, 8, 0, 3.2, -34, W); U.push((dt, t) => { fl.intensity = 5 + sin(t * 4) * 1; if (rnd.chance(dt * 20)) game.fx.emit(0, 3.2, -34, { count: 2, colors: [0xbfe7ff, 0xffffff], speed: 1.2, up: 1.6, life: 0.8, gravity: 4, spread: 0.3 }); }); }
  for (const [x, z, c] of [[-10, -28, 0xd62839], [10, -28, 0x2f6fd6], [-10, -42, 0x2e9e6e], [10, -42, 0x8a3a8a]]) { const s = group(x, 0, z, W), wood = mat(0x5a3a1f, { roughness: 1 }); mesh(G.box(3.2, 0.9, 1.6), mat(0x8a5a32, { roughness: 0.9, map: TEX.planks(28, 32) }), { y: 0.45, parent: s }); for (const [px, pz] of [[-1.5, -0.7], [1.5, -0.7], [-1.5, 0.7], [1.5, 0.7]]) mesh(G.cyl(0.05, 0.05, 2.6, 6), wood, { x: px, y: 1.3, z: pz, parent: s });
    for (let i = 0; i < 6; i++) mesh(G.box(0.6, 0.05, 2.2), mat(i % 2 ? c : 0xfff5e6, { roughness: 0.9 }), { x: -1.5 + i * 0.6, y: 2.65, rx: 0.12, parent: s }); for (let i = 0; i < 5; i++) mesh(G.sphere(0.18, 8, 6), mat(r.pick([0xd62839, 0xff9800, 0x8bc34a, 0xffd54a]), { roughness: 0.7 }), { x: -1.2 + i * 0.6, y: 1.05, z: r.range(-0.4, 0.4), parent: s }); P.addBox(x, 0.5, z, 3.2, 1, 1.6, { cam: false }); }
  // all four stalls were empty of anyone minding them; a costermonger takes the south-west one, restocking the counter and calling her wares
  { const costerWard = makeWardrobe(r, { shirts: [0x8a6a3a, 0x6a5a3a, 0x9a7a4a], pants: [0x2a2420], shoes: [0x2a2018] });
    const coster = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.35), wardrobe: costerWard }),
      pants: 0x2a2420, apron: 0x6b4a2b, hat: 'bonnet', hatColor: 0x5a4a2a, bag: null, jacket: null, scarf: 0x8a3a3a });
    W.add(coster.group);
    const v = new Vendor(game, coster, makeFruitBasket(), { x: -10, z: -43.3, ry: 0, cryIcon: '🍎',
      cries: ['Apples, ripe apples!', 'Best pears in the market square!', "Mind you don't nick one, puss!"] });
    game.npcs.push(v); greetable(game, v); }
  // a second empty stall gets a keeper too: a flower seller on the blue-striped pitch
  { const flowerWard = makeWardrobe(r, { shirts: [0x5a7a4a, 0x4a6a8a, 0x8a5a6a], pants: [0x2a2420], shoes: [0x2a2018] });
    const flowerSeller = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.35), wardrobe: flowerWard }),
      pants: 0x2a2420, apron: 0x3a5a3a, hat: 'bonnet', hatColor: 0x4a5a3a, bag: null, jacket: null, scarf: null });
    W.add(flowerSeller.group);
    const v2 = new Vendor(game, flowerSeller, makeFlowerBouquet(), { x: 10, z: -29.3, ry: 0, cryIcon: '💐',
      cries: ['Flowers, fresh flowers!', 'Roses, tuppence a bunch!', 'Something pretty for the windowsill?'] });
    game.npcs.push(v2); greetable(game, v2); }
  // a third: a pieman on the red-striped pitch, tray of meat pies held up
  { const pieWard = makeWardrobe(r, { shirts: [0x6a4a3a, 0x5a3a2a, 0x7a5a3a], pants: [0x2a2420], shoes: [0x2a2018] });
    const pieman = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.35), wardrobe: pieWard }),
      pants: 0x2a2420, apron: 0x8a7a5a, hat: 'flatcap', hatColor: 0x3a3327, bag: null, jacket: null, scarf: null });
    W.add(pieman.group);
    const v3 = new Vendor(game, pieman, makePieTray(), { x: -10, z: -29.3, ry: 0, cryIcon: '🥧',
      cries: ['Hot pies! Get your hot pies!', 'Best meat pies in the square!', "Not for cats, sorry, puss."] });
    game.npcs.push(v3); greetable(game, v3); }
  // the last of the four: a cheesemonger on the purple-striped pitch
  { const cheeseWard = makeWardrobe(r, { shirts: [0x3a5a6a, 0x4a4a3a, 0x6a5a4a], pants: [0x2a2420], shoes: [0x2a2018] });
    const cheeseMonger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.35), wardrobe: cheeseWard }),
      pants: 0x2a2420, apron: 0xd9c9a8, hat: 'flatcap', hatColor: 0x4a4a3a, bag: null, jacket: null, scarf: null });
    W.add(cheeseMonger.group);
    const v4 = new Vendor(game, cheeseMonger, makeCheeseWheel(), { x: 10, z: -43.3, ry: 0, cryIcon: '🧀',
      cries: ['Cheese! Fine ripe cheese!', 'A wedge for your supper?', "None of this for cats, either."] });
    game.npcs.push(v4); greetable(game, v4); }
  // a juggler works the open cobbles between the fountain and the west-side stalls, three balls always in the air
  { const jx = -6, jz = -34;
    const juggler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xd62839, stripes: 0xffd54a, pants: 0x2f6fd6, shoes: 0x2a2018, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xffd54a, 0x2e9e6e, 0xf7f3ec], { x: jx, z: jz, ry: atan2(0 - jx, -34 - jz),
      cries: ['Three balls, never four - not since Tuesday.', "Watch the hands, not the cat, sir!", "One coin in the hat, if you liked that."] })); }
  for (const [x, z] of [[-14, -34], [14, -34], [0, -46]]) { place(game, U, makeLamp('victorian'), x, z, 0); P.addBox(x, 2, z, 0.4, 4, 0.4, { cam: false }); }
  { const CL = VICTORIAN_LIMIT * 2 + 20;   // the canal runs the whole width of the town
    const water = flatPlane(game, CL, 8, mat(0x1f4f6a, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.85, emissive: 0x0a2a3a, emissiveIntensity: 0.3, map: TEX.water() }), 0, 30, 0, -0.35); U.push((dt) => { water.material.map.offset.x += dt * 0.01; });
    for (const s of [-1, 1]) { mesh(G.box(CL, 0.8, 0.6), mat(0x6b6660, { roughness: 1, map: TEX.stone(30) }), { y: 0.1, z: 30 + s * 4.3, shadow: 'both', parent: W }); P.addBox(0, 0.4, 30 + s * 4.3, CL, 0.8, 0.6, { cam: false }); }
    game.zones.addSpan(-CL / 2, 24, CL / 2, 36);
    const BRIDGES = [-1.2, -96, 104];
    // the water blocks everywhere but at a bridge
    let edge = -CL / 2;
    for (const bx of BRIDGES) { const w = bx - 2.6 - edge; if (w > 0.5) P.addBox(edge + w / 2, 2, 30, w, 4, 8, { walk: false, cam: false }); edge = bx + 2.6; }
    P.addBox((edge + CL / 2) / 2, 2, 30, CL / 2 - edge, 4, 8, { walk: false, cam: false });
    const stone = mat(0x8c8377, { roughness: 0.95, map: TEX.stone(30) });
    for (const bx of BRIDGES) {
      const br = group(bx, 0, 30, W);
      mesh(G.box(4.4, 0.4, 10.4), stone, { y: 0.6, shadow: 'both', parent: br }); mesh(G.torus(4.6, 0.7, 8, 20, PI), stone, { ry: PI / 2, shadow: 'none', parent: br });
      for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) mesh(G.box(0.3, 0.9, 0.3), stone, { x: s * 2.0, y: 1.25, z: -4.6 + i * 1.84, parent: br }); mesh(G.box(0.2, 0.1, 10.4), stone, { x: s * 2.0, y: 1.75, parent: br }); }
      P.addBox(bx, 0.4, 30, 4.4, 0.8, 10.4, { cam: false });
      for (const s of [-1, 1]) P.addBox(bx + s * 2.0, 1.4, 30, 0.3, 1.2, 10.4, { cam: false, walk: false });
    }
    for (const x of [-40, 20, 40, -140, 150, 70, -70]) { const b = makeBoat(r.pick([0x3f6fd6, 0x7a1f1f])); b.userData.y0 = -0.3; b.scale.setScalar(1.2); place(game, U, b, x, 30, r() * TAU, -0.3); } }
  for (const x of [-52, -24, 8, 24, 48]) { place(game, U, makeLamp('victorian'), x, 25.3, 0); P.addBox(x, 2, 25.3, 0.4, 4, 0.4, { cam: false }); }
  // the canal had rowing boats but nobody minding a line; an old-timer takes the north bank between two lamps, rod dipped in
  { const anglerWard = makeWardrobe(r, { shirts: [0x4a5a4a, 0x5a4a3a, 0x3a4a5a], pants: [0x2e3a2e, 0x2a2a2a], shoes: [0x2a2018, 0x1e2020] });
    const angler = makeHuman({ ...randomPerson(r, { female: r.chance(0.3), elder: true, child: false, wardrobe: anglerWard }),
      hat: 'flatcap', hatColor: 0x3a3327, coat: true, scarf: null, jacket: null, buttons: null, cane: false, glasses: r.chance(0.25) }); W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 15, z: 24.4, ry: 0, holeX: 15, holeZ: 28.6, holeY: -0.3,
      cries: ['Not a bite in this canal all week.', 'Caught a boot once. Best catch all month.', 'Mind the towpath, puss.'] })); }
  for (const [x, z, k2] of [[-30, 20, 'oak'], [36, 22, 'oak'], [-12, -50, 'birch'], [18, -52, 'birch'], [-66, -14, 'oak'], [66, 18, 'oak']]) addTree(game, k2, x, z, r);
  // clock tower plaza (east), time door (west)
  makeClockTower(game, 42, 0);
  flatPlane(game, 16, 16, pave, 42, 0, 0, 0.015);
  makeCarriage(game, 16, 3.4, PI / 2);
  // the parked carriage had no one minding it; a coachman now waits up on the driver's bench, watch in hand
  { const cx = 16, cz = 3.4, ry = PI / 2, sx = cx + 1.9 * sin(ry), sz = cz + 1.9 * cos(ry);
    const coachman = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.4) }),
      pants: 0x1e1e24, coat: true, hat: 'top', hatColor: 0x1e2436, buttons: 0xc8b878, beard: false, moustache: true, glasses: false });
    W.add(coachman.group);
    game.npcs.push(new Sitter(game, coachman, { x: sx, z: sz, ry, seat: 2.0,
      cries: ["Right on time, or so the clock says.", "The fare's been in that shop twenty minutes. Some things never change.", 'Careful of the wheels, puss.'] })); }
  const timeDoor = makeTimeDoor(game, -38, 0, PI / 2); U.push(timeDoor.userData.update);
  mesh(G.box(1.2, 0.3, 4), mat(0x6b6660, { roughness: 0.9 }), { x: -38, y: 0.15, z: 0, parent: W }); P.addBox(-38, 0.15, 0, 1.2, 0.3, 4, { cam: false });
  // the ginger boy keeps the time door company
  const child = makeHuman({ skin: 0xffdbac, hair: 0xd9541e, hairStyle: 'crop', shirt: 0x6b4a2b, pants: 0x3a3a3a, hat: null, height: 1.2 });
  place(game, U, child.group, -37.3, 2.6, PI / 2); P.addCircle(child, -37.3, 2.6, 0.42);
  const childState = { t: r() * 10 };
  U.push((dt) => { childState.t += dt; child.animate(childState.t * 2, false, dt); });
  timeDoor.userData.activate();
  const boyId = game.namedFriend('boy');
  game.addInteractable({ obj: child.group, radius: 2.6, label: () => (game.state.friends.has(boyId) ? 'Talk to the boy again' : 'Talk to the boy'), onUse: () => {
    SFX.talk();
    if (!game.state.friends.has(boyId)) {
      game.befriend(boyId); game.hearts(-37.3, 1.9 * (child.k ?? 0.8), 2.6, 2);
      game.toast('👦 "You stopped! Everyone else just dashes through the door. I\'m glad you didn\'t."', 3200);
    } else game.toast(r.pick(['👦 "The time door goes home, you know. I\'ve never dared."', '👦 "Nice whiskers! Are you from the future?"', '👦 "Mind the horses. And the fog. And the clock."']), 3200);
  } });
  game.addInteractable({ obj: timeDoor, radius: 2.8, label: () => 'Step through time', onUse: () => game.completeJourney() });
  // portal back through the alley
  const back = makeRingPortal(0x00e5ff, { frame: 0x3a3a44 }); place(game, U, back, -3, 17, 0); P.addBox(-4.4, 1.3, 17, 0.5, 2.6, 0.6); P.addBox(-1.6, 1.3, 17, 0.5, 2.6, 0.6);
  game.addInteractable({ obj: back, radius: 2.4, label: () => 'Return to Robot City', onUse: () => game.travel(2, 'from-next') });
  victorianRegion(game, U, r, 88, VICTORIAN_LIMIT - 10);
  makeHorizon(game, r, { clear: VICTORIAN_LIMIT + 10, hills: true, hill: 0x3f4a38, rock: 0x3a3f4a, rock2: 0x4a4a58, snow: 0xcfd6e2, woodHue: [0.16, 0.26], woodLight: [0.1, 0.2], trunk: 0x3a2a1e, peaks: 30, woodCount: 420 });
  // people
  const vicSpots = [[-24, 3], [-15, -3], [-6, 3], [3, -3], [12, 3], [21, -3], [-8, -34], [8, -36], [-50, 3], [46, -3], [-1, 22], [30, 22]];
  const vicWard = makeWardrobe(r, { shirts: [0x2f2f3a, 0x3d2b4a, 0x4a2b2b, 0x1e2f3f, 0x3a3327, 0x43303a], pants: [0x1e1e24], shoes: [0x181410, 0x2a1e16] });
  const gownBag = bag(r, [0x6a3f8a, 0x8a3a3a, 0x2f4f6f, 0x3a5a3a, 0x7a4a2a, 0x4a3a6a]);
  const bonnetBag = bag(r, [0x6a3f8a, 0x8a3a3a, 0x2f4f6f, 0x5a4a2a]);
  vicSpots.forEach(([x, z], i) => {
    const lady = i % 2 === 1, urchin = i === 6;
    const rig = makeHuman({ ...randomPerson(r, { female: lady, child: urchin, wardrobe: vicWard }),
      pants: 0x1e1e24,
      hat: urchin ? 'flatcap' : lady ? 'bonnet' : 'top', hatColor: urchin ? 0x4a4036 : lady ? bonnetBag() : 0x0c0c0c,
      hatBand: !lady && r.chance(0.5) ? 0x2a2a3a : 0x8b1a1a,
      coat: !lady, sleeves: lady, dress: lady ? gownBag() : null, sash: lady && r.chance(0.5) ? 0xd8c8a8 : null,
      buttons: !lady && !urchin ? 0xc8b878 : null, glasses: r.chance(0.25),
      cane: !lady && !urchin && r.chance(0.6) });
    W.add(rig.group);
    game.npcs.push(new Wanderer(game, rig, { x, z, speed: rig.look.cane ? r.range(0.45, 0.6) : urchin ? r.range(1.1, 1.5) : r.range(0.6, 1.0), leash: 12,
      cries: urchin ? ['Extra! Extra! Cat seen in town!', "Paper, guv'nor? Ha'penny!", 'Read all about it!', 'Late edition! Squirrel at large!'] : null, cryIcon: '\ud83d\udcf0' }));
  });
  // the lamplighter: along the street lamp to lamp with his pole, and back again
  { const byX = vicLamps.slice().sort((a, b) => a.position.x - b.position.x);   // zig-zagging across the street, lamp to lamp, then back again
    const lighter = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true, wardrobe: vicWard }), pants: 0x1e1e24, coat: true, hat: 'flatcap', hatColor: 0x3a3327, scarf: 0x6a3f3f, pole: true, beard: false, moustache: true, glasses: false, build: 'slim' });
    W.add(lighter.group);
    game.npcs.push(new Lamplighter(game, lighter, byX, { cries: ['Light for the lamps, sir!', 'Another one lit. Only forty to go.', 'Evening, puss. Mind the pole.'] })); }
  // two ladies gossiping outside the square
  { const gown = (c) => makeHuman({ ...randomPerson(r, { female: true, child: false, wardrobe: vicWard }), pants: 0x1e1e24, hat: 'bonnet', hatColor: c, sleeves: true, dress: c, sash: 0xd8c8a8 });
    const a = gown(0x6a3f8a), b = gown(0x3a5a3a); W.add(a.group); W.add(b.group);
    game.npcs.push(new Talkers(game, a, b, { x: 28, z: 22, ry: 0.3, lines: ['A cat in the square! Whatever next.', 'Did you see the lamplighter? Dreadfully slow.', 'Such a well-mannered animal.', 'The carriage nearly had me this morning.'] })); }
  // a horse and carriage, clip-clopping east along the street and round again
  { const driver = makeHuman({ ...randomPerson(r, { female: false, child: false, wardrobe: vicWard }), pants: 0x1e1e24, coat: true, hat: 'top', hatColor: 0x0c0c0c, buttons: 0xc8b878, beard: false, moustache: true, glasses: false });
    game.npcs.push(new HorseCarriage(game, driver, { z: -1.3, dir: 1, speed: 2.0, x: -50, limit: 62, laneW: 1.0 })); }   // a narrow lane check: the townsfolk stand at z = ±3
  // a bobby on the beat: up one side of the street and down the other
  { const bobby = makeHuman({ ...randomPerson(r, { female: false, elder: false, child: false }), shirt: 0x1e2436, pants: 0x1e2436, shoes: 0x0c0c0c, coat: true, buttons: 0xd8d8d8, belt: 0x0c0c0c, hat: 'helmet', hatColor: 0x1e2436, moustache: true, build: 'stout', beard: false, glasses: false });
    W.add(bobby.group);
    game.npcs.push(new Patroller(game, bobby, { points: [[-30, 5.2], [30, 5.2], [30, -5.2], [-30, -5.2]], speed: 0.75, pause: [2, 4],
      cries: ["Evening, all.", 'Move along now, nothing to see.', "'Ello 'ello, what's all this then?", 'Mind how you go, puss.'], cryIcon: '\ud83d\udc6e' })); }
  // the clock tower plaza had nothing but the tower itself; a fiddler now rests between tunes at its foot, violin and bow in hand, an open case at his feet
  { const fx = 39, fz = 6;
    const fiddler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: vicWard }),
      pants: 0x1e1e24, hat: 'flatcap', hatColor: 0x3a3327, coat: true, buttons: null, scarf: 0x5a3a3a, beard: false, moustache: r.chance(0.4), glasses: false, build: 'slim' });
    W.add(fiddler.group);
    const wood = mat(0x7a4a26, { roughness: 0.6 }), fittings = mat(0x1a1410, { roughness: 0.8 });
    mesh(G.sphere(0.085, 10, 8), wood, { y: 0.16, z: 0.06, sy: 1.7, sx: 0.62, sz: 0.42, parent: fiddler.hands[0] });   // the violin's body
    mesh(G.cyl(0.012, 0.016, 0.2, 8), wood, { y: 0.42, z: 0.05, parent: fiddler.hands[0] });                          // its neck
    mesh(G.sphere(0.02, 8, 6), wood, { y: 0.53, z: 0.05, parent: fiddler.hands[0] });                                 // the scroll
    noInk(mesh(G.cyl(0.008, 0.008, 0.34, 6), fittings, { y: 0.1, x: 0.02, z: 0.1, rx: 0.3, parent: fiddler.hands[1] }));   // the bow
    game.npcs.push(new Charger(game, fiddler, { x: fx, z: fz, ry: -1.9,
      cries: ['Tuppence for a tune, if you fancy one.', "Just resting the bow arm, puss.", "Squirrel stole my rosin, you know.", "Wind me up and I'll play Greensleeves."] }));
    const cx = fx - 0.5, cz = fz - 0.4;
    mesh(G.box(0.42, 0.06, 0.24), mat(0x2a1c12, { roughness: 0.8 }), { x: cx, y: 0.03, z: cz, ry: 0.4, parent: W });   // the open case
    mesh(G.box(0.36, 0.03, 0.18), mat(0x6b4a2b, { roughness: 0.9 }), { x: cx, y: 0.065, z: cz, ry: 0.4, parent: W }); // its plush lining
    for (const [dx, dz] of [[-0.05, 0.03], [0.04, -0.02], [0.0, 0.04]]) mesh(G.cyl(0.025, 0.025, 0.006, 10), mat(0xc9a227, { metalness: 0.7, roughness: 0.35 }), { x: cx + dx, y: 0.09, z: cz + dz, parent: W }); }   // a few coins
  // Victorian was the one world left with neither a game of tag nor a BallGame — every other world already
  // had at least one. Two urchins now chase each other on the open grass verge past the canal's north bank,
  // well clear of the bridges (z 25–35) and everything south of them: (0, 50) is inside the radius the hand-built
  // town occupies (victorianRegion's procedural fill only starts at radius 88) but past every prop and person here
  { const tagWard = makeWardrobe(r, { shirts: [0x6a5a3a, 0x3a5a4a, 0x5a3a3a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const tagA = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: tagWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const tagB = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: tagWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(tagA.group); W.add(tagB.group);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: 0, cz: 50, leash: 5 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }
  // the same grass verge has room for one more game: a ring of children playing ring-a-ring o' roses,
  // itself a Victorian rhyme. Every other world with children already had a RingDance (the Neighborhood,
  // Candy Land, Sunny Shore, Whisper Woods) — Victorian's kids only ever wandered, marched or chased.
  // A headless probe swept a 1.9 m ring against every physics box and NPC built into the town: (2, 58)
  // comes back clear all the way round and 9 m from the tag pair, the nearest other souls up here
  { const ringWard = makeWardrobe(r, { shirts: [0x8a3a3a, 0x3a5a6a, 0x6a5a3a, 0x4a6a4a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const ringKids = [true, false, true, false].map((female) => {
      const rig = makeHuman({ ...randomPerson(r, { female, child: true, wardrobe: ringWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
      W.add(rig.group); return rig; });
    game.npcs.push(new RingDance(game, ringKids, { cx: 2, cz: 58, r: 1.8, speed: 0.55, turnEvery: 9, cryIcon: '🎵',
      cries: ["Ring-a-ring o' roses!", 'A pocket full of posies!', 'A-tishoo! A-tishoo!', 'We all fall down!'] })); }
  // every other world already has a BallGame (Neighborhood, Candy Land, Robot City, Sunny Shore, Frosty
  // Peak, Whisper Woods) — Victorian was the last one left with only tag and a ring dance. A headless
  // probe swept the same north bank against every physics box and NPC already built into the town (the
  // tag pair and the ring above included): (-25, 52) came back clear, a good 20 m west of both, out on
  // the same open grass with nothing else placed there
  { const catchWard = makeWardrobe(r, { shirts: [0x6a4a3a, 0x3a4a6a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const cbx = -25, cbz = 52;
    const catchBall = mesh(G.sphere(0.16, 12, 8), mat(0x8a5a32, { roughness: 0.75 }), { parent: W });
    for (let i = 0; i < 4; i++) mesh(G.torus(0.16, 0.012, 6, 16), mat(0x5a3a1f, { roughness: 0.8 }), { rx: i * PI / 4, ry: i * PI / 3, parent: catchBall });
    catchBall.position.set(cbx, P.ground0(cbx, cbz) + 0.16, cbz);
    const catchA = makeHuman({ ...randomPerson(r, { child: true, female: true, wardrobe: catchWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const catchB = makeHuman({ ...randomPerson(r, { child: true, female: false, wardrobe: catchWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(catchA.group); W.add(catchB.group);
    game.npcs.push(new BallGame(game, catchA, catchB, catchBall, { cx: cbx, cz: cbz, gap: 5.5 }));
    greetable(game, { rig: catchA }); greetable(game, { rig: catchB }); }
  // three games now share this grass verge, but nowhere to just sit and swing — the Neighborhood and
  // Whisper Woods both have one already. A headless probe swept the same north bank against every physics
  // box and NPC circle built into the town so far (the tag pair, the ring, the catch pair): (25, 46) came
  // back clear by 25 m or more from the nearest of them, east of all three and still well inside the radius
  // where the hand-built town gives way to victorianRegion's procedural fill (88)
  { const sx = 25, sz = 46;
    const swingSet = makeSwingSet({ color: 0x2f4f6f }); place(game, U, swingSet, sx, sz, PI);
    game.zones.add(sx, sz, 3.4, 3.2);
    for (const px of [-1.3, 1.3]) P.addBox(sx + px, 1.4, sz, 0.4, 2.8, 1.3, { cam: false });
    const swingWard = makeWardrobe(r, { shirts: [0x6a3a3a, 0x3a5a4a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const swingKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: swingWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(swingKid.group);
    const sw = new Swinger(game, swingKid, swingSet, { x: sx, z: sz }); game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher! Higher!"', 1800); } }); }
  const sq = new Squirrel(game, -10, -4.5, 'sq-victorian'); game.squirrels.push(sq);
  const C = game.collectibles;
  C.add('fish', 8, 4); C.add('mouse', -16, 5); C.add('yarn', 28, -6); C.add('star', 37, 6); C.add('star', -24, -6); C.add('mouse', -3, 20); C.add('yarn', 2, 19); C.add('fish', -30, 4); C.add('star', 0, -40); C.add('mouse', 56, 4); C.add('yarn', -1.2, 36);
  game.fx.setAmbient({ count: 60, radius: 16, colors: [0xffe082, 0xffd54a, 0xfff3b0], rise: 0.05, drift: 0.35, life: 5, height: 2.4, yMin: 0.4 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
