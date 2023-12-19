<template>
  <div 
    ref="splitBase" 
    :class="[ 
      'code-layout-split-base',
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
        'code-layout-split-dragger',
        canResize ? 'resize' : '',
        splitDragging ? 'active' : '',
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

const emit = defineEmits([ 'update:size', 'closeFirst', 'closeSecond' ]);

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
   * Close panel will emit a event 'closeFirst' or 'closeSecond'.
   * 
   * Default: true
   */
  canMinClose: {
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
   * Set the first panel min size.
   * Zero is not limited.
   * 
   * Can not set both firstMinSize and secondMinSize.
   * 
   * If the value is between 0 and 1, it is considered a percentage.
   * 
   * Default: 0
   */
  firstMinSize: {
    type: Number,
    default: 0,
  },
  /**
   * Set the second panel min size.
   * Zero is not limited.
   * 
   * Can not set both firstMinSize and secondMinSize.
   * 
   * If the value is between 0 and 1, it is considered a percentage.
   * 
   * Default: 0
   */
  secondMinSize: {
    type: Number,
    default: 0,
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
const splitDragging = ref(false);

let baseLeft = 0;

const dragHandler = createMouseDragHandler({
  onDown() {
    if (splitBase.value) {
      baseLeft = (props.horizontal ? 
        HtmlUtils.getLeft(splitBase.value) : 
        HtmlUtils.getTop(splitBase.value)
      );
      splitDragging.value = true;
      return true;
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if (splitBase.value) {
      let userDragSizePx = 0;
      let userDragSize = 0;

      //Real drag size
      if (props.horizontal)
        userDragSizePx = (e.x - baseLeft);
      else 
        userDragSizePx = (e.y - baseLeft);

      const limitFirst = props.firstMinSize !== 0;
      const containerSize = props.horizontal ? splitBase.value.offsetWidth : splitBase.value.offsetHeight;


      //check size limit
      let minSize = limitFirst ? props.firstMinSize : props.secondMinSize;
      if (minSize > 0 && minSize < 1)
        minSize = minSize * containerSize;

      if (minSize > 0) {
        if (limitFirst) {

          emit('closeFirst', userDragSizePx > minSize / 2); //below the minimum value, close the panel
          userDragSizePx = Math.max(userDragSizePx, minSize);

        } else {

          emit('closeSecond', containerSize - userDragSizePx > minSize / 2); //below the minimum value, close the panel
          userDragSizePx = Math.min(userDragSizePx, containerSize - minSize);

        }
      }

      //Result size in percentage
      userDragSize = (userDragSizePx / containerSize) * 100;

      emit('update:size', userDragSize);
    }
  },
  onUp() {
    splitDragging.value = false;
  },
});

</script>

<style lang="scss">
@import "../Scss/Split.scss";
</style>