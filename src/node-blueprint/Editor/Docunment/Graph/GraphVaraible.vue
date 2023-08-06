<template>
  <PropList 
    :items="graph.variables"
    @add="onAddGraphVariable"
  >
    <template #row="{ item: variable }">
      <div
        v-tooltip="'可直接拖拽此箭头以添加变量至图表中'"
        class="prop-list-dragger" 
        :style="{ backgroundImage: `url(${DraggerBg})` }"
        draggable="true"
        @dragstart="onGraphVariableDrag(variable as NodeVariable, $event)"
      >
        <Icon icon="icon-back1" />
      </div>
      <div v-tooltip="'删除变量'" class="prop-delete" @click="onDeleteGraphVariable(variable as NodeVariable)">
        <Icon icon="icon-close" />
      </div>
      <PropItem title="变量名称">
        <Input v-model="(variable as NodeVariable).name" />
      </PropItem>
      <PropItem title="变量类型">
        <NodeParamTypePicker v-model="(variable as NodeVariable).type" />
      </PropItem>
      <PropItem title="变量默认值">
        <GraphVaraibleParamEditor :variable="(variable as NodeVariable)" />
      </PropItem>
      <PropItem title="静态">
        <BaseCheck v-model="(variable as NodeVariable).static" />
      </PropItem>
    </template> 
    <template #add>
      <Icon icon="icon-add-bold" />
      添加图表变量
    </template>
  </PropList>
</template>

<script setup lang="ts">
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { PropType } from 'vue';
import PropItem from '../../Components/PropList/PropItem.vue';
import PropList from '../../Components/PropList/PropList.vue';
import Input from '../../Nana/Input/Input.vue';
import Icon from '../../Nana/Icon.vue';
import DraggerBg from '../../Images/dragger-bg.svg';
import { NodeVariable } from '@/node-blueprint/Base/Flow/Graph/NodeVariable';
import NodeParamTypePicker from '../../Components/PropControl/Components/NodeParamTypePicker.vue';
import GraphVaraibleParamEditor from '../Graph/GraphVaraibleParamEditor.vue';
import BaseCheck from '../../Components/PropControl/Components/BaseCheck.vue';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});

function onAddGraphVariable() {
  const graph = props.graph;
  const variable = new NodeVariable();
  variable.name = '变量' + graph.variables.length;
  variable.type = NodeParamType.Any;
  graph.variables.push(variable);
}
function onGraphVariableDrag(variable: NodeVariable, e: DragEvent) {
  const graph = props.graph;
  if(HtmlUtils.isEventInControl(e)) { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  else if (e.dataTransfer)
    e.dataTransfer.setData('text/plain', 'drag:graph-variable:' + graph.uid + ':' + variable.name);
}
function onDeleteGraphVariable(variable: NodeVariable) {
  const graph = props.graph;
  ArrayUtils.remove(graph.variables, variable);
}
</script>