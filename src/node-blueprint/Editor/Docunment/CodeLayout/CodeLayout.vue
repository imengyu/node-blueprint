<template>
  <CodeLayoutBase 
    ref="codeLayoutBase"
    :config="layoutConfig"
    :activityBar="activityBar"
    :primarySideBar="primarySideBar"
    :secondarySideBar="secondarySideBar"
    :bottomPanel="bottomPanel"
    :statusBar="statusBar"
    :menuBar="menuBar"
    @update:bottom-panel="(v) => $emit('update:bottomPanel', v)"
    @update:primary-side-bar="onPrimarySideBarSwitch"
    @update:secondary-side-bar="(v) => $emit('update:secondarySideBar', v)"
  >
    <template #titleBarIcon>
      <slot name="titleBarIcon" />
    </template>
    <template #titleBarMenu>
      <slot name="titleBarMenu">
        <MenuBar :options="mainMenuConfigWithCollapseState" />
      </slot>
    </template>
    <template #titleBarCenter>
      <slot name="titleBarCenter" />
    </template>
    <template #titleBarRight>
      <CodeLayoutCustomizeLayout 
        v-if="layoutConfig.titleBarShowCustomizeLayout"
        :activityBar="activityBar"
        :primarySideBar="primarySideBar"
        :secondarySideBar="secondarySideBar"
        :bottomPanel="bottomPanel"
        :statusBar="statusBar"
        :menuBar="menuBar"
        @update:menuBar="(a) => emit('update:menuBar', a)"
        @update:activityBar="(a) => emit('update:activityBar', a)"
        @update:primarySideBar="(a) => emit('update:primarySideBar', a)"
        @update:secondarySideBar="(a) => emit('update:secondarySideBar', a)"
        @update:bottomPanel="(a) => emit('update:bottomPanel', a)"
        @update:statusBar="(a) => emit('update:statusBar', a)"
      />
      <slot name="titleBarRight" />
    </template>
    <template #activityBar>
      <div class="top">
        <!--no menu bar here show collapsed menu button-->
        <slot v-if="!menuBar" name="activityBarTopBar">
          <MenuBar :options="mainMenuConfigWithCollapseState" />
        </slot>
        <!--main activityBar items-->
        <CodeLayoutActionItem
          v-for="(panelGroup, key) in panels.primary.children"
          v-show="panelGroup.visible"
          :key="key"
          :item="(panelGroup as CodeLayoutPanelInternal)"
          :active="panelGroup === panels.primary.activePanel && primarySideBar"
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
          v-show="panelGroup.visible"
          :key="key"
          :group="(panelGroup as CodeLayoutPanelInternal)"
          :show="panelGroup === panels.primary.activePanel && primarySideBar"
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
          v-show="panelGroup.visible"
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
          v-show="panelGroup.visible"
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
      <slot name="centerArea" />
    </template>
    <template #statusBar>
      <slot name="statusBar" />
    </template>
  </CodeLayoutBase>
</template>

<script setup lang="ts">
import { ref , type PropType, onMounted, provide, onBeforeUnmount, reactive, toRefs, computed } from 'vue';
import { CodeLayoutPanelInternal, type CodeLayoutConfig, type CodeLayoutContext, type CodeLayoutGrid, type CodeLayoutInstance, type CodeLayoutPanel, CodeLayoutGridInternal, type CodeLayoutDragDropReferencePosition, type CodeLayoutLangConfig, defaultCodeLayoutConfig } from './CodeLayout';
import CodeLayoutBase, { type CodeLayoutBaseInstance } from './CodeLayoutBase.vue';
import CodeLayoutActionItem from './CodeLayoutActionItem.vue';
import CodeLayoutGroupRender from './CodeLayoutGroupRender.vue';
import CodeLayoutEmpty from './CodeLayoutEmpty.vue';
import CodeLayoutCustomizeLayout from './Components/CodeLayoutCustomizeLayout.vue';
import { MenuBar, type MenuOptions } from '@imengyu/vue3-context-menu';
import type { MenuBarOptions } from '@imengyu/vue3-context-menu/lib/MenuBar';

