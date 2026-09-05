<!--
  EatModal.vue
  评价弹窗：记录吃过的日期、评分（1-10分，支持半星）、备注，
  并展示该餐厅的历史记录，支持删除单条记录。
-->
<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal">
        <h3>🍽️ {{ restaurant.name }}</h3>

        <!-- 日期选择 -->
        <label>吃过的日期</label>
        <div class="date-selects">
          <select v-model="selectedYear">
            <option v-for="y in years" :key="y" :value="y">{{ y }}年</option>
          </select>
          <select v-model="selectedMonth" @change="updateDays">
            <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
          </select>
          <select v-model="selectedDay">
            <option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}日</option>
          </select>
        </div>

        <!-- 星级评分 -->
        <label>你的评分（点击星星，支持半星）</label>
        <div class="star-rating">
          <span
            v-for="star in 5"
            :key="star"
            class="star"
            :class="starClass(star)"
            @click="setScore(star, $event)"
          >★</span>
        </div>
        <div class="score-display">{{ score }}分</div>

        <!-- 备注 -->
        <label>备注（可选）</label>
        <input type="text" v-model="note" placeholder="不填得到老板的小奖励" />

        <!-- 按钮 -->
        <div class="modal-btns">
          <button class="cancel" @click="close">取消</button>
          <button class="confirm" @click="save">保存</button>
        </div>

        <!-- 历史记录 -->
        <div v-if="records.length" class="history-section">
          <h4>📖 历史记录（{{ records.length }}次）</h4>
          <div v-for="(r, index) in records" :key="index" class="history-item">
            <div>
              <span class="h-date">{{ r.date }}</span>
              <span class="h-score">{{ formatStars(r.score) }}</span>
              <span class="h-note">{{ r.note || '不填写得到了零元减免券' }}</span>
            </div>
            <button class="delete-btn" @click="removeRecord(index)">✕</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useEatenRecords } from '@/composables/useEatenRecords';

const props = defineProps({
  restaurant: { type: Object, required: true },
  visible: { type: Boolean, default: false }
});
const emit = defineEmits(['close', 'saved']);

const { records: allRecords, addRecord, deleteRecord } = useEatenRecords();

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

const selectedYear = ref(currentYear);
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedDay = ref(new Date().getDate());
const score = ref(0);
const note = ref('');

const records = computed(() => allRecords.value[props.restaurant.name] || []);

const daysInMonth = computed(() => {
  return new Date(selectedYear.value, selectedMonth.value, 0).getDate();
});

function updateDays() {
  if (selectedDay.value > daysInMonth.value) {
    selectedDay.value = daysInMonth.value;
  }
}

function starClass(starIndex) {
  const starValue = starIndex * 2; // 每颗星代表2分
  if (score.value >= starValue) return 'full';
  if (score.value === starValue - 1) return 'half';
  return 'empty';
}

/**
 * 点击星星设置评分
 * @param {number} starIndex 星星索引（1-5）
 * @param {MouseEvent} event 点击事件，用于判断左/右半区
 */
function setScore(starIndex, event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const isHalf = x < rect.width / 2;
  score.value = starIndex * 2 - (isHalf ? 1 : 0);
}

function formatStars(scoreValue) {
  if (!scoreValue && scoreValue !== 0) return '';
  const starCount = Math.round(scoreValue / 2 * 2) / 2;
  let s = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= starCount) s += '★';
    else if (i - 0.5 === starCount) s += '⯨';
    else s += '☆';
  }
  return `${s} (${scoreValue}/10)`;
}

function save() {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`;
  addRecord(props.restaurant.name, {
    date: dateStr,
    score: score.value,
    note: note.value.trim()
  });
  note.value = '';
  score.value = 0;
  emit('saved');
  emit('close');
}

function removeRecord(index) {
  deleteRecord(props.restaurant.name, index);
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  width: 90%;
  max-width: 430px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: modalIn 0.3s ease;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
h3 { font-size: 17px; margin-bottom: 12px; text-align: center; }
label { font-size: 13px; color: #666; display: block; margin: 10px 0 4px; }
.date-selects { display: flex; gap: 8px; }
.date-selects select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
}
.star-rating { display: flex; gap: 2px; margin-top: 4px; font-size: 28px; cursor: pointer; user-select: none; }
.star { transition: transform 0.15s; }
.star:hover { transform: scale(1.15); }
.star.full { color: #f0b840; }
.star.half {
  background: linear-gradient(to right, #f0b840 50%, #ddd 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.star.empty { color: #ddd; }
.score-display { font-size: 13px; color: #666; margin-top: 4px; text-align: right; }
input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  margin-top: 4px;
}
.modal-btns { display: flex; gap: 8px; margin-top: 16px; }
.modal-btns button { flex: 1; padding: 11px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
.confirm { background: linear-gradient(135deg, #e0a458, #c96f6f); color: white; }
.cancel { background: #f0f0f0; color: #666; }
.history-section { margin-top: 14px; border-top: 1px solid #eee; padding-top: 12px; }
.history-section h4 { font-size: 13px; color: #666; margin-bottom: 8px; }
.history-item {
  padding: 8px 10px;
  background: #faf8f4;
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.h-date { font-weight: 600; color: #333; }
.h-score { color: #f0b840; }
.h-note { color: #888; font-style: italic; }
.delete-btn { background: none; border: none; color: #ccc; font-size: 16px; cursor: pointer; }
.delete-btn:hover { color: #d9534f; }
</style>