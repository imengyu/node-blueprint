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
        width: horizontal && grid.visible ? `${grid.size - draggerSize}px` : undefined,
        height: horizontal ? undefined : (grid.visible ? `${grid.size - draggerSize}px` : undefined),
      }"
      class="split-n-container"
    >
      <div 
        v-if="grid.visible && index !== 0"
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
      <slot 
        v-if="grid.visible"
        name="grid"
        :grid="grid"
        :index="index"
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
let prevPanelsSize = 0;
const prevOpenedPanels = [] as PanelResizePanelData[];
const nextOpenedPanels = [] as PanelResizePanelData[];

interface PanelResizePanelData {
  panel: SplitNGird, 
  size: number;
}

function adjustAndReturnAdjustedSize(panel: SplitNGird, intitalSize: number, increaseSize: number) {
  const targetSize = intitalSize + increaseSize;
  const minSize = panel?.minSize || 0;
  let visibleChangedSize = 0;
  panel.size = Math.max(minSize, targetSize);
  if (panel.canMinClose && minSize > 0) {
    panel.visible = targetSize > minSize / 2;
    if (!panel.visible)
      visibleChangedSize += panel.size;
  }
  return { 
    adjustedSize: panel.size - intitalSize,
    visibleChangedSize,
  };
}

const dragHandler = createMouseDragHandler<number>({
  onDown(e, index) {
    if (splitBase.value && typeof index === 'number') {
      baseLeft = props.horizontal ? HtmlUtils.getLeft(splitBase.value!) : HtmlUtils.getTop(splitBase.value!);
      splitDragging.value[index!] = true;
      prevPanelsSize = 0;
      prevOpenedPanels.splice(0);
      nextOpenedPanels.splice(0);
      for (let i = index - 1; i >= 0; i--) {
        const p = props.grids[i];
        if (!p.visible)
          continue;
        prevPanelsSize += p.size;
        prevOpenedPanels.push({ panel: p, size: p.size });
      }
      for (let i = index; i < props.grids.length; i++) {
        const p = props.grids[i];
        if (!p.visible)
          continue;
        nextOpenedPanels.push({ panel: p, size: p.size });
      }    
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e, index) {
    if (splitBase.value && typeof index === 'number') { 
      /**
       * 拖拽步骤：
       * 1. 通过鼠标坐标算出当前向上/下，以及移了多少
       * 2. 向上/下数组按顺序分配移动的距离
       */

      let dragSize = ((props.horizontal ? e.x : e.y) - baseLeft);
      let movedSize = dragSize - prevPanelsSize; 
      if (movedSize === 0) 
        return;
      const moveDown = movedSize > 0;
      const resizeDown = (overflow: number) => {
        let needResizeSize = movedSize - overflow;
        let allVisibleChangedSize = 0;
        for (let i = 0; i < nextOpenedPanels.length; i++) {
          const p = nextOpenedPanels[i];
          const { adjustedSize, visibleChangedSize } = adjustAndReturnAdjustedSize(p.panel, p.size, -needResizeSize);
          allVisibleChangedSize += visibleChangedSize;
          needResizeSize += adjustedSize;
          if (moveDown ? needResizeSize <= 0 : needResizeSize >= 0)
            break;
        }
        return {
          overflowSize: needResizeSize,
          visibleChangedSize: allVisibleChangedSize
        };
      }
      const resizeUp = (overflow: number) => {
        let needResizeSize = movedSize - overflow;
        let allVisibleChangedSize = 0;
        for (let i = 0; i < prevOpenedPanels.length; i++) {
          const p = prevOpenedPanels[i];
          const { adjustedSize, visibleChangedSize } = adjustAndReturnAdjustedSize(p.panel, p.size, needResizeSize);
          needResizeSize -= adjustedSize;
          allVisibleChangedSize += visibleChangedSize;
          if (moveDown ? needResizeSize <= 0 : needResizeSize >= 0)
            break;
        }
        return {
          overflowSize: needResizeSize,
          visibleChangedSize: allVisibleChangedSize
        };
      }

      if (moveDown) {
        //向下，下方减少大小，上方增加大小
        const { overflowSize, visibleChangedSize } = resizeDown(0);
        if (visibleChangedSize !== 0)
          movedSize += visibleChangedSize;
        resizeUp(overflowSize);
      } else {
        //向上
        const { overflowSize, visibleChangedSize } = resizeUp(0);
        if (visibleChangedSize !== 0)
          movedSize -= visibleChangedSize;
        resizeDown(overflowSize);
      }
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
