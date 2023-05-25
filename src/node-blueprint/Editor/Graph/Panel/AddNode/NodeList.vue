<template>
  <CollapseItem
    v-for="(item, index) in allNodesGrouped" 
    v-show="item.show && item.filterShow && item.category!=''"
    :key="index"
    v-model:open="item.open"
    :title="item.category"
  >
    <NodeCategory
      v-if="item.open"
      :categoryData="item"
      :isAddDirectly="isAddDirectly"
    />
  </CollapseItem>
</template>

<script setup lang="ts">
import type { CategoryData } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';
import CollapseItem from '@/node-blueprint/Editor/Components/List/CollapseItem.vue';
import NodeCategory from './NodeCategory.vue';
import type { PropType } from 'vue';

defineProps({
  allNodesGrouped: {
    type: Object as PropType<Array<CategoryData>>,  
    default: null,
  },
  isAddDirectly: {
    type: Boolean,
    default: false,
  },
})
</script>