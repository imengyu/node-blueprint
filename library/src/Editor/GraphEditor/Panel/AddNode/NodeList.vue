<template>
  <CollapseItem
    v-for="item in allNodesGrouped" 
    v-show="item.show && item.filterShow && item.category!=''"
    :key="item.key"
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
import type { PropType } from 'vue';
import type { CategoryData } from '@/Core/Registry/NodeCategory';
import NodeCategory from './NodeCategory.vue';
import CollapseItem from '@/Editor/Components/Editor/List/CollapseItem.vue';

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