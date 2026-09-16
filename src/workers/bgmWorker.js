// src/workers/bgmWorker.js
// 方案D改良版 v24：
// - 修复 C 段海浪降不下来的 bug（改 globalFade 曲线，让 C 段真正降下来）
// - 其他层不变

self.onmessage = function (e) {
  const sr = e.data.sampleRate;
  const audioData = generateBGM(sr);
  self.postMessage({ audioData: audioData }, [audioData]);
};

function generateBGM(sr) {
  const bpm = 96;
  const beat = 60 / bpm;
  const barDuration = 4 * beat;
  const totalBars = 12;
  const totalDuration = totalBars * barDuration;
  const length = Math.floor(sr * totalDuration);
  const data = new Float32Array(length);

  const F = {
    B3: 246.94,
    G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
    B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
  };

    /** 新的 globalFade：A 0→0.05，B →0.25，C →0.185，D →0 */
  function getGlobalFade(t, dur) {
    if (t < 5) {
      return 0;
    } else if (t < 7.5) {
      // A 段：0 → 0.05
      return ((t - 5) / 2.5) * 0.05;
    } else if (t < 15) {
      // B 段：0.05 → 0.25
      return 0.05 + ((t - 7.5) / 7.5) * 0.20;
    } else if (t < 22.5) {
      // C 段：0.25 → 0.185
      return 0.25 - ((t - 15) / 7.5) * 0.065;
    } else if (t < 27) {
      // D 段：0.185 → 0.08
      return 0.185 - ((t - 22.5) / 4.5) * 0.105;
    } else {
      // 27-30s：0.08 → 0
      return Math.max(0, 0.08 * (dur - t) / 3);
    }
  }

  function piano(startT, freq, dur, volume, legato) {
    const s0 = Math.floor(startT * sr);
    const overlap = 1.2;
    const s1 = Math.floor((startT + dur * overlap) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let at = 0.18, vf = 1.0;
    if (legato === 'veryLegato') { at = 0.7; vf = 0.58; }
    else if (legato === true) { at = 0.5; vf = 0.70; }
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
      const attack = Math.min(1, pos / (sr * 0.3));
      const sustain = pos < len * 0.85 ? 1 : (len - pos) / (len * 0.15);
      const release = Math.min(1, (len - pos) / (sr * 0.8));
      const env = attack * sustain * release;
      const f = freq * detune;
      const wave =
        Math.sin(2 * Math.PI * f * t) +
        0.18 * Math.sin(2 * Math.PI * f * 2 * t);
      data[i] += wave * volume * env;
    }
  }

  function celloSection(startT, freq, dur, volume) {
    cello(startT, freq, dur, volume * 0.45, 1.0000);
    cello(startT, freq, dur, volume * 0.35, 1.0015);
    cello(startT, freq, dur, volume * 0.35, 0.9985);
  }

  function harpHarmonic(startT, freq, volume) {
    const dur = 2.5;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
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

  /** 微风：用新的 globalFade */
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

      const globalFade = getGlobalFade(t, dur);
      data[i] += lp * env * globalFade * volume * 15;
    }
  }

  /** 海浪：用新的 globalFade，C 段真正降下来 */
  function oceanWave(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;

    let lpSurge = 0;
    let lpFall = 0;

    let wave = {
      active: false,
      elapsed: 0,
      duration: 0,
      peak: 0,
      riseRatio: 0,
    };
    let nextIn = 1.5;

    const sectionLen = dur / 4;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;

      // ===== 新的 globalFade，跟随大结构 =====
      const globalFade = getGlobalFade(t, dur);

      const sectionIndex = Math.min(3, Math.floor(t / sectionLen));
      const sectionPos = (t % sectionLen) / sectionLen;

      const innerWave1 = Math.sin(2 * Math.PI * t / 4.7);
      const innerWave2 = Math.sin(2 * Math.PI * t / 7.3 + 1.3);
      const innerWave3 = Math.sin(2 * Math.PI * t / 11.0 + 0.5);
      const innerWave =
        0.55 + 0.22 * innerWave1 + 0.15 * innerWave2 + 0.08 * innerWave3;

      // baseEnv 改成简化版：只做每段内部的轻微起伏
      let baseEnv;
      if (sectionIndex === 0) baseEnv = 0.60;
      else if (sectionIndex === 1) baseEnv = 0.70;
      else if (sectionIndex === 2) baseEnv = 0.55;
      else baseEnv = 0.45;

      const bigEnv = baseEnv * (0.55 + 0.55 * innerWave);

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

      let surgeAmp = 0;
      let fallAmp = 0;
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

      const surgeSample = lpSurge * surgeAmp * 8.0;
      const fallSample = lpFall * fallAmp * 5.0;
      const sample = surgeSample + fallSample;

      const activity = Math.max(surgeAmp, fallAmp);
      const env = bigEnv * (0.10 + activity * 0.9);

      data[i] += sample * env * globalFade * volume;
    }
  }

  // ============ 旋律 ============
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

  oceanWave(0, totalDuration, 0.20);
  breeze(0, totalDuration, 0.30);

  for (let p = 0; p < 4; p++) {
    const phraseStart = p * 3 * barDuration;
    const melody = phrases[p];
    const chords = phraseChords[p];

    for (const [startBeat, durBeats, freq, legato] of melody) {
      piano(phraseStart + startBeat * beat, freq, durBeats * beat * 0.98, 0.30, legato);
    }

    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      for (const note of chords[b].notes) {
        stringEnsemble(barStart, note, barDuration * 0.95, 0.020);
      }
    }

    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const vol = (b === 1) ? 0.48 : 0.78;
      celloSection(barStart, chords[b].root, barDuration * 0.95, vol);
    }

    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const c = chords[b];
      harpHarmonic(barStart + 1.5 * beat, c.notes[0], 0.022);
      harpHarmonic(barStart + 3.5 * beat, c.notes[2], 0.018);
    }

    const boxPairs = [
      [F.C6, F.E6, 0.020],
      [F.B5, F.D6, 0.020],
      [F.E6, F.G6, 0.010],
      [F.C6, F.E6, 0.020],
    ];
    const [b1, b2, boxVol] = boxPairs[p];
    musicBoxDuo(phraseStart + 2 * barDuration, b1, b2, boxVol);
  }

  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > max) max = a;
  }
  if (max > 1.0) {
    const scale = 1.0 / max;
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }

  const fin = Math.floor(sr * 0.05);
  const fout = Math.floor(sr * 0.2);
  for (let i = 0; i < fin; i++) data[i] *= i / fin;
  for (let i = 0; i < fout; i++) data[data.length - 1 - i] *= i / fout;

  return data.buffer;
}