<template>
  <div 
    ref="container" 
    :class="[
      'code-layout-group-dragger-host', 
      dragEnterState ? 'drag-enter' : '',
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @dragenter="handleDragEnter"
    @drop="handleDrop"
  >
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
      :collapsedSize="layoutConfig.panelHeaderHeight"
      @toggleHandler="panelHandleOpenClose"
    >
      <template #default="data">
        <slot name="panelRender" v-bind="data" />
      </template>
    </CodeLayoutPanelRender>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, type PropType, onMounted, nextTick, inject, watch, toRefs, onBeforeUnmount } from 'vue';
import type { CodeLayoutConfig, CodeLayoutContext, CodeLayoutPanelInternal } from './CodeLayout';
import { useResizeChecker } from './Composeable/ResizeChecker';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import { checkDropPanelDefault, getCurrentDragPanel, usePanelDragOverDetector } from './Composeable/DragDrop';

const container = ref<HTMLElement>();
const resizeDragging = ref(false);
const layoutConfig = inject('codeLayoutConfig') as Ref<CodeLayoutConfig>;
const context = inject('codeLayoutContext') as CodeLayoutContext;

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
const { group, horizontal } = toRefs(props);

function getPanelMinSize(minSize: number|undefined) {
  if (!minSize)
    return layoutConfig.value.panelMinHeight;
  return minSize;
}
function adjustAndReturnAdjustedSize(panel: CodeLayoutPanelInternal, intitalSize: number, increaseSize: number) {
  const targetSize = intitalSize + increaseSize;
  panel.size = Math.max(getPanelMinSize(panel.minSize), targetSize);
  return panel.size - intitalSize;
}


interface PanelResizePanelData {
  panel: CodeLayoutPanelInternal, 
  size: number;
}
interface PanelResizeDragData {
  prevPanelsSize: number; 
  nextPanelsSize: number; 
  nextOpenedPanels: PanelResizePanelData[];
  prevOpenedPanels: PanelResizePanelData[]; 
  firstPanelAbsolutePosScreen: number;
}

//拖拽处理函数: 拖拽开始
function panelResizeDragStartHandler(panel: CodeLayoutPanelInternal) {

  /**
   * 鼠标按下，做如下操作
   * 1. 获取第一个面板的顶部坐标（相对于屏幕），用于计算鼠标移动大小
   * 2. 获取当前拖拽线上方与下方打开的面板列表
   * 3. 获取当前拖拽线上/下方所有的面板列表大小
   */

  if (!container.value)
    return false;  
  const groupArray = props.group.children;
  const index = groupArray.indexOf(panel);
  if (index < 1)
    return false;
  const headerSize = layoutConfig.value.panelHeaderHeight;
  
  const firstPanelAbsolutePosScreen = (props.horizontal ? 
    (HtmlUtils.getLeft(container.value) - container.value.scrollLeft) : 
    (HtmlUtils.getTop(container.value) - container.value.scrollTop)
  );

  let prevPanelsSize = 0;
  let nextPanelsSize = 0;

  const prevOpenedPanels = [] as PanelResizePanelData[];
  const nextOpenedPanels = [] as PanelResizePanelData[];

  for (let i = index - 1; i >= 0; i--) {
    const p = groupArray[i];
    if (!p.visible)
      continue;
    prevPanelsSize += p.open ? p.size : headerSize;
    if (p.open)
      prevOpenedPanels.push({ panel: p, size: p.size });
  }
  for (let i = index; i < groupArray.length; i++) {
    const p = groupArray[i];
    if (!p.visible)
      continue;
    nextPanelsSize += p.open ? p.size : headerSize;
    if (p.open)
      nextOpenedPanels.push({ panel: p, size: p.size });
  }

  return {
    prevPanelsSize,
    nextPanelsSize,
    prevOpenedPanels,
    nextOpenedPanels,
    firstPanelAbsolutePosScreen,
  } as PanelResizeDragData
}
//拖拽处理函数: 拖拽中
function panelResizeDraggingHandler(_: CodeLayoutPanelInternal, data: unknown, mousePx: number) {

  const {
    prevPanelsSize,
    //nextPanelsSize,
    prevOpenedPanels,
    nextOpenedPanels,
    firstPanelAbsolutePosScreen,
  } = data as PanelResizeDragData 

  /**
   * 拖拽步骤：
   * 1. 通过鼠标坐标算出当前向上/下，以及移了多少
   * 2. 向上/下数组按顺序分配移动的距离
   */

  const newPrevPanelsSize = mousePx - firstPanelAbsolutePosScreen;
  let movedSize = newPrevPanelsSize - prevPanelsSize; 
  if (movedSize === 0) 
    return;
  const moveDown = movedSize > 0;

  const resizeDown = (overflow: number) => {
    let needResizeSize = movedSize - overflow;
    for (let i = 0; i < nextOpenedPanels.length; i++) {
      const p = nextOpenedPanels[i];
      needResizeSize += adjustAndReturnAdjustedSize(p.panel, p.size, -needResizeSize);
      if (moveDown ? needResizeSize <= 0 : needResizeSize >= 0)
        break;
    }
    return needResizeSize;
  }
  const resizeUp = (overflow: number) => {
    let needResizeSize = movedSize - overflow;
    for (let i = 0; i < prevOpenedPanels.length; i++) {
      const p = prevOpenedPanels[i];
      needResizeSize -= adjustAndReturnAdjustedSize(p.panel, p.size, needResizeSize);
      if (moveDown ? needResizeSize <= 0 : needResizeSize >= 0)
        break;
    }
    return needResizeSize;
  }

  if (moveDown) {
    //向下，下方减少大小，上方增加大小
    const overflow = resizeDown(0);
    resizeUp(overflow);
  } else {
    //向上
    const overflow = resizeUp(0);
    resizeDown(overflow);
  }

}

