// ============================================================================
// PROCEDURAL TEXTURES — everything is painted on <canvas> at startup
// ============================================================================
let MAX_ANISO = 4;
const texCache = new Map();

function canvas2d(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function toTexture(c, { repeat = [1, 1], srgb = true, keep = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = MAX_ANISO;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  (keep ? globalBag : worldBag).track(t);
  return t;
}
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** Speckle noise pass: scatters tiny strokes of varied lightness over the canvas. */
function speckle(ctx, w, h, count, hue, sat, lightMin, lightMax, rng, len = 3, alpha = 0.35) {
  for (let i = 0; i < count; i++) {
    ctx.strokeStyle = hsl(hue + rng.range(-6, 6), sat, rng.range(lightMin, lightMax), alpha);
    ctx.lineWidth = rng.range(0.6, 1.6);
    const x = rng() * w, y = rng() * h, a = rng.range(-0.4, 0.4) - PI / 2, l = rng.range(len * 0.4, len);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cos(a) * l, y + sin(a) * l); ctx.stroke();
  }
}

const TEX = {
  get(key, make) { let t = texCache.get(key); if (!t) { t = make(); texCache.set(key, t); } return t; },
  /** Round badge with a big emoji on it — used for the floating marker above the cat's own house. */
  badge(emoji, ring = '#ffd36a', fill = 'rgba(20,14,34,0.88)') {
    return TEX.get('badge' + emoji + ring, () => {
      const [c, x] = canvas2d(256, 256);
      x.clearRect(0, 0, 256, 256);
      x.beginPath(); x.arc(128, 128, 104, 0, TAU); x.fillStyle = fill; x.fill();
      x.lineWidth = 12; x.strokeStyle = ring; x.stroke();
      x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(128, 128, 88, 0, TAU); x.stroke();
      x.font = '120px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(emoji, 128, 136);
      return toTexture(c, { srgb: true });
    });
  },

  grass() { return this.get('grass', () => {
    const rng = seeded(11), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#4f8c3c'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = hsl(rng.range(85, 120), 40, rng.range(30, 44), 0.25); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(20, 70), 0, TAU); ctx.fill(); }
    speckle(ctx, 512, 512, 9000, 105, 45, 26, 52, rng, 7, 0.5);
    for (let i = 0; i < 120; i++) { ctx.fillStyle = hsl(rng.range(50, 60), 70, 60, 0.35); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(1, 2), 0, TAU); ctx.fill(); }
    return toTexture(c, { repeat: [70, 70] });
  }); },

  asphalt() { return this.get('asphalt', () => {
    const rng = seeded(12), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#3a3b40'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6000; i++) { ctx.fillStyle = hsl(220, 4, rng.range(16, 34), 0.5); ctx.fillRect(rng() * 256, rng() * 256, 1.5, 1.5); }
    return toTexture(c, { repeat: [40, 2] });
  }); },

  sidewalk() { return this.get('sidewalk', () => {
    const rng = seeded(13), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#a9a7a2'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = hsl(40, 6, rng.range(55, 75), 0.5); ctx.fillRect(rng() * 256, rng() * 256, 1.5, 1.5); }
    ctx.strokeStyle = '#7d7b76'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 252, 252);
    return toTexture(c, { repeat: [60, 1] });
  }); },

  cobble() { return this.get('cobble', () => {
    const rng = seeded(14), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#3a3532'; ctx.fillRect(0, 0, 512, 512);
    const cols = 8, rows = 10, cw = 512 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) for (let col = -1; col <= cols; col++) {
      const off = r % 2 ? cw / 2 : 0, x = col * cw + off + rng.range(-2, 2), y = r * rh + rng.range(-2, 2);
      const w = cw - rng.range(6, 12), h = rh - rng.range(5, 10), l = rng.range(36, 58);
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, hsl(30, 6, l + 8)); grad.addColorStop(1, hsl(30, 6, l - 8));
      ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    }
    speckle(ctx, 512, 512, 3000, 30, 5, 30, 60, rng, 3, 0.25);
    return toTexture(c, { repeat: [50, 50] });
  }); },

  candyGround() { return this.get('candy', () => {
    const rng = seeded(15), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#ffb3d1'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = hsl(rng.range(320, 345), 90, rng.range(80, 88), 0.5); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(30, 90), 0, TAU); ctx.fill(); }
    for (let i = 0; i < 260; i++) { ctx.fillStyle = hsl(rng.pick([330, 300, 350, 190, 50]), 85, 72, 0.8); ctx.beginPath(); ctx.arc(rng() * 512, rng() * 512, rng.range(2, 5), 0, TAU); ctx.fill(); }
    speckle(ctx, 512, 512, 2500, 335, 70, 72, 90, rng, 4, 0.3);
    return toTexture(c, { repeat: [40, 40] });
  }); },

  chocolate() { return this.get('choc', () => {
    const rng = seeded(16), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#6b3a1c'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 30; i++) { ctx.strokeStyle = hsl(24, 55, rng.range(22, 48), 0.6); ctx.lineWidth = rng.range(3, 9); ctx.beginPath(); const y = rng() * 256; ctx.moveTo(0, y); ctx.bezierCurveTo(80, y + rng.range(-30, 30), 170, y + rng.range(-30, 30), 256, y); ctx.stroke(); }
    return toTexture(c, { repeat: [12, 2] });
  }); },

  metalFloor() { return this.get('metal', () => {
    const rng = seeded(17), [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#22252c'; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 7000; i++) { ctx.fillStyle = hsl(220, 8, rng.range(10, 24), 0.5); ctx.fillRect(rng() * 512, rng() * 512, 2, 2); }
    ctx.strokeStyle = '#15171c'; ctx.lineWidth = 6; for (let i = 0; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 256, 0); ctx.lineTo(i * 256, 512); ctx.moveTo(0, i * 256); ctx.lineTo(512, i * 256); ctx.stroke(); }
    ctx.fillStyle = '#3b3f48'; for (let x = 0; x < 512; x += 256) for (let y = 0; y < 512; y += 256) for (const [dx, dy] of [[18, 18], [238, 18], [18, 238], [238, 238]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 5, 0, TAU); ctx.fill(); }
    return toTexture(c, { repeat: [40, 40] });
  }); },

  metalGlow() { return this.get('metalGlow', () => {
    const [c, ctx] = canvas2d(512, 512);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 8;
    for (let i = 0; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 256, 0); ctx.lineTo(i * 256, 512); ctx.moveTo(0, i * 256); ctx.lineTo(512, i * 256); ctx.stroke(); }
    return toTexture(c, { repeat: [40, 40] });
  }); },

  brick(hue = 12, keyExtra = '') { return this.get('brick' + hue + keyExtra, () => {
    const rng = seeded(18 + hue), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = hsl(30, 15, 62); ctx.fillRect(0, 0, 256, 256);
    const bw = 64, bh = 32;
    for (let r = 0; r < 8; r++) for (let col = -1; col <= 4; col++) {
      const x = col * bw + (r % 2 ? bw / 2 : 0), y = r * bh;
      ctx.fillStyle = hsl(hue + rng.range(-5, 5), rng.range(45, 60), rng.range(30, 42)); ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
    speckle(ctx, 256, 256, 1500, hue, 30, 25, 50, rng, 3, 0.25);
    return toTexture(c, { repeat: [2, 2] });
  }); },

  planks(hue = 28, light = 34) { return this.get(`planks${hue}${light}`, () => {
    const rng = seeded(19 + hue), [c, ctx] = canvas2d(256, 256);
    for (let p = 0; p < 4; p++) {
      ctx.fillStyle = hsl(hue, 45, light + rng.range(-5, 5)); ctx.fillRect(p * 64, 0, 64, 256);
      ctx.strokeStyle = hsl(hue, 40, light - 12, 0.7); ctx.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) { const x = p * 64 + 6 + rng() * 52; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + rng.range(-5, 5), 90, x + rng.range(-5, 5), 170, x, 256); ctx.stroke(); }
      ctx.fillStyle = hsl(hue, 40, light - 18); ctx.fillRect(p * 64, 0, 2, 256);
    }
    return toTexture(c, { repeat: [1, 1] });
  }); },

  /** Skyscraper facade with random lit windows; returns {map, emissive}. */
  facade(seed) { return this.get('facade' + seed, () => {
    const rng = seeded(100 + seed), cols = 6, rows = 24;
    const [c, ctx] = canvas2d(192, 768), [e, ectx] = canvas2d(192, 768);
    ctx.fillStyle = '#12131c'; ctx.fillRect(0, 0, 192, 768); ectx.fillStyle = '#000'; ectx.fillRect(0, 0, 192, 768);
    const palette = ['#7fe9ff', '#ff6ad5', '#ffd166', '#b8f4ff', '#ff9f43', '#c3f7a8'];
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const x = col * 32 + 7, y = r * 32 + 7, lit = rng.chance(0.55);
      const color = lit ? rng.pick(palette) : '#1e2130';
      ctx.fillStyle = color; ctx.fillRect(x, y, 18, 18);
      if (lit) { ectx.fillStyle = color; ectx.globalAlpha = rng.range(0.5, 1); ectx.fillRect(x, y, 18, 18); ectx.globalAlpha = 1; }
    }
    return { map: toTexture(c), emissive: toTexture(e) };
  }); },

  candyCane() { return this.get('cane', () => {
    const [c, ctx] = canvas2d(128, 128);
    ctx.fillStyle = '#fff5f5'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#e8172b';
    for (let i = -2; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64 + 28, 0); ctx.lineTo(i * 64 + 28 + 128, 128); ctx.lineTo(i * 64 + 128, 128); ctx.closePath(); ctx.fill(); }
    return toTexture(c, { repeat: [1, 6] });
  }); },

  lollipop(hue) { return this.get('lolli' + hue, () => {
    const [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(128, 128, 128, 0, TAU); ctx.fill();
    ctx.strokeStyle = hsl(hue, 90, 55); ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath();
    for (let a = 0; a < TAU * 4.2; a += 0.05) { const r = a * 4.6; const x = 128 + cos(a) * r, y = 128 + sin(a) * r; a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    return toTexture(c);
  }); },

  clockFace() { return this.get('clock', () => {
    const [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = '#f3ead6'; ctx.beginPath(); ctx.arc(128, 128, 124, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(128, 128, 118, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = i % 3 ? 4 : 8; ctx.beginPath(); ctx.moveTo(128 + cos(a) * 96, 128 + sin(a) * 96); ctx.lineTo(128 + cos(a) * 110, 128 + sin(a) * 110); ctx.stroke(); }
    ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128 + cos(-PI / 2 + 0.52 * 6.5) * 62, 128 + sin(-PI / 2 + 0.52 * 6.5) * 62); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128 + cos(-PI / 2 + 0.52 * 3) * 92, 128 + sin(-PI / 2 + 0.52 * 3) * 92); ctx.stroke();
    return toTexture(c);
  }); },

  neonText(text, color) { return this.get('neon' + text + color, () => {
    const [c, ctx] = canvas2d(512, 128);
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = '900 76px Arial, Helvetica, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = 26; ctx.fillStyle = color; ctx.fillText(text, 256, 68); ctx.fillText(text, 256, 68);
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.85; ctx.fillText(text, 256, 68);
    const t = toTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }); },

  /** Soft radial dot for particles and glow sprites. */
  glow() { return this.get('glow', () => {
    const [c, ctx] = canvas2d(128, 128);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.7)'); g.addColorStop(0.6, 'rgba(255,255,255,0.15)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = toTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }); },

  heartSprite() { return this.get('heartSprite', () => {
    const [c, ctx] = canvas2d(64, 64);
    ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.moveTo(32, 56);
    ctx.bezierCurveTo(8, 38, 4, 22, 14, 14); ctx.bezierCurveTo(22, 8, 30, 12, 32, 20); ctx.bezierCurveTo(34, 12, 42, 8, 50, 14); ctx.bezierCurveTo(60, 22, 56, 38, 32, 56); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(22, 20, 5, 3, -0.6, 0, TAU); ctx.fill();
    const t = toTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }); },

  /** Fur: noisy base with optional tabby stripes / robot panels / candy sprinkles. */
  fur(key, hue, sat, light, style) { return this.get('fur' + key, () => {
    const rng = seeded(200 + hue), [c, ctx] = canvas2d(256, 256);
    ctx.fillStyle = hsl(hue, sat, light); ctx.fillRect(0, 0, 256, 256);
    if (style === 'metal') {
      for (let i = 0; i < 2500; i++) { ctx.fillStyle = hsl(hue, sat, light + rng.range(-6, 6), 0.5); ctx.fillRect(rng() * 256, rng() * 256, 2, 2); }
      ctx.strokeStyle = hsl(hue, sat, light - 18, 0.9); ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const y = 20 + i * 50; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { const x = 30 + i * 64; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
      ctx.fillStyle = hsl(hue, sat, light - 25); for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rng() * 256, rng() * 256, 2.5, 0, TAU); ctx.fill(); }
    } else {
      speckle(ctx, 256, 256, 6000, hue, sat, light - 9, light + 9, rng, 6, 0.45);
      if (style === 'tabby') {
        ctx.strokeStyle = hsl(hue, sat + 5, light - 26, 0.55); ctx.lineCap = 'round';
        for (let i = 0; i < 7; i++) { const y = 18 + i * 34; ctx.lineWidth = rng.range(7, 12); ctx.beginPath(); ctx.moveTo(-10, y); for (let x = 0; x <= 266; x += 24) ctx.lineTo(x, y + sin(x * 0.08 + i) * 6 + rng.range(-3, 3)); ctx.stroke(); }
      }
      if (style === 'sprinkles') for (let i = 0; i < 160; i++) { ctx.fillStyle = hsl(rng.pick([50, 190, 300, 0]), 90, 70, 0.9); ctx.beginPath(); ctx.arc(rng() * 256, rng() * 256, rng.range(1.5, 3), 0, TAU); ctx.fill(); }
      if (style === 'patches') for (let i = 0; i < 14; i++) { ctx.fillStyle = hsl(hue, sat, light + 14, 0.45); ctx.beginPath(); ctx.ellipse(rng() * 256, rng() * 256, rng.range(14, 30), rng.range(10, 20), rng() * PI, 0, TAU); ctx.fill(); }
    }
    return toTexture(c, { repeat: [2, 1] });
  }); },
};
