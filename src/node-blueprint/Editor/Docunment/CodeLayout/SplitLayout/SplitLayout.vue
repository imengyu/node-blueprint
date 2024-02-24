<template>
  <SplitNest :grid="(rootGrid as CodeLayoutSplitNGridInternal)">
    <template #grid="{ grid }">
      <slot name="tabRender" :grid="grid">
        <SplitTab 
          :grid="grid"
          @tabItemContextMenu="(a, b) => emit('panelContextMenu', a, b)"
          @tabActive="(a, b) => emit('panelActive', a, b)"
        >
          <template #tabContentRender="params">
            <slot name="tabContentRender" v-bind="params" />
          </template>
          <template #tabEmptyContentRender="params">
            <slot name="tabEmptyContentRender" v-bind="params" />
          </template>
          <template #tabHeaderExtraRender="params">
            <slot name="tabHeaderExtraRender" v-bind="params" />
          </template>
          <template #tabItemRender="params">
            <slot name="tabItemRender" v-bind="params" />
          </template>
        </SplitTab>
      </slot>
    </template>
  </SplitNest>
</template>

<script setup lang="ts">
import { ref, provide, type Ref } from 'vue';
import type { CodeLayoutPanelInternal, CodeLayoutPanelHosterContext } from '../CodeLayout';
import { CodeLayoutSplitNGridInternal, type CodeLayoutSplitLayoutContext, type CodeLayoutSplitNInstance, CodeLayoutSplitNPanelInternal } from './SplitN';
import SplitNest from './SplitNest.vue';
import SplitTab from './SplitTab.vue';

const emit = defineEmits([ 
  'panelClose', 
  'panelContextMenu',
  'panelActive',
]);

const panelInstances = new Map<string, CodeLayoutPanelInternal>();
const hosterContext : CodeLayoutPanelHosterContext = {
  panelInstances,
  removePanelInternal,
  closePanelInternal(panel) {
    new Promise<void>((resolve, reject) => emit('panelClose', panel, resolve, reject))
      .then(() => panel.parentGroup?.removePanel(panel))
      .catch(() => { /*ignore*/ })
  },
}
const rootGrid = ref(new CodeLayoutSplitNGridInternal(hosterContext));
rootGrid.value.size = 100;
rootGrid.value.accept = [ 'centerArea' ];
rootGrid.value.parentGrid = 'centerArea';
rootGrid.value.noAutoShink = true;
const currentActiveGrid = ref<CodeLayoutSplitNGridInternal|null>(null);

const instance : CodeLayoutSplitNInstance = {
  getRootGrid: () => rootGrid.value as CodeLayoutSplitNGridInternal,
  getPanelByName: (name) => panelInstances.get(name),
  getActiveGird: () => (currentActiveGrid.value || rootGrid.value) as CodeLayoutSplitNGridInternal,
  activePanel(name) {
    panelInstances.get(name)?.activeSelf();
  },
};

