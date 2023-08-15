<template>
  <PropList 
    :items="graph.children"
    @add="onAddChildGraph"
  >
    <template #row="{ item: childGraph }">
      <div
        v-tooltip="'可直接拖拽此箭头以添加子程序调用至图表中'"
        class="prop-list-dragger" 
        :style="{ backgroundImage: `url(${DraggerBg})` }"
        draggable="true"
        @dragstart="onChildGraphDrag(childGraph as NodeGraph, $event)"
      >
        <Icon icon="icon-back1" />
      </div>
      <div v-tooltip="'删除子图表'" class="prop-delete" @click="onDeleteChildGraph(childGraph as NodeGraph)">
        <Icon icon="icon-close" />
      </div>
      <PropItem title="图表名称">
        <Input 
          :model-value="(childGraph as NodeGraph).name" 
          :update-at="'blur'"
          placeholder="请输入图表名称"
          @update:model-value="(v: string) => onChildGraphNameUpdate((childGraph as NodeGraph), v as string)"
        />
      </PropItem>
      <PropItem title="图表注释">
        <Input 
          v-model="(childGraph as NodeGraph).description" 
          placeholder="图表的解释注释或者说明"
        />
      </PropItem>
      <PropItem title="">
        <SmallButton text="编辑图表" @click="onEditChildGraph(childGraph as NodeGraph)" />
      </PropItem>
    </template> 
    <template #add>
      <Icon icon="icon-add-bold" />
      添加子图表
    </template>
  </PropList>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import DraggerBg from '../../Images/dragger-bg.svg';
import PropItem from '../../Components/PropList/PropItem.vue';
import PropList from '../../Components/PropList/PropList.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import BaseNodes from '@/node-blueprint/Nodes/Lib/BaseNodes';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import Icon from '../../Nana/Icon.vue';
import Input from '../../Nana/Input/Input.vue';
import SmallButton from '../../Components/SmallButton.vue';

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});

const { getNodeGraphEditorContext, getNodeIdeControlContext } = injectNodeGraphEditorContextInEditorOrIDE();

function onAddChildGraph() {
  const graph = props.graph;
  const childGraph = new NodeGraph({
    name: '新子图表' + graph.children.length + 1,
    description: '',
    type: 'subblock',
    inputPorts: [{
      guid: 'DEFAULT_IN',
      direction: 'input',
      paramType: NodeParamType.Execute,
    }],
    outputPorts: [{
      guid: 'DEFAULT_OUTPUT',
      direction: 'input',
      paramType: NodeParamType.Execute
    }],
  }, graph, true);
  childGraph.load();
  childGraph.initNew();
  graph.children.push(childGraph);
}
function onChildGraphDrag(childGraph: NodeGraph, e: DragEvent) {
  const graph = props.graph;
  if(HtmlUtils.isEventInControl(e)) { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  else if (e.dataTransfer)
    e.dataTransfer.setData('text/plain', 'drag:graph:' + graph.uid + ':' + childGraph.uid);
}
function onDeleteChildGraph(childGraph: NodeGraph) {
  const graph = props.graph;
  const context = getNodeGraphEditorContext();
  if (!context)
    return;
  context.userActionConfirm('warning', '是否确认删除此子图表？此操作会使当前或者其他图表中调用此图表的节点失效。此操作不可恢复！').then((confirm) => {
    if (confirm) {
      ArrayUtils.remove(graph.children, childGraph);
      //通知当前图表中所有调用节点移除
      getNodeGraphEditorContext()?.sendMessageToFilteredNodes(`GraphCall${childGraph.name}`, BaseNodes.messages.GRAPH_DELETE, { name: childGraph.name });
    }
  })

}
function onChildGraphNameUpdate(childGraph: NodeGraph, newName: string) {
  //检查是否有其他图表也使用了这个名称，如果有则不允许更改
  const graph = props.graph;
  if (newName === childGraph.name)
    return;

  if (graph.children.find(k => k.name === newName)) {
    getNodeGraphEditorContext()?.userActionAlert('warning', `已有一个名为 ${newName} 的图表，请换一个名称`);
    return;
  }

  const oldName = childGraph.name;
  childGraph.name = newName;

  //进行图表中所有调用节点的更新
  getNodeGraphEditorContext()?.sendMessageToFilteredNodes(`GraphCall${oldName}`, BaseNodes.messages.GRAPH_NAME_CHANGE, { name: newName });
}
function onEditChildGraph(childGraph: NodeGraph) {
  getNodeIdeControlContext()
    .getCurrentActiveDocunmentEditor()
    ?.openGraph(childGraph);
}
</script>