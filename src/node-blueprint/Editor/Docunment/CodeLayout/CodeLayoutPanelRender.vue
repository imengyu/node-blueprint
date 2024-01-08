<template>
  <div 
    ref="element"
    :class="[
      'code-layout-panel',
      open ? 'open' : 'closed',
      selected ? 'selected' : '',
      dragResizeable ? 'resizeable' : '',
      resizeDraggingSelf ? 'resizing-self' : '',
      resizeDragging ? 'resizing' : '',
      horizontal ? 'horizontal' : '',
      dragEnterState ? 'drag-enter' : '',
      dragOverState,
    ]"
    :style="{
      width: horizontal && panelHeight ? `${panelHeight}px` : undefined,
      height: !horizontal && panelHeight ? `${panelHeight}px` : undefined,
    }"
    tabindex="0"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @dragenter="handleDragEnter"
    @drop="handleDrop"
  > 
    <div 
      v-if="dragResizeable"
      ref="resizeDragger"
      :draggable="false"
      :class="[
        'drag-line',
        resizeDraggingSelf ? 'active' : ''
      ]" 
      @mousedown="resizeDragHandler"
    />
    <div 
      v-if="!alone" class="collapse"
      :draggable="!resizeDragging"
      @dragstart="handleDragStart(panel, $event)"
      @dragend="handleDragEnd"
      @click="emit('toggleHandler', props.panel, !open)"
    >
      <div class="collapse-title">
        <IconArrow class="arrow" />
        <CodeLayoutVNodeStringRender :content="panel.title" />
        <CodeLayoutVNodeStringRender v-if="horizontal && !open" :content="panel.iconSmall" />
      </div>
      <CodeLayoutActionsRender class="actions" :actions="panel.actions" />
    </div>
    <div 
      v-if="open"
      class="content"
      :draggable="false"
      :style="{ 
        width: !open && horizontal ? `calc(100% - ${layoutConfig.panelHeaderHeight}px)` : '',
        height: open || !horizontal ? `calc(100% - ${layoutConfig.panelHeaderHeight}px)` : '',
      }"
    >
      <slot :panel="panel" :open="open" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType, watch, inject, toRefs } from 'vue';
import type { CodeLayoutConfig, CodeLayoutContext, CodeLayoutPanelInternal } from './CodeLayout';
import { createMouseDragHandler } from '../../Graph/Editor/MouseHandler';
import { checkDropPanelDefault, getDropPanel, usePanelDragOverDetector, usePanelDragger } from './Composeable/DragDrop';
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';
import CodeLayoutActionsRender from './CodeLayoutActionsRender.vue';
import IconArrow from './Icons/IconArrow.vue';

const emit = defineEmits([ 
  'update:open', 'update:resizeDragging',
  'toggleHandler',
])

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
  dragResizeable: {
    type: Boolean,
    default: false,
  },
  dragResizeStartHandler: {
    type: Function as PropType<(panel: CodeLayoutPanelInternal, mousePx: number) => unknown>,
    default: null,
  },
  dragResizeHandler: {
    type: Function as PropType<(panel: CodeLayoutPanelInternal, data: unknown, mousePx: number) => void>,
    default: null,
  },
  horizontal: {
    type: Boolean,
    default: true,
  },
  collapsedSize: {
    type: Number,
    default: 0,
  },
  resizeDragging: {
    type: Boolean,
    default: false,
  },
});

const panelHeight = computed(() => {
  if (!props.open)
    return props.collapsedSize;
  return props.panel.size;
});

const { horizontal, panel } = toRefs(props);
const element = ref<HTMLElement>();
const layoutConfig = inject('layoutConfig') as CodeLayoutConfig;
const context = inject('codeLayoutContext') as CodeLayoutContext;

//拖放面板处理函数

const {
  handleDragStart,
  handleDragEnd,
} = usePanelDragger();

const {
  dragEnterState,
  dragOverState,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  resetDragOverState,
} = usePanelDragOverDetector(
  element, panel, horizontal, context, 
  () => {},
  (dragPanel) => checkDropPanelDefault(dragPanel, panel.value, dragOverState)
);


function handleDrop(e: DragEvent) {
  const dropPanel = getDropPanel(e, context);
  if (dropPanel && dragOverState.value)
    context.dragDropToPanelNear(panel.value, dragOverState.value, dropPanel);
  resetDragOverState();
}

//拖拽调整大小

