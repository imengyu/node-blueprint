<template>
  <PropList 
    expandable
    dragSortable
    :items="graphList"
    :emptyText="showEmpty ? '没有数据，可点击右上角按钮添加' : ''"
    :childExpandable="(childGraph) => (childGraph as NodeGraph).children.length > 0"
    :childDragable="(childGraph, index) => ((childGraph as NodeGraph).type !== 'subgraph' || activeGraph?.children?.includes((childGraph as NodeGraph))) && !graphRenameState[index]"
    :childMouseEvent="onChildGraphMouseEvent"
    :childStartDrag="(childGraph, index, event) => onChildGraphDrag(childGraph as NodeGraph, event)"
    @drag-sort="onChildDragSort"
    @add="onAddChildGraph"
  >
    <template #rowHorizontal="{ item: childGraph, index }">
      <GraphChildrenIcon
        :graph="(childGraph as NodeGraph)"
      />
      <PropEditTextItem 
        :renameState="graphRenameState[index] ?? false"
        :model-value="(childGraph as NodeGraph).name"
        @update:model-value="(v: string) => onChildGraphNameUpdate((childGraph as NodeGraph), v as string)"
        @update:renameState="(v: boolean) => graphRenameState[index] = v"
      />
      <GraphChildrenActiveDot v-if="(childGraph as NodeGraph) === activeGraph" />
    </template>
    <template #rowExtend="{ item: childGraph }">
      <GraphChildrenList :graph="(childGraph as NodeGraph)" :activeGraph="activeGraph" type="subgraph" />
    </template>
  </PropList>
</template>

<script setup lang="ts">
import { ref, type PropType, computed } from 'vue';
import PropList from '../../Components/PropList/PropList.vue';
import PropEditTextItem from '../../Components/PropList/PropEditTextItem.vue';
import GraphChildrenIcon from './GraphChildrenIcon.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import BaseNodes from '@/node-blueprint/Nodes/Lib/BaseNodes';
import GraphChildrenActiveDot from './GraphChildrenActiveDot.vue';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import { NodeGraph, type NodeGraphType } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import { startInternalDataDragging } from '../../Graph/Editor/EditorDragController';
import { useGraphNameChangeHandler } from './Composeable/GraphNameChange';

export interface GraphChildrenListRef {
  onAddChildGraph(): void;
}

const props = defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
  activeGraph: {
    type: Object as PropType<NodeGraph>,
    default: null,
  },
  type: {
    type: String as PropType<NodeGraphType>,
    required: true,
  },
  showEmpty: {
    type: Boolean,
    default: false,
  },
});

const graphList = computed(() => {
  return props.graph.children.filter((p) => p.type === props.type);
})
const graphRenameState = ref<boolean[]>([]);
const { getNodeGraphEditorContext, getNodeIdeControlContext, getNodeDocunmentEditorContext } = injectNodeGraphEditorContextInEditorOrIDE();

function onAddChildGraph() {
  const graph = props.activeGraph;
  let childGraph: NodeGraph|null = null;
  switch (props.type) {
    case 'constructor':
      childGraph = new NodeGraph({
        name: "构造函数",
        description: '',
        type: props.type,
        inputPorts: [{
          guid: 'DEFAULT_IN',
          direction: 'input',
          name: '进入',
          paramType: NodeParamType.Execute,
        }],
        outputPorts: [],
      }, graph, true);
      break;
    case 'function':
    case 'static':
    case 'subgraph':
    case 'macro':
      childGraph = new NodeGraph({
        name: graph.getUseableGraphName('新图表'),
        description: '',
        type: props.type,
        inputPorts: [{
          guid: 'DEFAULT_IN',
          direction: 'input',
          name: '进入',
          paramType: NodeParamType.Execute,
        }],
        outputPorts: [{
          guid: 'DEFAULT_OUTPUT',
          direction: 'input',
          name: '退出',
          paramType: NodeParamType.Execute
        }],
      }, graph, true);
      break;
  }
  if (childGraph) {
    childGraph.load();
    childGraph.initNew();
    graph.children.push(childGraph);
    //进行图表中所有调用节点的更新  
    getNodeDocunmentEditorContext()?.dispstchMessage('sendMessageToFilteredNodes', { tag: `GraphCall${childGraph.name}`, message: BaseNodes.messages.GRAPH_ONLINE, data: {}});
  }
}
function onChildGraphDrag(childGraph: NodeGraph, e: DragEvent) {
  e.stopPropagation();
  startInternalDataDragging('drag:graph:' + (childGraph.type === 'subgraph' ? 'subgraph' : 'function') + ':' + childGraph.name);
}
function onChildGraphMouseEvent(item: unknown, index: number, type: 'click'|'dblclick'|'contextmenu', e: MouseEvent) {
  switch (type) {
    case 'dblclick':
      onEditChildGraph(item as NodeGraph);
      break;
    case 'contextmenu':
      onChildGraphMenu(index, item as NodeGraph, e);
      break;
  }
}
function onChildGraphMenu(index: number, childGraph: NodeGraph, e: MouseEvent) {
  const context = getNodeGraphEditorContext();
  if (!context)
    return;
  e.preventDefault();
  context.showContextMenu({
    x: e.x,
    y: e.y,
    items: [
      {
        label: '编辑',
        onClick() {
          onEditChildGraph(childGraph);
        },
      },
      {
        label: '重命名',
        onClick() {
          graphRenameState.value[index] = true;
        },
      },
      {
        label: '删除',
        onClick() {
          onDeleteChildGraph(childGraph);
        },
      },
    ]
  })
}
function onDeleteChildGraph(childGraph: NodeGraph) {
  const graph = props.graph;
  const context = getNodeGraphEditorContext();
  if (!context)
    return;
  context.userActionConfirm('warning', '是否确认删除此子图表？此操作会使当前或者其他图表中调用此图表的节点失效。').then((confirm) => {
    if (confirm) {
      ArrayUtils.remove(graph.children, childGraph);
      //通知当前图表中所有调用节点移除
      getNodeDocunmentEditorContext()?.dispstchMessage('sendMessageToFilteredNodes', { tag: `GraphCall${childGraph.name}`, message: BaseNodes.messages.GRAPH_DELETE, data: { name: childGraph.name }});
    }
  })

}

const { onGraphNameUpdate: onChildGraphNameUpdate } = useGraphNameChangeHandler();

function onEditChildGraph(childGraph: NodeGraph) {
  getNodeIdeControlContext()
    .getCurrentActiveDocunmentEditor()
    ?.openGraph(childGraph);
}
function onChildDragSort(dragItem: NodeGraph, targetIndex: number) {
  const filteredList = graphList.value;
  const refItem = filteredList[targetIndex] ?? filteredList[filteredList.length - 1];
  const list = props.graph.children;
  const insertPos = list.indexOf(refItem);
  ArrayUtils.remove(props.graph.children, dragItem);
  ArrayUtils.insert(props.graph.children, insertPos, dragItem);
}

defineExpose<GraphChildrenListRef>({
  onAddChildGraph,
})

</script>