<template>
  <div ref="propItem" class="prop-item">
    <span :style="{ width: `${titleSize}%` }">{{ title }}</span>
    <div v-if="resizeable" class="prop-split" @mousedown="splterDrageHandler" />
    <div :style="{ width: `${editorSize}%` }" class="prop-item-editor">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { PropBoxContext } from './PropBox.vue';
import { createMouseDragHandler } from '@/node-blueprint/Editor/Graph/Editor/MouseHandler';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

const propItem = ref<HTMLElement>();

defineProps({
  title: {
    type: String,
    default: '',
  },
  resizeable: {
    type: Boolean,
    default: true,
  },
});

const { gridSize, updateGridSize } = inject<PropBoxContext>('PropBoxContext', {
  gridSize: ref(0.5),
  updateGridSize() {},
});

const titleSize = computed(() => gridSize.value * 100);
const editorSize = computed(() => (1 - gridSize.value) * 100);


let mouseDragDownX = 0;
const splterDrageHandler = createMouseDragHandler({
  onDown() { 
    if (propItem.value)
      mouseDragDownX = HtmlUtils.getLeft(propItem.value);
    return true;
  },
  onMove(downPos, movedPos, e) {
    if (propItem.value)
      updateGridSize((e.x - mouseDragDownX) / propItem.value.offsetWidth)
  },
  onUp() {
    
  },
})
</script>

<style lang="scss">
.prop-item {
  white-space: nowrap;
  position: relative;
  padding: 3px 2px 5px 0;
  border-bottom: 1px solid var(--mx-editor-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;

  > .prop-item-editor {
    position: relative;
    display: inline-block;
  }
  > .prop-split {
    height: 100%;
    width: 1px;
    margin: 0 5px;
    background-color: var(--mx-editor-border-color);
    cursor: ew-resize;
  }
  > span {
    display: inline-block;
    text-align: right;
    color: var(--mx-editor-text-color);
  }
}
</style>