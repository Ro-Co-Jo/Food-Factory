/**
 * 从价格字符串中提取最低数值，用于排序
 * @param {string} priceStr - 价格字符串，如 "40-60"、"58双人"
 * @returns {number} 解析出的数字，无数字返回 99999
 */
export function parsePrice(priceStr) {
  if (!priceStr) return 99999;
  const nums = priceStr.match(/\d+/g);
  if (!nums || !nums.length) return 99999;
  return parseInt(nums[0]);
}