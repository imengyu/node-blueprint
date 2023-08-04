<template>
  <CollapsePropHeader 
    v-if="item.type === 'group'"
    :title="item.title"
  >
    <PropControlItem
      v-for="(itemChild, index) in item.children"
      :key="index"
      :item="itemChild"
    />
  </CollapsePropHeader>
  <CollapsePropItem
    v-else
    :resizeable="!PropBoxIsMini"
    :border="!PropBoxIsMini"
    :title="item.title"
  >
    <PropControlItemRenderer :item="item" />
  </CollapsePropItem>
</template>

<script setup lang="ts">
import { inject, type PropType } from 'vue';
import type { PropControlItem } from '@/node-blueprint/Base/Editor/PropDefine';
import CollapsePropHeader from './Common/CollapsePropHeader.vue';
import CollapsePropItem from './Common/CollapsePropItem.vue';
import PropControlItemRenderer from './PropControlItemRenderer.vue';

const PropBoxIsMini = inject('PropBoxIsMini', false);

defineProps({
  /**
   * 指定当前表单的条目定义
   */
  item: {
    type: Object as PropType<PropControlItem>,
    required: true,
  },
});
</script>