<!-- eslint-disable vue/no-v-html -->
<template>
  <!--编辑器内部鼠标悬浮弹出提示-->
  <Teleport :to="teleport">
    <TooltipContent 
      v-if="editorHoverInfoTip.show"
      :x="editorHoverInfoTooltipPos.x"
      :y="editorHoverInfoTooltipPos.y"
      ignoreEvent
      centerContent
      class="node-editor-no-move"
    >
      <template #content>
        <Icon v-if="editorHoverInfoTip.status === 'success'" icon="icon-select-bold" class="text-success mr-1" />
        <Icon v-else-if="editorHoverInfoTip.status === 'failed'" icon="icon-close" class="text-danger mr-1" />
        <span v-html="editorHoverInfoTip.text" />
      </template>
    </TooltipContent>
  </Teleport>
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
    <SelectTypePanel 
      ref="selectTypePanel"
      v-model:show="isShowSelectTypePanel"
      :position="(selectTypePanelPosition as Vector2)"
      :canBeAny="selectTypePanelCanbeAny"
      :canBeExecute="selectTypePanelCanbeExecute"
      :canBeArrayOrSetOrDict="selectTypePanelCanBeArrayOrSetOrDict"
      class="node-editor-no-move"
      @selectType="onSelectType"
    />
  </Teleport>
</template>

<script lang="ts" setup>
import { inject, ref, type PropType, onMounted, watch, reactive } from 'vue';
import { NodeRegistry } from '@/node-blueprint/Base/Flow/Registry/NodeRegistry';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { NodeGraphEditorInternalContext, NodeGraphEditorViewport } from '../NodeGraphEditor';
import type { INodeDefine } from '@/node-blueprint/Base/Flow/Node/Node';
import type { CategoryData } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';
import Icon from '../../Nana/Icon.vue';
import AddNodePanel from './AddNode/AddNodePanel.vue';
import SelectTypePanel from './SelectType/SelectTypePanel.vue';
import Alert from '../../Nana/Modal/Alert';
import { SimpleTimer } from '@/node-blueprint/Base/Utils/Timer/Timer';
import TooltipContent from '../../Nana/Tooltip/TooltipContent.vue';

const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

defineProps({
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null
  },
  teleport: {
    type: String,
    default: '#app',
  }
})

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
context.showConfirm = (options) => {
  return Alert.confirm(options);
};

//#endregion

//#region 鼠标悬浮提示

const editorHoverInfoTip = reactive({
  show: false,
  text: '',
  status: '',
});
const editorHoverInfoTooltipPos = ref(new Vector2());
const updateMousePointTimer = new SimpleTimer(undefined, () => {
  editorHoverInfoTooltipPos.value.set(context.getMouseInfo().mouseCurrentPosScreen);
}, 20);

context.showEditorHoverInfoTip = (text : string, status: 'success'|'failed'|'' = '') => {
  editorHoverInfoTip.show = true;
  editorHoverInfoTip.text = text;
  editorHoverInfoTip.status = status;
  updateMousePointTimer.start();
};
context.closeEditorHoverInfoTip = () => {
  editorHoverInfoTip.show = false;
  updateMousePointTimer.stop();
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
}

watch(isShowAddNodePanel, (show) => {
  if (!show && context)
    context.endConnectToNew();
});

//#endregion

//#region 选择类型菜单

const isShowSelectTypePanel = ref(false);
const selectTypePanelPosition = ref(new Vector2());
const selectTypePanelCanbeExecute = ref(false);
const selectTypePanelCanbeAny = ref(false);
const selectTypePanelCanBeArrayOrSetOrDict = ref(false);
let selectPromiseResolve: ((e: NodeParamType) => void)|undefined = undefined;

function showSelectTypePanel(screenPos: Vector2, canbeExecute: boolean, canbeAny: boolean, canBeArrayOrSetOrDict: boolean) {
  isShowSelectTypePanel.value = true;
  selectTypePanelPosition.value = screenPos;
  selectTypePanelCanbeExecute.value = canbeExecute;
  selectTypePanelCanbeAny.value = canbeAny;
  selectTypePanelCanBeArrayOrSetOrDict.value = canBeArrayOrSetOrDict;
  return new Promise<NodeParamType>((resolve) => {
    selectPromiseResolve = resolve;
  });
}
function closeSelectTypePanel() {
  isShowSelectTypePanel.value = false;
}

function onSelectType(type: NodeParamType) {
  type = type.define?.typeCreate ? type.define.typeCreate(type) : type;
  closeSelectTypePanel();
  if (selectPromiseResolve) {
    selectPromiseResolve(type);
    selectPromiseResolve = undefined;
  }
}

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

  context.showSelectTypePanel = showSelectTypePanel;
  context.closeSelectTypePanel = closeSelectTypePanel;
  context.showAddNodePanel = showAddNodePanel;
  context.closeAddNodePanel = closeAddNodePanel;
  context.showSmallTip = showSmallTip;
  context.closeSmallTip = closeSmallTip;
});

</script>
