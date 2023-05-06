<template>
  <!--单元连接弹出提示-->
  <div class="node-tooltip"
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
    class="node-editor-centertip"
    v-show="isShowSmallTip"
    v-html="smallTipText">
  </div>
</template>

<script lang="ts" setup>
import { inject, ref, type PropType, toRefs, onMounted, computed } from 'vue';
import type { NodeGraphEditorInternalContext, NodeGraphEditorViewport } from '../NodeGraphEditor';
import type { IConnectingInfo } from '../Editor/EditorConnectorController';
import Icon from '../../Base/Icon.vue';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';

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

const connectingTooltipPos = computed(() => {
  return viewPort.value.viewportPointToScreenPoint(connectingInfo.value.endPos);
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

onMounted(() => {
  context.showSmallTip = showSmallTip;
  context.closeSmallTip = closeSmallTip;
});

</script>
