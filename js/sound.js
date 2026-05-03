'use strict';

/* ═══════════════════════════════════════════════════════════════
   EMERGENCE — sound system
   Generative ambient pad (per-chapter), small SFX, mute toggle.
   No samples. All Web Audio. Starts only after a user gesture.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  // ── Per-chapter sonic palettes ──────────────────────────────
  // Root frequency, chord intervals (semitones), filter color.
  const PALETTES = {
    'index.html':    { root: 110.00, chord: [0, 7, 12, 19],  cutoff: 1100, name: 'overview' }, // A2 sus
    'life.html':     { root: 130.81, chord: [0, 5, 12, 17],  cutoff:  900, name: 'life'     }, // C3 sus
    'form.html':     { root: 116.54, chord: [0, 4, 11, 14],  cutoff: 1300, name: 'form'     }, // Bb2 maj7
    'patterns.html': { root: 146.83, chord: [0, 3, 7, 14],   cutoff: 1500, name: 'patterns' }, // D3 min add9
    'mind.html':     { root: 98.00,  chord: [0, 7, 12, 16],  cutoff: 1000, name: 'mind'     }, // G2
    'cosmos.html':   { root: 87.31,  chord: [0, 7, 14, 19],  cutoff:  800, name: 'cosmos'   }, // F2 deep
    'coda.html':     { root: 65.41,  chord: [0, 7, 12, 19, 26], cutoff: 700, name: 'coda'   }, // C2 cathedral
  };

  const KEY = 'emergence-sound';
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const palette = PALETTES[page] || PALETTES['index.html'];

  let ctx = null;
  let master = null;
  let drone = null;        // group of oscillators
  let droneGain = null;
  let breathLFO = null;
  let started = false;
  let muted = (localStorage.getItem(KEY) === 'muted');

  // Gentle ramp helper
  function ramp(param, value, t) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + t);
  }

  // ── Lazy boot ────────────────────────────────────────────────
  function boot() {
    if (ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    } catch (e) { return; }

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    buildDrone();
    started = true;

    // Fade in if not muted
    if (!muted) ramp(master.gain, 0.18, 4.0);
  }

  function buildDrone() {
    const group = ctx.createGain();
    group.gain.value = 1.0;

    // Lowpass filter for warmth
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = palette.cutoff;
    filt.Q.value = 0.4;

    // Slow LFO on filter cutoff (the breath)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07; // ~14s period
    lfoGain.gain.value = palette.cutoff * 0.35;
    lfo.connect(lfoGain).connect(filt.frequency);
    lfo.start();
    breathLFO = lfo;

    // Build chord: stacked sine + triangle pairs, slightly detuned
    palette.chord.forEach((semi, i) => {
      const f = palette.root * Math.pow(2, semi / 12);
      // Two oscillators per voice, slightly detuned for movement
      [-6, +6].forEach(detune => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : (i === palette.chord.length - 1 ? 'triangle' : 'sine');
        o.frequency.value = f;
        o.detune.value = detune;
        const g = ctx.createGain();
        // Higher voices quieter
        g.gain.value = (1 / (i + 1)) * 0.22;
        // Slow individual amplitude wobble per voice
        const wob = ctx.createOscillator();
        const wobG = ctx.createGain();
        wob.frequency.value = 0.04 + i * 0.013;
        wobG.gain.value = 0.06;
        wob.connect(wobG).connect(g.gain);
        wob.start();
        o.connect(g).connect(filt);
        o.start();
      });
    });

    // Subtle reverb-ish via convolver-free trick: short delay feedback
    const delay = ctx.createDelay(4.0);
    delay.delayTime.value = 0.45;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    filt.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet);

    filt.connect(group);
    wet.connect(group);
    group.connect(master);

    droneGain = group;
    drone = filt;
  }

  // ── Mute / unmute ────────────────────────────────────────────
  function setMuted(m) {
    muted = m;
    localStorage.setItem(KEY, muted ? 'muted' : 'on');
    updateButton();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    ramp(master.gain, muted ? 0 : 0.18, 1.2);
  }

  // ── SFX ─────────────────────────────────────────────────────
  // A short FM bell-pluck. Frequency in Hz, gain 0..1, decay seconds.
  function ping(freq, gain, decay) {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modG = ctx.createGain();
    const ampG = ctx.createGain();

    car.frequency.value = freq;
    mod.frequency.value = freq * 2.01;
    modG.gain.value = freq * 0.6;
    mod.connect(modG).connect(car.frequency);
    car.type = 'sine';
    mod.type = 'sine';

    ampG.gain.setValueAtTime(0, now);
    ampG.gain.linearRampToValueAtTime(gain, now + 0.005);
    ampG.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    car.connect(ampG).connect(master);
    mod.start(now);
    car.start(now);
    mod.stop(now + decay + 0.05);
    car.stop(now + decay + 0.05);
  }

  // A soft noise sweep (whoosh / scatter)
  function whoosh(durSec, gain) {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * durSec, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(2000, now);
    filt.frequency.exponentialRampToValueAtTime(400, now + durSec);
    filt.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durSec);
    src.connect(filt).connect(g).connect(master);
    src.start(now);
    src.stop(now + durSec + 0.05);
  }

  // Map a chord index to a frequency for chord-tone pings
  function chordTone(i) {
    const semis = palette.chord;
    const semi = semis[((i % semis.length) + semis.length) % semis.length];
    const oct = Math.floor(i / semis.length);
    return palette.root * Math.pow(2, (semi + oct * 12) / 12);
  }

  // Convenience: ping a chord-tone in a moderate octave
  function chordPing(idx, gain, decay) {
    ping(chordTone((idx ?? 0) + 12) * 2, gain ?? 0.06, decay ?? 1.4); // up two octaves
  }

  // ── UI: nav toggle button ────────────────────────────────────
  function updateButton() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.classList.toggle('muted', muted);
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.setAttribute('title', muted ? 'Sound: off — click to enable' : 'Sound: on — click to mute');
    btn.innerHTML = muted ? svgMute() : svgOn();
  }

  function svgOn() {
    return `
      <svg viewBox="0 0 22 22" width="14" height="14" aria-hidden="true">
        <path d="M3 8h3l4-3v12l-4-3H3z" fill="currentColor"/>
        <path d="M14 7c1.7 1 1.7 7 0 8" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M16 4c4 2 4 12 0 14" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.55"/>
      </svg>`;
  }
  function svgMute() {
    return `
      <svg viewBox="0 0 22 22" width="14" height="14" aria-hidden="true">
        <path d="M3 8h3l4-3v12l-4-3H3z" fill="currentColor"/>
        <path d="M14 8l5 6M19 8l-5 6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </svg>`;
  }

  function mountButton() {
    const nav = document.querySelector('nav');
    if (!nav || document.getElementById('sound-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'sound-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle ambient sound');
    btn.addEventListener('click', () => {
      if (!started) {
        boot();
        if (muted) {
          // First click should turn it ON, treating no-prior-pref as opt-in
          if (localStorage.getItem(KEY) === null) muted = false;
        }
      }
      setMuted(!muted);
    });
    nav.appendChild(btn);
    updateButton();
  }

  // ── First-gesture boot (unmute by default) ───────────────────
  // Browser policy: AudioContext can only start after a gesture.
  function firstGesture() {
    if (started) return;
    if (localStorage.getItem(KEY) === 'muted') { muted = true; return; }
    boot();
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
    window.addEventListener(evt, firstGesture, { once: true, passive: true })
  );

  document.addEventListener('DOMContentLoaded', mountButton);

  // ── Public API ──────────────────────────────────────────────
  window.EM_SOUND = {
    isMuted: () => muted,
    setMuted,
    ping,
    whoosh,
    chordPing,
    palette: () => palette,
    boot,
  };
})();
