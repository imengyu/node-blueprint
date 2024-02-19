<template>
  <SplitNest :grid="(rootGrid as CodeLayoutSplitNGridInternal)">
    <template #grid="{ grid }">
      <slot name="tabRender" :grid="grid">
        <SplitTab :grid="grid">
          <template #tabContentRender="params">
            <slot name="tabContentRender" v-bind="params" />
          </template>
          <template #tabEmptyContentRender="params">
            <slot name="tabEmptyContentRender" v-bind="params" />
          </template>
        </SplitTab>
      </slot>
    </template>
  </SplitNest>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import SplitNest from './SplitNest.vue';
import { defaultCodeLayoutConfig, type CodeLayoutLangConfig, type CodeLayoutConfig, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext } from '../CodeLayout';
import { CodeLayoutSplitNGridInternal, type CodeLayoutSplitNInstance } from './SplitN';
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

const panelInstances = new Map<string, CodeLayoutPanelInternal>();
const hosterContext : CodeLayoutPanelHosterContext = {
  panelInstances,
  removePanelInternal() {},
}
const rootGrid = ref(new CodeLayoutSplitNGridInternal(hosterContext));
rootGrid.value.size = 100;
const instance : CodeLayoutSplitNInstance = {
  getRootGrid: () => rootGrid.value as CodeLayoutSplitNGridInternal,
};

defineExpose(instance);

</script>