<template>
  <PropControlItemComponent 
    v-for="(item, index) in items"
    :key="index"
    :item="item"
  />
</template>

<script setup lang="ts">
import PropControlItemComponent from './PropControlItem.vue';
import { type PropType, provide } from 'vue';
import type { PropControlItem } from '@/node-blueprint/Base/Editor/PropDefine';

const props = defineProps({
  /**
   * 指定当前表单的条目定义
   */
  items: {
    type: Object as PropType<PropControlItem[]>,
    default: () => ([] as Object),
  },
  /**
   * 是否是紧凑型
   */
  mini: {
    type: Boolean,
    default: false,
  },
});

provide('PropBoxIsMini', props.mini);

</script>