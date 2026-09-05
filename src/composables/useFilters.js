import { ref, computed } from 'vue';
import { getSubarea } from '@/utils/subarea';
import { parsePrice } from '@/utils/price';

/**
 * 餐厅筛选与排序逻辑
 * @param {import('vue').Ref<Array>} restaurantsRef - 餐厅数据的响应式引用
 * @param {import('vue').Ref<string>} currentTab - 当前 Tab（main/snack/all）
 * @returns 筛选条件与过滤后的列表
 */
export function useFilters(restaurantsRef, currentTab) {
  const area = ref('全部');
  const subarea = ref('全部');
  const cat = ref('全部');
  const sort = ref('rating');
  const search = ref('');

  const filtered = computed(() => {
    let result = restaurantsRef.value.filter(item => {
      // Tab 过滤：主食排除甜品/烘焙/咖啡；茶点只保留甜品/烘焙/咖啡
      if (currentTab.value === 'main' && item.cat1 === '甜品/烘焙/咖啡') return false;
      if (currentTab.value === 'snack' && item.cat1 !== '甜品/烘焙/咖啡') return false;

      // 地区过滤
      if (area.value !== '全部' && item.area !== area.value) return false;

      // 小区域过滤
      if (subarea.value !== '全部' && getSubarea(item) !== subarea.value) return false;

      // 分类过滤
      if (cat.value !== '全部' && item.cat1 !== cat.value) return false;

      // 搜索店名
      if (search.value && !item.name.toLowerCase().includes(search.value.toLowerCase())) return false;

      return true;
    });

    // 排序
    if (sort.value === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sort.value === 'priceAsc') {
      result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sort.value === 'priceDesc') {
      result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return result;
  });

  return { area, subarea, cat, sort, search, filtered };
}