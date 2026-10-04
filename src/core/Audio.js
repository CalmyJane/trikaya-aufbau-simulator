// Tiny WebAudio synth for UI/game SFX + a soft ambient bed (no audio files needed).
export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : (this.volume ?? 0.5);
    this.master.connect(this.ctx.destination);
    this.startAmbience();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : (this.volume ?? 0.5);
    return this.muted;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master && !this.muted) this.master.gain.value = v;
  }

  /** Continuous engine hum; level 0..1 (speed), on = engine running. */
  engine(level, on) {
    if (!this.ctx) return;
    if (!this.eng) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 400;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f).connect(g).connect(this.master);
      o.start();
      this.eng = { o, g };
    }
    const t = this.ctx.currentTime;
    this.eng.o.frequency.setTargetAtTime(on ? 38 + level * 70 : 30, t, 0.1);
    this.eng.g.gain.setTargetAtTime(on ? 0.05 + level * 0.05 : 0, t, 0.15);
  }

  sputter() {
    for (let i = 0; i < 6; i++) this.noise(0.08, { vol: 0.35, delay: i * 0.18 + Math.random() * 0.08, freq: 200 });
    this.tone(90, 0.8, { type: 'sawtooth', vol: 0.1, slide: 0.4, delay: 1.1 });
  }

  siren() {
    for (let i = 0; i < 6; i++) this.tone(i % 2 ? 660 : 880, 0.4, { type: 'sawtooth', vol: 0.06, delay: i * 0.42 });
  }

  alarm() {
    for (let i = 0; i < 3; i++) { this.tone(880, 0.14, { type: 'square', vol: 0.07, delay: i * 0.3 }); this.tone(660, 0.14, { type: 'square', vol: 0.07, delay: i * 0.3 + 0.15 }); }
  }

  angry() {
    this.tone(220, 0.15, { type: 'square', vol: 0.12 });
    this.tone(180, 0.2, { type: 'square', vol: 0.12, delay: 0.15 });
    this.noise(0.15, { vol: 0.3, freq: 800, delay: 0.05 });
  }

  tone(freq, dur = 0.12, { type = 'sine', vol = 0.3, delay = 0, slide = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(dur = 0.1, { vol = 0.2, delay = 0, freq = 1200 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  blip() { this.tone(520 + Math.random() * 80, 0.05, { type: 'square', vol: 0.05 }); }
  click() { this.tone(900, 0.04, { type: 'triangle', vol: 0.15 }); }
  pickup() { this.tone(660, 0.1, { type: 'triangle' }); this.tone(990, 0.15, { type: 'triangle', delay: 0.08 }); }
  hammer() { this.noise(0.08, { vol: 0.5, freq: 600 }); this.tone(140, 0.08, { type: 'square', vol: 0.12 }); }
  accept() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', delay: i * 0.07, vol: 0.2 })); }
  built() {
    [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', delay: i * 0.09, vol: 0.22 }));
    this.noise(0.6, { vol: 0.25, freq: 300 });
  }
  complete() {
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.25, { type: 'square', delay: i * 0.1, vol: 0.08 }));
    [261, 329, 392].forEach((f) => this.tone(f, 1.0, { type: 'sine', delay: 0.6, vol: 0.12 }));
  }
  step() { this.noise(0.05, { vol: 0.05, freq: 400 + Math.random() * 200 }); }

  startAmbience() {
    // quiet wind with slow gusts + varied nature sounds (birds, cuckoo, crickets, woodpecker, rustle)
    const ctx = this.ctx;
    const len = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) * 0.995; d[i] = last; }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const g = ctx.createGain(); g.gain.value = 0.22;
    src.connect(g).connect(this.master);
    src.start();
    // slow gusts
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 0.12;
    lfo.connect(lg).connect(g.gain); lfo.start();

    const r = (a, b) => a + Math.random() * (b - a);
    const tweet = () => {
      const base = r(2200, 3700);
      for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i++)
        this.tone(base + r(0, 400), 0.07, { vol: 0.02, delay: i * 0.11, slide: 1.3 });
    };
    const trill = () => {
      const base = r(3000, 4200);
      for (let i = 0; i < 8 + Math.floor(Math.random() * 6); i++)
        this.tone(base + (i % 2) * 300, 0.04, { vol: 0.015, delay: i * 0.05, slide: 1.1 });
    };
    const cuckoo = () => {
      this.tone(700, 0.22, { vol: 0.03, slide: 0.8 });
      this.tone(560, 0.3, { vol: 0.03, delay: 0.3, slide: 0.9 });
    };
    const crickets = () => {
      for (let i = 0; i < 14; i++) this.tone(4300, 0.025, { vol: 0.008, delay: (i % 3 === 2 ? 0.05 : 0) + i * 0.07 });
    };
    const woodpecker = () => {
      for (let i = 0; i < 6 + Math.floor(Math.random() * 6); i++) this.noise(0.03, { vol: 0.06, freq: 1500, delay: i * 0.09 });
    };
    const rustle = () => this.noise(r(0.8, 1.6), { vol: 0.03, freq: r(3000, 5000) });
    const frog = () => {
      for (let i = 0; i < 3; i++) this.tone(r(150, 190), 0.12, { type: 'square', vol: 0.01, delay: i * 0.16, slide: 1.2 });
    };
    const sounds = [tweet, tweet, tweet, trill, trill, cuckoo, crickets, crickets, woodpecker, rustle, rustle, frog];
    const next = () => {
      if (!this.muted) sounds[Math.floor(Math.random() * sounds.length)]();
      setTimeout(next, r(2000, 6500));
    };
    setTimeout(next, 2500);
  }
}
