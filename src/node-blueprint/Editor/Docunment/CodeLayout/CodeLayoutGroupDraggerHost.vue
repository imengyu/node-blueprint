<template>
  <div ref="container" class="code-layout-group-dragger-host">
    <CodeLayoutPanelRender
      v-for="(panel, key) in group.children" :key="key"
      v-model:open="panel.open"
      v-model:resizeDragging="resizeDragging"
      :panel="panel"
      :horizontal="horizontal"
      :dragResizeable="panel.resizeable"
      :dragResizeStartHandler="panelResizeDragStartHandler"
      :dragResizeHandler="panelResizeDraggingHandler"
      :alone="(group.children?.length === 1)"
      :collapsedSize="headerSizePrecent"
      @toggleHandler="panelHandleOpenClose"
    >
      <template #default="data">
        <slot name="panelRender" v-bind="data" />
      </template>
    </CodeLayoutPanelRender>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType, onMounted, nextTick, inject, watch, onBeforeUnmount } from 'vue';
import type { CodeLayoutConfig, CodeLayoutPanelInternal } from './CodeLayout';
import { useResizeChecker } from './Composeable/ResizeChecker';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import type { CodeLayoutContext, CodeLayoutGroupInstance } from './CodeLayout.vue';

const container = ref<HTMLElement>();
const resizeDragging = ref(false);
const layoutConfig = inject('layoutConfig') as CodeLayoutConfig;
const codeLayoutContext = inject('codeLayoutContext') as CodeLayoutContext;

const props = defineProps({
  group: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
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
});
const headerSizePrecent = ref(0);

interface PanelResizeDragData {
  startToPrevPanelSize: number,
  contanterSizePx: number,
  index: number,
  baseLeft: number,
  startSizePx: number,
  spaceSize: number,
  headerSizePx: number,
  panelSizes: number[],
  selfSize: number,
  prevPanelAndSelfSize: number,
  prevPanel: CodeLayoutPanelInternal,
}

function getPanelMinSize(minSize: number|undefined, contanterSizePx: number) {
  if (!minSize)
    return (layoutConfig.panelMinHeight / contanterSizePx) * 100;
  if (minSize > 0 && minSize < 1)
    return minSize * 100;
  return (minSize / contanterSizePx) * 100;
}


