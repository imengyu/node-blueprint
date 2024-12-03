<template>
  <div
    ref="editorHost"
    class="node-graph-editor"
    :style="{
      cursor
    }"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @wheel="onMouseWhell"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @contextmenu="onCanvasContextMenu"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <BackgroundRender
      ref="backgroundRenderer"
      style="z-index: 0" 
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      :chunkedPanel="(chunkedPanel as ChunkedPanel)"
      :drawDebugInfo="settings?.drawDebugInfo"
      :gridVisible="settings?.drawGrid"
      @contextmenu="onCanvasContextMenu"
    />
    <NodeContainer 
      style="z-index: 1"
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      @contextmenu="onCanvasContextMenu"
    >
      <NodeComponent
        v-for="node in backgroundNodes" 
        :key="node.uid" 
        :instance="(node as NodeEditor)"
        :viewPort="(viewPort as NodeGraphEditorViewport)"
        :chunkedPanel="chunkedPanel" 
        :nodeExclusionEnable="nodeExclusionEnable"
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
      :drawDebugInfo="settings?.drawDebugInfo"
    />
    <NodeContainer 
      style="z-index: 3" 
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      @contextmenu="onCanvasContextMenu"
    >
      <NodeComponent
        v-for="node in foregroundNodes" 
        :key="node.uid" 
        :instance="(node as NodeEditor)"
        :viewPort="(viewPort as NodeGraphEditorViewport)"
        :chunkedPanel="chunkedPanel" 
        :nodeExclusionEnable="nodeExclusionEnable"
      />
    </NodeContainer>
    <ZoomTool
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      style="z-index: 3" 
    />
    <BasePanels
      :viewPort="(viewPort as NodeGraphEditorViewport)"
    />
    <PositionIndicator
      v-model:positionIndicatorOn="positionIndicatorOn"
      :context="context"
      :positionIndicatorPos="positionIndicatorPos"
    />
    <div v-if="graphLoading" class="node-graph-loading">
      <Spin />
      请稍后，文档正在加载中...
    </div>
    <div v-if="graphLoadError" class="node-graph-error">
      <Icon icon="icon-delete-filling" />
      {{ graphLoadError }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, provide, ref, type PropType, type Ref, onBeforeUnmount, watch } from 'vue';
import BackgroundRender from './Render/BackgroundRender.vue';
import ConnectorRender from './Render/ConnectorRender.vue';
import NodeComponent from './Node/Node.vue';
import NodeContainer from './Node/NodeContainer.vue';
import ZoomTool from './SubComponents/ZoomTool.vue';
import BasePanels from './Panel/BasePanels.vue';
import Spin from '../Nana/Common/Spin.vue';
import Icon from '../Nana/Icon.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import { NodeConnectorEditor } from './Flow/NodeConnectorEditor';
import { useEditorSizeChecker } from './Editor/EditorSizeChecker';
import { useEditorMousHandler } from './Editor/EditorMouseHandler';
import { useEditorGraphController } from './Editor/EditorGraphController';
import { useEditorContextMenuHandler } from './Editor/EditorContextMenuHandler';
import { useEditorSelectionContoller } from './Editor/EditorSelectionContoller';
import { useEditorConnectorController } from './Editor/EditorConnectorController';
import { useEditorKeyBoardController } from './Editor/EditorKeyBoardController';
import { useEditorDragController } from './Editor/EditorDragController';
import { useEditorUserController } from './Editor/EditorUserController';
import { useEditorClipBoardController } from './Editor/EditorClipBoardController';
import { useEditorViewPortController } from './Editor/EditorViewPortController';
import type { INodeGraphEditorSettings, NodeGraphEditorBaseEventListener, NodeGraphEditorViewport } from './NodeGraphEditor';
import type { NodeGraphEditorBaseEventCallback, NodeGraphEditorInternalContext } from './NodeGraphEditor';
import type { Rect } from '@/node-blueprint/Base/Utils/Base/Rect';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeEditor } from './Flow/NodeEditor';
import type { ChunkedPanel } from './Cast/ChunkedPanel';
import PositionIndicator from './SubComponents/PositionIndicator.vue';
import { useEditorHistoryController } from './Editor/EditorHistortyController';
import { TOP_CONFIG_KEY, type NodeGraphEditorStaticConfig } from './Config/ConfigManager';

const emit = defineEmits([
  'selectNodeOrConnectorChanged',
  'postUpMessage',
])

