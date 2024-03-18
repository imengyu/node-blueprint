<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    ref="eleRef"
    class="nana-tooltip"
    role="tooltip"
    :style="{
      left: `${currentPos.x}px`,
      top: `${currentPos.y}px`,
    }"
  >
    <slot name="content">
      <span v-html="content" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, reactive, watch } from 'vue';

const props = defineProps({
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    default: '',
  },
})

const eleRef = ref<HTMLElement>();
const currentPos = reactive({ x: 0, y: 0});

function testAndAdjustPosition() {
  nextTick(() => {
    if (eleRef.value) {
    const xOverflow = document.documentElement.clientWidth - (currentPos.x + eleRef.value.offsetWidth);
    const yOverflow = document.documentElement.clientHeight - (currentPos.y + eleRef.value.offsetHeight);
      if (xOverflow < 0) currentPos.x += xOverflow;
      if (yOverflow < 0) currentPos.y += yOverflow;
    }
  });
}

watch(() => props.x, (v) => {
  currentPos.x = v;
  testAndAdjustPosition();
})
watch(() => props.y, (v) => {
  currentPos.x = v;
  testAndAdjustPosition();
})

onMounted(() => {
  currentPos.x = props.x;
  currentPos.y = props.y;
  testAndAdjustPosition();
})
</script>

<style lang="scss">
.nana-tooltip-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}
.nana-tooltip {
  display: inline-block;
  position: absolute;
  padding: 5px 10px;
  background-color: #fff;
  border: 1px solid #e9e9e9;
  border-radius: 5px;
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
  z-index: 200;
  font-size: 14px;
  color: #333;
  user-select: text;
  pointer-events: all;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: nana-tooltip-in ease-in-out 0.1s;

  span {
    white-space: pre;
    word-break: break-all;
    text-overflow: ellipsis;
  }
}

@keyframes nana-tooltip-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

</style>