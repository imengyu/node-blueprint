<!-- eslint-disable vue/no-v-html -->
<template>
  <!--单元连接弹出提示-->
  <div
    v-if="connectingInfo"
    v-show="connectingInfo.isConnecting && !connectingInfo.isConnectingToNew"
    class="nana-tooltip node-editor-no-move"
    :style="{
      left: (connectingTooltipPos.x + 10) + 'px', 
      top: (connectingTooltipPos.y - 40) + 'px' 
    }"
  >
    <span v-if="connectingInfo.currentHoverPort==null" class="center">
      <Icon icon="icon-select-bold" class="text-success mr-1" />
      连接至新的单元
    </span>
    <span v-else-if="connectingInfo.canConnect" class="center">
      <Icon icon="icon-select-bold" class="text-success mr-1" />
      <span v-html="connectingInfo.successText" />
    </span>
    <span v-else class="center">
      <Icon icon="icon-close" class="text-danger mr-1" />
      <span v-html="connectingInfo.failedText" />
    </span>
  </div>
  <!--小信息提示-->
  <div 
    v-show="isShowSmallTip"
    class="node-editor-centertip node-editor-no-move"
    v-html="smallTipText"
  />
  <!--添加节点菜单-->
  <Teleport :to="teleport">
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
  </Teleport>
</template>

<script lang="ts" setup>
import { inject, ref, type PropType, toRefs, onMounted, computed, watch } from 'vue';
import { NodeRegistry } from '@/node-blueprint/Base/Flow/Registry/NodeRegistry';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { NodeGraphEditorInternalContext, NodeGraphEditorViewport } from '../NodeGraphEditor';
import type { IConnectingInfo } from '../Editor/EditorConnectorController';
import type { INodeDefine } from '@/node-blueprint/Base/Flow/Node/Node';
import type { CategoryData } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';
import Icon from '../../Nana/Icon.vue';
import AddNodePanel from './AddNode/AddNodePanel.vue';
import Alert from '../../Nana/Modal/Alert';

const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

const props = defineProps({
  connectingInfo: {
    type: Object as PropType<IConnectingInfo>,
    default: null
  },
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null
  },
  teleport: {
    type: String,
    default: '#app',
  }
})

const { viewPort, connectingInfo } = toRefs(props);

//#region 连接中提示

const connectingTooltipPos = computed(() => {
  return viewPort.value.viewportPointToEditorPoint(connectingInfo.value.endPos);
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

//#region 对话框

context.showModal = (options) => {
  Alert.alert(options);
};

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

function closeAddNodePanel() {
  isShowAddNodePanel.value = false;
}

function onAddNode(node: INodeDefine) {
  isShowAddNodePanel.value = false;
  context?.userAddNode(node, addNodePos.value);
  console.trace('onAddNode');
}

watch(isShowAddNodePanel, (show) => {
  if (!show && context)
    context.endConnectToNew();
});

//#endregion

onMounted(() => {
  allNodesGrouped.value = NodeRegistry.getInstance().getAllNodesGrouped();

  //鼠标未拖拽未选择情况下，弹出添加单元菜单
  context.getMouseHandler().pushMouseUpHandlers((info, e) => {
    if (!info.mouseMoved && e.button === 2 && !context.isAnyConnectorHover()) {
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
  context.closeAddNodePanel = closeAddNodePanel;
  context.showSmallTip = showSmallTip;
  context.closeSmallTip = closeSmallTip;
});

</script>
