// src/workers/bgmWorker.js
// 方案D改良版 v12：
// - 海浪声：涌来 + 退去 两阶段独立处理
// - 退去用高通噪声做"哗啦哗啦"颗粒
// - 恢复微风层
// - 海浪音量降到 0.5，大提琴提升到 0.55/0.32

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

  // ============ 音色 ============

  function piano(startT, freq, dur, volume, legato) {
    const s0 = Math.floor(startT * sr);
    const overlap = 1.2;
    const s1 = Math.floor((startT + dur * overlap) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let at = 0.13, vf = 1.0;
    if (legato === 'veryLegato') { at = 0.6; vf = 0.6; }
    else if (legato === true) { at = 0.4; vf = 0.72; }
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * at));
      const d1 = Math.exp(-pos / (sr * 3.0));
      const d2 = Math.exp(-pos / (sr * 1.2));
      const d3 = Math.exp(-pos / (sr * 0.35));
      const wave =
        d1 * Math.sin(2 * Math.PI * freq * t) +
        0.05 * d2 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.01 * d3 * Math.sin(2 * Math.PI * freq * 3 * t);
      const release = Math.min(1, (len - pos) / (sr * 0.55));
      data[i] += wave * volume * vf * attack * release;
    }
  }

  function stringEnsemble(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const actualDur = dur * 1.8;
    const s1 = Math.floor((startT + actualDur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    const detunes = [1.0, 1.003, 0.997];
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.6));
      const release = Math.min(1, (len - pos) / (sr * 1.0));
      const env = attack * release;
      let wave = 0;
      for (const d of detunes) {
        wave += Math.sin(2 * Math.PI * freq * d * t);
        wave += 0.18 * Math.sin(2 * Math.PI * freq * 2 * d * t);
        wave += 0.05 * Math.sin(2 * Math.PI * freq * 3 * d * t);
      }
      data[i] += wave * volume * env * 0.33;
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
      const decay = Math.exp(-pos / (sr * 3.2));
      const release = Math.min(1, (len - pos) / (sr * 0.8));
      const f = freq * detune;
      const wave =
        Math.sin(2 * Math.PI * f * t) +
        0.25 * Math.sin(2 * Math.PI * f * 2 * t) +
        0.08 * Math.sin(2 * Math.PI * f * 3 * t);
      data[i] += wave * volume * attack * decay * release;
    }
  }

  function celloSection(startT, freq, dur, volume) {
    cello(startT, freq, dur, volume * 0.4, 1.0);
    cello(startT, freq, dur, volume * 0.35, 1.004);
    cello(startT, freq, dur, volume * 0.35, 0.996);
  }

  function harpHarmonic(startT, freq, volume) {
    const dur = 2.0;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.005));
      const decay = Math.exp(-pos / (sr * 0.8));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.08 * Math.sin(2 * Math.PI * freq * 3 * t);
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

  /**
   * 微风：独立的低通白噪声层，缓慢起伏
   * 一直持续，不受浪事件影响
   */
  function breeze(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let lp = 0;
    const alpha = 0.006;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const noise = Math.random() * 2 - 1;
      lp += alpha * (noise - lp);
      // 缓慢的强弱起伏
      const env = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.06 * t) * Math.sin(2 * Math.PI * 0.11 * t + 0.7);
      // 首尾长淡入淡出（3秒）
      const fadeIn = Math.min(1, pos / (sr * 3.0));
      const fadeOut = Math.min(1, (len - pos) / (sr * 3.0));
      data[i] += lp * env * fadeIn * fadeOut * volume;
    }
  }

  /**
   * 海浪声（涌来 + 退去 双阶段）：
   * - 涌来：柔和低通噪声，缓慢渐强（pow 1.8，先慢后快）
   * - 退去：独立的高通噪声（"哗啦哗啦"颗粒），sin 包络在退去中间最强
   * - 浪事件随机：时长 3.5-6s / 峰值 0.45-0.75 / 上升比 25%-40% / 间隔 1.2-3s
   * - 大结构 A→B→C→D→回落
   */
  function oceanWave(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;

    // 涌来噪声：低通状态
    let lpSurge = 0;
    // 退去噪声：低通状态（用于差分得到高通）
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

      // ===== 大结构 A→B→C→D→回落 =====
      const sectionIndex = Math.min(3, Math.floor(t / sectionLen));
      const sectionPos = (t % sectionLen) / sectionLen;
      let bigEnv;
      if (sectionIndex === 0) {
        bigEnv = 0.50 + 0.10 * sectionPos;
      } else if (sectionIndex === 1) {
        bigEnv = 0.60 + 0.10 * sectionPos;
      } else if (sectionIndex === 2) {
        bigEnv = 0.70 + 0.15 * sectionPos;
      } else {
        if (sectionPos < 0.6) {
          bigEnv = 0.85 + 0.10 * (sectionPos / 0.6);
        } else {
          bigEnv = 0.95 - 0.45 * ((sectionPos - 0.6) / 0.4);
        }
      }

      // ===== 浪事件管理 =====
      if (!wave.active) {
        nextIn -= 1 / sr;
        if (nextIn <= 0) {
          wave.active = true;
          wave.elapsed = 0;
          wave.duration = 3.5 + Math.random() * 2.5;   // 3.5-6s
          wave.peak = 0.45 + Math.random() * 0.30;     // 0.45-0.75
          wave.riseRatio = 0.25 + Math.random() * 0.15;
        }
      } else {
        wave.elapsed += 1 / sr;
        if (wave.elapsed >= wave.duration) {
          wave.active = false;
          nextIn = 1.2 + Math.random() * 1.8;
        }
      }

      // ===== 涌来强度 / 退去强度 =====
      let surge = 0;
      let backwash = 0;
      if (wave.active) {
        const p = wave.elapsed / wave.duration;
        if (p < wave.riseRatio) {
          const r = p / wave.riseRatio;
          // 涌来：先慢后快，柔和渐强
          surge = Math.pow(r, 1.8) * wave.peak;
        } else {
          const r = (p - wave.riseRatio) / (1 - wave.riseRatio);
          // 涌来缓慢退去
          surge = Math.pow(1 - r, 1.5) * wave.peak;
          // 退水：sin 包络，在退去中间最强
          backwash = Math.sin(r * Math.PI) * wave.peak;
        }
      }

      // ===== 涌来音色：柔和低通 =====
      const noise1 = Math.random() * 2 - 1;
      const alphaSurge = 0.012 + 0.05 * surge;
      lpSurge += alphaSurge * (noise1 - lpSurge);

      // ===== 退去音色：高通颗粒 =====
      const noise2 = Math.random() * 2 - 1;
      const alphaFall = 0.08 + 0.20 * backwash;
      lpFall += alphaFall * (noise2 - lpFall);
      const fallGrain = noise2 - lpFall;  // 高通成分

      // ===== 混合 =====
      const surgeSample = lpSurge * surge * 1.2;
      const fallSample = fallGrain * backwash * 0.55;
      const sample = surgeSample + fallSample;

      // ===== 综合包络 =====
      const activity = Math.max(surge * 0.8, backwash * 1.1);
      const env = bigEnv * (0.15 + activity);

      const fadeIn = Math.min(1, pos / (sr * 0.5));
      const fadeOut = Math.min(1, (len - pos) / (sr * 0.5));

      data[i] += sample * env * fadeIn * fadeOut * volume;
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
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
      { root: F.A3, notes: [F.A3, F.C4, F.E4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
    ],
    [
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
      { root: 174.61, notes: [174.61, F.A3, F.C4] },
      { root: F.G3, notes: [F.G3, F.B3, F.D4] },
    ],
    [
      { root: F.A3, notes: [F.A3, F.C4, F.E4] },
      { root: 174.61, notes: [174.61, F.A3, F.C4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
    ],
    [
      { root: 174.61, notes: [174.61, F.A3, F.C4] },
      { root: F.G3, notes: [F.G3, F.B3, F.D4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
    ],
  ];

  // ============ 背景：海浪 + 微风 ============
  oceanWave(0, totalDuration, 0.5);   // 海浪音量 0.5
  breeze(0, totalDuration, 0.12);    // 微风音量 0.12

  // ============ 合成 ============
  for (let p = 0; p < 4; p++) {
    const phraseStart = p * 3 * barDuration;
    const melody = phrases[p];
    const chords = phraseChords[p];

    // 1. 主旋律：钢琴
    for (const [startBeat, durBeats, freq, legato] of melody) {
      piano(phraseStart + startBeat * beat, freq, durBeats * beat * 0.98, 0.26, legato);
    }

    // 2. 弦乐组
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      for (const note of chords[b].notes) {
        stringEnsemble(barStart, note, barDuration * 0.95, 0.045);
      }
    }

    // 3. 大提琴（音量提升到 0.55/0.32）
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const vol = (b === 1) ? 0.32 : 0.55;
      celloSection(barStart, chords[b].root, barDuration * 0.95, vol);
    }

    // 4. 竖琴泛音
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const c = chords[b];
      harpHarmonic(barStart + 1.5 * beat, c.notes[0] * 2, 0.045);
      harpHarmonic(barStart + 3.5 * beat, c.notes[2] * 2, 0.04);
    }

    // 5. 八音盒：A/B/D 0.026，C 0.013
    const boxPairs = [
      [F.C6, F.E6, 0.026],
      [F.B5, F.D6, 0.026],
      [F.E6, F.G6, 0.013],
      [F.C6, F.E6, 0.026],
    ];
    const [b1, b2, boxVol] = boxPairs[p];
    musicBoxDuo(phraseStart + 2 * barDuration, b1, b2, boxVol);
  }

  // 归一化
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]);
    if (a > max) max = a;
  }
  if (max > 0.55) {
    const scale = 0.55 / max;
    for (let i = 0; i < data.length; i++) data[i] *= scale;
  }

  const fin = Math.floor(sr * 0.05);
  const fout = Math.floor(sr * 0.2);
  for (let i = 0; i < fin; i++) data[i] *= i / fin;
  for (let i = 0; i < fout; i++) data[data.length - 1 - i] *= i / fout;

  return data.buffer;
}