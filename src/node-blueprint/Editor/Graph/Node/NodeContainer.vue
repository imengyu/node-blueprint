<template>
  <div v-if="viewPort" 
    class="node-graph-continer editor-drag-area" 
    :style="{
      transform: `scale(${viewPort.scale}) translateX(${-(viewPort.position.x)}px) translateY(${-(viewPort.position.y)}px)`,
    }"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { NodeGraphEditorViewport } from '../NodeGraphEditor';

defineProps({
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
})

defineEmits([ 'contextmenu' ]);
</script>

