// src/workers/bgmWorker.js
// 方案D改良版 v38：
// - 第二把吉他改为下三度 + 延迟 30ms + 独立音色
// - 星光换成钟琴（单音，无颤音无拍频）
// - 第二段新增沙锤

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

  const FIRST_START  = 0;
  const INTERLUDE    = 30;
  const SECOND_START = 37.5;
  const OUTRO_START  = 67.5;
  const TOTAL        = 75;

  const length = Math.floor(sr * TOTAL);
  const data = new Float32Array(length);

  const F = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
    B3: 246.94,
    G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
    B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
  };

  // ==================== 音色 ====================

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

  /** 第一把吉他（主）：指弹音色 */
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

  /**
   * 第二把吉他（和声）：音色比第一把更干净，起音稍慢，
   * 放在第一把的三度/六度位置。
   */
  function guitarHarmony(startT, freq, dur, volume) {
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    const len = s1 - s0;
    if (len <= 0) return;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const pos = i - s0;
      // 起音稍慢（25ms），与第一把区分
      const attack = Math.min(1, pos / (sr * 0.025));
      const decay = Math.exp(-pos / (sr * 1.6));
      const release = Math.min(1, (len - pos) / (sr * 0.5));
      const env = attack * decay * release;

      // 更干净：少一点谐波，去掉琴箱共鸣
      const wave =
        Math.sin(2 * Math.PI * freq * t) +
        0.05 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.015 * Math.sin(2 * Math.PI * freq * 3 * t);

      data[i] += wave * volume * env;
    }
  }

  /**
   * 双吉他分解和弦：
   * - 第一把：和弦内音（主）
   * - 第二把：第一把每个音的下三度（即六度和声）+ 延迟 30ms
   */
  function guitarArpeggio(startTime, notes, volume) {
    const pattern = [0, 1, 2, 3, 2, 1, 0, 1];
    // 下三度 = ×0.8409（六度和声的转位）
    const harmonizedNotes = notes.map(n => n * 0.8409);
    for (let i = 0; i < 8; i++) {
      const t = startTime + i * 0.5 * beat;
      const idx = pattern[i];
      // 第一把吉他（主）
      guitar(t, notes[idx], 0.5 * beat * 0.98, volume);
      // 第二把吉他（和声，延迟 30ms，音量稍低）
      guitarHarmony(t + 0.03, harmonizedNotes[idx], 0.5 * beat * 0.98, volume * 0.6);
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

  /**
   * 钟琴：单音（无颤音、无拍频）
   * - attack 3ms
   * - decay 0.85s
   * - 谐波：1 + 4次(0.12) + 9.2次(0.04)
   */
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

  /**
   * 沙锤：短促的白噪声 + 高通，模拟沙沙声
   */
  function shaker(startT, volume) {
    const dur = 0.1;
    const s0 = Math.floor(startT * sr);
    const s1 = Math.floor((startT + dur) * sr);
    let lp = 0;
    for (let i = s0; i < s1; i++) {
      const pos = i - s0;
      const attack = Math.min(1, pos / (sr * 0.002));
      const decay = Math.exp(-pos / (sr * 0.025));
      const noise = Math.random() * 2 - 1;
      lp += 0.6 * (noise - lp);
      const hp = noise - lp;
      data[i] += hp * volume * attack * decay;
    }
  }

  function getGlobalFade(t) {
    if (t < 5) return 0;
    else if (t < 7.5) return ((t - 5) / 2.5) * 0.08;
    else if (t < 15) return 0.08 + ((t - 7.5) / 7.5) * 0.20;
    else if (t < 22.5) return 0.28 - ((t - 15) / 7.5) * 0.065;
    else if (t < 30) return 0.215 - ((t - 22.5) / 7.5) * 0.005;
    else if (t < 37.5) return 0.21 + ((t - 30) / 7.5) * 0.07;
    else if (t < 60) return 0.28 + ((t - 37.5) / 22.5) * 0.07;
    else if (t < 67.5) return 0.35 - ((t - 60) / 7.5) * 0.07;
    else if (t < 72) return 0.28 - ((t - 67.5) / 4.5) * 0.20;
    else return Math.max(0, 0.08 * (TOTAL - t) / 3);
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
      const globalFade = getGlobalFade(t);
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
      const pos = i - s0;
      const globalFade = getGlobalFade(t);

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

  const boxPairs = [
    [F.C6, F.E6, 0.020],
    [F.B5, F.D6, 0.020],
    [F.E6, F.G6, 0.010],
    [F.C6, F.E6, 0.020],
  ];

  oceanWave(0, TOTAL, 0.20);
  breeze(0, TOTAL, 0.30);

  // ==================== 前 5 秒钟琴（单音点缀）====================
  glockenspiel(0.6, F.C6, 0.018);
  glockenspiel(1.4, F.G5, 0.016);
  glockenspiel(2.3, F.E6, 0.017);
  glockenspiel(3.1, F.C6, 0.015);
  glockenspiel(3.9, F.B5, 0.016);
  glockenspiel(4.6, F.G6, 0.014);

  function renderPhrase(startTime, phraseIndex, config) {
    const melody = phrases[phraseIndex];
    const chords = phraseChords[phraseIndex];

    for (const [startBeat, durBeats, freq, legato] of melody) {
      piano(startTime + startBeat * beat, freq, durBeats * beat * 0.98, 0.30, legato);
    }

    if (config.guitar) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        guitarArpeggio(barStart, chords[b].notes, config.guitarVolume || 0.19);
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

    if (config.harp) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        const c = chords[b];
        harpHarmonic(barStart + 1.5 * beat, c.notes[0], 0.022);
        harpHarmonic(barStart + 3.5 * beat, c.notes[2], 0.018);
      }
    }

    if (config.musicBox) {
      const [b1, b2, boxVol] = boxPairs[phraseIndex];
      musicBoxDuo(startTime + 2 * barDuration, b1, b2, boxVol);
    }

    // 沙锤：每小节八分音符，强弱交替
    if (config.shaker) {
      for (let b = 0; b < 3; b++) {
        const barStart = startTime + b * barDuration;
        for (let i = 0; i < 8; i++) {
          const t = barStart + i * 0.5 * beat;
          const vol = (i % 2 === 0) ? 0.032 : 0.020;
          shaker(t, vol);
        }
      }
    }
  }

  // ==================== 第一遍（0 - 30s）====================
  renderPhrase(FIRST_START + 0 * phraseDuration, 0, { musicBox: true });
  renderPhrase(FIRST_START + 1 * phraseDuration, 1, { musicBox: true });
  renderPhrase(FIRST_START + 2 * phraseDuration, 2, {
    musicBox: true, strings: true, cello: true,
  });
  renderPhrase(FIRST_START + 3 * phraseDuration, 3, {
    musicBox: true, strings: true, cello: true,
  });

  // ==================== 间奏（30 - 37.5s）====================
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
  }

  // ==================== 第二遍（37.5 - 67.5s）====================
  renderPhrase(SECOND_START + 0 * phraseDuration, 0, {
    guitar: true, guitarVolume: 0.19,
    musicBox: true, strings: true, cello: true,
    shaker: true,
  });
  renderPhrase(SECOND_START + 1 * phraseDuration, 1, {
    guitar: true, guitarVolume: 0.19,
    musicBox: true, strings: true, cello: true,
    shaker: true,
  });
  renderPhrase(SECOND_START + 2 * phraseDuration, 2, {
    guitar: true, guitarVolume: 0.20,
    musicBox: true, strings: true, cello: true, harp: true,
    shaker: true,
  });
  renderPhrase(SECOND_START + 3 * phraseDuration, 3, {
    guitar: true, guitarVolume: 0.19,
    musicBox: true, strings: true, cello: true, harp: true,
    shaker: true,
  });

  // ==================== 尾奏（67.5 - 75s）====================
  {
    const startTime = OUTRO_START;

    piano(startTime + 0 * beat, F.C5, 1.2 * beat, 0.26, false);
    piano(startTime + 1 * beat, F.G4, 1.2 * beat, 0.25, false);
    piano(startTime + 2 * beat, F.E4, 1.2 * beat, 0.24, false);
    piano(startTime + 3 * beat, F.G4, 1.2 * beat, 0.23, false);
    piano(startTime + 4 * beat, F.E4, 1.2 * beat, 0.22, false);
    piano(startTime + 5 * beat, F.G3, 1.2 * beat, 0.21, false);
    piano(startTime + 6 * beat, F.C4, 8 * beat, 0.20, 'veryLegato');

    guitar(startTime + 1 * beat, F.G4, 2 * beat, 0.10);
    guitar(startTime + 3 * beat, F.C4, 2 * beat, 0.09);
    guitar(startTime + 5 * beat, F.E3, 3 * beat, 0.08);
  }

  // ==================== 尾部钟琴（呼应开头）====================
  glockenspiel(68.2, F.C6, 0.014);
  glockenspiel(69.0, F.G5, 0.013);
  glockenspiel(69.8, F.E6, 0.012);
  glockenspiel(70.6, F.B5, 0.012);
  glockenspiel(71.4, F.G6, 0.011);
  glockenspiel(72.2, F.C6, 0.010);

  // ==================== 归一化 ====================
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
  const fout = Math.floor(sr * 0.4);
  for (let i = 0; i < fin; i++) data[i] *= i / fin;
  for (let i = 0; i < fout; i++) data[data.length - 1 - i] *= i / fout;

  return data.buffer;
}