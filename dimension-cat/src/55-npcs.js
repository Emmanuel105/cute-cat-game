// ============================================================================
// CREATURES — rigs (models with animate()) and controllers (AI)
// All rigs face +Z in local space; controllers set group.rotation.y = heading.
// ============================================================================
// ---------------------------------------------------------------- human rig
const SKIN_TONES = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0x6b4423, 0xa9714b, 0xf6d5b8];
const HAIR_COLORS = [0x2b1b12, 0x5a3a1a, 0xd8b06a, 0x1a1a1a, 0xa0522d, 0x777777, 0x3a2418, 0xc97f3a, 0xe8d7a8, 0x4a2c2a];
const HAIR_STYLES = ['short', 'crop', 'bob', 'long', 'pony', 'bun', 'braids', 'curls'];
/** Hair that reads as feminine at a glance — used when picking a look for a woman. */
const LONG_STYLES = ['bob', 'long', 'pony', 'bun', 'braids', 'curls'];
/**
 * The wardrobe. Worlds draw from these through `bag()`, so a street full of people wears a street
 * full of different clothes instead of whatever an unlucky run of the dice hands out.
 */
const SHIRT_COLORS = [0x3f6fd6, 0xe0503c, 0x2e9e6e, 0xf2c744, 0x8a5acf, 0xf7f3ec, 0xff8fab, 0x35b4c4, 0xef7d2f, 0x6b7fd7, 0xb5485f, 0x4c6b3c];
const PANTS_COLORS = [0x2c3140, 0x5a4634, 0x8899aa, 0x1e2a44, 0x6b5b4a, 0x3c4a5a, 0x7a6a58, 0x2f3b33];
const SHOE_COLORS = [0x1e1a18, 0x3a2a1e, 0x5a4030, 0xefe7d8, 0x8a2f2f, 0x27354a];
const MOUTH_SHAPES = ['smile', 'smile', 'smile', 'grin', 'small', 'open'];
/** Head radius for every human rig; every face and hat measurement is a multiple of it. */
const HEAD_R = 0.163;

/**
 * A cartoon face on a head group of radius R. Everything is a multiple of R, and the parts that vary
 * from person to person — eye size and spacing, brow angle, the mouth, glasses, freckles, a beard —
 * come in through `o`, because a crowd of identical faces is what makes NPCs read as clones.
 * Returns the parts the rig animates (blinking).
 */
function makeFace(head, R, skinM, hairM, o = {}) {
  const white = basic(0xffffff), iris = mat(o.eye ?? 0x2a1a12, { roughness: 0.3 }), spark = basic(0xffffff);
  const lipM = mat(o.lip ?? 0xc25b62, { roughness: 0.6 }), blushM = mat(skinM.color.clone().lerp(new THREE.Color(0xff8f9e), 0.5).getHex(), { roughness: 1 });
  const eyeR = R * (o.eyeSize ?? 0.25), gap = R * (o.eyeGap ?? 0.36), browTilt = o.brow ?? 0.16;
  const eyes = [];
  for (const side of [1, -1]) {
    const e = group(side * gap, -R * 0.05, R * 0.76, head);
    mesh(G.sphere(eyeR, 12, 10), white, { sz: 0.5, shadow: 'none', parent: e });
    mesh(G.sphere(eyeR * 0.54, 8, 7), iris, { z: eyeR * 0.4, sz: 0.55, shadow: 'none', parent: e });
    mesh(G.sphere(eyeR * 0.19, 6, 5), spark, { x: side * eyeR * 0.24, y: eyeR * 0.28, z: eyeR * 0.56, shadow: 'none', parent: e });
    eyes.push(e);
    mesh(G.box(R * 0.4, R * 0.075, R * 0.06), hairM, { x: side * gap, y: R * 0.24 + eyeR * 0.5, z: R * 0.86, rz: side * browTilt, shadow: 'none', parent: head });   // brow
    mesh(G.sphere(R * 0.2, 8, 6), blushM, { x: side * R * 0.62, y: -R * 0.3, z: R * 0.66, sz: 0.28, shadow: 'none', parent: head });                               // blush
    mesh(G.sphere(R * 0.17, 8, 7), skinM, { x: side * R * 0.93, y: -R * 0.04, sx: 0.5, sz: 0.85, shadow: 'none', parent: head });                                  // ear
  }
  mesh(G.sphere(R * 0.14, 8, 7), skinM, { y: -R * 0.18, z: R * 0.9, sz: 0.9, shadow: 'none', parent: head });                                                      // nose
  switch (o.mouth) {
    case 'grin':
      mesh(G.torus(R * 0.3, R * 0.055, 5, 14, PI), lipM, { y: -R * 0.32, z: R * 0.8, rz: PI, shadow: 'none', parent: head });
      mesh(G.box(R * 0.44, R * 0.08, R * 0.03), basic(0xfffdf8), { y: -R * 0.28, z: R * 0.87, shadow: 'none', parent: head });      // a line of teeth
      break;
    case 'small': mesh(G.sphere(R * 0.1, 8, 6), lipM, { y: -R * 0.37, z: R * 0.87, sz: 0.45, shadow: 'none', parent: head }); break;
    case 'open': mesh(G.sphere(R * 0.14, 10, 8), lipM, { y: -R * 0.37, z: R * 0.84, sy: 0.85, sz: 0.5, shadow: 'none', parent: head }); break;
    default: mesh(G.torus(R * 0.26, R * 0.05, 5, 14, PI), lipM, { y: -R * 0.36, z: R * 0.8, rz: PI, shadow: 'none', parent: head });
  }
  if (o.freckles) {
    const fk = mat(0xb5714a, { roughness: 1 });
    for (const side of [1, -1]) for (let i = 0; i < 3; i++) mesh(G.sphere(R * 0.036, 5, 4), fk, { x: side * (R * 0.42 + i * R * 0.15), y: -R * 0.14 + (i % 2) * R * 0.09, z: R * 0.79, shadow: 'none', parent: head });
  }
  if (o.beard) {
    mesh(G.torus(R * 0.8, R * 0.24, 6, 16, PI), hairM, { y: -R * 0.64, z: R * 0.02, rx: -PI / 2, sy: 0.85, shadow: 'none', parent: head });   // a band round the jaw, under the mouth
    mesh(G.sphere(R * 0.4, 8, 7), hairM, { y: -R * 0.86, z: R * 0.42, sz: 0.8, shadow: 'none', parent: head });                          // chin
    mesh(G.box(R * 0.46, R * 0.1, R * 0.08), hairM, { y: -R * 0.24, z: R * 0.88, shadow: 'none', parent: head });                    // moustache
  } else if (o.moustache) {
    mesh(G.box(R * 0.5, R * 0.11, R * 0.08), hairM, { y: -R * 0.25, z: R * 0.88, shadow: 'none', parent: head });
  }
  if (o.glasses) {
    const fr = mat(o.glassColor ?? 0x33302c, { roughness: 0.4 });
    for (const side of [1, -1]) mesh(G.torus(eyeR * 1.24, R * 0.032, 4, 14), fr, { x: side * gap, y: -R * 0.05, z: R * 0.84, shadow: 'none', parent: head });
    mesh(G.box(gap * 0.7, R * 0.028, R * 0.028), fr, { y: -R * 0.05, z: R * 0.87, shadow: 'none', parent: head });                   // bridge
    for (const side of [1, -1]) mesh(G.box(R * 0.03, R * 0.028, R * 0.4), fr, { x: side * R * 0.72, y: -R * 0.05, z: R * 0.66, shadow: 'none', parent: head });   // temples
  }
  return { eyes };
}

/**
 * Hair for a head of radius R. Everything but the skull cap sits behind z=0 so it can never cover the
 * face; the silhouette is what tells people apart at a distance.
 */
