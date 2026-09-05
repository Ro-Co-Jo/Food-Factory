<!--
  RandomPicker.vue
  随机推荐组件：点击按钮随机推荐一家餐厅，并显示提示语与特效
-->
<template>
  <div class="random-box">
    <button class="random-btn" @click="pickRandom">🌸 今天吃什么~</button>
    <div class="random-result" v-if="current">
      <div>{{ getEmoji(current) }} {{ current.name }}</div>
      <div class="sub">{{ current.area }} · {{ current.cat1 }} · 💰{{ current.price }}</div>
    </div>
    <div class="random-msg">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getEmoji } from '@/utils/emoji';

const props = defineProps({
  restaurants: { type: Array, required: true },
});

let rollCount = 0;
const current = ref(null);
const message = ref('');

/**
 * 随机选择一家正常状态的餐厅
 */
function pickRandom() {
  const eligible = props.restaurants.filter(
    item => item.status === 'normal' || item.status === 'controversial'
  );
  if (!eligible.length) {
    message.value = '没有可推荐的店铺';
    current.value = null;
    return;
  }
  rollCount++;
  current.value = eligible[Math.floor(Math.random() * eligible.length)];

  if (rollCount === 1) message.value = '我知道，你肯定不想吃这个';
  else if (rollCount === 2) message.value = '这个可能也不想吃对不对！';
  else if (rollCount === 3) message.value = '嘿！嘿，我知道你还要再来一次';
  else if (rollCount >= 4 && rollCount <= 6) message.value = '好叭╮(╯-╰)╭，你继续吧~';
  else if (rollCount === 7) message.value = '再掷，就要收费了！';
  else if (rollCount === 8) message.value = '小狼要被你玩坏啦！';
  else if (rollCount === 9) message.value = '不要...ヽ（≧□≦）ノ再继续了！';
  else if (rollCount === 10) message.value = '还不饿吗？真的不能再看了！';
  else message.value = '发我微信，我告诉你要吃什么😋';
}
</script>

<style scoped>
.random-box {
  background: #fff;
  border: 1px solid #e5e0d8;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 14px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.random-btn {
  background: linear-gradient(135deg, #e0a458, #c96f6f);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 700;
  padding: 12px 26px;
  border-radius: 50px;
  cursor: pointer;
}
.random-result { margin-top: 12px; font-size: 19px; font-weight: 700; color: #b96d6d; }
.sub { font-size: 13px; color: #888; font-weight: 400; margin-top: 4px; }
.random-msg { font-size: 13px; color: #c96f6f; margin-top: 6px; min-height: 18px; }
</style>