<template>
  <CodeLayoutBase 
    ref="codeLayoutBase"
    :config="layoutConfig"
    :activityBar="activityBar"
    :primarySideBar="primarySideBar"
    :secondarySideBar="secondarySideBar"
    :bottomPanel="bottomPanel"
    :statusBar="statusBar"
    @update:bottom-panel="(v) => $emit('update:bottomPanel', v)"
    @update:primary-side-bar="onPrimarySideBarSwitch"
    @update:secondary-side-bar="(v) => $emit('update:secondarySideBar', v)"
  >
    <template #activityBar>
      <div class="top">
        <CodeLayoutActionItem
          v-for="(panelGroup, key) in panels.primary"
          :key="key"
          :item="panelGroup"
          :active="panelGroup === activityBarActive && primarySideBar"
          @active-item="onActivityBarAcitve(panelGroup)"
        />
      </div>
      <div class="bottom">
        <slot name="activityBarBottom" />
      </div>
    </template>
    <template #primarySideBar>
      <template v-if="panels.primary.length > 0">
        <CodeLayoutGroupRender
          v-for="(panelGroup, key) in panels.primary"
          :key="key"
          :group="panelGroup"
          :horizontal="false"
          :primary="true"
        >
          <template #panelRender="data">
            <slot name="panelRender" v-bind="data" />
          </template>
        </CodeLayoutGroupRender>
      </template>
      <slot name="emptyGroup" group="primarySideBar">
        <div class="code-layout-empty">{{ emptyText }}</div>
      </slot>
    </template>
    <template #secondarySideBar>
      <template v-if="panels.secondary.length > 0">
        <CodeLayoutGroupRender
          v-for="(panelGroup, key) in panels.secondary"
          :key="key"
          :group="panelGroup"
          :horizontal="false"
        >
          <template #panelRender="data">
            <slot name="panelRender" v-bind="data" />
          </template>
        </CodeLayoutGroupRender>
      </template>
      <slot name="emptyGroup" group="secondarySideBar">
        <div class="code-layout-empty">{{ emptyText }}</div>
      </slot>
    </template>
    <template #bottomPanel>
      <template v-if="panels.bottom.length > 0">
        <CodeLayoutGroupRender
          v-for="(panelGroup, key) in panels.bottom"
          :key="key"
          :group="panelGroup"
          :horizontal="true"
        >
          <template #panelRender="data">
            <slot name="panelRender" v-bind="data" />
          </template>
        </CodeLayoutGroupRender>
      </template>
      <slot name="emptyGroup" group="bottomPanel">
        <div class="code-layout-empty">{{ emptyText }}</div>
      </slot>
    </template>
    <template #centerArea>
      <h1>center area</h1>
    </template>
    <template #statusBar>
      <slot name="statusBar" />
    </template>
  </CodeLayoutBase>
</template>

