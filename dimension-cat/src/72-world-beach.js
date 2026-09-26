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
  // a fisherman on a stool near the end of the pier, rod out over the open water
  { const pierWard = makeWardrobe(r, { shirts: [0x4a6a7a, 0x5a5a4a, 0x3a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018, 0x1e2020] });
    const angler = makeHuman({ ...randomPerson(r, { female: false, elder: true, child: false, wardrobe: pierWard }),
      hat: 'cap', hatColor: 0x2e4a3a, coat: true, scarf: null, jacket: null });
    W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 30, z: -10, ry: PI / 2, seatY: 0.6, holeX: 34, holeZ: -10, holeY: 0.05,
      cries: ['Not a nibble all morning.', "Careful, puss, you'll spook them.", 'Best spot on the whole pier, this.'] })); }
  // a lifeguard up on a raised chair north of the swimming crowd, watching the water
  { game.zones.addCircle(13, 24, 2);
    const guard = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xd62839, pants: 0xf5f2ea, shorts: true, stripes: null, hat: 'cap', hatColor: 0xf5f2ea, glasses: true, glassColor: 0x203040, jacket: null, scarf: null, bag: null });
    W.add(guard.group);
    placeT(game, U, boxAround(game, makeLifeguardChair(), 13, 24, 1.3, 1.9, 1.1), 13, 24, PI / 2);
    game.npcs.push(new Sitter(game, guard, { x: 13, z: 24, ry: PI / 2, seat: 1.87, cryIcon: '🛟',
      cries: ['Swim between the flags, please!', 'Not a cloud in the sky today.', "Mind that current, puss — respect the sea."] })); }
  for (let i = 0; i < 12; i++) { const a = r() * TAU, d = r.range(2.6, 6); placeT(game, U, makeRock(r, 0x8a857a, r.range(0.8, 1.8)), 12 + cos(a) * d, -46 + sin(a) * d, 0); }
  for (let i = 0; i < 5; i++) placeT(game, U, boxAround(game, makeBeachHut(r.pick([0xff8a65, 0x4fc3f7, 0xfff176, 0x81c784, 0xf48fb1]), r), -10, -24 + i * 9, 2.8, 2.8, 2.8), -10, -24 + i * 9, PI / 2);
  // dunes: palms, grass tufts, driftwood
  const palmSpots = [[-20, 6], [-24, 16], [-18, 28], [-30, 30], [-34, -4], [-28, -14], [-38, 12], [-22, -32], [-36, -28], [-44, 2], [-42, 22], [-16, 40], [-30, 44], [-46, -18], [-12, 48], [-6, 34], [-4, -34], [-40, 40]];
  for (const [x, z] of palmSpots) { const p = makePalm(r, r.range(3.8, 5.6)); placeT(game, U, p, x, z, 0); boxT(game, x, z, 0.5, 5, 0.5, { cam: false }); }
  makeGrass(game, [[-26, 0, 22, 150], [-14, 30, 12, 70], [-40, -30, 12, 70]], r, { hue: [0.13, 0.21], light: [0.4, 0.56], tall: 1.15, wide: 1.45, pad: 0.2 });
  makeScatter(game, [[10, 0, 12, 60], [6, 28, 10, 40], [8, -26, 10, 40]], G.sphere(0.06, 6, 5), [0xfff1dc, 0xffd9c2, 0xf3e3c8, 0xd9a3a3, 0xe8c9a0], r, [0.6, 1.4], 0.02);  // shells
  for (const [x, z, ry] of [[-14, 36, 0.4], [4, -30, 1.2], [-6, 12, 2.4]]) { const log = makeHollowLog(r); log.scale.setScalar(0.7); placeT(game, U, log, x, z, ry); }
  // sunbathers' corner: umbrellas, towels, sandcastle, beach ball
  const towels = [];
  for (const [x, z, hue, tc] of [[6, 4, 0, 0x2f6fd6], [10, 12, 200, 0xff7043], [4, 18, 50, 0x8e24aa], [9, -20, 320, 0x2e9e6e]]) { placeT(game, U, makeUmbrella(hue), x, z, 0); boxT(game, x, z, 0.2, 2.2, 0.2, { cam: false }); const ry = r() * 0.6; placeT(game, U, makeTowel(tc), x + 1.2, z + 0.6, ry); towels.push([x + 1.2, z + 0.6, ry]); }
  placeT(game, U, makeSandcastle(), 7, -4, 0.3); boxT(game, 7, -4, 1.6, 1.4, 1.6, { cam: false });
  const ball = mesh(G.sphere(0.32, 14, 10), mat(0xffffff, { roughness: 0.5 }), { parent: W }); mesh(G.sphere(0.322, 14, 10), mat(0xd62839, { roughness: 0.5 }), { sx: 0.5, parent: ball }); mesh(G.sphere(0.322, 14, 10), mat(0x2f6fd6, { roughness: 0.5 }), { sz: 0.5, parent: ball });
  const ballY = P.ground0(3, 8); ball.position.set(3, ballY + 0.32, 8);
  // the ball is in play: see BallGame below, once the sunbathers are made
  // sea props: buoys, sailboat
  for (const [x, z, c] of [[38, -26, 0xd62839], [42, 6, 0xffd54a], [36, 30, 0xd62839]]) { const b = makeBuoy(c); b.userData.y0 = 0; place(game, U, b, x, z, 0, 0); }
  const boat = makeBoat(0x3f6fd6); boat.userData.y0 = 0.05; place(game, U, boat, 46, 16, -0.6, 0.05);
  const boat2 = makeBoat(0xd62839); boat2.userData.y0 = 0.05; boat2.scale.setScalar(0.8); place(game, U, boat2, 54, -30, 0.8, 0.05);

  // life: crabs, gulls, turtles, beachgoers, a dog, the squirrel
  for (const [x, z] of [[16, -30], [18, 2], [15, 14], [19, 24], [14, -18], [17, 36]]) { const rig = makeCrab(r.pick([0xe8492b, 0xff7043, 0xc62828])); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: r.range(0.9, 1.4), leash: 5, r: 0.25, height: 0.5, step: 0.25, idle: [0.5, 2], walk: [1, 3] })); }
  for (let i = 0; i < 7; i++) { const rig = makeSeagull({ phase: i * 1.3 }); game.npcs.push(new Flyer(game, rig, { cx: 14 + r.range(-8, 8), cz: r.range(-30, 30), r: r.range(9, 18), h: r.range(5, 11), speed: r.range(3.5, 5), bob: 1.2, wobble: 3, cw: i % 2 === 0, phase: i })); }
  for (const [x, z] of [[22, -2], [24, 20]]) { const rig = makeTurtle(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.35, leash: 5, r: 0.45, height: 0.5, step: 0.25, idle: [2, 5], walk: [3, 7] })); }
  const beachWard = makeWardrobe(r, {
    shirts: [0xff7043, 0x4fc3f7, 0xfff176, 0xf48fb1, 0xffffff, 0x80deea, 0xaed581],
    pants: [0x2f6fd6, 0xd62839, 0x2e9e6e, 0xff8fab, 0xffb74d],
    shoes: [0xefe7d8, 0xd7a86e, 0x8d6e63],
  });
  const beachPerson = (lady, child) => { const rig = makeHuman({ ...randomPerson(r, { female: lady, child, wardrobe: beachWard }),
      shorts: true, stripes: r.chance(0.35) ? 0xffffff : null,
      glasses: r.chance(0.45), glassColor: 0x203040,
      hat: child ? 'cap' : lady ? 'sunhat' : (r.chance(0.5) ? 'cap' : null), hatColor: lady ? 0xfff3d6 : 0x2f4f4f }); W.add(rig.group); return rig; };
  for (const [i, z] of [[0, -12], [1, 21], [2, 32]]) { const child = i === 2; game.npcs.push(new Wanderer(game, beachPerson(i === 1, child), { x: 0 + r.range(-6, 6), z, speed: child ? r.range(1.2, 1.6) : r.range(0.7, 1.1), leash: 12 })); }
  // two sunbathers flat out on their towels in dark glasses, and a child patting the sandcastle
  for (const i of [0, 3]) { const [tx, tz, ry] = towels[i]; game.npcs.push(new Sunbather(game, beachPerson(i === 0, false), { x: tx, z: tz + 0.55, ry })); }
  // a third sunbather on the spare towel, a paperback going nowhere fast
  { const [tx, tz, ry] = towels[1]; game.npcs.push(new Sunbather(game, beachPerson(r.chance(0.5), false), { x: tx, z: tz + 0.55, ry,
    cries: ["Sunbathing is a science, apparently.", 'Same page as an hour ago.', "Wake me if the tide comes in."] })); }
  game.npcs.push(new Kneeler(game, beachPerson(false, true), { x: 7, z: -2.7, ry: PI }));
  { const bucket = mat(0xd62839, { roughness: 0.6 }); mesh(G.cyl(0.16, 0.13, 0.26, 10), bucket, { x: 7.9, y: P.ground0(7.9, -2.4) + 0.13, z: -2.4, parent: W }); mesh(G.torus(0.16, 0.012, 5, 12), mat(0xffd54a), { x: 7.9, y: P.ground0(7.9, -2.4) + 0.27, z: -2.4, rx: PI / 2, shadow: 'none', parent: W }); }
  // a boy flying a kite on the dunes, the wind off the sea carrying it inland and up
  game.npcs.push(new KiteFlyer(game, beachPerson(false, true), makeKite(0xd62839, 0xf2c744), { x: -4, z: 40, wind: [-0.55, 0.85], cries: ['Look at it go!', "The wind's just right today.", 'Higher than the lighthouse!'] }));
  // two of them are keeping the beach ball in the air
  game.npcs.push(new BallGame(game, beachPerson(false, false), beachPerson(true, false), ball, { cx: 4, cz: 10, gap: 5.5 }));
  // the beach dog keeps to its own patch of sand — it does not follow the cat
  const dog = makeDog(0xc8925a); W.add(dog.group); game.npcs.push(new Wanderer(game, dog, { x: -2, z: 28, speed: 1.1, leash: 7, r: 0.35, height: 0.9, step: 0.3, idle: [1.5, 4], walk: [2, 5] }));
  let woofT = rnd.range(6, 12); U.push((dt) => { woofT -= dt; if (woofT <= 0) { SFX.woof(); woofT = rnd.range(10, 20); } });
  { const did = game.namedFriend('dog'); game.addInteractable({ obj: dog.group, radius: 2.4, label: () => 'Pet the dog', onUse: () => { game.befriend(did); SFX.woof(); game.hearts(dog.group.position.x, 0.8, dog.group.position.z, 4); game.toast('🐕 *happy tail wag*'); } }); }
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
