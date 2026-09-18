// src/composables/useEatenRecords.js
import { ref, watch } from 'vue';

const STORAGE_KEY = 'zjufood_eaten_records';

/**
 * 模块级单例：
 * 所有组件共享同一个 records ref
 * 只在模块加载时初始化一次
 */
const records = ref(loadFromStorage());

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    // 数据修复：确保每条记录都是数组
    for (const k in parsed) {
      if (!Array.isArray(parsed[k])) {
        parsed[k] = [parsed[k]];
      }
    }
    return parsed;
  } catch (e) {
    console.warn('读取本地记录失败:', e);
    return {};
  }
}

/**
 * 监听变化，自动持久化到 localStorage
 * 只在模块加载时注册一次
 */
watch(records, (newVal) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
  } catch (e) {
    console.warn('保存本地记录失败:', e);
  }
}, { deep: true });

/**
 * 添加一条已吃记录
 * @param {string} restaurantName 餐厅名
 * @param {{date:string, score:number, note:string}} record 记录对象
 */
function addRecord(restaurantName, record) {
  if (!records.value[restaurantName]) {
    records.value[restaurantName] = [];
  }
  records.value[restaurantName].push(record);
}

/**
 * 删除指定索引的记录
 * @param {string} restaurantName 餐厅名
 * @param {number} index 记录索引
 */
function deleteRecord(restaurantName, index) {
  if (!records.value[restaurantName]) return;
  records.value[restaurantName].splice(index, 1);
  if (records.value[restaurantName].length === 0) {
    delete records.value[restaurantName];
  }
}

/**
 * 导出：所有组件共享同一个 records
 */
export function useEatenRecords() {
  return { records, addRecord, deleteRecord };
}