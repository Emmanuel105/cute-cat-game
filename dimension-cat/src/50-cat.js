// ============================================================================
// THE CAT — a rigged quadruped built from primitives; faces +Z in local space
// ============================================================================
const SKINS = {
  neighborhood: { name: 'Tabby',     hue: 26,  sat: 62, light: 46, style: 'tabby',     belly: 0xf3e3c8, nose: 0xe0788f, ear: 0xf0a3a8, paw: 0xf6efe4, iris: 0x4fa64d, collar: 0xd62839, tip: 0xf3e3c8 },
  candy:        { name: 'Bubblegum', hue: 330, sat: 85, light: 62, style: 'sprinkles', belly: 0xffe1ee, nose: 0xff3d8a, ear: 0xffb3d1, paw: 0xffffff, iris: 0x8a2be2, collar: 0x40c4ff, tip: 0xffffff },
  robot:        { name: 'Steel',     hue: 215, sat: 8,  light: 46, style: 'metal',     belly: 0x8d95a3, nose: 0xff3b3b, ear: 0x2b3038, paw: 0x2f343c, iris: 0xff2020, collar: 0x00e5ff, tip: 0xdfe6ee, glowEyes: true },
  victorian:    { name: 'Chestnut',  hue: 24,  sat: 48, light: 28, style: 'patches',   belly: 0xa88a6a, nose: 0x7a4a3a, ear: 0x9c6b5c, paw: 0xe8dcc4, iris: 0xd4a017, collar: 0x2f4f4f, tip: 0xe8dcc4 },
  black:        { name: 'Midnight',  hue: 250, sat: 12, light: 9,  style: 'plain',     belly: 0x262630, nose: 0x3a2a30, ear: 0x4a3640, paw: 0x1c1c22, iris: 0xffc93c, collar: 0xd62839, tip: 0x34343c },
};
/** The shapes the player can take. speed/jump are multipliers; radius/height feed the physics; eye is the camera focus height. */
const FORMS = {
  cat:       { name: 'Cat',       icon: '🐱', speed: 1,    jump: 1,    radius: 0.26, height: 0.7,  eye: 0.42, camDist: 1,    fly: false },
  human:     { name: 'Human',     icon: '🧍', speed: 1.15, jump: 1,    radius: 0.32, height: 1.6,  eye: 1.25, camDist: 1.55, fly: false },
  frog:      { name: 'Frog',      icon: '🐸', speed: 0.85, jump: 1.5,  radius: 0.2,  height: 0.35, eye: 0.25, camDist: 0.85, fly: false },
  butterfly: { name: 'Butterfly', icon: '🦋', speed: 0.9,  jump: 0.9,  radius: 0.18, height: 0.3,  eye: 0.5,  camDist: 0.9,  fly: true },
  squirrel:  { name: 'Squirrel',  icon: '🐿️', speed: 1.35, jump: 1.25, radius: 0.2,  height: 0.45, eye: 0.3,  camDist: 0.85, fly: false },
  worm:      { name: 'Worm',      icon: '🪱', speed: 0.4,  jump: 0,    radius: 0.14, height: 0.15, eye: 0.12, camDist: 0.7,  fly: false },
};
const FORM_ORDER = Object.keys(FORMS);

class Cat {
  constructor() {
    this.group = new THREE.Group();
    this.body = new THREE.Group(); this.group.add(this.body);        // everything animated hangs off `body`
    this.parts = {}; this.skinKey = null; this.form = 'cat'; this.forms = {};
    // motion state
    this.vy = 0; this.onGround = true; this.speed = 0; this.moving = false; this.running = false;
    this.walkPhase = 0; this.idleTime = 0; this.loaf = 0; this.sit = 0; this.stretch = 0; this.airTime = 0; this.squash = 0;
    // fidgets
    this.blinkT = 0; this.nextBlink = 3; this.blinkDur = 0.18; this.earT = 0; this.nextEar = 2; this.earSide = 0;
    this.lookT = 0; this.lookYaw = 0; this.lookPitch = 0; this.lookTargetYaw = 0; this.lookTargetPitch = 0;
  }

