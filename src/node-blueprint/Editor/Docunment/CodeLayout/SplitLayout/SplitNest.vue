<template>
  <SplitN
    :grids="grid.childGrid"
    :horizontal="grid.direction === 'horizontal'"
  >
    <template #grid="{ grid: childGrid, index }">
      <SplitNest 
        v-if="childGrid.childGrid?.length"
        :grid="childGrid"
      >
        <template #grid="param">
          <slot name="grid" v-bind="param" />
        </template>
      </SplitNest>
      <slot v-else name="grid" :grid="childGrid" :index="index" />
    </template>
  </SplitN>
</template>

<script setup lang="ts">
import SplitN from './SplitN.vue';
import type { CodeLayoutSplitNGridInternal } from './SplitN';
import type { PropType } from 'vue';

defineProps({
  grid: {
    type: Object as PropType<CodeLayoutSplitNGridInternal>,
    default: null,
  },
});

</script>