// src/composables/useBGM.js
import { ref } from 'vue';

export function useBGM() {
  const isPlaying = ref(false);
  let audioCtx = null;
  let source = null;

  function start() {
    if (isPlaying.value) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const sr = audioCtx.sampleRate;
      const bpm = 112;
      const beat = 60 / bpm;
      const eighth = beat / 2;
      const sixteenth = beat / 4;
      const barDuration = 4 * beat;
      const barsPerSection = 4;

      const sectionTypes = ['A', 'A', 'B', 'C', 'D', 'B', 'C', 'D', 'B', 'C', 'D', 'B', 'C', 'D'];
      const sectionsCount = sectionTypes.length;
      const totalBars = sectionsCount * barsPerSection;
      const totalDuration = totalBars * barDuration;

      const buffer = audioCtx.createBuffer(1, sr * totalDuration, sr);
      const data = buffer.getChannelData(0);

      const F = {
        C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
        C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91,
        G6: 1567.98, A6: 1760.00, C7: 2093.00,
      };

      // ============ 旋律 A ============
      const melodyA = [
        [F.E5, eighth], [F.G5, eighth], [F.C6, eighth], [F.G5, eighth],
        [F.E5, eighth], [F.D5, eighth], [F.C5, eighth], [F.E5, eighth],

        [F.D5, eighth], [F.G5, eighth], [F.B5, eighth], [F.G5, eighth],
        [F.D5, eighth], [F.C5, eighth], [F.B4, eighth], [F.D5, eighth],

        [F.C5, eighth], [F.E5, eighth], [F.A5, eighth], [F.E5, eighth],
        [F.C5, eighth], [F.B4, eighth], [F.A4, eighth], [F.C5, eighth],

        [F.F5, eighth], [F.A5, eighth], [F.C6, eighth], [F.A5, eighth],
        [F.F5, eighth], [F.E5, eighth], [F.D5, eighth], [F.C5, eighth],
      ];

      // ============ 旋律 B ============
      const melodyB = [
        [F.E5, eighth], [F.G5, eighth], [F.C6, eighth], [F.E6, eighth],
        [F.D6, eighth], [F.C6, eighth], [F.B5, eighth], [F.G5, eighth],

        [F.D5, eighth], [F.B4, eighth], [F.D5, eighth], [F.G5, eighth],
        [F.A5, eighth], [F.G5, eighth], [F.D5, eighth], [F.B4, eighth],

        [F.C5, eighth], [F.F5, eighth], [F.A5, eighth], [F.C6, eighth],
        [F.B5, eighth], [F.A5, eighth], [F.G5, eighth], [F.F5, eighth],

        [F.G5, eighth], [F.B5, eighth], [F.D6, eighth], [F.B5, eighth],
        [F.G5, eighth], [F.E5, eighth], [F.D5, eighth], [F.C5, eighth],
      ];

      const chordProgression = [
        { bass: F.C3, chord: [F.C4, F.E4, F.G4], harp: [F.C5, F.E5, F.G5, F.C6] },
        { bass: F.G3, chord: [F.G3, F.B3, F.D4], harp: [F.G4, F.B4, F.D5, F.G5] },
        { bass: F.A3, chord: [F.A3, F.C4, F.E4], harp: [F.A4, F.C5, F.E5, F.A5] },
        { bass: F.F3, chord: [F.F3, F.A3, F.C4], harp: [F.F4, F.A4, F.C5, F.F5] },
      ];

      const arpeggioPatterns = [
        [F.C5, F.E5, F.G5, F.E5],
        [F.D5, F.G5, F.B5, F.G5],
        [F.A4, F.C5, F.E5, F.C5],
        [F.C5, F.F5, F.A5, F.F5],
      ];

      // ============ 合成函数 ============

      /** 主旋律：温暖三角波音色，模拟柔和木管/电钢低音区 */
      function addLead(freq, startT, dur, volume = 0.10) {
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        const len = s1 - s0;
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          // 慢起音，柔和
          const attack = Math.min(1, pos / (sr * 0.06));
          const release = Math.min(1, (len - pos) / (sr * 0.18));
          const env = attack * release;
          // 三角波近似：sin(x) - (1/9)sin(3x) + (1/25)sin(5x)
          const angle = 2 * Math.PI * freq * localT;
          const wave =
            Math.sin(angle) -
            (1 / 9) * Math.sin(3 * angle) +
            (1 / 25) * Math.sin(5 * angle);
          data[i] += wave * volume * env;
        }
      }

      /** 小提琴：柔和弦乐，无颤音，缓慢起音 */
      function addViolin(freq, startT, dur, volume = 0.13) {
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        const len = s1 - s0;
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.08));
          const release = Math.min(1, (len - pos) / (sr * 0.15));
          const env = attack * release;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.40 * Math.sin(2 * Math.PI * freq * 2 * localT) +
            0.18 * Math.sin(2 * Math.PI * freq * 3 * localT) +
            0.06 * Math.sin(2 * Math.PI * freq * 4 * localT);
          data[i] += wave * volume * env;
        }
      }

      /** 大提琴 */
      function addCello(startT, freq, dur, volume = 0.13) {
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.15));
          const release = Math.min(1, (s1 - s0 - pos) / (sr * 0.3));
          const env = attack * release;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.30 * Math.sin(2 * Math.PI * freq * 2 * localT) +
            0.10 * Math.sin(2 * Math.PI * freq * 3 * localT);
          data[i] += wave * volume * env;
        }
      }

      /** 低音提琴 */
      function addDoubleBass(startT, freq, dur, volume = 0.07) {
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.2));
          const release = Math.min(1, (s1 - s0 - pos) / (sr * 0.4));
          const env = attack * release;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.25 * Math.sin(2 * Math.PI * freq * 2 * localT);
          data[i] += wave * volume * env;
        }
      }

      /** 钢琴 */
      function addPiano(startT, freq, dur = 1.2, volume = 0.08) {
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.008));
          const decay = Math.exp(-pos / (sr * 0.5));
          const env = attack * decay;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.25 * Math.sin(2 * Math.PI * freq * 2 * localT) +
            0.06 * Math.sin(2 * Math.PI * freq * 3 * localT);
          data[i] += wave * volume * env;
        }
      }

      /** 尼龙弦吉他 */
      function addGuitar(startT, freq, volume = 0.07) {
        const dur = 1.4;
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.003));
          const decay = Math.exp(-pos / (sr * 0.7));
          const env = attack * decay;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.45 * Math.sin(2 * Math.PI * freq * 2 * localT) +
            0.20 * Math.sin(2 * Math.PI * freq * 3 * localT) +
            0.06 * Math.sin(2 * Math.PI * freq * 4 * localT);
          data[i] += wave * volume * env;
        }
      }

      /** 竖琴 */
      function addHarp(startT, freq, volume = 0.12) {
        const dur = 1.5;
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.005));
          const decay = Math.exp(-pos / (sr * 0.6));
          const env = attack * decay;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.28 * Math.sin(2 * Math.PI * freq * 2 * localT);
          data[i] += wave * volume * env;
        }
      }

      /** 钟琴：柔和金属音 */
      function addVibraphone(startT, freq, dur, volume = 0.045) {
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const attack = Math.min(1, pos / (sr * 0.01));
          const decay = Math.exp(-pos / (sr * 0.6));
          const env = attack * decay;
          const wave =
            Math.sin(2 * Math.PI * freq * localT) +
            0.20 * Math.sin(2 * Math.PI * freq * 2 * localT) +
            0.08 * Math.sin(2 * Math.PI * freq * 4 * localT);
          data[i] += wave * volume * env;
        }
      }

      function addTimpani(startT, volume = 0.30) {
        const dur = 0.6;
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const env = Math.exp(-pos / (sr * 0.18));
          const freq = 55 + 35 * Math.exp(-localT * 12);
          data[i] += Math.sin(2 * Math.PI * freq * localT) * volume * env;
        }
      }

      function addBassDrum(startT, volume = 0.26) {
        const dur = 0.35;
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const localT = (i - s0) / sr;
          const pos = i - s0;
          const env = Math.exp(-pos / (sr * 0.08));
          const freq = 40 + 50 * Math.exp(-localT * 25);
          data[i] += Math.sin(2 * Math.PI * freq * localT) * volume * env;
        }
      }

      function addShaker(startT, volume = 0.018) {
        const dur = 0.08;
        const s0 = Math.floor(startT * sr);
        const s1 = Math.floor((startT + dur) * sr);
        for (let i = s0; i < s1; i++) {
          const pos = i - s0;
          const env = Math.exp(-pos / (sr * 0.02));
          const softNoise =
            (Math.random() * 2 - 1) *
            (0.6 + 0.4 * Math.sin(2 * Math.PI * 200 * pos / sr));
          data[i] += softNoise * volume * env;
        }
      }

      // ============ 逐段合成 ============
      for (let s = 0; s < sectionsCount; s++) {
        const type = sectionTypes[s];
        const sectionStart = s * barsPerSection * barDuration;
        const isA = type === 'A';
        const isB = type === 'B';
        const isC = type === 'C';
        const isD = type === 'D';

        // 1. 主旋律（降八度）+ 小提琴（原八度）
        const melody = (isA || isC) ? melodyA : melodyB;
        const melodyVol = (isB || isD) ? 0.075 : 0.10;
        let t = sectionStart;
        for (const [freq, dur] of melody) {
          // 主旋律降八度演奏，避免高频刺耳
          addLead(freq / 2, t, dur * 0.95, melodyVol);
          // 小提琴保持原八度，形成层次
          addViolin(freq, t, dur * 0.95, 0.13);
          t += dur;
        }

        // 2. 低音层：A 段减弱
        for (let bar = 0; bar < barsPerSection; bar++) {
          const barT = sectionStart + bar * barDuration;
          const cp = chordProgression[bar % 4];
          const celloVol = isA ? 0.08 : 0.13;
          const dbVol = isA ? 0.04 : 0.07;
          addCello(barT, cp.bass, barDuration * 0.95, celloVol);
          addDoubleBass(barT, cp.bass / 2, barDuration * 0.95, dbVol);
        }

        // 3. 和弦铺底：钢琴
        for (let bar = 0; bar < barsPerSection; bar++) {
          const barT = sectionStart + bar * barDuration;
          const cp = chordProgression[bar % 4];
          for (const f of cp.chord) {
            addPiano(barT, f, barDuration * 0.6, 0.055);
          }
        }

        // 4. 琶音：尼龙弦吉他
        for (let bar = 0; bar < barsPerSection; bar++) {
          const barT = sectionStart + bar * barDuration;
          const pattern = arpeggioPatterns[bar % 4];
          for (let i = 0; i < 8; i++) {
            addGuitar(barT + i * (barDuration / 8), pattern[i % 4] * 0.5, 0.055);
          }
        }

        // 5. B 和 D：古典鼓点
        if (isB || isD) {
          for (let bar = 0; bar < barsPerSection; bar++) {
            const barT = sectionStart + bar * barDuration;
            addTimpani(barT, 0.30);
            addBassDrum(barT + 2 * beat, 0.26);
            for (let i = 0; i < 4; i++) {
              addShaker(barT + i * beat, 0.018);
              addShaker(barT + i * beat + eighth, 0.012);
            }
          }
        }

        // 6. C 和 D：钢琴 + 竖琴 + 钟琴 + 吉他
        if (isC || isD) {
          for (let bar = 0; bar < barsPerSection; bar++) {
            const barT = sectionStart + bar * barDuration;
            const cp = chordProgression[bar % 4];

            addPiano(barT, F.E5, 1.2, 0.08);
            addPiano(barT + 2 * beat, F.C5, 1.2, 0.07);

            for (let i = 0; i < 8; i++) {
              addHarp(barT + i * (barDuration / 8), cp.harp[i % 4], 0.12);
            }

            for (let i = 0; i < 4; i++) {
              addGuitar(barT + i * beat, cp.harp[i % 4] * 0.5, 0.05);
            }

            if (isC) {
              addVibraphone(barT, cp.harp[2], barDuration * 0.8, 0.045);
            }

            if (isC) {
              for (let i = 0; i < 4; i++) {
                addShaker(barT + i * beat, 0.014);
              }
            }
          }
        }
      }

      // 归一化
      let max = 0;
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > max) max = abs;
      }
      if (max > 0.9) {
        const scale = 0.9 / max;
        for (let i = 0; i < data.length; i++) data[i] *= scale;
      }

      const fadeTime = Math.floor(sr * 0.1);
      for (let i = 0; i < fadeTime; i++) {
        const k = i / fadeTime;
        data[i] *= k;
        data[data.length - 1 - i] *= k;
      }

      source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(audioCtx.destination);
      source.start();
      isPlaying.value = true;
      console.log('BGM 已启动：三角波温暖主旋律（降八度）+ 小提琴 + 吉他 + 大提琴 + 低音提琴');
    } catch (e) {
      console.warn('BGM 启动失败:', e);
      isPlaying.value = false;
    }
  }

  function stop() {
    isPlaying.value = false;
    if (source) {
      try { source.stop(); } catch (e) {}
      source.disconnect();
      source = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }

  function toggle() {
    if (isPlaying.value) {
      stop();
    } else {
      start();
    }
  }

  return { isPlaying, toggle };
}