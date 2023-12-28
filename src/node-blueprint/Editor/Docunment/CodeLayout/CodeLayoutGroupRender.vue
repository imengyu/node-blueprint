<template>
  <div 
    v-if="group.open" 
    :class="[
      'code-layout-group',
      primary ? 'primary' : '',
    ]"
  > 
    <!-- TAB栏 -->
    <div 
      v-if="group.tabStyle && group.tabStyle != 'none'"
      :class="'tab ' + group.tabStyle"
    >
      <div 
        v-for="(panel, key) in group.children"
        :key="key" 
        :class="[
          'tab-item',
          group.activePanel === panel ? 'active' : '',
        ]"
        :draggable="true"
        @dragstart="handleDragStart(panel, $event)"
        @dragend="handleDragEnd"
        @click="handleTabClick(panel)"
      >
        <span v-if="group.tabStyle == 'text'" class="title">{{ panel.title }}</span>
        <span v-if="group.tabStyle == 'icon'" class="icon">
          <CodeLayoutVNodeStringRender :content="panel.iconSmall" />
        </span>
        <span v-if="panel.badge" class="badge">
          <CodeLayoutVNodeStringRender :content="panel.badge" />
        </span>
      </div>
    </div>
    <div :class="[ 'content', horizontal ? 'horizontal' : 'vertical' ]">
      <!-- 未有TAB栏情况下多个条目，支持拖拽分割 -->
      <CodeLayoutGroupDraggerHost 
        v-if="group.children.length > 0 && (!group.tabStyle || group.tabStyle === 'none')"
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
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';
import CodeLayoutGroupDraggerHost from './CodeLayoutGroupDraggerHost.vue';
import CodeLayoutPanelRender from './CodeLayoutPanelRender.vue';

const props = defineProps({
  group: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
  },
  /**
   * Is horizontal?
   * 
   * Default: true
   */
  horizontal: {
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

function handleDragStart(panel: CodeLayoutPanelInternal, ev: DragEvent) {
  (ev.target as HTMLElement).classList.add("dragging");
  if (ev.dataTransfer)
    ev.dataTransfer.setData("text/plain", `CodeLayoutPanel:${panel.name}`);
}
function handleDragEnd(ev: DragEvent) {
  (ev.target as HTMLElement).classList.remove("dragging");
}

</script>

<style lang="scss">
@import "./Scss/Root.scss";

.code-layout-group {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &.primary {
    background-color: var(--code-layout-color-background-second);
  }

  //Content area
  > .tab {
    --tab-padding: 10px;
    --tab-font-size: 12px;

    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    padding: 0 var(--tab-padding);
    margin-bottom: 2px;

    .tab-item {
      position: relative;
      padding: 4px var(--tab-padding);
      font-size: var(--tab-font-size);
      line-height: calc(var(--tab-font-size) * 2);
      color: var(--code-layout-color-text);
      cursor: pointer;

      .badge {
        position: relative;
        display: inline-block;
        margin-left: 8px;
        padding: 3px 5px;
        border-radius: var(--tab-font-size);
        font-size: var(--tab-font-size);
        min-width: var(--tab-font-size);
        line-height: var(--tab-font-size);
        font-weight: 400;
        text-align: center;
        background-color: var(--code-layout-color-background-light);
      }

      &:hover, &:active, &.active {
        color: var(--code-layout-color-text-highlight);
      }
      &.active::after {
        position: absolute;
        content: '';
        left: var(--tab-padding);
        right: var(--tab-padding);
        bottom: 0px;
        height: 1px;
        background-color: var(--code-layout-color-text-highlight);
      }
      &.dragging {
        background-color: var(--code-layout-color-background);
        opacity: 0.7;
      }
    }
  }

  //Content area
  > .content {
    position: relative;
    width: 100%;
    height: 100%;

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