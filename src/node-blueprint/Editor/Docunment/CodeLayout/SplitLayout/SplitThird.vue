<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'code-layout-split-base horizontal',
    ]"
  >
    <div 
      v-if="showLeft"
      :style="{ width: `calc(${sizeLeft}% - 2px)` }"
    >
      <slot name="left" />
    </div>
    <div 
      v-if="showLeft"
      :class="[
        'code-layout-split-dragger',
        canResize ? 'resize' : '',
      ]" 
      @mousedown="dragHandlerLeft"
    />
    <div :style="{ width: `calc(${centerWidth}% - 1px)` }">
      <slot name="center" />
    </div>
    <div 
      v-if="showRight"
      :class="[
        'code-layout-split-dragger',
        canResize ? 'resize' : '',
      ]" 
      @mousedown="dragHandlerRight"
    />
    <div
      v-if="showRight"
      :style="{ width: `calc(${sizeRight}% - 1px)` }"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import { createMouseDragHandler } from '@/node-blueprint/Editor/Graph/Editor/MouseHandler';
import { ref, computed } from 'vue';

const emit = defineEmits([ 
  'update:sizeLeft',
  'update:sizeRight',
  'closeLeft',
  'closeRight',
]);

const centerWidth = computed(() => {
  let w = 100;
  if (props.showLeft) w -= props.sizeLeft;
  if (props.showRight) w -= props.sizeRight;
  return w;
});

const props = defineProps({
  /**
   * Set user can resize
   * 
   * Default: true
   */
  canResize: {
    type: Boolean,
    default: true,
  },
  /**
   * Set whether users can drag resize panels until the size is below the minimum value to close the panel.
   * 
   * Close panel will emit a event 'closeLeft' or 'closeRight'.
   * 
   * Default: true
   */
  canMinClose: {
    type: Boolean,
    default: true,
  },
  /**
   * Show left area?
   * 
   * Default: true
   */
  showLeft: {
    type: Boolean,
    default: true,
  },
  /**
   * Show right area?
   * 
   * Default: false
   */
  showRight: {
    type: Boolean,
    default: false,
  },
  /**
   * Size of left panel, precent (0-100)
   * 
   * Default: 20
   */
  sizeLeft: {
    type: Number,
    default: 20,
  },
  /**
   * Size of right panel, precent (0-100)
   * 
   * Default: 20
   */
  sizeRight: {
    type: Number,
    default: 20,
  },
  /**
   * Set the left panel min size.
   * Zero is not limited.
   * 
   * If the value is between 0 and 1, it is considered a percentage.
   * 
   * Default: 0
   */
  leftMinSize: {
    type: Number,
    default: 0,
  },
  /**
   * Set the right panel min size.
   * Zero is not limited.
   * 
   * If the value is between 0 and 1, it is considered a percentage.
   * 
   * Default: 0
   */
  rightMinSize: {
    type: Number,
    default: 0,
  },
});

const splitBase = ref<HTMLElement>();

let baseLeft = 0;

const dragHandlerLeft = createMouseDragHandler({
  onDown() {
    if (splitBase.value) {
      baseLeft = HtmlUtils.getLeft(splitBase.value);
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if (splitBase.value) {

      let dragSize = (e.x - baseLeft);
      let minSize = props.leftMinSize;
      if (minSize > 0 && minSize < 1)
        minSize = minSize * splitBase.value.offsetWidth;

      if (minSize > 0) {
        emit('closeLeft', dragSize > minSize / 2);
        dragSize = Math.max(minSize, dragSize)
      }

      emit('update:sizeLeft', (dragSize / splitBase.value.offsetWidth) * 100);
    }
  },
  onUp() {
  },
});
const dragHandlerRight = createMouseDragHandler({
  onDown() {
    if (splitBase.value) {
      baseLeft = HtmlUtils.getLeft(splitBase.value);
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if (splitBase.value) {

      let dragSize = splitBase.value.offsetWidth - (e.x - baseLeft);
      let minSize = props.leftMinSize;
      if (minSize > 0 && minSize < 1)
        minSize = minSize * splitBase.value.offsetWidth;

      if (minSize > 0) {
        emit('closeLeft', dragSize >= minSize / 2);
        dragSize = Math.max(minSize, dragSize)
      }

      emit('update:sizeLeft', (dragSize / splitBase.value.offsetWidth) * 100);
    }
  },
  onUp() {
  },
});

</script>

<style lang="scss">
@import "../Scss/Split.scss";
</style>
