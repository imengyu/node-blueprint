<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'mx-split-base',
      horizontal ? 'horizontal' : '',
    ]"
  >
    <div :style="{ width: `calc(${size}% - 2px)` }">
      <slot name="first" />
    </div>
    <div 
      :class="[
        'mx-split-dragger',
        canResize ? 'resize' : '',
      ]" 
      @mousedown="dragHandler"
    />
    <div :style="{ width: `calc(${100 - size}% - 1px)` }">
      <slot name="second" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import { createMouseDragHandler } from '@/node-blueprint/Editor/Graph/Editor/MouseHandler';
import { ref } from 'vue';

const emit = defineEmits([ 'update:size' ]);

const props = defineProps({
  /**
   * Set user can resize
   */
  canResize: {
    type: Boolean,
    default: true,
  },
  /**
   * Is horizontal?
   */
  horizontal: {
    type: Boolean,
    default: true,
  },
  /**
   * Size of base panel
   */
  size: {
    type: Number,
    default: 50,
  },
});

const splitBase = ref<HTMLElement>();

let baseLeft = 0;

const dragHandler = createMouseDragHandler({
  onDown(e) {
    if (splitBase.value) {
      baseLeft = (props.horizontal ? 
        HtmlUtils.getLeft(splitBase.value) : 
        HtmlUtils.getTop(splitBase.value)
      );
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if (splitBase.value) {
      let size = 0;
      if (props.horizontal)
        size = ((e.x - baseLeft) / splitBase.value.offsetWidth) * 100;
      else 
        size = ((e.y - baseLeft) / splitBase.value.offsetHeight) * 100;
      emit('update:size', size);
    }
  },
  onUp() {
  },
});

</script>

<style lang="scss">

.mx-split-base {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: flex-start;
  width: 100%;
  height: 100%;

  &.horizontal {
    flex-direction: row;
    justify-content: flex-start;
    align-items: stretch;

    > .mx-split-dragger {
      width: 3px;
      height: 100%;
      cursor: ew-resize;

      &::after {
        top: 0;
        bottom: 0;
        left: 1px;
        width: 1px;
      }
    }
  }

  > .mx-split-dragger {
    position: relative;
    height: 100%;
    width: 3px;
    cursor: ns-resize;

    &::after {
      position: absolute;
      content: '';
      top: 0;
      bottom: 0;
      left: 1px;
      width: 1px;
      background-color: #2a2a2a;
    }

    &.resize:hover {
      background-color: #0078d4;

      &::after {
        background-color: transparent;
      }
    }
  }
}
</style>