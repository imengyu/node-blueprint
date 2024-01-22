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
          v-for="(panelGroup, key) in panels.primary.children"
          :key="key"
          :item="(panelGroup as CodeLayoutPanelInternal)"
          :active="panelGroup === activityBarActive && primarySideBar"
          @active-item="onActivityBarAcitve(panelGroup as CodeLayoutPanelInternal)"
        />
      </div>
      <div class="bottom">
        <slot name="activityBarBottom" />
      </div>
    </template>
    <template #primarySideBar>
      <template v-if="panels.primary.children.length > 0">
        <CodeLayoutGroupRender
          v-for="(panelGroup, key) in panels.primary.children"
          :key="key"
          :group="(panelGroup as CodeLayoutPanelInternal)"
          :horizontal="false"
          :primary="true"
        >
          <template #panelRender="data">
            <slot name="panelRender" v-bind="data" />
          </template>
          <template #emptyTabRender>
            <CodeLayoutEmpty :panel="(panelGroup as CodeLayoutPanelInternal)" grid="primarySideBar">
              <slot name="emptyGroup" :panel="panelGroup" drid="primarySideBar">{{ emptyText }}</slot>
            </CodeLayoutEmpty>
          </template>
        </CodeLayoutGroupRender>
      </template>
      <CodeLayoutEmpty v-else grid="primarySideBar">
        <slot name="emptyGroup" group="primarySideBar">{{ emptyText }}</slot>
      </CodeLayoutEmpty>
    </template>
    <template #secondarySideBar>
      <template v-if="panels.secondary.children.length > 0">
        <CodeLayoutGroupRender
          v-for="(panelGroup, key) in panels.secondary.children"
          :key="key"
          :group="(panelGroup as CodeLayoutPanelInternal)"
          :horizontal="false"
        >
          <template #panelRender="data">
            <slot name="panelRender" v-bind="data" />
          </template>
          <template #emptyTabRender>
            <CodeLayoutEmpty :panel="(panelGroup as CodeLayoutPanelInternal)" grid="secondarySideBar">
              <slot name="emptyGroup" :panel="panelGroup" grid="secondarySideBar">{{ emptyText }}</slot>
            </CodeLayoutEmpty>
          </template>
        </CodeLayoutGroupRender>
      </template>
      <CodeLayoutEmpty v-else grid="secondarySideBar">
        <slot name="emptyGroup" group="secondarySideBar">{{ emptyText }}</slot>
      </CodeLayoutEmpty>
    </template>
    <template #bottomPanel>
      <template v-if="panels.bottom.children.length > 0">
        <CodeLayoutGroupRender
          v-for="(panelGroup, key) in panels.bottom.children"
          :key="key"
          :group="(panelGroup as CodeLayoutPanelInternal)"
          :horizontal="true"
        >
          <template #panelRender="data">
            <slot name="panelRender" v-bind="data" />
          </template>
          <template #emptyTabRender>
            <CodeLayoutEmpty grid="bottomPanel">
              <slot name="emptyGroup" :panel="panelGroup" grid="bottomPanel">{{ emptyText }}</slot>
            </CodeLayoutEmpty>
          </template>
        </CodeLayoutGroupRender>
      </template>
      <CodeLayoutEmpty v-else grid="bottomPanel">
        <slot name="emptyGroup" grid="bottomPanel">{{ emptyText }}</slot>
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
import { ref , type PropType, onMounted, provide, onBeforeUnmount, reactive } from 'vue';
import { CodeLayoutPanelInternal, type CodeLayoutConfig, type CodeLayoutContext, type CodeLayoutGrid, type CodeLayoutInstance, type CodeLayoutPanel, CodeLayoutGridInternal, type CodeLayoutDragDropReferencePosition } from './CodeLayout';
import CodeLayoutBase, { type CodeLayoutBaseInstance } from './CodeLayoutBase.vue';
import CodeLayoutActionItem from './CodeLayoutActionItem.vue';
import CodeLayoutGroupRender from './CodeLayoutGroupRender.vue';
import CodeLayoutEmpty from './CodeLayoutEmpty.vue';