  build(skinKey) {
    if (this.skinKey === skinKey) return;
    this.skinKey = skinKey;
    const s = SKINS[skinKey];
    while (this.body.children.length) this.body.remove(this.body.children[0]);
    for (const m of this.mats || []) m.dispose();
    for (const gg of this.geos || []) gg.dispose();
    this.geos = [];
    const P = this.parts = { eyelids: [], legs: [], tail: [] };

    // materials -------------------------------------------------------------
    const furTex = TEX.fur(skinKey, s.hue, s.sat, s.light, s.style);
    const std = (o) => { const m = new THREE.MeshStandardMaterial(o); this.mats.push(m); return m; };
    this.mats = [];
    const fur = std({ map: furTex, roughness: 0.92, metalness: s.style === 'metal' ? 0.55 : 0 });
    const furPlain = std({ color: new THREE.Color().setHSL(s.hue / 360, s.sat / 100, s.light / 100), roughness: 0.92, metalness: s.style === 'metal' ? 0.55 : 0 });
    const belly = std({ color: s.belly, roughness: 0.95 });
    const nose = std({ color: s.nose, roughness: 0.35 });
    const ear = std({ color: s.ear, roughness: 0.8 });
    const paw = std({ color: s.paw, roughness: 0.9 });
    const sclera = std({ color: 0xf6f6f2, roughness: 0.25 });
    const iris = std({ color: s.iris, roughness: 0.2, emissive: s.iris, emissiveIntensity: s.glowEyes ? 1.4 : 0.15 });
    const pupil = std({ color: 0x050505, roughness: 0.1 });
    const shine = new THREE.MeshBasicMaterial({ color: 0xffffff }); this.mats.push(shine);
    const collar = std({ color: s.collar, roughness: 0.45 });
    const gold = std({ color: 0xffc94a, roughness: 0.25, metalness: 0.9 });
    const tip = std({ color: s.tip, roughness: 0.9 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.55 }); this.mats.push(lineMat);
    const mouthMat = new THREE.LineBasicMaterial({ color: 0x3a2a26 }); this.mats.push(mouthMat);
    const B = this.body;

    // torso -----------------------------------------------------------------
    P.torso = mesh(G.bodySphere(), fur, { y: 0.36, sx: 0.20, sy: 0.185, sz: 0.34, parent: B });
    mesh(G.bodySphere(), fur, { y: 0.355, z: 0.19, sx: 0.19, sy: 0.175, sz: 0.2, parent: B });     // chest
    mesh(G.bodySphere(), fur, { y: 0.365, z: -0.2, sx: 0.185, sy: 0.18, sz: 0.19, parent: B });     // hips
    mesh(G.bodySphere(), belly, { y: 0.30, z: 0.02, sx: 0.165, sy: 0.13, sz: 0.30, shadow: 'none', parent: B });
    mesh(G.bodySphere(), furPlain, { y: 0.455, z: 0.33, sx: 0.115, sy: 0.105, sz: 0.13, parent: B }); // neck

    // collar + bell (ring normal follows the neck direction)
    mesh(G.torus(0.108, 0.016, 8, 28), collar, { y: 0.46, z: 0.33, rx: -0.75, shadow: 'none', parent: B });
    mesh(G.sphere(0.021, 10, 8), gold, { y: 0.372, z: 0.41, shadow: 'none', parent: B });

    // head ------------------------------------------------------------------
    const H = P.head = group(0, 0.565, 0.455, B);
    mesh(G.sphere(0.15, 22, 18), fur, { sx: 1, sy: 0.92, sz: 0.98, parent: H });
    mesh(G.sphere(0.075, 12, 10), fur, { x: 0.092, y: -0.05, z: 0.08, sy: 0.85, sz: 0.9, parent: H });
    mesh(G.sphere(0.075, 12, 10), fur, { x: -0.092, y: -0.05, z: 0.08, sy: 0.85, sz: 0.9, parent: H });
    mesh(G.sphere(0.085, 14, 12), belly, { y: -0.055, z: 0.125, sx: 1.15, sy: 0.7, sz: 0.85, shadow: 'none', parent: H });
    mesh(G.sphere(0.045, 10, 8), belly, { y: -0.105, z: 0.115, shadow: 'none', parent: H });
    mesh(G.sphere(0.02, 10, 8), nose, { y: -0.03, z: 0.205, sx: 1.25, sy: 0.8, sz: 0.7, shadow: 'none', parent: H });
    const mouth = new THREE.BufferGeometry().setFromPoints([V3(-0.035, -0.09, 0.19), V3(0, -0.075, 0.2), V3(0, -0.055, 0.205), V3(0, -0.075, 0.2), V3(0.035, -0.09, 0.19)]); this.geos.push(mouth);
    H.add(new THREE.Line(mouth, mouthMat));

    // eyes: almond, slit pupils, blink lids
    for (const side of [1, -1]) {
      const E = group(side * 0.064, 0.032, 0.128, H); E.rotation.y = side * 0.3;
      mesh(G.sphere(0.036, 14, 12), sclera, { sy: 0.8, sz: 0.55, shadow: 'none', parent: E });
      mesh(G.sphere(0.028, 12, 10), iris, { z: 0.013, sy: 0.85, sz: 0.5, shadow: 'none', parent: E });
      P['pupil' + side] = mesh(G.sphere(0.017, 10, 8), pupil, { z: 0.024, sx: 0.4, sy: 1, sz: 0.5, shadow: 'none', parent: E });
      mesh(G.sphere(0.007, 6, 6), shine, { x: 0.012, y: 0.012, z: 0.031, shadow: 'none', parent: E });
      mesh(G.sphere(0.004, 6, 6), shine, { x: -0.009, y: -0.008, z: 0.032, shadow: 'none', parent: E });
      // upper eyelid: a fur dome that swings from tucked-back (open) to covering the front (closed)
      const lid = mesh(G.dome(0.04, 14, 8), fur, { sy: 0.9, sz: 0.95, rx: -1.05, shadow: 'none', parent: E });
      P.eyelids.push(lid);
    }
    // ears: the pivot sits on the skull and the cone base is pushed into it, so the ear grows out of the fur
    for (const side of [1, -1]) {
      const e = group(side * 0.078, 0.102, -0.022, H);
      e.rotation.set(-0.15, 0, side * -0.3);
      mesh(G.sphere(0.042, 10, 8), fur, { y: 0.0, sy: 0.7, parent: e });                       // furry ear base
      mesh(G.earCone(0.056, 0.14), fur, { y: 0.05, parent: e });
      mesh(G.earCone(0.032, 0.095), ear, { y: 0.04, z: 0.013, shadow: 'none', parent: e });
      P['ear' + side] = e;
    }
    // whiskers
    for (const side of [1, -1]) for (let k = -1; k <= 1; k++) {
      const pts = [V3(side * 0.055, -0.045 + k * 0.012, 0.17), V3(side * 0.27, -0.06 + k * 0.032, 0.11 + abs(k) * 0.01)];
      const wg = new THREE.BufferGeometry().setFromPoints(pts); this.geos.push(wg); H.add(new THREE.Line(wg, lineMat));
    }

    // legs: hip → upper → knee → lower → ankle → paw (with toes) --------------
    const makeLeg = (x, z, front) => {
      const hip = group(x, front ? 0.305 : 0.3, z, B);
      const rU = front ? 0.041 : 0.048, rL = front ? 0.033 : 0.036;
      mesh(G.sphere(rU * 1.25, 10, 8), fur, { y: 0.0, parent: hip });                          // shoulder / thigh mass
      mesh(G.capsule(rU, 0.07), fur, { y: -0.065, parent: hip });
      const knee = group(0, -0.125, 0, hip);
      mesh(G.capsule(rL, 0.06), front ? fur : furPlain, { y: -0.055, parent: knee });
      const ankle = group(0, -0.11, 0, knee);
      mesh(G.capsule(rL * 0.85, 0.035, 6), furPlain, { y: -0.028, parent: ankle });
      mesh(G.sphere(0.04, 10, 8), paw, { y: -0.062, z: 0.018, sx: 1.05, sy: 0.55, sz: 1.3, parent: ankle });
      for (const tx of [-0.021, 0, 0.021]) mesh(G.sphere(0.013, 6, 5), paw, { x: tx, y: -0.07, z: 0.058, shadow: 'none', parent: ankle });
      const leg = { hip, knee, ankle, front, restHip: front ? 0.05 : 0.38, restKnee: front ? -0.1 : -0.6, restAnkle: front ? 0.05 : 0.28 };
      P.legs.push(leg); return leg;
    };
    makeLeg(0.105, 0.2, true); makeLeg(-0.105, 0.2, true); makeLeg(0.11, -0.2, false); makeLeg(-0.11, -0.2, false);

    // tail: chain of 8 joints along -Z ----------------------------------------
    let parent = B, base = V3(0, 0.4, -0.33);
    for (let i = 0; i < 8; i++) {
      const j = group(base.x, base.y, base.z, parent);
      const r = 0.031 - i * 0.0022, len = 0.075;
      mesh(G.capsule(r, len, 8), i < 5 ? fur : furPlain, { z: -len / 2 - r * 0.3, rx: PI / 2, parent: j });
      if (i === 7) mesh(G.sphere(0.024, 10, 8), tip, { z: -len - 0.01, parent: j });
      P.tail.push(j); parent = j; base = V3(0, 0, -len - r * 0.6);
    }
    this.applyPose(0, 0);
  }

