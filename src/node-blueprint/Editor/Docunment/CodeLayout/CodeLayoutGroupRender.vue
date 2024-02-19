<template>
  <!-- 扁平情况下多个条目只显示单页 -->
  <template v-if="show && group.tabStyle === 'hidden'">
    <template v-if="group.children.length > 0">
      <CodeLayoutGroupRender
        v-for="(panelGroup, key) in group.children"
        :key="key"
        :show="panelGroup.visible && panelGroup === group.activePanel"
        :group="(panelGroup as CodeLayoutPanelInternal)"
        :horizontal="false"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
        <template #emptyTabRender>
          <slot name="emptyTabRender" />
        </template>
      </CodeLayoutGroupRender>
    </template>
    <slot v-else name="emptyTabRender" />
  </template>
  <!-- 正常页面 -->
  <div 
    v-else-if="show" 
    :class="[
      'code-layout-group',
      primary ? 'primary' : '',
      'tab-' + group.tabStyle,
    ]"
  > 
    <!-- TAB栏 -->
    <div 
      v-if="group.tabStyle && group.tabStyle != 'none' && group.tabStyle != 'single'"
      :class="'tab ' + group.tabStyle"
    >
      <OverflowCollapseList 
        class="tab-container"
        :items="group.children"
        :activeItem="group.activePanel"
        :itemMenuLabel="(p) => (p as CodeLayoutPanelInternal).title"
        @overflowItemClicked="(p) => group.setActiveChild(p as CodeLayoutPanelInternal)"
      >
        <template #item="{ item: panel }">
          <CodeLayoutTabItem 
            v-show="panel.visible"
            :tabStyle="group.tabStyle"
            :active="group.activePanel === panel"
            :panel="panel"
            @click="handleTabClick(panel)"
            @focusSelf="handleTabClick(panel)"
          />
        </template>
      </OverflowCollapseList>
      <CodeLayoutActionsRender v-if="group.activePanel" class="actions" :actions="group.activePanel.actions" />
    </div>
    <!-- 标题栏 -->
    <div 
      v-else-if="group.tabStyle === 'single'"
      class="title-bar"
      :draggable="true"
      @dragstart="handleDragStart(group, $event)"
      @dragend="handleDragEnd"
      @contextmenu="onContextMenu(group, $event)"
    >
      <span class="title">{{ group.title }}</span>
      <CodeLayoutActionsRender v-if="group.activePanel" class="actions" :actions="group.actions" />
    </div>
    <!-- 内容区 -->
    <div :class="[ 'content', horizontal ? 'horizontal' : 'vertical' ]">
      <!-- 未有TAB栏情况下多个条目，支持拖拽分割 -->
      <CodeLayoutGroupDraggerHost 
        v-if="group.children.length > 0 && (!group.tabStyle || group.tabStyle === 'none' || group.tabStyle === 'single')"
        :group="group"
        :horizontal="horizontal"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupDraggerHost>
      <!-- 有TAB栏情况下多个条目，支持拖拽分割 -->
      <CodeLayoutGroupDraggerHost 
        v-else-if="group.activePanel && group.activePanel.children.length > 0"
        :group="group.activePanel"
        :horizontal="horizontal"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupDraggerHost>
      <slot 
        v-else-if="(group.tabStyle === 'text' || group.tabStyle === 'icon') && group.children.length == 0"
        name="emptyTabRender" 
      />
      <!-- 有TAB栏情况下单个条目 -->
      <CodeLayoutPanelRender
        v-else-if="group.activePanel"
        :open="true"
        :panel="group.activePanel"
        :alone="true"
        :horizontal="horizontal"
      >
        <template #default="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutPanelRender>
      <!-- 未有TAB栏情况下单个条目 -->
      <CodeLayoutPanelRender
        v-else
        :open="true"
        :panel="group"
        :alone="true"
        :horizontal="horizontal"
      >
        <template #default="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutPanelRender>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutGroupDraggerHost from './CodeLayoutGroupDraggerHost.vue';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';
import CodeLayoutActionsRender from './CodeLayoutActionsRender.vue';
import CodeLayoutTabItem from './CodeLayoutTabItem.vue';
import OverflowCollapseList from './Components/OverflowCollapseList.vue';
import { usePanelDragger } from './Composeable/DragDrop';
import { usePanelMenuControl } from './Composeable/PanelMenu';

