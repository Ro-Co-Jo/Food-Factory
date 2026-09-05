<!--
  RestaurantCard.vue
  餐厅卡片组件：展示单家餐厅的简要信息、展开详情、历史记录，
  并提供独立的“评价”按钮，避雷卡片会有狼爪震动效果。
-->
<template>
  <div class="card" :class="{ 'avoid': restaurant.status === 'avoid', 'eaten': hasEaten }">
    <div class="card-main" @click="toggleExpand">
      <div class="card-top">
        <span class="card-name">{{ emoji }} {{ restaurant.name }}</span>
        <span class="card-stars">{{ stars }}</span>
      </div>
      <div class="card-meta">
        <span>{{ restaurant.area }}</span>
        <span v-if="subarea">📍{{ subarea }}</span>
        <span>{{ restaurant.cat1 }}{{ restaurant.cat2 ? ' · ' + restaurant.cat2 : '' }}</span>
        <span>💰 {{ restaurant.price }}</span>
      </div>
      <div class="card-note">{{ restaurant.note }}</div>
      <div v-if="restaurant.comment" class="card-comment">“{{ restaurant.comment }}”</div>

      <!-- 历史记录（仅当有记录时显示） -->
      <div v-if="hasEaten" class="card-history">
        <div class="history-header">📖 历史记录 <span>共 {{ eatenRecords.length }} 次</span></div>
        <div v-for="(record, index) in eatenRecords" :key="index" class="history-row">
          <span class="h-date">{{ record.date }}</span>
          <span class="h-score">{{ formatUserStars(record.score) }}</span>
          <span class="h-note">{{ record.note || '不填写得到了零元减免券' }}</span>
        </div>
      </div>

      <!-- 点击展开的详情区域 -->
      <div v-show="expanded" class="card-detail">
        <div class="detail-row"><span class="detail-label">🏠 店名</span><span>{{ restaurant.name }}</span></div>
        <div class="detail-row"><span class="detail-label">📍 地区</span><span>{{ restaurant.area }}</span></div>
        <div v-if="subarea" class="detail-row"><span class="detail-label">🗺️ 区域</span><span>{{ subarea }}</span></div>
        <div class="detail-row"><span class="detail-label">⭐ 推荐</span><span>{{ stars }} ({{ restaurant.rating }}/5)</span></div>
        <div v-if="restaurant.comment" class="detail-row"><span class="detail-label">💬 评价</span><span style="font-style:italic;">{{ restaurant.comment }}</span></div>
      </div>
    </div>

    <div class="card-actions">
      <button class="btn-eat" @click.stop="$emit('eat', restaurant)">🍽️ 评价</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getEmoji } from '@/utils/emoji';
import { getSubarea } from '@/utils/subarea';

/**
 * 组件 Props 定义
 * restaurant: 单个餐厅对象
 * eatenRecords: 该餐厅的已吃记录数组
 */
const props = defineProps({
  restaurant: { type: Object, required: true },
  eatenRecords: { type: Array, default: () => [] }
});

/** 向父组件发送 “eat” 事件，用于打开评价弹窗 */
defineEmits(['eat']);

const expanded = ref(false);

/** 计算 emoji 图标 */
const emoji = computed(() => getEmoji(props.restaurant));

/** 计算小区域（如堕落街、剑桥公社等） */
const subarea = computed(() => getSubarea(props.restaurant));

/** 计算是否有历史记录 */
const hasEaten = computed(() => props.eatenRecords.length > 0);

/** 生成星级字符串（推荐指数） */
const stars = computed(() => {
  let s = '';
  for (let i = 0; i < 5; i++) s += (i < props.restaurant.rating) ? '★' : '☆';
  return s;
});

/**
 * 将 1-10 分的用户评分格式化为星级显示
 * @param {number} score - 用户评分（1-10）
 * @returns {string} 星级字符串（含分数）
 */
function formatUserStars(score) {
  if (!score && score !== 0) return '';
  const starCount = Math.round(score / 2 * 2) / 2;
  let s = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= starCount) s += '★';
    else if (i - 0.5 === starCount) s += '⯨';
    else s += '☆';
  }
  return `${s} (${score}/10)`;
}

/** 切换详情展开状态 */
function toggleExpand() {
  expanded.value = !expanded.value;
}
</script>

<style scoped>
.card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border: 1px solid #e5e0d8;
  border-radius: 16px;
  padding: 14px 16px;
  transition: box-shadow 0.3s;
}
.card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
.card.avoid { border-left: 5px solid #d9534f; background: #fff5f5; }
.card.eaten { border-left: 5px solid #7fa6c9; background: #eef4fa; }

.card-main { flex: 1; cursor: pointer; }
.card-top { display: flex; justify-content: space-between; align-items: center; }
.card-name { font-size: 16px; font-weight: 700; }
.card-stars { color: #f0b840; font-size: 14px; }
.card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 12px; color: #888; }
.card-meta span { background: rgba(0,0,0,0.03); padding: 2px 8px; border-radius: 12px; }
.card-note { margin-top: 6px; font-size: 13px; color: #555; }
.card-comment {
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(224,164,88,0.12);
  border-left: 3px solid #e0a458;
  border-radius: 6px;
  font-size: 12px;
  color: #7a5c44;
  font-style: italic;
}
.card-history { margin-top: 10px; padding: 8px; background: rgba(127,166,201,0.1); border-radius: 8px; font-size: 12px; }
.history-header { font-weight: 700; color: #4a6a8a; display: flex; justify-content: space-between; }
.history-row { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0; border-bottom: 1px solid rgba(127,166,201,0.15); }
.history-row:last-child { border-bottom: none; }
.h-date { font-weight: 600; color: #4a6a8a; }
.h-score { color: #f0b840; }
.h-note { color: #777; font-style: italic; }

.card-detail {
  margin-top: 10px;
  padding: 10px 12px;
  background: #fdfaf5;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid rgba(224,164,88,0.2);
}
.detail-row { display: flex; gap: 6px; flex-wrap: wrap; }
.detail-label { font-weight: 700; color: #8a6a4a; min-width: 60px; }

.card-actions { display: flex; flex-direction: column; justify-content: center; flex-shrink: 0; }
.btn-eat {
  background: linear-gradient(135deg, #e0a458, #c96f6f);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
</style>