  /** Static pose values used before the first update. */
  applyPose(walk, loaf) {
    for (const leg of this.parts.legs) { leg.hip.rotation.x = leg.restHip; leg.knee.rotation.x = leg.restKnee; leg.ankle.rotation.x = leg.restAnkle; }
  }

  /** Builds the other playable shapes (they hang next to the cat body and are shown one at a time). Call after every world load: their materials live in the world bag. */
  buildForms() {
    for (const k in this.forms) this.group.remove(this.forms[k].group);
    this.forms = {};
    const add = (key, rig, y = 0, s = 1) => { rig.group.position.y = y; rig.group.scale.setScalar(s); rig.group.visible = false; this.group.add(rig.group); this.forms[key] = rig; };
    add('human', makeHuman({ skin: 0xffdbac, hair: 0x2b1b12, shirt: 0xd62839, pants: 0x2f4f6f, hat: 'cap', hatColor: 0x2e63d8, height: 1.5 }));
    add('frog', makeFrog(0x4caf50), 0, 1.7);
    add('butterfly', makeButterfly(300), 0.55, 3.4);
    add('squirrel', makeSquirrel(), 0, 1.35);
    add('worm', makeWorm());
    this.setForm(this.form);
  }
  setForm(key) {
    if (!FORMS[key]) key = 'cat';
    this.form = key; this.body.visible = key === 'cat';
    for (const k in this.forms) this.forms[k].group.visible = k === key;
  }

