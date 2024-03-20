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
          :model-value="(item as INodePortDefine).name"
          @update:model-value="(v: string) => onPortNameUpdate(item as INodePortDefine, v)"
        />
        <NodeParamTypePicker 
          :model-value="(item as INodePortDefine).paramType" 
          canBeAny
          canBeExecute
          canBeArrayOrSetOrDict
          canChangeSetType
          @update:model-value="(v: NodeParamType) => onPortTypeUpdate(item as INodePortDefine, v)"
        />
        <SmallButton title="上移" @click="onMovePort(item as INodePortDefine, false)">
          <Icon icon="icon-decline-filling" :rotate="180" />
        </SmallButton>
        <SmallButton title="下移" @click="onMovePort(item as INodePortDefine, true)">
          <Icon icon="icon-decline-filling" />
        </SmallButton>
        <SmallButton title="删除" @click="onDeletPort(item as INodePortDefine)">
          <Icon icon="icon-close" />
        </SmallButton>
      </PropItem>
      <PropItem 
        v-if="!(item as INodePortDefine).paramType.isExecute && !(item as INodePortDefine).paramType.isAny" 
        :title="(input ? '输入' : '输出') + '默认值'"
      >
        <GraphPortParamEditor :port="(item as NodePort)" />
      </PropItem>
    </template>
  </PropList>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import PropItem from '../../Components/PropList/PropItem.vue';
import PropList from '../../Components/PropList/PropList.vue';
import Icon from '../../Nana/Icon.vue';
import SmallButton from '../../Components/SmallButton.vue';
import GraphPortParamEditor from './GraphPortParamEditor.vue';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { INodePortDefine, NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import BaseNodes from '@/node-blueprint/Nodes/Lib/BaseNodes';
import NodeParamTypePicker from '../../Components/PropControl/Components/NodeParamTypePicker.vue';
import PropEditTextItem from '../../Components/PropList/PropEditTextItem.vue';

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
  context.userActionConfirm('warning', '是否确认删除此端口？将会断开与之相关的连接').then((confirm) => {
    if (confirm) {
      ArrayUtils.remove(ports.value, port);
      notifyPortChange();
    }
  });
}
function onMovePort(port: INodePortDefine, down: boolean) {
  const index = ports.value.indexOf(port) ;
  if (down) {
    ArrayUtils.downData(ports.value, index);
  } else {
    ArrayUtils.upData(ports.value, index);
  }
  notifyPortChange();
}
function onChildDragSort(dragItem: INodePortDefine, targetIndex: number) {
  ArrayUtils.reInsertToArray(ports.value, dragItem, targetIndex);
}

defineExpose<GraphPortListRef>({
  onAddPort,
});

</script>