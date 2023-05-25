<template>
  <ColumnView :flex="1" class="node-fill-container">
    <GraphBreadcrumb 
      :current-docunment="docunment"
      :current-graph="currentGraph"
    />
    <NodeGraphEditor 
      v-for="graph in openedGraphs"
      v-show="graph.graph.uid === currentGraph?.uid"
      :key="graph.graph.uid"
      :context="graph.context"
      :graph="(graph.graph as NodeGraph)"
      :settings="editorSettings"
    />
  </ColumnView>
</template>

<script setup lang="ts">
import { onMounted, ref, type PropType, onBeforeUnmount } from 'vue';
import ColumnView from '../Nana/Layout/ColumnView.vue';
import NodeGraphEditor, { type INodeGraphEditorSettings } from '../Graph/NodeGraphEditor.vue';
import GraphBreadcrumb from './Common/Graph/GraphBreadcrumb.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import type { NodeGraphEditorInternalContext } from '../Graph/NodeGraphEditor';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeDocunmentEditorContext } from './NodeDocunmentEditor';

const props = defineProps({
  docunment: {
    type: Object as PropType<NodeDocunment>,
    required: true,
  },
  editorSettings: {
    type: Object as PropType<INodeGraphEditorSettings>,
    default: null,
  },
});

const openedGraphs = ref<{
  graph: NodeGraph,
  context: NodeGraphEditorInternalContext,
}[]>([]);

const currentGraph = ref<NodeGraph>();

const context = {
  /**
   * 切换图表至当前激活的图表
   * @param graph 
   */
  switchActiveGraph(graph) {
    currentGraph.value = graph;
  },
  /**
   * 打开图表
   * @param graph 
   */
  openGraph(graph) {
    if (openedGraphs.value.find((g) => g.graph === graph))
      return;
    openedGraphs.value.push({
      graph,
      context: {} as NodeGraphEditorInternalContext,
    });
    currentGraph.value = graph;
  },
  /**
   * 关播指定的图表
   * @param graph 
   */
  closeGraph(graph) {
    const index = openedGraphs.value.findIndex((g) => g.graph === graph);
    if (index >= 0) {
      ArrayUtils.removeAt(openedGraphs.value, index);
      if (currentGraph.value === graph) {
        if (openedGraphs.value.length > 0)
          currentGraph.value = (index > 0 && index < openedGraphs.value.length - 1 ?
            openedGraphs.value[index - 1] :
            openedGraphs.value[0]).graph as NodeGraph;
        else
          currentGraph.value = undefined;
      }
    }
  },
  /**
   * 关播所有打开的图表
   */
  closeAllGraph() {
    ArrayUtils.clear(openedGraphs.value);
    currentGraph.value = undefined;
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