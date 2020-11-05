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
import { BlockPortEditor } from "../model/Editor/BlockPortEditor";

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
  @Prop({default: null}) connectingConnector : ConnectorEditor;
  @Prop({default: false}) drawDebugInfo : boolean;

  @Watch('viewRealSize')
  onViewRealSizeChanged() {
    if(this.canvas != null) {
      this.canvas.width = this.viewRealSize.w;
      this.canvas.height = this.viewRealSize.h;
    }
  }

  private drawConnectors() {
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 1.5;

    if(this.connectors)
      this.connectors.forEach(element => {
        element.drawPos = this.drawDebugInfo;
        element.draw(this.ctx, this.viewPort, this.viewZoom);
      });

    if(this.isConnecting && this.connectingConnector != null) {
      if(this.connectingIsFail) this.ctx.strokeStyle = "#e9412a";
      else this.ctx.strokeStyle = "#efefef";

      this.connectingConnector.startPort = this.connectingStartPort;
      if(this.connectingStartPort.direction == 'input') 
        this.connectingConnector.drawLineInPos(this.ctx, this.viewPort, this.viewZoom, this.connectingEndPos, this.connectingStartPort.editorData.getPosition());
      else if(this.connectingStartPort.direction == 'output')
        this.connectingConnector.drawLineInPos(this.ctx, this.viewPort, this.viewZoom, this.connectingStartPort.editorData.getPosition(), this.connectingEndPos);
      
    }
  }

  private onContextMenu(e : MouseEvent) {
    e.preventDefault();
    this.$emit('contextmenu', e);
    return false;
  }

  mounted() {
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