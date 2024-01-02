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
      <CodeLayoutEmpty v-else grid="primarySideBar">
        <slot name="emptyGroup" group="primarySideBar">{{ emptyText }}</slot>
      </CodeLayoutEmpty>
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
      <CodeLayoutEmpty v-else grid="secondarySideBar">
        <slot name="emptyGroup" group="secondarySideBar">{{ emptyText }}</slot>
      </CodeLayoutEmpty>
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
      <CodeLayoutEmpty v-else grid="bottomPanel">
        <slot name="emptyGroup" group="bottomPanel">{{ emptyText }}</slot>
      </CodeLayoutEmpty>
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
import type { CodeLayoutConfig, CodeLayoutContext, CodeLayoutGrid, CodeLayoutGroupInstance, CodeLayoutInstance, CodeLayoutPanel, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutBase, { type CodeLayoutBaseInstance } from './CodeLayoutBase.vue';
import CodeLayoutActionItem from './CodeLayoutActionItem.vue';
import CodeLayoutGroupRender from './CodeLayoutGroupRender.vue';
import CodeLayoutEmpty from './CodeLayoutEmpty.vue';
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

const groupInstances = new Map<string, CodeLayoutGroupInstance>();
const panelInstances = new Map<string, CodeLayoutPanelInternal>();

const codeLayoutInstance : CodeLayoutInstance = {
  activeGroup,
  closePanel,
  togglePanel,
  openPanel,
  addGroup,
  removeGroup,
  addPanel,
  removePanel,
  relayoutAll,
  relayoutGroup,
  getPanelByName,
};
const codeLayoutContext : CodeLayoutContext = {
  addGroup(instance) {
    groupInstances.set(instance.name, instance);
  },
  removeGroup(instance) {
    groupInstances.delete(instance.name);
  },
  dragDropToGrid(grid, panel) {
    /*
    拖放至基础网格根节点
    0. 如果目标网格已存在当前面板，则无需再处理
    1. 从旧的父级移除面板，刷新旧父级
    2. 向目标网格添加面板
    */

    const arr = getPanelArray(grid);
    if (arr.includes(panel))
      return;

    const parent = panel.parentGroup;
    if (parent) {
      ArrayUtils.remove(parent.children, panel);
      panel.parentGroup = null;
      relayoutGroup(parent.name);
    }

    arr.push(panel);
    panel.parentGrid = grid;
  },
  dragDropToGroup(group, panel) {
    this.dragDropToPanelNear(group, 'drag-over-next', panel);
  },
  dragDropToPanelNear(reference, referencePosition, panel) {
    if (reference === panel)
      throw new Error("Reference panel can not be same with dropping panel!");

    //拖放至面板参考位置
    const parentGroup = reference.parentGroup;
      
    //当前是顶级面板，并且未指定方向，等同于直接插入面板到顶级
    if (!parentGroup && referencePosition === '') {
      this.dragDropToGrid(reference.parentGrid, panel);
      return;
    }

    //当前是顶级面板，或者父级是不可合并的面板(自己相当于顶级)。
    //有方向，这意味着需要分割当前面板并且插入
    if (!parentGroup || parentGroup.noAutoShink) {

      groupInstances.delete(reference.name);

      const newGroup : CodeLayoutPanelInternal = {
        ...panel,
        children: [ reference ],
        parentGroup: null,
      };

      switch (referencePosition) {
        case 'drag-over-prev':
          newGroup.children.unshift(panel);
          break;
        case 'drag-over-next':
          newGroup.children.push(panel);
          break;
      }

      const array = getPanelArray(reference.parentGrid);
      array.splice(array.indexOf(reference), 1, newGroup);

    }
    //非顶级面板, 直接插入即可
    else {

      //仅面板不在当前子级时才从旧面板删除，否则是暂时移开不触发布局
      if (!parentGroup.children.includes(panel)) {
        removePanelInternal(panel);
      } else {
        ArrayUtils.remove(parentGroup.children, panel);
      }

      //插入至指定位置并且重新布局
      const insetIndex = parentGroup.children.indexOf(reference);
      switch (referencePosition) {
        case 'drag-over-prev':
          ArrayUtils.insert(parentGroup.children, insetIndex, panel);
          break;
        case 'drag-over-next':
          ArrayUtils.insert(parentGroup.children, insetIndex + 1, panel);
          break;
      }

      panel.parentGroup = parentGroup;
      panel.parentGrid = parentGroup.parentGrid;
      relayoutGroup(parentGroup.name);
    }
      
  },
  instance: codeLayoutInstance,
};

//移除面板后进行布局
function relayoutAfterRemovePanel(group: CodeLayoutPanelInternal) {
  if (!group.parentGroup && group.children.length <= 1) {
    if (!group.noAutoShink) {
      //当前面板是顶级并且数量少于1个，删除自己，子级替代自己
      const array = getPanelArray(group.parentGrid);
      array.splice(array.indexOf(group), 1, group.children[0]);
    } else {
      //否则发出通知，由用户自己处理
      props.layoutConfig.onNoAutoShinkGroupEmpty?.(group);
    }
  } else {
    //当前面板不是顶级，或者数量多余1，只需要直接布局
    relayoutGroup(group.name);
  }
}
//移除面板
function removePanelInternal(panel: CodeLayoutPanelInternal) {

  if (!panel.parentGroup)
    throw new Error(`Panel ${panel.name} already removed from any group !`);

  ArrayUtils.remove(panel.parentGroup.children, panel);

  //删除面板后将会进行布局
  relayoutAfterRemovePanel(panel.parentGroup);

  panel.parentGrid = 'none';
  panel.parentGroup = null;
}

//处理函数

provide('layoutConfig', props.layoutConfig);
provide('codeLayoutContext', codeLayoutContext);

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


//公开控制接口

function getPanelArray(target: CodeLayoutGrid) {
  switch (target) {
    case 'primarySideBar': return panels.value.primary;
    case 'secondarySideBar': return panels.value.secondary;
    case 'bottomPanel': return panels.value.bottom;
    case 'centerArea': return panels.value.center;
  }
  throw new Error(`Grid can not insert panel`);
}
function getPanelByName(name: string) {
  return panelInstances.get(name);
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
  if (panelInstances.has(panelInternal.name))
    throw new Error(`A panel named ${panel.name} already exists`);

  const groupResult : CodeLayoutPanelInternal = { 
    ...panel,
    open: panel.startOpen ?? false,
    resizeable: false,
    size: panel.size ?? 0,
    children: [],
    parentGrid: target,
    parentGroup: null,
    activePanel: null,
  };

  panelInstances.set(panelInternal.name, panelInternal);
  getPanelArray(target).push(groupResult);

  return groupResult;
}
function removeGroup(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  const grid = panelInternal.parentGrid;
  if (!grid || grid === 'none')
    throw new Error(`Group ${panel.name} already removed from any grid !`);

  const array = getPanelArray(grid);

  ArrayUtils.remove(array, panel);
  panelInternal.parentGrid = 'none';
  panelInternal.parentGroup = null;

  //当删除的面板是侧边栏当前激活的面板，则重置并激活其他面板
  if (panelInternal === activityBarActive.value) {
    if (panels.value.primary.length > 0)
      activeGroup(panels.value.primary[0]);
    else 
      activityBarActive.value = undefined;
  }

  //当目标网格已经没有面板了，发出通知
  if (array.length === 0) 
    props.layoutConfig.onGridEmpty?.(grid);

  panelInstances.delete(panelInternal.name);

  return panel;
}
function addPanel(panel: CodeLayoutPanel, parentGroup: CodeLayoutPanel, startOpen = false) {
  const parentGroupInternal = parentGroup as CodeLayoutPanelInternal;
  const panelInternal = panel as CodeLayoutPanelInternal;
  
  if (panelInternal.parentGroup)
    throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);
  if (panelInstances.has(panelInternal.name))
    throw new Error(`A panel named ${panel.name} already exists`);

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

  panelInstances.set(panelInternal.name, panelInternal);

  return panelResult;
}
function removePanel(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  removePanelInternal(panelInternal);
  panelInstances.delete(panelInternal.name);
  return panel;
}
function relayoutAll() {
  groupInstances.forEach(p => p.notifyRelayout());
}
function relayoutGroup(name: string) {
  groupInstances.get(name)?.notifyRelayout();
}

