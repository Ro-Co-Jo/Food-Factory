// src/workers/bgmWorker.js
// v55：C/D段去低频嗡嗡，旋律突出，和弦重配

self.onmessage = function (e) {
  const sr = e.data.sampleRate;
  const audioData = generateBGM(sr);
  self.postMessage({ audioData: audioData }, [audioData]);
};

function generateBGM(sr) {
  const bpm = 96;
  const beat = 60 / bpm;
  const barDuration = 4 * beat;
  const phraseDuration = 3 * barDuration;

  const INTRO_START   = 0;
  const FIRST_START   = 12;
  const INTERLUDE     = 42;
  const SECOND_START  = 52;
  const BRIDGE_START  = 82;
  const C_START       = 88;
  const C_END         = 103;
  const D_START       = 106;
  const D_END         = 121;
  const OUTRO_START   = 124;
  const TOTAL         = 155;

  const length = Math.floor(sr * TOTAL);
  const data = new Float32Array(length);

  const F = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
    G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.00,
  };

  // ==================== 音色 ====================

  function piano(startT, freq, dur, volume, legato) {
    const s0 = Math.floor(startT * sr);
    const overlap = 1.2;
    const s1 = Math.floor((startT + dur * overlap) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let at = 0.18, vf = 1.0;
    if (legato === 'veryLegato') { at = 0.45; vf = 0.58; }
    else if (legato === true) { at = 0.35; vf = 0.70; }
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * at));
      const d1 = Math.exp(-pos / (sr * 3.5));
      const d2 = Math.exp(-pos / (sr * 1.4));
      const d3 = Math.exp(-pos / (sr * 0.4));
      const wave =
        d1 * Math.sin(2 * Math.PI * freq * t) +
        0.04 * d2 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.008 * d3 * Math.sin(2 * Math.PI * freq * 3 * t);
      const release = Math.min(1, (len - pos) / (sr * 0.7));
      data[i] += wave * volume * vf * attack * release;
    }
  }

  function guitar(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.01));
      const decay = Math.exp(-pos / (sr * 1.8));
      const release = Math.min(1, (len - pos) / (sr * 0.5));
      const env = attack * decay * release;
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.08 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.03 * Math.sin(2 * Math.PI * freq * 3 * t) +
        0.02 * Math.sin(2 * Math.PI * freq * 4 * t) +
        0.01 * Math.sin(2 * Math.PI * freq * 5 * t);
      const body = 0.04 * Math.sin(2 * Math.PI * freq * 0.5 * t);
      data[i] += (wave + body) * volume * env;
    }
  }

  function nylonGuitar(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.008));
      const decay = Math.exp(-pos / (sr * 2.2));
      const release = Math.min(1, (len - pos) / (sr * 0.4));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.05 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.02 * Math.sin(2 * Math.PI * freq * 3 * t);
      data[i] += wave * volume * attack * decay * release;
    }
  }

  function guitarFingerpick(startTime, notes, volume) {
    const pattern = [0, 1, 2, 3, 2, 1, 0, 1];
    for (let i = 0; i < 8; i++) {
      const t = startTime + i * 0.5 * beat;
      guitar(t, notes[pattern[i]], 0.5 * beat * 0.98, volume);
    }
  }

  function nylonFingerpick(startTime, notes, volume) {
    const pattern = [0, 2, 1, 3, 2, 3, 1, 2];
    for (let i = 0; i < 8; i++) {
      const t = startTime + i * 0.5 * beat;
      nylonGuitar(t, notes[pattern[i]], 0.5 * beat * 0.98, volume);
    }
    nylonGuitar(startTime + 2 * 0.5 * beat - 0.08, notes[pattern[2]] * 1.122, 0.08, volume * 0.4);
    nylonGuitar(startTime + 5 * 0.5 * beat - 0.08, notes[pattern[5]] * 1.122, 0.08, volume * 0.4);
  }

  function stringEnsemble(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const actualDur = dur * 1.8;
    const s1 = Math.floor((startT + actualDur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.8));
      const release = Math.min(1, (len - pos) / (sr * 1.2));
      const env = attack * release;
      const wave = Math.sin(2 * Math.PI * freq * t);
      data[i] += wave * volume * env * 0.5;
    }
  }

  function cello(startT, freq, dur, volume, detune = 1.0) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.5));
      const sustain = pos < len * 0.6 ? 1 : (len - pos) / (len * 0.4);
      const release = Math.min(1, (len - pos) / (sr * 1.8));
      const env = attack * sustain * release;
      const f = freq * detune;
      const wave =
        Math.sin(2 * Math.PI * f * t) +
        0.12 * Math.sin(2 * Math.PI * f * 2 * t) +
        0.03 * Math.sin(2 * Math.PI * f * 3 * t);
      data[i] += wave * volume * env;
    }
  }

  function celloSection(startT, freq, dur, volume) {
    const extendedDur = dur * 1.5;
    cello(startT, freq, extendedDur, volume * 0.6, 1.0000);
  }

  function pizzBass(startT, freq, volume) {
    const dur = 0.45;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.008));
      const decay = Math.exp(-pos / (sr * 0.22));
      const release = Math.min(1, (len - pos) / (sr * 0.15));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.20 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.05 * Math.sin(2 * Math.PI * freq * 3 * t);
      data[i] += wave * volume * attack * decay * release;
    }
  }

  function harpHarmonic(startT, freq, volume) {
    const dur = 2.8;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.018));
      const decay = Math.exp(-pos / (sr * 1.5));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.18 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.06 * Math.sin(2 * Math.PI * freq * 3 * t) +
        0.03 * Math.sin(2 * Math.PI * freq * 4 * t);
      data[i] += wave * volume * attack * decay;
    }
  }

  function musicBoxDuo(startT, freq1, freq2, volume) {
    const dur = 1.6;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.003));
      const decay = Math.exp(-pos / (sr * 0.75));
      const wave1 = Math.sin(2 * Math.PI * freq1 * t) + 0.12 * Math.sin(2 * Math.PI * freq1 * 3 * t);
      const wave2 = Math.sin(2 * Math.PI * freq2 * t) + 0.12 * Math.sin(2 * Math.PI * freq2 * 3 * t);
      data[i] += (wave1 + 0.6 * wave2) * volume * attack * decay;
    }
  }

  function glockenspiel(startT, freq, volume) {
    const dur = 2.0;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    if (s1 <= s0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.003));
      const decay = Math.exp(-pos / (sr * 0.95));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.10 * Math.sin(2 * Math.PI * freq * 4 * t) +
        0.03 * Math.sin(2 * Math.PI * freq * 9.2 * t);
      data[i] += wave * volume * attack * decay;
    }
  }

  function farBell(startT, freq, volume) {
    const dur = 6.0;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.02));
      const decay = Math.exp(-pos / (sr * 2.5));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.5 * Math.sin(2 * Math.PI * freq * 2.76 * t) +
        0.25 * Math.sin(2 * Math.PI * freq * 5.4 * t);
      data[i] += wave * volume * attack * decay;
    }
  }

  function getGlobalFade(t) {
    if (t < 5) return 0;
    else if (t < 10) return ((t - 5) / 5) * 0.08;
    else if (t < 20) return 0.08 + ((t - 10) / 10) * 0.20;
    else if (t < 30) return 0.28 - ((t - 20) / 10) * 0.065;
    else if (t < 42) return 0.215 - ((t - 30) / 12) * 0.005;
    else if (t < 52) return 0.21 + ((t - 42) / 10) * 0.07;
    else if (t < 82) return 0.28 + ((t - 52) / 30) * 0.07;
    else if (t < 88) return 0.35 - ((t - 82) / 6) * 0.04;
    else if (t < 103) return 0.31 + ((t - 88) / 15) * 0.04;
    else if (t < 106) return 0.35 - ((t - 103) / 3) * 0.04;
    else if (t < 121) return 0.31 + ((t - 106) / 15) * 0.04;
    else if (t < 124) return 0.35 - ((t - 121) / 3) * 0.04;
    else if (t < 145) return 0.31 - ((t - 124) / 21) * 0.06;
    else if (t < 152) return 0.25 - ((t - 145) / 7) * 0.20;
    else return Math.max(0, 0.05 * (TOTAL - t) / 3);
  }

  function breeze(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let lp = 0;
    let lpFar = 0;
    const alpha = 0.010;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const noise = Math.random() * 2 - 1;
      lp += alpha * (noise - lp);
      const env =
        0.50 +
        0.30 * Math.sin(2 * Math.PI * 0.05 * t) +
        0.20 * Math.sin(2 * Math.PI * 0.11 * t + 1.1);
      const globalFade = getGlobalFade(startT + t);
      lpFar += 0.06 * (lp - lpFar);
      data[i] += lpFar * env * globalFade * volume * 6;
    }
  }

  function oceanWave(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;

    let lpSurge = 0;
    let lpFall = 0;
    let lpFar = 0;
    let wave = { active: false, elapsed: 0, duration: 0, peak: 0, riseRatio: 0 };
    let nextIn = 1.5;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const globalFade = getGlobalFade(startT + t);

      const innerWave1 = Math.sin(2 * Math.PI * t / 4.7);
      const innerWave2 = Math.sin(2 * Math.PI * t / 7.3 + 1.3);
      const innerWave3 = Math.sin(2 * Math.PI * t / 11.0 + 0.5);
      const innerWave = 0.55 + 0.22 * innerWave1 + 0.15 * innerWave2 + 0.08 * innerWave3;

      const bigEnv = 0.65 * (0.55 + 0.55 * innerWave);

      if (!wave.active) {
        nextIn -= 1 / sr;
        if (nextIn <= 0) {
          wave.active = true;
          wave.elapsed = 0;
          wave.duration = 4.0 + Math.random() * 2.5;
          wave.peak = 0.5 + Math.random() * 0.3;
          wave.riseRatio = 0.30 + Math.random() * 0.15;
        }
      } else {
        wave.elapsed += 1 / sr;
        if (wave.elapsed >= wave.duration) {
          wave.active = false;
          nextIn = 1.5 + Math.random() * 2.0;
        }
      }

      let surgeAmp = 0, fallAmp = 0;
      if (wave.active) {
        const p = wave.elapsed / wave.duration;
        if (p < wave.riseRatio) {
          const r = p / wave.riseRatio;
          surgeAmp = Math.pow(r, 1.6) * wave.peak;
        } else {
          const r = (p - wave.riseRatio) / (1 - wave.riseRatio);
          surgeAmp = Math.pow(1 - r, 1.5) * wave.peak;
          fallAmp = Math.sin(Math.PI * Math.min(1, r * 1.4)) * wave.peak * 0.85;
        }
      }

      const n1 = Math.random() * 2 - 1;
      const n2 = Math.random() * 2 - 1;
      lpSurge += 0.006 * (n1 - lpSurge);
      lpFall += 0.018 * (n2 - lpFall);

      const sample = lpSurge * surgeAmp * 4.5 + lpFall * fallAmp * 3.0;
      const activity = Math.max(surgeAmp, fallAmp);
      const env = bigEnv * (0.10 + activity * 0.9);

      lpFar += 0.08 * (sample - lpFar);
      const farSample = lpFar * 0.7 + sample * 0.3;

      data[i] += farSample * env * globalFade * volume;
    }
  }

  // ==================== 旋律 ====================

  const phrases = [
    [
      [0, 1, F.C4, false], [1, 1, F.E4, false], [2, 1, F.G4, false], [3, 1, F.F4, false],
      [4, 1, F.A4, false], [5, 1, F.G4, false],
      [6.5, 0.5, F.D4, false], [7, 1, F.E4, false],
      [8, 3, F.E4, true],
    ],
    [
      [0, 1, F.C4, false], [1, 1, F.E4, false], [2, 1, F.G4, false], [3, 1, F.F4, false],
      [4, 1, F.A4, false], [5, 1, F.G4, false],
      [6.5, 1, F.B4, false],
      [7.5, 1, F.C5, false],
      [8.5, 1, F.G4, false],
      [9.5, 2.5, F.E4, true],
    ],
    [
      [0, 1, F.E4, false], [1, 1, F.F4, false], [2, 1, F.G4, false], [3, 1, F.A4, false],
      [4, 1, F.C5, false], [5, 1, F.B4, false],
      [6.5, 0.5, F.D5, false], [7, 1, F.G4, false],
      [8, 0.5, F.F4, false], [8.5, 0.5, F.G4, false], [9, 0.5, F.F4, false], [9.5, 0.5, F.E4, false],
      [10, 2, F.G4, false],
    ],
    [
      [0, 1, F.C4, false], [1, 1, F.E4, false], [2, 1, F.G4, false], [3, 1, F.F4, false],
      [4, 1, F.E4, false], [5, 1, F.D4, false],
      [6.5, 0.5, F.E4, false], [7, 0.5, F.C4, false],
      [7.5, 0.5, F.B3, false],
      [8, 0.5, F.C4, false],
      [8.5, 2.5, F.C4, true],
    ],
  ];

  const phraseChords = [
    [
      { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
      { root: F.A3,   notes: [F.A3, F.C4, F.E4, F.A4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
    ],
    [
      { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
      { root: 174.61, notes: [174.61, F.A3, F.C4, F.F4] },
      { root: F.G3,   notes: [F.G3, F.B3, F.D4, F.G4] },
    ],
    [
      { root: F.A3,   notes: [F.A3, F.C4, F.E4, F.A4] },
      { root: 174.61, notes: [174.61, F.A3, F.C4, F.F4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
    ],
    [
      { root: 174.61, notes: [174.61, F.A3, F.C4, F.F4] },
      { root: F.G3,   notes: [F.G3, F.B3, F.D4, F.G4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
    ],
  ];

  // ==================== C 第三乐句（用户指定旋律）====================
  // a4 a4 b4 c5 b4 a4 g4 c5 e5 b3 a3
  // 保持旋律原样，不升八度
  const cPhrases = [
    [
      [0, 1, F.A4, false], [1, 1, F.A4, false], [2, 1, F.B4, false], [3, 1, F.C5, false],
      [4, 1, F.B4, false], [5, 1, F.A4, false], [6, 1, F.G4, false], [7, 1, F.C5, false],
      [8, 1, F.E5, false], [9, 1, F.B3, false], [10, 2, F.A3, true],
    ],
    [
      [0, 1, F.A4, false], [1, 1, F.A4, false], [2, 1, F.B4, false], [3, 1, F.C5, false],
      [4, 1, F.B4, false], [5, 1, F.A4, false], [6, 1, F.G4, false], [7, 1, F.C5, false],
      [8, 1, F.E5, false], [9, 1, F.B4, false], [10, 2, F.A4, true],
    ],
  ];
  // C 段和弦：C - G - Am（低音移开，不和旋律末音 A3 同频）
  const cChords = [
    { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
    { root: F.G3,   notes: [F.G3, F.B3, F.D4, F.G4] },
    { root: F.A3,   notes: [F.A3, F.C4, F.E4, F.A4] },
  ];

  // ==================== D 第四乐句（用户指定旋律）====================
  // e4 f4 g4 c4 c4 d4 c4
  const dPhrases = [
    [
      [0, 1, F.E4, false], [1, 1, F.F4, false], [2, 2, F.G4, false],
      [4, 1, F.C4, false], [5, 1, F.C4, false], [6, 2, F.D4, false],
      [8, 4, F.C4, true],
    ],
    [
      [0, 1, F.E4, false], [1, 1, F.F4, false], [2, 2, F.G4, false],
      [4, 2, F.C4, false], [6, 2, F.D4, false], [8, 4, F.C4, true],
    ],
  ];
  // D 段和弦：F - C - G（低音避开 C4 反复）
  const dChords = [
    { root: 174.61, notes: [174.61, F.A3, F.C4, F.F4] },
    { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
    { root: F.G3,   notes: [F.G3, F.B3, F.D4, F.G4] },
  ];

  const boxPairs = {
    0: [F.C6, F.E6, 0.020],
    1: [F.B5, F.D6, 0.020],
    2: [F.C6, F.E6, 0.012],
    3: [F.C6, F.E6, 0.020],
    4: [F.G5, F.B5, 0.016],
    5: [F.A5, F.C6, 0.014],
    6: [F.G5, F.B5, 0.012],
  };

  oceanWave(0, TOTAL, 0.12);
  breeze(0, TOTAL, 0.18);

  // ==================== Intro（0 - 12s）====================
  farBell(2.0, F.C3, 0.018);

  glockenspiel(0.6, F.C6, 0.018);
  glockenspiel(1.4, F.G5, 0.016);
  glockenspiel(2.3, F.E6, 0.017);
  glockenspiel(3.1, F.C6, 0.015);
  glockenspiel(3.9, F.B5, 0.016);
  glockenspiel(4.6, F.G6, 0.014);
  glockenspiel(6.0, F.E6, 0.013);
  glockenspiel(7.2, F.C6, 0.012);
  glockenspiel(8.5, F.A5, 0.012);
  glockenspiel(9.8, F.G5, 0.011);

  piano(7.5, F.C5, 1.5 * beat, 0.18, false);
  piano(9.0, F.G4, 1.5 * beat, 0.17, false);
  piano(10.5, F.E4, 2 * beat, 0.16, false);
  piano(11.5, F.C4, 2 * beat, 0.15, false);

  // ==================== 渲染函数 ====================

  function renderPhrase(startTime, phraseIndex, config, melodyArr, chordsArr) {
    const melody = melodyArr || phrases[phraseIndex];
    const chords = chordsArr || phraseChords[phraseIndex];

    if (!config.silentMelody) {
      const melodyVol = config.melodyVolume || 0.28;
      for (const [startBeat, durBeats, freq, legato] of melody) {
        piano(startTime + startBeat * beat, freq, durBeats * beat * 0.98, melodyVol, legato);
        if (config.pianoEcho) {
          piano(startTime + (startBeat + 0.5) * beat, freq * 2, durBeats * beat * 0.4, 0.045, false);
        }
      }
    }

    if (config.guitarFinger) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        guitarFingerpick(barStart, chords[b].notes, config.guitarVolume || 0.11);
      }
    }

    if (config.nylonFinger) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        nylonFingerpick(barStart, chords[b].notes, config.nylonVolume || 0.07);
      }
    }

    if (config.strings) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        for (const note of chords[b].notes) {
          stringEnsemble(barStart, note, barDuration * 0.95, config.stringsVolume || 0.008);
        }
      }
    }

    if (config.cello) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        const vol = (b === 1) ? 0.35 : 0.55;
        celloSection(barStart, chords[b].root, barDuration * 0.95, vol);
      }
    }

    if (config.pizz) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        const v = config.pizzVolume || 0.08;
        pizzBass(barStart + 0 * beat, chords[b].notes[1], v);
        pizzBass(barStart + 2 * beat, chords[b].notes[1], v * 0.85);
      }
    }

    if (config.harp) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        const c = chords[b];
        // C/D 段只 4 个音，减少密度
        const n = config.harpDensity === 'low' ? 4 : 7;
        if (n === 4) {
          harpHarmonic(barStart + 0.0 * beat, c.notes[0], 0.016);
          harpHarmonic(barStart + 1.0 * beat, c.notes[1], 0.015);
          harpHarmonic(barStart + 2.0 * beat, c.notes[2], 0.014);
          harpHarmonic(barStart + 3.0 * beat, c.notes[3], 0.013);
        } else {
          harpHarmonic(barStart + 0.0 * beat, c.notes[0], 0.020);
          harpHarmonic(barStart + 0.5 * beat, c.notes[1], 0.019);
          harpHarmonic(barStart + 1.0 * beat, c.notes[2], 0.018);
          harpHarmonic(barStart + 1.5 * beat, c.notes[3], 0.017);
          harpHarmonic(barStart + 2.5 * beat, c.notes[2], 0.016);
          harpHarmonic(barStart + 3.0 * beat, c.notes[1], 0.015);
          harpHarmonic(barStart + 3.5 * beat, c.notes[0], 0.014);
        }
      }
    }

    if (config.musicBox && phraseIndex !== undefined && boxPairs[phraseIndex]) {
      const [b1, b2, boxVol] = boxPairs[phraseIndex];
      musicBoxDuo(startTime + 2 * barDuration, b1, b2, boxVol);
    }
  }

  // ==================== A1（12 - 42s）====================
  renderPhrase(FIRST_START + 0 * phraseDuration, 0, { musicBox: true, nylonFinger: true });
  renderPhrase(FIRST_START + 1 * phraseDuration, 1, { musicBox: true, nylonFinger: true });
  renderPhrase(FIRST_START + 2 * phraseDuration, 2, {
    musicBox: true, nylonFinger: true, strings: true, cello: true,
  });
  renderPhrase(FIRST_START + 3 * phraseDuration, 3, {
    musicBox: true, nylonFinger: true, strings: true, cello: true,
  });

  // ==================== Interlude（42 - 52s）====================
  {
    const startTime = INTERLUDE;
    const chords = phraseChords[0];
    for (let b = 0; b < 3; b++) {
      const barStart = startTime + b * barDuration;
      const c = chords[b];
      harpHarmonic(barStart, c.notes[0], 0.028);
      harpHarmonic(barStart + 1 * beat, c.notes[1], 0.026);
      harpHarmonic(barStart + 2 * beat, c.notes[2], 0.024);
      harpHarmonic(barStart + 3 * beat, c.notes[3], 0.022);
    }
    piano(INTERLUDE + 3 * barDuration + 2 * beat, F.C5, 1 * beat, 0.18, false);
    piano(INTERLUDE + 3 * barDuration + 3 * beat, F.G4, 1 * beat, 0.17, false);
    piano(INTERLUDE + 3 * barDuration + 4 * beat, F.E4, 1 * beat, 0.16, false);
    piano(INTERLUDE + 3 * barDuration + 5 * beat, F.G4, 1 * beat, 0.15, false);
    piano(INTERLUDE + 3 * barDuration + 6 * beat, F.C4, 3 * beat, 0.14, 'veryLegato');
    glockenspiel(INTERLUDE + 3 * barDuration + 4 * beat, F.E6, 0.010);
    glockenspiel(INTERLUDE + 3 * barDuration + 5.5 * beat, F.C6, 0.009);
  }

  // ==================== A2（52 - 82s）====================
  renderPhrase(SECOND_START + 0 * phraseDuration, 0, {
    guitarFinger: true, guitarVolume: 0.11,
    musicBox: true, strings: true, cello: true,
    pizz: true, pizzVolume: 0.08,
    pianoEcho: true,
  });
  renderPhrase(SECOND_START + 1 * phraseDuration, 1, {
    guitarFinger: true, guitarVolume: 0.11,
    musicBox: true, strings: true, cello: true,
    pizz: true, pizzVolume: 0.08,
    pianoEcho: true,
  });
  renderPhrase(SECOND_START + 2 * phraseDuration, 2, {
    guitarFinger: true, guitarVolume: 0.12,
    musicBox: true, strings: true, cello: true, harp: true,
    pizz: true, pizzVolume: 0.09,
    pianoEcho: true,
  });
  renderPhrase(SECOND_START + 3 * phraseDuration, 3, {
    guitarFinger: true, guitarVolume: 0.11,
    musicBox: true, strings: true, cello: true, harp: true,
    pizz: true, pizzVolume: 0.08,
    pianoEcho: true,
  });

  // ==================== Bridge（82 - 88s）====================
  {
    const t0 = BRIDGE_START;
    harpHarmonic(t0 + 0.0, F.G4, 0.014);
    harpHarmonic(t0 + 1.0, F.A4, 0.013);
    harpHarmonic(t0 + 2.0, F.G4, 0.012);
    musicBoxDuo(t0 + 3.0, F.E5, F.G5, 0.008);
    piano(t0 + 4.0, F.G4, 1.5 * beat, 0.13, false);
    piano(t0 + 5.2, F.A4, 1.5 * beat, 0.12, false);
  }

  // ==================== C 第三乐句（88 - 103s）====================
  // 无 cello、无 pizz、无 pianoEcho，旋律音量 0.32 突出
  renderPhrase(C_START + 0 * phraseDuration, 4, {
    melodyVolume: 0.32,
    guitarFinger: true, guitarVolume: 0.09,
    musicBox: true,
    strings: true, stringsVolume: 0.008,
    harp: true, harpDensity: 'low',
  }, cPhrases[0], cChords);

  renderPhrase(C_START + 1 * phraseDuration, 5, {
    melodyVolume: 0.32,
    guitarFinger: true, guitarVolume: 0.09,
    musicBox: true,
    strings: true, stringsVolume: 0.008,
    harp: true, harpDensity: 'low',
  }, cPhrases[1], cChords);

  // C → D 过渡
  {
    const t0 = C_END;
    harpHarmonic(t0 + 0.0, F.A4, 0.014);
    harpHarmonic(t0 + 1.2, F.G4, 0.013);
    musicBoxDuo(t0 + 2.5, F.C5, F.E5, 0.008);
  }

  // ==================== D 第四乐句（106 - 121s）====================
  renderPhrase(D_START + 0 * phraseDuration, 6, {
    melodyVolume: 0.32,
    guitarFinger: true, guitarVolume: 0.09,
    musicBox: true,
    strings: true, stringsVolume: 0.008,
    harp: true, harpDensity: 'low',
  }, dPhrases[0], dChords);

  renderPhrase(D_START + 1 * phraseDuration, 6, {
    melodyVolume: 0.32,
    guitarFinger: true, guitarVolume: 0.09,
    musicBox: true,
    strings: true, stringsVolume: 0.008,
    harp: true, harpDensity: 'low',
  }, dPhrases[1], dChords);

  // D → Outro 过渡
  {
    const t0 = D_END;
    harpHarmonic(t0 + 0.0, F.G4, 0.014);
    harpHarmonic(t0 + 1.2, F.E4, 0.013);
    musicBoxDuo(t0 + 2.5, F.C5, F.E5, 0.008);
  }

  // ==================== Outro（124 - 155s）====================
  {
    const startTime = OUTRO_START;

    piano(startTime + 0 * beat, F.C5, 1.2 * beat, 0.24, false);
    piano(startTime + 1 * beat, F.G4, 1.2 * beat, 0.23, false);
    piano(startTime + 2 * beat, F.E4, 1.2 * beat, 0.22, false);
    piano(startTime + 3 * beat, F.G4, 1.2 * beat, 0.21, false);
    piano(startTime + 4 * beat, F.E4, 1.2 * beat, 0.20, false);
    piano(startTime + 5 * beat, F.G3, 1.2 * beat, 0.19, false);
    piano(startTime + 6 * beat, F.C4, 32 * beat, 0.18, 'veryLegato');

    piano(startTime + 6.4 * beat, F.E5, 2 * beat, 0.16, false);
    piano(startTime + 8.8 * beat, F.G4, 2 * beat, 0.15, false);
    piano(startTime + 11.2 * beat, F.C5, 2 * beat, 0.14, false);
    piano(startTime + 13.6 * beat, F.A4, 2 * beat, 0.13, false);
    piano(startTime + 16 * beat, F.G4, 3 * beat, 0.12, false);
    piano(startTime + 19.2 * beat, F.E4, 4 * beat, 0.11, 'veryLegato');

    guitar(startTime + 1 * beat, F.G4, 2 * beat, 0.08);
    guitar(startTime + 3 * beat, F.C4, 2 * beat, 0.07);
    guitar(startTime + 5 * beat, F.E3, 3 * beat, 0.06);

    harpHarmonic(startTime + 22 * beat, F.C5, 0.014);
    harpHarmonic(startTime + 24 * beat, F.G4, 0.012);

    glockenspiel(startTime + 0.7, F.C6, 0.012);
    glockenspiel(startTime + 1.5, F.G5, 0.011);
    glockenspiel(startTime + 2.3, F.E6, 0.010);
    glockenspiel(startTime + 3.1, F.B5, 0.010);
    glockenspiel(startTime + 3.9, F.G6, 0.009);
    glockenspiel(startTime + 4.7, F.C6, 0.008);
    glockenspiel(startTime + 6.0, F.E6, 0.008);
    glockenspiel(startTime + 7.5, F.G5, 0.007);
  }

  // ==================== 归一化 ====================
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > max) max = a;
  }
  const target = 0.92;
  if (max > target) {
    const scale = target / max;
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }

  const fin = Math.floor(sr * 0.05);
  const fout = Math.floor(sr * 3.5);
  for (let i = 0; i < fin; i++) data[i] *= i / fin;
  for (let i = 0; i < fout; i++) data[data.length - 1 - i] *= i / fout;

  return data.buffer;
}