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
import type { IConnectingInfo } from '../Editor/EditorConnectorController';
import type { NodeConnectorEditor } from '../Flow/NodeConnectorEditor';
import type { ChunkedPanel } from '../Cast/ChunkedPanel';
import { ConnectorDrawer } from './ConnectorDrawer';
import type { NodePortEditor } from '../Flow/NodePortEditor';

let ctx : CanvasRenderingContext2D|null = null;
let renderAnimId = 0;

const canvas = ref<HTMLCanvasElement>();
const props = defineProps({
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
  chunkedPanel: {
    type: Object as PropType<ChunkedPanel>,
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
  connectingInfo: {
    type: Object as PropType<IConnectingInfo>,
    default: null,
  },
  connectors: {
    type: Object as PropType<Map<string, NodeConnectorEditor>>,
    default: null,
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
const drawerConnectingConnector = new ConnectorDrawer();
const tempPoint1 = new Vector2();
const tempPoint2 = new Vector2();

function render() {
  if(!ctx) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  //绘制多选框
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

  //绘制拖拽中连接线
  if (props.connectingInfo) {
    const _connectingInfo = props.connectingInfo;
    const _startPort = _connectingInfo.startPort as NodePortEditor;
    const _viewPort = props.viewPort;
    if(_connectingInfo.isConnecting && _startPort && !_connectingInfo.isSamePort) {
      const startPos = _startPort.direction === 'output' ? _startPort.getPortPositionViewport() : _connectingInfo.endPos;
      const endPos = _startPort.direction === 'output' ? _connectingInfo.endPos : _startPort.getPortPositionViewport();

      _viewPort.viewportPointToScreenPoint(startPos, tempPoint1);
      _viewPort.viewportPointToScreenPoint(endPos, tempPoint2);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#efefef';
      ctx.fillStyle = ctx.strokeStyle;

      drawerConnectingConnector.drawConnectorBezierCurve(ctx, tempPoint1.x, tempPoint1.y, tempPoint2.x, tempPoint2.y, true, -1, false);
    }
  }

  //绘制连接线
  if (props.connectors) {
    //从区块检测器中选出当前显示在屏幕中的连接
    const instances = props.chunkedPanel.testRectCastTag(props.viewPort.rect(), 'connector');
    const _viewPort = props.viewPort;
    for (let i = 0; i < instances.length; i++) {
      const connector = props.connectors.get(instances[i].data as string);
      if(connector)
        connector.render(_viewPort, ctx);
    }
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