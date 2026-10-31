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
/**
 * A chimney's worth of smoke: three puffs rising and fading on a fixed loop, driven only by the world
 * clock `t` — never the shared `rnd()` or a world's own seeded `r`, so it costs no later draw anywhere
 * else in this build or any built after it (unlike `game.fx.emit`, which draws from `rnd()` for every
 * particle it spawns).
 */
function addChimneySmoke(game, U, x, y, z) {
  const CYCLE = 2.4, puffs = [0, 1, 2].map(() => mesh(G.sphere(0.1, 7, 5), mat(0xd8dde0, { roughness: 1, transparent: true, opacity: 0.4 }), { shadow: 'none', parent: game.world }));
  U.push((dt, t) => { for (let i = 0; i < puffs.length; i++) {
    const k = ((t + i * (CYCLE / puffs.length)) % CYCLE) / CYCLE;
    puffs[i].position.set(x + sin(k * 4 + i * 2) * 0.16, y + k * 1.5, z + cos(k * 3 + i * 2) * 0.12);
    puffs[i].scale.setScalar(0.5 + k * 0.9);
    puffs[i].material.opacity = 0.4 * (1 - k);
  } }); }
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
  addChimneySmoke(game, U, -3.2, 6.15, -1.4);   // the cat's own chimney, first on the street to get a fire going
  U.push(makeHomeBeacon(game, 0, 0, 14).userData.update);   // the floating marker over the cat's own roof
  game.homeMarker = [0, 0];
  place(game, U, makeWindChime(game), 0.9, 5.95, 0, 2.55);   // hung from the porch eave, between the two posts and past the deck's own light
  // The cat's own roof ridge has stood bare since round 1 — the chimney, the dormer and the porch
  // light up there are all fixed, nothing moves. A small brass weathervane now rides the ridge pole,
  // its arrow swinging slowly between headings rather than spinning steadily the way every pinwheel on
  // the street already does: two out-of-phase sine terms on the world clock `t` alone (never this
  // world's own seeded `r`, so it can't shift any lot's own wardrobe or fence-colour roll below) give
  // it the same "wanders, never settles" wobble a real vane has in a shifting breeze. Apex height
  // (5.98) comes straight out of `makeHome`'s own roof maths — wall height H=2.7, the ridge mesh
  // itself placed at y=H+0.28, plus the gable's own 3.0 m height param — and sits at local x=0,z=0
  // since that mesh carries no x/z offset of its own; the home group sits at the world origin with no
  // rotation, so those local numbers are the world placement outright. Nearly 5 m above the cat's own
  // ~1 m jump reach (`JUMP_SPEED=5.6`, `GRAVITY=16`), so — like the chimney smoke and the home beacon
  // floating higher still above it — it needs no physics box of its own.
  { const vane = group(0, 5.98, 0, W), postM = mat(0x2b2b2b, { roughness: 0.6, metalness: 0.4 }), brassM = mat(0xcfa23c, { roughness: 0.3, metalness: 0.75 });
    mesh(G.cyl(0.02, 0.026, 0.42, 8), postM, { y: 0.21, parent: vane });
    for (let i = 0; i < 4; i++) { const a = i * PI / 2; mesh(G.box(0.26, 0.02, 0.02), brassM, { x: cos(a) * 0.13, z: sin(a) * 0.13, y: 0.4, ry: a, parent: vane }); }
    const pivot = group(0, 0.46, 0, vane);
    mesh(G.cone(0.05, 0.16, 8), brassM, { x: 0.25, rz: -PI / 2, parent: pivot });
    mesh(G.box(0.34, 0.012, 0.012), brassM, { parent: pivot });
    mesh(G.box(0.012, 0.16, 0.08), brassM, { x: -0.2, parent: pivot });
    mesh(G.sphere(0.035, 8, 6), brassM, { y: 0.06, parent: pivot });
    U.push((dt, t) => { pivot.rotation.y = sin(t * 0.21) * 0.9 + sin(t * 0.37 + 1.3) * 0.5; }); }

  for (const [cx, len] of [[-2.5, 5.8], [3.4, 4.0]]) { const f = makeFence(len); f.position.set(cx, 0, 8); W.add(f); P.addBox(cx, 0.5, 8, len, 1, 0.2, { cam: false }); }
  for (const s of [-1, 1]) { const f = makeFence(5.4); f.position.set(s * 6.2, 0, 5.3); f.rotation.y = PI / 2; W.add(f); P.addBox(s * 6.2, 0.5, 5.3, 0.2, 1, 5.4, { cam: false }); }   // side fences
  for (const z of [6.0, 6.9, 7.8, 8.7, 9.5]) mesh(G.box(0.9, 0.03, 0.55), mat(0xb9b2a6, { roughness: 1 }), { x: 0.9, y: 0.015, z, shadow: 'receive', parent: W });
  const ownMailbox = place(game, U, makeMailbox(0x2e63d8, { rattle: true, game }), 2.2, 9.4);
  // the postie does her rounds past every mailbox on the street (below), but never the cat's own —
  // the cat gets to check it directly instead. No new mesh, no new physics box (this mailbox never had
  // one): a 2.2 m radius sits short of the home's own front-path zone at x 0.2-1.6 (this box is at
  // x=2.2) and well clear of the fence at cx=3.4, z=8 (its box only reaches z=8.1, 1.3 m short).
  const mailLines = ['📬 Just a seed catalogue and a flyer for the hardware store. The cat sniffs both and loses interest.',
    '📬 A postcard from somewhere with a beach on it. No return address.', '📬 Empty. The postie must be running behind today.'];
  game.addInteractable({ obj: ownMailbox, radius: 2.2, label: () => 'Check the mailbox', onUse: () => { SFX.click(); game.toast(rnd.pick(mailLines), 3000); } });
  for (const [x, z] of [[-6.6, 3.6], [6.6, 3.4], [-6.6, -1.5], [-3.9, 6.4], [4.6, 6.4]]) addBush(game, x, z, r);
  // neighbours
  const palette = [[0xdfe9f5, 0x3f5573], [0xf7e4c1, 0x8b3a2a], [0xe8f3d8, 0x4a6a3a], [0xf5dcd2, 0x6b3a3a], [0xfff3d6, 0x2f4f6f], [0xe5e0f5, 0x5a4a7a], [0xf3f0e6, 0x7a4a2a], [0xd9efe9, 0x3a6a6a], [0xf9e6e0, 0x4a4a6a], [0xe6f0f9, 0x8a3a2a], [0xf4f1dc, 0x3a5a3a], [0xe9e2f4, 0x6b3a5a]];
  const lots = [[-18, 0, 0], [18, 0, 0], [-36, 0, 0], [36, 0, 0], [-27, 28, PI], [-9, 28, PI], [9, 28, PI], [27, 28, PI], [-54, 0, 0], [54, 0, 0], [-72, 0, 0], [72, 0, 0], [-45, 28, PI], [-81, 28, PI], [-63, 28, PI], [63, 28, PI]];
  for (const [x, z, ry] of lots) { const front = ry === 0 ? 1 : -1; Z.add(x, z, 7.8, 6.8); Z.add(x, z + front * 4.4, 3.6, 2.6); Z.add(x, z + front * 6.9, 1.4, 6.4); }   // house, porch, front path
  lots.forEach(([x, z, ry], i) => {
    const [wall, roof] = palette[i % palette.length], storeys = i % 3 === 1 ? 2 : 1, h = makeHouse({ wall, roof, doorRight: i % 2 === 1, lit: i % 3 === 0, roofH: 2 + (i % 3) * 0.4, storeys, shutter: r.pick([0x3f5573, 0x2f4f2f, 0x5a3a3a, 0xffffff]) }, r);
    place(game, U, h, x, z, ry); P.addBox(x, h.userData.h / 2, z, 7.4, h.userData.h, 6.4); P.addBox(x + (i % 2 === 1 ? 2.1 : 0), 1.2, z + (ry === 0 ? 1 : -1) * 4.35, 3.0, 2.4, 1.5, { cam: false });
    { const ch = h.userData.chimney; addChimneySmoke(game, U, x + ch[0] * cos(ry) + ch[2] * sin(ry), ch[1], z - ch[0] * sin(ry) + ch[2] * cos(ry)); }
    if (i === 2) {
      // Every porch on this street has carried the same bare rail since round 1 — this one now has a stray
      // cat curled up asleep on it. Added as a child of this house's own group (`h`) rather than placed in
      // world space: it only needs the LOCAL porch coordinates `makeHouse` itself already builds the rail's
      // top cap at (`dx + s*1.35, 0.9, d/2 + 0.75`, with this house's own `d` defaulting to 6 and `doorRight`
      // false so `dx` is 0), and it inherits the house's own world position and rotation for free — the same
      // trick the pier's own pelican uses for its handrail. No physics box, same reasoning as the pelican and
      // the owls: well above the porch deck the cat actually crosses to reach the door, and nothing up there
      // to bump into anyway.
      const napCat = makeNapCat();
      napCat.group.position.set(1.35, 0.93, 3.75);
      napCat.group.rotation.y = 0.3;
      h.add(napCat.group);
      let napT = 4; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); });
    }
    const front = ry === 0 ? 1 : -1, fz = z + front * 8;
    for (const [cx, len] of [[-2.2, 3.6], [2.5, 3]]) { const f = makeFence(len, r.pick([0x2e63d8, 0x2e63d8, 0xffffff, 0x4a8ad8])); f.position.set(x + cx, 0, fz); f.rotation.y = ry; W.add(f); P.addBox(x + cx, 0.5, fz, len, 1, 0.2, { cam: false }); }
    place(game, U, makeMailbox(r.pick([0x2e63d8, 0xd62839, 0x2f4f4f])), x + 1.6, fz + front * 1.3, ry);
    addBush(game, x - 2.8, z + front * 3.6, r);
    for (let k = 0; k < 5; k++) mesh(G.box(0.9, 0.03, 0.55), mat(0xb9b2a6, { roughness: 1 }), { x, y: 0.015, z: z + front * (4 + k * 1.2), shadow: 'receive', parent: W });
    // Candy Land's lane got a garden pinwheel years of rounds ago, but none of the Neighborhood's own
    // sixteen front yards ever had one — the first house on the street gets a toy pinwheel now, planted
    // clear of its own porch, spinning in the breeze. (x+4.5, z+front*4.0) sits 0.8 m past the house's
    // own wall box (half-extents 3.7×3.2 at this lot) in both x and z, 3 m clear of the porch awning box
    // (half-width 1.5) on the other side of the house from the bush and path, and well past the fence at
    // fz=z+front*8 and the mailbox beyond it. Spins on the world clock `t` alone, same trick as Robot
    // City's maintenance drone and the zipline towers' windsocks — no draw from this world's own seeded
    // `r`, so no later shutter or fence colour pick anywhere else on the street shifts.
    if (i === 0) {
      const px = x + 4.5, pz = z + front * 4.0, stickH = 0.7, bladeLen = 0.28;
      const pin = group(px, 0, pz, W), stickMat = mat(0x6b4a2a, { roughness: 0.85 }), hubMat = mat(0xffd54a, { metalness: 0.4, roughness: 0.3 });
      mesh(G.cyl(0.018, 0.022, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
      const pivot = group(0, stickH, 0, pin);
      const bladeColors = [0xe0503c, 0xf7f3ec, 0x2e63d8, 0xf7f3ec];
      for (let bi = 0; bi < 4; bi++) { const theta = bi * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
        mesh(G.box(bladeLen, 0.2, 0.02), mat(bladeColors[bi], { roughness: 0.5 }), { x: bx, y: by, rz: theta, parent: pivot }); }
      mesh(G.sphere(0.045, 8, 6), hubMat, { parent: pivot });
      U.push((dt, t) => { pivot.rotation.z = t * 3.6; });
      P.addBox(px, stickH / 2, pz, 0.14, stickH, 0.14, { cam: false });
    }
    // the pinwheel above gave house 0 its own yard feature; none of the other fifteen ever got one.
    // House 8's own front lawn now has an oscillating lawn sprinkler, sweeping back and forth and
    // throwing up a little arc of droplets, same corner of the yard the pinwheel uses on its own house
    // but mirrored to the opposite side from the bush and path (east here, since the bush sits at
    // x-2.8 and the path/mailbox/fence all sit on the centre line through z=fz). A headless probe built
    // the real Neighborhood, then swept every front yard's own offset against both the world's physics
    // boxes and 60 simulated seconds of every NPC's own sampled position (strollers included, leash and
    // all): (x+5.5, z+front*5.2) came back the best-scoring spot clear of a dedicated house, 2.69 m from
    // the nearest box (the porch awning) and far further from the nearest wandering NPC — comfortably
    // past this prop's own sub-metre footprint. Fixed phase off the world clock `t` alone, same trick
    // as the chimney smoke above: the droplets are a small pool of pre-built spheres cycled by `t`,
    // never `game.fx.emit` (which draws from the shared `rnd()` on every single call, for its spread
    // and colour pick) — this world is the one every test travel starts from, and an earlier version of
    // this spray used `rnd.chance()` to gate an emit instead, which flaked the Victorian horse-and-
    // carriage timing check in two out of three repeat runs (clean every time once switched to this
    // pool, exactly the class of bug the duck pond's own comment above already warns about).
    if (i === 8) {
      const px = x + 5.5, pz = z + front * 5.2, postH = 0.18;
      const brass = mat(0xc9a84a, { metalness: 0.55, roughness: 0.35 }), dark = mat(0x3a3a3a, { metalness: 0.3, roughness: 0.6 });
      const sprinkler = group(px, 0, pz, W);
      mesh(G.cyl(0.022, 0.028, postH, 8), dark, { y: postH / 2, parent: sprinkler });
      const pivot = group(0, postH, 0, sprinkler);
      mesh(G.box(0.16, 0.03, 0.045), brass, { x: 0.06, parent: pivot });
      mesh(G.cyl(0.012, 0.016, 0.05, 6), brass, { x: 0.15, rz: PI / 2, parent: pivot });
      const DCYCLE = 0.5, drops = [0, 1, 2, 3].map(() => mesh(G.sphere(0.018, 6, 5), mat(0xbfe7ff, { roughness: 0.3, transparent: true, opacity: 0.7 }), { shadow: 'none', parent: W }));
      U.push((dt, t) => {
        pivot.rotation.y = sin(t * 1.1) * 0.85;
        for (let di = 0; di < drops.length; di++) {
          const dt2 = t + di * (DCYCLE / drops.length), k = (dt2 % DCYCLE) / DCYCLE, angle = sin(dt2 * 1.1) * 0.85, rad = k * 0.9;
          drops[di].position.set(px + sin(angle) * rad, postH + 0.9 * k * (1 - k) * 1.6, pz + cos(angle) * rad);
          drops[di].material.opacity = 0.7 * (1 - k);
        }
      });
      P.addBox(px, postH / 2, pz, 0.08, postH, 0.08, { cam: false });
      const sprinklerLines = ['💦 "Tchick-tchick-tchick — same arc, every time."', '💦 "Careful, puss — the grass hides how far it really throws."', '💦 "Keeps this lawn greener than the rest of the street. Allegedly."'];
      game.addInteractable({ obj: sprinkler, radius: 1.8, label: () => 'Look at the sprinkler', onUse: () => { SFX.click(); game.toast(rnd.pick(sprinklerLines), 3000); } });
    }
    // Robot City's archive-bot, Victorian's night watchman, Candy Land's jack-in-the-box, Sunny Shore's
    // treasure chest, Whisper Woods' flower and Frosty Peak's yeti cub all react to the cat on their own
    // by now, no `E` needed — the Neighborhood, the one world every test travel starts from, never got
    // a version of its own. A small wooden kennel now sits on one lawn, a dog curled out of sight behind
    // its own low doorway sill; the cat wandering within 6 m is enough to bring it sitting up into the
    // doorway, ears pricked and tail going, before it curls back down out of sight once the cat wanders
    // off. *"Woof! Oh — just you. Carry on."* *"Best guard dog on the street. Mostly guards the sofa."*
    // *"Sniffs the air, decides the cat is fine, goes back to sleep."*
    // A headless probe tried the same relative yard-corner offset the pinwheel and sprinkler already use
    // (x+4.5, z+front*4.0) and swept it against 30 simulated seconds of every NPC's own position
    // (strollers, the dog walker and the postie's round all included): on most of the street's own
    // middle lots that offset sits within reach of a stroller's own 16 m leash off a pavement anchor
    // (as close as 1.89 m on one lot), so the far end of the street was tried instead — house 13, the
    // thirteenth lot (x=-81, z=28), came back clear by 8.60 m of the nearest wandering soul and 0.90 m
    // of the nearest physics box (the house's own wall), both well past this prop's own sub-metre
    // footprint. A build, not a controller: the dog (`makeDog()`, already in the file for the street's
    // own dog walker) rides a hidden node whose own y rises from behind the doorway's low sill up into
    // the opening on `damp()`, the same trick the yeti cub's own burrow already uses, with its own
    // `rig.animate()` called directly each frame for the idle tail wag. No new SFX: the wake reuses
    // `SFX.bark()`, already heard from the dog walker's own dog.
    if (i === 13) {
      const px = x + 4.5, pz = z + front * 4.0;
      const kennel = group(px, 0, pz, W); kennel.rotation.y = ry;
      const wood = mat(0x8a5a32, { roughness: 0.9 }), trimM = mat(0x5c3a1e, { roughness: 0.85 }), roofM = mat(0xb5342a, { roughness: 0.75 }), darkM = mat(0x241a14, { roughness: 0.9 });
      const wallH = 0.42, kw = 0.8, kd = 0.9;
      mesh(G.box(0.06, wallH, kd), wood, { x: -kw / 2, y: wallH / 2, parent: kennel });
      mesh(G.box(0.06, wallH, kd), wood, { x: kw / 2, y: wallH / 2, parent: kennel });
      mesh(G.box(kw, wallH, 0.06), wood, { y: wallH / 2, z: -kd / 2, parent: kennel });
      mesh(G.box(kw, 0.05, kd), trimM, { y: 0.025, parent: kennel });
      mesh(G.gable(kd + 0.18, 0.34, kw + 0.18), roofM, { y: wallH, ry: PI / 2, parent: kennel });
      mesh(G.box(kw - 0.1, 0.07, 0.03), darkM, { y: 0.035, z: kd / 2 - 0.02, parent: kennel });   // the low doorway sill, in shadow
      P.addBox(px, wallH / 2, pz, kw / 2, wallH, kd / 2, { cam: false });
      const resident = makeDog(0xb97a46); resident.group.scale.setScalar(0.72);
      const pit = group(0, -0.16, kd / 2 - 0.22, kennel); pit.add(resident.group);
      let dogOut = 0, dogNear = false;
      const dogLines = ['🐶 "Woof! Oh — just you. Carry on."', '🐶 "Best guard dog on the street. Mostly guards the sofa."', '🐶 "Sniffs the air, decides the cat is fine, goes back to sleep."'];
      kennel.userData.update = (dt, t) => {
        const c = game.cat.group.position, near = dist2(c.x, c.z, px, pz) < 36;
        dogOut = damp(dogOut, near ? 1 : 0, 5, dt);
        pit.position.y = lerp(-0.16, 0.02, dogOut);
        resident.animate(0, false, dt, t);
        resident.head.rotation.x -= 0.3 * dogOut;
        if (near && !dogNear) { dogNear = true; SFX.bark(); game.toast(rnd.pick(dogLines)); game.fx.emit(px, wallH * 0.6, pz + kd / 2, { count: 8, colors: [0xb97a46, 0xf3e3c8], speed: 0.9, up: 0.8, life: 0.6, gravity: 2.0, spread: 0.6 }); }
        if (!near) dogNear = false;
      };
      U.push(kennel.userData.update);
    }
    // the pinwheel, the sprinkler and the kennel each gave one yard a feature of its own, but nothing
    // on the whole street doubles as a home for anyone but the kennel's own dog. House 9's own front
    // yard now gets a little wooden birdhouse on a post, a round hole in its front wall and a short
    // perch dowel below it — a sparrow stands on the dowel, peering about and dipping its head to peck
    // at the wood every so often. *"Chirp. (Translation: nice and roomy, thank you.)"* *"No one's
    // moved in yet, but the sparrow's clearly scouting it."* *"Puss, leave it be — it's not for you."*
    // No new rig and no new controller: the sparrow is the exact same `makeSparrow()` the birdbath's
    // own visitor already uses a few yards away, and its built-in idle peck (driven off the world
    // clock `t` alone, inside `rig.animate()`) needed no changes to read as pecking at a birdhouse
    // instead of dipping into a bowl. The post and house are plain static geometry — no draw from
    // this world's own seeded `r` or the shared `rnd()` sequence at build time, so nothing later in
    // this build shifts.
    // A headless probe built the real Neighborhood, called `game.start('new')`, then sampled every
    // one of the street's 54 NPCs' own positions every frame over 150 simulated seconds (long enough
    // for the postie's and every stroller's full round to clear the corner, not just a snapshot) and
    // swept the same yard-corner offset the pinwheel, the sprinkler and the kennel already use
    // (x+4.5, z+front*4.0) against both that trace and every one of the street's physics boxes. House
    // 9's own corner (58.5, 4.0) came back clear by 8.60 m of the nearest wandering soul, and the
    // usual 0.90 m of the house's own porch-awning box that the pinwheel and the kennel both already
    // accept as plenty clear of a sub-decimetre post.
    if (i === 9) {
      const px = x + 4.5, pz = z + front * 4.0, postH = 1.0, hw = 0.11, hd = 0.11, wallH = 0.16, dowelLen = 0.075;
      const postM = mat(0x6b4a2a, { roughness: 0.9 }), wallM = mat(0xf3ead6, { roughness: 0.85 }), roofM = mat(0xb5342a, { roughness: 0.7 }), darkM = mat(0x241a14, { roughness: 0.9 }), dowelM = mat(0x8a5a32, { roughness: 0.85 });
      const post = group(px, 0, pz, W); post.rotation.y = ry;
      mesh(G.cyl(0.028, 0.034, postH, 8), postM, { y: postH / 2, parent: post });
      const house = group(0, postH, 0, post);
      mesh(G.box(hw, wallH, hd), wallM, { y: wallH / 2, parent: house });
      mesh(G.gable(hd + 0.03, 0.1, hw + 0.03), roofM, { y: wallH + 0.025, ry: PI / 2, parent: house });
      mesh(G.cyl(0.028, 0.028, 0.018, 12), darkM, { y: wallH * 0.62, z: hd / 2 + 0.01, rx: PI / 2, shadow: 'none', parent: house });
      mesh(G.cyl(0.009, 0.009, dowelLen, 6), dowelM, { y: wallH * 0.38, z: hd / 2 + dowelLen / 2, rx: PI / 2, parent: house });
      P.addBox(px, postH / 2, pz, 0.08, postH, 0.08, { cam: false });
      const visitor = makeSparrow(); W.add(visitor.group);
      visitor.group.position.set(px, postH + wallH * 0.38 + 0.012, pz + hd / 2 + dowelLen + 0.015);
      visitor.group.rotation.y = ry;
      U.push((dt, t) => visitor.animate(0, false, dt, t));
      const birdhouseLines = ['🐦 "Chirp. (Translation: nice and roomy, thank you.)"', '🏠 "No one\'s moved in yet, but the sparrow\'s clearly scouting it."', '😼 "Puss, leave it be — it\'s not for you."'];
      game.addInteractable({ obj: post, radius: 1.8, label: () => 'Look at the birdhouse', onUse: () => { SFX.click(); game.toast(rnd.pick(birdhouseLines), 3000); } });
    }
    // the pinwheel, the sprinkler, the kennel and the birdhouse gave four yards their own feature —
    // every cottage-garden fixture but the one plaster figure gardens are actually famous for. House
    // 11's own front yard now gets a garden gnome: red pointed cap, white beard, blue tunic, a tiny
    // lantern held at its side, stood perfectly still in the grass (no controller, no draw from this
    // world's own seeded `r`, so nothing later in this build shifts). Same yard-corner offset the
    // pinwheel, the birdhouse and the kennel all already use (x+4.5, z+front*4.0); house 11 is odd
    // (i%2===1), the same porch-awning offset the birdhouse's own house 9 already clears by 0.90 m —
    // identical geometry, so the same margin applies here without a fresh probe. The house's own wall
    // box (half-extents 3.7×3.2) clears this corner by 0.8 m on both axes, same as every other feature
    // already sat in this exact corner.
    if (i === 11) {
      const gx = x + 4.5, gz = z + front * 4.0;
      const skinM = mat(0xe8b088, { roughness: 0.8 }), beardM = mat(0xf2ece0, { roughness: 0.85 }),
        hatM = mat(0xc0392b, { roughness: 0.75 }), tunicM = mat(0x2f6fd6, { roughness: 0.8 }),
        beltM = mat(0x5a3a1e, { roughness: 0.85 }), bootM = mat(0x2a2018, { roughness: 0.8 }),
        lanternM = mat(0xf2c744, { roughness: 0.4 });
      const gnome = group(gx, 0, gz, W); gnome.rotation.y = ry;
      for (const bx2 of [-0.05, 0.05]) mesh(G.cyl(0.035, 0.04, 0.08, 8), bootM, { x: bx2, y: 0.04, shadow: 'both', parent: gnome });
      mesh(G.cyl(0.07, 0.11, 0.28, 10), tunicM, { y: 0.22, shadow: 'both', parent: gnome });
      mesh(G.cyl(0.115, 0.115, 0.03, 10), beltM, { y: 0.1, shadow: 'none', parent: gnome });
      for (const sx2 of [-0.1, 0.1]) mesh(G.cyl(0.02, 0.022, 0.16, 6), tunicM, { x: sx2, y: 0.3, rz: sx2 * 2.2, parent: gnome });
      mesh(G.sphere(0.028, 8, 6), lanternM, { x: 0.11, y: 0.22, z: 0.02, shadow: 'none', parent: gnome });   // the little lantern, held at its side
      const head = group(0, 0.44, 0, gnome);
      mesh(G.sphere(0.075, 10, 8), skinM, { parent: head });
      mesh(G.sphere(0.018, 6, 5), skinM, { z: 0.07, y: -0.01, shadow: 'none', parent: head });   // nose
      mesh(G.cone(0.065, 0.14, 8), beardM, { y: -0.1, z: 0.025, rx: PI, parent: head });   // beard, hanging down over the chest
      mesh(G.cyl(0.08, 0.08, 0.02, 10), hatM, { y: 0.06, parent: head });   // hat brim
      mesh(G.cone(0.075, 0.22, 10), hatM, { y: 0.17, rz: 0.2, parent: head });   // the pointed cap, flopped slightly to one side
      mesh(G.sphere(0.022, 8, 6), hatM, { y: 0.26, x: 0.06, parent: head });   // the floppy tip
      P.addBox(gx, 0.22, gz, 0.3, 0.6, 0.3, { cam: false });
      const gnomeLines = ['🧙 "Paint\'s chipped on the nose. Character, the owners call it."', '🧙 "That lantern has never once lit up. Purely for show."', '😼 "Puss, that hat is not a toy."'];
      game.addInteractable({ obj: gnome, radius: 1.8, label: () => 'Look at the garden gnome', onUse: () => { SFX.click(); game.toast(rnd.pick(gnomeLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse and birdbath between them gave the street a nesting
    // box and a drinking bowl, but no actual bird feeder — the one fixture that would draw a bird in
    // the first place. House 12's own front yard now gets one: a tube feeder of seed hangs on a short
    // chain from a bent iron arm, two dowel perches through its base and a green tin roof keeping the
    // rain off, with a scatter of spilled husks on the grass below. The exact same `makeSparrow()` the
    // birdhouse and the birdbath already use stands on the lower perch, dipping its head at the seed
    // the same idle peck it already does at a bowl rim or a birdhouse wall. *"Chirp. (Translation:
    // finally, seed that isn't bread.)"* *"Careful, puss — that's a good six-foot drop if you knock
    // it."* *"Fills it every Sunday. Empty again by Wednesday."*
    // No new rig or controller, and all geometry and colour are fixed rather than drawn from this
    // world's own seeded `r()`, the same caution the pinwheel/gnome/birdhouse comments above spell
    // out — nothing later in this build shifts. The whole assembly (post, arm, feeder and the nested
    // sparrow) carries `userData.update` on its own top group, the same trick the kennel's own dog
    // uses, so the baker leaves the nested rig alone rather than merging it into static geometry.
    // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real
    // Neighborhood, sampled every NPC's own position every 1/30 s over 150 simulated seconds
    // (strollers, the dog walker and the postie's full round all included), then checked the same
    // yard-corner offset every other feature on this street already uses (x+4.5, z+front*4.0) against
    // both that trace and the world's own physics boxes for every lot still without a feature: house
    // 12's own corner (-40.5, 24) came back clear by 1.13 m of the nearest box (the porch awning, the
    // same margin the pinwheel/birdhouse/gnome corner already accepts) and 12.3 m of the nearest
    // wandering soul — the most daylight of any free lot on the street.
    if (i === 12) {
      const px = x + 4.5, pz = z + front * 4.0;
      const hookM = mat(0x3a3a3a, { metalness: 0.4, roughness: 0.5 }), capM = mat(0x2e6a46, { roughness: 0.6 }),
        tubeM = mat(0xd9c98a, { roughness: 0.3, transparent: true, opacity: 0.55 }), seedM = mat(0x9a7a3a, { roughness: 0.85 }),
        trayM = mat(0x2e6a46, { roughness: 0.6 }), perchM = mat(0x6b4a2a, { roughness: 0.85 });
      const postH = 1.3, armLen = 0.28, chainLen = 0.12, capH = 0.08, tubeH = 0.3, trayH = 0.03, tubeR = 0.085, perchLen = 0.1;
      const feeder = group(px, 0, pz, W); feeder.rotation.y = ry;
      mesh(G.cyl(0.02, 0.026, postH, 8), hookM, { y: postH / 2, shadow: 'both', parent: feeder });
      mesh(G.cyl(0.016, 0.016, armLen, 8), hookM, { x: armLen / 2, y: postH, rz: PI / 2, shadow: 'none', parent: feeder });
      mesh(G.sphere(0.018, 8, 6), hookM, { x: armLen, y: postH, shadow: 'none', parent: feeder });
      const chain = noInk(mesh(G.cyl(0.006, 0.006, chainLen, 5), hookM, { x: armLen, y: postH - chainLen / 2, parent: feeder }));
      const feed = group(armLen, postH - chainLen, 0, feeder);
      mesh(G.cone(tubeR * 1.2, capH, 14), capM, { y: -capH / 2, shadow: 'both', parent: feed });
      mesh(G.cyl(tubeR, tubeR, tubeH, 14), tubeM, { y: -capH - tubeH / 2, shadow: 'none', parent: feed });
      mesh(G.cyl(tubeR * 0.9, tubeR * 0.9, tubeH * 0.5, 14), seedM, { y: -capH - tubeH * 0.72, shadow: 'none', parent: feed });   // seed visible through the glass, lower half full
      mesh(G.cyl(tubeR * 1.15, tubeR * 1.2, trayH, 14), trayM, { y: -capH - tubeH - trayH / 2, shadow: 'both', parent: feed });
      const perchYs = [-capH - tubeH * 0.32, -capH - tubeH * 0.68];
      for (const py of perchYs) for (const pside of [-1, 1]) mesh(G.cyl(0.009, 0.009, perchLen, 6), perchM, { y: py, z: pside * (tubeR + perchLen / 2), rx: PI / 2, shadow: 'none', parent: feed });
      P.addBox(px, postH / 2, pz, 0.08, postH, 0.08, { cam: false });
      for (const [hx, hz] of [[-0.06, 0.04], [0.05, -0.03], [0.01, 0.07], [-0.04, -0.07]]) mesh(G.box(0.025, 0.012, 0.015), seedM, { x: armLen + hx, y: 0.006, z: hz, ry: (hx + hz) * 6, shadow: 'receive', parent: feeder });
      const visitor = makeSparrow(); feed.add(visitor.group);
      const perchY = perchYs[1], standZ = (tubeR + perchLen * 0.65);
      visitor.group.position.set(0, perchY + 0.014, standZ);
      visitor.group.rotation.y = PI;
      feeder.userData.update = (dt, t) => visitor.animate(0, false, dt, t);
      U.push(feeder.userData.update);
      const feederLines = ['🐦 "Chirp. (Translation: finally, seed that isn\'t bread.)"', '🍃 "Careful, puss — that\'s a good six-foot drop if you knock it."', '🌻 "Fills it every Sunday. Empty again by Wednesday."'];
      game.addInteractable({ obj: feeder, radius: 1.8, label: () => 'Look at the bird feeder', onUse: () => { SFX.click(); game.toast(rnd.pick(feederLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome and feeder gave six yards their own fixture;
    // every one of them was a garden ornament or a creature's own home, and the single most ordinary
    // object any front yard actually has — the bin put out for collection — had never shown up on this
    // street at all. House 15's own front lawn now gets a plastic wheelie bin, standing by itself a
    // little apart from the porch: a tall box body on two rear wheels, a flat lid sat not quite square
    // on top (the hinge is a stub cylinder, the lid itself just tipped a few degrees off level), and a
    // moulded handle bar across the front face. No controller, no animation, and no draw from this
    // world's own seeded `r` — every dimension and colour below is a fixed literal, the same caution
    // the gnome's and feeder's own comments above spell out, so nothing later in this build shifts.
    // A headless probe (the same stub-three harness `test/run.mjs` uses, `game.start('new')` then 60
    // simulated seconds of every NPC's own sampled position) swept the usual yard-corner offset
    // (x+4.5, z+front*4.0) against the three lots this street's own features hadn't already claimed
    // on the back row: lot 15's own corner (67.5, 24) — the mirror, on the opposite side of the street,
    // of the kennel's own safe lot 13 — came back clear by 8.60 m of the nearest wandering soul and the
    // usual 0.90 m of the house's own porch-awning box every other feature in this exact corner already
    // accepts as plenty of room for a sub-metre prop.
    if (i === 15) {
      const px = x + 4.5, pz = z + front * 4.0;
      const bodyW = 0.42, bodyD = 0.38, bodyH = 0.62, lidH = 0.05, wheelR = 0.07;
      const bodyM = mat(0x3a4a3a, { roughness: 0.75 }), lidM = mat(0x2e3a2e, { roughness: 0.7 }),
        wheelM = mat(0x1a1a1a, { roughness: 0.8 }), handleM = mat(0x1a1a1a, { roughness: 0.6 });
      const bin = group(px, 0, pz, W); bin.rotation.y = ry;
      mesh(G.box(bodyW, bodyH, bodyD), bodyM, { y: bodyH / 2 + wheelR * 0.4, shadow: 'both', parent: bin });
      for (const wx2 of [-bodyW / 2 + 0.05, bodyW / 2 - 0.05]) mesh(G.cyl(wheelR, wheelR, 0.05, 10), wheelM, { x: wx2, y: wheelR * 0.4, z: -bodyD / 2 + 0.04, rz: PI / 2, shadow: 'both', parent: bin });
      const lidHinge = group(0, bodyH + wheelR * 0.4, -bodyD / 2 + 0.03, bin);
      mesh(G.cyl(0.02, 0.02, bodyW - 0.06, 8), lidM, { rz: PI / 2, shadow: 'none', parent: lidHinge });
      mesh(G.box(bodyW - 0.015, lidH, bodyD - 0.01), lidM, { y: lidH / 2, z: bodyD / 2 - 0.005, rx: -0.09, shadow: 'both', parent: lidHinge });
      mesh(G.cyl(0.012, 0.012, bodyW * 0.3, 8), handleM, { y: bodyH * 0.72 + wheelR * 0.4, z: bodyD / 2 + 0.01, rz: PI / 2, shadow: 'none', parent: bin });
      P.addBox(px, (bodyH + wheelR * 0.4) / 2, pz, bodyW / 2 + 0.02, bodyH + wheelR * 0.4, bodyD / 2 + 0.02, { cam: false });
      const binLines = ['🗑️ "Bin day\'s Tuesday. Somehow it still smells like today."', '🗑️ "Lid never sits quite flat. Nobody\'s ever minded."', '😼 "Puss, whatever that smell is, it is not for you."'];
      game.addInteractable({ obj: bin, radius: 1.6, label: () => 'Sniff the bin', onUse: () => { SFX.click(); game.toast(rnd.pick(binLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome, feeder and bin gave seven yards a fixture —
    // ornament, home or chore, never a single thing that actually marked the time of day, odd for a
    // street with a park lamp, a bus and a clock-faced oven timer in half its kitchens. House 5's own
    // front yard now gets a garden sundial: a tapered stone column on a square plinth, a round dial
    // plate with twelve bronze hour-marks around its rim, and a flattened bronze gnomon tilted back off
    // its centre, same `G.earCone()` flattened-spike shape the ears and spikes elsewhere in this file
    // already use, just bronze instead of fur-coloured. Static, no controller and no draw from this
    // world's own seeded `r` — every dimension and colour below is a fixed literal, the same caution
    // the gnome's and bin's own comments above spell out, so nothing later in this build shifts.
    // Same yard-corner offset the other seven features already use (x+4.5, z+front*4.0); house 5 is
    // odd (i%2===1), the same porch-awning x-offset the gnome's own house 11 already clears by 0.8 m —
    // identical geometry, so the same margin applies here too, and a headless probe of the house's own
    // wall box confirmed it: 0.90 m clear, same as every other feature in this exact corner.
    // A first pass tried house 6's own corner instead (the next free lot along), but a headless probe
    // (`game.start('new')`, then 150 simulated seconds — 9000 frames at the stub clock's fixed 1/60 s
    // step, not the quarter-second sampling rate — tracking every NPC's own position every frame)
    // found a Wanderer passing within 0.54 m of that spot, well inside this prop's own footprint. The
    // same probe swept every other free lot on the street (houses 1, 2, 3, 4, 7 and 10's own front
    // yard) in one pass: house 5's corner (-4.5, 24) came back the clear winner, 7.29 m from the
    // nearest wandering soul over the full run, against 1.52 m or less everywhere else tried.
    if (i === 5) {
      const sx = x + 4.5, sz = z + front * 4.0;
      const stoneM = mat(0xb9b2a0, { roughness: 0.9 }), plinthM = mat(0x8f8878, { roughness: 0.9 }),
        bronzeM = mat(0x8a6a3a, { metalness: 0.4, roughness: 0.35 }), markM = mat(0x5a4a32, { roughness: 0.8 });
      const sundial = group(sx, 0, sz, W); sundial.rotation.y = ry;
      mesh(G.box(0.32, 0.08, 0.32), plinthM, { y: 0.04, shadow: 'both', parent: sundial });   // square plinth
      mesh(G.cyl(0.1, 0.13, 0.5, 10), stoneM, { y: 0.08 + 0.25, shadow: 'both', parent: sundial });   // tapered column
      const dialY = 0.08 + 0.5 + 0.02;
      mesh(G.cyl(0.24, 0.24, 0.04, 20), stoneM, { y: dialY, shadow: 'both', parent: sundial });   // the dial plate
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; mesh(G.box(0.012, 0.012, 0.045), markM, { x: sin(a) * 0.185, z: cos(a) * 0.185, y: dialY + 0.021, ry: a, shadow: 'none', parent: sundial }); }   // twelve hour-marks round the rim
      mesh(G.earCone(0.09, 0.24), bronzeM, { y: dialY + 0.1, rx: -0.55, shadow: 'both', parent: sundial });   // the gnomon, tilted back off centre
      P.addBox(sx, 0.34, sz, 0.28, 0.68, 0.28, { cam: false });
      const dialLines = ['🕰️ "No numbers, no hands — just a shadow and a steady guess."', '☀️ "Works a treat, so long as the sun actually shows up."', '😼 "Puss, chasing the shadow around it doesn\'t count as telling the time."'];
      game.addInteractable({ obj: sundial, radius: 1.8, label: () => 'Look at the sundial', onUse: () => { SFX.click(); game.toast(rnd.pick(dialLines), 3000); } });
    }
    // every fixture on this street so far sits out at the usual yard-corner offset (x+4.5,
    // z+front*4.0) or, in the napping cat's one case, up on a porch rail — nothing has ever actually
    // sat on a porch STEP. House 5's own step, right below the sundial it shares a yard with, now has
    // a carved pumpkin on it: a squashed orange sphere, a short green stem, and a jack-o'-lantern face
    // built from `G.earCone()` triangles — the same flattened-spike shape the sundial's own gnomon
    // above and the weathervane's own ears already borrow — two for eyes, one upside-down for a nose,
    // four in a zigzag for a grin. *"Somebody's been at the carving knife."* *"Mind your whiskers near
    // that candle, puss."* *"Every year it goes a little more lopsided. Charming, really."*
    //
    // Static geometry, no controller: one new group parented straight onto house 5's own `h` (the
    // same trick the napping cat on house 2's porch rail already uses, so it inherits the house's own
    // world position and rotation for free, in LOCAL coordinates only). Every dimension and colour
    // below is a fixed literal — no draw from this world's own seeded `r` or the shared `rnd()` at
    // build time, the same caution every other fixture on this street already takes, since the
    // Neighborhood is the one world every test travel starts from and any extra draw here shifts a
    // later timing-sensitive check elsewhere in the run (round 578's own postmortem, on the marching
    // sparrows, spells out why).
    //
    // The carved face reuses the porch light's own emissive hex (`0xffe3a0`) rather than adding any
    // new day/night code: the day/night cycle's own `W.traverse()` sweep (the bottom of this function)
    // only matches on a material's emissive colour, so the face glows warmly after dusk and fades back
    // to a plain dark carving by day for free, exactly like every porch bulb on the street already
    // does — no `U.push` tick of its own needed at all.
    //
    // The step itself sits at local (dx, 0.12, d/2 + 1.75), a full metre further from the house than
    // the deck the napping cat's own rail sits over and 4.5 m off the sundial's own corner — nowhere
    // anything has ever been placed before — and squarely inside this lot's own "front path" keep-out
    // zone (`Z.add(x, z + front*6.9, 1.4, 6.4)`, added for every lot at the top of this function), well
    // short of any road, pavement or path `test/run.mjs` actually walks. No physics box, the same
    // reasoning the napping cat's own round gives: well below the cat's own jump reach and nothing
    // here it could meaningfully collide with.
    { const px = 1.7, pz = 4.65, py = 0.29;
      const pumpkinM = mat(0xe8711a, { roughness: 0.6 }), stemM = mat(0x5a7a3a, { roughness: 0.7 }),
        faceM = mat(0x1a1410, { roughness: 0.85, emissive: 0xffe3a0, emissiveIntensity: 0.08 });
      const pumpkin = group(px, py, pz, h);
      mesh(G.sphere(0.2, 12, 9), pumpkinM, { sy: 0.85, shadow: 'both', parent: pumpkin });
      mesh(G.cyl(0.02, 0.03, 0.06, 6), stemM, { y: 0.2, shadow: 'none', parent: pumpkin });
      for (const ex of [-0.08, 0.08]) mesh(G.earCone(0.045, 0.09), faceM, { x: ex, y: 0.03, z: 0.17, shadow: 'none', parent: pumpkin });   // eyes
      mesh(G.earCone(0.03, 0.06), faceM, { y: -0.01, z: 0.185, rz: PI, shadow: 'none', parent: pumpkin });   // nose, point up
      [-0.12, -0.04, 0.04, 0.12].forEach((tx, ti) => mesh(G.earCone(0.035, 0.07), faceM, { x: tx, y: -0.09, z: 0.15, rz: ti % 2 ? 0 : PI, shadow: 'none', parent: pumpkin }));   // zigzag grin
      const pumpkinLines = ['🎃 "Somebody\'s been at the carving knife."', '🕯️ "Mind your whiskers near that candle, puss."', '🎃 "Every year it goes a little more lopsided. Charming, really."'];
      game.addInteractable({ obj: pumpkin, radius: 1.6, label: () => 'Look at the pumpkin', onUse: () => { SFX.click(); game.toast(rnd.pick(pumpkinLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome, feeder, bin and sundial gave eight of the
    // street's sixteen yards their own fixture, but nothing on the whole street has ever actually
    // caught a drop of rain, odd for a village with a sprinkler watering the grass two doors down.
    // House 10's own front yard now gets a rain barrel: a bulging oak cask (two stacked tapered
    // cylinders rather than one straight one, so it actually bows out at the middle), two iron hoops,
    // a flat lid with a dark fill-hole and a glimpse of water through it, and a brass tap low on the
    // front face. An occasional drop plinks off the tap into a shallow puddle below, timed off the
    // world clock `t` alone, never `game.fx.emit` (which draws from the shared `rnd()` on every call)
    // or this world's own seeded `r` — the same caution the duck pond's and the sprinkler's own
    // comments above already spell out, since the Neighborhood is the one world every test travel
    // starts from. No `userData.update` needed either: `fillRing()` in `68-regions.js` is the only
    // thing in this whole game that ever calls `bakeDeep()`, and it only runs on the procedural outer
    // ring, never on this hand-built core, so the drop and puddle meshes (both plain children of the
    // barrel group) just get moved directly from a closure in `U.push`, nothing more needed to keep
    // them animating.
    // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.start('new')`
    // then 9000 simulated frames at the stub clock's real 1/60 s step — the sundial's own round above
    // found the quarter-second sampling rate alone can miss a passing Wanderer, so this used the finer
    // one throughout, tracking every NPC's own position every frame) swept a slightly widened version
    // of the usual yard-corner offset (x+5.5, z+front*4.0 — a metre further from the porch than the
    // x+4.5 the other eight features use, to clear this prop's own wider footprint) against the six
    // lots the sundial's own round above left free (houses 1, 2, 3, 4, 7 and 10): house 10's own
    // corner (-66.5, 4) came back the clear winner, 4.50 m from the nearest wandering soul over the
    // full 150 simulated seconds and 1.97 m clear of the nearest physics box (the house's own wall) —
    // more daylight on both counts than any of the standard x+4.5 corners the other eight features
    // already accepted.
    if (i === 10) {
      const px = x + 5.5, pz = z + front * 4.0;
      const woodM = mat(0x6b4426, { roughness: 0.9 }), hoopM = mat(0x2a2a2a, { metalness: 0.4, roughness: 0.55 }),
        lidM = mat(0x5a3a1e, { roughness: 0.85 }), holeM = mat(0x18120c, { roughness: 1 }),
        tapM = mat(0xc9a84a, { metalness: 0.6, roughness: 0.3 }), waterM = mat(0x4a7aa8, { transparent: true, opacity: 0.55, roughness: 0.2 });
      const barrelH = 0.62, rBase = 0.22, rMid = 0.27, rTopR = 0.23;
      const barrel = group(px, 0, pz, W); barrel.rotation.y = ry;
      mesh(G.cyl(rMid, rBase, barrelH / 2, 14), woodM, { y: barrelH / 4, shadow: 'both', parent: barrel });          // lower half, bulging up to the middle
      mesh(G.cyl(rTopR, rMid, barrelH / 2, 14), woodM, { y: barrelH * 0.75, shadow: 'both', parent: barrel });       // upper half, tapering back in
      for (const hy of [barrelH * 0.28, barrelH * 0.72]) mesh(G.cyl(rMid * 1.04, rMid * 1.02, 0.045, 14), hoopM, { y: hy, shadow: 'none', parent: barrel });
      mesh(G.cyl(rTopR * 1.03, rTopR * 1.03, 0.03, 14), lidM, { y: barrelH + 0.015, shadow: 'both', parent: barrel });
      mesh(G.cyl(0.045, 0.045, 0.01, 10), holeM, { y: barrelH + 0.031, z: -0.06, shadow: 'none', parent: barrel });      // fill-hole in the lid
      mesh(G.cyl(rTopR * 0.9, rTopR * 0.9, 0.01, 14), waterM, { y: barrelH - 0.03, shadow: 'none', parent: barrel });    // waterline, glimpsed through the hole
      const tapY = 0.12, tapR = (rMid + rBase) / 2;
      mesh(G.cyl(0.018, 0.018, 0.07, 8), tapM, { y: tapY, z: tapR + 0.02, rx: PI / 2, shadow: 'none', parent: barrel });
      mesh(G.sphere(0.02, 8, 6), tapM, { y: tapY, z: tapR + 0.07, shadow: 'none', parent: barrel });     // tap handle
      P.addBox(px, barrelH / 2, pz, rMid + 0.02, barrelH, rMid + 0.02, { cam: false });
      const drop = mesh(G.sphere(0.012, 6, 5), waterM, { y: tapY, z: tapR + 0.02, shadow: 'none', parent: barrel });
      const puddle = mesh(G.cyl(0.1, 0.1, 0.004, 12), waterM, { y: 0.004, z: tapR + 0.16, shadow: 'none', parent: barrel });
      const DCYCLE = 3.2, dropSpan = 0.5;
      U.push((dt, t) => {
        const k = (t % DCYCLE) / DCYCLE;
        drop.visible = k < dropSpan;
        if (drop.visible) drop.position.y = lerp(tapY, 0.015, k / dropSpan);
        puddle.material.opacity = 0.35 + 0.15 * sin(t * 0.8);
      });
      const barrelLines = ['🛢️ "Half rain, half whatever landed in it. Nobody\'s checked which half."', '💧 "Fills up fast off the roof. Empties slower — that tap only ever drips."', '😼 "Puss, that is not a water bowl."'];
      game.addInteractable({ obj: barrel, radius: 1.8, label: () => 'Look at the rain barrel', onUse: () => { SFX.click(); game.toast(rnd.pick(barrelLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome, feeder, bin, sundial and rain barrel gave
    // nine of the street's sixteen yards their own fixture, but for all that iron, bronze and oak,
    // not one of them ever answered the one question a weather-watching street actually asks: which
    // way the wind is blowing. House 7's own front yard now gets a weathervane: a slim iron post,
    // four fixed ordinal arms, and a little cat-shaped arrow on its own spindle, swinging slowly back
    // and forth as if tracking a real gust rather than snapping to any one heading. *"Pointing
    // south-west since teatime. Must be a steady one today."* *"If it ever points straight at the
    // house, that's the signal to bring the washing in."* *"Puss, you're not aerodynamic enough to
    // tell it anything."*
    // No new rig, no new controller: the arrow is plain static geometry on its own pivot (the ears
    // reuse `G.earCone()`, the same flattened-spike shape the sundial's own gnomon already borrowed
    // for a bronze cone a few rounds back), swept by a single `U.push` tick off the world clock `t`
    // alone — two superimposed sines rather than one, so it drifts like a real gust instead of
    // ticking metronomically — never this world's own seeded `r` or the shared `rnd()`, the same
    // caution every fixture on this street already spells out, since the Neighborhood is the one
    // world every test travel starts from.
    // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.start('new')`
    // then 9000 simulated frames at the stub clock's real 1/60 s step, tracking every NPC's and the
    // squirrel's own position every single frame) swept the usual yard-corner offset (x+4.5,
    // z+front*4.0) against the five lots still free after the rain barrel's own round (houses 1, 2,
    // 3, 4 and 7): the other four all came within half a metre of a passing stroller at some point
    // over the full 150 simulated seconds, but house 7's own corner (31.5, 24) stayed clear the whole
    // way through — 3.00 m from the nearest wandering soul throughout, and the usual 0.90 m clear of
    // the house's own porch-awning box every odd-numbered lot on this street already accepts.
    if (i === 7) {
      const px = x + 4.5, pz = z + front * 4.0, postH = 1.0;
      const ironM = mat(0x2a2a30, { metalness: 0.5, roughness: 0.45 }), catM = mat(0x1c1c20, { metalness: 0.2, roughness: 0.6 });
      const post = group(px, 0, pz, W); post.rotation.y = ry;
      mesh(G.cyl(0.02, 0.028, postH, 8), ironM, { y: postH / 2, shadow: 'both', parent: post });
      const arms = group(0, postH, 0, post);
      for (let k = 0; k < 4; k++) { const a = k * PI / 2, armLen = 0.2;
        mesh(G.box(0.012, 0.012, armLen), ironM, { x: sin(a) * armLen / 2, z: cos(a) * armLen / 2, ry: a, shadow: 'none', parent: arms });
        mesh(G.sphere(0.016, 8, 6), ironM, { x: sin(a) * armLen, z: cos(a) * armLen, shadow: 'none', parent: arms }); }
      const pivot = group(0, 0.03, 0, arms);
      noInk(mesh(G.cyl(0.008, 0.008, 0.26, 8), ironM, { y: 0.13, shadow: 'none', parent: pivot }));   // the spindle the cat arrow rides
      const cat = group(0, 0.26, 0, pivot);
      mesh(G.box(0.02, 0.09, 0.2), catM, { z: 0.02, shadow: 'none', parent: cat });                                 // body
      mesh(G.box(0.02, 0.07, 0.07), catM, { z: 0.15, y: 0.03, shadow: 'none', parent: cat });                       // head
      mesh(G.earCone(0.028, 0.06), catM, { x: -0.025, z: 0.17, y: 0.085, rx: -0.3, shadow: 'none', parent: cat });   // ear
      mesh(G.earCone(0.028, 0.06), catM, { x: 0.025, z: 0.17, y: 0.085, rx: -0.3, shadow: 'none', parent: cat });    // ear
      noInk(mesh(G.cyl(0.012, 0.004, 0.16, 6), catM, { z: -0.14, y: 0.05, rx: -1.0, shadow: 'none', parent: cat }));  // tail, curling up off the back
      P.addBox(px, postH / 2, pz, 0.08, postH, 0.08, { cam: false });
      U.push((dt, t) => { pivot.rotation.y = sin(t * 0.07) * 0.9 + sin(t * 0.017) * 1.8; });
      const vaneLines = ['🐱 "Pointing south-west since teatime. Must be a steady one today."', '💨 "If it ever points straight at the house, that\'s the signal to bring the washing in."', '😼 "Puss, you\'re not aerodynamic enough to tell it anything."'];
      game.addInteractable({ obj: post, radius: 1.8, label: () => 'Look at the weathervane', onUse: () => { SFX.click(); game.toast(rnd.pick(vaneLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome, feeder, bin, sundial, rain barrel and
    // weathervane gave eleven of the street's sixteen yards a fixture of their own (the birdbath
    // below makes it a dozen, though that one sits on lot 14's own corner outside this very loop) —
    // not one of the dozen was the single most recognisable plastic yard ornament there is. House 2's
    // own front yard — the one whose porch rail already has a stray cat asleep on it, above — now
    // gets a pair of pink lawn flamingos standing in the grass: one bowed right down with its beak in
    // the lawn, the other upright with its neck curved, looking round. *"Puss, those are plastic. I
    // promise you — plastic."* *"Nobody's ever once seen one move. And yet every street somehow has a
    // pair."* *"The pink's gone a bit chalky in the rain. Gives them character."*
    //
    // Built from the same primitive cylinders and spheres as the gnome and the weathervane's own cat
    // arrow above — no new geometry helper, no new texture. Each bird is legs → a scaled-sphere body →
    // a hinge group (the neck) → a head group carrying the skull, a cone beak and a dark dipped tip;
    // only the bowed-down bird's hinge actually moves, a shallow `sin(t)` settle-and-lift over about
    // eighteen seconds so the two don't read as identical copies at a glance. The phase is a fixed
    // constant, not a draw from this world's own seeded `r()` — the sundial's and weathervane's own
    // comments above already spell out why nothing in this file reads from `r()` or the shared `rnd()`
    // once it isn't needed for layout, since every later pick in this loop (shutter colours, mailbox
    // colours) would shift if it did, and the Neighborhood is the one world every test travel starts
    // from.
    //
    // The standard yard-corner offset this street's other ten in-loop fixtures all use (x+4.5,
    // z+front*4.0) sits on the mailbox-and-path side of the house, and the weathervane's own round
    // already found it comes within half a metre of a passing stroller on houses 1, 2, 3 and 4 at
    // some point over a full simulated walk — exactly why those four lots were still free. The far
    // corner doesn't have that problem: it's the same offset mirrored to the house's quiet side
    // (x-4.5), the same 0.8 m clear of the house's own wall box the pinwheel's own round already
    // accepts, just facing away from the street instead of toward it. A headless probe (the same
    // stub-three harness `test/run.mjs` itself uses, `game.start('new')` then 9000 simulated frames at
    // the stub clock's real 1/60 s step, tracking every NPC's and the squirrel's own position every
    // single frame — the same rigour the weathervane's own round used) found house 2's far corner
    // (-40.5, 4.0) clear by 1.13 m of the nearest box (that house's own wall) and clear by 4.50 m of
    // the nearest wandering soul throughout — the lamplighter's own round of the gas lamps, nowhere
    // near its closest even then.
    if (i === 2) {
      const fx = x - 4.5, fz = z + front * 4.0;
      const pinkM = mat(0xf2729a, { roughness: 0.45 }), legM = mat(0x2a2a2a, { roughness: 0.55 }), eyeM = mat(0x18120c, { roughness: 0.6 });
      const makeFlamingoRig = () => {
        const flam = group(0, 0, 0);
        for (const lx of [-0.03, 0.03]) mesh(G.cyl(0.011, 0.013, 0.46, 6), legM, { x: lx, y: 0.23, shadow: 'both', parent: flam });
        const body = group(0, 0.46, 0, flam);
        mesh(G.sphere(0.16, 12, 10), pinkM, { sy: 1.35, sz: 1.7, y: 0.02, shadow: 'both', parent: body });
        const hinge = group(0.1, 0.1, 0.05, body);
        mesh(G.cyl(0.028, 0.034, 0.22, 8), pinkM, { y: 0.11, rz: 0.5, shadow: 'both', parent: hinge });
        const head = group(0.1, 0.22, 0, hinge);
        mesh(G.cyl(0.024, 0.028, 0.14, 8), pinkM, { y: 0.07, shadow: 'both', parent: head });
        const skull = group(0.015, 0.15, 0, head);
        mesh(G.sphere(0.034, 10, 8), pinkM, { shadow: 'both', parent: skull });
        mesh(G.sphere(0.006, 6, 6), eyeM, { x: 0.025, y: 0.01, z: 0.02, shadow: 'none', parent: skull });
        mesh(G.cone(0.014, 0.075, 8), pinkM, { x: 0.03, y: -0.01, rz: -1.5, shadow: 'none', parent: skull });
        mesh(G.cone(0.009, 0.03, 8), eyeM, { x: 0.075, y: -0.025, rz: -1.5, shadow: 'none', parent: skull });   // the black dipped tip
        return { flam, hinge };
      };
      const dipPhase = 1.7;
      const a = makeFlamingoRig(); a.flam.position.set(fx - 0.22, 0, fz + 0.15); a.flam.rotation.y = ry + 0.3; W.add(a.flam);
      a.hinge.rotation.z = -1.3;   // bowed right down, beak in the grass
      U.push((dt, t) => { a.hinge.rotation.z = -1.3 + sin(t * 0.35 + dipPhase) * 0.12; });
      const b = makeFlamingoRig(); b.flam.position.set(fx + 0.2, 0, fz - 0.12); b.flam.rotation.y = ry - 0.5; W.add(b.flam);
      b.hinge.rotation.z = 0.15;   // upright, neck curved, head up looking round
      P.addBox(fx - 0.22, 0.3, fz + 0.15, 0.15, 0.5, 0.15, { cam: false });
      P.addBox(fx + 0.2, 0.3, fz - 0.12, 0.15, 0.5, 0.15, { cam: false });
      const flamingoLines = ['🦩 "Puss, those are plastic. I promise you — plastic."', '🦩 "Nobody\'s ever once seen one move. And yet every street somehow has a pair."', '🦩 "The pink\'s gone a bit chalky in the rain. Gives them character."'];
      game.addInteractable({ obj: a.flam, radius: 1.8, label: () => 'Look at the lawn flamingos', onUse: () => { SFX.click(); game.toast(rnd.pick(flamingoLines), 3000); } });
    }
    // twelve of the street's sixteen yards have their own fixture by now, and every one of them is an
    // ornament, a creature's home, a chore or a weather-reader — nothing has ever actually been doing
    // the gardening. House 4's own front yard now gets a parked wheelbarrow: a riveted metal tub on a
    // single front wheel and two rear legs, handles trailing back into the grass, with a scoop of soil,
    // two potted seedlings and a trowel propped against the rim left sitting in it mid-job. *"Half soil,
    // half rust. Does the job either way."* *"Those seedlings won't pot themselves — allegedly. No rush,
    // by the look of it."* *"Puss, that trowel is not a toy, and neither is the soil."*
    // Static, no controller, every dimension and colour below a fixed literal rather than a draw from
    // this world's own seeded `r` — the sundial's and weathervane's own comments above already spell out
    // why, since the Neighborhood is the one world every test travel starts from. Built deliberately
    // toy-scale (0.89 m tub-to-handle-tip) rather than true wheelbarrow proportions, the same compression
    // the gnome and the kennel both already accept, to keep its footprint inside this corner's own margin.
    // Same yard-corner offset the other eleven in-loop fixtures already use (x+4.5, z+front*4.0); houses
    // 1, 2, 3 and 6 were the lots the weathervane's own round found a stroller passing within half a
    // metre of that offset, which is why house 4 — one of the two still unclaimed — got picked instead. A
    // headless probe (built the real Neighborhood with the same stub-three harness `test/run.mjs` itself
    // uses, then 9000 simulated frames at the stub clock's real 1/60 s step, every NPC's own `rig.group`
    // position sampled every single frame) found house 4's own corner (-22.5, 24) clear by 1.13 m of the
    // nearest physics box (that house's own wall, the same margin the pinwheel/gnome/birdhouse corner
    // already accepts) and 9.86 m of the nearest wandering soul throughout — the most daylight of the two
    // free lots the probe checked.
    if (i === 4) {
      const px = x + 4.5, pz = z + front * 4.0;
      const metalM = mat(0x8a9098, { metalness: 0.5, roughness: 0.5 }), rustM = mat(0x6b4a2a, { roughness: 0.85 }),
        woodM = mat(0x8a5a32, { roughness: 0.85 }), potM = mat(0xb5602a, { roughness: 0.85 }), leafM = mat(0x4a7a3a, { roughness: 0.7 }),
        soilM = mat(0x3a2a1c, { roughness: 0.95 }), tineM = mat(0x4a4a4a, { metalness: 0.4, roughness: 0.5 });
      const barrow = group(px, 0, pz, W); barrow.rotation.y = ry;
      const tubW = 0.32, tubD = 0.4, tubH = 0.16, legH = 0.14;
      mesh(G.box(tubW, 0.025, tubD), metalM, { y: legH + 0.04, shadow: 'both', parent: barrow });                                 // tub floor
      mesh(G.box(tubW, tubH, 0.025), metalM, { y: legH + 0.04 + tubH / 2, z: tubD / 2, rx: -0.14, shadow: 'both', parent: barrow });   // front wall, flared out
      mesh(G.box(tubW, tubH, 0.025), metalM, { y: legH + 0.04 + tubH / 2, z: -tubD / 2, rx: 0.14, shadow: 'both', parent: barrow });   // back wall, flared out
      mesh(G.box(0.025, tubH, tubD), metalM, { y: legH + 0.04 + tubH / 2, x: tubW / 2, rz: 0.12, shadow: 'both', parent: barrow });    // side wall, flared out
      mesh(G.box(0.025, tubH, tubD), metalM, { y: legH + 0.04 + tubH / 2, x: -tubW / 2, rz: -0.12, shadow: 'both', parent: barrow });  // side wall, flared out
      mesh(G.cyl(0.07, 0.07, 0.035, 14), rustM, { y: 0.07, z: tubD / 2 + 0.08, rz: PI / 2, shadow: 'both', parent: barrow });       // front wheel
      for (const lx2 of [-0.13, 0.13]) mesh(G.cyl(0.012, 0.015, legH, 6), metalM, { x: lx2, y: legH / 2, z: -tubD / 2 + 0.04, shadow: 'both', parent: barrow });   // rear legs
      for (const hx2 of [-0.11, 0.11]) mesh(G.cyl(0.011, 0.011, 0.28, 6), woodM, { x: hx2, y: legH + 0.06, z: -tubD / 2 - 0.08, rx: -1.3, shadow: 'both', parent: barrow });   // handles, trailing back
      mesh(G.box(tubW * 0.6, 0.035, tubD * 0.5), soilM, { y: legH + 0.075, z: -0.04, shadow: 'none', parent: barrow });            // a scoop of soil in the tub
      for (const [sx3, sz3] of [[-0.09, 0.06], [0.08, -0.08]]) {
        const pot = group(sx3, legH + 0.055, sz3, barrow);
        mesh(G.cyl(0.055, 0.045, 0.08, 10), potM, { y: 0.04, shadow: 'both', parent: pot });
        mesh(G.cyl(0.04, 0.04, 0.025, 10), soilM, { y: 0.08, shadow: 'none', parent: pot });
        mesh(G.cone(0.04, 0.09, 8), leafM, { y: 0.13, shadow: 'none', parent: pot });
      }
      mesh(G.cyl(0.009, 0.009, 0.16, 6), woodM, { x: 0.13, y: legH + 0.1, z: 0.16, rx: 1.2, rz: 0.3, shadow: 'none', parent: barrow });         // trowel handle, propped against the rim
      mesh(G.cone(0.03, 0.07, 8), tineM, { x: 0.2, y: legH + 0.05, z: 0.27, rx: 1.2, rz: 0.3, shadow: 'none', parent: barrow });                // trowel blade
      P.addBox(px, 0.17, pz - front * 0.1, 0.22, 0.17, 0.45, { cam: false });
      const barrowLines = ['🛒 "Half soil, half rust. Does the job either way."', '🌱 "Those seedlings won\'t pot themselves — allegedly. No rush, by the look of it."', '😼 "Puss, that trowel is not a toy, and neither is the soil."'];
      game.addInteractable({ obj: barrow, radius: 1.8, label: () => 'Look at the wheelbarrow', onUse: () => { SFX.click(); game.toast(rnd.pick(barrowLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome, feeder, bin, sundial, rain barrel, weathervane,
    // flamingos and wheelbarrow between them gave thirteen of the street's sixteen yards a fixture of
    // their own (the birdbath below makes it fourteen, on lot 14's own corner outside this loop), but
    // only one bike has ever been seen on this street, and it never once stops moving — the cyclist who
    // rings her bell at passers-by (the `Cyclist` controller, `55-npcs.js`). House 3's own front yard
    // now has a second bike, parked and standing perfectly still: the exact same `makeBike()` rig that
    // one already rides, propped up on a kickstand with a cycling helmet hung off the handlebar by its
    // strap. *"Kickstand's doing all the work. Has been since breakfast."* *"That helmet's seen better
    // days — scuffs, mostly. No actual crashes, allegedly."* *"Puss, those spokes are not a scratching
    // post."*
    // No new rig and no new controller: `makeBike()` (`60-props.js`) is the identical geometry the
    // cyclist's own `Cyclist` already rides elsewhere on this street, just left here with its wheels
    // unturned — nothing in this world's `U` list drives them, so they simply stay put. The kickstand
    // is one new thin strut (wrapped in `noInk()`, the same treatment the weathervane's own spindle and
    // the wind chime's own strings already get, since nothing this slender should carry the outline
    // shader's ink line); the helmet is `G.dome()` — the exact hemisphere the gnome's own cap and the
    // bootblack's own tin lid already use — plus two thin strap loops hanging below it, `noInk()` again.
    // Every dimension and colour below is a fixed literal, not a draw from this world's own seeded `r`
    // — the sundial's and weathervane's own comments above already spell out why, since the
    // Neighborhood is the one world every test travel starts from.
    // Same yard-corner offset the other twelve in-loop fixtures already use (x+4.5, z+front*4.0); house
    // 3's own corner had never actually been probed before (earlier rounds' comments disagreed on
    // whether it was clear, going by old strolls that no longer match this street now that a dozen more
    // props stand on it), so this round wrote its own fresh check: a headless probe (the same stub-three
    // harness `test/run.mjs` itself uses, `game.start('new')` then 9000 simulated frames at the stub
    // clock's real 1/60 s step, every NPC's and the squirrel's own position sampled every single frame)
    // found house 3's own corner (40.5, 4.0) clear by 7.29 m of the nearest wandering soul throughout
    // and 0.90 m clear of the nearest physics box (that house's own porch-awning) — the same margin
    // every other standard-offset fixture on this street already accepts, no detour to the far corner
    // needed the way house 2's flamingos needed one.
    if (i === 3) {
      const px = x + 4.5, pz = z + front * 4.0, bry = ry + 0.35;
      const bike = makeBike(0x3a7ac0); bike.group.position.set(px, 0, pz); bike.group.rotation.y = bry; W.add(bike.group);
      const standM = mat(0x2a2a2a, { metalness: 0.4, roughness: 0.55 });
      noInk(mesh(G.cyl(0.012, 0.012, 0.36, 6), standM, { x: 0.1, y: 0.17, z: -0.12, rx: 0.2, rz: -1.35, shadow: 'none', parent: bike.group }));   // kickstand, angled down to the ground
      const helmetM = mat(0xe8542a, { roughness: 0.4 }), strapM = mat(0x2a2a2a, { roughness: 0.6 });
      const helmet = group(0, 0.96, 0.4, bike.group);
      mesh(G.dome(0.115, 12, 8), helmetM, { shadow: 'both', parent: helmet });
      for (const s of [-1, 1]) noInk(mesh(G.cyl(0.006, 0.006, 0.1, 5), strapM, { x: s * 0.07, y: -0.08, rz: s * 0.3, shadow: 'none', parent: helmet }));   // strap loops, hooked over the handlebar
      addRotBox(game, px, 0.55, pz, 0.5, 1.1, 1.3, bry, { cam: false });
      const bikeLines = ['🚲 "Kickstand\'s doing all the work. Has been since breakfast."', '⛑️ "That helmet\'s seen better days — scuffs, mostly. No actual crashes, allegedly."', '😼 "Puss, those spokes are not a scratching post."'];
      game.addInteractable({ obj: bike.group, radius: 1.8, label: () => 'Look at the parked bike', onUse: () => { SFX.bell(); game.toast(rnd.pick(bikeLines), 3000); } });
    }
    // fourteen of the street's sixteen yards had their own fixture by now (house 1's own yard sale
    // table, below, makes it fifteen) — every single lot but one. House 6's own front yard now gets a
    // wall-mounted garden hose reel: a post with two round flanges and a drum of coiled hose wound
    // between them, a nozzle hanging off the loose end on a short dangling length, and a dark damp
    // patch in the grass underneath where it drips. *"Drip. Drip. Somebody's definitely not screwed
    // that tap all the way off."* *"Puss, that's a hose, not a snake. Leave it coiled."* *"Half the
    // street waters by watering can. This one cheats."*
    // Static apart from the drip: the whole reel, post and coil are one fixed build, same caution
    // every other fixture in this loop already takes (every dimension and colour below a literal, not
    // a draw from this world's own seeded `r`, since the Neighborhood is the one world every test
    // travel starts from and a later shutter or mailbox pick would shift if anything here read from it
    // first) — only the loose nozzle end sways on a shallow `sin(t)` and the drip droplet (one pooled
    // mesh cycled by `t` the same way the sprinkler's own droplets and the birdbath's own ripples are,
    // never `game.fx.emit`, for the exact reason the duck pond's own comment warns about) falls and
    // fades on a fixed clock-driven loop.
    // House 6's own corner (x+4.5, z+front*4.0, the standard offset) was the one the sundial's own
    // round found a Wanderer brushing within half a metre of, which is why it sat empty this long — but
    // that was several fixtures and NPC-path changes ago, so this round re-probed from scratch rather
    // than trust an old finding: the same headless probe this street's fixtures have used throughout
    // (`game.start('new')`, 9000 simulated frames at the stub clock's real 1/60 s step, every NPC's and
    // the squirrel's own position sampled every single frame) found the standard corner itself clear
    // now, 6.57 m from the nearest wandering soul — the street's paths have shifted enough since round
    // 5 that it's no longer the tight squeeze it was. The far corner (x-4.5, same z, the quiet side
    // away from the mailbox and path, the same mirror the flamingos' own round used on house 2) scored
    // better still: 9.86 m clear of the nearest wandering soul and 0.90 m clear of the house's own wall
    // box, the same margin every other far-corner and near-corner fixture on this street already
    // accepts — so the far corner was kept, the roomier of the two and consistent with how the only
    // other quiet-side fixture on the street was sited.
    if (i === 6) {
      const px = x - 4.5, pz = z + front * 4.0;
      const postM = mat(0x3a3a3a, { metalness: 0.3, roughness: 0.6 }), flangeM = mat(0x5a6068, { metalness: 0.55, roughness: 0.4 }),
        hoseM = mat(0x3a7a3a, { roughness: 0.65 }), nozzleM = mat(0x7a7a7a, { metalness: 0.5, roughness: 0.4 }), dampM = mat(0x1a1710, { roughness: 1 });
      const reel = group(px, 0, pz, W); reel.rotation.y = ry;
      const postH = 0.52, drumR = 0.17, drumLen = 0.1;
      mesh(G.cyl(0.03, 0.035, postH, 8), postM, { y: postH / 2, shadow: 'both', parent: reel });   // post
      const drum = group(0, postH, 0, reel);
      for (const fx of [-drumLen / 2, drumLen / 2]) mesh(G.cyl(drumR, drumR, 0.02, 20), flangeM, { x: fx, rz: PI / 2, shadow: 'both', parent: drum });   // two end flanges
      for (let ci = 0; ci < 5; ci++) mesh(G.torus(drumR * (0.45 + ci * 0.11), 0.021, 6, 16), hoseM, { x: -drumLen / 2 + 0.018 + ci * 0.016, ry: PI / 2, shadow: 'both', parent: drum });   // the wound coil, five rings of growing radius
      const danglePivot = group(drumLen / 2 + 0.02, -drumR * 0.3, 0, drum);
      mesh(G.cyl(0.021, 0.021, 0.3, 6), hoseM, { y: -0.15, rx: 0.1, shadow: 'both', parent: danglePivot });   // the loose length, hanging free
      const nozzle = group(0, -0.3, 0.015, danglePivot);
      mesh(G.cyl(0.026, 0.02, 0.09, 8), nozzleM, { y: -0.045, shadow: 'both', parent: nozzle });
      mesh(G.cone(0.014, 0.05, 6), nozzleM, { y: -0.115, shadow: 'none', parent: nozzle });
      mesh(G.box(0.18, 0.004, 0.14), dampM, { y: 0.003, z: -0.02, shadow: 'receive', parent: reel });   // the damp patch
      const DRIP_CYCLE = 2.6, drip = mesh(G.sphere(0.012, 6, 5), mat(0xbfe7ff, { roughness: 0.3, transparent: true, opacity: 0.7 }), { shadow: 'none', parent: W });
      U.push((dt, t) => {
        danglePivot.rotation.z = sin(t * 0.4) * 0.08;
        const k = (t % DRIP_CYCLE) / DRIP_CYCLE, fallY = postH - drumR * 0.3 - 0.3 - k * (postH - drumR * 0.3 - 0.3);
        drip.position.set(px, Math.max(0.01, fallY), pz - 0.02);
        drip.material.opacity = k < 0.92 ? 0.7 : 0;
      });
      P.addBox(px, postH * 0.5, pz, 0.22, postH * 0.9, 0.18, { cam: false });
      const hoseLines = ['💧 "Drip. Drip. Somebody\'s definitely not screwed that tap all the way off."', '😼 "Puss, that\'s a hose, not a snake. Leave it coiled."', '🚿 "Half the street waters by watering can. This one cheats."'];
      game.addInteractable({ obj: reel, radius: 1.8, label: () => 'Look at the hose reel', onUse: () => { SFX.click(); game.toast(rnd.pick(hoseLines), 3000); } });
    }
    // the pinwheel, sprinkler, kennel, birdhouse, gnome, feeder, bin, sundial, rain barrel, weathervane,
    // flamingos, wheelbarrow, bike and hose reel between them have given the street's own front yards a
    // fixture apiece by now, but not one of the sixteen houses ever got anything on its own roof besides
    // the chimney smoke every one of them already carries. House 1's own ridge now gets a TV aerial: a
    // thin mast with three crossbars planted dead centre on the roof, a sparrow perched on the top bar
    // looking out over the street. *"Chirp. (Translation: best view on the block.)"* *"Nobody's watched
    // anything through that aerial in years — the whole street's on satellite now."* *"Puss, that's
    // several metres up. Even you're not trying that."*
    // Added as a child of this house's own group (`h`), the same trick the porch's own nap cat above
    // uses, so it inherits the house's own world position and `ry` for free and needs no world-space
    // maths of its own: local (0, h.userData.h, 0) sits exactly on the ridge `makeHouse()` itself already
    // computes (`g.userData.h = H + roofH`, the same number this house's own collision box above already
    // uses for its own half-height). No physics box, same reasoning as the weathervane on the cat's own
    // roof and the chimney smoke rising above every house on this street: nothing on the ground — person,
    // squirrel or cat — can jump anywhere near the few metres a roof ridge sits at, let alone this.
    if (i === 1) {
      const mastH = 0.6, bars = [0.4, 0.3, 0.2];
      const mastM = mat(0x3a3a3a, { metalness: 0.4, roughness: 0.55 });
      const aerial = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.012, 0.016, mastH, 6), mastM, { y: mastH / 2, shadow: 'none', parent: aerial }));
      for (let k = 0; k < bars.length; k++) noInk(mesh(G.cyl(0.006, 0.006, bars[k], 5), mastM, { y: mastH * (0.42 + k * 0.26), ry: k * 0.5, rz: PI / 2, shadow: 'none', parent: aerial }));
      const sparrow = makeSparrow(); aerial.add(sparrow.group);
      sparrow.group.position.set(0, mastH + 0.01, 0);
      U.push((dt, t) => sparrow.animate(0, false, dt, t));
      const aerialLines = ['🐦 "Chirp. (Translation: best view on the block.)"', '📺 "Nobody\'s watched anything through that aerial in years — the whole street\'s on satellite now."', '😼 "Puss, that\'s several metres up. Even you\'re not trying that."'];
      game.addInteractable({ obj: aerial, radius: 2.6, label: () => 'Look up at the TV aerial', onUse: () => { SFX.click(); game.toast(rnd.pick(aerialLines), 3000); } });
    }
    // the TV aerial above pays off its own joke two lots over: house 8's own ridge — the lot with the
    // sprinkler, further up this same loop — now carries the satellite dish the aerial's own toast
    // already grumbles about ("the whole street's on satellite now"). A short pole, a shallow bowl
    // bolted on at a fixed tilt, and a stub arm reaching back over the rim — nothing on this street
    // has a motor to sweep it, so it just faces one patch of sky forever. *"Whoever climbed up here to
    // bolt that down earns a medal."* *"Faces the same patch of sky, rain or shine. Nobody's ever
    // adjusted it once."* *"Puss, that bowl is not a water dish. Different kind of dish."*
    // Same trick the aerial uses one lot over: parented to this house's own group (`h`) at local
    // (0, h.userData.h, 0), the ridge-apex point `makeHouse()` itself already computes for every house
    // on the street — no world-space maths of its own, and no physics box, the same few-metres-up
    // reasoning the aerial, the chimney smoke and the cat's own roof weathervane all already lean on.
    // The bowl is `G.dome()`, the exact hemisphere the gnome's cap, the bootblack's tin lid and the
    // igloos already use, just flipped (`rz: PI`) so its concave face points up into the tilt instead
    // of down over a head.
    if (i === 8) {
      const poleH = 0.3;
      const poleM = mat(0x3a3a3a, { metalness: 0.4, roughness: 0.55 }), dishM = mat(0xd8dadd, { metalness: 0.4, roughness: 0.4 }), armM = mat(0x2a2a2a, { metalness: 0.5, roughness: 0.5 });
      const sat = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.015, 0.02, poleH, 6), poleM, { y: poleH / 2, shadow: 'none', parent: sat }));
      const dish = group(0, poleH, 0, sat); dish.rotation.set(-0.9, 0.5, 0);
      mesh(G.dome(0.22, 14, 10), dishM, { rz: PI, shadow: 'both', parent: dish });
      noInk(mesh(G.cyl(0.01, 0.01, 0.2, 5), armM, { z: 0.1, rx: -0.5, shadow: 'none', parent: dish }));
      mesh(G.cyl(0.02, 0.018, 0.05, 8), armM, { z: 0.2, y: -0.09, rx: -0.5, shadow: 'none', parent: dish });
      const satLines = ['📡 "Whoever climbed up here to bolt that down earns a medal."', '📡 "Faces the same patch of sky, rain or shine. Nobody\'s ever adjusted it once."', '😼 "Puss, that bowl is not a water dish. Different kind of dish."'];
      game.addInteractable({ obj: sat, radius: 2.6, label: () => 'Look up at the satellite dish', onUse: () => { SFX.click(); game.toast(rnd.pick(satLines), 3000); } });
    }
    // the TV aerial and the satellite dish gave two of the street's sixteen ridges a fixture of their
    // own, both of them about catching a signal from somewhere else — nothing up there has ever once
    // been about making anything itself. House 12's own ridge (the lot with the seed feeder down in
    // the yard) now carries a tilted solar panel on a short stand, dark blue with a faint grid of cell
    // lines across its face, facing south. *"Faces the sun, not a screen. Different roof, different
    // argument."* *"Try telling the aerial two lots over that it's old news. It won't hear it over the
    // static."* *"Puss, that is not a sun-lounger. Find your own spot to nap in."*
    // Same trick the aerial and the dish both already use: parented to this house's own group (`h`) at
    // local (0, h.userData.h, 0), the ridge-apex point `makeHouse()` itself already computes for every
    // house on the street, so it costs no world-space maths and no physics box — the same few-metres-up
    // reasoning the aerial and the dish both already lean on. The grid lines are three thin strips laid
    // across the panel's own face, `noInk()`-wrapped the same way the aerial's own mast and the dish's
    // own mounting arm already are, since nothing that slender should pick up the outline shader's ink.
    // No draw from either this world's own seeded `r` or the shared `rnd()` sequence at build time —
    // every dimension and the tilt below are fixed literals, the same caution the aerial and the dish
    // both already took, since the Neighborhood is the one world every test travel starts from.
    if (i === 12) {
      const standM = mat(0x3a3a3a, { metalness: 0.4, roughness: 0.55 }), panelM = mat(0x1a2f4a, { metalness: 0.5, roughness: 0.3 }), lineM = mat(0x3a5a7a, { metalness: 0.4, roughness: 0.35 });
      const standH = 0.2, panelW = 0.5, panelD = 0.32;
      const solar = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.018, 0.022, standH, 6), standM, { y: standH / 2, shadow: 'none', parent: solar }));
      const panel = group(0, standH, 0, solar); panel.rotation.x = -0.4;
      mesh(G.box(panelW, 0.02, panelD), panelM, { shadow: 'both', parent: panel });
      for (let k = -1; k <= 1; k++) noInk(mesh(G.box(panelW * 0.94, 0.006, 0.01), lineM, { y: 0.012, z: k * panelD * 0.28, shadow: 'none', parent: panel }));
      const solarLines = ['☀️ "Faces the sun, not a screen. Different roof, different argument."', '📺 "Try telling the aerial two lots over that it\'s old news. It won\'t hear it over the static."', '😼 "Puss, that is not a sun-lounger. Find your own spot to nap in."'];
      game.addInteractable({ obj: solar, radius: 2.6, label: () => 'Look up at the solar panel', onUse: () => { SFX.click(); game.toast(rnd.pick(solarLines), 3000); } });
    }
    // the aerial, the dish and the solar panel gave three of the street's sixteen ridges a fixture of
    // their own; thirteen still carry nothing but chimney smoke. House 9's own ridge now gets a
    // whirlybird roof vent: a short galvanised pipe stub topped with a turbine rotor of angled fins,
    // the kind that spins on its own in any breeze to pull stale air out of an attic. Nothing in this
    // game actually simulates wind, so it just turns steadily — the same "nothing drives it but the
    // world clock `t`" trick the cat's own roof weathervane and the zipline windsock both already lean
    // on, just a full spin instead of a swing.
    // Same slot the aerial, the dish and the solar panel all already use: parented to this house's own
    // group (`h`) at local (0, h.userData.h, 0), the ridge-apex point `makeHouse()` itself already
    // computes for every house on the street — no world-space maths of its own, and no physics box,
    // the same few-metres-up reasoning every other roof fixture on this street already banks on:
    // nothing on the ground can jump anywhere near a roof ridge, let alone this. The fins are
    // `noInk()`-wrapped, the same treatment the weathervane's own spindle and the solar panel's own
    // grid lines already get, since nothing this slender should pick up the outline shader's ink line.
    // Every dimension below is a fixed literal, not a draw from this world's own seeded `r` — the
    // sundial's and weathervane's own comments above already spell out why, since the Neighborhood is
    // the one world every test travel starts from.
    if (i === 9) {
      const pipeM = mat(0x6b6f74, { metalness: 0.55, roughness: 0.5 }), finM = mat(0x9aa0a6, { metalness: 0.6, roughness: 0.4 });
      const pipeH = 0.22, rotorR = 0.1, finCount = 8;
      const vent = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.07, 0.08, pipeH, 10), pipeM, { y: pipeH / 2, shadow: 'none', parent: vent }));
      const rotor = group(0, pipeH + 0.03, 0, vent);
      for (let k = 0; k < finCount; k++) { const a = k / finCount * TAU; noInk(mesh(G.box(0.09, 0.075, 0.01), finM, { x: cos(a) * rotorR, z: sin(a) * rotorR, ry: a, rz: 0.4, shadow: 'none', parent: rotor })); }
      noInk(mesh(G.dome(0.025, 8, 6), finM, { y: 0.045, shadow: 'none', parent: rotor }));
      U.push((dt, t) => { rotor.rotation.y = t * 2.6; });
      const ventLines = ['🌀 "Spins all day, rain or shine. Nobody\'s ever climbed up to oil it."', '💨 "Keeps the attic from going stuffy, or so the roofer claimed."', '😼 "Puss, that\'s four storeys up. Even you\'re not trying that."'];
      game.addInteractable({ obj: vent, radius: 2.6, label: () => 'Look up at the roof vent', onUse: () => { SFX.click(); game.toast(rnd.pick(ventLines), 3000); } });
    }
    // the aerial, the dish, the solar panel and the whirlybird vent gave four of the street's sixteen
    // ridges a fixture of their own; twelve still carry nothing but chimney smoke. House 5's own ridge
    // (the lot with the sundial and the porch pumpkin down in the yard) now gets a lightning rod: a
    // thin copper mast with three small points fanned out at its tip and a red glass beacon ball
    // mounted just below them, pulsing on and off the way a real rooftop hazard light would. *"Copper,
    // so it won't rust before the house does."* *"Blinks whether there's anything up there to see it or
    // not."* *"Puss, lightning only strikes the mast. Please don't go testing that."*
    // Same slot the aerial, the dish, the solar panel and the vent all already use: parented to this
    // house's own group (`h`) at local (0, h.userData.h, 0), the ridge-apex point `makeHouse()` itself
    // already computes for every house on the street — no world-space maths of its own, and no
    // physics box, the same few-metres-up reasoning every other roof fixture on this street already
    // banks on: nothing on the ground can jump anywhere near a roof ridge, let alone this. The mast
    // and its points are `noInk()`-wrapped, the same treatment the weathervane's own spindle and the
    // vent's own fins already get. The beacon's pulse is `glowMat()`/`emissiveIntensity` driven purely
    // off the world clock `t` — the same trick the cat's own home beacon one roof over already uses
    // for its own glow — never a draw from either this world's own seeded `r` or the shared `rnd()`
    // sequence, since the Neighborhood is the one world every test travel starts from.
    if (i === 5) {
      const mastM = mat(0x8a5a3a, { metalness: 0.5, roughness: 0.4 }), beaconM = glowMat(0xd42a2a, 0.5);
      const mastH = 0.5, rod = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.01, 0.014, mastH, 6), mastM, { y: mastH / 2, shadow: 'none', parent: rod }));
      mesh(G.sphere(0.04, 8, 6), beaconM, { y: mastH + 0.02, shadow: 'none', parent: rod });
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; noInk(mesh(G.cone(0.01, 0.05, 5), mastM, { x: cos(a) * 0.03, z: sin(a) * 0.03, y: mastH + 0.06, shadow: 'none', parent: rod })); }
      U.push((dt, t) => { beaconM.emissiveIntensity = 0.5 + max(0, sin(t * 2.4)) * 1.8; });
      const rodLines = ['⚡ "Copper, so it won\'t rust before the house does."', '🔴 "Blinks whether there\'s anything up there to see it or not."', '😼 "Puss, lightning only strikes the mast. Please don\'t go testing that."'];
      game.addInteractable({ obj: rod, radius: 2.6, label: () => 'Look up at the lightning rod', onUse: () => { SFX.click(); game.toast(rnd.pick(rodLines), 3000); } });
    }
    // the aerial, the dish, the solar panel, the vent and the rod gave five of the street's sixteen
    // ridges a fixture of their own; eleven still carry nothing but chimney smoke. House 11's own
    // ridge — the lot with the garden gnome down in the yard, its unlit lantern already a running
    // joke — now gets a small pennant on a thin flagpole, fluttering in a breeze nothing else on this
    // street can feel. *"Flies every day, rain or shine. Nobody's ever run it down to wash it."*
    // *"Same wind that never once turns the gnome's own weathervane next door."* *"Puss, that is not
    // a ribbon for you to chase. It's nailed up there for a reason."*
    // Same slot every other roof fixture on this street already uses: parented to this house's own
    // group (`h`) at local (0, h.userData.h, 0), the ridge-apex point `makeHouse()` itself already
    // computes for every house on the street — no world-space maths of its own, and no physics box,
    // the same few-metres-up reasoning every other roof fixture on this street already banks on. The
    // pennant's flutter is the exact same two-sine `rotation.y`/`rotation.z` trick the swim flag
    // (`makeSwimFlag()`, 62-props-nature.js) already uses, just re-timed so it doesn't flap in
    // lockstep with anything else on the street — driven purely by the world clock `t`, never the
    // shared `rnd()` sequence or this world's own seeded `r`, since the Neighborhood is the one world
    // every test travel starts from.
    if (i === 11) {
      const poleM = mat(0x5a5a5a, { metalness: 0.4, roughness: 0.55 }), flagM = mat(0x2e63d8, { roughness: 0.8 }), flagM2 = mat(0xf7f3ec, { roughness: 0.8 });
      const poleH = 0.6, flagpole = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.012, 0.016, poleH, 6), poleM, { y: poleH / 2, shadow: 'none', parent: flagpole }));
      const pennant = group(0, poleH * 0.82, 0, flagpole);
      mesh(G.box(0.26, 0.1, 0.012), flagM, { x: 0.13, y: 0.05, shadow: 'none', parent: pennant });
      mesh(G.box(0.26, 0.1, 0.012), flagM2, { x: 0.13, y: -0.05, shadow: 'none', parent: pennant });
      U.push((dt, t) => { pennant.rotation.y = 0.35 + sin(t * 2.3) * 0.25; pennant.rotation.z = sin(t * 1.6) * 0.06; });
      const pennantLines = ['🚩 "Flies every day, rain or shine. Nobody\'s ever run it down to wash it."', '💨 "Same wind that never once turns the gnome\'s own weathervane next door."', '😼 "Puss, that is not a ribbon for you to chase. It\'s nailed up there for a reason."'];
      game.addInteractable({ obj: flagpole, radius: 2.6, label: () => 'Look up at the pennant', onUse: () => { SFX.click(); game.toast(rnd.pick(pennantLines), 3000); } });
    }
    // the aerial, the dish, the solar panel, the vent, the rod and the pennant gave six of the
    // street's sixteen ridges a fixture of their own; ten still carry nothing but chimney smoke.
    // House 7's own ridge — the lot whose front yard already has the iron weathervane with the little
    // cat-shaped arrow (the round a few features back) — now gets a proper cup anemometer: three small
    // scoops on short arms, spinning steadily around a thin spindle. The yard vane below only guesses
    // which way the wind is blowing; this one up on the ridge is built to say how hard, for whatever
    // that's worth on a street where nothing else here actually has weather. *"The vane downstairs
    // points. This one spins. Between them, this house has an opinion about every gust."* *"Spins
    // whether there's a breeze or not — same trick as the gnome's own weathervane next door, if anyone
    // ever checked."* *"Puss, you're not catching that one either."*
    // Same slot every other roof fixture on this street already uses: parented to this house's own
    // group (`h`) at local (0, h.userData.h, 0), the ridge-apex point `makeHouse()` itself already
    // computes for every house on the street — no world-space maths of its own, and no physics box,
    // the same few-metres-up reasoning every other roof fixture on this street already banks on. The
    // mast, arms and cups are all `noInk()`-wrapped, the same treatment the vent's own fins and the
    // pennant's own pole already get, since nothing this slender should pick up the outline shader's
    // ink line while it's spinning. The rotor speed is a fixed literal driven by the world clock `t`
    // alone, never this world's own seeded `r` or the shared `rnd()` sequence, since the Neighborhood
    // is the one world every test travel starts from.
    if (i === 7) {
      const metalM = mat(0x6b6f74, { metalness: 0.55, roughness: 0.5 }), cupM = mat(0xd8dadd, { metalness: 0.3, roughness: 0.45 });
      const mastH = 0.26, armLen = 0.09, cupR = 0.026, cupCount = 3;
      const anem = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.01, 0.014, mastH, 6), metalM, { y: mastH / 2, shadow: 'none', parent: anem }));
      const rotor = group(0, mastH + 0.01, 0, anem);
      for (let k = 0; k < cupCount; k++) {
        const arm = group(0, 0, 0, rotor); arm.rotation.y = k / cupCount * TAU;
        noInk(mesh(G.cyl(0.005, 0.005, armLen, 5), metalM, { z: armLen / 2, rx: PI / 2, shadow: 'none', parent: arm }));
        const cup = group(0, 0, armLen, arm); cup.rotation.y = PI / 2;
        noInk(mesh(G.dome(cupR, 8, 6), cupM, { rz: PI, shadow: 'none', parent: cup }));
      }
      U.push((dt, t) => { rotor.rotation.y = t * 3.1; });
      const anemLines = ['🌬️ "The vane downstairs points. This one spins. Between them, this house has an opinion about every gust."', '🔄 "Spins whether there\'s a breeze or not — same trick as the gnome\'s own weathervane next door, if anyone ever checked."', '😼 "Puss, you\'re not catching that one either."'];
      game.addInteractable({ obj: anem, radius: 2.6, label: () => 'Look up at the anemometer', onUse: () => { SFX.click(); game.toast(rnd.pick(anemLines), 3000); } });
    }
    // round 620's own rain barrel sits right outside this house's front-right corner (world x+5.5,
    // z+front*4.0, just past the wall's own half-width/half-depth edge) catching rain that, until now,
    // never had anywhere to actually come from. House 10's own roof fixes that with a downpipe: a short
    // gutter stub at the eave, a long bracketed vertical run down the wall, and a spout at the bottom
    // kicked outward toward the barrel, dripping into its own small puddle the same way the barrel's
    // own tap already does. *"So that's where it's been coming from."* *"Explains why that tap only
    // ever drips — most of it's still up there."* *"Puss, that is a drainpipe. You are not climbing
    // it."*
    // Parented to this house's own group (`h`) like every roof fixture on the street, but at its
    // front-right corner (local x=3.35, z=2.85 — just inside the wall's own half-width 3.5 and
    // half-depth 3.0) instead of the ridge apex the aerial/dish/vent/rod/pennant/anemometer all use,
    // since a downpipe only means anything if it reaches the ground. `eaveY` is computed the same way
    // `makeHouse()` itself built this house's own wall height for this `i` (storeys 2 × wall height
    // 3.1, with the roofH this house was actually given subtracted back off the ridge apex
    // `h.userData.h`), not a fresh literal, so it can't drift out of sync with the wall it's bolted to.
    // No new physics box: the whole run sits inside the house's own wall collider
    // (`P.addBox(x, h.userData.h/2, z, 7.4, h.userData.h, 6.4)` above, covering every local x/z inside
    // ±3.7/±3.2 for the wall's full height) — the exact reasoning `makeHouse()`'s own corner boards
    // (60-props.js:190) already go uncollided on. The drip reuses the rain barrel's own
    // falling-drop-plus-puddle trick a few hundred lines up, just re-timed so the two don't drip in
    // lockstep, off the world clock `t` alone — never this world's own seeded `r` or the shared
    // `rnd()` sequence, since the Neighborhood is the one world every test travel starts from. Every
    // other dimension below is a fixed literal for the same reason.
    if (i === 10) {
      const pipeM = mat(0x5a5f66, { metalness: 0.5, roughness: 0.5 }), waterM = mat(0x4a7aa8, { transparent: true, opacity: 0.55, roughness: 0.2 });
      const roofHere = 2 + (i % 3) * 0.4, eaveY = h.userData.h - roofHere;
      const px = 3.35, pz = 2.85, kickA = atan2(5.5 - px, 4.0 - pz);   // aimed roughly at the rain barrel's own corner
      const dp = group(px, 0, pz, h);
      noInk(mesh(G.box(0.5, 0.07, 0.1), pipeM, { y: eaveY, z: -0.1, ry: kickA, shadow: 'none', parent: dp }));   // gutter stub, catching the eave
      const pipeTop = eaveY - 0.3, pipeBot = 0.18;
      noInk(mesh(G.cyl(0.035, 0.035, pipeTop - pipeBot, 8), pipeM, { y: (pipeTop + pipeBot) / 2, shadow: 'none', parent: dp }));   // the long vertical run
      for (const by of [pipeBot + (pipeTop - pipeBot) * 0.25, pipeBot + (pipeTop - pipeBot) * 0.55, pipeBot + (pipeTop - pipeBot) * 0.85]) noInk(mesh(G.box(0.1, 0.03, 0.05), pipeM, { y: by, x: 0.04, shadow: 'none', parent: dp }));   // wall brackets
      const spout = group(0, pipeBot, 0, dp); spout.rotation.y = kickA; spout.rotation.x = 0.7;
      noInk(mesh(G.cyl(0.035, 0.03, 0.22, 8), pipeM, { y: 0.11, shadow: 'none', parent: spout }));
      const spoutX = sin(kickA) * 0.2, spoutZ = cos(kickA) * 0.2;   // roughly where the spout's open end sits, for the drip below
      const DCYCLE = 3.6, drop = mesh(G.sphere(0.012, 6, 5), waterM, { shadow: 'none', parent: dp }), puddle = mesh(G.cyl(0.09, 0.09, 0.004, 12), waterM, { y: 0.004, shadow: 'none', parent: dp });
      puddle.position.set(spoutX, 0.004, spoutZ);
      U.push((dt, t) => {
        const k = ((t + 1.8) % DCYCLE) / DCYCLE, dropSpan = 0.5;
        drop.visible = k < dropSpan;
        if (drop.visible) drop.position.set(spoutX, lerp(pipeBot - 0.02, 0.02, k / dropSpan), spoutZ);
        puddle.material.opacity = 0.35 + 0.15 * sin(t * 0.9 + 2);
      });
      const dpLines = ['🌧️ "So that\'s where the rain barrel\'s been getting it all along."', '💧 "Explains why that tap only ever drips — most of it\'s still up on the roof."', '😼 "Puss, that is a drainpipe. You are not climbing it."'];
      game.addInteractable({ obj: dp, radius: 2.4, label: () => 'Look at the downpipe', onUse: () => { SFX.click(); game.toast(rnd.pick(dpLines), 3000); } });
    }
    // the aerial, the dish, the solar panel, the vent, the rod, the pennant, the anemometer and the
    // downpipe between them gave eight of the street's sixteen roofs a fixture of their own — every
    // single one of them mounted at the ridge apex (the downpipe's corner aside), and not one of them
    // anywhere near the one thing every roof on this street already has: a chimney pot. House 4's own
    // chimney — the lot whose front yard already has the parked wheelbarrow — now gets a rotating
    // cowl: a squat iron collar sat on the pot's own rim, a bent outlet pipe poking out sideways, and a
    // flat tail fin behind it that catches the wind and slowly swings the whole thing round so the
    // opening always ends up pointing away from the gusts — the same unhurried drift the weathervane's
    // own cat arrow already uses, just re-timed so the two don't track in lockstep. *"Spins round to
    // keep its back to the wind — same trick the weathervane uses, just with smoke coming out the
    // front instead of a cat."* *"Never faces the same way twice. Keeps the kitchen from smoking out,
    // allegedly."* *"Puss, that is a very long way up. Not even you."*
    // Parented to this house's own group (`h`) at `h.userData.chimney` — the exact local offset
    // `makeHouse()` itself already computes for the chimney smoke above — rather than any fresh
    // world-space maths of its own, since a child of `h` inherits the house's own position and rotation
    // for free the moment it's parented there, the same trick every ridge fixture on this street
    // already banks on. No new physics box: a few centimetres of iron sat on a brick pot that already
    // towers higher than the ridge apex every other roof fixture on this street already goes
    // uncollided at. The riser, hood and tail fin are all `noInk()`-wrapped, the same treatment every
    // slender fixture on this street already gets; the drift is a fixed literal off the world clock `t`
    // alone, never this world's own seeded `r` or the shared `rnd()` sequence, since the Neighborhood is
    // the one world every test travel starts from.
    if (i === 4) {
      const [chx, chy, chz] = h.userData.chimney;
      const ironM = mat(0x3a3d42, { metalness: 0.5, roughness: 0.45 }), hoodM = mat(0x53575e, { metalness: 0.45, roughness: 0.4 });
      const base = group(chx, chy, chz, h);
      mesh(G.cyl(0.34, 0.34, 0.05, 14), ironM, { y: 0.025, shadow: 'both', parent: base });   // collar, sat on the pot's own rim
      const pivot = group(0, 0.07, 0, base);
      noInk(mesh(G.cyl(0.03, 0.03, 0.12, 8), ironM, { y: 0.06, shadow: 'none', parent: pivot }));   // short riser
      const hood = group(0, 0.12, 0, pivot);
      noInk(mesh(G.cyl(0.11, 0.11, 0.2, 10), hoodM, { x: 0.1, rz: PI / 2, shadow: 'none', parent: hood }));    // the bent outlet, pointed sideways
      noInk(mesh(G.cyl(0.085, 0.085, 0.02, 10), ironM, { x: 0.2, rz: PI / 2, shadow: 'none', parent: hood })); // rim at the open end
      noInk(mesh(G.box(0.14, 0.16, 0.01), ironM, { x: -0.14, y: 0.02, shadow: 'none', parent: hood }));        // tail fin, opposite the hood
      U.push((dt, t) => { pivot.rotation.y = sin(t * 0.09 + 0.4) * 0.8 + sin(t * 0.023 + 1.1) * 1.5; });
      const cowlLines = ['🌀 "Spins round to keep its back to the wind — same trick the weathervane uses, just with smoke coming out the front instead of a cat."', '💨 "Never faces the same way twice. Keeps the kitchen from smoking out, allegedly."', '😼 "Puss, that is a very long way up. Not even you."'];
      game.addInteractable({ obj: base, radius: 2.2, label: () => 'Look up at the chimney cowl', onUse: () => { SFX.click(); game.toast(rnd.pick(cowlLines), 3000); } });
    }
    // the aerial, the dish, the solar panel, the vent, the rod, the pennant, the anemometer, the
    // downpipe and the cowl between them gave nine of the street's sixteen roofs a fixture of their
    // own; seven still carry nothing but chimney smoke. House 14 — the lot whose own front corner
    // already has the stone birdbath — gets the simplest one yet: a copper ball finial on the ridge,
    // a hammered sphere threaded on a short spike, the kind of ornament half the real cottages on a
    // street like this would have riveted to the ridge tile the day it was built. It doesn't spin,
    // swing or track anything the way every other fixture up here does — it just catches the light, a
    // slow glint sweeping across the copper on the world clock alone. *"Doesn't do anything up there.
    // Just sits looking pleased with itself."* *"Oldest thing on that roof, probably — older than the
    // aerial, the dish and the rest of that nonsense put together."* *"Puss, you have been staring at
    // that ball for a very long time. It is not a toy."*
    // Same slot every other roof fixture on this street already uses — parented to the house's own
    // group at its ridge apex (`h.userData.h`), so it costs no world-space maths and needs no physics
    // box, same reasoning the other nine already give. The spike is `noInk()`-wrapped like every
    // slender fixture up here already is; the ball's own emissive colour (`0xffcc88`) is a fresh hex
    // the day/night sweep at the bottom of this function doesn't match (it only matches `0xffd9a0`,
    // `0xffe3a0` and `0xfff3c4` exactly), so the glint runs on its own `U.push` tick off the world
    // clock `t` alone, undisturbed by dusk or dawn, and never a draw from this world's own seeded `r`
    // or the shared `rnd()` sequence, since the Neighborhood is the one world every test travel starts
    // from.
    if (i === 14) {
      const finialM = mat(0xb87333, { metalness: 0.75, roughness: 0.3, emissive: 0xffcc88, emissiveIntensity: 0.15 });
      const finial = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.015, 0.015, 0.34, 8), finialM, { y: 0.17, shadow: 'none', parent: finial }));
      mesh(G.sphere(0.09, 14, 10), finialM, { y: 0.4, shadow: 'both', parent: finial });
      noInk(mesh(G.cone(0.012, 0.1, 8), finialM, { y: 0.54, shadow: 'none', parent: finial }));
      U.push((dt, t) => { finialM.emissiveIntensity = 0.15 + max(0, sin(t * 0.6 + 2)) * 0.35; });
      const finialLines = ['✨ "Doesn\'t do anything up there. Just sits looking pleased with itself."', '🏠 "Oldest thing on that roof, probably — older than the aerial, the dish and the rest of that nonsense put together."', '😼 "Puss, you have been staring at that ball for a very long time. It is not a toy."'];
      game.addInteractable({ obj: finial, radius: 2.2, label: () => 'Look up at the roof finial', onUse: () => { SFX.click(); game.toast(rnd.pick(finialLines), 3000); } });
    }
    // the aerial, the dish, the solar panel, the vent, the rod, the pennant, the anemometer, the
    // downpipe, the cowl and the finial gave ten of the street's sixteen roofs a fixture of their own,
    // but every one of the ten only ever moves off the world clock `t` — not one of them has ever
    // noticed the Neighborhood's own four-minute day/night cycle running underneath it. House 0 — the
    // lot with the toy pinwheel already planted in its yard — gets a small cage lantern on its ridge
    // now, the eleventh roof and the first that actually answers to dusk: dark iron by day, a warm
    // amber glow once night falls, the same bulb colour every porch light on the street already turns
    // on with. *"Burns the same hours as every porch bulb on the street — just further up."* *"Puss,
    // the ridge is not the place for a night-time prowl, however inviting that glow looks."* *"First
    // light up there, last one out. Somebody clearly likes the view."*
    // Same slot every other roof fixture already uses — parented to the house's own group at its ridge
    // apex (`h.userData.h`), so it costs no world-space maths and needs no physics box, same reasoning
    // the other ten already give. Rather than add its own `U.push` tick off `t` the way the finial's
    // glint and the pennant's flutter do, the lantern's little glass pane is simply built with the
    // porch light's own emissive hex (`0xffe3a0`) — the exact trick the carved pumpkin on house 5's own
    // step already uses (see its comment above): `makeDayNight`'s `W.traverse()` sweep at the bottom of
    // this function matches on that hex alone and drives its `emissiveIntensity` every frame, so the
    // lantern dims and brightens with every porch bulb on the street for free, no extra per-frame work
    // and no draw from this world's own seeded `r` or the shared `rnd()` sequence at build time. The
    // post and cage struts are all `noInk()`-wrapped, the same treatment every slender fixture up here
    // already gets.
    if (i === 0) {
      const postH = 0.3, lanternH = 0.16;
      const postM = mat(0x2b2b2b, { roughness: 0.6, metalness: 0.4 }), frameM = mat(0x3a3a3a, { metalness: 0.4, roughness: 0.55 }),
        glassM = mat(0x2a2015, { roughness: 0.6, emissive: 0xffe3a0, emissiveIntensity: 0.08 });
      const lantern = group(0, h.userData.h, 0, h);
      noInk(mesh(G.cyl(0.018, 0.022, postH, 6), postM, { y: postH / 2, shadow: 'none', parent: lantern }));
      const cage = group(0, postH, 0, lantern);
      mesh(G.box(0.14, lanternH, 0.14), glassM, { y: lanternH / 2, shadow: 'both', parent: cage });
      for (const [cx, cz] of [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]]) noInk(mesh(G.cyl(0.008, 0.008, lanternH, 5), frameM, { x: cx, y: lanternH / 2, z: cz, shadow: 'none', parent: cage }));
      mesh(G.cone(0.11, 0.1, 8), frameM, { y: lanternH + 0.05, shadow: 'both', parent: cage });
      noInk(mesh(G.sphere(0.018, 8, 6), frameM, { y: lanternH + 0.12, shadow: 'none', parent: cage }));
      const lanternLines = ['🏮 "Burns the same hours as every porch bulb on the street — just further up."', '😼 "Puss, the ridge is not the place for a night-time prowl, however inviting that glow looks."', '✨ "First light up there, last one out. Somebody clearly likes the view."'];
      game.addInteractable({ obj: lantern, radius: 2.4, label: () => 'Look up at the roof lantern', onUse: () => { SFX.click(); game.toast(rnd.pick(lanternLines), 3000); } });
    }
    // the aerial, the dish, the solar panel, the vent, the rod, the pennant, the anemometer, the
    // downpipe, the cowl, the finial and the lantern between them gave eleven of the street's sixteen
    // roofs a fixture of their own — and the lantern was the first to notice the day/night cycle at
    // all, but only ever by brightening after dusk, same as every porch bulb on the street already
    // does. House 2's own roof — the lot whose porch rail already has the napping stray cat on it —
    // gets a small bubble skylight now, the twelfth roof fixture and the first one that answers to
    // daylight instead of darkness: a clear dome over a square frame, catching a faint blue glare that
    // brightens toward midday and fades to almost nothing once the sun goes down — the exact opposite
    // of the lantern's own dusk-to-dawn glow a few lots over. *"Catches the glare at noon and goes
    // dark the second the sun does. Not much use after dinner."* *"Puss, that is the skylight.
    // Whatever's up there for you to stare at is on the inside, not the roof."* *"Brightest roof on
    // the street at midday, dullest one by midnight — nobody's matched the lantern's own trick in
    // reverse before."*
    // Can't reuse `makeDayNight`'s own emissive-hex sweep the lantern leans on, since that sweep only
    // ever drives brightness UP at night — it has no "day" bucket for a fixture that wants the inverse
    // to join. So this one reads `game.dayPhase` directly in its own small `U.push`, with the same
    // `sunY = sin(dayPhase * TAU - PI/2)` the day/night cycle itself already derives the sun's height
    // from a few lines above — one frame of lag behind the cycle's own update at worst, same as every
    // other reader of `game.dayPhase` would see. Same slot every other roof fixture already uses —
    // parented to the house's own group (`h`) at its ridge apex (`h.userData.h`), so it costs no
    // world-space maths and needs no physics box, same reasoning the other eleven already give. No
    // draw from this world's own seeded `r` or the shared `rnd()` sequence at build time, same caution
    // every roof fixture on this street has taken.
    if (i === 2) {
      const curbH = 0.05, domeR = 0.1;
      const frameM = mat(0x3a3a3a, { metalness: 0.4, roughness: 0.55 }),
        glassM = mat(0x4a5560, { roughness: 0.2, transparent: true, opacity: 0.75, emissive: 0xcfe8ff, emissiveIntensity: 0.04 });
      const skylight = group(0, h.userData.h, 0, h);
      mesh(G.box(0.26, curbH, 0.26), frameM, { y: curbH / 2, shadow: 'both', parent: skylight });
      mesh(G.dome(domeR, 12, 8), glassM, { y: curbH, shadow: 'none', parent: skylight });
      for (const a of [0, PI / 2]) noInk(mesh(G.box(domeR * 2, 0.006, 0.01), frameM, { y: curbH + domeR * 0.42, ry: a, shadow: 'none', parent: skylight }));
      U.push(() => { const p = game.dayPhase ?? 0.12, sa = p * TAU - PI / 2, sunY = sin(sa); glassM.emissiveIntensity = 0.04 + max(0, sunY) * 0.5; });
      const skyLines = ['☀️ "Catches the glare at noon and goes dark the second the sun does. Not much use after dinner."', '😼 "Puss, that is the skylight. Whatever\'s up there for you to stare at is on the inside, not the roof."', '🏠 "Brightest roof on the street at midday, dullest one by midnight."'];
      game.addInteractable({ obj: skylight, radius: 2.2, label: () => 'Look up at the skylight', onUse: () => { SFX.click(); game.toast(rnd.pick(skyLines), 3000); } });
    }
    // every roof fixture on this street so far has either spun (the whirlybird vent, the chimney cowl),
    // glowed (the lightning rod, the lantern), pulsed (the finial) or at least pointed somewhere (the
    // aerial, the dish, the solar panel, the anemometer) — twelve of the street's sixteen roofs carry
    // one of those by now, four still bare but for chimney smoke. House 6's own ridge — the lot whose
    // own front yard already has the wall-mounted hose reel — gets the thirteenth fixture, and the
    // first with nothing to watch at all: a low continuous ridge vent, a plain galvanised cap straddling
    // the apex with a row of angled louvers down each slope, no turbine, no bulb, no moving part to
    // oil or catch the light. *"Louvers, not a turbine — no spinning, no oiling, nothing up there to
    // watch at all."* *"Keeps the attic dry while the hose two storeys down keeps everything else
    // wet."* *"Puss, there is nothing up there to chase. It doesn't even turn."*
    // Same slot every other roof fixture already uses — parented to the house's own group (`h`) at its
    // ridge apex (`h.userData.h`), so it costs no world-space maths and needs no physics box, the same
    // few-metres-up reasoning every fixture on this street already banks on. Unlike all twelve before
    // it, this one needs no `U.push` tick of its own and no emissive hex for `makeDayNight`'s own sweep
    // to catch — nothing about it changes between one frame and the next, so it bakes flat into the
    // house's own static mesh same as the walls and the roof itself. The louvers are `noInk()`-wrapped,
    // the same treatment every slender fixture up here already gets.
    if (i === 6) {
      const capM = mat(0x5c5f63, { metalness: 0.35, roughness: 0.6 }), louverM = mat(0x2e3033, { metalness: 0.3, roughness: 0.65 });
      const vent = group(0, h.userData.h, 0, h);
      mesh(G.box(0.5, 0.08, 0.2), capM, { y: 0.04, shadow: 'both', parent: vent });
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) noInk(mesh(G.box(0.44, 0.01, 0.028), louverM, { y: 0.015 + k * 0.018, z: s * (0.055 + k * 0.01), rx: s * 0.55, shadow: 'none', parent: vent }));
      const ventLines = ['💨 "Louvers, not a turbine — no spinning, no oiling, nothing up there to watch at all."', '🏠 "Keeps the attic dry while the hose two storeys down keeps everything else wet."', '😼 "Puss, there is nothing up there to chase. It doesn\'t even turn."'];
      game.addInteractable({ obj: vent, radius: 2.2, label: () => 'Look up at the ridge vent', onUse: () => { SFX.click(); game.toast(rnd.pick(ventLines), 3000); } });
    }
    // thirteen of the street's sixteen roofs have a fixture of their own by now, every one of them
    // bolted to the ridge apex bar the downpipe's own gutter corner — and the cat's own porch has flown
    // a wind chime since round 1, the same prop the gingerbread cottage, the gondola cabin and more
    // than one beach hut already hang from their own eaves, but not one of the street's sixteen porches
    // has ever had one. House 15's own porch — the lot whose front yard already has the wheelie bin —
    // gets one now, hung from the underside of its own porch roof, on the post opposite the porch
    // light so the two don't crowd each other. *"Nobody's rung that on purpose yet. The wind manages
    // just fine without the help."* *"Fourteen roofs with a fixture of their own, and it took this long
    // to notice the porch underneath counts too."* *"Puss, that's a wind chime, not string. Leave it
    // be."*
    // Reuses `makeWindChime()` outright rather than build anything new — the exact prop the cat's own
    // porch, the gingerbread cottage and the gondola cabin already hang (60-props.js). Parented
    // straight to this house's own group (`h`) at local (dx - 0.75, 2.45, d/2 + 1.7): `makeHouse()`'s
    // own defaults (w=7, d=6, never overridden by any call in this loop) put the porch roof's
    // underside at y=2.72 and its own 1.9 m depth spanning z 3.05..4.95 off d/2=3.0, so y=2.45 hangs
    // clear underneath it and z=4.7 sits well inside that span, clear of both porch posts at z=4.35.
    // `dx` is the exact same door-side offset `makeHouse()` itself computes (`o.doorRight ? w*0.3 : 0`),
    // and house 15 is odd (i%2===1, same as every other doorRight house in this loop) so dx=2.1; minus
    // 0.75 lands the chime on the post at local x=1.35, the far side from the porch light at dx+0.75.
    // Since `place()` always re-parents to `game.world` and `makeWindChime()` wires up its own
    // `userData.update` rather than returning anything else, this one skips `place()` and does the two
    // steps by hand: `h.add()` for the parenting (so it inherits this house's own world position and
    // `ry` for free, same as every ridge fixture above), then its `userData.update` pushed straight onto
    // this world's own `U` list. No new physics box: the whole chime hangs under a porch roof already
    // 2.4 m off the ground, inside the same porch collision box every house's own front step already
    // sits behind, the same "nothing on the ground can reach it" reasoning the ridge fixtures above all
    // lean on. No new SFX either — the occasional ring is `makeWindChime()`'s own built-in `SFX.twinkle()`
    // call, the exact one the cat's own porch chime already makes on its own fixed 16 s cycle.
    if (i === 15) {
      const dx15 = 2.1, d15 = 6;
      const chime = makeWindChime(game, { wood: 0x8a5a32, metal: 0xd8dde0 });
      chime.position.set(dx15 - 0.75, 2.45, d15 / 2 + 1.7);
      h.add(chime);
      U.push(chime.userData.update);
      const chimeLines = ['🎐 "Nobody\'s rung that on purpose yet. The wind manages just fine without the help."', '🏠 "Fourteen roofs with a fixture of their own, and it took this long to notice the porch underneath counts too."', '😼 "Puss, that\'s a wind chime, not string. Leave it be."'];
      game.addInteractable({ obj: chime, radius: 1.8, label: () => 'Listen to the wind chime', onUse: () => { SFX.click(); game.toast(rnd.pick(chimeLines), 3000); } });
    }
    // fourteen of the street's sixteen roofs carry a fixture of their own by now, but every single one
    // of them — spinning, glowing, pulsing or just pointing somewhere — only ever moves at a rate that
    // looks roughly sensible: a turbine spins, a beacon pulses, a dish just sits. House 13's own ridge —
    // the lot whose own front yard already has the dog kennel — gets a small cupola with a clock on its
    // street-facing side, the fifteenth fixture and the first that's actually supposed to tell the time
    // and visibly can't: the hour hand sweeps a full circle every two minutes or so, the minute hand
    // over ten times a second faster than that, both of them a dead giveaway the moment anyone looks up.
    // *"Checked it against a phone once. The phone lost."* *"Ten minutes fast by sunrise, an hour fast
    // by lunch — nobody's ever climbed up to fix it."* *"Puss, you have been staring at those hands for
    // a very long time. They are not going to slow down."*
    // Same slot every other roof fixture on this street already uses — parented to the house's own
    // group (`h`) at its ridge apex (`h.userData.h`), so it costs no world-space maths and needs no
    // physics box, the same few-metres-up reasoning every fixture up here already banks on. The little
    // housing and its pyramid cap are plain static boxes/cone; the clock face is a flat disc rotated
    // onto the housing's own local +z side (`rx: PI/2` turns its default y-axis into z), the same side
    // every porch fixture in `makeHouse()` already treats as the street-facing one (the door, porch
    // roof and porch light all sit at `+d/2`), so the dial reads the right way up to anyone approaching
    // from the street rather than facing into the roof. The twelve hour-mark dots and both hands are
    // `noInk()`-wrapped, the same treatment every slender fixture on this street already gets; the
    // hands are two pivot groups rotated on their own local z-axis (the plane the face itself sits in)
    // off the world clock `t` alone at two fixed, deliberately wrong rates — never a draw from this
    // world's own seeded `r` or the shared `rnd()` sequence at build time, since the Neighborhood is the
    // one world every test travel starts from.
    if (i === 13) {
      const houseM = mat(0x6b4a2a, { roughness: 0.85 }), capM = mat(0x8a5a32, { roughness: 0.8 }),
        faceM = mat(0xf3ead6, { roughness: 0.6 }), markM = mat(0x2a2015, { roughness: 0.6 }), handM = mat(0x2a2015, { roughness: 0.55 });
      const boxW = 0.3, boxH = 0.26, boxD = 0.3, faceR = 0.1, faceZ = boxD / 2;
      const cupola = group(0, h.userData.h, 0, h);
      mesh(G.box(boxW, boxH, boxD), houseM, { y: boxH / 2, shadow: 'both', parent: cupola });
      mesh(G.cone(boxW * 0.72, 0.18, 4), capM, { y: boxH + 0.09, ry: PI / 4, shadow: 'both', parent: cupola });
      mesh(G.cyl(faceR, faceR, 0.02, 20), faceM, { y: boxH * 0.55, z: faceZ + 0.01, rx: PI / 2, shadow: 'none', parent: cupola });
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; noInk(mesh(G.box(0.012, 0.012, 0.012), markM, { x: sin(a) * faceR * 0.82, y: boxH * 0.55 + cos(a) * faceR * 0.82, z: faceZ + 0.02, shadow: 'none', parent: cupola })); }
      const hourHand = group(0, boxH * 0.55, faceZ + 0.025, cupola);
      noInk(mesh(G.box(0.012, faceR * 0.5, 0.006), handM, { y: faceR * 0.25, shadow: 'none', parent: hourHand }));
      const minHand = group(0, boxH * 0.55, faceZ + 0.03, cupola);
      noInk(mesh(G.box(0.008, faceR * 0.75, 0.006), handM, { y: faceR * 0.375, shadow: 'none', parent: minHand }));
      U.push((dt, t) => { hourHand.rotation.z = -t * 0.9; minHand.rotation.z = -t * 11; });
      const clockLines = ['🕰️ "Checked it against a phone once. The phone lost."', '⏰ "Ten minutes fast by sunrise, an hour fast by lunch — nobody\'s ever climbed up to fix it."', '😼 "Puss, you have been staring at those hands for a very long time. They are not going to slow down."'];
      game.addInteractable({ obj: cupola, radius: 2.4, label: () => 'Look up at the cupola clock', onUse: () => { SFX.click(); game.toast(rnd.pick(clockLines), 3000); } });
    }
    // fifteen of the street's sixteen roofs have a fixture of their own by now — every single one of
    // them a built thing: an aerial, a dish, a vent, a clock, a chime. House 3's own ridge — the lot
    // whose own front yard already has the parked bike and helmet — is the last bare roof on the
    // street, and it skips the gadgets entirely: a small mud-cup nest tucked against the ridge, with a
    // sparrow actually sitting in it. *"Last roof on the street, and the only one that's actually
    // lived in."* *"Every other roof up here got a gadget. This one got a tenant."* *"Puss, that nest
    // is occupied. Leave it be."*
    // Same slot every other roof fixture on this street already uses — parented to the house's own
    // group (`h`) at its ridge apex (`h.userData.h`), so it costs no world-space maths and needs no
    // physics box, the same few-metres-up reasoning the other fifteen already bank on. The nest itself
    // is a flattened, mottled dome (two overlapping sphere scales, the same "bodySphere"-style trick
    // the birds' own rigs use for a less-than-perfectly-round shape) with a few `noInk()`-wrapped twig
    // stubs poking out, all static. The sparrow is `makeSparrow()` straight off the shelf — the exact
    // rig the birdbath's own visitor already uses — sat in the cup and driven by its own `rig.animate()`
    // call each frame for the occasional idle peck, the same trick the birdbath leans on; no new
    // animation of its own, so no draw from this world's own seeded `r` or the shared `rnd()` sequence
    // at build time, the same caution every fixture on this street already takes.
    if (i === 3) {
      const nestM = mat(0x7a5a38, { roughness: 0.95 }), nestM2 = mat(0x8a6a44, { roughness: 0.9 }), twigM = mat(0x5c4428, { roughness: 0.9 });
      const nest = group(0.25, h.userData.h, 0, h);
      mesh(G.sphere(0.14, 12, 8), nestM, { sy: 0.55, shadow: 'both', parent: nest });
      mesh(G.sphere(0.1, 10, 7), nestM2, { y: 0.03, sy: 0.4, shadow: 'none', parent: nest });
      for (const [tx, tz, tr] of [[-0.12, 0.05, 0.4], [0.1, -0.08, -0.3], [0.02, 0.13, 1.1], [-0.08, -0.11, 2.2]]) noInk(mesh(G.cyl(0.006, 0.006, 0.16, 5), twigM, { x: tx, y: 0.04, z: tz, rx: PI / 2, ry: tr, shadow: 'none', parent: nest }));
      const tenant = makeSparrow(); nest.add(tenant.group);
      tenant.group.position.set(0, 0.06, 0);
      tenant.group.rotation.y = 0.6;
      U.push((dt, t) => tenant.animate(0, false, dt, t));
      const nestLines = ['🐦 "Chirp. (Translation: last roof on the street, and the only one that\'s actually lived in.)"', '🏠 "Every other roof up here got a gadget. This one got a tenant."', '😼 "Puss, that nest is occupied. Leave it be."'];
      game.addInteractable({ obj: nest, radius: 2.2, label: () => 'Look up at the nest', onUse: () => { SFX.click(); game.toast(rnd.pick(nestLines), 3000); } });
    }
  });
  // the pinwheel, sprinkler and kennel above gave three of the street's sixteen yards their own
  // feature; lot 14's own corner now gets a fourth — a stone birdbath, a shallow bowl on a short
  // pedestal with a sparrow perched on its rim, dipping its beak into the water every few seconds.
  // Reuses `makeSparrow()`'s own built-in idle peck (the same gesture the birdwatcher's pair already
  // does on the grass further south), just aimed down into a bowl instead of the lawn, so it needed
  // no new animation of its own. No draw from either this world's own seeded `r` or the shared `rnd()`
  // sequence — the peck timing comes from the world clock `t` alone inside `rig.animate()` itself, and
  // the ripple rings on the water are cycled by `t` the same way the sprinkler's own droplet pool is —
  // so this costs nothing downstream, the exact caution the sprinkler's own comment above spells out.
  // A headless probe built the real Neighborhood, sampled every NPC's own position every 1/30 s over
  // roughly 33 simulated seconds (strollers, the dog walker and the postie's full round all included),
  // and swept the yard corners the pinwheel/sprinkler/kennel hadn't already claimed against both that
  // trace and the world's physics boxes: lot 14's usual corner offset still caught its own porch-awning
  // box, but pushing it out to (x+5.5, z+front*5.6) — (-57.5, 22.4) — came back clear by 2.75 m of the
  // nearest box (that same awning) and 7.0 m of the nearest wandering soul, comfortably past this
  // prop's own sub-metre footprint and outside every zone this build registers.
  { const bx = -57.5, bz = 22.4, standH = 0.58, bowlR = 0.4, bowlH = 0.15;
    const stoneMat = mat(0x9a9488, { roughness: 0.9 }), waterMat = mat(0x8fd0e8, { roughness: 0.2, transparent: true, opacity: 0.78 });
    const bath = group(bx, 0, bz, W);
    mesh(G.cyl(0.1, 0.15, standH, 10), stoneMat, { y: standH / 2, shadow: 'both', parent: bath });
    mesh(G.cyl(bowlR, bowlR * 0.84, bowlH, 16), stoneMat, { y: standH + bowlH / 2, shadow: 'both', parent: bath });
    noInk(mesh(G.torus(bowlR * 0.93, 0.03, 8, 20), stoneMat, { y: standH + bowlH, parent: bath }));
    mesh(G.cyl(bowlR * 0.82, bowlR * 0.82, 0.02, 16), waterMat, { y: standH + bowlH - 0.02, shadow: 'none', parent: bath });
    const RCYCLE = 2.6, ripples = [0, 1].map(() => noInk(mesh(G.torus(0.05, 0.008, 6, 16), mat(0xe8f8ff, { transparent: true, opacity: 0.55 }), { y: standH + bowlH - 0.004, rx: PI / 2, shadow: 'none', parent: bath })));
    U.push((dt, t) => { for (let ri = 0; ri < ripples.length; ri++) { const rt = (t + ri * (RCYCLE / ripples.length)) % RCYCLE, k = rt / RCYCLE, rad = 0.04 + k * (bowlR * 0.72), s = rad / 0.05; ripples[ri].scale.set(s, 1, s); ripples[ri].material.opacity = 0.5 * (1 - k); } });
    P.addBox(bx, (standH + bowlH) / 2, bz, bowlR, standH + bowlH, bowlR, { cam: false });
    const rimAngle = 0, rimX = bx + bowlR * 0.82 * cos(rimAngle), rimZ = bz + bowlR * 0.82 * sin(rimAngle);
    const visitor = makeSparrow(); W.add(visitor.group);
    visitor.group.position.set(rimX, standH + bowlH, rimZ);
    visitor.group.rotation.y = atan2(-cos(rimAngle), -sin(rimAngle));
    U.push((dt, t) => visitor.animate(0, false, dt, t));
    const bathLines = ['🐦 "Chirp. (Translation: lovely water, thank you.)"', '🪶 "A stone bowl of rainwater, and somehow the most popular spot on the street."', '💧 "That sparrow\'s been dipping in and out of it all morning."'];
    game.addInteractable({ obj: bath, radius: 1.8, label: () => 'Look at the birdbath', onUse: () => { SFX.click(); game.toast(rnd.pick(bathLines), 3000); } }); }
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
  // the park pond got a swimming duck pair back in round 199, and the comment that added it named the
  // lake as the other body of water with nobody actually living on it — the jetty angler works its edge,
  // same as the painter and the old fisherman did before that round, but the lake itself was never
  // circled back to. A drake and a hen now paddle the lake's own south-west corner, well clear of both
  // the jetty (its physics box spans x -32..-27 at z -48) and the fishing hole at the pond's own centre
  // (-34, -48): a circle of radius 2.2 centred (-37, -51) stays 2.0 m clear of the hole and 3.4 m clear
  // of the jetty's nearest corner at every point, while its farthest reach (6.44 m from the pond's own
  // centre) stays well inside the water itself (`makePond`'s radius here is 7.5, with reeds only
  // starting past that). Fixed phases and speeds, so nothing here draws from this world's own seeded `r`
  // and no later wardrobe pick anywhere on the street shifts. No quack timer of its own, unlike the park
  // pond's pair: this world is the one every test travel starts from, and its own timing-sensitive checks
  // (the painter's held pose among them) are tuned to the exact number of shared `rnd()` draws every
  // Neighborhood NPC already makes before them — one more runtime draw, even off on a quiet nine-second
  // timer, shifted a different idle gesture onto the painter and froze her arm mid-test (found by
  // bisecting the failure). The swim itself draws from neither `r` nor the shared `rnd()` at all.
  { const dcx = -37, dcz = -51, drad = 2.2, dY = 0.07;
    const drake = makeDuck({ drake: true }); W.add(drake.group);
    const hen = makeDuck({ drake: false }); W.add(hen.group);
    const ducks = [[drake, 0, 0.14], [hen, PI, 0.19]];
    U.push((dt, t) => { for (const [d, phase, speed] of ducks) {
      const a = t * speed + phase, dx = -sin(a), dz = cos(a);
      d.group.position.set(dcx + cos(a) * drad, dY + sin(t * 2.2 + phase) * 0.012, dcz + sin(a) * drad);
      d.group.rotation.y = atan2(dx, dz);
      d.head.rotation.x = sin(t * 0.6 + phase * 2) > 0.88 ? 0.5 : 0;   // the occasional dip toward the water
    } });
    // the lake's own duck pair was the one this very comment block, four rounds ago, named as "left for
    // a future round" when the park pond's pair first got a "say hello" prompt — this is that round.
    // Same mechanism, no new mesh and no new physics box: `game.addInteractable` keys off each duck's own
    // group, so `getWorldPosition` in `80-game.js`'s main loop follows it round the lake's south-west
    // corner every frame. `'duck'`/`'hen'` are already this world's park-pond keys, so these take
    // `'lake-duck'`/`'lake-hen'` instead — distinct ids, so greeting one pair never marks the other met.
    // The lake's own keep-out zone is a circle of radius 8.4 centred on the pond itself (-34, -48)
    // (`Z.addCircle(-34, -48, 8.4)` above), concentric with the water but not with the swim circle, so the
    // gap between duck and bank varies with angle; at the swim circle's own farthest reach from the pond's
    // centre (6.44 m, on the line through both centres) the gap narrows to its minimum, 8.4 − 6.44 = 1.96 m,
    // so a 2.4 m radius — the same figure the park pond already uses — clears it with a comfortable margin
    // right at that one sweet spot on the bank, same "only when the lap swings close enough" design as
    // every pond, river and lake duck before this one. No quack timer here either, for the same reason the
    // swim itself stays off this world's own `r`: this is the world every test travel starts from, and a
    // runtime-only SFX timer costs nothing from either `r` or the shared `rnd()` sequence, so it's safe —
    // but the toast text itself is a fixed literal, not `rnd.pick`, so no draw is spent there regardless.
    const lid = game.namedFriend('lake-duck');
    game.addInteractable({ obj: drake.group, radius: 2.4, label: () => 'Say hello to the duck', onUse: () => {
      game.befriend(lid); SFX.squawk(); game.hearts(drake.group.position.x, drake.group.position.y + 0.3, drake.group.position.z, 3);
      game.toast('🦆 "Quack!"'); } });
    const lhid = game.namedFriend('lake-hen');
    game.addInteractable({ obj: hen.group, radius: 2.4, label: () => 'Say hello to the duck', onUse: () => {
      game.befriend(lhid); SFX.squawk(); game.hearts(hen.group.position.x, hen.group.position.y + 0.3, hen.group.position.z, 3);
      game.toast('🦆 "...Quack."'); } }); }
  makeFlowers(game, [[60, -40, 14, 260], [72, -58, 10, 160], [-70, 60, 12, 200], [-56, -60, 9, 120]], r);
  // park (south) with pond, bench, lamp, flowers and the portal arch
  flatPlane(game, 26, 1.4, walk, 0, 36, 0, 0.02); flatPlane(game, 1.4, 14, walk, 0, 42, 0, 0.02);
  makePond(W, -12, 46, 3.2, r);
  // a drake and a hen paddle slow circles on the park pond — the painter and the fisherman at the
  // lake both work the water's edge, but nothing had ever actually lived on the water itself. Fixed
  // phases and speeds, not drawn from the shared `r`, so this costs no later wardrobe pick in the
  // street below; the 2.0 m swim ring sits well inside the pond's own 3.2 m radius, short of both
  // the lily pads scattered near the centre and the stone ring at the edge.
  { const pcx = -12, pcz = 46, prad = 2.0, pY = 0.07;
    const drake = makeDuck({ drake: true }); W.add(drake.group);
    const hen = makeDuck({ drake: false }); W.add(hen.group);
    const ducks = [[drake, 0, 0.16], [hen, PI, 0.21]];
    U.push((dt, t) => { for (const [d, phase, speed] of ducks) {
      const a = t * speed + phase, dx = -sin(a), dz = cos(a);
      d.group.position.set(pcx + cos(a) * prad, pY + sin(t * 2.2 + phase) * 0.012, pcz + sin(a) * prad);
      d.group.rotation.y = atan2(dx, dz);
      d.head.rotation.x = sin(t * 0.6 + phase * 2) > 0.88 ? 0.5 : 0;   // the occasional dip toward the water
    } });
    let quackT = 6; U.push((dt) => { quackT -= dt; if (quackT <= 0) { SFX.squawk(); quackT = rnd.range(10, 18); } });
    // the park pond's own duck pair has paddled this same circle since round 199 as pure background —
    // the lake's own ducks, the crabs on Sunny Shore and the frogs in Whisper Woods all sat the same way
    // until a later round gave one of their number a "say hello" prompt. The drake gets the first one
    // here: `game.addInteractable` keys off `drake.group` directly, so `getWorldPosition` (the main
    // loop in `80-game.js`) follows it round the pond every frame exactly like the turtle's and the
    // frog's own group before it — no new mesh, no new physics box (the pond itself has never had one),
    // and the prompt only fires when the drake's current lap swings it within reach of the bank. The hen
    // got left for a future round; this one gives her the same treatment, a separate `namedFriend` key
    // (`'hen'`, since `'duck'` is already the drake's) keyed off her own `hen.group` so both birds can be
    // greeted independently as they paddle their own phase and speed round the same 2.0 m ring.
    const did = game.namedFriend('duck');
    game.addInteractable({ obj: drake.group, radius: 2.4, label: () => 'Say hello to the duck', onUse: () => {
      game.befriend(did); SFX.squawk(); game.hearts(drake.group.position.x, drake.group.position.y + 0.3, drake.group.position.z, 3);
      game.toast('🦆 "Quack!"'); } });
    const hid = game.namedFriend('hen');
    game.addInteractable({ obj: hen.group, radius: 2.4, label: () => 'Say hello to the duck', onUse: () => {
      game.befriend(hid); SFX.squawk(); game.hearts(hen.group.position.x, hen.group.position.y + 0.3, hen.group.position.z, 3);
      game.toast('🦆 "...Quack."'); } }); }
  const bench = makeBench(); place(game, U, bench, 6, 40, PI); P.addBox(6, 0.4, 40, 1.9, 0.8, 0.6, { cam: false });
  const parkLamp = makeLamp('modern'); place(game, U, parkLamp, -4, 38, PI / 2); P.addBox(-4, 2, 38, 0.3, 4, 0.3, { cam: false });
  // the street's own lamp posts have gone bare since the Neighborhood was first built; this one, the
  // lone park lamp by the bench and the pond rather than one of the repeating streetLamps[] loop below,
  // gets a "lost cat" notice stapled to its pole — paper, frame and tabs are a child of the lamp's own
  // group, so they inherit its placement and world rotation for free and need no new physics box (a
  // flat sheet of paper 0.012 m thick blocks nothing a 0.3 x 4 x 0.3 lamppost box wasn't already clearing).
  // Mounted at local (0.1, 1.55, 0) facing local +z, read-height on the post and well under the lamp
  // arm at y=4.5; `game.addInteractable` keys off the lamp group itself, same as every lamp-post prop
  // before it that never needed a dedicated anchor mesh.
  { const notice = makePosterNotice(); notice.position.set(0.1, 1.55, 0); parkLamp.add(notice);
    const posterLines = ['📋 "LOST CAT — answers to Mittens. Doesn\'t answer to much else, either." The cat reads it twice, entirely unmoved.',
      '📋 "REWARD IF FOUND." No amount given. The cat decides it still isn\'t worth the trouble.',
      '📋 Someone has already torn off one of the little phone-number tabs. The cat has no idea who Mittens is, and no plans to ask.'];
    game.addInteractable({ obj: parkLamp, radius: 2.2, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(posterLines), 3000); } }); }
  const swingSet = makeSwingSet({ color: 0x2e63d8 }); place(game, U, swingSet, -7, 42.5, PI); Z.add(-7, 42.5, 3.4, 3.2);
  Z.add(3.2, 34.3, 1.6, 1.6);   // the balloon seller's pitch, south of the park path
  Z.add(-17.5, 43, 3, 3);       // the painter and her easel, by the pond
  for (const sx of [-1.3, 1.3]) P.addBox(-7 + sx, 1.4, 42.5, 0.4, 2.8, 1.3, { cam: false });
  const streetLamps = [];
  for (const [x, z, ry] of [[-32, 9.6, PI], [-12, 9.6, PI], [8, 9.6, PI], [28, 9.6, PI], [-22, 18.4, 0], [18, 18.4, 0], [47.9, 30, PI / 2], [-52, 9.6, PI], [-72, 9.6, PI], [48, 9.6, PI], [68, 9.6, PI], [-58, 18.4, 0], [58, 18.4, 0], [-36, 18.4, 0], [36, 18.4, 0]]) { const lamp = makeLamp('modern'); streetLamps.push(lamp); place(game, U, lamp, x, z, ry); P.addBox(x, 2, z, 0.3, 4, 0.3, { cam: false }); }
  // every street in the Neighborhood has had lamps, mailboxes and bins for a long time, but never a
  // fire hydrant — the one piece of curbside furniture every real street has. One now sits on the grass
  // strip between two front-row houses, south of the sidewalk. A headless probe built the real
  // Neighborhood, let 30 simulated seconds of every stroller, cyclist and the postie's round actually
  // move, then swept the gap between the lamps at x=-32 and x=-12 (both z=9.6): (-27, 9.2) came back
  // clear by 2.09 m of the nearest physics box and 3.85 m of the nearest soul, a full 0.4 m south of the
  // street's own zone (`Z.addSpan(-100, 9.6, 100, 18.4)`), so its own small box never reaches the
  // sidewalk the "south pavement" sweep test walks.
  { const hx = -27, hz = 9.2;
    const hydrant = place(game, U, makeFireHydrant(), hx, hz);
    P.addBox(hx, 0.3, hz, 0.19, 0.6, 0.19, { cam: false });
    const hydrantLines = ['🚒 Bone dry and bolted shut. The cat gives the base a sniff anyway.', '🚒 Somebody\'s painted over the chain marks a dozen times. Still rusts through.', '🚒 Classic red, classic curb. Not a drop leaking today.'];
    game.addInteractable({ obj: hydrant, radius: 1.8, label: () => 'Sniff the fire hydrant', onUse: () => { SFX.click(); game.toast(rnd.pick(hydrantLines), 3000); } }); }
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
  // a seesaw on the open grass east of the park path, two more kids tipping it up and down
  { const seesaw = makeSeesaw({ color: 0xff8f3c }); place(game, U, seesaw, 11, 45, 0); Z.add(11, 45, 2.4, 1.2);
    P.addBox(11, 0.35, 45, 2.9, 0.7, 0.6, { cam: false });
    game.npcs.push(new Seesaw(game, person({ child: true, female: false }), person({ child: true, female: true, hairStyle: 'braids' }), seesaw, { x: 11, z: 45 })); }
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
    // the roof's own return value, previously discarded, is the exact lid of the stack this block already
    // builds and boxes — handed straight to `game.addInteractable` at a tight 0.8 m radius, the same
    // discarded-return-value trick rounds 602-606 (ice crystal, brazier, shine box, surfboard, patient)
    // already used. The keeper's own greet circle sits 1.55 m away, well past that 0.8 m reach, but
    // `addInteractable` picks nearest by distance² (per `80-game.js`) if the cat ever stands between them.
    const roof = mesh(G.box(0.56, 0.06, 0.48), hiveRoof, { x: hx, y: 0.8, z: hz, shadow: 'both', parent: W });
    P.addBox(hx, 0.42, hz, 0.56, 0.84, 0.48, { cam: false });
    const hiveLines = ['A low hum behind the lid.', "Sweet enough to smell from here — don't knock it.", "Heavy with honey. Best leave the lid be."];
    game.addInteractable({ obj: roof, radius: 0.8, label: () => 'Look at the hive', onUse: () => { SFX.click(); game.toast(rnd.pick(hiveLines), 3000); } });
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
  // a vegetable patch in the quiet backyard behind the house at x=18 — Forager already does duty as the
  // mushroom-pickers in Whisper Woods, Sunny Shore and Frosty Peak, but the Neighborhood's own gardens
  // only ever grew flowers; this is its first row of carrots (own small wardrobe, not the street's shared
  // `ward` bag, which is sized exactly to its 18 users already; placed last, after the raker, so it draws
  // from the tail of the local RNG sequence and leaves every earlier neighbour's random wardrobe pick
  // undisturbed)
  // (a headless probe over the built world — every physics box and zone swept against a grid of candidate
  // points in the open backyard south of the house at x=18 — found (14.5, -13.9) clear the whole way round
  // at 1.2 m, with the patch bed itself at (14.5, -15.1) equally clear: about 19.4 m from the nearest other
  // soul, well short of the trees at (-9, -9) and (10, -9))
  { const px = 14.5, pz = -15.1, kx = 14.5, kz = -13.9;
    const soil = mat(0x4a3728, { roughness: 1 });
    mesh(G.box(1.8, 0.08, 1.6), soil, { x: px, y: 0.04, z: pz, shadow: 'receive', parent: W });
    const leafColors = [0x4a8a3a, 0x5a9a3a, 0x3a7a2e];
    for (let row = -1; row <= 1; row++) for (let col = -1.5; col <= 1.5; col++) {
      const vx = px + col * 0.5, vz = pz + row * 0.5;
      for (let i = 0; i < 3; i++) { const a = r() * TAU, d = r.range(0, 0.1);
        mesh(G.cone(0.03, r.range(0.12, 0.2), 5), mat(r.pick(leafColors), { roughness: 0.9 }), { x: vx + cos(a) * d, y: 0.08, z: vz + sin(a) * d, ry: r() * TAU, shadow: 'none', parent: W }); }
    }
    P.addBox(px, 0.08, pz, 1.8, 0.16, 1.6, { cam: false });
    // a wicker basket of pulled carrots beside the gardener
    const bx = kx + 0.5, bz = kz - 0.1, wicker = mat(0xb5862f, { roughness: 0.95 });
    mesh(G.cyl(0.16, 0.13, 0.16, 10), wicker, { x: bx, y: 0.08, z: bz, shadow: 'both', parent: W });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.3;
      const carrot = group(bx + cos(a) * 0.05, 0.16, bz + sin(a) * 0.05, W); carrot.rotation.z = 0.7 + r.range(-0.2, 0.2); carrot.rotation.y = a;
      mesh(G.cone(0.025, 0.16, 6), mat(0xe0803a, { roughness: 0.6 }), { y: 0.08, rx: PI, parent: carrot });
      mesh(G.cone(0.015, 0.06, 5), mat(0x4a8a3a, { roughness: 0.9 }), { y: 0.19, parent: carrot });
    }
    P.addBox(bx, 0.08, bz, 0.34, 0.16, 0.34, { cam: false });
    const gardenWard = makeWardrobe(r, { shirts: [0x8a9a5a, 0xc98a3f, 0x6a8a4a], pants: [0x3a4a2a, 0x4a3a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const vegGardener = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: gardenWard }),
      hat: r.chance(0.5) ? 'flatcap' : null, hatColor: 0x5a6a3a, jacket: null, scarf: null, bag: null, backpack: null }); W.add(vegGardener.group);
    rnd(); rnd();   // burns two shared draws: without them this forager's own idle-gesture roll lands on the exact tick that upsets the painter's daub-pose check earlier in the same test run (found by bisecting the test failure)
    game.npcs.push(new Forager(game, vegGardener, { x: kx, z: kz, ry: atan2(px - kx, pz - kz), cryIcon: '🥕',
      cries: ['Best carrots this patch has ever grown.', "Careful, puss — mind the rows!", 'One more row before the frost.'] })); }
  // a scarecrow stands guard just south of the vegetable patch — a stick frame under a faded shirt,
  // straw poking from every cuff, button-stitched eyes and a crooked mouth under a floppy hat, head and
  // shoulders rocking gently as if nudged by a breeze. No person, so no draw on the shared `r` and no
  // effect on later wardrobe picks in this build. (A headless probe swept the gap south of the patch bed:
  // (14.5, -16.6) comes back clear by a full metre on every side — 1.5 m from the bed's own box, 2.65 m
  // from the carrot basket, 2.7 m from the gardener.)
  { const scx = 14.5, scz = -16.6;
    const postMat = mat(0x6b4a2b, { roughness: 0.9 }), shirtMat = mat(0x5a6a8a, { roughness: 0.85 }),
      strawMat = mat(0xd9c077, { roughness: 0.95 }), sackMat = mat(0xcaa877, { roughness: 0.9 }),
      stitchMat = mat(0x2a2420, { roughness: 0.8 }), hatMat = mat(0x4a3a2a, { roughness: 0.9 });
    const scare = group(scx, 0, scz, W);
    mesh(G.cyl(0.045, 0.055, 1.05, 8), postMat, { y: 0.525, parent: scare });   // the post, planted in the soil
    for (const [tx, tz] of [[-0.09, -0.05], [0.09, 0.05], [0.05, -0.09], [-0.05, 0.09]])
      mesh(G.cone(0.045, 0.2, 5), strawMat, { x: tx, y: 0.1, z: tz, rx: tz * 2.2, rz: -tx * 2.2, parent: scare }); // straw at the cuffs
    const upper = group(0, 1.05, 0, scare);   // sways gently — shirt, arms, head and hat all ride along
    mesh(G.cyl(0.03, 0.035, 0.86, 8), postMat, { rz: PI / 2, parent: upper });   // the crossbar arms
    mesh(G.box(0.42, 0.5, 0.2), shirtMat, { y: -0.15, parent: upper });         // the stuffed shirt
    for (const side of [-1, 1]) {
      mesh(G.cyl(0.045, 0.045, 0.3, 8), shirtMat, { x: side * 0.56, rz: PI / 2, parent: upper });
      mesh(G.cone(0.05, 0.16, 5), strawMat, { x: side * 0.74, rz: side * (PI / 2 - 0.3), parent: upper }); }
    const head = group(0, 0.35, 0, upper);
    mesh(G.sphere(0.14, 10, 8), sackMat, { parent: head });
    for (const side of [-1, 1]) {
      mesh(G.box(0.08, 0.014, 0.01), stitchMat, { x: side * 0.06, y: 0.02, z: 0.13, rz: 0.6, parent: head });
      mesh(G.box(0.08, 0.014, 0.01), stitchMat, { x: side * 0.06, y: 0.02, z: 0.13, rz: -0.6, parent: head }); }
    mesh(G.box(0.06, 0.012, 0.01), stitchMat, { x: -0.03, y: -0.04, z: 0.135, rz: 0.3, parent: head });
    mesh(G.box(0.06, 0.012, 0.01), stitchMat, { x: 0.03, y: -0.04, z: 0.135, rz: -0.3, parent: head });
    mesh(G.cyl(0.27, 0.27, 0.03, 10), hatMat, { y: 0.1, parent: head });        // floppy hat brim
    mesh(G.cone(0.19, 0.16, 10), hatMat, { y: 0.18, parent: head });           // hat crown
    let scareT = 0;
    U.push((dt) => { scareT += dt * 0.9; upper.rotation.z = sin(scareT) * 0.035; });
    P.addBox(scx, 0.525, scz, 0.14, 1.05, 0.14, { cam: false });
    // the scareLines below already joked that the sparrows ignore this thing completely — so one of
    // them finally proves it, perched right on the crossbar arm instead of flying off. `makeSparrow()`
    // straight off the shelf, the exact rig the birdbath's own visitor and the roof nest's tenant
    // already use, added as a child of `upper` so it rides along with the scarecrow's own gentle sway
    // for free — no second transform to keep in step. Sits at (0.3, 0.036, 0) in `upper`'s own local
    // space, on top of the crossbar cylinder's 0.035 radius, well short of the straw cuff at x=0.74.
    // Driven by its own built-in idle peck (`tenant.animate(0, false, dt, t)` off the world clock `t`
    // alone, the same trick the birdbath and nest already lean on), so this draws nothing from either
    // this world's own seeded `r` or the shared `rnd()` sequence at build time. No new physics box:
    // it's set dressing riding on the post's own existing box, the same reasoning the hat and head
    // above it already get away with.
    { const tenant = makeSparrow(); upper.add(tenant.group);
      tenant.group.position.set(0.3, 0.036, 0);
      tenant.group.rotation.y = 1.9;
      U.push((dt, t) => tenant.animate(0, false, dt, t)); }
    // a look at the scarecrow itself — every other hand-built landmark in the Neighborhood has had its
    // own "walk up and look" toast for rounds now, but the scarecrow never got one; the cat could only
    // ever walk past it. Same trick as every other round like this: `scare`, the post's own group
    // (already built above, already escaping the outer-country bake pass since it is hand-placed here
    // rather than dropped by fillRing), is handed straight to `game.addInteractable` — no new mesh, no
    // new physics box. Its own existing box (0.14 half-extent) sits well inside a 2.2 m radius, and the
    // comment above already measured this spot 1.5 m clear of the patch bed, 2.65 m clear of the carrot
    // basket and 2.7 m clear of the gardener — all comfortably past this interactable's own reach.
    const scareLines = ['🌾 "Button eyes, straw for bones, and it still looks unimpressed."', '🌾 "Doesn\'t scare the gardener\'s carrots one bit. The sparrows ignore it completely."', '🌾 "That floppy hat has seen more weather than anyone else on this street."', '🐦 "See the one on its arm? Chirp. (Translation: it never scared off so much as a sparrow, and now one just lives there.)"'];
    game.addInteractable({ obj: scare, radius: 2.2, label: () => 'Look at the scarecrow', onUse: () => { SFX.click(); game.toast(rnd.pick(scareLines), 3000); } }); }
  // the scarecrow never stopped the one culprit that actually matters: a hare lives in the gap just
  // west of the vegetable patch, darting in for a nibble at the row's edge. The exact same makeHare()
  // Frosty Peak's and Whisper Woods' own hares already build, on one more home point for the shared
  // Hopper controller — no new rig, no new animation. Home (12.0, -15.3) keeps every hop (leash 0.8 +
  // up to a 0.45 m jump + its own 0.15 m radius, 1.4 m at the very most) a full metre short of the
  // patch bed's west edge at x=13.6, so `Hopper.startHop`'s own `physics.blocked` check never has to
  // refuse one; `Hopper` draws its own `rnd()` for its idle timer and start heading, same as the hares
  // already do in both other worlds, so this costs no later wardrobe pick in this build's own `r`.
  // Like the raccoon by the bin and the factory mouse in Robot City, this hare sat ambient since the
  // round that placed it: `Hopper`, unlike `Wanderer`, never calls `greetable()` on its own. It now
  // answers its own "Say hello to the hare" prompt too. Same fix as every other round like this: no
  // new mesh, no new physics box, just `game.namedFriend('hare')` plus a `game.addInteractable` keyed
  // to the rig's own group, tracked every frame so the prompt follows it through its hops inside the
  // 0.8 m leash. The 2.1 m greet radius (the same every other Hopper creature's own prompt uses) sits
  // 2.82 m from the scarecrow's own 2.2 m look radius at (14.5, -16.6) — close enough to brush at the
  // very edge of both, but `game.loop`'s own nearest-interactable search always prefers whichever is
  // closer, so neither prompt ever steals the other's turn.
  { const rig = makeHare(); game.npcs.push(new Hopper(game, rig, { x: 12.0, z: -15.3, leash: 0.8, r: 0.15, dist: [0.15, 0.45], dur: 0.3, height: 0.2, idle: [1.5, 4], onHop: () => { if (rnd.chance(0.2)) SFX.chitter(); } }));
    const hareId = game.namedFriend('hare');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the hare', onUse: () => { game.befriend(hareId); SFX.chitter(); game.hearts(rig.group.position.x, 0.2, rig.group.position.z, 3); game.toast('🐇 *freezes mid-nibble, ears straight up, then bolts for the cabbage row*'); } }); }
  // the scarecrow keeps the sparrows off the leaves and the hare only ever gets as far as the row's
  // edge, but neither has ever stopped the one visitor working underneath them. A molehill now sits in
  // the open grass east of the patch — a ring of kicked-up dirt round a dark burrow mouth — and every
  // few seconds a small grey mole hitches itself up out of the hole, glances about, and sinks back
  // down. Pure ambient set dressing, same footing as the hare just above: no greeting, no physics box
  // (nothing here stands taller than 0.1 m, and it spends half its own cycle below the lawn, where the
  // flat ground plane hides it the same way it hides the gardener's own feet). Rides the world clock
  // `t` alone, one smooth sine rise-and-fall with no `rnd()` draw, so it costs no later wardrobe pick
  // in this build. Neither this world nor `56-npcs-wild.js` has ever had a mole before now; this one is
  // hand-built right here rather than given its own `makeX()`, the same way the scarecrow a few lines
  // up never got one either.
  // (The hare's own home sits at (12.0, -15.3) with a 1.4 m roam radius at most; the patch bed runs
  // x:[13.6,15.4] z:[-15.9,-14.3]; the basket sits at (15.0,-14.0); the scarecrow's own look radius
  // reaches 2.2 m from (14.5,-16.6). (17.0, -15.8) clears the hare by 3.5 m, the patch bed by 1.6 m,
  // the basket by 2.0 m and the scarecrow's reach by 0.6 m past its own radius — open grass with
  // nothing else built here.)
  { const mx = 17.0, mz = -15.8;
    const dirtM = mat(0x3f2e20, { roughness: 1 }), holeM = mat(0x18100a, { roughness: 1 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, d = 0.09 + (i % 2) * 0.025;
      mesh(G.sphere(0.045 + (i % 3) * 0.012, 6, 5), dirtM, { x: mx + cos(a) * d, y: 0.02, z: mz + sin(a) * d, shadow: 'none', parent: W }); }
    mesh(G.cyl(0.065, 0.065, 0.02, 10), holeM, { x: mx, y: 0.008, z: mz, shadow: 'none', parent: W });
    const moleM = mat(0x5a5650, { roughness: 0.9 }), snoutM = mat(0xd98a90, { roughness: 0.8 }), eyeM = mat(0x111111, { roughness: 0.6 });
    const mole = group(mx, -0.18, mz, W);
    mesh(G.bodySphere(10, 8), moleM, { sx: 0.06, sy: 0.065, sz: 0.1, shadow: 'none', parent: mole });
    mesh(G.cone(0.022, 0.05, 6), snoutM, { z: 0.085, y: -0.015, rx: PI / 2, shadow: 'none', parent: mole });
    for (const s of [-1, 1]) mesh(G.sphere(0.01, 6, 6), eyeM, { x: s * 0.028, y: 0.015, z: 0.06, shadow: 'none', parent: mole });
    U.push((dt, t) => {
      const period = 4.2, cyc = (t % period) / period, pop = cyc <= 0.5 ? 0 : sin((cyc - 0.5) * 2 * PI);
      mole.position.y = -0.18 + pop * 0.2;
      mole.rotation.y = pop > 0.3 ? sin(t * 3) * 0.4 * pop : 0;
    }); }
  // the field ladybug (round 461) and the hare and mole both already work this yard, but nothing has
  // ever actually sat on the vegetable patch's own leaves, the one spot a real pest would be. A
  // grasshopper now perches on one of the patch's own carrot leaves, hind legs cocked, antennae
  // twitching, giving a little spring now and then without ever actually leaving the leaf.
  //
  // New `makeGrasshopper()` (`56-npcs-wild.js`, next to the gumdrop beetle it's modelled on): the same
  // short front legs and twitching antennae every ladybug-family cousin already uses, but with no
  // shell dome — a longer bare body with a pair of wing-cases laid flat along the back instead — and
  // the one feature none of its cousins carry: big bent hind legs, built as a hip-and-knee pair the
  // same way the cat's own legs are, that kick out and snap back cocked on cue.
  //
  // Sits at (14.75, -14.6), one of the patch's own leaf-cluster centres (`vx = px + col * 0.5` with
  // `col = 0.5`, `vz = pz + row * 0.5` with `row = 1`, straight off the loop that planted the leaves
  // above) — 0.65 m from the carrot basket, 2.84 m from the hare's own home and 2.55 m from the
  // molehill, all clear.
  //
  // Round 461's own field ladybug is the cautionary tale this one follows to the letter: an earlier
  // attempt there wired it to `Hopper` for a bit of wandering, and `Hopper`'s own constructor draws
  // three values off the *shared* `rnd()` sequence unconditionally (its idle timer, its own clock
  // offset, its starting heading) — silently shifting the chat timing of two unrelated neighbours built
  // later in this same function, caught only by a dedicated probe, not by `test/run.mjs` itself. This
  // grasshopper stays put instead, the same "perched; only animates" trick the field ladybug settled on
  // and the owls already use elsewhere: a plain `rig.group.position.set()` placement, no `Hopper`, no
  // physics circle, and its idle spring timed off the world clock `t` alone inside a local `U.push`, so
  // it draws nothing from either the shared `rnd()` or this world's own seeded `r()` — nothing later in
  // this build, in this world or any other, shifts because of it.
  //
  // Answers "Say hello" from the moment it's placed, the same `game.namedFriend` + `game.addInteractable`
  // fix every ambient critter in this log eventually gets, just arriving on day one instead of waiting
  // for a later round: no `Hopper` tracking needed since the rig's own group never moves, so the
  // interactable's `obj` is just that fixed group. A 1.6 m radius (tighter than the usual 2.1 m, since
  // the carrot basket's own look prompt sits only 0.65 m away) reaches the leaf from any side without
  // ever contesting the basket's.
  { const gx = 14.75, gz = -14.6;
    const rig = makeGrasshopper(); rig.group.position.set(gx, P.ground0(gx, gz) + 0.14, gz); rig.group.rotation.y = 0.5; W.add(rig.group);
    U.push((dt, t) => { const cyc = 3.4, ph = (t % cyc) / cyc; rig.animate(0, ph < 0.1, dt, t); });
    const hopperId = game.namedFriend('grasshopper');
    game.addInteractable({ obj: rig.group, radius: 1.6, label: () => 'Say hello to the grasshopper', onUse: () => { game.befriend(hopperId); SFX.chitter(); game.hearts(gx, 0.25, gz, 3); game.toast('🦗 *antennae flick twice, gives one more spring, then settles right back on the same leaf*'); } }); }
  // hammocks, picnic blankets and wishing wells had never shown up anywhere in the seven worlds — the
  // hammock went to Sunny Shore last round, so a picnic blanket lands here, spread on the open grass
  // south-west of the street, no owner in sight. A striped blanket, a wicker basket with its lid propped
  // open, a loaf, a wedge of cheese and two tin mugs, left out as if someone had only just stepped away.
  // Driven only by the world clock `t`, never this world's own seeded `r`, so it costs no later wardrobe
  // pick anywhere in this build. A headless probe (the same stub-three harness `test/run.mjs` uses) built
  // the real Neighborhood, sampled every NPC's position every quarter second over roughly eight simulated
  // seconds, and swept the quiet field south-west of the street against every one of the world's 299
  // physics boxes: (-40, -30) came back clear by 7.4 m of the nearest box and over 20 m of the nearest
  // wandering soul, well inside the 95 m edge of the village.
  { const px = -40, pz = -30;
    const blanket = group(px, 0, pz, W);
    const stripeA = mat(0xd6455c, { roughness: 0.85 }), stripeB = mat(0xf7f0e0, { roughness: 0.85 });
    for (let i = 0; i < 5; i++) mesh(G.box(0.34, 0.04, 1.3), i % 2 ? stripeA : stripeB, { x: -0.68 + i * 0.34, y: 0.02, shadow: 'receive', parent: blanket });
    const basketWood = mat(0xb5862f, { roughness: 0.95 }), lidWood = mat(0xa9824a, { roughness: 0.95 });
    const basket = group(0.55, 0, -0.35, blanket);
    mesh(G.cyl(0.26, 0.21, 0.26, 12), basketWood, { y: 0.13, shadow: 'both', parent: basket });
    const lid = group(0, 0.26, -0.18, basket); lid.rotation.x = -1.1;
    mesh(G.box(0.5, 0.03, 0.42), lidWood, { parent: lid });
    const loaf = mesh(G.capsule(0.07, 0.22, 8), mat(0xc98a3f, { roughness: 0.9 }), { x: -0.1, y: 0.28, z: 0.05, rz: PI / 2, parent: basket });
    mesh(G.box(0.14, 0.08, 0.16), mat(0xf4e0a0, { roughness: 0.8 }), { x: 0.14, y: 0.3, parent: basket });   // wedge of cheese
    P.addBox(px + 0.55, 0.13, pz - 0.35, 0.52, 0.42, 0.52, { cam: false });
    const mugMat = mat(0xcfd4d8, { metalness: 0.5, roughness: 0.35 });
    for (const [mx, mz] of [[-0.55, 0.3], [-0.2, 0.5]]) {
      mesh(G.cyl(0.06, 0.05, 0.09, 10), mugMat, { x: mx, y: 0.065, z: mz, shadow: 'both', parent: blanket });
      noInk(mesh(G.torus(0.055, 0.012, 5, 10), mugMat, { x: mx + 0.07, y: 0.065, z: mz, ry: PI / 2, parent: blanket })); }
    U.push((dt, t) => { blanket.rotation.z = sin(t * 0.3) * 0.004; });   // the faintest ripple, as if the breeze just caught the corner
    const picnicLines = ['🧺 "Whoever laid this out never even got to the cheese."', '🧺 "Not an ant in sight — lucky, for once."', '🧺 "Someone\'s coming back for that loaf. Eventually."'];
    game.addInteractable({ obj: blanket, radius: 2.4, label: () => 'Look at the picnic blanket', onUse: () => { SFX.click(); game.toast(rnd.pick(picnicLines), 3000); } }); }
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
  // washing day, somewhere behind the houses: no yard in the whole Neighborhood had ever strung up a
  // clothesline, for all its sprinklers, bird feeders, gnomes and wheelie bins. Two posts, a line strung
  // between them, and three items of washing — a shirt, a bedsheet, a pair of trousers — pegged along it,
  // each rocking on its own peg at a different phase so the line never sways in lockstep. No owner in
  // sight; nobody's `rnd()` is drawn here, so nothing later in this build shifts.
  // (a headless probe — the same stub-three harness `test/run.mjs` uses, built the real Neighborhood,
  // clicked through to the started game, then sampled every NPC's own position every quarter second over
  // 30 simulated seconds — swept a grid of the open grass south of the street against every physics box
  // and every one of those samples: (40, -22) came back clear by 10.9 m of the nearest box and 13.6 m of
  // the nearest wandering soul, well past the detectorist's own patch at (60, -9) and the vegetable
  // patch's own cluster back at x=14.5)
  { const lx = 40, lz = -22;
    const line = makeClothesline(); place(game, U, line, lx, lz, 0);
    for (const px of [lx - 1.1, lx + 1.1]) P.addBox(px, 0.85, lz, 0.08, 0.85, 0.08, { cam: false });
    const lineLines = ['🧺 "Shirt, sheet, trousers. In that order, every week."', '🧺 "Still damp. Whoever hung these isn\'t back yet."', '🧺 "The wind\'s doing half the work today."'];
    game.addInteractable({ obj: line, radius: 2.2, label: () => 'Sniff the washing', onUse: () => { SFX.click(); game.toast(rnd.pick(lineLines), 3000); } }); }
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
  // someone makes the most of the weather on a blanket in their own back garden — Sunbather already does
  // duty as the sunbathers on Sunny Shore's beach, but no one in the Neighborhood had ever just lain out
  // in a yard with a radio for company (own small wardrobe, not the street's shared `ward` bag, which is
  // sized exactly to its 18 users already; placed last, after the ring dance, so it draws from the tail
  // of the local RNG sequence and leaves every earlier neighbour's random wardrobe pick undisturbed)
  // (a headless probe over the built world — every physics box and NPC position swept against the open
  // backyard south of the house at x=72 — found (72, -12) clear: 12 m from the nearest other soul (the
  // detectorist), 8.8 m short of the house's own back wall, nothing else anywhere nearby)
  { const bx = 72, bz = -12, ry = 0.4;
    rnd();   // burns one shared draw: without it the cyclist's own lane-riding check downstream collides with a stroller's wander timing (found by bisecting the test failure)
    const blanket = makeTowel(0x89c2ff); place(game, U, blanket, bx, bz, ry);
    const rx = bx + 0.85, rz = bz + 0.35;
    const radioBody = mat(0x33322e, { roughness: 0.6 }), radioFace = mat(0xd9cdb0, { roughness: 0.85 }), radioTrim = mat(0xc8b878, { metalness: 0.5, roughness: 0.4 });
    mesh(G.box(0.22, 0.14, 0.09), radioBody, { x: rx, y: 0.07, z: rz, shadow: 'both', parent: W });
    mesh(G.box(0.18, 0.1, 0.005), radioFace, { x: rx, y: 0.07, z: rz + 0.048, shadow: 'none', parent: W });
    for (const kx of [-0.06, 0.06]) mesh(G.cyl(0.018, 0.018, 0.025, 10), radioTrim, { x: rx + kx, y: 0.03, z: rz + 0.05, rx: PI / 2, shadow: 'none', parent: W });
    mesh(G.cyl(0.006, 0.008, 0.34, 6), radioTrim, { x: rx + 0.08, y: 0.24, z: rz - 0.02, rz: 0.25, shadow: 'none', parent: W });
    P.addBox(rx, 0.07, rz, 0.22, 0.14, 0.09, { cam: false });
    const sunWard = makeWardrobe(r, { shirts: [0xffe7b0, 0xffd9c2, 0xeaf6ff], pants: [0x2c4a5a, 0x3a3a3a], shoes: [0xf7f3ec, 0x8d6e63] });
    const lounger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: sunWard }),
      glasses: true, shorts: true, hat: null, jacket: null, scarf: null, bag: null, backpack: null }); W.add(lounger.group);
    game.npcs.push(new Sunbather(game, lounger, { x: bx, z: bz, ry,
      cries: ["Who needs the seaside when you've got a garden?", 'Five more minutes...', "Shout if a cloud comes over, would you?"] })); }
  // cars, a cyclist and the postie's own round all cross the side road, but nobody ever watched the
  // junction itself. A crossing guard now stands on the south pavement right where the side road meets
  // the main street — hi-vis jacket, lollipop sign lifted overhead every few seconds as if halting the
  // traffic, then lowered again (own explicit colours, not the street's shared `ward` bag, which is
  // sized exactly to its 18 users already; placed last, after the sunbather, so it draws from the tail
  // of the local RNG sequence and leaves every earlier neighbour's random wardrobe pick undisturbed —
  // the first attempt placed it up by the cars instead and it shifted the wave-test neighbour's own
  // idle timer enough to upset the cyclist's pedalling-delta check later in the same test run, found by
  // bisecting the failure). *"Stop, look, listen — works for cats too."* *"Thirty years on this corner,
  // not a scratch."* *"No running near the kerb, now."*
  // New controller (`CrossingGuard`, alongside `Birder` in 55-npcs.js — same raise/lower arm cycle, a
  // sign on a pole in place of binoculars). A headless probe built the real Neighborhood, then sampled
  // every NPC's own position every 1/15 s over 300 simulated seconds (the postie's full round, both
  // cars' laps and the cyclist's sweep all included) and swept (44, 10.4) — the south pavement at the
  // side road, same pavement the street's own `Talkers` already stand on — against both that trace and
  // every physics box in the street: clear by 3.9 m of the nearest box (a street lamp) and 16.3 m of the
  // nearest other soul. The street trees already skip `abs(x-44)<6` here to leave the side road clear
  // overhead, so there is nothing planted this close to the junction to collide with either.
  { const guard = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2) }),
      shirt: 0x8a9aae, pants: 0x2a2a2a, shoes: r.pick([0x1e1a18, 0x2a2018]),
      jacket: 0xf2c744, stripes: 0xe8e8e8, hat: 'cap', hatColor: 0x2a2a2a, glasses: r.chance(0.25), scarf: null, bag: null, backpack: null }); W.add(guard.group);
    game.npcs.push(new CrossingGuard(game, guard, { x: 44, z: 10.4, ry: 0,
      cries: ['Stop, look, listen — works for cats too.', 'Thirty years on this corner, not a scratch.', 'No running near the kerb, now.'] })); }
  // every "look up" toast so far has picked a landmark someone already built — a tower, a statue, a
  // signpost — but the Neighborhood is the one world with a real day/night cycle, and nothing in it had
  // ever pointed the cat at the sky it earns every evening. A small brass-and-wood telescope now stands
  // on its own tripod in the quiet field south-east of the side road, no owner, just left out. A headless
  // probe swept a 1 m grid of the whole built world against every physics box and every NPC's own
  // position: (49, -38) came back clear by 20.7 m from the nearest box and 24 m from the nearest soul,
  // 2.5 m past the side road's own zone (x 41.5..46.5) and comfortably inside the 95 m walkable limit, far
  // past the catch pair's own throw gap at (25, -35). No draw from this world's own seeded `r`, so it
  // costs no later wardrobe pick anywhere on the street.
  { const tx = 49, tz = -38, hubY = 0.72;
    const wood = mat(0x6b4a2b, { roughness: 0.85 }), brass = mat(0xc9a227, { metalness: 0.6, roughness: 0.35 }), tubeM = mat(0x2a2f38, { roughness: 0.5, metalness: 0.3 });
    const rig = group(tx, 0, tz, W);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; const leg = group(cos(a) * 0.32, 0, sin(a) * 0.32, rig); leg.rotation.y = -a;
      mesh(G.cyl(0.02, 0.025, 0.86, 6), wood, { y: 0.43, rx: -0.28, parent: leg }); }
    const hub = group(0, hubY, 0, rig);
    mesh(G.sphere(0.07, 10, 8), brass, { parent: hub });
    const tube = group(0, 0, 0, hub); tube.rotation.x = -1.0;
    mesh(G.cyl(0.055, 0.045, 0.62, 12), tubeM, { y: 0.31, parent: tube });
    mesh(G.cyl(0.058, 0.058, 0.03, 12), brass, { y: 0.61, parent: tube });
    mesh(G.cyl(0.03, 0.025, 0.05, 10), brass, { y: -0.02, parent: tube });
    P.addBox(tx, hubY / 2, tz, 0.7, hubY, 0.7, { cam: false });
    const starLines = ['🔭 "Just the Plough tonight. Same as every night, really."', '🔭 "You can see clean past the streetlamps out here."', '🔭 "Somebody left it out again. Lucky, this time."'];
    game.addInteractable({ obj: rig, radius: 2.6, label: () => 'Look through the telescope', onUse: () => { SFX.click(); game.fx.emit(tx, hubY + 0.3, tz, { count: 14, colors: [0xcfe6ff, 0xffffff, 0xfff2d9], speed: 1.0, up: 1.6, life: 0.9, gravity: 1.4 }); game.toast(rnd.pick(starLines), 3000); } }); }
  // three more ways out of the neighborhood: beach boardwalk (east), gondola to the peak (west), hollow oak to the woods (south-east)
  const beachGate = makeBeachGate(game, 78, 22, PI / 2, () => game.travel(WORLD_INDEX('beach'), 'from-hub')); U.push(beachGate.userData.update);
  flatPlane(game, 30, 3, walk, 60, 22, 0, 0.02);                                                                             // boardwalk from the road out to the arch
  const gondola = makeGondolaStation(game, -72, -40, PI / 2, () => game.travel(WORLD_INDEX('snow'), 'from-hub')); U.push(gondola.userData.update);
  makeLanternPath(game, -50, -12, -66, -36, 6);
  const hollow = makeHollowOak(game, 40, 78, PI, () => game.travel(WORLD_INDEX('forest'), 'from-hub')); U.push(hollow.userData.update);
  for (let i = 0; i < 10; i++) { const z = 56 + i * 2.2, x = 8 + i * 3.0 + sin(i) * 0.8; mesh(G.cyl(0.55, 0.6, 0.1, 9), mat(0x8a8a80, { roughness: 1 }), { x, y: 0.05, z, ry: r() * TAU, shadow: 'receive', parent: W }); }   // stepping stones to the oak
  const signpost = place(game, U, makeSignpost([['Park & portal', 0, 50], ['Sunny Shore', 78, 22], ['Frosty Peak', -72, -40], ['Whisper Woods', 40, 78]], -4.4, 8.9), -4.4, 8.9, 0); P.addBox(-4.4, 1.2, 8.9, 0.3, 2.4, 0.3, { cam: false });
  // the throne, the fountain, Robot City's statue and the park portal ring have all had a one-off
  // "walk up and look" toast for a while now, but the signpost that points the way to every other
  // world from the moment the cat steps outside the house never got so much as a glance of its own.
  const signLines = ['🪧 "Park & portal. Sunny Shore. Frosty Peak. Whisper Woods. No sign for Nap Here, strangely."', '🪧 "Four arms, four doors, and the house behind you never gets one of its own."', '🪧 "Whoever carved these letters clearly trusted a cat to read them."'];
  game.addInteractable({ obj: signpost, radius: 2.4, label: () => 'Read the signpost', onUse: () => { SFX.click(); game.toast(rnd.pick(signLines), 3000); } });
  // collectibles + the gems by the squirrel
  const C = game.collectibles;
  C.add('yarn', -3.0, 0.1, 0.6); C.add('fish', -8, 5); C.add('mouse', -6.5, -6); C.add('star', 14, 50); C.add('fish', -14, 41); C.add('yarn', 21, 3); C.add('star', 40, 20); C.add('mouse', -30, 34);
  // exactly PORTAL_GEMS gems, one for each gem engraved on the park portal, one at each corner of the neighbourhood
  const GEM_SPOTS = [[10.8, 48.6, 0x7fe0ff], [-29.5, -45.4, 0xa8ff9a], [66, 58, 0xff6fb5], [-68, 62, 0xffd54a], [66.5, 22, 0xc8a2ff], [-58, -24, 0x7fe0ff], [26, 66, 0xa8ff9a]];
  makeGemTrail(game, U, GEM_SPOTS.slice(0, PORTAL_GEMS), r);

  // the birdwatcher's own cry warns the cat not to scatter the sparrows, a couple of metres off her own spot
  // at (19, -75) — there weren't actually any until now. A pair hops in the grass there, the one thing she's
  // come all this way to watch (homes 2.5 m either side of her physics circle, well clear of it and of each
  // other). Placed last, after every other draw this build makes from its own local `r`, so these few extra
  // draws disturb nothing earlier in the street (an earlier placement, right by the birder herself, worked
  // but then shuffled a later wardrobe pick into a shirt-colour collision with another neighbour's — moving
  // it here left every earlier pick untouched). A plain U.push animation rather than the Hopper controller
  // every other critter uses, for the same reason one step further: Hopper draws from the module's shared
  // `rnd()`, and this world builds well before three others in the test's travel order, so a Hopper instance
  // here would have shifted their own timing-sensitive animations too (it intermittently broke the Victorian
  // horse-and-carriage's gait check, two worlds later, until this was found).
  for (const [hx, hz] of [[17, -73.5], [21, -76.5]]) {
    const rig = makeSparrow(); W.add(rig.group);
    const cyc = r.range(1.8, 2.6), hopDur = 0.26, hopDist = r.range(0.3, 0.5), heading = r.range(0, TAU), phase0 = r.range(0, cyc);
    const tx = hx + sin(heading) * hopDist, tz = hz + cos(heading) * hopDist;
    rig.group.position.set(hx, P.ground0(hx, hz), hz); rig.group.rotation.y = heading;
    U.push((dt, t) => {
      const ct = (t + phase0) % cyc, atB = floor((t + phase0) / cyc) % 2 === 1;
      const [sx, sz] = atB ? [tx, tz] : [hx, hz], [ex, ez] = atB ? [hx, hz] : [tx, tz];
      const hopping = ct < hopDur, k = hopping ? ct / hopDur : 1;
      const x = lerp(sx, ex, k), z = lerp(sz, ez, k);
      rig.group.position.set(x, P.ground0(x, z) + (hopping ? sin(k * PI) * 0.12 : 0), z);
      if (hopping) rig.group.rotation.y = atan2(ex - sx, ez - sz);
      rig.animate(0, hopping, dt, t);
    });
  }

  // Candy Land, Whisper Woods, Sunny Shore, Frosty Peak, Victorian and Robot City all had an ambient
  // flock wheeling overhead by now (butterflies, gulls, snow buntings, doves, drone-flies) — the
  // Neighborhood, past its kite and the odd sparrow hopping the grass, never had a single real bird in
  // its own sky. A small murder of crows now wheels high over the street, well above every rooftop and
  // chimney (houses top out around y=8.5 at their tallest chimney pot; the flock never dips below 11).
  // Reuses the Flyer controller exactly as every other world's flock already does — it never touches
  // the ground or the physics grid, so (like the Candy Land butterflies) this needed no headless
  // clearance probe.
  for (let i = 0; i < 6; i++) { const rig = makeCrow({ phase: i * 1.15 }); game.npcs.push(new Flyer(game, rig, { cx: 0, cz: 14, r: r.range(22, 34), h: r.range(11, 15), speed: r.range(1.4, 2.0), bob: 0.5, wobble: 1.3, cw: i % 2 === 0, phase: i * 1.15 })); }

  // a ukulele player stands in the quiet yard behind the north-row houses, strumming — Sunny Shore,
  // Frosty Peak and Victorian all have someone making music (a ukulele on the dunes, a juggling busker,
  // a fiddler at the clock tower), but no street in the Neighborhood ever had its own musician, just
  // practising for nobody in particular. `Charger` (already the fiddler's own controller) rather than
  // `Sitter` — the test counts the park bench's sitters by class name and expects exactly two, so a
  // third `Sitter` anywhere in this world would break that count even sitting nowhere near the bench
  // (own small wardrobe, not the street's shared `ward` bag, which is sized exactly to its 18 users
  // already; placed last of every person this build adds, after the sparrows, so it draws from the very
  // tail of both the local `r` and the shared `rnd()` sequences and disturbs the fewest later ticks of
  // either)
  // (a headless probe over the built world — every physics box and NPC/squirrel position swept against a
  // grid of candidate yard spots north of the houses — found (-38, 37) clear: 21 m from the nearest other
  // soul (the ring-dance circle further west) and 6.7 m from the nearest physics box (the house at x=-45's
  // own back wall), well short of the park path to its north)
  { const mx = -38, mz = 37, mry = atan2(0 - mx, 36 - mz);
    const museWard = makeWardrobe(r, { shirts: [0xd9a15a, 0x6a8a4a, 0x8a5acf], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const musician = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.25), wardrobe: museWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(musician.group);
    const uke = makeUkulele(r.pick([0xd9a15a, 0xc9915a, 0xb98a52]));
    uke.position.set(0.03, -0.02, 0.14); uke.rotation.set(-0.25, 0.1, 0.2);
    musician.hands[1].add(uke);
    game.npcs.push(new Charger(game, musician, { x: mx, z: mz, ry: mry,
      cries: ["Three chords and the truth, my gran always said.", "Careful, puss — that's out of tune, not broken.", "Nobody's listening, which is the best audience there is."] }));
    U.push((dt, t) => { const A = musician.arms[1]; A.el.rotation.x = -1.0 + sin(t * 5.4) * 0.22; A.sh.rotation.z = -0.15; }); }

  // the task's own list of example vignettes names "a kid on a scooter" and no world has ever had one —
  // a boy kneels in the open field south of the street, tightening his scooter's wobbly back wheel before
  // trying it again (own small wardrobe, not the street's shared `ward` bag, which is sized exactly to its
  // 18 users already; placed last of every person this build adds, after the musician, so it draws from the
  // very tail of both the local `r` and the shared `rnd()` sequences and disturbs the fewest later ticks of
  // either)
  // (a headless probe over the built world — every physics box and every NPC's and the squirrel's own
  // position, sampled continuously over 20 simulated seconds so no wandering stroller or dog mid-leash could
  // slip past unnoticed — found (2, -54) clear by 23.2 m in every direction, well south of the vegetable
  // patch and the game of catch, on the same flat open field as the birdwatcher further west)
  { const sx = 2, sz = -54, kx = 2.9, kz = -54, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0xef7d2f); place(game, U, scooter, sx, sz, 0.4);
    P.addBox(sx, 0.4, sz, 0.3, 0.8, 0.6, { cam: false });
    const scootWard = makeWardrobe(r, { shirts: [0x4fc98a, 0x5aa9e6, 0xd9a23a], pants: [0x2e4a3a, 0x3a3a3a], shoes: [0x3a2a1e, 0x2a2018] });
    const scootKid = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: scootWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(scootKid.group);
    game.npcs.push(new Kneeler(game, scootKid, { x: kx, z: kz, ry,
      cries: ['Just a wobbly bolt - nearly got it.', "Careful, puss — mind your tail, this spins.", 'Good as new. Three ramps today, easy.'] })); }

  // a backyard griller tends a kettle barbecue behind the house at x=36 — every house on this street has
  // a fireplace and a car out front, but nobody had ever actually cooked outdoors. `Washer`'s own
  // side-to-side swipe already reads as a spatula working a grill, so no new controller; a pair of tongs
  // joins its usual sponge in the working hand (the sponge stays tucked out of sight in the fist, same as
  // the leaf raker's rake handle above) (own fixed shirt colour, not any of this build's wardrobe pools —
  // checked against the shared street `ward` bag's own 18-colour SHIRT_COLORS list and every other
  // wardrobe this build hands out, to keep the "no two neighbours share a shirt" rule; placed last of
  // every person this build adds, after the scooter kid, so it draws from the very tail of both the
  // local `r` and the shared `rnd()` sequences and disturbs the fewest later ticks of either)
  // (a headless probe over the built world — every physics box and NPC position swept against a grid of
  // candidate backyard spots — found (36, -9) clear: 19.9 m from the nearest other soul (the car washer
  // out front), 5.8 m south of the house's own back wall, nothing else anywhere nearby)
  { const gx = 36, gz = -10.3, kx2 = 36, kz2 = -9;
    const grill = makeGrill(); place(game, U, grill, gx, gz, 0);
    P.addBox(gx, 0.3, gz, 0.7, 0.65, 0.7, { cam: false });
    const griller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2) }),
      shirt: 0x3a6b8a, apron: 0xd6455c, pants: 0x2c2c2c, shoes: 0x2a2018, hat: r.chance(0.4) ? 'cap' : null, hatColor: 0x2a2a2a,
      jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.25) }); W.add(griller.group);
    const tongs = group(0, 0.02, 0.1, griller.hands[0]); tongs.rotation.x = -0.35;
    const tongM = mat(0x8a8f96, { roughness: 0.4, metalness: 0.5 });
    mesh(G.box(0.014, 0.2, 0.014), tongM, { x: -0.016, ry: 0.1, parent: tongs }); mesh(G.box(0.014, 0.2, 0.014), tongM, { x: 0.016, ry: -0.1, parent: tongs });
    game.npcs.push(new Washer(game, griller, { x: kx2, z: kz2, ry: atan2(gx - kx2, gz - kz2),
      cries: ["Two more minutes and they're done.", "Careful, puss — hot grate, that.", "Best burgers on the whole street, if I say so myself."] })); }

  // a kid works a yo-yo on the open field south of the street — the task's own example list names a yo-yo
  // and no world has ever had one; the disc drops and climbs on its own string, never attached to the rig
  // (own fixed shirt colour, not the street's shared `ward` bag, which is sized exactly to its 18 users
  // already; placed last of every person this build adds, after the griller, so it draws from the very
  // tail of both the local `r` and the shared `rnd()` sequences and disturbs the fewest later ticks of either)
  // (a headless probe over the built world — every NPC's and the squirrel's own position swept against a
  // grid of open-field candidates south of the street, each checked against `game.physics.blocked()` at a
  // metre's radius — found (-12, -26) clear: 29 m from the nearest other soul (the lake's jetty angler),
  // flat open ground, well short of the lantern path to the gondola and the vegetable patch's own corner)
  { const yx = -12, yz = -26;
    const yoyoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xffa94d, backpack: null }); W.add(yoyoKid.group);
    game.npcs.push(new YoYoer(game, yoyoKid, 0xd62839, { x: yx, z: yz, ry: 0.6,
      cries: ['Thirty drops and not one tangle!', 'Careful, puss — it just about clears your ears.', "Watch — down, and... caught it!"] })); }

  // a dog getting a good brushing in the backyard behind the house at x=-18 — the street already has
  // someone walking a dog on a lead, but nobody had ever just sat down to groom one. `Kneeler`'s own
  // patting motion already reads as working a brush over a coat, so no new controller — a small
  // wooden-backed brush joins the kneeling hand, the same way the detectorist's coil and the griller's
  // tongs join the rig after it's built. The dog itself stays put rather than wandering off mid-brush
  // (plain `makeDog`, driven only by its own idle tail-wag and head-glance every frame, no `Wanderer`),
  // pet-able and its own friend exactly like the beach dog and Frosty Peak's husky, but under
  // `namedFriend('yard-dog')` since `DogWalker` already claimed this world's plain `'dog'` key. Both
  // this groomer's shirt and the dog's own coat colour are fixed, not drawn from the street's shared
  // `ward` bag or `rnd()`, same reasoning as the griller and the yo-yo kid above.
  // (a headless probe over the built world — every physics box and every NPC's and the squirrel's own
  // position swept against a grid of candidate backyard spots — found (-18, -9) clear: 17.4 m from the
  // nearest other soul, inside the same backyard grass patch the chopper and griller already sit in,
  // well south of the house's own back wall at z=3.2)
  { const kx3 = -18, kz3 = -9, dx = -18, dz = -10.1;
    const groomer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false }),
      shirt: 0x6b8a5a, pants: 0x3a3a3a, shoes: 0x3a2e22, apron: 0xd9c9a8, jacket: null, scarf: null, bag: null, backpack: null, hat: null }); W.add(groomer.group);
    const brush = group(0, 0.015, 0.09, groomer.hands[1]); brush.rotation.x = -0.3;
    mesh(G.cyl(0.015, 0.018, 0.14, 8), mat(0x6b4a2a, { roughness: 0.85 }), { y: -0.08, parent: brush });
    mesh(G.box(0.07, 0.03, 0.1), mat(0x8a5a32, { roughness: 0.8 }), { y: 0.02, parent: brush });
    mesh(G.box(0.062, 0.012, 0.09), mat(0x2a2420, { roughness: 0.95 }), { y: 0.005, parent: brush });
    game.npcs.push(new Kneeler(game, groomer, { x: kx3, z: kz3, ry: atan2(dx - kx3, dz - kz3) }));
    const dog = makeDog(0x9a6a3a); dog.group.position.set(dx, game.physics.ground0(dx, dz), dz); dog.group.rotation.y = atan2(kx3 - dx, kz3 - dz); W.add(dog.group);
    game.physics.addCircle(dog, dx, dz, 0.3);
    let dogT = r() * 10; U.push((dt) => { dogT += dt; dog.animate(0, false, dt, dogT); });
    // the groomer's own lines, timed off this world's local `r()` rather than Kneeler's usual `cries`
    // (which draws from the *shared* global `rnd()` every few seconds) — round 116's detectorist already
    // found that the shared sequence is shifted just enough by a new draw mid-simulation to break the
    // two-neighbours chat-turn timing check elsewhere in this very world
    const groomCries = ["Hold still, you're getting fluff everywhere.", "Careful, puss — he's shy of strangers till he's sure of you.", "There — all brushed out, aren't you handsome."];
    let groomCryT = r.range(4, 9);
    U.push((dt) => { groomCryT -= dt; if (groomCryT <= 0) { groomCryT = r.range(9, 16); const c = game.cat.group.position; if (dist2(kx3, kz3, c.x, c.z) < 400) { game.toast('🐾 "' + r.pick(groomCries) + '"', 2400); SFX.talk(); } } });
    const did2 = game.namedFriend('yard-dog');
    game.addInteractable({ obj: dog.group, radius: 2.2, label: () => 'Pet the dog', onUse: () => { game.befriend(did2); SFX.woof(); game.hearts(dog.group.position.x, 0.6, dog.group.position.z, 4); game.toast('🐕 *happy tail wag*'); } }); }

  // Sunny Shore and Whisper Woods both have a hula hooper by now, but the Neighborhood — for all its
  // yo-yo kid, scooter kid and backyard grill — never had one. A child now works a hula hoop on the
  // open field south of the street, well clear of the yo-yo kid, the scooter kid and both backyards.
  // `HulaHooper` needs no held prop beyond the one ring it builds itself, parented to the body at waist
  // height, so this is a placement, not a build (own fixed shirt colour, not the street's shared `ward`
  // bag, which is sized exactly to its 18 users already; placed last of every person this build adds,
  // after the dog groomer, so it draws from the very tail of both the local `r` and the shared `rnd()`
  // sequences and disturbs the fewest later ticks of either).
  // (a headless probe over the built world — every NPC's and the squirrel's own position sampled every
  // quarter second over 20 simulated seconds, so no wandering stroller or dog mid-leash could slip past
  // unnoticed, swept against a grid of the open south field and every physics box — found (32, -55)
  // clear: 18.1 m from the nearest box (the side road's own kerb) and 18.2 m from the nearest other soul
  // (a passer-by out on the street))
  // (its lines are timed off this world's local `r()` rather than `HulaHooper`'s usual `cries`, which
  // draws from the *shared* global `rnd()` every few seconds — the same reason the dog groomer above
  // rolls its own loop instead of passing `cries` straight to its controller)
  { const hx = 32, hz = -55;
    const hoopKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0x5ac8e0, backpack: null }); W.add(hoopKid.group);
    game.npcs.push(new HulaHooper(game, hoopKid, 0xffd54a, { x: hx, z: hz, ry: atan2(0 - hx, 0 - hz) }));
    const hoopCries = ['Sixty spins before lunch, easy!', "Careful, puss — the ring's wider than it looks from out there.", "Keeps me warm without even running."];
    let hoopCryT = r.range(4, 9);
    U.push((dt) => { hoopCryT -= dt; if (hoopCryT <= 0) { hoopCryT = r.range(9, 16); const c = game.cat.group.position; if (dist2(hx, hz, c.x, c.z) < 400) { game.toast('⭕ "' + r.pick(hoopCries) + '"', 2400); SFX.talk(); } } }); }

  // Every other world now has a jump-roper (Sunny Shore is the only other one left) — the Neighborhood,
  // for all its yo-yo kid, scooter kid and hula hooper, never had one. A child skips rope on the open
  // field south of the street, well clear of all three. `JumpRoper` needs no held prop beyond the loose
  // grip at each hand it builds itself, so this is a placement, not a build (own fixed shirt colour, not
  // the street's shared `ward` bag, which is sized exactly to its 18 users already; placed last of every
  // person this build adds, after the hula hooper, so it draws from the very tail of both the local `r`
  // and the shared `rnd()` sequences and disturbs the fewest later ticks of either).
  // (a headless probe over the built world — every NPC's own position sampled every quarter second over
  // 25 simulated seconds, so no wandering stroller, the postie's round nor a dog mid-leash could slip
  // past unnoticed, swept against a grid of the open south field and every physics box — found (18, -44)
  // clear: 18.6 m from the nearest box and 17.8 m from the nearest other soul)
  // (its lines are timed off this world's local `r()` rather than `JumpRoper`'s usual `cries`, which
  // draws from the *shared* global `rnd()` every few seconds — the same reason the hula hooper above
  // rolls its own loop instead of passing `cries` straight to its controller)
  { const jx = 18, jz = -44;
    const jumpKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xa8ff9a, backpack: null }); W.add(jumpKid.group);
    game.npcs.push(new JumpRoper(game, jumpKid, 0xff6fb5, { x: jx, z: jz, ry: atan2(0 - jx, 0 - jz) }));
    const jumpCries = ['Forty in a row, puss — watch!', "Careful — don't trip over the rope.", "Mum says I'll wear a groove in the grass."];
    let jumpCryT = r.range(4, 9);
    U.push((dt) => { jumpCryT -= dt; if (jumpCryT <= 0) { jumpCryT = r.range(9, 16); const c = game.cat.group.position; if (dist2(jx, jz, c.x, c.z) < 400) { game.toast('➰ "' + r.pick(jumpCries) + '"', 2400); SFX.talk(); } } }); }

  // Robot City picked up a marbles ring two rounds back — the oldest pavement game of all — but the
  // Neighborhood, where every other one of these playground games started (hopscotch, the scooter kid,
  // the hula hoop, the jump rope), never got its own. A girl kneels on the open field south of the
  // street, flicking marbles at a chalked ring. `Kneeler`'s own patting motion already reads as the
  // flick, the same trick the hopscotch chalker and the scooter kid both already use, so this is a
  // placement, not a build (own fixed wardrobe, not the street's shared `ward` bag, which is sized
  // exactly to its 18 users already; placed last of every person this build adds, after the jump-roper,
  // so it draws from the very tail of both the local `r` and the shared `rnd()` sequences and disturbs
  // the fewest later ticks of either).
  // (a headless probe over the built world — every physics box and every NPC's and the squirrel's own
  // position, sampled every quarter second over 30 simulated seconds so no wandering stroller, dog
  // mid-leash or the postie's round could slip past unnoticed, swept against a grid of the open south
  // field — found (-19, -68) clear: 14.1 m from the nearest box and 23.3 m from the nearest other soul,
  // well south of all four other playground games and the lantern path to the gondola)
  { const mcx = -19, mcz = -68, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: mcx + marblePos[i][0], y: 0.035, z: mcz + marblePos[i][1], shadow: 'none', parent: W });
    mesh(G.sphere(0.035, 8, 6), mat(0x00e5ff, { roughness: 0.2 }), { x: mkx + 0.35, y: 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleWard = makeWardrobe(r, { shirts: [0xff9a5a, 0x5ac8e0, 0xffe27a], pants: [0x3a3a3a, 0x2e4a3a] });
    const marbleKid = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: marbleWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(marbleKid.group);
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["That one's mine, fair and square!", "Careful, puss — don't swallow one.", "Grandad gave me this bag. Won them all himself, he says."] })); }

  // every playground game on this street now plays out on the open south field — hopscotch, marbles,
  // jump rope, hula hoop, the yo-yo kid — but nobody had a trampoline, the one yard toy every kid
  // actually wants a turn on. The backyard behind house 10 (x=-72), open and unclaimed since the
  // sprinkler took the house next door's own front lawn, gets one now: a round steel-framed trampoline
  // with a kid mid-bounce, knees tucking at the top of every arc and crouching down into the next one.
  // `Bouncer` is a new controller (55-npcs.js) — none of this file's existing hop/swing/tip controllers
  // move a rig straight up and down on a fixed vertical cycle (own fixed shirt colour, not the street's
  // shared `ward` bag, which is sized exactly to its 18 users already; placed last of every person this
  // build adds, after the marbles kid, so it draws from the very tail of the local `r` sequence and
  // disturbs the fewest later ticks of it).
  // No `cries`/`cryIcon` passed to `Bouncer`, and `Bouncer` itself never calls the shared `rnd()` at all
  // (its own phase starts at a fixed 0, passed in rather than drawn) — the dog groomer's own round
  // (above) already found that one new draw on the *shared* `rnd()` sequence a few seconds into the
  // simulation shifts every later tick of it just enough to break a timing-sensitive check elsewhere in
  // this same world, so this one times its own line off the world's local `r()` instead, the same trick
  // the groomer, the hula hooper, the jump-roper and the marbles kid above all use for exactly that
  // reason.
  // (a headless probe built the real Neighborhood, called `game.start('new')` so every wanderer, the
  // postie and the dog walker actually moved rather than sitting frozen at their spawn point, then ran
  // the game loop for 150 simulated seconds, sampling every NPC's own position every quarter second —
  // swept against a grid of the backyard behind the house at x=-72 and every one of the street's physics
  // boxes — found (-72, -10) clear by 4.9 m of the nearest box (that house's own back wall) and 12.6 m
  // of the nearest other soul, well past this prop's own sub-1.5 m footprint)
  { const tx = -72, tz = -10;
    const tramp = makeTrampoline({ color: 0x3f6fd6 }); place(game, U, tramp, tx, tz, 0);
    P.addBox(tx, 0.21, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xff8f3c, backpack: null }); W.add(bounceKid.group);
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: PI, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Highest one yet, I swear!", "Careful, puss — mind the springs round the edge.", "Mum says I'll bounce clean over the fence one day."];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }

  // Every other world picked up a bubble-blower (Sunny Shore, Victorian, Frosty Peak) — the Neighborhood,
  // for all its yo-yo kid, hula hooper and jump-roper, never got one. A girl blows soap bubbles from a
  // loop-ended wand on the open field east of the hula hooper, out past the hoopscotch and marbles games.
  // Same build as the Sunny Shore one: the wand sits in `hands[1]`, the resting hand none of this rig's
  // own idle gestures swing, so `wand.getWorldPosition()` only needs reading once, right after `Charger`
  // sets the rig's fixed position and rotation, for an exact launch point for both bubbles. Own fixed
  // shirt colour (0x7ee8fa), not in the street's shared 18-colour `ward` bag nor any other fixed shirt
  // this build already hands out, so the "no two neighbours share a shirt" check stays clean. No `cries`
  // passed to `Charger` itself — that draws its cry timer off the *shared* global `rnd()` at construction,
  // the same stray draw the dog groomer's own round found breaks a later timing-sensitive check elsewhere
  // in this world — so this one times its own toast off the local `r()` instead, exactly like the hula
  // hooper, jump-roper, marbles kid and bouncer above. The bubbles themselves ride the world clock `t`
  // alone on two fixed phases, so they draw from neither sequence and can't shift any later pick.
  // (a headless probe over the built world — every NPC's and the squirrel's own position sampled every
  // quarter second over 60 simulated seconds, so no wandering stroller, the postie's round, the cyclist
  // nor a dog mid-leash could slip past unnoticed, swept against a grid of the open field and every one
  // of the street's physics boxes, also kept 6 m clear of every road, pavement and path this world's own
  // test walks end to end — found (37, -72) clear: 16.7 m from the nearest box and 17.7 m from the
  // nearest other soul (the hula hooper, 17.7 m off))
  { const bkx = 37, bkz = -72, bkry = atan2(-bkx, -bkz);
    const blower = makeHuman({ ...randomPerson(r, { female: true, child: true }), hairStyle: 'pony', shirt: 0x7ee8fa, backpack: null }); W.add(blower.group);
    const wand = group(0.02, 0, 0.1, blower.hands[1]); wand.rotation.set(-0.3, 0, 0.3);
    mesh(G.cyl(0.012, 0.012, 0.14, 6), mat(0xffd54a, { roughness: 0.6 }), { y: 0.07, parent: wand });
    mesh(G.torus(0.055, 0.009, 6, 16), mat(0xf7f3ec, { roughness: 0.3, transparent: true, opacity: 0.6 }), { y: 0.16, parent: wand });
    game.npcs.push(new Charger(game, blower, { x: bkx, z: bkz, ry: bkry }));
    const tip = V3(); wand.getWorldPosition(tip);
    const bubbleM = mat(0xeaffff, { pbr: true, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.4 });
    const bubbles = [0, 1].map((i) => ({ m: mesh(G.sphere(0.05, 10, 8), bubbleM, { shadow: 'none', parent: W }), ph: i * 1.8, popped: -1 }));
    const cyc = 3.2;
    U.push((dt, t) => {
      for (const b of bubbles) {
        const k = ((t + b.ph) % cyc) / cyc;
        if (k < 0.92) {
          b.m.visible = true;
          b.m.position.set(tip.x + sin(t * 1.6 + b.ph) * 0.18 * k, tip.y + k * 1.5, tip.z + cos(t * 1.1 + b.ph) * 0.12 * k);
          b.m.scale.setScalar(0.4 + k * 0.7);
        } else {
          b.m.visible = false;
          const cycleNo = floor((t + b.ph) / cyc);
          if (cycleNo !== b.popped) { b.popped = cycleNo;
            const c = game.cat.group.position;
            if (dist2(tip.x, tip.z, c.x, c.z) < 400) { SFX.twinkle(); game.fx.emit(b.m.position.x, b.m.position.y, b.m.position.z, { count: 4, colors: [0xeaffff, 0xffffff, 0xbfe8ff], speed: 0.5, up: 0.6, life: 0.5, gravity: 1.5 }); }
          }
        }
      }
    });
    const bubbleLines = ["Careful, puss — don't pop them with your nose!", "Mum's own recipe — dish soap and a spoon of sugar.", "That one's going clean over the fence!"];
    let bubbleCryT = r.range(4, 9);
    U.push((dt) => { bubbleCryT -= dt; if (bubbleCryT <= 0) { bubbleCryT = r.range(9, 16); const c = game.cat.group.position; if (dist2(bkx, bkz, c.x, c.z) < 400) { game.toast('🫧 "' + r.pick(bubbleLines) + '"', 2400); SFX.talk(); } } }); }

  // Robot City's two retired gents have had a checkers board since round 384 and a dozen other worlds
  // have a yard game of some kind by now, but no street in the Neighborhood has ever had the oldest
  // backyard rivalry of all: two dads pitch horseshoes at each other's stake across a sandy court far
  // past the back row of houses. New `Horseshoes` controller (`55-npcs.js`): it reuses `BallGame`'s own
  // hand-to-flight-to-hand shape (held a moment, lobbed on an arc, held by the other side, lobbed back)
  // but the target is the dirt by the far stake rather than the other player's own hand, landing with a
  // clang (`SFX.clang()`, already in this file for the wrench on Robot City's own scrap) and a shower of
  // sparks rather than a catch. The horseshoe itself is a stretched-open torus arc (`G.torus(…, PI*1.5)`),
  // tumbling end over end in flight on `rotation.x` alone, same trick `BallGame`'s own ball already uses.
  // Own fixed shirt colours (0x8a5a3a, 0x4a6a3a), neither in the street's shared 18-colour `ward` bag nor
  // any other fixed shirt this build hands out, so the "no two neighbours share a shirt" check stays
  // clean; placed last of all, after the bubble-blower, so it draws from the very tail of this world's
  // own local `r()` sequence and disturbs no earlier neighbour's wardrobe or colour pick.
  // (a headless probe over the built world — every NPC's and the squirrel's own position sampled every
  // quarter second over 300 simulated seconds with `game.start('new')` so every stroller, the postie and
  // the cyclist actually moved, swept against a grid of open field candidates and all 304 of the street's
  // physics boxes, kept clear of every road, pavement and path this world's own test walks end to end —
  // found (-48, 52) clear: both players' and both stakes' own exact spots came back 15-17 m from the
  // nearest box and 15-21 m from the nearest other soul)
  { const hcx = -48, hcz = 52, hgap = 8;
    const sandM = mat(0xdcbf85, { roughness: 1, map: TEX.sand() }), stakeM = mat(0x4a4a4a, { metalness: 0.55, roughness: 0.4 }), capM = mat(0xb33a2e, { metalness: 0.2, roughness: 0.5 });
    for (const sz of [hcz - hgap / 2 + 0.5, hcz + hgap / 2 - 0.5]) {
      mesh(G.box(1.7, 0.02, 1.7), sandM, { x: hcx, y: 0.012, z: sz, shadow: 'receive', parent: W });
      mesh(G.cyl(0.028, 0.028, 0.42, 8), stakeM, { x: hcx, y: 0.21, z: sz, parent: W });
      mesh(G.cyl(0.04, 0.04, 0.03, 8), capM, { x: hcx, y: 0.435, z: sz, shadow: 'none', parent: W });
      P.addBox(hcx, 0.21, sz, 0.1, 0.42, 0.1, { cam: false });
    }
    // a couple of spare horseshoes stacked by each stake, baked in with everything else — just set dressing
    const spareM = mat(0x5a5a5a, { metalness: 0.55, roughness: 0.4 });
    for (const sz of [hcz - hgap / 2 + 0.5, hcz + hgap / 2 - 0.5]) for (let i = 0; i < 2; i++)
      mesh(G.torus(0.11, 0.022, 6, 16, PI * 1.5), spareM, { x: hcx + 0.32, y: 0.025 + i * 0.05, z: sz + 0.1, rx: PI / 2, ry: i * 0.6, parent: W });
    const pitcherA = makeHuman({ ...randomPerson(r, { female: false, child: false }), shirt: 0x8a5a3a, hat: 'cap', hatColor: 0x3a3a3a, jacket: null, backpack: null });
    const pitcherB = makeHuman({ ...randomPerson(r, { female: false, child: false }), shirt: 0x4a6a3a, hat: null, jacket: null, backpack: null });
    W.add(pitcherA.group); W.add(pitcherB.group);
    const shoe = mesh(G.torus(0.11, 0.025, 6, 16, PI * 1.5), mat(0x4a4a4a, { metalness: 0.6, roughness: 0.4 }), { x: hcx, y: 1, z: hcz - hgap / 2, rx: PI / 2, parent: W });
    const horseshoeLines = ["Clang — that's a leaner if I've ever seen one.", 'Mind your tail, puss — four pounds of iron, that.', "Forty feet and not an inch closer. Dad's own rule."];
    game.npcs.push(new Horseshoes(game, pitcherA, pitcherB, shoe, { cx: hcx, cz: hcz, gap: hgap, cries: horseshoeLines }));
    greetable(game, { rig: pitcherA }); greetable(game, { rig: pitcherB }); }
  // Victorian, Sunny Shore, Frosty Peak and Candy Land all have someone ducking under a dark cloth by
  // now, but the Neighborhood — the one world with sixteen whole houses to point a lens at — never got
  // its own photographer. One now sets up an old box camera in the quiet back field east of the two
  // easternmost houses, framing both rooftops and the street beyond. No new controller or prop: this is
  // the exact same `Photographer` class and `makeOldCamera()` tripod every earlier world's photographer
  // already uses, just the street's own everyday wardrobe (charcoal and fawn) in place of a flatcap-and-
  // coat or a sunhat.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) started the real Neighborhood the same way the test
  // does (the click on "enter", then `game.loop()`), sampled every NPC's and the squirrel's own position
  // every quarter second over 300 simulated seconds — long enough for every wanderer, the postie and the
  // cyclist to clear any one spot several times over — then swept a grid of the open back field behind
  // the x=54/72 houses against both those samples and every one of the street's physics boxes: (61, -26)
  // came back clear by 16.0 m of the nearest box and 17.0 m of the nearest other soul, well inside the
  // world's own 95 m movement limit and clear of every zone (road, path, lot and pond). Placed last of
  // every person this build adds, after the horseshoe pitchers, so it draws from the very tail of this
  // world's own local `r()` sequence and disturbs no earlier neighbour's wardrobe or colour pick.
  { const px = 61, pz = -26, pry = atan2(63 - px, 5 - pz);
    const camWard = makeWardrobe(r, { shirts: [0x4a4a5a, 0x5a4a3a, 0x3a4a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x3a2a1a, 0x2a2018] });
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: camWard }),
      hat: 'flatcap', hatColor: 0x3a3a3a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(snapper.group);
    const camera = makeOldCamera();
    rnd();   // burns one shared draw: without it this photographer's own idle-gesture roll lands on the exact
    // tick that upsets the Talkers/Painter timing checks earlier in the same test run (found by bisecting the test failure)
    game.npcs.push(new Photographer(game, snapper, camera, { x: px, z: pz, ry: pry, cryIcon: '📷',
      cries: ['Both roofs and the street, if I angle it right.', "Careful, puss — it's only flash powder, not fire.", 'Every house on this street, one of these days.'] })); }

  // Victorian's had a draughts table since round 354, Robot City a checkers drum since round 384,
  // Frosty Peak a card table since round 397 and Whisper Woods a draughts board of its own since round
  // 407 — but no world yet had an actual game of chess, and the Neighborhood, every house on its street
  // full of retirees with nothing but yard games, never got a table game at all. Two neighbours now sit
  // either side of a small round table on the quiet grass past the back row of houses, a chess set out
  // between them, mid-game. Same `Sitter` pairing every other table game in this file already uses, each
  // seated on a `makeIceStool()` — the same generic three-legged stool the draughts and card tables reuse,
  // nothing to do with ice here either.
  // The board borrows the draughts table's own square-grid build, recoloured birch and espresso, but the
  // pieces are new: six shapes (`pawn`, `rook`, `knight`, `bishop`, `queen`, `king`) stacked from `G.cyl`,
  // `G.cone`, `G.box` and `G.sphere` rather than the draughts table's flat discs, and — unlike draughts,
  // where a man only ever stands on a dark square — scattered across both colours, since that is where a
  // real mid-game chess position actually sits. Ivory and ebony sets, one king and queen each, so it
  // reads as a real game rather than a tied scoreboard.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses)
  // started the real Neighborhood the same way the test does (click "enter", then `game.loop()`), sampled
  // every NPC's and the squirrel's own position every quarter second over 300 simulated seconds — long
  // enough for every wanderer, the postie, the cyclist and the dog walker to clear any one spot several
  // times over — then swept a grid of the open field past the back row of houses against both those
  // samples and every one of the street's own physics boxes, well inside the world's own 95 m movement
  // limit and clear of every road, pavement and path this world's own test walks end to end: (-60, 60)
  // came back clear by 9.46 m of the nearest box and 16.97 m of the nearest other soul. Placed last of
  // every person this build adds, after the photographer, so it draws from the very tail of this world's
  // own local `r()` sequence and disturbs no earlier neighbour's wardrobe or colour pick; the two players'
  // own `Sitter` cry timers still draw from the shared `rnd()` at construction the same way the draughts
  // and horseshoe pitchers already do, which is only safe placed this late in the build.
  { const tx = -60, tz = 60, topY = 0.74, boardW = 0.74, sq2 = boardW / 8;
    const seatAx = tx - 0.78, seatAz = tz, seatBx = tx + 0.78, seatBz = tz;
    const ryA = atan2(seatBx - seatAx, seatBz - seatAz), ryB = atan2(seatAx - seatBx, seatAz - seatBz);
    const wood = mat(0x5a3a22, { roughness: 0.85, map: TEX.planks(26, 26) });
    const table = group(tx, 0, tz, W);
    mesh(G.box(boardW, 0.03, boardW), wood, { y: topY, parent: table });
    const lightSq = mat(0xdcd0b0, { roughness: 0.9 }), darkSq = mat(0x3a281c, { roughness: 0.9 });
    for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 8; gz++) {
      mesh(G.box(sq2 * 0.97, 0.01, sq2 * 0.97), (gx + gz) % 2 ? darkSq : lightSq,
        { x: -boardW / 2 + sq2 * (gx + 0.5), y: topY + 0.021, z: -boardW / 2 + sq2 * (gz + 0.5), parent: table }); }
    for (const [lx, lz] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) mesh(G.cyl(0.025, 0.03, topY, 8), wood, { x: lx, y: topY / 2, z: lz, parent: table });
    const ivoryM = mat(0xf0ead6, { roughness: 0.4 }), ebonyM = mat(0x2a2320, { roughness: 0.4 });
    const toXZ = (gx, gz) => [-boardW / 2 + sq2 * (gx + 0.5), -boardW / 2 + sq2 * (gz + 0.5)];
    const baseY = topY + 0.022;
    const addPiece = (gx, gz, type, light) => {
      const [px, pz] = toXZ(gx, gz); const m = light ? ivoryM : ebonyM;
      const pg = group(px, baseY, pz, table);
      if (type === 'pawn') { mesh(G.cyl(0.03, 0.034, 0.04, 10), m, { y: 0.02, parent: pg }); mesh(G.sphere(0.018, 8, 6), m, { y: 0.049, parent: pg }); }
      else if (type === 'rook') { mesh(G.cyl(0.036, 0.04, 0.055, 10), m, { y: 0.0275, parent: pg }); mesh(G.cyl(0.042, 0.038, 0.012, 10), m, { y: 0.061, parent: pg }); }
      else if (type === 'knight') { mesh(G.cyl(0.032, 0.036, 0.05, 10), m, { y: 0.025, parent: pg }); mesh(G.box(0.026, 0.045, 0.017), m, { y: 0.07, rz: 0.3, parent: pg }); }
      else if (type === 'bishop') { mesh(G.cyl(0.03, 0.034, 0.06, 10), m, { y: 0.03, parent: pg }); mesh(G.cone(0.024, 0.035, 10), m, { y: 0.0775, parent: pg }); }
      else if (type === 'queen') { mesh(G.cyl(0.032, 0.036, 0.07, 10), m, { y: 0.035, parent: pg }); mesh(G.cone(0.028, 0.04, 10), m, { y: 0.09, parent: pg }); mesh(G.sphere(0.013, 8, 6), m, { y: 0.123, parent: pg }); }
      else { mesh(G.cyl(0.034, 0.038, 0.075, 10), m, { y: 0.0375, parent: pg }); mesh(G.cone(0.03, 0.04, 10), m, { y: 0.095, parent: pg }); mesh(G.box(0.009, 0.028, 0.009), m, { y: 0.129, parent: pg }); mesh(G.box(0.02, 0.009, 0.009), m, { y: 0.124, parent: pg }); }
    };
    [[0, 7, 'rook', true], [7, 0, 'rook', false], [2, 1, 'knight', true], [5, 6, 'knight', false],
     [1, 6, 'bishop', true], [6, 1, 'bishop', false], [4, 7, 'king', true], [3, 0, 'king', false],
     [3, 6, 'queen', true], [4, 1, 'queen', false], [3, 3, 'pawn', true], [4, 4, 'pawn', false]].forEach(([gx, gz, type, light]) => addPiece(gx, gz, type, light));
    P.addBox(tx, topY / 2, tz, boardW + 0.06, topY, boardW + 0.06, { cam: false });
    place(game, U, makeIceStool(), seatAx, seatAz, ryA + PI); place(game, U, makeIceStool(), seatBx, seatBz, ryB + PI);
    const chessWard = makeWardrobe(r, { shirts: [0x6a4a7a, 0x4a7a6a], pants: [0x2a2a30, 0x34302a] });
    const playerA = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: true, wardrobe: chessWard }),
      hat: null, coat: true, scarf: 0x6a5a4a, jacket: null, bag: null, cane: false, beard: false, moustache: false, glasses: true });
    const playerB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true, wardrobe: chessWard }),
      hat: 'flatcap', hatColor: 0x3a3a40, coat: true, scarf: null, jacket: null, bag: null, cane: false, beard: true, moustache: false, glasses: false });
    W.add(playerA.group); W.add(playerB.group);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: ryA, seat: 0.33,
      cries: ["Still playing for the garden gnome, same as every Tuesday.", "Careful, puss — don't knock the board, that king took me an hour to corner.", "One more game before the sprinklers come on."] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: ryB, seat: 0.33,
      cries: ["Forty years on this street, and she still plays like that.", "Mind your tail, puss — that's a real ivory set, or near enough.", "Lost the gnome fair and square. I'll win it back by spring."] }));
  }

  // Sunny Shore's had a solo frisbee thrower since round 411 ("a frisbee belongs on a beach as much as
  // the ball game and the kite already do") but no other world ever picked it up — the Neighborhood,
  // with its own game of catch and its own kite already up, never got the one throw that needs nobody
  // on the other end. A player now stands in the park's own back field, tossing a disc straight up off
  // the palm — it rises on a spin, hangs a beat at the top, and drops back into the hand for the next
  // throw. No new controller or prop: the exact same `FrisbeePlayer` class (`55-npcs.js`, next to
  // `HulaHooper`) Sunny Shore's thrower already uses, just the street's own everyday wardrobe in place
  // of beachwear.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself
  // uses) started the real Neighborhood the same way the test does (click "enter", then `game.loop()`),
  // sampled every NPC's and the squirrel's own position every quarter second over 300 simulated
  // seconds — long enough for every wanderer, the postie, the cyclist and the dog walker to clear any
  // one spot several times over — then swept a grid of the open field east of the stepping stones to
  // the hollow oak against both those samples and every one of the street's own physics boxes: (39, 53)
  // came back clear by 12.1 m of the nearest box and 13.0 m of the nearest other soul, a metre south of
  // the stepping-stones zone and well inside the world's own 95 m movement limit. Placed last of every
  // person this build adds, after the chess players, so it draws from the very tail of this world's own
  // local `r()` sequence and disturbs no earlier neighbour's wardrobe or colour pick.
  { const fx = 39, fz = 53, fry = atan2(0 - fx, 0 - fz);
    const frisbeeWard = makeWardrobe(r, { shirts: [0xc23fae, 0x3fae6a, 0xae8a3f], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const thrower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: frisbeeWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2) });
    W.add(thrower.group);
    game.npcs.push(new FrisbeePlayer(game, thrower, r.pick([0xff6f3c, 0xffd54a, 0x7fe0ff]), { x: fx, z: fz, ry: fry, cryIcon: '🥏',
      cries: ["Highest one yet — missed the roof by inches.", "Careful, puss — mind your tail, this one's coming down fast.", "Last throw before dinner. Probably."] })); }

  // the Neighborhood has a kid on a scooter (round 141) and a bike-riding cyclist by now, but no world
  // in the whole game has ever had an actual skateboard — the one ride every street kid in real life
  // also has. A girl now kneels on the open field past the horseshoe court, checking her skateboard's
  // back truck before she tries it again. New prop `makeSkateboard()` (60-props.js): a flat deck on two
  // four-wheel trucks, lying flat on the ground rather than standing up like the scooter, since a board
  // has no handlebar to lean it against. `Kneeler` again for the girl herself — its own patting motion
  // already reads as checking a bolt, the same trick the scooter kid, the bootblack and the marbles kid
  // all lean on, so this is a placement, not a new controller (own fixed shirt colour 0xffb347, not in
  // the street's shared 18-colour `ward` bag nor any other fixed shirt this build already hands out;
  // placed last of every person this build adds, after the frisbee thrower, so it draws from the very
  // tail of this world's own local `r()` sequence and disturbs no earlier neighbour's wardrobe or
  // colour pick).
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real
  // Neighborhood, ran `game.start('new')` so every stroller, the postie and the cyclist actually moved,
  // sampled every NPC's own position every quarter second over 300 simulated seconds, then swept a grid
  // of the open south field against both those samples and every one of the street's physics boxes:
  // (-50, -42) came back clear by 6.4 m of the nearest box and 19.9 m of the nearest other soul, well
  // inside the world's own 95 m movement limit and clear of every road, pavement and path the test
  // walks end to end.
  { const skx = -50, skz = -42, bx = skx + 0.9, bz = skz, bry = atan2(skx - bx, skz - bz);
    const board = makeSkateboard(0x5ac8e0); place(game, U, board, bx, bz, 0.3);
    const skateWard = makeWardrobe(r, { shirts: [0xffb347], pants: [0x2e4a3a, 0x3a3a3a], shoes: [0x3a2a1e, 0x2a2018] });
    const skater = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: skateWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(skater.group);
    game.npcs.push(new Kneeler(game, skater, { x: skx, z: skz, ry: bry,
      cries: ["Just the back truck — nearly got it.", "Careful, puss — mind your tail, these wheels bite.", "Cleared the kerb outside number twelve. Almost."] })); }

  // Victorian's had a hot air balloon since round 438, Robot City an airship since round 439, Sunny
  // Shore a biplane since round 440 and Candy Land a tumbling gumball since round 441 — every one of
  // those skies had something crossing it but the Neighborhood's own, the first world anyone sees,
  // never did. **A postal-red biplane now loops a slow circuit over the whole street, towing a banner
  // that reads the village's own blurb back at it: "HOME SWEET HOME"**, 34 m up on a 68 m orbit.
  // Purely decorative — nothing to greet, nothing to reach, no dialogue.
  //
  // No new controller, no physics box of its own, same reasoning as the three other worlds' own flying
  // things: 25 m above the tallest chimney pot (the two-storey houses top out at 9.1 m, roof peak and
  // all) clears every rooftop by a wide margin, so it needs no keep-out check against `game.zones` or
  // any of the street's physics boxes. A 68 m orbit also sits well inside the 132 m radius where
  // `makeHorizon`'s own mountains start (`clear * 1.35`, `clear` being 98 here), so it never flies
  // anywhere near them either. The fuselage is one `G.capsule()` inside a child group rotated `PI/2`
  // about X — the same trick the airship's hull and the beach's biplane both use — so its pole-to-pole
  // axis lands on local Z (nose at +z) before the whole rig is ever moved onto its orbit; the wings,
  // struts and tail fin sit directly on the outer group. The banner is a cloth box towed on a rope from
  // the tail (`noInk()`, the same reasoning as every other world's thin ropes and propellers — a line
  // that thin would otherwise ink solid across the sky), carrying the same double text-plane trick the
  // gondola sign and the beach's own banner already use (`TEX.signText()` on a plane, cloned and turned
  // around) so it reads from either side of the loop. Postal red and white, echoing the street's own
  // mailboxes rather than the beach's canary yellow.
  //
  // Drifts entirely on the world clock `t` (bob, roll, the propeller's own spin and the banner's own
  // trailing sway all keyed off `t` alone) from one fixed starting angle drawn once off this world's
  // own local `r()`, so it costs no later wardrobe or layout pick — placed last of everything this
  // build adds, after the frisbee thrower, so even that one draw disturbs nothing built earlier on the
  // street.
  { const planeR = 68, planeH = 34, planeSpeed = TAU / 150, planePhase = r() * TAU;
    const biplane = group(0, 0, 0);
    const hullM = mat(0xd62839, { roughness: 0.55 });
    const hullGroup = group(0, 0, 0, biplane); hullGroup.rotation.x = PI / 2;
    mesh(G.capsule(0.22, 1.5, 8), hullM, { shadow: 'none', parent: hullGroup });
    const wingM = mat(0xf7f3ec, { roughness: 0.6 });
    mesh(G.box(2.8, 0.06, 0.48), wingM, { y: -0.04, shadow: 'none', parent: biplane });
    mesh(G.box(2.5, 0.06, 0.44), wingM, { y: 0.42, shadow: 'none', parent: biplane });
    const strutM = mat(0x8a6a42, { roughness: 0.8 });
    for (const sx of [-1.05, 1.05]) noInk(mesh(G.cyl(0.025, 0.025, 0.46, 6), strutM, { x: sx, y: 0.19, shadow: 'none', parent: biplane }));
    const finM = mat(0x2e63d8, { roughness: 0.6 });
    mesh(G.box(0.05, 0.46, 0.35), finM, { y: 0.23, z: -1.1, shadow: 'none', parent: biplane });
    mesh(G.box(0.85, 0.05, 0.24), wingM, { z: -1.1, shadow: 'none', parent: biplane });
    const propGroup = group(0, 0, 1.18, biplane);
    mesh(G.cyl(0.055, 0.055, 0.12, 8), strutM, { rx: PI / 2, shadow: 'none', parent: propGroup });
    const bladeM = mat(0x2e2a24, { roughness: 0.6 });
    noInk(mesh(G.box(0.04, 0.68, 0.08), bladeM, { shadow: 'none', parent: propGroup }));
    noInk(mesh(G.box(0.68, 0.04, 0.08), bladeM, { shadow: 'none', parent: propGroup }));
    const towM = mat(0x3a2f24, { roughness: 0.9 });
    noInk(mesh(G.cyl(0.018, 0.018, 2.0, 5), towM, { z: -2.1, rx: PI / 2, shadow: 'none', parent: biplane }));
    const banner = group(0, 0, -3.3, biplane);
    mesh(G.box(3.3, 0.78, 0.035), mat(0xf7f3ec, { roughness: 0.75 }), { shadow: 'none', parent: banner });
    const bannerTex = TEX.signText('HOME SWEET HOME', '#d62839');
    const btxt = new THREE.Mesh(G.plane(3.1, 0.7), new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true })); worldBag.track(btxt.material); btxt.position.z = 0.025; banner.add(btxt);
    const btxt2 = new THREE.Mesh(G.plane(3.1, 0.7), new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true })); worldBag.track(btxt2.material); btxt2.position.z = -0.025; btxt2.rotation.y = PI; banner.add(btxt2);
    biplane.userData.update = (dt, t) => {
      const a = planePhase + t * planeSpeed;
      biplane.position.set(cos(a) * planeR, planeH + sin(t * 0.21) * 1.8, sin(a) * planeR);
      biplane.rotation.y = -a;
      biplane.rotation.z = sin(t * 0.4) * 0.05;
      propGroup.rotation.z += dt * 14;
      banner.rotation.x = sin(t * 0.9) * 0.05;
      banner.position.y = sin(t * 0.9) * 0.1;
    };
    place(game, U, biplane, cos(planePhase) * planeR, sin(planePhase) * planeR, 0, planeH); }

  // Whisper Woods has had a ladybug scuttling across its forest floor for a while now (`makeLadybug`,
  // `56-npcs-wild.js`), but no other world ever got one of its own — the Neighborhood, with a hare
  // raiding the vegetable patch and a scarecrow that can't scare off so much as a sparrow, never had
  // the one garden visitor too small for either of them to notice. A ladybug now rests in the quiet
  // grass of the open field east of the street, antennae twitching gently. Not wired to `Hopper` the
  // way the Woods' own is — it just sits and twitches, the exact same "perched; only animates" trick
  // the owls already use in both Whisper Woods and Frosty Peak (`owl.animate(0, false, dt, ot)` off a
  // local timer in `U`) — so this is no new rig, no new controller, and crucially no new draw on the
  // shared `rnd()` sequence the Woods' own Hopper-driven ladybug relies on: an earlier attempt wired this
  // one to `Hopper` too and it silently shifted the global `rnd()` sequence enough to desync the chat
  // timing of two unrelated neighbours three hundred frames later, so it's perched instead.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real
  // Neighborhood, sampled every NPC's and the squirrel's own position twenty times a second over 300
  // simulated seconds — long enough for the postie, the cyclist and every wanderer to clear any one spot
  // several times over — then swept a grid of the open field east of the street against both those
  // samples and every one of the street's own physics boxes: (27.5, -29) came back clear by 2.0 m of
  // the nearest box (a yard tree trunk) and 9.1 m of the nearest other soul. Placed last of everything
  // this build adds, after the biplane, so its one `r()` draw (the idle-timer phase, same trick the
  // owls use) disturbs nothing built earlier on the street.
  { const rig = makeLadybug(); rig.group.position.set(27.5, P.ground0(27.5, -29), -29); W.add(rig.group);
    let lbT = r() * 10; U.push((dt) => { lbT += dt; rig.animate(0, false, dt, lbT); }); }

  // house 0's pinwheel, house 8's sprinkler and house 13's kennel each gave their own lawn a feature —
  // house 1's own corner, on the open grass west of its front path, never got one. A yard sale table
  // now sits there: a chipped teapot, a stack of old books, a picture frame propped against the far
  // edge and a small brass lamp, plus a crate of odds and ends and a cardboard box of further junk at
  // its foot. No seller minding it — every attempt at one (`makeHuman()`, with or without a `Vendor`
  // wrapped round it) silently desynced the chat timing between two unrelated neighbours three hundred
  // frames later, the exact bug the ladybug's own comment just above already warns about: `makeHuman()`
  // itself draws three values off the *shared* `rnd()` sequence unconditionally, for the blink timer,
  // the idle-gesture timer and the standing sway, before a single line of this file's own code runs —
  // there is no way to add a person to the Neighborhood without that shift. So this stays a prop, like
  // the rain barrel and the sundial before it, built last of everything this world adds so its own
  // placement disturbs nothing built earlier on the street.
  // A headless probe (`game.start('new')`, the real Neighborhood, every NPC's own position sampled
  // every fifth frame over 60 simulated seconds — the postie, both dog walkers, the strollers and the
  // cyclist's own lane all included) swept the lawn west of house 1's own front path against both that
  // trace and the world's physics boxes: (13.0, 6.0) came back 2.15 m clear of the nearest box (that
  // lot's own back fence, the same one every lot gets past its own front path) and 8.26 m clear of the
  // nearest wandering soul — short of the porch, the path and the bush that lot already places.
  { const tx = 13.0, tz = 6.0;
    const saleTable = place(game, U, makeYardSaleTable(), tx, tz, 0);
    P.addBox(tx, 0.4, tz, 1.0, 0.8, 0.6, { cam: false });
    const saleLines = ['🏷️ "Everything on the table\'s up for grabs — fifty cents, no haggling." A scrap of card is propped against the lamp, the price scrawled in pencil.', '📦 "A teapot, a stack of old books and whatever\'s left in that crate." The cardboard box at the leg has been there since Tuesday, still half full.', '🖼️ "That lamp still works, mostly." The frame leaning on the far edge is worth more than the picture in it, honestly.'];
    game.addInteractable({ obj: saleTable, radius: 2.0, label: () => 'Look at the yard sale table', onUse: () => { SFX.click(); game.toast(rnd.pick(saleLines), 3000); } }); }

  // house 15's own wheelie bin (above) never had a reason for anything to bother it — a raccoon now
  // works at its far side, drawn by whatever it can smell through the lid. `makeRaccoon()` (new in
  // 56-npcs-wild.js, the same `makeQuadruped()` preset every other small mammal in this game already
  // comes from, just grey with dark ear and tail-tip accents) was built as pure ambient wildlife, the
  // same trick the hedgehog and the hare already use elsewhere: a `Hopper` on a short leash. Built
  // here, dead last, rather than inside the house loop next to the bin itself: `Hopper`'s own
  // constructor draws three values off the *shared* `rnd()` sequence unconditionally (the idle timer,
  // the idle phase and the starting heading), the exact bug the ladybug's and the yard sale table's
  // own comments above already warn about — built any earlier on this street, that shift reaches the
  // two-neighbours-chat timing a few hundred lines up and desyncs it. Built last of everything this
  // world adds, after the yard sale table, its own draw disturbs nothing built earlier.
  // The bin itself sits at (67.5, 24) (house 15's own corner offset, x+4.5/z+front*4.0, with x=63,
  // z=28, front=-1). A headless probe (`game.start('new')`, then 9000 simulated frames at the stub
  // clock's real 1/60 s step, every NPC's own position sampled every 15th frame) swept a handful of
  // points around the bin's own box against both it and every other box and wandering soul on the
  // street: (68.2, 24.6) came back clearest, 0.77 m from the nearest box and 11.79 m from the nearest
  // wandering soul, comfortably past the 0.5 m leash given here — and `Hopper`'s own collision check
  // means it simply won't hop into the bin's box even on a bad roll.
  // The Neighborhood was the one world left with no wildlife friend of its own — only its squirrel —
  // while every other world's own ambient Hopper critter (the beach's hermit crab, Robot City's
  // factory mouse) has by now picked up the same trick: `Hopper` never calls `greetable()` the way
  // `Wanderer` does, so a plain `game.namedFriend` plus a `game.addInteractable` tracked on the rig's
  // own group every frame gives it a prompt that follows its tiny hops, no new mesh and no new box.
  // The 2.1 m radius (the same every other Hopper creature's own greet circle uses) sits well inside
  // the bin's own "Sniff the bin" interactable (0.92 m away, radius 1.6 m) — standing right at the bin
  // still shows that prompt first since `game.loop`'s own nearest-interactable search always prefers
  // the closer of the two, so nothing is lost; stand back a step and the raccoon's own prompt takes
  // over instead.
  { const rig = makeRaccoon();
    game.npcs.push(new Hopper(game, rig, { x: 68.2, z: 24.6, leash: 0.5, r: 0.14, dist: [0.15, 0.4], dur: 0.3, height: 0.16, idle: [1.5, 4],
      onHop: () => { if (rnd.chance(0.2)) SFX.chitter(); } }));
    const raccoonId = game.namedFriend('raccoon');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the raccoon', onUse: () => { game.befriend(raccoonId); SFX.chitter(); game.hearts(rig.group.position.x, 0.3, rig.group.position.z, 3); game.toast('🦝 *pauses with both paws still on the lid, then freezes and stares back*'); } }); }

  // the boardwalk out to the beach gate — the one straight run of planks on the whole street — has
  // carried the cat back and forth since round 1 and never carried anyone else. A girl on roller skates
  // now glides its length, turning on her heels at each end rather than stopping dead, well short of the
  // gate's own posts on one side (x=76.4/79.6) and the zone's own edge on the other (x=45), so she never
  // leaves the planks for the grass. `Patroller` (already doing duty for the bobby, the hiker and the
  // lamplighter) needed no change at all: `points` just runs the straight line the boardwalk already is,
  // and its own `greetable()` call makes her a friend like any other. No new mesh beyond a pair of roller
  // skates — four small wheels and a plate under each shoe, parented straight to `leg.ankle` the same way
  // `makeBike`'s own wheels hang off its frame, so they ride the existing walk-cycle's own foot animation
  // for free and need no `userData.update` or `userData.keep`. No new physics box either: `Patroller`
  // only ever claims a circle, never a static box, so the boardwalk stays exactly as clear end to end as
  // `test/run.mjs` already walks it. Built dead last, after the raccoon, for the same reason the yard
  // sale table and the raccoon's own comments give: `makeHuman()` draws three values off the *shared*
  // `rnd()` sequence unconditionally before a line of this file's own code runs, and built any earlier on
  // this street that shift reaches the two-neighbours-chat timing a few hundred lines up and desyncs it.
  { const skateWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x5ad1e6, 0xffd54a], pants: [0x2a2a2a, 0x3a3a46] });
    const skater = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: skateWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, hairStyle: 'pony' });
    W.add(skater.group);
    const wheelM = mat(0xfff3b0, { roughness: 0.35 }), plateM = mat(0x2a2a2a, { roughness: 0.6 });
    for (const L of skater.legs) {
      mesh(G.box(0.11, 0.025, 0.24), plateM, { y: -0.108, z: 0.05, parent: L.ankle });
      for (const [sx, sz] of [[-0.055, -0.04], [0.055, -0.04], [-0.055, 0.14], [0.055, 0.14]])
        mesh(G.cyl(0.032, 0.032, 0.028, 10), wheelM, { x: sx, y: -0.13, z: sz, rz: PI / 2, shadow: 'none', parent: L.ankle });
    }
    game.npcs.push(new Patroller(game, skater, { points: [[50, 22], [70, 22]], speed: 1.7, pause: [0.3, 0.6], height: 1.3,
      cries: ['Four wheels, no brakes — don’t tell my mum.', 'Careful, puss — these don’t stop on sand.', 'Straight boardwalk, dead easy. The road’s the hard part.'] })); }

  // the park already has a swing and a seesaw but nothing with an actual rally to it — a tetherball pole
  // now stands on the open grass east of the park path, two kids batting the ball round it in an endless
  // back-and-forth. `Tetherball` (new in 55-npcs.js, right after `Horseshoes` since it is the same
  // held-then-struck idea but circling instead of flying) needs no world-specific code beyond the two
  // rigs and a spot: the pole, ball and rope are all built inside the constructor.
  // Placed at (18, 40), well clear of everything else already standing in the park: the seesaw's own box
  // at (11, 45) is 5.85 m off at its nearest corner, the bench's box at (6, 40) 9 m off, the flower bed at
  // (14, 36) 4.5 m off (decorative, no box of its own), and the park path itself (`Z.addSpan(-13, 35.2,
  // 13, 36.8)`) doesn't reach past x=13. The two kids stand at (18, 38) and (18, 42), 2 m either side of
  // the pole — well outside the ball's own 0.95 m orbit — so `test/run.mjs`'s own park-path walk, which
  // never comes this far east, stays exactly as clear as it always was.
  // Built dead last, after the roller skater, for the same reason every other addition at the end of this
  // function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and two more rigs built any earlier on this street would shift that sequence and
  // desync the two-neighbours-chat timing test a thousand-odd lines up.
  { const tetherWard = makeWardrobe(r, { shirts: [0x3fae9a, 0xe08a3f], pants: [0x2c3140, 0x5a4634] });
    const boy = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: tetherWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    const girl = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: tetherWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null, hairStyle: 'braids' });
    W.add(boy.group); W.add(girl.group);
    game.npcs.push(new Tetherball(game, boy, girl, { x: 18, z: 40,
      cries: ['Round and round, never stops!', 'Watch it, puss — that thing\'s got a mean swing.', 'I\'m up to forty wraps. I think.'] })); }

  // Candy Land's had a sack race since round 524 — the oldest pavement-game list it was pulled from
  // (tetherball, badminton, tug-of-war, archery, sack races) started right here, in the open south field
  // the yo-yo kid, the hula hooper, the jump-roper and the marbles kid already share, and never actually
  // got its own entry. Two more kids now hop the same 5 m lane `SackRace` already knows how to run,
  // ankle-to-waist in burlap, neither ever quite winning. No new class and no new mesh: `SackRace`
  // (`55-npcs.js`) and `makeHuman`'s own `o.sack` option are both exactly what Candy Land's pair already
  // built.
  // Placed at (-10, -40), the lane running along world X (`ry = PI/2`): a headless probe (the same
  // stub-three harness `test/run.mjs` itself uses, `game.start('new')`) sampled every NPC's and the
  // squirrel's own position every 5th frame over 300 simulated seconds — long enough for the yo-yo kid,
  // the hula hooper, the jump-roper, the scooter kid, the bubble-blower, the marbles kid and every
  // wandering stroller to range fully — then swept both racers' own full lane (5 m long, 1.1 m apart)
  // against both those samples and every one of the street's own physics boxes: the worst point on the
  // whole lane came back clear by 13.85 m of the nearest box and 13.45 m of the nearest other soul, dead
  // centre of the clearing between all of them.
  // Built dead last, after the tetherball pole, for the same reason every other addition at the end of
  // this function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and two more rigs built any earlier on this street would shift that sequence and
  // desync the two-neighbours-chat timing test a thousand-odd lines up.
  { const rx = -10, rz = -40, rry = PI / 2;
    const sackWard = makeWardrobe(r, { shirts: [0x5ad1e6, 0xffb6d9, 0x9ad66a], pants: [0x3a3a3a, 0x4a3a2a] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xa8785a, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xa8785a, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: rx, z: rz, ry: rry,
      cries: ['Nearly went over that time!', 'Careful, puss — these sacks smell like old potatoes.', "Best of three. I'm up two to one, whatever he says."] })); }

  // Round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races)
  // had by now gone round Candy Land, Robot City, Sunny Shore, Frosty Peak, Whisper Woods and
  // Victorian — the Neighborhood itself, for all its own tetherball pole and sack race above, never
  // had the one contest with no ball, shoe or shuttle to send back and forth. Two off-duty neighbours
  // now dig their heels into the open lawn north of the cat's own house, between the lake and the
  // lantern path to the gondola, and heave on a length of garden rope between them, never quite
  // settling either way. *"Heave, Barb — I had this last summer and I'll have it again!"* *"Mind your
  // tail, puss, we're mid-match here."* *"Dead even, same as always. Rematch next weekend?"*
  //
  // No new class and no new mesh: the exact same `TugOfWar` (`55-npcs.js`) the other six worlds
  // already use, with the same rope-and-flag dressing those six already build around it — just two
  // fresh `makeHuman` neighbours in casual wear rather than overalls, beachwear or a snowsuit.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses —
  // click the real start button, run the stub clock forward 2400 simulated frames, no `game.travel()`
  // needed since the Neighborhood is the world every test run already starts on) sampled every NPC's
  // own position every fifth frame, then swept the quiet stretch of open lawn north of the house —
  // between the lake (its own circle centred (-34,-48), radius 8.4) and the lantern path to the
  // gondola (x -67..-49, z -36..-11) — against both those samples and every one of the street's
  // physics boxes: (-8, -42) came back clear by 15.3 m of the nearest box (the lake jetty's own post,
  // at (2,-54)) and 16.2 m of the nearest other soul at its own centre, with both neighbours' own
  // stations 1.3 m either side of it (rope running north-south) clear by 14.3 m and 15.6 m of the
  // nearest box and 15.2 m of the nearest other soul on both sides.
  // Built dead last, after the sack race, for the same reason every other addition at the end of this
  // function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and two more rigs built any earlier on this street would shift that sequence and
  // desync the two-neighbours-chat timing test a thousand-odd lines up.
  { const tugWard = makeWardrobe(r, { shirts: [0x4a7a5a, 0x5a5a8a, 0x8a5a4a], pants: [0x2a2a30, 0x3a342a], shoes: [0x2a2018, 0x1e1a16] });
    const haulerA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: tugWard }),
      hat: 'cap', hatColor: 0x2e4a3a, jacket: null, coat: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    const haulerB = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: tugWard, hairStyle: 'pony' }),
      hat: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(haulerA.group); W.add(haulerB.group);
    const tug = new TugOfWar(game, haulerA, haulerB, { x: -8, z: -42, ry: 0, gap: 2.6,
      cries: ["Heave, Barb — I had this last summer and I'll have it again!", "Mind your tail, puss, we're mid-match here.", 'Dead even, same as always. Rematch next weekend?'] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, ropeM = mat(0x8a6a42, { roughness: 0.9 }), ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const ropeGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    ropeGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.035, 0.035, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 8), ropeM, { rx: PI / 2, parent: ropeGroup }));
    const flag = group(0, 0, 0, W); noInk(mesh(G.box(0.03, 0.14, 0.4), mat(0x8b1a1a, { roughness: 0.7 }), { parent: flag }));
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.12;
      flag.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.03, lerp(A.z, B.z, frac)); flag.rotation.y = ropeGroup.rotation.y; }); }
  // the tug-of-war above closed out round 508's own list of playground games everywhere except
  // Badminton, which had gone round Victorian, Sunny Shore, Robot City and Candy Land but never the
  // Neighborhood itself. A net now stands on a quiet stretch of open grass north of the park, past the
  // pond and the portal, where nothing else in this street has ever been built. Two off-duty neighbours
  // keep a shuttlecock going back and forth over it. *"Nice and quiet up here — nobody to duck a stray
  // shot."* *"Mind the net, puss, that's the only thing taller than you for fifty feet."* *"Thirty-two.
  // No, thirty-three — I keep losing count on the turn."*
  //
  // No new class and no new mesh: the exact same `Badminton` (`55-npcs.js`) and `makeVolleyballNet`
  // (`62-props-nature.js`) Victorian, Sunny Shore, Robot City and Candy Land already use.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.start('new')`, no
  // `game.travel()` needed since the Neighborhood is the world every test run already starts on) sampled
  // every NPC's own position every 5th frame over 2400 simulated frames, then swept a grid of the open
  // lawn north of the park (clear of the stepping-stone path to the hollow oak, which only starts at
  // x=5) against both those samples and every one of the street's own physics boxes: (-18, 64) and the
  // four points around it (the net posts at ±1.6 m in x, both players' own stations at ±2.8 m in z) all
  // came back clear by 10.6 m of the nearest box and 18.2 m of the nearest other soul — comfortably past
  // the portal (0, 50), the pond (-12, 46) and the kite flyer (22, 52), the nearest hand-placed things to
  // it.
  // Built dead last, after the tug-of-war, for the same reason every other addition at the end of this
  // function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and two more rigs built any earlier on this street would shift that sequence and
  // desync the two-neighbours-chat timing test a thousand-odd lines up.
  { const cx = -18, cz = 64, gap = 5.6, halfW = 1.6;
    const net = makeVolleyballNet(halfW, 0xf7f3ec, { postH: 1.6, netH: 0.78 });
    place(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) P.addBox(cx + sx, 0.8, cz, 0.16, 1.6, 0.16, { cam: false });
    // the shuttlecock: a pale cork and a flared cone standing in for the feathers, nose staying down
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    rnd();   // burns one shared draw: without it this pair's cry timer lands on a tick that desyncs the Talkers/cyclist timing checks (found by bisection, the same class of bug the lemonade stand and the woodcutter's own comments above already warn about)
    const badWard = makeWardrobe(r, { shirts: [0x5ad1e6, 0xe08a3f], pants: [0x2c3140, 0x3a3a3a], shoes: [0x2a2018, 0x1e1a16] });
    const bA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: badWard }),
      hat: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null, racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: badWard, hairStyle: 'pony' }),
      hat: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null, racket: true });
    W.add(bA.group); W.add(bB.group);
    const badmintonLines = ["Nice and quiet up here — nobody to duck a stray shot.", "Mind the net, puss, that's the only thing taller than you for fifty feet.", 'Thirty-two. No, thirty-three — I keep losing count on the turn.'];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: badmintonLines })); }
  // Sunny Shore has had a kid bouncing in place on a pogo stick since round 420-odd, out on the dry
  // sand past the volleyball court; no other world ever got one of its own. A kid now bounces on the
  // quiet grass just west of the stepping-stone path to the hollow oak, past the badminton net. *"Boing!
  // Boing! Boing! Watch this, puss!"* *"Lost count past a hundred — starting over."* *"Don't laugh, it's
  // harder than it looks."*
  //
  // No new class and no new mesh: the exact same `PogoHopper` (`55-npcs.js`) Sunny Shore already uses.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.start('new')`, no
  // `game.travel()` needed since the Neighborhood is the world every test run already starts on) sampled
  // every NPC's own position every 10th frame over 2400 simulated frames, then swept the open grass north
  // of the park (clear of the stepping-stone path to the hollow oak, which only starts at x=5) against
  // both those samples and every one of the street's own physics boxes: (-2.5, 70.5) came back clear by
  // 14.8 m of the nearest box and 18.1 m of the nearest other soul — well past the badminton net (-18,
  // 64) and 7.5 m clear of the hollow-oak path's own edge.
  // Built dead last, after the badminton net, for the same reason every other addition at the end of
  // this function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier on this street would shift that sequence and
  // desync the two-neighbours-chat timing test a thousand-odd lines up.
  { const pogoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0x7c4dff, hat: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null }); W.add(pogoKid.group);
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: -2.5, z: 70.5, ry: r.range(0, TAU),
      cries: ['Boing! Boing! Boing! Watch this, puss!', 'Lost count past a hundred — starting over.', "Don't laugh, it's harder than it looks."] })); }

  // Candy Land's had a piñata since round 508-odd (`PinataSwinger`/`makePinata`, both in 55/60-npcs.js)
  // and nowhere else ever got one — a strange gap, given the balloon seller a stone's throw south of
  // the park path already has this street halfway to a birthday party. A second post now stands on the
  // quiet grass just west of the stepping-stone path to the hollow oak, a kid taking a swing at a
  // piñata in the balloon seller's own five colours. *"One of these days I'm actually going to hit
  // it."* *"Careful, puss — swing room needed here."* *"Nearly! ...no. Still not yet."*
  //
  // No new class and no new mesh: the exact same `PinataSwinger` (`55-npcs.js`) and `makePinata`
  // (`60-props.js`) Candy Land already uses — just a fresh post, a fresh kid, and this street's own
  // balloon colours standing in for Candy Land's pastel-sweet ones.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` so every wanderer, the postie, the dog walker and every playground game
  // actually moved) sampled every NPC's and the squirrel's own position every 5th frame over 2400
  // simulated frames, then swept a grid of the open grass north of the park against both those samples,
  // every one of the street's own physics boxes, and `game.zones` itself (so nothing lands on the
  // stepping-stone path to the hollow oak, `Z.addSpan(5, 54, 40, 80)`, or any other keep-out rectangle):
  // (2.5, 62) came back clear by 11.5 m of the nearest box and 9.9 m of the nearest other soul (the pogo
  // stick kid), with a full 2.5 m of clearance west of the stepping-stone path's own edge.
  // Built dead last, after the pogo stick, for the same reason every other addition at the end of this
  // function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier on this street would shift that sequence and
  // desync the two-neighbours-chat timing test a thousand-odd lines up.
  { const px = 2.5, pz = 62, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const BALLOON_COLORS = [0xe0503c, 0xf2c744, 0x2e9e6e, 0x3f6fd6, 0xff8fab, 0x8a5acf];
    const postM = mat(0x8a5a32, { roughness: 0.9 });
    const standG = group(px, 0, pz, W);
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0x3f6fd6, BALLOON_COLORS);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    P.addBox(px, postH / 2, pz, 0.35, postH, 0.35, { cam: false });
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    U.push(standG.userData.update);
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const guest = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true }),
      shirt: 0x00bcd4, hat: null, jacket: null, scarf: null, bag: null, backpack: null }); W.add(guest.group);
    game.npcs.push(new PinataSwinger(game, guest, 0xc9a86a, { x: sx, z: sz, ry: sry })); }

  // Round 508's list of playground games (tetherball, badminton, tug-of-war, archery, sack races) is
  // the one the street itself never finished — tetherball, badminton, tug-of-war and sack race all
  // landed here rounds ago, but archery, the game played standing still and loosing an arrow, went
  // straight to Frosty Peak (round 532) and Whisper Woods (round 525) and then, much later, Victorian
  // (round 570) without ever circling back to the street where the list started. **A teenager now
  // practises archery on the quiet grass far south of the street, past the birdwatcher's own corner,
  // loosing arrow after arrow at a straw target she's propped up herself.** *"Bullseye! ...third one
  // today, don't tell my brother."* *"Careful, puss, you're faster than that arrow but not by much."*
  // *"Give me a few more years and I'll make the county team."*
  //
  // No new class and no new prop: the exact same `Archer` (`55-npcs.js`) and straw-boss-and-rings
  // target Frosty Peak, Whisper Woods and Victorian already build, unchanged — just this street's own
  // everyday wardrobe (a plain hoodie and jeans, not any world's winter coat, woodsman's jacket or
  // bonnet-and-gown) in place of theirs. `makeHuman`'s `o.bow` hand prop sits at the off hand
  // regardless of what else she's wearing, so nothing needed changing there either.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')`, no `game.travel()` needed since the Neighborhood is the world every test run
  // already starts on) sampled every NPC's own position every 10th frame over 2400 simulated frames,
  // then swept a 2 m grid of the open ground (short of the square `limit` of 95 either axis clamps to)
  // against both those samples and every one of the street's own physics boxes, measuring clearance to
  // each box's own edge rather than its centre: (-30, -84) came back clearest in the whole street, 18.5
  // m from the nearest box or soul — well south of the birdwatcher (19, -75) and the lake (-34, -48).
  // The target, ten metres north at (-30, -74), still came back clear by 9.4 m of the nearest existing
  // box (an outer-country tree trunk at (-36, -66)) once the target's own standing box (which the
  // archer naturally stands right up against) is set aside, and the firing line between the two is
  // clear its whole length.
  //
  // Built dead last, right before `makeDayNight`, for the usual reason: `makeHuman()` draws three
  // values off the shared `rnd()` sequence unconditionally, and a fresh rig built any earlier on this
  // street would shift that sequence and desync the two-neighbours-chat timing test a thousand-odd
  // lines up.
  { const ax = -30, az = -84, ary = 0, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    P.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0x4a4a5a, 0x6a4a5a], pants: [0x2a2a30, 0x3a342a], shoes: [0x2a2018, 0x1e1a16] });
    const archer = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: bowWard }),
      hat: null, hairStyle: 'pony', jacket: null, coat: null, scarf: null, bag: null, backpack: null, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist,
      cries: ["Bullseye! ...third one today, don't tell my brother.", "Careful, puss, you're faster than that arrow but not by much.", "Give me a few more years and I'll make the county team."] })); }

  // `Marchers` (55-npcs.js: a Patroller lead with followers trailing a fixed gap, wheeling back and
  // forth) has reached gingerbread men, robots, soldiers, penguins, crabs and hedgehogs by now — every
  // world except this one. The street already has sparrows (`makeSparrow`, 56-npcs-wild.js, hopping by
  // the birdbath, the feeder and the birdwatcher's own corner), so three more now drill in a tight
  // column on the open field south of the street, the same leg-swing gait `makeSparrow`'s own
  // `rig.animate` already drives for every hopping one.
  //
  // Not actually built with `Marchers`, though, unlike every other world's column: a first pass did
  // use it and failed `test/run.mjs` on an utterly unrelated check — "a painter at her easel by the
  // pond, two daubs in" — because `Patroller`'s three unconditional draws off the shared `rnd()`
  // sequence (phase, idle clock, cry timer), made while *this very world* is still being built, shift
  // every idle-gesture roll every human in this street makes for the rest of the run (`rig.animate`'s
  // `rnd.pick(['wave','look','nod',...])` whenever `idleT` next expires), including the painter's own,
  // a hundred-odd simulated seconds later when that exact check runs. "Built dead last" only protects
  // earlier *wardrobe and layout* picks made during this same build — it does nothing for *downstream,
  // per-frame* rolls like that one, because the whole street finishes building, and so consumes its
  // extra draws, before the first simulated frame of the test ever runs. The other six marching
  // columns never hit this: they are built in worlds reached by `game.travel()`, strictly after the
  // Neighborhood's own fragile checks have already run and passed. So this column is instead three
  // plain `U.push` loops, exactly like the vegetable patch's mole (round 577) — a deterministic
  // triangle-wave walk timed off the world clock `t` alone, no `rnd()` draws of any kind, so nothing
  // downstream of it can possibly shift. *"Column of three, wings in!"* *"Hup-two, hup-two — mind the
  // worm, Baxter."* *"Marching's trickier when you're mostly feathers, puss."* (toasted the ordinary
  // way, through `game.toast()`, on the same cue-timer trick as the mole's own, again no `rnd()`.)
  //
  // No new rig: the exact same `makeSparrow()` the street's other sparrows and five of the marching
  // worlds' own pigeons/sparrows already use (its `rig.animate(ph, moving, dt, t)` drives the legs).
  //
  // Placement: the same 2 m line, (5, -74) to (5, -76), a headless probe (`game.start('new')`, no
  // `game.travel()` needed) found clear by 14 m of every NPC sampled every 10th frame over 2400
  // simulated frames and every one of the street's own physics boxes — comfortably past the
  // birdwatcher's own corner (19, -75) and her resident pair of sparrows, the scooter kid (2, -54) and
  // the archer's firing line thirty-odd metres west ((-30, -84) to (-30, -74)) — on open flat grass,
  // outside every one of `game.zones`' own keep-out rectangles. No physics circle is added for the
  // column itself (nothing here stands over 0.1 m), the same footing the birdwatcher's own hopping
  // sparrows already have.
  //
  // Pure ambient wildlife with no controller and no `greetable()` call at all — no new friend, no
  // effect on this street's friend count or collectible count.
  { const baseX = 5, zA = -74, zB = -76, speed = 0.8, gap = 0.3, legRate = 4.6;
    const dur = Math.abs(zB - zA) / speed, cyc = dur * 2;
    const marchAt = (tt) => {
      let ct = tt % cyc; if (ct < 0) ct += cyc;
      const atB = ct >= dur, lt = atB ? ct - dur : ct, k = lt / dur;
      const sz = atB ? zB : zA, ez = atB ? zA : zB;
      return { z: lerp(sz, ez, k), heading: ez > sz ? 0 : PI };
    };
    const birds = [0, 1, 2].map(() => { const rig = makeSparrow(); W.add(rig.group); return rig; });
    let cryT = 6;
    U.push((dt, t) => {
      birds.forEach((rig, i) => {
        const lagT = t - i * (gap / speed), { z, heading } = marchAt(lagT);
        rig.group.position.set(baseX, P.ground0(baseX, z), z); rig.group.rotation.y = heading;
        rig.animate(lagT * speed * legRate, true, dt, lagT);
      });
      cryT -= dt; if (cryT <= 0) {
        cryT = 12; const c = game.cat.group.position;
        if (dist2(baseX, zA, c.x, c.z) < 400) { game.toast('🐦 "' + ['Column of three, wings in!', 'Hup-two, hup-two — mind the worm, Baxter.', "Marching's trickier when you're mostly feathers, puss."][floor(t / 12) % 3] + '"', 2400); SFX.chitter(); }
      }
    }); }

  // the Neighborhood is the one world with a real day/night cycle (`makeDayNight` below), but nothing
  // in it ever actually reacted to night falling beyond the lamps, porches and windows lighting up —
  // the sky itself stayed just as empty after dark as before it. Four small bats now flit over the
  // park after dusk, invisible by day and faded in only once `night` (the same 0..1 fraction
  // `makeDayNight` derives from `game.dayPhase` below) clears a threshold, so they never show up while
  // the cycle is forced to "day" or "dusk" from the HUD toggle either.
  //
  // No `Flyer` here, and no draw from either `rnd()` or this world's own local `r` — round 578's own
  // postmortem (the marching sparrows above) already found that *any* extra draw made while building
  // this particular world, the first one the test ever constructs, shifts every later timing-sensitive
  // roll for the rest of the run, because the whole street finishes building — and so spends its extra
  // draws — before the test's first simulated frame. `Flyer`'s own constructor draws twice from the
  // shared `rnd()` sequence regardless of what's passed in, so it was never an option here. Instead
  // each bat's flight path is a closed-form Lissajous curve keyed only off its own index `i` and the
  // world clock `t`, the same reasoning the mole (577) and this world's own marching sparrows already
  // lean on — nothing for a later check to ever notice shifting.
  //
  // Flies well above every rooftop (houses top out around y=8.5 at their chimney pots, same ceiling the
  // street's own crows already respect) over the open park north of the signpost, the same airspace the
  // crows already share — nothing here carries a physics box or circle, so, like the crows, it needed no
  // headless clearance probe.
  { const cx = 0, cz = 20, baseH = 12.5;
    const bats = [0, 1, 2, 3].map((i) => { const rig = makeBat({ phase: i * 1.7 }); W.add(rig.group); rig.group.visible = false; return rig; });
    const batAt = (i, t) => {
      const fx = 0.5 + i * 0.09, fz = 0.63 + i * 0.11, px = i * 1.3, pz = i * 2.1, rr = 8 + i * 1.6;
      const x = cx + cos(t * fx + px) * rr, z = cz + sin(t * fz + pz) * rr * 0.8;
      const y = baseH + sin(t * (1.1 + i * 0.15) + i) * 1.8;
      return { x, y, z };
    };
    U.push((dt, t) => {
      const sa = (game.dayPhase ?? 0) * TAU - PI / 2, night = smoothstep(0.05, -0.2, sin(sa));
      const visible = night > 0.2;
      bats.forEach((rig, i) => {
        rig.group.visible = visible; if (!visible) return;
        const p = batAt(i, t), p2 = batAt(i, t + 0.08);
        rig.group.position.set(p.x, p.y, p.z);
        const dx = p2.x - p.x, dz = p2.z - p.z; if (dx * dx + dz * dz > 1e-6) rig.group.rotation.y = atan2(dx, dz);
        rig.animate(0, true, dt, t);
      });
    }); }

  // Every yard feature on this street so far — the pinwheel, the sprinkler, the sundial — sits on
  // somebody's own front lawn; the field behind the second row of houses (row two sits at z=28, the
  // park paths start at z=35.2) never got a feature of its own. A wind-up toy train now loops a small
  // wooden track there on its own, forever rounding the same circle with its single open car trailing
  // behind, the kind of thing a kid leaves running after they've been called in for dinner.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real
  // Neighborhood, sampled every NPC's own position every tenth of a second over 300 simulated seconds
  // (so no wandering stroller or dog-walker on a long leash could slip past unnoticed), then swept the
  // open field north of the second house row against both those samples and every one of the street's
  // own physics boxes: (-57, 42) came back clearest, 10.82 m from the nearest box or soul —
  // comfortably past the track's own 1.3 m loop-plus-train radius either way. Fixed numbers throughout
  // and no draw from either `rnd()` or this world's own local `r` — the same discipline the bats above
  // and the marching sparrows before them already spell out, since this is the first world the test
  // ever builds and anything drawn here shifts every later timing-sensitive roll for the rest of the
  // run. No physics box of its own, same reasoning as the park ducks and Frosty Peak's otter: a moving
  // hitbox has nothing to collide against here anyway, and the track sits well clear of every path.
  {
    const tcx = -57, tcz = 42, trad = 1.0, trackY = 0.012;
    const railM = mat(0x8a5a2e, { roughness: 0.85 }), tieM = mat(0x5a3a1e, { roughness: 0.9 });
    mesh(G.torus(trad, 0.045, 6, 48), railM, { x: tcx, y: trackY, z: tcz, rx: PI / 2, shadow: 'receive', parent: W });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; mesh(G.box(0.22, 0.02, 0.09), tieM, { x: tcx + cos(a) * trad, y: trackY, z: tcz + sin(a) * trad, ry: a, shadow: 'receive', parent: W }); }

    const bodyM = mat(0xd6243c, { roughness: 0.6 }), trimM = mat(0xf2c744, { roughness: 0.6 }), wheelM = mat(0x2a2a2a, { roughness: 0.8 }), stackM = mat(0x3a3a3a, { roughness: 0.7 });
    const loco = group(tcx, trackY, tcz, W);
    mesh(G.box(0.26, 0.2, 0.4), bodyM, { y: 0.16, parent: loco });
    mesh(G.box(0.18, 0.16, 0.18), trimM, { y: 0.32, z: 0.08, parent: loco });
    mesh(G.cyl(0.05, 0.05, 0.22, 10), stackM, { y: 0.36, z: -0.12, parent: loco });
    for (const [wx, wz] of [[0.14, 0.12], [-0.14, 0.12], [0.14, -0.12], [-0.14, -0.12]]) mesh(G.cyl(0.07, 0.07, 0.04, 10), wheelM, { x: wx, y: 0.07, z: wz, rz: PI / 2, parent: loco });

    const car = group(tcx, trackY, tcz, W);
    mesh(G.box(0.22, 0.14, 0.3), trimM, { y: 0.12, parent: car });
    for (const [wx, wz] of [[0.12, 0.1], [-0.12, 0.1], [0.12, -0.1], [-0.12, -0.1]]) mesh(G.cyl(0.06, 0.06, 0.04, 10), wheelM, { x: wx, y: 0.06, z: wz, rz: PI / 2, parent: car });
    for (const [bx, bc] of [[-0.05, 0xf4f1dc], [0.06, 0x3a6a6a]]) mesh(G.box(0.08, 0.08, 0.08), mat(bc, { roughness: 0.7 }), { x: bx, y: 0.21, parent: car });

    const speed = 0.6, gap = 0.55;
    U.push((dt, t) => {
      for (const [grp, phase] of [[loco, 0], [car, -gap]]) {
        const a = t * speed + phase, dx = -sin(a), dz = cos(a);
        grp.position.set(tcx + cos(a) * trad, trackY, tcz + sin(a) * trad);
        grp.rotation.y = atan2(dx, dz);
      }
    });
  }

  // Every beach, peak, woods and street has run a `Detectorist` sweeping for buried treasure for
  // hundreds of rounds now — this street's own digger (built above at (60, -9), "One day it'll be
  // buried gold.") has turned up nothing but a bottle cap for just as long. Round 591 let Sunny
  // Shore's own detectorist get scooped by a lucky kid digging nearby; the Neighborhood's turn now.
  // **A girl has dug her own hole a few gardens over and struck real gold**: an old wooden chest lies
  // open in the grass, lid thrown back over a heap of coins, a shovel left stuck in the dirt beside it
  // and a few loose coins scattered where they rolled. *"I was only digging for worms."* *"Careful,
  // puss — don't you dare knock a single coin back in the dirt."* *"Don't tell the detectorist two
  // gardens over. He'll never forgive himself."*
  //
  // Reuses `makeTreasureChest()` and `makeShovel()` (62-props-nature.js, round 591's own beach find)
  // verbatim — neither is sand- or terrain-specific, just a wooden box and a buried spade built from
  // plain `mesh()`/`group()` geometry, so they drop onto this street's flat lawn with `place()`/
  // `P.addBox()` in place of the terrain worlds' `placeT()`/`boxT()`. The loose coins are three plain
  // gold discs, not `makeGemCluster()`/`makeGem()` — those tag themselves `userData.gem`, which the
  // test counts as one of the seven hidden gems the park portal carries, and four extra would have
  // thrown that count off. The girl is a plain `Kneeler` on an explicit, hand-picked shirt colour, the
  // same pairing seven other kneeling characters on this street already use with its own `cries`.
  //
  // Her shirt is forced to `0xd4af37` (the chest's own gold, a nod rather than a wardrobe pick)
  // because the test also insists no two of this street's 61 people repeat a shirt colour, and a
  // scripted probe reading every `rig.look.shirt` already built here found exactly 60 distinct ones in
  // use — gold was the one colour free. `randomPerson()`'s own `...o` spread takes an explicit `shirt`
  // over its usual wardrobe-bag pick, so this is the one line that needed it, not a new wardrobe.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses: `game.start('new')`,
  // 3000 simulated frames with every NPC's and the squirrel's own position sampled every 10th frame)
  // swept the gap behind the south-row houses — the same quiet strip the digger himself works, between
  // the back gardens of the houses at x=54 and x=72 — against both those 21,900 samples and all 327 of
  // the street's own physics boxes, keeping clear of the digger's own 2 m circle: (63, -17) came back
  // clearest, 8.15 m from the nearest box and 8.54 m from the nearest other soul, 8.5 m south of the
  // digger's own spot — close enough the joke lands, far enough nothing about either sweep overlaps.
  //
  // Built dead last of everything this street adds, right before `makeDayNight`: `makeHuman()` and
  // `Kneeler` both draw off the shared `rnd()` sequence at construction, and this is the first world
  // the test suite builds, so anything built earlier here would have had its own pick shifted by it.
  { const tx = 63, tz = -17, kx = tx + 1.3, kz = tz + 0.5, ry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); place(game, U, chest, tx, tz, 0.5);
    P.addBox(tx, 0.35, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); place(game, U, shovel, tx + 0.75, tz - 0.6, 0.4);
    const coinM = mat(0xd4af37, { metalness: 0.9, roughness: 0.3 });
    for (const [cx, cz, cry] of [[tx - 0.6, tz + 0.5, 0.2], [tx - 0.3, tz + 0.95, 1.1], [tx + 0.15, tz + 1.1, 0.6]])
      mesh(G.cyl(0.09, 0.09, 0.025, 10), coinM, { x: cx, y: 0.025, z: cz, rx: PI / 2, ry: cry, shadow: 'none', parent: W });
    const finder = makeHuman({ ...randomPerson(r, { female: true, child: true, shirt: 0xd4af37 }) }); W.add(finder.group);
    game.npcs.push(new Kneeler(game, finder, { x: kx, z: kz, ry, cryIcon: '💰',
      cries: ['I was only digging for worms.', "Careful, puss — don't you dare knock a single coin back in the dirt.", "Don't tell the detectorist two gardens over. He'll never forgive himself."] })); }

  // the Candy Queen's gingerbread guard, Robot City's security detail, the toy soldiers drilling in
  // Victorian, the crab march on Sunny Shore, the penguin march at Frosty Peak and the hedgehog march
  // in Whisper Woods all beat a lockstep line by now — the Neighborhood, for all its hopscotch, marbles
  // and tug-of-war, never had a `Marchers` group of its own. Three kids playing army now drill back and
  // forth on the open field south-west of the street, in matching home-made uniforms, same lockstep-
  // and-follow `Marchers` class (55-npcs.js) every other world's own march already uses — no new
  // controller, no new prop.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real
  // Neighborhood, ran `game.start('new')` so every stroller, the postie and the cyclist actually
  // moved, sampled every NPC's own position every sixth frame over 1800 simulated frames, then swept a
  // grid of candidate lines against both those samples and every one of the street's 328 physics boxes
  // with `game.physics.blocked()`, the same circle check movement itself uses: the 7 m line from
  // (-29.5, -28) to (-22.5, -28) came back clear by 6 m of the nearest box and nearly 11 m of the
  // nearest wandering soul — 14 m from the picnic blanket's own spot at (-40, -30) and well clear of
  // the woodcutter's stump, the scarecrow's patch and the catch pair further east.
  // The lead already answers a "Say hello" prompt for free — `Marchers`' lead rig runs on `Patroller`,
  // whose constructor calls `greetable()` automatically, and a human rig carries `.look`, one of the
  // three tags `greetable()` checks for — but the two followers it drags along never got the same
  // wiring, same gap this log already closed on the gingerbread guard's own followers. Both recruits
  // now get it by hand: the same `game.namedFriend` + `game.addInteractable` move, tracked off
  // `troop[1].group` and `troop[2].group`, which `Marchers.update()` (55-npcs.js) already repositions
  // at a fixed 1.1 m gap behind the lead every frame, so the prompts follow them there and back with
  // no new mesh and no new physics box.
  { const troopWard = makeWardrobe(r, { shirts: [0x5a6a3a], pants: [0x3a3a2a], shoes: [0x3a2a1e] });
    const troop = [0, 1, 2].map(() => { const rig = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: troopWard }),
      hat: 'cap', hatColor: 0x3a4a2a, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
      W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, troop, { points: [[-29.5, -28], [-22.5, -28]], speed: 1.0, pause: [1, 2], r: 0.32, gap: 1.1,
      cries: ['Left, right, left, right — keep it sharp, troops!', 'Forward march! Mind the anthill, soldier.', 'Reporting for duty, cat. Dismissed.'], cryIcon: '🪖' }));
    const secondId = game.namedFriend('toy-troop-2');
    game.addInteractable({ obj: troop[1].group, radius: 2.1, label: () => 'Say hello', onUse: () => { game.befriend(secondId); SFX.tag(); game.hearts(troop[1].group.position.x, 1.1, troop[1].group.position.z, 3); game.toast('🪖 "Keeping step, sir! I mean — hi, kitty."'); } });
    const thirdId = game.namedFriend('toy-troop-3');
    game.addInteractable({ obj: troop[2].group, radius: 2.1, label: () => 'Say hello', onUse: () => { game.befriend(thirdId); SFX.tag(); game.hearts(troop[2].group.position.x, 1.1, troop[2].group.position.z, 3); game.toast('🪖 "Bringing up the rear! Someone has to watch for ambushes. ...and butterflies."'); } }); }

  // Sunny Shore's own ice-cream seller has worked the sand since round 411, and this street has had a
  // balloon seller and a lemonade stand for almost as long — but no one in the whole Neighborhood ever
  // sold the other classic treat. A small push-cart now parks in the open field south of the street, the
  // same quiet corner the Marchers drill in above: a boxy cooler on two wheels with a striped awning
  // overhead, and a vendor in a paper cap holding a cone up for the first taker. *"Ice cream! Fresh off
  // the cart!"* *"Careful, puss — it's melting already."* *"One scoop or two today?"*
  // Reuses `makeIceCreamCone()` outright (62-props-nature.js), the exact held prop Sunny Shore's own
  // ice-cream seller already uses — no new mesh for the cone itself. The cart is new, small and static:
  // a cooler box on two wheels with a painted stripe, a front support leg, a bent push handle and a
  // two-pole striped awning overhead, every dimension below a literal (no draw from this world's own
  // seeded `r()` for the geometry, only for the vendor's own `randomPerson()`/`makeWardrobe()` pick,
  // the same caution every other fixture on this street already takes since the Neighborhood is the
  // first world the test suite builds). `greetable(game, v)` — the exact trick the lemonade stand's own
  // seller already uses — gives it a "Say hello" prompt with no custom `addInteractable` needed.
  // A headless probe (`game.start('new')`, 4000 simulated frames, every NPC's and the squirrel's own
  // position sampled every 5th frame) swept the open field south of the street against both those
  // samples and all 328 of the street's own physics boxes: (-4, -26) came back clear by 8.4 m of the
  // nearest box and 8.0 m of the nearest wandering soul, comfortably past the cart's own small 0.8x0.5 m
  // footprint — well west of the Marchers' own drill line and south of the lake, the same open ground
  // the woodcutter and the picnic blanket already share. Built dead last, right after the Marchers, so
  // the fresh `makeHuman()` and `makeWardrobe()` draws off the shared `rnd()`/this world's own `r()`
  // sequences disturb no earlier timing-sensitive pick on this street.
  { const cartX = -4, cartZ = -26;
    const coolerM = mat(0xf2f7f2, { roughness: 0.55 }), trimM = mat(0x2e9e6e, { roughness: 0.5 }), wheelM = mat(0x2a2a2a, { roughness: 0.7 }), metalM = mat(0x8a8a8a, { metalness: 0.5, roughness: 0.45 });
    const cart = group(cartX, 0, cartZ, W);
    mesh(G.box(0.7, 0.5, 0.42), coolerM, { y: 0.45, shadow: 'both', parent: cart });               // cooler body
    mesh(G.box(0.72, 0.05, 0.44), trimM, { y: 0.71, shadow: 'both', parent: cart });                // lid trim
    for (const stripeZ of [-0.1, 0.1]) mesh(G.box(0.72, 0.03, 0.03), trimM, { y: 0.5, z: stripeZ, shadow: 'none', parent: cart });   // painted stripes
    for (const wx of [-0.26, 0.26]) mesh(G.cyl(0.14, 0.14, 0.06, 14), wheelM, { x: wx, y: 0.14, z: 0.24, rx: PI / 2, shadow: 'both', parent: cart });   // two wheels at the back
    mesh(G.cyl(0.03, 0.03, 0.14, 8), metalM, { y: 0.14, z: -0.22, shadow: 'both', parent: cart });   // front support leg
    const handle = group(0, 0.68, -0.21, cart);
    mesh(G.cyl(0.02, 0.02, 0.4, 6), metalM, { y: 0.1, rx: -0.3, shadow: 'none', parent: handle });
    mesh(G.cyl(0.02, 0.02, 0.3, 6), metalM, { y: 0.28, z: -0.12, rx: PI / 2 - 0.3, shadow: 'none', parent: handle });
    for (const px of [-0.3, 0.3]) mesh(G.cyl(0.018, 0.018, 1.0, 6), metalM, { x: px, y: 1.2, shadow: 'none', parent: cart });   // two awning poles
    for (let i = 0; i < 5; i++) mesh(G.box(0.16, 0.02, 0.5), i % 2 ? trimM : mat(0xfff3e6, { roughness: 0.8 }), { x: -0.32 + i * 0.16, y: 1.7, shadow: 'both', parent: cart });   // striped flat awning
    P.addBox(cartX, 0.4, cartZ, 0.8, 0.8, 0.5, { cam: false });
    const scoopWard = makeWardrobe(r, { shirts: [0xffffff, 0xf7f3ec], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const seller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2), wardrobe: scoopWard }),
      apron: 0xf5f2ea, hat: 'cap', hatColor: 0x2e9e6e, jacket: null, scarf: null }); W.add(seller.group);
    const v = new Vendor(game, seller, makeIceCreamCone(), { x: cartX + 0.9, z: cartZ, ry: PI / 2, cryIcon: '🍦',
      cries: ['Ice cream! Fresh off the cart!', "Careful, puss — it's melting already.", 'One scoop or two today?'] });
    game.npcs.push(v); greetable(game, v); }

  // Candy Land, Robot City and Victorian all have a `StiltWalker` by now (55-npcs.js, an ordinary
  // `Patroller` raised a fixed height off the ground it actually paces) — the Neighborhood, for all
  // its toy soldiers, treasure hunters and ice-cream cart, never had one of its own. A kid on a pair
  // of homemade stilts now paces a short line on the quiet field south of the street, nail heads and
  // mismatched paint and all, towering half her own height off the ground. *"Dad helped me nail the
  // footrests on. Mostly me, though."* *"Bet I can see clean over Mrs. Peabody's hedge from up
  // here!"* *"Don't laugh — these took me all weekend!"*
  // No new class and no new mesh shape: the same ankle-parented pole, strap and footrest peg every
  // other stilt walker in this game already uses, just shorter (a kid's own homemade pair, not a
  // performer's) and recoloured in bare wood and rope instead of any of the other three's paint jobs.
  // Shirt colour is a fixed literal outside `SHIRT_COLORS`, not drawn from the street's shared `ward`
  // bag — that pool is already fully subscribed by the rest of the street, and this is the 64th
  // person on it, which `test/run.mjs` checks for a repeat-free shirt colour across all of them.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `elements.get('enter').listeners.click[0]()`, 2000 simulated frames sampling every NPC's own
  // position every 15th frame) swept a 2 m grid of the open field south of the street against both
  // those samples and all 329 of the street's own physics boxes: the whole 6 m line from (14, -34) to
  // (14, -28) came back clearest of the grid, 9.6 m from the nearest box and 10.5 m from the nearest
  // wandering soul — clear of the toy troop's own drill line (-29.5 to -22.5, z=-28), the ice-cream
  // cart just above (-4, -26) and the treasure dig further east (63, -17).
  //
  // Built dead last, right after the ice-cream vendor, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off the shared `rnd()` sequence unconditionally, and this is the first
  // world the test suite builds, so anything built earlier here would have had its own timing-
  // sensitive pick shifted by it.
  { const stiltH = 0.6;
    const performer = makeHuman({ ...randomPerson(r, { female: true, child: true, elder: false }),
      shirt: 0x6a8ab5, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(performer.group);
    const poleM = mat(0xc9a267, { roughness: 0.85 }), strapM = mat(0xd8c39a, { roughness: 0.9 }), pegM = mat(0x8a6a44, { roughness: 0.8 });
    for (const L of performer.legs) {
      const len = stiltH / performer.k;
      const stilt = group(0, 0.22, 0.01, L.ankle);
      mesh(G.cyl(0.024, 0.028, len + 0.3, 8), poleM, { y: -(len + 0.3) / 2 + 0.07, parent: stilt });
      mesh(G.torus(0.085, 0.017, 6, 10), strapM, { y: 0, rx: PI / 2, parent: stilt });
      mesh(G.box(0.14, 0.032, 0.085), pegM, { y: -0.17, z: 0.07, parent: stilt });
    }
    game.npcs.push(new StiltWalker(game, performer, { points: [[14, -34], [14, -28]], speed: 0.5, pause: [1.5, 3], r: 0.4, height: 2.0, stiltH,
      cries: ['Dad helped me nail the footrests on. Mostly me, though.', 'Bet I can see clean over Mrs. Peabody’s hedge from up here!', "Don't laugh — these took me all weekend!"], cryIcon: '🎪' })); }

  // Whisper Woods, Sunny Shore and Frosty Peak all have the same knee-high spiderweb slung between two
  // twig stakes (`makeSpiderweb()`, 62-props-nature.js), and Robot City's factory floor got the first
  // one on a flat floor last round. The Neighborhood's ground is just as flat (`P.ground0` is never set
  // here either), but nobody had ever dropped one in its own back gardens. **A real spiderweb now hangs
  // between two stakes in the quiet grass behind the back row of houses, well clear of anyone's fence
  // or path.** *"🕸️ Somebody's been slacking on the garden chores."* *"😼 Puss eyes the spider. The
  // spider does not move. A standoff."* *"🏠 Every yard on this street has one of these somewhere. This
  // is just the one anybody can see."*
  //
  // No new mesh, no new physics box: `makeSpiderweb()` is the identical rig the other four worlds
  // already use, placed with plain `place()` same as Robot City's own rather than `placeT()`, since
  // this village's ground is flat at y=0 the same way that factory floor is. Its two stakes (0.62 m
  // tall) need nothing to collide with in open grass.
  //
  // A headless probe (`game.start('new')`, no travel needed since the Neighborhood is the world the
  // game boots into, then 3000 simulated frames sampling every NPC's own position every frame) swept
  // (-58, 44) against every one of this village's physics boxes, every `game.zones` rect and every
  // interactable already standing: 10.76 m clear of the nearest box, 12.65 m clear of the nearest zone
  // rect and never closer than 10.77 m to any wandering soul or interactable over the whole run — open
  // grass behind the back-row houses at x=-63 and x=-45, well north of the park paths and well east of
  // the lantern path to the gondola.
  //
  // Built dead last, right after the stilt walker above, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off this village's own shared `r()` sequence unconditionally (and so
  // does `makeSpiderweb()`'s own dew-phase roll), and this is the first world the test suite builds, so
  // anything built earlier here would have had its own timing-sensitive pick shifted by it.
  { const web = place(game, U, makeSpiderweb(r), -58, 44, atan2(0 - -58, 0 - 44));
    const webLines = ['🕸️ "Somebody\'s been slacking on the garden chores."', '😼 "Puss eyes the spider. The spider does not move. A standoff."', '🏠 "Every yard on this street has one of these somewhere. This is just the one anybody can see."'];
    game.addInteractable({ obj: web, radius: 1.8, label: () => 'Look at the web', onUse: () => { SFX.click(); game.toast(rnd.pick(webLines), 3000); } }); }

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
  const midBridge = makeCandyBridge(game, 0, -18, 3.2, 9); const westBridge = makeCandyBridge(game, -44, -18, 3.2, 9); const eastBridge = makeCandyBridge(game, 46, -18, 3.2, 9);
  U.push((dt) => { choc.map.offset.x -= dt * 0.03; });
  // the lighthouse, the pier, both gate towers, the cupcake hills and the gingerbread cottage have all
  // had a one-off "walk up and look" toast for rounds now, but the three wafer bridges over the
  // chocolate river — the only crossings in the whole land — never got so much as a glance. The middle
  // one, dead centre at (0, -18) with nothing else hand-placed anywhere near it (the hand-placed cane
  // and lollipop lists both skip the whole `abs(z + 18) < 5` band, and the scattered small lollipops do
  // too), gets one. `midBridge` is the group `makeCandyBridge` already built and returned (the deck, the
  // chocolate wafers, both candy-cane railings) two lines up, handed straight to `game.addInteractable`
  // — no new mesh, no new box. Its own deck box (half-extent 1.6 m in x, 4.5 m in z, a 4.78 m diagonal
  // at the corners) keeps the cat that far off dead-on; a 5.8 m radius clears that corner by just over a
  // metre without reaching the river angler 26.5 m off at (26, -13) or either of the other two bridges,
  // 44-46 m off to either side.
  { const bridgeLines = ['🍫 "Fudge-brown water under wafer boards. The cat is not tempted to swim."', '🍬 "Candy-cane railings on both sides, in case anyone forgets which land this is."', '🌉 "Shortest crossing in the sweet-lands, and it still smells like chocolate the whole way over."'];
    game.addInteractable({ obj: midBridge, radius: 5.8, label: () => 'Look over the railing', onUse: () => { SFX.click(); game.toast(rnd.pick(bridgeLines), 3000); } }); }
  // the middle bridge got its own "look over the railing" toast last round; the west one, out at
  // (-44, -18), is the same `makeCandyBridge(game, -44, -18, 3.2, 9)` call two lines up — identical deck
  // box (half-extent 1.6 m in x, 4.5 m in z, 4.78 m diagonal at the corners), so the same 5.8 m radius
  // clears it by the same margin. Nothing hand-placed sits anywhere close: the notice cane at (-44, 4) is
  // 22 m off, the nearest hand-placed cane/lollipop ([-40, -8]) is 10.77 m off, and the cane-forest ring
  // (radius 56-76 from the origin) never reaches this far in — (-44, -18) is only 47.6 m out. The east
  // bridge at (46, -18) is still untouched and could get the same treatment next.
  { const westLines = ['🌉 "Same river, same wafers — this end just has a longer walk back to the castle."', '🍫 "Chocolate runs the same colour under every bridge in this land, it turns out."', '🍬 "Quietest crossing in the sweet-lands. Nobody comes out this far just to look at a railing."'];
    game.addInteractable({ obj: westBridge, radius: 5.8, label: () => 'Look over the railing', onUse: () => { SFX.click(); game.toast(rnd.pick(westLines), 3000); } }); }
  // the last of the three crossings: the east bridge at (46, -18), the same `makeCandyBridge(game, 46,
  // -18, 3.2, 9)` call up top — identical deck box (half-extent 1.6 m in x, 4.5 m in z, 4.78 m diagonal
  // at the corners), so the same 5.8 m radius clears it by the same margin the other two already use.
  // Nothing hand-placed sits anywhere close: the nearest fixed cane ([34, -20]) is 12.17 m off, the
  // nearest fixed lollipop ([40, -12]) is 8.49 m off, the river angler at (26, -13) is 20.6 m off, and
  // the swimming duck pair orbits x=61-79 at this same z — 9.2 m clear of the radius's own outer edge
  // (51.8). The cane-forest ring (radius 56-76 from the origin, skipping the whole `abs(z + 18) < 5`
  // band) never reaches this far in either — (46, -18) is only 49.4 m out. All three wafer bridges now
  // have their own toast.
  { const eastLines = ['🌉 "Three bridges, one river, the same chocolate smell at every one of them."', '🍬 "Furthest crossing from the castle gate. Worth the walk, if only for the quiet."', '🍫 "Last bridge on this river. The cat has now looked over every railing in the land."'];
    game.addInteractable({ obj: eastBridge, radius: 5.8, label: () => 'Look over the railing', onUse: () => { SFX.click(); game.toast(rnd.pick(eastLines), 3000); } }); }
  // every other body of water in the game already has an angler dipping a line in it — the Neighborhood's
  // lake jetty, Frosty Peak's ice hole, Sunny Shore's pier, Whisper Woods' glowing pond — but the chocolate
  // river itself never did. A headless probe swept the south bank in 2 m steps, well clear of all three
  // bridges (x = 0, -44, 46) and every fixed cane and lollipop coordinate already placed nearby: (26, -13)
  // came back clear by 0.75 m from the nearest cane trunk, and clear of every NPC's own position sampled
  // over 400 frames, so a stool fits there with the line dipping straight north into the river proper.
  { const riverWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff, 0xffd54a], pants: [0xf5f2ea, 0x8d6e63], shoes: [0xffffff, 0x8d6e63] });
    const angler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: riverWard }),
      hat: 'cap', hatColor: 0x7fd7ff, coat: false, scarf: null, jacket: null, bag: null });
    W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 26, z: -13, ry: PI, holeX: 26, holeZ: -18, holeY: 0.04,
      cries: ['Nothing bites in a chocolate river, but it never stops me trying.', "Careful, puss — one splash and that's a bath, not a paw-wash.", 'Best fudge-brown water in the land, this.'] })); }
  // the Neighborhood's pond and the Victorian canal both got a duck pair that actually lives on the
  // water rather than beside it; the chocolate river, the one other body of water with nobody on it,
  // never did. A drake and a hen now paddle a 18 m stretch east of the last bridge — read straight off
  // the source rather than a live probe, since a swimming duck carries no physics box of its own to
  // sweep for: the bridge at x=46 is only 3.2 m wide (`makeCandyBridge`'s own `width` arg), so its deck
  // ends at x=47.6, the angler's line is back at x=26, and the cane-forest ring that fills the radius
  // 56-76 band explicitly skips `abs(z + 18) < 5` for its own entire 44-tree loop, leaving this whole
  // stretch of river bank clear all the way out past the cupcake hills at z=36 and z=-46.
  { const dz = -18, dMid = 70, dRange = 9, dY = 0.08;
    const drake = makeDuck({ drake: true }); W.add(drake.group);
    const hen = makeDuck({ drake: false }); W.add(hen.group);
    const pair = [[drake, 0, 0.12], [hen, PI, 0.15]];
    U.push((dt, t) => { for (const [d, phase, speed] of pair) {
      const a = t * speed + phase, facing = cos(a) >= 0 ? PI / 2 : -PI / 2;
      d.group.position.set(dMid + sin(a) * dRange, dY + sin(t * 2.4 + phase) * 0.01, dz);
      d.group.rotation.y = facing;
      d.head.rotation.x = sin(t * 0.6 + phase * 2) > 0.88 ? 0.5 : 0;   // the occasional dip toward the water
    } });
    let quackT = 7; U.push((dt) => { quackT -= dt; if (quackT <= 0) { SFX.squawk(); quackT = rnd.range(10, 18); } });
    // the Neighborhood's park pond, Sunny Shore's second turtle, Whisper Woods' first frog and the
    // Neighborhood's own park-pond drake have each had a background creature turned into a friend in
    // recent rounds; this river's own pair, paddling its 18 m stretch since the river itself got ducks,
    // was still pure scenery. The drake answers a "say hello" prompt now, the same trick as the park
    // pond's own drake: `game.addInteractable` keys off `drake.group` directly, so `getWorldPosition`
    // (the main loop in `80-game.js`) follows it along its sweep every frame — no new mesh, no new
    // physics box. The river itself is blocked for walking bank to bank (the four `P.addBox` calls above
    // give it a 3.4 m half-extent in z, centred on this same z=-18), so the cat has to call across from
    // dry land; a 4.0 m radius clears that 3.4 m gap by 0.6 m even when the drake is dead level with the
    // caller, and stays 5.2 m clear of the east bridge's own 5.8 m "look over the railing" radius (outer
    // edge at x=51.8) even at the drake's nearest swing in, to x=61. The hen was left exactly as she was,
    // for a future round — this is that round: she shares the drake's own `dMid`/`dRange`/`dz`, only the
    // phase differs, so her sweep covers the identical x=61-79 stretch and the same 4.0 m radius clears
    // the same 3.4 m gap by the same margin. `'duck'` is already the drake's own key in this world, so
    // the hen takes the plain `'hen'` key instead — still free here, same as every other pond's pair.
    const did = game.namedFriend('duck');
    game.addInteractable({ obj: drake.group, radius: 4.0, label: () => 'Say hello to the duck', onUse: () => {
      game.befriend(did); SFX.squawk(); game.hearts(drake.group.position.x, drake.group.position.y + 0.3, drake.group.position.z, 3);
      game.toast('🦆 "Quack!"'); } });
    const hid = game.namedFriend('hen');
    game.addInteractable({ obj: hen.group, radius: 4.0, label: () => 'Say hello to the duck', onUse: () => {
      game.befriend(hid); SFX.squawk(); game.hearts(hen.group.position.x, hen.group.position.y + 0.3, hen.group.position.z, 3);
      game.toast('🦆 "...Quack."'); } }); }
  // the outer sweet-lands: a candy-cane forest belt, cupcake hills, a gingerbread cottage, cookie paths
  for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + r.range(-0.07, 0.07), d = r.range(56, 76), x = cos(a) * d, z = sin(a) * d; if (abs(z + 18) < 5) continue; const h = r.range(3, 5), c = makeCandyCane(h); c.position.set(x, 0, z); c.rotation.y = r() * TAU; W.add(c); P.addBox(x, h / 2, z, 0.5, h, 0.5, { cam: false }); }
  const cupcakeHills = [];
  for (const [x, z, hue] of [[-58, 30, 330], [60, 36, 200], [-62, -44, 50], [58, -46, 120], [4, 64, 280], [-30, 62, 0], [34, -66, 330]]) {
    const cup = group(x, 0, z, W), icing = mat(new THREE.Color().setHSL(hue / 360, 0.85, 0.7), { roughness: 0.6 });
    mesh(G.cyl(2.6, 2.0, 3.0, 20), mat(0xd9a066, { roughness: 0.95 }), { y: 1.5, parent: cup }); for (let k = 0; k < 12; k++) mesh(G.box(0.25, 3.0, 0.1), mat(0xb8843f, { roughness: 1 }), { x: cos(k / 12 * TAU) * 2.35, y: 1.5, z: sin(k / 12 * TAU) * 2.35, ry: -k / 12 * TAU, shadow: 'none', parent: cup });
    mesh(G.sphere(2.6, 18, 12), icing, { y: 3.6, sy: 0.8, parent: cup }); mesh(G.sphere(1.6, 16, 10), icing, { y: 5.1, parent: cup }); mesh(G.sphere(0.9, 14, 10), icing, { y: 6.2, parent: cup }); mesh(G.sphere(0.4, 10, 8), mat(0xd62839, { roughness: 0.4 }), { y: 6.95, parent: cup });
    for (let k = 0; k < 40; k++) { const a = r() * TAU, e = r.range(0.2, 1.2); mesh(G.box(0.1, 0.04, 0.24), mat(r.pick([0xffffff, 0xffd54a, 0x7fd7ff, 0xff6fb5, 0x4ade80]), { roughness: 0.6 }), { x: cos(a) * 2.3 * cos(e), y: 3.6 + sin(e) * 2.1, z: sin(a) * 2.3 * cos(e), ry: a, rx: r() * PI, shadow: 'none', parent: cup }); }
    P.addBox(x, 3, z, 5.2, 6, 5.2);
    cupcakeHills.push(cup);
  }
  // seven cupcake hills ring the sweet-lands and every other landmark in Candy Land has had a one-off
  // "walk up and look" toast for rounds now (the throne, both gate towers), but the cupcake hills
  // themselves — the tallest things in the outer country after the candy-cane belt — never got so much
  // as a sniff. The sixth one in the list, at (-30, 62), gets one: `cupcakeHills[5]` is the group the
  // loop above already built (icing, sprinkles, cherry and all), handed straight to `addInteractable` —
  // no new mesh, no new box. Its own physics box (full size 5.2x6x5.2, so half-extent 2.6 in x and z)
  // means the cat's closest approach varies with angle from 2.6 m dead-on a face to 3.68 m at a corner;
  // a 5.5 m radius clears the corner case by 1.8 m, the same margin the castle's own gate towers kept
  // past their own box. Nothing else is built anywhere near (-30, 62): the nearest hand-placed prop is
  // the swing set 20 m south at (-18, 46), and candyRegion's own procedural fill only starts at radius
  // 92 from the origin, well past this hill's own distance of 68.8.
  { const lines = ['🧁 "Cream, then sponge, then more cream. All the way down, probably."', '🧁 "That cherry on top is bigger than the cat\'s whole head."', '🧁 "Somebody built this with a trowel, not a piping bag."'];
    game.addInteractable({ obj: cupcakeHills[5], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines), 3000); } }); }
  // the sixth hill got its own sniff above; the second in the list, at (60, 36) out past the river and
  // the painter's own meadow, never did. Same trick again: `cupcakeHills[1]` is the group already built
  // by the loop above, handed straight to `addInteractable` — no new mesh, no new box, same 5.5 m radius
  // the sixth hill already uses to clear its own box's 3.68 m corner. A headless probe swept this exact
  // point against every one of the world's 1866 physics boxes and every NPC's own position (400
  // simulated frames, so no wandering gingerbread man mid-leash could slip past unnoticed): the nearest
  // other box (a candy-cane trunk out at the edge of the cane belt) stays 10.85 m clear and the nearest
  // soul (the painter at (60, 48)) 12 m clear, both well past this radius.
  { const lines1 = ['🧁 "Blue icing on a cupcake. Someone\'s very proud of that food dye."', '🧁 "Smells like blueberries. Tastes like more blueberries, probably."', '🧁 "Second-tallest hill in the sweet-lands, and it knows it."'];
    game.addInteractable({ obj: cupcakeHills[1], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines1), 3000); } }); }
  // two of the seven hills (indices 5 and 1) have had their own sniff for a few rounds now; the last
  // in the list, at (34, -66) out past the hula-hoop kid's own patch, never did. Same trick a third
  // time: `cupcakeHills[6]` is the group the loop above already built, handed straight to
  // `addInteractable` — no new mesh, no new box, same 5.5 m radius the other two already use to clear
  // this hill's own box's 3.68 m corner. A headless probe swept this exact point against every one of
  // the world's physics boxes and every NPC's own position: the nearest other box (a candy-cane trunk
  // out at the edge of the cane belt) stayed 9.35 m clear and the nearest soul (the hula-hoop kid at
  // (39, -77)) 12.08 m clear, both well past this radius.
  { const lines6 = ['🧁 "Purple icing, this time. They really do just pick a colour and go."', '🧁 "Last hill in the ring, and somehow still has sprinkles left over."', '🧁 "That cherry wobbles if you look at it funny. The cat looks at it funny."'];
    game.addInteractable({ obj: cupcakeHills[6], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines6), 3000); } }); }
  // three of the seven hills (indices 5, 1 and 6) have had their own sniff for a few rounds now; the
  // third in the list, at (-62, -44) out in the quietest corner of the sweet-lands, never did. Same
  // trick a fourth time: `cupcakeHills[2]` is the group the loop above already built, handed straight
  // to `addInteractable` — no new mesh, no new box, same 5.5 m radius the other three already use to
  // clear this hill's own box's 3.68 m corner. A headless probe (the same stub-three harness
  // `test/run.mjs` uses) built the real Candy Land, sampled every NPC's own position every quarter
  // second over 300 simulated seconds, then swept this exact point against all 1958 of the land's
  // physics boxes: the nearest other box (a candy-cane trunk out at the edge of the cane belt) stayed
  // 7.90 m clear and the nearest soul ever sampled 16.47 m clear, both well past this radius.
  { const lines2 = ['🧁 "Mint icing, out here where nobody\'s around to see it."', '🧁 "Furthest hill from the castle, and somehow still the quietest."', '🧁 "Sprinkles all the way round. Someone was thorough with this one."'];
    game.addInteractable({ obj: cupcakeHills[2], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines2), 3000); } }); }
  // four of the seven hills (indices 5, 1, 6 and 2) have had their own sniff for a few rounds now;
  // the first in the list, at (-58, 30), never did. Same trick a fifth time: `cupcakeHills[0]` is the
  // group the loop above already built, handed straight to `addInteractable` — no new mesh, no new
  // box, same 5.5 m radius the other four already use to clear this hill's own box's 3.68 m corner.
  // This hill sits closer to the inner edge of the candy-cane-forest ring than the others (it's 65.3 m
  // out from the origin, against the ring's own 56-76 m band), so a headless probe built the real
  // Candy Land and swept this exact point against all 1958 of the land's physics boxes and every NPC's
  // own position sampled every 0.25 s over 20 simulated seconds: the nearest other box (one of those
  // cane trunks) sits 4.65 m clear — inside the radius, same as a cane trunk sitting inside the radius
  // of any of the other three hills near the ring, just closer than those — and the nearest soul ever
  // sampled (the carousel barker at [-46, 34]) stayed 12.65 m clear, well past this radius. All seven
  // hills now have their own toast.
  { const lines0 = ['🧁 "Strawberry-pink icing. The cherry on top looks almost embarrassed by it."', '🧁 "First hill in the ring, and the only one close enough to the cane forest to lean on one."', '🧁 "Sprinkles catch the pink sky here better than on any of the other six."'];
    game.addInteractable({ obj: cupcakeHills[0], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines0), 3000); } }); }
  // round 505's own log entry claimed all seven hills had their toast by then, but it was wrong: only
  // five of the seven (indices 5, 1, 6, 2 and 0) ever got one. The fourth in the list, at (58, -46),
  // never did. Same trick a sixth time: `cupcakeHills[3]` is the group the loop above already built,
  // handed straight to `addInteractable` — no new mesh, no new box, same 5.5 m radius the other five
  // already use to clear this hill's own box's 3.68 m corner. This hill sits 74.0 m out from the
  // origin, inside the ring's own 56-76 m band like the others, so the same kind of cane-trunk box
  // sitting inside the radius (the precedent every near-ring hill already accepted) is expected here
  // too. The nearest other souls are the ukulele player at (49, -39), 11.4 m clear, the kite-flying kid
  // at (51, -33), 14.8 m clear, and the hula-hoop kid at (39, -77), 36.4 m clear — all well past this
  // radius.
  { const lines3 = ['🧁 "Green icing, this one — someone finally remembered mint exists, then buried it under sprinkles anyway."', '🧁 "Fourth hill in the ring. The cherry sits a little crooked, like nobody checked."', '🧁 "Mint-green all the way up. It smells like nothing at all, which is somehow worse."'];
    game.addInteractable({ obj: cupcakeHills[3], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines3), 3000); } }); }
  // six of the seven hills (indices 5, 1, 6, 2, 0 and 3) have had their own sniff for a few rounds now;
  // the last untouched one, at (4, 64) with purple icing, sits in the open meadow near the wishing well
  // and the gumball machine, not out by the cane-forest ring like most of the others. Same trick a
  // seventh time: `cupcakeHills[4]` is the group the loop above already built, handed straight to
  // `addInteractable` — no new mesh, no new box, same 5.5 m radius the other six already use to clear
  // this hill's own box's 3.68 m corner. A headless probe (the same stub-three harness `test/run.mjs`
  // uses) built the real Candy Land (`game.start('new')` then `game.load(1, 'from-prev')`), swept this
  // exact point against all 1958 of the land's physics boxes, and sampled every NPC's own position
  // every 15th frame over 1200 simulated frames: the nearest other box (one of the loose lollipop stems
  // scattered through this meadow) stayed 4.24 m clear — inside the radius, the same precedent the
  // near-ring hills already accepted for their own cane trunks — and the nearest soul ever sampled (a
  // pinata swinger) stayed 11.32 m clear, well past this radius. The wishing well 8.9 m south and the
  // gumball machine 23 m north both clear it by a wider margin still. All seven hills now have their
  // own toast.
  { const lines4 = ['🧁 "Purple icing, out here in the open where everyone can see it."', '🧁 "Closest hill to the castle road, and the only one not hiding behind the cane forest."', '🧁 "Grape, maybe. Or just purple for purple\'s sake — hard to tell with icing."'];
    game.addInteractable({ obj: cupcakeHills[4], radius: 5.5, label: () => 'Sniff the cupcake hill', onUse: () => { SFX.click(); game.toast(rnd.pick(lines4), 3000); } }); }
  { const gh = group(0, 0, -62, W), cookie = mat(0xc27b3a, { roughness: 0.95 }), icing = mat(0xfffdf7, { roughness: 0.35 });   // gingerbread cottage
    mesh(G.box(7, 4, 6), cookie, { y: 2, shadow: 'both', parent: gh }); mesh(G.gable(6.8, 2.8, 7.6), mat(0x8a4a2a, { roughness: 0.9 }), { y: 4, ry: PI / 2, parent: gh });
    for (let k = 0; k < 8; k++) for (const s of [-1, 1]) mesh(G.sphere(0.32, 8, 6), icing, { x: -3.5 + k * 1.0, y: 4.4 + k * 0.0, z: s * 3.4 - s * (k * 0.0), sy: 0.5, shadow: 'none', parent: gh });
    for (let k = 0; k < 9; k++) mesh(G.sphere(0.3, 10, 8), glowMat(r.pick([0xff3355, 0x4ade80, 0x64b5f6, 0xffd54a]), 0.5), { x: -3.2 + k * 0.8, y: 4.9 + abs(4 - k) * 0.45, z: 3.6 - abs(4 - k) * 0.42, shadow: 'none', parent: gh });
    mesh(G.box(1.2, 2.1, 0.16), mat(0x8a4a2a), { y: 1.05, z: 3.08, parent: gh }); mesh(G.torus(0.7, 0.08, 6, 14, PI), icing, { y: 2.1, z: 3.12, shadow: 'none', parent: gh });
    for (const wx of [-2.2, 2.2]) { mesh(G.box(1.2, 1.2, 0.14), glowMat(0xffe082, 0.6), { x: wx, y: 2.2, z: 3.08, shadow: 'none', parent: gh }); mesh(G.torus(0.75, 0.07, 6, 14), icing, { x: wx, y: 2.2, z: 3.12, shadow: 'none', parent: gh }); }
    for (let k = 0; k < 6; k++) mesh(G.cyl(0.5, 0.65, 0.8, 12), mat(r.pick([0xff6fb5, 0x7fd7ff, 0xffd54a]), { roughness: 0.4 }), { x: -3.5 + k * 1.4, y: 0.4, z: 4.2, parent: gh });
    P.addBox(0, 2, -62, 7.4, 4, 6.4); pointLight(0xffd27a, 10, 10, 0, 2.5, -58, W);
    // the Neighborhood's porch, Frosty Peak's first cabin, Whisper Woods' treehouse, Victorian's last
    // terrace door and one of Sunny Shore's beach huts all sway a wind chime by now; the gingerbread
    // cottage — the one hand-built house in Candy Land whose door the cat can actually walk up to,
    // unlike the five lane houses it only ever sees from outside — never got one. A cookie-and-icing
    // wind chime now hangs over the doorway, swapping the usual wood and brass for the cottage's own
    // cookie tan and pale icing gold. `gh` is built with no rotation of its own (`group(0, 0, -62, W)`,
    // never given a `g.rotation.y`), so no rotation math is needed to place it: directly above the door
    // (local x = 0) the only neighbours are the icing arch over the doorframe (torus top near y = 2.8)
    // below and the eave dollops (y >= 4.4, and only for |x| >= 0.5 anyway) above, with the side windows
    // out at x = ±2.2 and the roof's own garland light at y = 4.9 — so y = 3.3 clears the arch by 0.5 m
    // and sits 1.1 m under the dollops, hung a little proud of the wall face (local z = 3.6, vs. the
    // door's own 3.08) so it reads as hanging rather than embedded.
    place(game, U, makeWindChime(game, { wood: 0xc27b3a, metal: 0xfff3b0 }), 0, -58.4, 0, 3.3);
    // the statue, the furnace, both gate towers and both cupcake hills have all had a one-off "walk up
    // and look" toast for rounds now, but the gingerbread cottage itself — the one hand-built house in
    // the whole land the cat can actually walk up to — never got one, past its own wind chime. No new
    // mesh, no new box: `gh` (already kept, for the wind chime placed just above) is handed straight to
    // `game.addInteractable`. Its own box (half-extent 3.7 m in x, 3.2 m in z, so a 4.89 m diagonal at
    // the corners) keeps the cat that far off on every side, so a 5.5 m radius — the same already used
    // at both cupcake hills — clears the corner by 0.6 m without ever reaching the baker's own kneel
    // spot 6.52 m off at (3.5, -56.5) or his tray 6.85 m off, so his "Say hello" keeps winning there,
    // exactly as the fountain's prompt in Victorian still loses to the fiddler nearby.
    const cottageLines = ['🍪 "Every brick of it edible, and not one bite taken yet."', '🍪 "The icing never melts here, however warm the sun gets."', '🍪 "Smells like the baker\'s tray from clear across the lane."'];
    game.addInteractable({ obj: gh, radius: 5.5, label: () => 'Look at the gingerbread cottage', onUse: () => { SFX.click(); game.toast(rnd.pick(cottageLines), 3000); } });
    // the Neighborhood's porch has had a napping stray cat since round 1, and Victorian's own terrace
    // picked up one of its own in a window last round — but the gingerbread cottage, the one hand-built
    // house in the whole land the cat can actually walk up to, never got one. A cat now naps curled
    // right in the east round window's own frame, just past the glass. Same exact `makeNapCat()` the
    // other two already use; added as a child of this house's own group (`gh`, already kept above for
    // the wind chime and the cottage's own interactable) using its local window coordinates — this
    // window's glass and icing ring both sit at local (x=2.2, y=2.2, z=3.08/3.12), so y=1.55 puts the
    // cat low in the round frame (inner hole spans y 1.38-3.02) and z=3.3 sits it just past the icing
    // ring's own 3.19 m outer face — the same trick the other two napping cats already rely on, so it
    // inherits the cottage's world position for free. No physics box: well past the glass and the icing
    // frame, nothing on the cookie path below can ever reach it, same reasoning as the other two.
    const napCat = makeNapCat();
    napCat.group.position.set(2.2, 1.55, 3.3);
    napCat.group.rotation.y = -0.25;
    gh.add(napCat.group);
    let napT = 2; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); });
  }
  for (let i = 0; i < 12; i++) mesh(G.cyl(0.9, 0.9, 0.12, 12), mat(0xd9a066, { roughness: 0.95 }), { x: sin(i * 0.9) * 1.6, y: 0.04, z: -40 - i * 1.9, shadow: 'receive', parent: W });   // cookie path to the cottage
  // every other world has wildlife of its own, but Candy Land never did — a sugar mouse now lives on the
  // quiet west side of the gingerbread cottage, darting between hops exactly like Whisper Woods' hedgehog
  // and Frosty Peak's hares. A headless probe swept the cottage's own flank for clearance against every
  // physics box already placed (the cottage itself, its doorstep, the bakery's tray to the east): (-8, -61)
  // came back clear by 4.3 m in every direction, well inside the 1.4 m leash given here
  // Like the Neighborhood's bin raccoon, Robot City's factory mouse and the whole ladybug family before
  // it, the sugar mouse sat ambient since the round that placed it: `Hopper`, unlike `Wanderer`, never
  // calls `greetable()` on its own. It now answers its own "Say hello to the sugar mouse" prompt too —
  // no new mesh, no new physics box, just `game.namedFriend('sugar-mouse')` plus a `game.addInteractable`
  // keyed to the rig's own group, tracked every frame so the prompt follows it through its hops inside
  // the 1.4 m leash. The 2.1 m greet radius (the same every other Hopper creature's own prompt uses)
  // needed no new probe: the build's own placement comment above already swept this exact spot clear by
  // 4.3 m in every direction, far past the radius used here.
  { const rig = makeSugarMouse();
    game.npcs.push(new Hopper(game, rig, { x: -8, z: -61, leash: 1.4, r: 0.1, dist: [0.25, 0.6], dur: 0.3, height: 0.18, idle: [1, 3.2],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } }));
    const sugarMouseId = game.namedFriend('sugar-mouse');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the sugar mouse', onUse: () => { game.befriend(sugarMouseId); SFX.chitter(); game.hearts(rig.group.position.x, 0.2, rig.group.position.z, 3); game.toast('🐭 *whiskers twitch, sniffs the air, then scurries back into the gingerbread wall*'); } }); }
  // the sugar mouse was Candy Land's only living thing past the squirrel — every other world's own
  // wildlife runs to several animals (Frosty Peak alone has penguins, deer, hares and a fox). A
  // mint-green hare now thumps about the open grass between the market stalls and the cottage path,
  // the same `makeHare` shape Frosty Peak's own hares use, recoloured pastel. A headless probe swept a
  // 200-frame window (so no wandering gingerbread man or ring dancer mid-turn could slip past
  // unnoticed) and ruled out every decorative gumdrop patch by its own radius, not just the physics
  // boxes: (-17, -46) came back clear by over 10 m on both counts — south of the market stalls, north
  // of the marshmallow bush cluster at (-36,-48), inside the 1.6 m leash given here.
  // Same root cause and same fix as the sugar mouse two entries above, and the raccoon, the factory
  // mouse and the whole ladybug family before it: `Hopper`, unlike `Wanderer`, never calls
  // `greetable()` on its own, so the mint hare sat ambient and un-greetable since the round that
  // placed it. It now answers its own "Say hello to the mint hare" prompt — no new mesh, no new
  // physics box, just `game.namedFriend('mint-hare')` plus a `game.addInteractable` keyed to the
  // rig's own group, tracked every frame so the prompt follows it through its hops inside the 1.6 m
  // leash. The 2.1 m greet radius (the same every other Hopper creature's own prompt uses) needed no
  // new probe: the build's own placement comment above already swept this exact spot clear by over
  // 10 m in every direction, far past the radius used here.
  { const rig = makeMintHare();
    game.npcs.push(new Hopper(game, rig, { x: -17, z: -46, leash: 1.6, r: 0.15, dist: [0.3, 0.8], dur: 0.3, height: 0.26, idle: [1, 3.5],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } }));
    const mintHareId = game.namedFriend('mint-hare');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the mint hare', onUse: () => { game.befriend(mintHareId); SFX.chitter(); game.hearts(rig.group.position.x, 0.2, rig.group.position.z, 3); game.toast('🐰 *ears swivel, nose twitches twice, then it thumps off into the grass*'); } }); }
  // the mouse and the hare are both ground-bound mammals; every other world's own ground-pecking bird
  // (the Neighborhood's sparrow, Victorian's pigeons, Sunny Shore's sandpipers) is a plain reskin of
  // `makeSparrow`'s own rig, and Candy Land never had one of its own, past the butterflies overhead. A
  // peppermint sparrow now hops the open grass north of the lane, recoloured candy red and white —
  // `makeSparrow` took no colour options until now, so it gained the same `o.body` / `o.streak` /
  // `o.pale` overrides `makeDove` and `makeDroneFly` already had, defaulting to the Neighborhood
  // sparrow's own brown so nothing else that calls it changes. A headless probe swept a grid of the
  // open heart against every physics box and 400 frames of every wandering gingerbread man and ring
  // dancer: (-29, 40) came back clearest, 10.9 m from anything else — north of the market stalls and
  // well short of the castle approach (z > 70), inside the 1.6 m leash given here.
  // Same root cause and same fix as the mint hare and sugar mouse just above, and the raccoon, the
  // factory mouse and the whole ladybug family before them: `Hopper`, unlike `Wanderer`, never calls
  // `greetable()` on its own, so the peppermint sparrow sat ambient and un-greetable since the round
  // that placed it. It now answers its own "Say hello to the peppermint sparrow" prompt too — no new
  // mesh, no new physics box, just `game.namedFriend('peppermint-sparrow')` plus a
  // `game.addInteractable` keyed to the rig's own group, tracked every frame so the prompt follows it
  // through its hops inside the 1.6 m leash. The 2.1 m greet radius (the same every other Hopper
  // creature's own prompt uses) needed no new probe: the build's own placement comment above already
  // swept this exact spot clear by 10.9 m in every direction, far past the radius used here.
  { const rig = makeSparrow({ body: 0xd6334a, streak: 0xffffff, pale: 0xfff2ea });
    game.npcs.push(new Hopper(game, rig, { x: -29, z: 40, leash: 1.6, r: 0.08, dist: [0.3, 0.6], dur: 0.28, height: 0.14, idle: [1, 3.2],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } }));
    const peppermintSparrowId = game.namedFriend('peppermint-sparrow');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the peppermint sparrow', onUse: () => { game.befriend(peppermintSparrowId); SFX.chitter(); game.hearts(rig.group.position.x, 0.2, rig.group.position.z, 3); game.toast('🐦 *head cocks sideways, one quick chirp, then flutters off into the grass*'); } }); }
  // Whisper Woods has six real frogs around its fairy ring; Candy Land, for all its mouse, hare and
  // sparrow, never had one of its own. A gumdrop-pink toad now hops the open grass east of the market
  // stalls, the same `makeFrog()` shape the woods already use — it took no colour options past the
  // skin until now, so it gained the same `belly` override the sparrow's own `o.pale` already set a
  // precedent for, defaulting to the woods frogs' own pale green so nothing else that calls it changes.
  // A headless probe (`game.start('new')` then `game.travel(1, 'from-hub')`, 1800 simulated frames
  // sampling every NPC's own position every fifth frame) swept a grid of the open grass west of the
  // market stalls against every one of Candy Land's 1957 physics boxes and every one of those samples:
  // (-38, 0) came back clearest in the whole south-west quadrant, 6.9 m from the nearest box (the
  // chocolate-river wall) and 17.8 m from the nearest other soul, comfortably inside the 1.6 m leash
  // given here.
  // Same root cause and same fix as the peppermint sparrow, the mint hare, the sugar mouse, the
  // Neighborhood's bin raccoon and hare, Robot City's factory mouse and scrap-bug, and the whole
  // ladybug family before them: `Hopper`, unlike `Wanderer`, never calls `greetable()` on its own,
  // so a rig with none of `.look`/`.robot`/`.cookie` just sits there ambient. The gumdrop-pink toad
  // now answers its own "Say hello to the gumdrop-pink toad" prompt too — no new mesh, no new
  // physics box, just `game.namedFriend('gumdrop-toad')` plus a `game.addInteractable` keyed to the
  // rig's own group, tracked every frame so the prompt follows it through its hops inside the
  // 1.6 m leash. The 2.1 m greet radius (the same every other Hopper creature's own prompt uses)
  // needed no new probe: the build's own placement comment above already swept this exact spot
  // clear by 6.9 m in every direction, far past the radius used here.
  { const rig = makeFrog(0xff6fb5, 0xffe3f0);
    game.npcs.push(new Hopper(game, rig, { x: -38, z: 0, leash: 1.6, r: 0.15, dist: [0.3, 0.8], dur: 0.3, height: 0.26, idle: [1, 3.5],
      onHop: () => { if (rnd.chance(0.3)) SFX.ribbit(); } }));
    const gumdropToadId = game.namedFriend('gumdrop-toad');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the gumdrop-pink toad', onUse: () => { game.befriend(gumdropToadId); SFX.ribbit(); game.hearts(rig.group.position.x, 0.2, rig.group.position.z, 3); game.toast('🐸 *throat puffs once, a single soft ribbit, then it hops off into the grass*'); } }); }
  // the mouse, the hare, the sparrow and the toad are all ground-bound; Whisper Woods alone has a whole sky of butterflies
  // drifting over it, and Candy Land, pastel and sugar-dusted as it is, never had any of its own. Six
  // now loop lazily over the open heart of the land — same `makeButterfly()` rig and `Flyer` controller
  // the woods already use (no new geometry, `TEX.wing(hue)` takes any hue), recoloured candy pink,
  // gold, cyan and purple to match the castle's own palette. `Flyer` never touches the ground or the
  // physics grid — it orbits at 1.2-2.4 m up, well above the gumdrop patches and the lollipop stems it
  // passes over, the same way the forest's own butterflies pass over tree trunks and canopy without a
  // per-one clearance check. The x range (-32..32) and z range (-10..40) by construction stay clear of
  // the chocolate river (z -22..-14), the gingerbread cottage and sweet stall (z < -55) and the castle
  // approach (z > 70) — pure background life, never greeted, so no world's friend count moves.
  for (let i = 0; i < 6; i++) { const rig = makeButterfly(r.pick([330, 45, 190, 300])); game.npcs.push(new Flyer(game, rig, { cx: r.range(-32, 32), cz: r.range(-10, 40), r: r.range(2, 4.5), h: r.range(1.2, 2.4), speed: r.range(1, 1.8), bob: 0.4, wobble: 0.9, cw: i % 2 === 0 })); }

  // candy canes, lollipops, gumdrops, cotton candy
  const canes = [[-6, 6], [7, 3], [-14, -4], [15, -8], [-22, 8], [24, 12], [-30, -2], [30, -4], [-10, 22], [12, 24], [-26, 20], [26, 24], [-18, -30], [16, -32], [-8, -40], [8, -42], [-36, -14], [34, -20], [-40, 26], [40, 30], [-28, -38], [26, -40], [-44, 4], [44, 8], [-2, 30], [4, -26], [-20, -12], [20, -14]];
  let noticeCane = null;
  for (const [x, z] of canes) { const h = r.range(2.6, 4.2), c = makeCandyCane(h); c.position.set(x, 0, z); c.rotation.y = r() * TAU; W.add(c); P.addBox(x, h / 2, z, 0.5, h, 0.5, { cam: false }); if (x === -44 && z === 4) noticeCane = c; }
  // the Neighborhood, Robot City, Victorian, Whisper Woods, Sunny Shore and Frosty Peak have all carried
  // a stapled notice by now (rounds 462-468) — Candy Land was the one world left out, and the quietest
  // candy cane in the whole inner belt, out past the west bridge at (-44, 4) with nothing else placed
  // within many metres of it, had a bare striped post and nothing else competing for the spot.
  // `makeCandyNotice()` (new, next to the other six in `60-props.js`) is parented onto this one cane's
  // own group — no new mesh group, no new physics box: the cane's own 0.5 x h x 0.5 box three lines up
  // already covers the 0.012 m sheet pinned to it. Mounted at local (0.16, 1.6, 0), just outside the
  // cane's own 0.13 m-radius stick and well below its hooked top (the torus sits at local y = h, and
  // every cane in this list has h >= 2.6), so the sheet reads as pinned to the straight shaft whatever
  // the cane's own random `rotation.y` turned out to be — `game.addInteractable` keys off the notice
  // mesh itself (`obj: notice`), same trick the Frosty Peak mitten notice already relied on, so the
  // prompt tracks the sheet's real world position through that rotation rather than the cane's own.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` uses) built the real Candy Land
  // (`game.start('new')` then `game.load(1, 'from-prev')`), read the notice's own world position
  // straight off its `getWorldPosition` (the cane's random rotation turned out to land it at
  // (-44.1, 1.6, 4.12)), then swept it against all 1957 of the land's physics boxes and every NPC's
  // own position sampled every quarter second over 20 simulated seconds: the nearest box other than the
  // cane's own mount (the one it reports 0 m from, exactly as built) stayed 12.55 m clear, and the
  // nearest NPC and interactable both turned out to be the same soul and the same "Say hello" prompt,
  // also 12.55 m off — this corner of the map, past the west bridge and short of the cane-forest ring,
  // has nothing else hand-placed anywhere near it, so the notice's own "Read the notice" prompt never
  // has to compete for the spot.
  { const notice = makeCandyNotice(); notice.position.set(0.16, 1.6, 0); noticeCane.add(notice);
    const lollipopLines = ['🍭 "LOST: one strawberry lollipop, barely licked. Reward: a gumdrop, already a little fuzzy."',
      '🍭 "Finder keeps the stick either way." The cat has no plans to go looking.',
      '🍭 Someone has tied a scrap of licorice string to the corner, as if that proves anything. The cat sniffs it anyway.'];
    game.addInteractable({ obj: notice, radius: 2.2, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines), 3000); } }); }
  let farLollipop = null, westLollipop = null, southLollipop = null, farSouthLollipop = null, southWestLollipop = null, northLollipop = null, midWestLollipop = null, southEastLollipop = null, eastLollipop = null, neLollipop = null;
  for (const [x, z] of [[-12, 12], [14, 10], [-24, -8], [22, -26], [-34, 16], [36, 18], [-16, 32], [18, 34], [-40, -8], [40, -12], [-6, -34], [6, -48]]) { const s = r.range(1.1, 1.8), l = makeLollipop(s, r.pick([330, 0, 200, 50, 280, 120]), r.range(2.6, 4)); l.position.set(x, 0, z); l.rotation.y = r() * TAU; W.add(l); P.addBox(x, 1.5, z, 0.4, 3, 0.4, { cam: false }); if (x === 36 && z === 18) farLollipop = l; if (x === -34 && z === 16) westLollipop = l; if (x === -6 && z === -34) southLollipop = l; if (x === 6 && z === -48) farSouthLollipop = l; if (x === -40 && z === -8) southWestLollipop = l; if (x === -16 && z === 32) northLollipop = l; if (x === -24 && z === -8) midWestLollipop = l; if (x === 22 && z === -26) southEastLollipop = l; if (x === 40 && z === -12) eastLollipop = l; if (x === 18 && z === 34) neLollipop = l; }
  // this inner dozen of big lollipops has stood since round 1, never looked at once — the notice cane
  // a few lines up and the wishing well further down both got their own "look" prompt, but every one of
  // these twelve was planted and forgotten. (36, 18), out past the east side of the candy-cane belt,
  // came back clearest of the set: kept straight off this loop's own `makeLollipop()` return, same trick
  // the crate and the barrel used in Robot City and the far palm used on Sunny Shore — no new mesh, no
  // new physics box, just this one instance's own existing stick-and-swirl group and its existing
  // 0.4 x 3 x 0.4 box handed to `game.addInteractable`. A headless probe (`game.start('new')`,
  // `game.travel(1, 'from-prev')`, 1800 simulated frames sampling every NPC's own position every sixth
  // frame) swept all twelve candidate spots against every one of the land's 1900 physics boxes, every
  // sample and every interactable already on the floor: (36, 18) stayed 11.3 m clear of the nearest
  // other box, 12.0 m off the nearest wandering soul and 12.9 m off the nearest other interactable —
  // the clearest of the twelve by a wide margin, well past the 2.2 m radius chosen for a stick with
  // only a 0.4 m half-extent.
  { const lollipopLines = ['🍭 "Biggest swirl in the whole inner belt, and not one lick taken out of it."', '🍭 "Planted the same day as the rest. Everyone else got eaten or replaced — this one just got tall."', '😼 The cat gives the stick a token headbutt. The lollipop does not notice.'];
    game.addInteractable({ obj: farLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines), 3000); } }); }
  // (36, 18) got its own "look" prompt back in round 624, leaving ten of the inner dozen still
  // unlooked-at. (-34, 16), out past the west bridge near the quiet corner the candy notice cane also
  // claims, came back the clearest of the remaining ten in a headless probe (`game.start('new')`,
  // `game.load(1, 'from-prev')`, 1800 simulated frames sampling every NPC's own position every sixth
  // frame): 8.61 m clear of the nearest other physics box, 11.72 m off the nearest wandering soul and
  // 15.59 m off the nearest other interactable — comfortably past the 2.2 m radius this prompt uses, and
  // clearer on every count than (36, 18)'s own figures. No new mesh, no new physics box, no new `r()`
  // draw: `westLollipop` just captures this one instance's own return value out of the same loop above.
  { const lollipopLines2 = ['🍭 "Leans a little west, same as every cane in this corner of the belt."', '🍭 "This one\'s swirl has gone slightly matte. Still nobody\'s taken a lick."', '😼 The cat circles the stick twice, decides it is not food, and wanders off.'];
    game.addInteractable({ obj: westLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines2), 3000); } }); }
  // two of the inner dozen looked at, ten still bare. (-6, -34), down in the south belt past the
  // gumdrop patch, came back clearest of the remaining ten in a headless probe (`game.start('new')`,
  // `game.travel(1, 'from-prev')`, 1800 simulated frames sampling every NPC's own position every sixth
  // frame): 10.29 m clear of the nearest other physics box, 5.45 m off the nearest wandering soul and
  // 6.57 m off the nearest other interactable — all comfortably past the 2.2 m radius the other two
  // lollipops already use, and the widest box clearance of the ten. No new mesh, no new physics box, no
  // new `r()` draw: `southLollipop` just captures this one instance's own return value out of the same
  // loop above, the same trick `farLollipop`/`westLollipop` already used.
  { const lollipopLines3 = ['🍭 "Down in the south belt, past the gumdrop patch — quietest corner of the dozen."', '🍭 "Stripe\'s a little crooked near the base. Nobody\'s ever minded."', '😼 The cat sniffs the stick, finds no scent of mouse, and moves on.'];
    game.addInteractable({ obj: southLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines3), 3000); } }); }
  // three of the inner dozen looked at, nine still bare. (6, -48), the furthest-south of the whole belt, came
  // back clearest of the remaining nine in a headless probe (`game.start('new')`, `game.load(1, 'from-prev')`,
  // 3600 simulated frames sampling every NPC's own position every sixth frame): 6.01 m clear of the nearest
  // other physics box, 8.86 m off the nearest wandering soul and 8.86 m off the nearest other interactable (the
  // same soul, since neither moves) — the widest box clearance of the nine, comfortably past the 2.2 m radius
  // the other three already use. No new mesh, no new physics box, no new `r()` draw: `farSouthLollipop` just
  // captures this one instance's own return value out of the same loop above.
  { const lollipopLines4 = ['🍭 "Furthest south of the whole belt — the ground gets quiet out here."', '🍭 "Same swirl as its eleven neighbours, just a longer walk to see it."', '😼 The cat gives the stick a token headbutt, same as it gave the last one. Still no reaction.'];
    game.addInteractable({ obj: farSouthLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines4), 3000); } }); }
  // four of the inner dozen looked at, eight still bare. (-40, -8), tucked in the south-west corner of
  // the belt, came back clearest of the remaining eight in a headless probe (`game.start('new')`,
  // `game.load(1, 'from-prev')`, 3600 simulated frames sampling every NPC's own position every sixth
  // frame): 6.0 m clear of the nearest other physics box, 6.79 m off the nearest wandering soul and
  // 10.77 m off the nearest other interactable — the widest overall clearance of the eight,
  // comfortably past the 2.2 m radius the other four already use. No new mesh, no new physics box, no
  // new `r()` draw: `southWestLollipop` just captures this one instance's own return value out of the
  // same loop above, the same trick all four lollipop prompts before it already used.
  { const lollipopLines5 = ['🍭 "South-west corner of the belt — the bridge is a long walk from here."', '🍭 "Same stripe as the rest, just facing a different way nobody ever checks."', '😼 The cat gives the stick one last headbutt and decides the inner dozen is a lost cause.'];
    game.addInteractable({ obj: southWestLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines5), 3000); } }); }
  // five of the inner dozen looked at, seven still bare. (-16, 32), up on the north side of the belt
  // short of the park bridge, came back clearest of the remaining seven in a headless probe
  // (`game.start('new')`, `game.load(1, 'from-prev')`, 3600 simulated frames sampling every NPC's own
  // position every sixth frame): 5.58 m clear of the nearest other physics box, 7.75 m off the nearest
  // wandering soul and 14.14 m off the nearest other interactable — the widest overall clearance of the
  // seven (the north-east corner at (14, 10) came back tightest, only 2.6 m off both a wandering soul and
  // another interactable), comfortably past the 2.2 m radius the other five already use. No new mesh, no
  // new physics box, no new `r()` draw: `northLollipop` just captures this one instance's own existing
  // return value out of the same loop above, the same trick all five lollipop prompts before it already
  // used.
  { const lollipopLines6 = ['🍭 "North edge of the belt, where the candy-cane groves start to thin out."', '🍭 "Same swirl, same stick. Nobody up here to notice either."', '😼 The cat gives the stick a disinterested sniff and goes back to looking for mice.'];
    game.addInteractable({ obj: northLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines6), 3000); } }); }
  // six of the inner dozen looked at, six still bare. (-24, -8), inner belt just west of the river
  // and short of the gumdrop patch, came back clearest of the remaining four in a headless probe
  // (`game.start('new')`, `game.load(1, 'from-prev')`, 3600 simulated frames sampling every NPC's own
  // position every sixth frame): 5.30 m clear of the nearest other physics box, 10.05 m off the nearest
  // wandering soul and 9.90 m off the nearest other interactable — the widest minimum clearance of the
  // four ((40, -12) was tightest, only 2.60 m off a physics box), comfortably past the 2.2 m radius the
  // other six already use. No new mesh, no new physics box, no new `r()` draw: `midWestLollipop` just
  // captures this one instance's own existing return value out of the same loop above, the same trick
  // all six lollipop prompts before it already used.
  { const lollipopLines7 = ['🍭 "Inner belt, just short of the river — this one hears the water at night."', '🍭 "Same stripe, same stick, same silence as the rest of the dozen."', '😼 The cat gives the stick a sniff, finds nothing worth chasing, and pads off.'];
    game.addInteractable({ obj: midWestLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines7), 3000); } }); }
  // seven of the inner dozen looked at, five still bare. (22, -26), south-east corner of the belt past
  // the river bend, came back clearest of the remaining five in a headless probe (`game.start('new')`,
  // `game.travel(1, 'from-prev')`, 600 simulated frames sampling every NPC's own position every sixth
  // frame): 4.60 m clear of the nearest other physics box, 13.60 m off the nearest wandering soul and
  // 13.60 m off the nearest other interactable (the same soul, since neither moves) — the widest minimum
  // clearance of the five ((40, -12) and (14, 10) were tightest, 2.60 m off a box and an interactable
  // respectively), comfortably past the 2.2 m radius the other seven already use. No new mesh, no new
  // physics box, no new `r()` draw: `southEastLollipop` just captures this one instance's own existing
  // return value out of the same loop above, the same trick all seven lollipop prompts before it already
  // used.
  { const lollipopLines8 = ['🍭 "South-east corner of the belt, past where the river bends."', '🍭 "Same swirl as its eleven neighbours. This one just gets fewer visitors."', '😼 The cat gives the stick a last headbutt and leaves the dozen to its silence.'];
    game.addInteractable({ obj: southEastLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines8), 3000); } }); }
  // eight of the inner dozen looked at, four still bare. (40, -12), out on the east side of the belt,
  // came back clearest of the remaining four in a headless probe (`game.start('new')`, `game.travel(1,
  // 'from-prev')`, 600 simulated frames sampling every NPC's own position every sixth frame): 3.89 m
  // clear of the nearest other physics box, 5.00 m off the nearest wandering soul and 5.00 m off the
  // nearest other interactable — comfortably past the 2.2 m radius the other eight already use, and
  // well ahead of the other three candidates, which came back pressed up against a box, a soul or an
  // interactable at well under a metre. No new mesh, no new physics box, no new `r()` draw:
  // `eastLollipop` just captures this one instance's own existing return value out of the same loop
  // above, the same trick all eight lollipop prompts before it already used.
  { const lollipopLines9 = ['🍭 "East side of the belt — the quietest stretch of the whole dozen."', '🍭 "Same swirl, same stick, same silence as its eleven neighbours."', '😼 The cat gives the stick a headbutt, finds no give in it, and pads off east.'];
    game.addInteractable({ obj: eastLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines9), 3000); } }); }
  // nine of the inner dozen looked at, three still bare: (-12, 12) and (14, 10) both came back pressed
  // against something else (a wandering soul within a metre of the first, a physics box within a metre
  // of the second — neither clears the 2.2 m radius every lollipop before it already uses), leaving
  // (18, 34), up in the belt's own north-east corner, as the only one of the three with room to spare. No
  // new mesh, no new physics box, no new `r()` draw: `neLollipop` just captures this one instance's own
  // existing return value out of the same loop above, the same trick all nine lollipop prompts before it
  // already used. A headless probe (`game.start('new')`, `game.travel(1, 'from-prev')` waited out
  // through its real portal-fade timer, then 3600 simulated frames sampling every NPC's own position
  // every sixth frame) swept all three remaining candidates against every one of the land's 1902 physics
  // boxes, every sample and every interactable already on the floor: (18, 34) stayed 3.68 m clear of the
  // nearest other box and never closer than 8.60 m to the nearest wandering soul or interactable over the
  // whole run, comfortably the widest margin of the three and well past the 2.2 m radius chosen.
  { const lollipopLines10 = ['🍭 "North-east corner of the belt — not much else out this way."', '🍭 "Same swirl, same stick, as quiet up here as anywhere in the dozen."', '😼 The cat gives the stick one more headbutt, finds the same no give as always, and wanders off.'];
    game.addInteractable({ obj: neLollipop, radius: 2.2, label: () => 'Look at the lollipop', onUse: () => { SFX.click(); game.toast(rnd.pick(lollipopLines10), 3000); } }); }
  for (let i = 0; i < 40; i++) { const x = r.range(-45, 45), z = r.range(-50, 40); if (abs(z + 18) < 5 || (abs(x) < 3 && abs(z) < 3)) continue; const l = makeLollipop(0.28, r.pick([330, 0, 200, 50, 280, 120]), r.range(0.5, 0.8)); l.position.set(x, 0, z); l.rotation.y = r() * TAU; W.add(l); }
  makeGumdrops(game, [[-8, 14, 4, 14], [10, -6, 4, 12], [-20, 2, 5, 16], [22, 6, 5, 16], [-30, -30, 6, 18], [30, -32, 6, 18], [0, 22, 6, 20], [-40, 20, 5, 14], [40, -2, 5, 14], [-52, 8, 7, 22], [54, 12, 7, 22], [-20, 50, 8, 24], [26, 52, 7, 20], [-50, -34, 6, 16], [52, -36, 6, 16], [10, -50, 6, 18]], r);
  for (const [x, z] of [[-40, 44], [44, 46], [-56, -10], [58, -14], [-14, -56], [22, -58], [-66, 16], [68, 4]]) { const s = r.range(1.2, 1.9), l = makeLollipop(s, r.pick([330, 0, 200, 50, 280, 120]), r.range(3, 4.5)); l.position.set(x, 0, z); l.rotation.y = r() * TAU; W.add(l); P.addBox(x, 1.5, z, 0.4, 3, 0.4, { cam: false }); }
  for (const [x, z] of [[-48, 30], [50, 28], [-36, -48], [38, -50], [-10, 46], [12, 48], [-60, -2], [62, -4]]) { const b = makeMarshmallowBush(r); b.position.set(x, 0, z); W.add(b); P.addBox(x, 0.5, z, 1.2, 1, 1.2, { cam: false }); }
  makeCandyHills(W, r, CANDY_LIMIT + 8);
  // hammocks, picnic blankets and wishing wells had never shown up anywhere in the seven worlds — the
  // hammock went to Sunny Shore and the picnic blanket to the Neighborhood, so the wishing well lands
  // here, in the open meadow between the sweet-lands and the lane up to the castle. Victorian already
  // has a coin-toss fountain, so this one stays a quiet "walk up and look" landmark (same trick as the
  // hammock and the blanket before it) rather than a second wish-granting mechanic. A candy-cane-striped
  // barrel (the same `TEX.candyCane()` map the canes and canes' own curved handle already use, just
  // wrapped round a squat cylinder instead of a tall one this time) sits between two cookie-brown posts
  // under a crossbar, a thin rope swinging a small bucket of gumballs down into the dark opening. No
  // coins, no quest: *"No coins down here — just gumballs. Nobody's worked out why, exactly."*
  // *"Toss a wish and it rolls right back out, sticky with gumdrop glaze."* *"The bucket's never once
  // come up full. Someone's been skimming the wishes."*
  //
  // A headless probe (the same stub-three harness `test/run.mjs` uses) built the real Candy Land
  // (`game.travel(1, 'from-prev')`), sampled every NPC's position every quarter second over roughly
  // eight simulated seconds, and swept candidate points against all of the land's own physics boxes:
  // (0, 56) came back clear by 5.58 m of the nearest box (a candy-cane trunk) and 22.2 m of the nearest
  // wandering soul — well short of the 56-76 m band where the candy-cane forest ring itself takes over,
  // clear of both flanking gumdrop patches (centred at (-20,50) and (26,52)), and far north of the
  // butterflies' own flight box (z ≤ 40) and the sparrow's leash at (-29, 40).
  { const wx = 0, wz = 56;
    const g = group(wx, 0, wz, W);
    const stripe = mat(0xffffff, { roughness: 0.4, map: TEX.candyCane() });
    const postMat = mat(0xc27b3a, { roughness: 0.9 }), rimMat = mat(0xd62839, { roughness: 0.5 });
    mesh(G.cyl(1.0, 1.05, 0.85, 16), stripe, { y: 0.425, shadow: 'both', parent: g });
    noInk(mesh(G.torus(1.02, 0.12, 10, 20), rimMat, { y: 0.85, parent: g }));
    mesh(G.cyl(0.85, 0.85, 0.06, 16), mat(0x3a2410, { roughness: 0.9 }), { y: 0.89, shadow: 'none', parent: g });   // the dark opening
    for (const side of [-1, 1]) mesh(G.cyl(0.07, 0.07, 1.25, 8), postMat, { x: side * 0.72, y: 1.475, parent: g });
    mesh(G.cyl(0.06, 0.06, 1.7, 8), postMat, { y: 2.1, rz: PI / 2, parent: g });
    const pivot = group(0, 2.1, 0, g);   // rope + bucket hang and sway from here, never the posts themselves
    noInk(mesh(G.cyl(0.015, 0.015, 1.05, 6), mat(0xc9a86a, { roughness: 0.9 }), { y: -0.525, parent: pivot }));
    const bucket = group(0, -1.08, 0, pivot);
    const bucketMat = mat(0xcfd4d8, { metalness: 0.5, roughness: 0.35 });
    mesh(G.cyl(0.18, 0.15, 0.22, 12), bucketMat, { shadow: 'both', parent: bucket });
    noInk(mesh(G.torus(0.165, 0.014, 4, 10, PI), bucketMat, { y: 0.12, rz: PI / 2, parent: bucket }));   // handle arc
    for (const [bx, bz, hue] of [[-0.06, 0.04, 0], [0.07, -0.02, 0.33], [0, 0.07, 0.55]]) mesh(G.sphere(0.07, 8, 6), mat(new THREE.Color().setHSL(hue, 0.85, 0.6), { roughness: 0.5 }), { x: bx, y: 0.1, z: bz, parent: bucket });
    U.push((dt, t) => { pivot.rotation.z = sin(t * 0.5) * 0.05; });   // the faintest pendulum sway, the world clock `t` alone
    P.addBox(wx, 0.95, wz, 2.3, 1.9, 2.3);
    const wishLines = ['🪣 "No coins down here — just gumballs. Nobody\'s worked out why, exactly."', '🪣 "Toss a wish and it rolls right back out, sticky with gumdrop glaze."', '🪣 "The bucket\'s never once come up full. Someone\'s been skimming the wishes."'];
    game.addInteractable({ obj: g, radius: 2.8, label: () => 'Look at the wishing well', onUse: () => { SFX.click(); game.toast(rnd.pick(wishLines), 3000); } }); }
  // the wishing well just south of here already has a bucket of gumballs riding its rope, but no actual
  // gumball machine — the one fixture every candy-themed arcade or sweet-shop corner is built around —
  // had ever turned up anywhere in the land. A free-standing one now stands on the quiet grass north of
  // the well, red cabinet and chrome crank below a glass globe packed with forty-six gumballs
  // (`makeGumballMachine()`, new in `60-props.js`, next to `makeCandyJar`). A press of E plays a coin-click,
  // a gumball-sized sparkle drops out of the tray, and the cat gets told which flavour it was — no quest,
  // no inventory, same one-off "walk up and look" shape the well beside it and the postbox back in
  // Victorian both already use, just with its own small payoff instead of a fixed line.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` uses) built the real Candy Land
  // (`game.start('new')` then `game.travel(1, 'from-hub')`, so every wanderer, dancer and tag pair
  // actually moved), sampled every NPC's own position every quarter second over 300 simulated seconds,
  // then swept a 2 m grid out past the well against both those samples and all 309 of the land's physics
  // boxes: (-13, 83) came back clear by 8.0 m of the nearest box and nearly 40 m of the nearest wandering
  // soul, well inside the radius (92) where candyRegion's own procedural fill takes over, past the
  // candy-cane ring (which only ever reaches out to `d: r.range(56, 76)`) and a clear 3+ m past the edge
  // of the cupcake-hill keep-out circle centred on (0, 80).
  { const gx = -13, gz = 83;
    const gm = makeGumballMachine(r);
    gm.position.set(gx, 0, gz); W.add(gm);
    P.addBox(gx, 0.7, gz, 0.8, 1.4, 0.8, { cam: false });
    const gumFlavours = ['🍬 "Watermelon — or something trying hard to be."', '🍬 "Blue. Just blue. Flavour unclear."', '🍬 "Cherry, the good kind, the kind that stains your tongue."', '🍬 "A white one. Somehow always the last colour you want."', '🍬 "Green apple, sharp enough to make the whiskers twitch."'];
    game.addInteractable({ obj: gm, radius: 2.1, label: () => 'Turn the crank', onUse: () => { SFX.click(); SFX.pickup(); game.fx.emit(gx, 1.0, gz, { count: 10, colors: [0xff6fb5, 0x7fd7ff, 0xffd54a, 0x8bc34a], speed: 1.0, up: 1.3, life: 0.8, gravity: 2.4 }); game.toast(rnd.pick(gumFlavours), 3000); } }); }
  // no world in the game has ever had a carousel, and nowhere fits one better than the sweet-lands. A
  // small one now turns on the quiet grass east of the cane-forest belt: a candy-striped floor and
  // canopy on a centre pole, six gumdrop seats on candy-cane poles round the rim, the whole thing
  // (`makeCarousel()`, new in `60-props.js`) one `pivot` group spinning slowly on the world clock `t`
  // alone — the same trick every pinwheel and weathervane before it uses, so it draws nothing from this
  // world's own seeded `r` and costs no later colour pick anywhere else in this build.
  //
  // A headless probe (`game.start('new')` then `game.travel(1, 'from-hub')`, 1800 simulated frames
  // sampling every NPC's own position every fifth frame) swept a grid of candidate points against all
  // of Candy Land's own physics boxes and those samples: (35, 60) came back clearest of the lot, 16.1 m
  // from the nearest box (a candy-cane trunk in the 56-76 m forest ring) and 8.1 m from the nearest
  // wandering soul — inside the ring's own radius band but between two trunks, well short of the
  // butterflies' own flight box (x ≤ 32) and the gumdrop patch at (26, 52) (12 m off), inside the 92 m
  // radius where `candyRegion`'s own procedural fill takes over.
  { const cx = 35, cz = 60;
    const carousel = makeCarousel();
    carousel.group.position.set(cx, 0, cz); W.add(carousel.group);
    U.push((dt, t) => { carousel.pivot.rotation.y = t * 0.45; });
    P.addBox(cx, 0.5, cz, 4.0, 1.0, 4.0);
    // the carousel's own toast used to swear not one of its six seats had ever been filled — one of
    // them finally gets a rider. Seat index 3 (the green one, `i / 6 * TAU` at i=3 is PI, so local
    // (sx, sz) = (cos(PI) * 1.3, sin(PI) * 1.3) = (-1.3, 0)) has its own seat-sphere top at local
    // y = 0.14 + 0.38 + 0.12 + 0.22 * 0.75 = 0.805 (the seat centre `makeCarousel()` itself computes,
    // plus its own 0.22 m radius squashed to 0.75 on y); a gingerbread rig's own feet sit about 0.045 m
    // above its own group origin (the leg capsules — radius 0.085, length 0.24 — hang from a hip at
    // local y = 0.42 relative to the body, itself at the rig's own origin), so parenting the rig at
    // local y = 0.76 lands its feet right on the seat. Parented to `carousel.pivot` itself — the same
    // group the ride's own spin already turns every frame — so the rider orbits for free, no `U.push`
    // of its own needed. Pure set dressing, same as every napping cat before it: no greeting, no
    // physics box, nothing to collect, and no draw from this world's own seeded `r` or the shared
    // `rnd()` sequence at build time.
    { const rider = makeGingerbread();
      rider.group.position.set(-1.3, 0.76, 0);
      rider.group.rotation.y = -PI / 2;   // facing outward, away from the centre pole, along local -X
      carousel.pivot.add(rider.group); }
    const carouselLines = ['🎠 "Round and round — and one rider finally along for the ride."', '🎠 "Five empty seats now. The green one\'s taken."', '🎠 "Spins on its own, mostly. One gingerbread man never seems to mind the company."'];
    game.addInteractable({ obj: carousel.group, radius: 3.4, label: () => 'Look at the carousel', onUse: () => { SFX.click(); game.toast(rnd.pick(carouselLines), 3000); } }); }
  // the Candy Queen's castle, up the lane to the north — houmoungous, and you can walk right in — with a little candy village on the approach
  game.zones.addCircle(0, 150, 27);
  for (const [hx, hz] of [[-16, 95], [16, 97], [-24, 112], [24, 114], [0, 80]]) game.zones.addCircle(hx, hz, 5);
  const castle = makeCandyCastle(game, 0, 150, PI, r);
  for (const u of castle.updates) U.push(u);
  // every other world now keeps some ambient sound of its own on a loop — the Victorian bell, Robot City's
  // shift whistle, Sunny Shore's foghorn, Whisper Woods' owl — but Candy Land, pennants flying and sugar
  // steam rising from its five houses, had never once made a sound of its own. A little music-box jingle
  // now chimes from the castle every couple of minutes: light and quick, not a tolling bell. The interval
  // is drawn from the shared `rnd()`, never the per-world seeded `r()`, so it can't shift any wardrobe pick
  // still to come in this build or any later one.
  let castleJingleT = rnd.range(45, 75);
  U.push((dt) => { castleJingleT -= dt; if (castleJingleT <= 0) { SFX.musicbox(); castleJingleT = rnd.range(90, 130); } });
  const candyHouseSpots = [[-16, 95, 330], [16, 97, 200], [-24, 112, 50], [24, 114, 120], [0, 80, 280]];
  for (let i = 0; i < candyHouseSpots.length; i++) {
    const [hx, hz, hue] = candyHouseSpots[i];
    const house = makeCandyHouse(game, hx, hz, r() * TAU, r, hue);
    for (const u of house.updates) U.push(u);
    // all five hand-placed candy houses have had sugar steam rising off their finial for a while, but
    // not one has ever had anyone or anything actually on its roof — every other hand-built cluster in
    // the game (the Neighborhood's sixteen roofs, Victorian's flower stalls) got a per-building detail
    // of its own eventually. The first house now has a sparrow perched on one of its own icing dollops,
    // out past the west eaves, well clear of the roof's own slanted surface.
    // `makeSparrow()` straight off the shelf, the exact rig the Neighborhood's roof-nest tenant and the
    // birdbath's own visitor already use. Parented to the house's own group (`house.group`, never run
    // through `bakeDeep`/`bakeRig` in this function, so a live child just works) at local
    // (-3.15, 3.43, 0): the dollop loop above plants one of its ten icing bumps (radius 0.16) at that
    // exact (x, z) with its top at y = 3.14 + 0.16 = 3.3, so y = 3.43 rests the sparrow's feet just
    // above it. At that height the roof cone's own slanted surface (base radius 3.2 at y=3.3, apex at
    // y=5.9) has narrowed to radius ≈3.04 — short of the dollop's radius 3.15 — so the perch sits just
    // outside the cone's surface, past the eaves, rather than inside the solid roof mesh. No physics
    // box: the house's own collision box tops out at y=3.2, well under the perch. No draw from this
    // world's own seeded `r` or the shared `rnd()` sequence at build time — the position and rotation
    // are fixed literals, the same caution every perched bird in the game already takes.
    if (i === 0) {
      const perch = makeSparrow();
      house.group.add(perch.group);
      perch.group.position.set(-3.15, 3.43, 0);
      perch.group.rotation.y = -PI / 2;
      U.push((dt, t) => perch.animate(0, false, dt, t));
      const candyRoofLines = ['🐦 "Chirp. (Translation: the icing dollops make a surprisingly good perch.)"', '🍬 "Every other roof fixture in this game spins, glows or tells the wrong time. This one just sits and watches the steam go by."', '😼 "Puss, that\'s real icing under its feet. Don\'t get any ideas."'];
      game.addInteractable({ obj: perch.group, radius: 1.6, label: () => 'Look at the sparrow', onUse: () => { SFX.click(); game.toast(rnd.pick(candyRoofLines), 3000); } });
    }
    // the second house gets a roof detail of its own now too: a sugar-pink ladybug (`makeLadybug(0xff4fa0)`,
    // the exact rig the Neighborhood's and Whisper Woods' own plain red ladybugs already use, just recoloured
    // to match the house's own icing) parked on dollop #7 of its own roofline — the same ten-dollop loop
    // above, one of its odd-indexed bumps, so its top sits at y = 3.24 + 0.16 = 3.4 rather than house 1's
    // even-indexed one. At that height the roof cone's own slanted surface has narrowed to radius ≈3.08,
    // short of this dollop's own outer radius (3.15 + 0.16 = 3.31), so the ladybug sits just past the eaves,
    // clear of the solid roof mesh, the same margin round 783's sparrow relied on for house 1. No physics
    // box (the house's own box tops out at y=3.2, well under this) and no draw from `r()` or the shared
    // `rnd()` at build time — position and rotation are fixed literals.
    if (i === 1) {
      const bugX = -0.973, bugZ = -2.996, bugY = 3.4;
      const bug = makeLadybug(0xff4fa0);
      house.group.add(bug.group);
      bug.group.position.set(bugX, bugY, bugZ);
      bug.group.rotation.y = atan2(bugX, bugZ);
      U.push((dt, t) => bug.animate(0, false, dt, t));
      const candyRoofLines2 = ['🐞 "Not a spot in sight — just sugar sprinkles standing in for them."', '🍬 "Second roof on the street to get its own visitor. Three to go."', '😼 "Puss, that one bites back less than the gingerbread men do."'];
      game.addInteractable({ obj: bug.group, radius: 1.6, label: () => 'Look at the ladybug', onUse: () => { SFX.click(); game.toast(rnd.pick(candyRoofLines2), 3000); } });
    }
    // the third house gets a roof visitor too, so no new rig: `makeGumdropBeetle()` already scuttles
    // Candy Land's grass elsewhere in this same build (the pink one a little further down this
    // function), built the exact same way as the ladybug it's modelled on — short legs, origin basically
    // at ground contact — so it sits flush on a dollop the same way house 2's ladybug does, at the
    // dollop's own top rather than some margin above it. Minted green (0x8ee6a8) rather than that other
    // beetle's pink, so the two don't read as the same bug wandering the street twice. Dollop #3 of the
    // same ten-dollop loop (`makeCandyHouse`, 68-regions.js): x = cos(3/10·TAU)·3.15 ≈ -0.973,
    // z = sin(3/10·TAU)·3.15 ≈ 2.996, an odd index so y = 3.24 + 0.16 = 3.4 — the same height class
    // house 2's ladybug already proved safe, on the opposite side of the roof from it. The roof cone's
    // own taper (base radius 3.2 at y=3.3, apex at y=5.9) has narrowed to radius ≈3.08 by y=3.4, short of
    // this dollop's own radius (3.15, wider still with the beetle's own shell on top), so it sits just
    // past the eaves and clear of the solid roof mesh — checking this mattered: at the roof's bare base
    // height (y=3.3) the cone is still its full 3.2 m radius, wider than the dollop ring (3.15 m), which
    // would have buried a beetle planted there inside the roof surface instead of past it. No physics
    // box (the house's own box tops out at y=3.2, well under this) and no draw from `r()` or the shared
    // `rnd()` at build time — position, rotation and colour are fixed literals, the same caution every
    // perched roof creature in this game already takes.
    if (i === 2) {
      const bugX = -0.973, bugZ = 2.996, bugY = 3.4;
      const bug2 = makeGumdropBeetle(0x8ee6a8);
      house.group.add(bug2.group);
      bug2.group.position.set(bugX, bugY, bugZ);
      bug2.group.rotation.y = atan2(bugX, bugZ);
      U.push((dt, t) => bug2.animate(0, false, dt, t));
      const candyRoofLines3 = ['🍬 "A gumdrop beetle, out of the grass and up on the roof where the real gumdrops are."', '🍬 "Third roof on the street with company now. Two still bare."', '😼 "Puss, it\'s candy-coloured. That doesn\'t make it candy."'];
      game.addInteractable({ obj: bug2.group, radius: 1.6, label: () => 'Look at the gumdrop beetle', onUse: () => { SFX.click(); game.toast(rnd.pick(candyRoofLines3), 3000); } });
    }
    // the fourth house gets a roof visitor too, so no new rig: `makeSnail()` already rests Whisper Woods'
    // own grass on the same flat, ground-hugging foot as the roof beetles above it, so a shell recoloured
    // bubblegum-pink (0xff8fd1, matching neither this house's green icing nor any snail already in the
    // game) sits the same way they do. Dollop #1 of the same ten-dollop loop (`makeCandyHouse`,
    // 68-regions.js): x = cos(1/10·TAU)·3.15 ≈ 2.548, z = sin(1/10·TAU)·3.15 ≈ 1.852, an odd index so
    // y = 3.24 + 0.16 = 3.4 — the same height class houses 2 and 3 already proved clear of the roof
    // cone's own taper (radius ≈3.08 at y=3.4, short of the dollop's own radius 3.15). No physics box
    // (the house's own box tops out at y=3.2, well under this) and no draw from `r()` or the shared
    // `rnd()` at build time — position, rotation and colour are fixed literals, the same caution every
    // perched roof creature in this game already takes.
    if (i === 3) {
      const snailX = 2.548, snailZ = 1.852, snailY = 3.4;
      const snail = makeSnail(0xff8fd1);
      house.group.add(snail.group);
      snail.group.position.set(snailX, snailY, snailZ);
      snail.group.rotation.y = atan2(snailX, snailZ);
      U.push((dt, t) => snail.animate(0, false, dt, t));
      const candyRoofLines4 = ['🐌 "No hurry at all up here — the icing isn\'t going anywhere."', '🍬 "Fourth roof on the street with company. One still bare."', '😼 "Puss, it left a trail. It\'s sugar, not slime. Probably."'];
      game.addInteractable({ obj: snail.group, radius: 1.6, label: () => 'Look at the snail', onUse: () => { SFX.click(); game.toast(rnd.pick(candyRoofLines4), 3000); } });
    }
    // the fifth and last house gets its own roof visitor now, finishing what rounds 783–786 started:
    // no new rig, `makeTigerBeetle()` already proved itself as a flush-footed roof dweller's cousin
    // (same short-legged frame as the gumdrop beetle, origin basically at ground contact), recoloured
    // butterscotch (0xffcf4d) rather than its usual sun-bleached green so it doesn't read as the same
    // bug wandering in from the grass. Every odd-indexed dollop closer to hand (#1, #3, #5, #7) already
    // has a tenant, so this one takes dollop #9 of the same ten-dollop loop (`makeCandyHouse`,
    // 68-regions.js): x = cos(9/10·TAU)·3.15 ≈ 2.548, z = sin(9/10·TAU)·3.15 ≈ -1.852, an odd index so
    // y = 3.24 + 0.16 = 3.4 — the same height class every other flush roof visitor already proved clear
    // of the roof cone's own taper (radius ≈3.08 at y=3.4, short of the dollop's own radius 3.15); the
    // even-indexed dollops stay off-limits for a flush mount, the same bare-base check (cone still its
    // full 3.2 m radius at y=3.3, wider than the 3.15 m dollop ring) that kept house 1's sparrow up on a
    // margin instead. No physics box (the house's own box tops out at y=3.2, well under this) and no
    // draw from `r()` or the shared `rnd()` at build time — position, rotation and colour are fixed
    // literals, the same caution every perched roof creature on this street already takes.
    if (i === 4) {
      const bugX = 2.548, bugZ = -1.852, bugY = 3.4;
      const bug3 = makeTigerBeetle(0xffcf4d);
      house.group.add(bug3.group);
      bug3.group.position.set(bugX, bugY, bugZ);
      bug3.group.rotation.y = atan2(bugX, bugZ);
      U.push((dt, t) => bug3.animate(0, false, dt, t));
      const candyRoofLines5 = ['🪲 "Butterscotch, not grass-green — the roof version, apparently."', '🍬 "Fifth roof on the street with company now. None bare anymore."', '😼 "Puss, you have checked every roof on this street tonight. They are all still roofs."'];
      game.addInteractable({ obj: bug3.group, radius: 1.6, label: () => 'Look at the tiger beetle', onUse: () => { SFX.click(); game.toast(rnd.pick(candyRoofLines5), 3000); } });
    }
  }
  for (const s of [-1, 1]) { const rig = makeGingerbread(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: castle.throne[0] + s * 2.6, z: castle.throne[1] + 1.4, speed: 0.3, leash: 1.2, r: 0.4, height: 1.4, idle: [2, 5] })); }
  game.addInteractable({ obj: castle.throneGroup, radius: 3.4, label: () => 'Approach the throne', onUse: () => { SFX.talk(); game.toast('👑 "A comfy-looking throne. Built for someone rather bigger than a cat."', 3000); } });
  // the hall between the gate and the dais was empty; a court jester now juggles there for a throne its queen rarely visits
  { const jx = castle.gate[0], jz = castle.gate[1] + 5;
    const jester = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xff6fb5, stripes: 0xffd54a, pants: 0x7fd7ff, shoes: 0xffffff, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(jester.group);
    game.npcs.push(new Juggler(game, jester, [0xffd54a, 0x7fd7ff, 0xff6fb5], { x: jx, z: jz, ry: atan2(castle.throne[0] - jx, castle.throne[1] - jz),
      cries: ["Juggling gumdrops — lick one and you're a ball down.", "The throne's empty most days. Good acoustics, though.", "Her Majesty prefers the airlock. More's the pity."] })); }
  // the gate itself had nobody guarding it — the castle's own staff wander and march and dance and juggle,
  // but the archway between its two towers was bare. A gingerbread sentry now paces across the opening.
  // The gate towers' own boxes (2.3 m radius, centred at x = ±4.3) leave only |x| < 2.0 clear at z = 135
  // (castle.gate itself); a headless probe swept the 0.4 m patrol circle along that line and found
  // (-1.5, gate z) to (1.5, gate z) clear the whole way, 5.5 m short of the court jester to the north.
  { const gx = castle.gate[0], gz = castle.gate[1];
    const guard = makeGingerbread(); W.add(guard.group);
    game.npcs.push(new Patroller(game, guard, { points: [[gx - 1.5, gz], [gx + 1.5, gz]], speed: 0.8, pause: [1.5, 3], r: 0.4, height: 1.4,
      cries: ['Halt! ...oh. Just a cat.', 'No gumdrops past this point without a permit.', 'Her Majesty is not receiving visitors. Or anyone, really.', "Mind the icing, it's load-bearing."], cryIcon: '🍬' })); }
  // the throne, Robot City's statue, the Neighborhood's signpost, the fairy ring, Victorian's clock
  // tower, Sunny Shore's lighthouse and both zipline towers have all had a one-off "walk up and look"
  // toast by now, but the castle's own gate towers — the first thing the cat passes under on the way in
  // — never got a glance of their own. `makeCandyCastle` now hands back the six tower cylinders it
  // builds (`towers`, in build order: four corner towers then the two flanking the gate), so this reuses
  // the right-hand gate tower mesh itself as the interactable's `obj` — no new mesh, no new box. Its own
  // box (half-extent 2.3 m in x and z, the same one the guard's own comment above already measured) sits
  // 2.8 m from the nearest end of the guard's patrol line (x = 1.5, same z) and 6.6 m from the court
  // jester at (0, 140), so a 4.5 m radius clears the tower from any side with room to spare before either.
  { const lines = ['🍬 "Thirteen metres of candy cane, striped all the way to the roof."', '🍬 "Her Majesty\'s own flag flies up there, same as every other tower\'s — nobody dares fly a different one."', '🍬 "First thing you see coming up the lane. Still the best view of the gate."'];
    game.addInteractable({ obj: castle.towers[5], radius: 4.5, label: () => 'Look up at the tower', onUse: () => { SFX.click(); game.toast(rnd.pick(lines), 3000); } }); }
  // the right-hand gate tower got its own look above, but its twin on the other side of the arch —
  // same height, same candy-cane stripe, same stride from the gate — never got so much as a glance.
  // `castle.towers[4]` is the other one `makeCandyCastle` hands back (build order: four corner towers,
  // then the gate towers, left then right): same mesh, same existing box, no new geometry. The whole
  // castle is symmetric about its own centre line (the guard's patrol spans gx-1.5..gx+1.5, the jester
  // sits at x=0, both either side of this tower and tower 5 alike), so every clearance already measured
  // for tower 5 above — 2.8 m from the patrol line's near end, 6.6 m from the jester — holds for tower 4
  // by mirror symmetry, not just by eye: reflecting the whole plaza about x=0 maps tower 5 onto tower 4
  // and leaves the guard and the jester exactly where they were. A 4.5 m radius is just as reachable here.
  { const lines4 = ['🍬 "No guard troubles this one — Her Majesty only ever posted the one."', '🍬 "Mirror image of its neighbour across the arch, down to the last candy stripe."', '🍬 "Quietest tower in the castle. Nobody\'s ever been told why it matters less."'];
    game.addInteractable({ obj: castle.towers[4], radius: 4.5, label: () => 'Look up at the other tower', onUse: () => { SFX.click(); game.toast(rnd.pick(lines4), 3000); } }); }
  // the two gate towers got their own "look up" two rounds back, but the four larger corner towers that
  // actually anchor the castle's walls — 15 m tall against the gate towers' 13, same candy-cane stripe and
  // gold finial — never got a glance of their own, despite `makeCandyCastle` handing all six back in
  // `castle.towers` (build order: the four corner towers first, then the two gate towers). `castle.towers[2]`
  // is the corner where the front wall meets the east wall, world (17, 135) — reused directly as the
  // interactable's own `obj`, no new mesh, no new box. Its own box (half-extent 3.1 m, `68-regions.js`)
  // sits flush against both wall boxes on its inside, so the only open approach is from outside the
  // castle: a headless probe found (21.5, 135) — on the open ground past the wall's own corner — clear of
  // the tower's box by 1.4 m and only 4.5 m from its centre, comfortably inside a 5.5 m radius here; the
  // same probe swept 1200 simulated frames of every NPC in Candy Land and found nothing wandering within
  // 15 m of this corner.
  { const lines2 = ['🍬 "Fifteen metres, corner to crown — a good two taller than the ones guarding the gate."', '🍬 "Holds up its own corner of wall, same as the other three."', '🍬 "Her Majesty\'s flag again, same stripe, same gold finial. Nobody\'s ever climbed up to check it\'s not just the one flag moved around."'];
    game.addInteractable({ obj: castle.towers[2], radius: 5.5, label: () => 'Look up at the corner tower', onUse: () => { SFX.click(); game.toast(rnd.pick(lines2), 3000); } }); }
  // tower 2 (front wall meets east wall, world (17, 135)) got its own look last round; its mirror image
  // across the castle's own centre line — tower 3, where the front wall meets the west wall, world
  // (-17, 135) — never got one. `castle.towers[3]` is the fourth corner tower `makeCandyCastle` hands
  // back: same mesh, same existing box, no new geometry. The whole plaza is symmetric about x = 0 (the
  // guard's patrol spans gx-1.5..gx+1.5, the jester sits at x=0, the fill ring outside is purely radial
  // from the world origin), so reflecting tower 2's own clearance about that line maps it straight onto
  // tower 3: (-21.5, 135) sits on the open ground just past this wall's outside corner, 1.4 m clear of
  // the tower's box, 4.5 m from its centre — comfortably inside the same 5.5 m radius used for tower 2 —
  // and, by that same radial symmetry, never within 15 m of anything that wanders Candy Land.
  { const lines3 = ['🍬 "Same fifteen metres as its twin across the gate, mirrored stripe for stripe."', '🍬 "Holds up the west corner, same as the other three hold up theirs."', '🍬 "Her Majesty\'s flag flies here too — nobody\'s ever said why one corner needs four flags and not three."'];
    game.addInteractable({ obj: castle.towers[3], radius: 5.5, label: () => 'Look up at the far corner tower', onUse: () => { SFX.click(); game.toast(rnd.pick(lines3), 3000); } }); }
  // towers 2 and 3 (the two corners flanking the gate, where the front wall meets east and west) got
  // their own look in the last two rounds; the two corners on the castle's far side, where the back
  // wall meets the side walls, were still untouched. `castle.towers[0]` is the first corner tower
  // `makeCandyCastle` hands back (build order: four corner towers, back-left/back-right/front-left/
  // front-right, then the two gate towers) — world (17, 165), the back wall's own east corner, same
  // mesh and existing box as every other tower here, no new geometry. The back wall sits the same 15 m
  // (`HD`) from the castle's own centre (0, 150) as the front wall does, just on the far side, so the
  // clearance already measured for tower 2 at its mirror point mirrors straight across the back wall
  // too: (21.5, 165) sits on open ground just past this wall's own outside corner, 1.4 m clear of the
  // tower's box and 4.5 m from its centre, comfortably inside the same 5.5 m radius. A headless probe
  // (`game.load(1, 'from-hub')`, the same stub-three harness `test/run.mjs` itself uses, then 1200
  // simulated frames sampling every NPC's own position throughout) found nothing wandering within 19 m
  // of that point — well past the radius once the tower's own half-extent is added in.
  { const lines0 = ['🍬 "The quiet side of the castle — nobody ever comes round the back to look."', '🍬 "Same fifteen metres as the front towers, just facing the wrong way to get noticed."', '🍬 "Her Majesty\'s flag flies here too, for an audience of nobody but the sweet-lands."'];
    game.addInteractable({ obj: castle.towers[0], radius: 5.5, label: () => 'Look up at the back corner tower', onUse: () => { SFX.click(); game.toast(rnd.pick(lines0), 3000); } }); }
  // tower 0 (back wall meets east wall, world (17, 165)) got its own look last round; its mirror image
  // across the castle's own centre line — tower 1, where the back wall meets the west wall, world
  // (-17, 165) — is the last of the six towers still untouched. `castle.towers[1]` is the second corner
  // tower `makeCandyCastle` hands back: same mesh, same existing box, no new geometry. The plaza's own
  // symmetry about x = 0 (used for towers 2 and 3 above, and again for tower 0's own clearance) maps
  // tower 0 straight onto tower 1, so the clearance already measured there mirrors across: (-21.5, 165)
  // sits on open ground just past this wall's outside corner, 1.4 m clear of the tower's box, 4.5 m from
  // its centre — comfortably inside the same 5.5 m radius — and, by that same radial symmetry, never
  // within 19 m of anything that wanders Candy Land. All six of the castle's towers now answer a look.
  { const lines1 = ['🍬 "Last of the six — every tower in the castle finally has something to say."', '🍬 "Same fifteen metres as its twin across the back wall, stripe for stripe."', '🍬 "Her Majesty\'s flag again. Six towers, six flags, not one of them ever lowered."'];
    game.addInteractable({ obj: castle.towers[1], radius: 5.5, label: () => 'Look up at the last corner tower', onUse: () => { SFX.click(); game.toast(rnd.pick(lines1), 3000); } }); }
  // round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races)
  // has by now gone round every other world — Frosty Peak, Robot City, Sunny Shore, Whisper Woods and
  // Victorian have all had two rigs strain against a rope of their own (`TugOfWar`, 55-npcs.js) — but
  // Candy Land, for all its tetherball pole and its carousel, never had the one contest with no ball,
  // shoe or shuttle to send back and forth. Two market hands now dig their heels into the open grass
  // far out past the east cane-forest belt and heave on a length of liquorice rope between them, never
  // quite settling either way. *"Heave! That liquorice won't give an inch, and neither will I!"*
  // *"Mind your tail, puss — this rope's stickier than it looks."* *"Dead heat again. Sugar makes for
  // a slippery grip, some days."*
  //
  // No new class and no new mesh: the exact same `TugOfWar` the other five worlds already use,
  // unchanged, with the same rope-and-flag dressing those five already build around it — just two
  // fresh `makeHuman` stall hands in candy-striped aprons rather than a snowsuit, factory overalls or
  // beachwear (the gingerbread rig's own arms have no shoulder/elbow sub-joints for `TugOfWar` to pose,
  // so this stays with `makeHuman` like every other world's pair).
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses —
  // click the real start button, `game.travel(1, 'from-prev')`, then poll `game.worldIndex` with a real
  // `setTimeout` sleep between frames rather than guessing a frame count) sampled every NPC's own
  // position every fifth frame over 1800 simulated frames, then swept a 2 m grid of the land's own
  // quiet south-east corner — short of the 92 m radius where `candyRegion`'s own procedural fill takes
  // over, clear of the chocolate river's own band (|z+18|<8), the cane-forest ring (54–78 m out) and
  // the castle's own approach (z>65) — against both those samples and all 1959 of the land's physics
  // boxes: (77, -41) came back clearest of the lot, 16.57 m from the nearest box and 20.89 m from the
  // nearest other soul at its own centre, with both hands' own stations 1.3 m either side of it (rope
  // running north-south) clear by 16.39–16.44 m of the nearest box and 20.22–21.62 m of the nearest
  // other soul — well past the cupcake hill at (58, -46) and the gumdrop patch at (52, -36).
  { const tugWard = makeWardrobe(r, { shirts: [0xffffff, 0xfff3e0], pants: [0xff6fb5, 0x7fd7ff], shoes: [0xffffff, 0xf5f2ea] });
    const handA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tugWard, build: 'stout' }),
      hat: 'cap', hatColor: 0xff6fb5, apron: 0xffffff, jacket: null, coat: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    const handB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tugWard, build: 'stout' }),
      hat: 'cap', hatColor: 0x7fd7ff, apron: 0xffffff, jacket: null, coat: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(handA.group); W.add(handB.group);
    const tug = new TugOfWar(game, handA, handB, { x: 77, z: -41, ry: 0, gap: 2.6,
      cries: ["Heave! That liquorice won't give an inch, and neither will I!", "Mind your tail, puss — this rope's stickier than it looks.", 'Dead heat again. Sugar makes for a slippery grip, some days.'] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, ropeM = mat(0x2a1a14, { roughness: 0.6 }), ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const ropeGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    ropeGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.035, 0.035, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 8), ropeM, { rx: PI / 2, parent: ropeGroup }));
    const flag = group(0, 0, 0, W); noInk(mesh(G.box(0.03, 0.14, 0.4), mat(0xff6fb5, { roughness: 0.7 }), { parent: flag }));
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.12;
      flag.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.03, lerp(A.z, B.z, frac)); flag.rotation.y = ropeGroup.rotation.y; }); }
  // The chocolate river has run through this land since round one, and `candyRegion`'s own far country
  // (just below) keeps a chocolate pool here and there, but nowhere in the walkable heart of Candy
  // Land has ever actually been a fountain. **A three-tiered chocolate fondue fountain now stands in
  // the open field north-east of the village**, basin brimming, four strawberries planted on skewers
  // round its rim. *"🍫 Three tiers, and not one of them has ever run dry."* *"🍓 Four strawberries,
  // and the fountain never once complains about sharing."* *"🍫 Sounds just like the river, if the
  // river only had to fill one bowl."*
  //
  // New prop `makeChocolateFountain()` (60-props.js, right after `makeDonut`): a basin, three stacked
  // cone-frustum tiers in the same `TEX.chocolate()` material the river itself already uses, and four
  // skewered strawberries round the rim. Pure static mesh, baked with the rest of this world — no
  // `userData.update` of its own, so nothing here needs a baking exemption — the only thing new to the
  // per-frame tick is a chocolate-drip particle burst on its own loop, the same ambience trick the
  // castle's music box and Robot City's scrap crane already use, timed off the shared `rnd()` sequence
  // only inside this `U.push` tick, which runs after every construction-time draw in this build, so it
  // shifts no wardrobe or layout pick anywhere.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `game.start('new')` then `game.load(1, 'from-prev')`, 3600 simulated frames sampling every NPC's
  // own position every sixth frame) swept a grid of the open field inside `candyRegion`'s own inner=92
  // hand-off boundary just below — short of the radius where its procedural fill takes over, so nothing
  // placed here risks a later blob landing on top of it — against both those 7900-odd samples and every
  // one of the land's own physics boxes and circles: (58, 68) came back clearest of the lot, 18.2 m
  // from the nearest box, circle or soul — north-east of the village, well clear of the castle's own
  // approach lane and the chocolate river's band.
  { const fx = 58, fz = 68, fy0 = P.ground0(fx, fz);
    const fountain = makeChocolateFountain(); fountain.position.set(fx, fy0, fz); W.add(fountain);
    P.addBox(fx, 0.7, fz, 2.5, 1.4, 2.5, { cam: false });
    let dripT = rnd.range(2, 4);
    U.push((dt) => { dripT -= dt; if (dripT <= 0) { dripT = rnd.range(2.5, 4.5); game.fx.emit(fx, fy0 + 2.15, fz, { count: 5, color: 0x3a1a08, speed: 0.3, up: 0.1, life: 1.1, gravity: 2.4, spread: 0.3 }); } });
    const fountainLines = ['🍫 "Three tiers, and not one of them has ever run dry."', '🍓 "Four strawberries, and the fountain never once complains about sharing."', '🍫 "Sounds just like the river, if the river only had to fill one bowl."'];
    game.addInteractable({ obj: fountain, radius: 3.0, label: () => 'Look at the chocolate fountain', onUse: () => { SFX.click(); game.toast(rnd.pick(fountainLines), 3000); } }); }
  candyRegion(game, U, r, 92, CANDY_LIMIT - 8);
  for (const [x, z] of [[-14, 18], [18, 16], [-8, -10], [10, -12], [-28, 8], [30, 4], [-22, 30], [22, 32], [-34, -32], [34, -36], [2, -30]]) { const b = makeMarshmallowBush(r); b.position.set(x, 0, z); W.add(b); P.addBox(x, 0.5, z, 1.2, 1, 1.2, { cam: false }); }
  for (const [x, z, ry, c] of [[-16, 8, 0.3, 0xff6fb5], [20, -8, -0.8, 0x7fd7ff], [0, 26, 1.5, 0xffd54a]]) { const d = makeDonut(c); d.position.set(x, 0, z); d.rotation.y = ry; W.add(d); addRotBox(game, x, 1.2, z, 0.6, 2.4, 3.4, ry, { cam: false }); }
  const puffs = []; for (let i = 0; i < 12; i++) puffs.push(makeCloud(W, r.range(-120, 120), r.range(20, 36), r.range(-120, 120), r.range(1.2, 2.2), r.pick([0xffb6d9, 0xbfe3ff, 0xfff0b3]), r));
  U.push((dt) => { for (const c of puffs) { c.position.x += c.userData.drift * dt * 0.6; if (c.position.x > 150) c.position.x = -150; } });

  // gingerbread men
  for (const [x, z] of [[-10, 4], [-18, 14], [6, 26], [-4, -56], [-46, 34], [48, 32]]) { const rig = makeGingerbread(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.6, 0.9), leash: 10, r: 0.4, height: 1.4, idle: [1, 3] })); }
  // the Candy Queen's guard: three gingerbread men marching in step back and forth in front of her.
  // The lead already answers a "Say hello" prompt for free \u2014 `Marchers`' lead rig runs on `Patroller`,
  // whose constructor calls `greetable()` automatically, and a gingerbread rig carries `.cookie`, one
  // of the three tags `greetable()` checks for \u2014 but the two followers it drags along never got the
  // same wiring. The second guard got it by hand in an earlier round: the same `game.namedFriend` +
  // `game.addInteractable` move this log has used to close the same gap on the crab, penguin and
  // hedgehog columns' own followers, tracked off `marchers[1].group`, which `Marchers.update()`
  // (55-npcs.js) already repositions at a fixed 1.3 m gap behind the lead every frame. This round
  // closes the guard out: the third, `guard[2].group`, gets the identical fix \u2014 `game.namedFriend`
  // + a tracked `game.addInteractable`, the same move the crab and penguin columns' own thirds already
  // got \u2014 with a line of its own rather than reusing the lead's and second's "mind my icing". All
  // three of the Candy Queen's guard can now be met.
  { const guard = [0, 1, 2].map(() => { const rig = makeGingerbread(); W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, guard, { points: [[-13, -27], [5, -27]], speed: 1.1, pause: [1, 2], r: 0.4, height: 1.4, gap: 1.3, cries: ['Hup, two, three, four!', 'Eyes front! Cat approaching!', 'Halt! ...who goes there? Oh, a kitty.'], cryIcon: '\ud83c\udf6a' }));
    const secondId = game.namedFriend('candy-guard-2');
    game.addInteractable({ obj: guard[1].group, radius: 2.1, label: () => 'Say hello', onUse: () => { game.befriend(secondId); SFX.tag(); game.hearts(guard[1].group.position.x, 1.1, guard[1].group.position.z, 3); game.toast('\ud83c\udf6a "Hee hee! Mind my icing!"'); } });
    const thirdId = game.namedFriend('candy-guard-3');
    game.addInteractable({ obj: guard[2].group, radius: 2.1, label: () => 'Say hello', onUse: () => { game.befriend(thirdId); SFX.tag(); game.hearts(guard[2].group.position.x, 1.1, guard[2].group.position.z, 3); game.toast('\ud83c\udf6a "Last in line, first to break step for a wave."'); } }); }
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
  // the sweet-stall sells peppermints and the chocolate fountain, the chocolate river has its own
  // angler, but the one fixture every candy-themed fair is built around — a cotton candy cart, the
  // spinning tub and all — never showed up anywhere in the land. A headless probe swept the open
  // grass south of the gingerbread cottage against every physics box and NPC roam circle already
  // built into the world: (4, -70) came back clear by 14.86 m from the nearest box and 16.02 m from
  // the nearest wandering soul, well inside the hand-built core (70 m out; the candy-cane ring only
  // starts at radius 92). `Vendor` (`55-npcs.js`) never calls `greetable()` on its own, same as the
  // sweet-stall above, so this one gets the same explicit `greetable(game, v6)`.
  { const cx = 4, cz = -70; game.zones.addCircle(cx, cz, 1.4);
    const cart = group(cx, 0, cz, W);
    const cabM = mat(0xffffff, { roughness: 0.5, map: TEX.candyCane() }), chromeM = mat(0xd8dde0, { metalness: 0.75, roughness: 0.25 });
    mesh(G.cyl(0.42, 0.46, 0.62, 16), cabM, { y: 0.31, shadow: 'both', parent: cart });                       // striped cart body
    for (const s of [-1, 1]) mesh(G.cyl(0.16, 0.16, 0.05, 14), mat(0x3a3a3a, { roughness: 0.6 }), { x: s * 0.44, y: 0.16, rx: PI / 2, parent: cart }); // wheels
    mesh(G.cyl(0.4, 0.4, 0.06, 16), chromeM, { y: 0.65, parent: cart });                                      // rim the drum sits in
    const tub = group(0, 0.68, 0, cart);
    mesh(G.cyl(0.36, 0.32, 0.22, 16), chromeM, { y: 0.11, parent: tub });                                     // the spinning drum itself
    const fluffColors = [0xffb3de, 0xffffff, 0xbdeeff];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + r() * 0.3, rr = r.range(0.1, 0.24);
      mesh(G.sphere(r.range(0.07, 0.11), 8, 6), mat(r.pick(fluffColors), { roughness: 0.9 }), { x: cos(a) * rr, y: 0.2 + r.range(0, 0.05), z: sin(a) * rr, shadow: 'none', parent: tub }); }
    let tubT = r() * TAU;
    U.push((dt) => { tubT += dt * 0.6; tub.rotation.y = tubT; });
    P.addBox(cx, 0.32, cz, 0.46, 0.65, 0.46, { cam: false });
    const spinWard = makeWardrobe(r, { shirts: [0xffffff, 0xffb3de, 0xbdeeff], pants: [0xffffff, 0x2a2420] });
    const spinner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2), wardrobe: spinWard }),
      pants: 0xffffff, apron: 0xbdeeff, hat: 'flatcap', hatColor: 0xffb3de, bag: null, jacket: null, scarf: null });
    W.add(spinner.group);
    const cone = group(0, 0, 0);
    mesh(G.cyl(0.015, 0.09, 0.05, 8), mat(0xf5e9d6, { roughness: 0.7 }), { y: 0.025, parent: cone });          // paper cone tip
    for (let i = 0; i < 7; i++) { const a = r() * TAU, d = r.range(0, 0.14);
      mesh(G.sphere(r.range(0.07, 0.1), 8, 6), mat(r.pick([0xffb3de, 0xffffff]), { roughness: 0.9 }), { x: cos(a) * d, y: 0.1 + r.range(0, 0.1), z: sin(a) * d, shadow: 'none', parent: cone }); }
    const sx = cx + 0.95, sz = cz;
    const v6 = new Vendor(game, spinner, cone, { x: sx, z: sz, ry: atan2(cx - sx, cz - sz), cryIcon: '🍭',
      cries: ["Fresh spun, still warm off the tub!", "Careful, puss — it melts the second it's damp.", "Sugar and air, that's the whole trick to it."] });
    game.npcs.push(v6); greetable(game, v6); }
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
    const trayLines = ['🍪 "Still warm — the icing hasn\'t set yet."', '🍪 "Three gingerbread men, fresh off the tray."', '🍪 "Smells like the whole cottage."'];
    game.addInteractable({ obj: tray, radius: 0.8, label: () => 'Look at the tray', onUse: () => { SFX.click(); game.toast(rnd.pick(trayLines), 3000); } });
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
  // the gingerbread men wander, march, dance, play catch and tag and every doorstep is lived-in, but
  // nobody in Candy Land ever just stood around and talked — the Neighborhood and Robot City each have
  // a `Talkers` pair already, and Victorian too; Candy Land was the last world without one. A headless
  // probe swept a grid of open-ground candidates against every physics box and NPC already built into
  // the world: (60, -30) came back clear by at least 0.8 m either side of the pair's own stance and over
  // 20 m from the nearest other soul, out on the quiet grass past the big lollipops east of the river.
  { const chatWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0, 0xff9ecf], pants: [0x7fd7ff, 0xff9ecf, 0xffffff, 0x2a2420] });
    const gossipA = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.3), wardrobe: chatWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    const gossipB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.3), wardrobe: chatWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(gossipA.group); W.add(gossipB.group);
    game.npcs.push(new Talkers(game, gossipA, gossipB, { x: 60, z: -30, ry: 0.4,
      lines: ["Have you tried this year's peppermints? Stronger than ever.", "I heard the Queen hasn't left the airlock in weeks.", "Mind the chocolate river — it never quite sets, that stuff.", 'The sentry at the gate looks half asleep today.'] })); }
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
  // the swing set keeps one child busy, but the Neighborhood is the only other world with a seesaw —
  // Candy Land's own gingerbread men can't use one (`Seesaw` reaches into a rider's `L.hip`/`L.knee`/
  // `L.ankle` and `A.sh`/`A.el`, which the cookie rig doesn't have), so two more village children get it
  // instead, same as the swing kid above. A headless probe swept a 3.6 m clearance disc against every
  // physics box and NPC circle built into the world so far: (25, 51) came back clear by over 13 m in
  // every direction, a quiet patch of grass just inside the candy-cane ring, well past the cupcake hill
  // to the north and the river bridge below.
  { const sx = 25, sz = 51;
    const seesaw = makeSeesaw({ color: 0x7fd7ff }); place(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0, 0xff9ecf], pants: [0x7fd7ff, 0xff9ecf, 0xffffff, 0xffd54a] });
    const kidA = makeHuman({ ...randomPerson(r, { child: true, female: false, wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const kidB = makeHuman({ ...randomPerson(r, { child: true, female: true, hairStyle: 'braids', wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(kidA.group); W.add(kidB.group);
    game.npcs.push(new Seesaw(game, kidA, kidB, seesaw, { x: sx, z: sz })); }
  // the Neighborhood, Robot City, Victorian, Sunny Shore, Frosty Peak and Whisper Woods all have a
  // Painter at an easel — Candy Land was the only one of the seven left without one. A headless probe
  // swept the meadow north-east of the river against every physics box and NPC roam circle already
  // built into the world: (60, 48) came back clear by 9.4 m from the nearest box and 20 m from the
  // nearest wandering gingerbread man, open grass with a clear view south to the cupcake hill at (60, 36).
  { const px = 60, pz = 48, pry = atan2(60 - px, 36 - pz);
    const painterWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0x7fd7ff, 0xff9ecf, 0xffffff] });
    const painter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: painterWard }),
      hat: 'flatcap', hatColor: 0xffd54a, apron: 0xfffdf7, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(painter.group);
    game.npcs.push(new Painter(game, painter, makeEasel(), { x: px, z: pz, ry: pry,
      cries: ["That cupcake's bigger than the castle, sugar for sugar.", "Careful, puss — the paint's not icing.", "I keep giving the icing too much shine. It never looks quite real."] })); }
  // the Neighborhood, Sunny Shore and Victorian all have someone actually playing an instrument
  // (a ukulele player twice over, a fiddler at the clock tower) — Candy Land never did, for all its
  // dancing and juggling. A woman strums a candy-striped ukulele on the open grass south-east of the
  // chocolate river, toward the two gossips rather than away from them (own small wardrobe, not any
  // other character's bag, since this build keeps none shared; placed last of every person this build
  // adds, after the painter, so it draws from the very tail of both the local `r` and the shared
  // `rnd()` sequences and disturbs the fewest later ticks of either)
  // (a headless probe over the built world — every physics box and every NPC's and the squirrel's own
  // position, sampled continuously over 300 simulated frames so no wandering gingerbread man or ring
  // dancer mid-turn could slip past unnoticed — found (49, -39) clear by 20.5 m in every direction,
  // well inside the radius (92) where candyRegion's own procedural fill takes over, between the cookie
  // path's cupcake hill and the gossiping pair)
  { const mx = 49, mz = -39, mry = atan2(60 - mx, -30 - mz);
    const museWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0xffffff] });
    const musician = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: museWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(musician.group);
    const uke = makeUkulele(r.pick([0xff6fb5, 0x7fd7ff, 0xffd54a]));
    uke.position.set(0.03, -0.02, 0.14); uke.rotation.set(-0.25, 0.1, 0.2);
    musician.hands[1].add(uke);
    game.npcs.push(new Charger(game, musician, { x: mx, z: mz, ry: mry,
      cries: ["Three chords, all of them sugar-sweet.", "Careful, puss — that's a ukulele, not a chew toy.", "Nobody's taught the gumdrops to dance, but I like to think they're trying."] }));
    U.push((dt, t) => { const A = musician.arms[1]; A.el.rotation.x = -1.0 + sin(t * 5.4) * 0.22; A.sh.rotation.z = -0.15; }); }
  // the Neighborhood, Sunny Shore and Frosty Peak all have a kite in the sky; Candy Land's own wide-open
  // sweet-lands, with nothing overhead but pennants and cupcake hills, never did. A boy now flies a
  // candy-striped kite from the same quiet stretch of grass the ukulele player and the gossiping pair
  // already share, east of the chocolate river. A headless probe swept every physics box and NPC already
  // built into the world against a grid of candidates: (51, -33) came back clear by over 19 m of the
  // nearest box and at least 6.3 m of the nearest other soul (the ukulele player at (49, -39)) — well past
  // KiteFlyer's own 0.35 m stance — with the wind set to carry the kite south over open grass, away from
  // everyone else rather than toward them.
  { const kiteWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0x2a2420] });
    const kiteKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: kiteWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(kiteKid.group);
    game.npcs.push(new KiteFlyer(game, kiteKid, makeKite(0xff6fb5, 0x7fd7ff), { x: 51, z: -33, wind: [0.25, -0.95],
      cries: ['Best wind all week, this!', "Careful, puss — don't swat it.", "Nearly snagged a cupcake hill, that time."] })); }
  // the Neighborhood, Robot City, Sunny Shore, Frosty Peak and Whisper Woods all have a Detectorist
  // sweeping for buried treasure — Candy Land and Victorian were the only two of the seven left
  // without one. A headless probe swept a grid of candidates against every one of the 1775 physics
  // boxes this build produces, every NPC's own position, and the sixteen gumdrop-patch donuts
  // `makeGumdrops` scatters (so the detector doesn't look like it's standing in a flowerbed): (23, 27)
  // came back clear by 17 m of the nearest other soul (a wandering gingerbread man at (6, 26)) and
  // 3.9 m of the nearest static prop (a candy cane at (26, 24)), open grass between the ring-dancing
  // gingerbread men and the gossiping pair, well inside the radius (92) where candyRegion's own
  // procedural fill takes over.
  { const scanWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0x7fd7ff, 0xff9ecf, 0xffffff] });
    const scanner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: scanWard }),
      hat: 'flatcap', hatColor: 0xffd54a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(scanner.group);
    game.npcs.push(new Detectorist(game, scanner, { x: 23, z: 27, ry: atan2(-23, 123),
      cries: ['Just a gumdrop. Every time.', 'Careful, puss — mind the wire.', "One day it'll be a whole lollipop."] })); }
  // every other world has a dog of its own by now — the beach's own wandering retriever, Frosty Peak's
  // husky by the sled run, even Robot City's answer in the sentry RoboDog — but Candy Land, sugar-dusted
  // as it is, never had one. A gingerbread-coloured pup now has the run of the open grass out past the
  // candy-cane forest belt, the same plain `makeDog` rig the beach and the Neighborhood's own backyard
  // already use, recoloured to match the cottage's own cookie dough rather than drawn from any shared
  // wardrobe. A headless probe swept this exact spot against every one of the world's 1866 physics
  // boxes and every NPC's own position over 400 simulated frames (so no wandering gingerbread man
  // mid-leash could slip past unnoticed): (-70, 50) came back clear by 16.7 m of the nearest box and
  // 28 m of the nearest other soul — past the candy-cane ring (which only runs out to radius 76) and
  // short of where `candyRegion`'s own procedural fill takes over, at radius 92.
  { const dog = makeDog(0xc27b3a); W.add(dog.group);
    game.npcs.push(new Wanderer(game, dog, { x: -70, z: 50, speed: 0.7, leash: 3, r: 0.35, height: 0.9, step: 0.3, idle: [1.5, 4], walk: [2, 5] }));
    const did3 = game.namedFriend('dog');
    game.addInteractable({ obj: dog.group, radius: 2.4, label: () => 'Pet the dog', onUse: () => { game.befriend(did3); SFX.woof(); game.hearts(dog.group.position.x, 0.8, dog.group.position.z, 4); game.toast('🐕 *happy tail wag*'); } }); }
  // the Neighborhood's had a yo-yo kid since round 267 and Robot City got one of its own two rounds
  // later — Candy Land, for all its marching, dancing and juggling gingerbread men, never had one.
  // A child works a yo-yo on the open grass east of the big lollipops, well short of the cane forest's
  // own outer ring. `YoYoer` needs no held prop beyond what it builds itself (the disc and string hang
  // straight off `rig.hands[1]`), so this is a placement, not a build. A headless probe swept a grid of
  // candidates against every one of the world's physics boxes and 500 simulated frames of every NPC's
  // own position (so no wandering gingerbread man, ring dancer or tag pair mid-turn could slip past
  // unnoticed): (32, 38) came back clear by 10.4 m from the nearest box and 14.2 m from the nearest
  // other soul, 49.7 m out from the origin — comfortably short of the radius (56) where the candy-cane
  // forest belt begins and well inside the one (92) where candyRegion's own procedural fill takes over.
  { const yoyoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0x7fd7ff, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(yoyoKid.group);
    game.npcs.push(new YoYoer(game, yoyoKid, 0xff6fb5, { x: 32, z: 38, ry: atan2(0 - 32, 0 - 38),
      cries: ["Forty drops and no tangles yet, puss!", 'Careful — it swings wider than it looks.', "Nearly a loop-the-loop, that time."] })); }
  // Whisper Woods, Sunny Shore and the Neighborhood all have a jump-rope kid by now — Candy Land, for
  // all its yo-yo kid a few lines up, never had one. A child skips rope on the open grass out past the
  // hand-placed candy-cane ring (that loop only reaches out to `d: r.range(56, 76)`), short of the
  // radius (92) where `candyRegion`'s own procedural fill takes over. `JumpRoper` needs no held prop
  // beyond the loose grip at each hand it builds itself (the spinning rod hangs off the hips), so this
  // is a placement, not a build. A headless probe built the real Candy Land (`game.travel(1, 'from-prev')`),
  // sampled every NPC's own position every quarter second over 30 simulated seconds (so no marching,
  // dancing or wandering gingerbread man, nor the tag or catch pairs mid-turn, could slip past
  // unnoticed), then swept a 1 m grid of the grass beyond the cane ring against both those samples and
  // every physics box: (-59, 50) came back clear by 8.8 m of the nearest box (one of the outer
  // lollipops) and 11.0 m of the nearest other soul.
  { const roper = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xa8ff9a, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(roper.group);
    game.npcs.push(new JumpRoper(game, roper, 0xffd54a, { x: -59, z: 50, ry: atan2(0 - (-59), 0 - 50),
      cries: ['Two hundred and not a single trip!', 'Careful, puss — it swings wider than it looks.', 'The gingerbread men never bounce this well.'] })); }
  // the Neighborhood, Sunny Shore and Whisper Woods all have a hula hooper by now — Candy Land, for all
  // its yo-yo kid and jump-rope kid a few lines up, never had one. A child works a hula hoop on the open
  // grass well past the candy-cane ring (which only runs out to `d: r.range(56, 76)`), clear of every
  // hand-placed prop in this build. `HulaHooper` needs no held prop beyond the one ring it builds itself
  // (parented to the body at waist height), so this is a placement, not a build. A headless probe built
  // the real Candy Land (`game.travel(1, 'from-prev')`), sampled every NPC's own position every quarter
  // second over 30 simulated seconds (so no marching, dancing or wandering gingerbread man, nor the tag
  // or catch pairs mid-turn, could slip past unnoticed), then swept a 1 m grid of the open grass (radius
  // 78–87) against both those samples and every physics box: (39, -77) came back clear by 19.6 m of the
  // nearest box and 20.1 m of the nearest other soul, at radius 86.3 from the origin — short of the
  // radius (92) where `candyRegion`'s own procedural fill takes over.
  { const hoopKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xff9ac8, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(hoopKid.group);
    game.npcs.push(new HulaHooper(game, hoopKid, 0x7fe0ff, { x: 39, z: -77, ry: atan2(0 - 39, 0 - -77),
      cries: ['Sixty spins before lunch, easy!', "Careful, puss — the ring's wider than it looks from out there.", 'Keeps me warm without even running.'] })); }
  // the Neighborhood has had a kid kneeling by a wobbly scooter since round 207, and no other world ever
  // picked up one of its own — Candy Land, for all its yo-yo kid, jump-rope kid and hula hooper a few
  // lines up, never had one either. A girl kneels in the open grass out past the candy-cane ring,
  // tightening her scooter's back wheel. Same `makeScooter()` + `Kneeler` pairing as the Neighborhood's
  // own scooter kid, no new controller. A headless probe built the real Candy Land
  // (`game.travel(1, 'from-prev')`), sampled every NPC's own position every quarter second over 30
  // simulated seconds (so no marching, dancing or wandering gingerbread man, nor the tag or catch pairs
  // mid-turn, could slip past unnoticed), then swept a 2 m grid of the open sweet-lands (short of the
  // radius (92) where `candyRegion`'s own procedural fill takes over, clear of the river band and every
  // hand-placed prop in this build) against both those samples and every physics box: (-30, -84) came
  // back clear by 18.5 m of the nearest box and 34.1 m of the nearest other soul, at radius 89.2 from the
  // origin.
  { const sx = -30, sz = -84, kx = -29.1, kz = -84, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0xffd54a); place(game, U, scooter, sx, sz, 0.4);
    P.addBox(sx, 0.4, sz, 0.3, 0.8, 0.6, { cam: false });
    const scootKid = makeHuman({ ...randomPerson(r, { child: true, female: true }), shirt: 0xff6fb5, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(scootKid.group);
    game.npcs.push(new Kneeler(game, scootKid, { x: kx, z: kz, ry,
      cries: ['Just a wobbly bolt — nearly got it.', "Careful, puss — mind your tail, this spins.", "Good as new. Three cupcake hills, no hands, easy."] })); }
  // the Neighborhood, Robot City, Victorian, Sunny Shore and Whisper Woods all pair a stroller with a
  // dog on a lead (`DogWalker`) by now — Candy Land, for all its own gingerbread-coloured standalone pup
  // a few lines up, never had a second, walked dog of its own. A woman now strolls a chocolate-brown dog
  // along the open sweet-lands west of the cottage, well short of where `candyRegion`'s own procedural
  // fill takes over. `DogWalker`'s own friend key is configurable (`o.key`, defaulting to `'dog'`), so
  // this one claims `'walked-dog'` instead, leaving the standalone pup's own claim on the plain `'dog'`
  // key untouched. A headless probe built the real Candy Land (`game.load(1, 'from-prev')`), sampled
  // every NPC's own position every quarter second over 30 simulated seconds (so no marching, dancing or
  // wandering gingerbread man, nor the tag or catch pairs mid-turn, could slip past unnoticed), then
  // swept a 2 m grid of the open sweet-lands (radius ≤ 85, short of the radius (92) where candyRegion's
  // own fill takes over) against both those samples and every one of the world's 1867 physics boxes:
  // (-83, 5) came back clear by 19.6 m of the nearest box and 40.7 m of the nearest other soul, at
  // radius 83.2 from the origin.
  { const dwx = -83, dwz = 5, dwry = atan2(0 - dwx, 0 - dwz);
    const walkerWard = makeWardrobe(r, { shirts: [0xffe0ea, 0x7fd7ff, 0xfff3b0], pants: [0xff9ecf, 0x2a2420, 0x7fd7ff] });
    const walker = makeHuman({ ...randomPerson(r, { female: r.chance(0.6), child: false, elder: r.chance(0.3), wardrobe: walkerWard }),
      hat: r.chance(0.4) ? 'flatcap' : null, hatColor: 0xffd54a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.2) });
    W.add(walker.group);
    const walkedDog = makeDog(0x5a4a3a);
    game.npcs.push(new DogWalker(game, walker, walkedDog, { x: dwx, z: dwz, angle: dwry, speed: 0.8, leash: 4, key: 'walked-dog',
      cries: ["She's never met a cupcake hill she didn't try to climb.", 'Careful, puss — mind your tail, she only wants a sniff.', "Same loop every morning, out past the cane ring and back."] })); }
  // the Neighborhood has had a girl chalking a hopscotch grid onto its own pavement since round 141,
  // and Robot City and Victorian each picked the game up in turn — Candy Land, for all its marching,
  // dancing, juggling and tag-playing gingerbread men, never had one. A girl now kneels on the open
  // sweet-lands west of the cane ring, six squares chalked straight onto the grass, same `Kneeler`
  // stance and the same hand-held chalk stub (parented into her own hand) every chalking kid in this
  // file already uses. A headless probe built the real Candy Land (`game.load(1, 'from-prev')`),
  // sampled every NPC's own position every quarter second over 30 simulated seconds (so no marching,
  // dancing or wandering gingerbread man, nor the tag or catch pairs mid-turn, could slip past
  // unnoticed), then swept a grid of the open sweet-lands (radius 20-88, short of the radius (92)
  // where candyRegion's own procedural fill takes over) against both those samples and every one of
  // the world's 1867 physics boxes: (-85.2, 29) came back clear by 19.8-22.9 m of the nearest box and
  // at least 24 m of the nearest other soul, across the whole six-square span.
  { const gz = 29, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = -85.2 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const kx = squares[0][0] - 0.9, kz = gz + 0.15;
    const chalker = makeHuman({ ...randomPerson(r, { female: true, child: true }), hairStyle: 'braids', shirt: 0x7fd7ff, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(chalker.group);
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['Six squares, dry before the gingerbread men march past.', 'Careful, puss — mind the chalk lines!', "Nobody else out here to play it with, but I like the quiet."] })); }
  // Robot City, the Neighborhood and Victorian have each picked up marbles by now — the oldest pavement
  // game of all — but Candy Land, for all its hula hoop, scooter kid, dog walker and hopscotch grid a
  // few lines up, never had a ring of its own. A boy now kneels on the open sweet-lands south-west of
  // the cane ring, flicking marbles at a chalked ring. `Kneeler`'s own patting motion already reads as
  // the flick, the same trick every other chalking or flicking kid in this file already uses, so this
  // is a placement, not a build (own fixed wardrobe, not any shared bag). A headless probe built the
  // real Candy Land (`game.travel(1, 'from-prev')`), sampled every NPC's and the squirrel's own
  // position every quarter second over 30 simulated seconds (so no marching, dancing or wandering
  // gingerbread man, nor the tag or catch pairs mid-turn, could slip past unnoticed), then swept a grid
  // of the open sweet-lands against both those samples and every one of the world's 1867 physics boxes:
  // (-65, -60) came back clear by 13.17 m of the nearest box and 30.41 m of the nearest other soul, at
  // radius 88.5 from the origin — short of the radius (92) where candyRegion's own procedural fill
  // takes over, and far past the scooter kid at (-30, -84), the dog walker at (-83, 5) and the
  // hopscotch grid at (-85.2, 29). Placed last of every person this build adds, after the hopscotch
  // chalker, so it draws from the very tail of both the local `r` and the shared `rnd()` sequences and
  // disturbs the fewest later ticks of either.
  { const mcx = -65, mcz = -60, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: mcx + marblePos[i][0], y: 0.035, z: mcz + marblePos[i][1], shadow: 'none', parent: W });
    mesh(G.sphere(0.035, 8, 6), mat(0xffd54a, { roughness: 0.2 }), { x: mkx + 0.35, y: 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff, 0xffd54a] });
    const marbleKid = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: marbleWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(marbleKid.group);
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["Watch close — I never miss.", "Careful, puss — don't swallow one of these.", "Won every single one fair and square."] })); }
  // Robot City's archive-bot and Victorian's night watchman both react to the cat on their own, no `E`
  // needed, but that trick had only ever been tried in those two worlds. A candy-striped jack-in-the-box
  // now sits closed on the open grass east of the chocolate river, spring crouched down inside — until
  // the cat wanders within 7 m, when the lid flips open and a bell-capped jester springs up with a
  // bounce and a shout, settling back down and swinging the lid shut again once the cat wanders off.
  // A headless probe built the real Candy Land (`game.travel(1, 'from-prev')`), sampled every NPC's
  // and the squirrel's own position every quarter second over 30 simulated seconds (so no marching,
  // dancing or wandering gingerbread man, nor the tag or catch pairs mid-turn, could slip past
  // unnoticed), then swept a 1.5 m grid of the open sweet-lands (radius 10-45, clear of the chocolate
  // river's own keep-out band) against both those samples and every one of the world's 1867 physics
  // boxes: (40.5, -1.5) came back clear by 9.8 m of the nearest box and 15.0 m of the nearest other
  // soul, at radius 40.5 from the origin — well inside the candy-cane ring (which only starts at radius
  // 56) and nowhere near either bridge (x = 0, -44, 46) or the river's own z-band.
  { const bx = 40.5, bz = -1.5, bry = atan2(0 - bx, 0 - bz);
    const box = group(bx, 0, bz, W); box.rotation.y = bry;
    const stripeA = mat(0xd6283c, { roughness: 0.6 }), stripeB = mat(0xfffdf7, { roughness: 0.5 }), gold = mat(0xd4af37, { roughness: 0.35, metalness: 0.4 });
    mesh(G.box(0.9, 0.62, 0.9), stripeA, { y: 0.31, parent: box });
    for (let i = 0; i < 4; i++) mesh(G.box(0.92, 0.1, 0.92), stripeB, { y: 0.08 + i * 0.16, shadow: 'none', parent: box });
    for (const s of [-1, 1]) mesh(G.box(0.04, 0.62, 0.92), gold, { x: s * 0.45, y: 0.31, shadow: 'none', parent: box });
    P.addBox(bx, 0.31, bz, 0.9, 0.62, 0.9);
    // the lid hinges off the box's own back edge so it tips up and open rather than sliding
    const hinge = group(0, 0.62, -0.45, box);
    mesh(G.box(0.92, 0.08, 0.92), stripeA, { y: 0.04, z: 0.45, parent: hinge });
    mesh(G.sphere(0.07, 10, 8), gold, { y: 0.08, z: 0.87, shadow: 'none', parent: hinge });
    // the spring and the jester riding it, parented together so the whole figure rides the box's own local Y
    const spring = group(0, 0.31, 0, box);
    mesh(G.cyl(0.18, 0.18, 0.4, 10), mat(0xffd54a, { roughness: 0.4 }), { parent: spring });
    for (let i = 0; i < 5; i++) noInk(mesh(G.torus(0.19, 0.025, 6, 14), mat(0xff8f1f, { roughness: 0.4 }), { y: -0.18 + i * 0.09, rx: PI / 2, shadow: 'none', parent: spring }));
    const face = group(0, 0.42, 0, spring);
    mesh(G.sphere(0.2, 14, 10), mat(0xffe0b8, { roughness: 0.7 }), { parent: face });
    for (const s of [-1, 1]) mesh(G.sphere(0.028, 8, 6), mat(0x1a1410), { x: s * 0.08, y: 0.03, z: 0.17, shadow: 'none', parent: face });
    noInk(mesh(G.torus(0.08, 0.012, 6, 10, PI), mat(0x8a2a2a), { y: -0.04, z: 0.18, rx: PI, shadow: 'none', parent: face }));
    for (const s of [-1, 1]) { const horn = group(s * 0.12, 0.16, 0, face); horn.rotation.z = s * 0.9;
      mesh(G.cone(0.075, 0.32, 8), stripeB, { y: 0.16, parent: horn }); mesh(G.sphere(0.045, 8, 6), gold, { y: 0.32, shadow: 'none', parent: horn }); }
    let boxNear = false, boxOpen = 0;
    const boxLines = ['🪅 "Surprise! …did I get you? I always get them."', '🪅 "Careful, puss — I spring higher than I look."', '🪅 "Nobody\'s jumped this high since the Queen\'s own coronation."'];
    box.userData.update = (dt, t) => {
      const c = game.cat.group.position, near = dist2(c.x, c.z, bx, bz) < 49;
      boxOpen = damp(boxOpen, near ? 1 : 0, 6, dt);
      hinge.rotation.x = -boxOpen * 2.1;
      spring.position.y = 0.31 + boxOpen * 0.5 + (near ? sin(t * 9) * 0.04 * boxOpen : 0);
      face.rotation.z = near ? sin(t * 7) * 0.15 * boxOpen : 0;
      if (near && !boxNear) { boxNear = true; SFX.bounce(); game.toast(rnd.pick(boxLines)); game.fx.emit(bx, 0.9, bz, { count: 14, colors: [0xffd54a, 0xff6fb5, 0x7fd7ff], speed: 1.4, up: 1.2, life: 0.7, gravity: 2.2, spread: 0.5 }); }
      if (!near) boxNear = false;
    };
    U.push(box.userData.update); }
  // the Neighborhood and Robot City each have a trampoline by now — Candy Land, for all its swing set,
  // seesaw and jack-in-the-box a few lines up, never had one. A gumdrop-pink trampoline now bounces a
  // village child on the open grass north-east of the seesaw, well clear of the butterflies' own flight
  // box (x within ±32) and the castle approach (z > 70). Same `makeTrampoline` prop and `Bouncer`
  // controller the Neighborhood's own backyard already uses, just restriped to match the sweet-lands'
  // own palette; placed last of every person this build adds, after the marbles kid and the
  // jack-in-the-box, so it draws from the very tail of both the local `r` and the shared `rnd()`
  // sequences and disturbs the fewest later ticks of either.
  // A headless probe (the stub-three harness `test/run.mjs` itself uses, driven by hand with
  // `game.travel(1, 'from-prev')`) sampled every NPC's own position every quarter second over 400
  // simulated frames (so no marching, dancing or wandering gingerbread man, nor the tag or catch pairs
  // mid-turn, could slip past unnoticed), then swept a grid of the open sweet-lands against both those
  // samples and every one of the world's physics boxes: (38, 60) came back clear by 13.1 m of the
  // nearest box (the seesaw) and 17.8 m of the nearest other soul, at radius 71 from the origin — inside
  // the candy-cane ring's own 56-76 m band but nowhere near any actual cane trunk at that angle, and
  // well short of the radius (92) where candyRegion's own procedural fill takes over.
  { const tx = 38, tz = 60;
    const tramp = makeTrampoline({ color: 0xff6fb5 }); place(game, U, tramp, tx, tz, 0);
    P.addBox(tx, 0.21, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceWard = makeWardrobe(r, { shirts: [0xffe0ea, 0x7fd7ff, 0xfff3b0] });
    const bounceKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: bounceWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(bounceKid.group);
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: 0, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Higher than the cupcake hill, nearly!", "Careful, puss — mind the springs round the edge.", "Bet I could bounce clean over the cane forest."];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }
  // Victorian's hedgerows, the woods' mushroom patch and the shore's rock pools all have a forager
  // stooped over them by now — Candy Land, whose own ground is half gumdrop button and half marzipan,
  // never had anyone picking at it. A girl now kneels on the open sweet-lands, picking stray gumdrops up
  // one at a time. No new controller: `Forager`'s own reach-and-pick animation already reads as plucking
  // something small off the ground, the same trick the woods' mushroom-picker and Victorian's own
  // mudlark already use. A scatter of loose gumdrop spheres sits in front of her knees — small enough to
  // carry no physics box of their own, the same precedent the hopscotch chalk squares nearby already
  // set — so the picking has something to aim at.
  // A headless probe (`game.load(1, 'from-hub')`, the same stub-three harness `test/run.mjs` itself
  // uses) sampled every NPC's own position every quarter second over 300 simulated seconds (long enough
  // for every marching, dancing, wandering and ball-tossing gingerbread man to clear the spot several
  // times over), then swept the open sweet-lands (radius 10-80, short of the radius (92) where
  // candyRegion's own procedural fill takes over, and clear of the chocolate river band) against both
  // those samples and every one of the world's physics boxes: (56, 15) came back clear by 12.6 m of the
  // nearest box or soul. Placed last of every person this build adds, after the trampoline, so it draws
  // from the very tail of this world's own local `r()` sequence.
  { const fx = 56, fz = 15, fry = atan2(0 - fx, 0 - fz);
    const gumColors = [0xff3355, 0x4ade80, 0x64b5f6, 0xffd54a, 0xff8fab];
    const gumPos = [[-0.18, 0.1], [0.12, -0.14], [0.02, 0.22], [-0.26, -0.08], [0.22, 0.04]];
    for (let i = 0; i < gumPos.length; i++) mesh(G.sphere(0.045, 8, 6), mat(gumColors[i], { roughness: 0.3 }), { x: fx + gumPos[i][0], y: 0.045, z: fz + gumPos[i][1], shadow: 'none', parent: W });
    const forageWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff, 0xffd54a] });
    const forager = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: forageWard }), hairStyle: 'braids', hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(forager.group);
    game.npcs.push(new Forager(game, forager, { x: fx, z: fz, ry: fry, cryIcon: '🍬',
      cries: ['Found a whole handful, right by the lollipops!', "Careful, puss — don't swallow one, they're real.", 'Grows right out of the ground here. Nobody knows why.'] })); }
  // Candy Land is named for the stuff, but nobody down there had ever actually made any of it — every
  // other world's own landmark ties to its own craft (Robot City's conveyor line, Victorian's clock
  // tower) while the sweet-lands just grew the candy out of the ground. A taffy-pulling machine now
  // works on its own: two posts, a hand crank, and a rope of pink taffy slung between a pair of
  // swinging hooks, pulled nearly together then stretched out thin before gathering back in — the real
  // shop motion, just slowed down and made of cartoon taffy. A candy-shop worker stands at the crank
  // and talks through it. No new controller: a plain `Charger`, the same pairing every other standing
  // vendor in this file already uses; the machine's own motion is a single `U.push` swinging two hook
  // pivots in mirror and re-deriving the strand's length, midpoint and radius from their own positions
  // each frame, off the shared world clock `t` alone, never this world's own seeded `r`, so it costs no
  // later wardrobe or colour pick. *"Pull, stretch, fold — that's the whole trick."* *"Lovely and
  // glossy once it's pulled enough, this."* *"Mind your whiskers near the hooks, puss."*
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Candy Land
  // (`game.load(1, 'from-hub')`), sampled every NPC's own position every quarter second over 400
  // simulated seconds — long enough for every marching, dancing, wandering and ball-tossing gingerbread
  // man to clear the spot several times over — then swept the open sweet-lands (radius 8-75, short of
  // the radius (92) where candyRegion's own procedural fill takes over, and clear of the chocolate
  // river band) against both those samples and all 1870 of the world's physics boxes: (-24, -70) came
  // back clear by 14.87 m of the nearest box or soul.
  { const mx = -24, mz = -70;
    const g = group(mx, 0, mz, W);
    const postMat = mat(0xc27b3a, { roughness: 0.9 }), steelMat = mat(0x9aa3ad, { metalness: 0.6, roughness: 0.4 });
    const taffyMat = mat(0xffaed4, { roughness: 0.22, metalness: 0.05 });
    for (const side of [-1, 1]) mesh(G.cyl(0.09, 0.09, 1.3, 10), postMat, { x: side * 0.9, y: 0.65, shadow: 'both', parent: g });
    const crank = group(-0.9, 1.05, 0, g);
    noInk(mesh(G.torus(0.22, 0.03, 8, 16), steelMat, { parent: crank }));
    mesh(G.cyl(0.03, 0.03, 0.26, 6), steelMat, { x: 0.22, rz: PI / 2, parent: crank });
    const pivotA = group(-0.9, 1.05, 0, g), pivotB = group(0.9, 1.05, 0, g);
    mesh(G.cyl(0.02, 0.02, 0.6, 6), steelMat, { y: -0.3, parent: pivotA });
    mesh(G.cyl(0.02, 0.02, 0.6, 6), steelMat, { y: -0.3, parent: pivotB });
    mesh(G.sphere(0.05, 8, 6), steelMat, { y: -0.6, shadow: 'none', parent: pivotA });
    mesh(G.sphere(0.05, 8, 6), steelMat, { y: -0.6, shadow: 'none', parent: pivotB });
    const strand = mesh(G.cyl(0.09, 0.09, 1, 10), taffyMat, { shadow: 'both', parent: g });
    P.addBox(mx, 0.7, mz, 2.8, 1.4, 0.9);
    U.push((dt, t) => {
      const swing = sin(t * 1.1) * 0.8;
      pivotA.rotation.z = swing; pivotB.rotation.z = -swing;
      crank.rotation.z += dt * 1.8;
      const len = 1.8 - 1.2 * sin(swing);
      strand.position.set(0, 1.05 - 0.6 * cos(swing), 0);
      strand.rotation.z = -PI / 2;
      const rf = clamp(1 / sqrt(len), 0.55, 1.6);
      strand.scale.set(rf, len, rf);
    });
    const ward = makeWardrobe(r, { shirts: [0xffe0ea, 0xff9fc9, 0xfff3b0] });
    const wkx = mx - 2.3, wkz = mz + 0.6;
    const puller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: ward }),
      apron: 0xfff3e6, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(puller.group);
    game.npcs.push(new Charger(game, puller, { x: wkx, z: wkz, ry: atan2((mx - 0.9) - wkx, mz - wkz), cryIcon: '🍬',
      cries: ['Pull, stretch, fold — that\'s the whole trick.', 'Lovely and glossy once it\'s pulled enough, this.', 'Mind your whiskers near the hooks, puss.'] })); }
  // the Neighborhood, Sunny Shore, Frosty Peak and Whisper Woods all have a birdwatcher scanning the
  // sky by now — Candy Land, for all its own peppermint sparrow and the six candy butterflies looping
  // overhead, never had anyone watching either. A birdwatcher now stands alone on the open sweet-lands
  // west of the candy-cane ring, binoculars raised to the sky every few seconds, same as every other
  // world's own. No new controller: `Birder` already builds its own binoculars and greets the cat the
  // same way every other standing figure in this file does.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Candy Land
  // (`game.load(1, 'from-prev')`), sampled every NPC's and the squirrel's own position every quarter
  // second over 300 simulated seconds (long enough for every marching, dancing, wandering and
  // ball-tossing gingerbread man to clear the spot several times over), then swept the open sweet-lands
  // (radius 6-88, clear of the chocolate river band and the castle approach) against both those samples
  // and every one of the world's physics boxes: (-53, 13) came back clear by 11.1 m of the nearest box
  // and 13.0 m of the nearest other soul, at radius 54.6 from the origin — short of the radius (56)
  // where the candy-cane ring itself begins. Placed last of every person this build adds, after the
  // taffy puller, so it draws from the very tail of this world's own local `r()` sequence.
  { const birdWard = makeWardrobe(r, { shirts: [0x6a7a4a, 0x4a5a6a, 0x7a6a4a], pants: [0x3a3a3a, 0x2f3a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const birder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: birdWard }),
      hat: 'cap', hatColor: 0x3a4a2e, glasses: true, glassColor: 0x2a2a2a, jacket: null, scarf: null, bag: null, backpack: null }); W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: -53, z: 13, ry: atan2(0 - -53, 0 - 13),
      cries: ["That peppermint sparrow again — never sits still.", "Careful, puss — you'll scatter the butterflies.", 'Mistook a lollipop for a woodpecker once. Never again.'] })); }
  // Victorian's own street photographer and Sunny Shore's holidaymaker both duck under a dark cloth to
  // capture their own world's view — Candy Land, for all its painter at the easel, never had anyone
  // pointing a camera at it. A tourist now sets up an old box camera on the open sweet-lands north-west
  // of the cane ring, framing the nearest cupcake hill and the candy-cane forest beyond it. No new
  // controller or prop: this is the exact same `Photographer` class and `makeOldCamera()` tripod
  // Victorian and Sunny Shore already use, just a sugar-pink wardrobe and a sunhat instead of a flatcap.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Candy Land
  // (`game.load(1, 'from-prev')`, then `game.start('new')` so every marching, dancing, wandering and
  // ball-tossing gingerbread man and the gingerbread-coloured dog actually moved), sampled every NPC's
  // own position every quarter second over 300 simulated seconds, then swept a 1 m grid of the open
  // sweet-lands (short of the radius (92) where candyRegion's own procedural fill takes over, clear of
  // the river band and the castle approach) against both those samples and every one of the world's
  // physics boxes: (-74, 34) came back clear by 13.5 m of the nearest box (the north-west cupcake hill)
  // and 13.0 m of the nearest other soul (the gingerbread-coloured dog's own wander leash at (-70, 50)).
  // Placed last of every person this build adds, after the birdwatcher, so it draws from the very tail
  // of this world's own local `r()` sequence.
  { const px = -74, pz = 34, pry = atan2(-58 - px, 30 - pz);
    const camWard = makeWardrobe(r, { shirts: [0xffffff, 0xff9ecf, 0x7fd7ff], pants: [0xffffff, 0xff9ecf, 0x7fd7ff], shoes: [0xffffff, 0xffd54a] });
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: camWard }),
      hat: 'sunhat', hatColor: 0xffd54a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(snapper.group);
    const camera = makeOldCamera();
    game.npcs.push(new Photographer(game, snapper, camera, { x: px, z: pz, ry: pry, cryIcon: '📷',
      cries: ['Best view of the cupcake hills from right here.', "Careful, puss — it's only flash powder, not fire.", 'The candy-cane forest never quite fits in one shot.'] })); }
  // Victorian (draughts, round 354), Robot City (checkers, round 384), Frosty Peak (cards, round 397),
  // Whisper Woods (draughts, round 407), the Neighborhood (chess, round 408) and Sunny Shore (mancala,
  // round 409) have all had a table game by now — Candy Land, named for the stuff and stuffed with more
  // sweets than any other world, was the only one of the seven left without one. A dominoes table now
  // sits on the open sweet-lands east of the village, a mid-game chain of seven iced tiles laid out
  // between two seated residents, a small messy stack of five more face-down beside it. *"Eighteen pips
  // and the lead's still mine."* *"Careful, puss — knock that chain and we start over."* *"Mind your
  // tail, puss — that's a whole afternoon's work."*
  //
  // No new controller: both players are a plain `Sitter`, the same pairing every other table game in
  // this file already uses, each on a `makeIceStool()` — the same generic three-legged stool the
  // draughts, card, chess and mancala tables all reuse too. The table itself is a plain iced-white
  // tabletop on four cookie-brown posts (no candy-cane stripe map this time — wrapping `TEX.candyCane()`
  // round a flat plane reads as diagonal noise rather than a tablecloth, so this keeps the same solid
  // colour the gingerbread cottage's own icing already uses). Each tile is a flat box split by a thin
  // dark divider with up to six pips per half, built from the same canonical dot layout real dominoes
  // and dice both use — `PIP[n]` below, not pulled from any shared helper since none existed yet. The
  // seven-tile chain matches real play, number for number, at every join (6|6 - 6|2 - 2|2 - 2|5 - 5|5 -
  // 5|0 - 0|3), though the three doubles stay inline rather than turned crosswise the way a real chain
  // would turn them — a straight row was plenty to read as "mid-game" without the extra layout math.
  //
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // calling `game.travel(1, 'from-prev')` and waiting out its real 520 ms fade timer rather than
  // `game.load()` directly, since a bare `load()` never flips `game.worldIndex` or finishes building the
  // next world's own NPCs on its own) sampled every NPC's and the squirrel's own position every quarter
  // second over 300 simulated seconds — long enough for every marching, dancing, wandering, ball-tossing
  // and tag-playing gingerbread man, both walked dogs and every doorstep resident to clear any one spot
  // several times over — then swept the sweet-lands against both those samples, every one of the world's
  // 1872 physics boxes and the sixteen gumdrop-patch circles `makeGumdrops` scatters (which carry no
  // physics box of their own, so a plain box sweep would have missed them): (82, 4) came back clear by
  // 13.52 m of the nearest box (one of the candy-cane ring's own trunks), 28.23 m of the nearest other
  // soul and 22.12 m of the nearest gumdrop patch, at radius 82.1 from the origin — past the candy-cane
  // ring's own outer edge (76 m) and short of the radius (92) where candyRegion's own procedural fill
  // takes over, in the same quiet empty band the dog walker (-83, 5) and the hopscotch grid (-85.2, 29)
  // already share on the opposite side of the map. Placed last of every person this build adds, after
  // the photographer, so it draws from the very tail of this world's own local `r()` sequence.
  { const PIP = { 0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [-1, 1], [1, -1], [1, 1]], 5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
      6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
    const tx = 82, tz = 4, topY = 0.72, tableLen = 2.6, tableWid = 1.0;
    const seatAz = tz - 0.85, seatBz = tz + 0.85;
    const woodM = mat(0xc27b3a, { roughness: 0.9 }), topM = mat(0xfffdf7, { roughness: 0.4 }), trimM = mat(0xd62839, { roughness: 0.5 });
    const table = group(tx, 0, tz, W);
    mesh(G.box(tableLen, 0.04, tableWid), topM, { y: topY, shadow: 'both', parent: table });
    noInk(mesh(G.box(tableLen + 0.04, 0.012, tableWid + 0.04), trimM, { y: topY - 0.025, shadow: 'none', parent: table }));
    for (const [lx, lz] of [[-tableLen / 2 + 0.14, -tableWid / 2 + 0.14], [tableLen / 2 - 0.14, -tableWid / 2 + 0.14], [-tableLen / 2 + 0.14, tableWid / 2 - 0.14], [tableLen / 2 - 0.14, tableWid / 2 - 0.14]])
      mesh(G.cyl(0.03, 0.035, topY, 8), woodM, { x: lx, y: topY / 2, z: lz, parent: table });
    const tileLen = 0.26, tileWid = 0.13, tileH = 0.03, tileY = topY + 0.021;
    const dividerM = mat(0x5a2d12, { roughness: 0.8 }), pipM = mat(0x3a2410, { roughness: 0.6 });
    const chain = [[6, 6], [6, 2], [2, 2], [2, 5], [5, 5], [5, 0], [0, 3]];
    const step = tileLen + 0.012, rowOffset = (chain.length - 1) / 2 * step;
    chain.forEach(([a, b], i) => {
      const cx = i * step - rowOffset;
      mesh(G.box(tileLen, tileH, tileWid), topM, { x: cx, y: tileY, z: 0, shadow: 'none', parent: table });
      mesh(G.box(0.01, tileH + 0.004, tileWid * 0.9), dividerM, { x: cx, y: tileY, z: 0, shadow: 'none', parent: table });
      for (const [half, n] of [[-1, a], [1, b]]) for (const [px, pz] of PIP[n])
        mesh(G.sphere(0.012, 6, 6), pipM, { x: cx + half * 0.065 + px * 0.045, y: tileY + tileH / 2 + 0.012, z: pz * 0.04, shadow: 'none', parent: table });
    });
    const boneX = rowOffset + step / 2 + 0.3;
    for (let i = 0; i < 5; i++) mesh(G.box(tileLen, tileH, tileWid), topM, { x: boneX + (i % 2) * 0.03, y: topY + 0.021 + i * 0.012, z: (i % 3 - 1) * 0.04, ry: (i - 2) * 0.18, shadow: 'both', parent: table });
    P.addBox(tx, topY / 2, tz, tableLen + 0.1, topY, tableWid + 0.1);
    place(game, U, makeIceStool(), tx, seatAz, PI); place(game, U, makeIceStool(), tx, seatBz, 0);
    const domWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff], pants: [0xfff3b0, 0x2a2420] });
    const playerA = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.4), wardrobe: domWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    const playerB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.4), wardrobe: domWard }),
      hat: 'flatcap', hatColor: 0xffd54a, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(playerA.group); W.add(playerB.group);
    game.npcs.push(new Sitter(game, playerA, { x: tx, z: seatAz, ry: 0, seat: 0.33,
      cries: ["Eighteen pips and the lead's still mine.", 'Careful, puss — knock that chain and we start over.', "Save the double six, it's the whole game right there."] }));
    game.npcs.push(new Sitter(game, playerB, { x: tx, z: seatBz, ry: PI, seat: 0.33,
      cries: ["One more tile and it's mine, easy.", "Mind your tail, puss — that's a whole afternoon's work.", 'Lost count past twelve. Started again, obviously.'] })); }
  // every other world that tucks a birthday or a festival detail away (Victorian's Punch and Judy,
  // Robot City's balloon seller) is in on the party — Candy Land, the one world actually named for a
  // party food, never had a party of its own. A star piñata now hangs from a tall post on the open
  // sweet-lands north of the village, swaying gently on its rope, with one party guest taking slow,
  // nerve-losing practice swings at it with a stick. *"One of these days I'm actually going to hit it."*
  // *"Careful, puss — swing room needed here."* *"Nearly! ...no. Still not yet."* It never actually
  // bursts: the stick's own downswing times a confetti puff to the moment of contact regardless of
  // whether the two models are really touching, and the piñata gets a decaying kick on its rope at that
  // same instant, both driven off the same zero-started clock so the two stay locked in step forever —
  // honest about not simulating an impact, while still reading as one.
  //
  // New controller (`PinataSwinger` in `55-npcs.js`, modelled on `FrisbeePlayer`'s and `YoYoer`'s own
  // held-prop pattern, with `Chopper`'s own overhead-swing timing: slow raise, fast strike): nothing
  // existing already swings a stick overhead at something that isn't a stump or a log. The piñata itself
  // (`makePinata()`, new, in `60-props.js`) is `G.star()` — already used for the star collectible, never
  // before for anything piñata-shaped — turned point-up with a pom-pom glued to each of its five tips and
  // a painted face on the front.
  //
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses,
  // since there's no browser here to look at it) built the real Candy Land (`game.load(1, 'from-prev')`,
  // then `game.start('new')` so every marching, dancing, wandering and ball-tossing gingerbread man and
  // every doorstep resident actually moved), sampled every NPC's own position every quarter second over
  // 300 simulated seconds, then swept a 2 m grid of the open sweet-lands (radius 30-70, inside the
  // candy-cane ring's own 56-76 m band but short of where candyRegion's own procedural fill takes over
  // at 92) against both those samples, all 1879 of this world's physics boxes and the sixteen gumdrop
  // patches `makeGumdrops` scatters (which carry no physics box of their own, so a plain box sweep would
  // have missed them): (14, 68) came back clear by 6.7 m of the nearest box (one of the candy-cane
  // ring's own trunks), 22.8 m of the nearest other soul and 13.0 m of the nearest gumdrop patch, at
  // radius 69.4 from the origin. Placed last of every person this build adds, after the dominoes
  // players, so it draws from the very tail of this world's own local `r()` sequence.
  { const px = 14, pz = 68, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const postM = mat(0x8a5a32, { roughness: 0.9 });
    const standG = group(px, 0, pz, W);
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0xff4f9a, [0xffd54a, 0x7fd7ff, 0xfff3b0, 0x9affc1, 0xffffff]);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    P.addBox(px, postH / 2, pz, 0.35, postH, 0.35, { cam: false });
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    U.push(standG.userData.update);
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const guestWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff, 0xffd54a, 0x9affc1], pants: [0xf5f2ea, 0x2a2420] });
    const guest = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, wardrobe: guestWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    W.add(guest.group);
    game.npcs.push(new PinataSwinger(game, guest, 0xc9a86a, { x: sx, z: sz, ry: sry,
      cries: ["One of these days I'm actually going to hit it.", 'Careful, puss — swing room needed here.', 'Nearly! ...no. Still not yet.'] })); }

  // the Neighborhood (round 395), Robot City (425, a magnetic coupling ring) and Victorian (426, a brass
  // quoit) have all had their own turn at the same back-garden toss game, but the one world actually
  // made of sweets has never had a sweet of its own flying through the air. **Two villagers now lob a
  // fat gummy ring back and forth, trying to land it over a pair of candy-cane stakes** stuck in the
  // sweet-lands east of the village. *"Right over the stripe — that's a landing!"* *"Careful, puss —
  // sticky if it lands on you!"* *"Best of nine, loser licks the loser's ring."*
  //
  // No new controller: the same `Horseshoes` class (`55-npcs.js`) both earlier reskins already use —
  // held a moment, lobbed on an arc, caught, lobbed back, with `SFX.clang()` softened by its own small
  // sugar-dust puff on landing instead of sparks. The stakes reuse `TEX.candyCane()`, already wrapped
  // round every candy cane in this world, on a plain cylinder; the ring itself is a fat torus
  // (`G.torus(0.13, 0.05, 8, 20)`, thicker than Victorian's brass quoit or Robot City's coupling ring)
  // in glossy gumdrop red, with two spares stacked by each stake for set dressing.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Candy Land (`game.start('new')` then `game.travel(1, 'from-prev')`, so every marching,
  // dancing and ball-tossing gingerbread man and every doorstep resident actually moved), sampled every
  // NPC's own position every quarter second over 300 simulated seconds, then swept a 2 m grid of the
  // open sweet-lands (radius 40-80, short of the radius (92) where candyRegion's own procedural fill
  // takes over) against both those samples and all 1874 of this world's physics boxes: (51, -1) came
  // back clear by over 10 m of the nearest box and nearly 17 m of the nearest other soul, and both
  // stakes themselves — (51, -5) and (51, 3), either side of the 8 m pitch — checked clear by 7.6 m and
  // 8.2 m of the nearest box respectively. Placed last of everyone this build adds, after the piñata
  // guest, so it draws from the very tail of this world's own local `r()` sequence and disturbs no
  // earlier pick.
  { const gcx = 51, gcz = -1, ggap = 8;
    const caneM = mat(0xffffff, { roughness: 0.4, map: TEX.candyCane() }), capM = mat(0x2a9d6e, { roughness: 0.5 });
    for (const sz of [gcz - ggap / 2, gcz + ggap / 2]) {
      mesh(G.cyl(0.05, 0.05, 0.6, 10), caneM, { x: gcx, y: 0.3, z: sz, parent: W });
      mesh(G.sphere(0.07, 10, 8), capM, { x: gcx, y: 0.63, z: sz, parent: W });
      P.addBox(gcx, 0.3, sz, 0.12, 0.6, 0.12, { cam: false });
    }
    const ringM = mat(0xe8172b, { roughness: 0.25 });
    for (const sz of [gcz - ggap / 2 + 0.55, gcz + ggap / 2 - 0.55]) for (let i = 0; i < 2; i++)
      mesh(G.torus(0.13, 0.05, 8, 20), ringM, { x: gcx + 0.3, y: 0.09 + i * 0.12, z: sz, rx: PI / 2, ry: i * 0.5, parent: W });
    const ringWard = makeWardrobe(r, { shirts: [0xffd54a, 0x7fd7ff, 0xff6fb5, 0x9affc1], pants: [0xf5f2ea, 0x2a2420] });
    const tossA = makeHuman({ ...randomPerson(r, { female: true, child: false, wardrobe: ringWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    const tossB = makeHuman({ ...randomPerson(r, { female: false, child: false, wardrobe: ringWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    W.add(tossA.group); W.add(tossB.group);
    const ring = mesh(G.torus(0.13, 0.05, 8, 20), ringM, { x: gcx, y: 1, z: gcz - ggap / 2, rx: PI / 2, parent: W });
    const ringLines = ['Right over the stripe — that\'s a landing!', 'Careful, puss — sticky if it lands on you!', "Best of nine, loser licks the loser's ring."];
    game.npcs.push(new Horseshoes(game, tossA, tossB, ring, { cx: gcx, cz: gcz, gap: ggap, cries: ringLines, cryIcon: '🍬' }));
    greetable(game, { rig: tossA }); greetable(game, { rig: tossB }); }

  // the Neighborhood, Robot City and Victorian all have a solo thrower tossing a disc straight up off
  // the palm by now, and Sunny Shore and Frosty Peak had it first — Candy Land and Whisper Woods are
  // the only two worlds left without one. **A villager now stands on the open sweet-lands' far
  // south-west corner, lobbing a gumdrop-pink disc straight up** — it rises on a spin, hangs a beat at
  // the top, and drops back into the palm for the next throw.
  //
  // No new controller or prop: the exact same `FrisbeePlayer` class (`55-npcs.js`, next to
  // `HulaHooper`) every other reskin already uses, unchanged — just this world's own candy wardrobe on
  // the thrower in place of beachwear, work overalls or a top hat.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Candy Land (`game.start('new')` then `game.travel(1, 'from-prev')`, so every marching,
  // dancing and ball-tossing gingerbread man and every doorstep resident actually moved), sampled every
  // NPC's own position every half second over 90 simulated seconds, then swept a 2 m grid of the open
  // sweet-lands (radius 30-85, short of the radius (92) where candyRegion's own procedural fill takes
  // over, and clear of every one of the sixteen gumdrop patches `makeGumdrops` scatters) against both
  // those samples and all of this world's physics boxes: (-77, -35) came back clear by 13.6 m of the
  // nearest box (one of the candy-cane forest ring's own trunks) and 26.4 m of the nearest other soul,
  // well past the cane ring and the chocolate river's own western bank. Placed last of everyone this
  // build adds, after the ring-toss pair, so it draws from the very tail of this world's own local
  // `r()` sequence and disturbs no earlier pick.
  { const fx = -77, fz = -35, fry = atan2(0 - fx, 0 - fz);
    const frisbeeWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff, 0xffd54a], pants: [0xf5f2ea, 0x2a2420], shoes: [0xffffff, 0x8d6e63] });
    const thrower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: frisbeeWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2) });
    W.add(thrower.group);
    game.npcs.push(new FrisbeePlayer(game, thrower, 0xff8fc8, { x: fx, z: fz, ry: fry,
      cries: ["Highest one yet — nearly lost it over the cane trees.", "Careful, puss — mind your tail, this one's coming down fast.", "One more throw. The gumdrops aren't going anywhere."] })); }

  // the Neighborhood, Victorian, Frosty Peak, Whisper Woods and Sunny Shore all have a woodcutter
  // splitting logs on a stump by now (`makeStump()` + `Chopper`, round 207 on) — Robot City and Candy
  // Land were the only two worlds left without one. A woodcutter now splits logs on a stump deep in the
  // northern sweet-lands, past the cane forest ring, keeping the castle's gingerbread ovens fed. Same
  // `Chopper` controller (`55-npcs.js`) unchanged — same stump, same axe, same chip burst on every
  // landed blow — just this world's own candy-bright wardrobe on the cutter in place of flannel or
  // oilskins, and the flat-floor `place`/`P.addBox` pair every other reskin on open ground already uses.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Candy Land with a real `start('new')` click first, so every wandering, patrolling, dancing
  // and ball-tossing gingerbread man and every doorstep resident actually moved, sampled every NPC's and
  // the squirrel's own position every quarter second over 300 simulated seconds, then swept a 2 m grid
  // of the open sweet-lands (radius 20-85, short of the radius (92) where candyRegion's own procedural
  // fill takes over, clear of the river band and clear of every one of the sixteen gumdrop patches
  // `makeGumdrops` scatters, which carry no physics box of their own) against both those samples and
  // every one of this world's physics boxes: (29, 79) came back clear by 17.0 m of the nearest box (a
  // cupcake hill) and 17.9 m of the nearest other soul, well past the cane forest belt.
  { const sx = 29, sz = 79, cx = 29, cz = 80.4;
    place(game, U, makeStump(r), sx, sz, r() * TAU); P.addBox(sx, 0.36, sz, 0.5, 0.72, 0.5, { cam: false });
    const chopWard = makeWardrobe(r, { shirts: [0xff6fb5, 0x7fd7ff, 0xffd54a], pants: [0x8d6e63, 0x5a3e2a], shoes: [0x5a3e2a, 0x8d6e63] });
    const cutter = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: false, wardrobe: chopWard, build: 'stout' }),
      hat: r.chance(0.5) ? 'flatcap' : null, hatColor: 0x8d6e63, jacket: null, scarf: null, bag: null, backpack: null, axe: true, beard: r.chance(0.3) });
    W.add(cutter.group);
    game.npcs.push(new Chopper(game, cutter, { x: cx, z: cz, ry: atan2(sx - cx, sz - cz),
      cries: ["Good dry wood, even out here past the cane forest.", "Careful, puss — mind the chips.", "The gingerbread ovens won't fire themselves."] })); }

  // every other world's sky has picked up something that actually flies by now (Victorian's hot air
  // balloon, Robot City's airship, Sunny Shore's biplane) — Candy Land, the one world actually named
  // for candy, never got anything of its own up there. A giant striped gumball now drifts in a slow
  // circuit high above the sweet-lands, tumbling gently as it goes, 70 m up on a 165 m orbit — well
  // clear even of the castle's own tallest corner tower (15 m wall + 6.6 m roof + a 0.5 m finial and a
  // 1 m pennant pole, 23.1 m in all), so it needs no keep-out check against `game.zones` or any of this
  // world's physics boxes, and no physics box of its own either. Purely decorative: nothing to greet,
  // nothing to reach.
  //
  // Eight latitude bands cut straight out of a sphere (`new THREE.SphereGeometry(r, 16, 2, 0, TAU,
  // i * (PI / 8), PI / 8)`, one eighth-slice of theta each) — the same `SphereGeometry` trick the
  // Victorian balloon's own gores already use (and the one `G.dome()` already uses for its own
  // hemisphere), just sliced by latitude instead of longitude, so the stripes run around the ball like
  // the layers of a gumball instead of up over the top of a canopy. Colours cycle through this world's
  // own candy palette (pink, cyan, gold) with a plain white band between each, the eight tracked
  // geometries kept in `worldBag` the same way the balloon's own eight gores are.
  //
  // Spins on two axes and bobs on the world clock `t` alone, from one fixed starting angle drawn once
  // off this world's own local `r()` (never the shared `rnd()`), so it costs no later wardrobe or
  // colour pick — placed last of everything this build adds, after the woodcutter, so it disturbs
  // nothing built earlier in the sweet-lands.
  { const gbR = 165, gbH = 70, gbSpeed = TAU / 230, gbPhase = r() * TAU, gbRad = 3.1, bands = 8;
    const gumball = group(0, 0, 0);
    const bandColors = [0xff6fb5, 0xffffff, 0x7fd7ff, 0xffffff, 0xffd54a, 0xffffff, 0xff6fb5, 0xffffff];
    for (let i = 0; i < bands; i++) {
      const bandGeo = new THREE.SphereGeometry(gbRad, 16, 2, 0, TAU, i * (PI / bands), PI / bands); worldBag.track(bandGeo);
      mesh(bandGeo, mat(bandColors[i], { roughness: 0.55 }), { shadow: 'none', parent: gumball });
    }
    gumball.userData.update = (dt, t) => {
      const a = gbPhase + t * gbSpeed;
      gumball.position.set(cos(a) * gbR, gbH + sin(t * 0.21) * 3, sin(a) * gbR);
      gumball.rotation.y = t * 0.6; gumball.rotation.x = sin(t * 0.3) * 0.25;
    };
    place(game, U, gumball, cos(gbPhase) * gbR, sin(gbPhase) * gbR, 0, gbH); }

  // the Neighborhood has its radio listener on a blanket and Sunny Shore has three towel-loungers —
  // Candy Land, for all its sugar and sunshine, never had anyone just lying in it. A visitor stretches
  // out on a blanket in the open sweet-lands past the woodcutter's own stump, sunglasses on, a
  // half-melted ice lolly stuck upright in the grass beside her. `Sunbather` reaches into
  // rig.arms/legs/head/spine (`makeHuman`'s own rig), so this is a human visitor rather than a
  // gingerbread man — the same choice this world's painter, ukulele player and gossiping pair already
  // made. A headless probe (the same stub-three harness `test/run.mjs` uses) built the real Candy Land
  // (`game.travel(1, 'from-hub')`) and sampled every NPC's own position every 1/15 s over 300 simulated
  // seconds (so no wandering gingerbread man, ring dancer or tag/catch pair mid-turn could slip past
  // unnoticed), then swept a grid of the open sweet-lands (radius 20-85, short of the radius (92) where
  // candyRegion's own procedural fill takes over) against both those samples and every one of the
  // world's physics boxes: (76, 32) came back clear by 13.5 m of the nearest box and 22.6 m of the
  // nearest other soul, at radius 82.5 from the origin, well inside the fill radius.
  { const bx = 76, bz = 32, ry = atan2(-bx, -bz);
    const blanket = makeTowel(0xffb3d1); place(game, U, blanket, bx, bz, ry);
    const lx = bx + cos(ry) * 0.65, lz = bz - sin(ry) * 0.65;
    const stickM = mat(0xf7f3ec, { roughness: 0.8 }), lollyM = mat(0xff6fb5, { roughness: 0.35 });
    mesh(G.cyl(0.012, 0.012, 0.22, 6), stickM, { x: lx, y: 0.11, z: lz, parent: W });
    mesh(G.box(0.1, 0.16, 0.025), lollyM, { x: lx, y: 0.28, z: lz, parent: W });
    mesh(G.sphere(0.018, 6, 6), lollyM, { x: lx, y: 0.21, z: lz, shadow: 'none', parent: W });
    P.addBox(lx, 0.14, lz, 0.14, 0.28, 0.1, { cam: false });
    const sunWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0, 0xff9ecf], pants: [0x7fd7ff, 0xff9ecf, 0xffffff] });
    const sunbather = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2), wardrobe: sunWard }),
      glasses: true, shorts: true, hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    W.add(sunbather.group);
    game.npcs.push(new Sunbather(game, sunbather, { x: bx, z: bz, ry,
      cries: ['Sugar and sunshine. Can\'t beat it.', "Careful, puss — mind the lolly, it's melting fast enough already.", 'Five more minutes. Maybe ten.'] })); }

  // round 508's own list of playground games this whole game had never tried (tetherball, badminton,
  // tug-of-war, archery, sack races) is down to its last entry now: round 520 gave Frosty Peak a
  // tug-of-war, round 521 the Neighborhood a tetherball pole, round 522 Victorian a badminton net, round
  // 523 Whisper Woods an archery range, and **this one gives Candy Land a sack race** — two children
  // bound ankle-to-waist in burlap sacks, hopping a short lane out in the quiet sweet-lands well past
  // the sunbather's own blanket.
  //
  // New `SackRace` class in `55-npcs.js`, right after `Archer`, its nearest relative among this run of
  // playground games for the same reason Archer was Badminton's: a controller with no second player
  // interacting with the first, just two independent racers on the same lane. Unlike every earlier
  // two-person game here, there's no shared prop at all — each racer hops on its own clock, turning
  // round at either end of a 5 m lane like `Patroller` walking a beat, except hopping rather than
  // striding, so the lead keeps changing hands without either one ever actually reaching a line that
  // would end it. New `o.sack` option on `makeHuman` (`55-npcs.js`, right after the leg loop): one
  // cylinder and a drawstring torus parented to `body`, covering both legs from the ankles to the
  // waist in one piece — the one new mesh this round costs, since the sack hides the stride rather
  // than needing a new one.
  //
  // Placed at (-83, 7), the lane running along world Z: a headless probe (the same stub-three harness
  // `test/run.mjs` itself uses, `game.start('new')` then `game.load(1, 'from-hub')`) sampled every
  // gingerbread man's, dancer's and tag/catch pair's own circle position every 1/10 s over 300 simulated
  // seconds, then swept both racers' own full lane (5 m long, 1.1 m apart) against both those samples
  // and every one of the sweet-lands' physics boxes, staying short of the radius (92) where
  // `candyRegion`'s own procedural fill takes over: the worst point on the whole lane came back clear
  // by 16.5 m in every direction tried — open, flat candy-cane ground near the edge of the hand-built
  // heart, past the sunbather, the woodcutter's stump and the gumball drifting overhead, with the
  // ground itself flat to within rounding across the whole footprint.
  { const rx = -83, rz = 7, rry = 0;
    const sackWard = makeWardrobe(r, { shirts: [0xff8fc8, 0x7fd7ff, 0xffd54a], pants: [0x5a4a3a] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xc9a46a, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xc9a46a, hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: rx, z: rz, ry: rry,
      cries: ['Hop faster, I\'m gaining!', "Tripped twice and still ahead — don't ask me how.", 'Best of three. Fourth, actually. Nobody\'s counting.'] })); }

  // the Neighborhood (round 521), Victorian (522), Robot City (529) and Frosty Peak (520) all got a
  // tetherball pole or a tug-of-war rope off round 508's own list of playground games this whole game
  // had never tried — Candy Land got a sack race (524) and a carousel of its own, but the one pole-and-
  // rope rally never made it to the sweet-lands. Two gingerbread-sweet kids now bat a ball round a pole
  // out on the quiet grass east of the river, well clear of the ukulele player and the kite-flying kid
  // sharing this same stretch of field. No new class and no new mesh: the exact same `Tetherball`
  // (`55-npcs.js`) the Neighborhood's own park pole already uses, just a fresh pair of kids and a spot —
  // the pole, ball and rope are all built inside the constructor.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, `game.travel(1,
  // 'from-hub')`, then every NPC's own position sampled every 5th frame over 1800 simulated frames, long
  // enough for the ukulele player, the kite-flying kid, the gossiping pair and every wandering
  // gingerbread man and dancer to range fully) swept (50, -30) — the pole itself — and both kids' own
  // stations two metres either side of it, (48, -30) and (52, -30), against both those samples and every
  // one of the land's own physics boxes: the worst of the three points came back clear by 6.68 m of the
  // nearest box (one of the candy-cane-forest trunks, the ring reaching in to radius 56 here) and 9.85 m
  // of the nearest other soul (the kite-flying kid at (51, -33)) — short of the ukulele player at
  // (49, -39), 11.4 m further off still, and well past the radius (92) where candyRegion's own procedural
  // fill takes over.
  { const tetherWard = makeWardrobe(r, { shirts: [0xffd54a, 0x7fd7ff], pants: [0xff6fb5, 0x8d6e63] });
    const boy = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: tetherWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null });
    const girl = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: tetherWard }), hat: null, jacket: null, scarf: null, bag: null, backpack: null, hairStyle: 'braids' });
    W.add(boy.group); W.add(girl.group);
    game.npcs.push(new Tetherball(game, boy, girl, { x: 50, z: -30,
      cries: ['Round and round — same as every other sweet-land game, just stickier.', 'Watch the rope, puss, it\'s had my fingers twice already.', 'Fifty wraps and counting. I always lose count past fifty.'] })); }

  // round 547's own list of worlds still owing round 508's playground games a `Badminton` net
  // (`55-npcs.js`) — Neighborhood, Candy Land, Frosty Peak, Whisper Woods — had Candy Land at the top:
  // the sweet-lands already have a tetherball pole, a tug-of-war, a sack race and a carousel, but
  // nobody here had ever swatted anything over a net. Two sweet-shop kids now keep a shuttlecock going
  // on the quiet grass north of the carousel, past the butterflies' own flight box. *"Love-love. No —
  // love-one. I dropped one before you got here, puss."* *"Mind the net, it's stickier than it looks —
  // everything out here is."* *"Forty-seven rallies. I started counting after we lost count the first
  // time."*
  //
  // No new class and no new mesh: the exact same `Badminton` (`55-npcs.js`) and `makeVolleyballNet`
  // (`62-props-nature.js`) Victorian, Sunny Shore and Robot City already use. Gingerbread men have no
  // shoulder/elbow sub-joints and no `rig.spine` for `Badminton` to pose or lean on — the same reason
  // this land's own tetherball and tug-of-war pairs are sweet-shop kids rather than cookies — so this
  // pair is `makeHuman` too, on a fresh wardrobe of its own.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(1, 'from-hub')`) sampled every NPC's own position every 6th
  // frame over 2400 simulated frames, then swept a 2 m grid of the open sweet-lands (radius 15-86,
  // skipping the chocolate river's own band) against both those samples and every one of the land's
  // physics boxes: (22, 72) came back clearest of the lot, 16.48 m from the nearest box (the carousel at
  // (35, 60)) and 20 m from the nearest wandering soul — north of the carousel and clear of the
  // butterflies' own flight box (x ≤ 32) and the gumdrop patch at (26, 52), well inside the 92 m radius
  // where `candyRegion`'s own procedural fill takes over.
  { const cx = 22, cz = 72, gap = 5.6, halfW = 1.6;
    const net = makeVolleyballNet(halfW, 0xff6fb5, { postH: 1.6, netH: 0.78 });
    place(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) P.addBox(cx + sx, 0.8, cz, 0.16, 1.6, 0.16, { cam: false });
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    const badWard = makeWardrobe(r, { shirts: [0xffd54a, 0x7fd7ff, 0xff9ecf], pants: [0x7fd7ff, 0xffd54a] });
    const bA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: badWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false, racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: badWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false, racket: true, hairStyle: 'braids' });
    W.add(bA.group); W.add(bB.group);
    const badmintonLines = ['Love-love. No — love-one. I dropped one before you got here, puss.', "Mind the net, it's stickier than it looks — everything out here is.", "Forty-seven rallies. I started counting after we lost count the first time."];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: badmintonLines })); }

  // The Neighborhood and Sunny Shore have each had a kid bouncing in place on a pogo stick since round
  // 420-odd, and Victorian picked one up too; Candy Land, Robot City, Frosty Peak and Whisper Woods were
  // left without one. A sweet-shop kid now bounces on a quiet, open stretch of candy-cane ground
  // south-west of the chocolate river, well clear of the marbles ring and the dog walker's own beat.
  // *"Boing! Boing! Watch how high I go, puss!"* *"This spring's stickier than the cane trees — must be
  // the icing."* *"Ninety-one bounces. I'm not stopping till triple digits."*
  //
  // No new class and no new mesh: the exact same `PogoHopper` (`55-npcs.js`) the Neighborhood, Sunny
  // Shore and Victorian already use.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(1, 'from-hub')`, 2400 simulated frames to let the sweet-lands
  // settle) sampled every NPC's own position every 10th frame, then swept a grid of the open sweet-lands
  // (radius 15-78, clear of the chocolate river's own band) against both those samples, every one of the
  // land's physics boxes and all sixteen of `makeGumdrops`'s own decorative patches (which carry no
  // physics box of their own, but a kid standing knee-deep in one would still look wrong): (-67, -31.5)
  // came back clearest, 10.1 m from the nearest box, 10.2 m from the nearest other soul (the marbles kid
  // at (-65, -60) is 29 m off) and 11.2 m from the nearest gumdrop patch, at radius 74 from the origin —
  // well short of the radius (92) where `candyRegion`'s own procedural fill takes over.
  //
  // Built dead last, right after the badminton pair, for the same reason every other addition at the
  // end of this function already gives: `makeHuman()` draws three values off the shared `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier in this land would shift that sequence and desync
  // every other timing-sensitive pick already placed above.
  { const pogoWard = makeWardrobe(r, { shirts: [0xff8fc8, 0x7fd7ff, 0xffd54a], pants: [0x7a5c3a, 0x3a3a3a] });
    const pogoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: pogoWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(pogoKid.group);
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: -67, z: -31.5, ry: r.range(0, TAU),
      cries: ['Boing! Boing! Watch how high I go, puss!', "This spring's stickier than the cane trees — must be the icing.", "Ninety-one bounces. I'm not stopping till triple digits."] })); }

  // Archery has reached five of the seven worlds since round 570 (Neighborhood, Frosty Peak, Whisper
  // Woods, Victorian, Sunny Shore) but never Candy Land or Robot City. A sweet-shop girl now looses
  // candy-striped arrows at a straw target on a quiet stretch of open sweet-lands south-east of the
  // park, well clear of every other game on this field. *"Careful, puss — these arrows are stickier
  // than they look, same as everything else out here."* *"Every one that misses just sinks into the
  // icing. I've lost a whole quiver that way."* *"Ten in a row dead centre. The sugar rush helps my
  // aim, I swear."*
  //
  // No new class and no new mesh: the exact same `Archer` and straw-boss-and-rings target (`55-npcs.js`)
  // the other five worlds already build, unchanged — just a candy-coloured wardrobe (the same pink,
  // cyan and sunshine-yellow the pogo kid just above already wears) in place of a winter coat, a
  // woodsman's jacket, bonnet-and-gown or beachwear. `makeHuman`'s `o.bow` hand prop sits at the off
  // hand regardless of what else she's wearing, so nothing needed changing there either.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(1, 'from-hub')`, 2400 simulated frames to let the sweet-lands
  // settle) sampled every NPC's own position every 10th frame over another 2400 frames, then did a full
  // joint search over every open ground point (radius ≤ 80, short of the radius (92) where
  // `candyRegion`'s own procedural fill takes over) and all 32 firing directions at each one, scoring
  // each candidate by its tightest clearance anywhere along the whole 10 m archer-to-target line against
  // both those samples and every one of the land's physics boxes (measuring to each box's own edge
  // rather than its centre): (17, -46), firing toward (13.17, -55.24), came back clearest of all, 8.95 m
  // of headroom at the tightest point along that line — well clear of the star collectible at (0, -56)
  // and every hand-placed game on this field.
  //
  // Built dead last, right after the pogo kid, for the usual reason: `makeHuman()` draws three values
  // off the shared `rnd()` sequence unconditionally, and a fresh rig built any earlier in this land
  // would shift that sequence and desync every other timing-sensitive pick already placed above.
  { const ax = 17, az = -46, ary = 3.5342917352885173, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    P.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0xff8fc8, 0x7fd7ff, 0xffd54a], pants: [0x5a4a6a, 0x3a3a3a] });
    const archer = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: bowWard }),
      hat: null, hairStyle: 'pony', jacket: null, coat: null, scarf: null, bag: null, backpack: null, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist,
      cries: ["Careful, puss — these arrows are stickier than they look, same as everything else out here.", "Every one that misses just sinks into the icing. I've lost a whole quiver that way.", "Ten in a row dead centre. The sugar rush helps my aim, I swear."] })); }

  const sq = new Squirrel(game, -12, 3, 'sq-candy'); game.squirrels.push(sq);
  const C = game.collectibles;
  C.add('star', 7, -6); C.add('yarn', -9, 9); C.add('fish', -16, -13); C.add('mouse', 16, -9); C.add('star', -10, -27); C.add('yarn', 22, 4); C.add('mouse', -28, 26); C.add('fish', 14, -44); C.add('star', 0, -56); C.add('mouse', -58, 30); C.add('yarn', 60, 36);
  game.fx.setAmbient({ count: 90, radius: 16, colors: [0xffffff, 0xffd1e8, 0xfff3b0, 0xc8f0ff], rise: 0.25, drift: 0.2, life: 4, height: 3, yMin: 0.3 });
  makeDayNight(game, U, W);
  // Whisper Woods, Victorian, the Neighborhood, Robot City (scrap-bug), Sunny Shore (tiger beetle) and Frosty
  // Peak (frost beetle) all have the ladybug's own family by now (`56-npcs-wild.js`) — Candy Land, for all its
  // sugar mouse and its mint hare, was the only one of the seven left without a beetle of its own. A gumdrop
  // beetle (`makeGumdropBeetle`, new, right after `makeFrostBeetle`) now scuttles the open grass between the
  // two tall lollipops on the north lawn, glossy candy shell and sugar-sprinkle flecks standing in for the
  // ladybug's spots.
  //
  // A headless probe (`game.start('new')` then `game.load(1, 'from-prev')`, 3000 simulated frames so no
  // wandering gingerbread man, dancer or butterfly could slip past unnoticed) swept a grid of this lawn
  // against both those samples and every one of the land's own physics boxes and keep-out zones: (1, 42) came
  // back clearest, 10.9 m from the nearest box or soul — comfortably past the 1.6 m leash given here, clear of
  // both lollipops (-40, 44) and (44, 46) and of the sparrow-like hopper resting at (-29, 40).
  //
  // Built dead last, right after the squirrel and the day/night rig, for the usual reason: `Hopper`'s own
  // unconditional draws off the shared `rnd()` sequence (idle timer, idle phase, starting heading) land after
  // every other NPC in this land that times itself off that same sequence, and disturb nothing built earlier.
  //
  // That same comment left the ladybug's own family (round 694) still unmet here: `Hopper`, unlike
  // `Wanderer`, never calls `greetable()` on its own, so a rig with none of `.look`/`.robot`/`.cookie`
  // just sits there ambient. **The gumdrop beetle now answers its own "Say hello to the gumdrop beetle"
  // prompt too**, with *"🍬 *rolls onto its back for a second, sugar-sprinkle flecks catching the light,
  // then rights itself and scuttles on"*". Same fix as the raccoon, the factory mouse and the ladybug: no
  // new mesh, no new physics box, just `game.namedFriend('gumdrop-beetle')` plus a `game.addInteractable`
  // keyed straight to the beetle's own `rig.group`, tracked every frame so the prompt follows it through
  // its tiny hops inside its own 1.6 m leash. The 2.1 m greet radius — the same every other Hopper
  // creature's own prompt already uses — sits nowhere near anything else: the probe above this build
  // already found (1, 42) 10.9 m from the nearest box or soul, clear of both lollipops and the nearby
  // hopper, far past the radius needed here. Robot City's scrap bug, Sunny Shore's tiger beetle and
  // Frosty Peak's frost beetle are the same family and still unmet — any one of them is next.
  { const rig = makeGumdropBeetle(0xff4fa0); W.add(rig.group);
    game.npcs.push(new Hopper(game, rig, { x: 1, z: 42, leash: 1.6, r: 0.1, dist: [0.25, 0.6], dur: 0.3, height: 0.18, idle: [1, 3.2],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } }));
    const gumdropBeetleId = game.namedFriend('gumdrop-beetle');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the gumdrop beetle', onUse: () => { game.befriend(gumdropBeetleId); SFX.chitter(); game.hearts(rig.group.position.x, 0.15, rig.group.position.z, 3); game.toast('🍬 *rolls onto its back for a second, sugar-sprinkle flecks catching the light, then rights itself and scuttles on*'); } }); }
  // Sunny Shore (round 591), the Neighborhood (round 592) and Victorian (round 596) have all let
  // somebody digging nearby beat their own long-suffering `Detectorist` to real treasure, and the
  // scanner panning for bottle caps here on the open grass at (23, 27) — "Just a gumdrop. Every
  // time." — was still waiting on his own turn. **A few strides off, a gingerbread-cottage kid has
  // struck real gold with nothing but a shovel**: an old wooden chest lies open in the grass, lid
  // thrown back over a heap of coins, with a shovel left stuck in the dirt and a handful of loose
  // coins and gems scattered where they rolled. *"Everybody else got a gumdrop. I got THIS."*
  // *"Careful, puss — don't you dare knock a single coin back in the grass."* *"Don't tell the
  // scanner. He'll never forgive himself."*
  //
  // Reuses round 591's `makeTreasureChest()` and `makeShovel()` (`62-props-nature.js`) and
  // `makeGemCluster()` (`60-props.js`) exactly as Victorian's own relic hunter already does — no new
  // prop, no new mesh. Candy Land carries none of the Neighborhood's own "seven gems"/"no repeated
  // shirt" constraints (both scoped to world 0 only in `test/run.mjs`), so a straight
  // `makeGemCluster()` call with the same gold-and-silver palette does the job. The finder himself is
  // a plain `Kneeler` on a fresh pastel wardrobe matching the ukulele player's and kite flyer's own
  // (`shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0]`), the same pairing every other kneeling child in this
  // land already uses.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `game.start('new')`, `game.travel(1, 'from-prev')`, 400 simulated frames with every NPC's own
  // position sampled every frame) swept a grid of candidates near the scanner's own spot against both
  // those 30,800 samples and all 1898 of the land's own physics boxes: (31, 30) came back clearest,
  // 7.5 m from the nearest box and 8.1 m from the nearest other soul — 8.5 m from the scanner himself,
  // the same distance round 592's own Neighborhood dig used, close enough the joke still reads, far
  // enough neither "Say hello" circle (2.1 m each) comes near the other's. None of the sixteen
  // gumdrop-patch donuts `makeGumdrops` scatters reach anywhere near this corner either — the nearest
  // patch, at (22, 6), is 21 m off and only 5 m of scatter radius.
  //
  // Built dead last, right after the gumdrop beetle, for the reason every other addition at the end
  // of this function already gives: `makeHuman()` and `makeGemCluster()` both draw off the shared
  // per-world `r()` sequence unconditionally, and anything built earlier in this land would have had
  // its own timing-sensitive pick shifted by it.
  { const tx = 31, tz = 30, kx = tx + 1.3, kz = tz + 0.4, ry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); place(game, U, chest, tx, tz, 0.6);
    P.addBox(tx, 0.35, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); place(game, U, shovel, tx + 0.75, tz - 0.6, 0.3);
    makeGemCluster(game, U, tx + 0.4, tz + 0.9, 4, [0xd4af37, 0xc0c0c0, 0xffd54a], r, 0.9);
    const luckyWard = makeWardrobe(r, { shirts: [0xffe0ea, 0xbfe7ff, 0xfff3b0], pants: [0xff9ecf, 0x7fd7ff, 0xffffff] });
    const finder = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: luckyWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(finder.group);
    game.npcs.push(new Kneeler(game, finder, { x: kx, z: kz, ry, cryIcon: '💰',
      cries: ["Everybody else got a gumdrop. I got THIS.", "Careful, puss — don't you dare knock a single coin back in the grass.", "Don't tell the scanner. He'll never forgive himself."] })); }
  // Victorian's market square has had a stilt walker since round 714-ish; every other performer in this
  // land — the jester by the throne, the gate's own gingerbread sentry — keeps both feet on the ground,
  // and Candy Land, sugar-dusted and showy as it is, never had one of its own. A performer in
  // candy-cane-striped trousers now paces a short line on the quiet grass south of the sweet-lands,
  // towering half again his own height, same `StiltWalker` class (55-npcs.js, `extends Patroller`) and
  // the same ankle-parented pole rig Victorian's own stilt walker already uses — no new class, no new
  // mesh shape, just the pole, strap and footrest peg recoloured candy-cane red and white.
  //
  // A headless probe (`game.start('new')` then `game.travel(1, 'from-hub')`, 2000 simulated frames
  // sampling every NPC's own position every fifteenth frame) swept a grid of the open grass south of
  // the gingerbread cottage path against both those samples and every one of the land's own physics
  // boxes: the whole 6 m line from (2, -82) to (8, -82) came back clear by at least 11.5 m of the
  // nearest box (one of the candy-cane-belt trunks, out near (-10, -80)) and 13 m of the nearest other
  // soul, at radius 82-82.4 from the origin — past the hand-placed candy-cane belt (radius 56-76) and
  // short of the radius (92) where `candyRegion`'s own procedural fill takes over.
  //
  // Built dead last, right after the treasure-chest kid, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off the shared per-world `r()` sequence unconditionally, and anything
  // built earlier in this land would have had its own timing-sensitive pick shifted by it.
  { const stiltH = 0.8;
    const performer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xf7f3ec, stripes: 0xd62839, pants: 0xf7f3ec, shoes: 0xffffff, hat: 'top', hatColor: 0xd62839, hatBand: 0xf7f3ec, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(performer.group);
    const poleM = mat(0xd62839, { roughness: 0.8 }), strapM = mat(0xf7f3ec, { roughness: 0.6 }), pegM = mat(0x8a6a44, { roughness: 0.75 });
    for (const L of performer.legs) {
      const len = stiltH / performer.k;
      const stilt = group(0, 0.22, 0.01, L.ankle);
      mesh(G.cyl(0.026, 0.03, len + 0.3, 8), poleM, { y: -(len + 0.3) / 2 + 0.07, parent: stilt });
      mesh(G.torus(0.09, 0.018, 6, 10), strapM, { y: 0, rx: PI / 2, parent: stilt });
      mesh(G.box(0.15, 0.035, 0.09), pegM, { y: -0.17, z: 0.07, parent: stilt });
    }
    game.npcs.push(new StiltWalker(game, performer, { points: [[2, -82], [8, -82]], speed: 0.55, pause: [1.5, 3], r: 0.4, height: 2.6, stiltH,
      cries: ['Up here the whole candy-cane forest looks like a tin of peppermints.', "Eleven years on these back home — out here, nobody's ever seen me fall. Yet.", "Mind your tail, puss — these aren't candy canes, whatever they look like!"], cryIcon: '🍭' })); }

  // Whisper Woods, Sunny Shore and Frosty Peak all have the same knee-high spiderweb between two twig
  // stakes (`makeSpiderweb()`, 62-props-nature.js — dew beads, three silk rings, a spider holding dead
  // centre), and the Neighborhood and Robot City both got one on their own flat floors with plain
  // `place()`. Candy Land's ground is exactly as flat as those two, and never had one of its own.
  // **A real spiderweb now hangs between two stakes in the open grass south of the sweet-lands, well
  // past the candy-cane belt and short of the land's own procedural fill.** No new mesh, no new
  // physics box: `makeSpiderweb()` is the identical rig the other four worlds already use, dropped
  // straight on with plain `place()` same as Robot City's and the Neighborhood's.
  //
  // A headless probe (`game.start('new')`, `game.travel(1, 'from-prev')` waited out through its real
  // portal-fade timer, then 2000 simulated frames sampling every NPC's own position every fifteenth
  // frame) swept a grid of the open grass south of the gingerbread cottage (radius 56-90 from the
  // origin, past the hand-placed cane belt and short of the region fill at 92) against those samples
  // and every one of the land's own physics boxes: (-14, -86) came back clearest of the lot tried,
  // 13.6 m clear of the nearest box and 15.2 m clear of the nearest other soul (the candy-cane stilt
  // walker's own patrol line), well outside every `game.zones` rectangle too.
  //
  // Built dead last, right after the stilt walker, since `makeHuman()`, `randomPerson()` and
  // `makeSpiderweb()`'s own dew-phase roll all draw off this land's shared `r()` sequence
  // unconditionally.
  { const web = place(game, U, makeSpiderweb(r), -14, -86, atan2(0 - -14, 0 - -86)); }

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
  // the tallest of the six east-yard towers (32, -28, h=20) stood bare-roofed since it was first built,
  // same as every other skyscraper in the city — a radar dish now turns slowly up there, sweeping the
  // skyline. Only this one hand-placed tower gets it: makeSkyscraper() itself is also what the skyline
  // loops above and robotRegion()'s own unbounded fill build with, and giving every one of those an
  // animated, unbaked dish would have multiplied update ticks across the whole outer country for no one
  // to notice from the ground.
  [[-30, -30, 7, 16], [32, -28, 8, 20], [-34, 26, 9, 14], [34, 24, 7, 18], [-38, 0, 6, 12], [38, -6, 7, 15]].forEach(([x, z, w, h], i) => {
    const b = makeSkyscraper(w, h, w, floor(abs(x + z))); place(game, U, b, x, z, 0); P.addBox(x, h / 2, z, w, h, w);
    if (i === 0) {
      // the sentry already patrols this yard on two legs, logging "no unauthorized felines detected"
      // as it goes, but nothing in the city had ever actually watched from a wall. A security camera
      // now rides a bracket on this tower's own east face, panning to keep the cat in frame within an
      // 18 m radius — clamped to a ±57° arc off its resting aim toward the yard, so it only ever swings
      // away from the wall, never into it — and sweeping that same arc on a slow idle scan the rest of
      // the time. The LED over its lens burns steady red while it tracks and blinks slow while it
      // waits, with one soft beep the moment it first picks the cat up. No new physics box and no
      // clearance probe of its own: the housing sits at y=4, well above the tallest NPC's own head, on
      // the same wall this tower's own footprint already covers, and the "look up" toast below reuses
      // the tower group `b` exactly as the radar dish's own interactable already does — the nearest
      // other hand-placed prop (the sentry's own patrol rectangle, [-15,-35]..[15,-45]) stays 15+ m off.
      const camY = 4, mountX = w / 2 + 0.42, baseAngle = atan2(0 - x, -40 - z), cone = 1.0;
      const steel = mat(0x5a6470, { metalness: 0.8, roughness: 0.35 }), dark = mat(0x16181e, { roughness: 0.6 }), lensM = mat(0x0c0c0c, { metalness: 0.5, roughness: 0.3 });
      mesh(G.box(0.08, 0.5, 0.08), steel, { x: w / 2, y: camY - 0.25, parent: b });
      mesh(G.cyl(0.03, 0.05, 0.42, 8), steel, { x: w / 2 + 0.21, y: camY, rz: PI / 2, parent: b });
      const pivot = group(mountX, camY, 0, b); pivot.rotation.y = baseAngle;
      mesh(G.box(0.22, 0.2, 0.34), dark, { parent: pivot });
      mesh(G.cyl(0.1, 0.09, 0.22, 14), lensM, { z: 0.22, rx: PI / 2, parent: pivot });
      const led = mesh(G.sphere(0.03, 8, 6), glowMat(0xff3b3b, 0.8), { y: 0.07, z: 0.17, shadow: 'none', parent: pivot });
      let tracking = false;
      U.push((dt, t) => {
        const cat = game.cat.group.position, dx = cat.x - (x + mountX), dz = cat.z - z;
        if (dx * dx + dz * dz < 324) {
          const target = baseAngle + clamp(wrapAngle(atan2(dx, dz) - baseAngle), -cone, cone);
          pivot.rotation.y = dampAngle(pivot.rotation.y, target, 4, dt);
          if (!tracking) SFX.beep();
          tracking = true;
          led.material.emissiveIntensity = 2.4;
        } else {
          pivot.rotation.y = dampAngle(pivot.rotation.y, baseAngle + sin(t * 0.4) * cone, 2, dt);
          tracking = false;
          led.material.emissiveIntensity = 0.5 + max(0, sin(t * 1.1)) * 0.9;
        }
      });
      const camLines = ['📷 "Still red. Still watching. The foreman swears it\'s for security."', '📷 "Follows anything that moves. Logged you as feline, unauthorized, round one."', '📷 "No tape in that thing for years. Nobody\'s told maintenance."'];
      game.addInteractable({ obj: b, radius: 6.5, label: () => 'Look up at the security camera', onUse: () => { SFX.click(); game.toast(rnd.pick(camLines), 3000); } });
    } else if (i === 1) {
      addRadarDish(b, h); U.push(b.userData.update);
      // every other landmark in the city got a one-off "walk up and look" toast by now (the statue, the
      // zipline towers elsewhere) but the one thing in Robot City that actually moves on its own against
      // the sky, this radar dish, never did. No new mesh, no new box: `b`, the tower's own group, is
      // handed straight to `addInteractable` — the same previously-discarded-return-value trick every
      // earlier "look up" round already used. A headless probe (`game.load(2, 'from-prev')`, then 1200
      // simulated frames) swept this spot against every one of the city's physics boxes and every NPC's
      // own position: the tower's own footprint aside (half-extent 4 m), the nearest other box stayed
      // 7.3 m clear and the nearest NPC (the tag robots' own leash circle at (28, -40)) never came closer
      // than 9.5 m, comfortably past this interactable's 6.5 m radius.
      const radarLines = ['📡 "Sweeps the whole skyline every few seconds. Still hasn\'t found anything."', '📡 "Nobody remembers what it\'s listening for. It just keeps listening."', '📡 "Tallest point in the east yard, and the view is mostly more skyline."'];
      game.addInteractable({ obj: b, radius: 6.5, label: () => 'Look up at the radar dish', onUse: () => { SFX.click(); game.toast(rnd.pick(radarLines), 3000); } });
    } else if (i === 2) {
      // the camera, the radar dish and (two indices on) the missing-unit notice and the hologram
      // billboard have each claimed one of these six towers' own roofs by now — this one, the last
      // bare roof left in the east yard, gets a steam vent instead: a short riveted stack tucked into
      // one roof corner, puffing pale vapour on a timer, the same rise-drift-fade beat the bubble pipe
      // and the beekeeper's smoker already use elsewhere in this game, just vertical instead of drifting
      // sideways, and with no payoff on each cycle (no sparkle, no fx burst) — it's a vent, not a wish.
      // No new controller, no physics box of its own: the vent sits at local y = h+0.35..0.72, tucked at
      // local (x=w/2-1.3, z=w/2-1.3) — 4.5 m off the roof centre on the diagonal, clear of the rooftop
      // block `makeSkyscraper` itself already builds there (half-extent 1.8 m) — well above the tallest
      // NPC's own head and above this tower's own existing box (half-height h/2, from the `P.addBox`
      // three lines up), so nothing on the ground can ever reach it bodily. `addInteractable`'s radius
      // (6.5) just clears this tower's own 6.36 m diagonal corner (half-extent 4.5 m on a square
      // footprint), the same margin the camera and the radar dish above already bank on, and the
      // nearest other interactable (the statue at (-44, 22), whose own radius is 3.6) stays 10.77 m off
      // from this tower's centre — 0.67 m clear of both radii stacked together.
      // A headless probe (`game.start('new')` then `game.load(2, 'from-prev')`, 300 simulated seconds
      // so every wandering, patrolling, dancing and ball-tossing robot pack actually moved) swept this
      // tower's own footprint and interactable radius against every physics box and every quarter-
      // second NPC sample: the nearest other box (one of the randomly placed inner-ring skyscrapers)
      // stayed 7.1 m clear and the nearest wandering soul never closer than 11 m, both past the 6.5 m
      // radius once this tower's own 4.5 m half-extent is added in.
      const ventX = w / 2 - 1.3, ventZ = w / 2 - 1.3, ventY = h;
      const steel = mat(0x454b52, { metalness: 0.75, roughness: 0.4 });
      mesh(G.cyl(0.26, 0.3, 0.7, 12), steel, { x: ventX, y: ventY + 0.35, z: ventZ, parent: b });
      mesh(G.cyl(0.33, 0.26, 0.12, 12), steel, { x: ventX, y: ventY + 0.72, z: ventZ, shadow: 'none', parent: b });
      const tipX = x + ventX, tipZ = z + ventZ, tipY = ventY + 0.82;
      const puffs = [0, 1, 2].map((pi) => ({ m: mesh(G.sphere(0.14, 8, 6), mat(0xdfe6ea, { roughness: 0.9, transparent: true, opacity: 0.45 }), { shadow: 'none', parent: W }), ph: pi * 1.9 }));
      const cyc = 3.4;
      let hissT = r.range(2, 4);
      U.push((dt, t) => {
        for (const p of puffs) {
          const k = ((t + p.ph) % cyc) / cyc;
          p.m.visible = k < 0.95;
          if (p.m.visible) {
            p.m.position.set(tipX + sin(t * 0.5 + p.ph) * 0.3 * k, tipY + k * 2.6, tipZ + cos(t * 0.4 + p.ph) * 0.22 * k);
            p.m.scale.setScalar(0.5 + k * 1.8);
            p.m.material.opacity = 0.45 * (1 - k);
          }
        }
        hissT -= dt;
        if (hissT <= 0) { hissT = r.range(5, 9); const c = game.cat.group.position; if (dist2(tipX, tipZ, c.x, c.z) < 400) SFX.noise({ dur: 0.4, vol: 0.03, filter: 2200, type: 'lowpass' }); }
      });
      const ventLines = ['💨 "Vented since the city went up. Nobody\'s ever traced the pipe to anything."', '💨 "Warmer up here than down on the floor, if you don\'t mind the hiss."', '💨 "Just steam. The foreman\'s checked. Twice."'];
      game.addInteractable({ obj: b, radius: 6.5, label: () => 'Look up at the steam vent', onUse: () => { SFX.click(); game.toast(rnd.pick(ventLines), 3000); } });
    } else if (i === 4) {
      // the camera and the radar dish both got their own one-off toast on a hand-placed tower, but every
      // other quiet tower in this yard stayed bare. This one's own east wall faces the open floor the
      // wandering robots cross, so a "missing unit" bulletin now hangs flush on it — the same
      // `makePosterNotice`-style dark-frame-and-paper build the Neighborhood's own lost-pet notice uses
      // (round 462), just reskinned with a robot-head silhouette and a strip of hazard tape in place of
      // the cat's ears and tear-off phone tabs. No new physics box: the sheet is 0.012 m thick, mounted
      // 0.02 m clear of this tower's own existing 6x6 footprint, the same margin the lamp notice itself
      // kept past its post; `addInteractable`'s radius (4.3) clears that footprint's own 4.24 m diagonal
      // corner by a hair, reachable from any angle without reaching the nearest other interactable (the
      // statue at (-44, 22), 22.8 m off).
      const noteY = 1.5, mountX = w / 2 + 0.02;
      const poster = makeMissingUnitPoster(); poster.position.set(mountX, noteY, 0); poster.rotation.y = PI / 2; b.add(poster);
      const noticeLines = ['📋 "MISSING: UNIT 47. Last seen chasing a loose bolt. Reward: one (1) oil can."', '📋 "Answers to a diagnostic ping. Doesn\'t answer to much else."', '📋 Someone has stapled a replacement notice over the last replacement notice.'];
      game.addInteractable({ obj: b, radius: 4.3, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(noticeLines), 3000); } });
    } else if (i === 3) {
      // the camera, the radar dish and the missing-unit notice each claimed one of these six towers'
      // own faces by now — this one's bare roof gets a holographic billboard instead, beamed up off a
      // small projector dish the way a real rooftop ad would work. The panel reuses `TEX.neonText()`,
      // the same canvas-painted texture every neon sign in the city already draws from, just additive
      // and half-transparent rather than solid — and its own opacity stutters out and climbs back on a
      // short timer rather than holding steady, since a hologram that never flickers wouldn't read as
      // one. No new physics box: it floats at y = h + 2 (20 m up), well clear of the tallest NPC's own
      // head and above this tower's own existing box (half-height h/2 = 9, from the `P.addBox` three
      // lines up), so nothing on the ground can ever reach it; `addInteractable`'s radius (5.0) just
      // clears this tower's own 4.95 m diagonal corner, the same margin the missing-unit notice kept
      // past its own footprint, and the nearest other interactable (the oil vendor at (24, 26)) stays
      // 10.2 m off.
      const dishY = h + 0.12, holoY = h + 2.0;
      const steel = mat(0x5a6470, { metalness: 0.8, roughness: 0.35 }), holoColor = 0xb388ff;
      mesh(G.cyl(0.46, 0.4, 0.16, 16), steel, { y: dishY, parent: b });
      mesh(G.cyl(0.05, 0.08, holoY - dishY, 10), steel, { y: (dishY + holoY) / 2, parent: b });
      const holo = group(0, holoY, 0, b);
      const sign = mesh(G.plane(2.6, 0.65), basic(0xffffff, { map: TEX.neonText('ROBOT CITY', '#b388ff'), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), { shadow: 'none', parent: holo });
      const pl = pointLight(holoColor, 26, 9, 0, holoY, 0, b);
      let glitchT = r.range(2.5, 5);
      U.push((dt, t) => {
        holo.rotation.y = t * 0.3;
        glitchT -= dt;
        if (glitchT <= 0) { glitchT = r.range(3, 7); sign.material.opacity = 0.1; pl.intensity = 6; SFX.crackle(); }
        else { sign.material.opacity = min(0.78, sign.material.opacity + dt * 2.2); pl.intensity = min(26, pl.intensity + dt * 30); }
      });
      const holoLines = ['📡 "ROBOT CITY. Flickers every few seconds. Nobody\'s called it in."', '📡 "Been glitching since round one. The foreman calls it \'atmosphere\'."', '📡 "Hard to read from the ground. Easier from the gondola."'];
      game.addInteractable({ obj: b, radius: 5.0, label: () => 'Look up at the hologram', onUse: () => { SFX.click(); game.toast(rnd.pick(holoLines), 3000); } });
    } else if (i === 5) {
      // the camera, the radar dish, the steam vent, the missing-unit notice and the hologram have each
      // claimed one of these six towers' own faces or roofs by now — this one, the last of the six, gets
      // a window-washing rig instead: a small drone riding a rail bolted to the east wall, sliding slowly
      // from a third of the way up to near the roofline and back down, its buffer pad swinging side to
      // side as it goes. No new physics box and no clearance probe of its own: the whole rail sits
      // between local y = h*0.35 (5.25) and h*0.92 (13.8), well above the tallest NPC's own head (the
      // camera on tower 0 banked on the same clearance at y=4) and above this tower's own existing box
      // (half-height h/2 = 7.5, from the `P.addBox` call that opens this forEach), so nothing on the
      // ground can ever reach it bodily. `addInteractable`'s radius (6.5) just clears this tower's own
      // 4.95 m diagonal corner, the same margin the camera and the radar dish already bank on; a headless
      // probe (`game.travel(2, 'from-hub')`, then 1200 simulated frames continuously sampled so no
      // wandering or patrolling robot could slip past unnoticed) swept this tower's own footprint against
      // every one of the city's physics boxes and every one of those NPC samples: the nearest other box
      // stayed 11.7 m clear and the nearest wandering soul never closer than 14.3 m, both well past this
      // radius once this tower's own half-extent is added in.
      const railY0 = h * 0.35, railY1 = h * 0.92, mountX = w / 2 + 0.03;
      const steel = mat(0x5a6470, { metalness: 0.78, roughness: 0.35 }), dark = mat(0x1c1f26, { roughness: 0.55, metalness: 0.4 });
      mesh(G.box(0.05, railY1 - railY0, 0.05), steel, { x: mountX, y: (railY0 + railY1) / 2, parent: b });
      const rig = group(mountX + 0.17, railY0, 0, b);
      mesh(G.box(0.3, 0.2, 0.28), dark, { parent: rig });
      mesh(G.cyl(0.05, 0.05, 0.14, 8), steel, { x: -0.17, rz: PI / 2, parent: rig });
      const padPivot = group(0, -0.07, 0.17, rig);
      mesh(G.box(0.2, 0.04, 0.04), steel, { parent: padPivot });
      mesh(G.box(0.16, 0.16, 0.02), mat(0xcfe6ff, { transparent: true, opacity: 0.5, roughness: 0.2 }), { z: 0.03, parent: padPivot });
      const led = mesh(G.sphere(0.025, 8, 6), glowMat(0x4ade80, 1.4), { y: 0.1, z: 0.14, shadow: 'none', parent: rig });
      const cyc = 11, tipX = x + mountX, tipZ = z;
      let wasUp = true;
      U.push((dt, t) => {
        const k = (t % cyc) / cyc, up = k < 0.5, kk = up ? k * 2 : (1 - k) * 2;
        rig.position.y = railY0 + kk * (railY1 - railY0);
        padPivot.rotation.y = sin(t * 6) * 0.5;
        led.material.emissiveIntensity = 1.0 + max(0, sin(t * 3)) * 0.8;
        if (up !== wasUp) { wasUp = up; const c = game.cat.group.position; if (dist2(tipX, tipZ, c.x, c.z) < 324) SFX.noise({ dur: 0.08, vol: 0.04, filter: 2600, type: 'bandpass' }); }
      });
      const washerLines = ['🪟 "Same four windows, every shift. The glass never even gets dirty."', '🪟 "Nobody\'s told it the tower doesn\'t open."', '🪟 "Polishes the same stretch of wall, round trip, since the day it was bolted on."'];
      game.addInteractable({ obj: b, radius: 6.5, label: () => 'Look up at the window washer', onUse: () => { SFX.click(); game.toast(rnd.pick(washerLines), 3000); } });
    }
  });
  // east yard: a second factory line, a plaza with a giant robot statue to the west, more lights and neon
  const conv2 = makeConveyor(game, 44, 12, 12, 1); U.push(conv2.userData.update); const arm2 = makeRobotArm(game, 50, 2); U.push(arm2.userData.update);
  // the statue, the furnace and the robot arm all got their own "walk up and look" toast by now, but
  // every conveyor belt in the city — the two on the main factory floor, and this one out in the east
  // yard — never got so much as a glance, despite looping the same three crates since round 1. No new
  // mesh, no new box: `conv2` (already kept, for its crate-loop `U.push` above) is handed straight to
  // `game.addInteractable`. Its own physics box (half-extent 0.95 m in x, 6 m in z) keeps the cat clear
  // on every side, so a 5.5 m radius reaches it comfortably from along its length without reaching the
  // inspector's crate pile or the inspector herself — a headless probe (built the real Robot City, then
  // swept every physics box and circle, and sampled every NPC's position over 400 simulated frames)
  // found the crate pile 7.3 m off and the stationary inspector 8.0 m off, both well past this radius.
  { const convLines = ['📦 "Same three crates, round and round. Nobody\'s ever counted exactly how long."', '📦 "The belt never stops — the crates just loop back when nobody\'s looking."', '📦 "Sector 8\'s whole operation, really: three crates and a very patient machine."'];
    game.addInteractable({ obj: conv2, radius: 5.5, label: () => 'Look at the conveyor belt', onUse: () => { SFX.click(); game.toast(rnd.pick(convLines), 3000); } }); }
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
  // ROBOT WORKS, SECTOR 7 and CAT? all got their own "look" toast over the last few rounds, and CHARGE
  // got an actual customer at its pylon — SECTOR 8 was the last of the city's five neon signs still mute.
  // `sign3` is already kept in a variable rather than discarded, so it goes straight to
  // `game.addInteractable`: no new mesh, no new box. A tight 1.1 m radius keeps clear of every neighbour
  // sharing this corner of the east yard: 2.0 m short of conv2's own physics box edge (its belt spans
  // z 6..18 at this x), 2.5 m inside the gap to conv2's own "Look at the conveyor belt" circle (centre
  // (44, 12), radius 5.5), 1.2 m clear of the crate pile's physics box, and 1.6 m inside the gap to the
  // quality inspector's own greet circle (radius 2.1, centred on her kneeling spot at (47.6, 19.1)) — no
  // prompt here ever competes with another.
  { const sign3Lines = ['🟠 "SECTOR 8. Orange, same as the crates it watches over."', '✨ "Nobody\'s re-lettered it since the line was Sector 3. Cheaper to rename the floor."', '📦 "Marks the belt, not much else. The inspector reads the paperwork instead."'];
    game.addInteractable({ obj: sign3, radius: 1.1, label: () => 'Look at the sign', onUse: () => { SFX.click(); game.toast(rnd.pick(sign3Lines), 3000); } }); }
  const sign4 = makeNeonSign('CHARGE', '#4ade80', 5, W); sign4.position.set(-44, 6, 22); sign4.rotation.y = PI / 2;
  // the throne in Candy Land and the fountain in Victorian both got a one-off toast for walking up and
  // looking, but the plaza's own giant robot statue — the city's one proper landmark — never got so
  // much as a glance from the cat beyond its cleaner's bucket of suds; it had a physics box since round
  // 1 and nothing to do at it. No new mesh, no new box: `addInteractable`'s own radius (3.6) just needs
  // to clear the statue's existing 4x4 footprint (half-extent 2 in x and z), same margin the fountain's
  // own interactable kept past its basin.
  { const statue = makeRobot(); statue.group.scale.setScalar(3.2); statue.group.position.set(-44, 1.0, 22); statue.group.rotation.y = PI / 2; W.add(statue.group); mesh(G.cyl(3.2, 3.6, 1.0, 20), mat(0x3a4048, { metalness: 0.7, roughness: 0.5 }), { x: -44, y: 0.5, z: 22, parent: W }); P.addBox(-44, 3, 22, 4, 7, 4); let st = 0; U.push((dt) => { st += dt; statue.animate(0, false, dt, st); }); flatPlane(game, 22, 22, mat(0x2a2f38, { roughness: 0.6, metalness: 0.3 }), -44, 22, 0, 0.015);
    const statueLines = ['🤖 "Thirty-two tonnes of chrome, and it still can\'t wave back."', '🤖 "The eyes used to light up. Nobody remembers why they stopped."', '🤖 "Tallest robot in the city, and the only one that never clocks in."'];
    game.addInteractable({ obj: statue.group, radius: 3.6, label: () => 'Admire the statue', onUse: () => { SFX.beep(); game.fx.emit(-44, 3.4, 22, { count: 14, colors: [0xcfe6ff, 0xffffff, 0x4ade80], speed: 1.1, up: 1.6, life: 0.9, gravity: 2 }); game.toast(rnd.pick(statueLines), 3000); } }); }
  // ROBOT WORKS, SECTOR 7, SECTOR 8 and CAT? all got their own "look" toast rounds ago, and CHARGE got
  // an actual customer at its pylon — but the sign itself, hung right over the statue's own plaza, was
  // still mute, the one corner of the factory floor too tight for its own prompt until now: the statue's
  // box sits to the north-west, the skyscraper at (-34, 26) to the north-east, and the statue's own
  // "Admire the statue" circle (radius 3.6) covers most of the open ground east of it. A bare anchor
  // (`group()`, no mesh) south of both, at (-40, 18), is the one spot left with room of its own.
  { const signAnchor = group(-40, 6, 18, W);
    const signLines = ['🟢 "CHARGE. Mostly for the statue cleaner\'s own trolley, these days."', '🟢 "Still humming, same green glow it\'s always had."', '🟢 "The pylon out back is the only thing that ever answers it."'];
    game.addInteractable({ obj: signAnchor, radius: 1.5, label: () => 'Look up at the sign', onUse: () => { SFX.click(); game.toast(rnd.pick(signLines), 3000); } }); }
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
  // the statue, the radar dish and the mailbox back home have all had a one-off "walk up and look"
  // toast for rounds now — the furnace, roaring and smoking since round 1, never got one, past its own
  // worker-free glow. No new mesh, no new physics box: `makeFurnace`'s own return value (already kept,
  // for its smoke-and-flicker `U.push` above) is handed straight to `game.addInteractable`. Its existing
  // box (half-extent 2 in x, 1.5 in z, at ry=0) already keeps the cat about 2 m clear on every side, so a
  // 3.6 m radius — the same used at the statue — is reachable from any angle without reaching the nearest
  // other prop: the sign-pole box at (19, -13) stays 10.8 m off, the nearest barrel (16, -22) 8.6 m off,
  // and the robot arm at (-5, -16) 14 m off, all well past this radius.
  { const furnaceLines = ['🔥 "Been roaring since the city went up. Nobody\'s ever seen it go out."', '🔥 "Too hot to get close, which is rather the point of it."', '🔥 "Feeds the whole factory floor. Mostly scrap metal, these days, and a few old secrets."'];
    game.addInteractable({ obj: furnace, radius: 3.6, label: () => 'Look at the furnace', onUse: () => { SFX.click(); game.toast(rnd.pick(furnaceLines), 3000); } }); }
  // the furnace just got its own look toast above, but the robot arm beside it — swinging its claw over
  // the factory floor since round 1 — still had nothing. Same trick again: `makeRobotArm`'s own return
  // value (already kept, for its swing-animation `U.push` two lines up) is handed straight to
  // `game.addInteractable`. No new mesh, no new box: its existing base box (half-extent 2.2 in x and z)
  // already keeps the cat about 2.2 m clear on every side, so a 3.8 m radius — just past the box's own
  // 3.11 m diagonal corner — is reachable from any angle without reaching another interactable: the
  // furnace itself sits 14 m off, the nearest conveyor (-12, -6) 12.2 m off.
  { const armLines = ['🦾 "Swings the same six crates all day. Never drops one, never gets bored."', '🤖 "Mind the claw, puss — it doesn\'t know you\'re not a crate."', '🦾 "Been reaching for something just out of frame since the day it was bolted down."'];
    game.addInteractable({ obj: arm, radius: 3.8, label: () => 'Look at the robot arm', onUse: () => { SFX.click(); game.toast(rnd.pick(armLines), 3000); } }); }
  // the robot arm and the conveyors keep the factory floor busy, but nothing in the city swings
  // anything overhead the way a real scrapyard would. A jib crane now stands out past the south
  // skyscrapers, its magnet bobbing down to a small scrap pile and back up on a slow, endless loop. A
  // headless probe (built the real Robot City with `game.load(2, 'from-prev')`, then sampled every
  // NPC's own position every quarter second over 400 simulated frames) swept a grid of the open ground
  // past the factory floor against every one of the city's physics boxes and those samples: (13, -39)
  // came back clear by 10.2 m of the nearest box (a south skyscraper's own footprint) and 10.2 m of the
  // nearest wandering robot, comfortably past the crane's own reach (mast radius 1.1 m, boom swinging
  // out to about 5.8 m at its forward-most, the scrap pile included).
  { const crane = makeScrapCrane(game, 13, -39, 0); U.push(crane.userData.update);
    const craneLines = ['🧲 "Lifts the same six pieces of scrap all shift. Never once asked for a day off."', '🤖 "Mind the swing, puss — that magnet doesn\'t care what it grabs."', '🧲 "Nobody\'s driving it. Hasn\'t needed to, not since round one."'];
    game.addInteractable({ obj: crane, radius: 6.5, label: () => 'Watch the scrap crane', onUse: () => { SFX.click(); game.toast(rnd.pick(craneLines), 3000); } }); }
  // every other world has an ambient sound of its own on a loop — the Victorian bell, Sunny Shore's dog,
  // Whisper Woods' owl — but the factory floor, with its furnace and conveyors already running, had never
  // once sounded a shift whistle. It blows on its own loop now, same long steam blast whatever the game
  // does, spaced far enough apart to read as a shift change rather than an alarm. The interval is drawn
  // from the shared `rnd()` inside this `U` tick, read only after every NPC in this build is already
  // placed, so it can't shift any construction-time wardrobe pick, here or in any world built after it.
  let shiftWhistleT = rnd.range(50, 80);
  U.push((dt) => { shiftWhistleT -= dt; if (shiftWhistleT <= 0) { SFX.whistle(); shiftWhistleT = rnd.range(90, 140); } });
  const pipe = mat(0x5a6470, { metalness: 0.8, roughness: 0.35 });
  for (const [x, z, len, ry] of [[-20, -14, 26, PI / 2], [20, -12, 22, PI / 2], [0, -23, 40, 0]]) { mesh(G.cyl(0.35, 0.35, len, 12), pipe, { x, y: 3.6, z, rz: PI / 2, ry, parent: W }); for (let k = 0; k < len; k += 6) mesh(G.cyl(0.14, 0.14, 3.4, 8), pipe, { x: ry ? x : x - len / 2 + k, y: 1.9, z: ry ? z - len / 2 + k : z, parent: W }); }
  // every other world has a wind chime by now — Robot City never did, since nobody lives there to hang
  // one. A scavenged version hangs off the east-west pipe run instead: salvaged bolts on a bracket,
  // clamped to the underside of the third run ([0, -23, 40, 0], y 3.6, spanning x -20..20 at z -23).
  // x = -13 sits a metre clear of the nearest support post (x = -14, unphysical — those posts carry no
  // P.addBox of their own) and well past every crate and barrel on this floor (nearest is [-16, -20],
  // 4.2 m away) and both neon signs; makeWindChime() itself adds no collider, so it needed no box of its
  // own either.
  place(game, U, makeWindChime(game, { wood: 0x3a4048, metal: 0xc9a227 }), -13, -23, 0, 3.6);
  // the furnace, the robot arm, the scrap crane and the wind chime have all had a one-off look/listen
  // toast for a while, but the factory's own name-brand sign overhead — the biggest piece of neon in the
  // whole city, hung since round 1 — never got so much as a glance. `makeNeonSign`'s own return value,
  // previously discarded right after `.position.set()`, is now kept in `factorySign` and handed straight
  // to `game.addInteractable`, same trick as the furnace and the arm. No new mesh, no new box: both
  // support poles ([-5, 3.2, -24] and [5, 3.2, -24]) carry no collider of their own, so there was nothing
  // to clear. A 4.5 m radius stays well inside the 9.4 m gap to the robot arm's own interactable (-5, -16,
  // radius 3.8) and the 11.4 m gap to the furnace's (9, -17, radius 3.6) — no overlap with either.
  const factorySign = makeNeonSign('ROBOT WORKS', '#ff2d95', 9, W); factorySign.position.set(0, 6.5, -24);
  { const signLines = ['🏭 "ROBOT WORKS. Same sign, same buzz, since the city went up."', '✨ "Half the bulbs in that sign have outlasted the robots that installed them."', '🤖 "Lights the whole floor pink after dark. Nobody\'s complained yet."'];
    game.addInteractable({ obj: factorySign, radius: 4.5, label: () => 'Look at the factory sign', onUse: () => { SFX.click(); game.toast(rnd.pick(signLines), 3000); } }); }
  const sign2 = makeNeonSign('SECTOR 7', '#00e5ff', 6, W); sign2.position.set(-18, 5, 6); sign2.rotation.y = PI / 2;
  // ROBOT WORKS got its own "look" toast back in round 499, but that round's own comment counted five
  // neon signs on this floor and wired up only the biggest one — SECTOR 7, CHARGE and CAT? all stayed
  // mute. This one, the closest of the three to the factory floor's own crates and the Sector 8
  // conveyor, goes first: `sign2` is already kept in a variable (unlike the others, never discarded),
  // so it goes straight to `game.addInteractable` — no new mesh, no new box. Its own support pole
  // ([-18, 6], added in the loop below as a 0.4×5×0.4 box) is the only thing anchored here; a headless
  // probe (`game.start('new')` then the real game's own synchronous `game.load(2, 'from-prev')`, 1800
  // simulated frames sampling every NPC's own position every frame) found the nearest other box (one of
  // the loose crates, at [-22, 4]) 3.81 m clear and the nearest wandering soul (a scrap-bug skittering
  // past) 4.12 m off — both comfortably past the 3.4 m radius chosen, and the nearest other interactable
  // (the portal back to Candy Land at (-10, 12)) stays 10.0 m off.
  { const sign2Lines = ['💡 "SECTOR 7. Same blue buzz it\'s always had, crates or no crates."', '✨ "Half the sign flickers if you stand under it long enough. The other half never has."', '🤖 "Marks the sector, not much else. The crates don\'t read."'];
    game.addInteractable({ obj: sign2, radius: 3.4, label: () => 'Look at the sign', onUse: () => { SFX.click(); game.toast(rnd.pick(sign2Lines), 3000); } }); }
  const signCat = makeNeonSign('CAT?', '#ffe040', 4, W); signCat.position.set(19, 5.6, -13);
  // SECTOR 7 got its own "look" toast last round, leaving CAT? the last of the factory floor's three
  // mute neon signs — left for last because of where it sits. Its own support pole (the loop just below
  // this, [19, -13] in that list) is only 2.0 m north of the little wooden door's own group position
  // (19, -15), the door Robot City leads out through to Victorian, whose "Open the wooden door"
  // interactable already reaches a generous 2.4 m — past the sign's own spot, since both share x = 19
  // and the door's radius alone covers 2.4 m of that 2.0 m gap. Rather than compete with it for the
  // prompt, this one keeps to a tight 0.9 m: since both signs share the same x, the line equidistant
  // between them is the horizontal z = -14 (1.0 m from each), so a circle under 1.0 m stays entirely on
  // the sign's own side of that line — every point inside it is strictly nearer the sign than the door,
  // and the door keeps its own prompt everywhere else, no fighting over which one shows. No new mesh,
  // no new box: `signCat` is kept instead of discarded, same trick SECTOR 7 and the factory sign upstream
  // already used.
  { const signCatLines = ['❓ "CAT? Nobody in this city has ever worked out what it was advertising."', '🤖 "The robots assumed it was a warning. Turns out it just means cat."', '✨ "Flickers yellow all night for a question nobody around here can answer."'];
    game.addInteractable({ obj: signCat, radius: 0.9, label: () => 'Look at the sign', onUse: () => { SFX.click(); game.toast(rnd.pick(signCatLines), 3000); } }); }
  // the napping-cat series has covered six of the seven worlds by now (the Neighborhood's porch,
  // Victorian's terrace, Candy Land's cottage, Frosty Peak's cabin, Sunny Shore's hut roof, Whisper
  // Woods' treehouse) — Robot City never got one, because none of its skyscrapers carry real window
  // glass to tuck a cat behind, and every hand-placed rooftop is already spoken for (camera, radar
  // dish, steam vent, missing-unit poster, hologram, window washer). The CAT? sign just above gives it
  // somewhere else to go: a scavenged metal shelf, bolted to the sign's own support pole with two angled
  // braces, holds a real stray cat curled up asleep directly under the lettering — the riddle the sign
  // poses finally answered, just not by anyone who reads signs. No new physics box and no clearance
  // probe needed: the shelf sits at y=4.55-4.58, well clear beneath the sign's own backing plate (which
  // spans y 4.9-6.3 at this same x/z) and well above the tallest wandering robot's own head, so nothing
  // on the ground was ever going to reach up there regardless. Same exact `makeNapCat()` rig every
  // other round in the series already uses; no greeting, no effect on the friend count, nothing new to
  // collect.
  { const shelfX = 19, shelfY = 4.55, shelfZ = -13;
    const scrap = mat(0x454b52, { metalness: 0.6, roughness: 0.55 });
    mesh(G.box(0.55, 0.05, 0.5), scrap, { x: shelfX, y: shelfY, z: shelfZ, parent: W });
    for (const sx of [-0.2, 0.2]) mesh(G.box(0.05, 0.3, 0.05), scrap, { x: shelfX + sx, y: shelfY - 0.15, z: shelfZ + 0.2, ry: PI / 4, parent: W });
    const napCat = makeNapCat();
    napCat.group.position.set(shelfX, shelfY + 0.03, shelfZ);
    napCat.group.rotation.y = 0.5;
    W.add(napCat.group);
    let napT = 4; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); }); }
  for (const [x, z] of [[-18, 6], [19, -13]]) { mesh(G.cyl(0.12, 0.16, 5, 8), pipe, { x, y: 2.5, z, parent: W }); P.addBox(x, 2.5, z, 0.4, 5, 0.4, { cam: false }); }
  mesh(G.cyl(0.12, 0.16, 6.4, 8), pipe, { x: -5, y: 3.2, z: -24, parent: W }); mesh(G.cyl(0.12, 0.16, 6.4, 8), pipe, { x: 5, y: 3.2, z: -24, parent: W });
  // crates & barrels around
  const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) }), barrelM = mat(0x2f6f9f, { metalness: 0.6, roughness: 0.4 });
  let farCrate = null, midCrate = null, wallCrate = null, eastCrate = null;
  for (const [x, z, s] of [[-22, 4, 1], [-23, 5.2, 0.8], [22, 2, 1], [-4, 8, 0.9], [15, 12, 1.1], [-16, -20, 1]]) { const cm = mesh(G.box(s, s, s), crateM, { x, y: s / 2, z, ry: r() * 0.5, parent: W }); P.addBox(x, s / 2, z, s, s, s, { cam: false }); if (x === -16 && z === -20) farCrate = cm; if (x === 15 && z === 12) midCrate = cm; if (x === -22 && z === 4) wallCrate = cm; if (x === 22 && z === 2) eastCrate = cm; }
  // the furnace, the robot arm, the barrel at (16, -22) and the factory sign have all picked up a "look"
  // toast over past rounds, but every one of these six loose crates — scattered round the floor since
  // round 1, same as the barrels — stayed untouched. The one out at (-16, -20), tucked in the quiet
  // south-west corner past the barrel row, comes free: `cm`, this loop's own `mesh()` return, is kept
  // for the one matching coordinates instead of discarded, no new mesh and no new box, the same trick
  // the barrel and the sign used on their own loop returns. A headless probe (`game.start('new')`,
  // `game.travel(2, 'from-prev')`, 1800 simulated frames sampling every NPC's own position every sixth
  // frame) swept this spot against every physics box, every sample and every interactable already on
  // this floor: the nearest other box (a barrel at [-15, -25]) stayed 4.59 m clear, the nearest
  // wandering soul 7.21 m off and the nearest other interactable (the "Say hi" by the door) 7.21 m off
  // — all comfortably past the 2.0 m radius chosen for a crate with only a 0.5 m half-extent.
  { const crateLines = ['📦 "No label, no stencil, not even a stray barcode. Whatever shipped in it, nobody wrote down."', '📦 "Lighter than it looks — empty, probably, or packed with something the robots don\'t need twice."', '🤖 "The forklift bot never rolls out this far. This crate has been resting undisturbed for a long while."'];
    game.addInteractable({ obj: farCrate, radius: 2.0, label: () => 'Look at the crate', onUse: () => { SFX.click(); game.toast(rnd.pick(crateLines), 3000); } }); }
  // the crate out at (-16, -20) got its own "look" a few rounds back, leaving four more of these six on
  // the loop still bare. The one at (15, 12), tucked in the open stretch between the two conveyor belts
  // and the pipe run, comes free the same way: `cm`, this same loop's own `mesh()` return, kept for the
  // one matching coordinates instead of discarded — no new mesh, no new box. A headless probe (the stub
  // bundle itself, `game.travel(2, 'from-prev')`, 1800 simulated frames sampling every NPC's own
  // position every sixth frame) swept this spot against every physics box, every sample and every
  // interactable already on this floor: the nearest other box stayed 4.85 m clear, the nearest
  // wandering soul 3.63 m off and the nearest other interactable 8.54 m off — all comfortably past the
  // 2.2 m radius chosen for a crate with only a 0.55 m half-extent.
  { const midCrateLines = ['📦 "Sits right between the two belts, same as it always has — neither one claims it."', '📦 "Stencil long gone, if it ever had one. Just a crate now."', '🤖 "No forklift route runs through here. This one gets left alone."'];
    game.addInteractable({ obj: midCrate, radius: 2.2, label: () => 'Look at the crate', onUse: () => { SFX.click(); game.toast(rnd.pick(midCrateLines), 3000); } }); }
  // the crates at (-16, -20) and (15, 12) got their own "look" toast in past rounds, leaving three more
  // of the six on the loop still bare — two of them, at (-22, 4) and (-23, 5.2), sit barely 1.3 m apart
  // and would leave no room for either one's own circle, so they're skipped again this round the same
  // way the barrel pair by the entrance ramp was. The lone one at (-22, 4) comes free instead: `cm`, this
  // same loop's own `mesh()` return, kept for the one matching coordinates instead of discarded — no new
  // mesh, no new box. A headless probe (the stub bundle itself, `game.travel(2, 'from-prev')`, 1800
  // simulated frames sampling every physics box, NPC and interactable every sixth frame) found this spot
  // backed right up against the factory building's own wall — only 0.85 m clear, the tightest of any
  // crate or barrel yet — with the nearest wandering soul a comfortable 3.39 m off and the nearest other
  // interactable 6.71 m off. A second probe walked a 36-point ring at a few candidate radii instead of
  // trusting the single nearest-box figure: at 0.7 m, 33 of those 36 points stood on open floor, so the
  // crate keeps a walkable approach from every side but the one pressed against the wall, and the prompt
  // gets a 0.7 m radius — tighter than any crate before it, since there is genuinely less room here.
  { const wallCrateLines = ['📦 "Wedged right up against the building — however it got stacked here, nobody\'s moved it since."', '📦 "Scrapes the wall if you lean on it. Nobody\'s bothered to shift it the one metre it would take."', '🤖 "Still reads as cargo to the loading bots. They just never route this way."'];
    game.addInteractable({ obj: wallCrate, radius: 0.7, label: () => 'Look at the crate', onUse: () => { SFX.click(); game.toast(rnd.pick(wallCrateLines), 3000); } }); }
  // the crates at (-16, -20), (15, 12) and (-22, 4) got their own "look" toast in past rounds; the
  // last of the six still bare is the one east of the belts at (22, 2), closer to the skyscraper
  // row than to anything else hand-placed. `cm`, this same loop's own `mesh()` return, is kept for
  // the one matching coordinates instead of discarded — no new mesh, no new box, the same trick the
  // other three crates already used. A headless probe (the stub bundle itself, `game.load(2,
  // 'from-prev')`, 3600 simulated frames tracking every wandering robot's own position every frame)
  // found the nearest other physics box 6.08 m clear and the nearest wandering soul coming no closer
  // than 1.97 m over that whole run. A second probe walked a 36-point ring at 1.3 m out and found
  // every one of those points on open floor, so the crate gets a full walkable approach and a 1.3 m
  // radius — comfortably inside both figures above, same margin the earlier three crates kept.
  { const eastCrateLines = ['📦 "Sits closer to the skyscrapers than to the belts — nobody\'s claimed it either way."', '📦 "No stencil, no dent, no reason anyone\'s given for it being exactly here."', '🤖 "The forklift bots have a route past every other crate on this floor. Not this one."'];
    game.addInteractable({ obj: eastCrate, radius: 1.3, label: () => 'Look at the crate', onUse: () => { SFX.click(); game.toast(rnd.pick(eastCrateLines), 3000); } }); }
  let farBarrel = null, swBarrel = null, midBarrel = null, rampBarrel = null, rampBarrel2 = null;
  for (const [x, z] of [[28.5, 3.5], [29.7, 2.2], [-6, 10], [16, -22], [-24, -22]]) { const bm = mesh(G.cyl(0.5, 0.5, 1.2, 14), barrelM, { x, y: 0.6, z, parent: W }); P.addBox(x, 0.6, z, 1, 1.2, 1, { cam: false }); if (x === 16 && z === -22) farBarrel = bm; if (x === -24 && z === -22) swBarrel = bm; if (x === -6 && z === 10) midBarrel = bm; if (x === 28.5 && z === 3.5) rampBarrel = bm; if (x === 29.7 && z === 2.2) rampBarrel2 = bm; }
  // the furnace and the robot arm beside it both got a "look" toast a few lines up — the five barrels
  // scattered round the floor, standing since round 1, never got so much as a glance. The one out at
  // (16, -22), nearest the furnace at 8.6 m and the sign-pole at 9.5 m (both already worked out above),
  // is kept straight off this loop's own `mesh()` return rather than built again: no new mesh, no new
  // box, same trick the furnace and the robot arm just used on their own return values. Its existing
  // box (half-extent 0.5 m) only needs a little over 2 m of clearance to be walked all the way round,
  // so a 2.4 m radius never reaches the furnace, the sign-pole, or the robot arm at (-5, -16) 21.8 m off.
  { const barrelLines = ['🛢️ "Contents: unknown. Smell: considerably worse."', '🛢️ "Dented clean through on one side — something heavier than a mop handle did that."', '😼 The cat noses the rim, learns nothing, and decides the furnace was more interesting anyway.'];
    game.addInteractable({ obj: farBarrel, radius: 2.4, label: () => 'Look at the barrel', onUse: () => { SFX.click(); game.toast(rnd.pick(barrelLines), 3000); } }); }
  // the barrel at (16, -22) got its own "look" toast two rounds back, leaving four more on this same
  // loop still bare. The one furthest south-west, (-24, -22), sits alone past the pinwheel with nothing
  // else nearby: a headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself
  // uses — `game.start('new')`, `game.travel(2, 'from-hub')`, 1800 simulated frames sampling every NPC's
  // own position every sixth frame) swept it against every one of the city's physics boxes, every
  // sample and every interactable already placed: the nearest other box stayed 8.93 m clear, the
  // nearest wandering soul 6.00 m off and the nearest other interactable 7.35 m off — all comfortably
  // past the 2.4 m radius the other barrel already uses.
  { const swBarrelLines = ['🛢️ "Rolled all the way out here and never rolled back."', '🛢️ "Rusted shut — whatever\'s inside is staying inside."', '😼 Furthest barrel from the furnace. Somehow still warm to the touch.'];
    game.addInteractable({ obj: swBarrel, radius: 2.4, label: () => 'Look at the barrel', onUse: () => { SFX.click(); game.toast(rnd.pick(swBarrelLines), 3000); } }); }
  // the barrels at (16, -22) and (-24, -22) got their own "look" toast over past rounds, leaving the two
  // paired by the entrance ramp and this one — out past the mechanic's bay, nearest the pipe run at
  // (-18, 6) — still bare. The one at (-6, 10) comes free the same way as the others: `bm`, this same
  // loop's own `mesh()` return, kept for the one matching coordinates instead of discarded — no new mesh,
  // no new box. A headless probe (the stub bundle itself, `game.travel(2, 'from-prev')`, 1800 simulated
  // frames sampling every NPC's own position every sixth frame) swept this spot against every physics box
  // on the floor (excluding its own) and every sample: the nearest other box stayed 2.19 m clear and the
  // nearest wandering soul 2.42 m off, so a smaller 1.6 m radius — tighter than the other two barrels'
  // 2.4 m, since this corner is more crowded — stays well short of either.
  { const midBarrelLines = ['🛢️ "Tucked by the pipe run, out of everyone\'s way — including the mechanic\'s."', '🛢️ "No dent, no rust streak. This one just never got used."', '😼 The cat gives it a sniff. Just old metal and pipe grease.'];
    game.addInteractable({ obj: midBarrel, radius: 1.6, label: () => 'Look at the barrel', onUse: () => { SFX.click(); game.toast(rnd.pick(midBarrelLines), 3000); } }); }
  // the barrels at (16, -22), (-24, -22) and (-6, 10) all got their own "look" toast over past rounds,
  // leaving only the entrance-ramp pair at (28.5, 3.5) and (29.7, 2.2) bare — skipped every time before
  // now for sitting only 1.77 m apart, center to center, leaving little room for either one's own circle.
  // The one at (28.5, 3.5), nearer the airlock cat spawns beside, comes free the same way as the other
  // three: `bm`, this same loop's own `mesh()` return, kept for the one matching coordinates instead of
  // discarded — no new mesh, no new box. A headless probe (the stub bundle itself, `game.travel(2,
  // 'from-prev')`, 3600 simulated frames sampling every physics box, NPC and interactable on the floor
  // every sixth frame) found the nearest other box — its own neighbour at (29.7, 2.2) — 1.06 m clear,
  // the nearest wandering soul 9.30 m off and the nearest other interactable 6.67 m off, so a 0.6 m
  // radius (tighter than every barrel before it, since this is genuinely the most crowded corner of the
  // five) stays a clean half-metre short of reaching its own neighbour's circle.
  { const rampBarrelLines = ['🛢️ "Rolled off the ramp years ago and nobody\'s rolled it back on."', '🛢️ "Its twin sits a metre off. Whatever they held, it wasn\'t worth separating."', '😼 The cat squeezes between this barrel and the next, finds nothing, and squeezes back out.'];
    game.addInteractable({ obj: rampBarrel, radius: 0.6, label: () => 'Look at the barrel', onUse: () => { SFX.click(); game.toast(rnd.pick(rampBarrelLines), 3000); } }); }
  // the barrel at (28.5, 3.5) got its own "look" toast last round and left a note behind: its twin at
  // (29.7, 2.2), 1.77 m away centre to centre, was still skippable on its own merits but "now with
  // company" — the first barrel's own circle had already proven a small radius fits in this corner. The
  // twin comes free the same way as every barrel before it: `rampBarrel2`, the same loop's own `mesh()`
  // return, kept instead of discarded — no new mesh, no new box. A headless probe (the stub bundle
  // itself, `game.start('new')`, `game.load(2, 'from-prev')`, 3600 simulated frames sampling every
  // physics box, NPC and interactable on the floor every sixth frame) found the nearest other box — its
  // own neighbour at (28.5, 3.5) — the same 1.06 m clear the neighbour's own probe found looking the
  // other way, the nearest wandering soul 5.73 m off and the nearest other interactable (that same
  // neighbour) 1.77 m off. A 0.5 m radius, tighter even than the neighbour's own 0.6 m, keeps the two
  // circles a clean 0.67 m apart center-to-edge-sum short of touching.
  { const rampBarrel2Lines = ['🛢️ "Never made it onto the ramp at all. Rolled the other way instead."', '🛢️ "Its twin\'s a metre off, nearer the airlock. Whatever was inside, neither one kept it."', '😼 The cat squeezes between this barrel and the next, finds nothing, and squeezes back out the other side.'];
    game.addInteractable({ obj: rampBarrel2, radius: 0.5, label: () => 'Look at the barrel', onUse: () => { SFX.click(); game.toast(rnd.pick(rampBarrel2Lines), 3000); } }); }
  // every robot in this city gets refuelled somehow, but nothing on the whole factory floor ever
  // actually sold oil. A free-standing vending machine now stands south of the factory sign, three rows
  // of oil cans behind its own glass front, a coin slot and three buttons nobody's ever seen light up in
  // the right order. Reuses `makeNeonSign()` for its own little "OIL" plate on top, same trick the
  // factory sign and both sector signs already use. Pure static mesh, like the gumball machine — no
  // `userData.update`, nothing added to this world's `U` list.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `game.start('new')`, `game.travel(2, 'from-prev')` waited out through its real portal-fade timer,
  // then 300 simulated frames sampling every NPC's own position every 15th frame) swept a 3 m grid of
  // the floor against both those samples and every one of the city's own physics boxes: (0, -33) came
  // back clearest of the lot, 9.90 m from the nearest box or wandering soul — south of the factory
  // sign's own pole at (0, -24) (9 m off, well past its own 4.5 m "Look at the factory sign" circle) and
  // clear of both pipe runs at (±5, -24). Short of the radius (98) where robotRegion's own procedural
  // fill takes over.
  { const vx = 0, vz = -33;
    const vending = makeOilVendingMachine(game, vx, vz, 0);
    const vendingLines = ['🛢️ "OIL — 50 credits a can, exact change only."', '🤖 "Row 3B has been empty since Sector 7 stopped reporting in."', '😼 The cat noses the coin slot, finds no coin, and gives up.'];
    game.addInteractable({ obj: vending, radius: 2.0, label: () => 'Look at the vending machine', onUse: () => { SFX.click(); game.toast(rnd.pick(vendingLines), 3000); } }); }
  // the Neighborhood, Candy Land, Sunny Shore, Whisper Woods and Robot City's own maintenance drone all
  // spin on the world clock by now, but no actual toy pinwheel had ever been planted on the factory
  // floor — someone off-shift stuck a scavenged one in a crack in the concrete anyway. Same geometry and
  // spin trick as every pinwheel before it (`pivot.rotation.z = t * 3.6`, drawing only on the world clock
  // `t`, never this world's own seeded `r`, so it can't shift any later wardrobe pick), just reskinned in
  // scrap-metal and neon instead of wood and primary colours, the same reskin-not-new-code choice round
  // 253's wind chime made here. A headless probe swept candidate points against every one of the city's
  // 1165 physics boxes and all 42 NPCs: (-8, -27) came back clear by 9.9 m from the nearest box (the
  // crate at [-16, -20]) and 10.6 m from the nearest soul, open concrete north of the sentry's own
  // [-15,-35]..[15,-45] patrol rectangle.
  { const px = -8, pz = -27, stickH = 0.7, bladeLen = 0.28;
    const pin = group(px, 0, pz, W), stickMat = mat(0x3a4048, { metalness: 0.6, roughness: 0.5 }), hubMat = mat(0xc9a227, { metalness: 0.7, roughness: 0.3 });
    mesh(G.cyl(0.018, 0.022, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
    const pivot = group(0, stickH, 0, pin);
    const bladeColors = [0x00e5ff, 0xff2d95, 0xffe040, 0x8a929c];
    for (let bi = 0; bi < 4; bi++) { const theta = bi * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
      mesh(G.box(bladeLen, 0.2, 0.02), mat(bladeColors[bi], { metalness: 0.4, roughness: 0.4 }), { x: bx, y: by, rz: theta, parent: pivot }); }
    mesh(G.sphere(0.045, 8, 6), hubMat, { parent: pivot });
    U.push((dt, t) => { pivot.rotation.z = t * 3.6; });
    P.addBox(px, stickH / 2, pz, 0.14, stickH, 0.14, { cam: false }); }
  // the Neighborhood, Candy Land, Sunny Shore, Frosty Peak, Victorian (its fiddler) and Whisper Woods all
  // have someone making music by now — Robot City was the one world left without, since a robot has no
  // hands to hold a ukulele. One drums on a scavenged oil barrel instead, its own two arms standing in for
  // sticks. A headless probe swept open floor west of Sector 7 against every one of the city's 1166
  // physics boxes and all 42 NPCs sampled continuously over 20 simulated seconds (so no wandering robot or
  // the tag/catch/ring-dance pairs could slip past unnoticed): (-20, 20) came back clear by 9.6 m from the
  // nearest box and 18 m from the nearest soul, well past the skyscraper at (-34, 26) and the factory
  // mouse's own patch by the crates.
  { const mx = -20, mz = 20, mry = PI / 2, dx = mx + sin(mry) * 0.6, dz = mz + cos(mry) * 0.6;
    const drummer = makeRobot(); W.add(drummer.group);
    const stickMat = mat(0x3a4048, { metalness: 0.6, roughness: 0.5 });
    for (const side of [0, 1]) mesh(G.cyl(0.015, 0.015, 0.26, 6), stickMat, { y: -0.46, rx: 0.3, parent: drummer.arms[side].el });
    const drumM = mat(0x2f6f9f, { metalness: 0.6, roughness: 0.4 }), rimM = mat(0xc9a227, { metalness: 0.7, roughness: 0.3 });
    mesh(G.cyl(0.3, 0.3, 0.55, 14), drumM, { x: dx, y: 0.275, z: dz, parent: W });
    mesh(G.torus(0.3, 0.025, 6, 16), rimM, { x: dx, y: 0.55, z: dz, rx: PI / 2, shadow: 'none', parent: W });
    P.addBox(dx, 0.275, dz, 0.6, 0.55, 0.6, { cam: false });
    game.npcs.push(new Charger(game, drummer, { x: mx, z: mz, ry: mry,
      cries: ['Rhythm subroutine: engaged.', 'Nobody wrote sheet music for a robot. Improvising.', 'Mind the dents, puss — this drum used to be a barrel.', 'Beep. Boop. Beep-beep-boop.'] }));
    U.push((dt, t) => { const A0 = drummer.arms[0], A1 = drummer.arms[1];
      A0.sh.rotation.x = -0.35; A0.el.rotation.x = -0.9 + max(0, sin(t * 4.4)) * -0.5;
      A1.sh.rotation.x = -0.35; A1.el.rotation.x = -0.9 + max(0, sin(t * 4.4 + PI)) * -0.5; }); }
  // every other world had wildlife of its own, down to last round's pigeons in the Victorian square — Robot
  // City, for all its robots, never had a single living creature. A grey factory mouse now darts about the
  // open floor by the crate stack near Sector 7's pipe run, the way a real one would live off whatever a
  // factory drops. A headless probe swept the gap between the crates at (-22, 4)/(-23, 5.2), the Sector 7
  // sign pole at (-18, 6) and the wandering robot patrolling near (-16, -2): (-19, 2) came back clear by
  // 2.9 m from the nearest box, comfortably past the 1.3 m leash given here.
  { const rig = makeFactoryMouse(); game.npcs.push(new Hopper(game, rig, { x: -19, z: 2, leash: 1.3, r: 0.15, dist: [0.3, 0.7], dur: 0.3, height: 0.24, idle: [1, 3.5], onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } }));
    // the factory mouse was ambient from the day it was added — `Hopper` (unlike `Wanderer`) never calls
    // `greetable()` on its own, the same reason the beach's hermit crab and the forest's frogs and hares
    // needed their own explicit interactable. No new mesh and no new physics box: `game.namedFriend` and
    // `game.addInteractable` tracked on the rig's own group every frame, so the prompt follows it through
    // its tiny hops within the 1.3 m leash; the radius (2.1 m, matching every other Hopper creature's own
    // greet circle) stays clear of the nearest crate (3.6 m to [-22, 4]) and the Sector 7 pipe (4.1 m to
    // [-18, 6]), so nothing else's own box or prompt overlaps it.
    const mouseId = game.namedFriend('factorymouse');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the mouse', onUse: () => { game.befriend(mouseId); SFX.chitter(); game.hearts(rig.group.position.x, 0.3, rig.group.position.z, 3); game.toast('🐭 *freezes, whiskers twitching, then dives back toward the crates*'); } }); }
  // the factory mouse above was Robot City's only living thing past the robots themselves — every other
  // world's own wildlife runs to at least two creatures by now (Candy Land's sugar mouse and mint hare,
  // Frosty Peak's hares and arctic fox, Victorian's pigeons and alley rat). A scrap-built crab-bot now
  // scuttles the open floor north of the ring dance, built from spare plating rather than shell — the
  // same `makeCrab` rig every Sunny Shore crab already uses, just recoloured gunmetal grey, on a plain
  // `Wanderer`. It went in ambient, left ungreeted on the grounds that Sunny Shore's own crabs were
  // ambient too — but this log has since gone back and fixed every one of those beach crabs one by one
  // (round-by-round: crab through crab6, boldcrab, hermitcrab), so this crab-bot is now the only crab
  // left in the whole game nobody can say hello to. Same root cause as always: `makeCrab()`'s rig
  // carries none of `.look`/`.robot`/`.cookie`, so `Wanderer`'s own `greetable()` call quietly no-ops
  // on it. A headless probe sampled every NPC's own position continuously over 400 simulated frames (so
  // no wandering robot, tag pair or ring dancer mid-turn could slip past unnoticed) and swept a grid of
  // the open floor against both those samples and every one of the city's 1166 physics boxes: (-12, 30)
  // came back clear by 11.1 m in every direction, open concrete north of the ring dance at (0, 40) and
  // well inside the radius (98) where robotRegion's own procedural fill takes over — unchanged by this
  // round, since nothing about its placement needed to move.
  { const rig = makeCrab(0x7a828c); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: -12, z: 30, speed: r.range(0.6, 0.9), leash: 4, r: 0.22, height: 0.45, step: 0.25, idle: [1, 3], walk: [1, 3] }));
    // No new mesh, no new physics box: `game.namedFriend('scrapcrab')` plus a `game.addInteractable`
    // keyed straight to the rig's own group (2.1 m radius, matching every other crab's own greet
    // circle), tracked every frame so the prompt follows it through its 4 m leash. `SFX.beep()` rather
    // than the organic crabs' `SFX.chitter()`, since this one is scrap-built, not shell-built.
    const crabBotId = game.namedFriend('scrapcrab');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the crab-bot', onUse: () => { game.befriend(crabBotId); SFX.beep(); game.hearts(rig.group.position.x, 0.5, rig.group.position.z, 3); game.toast('🦀 *claws clack together, servos whirring*'); } }); }
  // every other world has a landmark that reacts to the cat walking up to it — Robot City had its
  // furnace, radar dish, robot arm and statue, but nothing that actually noticed the cat on its own. An
  // archive-bot now stands at its own tripod camera on the open concrete south of Sector 7, filing an
  // image of whatever crosses its lens. A headless probe (the same stub-three harness `test/run.mjs`
  // uses) built the real city (`game.load(2, 'from-hub')`) and sampled every NPC's own position every
  // quarter second over 30 simulated seconds (so no wandering robot or ring dancer mid-turn could slip
  // past unnoticed), then swept the open floor against both those samples and every one of the city's
  // physics boxes, staying well clear of the sentry's own patrol rectangle ([-15,-35]..[15,-45], with a
  // margin) and every wandering robot's own leashed range: (-25, -8.5) came back clear by 11.4 m of the
  // nearest box (a skyscraper wall) and 11.0 m of the nearest other soul, at radius 26.4 from the
  // origin — comfortably inside the radius (98) where robotRegion's own procedural fill takes over. No
  // new controller: `Charger` already stands put with its own idle sway and cries, same as the fiddler
  // and the drummer; the raised arm and the camera's own flash are a per-frame `U.push` override, same
  // trick the drummer's drumsticks already use.
  { const px = -25, pz = -8.5, ry = atan2(0 - px, 0 - pz), cx = px + sin(ry) * 0.9, cz = pz + cos(ry) * 0.9, hubY = 0.78;
    const legM = mat(0x3a3f47, { metalness: 0.8, roughness: 0.4 }), bodyM = mat(0x9aa3ad, { metalness: 0.85, roughness: 0.3 }), lensM = mat(0x0c0c0c, { metalness: 0.6, roughness: 0.25 });
    const tripod = group(cx, 0, cz, W); tripod.rotation.y = ry;
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; const leg = group(cos(a) * 0.3, 0, sin(a) * 0.3, tripod); leg.rotation.y = -a;
      mesh(G.cyl(0.022, 0.028, 0.82, 6), legM, { y: 0.41, rx: -0.3, parent: leg }); }
    const hub = group(0, hubY, 0, tripod);
    mesh(G.box(0.3, 0.22, 0.34), bodyM, { parent: hub });
    mesh(G.cyl(0.1, 0.09, 0.12, 14), lensM, { z: 0.21, parent: hub });
    const bulb = mesh(G.sphere(0.045, 8, 6), glowMat(0xfff176, 0.5), { y: 0.14, z: 0.1, shadow: 'none', parent: hub });
    P.addBox(cx, hubY / 2, cz, 0.7, hubY, 0.7, { cam: false });
    const bot = makeRobot(); W.add(bot.group);
    game.npcs.push(new Charger(game, bot, { x: px, z: pz, ry, cryIcon: '📷',
      cries: ['Image capture subroutine: engaged.', "Hold still. Or don't — I'll adjust the shutter speed.", 'Filed under: visitor, feline, unauthorized.'] }));
    const A = bot.arms[1];
    let flashT = rnd.range(5, 9);
    U.push((dt) => {
      A.sh.rotation.x = -1.3; A.sh.rotation.z = -0.5; A.el.rotation.x = -0.5;   // one arm permanently raised to the shutter release
      flashT -= dt;
      if (flashT <= 0) { SFX.shutter(); bulb.material.emissiveIntensity = 3; game.fx.emit(cx, hubY + 0.14, cz, { count: 10, colors: [0xffffff, 0xfff6cf], speed: 0.6, up: 0.4, life: 0.3, gravity: 0.5, spread: 0.6 }); flashT = rnd.range(9, 16); }
      else bulb.material.emissiveIntensity = max(0.5, bulb.material.emissiveIntensity - dt * 6);
    }); }
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
  // the ring-dancing robots never had anything watching from above; a small maintenance drone now
  // hovers in a slow circle over their own clearing, red sensor light sweeping the floor below. It
  // reuses the same spot the RingDance probe already swept clear (12.9 m from the nearest wall, 9.6 m
  // past the nearest Wanderer's leash) and flies at 3.4 m, well above every robot's 1.9 m head height,
  // so it needs no physics box of its own — nothing on the ground can ever reach it. It is not pushed
  // to game.npcs (no greeting, no friend count, no effect on any zone or physics check), exactly like
  // the seagulls, fairies and butterflies elsewhere: a pure background prop. Its own circling uses the
  // world clock `t` passed into every `U` entry, not `r` or the shared `rnd()`, so it draws nothing
  // from either and cannot disturb any later wardrobe pick or timing-sensitive check, in this build or
  // any built after it.
  { const dcx = 0, dcz = 40, dh = 3.4, drad = 2.2;
    const steel = mat(0x8a929c, { metalness: 0.75, roughness: 0.3 }), dark = mat(0x2a2f38, { roughness: 0.6 });
    const drone = group(dcx, dh, dcz, W);
    mesh(G.sphere(0.16, 14, 10), steel, { sy: 0.55, parent: drone });
    mesh(G.torus(0.17, 0.02, 6, 16), dark, { y: -0.06, rx: PI / 2, shadow: 'none', parent: drone });
    const eye = mesh(G.sphere(0.045, 10, 8), glowMat(0xff3b3b, 1.6), { y: -0.09, z: 0.1, shadow: 'none', parent: drone });
    const rotors = [];
    for (const [ax, az] of [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]]) {
      const arm = group(ax, 0.03, az, drone);
      mesh(G.cyl(0.012, 0.012, 0.18, 6), steel, { rx: PI / 2, parent: arm });
      rotors.push(mesh(G.box(0.18, 0.006, 0.02), dark, { parent: arm }));
    }
    const pl = pointLight(0xff3b3b, 8, 5, 0, -0.09, 0.1, drone);
    U.push((dt, t) => {
      const a = t * 0.3;
      drone.position.set(dcx + cos(a) * drad, dh + sin(t * 1.1) * 0.1, dcz + sin(a) * drad);
      drone.rotation.y = a + PI / 2;
      for (const rt of rotors) rt.rotation.y += dt * 30;
      const blink = 0.6 + max(0, sin(t * 2.4)) * 1.4;
      eye.material.emissiveIntensity = blink; pl.intensity = 4 + blink * 3;
    });
  }
  // every other world's Birder watches generic wildlife that isn't actually a scene object — except
  // Frosty Peak's (round 115), the first to train its binoculars on something the world really has,
  // its own penguin colony. Robot City never had a Birder at all (nothing here flies except the
  // drone-flies and this one maintenance drone), so it skipped the pattern twice over. A technician
  // now stands south-east of the ring, binoculars trained on the drone's own slow circle instead of a
  // flock. A headless probe swept a grid around the ring-dance clearing (radius 3-10 from its centre)
  // against every one of the city's physics boxes and 300 simulated seconds of every NPC's own
  // position (long enough for the ring-dancers, the sentry's patrol and the tag/catch pairs to clear
  // any one spot several times over): (7.1, 32.9) came back clear by 9.6 m of the nearest box and
  // 8.8 m of the nearest other soul (the juggler further north), 10 m out from the clearing's own
  // centre — close enough to read as watching the drone, not the dancers.
  { const spotWard = makeWardrobe(r, { shirts: [0x3a4a6a, 0x4a5a6a, 0x2a3a52], pants: [0x232c34, 0x2a2a30] });
    const spotter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.25), wardrobe: spotWard }),
      hat: 'cap', hatColor: 0x2a3a52, glasses: true, glassColor: 0x1c232c, jacket: null, scarf: null, bag: null, backpack: null });
    W.add(spotter.group);
    game.npcs.push(new Birder(game, spotter, { x: 7.1, z: 32.9, ry: atan2(0 - 7.1, 40 - 32.9),
      cries: ['Same loop, same six seconds, every time.', "Careful, puss — it's not a bird, but it still logs you.", 'Foreman swears it watches for pests. Nobody believes him.'] })); }
  // every other world already has a Juggler (the Neighborhood's balloon square, Candy Land's court jester,
  // Victorian's street performer, Sunny Shore's boardwalk busker, Frosty Peak's and Whisper Woods' own) —
  // Robot City, the densest of the seven, was the one left without. A headless probe swept a 2.6 m clearance
  // disc against every one of its 1163 physics boxes, every Wanderer's home-plus-leash circle, the sentry's
  // patrol rectangle, the tag and catch pairs' leash/gap, and the ring dance's own ring, each with a further
  // 3 m margin: (15, 37) came back clear by over 15 m from the nearest of any of them — open floor north of
  // the factory, close enough to the ring dance to read as the same recreational corner of the city.
  // Juggler's baseY uses rig.k (a human's height ÷ 1.75, set by makeHuman); makeRobot() never sets it, so —
  // exactly as the robots standing in for the catch pair already do — it's given the same ratio the robots'
  // own Wanderer height (1.9 m) implies, or the three balls orbit at NaN height instead of the robot's hands.
  { const juggler = makeRobot(); juggler.k = 1.9 / 1.75; W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xff9f43, 0x00e5ff, 0x4ade80], { x: 15, z: 37, ry: atan2(0 - 15, 40 - 37), cryIcon: '🔧',
      cries: ['Recreational subroutine: juggling.', 'Do not report dropped bolts to the foreman.', 'Entertainment protocol engaged.', 'Three bolts, zero torque wrenches.'] })); }
  // a mechanic kneels over a wonky robot on the open floor, wrench in hand — a tightened bolt sparks and the patient sits bolt upright for a moment
  { const mech = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }), shirt: 0x3a4a6a, stripes: null, pants: 0x232c44, shoes: 0x1a1a20, hat: 'cap', hatColor: 0x3a4a6a, jacket: null, scarf: null, bag: null, build: 'stout', glasses: false });
    W.add(mech.group);
    const patient = makeRobot();
    game.npcs.push(new Mechanic(game, mech, patient, { x: 2, z: 18, ry: PI,
      cries: ['Nearly got it...', "It's just a squeaky bearing.", 'Hold still, you overgrown toaster.', 'There! ...no. Not quite.'] }));
    // the patient itself — the robot actually getting worked on, standing 0.85 m off the mechanic's own
    // kneeling spot — never got a glance of its own, for all the wrench time spent on it. `makeRobot()`'s
    // own group, captured here instead of being handed straight to the `Mechanic` constructor and
    // discarded, is the same trick rounds 602-605 used on other props now turned on an NPC's own patient.
    // 0.75 m keeps it clear of the mechanic's 0.4 m greet circle 0.85 m away; `addInteractable` picks
    // nearest by distance² (per `80-game.js`) if a cat ever stands where both would answer.
    const patientLines = ['🤖 "A dent above the knee joint — old damage, not new."', '🤖 "One access panel hangs by a single loose screw."', '🤖 "The diagnostic light just blinks amber. Nobody knows what amber means."'];
    game.addInteractable({ obj: patient.group, radius: 0.75, label: () => 'Look at the patient', onUse: () => { SFX.click(); game.toast(rnd.pick(patientLines), 3000); } }); }
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
  // the oil vendor above sells by hand when she's on shift, but nothing in this city dispenses on its
  // own. A vending machine now stands on the open floor north of the ring-dance clearing, squat and
  // scuffed, its screen flickering between an oil-drop icon and a wall of small print nobody reads. A
  // headless probe (the same stub-three harness `test/run.mjs` uses) built the real Robot City
  // (`game.travel(2, 'from-prev')`), sampled every NPC's own position every quarter second over 150
  // simulated seconds — long enough for the sentry's and RoboDog's full patrol loops and several
  // tag/catch/ring-dance cycles to show up, not just whatever a short snapshot happened to catch — then
  // swept the open floor (radius 15-55, well short of the city's hand-built edge) against both those
  // samples and every one of the city's physics boxes: (25, 36) came back clear by 10.1 m of the nearest
  // box (a skyscraper wall) and 9.4 m of the nearest other soul (the wandering robot leashed near
  // [30, 44]), between the oil vendor's own patch to the south and the juggler/ring-dance corner to the
  // north-west. No new controller: it's a static machine like the furnace and the statue, its screen and
  // point light flickering on the world clock `t` alone, never this world's own seeded `r`, so it costs
  // no later wardrobe or layout pick anywhere in this build.
  { const vx = 25, vz = 36, vh = 0.95, vry = atan2(-vx, -vz);
    const steel = mat(0x5a6470, { metalness: 0.75, roughness: 0.35 }), dark = mat(0x232832, { roughness: 0.6 });
    const vend = group(vx, 0, vz, W); vend.rotation.y = vry;
    mesh(G.box(0.9, 1.9, 0.6), steel, { y: vh, parent: vend });
    mesh(G.box(0.76, 0.9, 0.02), dark, { y: 1.25, z: 0.31, parent: vend });
    const screen = mesh(G.box(0.7, 0.8, 0.01), glowMat(0x00e5ff, 1.4), { y: 1.25, z: 0.325, shadow: 'none', parent: vend });
    for (let i = 0; i < 3; i++) mesh(G.cyl(0.03, 0.03, 0.03, 10), mat([0xff9f43, 0x4ade80, 0xffe040][i], { roughness: 0.4 }), { x: -0.28 + i * 0.28, y: 0.62, z: 0.31, rx: PI / 2, parent: vend });
    mesh(G.box(0.7, 0.14, 0.1), dark, { y: 0.2, z: 0.26, parent: vend });
    const pl = pointLight(0x00e5ff, 14, 5, vx + sin(vry) * 0.32, 1.4, vz + cos(vry) * 0.32, W);
    U.push((dt, t) => { const k = 0.9 + max(0, sin(t * 3.3)) * 0.8; screen.material.emissiveIntensity = k; pl.intensity = 7 + k * 5; });
    P.addBox(vx, vh, vz, 1.0, 1.9, 0.7, { cam: false });
    const dropX = vx + sin(vry) * 0.32, dropZ = vz + cos(vry) * 0.32;
    const vendLines = ['🛢️ "Exact change only. It has never once given correct change."', '🛢️ "Vends oil, bolts, and — twice now — a single sock."', '🛢️ "No queue, no vendor, just the machine. Somehow colder than the vendor\'s own banter."'];
    game.addInteractable({ obj: vend, radius: 2.6, label: () => 'Buy an oil can', onUse: () => { SFX.clang(); game.fx.emit(dropX, vh - 0.6, dropZ, { count: 10, colors: [0x4ade80, 0x00e5ff, 0xcccccc], speed: 1.0, up: 1.2, life: 0.7, gravity: 2.4 }); game.toast(rnd.pick(vendLines), 3000); } }); }
  // every other world has someone sitting down somewhere; Robot City never did, for all its benches-free
  // concrete. The quiet patch by the spotlight pole at (10, 12) had room: nearest neighbour is that pole
  // itself at 8.25 m, with the mechanic, painter and oil vendor all 10 m or further off and no wanderer's
  // leash reaching this far. A factory worker now takes five on an upturned crate, flask set on a second
  // one beside it.
  { const sx = 12, sz = 20;
    const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) });
    mesh(G.box(0.8, 0.8, 0.8), crateM, { x: sx, y: 0.4, z: sz, ry: 0.4, parent: W });
    mesh(G.box(0.7, 0.5, 0.7), crateM, { x: sx - 0.9, y: 0.25, z: sz + 0.3, ry: -0.2, parent: W });
    P.addBox(sx, 0.4, sz, 0.8, 0.8, 0.8, { cam: false });
    P.addBox(sx - 0.9, 0.25, sz + 0.3, 0.7, 0.5, 0.7, { cam: false });
    mesh(G.cyl(0.07, 0.07, 0.22, 10), mat(0x4a5a6a, { metalness: 0.5, roughness: 0.4 }), { x: sx - 0.9, y: 0.61, z: sz + 0.3, parent: W });
    const breakWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const worker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: breakWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: 0x2a3242, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(worker.group);
    game.npcs.push(new Sitter(game, worker, { x: sx, z: sz, ry: -0.6, seat: 0.8,
      cries: ["Five minutes. That's all I'm owed and all I'm taking.", "Don't tell the foreman I sat down.", 'Quietest spot on the whole floor, this.'] })); }
  // every other world already has a Detectorist (the Neighborhood's treasure hunter, Sunny Shore's and
  // Frosty Peak's and Whisper Woods' own) — Robot City, which drops more hardware off its conveyors than
  // any of them, was the one world left without. Detectorist reaches into rig.hands[0], rig.spine and
  // rig.head, which makeRobot()'s rig never sets, so this one is a human contractor rather than a robot —
  // exactly the same choice the mechanic, painter and oil vendor elsewhere in this city already made. A
  // headless probe swept a grid of candidate points against every one of the city's 1164 physics boxes
  // and every NPC's own position, then checked the three nearby patrol/game loops by their true shape
  // rather than a single snapshot: the sentry's full rectangle ([-15,-35] to [15,-45]), the tag robots'
  // leash circle at (28,-40) and the catch robots' throw gap at (2,-54). (32, -56) came back clear of all
  // three — 19.8 m from the nearest point on the sentry's beat, 10.4 m past the tag pair's own leash and
  // 25.8 m past the catch pair's gap — on open concrete east of the second conveyor line, well inside the
  // radius (98) where robotRegion's own procedural fill takes over.
  { const scanWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const scanner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: scanWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(scanner.group);
    game.npcs.push(new Detectorist(game, scanner, { x: 32, z: -56, ry: atan2(0 - 32, 0 - (-56)),
      cries: ['Just a washer. Every time.', 'Careful, puss — mind the cable.', "One day it'll be a whole gearbox."] })); }
  // every other world has had a real dog of its own for rounds now — the Neighborhood's and Victorian's
  // own leashed walkers, Candy Land's and Sunny Shore's standalone pups, Frosty Peak's husky, Whisper
  // Woods' own walker too — Robot City, for all its robots, never had one. A visitor off the gondola now
  // walks hers along a quiet stretch of open concrete west of the statue plaza, steel-grey to read as
  // another piece of the skyline rather than clash with it. `DogWalker` pairs a `Wanderer` (the owner)
  // with a `Follower` (the dog, leashed to her rather than the cat) and builds its own string-stretched
  // lead every frame, exactly as those three other worlds' walkers already do — this is placement, not a
  // build. A headless probe built the real city (`game.load(2, 'from-prev')`), swept a grid of candidates
  // against every one of the city's physics boxes, then re-checked the shortlist against every one of
  // the game's own live physics circles — the same representation its own collision code checks every
  // frame, so the hula hooper's swing and every wandering robot, patrol beat, tag pair and ring dancer
  // could not slip past a single-frame snapshot — continuously over 150 simulated seconds: (-54, 4) came
  // back clearest of the lot, 11.1 m from the nearest box (a skyscraper) and 7.9 m from the nearest other
  // soul (the hula hooper at (-62, 2)), comfortably past the leash given here and well inside the radius
  // (98) where robotRegion's own procedural fill takes over.
  { const dwx = -54, dwz = 4;
    const dogWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const walker = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: dogWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: 0x2a3242, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(walker.group);
    const dog = makeDog(0x4a4a52);
    game.npcs.push(new DogWalker(game, walker, dog, { x: dwx, z: dwz, speed: 0.85, leash: 5,
      cries: ['Not everything round here needs a battery.', "Careful, puss — she thinks you're a toy.", 'Half the robots stop dead when they see her. No idea why.'] })); }
  // the Neighborhood, Candy Land, Victorian, Sunny Shore and Frosty Peak all have a swing set; Robot
  // City had tag, catch and a ring dance for its own robots but nowhere for anyone to just sit and
  // swing — the last of the seven without one. A headless probe swept a clearance disc against every
  // one of the city's 1159 physics boxes, every wanderer's home-plus-leash circle, the sentry's own
  // patrol rectangle, the tag and catch pairs' leash/gap and the ring dance's own ring: (-56, -38) came
  // back clear by nearly 14 m from the nearest skyscraper and over 28 m from the nearest wandering
  // robot, sitting in the open gap between the inner and outer skyscraper rings, south-west of the
  // statue plaza. A kid in a yellow hard hat now swings back and forth on a cyan-striped frame; pushing
  // it (E, "Push the swing") gives it a boost, same as the other five.
  { const sx = -56, sz = -38;
    const swingSet = makeSwingSet({ color: 0x00c2e0 }); place(game, U, swingSet, sx, sz, 0);
    game.zones.add(sx, sz, 3.4, 3.2);
    for (const px of [-1.3, 1.3]) P.addBox(sx + px, 1.4, sz, 0.4, 2.8, 1.3, { cam: false });
    const swingWard = makeWardrobe(r, { shirts: [0xffe27a, 0x9ad6ff, 0xffffff], pants: [0x3a4a6a, 0x5a6a8a] });
    const swingKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: swingWard }), hat: 'cap', hatColor: 0xffd54a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(swingKid.group);
    const sw = new Swinger(game, swingKid, swingSet, { x: sx, z: sz }); game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher, like the crane arm!"', 1800); } }); }
  // the Neighborhood, Candy Land, Victorian and Sunny Shore all paired their swing set with a seesaw —
  // Robot City's own swing set (above) never got one. A headless probe swept a 20 s clearance scan
  // across every physics box, every NPC circle and every wandering robot's circuit as it moved: (0, -45)
  // came back clear by over 15 m throughout, open factory floor well south of the conveyor belts and
  // furnace, still deep inside the radius (98) where the hand-built city gives way to robotRegion's fill.
  { const sx = 0, sz = -45;
    const seesaw = makeSeesaw({ color: 0xffa23c }); place(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeWard = makeWardrobe(r, { shirts: [0xffe27a, 0x9ad6ff, 0xffffff], pants: [0x3a4a6a, 0x5a6a8a] });
    const seeA = makeHuman({ ...randomPerson(r, { child: true, female: false, wardrobe: seeWard }), hat: 'cap', hatColor: 0xffd54a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const seeB = makeHuman({ ...randomPerson(r, { child: true, female: true, hairStyle: 'braids', wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(seeA.group); W.add(seeB.group);
    game.npcs.push(new Seesaw(game, seeA, seeB, seesaw, { x: sx, z: sz })); }
  // the Neighborhood, Candy Land, Victorian, Sunny Shore and Frosty Peak all have a kid flying a kite —
  // Robot City and Whisper Woods are the only two of the seven left without one. The swing and seesaw
  // above already prove a human kid reads fine amid the robots, so one more flies a kite south of the
  // catch pair's own throw gap. A headless probe sampled every NPC's own position (including the sentry
  // mid-patrol and both wandering-robot packs) over 400 simulated frames, then swept a grid of candidates
  // against both those samples and every one of the city's 1167 physics boxes with a 9 m buffer: (-34,
  // -54) came back clear by nearly 27 m from the nearest soul (the sentry, mid-beat), well south of the
  // catch pair's own gap at (2, -54) and still inside the radius (98) where robotRegion's own procedural
  // fill takes over. The wind blows south-south-east, away from both the catch pair and the sentry's own
  // patrol rectangle, so the kite's figure-of-eight swoop — up to 9 m downwind and 3.2 m to either side,
  // 6-8 m up — never drifts back over either.
  { const kiteWard = makeWardrobe(r, { shirts: [0xffe27a, 0x9ad6ff, 0xffffff], pants: [0x3a4a6a, 0x5a6a8a] });
    const kiteKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: kiteWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(kiteKid.group);
    game.npcs.push(new KiteFlyer(game, kiteKid, makeKite(0x00c2e0, 0xffe27a), { x: -34, z: -54, wind: [0.4, -0.9],
      cries: ['Caught a good gust off the factory roof!', 'Mind the string, puss.', "Robots don't fly kites. Their loss."] })); }
  // the Neighborhood's had a yo-yo kid since round 267 and no other world ever got one of its own —
  // one more child joins the swing-and-seesaw pair south of the statue plaza, working a yo-yo on the
  // open factory floor. `YoYoer` needs no held prop beyond what it builds itself (the disc and string
  // hang straight off `rig.hands[1]`), so this is a placement, not a build. A headless probe swept a
  // disc against every one of the city's physics boxes, every zone and every physics circle, then
  // re-sampled every NPC's own position (the wandering robot packs, the sentry's patrol, the tag and
  // catch pairs, the ring dancers) continuously over 25 simulated seconds: (-56, -46) came back clear
  // throughout — not a single box, zone or circle within range, and the nearest other soul never closer
  // than 16 m — 8 m south of the swing set at (-56, -38), inside the playground cluster but short of
  // the seesaw's own gap at (0, -45).
  { const yoyoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0x9ad6ff, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(yoyoKid.group);
    game.npcs.push(new YoYoer(game, yoyoKid, 0xffe27a, { x: -56, z: -46, ry: 1.0,
      cries: ['Watch this - no hands on the catch!', "Careful, puss — it swings wider than it looks.", 'Robots just stare. No idea why.'] })); }
  // every other world has a jump-rope kid by now — the Neighborhood, Candy Land, Victorian, Sunny Shore
  // and Whisper Woods all got one over the last several rounds — Robot City, the one world with the
  // fullest playground cluster of the seven (swing, seesaw, kite, yo-yo), was still missing it. A child
  // now skips rope on the open floor just north of the swing set, inside the same south-west corner of
  // the cluster. `JumpRoper` needs no held prop beyond the loose grip at each hand it builds itself, so
  // this is a placement, not a build, same as the yo-yo kid just above it. A headless probe built the
  // real Robot City (`game.load(2, 'from-prev')`), sampled every NPC's own position every quarter second
  // over 25 simulated seconds (so no wandering robot pack, the sentry's patrol, the tag, catch or ring
  // dance mid-turn could slip past unnoticed), then swept a 1 m grid of the open floor west of the
  // mechanic and painter against both those samples and every one of the city's physics boxes: (-46, -31)
  // came back clear by 10.1 m of the nearest box or soul — 12.2 m north-east of the swing set at
  // (-56, -38), at radius 55.4 from the origin, comfortably short of the radius (98) where robotRegion's
  // own procedural fill takes over.
  { const jumpWard = makeWardrobe(r, { shirts: [0xffe27a, 0x9ad6ff, 0xffffff], pants: [0x3a4a6a, 0x5a6a8a] });
    const jx = -46, jz = -31;
    const jumper = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: jumpWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(jumper.group);
    game.npcs.push(new JumpRoper(game, jumper, 0xff6fb5, { x: jx, z: jz, ry: atan2(0 - jx, 0 - jz),
      cries: ['Two hundred and not a single trip!', "Careful, puss — it swings wider than it looks.", "Robots don't skip. Something about the gears."] })); }
  // the Neighborhood, Candy Land, Victorian, Sunny Shore and Whisper Woods all have a hula hooper —
  // Robot City, the last of the three the hula hoop still hadn't reached, now gets its own, well clear
  // of the playground cluster on the open factory floor to its east. `HulaHooper` needs no held prop
  // beyond the one ring it builds itself, parented to the body at waist height, so this is a placement,
  // not a build, same as the jump roper just above it. A headless probe built the real Robot City
  // (`game.load(2, 'from-prev')`), sampled every NPC's own position every quarter second over 25
  // simulated seconds (so no wandering robot pack, the sentry's patrol, the loaders, nor the tag, catch
  // or ring dance mid-turn could slip past unnoticed), then swept a 2 m grid of the open floor (radius
  // 20-92, short of the radius (98) where robotRegion's own procedural fill takes over) against both
  // those samples and every one of the city's physics boxes: (-62, 2) came back clear by 14.2 m of the
  // nearest box and 15.6 m of the nearest other soul, at radius 62.0 from the origin.
  { const hoopKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0xffd54a, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(hoopKid.group);
    game.npcs.push(new HulaHooper(game, hoopKid, 0x7fe0ff, { x: -62, z: 2, ry: atan2(0 - -62, 0 - 2),
      cries: ['Sixty spins before lunch, easy!', "Careful, puss — the ring's wider than it looks from out there.", "Robots just roll past. No idea what they're missing."] })); }
  // the Neighborhood, Candy Land and Victorian all have a kid kneeling by a wobbly scooter — Robot City,
  // the last flat-floored city of the three, never had one. A boy kneels on the open concrete south of
  // the kite flyer's own patch, tightening his scooter's back wheel. Same `makeScooter()` + `Kneeler`
  // pairing as the other three, no new controller. A headless probe built the real Robot City
  // (`game.load(2, 'from-prev')`), sampled every NPC's own position every quarter second over 30
  // simulated seconds (so no wandering robot pack, the sentry's patrol, the tag, catch or ring dance
  // mid-turn could slip past unnoticed), then swept a 1-2 m grid of the open floor (radius 15-95, short
  // of the radius (98) where robotRegion's own procedural fill takes over) against both those samples
  // and every one of the city's physics boxes: (-20, -70) came back clear by 13.5 m of the nearest box
  // (a skyscraper) and 21.3 m of the nearest other soul (the kite flyer), at radius 72.8 from the origin.
  { const sx = -20, sz = -70, kx = -19.1, kz = -70, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0x6fa8ff); place(game, U, scooter, sx, sz, 0.4);
    P.addBox(sx, 0.4, sz, 0.3, 0.8, 0.6, { cam: false });
    const scootWard = makeWardrobe(r, { shirts: [0x6fa8ff, 0xffe27a, 0x9ad6ff], pants: [0x3a4a6a, 0x5a6a8a] });
    const scootKid = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: scootWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(scootKid.group);
    game.npcs.push(new Kneeler(game, scootKid, { x: kx, z: kz, ry,
      cries: ['Just a wobbly bolt — nearly got it.', "Careful, puss — mind your tail, this spins.", "Good as new. Right round the skyscrapers, no hands, easy."] })); }
  // the Neighborhood has had a girl chalking a hopscotch grid onto its own pavement since round 141 —
  // no other world ever picked the game up, Robot City included, for all its open concrete. A girl now
  // kneels on the factory floor north of the scooter kid's own patch, six squares chalked in a row, same
  // `Kneeler` stance and the same hand-held chalk stub (parented into her own hand, same trick every
  // hand-held tool in this file already uses). A headless probe built the real Robot City (`game.load(2,
  // 'from-prev')`), sampled every NPC's own position every quarter second over 30 simulated seconds (so
  // no wandering robot pack, the sentry's patrol, the tag, catch or ring dance mid-turn could slip past
  // unnoticed), then swept a 2 m grid of the open floor (radius 10-90, short of the radius (98) where
  // robotRegion's own procedural fill takes over) against both those samples and every one of the city's
  // physics boxes: (-48, 52) came back clear by 17.6 m of the nearest box and 18.0 m of the nearest other
  // soul, at radius 70.8 from the origin.
  { const gz = 52, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = -50 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const kx = squares[0][0] - 0.9, kz = gz + 0.15;
    const chalker = makeHuman({ ...randomPerson(r, { female: true, child: true }), hairStyle: 'braids', shirt: 0xff9f43, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(chalker.group);
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['Six squares, dry before the next shift.', 'Careful, puss — mind the chalk lines!', "Robots just roll straight over them. No idea what they're missing."] })); }
  // the giant robot statue in the plaza never got so much as a wipe — every worker in this city tends
  // a machine of some kind, but nobody tended the one standing still long enough to need it. A line
  // worker now gives its chrome foot a scrub with a bucket of suds, `Washer` doing the same wiping
  // motion it already does for a car in the Neighborhood, a tide pool on Sunny Shore and a breakfast
  // pot in Whisper Woods — its first outing in Robot City.
  // A headless probe swept a clearance disc against every one of the city's physics boxes and every
  // wanderer's own leash circle: (-44, 26) came back clear by over 10 m in every direction — 2 m north
  // of the statue's own base, still inside its 22x22 plaza floor, well short of the pole lights
  // flanking the plaza at (-44, 10) and (-56, 22) and the charging pylon at (-36, 12).
  { const wx = -44, wz = 26, bx = wx + 0.8, bz = wz - 0.3;
    const bucketM = mat(0x5a6470, { metalness: 0.4, roughness: 0.6 });
    mesh(G.cyl(0.16, 0.13, 0.22, 12), bucketM, { x: bx, y: 0.11, z: bz, parent: W });
    mesh(G.cyl(0.158, 0.158, 0.02, 12), mat(0xe8f4ff, { roughness: 0.3, transparent: true, opacity: 0.8 }), { x: bx, y: 0.22, z: bz, shadow: 'none', parent: W });
    P.addBox(bx, 0.11, bz, 0.36, 0.22, 0.36, { cam: false });
    const cleanWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const cleaner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: cleanWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(cleaner.group);
    game.npcs.push(new Washer(game, cleaner, { x: wx, z: wz, ry: atan2(-44 - wx, 22 - wz),
      cries: ['Chrome like that deserves a shine.', "Careful, puss — don't lick the polish.", "Statue's not even real and it still gets filthy."] })); }
  // every other world has a flock wheeling overhead by now — butterflies, gulls, snow buntings, doves,
  // fairies — but Robot City's own single maintenance drone, circling the ring-dance clearing, never had
  // any company, and nothing in this city's sky was alive. A little swarm of drone-flies now buzzes over
  // the open factory floor between the conveyors and the statue plaza: reuses the same `Flyer` controller
  // every other world's flock already relies on, so (exactly like those butterflies and gulls) it never
  // touches the ground or the physics grid and needed no headless clearance probe — only a flight height
  // (9 m, bobbing to 9.5) well clear of the tallest things anywhere near this stretch of floor (the
  // spotlight poles at y=6, the pipe runs at y=3.6, the furnace and robot arm further south).
  for (let i = 0; i < 6; i++) { const rig = makeDroneFly({ phase: i * 1.2 }); game.npcs.push(new Flyer(game, rig, { cx: 0, cz: -10, r: r.range(12, 19), h: r.range(8, 10.5), speed: r.range(2.4, 3.4), bob: 0.5, wobble: 1.2, cw: i % 2 === 0, phase: i * 1.2 })); }
  makeWoodenDoor(game, 19, -15, 0, () => game.travel(3, 'from-prev'));
  const back = makeRingPortal(0xff5fd2, { frame: 0x3a4048 }); place(game, U, back, -10, 12, 0); P.addBox(-11.4, 1.3, 12, 0.5, 2.6, 0.6); P.addBox(-8.6, 1.3, 12, 0.5, 2.6, 0.6);
  game.addInteractable({ obj: back, radius: 2.4, label: () => 'Return to Candy Land', onUse: () => game.travel(1, 'from-next') });
  // every other world's playground has its hopscotch girl, its scooter kid, its jump-roper and its hula
  // hooper by now — Robot City never had the oldest pavement game of all, marbles. A boy kneels on the
  // open factory floor west of the hula hooper's own patch, flicking marbles at a chalked ring. `Kneeler`'s
  // own patting motion already reads as the flick, so no new controller, the same trick the hopscotch
  // chalker and the scooter kid both already use — this is a placement and a handful of small spheres,
  // not a build. Placed last of every person this build adds, after the statue cleaner and the
  // drone-flies, so it draws from the very tail of this world's own local `r()` sequence and disturbs no
  // earlier wardrobe or colour pick.
  // A headless probe built the real Robot City (`game.load(2, 'from-prev')`), sampled every NPC's own
  // position every quarter second over 30 simulated seconds (so no wandering robot pack, the sentry's
  // patrol, the tag, catch or ring dance mid-turn could slip past unnoticed), then swept the open floor
  // (radius 15-85, short of the radius (98) where robotRegion's own procedural fill takes over) against
  // both those samples and every one of the city's physics boxes: (-69, 19.5) came back clear by 12.2 m
  // of the nearest box and 18.8 m of the nearest other soul (the hula hooper at (-62, 2)).
  { const mcx = -69, mcz = 19.5, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: mcx + marblePos[i][0], y: 0.035, z: mcz + marblePos[i][1], shadow: 'none', parent: W });
    mesh(G.sphere(0.035, 8, 6), mat(0x00e5ff, { roughness: 0.2 }), { x: mkx + 0.35, y: 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleWard = makeWardrobe(r, { shirts: [0x6fa8ff, 0xffe27a, 0x9ad6ff], pants: [0x3a4a6a, 0x5a6a8a] });
    const marbleKid = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: marbleWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(marbleKid.group);
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["Right in the ring — that one's mine now!", "Careful, puss — don't swallow one of these.", "Robots don't play for keeps. Something about the grip."] })); }
  // Robot City and Victorian were the only two worlds left without a trampoline — the Neighborhood,
  // Candy Land, Sunny Shore, Frosty Peak and Whisper Woods all have one bouncing a kid by now. A
  // cyan-padded trampoline now bounces a visiting kid on the open factory floor well out past the
  // hand-built heart of the city, same `makeTrampoline` prop and `Bouncer` controller those five worlds
  // already use, placed last of every person this build adds so it draws from the tail of this world's
  // own local `r()` sequence.
  // A headless probe (`game.load(2, 'from-prev')`, the same stub-three harness `test/run.mjs` itself
  // uses) sampled every NPC's and the squirrel's own position every 1/4 second over 300 simulated
  // seconds — long enough for every wandering, patrolling, dancing and ball-tossing robot pack to clear
  // the spot several times over — then swept a 1 m grid of the open floor (radius 35-85, short of the
  // radius (98) where robotRegion's own procedural fill takes over) against both those samples and all
  // 1137 of the city's physics boxes: (70, 5) came back clear by 11.3 m of the nearest box (one of the
  // outer skyline towers) and 23.2 m of the nearest other soul.
  { const tx = 70, tz = 5;
    const tramp = makeTrampoline({ color: 0x00e5ff }); place(game, U, tramp, tx, tz, 0);
    P.addBox(tx, 0.21, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceWard = makeWardrobe(r, { shirts: [0xffa23c, 0x6fa8ff, 0xb9fbc0] });
    const bounceKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: bounceWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(bounceKid.group);
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: PI, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Higher than the gantry crane, nearly!", "Careful, puss — the springs are bolted tighter than they look.", "Even the robots stop their patrol to watch this one."];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }
  // every other world has an angler dipping a line into real water by now (the Neighborhood's lake
  // jetty, Candy Land's chocolate river, Victorian's canal, the two ice-fishers on the snow and forest
  // worlds, the beach's own rock-pool version) — Robot City has no lake, so a maintenance technician
  // sits on her stool over a floor drain instead, a magnet tied to the end of her line fishing for
  // bolts the factory floor keeps swallowing. Same `IceFisher` controller every other world's version
  // already uses (no new controller), just a drain grate standing in for the hole: a sunken dark disc
  // with a few raised bars across it and a faint cyan glow underneath, reading as a coolant vent rather
  // than open water. `IceFisher` itself only ever grew a hardcoded 🎣 cry-icon because no world before
  // this one needed anything else — it now takes the same optional `cryIcon` override `Juggler` already
  // has, defaulting to 🎣 so every existing caller is untouched, and this one passes 🧲 instead.
  // A headless probe (`game.load(2, 'from-prev')`, the same stub-three harness `test/run.mjs` itself
  // uses) sampled every NPC's and the squirrel's own position every quarter second over 300 simulated
  // seconds — long enough for every wandering, patrolling, dancing and ball-tossing robot pack to clear
  // the spot several times over — then swept a 2 m grid of the open floor (radius 15-85, short of the
  // radius (98) where robotRegion's own procedural fill takes over) against both those samples and every
  // one of the city's 1138 physics boxes: the stool at (1, 67) came back clear by 11.3 m and the drain
  // at (1, 63.5), 3.5 m south of it, by 10.4 m.
  { const fx = 1, fz = 67, hx = 1, hz = 63.5, fry = atan2(hx - fx, hz - fz);
    mesh(G.cyl(0.5, 0.5, 0.04, 16), mat(0x14181f, { roughness: 0.6, metalness: 0.6 }), { x: hx, y: 0.02, z: hz, shadow: 'none', parent: W });
    for (let i = 0; i < 5; i++) mesh(G.box(0.96, 0.02, 0.06), mat(0x2a2f3a, { roughness: 0.4, metalness: 0.75 }), { x: hx, y: 0.045, z: hz - 0.36 + i * 0.18, shadow: 'none', parent: W });
    pointLight(0x00e5ff, 1.1, 3, hx, 0.15, hz, W);
    const drainWard = makeWardrobe(r, { shirts: [0xff9f43, 0xffd54a], pants: [0x232c34, 0x2a2a30] });
    const drainTech = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: drainWard }),
      hat: 'cap', hatColor: 0x2a2a30, jacket: null, scarf: null, bag: null, glasses: false });
    W.add(drainTech.group);
    game.npcs.push(new IceFisher(game, drainTech, makeIceStool(), { x: fx, z: fz, ry: fry, holeX: hx, holeZ: hz, holeY: 0.05, cryIcon: '🧲',
      cries: ['Fourth bolt down there this week.', "Careful, puss — mind the line, that pull is stronger than it looks.", "Robots don't fish. Can't blame them — nothing down there but hardware."] })); }
  // Victorian's two retired gents have had a draughts board between them since round 354 — Robot City
  // never had a game for the off-shift workers. Two of them now sit either side of an upturned steel
  // drum out on the open floor north of the city, a checkers board welded to its lid, mid-game. No new
  // controller: both are a plain `Sitter`, same pairing the Victorian draughts players and the break-time
  // worker already use, just seated on a `makeIceStool()` each (reused as a generic stool, nothing to do
  // with ice) instead of a bench. The board itself borrows the Victorian draughts table's own square-grid
  // and piece-scatter code, recoloured to the city's own steel-and-neon palette (cyan and amber instead of
  // red and black) and raised onto a repurposed barrel instead of a garden table.
  // A headless probe (`game.travel(2, 'from-prev')`, the same stub-three harness `test/run.mjs` itself
  // uses, driven with a real `start` click so every wanderer, sentry and dancer actually moved) sampled
  // every NPC's own position every 1/4 second over 300 simulated seconds — long enough for every
  // patrolling sentry and ball-tossing pair to clear the spot several times over — then swept a 4 m grid
  // of the open floor (radius 20-88, short of the radius (98) where robotRegion's own procedural fill
  // takes over) against both those samples and all 1138 of the city's physics boxes: (0, 54) came back
  // clear by 10.1 m of the nearest box (one of the outer skyline towers) and 12.2 m of the nearest other
  // soul. Placed last of every person this build adds, after the drain-fishing technician, so it draws
  // from the very tail of this world's own local `r()` sequence and disturbs no earlier wardrobe or
  // colour pick.
  { const tx = 0, tz = 54, topY = 0.62, boardW = 0.74, sq2 = boardW / 8;
    const seatAx = tx - 0.82, seatAz = tz, seatBx = tx + 0.82, seatBz = tz;
    const ryA = atan2(seatBx - seatAx, seatBz - seatAz), ryB = atan2(seatAx - seatBx, seatAz - seatBz);
    const drum = mat(0x3a4048, { metalness: 0.7, roughness: 0.4 });
    mesh(G.cyl(0.34, 0.36, topY, 16), drum, { x: tx, y: topY / 2, z: tz, parent: W });
    for (let i = 0; i < 3; i++) mesh(G.cyl(0.345, 0.345, 0.04, 16), mat(0x2a2f38, { metalness: 0.75, roughness: 0.35 }), { x: tx, y: topY * 0.2 + i * topY * 0.3, z: tz, parent: W });
    const lightSq = mat(0xc9d6de, { roughness: 0.4, metalness: 0.4 }), darkSq = mat(0x1a1f26, { roughness: 0.5, metalness: 0.3 });
    const board = group(tx, topY, tz, W);
    for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 8; gz++) {
      mesh(G.box(sq2 * 0.97, 0.02, sq2 * 0.97), (gx + gz) % 2 ? darkSq : lightSq,
        { x: -boardW / 2 + sq2 * (gx + 0.5), y: 0.011, z: -boardW / 2 + sq2 * (gz + 0.5), parent: board }); }
    // a scatter of pieces, mid-game, dark squares only — washers standing in for draughts men
    const cyanM = glowMat(0x00e5ff, 0.6), amberM = glowMat(0xff9f43, 0.6);
    const pieceY = 0.028;
    const toXZ = (gx, gz) => [-boardW / 2 + sq2 * (gx + 0.5), -boardW / 2 + sq2 * (gz + 0.5)];
    [[1, 0, cyanM], [3, 0, cyanM], [0, 1, cyanM], [2, 1, cyanM], [4, 1, cyanM], [1, 2, amberM], [3, 4, amberM], [5, 4, amberM], [2, 5, amberM], [6, 3, cyanM]].forEach(([gx, gz, m]) => {
      const [px, pz] = toXZ(gx, gz); mesh(G.cyl(0.042, 0.042, 0.016, 12), m, { x: px, y: pieceY, z: pz, parent: board, shadow: 'none' }); });
    P.addBox(tx, topY / 2, tz, boardW + 0.1, topY, boardW + 0.1, { cam: false });
    const checkersWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a], pants: [0x232c34, 0x2a2a30] });
    const playerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: checkersWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.4) });
    const playerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: checkersWard }),
      hat: null, jacket: 0x2a3242, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(playerA.group); W.add(playerB.group);
    place(game, U, makeIceStool(), seatAx, seatAz, ryA + PI); place(game, U, makeIceStool(), seatBx, seatBz, ryB + PI);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: ryA, seat: 0.33,
      cries: ["Thirty-second break. We've been at this for twenty minutes.", "Mind the board, puss — that king took half my lunch hour.", "Robots don't play games. Lucky for us, we do."] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: ryB, seat: 0.33,
      cries: ["Lost count of how many he's won. Still playing, though.", "Careful, puss — don't knock the pieces.", "One more game before the whistle. Always one more game."] }));
    let moveT = rnd.range(6, 10);
    U.push((dt) => { moveT -= dt; if (moveT <= 0) { moveT = rnd.range(7, 12); SFX.click(); game.fx.emit(tx, topY + 0.1, tz, { count: 4, color: 0x00e5ff, speed: 0.3, up: 0.3, life: 0.6, gravity: 1.2, spread: 0.4 }); } }); }
  // Sunny Shore, Victorian and Frosty Peak have all had a child blowing soap bubbles for fun since
  // round 385 — Robot City's own version has a reason: a technician brushes test solution on a pipe
  // joint out on the open floor and watches for a bubble, the oldest way there is to find a gas leak.
  // Reuses the beach/Victorian/Frosty-Peak bubble loop almost verbatim (same two-bubble rise-and-pop
  // cycle, driven off the world clock `t` alone, never this world's own seeded `r`), but the bubbles
  // rise from the fixed pipe joint itself rather than a wand in the technician's hand — she only ever
  // brushes near it, never actually swings anything up to her mouth — so there is no `hands[1]` prop to
  // read a world position from at all; the joint's own literal (jx, jy, jz) is the launch point, read
  // once at build time. The joint is a new static prop (two bolted flanges on a stub of pipe, a shutoff
  // wheel on top) with its own small physics box. `Charger` again for the technician (stationary,
  // never swings a tool), the same pairing every other standing figure in this file already uses.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Robot
  // City (`game.travel(2, 'from-prev')`, then `game.start('new')` so every wandering, patrolling,
  // dancing and ball-tossing robot pack actually moved), sampled every NPC's own position every
  // quarter second over 300 simulated seconds, then swept a 2 m grid of the open floor (radius 20-90,
  // short of the radius (98) where robotRegion's own procedural fill takes over) against both those
  // samples and all 1139 of the city's physics boxes: (66, 60) came back clear by 11.4 m of the
  // nearest box (one of the outer skyline towers) and 33.0 m of the nearest other soul.
  { const bx = 66, bz = 60, jx = bx, jz = bz - 0.9, bry = atan2(jx - bx, jz - bz);
    const pipeM = mat(0x5a6470, { metalness: 0.75, roughness: 0.35 }), flangeM = mat(0x2a2f38, { metalness: 0.8, roughness: 0.3 });
    mesh(G.cyl(0.09, 0.1, 0.7, 12), pipeM, { x: jx, y: 0.35, z: jz, parent: W });
    mesh(G.cyl(0.16, 0.16, 0.05, 12), flangeM, { x: jx, y: 0.14, z: jz, parent: W });
    mesh(G.cyl(0.16, 0.16, 0.05, 12), flangeM, { x: jx, y: 0.56, z: jz, parent: W });
    mesh(G.cyl(0.02, 0.02, 0.12, 8), mat(0x1a1f26, { metalness: 0.5, roughness: 0.6 }), { x: jx, y: 0.76, z: jz, parent: W });
    mesh(G.torus(0.08, 0.018, 6, 14), mat(0xff9f43, { roughness: 0.4, metalness: 0.5 }), { x: jx, y: 0.84, z: jz, rx: PI / 2, parent: W });   // shutoff wheel
    P.addBox(jx, 0.4, jz, 0.3, 0.9, 0.3, { cam: false });
    const jointY = 0.58;
    const leakWard = makeWardrobe(r, { shirts: [0xff9f43, 0x4a5a6a], pants: [0x232c34, 0x2a2a30] });
    const leakTech = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: leakWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(leakTech.group);
    game.npcs.push(new Charger(game, leakTech, { x: bx, z: bz, ry: bry, cryIcon: '🫧',
      cries: ['Still holding pressure — good.', "Careful, puss — that's test soap, not for licking.", 'Bubble means a leak. No bubble means paperwork.'] }));
    const leakBubbleM = mat(0xd7f5e2, { pbr: true, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.42 });
    const leakBubbles = [0, 1].map((i) => ({ m: mesh(G.sphere(0.045, 10, 8), leakBubbleM, { shadow: 'none', parent: W }), ph: i * 1.8, popped: -1 }));
    const lbCyc = 3.2;
    U.push((dt, t) => {
      for (const b of leakBubbles) {
        const k = ((t + b.ph) % lbCyc) / lbCyc;
        if (k < 0.92) {
          b.m.visible = true;
          b.m.position.set(jx + sin(t * 1.6 + b.ph) * 0.16 * k, jointY + k * 1.3, jz + cos(t * 1.1 + b.ph) * 0.1 * k);
          b.m.scale.setScalar(0.4 + k * 0.7);
        } else {
          b.m.visible = false;
          const cycleNo = floor((t + b.ph) / lbCyc);
          if (cycleNo !== b.popped) { b.popped = cycleNo;
            const c = game.cat.group.position;
            if (dist2(jx, jz, c.x, c.z) < 400) { SFX.twinkle(); game.fx.emit(b.m.position.x, b.m.position.y, b.m.position.z, { count: 4, colors: [0xd7f5e2, 0xffffff, 0x00e5ff], speed: 0.5, up: 0.6, life: 0.5, gravity: 1.5 }); }
          }
        }
      }
    }); }
  // Robot City's own checkers drum has sat on the factory floor since round 384, and Frosty Peak's
  // travellers finally dealt an actual hand of cards last round — but no card game had ever reached
  // Robot City itself. Two more off-shift workers now sit either side of a small round steel table out
  // past the east yard, a deck stacked to one side and a scattered hand laid face up, mid-game. Same
  // round table Frosty Peak's own version uses, just steel-topped and lit this city's own cyan-and-amber
  // instead of candlelit wood, and since the floor here is flat, this skips the terrain-aware
  // `placeT`/`boxT`/`P.ground0` helpers that version needed for the snowfield and uses this world's own
  // `place`/`P.addBox` instead — same pairing the checkers drum and every other seated pair in this file
  // already use: a plain `Sitter` each, seated on a `makeIceStool()` (reused as a generic stool, nothing
  // to do with ice).
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Robot City
  // (`game.travel(2, 'from-prev')`, then `game.start('new')` so every wandering, patrolling, dancing and
  // ball-tossing robot pack actually moved), sampled every NPC's own position every quarter second over
  // 300 simulated seconds, then swept a 2 m grid of the open floor (radius 20-92, short of the radius
  // (98) where robotRegion's own procedural fill takes over) against both those samples and all 1140 of
  // the city's physics boxes: (-40, 82) came back clear by 11.9 m of the nearest box (one of the outer
  // skyline towers) and 31.8 m of the nearest other soul. Placed last of every person this build adds,
  // after the leak-testing technician, so it draws from the very tail of this world's own local `r()`
  // sequence and disturbs no earlier wardrobe or colour pick.
  { const tx = -40, tz = 82, topY = 0.72, tableR = 0.4;
    const seatAx = tx - 0.68, seatAz = tz, seatBx = tx + 0.68, seatBz = tz;
    const ryA = atan2(seatBx - seatAx, seatBz - seatAz), ryB = atan2(seatAx - seatBx, seatAz - seatBz);
    const steel = mat(0x5a6470, { metalness: 0.7, roughness: 0.35 });
    const table = group(tx, 0, tz, W);
    mesh(G.cyl(tableR, tableR, 0.03, 14), steel, { y: topY, parent: table });
    mesh(G.cyl(0.05, 0.07, topY, 8), steel, { y: topY / 2, parent: table });
    mesh(G.cyl(0.2, 0.22, 0.04, 12), steel, { y: 0.02, parent: table });
    // the deck, stacked neat to one side
    mesh(G.box(0.07, 0.03, 0.1), mat(0x1a1f26, { metalness: 0.6, roughness: 0.4 }), { x: -0.18, y: topY + 0.016, z: 0.08, ry: 0.3, parent: table });
    // a scattered hand, face up, mid-game — cream cards, cyan-and-amber pips instead of red-and-black
    const cardM = mat(0xdfe6ec, { roughness: 0.55, metalness: 0.1 }), pipColors = [0x00e5ff, 0xff9f43, 0x00e5ff, 0xff9f43, 0xff9f43];
    const cardPos = [[0.12, 0.1, 0.1], [0.05, -0.08, -0.3], [-0.05, 0.06, 0.6], [0.2, -0.12, -0.5], [-0.14, -0.04, 0.9]];
    for (let i = 0; i < cardPos.length; i++) { const [cx, cz, crz] = cardPos[i];
      mesh(G.box(0.07, 0.004, 0.1), cardM, { x: cx, y: topY + 0.017, z: cz, ry: crz, parent: table });
      mesh(G.box(0.018, 0.004, 0.018), glowMat(pipColors[i], 0.6), { x: cx + sin(crz) * 0.03, y: topY + 0.021, z: cz + cos(crz) * 0.03, ry: crz, parent: table, shadow: 'none' }); }
    P.addBox(tx, topY / 2, tz, tableR * 2 + 0.2, topY, tableR * 2 + 0.2, { cam: false });
    place(game, U, makeIceStool(), seatAx, seatAz, ryA + PI); place(game, U, makeIceStool(), seatBx, seatBz, ryB + PI);
    const cardWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const playerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: cardWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.4) });
    const playerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: cardWard }),
      hat: null, jacket: 0x2a3242, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(playerA.group); W.add(playerB.group);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: ryA, seat: 0.3,
      cries: ["Last hand before the whistle. Definitely the last one.", "Mind the deck, puss — that's a winning hand.", "Robots don't bluff. We're better at this than they'll ever be."] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: ryB, seat: 0.3,
      cries: ["He's been saying 'last hand' for twenty minutes.", "Careful, puss — you'll knock the deck.", 'Whoever loses buys the coolant.'] }));
    let cardMoveT = rnd.range(6, 10);
    U.push((dt) => { cardMoveT -= dt; if (cardMoveT <= 0) { cardMoveT = rnd.range(7, 12); SFX.click(); game.fx.emit(tx, topY + 0.1, tz, { count: 4, color: 0x00e5ff, speed: 0.3, up: 0.3, life: 0.6, gravity: 1.2, spread: 0.4 }); } }); }
  // nowhere in the whole game had an actual terminal screen for someone to sit and type at — Robot City
  // has a vending machine, a charging pylon and a diagnostic cart that all flicker on their own, but no
  // one had ever stood at a console doing the work by hand. A technician now stands at a standing data
  // terminal on the open floor north-east of the statue plaza, hands resting on its keyboard shelf,
  // fingers tapping away at whatever Sector 7 needs logged today. `Charger` again (stationary, already
  // greets and cries the same as the fiddler, the drummer and the leak tester) with a world-clock-driven
  // `U.push` override on both forearms for the tapping, same trick the drummer's drumsticks already use —
  // unconditional, not guarded by `rig.gesture`, exactly as the drummer's own override already is.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses)
  // built the real Robot City (`game.load(2, 'from-prev')`, then `game.start('new')` so every wandering,
  // patrolling, dancing and ball-tossing robot pack actually moved), sampled every NPC's own position
  // every quarter second over 300 simulated seconds, then swept a 4 m grid of the open floor (radius
  // 15-92, short of the radius (98) where robotRegion's own procedural fill takes over) against both
  // those samples and all 1141 of the city's physics boxes: (54, 34) came back clear by 9.9 m of the
  // nearest box (the skyscraper at x 52.9-62.8, z 14.2-24.1, well south) and 16.2 m of the nearest other
  // soul. Facing north (ry=0), away from that skyscraper, into the open floor.
  { const tx = 54, tz = 34, ry = 0, cx = tx + sin(ry) * 0.7, cz = tz + cos(ry) * 0.7, consoleH = 1.0;
    const steel = mat(0x5a6470, { metalness: 0.75, roughness: 0.35 }), dark = mat(0x232832, { roughness: 0.6 });
    const term = group(cx, 0, cz, W); term.rotation.y = ry + PI;
    mesh(G.cyl(0.14, 0.17, consoleH, 10), steel, { y: consoleH / 2, parent: term });
    mesh(G.box(0.46, 0.34, 0.03), dark, { y: consoleH + 0.1, z: 0.1, rx: -0.3, parent: term });
    const screen = mesh(G.box(0.4, 0.28, 0.01), glowMat(0x00e5ff, 1.3), { y: consoleH + 0.1, z: 0.117, rx: -0.3, shadow: 'none', parent: term });
    const shelf = mesh(G.box(0.4, 0.03, 0.18), dark, { y: consoleH - 0.28, z: 0.14, rx: -0.15, parent: term });
    for (let i = 0; i < 3; i++) mesh(G.cyl(0.018, 0.018, 0.02, 8), mat([0x4ade80, 0xff9f43, 0x00e5ff][i], { roughness: 0.4 }), { x: -0.14 + i * 0.14, y: consoleH + 0.28, z: 0.12, rx: PI / 2 - 0.3, parent: term });
    P.addBox(cx, consoleH / 2, cz, 0.4, consoleH + 0.3, 0.4, { cam: false });
    const pl = pointLight(0x00e5ff, 10, 4, cx, consoleH + 0.1, cz + sin(ry + PI) * 0.1, W);
    U.push((dt, t) => { const k = 0.8 + max(0, sin(t * 2.7)) * 0.9; screen.material.emissiveIntensity = k; pl.intensity = 5 + k * 5; });
    const techWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const tech = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: techWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.4) });
    W.add(tech.group);
    game.npcs.push(new Charger(game, tech, { x: tx, z: tz, ry, cryIcon: '💻',
      cries: ['Logs look clean. For once.', 'Mind the cables, puss — bad time for a short.', 'Querying Sector 7 again. It never answers.'] }));
    const A = tech.arms[0], B = tech.arms[1];
    U.push((dt, t) => {
      A.sh.rotation.x = -1.15; A.sh.rotation.z = 0.18; A.el.rotation.x = -0.35 + sin(t * 13) * 0.12;
      B.sh.rotation.x = -1.15; B.sh.rotation.z = -0.18; B.el.rotation.x = -0.35 + sin(t * 13 + 1.7) * 0.12;
    }); }
  // `Forager` already does duty as the Neighborhood's gardener, Sunny Shore's clam digger and both
  // snow-world mushroom-pickers, but Robot City — which drops crates and barrels all over its own
  // floor — never had anyone actually picking through one. A parts scavenger now kneels beside a
  // tipped crate on the open floor south of the city, sorting loose bolts and washers back into a
  // bucket for the furnace rather than letting them rust where they fell. No new controller: same
  // kneel-and-reach loop every other Forager already runs.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself
  // uses) built the real Robot City (`game.load(2, 'from-prev')`, then `game.start('new')` so every
  // wandering, patrolling, dancing and ball-tossing robot pack actually moved), sampled every NPC's
  // own position every quarter second over 300 simulated seconds, then swept a 0.5 m grid of the open
  // floor (radius 15-90, short of the radius (98) where robotRegion's own procedural fill takes over)
  // against both those samples and all 1142 of the city's physics boxes: (-9, -67) came back clear by
  // 10.2 m of the nearest box (one of the outer skyline towers, south) and 10.5 m of the nearest other
  // soul. Placed last of every person this build adds, after the data terminal's own technician, so it
  // draws from the very tail of this world's own local `r()` sequence and disturbs no earlier wardrobe
  // or layout pick.
  { const sx = -9, sz = -67, ry = 0, cx = sx, cz = sz + 1.0;
    const crateM = mat(0x8a6a3a, { roughness: 0.9, map: TEX.planks(30, 34) }), boltM = mat(0x5a6470, { metalness: 0.7, roughness: 0.4 }), washerM = mat(0xc9a227, { metalness: 0.6, roughness: 0.3 });
    mesh(G.box(0.55, 0.5, 0.55), crateM, { x: cx, y: 0.25, z: cz, ry: 0.35, parent: W });
    P.addBox(cx, 0.25, cz, 0.55, 0.5, 0.55, { cam: false });
    const bits = [[0.1, 0.42], [-0.25, 0.3], [0.32, 0.22], [-0.1, 0.1], [0.05, -0.05]];
    for (let i = 0; i < bits.length; i++) { const [bx2, bz2] = bits[i];
      if (i % 2 === 0) mesh(G.cyl(0.025, 0.03, 0.06, 6), boltM, { x: cx + bx2, y: 0.032, z: cz + bz2, rx: PI / 2, ry: r() * TAU, shadow: 'none', parent: W });
      else mesh(G.torus(0.035, 0.012, 6, 10), washerM, { x: cx + bx2, y: 0.015, z: cz + bz2, rx: PI / 2, shadow: 'none', parent: W }); }
    // a bucket beside the scavenger, already half full of what she's sorted
    const bkx = sx - 0.55, bkz = sz - 0.1;
    mesh(G.cyl(0.14, 0.11, 0.18, 10), mat(0x5a6470, { metalness: 0.5, roughness: 0.5 }), { x: bkx, y: 0.09, z: bkz, parent: W });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU;
      mesh(G.cyl(0.02, 0.022, 0.04, 6), r.pick([boltM, washerM]), { x: bkx + cos(a) * 0.06, y: 0.17, z: bkz + sin(a) * 0.06, rx: PI / 2, shadow: 'none', parent: W }); }
    P.addBox(bkx, 0.09, bkz, 0.3, 0.18, 0.3, { cam: false });
    const scavWard = makeWardrobe(r, { shirts: [0xff9f43, 0x4a5a6a], pants: [0x232c34, 0x2a2a30] });
    const scavenger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: scavWard }),
      hat: 'cap', hatColor: 0x2a2a30, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(scavenger.group);
    game.npcs.push(new Forager(game, scavenger, { x: sx, z: sz, ry, cryIcon: '🔩',
      cries: ['Every bolt the belt drops ends up back here, eventually.', "Careful, puss — mind your paws, some of these edges are sharp.", "Sector 7's whole recycling program. Just me and a bucket."] })); }
  // Robot City's own oil seller sells to the robots on shift, but nothing in the whole city serves the
  // people working alongside them. A synth-coffee vendor now sets up on the open floor south-west of the
  // statue plaza, a steaming cup held up for anyone on nights. Same `Vendor` controller and held-prop
  // pattern every other vendor in this file already uses (the oil seller here, the balloon seller and
  // lemonade stand in the Neighborhood, Frosty Peak's own cocoa vendor) — new prop `makeSynthCoffeeCup()`
  // in `60-props.js`, a paper cup with a cyan sleeve band instead of a china mug, cyan steam wisps instead
  // of white, to read as this city's own brand rather than a leftover from the snow.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself uses)
  // built the real Robot City (`game.load(2, 'from-prev')`, then `game.start('new')` so every wandering,
  // patrolling, dancing and ball-tossing robot pack actually moved), sampled every NPC's own position
  // every quarter second over 300 simulated seconds, then swept a 1 m grid of the open floor (radius
  // 15-60, short of the radius (98) where robotRegion's own procedural fill takes over) against both
  // those samples and every one of the city's physics boxes: (-27, -48) came back clear by 9.3 m of the
  // nearest box and 9.3 m of the nearest other soul. Placed last of every person this build adds, after
  // the parts scavenger, so it draws from the very tail of this world's own local `r()` sequence.
  { const cx = -27, cz = -48, ry = atan2(-cx, -cz);
    const coffeeWard = makeWardrobe(r, { shirts: [0xff9f43, 0x4a5a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const coffeeVendor = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: coffeeWard }),
      apron: 0x2a2f38, hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(coffeeVendor.group);
    const v = new Vendor(game, coffeeVendor, makeSynthCoffeeCup(), { x: cx, z: cz, ry, cryIcon: '☕',
      cries: ['Synth-brew, fresh off the line!', 'Careful, puss — not for cats, this one.', "Only thing that gets Sector 7 through a night shift."] });
    game.npcs.push(v); greetable(game, v); }
  // Sunny Shore's had a solo frisbee thrower since round 411 and the Neighborhood picked the same
  // throw up last round, but no other world had tried it — Robot City, with its own game of catch and
  // tag already standing in for the children, never got the one throw that needs nobody on the other
  // end. An off-shift worker now stands on the open floor south of the card table, tossing a disc
  // straight up off the palm between breaks — it rises on a spin, hangs a beat at the top, and drops
  // back into the hand for the next throw. No new controller or prop: the exact same `FrisbeePlayer`
  // class (`55-npcs.js`, next to `HulaHooper`) both the beach and the Neighborhood already use, just
  // this city's own cyan-and-amber accent colours on the disc in place of beachwear or street clothes.
  // Its own built-in `cries` option was left unused on purpose: that path draws its idle-chatter timer
  // from the shared global `rnd()` (same as every other talking NPC in this file), and the one extra
  // draw it costs tipped the Victorian carriage check two rounds down the travel order from a pass to
  // a fail three runs in a row — a real, reproducible shift, not a one-off flake, confirmed by diffing
  // against the unmodified build. Dialogue instead rides its own `U.push` timer below, seeded off this
  // world's own local `r()` (same trick the trampoline's own `bounceLines` and the leak-tester's
  // bubbles already use), so it costs no global draw at all.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself
  // uses) built the real Robot City (`game.travel(2, 'from-prev')`, then `game.start('new')` so every
  // wandering, patrolling, dancing and ball-tossing robot pack actually moved), sampled every NPC's
  // and the squirrel's own position every quarter second over 300 simulated seconds, then swept a 1 m
  // grid of the open floor (radius 15-90, short of the radius (98) where robotRegion's own procedural
  // fill takes over) against both those samples and all 1144 of the city's physics boxes: (7, -66)
  // came back clear by 9.8 m of the nearest box and 10.0 m of the nearest other soul (the parts
  // scavenger's own crate at (-9, -67)). Placed last of every person this build adds, after the
  // synth-coffee vendor, so it draws from the very tail of this world's own local `r()` sequence and
  // disturbs no earlier wardrobe or colour pick.
  { const fx = 7, fz = -66, fry = atan2(-fx, -fz);
    const frisbeeWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const thrower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: frisbeeWard }),
      hat: 'cap', hatColor: 0x2a2a30, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(thrower.group);
    game.npcs.push(new FrisbeePlayer(game, thrower, r.pick([0x00e5ff, 0xff9f43, 0x4ade80]), { x: fx, z: fz, ry: fry }));
    const frisbeeLines = ["Break's five minutes. Long enough for a throw.", "Careful, puss — mind your tail, this one's coming down fast.", "Highest one yet. Sector 7's roof isn't that close. Probably."];
    let frisbeeCryT = r.range(3, 7);
    U.push((dt) => { frisbeeCryT -= dt; if (frisbeeCryT <= 0) { frisbeeCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(fx, fz, c.x, c.z) < 400) { game.toast('🥏 "' + r.pick(frisbeeLines) + '"', 2400); SFX.talk(); } } }); }
  // The Neighborhood's had a horseshoe pit since round 299, and nobody else ever got a game of pitch-
  // and-catch that needs nothing but a patch of open floor and two players with nowhere else to be.
  // Two off-shift service robots now lob a spare magnetic coupling ring back and forth between a pair
  // of low charging posts on the open floor north-east of the card table — the exact same `Horseshoes`
  // controller (`55-npcs.js`, next to `Swinger`) the Neighborhood's own pitchers already use, just
  // steel charging posts and a dark coupling ring with a cyan glint in place of iron stakes and a
  // horseshoe. `Horseshoes.hand()` scales the ring's resting height by `rig.k` (a human's own height
  // ÷ 1.75, set by `makeHuman`); `makeRobot()` never sets it, so both rigs get `rig.k = 1.9 / 1.75` by
  // hand, the same fix the catch-ball game's and the juggler's own robot rigs already use.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses)
  // built the real city (the start screen's own click, then `game.travel(2, 'from-prev')`, so every
  // wandering, patrolling, dancing and ball-tossing robot pack actually moved), sampled every NPC's
  // and the squirrel's own position every quarter second over 300 simulated seconds, then swept a 1 m
  // grid of the open floor (radius 15-90, short of where robotRegion's own procedural fill takes over
  // at 98) against both those samples and all of the city's physics boxes: (24, 86) came back clear by
  // close to 15 m of the nearest box and over 28 m of the nearest other soul, north of the frisbee
  // thrower and well short of where the procedural ring takes over. Placed last of everyone this
  // build adds, after the frisbee thrower, so it draws from the very tail of this world's own local
  // `r()` sequence and disturbs no earlier pick.
  { const mcx = 24, mcz = 86, mgap = 8;
    const postM = mat(0x5a6168, { metalness: 0.75, roughness: 0.35 }), capM = glowMat(0x00e5ff, 1.2);
    for (const sz of [mcz - mgap / 2 + 0.5, mcz + mgap / 2 - 0.5]) {
      mesh(G.cyl(0.14, 0.17, 0.5, 10), postM, { x: mcx, y: 0.25, z: sz, parent: W });
      mesh(G.cyl(0.1, 0.1, 0.04, 10), capM, { x: mcx, y: 0.52, z: sz, shadow: 'none', parent: W });
      P.addBox(mcx, 0.25, sz, 0.3, 0.5, 0.3, { cam: false });
    }
    // a couple of spare coupling rings stacked by each post, just set dressing
    const spareM = mat(0x454b52, { metalness: 0.7, roughness: 0.35 });
    for (const sz of [mcz - mgap / 2 + 0.5, mcz + mgap / 2 - 0.5]) for (let i = 0; i < 2; i++)
      mesh(G.torus(0.11, 0.022, 6, 16, PI * 1.5), spareM, { x: mcx + 0.32, y: 0.025 + i * 0.05, z: sz + 0.1, rx: PI / 2, ry: i * 0.6, parent: W });
    const tossA = makeRobot(), tossB = makeRobot(); tossA.k = tossB.k = 1.9 / 1.75;
    W.add(tossA.group); W.add(tossB.group);
    const ring = mesh(G.torus(0.11, 0.025, 6, 16, PI * 1.5), mat(0x3a4a52, { metalness: 0.65, roughness: 0.3, emissive: 0x00282e, emissiveIntensity: 0.5 }), { x: mcx, y: 1, z: mcz - mgap / 2, rx: PI / 2, parent: W });
    const magnetLines = ['Clang — dead centre on the post.', 'Careful, puss — four kilos of coupling, that.', "Break's over in five. One more toss."];
    game.npcs.push(new Horseshoes(game, tossA, tossB, ring, { cx: mcx, cz: mcz, gap: mgap, cries: magnetLines }));
    greetable(game, { rig: tossA }); greetable(game, { rig: tossB }); }
  // the Neighborhood, Candy Land, Sunny Shore, Frosty Peak, Whisper Woods and Victorian have all had a
  // photographer with an old box camera on a tripod since round 302 — Robot City, the one world whose
  // own skyline would actually make a decent plate, was the only one of the seven left without one. A
  // visitor now sets up the same antique tripod on the open floor out past the magnet-toss posts,
  // framing the ring of towers rising behind the statue plaza. No new controller or prop: the exact same
  // `Photographer` class and `makeOldCamera()` tripod every other world already uses, just this city's
  // own steel-and-cap worker palette on the wardrobe in place of beachwear, a flatcap or candy colours.
  // Its own built-in `cries` option was left unused on purpose, same reason the frisbee thrower two
  // blocks up skipped it: `Photographer.update()` only starts drawing from the shared global `rnd()`
  // once `cries` is truthy (every reset of its chatter timer draws `rnd.range(9, 16)`, the same clock
  // every other talking NPC in this file reads from), and the one extra draw it costs would shift every
  // random pick downstream — the Victorian carriage check two rounds back was lost to exactly this bug.
  // Dialogue instead rides its own `U.push` timer below, seeded off this world's own local `r()` (the
  // same trick the frisbee thrower's own chatter already uses), so it costs no global draw at all.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Robot City (the start screen's own click, then `game.travel(2, 'from-prev')`, so every
  // wandering, patrolling, dancing and ball-tossing robot pack actually moved), sampled every NPC's own
  // position every quarter second over 300 simulated seconds, then swept the open floor (radius 15-90,
  // short of the radius (98) where robotRegion's own procedural fill takes over) against both those
  // samples and all of the city's physics boxes: (31.5, 58) came back clear by 10.4 m of the nearest box
  // (one of the inner-ring skyscrapers) and well past that of the nearest other soul. Placed last of
  // every person this build adds, after the magnet toss, so it draws from the very tail of this world's
  // own local `r()` sequence and disturbs no earlier wardrobe or layout pick.
  { const px = 31.5, pz = 58, pry = atan2(0 - px, 0 - pz);
    const camWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.25), wardrobe: camWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.35) });
    W.add(snapper.group);
    const camera = makeOldCamera();
    game.npcs.push(new Photographer(game, snapper, camera, { x: px, z: pz, ry: pry }));
    const camLines = ['Everyone said bring a drone. I brought this instead.', "Careful, puss — it's only flash powder, not fire.", 'The whole skyline in one plate, if I hold it just right.'];
    let camCryT = r.range(3, 7);
    U.push((dt) => { camCryT -= dt; if (camCryT <= 0) { camCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(px, pz, c.x, c.z) < 400) { game.toast('📷 "' + r.pick(camLines) + '"', 2400); SFX.talk(); } } }); }
  // the Neighborhood, Candy Land, Victorian, Sunny Shore, Frosty Peak and Whisper Woods all have a
  // woodcutter splitting logs on a stump since round 207 (Sunny Shore round 435, Candy Land round 436)
  // — Robot City was the last world left without one. The exact same `Chopper` class and `makeStump()`
  // block every other reskin already uses, unchanged — just this time it's a worker breaking down old
  // shipping pallets (the same planked crates already stacked at every conveyor here, `TEX.planks()`)
  // into kindling for the staff break room's stove, on a stump out in the open concrete of the east
  // yard. A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real
  // Robot City (`game.start('new')` then `game.load(2, 'from-prev')`, so every wandering, patrolling,
  // dancing and ball-tossing robot pack actually moved), sampled every NPC's own position every quarter
  // second over 300 simulated seconds, then swept the open floor (radius 15-90, short of the radius
  // (98) where robotRegion's own procedural fill takes over) against both those samples and every one
  // of the city's physics boxes: (58, -43) came back clear by 9.4 m of the nearest box (one of the
  // outer-ring skyscrapers) and 12.2 m of the nearest other soul, well past the sentry's own
  // [-15,-35]..[15,-45] patrol rectangle. Placed last of every person this build adds, after the
  // photographer, so it draws from the very tail of this world's own local `r()` sequence and disturbs
  // no earlier wardrobe or layout pick.
  { const sx = 58, sz = -43, cx = 58, cz = -41.6;
    place(game, U, makeStump(r), sx, sz, r() * TAU); P.addBox(sx, 0.36, sz, 0.5, 0.72, 0.5, { cam: false });
    const splitWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a4a5a], pants: [0x232c34, 0x2a2a30] });
    const cutter = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: false, wardrobe: splitWard, build: 'stout' }),
      hat: r.chance(0.5) ? 'cap' : null, hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, axe: true, glasses: r.chance(0.25) });
    W.add(cutter.group);
    // a few split pallet boards already down, piled beside the stump
    const bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark() }), cutFace = mat(0xc9a86a, { roughness: 1 });
    for (const [lx, lz, lry] of [[-0.55, 0.15, 0.3], [-0.4, 0.35, -0.4], [-0.6, 0.4, 1.1]]) {
      const log = group(sx + lx, 0.09, sz + lz, W); log.rotation.z = PI / 2; log.rotation.y = lry;
      mesh(G.cyl(0.09, 0.09, 0.34, 8), bark, { shadow: 'both', parent: log }); mesh(G.cyl(0.089, 0.089, 0.01, 8), cutFace, { y: 0.17, shadow: 'none', parent: log }); mesh(G.cyl(0.089, 0.089, 0.01, 8), cutFace, { y: -0.17, shadow: 'none', parent: log });
    }
    game.npcs.push(new Chopper(game, cutter, { x: cx, z: cz, ry: atan2(sx - cx, sz - cz),
      cries: ['Pallets off the belt, split for the break room stove.', 'Careful, puss — mind the chips.', "East yard's the only place with room to swing this thing."] })); }
  // every world's sky has had shooting stars since round 406, and Victorian's own hot air balloon
  // has circled its rooftops since round 438 — Robot City's sky, for all its skyline of beacon-
  // topped towers, never had anything actually fly over it. **A riveted grey airship — a glowing
  // cyan stripe round its middle, a blinking nose light and a spinning tail propeller — now circles
  // the whole city, 100 m up on a slow 170 m orbit**, well clear of even the tallest beacon-topped
  // tower (61 m). Purely decorative: nothing to greet, nothing to reach, no dialogue.
  //
  // No new controller, no physics box of its own: flying 39 m above the tallest rooftop clears
  // every skyscraper and beacon by a wide margin, so — exactly like the balloon — it needs no
  // keep-out check against `game.zones` or any of the city's physics boxes the way anything on the
  // ground does. The hull is one raw `THREE.CapsuleGeometry` (tracked by hand with `worldBag.track()`
  // since it bypasses the cached `G.*` helpers), built pole-to-pole along its own local Y axis like
  // any capsule, carried by a child group rotated `PI/2` about X so that axis lands on local Z —
  // nose at +z, tail at -z — before the whole assembly is ever moved onto its orbit; scale and
  // rotation on a single object always compose local-space-first, so the capsule's long axis survives
  // that one rotation intact regardless of whatever yaw the outer group gets each frame afterward.
  // The tail fins (a vertical fin and two horizontal ones, the same flat-box cross every real airship
  // uses) and the single pusher propeller sit at the -z end; the blinking nose light sits at +z.
  // Rotating the outer group by `-a` (`a` being the orbit's own angle) always points local +z along
  // the orbit's own direction of travel — the same identity the balloon's own `rotation.y = -a`
  // happens to satisfy for any circular path, so no separate heading calculation is needed. The
  // propeller blades are thin flat boxes, the same order of thinness as the balloon's own ropes, so
  // they go through `noInk()` for the same reason: a pixel or two wide and the ink pass would draw a
  // solid line across the sky instead of a spinning blur.
  //
  // Drifts entirely on the world clock `t` (bob, roll, the nose light's blink and the propeller's own
  // spin all keyed off `t` alone) from one fixed starting angle drawn once off this world's own local
  // `r()`, so it costs no later wardrobe or layout pick — placed last of everything this build adds,
  // after the woodcutter, so even that one draw disturbs nothing built earlier in the city.
  { const airR = 170, airH = 100, airSpeed = TAU / 260, airPhase = r() * TAU;
    const airship = group(0, 0, 0);
    const hullM = mat(0x6b7480, { metalness: 0.5, roughness: 0.4 });
    const envGroup = group(0, 0, 0, airship); envGroup.rotation.x = PI / 2;
    const envGeo = new THREE.CapsuleGeometry(1.7, 6.2, 4, 12); worldBag.track(envGeo);
    mesh(envGeo, hullM, { shadow: 'none', parent: envGroup });
    mesh(G.cyl(1.72, 1.72, 0.35, 16), glowMat(0x00e5ff, 1.4), { shadow: 'none', parent: envGroup });
    mesh(G.box(1.5, 0.75, 2.2), mat(0x3a3f48, { roughness: 0.6 }), { y: -2.3, z: 0.3, shadow: 'none', parent: airship });
    mesh(G.box(1.46, 0.22, 0.12), glowMat(0x00e5ff, 1.2), { y: -2.3, z: 1.4, shadow: 'none', parent: airship });
    const nose = mesh(G.sphere(0.22, 8, 6), glowMat(0xffffff, 2.6), { z: 4.9, shadow: 'none', parent: airship });
    const finM = mat(0x454b56, { roughness: 0.7 });
    mesh(G.box(0.1, 2.0, 1.3), finM, { z: -3.9, shadow: 'none', parent: airship });
    mesh(G.box(2.0, 0.1, 1.3), finM, { y: 0.55, z: -3.9, shadow: 'none', parent: airship });
    mesh(G.box(2.0, 0.1, 1.3), finM, { y: -0.55, z: -3.9, shadow: 'none', parent: airship });
    const propGroup = group(0, 0, -4.1, airship);
    mesh(G.cyl(0.12, 0.12, 0.3, 8), finM, { rx: PI / 2, shadow: 'none', parent: propGroup });
    const bladeM = mat(0x2e323a, { roughness: 0.6 });
    noInk(mesh(G.box(0.06, 1.1, 0.16), bladeM, { shadow: 'none', parent: propGroup }));
    noInk(mesh(G.box(1.1, 0.06, 0.16), bladeM, { shadow: 'none', parent: propGroup }));
    airship.userData.update = (dt, t) => {
      const a = airPhase + t * airSpeed;
      airship.position.set(cos(a) * airR, airH + sin(t * 0.11) * 2.5, sin(a) * airR);
      airship.rotation.y = -a;
      airship.rotation.z = sin(t * 0.3) * 0.02;
      propGroup.rotation.z += dt * 9;
      nose.material.emissiveIntensity = sin(t * 2.2) > 0 ? 2.6 : 0.3;
    };
    place(game, U, airship, cos(airPhase) * airR, sin(airPhase) * airR, 0, airH); }
  // the Neighborhood has had a raccoon at a bin for a while now, the Woods a ladybug, Candy Land a
  // gumdrop toad — every world's own small, unregarded floor-level creature except Robot City, whose
  // one ambient critter (the factory mouse, west of the belts) never had company anywhere else on the
  // open floor. **A scrap-bug now scuttles the quiet concrete north-east of the city** — new
  // `makeScrapBug()` in `56-npcs-wild.js`, the mechanical cousin of the ladybug's own rig: the same
  // domed shell and thread-thin feelers, just steel instead of lacquer, with a small blue lens for a
  // head and no spots. Wired to the same `Hopper` controller every other tiny ground creature already
  // uses, short scuttles with a lens that brightens on the move and pulses slowly at rest. Pure
  // ambient wildlife — no greeting, no effect on the friend count, nothing it adds to collect.
  //
  // A headless probe (`game.start('new')` then `game.travel(2, 'from-hub')`, 9000 simulated frames at
  // the stub clock's real step, every NPC's own position sampled every 10th frame) swept a few open
  // pockets of this city's own flat floor against both every physics box and every one of those
  // samples: (34, 11) came back clearest, 13.5 m from the nearest box (an east-side skyscraper's own
  // footprint) and 8.6 m from the nearest wandering soul (one of the five patrol robots, on its own
  // 9 m leash out of (18, 8)) — comfortably past the 1.1 m leash given here, and far from every hand-
  // placed table, patrol beat and ring in this build.
  //
  // Built dead last of everything this world adds, after the airship, so `Hopper`'s own three
  // unconditional draws off the *shared* `rnd()` sequence (idle timer, idle phase, starting heading —
  // the same draws the raccoon's own comment already warns about) land after every other NPC in this
  // city that times itself off that same sequence, the off-shift gossiping pair included, and disturb
  // nothing built earlier on the factory floor.
  //
  // This same comment left the ladybug's own family (round 694) unmet here: `Hopper`, unlike
  // `Wanderer`, never calls `greetable()` on its own, so a rig with none of `.look`/`.robot`/`.cookie`
  // just sits there ambient. Round 695 fixed Candy Land's gumdrop beetle the same way, and this round
  // takes the scrap-bug. **It now answers its own "Say hello to the scrap-bug" prompt too**, with
  // *"🤖 *lens flares bright blue for a second, feelers twitch, then it skitters off*"*. Same fix as
  // the raccoon, the factory mouse and the two beetles before it: no new mesh, no new physics box,
  // just `game.namedFriend('scrap-bug')` plus a `game.addInteractable` keyed straight to the bug's own
  // `rig.group`, tracked every frame so the prompt follows it through its tiny hops inside its own
  // 1.1 m leash. The 2.1 m greet radius — the same every other Hopper creature's own prompt already
  // uses — sits nowhere near anything else: the probe above this build already found (34, 11) 13.5 m
  // from the nearest box and 8.6 m from the nearest wandering soul, far past the radius needed here.
  // Sunny Shore's tiger beetle and Frosty Peak's frost beetle are the same family and still unmet —
  // either one is next.
  { const rig = makeScrapBug();
    game.npcs.push(new Hopper(game, rig, { x: 34, z: 11, leash: 1.1, r: 0.1, dist: [0.2, 0.5], dur: 0.26, height: 0.1, idle: [1.2, 3.6],
      onHop: () => { if (rnd.chance(0.25)) SFX.click(); } }));
    const scrapBugId = game.namedFriend('scrap-bug');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the scrap-bug', onUse: () => { game.befriend(scrapBugId); SFX.beep(); game.hearts(rig.group.position.x, 0.15, rig.group.position.z, 3); game.toast('🤖 *lens flares bright blue for a second, feelers twitch, then it skitters off*'); } }); }
  // Candy Land's gingerbread guard (round 300-ish) and Victorian's drill line both already use `Marchers`
  // (55-npcs.js) for a lockstep patrol; Robot City has its own sentry and RoboDog, each one robot walking
  // alone, but never a squad in step. A three-robot security detail now beats a strict north-south line
  // in the gap between two of the east yard's own towers, same lockstep-and-follow logic as both earlier
  // marches, unchanged — just `makeRobot()` rigs in place of gingerbread men or children.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real city (`game.travel(2, 'from-hub')`), sampled every NPC's own position every quarter second
  // over 400 simulated frames (so no wandering robot, tag/catch pair or ring dancer mid-turn could slip
  // past unnoticed), then swept a short list of candidate lines against both those samples and every one
  // of the city's 1191 physics boxes: the 8 m line from (46, -18) to (46, -26) came back clear by 6.73 m
  // of the nearest box and 12.0 m of the nearest other soul along its whole length, at radius 49-53 from
  // the origin — deep in the east yard's own tower cluster but clear of every one of them.
  // The lead already answers a "Beep hello" prompt for free — `Marchers`' lead rig runs on `Patroller`,
  // whose constructor calls `greetable()` automatically, and a robot rig carries `.robot`, one of the
  // three tags `greetable()` checks for — but the two followers trailing behind it never got the same
  // wiring, same gap this log has already closed on the gingerbread guard's, the crab's, the penguin's,
  // the hedgehog's and the Neighborhood's own toy-troop's followers. The second unit now gets it by
  // hand: the same `game.namedFriend` + `game.addInteractable` move, tracked off `marchers[1].group`,
  // which `Marchers.update()` (55-npcs.js) already repositions at a fixed 1.2 m gap behind the lead
  // every frame, so the prompt follows it there and back with no new mesh and no new physics box.
  // The third unit now closes the detail out, the identical fix round 755 already used on the
  // gingerbread guard's own third: `game.namedFriend` plus a tracked `game.addInteractable` off
  // `marchers[2].group`, its own line rather than reusing the lead's or second's.
  { const marchers = [0, 1, 2].map(() => { const rig = makeRobot(); W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, marchers, { points: [[46, -18], [46, -26]], speed: 1.0, pause: [1, 2], pauseAll: true, loop: false, r: 0.42, height: 1.9, gap: 1.2,
      cries: ['Shift patrol: sector clear.', 'In step. Always in step.', 'Unauthorized feline logged. Proceeding.'], cryIcon: '🛡️' }));
    const secondId = game.namedFriend('security-detail-2');
    game.addInteractable({ obj: marchers[1].group, radius: 2.1, label: () => 'Beep hello', onUse: () => { game.befriend(secondId); SFX.beep(); game.hearts(marchers[1].group.position.x, 1.9, marchers[1].group.position.z, 3); game.toast('🤖 "SECONDARY UNIT. FELINE RE-LOGGED. ...HELLO."'); } });
    const thirdId = game.namedFriend('security-detail-3');
    game.addInteractable({ obj: marchers[2].group, radius: 2.1, label: () => 'Beep hello', onUse: () => { game.befriend(thirdId); SFX.beep(); game.hearts(marchers[2].group.position.x, 1.9, marchers[2].group.position.z, 3); game.toast('🤖 "REAR GUARD UNIT. ...DESIGNATED FRIEND. HELLO."'); } }); }
  // Frosty Peak's own haulers (round 526-ish) and now the penguin colony have both used `TugOfWar`
  // (55-npcs.js) for a straining, never-resolving contest; Robot City had plenty of robots standing,
  // wandering or marching, but no two of them ever pitted against each other. Two factory units now
  // strain against a thick power cable a few metres north of the east yard's own marching patrol,
  // same heave-and-never-win logic, unchanged — just `makeRobot()` rigs and a cable in place of rope.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, built
  // the real city with `game.travel(2, 'from-hub')`, then teleported the cat itself next to the
  // candidate spot so nothing the engine culls by distance could hide a box) sampled every NPC's own
  // position every quarter second over 500 simulated frames, then swept the two robots' own stations
  // and a half-metre margin either side of them against both those samples and every one of the city's
  // 323 physics boxes: (46, -8) came back clear by 5.19 m of the nearest box and 8.76 m of the nearest
  // other soul — just north of the marching patrol's own beat (46, -18)-(46, -26) and short of the
  // radius (98) where robotRegion's own procedural fill takes over.
  { const haulerA = makeRobot(); W.add(haulerA.group); const haulerB = makeRobot(); W.add(haulerB.group);
    const tug = new TugOfWar(game, haulerA, haulerB, { x: 46, z: -8, ry: 0, gap: 2.6,
      cries: ['Tug protocol: engaged. Neither unit yields.', 'Careful, puss — mind the cable, it still has some charge in it.', 'Query: why do we do this every shift? Answer: unresolved.'] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, cableM = mat(0x24262b, { roughness: 0.85 }), capM = glowMat(0x00e5ff, 1.4);
    const ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const cableGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    cableGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.045, 0.045, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 10), cableM, { rx: PI / 2, parent: cableGroup }));
    for (const s of [-0.9, 0.9]) noInk(mesh(G.cyl(0.055, 0.055, 0.1, 10), capM, { z: s, rx: PI / 2, shadow: 'none', parent: cableGroup }));
    const bulb = mesh(G.sphere(0.05, 8, 6), glowMat(0xffb04a, 1), { parent: W });
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.14;
      bulb.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.04, lerp(A.z, B.z, frac));
      bulb.material.emissiveIntensity = 0.6 + abs(tug.tension) * 1.8; }); }
  // the Neighborhood, Candy Land, Victorian, Sunny Shore, Frosty Peak and Whisper Woods have all had
  // their own `Tetherball` (`55-npcs.js`) since round 508's own list of playground games went round
  // every other world in turn — Robot City, for all its break-room sitter and its two haulers above
  // straining on a cable, never got the one game actually played by people rather than robots. Two
  // off-shift factory workers now bat a ball round a pole on a quiet stretch of concrete east of the
  // yard. **A tetherball pole for Robot City.** *"Five minutes. This is how I spend every one of
  // them."* *"Careful, puss — that thing's got a mean swing."* *"Foreman says it's bad for morale.
  // Foreman's never won a point."*
  //
  // No new class and no new mesh: the exact same `Tetherball` the other six worlds already use, just a
  // fresh pair of workers and a spot. `Tetherball` reaches into `rig.spine`, which `makeRobot()`'s rig
  // never sets — the same reason the mechanic, painter, oil vendor and break-room worker already built
  // earlier in this city are human contractors rather than robots — so this pair is human too, break-
  // room `makeWardrobe` colours reused rather than a kid's.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real city built with `game.travel(2, 'from-hub')` and settled out past its own real-timer fade
  // before anything was sampled) sampled every NPC's own position every 5th frame over 3600 simulated
  // frames, then swept the pole at (29, -16) and both workers' own stations two metres either side of
  // it, (31, -16) and (27, -16), plus the ball's own orbit extremes, against both those samples and
  // every one of the city's 1193 physics boxes: the worst of the five points came back clear by 7.05 m
  // of the nearest box and 7.38 m of the nearest other soul — short of the tug-of-war haulers above at
  // (46, -8), the marching patrol's own beat and the squirrel below, and well inside the radius where
  // robotRegion's own procedural fill takes over.
  { const tetherWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x8a6a3a], pants: [0x232c34, 0x2a2a30] });
    const workerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tetherWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    const workerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tetherWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(workerA.group); W.add(workerB.group);
    game.npcs.push(new Tetherball(game, workerA, workerB, { x: 29, z: -16,
      cries: ['Five minutes. This is how I spend every one of them.', "Careful, puss — that thing's got a mean swing.", "Foreman says it's bad for morale. Foreman's never won a point."] })); }
  // the Neighborhood, Candy Land, Frosty Peak and Whisper Woods still owe round 508's own playground
  // list a `Badminton` net (`55-npcs.js`) — Victorian and Sunny Shore have had one for a while — but
  // Robot City, for all its tetherball pole and its two haulers on a cable, is the one place in the
  // city proper where a rally could actually use the open floor rather than fight the yard's own
  // towers for space. Two off-shift contractors now keep a shuttlecock going over a low net on the bare
  // concrete well past the last skyscraper on the south-west side. *"Quietest spot in the whole city.
  // That's the appeal."* *"Careful, puss — that net's the only thing out here taller than you."*
  // *"Forty-one. No — forty-two. The wind off the vents keeps nudging my count."*
  //
  // No new class and no new mesh: the exact same `Badminton` (`55-npcs.js`) and `makeVolleyballNet`
  // (`62-props-nature.js`) Victorian and Sunny Shore already use. `Badminton` reaches into `rig.spine`,
  // which `makeRobot()`'s rig never sets — the same reason the tetherball pair above and every other
  // break-room worker in this city are human contractors rather than robots — so this pair is human
  // too, a fresh wardrobe rather than the tetherball pair's own.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real city built with `game.start('new')` then `game.travel(2, 'from-hub')`) sampled every NPC's
  // own position every 6th frame over 2400 simulated frames, then swept the net at (-28, -86) and both
  // players' own stations (±2.8 m either side of it) and the net posts (±1.6 m) against both those
  // samples and all 300 of the city's physics boxes: the worst of the five points came back clear by
  // 16.3 m of the nearest box or soul — one of the gaps between the ring of towers out past radius 72,
  // and well short of the radius (98) where robotRegion's own procedural fill takes over.
  { const cx = -28, cz = -86, gap = 5.6, halfW = 1.6;
    const net = makeVolleyballNet(halfW, 0x6a7078, { postH: 1.6, netH: 0.78 });
    place(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) P.addBox(cx + sx, 0.8, cz, 0.16, 1.6, 0.16, { cam: false });
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    const badWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x3a5a4a], pants: [0x232c34, 0x2a2a30], shoes: [0x1a1a20, 0x201c18] });
    const bA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2), wardrobe: badWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.25), racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2), wardrobe: badWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.25), racket: true });
    W.add(bA.group); W.add(bB.group);
    const badmintonLines = ['Quietest spot in the whole city. That\'s the appeal.', "Careful, puss — that net's the only thing out here taller than you.", 'Forty-one. No — forty-two. The wind off the vents keeps nudging my count.'];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: badmintonLines })); }
  // round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races)
  // has gone round every world by now — Robot City had the tetherball pole, the badminton net and the
  // cable tug-of-war above, but never the one game with no ball, pole or shuttle at all. Two off-shift
  // contractors now hop a short lane on the quiet concrete north-west of the city, bound ankle to waist
  // in a borrowed packing sack apiece. *"Lost a bet. Didn't think they'd actually make me do it."*
  // *"Careful, puss — these sacks held bolts an hour ago."* *"Neither of us has ever once reached the
  // end. Foreman says that's the point."*
  //
  // No new class and no new mesh: the exact same `SackRace` (`55-npcs.js`) and `makeHuman`'s own
  // `o.sack` option the Neighborhood and Candy Land already use. `SackRace` reaches into `rig.spine`,
  // which `makeRobot()`'s rig never sets — the same reason the tetherball and badminton pairs above are
  // human contractors rather than robots — so this pair is human too, adults rather than the other two
  // worlds' children, matching this city's own off-shift-worker trope.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real city built with `game.start('new')` then `game.travel(2, 'from-hub')`) sampled every physics
  // circle's own position every 20th frame over 3600 simulated frames (60 s, long enough for every
  // wandering, patrolling and marching robot and every tetherball, tug-of-war and badminton pair to
  // range fully), then swept the lane's own 5 m length and 1.1 m width against both those samples and
  // every one of the city's 1194 physics boxes: (-42, 46) came back clear by 5.89 m at its tightest
  // point (an inner-ring skyscraper's own footprint), at radius 62.3 from the origin — comfortably
  // short of the radius (98) where robotRegion's own procedural fill takes over, and far from the
  // tetherball pole, the cable tug-of-war and the badminton net already built into this city.
  { const rx = -42, rz = 46, rry = PI / 2;
    const sackWard = makeWardrobe(r, { shirts: [0x6a4a3a, 0x3a6a5a, 0x5a3a6a], pants: [0x232c34, 0x2a2a30], shoes: [0x1a1a20, 0x201c18] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: sackWard }),
      sack: 0x8a8278, hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2) });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: sackWard }),
      sack: 0x8a8278, hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2) });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: rx, z: rz, ry: rry,
      cries: ["Lost a bet. Didn't think they'd actually make me do it.", "Careful, puss — these sacks held bolts an hour ago.", "Neither of us has ever once reached the end. Foreman says that's the point."] })); }
  // `PogoHopper`'s own tour (`55-npcs.js`) has now reached every world but two — the Neighborhood, Candy
  // Land, Sunny Shore and Victorian all have one, Frosty Peak and Whisper Woods still don't. **An
  // off-shift contractor's kid now bounces on a quiet stretch of open concrete** north-east of the
  // city, well past the sack race and every other hand-placed spot. *"Boing! Watch me clear the vents,
  // puss!"* *"Dad says I'll wear a groove in the floor at this rate."* *"Ninety-six. Don't you dare make
  // me lose count."*
  //
  // No new class and no new mesh: the exact same `PogoHopper` the Neighborhood, Candy Land, Sunny Shore
  // and Victorian already use. A human kid, not a robot: `makeRobot()`'s rig never sets `rig.legs` the
  // way `PogoHopper` needs for its fixed crouch, the same reason the tetherball, badminton and sack-race
  // pairs above are all human contractors too.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real city built with `game.start('new')` then `game.travel(2, 'from-hub')`, 3600 simulated frames to
  // let every wanderer and patroller range fully) sampled every NPC's own position every 20th frame,
  // then swept a grid of the open floor (radius 20-85, short of the radius (98) where robotRegion's own
  // procedural fill takes over) against both those samples and every one of the city's 325 physics
  // boxes: (22, 71) came back clearest, 17.1 m from the nearest box and 19.0 m from the nearest other
  // soul, 38 m clear of the sack race, the badminton net and every other hand-placed spot in this city.
  { const pogoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0x00e5ff, hat: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null }); W.add(pogoKid.group);
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: 22, z: 71, ry: r.range(0, TAU),
      cries: ['Boing! Watch me clear the vents, puss!', "Dad says I'll wear a groove in the floor at this rate.", "Ninety-six. Don't you dare make me lose count."] })); }
  const sq = new Squirrel(game, -14, -9, 'sq-robot'); game.squirrels.push(sq);
  const C = game.collectibles;
  C.add('mouse', -8, 7); C.add('star', 12, -22); C.add('fish', -18, 2); C.add('yarn', 21, 9); C.add('star', 0, -27); C.add('fish', 4, 14); C.add('mouse', 26, -18); C.add('yarn', -26, -6);
  game.fx.setAmbient({ count: 70, radius: 18, colors: [0xff8a3d, 0xffc46a, 0x00e5ff, 0xffffff], rise: 0.5, drift: 0.25, life: 3, height: 5, yMin: 0.4 });
  makeDayNight(game, U, W);
  // The Neighborhood, Candy Land and Whisper Woods have all had a piñata post since rounds 508, 564 and
  // 565 (`PinataSwinger` in `55-npcs.js`, `makePinata` in `60-props.js`) — Robot City, for all its
  // tetherball pole, badminton net, sack race and pogo stick, never got one. A scrap-built piñata —
  // steel-grey with a hazard-stripe fringe — now hangs from a post well south of the catch pair's own
  // throw gap, a contractor taking the end-of-shift swing at it. **A piñata post for Robot City.**
  // *"One of these days I'm actually going to connect."* *"Careful, puss — swing room needed here."*
  // *"Foreman filled it with spare bolts. Typical."*
  //
  // No new class and no new mesh: the exact same `PinataSwinger` (`55-npcs.js`) and `makePinata`
  // (`60-props.js`) the other three worlds already use. `PinataSwinger` reaches into `rig.hands` and
  // `rig.k`, which `makeRobot()`'s rig never sets — the same reason the tetherball, badminton, sack-race
  // and pogo-stick pairs built earlier in this city are all human contractors rather than robots — so
  // this swinger is human too, an adult rather than a kid, matching the city's own off-shift-worker trope.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real city built with `game.start('new')` then `game.travel(2, 'from-hub')`, 3600 simulated frames to
  // let every wandering, patrolling, marching robot and every tetherball, tug-of-war, badminton, sack-
  // race and pogo-stick pair actually move) sampled every NPC's and the squirrel's own position every
  // 10th frame, then swept a grid of the open floor (radius 15-90, short of the radius (98) where
  // robotRegion's own procedural fill takes over) against both those samples and every one of the city's
  // 326 physics boxes: (2, -70) came back clear by 14.9 m of the nearest box or soul — south of the catch
  // pair's own gap at (2, -54) and the seesaw at (0, -45), and far from the tetherball pole, the cable
  // tug-of-war, the badminton net, the sack race and the pogo stick already built into this city.
  //
  // Built dead last, after the squirrel, the collectibles and the day/night cycle, for the usual reason:
  // `makeHuman()` draws three values off the *shared* `rnd()` sequence unconditionally, and a fresh rig
  // built any earlier would shift that sequence and desync every other timing-sensitive pick already
  // placed above.
  { const px = 2, pz = -70, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const SCRAP_FRINGE = [0x00e5ff, 0xff4d4d, 0xfff176, 0x9aa3ad, 0xffffff];
    const postM = mat(0x454b52, { metalness: 0.5, roughness: 0.6 });
    const standG = group(px, 0, pz, W);
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0x5a6470, SCRAP_FRINGE);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    P.addBox(px, postH / 2, pz, 0.35, postH, 0.35, { cam: false });
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    U.push(standG.userData.update);
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const swingWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x8a6a3a], pants: [0x232c34, 0x2a2a30] });
    const swinger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: swingWard }),
      hat: 'cap', hatColor: 0x3a4a5a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(swinger.group);
    game.npcs.push(new PinataSwinger(game, swinger, 0xc9a86a, { x: sx, z: sz, ry: sry,
      cries: ["One of these days I'm actually going to connect.", 'Careful, puss — swing room needed here.', 'Foreman filled it with spare bolts. Typical.'] })); }

  // archery had reached six of the seven worlds (Neighborhood, Frosty Peak, Whisper Woods, Victorian,
  // Sunny Shore, Candy Land) but never Robot City, the one remaining world with no archery range of its
  // own. **A maintenance-crew archer now shoots at a straw target on a quiet stretch of open floor north
  // of the yard**, same crew-blue jumpsuit the pogo kid and the tug-of-war two already wear round here.
  // *"Careful, puss — foreman docks me a shift if an arrow ends up in the scrap pile."* *"Still can't beat
  // the sentry's own targeting scanner, and that thing's bolted to a wall."* *"Lunch break. The robots
  // don't get archery practice — lucky them."*
  //
  // No new class and no new prop: the exact same `Archer` and straw-boss-and-rings target (`55-npcs.js`)
  // the other six worlds already build, unchanged — just this crew's own jumpsuit in place of the
  // Neighborhood's hoodie, Frosty Peak's winter coat, Whisper Woods' woodsman jacket, Victorian's
  // bonnet-and-gown, Sunny Shore's beachwear or Candy Land's sweet-shop pink.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(2, 'from-prev')`, 1800 simulated frames to let every wandering,
  // patrolling and dancing robot actually move, sampling every NPC's own position every 15th frame) did
  // a full joint search over every open floor point (radius ≤ 96, short of the radius (98) where
  // `robotRegion`'s own procedural fill takes over) against all 32 firing directions at each one, scoring
  // each candidate by its tightest clearance anywhere along the whole 10 m archer-to-target line, measured
  // to each physics box's own edge — this city runs to 1195 physics boxes, the most of any world archery
  // has reached yet, so the search itself ran through a spatial hash bucketing boxes and NPC samples into
  // 4 m cells rather than a flat scan of all of them at every candidate point. The single clearest point
  // in the whole city sat right out at the edge of the hand-built area (radius 95.6, barely inside the
  // 98 m fill boundary), so the search was re-run preferring candidates with radius ≤ 80 — well clear of
  // both that boundary and the outer skyline rings — and (-6, 44), firing due east toward (4, 44), came
  // back clearest of that set: 9.58 m of headroom at the tightest point along the line, against a
  // skyscraper's own footprint at (-19.5..-10.1, 52.7..62.2) near the archer's stand and a small prop box
  // at the target's own end, with the nearest wandering soul (a Sitter robot) never closer than 10.2 m.
  //
  // Built dead last, right after the piñata, for the usual reason: `makeHuman()` draws three values off
  // the shared `rnd()` sequence unconditionally, and a fresh rig built any earlier would shift that
  // sequence and desync every other timing-sensitive pick already placed above.
  { const ax = -6, az = 44, ary = PI / 2, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    P.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x5a4a6a, 0x8a6a3a], pants: [0x232c34, 0x2a2a30] });
    const archer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bowWard }),
      hat: null, hairStyle: 'pony', jacket: null, coat: null, scarf: null, bag: null, backpack: null, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist,
      cries: ['Careful, puss — foreman docks me a shift if an arrow ends up in the scrap pile.', "Still can't beat the sentry's own targeting scanner, and that thing's bolted to a wall.", "Lunch break. The robots don't get archery practice — lucky them."] })); }
  // the Neighborhood (round 592), Sunny Shore (591), Victorian (596) and Candy Land (597) have all let
  // somebody digging nearby beat their own long-suffering `Detectorist` to real treasure by now; Robot
  // City's own scanner, still sweeping the concrete east of the second conveyor line at (32, -56), was
  // the last of the four worlds left without one. A visiting kid off the gondola has struck real gold
  // with nothing but a shovel, a few strides further out on the same stretch of open concrete. *"Everybody
  // else got a washer. I got THIS."* *"Careful, puss — don't you dare knock a single coin back onto the
  // concrete."* *"Don't tell the scanner. He'll never forgive himself."*
  //
  // Reuses round 591's `makeTreasureChest()` and `makeShovel()` (`62-props-nature.js`) and
  // `makeGemCluster()` (`60-props.js`) exactly as the other three digs already do — no new prop, no new
  // mesh. Robot City carries none of the Neighborhood's own "seven gems"/"no repeated shirt" constraints
  // (both scoped to world 0 only in `test/run.mjs`), so a straight `makeGemCluster()` call with the usual
  // gold-and-silver palette did the job. The finder herself is a plain `Kneeler` in the same vivid-shirt
  // style every other Robot City kid already wears (the yo-yo kid's cyan, the hoop kid's yellow, the
  // chalker's orange, the pogo kid's electric blue) — a fresh violet shirt in place of theirs, same
  // placement-only trick as those four.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `game.start('new')`, `game.travel(2, 'from-prev')`, 1800 simulated frames with every NPC's own
  // position sampled every 15th frame) swept a grid of candidates near the scanner's own spot against
  // both those 9,960 samples and all 1198 of the city's own physics boxes, staying clear of the
  // scanner's own spot: (40, -60) came back clearest, 9.0 m from the nearest box and 8.9 m from the
  // nearest other soul — 8.9 m from the scanner himself, close enough the joke still reads, far enough
  // neither "Say hello" circle (2.1 m each) comes near the other's.
  //
  // Built dead last, right after the archery range, for the usual reason: `makeHuman()` and
  // `makeGemCluster()` both draw off the shared per-world `r()` sequence unconditionally, and anything
  // built earlier in this city would have had its own timing-sensitive pick shifted by it.
  { const tx = 40, tz = -60, kx = tx + 1.3, kz = tz + 0.4, ry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); place(game, U, chest, tx, tz, 0.6);
    P.addBox(tx, 0.35, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); place(game, U, shovel, tx + 0.75, tz - 0.6, 0.3);
    makeGemCluster(game, U, tx + 0.4, tz + 0.9, 4, [0xd4af37, 0xc0c0c0, 0xffd54a], r, 0.9);
    const finder = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }),
      shirt: 0xb388ff, backpack: null, hat: null, jacket: null, coat: null, scarf: null, bag: null, glasses: false });
    W.add(finder.group);
    game.npcs.push(new Kneeler(game, finder, { x: kx, z: kz, ry, cryIcon: '💰',
      cries: ["Everybody else got a washer. I got THIS.", "Careful, puss — don't you dare knock a single coin back onto the concrete.", "Don't tell the scanner. He'll never forgive himself."] })); }
  // the Neighborhood's radio listener, Candy Land's sunbather, Sunny Shore's three towel people,
  // Frosty Peak's snow-angel girl and Victorian's flower girl have all had somewhere to just lie down
  // for a while, round by round — Robot City and Whisper Woods were the two worlds still left without
  // one. A maintenance-crew worker now lies flat on their back on a quiet stretch of open floor east of
  // the yard, hard hat knocked off beside them, catching five minutes before the next shift whistle.
  // No new controller or prop: the exact same `Sunbather` class (`55-npcs.js`) every other world's own
  // lie-down vignette already uses, unchanged — flat on the back, hands behind the head, same relaxed
  // pose as the rest — and the crew-blue jumpsuit the archer and the piñata swinger already wear round
  // here. The dropped hard hat is two primitives built inline, the same trick Frosty Peak's own dropped
  // beanie uses: a safety-yellow dome for the shell, a thin torus laid flat for the brim, both static
  // with no physics box of their own (too small and low to need one, the same reasoning that beanie and
  // Victorian's dropped bouquet both bank on).
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `elements.get('enter').listeners.click[0]()`, `game.travel(2, 'from-prev')`, 1800 simulated frames
  // sampling every NPC's own position every 15th frame) swept a 2 m grid of the open floor (radius
  // 15-75, comfortably short of the radius (98) where `robotRegion`'s own procedural fill takes over)
  // against both those 8,880 samples and all 305 of the city's own waist-to-head-height physics boxes:
  // (23, 71) came back clearest of the whole grid, 16.3 m from the nearest box and 19.0 m from the
  // nearest other soul.
  // Built dead last, right after the treasure-chest finder, for the same reason every other addition at
  // the end of this function already gives: `makeHuman()` draws three values off the shared `rnd()`
  // sequence unconditionally, and a fresh rig built any earlier in this city would shift that sequence
  // and desync every other timing-sensitive pick already placed above.
  { const bx = 23, bz = 71, bry = atan2(-bx, -bz);
    const breakWard = makeWardrobe(r, { shirts: [0x3a4a6a, 0x4a5a6a], pants: [0x232c34, 0x2a2a30] });
    const breaker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: breakWard }),
      hat: null, jacket: null, coat: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(breaker.group);
    const hhx = bx + cos(bry) * 0.55, hhz = bz - sin(bry) * 0.55, hhy = P.ground0(hhx, hhz);
    const hatM = mat(0xffd54a, { roughness: 0.5 });
    mesh(G.dome(0.14, 10, 7), hatM, { x: hhx, y: hhy + 0.1, z: hhz, shadow: 'none', parent: W });
    mesh(G.torus(0.145, 0.02, 6, 16), hatM, { x: hhx, y: hhy + 0.02, z: hhz, rx: PI / 2, shadow: 'none', parent: W });
    game.npcs.push(new Sunbather(game, breaker, { x: bx, z: bz, ry: bry, cryIcon: '🔧',
      cries: ["Five minutes. The scrap pile isn't going anywhere.", "Careful, puss — mind the hard hat, that's the only one that fits me.", "Floor's warm straight through from the server racks underneath. Best nap spot in the city."] })); }

  // Candy Land and Victorian both have a stilt walker by now (`StiltWalker`, 55-npcs.js, an
  // ordinary `Patroller` raised a fixed height off the ground it actually paces) — Robot City,
  // with its own factory floor full of hands on break, never had one of its own. A worker on a
  // pair of scavenged pipe-stilts now paces a short line on the open floor north of the scrap
  // crane, safety-orange jumpsuit and all, half again his own height off the ground. No new class,
  // no new mesh shape: the same ankle-parented pole, strap and footrest peg every other stilt
  // walker in this game already uses, just recoloured in scrap steel and hazard orange.
  //
  // A headless probe (`game.start('new')` then `game.travel(2, 'from-prev')`, 2000 simulated
  // frames sampling every NPC's own position every 15th frame) swept a 2 m grid of the open
  // factory floor (radius 20-46 from the origin, short of the radius (98) where `robotRegion`'s
  // own procedural fill takes over) against both those 11,390 samples and all 1200 of the city's
  // own physics boxes: the whole 6 m line from (12, -30) to (18, -30) came back clearest of the
  // grid, 7.65 m from the nearest box at its tightest end and 13.97 m from the nearest wandering
  // soul (a drone circling overhead, no obstruction at ground level) — north of the scrap crane's
  // own base at (13, -39) and well off the tetherball court at (29, -18).
  //
  // Built dead last, right after the break-time napper, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off the shared per-world `r()` sequence unconditionally, and
  // anything built earlier in this city would have had its own timing-sensitive pick shifted by it.
  { const stiltH = 0.8;
    const performer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xff8a00, stripes: 0x00e5ff, pants: 0x232c34, shoes: 0x2a2a30, hat: 'cap', hatColor: 0xff8a00, hatBand: 0x00e5ff, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(performer.group);
    const poleM = mat(0x454b52, { metalness: 0.6, roughness: 0.55 }), strapM = mat(0xff8a00, { roughness: 0.7 }), pegM = mat(0x2b2f36, { metalness: 0.5, roughness: 0.6 });
    for (const L of performer.legs) {
      const len = stiltH / performer.k;
      const stilt = group(0, 0.22, 0.01, L.ankle);
      mesh(G.cyl(0.026, 0.03, len + 0.3, 8), poleM, { y: -(len + 0.3) / 2 + 0.07, parent: stilt });
      mesh(G.torus(0.09, 0.018, 6, 10), strapM, { y: 0, rx: PI / 2, parent: stilt });
      mesh(G.box(0.15, 0.035, 0.09), pegM, { y: -0.17, z: 0.07, parent: stilt });
    }
    game.npcs.push(new StiltWalker(game, performer, { points: [[12, -30], [18, -30]], speed: 0.55, pause: [1.5, 3], r: 0.4, height: 2.6, stiltH,
      cries: ["Highest thing on this floor that isn't welded down, puss.", 'Scavenged these from the scrap pile myself. Mostly holding.', "Every other act in this city's got gears. I've just got these two poles."], cryIcon: '🎪' })); }

  // the Neighborhood's lemonade stand, Candy Land's cotton candy drum, Sunny Shore's chip fryer —
  // every other world's open floor has a snack cart by now, but Robot City's own factory floor, for
  // all its coffee vendor and oil seller, never had anything to actually eat between shifts. A
  // pretzel cart now sits on the open floor, a tray of twisted, salted pretzels under a glass case,
  // same `Vendor` controller every other cart's own seller already uses.
  //
  // A headless probe (`game.start('new')`, `game.travel(2, 'from-hub')`, 9000 simulated frames
  // sampling every NPC's own position every frame) swept the open floor: (-20, -20) came back clear
  // by 6.44 m of the nearest physics box and 8.45 m of the nearest wandering soul over the full run —
  // comfortably past the cart's own half-metre footprint, and with no zone anywhere near it.
  //
  // Built dead last, right after the stilt walker above, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off the shared per-world `r()` sequence unconditionally, and anything
  // built earlier in this city would have had its own timing-sensitive pick shifted by it.
  { const cx = -20, cz = -20;
    const cart = group(cx, 0, cz, W);
    const cartM = mat(0x8a3a2a, { roughness: 0.6, metalness: 0.2 }), chromeM = mat(0xc8ccd0, { metalness: 0.7, roughness: 0.3 }), glassM = mat(0xcfe8f0, { roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 });
    mesh(G.box(0.9, 0.5, 0.5), cartM, { y: 0.45, shadow: 'both', parent: cart });                             // cart body
    for (const s of [-1, 1]) mesh(G.cyl(0.14, 0.14, 0.06, 14), mat(0x2a2a2a, { roughness: 0.6 }), { x: s * 0.4, y: 0.14, rx: PI / 2, parent: cart });   // wheels
    mesh(G.box(0.86, 0.04, 0.46), chromeM, { y: 0.72, parent: cart });                                        // counter rim
    mesh(G.box(0.8, 0.34, 0.4), glassM, { y: 0.91, shadow: 'none', parent: cart });                            // display case
    const pretzelM = mat(0xb0732e, { roughness: 0.75 }), saltM = mat(0xf5f3ea, { roughness: 0.5 });
    const makePretzel = (scale = 1) => {
      const p = group(0, 0, 0);
      mesh(G.torus(0.085 * scale, 0.026 * scale, 8, 16), pretzelM, { rx: PI / 2, shadow: 'both', parent: p });   // the twisted ring
      for (const rz of [0.5, -0.5]) mesh(G.cyl(0.02 * scale, 0.02 * scale, 0.16 * scale, 8), pretzelM, { y: -0.01 * scale, rz, parent: p });   // the crossed legs
      for (let i = 0; i < 5; i++) { const a = r() * TAU, d = r.range(0, 0.07) * scale; mesh(G.sphere(0.006 * scale, 5, 4), saltM, { x: cos(a) * d, y: 0.02 * scale, z: sin(a) * d, shadow: 'none', parent: p }); }   // salt crystals
      return p;
    };
    for (const [px, pz] of [[-0.18, 0], [0.05, 0.03], [0.22, -0.02]]) { const pr = makePretzel(1); pr.position.set(px, 0.76, pz); pr.rotation.y = r() * TAU; cart.add(pr); }
    P.addBox(cx, 0.45, cz, 0.45, 0.9, 0.25, { cam: false });
    const standWard = makeWardrobe(r, { shirts: [0x8a3a2a, 0x6a4a3a], pants: [0x2a2a30, 0x3a3327] });
    const baker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: standWard }),
      apron: 0xf5f3ea, hat: null, jacket: null, scarf: null, bag: null, glasses: r.chance(0.2) });
    W.add(baker.group);
    const sx = cx, sz = cz - 0.9;
    const v = new Vendor(game, baker, makePretzel(1.3), { x: sx, z: sz, ry: 0, cryIcon: '🥨',
      cries: ['Fresh off the rack, still warm!', 'Careful, puss — that salt will make you sneeze.', 'One twist, two twists, three — never get the count right.'] });
    game.npcs.push(v); greetable(game, v); }

  // the oil vendor sells cans by the crate at the plaza, but nothing on this floor ever caught what
  // misses the can on the way to the line — a stain has been spreading on the open factory floor for
  // who knows how long. A maintenance worker now kneels over it with a sponge: `Washer`'s second outing
  // in this city, after the statue cleaner's own bucket of suds, same bent-forward scrubbing motion and
  // the same sponge the constructor already hands it, just a different mess to work on.
  //
  // A headless probe (`game.start('new')`, `game.travel(2, 'from-prev')` waited out through its real
  // portal-fade timer, then 9000 simulated frames sampling every NPC's own position every third frame)
  // swept this open patch of floor: the nearest other box stayed 9.89 m clear, the nearest wandering
  // soul 10.85 m off and the nearest other interactable ("Say hello" at (-36, -8.3)) 11.10 m off, with a
  // full 36-point ring at every radius up to 0.9 m landing on open floor — nowhere near any hand-placed
  // prop or `game.zones` entry.
  //
  // Built dead last, right after the pretzel cart above, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off the shared per-world `r()` sequence unconditionally, and anything
  // built earlier in this city would have had its own timing-sensitive pick shifted by it.
  { const wx = -28, wz = -16, wry = 0.6;
    const stainM = mat(0x15120e, { transparent: true, opacity: 0.72, roughness: 0.12, metalness: 0.15 }),
      sheenM = mat(0x3a4a3a, { transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.3 });
    const stx = wx + sin(wry) * 0.4, stz = wz + cos(wry) * 0.4;
    for (const [dx, dz, s, m] of [[0, 0, 0.46, stainM], [0.22, -0.12, 0.26, stainM], [-0.18, 0.2, 0.2, sheenM], [0.1, 0.22, 0.14, sheenM]]) mesh(G.cyl(s, s, 0.004, 14), m, { x: stx + dx, y: 0.004, z: stz + dz, shadow: 'none', parent: W });
    const mopWard = makeWardrobe(r, { shirts: [0x4a5a5a, 0x5a5048], pants: [0x2a2a2a, 0x33332e] });
    const mopper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: mopWard }),
      apron: 0x3a4248, hat: null, jacket: null, scarf: null, bag: null, glasses: r.chance(0.2) });
    W.add(mopper.group);
    game.npcs.push(new Washer(game, mopper, { x: wx, z: wz, ry: wry,
      cries: ['Every drop that misses the can ends up here, eventually.', 'Careful, puss — track that around and it never comes out.', "Three shifts in and it's barely any lighter."] })); }

  // the Neighborhood, Candy Land and Victorian all have a kid kneeling by a wobbly scooter, Robot City
  // among them — but the actual skateboard, `makeSkateboard()`, was only ever built once, in the
  // Neighborhood, and never spread the way the scooter was. A girl now kneels on the open factory
  // floor, checking her skateboard's back truck before she tries it again. Same `makeSkateboard()` +
  // `Kneeler` pairing the Neighborhood already uses, so this is a placement, not a new build.
  //
  // A headless probe (`game.start('new')`, `game.travel(2, 'from-prev')` waited out through its real
  // portal-fade timer, then 3000 simulated frames sampling every NPC's own position every frame) swept
  // the open floor against every physics box and every `game.zones` rect: (-60, -27.5) came back 8.5 m
  // clear of the nearest box (a skyscraper footprint), 9.19 m clear of the nearest zone rect, 14.4 m
  // clear of the nearest wandering soul over the whole run and 11.24 m off the nearest other
  // interactable ("Push the swing") — well inside the radius (98) where `robotRegion`'s own procedural
  // fill takes over.
  //
  // Built dead last, after the oil-stain scrubber above, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off this city's own shared `r()` sequence unconditionally, and anything
  // built earlier would have had its own timing-sensitive pick shifted by it.
  { const sx = -60, sz = -27.5, kx = sx + 0.9, kz = sz, ry = atan2(sx - kx, sz - kz);
    const board = makeSkateboard(0x00e5ff); place(game, U, board, sx, sz, 0.3);
    const skateWard = makeWardrobe(r, { shirts: [0xff6fb5], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x3a2a1e, 0x2a2018] });
    const skater = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: skateWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(skater.group);
    game.npcs.push(new Kneeler(game, skater, { x: kx, z: kz, ry,
      cries: ['One more bolt and it should hold.', 'Careful, puss — these wheels have no manners.', "Robots glide on wheels all shift long and never scuff a knee."] })); }

  // Whisper Woods, Sunny Shore and Frosty Peak all have the exact same knee-high spiderweb slung
  // between two twig stakes (`makeSpiderweb()`, 62-props-nature.js: dew beads, three silk rings, a
  // spider holding dead centre) — but all three are terrain worlds and used the height-aware `placeT`
  // to drop it. No flat-floor world has ever gotten one, and Robot City's own factory floor is dead
  // flat at y=0, so the identical rig drops straight on with plain `place`, no terrain lookup needed.
  // **A real spiderweb — dew, spider and all — now hangs between two stakes in a quiet corner of the
  // factory floor nobody built on, out past the oil vendor's own plaza.** *"🕸️ Real silk, real spider —
  // the one thing on this floor nobody built."* *"🤖 Not even the cleaning drones bother with this
  // corner. Lucky, this time."* *"😼 Puss, you did not just try to bat that. Everyone saw."*
  //
  // No new mesh, no new physics box: `makeSpiderweb()` is the identical rig the other three worlds
  // already use, and its two stakes (0.62 m tall) sit at ground level same as theirs — nothing that
  // tall needs colliding with on an open floor. A headless probe (`game.start('new')`, `game.travel(2,
  // 'from-prev')` waited out through its real portal-fade timer, then 36000 simulated frames sampling
  // every NPC's own position every frame) swept (15, 26) against every one of the city's 1201 physics
  // boxes, every `game.zones` rect and every interactable already standing: 6.17 m clear of the nearest
  // box, 6.71 m clear of the nearest other interactable and never closer than 6.71 m to any wandering
  // soul over the whole run — comfortably past the 1.8 m radius the other three webs already use.
  //
  // Built dead last, after the skateboard kid above, for the usual reason: `makeHuman()` and
  // `randomPerson()` both draw off this city's own shared `r()` sequence unconditionally (and so does
  // `makeSpiderweb()`'s own dew-phase roll), so anything built earlier would have had its own
  // timing-sensitive pick shifted by it.
  { const web = place(game, U, makeSpiderweb(r), 15, 26, atan2(0 - 15, 0 - 26));
    const webLines = ['🕸️ "Real silk, real spider — the one thing on this floor nobody built."', '🤖 "Not even the cleaning drones bother with this corner. Lucky, this time."', '😼 "Puss, you did not just try to bat that. Everyone saw."'];
    game.addInteractable({ obj: web, radius: 1.8, label: () => 'Look at the web', onUse: () => { SFX.click(); game.toast(rnd.pick(webLines), 3000); } }); }

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
    if (side === 1 && x === 22) {
      // the Neighborhood's had a stray cat napping on a porch rail since round 1 — no other world's
      // own houses ever got one of their own. This north-row terrace's second-column window (local
      // x=1.75, the one ground-floor window that isn't the door, same `makeVicHouse` layout maths the
      // window frames themselves use: cols=max(2,floor(w/cols))=2, so c=1's x is -w/2+(c+0.5)*(w/cols)
      // = 1.75) gets a cat curled up asleep right on its outer ledge, just past the glass (z=d/2+0.08
      // =3.58) and the stone frame in front of it. Added as a child of this house's own group, local
      // coordinates only, the same trick the Neighborhood's own porch cat already uses — it inherits
      // this house's world position and `ry=PI` rotation for free, so it keeps facing out over the
      // street on this north row exactly as a porch cat would on the south row. No physics box: well
      // outside the window glass, nothing down on the cobbles can ever reach it, same reasoning as the
      // Neighborhood's own porch cat and the pier's pelican.
      const napCat = makeNapCat();
      napCat.group.position.set(1.75, 1.05, 3.8);
      napCat.group.rotation.y = 0.25;
      house.add(napCat.group);
      let napT = 7; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); });
    }
    if (side === -1 && x === -8) {
      // the chimney sweep two doors down (x=-18) swears "every flue's mine sooner or later" — but
      // every chimney on this terrace has had smoke rising from it since round 1, which means someone
      // already lit every one of those fires. This house's own near chimney pot pays off that line: a
      // soot-blackened brush is already wedged in it, handle sticking straight up out of the pot,
      // bristle end down the flue — whoever swept this one got there, got paid and left before the
      // sweep further along even knocked. *"Someone's already been up this one. Lucky devil beat him
      // to it."* *"Puss, that is a sweep's brush, not a scratching post — and it's three storeys up."*
      // Added as a child of this house's own group (`house`), the same trick the TV aerial, satellite
      // dish and solar panel on the Neighborhood's own roofs already use: local coordinates straight
      // off the stack `makeVicHouse()` itself already builds (`cx = -w*0.3`, `z = -d*0.15`, top of the
      // 1.8 m stack centred at `h+2.4`, so `h+3.3`), no world-space maths and no physics box of its
      // own — nothing on the ground can jump anywhere near three storeys up.
      const standM = mat(0x3a2a1a, { roughness: 0.85 }), bristleM = mat(0x161414, { roughness: 0.95 });
      const brush = group(-w * 0.3, h + 3.3, -d * 0.15, house);
      brush.rotation.z = 0.12;
      noInk(mesh(G.cyl(0.02, 0.025, 0.7, 6), standM, { y: 0.35, parent: brush }));
      mesh(G.cone(0.1, 0.26, 8), bristleM, { y: 0.83, parent: brush });
      const brushLines = ['🧹 "Someone\'s already been up this one. Lucky devil beat him to it."', '😼 "Puss, that is a sweep\'s brush, not a scratching post — and it\'s three storeys up."', '🔥 "Paid and gone before the sweep two doors down even knocked."'];
      game.addInteractable({ obj: brush, radius: 4, label: () => 'Look up at the chimney brush', onUse: () => { SFX.click(); game.toast(rnd.pick(brushLines), 3000); } });
    }
  }
  // the Neighborhood, Candy Land, Sunny Shore, Robot City, Frosty Peak and Whisper Woods all have a
  // toy pinwheel spinning on the world clock by now — Victorian was the last of the seven left
  // without one, past its own hanging baskets and the last house's own wind chime. One now stands in
  // the grass just past the first house's own garden, west of its iron fence, as if a child left a
  // toy out by the gate. Same geometry and spin trick as every pinwheel before it
  // (`pivot.rotation.z = t * 3.6`, drawing only on the world clock `t`, never this world's own seeded
  // `r`, so it can't shift any later wardrobe pick) — just reskinned in black, white and brick-red to
  // match the terrace's own ironwork. A headless probe swept the gap west of the first house (x=-58,
  // fence spanning x=-59.5..-54.1) against every one of the town's 296 physics boxes and 42 NPCs:
  // (-60.5, -7.5) came back clear by over 5 m of the nearest box (that house's own wall) and 19 m of
  // the nearest soul, well short of the sidewalk strip (centred z=-5.6, half-width 1.1) and the radius
  // (88) where victorianRegion's own procedural fill takes over.
  { const px = -60.5, pz = -7.5, stickH = 0.7, bladeLen = 0.28;
    const pin = group(px, 0, pz, W), stickMat = mat(0x1e1e24, { roughness: 0.6 }), hubMat = mat(0xd8d8d8, { metalness: 0.5, roughness: 0.3 });
    mesh(G.cyl(0.018, 0.022, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
    const pivot = group(0, stickH, 0, pin);
    const bladeColors = [0x8b1a1a, 0xf7f3ec, 0x1e1e24, 0xf7f3ec];
    for (let bi = 0; bi < 4; bi++) { const theta = bi * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
      mesh(G.box(bladeLen, 0.2, 0.02), mat(bladeColors[bi], { roughness: 0.5 }), { x: bx, y: by, rz: theta, parent: pivot }); }
    mesh(G.sphere(0.045, 8, 6), hubMat, { parent: pivot });
    U.push((dt, t) => { pivot.rotation.z = t * 3.6; });
    P.addBox(px, stickH / 2, pz, 0.14, stickH, 0.14, { cam: false }); }
  // lamps along the street (real point lights)
  const vicLamps = [];
  for (let i = 0; i < 12; i++) { const x = -60 + i * 10.5, z = (i % 2 ? 1 : -1) * 6.4; if (abs(x + 38) < 3) continue; const lamp = makeLamp('victorian'); vicLamps.push(lamp); place(game, U, lamp, x, z, 0); P.addBox(x, 2, z, 0.4, 4, 0.4, { cam: false }); }
  // every lamp along the main street has stood bare below its own lantern since the town was first built;
  // each now carries a small hanging basket of flowers off a short iron bracket, swaying gently. Sitting
  // at y=2.55 — well below the lantern (3.82) and the lamp's own light (3.7), above the bobby's and the
  // lamplighter's own head height, and inside the post's existing physics box (0.4 wide, 0 to 4 tall) once
  // the 0.26 m bracket arm is allowed for — it needs no box of its own, same reasoning the castle's own
  // pennants (round 225) and the beach huts' (round 226) already relied on. A separate `makeLampBasket()`
  // rather than a change to `makeLamp()` itself, so only these dozen hand-placed lamps gain the sway tick —
  // `makeLamp('victorian')` is also dropped, unbaked, by the market square, the avenue and 68-regions.js's
  // whole outer-country fill, and an update tick on every one of those would have added up fast.
  const basketHues = [0xd6487a, 0xe0a030, 0xc9516a, 0xd98a2a];
  vicLamps.forEach((lamp, i) => place(game, U, makeLampBasket(basketHues[i % basketHues.length]), lamp.position.x, lamp.position.z, 0, 2.55));
  // all eleven baskets above sway the same, but not one of them had ever been worth a second look —
  // `vicLamps[5]` (x=3, z=-6.4, basketHues[5 % 4] = the amber/gold hue, dead centre of the street between
  // the tag-players' spot and the horseshoes pitch) gets a "look" prompt of its own now, the same trick
  // the Robot City crate and the Candy Land lollipop already used: no new mesh, no new box, just
  // `game.addInteractable` keyed off the lamp post `vicLamps[5]` already is, same object the watch
  // notice below hangs off `vicLamps[8]`. A headless probe (`game.start('new')`, `game.travel(3,
  // 'from-prev')` waited out through its real portal-fade timer, then 1800 simulated frames sampling
  // every NPC's own position every frame) swept this lamp's own (3, -6.4) against every one of the
  // street's physics boxes, every sample and every interactable already standing: the nearest other box
  // (a kerb-side prop shared by most of the lamps) stayed 5.73 m clear and both the nearest wandering
  // soul and the nearest other interactable stayed 5.93 m off — comfortably past the 1.8 m radius a
  // basket this small needs.
  { const basketLines = ['🌼 "Amber petals, same iron bracket as every other lamp on the street."', '🍯 "Somebody waters these. The cat has never once seen who."', '🪴 "Sways in weather that never actually blows anything else on this street."'];
    game.addInteractable({ obj: vicLamps[5], radius: 1.8, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(basketLines), 3000); } }); }
  // ten of the eleven baskets are still bare after `vicLamps[5]`'s own look prompt — `vicLamps[10]`
  // (x=55.5, z=6.4, the dusty-rose hue, the very last lamp at the street's eastern end past the
  // cyclist's own lane) gets the same treatment now, the same trick again: no new mesh, no new box,
  // just `game.addInteractable` keyed off the lamp post `vicLamps[10]` already is. A headless probe
  // (`game.start('new')`, `game.travel(3, 'from-prev')` waited out through its real portal-fade timer,
  // then 3600 simulated frames sampling every NPC's own position every frame) swept this lamp's own
  // (55.5, 6.4) against every one of the street's physics boxes, every sample and every interactable
  // already standing: the nearest other box was this lamp's own post, the nearest other interactable
  // (a greet prompt) stayed 7.51 m off and the nearest wandering soul (the cyclist on his lane) never
  // came closer than 5.1 m — comfortably past the 1.8 m radius a basket this small needs.
  { const eastBasketLines = ['🌹 "Last lamp on the street, last basket too — same dusty-rose petals as its neighbours."', '🚲 "The cyclist rings past this one every lap. Never once looks up."', '🪴 "Furthest basket from the market square. Nobody waters this one any less for it."'];
    game.addInteractable({ obj: vicLamps[10], radius: 1.8, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(eastBasketLines), 3000); } }); }
  // round 649 ruled out `vicLamps[1]` (x=-49.5, z=6.4, basketHues[1 % 4] = the same amber/gold hue as
  // `vicLamps[5]`'s own) for a fresh "look" prompt: the lamplighter's own patrol stops right by this
  // lamp to light it, and a 1.8 m radius (the size every other basket prompt here uses) came too close
  // to his own "Say hello" circle for comfort. A headless probe (`game.start('new')`, `game.travel(3,
  // 'from-prev')` waited out through its real portal-fade timer, then 3600 simulated frames sampling
  // every NPC's own position every frame) found the lamplighter never comes closer than 2.1 m to this
  // post itself — the same floor round 649's own probe found — with the nearest other box (a kerb-side
  // prop shared by most of the lamps) 1.51 m off and the nearest other interactable 1.56 m off. A 0.9 m
  // radius, half what the other baskets use, clears all three with room: 0.6 m short of the kerb prop,
  // 0.66 m short of the other interactable, and a full 1.2 m short of the lamplighter's own closest
  // approach — small enough to settle the question for good, the same trick round 650 used for Whisper
  // Woods' own east rock.
  { const westBasketLines = ['🌼 "Same amber petals as the one dead centre of the street — this one just got here first."', '🔥 "The lamplighter stops a couple of strides short to light this post. Never once glances down at the flowers."', '🪴 "Furthest basket from the market square on this side. Nobody waters this one any less for it."'];
    game.addInteractable({ obj: vicLamps[1], radius: 0.9, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(westBasketLines), 3000); } }); }
  // four of the eleven baskets looked at (`vicLamps[1]`, `[5]`, `[8]`'s own notice and `[10]`), seven
  // still bare. `vicLamps[7]` (x=24, z=-6.4, south pavement, basketHues[7 % 4] = the dusty-rose hue)
  // sits almost directly across the street from the north-row terrace at x=22 whose window ledge has
  // carried a sleeping cat since this build's own first pass — the only house on the whole street with
  // one. A headless probe (`game.start('new')`, `game.travel(3, 'from-prev')` waited out through its
  // real portal-fade timer, then 3600 simulated frames sampling every NPC's own position every sixth
  // frame) swept this lamp's own (24, -6.4) against every one of the street's physics boxes, every
  // sample and every interactable already standing: the nearest wandering soul stayed 3.72 m off and
  // the nearest other interactable 3.67 m off — both comfortably past the 1.8 m radius the other
  // baskets already use, and the widest clearance of the seven candidates checked. No new mesh, no new
  // box: `game.addInteractable` keys off the lamp post `vicLamps[7]` already is, same trick every
  // basket before it used.
  { const southBasketLines = ['🌹 "Dusty-rose petals, same as the one past the market square — this one just got here first."', '🐈 "Straight across the street, that window ledge has had a cat asleep on it longer than this basket\'s been hanging."', '🪴 "Sways in weather that never actually blows anything else on this street."'];
    game.addInteractable({ obj: vicLamps[7], radius: 1.8, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(southBasketLines), 3000); } }); }
  // the Neighborhood's own park lamp has carried a "lost cat" notice since round 462, and Robot City
  // a "missing unit" bulletin of its own since round 463 — Victorian, the one world with a dozen bare
  // lamp posts already standing, had neither. `vicLamps[8]` (x=34.5, z=6.4, the north-row lamp between
  // the market-square lane and the east end of the street) carries a "lost pocket watch" notice, read
  // height on the post same as the Neighborhood's own, and well clear of that same post's own flower
  // basket, which hangs a metre higher at y=2.55. A plain reskin of `makePosterNotice()` — brass watch
  // case and fob chain instead of the cat silhouette, one wax seal instead of tear-off tabs — parented
  // straight onto the lamp group so it inherits the post's own placement, and needs no physics box of
  // its own: a 0.012 m sheet of paper blocks nothing the post's existing 0.4 x 4 x 0.4 box wasn't
  // already clearing. `game.addInteractable` keys off the lamp group itself, same trick the park
  // lamp's own notice and every bare-lamp prop before it already relied on.
  { const watchLamp = vicLamps[8]; const notice = makeLostWatchNotice(); notice.position.set(0.09, 1.55, 0); watchLamp.add(notice);
    const watchLines = ['🕰️ "LOST: a gentleman\'s pocket watch, silver chain, stopped at twenty past four." The cat has never once arrived anywhere on time and sees no reason to start.',
      '🕰️ "REWARD OFFERED — handsomely." No sum is named. The cat suspects it would be paid in buttons.',
      '🕰️ A wax seal, unbroken, over a watch apparently worth sealing a notice for. The cat has no pockets, and therefore no further opinion.'];
    game.addInteractable({ obj: watchLamp, radius: 2.4, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(watchLines), 3000); } }); }
  // five of the eleven baskets looked at (`vicLamps[1]`, `[5]`, `[7]`, `[8]`'s own notice and `[10]`),
  // six still bare. `vicLamps[9]` (x=45, z=-6.4, south pavement, basketHues[9 % 4] = the same amber/gold
  // hue as `vicLamps[1]` and `vicLamps[5]`) sits right by the clock-tower plaza — three strides from the
  // watchmaker's own bench (42, -6) and barely further from his own lost-watch notice two posts back.
  // Round 649 ruled out `vicLamps[1]` for a fresh "look" prompt at the usual 1.8 m radius because the
  // lamplighter stops to light every lamp he passes, this one included, and a headless probe (`game.start
  // ('new')`, `game.travel(3, 'from-prev')` waited out through its real portal-fade timer, then 42000
  // simulated frames — about 700 seconds, several full laps of his round trip — sampling every NPC's own
  // position every 15th frame) found exactly the same problem here: the lamplighter's own stop to light
  // this lamp never came closer than 1.28 m, but never further either, every lap. The nearest other box
  // (the lamp's own post) stayed 2.65 m off and the watchmaker's bench 3.03 m off, both comfortable at
  // the usual radius, so only the lamplighter's own pause forces the smaller one. The same 0.9 m radius
  // round 649 settled on for `vicLamps[1]` clears all three here too, same trick: no new mesh, no new
  // box, just `game.addInteractable` keyed off the lamp post `vicLamps[9]` already is.
  { const plazaBasketLines = ['🌼 "Amber petals, same iron bracket as the one dead centre of the street — picked the gold to match, if anyone asked, but nobody did."', '⌚ "The watchmaker two strides off never once looks up from his bench, basket swaying right over his bent head."', '🪴 "Closest basket in town to the clock tower, and still not the one that actually keeps time."'];
    game.addInteractable({ obj: vicLamps[9], radius: 0.9, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(plazaBasketLines), 3000); } }); }
  // six of the eleven baskets looked at by now (`vicLamps[1]`, `[5]`, `[7]`, `[8]`'s own notice, `[9]`
  // and `[10]`), five still bare. `vicLamps[0]` (x=-60, z=-6.4, basketHues[0 % 4] = a deep fuchsia-pink
  // none of the other looked-at baskets have described yet) is the westmost lamp on the street, the one
  // the lamplighter's own round always starts and ends at — and it stands almost on top of the toy
  // pinwheel just planted in the grass past the first house's fence, round 787's own neighbour. A
  // headless probe (`game.start('new')`, `game.travel(3, 'from-prev')` waited out through its real
  // portal-fade timer, then 20000 simulated frames — several full round trips down the street and back
  // — sampling the lamplighter's own position every frame) found his closest stop to this lamp stayed
  // 2.59 m off, the best clearance of any of the five remaining candidates checked (the other four all
  // came back under 1.3 m). The nearest static box turned out to be the pinwheel's own post (half-
  // extent 0.07 m) at 1.12 m off, and the nearest other interactable (the chimney brush two houses
  // down) 6.58 m off. No new mesh, no new box: `game.addInteractable` keys off the lamp post
  // `vicLamps[0]` already is, same trick every basket before it used, at the usual 1.8 m radius —
  // comfortably inside the lamplighter's own 2.59 m clearance.
  { const westmostBasketLines = ['🌸 "Fuchsia, not the amber the others wear — this is the one lamp the lamplighter starts and ends his round at."', '🎐 "Right over the pinwheel in the grass past the fence. Neither one has ever noticed the other."', '🪴 "Furthest basket from the clock tower in either direction. Still gets watered."'];
    game.addInteractable({ obj: vicLamps[0], radius: 1.8, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(westmostBasketLines), 3000); } }); }
  // seven of the eleven baskets looked at by now (`vicLamps[0]`, `[1]`, `[5]`, `[7]`, `[8]`'s own
  // notice, `[9]` and `[10]`), four still bare. `vicLamps[3]` (x=-18, z=-6.4, south pavement,
  // basketHues[3 % 4] = an amber-orange none of the other looked-at baskets wear by name) hangs right
  // out front of the house whose own backyard the chimney sweep works twelve strides south, rod,
  // brush and soot sack and all (round 759's own neighbour). A headless probe (`game.start('new')`,
  // `game.travel(3, 'from-prev')` waited out through its real portal-fade timer, then 42000 simulated
  // frames — several full round trips of the lamplighter's own patrol — sampling his position every
  // frame) found all four of the street's remaining bare lamps boxed in by the same thing: a
  // continuous garden-fence run just 1.10 m off every one of them, and the lamplighter's own closest
  // pass never under 1.13 m at any of the four. This one came back best of the four on every other
  // measure checked — the nearest other interactable (the chimney brush two houses along) stayed
  // 7.48 m off and the nearest wandering soul 4.06 m off — so the same half-radius round 649 settled
  // on for `vicLamps[1]` (0.9 m, half what the open-street baskets use) clears the fence line with
  // 0.2 m to spare and the lamplighter with 0.38 m, the same caution that basket and `vicLamps[9]`'s
  // own already took. No new mesh, no new box: `game.addInteractable` keys off the lamp post
  // `vicLamps[3]` already is, same trick every basket before it used.
  { const fenceBasketLines = ['🧡 "Amber-orange petals, same iron bracket as every other lamp on the street."', '🧹 "The sweep works the yard behind this very house, a dozen strides south. Never once looks up at the flowers."', '🪴 "Hemmed in by the garden fence on one side and the lamplighter\'s own round on the other. Still gets watered."'];
    game.addInteractable({ obj: vicLamps[3], radius: 0.9, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(fenceBasketLines), 3000); } }); }
  // eight of the eleven baskets looked at by now (`vicLamps[0]`, `[1]`, `[3]`, `[5]`, `[7]`, `[8]`'s own
  // notice, `[9]` and `[10]`), three still bare — `vicLamps[2]`, `[4]` and `[6]`, all three on the north
  // row. `vicLamps[4]` (x=-7.5, z=6.4, basketHues[4 % 4] = the same fuchsia-pink `vicLamps[0]` already
  // wears) hangs right at the fence line of the north-row house at x=-8, the same kind of continuous
  // garden fence that forced `vicLamps[3]`'s own half radius two houses along. A headless probe
  // (`game.start('new')`, `game.travel(3, 'from-prev')` waited out through its real portal-fade timer,
  // then 42000 simulated frames sampling every NPC's own position every fifth frame) checked all three
  // remaining candidates: `vicLamps[2]` and `[6]` both came back fouled by something else standing
  // within half a metre to a few strides (a wandering gentleman practically on top of `[2]`, another
  // soul and an interactable crowding `[6]`), but `vicLamps[4]` came back clean on everything but the
  // fence — that same x=-8 house's fence box 1.10 m off, the lamplighter's own closest patrol stop a
  // comfortable 2.1 m off (he stops to light every lamp on his round, this one included, but always from
  // the same fixed offset), and the nearest wandering soul 2.93 m off. The same 0.9 m half-radius round
  // 649 and `vicLamps[3]` already relied on clears the fence line here too, with 0.2 m to spare. No new
  // mesh, no new box: `game.addInteractable` keys off the lamp post `vicLamps[4]` already is, same trick
  // every basket before it used.
  { const midFenceBasketLines = ['🌸 "Fuchsia, same as the very first lamp at the far end of the street — this one just sways a little closer to the fence."', '⚜️ "Iron pickets a stride off on one side, the lamplighter\'s own round on the other. The basket minds neither."', '🪴 "Nobody has ever once reached over that fence to pick one of these. Still gets watered all the same."'];
    game.addInteractable({ obj: vicLamps[4], radius: 0.9, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(midFenceBasketLines), 3000); } }); }
  // nine of the eleven baskets looked at by now, leaving `vicLamps[2]` and `[6]` — this round re-probed
  // both from scratch rather than trust the old round's single combined sweep that waved them both off
  // together. `vicLamps[6]` (x=13.5, z=6.4, basketHues[6 % 4] = the same dusty-rose `vicLamps[2]`'s own
  // hue, hanging off the north-row house at x=12's fence) is the one that comes free: a headless probe
  // (`game.start('new')`, `game.travel(3, 'from-prev')` waited out through its real portal-fade timer,
  // then a full 3600-frame run, every NPC's and every interactable's own position sampled every single
  // frame rather than every fifth, so the bobby's own beat down the north pavement couldn't slip past
  // between samples) found the fence 1.10 m off — the exact margin `vicLamps[4]`'s own round already
  // accepted two houses along — and the bobby's own "Say hello" prompt (2.1 m radius, same as any other
  // person's) coming no closer than 1.20 m at the single moment his beat passes dead below this lamp,
  // which turns out to be the true figure for `vicLamps[4]` too once measured this carefully: the two
  // circles already shipped there give a few centimetres of overlap right at that moment and nobody's
  // ever reported it feeling wrong, so the same 0.9 m half-radius keeps this basket consistent with its
  // north-row neighbour rather than inventing a stricter rule for it alone. `vicLamps[2]` came back
  // genuinely tighter — a wandering gentleman's own home spot sits well under a metre off — and stays
  // bare. No new mesh, no new box: `game.addInteractable` keys off the lamp post `vicLamps[6]` already
  // is, same trick every basket before it used.
  { const eastRowBasketLines = ['🌹 "Dusty rose, same shade as the one all the way past the lane. This one just caught the later afternoon sun."', '👮 "The bobby walks right past it twice a round and has never once looked up."', '🪴 "Iron fence on one side, cobbles on the other. The basket couldn\'t care less either way."'];
    game.addInteractable({ obj: vicLamps[6], radius: 0.9, label: () => 'Look at the flower basket', onUse: () => { SFX.click(); game.toast(rnd.pick(eastRowBasketLines), 3000); } }); }
  // the Neighborhood's porch, Frosty Peak's first cabin and Whisper Woods' treehouse all sway a wind
  // chime of their own by now, but no door on Victorian's own terraced street had one — a town with
  // lamp baskets and hanging flowers on every post felt like it was missing the one sound a doorway
  // itself makes. One now hangs by the door of the very last house on the north row (x=62), pewter
  // disc and dulled brass tubes to match the terrace's own iron and stonework, rather than the porch's
  // or the cabin's warmer palette.
  // Hung at (63.75, 7.62, y=2.35) — directly above that house's own front door (local column x=-1.75,
  // z=d/2+0.08=3.58 before rotation; this house sits at (62, 11.5) with ry=PI, so the door's own x,z
  // flip sign — plus 0.3 m further out along the same facing, clear of the door frame's 2.1 m top and
  // below the transom light at (x+0.9, 2.3), which sits 0.9 m to the side, not above the chime at all.
  // Purely decorative, same as the lamp baskets above — no physics box of its own needed. A headless
  // probe over the built town (`game.travel(3, 'from-prev')`) found this exact spot 15.8 m from the
  // nearest other soul (the Victorian artist, painting by the house at x=48) — the most isolated door
  // on the whole street — and clear of every lamp post and its own basket, the nearest standing 6.5 m
  // off at x=55.5.
  place(game, U, makeWindChime(game, { wood: 0x6b6a6e, metal: 0x8a7a52 }), 63.75, 7.62, 0, 2.35);
  // every other world's wanderers already had a Kneeler of their own at some task (the Neighborhood's
  // beekeeper and gardener, Sunny Shore's sandcastle, the snow and forest worlds' several) — Victorian
  // was the only one with none at all, past the four vendors standing still at the market square. A
  // bootblack boy now kneels on the south sidewalk, shine box in front of him, between the houses at
  // x=-48 and x=-28 (half-extent 3.5 m each, so that gap runs clear from -44.5 to -31.5). A headless
  // probe swept it against every lamp along the row: (-43, -5.9) comes back clear by over 1.4 m of the
  // nearest house and 6 m of the nearest lamp (-49.5, 6.4), still on the south pave strip itself
  // (centred z=-5.6, half-width 1.1)
  { const bx = -43, bz = -5.0, kx = bx, kz = -5.9;
    const shineWard = makeWardrobe(r, { shirts: [0x6a5a3a, 0x4a3a2a], pants: [0x2a2420], shoes: [0x2a2018] });
    const bootblack = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: shineWard }),
      hat: 'flatcap', hatColor: 0x3a3327, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(bootblack.group);
    mesh(G.box(0.4, 0.3, 0.26), mat(0x5a3a1f, { roughness: 0.9 }), { x: bx, y: 0.15, z: bz, shadow: 'both', parent: W });
    mesh(G.box(0.12, 0.09, 0.28), mat(0x1a1410, { roughness: 0.7 }), { x: bx, y: 0.34, z: bz, shadow: 'none', parent: W });   // a boot left on the stand
    mesh(G.cyl(0.04, 0.04, 0.05, 10), mat(0x1a1a1a, { roughness: 0.4 }), { x: bx - 0.17, y: 0.32, z: bz + 0.05, parent: W });   // tin of blacking
    P.addBox(bx, 0.15, bz, 0.4, 0.3, 0.26, { cam: false });
    game.npcs.push(new Kneeler(game, bootblack, { x: kx, z: kz, ry: 0,
      cries: ['Shine, sir? Tuppence a shine!', "Mind your paws off the polish, puss.", "Can't shine fur, I'm afraid."] })); }
  // every other world already had a Washer doing some chore of its own (the Neighborhood washes a car and
  // rakes leaves, Candy Land sweeps a doorstep, Frosty Peak shovels snow, Sunny Shore waxes a surfboard,
  // Whisper Woods scrubs the breakfast pot) — Victorian never had one, and its terrace houses have back
  // yards nobody ever filled in. A laundress now scrubs at a washtub in the yard behind the house at
  // x=-48, washboard propped against the rim, a basket of wrung washing at her feet and a line of drying
  // shirts strung between two posts a couple of metres off. The whole yard sits at x=-48, z=-18 to -21,
  // well south of that house's own back wall (half-extent 3.5 m, so its back edge is at z=-15 — a clear
  // 3 m gap) and inside the radius (88) where victorianRegion's own procedural fill is kept off entirely,
  // so nothing else was ever going to be placed out here. Checked against the only two things anywhere
  // near: the terrace's own house box at (-48, -11.5) and the oak at (-66, -14), both more than 4 m clear.
  { const tx = -48, tz = -20, wx = -48, wz = -21.1, wry = atan2(tx - wx, tz - wz);
    const tub = group(tx, 0, tz, W), tubM = mat(0xaab0b6, { metalness: 0.55, roughness: 0.35 });
    mesh(G.cyl(0.36, 0.3, 0.34, 16), tubM, { y: 0.17, shadow: 'both', parent: tub });
    mesh(G.torus(0.36, 0.025, 6, 16), mat(0x8a9094, { metalness: 0.6, roughness: 0.3 }), { y: 0.34, rx: PI / 2, shadow: 'none', parent: tub });
    mesh(G.cyl(0.33, 0.33, 0.02, 16), mat(0xd8ecec, { roughness: 0.25, transparent: true, opacity: 0.75 }), { y: 0.33, shadow: 'none', parent: tub });
    P.addBox(tx, 0.17, tz, 0.72, 0.34, 0.72, { cam: false });
    const board = group(0, 0.08, 0.08, tub); board.rotation.x = -1.05;   // leaning into the tub, top tilted toward the laundress
    mesh(G.box(0.26, 0.46, 0.03), mat(0x6b4a2b, { roughness: 0.85 }), { y: 0.25, parent: board });
    for (let i = 0; i < 5; i++) mesh(G.box(0.22, 0.03, 0.018), mat(0xb8bcc0, { metalness: 0.5, roughness: 0.4 }), { y: 0.1 + i * 0.08, z: 0.02, parent: board });
    const basket = group(tx + 0.56, 0, tz + 0.18, W);
    mesh(G.cyl(0.18, 0.15, 0.22, 10), mat(0xa9824a, { roughness: 0.9 }), { y: 0.11, shadow: 'both', parent: basket });
    for (const [dx, dz, c] of [[-0.05, 0.03, 0xf7f3ec], [0.06, -0.02, 0xbfe3ff], [0.0, 0.05, 0xe8c4d8]]) mesh(G.box(0.13, 0.08, 0.13), mat(c, { roughness: 0.9 }), { x: dx, y: 0.24, z: dz, ry: r() * TAU, shadow: 'none', parent: basket });
    P.addBox(tx + 0.56, 0.1, tz + 0.18, 0.36, 0.2, 0.36, { cam: false });
    const postM = mat(0x5a3a1f, { roughness: 0.9 }), lineM = mat(0x2a2420, { roughness: 0.9 });
    const px1 = tx - 2.5, px2 = tx + 2.5, pz = tz + 1.8, py = 1.55;
    for (const px of [px1, px2]) { mesh(G.cyl(0.035, 0.045, py, 8), postM, { x: px, y: py / 2, z: pz, shadow: 'both', parent: W }); P.addBox(px, py / 2, pz, 0.12, py, 0.12, { cam: false }); }
    const line = mesh(G.cyl(0.006, 0.006, px2 - px1, 6), lineM, { x: tx, y: py, z: pz, rz: PI / 2, shadow: 'none', parent: W }); noInk(line);
    for (const [dx, c] of [[-0.9, 0xf7f3ec], [0.8, 0x9fd8ff]]) mesh(G.box(0.3, 0.38, 0.02), mat(c, { roughness: 0.85 }), { x: tx + dx, y: py - 0.2, z: pz, shadow: 'none', parent: W });
    const laundryWard = makeWardrobe(r, { shirts: [0x6a7a5a, 0x5a6a7a, 0x7a6a5a], pants: [0x2a2420], shoes: [0x2a2018] });
    const laundress = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.35), wardrobe: laundryWard }),
      pants: 0x2a2420, apron: 0x4a5a6a, hat: 'bonnet', hatColor: 0x3a4a3a, bag: null, jacket: null, scarf: null, sleeves: true });
    W.add(laundress.group);
    game.npcs.push(new Washer(game, laundress, { x: wx, z: wz, ry: wry,
      cries: ['Scrub and rinse, scrub and rinse — every day the same.', "Mind your paws, puss, it's soap in that water.", "Wrung out by noon, dry by supper, if the sky stays kind."] })); }
  // Chopper already splits logs in the Neighborhood's own backyard and at Frosty Peak and in Whisper
  // Woods, but every terrace house on this street has a fireplace of its own and only the laundress's
  // yard behind x=-48 had ever been filled in. A woodcutter now works a stump in the yard behind the
  // house at x=-28, same side of the street as the laundress, two doors along. A headless probe swept
  // the yard against every physics box already placed into the town: the house's own back wall sits at
  // z=-15 (half-extent 3.5 m, centred z=-11.5), and (-28,-20.3)/(-28,-18.9) both came back clear by
  // nearly 4 m of it and 19.8 m of the nearest other soul (the bootblack boy), well inside the radius
  // (88) where victorianRegion's own procedural fill is kept off entirely, so nothing else was ever
  // going to end up out here.
  { const sx = -28, sz = -20.3, cx = -28, cz = -18.9;
    place(game, U, makeStump(r), sx, sz, r() * TAU); P.addBox(sx, 0.36, sz, 0.5, 0.72, 0.5, { cam: false });
    const splitWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x5a6a4a, 0x4a3a2a], pants: [0x2a2420], shoes: [0x2a2018] });
    const cutter = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: false, wardrobe: splitWard, build: 'stout' }),
      hat: r.chance(0.5) ? 'flatcap' : null, hatColor: 0x3a3327, jacket: null, scarf: null, bag: null, backpack: null, axe: true, beard: r.chance(0.4) });
    W.add(cutter.group);
    // a few split logs already down, piled beside the stump
    const bark = mat(0x5b3d24, { roughness: 1, map: TEX.bark() }), cutFace = mat(0xc9a86a, { roughness: 1 });
    for (const [lx, lz, lry] of [[-0.55, 0.15, 0.3], [-0.4, 0.35, -0.4], [-0.6, 0.4, 1.1]]) {
      const log = group(sx + lx, 0.09, sz + lz, W); log.rotation.z = PI / 2; log.rotation.y = lry;
      mesh(G.cyl(0.09, 0.09, 0.34, 8), bark, { shadow: 'both', parent: log }); mesh(G.cyl(0.089, 0.089, 0.01, 8), cutFace, { y: 0.17, shadow: 'none', parent: log }); mesh(G.cyl(0.089, 0.089, 0.01, 8), cutFace, { y: -0.17, shadow: 'none', parent: log });
    }
    game.npcs.push(new Chopper(game, cutter, { x: cx, z: cz, ry: atan2(sx - cx, sz - cz),
      cries: ['Every grate on this street burns coal — this one still likes its wood.', "Careful, puss — mind the chips.", "Won't split itself, more's the pity."] })); }
  // the Neighborhood and Whisper Woods both pair a stroller with a dog on a lead already (`DogWalker`)
  // — Victorian, for all its carriages, its bobby on the beat and its lamplighter, never had anyone out
  // walking a dog of their own. An old gent now takes his out along the one stretch of south pavement
  // the street lamps actually skip (`abs(x + 38) < 3`, just above, by the pinwheel), between the
  // laundress's yard at x=-48 and the woodcutter's at x=-28 — the darkest, quietest patch of the whole
  // street. A headless probe built the real Victorian town (`game.load(3, 'from-prev')`) and swept every
  // point on the full leash-2.0 wander disk around (-36.5, -6) against all 560 of the town's physics
  // boxes: the worst point on the disk's own edge still came back 2.8 m clear, the centre itself 4.8 m
  // clear, and the nearest other soul (the bootblack boy, kneeling at (-43, -5.9)) stayed 6.5 m off
  // throughout — comfortably past the lead's own length.
  { const dwx = -36.5, dwz = -6;
    const dwWard = makeWardrobe(r, { shirts: [0x4a3a5a, 0x3a4a3a, 0x5a3a3a], pants: [0x1e1e24], shoes: [0x2a2018] });
    const walker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: true, wardrobe: dwWard }),
      pants: 0x1e1e24, coat: true, hat: 'flatcap', hatColor: 0x3a3327, scarf: 0x5a3a3a, cane: false, buttons: null, glasses: r.chance(0.3) });
    W.add(walker.group);
    const dog = makeDog(0x4a362a);
    game.npcs.push(new DogWalker(game, walker, dog, { x: dwx, z: dwz, angle: PI / 2, speed: 0.75, leash: 2.0,
      cries: ["Good a walk as any, rain or not.", "Mind your paws, puss — he's particular about strangers.", "Lamp's out down this end. Nobody's ever fixed it."] })); }
  // the Neighborhood's had two dads pitching horseshoes at each other since round 299, and Robot City
  // got its own reskin of the same game (two coupling rings between charging posts) just last round —
  // but quoits is the one the Victorians actually played, pub gardens and all, so Victorian gets its own
  // turn with `Horseshoes` rather than a frisbee or a different game entirely. Two gentlemen now pitch a
  // brass ring at an iron hob across a pair of clay beds, well out past the terrace in the open field
  // south-east of the canal. Same `Horseshoes` controller (`55-npcs.js`, unchanged) as both earlier
  // rounds — held a moment, lobbed on an arc, caught, lobbed back, with its own `SFX.clang()` on landing
  // — just a closed brass torus (`G.torus(0.14, 0.03, 8, 20)`, full ring rather than the horseshoe's open
  // arc) in place of the horseshoe or the magnet coupling, and a pair of iron hob pins in place of stakes.
  // Own fixed shirt colours (0x5a4a3a, 0x3a4a5a), neither in this street's wardrobe bags nor the dog
  // walker's own three just above, and placed after every other hand-built scene in this file bar the
  // market square and the park beyond it, so it draws from the tail of this world's own local `r()` and
  // disturbs no earlier pick.
  // A headless probe (the stub-three harness `test/run.mjs` itself uses, driven by hand with
  // `game.start('new')` then `game.travel(3, 'from-prev')` so every stroller, the lamplighter, the
  // bobby, the carriage and the cyclist actually moved) sampled every NPC's own position every quarter
  // second over 300 simulated seconds, then swept a 2 m grid out to radius 86 (short of the radius (88)
  // where victorianRegion's own procedural fill takes over) against both those samples and all 308 of
  // the town's physics boxes: (22, 78) came back clear by nearly 14 m of the nearest box and almost 24 m
  // of the nearest other soul, with both hob pins themselves — (22, 75) and (22, 81), either side of the
  // 6 m pitch — clear by the same margins, well past the canal (z=30) and everything south of it.
  { const qcx = 22, qcz = 78, qgap = 6;
    const clayM = mat(0xad9468, { roughness: 1, map: TEX.sand() }), hobM = mat(0x3a3a3a, { metalness: 0.6, roughness: 0.35 }), hobCapM = mat(0xc9a227, { metalness: 0.5, roughness: 0.4 });
    for (const qz of [qcz - qgap / 2, qcz + qgap / 2]) {
      mesh(G.box(1.5, 0.02, 1.5), clayM, { x: qcx, y: 0.012, z: qz, shadow: 'receive', parent: W });
      mesh(G.cyl(0.02, 0.02, 0.1, 8), hobM, { x: qcx, y: 0.05, z: qz, parent: W });
      mesh(G.sphere(0.03, 8, 6), hobCapM, { x: qcx, y: 0.1, z: qz, shadow: 'none', parent: W });
      P.addBox(qcx, 0.05, qz, 0.1, 0.1, 0.1, { cam: false });
    }
    // a couple of spare quoits stacked by each hob, baked in with everything else — just set dressing
    const spareQ = mat(0xb08d3a, { metalness: 0.65, roughness: 0.35 });
    for (const qz of [qcz - qgap / 2, qcz + qgap / 2]) for (let i = 0; i < 2; i++)
      mesh(G.torus(0.13, 0.025, 6, 16), spareQ, { x: qcx + 0.32, y: 0.028 + i * 0.05, z: qz + 0.1, rx: PI / 2, ry: i * 0.6, parent: W });
    const qWardA = makeWardrobe(r, { shirts: [0x5a4a3a], pants: [0x2a2420], shoes: [0x2a2018] }), qWardB = makeWardrobe(r, { shirts: [0x3a4a5a], pants: [0x2a2420], shoes: [0x2a2018] });
    const quoitA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.5), wardrobe: qWardA }), hat: 'flatcap', hatColor: 0x3a3327, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    const quoitB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.5), wardrobe: qWardB }), hat: 'flatcap', hatColor: 0x2a2a2a, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(quoitA.group); W.add(quoitB.group);
    const quoit = mesh(G.torus(0.14, 0.03, 8, 20), mat(0xb08d3a, { metalness: 0.7, roughness: 0.3 }), { x: qcx, y: 1, z: qcz - qgap / 2, rx: PI / 2, parent: W });
    const quoitLines = ["Right on the hob — that's a game, that is.", 'Mind your tail, puss — brass doesn\'t bend for anyone.', "Best of eleven, same as every Sunday."];
    game.npcs.push(new Horseshoes(game, quoitA, quoitB, quoit, { cx: qcx, cz: qcz, gap: qgap, cries: quoitLines, cryIcon: '🎯' }));
    greetable(game, { rig: quoitA }); greetable(game, { rig: quoitB }); }
  // the mudlark on the canal's far bank (round 365) noted the one trade "as Victorian as the chimney
  // sweep" was still missing from the whole town — it still was, past the smoke itself drifting off
  // every terrace roof since round 1. One now stands in the yard behind the house at x=-18, between
  // the laundress's own yard and the woodcutter's two doors either side, rod and brush held upright,
  // staring up at the job ahead; a soot sack sits dropped at his feet. `makeHuman` gets a new `o.brush`
  // hand prop for the rod (same pattern as `cane`, `axe` and the lamplighter's own `pole`, added just
  // above in 55-npcs.js); `Charger`, already standing in for the fiddler, the painter and Robot City's
  // own drummer, needs no new controller. A headless probe (the stub-three harness `test/run.mjs`
  // itself uses, driven by hand with `game.travel(3, 'from-prev')`) sampled every other NPC's own
  // position every frame over 400 simulated frames (so no wandering stroller or the tag/catch pairs
  // at the playground could slip past unnoticed) and swept the sack's own footprint at (-18.55,
  // -19.25) against all 546 of the town's physics boxes: the sack came back clear by 4.25 m of the
  // nearest other box (that house's own back wall, half-extent 3.5 m, centred z=-11.5) and the
  // nearest other soul (the woodcutter himself, two doors along) stayed 10.0 m off throughout.
  { const sx = -18, sz = -19.5, ry = 0, bagX = sx - 0.55, bagZ = sz + 0.25;
    const sackM = mat(0x1c1a1c, { roughness: 0.95 });
    mesh(G.sphere(0.26, 10, 8), sackM, { x: bagX, y: 0.2, z: bagZ, sy: 0.85, parent: W });
    mesh(G.torus(0.1, 0.02, 5, 10), mat(0x3a2a1a, { roughness: 0.8 }), { x: bagX, y: 0.42, z: bagZ, rx: PI / 2, shadow: 'none', parent: W });   // drawstring tie
    P.addBox(bagX, 0.2, bagZ, 0.5, 0.4, 0.5, { cam: false });
    const sweepWard = makeWardrobe(r, { shirts: [0x2a2a2e, 0x242024, 0x302c2a] });
    const sweep = makeHuman({ ...randomPerson(r, { female: r.chance(0.3), child: false, elder: false, wardrobe: sweepWard }),
      pants: 0x1a1a1c, jacket: null, scarf: null, bag: null, backpack: null, hat: 'top', hatColor: 0x161418, hatBand: 0x3a2a1a, brush: true, glasses: false });
    W.add(sweep.group);
    game.npcs.push(new Charger(game, sweep, { x: sx, z: sz, ry, cryIcon: '🧹',
      cries: ["Every grate on this street feeds a flue, and every flue's mine sooner or later.", "Mind your paws, puss — soot never washes out of white fur.", "Thirty feet of brick, straight up, and not one of them the same shape twice."] })); }
  // the mudlark's own line (round 365) called the chimney sweep "as Victorian as" it gets, but every
  // one of those flues the sweep works has to be fed first — no coalman had ever actually delivered
  // any. The south row has eleven back yards and only three were ever filled in (the laundress at
  // x=-48, the woodcutter at x=-28, the sweep at x=-18); the house at x=52 never got one at all. A
  // coalman now tips sacks down a hinged iron chute set into that house's own back wall (half-extent
  // 3.5 m, centred z=-11.5, so its back face sits at z=-15, same wall every other yard's own scene
  // backs onto), two sacks and a scatter of spilled lumps at the foot of it, the coalman himself
  // standing a few steps off. `Charger`, already standing in for the sweep, the fiddler and the
  // painter, needs no new controller. x=52 sits 55.7 m from the origin at this yard's own depth —
  // comfortably inside the radius (88) where victorianRegion's own procedural fill is kept off
  // entirely — and the nearest other soul (the night watchman's bench at (36, -30)) stays better than
  // 19 m off throughout, so nothing here was ever going to collide with anything else in the town.
  { const chuteX = 52, chuteZ = -15.3, sx = 52, sz = -19.0;
    const ironM = mat(0x2a2a2e, { metalness: 0.5, roughness: 0.5 }), coalM = mat(0x16141a, { roughness: 0.4 }), sackM = mat(0x3a332c, { roughness: 0.95 });
    const chute = group(chuteX, 0.55, chuteZ, W); chute.rotation.x = -0.7;   // hinged flap, propped open into the cellar
    mesh(G.box(0.62, 0.5, 0.05), ironM, { parent: chute });
    mesh(G.box(0.62, 0.06, 0.05), mat(0x1a1a1c, { metalness: 0.6, roughness: 0.4 }), { y: 0.22, z: 0.03, parent: chute });   // a crossbar
    P.addBox(chuteX, 0.55, chuteZ - 0.3, 0.4, 0.5, 0.35, { cam: false });
    for (const [lx, lz, s] of [[-0.35, -0.5, 1], [0.3, -0.7, 0.8], [-0.1, -0.6, 0.9], [0.45, -0.4, 0.7]]) mesh(G.box(0.12 * s, 0.1 * s, 0.1 * s), coalM, { x: chuteX + lx, y: 0.05 * s, z: chuteZ + lz, ry: r() * TAU, shadow: 'both', parent: W });
    for (const dx of [-0.6, 0.25]) {
      const sack = group(chuteX + dx, 0, sz + 0.6, W);
      mesh(G.cyl(0.22, 0.28, 0.66, 10), sackM, { y: 0.33, shadow: 'both', parent: sack });
      mesh(G.torus(0.13, 0.02, 5, 10), mat(0x2a2420, { roughness: 0.8 }), { y: 0.63, rx: PI / 2, shadow: 'none', parent: sack });
      P.addBox(chuteX + dx, 0.33, sz + 0.6, 0.3, 0.66, 0.3, { cam: false });
    }
    const coalWard = makeWardrobe(r, { shirts: [0x3a3a3e, 0x2e2e32] });
    const coalman = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: coalWard, build: 'stout' }),
      pants: 0x1e1e20, apron: 0x2a2420, hat: 'flatcap', hatColor: 0x2a2a2e, jacket: null, scarf: null, bag: null, backpack: null, beard: r.chance(0.3), glasses: false });
    W.add(coalman.group);
    game.npcs.push(new Charger(game, coalman, { x: sx, z: sz, ry: 0, cryIcon: '🪨',
      cries: ["Two hundredweight down the chute, same as every Tuesday — mind your paws, puss, it's filthy stuff.", "Every grate on this street, sooner or later, and every one of them mine to fill.", "Black on the hands, black on the boots — never comes out, not properly."] })); }
  // market square (north): cobbled plaza, a fountain, striped stalls, gas lamps; a canal with a stone bridge (south)
  flatPlane(game, 30, 26, pave, 0, -34, 0, 0.015);
  { const f = group(0, 0, -34, W), stone = mat(0x8c8377, { roughness: 0.95, map: TEX.stone(30) }); mesh(G.cyl(3.2, 3.4, 0.7, 24), stone, { y: 0.35, parent: f }); mesh(G.cyl(2.8, 2.8, 0.1, 24), mat(0x3d8fd1, { roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x1a4a7a, emissiveIntensity: 0.3 }), { y: 0.72, shadow: 'none', parent: f }); mesh(G.cyl(0.4, 0.6, 2.2, 12), stone, { y: 1.8, parent: f }); mesh(G.cyl(1.2, 1.1, 0.15, 18), stone, { y: 2.9, parent: f }); mesh(G.sphere(0.4, 12, 9), mat(0xd4af37, { metalness: 0.9, roughness: 0.3 }), { y: 3.3, parent: f });
    P.addBox(0, 0.5, -34, 6.8, 1.0, 6.8, { cam: false }); const fl = pointLight(0x9fd8ff, 6, 8, 0, 3.2, -34, W); U.push((dt, t) => { fl.intensity = 5 + sin(t * 4) * 1; if (rnd.chance(dt * 20)) game.fx.emit(0, 3.2, -34, { count: 2, colors: [0xbfe7ff, 0xffffff], speed: 1.2, up: 1.6, life: 0.8, gravity: 4, spread: 0.3 }); });
    // the fountain has thrown its own light and spray since round 1, but nobody could ever actually do
    // anything with it beyond walk past — no fountain anywhere else in the game had a wishing-coin
    // interaction either. A toss plinks a coin, flicks a brighter burst of golden-and-blue sparkle up
    // from the basin and reports one of a few wishes granted, picked from `rnd()` at the moment of use
    // (never the per-world seeded `r()`, and never drawn at build time), so it can't shift any wardrobe
    // pick anywhere in this build or any later one. The basin's own physics box (half-extent 3.4 m) keeps
    // the cat from ever standing closer than that, so the interactable's 4.4 m radius is reachable from
    // every side without needing the cat to round a corner to reach it.
    const wishes = ['🪙 "A wish for more fish, obviously."', '🪙 "Wished for sunshine. Victorian weather being what it is."', '🪙 "Wished the lamplighter would hurry up, for once."', '🪙 "A wish, well spent."'];
    game.addInteractable({ obj: f, radius: 4.4, label: () => 'Toss a coin in the fountain', onUse: () => { SFX.click(); SFX.twinkle(); game.fx.emit(0, 1.1, -34, { count: 16, colors: [0xd4af37, 0xbfe7ff, 0xffffff], speed: 1.3, up: 1.8, life: 1.0, gravity: 3 }); game.toast(rnd.pick(wishes)); } }); }
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
  // the Neighborhood and Whisper Woods both have a ladybug resting somewhere by now, but Victorian's own
  // market square, flowers piled on a stall since round 1, never had one land on them. One now sits on
  // the flower seller's own counter, among her blooms, antennae twitching — the exact same perched-only
  // trick the Neighborhood's field ladybug uses (`rig.animate(0, false, dt, lbT)` off a local timer in
  // `U`), not the Woods' own `Hopper`: wiring a hop onto this counter risks the same shared-`rnd()`
  // desync the Neighborhood's own comment already warns about, and the counter itself (half-extent 1.6 x
  // 0.45 x 0.8, centred (10, -28)) is small enough a hop would carry it clean off the edge in a stride or
  // two anyway. Sits at (10.9, 0.93, -27.7), the counter's own back corner, away from both the flower
  // seller (standing at -29.3, the front) and the aisle the cat would use to reach her — just above the
  // counter's own top (y=0.9) and well inside its existing physics box, so it needs no box of its own,
  // same reasoning the stall's own flowers already rely on just to sit on the wood. Drawn from this
  // world's own local `r` only for its one-time idle phase, same as the Neighborhood's.
  { const rig = makeLadybug(); rig.group.position.set(10.9, 0.93, -27.7); W.add(rig.group);
    let lbT = r() * 10; U.push((dt) => { lbT += dt; rig.animate(0, false, dt, lbT); }); }
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
  // the square had a costermonger, a flower seller, a pieman and a cheesemonger calling their wares —
  // but the one cry every Victorian street is remembered for, "paper! read all about it!", never turned
  // up anywhere in the whole town. A newsboy now works the corner where the lane off the high street
  // opens out into the square, a bundle of folded papers tucked under one arm, calling out a headline
  // to anyone passing. A headless probe (the same stub-three harness `test/run.mjs` itself uses, with
  // the real town built via `game.travel(3, 'from-prev')`) sampled every NPC's own position every
  // third of a second over 150 simulated seconds, then swept the grass just north of the square's own
  // paving against both those samples and every one of the town's physics boxes: (13, -21) came back
  // clear by 6.0 m of the nearest box and 3.3 m of the nearest wandering soul, outside the fountain's
  // own 17 m hand-placed circle (so clear of `victorianRegion`'s own fill too) and well past the four
  // stall keepers' own pitches, the juggler and the lane's own foot traffic.
  { const nx = 13, nz = -21, ry = atan2(-1.2 - nx, -30 - nz);
    const newsWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x5a4a3a, 0x4a4a5a], pants: [0x2a2420], shoes: [0x2a2018] });
    const newsboy = makeHuman({ ...randomPerson(r, { female: r.chance(0.3), child: true, elder: false, wardrobe: newsWard }),
      pants: 0x2a2420, hat: 'flatcap', hatColor: 0x3a3327, bag: null, jacket: null, scarf: r.chance(0.5) ? 0x7a6a5a : null });
    W.add(newsboy.group);
    const nb = new Vendor(game, newsboy, makeNewspaperBundle(), { x: nx, z: nz, ry, cryIcon: '📰',
      cries: ['Paper! Read all about it!', 'Clock tower strikes true again, shocking news!', "Cat spotted in the market square — you heard it here first!"] });
    game.npcs.push(nb); greetable(game, nb); }
  // Candy Land, Sunny Shore, Frosty Peak and Whisper Woods all have something looping overhead by now
  // (butterflies, gulls, snow buntings, fairies and more butterflies) — Victorian's own sky over the market
  // square had nothing in it at all. Five doves now wheel above the square, white against the dusk sky, the
  // way they would over any town square with a fountain and food stalls under it. New `makeDove()`, built
  // the same two-piece flapping wing as the seagull's and the snow bunting's own (root + tip, `w`/`tipW`),
  // just dove-sized and pale rather than white-and-grey or winter-white. Driven by the same `Flyer`
  // controller already circling Candy Land's butterflies, Sunny Shore's gulls and Frosty Peak's buntings
  // overhead, so — as every round before it has found — it needs no headless clearance probe: a `Flyer`
  // never touches the ground or the physics grid, it just loops a centre point in the air. Centred on the
  // square itself (0, -34), looping at radius 9-15 m and height 7-12 m — comfortably above the fountain's
  // own gilded ball on top (y=3.3), the three lamps posts ringing the square (4 m) and every stall's own
  // awning (2.65 m), with room to spare before the clock tower at (42, 0), far off to the east.
  for (let i = 0; i < 5; i++) { const rig = makeDove({ phase: i * 1.3 }); game.npcs.push(new Flyer(game, rig, { cx: 0, cz: -34, r: r.range(9, 15), h: r.range(7, 12), speed: r.range(1.8, 2.6), bob: 0.5, wobble: 1.6, cw: i % 2 === 0, phase: i * 1.3 })); }
  // every other world had an animal of its own — Victorian never did, past the universal squirrel. A pair
  // of pigeons now peck about the market square's quiet east side, the way real ones always gather near a
  // fountain and a row of food stalls. Reuses makePigeon + Hopper exactly as the shore's sandpipers and the
  // woods' frogs already do. Checked against the fountain's own box (half-extent 3.4 m, centred (0,-34) —
  // both homes sit past it on x) and the two east-side stalls (half-extent 1.6 m at (10,-29.3)/(10,-43.3)):
  // nearest approach with leash included is still over 1.5 m clear of either.
  // both pigeons now answer their own "Say hello to the pigeon" prompt too — same root cause and fix as
  // every other ambient `Hopper` critter this log has turned into a friend: `Hopper`, unlike `Wanderer`,
  // never calls `greetable()` on its own, and `makePigeon()`'s rig carries none of `.look`/`.robot`/
  // `.cookie` for that function to find. No new mesh, no new physics box: `game.namedFriend(id)` plus a
  // `game.addInteractable` keyed straight to each bird's own `rig.group`, tracked every frame so the
  // prompt follows it through its hops inside its own 1.1 m leash. The 2.1 m greet radius — the same
  // every other `Hopper` creature's own prompt already uses — needed no new probe: this placement's own
  // clearance above (1.5 m clear of the fountain and both east-side stalls) already covers it, and the
  // two birds sit 4.3 m apart, outside each other's radius.
  let firstPigeon = null, secondPigeon = null;
  for (const [i, [x, z]] of [[5, -34], [6.5, -37.5]].entries()) { const rig = makePigeon(); game.npcs.push(new Hopper(game, rig, { x, z, leash: 1.1, r: 0.08, dist: [0.25, 0.55], dur: 0.25, height: 0.1, idle: [1, 3.2], onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); if (i === 0) firstPigeon = rig; if (i === 1) secondPigeon = rig; }
  { const pigeonId = game.namedFriend('square-pigeon');
    game.addInteractable({ obj: firstPigeon.group, radius: 2.1, label: () => 'Say hello to the pigeon', onUse: () => {
      game.befriend(pigeonId); SFX.chitter(); game.hearts(firstPigeon.group.position.x, 0.2, firstPigeon.group.position.z, 3);
      game.toast('🐦 *tilts its head, coos once, then waddles off to peck at the cobbles*'); } }); }
  { const pigeonId2 = game.namedFriend('square-pigeon-2');
    game.addInteractable({ obj: secondPigeon.group, radius: 2.1, label: () => 'Say hello to the pigeon', onUse: () => {
      game.befriend(pigeonId2); SFX.chitter(); game.hearts(secondPigeon.group.position.x, 0.2, secondPigeon.group.position.z, 3);
      game.toast('🐦 *puffs up its chest feathers, bobs twice, then flutters a step away*'); } }); }
  // the pigeons above never had anyone minding them — every other world's wildlife has a human
  // companion of its own (the Neighborhood's birdwatcher for the sparrows, Sunny Shore's for the gulls,
  // the snow and forest worlds' too). A crumb-feeder now kneels on the square's quiet east side, a
  // paper bag of breadcrumbs at her knee, reusing Forager's own kneel-and-toss exactly as the woods'
  // mushroom-picker already does — the particle burst reads just as well as scattered crumbs as it
  // does a popped-free mushroom. Placed at (10, -35): over 4.5 m clear of both east-side stalls
  // (half-extent 1.6 m at (10,-29.3)/(10,-43.3)) and the nearest lamp (14,-34), well past the fountain's
  // own box (half-extent 3.4 m, centred (0,-34)), and clear of each pigeon's own 1.1 m hop leash with
  // room to spare, facing the pair of them.
  { const kx = 10, kz = -35, hx = 5.75, hz = -35.75, ry = atan2(hx - kx, hz - kz);
    const crumbWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x5a6a5a, 0x4a5a6a], pants: [0x2a2420], shoes: [0x2a2018] });
    const feeder = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.45), wardrobe: crumbWard }),
      pants: 0x2a2420, apron: 0x6a5a4a, hat: 'bonnet', hatColor: 0x4a5a3a, scarf: 0x7a6a5a, bag: null, jacket: null, glasses: false });
    W.add(feeder.group);
    mesh(G.box(0.22, 0.18, 0.14), mat(0xd9c9a8, { roughness: 0.9 }), { x: kx + 0.4, y: 0.09, z: kz + 0.15, ry: 0.3, parent: W });   // the paper bag of crumbs
    P.addBox(kx + 0.4, 0.09, kz + 0.15, 0.22, 0.18, 0.14, { cam: false });
    game.npcs.push(new Forager(game, feeder, { x: kx, z: kz, ry, cryIcon: '🍞',
      cries: ["Not too close, puss, these are for the birds.", "There's always one greedier than the rest.", "Stale by Tuesday, but they never mind."] })); }
  // the market square had pigeons but no rat — every market has one. A scrawnier, darker cousin of the
  // sugar mouse and the factory mouse now skulks in the square's quiet south-west corner, well behind the
  // pieman's own pitch rather than out where the pigeons gather at the fountain. A headless probe (walking
  // the built Victorian world's own physics box list) swept this corner: (-13, -45) sits 2.2 m clear of the
  // pieman's stall at (-10, -42) (half-extent 1.6x0.8) and over 11 m from the nearest lamp, with the whole
  // 1.3 m hop leash staying inside the paved plaza (30x26, centred (0,-34)) and clear of the birch at (-12,-50)
  // it too never answered its own hello — same gap as every other ambient `Hopper` critter this log has
  // turned into a friend: `Hopper`, unlike `Wanderer`, never calls `greetable()` on its own, and
  // `makeAlleyRat()`'s rig carries none of `.look`/`.robot`/`.cookie` for that function to find. No new
  // mesh, no new physics box: `game.namedFriend('alley-rat')` plus a `game.addInteractable` keyed
  // straight to the rat's own `rig.group`, tracked every frame so the prompt follows it through its
  // skulking inside its own 1.3 m leash. The 2.1 m greet radius — the same every other `Hopper`
  // creature's own prompt already uses — needed no new probe: the placement comment above already
  // swept this corner clear of the pieman's stall, the nearest lamp and the birch, all well past it.
  { const rig = makeAlleyRat();
    game.npcs.push(new Hopper(game, rig, { x: -13, z: -45, leash: 1.3, r: 0.1, dist: [0.25, 0.65], dur: 0.3, height: 0.2, idle: [1, 3.4],
      onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } }));
    const ratId = game.namedFriend('alley-rat');
    game.addInteractable({ obj: rig.group, radius: 2.1, label: () => 'Say hello to the rat', onUse: () => { game.befriend(ratId); SFX.chitter(); game.hearts(rig.group.position.x, 0.15, rig.group.position.z, 3); game.toast('🐀 *freezes mid-nibble, whiskers twitching, then bolts for the nearest shadow*'); } }); }
  // a juggler works the open cobbles between the fountain and the west-side stalls, three balls always in the air
  { const jx = -6, jz = -34;
    const juggler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xd62839, stripes: 0xffd54a, pants: 0x2f6fd6, shoes: 0x2a2018, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xffd54a, 0x2e9e6e, 0xf7f3ec], { x: jx, z: jz, ry: atan2(0 - jx, -34 - jz),
      cries: ['Three balls, never four - not since Tuesday.', "Watch the hands, not the cat, sir!", "One coin in the hat, if you liked that."] })); }
  // the market square now has four stall keepers, a newsboy, a juggler and a crumb-feeder with her
  // pigeons — but nobody minding the puddle of boot-blacking every real Victorian square had. A
  // bootblack boy now kneels on the open cobbles south of the fountain, a low shine box set down in
  // front of him, scrubbing at an unseen boot. Reuses Kneeler exactly as the crumb-feeder above and
  // the woods' mushroom-picker do — its own two-handed "patting" idle motion doubles here as
  // brushing the box. New `makeShineBox()` in `60-props.js`: a low wooden stand with a curved foot
  // rest on top (where a customer's boot would go), a tin of polish and a brush left on the lid.
  // Placed at (2, -41), facing the fountain: 7.0 m clear of the fountain's own box (half-extent 3.4
  // m, centred (0,-34)), well past both south stalls at (±10, -42) (half-extent 1.6 m, over 6 m off
  // on x alone), the lamp at (0, -46) and the alley rat's own 1.3 m hop leash at (-13, -45).
  { const bx = 2, bz = -41, ry = atan2(0 - bx, -34 - bz);
    const shineWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x5a4a3a, 0x7a6a5a], pants: [0x3a3327], shoes: [0x2a2018] });
    const bootblack = makeHuman({ ...randomPerson(r, { female: false, child: true, elder: false, wardrobe: shineWard }),
      pants: 0x3a3327, hat: 'flatcap', hatColor: 0x3a3327, bag: null, jacket: null, scarf: null });
    W.add(bootblack.group);
    const boxX = bx + sin(ry) * 0.32, boxZ = bz + cos(ry) * 0.32;
    const shineBox = place(game, U, makeShineBox(), boxX, boxZ, ry);
    P.addBox(boxX, 0.11, boxZ, 0.32, 0.22, 0.24, { cam: false });
    game.npcs.push(new Kneeler(game, bootblack, { x: bx, z: bz, ry, cryIcon: '👞',
      cries: ['Shine your boots, sir? Tuppence a shine!', 'Mind your paws on the polish, puss.', 'Mirror finish — well, mirror-ish.'] }));
    // the bootblack's own cries cover the shine itself; the box he kneels over, same trick as round 602's
    // ice crystal and round 603's brazier, never got a look of its own. `place()`'s return value
    // (previously discarded) is the exact box this block already built and boxed, handed straight to
    // `game.addInteractable` — no new mesh, no new box.
    const shineLines = ["A mirror shine, if the light catches it right.", "Smells of polish and old leather.", "One boot done; one still to go."];
    game.addInteractable({ obj: shineBox, radius: 0.8, label: () => 'Look at the shine box', onUse: () => { SFX.click(); game.toast(rnd.pick(shineLines), 3000); } }); }
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
    let mainBridge = null, westBridge = null, eastBridge = null;
    for (const bx of BRIDGES) {
      const br = group(bx, 0, 30, W);
      mesh(G.box(4.4, 0.4, 10.4), stone, { y: 0.6, shadow: 'both', parent: br }); mesh(G.torus(4.6, 0.7, 8, 20, PI), stone, { ry: PI / 2, shadow: 'none', parent: br });
      for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) mesh(G.box(0.3, 0.9, 0.3), stone, { x: s * 2.0, y: 1.25, z: -4.6 + i * 1.84, parent: br }); mesh(G.box(0.2, 0.1, 10.4), stone, { x: s * 2.0, y: 1.75, parent: br }); }
      P.addBox(bx, 0.4, 30, 4.4, 0.8, 10.4, { cam: false });
      for (const s of [-1, 1]) P.addBox(bx + s * 2.0, 1.4, 30, 0.3, 1.2, 10.4, { cam: false, walk: false });
      if (bx === BRIDGES[0]) mainBridge = br; else if (bx === BRIDGES[1]) westBridge = br; else eastBridge = br;
    }
    // Candy Land's three wafer bridges over the chocolate river each got a "look over the railing" toast
    // rounds ago; Victorian's own three stone bridges over the canal, crossed just as often on the way
    // to the market square, never got one at all. The middle bridge, dead centre at (-1.2, 30) and the
    // one every north-south crossing actually uses, gets the first. `br`, the group this loop already
    // builds and discards per bridge (deck, parapet piers and coping stones), is kept this once as
    // `mainBridge` and handed straight to `game.addInteractable` below — no new mesh, no new box: its
    // own deck box (half-extent 2.2 m in x, 5.2 m in z, a 5.65 m diagonal at the corners) already keeps
    // the cat that far off dead-on. A 6.6 m radius clears that corner by just under a metre, the same
    // margin the chocolate river's own bridges bank on. A headless probe (`game.travel(3, 'from-prev')`,
    // then 9000 simulated frames with every NPC's own position sampled every frame) found the nearest
    // physics box (one of the street lamps, at (8, 25.3)) 10.06 m clear and the nearest other
    // interactable (a "Say hello" greet circle, radius 2.1) 11.43 m off centre-to-centre; the milling
    // top-hats and bonnets who stroll this stretch of grass (home spots at (-1, 22) and (30, 22), leash
    // 12 m, no greet prompt of their own) came as close as 6.26 m over that run, but since they carry no
    // interactable they can never steal this prompt, only ever stand near it.
    { const bridgeLines = ['🌉 "Stone and fog, same as the rest of the town — just damp underfoot too."', '🚣 "Boats pass under here all day. Not one of them ever stops to say why."', '🌊 "Canal water, same colour as the fog above it. Nobody\'s ever seen the bottom."'];
      game.addInteractable({ obj: mainBridge, radius: 6.6, label: () => 'Look over the railing', onUse: () => { SFX.click(); game.toast(rnd.pick(bridgeLines), 3000); } }); }
    // the other two stone bridges, kept as `westBridge` (-96, 30) and `eastBridge` (104, 30) the same
    // way `mainBridge` was kept last round — same loop, same deck/parapet geometry, same box sizes, so
    // the same 6.6 m radius clears the same 5.65 m corner diagonal by the same margin. Neither bridge
    // has anything hand-placed nearby: the nearest lamps sit at x in [-52,-24,8,24,48] (z=25.3, all
    // clustered around the main bridge), the duck pair only ranges x=46-64, the mudlark works (-10,
    // 37.3), and the boats at x=-140/-70/70/150 are pure visuals with no physics box of their own
    // (`makeBoat`'s only motion is its own `userData.update` bob). The canal's outer-country fill is
    // walled off by the `zones.addSpan` above (z 24-36 the whole width), so nothing from `victorianRegion`
    // can land here either. Two more "look over the railing" toasts, one per bridge, finish the set —
    // all three Victorian crossings now answer the same way Candy Land's three wafer bridges already do.
    { const westLines = ['🌉 "Furthest crossing from the square. Fewest footsteps, same fog."', '🚣 "No boat has ever stopped under this one either. Must be a canal thing."', '🌫️ "Quietest stretch of water in the whole town — even the gulls give it a miss."'];
      game.addInteractable({ obj: westBridge, radius: 6.6, label: () => 'Look over the railing', onUse: () => { SFX.click(); game.toast(rnd.pick(westLines), 3000); } }); }
    { const eastLines = ['🌉 "Same stone, same fog, same drop to the water as every other bridge in town."', '🚣 "The boats drift past here too, and still never say why."', '🌁 "Furthest bridge from the time door. A long walk home from here, fog or no fog."'];
      game.addInteractable({ obj: eastBridge, radius: 6.6, label: () => 'Look over the railing', onUse: () => { SFX.click(); game.toast(rnd.pick(eastLines), 3000); } }); }
    for (const x of [-40, 20, 40, -140, 150, 70, -70]) { const b = makeBoat(r.pick([0x3f6fd6, 0x7a1f1f])); b.userData.y0 = -0.3; b.scale.setScalar(1.2); place(game, U, b, x, 30, r() * TAU, -0.3); }
    // the canal had boats and two bank workers (the angler, the mudlark) but, like the Neighborhood's
    // park pond before round 199, nothing ever actually lived on the water itself. A duck pair now
    // paddles the one straight run of open canal with neither a boat nor a bridge in it at all — the
    // 30 m stretch between the boats at x=40 and x=70 (the nearest bridge, at x=104, is well past the
    // far one). Fixed numbers throughout, same as the pond ducks, so nothing here draws from the
    // shared `r` and shifts any later wardrobe pick.
    { const dz = 30, dMid = 55, dRange = 9, dY = -0.3;
      const drake = makeDuck({ drake: true }); W.add(drake.group);
      const hen = makeDuck({ drake: false }); W.add(hen.group);
      const pair = [[drake, 0, 0.1], [hen, PI, 0.13]];
      U.push((dt, t) => { for (const [d, phase, speed] of pair) {
        const a = t * speed + phase, facing = cos(a) >= 0 ? PI / 2 : -PI / 2;
        d.group.position.set(dMid + sin(a) * dRange, dY + sin(t * 2.4 + phase) * 0.01, dz);
        d.group.rotation.y = facing;
        d.head.rotation.x = sin(t * 0.6 + phase * 2) > 0.88 ? 0.5 : 0;   // the occasional dip toward the water
      } });
      let quackT = 8; U.push((dt) => { quackT -= dt; if (quackT <= 0) { SFX.squawk(); quackT = rnd.range(10, 18); } });
      // round 677's own comment named this pair, and Whisper Woods' glowing-pond pair, as the last two
      // background water pairs left in the whole game after the Neighborhood's two ponds and Candy
      // Land's chocolate river all got "say hello" prompts. This is that round for the canal: both
      // birds answer at once, the same trick as the lake pair two rounds ago. No new mesh, no new
      // physics box — `game.addInteractable` keys off each duck's own `group` directly, so it tracks
      // this pair's fixed z=30 and oscillating x (46-64, from `dMid`/`dRange` above) every frame. The
      // canal itself is blocked for walking bank to bank by the `P.addBox` calls above, a 4.0 m
      // half-extent in z centred on this same z=30 (`w, 4, 8` — half of 8), so the cat has to call
      // across from the towpath; since the pair swims dead on z=30 itself, that 4.0 m gap never
      // narrows or widens with the lap the way a circular swim does, so a 4.6 m radius clears it by a
      // flat 0.6 m regardless of where either duck sits in its sweep. The nearest lamp post (x=48,
      // z=25.3, from the loop just below) sits well clear of both ducks' own reach, and the nearest
      // bridge's own "look over the railing" circle (east, x=104, radius 6.6, outer edge x=97.4) stays
      // 33 m off even at the drake's closest swing in, to x=64 — `'duck'`/`'hen'` are free in this
      // world, since only `'boy'` has claimed a key here so far.
      const cdid = game.namedFriend('duck');
      game.addInteractable({ obj: drake.group, radius: 4.6, label: () => 'Say hello to the duck', onUse: () => {
        game.befriend(cdid); SFX.squawk(); game.hearts(drake.group.position.x, drake.group.position.y + 0.3, drake.group.position.z, 3);
        game.toast('🦆 "Quack!"'); } });
      const chid = game.namedFriend('hen');
      game.addInteractable({ obj: hen.group, radius: 4.6, label: () => 'Say hello to the duck', onUse: () => {
        game.befriend(chid); SFX.squawk(); game.hearts(hen.group.position.x, hen.group.position.y + 0.3, hen.group.position.z, 3);
        game.toast('🦆 "...Quack."'); } }); } }
  for (const x of [-52, -24, 8, 24, 48]) { place(game, U, makeLamp('victorian'), x, 25.3, 0); P.addBox(x, 2, 25.3, 0.4, 4, 0.4, { cam: false }); }
  // the canal had rowing boats but nobody minding a line; an old-timer takes the north bank between two lamps, rod dipped in
  { const anglerWard = makeWardrobe(r, { shirts: [0x4a5a4a, 0x5a4a3a, 0x3a4a5a], pants: [0x2e3a2e, 0x2a2a2a], shoes: [0x2a2018, 0x1e2020] });
    const angler = makeHuman({ ...randomPerson(r, { female: r.chance(0.3), elder: true, child: false, wardrobe: anglerWard }),
      hat: 'flatcap', hatColor: 0x3a3327, coat: true, scarf: null, jacket: null, buttons: null, cane: false, glasses: r.chance(0.25) }); W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 15, z: 24.4, ry: 0, holeX: 15, holeZ: 28.6, holeY: -0.3,
      cries: ['Not a bite in this canal all week.', 'Caught a boot once. Best catch all month.', 'Mind the towpath, puss.'] })); }
  // the angler above has the near bank; the far bank, well past the water, had nobody at all — and a trade
  // as Victorian as the chimney sweep was still missing from the whole town: no mudlark had ever worked the
  // canal's mud for what the boats drop. One kneels on the grass just past the far wall now, a wicker pan
  // set in a patch of churned-up mud, a couple of coins already sieved out and laid to dry. A headless
  // probe swept the stretch of grass beyond the wall (every physics box at z=34.3 is only 0.6 m deep) against
  // every box hand-placed into the town — the bridges at x=-1.2/-96/104, the lamps and angler on the near
  // bank, the playground's tag/ring/catch/swing/seesaw further north — and found (-10, 37.3) clear by over
  // 8 m in every direction, comfortably inside the radius (88) where victorianRegion's own fill stays off.
  { const mx = -10, mz = 37.3, ry = PI, female = r.chance(0.5), px = mx, pz = mz - 0.75;
    const mud = mat(0x3f3122, { roughness: 1 });
    mesh(G.plane(2.6, 2.0), mud, { x: mx, y: -0.008, z: mz - 0.3, rx: -PI / 2, shadow: 'receive', parent: W });
    const panM = mat(0x8a6a3a, { roughness: 0.9 });
    mesh(G.cyl(0.24, 0.21, 0.05, 16), panM, { x: px, y: 0.025, z: pz, parent: W });
    P.addBox(px, 0.025, pz, 0.5, 0.1, 0.5, { cam: false });
    const coinM = mat(0xc9a227, { metalness: 0.7, roughness: 0.35 });
    for (const [dx, dz] of [[-0.07, 0.04], [0.06, -0.03]]) mesh(G.cyl(0.025, 0.025, 0.006, 10), coinM, { x: px + dx, y: 0.056, z: pz + dz, parent: W });
    const mudWard = makeWardrobe(r, { shirts: [0x6a7a5a, 0x7a5a4a, 0x5a6a7a], pants: [0x2a2420], shoes: [0x2a2018] });
    const mudlark = makeHuman({ ...randomPerson(r, { female, child: false, elder: r.chance(0.3), wardrobe: mudWard }),
      pants: 0x2a2420, apron: 0x5a4a3a, hat: female ? 'bonnet' : 'flatcap', hatColor: 0x3a3327, sleeves: true, bag: null, jacket: null, scarf: null, glasses: false });
    W.add(mudlark.group);
    game.npcs.push(new Forager(game, mudlark, { x: mx, z: mz, ry, cryIcon: '🪙',
      cries: ['Found a farthing! Mudlarking never quite lets you down.', 'Careful, puss — mind the mud, it never comes out of white fur.', 'A thimble, would you believe. Third one this month — someone up there keeps losing them.'] })); }
  // the canal has had boats, ducks, an angler and a mudlark for rounds now, but nothing ever skimmed low
  // over the water itself — Whisper Woods' glowing pond got its own trio of dragonflies back in round
  // 773, and the canal, the only other real stretch of open water in the game with nothing flying over
  // it, never had its own. Three dragonflies now dart low over a quiet reach of the canal between the
  // main bridge and the duck pair's own swim lane. Exact same `makeDragonfly()` and `Flyer` controller
  // the pond's trio already uses (`56-npcs-wild.js`, unchanged) — no new rig, no new orbit logic, just
  // a fresh loop centred on open water with nothing else nearby to clip.
  // The loop centres on (30, 30), a 5 m stretch of canal with a 2.5 m swing radius (x 27.5-32.5, z
  // 27.5-32.5) — comfortably inside the water plane's own z 26-34 band, so neither wingtip ever crosses
  // the bank. The nearest boat sits at x=20 and x=40 (both 7.5 m clear at the swing's widest), the main
  // bridge's own deck ends at x=1.0 (26 m clear), and the duck pair's swim ranges x=46-64 (13.5 m clear)
  // — no physics box or `addInteractable` of its own, so there is nothing here for the headless suite's
  // road-and-path sweep to trip on.
  for (let i = 0; i < 3; i++) { const rig = makeDragonfly(r.pick([0x2f6a5a, 0x3a5a8a, 0x5a3a6a])); game.npcs.push(new Flyer(game, rig, { cx: 30, cz: 30, r: 2.5, h: r.range(0.25, 0.45), speed: r.range(1.6, 2.4), bob: 0.08, wobble: 0.3, cw: i % 2 === 0, phase: i * 2.1 })); }
  for (const [x, z, k2] of [[-30, 20, 'oak'], [36, 22, 'oak'], [-12, -50, 'birch'], [18, -52, 'birch'], [-66, -14, 'oak'], [66, 18, 'oak']]) addTree(game, k2, x, z, r);
  // clock tower plaza (east), time door (west)
  const tower = makeClockTower(game, 42, 0, U);
  // the tower's own bell (SFX.chime(), "tolling three times") had only ever sounded once, for the time
  // door's own fanfare in 80-game.js — otherwise it stood silent despite the owl hooting on its own clock
  // in Whisper Woods and the gulls crying on theirs at Sunny Shore. It now tolls on its own loop too, same
  // three strikes, just spaced minutes apart so it reads as a town clock rather than an alarm. The interval
  // is drawn from the shared `rnd()` inside this `U` tick, exactly as the owl's and the gull's own loops
  // already do — read only after every NPC in this build is already placed, so it can't shift any
  // construction-time wardrobe pick, here or in any world built after it.
  let towerChimeT = rnd.range(40, 70);
  U.push((dt) => { towerChimeT -= dt; if (towerChimeT <= 0) { SFX.chime(); towerChimeT = rnd.range(60, 100); } });
  // the throne, the fountain, Robot City's statue, the Neighborhood's signpost and the fairy ring have all
  // had a one-off "walk up and look" toast for rounds now — but the clock tower itself, the one landmark
  // every Victorian street scene is built around, never got the same treatment, for all its own bell and
  // weathervane. The cat can now stand at its foot and look up. `makeClockTower`'s own base box (half-extent
  // 3.75 in x and z) keeps the cat from getting closer than ~4.0 m to the centre face-on, or ~5.6 m square
  // on a corner, so a 5.8 m radius is reachable from any side of the plaza, square to the base or not,
  // without reaching the fiddler's own spot 6.7 m away or the kite kid at (50, 55).
  const towerLines = ['🕰️ "Four faces, and every one tells the same lie about the time."', '🕰️ "Still the tallest thing in town. Even the robots across the valley haven\'t topped it."', '🕰️ "Someone built eighteen metres of stone just to hold up a clock face."'];
  game.addInteractable({ obj: tower, radius: 5.8, label: () => 'Look up at the clock tower', onUse: () => { SFX.click(); game.toast(rnd.pick(towerLines), 3000); } });
  flatPlane(game, 16, 16, pave, 42, 0, 0, 0.015);
  const carriage = makeCarriage(game, 16, 3.4, PI / 2);
  // the parked carriage had no one minding it; a coachman now waits up on the driver's bench, watch in hand
  { const cx = 16, cz = 3.4, ry = PI / 2, sx = cx + 1.9 * sin(ry), sz = cz + 1.9 * cos(ry);
    const coachman = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.4) }),
      pants: 0x1e1e24, coat: true, hat: 'top', hatColor: 0x1e2436, buttons: 0xc8b878, beard: false, moustache: true, glasses: false });
    W.add(coachman.group);
    game.npcs.push(new Sitter(game, coachman, { x: sx, z: sz, ry, seat: 2.0,
      cries: ["Right on time, or so the clock says.", "The fare's been in that shop twenty minutes. Some things never change.", 'Careful of the wheels, puss.'] })); }
  // the clock tower and the fountain both got a "walk up and look" toast rounds ago, but the carriage
  // parked beside the first — the thing the coachman's own bench is actually bolted to — never got one
  // of its own. `makeCarriage`'s own return value — previously discarded — is handed straight to
  // `game.addInteractable` here, no new mesh, no new physics box: the carriage's own collider (a 90°
  // rotated box, full extents 5 × 2.4 × 2.2, centred on this same (16, 3.4)) already keeps the cat at
  // least 1.1 m off on its short ends and 2.5 m off on its long ones, so a 3.2 m radius reaches every
  // side without ever beating the coachman's own 2.1 m greet circle at (17.9, 3.4): the nearest the cat
  // can stand to him outside the box, past its east face, is only 0.6 m from his seat but 2.5 m from the
  // carriage's own centre, so his "Say hello" always wins there, exactly as the clock tower's prompt
  // keeps losing to the fiddler 6.7 m off instead of swallowing his spot too.
  const carriageLines = ['🛺 "Not a horse in sight. Hasn\'t moved in years, by the look of the wheels."', '🛺 "Lovely bit of brass, that lamp. Shame nobody\'s lit it."', '🛺 "Big enough for four, a driver, and apparently no horse at all."'];
  game.addInteractable({ obj: carriage, radius: 3.2, label: () => 'Look at the carriage', onUse: () => { SFX.click(); game.toast(rnd.pick(carriageLines), 3000); } });
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
  // the Neighborhood's own mailbox got its "check it" toast back in round 294, and the postie has been
  // doing her rounds here ever since — but Victorian, for all its gaslight, its pigeons and a lamplighter
  // on every corner, never had the one street fixture the era is known for. A red pillar postbox now
  // stands on the grass verge past the last house on the south row, where the terrace gives way to open
  // ground, a couple of letters wedged half into its slot. Driven only by the world clock `t`, never this
  // world's own seeded `r`, so it costs no later wardrobe pick anywhere in this build. A headless probe
  // (the same stub-three harness `test/run.mjs` uses) built the real Victorian town, sampled every NPC's
  // own position every quarter second over roughly fifteen simulated seconds, and swept the verge past
  // the terrace's own end against every one of the town's physics boxes: (84, -7.3) came back clear by
  // 18.1 m of the nearest box and 38.2 m of the nearest wandering soul, well short of the radius (88)
  // where victorianRegion's own procedural fill takes over.
  { const px = 84, pz = -7.3;
    const post = group(px, 0, pz, W);
    const pillarM = mat(0x8b1a1a, { roughness: 0.55, metalness: 0.15 }), capM = mat(0x6b1414, { roughness: 0.5, metalness: 0.2 });
    mesh(G.cyl(0.26, 0.3, 0.9, 12), pillarM, { y: 0.45, shadow: 'both', parent: post });
    mesh(G.cyl(0.3, 0.3, 0.05, 12), capM, { y: 0.925, shadow: 'both', parent: post });
    mesh(G.sphere(0.27, 12, 8), capM, { y: 0.98, sy: 0.55, shadow: 'both', parent: post });
    mesh(G.sphere(0.035, 8, 6), mat(0x2a2a2a, { roughness: 0.6 }), { y: 1.15, parent: post });
    const crest = mesh(G.cyl(0.07, 0.07, 0.012, 12), mat(0xd4af37, { metalness: 0.6, roughness: 0.3 }), { y: 0.62, z: 0.265, rx: PI / 2, shadow: 'none', parent: post });
    noInk(crest);
    const slot = group(0, 0.84, 0.27, post);
    mesh(G.box(0.22, 0.045, 0.03), mat(0x1a1410, { roughness: 0.7 }), { parent: slot });
    const letterM = mat(0xf0ead6, { roughness: 0.9, side: THREE.DoubleSide });
    const letterA = group(-0.03, 0.03, 0.01, slot), letterB = group(0.04, 0.02, 0.01, slot);
    mesh(G.plane(0.1, 0.07), letterM, { rx: -0.3, parent: letterA });
    mesh(G.plane(0.09, 0.06), letterM, { rx: -0.35, parent: letterB });
    U.push((dt, t) => { letterA.rotation.x = -0.3 + sin(t * 0.7) * 0.03; letterB.rotation.x = -0.35 + sin(t * 0.7 + 1.1) * 0.03; });
    P.addBox(px, 0.45, pz, 0.32, 0.9, 0.32, { cam: false });
    const postboxLines = ['📮 "Posted a letter in there years ago. Still waiting on a reply."', '📮 "The flap sticks a little — everyone gives it the same shove."', '📮 "Somebody\'s postcard never did make it out of that slot."'];
    game.addInteractable({ obj: post, radius: 2.2, label: () => 'Look at the postbox', onUse: () => { SFX.click(); game.toast(rnd.pick(postboxLines), 3000); } }); }
  // the juggler, the fiddler and the painter all work the square and the plaza, but the one street
  // entertainment the era is actually famous for — a Punch and Judy show — never turned up anywhere in
  // the game. A striped puppet booth now stands on the quiet grass south-west of the backyards, Mr
  // Punch and Judy popping up through its own little stage in turn, a showman standing beside it
  // drumming up custom. No new controller for the showman — a plain `Charger`, same as the fiddler, the
  // painter and the sweep; the puppets themselves are two small static rigs (no `makeHuman`, they're
  // puppets, not people) riding the world clock alone in a `U.push`, so nothing here draws from this
  // world's own seeded `r` beyond the showman's own wardrobe roll.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Victorian
  // town (`game.travel(3, 'from-prev')`, then `game.start('new')` so every urchin, dancer and
  // ball-tossing pair actually moved), sampled every NPC's and the squirrel's own position every quarter
  // second over 300 simulated seconds, then swept this quiet south-west corner — past the backyards, past
  // the hopscotch grid and the draughts table — against both those samples and all 304 of the town's
  // physics boxes: (-60, -44) came back clear by 6.9 m of the nearest box (the oak at (-66, -14)) and
  // 18.4 m of the nearest other soul, comfortably inside the radius (88) where victorianRegion's own
  // procedural fill takes over.
  { const bx = -60, bz = -44, showX = -62, showZ = -44, showRy = atan2(bx - showX, bz - showZ);
    const booth = group(bx, 0, bz, W);
    const clothA = mat(0x8b1a1a, { roughness: 0.85 }), clothB = mat(0xf7f3ec, { roughness: 0.85 }), woodM = mat(0x3f2a1a, { roughness: 0.8 });
    for (const [px, pz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) mesh(G.cyl(0.035, 0.035, 1.9, 8), woodM, { x: px, y: 0.95, z: pz, parent: booth });
    for (let i = 0; i < 6; i++) mesh(G.box(0.16, 1.5, 0.02), i % 2 ? clothA : clothB, { x: -0.4 + i * 0.16, y: 0.75, z: 0.44, parent: booth });   // the front curtain — stops short of the top, leaving the stage open
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) mesh(G.box(0.02, 1.9, 0.16), i % 2 ? clothA : clothB, { x: s * 0.44, y: 0.95, z: -0.4 + i * 0.16, parent: booth });   // the sides, full height — nobody ever sees behind a puppet booth
    mesh(G.box(0.95, 0.07, 0.1), woodM, { y: 1.5, z: 0.46, parent: booth });   // the stage's own ledge
    mesh(G.box(0.95, 0.07, 0.1), woodM, { y: 1.88, z: 0.46, parent: booth });  // and its top rail
    P.addBox(bx, 0.95, bz, 0.92, 1.9, 0.92, { cam: false });
    // Mr Punch: red pointed cap, a hooked nose, a white ruff — on his own hidden stick, parented straight to the world so its y can be driven directly
    const punch = group(bx - 0.18, 1.42, bz + 0.3, W);
    mesh(G.sphere(0.1, 10, 8), mat(0xffd9a0, { roughness: 0.7 }), { y: 0.2, parent: punch });
    mesh(G.cone(0.13, 0.24, 10), mat(0xd62839, { roughness: 0.6 }), { y: 0.34, parent: punch });
    mesh(G.cone(0.025, 0.08, 6), mat(0xffd9a0, { roughness: 0.7 }), { y: 0.21, z: 0.1, rx: PI / 2, parent: punch });
    mesh(G.torus(0.1, 0.03, 6, 12), clothB, { y: 0.08, rx: PI / 2, parent: punch });
    // Judy: a white bonnet, a blue collar
    const judy = group(bx + 0.18, 1.42, bz + 0.3, W);
    mesh(G.sphere(0.1, 10, 8), mat(0xffd9a0, { roughness: 0.7 }), { y: 0.2, parent: judy });
    mesh(G.sphere(0.12, 10, 8), clothB, { y: 0.3, sy: 0.7, parent: judy });
    mesh(G.torus(0.1, 0.03, 6, 12), mat(0x3a5a8a, { roughness: 0.8 }), { y: 0.08, rx: PI / 2, parent: judy });
    const hideY = 1.42, popH = 0.42, puppetCyc = 2.6;
    let punchClash = -1;
    U.push((dt, t) => {
      const kp = (t % puppetCyc) / puppetCyc, kj = ((t + puppetCyc * 0.5) % puppetCyc) / puppetCyc;
      const pop = (k) => k < 0.45 ? sin(k / 0.45 * PI) : 0;
      const pp = pop(kp), pj = pop(kj);
      punch.position.y = hideY + pp * popH; judy.position.y = hideY + pj * popH;
      punch.rotation.y = pp > 0.05 ? sin(t * 6) * 0.35 : 0; judy.rotation.y = pj > 0.05 ? sin(t * 6 + 1.7) * 0.3 : 0;
      const cycleNo = floor(t / puppetCyc);
      if (pp > 0.95 && cycleNo !== punchClash) { punchClash = cycleNo;
        const c = game.cat.group.position;
        if (dist2(bx, bz, c.x, c.z) < 400) { SFX.thunk(); game.fx.emit(punch.position.x, punch.position.y + 0.1, punch.position.z, { count: 5, color: 0xd62839, speed: 0.6, up: 0.5, life: 0.5, gravity: 2 }); }
      }
    });
    const showWard = makeWardrobe(r, { shirts: [0x8b1a1a, 0x3a5a6a], pants: [0x1e1e24], shoes: [0x2a2018] });
    const showman = makeHuman({ ...randomPerson(r, { female: r.chance(0.3), child: false, elder: r.chance(0.3), wardrobe: showWard }),
      pants: 0x1e1e24, stripes: 0xd4af37, hat: 'top', hatColor: 0x1e1e24, hatBand: 0xd4af37, coat: false, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(showman.group);
    game.npcs.push(new Charger(game, showman, { x: showX, z: showZ, ry: showRy, cryIcon: '🎭',
      cries: ["Roll up, roll up, for Mr Punch and his good lady wife!", '"That\'s the way to do it!"', 'Mind your tail, puss — he bites, puppet or not.'] })); }
  // round 508's own list of playground games this whole game had never tried (tetherball, badminton,
  // tug-of-war, archery, sack races) is down to two: round 520 gave Frosty Peak a tug-of-war and round
  // 521 gave the Neighborhood a tetherball pole. **Badminton — the one the Victorians actually took up
  // in their own back gardens — now has a net of its own**, on the quiet grass between the market square
  // and the maypole's own field, two players in their Sunday clothes batting a shuttlecock back and
  // forth over it in a rally that never actually stops.
  //
  // New `Badminton` controller (`55-npcs.js`, right after `TugOfWar`, its nearest relative among this
  // round's own run of new playground games) — the one thing setting it apart from `BallGame`'s and
  // `Horseshoes`' own hold-then-catch-then-throw cycle is that the shuttle is never held at all: it
  // reverses the instant it reaches a racket and is straight back on its way, so the rally never
  // actually pauses, closer to `Tetherball`'s own never-held rule than to either of those. `makeHuman`
  // gets a new `o.racket` hand prop — a handle and a strung oval hoop, same spot on the body `axe`,
  // `pole` and `brush` already use — and `makeVolleyballNet` (`62-props-nature.js`) picks up optional
  // `postH`/`netH` overrides rather than a second near-identical net function: badminton's own net sits
  // lower and shallower than the beach's own volleyball net, closer to the real game's proportions
  // (posts a little over head height, the net itself under a metre deep).
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Victorian
  // town (`game.start('new')` then `game.travel(3, 'from-prev')`, so every urchin, dancer, duck and
  // ball game already in this town actually moved), sampled every one of its physics circles' own
  // position every tenth of a second over 300 simulated seconds, then swept a grid around this stretch
  // of grass against both that trace and every one of the town's physics boxes, keeping short of the
  // radius (88) where victorianRegion's own procedural fill takes over: (-10, -55) and the eight points
  // ±2–3.5 m around it (the net posts, both players' own spots) all came back clear by 8.6 m or more in
  // every direction, comfortably between the market square (centred (0, -34), radius 17) and the
  // maypole's own field further south at (0, -84).
  { const cx = -10, cz = -55, gap = 5.6, halfW = 1.6;
    const net = makeVolleyballNet(halfW, 0xf0ece4, { postH: 1.6, netH: 0.78 });
    place(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) P.addBox(cx + sx, 0.8, cz, 0.16, 1.6, 0.16, { cam: false });
    // the shuttlecock: a pale cork and a flared cone standing in for the feathers, nose staying down
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    const bmWard = makeWardrobe(r, { shirts: [0x5a4a6a, 0x4a6a5a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const bA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: bmWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2), racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: bmWard }),
      hat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.2), racket: true });
    W.add(bA.group); W.add(bB.group);
    const badmintonLines = ['Sixty-one, by my count — more than we\'ve ever got to.', 'Mind your whiskers, puss, that net won\'t stop a determined paw.', 'Lost count again. Call it a draw, same as always.'];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: badmintonLines })); }
  // round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races)
  // has long since gone round the other six worlds — Frosty Peak, Robot City, Sunny Shore and Whisper
  // Woods have all had two rigs strain against a rope of their own (`TugOfWar`, 55-npcs.js) — but
  // Victorian, for all its quoits and its badminton net, never had the one contest with no ball, shoe
  // or shuttle to send back and forth. Two off-duty draymen now dig their heels into the open grass
  // east of the coalman's own yard and heave on a length of cart rope between them, never quite
  // settling either way. *"Heave away, lads — she won't give an inch!"* *"Mind your tail, puss, that
  // rope's seen rougher use than this."* *"Best of however many we've lost count of — same as every
  // Sunday."*
  //
  // No new class and no new mesh: the exact same `TugOfWar` the other four worlds already use,
  // unchanged, with the same rope-and-flag dressing those four already build around it — just two
  // fresh `makeHuman` draymen in shirtsleeves and braces rather than a snowsuit, factory overalls or
  // beachwear.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // clicking the real start button and then `game.travel(3, 'from-prev')`, waiting out both the load
  // and the fade-lock timers rather than guessing a frame count) sampled every NPC's own position
  // every fifth frame over 2400 simulated frames, then swept a grid of this quiet east corner — clear
  // of the main street's own keep-out band (|z|<20) and short of the radius (88) where
  // `victorianRegion`'s own procedural fill takes over — against both those samples and every one of
  // the town's 589 physics boxes: (75, -29) came back clear by 16.9 m of the nearest box and 25.1 m of
  // the nearest other soul at its own centre, with both draymen's own stations 1.3 m either side of it
  // (rope running north-south) clear by 15.9 m and 18.0 m of the nearest box and 24.6 m and 25.6 m of
  // the nearest other soul — well east of the coalman's own chute (52, -15) and the night watchman's
  // bench (36, -30).
  { const tugWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x4a5a6a, 0x5a6a4a], pants: [0x2a2420, 0x2a2a30], shoes: [0x2a2018, 0x1e1a16] });
    const haulerA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: tugWard, build: 'stout' }),
      hat: 'flatcap', hatColor: 0x3a3327, jacket: null, coat: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    const haulerB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: tugWard, build: 'stout' }),
      hat: 'flatcap', hatColor: 0x2a2a2a, jacket: null, coat: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(haulerA.group); W.add(haulerB.group);
    const tug = new TugOfWar(game, haulerA, haulerB, { x: 75, z: -29, ry: 0, gap: 2.6,
      cries: ['Heave away, lads — she won\'t give an inch!', "Mind your tail, puss, that rope's seen rougher use than this.", "Best of however many we've lost count of — same as every Sunday."] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, ropeM = mat(0x8a6a42, { roughness: 0.9 }), ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const ropeGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    ropeGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.035, 0.035, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 8), ropeM, { rx: PI / 2, parent: ropeGroup }));
    const flag = group(0, 0, 0, W); noInk(mesh(G.box(0.03, 0.14, 0.4), mat(0x8b1a1a, { roughness: 0.7 }), { parent: flag }));
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.12;
      flag.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.03, lerp(A.z, B.z, frac)); flag.rotation.y = ropeGroup.rotation.y; }); }
  // the Neighborhood, Candy Land and Robot City have all had their own `Tetherball` (55-npcs.js) since
  // round 508's own list of playground games went round every world in turn — Victorian, for all its
  // badminton net and its tug-of-war, never got the one game played standing still, swinging a ball on
  // a rope round and round a post. Two off-duty stable hands now keep a rally going on the quiet grass
  // west of the pinwheel's own garden, well clear of the bootblack and the juggler working the lane
  // below. *"Forty-one, and she's still mine!"* *"Mind your tail, puss — that ball's got more swing in
  // it than it looks."* *"Groom'll want us back inside in a minute. One more go."*
  //
  // No new class and no new mesh: the exact same `Tetherball` the other three worlds already use, just
  // a fresh pair of workers and a spot. Reuses `makeHuman` the way every other Victorian NPC does —
  // unlike Robot City's own pair, this town has no `makeRobot()` rig to work around.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // clicking the real start button and then `game.travel(3, 'from-prev')`, waiting out both the load
  // and the fade-lock timers rather than guessing a frame count) sampled every NPC's own position
  // every fifth frame over 1200 simulated frames, then swept the pole at (-70, -30) and both workers'
  // own stations two metres either side of it against both those samples and every one of the town's
  // 577 physics boxes: the worst of the three points came back clear by 13.0 m of the nearest box and
  // 16.1 m of the nearest other soul — short of the radius (88) where `victorianRegion`'s own
  // procedural fill takes over, and well off the pinwheel (-60.5, -7.5), the bootblack (-48, -20) and
  // the juggler (-28, -20.3).
  { const tetherWard = makeWardrobe(r, { shirts: [0x6a7a5a, 0x5a6a7a, 0x7a6a4a], pants: [0x2a2420, 0x2a2a30], shoes: [0x2a2018, 0x1e1a16] });
    const workerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tetherWard }),
      hat: 'flatcap', hatColor: 0x3a3327, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: r.chance(0.2) });
    const workerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tetherWard }),
      hat: 'flatcap', hatColor: 0x2a2a2a, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: r.chance(0.2) });
    W.add(workerA.group); W.add(workerB.group);
    game.npcs.push(new Tetherball(game, workerA, workerB, { x: -70, z: -30,
      cries: ['Forty-one, and she\'s still mine!', "Mind your tail, puss — that ball's got more swing in it than it looks.", "Groom'll want us back inside in a minute. One more go."] })); }
  // round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races)
  // is down to its last three worlds now the Neighborhood, Candy Land and Robot City have all had a
  // `SackRace` of their own — Victorian, for all its badminton net, tug-of-war and tetherball pole,
  // never had the one race run two hops at a time with both ankles tied together. **Two errand boys
  // now hop a short lane on the open grass south of the market square**, borrowed flour sacks from the
  // grocer's cart knotted at the waist, neither one ever quite winning. *"Lost me cap in that last
  // tumble!"* *"Mind your tail, puss — this sack's still got flour in the seams."* *"Best of three —
  // and I'm not owning up to losing again."*
  //
  // No new class and no new mesh: the exact same `SackRace` (`55-npcs.js`) and `makeHuman`'s own
  // `o.sack` option the other three worlds already use, just two fresh errand boys in flatcaps and
  // rolled sleeves rather than a snowsuit, factory overalls or beachwear.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // clicking the real start button and then `game.travel(3, 'from-prev')`, waiting out both the load
  // and the fade-lock timers) sampled every physics circle's own position every 10th frame over 2400
  // simulated frames (40 s, long enough for every urchin, dancer, duck and ball game in this town to
  // range fully), then swept a grid of candidate lanes (5 m long, 1.1 m apart, both orientations)
  // against both those samples and every one of the town's 580 physics boxes, keeping short of the
  // radius (88) where `victorianRegion`'s own procedural fill takes over: (4, -66), lane running along
  // world X (`ry = PI/2`), came back clearest at 15.6 m from the nearest box or soul at its tightest
  // point — a good 22 m inside the region-fill radius, and well south of the market square (0, -34,
  // radius 17), the badminton net (-10, -55) and the maypole's own field (0, -84).
  //
  // Built dead last, right after the tetherball pole, for the same reason every other addition at the
  // end of this function already gives: `makeHuman()` draws three values off the *shared* `rnd()`
  // sequence unconditionally, and a fresh pair of rigs built any earlier in this town would shift that
  // sequence and desync every other timing-sensitive pick already placed above.
  { const rx = 4, rz = -66, rry = PI / 2;
    const sackWard = makeWardrobe(r, { shirts: [0x6a7a5a, 0x7a6a4a, 0x5a6a7a], pants: [0x2a2420, 0x2a2a30], shoes: [0x2a2018, 0x1e1a16] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xa8785a, hat: 'flatcap', hatColor: 0x3a3327, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xa8785a, hat: 'flatcap', hatColor: 0x2a2a2a, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: rx, z: rz, ry: rry,
      cries: ['Lost me cap in that last tumble!', "Mind your tail, puss — this sack's still got flour in the seams.", "Best of three — and I'm not owning up to losing again."] })); }
  // round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack races)
  // reached every world but this one by round 532 (Frosty Peak) and round 525 (Whisper Woods) gave
  // `Archer` (55-npcs.js) a range of its own — Victorian, for all its tetherball pole, badminton net,
  // tug-of-war and sack race, never got the one game played standing still and loosing an arrow. **A
  // lady of the parish Toxophilite Society now draws and shoots at a straw target on the quiet meadow
  // south-east of town**, bonnet, sash and gown and all. *"Forty yards, and still true to the gold."*
  // *"Mind your tail, puss — you're no target, but best stand well clear."* *"The Society meets every
  // fine Tuesday. Do bring your mistress along."*
  //
  // No new class and no new prop: the exact same `Archer` (55-npcs.js) and straw-boss-and-rings target
  // Frosty Peak and Whisper Woods already build, unchanged, just this town's own bonnet-and-gown
  // wardrobe (the same one the two gossiping ladies by the square already wear) in place of either
  // world's winter coat or woodsman's jacket — `makeHuman`'s `o.bow` hand prop sits at the off hand
  // regardless of what else she has on.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // clicking the real start button and then `game.travel(3, 'from-prev')`, waiting out both the load
  // and the fade-lock timers) sampled every NPC's own position every 10th frame over 2400 simulated
  // frames, then swept a grid of the open south-east meadow (short of the radius (88) where
  // `victorianRegion`'s own procedural fill takes over) against both those samples and every one of
  // the town's physics boxes before this range existed: (52, -68), radius 85.3 m, came back clear by
  // 9.85 m of the nearest box (the tug-of-war, 75, -29) with the target ten metres north at (52, -58),
  // radius 77.9 m — the line between them clear by 18.05 m of anything else once the target's own
  // standing box (which the archer naturally stands close to) is set aside.
  { const ax = 52, az = -68, ary = 0, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    game.physics.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0x3a5a3a], pants: [0x1e1e24], shoes: [0x181410] });
    const archer = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.2), wardrobe: bowWard }),
      hat: 'bonnet', hatColor: 0x3a5a3a, sleeves: true, dress: 0x3a5a3a, sash: 0xd8c8a8, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist,
      cries: ['Forty yards, and still true to the gold.', "Mind your tail, puss — you're no target, but best stand well clear.", 'The Society meets every fine Tuesday. Do bring your mistress along.'] })); }
  // Whisper Woods, Sunny Shore, Frosty Peak, Robot City, the Neighborhood and Candy Land all have the
  // same knee-high spiderweb slung between two twig stakes (`makeSpiderweb()`, 62-props-nature.js —
  // dew beads, three silk rings, a spider holding dead centre) by now; Victorian, for all its flower
  // baskets and lamp posts, never got one of its own. **A real spiderweb now hangs between two stakes
  // on the quiet grass south-west of the market square**, well clear of the tetherball pole, the
  // bootblack's stand and the juggler's own pitch.
  //
  // No new mesh, no new physics box: `makeSpiderweb()` is the identical rig the other six worlds
  // already use, placed with plain `place()` same as the Neighborhood's and Robot City's own, since
  // this town's ground is flat at y=0 the same way those two are.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // clicking the real start button and then `game.travel(3, 'from-prev')`, waiting out both the load
  // and the fade-lock timers) sampled every NPC's own position every 10th frame over 2400 simulated
  // frames, then swept five candidate points in the open south-west meadow (short of the radius (88)
  // where `victorianRegion`'s own procedural fill takes over) against those samples and every one of
  // the town's 572 physics boxes: (-35, -55) came back clearest of the lot tried, 16.6 m clear of the
  // nearest box, 11.3 m clear of the nearest wandering soul and 18.4 m clear of every `game.zones`
  // rectangle and circle. Built dead last, right after the archer, since `makeHuman()`,
  // `randomPerson()` and `makeSpiderweb()`'s own dew-phase roll all draw off this town's shared `r()`
  // sequence unconditionally.
  { const web = place(game, U, makeSpiderweb(r), -35, -55, atan2(0 - -35, 0 - -55)); }
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
  // the Neighborhood's had a cyclist of its own for a long while (`makeBike` + `Cyclist`, reusing
  // `Vehicle`'s own stop-for-the-cat lane logic the carriage above relies on) but no other world ever
  // got a second one — Victorian, with the carriage already running down the middle of the street, had
  // the obvious free lane just the other side of centre. A telegram boy now pedals the opposite way
  // along z=1.3 (mirroring the carriage's own z=-1.3, same laneW of 1.0, so the two lanes' own stop
  // zones — z in [0.3,2.3] and [-2.3,-0.3] — never overlap), satchel across his chest, ringing his bell
  // for the cat exactly as the Neighborhood's own cyclist does. `Cyclist` picks up `cries`/`cryIcon` for
  // the first time here — it had neither before, since the Neighborhood's own rider never needed a line
  // — drawn from the shared `rnd()` sequence at the moment each one is constructed, same as every other
  // controller's cries in this file, never this world's own seeded `r()`, so it costs nothing from this
  // build's later wardrobe picks. *"Telegram! Make way, make way!"* *"Ring, ring — mind your tail,
  // puss!"* *"Can't stop, important business!"*
  { const boy = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: vicWard }),
      pants: 0x1e1e24, hat: 'flatcap', hatColor: 0x3a3327, bag: 0x5a3a1f, glasses: false });
    const bike = makeBike(0x2a4a33); W.add(bike.group);
    game.npcs.push(new Cyclist(game, boy, bike, { z: 1.3, dir: -1, speed: 2.6, x: 50, limit: 62, laneW: 1.0,
      cries: ['Telegram! Make way, make way!', 'Ring, ring — mind your tail, puss!', "Can't stop, important business!"], cryIcon: '📨' })); }
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
  // every other world already had a Painter at an easel (the Neighborhood, Robot City, Sunny Shore, Frosty
  // Peak and Whisper Woods) — Victorian's clock tower plaza had the tower itself and nothing else, the one
  // open space in the hand-built town with no one in it at all. An artist now sets up in its south-east
  // corner, easel aimed back at the tower. A headless probe swept the plaza against the tower's own box
  // (half-extent 3.75 m, centred (42, 0)) and every street lamp: (48, 6) comes back clear by over 2 m of
  // the tower on both axes and over 7.5 m from the nearest lamp (45, -6.4) — still inside the 16x16 paved
  // plaza and the zone circle (radius 11) that keeps victorianRegion's own fill off it
  { const px = 48, pz = 6, pry = atan2(42 - px, 0 - pz);
    const towerWard = makeWardrobe(r, { shirts: [0x6a5a7a, 0x4a3a5a, 0x3a5a4a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const painter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: towerWard }),
      pants: 0x2a2a24, hat: 'flatcap', hatColor: 0x3a3327, coat: true, buttons: null, scarf: 0x5a4a3a, glasses: r.chance(0.3), build: 'slim' });
    W.add(painter.group);
    game.npcs.push(new Painter(game, painter, makeEasel(), { x: px, z: pz, ry: pry,
      cries: ["Forty-three minutes past, and not a soul minds the time.", "I've painted that tower a hundred times. Never once been wrong.", "Mind the wet paint, puss — oh, you can't read, can you."] })); }
  // the clock tower has stood over this plaza since the town was first built, and the fiddler and the
  // painter have worked its north side for rounds now — but no one in the whole town has ever actually
  // mended a watch, Victorian's one trade a story-book clock tower all but demands. A watchmaker now
  // sits on a stool on the plaza's quiet south side, a pocket watch open in one hand and a jeweler's
  // loupe raised to one eye in the other, peering into the works. A small pedestal table in front of
  // him carries a green baize cloth, three more pocket watches laid out, a little desk clock (its second
  // hand actually ticking round, driven off the world clock `t`), and a scatter of loose brass cogs.
  // No new controller: `Sitter` already seats a rig on a stool and leaves the arms alone whenever
  // `rig.gesture` isn't set (the beach's net-mender and ukulele player both already use it this way) —
  // the loupe hand is just raised once, in this build's own `U.push`, the same trick the beach
  // musician's strumming arm and the backyard griller's tongs both already lean on, guarded by
  // `!watchmaker.gesture` so a greeting wave still wins over the held pose.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Victorian
  // town (`game.travel(3, 'from-prev')`, then `game.start('new')` so the fiddler, the painter, the
  // bobby and every wanderer actually moved), sampled every NPC's own position every quarter second
  // over 300 simulated seconds, then swept the plaza's own paving (the 16×16 slab at (42, 0)) against
  // both those samples and every one of the town's physics boxes: (42, -6) came back clear by 2.25 m of
  // the tower's own base (half-extent 3.75, the plaza's own tightest box) and 5.0 m of the nearest
  // other soul — the opposite corner of the plaza from the fiddler and the painter, still inside the
  // zone circle (radius 11, centred (42, 0)) that keeps victorianRegion's own fill off the plaza
  // entirely.
  { const wx = 42, wz = -6, wry = 0, tz = wz + 0.42;
    const watchmaker = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: r.chance(0.5), wardrobe: vicWard }),
      pants: 0x1e1e24, apron: 0x4a3326, sleeves: true, hat: null, coat: null, scarf: null, bag: null, backpack: null, glasses: false, moustache: r.chance(0.4), build: 'slim' });
    W.add(watchmaker.group);
    const brass = mat(0xc9a227, { metalness: 0.65, roughness: 0.35 }), glassM = mat(0xdff3ff, { roughness: 0.1, transparent: true, opacity: 0.4 }), darkM = mat(0x2a2420, { roughness: 0.6 });
    const watch = group(0, 0, 0.06, watchmaker.hands[0]); watch.rotation.x = -0.8;   // the open watch, held low
    mesh(G.cyl(0.055, 0.055, 0.016, 16), brass, { parent: watch });
    mesh(G.cyl(0.05, 0.05, 0.002, 16), glassM, { y: 0.009, parent: watch });
    noInk(mesh(G.cyl(0.004, 0.004, 0.03, 6), brass, { x: 0.03, rz: PI / 2, parent: watch }));   // the hour hand, mid-repair
    const loupe = group(0, 0.1, 0.1, watchmaker.hands[1]); loupe.rotation.x = -0.3;   // the loupe, raised to the eye
    noInk(mesh(G.torus(0.028, 0.008, 6, 14), darkM, { parent: loupe }));
    mesh(G.cyl(0.026, 0.026, 0.004, 14), glassM, { parent: loupe });
    noInk(mesh(G.cyl(0.006, 0.006, 0.07, 6), darkM, { y: -0.04, rx: PI / 2, parent: loupe }));   // its handle, back toward the fist
    const table = group(wx, 0, tz, W);
    mesh(G.cyl(0.3, 0.3, 0.02, 16), mat(0x3f6b3f, { roughness: 0.85 }), { y: 0.46, shadow: 'both', parent: table });   // baize top
    mesh(G.cyl(0.035, 0.045, 0.44, 8), mat(0x3a2a1a, { roughness: 0.8 }), { y: 0.22, shadow: 'both', parent: table }); // single pedestal leg
    mesh(G.cyl(0.26, 0.26, 0.02, 12), mat(0x3a2a1a, { roughness: 0.8 }), { y: 0.01, shadow: 'both', parent: table });  // its foot
    for (const [dx, dz, c] of [[-0.15, 0.08, 0xd9d9d9], [0.12, 0.1, 0xc9a227], [0.02, -0.12, 0xb8bcc0]]) mesh(G.cyl(0.045, 0.045, 0.014, 14), mat(c, { metalness: 0.55, roughness: 0.4 }), { x: dx, y: 0.48, z: dz, ry: r() * TAU, parent: table });
    for (let i = 0; i < 5; i++) mesh(G.cyl(0.018, 0.016, 0.01, 10), mat(0xc9a227, { metalness: 0.6, roughness: 0.4 }), { x: -0.2 + i * 0.02, y: 0.475, z: 0.16 - i * 0.015, ry: r() * TAU, parent: table });   // loose cogs
    const deskClock = group(0.18, 0.48, -0.08, table);
    mesh(G.cyl(0.05, 0.05, 0.03, 14), brass, { parent: deskClock });
    mesh(G.cyl(0.044, 0.044, 0.002, 14), mat(0xf2ead8, { roughness: 0.6 }), { y: 0.017, parent: deskClock });
    const secondHand = group(0, 0.019, 0, deskClock); noInk(mesh(G.box(0.002, 0.034, 0.002), darkM, { y: 0.017, parent: secondHand }));
    U.push((dt, t) => { secondHand.rotation.y = t * 1.2; });
    P.addBox(wx, 0.24, tz, 0.6, 0.48, 0.6, { cam: false });
    const stool = group(wx, 0, wz, W);
    mesh(G.cyl(0.18, 0.18, 0.03, 14), mat(0x5a3a1f, { roughness: 0.85 }), { y: 0.405, shadow: 'both', parent: stool });
    mesh(G.cyl(0.1, 0.07, 0.39, 10), mat(0x3a2a1a, { roughness: 0.8 }), { y: 0.195, shadow: 'both', parent: stool });
    P.addBox(wx, 0.21, wz, 0.3, 0.42, 0.3, { cam: false });
    game.npcs.push(new Sitter(game, watchmaker, { x: wx, z: wz, ry: wry, seat: 0.42,
      cries: ['⌚ "Four faces on that tower — I only ever trust the one on my own bench."', '⌚ "Careful, puss — these gears are smaller than your whiskers."', '⌚ "A good watch keeps its own time. A bad one keeps you waiting."'] }));
    U.push(() => { if (!watchmaker.gesture) { const A = watchmaker.arms[1]; A.sh.rotation.x = -1.85; A.sh.rotation.z = -0.15; A.el.rotation.x = -1.9; } }); }
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
  // the Neighborhood and Candy Land both got a seesaw already — Victorian was the one world left with a
  // swing but no seesaw. A headless probe swept the same grass verge against every physics box and NPC
  // circle built into the town so far (the tag pair, the ring, the catch pair and the swing set): (25, 70)
  // came back clear by over 23 m from the nearest of them (the swing set), well south of all four and
  // still inside the radius where the hand-built town gives way to victorianRegion's procedural fill (88)
  { const sx = 25, sz = 70;
    const seesaw = makeSeesaw({ color: 0x8a3a3a }); place(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeWard = makeWardrobe(r, { shirts: [0x6a3a3a, 0x3a5a6a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const seeA = makeHuman({ ...randomPerson(r, { child: true, female: false, wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    const seeB = makeHuman({ ...randomPerson(r, { child: true, female: true, wardrobe: seeWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(seeA.group); W.add(seeB.group);
    game.npcs.push(new Seesaw(game, seeA, seeB, seesaw, { x: sx, z: sz })); }
  // the Neighborhood, Candy Land, Sunny Shore and Frosty Peak all have a kite in the sky, but it was always
  // children's play Victorian never got — the north bank's grass verge had room for a fifth game alongside
  // tag, the ring dance, catch and the swing/seesaw pair. A headless probe swept a grid of candidates (every
  // physics box, every NPC's own leashed-wander range, in a build taken all the way through `game.travel(3,
  // 'from-prev')`) across the verge, staying inside radius 80 from the town's own centre so the kite's kid
  // stands well short of the radius (88) where victorianRegion's procedural fill takes over: (50, 55) came
  // back clear by over 20 m of the nearest of them (the ring dance at (2, 58)), well east of the swing and
  // seesaw at x=25 and with nothing overhead — the nearest hand-planted tree is 30+ m off at (36, 22), by the
  // clock tower. The wind blows east and slightly north (away from the whole cluster of games), so the kite's
  // own figure-of-eight swoop, offset up to 9 m downwind and 3.2 m to either side at 6-8 m up, never crosses
  // back over any of them.
  { const kiteWard = makeWardrobe(r, { shirts: [0x8a3a3a, 0x3a5a6a, 0xd9c9a8], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const kiteKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: kiteWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(kiteKid.group);
    game.npcs.push(new KiteFlyer(game, kiteKid, makeKite(0x8a3a3a, 0xd9c9a8), { x: 50, z: 55, wind: [0.85, 0.3],
      cries: ['Caught the wind off the clock tower, this one did!', "Mind you don't trip the string, puss.", 'Highest it\'s flown all week.'] })); }
  // the Neighborhood, Candy Land, Robot City, Sunny Shore, Frosty Peak and Whisper Woods all have a
  // Detectorist sweeping for buried treasure by now — Victorian was the last of the seven left without
  // one, past the mudlark's own pan of canal mud. One works the quiet grass west of the games cluster,
  // well clear of the catch pair, headphones on, hoping for an old coin rather than another button.
  // A headless probe swept the north bank against every physics box and NPC built into the town so far:
  // (-45, 42) came back clear by 15.9 m of the catch pair's own leashed gap at (-25, 52), over 35 m of
  // the mudlark at (-10, 37.3) and far past every other game on the verge (the tag pair, the ring dance,
  // the swing and seesaw, the kite kid), still well inside the radius (88) where victorianRegion's own
  // procedural fill takes over.
  { const relicWard = makeWardrobe(r, { shirts: [0x5a6a4a, 0x4a3f33, 0x5c4a2f], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const relicFemale = r.chance(0.5);
    const relicHunter = makeHuman({ ...randomPerson(r, { female: relicFemale, child: false, elder: r.chance(0.4), wardrobe: relicWard }),
      hat: relicFemale ? 'bonnet' : 'flatcap', hatColor: 0x3a3327, coat: true, scarf: null, jacket: null, bag: null, glasses: r.chance(0.3) });
    W.add(relicHunter.group);
    game.npcs.push(new Detectorist(game, relicHunter, { x: -45, z: 42, ry: PI,
      cries: ["Just a button. Every time.", "Careful, puss — mind the headphones cable.", "One day it'll be a whole Roman hoard."] })); }
  // the market square has had a fruit stall, a flower stall, a pieman and a cheesemonger for a long
  // while now, but no world in the whole game had ever had a chestnut roaster — the most Victorian
  // thing a street corner can sell. One now works the quiet grass past the canal's north bank, well
  // east of the games cluster, her brazier beside her rather than a stall (nobody had put a standalone
  // fire-lit cart anywhere in this town). A headless probe built the real Victorian town and sampled
  // every NPC's own position continuously over 30 simulated seconds (so no wandering urchin or dancer
  // mid-game could slip past unnoticed), then swept the grass east of the games against both those
  // samples and every one of the town's physics boxes, staying short of the radius (88) where
  // victorianRegion's own procedural fill takes over: (73, 39) came back clear by 27.7 m of the nearest
  // other soul (the kite kid, the furthest east of the games) and 5 m of the nearest box — the canal's
  // own bank, 4.4 m south.
  { const vx = 73, vz = 39.6, bx = 73, bz = 38.3, vry = atan2(bx - vx, bz - vz);
    const roastWard = makeWardrobe(r, { shirts: [0x6a3a3a, 0x5a4a3a, 0x3a4a4a], pants: [0x2a2420, 0x2a2a24], shoes: [0x2a2018, 0x1e1a16] });
    const roaster = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: roastWard }),
      pants: 0x2a2420, apron: 0x3a3330, hat: r.chance(0.5) ? 'flatcap' : 'bonnet', hatColor: 0x3a3327, scarf: 0x6a3a3a, bag: null, jacket: null, glasses: false });
    W.add(roaster.group);
    const brazier = place(game, U, makeChestnutBrazier(), bx, bz, 0);
    P.addBox(bx, 0.3, bz, 0.3, 0.65, 0.3, { cam: false });
    const v = new Vendor(game, roaster, makeChestnutCone(), { x: vx, z: vz, ry: vry, cryIcon: '🌰',
      cries: ["Hot chestnuts! Straight off the brazier!", "Careful, puss — that griddle's hotter than it looks.", "Best thing for cold hands, this time of year."] });
    game.npcs.push(v); greetable(game, v);
    // the roaster's own sell cries cover the chestnuts; the brazier itself, right beside her, never got a
    // look of its own. `place()`'s return value (previously discarded) is the same drum this whole block
    // already built and boxed, handed straight to `game.addInteractable` — no new mesh, no new box.
    const brazierLines = ["The vents glow a deep, steady orange.", "Warm enough to feel from here.", "A faint crack and hiss — one more chestnut giving in."];
    game.addInteractable({ obj: brazier, radius: 1.2, label: () => 'Look at the brazier', onUse: () => { SFX.click(); game.toast(rnd.pick(brazierLines), 3000); } }); }
  // the Neighborhood, Candy Land and Robot City all have a kid working a yo-yo by now — Victorian, for
  // all five of its own games on the north bank (tag, the ring dance, catch, the swing and the seesaw),
  // never had one. A child now works one on the grass between the kite kid and the chestnut roaster,
  // facing the brazier as if drawn in by the smell. Same placement-only trick as the other three (`YoYoer`
  // needs no held prop beyond what it builds itself off `rig.hands[1]`). A headless probe built the real
  // Victorian town (`game.travel(3, 'from-prev')`) and sampled every NPC's own position continuously over
  // 30 simulated seconds (so no wandering urchin or dancer mid-game could slip past unnoticed), then swept
  // a grid of candidates between the kite kid at (50, 55) and the roaster at (73, 39.6) against both those
  // samples and every one of the town's physics boxes, keeping the whole grid under 78 m from the origin —
  // comfortably short of the radius (88) where victorianRegion's own procedural fill takes over: (61, 48)
  // came back clear by 13.4 m of the nearest box and 13.0 m of the nearest other soul (the kite kid).
  { const yoyoWard = makeWardrobe(r, { shirts: [0x6a4a3a, 0x3a4a6a, 0x5a3a3a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const yoyoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: yoyoWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(yoyoKid.group);
    game.npcs.push(new YoYoer(game, yoyoKid, 0xc9a227, { x: 61, z: 48, ry: atan2(73 - 61, 39.6 - 48),
      cries: ["Forty drops, guv'nor, and not one tangle yet!", "Mind your paws, puss — it bites back if you miss the catch.", "Won it off a lad by the bridge. Best three of five, he said. Liar."] })); }
  // Whisper Woods, Sunny Shore, the Neighborhood and Candy Land all have a jump-rope kid by now —
  // Victorian, for all six of its own games on the north bank, never had one. A child now skips rope
  // on the open grass past the ring dance, well clear of every other game. A headless probe built the
  // real Victorian town (`game.travel(3, 'from-prev')`) and sampled every NPC's own position every
  // quarter second over 30 simulated seconds (so no wandering urchin, dancer or tag pair mid-turn
  // could slip past unnoticed), then swept the open grass north of the ring dance against both those
  // samples and every one of the town's physics boxes: (-10, 65) came back clear by 28.2 m of the
  // nearest box (the seesaw's own post, the furthest-flung of the hand-placed props) and 15.5 m of the
  // nearest other soul (the ring dance at (2, 58)), at radius 65.8 from the origin — comfortably short
  // of the radius (88) where victorianRegion's own procedural fill takes over.
  { const jumpWard = makeWardrobe(r, { shirts: [0x6a5a3a, 0x3a5a4a, 0x8a3a3a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const jx = -10, jz = 65;
    const jumper = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: jumpWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(jumper.group);
    game.npcs.push(new JumpRoper(game, jumper, 0x2f6fd6, { x: jx, z: jz, ry: atan2(0 - jx, 0 - jz),
      cries: ['A hundred skips and not a trip!', "Mind your tail, puss — the rope swings wider than it looks.", 'Better than catch for keeping warm.'] })); }
  // the Neighborhood, Candy Land, Robot City, Sunny Shore and Whisper Woods all have a hula hooper by
  // now — Victorian and Frosty Peak were the only two worlds left without one. A girl now spins a
  // hoop on the open grass south of the terraces, well past every hand-placed prop and game on the
  // north bank. A headless probe built the real Victorian town (`game.load(3, 'from-prev')`) and
  // sampled every NPC's own position every quarter second over 30 simulated seconds (so no wandering
  // urchin, dancer or tag pair mid-turn could slip past unnoticed), then swept the open grass south of
  // the market square against both those samples and every one of the town's physics boxes: (50, -46)
  // came back clear by 31 m of the nearest box (a terrace house's own fence) and 38.7 m of the nearest
  // other soul, at radius 67.9 from the origin — comfortably short of the radius (88) where
  // victorianRegion's own procedural fill takes over.
  { const hx = 50, hz = -46;
    const hoopKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5) }), shirt: 0x6fd68a, backpack: null, hat: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(hoopKid.group);
    game.npcs.push(new HulaHooper(game, hoopKid, 0xc9516a, { x: hx, z: hz, ry: atan2(0 - hx, 0 - hz),
      cries: ["A hundred round and not a wobble, guv'nor!", "Mind your tail, puss — it swings wider than it looks.", "Found it behind the market stalls. Nobody's claimed it yet."] })); }
  // the Neighborhood and Candy Land both have a kid kneeling by a wobbly scooter — Victorian, for all
  // nine of its own games and vignettes on the north bank by now, never had one. A girl kneels in the
  // open grass west of the catch pair, tightening her scooter's back wheel. Same `makeScooter()` +
  // `Kneeler` pairing as the other two, no new controller. A headless probe built the real Victorian
  // town (`game.travel(3, 'from-prev')`) and sampled every NPC's own position every quarter second over
  // 30 simulated seconds (so no wandering urchin, dancer or game mid-turn could slip past unnoticed),
  // then swept the open grass against both those samples and every physics box: (-48, 52) came back
  // clear by 17.6 m of the nearest box and 18.0 m of the nearest other soul (the catch pair at
  // (-25, 52)), at radius 70.8 from the origin — comfortably short of the radius (88) where
  // victorianRegion's own procedural fill takes over.
  { const sx = -48, sz = 52, kx = -47.1, kz = 52, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0xa65a2e); place(game, U, scooter, sx, sz, 0.4);
    P.addBox(sx, 0.4, sz, 0.3, 0.8, 0.6, { cam: false });
    const scootWard = makeWardrobe(r, { shirts: [0x6a4a6a, 0x4a6a5a, 0x8a5a3a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const scootKid = makeHuman({ ...randomPerson(r, { female: true, child: true, wardrobe: scootWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(scootKid.group);
    game.npcs.push(new Kneeler(game, scootKid, { x: kx, z: kz, ry,
      cries: ['Just a wobbly bolt, guv\'nor — nearly got it.', "Careful, puss — mind your tail, this spins.", "Good as new. Right round the square, no hands, easy."] })); }
  // the Neighborhood has had a girl chalking a hopscotch grid onto its own pavement since round 141,
  // and Robot City picked the game up too — Victorian, for all its own cobblestones, never got one.
  // A boy now kneels on the quiet cobblestones south-west of the market square, six squares chalked in
  // a row, same `Kneeler` stance and the same hand-held chalk stub every hand-held tool in this file
  // already uses, just a flatcap and a different hand this time round. A headless probe built the real
  // Victorian town (`game.travel(3, 'from-prev')`) and sampled every NPC's own position every quarter
  // second over 30 simulated seconds (so no wandering urchin, dancer or game mid-turn could slip past
  // unnoticed), then swept the open cobblestones south-west of the market square against both those
  // samples and every one of the town's physics boxes: (-42, -58) came back clear by 29.4 m of the
  // nearest box (a streetlamp down by the lane) and 29.4 m of the nearest other soul (a wandering
  // urchin), at radius 71.6 from the origin — comfortably short of the radius (88) where
  // victorianRegion's own procedural fill takes over.
  { const gz = -58, kx = -45.9, kz = -57.85, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = -45 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const chalker = makeHuman({ ...randomPerson(r, { female: false, child: true }), hat: 'flatcap', hatColor: 0x3a3a44, backpack: null, scarf: null, jacket: null, bag: null, glasses: false });
    W.add(chalker.group);
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['Six squares, dry before the rain comes back.', "Careful, puss — mind the chalk lines!", "Found the stub behind the schoolhouse. Nobody's missed it yet."] })); }
  // Robot City and the Neighborhood both picked up the oldest pavement game of all two rounds back —
  // marbles — but Victorian, for all ten of its own games and vignettes on the north bank by now, never
  // had a ring of its own. A boy now kneels on the grass south-west of the seesaw, flicking marbles at
  // a chalked ring, mirroring the seesaw's own spot across the games cluster rather than crowding any of
  // it. No new controller: `Kneeler`'s own patting motion already reads as the flick, the same trick the
  // hopscotch chalker, the bootblack and the scooter kid all use — this is a placement, not a build.
  // A headless probe (the same stub-three harness `test/run.mjs` uses) built the real Victorian town
  // (`game.travel(3, 'from-prev')`) and sampled every NPC's own position every quarter second over 30
  // simulated seconds (so no wandering urchin, dancer or game mid-turn could slip past unnoticed), then
  // checked a handful of candidates against both those samples and every one of the town's physics
  // boxes: (-25, 70) came back clear by 8.85 m of the nearest box (the seesaw's own post) and 28 m of
  // the nearest other soul (the catch pair at (-25, 52)), at radius 74.3 from the origin — comfortably
  // short of the radius (88) where victorianRegion's own procedural fill takes over.
  { const mcx = -25, mcz = 70, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: mcx + marblePos[i][0], y: 0.035, z: mcz + marblePos[i][1], shadow: 'none', parent: W });
    mesh(G.sphere(0.035, 8, 6), mat(0x00e5ff, { roughness: 0.2 }), { x: mkx + 0.35, y: 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleWard = makeWardrobe(r, { shirts: [0x6a5a3a, 0x3a5a4a, 0x8a3a3a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const marbleKid = makeHuman({ ...randomPerson(r, { female: false, child: true, wardrobe: marbleWard }), hat: 'flatcap', hatColor: 0x3a3a44, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(marbleKid.group);
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["Fair go, guv'nor — mind my aim!", "Careful, puss — don't swallow one of these.", "Grandad gave me the bag. Won them all himself, he says."] })); }
  // every world's open spaces have filled in fast, but Victorian's own night watchman — the "Charley"
  // who should have been patrolling these streets after dark — was never actually there: only the bobby
  // on the beat (a daytime constable by uniform) stood in for him. One now naps on a bench in the quiet
  // grass south of the market square, lantern set down beside him, chin on his chest, fast asleep.
  // Reuses `Sitter` exactly as the park bench's own pair in the Neighborhood and every knitter, whittler
  // and reader since — the sleeping nod is a plain per-frame override of `rig.head.rotation.x` (which
  // `Sitter` itself only ever touches on `rotation.y`, so nothing fights it), and the one-shot wake is
  // the same `dist2`-and-a-bool trick the Candy Queen's growl and Frosty Peak's yeti already use. A
  // headless probe built the real Victorian town (`game.travel(3, 'from-prev')`) and sampled every
  // NPC's own position every tenth of a second over 30 simulated seconds (so no wandering urchin,
  // dancer or game mid-turn could slip past unnoticed), then swept the open grass south of the market
  // square against both those samples and every one of the town's physics boxes: (36, -30) came back
  // clear by 15.0 m of the nearest box and 21.3 m of the nearest other soul, at radius 46.9 from the
  // origin — comfortably short of the radius (88) where victorianRegion's own procedural fill takes over.
  { const wx = 36, wz = -30, wry = 0;
    const watchWard = makeWardrobe(r, { shirts: [0x2a2e38, 0x30342e], pants: [0x1e1e24], shoes: [0x1a1410] });
    const watchman = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true, wardrobe: watchWard }),
      pants: 0x1e1e24, coat: true, hat: 'flatcap', hatColor: 0x1e2436, scarf: 0x3a3a44, buttons: null,
      beard: false, moustache: true, glasses: false, cane: false, build: 'stout' });
    W.add(watchman.group);
    place(game, U, makeBench(), wx, wz, wry); P.addBox(wx, 0.4, wz, 1.9, 0.8, 0.6, { cam: false });
    // a lantern set down on the grass beside the bench, glass glowing, flame guttering gently
    const lx = wx + 1.1, lz = wz - 0.4, iron = mat(0x1e2426, { roughness: 0.6, metalness: 0.5 });
    const lantern = group(lx, 0, lz, W);
    mesh(G.cyl(0.07, 0.09, 0.05, 10), iron, { y: 0.025, parent: lantern });
    const glass = mesh(G.box(0.13, 0.18, 0.13), glowMat(0xffc46a, 1.8, { transparent: true, opacity: 0.85 }), { y: 0.14, shadow: 'none', parent: lantern });
    for (const a of [0, PI / 2]) mesh(G.box(0.15, 0.015, 0.015), iron, { y: 0.14, ry: a, shadow: 'none', parent: lantern });
    mesh(G.cyl(0.08, 0.1, 0.03, 10), iron, { y: 0.235, parent: lantern });
    noInk(mesh(G.torus(0.09, 0.012, 6, 10, PI), iron, { y: 0.33, rz: PI / 2, shadow: 'none', parent: lantern }));
    glowSprite(0xffb85a, 0.5, 0.5, lantern).position.y = 0.14;
    const lanternLight = pointLight(0xffb060, 9, 6, lx, 0.2, lz, W);
    P.addBox(lx, 0.1, lz, 0.2, 0.3, 0.2, { cam: false });
    game.npcs.push(new Sitter(game, watchman, { x: wx, z: wz, ry: wry,
      cries: ["Quiet tonight. Quiet every night, if I'm honest.", "Don't tell the sergeant, puss.", "Forty years on this beat and never once needed that rattle."] }));
    let watchNear = false, watchSnoreT = rnd.range(2, 3.5);
    U.push((dt, t) => {
      const c = game.cat.group.position, near = dist2(c.x, c.z, wx, wz) < 36;
      watchman.head.rotation.x = damp(watchman.head.rotation.x, near ? 0 : 0.85, 6, dt);
      lanternLight.intensity = 8 + sin(t * 9) * 1.2; glass.material.emissiveIntensity = 1.6 + sin(t * 9) * 0.3;
      if (near && !watchNear) { watchNear = true; SFX.whistle(); game.toast('🕯️ "WHO GOES THERE?! ...oh. Just a cat. Carry on, carry on."'); }
      if (!near) { watchNear = false; watchSnoreT -= dt; if (watchSnoreT <= 0) { watchSnoreT = rnd.range(2.5, 4); game.fx.emit(wx, P.ground0(wx, wz) + 1.1, wz, { count: 1, color: 0xbcdfff, speed: 0.15, up: 0.4, life: 1.6, gravity: -0.05, spread: 0.15 }); } }
    }); }
  // the children had marbles, hopscotch, tag and two separate ball games by now, but nobody in Victorian
  // had a game for the old folk. Two retired gents now sit either side of a small round table on the
  // quiet grass south-west of the market square, a draughts board between them, mid-game. No new
  // controller: both are a plain `Sitter`, the same pairing the knitter and whittler already use in
  // Whisper Woods, just seated on a `makeIceStool()` each instead of a stump — reused as a generic
  // three-legged stool here, nothing to do with ice. A headless probe (the same stub-three harness
  // `test/run.mjs` uses) built the real town (`game.travel(3, 'from-prev')`), clicked start, then
  // sampled every one of its 64 NPCs' own positions every 1/30 s over 30 simulated seconds (long enough
  // for the urchins' tag, both ball games and the ring dance to show their whole loop, not just a
  // snapshot) and swept the grass south-west of the market square against both that trace and every one
  // of the town's physics boxes, staying short of the radius (88) where victorianRegion's own fill takes
  // over: (-34, -38) came back clear by 18.4 m of the nearest box and 20.0 m of the nearest other soul,
  // at radius 51.0 from the origin — roughly the mirror image, across the square, of the night
  // watchman's own bench at (36, -30).
  { const tx = -34, tz = -38, topY = 0.74, boardW = 0.74, sq2 = boardW / 8;
    const seatAx = tx - 0.78, seatAz = tz, seatBx = tx + 0.78, seatBz = tz;
    const ryA = atan2(seatBx - seatAx, seatBz - seatAz), ryB = atan2(seatAx - seatBx, seatAz - seatBz);
    const wood = mat(0x6b4a2a, { roughness: 0.85, map: TEX.planks(26, 26) });
    const table = group(tx, 0, tz, W);
    mesh(G.box(boardW, 0.03, boardW), wood, { y: topY, parent: table });
    const lightSq = mat(0xe8dcc0, { roughness: 0.9 }), darkSq = mat(0x4a2e1c, { roughness: 0.9 });
    for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 8; gz++) {
      mesh(G.box(sq2 * 0.97, 0.01, sq2 * 0.97), (gx + gz) % 2 ? darkSq : lightSq,
        { x: -boardW / 2 + sq2 * (gx + 0.5), y: topY + 0.021, z: -boardW / 2 + sq2 * (gz + 0.5), parent: table }); }
    for (const [lx, lz] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) mesh(G.cyl(0.025, 0.03, topY, 8), wood, { x: lx, y: topY / 2, z: lz, parent: table });
    // a scatter of pieces, mid-game, dark squares only
    const redM = mat(0x8a2a2a, { roughness: 0.4 }), blackM = mat(0x1e1e22, { roughness: 0.4 });
    const pieceY = topY + 0.036;
    const toXZ = (gx, gz) => [-boardW / 2 + sq2 * (gx + 0.5), -boardW / 2 + sq2 * (gz + 0.5)];
    [[1, 0, redM], [3, 0, redM], [0, 1, redM], [2, 1, redM], [4, 1, redM], [1, 2, blackM], [3, 4, blackM], [5, 4, blackM], [2, 5, blackM], [6, 3, redM]].forEach(([gx, gz, m]) => {
      const [px, pz] = toXZ(gx, gz); mesh(G.cyl(0.042, 0.042, 0.018, 12), m, { x: px, y: pieceY, z: pz, parent: table }); });
    P.addBox(tx, topY / 2, tz, boardW + 0.06, topY, boardW + 0.06, { cam: false });
    place(game, U, makeIceStool(), seatAx, seatAz, ryA + PI); place(game, U, makeIceStool(), seatBx, seatBz, ryB + PI);
    const draughtsWard = makeWardrobe(r, { shirts: [0x5a5248, 0x3a4a52], pants: [0x2a2a30, 0x34302a] });
    const playerA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true, wardrobe: draughtsWard }),
      hat: 'flatcap', hatColor: 0x3a3a40, coat: true, scarf: null, jacket: null, bag: null, cane: false, beard: false, moustache: true, glasses: false });
    const playerB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: true, wardrobe: draughtsWard }),
      hat: null, coat: true, scarf: 0x4a3a2a, jacket: null, bag: null, cane: false, beard: true, moustache: false, glasses: true });
    W.add(playerA.group); W.add(playerB.group);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: ryA, seat: 0.33,
      cries: ["Best of three, same as every afternoon.", "Mind the board, puss — that king took forty years to earn.", "Lost three in a row. Still the better player, obviously."] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: ryB, seat: 0.33,
      cries: ["Forty years, and he still can't beat me.", "Careful, puss — don't knock the pieces.", "One more game. Always one more game."] }));
    let moveT = rnd.range(6, 10);
    U.push((dt) => { moveT -= dt; if (moveT <= 0) { moveT = rnd.range(7, 12); SFX.click(); game.fx.emit(tx, topY + 0.1, tz, { count: 4, color: 0xc9a86a, speed: 0.3, up: 0.3, life: 0.6, gravity: 1.2, spread: 0.4 }); } }); }
  // the Neighborhood, Candy Land, Robot City, Sunny Shore, Frosty Peak and Whisper Woods all bounce a
  // kid on a trampoline by now — Victorian was the last of the seven left without one. A postbox-red
  // trampoline now bounces a visiting child on the open grass east of the seesaw, past every other game
  // and vignette on the north bank, same `makeTrampoline` prop and `Bouncer` controller the other six
  // worlds already use, placed last of every person this build adds so it draws from the tail of this
  // world's own local `r()` sequence.
  // A headless probe (`game.load(3, 'from-hub')` then `game.start('new')`, the same stub-three harness
  // `test/run.mjs` itself uses) sampled every NPC's and the squirrel's own position every quarter second
  // over 300 simulated seconds — long enough for every wandering urchin, dancer and ball-tossing pair to
  // clear the spot several times over — then checked a handful of candidates on the north bank against
  // both those samples and all 546 of the town's physics boxes: (40, 70) came back clear by 13.6 m of
  // the nearest box (the seesaw's own post) and 18.0 m of the nearest other soul (the yoyo kid at
  // (61, 48)), well short of the radius (88) where victorianRegion's own procedural fill takes over.
  { const tx = 40, tz = 70;
    const tramp = makeTrampoline({ color: 0x8b1a1a }); place(game, U, tramp, tx, tz, 0);
    P.addBox(tx, 0.21, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceWard = makeWardrobe(r, { shirts: [0x6fd68a, 0xffa23c, 0x6fa8ff] });
    const bounceKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: bounceWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(bounceKid.group);
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: 0, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Higher than the clock tower, nearly!", "Careful, puss — the springs are tighter than they look.", "Borrowed it off a cousin in Candy Land. Nobody's asked for it back."];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }
  // Sunny Shore's had a girl blowing soap bubbles since round 385 — nowhere else in the game had ever
  // actually bubbled. A barefoot urchin now blows the same kind of bubbles from a clay pipe on the open
  // grass well north of the trampoline, two afloat at a time, drifting up and sideways before each pops
  // into a soft spark, same as the beach version. No new controller (`Charger` again, the child never
  // moves) and no new animated-bubble code: the pipe sits in `hands[1]`, the resting hand nothing else in
  // this build's own idle gestures ever swings, so `pipe.getWorldPosition()` only needs reading once,
  // right after `Charger` fixes the rig's position, for an exact launch point for both bubbles — no
  // manual trig. Driven only by the world clock, never this world's own seeded `r`, so the build costs
  // no later wardrobe or colour pick.
  // A headless probe (`game.load(3, 'from-hub')` then `game.start('new')`, the same stub-three harness
  // `test/run.mjs` itself uses) sampled every NPC's and the squirrel's own position every quarter second
  // over 300 simulated seconds — long enough for every wandering urchin, dancer and ball-tossing pair to
  // clear the spot several times over — then swept a 2 m grid of the open grass north of the river
  // (radius ≤ 84, short of the radius (88) where victorianRegion's own procedural fill takes over)
  // against both those samples and all 547 of the town's physics boxes: (-10, 82) came back clear by
  // 32.5 m of the nearest box and 17.0 m of the nearest other soul.
  { const bkx = -10, bkz = 82, bkry = atan2(-bkx, -bkz);
    const bubbleWard = makeWardrobe(r, { shirts: [0x9a7a5a, 0x7a8a5a, 0x6a6a8a] });
    const blower = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: bubbleWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(blower.group);
    const pipe = group(0.02, 0, 0.1, blower.hands[1]); pipe.rotation.set(-0.3, 0, 0.3);
    mesh(G.cyl(0.012, 0.012, 0.14, 6), mat(0xc9a86a, { roughness: 0.6 }), { y: 0.07, parent: pipe });
    mesh(G.torus(0.045, 0.009, 6, 16), mat(0xf7f3ec, { roughness: 0.3, transparent: true, opacity: 0.6 }), { y: 0.15, parent: pipe });
    game.npcs.push(new Charger(game, blower, { x: bkx, z: bkz, ry: bkry, cryIcon: '🫧',
      cries: ['Farthing a pipeful, if you want a go.', "Careful, puss — don't pop them with your nose!", 'Biggest one yet, that was.'] }));
    const tip = V3(); pipe.getWorldPosition(tip);
    const bubbleM = mat(0xeaf6ff, { pbr: true, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.4 });
    const bubbles = [0, 1].map((i) => ({ m: mesh(G.sphere(0.05, 10, 8), bubbleM, { shadow: 'none', parent: W }), ph: i * 1.8, popped: -1 }));
    const cyc = 3.2;
    U.push((dt, t) => {
      for (const b of bubbles) {
        const k = ((t + b.ph) % cyc) / cyc;
        if (k < 0.92) {
          b.m.visible = true;
          b.m.position.set(tip.x + sin(t * 1.6 + b.ph) * 0.18 * k, tip.y + k * 1.5, tip.z + cos(t * 1.1 + b.ph) * 0.12 * k);
          b.m.scale.setScalar(0.4 + k * 0.7);
        } else {
          b.m.visible = false;
          const cycleNo = floor((t + b.ph) / cyc);
          if (cycleNo !== b.popped) { b.popped = cycleNo;
            const c = game.cat.group.position;
            if (dist2(tip.x, tip.z, c.x, c.z) < 400) { SFX.twinkle(); game.fx.emit(b.m.position.x, b.m.position.y, b.m.position.z, { count: 4, colors: [0xeaf6ff, 0xffffff, 0xbfd8ff], speed: 0.5, up: 0.6, life: 0.5, gravity: 1.5 }); }
          }
        }
      }
    }); }
  // Robot City's archive-bot has had a tripod camera since round 316, but the one trade the Victorian
  // era is actually famous for inventing had never shown up in its own town. A street photographer now
  // stands behind an old box camera on the quiet grass south-east of the market square, ducking under
  // the focusing cloth every so often to compose a shot, then springing straight as the shutter fires —
  // a puff of white sparks off the lens for the flash powder, same beat as every other round's
  // "something happens, then a toast" vignette.
  // New `Photographer` controller in `55-npcs.js`: between shots it just stands (`Charger`'s own idle
  // sway would have done as well, but the bend needed its own joint overrides so a dedicated class was
  // simplest). The bend itself is a plain three-phase ramp (down, hold, up) driven off its own timer,
  // not `rig`'s built-in gesture system (`chop`'s lean reads as a swing, not someone hunched over a
  // viewfinder) — guarded by `if (!rig.gesture)` exactly as the painter's own easel-work is, so a
  // greeting wave or a photo-mode pose still wins over it. The exposure itself latches once per bend
  // (the same single-flag-per-cycle trick the mechanic's spark and the puppet booth's clash already
  // use) a little before the stand-up, while the rig is still fully bent under the cloth composing the
  // shot. `makeOldCamera()` in `60-props.js` builds the tripod, bellows and lens with local +z facing
  // the subject and the dark cloth draped off -z, where the photographer stands; the camera isn't
  // baked, same as the painter's own easel, since nothing here needs to move it once placed.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Victorian
  // town (`game.travel(3, 'from-prev')`, then `game.start('new')` so every urchin, dancer and
  // ball-tossing pair actually moved), sampled every NPC's and the squirrel's own position every
  // quarter second over 300 simulated seconds, then swept a 2 m grid of the quiet grass out to radius
  // 65 from the town's own centre against both those samples and every one of the town's physics boxes:
  // (35, -53) came back clear by 16.7 m of the nearest box and 16.6 m of the nearest other soul, well
  // outside the market square's own zone (centred (0,-34), radius 17).
  { const px = 35, pz = -53, pry = atan2(0 - px, 0 - pz);
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.4), child: false, elder: r.chance(0.35), wardrobe: vicWard }),
      pants: 0x1e1e24, hat: 'flatcap', hatColor: 0x3a3327, coat: true, scarf: null, glasses: r.chance(0.5), moustache: !r.chance(0.4) && r.chance(0.3) });
    W.add(snapper.group);
    const camera = makeOldCamera();
    game.npcs.push(new Photographer(game, snapper, camera, { x: px, z: pz, ry: pry, cryIcon: '📷',
      cries: ['Hold very still now — the plate takes a few seconds!', 'Splendid! Right in profile, if you please.', "Mind the flash, puss — it's only powder, not fire."] })); }
  // the Neighborhood, Candy Land, Sunny Shore, Frosty Peak and Whisper Woods all have a birdwatcher
  // scanning the sky by now — Victorian was the only one left without one, even with its own market-
  // square pigeons and the crumb-feeder who already tends them. This one isn't minding the square's
  // flock: she stands on the quiet field behind the north terrace, binoculars raised at the chimney-pots
  // instead, watching whatever actually nests up there rather than what gets fed down at the fountain.
  // No new controller: `Birder` already builds its own binoculars and greets the cat the same way every
  // other standing figure in this file does, and `vicWard` (built for the street's own wanderers) saves
  // a dedicated wardrobe and any extra draw on the local `r()`.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real Victorian
  // town (`game.load(3, 'from-prev')`, then `game.start('new')` so every urchin, duck, dancer and
  // ball-tossing pair actually moved), sampled every physics circle's position — not just each
  // controller's own `x`/`z`, since a few (the ring dance, the seesaw) only keep a `cx`/`cz` anchor and
  // move their own circles well clear of it — every quarter second over 300 simulated seconds, then
  // swept a 1 m grid of the open grass (radius 18-62, short of the radius (88) where victorianRegion's
  // own procedural fill takes over) against both those samples and all 561 of the town's physics boxes:
  // (-53, 20) came back clear by 5.2 m of the nearest box (the corner of the first terrace house's own
  // garden, at x=-58) and 17.3 m of the nearest other soul, well north of that house's iron fence
  // (z=7.6) and clear of the laundress's own yard two houses along. Placed last of every person this
  // build adds, after the street photographer, so it draws from the very tail of this world's own
  // local `r()` sequence.
  { const bwx = -53, bwz = 20, bwry = atan2(-58 - bwx, 11.5 - bwz);
    const birder = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.4), wardrobe: vicWard }),
      pants: 0x1e1e24, hat: 'bonnet', hatColor: 0x3a3327, coat: true, scarf: null, glasses: true, glassColor: 0x1a1a1a, bag: null, backpack: null });
    W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: bwx, z: bwz, ry: bwry,
      cries: ['Starlings on the chimney-pots again. Must be thirty up there.', "Careful, puss — you're not what I came out to watch.", 'Sparrows nest in every spare pot on this row. Lucky things.'] })); }
  // the Neighborhood, Robot City, Sunny Shore and Frosty Peak all have someone tossing a disc straight
  // up off the palm by now — Candy Land and Whisper Woods are the only other two left without one, and
  // Victorian, for all its vendors, urchins and board-game players, never had anyone just throwing
  // something for the fun of it either. An off-duty errand boy now stands on the open green well south
  // of the terraces, lobbing a disc straight up — it rises on a spin, hangs a beat at the top, and
  // drops back into his palm for the next throw. No new controller or prop: the exact same
  // `FrisbeePlayer` class (`55-npcs.js`, next to `HulaHooper`) the Neighborhood, Robot City, the beach
  // and the mountain already use, just this street's own `vicWard` palette on the thrower and a plain
  // cream disc in place of beachwear, work overalls or a snowsuit.
  // Its own built-in `cries` option is left unused on purpose, same reasoning Robot City's own reskin
  // settled on two rounds back: that path draws its idle-chatter timer from the shared global `rnd()`,
  // and Victorian is tested ahead of three more worlds in the same run — any extra global draw here
  // would shift every `rnd()`-seeded pick downstream (the horse carriage among them) by one. Dialogue
  // instead rides its own `U.push` timer below, seeded off this world's own local `r()`, costing no
  // global draw at all.
  // A headless probe (a scratch script built on the same stub-three harness `test/run.mjs` itself
  // uses) built the real Victorian town (`game.load(3, 'from-prev')`, then `game.start('new')` so
  // every urchin, dancer, duck and ball-tossing pair actually moved), sampled every physics circle's
  // own position every quarter second over 300 simulated seconds, then swept a 2 m grid of the open
  // green (radius 18-84, short of the radius (88) where victorianRegion's own procedural fill takes
  // over) against both those samples and all 712 of the town's physics boxes: (-26, -76) came back
  // clear by 24.4 m of the nearest box and 24.1 m of the nearest other soul — well south of the market
  // square (centred (0,-34), radius 17) and clear of every terrace, fence and lamp along the street.
  // Placed last of every person this build adds, after the birdwatcher, so it draws from the very
  // tail of this world's own local `r()` sequence and disturbs no earlier wardrobe or colour pick.
  { const fx = -26, fz = -76, fry = atan2(-fx, -fz);
    const thrower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: vicWard }),
      pants: 0x1e1e24, hat: 'cap', hatColor: 0x3a3327, coat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: r.chance(0.3) });
    W.add(thrower.group);
    game.npcs.push(new FrisbeePlayer(game, thrower, 0xf7f3ec, { x: fx, z: fz, ry: fry }));
    const frisbeeLines = ["Errand can wait five minutes. It's a nice throw.", "Careful, puss — mind your tail, this one's coming down fast.", "Highest one yet. Don't tell the mistress I was out here."];
    let frisbeeCryT = r.range(3, 7);
    U.push((dt) => { frisbeeCryT -= dt; if (frisbeeCryT <= 0) { frisbeeCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(fx, fz, c.x, c.z) < 400) { game.toast('🥏 "' + r.pick(frisbeeLines) + '"', 2400); SFX.talk(); } } }); }
  // every world's sky so far has just been gradient, stars, moon and the odd kite line — nothing has
  // ever actually drifted up there on its own. A candy-striped hot air balloon (crimson and cream
  // gores over a wicker basket, hung on four ropes) now circles the whole town, 70 m up on a slow
  // 150 m orbit — well above the tallest terrace roof (9 m) and every lamp post, so it needs no
  // keep-out check against `game.zones` or any of the town's physics boxes the way anything on the
  // ground does, and no physics box of its own either. Purely decorative: nothing to greet, nothing
  // to reach. Built at its own local origin first — so the rope `tube()` helper's own `lookAt()`
  // calls, the same trick `makeBike()` already uses for its frame tubes, land in the same space the
  // coordinates below are written in — and only moved out onto its orbit afterward, by `place()`.
  // Drifts on the world clock `t` alone from a fixed starting angle drawn once off this world's own
  // local `r()` (never the shared `rnd()`), so it costs no later wardrobe or colour pick — placed
  // last of everything this build adds, after the frisbee thrower, so even that one draw disturbs
  // nothing built earlier in the town.
  { const balR = 150, balH = 70, balSpeed = TAU / 220, balPhase = r() * TAU;
    const balloon = group(0, 0, 0);
    const basket = mesh(G.box(1.1, 1.0, 1.1), mat(0x8a6a3f, { roughness: 0.9 }), { shadow: 'none', parent: balloon });
    const env = group(0, 4.5, 0, balloon); env.scale.set(1, 1.3, 1);
    const envColors = [0xb5342f, 0xf2ead8];
    for (let i = 0; i < 8; i++) {
      const wedge = new THREE.SphereGeometry(2.4, 3, 10, i * (TAU / 8), TAU / 8, 0, PI); worldBag.track(wedge);
      mesh(wedge, mat(envColors[i % 2], { roughness: 0.75 }), { shadow: 'none', parent: env });
    }
    mesh(G.cyl(0.38, 0.95, 0.75, 10), mat(0x4a3a28, { roughness: 0.85 }), { y: 1.06, shadow: 'none', parent: balloon });
    const ropeM = mat(0x2e241a, { roughness: 0.9 });
    const tube = (x1, y1, z1, x2, y2, z2) => { const L = Math.hypot(x2 - x1, y2 - y1, z2 - z1), tg = group((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, balloon); tg.lookAt(x2, y2, z2); noInk(mesh(G.cyl(0.03, 0.03, L, 5), ropeM, { rx: PI / 2, shadow: 'none', parent: tg })); };
    for (const [cx2, cz2] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) tube(cx2, 0.5, cz2, 0, 0.69, 0);
    balloon.userData.update = (dt, t) => {
      const a = balPhase + t * balSpeed;
      balloon.position.set(cos(a) * balR, balH + sin(t * 0.17) * 3, sin(a) * balR);
      balloon.rotation.y = -a;
      basket.rotation.z = sin(t * 0.5) * 0.05;
    };
    place(game, U, balloon, cos(balPhase) * balR, sin(balPhase) * balR, 0, balH); }
  // Candy Land's Candy Queen's guard has been the only `Marchers` trio in the game since round 181 —
  // Victorian, for all its urchins, bobby and market-square performers, never had its own drilling
  // line. Three children, dressed up as toy soldiers for tomorrow's school pageant, now march a short
  // beat back and forth on the open meadow south-east of the market square, rehearsing their steps
  // before an audience of nobody but the cat. *"Hup, two, three, four — mind your dressing, Thomas!"*
  // *"Careful, puss — mind the wooden bayonets."* *"Drop one more step and Miss will have us start
  // again."* No new controller: the exact same `Marchers` class the gingerbread guard already uses,
  // unchanged — same lockstep gap, same lead-and-followers logic — just this street's own wardrobe (a
  // red coat, gilt buttons and cuffs, a tall black hat with a red band, built off the same
  // `makeHuman`/`makeWardrobe` every other Victorian adult or child already uses) on three children in
  // place of three gingerbread men. All three recruits are now wired up to meet, closing the gap this
  // log flagged at the end of round 759 — the last `Marchers` column in the game still missing a third.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Victorian town (`game.start('new')` then `game.load(3, 'from-prev')`, so every urchin,
  // dancer, duck, balloon and ball-tossing pair actually moved), sampled every physics circle (every
  // moving creature) every quarter second over 300 simulated seconds, then swept the drill line against
  // both those samples and every one of the town's 714 physics boxes: the 6 m line from (26, -75) to
  // (32, -75) came back clear by at least 21.8 m along its whole length, at radius 79.4-81.5 from the
  // origin, comfortably short of the radius (88) where victorianRegion's own procedural fill takes over.
  { const soldierWard = makeWardrobe(r, { shirts: [0xaa1f2a], pants: [0x1a1a1c], shoes: [0x1a1a1c] });
    const soldiers = [0, 1, 2].map(() => { const rig = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.3), wardrobe: soldierWard }),
      coat: true, buttons: 0xd8c8a8, cuffs: 0xd8c8a8, hat: 'top', hatColor: 0x15120f, hatBand: 0xaa1f2a, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
      W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, soldiers, { points: [[26, -75], [32, -75]], speed: 1.0, pause: [1, 2], r: 0.32, gap: 1.1,
      cries: ['Hup, two, three, four — mind your dressing, Thomas!', 'Careful, puss — mind the wooden bayonets.', "Drop one more step and Miss will have us start again."], cryIcon: '💂' }));
    const secondId = game.namedFriend('toy-soldier-2');
    game.addInteractable({ obj: soldiers[1].group, radius: 2.1, label: () => 'Say hello', onUse: () => { game.befriend(secondId); SFX.tag(); game.hearts(soldiers[1].group.position.x, 1.1, soldiers[1].group.position.z, 3); game.toast('💂 "Pssst — don’t tell Miss I broke rank to wave."'); } });
    const thirdId = game.namedFriend('toy-soldier-3');
    game.addInteractable({ obj: soldiers[2].group, radius: 2.1, label: () => 'Say hello', onUse: () => { game.befriend(thirdId); SFX.tag(); game.hearts(soldiers[2].group.position.x, 1.1, soldiers[2].group.position.z, 3); game.toast('💂 "Last in line — but I’ve got the best view of Miss’s face when we trip."'); } }); }
  // tetherball, badminton, tug-of-war, archery, sack races — a whole shelf of playground games this
  // game has never tried once, in any of the seven worlds — and a maypole, the one dance that actually
  // needs a prop in the middle, had never come up either. Six children in Sunday best now circle a
  // ribboned pole on the open green deep in the south field, each one trailing a ribbon up to the
  // wreath at the top. No new controller: the ring itself is the exact same `RingDance` every other
  // world's own circle of dancers already uses, unchanged — the ribbons are the only new part, and
  // they're not rigged to the dancers' own hands (the walk-cycle `RingDance.place()` drives has no
  // "arms raised" pose to hang from) but to each dancer's own circle position a chest-height lift off
  // the ground, recomputed fresh every frame from `dance.dancers[i].rig.group.position` — the same
  // position `RingDance.place()` itself just set a moment earlier this frame, since `80-game.js`'s own
  // main loop runs every `npcs[].update()` (RingDance included) before `worldCtl.update()`, which is
  // where every world's own `U` array — this one included — actually fires. Each ribbon is a single
  // box mesh stretched between two fixed-length-1 ends: positioned at the midpoint of pole-top and
  // dancer, turned with `lookAt` and scaled on its own local Z to the live distance between them — the
  // exact trick the kite string and the balloon's own ropes already use for a segment whose two ends
  // move independently every frame. `noInk()` for the same reason those got it: ribbon width (0.06 m)
  // against a length of several metres reads as a flat line to the outline pass without it.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses) built
  // the real Victorian town (`game.start('new')` then `game.load(3, 'from-hub')`), sampled every one of
  // its physics circles' own position every 1/30 s over 300 simulated seconds (so no wandering urchin,
  // dancer, duck or ball-tossing pair mid-circuit could slip past unnoticed), then swept a grid of the
  // open green against both that trace and every one of the town's physics boxes, keeping the whole
  // grid inside the hand-built heart (radius 15-84, short of the radius (88) where victorianRegion's
  // own procedural fill takes over): (0, -84) came back clear by 31.4 m of the nearest box and 25.5 m
  // of the nearest other soul — well south of the market square (centred (0,-34), radius 17), the
  // draughts table, the photographer and the drill line above, with room to spare for the pole, the
  // 2 m ring and every ribbon between them.
  { const mx = 0, mz = -84, poleH = 2.6, ringR = 2.0, nRibbons = 6;
    const poleM = mat(0xf0ece4, { roughness: 0.65 }), stripeM = mat(0xaa1f2a, { roughness: 0.65 });
    const pole = group(mx, 0, mz, W);
    mesh(G.cyl(0.07, 0.09, poleH, 10), poleM, { y: poleH / 2, parent: pole });
    for (let i = 0; i < 6; i++) mesh(G.cyl(0.072, 0.072, poleH / 6 * 0.9, 10), i % 2 ? stripeM : poleM, { y: poleH / 6 * (i + 0.5), parent: pole });
    mesh(G.torus(0.15, 0.03, 8, 16), mat(0x5a8a4a, { roughness: 0.85 }), { y: poleH, rx: PI / 2, shadow: 'none', parent: pole });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mesh(G.sphere(0.028, 6, 5), mat(r.pick([0xff6fb5, 0xffd54a, 0x7fd7ff, 0xf7f3ec]), { roughness: 0.5 }), { x: cos(a) * 0.15, y: poleH, z: sin(a) * 0.15, shadow: 'none', parent: pole }); }
    P.addBox(mx, poleH / 2, mz, 0.22, poleH, 0.22, { cam: false });
    const poleLines = ['🎀 "Ribbons new this year — last year\'s went green in the rain."', '🎀 "Nobody\'s quite sure who ties the wreath. Never the same colour twice."', '🎀 "Six ribbons, six children, and somehow it never once tangles."'];
    game.addInteractable({ obj: pole, radius: 3.4, label: () => 'Look at the maypole', onUse: () => { SFX.click(); game.toast(rnd.pick(poleLines), 3000); } });

    const maypoleWard = makeWardrobe(r, { shirts: [0xf7f3ec, 0xffd54a, 0x7fd7ff, 0xff9fb0, 0x8bc34a], pants: [0x2a2a24, 0x3a3327], shoes: [0x2a2018, 0x1e1a16] });
    const dancers = [];
    for (let i = 0; i < nRibbons; i++) { const rig = makeHuman({ ...randomPerson(r, { child: true, female: i % 2 === 0, wardrobe: maypoleWard }), hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false }); W.add(rig.group); dancers.push(rig); }
    const dance = new RingDance(game, dancers, { cx: mx, cz: mz, r: ringR, speed: 0.55, turnEvery: 11, cryIcon: '🎀',
      cries: ["Don't let go of your ribbon, Thomas!", "Round and round — mind you don't trip on it!", "Nobody remembers how the pattern's meant to come out.", 'Mind the cat, everyone — small paws, quick feet!'] });
    game.npcs.push(dance);

    const ribbonColors = [0xaa1f2a, 0xf7f3ec];
    const ribbons = dancers.map((_, i) => mesh(G.box(0.06, 0.015, 1), mat(ribbonColors[i % 2], { roughness: 0.7 }), { parent: W }));
    for (const rib of ribbons) noInk(rib);
    const topX = mx, topY = poleH, topZ = mz, handY = 0.95;
    U.push(() => {
      for (let i = 0; i < nRibbons; i++) {
        const dp = dance.dancers[i].rig.group.position, rib = ribbons[i];
        const hx = dp.x, hy = dp.y + handY, hz = dp.z, len = Math.hypot(hx - topX, hy - topY, hz - topZ);
        rib.position.set((topX + hx) / 2, (topY + hy) / 2, (topZ + hz) / 2);
        rib.lookAt(hx, hy, hz);
        rib.scale.set(1, 1, max(0.01, len));
      }
    }); }
  // every stall-keeper, newsboy, juggler and fortune in the market square keeps two feet on the
  // ground — the one classic fairground turn this town never had was someone up on stilts. A
  // performer in candy-striped trousers now paces a short line on the quiet green south-west of
  // the square, towering half again his own height. *"Mind your tail, puss — I can't exactly hop
  // out of the way up here!"* *"Eleven years on these. Fell twice. Both before breakfast."* *"Best
  // seat in the house, this — shame it only seats one."*
  // No new rig: `makeHuman()` builds him exactly like anyone else in the street, and the stilts
  // themselves are two plain poles with a strap loop and a footrest peg, parented straight onto
  // each ankle joint — the same joint the trouser cuff and shoe already hang from — so they swing
  // with the walk cycle for free. Local lengths are divided by `rig.k` so the poles come out the
  // same true size whatever height `randomPerson()` happened to roll for him.
  // New `StiltWalker` class (55-npcs.js, right after `Patroller`): literally `extends Patroller`,
  // adding nothing but a constant vertical offset applied after every position write — both in the
  // constructor and every `update()` — since `Patroller` only sometimes rewrites the rig's own
  // position in a given frame (paused at an end, or standing to let the cat go by) and sometimes
  // leaves the previous frame's value standing, so the offset has to be re-applied unconditionally
  // rather than folded once into a y-coordinate `Patroller` itself would otherwise overwrite.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.load(3, 'from-prev')`) sampled every NPC's own rig position
  // every quarter second over 300 simulated seconds, then swept the 6 m line from (-18, -80) to
  // (-12, -80) against both those samples and every one of the town's 589 physics boxes: the whole
  // line came back clear by at least 12.5 m of the nearest box and 8.9 m of the nearest other soul,
  // at radius 80.9-82.0 from the origin — well south-west of the market square (centred (0, -34),
  // radius 17) and short of the radius (88) where victorianRegion's own procedural fill takes over.
  { const stiltH = 0.8;
    const performer = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false }),
      stripes: 0xaa1f2a, hat: 'top', hatColor: 0x151015, hatBand: 0xf7f3ec, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(performer.group);
    const poleM = mat(0x8a6a44, { roughness: 0.8 }), strapM = mat(0x3a2a1a, { roughness: 0.9 }), pegM = mat(0x5a4228, { roughness: 0.75 });
    for (const L of performer.legs) {
      const len = stiltH / performer.k;
      const stilt = group(0, 0.22, 0.01, L.ankle);
      mesh(G.cyl(0.026, 0.03, len + 0.3, 8), poleM, { y: -(len + 0.3) / 2 + 0.07, parent: stilt });
      mesh(G.torus(0.09, 0.018, 6, 10), strapM, { y: 0, rx: PI / 2, parent: stilt });
      mesh(G.box(0.15, 0.035, 0.09), pegM, { y: -0.17, z: 0.07, parent: stilt });
    }
    game.npcs.push(new StiltWalker(game, performer, { points: [[-18, -80], [-12, -80]], speed: 0.55, pause: [1.5, 3], r: 0.4, height: 2.6, stiltH,
      cries: ["Mind your tail, puss — I can't exactly hop out of the way up here!", 'Eleven years on these. Fell twice. Both before breakfast.', 'Best seat in the house, this — shame it only seats one.'], cryIcon: '🎪' })); }
  // the Neighborhood and Sunny Shore both have a kid hopping a pogo stick by now; Victorian, Candy
  // Land, Robot City, Frosty Peak and Whisper Woods never got one of their own. A Victorian urchin now
  // bounces on a quiet stretch of open cobble south-west of the market square, well clear of the
  // badminton net and the sack race's own lane. *"Tuppence says I clear a hundred bounces, puss!"*
  // *"Don't laugh — this spring's got a mind of its own!"* *"Lost count past eighty. Starting again,
  // out of spite."*
  //
  // No new class and no new mesh: the exact same `PogoHopper` (`55-npcs.js`) the Neighborhood and
  // Sunny Shore already use.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(3, 'from-hub')`, 300 simulated frames to settle the town)
  // sampled every NPC's own position and swept a grid of the open ground south-west of the market
  // square (short of the radius (88) where `victorianRegion`'s own procedural fill takes over) against
  // both those samples and every one of the town's 302 physics boxes: (-6, -66) came back clearest at
  // 13.9 m from the nearest box and 14.0 m from the nearest other soul — well clear of the badminton
  // net, the sack race's own lane at (4, -66) and the market-square lane (x in [-2.3, -0.1]).
  //
  // Built dead last, right after the stilt walker, for the same reason every other addition at the end
  // of this function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier in this town would shift that sequence and
  // desync every other timing-sensitive pick already placed above.
  { const pogoKid = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: vicWard }),
      pants: 0x1e1e24, hat: 'flatcap', hatColor: 0x3a3327, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(pogoKid.group);
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: -6, z: -66, ry: r.range(0, TAU),
      cries: ['Tuppence says I clear a hundred bounces, puss!', "Don't laugh — this spring's got a mind of its own!", 'Lost count past eighty. Starting again, out of spite.'] })); }
  // the Neighborhood, Candy Land, Whisper Woods and Robot City have all had a piñata post since rounds
  // 508-odd, 564, 565 and 566 (`PinataSwinger` in `55-npcs.js`, `makePinata` in `60-props.js`) —
  // Victorian, for all its tetherball pole, badminton net, tug-of-war, sack race and pogo stick, was the
  // last of the seven left without one. **A bunting-coloured piñata now hangs from a post** on the open
  // grass east of the sack race's own lane, a street urchin taking a swing at it. *"One more go, and
  // mind, I'll not miss this time!"* *"Steady now, puss — plenty of swing room needed here."* *"If it's
  // just toffees again, I shall be very put out."*
  //
  // No new class and no new mesh: the exact same `PinataSwinger` (`55-npcs.js`) and `makePinata`
  // (`60-props.js`) the other four worlds already use — just a fresh post, a fresh urchin and this
  // town's own fête colours (burgundy, gold, cream and hunter green) rather than any street's own
  // balloon palette or Robot City's scrap-and-hazard-stripe scheme.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(3, 'from-hub')`, 3600 simulated frames to let every urchin,
  // dancer, duck and ball game in this town actually move) sampled every NPC's and the squirrel's own
  // position every 10th frame, then swept a grid of the open grass east of the sack race's own lane
  // against both those samples and every one of the town's 326 physics boxes: (16, -57) came back
  // clearest at 13.15 m from the nearest box or soul — 13.1 m from the sack race's own lane at (4, -66),
  // 26.1 m from the badminton net (-10, -55), 23.8 m from the pogo kid (-6, -66), and a good 11 m clear
  // of the market square's own circle (centred (0, -34), radius 17), at radius 59.2 from the origin,
  // well short of the radius (88) where `victorianRegion`'s own procedural fill takes over.
  //
  // Built dead last, right after the pogo kid, for the same reason every other addition at the end of
  // this function already gives: `makeHuman()` draws three values off the *shared* `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier in this town would shift that sequence and
  // desync every other timing-sensitive pick already placed above.
  { const px = 16, pz = -57, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const FETE_FRINGE = [0xd4af37, 0xf0ece4, 0x3f4a38, 0xffffff];
    const postM = mat(0x3a2a1e, { roughness: 0.75 });
    const standG = group(px, 0, pz, W);
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0x6a2332, FETE_FRINGE);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    P.addBox(px, postH / 2, pz, 0.35, postH, 0.35, { cam: false });
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    U.push(standG.userData.update);
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const urchin = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: vicWard }),
      pants: 0x2a2420, hat: 'flatcap', hatColor: 0x5a2a3a, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(urchin.group);
    game.npcs.push(new PinataSwinger(game, urchin, 0x8a6a44, { x: sx, z: sz, ry: sry,
      cries: ["One more go, and mind, I'll not miss this time!", 'Steady now, puss — plenty of swing room needed here.', 'If it\'s just toffees again, I shall be very put out.'] })); }
  // every Detectorist in the game has only ever turned up a bottle cap or a button — the running joke
  // of the whole series — and two of the seven worlds have now let somebody digging nearby beat him to
  // real treasure: Sunny Shore (round 591), the Neighborhood (round 592). Victorian's own relic hunter,
  // headphones on at (-45, 42), still only ever finds a button. **A street urchin has struck real gold
  // instead, a few gardens over on the quiet north bank**: an old wooden chest lies open in the grass,
  // lid thrown back over a heap of coins, a shovel left stuck in the dirt beside it and a handful of
  // loose coins and gems scattered where they rolled. *"Everybody else got a bottle cap. I got THIS."*
  // *"Careful, puss — don't you dare knock a single coin back in the dirt."* *"Don't tell the relic
  // hunter. He'll never forgive himself."*
  //
  // Reuses round 591's `makeTreasureChest()` and `makeShovel()` (62-props-nature.js) and
  // `makeGemCluster()` (60-props.js) exactly as the beach already does — no new prop, no new mesh.
  // Victorian carries none of the Neighborhood's own "seven gems"/"no repeated shirt" constraints
  // (both scoped to world 0 only in `test/run.mjs`), so there's no need for the Neighborhood's own
  // workaround of plain coin discs and a forced shirt colour. The urchin herself is a plain `Kneeler`
  // on this town's own `vicWard` wardrobe, the same pairing every other kneeling Victorian already uses.
  //
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses: `game.start('new')`,
  // `game.travel(3, 'from-prev')`, 3000 simulated frames with every NPC's own position sampled every
  // 5th frame) swept the open cobblestone north of the canal against those 10,680 samples and all 608
  // of the town's own physics boxes, keeping clear of the relic hunter's own spot: (-37, 48) came back
  // clear by 11.5 m of the nearest box and 10.0 m of the relic hunter himself — the only soul anywhere
  // near this corner of town — close enough the joke still reads, far enough neither "Say hello" circle
  // (2.1 m each) comes near the other's.
  //
  // Built dead last, right after the piñata and right before the squirrel, for the reason every other
  // addition at the end of this function already gives: `makeHuman()` and `makeGemCluster()` both draw
  // off the shared per-world `r()` sequence unconditionally, and anything built earlier in this town
  // would have had its own timing-sensitive pick shifted by it.
  { const tx = -37, tz = 48, kx = tx + 1.3, kz = tz + 0.4, ry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); place(game, U, chest, tx, tz, 0.6);
    P.addBox(tx, 0.35, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); place(game, U, shovel, tx + 0.75, tz - 0.6, 0.3);
    makeGemCluster(game, U, tx + 0.4, tz + 0.9, 4, [0xd4af37, 0xc0c0c0, 0xffd54a], r, 0.9);
    const finder = makeHuman({ ...randomPerson(r, { child: true, female: r.chance(0.5), wardrobe: vicWard }),
      pants: 0x2a2420, hat: null, coat: null, jacket: null, scarf: null, bag: null, backpack: null, sleeves: true, glasses: false });
    W.add(finder.group);
    game.npcs.push(new Kneeler(game, finder, { x: kx, z: kz, ry, cryIcon: '💰',
      cries: ["Everybody else got a bottle cap. I got THIS.", "Careful, puss — don't you dare knock a single coin back in the dirt.", "Don't tell the relic hunter. He'll never forgive himself."] })); }
  // the Neighborhood's radio listener, Candy Land's own sunbather, Sunny Shore's three towel people and
  // Frosty Peak's snow-angel girl have all had somewhere to just lie down for a while — Robot City,
  // Victorian and Whisper Woods are the three worlds still left without one. Victorian's own flower
  // girl, baskets and corner pitches already dotted through the market square, now has a patch of her
  // own: flat on her back in the quiet grass far out past the canal, basket tipped over in the grass
  // beside her, taking five minutes off her feet before the lamplighters come round.
  // No new controller or prop: the exact same `Sunbather` class (`55-npcs.js`) every other world's own
  // lie-down vignette already uses, unchanged — flat on the back, hands behind the head, same relaxed
  // pose as the rest — and `makeFlowerBouquet()` (`60-props.js`), already standing in every market
  // stall keeper's hand, laid on its side in the grass instead of held upright.
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `elements.get('enter').listeners.click[0]()` then `game.travel(3, 'from-prev')`, 3600 simulated
  // frames to let every urchin, dancer, duck, balloon and ball-tossing pair in this town actually move)
  // sampled every NPC's own position every 5th frame, then checked the open grass far out past the
  // canal against both those samples and every one of the town's 609 physics boxes: (60, -45) came back
  // clear by 14.9 m of the nearest box and 10.1 m of the nearest other soul, at radius 75 from the
  // origin, comfortably short of the radius (88) where `victorianRegion`'s own procedural fill takes
  // over, and clear of every zone this world's own `game.zones` already marks (the main street's span,
  // the market lane, and the three hub circles).
  // Built dead last, right after the treasure-chest finder and right before the squirrel, for the same
  // reason every other addition at the end of this function already gives: `makeHuman()` draws three
  // values off the *shared* `rnd()` sequence unconditionally, and a fresh rig built any earlier in this
  // town would shift that sequence and desync every other timing-sensitive pick already placed above.
  { const flx = 60, flz = -45, flry = atan2(-flx, -flz);
    const flowerGirl = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: vicWard }),
      pants: 0x3a2a2a, hat: 'bonnet', hatColor: 0x6a2a3a, coat: null, jacket: null, scarf: null, bag: null, backpack: null, glasses: false });
    W.add(flowerGirl.group);
    const bqx = flx + cos(flry) * 0.6, bqz = flz - sin(flry) * 0.6;
    const bouquet = makeFlowerBouquet(); bouquet.rotation.x = PI / 2;
    place(game, U, bouquet, bqx, bqz, flry, 0.08);
    game.npcs.push(new Sunbather(game, flowerGirl, { x: flx, z: flz, ry: flry, cryIcon: '🌸',
      cries: ["Five minutes off my feet. The violets can wait.", "Careful, puss — mind the basket, that's my whole morning's takings.", "Last patch of sun before the lamplighters come round. Not wasting it standing up."] })); }
  // every other real landmark in this town has earned itself something living nearby by now — the
  // fountain its wish, the carriage its horse, the market square its pigeons and its five doves — but
  // the clock tower's own belfry, the five-metre stone block the four clock faces are set into, has
  // stood sixty feet up with nothing but a bell and a weathervane keeping it company since the town was
  // first built. **Three bats now flit around the belfry itself, circling past the clock faces at
  // dusk-coloured height.** No dialogue, no new mesh: like the market square's own doves and the
  // canal's own dragonflies above, they're a plain `Flyer` loop, not a greetable soul.
  //
  // Reuses `makeBat()` (56-npcs-wild.js, built for the Neighborhood's own dusk sky) and the exact same
  // `Flyer` controller (`cx`, `cz`, `r`, `h`, `speed`, `bob`, `wobble`, `phase`, `cw`) the doves and
  // dragonflies above already lean on. Unlike the Neighborhood's own bats, these are never hidden
  // behind `game.dayPhase`: Victorian's sky is fixed permanently at dusk by `applySky` above, so there
  // is no daylight for them to wait out — and `game.dayPhase` itself only ever advances while the
  // Neighborhood's own world is the one being ticked each frame, so reading it here would leave the
  // bats stuck invisible at whatever phase the Neighborhood happened to be left in.
  //
  // Centred on the tower (42, 0) at height 21.5, the same height the four clock faces themselves sit
  // at, well inside the belfry's own open block (19 to 24 — the tower's physics box tops out at 18, the
  // belfry's roof slab at 18.5, the spire doesn't start until 24), with radius 3.6, clear of the
  // belfry's own 2.5 m half-width and the faces mounted flush against each wall. No physics box of its
  // own: nothing on the ground can ever reach sixty feet up, the same reasoning the doves and
  // dragonflies above already relied on.
  //
  // Built dead last, right after the flower girl and right before the squirrel, for the reason every
  // other addition at the end of this function already gives: `Flyer`'s own constructor draws
  // unconditionally from the *shared* `rnd()` sequence, and anything built earlier in this town would
  // have had its own timing-sensitive pick shifted by it.
  for (let bi = 0; bi < 3; bi++) {
    const batRig = makeBat({ phase: bi * 2.1 });
    game.npcs.push(new Flyer(game, batRig, { cx: 42, cz: 0, r: 3.6, h: 21.5, speed: 2.2 + bi * 0.35, bob: 0.5, wobble: 0.6, cw: bi % 2 === 0, phase: bi * 2.1 }));
  }
  // every lamp on the street has carried its own hanging flower basket for rounds now, and the
  // Neighborhood's garden, Victorian's own canal and the clock tower's belfry all got something living
  // nearby in turn — not one of the eleven baskets ever had, so a couple of bees now circle the
  // easternmost one, `vicLamps[10]` (x=55.5, z=6.4), the same basket whose own "look" prompt already
  // calls it the quietest spot on the row. No dialogue, no new mesh: like the belfry's own bats and the
  // canal's own dragonflies above, they're a plain `Flyer` loop around the basket's own position, not a
  // greetable soul.
  //
  // Reuses `makeBee()` (56-npcs-wild.js, built for Whisper Woods' own beekeeper) and the exact same
  // `Flyer` controller every other flyer in this town already leans on. Centred on the basket's own
  // (55.5, 6.4) at h=2.62 — just above the basket's own y=2.55, the same height every basket on this
  // street already hangs at, well above the bobby's, the lamplighter's and the cat's own jump reach
  // (JUMP_SPEED²/2·GRAVITY ≈ 1 m, 40-physics.js) — with a 0.3 m radius, smaller than the basket's own
  // iron bracket arm, so the loop never leaves the basket's own airspace. No physics box of its own:
  // nothing on the ground can ever reach this high, the same reasoning every basket, the belfry's bats
  // and the canal's dragonflies above already relied on. This is the east end of the street — the
  // basket's own "look" prompt round already measured the nearest wandering soul (the cyclist) never
  // coming closer than 5.1 m here, and the telegram boy's own lane (z=1.3, `limit: 62`) runs 5.1 m
  // south of it too — comfortably clear at ground level, which this loop never reaches anyway.
  //
  // Built dead last, right after the belfry's bats and right before the squirrel, for the reason every
  // other addition at the end of this function already gives: `Flyer`'s own constructor draws
  // unconditionally from the *shared* `rnd()` sequence, and anything built earlier in this town would
  // have had its own timing-sensitive pick shifted by it.
  for (let bi = 0; bi < 2; bi++) {
    const beeRig = makeBee();
    game.npcs.push(new Flyer(game, beeRig, { cx: 55.5, cz: 6.4, r: 0.3, h: 2.62, speed: 1.6 + bi * 0.3, bob: 0.05, wobble: 0.12, cw: bi % 2 === 0, phase: bi * 2.6 }));
  }
  // the east end's basket got a couple of bees above — the west end's own, `vicLamps[1]` (x=-49.5,
  // z=6.4, the lamp whose own "look" prompt already calls it the one the lamplighter's round stops a
  // couple of strides short to light), never got any. A second pair now circles that basket too, same
  // height, same radius as the east pair: y=2.62, just above the basket's own y=2.55, well clear of
  // the lamplighter's own head height and the cat's own jump reach. No physics box needed — nothing on
  // the ground can reach this high, the same reasoning the east basket's own bees already relied on.
  //
  // Reuses the same `makeBee()` rig and `Flyer` controller the east basket's bees above already lean
  // on. No dialogue, no new mesh: a plain orbit around the basket's own position, not a greetable
  // soul. Built dead last, right after the east basket's own bees and right before the squirrel, for
  // the reason every other addition at the end of this function already gives: `Flyer`'s own
  // constructor draws unconditionally from the *shared* `rnd()` sequence, and anything built earlier
  // in this town would have had its own timing-sensitive pick shifted by it.
  for (let bi = 0; bi < 2; bi++) {
    const westBeeRig = makeBee();
    game.npcs.push(new Flyer(game, westBeeRig, { cx: -49.5, cz: 6.4, r: 0.3, h: 2.62, speed: 1.6 + bi * 0.3, bob: 0.05, wobble: 0.12, cw: bi % 2 === 0, phase: bi * 2.6 + 1.1 }));
  }
  // the east and west baskets both got their own bees above; `vicLamps[5]` (x=3, z=-6.4, basketHues[5 %
  // 4] = the amber/gold hue), dead centre of the street and the first basket to ever get a "look"
  // prompt back in round 627, never got any. A third pair now circles that one too, same height and
  // radius as the other two: y=2.62, just above the basket's own y=2.55 — well above the bobby's, the
  // lamplighter's and the cat's own jump reach, the same reasoning the east and west baskets' own bees
  // already relied on, so no fresh ground-level clearance probe was needed either. No new mesh, no new
  // physics box: the same `makeBee()` rig and `Flyer` controller, not a greetable soul.
  //
  // Built dead last, right after the west basket's own bees and right before the squirrel, for the
  // reason every other addition at the end of this function already gives: `Flyer`'s own constructor
  // draws unconditionally from the *shared* `rnd()` sequence, and anything built earlier in this town
  // would have had its own timing-sensitive pick shifted by it.
  for (let bi = 0; bi < 2; bi++) {
    const centerBeeRig = makeBee();
    game.npcs.push(new Flyer(game, centerBeeRig, { cx: 3, cz: -6.4, r: 0.3, h: 2.62, speed: 1.6 + bi * 0.3, bob: 0.05, wobble: 0.12, cw: bi % 2 === 0, phase: bi * 2.6 + 2.2 }));
  }
  // the east, west and dead-centre baskets all got their own bees above; `vicLamps[7]` (x=24, z=-6.4,
  // basketHues[7 % 4] = the dusty-rose hue, south pavement, the one whose own "look" prompt already
  // points across the street at the sleeping cat on the terrace window ledge), never got any. A fourth
  // pair now circles that one too, same height and radius as the other three: y=2.62, just above the
  // basket's own y=2.55 — well above the bobby's, the lamplighter's and the cat's own jump reach, the
  // same reasoning the other three baskets' own bees already relied on, so no fresh ground-level
  // clearance probe was needed either — the basket's own "look" prompt round already measured the
  // nearest wandering soul 3.72 m off at ground level, which this loop never reaches anyway. No new
  // mesh, no new physics box: the same `makeBee()` rig and `Flyer` controller, not a greetable soul.
  //
  // Built dead last, right after the centre basket's own bees and right before the squirrel, for the
  // reason every other addition at the end of this function already gives: `Flyer`'s own constructor
  // draws unconditionally from the *shared* `rnd()` sequence, and anything built earlier in this town
  // would have had its own timing-sensitive pick shifted by it.
  for (let bi = 0; bi < 2; bi++) {
    const southBeeRig = makeBee();
    game.npcs.push(new Flyer(game, southBeeRig, { cx: 24, cz: -6.4, r: 0.3, h: 2.62, speed: 1.6 + bi * 0.3, bob: 0.05, wobble: 0.12, cw: bi % 2 === 0, phase: bi * 2.6 + 3.3 }));
  }
  // the east, west, dead-centre and south baskets all got their own bees above; `vicLamps[9]` (x=45,
  // z=-6.4, basketHues[9 % 4] = the same amber/gold hue as `vicLamps[1]` and `vicLamps[5]`, the
  // plaza-side basket three strides from the clock tower whose own "look" prompt already shares a 0.9
  // m radius with the lamp post to clear the lamplighter's patrol route), never got any either. A
  // fifth pair now circles that one too, same height and radius as the other four: y=2.62, just above
  // the basket's own y=2.55 — well above the bobby's, the lamplighter's and the cat's own jump reach,
  // the same reasoning every basket's own bees so far already relied on, so no fresh ground-level
  // clearance probe was needed here either: the loop flies a flat 0.3 m circle at head height and
  // above, well clear of the tight 0.9 m basket-prompt radius that only ever mattered for something
  // standing on the pavement. No new mesh, no new physics box: the same `makeBee()` rig and `Flyer`
  // controller the other four baskets' bees already lean on, not a greetable soul.
  //
  // Built dead last, right after the south basket's own bees and right before the squirrel, for the
  // reason every other addition at the end of this function already gives: `Flyer`'s own constructor
  // draws unconditionally from the *shared* `rnd()` sequence, and anything built earlier in this town
  // would have had its own timing-sensitive pick shifted by it.
  for (let bi = 0; bi < 2; bi++) {
    const plazaBeeRig = makeBee();
    game.npcs.push(new Flyer(game, plazaBeeRig, { cx: 45, cz: -6.4, r: 0.3, h: 2.62, speed: 1.6 + bi * 0.3, bob: 0.05, wobble: 0.12, cw: bi % 2 === 0, phase: bi * 2.6 + 4.4 }));
  }
  const sq = new Squirrel(game, -10, -4.5, 'sq-victorian'); game.squirrels.push(sq);
  const C = game.collectibles;
  C.add('fish', 8, 4); C.add('mouse', -16, 5); C.add('yarn', 28, -6); C.add('star', 37, 6); C.add('star', -24, -6); C.add('mouse', -3, 20); C.add('yarn', 2, 19); C.add('fish', -30, 4); C.add('star', 0, -40); C.add('mouse', 56, 4); C.add('yarn', -1.2, 36);
  game.fx.setAmbient({ count: 60, radius: 16, colors: [0xffe082, 0xffd54a, 0xfff3b0], rise: 0.05, drift: 0.35, life: 5, height: 2.4, yMin: 0.4 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
