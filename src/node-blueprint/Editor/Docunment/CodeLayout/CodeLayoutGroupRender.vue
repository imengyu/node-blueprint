<template>
  <div 
    v-if="group.open" 
    :class="[
      'code-layout-group',
      primary ? 'primary' : '',
    ]"
  > 
    <div v-if="tabStyle != 'none'" class="tab">
      <div v-for="(panel, key) in group.children" :key="key" class="tab">
        <span v-if="tabStyle == 'text'" class="title">{{ panel.title }}</span>
        <span v-if="tabStyle == 'icon'" class="icon">
          <CodeLayoutVNodeStringRender :content="panel.iconSmall" />
        </span>
      </div>
    </div>
    <div :class="[ 'content', horizontal ? 'horizontal' : 'vertical' ]">
      <CodeLayoutGroupDraggerHost 
        v-if="group.children.length > 0"
        :group="group"
        :horizontal="horizontal"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupDraggerHost>
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

defineProps({
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
  /**
   * Set group tab style
   * * none: no tab, use in primary side area
   * * text: tab header only show text
   * * icon: tab header only show icon
   * 
   * Default: 'none'
   */
  tabStyle: {
    type: String as PropType<'none'|'text'|'icon'>,
    default: 'none',
  },

  primary: {
    type: Boolean,
    default: false,
  },
});

</script>

<style lang="scss">
@import "./Scss/Root.scss";

.code-layout-group {
  position: relative;
  width: 100%;
  height: 100%;
  //overflow: hidden;

  &.primary {
    background-color: var(--code-layout-color-background-second);
  }

  > .tab {

  }
  > .content {
    position: relative;
    width: 100%;
    height: 100%;


    &.vertical {
      .code-layout-panel {
        width: 100%;
        background-color: rgb(133, 0, 0);
      }
    }
    &.horizontal {
      .code-layout-panel {
        height: 100%;
      }
    }
  }
}

</style>