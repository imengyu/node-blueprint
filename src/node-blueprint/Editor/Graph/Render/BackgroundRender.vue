<template>
  <canvas 
    ref="canvas" 
    @contextmenu="$emit('contextmenu', $event)"
  ></canvas>
</template>

<script lang="ts" setup>
import RandomUtils from '@/node-blueprint/Base/Utils/RandomUtils';
import { FPSCalculator } from './FPSCalculator';
import { onBeforeMount, onMounted, ref, type PropType } from 'vue';
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
  if(drawTick < Number.MAX_SAFE_INTEGER) drawTick++;
  else drawTick = 0;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  fpsCalculator.calculateFps();
  if(drawTick % 10 == 0) 
    drawFpsShow = "fps : " + fpsCalculator.fps.toFixed(2);
  
  if(props.gridVisible)
    renderGrid();
  if(props.drawDebugInfo) {
    props.chunkedPanel.renderDebugInfo(props.viewPort, ctx);
    renderDebugText();
  }
  renderAnimId = requestAnimationFrame(render);
}

//#region DebugText

let drawTick = 0;
let drawDebugInfoItems = new Map<number, () => string>();
let drawFpsShow = "";

function addDebugInfoItem(v : () => string) {
  const id = RandomUtils.genNonDuplicateNumber()
  drawDebugInfoItems.set(id, v);
  return id;
}
function removeDebugInfoItem(id : number) {
  drawDebugInfoItems.delete(id);
}

const fpsCalculator = new FPSCalculator();

function renderDebugText() {
  if(ctx == null) return;

  //Debug text
  if(props.drawDebugInfo){
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    
    let h = 20;
    ctx.fillText(drawFpsShow, 20, h);
    drawDebugInfoItems.forEach((k) => {
      if(ctx == null) return;
      h += 10;
      ctx.fillText(k(), 20, h);
    });
  }
}

//#endregion

//#region Grid

function renderGrid() {
  if(!ctx) return;

  const viewPort = props.viewPort;
  const startPos = viewPort.position;
  const viewPortSize = viewPort.size;
  const scaledGridSize = viewPort.scale * props.gridSize;
  const scaledStepSize = 5;

  const gridColorSmall = props.gridColorSmall;
  const gridColorBig = props.gridColorBig;

  const xStartOffset = startPos.x % scaledGridSize;
  const yStartOffset = startPos.y % scaledGridSize;

  ctx.lineWidth = 1;

  let c = Math.floor(startPos.x / scaledGridSize) % scaledStepSize;
  if(startPos.x < 0) c++;

  for(let x = -xStartOffset; x < viewPortSize.x; x += scaledGridSize, c++) {
    if(c % scaledStepSize == 0) ctx.strokeStyle = gridColorBig;
    else ctx.strokeStyle = gridColorSmall;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewPortSize.y);
    ctx.closePath();
    ctx.stroke();
  }

  c = Math.floor(startPos.y / scaledGridSize) % scaledStepSize;
  if(startPos.y < 0) c++;

  for(let y = -yStartOffset; y < viewPortSize.y; y += scaledGridSize, c++) {
    if(c % scaledStepSize == 0) ctx.strokeStyle = gridColorBig;
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

    const x = -startPos.x;
    const y = -startPos.y;

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
  addDebugInfoItem,
  removeDebugInfoItem,
});
</script>