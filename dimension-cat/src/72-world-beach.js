// ---------------------------------------------------------------- 5. SUNNY SHORE
function buildBeach(game, entry) {
  const W = game.world, P = game.physics, r = seeded(505), U = [];
  P.setLimit(SHORE_LIMIT);
  game.applySky({ top: 0x1f7fe0, horizon: 0xcfefff, bottom: 0x6fc8e8, sun: [0.3, 0.7, -0.4], sunColor: 0xfff6d5, sunSize: 700, halo: 0.5 });
  game.setLighting({ ambient: [0xcfe8ff, 0.45], hemi: [0xbfe8ff, 0xd9c48a, 0.7], sun: [0xfff3dc, 2.8, 30, 70, -40], fog: [0xcfefff, 100, 540], exposure: 1.05 });

  // terrain: dunes in the west, a gentle slope into the sea in the east
  // Terrain has to be smooth in its *second* derivative as well: any kink shows up as an ink line.
  const T = (x, z) => {
    const ridge = smoothstep(-24, -150, x);
    const dune = 0.58 + bumps(x, z, 0.09) * 0.45 + ridge * ridge * 30;
    const shore = smoothstep(14, 31, x);                 // 0 on the sand … 1 in the water
    return lerp(dune, -0.7 - (x - 31) * 0.05, shore);
  };
  const sandM = mat(0xf0dcae, { roughness: 1, map: TEX.sand() });
  makeTerrain(game, T, sandM, 780, 312);
  const sea = makeSea(game, { x: 380, z: 0, w: 740, d: 940, level: 0, color: 0x2fa8dc, deep: 0x1a6aa8 }); U.push(sea.update);
  // shallow shelf tint + a soft foam line where the waves meet the sand
  const foamM = mat(0xffffff, { roughness: 1, transparent: true, opacity: 0.55, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const foam = mesh(G.plane(1.6, 940), foamM, { x: 24.5, y: 0.05, rx: -PI / 2, shadow: 'none', parent: W });
  U.push((dt, t) => { foam.position.x = 24.5 + sin(t * 0.8) * 1.1; foamM.opacity = 0.35 + sin(t * 0.8) * 0.2; });
  P.addBox(33, 0, 0, 1, 12, 940, { walk: false, cam: false });   // you can wade, not swim
  game.zones.addSpan(12, -SHORE_LIMIT, SHORE_LIMIT, SHORE_LIMIT);   // the wet sand and the sea: nothing grows there
  game.zones.addSpan(-52, -14, -44, 14); game.zones.addCircle(12, -46, 9); game.zones.addSpan(2, -26, 20, 6);

  // pier + lighthouse + huts
  makePier(game, 17, -10, 15, PI / 2);
  const lighthouse = makeLighthouse(game, 12, -46); U.push(lighthouse.userData.update);
  for (let i = 0; i < 12; i++) { const a = r() * TAU, d = r.range(2.6, 6); placeT(game, U, makeRock(r, 0x8a857a, r.range(0.8, 1.8)), 12 + cos(a) * d, -46 + sin(a) * d, 0); }
  for (let i = 0; i < 5; i++) placeT(game, U, boxAround(game, makeBeachHut(r.pick([0xff8a65, 0x4fc3f7, 0xfff176, 0x81c784, 0xf48fb1]), r), -10, -24 + i * 9, 2.8, 2.8, 2.8), -10, -24 + i * 9, PI / 2);
  // dunes: palms, grass tufts, driftwood
  const palmSpots = [[-20, 6], [-24, 16], [-18, 28], [-30, 30], [-34, -4], [-28, -14], [-38, 12], [-22, -32], [-36, -28], [-44, 2], [-42, 22], [-16, 40], [-30, 44], [-46, -18], [-12, 48], [-6, 34], [-4, -34], [-40, 40]];
  for (const [x, z] of palmSpots) { const p = makePalm(r, r.range(3.8, 5.6)); placeT(game, U, p, x, z, 0); boxT(game, x, z, 0.5, 5, 0.5, { cam: false }); }
  makeGrass(game, [[-26, 0, 22, 150], [-14, 30, 12, 70], [-40, -30, 12, 70]], r, { hue: [0.13, 0.21], light: [0.4, 0.56], tall: 1.2, wide: 0.85, pad: 0.2 });
  makeScatter(game, [[10, 0, 12, 60], [6, 28, 10, 40], [8, -26, 10, 40]], G.sphere(0.06, 6, 5), [0xfff1dc, 0xffd9c2, 0xf3e3c8, 0xd9a3a3, 0xe8c9a0], r, [0.6, 1.4], 0.02);  // shells
  for (const [x, z, ry] of [[-14, 36, 0.4], [4, -30, 1.2], [-6, 12, 2.4]]) { const log = makeHollowLog(r); log.scale.setScalar(0.7); placeT(game, U, log, x, z, ry); }
  // sunbathers' corner: umbrellas, towels, sandcastle, beach ball
  for (const [x, z, hue, tc] of [[6, 4, 0, 0x2f6fd6], [10, 12, 200, 0xff7043], [4, 18, 50, 0x8e24aa], [9, -20, 320, 0x2e9e6e]]) { placeT(game, U, makeUmbrella(hue), x, z, 0); boxT(game, x, z, 0.2, 2.2, 0.2, { cam: false }); placeT(game, U, makeTowel(tc), x + 1.2, z + 0.6, r() * 0.6); }
  placeT(game, U, makeSandcastle(), 7, -4, 0.3); boxT(game, 7, -4, 1.6, 1.4, 1.6, { cam: false });
  const ball = mesh(G.sphere(0.32, 14, 10), mat(0xffffff, { roughness: 0.5 }), { parent: W }); mesh(G.sphere(0.322, 14, 10), mat(0xd62839, { roughness: 0.5 }), { sx: 0.5, parent: ball }); mesh(G.sphere(0.322, 14, 10), mat(0x2f6fd6, { roughness: 0.5 }), { sz: 0.5, parent: ball });
  const ballY = P.ground0(3, 8); ball.position.set(3, ballY + 0.32, 8);
  U.push((dt, t) => { ball.position.y = ballY + 0.32 + abs(sin(t * 2.4)) * 0.9; ball.rotation.y = t; ball.rotation.x = sin(t * 0.7) * 0.4; });
  // sea props: buoys, sailboat
  for (const [x, z, c] of [[38, -26, 0xd62839], [42, 6, 0xffd54a], [36, 30, 0xd62839]]) { const b = makeBuoy(c); b.userData.y0 = 0; place(game, U, b, x, z, 0, 0); }
  const boat = makeBoat(0x3f6fd6); boat.userData.y0 = 0.05; place(game, U, boat, 46, 16, -0.6, 0.05);
  const boat2 = makeBoat(0xd62839); boat2.userData.y0 = 0.05; boat2.scale.setScalar(0.8); place(game, U, boat2, 54, -30, 0.8, 0.05);

  // life: crabs, gulls, turtles, beachgoers, a dog, the squirrel
  for (const [x, z] of [[16, -30], [18, 2], [15, 14], [19, 24], [14, -18], [17, 36]]) { const rig = makeCrab(r.pick([0xe8492b, 0xff7043, 0xc62828])); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.9, 1.4), leash: 5, r: 0.25, height: 0.5, step: 0.25, idle: [0.5, 2], walk: [1, 3] })); }
  for (let i = 0; i < 7; i++) { const rig = makeSeagull({ phase: i * 1.3 }); game.npcs.push(new Flyer(game, rig, { cx: 14 + r.range(-8, 8), cz: r.range(-30, 30), r: r.range(9, 18), h: r.range(5, 11), speed: r.range(3.5, 5), bob: 1.2, wobble: 3, cw: i % 2 === 0, phase: i })); }
  for (const [x, z] of [[22, -2], [24, 20]]) { const rig = makeTurtle(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.35, leash: 5, r: 0.45, height: 0.5, step: 0.25, idle: [2, 5], walk: [3, 7] })); }
  for (let i = 0; i < 4; i++) {
    const lady = i % 2 === 1;
    const rig = makeHuman({ ...randomPerson(r, { female: lady }),
      shirt: r.pick([0xff7043, 0x4fc3f7, 0xfff176, 0xf48fb1]), pants: r.pick([0x2f6fd6, 0xd62839, 0x2e9e6e, 0xff8fab]), shorts: true,
      hat: lady ? 'sunhat' : (r.chance(0.5) ? 'cap' : null), hatColor: lady ? 0xfff3d6 : 0x2f4f4f });
    W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: 0 + r.range(-6, 6), z: -12 + i * 12, speed: r.range(0.7, 1.1), leash: 12 }));
  }
  // the beach dog keeps to its own patch of sand — it does not follow the cat
  const dog = makeDog(0xc8925a); W.add(dog.group); game.npcs.push(new Wanderer(game, dog, { x: -2, z: 28, speed: 1.1, leash: 7, r: 0.35, height: 0.9, step: 0.3, idle: [1.5, 4], walk: [2, 5] }));
  let woofT = rnd.range(6, 12); U.push((dt) => { woofT -= dt; if (woofT <= 0) { SFX.woof(); woofT = rnd.range(10, 20); } });
  game.addInteractable({ obj: dog.group, radius: 2.4, label: () => 'Pet the dog', onUse: () => { SFX.woof(); game.hearts(dog.group.position.x, 0.8, dog.group.position.z, 4); game.toast('🐕 *happy tail wag*'); } });
  const sq = new Squirrel(game, -22, 8, 'sq-beach'); game.squirrels.push(sq);
  makeGemCluster(game, U, 16.5, -41, 7, [0x7fe0ff, 0xffd54a, 0xa8ff9a], r, 1.6); makeGemCluster(game, U, -29, 31, 5, [0xff6fb5, 0x7fe0ff, 0xc8a2ff], r, 1.2);
  // gull cries + waves near the shore
  let cryT = 4, waveT = 2;
  U.push((dt) => { cryT -= dt; waveT -= dt; const cx = game.cat.group.position.x; if (cryT <= 0) { SFX.gull(); cryT = rnd.range(6, 14); } if (waveT <= 0 && cx > 4) { SFX.wave(); waveT = rnd.range(4, 7); } });

  beachRegion(game, U, r, 58, SHORE_LIMIT - 8);
  // the headland behind the dunes: hills and peaks inland only, never out to sea
  makeHorizon(game, r, { clear: SHORE_LIMIT + 8, hill: 0x8c9a58, rock: 0x7a7060, rock2: 0x8a8272, snowLine: 58, peaks: 26, woodCount: 260, woodHue: [0.18, 0.28], woodLight: [0.18, 0.3], keep: (x) => x < -SHORE_LIMIT * 0.15 });
  // portal home (west end, on the dune ridge)
  const back = makeRingPortal(0x37e5a0, { frame: 0xa88a5a, glow: 0.22 }); placeT(game, U, back, -48, 0, PI / 2);
  for (const dz of [-1.4, 1.4]) boxT(game, -48, dz, 0.6, 2.6, 0.5);
  game.addInteractable({ obj: back, radius: 2.4, label: () => 'Return to the Neighborhood', onUse: () => game.travel(0, 'from-beach') });
  const C = game.collectibles;
  C.add('fish', 31, -10, 0.6); C.add('star', 12, -40); C.add('yarn', -18, 30); C.add('mouse', 2, 14); C.add('fish', 20, 30); C.add('star', -36, -26); C.add('yarn', -8, -36); C.add('mouse', -40, 20);
  game.fx.setAmbient({ count: 40, radius: 20, colors: [0xffffff, 0xfff6d5], rise: 0.4, drift: 0.5, life: 3, height: 2.5, yMin: 0.3 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
/** Adds a ground-following collider for a prop and returns the prop (for chaining into placeT). */
function boxAround(game, obj, x, z, w, h, d, opts = {}) { boxT(game, x, z, w, h, d, opts); return obj; }
