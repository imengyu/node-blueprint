<template>
  <TreeList
    v-if="debugController.currentExecutePauseInfo.value"
    :items="debugController.currentExecutePauseInfo.value.contexts"
    :dsec="stackListDesc"
    :defaultOpen="true"
    @itemClick="onShowStack"
  >
    <template #prefix>
      <ConsoleItem 
        v-if="debugController.currentExecuteError.value"
        v-model:warpOpen="globalErrorExpand"
        :content="debugController.currentExecuteError.value"
        hasWarp
        tiny
        level="error"
      />
      <ConsoleItem 
        v-if="debugController.currentExecuteInfo.value"
        v-model:warpOpen="globalErrorExpand"
        :content="debugController.currentExecuteInfo.value"
        hasWarp
        tiny
        level="info"
      />
    </template>
    <template #itemLeft="{ level, item }">
      <span v-if="level == 0">{{ item.graph.name }}</span>
      <span v-else-if="level == 1">{{ item.node.name }}</span>
    </template>
    <template #itemRight="{ level, item }">
      <template v-if="level == 1">
        <SmallButton title="跳转" @click="onJumpToNode(item.node)">
          <Icon icon="icon-route" />
        </SmallButton>
      </template>
    </template>
  </TreeList>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue';
import { type CodeLayoutPanelInternal } from 'vue-code-layout';
import Icon from '../../Nana/Icon.vue';
import SmallButton from '../../Components/SmallButton.vue';
import ConsoleItem from '../../Console/ConsoleItem.vue';
import TreeList from '../../Components/List/TreeList.vue';
import type { Node } from '@/node-blueprint/Base/Flow/Node/Node';
import type { EditorDebugRunnerPauseContextInfo, EditorDebugRunnerStackInfo } from '@/node-blueprint/Base/Debugger/EditorDebugRunner';
import type { EditorDebugController } from '../Editor/EditorDebugController';
import type { ITreeListDescItem } from '../../Components/List/TreeList';

const props = defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    default: null,
  },
  debugController: {
    type: Object as PropType<EditorDebugController>,
    default: null,
  },
});

const stackListDesc : ITreeListDescItem[] = [
  { childrenKey: 'runStack' },
];

const globalErrorExpand = ref(false);
const globalBreakPointDisableState = ref(false);

function onJumpToNode(item: Node) {
  props.debugController.jumpToNode(item);
}
function onShowStack(item: EditorDebugRunnerStackInfo) {
  props.debugController.showStackVariableInfo(item.parent);
}

function initState() {
  globalBreakPointDisableState.value = props.debugController.getGlobalBreakPointDisableState();
}
function initToolbar() {
  const panel = props.panel;
  panel.actions = [
    
  ];
}

watch(() => props.panel, initToolbar);

onMounted(() => {
  initState();
  initToolbar();
});
</script>