  // --------------------------------------------------------------------------
  update(dt, t) {
    const P = this.parts; if (!P.legs) return;
    const flying = FORMS[this.form].fly;
    const moving = this.moving && (this.onGround || flying), run = this.running && moving;
    const stride = run ? 13 : 8.5;
    if (moving) { const before = this.walkPhase; this.walkPhase += dt * stride * clamp(this.speed / 3.2, 0.5, 2); if (floor(before / PI) !== floor(this.walkPhase / PI) && !flying) this.onStep?.(run); }
    if (this.form !== 'cat') { this.animateForm(dt, t, moving, run); return; }
    const wasIdle = this.idleTime;
    this.idleTime = moving || !this.onGround ? 0 : this.idleTime + dt;
    if (wasIdle > 8 && this.idleTime === 0 && moving) this.stretch = 1;          // getting up from the loaf: a big stretch
    this.stretch = max(0, this.stretch - dt * 1.4);
    const wantLoaf = this.idleTime > 8 ? 1 : 0, wantSit = this.idleTime > 2.5 && !wantLoaf ? 1 : 0;
    this.loaf = damp(this.loaf, wantLoaf, wantLoaf ? 1.6 : 6, dt);
    this.sit = damp(this.sit, wantSit, wantSit ? 3 : 8, dt);
    const L = this.loaf, S = this.sit * (1 - L), ST = sin(this.stretch * PI), air = this.onGround ? 0 : 1;
    this.squash = damp(this.squash, 0, 9, dt);

    // body bob / breathing
    const bob = moving ? abs(sin(this.walkPhase)) * (run ? 0.035 : 0.02) : sin(t * 1.4) * 0.006;
    this.body.position.y = bob - L * 0.17 - S * 0.04 + ST * 0.04 + (air ? 0.02 : 0);
    this.body.scale.set(1 + this.squash * 0.15, 1 - this.squash * 0.25, 1 + this.squash * 0.1);
    this.body.rotation.x = air ? clamp(-this.vy * 0.08, -0.35, 0.3) : (run ? 0.06 : 0) - S * 0.32 + ST * 0.42;
    P.torso.scale.y = 0.185 * (1 + sin(t * 1.4) * 0.012);

    // legs. Walk = lateral sequence (LH, LF, RH, RF a quarter cycle apart); run = bound (front pair, then hind pair).
    // Legs are ordered FR, FL, HR, HL. A leg lifts (knee + ankle fold) while it swings forward and plants while it swings back.
    const walkOff = [0.75, 0.25, 0.5, 0], boundOff = [0, 0.12, 0.5, 0.62];
    if (run) this.body.rotation.x += sin(this.walkPhase) * 0.07;
    for (let i = 0; i < 4; i++) {
      const leg = P.legs[i];
      let hip = leg.restHip, knee = leg.restKnee, ankle = leg.restAnkle;
      if (moving) {
        const ph = this.walkPhase + (run ? boundOff : walkOff)[i] * TAU, amp = run ? 0.85 : 0.5;
        const swing = sin(ph), lift = Math.pow(max(0, sin(ph - 0.5)), 1.3);
        hip += swing * amp;
        knee += leg.front ? -lift * 0.95 : -lift * 1.1;
        ankle += leg.front ? lift * 0.55 : lift * 0.7;
        if (!leg.front) hip += run ? 0.15 : 0;                                                   // hind legs drive from further back in a bound
      } else if (air) {
        hip += leg.front ? -0.6 : 0.5; knee += leg.front ? 0.3 : -0.45; ankle += leg.front ? -0.2 : 0.3;
      }
      const loafHip = leg.front ? 1.25 : 1.55, loafKnee = leg.front ? -2.35 : -2.55, loafAnkle = leg.front ? 1.2 : 1.3;
      const sitHip = leg.front ? -0.2 : 1.35, sitKnee = leg.front ? 0.05 : -2.3, sitAnkle = leg.front ? 0.1 : 1.1;   // sit: front legs straight, hind legs folded
      hip = lerp(hip, sitHip, S); knee = lerp(knee, sitKnee, S); ankle = lerp(ankle, sitAnkle, S);
      if (leg.front) { hip -= ST * 1.1; knee += ST * 0.3; } else { hip += ST * 0.3; }              // stretch: front legs reach forward
      leg.hip.rotation.x = lerp(hip, loafHip, L); leg.knee.rotation.x = lerp(knee, loafKnee, L); leg.ankle.rotation.x = lerp(ankle, loafAnkle, L);
    }

    // tail
    const wag = moving ? 2.6 + (run ? 2 : 0) : 1.4;
    for (let i = 0; i < 8; i++) {
      const j = P.tail[i], k = i / 7;
      const upBase = moving ? 0.35 : 0.85;
      const curl = i === 0 ? upBase : (moving ? 0.1 : 0.19 + k * 0.05);
      const restX = lerp(curl, i === 0 ? -0.2 : (i < 3 ? 0.55 : 0.28), max(L, S * 0.7));       // loaf / sit: curl around the body
      j.rotation.x = restX + (air ? (i === 0 ? -0.5 : -0.05) : 0);
      j.rotation.y = sin(t * wag + i * 0.55) * (0.05 + k * 0.1) * (1 - L * 0.6);
      j.rotation.z = lerp(0, i === 0 ? 0.6 : 0.12, L) + sin(t * wag * 0.7 + i * 0.3) * 0.02;
    }

    // head: look-around when idle, forward when moving
    this.lookT -= dt;
    if (this.lookT <= 0) { this.lookT = rnd.range(1.5, 4.5); this.lookTargetYaw = moving ? 0 : rnd.range(-0.55, 0.55); this.lookTargetPitch = moving ? 0 : rnd.range(-0.12, 0.2); }
    if (moving) { this.lookTargetYaw = 0; this.lookTargetPitch = -0.05; }
    this.lookYaw = damp(this.lookYaw, this.lookTargetYaw, 4, dt); this.lookPitch = damp(this.lookPitch, this.lookTargetPitch, 4, dt);
    P.head.rotation.set(this.lookPitch - L * 0.12 + S * 0.22 - ST * 0.5 + (moving ? sin(this.walkPhase * 2) * 0.02 : 0), this.lookYaw, sin(t * 1.1) * 0.015);
    P.head.position.y = 0.565 - L * 0.06 + S * 0.03;

    // blink
    this.blinkT += dt;
    let lid = 0;
    if (this.blinkT > this.nextBlink) {
      const ph = (this.blinkT - this.nextBlink) / this.blinkDur;
      if (ph < 1) lid = sin(ph * PI); else { this.blinkT = 0; this.nextBlink = rnd.range(2.2, 6) * (rnd.chance(0.2) ? 0.15 : 1); }
    }
    const sleepy = L * 0.55;
    for (const l of P.eyelids) l.rotation.x = lerp(-1.05, PI / 2 + 0.1, max(lid, sleepy));

    // ears: random twitch + flatten slightly when running
    this.earT += dt;
    let tw = 0;
    if (this.earT > this.nextEar) { const ph = (this.earT - this.nextEar) / 0.22; if (ph < 1) tw = sin(ph * PI) * 0.35; else { this.earT = 0; this.nextEar = rnd.range(1.5, 5); this.earSide = rnd.chance(0.5) ? 1 : -1; } }
    for (const side of [1, -1]) { const e = P['ear' + side]; e.rotation.z = side * -0.36 + (this.earSide === side ? tw * side * -1 : 0); e.rotation.x = -0.18 - (run ? 0.35 : 0) + (this.earSide === side ? tw * 0.5 : 0); }

    // pupils: slightly wider in dark worlds is handled by skin; dilate when running
    const pw = run ? 0.62 : 0.4;
    P.pupil1.scale.x = damp(P.pupil1.scale.x, pw, 5, dt); P['pupil-1'].scale.x = P.pupil1.scale.x;
  }
  land(v) { this.squash = clamp(abs(v) * 0.18, 0.25, 0.9); }