const context : CodeLayoutSplitLayoutContext = {
  currentActiveGrid: currentActiveGrid as Ref<CodeLayoutSplitNGridInternal|null>,
  activeGrid(grid) { currentActiveGrid.value = grid; },
  /**
   * 拖放面板操作流程
   * 
   * 1. 获取网格
   * 2. 移除
   *    2.1 目标网格和当前父级网格相同，直接移除而不触发移除收缩
   *    2.2 目标网格和当前父级网格不同，调用 removePanelInternal 触发移除收缩
   * 3. 判断方向
   *    3.1 拖放到网格中或者TAB，则直接插入至网格中指定位置
   *    3.2 拖放切割方向与当前网格方向一致
   *      创建新网格包围当前面板
   *      插入至指定位置
   *    3.3 方向不一致，
   *      3.3.1 新建一个网格，方向是相对方向
   *      3.3.2 将面板和当前面板添加至新网格的子级
   * 4. 重新布局计算网格大小
   * 
   * @param referencePanel 
   * @param referencePosition 
   * @param panel 
   */
  dragDropToPanel: (referencePanel, referencePosition, panel, toTab) => {

    //1
    let targetGrid : null|CodeLayoutSplitNGridInternal = null;
    if (referencePanel instanceof CodeLayoutSplitNGridInternal)
      targetGrid = referencePanel;
    else if (referencePanel instanceof CodeLayoutSplitNPanelInternal)
      targetGrid = referencePanel.parentGroup as CodeLayoutSplitNGridInternal;
    if (!targetGrid)
      return;

    //2
    if (panel.parentGroup !== targetGrid || referencePosition !== 'center' || !toTab) {
      const shrinkPanel = panel.removeSelfWithShrink();
      //上方面板移除后可能结构已发生变化，需要重新获取父级
      if (shrinkPanel)
        targetGrid = shrinkPanel as CodeLayoutSplitNGridInternal;
    }

    const targetGridParent = targetGrid.parentGroup as CodeLayoutSplitNGridInternal;

    //3
    if (referencePosition === 'center' || toTab) {
      //3.1
      if (!targetGrid.hasChild(panel))
        targetGrid.addChild(
          panel, 
          targetGrid.children.indexOf(referencePanel) 
            + (referencePosition === 'right' || referencePosition === 'down' ? 1 : 0)
        );
      targetGrid.setActiveChild(panel);
    } else if (
      targetGridParent && (
      (
        targetGridParent.direction === 'horizontal'
        && (referencePosition === 'left' || referencePosition === 'right')
      )
      || (
        targetGridParent.direction === 'vertical'
        && (referencePosition === 'up' || referencePosition === 'down')
      )
      )
    ) {
      //3.2
      const newGrid = new CodeLayoutSplitNGridInternal(targetGridParent.context);//新面板包围的网格
      Object.assign(newGrid, {
        ...targetGrid,
        direction: targetGrid.direction,
        name: targetGrid.name + Math.floor(Math.random() * 10),
        children: [],
        childGrid: [],
        size: 0,
      });
      newGrid.addChild(panel);
      newGrid.setActiveChild(panel);
      targetGridParent.addChildGrid(
        newGrid, 
        targetGridParent.childGrid.indexOf(targetGrid)
          + (referencePosition === 'down' || referencePosition === 'right' ? 1 : 0)
      );
      targetGridParent.relayoutAllWithNewPanel([ newGrid ], targetGrid);
    } else {
      //3.3
      const oldParent = targetGrid.parentGroup as CodeLayoutSplitNGridInternal;
      const newGridTop = new CodeLayoutSplitNGridInternal(targetGrid.context);//上级包围的网格
      const newGrid = new CodeLayoutSplitNGridInternal(targetGrid.context);//新面板包围的网格
      Object.assign(newGrid, {
        ...targetGrid,
        direction: targetGrid.direction === 'vertical' ? 'horizontal' : 'vertical',//相对的方向
        name: targetGrid.name + Math.floor(Math.random() * 10),
        children: [],
        childGrid: [],
        size: 0,
      });
      Object.assign(newGridTop, {
        ...targetGrid,
        name: targetGrid.name + Math.floor(Math.random() * 10),
        direction: targetGrid.direction,
        children: [],
        childGrid: [],
      });
      targetGrid.size = 0; //设为0以让后续进行布局
      newGridTop.addChildGrid(targetGrid);
      newGrid.addChild(panel);

      switch (referencePosition) {
        case 'left':
        case 'up':
          newGridTop.addChildGrid(newGrid, 0);
          break;
        case 'right':
        case 'down':
          newGridTop.addChildGrid(newGrid);
          break;
      }

      newGrid.setActiveChild(panel);
      oldParent.replaceChildGrid(targetGrid, newGridTop);

      //重新布局面板
      newGrid.notifyRelayout();
      newGridTop.notifyRelayout();
    }


  }
};

/**
 * 移除面板操作流程
 * 
 * 1. 从父级网格移除当前面板
 * 2. 检查是否还有其他面板
 *    2.1 如果有，重新选择其他面板激活
 *    2.2 如果没有，并且网格允许收缩，则收缩此网格
 *      2.2.1 移除网格
 *      2.2.2 如果父网格只剩余一个子网格，
 *        则收缩此子网格，将其与父网格替换
 * 
 * @param panel 
 */
function removePanelInternal(panel: CodeLayoutSplitNPanelInternal) {

  const targetGrid = panel.parentGroup as CodeLayoutSplitNGridInternal;
  if (!targetGrid)
    return undefined;

  //1
  targetGrid.removeChild(panel);

  //2.1
  if (targetGrid.children.length > 0) {
    targetGrid.reselectActiveChild();
    return undefined;
  }

  //2.2

  if (targetGrid.noAutoShink)
    return undefined;
  
  const targetGridParent = targetGrid.parentGroup as CodeLayoutSplitNGridInternal;
  targetGridParent.removeChildGrid(targetGrid);

  //2.2.2
  if (targetGridParent.childGrid.length === 1) {
    const oldChilds = targetGridParent.childGrid[0].children;
    const oldActivePanel = targetGridParent.childGrid[0].activePanel;

    targetGridParent.children = oldChilds;
    targetGridParent.activePanel = oldActivePanel;
    targetGridParent.removeChildGrid(targetGridParent.childGrid[0]);
    for (const child of oldChilds)
      child.parentGroup = targetGridParent;
  }

  return targetGridParent;
}


provide('splitLayoutContext', context);
defineExpose(instance);

</script>