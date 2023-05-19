<template>
  <!--单元连接弹出提示-->
  <div class="node-tooltip node-editor-no-move"
    v-if="connectingInfo"
    v-show="connectingInfo.isConnecting && !connectingInfo.isConnectingToNew"
    :style="{
      left: (connectingTooltipPos.x + 10) + 'px', 
      top:  (connectingTooltipPos.y - 40) + 'px' 
    }"
  >
    <span v-if="connectingInfo.currentHoverPort==null" class="center">
      <Icon icon="icon-select-bold" class="text-success mr-1" />
      连接至新的单元
    </span>
    <span v-else-if="connectingInfo.canConnect" class="center">
      <Icon icon="icon-select-bold" class="text-success mr-1" />
      <span v-html="connectingInfo.successText"></span>
    </span>
    <span v-else class="center">
      <Icon icon="icon-close" class="text-danger mr-1" />
      <span v-html="connectingInfo.failedText"></span>
    </span>
  </div>
  <!--小信息提示-->
  <div 
    class="node-editor-centertip node-editor-no-move"
    v-show="isShowSmallTip"
    v-html="smallTipText">
  </div>
  <!--添加节点菜单-->
  <AddNodePanel 
    ref="addNodePanel"
    v-model:show="isShowAddNodePanel"
    class="node-editor-no-move"
    :isAddDirectly="isAddDirectly"
    :allNodesGrouped="(allNodesGrouped as CategoryData[])"
    :filterByPortDirection="filterByPortDirection"
    :filterByPortType="filterByPortType"
    :position="(addNodePanelPosition as Vector2)"
    @addNode="onAddNode"
  />
</template>

<script lang="ts" setup>
import { inject, ref, type PropType, toRefs, onMounted, computed, watch } from 'vue';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { NodeGraphEditorInternalContext, NodeGraphEditorViewport } from '../NodeGraphEditor';
import type { IConnectingInfo } from '../Editor/EditorConnectorController';
import Icon from '../../Nana/Icon.vue';
import AddNodePanel from './AddNode/AddNodePanel.vue';
import type { INodeDefine } from '@/node-blueprint/Base/Flow/Node/Node';
import { NodeRegistry } from '@/node-blueprint/Base/Flow/Registry/NodeRegistry';
import type { CategoryData } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';

const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

const props = defineProps({
  connectingInfo: {
    type: Object as PropType<IConnectingInfo>,
    default: null
  },
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null
  }
})

const { viewPort, connectingInfo } = toRefs(props);

//#region 连接中提示

const connectingTooltipPos = computed(() => {
  return viewPort.value.viewportPointToScreenPoint(connectingInfo.value.endPos);
})

//#endregion

//#region 小信息提示

const isShowSmallTip = ref(false);
const smallTipText = ref('');

function showSmallTip(text : string, time = 1300) {
  smallTipText.value = text;
  isShowSmallTip.value = true;
  setTimeout(() => {
    isShowSmallTip.value = false;
  }, time)
}
function closeSmallTip() {
  isShowSmallTip.value = false;
}

//#endregion

//#region 添加节点菜单

const isShowAddNodePanel = ref(false);
const addNodePanelPosition = ref(new Vector2());
const isAddDirectly = ref(false);
const addNodePos = ref<Vector2>();
const filterByPortType = ref<NodeParamType>();
const filterByPortDirection = ref<NodePortDirection>();
const allNodesGrouped = ref<CategoryData[]>([]); 

function showAddNodePanel(screenPos: Vector2, _filterByPortType ?: NodeParamType|undefined, _filterByPortDirection ?: NodePortDirection|undefined, _addNodePos ?: Vector2, showAddDirectly ?: boolean): void {
  isAddDirectly.value = showAddDirectly ?? false;
  addNodePos.value = _addNodePos;
  filterByPortType.value = _filterByPortType;
  filterByPortDirection.value = _filterByPortDirection;
  addNodePanelPosition.value.set(screenPos);
  isShowAddNodePanel.value = true;
}

function closeAddBodePanel() {
  isShowAddNodePanel.value = false;
}

function onAddNode(block: INodeDefine) {
  isShowAddNodePanel.value = false;
  context?.userAddNode(block, addNodePos.value);
}

watch(isShowAddNodePanel, (show) => {
  if (!show && context)
    context.endConnectToNew();
});

//#endregion

onMounted(() => {
  allNodesGrouped.value = NodeRegistry.getInstance().getAllNodesGrouped();

  //鼠标未拖拽未选择情况下，弹出添加单元菜单
  context.getMouseHandler().pushMouseUpHandlers((info) => {
    if (!info.mouseMoved && !context.isAnyConnectorHover()) {
      showAddNodePanel(
        info.mouseCurrentPosScreen, 
        undefined,
        undefined,
        info.mouseCurrentPosViewPort.clone(),
        false
      );
      return true;
    }
    return false;
  })

  context.showAddNodePanel = showAddNodePanel;
  context.closeAddBodePanel = closeAddBodePanel;
  context.showSmallTip = showSmallTip;
  context.closeSmallTip = closeSmallTip;
});

</script>