function panelAdjustAndReturnAdjustedSize(panel: CodeLayoutPanelInternal, newSize: number) {
  const oldSize = panel.size;
  panel.size = newSize;
  return newSize - oldSize;
}
function panelResizeDragStartHandler(panel: CodeLayoutPanelInternal, mousePx: number) {
  if (!container.value)
    return false;  
  const groupArray = props.group.children;
  const index = groupArray.indexOf(panel);
  if (index < 1)
    return false;

  const contanterSizePx = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  const headerSizePx = (layoutConfig.panelHeaderHeight / contanterSizePx) * 100;

  let startToPrevPanelSize = 0;
  for(let i = 0; i < index - 1; i++) 
    startToPrevPanelSize += groupArray[i].size;

  const baseLeft = (props.horizontal ? 
    HtmlUtils.getLeft(container.value) : 
    HtmlUtils.getTop(container.value)
  );

  let prevPanel = null;
  for (let i = index - 1; i >= 0; i--) {
    if (groupArray[i].open && groupArray[i].size > 0) {
      prevPanel = groupArray[i];
      break;
    }
  }


  const panelSizes = [] as number[];
  for (let i = 0; i < groupArray.length; i++)
    panelSizes[i] = groupArray[i].size;

  if (!prevPanel)
    throw new Error('no prevPanel');

  //计算可调整的最大大小，为100-非自己的面板最小大小
  let spaceSize = 100;
  groupArray.forEach((p) => spaceSize -= (p !== panel ? (p.open ? getPanelMinSize(p.minSize, contanterSizePx) : headerSizePx) : 0));

  const prevPanelAndSelfSize = prevPanel.size + panel.size;

  return {
    index,
    headerSizePx,
    contanterSizePx,
    startToPrevPanelSize,
    baseLeft,
    spaceSize,
    panelSizes,
    selfSize: panel.size,
    prevPanel,
    prevPanelAndSelfSize,
    startSizePx: mousePx - baseLeft,
  } as PanelResizeDragData
}
function panelResizeDraggingHandler(panel: CodeLayoutPanelInternal, data: unknown, mousePx: number) {
  if (!container.value)
    return;  
  const groupArray = props.group.children;

  const { 
    contanterSizePx,
    startToPrevPanelSize,
    index,
    spaceSize,
    panelSizes,
    prevPanelAndSelfSize,
    prevPanel,
    baseLeft,
  } = data as PanelResizeDragData;


  const sizePx = mousePx - baseLeft;
  const sizePrecent = (sizePx / contanterSizePx) * 100;

  //拖拽调整大小实际上是调整当前面板与上一个面板的大小占比
  //如果调整大小小于最小值，则继续向更外面调整其他面板大小

  //先调整前一个面板的大小
  const prevSize = (sizePrecent - startToPrevPanelSize);
  prevPanel.size = Math.min(spaceSize, Math.max(getPanelMinSize(prevPanel.minSize, contanterSizePx), prevSize));

  //再调整当前面板的大小
  panel.size = Math.max(prevPanelAndSelfSize - prevPanel.size, getPanelMinSize(panel.minSize, contanterSizePx));

  //鼠标移动的大小以及大于上面的面板可以调整的最小大小，剩余的需要更之前的面板来补偿
  let downOverflowSize = Math.abs(panel.size + prevPanel.size - prevPanelAndSelfSize);
  let upOverflowSize = (prevPanel.size - prevSize);

  //console.log('spaceSize', spaceSize, 'prev', prevPanel.size, 'this', panel.size, prevPanelAndSelfSize, overflowSize);

  //向下拖动超出
  if (downOverflowSize > 0) {
    for (let i = index + 1; i < groupArray.length; i++) {
      const adjustPanel = groupArray[i];
      if (adjustPanel.open) {
        const maxAdjustPanelSize = Math.min(
          downOverflowSize,
          panelSizes[i] - getPanelMinSize(panel.minSize, contanterSizePx)
        );
        adjustPanel.size = panelSizes[i] - maxAdjustPanelSize;
        downOverflowSize -= maxAdjustPanelSize;
        if (downOverflowSize < 0)
          break;
      }
    }
    //没有目标了还是超出，说明没有面板可供调整了，归还这些空间回去
    if (downOverflowSize > 0)
      downOverflowSize -= panelAdjustAndReturnAdjustedSize(prevPanel, prevPanel.size - downOverflowSize);
  }
  //向上拖动超出
  else if (upOverflowSize > 0) {
    for (let i = index - 2; i >= 0; i--) {

      const adjustPanel = groupArray[i];
      if (adjustPanel.open) {
        const maxAdjustPanelSize = Math.min(
          upOverflowSize,
          panelSizes[i] - getPanelMinSize(panel.minSize, contanterSizePx)
        );
        panel.size += maxAdjustPanelSize;
        adjustPanel.size = panelSizes[i] - maxAdjustPanelSize;
        upOverflowSize -= maxAdjustPanelSize;
        if (upOverflowSize < 0)
          break;
      }

    }
  }

}
function panelHandleOpenClose(panel: CodeLayoutPanelInternal, open: boolean) {
  if (!container.value)
    return;

  const groupArray = props.group.children;
  if (groupArray.length === 1) {
    panel.size = 100; //如果只有当前一个面板，则直接占满
    return;
  }

  //计算大小
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  const headerSize = (layoutConfig.panelHeaderHeight / containerSize) * 100;

  const index = groupArray.indexOf(panel);

  flushDraggable();

  //在当前面板打开时
  //  从下方面板取空余空间，如果下方没有空间，再向上取空余空间，
  //  如果还不够最后减少自己的大小直至最小值
  //在当前面板关闭时
  //  向下方面板添加空余空间，如果下方没有空间，再向上放空余空间

  if (open) {

    let onlyMeOpen = true;
    for (let i = 0; i < groupArray.length; i++) {
      if (groupArray[i].open && groupArray[i] !== panel) {
        onlyMeOpen = false;
        break;
      }
    }

    //只有我一个面板处于打开状态，此时无需为其他面板
    //调整大小，只需要把自己占满整个容器即可
    if (onlyMeOpen) {
      let spaceSize = 0;
      groupArray.forEach((p) => spaceSize += (p !== panel ? headerSize : 0));//减去其他关闭的面板头部
      panel.size = Math.max(getPanelMinSize(panel.minSize, containerSize), 100 - spaceSize);
      return;
    }

    let needUseSize = panel.size - headerSize;

    const adjustPanelSize = (adjustPanel: CodeLayoutPanelInternal) => {
      //调整下方面板空间
      const adjustPanelMinSize = getPanelMinSize(adjustPanel.minSize, containerSize);
      const adjustSize = Math.min(adjustPanel.size, needUseSize);

      needUseSize -= adjustSize;
      adjustPanel.size -= adjustSize;

      //当前面板最大情况下调整到最小值
      const adjustBackSize = adjustPanelMinSize - adjustPanel.size;
      if (adjustBackSize > 0) {
        adjustPanel.size = adjustPanelMinSize;
        needUseSize += adjustBackSize;
      }
    };

    for (let i = index + 1; i < groupArray.length; i++) {
      const adjustPanel = groupArray[i];
      if (adjustPanel.open)
        adjustPanelSize(adjustPanel);

      //调整完毕，无需继续
      if (needUseSize <= 0)
        return;
    }

    //继续向上调整
    for (let i = index - 1; i >= 0; i--) {
      const adjustPanel = groupArray[i];
      if (adjustPanel.open)
        adjustPanelSize(adjustPanel);
    }

    //还有空间没有满足，继续调整自身
    if (needUseSize > 0) {
      panel.size = Math.max(
        panel.size - needUseSize, 
        getPanelMinSize(panel.minSize, containerSize)
      );
    }

  } else {
    let freeSize = panel.size - headerSize;
    for (let i = index + 1; i < groupArray.length; i++) {
      const adjustPanel = groupArray[i];
      if (adjustPanel.open) {
        adjustPanel.size += freeSize;
        return;
      }
    }
    for (let i = index - 1; i >= 0; i--) {
      const adjustPanel = groupArray[i];
      if (adjustPanel.open) {
        adjustPanel.size += freeSize;
        return;
      }
    }
  }

}

