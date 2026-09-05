<template>
  <div class="container">
    <h1>🌸 花狼の探店挑战 🐺</h1>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button :class="{ active: currentTab === 'main' }" @click="switchTab('main')">🍚 主食</button>
      <button :class="{ active: currentTab === 'snack' }" @click="switchTab('snack')">🍰 茶点</button>
      <button :class="{ active: cu      git config --global user.name "Your Name"
      git config --global user.email "you@example.com"rrentTab === 'all' }" @click="switchTab('all')">🌈 全部</button>
    </div>

    <!-- 筛选栏 -->
    <FilterBar
      v-model:area="area"
      v-model:subarea="subarea"
      v-model:cat="cat"
      v-model:sort="sort"
      v-model:search="search"
    />

    <!-- 餐厅列表 -->
    <RestaurantCard
      v-for="item in filteredRestaurants"
      :key="item.area + item.name"
      :restaurant="item"
      :eaten-records="eatenRecords[item.name] || []"
      @eat="handleEat"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { restaurants } from '@/data/restaurants';
import RestaurantCard from '@/components/RestaurantCard.vue';
import FilterBar from '@/components/FilterBar.vue';
import { useFilters } from '@/composables/useFilters';

const currentTab = ref('all');
const eatenRecords = ref({});

const restaurantsRef = ref(restaurants);
const { area, subarea, cat, sort, search, filtered } = useFilters(restaurantsRef, currentTab);

const filteredRestaurants = computed(() => filtered.value);

function switchTab(tab) {
  currentTab.value = tab;
}

function handleEat(restaurant) {
  console.log('点击评价：', restaurant.name);
}
</script>

<style scoped>
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
button {
  padding: 10px;
  border: 1px solid #e5e0d8;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
button.active {
  background: #e0a458;
  color: white;
  border-color: #e0a458;
}
</style>