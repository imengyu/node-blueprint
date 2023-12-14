<template>
  <div v-if="group.open" class="code-layout-group"> 
    <div v-if="tabStyle != 'none'" class="tab">
      <div v-for="(panel, key) in group.children" :key="key" class="tab">
        <span v-if="tabStyle == 'text'" class="title">{{ panel.title }}</span>
        <span v-if="tabStyle == 'icon'" class="icon">
          <CodeLayoutVNodeStringRender :content="panel.iconSmall" />
        </span>
      </div>
    </div>
    <div :class="[ 'content', horizontal ? 'horizontal' : '' ]">
      <template v-if="group.children.length > 0">
        <CodeLayoutPanelRender
          v-for="(panel, key) in group.children" :key="key"
          v-model:open="panel.open"
          :panel="panel"
          :alone="(group.children?.length === 1)"
        >
          <template #default="data">
            <slot name="panelRender" v-bind="data" />
          </template>
        </CodeLayoutPanelRender>
      </template>
      <CodeLayoutPanelRender
        v-else
        :open="true"
        :panel="group"
        :alone="true"
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
});

</script>

<style lang="scss">
@import "./Scss/Root.scss";

.code-layout-group {

  > .tab {

  }
  > .content {
    
  }
}

</style>