// src/workers/bgmWorker.js
// 方案D改良版 v10：
// - 海浪声重新设计：中频水声 + 不规则起伏 + 大结构渐强
// - 海浪音量 2.0 → 1.2
// - 海浪大结构：A小引入 → B渐强 → C继续 → D峰值后回落
// - 钢琴、大提琴、八音盒保持 v9 设定

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
   * 海浪声（重新设计）：
   * - 音色：两级低通差分 → 中频水声，切掉过多低频（避免沙漠感）
   * - 大结构包络：A小引入 → B渐强 → C继续 → D峰值后回落到A开头
   * - 段内小浪：3 个不同频率正弦叠加，且每段频率不同 → 不规则起伏
   */
  function oceanWave(startT, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;

    // 三层滤波：低频（用于减法）、中频（主体）、高频（泡沫）
    let lp1 = 0, lp2 = 0, lp3 = 0;
    const a1 = 0.012;   // 低频
    const a2 = 0.08;    // 中频
    const a3 = 0.28;    // 高频泡沫

    const sectionLen = dur / 4;  // 每段 7.5 秒
    const songLen = dur;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const noise = Math.random() * 2 - 1;

      lp1 += a1 * (noise - lp1);
      lp2 += a2 * (noise - lp2);
      lp3 += a3 * (noise - lp3);

      // 中频水声主体：中频减去部分低频（去掉隆隆感）
      const waterBody = lp2 - lp1 * 0.7;
      // 高频泡沫：高频减去中频的差分
      const foam = lp3 - lp2;

      // ===== 大结构包络（30秒，跟随 A→B→C→D）=====
      const sectionIndex = Math.floor(t / sectionLen);  // 0,1,2,3
      const sectionPos = (t % sectionLen) / sectionLen;  // 0→1

      let sectionEnv;
      if (sectionIndex === 0) {
        // A 段：0.30 → 0.45（小引入）
        sectionEnv = 0.30 + 0.15 * sectionPos;
      } else if (sectionIndex === 1) {
        // B 段：0.45 → 0.65（渐强）
        sectionEnv = 0.45 + 0.20 * sectionPos;
      } else if (sectionIndex === 2) {
        // C 段：0.65 → 0.85（继续强）
        sectionEnv = 0.65 + 0.20 * sectionPos;
      } else {
        // D 段：0.85 → 1.0（前 60%）→ 回落到 0.30（后 40%）
        if (sectionPos < 0.6) {
          sectionEnv = 0.85 + 0.15 * (sectionPos / 0.6);
        } else {
          const p = (sectionPos - 0.6) / 0.4;
          sectionEnv = 1.0 - 0.70 * p;  // 1.0 → 0.30
        }
      }

      // ===== 段内不规则小浪 =====
      // 每段的浪频略有不同，让四段听起来不一样
      const f1 = 0.15 + sectionIndex * 0.025;
      const f2 = 0.23 + sectionIndex * 0.035;
      const f3 = 0.37 + sectionIndex * 0.030;
      const w1 = Math.sin(2 * Math.PI * f1 * t);
      const w2 = Math.sin(2 * Math.PI * f2 * t + 1.2);
      const w3 = Math.sin(2 * Math.PI * f3 * t + 2.7);

      // 不规则混合（不完全平均，有主次）
      let surgeRaw = 0.5 + 0.28 * w1 + 0.15 * w2 + 0.08 * w3;
      surgeRaw = Math.max(0, Math.min(1, surgeRaw));

      // 不对称整形：涌上来快，退下去慢
      const surge = Math.pow(surgeRaw, 1.4);

      // 小浪包络（0.35 底 + 0.65 浪涌）
      const innerEnv = 0.35 + 0.65 * surge;

      // 综合包络
      const totalEnv = sectionEnv * innerEnv;

      // 浪尖泡沫增加
      const foamBoost = 1.0 + 0.7 * surge;
      const wave = waterBody + foam * 0.4 * foamBoost;

      // 首尾极短淡入淡出（仅 100ms，不影响循环）
      const fadeIn = Math.min(1, pos / (sr * 0.1));
      const fadeOut = Math.min(1, (len - pos) / (sr * 0.1));

      data[i] += wave * totalEnv * fadeIn * fadeOut * volume;
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

  // ============ 铺海浪声（音量 1.2）============
  oceanWave(0, totalDuration, 1.2);

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