let resizeDraggerData : any = null;
const resizeDragger = ref<HTMLElement>();
const resizeDraggingSelf = ref(false);
const resizeDragHandler = createMouseDragHandler({
  onDown(e) {
    if (resizeDragger.value) {
      emit('update:resizeDragging', true);
      resizeDraggingSelf.value = true;

      resizeDraggerData = props.dragResizeStartHandler?.(
        props.panel, 
        (props.horizontal ? e.x : e.y)
      );

      if (resizeDraggerData === false)
        return false;

      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    props.dragResizeHandler?.(
      props.panel, 
      resizeDraggerData,
      (props.horizontal ? e.x : e.y)
    );
  },
  onUp() {
    emit('update:resizeDragging', false);
    resizeDraggingSelf.value = false;
  },
});

</script>

<style lang="scss">

.code-layout-panel {
  position: relative;
  transition: all ease-in-out 0.15s;
  flex-shrink: 0;
  flex-grow: 0;

  //状态控制
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
  &.resizing {
    transition: none ease-in-out 0s;
  }
  &.resizing-self {

    .collapse {
      cursor: inherit;
    }

    cursor: ns-resize;

    &.horizontal {
      cursor: ew-resize;
    }
  }
  &:hover {
    > .collapse .actions {
      visibility: visible;
    }
  }
  &:first-child:not(:focus) > .collapse {
    border-top-color: transparent;
  }

  &::after, &::before {
    pointer-events: none;
  }

  //拖放状态处理
  &.drag-over-prev {
    //高亮框
    &.closed {
      background-color: var(--code-layout-color-background-mask-light);
    }
    &.open::after {
      background-color: var(--code-layout-color-background-mask-light);
      position: absolute;
      content: '';
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      z-index: 1;
    }
    &.horizontal.open::after {
      top: 0;
      left: 0;
      bottom: 0;
      right: unset;
      height: unset;
      width: 50%;
    }
    //高亮线条
    &.closed::before {
      position: absolute;
      content: '';
      z-index: 2;
      background-color: var(--code-layout-color-border-light);
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
    } 
    &.horizontal.closed::before {
      left: unset;
      height: unset;
      width: 1px;
      bottom: 0;
    }
  }
  &.drag-over-next {
    //高亮框
    &.closed {
      background-color: var(--code-layout-color-background-mask-light);
    }
    &.open::after {
      position: absolute;
      background-color: var(--code-layout-color-background-mask-light);
      content: '';
      top: 50%;
      left: 0;
      right: 0;
      height: 50%;
      z-index: 1;
    }
    &.horizontal.open::after {
      top: 0;
      left: 50%;
      bottom: 0;
      right: unset;
      height: unset;
      width: 50%;
    }
    //高亮线条
    &.closed::before {
      position: absolute;
      content: '';
      background-color: var(--code-layout-color-border-light);
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      z-index: 2;
    } 
    &.horizontal.closed::before {
      left: unset;
      height: unset;
      width: 1px;
      top: 0;
    }
  }
  &.drag-enter  {
    * {
      pointer-events: none;
    }
    > .drag-line {
      pointer-events: none;
      display: none;
    }
  }

  //水平状态特殊处理
  &.horizontal {
    > .drag-line {
      cursor: ew-resize;
      top: 0;
      left: calc(var(--code-layout-border-size-dragger) / 2 * -1);
      right: unset;
      bottom: 0;
      width: var(--code-layout-border-size-dragger);
      height: unset;
    }

    &:not(:first-child) {
      border-left: 1px solid var(--code-layout-color-border);
    }

    .collapse {
      border-top: none;
      background-color: var(--code-layout-color-background-light);
    }

    &.closed {
      .collapse {
        height: 100%;
        width: var(--code-layout-header-height);
        flex-direction: column;
        justify-content: flex-start;
        padding: 6px 0;

        .actions {
          display: none;
        }
        .arrow {
          margin-bottom: 5px;
        }
      }
      .collapse-title {
        flex-direction: column;
        justify-content: flex-start;
        
        span {
          display: none;
        }
      }
    }
  }

  //拖拽线条
  > .drag-line {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--code-layout-border-size-dragger) / 2 * -1);
    height: var(--code-layout-border-size-dragger);
    transition: background-color ease-in-out 0.4s;
    z-index: 10;
    cursor: ns-resize;

    &.active, &:hover {
      background-color: var(--code-layout-color-highlight);
    }
  }

  //面板折叠头部
  > .collapse {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: var(--code-layout-header-height);
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
  //内容区
  > .content {
    position: relative;
    overflow: hidden;
  }
}

</style>