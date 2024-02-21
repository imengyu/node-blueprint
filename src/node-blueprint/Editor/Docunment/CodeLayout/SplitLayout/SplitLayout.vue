<template>
  <SplitNest :grid="(rootGrid as CodeLayoutSplitNGridInternal)">
    <template #grid="{ grid }">
      <slot name="tabRender" :grid="grid">
        <SplitTab 
          :grid="grid"
          @tabItemContextMenu="(a, b) => emit('panelContextMenu', a, b)"
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
import { ref, type PropType, provide } from 'vue';
import { defaultCodeLayoutConfig, type CodeLayoutLangConfig, type CodeLayoutConfig, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext } from '../CodeLayout';
import { CodeLayoutSplitNGridInternal, type CodeLayoutSplitLayoutContext, type CodeLayoutSplitNInstance, CodeLayoutSplitNPanelInternal } from './SplitN';
import SplitNest from './SplitNest.vue';
import SplitTab from './SplitTab.vue';

const props = defineProps({
  layoutConfig: {
    type: Object as PropType<CodeLayoutConfig>,
    default: () => defaultCodeLayoutConfig
  },
  langConfig: {
    type: Object as PropType<CodeLayoutLangConfig>,
    default: () => ({
      lang: 'en',
    }),
  },
});

const emit = defineEmits([ 'panelClose', 'panelContextMenu' ]);

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
const instance : CodeLayoutSplitNInstance = {
  getRootGrid: () => rootGrid.value as CodeLayoutSplitNGridInternal,
};

const context : CodeLayoutSplitLayoutContext = {
  /**
   * 拖放面板操作流程
   * 
   * 1. 获取网格
   * 2. 移除
   *    2.1 目标网格和当前父级网格相同，直接移除而不触发移除收缩
   *    2.2 目标网格和当前父级网格不同，调用 removePanelInternal 触发移除收缩
   * 3. 判断方向
   *    3.1 拖放切割方向与当前网格方向一致，则直接插入至指定位置
   *    3.2 方向不一致，
   *      3.2.1 新建一个网格，方向是相对方向
   *      3.2.2 将面板和当前面板添加至新网格的子级
   * 4. 重新布局计算面板大小
   * 
   * @param referencePanel 
   * @param referencePosition 
   * @param panel 
   */
  dragDropToPanel: (referencePanel, referencePosition, panel) => {

    //1
    let targetGrid : null|CodeLayoutSplitNGridInternal = null;
    if (referencePanel instanceof CodeLayoutSplitNGridInternal)
      targetGrid = referencePanel;
    else if (referencePanel instanceof CodeLayoutSplitNPanelInternal)
      targetGrid = referencePanel.parentGroup as CodeLayoutSplitNGridInternal;
    if (!targetGrid)
      return;

    //2
    if (panel.parentGroup === targetGrid)
      panel.parentGroup.removeChild(panel);
    else
      removePanelInternal(panel);

    //3
    if (
      (
        targetGrid.direction === 'horizontal'
        && (referencePosition === 'left' || referencePosition === 'right')
      )
      || 
      (
        targetGrid.direction === 'vertical'
        && (referencePosition === 'up' || referencePosition === 'down')
      )
    ) {
      //3.1
      targetGrid.addChild(
        panel, 
        targetGrid.children.indexOf(referencePanel)
      );
    } else {
      //3.2
    }


  }
};

/**
 * 移除面板操作流程
 * 
 * 
 * @param panel 
 */
function removePanelInternal(panel: CodeLayoutSplitNPanelInternal) {

  panel.parentGroup?.removeChild(panel);
}


provide('splitLayoutContext', context);
defineExpose(instance);

</script>