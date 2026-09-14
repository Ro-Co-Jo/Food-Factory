// src/data/restaurants.js
import { ref } from 'vue';

/**
 * 餐厅数据（响应式）
 * 初始为空数组，通过 loadRestaurants() 从后端 API 加载
 */
export const restaurants = ref([]);

/**
 * 从后端 API 动态加载餐厅数据
 */
export async function loadRestaurants() {
  try {
    const response = await fetch('https://ro-co-jo-factory.onrender.com/api/restaurants');    if (!response.ok) throw new Error('网络响应失败');
    restaurants.value = await response.json();
  } catch (error) {
    console.error('加载餐厅数据失败:', error);
    restaurants.value = [];
  }
}