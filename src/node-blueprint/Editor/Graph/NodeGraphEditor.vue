<template>
  <div
    ref="editorHost"
    class="node-graph-editor"
    :style="{ cursor }"
    @mousedown="onMouseDown"
    @wheel="onMouseWhell"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @contextmenu="onCanvasContextMenu"
  >
    <BackgroundRender
      ref="backgroundRenderer"
      style="z-index: 0" 
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      :chunkedPanel="(chunkedPanel as ChunkedPanel)"
      :drawDebugInfo="true"
      @contextmenu="onCanvasContextMenu"
    />
    <NodeContainer 
      style="z-index: 1"
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      @contextmenu="onCanvasContextMenu"
    >
      <NodeComponent
        v-for="(node, key) in backgroundNodes" 
        :instance="(node as NodeEditor)" 
        :viewPort="(viewPort as NodeGraphEditorViewport)"
        :chunkedPanel="chunkedPanel"
        :key="key" 
      />
    </NodeContainer>
    <ConnectorRender
      ref="foregroundRenderer"
      style="z-index: 2; pointer-events: none;"
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      :chunkedPanel="(chunkedPanel as ChunkedPanel)"
      :isMulitSelect="isMulitSelect"
      :multiSelectRect="(multiSelectRect as Rect)"
      :connectors="allConnectors"
      :connectingInfo="connectingInfo"
      :drawDebugInfo="true"
    />
    <NodeContainer 
      style="z-index: 3" 
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      @contextmenu="onCanvasContextMenu"
    >
      <NodeComponent
        v-for="(node, key) in foregroundNodes" 
        :instance="(node as NodeEditor)" 
        :viewPort="(viewPort as NodeGraphEditorViewport)"
        :chunkedPanel="chunkedPanel"
        :key="key" 
      />
    </NodeContainer>
    <ZoomTool
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      style="z-index: 3" 
    />
    <BasePanels
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      :connectingInfo="connectingInfo"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, provide, ref, type PropType, type Ref } from 'vue';
import BackgroundRender from './Render/BackgroundRender.vue';
import ConnectorRender from './Render/ConnectorRender.vue';
import NodeComponent from './Node/Node.vue';
import NodeContainer from './Node/NodeContainer.vue';
import ZoomTool from './SubComponents/ZoomTool.vue';
import BasePanels from './Panel/BasePanels.vue';
import { useEditorSizeChecker } from './Editor/EditorSizeChecker';
import { NodeGraphEditorViewport } from './NodeGraphEditor';
import { useEditorMousHandler } from './Editor/EditorMouseHandler';
import { useEditorGraphController } from './Editor/EditorGraphController';
import { useEditorContextMenuHandler } from './Editor/EditorContextMenuHandler';
import { useEditorSelectionContoller } from './Editor/EditorSelectionContoller';
import { useEditorConnectorController } from './Editor/EditorConnectorController';
import { useEditorKeyBoardControllerController } from './Editor/EditorKeyBoardController';
import { useEditorUserController } from './Editor/EditorUserController';
import { useEditorClipBoardControllerController } from './Editor/EditorClipBoardController';
import { initBase } from '../../Base';
import { initEditorBase } from './Flow';
import { initLib } from '@/node-blueprint/Nodes';
import { ChunkedPanel } from './Cast/ChunkedPanel';
import type { NodeGraphEditorInternalContext } from './NodeGraphEditor';
import type { Rect } from '@/node-blueprint/Base/Utils/Base/Rect';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeEditor } from './Flow/NodeEditor';

const props = defineProps({
  context: {
    type: Object as PropType<NodeGraphEditorInternalContext>,
    required: true,
  },
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});

const editorHost = ref<HTMLElement>();
const chunkedPanel = new ChunkedPanel()
const cursor = ref('default');
const viewPort = ref<NodeGraphEditorViewport>(new NodeGraphEditorViewport());
const context = props.context;

context.getBaseChunkedPanel = () => chunkedPanel;
context.getViewPort = () => viewPort.value as NodeGraphEditorViewport;
context.setCursor = (v: string) => { cursor.value = v };
context.resetCursor = () => { cursor.value = 'default' };

provide('NodeGraphEditorContext', context);

const {
  backgroundRenderer,
  foregroundRenderer,
  onWindowSizeChanged
} = useEditorSizeChecker(editorHost, viewPort as Ref<NodeGraphEditorViewport>);

const {
  onMouseDown,
  onMouseMove,
  onMouseWhell,
  mouseInfo,
} = useEditorMousHandler(context);

const {
  onCanvasContextMenu
} = useEditorContextMenuHandler(context);

const {
  backgroundNodes,
  foregroundNodes,
  allConnectors,
  pushNodes,
  loadGraph,
} = useEditorGraphController(context);

const {
  multiSelectRect,
  isMulitSelect,
} = useEditorSelectionContoller(context);

const {
  connectingInfo
} = useEditorConnectorController(context);

const {
  onKeyDown,
  onKeyUp,
} = useEditorKeyBoardControllerController(context);

const {
  
} = useEditorUserController(context);

const {
  
} = useEditorClipBoardControllerController(context);

//init
//=========================

initBase();
initEditorBase();
initLib();

onMounted(() => {
  initRenderer();
  loadGraph(props.graph);
});

function initRenderer() {
  onWindowSizeChanged();
  //Add debug text
  const render = foregroundRenderer.value;
  const _viewPort = viewPort.value;
  if(render) {
    render.addDebugInfoItem(() => `position: ${_viewPort.position} size: ${_viewPort.size} scale: ${_viewPort.scale}`);
    render.addDebugInfoItem(() => `mouseCurrentPos: ${mouseInfo.mouseCurrentPosScreen} -> ${mouseInfo.mouseCurrentPosViewPort}`);
    render.addDebugInfoItem(() => `mouseDownPos: ${mouseInfo.mouseDownPosScreen} -> ${mouseInfo.mouseDownPosViewPort}`);
    render.addDebugInfoItem(() => `isMulitSelect: ${isMulitSelect.value} rect: ${multiSelectRect.value.toString()}`);
  }
}

</script>

<style lang="scss">
@import './NodeGraphEditor.scss';
</style>