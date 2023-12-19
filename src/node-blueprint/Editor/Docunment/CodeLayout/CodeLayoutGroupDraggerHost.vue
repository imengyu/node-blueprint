<template>
  <CodeLayoutPanelRender
    v-for="(panel, key) in group.children" :key="key"
    v-model:open="panel.open"
    :panel="panel"
    :horizontal="horizontal"
    :draggable="getPanelDraggable(panel)"
    :alone="(group.children?.length === 1)"
  >
    <template #default="data">
      <slot name="panelRender" v-bind="data" />
    </template>
  </CodeLayoutPanelRender>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';

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

</script>

<style lang="scss">
@import "./Scss/Root.scss";


</style>