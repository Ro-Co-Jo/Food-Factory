<template>
  <div class="page-wrapper">
    <AppBackground />

    <div class="container">
      <header class="header">
        <h1 class="main-title">🌸 花狼の探店挑战 🐺</h1>
        <p class="subtitle">花花是不是又不知道要吃什么啦~ 让小狼陪你看看吧！</p>
      </header>

      <!-- 随机推荐区 -->
      <section class="hero-card">
        <RandomPicker v-if="restaurants.value && restaurants.value.length" :restaurants="restaurants.value" />
      </section>

      <!-- 吃货签 -->
      <FortuneBox />

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button :class="{ active: currentTab === 'main' }" @click="switchTab('main')">🍚 主食</button>
        <button :class="{ active: currentTab === 'snack' }" @click="switchTab('snack')">🍰 茶点</button>
        <button :class="{ active: currentTab === 'all' }" @click="switchTab('all')">🌈 全部</button>
      </div>

      <!-- 筛选栏 -->
      <FilterBar
        v-model:area="area"
        v-model:subarea="subarea"
        v-model:cat="cat"
        v-model:sort="sort"
        v-model:search="search"
      />

      <!-- 加载状态 / 错误提示 -->
      <div v-if="loading" class="status-msg">🔄 正在加载餐厅数据...</div>
      <div v-else-if="error" class="status-msg error">
        ⚠️ 加载失败：{{ error }}
        <button class="retry-btn" @click="loadRestaurants">重试</button>
      </div>

      <!-- 餐厅列表 -->
      <template v-else>
        <RestaurantCard
          v-for="item in filteredRestaurants"
          :key="item.area + item.name"
          :restaurant="item"
          :eaten-records="eatenRecords[item.name] || []"
          @eat="openEatModal"
        />
        <div v-if="!filteredRestaurants.length" class="status-msg">没有找到匹配的餐厅 😢</div>
      </template>

      <!-- 手动刷新 -->
      <button class="refresh-btn" @click="loadRestaurants" :disabled="loading">🔄 刷新数据</button>
    </div>

    <!-- 评价弹窗 -->
    <EatModal
      v-if="selectedRestaurant"
      :restaurant="selectedRestaurant"
      :visible="modalVisible"
      @close="modalVisible = false"
      @saved="modalVisible = false"
    />

    <!-- BGM 按钮 -->
    <button class="bgm-btn" :class="{ playing: isBGMPlaying }" @click="toggleBGM">
      {{ isBGMPlaying ? '🎵' : '🔇' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { restaurants, loadRestaurants as fetchRestaurants } from '@/data/restaurants';
import RestaurantCard from '@/components/RestaurantCard.vue';
import FilterBar from '@/components/FilterBar.vue';
import FortuneBox from '@/components/FortuneBox.vue';
import RandomPicker from '@/components/RandomPicker.vue';
import EatModal from '@/components/EatModal.vue';
import AppBackground from '@/components/AppBackground.vue';
import { useFilters } from '@/composables/useFilters';
import { useEatenRecords } from '@/composables/useEatenRecords';
import { useBGM } from '@/composables/useBGM';

const currentTab = ref('all');
const { records: eatenRecords } = useEatenRecords();

const loading = ref(false);
const error = ref('');

async function loadRestaurants() {
  loading.value = true;
  error.value = '';
  try {
    await fetchRestaurants();
  } catch (e) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

const { area, subarea, cat, sort, search, filtered } = useFilters(restaurants, currentTab);
const filteredRestaurants = computed(() => filtered.value);

const modalVisible = ref(false);
const selectedRestaurant = ref(null);

const { isPlaying: isBGMPlaying, toggle: toggleBGM } = useBGM();

onMounted(() => {
  loadRestaurants();
});

function switchTab(tab) {
  currentTab.value = tab;
}

function openEatModal(restaurant) {
  selectedRestaurant.value = restaurant;
  modalVisible.value = true;
}
</script>

<style scoped>
.page-wrapper {
  position: relative;
  min-height: 100vh;
  background: #faf9f7;
}

.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 18px;
}
.main-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.4;
  background: linear-gradient(135deg, #f97316, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
  padding: 4px 0;
}
.subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 6px;
  letter-spacing: 0.3px;
}

.hero-card {
  margin-bottom: 14px;
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.tab-bar button {
  flex: 1;
  padding: 11px 6px;
  border: none;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s;
}
.tab-bar button.active {
  background: #111827;
  color: #fff;
  font-weight: 600;
}

.status-msg {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
}
.status-msg.error {
  color: #ef4444;
}
.retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  border: 1px solid #ef4444;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.refresh-btn {
  display: block;
  margin: 20px auto 0;
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  background: #111827;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bgm-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #111827;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  z-index: 999;
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
.bgm-btn.playing {
  animation: musicPulse 2s ease-in-out infinite;
}
@keyframes musicPulse {
  0%, 100% { box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 8px 28px rgba(249,115,22,0.5); }
}
</style>