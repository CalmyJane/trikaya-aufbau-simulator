import * as THREE from 'three';
import DATA from '../data/tracks.json';

// Positional music: the stages (and illegal soundboxes on the camping) play real tracks.
// Each source is a streamed <audio> element routed through WebAudio: distance → volume,
// distance → low-pass (far away you mostly hear the bass), camera direction → stereo pan.
// Far-away sources are paused so nothing is decoded that nobody can hear.

const BASE = `${import.meta.env.BASE_URL}music/`;
// generated from the music/ folder by scripts/music.mjs (runs before dev & build)
export const TRACKS = DATA.tracks;
/** Files for a playlist: 'all' (full tracks), or a tag like 'techno' / 'fire' (falls back to all). */
export function playlist(tag = 'all') {
  const full = TRACKS.filter((t) => !t.tags.includes('clip'));
  const pick = tag === 'all' ? full : TRACKS.filter((t) => t.tags.includes(tag));
  return (pick.length ? pick : full).map((t) => t.file);
}

const _right = new THREE.Vector3();

export class Music {
  constructor(audio) {
    this.audio = audio;
    this.sources = [];
  }

  /**
   * @param {object} o  { id, pos: () => Vector3|null, range, vol, start (track index), tinny }
   */
  add(o) {
    const list = o.list || playlist(o.playlist);
    const s = { ...o, list, el: null, idx: (o.start ?? Math.floor(Math.random() * list.length)) % list.length, level: 0 };
    this.sources.push(s);
    return s;
  }

  /** Switch a source to another (random) track, e.g. a new soundbox somewhere else. */
  shuffle(s) {
    s.idx = Math.floor(Math.random() * s.list.length);
    if (!s.el) return;
    s.seeked = false;
    s.el.src = BASE + s.list[s.idx];
    s.el.addEventListener('loadedmetadata', () => { s.seeked = true; s.el.currentTime = Math.random() * s.el.duration * 0.6; }, { once: true });
  }

  build(s) {
    const ctx = this.audio.ctx;
    const el = new window.Audio();
    el.preload = 'none';
    el.src = BASE + s.list[s.idx % s.list.length];
    el.addEventListener('ended', () => {
      s.idx = (s.idx + 1) % s.list.length;
      el.src = BASE + s.list[s.idx];
      el.play().catch(() => {});
    });
    const src = ctx.createMediaElementSource(el);
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 18000;
    let node = src.connect(low);
    if (s.tinny) { // a small party speaker: no real bass, a bit boxy
      const high = ctx.createBiquadFilter();
      high.type = 'highpass';
      high.frequency.value = 220;
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1800;
      mid.gain.value = 6;
      node = node.connect(high).connect(mid);
    }
    const pan = ctx.createStereoPanner();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    node.connect(pan).connect(gain).connect(this.audio.master);
    // start somewhere in the track, like arriving at a party that's already going
    el.addEventListener('loadedmetadata', () => { if (!s.seeked) { s.seeked = true; el.currentTime = Math.random() * el.duration * 0.6; } }, { once: true });
    s.el = el; s.low = low; s.pan = pan; s.gain = gain;
  }

  update(listener, camera) {
    const ctx = this.audio.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    for (const s of this.sources) {
      const p = s.pos();
      let level = 0, d = 1e9;
      if (p) {
        d = Math.hypot(p.x - listener.x, p.z - listener.z);
        const k = Math.max(0, 1 - d / s.range);
        level = s.vol * k * k;
      }
      if (level > 0.0005 && !s.el) this.build(s);
      if (!s.el) continue;
      if (level > 0.0005) {
        if (s.el.paused && !s.starting) {
          s.starting = true;
          s.el.play().catch(() => {}).finally(() => { s.starting = false; });
        }
        const k = Math.max(0, 1 - d / s.range);
        s.gain.gain.setTargetAtTime(level, t, 0.25);
        s.low.frequency.setTargetAtTime(250 + 17000 * k * k * k, t, 0.25);
        const dx = (p.x - listener.x) / (d || 1), dz = (p.z - listener.z) / (d || 1);
        const pan = THREE.MathUtils.clamp((dx * _right.x + dz * _right.z) * Math.min(1, d / 12), -0.85, 0.85);
        s.pan.pan.setTargetAtTime(pan, t, 0.1);
      } else {
        s.gain.gain.setTargetAtTime(0, t, 0.3);
        if (!s.el.paused && s.level < 0.0005) s.el.pause();
      }
      s.level = level;
    }
  }
}