function makeHair(head, R, hairM, style) {
  if (style === 'bald') return;
  mesh(G.dome(R * 1.05, 16, 10), hairM, { y: R * 0.2, sy: 0.95, parent: head });    // skull cap, sits above the brows
  mesh(G.sphere(R * 0.85, 12, 10), hairM, { y: R * 0.1, z: -R * 0.42, sz: 0.85, parent: head });   // back of the head
  mesh(G.sphere(R * 0.62, 12, 9), hairM, { y: R * 0.42, z: R * 0.6, sx: 1.35, sy: 0.6, sz: 0.55, parent: head });   // a fringe, so the hairline is not a bare rim
  if (style === 'crop') return;
  const curtain = (len, drop) => { for (const side of [1, -1]) mesh(G.capsule(R * 0.3, len * R, 8), hairM, { x: side * R * 0.82, y: -drop * R, z: -R * 0.22, sx: 0.8, sz: 0.75, parent: head }); };
  if (style === 'short') { mesh(G.sphere(R * 0.62, 10, 8), hairM, { y: R * 0.32, z: -R * 0.55, parent: head }); return; }
  if (style === 'bob') { curtain(1.1, 0.7); mesh(G.sphere(R * 1.0, 14, 10), hairM, { y: -R * 0.35, z: -R * 0.5, sy: 0.9, sz: 0.8, parent: head }); return; }
  if (style === 'long') { curtain(1.8, 1.1); mesh(G.capsule(R * 0.85, R * 2.4, 12), hairM, { y: -R * 1.5, z: -R * 0.5, sx: 1.05, sz: 0.5, parent: head }); return; }
  if (style === 'pony') { mesh(G.capsule(R * 0.36, R * 1.9, 10), hairM, { y: -R * 0.75, z: -R * 1.15, rx: -0.4, parent: head }); mesh(G.torus(R * 0.3, R * 0.07, 6, 14), mat(0xff6fb5, { roughness: 0.8 }), { y: R * 0.22, z: -R * 0.85, rx: 0.5, shadow: 'none', parent: head }); return; }
  if (style === 'bun') { mesh(G.sphere(R * 0.55, 12, 10), hairM, { y: R * 0.75, z: -R * 0.62, parent: head }); return; }
  if (style === 'braids') { for (const side of [1, -1]) { mesh(G.capsule(R * 0.26, R * 1.4, 8), hairM, { x: side * R * 0.86, y: -R * 0.95, z: -R * 0.3, rz: side * 0.14, parent: head }); mesh(G.sphere(R * 0.2, 8, 6), mat(0xff6fb5, { roughness: 0.8 }), { x: side * R * 1.0, y: -R * 1.75, z: -R * 0.3, shadow: 'none', parent: head }); } return; }
  if (style === 'curls') { for (let i = 0; i < 10; i++) { const a = 0.5 + i / 10 * (TAU - 1.0); mesh(G.sphere(R * 0.4, 8, 7), hairM, { x: sin(a) * R * 0.88, y: R * 0.32 + sin(i * 2.1) * R * 0.22, z: -cos(a) * R * 0.88 - R * 0.06, parent: head }); } }
}

/**
 * A townsperson. Proportions come from `o.height` and `o.build` ('slim' | 'average' | 'stout');
 * anyone much shorter than an adult also gets a child's larger head and shorter limbs, so the
 * kids in a crowd read as kids rather than as small adults.
 *
 * Clothes are layered on the same body: `shirt` always, then optionally `jacket`, `dress`, `skirt`,
 * `shorts`, `apron`, `scarf`, `bag`. Hands are mittens with a thumb — an arm that ends in nothing
 * is what made the old rig look like a paper doll.
 */
