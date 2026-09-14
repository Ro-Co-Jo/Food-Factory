// src/workers/bgmWorker.js
// 花狼の探店挑战 BGM

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
    G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33,
  };

  function piano(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.015));
      const d1 = Math.exp(-pos / (sr * 1.8));
      const d2 = Math.exp(-pos / (sr * 0.8));
      const d3 = Math.exp(-pos / (sr * 0.25));
      const wave =
        d1 * Math.sin(2 * Math.PI * freq * t) +
        0.09 * d2 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.02 * d3 * Math.sin(2 * Math.PI * freq * 3 * t);
      const release = Math.min(1, (len - pos) / (sr * 0.3));
      data[i] += wave * volume * attack * release;
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

  // 节奏型
  const beatOffsets = [0, 1, 2, 3, 4, 5, 6.5, 7, 8];
  const durations   = [1, 1, 1, 1, 1, 1, 0.5, 1, 3];

  const phrases = [
    [F.C4, F.E4, F.G4, F.F4, F.A4, F.G4, F.D4, F.E4, F.E4],
    [F.C4, F.E4, F.G4, F.F4, F.A4, F.G4, F.B4, F.C5, F.C5],
    [F.E4, F.F4, F.G4, F.A4, F.C5, F.B4, F.D5, F.G4, F.G4],
    [F.C4, F.E4, F.G4, F.F4, F.E4, F.D4, F.E4, F.C4, F.C4],
  ];

  const phraseChords = [
    [
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
      { root: F.G3, notes: [F.G3, F.B3, F.D4] },
    ],
    [
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
      { root: 174.61, notes: [174.61, F.A3, F.C4] },
      { root: F.G3, notes: [F.G3, F.B3, F.D4] },
    ],
    [
      { root: F.A3, notes: [F.A3, F.C4, F.E4] },
      { root: F.A3, notes: [F.A3, F.C4, F.E4] },
      { root: F.G3, notes: [F.G3, F.B3, F.D4] },
    ],
    [
      { root: 174.61, notes: [174.61, F.A3, F.C4] },
      { root: F.G3, notes: [F.G3, F.B3, F.D4] },
      { root: 130.81, notes: [F.C4, F.E4, F.G4] },
    ],
  ];

  for (let p = 0; p < 4; p++) {
    const phraseStart = p * 3 * barDuration;
    const melody = phrases[p];
    const chords = phraseChords[p];

    for (let i = 0; i < 9; i++) {
      const startBeat = beatOffsets[i];
      const dur = durations[i];
      piano(phraseStart + startBeat * beat, melody[i], dur * beat * 0.98, 0.30);
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