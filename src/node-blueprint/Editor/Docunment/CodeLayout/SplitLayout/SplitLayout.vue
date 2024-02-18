<template>
  <SplitNest :grid="(rootGrid as CodeLayoutSplitNGridInternal)" />
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import SplitNest from './SplitNest.vue';
import { defaultCodeLayoutConfig, type CodeLayoutLangConfig, type CodeLayoutConfig, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext } from '../CodeLayout';
import { CodeLayoutSplitNGridInternal, type CodeLayoutSplitNInstance } from './SplitN';

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