const props = defineProps({
  context: {
    type: Object as PropType<NodeGraphEditorInternalContext>,
    required: true,
  },
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
  settings: {
    type: Object as PropType<INodeGraphEditorSettings>,
    default: null,
  },
  config: {
    type: Object as PropType<NodeGraphEditorStaticConfig>,
    default: null,
  },
});

const editorHost = ref<HTMLElement>();
// eslint-disable-next-line vue/no-setup-props-destructure
const context = props.context;
const events = new Map<string, NodeGraphEditorBaseEventCallback[]>();

provide(TOP_CONFIG_KEY, props.config);

const graphLoading = ref(false);
const graphLoadError = ref('');

context.internalManager = {} as any;

const {
  viewPort,
  cursor,
  chunkedPanel,
  nodeExclusionEnable,
} = useEditorViewPortController(context);

//Base context functions
context.listenEvent = (n, c) => {
  let cbs = events.get(n);
  if (!cbs)
    cbs = [];
  cbs.push(c);
  events.set(n, cbs);
  return {
    unListen() {
      ArrayUtils.remove(cbs!, c);
      events.set(n, cbs!);
    },
  };
};
context.emitEvent = (n, ...args) => {
  const cbs = events.get(n);
  if (cbs)
    cbs.forEach(cb => cb(...args));
};
context.getSettings = () => props.settings;

provide('NodeGraphEditorContext', context);

const {
  onKeyDown,
  onKeyUp,
} = useEditorKeyBoardController(context);

const {
  backgroundRenderer,
  foregroundRenderer,
  onWindowSizeChanged
} = useEditorSizeChecker(editorHost, viewPort as Ref<NodeGraphEditorViewport>);

const {
  onMouseUp,
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
  loadGraph,
} = useEditorGraphController(context, (m, d) => emit('postUpMessage', m, d));

const {
  multiSelectRect,
  isMulitSelect,
} = useEditorSelectionContoller(context);

const {
  connectingInfo
} = useEditorConnectorController(context);

const {
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragOver,
} = useEditorDragController(context);

/*const {
} = */useEditorHistoryController(context);

const {
  positionIndicatorOn,
  positionIndicatorPos,
} = useEditorUserController(context);

useEditorClipBoardController(context);

let eventSelectNodeChanged : NodeGraphEditorBaseEventListener|null = null;

//Settings

watch(() => props.settings.drawDebugInfo, (v) => {
  NodeConnectorEditor.setRenderDebugInfo(v ?? false);
})
function loadSettings() {
  NodeConnectorEditor.setRenderDebugInfo(props.settings?.drawDebugInfo ?? false);
}

//init
//=========================

onMounted(() => {
  initRenderer();
  loadSettings();
  graphLoading.value = true;
  eventSelectNodeChanged = context.listenEvent('selectNodeOrConnectorChanged', () => {
    emit('selectNodeOrConnectorChanged', context.selectionManager.getSelectNodes(), context.selectionManager.getSelectConnectors());
  });
  loadGraph(props.graph).then(() => {
    graphLoading.value = false;
    graphLoadError.value = '';
  }).catch((e) => {
    graphLoadError.value = 'Graph load failed: ' + e;
    props.graph.readyDispatcher.setErrorState(e);
    graphLoading.value = false;
  })
  setTimeout(() => {
    context.internalManager.autoNodeSizeChangeCheckerStartStop(true);
    props.graph.readyDispatcher.setReadyState();
  }, 1000);
});
onBeforeUnmount(() => {
  if (eventSelectNodeChanged) {
    eventSelectNodeChanged.unListen();
    eventSelectNodeChanged = null;
  }
  context.internalManager.autoNodeSizeChangeCheckerStartStop(false);
})

function initRenderer() {
  onWindowSizeChanged();
  //Add debug text
  const render = foregroundRenderer.value;
  const _viewPort = viewPort.value;
  if(render) {
    render.addDebugInfoItem(() => `position: ${_viewPort.position} size: ${_viewPort.size} scale: ${_viewPort.scale}`);
    render.addDebugInfoItem(() => `mouseCurrentPos: screen: ${mouseInfo.mouseCurrentPosScreen} -> viewport: ${mouseInfo.mouseCurrentPosViewPort}`);
    render.addDebugInfoItem(() => `mouseDownPos: ${mouseInfo.mouseDownPosScreen} -> ${mouseInfo.mouseDownPosViewPort}`);
    render.addDebugInfoItem(() => `isMulitSelect: ${isMulitSelect.value} rect: ${multiSelectRect.value.toString()}`);
  }
}

</script>

<style lang="scss">
@import './NodeGraphEditor.scss';
</style>