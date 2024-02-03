<template>
  <div 
    ref="container"
    :class="[
      'item',
      active ? 'active' : '',
      dragEnterState ? 'drag-enter' : '',
      dragOverState,
    ]"
    :draggable="true"
    @click="$emit('activeItem', item)"
    @dragstart="handleDragStart(item, $event)"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @dragenter="handleDragEnter"
    @drop="handleDrop"
  >
    <div class="icon">
      <CodeLayoutVNodeStringRender :content="item.iconLarge" />
    </div>
    <span v-if="item.badge">
      <CodeLayoutVNodeStringRender :content="item.badge" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, toRefs, type PropType } from 'vue';
import type { CodeLayoutContext, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutVNodeStringRender from './Components/CodeLayoutVNodeStringRender.vue';
import { checkDropPanelDefault, getDropPanel, usePanelDragger, usePanelDragOverDetector } from './Composeable/DragDrop';

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
  container, item, horizontal, context, 
  () => emit('activeItem'),
  (dragPanel) => checkDropPanelDefault(dragPanel, item.value, dragOverState)
);

function handleDrop(e: DragEvent) {
  const dropPanel = getDropPanel(e, context);
  if (dropPanel && dragOverState.value) {
    e.preventDefault();
    e.stopPropagation();
    context.dragDropToPanelNear(item.value, dragOverState.value, dropPanel, 'activiy-bar');
  }
  resetDragOverState();
}


</script>