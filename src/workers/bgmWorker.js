// src/workers/bgmWorker.js
// 方案D改良版 v11：
// - 海浪声完全重做：事件驱动 + 动态低通
// - 每个浪独立随机：时长 / 峰值 / 上升比 / 间隔
// - 大结构 A→B→C→D 渐强回落
// - 海浪音量 1.0

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
   * 海浪声（事件驱动版）：
   * - 每个浪是独立事件：随机时长 2.5-4.5s / 峰值 0.5-1.0 / 上升比 20%-40%
   * - 浪与浪之间有 0.4-1.4s 的随机间隔
   * - 音色：动态低通 —— 浪尖截止频率高（宽带泡沫），浪谷截止频率低（低频隆隆）
   * - 大结构：A 小引入 → B 渐强 → C 继续 → D 峰值后回落
   */
  function oceanWave(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;

    // 两级低通状态
    let lp1 = 0, lp2 = 0;

    // 当前浪事件
    let waveState = {
      active: false,
      elapsed: 0,
      duration: 0,
      peak: 0,
      riseRatio: 0,
    };
    let nextWaveIn = 0.6;  // 第一个浪 0.6 秒后开始

    const sectionLen = dur / 4;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;

      // ===== 大结构包络（A→B→C→D）=====
      const sectionIndex = Math.min(3, Math.floor(t / sectionLen));
      const sectionPos = (t % sectionLen) / sectionLen;
      let bigEnv;
      if (sectionIndex === 0) {
        bigEnv = 0.40 + 0.15 * sectionPos;
      } else if (sectionIndex === 1) {
        bigEnv = 0.55 + 0.20 * sectionPos;
      } else if (sectionIndex === 2) {
        bigEnv = 0.75 + 0.20 * sectionPos;
      } else {
        if (sectionPos < 0.65) {
          bigEnv = 0.95 + 0.05 * (sectionPos / 0.65);
        } else {
          bigEnv = 1.0 - 0.60 * ((sectionPos - 0.65) / 0.35);
        }
      }

      // ===== 浪事件管理 =====
      if (!waveState.active) {
        nextWaveIn -= 1 / sr;
        if (nextWaveIn <= 0) {
          waveState.active = true;
          waveState.elapsed = 0;
          waveState.duration = 2.5 + Math.random() * 2.0;     // 2.5-4.5s
          waveState.peak = 0.5 + Math.random() * 0.5;         // 0.5-1.0
          waveState.riseRatio = 0.20 + Math.random() * 0.20;  // 20%-40%
        }
      } else {
        waveState.elapsed += 1 / sr;
        if (waveState.elapsed >= waveState.duration) {
          waveState.active = false;
          nextWaveIn = 0.4 + Math.random() * 1.0;  // 0.4-1.4s 间隔
        }
      }

      // ===== 当前浪强度（不对称：涌上来快，退下去慢）=====
      let surge = 0;
      if (waveState.active) {
        const p = waveState.elapsed / waveState.duration;
        if (p < waveState.riseRatio) {
          const r = p / waveState.riseRatio;
          surge = Math.pow(r, 1.5) * waveState.peak;
        } else {
          const r = (p - waveState.riseRatio) / (1 - waveState.riseRatio);
          surge = Math.pow(1 - r, 1.4) * waveState.peak;
        }
      }

      // ===== 动态低通（音色核心）=====
      // 浪谷：alpha 小 → 截止频率低 → 只有低频"隆隆"
      // 浪尖：alpha 大 → 截止频率高 → 有"哗哗"的宽带
      const alpha = 0.025 + 0.14 * surge;
      const noise = Math.random() * 2 - 1;
      lp1 += alpha * (noise - lp1);
      lp2 += alpha * (lp1 - lp2);
      const hp = noise - lp2;  // 高通成分

      // 主体：二阶低通；浪尖时叠加高通泡沫
      const sample = lp2 + hp * surge * 0.25;

      // 综合包络：大结构 × (0.25 底 + 0.75 浪涌)
      const env = bigEnv * (0.25 + 0.75 * surge);

      // 首尾短淡入淡出
      const fadeIn = Math.min(1, pos / (sr * 0.4));
      const fadeOut = Math.min(1, (len - pos) / (sr * 0.4));

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

  // ============ 铺海浪声（音量 1.0）============
  oceanWave(0, totalDuration, 1.0);

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

    // 3. 大提琴
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const vol = (b === 1) ? 0.26 : 0.45;
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