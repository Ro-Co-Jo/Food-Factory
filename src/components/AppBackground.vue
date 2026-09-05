<!--
  AppBackground.vue
  全局背景动态元素：随机生成漂浮的爪印、花瓣和星星
  用于增强页面趣味性
-->
<template>
  <div class="bg-elements">
    <span
      v-for="(item, index) in pawItems"
      :key="'paw-' + index"
      class="bg-paw"
      :style="item.style"
    >{{ item.char }}</span>
    <span
      v-for="(item, index) in petalItems"
      :key="'petal-' + index"
      class="bg-petal"
      :style="item.style"
    ></span>
    <span
      v-for="(item, index) in starItems"
      :key="'star-' + index"
      class="bg-star"
      :style="item.style"
    >⭐</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';

/**
 * 生成随机位置和动画参数的数组，用于背景元素
 */

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 爪印
const pawEmojis = ['🐾', '🐾', '🐾', '🌸', '✨', '🍀'];
const pawItems = ref(
  Array.from({ length: 8 }, () => ({
    char: pawEmojis[Math.floor(Math.random() * pawEmojis.length)],
    style: {
      left: `${randomBetween(0, 100)}vw`,
      animationDuration: `${randomBetween(15, 35)}s`,
      animationDelay: `${randomBetween(0, 10)}s`
    }
  }))
);

// 花瓣
const petalColors = ['#f8c8d2', '#fde2c4', '#f5c9c9', '#f9e0e0', '#ffd9a0', '#e8d0f0'];
const petalItems = ref(
  Array.from({ length: 10 }, () => {
    const size = randomBetween(8, 16);
    return {
      style: {
        left: `${randomBetween(0, 100)}vw`,
        width: `${size}px`,
        height: `${size}px`,
        background: petalColors[Math.floor(Math.random() * petalColors.length)],
        animationDuration: `${randomBetween(12, 25)}s`,
        animationDelay: `${randomBetween(0, 10)}s`
      }
    };
  })
);

// 星星
const starItems = ref(
  Array.from({ length: 6 }, () => ({
    style: {
      left: `${randomBetween(0, 100)}vw`,
      top: `${randomBetween(0, 100)}vh`,
      fontSize: `${randomBetween(16, 32)}px`,
      animationDuration: `${randomBetween(2, 5)}s`,
      animationDelay: `${randomBetween(0, 2)}s`
    }
  }))
);
</script>

<style scoped>
.bg-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.bg-paw {
  position: absolute;
  bottom: -50px;
  opacity: 0.06;
  font-size: 30px;
  animation: floatPaw linear infinite;
}
@keyframes floatPaw {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-110vh) rotate(360deg); }
}
.bg-petal {
  position: absolute;
  bottom: -20px;
  opacity: 0.15;
  border-radius: 50% 50% 50% 0;
  animation: floatPetal linear infinite;
}
@keyframes floatPetal {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.15; }
  90% { opacity: 0.15; }
  100% { transform: translateY(-110vh) rotate(540deg); opacity: 0; }
}
.bg-star {
  position: absolute;
  opacity: 0.1;
  animation: twinkle ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.05; transform: scale(0.8); }
  50% { opacity: 0.2; transform: scale(1.2); }
}
</style>