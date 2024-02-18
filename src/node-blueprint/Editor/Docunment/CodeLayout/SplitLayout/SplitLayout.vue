<template>
  <SplitN
    :grids="grid.children"
    :horizontal="grid.direction === 'horizontal'"
  >
    <template #grid="{ grid: childGrid, index }">
      <SplitLayout 
        v-if="(childGrid as SplitGird).children?.length"
        :grid="(childGrid as SplitGird)"
      >
        <template #grid="param">
          <slot name="grid" v-bind="param" />
        </template>
      </SplitLayout>
      <slot v-else name="grid" :grid="childGrid" :index="index" />
    </template>
  </SplitN>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import SplitN from './SplitN.vue';
import { defaultCodeLayoutConfig, type CodeLayoutLangConfig, type CodeLayoutConfig } from '../CodeLayout';
import type { CodeLayoutSplitNInstance } from './SplitN';

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

const instance : CodeLayoutSplitNInstance = {

};

defineExpose(instance);

</script>