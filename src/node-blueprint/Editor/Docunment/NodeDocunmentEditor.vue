<template>
  <ColumnView :flex="1">
    
    <NodeGraphEditor 
      v-for="graph in openedGraphs"
      :key="graph.graph.uid"
      :context="graph.context"
      :graph="(graph.graph as NodeGraph)"
    />
  </ColumnView>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, type PropType, onBeforeUnmount } from 'vue';
import { DockLayout, type DockLayoutInterface } from '@imengyu/vue-dock-layout';
import { MenuBar, type MenuBarOptions } from '@imengyu/vue3-context-menu';
import ColumnView from '../Nana/Layout/ColumnView.vue';
import NodeGraphEditor from '../Graph/NodeGraphEditor.vue';
import type { NodeGraphEditorInternalContext } from '../Graph/NodeGraphEditor';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeDocunmentEditorContext } from './NodeDocunmentEditor';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';

const props = defineProps({
  docunment: {
    type: Object as PropType<NodeDocunment>,
    required: true,
  }
});

const openedGraphs = ref<{
  graph: NodeGraph,
  context: NodeGraphEditorInternalContext,
}[]>([]);

const context = {
  openGraph(graph) {
    if (openedGraphs.value.find((g) => g.graph === graph))
      return;
    
    openedGraphs.value.push({
      graph,
      context: {} as NodeGraphEditorInternalContext,
    })
  },
  closeGraph(graph) {
    const index = openedGraphs.value.findIndex((g) => g.graph === graph);
    if (index >= 0)
      ArrayUtils.removeAt(openedGraphs.value, index);
  },
  closeAllGraph() {
    ArrayUtils.clear(openedGraphs.value);
  },
} as NodeDocunmentEditorContext;

onMounted(() => {
  const doc = props.docunment;
  doc.activeEditor = context;
});
onBeforeUnmount(() => {
  const doc = props.docunment;
  doc.activeEditor = null;
});
</script>