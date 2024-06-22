<template>
  <CodeLayoutScrollbar scroll="vertical">
    <PropList 
      :items="debugController.breakpoints.value"
        itemSize="small"
      :emptyText="`没有断点`"
    >
      <template #rowVertical="{ item }">
        <Row width="100%" justify="space-between" @click="onJumpToBreakpoint(item)">
          <Row align="center">
            <Width :width="10" />
            <Icon 
              fill="var(--mx-editor-red-text-color)"
              :icon="item.state === 'enable' ? 'icon-breakpoint-active' : 'icon-breakpoint'"
              :rotate="180"
            />
            <Width :width="5" />
            <BaseCheck 
              :modelValue="item.state === 'enable'" 
              size="small"
              @update:modelValue="(v) => onToggleBreakpoint(item, v)"
            />
            <Width :width="10" />
            {{ item.node.name }}
          </Row>
          <Row align="center">
            <SmallButton title="删除" @click="onDeleteBreakpoint(item)">
              <Icon icon="icon-close" />
            </SmallButton>
          </Row>
        </Row>
      </template>
    </PropList>
</CodeLayoutScrollbar>
</template>

<script setup lang="ts">
import { h, onMounted, ref, watch, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import { CodeLayoutScrollbar, type CodeLayoutPanelInternal } from 'vue-code-layout';
import type { EditorDebugBreakpoint, EditorDebugController } from '../Editor/EditorDebugController';
import PropList from '../../Components/PropList/PropList.vue';
import SmallButton from '../../Components/SmallButton.vue';
import Row from '../../Nana/Layout/RowView.vue';
import BaseCheck from '../../Components/PropControl/Components/BaseCheck.vue';
import Width from '../../Nana/Layout/Width.vue';

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

function onToggleBreakpoint(item: EditorDebugBreakpoint, on: boolean) {
  item.state = on ? 'disable' : 'enable';
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