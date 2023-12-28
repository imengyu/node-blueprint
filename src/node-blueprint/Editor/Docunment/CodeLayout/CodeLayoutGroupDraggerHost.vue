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

interface PanelResizeDragData {
  startToPrevPanelSize: number,
  prevPanelToSelfSize: number,
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

function getPanelMinSize(minSize: number|undefined) {
  if (!minSize)
    return layoutConfig.panelMinHeight;
  return minSize;
}


function panelAdjustAndReturnAdjustedSize(panel: CodeLayoutPanelInternal, newSize: number) {
  const oldSize = panel.size;
  panel.size = newSize;
  return newSize - oldSize;
}
function panelResizeDragStartHandler(panel: CodeLayoutPanelInternal, mousePx: number) {

  /**
   * 鼠标按下，做如下操作
   * 1. 获取当前面板上方
   * 
   */

  if (!container.value)
    return false;  
  const groupArray = props.group.children;
  const index = groupArray.indexOf(panel);
  if (index < 1)
    return false;

  const contanterSizePx = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
 
  return {

  } as PanelResizeDragData
}
function panelResizeDraggingHandler(panel: CodeLayoutPanelInternal, data: unknown, mousePx: number) {

}
function panelHandleOpenClose(panel: CodeLayoutPanelInternal, open: boolean) {
  if (!container.value)
    return;
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;

  const groupArray = props.group.children;
  if (groupArray.length === 1) {
    panel.size = containerSize; //如果只有当前一个面板，则直接占满
    return;
  }

  //计算大小
  const headerSize = layoutConfig.panelHeaderHeight;
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
        getPanelMinSize(panel.minSize)
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

//初始大小情况下，有可能有些面板空间还未分配，现在分配这些空间
function initAllPanelSizes() {
  if (!container.value)
    return;
  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  const headerSize = layoutConfig.panelHeaderHeight;
  let allSize = containerSize, notAllocSpaceAndOpenCount = 0;

  props.group.children.forEach((panel) => {
    if (panel.open && panel.size === 0) 
      notAllocSpaceAndOpenCount++;
  });

  const allocSize = allSize / notAllocSpaceAndOpenCount;

  props.group.children.forEach((panel) => {
    if (panel.open) {
      if (panel.size > 0)
        allSize -= panel.size;
      else
        panel.size = Math.max(allocSize, getPanelMinSize(panel.minSize));
    } else
      allSize -= headerSize;
  });

  flushDraggable();
}

let lastRelayoutSize = 0;

//当容器的大小更改后，重新布局
function relayoutAllWhenSizeChange() {
  if (!container.value)
    return;

  const containerSize = props.horizontal ? container.value.offsetWidth : container.value.offsetHeight;
  if (lastRelayoutSize === 0) {
    lastRelayoutSize = containerSize;
    return;
  }

  /**
   * 0. 计算容器大小变化了多少，是缩小还是放大
   * 1. 获取打开的面板列表，按他们的的大小降序排列
   * 2. 按顺序依次减小/放大到最小值
   */

  let resizedContainerSize = lastRelayoutSize - containerSize; 
  if (resizedContainerSize === 0)
    return;

  const openedPanels = props.group.children.filter(p => p.open).sort((a, b) => a.size > b.size ? 1 : -1);

  if (resizedContainerSize > 0) {
    //缩小
    openedPanels.forEach((panel) => 
      resizedContainerSize -= panelAdjustAndReturnAdjustedSize(
        panel, 
        Math.max(getPanelMinSize(panel.minSize), panel.size - resizedContainerSize)
      )
    );
  } else {
    //放大
    openedPanels.forEach((panel) => 
      resizedContainerSize += panelAdjustAndReturnAdjustedSize(
        panel, 
        Math.max(getPanelMinSize(panel.minSize), panel.size - resizedContainerSize)
      )
    );
  }

  lastRelayoutSize = containerSize;
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
    relayoutAllWhenSizeChange();
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