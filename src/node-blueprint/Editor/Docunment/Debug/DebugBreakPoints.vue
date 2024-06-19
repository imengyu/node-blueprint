<template>
  <PropList 
    :items="debugController.breakpoints.value"
    :emptyText="`没有断点`"
  >
    <template #rowVertical="{ item }">
      <Row width="100%" justify="space-between" @click="onJumpToBreakpoint(item)">
        {{ item.node.name }}
        <Row>
          <SmallButton title="切换状态" @click="onToggleBreakpoint(item)">
            <Icon :icon="item.state === 'enable' ? 'icon-breakpoint-active' : 'icon-breakpoint'" :rotate="180" />
          </SmallButton>
          <SmallButton title="删除" @click="onDeleteBreakpoint(item)">
            <Icon icon="icon-close" />
          </SmallButton>
        </Row>
      </Row>
    </template>
  </PropList>
</template>

<script setup lang="ts">
import { h, onMounted, ref, watch, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import type { CodeLayoutPanelInternal } from 'vue-code-layout';
import type { EditorDebugBreakpoint, EditorDebugController } from '../Editor/EditorDebugController';
import PropList from '../../Components/PropList/PropList.vue';
import SmallButton from '../../Components/SmallButton.vue';
import Row from '../../Nana/Layout/RowView.vue';

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

const globalBreakPointDisableState = ref(false);

function onToggleBreakpoint(item: EditorDebugBreakpoint) {
  item.state = item.state === 'enable' ? 'disable' : 'enable';
  item.node.breakpoint = item.state;
}
function onDeleteBreakpoint(item: EditorDebugBreakpoint) {
  props.debugController.deleteBreakPoint(item);
}
function onJumpToBreakpoint(item: EditorDebugBreakpoint) {
  props.debugController.jumpToBreakPoint(item);
}

function initState() {
  globalBreakPointDisableState.value = props.debugController.getGlobalBreakPointDisableState();
}
function initToolbar() {
  const panel = props.panel;
  panel.actions = [
    {
      tooltip: '切换断点状态',
      icon: () => h(Icon, { 
        icon: globalBreakPointDisableState.value ? 'icon-breakpoint-disable' : 'icon-breakpoint-active', 
        class: globalBreakPointDisableState.value ? 'text-secondary' : 'text-danger'
      }),
      onClick() {
        globalBreakPointDisableState.value = !globalBreakPointDisableState.value;
        props.debugController.setGlobalBreakPointDisableState(globalBreakPointDisableState.value);
      },
    },
    {
      tooltip: '删除全部断点',
      icon: () => h(Icon, { icon: 'icon-trash' }),
      onClick() {
        props.debugController.deleteAllBreakPoint();
      },
    },
  ];
}

watch(() => props.panel, initToolbar);

onMounted(() => {
  initState();
  initToolbar();
});
</script>