/**
 * 小区域映射表：每个地区对应的小区域列表
 */
export const subareaMap = {
  '玉泉校区周边': [
    '青芝坞','万塘路','西溪路','北门','南门',
    '正大门','黄龙','玉泉门口','玉泉周边'
  ],
  '紫金港校区周边': [
    '堕落街','剑桥公社','浙港国际','三坝地铁站',
    '宝港生活广场','西溪天街','城西银泰'
  ],
  '全杭州范围及外卖': [],
  '食堂': []
};

/**
 * 从餐厅的 note/area 字段中识别小区域
 * @param {Object} item - 餐厅对象
 * @returns {string} 小区域名称，无匹配返回空字符串
 */
export function getSubarea(item) {
  const keywords = [
    '堕落街','剑桥公社','浙港国际','三坝地铁站','宝港生活广场','西溪天街','城西银泰',
    '青芝坞','万塘路','西溪路','北门','南门','正大门','黄龙','玉泉门口','玉泉周边'
  ];
  const text = (item.note || '') + ' ' + (item.area || '');
  for (const kw of keywords) {
    if (text.includes(kw)) return kw;
  }
  return '';
}