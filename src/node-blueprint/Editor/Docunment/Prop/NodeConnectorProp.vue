<!-- eslint-disable vue/no-mutating-props -->
<template>
  <PropBox class="node-custom-editor">
    <CollapsePropHeader title="文档属性">
      <CollapsePropItem title="文档名称">
        <Input v-model="doc.name" class="prop-item-editor" type="text" placeholder="文档的名称" @blur="$emit('updateDocTitle', doc.name)" />
      </CollapsePropItem>
      <CollapsePropItem title="文档注释">
        <textarea v-model="doc.description" class="prop-item-editor" placeholder="文档的注释..." style="resize:vertical;" />
      </CollapsePropItem>
    </CollapsePropHeader>   
  </PropBox>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { NodeConnectorEditor } from '../../Graph/Flow/NodeConnectorEditor';
import CollapsePropHeader from './Common/CollapsePropHeader.vue';
import Input from '../../Nana/Input/Input.vue';
import CollapsePropItem from './Common/CollapsePropItem.vue';
import PropBox from './Common/PropBox.vue';

defineEmits([ 'updateDocTitle' ])
defineProps({
  connectors: {
    type: Object as PropType<NodeConnectorEditor[]>,
    required: true,
  },
});
</script>