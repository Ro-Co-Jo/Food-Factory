// src/workers/bgmWorker.js
// v40：延长到 112s，新增 B 段与节奏/氛围层

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
  const B_START       = 82;
  const OUTRO_START   = 102;
  const TOTAL         = 112;

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

  function flute(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.08));
      const release = Math.min(1, (len - pos) / (sr * 0.3));
      const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.2 * t);
      const wave =
        Math.sin(2 * Math.PI * freq * vib * t) +
        0.15 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.05 * Math.sin(2 * Math.PI * freq * 3 * t);
      data[i] += wave * volume * attack * release;
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
  }

  function guitarStrum(startTime, notes, volume) {
    const strumPattern = [
      { t: 0,   dir: 'down', vol: 1.00, root: true  },
      { t: 1,   dir: 'down', vol: 0.85, root: true  },
      { t: 1.5, dir: 'up',   vol: 0.55, root: false },
      { t: 2.5, dir: 'up',   vol: 0.55, root: false },
      { t: 3,   dir: 'down', vol: 0.85, root: true  },
      { t: 3.5, dir: 'up',   vol: 0.55, root: false },
    ];
    for (const step of strumPattern) {
      const startBeat = startTime + step.t * beat;
      const strumVol = volume * step.vol;
      if (step.root) {
        guitar(startBeat, notes[0], 0.5 * beat * 0.98, strumVol * 1.1);
      }
      if (step.dir === 'down') {
        for (let i = 0; i < notes.length; i++) {
          guitar(startBeat + 0.01 + i * 0.012, notes[i], 0.5 * beat * 0.98, strumVol);
        }
      } else {
        for (let i = notes.length - 1; i >= 0; i--) {
          guitar(startBeat + (notes.length - 1 - i) * 0.012, notes[i], 0.5 * beat * 0.98, strumVol * 0.8);
        }
      }
    }
  }

  function stringEnsemble(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const actualDur = dur * 1.8;
    const s1 = Math.floor((startT + actualDur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    const detunes = [1.0, 1.0006];
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.6));
      const release = Math.min(1, (len - pos) / (sr * 1.0));
      const env = attack * release;
      let wave = 0;
      for (const d of detunes) {
        wave += Math.sin(2 * Math.PI * freq * d * t);
        wave += 0.06 * Math.sin(2 * Math.PI * freq * 2 * d * t);
      }
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
      const attack = Math.min(1, pos / (sr * 0.35));
      const sustain = pos < len * 0.6 ? 1 : (len - pos) / (len * 0.4);
      const release = Math.min(1, (len - pos) / (sr * 1.6));
      const env = attack * sustain * release;
      const f = freq * detune;
      const wave =
        Math.sin(2 * Math.PI * f * t) +
        0.18 * Math.sin(2 * Math.PI * f * 2 * t) +
        0.05 * Math.sin(2 * Math.PI * f * 3 * t);
      data[i] += wave * volume * env;
    }
  }

  function celloSection(startT, freq, dur, volume) {
    const extendedDur = dur * 1.5;
    cello(startT, freq, extendedDur, volume * 0.40, 1.0000);
    cello(startT, freq, extendedDur, volume * 0.30, 1.0015);
    cello(startT, freq, extendedDur, volume * 0.30, 0.9985);
  }

  function pizzBass(startT, freq, volume) {
    const dur = 0.4;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.005));
      const decay = Math.exp(-pos / (sr * 0.18));
      const release = Math.min(1, (len - pos) / (sr * 0.1));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.25 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.08 * Math.sin(2 * Math.PI * freq * 3 * t);
      data[i] += wave * volume * attack * decay * release;
    }
  }

  function harpHarmonic(startT, freq, volume) {
    const dur = 2.5;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.015));
      const decay = Math.exp(-pos / (sr * 1.4));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.20 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.08 * Math.sin(2 * Math.PI * freq * 3 * t) +
        0.04 * Math.sin(2 * Math.PI * freq * 4 * t);
      data[i] += wave * volume * attack * decay;
    }
  }

  function musicBoxDuo(startT, freq1, freq2, volume) {
    const dur = 1.5;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.003));
      const decay = Math.exp(-pos / (sr * 0.7));
      const wave1 = Math.sin(2 * Math.PI * freq1 * t) + 0.12 * Math.sin(2 * Math.PI * freq1 * 3 * t);
      const wave2 = Math.sin(2 * Math.PI * freq2 * t) + 0.12 * Math.sin(2 * Math.PI * freq2 * 3 * t);
      data[i] += (wave1 + 0.6 * wave2) * volume * attack * decay;
    }
  }

  function glockenspiel(startT, freq, volume) {
    const dur = 1.8;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    if (s1 <= s0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.003));
      const decay = Math.exp(-pos / (sr * 0.85));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.12 * Math.sin(2 * Math.PI * freq * 4 * t) +
        0.04 * Math.sin(2 * Math.PI * freq * 9.2 * t);
      data[i] += wave * volume * attack * decay;
    }
  }

  function markTree(startT, volume) {
    const notes = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0];
    for (let i = 0; i < notes.length; i++) {
      glockenspiel(startT + i * 0.06, notes[i], volume * (1 - i * 0.08));
    }
  }

  function shaker(startT, volume) {
    const dur = 0.1;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    let lp = 0;
    for (let i = s0; i < s1; i++) {
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.004));
      const decay = Math.exp(-pos / (sr * 0.025));
      const noise = Math.random() * 2 - 1;
      lp += 0.35 * (noise - lp);
      const hp = noise - lp;
      data[i] += hp * volume * attack * decay;
    }
  }

  function softKick(startT, volume) {
    const dur = 0.25;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    for (let i = s0; i < s1; i++) {
      const pos = i - s0;
      const t = pos / sr;
      const pitch = 55 * Math.exp(-t * 18) + 40;
      const decay = Math.exp(-pos / (sr * 0.08));
      data[i] += Math.sin(2 * Math.PI * pitch * t) * volume * decay;
    }
  }

  function brushSnare(startT, volume) {
    const dur = 0.12;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    let lp = 0;
    for (let i = s0; i < s1; i++) {
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.002));
      const decay = Math.exp(-pos / (sr * 0.04));
      const noise = Math.random() * 2 - 1;
      lp += 0.5 * (noise - lp);
      data[i] += (noise - lp) * volume * attack * decay;
    }
  }

  function vocalPad(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    const formants = [1, 2, 3, 4];
    const gains = [1, 0.35, 0.18, 0.08];
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.5));
      const release = Math.min(1, (len - pos) / (sr * 1.2));
      let wave = 0;
      for (let k = 0; k < formants.length; k++) {
        const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t + k);
        wave += gains[k] * Math.sin(2 * Math.PI * freq * formants[k] * vib * t);
      }
      data[i] += wave * volume * attack * release * 0.4;
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
    else if (t < 102) return 0.35 + ((t - 82) / 20) * 0.02;
    else if (t < 108) return 0.37 - ((t - 102) / 6) * 0.12;
    else return Math.max(0, 0.25 * (TOTAL - t) / 4);
  }

  function breeze(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let lp = 0;
    const alpha = 0.015;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const noise = Math.random() * 2 - 1;
      lp += alpha * (noise - lp);
      const env =
        0.50 +
        0.30 * Math.sin(2 * Math.PI * 0.05 * t) +
        0.20 * Math.sin(2 * Math.PI * 0.11 * t + 1.1);
      const globalFade = getGlobalFade(startT + t);
      data[i] += lp * env * globalFade * volume * 15;
    }
  }

  function oceanWave(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;

    let lpSurge = 0;
    let lpFall = 0;
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
      lpSurge += 0.010 * (n1 - lpSurge);
      lpFall += 0.025 * (n2 - lpFall);

      const sample = lpSurge * surgeAmp * 8.0 + lpFall * fallAmp * 5.0;
      const activity = Math.max(surgeAmp, fallAmp);
      const env = bigEnv * (0.10 + activity * 0.9);

      data[i] += sample * env * globalFade * volume;
    }
  }

  // ==================== 旋律和和弦 ====================

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

  // B 段：把 phrase 2 整体升高五度，和弦进行换成 G-Am-C
  const bPhrases = phrases[2].map(([sb, db, f, leg]) => [sb, db, f * 1.5, leg]);
  const bChords = [
    { root: F.G3,   notes: [F.G3, F.B3, F.D4, F.G4] },
    { root: F.A3,   notes: [F.A3, F.C4, F.E4, F.A4] },
    { root: 130.81, notes: [F.C4, F.E4, F.G4, F.C5] },
  ];

  const boxPairs = {
    0: [F.C6, F.E6, 0.020],
    1: [F.B5, F.D6, 0.020],
    2: [F.E6, F.G6, 0.010],
    3: [F.C6, F.E6, 0.020],
    4: [F.G5, F.B5, 0.018],
    5: [F.A5, F.C6, 0.016],
  };

  oceanWave(0, TOTAL, 0.20);
  breeze(0, TOTAL, 0.30);

  // ==================== Intro（0 - 12s）====================
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

  // Intro 末尾的钢琴下行，作为 A1 的引子
  piano(7.5, F.C5, 1.5 * beat, 0.18, false);
  piano(9.0, F.G4, 1.5 * beat, 0.17, false);
  piano(10.5, F.E4, 2 * beat, 0.16, false);
  piano(12.0 - 0.5, F.C4, 2 * beat, 0.15, false);

  // ==================== 渲染函数 ====================

  function renderPhrase(startTime, phraseIndex, config, melodyArr, chordsArr) {
    const melody = melodyArr || phrases[phraseIndex];
    const chords = chordsArr || phraseChords[phraseIndex];

    if (!config.silentMelody) {
      for (const [startBeat, durBeats, freq, legato] of melody) {
        piano(startTime + startBeat * beat, freq, durBeats * beat * 0.98, 0.30, legato);
      }
    }

    if (config.guitarFinger) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        guitarFingerpick(barStart, chords[b].notes, config.guitarVolume || 0.13);
      }
    }

    if (config.nylonFinger) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        nylonFingerpick(barStart, chords[b].notes, config.nylonVolume || 0.11);
      }
    }

    if (config.guitarStrum) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        guitarStrum(barStart, chords[b].notes, config.strumVolume || 0.10);
      }
    }

    if (config.strings) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        for (const note of chords[b].notes) {
          stringEnsemble(barStart, note, barDuration * 0.95, 0.020);
        }
      }
    }

    if (config.cello) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        const vol = (b === 1) ? 0.48 : 0.78;
        celloSection(barStart, chords[b].root, barDuration * 0.95, vol);
      }
    }

    if (config.pizz) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        pizzBass(barStart, chords[b].root, config.pizzVolume || 0.16);
        pizzBass(barStart + 2 * beat, chords[b].root, (config.pizzVolume || 0.16) * 0.8);
      }
    }

    if (config.harp) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        const c = chords[b];
        harpHarmonic(barStart + 1.5 * beat, c.notes[0], 0.022);
        harpHarmonic(barStart + 3.5 * beat, c.notes[2], 0.018);
      }
    }

    if (config.musicBox && phraseIndex !== undefined && boxPairs[phraseIndex]) {
      const [b1, b2, boxVol] = boxPairs[phraseIndex];
      musicBoxDuo(startTime + 2 * barDuration, b1, b2, boxVol);
    }

    if (config.flute) {
      // 长笛在每句第 1、2 小节的长音处吹根音高八度
      flute(startTime + 0 * barDuration, chords[0].root * 2, barDuration * 0.9, config.fluteVolume || 0.07);
      flute(startTime + 1 * barDuration, chords[1].root * 2, barDuration * 0.9, (config.fluteVolume || 0.07) * 0.9);
    }

    if (config.vocalPad) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        for (const note of chords[b].notes) {
          vocalPad(barStart, note, barDuration, (config.vocalPadVolume || 0.05));
        }
      }
    }

    if (config.shaker) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        for (let i = 0; i < 8; i++) {
          const t = barStart + i * 0.5 * beat;
          const vol = (i % 2 === 0) ? 0.11 : 0.06;
          shaker(t, vol);
        }
      }
    }

    if (config.drums) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        softKick(barStart + 0 * beat, 0.10);
        softKick(barStart + 2 * beat, 0.09);
        brushSnare(barStart + 1 * beat, 0.05);
        brushSnare(barStart + 3 * beat, 0.05);
      }
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
      harpHarmonic(barStart, c.notes[0], 0.030);
      harpHarmonic(barStart + 1 * beat, c.notes[1], 0.028);
      harpHarmonic(barStart + 2 * beat, c.notes[2], 0.026);
      harpHarmonic(barStart + 3 * beat, c.notes[3], 0.024);
    }
    // 后半段钢琴下行 + 钟琴点缀，引出 A2
    markTree(INTERLUDE + 3 * barDuration + 2 * beat, 0.014);
    piano(INTERLUDE + 3 * barDuration + 2 * beat, F.C5, 1 * beat, 0.20, false);
    piano(INTERLUDE + 3 * barDuration + 3 * beat, F.G4, 1 * beat, 0.19, false);
    piano(INTERLUDE + 3 * barDuration + 4 * beat, F.E4, 1 * beat, 0.18, false);
    piano(INTERLUDE + 3 * barDuration + 5 * beat, F.G4, 1 * beat, 0.17, false);
    piano(INTERLUDE + 3 * barDuration + 6 * beat, F.C4, 3 * beat, 0.16, 'veryLegato');
    glockenspiel(INTERLUDE + 3 * barDuration + 4 * beat, F.E6, 0.012);
    glockenspiel(INTERLUDE + 3 * barDuration + 5.5 * beat, F.C6, 0.011);
  }

  // ==================== A2（52 - 82s）====================
  markTree(SECOND_START - 0.4, 0.016);
  renderPhrase(SECOND_START + 0 * phraseDuration, 0, {
    guitarFinger: true, guitarVolume: 0.13,
    guitarStrum: true, strumVolume: 0.10,
    musicBox: true, strings: true, cello: true,
    pizz: true, pizzVolume: 0.16,
    shaker: true,
  });
  renderPhrase(SECOND_START + 1 * phraseDuration, 1, {
    guitarFinger: true, guitarVolume: 0.13,
    guitarStrum: true, strumVolume: 0.10,
    musicBox: true, strings: true, cello: true,
    pizz: true, pizzVolume: 0.16,
    shaker: true,
  });
  renderPhrase(SECOND_START + 2 * phraseDuration, 2, {
    guitarFinger: true, guitarVolume: 0.14,
    guitarStrum: true, strumVolume: 0.11,
    musicBox: true, strings: true, cello: true, harp: true,
    pizz: true, pizzVolume: 0.17,
    flute: true, fluteVolume: 0.06,
    shaker: true,
  });
  renderPhrase(SECOND_START + 3 * phraseDuration, 3, {
    guitarFinger: true, guitarVolume: 0.13,
    guitarStrum: true, strumVolume: 0.10,
    musicBox: true, strings: true, cello: true, harp: true,
    pizz: true, pizzVolume: 0.16,
    flute: true, fluteVolume: 0.06,
    shaker: true,
  });

  // ==================== B（82 - 102s）====================
  markTree(B_START - 0.4, 0.016);
  renderPhrase(B_START + 0 * phraseDuration, 2, {
    guitarFinger: true, guitarVolume: 0.13,
    guitarStrum: true, strumVolume: 0.10,
    strings: true, cello: true,
    pizz: true, pizzVolume: 0.17,
    flute: true, fluteVolume: 0.07,
    vocalPad: true, vocalPadVolume: 0.045,
    shaker: true, drums: true,
  }, bPhrases, bChords);
  renderPhrase(B_START + 1 * phraseDuration, 2, {
    guitarFinger: true, guitarVolume: 0.13,
    guitarStrum: true, strumVolume: 0.10,
    strings: true, cello: true,
    pizz: true, pizzVolume: 0.17,
    flute: true, fluteVolume: 0.07,
    vocalPad: true, vocalPadVolume: 0.045,
    shaker: true, drums: true,
  }, bPhrases, bChords);

  // ==================== Outro（102 - 112s）====================
  {
    const startTime = OUTRO_START;

    piano(startTime + 0 * beat, F.C5, 1.2 * beat, 0.26, false);
    piano(startTime + 1 * beat, F.G4, 1.2 * beat, 0.25, false);
    piano(startTime + 2 * beat, F.E4, 1.2 * beat, 0.24, false);
    piano(startTime + 3 * beat, F.G4, 1.2 * beat, 0.23, false);
    piano(startTime + 4 * beat, F.E4, 1.2 * beat, 0.22, false);
    piano(startTime + 5 * beat, F.G3, 1.2 * beat, 0.21, false);
    piano(startTime + 6 * beat, F.C4, 16 * beat, 0.20, 'veryLegato');

    guitar(startTime + 1 * beat, F.G4, 2 * beat, 0.10);
    guitar(startTime + 3 * beat, F.C4, 2 * beat, 0.09);
    guitar(startTime + 5 * beat, F.E3, 3 * beat, 0.08);

    vocalPad(startTime + 6 * beat, F.C4, 16 * beat, 0.05);
    vocalPad(startTime + 6 * beat, F.E4, 16 * beat, 0.04);
    vocalPad(startTime + 6 * beat, F.G4, 16 * beat, 0.03);

    glockenspiel(startTime + 0.7, F.C6, 0.014);
    glockenspiel(startTime + 1.5, F.G5, 0.013);
    glockenspiel(startTime + 2.3, F.E6, 0.012);
    glockenspiel(startTime + 3.1, F.B5, 0.012);
    glockenspiel(startTime + 3.9, F.G6, 0.011);
    glockenspiel(startTime + 4.7, F.C6, 0.010);
    glockenspiel(startTime + 6.0, F.E6, 0.009);
    glockenspiel(startTime + 7.5, F.G5, 0.008);
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
  const fout = Math.floor(sr * 0.6);
  for (let i = 0; i < fin; i++) data[i] *= i / fin;
  for (let i = 0; i < fout; i++) data[data.length - 1 - i] *= i / fout;

  return data.buffer;
}