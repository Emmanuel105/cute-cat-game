// ---------------------------------------------------------------- 6. FROSTY PEAK
/** The mountain the zipline drops off, and the bottom of its run down into the village. */
const ZIP_PEAK = [-86, -84], ZIP_TOP = [-72, -70], ZIP_LANDING = [-24, -22];
function buildSnowVillage(game, entry) {
  const W = game.world, P = game.physics, r = seeded(606), U = [];
  P.setLimit(PEAK_LIMIT);
  game.applySky({ top: 0x0d1a3d, horizon: 0x8fb4e8, bottom: 0x3a4a6a, sun: [-0.5, 0.25, -0.6], sunColor: 0xcfe0ff, sunSize: 1500, halo: 0.25, stars: 0.9, moon: [200, 200, -220] });
  game.setLighting({ ambient: [0x9fb8ff, 0.75], hemi: [0xbfd8ff, 0x6a7a9a, 0.9], sun: [0xdfe8ff, 1.7, -40, 55, -40], fog: [0x6a86b8, 80, 450], exposure: 1.05 });

  // rolling snowfields, flattened around the village square, with two real peaks you can climb
  /** A smooth dome: `h` metres at (cx,cz), fading to nothing at `rad`. */
  const peak = (x, z, cx, cz, h, rad) => { const k = max(0, 1 - dist2(x, z, cx, cz) / (rad * rad)); return h * k * k * sqrt(k); };
  const T = (x, z) => {
    const d = sqrt(x * x + z * z); const hills = bumps(x, z, 0.06) * 1.6 + bumps(x + 50, z - 30, 0.15) * 0.5;
    const rim = smoothstep(130, 265, d);
    const h = hills * smoothstep(9, 34, d) + 0.55 + rim * rim * 80
      + peak(x, z, ZIP_PEAK[0], ZIP_PEAK[1], 38, 76) + peak(x, z, 104, 82, 32, 70);
    const cave = (1 - smoothstep(4, 7, abs(x))) * smoothstep(-25, -28, z) * (1 - smoothstep(-58, -62, z));   // flat strip for the cave
    const path = (1 - smoothstep(2.5, 5, abs(z))) * smoothstep(-42, -38, x) * (1 - smoothstep(-8, -4, x));     // flat path from the station to the village
    return lerp(h, 0.5, max(cave, path));
  };
  makeTerrain(game, T, mat(0xffffff, { roughness: 0.95, map: TEX.snow() }), 780, 312);
  const aurora = makeAurora(W, r); U.push(aurora.userData.update);

  // village: cabins around a campfire, igloos, a frozen pond, snowmen, sleds
  const fire = makeCampfire(game, 0, 0); U.push(fire.userData.update);
  // an old-timer on one of the fire's log seats, come in from the cold to warm her hands
  { const a = 2.5, lx = cos(a) * 1.7, lz = sin(a) * 1.7;
    const fireWard = makeWardrobe(r, { shirts: [0x7a4a3a, 0x5a4a6a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const granny = makeHuman({ ...randomPerson(r, { female: true, elder: true, child: false, wardrobe: fireWard, hairStyle: 'bun' }),
      hat: 'beanie', hatColor: 0x8a5acf, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(granny.group);
    game.npcs.push(new Sitter(game, granny, { x: lx, z: lz, ry: atan2(-lx, -lz), seat: 0.3,
      cries: ['Best seat on the mountain, this.', 'Come and warm your paws, puss.', "Cold enough to freeze a yeti's nose, out there."] })); }
  // a cocoa vendor stands near the fire, mug held up and steaming, happy to say hello
  { const cx = 3.6, cz = -3.0;
    const cocoaWard = makeWardrobe(r, { shirts: [0x8a3a3a, 0x5a6a4a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const vendor = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: cocoaWard }),
      hat: 'beanie', hatColor: 0xd62839, coat: true, scarf: 0xf7f3ec, cuffs: 0x3a3a3a }); W.add(vendor.group);
    const v = new Vendor(game, vendor, makeCocoaMug(), { x: cx, z: cz, ry: atan2(-cx, -cz), cryIcon: '☕',
      cries: ['Hot cocoa! Warms you right through.', 'Marshmallows or none, your choice.', "Careful, puss — it's steaming!"] });
    game.npcs.push(v); greetable(game, v); }
  for (const [x, z, ry, wall, roof] of [[-11, -6, PI / 2 - 0.3, 0x8a5a32, 0x4a3a30], [11, -5, -PI / 2 + 0.2, 0x7a4a28, 0x3a4a5a], [-4, 12, PI + 0.2, 0x9a6a3a, 0x4a3a30], [9, 11, PI - 0.4, 0x6a4a2a, 0x5a3a30]]) {
    const c = makeCabin({ wall, roof, w: r.range(4.5, 5.5), d: r.range(4, 5) }, r); placeT(game, U, c, x, z, ry); const [w, h, d] = c.userData.size; boxT(game, x, z, max(w, d) * 0.85, h, max(w, d) * 0.85);
    const ch = c.userData.chimney, y0 = P.ground0(x, z);
    U.push((dt) => { if (rnd.chance(dt * 3)) game.fx.emit(x + ch[0] * cos(ry) + ch[2] * sin(ry), y0 + ch[1], z - ch[0] * sin(ry) + ch[2] * cos(ry), { count: 1, color: 0xcfd6e0, speed: 0.15, up: 0.8, life: 3.5, gravity: -0.1, spread: 0.2 }); });
  }
  for (const [x, z, ry] of [[-16, 10, 0.6], [15, -14, -2.2]]) { placeT(game, U, makeIgloo(), x, z, ry); boxT(game, x, z, 3.4, 1.8, 3.4); }
  makeIcePond(game, 18, 8, 5, r);
  // an ice fisherman on a stool at the pond's edge, rod dipped into a hole cut in the ice, the odd bite
  { const holeY = P.ground0(18, 8) + 0.06;
    mesh(G.cyl(0.55, 0.55, 0.03, 16), mat(0x274050, { roughness: 0.3, transparent: true, opacity: 0.9 }), { x: 18, y: holeY, z: 11.5, shadow: 'none', parent: W });
    const anglerWard = makeWardrobe(r, { shirts: [0x8a6a4a, 0x5a6a4a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const angler = makeHuman({ ...randomPerson(r, { female: false, elder: true, child: false, wardrobe: anglerWard }),
      hat: 'beanie', hatColor: 0x3a4a5a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 18, z: 14.3, ry: PI, holeX: 18, holeZ: 11.5, holeY,
      cries: ['Not a bite in an hour...', "Careful, puss, don't scare them off.", 'Best fishing hole on the mountain, this.'] })); }
  for (const [x, z] of [[-6, -14], [7, 18], [-20, -2], [22, -4]]) { placeT(game, U, makeSnowman(r), x, z, r() * TAU); boxT(game, x, z, 1.0, 2.4, 1.0, { cam: false }); }
  for (const [x, z, ry, c] of [[-8, 6, 0.4, 0xd62839], [4, -9, 2.0, 0x2f6fd6]]) placeT(game, U, makeSled(c), x, z, ry);
  for (const [x, z] of [[-24, 18], [26, 16], [-26, -18], [24, -24], [0, -26], [-2, 28], [30, 0], [-32, 2]]) { const c = makeIceCrystal(r, r.pick([0x9fe8ff, 0xbfa8ff, 0xa8ffe8])); placeT(game, U, c, x, z, 0); boxT(game, x, z, 0.6, 1.6, 0.6, { cam: false }); }
  // forest ring + scattered pines
  for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, d = r.range(34, 50), x = cos(a) * d, z = sin(a) * d; if (abs(x) < 7 && z < -26) continue; if (abs(z) < 5 && x < -30) continue; const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  for (const [x, z] of [[-14, -20], [16, 22], [-28, 12], [28, -10], [6, -22], [-10, 24], [30, 26], [-30, -28]]) { const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  makeScatter(game, [[0, 0, 40, 70]], G.sphere(0.35, 7, 5), [0xffffff, 0xeef3fa, 0xdfe8f2], r, [0.6, 1.6], 0.0);   // snow drifts / buried boulders

  // life: penguins, reindeer, kids, the yeti, the squirrel
  for (let i = 0; i < 6; i++) { const rig = makePenguin({ scarf: i === 0 ? 0xd62839 : (i === 3 ? 0x2f6fd6 : null), scale: r.range(0.8, 1.05) }); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: 18 + r.range(-6, 6), z: 8 + r.range(-6, 6), speed: r.range(0.5, 0.8), leash: 9, r: 0.3, height: 0.9, step: 0.25, idle: [1, 3] })); }
  for (const [x, z] of [[-22, 6], [-18, -12], [24, 20]]) { const rig = makeDeer(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.6, leash: 8, r: 0.45, height: 1.4, step: 0.3, idle: [3, 7], walk: [2, 5] })); }
  // kids in beanies: wrapped up in coats, scarves and mittens, no two the same colour
  const snowWard = makeWardrobe(r, { shirts: [0xd62839, 0x2f6fd6, 0x2e9e6e, 0xff8f00, 0x8a5acf, 0x00acc1], pants: [0x1e2a44, 0x3a3a3a, 0x4a3a2a], shoes: [0x2a2018, 0x1e1a18] });
  const beanieBag = bag(r, [0xd62839, 0x2f6fd6, 0xffd54a, 0x2e9e6e, 0xef7d2f]);
  const scarfBag = bag(r, [0xd62839, 0xffd54a, 0x2e9e6e, 0x8a5acf, 0xffffff]);
  const kid = (female) => { const rig = makeHuman({ ...randomPerson(r, { female, child: true, wardrobe: snowWard }),
      hat: 'beanie', hatColor: beanieBag(), coat: true, scarf: scarfBag(), cuffs: r.pick([0xffffff, 0x3a3a3a]), height: r.range(1.2, 1.45) }); W.add(rig.group); return rig; };
  for (let i = 0; i < 2; i++) game.npcs.push(new Wanderer(game, kid(i === 1), { x: 5 + i * 5, z: 6, speed: r.range(0.9, 1.3), leash: 10, height: 1.5 }));
  // two of them are having a snowball fight across the square
  game.npcs.push(new SnowballFight(game, kid(false), kid(true), { cx: -3.5, cz: 6, gap: 5 }));
  // another kneels by the first snowman, packing on a fresh layer of snow
  { const sx = -6, sz = -14, kx = sx, kz = sz + 1.3;
    game.npcs.push(new Kneeler(game, kid(false), { x: kx, z: kz, ry: atan2(sx - kx, sz - kz),
      cries: ['Nearly got his arms right.', "Don't melt yet, mister snowman.", 'He needs a nose. A carrot would do.'] })); }
  // a woodcutter splits logs on a stump behind the northern cabin, keeping its stove fed
  { const sx = -4, sz = 18, cx = -4, cz = 19.3;
    placeT(game, U, makeStump(r), sx, sz, r() * TAU); boxT(game, sx, sz, 1.0, 0.75, 1.0, { cam: false });
    const chopWard = makeWardrobe(r, { shirts: [0xb5485f, 0x5a6a4a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const cutter = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: chopWard, build: 'stout' }),
      hat: 'beanie', hatColor: 0x3a5a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, axe: true, beard: true }); W.add(cutter.group);
    game.npcs.push(new Chopper(game, cutter, { x: cx, z: cz, ry: atan2(sx - cx, sz - cz),
      cries: ['Good dry wood, this — burns all night.', 'Mind the chips, puss.', 'Every cabin wants a full woodpile before dark.'] })); }
  // a woman gathers pinecones for kindling at the fringe of the pines, north-east of the square
  { const pineWard = makeWardrobe(r, { shirts: [0x4a6a3a, 0x6a5a4a, 0x5a4a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const gatherer = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: pineWard }),
      hat: 'beanie', hatColor: 0x5a6a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(gatherer.group);
    game.npcs.push(new Forager(game, gatherer, { x: 14, z: 27, ry: -0.6, cryIcon: '🌲',
      cries: ['Pinecones catch quicker than logs.', 'Every cabin wants kindling before the wood runs low.', 'Mind your paws, puss - sticky with sap.'] })); }
  // the yeti's cave: a long tunnel north into the mountain, lit by gems, with the yeti in its den at the far end
  const cave = makeCave(game, U, 0, -29, 27, r);
  for (const [x, z] of [[-9, -24], [9, -25]]) { const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  const yeti = makeYeti(); W.add(yeti.group); game.npcs.push(new Wanderer(game, yeti, { x: cave.den[0], z: cave.den[1] + 0.5, speed: 0.4, leash: 2.2, r: 0.9, height: 3, step: 0.4, idle: [2, 5], walk: [1, 3] }));
  makeGemCluster(game, U, 18, 3.5, 5, [0x9fe8ff, 0xbfa8ff, 0xa8ffe8], r, 1.2);
  let yetiHi = false; U.push(() => { const c = game.cat.group.position, near = dist2(c.x, c.z, yeti.group.position.x, yeti.group.position.z) < 36; if (near && !yetiHi) { yetiHi = true; SFX.roar(); game.toast('🦍 "RAAAWR… oh! Hello, tiny cat. Cold, isn\'t it?"'); } if (!near) yetiHi = false; });
  { const yid = game.namedFriend('yeti'); game.addInteractable({ obj: yeti.group, radius: 3.4, label: () => 'Say hi to the yeti', onUse: () => { game.befriend(yid); SFX.roar(); game.hearts(yeti.group.position.x, 2.2, yeti.group.position.z, 3); game.toast('🦍 "Warm fur! Best friends now."'); } }); }
  const sq = new Squirrel(game, -12, 18, 'sq-snow'); game.squirrels.push(sq);
  let squawkT = 5; U.push((dt) => { squawkT -= dt; if (squawkT <= 0) { SFX.squawk(); squawkT = rnd.range(6, 12); } });
  // an artist sets up an easel on the fringe of the village, painting the aurora overhead
  { const auroraWard = makeWardrobe(r, { shirts: [0x6a5a7a, 0x4a5a6a, 0x5a4a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const painter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: auroraWard }),
      hat: 'beanie', hatColor: 0x8a5acf, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, glasses: false });
    W.add(painter.group);
    game.npcs.push(new Painter(game, painter, makeEasel(), { x: 20, z: -16, ry: 0.9,
      cries: ['The sky does all the work, up here.', 'Try painting that shimmer, if you can.', 'Best canvas in the sky, tonight.'] })); }

  game.zones.addSpan(-7, -62, 7, -24); game.zones.addSpan(-44, -5, -6, 5); game.zones.addCircle(0, 0, 26);
  // the zipline: a tower high on the shoulder of the west peak, running down to a post above the village.
  // Standing at the top you look straight down the cable at the snow-capped mountains on the horizon.
  game.zones.addSpan(min(ZIP_TOP[0], ZIP_LANDING[0]) - 4, min(ZIP_TOP[1], ZIP_LANDING[1]) - 4, max(ZIP_TOP[0], ZIP_LANDING[0]) + 4, max(ZIP_TOP[1], ZIP_LANDING[1]) + 4);
  makeZipline(game, U, ZIP_TOP[0], ZIP_TOP[1], ZIP_LANDING[0], ZIP_LANDING[1], r);
  makeLanternPath(game, ZIP_LANDING[0] + 2, ZIP_LANDING[1] + 2, -10, -8, 5);
  // pines along the zipline, kept to its north-east side so the sled run on the other side stays clear
  for (let i = 0; i < 7; i++) { const k = i / 6, x = lerp(ZIP_TOP[0], ZIP_LANDING[0], k) + r.range(0, 9), z = lerp(ZIP_TOP[1], ZIP_LANDING[1], k) + r.range(-9, 0); const pn = makeSnowPine(r); placeT(game, U, pn, x, z, 0); boxT(game, x, z, 1.2 * pn.scale.x, 5, 1.2 * pn.scale.x, { cam: false }); }
  // the sled run: a child sleds down the flank of the west peak, then trudges back up dragging the sled
  game.npcs.push(new Sledder(game, kid(true), makeSled(0x2f6fd6), { top: [-68, -44], bottom: [-46, -26] }));
  snowRegion(game, U, r, 58, PEAK_LIMIT - 8);
  makeHorizon(game, r, { clear: PEAK_LIMIT + 8, hills: true, hill: 0xe8eef6, rock: 0x6a7a94, rock2: 0x7e8ea6, snow: 0xf6fbff, snowLine: 26, peaks: 32, peakH: [46, 110], woodCount: 300, woodHue: [0.32, 0.42], woodLight: [0.12, 0.2], trunk: 0x4a3a2a });
  // gondola home (bottom station of the village)
  const station = makeGondolaStation(game, -40, 0, PI / 2, () => game.travel(0, 'from-snow'), 'Ride the gondola home', 'NEIGHBORHOOD  ↓');
  station.position.y = P.ground0(-40, 0); U.push(station.userData.update);
  makeWelcomeArch(game, -31.5, 0, PI / 2);
  makeLanternPath(game, -29, 0, -8, 0, 6);
  for (const [x, z] of [[-28, 4.5], [-20, -4.5], [-14, 4.5]]) { const c = makeIceCrystal(r, r.pick([0x9fe8ff, 0xbfa8ff])); placeT(game, U, c, x, z, 0); boxT(game, x, z, 0.6, 1.6, 0.6, { cam: false }); }
  for (const [x, z] of [[-26, -6], [-18, 6]]) { const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  for (let i = 0; i < 6; i++) { const x = -30 + i * 4, z = (i % 2 ? 1 : -1) * 3.2; mesh(G.sphere(1, 8, 6), mat(0xf6f9fc, { roughness: 1 }), { x, y: P.ground0(x, z), z, sx: r.range(0.8, 1.4), sy: r.range(0.4, 0.7), sz: r.range(0.8, 1.4), shadow: 'none', parent: W }); }   // snow banks
  const C = game.collectibles;
  C.add('fish', 18, 8); C.add('star', 0, -30); C.add('yarn', -16, 4); C.add('mouse', 12, 20); C.add('star', 30, -20); C.add('fish', -30, 16); C.add('yarn', 22, -6); C.add('mouse', -6, 26);
  game.fx.setAmbient({ count: 480, radius: 22, colors: [0xffffff, 0xeaf4ff, 0xdfe8ff], rise: -1.0, drift: 0.5, life: 9, height: 12, yMin: 2 });
  makeDayNight(game, U, W);
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
