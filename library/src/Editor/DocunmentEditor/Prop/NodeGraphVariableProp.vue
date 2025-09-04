<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader title="变量">
    <GraphVaraible :graph="graph" />
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import CollapsePropHeader from '@/Editor/Components/Editor/PropControl/Common/CollapsePropHeader.vue'
import GraphVaraible from '../Graph/GraphVaraible.vue';
import type { NodeGraph } from '@/Core/Graph/NodeGraph';

defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});
</script>