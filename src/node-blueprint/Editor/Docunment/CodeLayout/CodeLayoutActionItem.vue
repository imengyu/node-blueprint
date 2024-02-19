<template>
  <SimpleTooltip
    :content="item.tooltip"
    :direction="layoutConfig.primarySideBarPosition === 'left' ? 'right' : 'left'"
  >
    <div 
      ref="container"
      :class="[
        'item',
        active ? 'active' : '',
        dragEnterState ? 'drag-enter' : '',
        `drag-over-${dragOverState}`,
      ]"
      :draggable="true"
      @click="$emit('activeItem', item)"
      @dragstart="handleDragStart(item, $event)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @dragenter="handleDragEnter"
      @drop="handleDrop"
      @contextmenu="onContextMenu(item, $event)"
    >
      <div class="icon">
        <CodeLayoutVNodeStringRender :content="item.iconLarge" />
      </div>
      <span v-if="item.badge" class="badge">
        <CodeLayoutVNodeStringRender :content="item.badge" />
      </span>
    </div>
  </SimpleTooltip>
</template>

<script setup lang="ts">
import { inject, ref, toRefs, type PropType, type Ref } from 'vue';
import type { CodeLayoutConfig, CodeLayoutContext, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutVNodeStringRender from './Components/CodeLayoutVNodeStringRender.vue';
import { checkDropPanelDefault, getCurrentDragPanel, usePanelDragger, usePanelDragOverDetector } from './Composeable/DragDrop';
import { usePanelMenuControl } from './Composeable/PanelMenu';
import SimpleTooltip from './Components/SimpleTooltip.vue';

const emit = defineEmits(['activeItem'])

const props = defineProps({
  item: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const { item } = toRefs(props);
const horizontal = ref(false);
const container = ref<HTMLElement>();
const context = inject('codeLayoutContext') as CodeLayoutContext;
const layoutConfig = inject('codeLayoutConfig') as Ref<CodeLayoutConfig>;

const {
  onContextMenu
} = usePanelMenuControl();

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
  container, item, horizontal,
  () => emit('activeItem'),
  (dragPanel) => checkDropPanelDefault(dragPanel, item.value, dragOverState)
);

function handleDrop(e: DragEvent) {
  const dropPanel = getCurrentDragPanel();
  if (dropPanel && dragOverState.value) {
    e.preventDefault();
    e.stopPropagation();
    context.dragDropToPanelNear(item.value, dragOverState.value, dropPanel, 'activiy-bar');
  }
  resetDragOverState();
}


</script>