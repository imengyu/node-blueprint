<template>
  <canvas ref="canvas" class="editorCanvas" oncontextmenu="return false" :width="viewRealSize.w" :height="viewRealSize.h">
    你的浏览器不支持 canvas，请升级你的浏览器
  </canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { Rect } from "../model/Rect";
import { Vector2 } from "../model/Vector2";
import { BlockPort } from "../model/Define/Port";

/**
 * 编辑器背景绘制控制
 */
@Component
export default class BlockEditorCanvasDrawer extends Vue {

  @Prop({default: null}) connectors : Array<ConnectorEditor>;

  ctx : CanvasRenderingContext2D = null;
  canvas : HTMLCanvasElement = null;

  drawId = 0;
  @Prop({default: false}) drawDebugInfo : boolean;
  @Prop({default: () => []}) drawDebugInfoItems : Array<{
    pos: number,
    text: string,
  }>;

  public drawStop() {
    cancelAnimationFrame(this.drawId);
  }
  public draw() {

    this.ctx.fillStyle = "rgb(93,93,93)";
	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.width);

    if(this.gridShow) 
      this.drawGrid();
    this.drawConnectors();
    this.drawMultiSelBox();

    //Debug text
    if(this.drawDebugInfo){
      this.ctx.fillStyle = "#fff";
      this.ctx.strokeStyle = "#fff";
      
      let h = 20;
      this.ctx.fillText("fps : " + this.calculateFps().toFixed(2), 30, h);
      this.drawDebugInfoItems.forEach((k) => {
        h += 10;
        this.ctx.fillText(k.text, k.pos, h);
      });
    }

    this.drawId = requestAnimationFrame(this.draw);
  }

  lastTime = 0;

  calculateFps() {
    var now = (+new Date), fps = 1000/(now - this.lastTime);
    this.lastTime = now;
    return fps;
  }

  @Prop({default: null}) viewPort : Rect;
  @Prop({default: 1}) viewZoom : number;
  @Prop({default: 100}) viewScale: number;
  @Prop({default: () => { return { w: 0, h: 0 } } }) viewRealSize : { w: number, h: number };
  @Prop({default: false}) isConnecting : boolean;
  @Prop({default: false}) isMultiSelecting : boolean;
  @Prop({default: null}) connectingEndPos : Vector2;
  @Prop({default: null}) connectingStartPort : BlockPort;
  @Prop({default: false}) connectingIsFail : boolean;
  @Prop({default: null}) connectingConnector : ConnectorEditor;
  @Prop({default: null}) multiSelectRect : Rect;

  @Prop({default: true}) gridShow : boolean;
  @Prop({default: 20}) gridSize : number;

  private drawGrid() {
    
    let showGridSize = this.viewZoom * this.gridSize;
    let gridOffx = this.viewPort.x % showGridSize;
    let gridOffy = this.viewPort.y % showGridSize;
    let count = 0;

    this.ctx.lineWidth = 0.5;
    this.ctx.strokeStyle = "rgb(52,52,52)";

    count = Math.floor(this.viewPort.x / showGridSize) ;

    for(let i = -gridOffx,
        end = i + this.viewRealSize.w; i <= end;i += showGridSize) {

      count++;

      if(count % 5 == 0) this.ctx.strokeStyle = "rgb(22,22,22)";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "rgb(52,52,52)";

      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.viewRealSize.h);
      this.ctx.closePath();
      this.ctx.stroke();


    }
    count = Math.floor(this.viewPort.y / showGridSize);

    this.ctx.strokeStyle = "rgb(52,52,52)";

    for(let i = -gridOffy, end = i + this.viewRealSize.h; i <= end;i += showGridSize) {

      count++; 

      if(count % 5 == 0) this.ctx.strokeStyle = "rgb(22,22,22)";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "rgb(52,52,52)";

      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.viewRealSize.w, i);
      this.ctx.closePath();
      this.ctx.stroke();      
    }

  }
  private drawMultiSelBox() {
    if(this.isMultiSelecting) {
      this.ctx.fillStyle = "rgba(36, 114, 200, 0.4)";
      this.ctx.fillRect(this.multiSelectRect.x - this.viewPort.x, this.multiSelectRect.y - this.viewPort.y, this.multiSelectRect.w, this.multiSelectRect.h);
      this.ctx.strokeStyle = "rgba(79, 184, 254)";
      this.ctx.strokeRect(this.multiSelectRect.x, this.multiSelectRect.y, this.multiSelectRect.w, this.multiSelectRect.h)
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