function makeHuman(o = {}) {
  const g = new THREE.Group(), H = o.height ?? 1.75, k = H / 1.75, female = !!o.female;
  const skinM = mat(o.skin ?? 0xe0ac69, { roughness: 0.8 }), shirtM = mat(o.shirt ?? 0x3f6fd6), pantsM = mat(o.pants ?? 0x2c3140), shoeM = mat(o.shoes ?? 0x1e1a18);
  const hairM = mat(o.hair ?? 0x2b1b12), hatM = mat(o.hatColor ?? 0x111111, { roughness: 0.5 });
  const jacketM = o.jacket ? mat(o.jacket) : null;
  const rig = { group: g, legs: [], arms: [], hands: [], k, look: o };   // `look` is kept for the tests and QA line-ups
  const body = group(0, 0, 0, g); rig.body = body;
  body.scale.setScalar(k);
  // a child is not a scaled-down adult: the head keeps more of its size and the limbs lose some
  const childish = clamp((1.62 - H) / 0.5, 0, 1);
  const build = o.build ?? 'average', stout = build === 'stout' ? 1 : 0, slim = build === 'slim' ? 1 : 0;
  const girth = 1 + stout * 0.28 - slim * 0.12;
  const R = HEAD_R, hipW = (female ? 0.084 : 0.08) * (1 + stout * 0.2), shW = (female ? 0.2 : 0.225) * girth, bare = o.dress || o.skirt;
  // ---- legs: hip 0.90 → knee 0.50 → ankle 0.10, so the soles sit flat on the ground
  for (const side of [1, -1]) {
    const hip = group(side * (o.dress ? 0.075 : hipW), 0.9, 0, body);
    mesh(G.capsule(bare ? 0.068 : 0.088 * girth, 0.24), bare ? skinM : pantsM, { y: -0.2, parent: hip });
    const knee = group(0, -0.4, 0, hip);
    mesh(G.capsule(bare ? 0.057 : 0.072 * girth, 0.26), o.shorts || bare ? skinM : pantsM, { y: -0.2, parent: knee });
    const ankle = group(0, -0.4, 0, knee);
    if (!bare && !o.shorts) mesh(G.capsule(0.072 * girth, 0.03, 8), pantsM, { y: 0.06, sy: 0.9, parent: ankle });     // trouser cuff over the shoe
    mesh(G.box(0.1, 0.055, 0.2), shoeM, { y: -0.072, z: 0.042, parent: ankle });                                      // sole
    mesh(G.sphere(0.052, 10, 8), shoeM, { y: -0.052, z: 0.122, sy: 0.85, sz: 0.9, parent: ankle });                   // rounded toe
    mesh(G.box(0.094, 0.05, 0.075), shoeM, { y: -0.018, z: -0.008, parent: ankle });                                  // heel cup
    rig.legs.push({ hip, knee, ankle });
  }
  // ---- pelvis + torso: a chest that tapers to a waist, not a slab
  mesh(G.capsule(0.13 * girth, 0.1, 12), o.skirt ? mat(o.skirt) : pantsM, { y: 0.97, sz: 0.62, rz: PI / 2, parent: body });
  if (o.dress) {
    mesh(G.cyl(0.23 * girth, 0.44, 0.92, 16), mat(o.dress), { y: 0.56, parent: body });
    mesh(G.cyl(0.455, 0.44, 0.06, 16), mat(o.dress, { roughness: 1 }), { y: 0.12, shadow: 'none', parent: body });      // hem
    if (o.sash) mesh(G.torus(0.2, 0.028, 6, 18), mat(o.sash), { y: 1.02, rx: PI / 2, sz: 0.66, shadow: 'none', parent: body });
  } else if (o.skirt) mesh(G.cyl(0.18 * girth, 0.31, 0.36, 16), mat(o.skirt), { y: 0.9, parent: body });
  const torsoM = jacketM ?? shirtM;
  mesh(G.capsule(0.152 * girth, o.coat ? 0.34 : 0.2, 14), torsoM, { y: o.coat ? 1.14 : 1.2, sx: female ? 1.02 : 1.16, sz: 0.66, parent: body });
  mesh(G.capsule(0.125 * girth, 0.1, 12), torsoM, { y: 1.4, sx: 1.55, sz: 0.68, rz: PI / 2, parent: body });            // shoulder yoke
  if (jacketM) {   // an open jacket: two front panels with the shirt showing between them
    for (const side of [1, -1]) mesh(G.box(0.1, 0.4, 0.04), jacketM, { x: side * 0.1, y: 1.18, z: 0.115 * girth, rz: side * 0.04, parent: body });
    mesh(G.capsule(0.08, 0.26, 10), shirtM, { y: 1.19, sx: 1.0, sz: 0.45, z: 0.09, shadow: 'none', parent: body });
  }
  if (o.stripes) {   // a striped top: three bands round the chest
    const bandM = mat(o.stripes, { roughness: 0.9 });
    for (let i = 0; i < 3; i++) mesh(G.capsule(0.153 * girth, 0.028, 12), bandM, { y: 1.08 + i * 0.11, sx: female ? 1.02 : 1.16, sz: 0.665, shadow: 'none', parent: body });
  }
  if (o.apron) {
    mesh(G.box(0.24, 0.42, 0.03), mat(o.apron), { y: 1.02, z: 0.11 * girth, parent: body });
    mesh(G.box(0.3, 0.04, 0.03), mat(o.apron), { y: 1.22, z: 0.115 * girth, shadow: 'none', parent: body });
  }
  if (o.belt) mesh(G.capsule(0.14 * girth, 0.09, 12), mat(o.belt, { roughness: 0.5 }), { y: 1.06, sx: 1.06, sz: 0.68, rz: PI / 2, shadow: 'none', parent: body });
  if (o.buttons) { const bm = mat(o.buttons, { roughness: 0.4 }); for (let i = 0; i < 3; i++) mesh(G.sphere(0.017, 6, 5), bm, { y: 1.07 + i * 0.12, z: 0.108 * girth, sz: 0.5, shadow: 'none', parent: body }); }
  // collar, so the shirt does not simply stop at the neck
  mesh(G.torus(0.07, 0.024, 5, 14), torsoM, { y: 1.5, rx: PI / 2, sz: 0.8, shadow: 'none', parent: body });
  if (o.scarf) {
    const sc = mat(o.scarf, { roughness: 0.95 });
    mesh(G.torus(0.082, 0.04, 6, 16), sc, { y: 1.565, rx: PI / 2, sz: 0.85, parent: body });
    mesh(G.box(0.07, 0.24, 0.035), sc, { x: 0.05, y: 1.38, z: 0.1, rz: 0.12, parent: body });
  }
  if (o.bag) {   // a satchel on a strap across the chest
    const bg = mat(o.bag, { roughness: 0.85 });
    mesh(G.box(0.035, 0.4, 0.02), bg, { x: -0.03, y: 1.24, z: 0.1, rz: -0.42, shadow: 'none', parent: body });
    mesh(G.box(0.2, 0.17, 0.09), bg, { x: 0.19, y: 1.04, z: 0.02, parent: body });
  }
  if (o.backpack) { const bp = mat(o.backpack, { roughness: 0.9 }); mesh(G.box(0.26, 0.3, 0.14), bp, { y: 1.2, z: -0.15 * girth, parent: body }); mesh(G.box(0.2, 0.04, 0.03), bp, { y: 1.28, z: -0.225 * girth, shadow: 'none', parent: body }); }
  // ---- arms: sleeve, forearm, and a mitten hand with a thumb
  const sleeveM = o.dress && !o.coat ? mat(o.dress) : (jacketM ?? shirtM);
  for (const side of [1, -1]) {
    const sh = group(side * shW, 1.41, 0, body);
    mesh(G.capsule(0.052 * girth, 0.2), sleeveM, { y: -0.14, parent: sh });
    const el = group(0, -0.29, 0, sh);
    mesh(G.capsule(0.046 * girth, 0.18), o.coat || o.sleeves ? sleeveM : skinM, { y: -0.12, parent: el });
    if (o.cuffs) mesh(G.capsule(0.05 * girth, 0.02, 8), mat(o.cuffs), { y: -0.21, shadow: 'none', parent: el });
    const hand = group(0, -0.28, 0, el);
    mesh(G.sphere(0.056, 10, 8), skinM, { sx: 0.82, sz: 0.66, parent: hand });
    mesh(G.capsule(0.019, 0.024, 6), skinM, { x: side * 0.04, y: 0.012, z: 0.016, rz: side * 0.8, shadow: 'none', parent: hand });   // thumb
    rig.hands.push(hand);
    if (o.cane && side === -1) mesh(G.cyl(0.013, 0.013, 0.86, 6), mat(0x3a2718), { y: -0.3, z: 0.08, parent: hand });
    rig.arms.push({ sh, el });
  }
  mesh(G.cyl(0.05, 0.058, 0.14, 8), skinM, { y: 1.53, parent: body });            // neck: 5 cm of it shows between the collar and the chin
  const head = group(0, 1.735, 0, body); rig.head = head;
  head.scale.setScalar(1 + childish * 0.2);
  mesh(G.sphere(R, 18, 14), skinM, { sy: 1.02, sz: 0.94, parent: head });
  rig.eyes = makeFace(head, R, skinM, hairM, {
    lip: female ? 0xd05a70 : 0xb5544f, eye: o.eyeColor, mouth: o.mouth, eyeSize: o.eyeSize ?? (0.25 + childish * 0.04),
    eyeGap: o.eyeGap, brow: o.brow, freckles: o.freckles, glasses: o.glasses, glassColor: o.glassColor,
    beard: o.beard, moustache: o.moustache,
  }).eyes;
  const style = o.hairStyle ?? (female ? 'long' : 'short');
  if (o.hat === 'bonnet') {
    makeHair(head, R, hairM, style === 'short' ? 'bob' : style);
    mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.18, z: -R * 0.16, sy: 1.05, parent: head });
    mesh(G.torus(R * 1.16, R * 0.13, 6, 22, PI), hatM, { y: R * 0.14, z: R * 0.04, rx: -0.28, parent: head });
    mesh(G.cyl(R * 0.05, R * 0.05, R * 1.1, 6), hatM, { x: R * 0.92, y: -R * 0.5, rz: 0.26, shadow: 'none', parent: head });
  } else {
    makeHair(head, R, hairM, style);
    if (o.hat === 'top') { const hat = group(0, 0, 0, head); rig.hat = hat; mesh(G.cyl(R * 1.5, R * 1.5, R * 0.14, 16), hatM, { y: R * 0.72, parent: hat }); mesh(G.cyl(R * 0.95, R * 1.02, R * 1.6, 16), hatM, { y: R * 1.52, parent: hat }); mesh(G.torus(R * 0.98, R * 0.09, 6, 20), mat(o.hatBand ?? 0x8b1a1a), { y: R * 0.86, rx: PI / 2, shadow: 'none', parent: hat }); }
    if (o.hat === 'cap') { mesh(G.dome(R * 1.1, 14, 9), hatM, { y: R * 0.14, parent: head }); mesh(G.box(R * 1.2, R * 0.13, R * 0.75), hatM, { y: R * 0.28, z: R * 0.98, rx: -0.12, parent: head }); }
    if (o.hat === 'beanie') { mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.02, sy: 1.15, parent: head }); mesh(G.torus(R * 1.08, R * 0.16, 6, 18), hatM, { y: R * 0.06, rx: PI / 2, shadow: 'none', parent: head }); mesh(G.sphere(R * 0.3, 8, 6), mat(0xffffff, { roughness: 1 }), { y: R * 1.2, shadow: 'none', parent: head }); }
    if (o.hat === 'sunhat') { mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.14, parent: head }); mesh(G.cyl(R * 2.1, R * 2.1, R * 0.12, 18), hatM, { y: R * 0.2, parent: head }); mesh(G.torus(R * 1.05, R * 0.13, 6, 18), mat(0xd62839), { y: R * 0.34, rx: PI / 2, shadow: 'none', parent: head }); }
    if (o.hat === 'flatcap') { mesh(G.dome(R * 1.12, 14, 9), hatM, { y: R * 0.1, sy: 0.72, parent: head }); mesh(G.box(R * 1.15, R * 0.1, R * 0.62), hatM, { y: R * 0.2, z: R * 0.95, rx: -0.2, parent: head }); }
  }
  // ---- animation. Walk swings the limbs; standing still, people shift their weight, glance
  // around and occasionally wave, which is most of what stops a crowd looking like mannequins.
  const legSwing = o.dress ? 0.32 : 1;
  const restArm = 0.34;      // elbows are never locked straight
  rig.blinkT = rnd.range(1, 5);
  rig.idleT = rnd.range(3, 11);
  rig.gesture = null; rig.gT = 0; rig.sway = rnd.range(0, TAU);
  rig.animate = (ph, moving, dt, t = 0) => {
    // pick something to do while standing around
    if (!moving) {
      rig.idleT -= dt;
      if (rig.idleT <= 0 && !rig.gesture) { rig.gesture = rnd.pick(['wave', 'look', 'nod', 'shift', 'shift']); rig.gT = 0; rig.idleT = rnd.range(5, 14); }
    } else if (rig.gesture !== 'wave') rig.gesture = null;
    let waveArm = 0, nod = 0, turn = 0, lean = 0;
    if (rig.gesture) {
      rig.gT += dt;
      const u = rig.gT / 1.6;                       // every gesture runs for 1.6s
      const swell = sin(clamp(u, 0, 1) * PI);       // eases in and back out
      if (rig.gesture === 'wave') { waveArm = swell; turn = swell * 0.18; }
      else if (rig.gesture === 'look') turn = sin(rig.gT * 2.2) * swell * 0.7;
      else if (rig.gesture === 'nod') nod = sin(rig.gT * 5.5) * swell * 0.22;
      else if (rig.gesture === 'shift') lean = swell * 0.05;
      if (u >= 1) rig.gesture = null;
    }
    for (let i = 0; i < 2; i++) {
      const p = ph + i * PI, L = rig.legs[i], A = rig.arms[i];
      if (moving) {
        L.hip.rotation.x = -sin(p) * 0.5 * legSwing;
        L.knee.rotation.x = max(0, cos(p)) * 0.95 * legSwing;
        L.ankle.rotation.x = -L.knee.rotation.x * 0.45 + sin(p) * 0.12;      // the foot stays level as the knee bends
        A.sh.rotation.x = sin(p) * 0.42;
        A.el.rotation.x = -restArm - max(0, sin(p)) * 0.25;
      } else {
        L.hip.rotation.x = damp(L.hip.rotation.x, 0, 8, dt);
        L.knee.rotation.x = damp(L.knee.rotation.x, 0, 8, dt);
        L.ankle.rotation.x = damp(L.ankle.rotation.x, 0, 8, dt);
        // the raised arm waves; the other one rests
        const waving = waveArm > 0 && i === 0;
        A.sh.rotation.x = damp(A.sh.rotation.x, waving ? -2.5 * waveArm : 0, 8, dt);
        A.el.rotation.x = damp(A.el.rotation.x, waving ? -0.5 - sin(rig.gT * 11) * 0.35 : -restArm, 10, dt);
      }
      // arms hang a little away from the body, more so on a stouter build
      A.sh.rotation.z = (i ? -1 : 1) * (0.19 + stout * 0.1 + (waveArm > 0 && i === 0 ? waveArm * 0.5 : 0));
      A.el.rotation.z = (i ? 1 : -1) * 0.1;      // forearms angle back in toward the hips
    }
    // blink: both eyes squash flat for a moment, every few seconds
    rig.blinkT -= dt;
    const shut = rig.blinkT < 0 && rig.blinkT > -0.12 ? 0.08 : 1;
    if (rig.blinkT < -0.12) rig.blinkT = rnd.range(1.8, 6);
    for (const e of rig.eyes) e.scale.y = damp(e.scale.y, shut, 30, dt);
    if (moving) {
      body.position.y = abs(sin(ph)) * 0.035 * k;
      body.rotation.z = damp(body.rotation.z, 0, 8, dt);
      head.rotation.y = damp(head.rotation.y, 0, 8, dt);
      head.rotation.x = damp(head.rotation.x, 0, 8, dt);
      head.rotation.z = sin(ph) * 0.03;
    } else {
      // a slow breathing sway, so nobody is ever perfectly still
      rig.sway += dt * 0.7;
      body.position.y = damp(body.position.y, sin(rig.sway) * 0.006 * k, 6, dt);
      body.rotation.z = damp(body.rotation.z, lean, 6, dt);
      head.rotation.y = damp(head.rotation.y, turn + sin(rig.sway * 0.35) * 0.3, 5, dt);
      head.rotation.x = damp(head.rotation.x, nod, 12, dt);
      head.rotation.z = damp(head.rotation.z, lean * 0.5, 6, dt);
    }
  };
  bakeRig(g);   // 51 meshes → about 20: every joint's static parts become one vertex-coloured mesh
  return rig;
}

