<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'code-layot-split-base horizontal',
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
        'code-layot-split-dragger',
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
        'code-layot-split-dragger',
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
      let size = ((e.x - baseLeft) / splitBase.value.offsetWidth) * 100;
      emit('update:sizeLeft', size);
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
      let size = 100 - ((e.x - baseLeft) / splitBase.value.offsetWidth) * 100;
      emit('update:sizeRight', size);
    }
  },
  onUp() {
  },
});

</script>
