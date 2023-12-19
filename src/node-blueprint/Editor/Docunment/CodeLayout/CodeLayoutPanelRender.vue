<template>
  <div 
    :class="[
      'code-layout-panel',
      open ? 'open' : '',
      selected ? 'selected' : '',
      draggable ? 'draggable' : '',
      horizontal ? 'horizontal' : '',
    ]"
    tabindex="0"
  > 
    <div v-if="draggable" class="drag-line" />
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
  draggable: {
    type: Boolean,
    default: false,
  },
  horizontal: {
    type: Boolean,
    default: true,
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
  position: relative;

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

  &.horizontal {

    > .drag-line {
      cursor: ew-resize;
    }
  }

  > .drag-line {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--code-layout-color-border-size-dragger) / 2 * -1);
    height: var(--code-layout-color-border-size-dragger);
    transition: background-color ease-in-out 0.4s;
    z-index: 10;
    cursor: ns-resize;

    &:hover, &.active {
      background-color: var(--code-layout-color-highlight);
    }
  }

  > .collapse {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 22px;
    color: var(--code-layout-color-text);
    padding: 0 5px;
    border: 1px solid transparent;
    border-top: 1px solid var(--code-layout-color-border);
    cursor: pointer;
    user-select: none;
    overflow: hidden;

    svg {
      fill: currentColor;
    }

    .actions {
      visibility: hidden;
    }
    .arrow {
      margin-top: 1px;
      margin-right: 2px;
    }

    div {
      display: flex;
      align-items: center;
      flex-direction: row;
      justify-content: start;
    }
    span {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 12px;
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