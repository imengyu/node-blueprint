<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader title="单元属性">
    <CollapsePropItem v-if="props.nodes.length > 1">
      已选 {{ nodes.length }} 个单元
    </CollapsePropItem>
    <template v-if="firstSelectNode">
      <CollapsePropItem title="名称">
        {{ firstSelectNode.getName() }}
      </CollapsePropItem>
      <CollapsePropItem title="断点">
        <select v-model="firstSelectNode.breakpoint">
          <option value="none">无</option>
          <option value="disable">禁用</option>
          <option value="enable">启用</option>
        </select>
      </CollapsePropItem>
      <CollapsePropHeader title="注释">
        <CollapsePropItem title="显示">
          <input v-model="firstSelectNode.markOpen" type="checkbox">
        </CollapsePropItem>
        <CollapsePropItem title="内容">
          <textarea v-model="firstSelectNode.markContent" @input="firstSelectNode.editorHooks.callbackUpdateComment" />
        </CollapsePropItem>
      </CollapsePropHeader>
      <CollapsePropHeader title="调试">
        <CollapsePropItem title="UID">
          {{ firstSelectNode.uid }}
        </CollapsePropItem>
      </CollapsePropHeader>
    </template>
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import CollapsePropHeader from './Common/CollapsePropHeader.vue';
import CollapsePropItem from './Common/CollapsePropItem.vue';
import type { NodeEditor } from '../../Graph/Flow/NodeEditor';

const props = defineProps({
  nodes: {
    type: Object as PropType<NodeEditor[]>,
    required: true,
  },
});

const firstSelectNode = computed(() => {
  return props.nodes.length === 1 ? props.nodes[0] : null;
});
</script>