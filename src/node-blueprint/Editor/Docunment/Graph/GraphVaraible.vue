<template>
  <PropList 
    :items="graph.variables"
    @add="onAddGraphVariable"
  >
    <template #rowVertical="{ item: variable }">
      <div
        v-tooltip="'可直接拖拽此箭头以添加变量至图表中'"
        class="prop-list-dragger" 
        :style="{ backgroundImage: `url(${DraggerBg})` }"
        draggable="true"
        @dragstart="onGraphVariableDrag(variable, $event)"
      >
        <Icon icon="icon-back1" />
      </div>
      <div v-tooltip="'删除变量'" class="prop-delete" @click="onDeleteGraphVariable(variable)">
        <Icon icon="icon-close" />
      </div>
      <PropItem title="变量名称">
        <Input 
          :model-value="variable.name" 
          :update-at="'blur'"
          @update:model-value="(v) => onGraphVariableNameUpdate(variable, v as string)"
        />
      </PropItem>
      <PropItem title="变量类型">
        <NodeParamTypePicker
          canChangeSetType
          :model-value="variable.type" 
          @update:model-value="(v) => onGraphVariableTypeUpdate(variable, v as NodeParamType)"
        />
      </PropItem>
      <PropItem title="变量默认值">
        <GraphVaraibleParamEditor :variable="variable" />
      </PropItem>
      <PropItem title="静态">
        <BaseCheck v-model="variable.static" />
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
import NodeParamTypePicker from '../../Components/PropControl/Components/NodeParamTypePicker.vue';
import GraphVaraibleParamEditor from '../Graph/GraphVaraibleParamEditor.vue';
import BaseCheck from '../../Components/PropControl/Components/BaseCheck.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import BaseNodes from '@/node-blueprint/Nodes/Lib/BaseNodes';
import { NodeVariable } from '@/node-blueprint/Base/Flow/Graph/NodeVariable';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import { startInternalDataDragging } from '../../Graph/Editor/EditorDragController';

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});

const { getNodeGraphEditorContext } = injectNodeGraphEditorContextInEditorOrIDE();

function onAddGraphVariable() {
  const graph = props.graph;
  const variable = new NodeVariable();
  variable.name = graph.getUseableVariableName('变量');
  variable.type = NodeParamType.Any;
  graph.variables.push(variable);
}
function onGraphVariableDrag(variable: NodeVariable, e: DragEvent) {
  const graph = props.graph;
  if(HtmlUtils.isEventInControl(e)) { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  else {
    startInternalDataDragging('drag:graph-variable:' + graph.uid + ':' + variable.name);
  }
}
function onDeleteGraphVariable(variable: NodeVariable) {
  const graph = props.graph;
  ArrayUtils.remove(graph.variables, variable);
}

function onGraphVariableNameUpdate(variable: NodeVariable, newName: string) {
  //检查是否有其他变量也使用了这个名称，如果有则不允许更改
  const graph = props.graph;
  if (newName === variable.name)
    return;

  if (graph.variables.find(k => k.name === newName)) {
    getNodeGraphEditorContext()?.userActionAlert('warning', `已有一个名为 ${newName} 的变量，请换一个名称`);
    return;
  }

  const oldName = variable.name;
  variable.name = newName;

  //进行图表中所有变量节点的更新
  getNodeGraphEditorContext()?.sendMessageToFilteredNodes(oldName, BaseNodes.messages.VARIABLE_UPDATE_NAME, { name: newName });
}
function onGraphVariableTypeUpdate(variable: NodeVariable, type: NodeParamType) {
  //设置变量类型，重新设置使用类型的默认值
  if (!variable.type.equal(type)) {
    variable.type = type;
    variable.defaultValue = type.define?.defaultValue();
  }
  //进行图表中所有变量节点的更新
  getNodeGraphEditorContext()?.sendMessageToFilteredNodes(variable.name, BaseNodes.messages.VARIABLE_UPDATE_TYPE, { type });
}

</script>