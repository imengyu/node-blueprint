<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'code-layout-split-base',
      horizontal ? 'horizontal' : 'vertical',
    ]"
  >
    <div 
      v-for="(child, index) in grid.childGrid"
      :key="index"
      :style="{
        width: horizontal && child.visible ? `calc(${child.size}% - ${draggerSize}px)` : undefined,
        height: horizontal ? undefined : (child.visible ? `calc(${child.size}% - ${draggerSize}px)` : undefined),
      }"
      class="split-n-container"
    >
      <div 
        v-if="child.visible && index !== 0"
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
        v-if="child.visible"
        name="grid"
        :grid="child"
        :index="index"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import { createMouseDragHandler } from '@/node-blueprint/Editor/Graph/Editor/MouseHandler';
import { ref, type PropType, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import type { CodeLayoutSplitNGridInternal } from './SplitN';

const props = defineProps({
  grid: {
    type: Object as PropType<CodeLayoutSplitNGridInternal>,
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
  panel: CodeLayoutSplitNGridInternal, 
  size: number;
}

function adjustAndReturnAdjustedSize(
  containerSize: number, 
  panel: CodeLayoutSplitNGridInternal, 
  intitalSize: number, 
  increaseSize: number
) {
  
  let visibleChangedSize = 0;

  const intitalSizePx = intitalSize / 100 * containerSize; // to px
  const targetSize = intitalSizePx + increaseSize;
  const minSize = panel?.minSize || 0;
  const panelSize = Math.max(minSize, targetSize);

  if (panel.canMinClose && minSize > 0) {
    panel.visible = targetSize > minSize / 2;
    if (!panel.visible)
      visibleChangedSize += panelSize;
  }

  panel.size = panelSize / containerSize * 100; //to precent

  return { 
    adjustedSize: panelSize - intitalSizePx,
    visibleChangedSize,
  };
}
function getGridMinSize(grid: CodeLayoutSplitNGridInternal) {
  if (!splitBase.value)
    throw new Error('!splitBase.value');
  const containerSize = props.horizontal ? splitBase.value.offsetWidth : splitBase.value.offsetHeight;
  if (!grid.minSize)
    return 0;
  return grid.minSize / containerSize * 100;
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
        const p = props.grid.childGrid[i];
        if (!p.visible)
          continue;
        prevPanelsSize += p.size;
        prevOpenedPanels.push({ panel: p, size: p.size });
      }
      for (let i = index; i < props.grid.childGrid.length; i++) {
        const p = props.grid.childGrid[i];
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

      const containerSize = props.horizontal ? splitBase.value.offsetWidth : splitBase.value.offsetHeight;

      let dragSize = ((props.horizontal ? e.x : e.y) - baseLeft);
      let movedSize = dragSize - prevPanelsSize / 100 * containerSize; //to px
      if (movedSize === 0) 
        return;
      const moveDown = movedSize > 0;
      const resizeDown = (overflow: number) => {
        let needResizeSize = movedSize - overflow;
        let allVisibleChangedSize = 0;
        for (let i = 0; i < nextOpenedPanels.length; i++) {
          const p = nextOpenedPanels[i];
          const { adjustedSize, visibleChangedSize } = adjustAndReturnAdjustedSize(
            containerSize, 
            p.panel, 
            p.size, 
            -needResizeSize
          );
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
          const { adjustedSize, visibleChangedSize } = adjustAndReturnAdjustedSize(
            containerSize,
            p.panel, 
            p.size, 
            needResizeSize
          );
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

//获取当前容器可分配的大小
function getCanAllocSize() {
  if (!splitBase.value)
    throw new Error('!splitBase.value');

  const containerSize = props.horizontal ? splitBase.value.offsetWidth : splitBase.value.offsetHeight;
  let notAllocSpaceAndOpenCount = 0;
  let canAllocSize = 100;
  for (const grid of props.grid.childGrid) {
    grid.lastRelayoutSize = containerSize;
    if (grid.size > 0)
      canAllocSize -= grid.size;
    else
      notAllocSpaceAndOpenCount++;
  }

  return { 
    canAllocSize: Math.max(canAllocSize, 0), 
    notAllocSpaceAndOpenCount,
  };
}
//获取面板平均分配大小，用于初始化
function getAvgAllocSize() {
  const { canAllocSize, notAllocSpaceAndOpenCount } = getCanAllocSize();
  return notAllocSpaceAndOpenCount > 0 ?
    canAllocSize / notAllocSpaceAndOpenCount
    : 0;
}
//初始大小情况下，有可能有些面板空间还未分配，现在分配这些空间
function allocZeroGridSize() {
  const allocSize = getAvgAllocSize();
  for (const grid of props.grid.childGrid) {
    if (grid.size <= 0)
    grid.size = Math.max(allocSize, getGridMinSize(grid));
  }
}


/**
 * 当容器大小或者容器添加/删除时，重新布局已存在面板
 * 0. 计算容器大小变化了多少，是缩小还是放大
 * 1. 获取面板列表，按他们的的大小降序排列
 * 2. 按顺序依次减小/放大到最小值
 * 
 * @param resizedContainerSize 变化的大小，负数为放大，正数为缩小 (容器百分比)
 */
function relayoutAllWithResizedSize(resizedContainerSizePrecent: number) {

  if (!splitBase.value)
    throw new Error('!splitBase.value');

  const containerSizePrecent = 100;
  const containerSize = props.horizontal ? splitBase.value.offsetWidth : splitBase.value.offsetHeight;
  const resizeLarge = (resizedContainerSizePrecent < 0);

  let allPanelsSize = 0;
  const openedPanels = props.grid.childGrid.filter(p => {
    if (!p.visible)
      return false;
    allPanelsSize += p.size;
    return true;
  }).sort((a, b) => a.size > b.size ? 1 : -1);

  //放大情况，所有面板大小已大于容器对象，不再向其分配大小
  if (resizeLarge) {
    if (allPanelsSize >= containerSizePrecent)
      return;
    const overflow = allPanelsSize + (-resizedContainerSizePrecent) - containerSizePrecent;
    if (overflow > 0)
      resizedContainerSizePrecent -= (-overflow);
  }

  //向打开的面板分配大小
  for (let i = 0; i < openedPanels.length; i++) {
    const panel = openedPanels[i];
    const { adjustedSize } = adjustAndReturnAdjustedSize(containerSize, panel, panel.size, -resizedContainerSizePrecent);
    resizedContainerSizePrecent += adjustedSize;
    if (!resizeLarge && resizedContainerSizePrecent <= 0)
      break;
    if (resizeLarge && resizedContainerSizePrecent >= 0)
      break;
  }
}
//当容器添加时，重新布局已存在面板
function relayoutAllWithNewPanel(panels: CodeLayoutSplitNGridInternal[], referencePanel?: CodeLayoutSplitNGridInternal) {

  if (
    panels.length === 1 && referencePanel 
    && referencePanel.size > getGridMinSize(referencePanel) + getGridMinSize(panels[0])
  ) {
    //如果只有一个新网格，且新网格和拖拽目标网格宽度足够，则从他们中间平均分配
    const allocSize = referencePanel.size / 2;
    referencePanel.size = allocSize;
    panels[0].size = allocSize;
  } else {
    //否则平均重新分配全部网格
    for (const grid of props.grid.childGrid)
      grid.size = 0;
    allocZeroGridSize();
  }
} 
//当容器移除时，重新布局已存在面板
function relayoutAllWithRemovePanel(panel: CodeLayoutSplitNGridInternal) {
  relayoutAllWithResizedSize(-panel.size);
} 
//重新布局
function relayoutAll() {
  allocZeroGridSize();
}


//钩子函数
function loadPanelFunctions() {
  props.grid.listenLateAction('notifyRelayout', () => relayoutAll());
  props.grid.listenLateAction('relayoutAllWithNewPanel', relayoutAllWithNewPanel);
  props.grid.listenLateAction('relayoutAllWithResizedSize', relayoutAllWithResizedSize);
  props.grid.listenLateAction('relayoutAllWithRemovePanel', relayoutAllWithRemovePanel);
}
function unloadPanelFunctions(oldValue: CodeLayoutSplitNGridInternal) {
  oldValue.unlistenAllLateAction();
}

watch(() => props.grid, (newValue, oldValue) => {
  unloadPanelFunctions(oldValue);
  loadPanelFunctions()
});
watch(() => props.grid, () => {
  allocZeroGridSize();
})
watch(() => props.grid.childGrid.length, () => {
  allocZeroGridSize();
})

onMounted(() => {
  nextTick(() => {
    allocZeroGridSize();
    loadPanelFunctions();
  });
});
onBeforeUnmount(() => {
  unloadPanelFunctions(props.grid);
});

</script>

<style lang="scss">
@import "../Scss/Split.scss";
</style>