  /** Animates the non-cat shapes. */
  animateForm(dt, t, moving, run) {
    const rig = this.forms[this.form]; if (!rig) return;
    const air = this.onGround ? 0 : 1;
    this.squash = damp(this.squash, 0, 9, dt);
    switch (this.form) {
      case 'butterfly': {
        rig.animate(this.walkPhase, true, dt, t);
        rig.group.position.y = 0.55 + sin(t * 3.1) * 0.05;
        rig.group.rotation.x = damp(rig.group.rotation.x, clamp(-this.vy * 0.09, -0.5, 0.5) + (moving ? 0.25 : 0), 5, dt);
        rig.group.rotation.z = damp(rig.group.rotation.z, moving ? sin(t * 2.2) * 0.12 : 0, 4, dt);
        break; }
      case 'frog':
        rig.animate(this.walkPhase, moving || air, dt, t);
        rig.group.position.y = air ? 0.04 : (moving ? abs(sin(this.walkPhase * 0.5)) * 0.12 : 0);
        rig.group.rotation.x = air ? clamp(-this.vy * 0.06, -0.3, 0.3) : 0;
        break;
      case 'worm':
        rig.animate(this.walkPhase, moving, dt, t);
        break;
      case 'human':
        rig.animate(this.walkPhase * 0.5, moving, dt, t);
        rig.group.scale.setScalar(1 - this.squash * 0.12); rig.group.rotation.x = air ? -0.08 : (run ? 0.1 : 0);
        break;
      case 'squirrel':
        rig.animate(this.walkPhase, moving, dt, t);
        rig.group.position.y = moving ? abs(sin(this.walkPhase * 0.5)) * 0.1 : 0;
        break;
    }
  }
}

