// ============================================================================
// GAME — renderer, lighting, camera, input, HUD, transitions, main loop
// ============================================================================
const SAVE_KEY = 'dimension-cat-save-v1';
const store = {
  get() { try { return typeof localStorage === 'undefined' ? null : JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } },
  set(d) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch { /* private mode / quota: play on without saving */ } },
  clear() { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(SAVE_KEY); } catch {} },
};
/** Entry used to rebuild a saved world (the saved cat position then overrides the spawn). */
const ENTRY_FOR_INDEX = (i) => (i === 0 ? 'start' : i <= 3 ? 'from-prev' : 'from-hub');
const SKIN_ORDER = ['black', 'world', 'neighborhood', 'candy', 'robot', 'victorian', 'beach', 'snow', 'forest'];
const TIME_ORDER = ['auto', 'day', 'dusk', 'night'], TIME_ICON = { auto: '🔄', day: '☀️', dusk: '🌅', night: '🌙' };
/** How fast ← / → swing the camera, in radians per second. */
const CAM_TURN_SPEED = 2.2;
const IS_TOUCH = (() => { try { return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && 'ontouchstart' in window); } catch { return false; } })();

class Game {
  constructor() {
    const canvas = this.canvas = $('c');
    const renderer = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    MAX_ANISO = min(8, renderer.capabilities.getMaxAnisotropy());

    this.scene = new THREE.Scene();
    // near/far stay as tight as the game allows: the ink pass reads this depth buffer, and a wide
    // range there turns smooth ground into stripes.
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.45, 900);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.3); this.scene.add(this.ambient);
    this.hemi = new THREE.HemisphereLight(0xbfd9ff, 0x4a6a3a, 0.5); this.scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 180 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.035;
    this.scene.add(sun, sun.target); this.sunOffset = V3(40, 60, 26);

    this.sky = new Sky(this.scene);
    this.outline = new ToonOutline(renderer);
    this.lights = LIGHTS = new LightPool(this.scene, 10);
    this.physics = new Physics();
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.cat = new Cat(); this.scene.add(this.cat.group);
    this.cat.onStep = (run) => { if (this.started) SFX.step(this.surfaceKind(), run); };
    this.fx = new Particles(this.scene, { max: 800, size: 0.22, keep: true });
    this.heartGeo = G.heart(0.22, 0.05);

    this.state = { score: 0, collected: new Set(), completed: false, friends: new Set(), friendTotals: {}, everyone: false };   // friends: ids of everyone the cat has said hello to; friendTotals: how many there are to meet, per world seen
    this.friendSeq = 0; this.friendTotal = 0;
    this.form = 'cat'; this.skinMode = 'black'; this.timeMode = 'auto'; this.holdJump = false;
    this.touch = { x: 0, y: 0, active: false, run: false, jump: false };
    this.photo = false; this.photoCount = 0;
    this.interactables = []; this.npcs = []; this.squirrels = []; this.collectibles = null; this.worldIndex = -1; this.worldCtl = null;
    this.cam = { yaw: 0, pitch: 0.34, dist: 4.8, curDist: 4.8, target: V3(), fov: 50, lead: 0 };
    this.keys = new Set(); this.pointer = { down: false, moved: 0, x: 0, y: 0, id: null };
    this.started = false; this.transitioning = false; this.time = 0; this.clock = new THREE.Clock();
    this.nearest = null; this.hud = {}; this.msgTimer = null;
    const mapEl = $('map'); this.mapCtx = mapEl.getContext ? mapEl.getContext('2d') : null; this.mapOn = true; this.mapFrame = 0;
    this.tmpV = V3(); this.tmpV2 = V3(); this.tmpV3 = V3();

    this.bindUI();
    this.load(0, 'start');
    this.updateCamera(0, true);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // ------------------------------------------------------------------ setup
  /** Sky preset for the current world (remembered so the time-of-day toggles can blend away from it). */
  applySky(preset) { this.nativeSky = preset; this.sky.apply(preset); }
  setLighting({ ambient, hemi, sun, fog, exposure }) {
    this.nativeLight = { ambient, hemi, sun, fog, exposure };
    this.ambient.color.set(ambient[0]); this.ambient.intensity = ambient[1];
    this.hemi.color.set(hemi[0]); this.hemi.groundColor.set(hemi[1]); this.hemi.intensity = hemi[2];
    this.sun.color.set(sun[0]); this.sun.intensity = sun[1]; this.sunOffset.set(sun[2], sun[3], sun[4]);
    this.scene.fog = new THREE.Fog(fog[0], fog[1], fog[2]);
    this.renderer.toneMappingExposure = exposure ?? 1;
  }
  addInteractable(o) { this.interactables.push(o); }
  /** What the cat is walking on, for footstep sounds. */
  surfaceKind() {
    const key = WORLDS[this.worldIndex].key, p = this.cat.group.position;
    if (p.y > this.physics.ground0(p.x, p.z) + 0.05) return 'wood';                          // on furniture, a pier, a bridge…
    if (key === 'snow') return 'snow';
    if (key === 'robot' || key === 'victorian') return 'hard';
    if (key === 'neighborhood' && abs(p.z - 14) < 4.2) return 'hard';                          // the road + sidewalks
    return 'soft';
  }

  load(index, entry) {
    // tear down the previous world
    while (this.world.children.length) this.world.remove(this.world.children[0]);
    worldBag.dispose();
    this.physics.clear(); this.interactables = []; this.npcs = []; this.squirrels = []; this.fx.clear(); tweens.length = 0;
    this.lights.reset();
    this.collectibles = new Collectibles(this); this.homeMarker = null; this.zones = new Zones();
    this.worldIndex = index; this.friendSeq = 0; this.friendTotal = 0;
    const def = WORLDS[index];
    this.worldCtl = def.build(this, entry);
    this.state.friendTotals[def.key] = this.friendTotal;
    const s = this.worldCtl.spawn;
    this.cat.build(this.skinFor(def.key)); this.cat.buildForms(); this.cat.setForm(this.form);
    this.cat.group.position.set(s.x, s.y, s.z); this.cat.group.rotation.y = s.yaw; this.cat.vy = 0; this.cat.onGround = true; this.cat.speed = 0; this.cat.idleTime = 0; this.cat.loaf = 0;
    this.cam.yaw = s.yaw; this.cam.pitch = 0.34; this.cam.dist = 4.8; this.cam.curDist = this.cam.dist;
    this.updateCamera(0, true);
    $('world-name').textContent = `${def.icon} ${def.name}`;
    this.updateHud();
  }
  skinFor(worldKey) { return this.skinMode === 'world' ? worldKey : this.skinMode; }
  // ------------------------------------------------------------------ toggles: form, skin, time of day
  setForm(key, quiet = false) {
    if (!FORMS[key] || key === this.form) return;
    this.form = key; this.cat.setForm(key);
    this.cat.idleTime = 0; this.cat.loaf = 0; this.cat.sit = 0;
    if (!quiet) { SFX.twinkle(); const p = this.cat.group.position; this.fx.emit(p.x, p.y + 0.4, p.z, { count: 26, colors: [0xffffff, 0xffe082, 0xc8f0ff], speed: 1.8, up: 1.6, life: 0.8, gravity: 2 }); this.toast(`${FORMS[key].icon} You are a ${FORMS[key].name.toLowerCase()} now!`); }
    this.updateHud(); this.save();
  }
  cycleForm(dir = 1) { const i = FORM_ORDER.indexOf(this.form); this.setForm(FORM_ORDER[(i + dir + FORM_ORDER.length) % FORM_ORDER.length]); }
  setSkin(mode, quiet = false) {
    if (!SKIN_ORDER.includes(mode) || mode === this.skinMode) return;
    this.skinMode = mode; this.cat.build(this.skinFor(WORLDS[this.worldIndex].key));
    if (!quiet) this.toast(`🎨 ${SKINS[this.skinFor(WORLDS[this.worldIndex].key)].name} the ${this.skinMode === 'world' ? 'local' : ''} cat`);
    this.updateHud(); this.save();
  }
  cycleSkin() { const i = SKIN_ORDER.indexOf(this.skinMode); this.setSkin(SKIN_ORDER[(i + 1) % SKIN_ORDER.length]); }
  setTime(mode, quiet = false) {
    if (!TIME_ORDER.includes(mode) || mode === this.timeMode) return;
    this.timeMode = mode;
    if (!quiet) this.toast({ auto: '🔄 Time flows on its own again', day: '☀️ Daytime', dusk: '🌅 Dusk', night: '🌙 Night' }[mode]);
    this.updateHud(); this.save();
  }
  cycleTime() { const i = TIME_ORDER.indexOf(this.timeMode); this.setTime(TIME_ORDER[(i + 1) % TIME_ORDER.length]); }
  travel(index, entry) {
    if (this.transitioning) return;
    this.transitioning = true; SFX.portal();
    const fade = $('fade'); fade.style.opacity = '1';
    setTimeout(() => {
      this.load(index, entry);
      this.save();
      this.render();
      fade.style.opacity = '0';
      const card = $('card'); $('card-text').textContent = `${WORLDS[index].icon} ${WORLDS[index].name}`; $('card-sub').textContent = WORLDS[index].blurb || '';
      card.style.opacity = '1'; setTimeout(() => { card.style.opacity = '0'; }, 1900);
      setTimeout(() => { this.transitioning = false; }, 500);
      if (this.pendingToast) { const t = this.pendingToast; this.pendingToast = null; setTimeout(() => this.toast(t, 4500), 1600); }
    }, 520);
  }
  completeJourney() {
    if (this.transitioning) return;
    if (!this.state.completed) { this.state.completed = true; this.addScore(1000); this.pendingToast = `🎉 Through the time door and home! +1000 (score ${this.state.score})`; }
    else this.pendingToast = '🎉 Home again. The cat is pleased.';
    SFX.fanfare();
    this.travel(0, 'from-next');
  }

  // ------------------------------------------------------------------ save game
  save() {
    if (!this.started || this.freshLoad) return;
    const p = this.cat.group.position;
    store.set({ v: 1, score: this.state.score, collected: [...this.state.collected], completed: this.state.completed, friends: [...this.state.friends], friendTotals: this.state.friendTotals, everyone: this.state.everyone, form: this.form, skin: this.skinMode, time: this.timeMode,
      world: this.worldIndex, pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], yaw: +this.cat.group.rotation.y.toFixed(3), camYaw: +this.cam.yaw.toFixed(3), at: Date.now() });
  }
  /** Rebuilds the game from a save object (see save()). Returns false if the data is unusable. */
  restore(d) {
    if (!d || d.v !== 1 || !Number.isInteger(d.world) || d.world < 0 || d.world >= WORLDS.length) return false;
    this.state.score = d.score | 0; this.state.collected = new Set(d.collected || []); this.state.completed = !!d.completed; this.state.friends = new Set(d.friends || []); this.state.friendTotals = d.friendTotals || {}; this.state.everyone = !!d.everyone;
    if (FORMS[d.form]) { this.form = d.form; } if (SKIN_ORDER.includes(d.skin)) this.skinMode = d.skin; if (TIME_ORDER.includes(d.time)) this.timeMode = d.time;
    this.load(d.world, ENTRY_FOR_INDEX(d.world));
    if (Array.isArray(d.pos) && d.pos.length === 3 && d.pos.every(Number.isFinite)) {
      const [x, y, z] = d.pos, g = this.physics.groundAt(x, z, y + 0.3);
      this.cat.group.position.set(x, max(y, g), z); this.cat.group.rotation.y = Number.isFinite(d.yaw) ? d.yaw : 0; this.cam.yaw = Number.isFinite(d.camYaw) ? d.camYaw : this.cat.group.rotation.y;
      this.updateCamera(0, true);
    }
    this.updateHud();
    return true;
  }
  wipeSave() { store.clear(); }

  // ------------------------------------------------------------------ HUD
  /** Tie a balloon to the cat. It lives in the scene, not the world, so it comes along through every portal. */
  giveBalloon(color) {
    if (this.balloon) { this.scene.remove(this.balloon.group); }
    const g = makeBalloon(color, { y: 0 }, true); this.scene.add(g);
    const p = this.cat.group.position; g.position.set(p.x, p.y + 1.7, p.z);
    this.balloon = { group: g, color, t: 0, v: V3() };
  }
  updateBalloon(dt) {
    const b = this.balloon, c = this.cat.group.position, g = b.group; b.t += dt;
    // floats above and a little behind the cat, drifting after it rather than stuck to it
    const yaw = this.cat.group.rotation.y, tx = c.x - sin(yaw) * 0.35, tz = c.z - cos(yaw) * 0.35, ty = c.y + FORMS[this.form].height + 1.05 + sin(b.t * 1.1) * 0.06;   // clear of whatever shape the player is in
    if (dist2(g.position.x, g.position.z, tx, tz) > 400) g.position.set(tx, ty, tz);   // a portal jump: snap
    g.position.x = damp(g.position.x, tx, 4, dt); g.position.y = damp(g.position.y, ty, 5, dt); g.position.z = damp(g.position.z, tz, 4, dt);
    g.rotation.z = damp(g.rotation.z, (tx - g.position.x) * 0.6, 4, dt); g.rotation.x = damp(g.rotation.x, -(tz - g.position.z) * 0.6, 4, dt);
    // the string runs from the collar up to the balloon, in the balloon group's own space
    const bal = g.userData.balloon, str = g.children[1];
    bal.position.set(sin(b.t * 0.9) * 0.04, sin(b.t * 1.3) * 0.04, cos(b.t * 0.7) * 0.04);
    const cx = c.x - g.position.x, cy = c.y + 0.5 - g.position.y, cz = c.z - g.position.z;
    str.position.set(cx / 2, (cy + bal.position.y - 0.3) / 2, cz / 2);
    str.lookAt(g.position.x + bal.position.x, g.position.y + bal.position.y - 0.3, g.position.z + bal.position.z);
    str.scale.set(1, 1, max(0.01, Math.hypot(cx, cy - bal.position.y + 0.3, cz)));
  }
  toast(text, dur = 2200) {
    const el = $('msg'); el.textContent = text; el.classList.add('on');
    clearTimeout(this.msgTimer); this.msgTimer = setTimeout(() => el.classList.remove('on'), dur);
  }
  /** A named character (the yeti, the Candy Queen, a dog) that counts as someone to meet in this world; returns its friend id. */
  namedFriend(name) { this.friendTotal++; return WORLDS[this.worldIndex].key + ':' + name; }
  /** The cat said hello to someone new: a friend, five points, and a fanfare once everyone in the world has been met. */
  befriend(id) {
    if (this.state.friends.has(id)) return;
    this.state.friends.add(id); this.addScore(5);
    const key = WORLDS[this.worldIndex].key, here = [...this.state.friends].filter((f) => f.startsWith(key + ':')).length;
    if (here >= this.friendTotal && this.friendTotal > 0) { this.addScore(50); SFX.fanfare(); this.pendingToast = `\ud83c\udf89 Everyone in ${WORLDS[this.worldIndex].name} knows you now! +50`; setTimeout(() => { this.toast(this.pendingToast, 3200); this.pendingToast = null; }, 2700); }
    else { SFX.twinkle(); setTimeout(() => this.toast(`\ud83e\udd1d New friend! ${here} of ${this.friendTotal} in ${WORLDS[this.worldIndex].name}  +5`, 2400), 2700); }
    // and once every world has been seen and everyone in all of them met: the grand finale
    const totals = Object.values(this.state.friendTotals);
    if (!this.state.everyone && totals.length >= WORLDS.length && this.state.friends.size >= totals.reduce((a, b) => a + b, 0)) {
      this.state.everyone = true; this.addScore(500);
      setTimeout(() => { SFX.fanfare(); const c = this.cat.group.position; this.hearts(c.x, c.y + 0.8, c.z, 14); this.fx.emit(c.x, c.y + 0.6, c.z, { count: 60, colors: [0xff6fb5, 0xffd54a, 0x7fd7ff, 0xa8ff9a], speed: 2.4, up: 3, life: 1.6, gravity: 2 }); this.toast('\ud83c\udf0d Friends with everyone in every dimension! +500', 5000); }, 5600);
    }
    this.updateHud(); this.save();
  }
  addScore(n) { this.state.score += n; const v = $('score'); v.textContent = this.state.score; v.classList.remove('pop'); void v.offsetWidth; v.classList.add('pop'); }
  updateHud() {
    $('score').textContent = this.state.score;
    if (this.collectibles) $('items').textContent = `${this.collectibles.collectedHere} / ${this.collectibles.total}`;
    { const key = WORLDS[this.worldIndex].key, el = $('friends'); el.textContent = `${[...this.state.friends].filter((f) => f.startsWith(key + ':')).length} / ${this.friendTotal}`; if (el.parentElement) el.parentElement.style.display = this.friendTotal ? '' : 'none'; }
    const F = FORMS[this.form], skin = SKINS[this.skinFor(WORLDS[this.worldIndex].key)];
    $('cat-name').textContent = this.form === 'cat' ? skin.name : `${skin.name} the ${F.name.toLowerCase()}`;
    $('tg-form').textContent = `${F.icon} ${F.name}`; $('tg-skin').textContent = `🎨 ${skin.name}`; $('tg-time').textContent = `${TIME_ICON[this.timeMode]} ${this.timeMode === 'auto' ? 'Time' : this.timeMode[0].toUpperCase() + this.timeMode.slice(1)}`;
  }
  hearts(x, y, z, n = 6) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.MeshBasicMaterial({ color: rnd.pick([0xff5c8a, 0xff8fb1, 0xff3d7a]), transparent: true, opacity: 1, side: THREE.DoubleSide });
      const h = new THREE.Mesh(this.heartGeo, m); h.position.set(x + rnd.range(-0.3, 0.3), y + rnd.range(0, 0.3), z + rnd.range(-0.3, 0.3)); h.rotation.y = rnd() * TAU;
      const s = rnd.range(0.6, 1.1); h.scale.setScalar(s); this.world.add(h); worldBag.track(m);
      const vx = rnd.range(-0.3, 0.3), vy = rnd.range(0.9, 1.5), vz = rnd.range(-0.3, 0.3), delay = i * 0.06;
      tween(1.4 + delay, (k) => { const t = max(0, (k * (1.4 + delay) - delay) / 1.4); h.position.y += vy * 0.016 * (t > 0 ? 1 : 0); h.position.x += vx * 0.016; h.position.z += vz * 0.016; h.rotation.y += 0.05; m.opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; h.scale.setScalar(s * (0.6 + 0.4 * min(1, t * 4))); }, () => { this.world.remove(h); m.dispose(); }, (t) => t);
    }
  }

  // ------------------------------------------------------------------ input
  bindUI() {
    const canvas = this.canvas;
    const saved = this.savedGame = store.get();
    $('enter').disabled = false;
    if (saved && saved.v === 1) {
      $('enter').textContent = 'CONTINUE'; $('continue-info').textContent = `${WORLDS[saved.world] ? WORLDS[saved.world].icon + ' ' + WORLDS[saved.world].name : ''} · score ${saved.score | 0} · ${(saved.friends || []).length} friends · ${(saved.collected || []).length} treasures found`;
      $('new-game').style.display = 'inline-block';
    }
    $('enter').addEventListener('click', () => this.start(this.savedGame ? 'continue' : 'new'));
    $('new-game').addEventListener('click', () => this.start('new'));
    $('photo-btn').addEventListener('click', () => this.togglePhoto());
    $('tg-form').addEventListener('click', () => { if (this.started) this.cycleForm(); });
    $('tg-skin').addEventListener('click', () => { if (this.started) this.cycleSkin(); });
    $('tg-time').addEventListener('click', () => { if (this.started) this.cycleTime(); });
    $('photo-save').addEventListener('click', () => this.snapshot());
    $('photo-exit').addEventListener('click', () => this.togglePhoto(false));
    $('help-btn').addEventListener('click', () => this.toggleHelp());
    $('mute-btn').addEventListener('click', () => { SFX.setMuted(!SFX.muted); $('mute-btn').textContent = SFX.muted ? '🔇' : '🔊'; });
    $('help').addEventListener('click', () => this.toggleHelp(false));
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.started) { if (k === 'enter' || k === ' ') this.start(this.savedGame ? 'continue' : 'new'); return; }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (e.repeat) return;
      if (this.photo) { if (k === 'p' || k === 'escape') this.togglePhoto(false); else if (k === 'enter' || k === ' ') this.snapshot(); return; }
      if (k === 'p') { this.togglePhoto(true); return; }
      if (k === 'escape') { this.toggleHelp(false); return; }
      if (k === '?' || k === 'h') { this.toggleHelp(); return; }
      if (k === 'e' || k === 'enter') { this.interact(); return; }
      if (k === 'm') { this.meow(); return; }
      if (k === 'f') { this.cycleForm(e.shiftKey ? -1 : 1); return; }
      if (k === 'k') { this.cycleSkin(); return; }
      if (k === 't') { this.cycleTime(); return; }
      if (k >= '1' && k <= '6') { this.setForm(FORM_ORDER[+k - 1]); return; }
      if (k === 'tab') { e.preventDefault(); this.mapOn = !this.mapOn; $('map').classList.toggle('on', this.mapOn); return; }
      if (k === ' ') { this.jump(); this.keys.add(' '); return; }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('pointerdown', (e) => { if (!this.started) return; this.pointer.down = true; this.pointer.moved = 0; this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.id = e.pointerId; canvas.setPointerCapture(e.pointerId); canvas.classList.add('dragging'); });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.pointer.down || e.pointerId !== this.pointer.id) return;
      const dx = e.clientX - this.pointer.x, dy = e.clientY - this.pointer.y; this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.moved += abs(dx) + abs(dy);
      this.cam.yaw -= dx * 0.0075; this.cam.pitch = clamp(this.cam.pitch + dy * 0.005, this.photo ? -0.3 : 0.06, this.photo ? 1.45 : 1.25);
    });
    const up = (e) => { if (!this.pointer.down) return; this.pointer.down = false; canvas.classList.remove('dragging'); if (this.pointer.moved < 8) this.interact(); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (!this.started) return; this.cam.dist = clamp(this.cam.dist + e.deltaY * 0.004, this.photo ? 0.8 : 1.8, this.photo ? 16 : 9.5); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('pagehide', () => this.save());
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.save(); });
    this.bindTouch();
    window.addEventListener('resize', () => { this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); this.outline.setSize(); });
  }
  start(mode = 'new') {
    if (this.started) return;
    let resumed = false;
    if (mode === 'continue' && this.savedGame) { this.freshLoad = true; resumed = this.restore(this.savedGame); this.freshLoad = false; }
    if (!resumed) store.clear();
    this.started = true; SFX.init(); SFX.resume(); SFX.beep();
    if (!this.state.friends.size) setTimeout(() => { if (this.started && !this.state.friends.size) this.toast('\ud83d\udc4b Walk up to anyone and press E to say hello \u2014 they remember you', 3600); }, 7000);   // a one-time nudge toward the townsfolk
    const s = $('start'); s.style.opacity = '0'; setTimeout(() => { s.style.display = 'none'; }, 900);
    for (const id of ['hud-left', 'hud-right', 'help-btn', 'mute-btn', 'photo-btn', 'map']) $(id).classList.add('on');
    if (IS_TOUCH) { $('game').classList.add('touch'); $('touch').classList.add('on'); this.touch.active = true; }
    this.canvas.focus();
    if (!IS_TOUCH) { $('hint').classList.add('on'); setTimeout(() => $('hint').classList.remove('on'), 5000); }
    if (resumed) this.toast(`💾 Welcome back, ${SKINS[WORLDS[this.worldIndex].key].name}!`, 3000);
    else this.toast('🐱 Home sweet home. Find the door…', 3000);
    this.save();
  }
  meow() { SFX.meow(); this.cat.blinkT = this.cat.nextBlink; }

  // ------------------------------------------------------------------ touch controls (joystick + buttons; the canvas itself orbits)
  bindTouch() {
    const stick = $('stick'), knob = $('knob'), R = 44, T = this.touch; let id = null, cx = 0, cy = 0;
    const set = (dx, dy) => {
      const l = sqrt(dx * dx + dy * dy), k = l > R ? R / l : 1; dx *= k; dy *= k;
      knob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`; T.x = dx / R; T.y = dy / R;
    };
    stick.addEventListener('pointerdown', (e) => { if (id !== null || !this.started) return; e.preventDefault(); id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; try { stick.setPointerCapture(id); } catch { /* synthetic pointer */ } set(e.clientX - cx, e.clientY - cy); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId !== id) return; set(e.clientX - cx, e.clientY - cy); });
    const end = (e) => { if (e.pointerId !== id) return; id = null; set(0, 0); };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    const press = (elId, fn, up) => { const el = $(elId); el.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.started) fn(); }); if (up) { el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); } };
    press('t-jump', () => { this.jump(); T.jump = true; }, () => { T.jump = false; });
    press('t-use', () => this.interact());
    press('t-meow', () => this.meow());
    press('t-run', () => { T.run = !T.run; $('t-run').classList.toggle('on', T.run); });
  }

  // ------------------------------------------------------------------ photo mode: hides the HUD, frees the camera, saves PNGs
  togglePhoto(force) {
    const on = force ?? !this.photo; if (on === this.photo) return;
    this.photo = on; this.keys.clear(); this.touch.x = this.touch.y = 0;
    $('game').classList.toggle('photo', on);
    if (on) { this.cam.pitch = clamp(this.cam.pitch, -0.3, 1.45); this.photoPrev = { dist: this.cam.dist }; }
    else { this.cam.dist = clamp(this.cam.dist, 1.8, 9.5); this.cam.pitch = clamp(this.cam.pitch, 0.06, 1.25); }
  }
  snapshot() {
    if (!this.photo) return;
    this.render();
    SFX.shutter();
    const flash = $('flash'); flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    if (!this.canvas.toDataURL) return;
    try {
      const url = this.canvas.toDataURL('image/png'), a = document.createElement('a');
      a.href = url; a.download = `dimension-cat-${WORLDS[this.worldIndex].key}-${++this.photoCount}.png`;
      if (a.click) a.click();
    } catch (err) { console.warn('[DimensionCat] could not save the photo', err); }
  }
  toggleHelp(force) { const el = $('help'); const on = force ?? !el.classList.contains('on'); el.classList.toggle('on', on); }
  jump() { const c = this.cat, F = FORMS[this.form]; if (F.jump > 0 && c.onGround && !this.transitioning && !this.photo) { c.vy = JUMP_SPEED * F.jump; c.onGround = false; c.idleTime = 0; SFX.jump(); } }
  interact() { if (this.transitioning || this.photo) return; const n = this.nearest; if (n) n.onUse(); }

  // ------------------------------------------------------------------ simulation
  step(dt) {
    const cat = this.cat, P = this.physics, pos = cat.group.position;
    // --- movement: camera-relative; cat faces the direction it moves
    // ← / → swing the camera around the cat (W A S D still walk; A/D strafe)
    const turn = (this.keys.has('arrowleft') ? 1 : 0) - (this.keys.has('arrowright') ? 1 : 0);
    if (turn) this.cam.yaw += turn * CAM_TURN_SPEED * dt;
    let f = (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0) - (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0);
    let s = (this.keys.has('d') ? 1 : 0) - (this.keys.has('a') ? 1 : 0);
    const T = this.touch, tmag = sqrt(T.x * T.x + T.y * T.y), analog = f === 0 && s === 0 && tmag > 0.15;
    if (analog) { f = -T.y; s = T.x; }
    const run = this.keys.has('shift') || (analog && (T.run || tmag > 0.95));
    const yaw = this.cam.yaw, Fx = sin(yaw), Fz = cos(yaw), Rx = -cos(yaw), Rz = sin(yaw);
    let mx = Fx * f + Rx * s, mz = Fz * f + Rz * s;
    const len = sqrt(mx * mx + mz * mz), wants = len > 0 && !this.transitioning && !this.photo;
    if (wants) { mx /= len; mz /= len; }
    const F = FORMS[this.form];
    const targetSpeed = wants ? (run ? 6.2 : 3.3) * F.speed * (analog ? clamp(tmag / 0.9, 0.35, 1) : 1) : 0;
    cat.speed = damp(cat.speed, targetSpeed, wants ? 9 : 14, dt);
    if (wants) cat.group.rotation.y = dampAngle(cat.group.rotation.y, atan2(mx, mz), 13, dt);
    if (cat.speed > 0.05) {
      const dirx = wants ? mx : sin(cat.group.rotation.y), dirz = wants ? mz : cos(cat.group.rotation.y);
      const res = P.resolve(pos.x + dirx * cat.speed * dt, pos.z + dirz * cat.speed * dt, pos.y, F.radius, null, F.height);
      pos.x = res.x; pos.z = res.z;
    }
    cat.moving = wants && cat.speed > 0.3; cat.running = run;
    // --- vertical (butterflies fly: hold jump to rise, release to drift down)
    this.holdJump = this.keys.has(' ') || this.touch.jump;
    if (F.fly && !this.transitioning && !this.photo) cat.vy = damp(cat.vy, this.holdJump ? 2.8 : -1.3, 4, dt);
    else cat.vy -= GRAVITY * dt;
    pos.y += cat.vy * dt;
    const g = P.groundAt(pos.x, pos.z, pos.y - cat.vy * dt, F.radius);
    if (F.fly && pos.y > g + 9) { pos.y = g + 9; cat.vy = min(cat.vy, 0); }
    if (pos.y <= g) {
      if (!cat.onGround && cat.vy < -2.5) { SFX.land(); cat.land(cat.vy); this.fx.emit(pos.x, pos.y + 0.05, pos.z, { count: cat.vy < -6 ? 10 : 5, color: 0xd9cfb8, speed: cat.vy < -6 ? 1.2 : 0.7, up: 0.5, life: 0.45, gravity: 2 }); }
      pos.y = g; cat.vy = 0; cat.onGround = true;
    } else cat.onGround = pos.y - g < 0.02 && cat.vy <= 0 ? (pos.y = g, cat.vy = 0, true) : false;
    // --- world
    cat.update(dt, this.time);
    for (const n of this.npcs) n.update(dt);
    if (this.balloon) this.updateBalloon(dt);
    for (const sq of this.squirrels) sq.update(dt);
    this.collectibles.update(dt, this.time);
    this.worldCtl.update(dt, this.time);
    tickTweens(dt);
    this.fx.update(dt, pos);
    // --- nearest interactable → prompt
    let best = null, bestD = Infinity;
    for (const it of this.interactables) {
      it.obj.getWorldPosition(this.tmpV);
      const d = dist2(pos.x, pos.z, this.tmpV.x, this.tmpV.z);
      if (d < it.radius * it.radius && d < bestD) { const label = it.label(); if (label) { best = it; bestD = d; best._label = label; } }
    }
    this.nearest = best;
    const prompt = $('prompt');
    if (best) { $('prompt-text').textContent = best._label; prompt.classList.add('on'); } else prompt.classList.remove('on');
    if (this.touch.active) $('t-use').classList.toggle('ready', !!best);
  }

  updateCamera(dt, snap = false) {
    const c = this.cam, pos = this.cat.group.position;
    // look-ahead: the framing leads the cat a little in the direction it runs
    const wantLead = this.cat.moving ? (this.cat.running ? 0.9 : 0.45) : 0;
    c.lead = snap ? 0 : damp(c.lead, wantLead, 3, dt);
    const fy = this.cat.group.rotation.y, F = FORMS[this.form];
    const target = this.tmpV.set(pos.x + sin(fy) * c.lead, pos.y + F.eye, pos.z + cos(fy) * c.lead);
    if (snap) c.target.copy(target); else { c.target.x = damp(c.target.x, target.x, 16, dt); c.target.y = damp(c.target.y, target.y, 10, dt); c.target.z = damp(c.target.z, target.z, 16, dt); }
    const cp = cos(c.pitch), sp = sin(c.pitch);
    const head = this.tmpV2.set(pos.x, pos.y + F.eye, pos.z), want = c.dist * F.camDist;
    const desired = this.tmpV3.set(c.target.x - sin(c.yaw) * cp * want, c.target.y + sp * want, c.target.z - cos(c.yaw) * cp * want);
    const clear = this.physics.rayClear(head, desired, 0.22);
    const limited = max(0.7, want * clear - (clear < 1 ? 0.25 : 0));
    if (snap || limited < c.curDist) c.curDist = limited; else c.curDist = damp(c.curDist, limited, 4, dt);
    const d = c.curDist;
    this.camera.position.set(c.target.x - sin(c.yaw) * cp * d, c.target.y + sp * d, c.target.z - cos(c.yaw) * cp * d);
    const floor = this.physics.ground0(this.camera.position.x, this.camera.position.z) + 0.3;
    if (this.camera.position.y < floor) this.camera.position.y = floor;
    this.camera.lookAt(c.target);
    const fov = this.cat.running && this.cat.moving ? 56 : 50;
    c.fov = snap ? fov : damp(c.fov, fov, 4, dt);
    if (abs(this.camera.fov - c.fov) > 0.01) { this.camera.fov = c.fov; this.camera.updateProjectionMatrix(); }
    // shadow frustum follows the cat (snapped to reduce shimmer)
    const sx = Math.round(pos.x * 2) / 2, sz = Math.round(pos.z * 2) / 2;
    this.sun.position.set(sx + this.sunOffset.x, this.sunOffset.y, sz + this.sunOffset.z); this.sun.target.position.set(sx, 0, sz);
  }

  loop() {
    requestAnimationFrame(this.loop);
    const dt = min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (this.started) this.step(dt);
    else this.cat.update(dt, this.time);
    this.updateCamera(dt);
    this.lights.update(this.camera);
    this.sky.update(this.camera, dt);
    this.render();
    if (this.started && this.mapOn && this.mapCtx && (this.mapFrame++ % 3 === 0)) this.drawMap();
  }

  /** Draws the frame: the world into the offscreen buffer, then the cartoon ink pass onto the canvas. */
  render() { this.outline.render(this.scene, this.camera); }

  /** Top-down mini-map: cat, portals/doors, squirrel, collectibles. North is up. */
  drawMap() {
    const ctx = this.mapCtx, S = 300, C = S / 2, scale = S / (this.physics.limit * 2 + 8), pos = this.cat.group.position;
    ctx.clearRect(0, 0, S, S);
    ctx.save(); ctx.beginPath(); ctx.arc(C, C, C - 3, 0, TAU); ctx.clip();
    const tint = ['#2f6a2f', '#c86fa0', '#1e2a44', '#4a3a48', '#c9b27a', '#dfe8f4', '#244a2c'][this.worldIndex] || '#333';
    ctx.fillStyle = tint; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, S, S); ctx.globalAlpha = 1;
    const px = (x) => C + x * scale, pz = (z) => C + z * scale;
    // collectibles
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const it of this.collectibles.items) { ctx.beginPath(); ctx.arc(px(it.x), pz(it.z), 2.2, 0, TAU); ctx.fill(); }
    // interactables: portals / doors green, squirrel brown, people amber
    for (const it of this.interactables) {
      const label = it.label() || ''; if (!label) continue;
      it.obj.getWorldPosition(this.tmpV);
      const portal = /portal|return|home|shore|peak|oak|gondola|airlock|step through|wooden door|neighborhood/i.test(label), sq = /squirrel|friends/i.test(label);
      const met = /again/.test(label);   // someone already greeted fades on the map; the amber dots are people still to meet
      ctx.fillStyle = portal ? '#37e5a0' : sq ? '#d9a066' : met ? 'rgba(255,255,255,0.3)' : '#ffd36a';
      ctx.beginPath(); ctx.arc(px(this.tmpV.x), pz(this.tmpV.z), portal ? 5 : 3.5, 0, TAU); ctx.fill();
      if (portal) { ctx.strokeStyle = 'rgba(55,229,160,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px(this.tmpV.x), pz(this.tmpV.z), 8 + sin(this.time * 3) * 1.5, 0, TAU); ctx.stroke(); }
    }
    // the cat's own house
    if (this.homeMarker) {
      const hx = px(this.homeMarker[0]), hz = pz(this.homeMarker[1]);
      ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(hx, hz - 7); ctx.lineTo(hx + 6, hz - 1); ctx.lineTo(hx + 4, hz - 1); ctx.lineTo(hx + 4, hz + 6); ctx.lineTo(hx - 4, hz + 6); ctx.lineTo(hx - 4, hz - 1); ctx.lineTo(hx - 6, hz - 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    // the cat: a dot with a heading wedge
    const cx = px(pos.x), cz = pz(pos.z), a = this.cat.group.rotation.y;
    ctx.fillStyle = '#ff6fb5'; ctx.beginPath(); ctx.moveTo(cx + sin(a) * 9, cz + cos(a) * 9); ctx.lineTo(cx + sin(a + 2.5) * 6, cz + cos(a + 2.5) * 6); ctx.lineTo(cx + sin(a - 2.5) * 6, cz + cos(a - 2.5) * 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cz, 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

const game = new Game();
window.DC = game; window.DC_WORLDS = WORLDS; window.DC_PORTAL_GEMS = PORTAL_GEMS;
window.DC_RIGS = { makeHuman, randomPerson, makeWardrobe, seeded,      // for the QA line-ups in ../qa
  makeGingerbread, makeRobot, makeSquirrel, makeCandyCat, makeCrab, makeSeagull, makeTurtle, makePenguin, makeYeti, makeFrog, makeOwl, makeFairy, makeButterfly };
