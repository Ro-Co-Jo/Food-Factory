<!--
  FortuneBox.vue
  今日吃货签：点击抽签显示随机签文，带冷却与特效
-->
<template>
  <div class="fortune-box" :class="{ disabled: cooldown > 0 }" @click="drawFortune">
    <div class="title">🎋 今日吃货签</div>
    <div class="msg">{{ message }}</div>
    <div class="cooldown">{{ cooldown > 0 ? `冷却中 ${cooldown}s` : '' }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const fortunes = [
  "今天适合吃辣，冲！🌶️", "甜点星人附体，去吃蛋糕🍰", "汉堡薯条安排上🍔",
  "牛肉火锅最旺你🍲", "今天别挑，吃面就行🍜", "食堂可能才是最终归宿🏫",
  "小狼建议你试试没吃过的店✨", "心情好，吃什么都香😋", "今天适合来一碗热腾腾的汤🍲",
  "烤串啤酒是绝配🍢", "今天适合吃酸酸甜甜的菜🍍", "披萨日，芝士就是力量🧀",
  "日料控可以出动啦🍣", "今天适合吃油炸食品，开心最重要🍤", "轻食餐也不错，健康又美味🥗",
  "麻辣烫安排上，万物皆可烫🌶️", "今天适合吃咖喱，浓郁又下饭🍛", "面条星人出发吧🍝",
  "今天适合吃饺子，有家的味道🥟", "炒饭蛋炒饭，简单又满足🍚", "烤肉必须有，肉食动物冲呀🥩",
  "吃鱼变聪明，清蒸红烧都行🐟", "今天适合吃鸡，白切鸡黄焖鸡都行🐔", "汉堡薯条可乐，快乐三件套🍔",
  "今天适合吃早餐店的小笼包🥟", "吃个煎饼果子，元气满满🌯", "今天适合吃凉皮凉面，清爽🧊",
  "来一碗螺蛳粉，臭并快乐着🍜", "今天适合吃海鲜大餐🦞", "甜品下午茶，做个精致吃货🍰",
  "今天适合吃素食清清肠🥬", "火锅走起，红红火火🔥", "今天适合吃韩餐，泡菜开胃🥬",
  "吃个寿司拼盘，精致又美味🍣", "今天适合吃泰国菜，酸甜开胃🥘", "印度咖喱配烤饼，异域风情🌮",
  "今天适合吃牛肉面，汤浓肉香🍜", "吃个炸鸡配啤酒，快乐加倍🍗", "今天适合吃家常菜，简单幸福🏠",
  "试试学校附近新开的店，说不定有惊喜🎉", "今天适合吃包子豆浆，经典早餐🥛",
  "今天会有意想不到的小惊喜✨", "保持好心情，好运自然来🍀", "适合和朋友分享快乐，传递正能量💖",
  "今天适合尝试新事物，可能有新发现🔍", "学习效率高，加油！📚", "今天适合运动一下，出出汗更健康🏃",
  "记得给自己买点小零食，开心一下🍬", "今天可能会遇到有趣的人或事😊", "适合整理房间，心情会变好🧹",
  "今天适合听喜欢的音乐放松🎵", "给自己一个微笑，一切都会更好😊", "今天适合早点休息，养足精神🌙",
  "可能会收到好消息，保持期待📬", "今天适合做计划，未来更清晰🗓️", "运气不错，适合做重要决定⭐",
  "今天适合表达感谢，让关系更温暖❤️", "穿件喜欢的衣服，自信满满👕", "今天适合喝杯咖啡，慢慢享受☕",
  "给自己一个小目标，完成后奖励自己🎯", "今天适合拍张照片，记录美好📸"
];

const message = ref('点击抽签，看看今天吃什么运势~');
const cooldown = ref(0);
let timer = null;

/**
 * 抽签：随机显示一条正向签文，并进入10秒冷却
 */
function drawFortune() {
  if (cooldown.value > 0) return;
  message.value = fortunes[Math.floor(Math.random() * fortunes.length)];
  cooldown.value = 10;

  timer = setInterval(() => {
    cooldown.value--;
    if (cooldown.value <= 0) {
      clearInterval(timer);
      cooldown.value = 0;
    }
  }, 1000);
}
</script>

<style scoped>
.fortune-box {
  background: #fff;
  border: 1px dashed #e0a458;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
  text-align: center;
  cursor: pointer;
  transition: background 0.3s;
}
.fortune-box.disabled { cursor: not-allowed; background: #f5f0e8; }
.title { font-size: 12px; color: #888; }
.msg { font-size: 15px; margin-top: 4px; font-weight: 600; color: #8a6a4a; }
.cooldown { font-size: 11px; color: #bbb; margin-top: 4px; }
</style>