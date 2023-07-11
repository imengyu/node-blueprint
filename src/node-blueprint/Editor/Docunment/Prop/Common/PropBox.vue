<template>
  <div class="prop-box">  
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, ref, type Ref } from 'vue';
import MathUtils from '@/node-blueprint/Base/Utils/MathUtils';

export interface PropBoxContext {
  gridSize: Ref<number>,
  updateGridSize: (size: number) => void,
}

const props = defineProps({
  gridMaxWidth: {
    type: Number,
    default: 1,
  },
  gridMinWidth: {
    type: Number,
    default: 0.2,
  },
});

const gridSize = ref(0.5);

provide<PropBoxContext>('PropBoxContext', {
  gridSize,
  updateGridSize(size: number) {
    gridSize.value = MathUtils.limitNumber(size, props.gridMinWidth, props.gridMaxWidth);
  },
});

</script>

<style lang="scss">

.prop-box {
  display: flex;
  flex-direction: column;
}
</style>