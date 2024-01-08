<template>
  <div class="code-layout-scrollbar">
    <div 
      ref="container" 
      :class="'scroll-content ' + scroll"
      @scroll="calcScrollBarPosition"
    >
      <slot />
    </div>
    <div 
      v-if="scrollBarX.show"
      class="scrollbar horizontal"
      :style="{ height: `${scrollBarSize}px` }"
    >
      <div
        class="thumb"
        :style="{ left: `${scrollBarX.pos}%`, width: `${scrollBarX.size}%` }"
      />
    </div>
    <div 
      v-if="scrollBarY.show"
      class="scrollbar vertical"
      :style="{ width: `${scrollBarSize}px` }"
    >
      <div 
        class="thumb"
        :style="{ top: `${scrollBarY.pos}%`, height: `${scrollBarY.size}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, type PropType, reactive } from "vue";

const props = defineProps({	
  scroll: {
    type: String as PropType<'both'|'none'|'vertical'|'horizontal'>,
    default: 'both'
  },
  scrollBarSize: {
    type: Number,
    default: 8
  },
})

const container = ref<HTMLElement>();

const scrollBarX = reactive({
  show: false,
  size: 0,
  pos: 0,
});
const scrollBarY = reactive({
  show: false,
  size: 0,
  pos: 0,
});

let lastCalcScrollScrollWidth = 0;
let lastCalcScrollScrollHeight = 0;
let lastCalcScrollWidth = 0;
let lastCalcScrollHeight = 0;

const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      // 当样式属性发生改变时进行处理
      calcScroll();
    } else if (mutation.type === 'childList') {
      // 当子节点列表发生改变时进行处理
      calcScroll();
    }
  }
});
 
// 配置观察选项
const config = { attributes: true, childList: true };

function calcScrollBarPosition() {
  if (!container.value) 
    return;
  if (scrollBarX.show) {
    const sizePrecent = (container.value.offsetWidth / container.value.scrollWidth);
    scrollBarX.size = sizePrecent * 100;
    scrollBarX.pos = (container.value.scrollLeft / container.value.scrollWidth) * 100;
    if (sizePrecent >= 1)
      scrollBarX.show = false;
  }
  if (scrollBarY.show) {
    const sizePrecent = (container.value.offsetHeight / container.value.scrollHeight);
    scrollBarY.size = sizePrecent * 100;
    scrollBarY.pos = (container.value.scrollTop / container.value.scrollWidth) * 100;
    if (sizePrecent >= 1)
      scrollBarY.show = false;
  }
}

function calcScroll(force = false) {
  
  if (!container.value) 
    return;
  let canScrollX = props.scroll === 'horizontal' || props.scroll === 'both';
  let canScrollY = props.scroll === 'vertical' || props.scroll === 'both';

  const xScrollValueChanged = canScrollX && (lastCalcScrollScrollWidth !== container.value.scrollWidth
    || lastCalcScrollWidth !== container.value.offsetWidth); 
  const yScrollValueChanged = canScrollY && (lastCalcScrollScrollHeight !== container.value.scrollHeight 
    || lastCalcScrollHeight !== container.value.offsetHeight); 

  if (!force && !xScrollValueChanged && !yScrollValueChanged)
    return;

  const style = window.getComputedStyle(container.value);

  if (style.overflow === 'hidden' || style.overflowX === 'hidden') 
    canScrollX = false;
  if (style.overflow === 'hidden' || style.overflowY === 'hidden') 
    canScrollY = false;

  scrollBarX.show = canScrollX;
  scrollBarY.show = canScrollY;

  calcScrollBarPosition();

  lastCalcScrollWidth = container.value.offsetWidth;
  lastCalcScrollHeight = container.value.offsetHeight
  lastCalcScrollScrollWidth = container.value.scrollWidth;
  lastCalcScrollScrollHeight = container.value.scrollHeight;
}



onMounted(() => {
  nextTick(() => {
    calcScroll(true);
    observer.observe(container.value!, config);
  });
});
onBeforeUnmount(() => {
  observer.disconnect();
});

defineExpose({
  refreshScrollState() {
    calcScroll(true);
  },
})

</script>

<style lang="scss">
.code-layout-scrollbar {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;

  > .scroll-content {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
    &::-ms-scrollbar {
      width: 0;
      height: 0;
    }

    &.both {
      overflow: scroll;
    }
    &.horizontal {
      overflow-x: scroll;
    }
    &.vertical {
      overflow-y: scroll;
    }
  }

  > .scrollbar {
    position: absolute;

    .thumb {
      position: absolute;
      background-color: var(--code-layout-color-scrollbar-thumb);

      &:hover {
        background-color: var( --code-layout-color-scrollbar-thumb-light);
      }
    }

    &.horizontal {
      left: 0;
      bottom: 0;
      right: 0;

      .thumb {
        top: 0;
        bottom: 0;
      }
    }
    &.vertical {
      top: 0;
      bottom: 0;
      right: 0;

      .thumb {
        left: 0;
        right: 0;
      }
    }
  }
}
</style>