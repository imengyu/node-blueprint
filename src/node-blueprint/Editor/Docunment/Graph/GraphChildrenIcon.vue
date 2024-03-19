<template>
  <img :src="icon" class="prop-row-icon">
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';

import IconFunction from '../../Images/BlockIcon/function.svg';
import IconFunctionStatic from '../../Images/BlockIcon/function_static.svg';
import IconBlock from '../../Images/BlockIcon/block.svg';
import IconConstructor from '../../Images/BlockIcon/constructor.svg';
import IconMacro from '../../Images/BlockIcon/macro.svg';

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
})

const icon = computed(() => {
  if (props.graph.type === 'main')
    return "";
  if (props.graph.type === 'function')
    return IconFunction;
  if (props.graph.type === 'static')
    return IconFunctionStatic;
  if (props.graph.type === 'subgraph')
    return IconBlock;
  if (props.graph.type === 'macro')
    return IconMacro;
  if (props.graph.type === 'constructor')
    return IconConstructor;
  return "";
});

</script>