/**
 * A ready-made townsperson: a coherent set of looks, half of them women. `w` is an optional
 * wardrobe of `bag()` draws (see makeWardrobe) — pass one and a crowd is guaranteed to differ,
 * rather than relying on independent dice rolls that happily hand out five red shirts in a row.
 */
function randomPerson(r, o = {}) {
  const female = o.female ?? r.chance(0.5);
  const w = o.wardrobe;
  const child = o.child ?? false;
  return {
    female,
    skin: r.pick(SKIN_TONES), hair: r.pick(HAIR_COLORS),
    hairStyle: female ? r.pick(LONG_STYLES) : r.pick(['short', 'short', 'crop', 'curls', 'bun']),
    height: child ? r.range(1.05, 1.35) : female ? r.range(1.58, 1.74) : r.range(1.66, 1.88),
    build: r.pick(['average', 'average', 'average', 'slim', 'stout']),
    shirt: w ? w.shirt() : r.pick(SHIRT_COLORS),
    pants: w ? w.pants() : r.pick(PANTS_COLORS),
    shoes: w ? w.shoes() : r.pick(SHOE_COLORS),
    mouth: r.pick(MOUTH_SHAPES),
    eyeGap: r.range(0.33, 0.4), eyeSize: r.range(0.23, 0.28), brow: r.range(0.08, 0.24),
    freckles: r.chance(0.22),
    glasses: r.chance(0.2),
    beard: !female && !child && r.chance(0.16),
    moustache: !female && !child && r.chance(0.12),
    ...o,
  };
}

/** A shuffled wardrobe for one world: consecutive people are guaranteed different clothes. */
function makeWardrobe(r, o = {}) {
  return {
    shirt: bag(r, o.shirts ?? SHIRT_COLORS),
    pants: bag(r, o.pants ?? PANTS_COLORS),
    shoes: bag(r, o.shoes ?? SHOE_COLORS),
  };
}