//刷新列表的可拖拽状态
function flushDraggable() {
  let prevOpen = false;
  props.group.children.forEach((panel) => {
    panel.resizeable = panel.open && prevOpen;
    if (panel.open)
      prevOpen = true;
  });
}

//初始大小情况下，有可能有些面板空间还未分配，现在分配这些空间
function initAllPanelSizes() {
  if (!container.value)
    return;
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  const headerSize = (layoutConfig.panelHeaderHeight / containerSize) * 100;
  let allSize = 100, notAllocSpaceAndOpenCount = 0;

  props.group.children.forEach((panel) => {
    if (panel.open && panel.size === 0) 
      notAllocSpaceAndOpenCount++;
  });

  const allocSize = allSize / notAllocSpaceAndOpenCount;

  props.group.children.forEach((panel) => {
    if (panel.open) {
      if (panel.size > 0)
        allSize -= panel.size;
      else {
        const minSize = getPanelMinSize(panel.minSize, containerSize);
        panel.size = Math.max(allocSize, minSize);
      }
    } else
      allSize -= headerSize;
  });

  flushDraggable();
}

//当容器的大小更改后，重新布局
function relayoutAllWhenSizeChange() {
  if (!container.value)
    return;

  reCalcHeaderSize();

  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  const sizeRatios = [] as number[];
 
  let allSize = 100, allSizeForPrecent = 0;

  props.group.children.forEach((panel, i) => {
    sizeRatios[i] = panel.size;
    allSizeForPrecent += panel.size;
  });
  sizeRatios.forEach((v,i) => {
    sizeRatios[i] = v / allSizeForPrecent;
  });

  props.group.children.forEach((panel, i) => {
    if (panel.open) {
      const minSize = getPanelMinSize(panel.minSize, containerSize);
      panel.size = Math.max(sizeRatios[i] * allSize, minSize);
    }
  });
}

//重新计算头部大小
function reCalcHeaderSize() {
  if (!container.value)
    return headerSizePrecent.value = 0;
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  return headerSizePrecent.value = (layoutConfig.panelHeaderHeight / containerSize) * 100;
}

watch(() => props.group.children, () => {
  initAllPanelSizes();
});

//更改大小后重新布局

const {
  startResizeChecker,
  stopResizeChecker
} = useResizeChecker(container, 
  props.horizontal ? relayoutAllWhenSizeChange : undefined,
  props.horizontal ? undefined : relayoutAllWhenSizeChange
);

const instance : CodeLayoutGroupInstance = {
  notifyRelayout() {
    initAllPanelSizes();
  },
};

onMounted(() => {
  nextTick(() => {
    initAllPanelSizes();
    startResizeChecker();
    reCalcHeaderSize();
    codeLayoutContext.addGroup(instance);
  });
});
onBeforeUnmount(() => {
  stopResizeChecker();
  codeLayoutContext.removeGroup(instance);
});

</script>

<style lang="scss">
.code-layout-group-dragger-host {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
}
</style>