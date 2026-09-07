<!--
  AppBackground.vue
  背景特效：多层浮动元素（大号柔光、飘落花瓣、闪烁星星、漂浮爪印）
-->
<template>
  <div class="bg-elements">
    <!-- 大号柔光球 -->
    <div class="glow-orb glow-1"></div>
    <div class="glow-orb glow-2"></div>
    <div class="glow-orb glow-3"></div>

    <!-- 漂浮爪印 -->
    <span
      v-for="(item, index) in pawItems"
      :key="'paw-' + index"
      class="bg-paw"
      :style="item.style"
    >{{ item.char }}</span>

    <!-- 飘落花瓣 -->
    <span
      v-for="(item, index) in petalItems"
      :key="'petal-' + index"
      class="bg-petal"
      :style="item.style"
    ></span>

    <!-- 闪烁星星 -->
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

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const pawEmojis = ['🐾', '🐾', '🐾', '🌸', '✨', '🍀'];
const pawItems = ref(
  Array.from({ length: 12 }, () => ({
    char: pawEmojis[Math.floor(Math.random() * pawEmojis.length)],
    style: {
      left: `${randomBetween(0, 100)}vw`,
      animationDuration: `${randomBetween(15, 35)}s`,
      animationDelay: `${randomBetween(0, 10)}s`,
      opacity: 0.12 + Math.random() * 0.1
    }
  }))
);

const petalColors = ['#f8c8d2', '#fde2c4', '#f5c9c9', '#f9e0e0', '#ffd9a0', '#e8d0f0'];
const petalItems = ref(
  Array.from({ length: 18 }, () => {
    const size = randomBetween(10, 22);
    return {
      style: {
        left: `${randomBetween(0, 100)}vw`,
        width: `${size}px`,
        height: `${size}px`,
        background: petalColors[Math.floor(Math.random() * petalColors.length)],
        animationDuration: `${randomBetween(10, 22)}s`,
        animationDelay: `${randomBetween(0, 12)}s`,
        opacity: 0.25 + Math.random() * 0.2
      }
    };
  })
);

const starItems = ref(
  Array.from({ length: 10 }, () => ({
    style: {
      left: `${randomBetween(0, 100)}vw`,
      top: `${randomBetween(0, 100)}vh`,
      fontSize: `${randomBetween(14, 28)}px`,
      animationDuration: `${randomBetween(2, 5)}s`,
      animationDelay: `${randomBetween(0, 3)}s`,
      opacity: 0.2 + Math.random() * 0.3
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

/* 柔光球 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  animation: orbFloat 12s ease-in-out infinite;
}
.glow-1 {
  width: 300px;
  height: 300px;
  background: #fbbf24;
  top: -80px;
  left: -60px;
}
.glow-2 {
  width: 350px;
  height: 350px;
  background: #f472b6;
  bottom: -100px;
  right: -80px;
  animation-delay: 4s;
}
.glow-3 {
  width: 250px;
  height: 250px;
  background: #60a5fa;
  top: 40%;
  left: 60%;
  animation-delay: 8s;
}
@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -20px); }
  66% { transform: translate(-20px, 30px); }
}

/* 爪印 */
.bg-paw {
  position: absolute;
  bottom: -50px;
  font-size: 28px;
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-110vh) rotate(360deg); }
}

/* 花瓣 */
.bg-petal {
  position: absolute;
  bottom: -20px;
  border-radius: 50% 50% 50% 0;
  animation: petalFall linear infinite;
}
@keyframes petalFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-110vh) rotate(540deg); opacity: 0; }
}

/* 星星 */
.bg-star {
  position: absolute;
  animation: twinkle ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.1; transform: scale(0.8); }
  50% { opacity: 0.4; transform: scale(1.2); }
}
</style>