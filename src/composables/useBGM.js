// src/composables/useBGM.js
import { ref } from 'vue';

/**
 * 使用 Web Audio API 生成轻柔背景音乐
 * 无需外部音频文件，通过振荡器创建简单旋律
 */
export function useBGM() {
  const isPlaying = ref(false);
  let audioCtx = null;
  let timer = null;

  /**
   * 开始播放 BGM
   */
  function start() {
    if (isPlaying.value) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 261.63, 329.63, 392.00, 523.25];
      let step = 0;
      const playNote = () => {
        if (!isPlaying.value || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[step % notes.length];
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        step++;
        timer = setTimeout(playNote, 400);
      };
      playNote();
      isPlaying.value = true;
    } catch (e) {
      console.warn('无法启动 BGM:', e);
      isPlaying.value = false;
    }
  }

  /**
   * 停止播放 BGM
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
   * 切换播放状态
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