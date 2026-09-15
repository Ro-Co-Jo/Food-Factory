// src/workers/bgmWorker.js
// 方案D：钢琴主旋律 + 弦乐氛围（多把大提琴 + 弦乐组 + 竖琴 + 八音盒）

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
    C5: 523.25, D5: 587.33, E5: 659.25,
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

  /** 弦乐组：多把弦乐叠加，柔和氛围层 */
  function stringEnsemble(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    // 4 把弦乐轻微失谐，产生暖雾层
    const detunes = [1.0, 1.003, 0.997, 1.005];
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.45));
      const release = Math.min(1, (len - pos) / (sr * 0.4));
      const env = attack * release;
      let wave = 0;
      for (const d of detunes) {
        wave += Math.sin(2 * Math.PI * freq * d * t);
        wave += 0.18 * Math.sin(2 * Math.PI * freq * 2 * d * t);
        wave += 0.05 * Math.sin(2 * Math.PI * freq * 3 * d * t);
      }
      data[i] += wave * volume * env * 0.25;
    }
  }

  /** 大提琴：温暖低音（支持多把叠加） */
  function cello(startT, freq, dur, volume, detune = 1.0) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.25));
      const decay = Math.exp(-pos / (sr * 2.2));
      const release = Math.min(1, (len - pos) / (sr * 0.35));
      const f = freq * detune;
      const wave =
        Math.sin(2 * Math.PI * f * t) +
        0.28 * Math.sin(2 * Math.PI * f * 2 * t) +
        0.10 * Math.sin(2 * Math.PI * f * 3 * t) +
        0.03 * Math.sin(2 * Math.PI * f * 4 * t);
      data[i] += wave * volume * attack * decay * release;
    }
  }

  /** 多把大提琴叠加：低音厚实温暖 */
  function celloSection(startT, freq, dur, volume) {
    cello(startT, freq, dur, volume * 0.6, 1.0);
    cello(startT, freq, dur, volume * 0.5, 1.004);
    cello(startT, freq, dur, volume * 0.5, 0.996);
  }

  /** 竖琴：柔和点缀 */
  function harp(startT, freq, volume) {
    const dur = 1.2;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.005));
      const decay = Math.exp(-pos / (sr * 0.9));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.18 * Math.sin(2 * Math.PI * freq * 2 * t);
      data[i] += wave * volume * attack * decay;
    }
  }

  /** 八音盒：梦幻高音点缀 */
  function musicBox(startT, freq, volume) {
    const dur = 1.2;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.003));
      const decay = Math.exp(-pos / (sr * 0.6));
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.15 * Math.sin(2 * Math.PI * freq * 3 * t);
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

    // 2. 和声氛围：弦乐组（长音铺底）
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      for (const note of chords[b].notes) {
        stringEnsemble(barStart, note, barDuration * 0.95, 0.09);
      }
    }

    // 3. 低音：多把大提琴（每小节都在，第 1、3 小节更强）
    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      const vol = (b === 1) ? 0.08 : 0.14;  // 中间小节轻一点
      celloSection(barStart, chords[b].root, barDuration * 0.95, vol);
    }

    // 4. 竖琴点缀：每段第 2 小节弱拍
    harp(phraseStart + barDuration + 2 * beat, chords[1].notes[0], 0.055);

    // 5. 八音盒点缀：每段第 3 小节第 1 拍
    const boxNote = [F.C5, F.E5, F.G4, F.C5][p];
    musicBox(phraseStart + 2 * barDuration, boxNote, 0.055);
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