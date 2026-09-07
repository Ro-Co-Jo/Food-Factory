export function getEmoji(item) {
  const cat1 = item.cat1;
  if (cat1 === '中餐') return '🥢';
  if (cat1 === '火锅/汤锅') return '🍲';
  if (cat1 === '烧烤/烤肉') return '🍖';
  if (cat1 === '日料') return '🍣';
  if (cat1 === '西餐') return '🍝';
  if (cat1 === '韩餐') return '🫕';
  if (cat1 === '面食/小吃/快餐') return '🍜';
  if (cat1 === '甜品/烘焙/咖啡') return '🍰';
  if (cat1 === '异国料理') return '🌮';
  if (cat1 === '食堂/其他' || item.area === '食堂') return '🏫';
  return '🍽️';
}