const panels = ref<{
  primary: CodeLayoutGridInternal,
  secondary: CodeLayoutGridInternal,
  bottom: CodeLayoutGridInternal,
  center: CodeLayoutGridInternal,
}>({
  primary: new CodeLayoutGridInternal((open) => {
    emit('update:primarySideBar', open);
  }),
  secondary: new CodeLayoutGridInternal((open) => {
    emit('update:secondarySideBar', open);
  }),
  bottom: new CodeLayoutGridInternal((open) => {
    emit('update:bottomPanel', open);
  }),
  center: new CodeLayoutGridInternal(() => {}),
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
  dragDropToGrid(grid, panel) {
    /*
    拖放至基础网格根节点
    0. 如果目标网格已存在当前面板，则无需再处理
    1. 从旧的父级移除面板，刷新旧父级
    2. 向目标网格添加面板
    */

    const gridInstance = getRootGrid(grid);
    if (gridInstance.hasChild(panel))
      return;

    const parent = panel.parentGroup;
    if (parent)
      removePanelInternal(panel);

    panel.parentGrid = grid;

    if (!props.layoutConfig.onGridFirstDrop) {
      gridInstance.addChild(panel);
      return;
    }

    const presolve = props.layoutConfig.onGridFirstDrop(grid, panel);
    if (presolve)
      gridInstance.addChild(presolve ?? panel);
  },
  dragDropToPanelNear(reference, referencePosition, panel, dropToTabHeader) {
    if (reference === panel)
      throw new Error("Reference panel can not be same with dropping panel!");



    //拖放至面板参考位置
    /**
     * 0. 从源父级删除
     * 1. 参考面板是顶级面板，或者参考面板的上一级是不可合并的面板(自己相当于顶级)
     *    1.1 分割自己
     *    1.2 把自己和拖放面板合并为新的组，并且替代自己
     * 2. 不是顶级面板
     *    2.1 插入至指定位置并且重新布局
     * 
     */
    const parentGroup = reference.parentGroup;
    const noParentGroup = !parentGroup;
      
    //拖拽到一个不可合并的面板(TAB)，则直接加入这个面板的子集
    if (noParentGroup && reference.noAutoShink) {

      removePanelInternal(panel);
      reference.addChild(panel);
      reference.activePanel = panel;
      panel.size = 0;

      //新插入一个面板，现在要重新调整其中的大小
      reference.notifyRelayout();
      return;
    }

    //当前是顶级面板，并且未指定方向，等同于直接插入面板到顶级
    if (noParentGroup) {
      this.dragDropToGrid(reference.parentGrid, panel);
      return;
    }

    //当前是顶级面板，或者父级是不可合并的面板(相当于顶级)。
    //有方向，这意味着需要分割当前面板并且插入
    //拖拽到TAB上时不分割
    if (parentGroup.noAutoShink && !dropToTabHeader) {

      //从源数组删掉
      removePanelInternal(panel);

      const newGroup = new CodeLayoutPanelInternal();
      Object.assign(newGroup, {
        ...reference,
        name: reference.name + '.clone' + Math.floor(Math.random() * 10),
        children: []
      });
      newGroup.addChild(reference);

      switch (referencePosition) {
        case 'drag-over-prev':
          newGroup.addChild(panel, 0);
          break;
        case 'drag-over-next':
          newGroup.addChild(panel);
          break;
      }
      if (parentGroup?.getIsTabContainer()) {
        //替换至当前级
        parentGroup.replaceChild(reference, newGroup);
        parentGroup.activePanel =  newGroup;
      }
      else
        //替换至顶级
        getRootGrid(reference.parentGrid).replaceChild(reference, newGroup);

      //新插入一个面板，现在要重新调整其中的大小
      newGroup.notifyRelayout();
    }
    //非顶级面板, 直接插入即可
    else {

      //仅面板不在当前子级时才从旧面板删除，否则是暂时移开不触发布局
      if (!parentGroup.children.includes(panel)) {
        removePanelInternal(panel);
      } else {
        parentGroup.removeChild(panel);
      }

      //插入至指定位置并且重新布局
      const insetIndex = parentGroup.children.indexOf(reference);
      switch (referencePosition) {
        case 'drag-over-prev':
          parentGroup.addChild(panel, insetIndex);
          break;
        case 'drag-over-next':
          parentGroup.addChild(panel, insetIndex + 1);
          break;
      }

      if (dropToTabHeader) {
        //拖拽到TAB上，强制将当前面板大小归零
        panel.size = 0;
      } else {
        //新插入一个面板，现在要重新调整其中的大小
        parentGroup.relayoutAllWithNewPanel(panel);
      }
      parentGroup.activePanel = panel;
    }
      
  },
  instance: codeLayoutInstance,
};

/**
 * 拖放处理主函数: 拖放至基础网格根节点
 * @param grid 目标网格
 * @param panel 拖拽面板
 * 
  0. 如果目标网格已存在当前面板，则无需再处理
  1. 从旧的父级移除面板，刷新旧父级
  2. 向目标网格添加面板
 */
function dragDropToGrid(grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) {

  const gridInstance = getRootGrid(grid);
  if (gridInstance.hasChild(panel))
    return;

  const parent = panel.parentGroup;
  if (parent)
    removePanelInternal(panel);

  panel.parentGrid = grid;

  if (!props.layoutConfig.onGridFirstDrop) {
    gridInstance.addChild(panel);
    return;
  }

  const presolve = props.layoutConfig.onGridFirstDrop(grid, panel);
  if (presolve)
    gridInstance.addChild(presolve ?? panel);
}

/**
 * 拖放处理主函数: 拖拽至面板上
 * @param reference 参考面板
 * @param referencePosition 拖放面板相对于参考面板的位置
 * @param panel 拖放面板
 * @param dropToTabHeader 是否是拖放至TAB头上
 * 
 * 0. 原父级和目标父级一致 》不移除/调整顺序 》直接返回
 * 1. 原父级目标父级不一致 》移除
 * 2. 放置面板 》
 *    2.1 侧边栏(顶级) 》在侧边栏中添加子页
 *    2.2 TAB头 》在TAB中添加子页
 *    2.3 组内
 *      2.3.1 》单一 》分隔当前组：
 *          新加一个空容器（拷贝自原组）
 *          当前组和新页作为此组的子级，
 *          新组替换当前组
 *      2.3.2 》多个 》在组中添加子页
 *    2.4 空板 》成为空板的子级
 */
function dragDropToPanelNear(reference: CodeLayoutPanelInternal, referencePosition: CodeLayoutDragDropReferencePosition, panel: CodeLayoutPanelInternal, dropToTabHeader: boolean) {

  const oldParent = panel.parentGroup;

  //0. 原父级和目标父级一致 》不移除/调整顺序 》直接返回
  if (oldParent && oldParent === reference.parentGroup) {
    oldParent.removeChild(panel);
    oldParent.addChild(panel, reference.getIndexInParent() + (referencePosition === 'drag-over-next' ? 1 : 0))
    return;
  }

  //1. 原父级目标父级不一致 》移除
  if (oldParent)
    removePanelInternal(panel);

  //2. 放置面板
  
}

/**
 * 移除面板处理函数
 * @param panel 
 * 
 * 移除类型 》
    0. 顶级：直接移除
    1. 侧边栏/标题栏：从侧边栏子级移除
    2. TAB头：从TAB子级移除，触发TAB组【移除重构】
    3. 组：从组中移除，触发普通组【移除重构】
      移除重构 》
        普通组 》
          当前面板是顶级 》
            并且子级数量0个 》
              如果设置不收缩，则保持，通知客户；
              如果设置收缩，则自动收缩顶级；
            并且子级数量等于1个 》
              删除自己，子级替代自己
          当前面板非顶级 》
            普通组子级如果只剩一个，则子级替换自己的位置
        TAB组 》
          如果设置不收缩，则保持TAB，通知客户；
          如果设置收缩且TAB子级数量为0，且处于顶级，则自动收缩顶级；
        其他情况不处理
 */
function removePanelInternal(panel: CodeLayoutPanelInternal) {
    
  if (panel.parentGrid === 'none')
    throw new Error(`Panel ${panel.name} already removed from any group !`);

  const parent = panel.parentGroup;
  if (parent) {
    const isInTab = panel.getIsInTab();
    parent.removeChild(panel);
    //删除面板后将会进行布局
    relayoutAfterRemovePanel(parent, isInTab, panel);
  } else {
    //没有父级，直接从顶级移除
    const parentGrid = getRootGrid(panel.parentGrid);
    parentGrid.removeChild(panel);
  }

  panel.size = 0;
  panel.parentGrid = 'none';
}
//移除重构: 移除面板后进行布局
function relayoutAfterRemovePanel(group: CodeLayoutPanelInternal, isInTab: boolean, panel: CodeLayoutPanelInternal) {
    
  //TAB组
  if (isInTab) {
    if (group.noAutoShink) {
      //如果设置不收缩，则保持TAB，通知客户
      props.layoutConfig.onNoAutoShinkTabGroup?.(group);
    } else if (group.children.length === 0 && group.getIsTopGroup()) {
      //如果TAB子级数量为0，且处于顶级，则自动收缩顶级
      getRootGrid(group.parentGrid).collapse();
    }
    return;
  }

  //普通组
  if (group.getIsTopGroup()) {
    if (group.children.length === 0) {
      if (group.noAutoShink) {
        //如果设置不收缩，则保持，通知客户
        props.layoutConfig.onNoAutoShinkNormalGroup?.(group);
      } else {
        //如果子级数量为0，则自动收缩顶级
        getRootGrid(group.parentGrid).collapse();
      }
      return;
    }
    else if (group.children.length === 1) {
      //当前面板子级数量1个，删除自己，子级替代自己
      const gridInstance = getRootGrid(group.parentGrid);
      const firstChildren = group.children[0];
      firstChildren.open = true;
      gridInstance.replaceChild(group, firstChildren);
      return;
    }
  }
  else if (group.children.length === 1) {
    //当前面板子级数量少于1个，删除自己，子级替代自己
    const firstChildren = group.children[0];
    firstChildren.open = true;
    group.parentGroup!.replaceChild(group, firstChildren);
    return;
  }

  //普通组移除状态下，无需其他操作，通知面板进行布局
  panelInstances.get(group.name)?.relayoutAllWithRemovePanel(panel);
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
    panels.value.primary.children.forEach((p) => p.open = false);
    panelGroup.open = true;
    activityBarActive.value = panelGroup;
  }
}
function onPrimarySideBarSwitch(on: boolean) {
  //当侧边栏关闭时，取消激活全部的面板
  if (!on) 
    panels.value.primary.children.forEach((p) => p.open = false);
  //当侧边栏重新打开时，需要重新显示激活面板
  if (on &&  activityBarActive.value && !panels.value.primary.children.find((p) => p.open))
    activityBarActive.value.open = true;
  emit('update:primarySideBar', on);
}


