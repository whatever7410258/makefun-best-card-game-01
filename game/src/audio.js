// Ember Pact — synthesized sound effects. No audio files: every sound is an
// oscillator or filtered noise built with WebAudio at play time, so the game
// loads nothing over the network. Created lazily on the first user gesture.
let ctx = null;
let muted = false;

/** Toggle the mute; returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.1, low = 400, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = low;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.08); },
  draw() { noise(0.12, 0.06, 2400); },
  playCard() { tone(520, 0.12, 'triangle', 0.1, 780); noise(0.1, 0.05, 1800); },
  hit() { tone(140, 0.18, 'sawtooth', 0.14, 70); noise(0.15, 0.12, 500); },
  heal() { tone(523, 0.12, 'sine', 0.09); tone(659, 0.12, 'sine', 0.09, null, 0.09); tone(784, 0.2, 'sine', 0.09, null, 0.18); },
  shield() { tone(392, 0.15, 'triangle', 0.09, 523); },
  poison() { tone(220, 0.25, 'sawtooth', 0.07, 110); },
  resonance() { tone(880, 0.1, 'sine', 0.1); tone(1318, 0.16, 'sine', 0.1, null, 0.08); },
  turn() { tone(440, 0.09, 'triangle', 0.08); tone(587, 0.12, 'triangle', 0.08, null, 0.08); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, null, i * 0.13));
    tone(1318, 0.5, 'sine', 0.1, null, 0.55);
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'sine', 0.1, null, i * 0.16));
  },
};
