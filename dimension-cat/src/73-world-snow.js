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
  // the village fire has crackled with light and particle sparks since round 29 but never made a sound of
  // its own; a quiet crackle now pops every few seconds while the cat's anywhere near the square. Kept to
  // this one hand-placed fire rather than `makeCampfire` itself, since the outer snowfield's own region
  // fill (68-regions.js) scatters several more of them — looping a sound on every one of those would turn
  // into noise far from the village with nobody around to hear it.
  U.push((dt) => { if (rnd.chance(dt * 0.18)) SFX.crackle(); });
  // the fire itself never got the "walk up and look" toast every other world's own centrepiece has had
  // by now (the furnace, the robot arm, the carriage, the sandcastle) — same trick again: `fire` (already
  // kept, two lines up, for its own flicker animation) is handed straight to `game.addInteractable`. No
  // new mesh, no new box: the existing centre box (half-extent 1.2 in x and z, corner at 1.7 m) already
  // keeps the cat that far clear on every side, so a 2.6 m radius reaches it from any open side. The three
  // log-seat sitters (granny, trapper, marshmallow kid, below and at line 279) sit at the same 1.7 m
  // radius, well inside that reach too, but `game.nearest` always resolves to whichever interactable is
  // physically closer to the cat, so standing by any of them still shows their own greeting, not this one.
  { const fireLines = ['🔥 "Kept going every night since before the gondola had a name."', '🔥 "Whoever\'s shift it is, they never let it go out."', '🔥 "Closest thing to summer, this far up the mountain."'];
    game.addInteractable({ obj: fire, radius: 2.6, label: () => 'Look at the fire', onUse: () => { SFX.click(); game.toast(rnd.pick(fireLines), 3000); } }); }
  // an old-timer on one of the fire's log seats, come in from the cold to warm her hands
  { const a = 2.5, lx = cos(a) * 1.7, lz = sin(a) * 1.7;
    const fireWard = makeWardrobe(r, { shirts: [0x7a4a3a, 0x5a4a6a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const granny = makeHuman({ ...randomPerson(r, { female: true, elder: true, child: false, wardrobe: fireWard, hairStyle: 'bun' }),
      hat: 'beanie', hatColor: 0x8a5acf, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(granny.group);
    game.npcs.push(new Sitter(game, granny, { x: lx, z: lz, ry: atan2(-lx, -lz), seat: 0.3,
      cries: ['Best seat on the mountain, this.', 'Come and warm your paws, puss.', "Cold enough to freeze a yeti's nose, out there."] })); }
  // a trapper takes the fire's last empty log seat, boots stretched toward the flames after checking his lines
  { const a = 0.4, lx = cos(a) * 1.7, lz = sin(a) * 1.7;
    const trapWard = makeWardrobe(r, { shirts: [0x5a4a3a, 0x4a5a4a, 0x6a4a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const trapper = makeHuman({ ...randomPerson(r, { female: false, elder: true, child: false, wardrobe: trapWard, build: 'stout' }),
      hat: 'beanie', hatColor: 0x5a4a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, beard: true }); W.add(trapper.group);
    game.npcs.push(new Sitter(game, trapper, { x: lx, z: lz, ry: atan2(-lx, -lz), seat: 0.3,
      cries: ['Lines were empty again today.', "This fire's worth the whole climb down.", 'Sit close, puss — you\'ll thaw quicker.'] })); }
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
  // someone shovels fresh snow off the first cabin's doorstep, banking it into a little heap beside the step
  { const cx = -11, cz = -6, cry = PI / 2 - 0.3, sx = cx + sin(cry) * 3.6, sz = cz + cos(cry) * 3.6, px = cx + sin(cry) * 2.9, pz = cz + cos(cry) * 2.9;
    const shovelWard = makeWardrobe(r, { shirts: [0x6a4a3a, 0x4a5a6a, 0x5a6a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const shoveler = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: shovelWard }),
      hat: 'beanie', hatColor: 0x6a4a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(shoveler.group);
    const shaft = group(0, 0.02, 0.1, shoveler.hands[0]); shaft.rotation.x = -0.95;
    mesh(G.cyl(0.02, 0.024, 0.85, 6), mat(0x8a5a32, { roughness: 0.9 }), { y: 0.42, parent: shaft });
    const blade = group(0, 0.85, 0, shaft); mesh(G.box(0.26, 0.22, 0.04), mat(0xd0451f, { roughness: 0.6 }), { parent: blade });
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = r.range(0, 0.3);
      mesh(G.sphere(r.range(0.05, 0.09), 6, 5), mat(0xf6f9fc, { roughness: 1 }), { x: px + cos(a) * d, y: 0.04, z: pz + sin(a) * d, shadow: 'none', parent: W }); }
    game.npcs.push(new Washer(game, shoveler, { x: sx, z: sz, ry: atan2(px - sx, pz - sz),
      cries: ["Fresh snow every morning, this time of year.", "Careful, puss — mind where it's packed down.", "Nearly clear. Just this last drift."] })); }
  // a wind chime now hangs from the first cabin's own eave, just above the door — the same makeWindChime()
  // the Neighborhood's porch (round 216) and the treehouse (round 224) already use, recoloured to this
  // cabin's own log wall and an icy pale blue for the tubes. Hung at distance 2.3 along the door's own
  // facing (the shoveler's snow pile above sits just past it, at 2.9) and y=2.35, well clear of the roof's
  // underside at h-0.1=2.7 and above the window light at 2.2 — `makeCabin()`'s own `h` is always the 2.8
  // default (never passed in this loop), so that clearance holds for every cabin built from it
  { const cx = -11, cz = -6, cry = PI / 2 - 0.3, hx = cx + sin(cry) * 2.3, hz = cz + cos(cry) * 2.3;
    placeT(game, U, makeWindChime(game, { wood: 0x8a5a32, metal: 0xcfe0ff }), hx, hz, 0, 2.35); }
  // the Neighborhood, Candy Land, Sunny Shore, Robot City and Whisper Woods all have a toy pinwheel
  // spinning on the world clock by now — Frosty Peak never did, past its own wind chime above. One now
  // stands in the snow beside the second cabin's east wall, blades picked out in red, white and icy
  // blue to match this world's own chime. Same geometry and spin trick as every pinwheel before it
  // (`pivot.rotation.z = t * 3.6`, driven only by the world clock `t`, never this world's own seeded
  // `r`, so it can't shift any later wardrobe pick). A headless probe built the real mountain, travelled
  // to Frosty Peak and swept a grid of candidates against all 623 of its physics boxes and all 61 NPCs:
  // (15, -5) comes back 1.78 m clear of the cabin's own wall box (the nearest box of any kind) and 5.83 m
  // clear of the nearest soul, on flat open snow east of the cabin. Needs only the same slim physics box
  // (half-width 0.14) for its post that every pinwheel before it relies on.
  { const px = 15, pz = -5, y0p = P.ground0(px, pz), stickH = 0.6, bladeLen = 0.22;
    const pin = group(px, y0p, pz, W), stickMat = mat(0x8a5a32, { roughness: 0.9 }), hubMat = mat(0xcfe0ff, { metalness: 0.3, roughness: 0.4 });
    mesh(G.cyl(0.016, 0.02, stickH, 8), stickMat, { y: stickH / 2, parent: pin });
    const pivot = group(0, stickH, 0, pin);
    const bladeColors = [0xd62839, 0xf7f3ec, 0xcfe0ff, 0xf7f3ec];
    for (let bi = 0; bi < 4; bi++) { const theta = bi * PI / 2, bx = cos(theta) * bladeLen / 2, by = sin(theta) * bladeLen / 2;
      mesh(G.box(bladeLen, 0.16, 0.02), mat(bladeColors[bi], { roughness: 0.5 }), { x: bx, y: by, rz: theta, parent: pivot }); }
    mesh(G.sphere(0.035, 8, 6), hubMat, { parent: pivot });
    U.push((dt, t) => { pivot.rotation.z = t * 3.6; });
    P.addBox(px, y0p + 0.3, pz, 0.14, 0.6, 0.14, { cam: false }); }
  let iglooA, iglooB;
  for (const [i, [x, z, ry]] of [[-16, 10, 0.6], [15, -14, -2.2]].entries()) { const ig = makeIgloo(); if (i === 0) iglooA = ig; else iglooB = ig; placeT(game, U, ig, x, z, ry); boxT(game, x, z, 3.4, 1.8, 3.4); }
  // the near igloo's own blue gem lamp has glowed in its tunnel mouth since this world was built, but like the fire
  // and the aurora it never got its own "walk up and look" toast. Same trick again: `iglooA`, the first igloo's own
  // group (captured above instead of discarded by the loop), handed straight to `game.addInteractable` — no new
  // mesh, no new physics box. Its own centre box (half-extent 1.7 m in x and z, from the `boxT` call above) already
  // keeps the cat that far clear on every side, so a 3.0 m radius reaches it from any open side. The kneeler patting
  // snow at this igloo's own tunnel mouth (just below) stands 3.6 m from this centre, just outside that reach, and
  // `game.nearest` always resolves to whichever interactable is physically closer anyway.
  { const iglooLines = ['🏠 "Packed snow walls, and somehow warmer in there than out here."', '🏠 "That blue glow\'s just the gem lamp — nothing to be scared of."', '🏠 "Built fresh most winters. Melts a little more every spring."'];
    game.addInteractable({ obj: iglooA, radius: 3.0, label: () => 'Look at the igloo', onUse: () => { SFX.click(); game.toast(rnd.pick(iglooLines), 3000); } }); }
  // the second igloo, further round the slope, never got its own toast either — `iglooB` is captured the same way.
  // Same 3.0 m radius against the same 1.7 m centre box; the banker kneeling at this igloo's own tunnel mouth sits
  // 3.3 m from centre (see the Kneeler below), just outside reach, same margin the first igloo already relies on.
  { const iglooBLines = ['🏠 "Newer than the first one — still settling into the slope."', '🏠 "Colder side of the mountain, this. Walls are thicker for it."', '🏠 "That one\'s the banker\'s own work — packed it himself."'];
    game.addInteractable({ obj: iglooB, radius: 3.0, label: () => 'Look at the igloo', onUse: () => { SFX.click(); game.toast(rnd.pick(iglooBLines), 3000); } }); }
  makeIcePond(game, 18, 8, 5, r);
  // an ice fisherman on a stool at the pond's edge, rod dipped into a hole cut in the ice, the odd bite
  { const holeY = P.ground0(18, 8) + 0.06;
    mesh(G.cyl(0.55, 0.55, 0.03, 16), mat(0x274050, { roughness: 0.3, transparent: true, opacity: 0.9 }), { x: 18, y: holeY, z: 11.5, shadow: 'none', parent: W });
    const anglerWard = makeWardrobe(r, { shirts: [0x8a6a4a, 0x5a6a4a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const angler = makeHuman({ ...randomPerson(r, { female: false, elder: true, child: false, wardrobe: anglerWard }),
      hat: 'beanie', hatColor: 0x3a4a5a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(angler.group);
    game.npcs.push(new IceFisher(game, angler, makeIceStool(), { x: 18, z: 14.3, ry: PI, holeX: 18, holeZ: 11.5, holeY,
      cries: ['Not a bite in an hour...', "Careful, puss, don't scare them off.", 'Best fishing hole on the mountain, this.'] })); }
  // two friends stand on the pond's far bank, working up the nerve to skate
  { const talkWard = makeWardrobe(r, { shirts: [0x5a6a4a, 0x8a3a3a, 0x3a4a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const skaterA = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: false, wardrobe: talkWard }),
      hat: 'beanie', hatColor: 0x2e9e6e, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(skaterA.group);
    const skaterB = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: talkWard }),
      hat: 'beanie', hatColor: 0x8a5acf, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(skaterB.group);
    game.npcs.push(new Talkers(game, skaterA, skaterB, { x: 23.5, z: 5, ry: PI / 2,
      lines: ["Think it'll hold, out there?", 'The fisherman swears by it.', "I'm not going first.", "One good crack and I'm off home."] })); }
  // a birdwatcher stands on a clear rise east of the pond, binoculars trained on the penguin colony below
  { const birdWard = makeWardrobe(r, { shirts: [0x4a6a5a, 0x5a5a7a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const birder = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: birdWard }),
      hat: 'beanie', hatColor: 0x3a5a4a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(birder.group);
    game.npcs.push(new Birder(game, birder, { x: 30, z: 10, ry: atan2(18 - 30, 8 - 10),
      cries: ["That one's the show-off, always waddling over.", 'Careful, puss — you\'ll spook the whole colony.', 'Counted thirty-one out there today, give or take.'] })); }
  for (const [x, z] of [[-6, -14], [7, 18], [-20, -2], [22, -4]]) { placeT(game, U, makeSnowman(r), x, z, r() * TAU); boxT(game, x, z, 1.0, 2.4, 1.0, { cam: false }); }
  for (const [x, z, ry, c] of [[-8, 6, 0.4, 0xd62839], [4, -9, 2.0, 0x2f6fd6]]) placeT(game, U, makeSled(c), x, z, ry);
  for (const [x, z] of [[-24, 18], [26, 16], [-26, -18], [24, -24], [0, -26], [-2, 28], [30, 0], [-32, 2]]) { const c = makeIceCrystal(r, r.pick([0x9fe8ff, 0xbfa8ff, 0xa8ffe8])); placeT(game, U, c, x, z, 0); boxT(game, x, z, 0.6, 1.6, 0.6, { cam: false }); }
  // an ice sculptor kneels by the outlying crystal cluster, chisel in hand, working the last facet
  { const cx = -24, cz = 18, kx = cx - 1.8, kz = cz - 1.0;
    const sculptWard = makeWardrobe(r, { shirts: [0x5a5a6a, 0x4a5a6a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const sculptor = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: true, wardrobe: sculptWard }),
      hat: 'beanie', hatColor: 0x5a5a6a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(sculptor.group);
    game.npcs.push(new Kneeler(game, sculptor, { x: kx, z: kz, ry: atan2(cx - kx, cz - kz),
      cries: ['One more facet and it catches the light just right.', "Careful, puss — sharp edges, this close.", "Ice this clear doesn't come along every winter."] })); }
  // forest ring + scattered pines
  for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, d = r.range(34, 50), x = cos(a) * d, z = sin(a) * d; if (abs(x) < 7 && z < -26) continue; if (abs(z) < 5 && x < -30) continue; const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  for (const [x, z] of [[-14, -20], [16, 22], [-28, 12], [28, -10], [6, -22], [-10, 24], [30, 26], [-30, -28]]) { const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  makeScatter(game, [[0, 0, 40, 70]], G.sphere(0.35, 7, 5), [0xffffff, 0xeef3fa, 0xdfe8f2], r, [0.6, 1.6], 0.0);   // snow drifts / buried boulders

  // life: penguins, reindeer, kids, the yeti, the squirrel
  for (let i = 0; i < 6; i++) { const rig = makePenguin({ scarf: i === 0 ? 0xd62839 : (i === 3 ? 0x2f6fd6 : null), scale: r.range(0.8, 1.05) }); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: 18 + r.range(-6, 6), z: 8 + r.range(-6, 6), speed: r.range(0.5, 0.8), leash: 9, r: 0.3, height: 0.9, step: 0.25, idle: [1, 3] })); }
  // a bolder penguin peels off from the flock to waddle over and investigate the cat, then hurries back
  { const rig = makePenguin({ scarf: 0xffd54a, scale: 0.95 }); W.add(rig.group);
    game.npcs.push(new Follower(game, rig, { x: 26, z: 2, r: 0.3, height: 0.9, step: 0.25, idle: [1, 3], walk: [2, 4], leash: 6, speed: 0.9, range: 11, keep: 1.8, sfx: () => SFX.squawk() })); }
  for (const [x, z] of [[-22, 6], [-18, -12], [24, 20]]) { const rig = makeDeer(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x, z, speed: 0.6, leash: 8, r: 0.45, height: 1.4, step: 0.3, idle: [3, 7], walk: [2, 5] })); }
  // snow hares, in the gap east of the village between the pine ring and the open snowfield — `Hopper`
  // has done duty for Whisper Woods' frogs since the glade was built but never reused since; a white
  // hare on white snow is the obvious second home for it. A headless probe swept a 16-point ring at the
  // controller's own 2 m leash against every physics box built so far (trees included) and found three
  // spots, each clear the whole way round and at least 3.5 m from one another: (48, 2) and (48, -2),
  // 17-20 m from the nearest other soul, and (45, 0) between them
  for (const [x, z] of [[48, 2], [45, 0], [48, -2]]) { const rig = makeHare(); game.npcs.push(new Hopper(game, rig, { x, z, leash: 1.8, r: 0.15, dist: [0.3, 0.8], dur: 0.3, height: 0.26, idle: [1, 3.5], onHop: () => { if (rnd.chance(0.25)) SFX.chitter(); } })); }
  // an arctic fox roams the open snow south-east of the village, past where the reindeer and ice
  // sculptor's own ground gives out — Whisper Woods and the region fill both already have the ordinary
  // orange `makeFox`, but Frosty Peak never had one of its own; a white coat reads better here than
  // another deer or hare. A headless probe swept a 16-point ring at an 8 m leash (`Wanderer`'s own
  // roaming radius, same as the woods' fox) against every physics box the mountain had built so far:
  // (12, -48) comes back clear by 16.25 m at the centre and never closer than 8.36 m anywhere round the
  // ring — south of the reindeer and the searcher's sweep, well clear of the cave tunnel's flat strip
  // (which only ever runs within 9 m of x=0) and the sled run's corridor further west
  { const rig = makeArcticFox(); W.add(rig.group); game.npcs.push(new Wanderer(game, rig, { x: 12, z: -48, speed: 1.1, leash: 8, r: 0.3, height: 0.7, step: 0.3, idle: [1, 3], walk: [2, 5] })); }
  // a reindeer keeper kneels by the herd's middle spot, checking harness bells before the next run
  { const dx = -18, dz = -12, kx = dx + 2.1, kz = dz + 0.4;
    const keeperWard = makeWardrobe(r, { shirts: [0x5a4a3a, 0x3a5a4a, 0x4a3a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const keeper = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: false, wardrobe: keeperWard }),
      hat: 'beanie', hatColor: 0x6a4a2a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(keeper.group);
    game.npcs.push(new Kneeler(game, keeper, { x: kx, z: kz, ry: atan2(dx - kx, dz - kz),
      cries: ['Bells all present and correct.', "Mind the antlers, puss — they don't mean it.", "Copper's the friendliest of the lot."] })); }
  // a searcher sweeps a detector over the open snow west of the herd, hunting a bell shaken loose off a harness
  { const x = -30, z = -9, tx = -15.9, tz = -11.6;
    const searchWard = makeWardrobe(r, { shirts: [0x4a5a6a, 0x6a4a5a, 0x5a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const searcher = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: searchWard }),
      hat: 'beanie', hatColor: 0x6a4a5a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(searcher.group);
    game.npcs.push(new Detectorist(game, searcher, { x, z, ry: atan2(tx - x, tz - z),
      cries: ["One of Copper's bells came loose out here somewhere.", "Careful, puss, don't step on it first.", "This thing beeps at every buckle-sized rock."] })); }
  // a busker juggles on the open snow between the pond and the painter's easel, hoping passers-by stop and watch
  { const jx = 20, jz = -8, tx = 18, tz = 8;
    const buskWard = makeWardrobe(r, { shirts: [0xd6a339, 0x3a6a8a, 0x8a3a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const busker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: buskWard }),
      hat: 'beanie', hatColor: 0xd6a339, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(busker.group);
    game.npcs.push(new Juggler(game, busker, [0xffffff, 0x9fe8ff, 0xbfa8ff], { x: jx, z: jz, ry: atan2(tx - jx, tz - jz),
      cries: ["Three's easy. Four's where it gets cold.", 'Careful, puss — mind the ice!', "Cold hands make for shakier catches."] })); }
  // the Neighborhood, Candy Land, Sunny Shore and Whisper Woods all have a ukulele player, and Victorian
  // its own fiddler at the clock tower — Frosty Peak had a juggling busker but no actual musician, past
  // the aurora painter and the herd's own bells. One now stands on the open snow west of the gondola
  // station, strumming a frost-pale ukulele for whoever passes. Reuses `makeUkulele` and the same
  // `Charger` + arm-strum tween every other world's ukulele player already relies on verbatim — only
  // the wardrobe and lines are new, same reskin-not-new-code choice every one of these has made since
  // the Neighborhood's own round. A headless probe built the real mountain, travelled to Frosty Peak
  // and swept a grid of candidates against all 624 of its physics boxes, all 61 NPCs (sampled at their
  // built positions) and the patrol loop, sled run and zipline cable (as line segments, not just
  // points, since all three move): (-54, -6) came back 12.45 m clear of the nearest box and 24.19 m
  // clear of the nearest other soul, west of the station path's own keep-out span (which only runs
  // x -44..-6) and a comfortable 4 m inside the radius (58) where snowRegion's own fill takes over —
  // the same margin the swing set and seesaw already bank on.
  { const mx = -54, mz = -6, mry = atan2(0 - mx, 0 - mz);
    const museWard = makeWardrobe(r, { shirts: [0x5a6a8a, 0x8a5a4a, 0x6a4a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const musician = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: museWard }),
      hat: 'beanie', hatColor: 0x8a5a4a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, glasses: r.chance(0.2) });
    W.add(musician.group);
    const uke = makeUkulele(0xd9e8f2);
    uke.position.set(0.03, -0.02, 0.14); uke.rotation.set(-0.25, 0.1, 0.2);
    musician.hands[1].add(uke);
    game.npcs.push(new Charger(game, musician, { x: mx, z: mz, ry: mry,
      cries: ["Fingers go numb by the second verse, every time.", "Careful, puss — that's out of tune, not broken.", "Even the yeti hums along, if the wind's right."] }));
    U.push((dt, t) => { const A = musician.arms[1]; A.el.rotation.x = -1.0 + sin(t * 5.4) * 0.22; A.sh.rotation.z = -0.15; }); }
  // a kite flyer works the open snowfield well east of the village, kite looping high over the peak
  { const kx = 46, kz = 44;
    const kiteWard = makeWardrobe(r, { shirts: [0x2f6fd6, 0xd6a339, 0x5a4a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const flyer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: kiteWard }),
      hat: 'beanie', hatColor: 0x2f6fd6, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(flyer.group);
    game.npcs.push(new KiteFlyer(game, flyer, makeKite(0xff6f3c, 0x9fe8ff), { x: kx, z: kz, wind: [0.5, -0.75],
      cries: ["Mountain wind's the best kind for it.", 'Careful, puss — mind the line!', "Higher than the gondola, today."] })); }
  // kids in beanies: wrapped up in coats, scarves and mittens, no two the same colour
  const snowWard = makeWardrobe(r, { shirts: [0xd62839, 0x2f6fd6, 0x2e9e6e, 0xff8f00, 0x8a5acf, 0x00acc1], pants: [0x1e2a44, 0x3a3a3a, 0x4a3a2a], shoes: [0x2a2018, 0x1e1a18] });
  const beanieBag = bag(r, [0xd62839, 0x2f6fd6, 0xffd54a, 0x2e9e6e, 0xef7d2f]);
  const scarfBag = bag(r, [0xd62839, 0xffd54a, 0x2e9e6e, 0x8a5acf, 0xffffff]);
  const kid = (female) => { const rig = makeHuman({ ...randomPerson(r, { female, child: true, wardrobe: snowWard }),
      hat: 'beanie', hatColor: beanieBag(), coat: true, scarf: scarfBag(), cuffs: r.pick([0xffffff, 0x3a3a3a]), height: r.range(1.2, 1.45) }); W.add(rig.group); return rig; };
  for (let i = 0; i < 2; i++) game.npcs.push(new Wanderer(game, kid(i === 1), { x: 5 + i * 5, z: 6, speed: r.range(0.9, 1.3), leash: 10, height: 1.5 }));
  // two of them are having a snowball fight across the square
  game.npcs.push(new SnowballFight(game, kid(false), kid(true), { cx: -3.5, cz: 6, gap: 5 }));
  // two more chase each other on the open snow east of the village — the park, the dunes and the woods
  // all had a game of tag going; Frosty Peak's kids only ever wandered, threw snowballs or knelt by
  // snowmen. Found with a headless probe sweeping a 6.5 m disk against every physics box and zone:
  // (38, 30) is clear all the way out, with the kite flyer the nearest other soul at 16 m
  { const tagA = kid(false), tagB = kid(true);
    game.npcs.push(new Playmates(game, tagA, tagB, { cx: 38, cz: 30, leash: 5.5 }));
    greetable(game, { rig: tagA }); greetable(game, { rig: tagB }); }
  // two more kids play catch on open snow south-west of the pines — the Neighborhood's lawn, Sunny
  // Shore's sand and Whisper Woods' clearing all already have a `BallGame`, but Frosty Peak's kids
  // only ever wandered, snowballed or knelt by snowmen; nobody was actually throwing anything. A
  // headless probe swept the built world's physics boxes against a grid of candidate centres (the
  // game's 5.5 m throw gap plus 1.2 m side-to-side sway either side) and found (-24, -42) clear —
  // 26 m from the nearest other soul (a wandering villager out in the region fill), ground height
  // varying under 0.1 m across the whole footprint, well clear of both the cave's flat approach
  // strip (which only ever runs within 7 m of x=0) and the zipline/sled-run keep-out zones
  { const cbx = -24, cbz = -42;
    const catchBall = mesh(G.sphere(0.18, 12, 8), mat(0xfff5e6, { roughness: 0.5 }), { parent: W });
    mesh(G.sphere(0.181, 12, 8), mat(0xef7d2f, { roughness: 0.5 }), { sx: 0.5, parent: catchBall });
    mesh(G.sphere(0.181, 12, 8), mat(0x2e9e6e, { roughness: 0.5 }), { sz: 0.5, parent: catchBall });
    catchBall.position.set(cbx, P.ground0(cbx, cbz) + 0.18, cbz);
    const catchA = kid(true), catchB = kid(false);
    game.npcs.push(new BallGame(game, catchA, catchB, catchBall, { cx: cbx, cz: cbz, gap: 5.5 }));
    greetable(game, { rig: catchA }); greetable(game, { rig: catchB }); }
  // a ring of kids dances in a circle on the open snow east of the pond. Every other world with
  // children already had a RingDance (the Neighborhood, Candy Land, Robot City, Victorian, Sunny
  // Shore, Whisper Woods) — Frosty Peak's own round claiming to finish the set (round 156) missed
  // this one; its kids only ever wandered, snowballed, played tag or caught a ball. A headless probe
  // swept a 2.7 m disc (ring radius plus a cat-sized margin) against every physics box and NPC
  // already built into the mountain: (37, -16) comes back clear all the way round and 23 m from the
  // nearest other soul (the painter's easel), well past the village's own 26 m keep-out circle and
  // short of the region fill starting at 58
  { const ringKids = [false, true, false, true].map(kid);
    game.npcs.push(new RingDance(game, ringKids, { cx: 37, cz: -16, r: 1.8, speed: 0.55, turnEvery: 9, cryIcon: '🎵',
      cries: ['Round we go, over the snow!', "Don't let go, or you'll go flying!", 'Faster now, before we freeze!', 'One more time round!'] })); }
  // another kneels by the first snowman, packing on a fresh layer of snow
  { const sx = -6, sz = -14, kx = sx, kz = sz + 1.3;
    game.npcs.push(new Kneeler(game, kid(false), { x: kx, z: kz, ry: atan2(sx - kx, sz - kz),
      cries: ['Nearly got his arms right.', "Don't melt yet, mister snowman.", 'He needs a nose. A carrot would do.'] })); }
  // a second child kneels by the far snowman, pressing a carrot into its face for a nose
  { const sx = 7, sz = 18, kx = sx, kz = sz + 1.3;
    game.npcs.push(new Kneeler(game, kid(true), { x: kx, z: kz, ry: atan2(sx - kx, sz - kz),
      cries: ["Found him a carrot, look!", "Straight in the middle, that's the trick.", "Don't sneeze on it, puss - it took ages to find."] })); }
  // a child kneels outside the near igloo's tunnel mouth, patting fresh snow into a gap before nightfall
  { const ix = -16, iz = 10, iry = 0.6, mx = ix + 2.3 * sin(iry), mz = iz + 2.3 * cos(iry), kx = -14, kz = 13;
    game.npcs.push(new Kneeler(game, kid(true), { x: kx, z: kz, ry: atan2(mx - kx, mz - kz),
      cries: ['Nearly sealed — just this gap left.', 'Keeps the wind out, packed in tight.', "Snug as an igloo, once it's finished."] })); }
  // a grown-up kneels outside the second igloo's tunnel mouth, banking fresh snow up its base against drafts
  { const ix = 15, iz = -14, iry = -2.2, mx = ix + 2.3 * sin(iry), mz = iz + 2.3 * cos(iry), kx = ix + 3.3 * sin(iry), kz = iz + 3.3 * cos(iry);
    const bankWard = makeWardrobe(r, { shirts: [0x5a4a6a, 0x4a5a6a, 0x6a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const banker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bankWard }),
      hat: 'beanie', hatColor: 0x4a5a6a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(banker.group);
    game.npcs.push(new Kneeler(game, banker, { x: kx, z: kz, ry: atan2(mx - kx, mz - kz),
      cries: ['Banked right up, keeps the draft out.', "Mind your paws, puss — packed hard, this.", 'This one holds heat better than the first, I reckon.'] })); }
  // a girl kneels at the edge of the reindeer's patch, leaving carrots on a flat rock
  { const dx = 24, dz = 20, kx = dx - 2.4, kz = dz - 1.0;
    game.npcs.push(new Kneeler(game, kid(true), { x: kx, z: kz, ry: atan2(dx - kx, dz - kz),
      cries: ['Left a few carrots on the rock.', "Copper's not the only one who likes them.", 'They come round eventually, if you wait quiet.'] })); }
  // a kid takes the fire's third log seat, toasting a marshmallow on a stick held out toward the flames
  { const a = 4.4, lx = cos(a) * 1.7, lz = sin(a) * 1.7;
    game.npcs.push(new Sitter(game, kid(r.chance(0.5)), { x: lx, z: lz, ry: atan2(-lx, -lz), seat: 0.3,
      cries: ["Careful, this one's about to catch.", 'Best seat in the village, right here.', "Golden brown, not black — that's the trick."] })); }
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
  // a tracker kneels on the open ground south of the square, studying a line of paw prints heading toward the cave
  { const tx = 6, tz = -20;
    const trackWard = makeWardrobe(r, { shirts: [0x4a5a4a, 0x5a4a3a, 0x3a4a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const tracker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: trackWard }),
      hat: 'beanie', hatColor: 0x3a4a5a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(tracker.group);
    game.npcs.push(new Kneeler(game, tracker, { x: tx, z: tz, ry: atan2(0 - tx, -29 - tz), cryIcon: '🐾',
      cries: ['Prints this big? Has to be the yeti.', "Careful, puss — don't smudge them.", 'Heading straight for the cave, these are.'] })); }
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
  // the Neighborhood, Victorian and Whisper Woods all have a swing set, but Frosty Peak's kids only
  // ever wandered, snowballed, played tag or catch, danced a ring or knelt by a snowman — nowhere to
  // just sit and swing. A headless probe swept a 3 m clearance disc against every physics box and NPC
  // circle built into the mountain so far: (-45, 30) came back clear by nearly 23 m from the nearest
  // other soul (an igloo kneeler out near (-25.8, 17)), on open snow northwest of the village, well
  // short of where snowRegion's own fill takes over at radius 58
  { const sx = -45, sz = 30;
    const swingSet = makeSwingSet({ color: 0x3a5a8a }); place(game, U, swingSet, sx, sz, PI);
    game.zones.add(sx, sz, 3.4, 3.2);
    for (const px of [-1.3, 1.3]) P.addBox(sx + px, 1.4, sz, 0.4, 2.8, 1.3, { cam: false });
    const swingKid = kid(r.chance(0.5));
    const sw = new Swinger(game, swingKid, swingSet, { x: sx, z: sz }); game.npcs.push(sw); greetable(game, sw);
    game.addInteractable({ obj: swingSet, radius: 2.8, label: () => 'Push the swing', onUse: () => { sw.boost = 1; SFX.talk(); game.toast('🎠 "Higher! Higher!"', 1800); } }); }
  // the Neighborhood, Candy Land, Robot City, Victorian and Sunny Shore all paired their swing set with
  // a seesaw — Frosty Peak's own (above) never got one, leaving only Whisper Woods still without. A
  // headless probe swept a 20 s clearance scan, sampling every physics box, NPC circle and wandering
  // rig's own position continuously so nothing mid-leash could slip past unnoticed: (-50, 22) came back
  // clear by over 8 m throughout, downhill and south of the swing set, still well inside the radius (58)
  // where snowRegion's own fill takes over (its own 11 m zone claim keeps the fill out regardless).
  // The slope here isn't flat either, so like Sunny Shore's seesaw this one is ground-following with
  // `placeT`, unlike the swing set's own fixed y a few metres uphill.
  { const sx = -50, sz = 22;
    const seesaw = makeSeesaw({ color: 0xd64550 }); placeT(game, U, seesaw, sx, sz, 0);
    game.zones.add(sx, sz, 2.4, 1.2);
    P.addBox(sx, game.physics.ground0(sx, sz) + 0.35, sz, 2.9, 0.7, 0.6, { cam: false });
    const seeA = kid(false), seeB = kid(true);
    game.npcs.push(new Seesaw(game, seeA, seeB, seesaw, { x: sx, z: sz })); }
  // the Neighborhood's postie, Candy Land's gate guard, Robot City's sentry, Victorian's bobby and
  // Whisper Woods' hiker all walk a beat of their own — every one of Frosty Peak's own people only
  // ever stood, sat, knelt or wandered on a short leash. A ski patroller now checks the trail markers
  // on a rectangular loop over the open snowfield north of the village. A headless probe swept that
  // loop (x -20..10, z 46..54) against every one of the mountain's 804 physics boxes and every NPC's
  // own position, sampled continuously over 25 simulated seconds so nothing mid-leash could slip past
  // unnoticed: it comes back clear the whole way round, never closer than 19 m to another soul, over a
  // gentle 2.6 m hillside the whole length (shallower than the slope the sled run itself uses) and well
  // short of the radius (58) where snowRegion's own fill takes over.
  { const patrolWard = makeWardrobe(r, { shirts: [0xd6453a, 0x3a5a8a, 0x4a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const patroller = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: patrolWard }),
      hat: 'beanie', hatColor: 0xd6453a, coat: true, scarf: 0xf7f3ec, cuffs: 0x3a3a3a, bag: 0x3a3a3a });
    W.add(patroller.group);
    game.npcs.push(new Patroller(game, patroller, { points: [[-20, 46], [10, 46], [10, 54], [-20, 54]], speed: 0.8, pause: [1.5, 3], pauseAll: true, loop: true, cryIcon: '🚩',
      cries: ['Markers all still standing, good.', 'Careful, puss — steeper than it looks, up here.', 'Quietest beat on the mountain, this one.', 'No avalanche today. Or yesterday. Good record, really.'] })); }
  // Frosty Peak's own blurb is "Penguins under the aurora", but nobody had ever stopped to actually look
  // up at it — the painter paints it from her easel, the zipline tower's own "look up" toast (round 283)
  // only ever looked at the tower itself, and the sky it's painted on had no landmark of its own. A small
  // cairn of stacked stones, snow dusted on top, now sits on a quiet rise north-west of the village. A
  // headless probe swept the built world's own physics boxes and every NPC's position continuously over
  // 20 simulated seconds (so the patroller's own rectangle and every wandering reindeer, hare or kid
  // mid-game couldn't slip past unnoticed): (-30, 36) comes back 6.19 m clear of the nearest box (the
  // forest ring's own nearest pine) and never closer than 14.15 m to another soul throughout — well
  // inside the radius (58) where snowRegion's own procedural fill takes over, so it needs no keep-out
  // zone of its own. The stones use fixed rotations rather than a draw from this world's own seeded `r`,
  // so building it can't shift snowRegion's own fill (called later in this function, from the same `r`)
  // by so much as one cluster.
  { const cx = -30, cz = 36, cy = P.ground0(cx, cz);
    const cairn = group(cx, cy, cz, W), stoneM = mat(0x8a929c, { roughness: 0.95, flatShading: true });
    mesh(G.sphere(0.5, 8, 6), stoneM, { y: 0.26, sy: 0.55, ry: 0.4, parent: cairn });
    mesh(G.sphere(0.36, 8, 6), stoneM, { y: 0.58, sy: 0.6, ry: 2.1, parent: cairn });
    mesh(G.sphere(0.22, 7, 5), stoneM, { y: 0.84, sy: 0.65, ry: 4.5, parent: cairn });
    mesh(G.sphere(0.2, 7, 5), mat(0xf6f9fc, { roughness: 1 }), { y: 0.95, sy: 0.4, shadow: 'none', parent: cairn });
    P.addBox(cx, cy + 0.5, cz, 0.9, 1.1, 0.9, { cam: false });
    const auroraLines = ['🌌 "Green and violet, same as every clear night."', '🌌 "The painter swears it never looks the same twice."', '🌌 "Even the yeti\'s own cave doesn\'t get a view like this."'];
    game.addInteractable({ obj: cairn, radius: 3.6, label: () => 'Look up at the aurora', onUse: () => { SFX.click(); game.fx.emit(cx, cy + 2.2, cz, { count: 14, colors: [0x4dffa0, 0x9f6fff, 0xffffff], speed: 1.0, up: 1.8, life: 1.0, gravity: 1.5 }); game.toast(rnd.pick(auroraLines), 3000); } }); }

  game.zones.addSpan(-7, -62, 7, -24); game.zones.addSpan(-44, -5, -6, 5); game.zones.addCircle(0, 0, 26);
  // the zipline: a tower high on the shoulder of the west peak, running down to a post above the village.
  // Standing at the top you look straight down the cable at the snow-capped mountains on the horizon.
  game.zones.addSpan(min(ZIP_TOP[0], ZIP_LANDING[0]) - 4, min(ZIP_TOP[1], ZIP_LANDING[1]) - 4, max(ZIP_TOP[0], ZIP_LANDING[0]) + 4, max(ZIP_TOP[1], ZIP_LANDING[1]) + 4);
  const zipline = makeZipline(game, U, ZIP_TOP[0], ZIP_TOP[1], ZIP_LANDING[0], ZIP_LANDING[1], r);
  // the throne, the fountain, Robot City's statue, the Neighborhood's signpost, the fairy ring, Victorian's
  // clock tower and Sunny Shore's lighthouse have all had a one-off "walk up and look" toast for rounds now
  // — but the zipline's own start tower, the very thing the comment two lines up already promised a view
  // from ("you look straight down the cable at the snow-capped mountains on the horizon"), never actually
  // delivered it. The cat can now stand at its foot and look up. `makeZipline`'s own base box (full size
  // 2.0 x 4.6 x 2.0, so half-extent 1.0 in x and z) keeps the cat from getting closer than 1.0 m to the
  // centre face-on, or 1.4 m on a corner, so a 4.2 m radius is reachable from any side without reaching the
  // cable attendant 3.6 m away at (-75, -72) — same overlap-is-fine case as the lighthouse and its keeper,
  // since `game.nearest` always resolves to whichever interactable centre is actually closest.
  const zipTowerLines = ['🚡 "Forty feet of lumber, and a squirrel\'s the only one brave enough to ride it."', '🚡 "Steepest view on the mountain, and the wind doesn\'t care who\'s looking."', '🚡 "Windsock says it\'s fine. The ladder disagrees."'];
  game.addInteractable({ obj: zipline.tower, radius: 4.2, label: () => 'Look up at the zipline tower', onUse: () => { SFX.click(); game.toast(rnd.pick(zipTowerLines), 3000); } });
  // an attendant waits at the foot of the start tower, high on the mountain shoulder — Whisper Woods'
  // zipline has one checking the cable before every rider, but Frosty Peak's has stood unattended since
  // it was built (a headless probe over the built world found (-75, -72) clear: 35 m up the slope from
  // the tower's own base at (-72, -70), unblocked, and over 20 m from the nearest other soul)
  { const ax = ZIP_TOP[0], az = ZIP_TOP[1], tx = -75, tz = -72;
    const towerWard = makeWardrobe(r, { shirts: [0x3a5a6a, 0x6a4a3a, 0x4a5a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const attendant = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: towerWard }),
      hat: 'beanie', hatColor: 0x2a3a4a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(attendant.group);
    game.npcs.push(new Charger(game, attendant, { x: tx, z: tz, ry: atan2(ax - tx, az - tz), cryIcon: '🪢',
      cries: ["Cable's tight, harness checked - all set.", 'Coldest post on the mountain, this one.', "Only ever the squirrel gets a turn, mind."] })); }
  // the tower attendant checks every rider off at the top, but nobody was down here to catch them: a
  // headless probe over the built world swept the open snowfield south of the landing post and found
  // (-20, -27) clear by 22 m in every direction, 6 m from the landing post itself and well off the
  // lantern path and the pines strung along the cable
  { const lx = -20, lz = -27;
    const catchWard = makeWardrobe(r, { shirts: [0x4a6a3a, 0x8a5a3a, 0x3a5a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const catcher = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: catchWard }),
      hat: 'beanie', hatColor: 0x4a6a3a, coat: true, scarf: 0xf7f3ec, cuffs: 0x3a3a3a }); W.add(catcher.group);
    game.npcs.push(new Charger(game, catcher, { x: lx, z: lz, ry: atan2(ZIP_LANDING[0] - lx, ZIP_LANDING[1] - lz), cryIcon: '🤗',
      cries: ['Feet down, nice and steady - there we go.', "Best seat on the mountain, that cable.", 'One at a time off the line, please!'] })); }
  makeLanternPath(game, ZIP_LANDING[0] + 2, ZIP_LANDING[1] + 2, -10, -8, 5);
  // pines along the zipline, kept to its north-east side so the sled run on the other side stays clear
  for (let i = 0; i < 7; i++) { const k = i / 6, x = lerp(ZIP_TOP[0], ZIP_LANDING[0], k) + r.range(0, 9), z = lerp(ZIP_TOP[1], ZIP_LANDING[1], k) + r.range(-9, 0); const pn = makeSnowPine(r); placeT(game, U, pn, x, z, 0); boxT(game, x, z, 1.2 * pn.scale.x, 5, 1.2 * pn.scale.x, { cam: false }); }
  // the sled run: a child sleds down the flank of the west peak, then trudges back up dragging the sled
  const sledTop = [-68, -44];
  game.npcs.push(new Sledder(game, kid(true), makeSled(0x2f6fd6), { top: sledTop, bottom: [-46, -26] }));
  // the zipline got an attendant checking the cable before every rider, but the sled run's own top of
  // the slope had stood unwatched since it was built; a parent waits there, giving each run a push-off
  // and greeting the sledder back up. Found with a headless probe: 3 m off the slide line itself (clear
  // of the sled's moving circle both ways), 14 m from the nearest other soul, unblocked
  { const wx = sledTop[0] - 1.9, wz = sledTop[1] + 2.3;
    const waitWard = makeWardrobe(r, { shirts: [0x8a5a3a, 0x4a6a5a, 0x5a4a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const watcher = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: waitWard }),
      hat: 'beanie', hatColor: 0x8a5a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(watcher.group);
    game.npcs.push(new Charger(game, watcher, { x: wx, z: wz, ry: atan2(sledTop[0] - wx, sledTop[1] - wz), cryIcon: '🛷',
      cries: ["One more run before the light goes.", 'Careful on the turn, near the pines.', "Best seat's the one going down, not climbing back up."] })); }
  // every other world with a dog (the Neighborhood's walker, Sunny Shore's beach dog) has one, but Frosty
  // Peak never did, for all its sled run — a husky keeps to its own patch of snow at the foot of the slope,
  // pointed ears up, not following the cat (plain `makeQuadruped`, not `makeDog`, for the pointed ears and
  // grey-and-white coat rather than the floppy-eared tan one every other world's dog already wears). A
  // headless probe built the real mountain, sampled every NPC's and the squirrel's own position
  // continuously over 20 simulated seconds (so no wandering reindeer, hare or mid-slide sledder could slip
  // past unnoticed), and swept a grid of the open snow against both those samples and every physics box:
  // (-46, -30) came back clear by 26 m in every direction, 4 m off the sled run's own landing point and
  // well south of the swing set and seesaw further north.
  { const hx = -46, hz = -30;
    const husky = makeQuadruped({ color: 0x9aa0a8, color2: 0xf2f0ea, belly: 0xf2f0ea, tail: 'curl', wag: 5, bodyY: 0.4, length: 0.58, scale: 0.9 });
    placeT(game, U, husky.group, hx, hz, atan2(sledTop[0] - hx, sledTop[1] - hz));
    game.npcs.push(new Wanderer(game, husky, { x: hx, z: hz, speed: 0.6, leash: 3, r: 0.3, height: 0.85, step: 0.25, idle: [2, 5], walk: [1.5, 3] }));
    boxT(game, hx, hz, 0.4, 0.8, 0.6, { cam: false });
    const hid = game.namedFriend('dog');
    game.addInteractable({ obj: husky.group, radius: 2.2, label: () => 'Pet the husky', onUse: () => { game.befriend(hid); SFX.woof(); game.hearts(husky.group.position.x, 0.6, husky.group.position.z, 4); game.toast('🐕‍🦺 *happy tail wag*'); } }); }
  // the Neighborhood, Candy Land, Robot City, Victorian, Sunny Shore and Whisper Woods all pair a
  // stroller with a dog on a lead (`DogWalker`) by now — Frosty Peak's own husky, just above, only ever
  // had its own patch of snow to wander, pointed ears up and never following the cat; nobody here had
  // come for an actual walk either, the last of the seven still without one. `DogWalker`'s own friend key
  // is configurable (`o.key`, defaulting to `'dog'`), so this one claims `'walked-dog'` instead, leaving
  // the husky's own claim on the plain `'dog'` key untouched — the same fix every other world's own
  // walker has relied on since round 333. A headless probe built the real mountain (`game.load(5,
  // 'from-prev')`), sampled every NPC's and the squirrel's own position every quarter second over 30
  // simulated seconds (so no wandering reindeer, hare, arctic fox, penguin or mid-game kid could slip
  // past unnoticed), then swept a grid of the open snowfield (radius 27-46, clear of the village's own
  // keep-out circle and well short of the radius (58) where snowRegion's own fill takes over) against
  // both those samples and every one of the mountain's physics boxes: (21, 31) came back clear by 8.7 m
  // of the nearest box (a pine trunk out in the forest ring) and 8.1 m of the nearest other soul (the
  // pinecone gatherer, stationary at (14, 27)), at radius 37.4 from the origin, with ground height
  // varying only 0.55 m across a 3 m radius around it.
  { const dwx = 21, dwz = 31, dwry = atan2(0 - dwx, 0 - dwz);
    const walkerWard = makeWardrobe(r, { shirts: [0x8a5a4a, 0x4a6a5a, 0x5a4a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const walker = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: walkerWard }),
      hat: 'beanie', hatColor: 0x6a5a4a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(walker.group);
    const walkedDog = makeDog(0xa67a4a);
    game.npcs.push(new DogWalker(game, walker, walkedDog, { x: dwx, z: dwz, angle: dwry, speed: 0.8, leash: 4, key: 'walked-dog',
      cries: ["Doesn't feel the cold at all, this one.", 'Careful, puss — mind your tail, she only wants a sniff.', "Same loop every morning, round past the pines."] })); }
  // the Neighborhood, Robot City, Candy Land, Victorian and Whisper Woods all have a kid working a
  // yo-yo by now, but Frosty Peak — for all its swing set, seesaw, snowball fight, tag, catch and ring
  // dance — never had one. A child now works a yo-yo on the open snowfield south-east of the village,
  // well clear of the busker, the painter and the catch-ball game. `YoYoer` needs no held prop beyond
  // what it builds itself — the disc and string hang straight off `rig.hands[1]` — so this is a
  // placement, not a build, reusing the same `kid()` wardrobe helper every other child in this file
  // already draws from. A headless probe built the real mountain, sampled every NPC's and the
  // squirrel's own position every quarter second over 30 simulated seconds (so no wandering reindeer,
  // hare or mid-game kid could slip past unnoticed), then swept a grid of candidates (radius < 53,
  // short of the radius (58) where snowRegion's own fill takes over) against both those samples and
  // every one of the mountain's physics boxes: (29, -43) came back clear by 7.2 m of the nearest box
  // and 17.7 m of the nearest other soul (the arctic fox, mid-wander).
  { const yx = 29, yz = -43;
    game.npcs.push(new YoYoer(game, kid(r.chance(0.5)), 0xffd54a, { x: yx, z: yz, ry: atan2(0 - yx, 0 - yz),
      cries: ["Forty drops, and my fingers still work!", 'Careful — it swings wider than it looks, out here.', "Nearly a loop-the-loop, that time."] })); }
  // every other world now has a jump-rope kid — the Neighborhood, Candy Land, Victorian, Sunny Shore,
  // Whisper Woods and Robot City all got one over the last several rounds — Frosty Peak, for all its
  // swing set, seesaw, snowball fight, tag, catch, ring dance and yo-yo, was the one world left without.
  // A child now skips rope on the open snowfield west of the swing-and-seesaw cluster. `JumpRoper` needs
  // no held prop beyond the loose grip at each hand it builds itself, so this is a placement, not a
  // build, reusing the same `kid()` wardrobe helper every other child in this file already draws from.
  // A headless probe built the real mountain (`game.load(5, 'from-prev')`), sampled every NPC's own
  // position every quarter second over 25 simulated seconds (so no wandering reindeer, hare, arctic fox
  // or mid-game kid could slip past unnoticed), then swept a 2 m grid of the open snow (radius < 50,
  // short of the radius (58) where snowRegion's own fill takes over) against both those samples and
  // every one of the mountain's physics boxes: (-48, 14) came back clear by 6.7 m of the nearest box
  // (the seesaw's own post) and 20.9 m of the nearest other soul, with the ground varying under 0.16 m
  // across the whole footprint.
  { const jx = -48, jz = 14;
    game.npcs.push(new JumpRoper(game, kid(r.chance(0.5)), 0xff6fb5, { x: jx, z: jz, ry: atan2(0 - jx, 0 - jz),
      cries: ["Two hundred and not a single trip!", 'Careful, puss — it swings wider than it looks.', "Warms you up faster than the fire does."] })); }
  // every other world has a hula hooper by now — the Neighborhood, Sunny Shore, Whisper Woods, Candy
  // Land, Robot City and Victorian all got one over the last several rounds — Frosty Peak was the last
  // world left without, completing the set across all seven. A child now works a hula hoop on the open
  // snowfield north of the ice pond, well past the birdwatcher's rise. `HulaHooper` needs no held prop
  // beyond the one ring it builds itself, parented to the body at waist height, so this is a placement,
  // not a build, reusing the same `kid()` wardrobe helper every other child in this file already draws
  // from. A headless probe built the real mountain (`game.load(5, 'from-prev')`), sampled every NPC's
  // own position every quarter second over 25 simulated seconds (so no wandering reindeer, hare, arctic
  // fox or mid-game kid could slip past unnoticed), then swept a 2 m grid of the open snow (radius < 54,
  // short of the radius (58) where snowRegion's own fill takes over) against both those samples and
  // every one of the mountain's physics boxes: (12, 52) came back clear by 11.5 m of the nearest box and
  // 20.6 m of the nearest other soul, at radius 53.4 from the origin.
  { const hx = 12, hz = 52;
    game.npcs.push(new HulaHooper(game, kid(r.chance(0.5)), 0xffd54a, { x: hx, z: hz, ry: atan2(0 - hx, 0 - hz),
      cries: ["Sixty spins and not a shiver!", 'Careful, puss — the ring swings wider than it looks.', "Keeps you warmer than the fire does, honest."] })); }
  // the Neighborhood, Candy Land, Robot City and Victorian all have a kid kneeling by a wobbly scooter
  // (`makeScooter()` + `Kneeler`), and Sunny Shore got its own turn too — Frosty Peak and Whisper Woods are
  // the only two worlds left without one. A boy now kneels on the open snowfield south of the tracker,
  // tightening his scooter's back wheel before trying it again on the packed snow. Same pairing every other
  // world's own scooter kid already uses, no new controller, built with the terrain-aware `placeT`/`boxT`
  // helpers (like Sunny Shore's) rather than the flat-floor `place()` + `P.addBox()` the first four reach
  // for, since the snowfield slopes gently underfoot here too — `kid()`'s own coat and beanie suit the cold
  // better than the other worlds' bare-headed scooter kids anyway. A headless probe built the real mountain
  // (`game.load(5, 'from-prev')`), sampled every NPC's and the squirrel's own position every quarter second
  // over 30 simulated seconds (so no wandering reindeer, hare, arctic fox, penguin or mid-game kid could
  // slip past unnoticed), then swept a 1 m grid of the open snow (radius 26-52, clear of the village's own
  // keep-out circle and short of the radius (58) where snowRegion's own fill takes over) against both those
  // samples and every one of the mountain's physics boxes: (13, -33) came back clear by 7.05 m of the
  // nearest box and 14.76 m of the nearest other soul (the tracker, kneeling at (6, -20)), with ground
  // height varying only 0.11 m within a metre of it.
  { const sx = 13, sz = -33, kx = 13.9, kz = -33, ry = atan2(sx - kx, sz - kz);
    const scooter = makeScooter(0xd6453a); placeT(game, U, scooter, sx, sz, 0.4);
    boxT(game, sx, sz, 0.3, 0.8, 0.6, { cam: false });
    game.npcs.push(new Kneeler(game, kid(r.chance(0.5)), { x: kx, z: kz, ry,
      cries: ['Wobbly bolt again - nearly got it.', "Careful, puss — mind your tail, this spins.", 'Good as new. Straight down the slope, no hands.'] })); }
  // the Neighborhood, Robot City, Victorian, Candy Land and Sunny Shore all have a kid chalking a row
  // of hopscotch squares by now (`Kneeler` + six colour-coded `G.plane` decals) — Frosty Peak and
  // Whisper Woods are the only two worlds left without one. A child now kneels on the open snowfield
  // north-west of the swing-and-seesaw cluster, drawing six squares straight onto the packed snow.
  // Reuses the same `kid()` wardrobe helper every other child in this file already draws from, rather
  // than the bare-headed chalker the paved worlds build fresh, since every kid here already wears a
  // coat and beanie against the cold. Like Sunny Shore's own version, each decal square asks
  // `P.ground0()` for its own height instead of sharing one flat `y`, since the snowfield slopes gently
  // underfoot here too — `Kneeler` already asks `ground0()` for its own rig regardless of world, so
  // that part needed no change. A headless probe built the real mountain (`game.load(5, 'from-hub')`),
  // sampled every NPC's and the squirrel's own position every quarter second over 30 simulated seconds
  // (so no wandering reindeer, hare, arctic fox or mid-game kid could slip past unnoticed), then swept a
  // 2 m grid of the open snow (radius 28-53, short of the radius (58) where snowRegion's own fill takes
  // over) against both those samples and every one of the mountain's physics boxes: the six-square run
  // from (-34, 40) to (-31.1, 40) came back clear by 7.94-9.09 m of the nearest box and 12.62-16.06 m of
  // the nearest other soul, with ground height varying only 0.07 m across the whole footprint.
  { const gz = 40, kx = -34.9, kz = 40, squares = [];
    const squareColors = [0xffb3c6, 0xbde0fe, 0xfff3b0, 0xb9fbc0, 0xcdb4db, 0xffc8dd];
    for (let i = 0; i < 6; i++) { const gx = -34 + i * 0.58; squares.push([gx, gz]);
      mesh(G.plane(0.48, 0.48), mat(squareColors[i], { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: gx, y: P.ground0(gx, gz) + 0.018, z: gz, rx: -PI / 2, shadow: 'none', parent: W }); }
    const chalker = kid(r.chance(0.5));
    const chalk = group(0, 0.02, 0.09, chalker.hands[0]); chalk.rotation.x = -0.5;
    mesh(G.cyl(0.014, 0.014, 0.09, 6), mat(0xf7f3ec, { roughness: 0.9 }), { y: 0.045, parent: chalk });
    game.npcs.push(new Kneeler(game, chalker, { x: kx, z: kz, ry: atan2(squares[0][0] - kx, squares[0][1] - kz),
      cries: ['Six squares, drawn before the next snowfall covers them.', 'Careful, puss — mind the chalk lines!', "Doesn't last long up here, but worth it anyway."] })); }
  // the birdwatcher up by the ice pond has her binoculars trained on the penguin colony, same as every round
  // before this one — Candy Land, Sunny Shore and Whisper Woods all got an actual flock wheeling overhead
  // (butterflies, gulls, fairies), but Frosty Peak's own sky, for all its aurora, never had a single real
  // bird in it. A small flock of snow buntings now wheels high over the village, winter-white with dark
  // wingtips and tail. Reuses the Flyer controller exactly as those other flocks do: it never touches the
  // ground or the physics grid, so (like the Candy Land butterflies) this needed no headless clearance
  // probe. Centred on the village square and high enough to clear the cabins and the zipline towers.
  for (let i = 0; i < 6; i++) { const rig = makeSnowBird({ phase: i * 1.1 }); game.npcs.push(new Flyer(game, rig, { cx: 0, cz: 6, r: r.range(16, 30), h: r.range(14, 22), speed: r.range(1.6, 2.4), bob: 0.5, wobble: 1.4, cw: i % 2 === 0, phase: i * 1.1 })); }
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
