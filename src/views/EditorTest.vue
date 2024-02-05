<template>
  <NodeGraphEditor 
    :graph="graph"
    :context="context"
  />
</template>

<script setup lang="ts">
import { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import NodeGraphEditor from '@/node-blueprint/Editor/Graph/NodeGraphEditor.vue';
import type { NodeGraphEditorInternalContext } from '@/node-blueprint/Editor/Graph/NodeGraphEditor';

const docunment = new NodeDocunment();
const graph = new NodeGraph({
  type: 'main',
}, docunment, true);
const context = {

} as NodeGraphEditorInternalContext;
</script>

<style>
</style>