//面板打开和关闭时重新布局
function panelHandleOpenClose(panel: CodeLayoutPanelInternal, open: boolean) {
  panel.open = open;

  if (!container.value)
    return;
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;

  const groupArray = props.group.children;
  if (groupArray.length === 1) {
    panel.size = containerSize; //如果只有当前一个面板，则直接占满
    return;
  }

  //计算大小
  const headerSize = layoutConfig.value.panelHeaderHeight;
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
      if (!groupArray[i].visible)
        continue;
      if (groupArray[i].open && groupArray[i] !== panel) {
        onlyMeOpen = false;
        break;
      }
    }

    //只有我一个面板处于打开状态，此时无需为其他面板
    //调整大小，只需要把自己占满整个容器即可
    if (onlyMeOpen) {
      let spaceSize = 0;
      groupArray.forEach((p) => {
        if (p.visible)
          spaceSize += (p !== panel ? headerSize : 0)
      });//减去其他关闭的面板头部
      panel.size = Math.max(getPanelMinSize(panel.minSize), containerSize - spaceSize);
      return;
    }

    let needUseSize = panel.size - headerSize;

    const adjustPanelSize = (adjustPanel: CodeLayoutPanelInternal) => {
      //调整下方面板空间
      const adjustPanelMinSize = getPanelMinSize(adjustPanel.minSize);
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
      if (!adjustPanel.visible)
        continue;
      if (adjustPanel.open)
        adjustPanelSize(adjustPanel);

      //调整完毕，无需继续
      if (needUseSize <= 0)
        return;
    }

    //继续向上调整
    for (let i = index - 1; i >= 0; i--) {
      const adjustPanel = groupArray[i];
      if (!adjustPanel.visible)
        continue;
      if (adjustPanel.open)
        adjustPanelSize(adjustPanel);
    }

    //还有空间没有满足，继续调整自身
    if (needUseSize > 0) {
      panel.size = Math.max(
        panel.size - needUseSize, 
        getPanelMinSize(panel.minSize)
      );
    }

  } else {
    let freeSize = panel.size - headerSize;
    for (let i = index + 1; i < groupArray.length; i++) {
      const adjustPanel = groupArray[i];
      if (!adjustPanel.visible)
        continue;
      if (adjustPanel.open) {
        adjustPanel.size += freeSize;
        return;
      }
    }
    for (let i = index - 1; i >= 0; i--) {
      const adjustPanel = groupArray[i];
      if (!adjustPanel.visible)
        continue;
      if (adjustPanel.open) {
        adjustPanel.size += freeSize;
        return;
      }
    }
  }

}

