<template>
  <ColumnView :flex="1">
    
    <NodeGraphEditor 
      v-for="graph in openedGraphs"
      :key="graph.uid"
      :context="context"
      :graph="(graph as NodeGraph)"
    />
  </ColumnView>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, type PropType } from 'vue';
import { DockLayout, type DockLayoutInterface } from '@imengyu/vue-dock-layout';
import { MenuBar, type MenuBarOptions } from '@imengyu/vue3-context-menu';
import ColumnView from '../Nana/Layout/ColumnView.vue';
import NodeGraphEditor from '../Graph/NodeGraphEditor.vue';
import type { NodeGraphEditorInternalContext } from '../Graph/NodeGraphEditor';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';

const props = defineProps({
  docunment: {
    type: Object as PropType<NodeDocunment>,
    required: true,
  }
});

const openedGraphs = ref<NodeGraph[]>([]);

const context = {} as NodeGraphEditorInternalContext;

</script>