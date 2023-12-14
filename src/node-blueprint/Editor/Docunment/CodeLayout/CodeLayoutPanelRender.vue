<template>
  <div 
    :class="[
      'code-layout-panel',
      open ? 'open' : ''
    ]"
  > 
    <div v-if="!alone" class="collapse" @click="$emit('update:open', !open)">
      <div>
        <IconArrow />
        <CodeLayoutVNodeStringRender :content="panel.title" />
      </div>
      <div class="actions">

      </div>
    </div>
    <div v-if="open" class="content">
      <slot :panel="panel" :open="open" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';
import IconArrow from './Icons/IconArrow.vue';

defineEmits([ 'update:open' ])

defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
  },
  /**
   * Only my self? Id true, do not show header
   */
  alone: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
});

</script>

<style lang="scss">
@import "./Scss/Root.scss";

.code-layout-panel {

  &.open {
    > .collapse {
      border-bottom: none;

      .actions {
        visibility: visible;
      }
      svg {
        transform: rotate(90deg) ;
      }
    }
  }

  &:hover {
    > .collapse .actions {
      visibility: visible;
    }
  }
  &:first-child > .collapse {
    border-top: none;
  }

  > .collapse {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 22px;
    color: var(--code-layout-color-text);
    padding: 2px 5px;
    border-top: 1px solid var(--code-layout-color-border);
    cursor: pointer;

    .actions {
      visibility: hidden;
    }

    svg {
      fill: currentColor;
      margin-right: 2px;
    }

    div {
      display: flex;
      align-items: center;
      flex-direction: row;
    }

    span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 14px;
      min-width: 3ch;
    }
  }
  > .content {
    
  }
}

</style>