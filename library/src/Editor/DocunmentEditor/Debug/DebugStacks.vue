<template>
  <TreeList
    v-if="debugController.currentExecutePauseInfo.value"
    :items="debugController.currentExecutePauseInfo.value.contexts"
    :desc="stackListDesc"
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
import Icon from '@/Editor/Components/Shared/Icon.vue';
import SmallButton from '@/Editor/Components/Shared/SmallButton.vue';
import ConsoleItem from '@/Editor/Components/Console/ConsoleItem.vue';
import TreeList from '@/Editor/Components/Editor/List/TreeList.vue';
import type { Node } from '@/Core/Node/Node';
import type { EditorDebugRunnerStackInfo } from '@/Core/Debugger/EditorDebugRunner';
import type { EditorDebugController } from '../Editor/EditorDebugController';
import type { ITreeListDescItem } from '@/Editor/Components/Editor/List/TreeList';

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
  props.debugController.jumpToNode(item, undefined, true);
}
function onShowStack(item: EditorDebugRunnerStackInfo) {
  props.debugController.activeStackLineAndFirstNode(item.parent);
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