defineExpose(codeLayoutInstance);

onMounted(() => {
});
onBeforeUnmount(() => {
});

</script>

<style lang="scss">
:root {
  --code-layout-color-background: #1e1e1e;
  --code-layout-color-background-second: #252526;
  --code-layout-color-background-light: #333333;
  --code-layout-color-background-hover: #363737;
  --code-layout-color-background-mask-light: rgba(255,255,255,0.2);
  --code-layout-color-highlight: #0078d4;
  --code-layout-color-text: #ccc;
  --code-layout-color-text-highlight: #fff;
  --code-layout-color-text-gray: #818181;
  --code-layout-color-border: #474747;
  --code-layout-color-border-light: #cccccc;
  --code-layout-color-border-background: #2a2a2a;
  --code-layout-color-border-white: #fff;
  --code-layout-border-size: 1px;
  --code-layout-border-size-larger: 2px;
  --code-layout-border-size-dragger: 4px;
  --code-layout-border-radius-small: 5px;
  --code-layout-border-radius-large: 5px;
  --code-layout-header-height: 22px;
}

.code-layout-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  color: var(--code-layout-color-text);
  background-color: var(--code-layout-color-background);

  > .code-layout-activity {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex: 1;

    .code-layout-activity-bar {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background-color: var(--code-layout-color-background-light);
      width: 45px;

      .item {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 45px;
        height: 45px;
        color: var(--code-layout-color-text-gray);
        cursor: pointer;

        svg {
          fill: var(--code-layout-color-text-gray);
        }

        &.active, &:hover {
          color: var(--code-layout-color-text-highlight);

          svg {
            fill: var(--code-layout-color-text-highlight);
          }
        }

        &.active {

          &::after {
            content: '';
            position: absolute;
            display: block;
            width: 2px;
            top: 0;
            bottom: 0;
            left: 0;
            background-color: var(--code-layout-color-text-highlight);
          }
        }

        &.drag-over-prev, &.drag-over-next {
          &::before {
            position: absolute;
            content: '';
            left: 0;
            right: 0;
            height: var(--code-layout-border-size-larger);
            background-color: var(--code-layout-color-border-light);
          }
        }
        &.drag-over-prev {
          &::before {
            top: calc(var(--code-layout-border-size-larger) / 2 * -1);
          }
        }
        &.drag-over-next {
          &::before {
            bottom: calc(var(--code-layout-border-size-larger) / 2 * -1);
          }
        }
      }
    }
  }
  > .code-layout-status {
    flex-grow: 0;
    background-color: var(--code-layout-color-highlight);
  }
}
</style>