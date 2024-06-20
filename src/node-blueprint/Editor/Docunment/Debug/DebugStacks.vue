<template>
  <CodeLayoutScrollbar scroll="vertical">
    <ConsoleItem 
      v-if="debugController.currentExecuteError.value"
      v-model:warpOpen="globalErrorExpand"
      :content="debugController.currentExecuteError.value"
      hasWarp
      level="error"
    />
    <ConsoleItem 
      v-if="debugController.currentExecuteInfo.value"
      v-model:warpOpen="globalErrorExpand"
      :content="debugController.currentExecuteInfo.value"
      hasWarp
      level="info"
    />
    <PropList 
      v-if="debugController.currentExecutePauseInfo.value"
      :items="debugController.currentExecutePauseInfo.value?.contexts"
    >
      <template #rowVertical="{ item }">
        <CollapseItem
          open
          :title="item.graph.name"
        >
          <Row 
            v-for="(stack, i) in item.runStack" 
            :key="i"
            width="100%"
            justify="space-between"
            class="console-item tiny"
            @click="onShowStack(item)"
          >
            {{ stack.node.name }}
            <Row>
              <SmallButton title="跳转" @click="onJumpToNode(stack.node)">
                <Icon icon="icon-route" />
              </SmallButton>
            </Row>
          </Row>
        </CollapseItem>
      </template>
    </PropList>
  </CodeLayoutScrollbar>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import { CodeLayoutScrollbar, type CodeLayoutPanelInternal } from 'vue-code-layout';
import type { EditorDebugController } from '../Editor/EditorDebugController';
import PropList from '../../Components/PropList/PropList.vue';
import SmallButton from '../../Components/SmallButton.vue';
import Row from '../../Nana/Layout/RowView.vue';
import CollapseItem from '../../Components/List/CollapseItem.vue';
import type { Node } from '@/node-blueprint/Base/Flow/Node/Node';
import type { EditorDebugRunnerPauseContextInfo } from '@/node-blueprint/Base/Debugger/EditorDebugRunner';
import ConsoleItem from '../../Console/ConsoleItem.vue';

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

const globalErrorExpand = ref(false);
const globalBreakPointDisableState = ref(false);

function onJumpToNode(item: Node) {
  props.debugController.jumpToNode(item);
}
function onShowStack(item: EditorDebugRunnerPauseContextInfo) {
  const debugController = props.debugController;
  debugController.currentExecuteVariableInfo.value = item.variables;
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