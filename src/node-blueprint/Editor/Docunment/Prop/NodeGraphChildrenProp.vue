<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader v-if="graph.type === 'class'" :title="`类 ${graph.name}`" noFold>
    <CollapsePropHeader title="构造函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listConstructor as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listConstructor" :graph="graph" type="constructor" />
    </CollapsePropHeader>
    <CollapsePropHeader title="实例函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listFunction as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listFunction" :graph="graph" type="function" />
    </CollapsePropHeader>
    <CollapsePropHeader title="静态函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listStatic as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listStatic" :graph="graph" type="static" />
    </CollapsePropHeader>
    <CollapsePropHeader title="子图表">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listSubblock as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listSubblock" :graph="graph" type="subblock" />
    </CollapsePropHeader>
  </CollapsePropHeader>
  <CollapsePropHeader v-else-if="graph.type === 'main'" title="主文档" noFold>
    <CollapsePropHeader title="子图表">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listSubblock as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listSubblock" :graph="graph" type="subblock" />
    </CollapsePropHeader>
    <CollapsePropHeader title="静态函数">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listStatic as GraphChildrenListRef).onAddChildGraph()" />
      </template>
      <GraphChildrenList ref="listStatic" :graph="graph" type="static" />
    </CollapsePropHeader>
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import Input from '../../Nana/Input/Input.vue';
import CollapsePropHeader from '../../Components/PropControl/Common/CollapsePropHeader.vue'
import CollapsePropItem from '../../Components/PropControl/Common/CollapsePropItem.vue';
import GraphVaraible from '../Graph/GraphVaraible.vue';
import GraphPorts from '../Graph/GraphPorts.vue';
import GraphChildrenList, { type GraphChildrenListRef } from '../Graph/GraphChildrenList.vue';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import GraphChildrenDragArrow from '../Graph/GraphChildrenDragArrow.vue';
import SmallButton from '../../Components/SmallButton.vue';

defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});
</script>