//公开控制接口

function getRootGrid(target: CodeLayoutGrid) {
  switch (target) {
    case 'primarySideBar': return panels.value.primary;
    case 'secondarySideBar': return panels.value.secondary;
    case 'bottomPanel': return panels.value.bottom;
    case 'centerArea': return panels.value.center;
  }
  throw new Error(`Unknown grid ${target}`);
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
        panels.value.primary.children.forEach((p) => p.open = false); 
        activityBarActive.value = panelInternal;
        break;
      }
      case 'secondarySideBar': panels.value.secondary.children.forEach((p) => p.open = false); break;
      case 'bottomPanel': panels.value.bottom.children.forEach((p) => p.open = false); break;
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

  const groupResult = reactive(new CodeLayoutPanelInternal());
  Object.assign(groupResult, panel);
  groupResult.open = panel.startOpen ?? false;
  groupResult.size = panel.size ?? 0;
  groupResult.parentGrid = target;

  panelInstances.set(panelInternal.name, groupResult as CodeLayoutPanelInternal);
  getRootGrid(target).addChild(groupResult as CodeLayoutPanelInternal);

  return groupResult;
}
function removeGroup(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  const grid = panelInternal.parentGrid;
  if (!grid || grid === 'none')
    throw new Error(`Group ${panel.name} already removed from any grid !`);

  const gridInstance = getRootGrid(grid);

  gridInstance.removeChild(panelInternal);
  panelInternal.parentGrid = 'none';

  //当删除的面板是侧边栏当前激活的面板，则重置并激活其他面板
  if (panelInternal === activityBarActive.value) {
    if (panels.value.primary.children.length > 0)
      activeGroup(panels.value.primary.children[0]);
    else 
      activityBarActive.value = undefined;
  }

  //当目标网格已经没有面板了，发出通知
  if (gridInstance.children.length === 0) 
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

  const panelResult = reactive(new CodeLayoutPanelInternal());
  Object.assign(panelResult, panel);
  panelResult.open = panel.startOpen ?? false;
  panelResult.size = panel.size ?? 0;
  parentGroupInternal.addChild(panelResult as CodeLayoutPanelInternal);

  if (startOpen || panel.startOpen)
    openPanel(panelResult);

  panelInstances.set(panelInternal.name, panelResult as CodeLayoutPanelInternal);

  return panelResult;
}
function removePanel(panel: CodeLayoutPanel) {
  const panelInternal = panel as CodeLayoutPanelInternal;
  removePanelInternal(panelInternal);
  panelInstances.delete(panelInternal.name);
  return panel;
}
function relayoutAll() {
  panelInstances.forEach(p => p.notifyRelayout());
}
function relayoutGroup(name: string) {
  panelInstances.get(name)?.notifyRelayout();
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
  --code-layout-color-scrollbar-thumb: rgba(204, 204, 204, 0.4);
  --code-layout-color-scrollbar-thumb-light: rgba(204, 204, 204, 0.6);
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