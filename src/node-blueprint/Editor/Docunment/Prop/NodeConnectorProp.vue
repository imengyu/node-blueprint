<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader title="连接线属性">
    <CollapsePropItem v-if="props.connectors.length > 1">
      已选 {{ connectors.length }} 条连接线
    </CollapsePropItem>
    <CollapsePropItem v-if="firstSelectConnector" title="UID">
      {{ firstSelectConnector.uid }}
    </CollapsePropItem>
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { NodeConnectorEditor } from '../../Graph/Flow/NodeConnectorEditor';
import CollapsePropHeader from '../../Components/PropControl/Common/CollapsePropHeader.vue';
import CollapsePropItem from '../../Components/PropControl/Common/CollapsePropItem.vue';

const props = defineProps({
  connectors: {
    type: Object as PropType<NodeConnectorEditor[]>,
    required: true,
  },
});

const firstSelectConnector = computed(() => {
  return props.connectors.length === 1 ? props.connectors[0] : null;
});
</script>