const props = defineProps({
  group: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
  },
  horizontal: {
    type: Boolean,
    default: true,
  },
  show: {
    type: Boolean,
    default: true,
  },
  primary: {
    type: Boolean,
    default: false,
  },
});

//标签点击函数

function handleTabClick(panel: CodeLayoutPanelInternal) {
  const parent = props.group;
  parent.activePanel = panel;
}

//拖放面板处理函数

const {
  handleDragStart,
  handleDragEnd,
} = usePanelDragger();

//菜单处理
const {
  onContextMenu
} = usePanelMenuControl();
</script>

<style lang="scss">

.code-layout-group {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  --tab-padding: 10px;
  --tab-vertical-padding: 4px;
  --tab-font-size: 13px;
  --tab-font-size-small: 11px;

  &.primary {
    background-color: var(--code-layout-color-background-second);
  }

  //Tab header
  > .tab {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;
    padding: 0 var(--tab-padding);
    margin-bottom: 2px;

    .tab-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      flex-wrap: nowrap;
      flex-shrink: 0;
    }
    .tab-item {
      position: relative;
      padding: var(--tab-vertical-padding) var(--tab-padding);
      font-size: var(--tab-font-size);
      line-height: calc(var(--tab-font-size) * 2);
      color: var(--code-layout-color-text);
      cursor: pointer;

      .badge {
        position: absolute;
        right: 0;
        bottom: 0;
        display: inline-block;
        padding: 3px;
        transform: scale(0.8);
        border-radius: var(--tab-font-size-small);
        font-size: var(--tab-font-size-small);
        min-width: var(--tab-font-size-small);
        line-height: var(--tab-font-size-small);
        text-align: center;
        background-color: var(--code-layout-color-highlight);
      }

      span {
        pointer-events: none;
      }

      &:hover, &:active, &.active {
        color: var(--code-layout-color-text-light);
      }
      &.active::after {
        position: absolute;
        content: '';
        left: var(--tab-padding);
        right: var(--tab-padding);
        bottom: 0px;
        height: 1px;
        background-color: var(--code-layout-color-text-light);
      }
      &.dragging {
        background-color: var(--code-layout-color-background);
        opacity: 0.7;
      }
      /*&.drag-enter {
        
      }*/
      &.drag-over-left, &.drag-over-up, &.drag-over-down, &.drag-over-right {
        &::before {
          position: absolute;
          content: '';
          top: var(--tab-vertical-padding);
          bottom: var(--tab-vertical-padding);
          width: var(--code-layout-border-size-larger);
          background-color: var(--code-layout-color-border-light);
        }
      }
      &.drag-over-left, &.drag-over-up {
        &::before {
          left: calc(var(--code-layout-border-size-larger) / 2 * -1);
        }
      }
      &.drag-over-down, &.drag-over-right {
        &::before {
          right: calc(var(--code-layout-border-size-larger) / 2 * -1);
        }
      }
    }

    &.text {
      .badge {
        position: relative;
        right: unset;
        bottom: unset;
        display: inline-block;
        margin-left: 8px;
        padding: 3px 5px;
        border-radius: var(--tab-font-size);
        font-size: var(--tab-font-size);
        min-width: var(--tab-font-size);
        line-height: var(--tab-font-size);
        background-color: var(--code-layout-color-background-light);
      }
    }
  }

  //Resize Tab content
  &.tab-icon, &.tab-text {
    .code-layout-panel {
      width: 100%;
      height: 100%;
    }
  }

  //Single title bat
  > .title-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;
    height: 35px;
    overflow: hidden;
    padding: 0 var(--tab-padding);
    font-size: var(--tab-font-size);
    user-select: none;
  }

  //Content area
  > .content {
    position: relative;
    flex: 1;

    &.vertical {
      .code-layout-panel {
        width: 100%;
      }
      .code-layout-group-dragger-host {
        flex-direction: column;
      }
    }
    &.horizontal {
      .code-layout-panel {
        height: 100%;
      }
      .code-layout-group-dragger-host {
        flex-direction: row;
      }
    }
  }
}

</style>