// ---------------------------------------------------------------- gingerbread rig: a flat cookie with piped icing outlines
function makeGingerbread() {
  const g = new THREE.Group(), rig = { group: g, legs: [], arms: [] };
  const dough = mat(0xc27b3a, { roughness: 0.95 }), icing = mat(0xfffdf7, { roughness: 0.35 });
  const gum = (c) => glowMat(c, 0.45, { roughness: 0.3 });
  const body = group(0, 0, 0, g); rig.body = body;
  const TH = 0.48;    // cookie thickness (scale on z)
  // every dough part gets a slightly larger white copy set just behind it: from the front it reads as a piped icing outline
  const piped = (geo, o, parent) => { mesh(geo, dough, { ...o, sz: (o.sz ?? 1) * TH, parent }); mesh(geo, icing, { ...o, sx: (o.sx ?? 1) * 1.14, sy: (o.sy ?? 1) * 1.08, sz: (o.sz ?? 1) * TH * 0.92, z: (o.z ?? 0) - 0.012, shadow: 'none', parent }); };
  piped(G.capsule(0.21, 0.3, 12), { y: 0.66 }, body);
  for (const side of [1, -1]) {
    const leg = group(side * 0.1, 0.42, 0, body); piped(G.capsule(0.085, 0.24, 10), { x: side * 0.035, y: -0.17, rz: side * 0.22 }, leg);
    mesh(G.torus(0.09, 0.016, 6, 16), icing, { x: side * 0.07, y: -0.3, rx: PI / 2, rz: side * 0.22, shadow: 'none', parent: leg }); rig.legs.push(leg);
    const arm = group(side * 0.2, 0.8, 0, body); piped(G.capsule(0.07, 0.24, 10), { x: side * 0.13, y: -0.08, rz: side * 1.05 }, arm);
    mesh(G.torus(0.075, 0.015, 6, 16), icing, { x: side * 0.22, y: -0.19, rx: PI / 2, rz: side * 1.05, shadow: 'none', parent: arm }); rig.arms.push(arm);
  }
  const head = group(0, 1.08, 0, body); rig.head = head;
  piped(G.sphere(0.2, 16, 12), {}, head);
  for (const side of [1, -1]) {
    mesh(G.sphere(0.03, 8, 6), icing, { x: side * 0.07, y: 0.045, z: 0.09, shadow: 'none', parent: head });
    mesh(G.sphere(0.014, 6, 6), mat(0x1a1a1a), { x: side * 0.07, y: 0.045, z: 0.115, shadow: 'none', parent: head });
    mesh(G.sphere(0.035, 8, 6), mat(0xff8fab, { roughness: 0.9 }), { x: side * 0.13, y: -0.02, z: 0.08, sz: 0.4, shadow: 'none', parent: head });   // rosy cheeks
  }
  mesh(G.torus(0.075, 0.013, 6, 16, PI), icing, { y: -0.045, z: 0.095, rz: PI, shadow: 'none', parent: head });            // icing smile
  for (let i = 0; i < 3; i++) mesh(G.sphere(0.03, 8, 6), gum([0xff3355, 0x4ade80, 0x64b5f6][i]), { y: 0.8 - i * 0.15, z: 0.11, shadow: 'none', parent: body });   // gumdrop buttons
  for (const side of [1, -1]) mesh(G.cone(0.05, 0.09, 4), gum(0xff3355), { x: side * 0.06, y: 0.92, z: 0.1, rz: side * PI / 2, shadow: 'none', parent: body });   // bow tie
  mesh(G.sphere(0.022, 6, 6), gum(0xff3355), { y: 0.92, z: 0.11, shadow: 'none', parent: body });
  rig.animate = (ph, moving, dt) => {
    body.rotation.z = moving ? sin(ph) * 0.14 : damp(body.rotation.z, 0, 6, dt);
    body.position.y = moving ? abs(sin(ph)) * 0.05 : 0;
    for (let i = 0; i < 2; i++) { rig.legs[i].rotation.x = moving ? sin(ph + i * PI) * 0.45 : damp(rig.legs[i].rotation.x, 0, 8, dt); rig.arms[i].rotation.x = moving ? sin(ph + i * PI + PI) * 0.3 : damp(rig.arms[i].rotation.x, 0, 6, dt); }
    head.rotation.z = moving ? -sin(ph) * 0.08 : sin(ph * 0.2) * 0.1;
  };
  return rig;
}

// ---------------------------------------------------------------- robot rig
function makeRobot() {
  const g = new THREE.Group(), rig = { group: g, legs: [], arms: [] };
  const steel = mat(0x9aa3ad, { metalness: 0.85, roughness: 0.3 }), dark = mat(0x3a3f47, { metalness: 0.8, roughness: 0.4 }), cyan = glowMat(0x00e5ff, 1.6);
  const body = group(0, 0, 0, g); rig.body = body;
  for (const side of [1, -1]) {
    const hip = group(side * 0.14, 0.62, 0, body);
    mesh(G.box(0.14, 0.3, 0.16), dark, { y: -0.16, parent: hip });
    const knee = group(0, -0.32, 0, hip); mesh(G.box(0.12, 0.26, 0.14), steel, { y: -0.14, parent: knee }); mesh(G.box(0.18, 0.06, 0.26), dark, { y: -0.29, z: 0.04, parent: knee });
    rig.legs.push({ hip, knee });
  }
  mesh(G.box(0.5, 0.62, 0.34), steel, { y: 0.95, parent: body });
  mesh(G.box(0.3, 0.16, 0.02), mat(0x111418), { y: 1.02, z: 0.18, shadow: 'none', parent: body });
  rig.light = mesh(G.sphere(0.035, 8, 6), glowMat(0xff4d4d, 2), { x: 0.14, y: 1.15, z: 0.18, shadow: 'none', parent: body });
  for (let i = 0; i < 3; i++) mesh(G.box(0.05, 0.05, 0.02), i === 1 ? cyan : glowMat(0xfff176, 1.2), { x: -0.08 + i * 0.07, y: 1.02, z: 0.19, shadow: 'none', parent: body });
  for (const side of [1, -1]) {
    const sh = group(side * 0.33, 1.2, 0, body); mesh(G.sphere(0.08, 10, 8), dark, { parent: sh });
    mesh(G.box(0.12, 0.34, 0.12), steel, { y: -0.2, parent: sh });
    const el = group(0, -0.38, 0, sh); mesh(G.box(0.1, 0.3, 0.1), dark, { y: -0.15, parent: el });
    mesh(G.box(0.04, 0.12, 0.08), steel, { x: 0.04, y: -0.34, parent: el }); mesh(G.box(0.04, 0.12, 0.08), steel, { x: -0.04, y: -0.34, parent: el });
    rig.arms.push({ sh, el });
  }
  mesh(G.cyl(0.08, 0.1, 0.1, 10), dark, { y: 1.3, parent: body });
  const head = group(0, 1.48, 0, body); rig.head = head;
  mesh(G.cyl(0.2, 0.22, 0.28, 16), steel, { parent: head });
  mesh(G.box(0.3, 0.07, 0.04), cyan, { y: 0.02, z: 0.2, shadow: 'none', parent: head });
  mesh(G.cyl(0.012, 0.012, 0.22, 6), dark, { y: 0.24, parent: head });
  rig.antenna = mesh(G.sphere(0.035, 8, 6), glowMat(0xff4d4d, 2), { y: 0.36, shadow: 'none', parent: head });
  rig.animate = (ph, moving, dt, t = 0) => {
    for (let i = 0; i < 2; i++) { const p = ph + i * PI, L = rig.legs[i], A = rig.arms[i];
      L.hip.rotation.x = moving ? -sin(p) * 0.45 : damp(L.hip.rotation.x, 0, 8, dt); L.knee.rotation.x = moving ? max(0, cos(p)) * 0.7 : damp(L.knee.rotation.x, 0, 8, dt);
      A.sh.rotation.x = moving ? sin(p) * 0.4 : damp(A.sh.rotation.x, 0, 8, dt); A.el.rotation.x = -0.4; }
    body.position.y = moving ? abs(sin(ph)) * 0.05 : 0;
    const blink = (sin(t * 4 + ph * 0.3) > 0.6) ? 2.5 : 0.4;
    rig.antenna.material.emissiveIntensity = blink; rig.light.material.emissiveIntensity = 3 - blink;
    head.rotation.y = moving ? 0 : sin(ph * 0.11) * 0.7;
  };
  return rig;
}

