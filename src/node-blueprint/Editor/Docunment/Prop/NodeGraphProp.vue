<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader title="图表属性">
    <CollapsePropHeader title="基础">
      <CollapsePropItem title="图表标题">
        <Input 
          :modelValue="graph.name"
          class="prop-item-editor"
          type="text"
          placeholder="图表的标题"
          @update:model-value="(v: string) => onGraphNameUpdate(graph, v as string)"
        />
      </CollapsePropItem>
      <CollapsePropItem title="图表注释">
        <textarea v-model="graph.description" class="prop-item-editor" placeholder="图表的解释注释或者说明..." style="resize:vertical;" />
      </CollapsePropItem>
      <GraphChildrenDragArrow v-if="graphCanInsertToSelf" :childGraph="(graph as NodeGraph)" />
    </CollapsePropHeader>
    <CollapsePropHeader v-if="graph.type !== 'main'" title="输入">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listInput as GraphPortListRef).onAddPort()" />
      </template>
      <GraphPorts ref="listInput" :graph="graph" :input="true" />
    </CollapsePropHeader>
    <CollapsePropHeader v-if="graph.type !== 'main'" title="输出">
      <template #titleRight>
        <SmallButton icon="icon-add-bold" @click="($refs.listOutput as GraphPortListRef).onAddPort()" />
      </template>
      <GraphPorts ref="listOutput" :graph="graph" :input="false" />
    </CollapsePropHeader>
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import Input from '../../Nana/Input/Input.vue';
import CollapsePropHeader from '../../Components/PropControl/Common/CollapsePropHeader.vue'
import CollapsePropItem from '../../Components/PropControl/Common/CollapsePropItem.vue';
import GraphChildrenDragArrow from '../Graph/GraphChildrenDragArrow.vue';
import GraphPorts, { type GraphPortListRef } from '../Graph/GraphPorts.vue';
import SmallButton from '../../Components/SmallButton.vue';
import { useGraphNameChangeHandler } from '../Graph/Composeable/GraphNameChange';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});

const graphCanInsertToSelf = computed(() => {
  if (props.graph.type === 'function' || props.graph.type === 'static' 
    || props.graph.type === 'macro' || props.graph.type === 'class')
    return true;
  return false;
});

const { onGraphNameUpdate } = useGraphNameChangeHandler();
</script>