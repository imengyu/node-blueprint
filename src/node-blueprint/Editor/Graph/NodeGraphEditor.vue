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
import { onMounted, provide, ref, type Ref } from 'vue';
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
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import { initBase } from '../../Base';
import { initEditorBase } from './Flow';
import { initLib } from '@/node-blueprint/Nodes';
import { ChunkedPanel } from './Cast/ChunkedPanel';
import { NodeEditor } from './Flow/NodeEditor';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { NodeRegistry } from '@/node-blueprint/Base/Flow/Registry/NodeRegistry';
import type { NodePortEditor } from './Flow/NodePortEditor';
import type { NodeGraphEditorInternalContext } from './NodeGraphEditor';
import type { Rect } from '@/node-blueprint/Base/Utils/Base/Rect';
import { useEditorClipBoardControllerController } from './Editor/EditorClipBoardController';

const editorHost = ref<HTMLElement>();
const chunkedPanel = new ChunkedPanel()
const cursor = ref('default');
const viewPort = ref<NodeGraphEditorViewport>(new NodeGraphEditorViewport());
const context = {
  getBaseChunkedPanel: () => chunkedPanel,
  getViewPort: () => viewPort.value,
  setCursor: (v: string) => { cursor.value = v },
  resetCursor: () => { cursor.value = 'default' },
} as NodeGraphEditorInternalContext;

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

  const node = new NodeEditor({
    guid: '2FA7BA84-DA8A-F985-43F3-A12AEBB012BD',
    version: 1,
    name: '测试单元',
    description: '测试单元说明说明说明说明',
    ports: [
      {
        guid: 'IN',
        paramType: NodeParamType.Execute,
        name: '入口',
        description: '测试入口',
        direction: 'input',
      },
      {
        guid: 'IN-NUMBER',
        paramType: NodeParamType.Number,
        name: '数字',
        description: '数字输入参数',
        direction: 'input',
      },
      {
        guid: 'IN-STRING',
        paramType: NodeParamType.String,
        name: '字符串',
        description: '字符串输入参数',
        direction: 'input',
      },
      {
        guid: 'IN-BOOL',
        paramType: NodeParamType.Boolean,
        name: '布尔',
        description: '布尔输入参数',
        direction: 'input',
      },
      {
        guid: 'IN-ANY',
        paramType: NodeParamType.Any,
        name: '通配符',
        description: '通配符输入参数',
        direction: 'input',
      },
      {
        guid: 'OUT',
        paramType: NodeParamType.Execute,
        name: '出口',
        description: '测试出口',
        direction: 'output',
      },
      {
        guid: 'OUT-NUMBER',
        paramType: NodeParamType.Number,
        name: '数字',
        description: '数字输出参数',
        direction: 'output',
      },
      {
        guid: 'OUT-STRING',
        paramType: NodeParamType.String,
        name: '字符串',
        description: '字符串输出参数',
        direction: 'output',
      },
      {
        guid: 'OUT-BOOL',
        paramType: NodeParamType.Boolean,
        name: '布尔',
        description: '布尔输出参数',
        direction: 'output',
      },
      {
        guid: 'OUT-ANY',
        paramType: NodeParamType.Any,
        name: '通配符',
        description: '通配符输出参数',
        direction: 'output',
      },
    ],
  });
  const node1 = new NodeEditor({
    guid: '2FA7BA84-DA8A-F985-43F3-A12AEBB012BA',
    version: 1,
    name: '测试单元',
    description: '测试单元说明说明说明说明',
    ports: [
      {
        guid: 'IN',
        paramType: NodeParamType.Number,
        name: '',
        description: '测试入口',
        direction: 'input',
      },
      {
        guid: 'IN2',
        paramType: NodeParamType.Number,
        name: '',
        description: '测试入口',
        direction: 'input',
      },
      {
        guid: 'OUT',
        paramType: NodeParamType.Number,
        name: '',
        description: '通配符输出参数',
        direction: 'output',
      },
    ],
    userCanAddInputParam: true,
    style: {
      titleState: 'hide',
      logoBackground: 'icon:icon-add',
      inputPortMinWidth: 0,
    },
  });
  const node2 = new NodeEditor({
    guid: '2FA7BA84-DA8A-F985-43F3-A12AEBB012BC',
    version: 1,
    name: 'Constants',
    description: '测试单元说明说明说明说明',
    ports: [
      {
        guid: 'OUT',
        paramType: NodeParamType.Number,
        name: '',
        description: '通配符输出参数',
        direction: 'output',
      },
    ],
    style: {
      titleState: 'hide',
      logoBackground: 'title:Constants',
      minWidth: 150,
    },
  });
  const node3 = new NodeEditor({
    guid: '2FA7BA84-DA8A-F985-43F3-A12AEBB012AC',
    version: 1,
    name: '定时器',
    description: '定时器',
    ports: [
      {
        guid: 'START',
        paramType: NodeParamType.Execute,
        name: '开始',
        direction: 'input',
      },
      {
        guid: 'STOP',
        paramType: NodeParamType.Execute,
        name: '停止',
        direction: 'input',
      },
      {
        guid: 'RESERT',
        paramType: NodeParamType.Execute,
        name: '重置',
        direction: 'input',
      },
      {
        guid: 'INTERVAL',
        paramType: NodeParamType.Number,
        name: '延时',
        direction: 'input',
      },
      {
        guid: 'OUT',
        paramType: NodeParamType.Execute,
        name: '执行',
        direction: 'output',
      },
    ],
    style: {
      logo: 'icon:icon-clock1',
      logoRight: 'icon:icon-clock1',
      minWidth: 150,
    },
  });

  node.position.set(100, 0);
  node1.position.set(-200, -100);
  node2.position.set(-486, -200);
  node3.position.set(-460, 100);


  pushNodes(
    node,
    node1,
    node2,
    node3,
  );

  const coonNode = context.userAddNode(NodeRegistry.getInstance().getNodeByGUID("8A94A788-ED4E-E521-5BC2-4D69B59BAB80")!, new Vector2(-300, -200));
  const commentNode = context.userAddNode(NodeRegistry.getInstance().getNodeByGUID("24AA3DF0-49D9-84D9-8138-534505C33327")!, new Vector2(-503, -243));
  commentNode!.customSize = new Vector2(500, 255);

  context.connectConnector(node3.outputPorts.get('OUT') as NodePortEditor, node.inputPorts.get('IN') as NodePortEditor);
  context.connectConnector(node2.outputPorts.get('OUT') as NodePortEditor, coonNode!.inputPorts.get('INPUT') as NodePortEditor);
  context.connectConnector(node1.outputPorts.get('OUT') as NodePortEditor, node.inputPorts.get('IN-NUMBER') as NodePortEditor);
  context.connectConnector(coonNode!.outputPorts.get('OUTPUT') as NodePortEditor, node1.inputPorts.get('IN') as NodePortEditor);

  setTimeout(() => {
    viewPort.value.position.set(-viewPort.value.size.x / 2, -viewPort.value.size.y / 2);
  }, 100);
})
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