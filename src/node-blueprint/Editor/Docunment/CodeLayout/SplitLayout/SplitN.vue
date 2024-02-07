<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'code-layout-split-base',
      horizontal ? 'horizontal' : 'vertical',
    ]"
  >
    <div 
      v-for="(grid, index) in grids"
      :key="index"
      :style="{
        width: horizontal ? `${grid.size - draggerSize}px` : undefined,
        height: horizontal ? undefined : `${grid.size - draggerSize}px`,
      }"
    >
      <slot 
        v-if="grid.visible"
        name="grid"
        :grid="grid"
        :index="index"
      />
      <div 
        v-if="grid.visible && index !== grids.length - 1"
        :class="[
          'code-layout-split-dragger resize inner',
          splitDragging[index] ? 'active' : '',
        ]" 
        :style="{
          width: horizontal ? `${draggerSize}px` : undefined,
          height: horizontal ? undefined : `${draggerSize}px`,
        }"
        @mousedown="dragHandler($event, index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import { createMouseDragHandler } from '@/node-blueprint/Editor/Graph/Editor/MouseHandler';
import { ref, type PropType } from 'vue';
import type { SplitNGird } from './SplitN';

const props = defineProps({
  grids: {
    type: Object as PropType<Array<SplitNGird>>,
    default: null,
  },
  /**
   * Set whether users can drag resize panels until the size is below the minimum value to close the panel.
   * 
   * Default: true
   */
  canMinClose: {
    type: Boolean,
    default: true,
  },
  /**
   * Is horizontal?
   * 
   * Default: true
   */
  horizontal: {
    type: Boolean,
    default: true,
  },
  /**
   * Set whether users can drag resize panels until the size is below the minimum value to close the panel.
   * 
   * Default: true
   */
  draggerSize: {
    type: Number,
    default: 1,
  },
});

const splitBase = ref<HTMLElement>();
const splitDragging = ref<boolean[]>([]);

let baseLeft = 0;

const dragHandler = createMouseDragHandler<number>({
  onDown(e, index) {
    if (splitBase.value) {
      baseLeft = HtmlUtils.getLeft(splitBase.value);
      splitDragging.value[index!] = true;
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e, index) {
    if (splitBase.value) {

      let dragSize = (e.x - baseLeft);
      let minSize = props.leftMinSize;
      if (minSize > 0 && minSize < 1)
        minSize = minSize * splitBase.value.offsetWidth;

      if (minSize > 0) {
        emit('closeLeft', dragSize > minSize / 2);
        dragSize = Math.max(minSize, dragSize)
      }

      emit('update:sizeLeft', (dragSize / splitBase.value.offsetWidth) * 100);
    }
  },
  onUp(e, index) {
    splitDragging.value[index!] = false;
  },
});

</script>

<style lang="scss">
@import "../Scss/Split.scss";
</style>
