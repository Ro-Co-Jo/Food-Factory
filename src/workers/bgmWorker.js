// src/workers/bgmWorker.js
// 花狼の探店挑战 BGM
// 长音前用 slur 连奏，避免同音重复敲击

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
    C5: 523.25, D5: 587.33,
  };

  /**
   * 钢琴音
   * @param {boolean} legato 是否用连奏（slur）——attack 变慢，音量略低，衔接前一个音
   */
  function piano(startT, freq, dur, volume, legato = false) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    // 普通 attack：15ms（有敲击感）
    // Legato attack：250ms（平滑滑入）
    const attackTime = legato ? 0.25 : 0.015;
    const volFactor = legato ? 0.75 : 1.0;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * attackTime));
      const d1 = Math.exp(-pos / (sr * 1.8));
      const d2 = Math.exp(-pos / (sr * 0.8));
      const d3 = Math.exp(-pos / (sr * 0.25));
      const wave =
        d1 * Math.sin(2 * Math.PI * freq * t) +
        0.09 * d2 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.02 * d3 * Math.sin(2 * Math.PI * freq * 3 * t);
      const release = Math.min(1, (len - pos) / (sr * 0.3));
      data[i] += wave * volume * volFactor * attack * release;
    }
  }

  function bass(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.08));
      const decay = Math.exp(-pos / (sr * 2.5));
      const release = Math.min(1, (len - pos) / (sr * 0.3));
      const env = attack * decay * release;
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.08 * Math.sin(2 * Math.PI * freq * 2 * t);
      data[i] += wave * volume * env;
    }
  }

  // ============ 四段旋律 ============
  // 每条：[起始拍, 时值(拍), 频率, 是否 legato]
  const phrases = [
    // A：C4 E4 G4 F4 A4 G4 · D4 E4(普通) E4(长,legato)
    [
      [0, 1, F.C4, false], [1, 1, F.E4, false], [2, 1, F.G4, false], [3, 1, F.F4, false],
      [4, 1, F.A4, false], [5, 1, F.G4, false],
      [6.5, 0.5, F.D4, false],
      [7, 1, F.E4, false],
      [8, 3, F.E4, true],   // ← 长音 legato
    ],
    // B：C4 E4 G4 F4 A4 G4 · B4(0.5) C5(0.5) C5(slur,2) E4(2)
// B：C4 E4 G4 F4 A4 G4 · B4(0.5) C5(0.5) C5(slur,1.5) E4(9拍起,长3拍)
// B：C4 E4 G4 F4 A4 G4 · B4(0.5) C5(0.5) E4(1.5) E4(slur,3)
    [
      [0, 1, F.C4, false], [1, 1, F.E4, false], [2, 1, F.G4, false], [3, 1, F.F4, false],
      [4, 1, F.A4, false], [5, 1, F.G4, false],
      [6.5, 0.5, F.B4, false],
      [7, 0.5, F.C5, false],
      [7.5, 1.5, F.E4, false],
      [9, 3, F.E4, true],
    ],
    // C：E4 F4 G4 A4 C5 B4 · D5(0.5) G4(1) F4 G4 F4 E4(半拍) G4(长,legato)
    [
      [0, 1, F.E4, false], [1, 1, F.F4, false], [2, 1, F.G4, false], [3, 1, F.A4, false],
      [4, 1, F.C5, false], [5, 1, F.B4, false],
      [6.5, 0.5, F.D5, false],
      [7, 1, F.G4, false],
      [8, 0.5, F.F4, false], [8.5, 0.5, F.G4, false], [9, 0.5, F.F4, false], [9.5, 0.5, F.E4, false],
      [10, 2, F.G4, false],  // ← C段 G4 前面没有相同音，不需要 legato
    ],
    // D：C4 E4 G4 F4 E4 D4 · E4(0.5) C4(0.5) B3(0.5) C4(0.5) C4(长,legato)
    [
      [0, 1, F.C4, false], [1, 1, F.E4, false], [2, 1, F.G4, false], [3, 1, F.F4, false],
      [4, 1, F.E4, false], [5, 1, F.D4, false],
      [6.5, 0.5, F.E4, false], [7, 0.5, F.C4, false],
      [7.5, 0.5, F.B3, false],
      [8, 0.5, F.C4, false],
      [8.5, 2.5, F.C4, true],  // ← 长音 legato
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

    for (const [startBeat, durBeats, freq, legato] of melody) {
      piano(phraseStart + startBeat * beat, freq, durBeats * beat * 0.98, 0.30, legato);
    }

    for (let b = 0; b < 3; b++) {
      if (b === 1) continue;
      const barStart = phraseStart + b * barDuration;
      bass(barStart, chords[b].root, barDuration * 0.95, 0.13);
    }

    for (let b = 0; b < 3; b++) {
      const barStart = phraseStart + b * barDuration;
      for (const note of chords[b].notes) {
        piano(barStart, note, barDuration * 0.9, 0.05);
      }
    }
  }

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