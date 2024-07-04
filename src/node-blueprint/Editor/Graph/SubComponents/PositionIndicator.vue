<template>
  <div 
    :class="[
      'node-graph-position-pndicator',
      positionIndicatorOn ? 'on' : '',
    ]"
    @animationend="onAnimationEnd"
  >
    <div 
      :style="{
        left: `${posScreen.x}px`,
        top: `${posScreen.y}px`,
        width: `${posScreen.w}px`,
        height: `${posScreen.h}px`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { Rect } from '@/node-blueprint/Base/Utils/Base/Rect';
import { watch, type PropType } from 'vue';
import type { NodeGraphEditorInternalContext } from '../NodeGraphEditor';

const props = defineProps({
  context: {
    type: Object as PropType<NodeGraphEditorInternalContext>,
    required: true,
  },
  positionIndicatorOn: {
    type: Boolean,
    default: false,
  },
  positionIndicatorPos: {
    type: Object as PropType<Rect>,
    default: null,
  },
});

const emit = defineEmits([	
  "update:positionIndicatorOn"	
])

const posScreen = new Rect();

watch(() => props.positionIndicatorOn, (v) => {
  if (v) {
    const viewPort = props.context.getViewPort();
    posScreen.setPos(viewPort.viewportPointToEditorPoint(props.positionIndicatorPos.getPoint()));
    posScreen.setSize(viewPort.scaleViewportSizeToScreenSize(props.positionIndicatorPos.getSize()));
  }
})

function onAnimationEnd() {
  emit('update:positionIndicatorOn', false);
}

</script>

<style lang="scss">

@keyframes node-graph-position-pndicator-box-show {
  0% {
    opacity: 0;
    transform: scale(1.1);
  }
  10% {
    opacity: 1;
    transform: scale(1.1);
  }
  20% {
    transform: scale(1);
    opacity: 1;
  } 
  100% {
    opacity: 0;
  }
}

.node-graph-position-pndicator {
  position: absolute;
  pointer-events: none;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;

  &.on {
    animation: 3s ease-in-out node-graph-position-pndicator-bg-show;
    animation-iteration-count: 1;

    > div {
      animation: 3s ease-in-out node-graph-position-pndicator-box-show;
      animation-iteration-count: 1;
    }
  }

  > div {
    position: absolute;
    pointer-events: none;
    animation: none;
    border-radius: var(--mx-editor-border-radius-normal);
    border: 4px solid var(--mx-editor-outline-active-color);
    opacity: 0; 
    outline: 4000px solid var(--mx-editor-background-mask-color);
  }
}
</style>