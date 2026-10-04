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
  // the Victorian bell tolls, the factory whistle blows, Whisper Woods' owl hoots — but Sunny Shore's
  // own lighthouse, sweeping its beam every second since the world was first built, had never once
  // sounded a horn. It blows a single low blast on a slow loop now, spaced far enough apart to read as
  // a working lighthouse keeping watch over the water rather than a warning. The interval is drawn from
  // the shared `rnd()` inside this `U` tick, read only after every NPC in this build is already placed,
  // so it can't shift any construction-time wardrobe pick, here or in any world built after it.
  let foghornT = rnd.range(35, 60);
  U.push((dt) => { foghornT -= dt; if (foghornT <= 0) { SFX.foghorn(); foghornT = rnd.range(80, 130); } });
  // the lighthouse itself never had anyone tending it, for all its own automatic beam — a keeper kneels
  // at its base, polishing the lowest band with a rag, a tin of polish set down beside them. A headless
  // probe swept a clearance ring around the tower's own 1.5 m half-width physics box: the ring at 2.0 m
  // out comes back clear the whole way round (the scattered rocks only start at 2.6 m), so the keeper
  // sits on the south side, well clear of both the tower and every rock, facing the tower to work on it
  { const kx = 12, kz = -48, ry = 0;
    const keeperWard = makeWardrobe(r, { shirts: [0x4a5a4a, 0x5a4a3a, 0x3a4a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018, 0x1e2020] });
    const keeper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: keeperWard }),
      hat: 'cap', hatColor: 0x3a4a4a, coat: true, scarf: null, jacket: null, bag: null, glasses: r.chance(0.25) });
    W.add(keeper.group);
    mesh(G.box(0.14, 0.01, 0.1), mat(0xdcd3b8, { roughness: 0.9 }), { y: 0.02, z: 0.08, rx: -0.3, parent: keeper.hands[1] });   // the rag
    mesh(G.cyl(0.05, 0.05, 0.04, 10), mat(0xc9a227, { metalness: 0.6, roughness: 0.4 }), { x: kx + 0.5, y: 0.02, z: kz - 0.3, parent: W });   // the tin of polish
    game.npcs.push(new Kneeler(game, keeper, { x: kx, z: kz, ry,
      cries: ["Salt air eats the paint faster than I can polish it.", "Careful, puss — don't track grease up the tower.", "Forty-two steps inside, and I still do this bit kneeling."] })); }
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
  // the guard's own flags marking the swim zone, one either side of the chair — she names them, but they never actually stood there before
  for (const [fx, fz, ph] of [[13, 18, 0], [13, 30, 2.1]]) { placeT(game, U, makeSwimFlag(ph), fx, fz, 0); boxT(game, fx, fz, 0.3, 2.3, 0.3, { cam: false }); }
  for (let i = 0; i < 12; i++) { const a = r() * TAU, d = r.range(2.6, 6); placeT(game, U, makeRock(r, 0x8a857a, r.range(0.8, 1.8)), 12 + cos(a) * d, -46 + sin(a) * d, 0); }
  // an artist sets up an easel on the clear sand south of the lighthouse, painting its red-and-white bands — Sunny Shore never had one
  { const px = 0, pz = -40, ry = atan2(12 - px, -46 - pz);
    const paintWard = makeWardrobe(r, { shirts: [0xf5f2ea, 0xffe0ea, 0xdcedf7], pants: [0x2f6fd6, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const painter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: paintWard }),
      hat: 'sunhat', hatColor: 0xd9c9a8, glasses: r.chance(0.3), jacket: null, scarf: null, bag: null });
    W.add(painter.group);
    game.npcs.push(new Painter(game, painter, makeEasel(), { x: px, z: pz, ry,
      cries: ['That red band never sits quite straight, does it.', 'Best light on the coast, this time of day.', "Careful, puss - wet paint, if you can believe it dries out here at all."] })); }
  // the ice-cream seller works the sunbathing crowd, but nobody sold the other half of a day at the
  // seaside — a fish-and-chips stand on the quiet open sand south of the lighthouse, past its rocks.
  // A headless probe swept a grid of candidates across the hand-built heart against every physics box
  // and every NPC's own position sampled over 40 simulated seconds: (4, -54) came back the clearest
  // point in the whole south end — 11.3 m past the lighthouse's own rocks, 18 m from the gem cluster
  // at (16.5, -41) and 21.6 m from the birdwatcher, with nothing else anywhere nearby
  { const cx = 4, cz = -54; game.zones.addCircle(cx, cz, 1.4);
    const chipWard = makeWardrobe(r, { shirts: [0xf5f2ea, 0xe8d9b0], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const fryer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: chipWard }),
      apron: 0xffffff, hat: 'cap', hatColor: 0x2f6fd6, jacket: null, scarf: null });
    W.add(fryer.group);
    const stand = new Vendor(game, fryer, makeChipsCone(), { x: cx, z: cz, ry: PI / 2, cryIcon: '🍟',
      cries: ['Fish and chips! Hot and vinegared, just how it should be.', 'Mind the gulls, puss — they go for the chips first.', 'Extra salt? Go on then.'] });
    game.npcs.push(stand); greetable(game, stand); }
  // the five huts have stood here bare-roofed since round 13 — a small pennant now flies from each one's
  // own ridge, in the hut's own wall colour. The pole sits at the roof apex (y=3.6, from makeBeachHut's
  // wall top at 2.5 plus its 1.2 m gable) and climbs 0.5 m higher still, well above the hut's own physics
  // box (top at h=2.8, same reasoning round 222's windsock and round 225's castle pennants already relied
  // on), so no new box is needed. The flag sits at local (0,0) on the hut's own ridge line, so it needs no
  // rotation math the way round 223's chimneys did: the hut's own ry (always PI/2 here) turns it in place
  // without moving it off-centre. Only the five hand-placed huts get one — makeBeachHut() itself is shared
  // with 68-regions.js's unbounded dune clusters, and giving every region-filled hut its own animated,
  // unbaked flag would have multiplied draw calls across the whole outer country for no one to notice.
  // The sway uses only the world clock `t` and a fixed phase from the hut's own index, never `r()` or the
  // shared `rnd()`, so it draws nothing from either sequence and can't shift any later pick in this world.
  for (let i = 0; i < 5; i++) {
    const hz = -24 + i * 9, hutColor = r.pick([0xff8a65, 0x4fc3f7, 0xfff176, 0x81c784, 0xf48fb1]);
    placeT(game, U, boxAround(game, makeBeachHut(hutColor, r), -10, hz, 2.8, 2.8, 2.8), -10, hz, PI / 2);
    addHutFlag(game, U, -10, hz, hutColor, i);
  }
  // the Neighborhood's porch, Frosty Peak's first cabin, Whisper Woods' treehouse and Victorian's last
  // terrace door all sway a wind chime of their own by now — every hut here flies a pennant, but none
  // ever got the one sound a beach hut's own eave could make. One now hangs under the back-left corner
  // of the last hut (-10, 12), driftwood disc and sea-worn tubes rather than the others' wood and brass,
  // opposite the front door and stripe (local z=+1.2, x=0.8) so it reads as the quiet side of the hut.
  // localXZ(-10, 12, -1.1, -1.1, PI/2) carries that corner out to world (-11.1, 13.1), clear of the sand-castle
  // kid by the first hut 36 m south and the ice-cream vendor 29 m north. y=2.3 sits just under the wall's
  // own 2.5 m top, below the roof overhang and the flagpole 1.3 m further up — no physics box needed, same
  // as every wind chime before it.
  { const [cx, cz] = localXZ(-10, 12, -1.1, -1.1, PI / 2);
    placeT(game, U, makeWindChime(game, { wood: 0x9a7a52, metal: 0xb8c4c4 }), cx, cz, 0, 2.3); }
  // an ice-cream vendor on the open sand between the huts and the sunbathing crowd
  { const cx = -4, cz = -6; game.zones.addCircle(cx, cz, 1.4);
    const scoopWard = makeWardrobe(r, { shirts: [0xffffff, 0xf7f3ec], pants: [0x2f6fd6, 0x2a2a2a], shoes: [0xefe7d8, 0x8d6e63] });
    const scoopSeller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: scoopWard }),
      apron: 0xf5f2ea, hat: 'cap', hatColor: 0xff7043, jacket: null, scarf: null });
    W.add(scoopSeller.group);
    const v = new Vendor(game, scoopSeller, makeIceCreamCone(), { x: cx, z: cz, ry: PI / 2, cryIcon: '🍦',
      cries: ['Ice cream! Cold as the sea!', "Melts fast in this sun — best hurry!", 'One scoop or two, puss?'] });
    game.npcs.push(v); greetable(game, v); }
  // dunes: palms, grass tufts, driftwood
  const palmSpots = [[-20, 6], [-24, 16], [-18, 28], [-30, 30], [-34, -4], [-28, -14], [-38, 12], [-22, -32], [-36, -28], [-44, 2], [-42, 22], [-16, 40], [-30, 44], [-46, -18], [-12, 48], [-6, 34], [-4, -34], [-40, 40]];
  for (const [x, z] of palmSpots) { const p = makePalm(r, r.range(3.8, 5.6)); placeT(game, U, p, x, z, 0); boxT(game, x, z, 0.5, 5, 0.5, { cam: false }); }
  makeGrass(game, [[-26, 0, 22, 150], [-14, 30, 12, 70], [-40, -30, 12, 70]], r, { hue: [0.13, 0.21], light: [0.4, 0.56], tall: 1.15, wide: 1.45, pad: 0.2 });
  makeScatter(game, [[10, 0, 12, 60], [6, 28, 10, 40], [8, -26, 10, 40]], G.sphere(0.06, 6, 5), [0xfff1dc, 0xffd9c2, 0xf3e3c8, 0xd9a3a3, 0xe8c9a0], r, [0.6, 1.4], 0.02);  // shells
  for (const [x, z, ry] of [[-14, 36, 0.4], [4, -30, 1.2], [-6, 12, 2.4]]) { const log = makeHollowLog(r); log.scale.setScalar(0.7); placeT(game, U, log, x, z, ry); }
  // every other world already had its own Patroller walking a beat (the Neighborhood's postie, Candy
  // Land's gate guard, Robot City's sentry, Victorian's bobby, Frosty Peak's ski patroller, Whisper
  // Woods' hiker) — Sunny Shore never had one. A headless probe swept the fully built world's own
  // physics boxes plus every NPC's position sampled continuously over 40 simulated seconds (so no
  // wandering crab, turtle or sunbather mid-leash could slip past unnoticed) and found a quiet dune
  // pocket west of the beach huts clear the whole way round: the loop at x -44..-38, z -12..-4 never
  // came closer than 3.75 m to anything else, mild underfoot (ground height 0.47-0.86 m across the four
  // corners) and well short of the radius (58, padded to 65) where beachRegion's own fill takes over.
  { const patrolWard = makeWardrobe(r, { shirts: [0xc9a15a, 0x5a7a6a, 0x3a5a6a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x2a2018] });
    const patroller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: patrolWard }),
      hat: 'cap', hatColor: 0xc9a15a, glasses: true, glassColor: 0x203040, jacket: null, scarf: null, bag: 0x3a3a3a });
    W.add(patroller.group);
    game.npcs.push(new Patroller(game, patroller, { points: [[-44, -12], [-38, -12], [-38, -4], [-44, -4]], speed: 0.8, pause: [1.5, 3], pauseAll: true, loop: true, cryIcon: '🏖️',
      cries: ['Dunes are holding up fine today.', 'Careful, puss — that grass took years to root.', 'Quietest beat on the whole coast, this one.', 'No rip currents today. Or yesterday. Good record, really.'] })); }
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
  // a bolder crab: it minds its own business until the cat wanders close, then scuttles over for a look
  { const rig = makeCrab(0xd84315); W.add(rig.group);
    game.npcs.push(new Follower(game, rig, { x: 17, z: -6, r: 0.25, height: 0.5, step: 0.25, idle: [0.5, 2], walk: [1, 3], leash: 5, speed: 1.8, range: 10, keep: 1.6, sfx: () => SFX.click() })); }
  for (let i = 0; i < 7; i++) { const rig = makeSeagull({ phase: i * 1.3 }); game.npcs.push(new Flyer(game, rig, { cx: 14 + r.range(-8, 8), cz: r.range(-30, 30), r: r.range(9, 18), h: r.range(5, 11), speed: r.range(3.5, 5), bob: 1.2, wobble: 3, cw: i % 2 === 0, phase: i })); }
  for (const [x, z] of [[22, -2], [24, 20]]) { const rig = makeTurtle(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.35, leash: 5, r: 0.45, height: 0.5, step: 0.25, idle: [2, 5], walk: [3, 7] })); }
  // sandpipers dart along the tideline on the open sand, well clear of the crabs' own homes, the lighthouse rocks and the swim-flag posts — ambient like the crabs and gulls, no greeting, no effect on the friend count
  for (const [x, z] of [[16, -24], [17, -38], [14, 44]]) { const rig = makeSandpiper(); game.npcs.push(new Hopper(game, rig, { x, z, leash: 1.6, r: 0.08, dist: [0.3, 0.7], dur: 0.28, height: 0.14, idle: [1, 3.5], onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); }
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
  // a juggler works the open sand between the towels and the lifeguard chair, three balls in a steady loop over their own head
  { const jx = 3, jz = 16, jugWard = makeWardrobe(r, { shirts: [0xffd54a, 0x2e9e6e, 0xf7f3ec], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const juggler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: jugWard }),
      glasses: r.chance(0.3), hat: null, jacket: null, scarf: null, bag: null });
    W.add(juggler.group);
    game.npcs.push(new Juggler(game, juggler, [0xffffff, 0xd62839, 0x2f6fd6], { x: jx, z: jz, ry: atan2(8 - jx, 10 - jz),
      cries: ["Three's easy - four's where it gets interesting.", "Careful, puss, I don't want you underfoot.", "Ask nicely and I'll teach you the trick."] })); }
  game.npcs.push(new Kneeler(game, beachPerson(false, true), { x: 7, z: -2.7, ry: PI }));
  { const bucket = mat(0xd62839, { roughness: 0.6 }); mesh(G.cyl(0.16, 0.13, 0.26, 10), bucket, { x: 7.9, y: P.ground0(7.9, -2.4) + 0.13, z: -2.4, parent: W }); mesh(G.torus(0.16, 0.012, 5, 12), mat(0xffd54a), { x: 7.9, y: P.ground0(7.9, -2.4) + 0.27, z: -2.4, rx: PI / 2, shadow: 'none', parent: W }); }
  // a beachcomber crouched further south, sorting shells into a little pile where the shell scatter is thickest
  { const cx = 5, cz = -32;
    game.npcs.push(new Kneeler(game, beachPerson(r.chance(0.5), false), { x: cx, z: cz, ry: 1.9,
      cries: ['Found a whole conch, look!', 'This one still has its shine.', "One more and I'll call it a collection."] })); }
  // a girl kneels at the tideline south of the lighthouse, finishing a message drawn in the wet sand
  { const cx = 21, cz = -36;
    game.npcs.push(new Kneeler(game, beachPerson(true, true), { x: cx, z: cz, ry: 2.0,
      cries: ["Nearly got the last letter right.", "Tide will take it in an hour, but that's alright.", "It says 'MEOW' — for you, if you can read it upside down."] })); }
  // a birdwatcher stands on the open sand south of the huts, binoculars trained on the gulls wheeling over the water
  { const birdWard = makeWardrobe(r, { shirts: [0x5a7a4a, 0x4a6a7a, 0x6a5a4a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0xefe7d8, 0x8d6e63] });
    const birder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: birdWard }),
      hat: 'cap', hatColor: 0x2f4f4f, glasses: true, glassColor: 0x203040, jacket: null, scarf: null, bag: null });
    W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: -8, z: -36, ry: 1.3,
      cries: ["There's one - no, gone again.", "Fifty-two species this year, if I've counted right.", "Gulls mostly. Still counts."] })); }
  // the birdwatcher above just watches the gulls; Victorian's own crumb-feeder (built for its pigeons)
  // already named Sunny Shore as the gulls' turn to come — a feeder now kneels on the open sand of the
  // sunbathing corner, a paper bag of chips at her side, reusing Forager's own kneel-and-toss exactly as
  // Victorian's crumb-feeder and Whisper Woods' mushroom-picker already do. A headless probe built the
  // real Sunny Shore, sampled every NPC's and the squirrel's own position continuously over 30 simulated
  // seconds (so no wandering sunbather, crab or gull mid-circuit could slip past unnoticed), and swept a
  // grid of the whole sunbathing corner against both those samples and every physics box, staying well
  // inside the hand-built heart (radius < 50, short of beachRegion's own fill at 58): (3, -13.5) came back
  // clear, 8.7 m from the nearest other soul or collider in any direction — between the ice-cream cart and
  // the towels, facing out toward where the gulls wheel over the water.
  { const kx = 3, kz = -13.5, gx = 14, gz = 0, ry = atan2(gx - kx, gz - kz);
    const feedWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x5a6a5a, 0x4a5a6a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0xefe7d8, 0x8d6e63] });
    const feeder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: feedWard }),
      hat: 'sunhat', hatColor: 0xd9c9a8, shorts: true, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(feeder.group);
    mesh(G.box(0.2, 0.16, 0.12), mat(0xf0dcae, { roughness: 0.9 }), { x: kx + 0.35, y: 0.08, z: kz + 0.12, ry: 0.3, parent: W });   // the paper bag of chips
    boxT(game, kx + 0.35, kz + 0.12, 0.2, 0.16, 0.12, { cam: false });
    game.npcs.push(new Forager(game, feeder, { x: kx, z: kz, ry, cryIcon: '🍟',
      cries: ["Not too close, puss, these are for the gulls.", "They'll take it right out of your hand if you let them.", "One always gets there before the rest."] })); }
  // Whisper Woods has its own jogger catching their breath deep in the trees, but nobody on this whole
  // beach had come for an actual run — every other soul here is either working, playing or lying down.
  // A headless probe built the real Sunny Shore, sampled every NPC's and the squirrel's own position
  // continuously over 30 simulated seconds (so no wandering crab, turtle or sunbather mid-circuit could
  // slip past unnoticed), and swept the dry sand south of the ice-cream cart against both those samples
  // and every physics box: (1, -25) came back clear by 7.6 m in every direction, between the gull-feeder
  // at (3, -13.5) and the beachcomber at (5, -32) — well inside beachRegion's own fill, which only
  // starts past radius 58.
  { const jx = 1, jz = -25, ry = PI / 2;
    const runner = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false }),
      shirt: 0xd62839, stripes: 0xf5f2ea, pants: 0x2a2a2a, shoes: 0xf5f2ea, shorts: true, hat: null, scarf: null, jacket: null, bag: null, backpack: null, glasses: false });
    W.add(runner.group);
    game.npcs.push(new Charger(game, runner, { x: jx, z: jz, ry, cryIcon: '🏃',
      cries: ["Didn't expect company, out here.", "Sand's twice the work of a proper road.", "One more stretch before the tide's all the way in."] })); }
  // a clam digger kneels in the wet sand north of the pier, working the tideline for shellfish — Sunny Shore's tideline never had anyone digging it, only walking it
  { const digWard = makeWardrobe(r, { shirts: [0x6a8a9a, 0x9a8a6a, 0x7a6a5a], pants: [0x3a4a3a, 0x4a3a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const digger = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: digWard }),
      hat: r.chance(0.5) ? 'cap' : null, hatColor: 0x4a5a4a, shorts: true, bag: 0x5a4a3a, jacket: null, scarf: null, glasses: false });
    W.add(digger.group);
    game.npcs.push(new Forager(game, digger, { x: 20, z: 9, ry: PI / 2, cryIcon: '🦪',
      cries: ["A clam! Bucket's filling up nicely.", "Careful, puss — sharp shells under that sand.", "Low tide's the only time worth digging."] })); }
  // a boy kneels in the dune grass south-west of the beach huts, digging for sand crabs with a toy shovel
  { const kx = -24, kz = -22, hx = kx + 1.6, hz = kz - 0.6;
    game.npcs.push(new Kneeler(game, beachPerson(false, true), { x: kx, z: kz, ry: atan2(hx - kx, hz - kz),
      cries: ['Nearly got one that time!', "They're faster than they look.", "Sh-h, you'll scare them off, puss."] })); }
  // a kid kneels by the yellow beach hut's steps, patting together a lopsided sand copy of the hut itself
  { const kx = -6, kz = -22, hutX = -10, hutZ = -24;
    game.npcs.push(new Kneeler(game, beachPerson(r.chance(0.5), true), { x: kx, z: kz, ry: atan2(hutX - kx, hutZ - kz),
      cries: ['Nearly as tall as the real one!', 'It needs a door - hang on.', "Careful, puss, that's the chimney."] })); }
  // a metal detectorist sweeps the open sand between the ice-cream cart and the sunbathers, coil beeping onto a find every so often
  { const detWard = makeWardrobe(r, { shirts: [0xc9a86a, 0x8a9a6a, 0xa8926a], pants: [0x4a4a3a, 0x3a4a4a], shoes: [0x5a4030, 0x3a2a1e] });
    const hunter = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: detWard }),
      hat: 'cap', hatColor: 0x5a6a4a, shorts: true, bag: 0x8a6a4a, jacket: null, scarf: null, glasses: r.chance(0.4) });
    W.add(hunter.group);
    game.npcs.push(new Detectorist(game, hunter, { x: -6, z: 18, ry: -1.6,
      cries: ['Found a bottle cap. Progress.', "Careful, puss, you'll set it off.", "One day it'll be real treasure."] })); }
  // two friends chatting on the quiet sand at the north end, well clear of the crowd by the huts
  { const talkA = beachPerson(false, false), talkB = beachPerson(true, false);
    game.npcs.push(new Talkers(game, talkA, talkB, { x: 14, z: 34, ry: 1.2,
      lines: ["Best week of the summer, this.", 'You say that every year.', 'And I mean it every year.', "Tide's coming in - we'll want to move those towels."] })); }
  // a boy flying a kite on the dunes, the wind off the sea carrying it inland and up
  game.npcs.push(new KiteFlyer(game, beachPerson(false, true), makeKite(0xd62839, 0xf2c744), { x: -4, z: 40, wind: [-0.55, 0.85], cries: ['Look at it go!', "The wind's just right today.", 'Higher than the lighthouse!'] }));
  // two of them are keeping the beach ball in the air — greetable too, like everyone else on the sand
  { const ballA = beachPerson(false, false), ballB = beachPerson(true, false);
    game.npcs.push(new BallGame(game, ballA, ballB, ball, { cx: 4, cz: 10, gap: 5.5 }));
    greetable(game, { rig: ballA }); greetable(game, { rig: ballB }); }
  // two kids chase each other round the open sand out past the dunes — a game of tag, the one thing the beach's children never had to do together
  { const tagA = beachPerson(false, true), tagB = beachPerson(true, true);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: -28, cz: 22, leash: 5.5 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }
  // the moored boats never had anyone tending their gear; a net-mender sits on a stool on the quiet north sand, coiling rope in her lap
  { const nx = 25, nz = 48, ry = PI / 2;
    const mendWard = makeWardrobe(r, { shirts: [0x8a6a4a, 0x5a7a6a, 0x4a5a4a], pants: [0x3a3a3a, 0x2a2a2a], shoes: [0x5a4030, 0x3a2a1e] });
    const mender = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.35), wardrobe: mendWard }),
      hat: r.chance(0.4) ? 'cap' : null, hatColor: 0x4a5a4a, jacket: null, scarf: null, bag: null, glasses: false });
    W.add(mender.group);
    const rope = mat(0xc9a96a, { roughness: 0.95 });
    for (let i = 0; i < 3; i++) mesh(G.torus(0.09 - i * 0.015, 0.018, 6, 12), rope, { y: 0.02 + i * 0.01, rx: PI / 2, parent: mender.hands[1] });
    placeT(game, U, makeIceStool(), nx, nz, ry);
    game.npcs.push(new Sitter(game, mender, { x: nx, z: nz, ry, seat: 0.3,
      cries: ["Salt gets in every knot, out here.", 'Careful, puss — this line still has hooks on it.', "Boats won't mend themselves, will they."] })); }
  // nobody at Sunny Shore had ever come to actually surf; one waxes their board on the quiet sand near the net-mender, board planted nose-down beside them
  { const sx = 2, sz = 45, ry = PI / 2, bx = 2, bz = 44;
    const surfWard = makeWardrobe(r, { shirts: [0x2e9e6e, 0xff7043, 0x2f6fd6], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const surfer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: surfWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, glasses: r.chance(0.3) });
    W.add(surfer.group);
    mesh(G.box(0.09, 0.05, 0.14), mat(0xf7f3ec, { roughness: 0.95 }), { y: 0.05, z: 0.07, parent: surfer.hands[0] });   // the wax block
    placeT(game, U, makeSurfboard(r.pick([0xff7043, 0x2f6fd6, 0xffd54a, 0x2e9e6e])), bx, bz, ry);
    boxT(game, bx, bz, 0.6, 1.5, 0.4, { cam: false });
    game.npcs.push(new Washer(game, surfer, { x: sx, z: sz, ry,
      cries: ["Wax while it's warm, that's the trick.", 'Careful, puss — sticky hands.', "Flat today, but you never know."] })); }
  // no world had a musician yet; one sits cross-legged in the dune grass west of the towels, strumming a ukulele toward the sunbathers
  { const mx = -34, mz = 0, mry = atan2(5 - mx, 10 - mz);
    const museWard = makeWardrobe(r, { shirts: [0xffd54a, 0xff7043, 0x2f6fd6], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const musician = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.25), wardrobe: museWard }),
      hat: r.chance(0.4) ? 'sunhat' : null, hatColor: 0xd9c9a8, glasses: r.chance(0.3), jacket: null, scarf: null, bag: null });
    W.add(musician.group);
    const uke = makeUkulele(r.pick([0xd9a15a, 0xc9915a, 0xb98a52]));
    uke.position.set(0.03, -0.02, 0.14); uke.rotation.set(-0.25, 0.1, 0.2);
    musician.hands[1].add(uke);
    game.npcs.push(new Sitter(game, musician, { x: mx, z: mz, ry: mry, seat: 0.1,
      cries: ["Three chords is all you need, really.", "Careful, puss — that's out of tune, not broken.", "Sea air's terrible for the strings."] }));
    U.push((dt, t) => { const A = musician.arms[1]; A.el.rotation.x = -1.0 + sin(t * 5.4) * 0.22; A.sh.rotation.z = -0.15; }); }
  // three friends dance a ring on the quiet dune grass west of the huts — Sunny Shore never had a dance circle, only the two ring-dances inland
  { game.zones.addCircle(-42, -22, 2.4);
    const dancers = [false, true, false].map((lady) => beachPerson(lady, false));
    game.npcs.push(new RingDance(game, dancers, { cx: -42, cz: -22, r: 1.8, speed: 0.5, turnEvery: 10, cryIcon: '💃',
      cries: ['Somebody find the beat, we lost it!', "Careful, puss, you'll get trodden on!", 'One more turn before the tide comes in!'] })); }
  // the Neighborhood, Victorian, Frosty Peak and Whisper Woods all have a swing set, but Sunny Shore's
  // children never had anywhere to just sit and swing — a sun-bleached set planted in the dry sand north
  // of the lifeguard chair, well clear of the sunbathers and the dune games
  { const sx = 8, sz = 27;
    const swingSet = makeSwingSet({ color: 0xd9a84a }); place(game, U, swingSet, sx, sz, PI);
    game.zones.add(sx, sz, 3.4, 3.2);
    for (const px of [-1.3, 1.3]) P.addBox(sx + px, 1.4, sz, 0.4, 2.8, 1.3, { cam: false });
    const swingKid = beachPerson(r.chance(0.5), true);
    const sw = new Swinger(game, swingKid, swingSet, { x: sx, z: sz }); game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher! Higher!"', 1800); } }); }
  // the Neighborhood, Candy Land, Robot City and Victorian all paired their swing set with a seesaw —
  // Sunny Shore's swing set (above) never got one. A headless probe swept the dry dune sand north of it
  // against every physics box, NPC circle and wandering rig's own position, sampled over 20 simulated
  // seconds so a Wanderer mid-leash wouldn't be missed: (8, 38) came back clear by at least 6.3 m
  // throughout, 11 m past the swing set itself and well short of the region fill that only starts past
  // 58 m out. Terrain here isn't flat (the dune rises gently inland), so, unlike the swing set's own fixed
  // y, the seesaw is ground-following with `placeT`.
  { const sx = 8, sz = 38;
    const seesaw = makeSeesaw({ color: 0x2e9e6e }); placeT(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, game.physics.ground0(sx, sz) + 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeA = beachPerson(false, true), seeB = beachPerson(true, true);
    game.npcs.push(new Seesaw(game, seeA, seeB, seesaw, { x: sx, z: sz })); }
  // a sand sculptor works alone in the quiet far south-west dune — the sandcastle up north already has
  // its own patter of a kid, but nobody on this whole beach had ever built something properly ambitious.
  // A headless probe built the real game, travelled to Sunny Shore, sampled every NPC's own position
  // (and the squirrel's) continuously over 30 simulated seconds, and swept a grid of candidate points on
  // dry sand (ground height above 0.15 m, to stay off the wet shore) against every physics box in the
  // fully built world, region fill included: (-30, -54) came back the clearest spot on the whole map, at
  // least 22 m from the nearest other soul or collider in any direction — well past the dune patroller's
  // own loop and the birdwatcher further north
  { const sx = -30, sz = -54, kx = sx - 1.4, kz = sz + 0.7;
    const turtle = makeSandTurtle(); placeT(game, U, turtle, sx, sz, 0.4);
    boxT(game, sx, sz, 1.9, 1.1, 2.1, { cam: false });
    const sculptWard = makeWardrobe(r, { shirts: [0xdcd3b8, 0xc9a86a, 0x8a9a6a], pants: [0x3a3a2a, 0x2a2a2a], shoes: [0x5a4530, 0x2a2018] });
    const sculptor = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: sculptWard }),
      hat: r.chance(0.5) ? 'sunhat' : null, hatColor: 0xd9c9a8, shorts: true, jacket: null, scarf: null, bag: null }); W.add(sculptor.group);
    const trowel = group(0, 0.02, 0.1, sculptor.hands[1]); trowel.rotation.x = -0.4;
    mesh(G.box(0.02, 0.1, 0.06), mat(0x8a8a8a, { metalness: 0.4, roughness: 0.5 }), { y: 0.05, parent: trowel });
    game.npcs.push(new Kneeler(game, sculptor, { x: kx, z: kz, ry: atan2(sx - kx, sz - kz), cryIcon: '🐢',
      cries: ['Took all morning, just the shell.', "Careful, puss — one tail flick and it's rubble.", "Tide won't reach this far up. I hope."] })); }
  // the surfer above waxes a board, but nobody on this whole beach had ever actually geared up to go
  // *in* the water themselves — a snorkeler sits on the dry sand near the shore, pulling a fin on, mask
  // pushed up on their forehead, the other fin still waiting on the sand beside them. A headless probe
  // built the real Sunny Shore, sampled every NPC's and the squirrel's own position continuously over 30
  // simulated seconds (so no wandering crab, turtle or sunbather mid-circuit could slip past unnoticed),
  // and swept a grid of the dry sand (ground height 0.35-1.0 m, to stay off both the wet shore and the
  // dune grass) against those samples and every physics box: (21.5, -51.5) came back clear by 8.9 m in
  // every direction, south of the gem cluster at (16.5, -41) and well past the fish-and-chips stand
  // further west — facing east, out toward the water.
  { const kx = 21.5, kz = -51.5, ry = PI / 2;
    const snorkWard = makeWardrobe(r, { shirts: [0x2f6fd6, 0xff7043, 0x2e9e6e], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0xefe7d8, 0x8d6e63] });
    const snorkeler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: snorkWard }),
      shorts: true, hat: null, jacket: null, scarf: null, bag: null, glasses: false }); W.add(snorkeler.group);
    // the mask, pushed up on the forehead, snorkel tube curling back from it
    const maskMat = mat(0x2a2a2a, { roughness: 0.6 }), lensMat = mat(0x8fd6ff, { roughness: 0.2, transparent: true, opacity: 0.6 });
    const mask = group(0, 0.16, 0.05, snorkeler.head); mask.rotation.x = -0.3;
    mesh(G.box(0.14, 0.07, 0.03), maskMat, { parent: mask });
    mesh(G.box(0.1, 0.045, 0.01), lensMat, { z: 0.02, shadow: 'none', parent: mask });
    mesh(G.cyl(0.012, 0.012, 0.22, 6), maskMat, { x: 0.08, y: 0.05, rz: 0.4, parent: mask });
    // the spare fin, waiting on the sand beside them
    const finMat = mat(0x2f6fd6, { roughness: 0.6 });
    const fin = group(kx + 0.5, 0.02, kz, W); fin.rotation.y = ry + 0.3;
    mesh(G.box(0.1, 0.03, 0.42), finMat, { z: 0.15, shadow: 'both', parent: fin });
    mesh(G.box(0.14, 0.02, 0.1), finMat, { z: -0.1, shadow: 'both', parent: fin });
    boxT(game, kx + 0.5, kz, 0.3, 0.1, 0.5, { cam: false });
    game.npcs.push(new Kneeler(game, snorkeler, { x: kx, z: kz, ry, cryIcon: '🤿',
      cries: ['Nearly got this fin strap right.', "Careful, puss — mind your tail, these snap.", "Clearest water of the week, out there."] })); }
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
/** A small pennant on a short pole at a beach hut's own roof apex (y=3.6 above its own ground), swaying on
 *  the world clock `t` plus a fixed phase from the hut's own index — never `r()` or the shared `rnd()`. */
function addHutFlag(game, U, x, z, color, i) {
  const y0 = game.physics.ground0(x, z) + 3.6, poleM = mat(0xfff5e6, { roughness: 0.6 });
  const pole = group(x, y0, z, game.world);
  mesh(G.cyl(0.018, 0.024, 0.5, 6), poleM, { y: 0.25, shadow: 'none', parent: pole });
  const flag = group(0, 0.5, 0, pole);
  mesh(G.box(0.3, 0.17, 0.012), mat(color, { roughness: 0.6 }), { x: 0.16, shadow: 'none', parent: flag });
  const phase = i * 1.3;
  pole.userData.update = (dt, t) => { flag.rotation.y = 0.5 + sin(t * 2.3 + phase) * 0.25; flag.rotation.z = sin(t * 1.8 + phase) * 0.06; };
  U.push(pole.userData.update);
}
