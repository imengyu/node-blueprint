<template>
  <RowView class="node-fill-container">
    <GraphSideTool>
      <GraphSideToolItem />
      <GraphSideToolItem />
      <GraphSideToolSeparator />
      <GraphSideToolItem ref="refAddButton" icon="icon-add-bold" @click="onAdd" />
      <GraphSideToolItem icon="icon-trash" @click="onDelete" />
      <GraphSideToolSeparator />
      <GraphSideToolItem icon="icon-Play" color="green" />
      <GraphSideToolItem icon="icon-Next" color="blue" />
    </GraphSideTool>
    <ColumnView :fill="true">
      <GraphBreadcrumb 
        :current-docunment="docunment"
        :current-graph="currentGraph"
        @goGraph="context.openGraph"
      />
      <NodeGraphEditor 
        v-for="graph in openedGraphs"
        v-show="graph.graph.uid === currentGraph?.uid"
        :key="graph.graph.uid"
        :context="graph.context"
        :graph="(graph.graph as NodeGraph)"
        :settings="editorSettings"
        @select-node-or-connector-changed="(p, p2) =>onSelectNodeChanged(graph.graph.uid, p, p2)"
      />
    </ColumnView>
  </RowView>
</template>

<script setup lang="ts">
import { onMounted, ref, type PropType, onBeforeUnmount, watch } from 'vue';
import ColumnView from '../Nana/Layout/ColumnView.vue';
import RowView from '../Nana/Layout/RowView.vue';
import NodeGraphEditor, { type INodeGraphEditorSettings } from '../Graph/NodeGraphEditor.vue';
import GraphBreadcrumb from './Graph/GraphBreadcrumb.vue';
import GraphSideTool from './Graph/GraphSideTool.vue';
import GraphSideToolItem from './Graph/GraphSideToolItem.vue';
import GraphSideToolSeparator from './Graph/GraphSideToolSeparator.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import type { NodeGraphEditorInternalContext } from '../Graph/NodeGraphEditor';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeDocunmentEditorContext } from './NodeDocunmentEditor';
import type { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodeConnectorEditor } from '../Graph/Flow/NodeConnectorEditor';
import type { NodeEditor } from '../Graph/Flow/NodeEditor';

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

const emit = defineEmits([ 
  'activeGraphEditorChange',
  'activeGraphSelectionChange',
])

const refAddButton = ref();

const openedGraphs = ref<{
  graph: NodeGraph,
  context: NodeGraphEditorInternalContext,
}[]>([]);

const currentGraph = ref<NodeGraph>();

const context = {
  getActiveGraph() {
    return currentGraph.value;
  },
  getOtherGraphs() {
    return openedGraphs.value.filter(p => p.graph !== currentGraph.value).map(p => p.graph);
  },
  getActiveGraphEditor() {
    return currentGraph.value?.activeEditor || undefined;
  },
  switchActiveGraph(graph) {
    currentGraph.value = graph;
    emit('activeGraphEditorChange', graph);
  },
  openGraph(graph) {
    currentGraph.value = graph;
    emit('activeGraphEditorChange', graph);

    if (openedGraphs.value.find((g) => g.graph === graph))
      return;

    openedGraphs.value.push({
      graph,
      context: {} as NodeGraphEditorInternalContext,
    });
  },
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
      emit('activeGraphEditorChange', currentGraph.value);
    }
  },
  closeAllGraph() {
    ArrayUtils.clear(openedGraphs.value);
    currentGraph.value = undefined;
    emit('activeGraphEditorChange', currentGraph.value);
  },
} as NodeDocunmentEditorContext;

function onAdd() {
  const buttonPos = refAddButton.value.getButtonPosition() as Vector2;
  context.getActiveGraphEditor()?.showAddNodePanel(buttonPos, undefined, undefined, undefined, true);
}
function onDelete() {
  context.getActiveGraphEditor()?.userDelete();
}
function onSelectNodeChanged(graphUid: string, nodes: NodeEditor[], connectors: NodeConnectorEditor[]) {
  emit('activeGraphSelectionChange', graphUid, nodes, connectors);
}

watch(() => props.docunment, (doc) => {
  context.closeAllGraph();
  if (doc.mainGraph)
    context.openGraph(doc.mainGraph);
});
onMounted(() => {
  const doc = props.docunment;
  doc.activeEditor = context;

  //打开主图表
  if (doc.mainGraph)
    context.openGraph(doc.mainGraph);
});
onBeforeUnmount(() => {
  context.closeAllGraph();
  const doc = props.docunment;
  doc.activeEditor = null;
});
</script>