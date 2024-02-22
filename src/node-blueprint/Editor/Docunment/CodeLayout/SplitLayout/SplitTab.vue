<template>
  <div class="code-layout-split-tab">
    <!--tab list-->
    <div
      v-if="grid.children.length > 0" 
      ref="tabScroll" 
      :class="[
        'code-layout-split-tab-list',
        tabHeaderDragOverDetector.dragEnterState.value ? 'drag-active' : '',
      ]"
      @dragover="tabHeaderDragOverDetector.handleDragOver"
      @dragleave="tabHeaderDragOverDetector.handleDragLeave"
      @dragenter="tabHeaderDragOverDetector.handleDragEnter"
      @drop="handleTabHeaderDrop"
    >
      <slot name="tabHeaderRender">
        <div class="tabs">
          <slot
            v-for="(panel, index) in grid.children"
            :key="index"
            :panel="panel" 
            :index="index"
            :active="panel === grid.activePanel"
            name="tabItemRender" 
          >
            <SplitTabItem 
              :panel="panel"
              :active="panel === grid.activePanel"
              @click="grid.setActiveChild(panel)"
              @contextmenu="emit('tabItemContextMenu', panel, $event)"
            />
          </slot>
        </div>
      </slot>
      <slot name="tabHeaderExtraRender" />
    </div>
    <!--tab content -->
    <div 
      ref="tabContent"
      :class="[
        'code-layout-split-tab-content',
        grid.children.length > 0 ? '' : 'empty',
        tabContentDragOverDetector.dragPanelState.value ? 'dragging' : '',
        tabContentDragOverDetector.dragEnterState.value ? 'drag-active' : '',
        `drag-over-${tabContentDragOverDetector.dragOverState.value}`,
      ]"
      @dragover="tabContentDragOverDetector.handleDragOver"
      @dragleave="tabContentDragOverDetector.handleDragLeave"
      @dragenter="tabContentDragOverDetector.handleDragEnter"
      @drop="handleTabContentDrop"
    >
      <slot v-if="grid.activePanel" name="tabContentRender" :panel="grid.activePanel" />
      <slot v-else name="tabEmptyContentRender" :grid="grid" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType, inject, toRefs } from 'vue';
import type { CodeLayoutSplitLayoutContext, CodeLayoutSplitNGridInternal } from './SplitN';
import SplitTabItem from './SplitTabItem.vue'
import { getCurrentDragPanel, usePanelDragOverDetector } from '../Composeable/DragDrop';

const props = defineProps({
  grid: {
    type: Object as PropType<CodeLayoutSplitNGridInternal>,
    default: null,
  },
});

const emit = defineEmits([ 'tabItemContextMenu' ])

const { grid } = toRefs(props);
const context = inject('splitLayoutContext') as CodeLayoutSplitLayoutContext;
const tabScroll = ref<HTMLElement>();
const tabContent = ref<HTMLElement>();
const horizontal = ref(false);

const tabHeaderDragOverDetector = usePanelDragOverDetector(
  tabScroll, grid, horizontal,
  () => {}, 
  (dragPanel) => {
    return (
      (!dragPanel.accept || dragPanel.accept.includes(props.grid.parentGrid))
      && (!dragPanel.preDropCheck || dragPanel.preDropCheck(dragPanel, props.grid.parentGrid))
    );
  }
);

function handleTabHeaderDrop(e: DragEvent) {
  const dropPanel = getCurrentDragPanel();
  if (dropPanel) {
    e.preventDefault();
    e.stopPropagation();
    context.dragDropToPanel(props.grid, 'center', dropPanel, true);
  }
  tabHeaderDragOverDetector.resetDragOverState();
}

const tabContentDragOverDetector = usePanelDragOverDetector(
  tabContent, grid, 'four',
  () => {}, 
  (dragPanel) => {
    return (
      (!dragPanel.accept || dragPanel.accept.includes(props.grid.parentGrid))
      && (!dragPanel.preDropCheck || dragPanel.preDropCheck(dragPanel, props.grid.parentGrid))
    );
  },
);

function handleTabContentDrop(e: DragEvent) {
  const dropPanel = getCurrentDragPanel();
  if (dropPanel) {
    e.preventDefault();
    e.stopPropagation();
    context.dragDropToPanel(
      grid.value, 
      tabContentDragOverDetector.dragOverState.value, 
      dropPanel
    );
  }
  tabContentDragOverDetector.resetDragOverState();
}
</script>