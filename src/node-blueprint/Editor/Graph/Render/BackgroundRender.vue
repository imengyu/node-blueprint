<template>
  <canvas 
    ref="canvas" 
    @contextmenu="$emit('contextmenu', $event)"
  />
</template>

<script lang="ts" setup>
import { onBeforeMount, onMounted, ref, type PropType } from 'vue';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodeGraphEditorViewport } from '../NodeGraphEditor';
import type { ChunkedPanel } from '../Cast/ChunkedPanel';

let ctx : CanvasRenderingContext2D|null = null;
let renderAnimId = 0;

const canvas = ref<HTMLCanvasElement>();
const props = defineProps({
  /**
   * 编辑器的视口
   */
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
  chunkedPanel: {
    type: Object as PropType<ChunkedPanel>,
    default: null,
  },
  drawDebugInfo: {
    type: Boolean,
    default: false,
  },
  gridVisible: {
    type: Boolean,
    default: true,
  },
  gridSize: {
    type: Number,
    default: 20,
  },
  gridColorSmall: {
    type: String,
    default: "#23282e",
  },
  gridColorBig: {
    type: String,
    default: "#1b2026",
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
onBeforeMount(() => {
  cancelAnimationFrame(renderAnimId);
});

function render() {
  if(!ctx) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if(props.gridVisible)
    renderGrid();
  renderAnimId = requestAnimationFrame(render);
}

//#region Grid

const postSizeTemp = new Vector2();

function renderGrid() {
  if(!ctx) return;

  const viewPort = props.viewPort;
  const viewPortSize = viewPort.size;
  const scaledGridSize = viewPort.scaleViewportSizeToScreenSize(props.gridSize);
  const scaledStepSize = 5;

  postSizeTemp.set(viewPort.position);
  viewPort.scaleViewportSizeToScreenSize(postSizeTemp);

  const gridColorSmall = props.gridColorSmall;
  const gridColorBig = props.gridColorBig;

  const xStartOffset = postSizeTemp.x % scaledGridSize;
  const yStartOffset = postSizeTemp.y % scaledGridSize;

  ctx.lineWidth = 1;

  let c = Math.floor(postSizeTemp.x / scaledGridSize) % scaledStepSize;
  if(postSizeTemp.x < 0) c++;

  for(let x = -xStartOffset; x < viewPortSize.x; x += scaledGridSize, c++) {
    if(c % scaledStepSize === 0) ctx.strokeStyle = gridColorBig;
    else ctx.strokeStyle = gridColorSmall;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewPortSize.y);
    ctx.closePath();
    ctx.stroke();
  }

  c = Math.floor(postSizeTemp.y / scaledGridSize) % scaledStepSize;
  if(postSizeTemp.y < 0) c++;

  for(let y = -yStartOffset; y < viewPortSize.y; y += scaledGridSize, c++) {
    if(c % scaledStepSize === 0) ctx.strokeStyle = gridColorBig;
    else ctx.strokeStyle = gridColorSmall;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewPortSize.x, y);
    ctx.closePath();
    ctx.stroke();      
  }

  //Draw xy debug line
  if (props.drawDebugInfo) {
    ctx.lineWidth = 4;

    const x = -postSizeTemp.x;
    const y = -postSizeTemp.y;

    if (x >= 0 && x <= viewPortSize.x) {
      ctx.strokeStyle = '#0f0';

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewPortSize.y);
      ctx.closePath();
      ctx.stroke();
    }
    if (y >= 0 && y <= viewPortSize.y) {
      ctx.strokeStyle = '#f00';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(viewPortSize.x, y);
      ctx.closePath();
      ctx.stroke();
    }

  }
}

//#endregion

defineEmits([ 'contextmenu' ])

defineExpose({
  onWindowSizeChanged(x: number, y: number) {
    if(canvas.value) {
      canvas.value.width = x;
      canvas.value.height = y;
    }
  },
});
</script>