//刷新列表的可拖拽状态
function flushDraggable() {
  /**
   * * 第一个面板永远不能显示拖拽条
   * * 上方有面板处于打开状态，则本面板显示拖拽条
   * * 下方没有一个面板处于打开状态，则本面板不显示拖拽条
   */
  let prevOpen = false;
  for (let i = 0; i < props.group.children.length; i++) {
    const panel = props.group.children[i];
    if (i > 0)
      panel.resizeable = panel.open || prevOpen;
    if (panel.open)
      prevOpen = true;
  }
  for (let i = props.group.children.length - 1; i >= 0; i--) {
    const panel = props.group.children[i];
    if (panel.resizeable && !panel.open)
      panel.resizeable = false;
    if (panel.open)
      break;
  }
}
function flushLayoutSizeCounter() {
  if (!container.value)
    return 0;
  const headerSize = layoutConfig.value.panelHeaderHeight;
  let counter = 0;
  for (let i = 0; i < props.group.children.length; i++) {
    const panel = props.group.children[i];
    if (!panel.visible)
      continue;
    counter += panel.open ? panel.size : headerSize;
  }
  group.value.lastLayoutSizeCounter = counter;
}

//获取当前容器可分配的大小
function getCanAllocSize() {
  if (!container.value)
    throw new Error('No container');
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  const headerSize = layoutConfig.value.panelHeaderHeight;

  let canAllocSize = containerSize, notAllocSpaceAndOpenCount = 0;

  props.group.children.forEach((panel) => {
    if (!panel.visible)
      return
    if (panel.open && panel.size > 0)
      canAllocSize -= panel.size;
    else if (panel.open)
      notAllocSpaceAndOpenCount ++
    else
      canAllocSize -= headerSize;
  });
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
//强制重新布局
function relayoutAll() {

  //初始大小情况下，有可能有些面板空间还未分配，现在分配这些空间
  const allocSize = getAvgAllocSize();
  props.group.children.forEach((panel) => {
    if (!panel.visible)
      return
    if (panel.size === 0)
      panel.size = panel.open ? 
        Math.max(allocSize, getPanelMinSize(panel.minSize)) : 
        getPanelMinSize(panel.minSize);
  });

  //调用大小更改重新布局方法
  relayoutAllWhenSizeChange();

  flushLayoutSizeCounter();
  flushDraggable();
}

/**
 * 当容器大小或者容器添加/删除时，重新布局已存在面板
 * 0. 计算容器大小变化了多少，是缩小还是放大
 * 1. 获取打开的面板列表，按他们的的大小降序排列
 * 2. 按顺序依次减小/放大到最小值
 * 
 * @param resizedContainerSize 变化的大小，负数为放大，正数为缩小
 */
function relayoutAllWithResizedSize(resizedContainerSize: number) {
  if (!container.value)
    return;

  let allPanelsSize = 0;
  const openedPanels = props.group.children.filter(p => {
    if (!p.visible)
      return false;
    allPanelsSize += p.open ? p.size : layoutConfig.value.panelHeaderHeight;
    return p.open;
  }).sort((a, b) => a.size > b.size ? 1 : -1);

  const resizeLarge = (resizedContainerSize < 0);
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;

  //放大情况，所有面板大小已大于容器对象，不再向其分配大小
  if (resizeLarge) {
    if (allPanelsSize >= containerSize)
      return;
    const overflow = allPanelsSize + (-resizedContainerSize) - containerSize;
    if (overflow > 0)
      resizedContainerSize -= (-overflow);
  }

  //向打开的面板分配大小
  for (let i = 0; i < openedPanels.length; i++) {
    const panel = openedPanels[i];
    resizedContainerSize += adjustAndReturnAdjustedSize(panel, panel.size, -resizedContainerSize);
    if (!resizeLarge && resizedContainerSize <= 0)
      break;
    if (resizeLarge && resizedContainerSize >= 0)
      break;
  }

  flushLayoutSizeCounter();
}
//当容器的大小更改后，重新布局
function relayoutAllWhenSizeChange() {
  if (!container.value)
    return;

  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  if (group.value.lastRelayoutSize === 0) {
    group.value.lastRelayoutSize = containerSize;
    return;
  }

  let resizedContainerSize = props.group.lastRelayoutSize - containerSize; 
  if (resizedContainerSize === 0)
    return;

  relayoutAllWithResizedSize(resizedContainerSize);
  
  group.value.lastRelayoutSize = containerSize;
}
//当容器添加时，重新布局已存在面板
function relayoutAllWithNewPanel(panels: CodeLayoutPanelInternal[]) {
  const headerHeight = layoutConfig.value.panelHeaderHeight;
  let resizedSize = 0;

  for (const panel of panels) {  
    //如果面板没有分配大小，则为其分配大小
    const avgAllocSize = getAvgAllocSize();
    if (panel.size <= 0) {
      const { canAllocSize } = getCanAllocSize();
      panel.size = panel.open ? 
        Math.max(Math.min(canAllocSize, avgAllocSize), getPanelMinSize(panel.minSize)) : 
        getPanelMinSize(panel.minSize);

      //分配大小后计算超出部分大小
      if (panel.open && panel.size > canAllocSize)
        resizedSize += panel.size - canAllocSize;
      else if (!panel.open && headerHeight > canAllocSize)
        resizedSize += headerHeight - canAllocSize;
    }
    else {
      //否则增加要调整的大小
      resizedSize += panel.open ? panel.size: headerHeight;
    }
  }

  //进行其他面板的收缩操作
  relayoutAllWithResizedSize(resizedSize);
  flushDraggable();
  flushLayoutSizeCounter();
} 
//当容器移除时，重新布局已存在面板
function relayoutAllWithRemovePanel(panel: CodeLayoutPanelInternal) {
  relayoutAllWithResizedSize(-(panel.open ? panel.size : layoutConfig.value.panelHeaderHeight));
} 

watch(() => props.group.children, () => {
  relayoutAll();
});

//更改大小后重新布局

const {
  startResizeChecker,
  stopResizeChecker
} = useResizeChecker(container, 
  props.horizontal ? relayoutAllWhenSizeChange : undefined,
  props.horizontal ? undefined : relayoutAllWhenSizeChange
);

//钩子函数
function loadPanelFunctions() {
  group.value.listenLateAction('notifyRelayout', () => relayoutAll());
  group.value.listenLateAction('relayoutAllWithNewPanel', relayoutAllWithNewPanel);
  group.value.listenLateAction('relayoutAllWithResizedSize', relayoutAllWithResizedSize);
  group.value.listenLateAction('relayoutAllWithRemovePanel', relayoutAllWithRemovePanel);
}
function unloadPanelFunctions(oldValue: CodeLayoutPanelInternal) {
  oldValue.unlistenAllLateAction();
}

watch(() => props.group, (newValue, oldValue) => {
  unloadPanelFunctions(oldValue);
  loadPanelFunctions()
});

//当前面板组空白区域的拖拽函数

const {
  dragEnterState,
  dragOverState,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  resetDragOverState,
} = usePanelDragOverDetector(
  container, group, horizontal, 
  () => {},
  (dragPanel) => {
    return (
      group.value.lastLayoutSizeCounter < group.value.lastRelayoutSize //仅容器有空白区域时才有效
      && checkDropPanelDefault(dragPanel, group.value, dragOverState)
    );
  }
);

function handleDrop(e: DragEvent) {
  const dropPanel = getCurrentDragPanel();
  if (dropPanel && dragOverState.value) {
    e.preventDefault();
    e.stopPropagation();

    const reference = group.value.getLastChildOrSelf();
    if (reference !== dropPanel) { 
      context.dragDropToPanelNear(
        reference, 
        'right', 
        dropPanel, 
        'empty'
      );
    }
  }
  resetDragOverState();
}

onMounted(() => {
  loadPanelFunctions();
  nextTick(() => {
    relayoutAll();
    startResizeChecker();
    relayoutAllWhenSizeChange();
    setTimeout(() => {
      relayoutAllWhenSizeChange();
    }, 200);
  });
});
onBeforeUnmount(() => {
  stopResizeChecker();
  unloadPanelFunctions(props.group);
});

</script>

<style lang="scss">
.code-layout-group-dragger-host {
  position: absolute;
  display: flex;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  &.drag-enter {
    * {
      pointer-events: none;
    }
    background-color: var(--code-layout-color-background-mask-light);
  }
}
</style>