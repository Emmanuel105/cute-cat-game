// ============================================================================
// AUDIO — every sound effect is synthesised with WebAudio (no files)
// ============================================================================
class SoundKit {
  constructor() { this.ctx = null; this.master = null; this.muted = false; this._noise = null; }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 1.5, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noise = buf;
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.45; }
  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  /** One enveloped oscillator. `slide` = frequency at the end of `dur`. */
  tone({ freq = 440, type = 'sine', dur = 0.15, vol = 0.25, attack = 0.005, release = 0.06, slide = null, delay = 0, filter = null, q = 1, vib = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.now + delay, ctx = this.ctx;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slide !== null) osc.frequency.exponentialRampToValueAtTime(max(slide, 20), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.setValueAtTime(vol, t0 + max(attack, dur - release)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.02);
    let node = osc;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; f.Q.value = q; osc.connect(f); node = f; }
    if (vib) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6; lg.gain.value = vib; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.1); }
    node.connect(g); g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.1);
  }
  noise({ dur = 0.1, vol = 0.2, filter = 800, type = 'lowpass', delay = 0, slide = null }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.now + delay, ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this._noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(filter, t0);
    if (slide !== null) f.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t0); src.stop(t0 + dur + 0.05);
  }

  // ---- effects -------------------------------------------------------------
  pickup() { [523, 659, 784].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.14, vol: 0.22, delay: i * 0.07 })); this.tone({ freq: 1568, type: 'sine', dur: 0.25, vol: 0.08, delay: 0.2 }); }
  star() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.2, delay: i * 0.06 })); this.tone({ freq: 2093, type: 'sine', dur: 0.5, vol: 0.06, delay: 0.3 }); }
  jump() { this.tone({ freq: 320, slide: 640, type: 'triangle', dur: 0.14, vol: 0.14 }); }
  land() { this.noise({ dur: 0.09, vol: 0.18, filter: 500 }); this.tone({ freq: 90, slide: 50, type: 'sine', dur: 0.1, vol: 0.18 }); }
  portal() { this.tone({ freq: 180, slide: 1400, type: 'sine', dur: 0.7, vol: 0.2 }); this.tone({ freq: 240, slide: 1900, type: 'triangle', dur: 0.7, vol: 0.08, delay: 0.05 }); this.noise({ dur: 0.8, vol: 0.12, filter: 400, slide: 4000, type: 'bandpass' }); }
  door() { this.tone({ freq: 110, slide: 70, type: 'sawtooth', dur: 0.45, vol: 0.1, filter: 500, q: 4, vib: 8 }); this.noise({ dur: 0.12, vol: 0.06, filter: 900, delay: 0.4 }); }
  slide() { this.noise({ dur: 0.35, vol: 0.14, filter: 1200, slide: 300 }); this.tone({ freq: 700, slide: 400, type: 'square', dur: 0.08, vol: 0.05, delay: 0.3 }); }
  meow() {
    this.tone({ freq: 720, slide: 520, type: 'sawtooth', dur: 0.32, vol: 0.09, attack: 0.05, filter: 1500, q: 6, vib: 12 });
    this.tone({ freq: 1440, slide: 1040, type: 'sine', dur: 0.3, vol: 0.05, attack: 0.05, vib: 20 });
  }
  chitter() { for (let i = 0; i < 6; i++) this.tone({ freq: 2300 + (i % 2) * 500, type: 'square', dur: 0.035, vol: 0.05, delay: i * 0.05 }); }
  bark() { this.tone({ freq: 240, slide: 130, type: 'square', dur: 0.14, vol: 0.12, filter: 900 }); this.noise({ dur: 0.1, vol: 0.1, filter: 1500 }); }
  honk() { this.tone({ freq: 392, type: 'sawtooth', dur: 0.35, vol: 0.07, filter: 1400 }); this.tone({ freq: 494, type: 'sawtooth', dur: 0.35, vol: 0.07, filter: 1400 }); }
  growl() { this.tone({ freq: 95, slide: 70, type: 'sawtooth', dur: 0.6, vol: 0.14, filter: 320, q: 3, vib: 15 }); }
  talk() { for (let i = 0; i < 4; i++) this.tone({ freq: 420 + rnd.range(-80, 120), type: 'triangle', dur: 0.07, vol: 0.06, delay: i * 0.09 }); }
  beep() { this.tone({ freq: 880, type: 'square', dur: 0.06, vol: 0.05 }); this.tone({ freq: 1320, type: 'square', dur: 0.06, vol: 0.05, delay: 0.09 }); }
  shutter() { this.tone({ freq: 2200, slide: 300, type: 'square', dur: 0.04, vol: 0.09, filter: 4000 }); this.tone({ freq: 1100, slide: 200, type: 'square', dur: 0.05, vol: 0.07, filter: 3000, delay: 0.09 }); }
  deny() { this.tone({ freq: 200, slide: 150, type: 'square', dur: 0.18, vol: 0.08, filter: 800 }); }
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { this.tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.18, delay: i * 0.12 }); this.tone({ freq: f / 2, type: 'sine', dur: 0.3, vol: 0.1, delay: i * 0.12 }); }); }
  gull() { this.tone({ freq: 1500, slide: 900, type: 'sawtooth', dur: 0.22, vol: 0.05, filter: 2200, q: 3, vib: 30 }); this.tone({ freq: 1300, slide: 1700, type: 'sawtooth', dur: 0.18, vol: 0.04, delay: 0.25, filter: 2200, q: 3 }); }
  woof() { this.tone({ freq: 300, slide: 170, type: 'sawtooth', dur: 0.13, vol: 0.1, filter: 700, q: 2 }); this.noise({ dur: 0.09, vol: 0.08, filter: 900 }); this.tone({ freq: 280, slide: 160, type: 'sawtooth', dur: 0.13, vol: 0.09, delay: 0.18, filter: 700, q: 2 }); }
  squawk() { for (let i = 0; i < 3; i++) this.tone({ freq: 900 + i * 120, slide: 600, type: 'square', dur: 0.07, vol: 0.05, delay: i * 0.09, filter: 1600 }); }
  ribbit() { this.tone({ freq: 170, slide: 240, type: 'sawtooth', dur: 0.16, vol: 0.09, filter: 600, q: 4, vib: 25 }); this.tone({ freq: 150, slide: 210, type: 'sawtooth', dur: 0.14, vol: 0.07, delay: 0.2, filter: 600, q: 4, vib: 25 }); }
  hoot() { this.tone({ freq: 420, slide: 380, type: 'sine', dur: 0.28, vol: 0.12, attack: 0.04, filter: 900 }); this.tone({ freq: 400, slide: 340, type: 'sine', dur: 0.4, vol: 0.1, attack: 0.04, delay: 0.32, filter: 900 }); }
  click() { for (let i = 0; i < 2; i++) this.noise({ dur: 0.03, vol: 0.1, filter: 3000, type: 'bandpass', delay: i * 0.08 }); }
  roar() { this.tone({ freq: 140, slide: 90, type: 'sawtooth', dur: 0.7, vol: 0.12, attack: 0.08, filter: 420, q: 3, vib: 10 }); this.noise({ dur: 0.6, vol: 0.06, filter: 500 }); }
  wave() { this.noise({ dur: 1.6, vol: 0.05, filter: 300, slide: 1200, type: 'lowpass' }); }
  twinkle() { [1319, 1568, 2093].forEach((f, i) => this.tone({ freq: f, type: 'sine', dur: 0.18, vol: 0.06, delay: i * 0.06 })); }
  /** A beach ball landing in someone's hands, or on someone's head. */
  bounce() { this.tone({ freq: 520, type: 'sine', dur: 0.12, vol: 0.1, slide: 240 }); }
  /** "Got you!" — a quick rising giggle when one child tags the other. */
  tag() { [880, 1175, 1480].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.07, vol: 0.05, delay: i * 0.055, slide: f * 1.2 })); }
  /** Footstep: soft pad on grass/sand/snow, tap on cobble/metal/planks. */
  step(kind = 'soft', run = false) {
    const v = run ? 0.09 : 0.06;
    if (kind === 'hard') { this.noise({ dur: 0.04, vol: v, filter: 1800, type: 'bandpass' }); this.tone({ freq: 520, slide: 300, type: 'triangle', dur: 0.03, vol: v * 0.5 }); }
    else if (kind === 'snow') { this.noise({ dur: 0.09, vol: v * 1.2, filter: 900, slide: 300 }); }
    else if (kind === 'wood') { this.tone({ freq: 190, slide: 120, type: 'triangle', dur: 0.05, vol: v, filter: 700 }); this.noise({ dur: 0.04, vol: v * 0.6, filter: 1200 }); }
    else { this.noise({ dur: 0.06, vol: v * 0.8, filter: 500, slide: 250 }); }
  }
  heart() { [784, 988, 1175].forEach((f, i) => this.tone({ freq: f, type: 'sine', dur: 0.3, vol: 0.12, delay: i * 0.1 })); }
}
const SFX = new SoundKit();
