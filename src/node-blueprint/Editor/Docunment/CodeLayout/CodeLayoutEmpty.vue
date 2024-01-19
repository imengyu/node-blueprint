<template>
  <div 
    ref="container"
    :class="[
      'code-layout-empty',
      dragEnterState ? 'drag-active' : '',
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @dragenter="handleDragEnter"
    @drop="handleDrop"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject, ref, type PropType } from 'vue';
import type { CodeLayoutContext, CodeLayoutGrid, CodeLayoutPanelInternal } from './CodeLayout';
import { usePanelDragOverDetector } from './Composeable/DragDrop';
import { getDropPanel } from './Composeable/DragDrop';

const props = defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    default: null,
  },
  grid: {
    type: String as PropType<CodeLayoutGrid>,
    required: true,
  },
});
const container = ref<HTMLElement>();
const context = inject('codeLayoutContext') as CodeLayoutContext;

const {
  dragEnterState,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  resetDragOverState,
} = usePanelDragOverDetector(
  container, undefined, undefined, context, 
  () => {}, 
  (dragPanel) => {
    return (
      (!dragPanel.accept || dragPanel.accept.includes(props.grid))
      && (!dragPanel.preDropCheck || dragPanel.preDropCheck(dragPanel, props.grid))
    );
  }
);

function handleDrop(e: DragEvent) {
  const panel = getDropPanel(e, context);
  if (panel) {
    e.preventDefault();
    if (props.panel)
      context.dragDropToPanelNear(props.panel, 'drag-over-next', panel, false);
    else
      context.dragDropToGrid(props.grid, panel);
  }
  resetDragOverState();
}

</script>

<style lang="scss">
.code-layout-empty {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: var(--code-layout-color-text);

  &.drag-active::after {
    background-color: var(--code-layout-color-background-mask-light);
    position: absolute;
    content: '';
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
}
</style>