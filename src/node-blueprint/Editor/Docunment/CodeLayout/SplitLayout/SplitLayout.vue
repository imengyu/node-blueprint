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
import SplitNest from './SplitNest.vue';
import { defaultCodeLayoutConfig, type CodeLayoutLangConfig, type CodeLayoutConfig, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext, type CodeLayoutContext, type CodeLayoutDragDropReferencePosition, type CodeLayoutGrid } from '../CodeLayout';
import { CodeLayoutSplitNGridInternal, type CodeLayoutSplitLayoutContext, type CodeLayoutSplitNInstance } from './SplitN';
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
  removePanelInternal(panel) {
    panel.parentGroup?.removeChild(panel);
  },
  closePanelInternal(panel) {
    new Promise<void>((resolve, reject) => emit('panelClose', panel, resolve, reject))
      .then(() => panel.parentGroup?.removePanel(panel))
      .catch(() => { /*ignore*/ })
  },
}
const rootGrid = ref(new CodeLayoutSplitNGridInternal(hosterContext));
rootGrid.value.size = 100;
rootGrid.value.accept = [ 'centerArea' ];
const instance : CodeLayoutSplitNInstance = {
  getRootGrid: () => rootGrid.value as CodeLayoutSplitNGridInternal,
};

const context : CodeLayoutSplitLayoutContext = {
  dragDropToPanel: (referencePanel, referencePosition, panel) => {

  }
};


provide('splitLayoutContext', context);
defineExpose(instance);

</script>