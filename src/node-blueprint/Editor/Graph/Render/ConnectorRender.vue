<template>
  <canvas 
    ref="canvas" 
    @contextmenu="$emit('contextmenu', $event)"
  ></canvas>
</template>

<script lang="ts" setup>
import type { Rect } from '@/node-blueprint/Base/Utils/Base/Rect';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import { onBeforeUnmount, onMounted, ref, type PropType } from 'vue';
import type { NodeGraphEditorViewport } from '../NodeGraphEditor';

let ctx : CanvasRenderingContext2D|null = null;
let renderAnimId = 0;

const canvas = ref<HTMLCanvasElement>();
const props = defineProps({
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
  multiSelectRect: {
    type: Object as PropType<Rect>,
    required: true,
  },
  isMulitSelect: {
    type: Boolean,
    default: false,
  },
});

onMounted(() => {
  if(canvas.value)
    ctx = canvas.value.getContext('2d');
  if(ctx) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = 'Arial 14px';
  }
  renderAnimId = requestAnimationFrame(render);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(renderAnimId);
});

const retPos = new Vector2();
const retSize = new Vector2();

function render() {
  if(!ctx) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  if (props.isMulitSelect) {
    props.viewPort.viewportPointToScreenPoint(props.multiSelectRect.getPoint(), retPos);
    retSize.set(props.multiSelectRect.w, props.multiSelectRect.h);
    props.viewPort.scaleViewportSizeToScreenSize(retSize);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#e79d00";
    ctx.strokeRect(
      retPos.x, 
      retPos.y, 
      retSize.x, 
      retSize.y);
    ctx.fillStyle = "rgba(230, 157, 0, 0.3)";
    ctx.fillRect(
      retPos.x, 
      retPos.y, 
      retSize.x,
      retSize.y
    );
  }

  

  renderAnimId = requestAnimationFrame(render);
}

defineEmits([ 'contextmenu' ]);

defineExpose({
  onWindowSizeChanged(x: number, y: number) {
    if(canvas.value) {
      canvas.value.width = x;
      canvas.value.height = y;
    }
  },
})

</script>