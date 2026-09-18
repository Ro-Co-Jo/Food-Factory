// src/data/restaurants.js
import { ref } from 'vue';

/**
 * 餐厅数据（响应式）
 * 初始为空数组，通过 loadRestaurants() 从后端 API 加载
 */
export const restaurants = ref([]);

/**
 * Fisher-Yates shuffle：让数组顺序随机
 * 每次刷新页面顺序不同，但同一次加载内保持一致
 */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 按 area + name 去重（保留第一个出现的）
 * 解决数据里有重复店铺导致 Vue key 冲突的问题
 */
function dedupe(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = item.area + '|' + item.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 从后端 API 动态加载餐厅数据
 * 加载后：先去重 → 再 shuffle
 */
export async function loadRestaurants() {
  try {
    const response = await fetch('https://ro-co-jo-factory.onrender.com/api/restaurants');
    if (!response.ok) throw new Error('网络响应失败');
    const raw = await response.json();
    const cleaned = shuffleArray(dedupe(raw));
    restaurants.value = cleaned;
  } catch (error) {
    console.error('加载餐厅数据失败:', error);
    restaurants.value = [];
  }
}