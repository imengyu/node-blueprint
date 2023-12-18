<template>
  <div 
    :class="[
      'code-layout-panel',
      open ? 'open' : '',
      selected ? 'selected' : '',
    ]"
    tabindex="0"
  > 
    <div 
      v-if="!alone" class="collapse"
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @click="$emit('update:open', !open)"
    >
      <div>
        <IconArrow class="arrow" />
        <CodeLayoutVNodeStringRender :content="panel.title" />
      </div>
      <CodeLayoutActionsRender class="actions" :actions="panel.actions" />
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
import CodeLayoutActionsRender from './CodeLayoutActionsRender.vue';
import IconArrow from './Icons/IconArrow.vue';

defineEmits([ 'update:open' ])

const props = defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
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

function handleDragStart(ev: DragEvent) {
  (ev.target as HTMLElement).classList.add("dragging");

  if (ev.dataTransfer)
    ev.dataTransfer.setData("text/plain", `CodeLayoutPanel:${props.panel.name}`);
}
function handleDragEnd(ev: DragEvent) {
  (ev.target as HTMLElement).classList.remove("dragging");
}

</script>

<style lang="scss">
@import "./Scss/Root.scss";

.code-layout-panel {

  &.open {
    > .collapse {
      border-bottom-color: transparent;

      .arrow {
        transform: rotate(90deg) ;
      }
    }
  }
  &:focus {
    > .collapse {
      border: 1px solid var(--code-layout-color-highlight);

      .actions {
        visibility: visible;
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
    border: 1px solid transparent;
    border-top: 1px solid var(--code-layout-color-border);
    cursor: pointer;
    user-select: none;
    overflow: hidden;

    .actions {
      visibility: hidden;
    }

    svg {
      fill: currentColor;
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

    &.dragging {
      opacity: 0.8;
    }
  }
  > .content {
    position: relative;
    overflow: hidden;
  }
}

</style>