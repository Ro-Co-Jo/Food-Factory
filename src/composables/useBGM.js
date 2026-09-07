// src/composables/useBGM.js
import { ref } from 'vue';

/**
 * 使用 Web Audio API 播放轻柔背景音乐
 * 无需外部文件，通过振荡器生成音符
 */
export function useBGM() {
  const isPlaying = ref(false);
  let audioCtx = null;
  let timer = null;

  /**
   * 开始播放
   */
  function start() {
    if (isPlaying.value) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [
        523.25, 587.33, 659.25, 783.99, 659.25, 587.33,
        523.25, 493.88, 587.33, 659.25, 783.99, 659.25,
        587.33, 493.88, 523.25, 587.33
      ];
      let step = 0;

      const playNext = () => {
        if (!isPlaying.value || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[step % notes.length];
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        step++;
        timer = setTimeout(playNext, 520);
      };

      playNext();
      isPlaying.value = true;
    } catch (e) {
      console.warn('BGM 播放失败:', e);
      isPlaying.value = false;
    }
  }

  /**
   * 停止播放
   */
  function stop() {
    isPlaying.value = false;
    if (timer) clearTimeout(timer);
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }

  /**
   * 切换播放/停止
   */
  function toggle() {
    if (isPlaying.value) {
      stop();
    } else {
      start();
    }
  }

  return { isPlaying, start, stop, toggle };
}