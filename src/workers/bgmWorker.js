// src/workers/bgmWorker.js
// 方案D改良版 v3：
// - 弦乐组音量 0.045，3 层失谐
// - 八音盒主双音音量 0.05 → 0.03
// - 新增八音盒辅助装饰：每小节第3拍 根→三→五 上行（音量 0.018）

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

  /** 钢琴：主旋律 */
  function piano(startT, freq, dur, volume, legato) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    let at = 0.015, vf = 1.0;
    if (legato === 'veryLegato') { at = 0.45; vf = 0.65; }
    else if (legato === true) { at = 0.25; vf = 0.75; }
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * at));
      const d1 = Math.exp(-pos / (sr * 1.8));
      const d2 = Math.exp(-pos / (sr * 0.8));
      const d3 = Math.exp(-pos / (sr * 0.25));
      const wave =
        d1 * Math.sin(2 * Math.PI * freq * t) +
        0.09 * d2 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.02 * d3 * Math.sin(2 * Math.PI * freq * 3 * t);
      const release = Math.min(1, (len - pos) / (sr * 0.3));
      data[i] += wave * volume * vf * attack * release;
    }
  }

  /** 弦乐组：重叠 + 长尾，柔和氛围层 */
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

  /** 大提琴：单把 */
  function cello(startT, freq, dur, volume, detune = 1.0) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.3));
      const decay = Math.exp(-pos / (sr * 2.2));
      const release = Math.min(1, (len - pos) / (sr * 0.8));
      const f = freq * detune;
      const wave =
        Math.sin(2 * Math.PI * f * t) +
        0.25 * Math.sin(2 * Math.PI * f * 2 * t) +
        0.08 * Math.sin(2 * Math.PI * f * 3 * t);
      data[i] += wave * volume * attack * decay * release;
    }
  }

  /** 3 把大提琴叠奏 */
  function celloSection(startT, freq, dur, volume) {
    cello(startT, freq, dur, volume * 0.4, 1.0);
    cello(startT, freq, dur, volume * 0.35, 1.004);
    cello(startT, freq, dur, volume * 0.35, 0.996);
  }

  /** 竖琴泛音：高八度，极轻 */
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

  /** 八音盒主双音摇铃（三度音程） */
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

  /** 八音盒单音装饰：更短、更轻，像远处的风铃 */
  function musicBoxNote(startT, freq, volume) {
    const dur = 0.9;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.003));
      const decay = Math.exp(-pos / (sr * 0.45));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.10 * Math.sin(2 * Math.PI * freq * 3 * t);
      data[i] += wave * volume * attack * decay;
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

  // ============ 合成 ============
  for (let p = 0; p < 4; p++) {
    const phraseStart = p * 3 * barDuration;
    const melody = phrases[p];
    const chords = phraseChords[p];

    // 1. 主旋律：钢琴
    for (const [startBeat, durBeats, freq, legato] of melody) {
      piano(phraseStart + startBeat * beat, freq, durBeats * beat * 0.98, 0.30, legato);
    }

    // 2. 和声氛围：弦乐组
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      for (const note of chords[b].notes) {
        stringEnsemble(barStart, note, barDuration * 0.95, 0.045);
      }
    }

    // 3. 低音：大提琴
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const vol = (b === 1) ? 0.06 : 0.11;
      celloSection(barStart, chords[b].root, barDuration * 0.95, vol);
    }

    // 4. 竖琴泛音：高八度闪烁
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const c = chords[b];
      harpHarmonic(barStart + 1.5 * beat, c.notes[0] * 2, 0.045);
      harpHarmonic(barStart + 3.5 * beat, c.notes[2] * 2, 0.04);
    }

    // 5. 八音盒主双音摇铃：每段第 3 小节第 1 拍（音量 0.03）
    const boxPairs = [
      [F.C6, F.E6],  // A：大三度
      [F.B5, F.D6],  // B：小三度
      [F.E6, F.G6],  // C：小三度
      [F.C6, F.E6],  // D：大三度
    ];
    const [b1, b2] = boxPairs[p];
    musicBoxDuo(phraseStart + 2 * barDuration, b1, b2, 0.03);

    // 6. 八音盒辅助装饰：每小节第 3 拍轻点一下
    //    第 1 小节 → 根音高八度
    //    第 2 小节 → 三音高八度
    //    第 3 小节 → 五音高八度
    //    形成 根 → 三 → 五 的上行漂浮线条
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const c = chords[b];
      musicBoxNote(barStart + 2 * beat, c.notes[b] * 2, 0.018);
    }
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