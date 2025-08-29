<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader 
    v-if="graph.type === 'class'"
    noFold
    clickable
    @dblclick="onMainClicked"
  >
    <template #title>
      {{ `类 ${graph.name}` }}
      <GraphChildrenActiveDot v-if="graph === activeGraph" />
    </template>
    <CollapsePropHeader title="构造函数">
      <GraphChildrenList :graph="graph" type="constructor" showEmpty />
    </CollapsePropHeader>
    <CollapsePropHeader title="实例函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listFunction as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listFunction" :graph="graph" :activeGraph="activeGraph" type="function" showEmpty />
    </CollapsePropHeader>
    <CollapsePropHeader title="静态函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listStatic as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listStatic" :graph="graph" :activeGraph="activeGraph" type="static" />
    </CollapsePropHeader>
  </CollapsePropHeader>
  <CollapsePropHeader 
    v-else-if="graph.type === 'main'"
    title="主文档" 
    noFold
    clickable
    @dblclick="onMainClicked"
  >
    <template #title>
      主文档
      <GraphChildrenActiveDot v-if="graph === activeGraph" />
    </template>
    <CollapsePropHeader title="静态函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listStatic as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listStatic" :graph="graph" :activeGraph="activeGraph" type="static" showEmpty />
    </CollapsePropHeader>
  </CollapsePropHeader>
  <CollapsePropHeader title="子图表">
    <template #titleRight>
      <SmallButton icon="icon-add-bold" @click="($refs.listsubgraph as GraphChildrenListRef).onAddChildGraph()" />
    </template>
    <GraphChildrenList ref="listsubgraph" :graph="graph" :activeGraph="activeGraph" type="subgraph" showEmpty />
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import CollapsePropHeader from '../../Components/PropControl/Common/CollapsePropHeader.vue'
import GraphChildrenList, { type GraphChildrenListRef } from '../Graph/GraphChildrenList.vue';
import SmallButton from '../../Components/SmallButton.vue';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import GraphChildrenActiveDot from '../Graph/GraphChildrenActiveDot.vue';

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
  activeGraph: {
    type: Object as PropType<NodeGraph>,
    default: null,
  },
});

const { getNodeDocunmentEditorContext } = injectNodeGraphEditorContextInEditorOrIDE();

function onMainClicked() {
  getNodeDocunmentEditorContext()?.openGraph(props.graph)
}
</script>