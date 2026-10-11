// ============================================================================
// SKY — gradient dome with sun, star field, moon and drifting clouds
// ============================================================================
class Sky {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group);
    this.u = {
      topColor: { value: new THREE.Color(0x3d7ee0) }, horizonColor: { value: new THREE.Color(0xbfe2ff) }, bottomColor: { value: new THREE.Color(0x7a9a6a) },
      sunDir: { value: new THREE.Vector3(0.4, 0.5, 0.3).normalize() }, sunColor: { value: new THREE.Color(0xfff2c8) }, sunSize: { value: 400 }, halo: { value: 0.35 },
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.u, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `
        uniform vec3 topColor, horizonColor, bottomColor, sunColor, sunDir; uniform float sunSize, halo; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(horizonColor, topColor, pow(smoothstep(0.0, 0.55, h), 0.75));
          col = mix(bottomColor, col, smoothstep(-0.3, 0.0, h));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += sunColor * (pow(s, sunSize) * 1.3 + pow(s, 12.0) * halo * 0.5 + pow(s, 2.5) * halo * 0.16);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    globalBag.track(skyMat);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 18), skyMat);
    this.dome.frustumCulled = false; this.dome.renderOrder = -10; this.group.add(this.dome);

    // stars
    const N = 1600, pos = new Float32Array(N * 3), phase = new Float32Array(N), size = new Float32Array(N);
    const r = seeded(7);
    for (let i = 0; i < N; i++) {
      const a = r() * TAU, y = 0.04 + r() * 0.96, rr = sqrt(1 - y * y);
      pos[i * 3] = cos(a) * rr * 470; pos[i * 3 + 1] = y * 470; pos[i * 3 + 2] = sin(a) * rr * 470;
      phase[i] = r() * TAU; size[i] = r.range(1.2, 3.2);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('phase', new THREE.BufferAttribute(phase, 1)); sg.setAttribute('size', new THREE.BufferAttribute(size, 1));
    this.starU = { time: { value: 0 }, opacity: { value: 0 } };
    const starMat = new THREE.ShaderMaterial({
      uniforms: this.starU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: `attribute float phase; attribute float size; uniform float time; uniform float opacity; varying float vA;
        void main(){ vA = opacity * (0.5 + 0.5 * sin(time * 1.7 + phase)); gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.1, length(c)) * vA; gl_FragColor = vec4(1.0, 1.0, 1.0, a); }`,
    });
    globalBag.track(sg); globalBag.track(starMat);
    this.stars = new THREE.Points(sg, starMat); this.stars.frustumCulled = false; this.stars.renderOrder = -9; this.group.add(this.stars);

    // moon + glow
    this.moon = new THREE.Group();
    this.moon.add(new THREE.Mesh(G.sphere(11, 24, 16), basic(0xf6f1de, { fog: false }, true)));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow(), color: 0xcfd8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    glow.scale.set(70, 70, 1); this.moon.add(glow);
    this.moon.visible = false; this.group.add(this.moon);

    // a handful of shooting stars — paths and timings are fixed once here (continuing to draw from
    // this same local `seeded(7)`, never the shared `rnd()`), so every night sky in every world always
    // streaks the same way. Each is a short trail of fading glow dots rather than one oriented sprite,
    // so it reads as a streak from any camera angle without needing to rotate to face its own direction
    // of travel. Gated by `starU.opacity` (the same value that fades stars in), it only ever shows once
    // the sky is dark enough for stars to be visible at all.
    this.meteors = [];
    const meteorTex = TEX.glow();
    for (let i = 0; i < 4; i++) {
      const a = r() * TAU, y = 0.45 + r() * 0.4, rr = sqrt(1 - y * y);
      const start = new THREE.Vector3(cos(a) * rr * 440, y * 440, sin(a) * rr * 440);
      const dir = new THREE.Vector3(r.range(-1, 1), -r.range(0.25, 0.55), r.range(-1, 1)); dir.normalize();
      const dots = [];
      for (let j = 0; j < 5; j++) {
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: meteorTex, color: 0xeaf6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        spr.scale.setScalar(5 - j * 0.8); this.group.add(spr); dots.push(spr);
      }
      this.meteors.push({ dots, start, dir, period: r.range(19, 33), offset: r() * 40, len: r.range(55, 85) });
    }
    this.time = 0;
  }
  /** preset: { top, horizon, bottom, sun:[x,y,z], sunColor, sunSize, halo, stars, moon:[x,y,z] } */
  apply(p) {
    this.u.topColor.value.set(p.top); this.u.horizonColor.value.set(p.horizon); this.u.bottomColor.value.set(p.bottom);
    this.u.sunDir.value.set(...p.sun).normalize(); this.u.sunColor.value.set(p.sunColor ?? 0xfff2c8);
    this.u.sunSize.value = p.sunSize ?? 400; this.u.halo.value = p.halo ?? 0.35;
    this.starU.opacity.value = p.stars ?? 0;
    this.moon.visible = !!p.moon; if (p.moon) this.moon.position.set(...p.moon);
  }
  update(camera, dt) {
    this.time += dt; this.group.position.copy(camera.position); this.starU.time.value = this.time;
    const vis = this.starU.opacity.value, dash = 0.05;
    for (const m of this.meteors) {
      const ph = ((this.time + m.offset) % m.period) / m.period;
      const active = vis > 0.01 && ph < dash;
      for (let j = 0; j < m.dots.length; j++) {
        const d = m.dots[j];
        if (!active) { d.material.opacity = 0; continue; }
        const back = ph / dash - j * 0.012;
        if (back < 0) { d.material.opacity = 0; continue; }
        const dist = back * m.len;
        d.position.set(m.start.x + m.dir.x * dist, m.start.y + m.dir.y * dist, m.start.z + m.dir.z * dist);
        d.material.opacity = sin((ph / dash) * PI) * vis * (1 - j / m.dots.length);
      }
    }
  }
}

/** Fluffy cloud from a few flattened spheres. */
function makeCloud(parent, x, y, z, scale = 1, color = 0xffffff, r = rnd) {
  const g = group(x, y, z, parent), m = mat(color, { roughness: 1, flatShading: false, emissive: color, emissiveIntensity: 0.12 });
  const n = r.int(4, 7);
  for (let i = 0; i < n; i++) {
    const rad = r.range(2.2, 4) * scale;
    mesh(G.sphere(1, 12, 9), m, { x: (i - n / 2) * 2.4 * scale + r.range(-1, 1), y: r.range(-0.4, 0.9) * scale, z: r.range(-1.2, 1.2) * scale, sx: rad, sy: rad * 0.62, sz: rad * 0.85, shadow: 'none', parent: g });
  }
  g.userData.drift = r.range(0.25, 0.6);
  return g;
}
