// Original 30-second chiptune cue for the LawScape demo. Pure synthesis
// (square, pulse, triangle, noise), no samples or external audio.
// Writes score.wav (48 kHz, 16-bit stereo).
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const SR = 48000, DUR = 30, N = SR * DUR;
const L = new Float64Array(N), R = new Float64Array(N);
let seed = 240925; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const n = (name) => { const m = name.match(/^([A-G])(#?)(\d)$/); return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] ? 1 : 0); };

// Oscillators, all phase-accurate and anti-alias-free on purpose (that is the sound).
function tone(kind, freq, dur, { duty = .5, vib = 0, vibRate = 5.5, slide = 0 } = {}) {
  const len = Math.round(dur * SR), out = new Float64Array(len); let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR; const f = freq * Math.pow(2, slide * t) * (1 + vib * Math.sin(2 * Math.PI * vibRate * t));
    phase = (phase + f / SR) % 1;
    out[i] = kind === 'tri' ? 4 * Math.abs(phase - .5) - 1 : kind === 'noise' ? rnd() : phase < duty ? 1 : -1;
  }
  return out;
}
function env(sig, a, d, s, r, dur) {
  const len = sig.length, A = a * SR, D = d * SR, Rl = r * SR, hold = Math.max(0, dur * SR - Rl);
  for (let i = 0; i < len; i++) {
    let g = i < A ? i / A : i < A + D ? 1 - (1 - s) * ((i - A) / D) : s;
    if (i > hold) g *= Math.max(0, 1 - (i - hold) / Rl);
    sig[i] *= g;
  }
  return sig;
}
function add(sig, start, gain = 1, pan = 0) {
  const o = Math.round(start * SR); if (o >= N) return;
  const gl = gain * Math.sqrt((1 - pan) / 2), gr = gain * Math.sqrt((1 + pan) / 2);
  for (let i = 0; i < sig.length && o + i < N; i++) { L[o + i] += sig[i] * gl; R[o + i] += sig[i] * gr; }
}
// Instruments
const lead = (m, start, dur, gain = .16, pan = .12) => { const s = env(tone('sq', midi(m), dur + .05, { duty: .5, vib: .006, vibRate: 6 }), .004, .06, .75, .05, dur); add(s, start, gain, pan); add(s, start + .19, gain * .32, -pan * 2); add(s, start + .38, gain * .14, pan * 2); };
const arp = (m, start, dur, gain = .06, pan = -.35) => add(env(tone('sq', midi(m), dur, { duty: .25 }), .002, .04, .5, .03, dur), start, gain, pan);
const bass = (m, start, dur, gain = .22) => add(env(tone('tri', midi(m), dur, {}), .003, .05, .85, .04, dur), start, gain, 0);
const pad = (ms, start, dur, gain = .045) => ms.forEach((m, i) => { add(env(tone('sq', midi(m) * 1.003, dur, { duty: .125 }), .35, .3, .8, .5, dur), start, gain, -.5 + i * .3); add(env(tone('sq', midi(m) * .997, dur, { duty: .125 }), .35, .3, .8, .5, dur), start + .012, gain, .5 - i * .3); });
const kick = (start, gain = .42) => add(env(tone('tri', 55, .28, { slide: -9 }), .001, .02, .9, .18, .28), start, gain, 0);
const snare = (start, gain = .2) => { add(env(tone('noise', 0, .16), .001, .03, .35, .1, .16), start, gain, .1); add(env(tone('tri', 190, .1, { slide: -4 }), .001, .02, .5, .06, .1), start, gain * .7, -.1); };
const hat = (start, open = false, gain = .06) => { const s = tone('noise', 0, open ? .16 : .045); for (let i = 1; i < s.length; i++) s[i] = s[i] - s[i - 1] * .5; add(env(s, .001, .01, .4, open ? .12 : .03, open ? .16 : .045), start, gain, .45); };
const blip = (start) => { add(env(tone('sq', midi(n('C6')), .06, { duty: .5 }), .001, .02, .8, .02, .06), start, .09, -.2); add(env(tone('sq', midi(n('G6')), .11, { duty: .5 }), .001, .03, .7, .05, .11), start + .06, .09, .2); };
const coin = (start) => { add(env(tone('sq', midi(n('B5')), .08, { duty: .5 }), .001, .02, .9, .02, .08), start, .13, .3); add(env(tone('sq', midi(n('E6')), .42, { duty: .5 }), .001, .05, .7, .3, .42), start + .08, .13, .3); };
const stab = (ms, start, dur, gain = .13) => ms.forEach((m, i) => { add(env(tone('sq', midi(m), dur, { duty: i % 2 ? .25 : .5 }), .003, .12, .55, .35, dur), start, gain, (i - ms.length / 2) * .18); });

// ---------------------------------------------------------------- 1. title (0–3 s): riser, seal hit, title slam, blinking prompt
{ const riser = tone('noise', 0, .95); for (let i = 1; i < riser.length; i++) riser[i] = riser[i] * .6 + riser[i - 1] * .4; add(env(riser, .7, .15, 1, .08, .95), 0, .09, 0); }
kick(.32, .3);
kick(.92, .55); snare(.92, .25); stab([n('A3'), n('E4'), n('A4'), n('C5'), n('E5'), n('B5')], .92, 1.6, .11);
for (let i = 0; i < 6; i++) arp([n('A4'), n('C5'), n('E5'), n('A5'), n('C6'), n('E6')][i], .92 + i * .055, .12, .07, -.3 + i * .12);
for (const t of [1.6, 2.02, 2.43, 2.85]) add(env(tone('sq', midi(n('E6')), .05, { duty: .125 }), .001, .01, .6, .03, .05), t, .05, .2);
// Snare fill and riser bridge the title card into the groove.
[2.42, 2.54, 2.66, 2.78, 2.9].forEach((t, i) => snare(t, .1 + i * .035));
{ const riser = tone('noise', 0, .6); for (let i = 1; i < riser.length; i++) riser[i] = riser[i] * .5 + riser[i - 1] * .5; add(env(riser, .5, .05, 1, .05, .6), 2.4, .07, 0); }

// ---------------------------------------------------------------- 2. main groove (3.0–27.3 s), 128 BPM
const BPM = 128, STEP = 60 / BPM / 4, T0 = 3.0, T_END = 27.3;
const chords = [['A2', ['A4', 'C5', 'E5']], ['F2', ['F4', 'A4', 'C5']], ['C3', ['C5', 'E5', 'G5']], ['G2', ['G4', 'B4', 'D5']]];
const melody = [
  [[0, 'E5', 2], [2, 'C5', 2], [4, 'E5', 2], [6, 'A5', 4], [10, 'G5', 2], [12, 'E5', 4]],
  [[0, 'F5', 2], [2, 'E5', 2], [4, 'F5', 2], [6, 'A5', 4], [10, 'C6', 2], [12, 'A5', 4]],
  [[0, 'G5', 2], [2, 'E5', 2], [4, 'G5', 2], [6, 'C6', 4], [10, 'B5', 2], [12, 'G5', 2], [14, 'E5', 2]],
  [[0, 'D5', 4], [4, 'E5', 2], [6, 'F5', 2], [8, 'G5', 4], [12, 'B4', 2], [14, 'D5', 2]],
  [[0, 'E5', 2], [2, 'C5', 2], [4, 'E5', 2], [6, 'A5', 4], [10, 'G5', 2], [12, 'E5', 4]],
  [[0, 'F5', 2], [2, 'A5', 2], [4, 'C6', 2], [6, 'A5', 4], [10, 'F5', 2], [12, 'E5', 4]],
  [[0, 'G5', 4], [4, 'E5', 4], [8, 'C5', 4], [12, 'D5', 2], [14, 'E5', 2]],
  [[0, 'D5', 6], [6, 'B4', 2], [8, 'G4', 4], [12, 'B4', 2], [14, 'D5', 2]],
];
for (let bar = 0; ; bar++) {
  const barStart = T0 + bar * 16 * STEP; if (barStart >= T_END - .05) break;
  const [root, tones] = chords[bar % 4];
  const inWorld = barStart >= 24.0; const quiet = barStart < 5.8; // the creator beat starts sparse
  for (let s = 0; s < 16; s++) {
    const t = barStart + s * STEP; if (t >= T_END - .05) break;
    // drums
    if (!quiet || s === 0 || s === 8) { if (s === 0 || s === 8 || (s === 10 && bar % 2)) kick(t); }
    if (!quiet && (s === 4 || s === 12)) snare(t);
    if (s % 2 === 0) hat(t, s === 14, quiet ? .035 : .06);
    // bass
    const bassSteps = { 0: 0, 2: 0, 3: 12, 6: 0, 8: 0, 10: 0, 11: 12, 14: 7 };
    if (s in bassSteps) bass(n(root) + bassSteps[s], t, STEP * (s === 3 || s === 11 ? .9 : 1.8), quiet ? .16 : .22);
    // arpeggio accompaniment
    arp(n(tones[s % 3]) + (inWorld ? 12 : 0), t, STEP * .95, quiet ? .04 : .06);
  }
  // lead melody enters with the office tour (bar 2) and rests during the world beat for the pad
  if (bar >= 1 && !inWorld) for (const [s, m, len] of melody[bar % 8]) { const t = barStart + s * STEP; if (t < T_END - .1) lead(n(m), t, STEP * len * .92); }
  if (inWorld) pad(tones.map(n).concat(n(root) + 24), barStart, 16 * STEP * 1.05, .05);
}
// Scene wipes and the verdict coin.
for (const t of [5.8, 9.0, 13.0, 15.6, 18.0, 20.4, 22.4, 24.0]) blip(t - .12);
coin(11.98);

// ---------------------------------------------------------------- 3. finale (27.3–30 s): resolved chord, sparkle, fade
kick(27.3, .5); snare(27.3, .22);
stab([n('A2'), n('A3'), n('C#4'), n('E4'), n('A4'), n('C#5'), n('E5')], 27.3, 2.7, .12);
[['A5', 0], ['C#6', .07], ['E6', .14], ['A6', .21], ['E6', .42], ['A6', .49]].forEach(([m, d]) => arp(n(m), 27.36 + d, .22, .07, .3));
bass(n('A2'), 27.3, 2.4, .2);

// ---------------------------------------------------------------- master: soft clip, fades, normalize
const fadeIn = Math.round(.03 * SR), fadeOut = Math.round(.9 * SR);
let peak = 0;
for (let i = 0; i < N; i++) {
  let g = 1; if (i < fadeIn) g = i / fadeIn; if (i > N - fadeOut) g = Math.pow((N - i) / fadeOut, 1.3);
  L[i] = Math.tanh(L[i] * 1.25) * g; R[i] = Math.tanh(R[i] * 1.25) * g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = .89 / Math.max(.001, peak);
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) { pcm.writeInt16LE(Math.round(L[i] * norm * 32767), i * 4); pcm.writeInt16LE(Math.round(R[i] * norm * 32767), i * 4 + 2); }
const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8); header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
writeFileSync(path.join(import.meta.dirname, 'score.wav'), Buffer.concat([header, pcm]));
console.log(`Original chiptune score: ${DUR}s, peak before normalize ${peak.toFixed(3)}`);