// ---------------------------------------------------------------- robot dog rig
function makeRoboDog() {
  const g = new THREE.Group(), rig = { group: g, legs: [] };
  const steel = mat(0x7d8792, { metalness: 0.85, roughness: 0.3 }), dark = mat(0x2f343c, { metalness: 0.8, roughness: 0.4 }), red = glowMat(0xff2d2d, 2.2);
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.box(0.5, 0.36, 1.0), steel, { y: 0.58, parent: body });
  mesh(G.box(0.36, 0.1, 0.7), dark, { y: 0.8, parent: body });
  const head = group(0, 0.78, 0.6, body); rig.head = head;
  mesh(G.box(0.4, 0.34, 0.42), steel, { parent: head });
  mesh(G.box(0.24, 0.16, 0.2), dark, { y: -0.06, z: 0.28, parent: head });
  for (const side of [1, -1]) { rig['eye' + side] = mesh(G.sphere(0.055, 10, 8), red, { x: side * 0.12, y: 0.05, z: 0.21, shadow: 'none', parent: head }); mesh(G.box(0.08, 0.16, 0.05), dark, { x: side * 0.15, y: 0.24, parent: head }); }
  mesh(G.cyl(0.012, 0.012, 0.35, 6), dark, { y: 0.32, z: -0.1, parent: head });
  rig.antenna = mesh(G.sphere(0.04, 8, 6), red, { y: 0.5, z: -0.1, shadow: 'none', parent: head });
  for (const [x, z] of [[0.19, 0.36], [-0.19, 0.36], [0.19, -0.36], [-0.19, -0.36]]) {
    const hip = group(x, 0.48, z, body); mesh(G.box(0.12, 0.26, 0.14), dark, { y: -0.12, parent: hip });
    const knee = group(0, -0.25, 0, hip); mesh(G.box(0.1, 0.24, 0.1), steel, { y: -0.12, parent: knee }); mesh(G.box(0.13, 0.05, 0.16), dark, { y: -0.25, parent: knee });
    rig.legs.push({ hip, knee, front: z > 0 });
  }
  mesh(G.box(0.06, 0.06, 0.4), dark, { y: 0.72, z: -0.6, rx: -0.6, parent: body });
  rig.animate = (ph, moving, dt) => {
    for (let i = 0; i < 4; i++) { const L = rig.legs[i], p = ph + ((i === 0 || i === 3) ? 0 : PI);
      L.hip.rotation.x = moving ? sin(p) * 0.55 : damp(L.hip.rotation.x, 0, 8, dt); L.knee.rotation.x = moving ? -max(0, cos(p)) * 0.6 : damp(L.knee.rotation.x, 0, 8, dt); }
    body.position.y = moving ? abs(sin(ph)) * 0.04 : 0;
    head.rotation.x = moving ? sin(ph * 2) * 0.04 : sin(ph * 0.3) * 0.08;
  };
  return rig;
}

// ---------------------------------------------------------------- squirrel rig
function makeSquirrel() {
  const g = new THREE.Group(), rig = { group: g };
  const fur = mat(0x8b5a2b, { roughness: 0.95 }), light = mat(0xd9a066, { roughness: 0.95 }), dark = mat(0x1a1a1a);
  const body = group(0, 0, 0, g); rig.body = body;
  mesh(G.bodySphere(14, 10), fur, { y: 0.16, z: -0.02, sx: 0.1, sy: 0.12, sz: 0.15, parent: body });
  mesh(G.bodySphere(14, 10), light, { y: 0.14, z: 0.03, sx: 0.075, sy: 0.09, sz: 0.11, shadow: 'none', parent: body });
  const head = group(0, 0.3, 0.1, body); rig.head = head;
  mesh(G.sphere(0.08, 14, 10), fur, { sz: 1.1, parent: head });
  mesh(G.sphere(0.04, 10, 8), light, { y: -0.03, z: 0.065, sx: 1.2, sy: 0.8, parent: head });
  mesh(G.sphere(0.015, 8, 6), mat(0x2a1a1a), { y: -0.012, z: 0.1, shadow: 'none', parent: head });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.017, 8, 6), dark, { x: side * 0.04, y: 0.02, z: 0.065, shadow: 'none', parent: head });
    mesh(G.sphere(0.005, 6, 6), basic(0xffffff), { x: side * 0.045, y: 0.027, z: 0.078, shadow: 'none', parent: head });
    mesh(G.earCone(0.025, 0.06), fur, { x: side * 0.045, y: 0.085, z: -0.01, rz: side * -0.3, parent: head });
    mesh(G.capsule(0.014, 0.05, 6), fur, { x: side * 0.045, y: 0.16, z: 0.1, rx: -0.9, parent: body });   // arms held up
    mesh(G.sphere(0.045, 10, 8), fur, { x: side * 0.07, y: 0.09, z: -0.05, sy: 0.9, sz: 1.3, parent: body }); // haunches
    mesh(G.box(0.03, 0.02, 0.08), light, { x: side * 0.07, y: 0.015, z: 0.0, parent: body });
  }
  // fluffy tail: overlapping spheres along an S-curve
  const tail = group(0, 0.12, -0.13, body); rig.tail = tail;
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0.02, 0.1, -0.1), V3(-0.01, 0.26, -0.11), V3(0.02, 0.38, -0.03), V3(0, 0.42, 0.06)]);
  for (let i = 0; i <= 11; i++) { const p = curve.getPoint(i / 11), r = 0.03 + sin(i / 11 * PI) * 0.05; mesh(G.sphere(1, 10, 8), i % 2 ? light : fur, { x: p.x, y: p.y, z: p.z, sx: r, sy: r, sz: r * 0.9, parent: tail }); }
  rig.animate = (ph, moving, dt, t = 0) => {
    // nibble: quick head bobs in bursts; twitch: a tail flick now and then; otherwise a slow look-around
    const nibble = sin(t * 0.55) > 0.55 ? 1 : 0, flick = sin(t * 0.37 + 1) > 0.93 ? 1 : 0;
    tail.rotation.z = sin(t * 3.1) * 0.12 + flick * sin(t * 26) * 0.35; tail.rotation.x = moving ? -0.5 : sin(t * 2.3) * 0.08 - nibble * 0.15;
    head.rotation.x = moving ? 0.3 : nibble * (0.25 + sin(t * 14) * 0.12) + sin(t * 6) * 0.03;
    head.rotation.y = moving ? 0 : (nibble ? 0 : sin(t * 0.9) * 0.35);
    body.rotation.x = moving ? -0.35 : nibble * 0.12;
    body.scale.y = 1 + sin(t * 4.2) * 0.012;                       // breathing
  };
  return rig;
}

