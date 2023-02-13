<template>
  <div
    ref="editorHost"
    class="node-graph-editor"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @wheel="onMouseWhell"
  >
    <BackgroundRender
      ref="backgroundRenderer"
      style="z-index: 0" 
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      :drawDebugInfo="true"
    />
    <NodeContainer 
      style="z-index: 1"
      :viewPort="(viewPort as NodeGraphEditorViewport)"
    >
      <NodeComponent
        v-for="(node, key) in backgroundNodes" 
        :instance="(node as Node)" 
        :viewPort="(viewPort as NodeGraphEditorViewport)"
        :key="key" 
      />
    </NodeContainer>
    <ConnectorRender
      ref="foregroundRenderer"
      style="z-index: 2" 
    />
    <NodeContainer 
      style="z-index: 3" 
      :viewPort="(viewPort as NodeGraphEditorViewport)"
    >
      <NodeComponent
        v-for="(node, key) in foregroundNodes" 
        :instance="(node as Node)" 
        :viewPort="(viewPort as NodeGraphEditorViewport)"
        :key="key" 
      />
    </NodeContainer>
    <ZoomTool
      :viewPort="(viewPort as NodeGraphEditorViewport)"
      style="z-index: 3" 
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, type Ref } from 'vue';
import BackgroundRender from './Render/BackgroundRender.vue';
import ConnectorRender from './Render/ConnectorRender.vue';
import NodeComponent from './Node/Node.vue';
import NodeContainer from './Node/NodeContainer.vue';
import ZoomTool from './SubComponents/ZoomTool.vue';
import { useEditorSizeChecker } from './Editor/EditorSizeChecker';
import { NodeGraphEditorViewport } from './NodeGraphEditor';
import { useEditorMousHandler } from './Editor/EditorMouseHandler';
import { useEditorGraphController } from './Editor/EditorGraphController';
import { Node } from '@/node-blueprint/Base/Flow/Node/Node';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';

const editorHost = ref<HTMLElement>();
const viewPort = ref<NodeGraphEditorViewport>(new NodeGraphEditorViewport());

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
} = useEditorMousHandler({
  viewPort: (viewPort as Ref<NodeGraphEditorViewport>),
});

const {
  backgroundNodes,
  foregroundNodes,
} = useEditorGraphController();

//init
//=========================

onMounted(() => {
  initRenderer();

  const node = new Node({
    guid: '2FA7BA84-DA8A-F985-43F3-A12AEBB012BD',
    version: 1,
    name: '测试单元',
    description: 'string',
    ports: [
      {
        guid: 'IN',
        type: NodeParamType.Execute,
        name: '入口',
        description: '测试入口',
        direction: 'input',
      },
      {
        guid: 'OUT',
        type: NodeParamType.Execute,
        name: '出口',
        description: '测试出口',
        direction: 'output',
      },
    ],
  });

  foregroundNodes.value.push(node);
})
function initRenderer() {
  onWindowSizeChanged();
  //Add debug text
  const render = backgroundRenderer.value;
  const _viewPort = viewPort.value;
  if(render) {
    render.addDebugInfoItem(() => `position: ${_viewPort.position}`);
    render.addDebugInfoItem(() => `size: ${_viewPort.size} scale: ${_viewPort.scale}`);
    render.addDebugInfoItem(() => `mouseCurrentPos: ${mouseInfo.mouseCurrentPosScreen} -> ${mouseInfo.mouseCurrentPosViewPort}`);
    render.addDebugInfoItem(() => `mouseDownPos: ${mouseInfo.mouseDownPosScreen} -> ${mouseInfo.mouseDownPosViewPort}`);
  }
}

</script>

<style lang="scss">
@import './NodeGraphEditor.scss';
</style>