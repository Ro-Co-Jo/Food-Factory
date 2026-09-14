// src/composables/useBGM.js
import { ref } from 'vue';
import BGMWorker from '@/workers/bgmWorker.js?worker';

let audioCtxInstance = null;
let cachedBuffer = null;
let workerInstance = null;
let pendingResolve = null;

export function useBGM() {
  const isPlaying = ref(false);
  let source = null;

  function ensureAudioContext() {
    if (!audioCtxInstance) {
      audioCtxInstance = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxInstance;
  }

  function ensureWorker() {
    if (workerInstance) return;
    workerInstance = new BGMWorker();
    workerInstance.onmessage = (e) => {
      const ctx = ensureAudioContext();
      const floatData = new Float32Array(e.data.audioData);
      const buffer = ctx.createBuffer(1, floatData.length, ctx.sampleRate);
      buffer.getChannelData(0).set(floatData);
      cachedBuffer = buffer;
      if (pendingResolve) {
        pendingResolve();
        pendingResolve = null;
      }
    };
  }

  function preload() {
    if (cachedBuffer) return;
    const ctx = ensureAudioContext();
    ensureWorker();
    workerInstance.postMessage({ sampleRate: ctx.sampleRate });
  }

  async function play() {
    if (isPlaying.value) return;
    try {
      const ctx = ensureAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (!cachedBuffer) {
        await new Promise((resolve) => {
          pendingResolve = resolve;
          ensureWorker();
          workerInstance.postMessage({ sampleRate: ctx.sampleRate });
        });
      }
      source = ctx.createBufferSource();
      source.buffer = cachedBuffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
      isPlaying.value = true;
    } catch (e) {
      console.warn('BGM 播放失败:', e);
    }
  }

  function stop() {
    if (source) {
      try { source.stop(); } catch (e) {}
      try { source.disconnect(); } catch (e) {}
      source = null;
    }
    isPlaying.value = false;
  }

  function toggle() {
    if (isPlaying.value) {
      stop();
    } else {
      play();
    }
  }

  function setupAutoStart() {
    const handler = (e) => {
      // 如果用户点的是 BGM 按钮，不自动播放
      if (e.target && e.target.closest && e.target.closest('.bgm-btn')) {
        return;
      }
      if (!isPlaying.value) {
        play();
      }
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('touchstart', handler);
    };
    document.addEventListener('pointerdown', handler);
    document.addEventListener('touchstart', handler);
  }

  return { isPlaying, toggle, preload, setupAutoStart };
}