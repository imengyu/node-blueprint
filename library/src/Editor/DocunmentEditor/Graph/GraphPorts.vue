<template>
  <PropList 
    dragSortable
    :items="ports"
    :emptyText="`没有${input?'输入':'输出'}，可点击右上角按钮添加`"
    @add="onAddPort"
    @dragSort="onChildDragSort"
  >
    <template #rowVertical="{ item }">
      <PropItem title="">
        <PropEditTextItem
          placeholder="端口名称"
          :renameState="true"
          :model-value="item.name"
          @update:model-value="(v: string) => onPortNameUpdate(item, v)"
        />
        <NodeParamTypePicker 
          :model-value="item.paramType" 
          canBeAny
          canBeExecute
          canBeArrayOrSetOrDict
          canChangeSetType
          @update:model-value="(v: NodeParamType) => onPortTypeUpdate(item, v)"
        />
        <SmallButton title="上移" @click="onMovePort(item, false)">
          <Icon icon="icon-decline-filling" :rotate="180" />
        </SmallButton>
        <SmallButton title="下移" @click="onMovePort(item, true)">
          <Icon icon="icon-decline-filling" />
        </SmallButton>
        <SmallButton title="删除" @click="onDeletPort(item)">
          <Icon icon="icon-close" />
        </SmallButton>
      </PropItem>
      <PropItem 
        v-if="!item.paramType.isExecute && !item.paramType.isAny" 
        :title="(input ? '输入' : '输出') + '默认值'"
      >
        <GraphPortParamEditor :port="item" />
      </PropItem>
    </template>
  </PropList>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import BaseNodes from '@/Nodes/Lib/BaseNodes';
import PropItem from '@/Editor/Components/Editor/PropList/PropItem.vue';
import PropList from '@/Editor/Components/Editor/PropList/PropList.vue';
import NodeParamTypePicker from '@/Editor/Components/Editor/PropControl/Components/NodeParamTypePicker.vue';
import PropEditTextItem from '@/Editor/Components/Editor/PropList/PropEditTextItem.vue';
import Icon from '@/Editor/Components/Shared/Icon.vue';
import SmallButton from '@/Editor/Components/Shared/SmallButton.vue';
import GraphPortParamEditor from './GraphPortParamEditor.vue';
import type { NodeGraph } from '@/Core/Graph/NodeGraph';
import type { INodePortDefine } from '@/Core/Node/NodePort';
import { NodeParamType } from '@/Core/Type/NodeParamType';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import { downData, reInsertToArray, upData } from '@/Common/ArrayTools';

export interface GraphPortListRef {
  onAddPort(): void;
}

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
  input: {
    type: Boolean,
    required: true,
  },
});

const { getNodeGraphEditorContext, getNodeDocunmentEditorContext } = injectNodeGraphEditorContextInEditorOrIDE();

const ports = computed(() => props.input ? props.graph.inputPorts : props.graph.outputPorts);

//通知当前图表中所有调用节点移除
function notifyPortChange() {
  getNodeDocunmentEditorContext()?.dispstchMessage('sendMessageToFilteredNodes', { tag: 'GraphEntry', message: BaseNodes.messages.GRAPH_PORT_CHANGE, data: { graph: props.graph }});
  getNodeDocunmentEditorContext()?.dispstchMessage('sendMessageToFilteredNodes', { tag: `GraphCall${props.graph.name}`, message: BaseNodes.messages.GRAPH_PORT_CHANGE, data: { graph: props.graph }});
}
function onPortTypeUpdate(port: INodePortDefine, newType: NodeParamType) {
  port.paramType = newType;
  notifyPortChange();
}
function onPortNameUpdate(port: INodePortDefine, newName: string) {
  port.name = newName;
  notifyPortChange();
}
function onAddPort() {
  ports.value.push({
    name: `新端口${ports.value.length + 1}`,
    guid: props.graph.getUseablePortName(props.input),
    direction: props.input ? 'input' : 'output',
    paramType: NodeParamType.Any,
  });
  console.log('aaa');
  
  notifyPortChange();
}
function onDeletPort(port: INodePortDefine) {
  const context = getNodeGraphEditorContext();
  if (!context)
    return;
  context.interfaceUtiles.userActionConfirm('warning', '是否确认删除此端口？将会断开与之相关的连接').then((confirm) => {
    if (confirm) {
      ports.value.remove(port);
      notifyPortChange();
    }
  });
}
function onMovePort(port: INodePortDefine, down: boolean) {
  const index = ports.value.indexOf(port) ;
  if (down) {
    downData(ports.value, index);
  } else {
    upData(ports.value, index);
  }
  notifyPortChange();
}
function onChildDragSort(dragItem: INodePortDefine, targetIndex: number) {
  reInsertToArray(ports.value, dragItem, targetIndex);
}

defineExpose<GraphPortListRef>({
  onAddPort,
});

</script>