// ---------------------------------------------------------------- worm rig: a wriggling chain of segments (faces +Z)
function makeWorm(color = 0xe8a4a0) {
  const g = new THREE.Group(), rig = { group: g, segs: [] };
  const skin = mat(color, { roughness: 0.55 }), band = mat(0xc97f7a, { roughness: 0.55 }), dark = mat(0x111111);
  const body = group(0, 0, 0, g); rig.body = body;
  const n = 10;
  for (let i = 0; i < n; i++) {
    const r = 0.068 - abs(i - 2) * 0.0035;
    const s = mesh(G.sphere(1, 10, 8), i % 3 === 1 ? band : skin, { y: r, z: 0.34 - i * 0.076, sx: r, sy: r, sz: r * 1.25, parent: body });
    s.userData.r = r; rig.segs.push(s);
  }
  for (const side of [1, -1]) mesh(G.sphere(0.011, 6, 6), dark, { x: side * 0.028, y: 0.085, z: 0.39, shadow: 'none', parent: body });
  rig.animate = (ph, moving, dt, t = 0) => {
    for (let i = 0; i < n; i++) {
      const s = rig.segs[i], r = s.userData.r, w = moving ? sin(ph * 0.9 - i * 0.75) : sin(t * 1.4 - i * 0.6) * 0.35;
      s.position.x = w * 0.035;
      s.position.y = r + (moving ? max(0, sin(ph * 0.9 - i * 0.75 + 1.2)) * 0.025 : 0);
      s.scale.z = r * (1.25 + (moving ? sin(ph * 0.9 - i * 0.75) * 0.3 : 0));
    }
  };
  return rig;
}
