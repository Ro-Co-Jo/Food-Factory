<template>
  <div class="container">
    <h1>🌸 花狼の探店挑战 🐺</h1>

    <!-- 吃货签 -->
    <FortuneBox />

    <!-- 随机推荐 -->
    <RandomPicker :restaurants="restaurants" />

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

    <!-- 餐厅列表 -->
    <RestaurantCard
      v-for="item in filteredRestaurants"
      :key="item.area + item.name"
      :restaurant="item"
      :eaten-records="eatenRecords[item.name] || []"
      @eat="openEatModal"
    />

    <!-- 评价弹窗 -->
    <EatModal
      :restaurant="selectedRestaurant"
      :visible="modalVisible"
      @close="modalVisible = false"
      @saved="modalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { restaurants } from '@/data/restaurants';
import RestaurantCard from '@/components/RestaurantCard.vue';
import FilterBar from '@/components/FilterBar.vue';
import FortuneBox from '@/components/FortuneBox.vue';
import RandomPicker from '@/components/RandomPicker.vue';
import EatModal from '@/components/EatModal.vue';
import { useFilters } from '@/composables/useFilters';
import { useEatenRecords } from '@/composables/useEatenRecords';

const currentTab = ref('all');
const { records: eatenRecords, addRecord, deleteRecord } = useEatenRecords();

const restaurantsRef = ref(restaurants);
const { area, subarea, cat, sort, search, filtered } = useFilters(restaurantsRef, currentTab);

const filteredRestaurants = computed(() => filtered.value);

// 评价弹窗相关
const modalVisible = ref(false);
const selectedRestaurant = ref(null);

function switchTab(tab) {
  currentTab.value = tab;
}

function openEatModal(restaurant) {
  selectedRestaurant.value = restaurant;
  modalVisible.value = true;
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