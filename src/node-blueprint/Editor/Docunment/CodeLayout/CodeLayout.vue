<template>
  <CodeLayoutBase 
    :config="layoutConfig"
    :activityBar="activityBar"
    :primarySideBar="primarySideBar"
    :secondarySideBar="secondarySideBar"
    :bottomPanel="bottomPanel"
    :statusBar="statusBar"
  >
    <template #activityBar>
      <div class="top">
        <CodeLayoutActionItem
          v-for="(panelGroup, key) in panels.primary"
          :key="key"
          :item="panelGroup"
          :active="panelGroup.open && primarySideBar"
          @active-item="onActivityBarAcitve(panelGroup)"
        />
      </div>
      <div class="bottom">
        <slot name="activityBarBottom" />
      </div>
    </template>
    <template #primarySideBar>
      <CodeLayoutGroupRender
        v-for="(panelGroup, key) in panels.primary"
        :key="key"
        :group="panelGroup"
        :horizontal="false"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupRender>
    </template>
    <template #secondarySideBar>
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
    <template #bottomPanel>
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
    <template #centerArea>

    </template>
    <template #statusBar>
      <slot name="statusBar" />
    </template>
  </CodeLayoutBase>
</template>

<script setup lang="ts">
import { ref , type PropType, computed, onMounted } from 'vue';
import type { CodeLayoutConfig, CodeLayoutGrid, CodeLayoutPanel, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutBase from './CodeLayoutBase.vue';
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
});

function onActivityBarAcitve(panelGroup: CodeLayoutPanelInternal) {
  if (panelGroup.open && props.layoutConfig.primarySideBarSwitchWithActivityBar) {
    emit('update:primarySideBar', !props.primarySideBar);
  } else {
    panels.value.primary.forEach((p) => p.open = false);
    panelGroup.open = true;
  }
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
    panelInternal.parentGroup.activePanel = panelInternal;
    if (closeOthers)
      panelInternal.children.forEach(p => p.open = false);
    group.open = true;
  } else {
    throw new Error(`Panel ${panel.name} has not in any container, can not active it.`);
  } 
}
function activeGroup(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  if (panelInternal.parentGroup) {
    throw new Error(`Panel ${panel.name} is not a group, can not active it.`);
  } else if (panelInternal.parentGrid) {
    panelInternal.open = true;
    switch (panelInternal.parentGrid) {
      case 'primarySideBar': panels.value.primary.forEach((p) => p.open = false); break;
      case 'secondarySideBar': panels.value.secondary.forEach((p) => p.open = false); break;
      case 'bottomPanel': panels.value.bottom.forEach((p) => p.open = false); break;
    }
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
  return panel;
}
function addPanel(panel: CodeLayoutPanel, parentGroup: CodeLayoutPanel, active = false) {
  const parentGroupInternal = parentGroup as CodeLayoutPanelInternal;
  const panelInternal = panel as CodeLayoutPanelInternal;
  
  if (panelInternal.parentGroup)
    throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);

  const panelResult : CodeLayoutPanelInternal = {
    ...panel,
    open: false,
    children: [],
    parentGrid: parentGroupInternal.parentGrid,
    parentGroup: parentGroupInternal,
    activePanel: null,
  };

  parentGroupInternal.children.push(panelInternal);

  if (active)
    openPanel(panel);

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
});

onMounted(() => {
});

</script>