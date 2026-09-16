// ============================================================================
// PROCEDURAL TEXTURES II — sand, snow, water, bark, forest floor, ice, stone…
// (adds to the TEX bag defined in 25-textures.js)
// ============================================================================
Object.assign(TEX, {
  sand() { return this.get('sand', () => {
    const rng = seeded(31), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#e9d5a4'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = hsl(rng.range(38, 46), 45, rng.range(72, 84), 0.35); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(30, 90), 0, TAU); ctx.fill(); }
    // wind ripples
    ctx.strokeStyle = 'rgba(120,90,40,0.16)'; ctx.lineWidth = 2;
    for (let y = -20; y < 540; y += 14) { ctx.beginPath(); for (let x = 0; x <= 512; x += 16) { const yy = y + sin(x * 0.03 + y * 0.05) * 5 + rng.range(-1, 1); x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
    speckle(ctx, 512, 512, 7000, 42, 40, 62, 88, rng, 2, 0.45);
    return toTexture(c, { repeat: [60, 60] });
  }); },

  snow() { return this.get('snow', () => {
    const rng = seeded(32), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#f2f6fb'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = hsl(215, 40, rng.range(88, 96), 0.4); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(30, 100), 0, TAU); ctx.fill(); }
    speckle(ctx, 512, 512, 5000, 215, 25, 84, 99, rng, 2, 0.35);
    for (let i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(rng() * 512, rng() * 512, 1.5, 1.5); }  // sparkle
    return toTexture(c, { repeat: [50, 50] });
  }); },

  ice() { return this.get('ice', () => {
    const rng = seeded(33), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#bfe3f7'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) { ctx.beginPath(); let x = rng() * 256, y = rng() * 256; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rng.range(-40, 40); y += rng.range(-40, 40); ctx.lineTo(x, y); } ctx.stroke(); }
    speckle(ctx, 256, 256, 1200, 200, 40, 80, 96, rng, 3, 0.3);
    return toTexture(c, { repeat: [4, 4] });
  }); },

  water() { return this.get('water', () => {
    const rng = seeded(34), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#2f9fd6'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 24; i++) { ctx.fillStyle = hsl(rng.range(190, 205), 70, rng.range(48, 60), 0.35); ctx.beginPath(); ctx.arc(rng() * 256, rng() * 256, rng.range(20, 60), 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const x = rng() * 256, y = rng() * 256, l = rng.range(8, 26); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 3, x + l, y); ctx.stroke(); }
    return toTexture(c, { repeat: [14, 14] });
  }); },

  bark() { return this.get('bark', () => {
    const rng = seeded(35), [c, ctx] = canvas2d(128, 256);
    ctx.fillStyle = '#5a3d26'; ctx.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 40; i++) { ctx.strokeStyle = hsl(26, 35, rng.range(14, 34), 0.7); ctx.lineWidth = rng.range(2, 6); const x = rng() * 128; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + rng.range(-8, 8), 80, x + rng.range(-8, 8), 170, x, 256); ctx.stroke(); }
    speckle(ctx, 128, 256, 1500, 26, 30, 18, 40, rng, 6, 0.3);
    return toTexture(c, { repeat: [2, 1] });
  }); },

  forestFloor() { return this.get('forestFloor', () => {
    const rng = seeded(36), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#3f5a2a'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = hsl(rng.range(80, 120), 40, rng.range(20, 36), 0.35); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(20, 80), 0, TAU); ctx.fill(); }
    // leaf litter + moss
    for (let i = 0; i < 500; i++) { ctx.fillStyle = hsl(rng.pick([28, 35, 15, 95]), 55, rng.range(28, 48), 0.7); ctx.beginPath(); ctx.ellipse(rng() * 512, rng() * 512, rng.range(3, 7), rng.range(2, 4), rng() * PI, 0, TAU); ctx.fill(); }
    speckle(ctx, 512, 512, 6000, 100, 40, 18, 40, rng, 6, 0.4);
    return toTexture(c, { repeat: [60, 60] });
  }); },

  stone(hue = 30) { return this.get('stone' + hue, () => {
    const rng = seeded(37 + hue), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = hsl(hue, 8, 40); ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) { const x = rng() * 256, y = rng() * 256, w = rng.range(24, 60), h = rng.range(16, 36); ctx.fillStyle = hsl(hue + rng.range(-8, 8), 10, rng.range(38, 62)); ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = hsl(hue, 10, 24, 0.8); ctx.lineWidth = 2; ctx.stroke(); }
    speckle(ctx, 256, 256, 2000, hue, 8, 30, 60, rng, 3, 0.25);
    return toTexture(c, { repeat: [2, 2] });
  }); },

  /** Red-with-white-spots mushroom cap (also used with other hues). */
  mushroom(hue = 0) { return this.get('mush' + hue, () => {
    const rng = seeded(38 + hue), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = hsl(hue, 80, 48); ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = hsl(hue, 85, rng.range(42, 56)); ctx.beginPath(); ctx.arc(rng() * 256, rng() * 256, rng.range(20, 50), 0, TAU); ctx.fill(); }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(255,250,240,0.95)'; ctx.beginPath(); ctx.ellipse(rng() * 256, rng() * 256, rng.range(9, 20), rng.range(7, 15), rng() * PI, 0, TAU); ctx.fill(); }
    return toTexture(c, { repeat: [2, 1] });
  }); },

  /** Wooden sign text (dark letters on a plank). */
  signText(text, color = '#2b1b12') { return this.get('sign' + text + color, () => {
    const [c, ctx] = canvas2d(512, 128);
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = '700 64px Fredoka, "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(text, 256, 68);
    const t = toTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }); },

  /** Soft snowflake / bokeh dot with a bit of shape. */
  flake() { return this.get('flake', () => {
    const [c, ctx] = canvas2d(64, 64);
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const a = i * PI / 3; ctx.beginPath(); ctx.moveTo(32 - cos(a) * 20, 32 - sin(a) * 20); ctx.lineTo(32 + cos(a) * 20, 32 + sin(a) * 20); ctx.stroke(); }
    const t = toTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }); },

  /** Leafy canopy: mottled greens with a few vein strokes; tinted by the material colour. */
  leaf(hue = 110) { return this.get('leaf' + hue, () => {
    const rng = seeded(60 + hue), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = hsl(hue, 45, 34); ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = hsl(hue + rng.range(-12, 12), 50, rng.range(26, 48), 0.55); ctx.beginPath(); ctx.ellipse(rng() * 256, rng() * 256, rng.range(8, 22), rng.range(5, 12), rng() * PI, 0, TAU); ctx.fill(); }
    speckle(ctx, 256, 256, 3000, hue, 45, 24, 52, rng, 5, 0.4);
    for (let i = 0; i < 40; i++) { ctx.strokeStyle = hsl(hue, 40, 55, 0.35); ctx.lineWidth = 1; const x = rng() * 256, y = rng() * 256, a = rng() * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cos(a) * 14, y + sin(a) * 14); ctx.stroke(); }
    return toTexture(c, { repeat: [2, 2] });
  }); },

  /** Birch bark: chalky white with dark horizontal lenticels. */
  birchBark() { return this.get('birch', () => {
    const rng = seeded(61), [c, ctx] = canvas2d(128, 256);
    ctx.fillStyle = '#ece6d8'; ctx.fillRect(0, 0, 128, 256);
    speckle(ctx, 128, 256, 1200, 40, 10, 78, 95, rng, 4, 0.35);
    for (let i = 0; i < 26; i++) { ctx.fillStyle = hsl(30, 15, rng.range(10, 24), 0.85); const w = rng.range(10, 40), h = rng.range(2, 5); ctx.beginPath(); ctx.ellipse(rng() * 128, rng() * 256, w, h, 0, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = hsl(30, 10, 30, 0.5); ctx.fillRect(0, rng() * 256, 128, rng.range(1, 2)); }
    return toTexture(c, { repeat: [2, 1] });
  }); },

  /** Painted clapboard siding: horizontal boards with a shadow line under each. */
  siding(color = 0xf1e6cf) { return this.get('siding' + color, () => {
    const rng = seeded(62), [c, ctx] = canvas2d(256, 256), [h, sat, lt] = hexToHsl(color);
    ctx.fillStyle = hsl(h, sat, lt); ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) { ctx.fillStyle = hsl(h, sat, max(0, lt - 14), 0.55); ctx.fillRect(0, y + 26, 256, 6); ctx.fillStyle = hsl(h, sat, min(100, lt + 6), 0.5); ctx.fillRect(0, y, 256, 3); }
    speckle(ctx, 256, 256, 1500, h, sat, lt - 8, lt + 6, rng, 8, 0.2);
    return toTexture(c, { repeat: [2, 1] });
  }); },

  /** Bathroom / kitchen tiles: pale checkerboard with grout. */
  tiles(a = '#e8f0f4', b = '#cfe0ea') { return this.get('tiles' + a + b, () => {
    const [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#9fb0bb'; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? a : b; ctx.fillRect(x * 32 + 2, y * 32 + 2, 28, 28); }
    return toTexture(c, { repeat: [3, 3] });
  }); },

  /** Butterfly wing (one side); mirrored by geometry. */
  wing(hue) { return this.get('wing' + hue, () => {
    const [c, ctx] = canvas2d(64, 64);
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = hsl(hue, 85, 58); ctx.beginPath(); ctx.moveTo(4, 32); ctx.bezierCurveTo(10, 2, 60, 2, 60, 26); ctx.bezierCurveTo(60, 40, 40, 40, 34, 36); ctx.bezierCurveTo(56, 44, 52, 62, 30, 60); ctx.bezierCurveTo(14, 58, 6, 44, 4, 32); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (const [x, y, r] of [[40, 18, 6], [30, 46, 4], [46, 30, 3]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    const t = toTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }); },
});
