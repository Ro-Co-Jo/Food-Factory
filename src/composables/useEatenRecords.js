// src/composables/useEatenRecords.js
import { ref, watch } from 'vue';

const STORAGE_KEY = 'zjufood_eaten_records';

/**
 * 已吃记录管理：
 * 从 localStorage 读取，修改后自动保存
 * records 结构：{ [餐厅名]: [ {date, score, note}, ... ] }
 */
export function useEatenRecords() {
  const records = ref(loadRecords());

  function loadRecords() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  // 深度监听，自动持久化
  watch(records, (newVal) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
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

  return { records, addRecord, deleteRecord };
}