const panels = ref<{
  primary: CodeLayoutGridInternal,
  secondary: CodeLayoutGridInternal,
  bottom: CodeLayoutGridInternal,
  center: CodeLayoutGridInternal,
}>({
  primary: new CodeLayoutGridInternal('primarySideBar', (open) => {
    emit('update:primarySideBar', open);
  }),
  secondary: new CodeLayoutGridInternal('secondarySideBar', (open) => {
    emit('update:secondarySideBar', open);
  }),
  bottom: new CodeLayoutGridInternal('bottomPanel', (open) => {
    emit('update:bottomPanel', open);
  }),
  center: new CodeLayoutGridInternal('centerArea', () => {}),
});

const codeLayoutBase = ref<CodeLayoutBaseInstance>();

const emit = defineEmits([
  'update:menuBar',
  'update:activityBar',
  'update:primarySideBar',
  'update:secondarySideBar',
  'update:bottomPanel',
  'update:statusBar',
]) ;

const props = defineProps({
  layoutConfig: {
    type: Object as PropType<CodeLayoutConfig>,
    default: () => defaultCodeLayoutConfig
  },
  langConfig: {
    type: Object as PropType<CodeLayoutLangConfig>,
    default: () => ({
      lang: 'en',
    }),
  },
  mainMenuConfig: {
    type: Object as PropType<MenuOptions>,
    default: null,
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
  menuBar: {
    type: Boolean,
    default: true,
  },
  emptyText: {
    type: String,
    default: "Drag a view here to display",
  },
});
const { layoutConfig } = toRefs(props);
const panelInstances = new Map<string, CodeLayoutPanelInternal>();

const mainMenuConfigWithCollapseState = computed<MenuBarOptions>(() => {
  return {
    theme: 'code-layout',
    mini: !props.menuBar,
    barPopDirection: props.menuBar ? 'bl' : 'tr',
    ...props.mainMenuConfig,
  }
})

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
  dragDropToGrid,
  dragDropToPanelNear,
  relayoutAfterToggleVisible(panel) {
    const parent = panel.getParent();
    if (!parent)
      return;
    if (panel.visible) {
      if (parent instanceof CodeLayoutPanelInternal)
        parent.relayoutAllWithNewPanel([ panel ]);
      parent.activePanel = panel;
    } else {
      if (parent instanceof CodeLayoutPanelInternal)
        parent.relayoutAllWithRemovePanel(panel);
      parent.reselectActiveChild();
    }
  },
  relayoutTopGridProp(grid, visible) {
    switch (grid) {
      case 'primarySideBar':  emit('update:primarySideBar', visible); break;
      case 'secondarySideBar':  emit('update:secondarySideBar', visible); break;
      case 'bottomPanel':  emit('update:bottomPanel', visible); break;
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

  const userCancel = layoutConfig.value.onDropToGrid?.(panel, grid) ?? false;
  if (userCancel)
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
 * 0. 原父级和目标父级一致 且 两个的父级容器都不是tab 
 *    》不移除/调整顺序 
 *    》直接返回
 * 1. 原父级目标父级不一致 》移除
 * 2. 放置面板 》
 *    2.1 TAB头 》在TAB中添加子页
 *      2.1.1 TAB页自己 》在TAB中添加子页
 *    2.2 侧边栏(顶级) 》在侧边栏中添加子页
 *    2.3 组内
 *      2.3.1 》单一 》分隔当前组：
 *          新加一个空容器（拷贝自原组）
 *          当前组和新页作为此组的子级，
 *          新组替换当前组
 *      2.3.2 》多个 》在组中添加子页
 *    2.4 空板 》成为空板的子级 (dragDropToGrid)
 */
function dragDropToPanelNear(
  reference: CodeLayoutPanelInternal,
  referencePosition: CodeLayoutDragDropReferencePosition, 
  panel: CodeLayoutPanelInternal, 
  dropTo: 'normal'|'empty'|'tab-header'|'activiy-bar'
) {
  const userCancel = layoutConfig.value.onDropToPanel?.(reference, referencePosition, panel, dropTo) ?? false;
  if (userCancel)
    return;

  const dropToTabHeader = dropTo === 'tab-header';
  const dropToActiviyBar = dropTo === 'activiy-bar';
  const dropToEmpty = dropTo === 'empty';
  const oldParent = panel.parentGroup;

  if (reference === panel)
    throw new Error('Can not drop to self, panel : ' + panel.name);

  console.log('dragDropToPanelNear');

  //0.1 原父级和目标父级一致(普通容器)
  if (
    oldParent && oldParent === reference.parentGroup
    && !(oldParent.getIsTabContainer() && reference.parentGroup.getIsTabContainer())
  ) {
    oldParent.removeChild(panel);
    oldParent.addChild(panel, reference.getIndexInParent() + (referencePosition === 'drag-over-next' ? 1 : 0))
    oldParent.activePanel = panel;
    return;
  }
  //0.2 原父级和目标父级一致(顶级容器)
  if (!oldParent && !reference.parentGroup && reference.parentGrid === panel.parentGrid && dropToTabHeader) {
    const parentGrid = getRootGrid(panel.parentGrid);
    parentGrid.removeChild(panel);
    parentGrid.addChild(panel, reference.getIndexInParent() + (referencePosition === 'drag-over-next' ? 1 : 0))
    parentGrid.activePanel = panel;
    return;
  }

  //1. 原父级目标父级不一致 》移除
  removePanelInternal(panel);

  //2. 放置面板

  //2.1 TAB头 》在TAB中添加子页
  if (reference.parentGroup?.getIsTabContainer() && dropToActiviyBar) {
    reference.parentGroup.addChild(panel);
    reference.parentGroup.notifyRelayout();
    reference.parentGroup.activePanel = panel;
    panel.size = 0;
    panel.notifyRelayout();
    return;
  }
  //2.1.1 TAB页自己 》在TAB中添加子页
  if (reference.getIsTabContainer()) {
    reference.addChild(panel);
    reference.notifyRelayout();
    reference.activePanel = panel;
    panel.size = 0;
    panel.notifyRelayout();
    return;
  }

  //2.2 侧边栏(顶级) 》在侧边栏中添加子页
  if (reference.getIsTopGroup() && dropToEmpty) {
    const grid = getRootGrid(reference.parentGrid);
    grid.addChild(panel);
    panel.notifyRelayout();

    //侧边栏拖拽后自动激活
    if (reference.parentGrid === 'primarySideBar')
      grid.activePanel = panel;
    return;
  }

  const newParent = reference.getParent();
  if (!newParent) {
    //2.4 空板 》成为空板的子级 (dragDropToGrid)
    return dragDropToGrid(reference.parentGrid, panel);
  }

  const flatChildren = panel.getFlatternChildOrSelf();

  //2.3 组内
  if (
    newParent.children.length === 1
    //当拖拽至只有一个子级的TAB页上时，reference 就是需要分割的面板
    || (!dropToTabHeader && newParent instanceof CodeLayoutPanelInternal && newParent.getIsTabContainer())
    //当拖拽至只有一个子级的顶级页上时，reference 就是需要分割的面板
    || (!dropToActiviyBar && newParent instanceof CodeLayoutGridInternal)  
  ) {
    //2.3.1

    const newGroup = new CodeLayoutPanelInternal(getRootGrid);
    Object.assign(newGroup, {
      ...reference,
      name: reference.name + '.clone' + Math.floor(Math.random() * 10),
      children: []
    });
    reference.open = true;
    newGroup.addChild(reference);
    panelInstances.set(newGroup.name, newGroup);

    switch (referencePosition) {
      case 'drag-over-prev':
        newGroup.addChilds(flatChildren, 0);
        break;
      case 'drag-over-next':
        newGroup.addChilds(flatChildren);
        break;
    }

    //替换至当前级
    newParent.replaceChild(reference, newGroup);
    newParent.activePanel = newGroup;

    for (const child of newGroup.children) {
      child.size = 0;
      child.open = true;
      child.notifyRelayout();
    }

    //重新布局面板
    newGroup.notifyRelayout();
  }
  else {
    //2.3.2

    //插入至指定位置并且重新布局
    const insetIndex = newParent.children.indexOf(reference);
    switch (referencePosition) {
      case 'drag-over-prev':
        newParent.addChilds(flatChildren, insetIndex);
        break;
      case 'drag-over-next':
        newParent.addChilds(flatChildren, insetIndex + 1);
        break;
    }

    //强制将当前面板大小归零，以让容器重新分配大小
    for (const flatPanel of flatChildren)
      flatPanel.size = 0;

    if (!dropToTabHeader) {
      //不是拖拽到TAB上，新插入面板，现在要重新调整其中的大小
      if (newParent instanceof CodeLayoutPanelInternal)
        newParent.relayoutAllWithNewPanel(flatChildren);
    }
      
    panel.notifyRelayout();
    newParent.activePanel = panel;
  }
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
      firstChildren.size = 0;//只有一个容器后直接占满容器
      gridInstance.replaceChild(group, firstChildren);
      panelInstances.delete(group.name);
      return;
    }
  }
  else if (group.children.length === 1) {
    //当前面板子级数量少于1个，删除自己，子级替代自己
    const firstChildren = group.children[0];
    firstChildren.open = true;
    firstChildren.size = 0;//只有一个容器后直接占满容器
    group.parentGroup!.replaceChild(group, firstChildren);
    panelInstances.delete(group.name);
    return;
  }

  //普通组移除状态下，无需其他操作，通知面板进行布局
  panelInstances.get(group.name)?.relayoutAllWithRemovePanel(panel);
}

//处理函数

provide('codeLayoutConfig', layoutConfig);
provide('codeLayoutLangConfig', props.langConfig);
provide('codeLayoutContext', codeLayoutContext);

function onActivityBarAcitve(panelGroup: CodeLayoutPanelInternal) {
  if (panels.value.primary.activePanel === panelGroup && props.layoutConfig.primarySideBarSwitchWithActivityBar) {
    //如果点击当前条目，则切换侧边栏
    emit('update:primarySideBar', !props.primarySideBar);
  } else {
    //如果侧边栏关闭，则打开
    if (!props.primarySideBar)
      emit('update:primarySideBar', true);
    //取消激活其他的面板
    panels.value.primary.children.forEach((p) => p.open = false);
    panelGroup.open = true;
    panels.value.primary.activePanel = panelGroup;
  }
}
function onPrimarySideBarSwitch(on: boolean) {
  //当侧边栏关闭时，取消激活全部的面板
  if (!on) 
    panels.value.primary.children.forEach((p) => p.open = false);
  //当侧边栏重新打开时，需要重新显示激活面板
  if (on && panels.value.primary.activePanel && !panels.value.primary.children.find((p) => p.open))
    panels.value.primary.activePanel.open = true;
  emit('update:primarySideBar', on);
}


//公开控制接口

function getRootGrid(target: CodeLayoutGrid) : CodeLayoutGridInternal {
  switch (target) {
    case 'primarySideBar': return panels.value.primary as CodeLayoutGridInternal;
    case 'secondarySideBar': return panels.value.secondary as CodeLayoutGridInternal;
    case 'bottomPanel': return panels.value.bottom as CodeLayoutGridInternal;
    case 'centerArea': return panels.value.center as CodeLayoutGridInternal;
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
        panels.value.primary.activePanel = panelInternal;
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

  const groupResult = reactive(new CodeLayoutPanelInternal(getRootGrid));
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

  const panelResult = reactive(new CodeLayoutPanelInternal(getRootGrid));
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
@import './Scss/Base.scss';
@import './Scss/Menu.scss';
</style>