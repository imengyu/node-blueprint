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
import { ref, computed, type PropType, onMounted, nextTick, inject, watch } from 'vue';
import type { CodeLayoutConfig, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

const container = ref<HTMLElement>();
const resizeDragging = ref(false);

const layoutConfig = inject('layoutConfig') as CodeLayoutConfig;

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

const headerSizePrecent = computed(() => {
  if (!container.value)
    return 0;
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  return (layoutConfig.panelHeaderHeight / containerSize) * 100;
});

interface PanelResizeDragData {
  startToPrevPanelSize: number,
  contanterSizePx: number,
  index: number,
  baseLeft: number,
  startSizePx: number,
  spaceSize: number,
  headerSizePx: number,
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
  for (let i = index; i >= 0; i--) {
    if (groupArray[i].open && groupArray[i].size > 0) {
      prevPanel = groupArray[i];
    }
  }

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
    prevPanelAndSelfSize,
    prevPanel,
    startSizePx,
    baseLeft,
  } = data as PanelResizeDragData;

  const sizePx = mousePx - baseLeft;
  const sizePrecent = (sizePx / contanterSizePx) * 100;

  //拖拽调整大小实际上是调整当前面板与上一个面板的大小占比
  //如果调整大小小于最小值，则继续向更外面调整其他面板大小
  let bothSize = prevPanelAndSelfSize

  //先调整前一个面板的大小
  const prevSize = (sizePrecent - startToPrevPanelSize);
  prevPanel.size = Math.min(spaceSize, Math.max(prevSize, getPanelMinSize(prevPanel.minSize, contanterSizePx)));
  bothSize -= prevPanel.size;


  //再调整当前面板的大小
  const thisSize = bothSize;
  panel.size =  Math.max(thisSize, getPanelMinSize(panel.minSize, contanterSizePx));
  bothSize -= panel.size;

  console.log(prevPanel.size, panel.size, bothSize);

  //鼠标移动的大小以及大于上面的面板可以调整的最小大小，剩余的需要更之前的面板来补偿
  if (bothSize > 0) {

    if (sizePx > startSizePx) {
      //向下拖动



    } else {
      //向上拖动


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
    const freeSize = panel.size - headerSize;
    const adjustPanel = index < groupArray.length - 1 ? groupArray[index + 1] : groupArray[index - 1];
    if (adjustPanel)
      adjustPanel.size += freeSize;
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

watch(() => props.group.children, () => {
  initAllPanelSizes();
});

onMounted(() => {
  nextTick(() => {
    initAllPanelSizes();
  })
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