<template>
  <NodeGraphEditor 
    :graph="graph"
    :context="context"
    :settings="settings"
  />
</template>

<script setup lang="ts">
import NodeGraphEditor from 'node-blueprint/Editor/GraphEditor/NodeGraphEditor.vue';
import { NodeGraph } from 'node-blueprint/Core/Graph/NodeGraph';
import { NodeDocunment } from 'node-blueprint/Core/Graph/NodeDocunment';
import type { INodeGraphEditorSettings, NodeGraphEditorInternalContext } from 'node-blueprint/Editor/GraphEditor/NodeGraphEditor';

const docunment = new NodeDocunment();
const graph = new NodeGraph({
  type: 'main',
}, docunment, true);
const context = {

} as NodeGraphEditorInternalContext;
const settings : INodeGraphEditorSettings = {
  drawDebugInfo: true,
  drawGrid: true,
  snapGrid: false,
  snapGridSize: 5,
}
</script>

<style>
</style>