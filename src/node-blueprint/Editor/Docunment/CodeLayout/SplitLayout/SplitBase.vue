<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'code-layot-split-base',
      horizontal ? 'horizontal' : 'vertical',
    ]"
  >
    <div 
      v-if="showFirst"
      :style="{ 
        width: horizontal ? (showSecond ? `calc(${size}% - 2px)` : '100%' ) : '100%',
        height: horizontal ? undefined : (showSecond ? `calc(${size}% - 2px)` : '100%' ),
      }"
    >
      <slot name="first" />
    </div>
    <div 
      v-if="showFirst && showSecond"
      :class="[
        'code-layot-split-dragger',
        canResize ? 'resize' : '',
      ]" 
      @mousedown="dragHandler"
    />
    <div 
      v-if="showSecond"
      :style="{ 
        width: horizontal ? (showFirst ? `calc(${100 - size}% - 1px)` : '100%') : '100%',
        height: horizontal ? undefined : (showFirst ? `calc(${100 - size}% - 1px)` : '100%'),
      }"
    >
      <slot name="second" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import { createMouseDragHandler } from '@/node-blueprint/Editor/Graph/Editor/MouseHandler';
import { ref } from 'vue';

const emit = defineEmits([ 'update:size' ]);

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
   * Is horizontal?
   * 
   * Default: true
   */
  horizontal: {
    type: Boolean,
    default: true,
  },
  /**
   * Size of base panel, precent (0-100)
   * 
   * Default: 50
   */
  size: {
    type: Number,
    default: 50,
  },
  /**
   * Show first panel?
   * 
   * Default: true
   */
  showFirst: {
    type: Boolean,
    default: true,
  },
  /**
   * Show second panel?
   * 
   * Default: true
   */
  showSecond: {
    type: Boolean,
    default: true,
  },
});

const splitBase = ref<HTMLElement>();

let baseLeft = 0;

const dragHandler = createMouseDragHandler({
  onDown() {
    if (splitBase.value) {
      baseLeft = (props.horizontal ? 
        HtmlUtils.getLeft(splitBase.value) : 
        HtmlUtils.getTop(splitBase.value)
      );
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if (splitBase.value) {
      let size = 0;
      if (props.horizontal)
        size = ((e.x - baseLeft) / splitBase.value.offsetWidth) * 100;
      else 
        size = ((e.y - baseLeft) / splitBase.value.offsetHeight) * 100;
      emit('update:size', size);
    }
  },
  onUp() {
  },
});

</script>