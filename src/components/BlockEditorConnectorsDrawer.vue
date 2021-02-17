<template>
  <canvas ref="canvas" class="flow-block-connectors-drawer" 
    @contextmenu="onContextMenu($event)" 
    :width="viewRealSize.w" :height="viewRealSize.h">
    你的浏览器不支持 canvas，请升级你的浏览器
  </canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { Rect } from "../model/Rect";
import { Vector2 } from "../model/Vector2";
import { BlockPort } from "../model/Define/Port";
import { BlockPortEditor, BlockPortEditorDataFake } from "../model/Editor/BlockPortEditor";

/**
 * 编辑器背景绘制控制
 */
@Component({
  name: 'BlockEditorConnectorsDrawer'
})
export default class BlockEditorConnectorsDrawer extends Vue {

  @Prop({default: null}) connectors : Array<ConnectorEditor>;

  ctx : CanvasRenderingContext2D = null;
  canvas : HTMLCanvasElement = null;

  drawId = 0;

  public drawStop() {
    cancelAnimationFrame(this.drawId);
  }
  public draw() {

	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.width);
    this.drawConnectors();
    this.drawId = requestAnimationFrame(this.draw);
  }

  @Prop({default: null}) viewPort : Rect;
  @Prop({default: 1}) viewZoom : number;
  @Prop({default: 100}) viewScale: number;
  @Prop({default: () => { return { w: 0, h: 0 } } }) viewRealSize : { w: number, h: number };
  @Prop({default: false}) isConnecting : boolean;
  @Prop({default: null}) connectingEndPos : Vector2;
  @Prop({default: null}) connectingStartPort : BlockPortEditor;
  @Prop({default: false}) connectingIsFail : boolean;
  @Prop({default: false}) drawDebugInfo : boolean;

  @Watch('viewRealSize')
  onViewRealSizeChanged() {
    if(this.canvas != null) {
      this.canvas.width = this.viewRealSize.w;
      this.canvas.height = this.viewRealSize.h;
    }
  }

  //用于绘制鼠标连接的连接线实例
  private connectingConnector = new ConnectorEditor();
  private connectingConnectorPortMoveable : BlockPortEditor = null;
  private connectingConnectorPortMoveableFakeEditorData : BlockPortEditorDataFake = null;

  //绘制连接线
  private drawConnectors() {
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 1.5;

    if(this.connectors)
      this.connectors.forEach(element => element.draw(this.ctx, this.viewPort, this.viewZoom));

    if(this.isConnecting && this.connectingConnector != null) {
      if(this.connectingIsFail) this.ctx.strokeStyle = "#e9412a";
      else this.ctx.strokeStyle = "#efefef";

      this.connectingConnector.startPort = this.connectingStartPort;
      if(this.connectingStartPort.direction == 'input') {
        this.connectingConnectorPortMoveableFakeEditorData.setPosition(this.connectingEndPos);
        this.connectingConnector.startPort = this.connectingConnectorPortMoveable;
        this.connectingConnector.endPort = this.connectingStartPort;
      }
      else if(this.connectingStartPort.direction == 'output') {
        this.connectingConnectorPortMoveableFakeEditorData.setPosition(this.connectingEndPos);
        this.connectingConnector.startPort = this.connectingStartPort;
        this.connectingConnector.endPort = this.connectingConnectorPortMoveable;
      }
      
      this.connectingConnector.draw(this.ctx, this.viewPort, this.viewZoom);
    }
  }

  private onContextMenu(e : MouseEvent) {
    e.preventDefault();
    this.$emit('contextmenu', e);
    return false;
  }

  mounted() {

    this.connectingConnectorPortMoveable = new BlockPortEditor(null);
    this.connectingConnectorPortMoveableFakeEditorData = new BlockPortEditorDataFake();
    this.connectingConnectorPortMoveable.editorData = this.connectingConnectorPortMoveableFakeEditorData

    setTimeout(() => {
      this.canvas = (<HTMLCanvasElement>this.$refs.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = 'left';
      this.ctx.font = 'Arial 14px';
      this.draw();
    }, 300);
  }
  beforeDestroy() {
    this.drawStop();
  }
}

</script>