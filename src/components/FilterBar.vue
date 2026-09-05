<!--
  FilterBar.vue
  筛选栏组件：地区、小区域、分类、排序、搜索
  通过 v-model 与父组件双向绑定
-->
<template>
  <div class="filters">
    <!-- 地区 -->
    <select :value="area" @change="$emit('update:area', $event.target.value)">
      <option value="全部">全部地区</option>
      <option value="玉泉校区周边">玉泉校区周边</option>
      <option value="紫金港校区周边">紫金港校区周边</option>
      <option value="全杭州范围及外卖">全杭州范围及外卖</option>
      <option value="食堂">食堂</option>
    </select>

    <!-- 小区域（根据地区动态显示） -->
    <select :value="subarea" @change="$emit('update:subarea', $event.target.value)">
      <option value="全部">全部小区域</option>
      <option v-for="s in subareaOptions" :key="s" :value="s">{{ s }}</option>
    </select>

    <!-- 分类 -->
    <select :value="cat" @change="$emit('update:cat', $event.target.value)">
      <option value="全部">全部分类</option>
      <option value="中餐">🥢 中餐</option>
      <option value="火锅/汤锅">🍲 火锅/汤锅</option>
      <option value="烧烤/烤肉">🍖 烧烤/烤肉</option>
      <option value="日料">🍣 日料</option>
      <option value="西餐">🍝 西餐</option>
      <option value="韩餐">🫕 韩餐</option>
      <option value="面食/小吃/快餐">🍜 面食/小吃/快餐</option>
      <option value="甜品/烘焙/咖啡">🍰 甜品/烘焙/咖啡</option>
      <option value="异国料理">🌮 异国料理</option>
      <option value="食堂/其他">🏫 食堂/其他</option>
      <option value="其他">🍽️ 其他</option>
    </select>

    <!-- 排序 -->
    <select :value="sort" @change="$emit('update:sort', $event.target.value)">
      <option value="rating">⭐ 推荐指数</option>
      <option value="priceAsc">💰 人均低→高</option>
      <option value="priceDesc">💰 人均高→低</option>
    </select>

    <!-- 搜索 -->
    <input
      type="text"
      :value="search"
      @input="$emit('update:search', $event.target.value)"
      placeholder="🔍 搜索店名..."
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { subareaMap } from '@/utils/subarea';

const props = defineProps({
  area: { type: String, default: '全部' },
  subarea: { type: String, default: '全部' },
  cat: { type: String, default: '全部' },
  sort: { type: String, default: 'rating' },
  search: { type: String, default: '' }
});

defineEmits(['update:area', 'update:subarea', 'update:cat', 'update:sort', 'update:search']);

/** 根据当前地区获取可选小区域 */
const subareaOptions = computed(() => subareaMap[props.area] || []);
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
select, input {
  flex: 1 1 45%;
  padding: 10px 12px;
  border: 1px solid #e5e0d8;
  border-radius: 12px;
  font-size: 13px;
  background: #fff;
  color: #333;
}
input {
  flex: 1 1 100%;
}
</style>