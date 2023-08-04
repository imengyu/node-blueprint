<template>
  <div
    v-if="filterShow"
    ref="propItem" 
    :class="[ 
      'prop-item',
      border ? 'border' : '',
    ]"
  >
    <span :style="{ width: resizeable && titleSize > 0 ? `${titleSize}%` : undefined }">{{ title }}</span>
    <div v-if="resizeable" class="prop-split" @mousedown="splterDrageHandler" />
    <div :style="{ width: resizeable && titleSize > 0 ? `${editorSize}%` : undefined }" class="prop-item-editor">
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

const prop = defineProps({
  title: {
    type: String,
    default: '',
  },
  resizeable: {
    type: Boolean,
    default: true,
  },
  border: {
    type: Boolean,
    default: true,
  },
});

const { gridSize, updateGridSize, filterProp } = inject<PropBoxContext>('PropBoxContext', {
  filterProp: ref(''),
  gridSize: ref(-1),
  updateGridSize() {},
});

const filterShow = computed(() => {
  if (!filterProp.value)
    return true;
  return prop.title.includes(filterProp.value);
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
    if (propItem.value) {
      const size = (e.x - mouseDragDownX) / propItem.value.offsetWidth;
      updateGridSize(size)
    }
  },
  onUp() {},
})
</script>

<style lang="scss">
.prop-item {
  white-space: nowrap;
  position: relative;
  display: flex;
  align-items: stretch;
  font-size: 12px;
  
  &.border {
    border-bottom: 1px solid var(--mx-editor-border-color);

    > .prop-split::after {
      background-color: var(--mx-editor-border-color);
    }
  }

  > .prop-item-editor {
    position: relative;
    display: inline-block;
    padding: 4px;
    color: var(--mx-editor-text-color);
  }
  > .prop-split {
    position: relative;
    width: 1px;
    padding: 0 5px;
    cursor: ew-resize;

    &::after {
      position: absolute;
      content: '';
      width: 1px;
      height: 100%;
    }
  }

  > span {
    flex-shrink: 0;
    padding: 6px 14px;
    display: flex;
    text-align: right;
    color: var(--mx-editor-text-color);
  }
}
</style>