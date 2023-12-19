<template>
  <div ref="container" class="code-layout-group-dragger-host">
    <CodeLayoutPanelRender
      v-for="(panel, key) in group.children" :key="key"
      v-model:open="panel.open"
      :panel="panel"
      :horizontal="horizontal"
      :dragResizeable="getPanelDraggable(panel)"
      :dragResizeStartHandler="panelResizeDragStartHandler"
      :dragResizeHandler="panelResizeDraggingHandler"
      :alone="(group.children?.length === 1)"
      @toggleHandler="(v) => panelHandleOpenClose(panel, v)"
    >
      <template #default="data">
        <slot name="panelRender" v-bind="data" />
      </template>
    </CodeLayoutPanelRender>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import type { CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

const container = ref<HTMLElement>();

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
  contanterSizePx: number,
  index: number,
  baseLeft: number,
  startSizePx: number,
  prevPanel: CodeLayoutPanelInternal,
}

function getPanelDraggable(panel: CodeLayoutPanelInternal) {
  const groupArray = props.group.children;
  const index = groupArray.indexOf(panel);
  if (index === 0)
    return false;
  if (panel.open) {
    //如果当前面板已打开，先向上遍历，
    //如果上方有打开的面板，则当前面板可以调整大小
    for (let i = index; i > 0; i--){
      if (groupArray[i].open)
        return true;
    }
  } else {
    //如果当前面板没有打开，向下遍历，
    //如果下方有打开的面板，则当前面板可以调整大小
    for (let i = index; i < groupArray.length; i++){
      if (groupArray[i].open)
        return true;
    }
  }
  return false;
}

function panelGetMinSize(minSize: number, contanterSizePx: number) {
  if (minSize > 0 && minSize < 1)
    return minSize * 100;
  return (minSize / contanterSizePx) * 100;
}
function panelGetMinSize(minSize: number, contanterSizePx: number) {
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

  let startToPrevPanelSize = 0;
  for(let i = 0; i < index; i++) 
    startToPrevPanelSize += groupArray[i].size;

  const baseLeft = (props.horizontal ? 
    HtmlUtils.getLeft(container.value) : 
    HtmlUtils.getTop(container.value)
  );

  let prevPanel = null;
  for (let i = index; index >= 0; i--) {
    if (groupArray[i].open && groupArray[i].size > 0) {
      prevPanel = groupArray[i];
    }
  }

  return {
    index,
    contanterSizePx,
    startToPrevPanelSize,
    baseLeft,
    prevPanel,
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
    prevPanel,
    startSizePx,
    baseLeft,
  } = data as PanelResizeDragData;

  const sizePx = mousePx - baseLeft;
  const sizePrecent = (startSizePx / contanterSizePx) * 100;

  //拖拽调整大小实际上是调整当前面板与上一个面板的大小占比
  //如果调整大小小于最小值，则继续向更外面调整其他面板大小

  let bothSize = prevPanel.size + panel.size;

  //先调整前一个面板的大小
  let prevSize = (sizePrecent - startToPrevPanelSize);

  console.log(sizePrecent, '-', startToPrevPanelSize, (sizePrecent - startToPrevPanelSize));
  
  if (prevPanel.minSize)
    prevSize = Math.max(prevSize, panelGetMinSize(prevPanel.minSize, contanterSizePx));

  //再调整当前面板的大小
  let thisSize = bothSize - prevSize;
  if (panel.minSize)
    thisSize = Math.max(prevSize, panelGetMinSize(panel.minSize, contanterSizePx));

  prevPanel.size = prevSize;
  panel.size = thisSize;

  bothSize -= prevSize;
  bothSize -= thisSize;

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
  panel.open = open;

  //在当前面板打开时
  //  从下方面板取空余空间，如果下方没有空间，再向上取空余空间
  //在当前面板关闭时
  //  向下方面板添加空余空间，如果下方没有空间，再向上放空余空间

  if (open) {

  } else {

  }
}

defineExpose({
  panelHandleOpenClose,
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