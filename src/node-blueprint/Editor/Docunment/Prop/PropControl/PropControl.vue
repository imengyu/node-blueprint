<template>
  <PropControlItemComponent 
    v-for="(item, index) in items"
    :key="index"
    :item="item"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { PropControlItem } from './PropControl';
import PropControlItemComponent from './PropControlItem.vue';

defineProps({
  /**
   * 指定当前表单的条目定义
   */
  items: {
    type: Object as PropType<PropControlItem[]>,
    default: () => ([] as Object),
  },
});
</script>