// ---------------------------------------------------------------- candy cat (boss) rig
function makeCandyCat() {
  const g = new THREE.Group(), rig = { group: g };
  const pink = mat(0xff2f92, { roughness: 0.45, map: TEX.fur('boss', 330, 90, 55, 'sprinkles') }), plain = mat(0xff2f92, { roughness: 0.45 }), lightPink = mat(0xffc1dc, { roughness: 0.6 });
  const gold = mat(0xffd54a, { metalness: 0.9, roughness: 0.2 }), red = glowMat(0xff1a1a, 1.6);
  const body = group(0, 0, 0, g); rig.body = body;
  rig.torso = mesh(G.bodySphere(), pink, { y: 1.15, sx: 0.85, sy: 0.8, sz: 1.35, parent: body });
  mesh(G.bodySphere(), lightPink, { y: 1.07, z: 0.05, sx: 0.79, sy: 0.74, sz: 1.31, shadow: 'none', parent: body });   // pale tummy, tucked inside the torso so it reads as fur, not a lump
  mesh(G.bodySphere(), pink, { y: 1.3, z: 1.05, sx: 0.5, sy: 0.45, sz: 0.5, parent: body });
  const head = group(0, 1.8, 1.4, body); rig.head = head;
  mesh(G.sphere(0.6, 20, 16), pink, { sy: 0.92, parent: head });
  mesh(G.sphere(0.3, 14, 10), lightPink, { y: -0.2, z: 0.48, sx: 1.2, sy: 0.75, shadow: 'none', parent: head });
  mesh(G.sphere(0.07, 10, 8), mat(0xc2185b), { y: -0.1, z: 0.76, sx: 1.2, sy: 0.8, shadow: 'none', parent: head });
  for (const side of [1, -1]) {
    mesh(G.sphere(0.13, 14, 10), basic(0xfff5f8), { x: side * 0.24, y: 0.12, z: 0.48, sz: 0.5, shadow: 'none', parent: head });
    rig['eye' + side] = mesh(G.sphere(0.075, 12, 10), red, { x: side * 0.24, y: 0.12, z: 0.53, sx: 0.5, shadow: 'none', parent: head });
    rig['brow' + side] = mesh(G.box(0.24, 0.05, 0.05), mat(0xb0005f), { x: side * 0.25, y: 0.3, z: 0.5, rz: side * 0.45, shadow: 'none', parent: head });
    mesh(G.earCone(0.2, 0.42), pink, { x: side * 0.35, y: 0.55, z: -0.05, rz: side * -0.35, parent: head });
    mesh(G.earCone(0.11, 0.26), lightPink, { x: side * 0.35, y: 0.5, z: 0.0, rz: side * -0.35, shadow: 'none', parent: head });
  }
  // tiara: a gold band that actually rests on the skull, five points with jewels, a heart in the middle
  const tiara = group(0, 0.4, 0.02, head);
  mesh(G.torus(0.36, 0.035, 8, 32), gold, { rx: PI / 2, parent: tiara });
  [-0.95, -0.48, 0, 0.48, 0.95].forEach((a, i) => {
    const h = i === 2 ? 0.34 : (i === 1 || i === 3 ? 0.24 : 0.16), x = sin(a) * 0.36, z = cos(a) * 0.36;
    mesh(G.cone(0.05, h, 4), gold, { x, y: h / 2, z, ry: PI / 4, parent: tiara });
    mesh(G.sphere(i === 2 ? 0.06 : 0.04, 8, 6), glowMat(i === 2 ? 0x64b5f6 : (i % 2 ? 0xff6fb5 : 0x9dff6a), 1.4), { x, y: h + 0.02, z, shadow: 'none', parent: tiara });
  });
  mesh(G.heart(0.16, 0.05), glowMat(0xff3d7a, 1.2), { y: 0.02, z: 0.38, shadow: 'none', parent: tiara });
  for (const [x, z] of [[0.45, 0.8], [-0.45, 0.8], [0.45, -0.8], [-0.45, -0.8]]) { mesh(G.capsule(0.17, 0.4, 10), plain, { x, y: 0.45, z, parent: body }); mesh(G.sphere(0.2, 10, 8), lightPink, { x, y: 0.12, z: z + 0.05, sy: 0.6, sz: 1.3, parent: body }); }
  let parent = body, base = V3(0, 1.3, -1.3); rig.tail = [];
  for (let i = 0; i < 6; i++) { const j = group(base.x, base.y, base.z, parent); mesh(G.capsule(0.12 - i * 0.012, 0.3, 8), i % 2 ? plain : lightPink, { z: -0.2, rx: PI / 2, parent: j }); rig.tail.push(j); parent = j; base = V3(0, 0, -0.38); }
  rig.animate = (ph, near, dt, t = 0) => {
    rig.torso.scale.y = 0.8 + sin(t * 1.6) * 0.015;
    for (let i = 0; i < 6; i++) { const j = rig.tail[i]; j.rotation.x = i === 0 ? 0.6 : 0.22; j.rotation.y = sin(t * (near ? 5 : 1.6) + i * 0.6) * 0.16; }
    const angry = near ? 0.75 : 0.45;
    rig.brow1.rotation.z = damp(rig.brow1.rotation.z, angry, 5, dt); rig['brow-1'].rotation.z = -rig.brow1.rotation.z;
    rig.eye1.material.emissiveIntensity = near ? 2.5 + sin(t * 8) : 1.6;
    head.rotation.y = damp(head.rotation.y, near ? 0 : sin(t * 0.5) * 0.3, 4, dt);
    head.rotation.x = near ? -0.12 : 0;
  };
  return rig;
}

// ---------------------------------------------------------------- wanderer controller
class Wanderer {
  constructor(game, rig, o) {
    this.game = game; this.rig = rig; this.x = o.x; this.z = o.z; this.hx = o.x; this.hz = o.z;
    this.speed = o.speed ?? 0.9; this.leash = o.leash ?? 10; this.r = o.r ?? 0.35; this.height = o.height ?? 1.8; this.step = o.step ?? 0.22;
    this.idleRange = o.idle ?? [1.5, 4]; this.walkRange = o.walk ?? [3, 8];
    this.angle = o.angle ?? rnd() * TAU; this.phase = rnd() * TAU; this.state = 'idle'; this.timer = rnd.range(0, 2); this.t = rnd() * 10;
    this.circle = game.physics.addCircle(this, o.x, o.z, this.r);
    rig.group.position.set(o.x, game.physics.ground0(o.x, o.z), o.z); rig.group.rotation.y = this.angle;
    this.look = 0; this.lookW = 0; this.tipT = 0; this.tipped = false;
  }
  update(dt) { this.move(dt); this.lookAtCat(dt); }
  /** Turn the head toward the cat when it is close and roughly in front. Applied after animate() so it wins. */
  lookAtCat(dt) {
    const head = this.rig.head; if (!head) return;
    const cat = this.game.cat.group.position, dx = cat.x - this.x, dz = cat.z - this.z;
    let target = 0, w = 0;
    if (dx * dx + dz * dz < 42) { const a = wrapAngle(atan2(dx, dz) - this.rig.group.rotation.y); if (abs(a) < 1.6) { target = a; w = 1; } }
    this.lookW = damp(this.lookW, w, 5, dt); this.look = damp(this.look, target, 6, dt);
    head.rotation.y = lerp(head.rotation.y, this.look, this.lookW);
    // people give the cat a wave the first time it comes up to them; gentlemen tip their hat instead
    if (this.rig.gesture !== undefined && !this.rig.hat) {
      const d2 = dx * dx + dz * dz;
      if (w && d2 < 12 && !this.waved && this.state === 'idle') { this.waved = true; this.rig.gesture = 'wave'; this.rig.gT = 0; this.timer = max(this.timer, 2); }
      if (d2 > 40) this.waved = false;
    }
    // gentlemen tip their top hat once per approach
    if (this.rig.hat) {
      const d2 = dx * dx + dz * dz;
      if (w && d2 < 14 && !this.tipped) { this.tipped = true; this.tipT = 1.3; }
      if (d2 > 40) this.tipped = false;
      if (this.tipT > 0) { this.tipT -= dt; const k = sin(clamp(1 - this.tipT / 1.3, 0, 1) * PI); this.rig.hat.position.y = k * 0.16; this.rig.hat.rotation.z = k * 0.45; this.rig.hat.position.x = k * 0.08;
        const A = this.rig.arms[0]; A.sh.rotation.x = lerp(A.sh.rotation.x, -2.6, k); A.sh.rotation.z = lerp(A.sh.rotation.z, 0.5, k); A.el.rotation.x = lerp(A.el.rotation.x, -1.4, k); }
    }
  }
  move(dt) {
    this.timer -= dt; this.t += dt;
    const cat = this.game.cat.group.position;
    if (this.state === 'idle') {
      if (this.timer <= 0) { this.state = 'walk'; this.timer = rnd.range(...this.walkRange); this.angle = wrapAngle(this.angle + rnd.range(-1.2, 1.2)); }
      this.rig.animate(this.phase, false, dt, this.t); return;
    }
    const nx = this.x + sin(this.angle) * this.speed * dt, nz = this.z + cos(this.angle) * this.speed * dt;
    const outside = dist2(nx, nz, this.hx, this.hz) > this.leash * this.leash;
    const nearCat = dist2(nx, nz, cat.x, cat.z) < (this.r + CAT_RADIUS + 0.15) ** 2;
    if (outside || nearCat || this.game.physics.blocked(nx, nz, this.r, this, this.game.physics.ground0(nx, nz), this.step, this.height)) {
      this.angle = outside ? wrapAngle(atan2(this.hx - this.x, this.hz - this.z) + rnd.range(-0.5, 0.5)) : wrapAngle(this.angle + rnd.range(PI * 0.5, PI * 1.5));
      this.state = 'idle'; this.timer = nearCat ? rnd.range(0.8, 2) : rnd.range(0.2, 0.6);
      this.rig.animate(this.phase, false, dt, this.t); return;
    }
    this.x = nx; this.z = nz; this.circle.x = nx; this.circle.z = nz; this.phase += dt * this.speed * 4.4;
    this.rig.group.position.set(nx, this.game.physics.ground0(nx, nz), nz);
    this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, this.angle, 7, dt);
    if (this.timer <= 0) { this.state = 'idle'; this.timer = rnd.range(...this.idleRange); }
    this.rig.animate(this.phase, true, dt, this.t);
  }
}

