<template>
  <NodeGraphEditor 
    :graph="graph"
    :context="context"
    :settings="settings"
  />
</template>

<script setup lang="ts">
import { NodeDocunment } from '@/Core/Graph/NodeDocunment';
import { NodeGraph } from '@/Core/Graph/NodeGraph';
import NodeGraphEditor from '@/node-blueprint/Editor/Graph/NodeGraphEditor.vue';
import type { INodeGraphEditorSettings, NodeGraphEditorInternalContext } from '@/node-blueprint/Editor/Graph/NodeGraphEditor';

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