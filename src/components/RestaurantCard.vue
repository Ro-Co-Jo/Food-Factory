<!--
  RestaurantCard.vue
  餐厅卡片组件：默认不显示评价，点击后展开详情；
  避雷餐厅点击触发狼爪动画且不展开。
-->
<template>
  <div
    class="card"
    :class="{ 'avoid': restaurant.status === 'avoid', 'eaten': hasEaten, 'expanded': expanded && restaurant.status !== 'avoid' }"
    @click="handleCardClick"
  >
    <div v-if="restaurant.status === 'avoid'" class="wolf-paw">🐺</div>

    <div class="card-main">
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

      <div v-if="hasEaten" class="card-history">
        <div class="history-header">📖 历史记录 <span>共 {{ eatenRecords.length }} 次</span></div>
        <div v-for="(record, index) in eatenRecords" :key="index" class="history-row">
          <span class="h-date">{{ record.date }}</span>
          <span class="h-score">{{ formatUserStars(record.score) }}</span>
          <span class="h-note">{{ record.note || '不填写得到了零元减免券' }}</span>
        </div>
      </div>

      <div v-if="expanded && restaurant.status !== 'avoid'" class="card-detail">
        <div class="detail-row"><span class="detail-label">🏠 店名</span><span>{{ restaurant.name }}</span></div>
        <div class="detail-row"><span class="detail-label">📍 地区</span><span>{{ restaurant.area }}</span></div>
        <div v-if="subarea" class="detail-row"><span class="detail-label">🗺️ 区域</span><span>{{ subarea }}</span></div>
        <div class="detail-row"><span class="detail-label">⭐ 推荐</span><span>{{ stars }} ({{ restaurant.rating }}/5)</span></div>
        <div v-if="restaurant.comment" class="detail-comment">
          <span class="detail-label">💬 评价</span>
          <span class="comment-text">“{{ restaurant.comment }}”</span>
        </div>
        <div v-if="restaurant.note" class="detail-comment">
          <span class="detail-label">🍽️ 推荐</span>
          <span class="comment-text">{{ restaurant.note }}</span>
        </div>
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

const props = defineProps({
  restaurant: { type: Object, required: true },
  eatenRecords: { type: Array, default: () => [] }
});
defineEmits(['eat']);

const expanded = ref(false);
const emoji = computed(() => getEmoji(props.restaurant));
const subarea = computed(() => getSubarea(props.restaurant));
const hasEaten = computed(() => props.eatenRecords.length > 0);
const stars = computed(() => {
  let s = '';
  for (let i = 0; i < 5; i++) s += (i < props.restaurant.rating) ? '★' : '☆';
  return s;
});

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

function handleCardClick(event) {
  if (props.restaurant.status === 'avoid') {
    const card = event.currentTarget;
    card.classList.remove('wolf-shake');
    void card.offsetWidth;
    card.classList.add('wolf-shake');
    return;
  }
  expanded.value = !expanded.value;
}
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 18px;
  padding: 16px 16px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.07);
}
.card.eaten {
  border-left: 5px solid #60a5fa;
  background: #f8fafc;
}
.card.avoid {
  border-left: 5px solid #ef4444;
  background: #fef2f2;
  cursor: not-allowed;
}
.card.avoid .card-name {
  color: #ef4444;
}
.wolf-paw {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 24px;
  opacity: 0.9;
  pointer-events: none;
}
.card.wolf-shake {
  animation: wolfShake 0.5s ease;
}
@keyframes wolfShake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
  90% { transform: translateX(4px); }
}
.card-main {
  flex: 1;
  min-width: 0;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.card-name {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  letter-spacing: 0.3px;
}
.card-stars {
  color: #f59e0b;
  font-size: 13px;
  letter-spacing: 1px;
}
.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}
.card-meta span {
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 20px;
}
.card-note {
  margin-top: 8px;
  font-size: 13px;
  color: #4b5563;
}
.card-history {
  margin-top: 10px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 10px;
  font-size: 12px;
}
.history-header {
  font-weight: 600;
  color: #0369a1;
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.history-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
  border-bottom: 1px solid #e0f2fe;
}
.history-row:last-child { border-bottom: none; }
.h-date { font-weight: 600; color: #0369a1; }
.h-score { color: #f59e0b; }
.h-note { color: #64748b; font-style: italic; }
.card-detail {
  margin-top: 10px;
  padding: 12px;
  background: #fafaf9;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid #f5f5f4;
  animation: detailIn 0.25s ease;
}
@keyframes detailIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.detail-row { display: flex; gap: 6px; flex-wrap: wrap; }
.detail-label { font-weight: 700; color: #78716c; min-width: 60px; }
.detail-comment { display: flex; gap: 6px; margin-top: 6px; }
.comment-text { font-style: italic; color: #57534e; }
.card-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
}
.btn-eat {
  background: #111827;
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-eat:hover {
  background: #f97316;
}
</style>