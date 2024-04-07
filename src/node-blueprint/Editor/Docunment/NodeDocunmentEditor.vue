<template>
  <RowView class="node-fill-container">
    <GraphSideTool>
      <GraphSideToolItem />
      <GraphSideToolItem />
      <GraphSideToolSeparator />
      <GraphSideToolItem ref="addButtonRef" icon="icon-add-bold" @click="onAdd" />
      <GraphSideToolItem icon="icon-trash" @click="onDelete" />
      <GraphSideToolSeparator />
      <GraphSideToolItem icon="icon-Play" color="green" />
      <GraphSideToolItem icon="icon-Next" color="blue" />
    </GraphSideTool>
    <SplitLayout
      ref="splitLayoutRef"
      rootGridType="centerArea1"
      @panelClose="onPanelClose"
      @panelActive="onActiveTabChange"
    >
      <template #tabContentRender="{ panel }">
        <GraphBreadcrumb 
          :currentDocunment="docunment"
          :currentGraph="currentGraph"
          :canGoBack="canGoBack"
          :canGoForward="canGoForward"
          @goGraph="context.openGraph"
          @goBack="backStack"
          @goForward="forwardStack"
        />
        <NodeGraphEditor
          :key="(panel.data as OpenedGraphsData).graph.uid"
          class="node-graph-breadcrumb-space"
          :context="(panel.data as OpenedGraphsData).context"
          :graph="(panel.data as OpenedGraphsData).graph"
          :settings="editorSettings"
          @selectNodeOrConnectorChanged="(p, p2) => onSelectNodeChanged((panel.data as OpenedGraphsData).graph.uid, p, p2)"
        />
      </template>
      <template #tabEmptyContentRender="{ grid }">
        <h2 :style="{ margin: 0 }">Empty Grid {{ grid.name }} {{ grid.direction }}</h2>
      </template>
    </SplitLayout>
  </RowView>
</template>

<script setup lang="ts">
import { onMounted, ref, type PropType, onBeforeUnmount, watch } from 'vue';
import RowView from '../Nana/Layout/RowView.vue';
import NodeGraphEditor from '../Graph/NodeGraphEditor.vue';
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
import type { INodeGraphEditorSettings } from '../Graph/NodeGraphEditor';
import type { CodeLayoutSplitNInstance, CodeLayoutPanelInternal } from 'vue-code-layout';
import { SplitLayout } from 'vue-code-layout';
import { useGraphOpenStack, type GraphOpenStackData } from './Editor/GraphOpenStack';

interface OpenedGraphsData {
  graph: NodeGraph,
  context: NodeGraphEditorInternalContext,
}

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

const addButtonRef = ref();
const splitLayoutRef = ref<CodeLayoutSplitNInstance>();

//打开的图表
const openedGraphs = ref<OpenedGraphsData[]>([]);
const currentGraph = ref<NodeGraph>();

//打开图表历史记录
const { 
  canGoBack, 
  canGoForward,
  pushStack,
  forwardStack,
  backStack,
  clearStack,
} = useGraphOpenStack(onJumpStack);

function onJumpStack(data: GraphOpenStackData) {
  const graph = props.docunment.findChildGraph(data.graphUid);
  if (graph)
    context.openGraph(graph, true);
}
function onPanelClose(panel: CodeLayoutPanelInternal, resolve: () => void) {
  const data = (panel.data as OpenedGraphsData);
  ArrayUtils.remove(openedGraphs.value, data);
  resolve();
}
function onActiveTabChange(currentActive: CodeLayoutPanelInternal) {
  if (!currentActive)
    return;
  const data = currentActive.data as OpenedGraphsData;
  if (data) {
    currentGraph.value = data.graph;
    pushStack(data.graph.uid, '');
    emit('activeGraphEditorChange', data.graph);
  }
}
function setActiveGraphPanel(graph: NodeGraph) {
  const nextPanel = splitLayoutRef.value?.getPanelByName(graph.uid);
  if (nextPanel)
    nextPanel.activeSelf();
}

//控制接口
const context = {
  getActiveGraph() {
    return currentGraph.value;
  },
  getOtherGraphs() {
    return openedGraphs.value.filter(p => p.graph !== currentGraph.value).map(p => p.graph);
  },
  getOpenedGraphs() {
    return openedGraphs.value.map(p => p.graph);
  },
  getActiveGraphEditor() {
    return currentGraph.value?.activeEditor || undefined;
  },
  switchActiveGraph(graph, noStackHistory = false) {
    currentGraph.value = graph;
    setActiveGraphPanel(graph);
    if (!noStackHistory)
      pushStack(graph.uid, '');
    emit('activeGraphEditorChange', graph);
  },
  openGraph(graph, noStackHistory = false) {
    currentGraph.value = graph;
    emit('activeGraphEditorChange', graph);
    if (openedGraphs.value.find((g) => g.graph === graph)) {
      this.switchActiveGraph(graph, noStackHistory);
      return;
    }
    const data : OpenedGraphsData = {
      graph,
      context: {} as NodeGraphEditorInternalContext,
    };
    const panel = splitLayoutRef.value?.getRootGrid().addPanel({
      name: graph.uid,
      title: graph.name,
      data,
      closeType: graph === props.docunment.mainGraph ? 'none' : 'close',
      accept: [ 'centerArea1' ],
    });
    panel?.activeSelf();
    openedGraphs.value.push(data);
    if (!noStackHistory)
      pushStack(graph.uid, '');
  },
  closeGraph(graph) {
    const editorPanel = splitLayoutRef.value?.getPanelByName(graph.uid);
    if (editorPanel)
      editorPanel.closePanel();
  },
  closeAllGraph() {
    ArrayUtils.clear(openedGraphs.value);
    clearStack();
    splitLayoutRef.value?.clearLayout();
    currentGraph.value = undefined;
    emit('activeGraphEditorChange', currentGraph.value);
  },
  dispstchMessage(m, d) {
    openedGraphs.value.map(p => p.context.dispstchMessage(m, d));
  },
} as NodeDocunmentEditorContext;

function onAdd() {
  const buttonPos = addButtonRef.value.getButtonPosition() as Vector2;
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
  if (doc && doc.mainGraph)
    context.openGraph(doc.mainGraph);
});
onMounted(() => {
  const doc = props.docunment;
  if (doc) {
    doc.activeEditor = context;

    //打开主图表
    if (doc.mainGraph)
      context.openGraph(doc.mainGraph);
  }
});
onBeforeUnmount(() => {
  context.closeAllGraph();
  const doc = props.docunment;
  doc.activeEditor = null;
});
</script>