// ---------------------------------------------------------------- squirrel controller: stays on its spot, fidgets, watches the cat
class Squirrel {
  constructor(game, x, z, id) {
    this.game = game; this.id = id; this.rig = makeSquirrel(); this.x = x; this.z = z;
    this.t = rnd() * 10; this.heading = rnd() * TAU; this.restHeading = this.heading; this.petT = 0;
    this.circle = game.physics.addCircle(this, x, z, 0.18);
    this.rig.group.position.set(x, game.physics.ground0(x, z), z); this.rig.group.rotation.y = this.heading;
    game.world.add(this.rig.group);
    game.addInteractable({ obj: this.rig.group, radius: 2.2, label: () => 'Pet the squirrel', onUse: () => this.pet() });
  }
  pet() {
    const g = this.game;
    g.hearts(this.x, 0.45, this.z, 4); SFX.chitter(); g.toast(rnd.pick(['🐿️ *happy chitter*', '🐿️ The squirrel nuzzles your paw.', '🐿️ *offers you an acorn*']));
    this.petT = 1.6;
  }
  update(dt) {
    this.t += dt; this.petT = max(0, this.petT - dt);
    const cat = this.game.cat.group.position, d2 = dist2(this.x, this.z, cat.x, cat.z);
    // face the cat when it comes close, otherwise drift back to the resting heading
    this.heading = d2 < 16 ? atan2(cat.x - this.x, cat.z - this.z) : this.restHeading;
    this.rig.group.position.y = this.game.physics.ground0(this.x, this.z) + (this.petT > 0 ? abs(sin(this.petT * 12)) * 0.08 : 0);
    this.rig.animate(0, false, dt, this.t);
    this.rig.group.rotation.y = dampAngle(this.rig.group.rotation.y, this.heading, 6, dt);
  }
}

// ---------------------------------------------------------------- robot dog controller
class RoboDog {
  constructor(game, path) {
    this.game = game; this.rig = makeRoboDog(); this.path = path; this.i = 0; this.x = path[0][0]; this.z = path[0][1];
    this.mode = 'patrol'; this.chaseT = 0; this.barkT = 0; this.phase = 0; this.heading = 0; this.t = 0;
    this.circle = game.physics.addCircle(this, this.x, this.z, 0.5);
    this.rig.group.position.set(this.x, 0, this.z); game.world.add(this.rig.group);
  }
  update(dt) {
    this.t += dt; const cat = this.game.cat.group.position, d2 = dist2(this.x, this.z, cat.x, cat.z);
    let tx, tz, speed;
    if (this.mode === 'patrol') {
      if (d2 < 49 && this.game.cat.onGround) { this.mode = 'chase'; this.chaseT = 7; this.barkT = 0; this.game.toast('🤖🐕 WOOF-BEEP! Intruder detected!'); }
      [tx, tz] = this.path[this.i]; speed = 1.6;
      if (dist2(this.x, this.z, tx, tz) < 0.3) this.i = (this.i + 1) % this.path.length;
    } else {
      this.chaseT -= dt; this.barkT -= dt;
      if (this.barkT <= 0) { SFX.bark(); this.barkT = 1.4; }
      if (this.chaseT <= 0 || d2 > 400) { this.mode = 'patrol'; }
      tx = cat.x; tz = cat.z; speed = 3.4;
      if (d2 < 1.1) { speed = 0; if (this.barkT < 1.2) { this.game.toast('🤖🐕 *boop* "Halt, feline!"'); this.barkT = 1.6; } }
    }
    const ang = atan2(tx - this.x, tz - this.z);
    this.heading = dampAngle(this.heading, ang, 5, dt);
    const nx = this.x + sin(this.heading) * speed * dt, nz = this.z + cos(this.heading) * speed * dt;
    const moving = speed > 0 && !this.game.physics.blocked(nx, nz, 0.5, this, 0, 0.3, 1.2);
    if (moving) { this.x = nx; this.z = nz; this.phase += dt * speed * 3.5; } else if (this.mode === 'patrol' && speed > 0) this.i = (this.i + 1) % this.path.length;
    this.circle.x = this.x; this.circle.z = this.z;
    this.rig.group.position.set(this.x, 0, this.z); this.rig.group.rotation.y = this.heading;
    this.rig.animate(this.phase, moving, dt);
    const pulse = this.mode === 'chase' ? 2 + sin(this.t * 14) * 1.5 : 1.2 + sin(this.t * 3) * 0.6;
    this.rig.antenna.material.emissiveIntensity = pulse; this.rig.eye1.material.emissiveIntensity = pulse;
  }
}

// ---------------------------------------------------------------- vehicle controller (cars on a straight road)
class Vehicle {
  constructor(game, rig, { z, dir, speed, x, length = 4, limit = 78 }) {
    this.game = game; this.rig = rig; this.z = z; this.dir = dir; this.speed = speed; this.x = x; this.limit = limit; this.length = length;
    this.stopped = false; this.honkT = 0; this.v = speed;
    this.cf = game.physics.addCircle(this, x, z, 1.0); this.cb = game.physics.addCircle(this, x, z, 1.0);
    rig.group.rotation.y = dir > 0 ? PI / 2 : -PI / 2;
  }
  update(dt) {
    const cat = this.game.cat.group.position;
    let mustStop = false;
    const inLane = (x, z) => { const ahead = (x - this.x) * this.dir; return abs(z - this.z) < 1.7 && ahead > 0 && ahead < 6; };
    if (inLane(cat.x, cat.z)) mustStop = true;
    else for (const c of this.game.physics.circles) { if (c.ref !== this && !c.off && inLane(c.x, c.z)) { mustStop = true; break; } }
    this.honkT -= dt;
    if (mustStop && !this.stopped && this.honkT <= 0) { SFX.honk(); this.honkT = 3; }
    this.stopped = mustStop;
    this.v = damp(this.v, mustStop ? 0 : this.speed, 3, dt);
    this.x += this.dir * this.v * dt;
    if (this.x * this.dir > this.limit) this.x = -this.dir * this.limit;
    this.rig.group.position.x = this.x; this.rig.group.position.z = this.z;
    this.cf.x = this.x + this.dir * this.length * 0.28; this.cf.z = this.z; this.cb.x = this.x - this.dir * this.length * 0.28; this.cb.z = this.z;
    for (const w of this.rig.wheels) w.rotation.x += this.v * dt * 2.2;
  }
}