<script setup lang="ts">
import { ref , type PropType, onMounted, provide, onBeforeUnmount } from 'vue';
import type { CodeLayoutConfig, CodeLayoutGrid, CodeLayoutPanel, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutBase, { type CodeLayoutBaseInstance } from './CodeLayoutBase.vue';
import CodeLayoutActionItem from './CodeLayoutActionItem.vue';
import CodeLayoutGroupRender from './CodeLayoutGroupRender.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';

const panels = ref<{
  primary: CodeLayoutPanelInternal[],
  secondary: CodeLayoutPanelInternal[],
  bottom: CodeLayoutPanelInternal[],
  center: CodeLayoutPanelInternal[],
}>({
  primary: [],
  secondary: [],
  bottom: [],
  center: [],
});

export interface CodeLayoutGroupInstance {
  notifyRelayout: () => void,
}
export interface CodeLayoutContext {
  addGroup: (instance: CodeLayoutGroupInstance) => void,
  removeGroup: (instance: CodeLayoutGroupInstance) => void,
}

const codeLayoutBase = ref<CodeLayoutBaseInstance>();
const activityBarActive = ref<CodeLayoutPanelInternal>();

const emit = defineEmits([
  'update:primarySideBar',
  'update:secondarySideBar',
  'update:bottomPanel',
]) ;

const props = defineProps({
  layoutConfig: {
    type: Object as PropType<CodeLayoutConfig>,
    required: true,
  },
  activityBar: {
    type: Boolean,
    default: true,
  },
  primarySideBar: {
    type: Boolean,
    default: true,
  },
  secondarySideBar: {
    type: Boolean,
    default: true,
  },
  bottomPanel: {
    type: Boolean,
    default: true,
  },
  statusBar: {
    type: Boolean,
    default: true,
  },
  emptyText: {
    type: String,
    default: "Drag a view here to display",
  },
});

const groupInstances = [] as CodeLayoutGroupInstance[];

provide('layoutConfig', props.layoutConfig);
provide<CodeLayoutContext>('codeLayoutContext', {
  addGroup(instance) {
    groupInstances.push(instance);
  },
  removeGroup(instance) {
    ArrayUtils.remove(groupInstances, instance);
  },
});

function onActivityBarAcitve(panelGroup: CodeLayoutPanelInternal) {
  if (activityBarActive.value === panelGroup && props.layoutConfig.primarySideBarSwitchWithActivityBar) {
    //如果点击当前条目，则切换侧边栏
    emit('update:primarySideBar', !props.primarySideBar);
  } else {
    //如果侧边栏关闭，则打开
    if (!props.primarySideBar)
      emit('update:primarySideBar', true);
    //取消激活其他的面板
    panels.value.primary.forEach((p) => p.open = false);
    panelGroup.open = true;
    activityBarActive.value = panelGroup;
  }
}
function onPrimarySideBarSwitch(on: boolean) {
  //当侧边栏关闭时，取消激活全部的面板
  if (!on) 
    panels.value.primary.forEach((p) => p.open = false);
  //当侧边栏重新打开时，需要重新显示激活面板
  if (on &&  activityBarActive.value && !panels.value.primary.find((p) => p.open))
    activityBarActive.value.open = true;
  emit('update:primarySideBar', on);
}

function getPanelArray(target: CodeLayoutGrid) {
  switch (target) {
    case 'primarySideBar': return panels.value.primary;
    case 'secondarySideBar': return panels.value.secondary;
    case 'bottomPanel': return panels.value.bottom;
    case 'centerArea': return panels.value.center;
  }
  throw new Error(`Grid can not insert panel`);
}

//公开控制接口

function closePanel(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  if (panelInternal.parentGroup) {
    const group = panelInternal.parentGroup;
    panelInternal.parentGroup.activePanel = panelInternal;
    group.open = true;
  } else {
    throw new Error(`Panel ${panel.name} has not in any container, can not active it.`);
  } 
}
function togglePanel(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  if (panelInternal.parentGroup) {
    const group = panelInternal.parentGroup;
    panelInternal.parentGroup.activePanel = panelInternal;
    group.open = !group.open;
    return group.open;
  } else {
    throw new Error(`Panel ${panel.name} has not in any container, can not active it.`);
  } 
}
function openPanel(panel: CodeLayoutPanel, closeOthers = false) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  if (panelInternal.parentGroup) {
    const group = panelInternal.parentGroup;
    group.activePanel = panelInternal;
    if (closeOthers)
      group.children.forEach(p => p.open = false);
    panelInternal.open = true;
  } else {
    throw new Error(`Panel ${panel.name} has not in any container, can not active it.`);
  } 
}
function activeGroup(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  if (panelInternal.parentGroup) {
    throw new Error(`Panel ${panel.name} is not a group, can not active it.`);
  } else if (panelInternal.parentGrid) {
    switch (panelInternal.parentGrid) {
      case 'primarySideBar': {
        panels.value.primary.forEach((p) => p.open = false); 
        activityBarActive.value = panelInternal;
        break;
      }
      case 'secondarySideBar': panels.value.secondary.forEach((p) => p.open = false); break;
      case 'bottomPanel': panels.value.bottom.forEach((p) => p.open = false); break;
    }
    panelInternal.open = true;
  } else {
    throw new Error(`Group ${panel.name} has not in any container, can not active it.`);
  } 
}
function addGroup(panel: CodeLayoutPanel, target: CodeLayoutGrid) {
  const panelInternal = panel as CodeLayoutPanelInternal;

  if (panelInternal.parentGrid && panelInternal.parentGrid !== 'none')
    throw new Error(`Group ${panel.name} already added to ${panelInternal.parentGrid} !`);

  const groupResult : CodeLayoutPanelInternal = { 
    ...panel,
    open: false,
    resizeable: false,
    size: panel.size ?? 0,
    children: [],
    parentGrid: target,
    parentGroup: null,
    activePanel: null,
  };

  getPanelArray(target).push(groupResult);
  return groupResult;
}
function removeGroup(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  if (!panelInternal.parentGrid || panelInternal.parentGrid === 'none')
    throw new Error(`Group ${panel.name} already removed from any grid !`);

  ArrayUtils.remove(getPanelArray(panelInternal.parentGrid), panel);
  panelInternal.parentGrid = 'none';
  panelInternal.parentGroup = null;

  //当删除的面板是侧边栏当前激活的面板，则重置并激活其他面板
  if (panelInternal === activityBarActive.value) {
    if (panels.value.primary.length > 0)
      activeGroup(panels.value.primary[0]);
    else 
      activityBarActive.value = undefined;
  }

  return panel;
}
function addPanel(panel: CodeLayoutPanel, parentGroup: CodeLayoutPanel, startOpen = false) {
  const parentGroupInternal = parentGroup as CodeLayoutPanelInternal;
  const panelInternal = panel as CodeLayoutPanelInternal;
  
  if (panelInternal.parentGroup)
    throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);

  const panelResult : CodeLayoutPanelInternal = {
    ...panel,
    open: false,
    resizeable: false,
    size: panel.size ?? 0,
    children: [],
    parentGrid: parentGroupInternal.parentGrid,
    parentGroup: parentGroupInternal,
    activePanel: null,
  };

  parentGroupInternal.children.push(panelResult);

  if (startOpen || panel.startOpen)
    openPanel(panelResult);

  return panelResult;
}
function removePanel(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;

  if (!panelInternal.parentGroup)
    throw new Error(`Panel ${panel.name} already removed from any group !`);

  ArrayUtils.remove(panelInternal.parentGroup.children, panelInternal);

  panelInternal.parentGrid = 'none';
  panelInternal.parentGroup = null;

  return panel;
}
function relayoutAll() {
  groupInstances.forEach(p => p.notifyRelayout());
}


defineExpose({
  getPanelArray,
  activeGroup,
  closePanel,
  togglePanel,
  openPanel,
  addGroup,
  removeGroup,
  addPanel,
  removePanel,
  relayoutAll,
});

onMounted(() => {
});
onBeforeUnmount(() => {
});

</script>