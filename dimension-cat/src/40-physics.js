// ============================================================================
// PHYSICS — static boxes (walls, props) + dynamic circles (creatures, cars)
// ============================================================================
const CAT_RADIUS = 0.26, CAT_HEIGHT = 0.7, STEP_HEIGHT = 0.34, GRAVITY = 16, JUMP_SPEED = 5.6;
const WORLD_LIMIT = 62;

class Physics {
  constructor() { this.boxes = []; this.circles = []; this.terrain = null; this.limit = WORLD_LIMIT; }
  clear() { this.boxes.length = 0; this.circles.length = 0; this.terrain = null; this.limit = WORLD_LIMIT; }
  /** How far from the origin creatures may roam in this world (the map is a square of ±limit). */
  setLimit(v) { this.limit = v; }
  /** Axis-aligned box from centre + size. opts.cam=false → camera passes through (trees, fences). */
  addBox(cx, cy, cz, w, h, d, opts = {}) {
    const b = { minX: cx - w / 2, maxX: cx + w / 2, minY: cy - h / 2, maxY: cy + h / 2, minZ: cz - d / 2, maxZ: cz + d / 2, cam: opts.cam !== false, walk: opts.walk !== false };
    this.boxes.push(b); return b;
  }
  removeBox(b) { const i = this.boxes.indexOf(b); if (i >= 0) this.boxes.splice(i, 1); }
  addCircle(ref, x, z, r) { const c = { ref, x, z, r, off: false }; this.circles.push(c); return c; }
  removeCircle(c) { const i = this.circles.indexOf(c); if (i >= 0) this.circles.splice(i, 1); }
  ground0(x, z) { return this.terrain ? this.terrain(x, z) : 0; }

  /** Slide a circle of radius r at foot height feetY out of anything it overlaps. */
  resolve(px, pz, feetY, r, ignore = null, height = CAT_HEIGHT, step = STEP_HEIGHT) {
    let hit = false;
    for (const b of this.boxes) {
      if (b.maxY <= feetY + (b.walk ? step : 0) || b.minY >= feetY + height) continue;
      const cx = clamp(px, b.minX, b.maxX), cz = clamp(pz, b.minZ, b.maxZ);
      const dx = px - cx, dz = pz - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      hit = true;
      if (d2 > 1e-9) { const d = sqrt(d2), k = (r - d) / d; px += dx * k; pz += dz * k; }
      else {
        const l = px - b.minX, rr = b.maxX - px, f = pz - b.minZ, k = b.maxZ - pz, m = min(l, rr, f, k);
        if (m === l) px = b.minX - r; else if (m === rr) px = b.maxX + r; else if (m === f) pz = b.minZ - r; else pz = b.maxZ + r;
      }
    }
    for (const c of this.circles) {
      if (c.off || c.ref === ignore) continue;
      const dx = px - c.x, dz = pz - c.z, rr = r + c.r, d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr) continue;
      hit = true;
      if (d2 > 1e-9) { const d = sqrt(d2); px += dx / d * (rr - d); pz += dz / d * (rr - d); } else px += rr;
    }
    px = clamp(px, -this.limit, this.limit); pz = clamp(pz, -this.limit, this.limit);
    return { x: px, z: pz, hit };
  }
  /** Highest walkable surface under (px,pz) that is reachable from feetY. */
  groundAt(px, pz, feetY, r = CAT_RADIUS, step = STEP_HEIGHT) {
    let g = this.ground0(px, pz);
    const m = r * 0.55;
    for (const b of this.boxes) {
      if (!b.walk || b.maxY > feetY + step + 1e-3 || b.maxY <= g) continue;
      if (px < b.minX - m || px > b.maxX + m || pz < b.minZ - m || pz > b.maxZ + m) continue;
      g = b.maxY;
    }
    return g;
  }
  /** True if a creature of radius r would overlap something at (px,pz). */
  blocked(px, pz, r, ignore = null, feetY = 0, step = 0.2, height = 1.8) {
    if (abs(px) > this.limit - 2 || abs(pz) > this.limit - 2) return true;
    for (const b of this.boxes) {
      if (b.maxY <= feetY + step || b.minY >= feetY + height) continue;
      const cx = clamp(px, b.minX, b.maxX), cz = clamp(pz, b.minZ, b.maxZ);
      if ((px - cx) ** 2 + (pz - cz) ** 2 < r * r) return true;
    }
    for (const c of this.circles) {
      if (c.off || c.ref === ignore) continue;
      if ((px - c.x) ** 2 + (pz - c.z) ** 2 < (r + c.r) ** 2) return true;
    }
    return false;
  }
  /** Fraction (0..1] of the segment from→to that is free of camera-blocking boxes. */
  rayClear(from, to, margin = 0.25) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    let best = 1;
    for (const b of this.boxes) {
      if (!b.cam) continue;
      let t0 = 0, t1 = 1;
      const axes = [[from.x, dx, b.minX - margin, b.maxX + margin], [from.y, dy, b.minY - margin, b.maxY + margin], [from.z, dz, b.minZ - margin, b.maxZ + margin]];
      let ok = true;
      for (const [o, d, lo, hi] of axes) {
        if (abs(d) < 1e-9) { if (o < lo || o > hi) { ok = false; break; } continue; }
        let a = (lo - o) / d, c = (hi - o) / d; if (a > c) [a, c] = [c, a];
        if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) { ok = false; break; }
      }
      if (ok && t0 < best) best = max(t0, 0);
    }
    return best;
  }
}
