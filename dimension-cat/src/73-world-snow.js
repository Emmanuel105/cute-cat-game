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
  const cabinSpecs = [[-11, -6, PI / 2 - 0.3, 0x8a5a32, 0x4a3a30], [11, -5, -PI / 2 + 0.2, 0x7a4a28, 0x3a4a5a], [-4, 12, PI + 0.2, 0x9a6a3a, 0x4a3a30], [9, 11, PI - 0.4, 0x6a4a2a, 0x5a3a30]];
  for (let ci = 0; ci < cabinSpecs.length; ci++) {
    const [x, z, ry, wall, roof] = cabinSpecs[ci];
    const c = makeCabin({ wall, roof, w: r.range(4.5, 5.5), d: r.range(4, 5) }, r); placeT(game, U, c, x, z, ry); const [w, h, d] = c.userData.size; boxT(game, x, z, max(w, d) * 0.85, h, max(w, d) * 0.85);
    const ch = c.userData.chimney, y0 = P.ground0(x, z);
    U.push((dt) => { if (rnd.chance(dt * 3)) game.fx.emit(x + ch[0] * cos(ry) + ch[2] * sin(ry), y0 + ch[1], z - ch[0] * sin(ry) + ch[2] * cos(ry), { count: 1, color: 0xcfd6e0, speed: 0.15, up: 0.8, life: 3.5, gravity: -0.1, spread: 0.2 }); });
    if (ci === 3) {
      // the Neighborhood's porch, Victorian's terrace and Candy Land's gingerbread cottage all have a
      // napping stray cat tucked into a window by now — every cabin here still stood empty behind its
      // own glass. The fourth cabin (the one furthest from the fire, with no woodcutter or shoveler of
      // its own already crowding its walls) gets one curled up in its own west window. `makeCabin()`'s
      // two front windows sit at local x=±w*0.3, y=1.5, z=d/2+0.05 (0.9x0.9 glass, 0.12 deep, so its
      // outer face is d/2+0.11); `c.userData.size` already hands back [w+0.4, h+1.8, d+0.4] (this
      // loop's own box-padding above), so the original w/d this cabin was actually built with — random
      // per cabin via `r.range` — is recovered as size[0]-0.4 and size[2]-0.4. Same trick as the other
      // three napping cats: added as a child of this cabin's own group (`c`, never baked — only the
      // procedural outer country ever runs `bakeDeep()`) in local coordinates, so it inherits the
      // cabin's world position and rotation for free. y=1.2 sits it low in the window (whose glass
      // spans y 1.05-1.95), z=d0/2+0.3 puts it the same 0.19 m past the glass's own outer face the
      // other three napping cats all sit at relative to their own windows. No physics box: well past
      // the glass, nothing on the snow below can ever reach it, same reasoning as the other three.
      const w0 = w - 0.4, d0 = d - 0.4;
      const napCat = makeNapCat();
      napCat.group.position.set(-w0 * 0.3, 1.2, d0 / 2 + 0.3);
      napCat.group.rotation.y = 0.2;
      c.add(napCat.group);
      let napT = 5; U.push((dt) => { napT += dt; napCat.animate(0, false, dt, napT); });
    }
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
  const iceCrystals = [];
  for (const [x, z] of [[-24, 18], [26, 16], [-26, -18], [24, -24], [0, -26], [-2, 28], [30, 0], [-32, 2]]) { const c = makeIceCrystal(r, r.pick([0x9fe8ff, 0xbfa8ff, 0xa8ffe8])); placeT(game, U, c, x, z, 0); boxT(game, x, z, 0.6, 1.6, 0.6, { cam: false }); iceCrystals.push(c); }
  // every outlying crystal but one has gone untouched since the cluster was first scattered — only the
  // one by the sculptor ever got a reason to stop (his own kneel-and-chisel prompt). The one furthest
  // out on its own, at (-2, 28), gets a plain "look" toast of its own: `iceCrystals[5]`, the group the
  // loop above already built, straight into `game.addInteractable` — no new mesh, no new box. A
  // headless probe (`game.load(5, 'from-hub')`, 400 simulated frames) swept this point against every
  // other physics box and NPC position in the world: the nearest other box stayed 7.0 m clear and the
  // nearest soul 8.9 m clear, both well past the 2.4 m radius used here (the crystal's own box is only
  // 0.42 m across at the corner).
  { const crystalLines = ['❄️ "Catches the light from every side at once — nobody\'s worked out why."', '🧊 "Cold enough to sting a paw. The cat keeps its distance."', '✨ "Clear as glass, and twice as sharp at the edges."'];
    game.addInteractable({ obj: iceCrystals[5], radius: 2.4, label: () => 'Look at the ice crystal', onUse: () => { SFX.click(); game.toast(rnd.pick(crystalLines), 3000); } }); }
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
  // a snowy owl perches on the pine already standing at (30, 26) — one of the hand-placed ring trees
  // above — the exact same perched-and-blinking rig Whisper Woods' three owls use (`makeOwl()` in
  // 56-npcs-wild.js, which now takes an optional colour override), just recoloured white and pale grey
  // instead of tawny brown. No new tree, no new physics box: the pine's own trunk collision (placed a
  // few lines up) already covers the ground below it, and the owl sits 6.6 m up, same height and same
  // branch-offset trick the forest build already uses, so nothing at ground level needs checking twice.
  { const ox = 30, oz = 26, oy = P.ground0(ox, oz) + 6.6;
    const owl = makeOwl({ body: 0xf4f5f8, face: 0xe3e8f0 }); owl.group.position.set(ox + 1.8, oy, oz); owl.group.rotation.y = atan2(-ox, -oz); W.add(owl.group);
    mesh(G.cyl(0.08, 0.1, 1.6, 6), mat(0x4a3323), { x: ox + 1.2, y: oy - 0.05, z: oz, rz: PI / 2, parent: W });
    let ot = r() * 10; U.push((dt) => { ot += dt; owl.animate(0, false, dt, ot); });
    let hootT = 7; U.push((dt) => { hootT -= dt; if (hootT <= 0) { SFX.hoot(); hootT = rnd.range(9, 17); } });
    const oid = game.namedFriend('snowyOwl');
    game.addInteractable({ obj: owl.group, radius: 3.4, label: () => 'Say hello to the owl', onUse: () => { game.befriend(oid); SFX.hoot(); game.hearts(owl.group.position.x, owl.group.position.y - 0.4, owl.group.position.z, 3); game.toast('🦉 "Who? ...Still just you. Still cold."'); } }); }
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
  // the clock tower, the fountain, the carriage and plenty more have all had a "walk up and look" toast
  // for rounds now, but the one landmark Frosty Peak is actually built around — the cave mouth the
  // tracker's own paw prints lead straight to — never got one of its own, past the yeti's befriend
  // trigger 6 m further in. `makeCave`'s own rock-arch mesh over the entrance (previously built and
  // discarded) now comes back as `mouthArch`, handed straight to `game.addInteractable`: no new mesh,
  // no new physics box. A headless probe (the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.load(5, 'from-hub')`) swept the arch's own world position — (0,
  // 1.2, -28.6) — against every one of the mountain's physics boxes and every NPC's own position: the
  // nearest body-level box (not the overhead ceiling, which the walk test already ignores) stayed 2.3
  // m clear and the nearest soul (the tracker, reading the prints that lead here) stayed 9.8 m off, so
  // the open approach up the centre of the snowfield from the south reaches the full 4.2 m radius
  // without the cat ever needing to round a corner — well short of the yeti's own 6 m "RAAAWR" trigger
  // further inside.
  const caveLines = ['🏔️ Cold air rolling straight out of the dark. Something in there is breathing an awful lot of it.', '💎 Even from out here the walls are glowing — someone in there has been busy with the gemstones.', '🐾 The tracks really do go straight in. The cat has decided that is a problem for its paws to solve later.'];
  game.addInteractable({ obj: cave.mouthArch, radius: 4.2, label: () => 'Look into the cave', onUse: () => { SFX.click(); game.toast(rnd.pick(caveLines), 3000); } });
  for (const [x, z] of [[-9, -24], [9, -25]]) { const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  const yeti = makeYeti(); W.add(yeti.group); game.npcs.push(new Wanderer(game, yeti, { x: cave.den[0], z: cave.den[1] + 0.5, speed: 0.4, leash: 2.2, r: 0.9, height: 3, step: 0.4, idle: [2, 5], walk: [1, 3] }));
  makeGemCluster(game, U, 18, 3.5, 5, [0x9fe8ff, 0xbfa8ff, 0xa8ffe8], r, 1.2);
  let yetiHi = false; U.push(() => { const c = game.cat.group.position, near = dist2(c.x, c.z, yeti.group.position.x, yeti.group.position.z) < 36; if (near && !yetiHi) { yetiHi = true; SFX.roar(); game.toast('🦍 "RAAAWR… oh! Hello, tiny cat. Cold, isn\'t it?"'); } if (!near) yetiHi = false; });
  { const yid = game.namedFriend('yeti'); game.addInteractable({ obj: yeti.group, radius: 3.4, label: () => 'Say hi to the yeti', onUse: () => { game.befriend(yid); SFX.roar(); game.hearts(yeti.group.position.x, 2.2, yeti.group.position.z, 3); game.toast('🦍 "Warm fur! Best friends now."'); } }); }
  // Robot City's archive-bot, Victorian's night watchman, Candy Land's jack-in-the-box, Sunny Shore's
  // treasure chest and Whisper Woods' flower all react to the cat on their own, no `E` needed — Frosty
  // Peak was the only world left without one. A small snow mound now sits over its own burrow far out on
  // the eastern snowfield, with a dark hole in the snow beside it; the cat wandering within 6 m is enough
  // to coax a baby yeti up out of the ground to blink awake and peer around, before it sinks back under
  // once the cat wanders off. A build, not a controller: the cub (`makeYeti()`, already in the file for
  // the cave's own grown yeti, scaled to a third its size) sits on a hidden node whose own y rises from
  // well below this world's own flat terrain (fully hidden behind the opaque ground, the same trick the
  // treasure chest's hoard and the flower's fairy already rely on to stay out of sight when "closed") up
  // to standing height, driven by `damp()` off the cat's own distance — no lid or petals to hinge, since
  // snow has neither. No new SFX: the emerge reuses `SFX.chitter()`, already heard from the snow hares.
  // A headless probe built the real mountain (`game.travel(5, 'from-hub')`), sampled every NPC's and the
  // squirrel's own position every quarter second over 25 simulated seconds (so no wandering reindeer,
  // hare, arctic fox or mid-game kid could slip past unnoticed), then swept a grid of the open snowfield
  // (radius 20-55, short of the radius (58) where snowRegion's own fill takes over) against both those
  // samples and every one of the mountain's 683 physics boxes: (48, -24) came back clear by 12.09 m of
  // the nearest box and 19.21 m of the nearest other soul, with the ground flat (y=0) across the whole
  // footprint.
  { const bx = 48, bz = -24, by0 = P.ground0(bx, bz);
    const mound = group(bx, by0, bz, W);
    const snowM = mat(0xf6f9fc, { roughness: 1 });
    mesh(G.sphere(1.0, 10, 7), snowM, { y: 0.3, sy: 0.45, shadow: 'none', parent: mound });
    mesh(G.sphere(0.7, 9, 6), snowM, { x: 0.5, z: 0.4, y: 0.18, sy: 0.4, shadow: 'none', parent: mound });
    mesh(G.cyl(0.45, 0.45, 0.04, 14), mat(0x2a3a4a, { roughness: 0.6, transparent: true, opacity: 0.85 }), { y: 0.03, z: 0.85, shadow: 'none', parent: mound });   // the burrow mouth
    boxT(game, bx, bz, 1.6, 0.9, 1.6, { cam: false });
    const cub = makeYeti(); cub.group.scale.setScalar(0.34);
    const pit = group(0, -1.1, 0.85, mound); pit.add(cub.group);
    let cubOut = 0, cubNear = false;
    const cubLines = ['🦍 "A second yeti? Shh — don\'t tell the tracker."', '🦍 "Squeak, not roar — give it a few winters yet."', '🦍 "Burrows deeper than the grown one\'s own cave, this little one."'];
    mound.userData.update = (dt, t) => {
      const c = game.cat.group.position, near = dist2(c.x, c.z, bx, bz) < 36;
      cubOut = damp(cubOut, near ? 1 : 0, 5, dt);
      pit.position.y = lerp(-1.1, 0, cubOut);
      cub.animate(0, false, dt, t);
      if (near && !cubNear) { cubNear = true; SFX.chitter(); game.toast(rnd.pick(cubLines)); game.fx.emit(bx, by0 + 0.5, bz + 0.85, { count: 10, colors: [0xffffff, 0xdfe8f2], speed: 0.8, up: 1.0, life: 0.8, gravity: 1.0 }); }
      if (!near) cubNear = false;
    };
    U.push(mound.userData.update); }
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
  // every other world with children already has somewhere to just lie down — the Neighborhood's radio
  // listener, Candy Land's sunbather, Sunny Shore's three towel people — but every kid at Frosty Peak
  // only ever wandered, snowballed, played tag or catch, danced a ring or knelt by something. A girl now
  // lies flat on her back in a patch of untouched powder between the swing set and the cairn, having just
  // finished a snow angel, catching flakes on her tongue with her beanie knocked off beside her.
  // No new controller: the exact same `Sunbather` class (`55-npcs.js`) the radio listener, Candy Land's
  // sunbather and Sunny Shore's three towel people already use, unchanged — lying flat, hands behind the
  // head, same relaxed pose, just a snowsuit instead of a swimsuit and a beanie dropped in the snow
  // instead of sunglasses on a towel.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, driven by hand through
  // `game.travel(5, 'from-hub')` then `game.start('new')` so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering kid actually moved) sampled every NPC's own position every quarter second over 300
  // simulated seconds, then swept a 2 m grid of the open snowfield (radius 20-54, short of the radius 58
  // where snowRegion's own fill takes over, and clear of the zipline/sled-run keep-out strip) against both
  // those samples and every one of the mountain's 805 physics boxes: (-32, 24) came back clear by 7.6 m of
  // the nearest box and 7.5 m of the nearest other soul.
  { const ax = -32, az = 24, ary = atan2(-ax, -az);
    const angelWard = makeWardrobe(r, { shirts: [0x8a5acf, 0x2e9e6e, 0xd62839], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const angelKid = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, wardrobe: angelWard }),
      hat: null, coat: true, scarf: scarfBag(), cuffs: r.pick([0xffffff, 0x3a3a3a]), bag: null, backpack: null, height: r.range(1.2, 1.45) });
    W.add(angelKid.group);
    const bhx = ax + cos(ary) * 0.55, bhz = az - sin(ary) * 0.55, bhy = P.ground0(bhx, bhz);
    const beanieM = mat(0xef7d2f, { roughness: 0.85 });
    mesh(G.sphere(0.11, 8, 6), beanieM, { x: bhx, y: bhy + 0.06, z: bhz, sy: 0.6, shadow: 'none', parent: W });
    mesh(G.sphere(0.03, 6, 5), beanieM, { x: bhx, y: bhy + 0.14, z: bhz, shadow: 'none', parent: W });
    game.npcs.push(new Sunbather(game, angelKid, { x: ax, z: az, ry: ary,
      cries: ['Perfect wings, this one.', "Careful, puss — don't step in the middle, you'll ruin it.", "Snow angel number six today. Mum says I'll catch a chill."] })); }

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
  // Robot City, the Neighborhood, Victorian, Candy Land and Sunny Shore all have a marbles ring by now —
  // the oldest pavement game of all — but Frosty Peak was the only world left without one. A child now
  // kneels on the open snowfield east of the village, flicking marbles at a ring chalked straight onto the
  // packed snow. Same `Kneeler` pairing as the other five, no new controller, reusing the same `kid()`
  // wardrobe helper every other child in this file already draws from, and the terrain-aware `P.ground0()`
  // lookup (like Sunny Shore's version) for every mesh here since the snowfield slopes gently underfoot.
  // A headless probe built the real mountain (`game.travel(5, 'from-hub')`), stepped the real game loop
  // for 30 simulated seconds (so no wandering reindeer, hare, arctic fox or mid-game kid could slip past
  // unnoticed) sampling every NPC's and the squirrel's own position every quarter second, then swept a 2 m
  // grid of the open snow (radius 12-53, clear of the village's own keep-out circle and short of the
  // radius (58) where snowRegion's own fill takes over) against both those samples and every one of the
  // mountain's 683 physics boxes: (44.5, 24) came back clear by 10.3 m of the nearest box and 10.3 m of
  // the nearest other soul, at radius 50.6 from the origin, with ground height varying only 0.09 m across
  // the whole footprint.
  { const mcx = 44.5, mcz = 24, mkx = mcx - 0.9, mkz = mcz, mry = atan2(mcx - mkx, mcz - mkz);
    mesh(G.torus(0.5, 0.025, 6, 24), mat(0xf7f3ec, { roughness: 0.95, transparent: true, opacity: 0.85 }), { x: mcx, y: P.ground0(mcx, mcz) + 0.02, z: mcz, rx: -PI / 2, shadow: 'none', parent: W });
    const marbleColors = [0xff6fb5, 0x7fe0ff, 0xffd54a, 0xb9fbc0, 0x8a5acf];
    const marblePos = [[-0.22, 0.12], [0.18, -0.16], [0.02, 0.26], [-0.3, -0.1], [0.3, 0.05]];
    for (let i = 0; i < marblePos.length; i++) { const px = mcx + marblePos[i][0], pz = mcz + marblePos[i][1]; mesh(G.sphere(0.035, 8, 6), mat(marbleColors[i], { roughness: 0.2 }), { x: px, y: P.ground0(px, pz) + 0.035, z: pz, shadow: 'none', parent: W }); }
    mesh(G.sphere(0.035, 8, 6), mat(0xffd54a, { roughness: 0.2 }), { x: mkx + 0.35, y: P.ground0(mkx + 0.35, mkz) + 0.035, z: mkz, shadow: 'none', parent: W });   // the shooter, paused mid-flick just outside the ring
    const marbleKid = kid(r.chance(0.5));
    game.npcs.push(new Kneeler(game, marbleKid, { x: mkx, z: mkz, ry: mry,
      cries: ["Watch close — I never miss.", "Careful, puss — don't swallow one of these.", "Won every single one, fair and square."] })); }
  // the birdwatcher up by the ice pond has her binoculars trained on the penguin colony, same as every round
  // before this one — Candy Land, Sunny Shore and Whisper Woods all got an actual flock wheeling overhead
  // (butterflies, gulls, fairies), but Frosty Peak's own sky, for all its aurora, never had a single real
  // bird in it. A small flock of snow buntings now wheels high over the village, winter-white with dark
  // wingtips and tail. Reuses the Flyer controller exactly as those other flocks do: it never touches the
  // ground or the physics grid, so (like the Candy Land butterflies) this needed no headless clearance
  // probe. Centred on the village square and high enough to clear the cabins and the zipline towers.
  for (let i = 0; i < 6; i++) { const rig = makeSnowBird({ phase: i * 1.1 }); game.npcs.push(new Flyer(game, rig, { cx: 0, cz: 6, r: r.range(16, 30), h: r.range(14, 22), speed: r.range(1.6, 2.4), bob: 0.5, wobble: 1.4, cw: i % 2 === 0, phase: i * 1.1 })); }
  // the Neighborhood's got its signpost, Candy Land its wishing well, Robot City a statue and now a
  // vending machine, Victorian a postbox and a clock tower, Sunny Shore a lighthouse — every other world
  // has at least one thing somebody clearly made on purpose, standing still, just to be looked at. Frosty
  // Peak never did: everything here either moves (the yeti, the herd) or was always going to be here (the
  // mountain itself). A block of carved ice now stands alone on the open snowfield east of the square —
  // a sitting cat, ears, curled tail and all, chiselled by someone nobody in the village will admit to
  // being. The ice itself is a transparent `pbr` material, which `bakeDeep()` already skips outright (the
  // same free pass glass and anything glowing gets), so it costs nothing to leave unbaked; the point
  // light's glint runs on the world clock `t` alone, same as the vending machine's screen, never this
  // world's own seeded `r`, so it can't shift any later wardrobe or layout pick in this build.
  // A headless probe built the real mountain (`game.travel(5, 'from-hub')`), ran the game loop for 150
  // simulated seconds (long enough for the reindeer herd, the searcher, the tracker, the kite flyer and
  // every other wanderer to show their whole patrol, not just whatever a short snapshot happened to
  // catch), sampling every NPC's own position every quarter second, then swept the open snowfield
  // (radius 20-53, short of the radius (58) where snowRegion's own fill takes over) against both that
  // trace and all of the mountain's physics boxes: (50, -14) came back clear by 7.77 m of the nearest box
  // and 10.48 m of the nearest other soul — east of the village, well clear of the marbles ring at
  // (44.5, 24) and the kite flyer at (46, 44).
  { const scx = 50, scz = -14, scy = P.ground0(scx, scz), scry = atan2(-scx, -scz);
    const ice = mat(0xcdeeff, { pbr: true, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.72 });
    const sculpt = group(scx, scy, scz, W); sculpt.rotation.y = scry;
    mesh(G.box(1.3, 0.5, 1.3), ice, { y: 0.25, parent: sculpt });          // base block
    mesh(G.box(0.58, 0.6, 0.48), ice, { y: 0.8, parent: sculpt });         // body
    mesh(G.sphere(0.32, 10, 8), ice, { y: 1.22, z: 0.04, parent: sculpt }); // head
    mesh(G.cone(0.1, 0.22, 6), ice, { x: -0.15, y: 1.46, z: 0.08, rz: -0.3, parent: sculpt }); // ears
    mesh(G.cone(0.1, 0.22, 6), ice, { x: 0.15, y: 1.46, z: 0.08, rz: 0.3, parent: sculpt });
    mesh(G.cyl(0.03, 0.05, 0.75, 6), ice, { y: 0.56, z: -0.56, rx: 1.0, parent: sculpt }); // curled tail
    const pl = pointLight(0xbfe8ff, 5, 4.5, scx, scy + 1.1, scz, W);
    U.push((dt, t) => { pl.intensity = 3.5 + max(0, sin(t * 1.6)) * 3.5; });
    boxT(game, scx, scz, 0.8, 1.3, 0.8, { cam: false });
    const sculptLines = ['🧊 "Nobody will say who carved it. Everyone up here has a theory."', '🧊 "It\'s melted clean away twice and come back twice. Nobody will explain that either."', '🧊 "The yeti swears it isn\'t him. The yeti is a terrible liar."'];
    game.addInteractable({ obj: sculpt, radius: 2.8, label: () => 'Look at the ice sculpture', onUse: () => { SFX.twinkle(); game.toast(rnd.pick(sculptLines), 3000); } }); }
  // the Neighborhood, Candy Land and Sunny Shore all have a trampoline bouncing a kid by now — Frosty
  // Peak and Whisper Woods are the only two worlds left without one. A teal-padded trampoline now bounces
  // a bundled-up kid on the open snowfield south-west of the mountain, well past the forest ring and the
  // zipline's own cable line. Same `makeTrampoline` prop and `Bouncer` controller the other three worlds
  // already use, just restriped; the kid itself comes from this file's own `kid()` helper (coat, beanie
  // and mittens already on, same as every other child here, rather than the bare-headed bounce kids the
  // flat-floor worlds build fresh) and is placed with the terrain-aware `placeT`/`boxT` helpers since the
  // snowfield slopes gently underfoot out here too. Placed last of every person this build adds, after
  // the ice sculptor and every other child, so it draws from the very tail of both the local `r` and the
  // shared `rnd()` sequences and disturbs the fewest later ticks of either.
  // A headless probe built the real mountain (`game.load(5, 'from-hub')`, then `game.start('new')` so
  // every reindeer, hare, arctic fox, yeti and wandering kid actually moved rather than sitting frozen at
  // spawn), sampled every NPC's own position every quarter second over 150 simulated seconds — long
  // enough for the slowest patrol to clear the spot several times over — then swept a 1 m grid of the
  // open snowfield (radius 15-55, short of the radius (58) where snowRegion's own fill takes over)
  // against both those samples and all 781 of the mountain's physics boxes: (-52, -17) came back clear
  // by 10.4 m of the nearest box and 10.8 m of the nearest other soul, with ground height varying only
  // about 0.08 m within a metre of it.
  { const tx = -52, tz = -17;
    const tramp = makeTrampoline({ color: 0x00acc1 }); placeT(game, U, tramp, tx, tz, 0);
    boxT(game, tx, tz, 1.1, 0.42, 1.1, { cam: false });
    const bounceKid = kid(r.chance(0.5));
    game.npcs.push(new Bouncer(game, bounceKid, tramp, { x: tx, z: tz, ry: 0, height: 0.68, cycle: 1.05 }));
    const bounceLines = ["Higher than the gondola, nearly!", "Careful, puss — mind the springs round the edge.", "Warms you up better than the fire does, this."];
    let bounceCryT = r.range(3, 7);
    U.push((dt) => { bounceCryT -= dt; if (bounceCryT <= 0) { bounceCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(tx, tz, c.x, c.z) < 400) { game.toast('🤸 "' + r.pick(bounceLines) + '"', 2400); SFX.talk(); } } }); }
  // Sunny Shore, Victorian and Candy Land have all had something bubbling since round 385 (soap bubbles
  // twice over, a chewer's own bubblegum once) — Frosty Peak never did. A bundled-up kid now blows frost
  // bubbles from an icicle-tipped wand on the open snowfield east of the trampoline, well clear of the
  // scooter kid and the marbles ring: pale blue instead of the other worlds' clear soap film, since
  // nothing up here would stay a plain bubble for long. Same trick as those two: `Charger` (the kid never
  // moves, `Charger`'s own idle plus its already-built `ground0()` lookup does the rest, so the terrain-
  // aware `placeT`/`boxT` pair this file's moving props need goes unused here), the wand sitting in
  // `hands[1]` (the resting hand nothing else in this file's own idle gestures ever swings) read once
  // with `getWorldPosition()` right after `Charger` fixes the rig, and two bubbles riding the world clock
  // alone rather than this world's own seeded `r` — so, like those two, the build costs no later wardrobe
  // or colour pick. Reuses this file's own `kid()` helper for the rig, coat and beanie already on same as
  // every other child here, rather than the bare-headed blowers the paved worlds build fresh. Only real
  // change from the Sunny Shore/Victorian version: the pop effect's own colours lean icy (white and pale
  // blue, not the beach's pale cyan or the town's plain white-blue), since the shattering sound should
  // read as a tiny bit of frost giving way, not a soap film bursting.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain
  // (`game.travel(5, 'from-hub')`, then `game.start('new')` so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering kid actually moved rather than sitting frozen at spawn), sampled every NPC's and
  // every squirrel's own position every quarter second over 150 simulated seconds — long enough for the
  // slowest patrol to clear the spot several times over — then checked a candidate on the open snowfield
  // (radius 56.6, short of the radius (58) where snowRegion's own fill takes over) against both those
  // samples and all 757 of the mountain's physics boxes: (38, -42) came back clear by 9.22 m of the
  // nearest box and 9.06 m of the nearest other soul.
  { const fbx = 38, fbz = -42, fbry = atan2(-fbx, -fbz);
    const frostKid = kid(r.chance(0.5));
    const wand = group(0.02, 0, 0.1, frostKid.hands[1]); wand.rotation.set(-0.3, 0, 0.3);
    mesh(G.cyl(0.012, 0.012, 0.16, 6), mat(0x7a8a9a, { roughness: 0.6 }), { y: 0.08, parent: wand });
    mesh(G.cone(0.05, 0.1, 6), mat(0xcdeeff, { roughness: 0.2, transparent: true, opacity: 0.85 }), { y: 0.21, parent: wand });   // icicle tip
    game.npcs.push(new Charger(game, frostKid, { x: fbx, z: fbz, ry: fbry, cryIcon: '🫧',
      cries: ['Freeze before they even pop, these ones.', "Careful, puss — they're colder than they look.", 'Watch — this one is a beauty.'] }));
    const tip = V3(); wand.getWorldPosition(tip);
    const frostBubbleM = mat(0xdff3ff, { pbr: true, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.45 });
    const frostBubbles = [0, 1].map((i) => ({ m: mesh(G.sphere(0.05, 10, 8), frostBubbleM, { shadow: 'none', parent: W }), ph: i * 1.8, popped: -1 }));
    const fbCyc = 3.2;
    U.push((dt, t) => {
      for (const b of frostBubbles) {
        const k = ((t + b.ph) % fbCyc) / fbCyc;
        if (k < 0.92) {
          b.m.visible = true;
          b.m.position.set(tip.x + sin(t * 1.6 + b.ph) * 0.18 * k, tip.y + k * 1.5, tip.z + cos(t * 1.1 + b.ph) * 0.12 * k);
          b.m.scale.setScalar(0.4 + k * 0.7);
        } else {
          b.m.visible = false;
          const cycleNo = floor((t + b.ph) / fbCyc);
          if (cycleNo !== b.popped) { b.popped = cycleNo;
            const c = game.cat.group.position;
            if (dist2(tip.x, tip.z, c.x, c.z) < 400) { SFX.twinkle(); game.fx.emit(b.m.position.x, b.m.position.y, b.m.position.z, { count: 4, colors: [0xffffff, 0xcdeeff, 0x9fe8ff], speed: 0.5, up: 0.6, life: 0.5, gravity: 1.5 }); }
          }
        }
      }
    }); }
  // Robot City's two retired gents have had a checkers board since round 384 and Victorian's own
  // draughts table since round 354, both a plain `Sitter` pairing seated either side of a board — but
  // no world yet had an actual deck of cards on the table, and Frosty Peak, for all its fireside sitters,
  // never had anyone playing anything. Two travellers now sit either side of a small round table in a
  // quiet clearing south of the village, a deck stacked to one side and a scattered hand laid face up,
  // mid-game. Same `Sitter` pairing those other two tables already use, seated on a `makeIceStool()`
  // each like the draughts table borrows too, with the terrain-aware `placeT`/`boxT` helpers in place of
  // the flat-floor city's `place()`/`P.addBox()`, since the snowfield rolls gently underfoot out here too.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain
  // (`game.travel(5, 'from-hub')`, then `game.start('new')` so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering villager actually moved), sampled every NPC's and the squirrel's own position
  // every quarter second over 300 simulated seconds, then swept a 2 m grid of the open snowfield
  // (radius 15-54, short of the radius (58) where snowRegion's own fill takes over, and clear of every
  // zone circle — the sled run's own corridor runs x -7..7, well east of here) against both those samples
  // and all 729 of the mountain's physics boxes: (-16, -51) came back clear by 10.2 m of the nearest box
  // and 9.2 m of the nearest other soul.
  { const tx = -16, tz = -51, topY = 0.72, tableR = 0.4;
    const seatAx = tx - 0.68, seatAz = tz, seatBx = tx + 0.68, seatBz = tz;
    const ryA = atan2(seatBx - seatAx, seatBz - seatAz), ryB = atan2(seatAx - seatBx, seatAz - seatBz);
    const ty0 = P.ground0(tx, tz);
    const wood = mat(0x5a3a22, { roughness: 0.85, map: TEX.planks(22, 22) });
    const table = group(tx, ty0, tz, W);
    mesh(G.cyl(tableR, tableR, 0.03, 14), wood, { y: topY, parent: table });
    mesh(G.cyl(0.05, 0.07, topY, 8), wood, { y: topY / 2, parent: table });
    mesh(G.cyl(0.2, 0.22, 0.04, 12), wood, { y: 0.02, parent: table });
    // the deck, stacked neat to one side
    mesh(G.box(0.07, 0.03, 0.1), mat(0x2a4a6a, { roughness: 0.6 }), { x: -0.18, y: topY + 0.016, z: 0.08, ry: 0.3, parent: table });
    // a scattered hand, face up, mid-game
    const cardM = mat(0xf2ead6, { roughness: 0.7 }), pipColors = [0xb5272a, 0x1e1e22, 0xb5272a, 0x1e1e22, 0x1e1e22];
    const cardPos = [[0.12, 0.1, 0.1], [0.05, -0.08, -0.3], [-0.05, 0.06, 0.6], [0.2, -0.12, -0.5], [-0.14, -0.04, 0.9]];
    for (let i = 0; i < cardPos.length; i++) { const [cx, cz, crz] = cardPos[i];
      mesh(G.box(0.07, 0.004, 0.1), cardM, { x: cx, y: topY + 0.017, z: cz, ry: crz, parent: table });
      mesh(G.box(0.018, 0.004, 0.018), mat(pipColors[i], { roughness: 0.5 }), { x: cx + sin(crz) * 0.03, y: topY + 0.021, z: cz + cos(crz) * 0.03, ry: crz, parent: table }); }
    boxT(game, tx, tz, tableR * 2 + 0.2, topY, tableR * 2 + 0.2, { cam: false });
    placeT(game, U, makeIceStool(), seatAx, seatAz, ryA + PI); placeT(game, U, makeIceStool(), seatBx, seatBz, ryB + PI);
    const cardWard = makeWardrobe(r, { shirts: [0x7a4a3a, 0x4a5a6a, 0x5a4a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const playerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: cardWard }),
      hat: 'beanie', hatColor: 0x5a4a6a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(playerA.group);
    const playerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.4), wardrobe: cardWard }),
      hat: 'beanie', hatColor: 0x3a4a5a, coat: true, scarf: 0xf7f3ec, cuffs: 0x3a3a3a }); W.add(playerB.group);
    game.npcs.push(new Sitter(game, playerA, { x: seatAx, z: seatAz, ry: ryA, seat: 0.3,
      cries: ['Snap — no, wrong game. Ignore that.', "Mind your paws, puss — that's a winning hand.", 'One more round before the fire dies down.'] }));
    game.npcs.push(new Sitter(game, playerB, { x: seatBx, z: seatBz, ry: ryB, seat: 0.3,
      cries: ["He says that every round. He's bluffing.", "Careful, puss — you'll knock the deck.", 'Loser treks down for more firewood. Every time.'] }));
    let cardMoveT = rnd.range(6, 10);
    U.push((dt) => { cardMoveT -= dt; if (cardMoveT <= 0) { cardMoveT = rnd.range(7, 12); SFX.click(); game.fx.emit(tx, ty0 + topY + 0.1, tz, { count: 4, color: 0xf2ead6, speed: 0.3, up: 0.3, life: 0.6, gravity: 1.2, spread: 0.4 }); } }); }
  // Victorian, Sunny Shore and Candy Land all have a photographer bent under a dark cloth by now, but
  // Frosty Peak — for all its own aurora painter — never had anyone pointing a camera at the view
  // instead of a brush. A photographer sets up an old box camera on the open snowfield east of the
  // village, framing the whole mountainside: the gondola station, the peaks and the aurora overhead,
  // all in one shot. Same `Photographer` controller and `makeOldCamera()` tripod every earlier one
  // already uses, just a cold-weather wardrobe in place of a flatcap or sunhat.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain
  // (`game.travel(5, 'from-hub')`, then `game.start('new')` so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering villager actually moved), sampled every NPC's and the squirrel's own position
  // every quarter second over 300 simulated seconds, then swept a 1 m grid of the open snowfield
  // (radius 10-56, short of the radius (58) where snowRegion's own fill takes over) against both those
  // samples and all 681 of the mountain's physics boxes: (25, 50) came back clear by 9.2 m of the
  // nearest box and 13.2 m of the nearest other soul, at radius 55.9 from the origin. Placed last of
  // every person this build adds, after the two card players, so it draws from the very tail of this
  // world's own local `r()` sequence.
  { const px = 25, pz = 50, pry = atan2(0 - px, 0 - pz);   // facing back toward the village and peaks
    const camWard = makeWardrobe(r, { shirts: [0x3a5a6a, 0x4a4a5a, 0x5a4a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const snapper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.3), wardrobe: camWard }),
      hat: 'beanie', hatColor: 0x3a3a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, glasses: r.chance(0.3) });
    W.add(snapper.group);
    const camera = makeOldCamera();
    game.npcs.push(new Photographer(game, snapper, camera, { x: px, z: pz, ry: pry, cryIcon: '📷',
      cries: ['Whole mountain in one shot, if the light holds.', "Careful, puss — it's only flash powder, not fire.", "The painter says a photograph has no soul. I say develop faster, then we'll talk."] })); }
  // Victorian has a draughts table since round 354, Robot City a checkers drum since round 384, Frosty
  // Peak itself a deck of cards since round 397 and Whisper Woods a mancala board — but no world yet had
  // curling, the one game that is pure winter through and through. A granite stone now glides down a
  // short, gently-sloping lane on open snow north of the village, out past the lantern path: released at
  // the uphill hack, it eases down to a set of painted rings where a sweeper works a broom over the ice
  // ahead of it, before the whole run resets for the next throw.
  // No new controller: the thrower is a plain `Kneeler` (the same class every sand- and snow-patter in
  // this build already uses) and the sweeper a `Vendor` (the same stand-and-hold class the cocoa seller
  // just up the slope uses), holding a new `makeBroom()` in place of a mug. The stone itself
  // (`makeCurlingStone()`, new, both in `62-props-nature.js`) is a bare prop whose own `userData.update`
  // — set before `placeT` hands it to the world, so `place()` picks it up automatically — eases it along
  // the lane each frame purely as a function of the world clock `t`, the same deterministic trick the
  // campfire's flicker and the snowman's turning head already rely on: no `rnd()` draw, so it costs
  // nothing from this world's own later sequence.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain
  // (`game.travel(5, 'from-hub')`, then `game.start('new')` so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering villager actually moved), sampled every NPC's own position every quarter second
  // over 300 simulated seconds, then swept a 1 m grid of the open snowfield (radius 32-55, short of the
  // radius (58) where snowRegion's own fill takes over) against both those samples and all 669 of the
  // mountain's physics boxes: the chosen lane, from (-29, 43.2) to (-29, 48.3), came back clear by 6.6 m
  // of the nearest box and 6.6 m of the nearest other soul at its closest end, and by 12.1 m and 9.1 m at
  // its far end — comfortably inside the hand-built core, well short of where the procedural fill begins.
  { const laneX = -29, hackZ = 43.2, targetZ = 48.3, slideDur = 2.4, restDur = 2.2, cycle = slideDur + restDur;
    const ty0 = P.ground0(laneX, targetZ);
    const ringsG = group(laneX, ty0 + 0.01, targetZ, W);
    const ringColors = [0xb5272a, 0xf7f3ec, 0x2f6fd6, 0xf7f3ec];
    for (let i = 0; i < 4; i++) noInk(mesh(G.torus(0.3 + i * 0.28, 0.025, 6, 24), mat(ringColors[i], { roughness: 0.6 }), { rx: PI / 2, shadow: 'none', parent: ringsG }));
    mesh(G.cyl(0.12, 0.12, 0.015, 16), mat(0xf7f3ec, { roughness: 0.6 }), { y: 0.001, shadow: 'none', parent: ringsG });
    // the thrower kneels at the hack, having just sent the stone on its way
    const curlWard = makeWardrobe(r, { shirts: [0x5a6a8a, 0x8a5a3a, 0x4a6a5a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const thrower = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: curlWard }),
      hat: 'beanie', hatColor: 0x3a5a8a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(thrower.group);
    game.npcs.push(new Kneeler(game, thrower, { x: laneX, z: hackZ, ry: 0, cryIcon: '🥌',
      cries: ['Nice weight on that one.', 'Careful, puss — mind the sheet.', 'Needs a touch more curl, next time.'] }));
    // the sweeper works the ice ahead of it, broom flicking side to side
    const sweepX = laneX + 1.5, sweepZ = targetZ - 1.0;
    const sweepWard = makeWardrobe(r, { shirts: [0x8a3a3a, 0x3a5a6a, 0x5a5a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const sweeper = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: sweepWard }),
      hat: 'beanie', hatColor: 0x8a3a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(sweeper.group);
    const sv = new Vendor(game, sweeper, makeBroom(), { x: sweepX, z: sweepZ, ry: atan2(laneX - sweepX, hackZ - sweepZ), cryIcon: '🧹',
      cries: ['Sweep, sweep, sweep!', 'Careful, puss — stay out of the hack!', "Few more feet... there!"] });
    game.npcs.push(sv); greetable(game, sv);
    // the stone: eased along the lane each frame as a pure function of the clock, resting a moment in
    // the rings before the loop resets for the next throw
    const stone = makeCurlingStone();
    stone.userData.update = (dt, t) => {
      const ph = t % cycle;
      if (ph < slideDur) { const u = ph / slideDur, ease = u * u * (3 - 2 * u), z = hackZ + (targetZ - hackZ) * ease;
        stone.position.set(laneX, P.ground0(laneX, z) + 0.001, z); stone.rotation.y = t * 5.5; }
      else { stone.position.set(laneX, ty0 + 0.001, targetZ); stone.rotation.y = t * 1.1; }
    };
    placeT(game, U, stone, laneX, hackZ, 0); }
  // Sunny Shore's had a solo frisbee thrower since round 411, the Neighborhood picked up the same throw
  // two rounds later and Robot City a round after that — Frosty Peak, for all its sled run and curling
  // lane, never got the one throw that needs nobody on the other end. A bundled-up kid now tosses a disc
  // straight up off the palm on the open snowfield south of the village, well clear of the arctic fox's
  // own roam and the catch-ball game to the west.
  // No new controller: the same `FrisbeePlayer` class (`55-npcs.js`, next to `HulaHooper`) every other
  // world's own thrower already uses, just this mountain's own icy palette on the disc. Its own built-in
  // `cries` option goes unused on purpose, the same fix Robot City's own thrower needed: that path draws
  // its idle-chatter timer off the shared global `rnd()` (the same stream every talking NPC in the game
  // pulls from), and the extra draw it costs risks tipping some later, already-fragile check the same way
  // it once did for the Victorian carriage. Dialogue instead rides its own `U.push` timer, seeded off this
  // world's own local `r()` — the same trick the trampoline's own `bounceLines` and the frost-bubble kid's
  // own cries, just above, already use — so it costs no global draw at all. Reuses this file's own `kid()`
  // wardrobe helper (coat and beanie already on) rather than the bare-headed throwers the other worlds
  // build fresh.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain
  // (`game.travel(5, 'from-hub')`, then `game.start('new')` so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering kid actually moved), sampled every NPC's own position every quarter second over 300
  // simulated seconds, then swept a grid of the open snowfield against both those samples and every one of
  // the mountain's physics boxes: (-9, -40) came back clear by 15.58 m of the nearest box and 14.32 m of
  // the nearest other soul — south of the village, well clear of the cave's own flat approach strip (which
  // only ever runs within 7 m of x=0) and the catch-ball game further west at (-24, -42), at radius 41.0
  // from the origin and well short of the radius (58) where snowRegion's own fill takes over.
  { const fx = -9, fz = -40, fry = atan2(0 - fx, 0 - fz);
    const frisbeeKid = kid(r.chance(0.5));
    game.npcs.push(new FrisbeePlayer(game, frisbeeKid, r.pick([0x9fe8ff, 0xffd54a, 0xff6f3c]), { x: fx, z: fz, ry: fry }));
    const frisbeeLines = ['Highest one yet, nearly over the pines!', "Careful, puss — mind your tail, this one's coming down fast.", 'Forty throws and not one lost in a drift.'];
    let frisbeeCryT = r.range(3, 7);
    U.push((dt) => { frisbeeCryT -= dt; if (frisbeeCryT <= 0) { frisbeeCryT = r.range(8, 14); const c = game.cat.group.position; if (dist2(fx, fz, c.x, c.z) < 400) { game.toast('🥏 "' + r.pick(frisbeeLines) + '"', 2400); SFX.talk(); } } }); }
  // the Neighborhood, Robot City, Victorian, Candy Land and Sunny Shore have all had a go at the same
  // back-garden toss game by now — a horseshoe, a magnetic coupling, a brass quoit, a gummy ring, a
  // coil of rope — but the one world with sled dogs and reindeer harnesses to hand never got the most
  // obvious ring of the lot. Two bundled-up villagers now lob a spare harness ring back and forth,
  // trying to land it over a pair of hitching posts driven into the snow on the open slope south-east
  // of the village — the same posts a sled team would tie off to, if one ever came through. "Right
  // over the post — that's a landing!" "Careful, puss — that's good reindeer leather, not a toy."
  // "Best of nine, loser mucks out the sled dogs."
  // No new controller: the same `Horseshoes` class (`55-npcs.js`) every earlier reskin already uses,
  // unchanged — held a moment, lobbed on an arc, caught, lobbed back, with its own `SFX.clang()` on
  // landing — just two snow-capped wooden hitching posts and a stout leather ring standing in for the
  // iron horseshoe, brass quoit, coupling or rope.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses, driven by hand through
  // `game.travel(5, 'from-hub')` and a real 300-simulated-second run so every reindeer, hare, arctic
  // fox, penguin, yeti and wandering villager actually moved) sampled every NPC's own position every
  // quarter second, then swept a 2 m grid of the open snowfield (radius 20-54, short of the radius (58)
  // where snowRegion's own fill takes over) against both those samples and all 800 of the mountain's
  // physics boxes: (-11, 51) came back clear by 10.4 m of the nearest box and 10.3 m of the nearest
  // other soul, with both posts themselves — (-11, 48) and (-11, 54), either side of the 6 m pitch —
  // clear by at least 8.8 m on both counts.
  { const hcx = -11, hcz = 51, hgap = 6;
    const postM = mat(0x5a4632, { roughness: 0.95 }), capM = mat(0xf2f6fb, { roughness: 0.9 });
    for (const hz of [hcz - hgap / 2, hcz + hgap / 2]) {
      const py = P.ground0(hcx, hz);
      mesh(G.cyl(0.06, 0.075, 0.46, 10), postM, { x: hcx, y: py + 0.23, z: hz, parent: W });
      mesh(G.sphere(0.09, 8, 6), capM, { x: hcx, y: py + 0.46, z: hz, sy: 0.6, shadow: 'none', parent: W });   // a cap of settled snow
      P.addBox(hcx, py + 0.23, hz, 0.14, 0.46, 0.14, { cam: false });
    }
    // a couple of spare rings stacked by the near post, baked in with everything else — just set dressing
    const spareM = mat(0x6b4226, { roughness: 0.85, metalness: 0.1 });
    const py0 = P.ground0(hcx, hcz - hgap / 2);
    for (let i = 0; i < 2; i++) mesh(G.torus(0.13, 0.03, 6, 16), spareM, { x: hcx + 0.3, y: py0 + 0.035 + i * 0.06, z: hcz - hgap / 2 + 0.1, rx: PI / 2, ry: i * 0.7, parent: W });
    const tossWardA = makeWardrobe(r, { shirts: [0x8a3a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const tossWardB = makeWardrobe(r, { shirts: [0x3a5a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const tossA = makeHuman({ ...randomPerson(r, { female: false, child: false, elder: r.chance(0.3), wardrobe: tossWardA }), hat: 'beanie', hatColor: 0x3a3a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, jacket: null, bag: null, backpack: null });
    const tossB = makeHuman({ ...randomPerson(r, { female: true, child: false, elder: r.chance(0.3), wardrobe: tossWardB }), hat: 'beanie', hatColor: 0x8a3a3a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, jacket: null, bag: null, backpack: null });
    W.add(tossA.group); W.add(tossB.group);
    const ring = mesh(G.torus(0.15, 0.04, 8, 20), mat(0x6b4226, { roughness: 0.85, metalness: 0.1 }), { x: hcx, y: py0 + 1, z: hcz - hgap / 2, rx: PI / 2, parent: W });
    const harnessLines = ['Right over the post — that\'s a landing!', "Careful, puss — that's good reindeer leather, not a toy.", "Best of nine, loser mucks out the sled dogs."];
    game.npcs.push(new Horseshoes(game, tossA, tossB, ring, { cx: hcx, cz: hcz, gap: hgap, cries: harnessLines, cryIcon: '🛷' }));
    greetable(game, { rig: tossA }); greetable(game, { rig: tossB }); }
  // Victorian, Robot City, Sunny Shore, Candy Land and the Neighborhood have all had something cross
  // their own sky the last five rounds running (a hot air balloon, an airship, a biplane, a tumbling
  // gumball, a second biplane) — Frosty Peak's own sky, past the snow buntings and the gondola cable,
  // never had anything migrate across it. **A ragged V of seven Canada geese now flies a slow, high
  // circuit over the whole mountain**, 65 m up on a 95 m orbit. Purely decorative: nothing to greet,
  // nothing to reach, no dialogue and no new sound (SFX stays as it is).
  //
  // No new controller, no physics box of its own: this mountain's two climbable peaks (38 m at the
  // zipline's own summit, 32 m at the second one east of it, by far the tallest things on the whole
  // playable slope) both sit on the orbit's outer edge rather than under it — the closest the 95 m
  // circle ever comes to either peak's own centre is 25 m and 37 m respectively, where each peak's own
  // smooth falloff (the same `k*k*sqrt(k)` dome `T()` already uses) has already dropped to under 29 m —
  // so flying at 65 m clears both by a comfortable margin anywhere on the loop. The gondola cable's own
  // climb above the station, the next tallest thing in the village, tops out around 35 m. A 95 m orbit
  // also sits well inside the 130 m radius where this world's own terrain function `T()` starts raising
  // its own decorative rim into real mountains (`smoothstep(130, 265, d)`), so the loop never flies
  // anywhere near the rim either, and needs no keep-out check against `game.zones` or any of this
  // world's physics boxes.
  //
  // Each goose is a stretched body sphere in a grey-brown winter coat, a black neck curving up into a
  // black head with a white cheek patch standing in for the chinstrap marking, and the same two-bone
  // flapping wing build every other flyer in this file already uses (`makeSeagull`, `makeDove`,
  // `makeSnowBird`, `makeCrow`), just slower and heavier to read as a bigger bird labouring along rather
  // than gliding. Seven of them sit in a fixed V behind a lead bird — three widening pairs either side,
  // each at its own random flap phase drawn off this world's own local `r()` so the wingbeats never line
  // up — carried as one rigid group round the circuit, so the formation costs nothing beyond the lead
  // bird's own transform; only the wings animate per bird, called by hand from the flock's own
  // `userData.update` since there is no per-goose controller.
  //
  // Drifts entirely on the world clock `t` (the orbit and a gentle bob keyed off `t` alone) from one
  // fixed starting angle drawn once off this world's own local `r()`, so it costs no later wardrobe or
  // layout pick — placed last of everything this build adds, after the harness ring toss, so even that
  // one draw disturbs nothing built earlier on the mountain.
  { const makeGoose = (phase) => {
      const g = new THREE.Group(), rig = { group: g, wings: [] };
      const coat = mat(0x7a6a52, { roughness: 0.85 }), dark = mat(0x1c1c1c, { roughness: 0.6 }), cheek = mat(0xf2eee0, { roughness: 0.8 }), beakM = mat(0x2a2420, { roughness: 0.5 });
      const body = group(0, 0, 0, g); rig.body = body;
      mesh(G.bodySphere(14, 10), coat, { sx: 0.12, sy: 0.12, sz: 0.34, parent: body });
      const neck = group(0, 0.06, 0.2, body); neck.rotation.x = -0.55;
      mesh(G.capsule(0.035, 0.16, 6), dark, { y: 0.1, rx: PI / 2, parent: neck });
      const head = group(0, 0.19, 0.03, neck);
      mesh(G.sphere(0.05, 10, 8), dark, { parent: head });
      mesh(G.sphere(0.022, 8, 6), cheek, { x: 0, y: -0.01, z: 0.03, sx: 1.3, sy: 0.7, sz: 0.9, shadow: 'none', parent: head });
      mesh(G.cone(0.02, 0.07, 6), beakM, { y: -0.01, z: 0.07, rx: PI / 2, shadow: 'none', parent: head });
      mesh(G.box(0.08, 0.02, 0.1), dark, { y: -0.01, z: -0.15, rx: 0.1, shadow: 'none', parent: body });   // tail
      for (const side of [1, -1]) {
        const w = group(side * 0.07, 0.03, 0.02, body);
        mesh(G.box(0.38, 0.022, 0.16), coat, { x: side * 0.19, parent: w });
        const tipW = group(side * 0.38, 0, 0, w); mesh(G.box(0.3, 0.02, 0.13), dark, { x: side * 0.14, parent: tipW });
        rig.wings.push({ w, tipW, side });
      }
      rig.animate = (ph, moving, dt, t = 0) => {
        const flap = sin(t * 5 + phase), glide = (sin(t * 0.22 + phase) > 0.45) ? 1 : 0;
        for (const Wg of rig.wings) { const a = glide ? 0.16 : flap * 0.55; Wg.w.rotation.z = Wg.side * -a; Wg.tipW.rotation.z = Wg.side * -a * 0.8; }
        body.rotation.z = sin(t * 0.6 + phase) * 0.08;
      };
      bakeRig(g);
      return rig;
    };
    const vOffsets = [[0, 0, 0], [-1.0, -0.04, -0.9], [1.0, -0.04, -0.9], [-2.0, -0.08, -1.8], [2.0, -0.08, -1.8], [-3.0, -0.12, -2.7], [3.0, -0.12, -2.7]];
    const flockR = 95, flockH = 65, flockSpeed = TAU / 260, flockPhase = r() * TAU;
    const flock = group(0, 0, 0);
    const geese = vOffsets.map(([ox, oy, oz]) => { const goose = makeGoose(r() * TAU); goose.group.position.set(ox, oy, oz); flock.add(goose.group); return goose; });
    flock.userData.update = (dt, t) => {
      const a = flockPhase + t * flockSpeed;
      flock.position.set(cos(a) * flockR, flockH + sin(t * 0.17) * 3, sin(a) * flockR);
      flock.rotation.y = -a;
      for (const goose of geese) goose.animate(0, true, dt, t);
    };
    place(game, U, flock, cos(flockPhase) * flockR, sin(flockPhase) * flockR, 0, flockH); }
  snowRegion(game, U, r, 58, PEAK_LIMIT - 8);
  makeHorizon(game, r, { clear: PEAK_LIMIT + 8, hills: true, hill: 0xe8eef6, rock: 0x6a7a94, rock2: 0x7e8ea6, snow: 0xf6fbff, snowLine: 26, peaks: 32, peakH: [46, 110], woodCount: 300, woodHue: [0.32, 0.42], woodLight: [0.12, 0.2], trunk: 0x4a3a2a });
  // gondola home (bottom station of the village)
  const station = makeGondolaStation(game, -40, 0, PI / 2, () => game.travel(0, 'from-snow'), 'Ride the gondola home', 'NEIGHBORHOOD  ↓');
  station.position.y = P.ground0(-40, 0); U.push(station.userData.update);
  const welcomeArch = makeWelcomeArch(game, -31.5, 0, PI / 2);
  // the Neighborhood's park lamp, Robot City's tower, a Victorian lamp post, a Whisper Woods tree and
  // Sunny Shore's swim flag have all carried a stapled notice by now (rounds 462-467) — Frosty Peak was
  // the one world left out, and the welcome arch at the top of the gondola, standing right on the path
  // every arriving cat already walks, had two ready-made log posts and no interactable of its own to
  // compete with. `makeSnowNotice()` (new, next to the other five in `60-props.js`) is parented onto the
  // arch's own right-hand post (`makeWelcomeArch`'s loop builds both posts at local x = ±2.2, y = 1.9,
  // z = 0, as plain meshes with no handle of their own, so this reaches in by local offset rather than a
  // captured reference) at local (2.4, 1.5, 0) — 1.5 m up is squarely inside the post's own 0-3.8 m
  // span and well under the beam at y = 3.55, and 2.4 = 2.2 + 0.2 clears the post's own radius at that
  // height (it tapers from 0.2 at the base to 0.16 at the top; at y = 1.5 that interpolates to ~0.184 m,
  // so a 0.2 m offset leaves a 2 cm gap) plus the panel's own 1.2 cm thickness. `rotation.y = PI / 2`
  // turns the panel's default +z face to +x, so it looks back along the offset instead of edge-on to
  // anyone walking up from that side. No new physics box: the post's own (half-extent 0.45) already
  // covers it, same shortcut every notice before it took.
  // `game.addInteractable` resolves distance from the notice's own object via `getWorldPosition`, not
  // the arch's, so it needn't worry about the gondola station's own "Ride the gondola home" hub prompt
  // 8.5 m away at (-40, 0) — far outside both radii, no overlap there even before accounting for this.
  // A headless probe (`game.start('new')` then `game.load(5, 'from-hub')`) found the notice lands at
  // world (-31.5, -2.4) — the arch's own ry = PI/2 turns the local +x offset south, not the +z this
  // comment's own local coordinates might suggest — and swept it against every physics box, NPC and
  // interactable in the built world: the nearest of either (a wandering villager) stayed 6.77 m clear,
  // well past the notice's own 2.2 m radius; the only box closer than that is the post it's mounted on
  // (0.2 m, exactly the clearance this was built for). Standing at (-31.5, -2.4) turned up "Read the
  // notice" and fired a toast; standing out at (0, 60) showed no prompt at all.
  { const notice = makeSnowNotice(); notice.position.set(2.4, 1.5, 0); notice.rotation.y = PI / 2; welcomeArch.add(notice);
    const mittenLines = ['🧤 "LOST: one mitten, hand-knit, red with white snowflakes. Left hand only — the right one\'s long gone." The cat has four mittens built in and loses none of them, and isn\'t shy about it.',
      '🧤 Underneath, in smaller writing: "If found, the other one probably isn\'t worth much either." The cat has to agree.',
      '🧤 Someone has pinned a single loose strand of red wool to the corner, as if that proves anything. The cat sniffs it anyway.'];
    game.addInteractable({ obj: notice, radius: 2.2, label: () => 'Read the notice', onUse: () => { SFX.click(); game.toast(rnd.pick(mittenLines), 3000); } }); }
  makeLanternPath(game, -29, 0, -8, 0, 6);
  for (const [x, z] of [[-28, 4.5], [-20, -4.5], [-14, 4.5]]) { const c = makeIceCrystal(r, r.pick([0x9fe8ff, 0xbfa8ff])); placeT(game, U, c, x, z, 0); boxT(game, x, z, 0.6, 1.6, 0.6, { cam: false }); }
  for (const [x, z] of [[-26, -6], [-18, 6]]) { const p = makeSnowPine(r); placeT(game, U, p, x, z, 0); boxT(game, x, z, 1.2 * p.scale.x, 5, 1.2 * p.scale.x, { cam: false }); }
  for (let i = 0; i < 6; i++) { const x = -30 + i * 4, z = (i % 2 ? 1 : -1) * 3.2; mesh(G.sphere(1, 8, 6), mat(0xf6f9fc, { roughness: 1 }), { x, y: P.ground0(x, z), z, sx: r.range(0.8, 1.4), sy: r.range(0.4, 0.7), sz: r.range(0.8, 1.4), shadow: 'none', parent: W }); }   // snow banks
  // the village pond has had an angler, two would-be skaters and a birdwatcher round its own edge
  // since round one, but nothing has ever actually lived in the water itself, and the whole mountain
  // never had the one animal that's obviously supposed to be here. A seal now hauls out on a small
  // frozen tarn of its own, high on the open slope east of the forest ring, flippers tucked, head
  // turning slow, whiskers twitching now and then. The tarn just reuses `makeIcePond()` — already
  // built for the village pond, called again here at a third its radius rather than given a new mesh
  // of its own — and the seal is `makeSeal()` (new, next to the penguin build in
  // `56-npcs-wild.js`). Not wired to any controller: the same "perched; only animates" trick the owls
  // and the Neighborhood's own ladybug already use (`seal.animate(0, false, dt, st)` off a local
  // timer in `U`), so this costs no new physics box — it lies flat on its own ice, well under
  // anything a collider would catch, same as those two. An occasional bark (`SFX.bark()`, already
  // heard from every dog in this game) plays if the cat is close.
  // Tried near the village pond itself first, but every spot there turned up a wandering penguin or
  // reindeer within a metre or two inside 300 simulated seconds — the flock's own roam radius reaches
  // well past the water. A headless probe (the same stub-three harness `test/run.mjs` itself uses)
  // built the real mountain, sampled every NPC's own position every quarter second over 300 simulated
  // seconds (so no wandering penguin, deer, hare, fox or patrolling villager mid-leash could slip past
  // unnoticed), then swept a grid of the open slope east of the forest ring (radius 26-50, clear of
  // the village's own keep-out circle and short of where snowRegion's own fill takes over at 58)
  // against both those samples and every one of the mountain's physics boxes: (33, -15) came back
  // 6.39 m clear of the nearest box (a pine trunk in the forest ring) and 12.45 m clear of the
  // nearest other soul, 5.8 m past the star collectible at (30, -20), with ground height varying under
  // 0.6 m across the tarn's own small footprint.
  { const sx = 33, sz = -15;
    makeIcePond(game, sx, sz, 1.8, r);
    const sy = P.ground0(sx, sz) + 0.06;
    const seal = makeSeal(); seal.group.position.set(sx, sy, sz); seal.group.rotation.y = r() * TAU; W.add(seal.group);
    let st = r() * 10, barkT = rnd.range(8, 14);
    U.push((dt) => { st += dt; seal.animate(0, false, dt, st);
      barkT -= dt; if (barkT <= 0) { barkT = rnd.range(10, 18); const c = game.cat.group.position; if (dist2(sx, sz, c.x, c.z) < 225) SFX.bark(); } }); }
  // the seal just above hauls out and holds still — the one animal this mountain was still missing is
  // the one that's never still at all. An otter now has a small icy puddle of its own, further round
  // the slope, and spends its whole time sliding back and forth across it on its belly, flipping to
  // face whichever way it's headed each time it turns. New `makeOtter()` (56-npcs-wild.js, right after
  // `makeSeal`): smaller and sleeker than the seal, round ears instead of none, a long tapered tail,
  // front paws tucked rather than flippers. Not wired to any controller either — the slide itself is
  // one sine (`otter.body.position.x`, period 3.6 s, amplitude 0.7 m) driven by the world clock `t`
  // alone in a local `U.push`, with `otter.body.rotation.y` flipping between facing +x and -x at the
  // two ends of the slide; `rig.animate()` itself only handles the small per-frame flourishes (bob,
  // tail swish, head turn) the same way the seal's own `animate()` does. No physics box: its own
  // capsule tops out under 0.2 m, same reasoning as the seal and the mole in the Neighborhood's
  // vegetable patch (round 577) — well under anything the walkability check's own 0.4 m floor catches.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain,
  // sampled every NPC's own position every tenth of a second over 300 simulated seconds (so no
  // wandering penguin, deer, hare, fox or patrolling villager mid-leash could slip past unnoticed),
  // then swept the open slope east of the forest ring (radius 36-54) against both those samples and
  // every one of the mountain's physics boxes: (34, -28) came back 6.16 m clear of the nearest box (a
  // pine trunk in the forest ring) and 9.62 m clear of the nearest other soul, with the ground varying
  // under 0.1 m across the puddle's own small footprint — comfortably past the otter's own 2 m slide-
  // plus-puddle radius either way.
  { const ox = 34, oz = -28;
    makeIcePond(game, ox, oz, 1.3, r);
    const oy = P.ground0(ox, oz) + 0.04;
    const otter = makeOtter(); otter.group.position.set(ox, oy, oz); W.add(otter.group);
    let ot = r() * 10; const cyc = 3.6, amp = 0.7;
    U.push((dt) => { ot += dt;
      const slide = sin(ot * (TAU / cyc));
      otter.body.position.x = slide * amp;
      otter.body.rotation.y = cos(ot * (TAU / cyc)) >= 0 ? PI / 2 : -PI / 2;
      otter.animate(0, false, dt, ot); }); }
  // Victorian's own round-up of playground games this game had never tried once in any of the seven
  // worlds (tetherball, badminton, tug-of-war, archery, sack races) named five; this is the first of
  // them anywhere. Two bundled-up villagers now dig their heels into the snow and heave on a rope
  // between them — new `TugOfWar` (`55-npcs.js`, right after `Talkers`, its nearest relative: two
  // facing rigs, each its own circle and its own friend id), built generic on purpose, since it's a new
  // mechanic rather than a reskin of one of this game's existing controllers. Both players heave in
  // time with each other rather than taking turns — that's the actual point of the game — while the
  // rope's own tug-of-war never settles either way: the class hands back a slow `tension` drift
  // (bounded well short of either end) for whoever calls it to slide their own rope's own marker, same
  // separation of generic-controller from world-built-scenery `BallGame` and `Horseshoes` already use
  // for their own ball and shoe. The rope and its little red flag are built here, straight-line static
  // geometry between the two fixed hand spots the constructor itself works out (`tug.ctls[i].x/z`),
  // `noInk()`'d like every other thin cable in this game, with the flag alone needing a `U.push` to
  // slide it each frame — too far out (radius 53.9) for `fillRing`'s own `bakeDeep` to ever reach it.
  // A headless probe (the same stub-three harness `test/run.mjs` itself uses) built the real mountain
  // (`game.start('new')` then `game.load(5, 'from-hub')`, so every reindeer, hare, arctic fox, penguin,
  // yeti and wandering villager actually moved), sampled every NPC's own position every 1/30 s over
  // 300 simulated seconds, then swept a 5 m grid of the open snowfield (radius 15-54, short of the
  // radius (58) where snowRegion's own fill takes over) against both those samples and every one of
  // the mountain's 742 physics boxes: (50, 20) came back clear by 7.85 m of the nearest box and 7.55 m
  // of the nearest other soul, with the ground varying under 0.3 m across the whole footprint — open
  // snowfield east of the card table and the yo-yo kid, with nothing else anywhere near it.
  { const tugWard = makeWardrobe(r, { shirts: [0x8a3a3a, 0x3a5a6a, 0x4a6a4a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const haulerA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tugWard }),
      hat: 'beanie', hatColor: 0x8a3a3a, coat: true, scarf: 0xf2ead8, cuffs: 0x3a3a3a }); W.add(haulerA.group);
    const haulerB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: tugWard }),
      hat: 'beanie', hatColor: 0x3a5a6a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a }); W.add(haulerB.group);
    const tug = new TugOfWar(game, haulerA, haulerB, { x: 50, z: 20, ry: PI / 2, gap: 2.6,
      cries: ["Heave! Heave! Nobody's budging an inch!", 'Careful, puss — mind the rope, it bites worse than a snowball.', "Dead heat again. Always is, with these two."] });
    game.npcs.push(tug);
    const [A, B] = tug.ctls, ropeM = mat(0x8a6a42, { roughness: 0.9 }), ay = P.ground0(A.x, A.z) + 0.75, by = P.ground0(B.x, B.z) + 0.75;
    const ropeGroup = group((A.x + B.x) / 2, (ay + by) / 2, (A.z + B.z) / 2, W);
    ropeGroup.lookAt(B.x, by, B.z);
    noInk(mesh(G.cyl(0.035, 0.035, Math.hypot(B.x - A.x, by - ay, B.z - A.z), 8), ropeM, { rx: PI / 2, parent: ropeGroup }));
    const flag = group(0, 0, 0, W); noInk(mesh(G.box(0.03, 0.14, 0.4), mat(0xd62839, { roughness: 0.7 }), { parent: flag }));
    U.push(() => { const frac = 0.5 + clamp(tug.tension, -1, 1) * 0.12;
      flag.position.set(lerp(A.x, B.x, frac), lerp(ay, by, frac) + 0.03, lerp(A.z, B.z, frac)); flag.rotation.y = ropeGroup.rotation.y; }); }
  // Candy Land's gingerbread guard, Victorian's drill line and Robot City's own security detail have
  // all used `Marchers` (55-npcs.js) for a lockstep patrol by now — Frosty Peak's own colony, 50-odd
  // lines up, only ever wanders loose by the pond. Real penguins actually do the opposite: they file
  // into a tight single line and march. **Three penguins now hold a strict column on an 8 m stretch of
  // open snowfield**, waddling to one end, turning in place, and waddling straight back. *"Waddle.
  // Waddle. Precision waddle."* *"Mind the queue, puss — we've drilled this."* *"Column of three.
  // Nobody elected a leader; the ice did."*
  //
  // No new class and no new mesh: three plain `makePenguin()` rigs, handed straight to the exact same
  // `Marchers` constructor the gingerbread guard, the toy soldiers and the robot patrol already use,
  // unchanged — one leads on a `Patroller` route, the other two hold a fixed gap behind it in lockstep.
  // `Patroller`'s own constructor calls `greetable()` on the lead automatically, same as every earlier
  // march, but `greetable()` itself only wires up a friend prompt when the rig carries `.look`, `.robot`
  // or `.cookie` — a bare `makePenguin()` rig has none of the three, so the call quietly no-ops. That's
  // not a bug here: it's the same thing that already keeps the pond colony's own `Wanderer`s and the
  // bolder `Follower` penguin from counting as friends, and this march is the same ambient wildlife as
  // both, just filed into formation instead of wandering loose. No change to this world's own friend
  // total.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, built
  // the real mountain with `game.start('new')` then `game.travel(5, 'from-hub')`) sampled every NPC's
  // own rig position every quarter second over 300 simulated seconds (so no wandering penguin, deer,
  // hare, arctic fox or patrolling villager mid-leash could slip past unnoticed), then swept the 8 m
  // line from (55, -5) to (55, 3) against both those samples and every one of the mountain's 742
  // physics boxes: the line came back clear by 6.33 m of the nearest box along its whole length and
  // 5.33 m of the nearest other soul, at radius 55 m — well east of the pond colony at (18, 8) and the
  // hare trio at (45-48, 0±2), short of the radius (58) where snowRegion's own procedural fill takes
  // over. Placed last of everything this build adds, after the tug-of-war, so the three unconditional
  // draws `Patroller`'s own constructor makes off the shared `rnd()` sequence (heading phase, idle
  // clock, cry timer) land after every other timed NPC in this world and disturb no earlier wardrobe or
  // layout pick.
  { const marchers = [0, 1, 2].map(() => { const rig = makePenguin({ scale: r.range(0.85, 1.05) }); W.add(rig.group); return rig; });
    game.npcs.push(new Marchers(game, marchers, { points: [[55, -5], [55, 3]], speed: 0.65, pause: [1, 2], r: 0.3, height: 0.9, gap: 0.9,
      cries: ['Waddle. Waddle. Precision waddle.', "Mind the queue, puss — we've drilled this.", 'Column of three. Nobody elected a leader; the ice did.'], cryIcon: '🐧' })); }
  // The Neighborhood, Candy Land, Robot City, Victorian and Sunny Shore have all had a tetherball pole
  // since round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack
  // races) went round every world in turn — Frosty Peak, for all its tug-of-war, archery range,
  // horseshoes and curling, never got the one game played standing still, swinging a ball on a rope
  // round and round a post. **Two kids keep a rally going on open snow east of the marching penguins'
  // own stretch of ice.** *"Round and round — same as every other game on the mountain, just colder."*
  // *"Mind the rope, puss — mittens or not, it still stings."* *"Forty wraps. No, forty-one. I keep
  // losing count in the cold."*
  //
  // No new class and no new mesh: the exact same `Tetherball` (`55-npcs.js`) the other five worlds
  // already use, unchanged — it asks `game.physics.ground0()` for its own pole, ball and each player's
  // footing every frame, so the gentle slope out here costs nothing extra. Both kids come from this
  // file's own `kid()` helper, the same one every other Frosty Peak child already comes from (which
  // already adds its own rig to the scene, so no separate `W.add()` call was needed here).
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, built
  // the real mountain with `game.start('new')` then `game.travel(5, 'from-hub')`) sampled every NPC's
  // own position every 5th frame over 1500 simulated frames, then swept a grid of the open snowfield
  // (radius 12-56, short of the radius (58) where snowRegion's own fill takes over) against both those
  // samples and every one of the mountain's 388 body-height physics boxes, checking the pole's own spot
  // and both kids' footing 2 m either side of it: (21, -52) came back clear by 9.1 m at its tightest
  // point, east of the marching penguins' own line ((55, -5)-(55, 3)) and well short of where the fill
  // takes over.
  { const tA = kid(false), tB = kid(true);
    game.npcs.push(new Tetherball(game, tA, tB, { x: 21, z: -52,
      cries: ['Round and round — same as every other game on the mountain, just colder.', 'Mind the rope, puss — mittens or not, it still stings.', "Forty wraps. No, forty-one. I keep losing count in the cold."] })); }
  // Whisper Woods got the first archery range (round 525, `Archer`, 55-npcs.js) and nobody else's had
  // one since — Frosty Peak's own hunting lodge feel (the trapper by the fire, the ice fisher on the
  // pond) never got a firing line of its own. **A lone archer now draws and looses at a straw target
  // on a quiet stretch of snowfield southwest of the village**, breath steady, never once hurried.
  // *"Steadiest hands on the mountain, mine."* *"Mind the arrows, puss — none of them are aimed at
  // you."* *"Wind off the peak throws every shot wide, but I keep trying."*
  //
  // No new class and no new prop: the exact same `Archer` (55-npcs.js) and straw-boss-and-rings target
  // Whisper Woods' own range already builds, just a winter wardrobe (`coat: true`, beanie, scarf) in
  // place of the woods' cap and jacket, and `bow: true` for the same longbow prop `makeHuman` already
  // knows how to hold.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(5, 'from-hub')`, with the cat teleported right next to the
  // candidate spot so nothing the engine's own distance culling could hide) sampled every NPC's own
  // position every 7th frame over 2400 simulated frames, then swept the firing line from (-30, -15) to
  // (-30, -25) — archer facing south (`ry = PI`) — against both those samples and every one of the
  // mountain's 323 physics boxes: the line came back clear by 7.28 m of the nearest box along its whole
  // length and 8.61 m of the nearest other soul, at radius 36 m — well south of the fish collectible at
  // (-30, 16) and clear across the map from the tug-of-war (50, 20) and the penguin march (55, -5) to
  // (55, 3), short of the radius (58) where snowRegion's own procedural fill takes over.
  { const ax = -30, az = -15, ary = PI, adist = 10;
    const tx = ax + sin(ary) * adist, tz = az + cos(ary) * adist, ty0 = P.ground0(tx, tz);
    const target = group(tx, ty0, tz, W);
    mesh(G.cyl(0.46, 0.46, 0.22, 16), mat(0xd9c28a, { roughness: 0.95 }), { y: 1.0, rx: PI / 2, parent: target });   // the straw boss
    const ringSpecs = [[0.42, 0xf3f0e6], [0.33, 0x1c1c1c], [0.24, 0x2d6fd6], [0.15, 0xd62839], [0.065, 0xf2c744]];
    ringSpecs.forEach(([rad, c], i) => mesh(G.cyl(rad, rad, 0.02, 20), mat(c, { roughness: 0.7 }), { y: 1.0, z: 0.1 + i * 0.004, rx: PI / 2, shadow: 'none', parent: target }));
    const standM = mat(0x5b3d24, { roughness: 1 });
    for (const s of [1, -1]) mesh(G.cyl(0.02, 0.025, 1.0, 6), standM, { x: s * 0.36, y: 0.55, z: -0.2, rx: 0.3, rz: s * 0.22, parent: target });
    game.physics.addBox(tx, ty0 + 1.0, tz, 0.95, 1.0, 0.3, { cam: false });
    const bowWard = makeWardrobe(r, { shirts: [0x6a5a4a, 0x4a5a6a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const archer = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: r.chance(0.2), wardrobe: bowWard }),
      hat: 'beanie', hatColor: 0x4a5a6a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, bag: null, backpack: null, glasses: false, bow: true });
    W.add(archer.group);
    const arrow = group(0, 0, 0, W);
    mesh(G.cyl(0.012, 0.012, 0.62, 6), mat(0x8a6a3a, { roughness: 0.8 }), { rx: PI / 2, parent: arrow });   // shaft
    mesh(G.cone(0.022, 0.08, 6), mat(0x9aa3ad, { metalness: 0.6, roughness: 0.35 }), { z: -0.35, rx: -PI / 2, parent: arrow });   // head, at local -Z so lookAt() faces it forward
    const fletchM = mat(0xd62839, { roughness: 0.9 });
    for (let fi = 0; fi < 3; fi++) mesh(G.box(0.1, 0.002, 0.05), fletchM, { z: 0.26, rz: fi / 3 * TAU, shadow: 'none', parent: arrow });   // tail fletching
    game.npcs.push(new Archer(game, archer, arrow, { x: ax, z: az, ry: ary, dist: adist,
      cries: ['Steadiest hands on the mountain, mine.', 'Mind the arrows, puss — none of them are aimed at you.', 'Wind off the peak throws every shot wide, but I keep trying.'] })); }
  const C = game.collectibles;
  C.add('fish', 18, 8); C.add('star', 0, -30); C.add('yarn', -16, 4); C.add('mouse', 12, 20); C.add('star', 30, -20); C.add('fish', -30, 16); C.add('yarn', 22, -6); C.add('mouse', -6, 26);
  game.fx.setAmbient({ count: 480, radius: 22, colors: [0xffffff, 0xeaf4ff, 0xdfe8ff], rise: -1.0, drift: 0.5, life: 9, height: 12, yMin: 2 });
  makeDayNight(game, U, W);
  // The Neighborhood has a raccoon, Candy Land a gumdrop toad, Robot City a scrap-bug, Victorian and
  // Whisper Woods both a ladybug, Sunny Shore a tiger beetle — every world had its own small,
  // unregarded floor-level creature except Frosty Peak. A frost beetle now picks its way across the
  // open snow east of the village, a stockier, paler cousin of the ladybug and tiger beetle with a
  // frosted blue-grey shell and a pair of icy-white markings in place of spots. It has no line of its
  // own — it's an insect, not a person — so this is purely a background touch, same family as the
  // ladybug and the fireflies.
  //
  // New build, `makeFrostBeetle()` in `56-npcs-wild.js` right after `makeTigerBeetle()`: the same rig,
  // recoloured and slowed down (a steadier `idle` window and a lower hop, since it's picking across
  // packed snow rather than scurrying on hot sand). No new controller: `Hopper`, already driving every
  // other tiny ground creature in this game, just dialled down the same way the tiger beetle's own hop
  // was.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.load(5, 'from-hub')`, 1200 simulated frames, every NPC's own position
  // sampled every 5th frame) swept the open snowfield east of the village (roughly -40..40 in x,
  // -20..30 in z) against both every one of this world's 743 physics boxes and those samples: (38, 8)
  // came back clear by 7.29 m of the nearest box and 8.25 m of the nearest wandering soul — comfortably
  // past the leash given here, well off the fish collectible at (18, 8), the hares at (45-48, ±2) and
  // every hand-placed prop in the village and archery range. The ground there reads a gentle 0.68 m,
  // consistent with the rest of this stretch of snowfield, not a slope. Built dead last of everything
  // this world adds, right after the day/night cycle and before the squirrel spawn point (which draws
  // no `rnd()` of its own), so `Hopper`'s own three unconditional draws off the shared `rnd()` sequence
  // land after every other NPC in this world that times itself off that same sequence, and disturb
  // nothing built earlier on the mountain.
  //
  // It isn't a friend to meet — same as the ladybug and the tiger beetle — Frosty Peak's own friend
  // count is unaffected.
  { const rig = makeFrostBeetle();
    game.npcs.push(new Hopper(game, rig, { x: 38, z: 8, leash: 1.0, r: 0.08, dist: [0.15, 0.4], dur: 0.26, height: 0.06, idle: [1.5, 4],
      onHop: () => { if (rnd.chance(0.2)) SFX.chitter(); } })); }
  // The Neighborhood, Candy Land, Robot City, Victorian and Sunny Shore have all had a badminton net
  // since round 508's own list of playground games (tetherball, badminton, tug-of-war, archery, sack
  // races) went round every world in turn — Frosty Peak, for all its tug-of-war, archery range,
  // tetherball and curling, never got the other racket game; only Whisper Woods is left owing one now.
  // **Two bundled-up villagers now keep a shuttlecock going over a low net on a quiet stretch of open
  // snowfield south-west of the village**, well past the archery range. *"Mittens are terrible for
  // grip, wonderful for not losing feeling in your fingers."* *"Mind the net, puss — it's the only
  // thing out here taller than a snowman."* *"Thirty-eight. No, thirty-nine — I keep losing count in
  // the cold."*
  //
  // No new class and no new mesh: the exact same `Badminton` (`55-npcs.js`) and `makeVolleyballNet`
  // (`62-props-nature.js`) the other five worlds already use, with `placeT`/`boxT` in place of a flat
  // floor's `place`/`P.addBox` the same way the archery target and every other hand-placed prop on this
  // mountain already accounts for the slope, and a fresh winter wardrobe (`coat: true`, beanie, scarf)
  // in place of the other worlds' bare racket-and-shorts look.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(5, 'from-hub')`) sampled every NPC's own position every 5th
  // frame over 1500 simulated frames, then swept a 1 m grid of the open snowfield (radius 20-52, well
  // short of the radius (58) where snowRegion's own fill takes over) against both those samples and
  // every one of the mountain's 744 physics boxes, checking the net posts and both players' own footing:
  // (-38, -35) came back clear by 6.37 m at its tightest point (a pine trunk at the edge of the ring),
  // with the ground flat to 0.16 m across the whole footprint — south-west of the archery line
  // ((-30,-15)-(-30,-25)), well clear of it and of everything else on the mountain.
  //
  // Built right after the frost beetle, the last thing this world adds before the squirrel spawn point,
  // for the same reason the beetle itself went last: `makeHuman()` draws three values off the *shared*
  // `rnd()` sequence unconditionally, and this spot was chosen with a probe built *after* every earlier
  // NPC's own timing-sensitive pick, so placing it any earlier would have disturbed one of them the same
  // way round 549's own Neighborhood net already warned about.
  { const cx = -38, cz = -35, gap = 5.6, halfW = 1.8;
    const net = makeVolleyballNet(halfW, 0xf0ece4, { postH: 1.6, netH: 0.78 });
    placeT(game, U, net, cx, cz, 0);
    for (const sx of [-halfW, halfW]) boxT(game, cx + sx, cz, 0.16, 1.6, 0.16, { cam: false });
    // the shuttlecock: a pale cork and a flared cone standing in for the feathers, nose staying down
    const shuttle = group(cx, 0, cz, W);
    mesh(G.sphere(0.045, 10, 8), mat(0xf0ead6, { roughness: 0.6 }), { y: 0, parent: shuttle });
    mesh(G.cone(0.075, 0.16, 10), mat(0xfbfaf4, { roughness: 0.8 }), { y: 0.11, rx: PI, parent: shuttle });
    const bmWard = makeWardrobe(r, { shirts: [0x3a6a5a, 0x6a3a5a, 0x5a5a3a], pants: [0x2a2a2a, 0x3a3a3a], shoes: [0x2a2018] });
    const bA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bmWard }),
      hat: 'beanie', hatColor: 0x3a6a5a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, bag: null, backpack: null, glasses: r.chance(0.3), racket: true });
    const bB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: false, elder: false, wardrobe: bmWard }),
      hat: 'beanie', hatColor: 0x6a3a5a, coat: true, scarf: 0xf2ead8, cuffs: 0x3a3a3a, bag: null, backpack: null, glasses: r.chance(0.3), racket: true });
    W.add(bA.group); W.add(bB.group);
    const badmintonLines = ['🏸 "Mittens are terrible for grip, wonderful for not losing feeling in your fingers."', '🏸 "Mind the net, puss — it\'s the only thing out here taller than a snowman."', '🏸 "Thirty-eight. No, thirty-nine — I keep losing count in the cold."'];
    game.npcs.push(new Badminton(game, bA, bB, shuttle, { cx, cz, gap, cries: badmintonLines })); }
  // `SackRace`'s own tour of the seven worlds is down to one now — the Neighborhood, Candy Land,
  // Robot City, Victorian and Sunny Shore all have one of their own; only Whisper Woods is left after
  // this. Frosty Peak, for all its sledder, snowball fight, tug-of-war, tetherball, archery range and
  // now a badminton net too, never had the one race run two hops at a time with both ankles tied
  // together. **Two bundled-up kids now hop a short lane on a quiet, flat stretch of snowfield east of
  // the village**, well past the frost beetle, feet bound ankle to waist in borrowed flour sacks.
  // *"Sand would be easier than snow for this — at least it doesn't melt down your sack."* *"Mind your
  // tail, puss, I can't steer in this thing."* *"Best of three. I'm blaming the drifts if I lose."*
  //
  // No new class and no new mesh: the exact same `SackRace` (`55-npcs.js`) and `makeHuman`'s own
  // `o.sack` option the other five worlds already use. It calls `game.physics.ground0()` for each
  // racer's own footing every frame, the same way this mountain's tug-of-war, tetherball and badminton
  // already handle the real slope underfoot, so nothing extra was needed for terrain.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.travel(5, 'from-hub')` then 2400 simulated frames, every NPC's own position sampled every
  // 10th frame) swept a grid of the open snowfield (radius 28-54, short of the radius (58) where
  // `snowRegion`'s own fill takes over, both lane orientations) against both those samples and every
  // one of the mountain's 746 physics boxes: (41.4, -34.7), lane running along world X (`ry = PI/2`),
  // came back clearest at 7.23 m from the nearest box or soul at its tightest point, with the ground
  // flat to 0.14 m across the whole 5 m lane — well clear of the archery range (55, 3), the tetherball
  // pole (21, -52), the badminton net (-38, -35) and the frost beetle (38, 8).
  //
  // Built dead last, right after the badminton net, for the same reason every other addition at the
  // end of this function already gives: `makeHuman()` draws three values off the shared `rnd()`
  // sequence unconditionally, and a fresh pair of rigs built any earlier on this mountain would shift
  // that sequence and desync every other timing-sensitive pick already placed above.
  { const rx = 41.4, rz = -34.7, rry = Math.PI / 2;
    const sackWard = makeWardrobe(r, { shirts: [0x6a7a5a, 0x5a6a7a, 0x7a6a4a], pants: [0x2a2420, 0x2a2a30], shoes: [0x2a2018, 0x1e1a16] });
    const sackA = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xd9c9a8, hat: 'beanie', hatColor: 0x3a6a5a, coat: true, scarf: 0xd9c9a8, cuffs: 0x3a3a3a, bag: null, backpack: null, glasses: false });
    const sackB = makeHuman({ ...randomPerson(r, { female: r.chance(0.5), child: true, elder: false, wardrobe: sackWard }),
      sack: 0xd9c9a8, hat: 'beanie', hatColor: 0x6a3a5a, coat: true, scarf: 0xf2ead8, cuffs: 0x3a3a3a, bag: null, backpack: null, glasses: false });
    W.add(sackA.group); W.add(sackB.group);
    game.npcs.push(new SackRace(game, sackA, sackB, { x: rx, z: rz, ry: rry,
      cries: ['Sand would be easier than snow for this — at least it doesn\'t melt down your sack.', "Mind your tail, puss, I can't steer in this thing.", 'Best of three. I\'m blaming the drifts if I lose.'] })); }
  // `PogoHopper`'s own tour of the seven worlds was down to two after round 560 — the Neighborhood,
  // Candy Land, Robot City, Sunny Shore and Victorian all have one; only Whisper Woods is left after
  // this. Frosty Peak, for all its sledder, tug-of-war, tetherball, archery range, badminton net and
  // sack race, never had the one game played standing still and bouncing in place. **A bundled-up kid
  // now bounces on a pogo stick on a quiet stretch of open snowfield south of the village**, well clear
  // of the forest ring and every other hand-placed spot on the mountain. *"Boing! Boing! Boing!"*
  // *"One thousand bounces. Not stopping to count again."* *"Don't look — actually, look, I'm good at
  // this."*
  //
  // No new class and no new mesh: the exact same `PogoHopper` (`55-npcs.js`) the Neighborhood, Candy
  // Land, Robot City, Sunny Shore and Victorian already use, unchanged — it asks
  // `game.physics.ground0()` for its own footing every frame, so the slope out here costs nothing
  // extra, the same way the tug-of-war, tetherball, badminton and sack race already handle it. The kid
  // comes from this file's own `kid()` helper (coat and beanie already on), the same one every other
  // Frosty Peak child already comes from.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses, the
  // real mountain built with `game.start('new')` then `game.travel(5, 'from-hub')`, 2400 simulated
  // frames to let every reindeer, hare, arctic fox, penguin, yeti and wandering villager actually move)
  // sampled every NPC's own position every 10th frame, then swept a grid of the open snowfield (radius
  // 30-56, short of the radius (58) where `snowRegion`'s own fill takes over) against both those
  // samples and every one of the mountain's physics boxes: (6.5, -42) came back clearest, 11.8 m from
  // the nearest box (a pine trunk in the forest ring) and 11.7 m from the nearest other soul, at radius
  // 42.5 from the origin — well clear of the archery range, the badminton net, the tetherball pole,
  // the sack race and the frost beetle.
  //
  // Built dead last, right after the sack race, for the same reason every other addition at the end of
  // this function already gives: `makeHuman()` draws three values off the shared `rnd()` sequence
  // unconditionally, and a fresh rig built any earlier on this mountain would shift that sequence and
  // desync every other timing-sensitive pick already placed above.
  { const pogoKid = kid(r.chance(0.5));
    game.npcs.push(new PogoHopper(game, pogoKid, r.pick([0xff6f3c, 0x3fae9a, 0xf2c744]), { x: 6.5, z: -42, ry: r.range(0, TAU),
      cries: ['Boing! Boing! Boing!', "One thousand bounces. Not stopping to count again.", "Don't look — actually, look, I'm good at this."] })); }
  // round 567's own log entry claimed the "one more playground game for every world" piñata series
  // (`PinataSwinger` in `55-npcs.js`, `makePinata` in `60-props.js`) had reached all seven worlds; that
  // was wrong, and round 568 corrected it to say Frosty Peak was the one real gap left. This closes it.
  // **A piñata now hangs from a post on the open snowfield northeast of the village**, a bundled-up kid
  // taking a two-handed swing at it. *"Snap it open before my mittens freeze solid, would you."* *"Mind
  // your tail, puss — plenty of swing room needed here."* *"One more go. I know I can connect this time."*
  //
  // No new class and no new mesh: the exact same `PinataSwinger` and `makePinata` the other six worlds
  // already use, just a fresh post, a fresh kid and this mountain's own red/white/gold/ice-blue colours
  // in place of any other world's own palette. `PinataSwinger`'s own constructor already asks
  // `game.physics.ground0()` for the swinger's footing, the same way this mountain's tug-of-war,
  // tetherball, badminton, sack race and pogo stick already handle the real slope underfoot, so nothing
  // extra was needed for terrain; only the post itself needed `placeT`/`boxT` in place of the flat-floor
  // worlds' `group()` + `P.addBox()`.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses,
  // `game.start('new')` then `game.travel(5, 'from-hub')` — waiting out the portal's own 520 ms fade
  // timer before sampling, the mistake round 567's own first draft made — then 2400 simulated frames to
  // let every reindeer, hare, arctic fox, penguin, yeti and wandering villager actually move) sampled
  // every NPC's own position every 10th frame, then swept a 1 m grid of the open snowfield (radius
  // 20-54, short of the radius (58) where `snowRegion`'s own fill takes over) against both those samples
  // and every one of the mountain's 746 physics boxes, measuring real clearance to each box's own edge
  // rather than its centre: (41, 34) came back clearest at 10.3 m from the nearest box or soul — well
  // clear of the frost beetle (38, 8), the archery range (55, 3) and every other hand-placed spot, all
  // of which sit south or east of it; the ground underfoot slopes gently (about 0.15 m per metre) with
  // no outcrop or pine trunk within 11 m.
  //
  // Built dead last, right after the pogo stick, for the usual reason: `makeHuman()` (which this file's
  // own `kid()` wraps) draws three values off the shared `rnd()` sequence unconditionally, and a fresh
  // rig built any earlier on this mountain would shift that sequence and desync every other
  // timing-sensitive pick already placed above.
  { const px = 41, pz = 34, postH = 2.2, outer = 0.4, ropeLen = 0.45;
    const SNOW_FRINGE = [0xd62839, 0xffffff, 0xffd54a, 0x8fd9ff];
    const postM = mat(0x6b4a2a, { roughness: 0.9 });
    const standG = group();
    mesh(G.cyl(0.07, 0.09, postH, 8), postM, { y: postH / 2, parent: standG });
    const pivot = group(0, postH, 0, standG);
    mesh(G.cyl(0.012, 0.012, ropeLen, 5), mat(0xe8d9a0, { roughness: 0.9 }), { y: -ropeLen / 2, parent: pivot });
    const pinata = makePinata(0x2e9e6e, SNOW_FRINGE);
    pinata.position.y = -(ropeLen + outer); pivot.add(pinata);
    let lt = 0;
    standG.userData.update = (dt) => {
      lt += dt;
      const cyc = 2.6, ph = (lt % cyc) / cyc, sinceHit = ph < 0.65 ? (ph + 0.35) * cyc : (ph - 0.65) * cyc;
      pivot.rotation.z = sin(lt * 0.5) * 0.04 + Math.exp(-sinceHit * 2.6) * 0.3;
      pivot.rotation.x = sin(lt * 0.4 + 1) * 0.025;
    };
    placeT(game, U, standG, px, pz, 0);
    boxT(game, px, pz, 0.35, postH, 0.35, { cam: false });
    const sx = px, sz = pz + 1.3, sry = atan2(px - sx, pz - sz);
    const swinger = kid(r.chance(0.5));
    game.npcs.push(new PinataSwinger(game, swinger, 0x8a6a44, { x: sx, z: sz, ry: sry,
      cries: ["Snap it open before my mittens freeze solid, would you.", 'Mind your tail, puss — plenty of swing room needed here.', 'One more go. I know I can connect this time.'] })); }
  // Sunny Shore (round 591), the Neighborhood (592), Victorian (596), Candy Land (597) and Robot City
  // (598) have all let somebody digging nearby beat their own long-suffering `Detectorist` to real
  // treasure; Frosty Peak's own searcher, still sweeping the snow west of the reindeer herd at (-30,
  // -9), hunting a bell shaken loose off a harness, was one of the two worlds left without one.
  // **A bundled-up kid has struck real gold with nothing but a shovel**, out past the archery range on
  // the open snowfield south-west of the village: an old wooden chest lies open in the snow, lid thrown
  // back over a heap of coins, a shovel stuck in beside it and a handful of loose coins and gems
  // scattered where they rolled. *"Everybody else got a bell buckle. I got THIS."* *"Careful, puss —
  // don't you dare knock a single coin back into the snow."* *"Don't tell the searcher. He'll never
  // forgive himself."*
  //
  // Reuses round 591's `makeTreasureChest()` and `makeShovel()` (`62-props-nature.js`) and
  // `makeGemCluster()` (`60-props.js`) exactly as the other four digs already do — no new prop, no new
  // mesh. `placeT`/`boxT` stand in for the flat-floor worlds' `place()`/`P.addBox()` the same way every
  // other hand-placed prop on this mountain already accounts for the slope; `makeGemCluster()` and
  // `Kneeler` both call `game.physics.ground0()` for their own footing already, so nothing extra was
  // needed there. The finder is this file's own `kid()` wardrobe helper (coat and beanie already on),
  // the same one every other Frosty Peak child already comes from, rather than a fresh build.
  //
  // A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
  // `game.start('new')`, `game.travel(5, 'from-hub')` — waiting out the real 520 ms portal-fade timer
  // before sampling — then 2400 simulated frames with every NPC's own position sampled every 8th frame)
  // swept a 1 m grid of the open snowfield (radius 8-56, short of the radius (58) where `snowRegion`'s
  // own fill takes over, and clear of every zone span) against both those 28,200 samples and all 747 of
  // the mountain's own physics boxes, staying 6-16 m from the searcher's own spot so the joke still
  // reads without either "Say hello" circle (2.1 m each) coming near the other's: (-39, -18) came back
  // clearest, 5.24 m from the nearest box (a pine trunk in the forest ring) and 9.49 m from the nearest
  // other soul (the archer at (-30, -15)) — 12.7 m from the searcher himself, south-west of the
  // badminton net (-38, -35) and well clear of it.
  //
  // Built dead last, right after the piñata, the usual reason: `makeHuman()` (which this file's own
  // `kid()` wraps) draws three values off the shared `rnd()` sequence unconditionally, and a fresh rig
  // built any earlier on this mountain would shift that sequence and desync every other
  // timing-sensitive pick already placed above.
  { const tx = -39, tz = -18, kx = tx + 1.3, kz = tz + 0.5, kry = atan2(tx - kx, tz - kz);
    const chest = makeTreasureChest(); placeT(game, U, chest, tx, tz, 0.4);
    boxT(game, tx, tz, 1.0, 0.7, 0.7, { cam: false });
    const shovel = makeShovel(); placeT(game, U, shovel, tx + 0.75, tz - 0.6, 0.6);
    makeGemCluster(game, U, tx + 0.4, tz + 0.9, 4, [0xd4af37, 0xc0c0c0, 0xffd54a], r, 0.9);
    const digger = kid(r.chance(0.5));
    game.npcs.push(new Kneeler(game, digger, { x: kx, z: kz, ry: kry, cryIcon: '💰',
      cries: ['Everybody else got a bell buckle. I got THIS.', "Careful, puss — don't you dare knock a single coin back into the snow.", "Don't tell the searcher. He'll never forgive himself."] })); }
  const spawn = spawnBySquirrel(game, sq);
  return { update: (dt, t) => { for (const f of U) f(dt, t); }, spawn };
}
